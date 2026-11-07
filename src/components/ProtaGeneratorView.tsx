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
  Printer,
  FileText,
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
  RefreshCw
} from 'lucide-react';
import { ProtaData, ProtaRow } from '../types';
import { 
  downloadDocFile, 
  copyAndOpenGoogleDocs, 
  exportProtaToDoc, 
  downloadJsonFile 
} from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import { fetchWithRetry } from '../lib/fetchUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getProtaProsemPrompts } from '../utils/aiPromptGenerators';
import { 
  loadSavedProta, 
  saveProtaToStorage, 
  resetProtaStorage, 
  getPresetProtaByKelas,
  recalculateProtaTotals
} from '../utils/protaPresets';

export default function ProtaGeneratorView() {
  // Main Data State (Loaded from storage or standard preset)
  const [protaData, setProtaData] = useState<ProtaData>(() => loadSavedProta());

  // Active Tab: 'editor' | 'generate' | 'preview' | 'panduan'
  const [activeTab, setActiveTab] = useState<'editor' | 'generate' | 'preview' | 'panduan'>('editor');

  // Input states for AI generation
  const [rentangProgram, setRentangProgram] = useState<'full' | 'semester_1' | 'semester_2'>('full');
  const [mataPelajaran, setMataPelajaran] = useState(protaData.identitas.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)');
  const [kelas, setKelas] = useState(protaData.identitas.kelas || '5');
  const [fase, setFase] = useState(protaData.identitas.fase || 'C');
  const [tahunPelajaran, setTahunPelajaran] = useState(protaData.identitas.tahunPelajaran || '2026/2027');
  const [totalJp2Semester, setTotalJp2Semester] = useState(protaData.identitas.totalJp2Semester || '144 JP');
  const [alokasiWaktuTiapMinggu, setAlokasiWaktuTiapMinggu] = useState(protaData.identitas.alokasiWaktuTiapMinggu || '4 JP / Pekan');
  const [semester1Weeks, setSemester1Weeks] = useState(protaData.identitas.semester1Weeks || '19');
  const [semester2Weeks, setSemester2Weeks] = useState(protaData.identitas.semester2Weeks || '17');

  const [babSemester1, setBabSemester1] = useState(
    "Bab 1: Permainan Invasi (Sepak Bola Sederhana)\n" +
    "Bab 2: Permainan Net (Bola Voli Modifikasi)\n" +
    "Bab 3: Permainan Lapangan (Kasti & Rounders)\n" +
    "Bab 4: Kebugaran Jasmani untuk Kesehatan\n" +
    "Bab 5: Pola Hidup Sehat & Pemeliharaan Alat Reproduksi"
  );
  const [babSemester2, setBabSemester2] = useState(
    "Bab 7: Senam Lantai & Ketangkasan\n" +
    "Bab 8: Gerak Berirama (Senam SKJ & Ritmik Kreasi)\n" +
    "Bab 9: Aktivitas Air & Keselamatan Diri (Renang Gaya Dada)\n" +
    "Bab 10: Kerjasama, Kepemimpinan, & Nilai Gerak\n" +
    "Bab 11: Pencegahan Penyakit Menular & Bahaya Obat Terlarang"
  );
  const [tujuanPembelajaranRaw, setTujuanPembelajaranRaw] = useState(
    "1. Peserta didik dapat mempraktikkan dan menganalisis variasi serta kombinasi pola gerak dasar menendang, menghentikan, dan menggiring bola pada permainan sepak bola sederhana.\n" +
    "2. Peserta didik dapat menunjukkan kemampuan mempraktikkan variasi pola gerak dasar passing bawah dan passing atas dalam permainan bola voli mini.\n" +
    "3. Peserta didik dapat mempraktikkan variasi gerak melempar melambung/mendatar, menangkap, dan memukul bola berayun pada permainan kasti/rounders.\n" +
    "4. Peserta didik dapat mengidentifikasi dan mempraktikkan bentuk latihan kebugaran jasmani untuk daya tahan jantung-paru dan kekuatan otot.\n" +
    "5. Peserta didik mampu memahami konsep pemeliharaan kebersihan alat reproduksi pada masa pubertas dan gizi seimbang.\n" +
    "6. Peserta didik dapat mempraktikkan kombinasi rangkaian gerak senam lantai guling depan dan sikap lilin dengan aman.\n" +
    "7. Peserta didik mampu memperagakan variasi langkah kaki dan ayunan lengan berirama mengikuti musik secara kompak.\n" +
    "8. Peserta didik dapat memahami dan mempraktikkan keterampilan gerak meluncur dan tungkai pada aktivitas air renang gaya dada."
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
    saveProtaToStorage(protaData);
    setLastSavedTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
  }, [protaData]);

  // Recalculate Totals whenever rows change
  const totals = recalculateProtaTotals(protaData.rows);
  const targetJpNum = parseInt(protaData.identitas.totalJp2Semester?.replace(/\D/g, '') || '144', 10) || 144;
  const selisihJp = totals.totalJpTahunan - targetJpNum;

  // Auto-set Fase based on Kelas
  const handleKelasChange = (val: string) => {
    setKelas(val);
    let newFase = 'C';
    if (val === '1' || val === '2') {
      newFase = 'A';
    } else if (val === '3' || val === '4') {
      newFase = 'B';
    } else if (val === '5' || val === '6') {
      newFase = 'C';
    } else if (['7', '8', '9'].includes(val)) {
      newFase = 'D';
    }
    setFase(newFase);
  };

  // Switch presets from Preset Bank
  const handleApplyPreset = (targetKelas: string) => {
    const preset = getPresetProtaByKelas(targetKelas);
    setProtaData(preset);
    setKelas(preset.identitas.kelas);
    setFase(preset.identitas.fase);
    setMataPelajaran(preset.identitas.mataPelajaran);
    setTahunPelajaran(preset.identitas.tahunPelajaran);
    setTotalJp2Semester(preset.identitas.totalJp2Semester);
    setAlokasiWaktuTiapMinggu(preset.identitas.alokasiWaktuTiapMinggu);
    setSemester1Weeks(preset.identitas.semester1Weeks);
    setSemester2Weeks(preset.identitas.semester2Weeks);
    setSaveStatus(`Preset PROTA Kelas ${targetKelas} (Fase ${preset.identitas.fase}) berhasil dimuat!`);
    setTimeout(() => setSaveStatus(null), 3500);
  };

  // Reset to default standard
  const handleResetToStandard = () => {
    if (window.confirm('Kembalikan seluruh data PROTA ke format standar Kurikulum Merdeka? Perubahan yang belum disimpan akan direset.')) {
      const standard = resetProtaStorage();
      setProtaData(standard);
      setKelas(standard.identitas.kelas);
      setFase(standard.identitas.fase);
      setSaveStatus('Data PROTA telah direset ke Standar Kurikulum Merdeka.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Generate PROTA with Gemini AI
  const handleGenerateProta = async (e: React.FormEvent) => {
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

    setIsGenerating(true);

    try {
      const response = await fetchWithRetry('/api/generate-prota', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mataPelajaran,
          kelas,
          fase,
          tahunPelajaran,
          totalJp2Semester,
          alokasiWaktuTiapMinggu,
          semester1Weeks,
          semester2Weeks,
          babSemester1: rentangProgram === 'semester_2' ? '' : babSemester1,
          babSemester2: rentangProgram === 'semester_1' ? '' : babSemester2,
          tujuanPembelajaranRaw,
          rentangProgram
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Terjadi kesalahan sistem saat memproses PROTA.');
      }

      const data: ProtaData = await response.json();
      
      // Preserve custom school identity if already filled
      const mergedData: ProtaData = {
        ...data,
        identitas: {
          ...data.identitas,
          namaSekolah: protaData.identitas.namaSekolah || 'SD Negeri Kalimantong',
          kepalaSekolah: protaData.identitas.kepalaSekolah || 'Budi Santoso, S.Pd., M.M.',
          nipKepsek: protaData.identitas.nipKepsek || '19750812 199903 1 002',
          guruMapel: protaData.identitas.guruMapel || 'Ahmad Fauzi, S.Pd.',
          nipGuru: protaData.identitas.nipGuru || '19880415 201502 1 003',
          kota: protaData.identitas.kota || 'Jakarta'
        }
      };

      setProtaData(mergedData);
      saveProtaToStorage(mergedData);
      setActiveTab('editor');
      setSaveStatus('PROTA berhasil disusun oleh AI dan siap disunting di Editor!');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Gagal menyusun Program Tahunan (PROTA). Menggunakan template standar.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handlers for Row Editing
  const handleUpdateRow = (index: number, field: keyof ProtaRow, value: string) => {
    setProtaData(prev => {
      const nextRows = [...prev.rows];
      nextRows[index] = {
        ...nextRows[index],
        [field]: value
      };
      const updatedTotals = recalculateProtaTotals(nextRows);
      return {
        ...prev,
        rows: nextRows,
        totalJpSemester1: updatedTotals.totalJpSemester1,
        totalJpSemester2: updatedTotals.totalJpSemester2,
        totalJpTahunan: updatedTotals.totalJpTahunan
      };
    });
  };

  const handleAddRow = () => {
    const isSmt2 = protaData.rows.filter(r => r.semester.toLowerCase().includes('genap') || r.semester.includes('II')).length > 0;
    const newRow: ProtaRow = {
      no: `${protaData.rows.length + 1}`,
      bab: `Bab Baru ${protaData.rows.length + 1}`,
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik dapat mempraktikkan keterampilan gerak spesifik secara terkontrol dan menyenangkan.',
      materi: 'Materi Pembelajaran Baru',
      alokasiWaktu: '8 JP (2 Pertemuan)',
      semester: isSmt2 ? 'II (Genap)' : 'I (Ganjil)',
      keterangan: 'Formatif & Praktik'
    };
    setProtaData(prev => {
      const nextRows = [...prev.rows, newRow];
      const updatedTotals = recalculateProtaTotals(nextRows);
      return {
        ...prev,
        rows: nextRows,
        totalJpSemester1: updatedTotals.totalJpSemester1,
        totalJpSemester2: updatedTotals.totalJpSemester2,
        totalJpTahunan: updatedTotals.totalJpTahunan
      };
    });
    setSaveStatus('Baris tujuan pembelajaran baru berhasil ditambahkan.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleAddAssessmentRow = (type: 'sts1' | 'sas1' | 'sat2' | 'cadangan') => {
    let newRow: ProtaRow;
    if (type === 'sts1') {
      newRow = {
        no: 'STS-1',
        bab: 'Asesmen Sumatif Tengah Semester 1 (STS)',
        elemen: 'Asesmen & Penguatan',
        tujuanPembelajaran: 'Mengukur penguasaan capaian pembelajaran Bab 1 sampai Bab 3 melalui tes tertulis dan unjuk kerja praktik gerak.',
        materi: 'Sumatif Tengah Semester 1 (Ganjil)',
        alokasiWaktu: '8 JP (2 Pertemuan)',
        semester: 'I (Ganjil)',
        keterangan: 'Asesmen Sumatif Tengah Semester'
      };
    } else if (type === 'sas1') {
      newRow = {
        no: 'SAS-1',
        bab: 'Asesmen Sumatif Akhir Semester 1 (SAS)',
        elemen: 'Asesmen & Penguatan',
        tujuanPembelajaran: 'Mengevaluasi ketercapaian seluruh tujuan pembelajaran semester ganjil, remedial, dan pengolahan rapor.',
        materi: 'Sumatif Akhir Semester 1, Remedial, & Pengayaan',
        alokasiWaktu: '8 JP (2 Pertemuan)',
        semester: 'I (Ganjil)',
        keterangan: 'Asesmen Sumatif Akhir Semester'
      };
    } else if (type === 'sat2') {
      newRow = {
        no: 'SAT-2',
        bab: 'Asesmen Sumatif Akhir Tahun (SAT)',
        elemen: 'Asesmen & Penguatan',
        tujuanPembelajaran: 'Evaluasi komprehensif ketercapaian ATP tahunan fase ini, tes kebugaran siswa, dan penentuan kenaikan kelas.',
        materi: 'Sumatif Akhir Tahun (SAT) & Pengolahan Capaian Fase',
        alokasiWaktu: '12 JP (3 Pertemuan)',
        semester: 'II (Genap)',
        keterangan: 'Asesmen Sumatif Kenaikan Kelas'
      };
    } else {
      newRow = {
        no: 'CAD',
        bab: 'Alokasi Jam Cadangan Kegiatan Sekolah',
        elemen: 'Asesmen & Penguatan',
        tujuanPembelajaran: 'Mengantisipasi jam pelajaran yang hilang karena agenda sekolah (Peringatan Hari Besar, Jeda Semester, Cuaca Buruk Lapangan).',
        materi: 'Jam Cadangan & Pengayaan Materi PJOK',
        alokasiWaktu: '4 JP (1 Pertemuan)',
        semester: 'I (Ganjil)',
        keterangan: 'Jam Cadangan'
      };
    }

    setProtaData(prev => {
      const nextRows = [...prev.rows, newRow];
      const updatedTotals = recalculateProtaTotals(nextRows);
      return {
        ...prev,
        rows: nextRows,
        totalJpSemester1: updatedTotals.totalJpSemester1,
        totalJpSemester2: updatedTotals.totalJpSemester2,
        totalJpTahunan: updatedTotals.totalJpTahunan
      };
    });
    setSaveStatus(`Baris ${newRow.bab} berhasil ditambahkan!`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDuplicateRow = (index: number) => {
    const target = protaData.rows[index];
    const duplicated: ProtaRow = {
      ...target,
      no: `${target.no} (Copy)`,
      tujuanPembelajaran: `${target.tujuanPembelajaran} (Lanjutan/Pengayaan)`
    };
    setProtaData(prev => {
      const nextRows = [...prev.rows];
      nextRows.splice(index + 1, 0, duplicated);
      const updatedTotals = recalculateProtaTotals(nextRows);
      return {
        ...prev,
        rows: nextRows,
        totalJpSemester1: updatedTotals.totalJpSemester1,
        totalJpSemester2: updatedTotals.totalJpSemester2,
        totalJpTahunan: updatedTotals.totalJpTahunan
      };
    });
    setSaveStatus('Baris berhasil diduplikat.');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleDeleteRow = (index: number) => {
    if (protaData.rows.length <= 1) {
      alert('Minimal harus terdapat 1 baris dalam Program Tahunan.');
      return;
    }
    if (window.confirm(`Hapus baris "${protaData.rows[index].bab}"?`)) {
      setProtaData(prev => {
        const nextRows = prev.rows.filter((_, i) => i !== index);
        const updatedTotals = recalculateProtaTotals(nextRows);
        return {
          ...prev,
          rows: nextRows,
          totalJpSemester1: updatedTotals.totalJpSemester1,
          totalJpSemester2: updatedTotals.totalJpSemester2,
          totalJpTahunan: updatedTotals.totalJpTahunan
        };
      });
      setSaveStatus('Baris berhasil dihapus.');
      setTimeout(() => setSaveStatus(null), 2500);
    }
  };

  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === protaData.rows.length - 1)) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setProtaData(prev => {
      const nextRows = [...prev.rows];
      const temp = nextRows[index];
      nextRows[index] = nextRows[targetIndex];
      nextRows[targetIndex] = temp;
      return {
        ...prev,
        rows: nextRows
      };
    });
  };

  // Re-number rows neatly
  const handleRenumberRows = () => {
    let countSmt1 = 1;
    let countSmt2 = 1;
    const renumbered = protaData.rows.map(row => {
      const sem = row.semester.toLowerCase();
      if (sem.includes('1') || sem.includes('ganjil') || sem.includes('i')) {
        const no = `1.${countSmt1++}`;
        return { ...row, no };
      } else {
        const no = `2.${countSmt2++}`;
        return { ...row, no };
      }
    });
    setProtaData(prev => ({ ...prev, rows: renumbered }));
    setSaveStatus('Nomor urut baris berhasil dirapikan otomatis.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Update Identitas Sekolah
  const handleUpdateIdentitas = (field: keyof ProtaData['identitas'], value: string) => {
    setProtaData(prev => ({
      ...prev,
      identitas: {
        ...prev.identitas,
        [field]: value
      }
    }));
  };

  // Download Word (.doc) with clean borders & print-ready layout
  const handleDownloadDoc = () => {
    const docHtml = exportProtaToDoc(protaData);
    const filename = `PROTA_${protaData.identitas.mataPelajaran.replace(/\s+/g, '_')}_Kelas${protaData.identitas.kelas}_${(protaData.identitas.tahunPelajaran || '').replace(/\//g, '-')}`;
    downloadDocFile(filename, docHtml);
    setSaveStatus('Dokumen Word (.doc) berhasil diunduh dalam keadaan tabel rapi & siap cetak!');
    setTimeout(() => setSaveStatus(null), 4000);
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docHtml = exportProtaToDoc(protaData);
      const filename = `PROTA_${protaData.identitas.mataPelajaran.replace(/\s+/g, '_')}_Kelas${protaData.identitas.kelas}`;
      const success = await downloadHtmlAsPdf(filename, docHtml, {
        title: `PROTA - ${protaData.identitas.mataPelajaran}`,
        orientation: 'landscape'
      });
      if (!success) {
        printHtmlDocument(docHtml, `PROTA - ${protaData.identitas.mataPelajaran}`);
      }
    } catch (err) {
      console.error(err);
      const docHtml = exportProtaToDoc(protaData);
      printHtmlDocument(docHtml, `PROTA - ${protaData.identitas.mataPelajaran}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print
  const handlePrint = () => {
    const docHtml = exportProtaToDoc(protaData);
    printHtmlDocument(docHtml, `PROTA - ${protaData.identitas.mataPelajaran}`);
  };

  // Copy to Google Docs
  const handleCopyAndGoToDocs = async () => {
    setCopySuccess(false);
    const docHtml = exportProtaToDoc(protaData);
    const success = await copyAndOpenGoogleDocs(docHtml);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  // Copy as Excel TSV
  const handleCopyExcel = () => {
    let tsv = `PROGRAM TAHUNAN (PROTA) KURIKULUM MERDEKA\n`;
    tsv += `Satuan Pendidikan\t${protaData.identitas.namaSekolah || '-'}\n`;
    tsv += `Mata Pelajaran\t${protaData.identitas.mataPelajaran}\n`;
    tsv += `Kelas / Fase\tKelas ${protaData.identitas.kelas} / Fase ${protaData.identitas.fase}\n`;
    tsv += `Tahun Pelajaran\t${protaData.identitas.tahunPelajaran}\n`;
    tsv += `Total Alokasi JP\t${protaData.identitas.totalJp2Semester}\n\n`;

    tsv += `No\tBab / Unit\tElemen CP\tTujuan Pembelajaran\tLingkup Materi\tAlokasi Waktu\tSemester\tKeterangan\n`;
    protaData.rows.forEach(r => {
      tsv += `${r.no}\t${r.bab}\t${r.elemen || '-'}\t${r.tujuanPembelajaran}\t${r.materi}\t${r.alokasiWaktu}\t${r.semester}\t${r.keterangan || '-'}\n`;
    });
    tsv += `\nTotal JP Smt 1\t${totals.totalJpSemester1} JP\n`;
    tsv += `Total JP Smt 2\t${totals.totalJpSemester2} JP\n`;
    tsv += `Total JP Tahunan\t${totals.totalJpTahunan} JP\n`;

    navigator.clipboard.writeText(tsv).then(() => {
      setSaveStatus('Tabel PROTA berhasil disalin ke clipboard! Siap di-paste ke Microsoft Excel atau Google Spreadsheet.');
      setTimeout(() => setSaveStatus(null), 4000);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER UTAMA & STATUS BAR */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl shadow-md shadow-indigo-100">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Program Tahunan (PROTA) Kurikulum Merdeka
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Lengkap & Dapat Diedit
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Perencanaan Alokasi Waktu Pembelajaran 1 Tahun Lengkap (Fase A, B, C) • Sesuai Keputusan Kepala BSKAP Nomor 046/H/KR/2025 & Permendikdasmen No. 13 Tahun 2025
              </p>
            </div>
          </div>

          {/* Quick Global Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleDownloadDoc}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
              title="Unduh dokumen Word dengan tabel rapi bergaris hitam dan siap cetak"
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
              title="Salin tabel TSV untuk ditempel ke Excel atau Google Spreadsheet"
            >
              <Table className="w-4 h-4 text-emerald-600" />
              <span>Salin ke Excel</span>
            </button>

            <ExportJsonPromptAiButtons
              variant="compact"
              onExportJson={() => {
                downloadJsonFile(`PROTA_PJOK_Kelas_${protaData.identitas.kelas}_${(protaData.identitas.tahunPelajaran || '').replace(/\//g, '-')}`, {
                  protaData,
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
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>✏️ 1. Editor PROTA Lengkap</span>
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
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>💡 4. Panduan & Matriks JP</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Tersimpan otomatis ({lastSavedTime})</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ✏️ EDITOR PROTA LENGKAP (FULL INTERACTIVE TABLE) */}
      {/* ======================================================== */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          
          {/* Quick Preset Selector Bar */}
          <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 rounded-2xl p-4 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">Muat Cepat Preset Resmi Kurikulum Merdeka:</span>
            </div>
            <div className="flex items-center flex-wrap gap-1.5">
              {[
                { k: '1', label: 'Kelas 1 (Fase A)' },
                { k: '2', label: 'Kelas 2 (Fase A)' },
                { k: '4', label: 'Kelas 4 (Fase B)' },
                { k: '5', label: 'Kelas 5 (Fase C)' }
              ].map(item => (
                <button
                  key={item.k}
                  onClick={() => handleApplyPreset(item.k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    protaData.identitas.kelas === item.k
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION IDENTITAS SEKOLAH & GURU (EDITABLE ACCORDION / GRID) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Identitas Sekolah, Kurikulum, & Penandatanganan</h3>
              </div>
              <span className="text-[11px] text-slate-400">Data otomatis terhubung ke kop dokumen & tanda tangan Word/PDF</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Nama Sekolah</label>
                <input
                  type="text"
                  value={protaData.identitas.namaSekolah || ''}
                  onChange={(e) => handleUpdateIdentitas('namaSekolah', e.target.value)}
                  placeholder="SD Negeri Kalimantong"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Mata Pelajaran</label>
                <input
                  type="text"
                  value={protaData.identitas.mataPelajaran || ''}
                  onChange={(e) => handleUpdateIdentitas('mataPelajaran', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Kelas & Fase</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={protaData.identitas.kelas}
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  >
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(k => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={`Fase ${protaData.identitas.fase}`}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-500 text-center cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Tahun Pelajaran</label>
                <input
                  type="text"
                  value={protaData.identitas.tahunPelajaran || '2026/2027'}
                  onChange={(e) => handleUpdateIdentitas('tahunPelajaran', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Beban Belajar per Pekan</label>
                <input
                  type="text"
                  value={protaData.identitas.alokasiWaktuTiapMinggu || '4 JP / Pekan'}
                  onChange={(e) => handleUpdateIdentitas('alokasiWaktuTiapMinggu', e.target.value)}
                  placeholder="4 JP / Pekan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Target Alokasi JP Tahunan</label>
                <input
                  type="text"
                  value={protaData.identitas.totalJp2Semester || '144 JP'}
                  onChange={(e) => handleUpdateIdentitas('totalJp2Semester', e.target.value)}
                  placeholder="144 JP"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Pekan Smt 1 (Ganjil)</label>
                <input
                  type="number"
                  value={protaData.identitas.semester1Weeks || '19'}
                  onChange={(e) => handleUpdateIdentitas('semester1Weeks', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Pekan Smt 2 (Genap)</label>
                <input
                  type="number"
                  value={protaData.identitas.semester2Weeks || '17'}
                  onChange={(e) => handleUpdateIdentitas('semester2Weeks', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Kepala Sekolah</label>
                <input
                  type="text"
                  value={protaData.identitas.kepalaSekolah || ''}
                  onChange={(e) => handleUpdateIdentitas('kepalaSekolah', e.target.value)}
                  placeholder="Nama Kepala Sekolah beserta gelar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={protaData.identitas.nipKepsek || ''}
                  onChange={(e) => handleUpdateIdentitas('nipKepsek', e.target.value)}
                  placeholder="1975..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Guru Mata Pelajaran</label>
                <input
                  type="text"
                  value={protaData.identitas.guruMapel || ''}
                  onChange={(e) => handleUpdateIdentitas('guruMapel', e.target.value)}
                  placeholder="Nama Guru PJOK beserta gelar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">NIP Guru</label>
                <input
                  type="text"
                  value={protaData.identitas.nipGuru || ''}
                  onChange={(e) => handleUpdateIdentitas('nipGuru', e.target.value)}
                  placeholder="1988..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Kota / Tempat Pengesahan</label>
                <input
                  type="text"
                  value={protaData.identitas.kota || 'Jakarta'}
                  onChange={(e) => handleUpdateIdentitas('kota', e.target.value)}
                  placeholder="Jakarta / Bandung / Surabaya"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1 sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-600">Tanggal Pengesahan Dokumen</label>
                <input
                  type="text"
                  value={protaData.tanggalDokumen || 'Jakarta, 13 Juli 2026'}
                  onChange={(e) => setProtaData(prev => ({ ...prev, tanggalDokumen: e.target.value }))}
                  placeholder="Contoh: Jakarta, 13 Juli 2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* SUMMARY STATS CARD (REAL-TIME JP TOTALS) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Semester 1 (Ganjil)</span>
                <span className="text-xl font-extrabold text-indigo-700">{totals.totalJpSemester1} JP</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  ≈ {Math.round(totals.totalJpSemester1 / 4)} Pekan Efektif
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                S1
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Semester 2 (Genap)</span>
                <span className="text-xl font-extrabold text-blue-700">{totals.totalJpSemester2} JP</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  ≈ {Math.round(totals.totalJpSemester2 / 4)} Pekan Efektif
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                S2
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total 1 Tahun Penuh</span>
                <span className="text-xl font-extrabold text-slate-900">{totals.totalJpTahunan} JP</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Dari Target {targetJpNum} JP
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                TOT
              </div>
            </div>

            <div className={`rounded-2xl p-4 border shadow-xs flex items-center justify-between ${
              selisihJp === 0 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : selisihJp > 0
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block">Status Keselarasan JP</span>
                <span className="text-sm font-bold block mt-0.5">
                  {selisihJp === 0 
                    ? '✅ 100% Pas Seimbang' 
                    : selisihJp > 0 
                    ? `⚠️ Kelebihan +${selisihJp} JP` 
                    : `⚠️ Kurang ${selisihJp} JP`}
                </span>
                <span className="text-[10px] opacity-80 block">
                  {selisihJp === 0 ? 'Sesuai beban kurikulum merdeka' : 'Sesuaikan jam materi di bawah'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/60">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* MAIN PROTA TABLE EDITOR */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <Table className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Tabel Interaktif Program Tahunan ({protaData.rows.length} Alur Tujuan Pembelajaran)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klik langsung pada kolom untuk mengubah nomor, nama bab, elemen CP, kalimat TP, materi pokok, alokasi JP, dan semester.
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={handleRenumberRows}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  title="Otomatis rapikan nomor urut 1.1, 1.2 ... untuk Smt 1 dan 2.1, 2.2 ... untuk Smt 2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Rapikan No Urut</span>
                </button>

                <button
                  onClick={handleAddRow}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Baris TP</span>
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="px-3 py-3 w-14 text-center">No</th>
                    <th className="px-3 py-3 w-56">Bab / Unit & Elemen CP</th>
                    <th className="px-3 py-3 min-w-[280px]">Tujuan Pembelajaran (TP) Lengkap</th>
                    <th className="px-3 py-3 w-48">Lingkup Materi Pokok</th>
                    <th className="px-3 py-3 w-32 text-center">Alokasi Waktu</th>
                    <th className="px-3 py-3 w-28 text-center">Semester</th>
                    <th className="px-3 py-3 w-32">Keterangan</th>
                    <th className="px-3 py-3 w-24 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {protaData.rows.map((row, idx) => {
                    const isSmt1 = row.semester.toLowerCase().includes('1') || row.semester.toLowerCase().includes('ganjil') || row.semester.includes('I');
                    return (
                      <tr 
                        key={idx} 
                        className={`hover:bg-slate-50/80 transition-colors align-top ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                      >
                        {/* No */}
                        <td className="px-2.5 py-2.5 text-center">
                          <input
                            type="text"
                            value={row.no}
                            onChange={(e) => handleUpdateRow(idx, 'no', e.target.value)}
                            className="w-10 text-center font-bold bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded p-1 text-slate-700 focus:bg-white transition"
                          />
                        </td>

                        {/* Bab & Elemen */}
                        <td className="px-2.5 py-2.5 space-y-1.5">
                          <input
                            type="text"
                            value={row.bab}
                            onChange={(e) => handleUpdateRow(idx, 'bab', e.target.value)}
                            className="w-full font-bold text-slate-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded p-1 focus:bg-white transition"
                            placeholder="Nama Bab..."
                          />
                          <select
                            value={row.elemen || 'Terampil Bergerak'}
                            onChange={(e) => handleUpdateRow(idx, 'elemen', e.target.value)}
                            className="w-full text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Terampil Bergerak">Elemen Terampil Bergerak</option>
                            <option value="Belajar Melalui Gerak">Elemen Belajar Melalui Gerak</option>
                            <option value="Bergaya Hidup Aktif">Elemen Bergaya Hidup Aktif</option>
                            <option value="Memilih Hidup yang Menyehatkan">Elemen Memilih Hidup yang Menyehatkan</option>
                            <option value="Asesmen & Penguatan">Asesmen & Jam Cadangan</option>
                          </select>
                        </td>

                        {/* Tujuan Pembelajaran (TP) */}
                        <td className="px-2.5 py-2.5">
                          <textarea
                            value={row.tujuanPembelajaran}
                            onChange={(e) => handleUpdateRow(idx, 'tujuanPembelajaran', e.target.value)}
                            rows={3}
                            className="w-full text-slate-800 leading-relaxed bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded-lg p-1.5 focus:bg-white resize-y transition"
                            placeholder="Rumusan kalimat Tujuan Pembelajaran..."
                          />
                        </td>

                        {/* Lingkup Materi */}
                        <td className="px-2.5 py-2.5">
                          <textarea
                            value={row.materi}
                            onChange={(e) => handleUpdateRow(idx, 'materi', e.target.value)}
                            rows={2}
                            className="w-full text-slate-600 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded-lg p-1.5 focus:bg-white resize-y transition"
                            placeholder="Materi pokok..."
                          />
                        </td>

                        {/* Alokasi Waktu */}
                        <td className="px-2.5 py-2.5 text-center">
                          <input
                            type="text"
                            value={row.alokasiWaktu}
                            onChange={(e) => handleUpdateRow(idx, 'alokasiWaktu', e.target.value)}
                            className="w-full text-center font-bold text-indigo-700 bg-indigo-50/50 border border-indigo-100 hover:border-indigo-300 focus:border-indigo-600 rounded-lg py-1.5 px-1 focus:bg-white transition"
                            placeholder="12 JP"
                          />
                        </td>

                        {/* Semester */}
                        <td className="px-2.5 py-2.5 text-center">
                          <select
                            value={row.semester}
                            onChange={(e) => handleUpdateRow(idx, 'semester', e.target.value)}
                            className={`w-full text-center font-bold text-[11px] rounded-lg py-1 px-1 border transition ${
                              isSmt1 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            <option value="I (Ganjil)">I (Ganjil)</option>
                            <option value="II (Genap)">II (Genap)</option>
                          </select>
                        </td>

                        {/* Keterangan */}
                        <td className="px-2.5 py-2.5">
                          <input
                            type="text"
                            value={row.keterangan || ''}
                            onChange={(e) => handleUpdateRow(idx, 'keterangan', e.target.value)}
                            className="w-full text-slate-500 text-[11px] bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded p-1 focus:bg-white transition"
                            placeholder="Formatif / Sumatif..."
                          />
                        </td>

                        {/* Action Buttons */}
                        <td className="px-2 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleMoveRow(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition"
                              title="Pindah ke Atas"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveRow(idx, 'down')}
                              disabled={idx === protaData.rows.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition"
                              title="Pindah ke Bawah"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateRow(idx)}
                              className="p-1 text-slate-400 hover:text-indigo-600 transition"
                              title="Duplikat Baris Ini"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition"
                              title="Hapus Baris"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Table Footer Totals */}
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                    <td colSpan={4} className="px-4 py-2.5 text-right font-bold text-xs">
                      Total Jam Pelajaran Semester 1 (Ganjil):
                    </td>
                    <td className="px-3 py-2.5 text-center font-extrabold text-indigo-700 text-sm">
                      {totals.totalJpSemester1} JP
                    </td>
                    <td colSpan={3} className="px-3 py-2.5 text-xs text-slate-500 font-normal">
                      Target ~{Math.round(totals.totalJpSemester1 / 4)} Pekan Efektif
                    </td>
                  </tr>

                  <tr className="bg-slate-100 font-bold text-slate-800 border-t border-slate-200">
                    <td colSpan={4} className="px-4 py-2.5 text-right font-bold text-xs">
                      Total Jam Pelajaran Semester 2 (Genap):
                    </td>
                    <td className="px-3 py-2.5 text-center font-extrabold text-blue-700 text-sm">
                      {totals.totalJpSemester2} JP
                    </td>
                    <td colSpan={3} className="px-3 py-2.5 text-xs text-slate-500 font-normal">
                      Target ~{Math.round(totals.totalJpSemester2 / 4)} Pekan Efektif
                    </td>
                  </tr>

                  <tr className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-900">
                    <td colSpan={4} className="px-4 py-3 text-right text-xs tracking-wider uppercase">
                      Total Jam Pelajaran Tahunan (Semester 1 + Semester 2):
                    </td>
                    <td className="px-3 py-3 text-center text-base text-amber-400">
                      {totals.totalJpTahunan} JP
                    </td>
                    <td colSpan={3} className="px-3 py-3 text-xs text-slate-300 font-medium">
                      {selisihJp === 0 
                        ? '✅ Sesuai dengan Struktur Kurikulum Merdeka (144 JP)' 
                        : `Target ${targetJpNum} JP (${selisihJp > 0 ? `+${selisihJp}` : selisihJp} JP)`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Quick Add Bar below table */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-600">Tambah Cepat:</span>
                <button
                  onClick={handleAddRow}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>+ Baris TP Pembelajaran</span>
                </button>

                <button
                  onClick={() => handleAddAssessmentRow('sts1')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ Sumatif Tengah Semester (STS) Smt 1</span>
                </button>

                <button
                  onClick={() => handleAddAssessmentRow('sas1')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ Sumatif Akhir Semester (SAS) Smt 1</span>
                </button>

                <button
                  onClick={() => handleAddAssessmentRow('sat2')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Sumatif Akhir Tahun (SAT) Smt 2</span>
                </button>

                <button
                  onClick={() => handleAddAssessmentRow('cadangan')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-600" />
                  <span>+ Jam Cadangan</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
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
                <h4 className="font-bold text-sm text-slate-900">Download Word Siap Cetak</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Tabel PROTA akan diekspor dalam format dokumen Microsoft Word (.doc) lengkap dengan garis tabel tegas, batas kolom yang proporsional, layout landscape, kop sekolah resmi, dan kolom tanda tangan pengesahan.
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
      {/* TAB 2: ⚡ GENERATE OTOMATIS (INSTAN & AI GEMINI) */}
      {/* ======================================================== */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Kolom Kiri: Form Generator Cepat & AI */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Card 1: Generate Instan Template Kurikulum Merdeka */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Mode 1: Generate Instan Standar BSKAP Nomor 046/H/KR/2025</h3>
                  <p className="text-xs text-slate-500">Pilih kelas dan otomatis hasilkan seluruh materi & TP 1 tahun</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { k: '1', title: 'Kelas 1 SD', fase: 'Fase A', desc: 'Gerak dasar lokomotor, senam irama ceria & kebersihan' },
                  { k: '2', title: 'Kelas 2 SD', fase: 'Fase A', desc: 'Kombinasi gerak dasar & aktivitas permainan anak' },
                  { k: '3', title: 'Kelas 3 SD', fase: 'Fase B', desc: 'Permainan bola besar/kecil & atletik anak' },
                  { k: '4', title: 'Kelas 4 SD', fase: 'Fase B', desc: 'Variasi manipulatif, senam ketangkasan & kebugaran' },
                  { k: '5', title: 'Kelas 5 SD', fase: 'Fase C', desc: 'Sepak bola, voli, kasti, senam lantai & pubertas' },
                  { k: '6', title: 'Kelas 6 SD', fase: 'Fase C', desc: 'Kombinasi kompleks, renang, P3K & uji kebugaran' },
                ].map(item => (
                  <button
                    key={item.k}
                    onClick={() => {
                      handleApplyPreset(item.k);
                      setActiveTab('editor');
                    }}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      protaData.identitas.kelas === item.k
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
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
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-indigo-600 font-bold">
                      <span>Terapkan Preset</span>
                      <span>⚡ 144 JP</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Card 2: Generate Custom dengan AI Gemini */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Mode 2: Generate Kustom AI Gemini</h3>
                  <p className="text-[11px] text-slate-300">Susun PROTA otomatis dari daftar bab & tujuan Anda sendiri</p>
                </div>
              </div>

              <form onSubmit={handleGenerateProta} className="space-y-4 pt-1">
                {validationError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-200 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Rentang Program Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Rentang Program</label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setRentangProgram('full')}
                      className={`px-2 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        rentangProgram === 'full' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      1 Tahun Penuh
                    </button>
                    <button
                      type="button"
                      onClick={() => setRentangProgram('semester_1')}
                      className={`px-2 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        rentangProgram === 'semester_1' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Smt 1 (Ganjil)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRentangProgram('semester_2')}
                      className={`px-2 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        rentangProgram === 'semester_2' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Smt 2 (Genap)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-300 block">Kelas</label>
                    <select
                      value={kelas}
                      onChange={(e) => handleKelasChange(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-300 block">Daftar Bab Semester 1</label>
                  <textarea
                    value={babSemester1}
                    onChange={(e) => setBabSemester1(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-300 block">Daftar Bab Semester 2</label>
                  <textarea
                    value={babSemester2}
                    onChange={(e) => setBabSemester2(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-300 block">Daftar Tujuan Pembelajaran (ATP)</label>
                  <textarea
                    value={tujuanPembelajaranRaw}
                    onChange={(e) => setTujuanPembelajaranRaw(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Menyusun PROTA dengan AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      <span>Susun PROTA dengan AI Gemini</span>
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>

          {/* Kolom Kanan: Panduan Cepat & Quick Actions */}
          <div className="lg:col-span-6 space-y-6">
            
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Petunjuk Pembuatan PROTA Otomatis</h3>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1">1. Alokasi Waktu Resmi Kurikulum Merdeka</span>
                  <p>
                    Muatan wajib PJOK jenjang SD adalah <strong>4 JP per pekan</strong>. Dalam 1 tahun ajaran (36 pekan efektif), total alokasi waktu ideal adalah <strong>144 JP</strong> (72 JP untuk Semester 1 dan 72 JP untuk Semester 2).
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1">2. 4 Elemen Pembelajaran PJOK</span>
                  <p>
                    Pastikan setiap bab mencakup keempat elemen: <strong>Terampil Bergerak</strong>, <strong>Belajar Melalui Gerak</strong>, <strong>Bergaya Hidup Aktif</strong>, serta <strong>Memilih Hidup yang Menyehatkan</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1">3. Fleksibilitas Pengeditan Penuh</span>
                  <p>
                    Setelah digenerate otomatis atau memilih preset, Anda dapat masuk ke tab <strong>✏️ 1. Editor PROTA Lengkap</strong> untuk mengubah teks, menambah asesmen, ataupun menyesuaikan jam mengajar secara leluasa.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('editor')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Buka Editor PROTA</span>
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

            {/* Quick Overview of Current Prota */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 space-y-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Data PROTA Aktif Saat Ini</span>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/60 text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Satuan Pendidikan:</span>
                  <span className="font-bold text-slate-800">{protaData.identitas.namaSekolah || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Mata Pelajaran:</span>
                  <span className="font-bold text-slate-800">{protaData.identitas.mataPelajaran}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Tingkat / Fase:</span>
                  <span className="font-bold text-slate-800">Kelas {protaData.identitas.kelas} / Fase {protaData.identitas.fase}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Jumlah Bab / ATP:</span>
                  <span className="font-bold text-indigo-600">{protaData.rows.length} Baris</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Alokasi JP:</span>
                  <span className="font-extrabold text-slate-900">{totals.totalJpTahunan} JP</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: 📄 PRATINJAU DOKUMEN RESMI SIAP CETAK */}
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 overflow-x-auto print-sheet">
            
            {/* KOP / JUDUL DOKUMEN RESMI */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
              <h2 className="text-sm sm:text-base font-bold text-slate-600 uppercase tracking-wider">
                {protaData.identitas.namaSekolah ? protaData.identitas.namaSekolah.toUpperCase() : 'PEMERINTAH DAERAH DINAS PENDIDIKAN'}
              </h2>
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                PROGRAM TAHUNAN (PROTA) KURIKULUM MERDEKA
              </h1>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                TAHUN PELAJARAN {protaData.identitas.tahunPelajaran}
              </h3>
            </div>

            {/* TABEL IDENTITAS SEKOLAH */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="font-bold text-slate-500 w-36 shrink-0">Satuan Pendidikan</span>
                <span className="text-slate-900 font-bold">: {protaData.identitas.namaSekolah || '-'}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="font-bold text-slate-500 w-36 shrink-0">Beban Belajar per Pekan</span>
                <span className="text-slate-900 font-bold">: {protaData.identitas.alokasiWaktuTiapMinggu}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="font-bold text-slate-500 w-36 shrink-0">Mata Pelajaran</span>
                <span className="text-slate-900 font-bold">: {protaData.identitas.mataPelajaran}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="font-bold text-slate-500 w-36 shrink-0">Pekan Efektif Smt 1 / 2</span>
                <span className="text-slate-900 font-bold">: {protaData.identitas.semester1Weeks} Pekan / {protaData.identitas.semester2Weeks} Pekan</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="font-bold text-slate-500 w-36 shrink-0">Kelas / Fase</span>
                <span className="text-slate-900 font-bold">: Kelas {protaData.identitas.kelas} / Fase {protaData.identitas.fase}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="font-bold text-slate-500 w-36 shrink-0">Total Target Alokasi JP</span>
                <span className="text-slate-900 font-bold">: {protaData.identitas.totalJp2Semester}</span>
              </div>
            </div>

            {/* TABEL CETAK UTAMA */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-900 text-left text-xs font-serif">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                    <th className="border border-slate-900 px-3 py-2 text-center w-12">NO</th>
                    <th className="border border-slate-900 px-3 py-2 w-52">BAB / UNIT & ELEMEN CP</th>
                    <th className="border border-slate-900 px-3 py-2">TUJUAN PEMBELAJARAN (TP)</th>
                    <th className="border border-slate-900 px-3 py-2 w-44">LINGKUP MATERI</th>
                    <th className="border border-slate-900 px-3 py-2 text-center w-24">ALOKASI WAKTU</th>
                    <th className="border border-slate-900 px-3 py-2 text-center w-24">SEMESTER</th>
                    <th className="border border-slate-900 px-3 py-2 w-28">KET.</th>
                  </tr>
                </thead>
                <tbody>
                  {protaData.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 align-top">
                      <td className="border border-slate-900 px-3 py-2 text-center font-bold text-slate-800">{row.no}</td>
                      <td className="border border-slate-900 px-3 py-2 font-bold text-slate-900">
                        {row.bab}
                        {row.elemen && (
                          <div className="text-[10px] font-normal italic text-slate-600 mt-0.5">
                            Elemen: {row.elemen}
                          </div>
                        )}
                      </td>
                      <td className="border border-slate-900 px-3 py-2 text-slate-900 leading-relaxed text-justify">
                        {row.tujuanPembelajaran}
                      </td>
                      <td className="border border-slate-900 px-3 py-2 text-slate-700 italic">
                        {row.materi}
                      </td>
                      <td className="border border-slate-900 px-3 py-2 text-center font-bold text-slate-900 whitespace-nowrap">
                        {row.alokasiWaktu}
                      </td>
                      <td className="border border-slate-900 px-3 py-2 text-center font-semibold text-slate-800 whitespace-nowrap">
                        {row.semester}
                      </td>
                      <td className="border border-slate-900 px-3 py-2 text-slate-600 text-[11px]">
                        {row.keterangan || '-'}
                      </td>
                    </tr>
                  ))}

                  {/* REKAPITULASI TOTAL ALOKASI WAKTU */}
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <td colSpan={4} className="border border-slate-900 px-3 py-2 text-right">
                      TOTAL ALOKASI WAKTU SEMESTER 1 (GANJIL)
                    </td>
                    <td colSpan={3} className="border border-slate-900 px-3 py-2 text-center text-indigo-900">
                      {totals.totalJpSemester1} Jam Pelajaran (JP)
                    </td>
                  </tr>

                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <td colSpan={4} className="border border-slate-900 px-3 py-2 text-right">
                      TOTAL ALOKASI WAKTU SEMESTER 2 (GENAP)
                    </td>
                    <td colSpan={3} className="border border-slate-900 px-3 py-2 text-center text-blue-900">
                      {totals.totalJpSemester2} Jam Pelajaran (JP)
                    </td>
                  </tr>

                  <tr className="bg-slate-200 font-extrabold text-slate-900">
                    <td colSpan={4} className="border border-slate-900 px-3 py-2.5 text-right text-xs">
                      TOTAL ALOKASI WAKTU TAHUNAN (SEMESTER 1 + SEMESTER 2)
                    </td>
                    <td colSpan={3} className="border border-slate-900 px-3 py-2.5 text-center text-sm">
                      {totals.totalJpTahunan} Jam Pelajaran (JP)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TANDA TANGAN PENGESAHAN RESMI */}
            <div className="grid grid-cols-2 text-center text-xs text-slate-900 pt-8 border-t border-slate-200 font-serif">
              <div className="space-y-16">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-bold">Kepala {protaData.identitas.namaSekolah || 'Sekolah Dasar'}</p>
                </div>
                <div>
                  <p className="font-bold underline text-sm">
                    {protaData.identitas.kepalaSekolah || 'BUDI SANTOSO, S.Pd., M.M.'}
                  </p>
                  <p className="text-[11px] text-slate-700">
                    NIP. {protaData.identitas.nipKepsek || '19750812 199903 1 002'}
                  </p>
                </div>
              </div>

              <div className="space-y-16">
                <div>
                  <p>
                    {protaData.identitas.kota || 'Jakarta'}, {protaData.tanggalDokumen || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="font-bold">Guru Mata Pelajaran PJOK</p>
                </div>
                <div>
                  <p className="font-bold underline text-sm">
                    {protaData.identitas.guruMapel || 'AHMAD FAUZI, S.Pd.'}
                  </p>
                  <p className="text-[11px] text-slate-700">
                    NIP. {protaData.identitas.nipGuru || '19880415 201502 1 003'}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: 💡 PANDUAN & MATRIKS KURIKULUM MERDEKA */}
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
                  Panduan Lengkap Penyusunan Program Tahunan (PROTA) Kurikulum Merdeka
                </h3>
                <p className="text-xs text-slate-500">
                  Rujukan Resmi: Keputusan Kepala BSKAP Nomor 046/H/KR/2025 & Permendikdasmen No. 13 Tahun 2025
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <h4 className="font-bold text-xs text-indigo-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Kedudukan PROTA dalam Alur Perencanaan
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Program Tahunan (PROTA) merupakan rancangan penetapan alokasi waktu satu tahun ajaran untuk mencapai seluruh Alur Tujuan Pembelajaran (ATP) yang telah ditetapkan. PROTA menjadi induk penurunan ke <strong>Program Semester (PROSEM)</strong> dan <strong>Modul Ajar</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                <h4 className="font-bold text-xs text-blue-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Struktur Jam Pelajaran (JP) PJOK SD
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sesuai struktur kurikulum, alokasi PJOK SD adalah <strong>4 JP per pekan</strong> (atau 3 JP intrakurikuler + 1 JP kokurikuler P5 pada beberapa madrasah/sekolah). Dengan 36 pekan efektif setahun, totalnya adalah <strong>144 JP</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
                <h4 className="font-bold text-xs text-amber-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  4 Elemen Utama PJOK
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dalam menyusun bab materi, pastikan memetakan: <strong>Terampil Bergerak</strong> (keterampilan gerak spesifik/permainan), <strong>Belajar Melalui Gerak</strong> (sikap sportivitas/karakter), <strong>Bergaya Hidup Aktif</strong> (kebugaran jasmani), dan <strong>Memilih Hidup yang Menyehatkan</strong> (kesehatan diri).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Alokasi Asesmen & Jam Cadangan
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Guru dianjurkan menyisihkan <strong>10% - 15% dari total jam efektif</strong> untuk Sumatif Tengah Semester (STS), Sumatif Akhir Semester (SAS/SAT), remedial, dan cadangan antisipasi hari libur atau cuaca ekstrem.
                </p>
              </div>
            </div>

            {/* Hubungan Antar Dokumen */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800">Alur Penyusunan Administrasi Guru PJOK:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs font-semibold text-slate-700">
                  <span className="text-[10px] text-indigo-600 font-bold block mb-1">Langkah 1</span>
                  Capaian Pembelajaran (CP)
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs font-semibold text-slate-700">
                  <span className="text-[10px] text-indigo-600 font-bold block mb-1">Langkah 2</span>
                  Tujuan Pembelajaran (TP)
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs font-semibold text-slate-700">
                  <span className="text-[10px] text-indigo-600 font-bold block mb-1">Langkah 3</span>
                  Rincian Pekan Efektif (RPE)
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 shadow-2xs font-bold text-indigo-700">
                  <span className="text-[10px] text-indigo-600 font-bold block mb-1">Langkah 4</span>
                  Program Tahunan (PROTA)
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs font-semibold text-slate-700">
                  <span className="text-[10px] text-indigo-600 font-bold block mb-1">Langkah 5</span>
                  Program Semester (PROSEM)
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs font-semibold text-slate-700">
                  <span className="text-[10px] text-indigo-600 font-bold block mb-1">Langkah 6</span>
                  Modul Ajar / RPM
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Program Tahunan (PROTA) PJOK"
        subtitle={`Kelas ${protaData.identitas.kelas} (Fase ${protaData.identitas.fase}) • Tahun Ajaran ${protaData.identitas.tahunPelajaran}`}
        tabs={getProtaProsemPrompts('prota', {
          kelas: protaData.identitas.kelas,
          fase: protaData.identitas.fase,
          tahunPelajaran: protaData.identitas.tahunPelajaran,
          rentangProgram,
          babSemester1,
          babSemester2
        })}
        jsonData={{
          protaData,
          tanggalEkspor: new Date().toISOString()
        }}
        jsonFilename={`PROTA_PJOK_Kelas_${protaData.identitas.kelas}_${(protaData.identitas.tahunPelajaran || '').replace(/\//g, '-')}`}
      />

    </div>
  );
}
