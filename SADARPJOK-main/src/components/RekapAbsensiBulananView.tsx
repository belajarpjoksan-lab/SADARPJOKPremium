import React, { useState, useMemo } from 'react';
import { ClassData, Student } from '../types';
import { 
  Calendar, 
  FileSpreadsheet, 
  Printer, 
  FileDown, 
  Check, 
  Sparkles, 
  RotateCcw, 
  Settings, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { exportRekapBulananToDoc, downloadDocFile, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getAbsensiPenilaianPrompts } from '../utils/aiPromptGenerators';

interface RekapAbsensiBulananViewProps {
  activeClass: ClassData;
  onUpdateStudents: (classId: string, students: Student[]) => void;
}

const BULAN_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
];

const HARI_INITIALS = ['Mg', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'];

export default function RekapAbsensiBulananView({
  activeClass,
  onUpdateStudents
}: RekapAbsensiBulananViewProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  // Institutional & Signature Metadata
  const [namaSekolah, setNamaSekolah] = useState('SD NEGERI KALIMANTONG');
  const [namaGuru, setNamaGuru] = useState('Ahmad Rafsanjani, S.Pd.');
  const [nipGuru, setNipGuru] = useState('19880512 201503 1 002');
  const [namaKepalaSekolah, setNamaKepalaSekolah] = useState('H. Muhammad Nur, M.Pd.');
  const [nipKepalaSekolah, setNipKepalaSekolah] = useState('19750814 199903 1 004');
  const [kota, setKota] = useState('Kalimantong');

  const [showSettings, setShowSettings] = useState(false);
  const [isExportedDoc, setIsExportedDoc] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);

  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const namaBulan = useMemo(() => {
    return BULAN_OPTIONS.find(b => b.value === selectedMonth)?.label || 'Bulan';
  }, [selectedMonth]);

  const tahunAjaran = useMemo(() => {
    return selectedMonth >= 7 
      ? `${selectedYear}/${selectedYear + 1}` 
      : `${selectedYear - 1}/${selectedYear}`;
  }, [selectedMonth, selectedYear]);

  // Days array metadata
  const daysMeta = useMemo(() => {
    const list = [];
    const bulanIdx = selectedMonth - 1;
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = String(d).padStart(2, '0');
      const mStr = String(selectedMonth).padStart(2, '0');
      const dateKey = `${selectedYear}-${mStr}-${dStr}`;
      const dt = new Date(selectedYear, bulanIdx, d);
      const dayOfWeek = dt.getDay();
      list.push({
        day: d,
        dateKey,
        isSunday: dayOfWeek === 0,
        isSaturday: dayOfWeek === 6,
        initial: HARI_INITIALS[dayOfWeek]
      });
    }
    return list;
  }, [selectedYear, selectedMonth, daysInMonth]);

  const effectiveDaysCount = useMemo(() => {
    return daysMeta.filter(d => !d.isSunday).length;
  }, [daysMeta]);

  // Quick Notification Helper
  const triggerNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Toggle Attendance Cell
  const handleToggleCell = (studentId: string, dateKey: string, isSunday: boolean) => {
    if (isSunday) return;
    const student = activeClass.students.find(s => s.id === studentId);
    if (!student) return;

    const currentStatus = student.attendance?.[dateKey];
    let nextStatus: 'H' | 'S' | 'I' | 'A' | undefined;

    if (!currentStatus) nextStatus = 'H';
    else if (currentStatus === 'H') nextStatus = 'S';
    else if (currentStatus === 'S') nextStatus = 'I';
    else if (currentStatus === 'I') nextStatus = 'A';
    else nextStatus = undefined;

    const updatedStudents = activeClass.students.map(s => {
      if (s.id === studentId) {
        const nextAttendance = { ...s.attendance };
        if (nextStatus) {
          nextAttendance[dateKey] = nextStatus;
        } else {
          delete nextAttendance[dateKey];
        }
        return { ...s, attendance: nextAttendance };
      }
      return s;
    });

    onUpdateStudents(activeClass.id, updatedStudents);
  };

  // Quick Action: Fill All Effective Weekdays with 'H' (if empty)
  const handleFillEffectiveHadir = () => {
    if (!activeClass.students.length) return;
    const updatedStudents = activeClass.students.map(s => {
      const nextAtt = { ...s.attendance };
      daysMeta.forEach(dm => {
        if (!dm.isSunday && !nextAtt[dm.dateKey]) {
          nextAtt[dm.dateKey] = 'H';
        }
      });
      return { ...s, attendance: nextAtt };
    });

    onUpdateStudents(activeClass.id, updatedStudents);
    triggerNotification(`Berhasil mengisi otomatis status Hadir (H) untuk semua hari efektif bulan ${namaBulan}!`);
  };

  // Quick Action: Mark All Effective Days for Single Student
  const handleSetStudentAllHadir = (studentId: string) => {
    const updatedStudents = activeClass.students.map(s => {
      if (s.id === studentId) {
        const nextAtt = { ...s.attendance };
        daysMeta.forEach(dm => {
          if (!dm.isSunday) {
            nextAtt[dm.dateKey] = 'H';
          }
        });
        return { ...s, attendance: nextAtt };
      }
      return s;
    });

    onUpdateStudents(activeClass.id, updatedStudents);
    triggerNotification('Status Hadir penuh berhasil diterapkan untuk siswa terpilih.');
  };

  // Quick Action: Generate Realistic Sample Attendance
  const handleAutoSimulateAttendance = () => {
    if (!activeClass.students.length) return;
    const updatedStudents = activeClass.students.map((s, idx) => {
      const nextAtt = { ...s.attendance };
      daysMeta.forEach((dm, dIdx) => {
        if (dm.isSunday) return;

        // Pseudo-random realistic distribution based on index & day
        const seed = (idx * 17 + dIdx * 23 + selectedMonth * 7) % 100;
        if (seed < 92) {
          nextAtt[dm.dateKey] = 'H';
        } else if (seed < 96) {
          nextAtt[dm.dateKey] = 'S';
        } else if (seed < 99) {
          nextAtt[dm.dateKey] = 'I';
        } else {
          nextAtt[dm.dateKey] = 'A';
        }
      });
      return { ...s, attendance: nextAtt };
    });

    onUpdateStudents(activeClass.id, updatedStudents);
    triggerNotification(`Data presensi realistis berhasil digenerate untuk bulan ${namaBulan} ${selectedYear}!`);
  };

  // Quick Action: Clear Month Attendance
  const handleResetMonthAttendance = () => {
    if (!window.confirm(`Yakin ingin mengosongkan rekapan absensi bulan ${namaBulan} ${selectedYear}?`)) {
      return;
    }
    const mStr = String(selectedMonth).padStart(2, '0');
    const prefix = `${selectedYear}-${mStr}-`;

    const updatedStudents = activeClass.students.map(s => {
      const nextAtt: { [k: string]: 'H' | 'S' | 'I' | 'A' } = {};
      Object.entries(s.attendance || {}).forEach(([k, v]) => {
        if (!k.startsWith(prefix)) {
          nextAtt[k] = v;
        }
      });
      return { ...s, attendance: nextAtt };
    });

    onUpdateStudents(activeClass.id, updatedStudents);
    triggerNotification(`Data absensi bulan ${namaBulan} ${selectedYear} telah direset.`);
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const buildRekapBulananHtml = () => {
    if (!activeClass) return '';
    return exportRekapBulananToDoc(activeClass, {
      bulan: selectedMonth,
      tahun: selectedYear,
      namaSekolah,
      namaGuru,
      nipGuru,
      namaKepalaSekolah,
      nipKepalaSekolah,
      kota
    });
  };

  // Export to Word Document (.doc)
  const handleExportDoc = () => {
    if (!activeClass) return;
    const docContent = buildRekapBulananHtml();
    const filename = `Rekap_Absensi_F4_${activeClass.name.replace(/\s+/g, '_')}_${namaBulan}_${selectedYear}`;
    downloadDocFile(filename, docContent);
    setIsExportedDoc(true);
    triggerNotification('Dokumen Word (.doc) F4 berhasil diunduh dan siap dibuka di Microsoft Word!');
    setTimeout(() => setIsExportedDoc(false), 3000);
  };

  // Export to F4 Landscape PDF
  const handleExportPdf = async () => {
    if (!activeClass || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docContent = buildRekapBulananHtml();
      const filename = `Rekap_Absensi_F4_${activeClass.name.replace(/\s+/g, '_')}_${namaBulan}_${selectedYear}.pdf`;
      const success = await downloadHtmlAsPdf(filename, docContent, {
        orientation: 'landscape',
        marginMm: 10
      });
      if (success) {
        triggerNotification('Dokumen PDF (F4 Landscape) berhasil diunduh dan siap dicetak!');
      } else {
        printHtmlDocument(docContent, `Rekap Absensi F4 - ${activeClass.name}`, 'landscape');
      }
    } catch (err) {
      console.error('Error generating Rekap Bulanan F4 PDF:', err);
      printHtmlDocument(buildRekapBulananHtml(), `Rekap Absensi F4 - ${activeClass.name}`, 'landscape');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Direct Print F4 Landscape
  const handlePrint = () => {
    if (!activeClass) return;
    printHtmlDocument(buildRekapBulananHtml(), `Rekap Absensi F4 - ${activeClass.name} (${namaBulan} ${selectedYear})`, 'landscape');
  };

  // Computations for Table & Stats
  const dailyTotals = useMemo(() => {
    const H = new Array(daysInMonth).fill(0);
    const S = new Array(daysInMonth).fill(0);
    const I = new Array(daysInMonth).fill(0);
    const A = new Array(daysInMonth).fill(0);

    activeClass.students.forEach(st => {
      daysMeta.forEach((dm, idx) => {
        const val = st.attendance?.[dm.dateKey];
        if (val === 'H') H[idx]++;
        else if (val === 'S') S[idx]++;
        else if (val === 'I') I[idx]++;
        else if (val === 'A') A[idx]++;
      });
    });

    return { H, S, I, A };
  }, [activeClass.students, daysMeta, daysInMonth]);

  const studentStats = useMemo(() => {
    let grandH = 0;
    let grandS = 0;
    let grandI = 0;
    let grandA = 0;

    const list = activeClass.students.map(st => {
      let h = 0, s = 0, i = 0, a = 0;
      daysMeta.forEach(dm => {
        const val = st.attendance?.[dm.dateKey];
        if (val === 'H') h++;
        else if (val === 'S') s++;
        else if (val === 'I') i++;
        else if (val === 'A') a++;
      });

      grandH += h;
      grandS += s;
      grandI += i;
      grandA += a;

      const totalRecorded = h + s + i + a;
      const base = totalRecorded > 0 ? totalRecorded : effectiveDaysCount;
      const percent = base > 0 ? Math.round((h / base) * 100) : 100;

      return { student: st, h, s, i, a, percent };
    });

    const totalStudents = activeClass.students.length || 1;
    const totalPossible = totalStudents * effectiveDaysCount;
    const avgPercent = totalPossible > 0 
      ? Math.round((grandH / (grandH + grandS + grandI + grandA || totalPossible)) * 100) 
      : 100;

    return {
      rows: list,
      grandH,
      grandS,
      grandI,
      grandA,
      avgPercent
    };
  }, [activeClass.students, daysMeta, effectiveDaysCount]);

  const boysCount = activeClass.students.filter(s => s.gender === 'L').length;
  const girlsCount = activeClass.students.filter(s => s.gender === 'P').length;

  const handleToggleGender = (studentId: string) => {
    const updated = activeClass.students.map(s => {
      if (s.id === studentId) {
        return { ...s, gender: (s.gender === 'L' ? 'P' : 'L') as 'L' | 'P' };
      }
      return s;
    });
    onUpdateStudents(activeClass.id, updated);
  };

  return (
    <div className="space-y-6">
      {/* Landscape Print Helper Styling (F4 330mm x 215mm) */}
      <style>{`
        @media print {
          @page {
            size: 330mm 215mm;
            margin: 0.8cm;
          }
          .rekap-print-table th, .rekap-print-table td {
            padding: 2px 1px !important;
            font-size: 7pt !important;
          }
        }
      `}</style>

      {/* ACTION & FILTER CONTROL BAR (NO-PRINT) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-800">
                Rekap Absensi Bulanan &bull; {activeClass.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Format matriks absensi bulanan resmi 1 s.d. {daysInMonth} hari, rekapitulasi otomatis, ekspor dokumen Word (.doc) dan siap cetak.
            </p>
          </div>

          {/* Export & Print Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <ExportJsonPromptAiButtons
              variant="compact"
              onExportJson={() => {
                const filename = `Rekap_Absensi_Bulanan_${activeClass.name.replace(/\s+/g, '_')}_${namaBulan}_${selectedYear}.json`;
                downloadJsonFile(filename, {
                  kelas: activeClass.name,
                  bulan: namaBulan,
                  tahun: selectedYear,
                  sekolah: namaSekolah,
                  guru: namaGuru,
                  nipGuru,
                  siswa: activeClass.students
                });
              }}
              onOpenPromptAi={() => setShowPromptModal(true)}
            />

            <button
              type="button"
              onClick={handleExportDoc}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              title="Unduh file Microsoft Word (.doc) ukuran F4 yang rapi dan siap diedit/cetak"
            >
              {isExportedDoc ? <Check className="w-4 h-4 text-emerald-200" /> : <FileDown className="w-4 h-4" />}
              <span>{isExportedDoc ? 'Tersimpan!' : 'Unduh Word (.doc)'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Unduh file PDF ukuran F4 Landscape rapi siap cetak"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF (F4)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Cetak langsung ke printer dengan ukuran F4 Landscape"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak F4</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 border rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                showSettings ? 'bg-slate-100 border-slate-400 text-slate-800' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-600'
              }`}
              title="Pengaturan Kop Sekolah & Lembar Pengesahan Tanda Tangan"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Kop & TTD</span>
              {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Secondary Filter & Batch Tool Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Periode:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 bg-white focus:ring-1 focus:ring-emerald-500"
            >
              {BULAN_OPTIONS.map(b => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 bg-white focus:ring-1 focus:ring-emerald-500"
            >
              {[2024, 2025, 2026, 2027, 2028].map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>

            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-semibold">
              T.A. {tahunAjaran} &bull; {effectiveDaysCount} Hari Efektif
            </span>
          </div>

          {/* Fast Batch Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleFillEffectiveHadir}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Isi otomatis status 'H' untuk semua hari kerja (Senin-Jumat) yang masih kosong"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Isi Hadir Efektif</span>
            </button>

            <button
              type="button"
              onClick={handleAutoSimulateAttendance}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Isi data simulasi realistis (90-100% kehadiran) agar siap dicetak langsung"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Simulasi Otomatis</span>
            </button>

            <button
              type="button"
              onClick={handleResetMonthAttendance}
              className="bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Kosongkan rekapitulasi absensi bulan ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Bulan Ini</span>
            </button>
          </div>
        </div>

        {/* Action Toast Feedback */}
        {actionSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2 transition-all">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Expandable Settings: Kop & TTD */}
        {showSettings && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-slate-500" />
                Pengaturan Kop Sekolah & Lembar Tanda Tangan Cetak
              </span>
              <span className="text-[11px] text-slate-500">Data otomatis diterapkan pada dokumen Word (.doc) dan hasil cetak PDF</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Satuan Pendidikan / Sekolah</label>
                <input
                  type="text"
                  value={namaSekolah}
                  onChange={(e) => setNamaSekolah(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium text-slate-800"
                  placeholder="e.g. SD NEGERI KALIMANTONG"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kota / Tempat Terbit</label>
                <input
                  type="text"
                  value={kota}
                  onChange={(e) => setKota(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium text-slate-800"
                  placeholder="e.g. Kalimantong"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Guru Kelas / PJOK</label>
                <input
                  type="text"
                  value={namaGuru}
                  onChange={(e) => setNamaGuru(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium text-slate-800"
                  placeholder="e.g. Ahmad Rafsanjani, S.Pd."
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIP Guru Pengampu</label>
                <input
                  type="text"
                  value={nipGuru}
                  onChange={(e) => setNipGuru(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium text-slate-800"
                  placeholder="e.g. 19880512 201503 1 002"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Kepala Sekolah</label>
                <input
                  type="text"
                  value={namaKepalaSekolah}
                  onChange={(e) => setNamaKepalaSekolah(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium text-slate-800"
                  placeholder="e.g. H. Muhammad Nur, M.Pd."
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={nipKepalaSekolah}
                  onChange={(e) => setNipKepalaSekolah(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium text-slate-800"
                  placeholder="e.g. 19750814 199903 1 004"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUMMARY STATS TILES (NO-PRINT) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Siswa</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-slate-800">{activeClass.students.length}</span>
            <span className="text-[11px] text-slate-500 font-medium">({boysCount}L/{girlsCount}P)</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rerata Kehadiran</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-xl font-black ${
              studentStats.avgPercent >= 85 ? 'text-emerald-700' : studentStats.avgPercent >= 75 ? 'text-amber-700' : 'text-rose-700'
            }`}>
              {studentStats.avgPercent}%
            </span>
          </div>
        </div>

        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Akumulasi Hadir (H)</span>
          <span className="text-xl font-black text-emerald-700 mt-0.5 block">{studentStats.grandH}</span>
        </div>

        <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Akumulasi Sakit (S)</span>
          <span className="text-xl font-black text-blue-700 mt-0.5 block">{studentStats.grandS}</span>
        </div>

        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Akumulasi Izin (I)</span>
          <span className="text-xl font-black text-amber-700 mt-0.5 block">{studentStats.grandI}</span>
        </div>

        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Akumulasi Alpa (A)</span>
          <span className="text-xl font-black text-rose-700 mt-0.5 block">{studentStats.grandA}</span>
        </div>
      </div>

      {/* QUICK INSTRUCTION HINT BAR (NO-PRINT) */}
      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs text-slate-600 no-print">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            <strong>Panduan Interaktif:</strong> Klik pada sel tanggal untuk mengganti status: 
            <span className="inline-block mx-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">H</span> &rarr;
            <span className="inline-block mx-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">S</span> &rarr;
            <span className="inline-block mx-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">I</span> &rarr;
            <span className="inline-block mx-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">A</span> &rarr; Kosong.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-200 border border-rose-300"></span> Minggu (L)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-300"></span> Sabtu</span>
        </div>
      </div>

      {/* MAIN PRINT-READY REKAPITULASI MATRIKS TABLE CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 print:p-0 print:border-none print:shadow-none">
        
        {/* PRINT KOP & HEADER (VISIBLE ON PRINT & SCREEN) */}
        <div className="text-center pb-4 mb-4 border-b-2 border-slate-800">
          <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
            {namaSekolah}
          </h3>
          <h1 className="text-base sm:text-xl font-black text-slate-900 uppercase tracking-tight mt-0.5">
            REKAPITULASI PRESENSI / ABSENSI SISWA BULANAN
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1">
            BULAN: {namaBulan.toUpperCase()} {selectedYear} &bull; TAHUN AJARAN {tahunAjaran}
          </p>
        </div>

        {/* IDENTITAS KELAS INFO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700 mb-4 pb-3 border-b border-slate-200">
          <div className="space-y-1">
            <p><strong>Rombongan Belajar:</strong> {activeClass.name}</p>
            <p><strong>Jenjang / Fase:</strong> Kelas {activeClass.grade} SD (Fase {activeClass.grade <= 2 ? 'A' : activeClass.grade <= 4 ? 'B' : 'C'})</p>
          </div>
          <div className="space-y-1">
            <p><strong>Mata Pelajaran:</strong> PJOK / Tematik Terpadu</p>
            <p><strong>Jumlah Murid:</strong> {activeClass.students.length} Siswa ({boysCount} L / {girlsCount} P)</p>
          </div>
          <div className="space-y-1 sm:text-right">
            <p><strong>Hari Efektif Belajar:</strong> {effectiveDaysCount} Hari</p>
            <p><strong>Rerata Kehadiran Kelas:</strong> <span className="font-bold text-emerald-700">{studentStats.avgPercent}%</span></p>
          </div>
        </div>

        {/* SCROLLABLE TABLE WRAPPER */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-slate-800 text-[11px] rekap-print-table">
            <thead>
              <tr className="bg-slate-800 text-white font-bold text-center">
                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center w-8">No</th>
                <th rowSpan={2} className="border border-slate-300 px-3 py-2 text-left min-w-[130px]">Nama Peserta Didik</th>
                <th rowSpan={2} className="border border-slate-300 px-1 py-2 text-center w-8">L/P</th>
                <th colSpan={daysInMonth} className="border border-slate-300 px-1 py-1.5 text-center font-bold tracking-wide">
                  TANGGAL BULAN {namaBulan.toUpperCase()} {selectedYear}
                </th>
                <th colSpan={4} className="border border-slate-300 px-1 py-1 text-center font-bold">REKAP</th>
                <th rowSpan={2} className="border border-slate-300 px-1.5 py-2 text-center w-10">%</th>
                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center w-14 no-print">Aksi</th>
              </tr>
              <tr className="bg-slate-700 text-white text-[10px]">
                {daysMeta.map(dm => {
                  const isSun = dm.isSunday;
                  const isSat = dm.isSaturday;
                  return (
                    <th 
                      key={dm.day}
                      className={`border border-slate-300 px-0.5 py-1 text-center min-w-[20px] ${
                        isSun ? 'bg-rose-600 text-white font-black' : isSat ? 'bg-slate-600 text-slate-200' : 'bg-slate-700'
                      }`}
                      title={`${dm.day} ${namaBulan} (${dm.initial})`}
                    >
                      <div className="font-bold text-[10px] leading-tight">{dm.day}</div>
                      <div className="text-[8px] font-normal opacity-90">{dm.initial}</div>
                    </th>
                  );
                })}
                <th className="border border-slate-300 px-1 py-1 text-center bg-emerald-800 text-white font-bold w-6">H</th>
                <th className="border border-slate-300 px-1 py-1 text-center bg-blue-800 text-white font-bold w-6">S</th>
                <th className="border border-slate-300 px-1 py-1 text-center bg-amber-800 text-white font-bold w-6">I</th>
                <th className="border border-slate-300 px-1 py-1 text-center bg-rose-800 text-white font-bold w-6">A</th>
              </tr>
            </thead>
            <tbody>
              {studentStats.rows.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 8} className="p-8 text-center text-slate-400 italic">
                    Belum ada data siswa di dalam rombel ini. Silakan tambahkan siswa terlebih dahulu.
                  </td>
                </tr>
              ) : (
                studentStats.rows.map((row, idx) => {
                  const st = row.student;
                  const isOdd = idx % 2 === 1;
                  return (
                    <tr 
                      key={st.id}
                      className={`hover:bg-slate-50 transition-colors ${isOdd ? 'bg-slate-50/50' : 'bg-white'}`}
                    >
                      <td className="border border-slate-300 px-1.5 py-1 text-center font-mono text-[10px] font-medium text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-1 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="leading-tight">{st.name}</div>
                        {st.nisn && (
                          <div className="text-[9px] text-slate-400 font-mono font-normal">NISN: {st.nisn}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 p-0.5 text-center font-bold text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleToggleGender(st.id)}
                          className={`w-full py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer no-print ${
                            st.gender === 'L'
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                          title="Klik untuk mengubah jenis kelamin siswa (L <-> P)"
                        >
                          {st.gender}
                        </button>
                        <span className="hidden print:inline font-bold">{st.gender}</span>
                      </td>

                      {/* Day cells */}
                      {daysMeta.map(dm => {
                        const status = st.attendance?.[dm.dateKey];
                        const isSun = dm.isSunday;

                        if (isSun) {
                          return (
                            <td 
                              key={dm.dateKey}
                              className="border border-slate-300 p-0 text-center bg-rose-100/70 text-rose-600 font-bold text-[9px] select-none"
                              title="Hari Minggu / Libur"
                            >
                              L
                            </td>
                          );
                        }

                        let badgeStyle = 'text-slate-300 font-normal';
                        if (status === 'H') badgeStyle = 'bg-emerald-100 text-emerald-800 font-bold';
                        else if (status === 'S') badgeStyle = 'bg-blue-100 text-blue-800 font-bold';
                        else if (status === 'I') badgeStyle = 'bg-amber-100 text-amber-800 font-bold';
                        else if (status === 'A') badgeStyle = 'bg-rose-100 text-rose-800 font-bold';

                        return (
                          <td 
                            key={dm.dateKey}
                            onClick={() => handleToggleCell(st.id, dm.dateKey, isSun)}
                            className={`border border-slate-300 p-0 text-center text-[10px] cursor-pointer hover:ring-1 hover:ring-emerald-400 select-none transition-colors ${
                              dm.isSaturday ? 'bg-slate-50' : ''
                            } ${badgeStyle}`}
                            title={`${st.name} - ${dm.day} ${namaBulan}: ${status || 'Kosong (Klik untuk ubah)'}`}
                          >
                            <span className="block w-full h-full py-0.5">
                              {status || '·'}
                            </span>
                          </td>
                        );
                      })}

                      {/* Student Recap Totals */}
                      <td className="border border-slate-300 px-1 py-1 text-center font-bold text-emerald-800 bg-emerald-50/50">
                        {row.h}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-center font-bold text-blue-800 bg-blue-50/50">
                        {row.s}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-center font-bold text-amber-800 bg-amber-50/50">
                        {row.i}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-center font-bold text-rose-800 bg-rose-50/50">
                        {row.a}
                      </td>
                      <td className={`border border-slate-300 px-1 py-1 text-center font-bold text-[10px] ${
                        row.percent >= 85 ? 'text-emerald-700 bg-emerald-50/30' : row.percent >= 75 ? 'text-amber-700 bg-amber-50/30' : 'text-rose-700 bg-rose-50/30'
                      }`}>
                        {row.percent}%
                      </td>
                      <td className="border border-slate-300 px-1.5 py-1 text-center no-print">
                        <button
                          type="button"
                          onClick={() => handleSetStudentAllHadir(st.id)}
                          className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          title="Isi hadir penuh untuk siswa ini"
                        >
                          All H
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* TABLE FOOTER SUMMARY ROWS */}
            {activeClass.students.length > 0 && (
              <tfoot className="font-bold text-[10px] bg-slate-50">
                <tr>
                  <td colSpan={3} className="border border-slate-300 px-2 py-1 text-right text-emerald-800">
                    Jumlah Hadir (H):
                  </td>
                  {daysMeta.map((dm, idx) => (
                    <td 
                      key={'totH-' + dm.day} 
                      className="border border-slate-300 px-0.5 py-1 text-center text-emerald-700 bg-emerald-50"
                    >
                      {dm.isSunday ? '-' : dailyTotals.H[idx]}
                    </td>
                  ))}
                  <td className="border border-slate-300 px-1 py-1 text-center text-emerald-800 bg-emerald-100 font-black">
                    {studentStats.grandH}
                  </td>
                  <td colSpan={3} className="border border-slate-300 bg-slate-100"></td>
                  <td rowSpan={4} className="border border-slate-300 px-1 py-1 text-center text-emerald-800 bg-emerald-100 font-black text-xs">
                    {studentStats.avgPercent}%
                  </td>
                  <td className="border border-slate-300 bg-slate-100 no-print"></td>
                </tr>

                <tr>
                  <td colSpan={3} className="border border-slate-300 px-2 py-1 text-right text-blue-800">
                    Jumlah Sakit (S):
                  </td>
                  {daysMeta.map((dm, idx) => (
                    <td 
                      key={'totS-' + dm.day} 
                      className="border border-slate-300 px-0.5 py-1 text-center text-blue-700 bg-blue-50"
                    >
                      {dm.isSunday ? '-' : dailyTotals.S[idx]}
                    </td>
                  ))}
                  <td className="border border-slate-300 bg-slate-100"></td>
                  <td className="border border-slate-300 px-1 py-1 text-center text-blue-800 bg-blue-100 font-black">
                    {studentStats.grandS}
                  </td>
                  <td colSpan={2} className="border border-slate-300 bg-slate-100"></td>
                  <td className="border border-slate-300 bg-slate-100 no-print"></td>
                </tr>

                <tr>
                  <td colSpan={3} className="border border-slate-300 px-2 py-1 text-right text-amber-800">
                    Jumlah Izin (I):
                  </td>
                  {daysMeta.map((dm, idx) => (
                    <td 
                      key={'totI-' + dm.day} 
                      className="border border-slate-300 px-0.5 py-1 text-center text-amber-700 bg-amber-50"
                    >
                      {dm.isSunday ? '-' : dailyTotals.I[idx]}
                    </td>
                  ))}
                  <td colSpan={2} className="border border-slate-300 bg-slate-100"></td>
                  <td className="border border-slate-300 px-1 py-1 text-center text-amber-800 bg-amber-100 font-black">
                    {studentStats.grandI}
                  </td>
                  <td className="border border-slate-300 bg-slate-100"></td>
                  <td className="border border-slate-300 bg-slate-100 no-print"></td>
                </tr>

                <tr>
                  <td colSpan={3} className="border border-slate-300 px-2 py-1 text-right text-rose-800">
                    Jumlah Alpa (A):
                  </td>
                  {daysMeta.map((dm, idx) => (
                    <td 
                      key={'totA-' + dm.day} 
                      className="border border-slate-300 px-0.5 py-1 text-center text-rose-700 bg-rose-50"
                    >
                      {dm.isSunday ? '-' : dailyTotals.A[idx]}
                    </td>
                  ))}
                  <td colSpan={3} className="border border-slate-300 bg-slate-100"></td>
                  <td className="border border-slate-300 px-1 py-1 text-center text-rose-800 bg-rose-100 font-black">
                    {studentStats.grandA}
                  </td>
                  <td className="border border-slate-300 bg-slate-100 no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* BOTTOM NOTES & EXPLANATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Keterangan Kode Absensi:</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
              <span><strong>H</strong> = Hadir</span>
              <span><strong>S</strong> = Sakit (Dengan Surat)</span>
              <span><strong>I</strong> = Izin (Pemberitahuan Wali)</span>
              <span><strong>A</strong> = Alpa (Tanpa Keterangan)</span>
              <span><strong>L</strong> = Libur / Akhir Pekan</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200 text-emerald-900 space-y-1">
            <p className="font-bold text-emerald-800">Statistik Partisipasi Kelas:</p>
            <p className="text-[11px]">
              Total Kehadiran: <strong>{studentStats.grandH}</strong> kali &bull; 
              Tingkat Rata-rata Kehadiran Rombel: <strong className="text-emerald-700 text-xs">{studentStats.avgPercent}%</strong>.
            </p>
          </div>
        </div>

        {/* OFFICIAL SIGNATURE SHEET (PRINT-READY) */}
        <div className="mt-8 pt-4 grid grid-cols-2 text-center text-xs text-slate-800 page-break-avoid">
          <div className="space-y-1">
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah {namaSekolah}</p>
            <div className="h-16 sm:h-20"></div>
            <p className="font-bold underline text-slate-900">{namaKepalaSekolah}</p>
            <p className="text-[11px] text-slate-500">NIP. {nipKepalaSekolah}</p>
          </div>

          <div className="space-y-1">
            <p>{kota}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Guru Kelas / Wali Kelas / PJOK</p>
            <div className="h-16 sm:h-20"></div>
            <p className="font-bold underline text-slate-900">{namaGuru}</p>
            <p className="text-[11px] text-slate-500">NIP. {nipGuru}</p>
          </div>
        </div>

      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Rekap Absensi Bulanan PJOK"
        subtitle={`${activeClass.name} - Periode ${namaBulan} ${selectedYear}`}
        tabs={getAbsensiPenilaianPrompts(activeClass.name, activeClass.students.length)}
        defaultActiveTab="analisis_kehadiran"
        jsonData={{
          kelas: activeClass.name,
          bulan: namaBulan,
          tahun: selectedYear,
          sekolah: namaSekolah,
          guru: namaGuru,
          nipGuru,
          siswa: activeClass.students
        }}
        jsonFilename={`Rekap_Absensi_Bulanan_${activeClass.name.replace(/\s+/g, '_')}_${namaBulan}_${selectedYear}.json`}
      />
    </div>
  );
}
