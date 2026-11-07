import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  AlertCircle,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  ClipboardList,
  CalendarDays,
  Download,
  FileText,
  Printer,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Save,
  CheckCircle2,
  Info,
  Layers,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Calendar,
  Share2,
  SlidersHorizontal,
  Table,
  Eye,
  RefreshCw,
  Clock
} from 'lucide-react';
import { ProsemData, ProsemSemesterData, ProsemRow, ProsemMonthData, ProsemWeekValue } from '../types';
import { 
  downloadDocFile, 
  copyAndOpenGoogleDocs, 
  exportProsemToDoc, 
  downloadJsonFile 
} from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import { fetchWithRetry } from '../lib/fetchUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getProtaProsemPrompts } from '../utils/aiPromptGenerators';
import {
  loadSavedProsem,
  saveProsemToStorage,
  resetProsemStorage,
  getPresetProsemByKelas,
  calculateSemesterTotalJp,
  autoScheduleSemesterRows,
  DEFAULT_MONTHS_GANJIL,
  DEFAULT_MONTHS_GENAP
} from '../utils/prosemPresets';

export default function ProsemGeneratorView() {
  // Main Prosem Data State
  const [prosemData, setProsemData] = useState<ProsemData>(() => loadSavedProsem());

  // Active Tab: 'editor' | 'generate' | 'preview' | 'panduan'
  const [activeTab, setActiveTab] = useState<'editor' | 'generate' | 'preview' | 'panduan'>('editor');

  // Active Semester Tab in Editor: 'ganjil' | 'genap'
  const [activeSemester, setActiveSemester] = useState<'ganjil' | 'genap'>('ganjil');

  // Input states for AI generation
  const [mataPelajaran, setMataPelajaran] = useState(prosemData.identitas.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)');
  const [kelas, setKelas] = useState(prosemData.identitas.kelas || '5');
  const [fase, setFase] = useState(prosemData.identitas.fase || 'C');
  const [tahunPelajaran, setTahunPelajaran] = useState(prosemData.identitas.tahunPelajaran || '2026/2027');
  const [alokasiWaktuTiapMinggu, setAlokasiWaktuTiapMinggu] = useState(prosemData.identitas.alokasiWaktuTiapMinggu || '4 JP');
  const [protaContent, setProtaContent] = useState(
    "Bab 1: Permainan Invasi (Sepak Bola Sederhana) - 12 JP (Semester Ganjil)\n" +
    "- Topik: Variasi menendang, menghentikan, & menggiring bola\n\n" +
    "Bab 2: Permainan Net (Bola Voli Mini) - 12 JP (Semester Ganjil)\n" +
    "- Topik: Passing bawah & passing atas bola voli\n\n" +
    "Bab 3: Permainan Lapangan (Kasti) - 12 JP (Semester Ganjil)\n" +
    "- Topik: Melempar, menangkap, & memukul bola kasti\n\n" +
    "Sumatif Tengah Semester 1 (STS) - 4 JP\n\n" +
    "Bab 4: Kebugaran Jasmani - 12 JP (Semester Ganjil)\n" +
    "- Topik: Latihan sirkuit daya tahan jantung & otot\n\n" +
    "Bab 5: Pola Hidup Sehat - 8 JP (Semester Ganjil)\n" +
    "- Topik: Pemeliharaan alat reproduksi & gizi seimbang\n\n" +
    "Sumatif Akhir Semester 1 (SAS) - 8 JP\n" +
    "Jam Cadangan Ganjil - 4 JP\n\n" +
    "Bab 6: Senam Lantai - 12 JP (Semester Genap)\n" +
    "- Topik: Guling depan & sikap lilin\n\n" +
    "Bab 7: Gerak Berirama - 12 JP (Semester Genap)\n" +
    "- Topik: Senam irama langkah & ayunan lengan\n\n" +
    "Bab 8: Aktivitas Air - 12 JP (Semester Genap)\n" +
    "- Topik: Gerak meluncur & kaki renang dada\n\n" +
    "Bab 9: Karakter & Kerjasama - 12 JP (Semester Genap)\n" +
    "Sumatif Akhir Tahun (SAT) - 8 JP\n" +
    "Jam Cadangan Genap - 4 JP"
  );

  // Status & UI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));

  // Auto-Save Effect
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveProsemToStorage(prosemData);
    setLastSavedTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
  }, [prosemData]);

  // Current Semester Data
  const currentSemesterData: ProsemSemesterData = activeSemester === 'ganjil' ? prosemData.ganjil : prosemData.genap;
  const currentSemesterTotals = calculateSemesterTotalJp(currentSemesterData);

  // Auto-set Fase based on Kelas
  const handleKelasChange = (val: string) => {
    setKelas(val);
    let newFase = 'C';
    if (val === '1' || val === '2') newFase = 'A';
    else if (val === '3' || val === '4') newFase = 'B';
    else if (val === '5' || val === '6') newFase = 'C';
    else if (['7', '8', '9'].includes(val)) newFase = 'D';
    setFase(newFase);
  };

  // Switch Preset
  const handleApplyPreset = (targetKelas: string) => {
    const preset = getPresetProsemByKelas(targetKelas);
    setProsemData(preset);
    setKelas(preset.identitas.kelas);
    setFase(preset.identitas.fase);
    setMataPelajaran(preset.identitas.mataPelajaran);
    setTahunPelajaran(preset.identitas.tahunPelajaran);
    setSaveStatus(`Preset PROSEM Kelas ${targetKelas} (Fase ${preset.identitas.fase}) berhasil dimuat!`);
    setTimeout(() => setSaveStatus(null), 3500);
  };

  // Reset to default
  const handleResetToStandard = () => {
    if (window.confirm('Kembalikan seluruh data PROSEM ke format standar Kurikulum Merdeka? Perubahan yang belum disimpan akan direset.')) {
      const standard = resetProsemStorage();
      setProsemData(standard);
      setKelas(standard.identitas.kelas);
      setFase(standard.identitas.fase);
      setSaveStatus('Data PROSEM telah direset ke Standar Kurikulum Merdeka.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Auto-schedule weeks for current semester
  const handleAutoSchedule = () => {
    const jpNum = parseInt(prosemData.identitas.alokasiWaktuTiapMinggu?.replace(/\D/g, '') || '4', 10) || 4;
    const targetSemKey = activeSemester;
    const updatedRows = autoScheduleSemesterRows(
      prosemData[targetSemKey].rows,
      prosemData[targetSemKey].monthsHeader,
      jpNum
    );

    setProsemData(prev => ({
      ...prev,
      [targetSemKey]: {
        ...prev[targetSemKey],
        rows: updatedRows
      }
    }));

    setSaveStatus(`Alokasi jam pelajaran ${targetSemKey === 'ganjil' ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)'} berhasil dijadwalkan otomatis berurutan pada pekan efektif!`);
    setTimeout(() => setSaveStatus(null), 4000);
  };

  // Generate PROSEM from AI
  const handleGenerateProsem = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    if (!mataPelajaran.trim()) {
      setValidationError('Mata Pelajaran wajib diisi.');
      return;
    }
    if (!kelas.trim()) {
      setValidationError('Kelas wajib diisi.');
      return;
    }
    if (!protaContent.trim()) {
      setValidationError('Data acuan PROTA wajib diisi.');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetchWithRetry('/api/generate-prosem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mataPelajaran,
          kelas,
          fase,
          tahunPelajaran,
          alokasiWaktuTiapMinggu,
          protaContent
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menyusun Program Semester dari AI.');
      }

      const data: ProsemData = await response.json();
      
      // Preserve custom school identity
      const mergedData: ProsemData = {
        ...data,
        identitas: {
          ...data.identitas,
          namaSekolah: prosemData.identitas.namaSekolah || 'SD Negeri Kalimantong',
          kepalaSekolah: prosemData.identitas.kepalaSekolah || 'Budi Santoso, S.Pd., M.M.',
          nipKepsek: prosemData.identitas.nipKepsek || '19750812 199903 1 002',
          guruMapel: prosemData.identitas.guruMapel || 'Ahmad Fauzi, S.Pd.',
          nipGuru: prosemData.identitas.nipGuru || '19880415 201502 1 003',
          kota: prosemData.identitas.kota || 'Jakarta'
        }
      };

      setProsemData(mergedData);
      saveProsemToStorage(mergedData);
      setActiveTab('editor');
      setSaveStatus('PROSEM berhasil disusun oleh AI dan siap disunting di Editor!');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Gagal menyusun Program Semester (PROSEM). Menggunakan data standar.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handlers for Row & Week Editing
  const handleUpdateRowField = (rowIdx: number, field: keyof ProsemRow, value: string) => {
    const semKey = activeSemester;
    setProsemData(prev => {
      const nextRows = [...prev[semKey].rows];
      nextRows[rowIdx] = {
        ...nextRows[rowIdx],
        [field]: value
      };
      return {
        ...prev,
        [semKey]: {
          ...prev[semKey],
          rows: nextRows
        }
      };
    });
  };

  const handleUpdateWeekValue = (rowIdx: number, monthName: string, weekNum: number, newValue: string) => {
    const semKey = activeSemester;
    setProsemData(prev => {
      const nextRows = [...prev[semKey].rows];
      const targetRow = { ...nextRows[rowIdx] };
      const updatedMonths = targetRow.months.map(m => {
        if (m.monthName !== monthName) return m;
        const updatedWeeks = m.weeks.map(w => {
          if (w.weekNum !== weekNum) return w;
          return {
            ...w,
            value: newValue
          };
        });
        return {
          ...m,
          weeks: updatedWeeks
        };
      });

      targetRow.months = updatedMonths;
      nextRows[rowIdx] = targetRow;

      return {
        ...prev,
        [semKey]: {
          ...prev[semKey],
          rows: nextRows
        }
      };
    });
  };

  const handleToggleNonEffectiveWeek = (monthIdx: number, weekNum: number) => {
    const semKey = activeSemester;
    setProsemData(prev => {
      const nextHeaders = [...prev[semKey].monthsHeader];
      const targetHeader = { ...nextHeaders[monthIdx] };
      const nonEff = targetHeader.nonEffectiveWeeks || [];
      
      let nextNonEff: number[];
      if (nonEff.includes(weekNum)) {
        nextNonEff = nonEff.filter(w => w !== weekNum);
      } else {
        nextNonEff = [...nonEff, weekNum].sort((a, b) => a - b);
      }

      targetHeader.nonEffectiveWeeks = nextNonEff;
      nextHeaders[monthIdx] = targetHeader;

      return {
        ...prev,
        [semKey]: {
          ...prev[semKey],
          monthsHeader: nextHeaders
        }
      };
    });
  };

  const handleAddRow = () => {
    const semKey = activeSemester;
    const targetSem = prosemData[semKey];
    const newNo = `${semKey === 'ganjil' ? '1' : '2'}.${targetSem.rows.length + 1}`;
    
    // Create empty months structure matching monthsHeader
    const monthsData: ProsemMonthData[] = targetSem.monthsHeader.map(mh => ({
      monthName: mh.monthName,
      weeks: Array.from({ length: mh.totalWeeks }, (_, wIdx) => ({
        weekNum: wIdx + 1,
        value: '',
        isEffective: !mh.nonEffectiveWeeks.includes(wIdx + 1)
      }))
    }));

    const newRow: ProsemRow = {
      no: newNo,
      bab: `Bab Baru ${targetSem.rows.length + 1}`,
      topik: 'Topik Materi Pembelajaran Baru',
      pertemuanKe: `${targetSem.rows.length + 1}`,
      alokasiWaktu: '4 JP',
      months: monthsData
    };

    setProsemData(prev => ({
      ...prev,
      [semKey]: {
        ...prev[semKey],
        rows: [...prev[semKey].rows, newRow]
      }
    }));

    setSaveStatus('Baris pembelajaran baru berhasil ditambahkan.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteRow = (rowIdx: number) => {
    const semKey = activeSemester;
    if (prosemData[semKey].rows.length <= 1) {
      alert('Minimal harus ada 1 baris dalam semester.');
      return;
    }
    if (window.confirm(`Hapus baris "${prosemData[semKey].rows[rowIdx].bab}"?`)) {
      setProsemData(prev => ({
        ...prev,
        [semKey]: {
          ...prev[semKey],
          rows: prev[semKey].rows.filter((_, i) => i !== rowIdx)
        }
      }));
      setSaveStatus('Baris berhasil dihapus.');
      setTimeout(() => setSaveStatus(null), 2500);
    }
  };

  const handleMoveRow = (rowIdx: number, direction: 'up' | 'down') => {
    const semKey = activeSemester;
    const rows = prosemData[semKey].rows;
    if ((direction === 'up' && rowIdx === 0) || (direction === 'down' && rowIdx === rows.length - 1)) {
      return;
    }
    const targetIdx = direction === 'up' ? rowIdx - 1 : rowIdx + 1;
    setProsemData(prev => {
      const nextRows = [...prev[semKey].rows];
      const temp = nextRows[rowIdx];
      nextRows[rowIdx] = nextRows[targetIdx];
      nextRows[targetIdx] = temp;
      return {
        ...prev,
        [semKey]: {
          ...prev[semKey],
          rows: nextRows
        }
      };
    });
  };

  // Renumber rows
  const handleRenumberRows = () => {
    const semKey = activeSemester;
    const prefix = semKey === 'ganjil' ? '1' : '2';
    let count = 1;
    setProsemData(prev => ({
      ...prev,
      [semKey]: {
        ...prev[semKey],
        rows: prev[semKey].rows.map(r => ({
          ...r,
          no: `${prefix}.${count++}`
        }))
      }
    }));
    setSaveStatus('Nomor urut baris berhasil dirapikan.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Update Identitas
  const handleUpdateIdentitas = (field: keyof ProsemData['identitas'], value: string) => {
    setProsemData(prev => ({
      ...prev,
      identitas: {
        ...prev.identitas,
        [field]: value
      }
    }));
  };

  // Download Word (.doc) with clean borders & print-ready layout
  const handleDownloadDoc = () => {
    const docHtml = exportProsemToDoc(prosemData);
    const filename = `PROSEM_${prosemData.identitas.mataPelajaran.replace(/\s+/g, '_')}_Kelas${prosemData.identitas.kelas}_${(prosemData.identitas.tahunPelajaran || '').replace(/\//g, '-')}`;
    downloadDocFile(filename, docHtml);
    setSaveStatus('Dokumen Word (.doc) berhasil diunduh dalam tabel landscape rapi & siap cetak!');
    setTimeout(() => setSaveStatus(null), 4000);
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docHtml = exportProsemToDoc(prosemData);
      const filename = `PROSEM_${prosemData.identitas.mataPelajaran.replace(/\s+/g, '_')}_Kelas${prosemData.identitas.kelas}`;
      const success = await downloadHtmlAsPdf(filename, docHtml, {
        title: `Program Semester - ${prosemData.identitas.mataPelajaran}`,
        orientation: 'landscape'
      });
      if (!success) {
        printHtmlDocument(docHtml, `PROSEM - ${prosemData.identitas.mataPelajaran}`);
      }
    } catch (err) {
      console.error(err);
      const docHtml = exportProsemToDoc(prosemData);
      printHtmlDocument(docHtml, `PROSEM - ${prosemData.identitas.mataPelajaran}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print
  const handlePrint = () => {
    const docHtml = exportProsemToDoc(prosemData);
    printHtmlDocument(docHtml, `PROSEM - ${prosemData.identitas.mataPelajaran}`);
  };

  // Copy to Google Docs
  const handleCopyAndGoToDocs = async () => {
    setCopySuccess(false);
    const docHtml = exportProsemToDoc(prosemData);
    const success = await copyAndOpenGoogleDocs(docHtml);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  // Copy as Excel TSV
  const handleCopyExcel = () => {
    let tsv = `PROGRAM SEMESTER (PROSEM) KURIKULUM MERDEKA\n`;
    tsv += `Satuan Pendidikan\t${prosemData.identitas.namaSekolah || '-'}\n`;
    tsv += `Mata Pelajaran\t${prosemData.identitas.mataPelajaran}\n`;
    tsv += `Kelas / Fase\tKelas ${prosemData.identitas.kelas} / Fase ${prosemData.identitas.fase}\n`;
    tsv += `Tahun Pelajaran\t${prosemData.identitas.tahunPelajaran}\n\n`;

    // Active semester table
    const semData = currentSemesterData;
    tsv += `SEMESTER ${activeSemester.toUpperCase()}\n`;
    
    // Header Row 1
    let h1 = `No\tUnit/Bab\tTopik Pembelajaran\tPert. Ke\tAlokasi JP`;
    semData.monthsHeader.forEach(m => {
      for (let w = 1; w <= m.totalWeeks; w++) {
        h1 += `\t${m.monthName} M${w}`;
      }
    });
    tsv += `${h1}\n`;

    // Data rows
    semData.rows.forEach(r => {
      let rowStr = `${r.no}\t${r.bab}\t${r.topik}\t${r.pertemuanKe}\t${r.alokasiWaktu}`;
      r.months.forEach(m => {
        m.weeks.forEach(w => {
          rowStr += `\t${w.value || '-'}`;
        });
      });
      tsv += `${rowStr}\n`;
    });

    navigator.clipboard.writeText(tsv).then(() => {
      setSaveStatus('Tabel PROSEM berhasil disalin ke clipboard! Siap di-paste ke Microsoft Excel atau Google Spreadsheet.');
      setTimeout(() => setSaveStatus(null), 4000);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER UTAMA & STATUS BAR */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-indigo-600 text-white rounded-2xl shadow-md shadow-emerald-100">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Program Semester (PROSEM) Kurikulum Merdeka
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Lengkap & Dapat Diedit Penuh
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribusi Alokasi Jam Pelajaran Mingguan (Smt 1 & Smt 2) • Matriks Kalender Akademik • Ekspor Landscape Siap Cetak
              </p>
            </div>
          </div>

          {/* Global Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleDownloadDoc}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
              title="Unduh dokumen Word landscape dengan tabel rapi bergaris hitam dan siap cetak"
            >
              <FileText className="w-4 h-4" />
              <span>Unduh Word Siap Cetak</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Unduh format PDF Landscape"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'Memproses PDF...' : 'PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Cetak langsung dokumen"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak</span>
            </button>

            <button
              onClick={handleCopyAndGoToDocs}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Salin tabel rapi dan buka di Google Docs"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin ke Docs!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Google Docs</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </>
              )}
            </button>

            <button
              onClick={handleCopyExcel}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Salin tabel TSV untuk ditempel ke Excel atau Spreadsheet"
            >
              <Table className="w-4 h-4 text-emerald-600" />
              <span>Salin ke Excel</span>
            </button>

            <ExportJsonPromptAiButtons
              variant="compact"
              onExportJson={() => {
                downloadJsonFile(`PROSEM_PJOK_Kelas_${prosemData.identitas.kelas}_${(prosemData.identitas.tahunPelajaran || '').replace(/\//g, '-')}`, {
                  prosemData,
                  tanggalEkspor: new Date().toISOString()
                });
              }}
              onOpenPromptAi={() => setShowPromptModal(true)}
            />

            <button
              onClick={handleResetToStandard}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="Reset ke format standar Kurikulum Merdeka"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FEEDBACK STATUS TOAST */}
        {saveStatus && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{saveStatus}</span>
          </div>
        )}

        {/* TAB NAVIGATION PILLS */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Edit3 className="w-4 h-4 text-emerald-600" />
              <span>✏️ 1. Editor PROSEM Mingguan</span>
            </button>

            <button
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'generate'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>⚡ 2. Generate Otomatis (Instan & AI)</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Eye className="w-4 h-4 text-blue-500" />
              <span>📄 3. Pratinjau Dokumen Cetak</span>
            </button>

            <button
              onClick={() => setActiveTab('panduan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'panduan'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>💡 4. Panduan & Kalender Akademik</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Tersimpan otomatis ({lastSavedTime})</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ✏️ EDITOR PROSEM LENGKAP (INTERACTIVE WEEKLY GRID) */}
      {/* ======================================================== */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          
          {/* Quick Preset Selector & Semester Switcher Bar */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 rounded-2xl p-4 border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Pilih Semester yang Diedit:</span>
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setActiveSemester('ganjil')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeSemester === 'ganjil'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ☀️ Semester 1 (Ganjil)
                </button>
                <button
                  onClick={() => setActiveSemester('genap')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeSemester === 'genap'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ❄️ Semester 2 (Genap)
                </button>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1">Muat Cepat:</span>
              {[
                { k: '1', label: 'Kelas 1 (Fase A)' },
                { k: '5', label: 'Kelas 5 (Fase C)' }
              ].map(item => (
                <button
                  key={item.k}
                  onClick={() => handleApplyPreset(item.k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    prosemData.identitas.kelas === item.k
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* IDENTITAS SEKOLAH & GURU (EDITABLE ACCORDION / GRID) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Identitas Sekolah, Beban Belajar, & Tanda Tangan</h3>
              </div>
              <span className="text-[11px] text-slate-400">Data otomatis terhubung ke kop dokumen & tanda tangan pengesahan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Nama Sekolah</label>
                <input
                  type="text"
                  value={prosemData.identitas.namaSekolah || ''}
                  onChange={(e) => handleUpdateIdentitas('namaSekolah', e.target.value)}
                  placeholder="SD Negeri Kalimantong"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Mata Pelajaran</label>
                <input
                  type="text"
                  value={prosemData.identitas.mataPelajaran || ''}
                  onChange={(e) => handleUpdateIdentitas('mataPelajaran', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Kelas & Fase</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={prosemData.identitas.kelas}
                    onChange={(e) => {
                      const newK = e.target.value;
                      handleUpdateIdentitas('kelas', newK);
                      let f = 'C';
                      if (newK === '1' || newK === '2') f = 'A';
                      else if (newK === '3' || newK === '4') f = 'B';
                      else if (newK === '5' || newK === '6') f = 'C';
                      else if (['7', '8', '9'].includes(newK)) f = 'D';
                      handleUpdateIdentitas('fase', f);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  >
                    {['1', '2', '3', '4', '5', '6'].map(k => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={`Fase ${prosemData.identitas.fase}`}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-500 text-center cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Tahun Pelajaran</label>
                <input
                  type="text"
                  value={prosemData.identitas.tahunPelajaran || '2026/2027'}
                  onChange={(e) => handleUpdateIdentitas('tahunPelajaran', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Alokasi JP per Pekan</label>
                <input
                  type="text"
                  value={prosemData.identitas.alokasiWaktuTiapMinggu || '4 JP'}
                  onChange={(e) => handleUpdateIdentitas('alokasiWaktuTiapMinggu', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Kepala Sekolah</label>
                <input
                  type="text"
                  value={prosemData.identitas.kepalaSekolah || ''}
                  onChange={(e) => handleUpdateIdentitas('kepalaSekolah', e.target.value)}
                  placeholder="Nama Kepala Sekolah"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={prosemData.identitas.nipKepsek || ''}
                  onChange={(e) => handleUpdateIdentitas('nipKepsek', e.target.value)}
                  placeholder="1975..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Guru Mata Pelajaran</label>
                <input
                  type="text"
                  value={prosemData.identitas.guruMapel || ''}
                  onChange={(e) => handleUpdateIdentitas('guruMapel', e.target.value)}
                  placeholder="Nama Guru PJOK"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">NIP Guru</label>
                <input
                  type="text"
                  value={prosemData.identitas.nipGuru || ''}
                  onChange={(e) => handleUpdateIdentitas('nipGuru', e.target.value)}
                  placeholder="1988..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Kota Pengesahan</label>
                <input
                  type="text"
                  value={prosemData.identitas.kota || 'Jakarta'}
                  onChange={(e) => handleUpdateIdentitas('kota', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600">Tanggal Pengesahan</label>
                <input
                  type="text"
                  value={prosemData.tanggalDokumen || 'Jakarta, 13 Juli 2026'}
                  onChange={(e) => setProsemData(prev => ({ ...prev, tanggalDokumen: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* SUMMARY STATS CARD (REAL-TIME JP TOTALS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pekan Kalender</span>
                <span className="text-xl font-extrabold text-slate-800">{currentSemesterTotals.totalPekanKalender} Pekan</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Semester {activeSemester === 'ganjil' ? 'Ganjil (Jul - Des)' : 'Genap (Jan - Jun)'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                CAL
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pekan Efektif KBM</span>
                <span className="text-xl font-extrabold text-emerald-700">{currentSemesterTotals.totalPekanEfektif} Pekan</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {currentSemesterTotals.totalPekanKalender - currentSemesterTotals.totalPekanEfektif} pekan tidak efektif
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                EFEK
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total JP Terjadwal</span>
                <span className="text-xl font-extrabold text-indigo-700">{currentSemesterTotals.totalJp} JP</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Target semester: {currentSemesterTotals.totalPekanEfektif * 4} JP
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                JAM
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Beban Mengajar</span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5">
                  {prosemData.identitas.alokasiWaktuTiapMinggu || '4 JP'} per Pekan
                </span>
                <span className="text-[10px] text-emerald-600 font-medium block">
                  Kurikulum Merdeka (BSKAP 046/H/KR/2025)
                </span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* MAIN PROSEM INTERACTIVE TABLE */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <Table className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Matriks Program Semester - Semester {activeSemester === 'ganjil' ? 'I (Ganjil)' : 'II (Genap)'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ketik langsung pada kotak pekan (misal angka 4, STS, SAS, L, dsb.). Klik tombol pekan di header untuk menandai pekan efektif/tidak efektif.
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={handleAutoSchedule}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  title="Otomatis petakan jam setiap baris secara berurutan pada pekan efektif"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>⚡ Auto-Jadwalkan Pekan</span>
                </button>

                <button
                  onClick={handleRenumberRows}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  title="Rapikan nomor urut baris"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Rapikan No</span>
                </button>

                <button
                  onClick={handleAddRow}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Baris</span>
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs min-w-[1000px]">
                <thead>
                  {/* Row 1: Month Headers */}
                  <tr className="bg-slate-900 text-white font-bold">
                    <th rowSpan={2} className="px-2 py-3 border-r border-slate-700 text-center w-12">No</th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-slate-700 w-44">Unit / Bab</th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-slate-700 min-w-[200px]">Topik / Materi Pembelajaran</th>
                    <th rowSpan={2} className="px-2 py-3 border-r border-slate-700 text-center w-20">Pert. Ke</th>
                    <th rowSpan={2} className="px-2 py-3 border-r border-slate-700 text-center w-20">Alokasi</th>
                    
                    {currentSemesterData.monthsHeader.map((m, mIdx) => (
                      <th 
                        key={mIdx} 
                        colSpan={m.totalWeeks}
                        className="px-2 py-2 border-r border-slate-700 text-center font-bold bg-slate-800 text-indigo-200 text-xs"
                      >
                        {m.monthName}
                      </th>
                    ))}
                    
                    <th rowSpan={2} className="px-2 py-3 text-center w-20">Aksi</th>
                  </tr>

                  {/* Row 2: Week Numbers (with toggle for effective/non-effective) */}
                  <tr className="bg-slate-800 text-slate-200 text-center font-bold text-[10px]">
                    {currentSemesterData.monthsHeader.map((m, mIdx) => {
                      const cells = [];
                      for (let w = 1; w <= m.totalWeeks; w++) {
                        const isNonEff = m.nonEffectiveWeeks.includes(w);
                        cells.push(
                          <th 
                            key={`${mIdx}-${w}`}
                            onClick={() => handleToggleNonEffectiveWeek(mIdx, w)}
                            className={`px-1 py-1.5 border-r border-slate-700 w-9 cursor-pointer transition select-none ${
                              isNonEff 
                                ? 'bg-rose-900/80 text-rose-200 hover:bg-rose-800' 
                                : 'bg-slate-750 text-slate-300 hover:bg-slate-700'
                            }`}
                            title={`Klik untuk ubah status Pekan ${w} ${m.monthName}: ${isNonEff ? 'Tidak Efektif (Libur/Asesmen)' : 'Efektif KBM'}`}
                          >
                            <span className="block">{w}</span>
                            <span className="text-[8px] opacity-75 font-normal block">
                              {isNonEff ? 'Non' : 'Ef'}
                            </span>
                          </th>
                        );
                      }
                      return cells;
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {currentSemesterData.rows.map((row, rIdx) => (
                    <tr 
                      key={rIdx}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      {/* No */}
                      <td className="px-1.5 py-2 text-center border-r border-slate-200">
                        <input
                          type="text"
                          value={row.no}
                          onChange={(e) => handleUpdateRowField(rIdx, 'no', e.target.value)}
                          className="w-10 text-center font-bold bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-0.5 text-slate-700 focus:bg-white text-xs"
                        />
                      </td>

                      {/* Bab */}
                      <td className="px-2 py-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={row.bab}
                          onChange={(e) => handleUpdateRowField(rIdx, 'bab', e.target.value)}
                          className="w-full font-bold text-slate-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 focus:bg-white text-xs"
                          placeholder="Nama Bab / Unit..."
                        />
                      </td>

                      {/* Topik / Materi */}
                      <td className="px-2 py-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={row.topik}
                          onChange={(e) => handleUpdateRowField(rIdx, 'topik', e.target.value)}
                          className="w-full text-slate-700 bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 focus:bg-white text-xs"
                          placeholder="Topik materi..."
                        />
                      </td>

                      {/* Pertemuan Ke- */}
                      <td className="px-1.5 py-2 text-center border-r border-slate-200">
                        <input
                          type="text"
                          value={row.pertemuanKe}
                          onChange={(e) => handleUpdateRowField(rIdx, 'pertemuanKe', e.target.value)}
                          className="w-16 text-center text-slate-600 font-mono bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-0.5 focus:bg-white text-xs"
                          placeholder="1 - 3"
                        />
                      </td>

                      {/* Alokasi JP */}
                      <td className="px-1.5 py-2 text-center border-r border-slate-200">
                        <input
                          type="text"
                          value={row.alokasiWaktu}
                          onChange={(e) => handleUpdateRowField(rIdx, 'alokasiWaktu', e.target.value)}
                          className="w-14 text-center font-bold text-indigo-700 bg-indigo-50/50 border border-indigo-100 hover:border-indigo-300 focus:border-indigo-500 rounded p-0.5 focus:bg-white text-xs"
                          placeholder="12 JP"
                        />
                      </td>

                      {/* Weekly Matrix Cells */}
                      {currentSemesterData.monthsHeader.map((mHeader) => {
                        const monthData = row.months.find(m => m.monthName === mHeader.monthName);
                        const cells = [];

                        for (let wNum = 1; wNum <= mHeader.totalWeeks; wNum++) {
                          const isNonEffectiveHeader = mHeader.nonEffectiveWeeks.includes(wNum);
                          const weekObj = monthData?.weeks.find(w => w.weekNum === wNum);
                          const cellVal = weekObj?.value || '';

                          let cellBg = 'bg-white';
                          let cellText = 'text-slate-800';

                          if (isNonEffectiveHeader) {
                            cellBg = 'bg-slate-100/80';
                            cellText = 'text-slate-400';
                            if (cellVal.includes('L') || cellVal.toLowerCase().includes('libur')) {
                              cellBg = 'bg-amber-100';
                              cellText = 'text-amber-800 font-bold';
                            } else if (cellVal.includes('STS') || cellVal.includes('SAS') || cellVal.includes('SAT') || cellVal.includes('MPLS')) {
                              cellBg = 'bg-blue-100';
                              cellText = 'text-blue-800 font-bold';
                            }
                          } else if (cellVal) {
                            cellBg = 'bg-emerald-50';
                            cellText = 'text-emerald-700 font-bold';
                          }

                          cells.push(
                            <td 
                              key={`${mHeader.monthName}-${wNum}`}
                              className={`p-0.5 border-r border-slate-200 text-center ${cellBg}`}
                            >
                              <input
                                type="text"
                                value={cellVal}
                                onChange={(e) => handleUpdateWeekValue(rIdx, mHeader.monthName, wNum, e.target.value)}
                                className={`w-8 text-center text-xs font-bold bg-transparent border border-transparent hover:border-emerald-300 focus:border-emerald-600 focus:bg-white rounded py-1 transition ${cellText}`}
                                placeholder=""
                              />
                            </td>
                          );
                        }
                        return cells;
                      })}

                      {/* Actions */}
                      <td className="px-1.5 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleMoveRow(rIdx, 'up')}
                            disabled={rIdx === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition"
                            title="Naik"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveRow(rIdx, 'down')}
                            disabled={rIdx === currentSemesterData.rows.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition"
                            title="Turun"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(rIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Hapus Baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Table Footer Totals */}
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 text-xs">
                    <td colSpan={4} className="px-3 py-2.5 text-right font-bold">
                      TOTAL JAM PELAJARAN (JP) TERJADWAL:
                    </td>
                    <td className="px-2 py-2.5 text-center font-extrabold text-indigo-700 text-sm">
                      {currentSemesterTotals.totalJp} JP
                    </td>
                    <td colSpan={currentSemesterTotals.totalPekanKalender + 1} className="px-3 py-2.5 text-slate-600 font-normal">
                      Beban belajar {currentSemesterTotals.totalPekanEfektif} pekan efektif (rata-rata 4 JP per minggu)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Quick Add and Helper Legend Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center flex-wrap gap-2 text-xs">
                <span className="font-bold text-slate-700">Keterangan Warna Cell:</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Angka 4 = KBM Efektif (4 JP)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  STS / SAS / SAT = Asesmen Sumatif
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  L = Libur Semester / Nasional
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Kolom Abu-abu = Pekan Tidak Efektif
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddRow}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Tambah Baris</span>
                </button>

                <button
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Lihat Pratinjau Siap Cetak</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Download Word Card */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 rounded-2xl p-5 border border-blue-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Download Word (.doc) Siap Cetak</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Tabel Program Semester (PROSEM) diekspor dalam format Microsoft Word Landscape dengan garis hitam tegas (`border="1"`), kolom matriks rapi, kop sekolah resmi, dan kolom tanda tangan pengesahan Kepala Sekolah & Guru PJOK lengkap dengan NIP.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadDoc}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shrink-0 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Word Sekarang</span>
            </button>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ⚡ GENERATE OTOMATIS (INSTAN & AI) */}
      {/* ======================================================== */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Kolom Kiri: Generate Instan & Form AI */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Card 1: Preset Instan Standar Kurikulum Merdeka */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Mode 1: Generate Instan Standar BSKAP Nomor 046/H/KR/2025</h3>
                  <p className="text-xs text-slate-500">Pilih jenjang kelas dan otomatis hasilkan PROSEM 2 semester</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { k: '1', title: 'Kelas 1 SD', fase: 'Fase A', desc: 'Gerak dasar lokomotor, non-lokomotor, senam ceria & kebersihan' },
                  { k: '2', title: 'Kelas 2 SD', fase: 'Fase A', desc: 'Kombinasi gerak & permainan aktivitas air dangkal' },
                  { k: '4', title: 'Kelas 4 SD', fase: 'Fase B', desc: 'Variasi bola besar/kecil, atletik anak & senam lantai' },
                  { k: '5', title: 'Kelas 5 SD', fase: 'Fase C', desc: 'Sepak bola, voli mini, kasti, sirkuit kebugaran & renang' },
                ].map(item => (
                  <button
                    key={item.k}
                    onClick={() => {
                      handleApplyPreset(item.k);
                      setActiveTab('editor');
                    }}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      prosemData.identitas.kelas === item.k
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{item.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {item.fase}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-600 font-bold">
                      <span>Terapkan Preset</span>
                      <span>⚡ 2 Semester</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Card 2: Form Generate Kustom dengan AI Gemini */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Mode 2: Generate Kustom AI Gemini</h3>
                  <p className="text-[11px] text-slate-300">Buat PROSEM dari silabus materi atau acuan PROTA Anda sendiri</p>
                </div>
              </div>

              <form onSubmit={handleGenerateProsem} className="space-y-4 pt-1">
                {validationError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-200 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-300 block">Kelas</label>
                    <select
                      value={kelas}
                      onChange={(e) => handleKelasChange(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {['1', '2', '3', '4', '5', '6'].map(k => (
                        <option key={k} value={k}>Kelas {k}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-300 block">Fase</label>
                    <input 
                      type="text" 
                      value={`Fase ${fase}`}
                      disabled
                      className="w-full bg-slate-800/40 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-400 cursor-not-allowed text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-300 block">Tahun Pelajaran</label>
                    <input 
                      type="text" 
                      value={tahunPelajaran}
                      onChange={(e) => setTahunPelajaran(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-300 block">Data Acuan PROTA / Topik & Alokasi JP</label>
                  <textarea
                    value={protaContent}
                    onChange={(e) => setProtaContent(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono text-[11px] leading-relaxed resize-none"
                    placeholder="Tempel rincian materi, nama bab, dan alokasi JP..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Mendistribusikan PROSEM dengan AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Susun PROSEM dengan AI Gemini</span>
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>

          {/* Kolom Kanan: Panduan Distribusi & Ringkasan */}
          <div className="lg:col-span-6 space-y-6">
            
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Petunjuk Distribusi Program Semester</h3>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1">1. Pola Pekan Kalender Pendidikan</span>
                  <p>
                    Semester Ganjil berjalan dari Juli hingga Desember (~26 pekan kalender, ~18 pekan efektif). Semester Genap berjalan dari Januari hingga Juni (~26 pekan kalender, ~17 pekan efektif).
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1">2. Mengisi Jam Pembelajaran</span>
                  <p>
                    Setiap pekan KBM efektif diisi angka <strong>4</strong> (sesuai alokasi 4 JP/pekan). Pada pekan asesmen dapat diisi simbol <strong>STS</strong>, <strong>SAS</strong>, atau <strong>SAT</strong>. Pekan libur diisi simbol <strong>L</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1">3. Fitur Auto-Jadwalkan Cepat</span>
                  <p>
                    Anda dapat menggunakan tombol <strong>⚡ Auto-Jadwalkan Pekan</strong> di tab Editor untuk memetakan seluruh baris materi secara berurutan dan otomatis pada pekan efektif tanpa perlu mengetik manual satu demi satu.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('editor')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Buka Editor PROSEM</span>
                </button>

                <button
                  onClick={handleDownloadDoc}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Unduh Word Siap Cetak</span>
                </button>
              </div>
            </div>

            {/* Quick Overview of Prosem State */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 space-y-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Ringkasan PROSEM Aktif</span>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/60 text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Satuan Pendidikan:</span>
                  <span className="font-bold text-slate-800">{prosemData.identitas.namaSekolah || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Mata Pelajaran:</span>
                  <span className="font-bold text-slate-800">{prosemData.identitas.mataPelajaran}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Kelas / Fase:</span>
                  <span className="font-bold text-slate-800">Kelas {prosemData.identitas.kelas} (Fase {prosemData.identitas.fase})</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Topik Smt 1 (Ganjil):</span>
                  <span className="font-bold text-emerald-600">{prosemData.ganjil.rows.length} Baris ({calculateSemesterTotalJp(prosemData.ganjil).totalJp} JP)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Topik Smt 2 (Genap):</span>
                  <span className="font-bold text-indigo-600">{prosemData.genap.rows.length} Baris ({calculateSemesterTotalJp(prosemData.genap).totalJp} JP)</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: 📄 PRATINJAU DOKUMEN CETAK (LANDSCAPE SIAP CETAK) */}
      {/* ======================================================== */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          
          {/* Top Preview Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-800">Pratinjau Lembar Cetak Dokumen Resmi (Format Standar Kemendikbudristek)</span>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={handleDownloadDoc}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Unduh Word (.doc)</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Cetak Lembar</span>
              </button>

              <button
                onClick={handleCopyAndGoToDocs}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Google Docs</span>
              </button>
            </div>
          </div>

          {/* Lembar Putih Pratinjau Kertas A4 Landscape */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 overflow-x-auto print-sheet font-serif">
            
            {/* KOP / JUDUL DOKUMEN RESMI */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
              <h2 className="text-sm sm:text-base font-bold text-slate-600 uppercase tracking-wider">
                {prosemData.identitas.namaSekolah ? prosemData.identitas.namaSekolah.toUpperCase() : 'PEMERINTAH DAERAH DINAS PENDIDIKAN'}
              </h2>
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                PROGRAM SEMESTER (PROSEM) KURIKULUM MERDEKA
              </h1>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                TAHUN PELAJARAN {prosemData.identitas.tahunPelajaran}
              </h3>
            </div>

            {/* TABEL IDENTITAS */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="font-bold text-slate-500 w-36 shrink-0">Satuan Pendidikan</span>
                <span className="text-slate-900 font-bold">: {prosemData.identitas.namaSekolah || '-'}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="font-bold text-slate-500 w-36 shrink-0">Alokasi per Pekan</span>
                <span className="text-slate-900 font-bold">: {prosemData.identitas.alokasiWaktuTiapMinggu || '4 JP'}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="font-bold text-slate-500 w-36 shrink-0">Mata Pelajaran</span>
                <span className="text-slate-900 font-bold">: {prosemData.identitas.mataPelajaran}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="font-bold text-slate-500 w-36 shrink-0">Tahun Pelajaran</span>
                <span className="text-slate-900 font-bold">: {prosemData.identitas.tahunPelajaran}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="font-bold text-slate-500 w-36 shrink-0">Kelas / Fase</span>
                <span className="text-slate-900 font-bold">: Kelas {prosemData.identitas.kelas} / Fase {prosemData.identitas.fase}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="font-bold text-slate-500 w-36 shrink-0">Status Kurikulum</span>
                <span className="text-slate-900 font-bold">: Kurikulum Merdeka (Keputusan Kepala BSKAP Nomor 046/H/KR/2025)</span>
              </div>
            </div>

            {/* TABEL SEMESTER 1 (GANJIL) */}
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-slate-900 uppercase">
                I. PROGRAM SEMESTER GANJIL (JULI - DESEMBER)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-900 text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 font-bold">
                      <th rowSpan={2} className="border border-slate-900 px-2 py-2 text-center w-10">NO</th>
                      <th rowSpan={2} className="border border-slate-900 px-3 py-2 w-48">UNIT / BAB</th>
                      <th rowSpan={2} className="border border-slate-900 px-3 py-2">TOPIK / MATERI PEMBELAJARAN</th>
                      <th rowSpan={2} className="border border-slate-900 px-2 py-2 text-center w-16">PERT.</th>
                      <th rowSpan={2} className="border border-slate-900 px-2 py-2 text-center w-16">ALOKASI</th>
                      {prosemData.ganjil.monthsHeader.map((m, idx) => (
                        <th 
                          key={idx} 
                          colSpan={m.totalWeeks}
                          className="border border-slate-900 px-2 py-1.5 text-center font-bold bg-slate-300 uppercase"
                        >
                          {m.monthName}
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-slate-100 text-slate-800 text-center font-bold text-[10px]">
                      {prosemData.ganjil.monthsHeader.map((m, mIdx) => {
                        const cells = [];
                        for (let w = 1; w <= m.totalWeeks; w++) {
                          const isNonEff = m.nonEffectiveWeeks.includes(w);
                          cells.push(
                            <th 
                              key={`${mIdx}-${w}`}
                              className={`border border-slate-900 px-1 py-1 w-7 ${
                                isNonEff ? 'bg-slate-300 text-slate-700' : 'bg-slate-100'
                              }`}
                            >
                              {w}
                            </th>
                          );
                        }
                        return cells;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {prosemData.ganjil.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        <td className="border border-slate-900 px-2 py-1.5 text-center font-bold text-slate-800">{row.no}</td>
                        <td className="border border-slate-900 px-2.5 py-1.5 font-bold text-slate-900">{row.bab}</td>
                        <td className="border border-slate-900 px-2.5 py-1.5 text-slate-800">{row.topik}</td>
                        <td className="border border-slate-900 px-2 py-1.5 text-center font-mono text-[10px]">{row.pertemuanKe}</td>
                        <td className="border border-slate-900 px-2 py-1.5 text-center font-bold whitespace-nowrap">{row.alokasiWaktu}</td>
                        {prosemData.ganjil.monthsHeader.map((mHeader) => {
                          const monthData = row.months.find(m => m.monthName === mHeader.monthName);
                          const cells = [];
                          for (let wNum = 1; wNum <= mHeader.totalWeeks; wNum++) {
                            const isNonEff = mHeader.nonEffectiveWeeks.includes(wNum);
                            const weekObj = monthData?.weeks.find(w => w.weekNum === wNum);
                            const val = weekObj?.value || '';

                            let bgClass = isNonEff ? 'bg-slate-100' : 'bg-white';
                            if (val.includes('L')) bgClass = 'bg-amber-100';
                            else if (val.includes('STS') || val.includes('SAS') || val.includes('MPLS')) bgClass = 'bg-blue-100';
                            else if (val) bgClass = 'bg-emerald-50';

                            cells.push(
                              <td 
                                key={`${mHeader.monthName}-${wNum}`}
                                className={`border border-slate-900 px-1 py-1 text-center font-bold text-[10px] ${bgClass}`}
                              >
                                {val}
                              </td>
                            );
                          }
                          return cells;
                        })}
                      </tr>
                    ))}
                    {/* Row Total */}
                    <tr className="bg-slate-200 font-bold text-slate-900">
                      <td colSpan={4} className="border border-slate-900 px-3 py-2 text-right">
                        TOTAL JAM PELAJARAN SEMESTER 1 (GANJIL)
                      </td>
                      <td className="border border-slate-900 px-2 py-2 text-center text-indigo-900">
                        {calculateSemesterTotalJp(prosemData.ganjil).totalJp} JP
                      </td>
                      <td colSpan={30} className="border border-slate-900 px-3 py-2 text-slate-700 font-normal">
                        Beban KBM {calculateSemesterTotalJp(prosemData.ganjil).totalPekanEfektif} Pekan Efektif
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABEL SEMESTER 2 (GENAP) */}
            <div className="space-y-2 pt-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase">
                II. PROGRAM SEMESTER GENAP (JANUARI - JUNI)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-900 text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 font-bold">
                      <th rowSpan={2} className="border border-slate-900 px-2 py-2 text-center w-10">NO</th>
                      <th rowSpan={2} className="border border-slate-900 px-3 py-2 w-48">UNIT / BAB</th>
                      <th rowSpan={2} className="border border-slate-900 px-3 py-2">TOPIK / MATERI PEMBELAJARAN</th>
                      <th rowSpan={2} className="border border-slate-900 px-2 py-2 text-center w-16">PERT.</th>
                      <th rowSpan={2} className="border border-slate-900 px-2 py-2 text-center w-16">ALOKASI</th>
                      {prosemData.genap.monthsHeader.map((m, idx) => (
                        <th 
                          key={idx} 
                          colSpan={m.totalWeeks}
                          className="border border-slate-900 px-2 py-1.5 text-center font-bold bg-slate-300 uppercase"
                        >
                          {m.monthName}
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-slate-100 text-slate-800 text-center font-bold text-[10px]">
                      {prosemData.genap.monthsHeader.map((m, mIdx) => {
                        const cells = [];
                        for (let w = 1; w <= m.totalWeeks; w++) {
                          const isNonEff = m.nonEffectiveWeeks.includes(w);
                          cells.push(
                            <th 
                              key={`${mIdx}-${w}`}
                              className={`border border-slate-900 px-1 py-1 w-7 ${
                                isNonEff ? 'bg-slate-300 text-slate-700' : 'bg-slate-100'
                              }`}
                            >
                              {w}
                            </th>
                          );
                        }
                        return cells;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {prosemData.genap.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        <td className="border border-slate-900 px-2 py-1.5 text-center font-bold text-slate-800">{row.no}</td>
                        <td className="border border-slate-900 px-2.5 py-1.5 font-bold text-slate-900">{row.bab}</td>
                        <td className="border border-slate-900 px-2.5 py-1.5 text-slate-800">{row.topik}</td>
                        <td className="border border-slate-900 px-2 py-1.5 text-center font-mono text-[10px]">{row.pertemuanKe}</td>
                        <td className="border border-slate-900 px-2 py-1.5 text-center font-bold whitespace-nowrap">{row.alokasiWaktu}</td>
                        {prosemData.genap.monthsHeader.map((mHeader) => {
                          const monthData = row.months.find(m => m.monthName === mHeader.monthName);
                          const cells = [];
                          for (let wNum = 1; wNum <= mHeader.totalWeeks; wNum++) {
                            const isNonEff = mHeader.nonEffectiveWeeks.includes(wNum);
                            const weekObj = monthData?.weeks.find(w => w.weekNum === wNum);
                            const val = weekObj?.value || '';

                            let bgClass = isNonEff ? 'bg-slate-100' : 'bg-white';
                            if (val.includes('L')) bgClass = 'bg-amber-100';
                            else if (val.includes('STS') || val.includes('SAT')) bgClass = 'bg-blue-100';
                            else if (val) bgClass = 'bg-emerald-50';

                            cells.push(
                              <td 
                                key={`${mHeader.monthName}-${wNum}`}
                                className={`border border-slate-900 px-1 py-1 text-center font-bold text-[10px] ${bgClass}`}
                              >
                                {val}
                              </td>
                            );
                          }
                          return cells;
                        })}
                      </tr>
                    ))}
                    {/* Row Total */}
                    <tr className="bg-slate-200 font-bold text-slate-900">
                      <td colSpan={4} className="border border-slate-900 px-3 py-2 text-right">
                        TOTAL JAM PELAJARAN SEMESTER 2 (GENAP)
                      </td>
                      <td className="border border-slate-900 px-2 py-2 text-center text-blue-900">
                        {calculateSemesterTotalJp(prosemData.genap).totalJp} JP
                      </td>
                      <td colSpan={30} className="border border-slate-900 px-3 py-2 text-slate-700 font-normal">
                        Beban KBM {calculateSemesterTotalJp(prosemData.genap).totalPekanEfektif} Pekan Efektif
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* KETERANGAN SIMBOL */}
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs space-y-1 text-slate-800">
              <span className="font-bold block">Keterangan Simbol & Catatan Khusus:</span>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-600">
                {prosemData.keterangan || 'Angka 4 = Alokasi 4 JP pada pekan efektif KBM.\nSTS = Sumatif Tengah Semester.\nSAS / SAT = Sumatif Akhir Semester / Akhir Tahun.\nL = Libur Semester / Libur Hari Besar Nasional.'}
              </p>
            </div>

            {/* TANDA TANGAN PENGESAHAN RESMI */}
            <div className="grid grid-cols-2 text-center text-xs text-slate-900 pt-8 border-t border-slate-200 font-serif">
              <div className="space-y-16">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-bold">Kepala {prosemData.identitas.namaSekolah || 'Sekolah Dasar'}</p>
                </div>
                <div>
                  <p className="font-bold underline text-sm">
                    {prosemData.identitas.kepalaSekolah || 'BUDI SANTOSO, S.Pd., M.M.'}
                  </p>
                  <p className="text-[11px] text-slate-700">
                    NIP. {prosemData.identitas.nipKepsek || '19750812 199903 1 002'}
                  </p>
                </div>
              </div>

              <div className="space-y-16">
                <div>
                  <p>
                    {prosemData.identitas.kota || 'Jakarta'}, {prosemData.tanggalDokumen || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="font-bold">Guru Mata Pelajaran PJOK</p>
                </div>
                <div>
                  <p className="font-bold underline text-sm">
                    {prosemData.identitas.guruMapel || 'AHMAD FAUZI, S.Pd.'}
                  </p>
                  <p className="text-[11px] text-slate-700">
                    NIP. {prosemData.identitas.nipGuru || '19880415 201502 1 003'}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: 💡 PANDUAN & KALENDER AKADEMIK */}
      {/* ======================================================== */}
      {activeTab === 'panduan' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Panduan Penyusunan Program Semester (PROSEM) Kurikulum Merdeka
                </h3>
                <p className="text-xs text-slate-500">
                  Rujukan: Standar Pembagian Alokasi Waktu Pembelajaran & Asesmen Kurikulum Merdeka
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pengertian & Fungsi PROSEM
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Program Semester (PROSEM) adalah penjabaran dari Program Tahunan (PROTA) yang memetakan tema/bab/topik pembelajaran ke dalam pekan-pekan efektif per bulan selama satu semester.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                <h4 className="font-bold text-xs text-blue-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Distribusi Pekan Tidak Efektif
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pekan tidak efektif adalah minggu di mana kegiatan belajar mengajar (KBM) tidak berjalan normal karena kegiatan sekolah (MPLS, asesmen sumatif STS/SAS/SAT, pengolahan rapor, libur semester, dan hari besar keagamaan).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
                <h4 className="font-bold text-xs text-amber-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  Pengisian Angka Jam Pelajaran
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pada setiap pekan efektif KBM, diisi angka jam mengajar mingguan (misal: <strong>4</strong>). Jika materi butuh 12 JP, maka materi tersebut diisi angka 4 pada 3 pekan berturut-turut.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <h4 className="font-bold text-xs text-indigo-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Sinkronisasi dengan RPE & PROTA
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Jumlah pekan efektif di PROSEM harus selaras dengan <strong>Rincian Pekan Efektif (RPE)</strong> dan total alokasi jam harus cocok dengan <strong>Program Tahunan (PROTA)</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Program Semester (PROSEM) PJOK"
        subtitle={`Kelas ${prosemData.identitas.kelas} (Fase ${prosemData.identitas.fase}) • Tahun Ajaran ${prosemData.identitas.tahunPelajaran}`}
        tabs={getProtaProsemPrompts('prosem', {
          kelas: prosemData.identitas.kelas,
          fase: prosemData.identitas.fase,
          tahunPelajaran: prosemData.identitas.tahunPelajaran,
          alokasiWaktuTiapMinggu: prosemData.identitas.alokasiWaktuTiapMinggu,
          protaContent
        })}
        jsonData={{
          prosemData,
          tanggalEkspor: new Date().toISOString()
        }}
        jsonFilename={`PROSEM_PJOK_Kelas_${prosemData.identitas.kelas}_${(prosemData.identitas.tahunPelajaran || '').replace(/\//g, '-')}`}
      />

    </div>
  );
}
