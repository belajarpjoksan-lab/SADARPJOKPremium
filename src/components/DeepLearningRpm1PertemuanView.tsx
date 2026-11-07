import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  ClipboardCopy, 
  FileDown, 
  BookOpen, 
  User, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Printer, 
  ExternalLink, 
  Copy, 
  Calendar, 
  Clock, 
  GraduationCap, 
  School,
  Target,
  FileCheck2,
  CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DeepLearningRPM } from '../types';
import { 
  exportRpmSatuPertemuanToDoc, 
  downloadDocFile, 
  copyAndOpenGoogleDocs, 
  copyRichHtmlToClipboard, 
  downloadJsonFile 
} from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getDeepLearning1PertemuanPrompts } from '../utils/aiPromptGenerators';
import SibiUnitSelectorBar from './SibiUnitSelectorBar';

type JenjangType = 'SD' | 'SMP' | 'SMA' | 'PAUD';

const JENJANG_CONFIG: Array<{ id: JenjangType; label: string; badge: string; color: string }> = [
  { id: 'SMP', label: 'SMP / MTs', badge: 'Fase D (Utama)', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'SD', label: 'SD / MI', badge: 'Fase A, B, C', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'SMA', label: 'SMA / SMK', badge: 'Fase E & F', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { id: 'PAUD', label: 'PAUD / TK', badge: 'Fase Fondasi', color: 'text-amber-700 bg-amber-50 border-amber-200' },
];

const KELAS_PRESETS: Record<JenjangType, Array<{ grade: string; label: string; fase: string; desc: string }>> = {
  SMP: [
    { grade: '7', label: 'Kelas 7', fase: 'Fase D', desc: 'Kelas 7 SMP (Fase D)' },
    { grade: '8', label: 'Kelas 8', fase: 'Fase D', desc: 'Kelas 8 SMP (Fase D)' },
    { grade: '9', label: 'Kelas 9', fase: 'Fase D', desc: 'Kelas 9 SMP (Fase D)' },
  ],
  SD: [
    { grade: '1', label: 'Kelas 1', fase: 'Fase A', desc: 'Kelas 1 SD (Fase A)' },
    { grade: '2', label: 'Kelas 2', fase: 'Fase A', desc: 'Kelas 2 SD (Fase A)' },
    { grade: '3', label: 'Kelas 3', fase: 'Fase B', desc: 'Kelas 3 SD (Fase B)' },
    { grade: '4', label: 'Kelas 4', fase: 'Fase B', desc: 'Kelas 4 SD (Fase B)' },
    { grade: '5', label: 'Kelas 5', fase: 'Fase C', desc: 'Kelas 5 SD (Fase C)' },
    { grade: '6', label: 'Kelas 6', fase: 'Fase C', desc: 'Kelas 6 SD (Fase C)' },
  ],
  SMA: [
    { grade: '10', label: 'Kelas 10', fase: 'Fase E', desc: 'Kelas 10 SMA/SMK (Fase E)' },
    { grade: '11', label: 'Kelas 11', fase: 'Fase F', desc: 'Kelas 11 SMA/SMK (Fase F)' },
    { grade: '12', label: 'Kelas 12', fase: 'Fase F', desc: 'Kelas 12 SMA/SMK (Fase F)' },
  ],
  PAUD: [
    { grade: 'PAUD', label: 'PAUD / TK', fase: 'Fase Fondasi', desc: 'PAUD/TK (Fase Fondasi)' },
  ],
};

const ALL_KELAS_OPTIONS = [
  { grade: '7', label: 'Kelas 7 SMP / MTs (Fase D)', fase: 'Fase D', jenjang: 'SMP' as JenjangType },
  { grade: '8', label: 'Kelas 8 SMP / MTs (Fase D)', fase: 'Fase D', jenjang: 'SMP' as JenjangType },
  { grade: '9', label: 'Kelas 9 SMP / MTs (Fase D)', fase: 'Fase D', jenjang: 'SMP' as JenjangType },
  { grade: '1', label: 'Kelas 1 SD / MI (Fase A)', fase: 'Fase A', jenjang: 'SD' as JenjangType },
  { grade: '2', label: 'Kelas 2 SD / MI (Fase A)', fase: 'Fase A', jenjang: 'SD' as JenjangType },
  { grade: '3', label: 'Kelas 3 SD / MI (Fase B)', fase: 'Fase B', jenjang: 'SD' as JenjangType },
  { grade: '4', label: 'Kelas 4 SD / MI (Fase B)', fase: 'Fase B', jenjang: 'SD' as JenjangType },
  { grade: '5', label: 'Kelas 5 SD / MI (Fase C)', fase: 'Fase C', jenjang: 'SD' as JenjangType },
  { grade: '6', label: 'Kelas 6 SD / MI (Fase C)', fase: 'Fase C', jenjang: 'SD' as JenjangType },
  { grade: '10', label: 'Kelas 10 SMA / SMK (Fase E)', fase: 'Fase E', jenjang: 'SMA' as JenjangType },
  { grade: '11', label: 'Kelas 11 SMA / SMK (Fase F)', fase: 'Fase F', jenjang: 'SMA' as JenjangType },
  { grade: '12', label: 'Kelas 12 SMA / SMK (Fase F)', fase: 'Fase F', jenjang: 'SMA' as JenjangType },
  { grade: 'PAUD', label: 'PAUD / TK (Fase Fondasi)', fase: 'Fase Fondasi', jenjang: 'PAUD' as JenjangType },
];

export function DeepLearningRpm1PertemuanView() {
  // Jenjang, Kelas & Fase states (Default SD Kelas 4 Fase B sesuai Buku Panduan Guru SIBI)
  const [jenjang, setJenjang] = useState<JenjangType>('SD');
  const [grade, setGrade] = useState('4');
  const [fase, setFase] = useState('Fase B');
  const [isCustomGrade, setIsCustomGrade] = useState(false);
  const [customGradeText, setCustomGradeText] = useState('');

  // Form Fields - Master template Lendi Ike Hermawan, S.Pd., Gr. + Buku Panduan Guru SIBI
  const [penyusun, setPenyusun] = useState('Lendi Ike Hermawan, S.Pd., Gr.');
  const [sekolah, setSekolah] = useState('SD Negeri Kalimantong');
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027');
  const [semester, setSemester] = useState('1');
  const [mataPelajaran, setMataPelajaran] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)');
  const [bab, setBab] = useState('Unit 1: Aktivitas Variasi dan Kombinasi Pola Gerak Dasar Permainan Invasi (Buku Panduan Guru SIBI)');
  const [materi, setMateri] = useState('Variasi dan Kombinasi Gerak Dasar dalam Permainan Bola Tangan dan Sepak Bola Modifikasi');
  const [alokasiWaktu, setAlokasiWaktu] = useState('2x35 Menit');
  const [capaianPembelajaran, setCapaianPembelajaran] = useState(
    'Menghaluskan keterampilan gerak fundamental dan menerapkannya dalam situasi gerak yang baru; menyesuaikan strategi gerak untuk mendapatkan capaian keterampilan gerak; memperagakan berbagai konsep gerak yang dapat diterapkan dalam rangkaian gerak; menerapkan strategi gerak sederhana dan memecahkan masalah gerak; menerapkan peraturan untuk menumbuhkan fair play; serta berpartisipasi secara positif dalam kelompok atau tim.'
  );
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState(
    'Murid dapat memahami, menganalisis, dan mempraktikkan variasi serta kombinasi pola gerak dasar mengoper, menangkap, menendang, menahan, dan menggiring bola dalam permainan invasi modifikasi sesuai Buku Panduan Guru PJOK SIBI dengan menjunjung tinggi sportivitas dan kerja sama (Level Kognitif: Memahami/C2, Menerapkan/C3 & Menganalisis/C4).'
  );
  const [konteksTambahan, setKonteksTambahan] = useState('Sesuai Buku Panduan Guru PJOK SD/MI Kelas IV (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP Kemendikdasmen - SIBI)');

  // UI state
  const [loading, setLoading] = useState(false);
  const [rpmResult, setRpmResult] = useState<DeepLearningRPM | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'rpm' | 'lampiran' | 'lkpd' | 'all'>('rpm');
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [copiedTextStatus, setCopiedTextStatus] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSelectJenjang = (newJenjang: JenjangType) => {
    setJenjang(newJenjang);
    setIsCustomGrade(false);
    const presets = KELAS_PRESETS[newJenjang];
    if (presets && presets.length > 0) {
      setGrade(presets[0].grade);
      setFase(presets[0].fase);
    }
    if (errors.grade) setErrors({ ...errors, grade: '' });
  };

  const handleSelectGrade = (newGrade: string, newFase: string, newJenjang?: JenjangType) => {
    setGrade(newGrade);
    setFase(newFase);
    if (newJenjang) setJenjang(newJenjang);
    setIsCustomGrade(false);
    if (errors.grade) setErrors({ ...errors, grade: '' });
  };

  const handleSelectDropdownGrade = (selectedGradeValue: string) => {
    const item = ALL_KELAS_OPTIONS.find((k) => k.grade === selectedGradeValue);
    if (item) {
      setGrade(item.grade);
      setFase(item.fase);
      setJenjang(item.jenjang);
      setIsCustomGrade(false);
    }
    if (errors.grade) setErrors({ ...errors, grade: '' });
  };

  const getEffectiveGradeText = () => {
    if (isCustomGrade) return customGradeText;
    if (grade === 'PAUD') return 'PAUD / TK';
    return `Kelas ${grade}`;
  };

  const getEffectiveKelasFaseFormatted = () => {
    const effGrade = getEffectiveGradeText();
    if (effGrade.toLowerCase().includes('fase')) {
      return effGrade;
    }
    return `${effGrade} / ${fase}`;
  };

  const validateForm = () => {
    const tempErrors: { [key: string]: string } = {};
    const effectiveGrade = isCustomGrade ? customGradeText.trim() : grade.trim();
    if (!effectiveGrade) tempErrors.grade = 'Kelas wajib dipilih / diisi';
    if (!materi.trim()) tempErrors.materi = 'Topik materi pembelajaran wajib diisi';
    if (!tujuanPembelajaran.trim()) tempErrors.tujuanPembelajaran = 'Tujuan Pembelajaran wajib dirumuskan';
    if (!penyusun.trim()) tempErrors.penyusun = 'Nama Guru Penyusun wajib diisi';
    if (!sekolah.trim()) tempErrors.sekolah = 'Nama Sekolah wajib diisi';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/generate-rpm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: getEffectiveGradeText(),
          fase,
          materi,
          bab,
          tujuanPembelajaran,
          capaianPembelajaran,
          penyusun,
          sekolah,
          tahunAjaran,
          semester,
          mataPelajaran,
          alokasiWaktu: alokasiWaktu.trim() || '2x40 Menit',
          jumlahPertemuan: '1',
          is1Pertemuan: true,
          mode: '1_pertemuan',
          konteksTambahan
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.statusText}`);
      }

      const data = await response.json();
      setRpmResult(data);
    } catch (err: any) {
      console.error('Error generating RPM 1 Pertemuan:', err);
      setErrorMessage(err.message || 'Gagal menghasilkan Rencana Pembelajaran Mendalam. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWord = () => {
    if (!rpmResult) return;
    const docContent = exportRpmSatuPertemuanToDoc(rpmResult);
    const fileName = `RPM_1_Pertemuan_${(rpmResult.identitas?.topik || materi || 'Pembelajaran').replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
    downloadDocFile(fileName, docContent);
  };

  const handleCopyGoogleDocs = async () => {
    if (!rpmResult) return;
    const docContent = exportRpmSatuPertemuanToDoc(rpmResult);
    const success = await copyAndOpenGoogleDocs(docContent);
    if (success) {
      setCopiedStatus(true);
      setTimeout(() => setCopiedStatus(false), 3000);
    }
  };

  const handleCopyHtml = async () => {
    if (!rpmResult) return;
    const docContent = exportRpmSatuPertemuanToDoc(rpmResult);
    const success = await copyRichHtmlToClipboard(docContent);
    if (success) {
      setCopiedTextStatus(true);
      setTimeout(() => setCopiedTextStatus(false), 2500);
    }
  };

  const handlePrint = () => {
    if (!rpmResult) return;
    const docContent = exportRpmSatuPertemuanToDoc(rpmResult);
    printHtmlDocument(docContent, `RPM 1 Pertemuan - ${rpmResult.identitas?.topik || materi}`);
  };

  const handleDownloadPdf = async () => {
    if (!rpmResult) return;
    setExportingPdf(true);
    try {
      const docContent = exportRpmSatuPertemuanToDoc(rpmResult);
      const fileName = `RPM_1_Pertemuan_${(rpmResult.identitas?.topik || materi || 'Pembelajaran').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      await downloadHtmlAsPdf(fileName, docContent, { orientation: 'portrait', marginMm: 12 });
    } finally {
      setExportingPdf(false);
    }
  };

  const dplList = [
    'Keimanan dan Ketakwaan terhadap Tuhan YME',
    'Kewargaan',
    'Penalaran Kritis',
    'Kreativitas',
    'Kolaborasi',
    'Kemandirian',
    'Kesehatan',
    'Komunikasi'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs mb-3">
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
              <span>Format Standar Lendi Ike Hermawan, S.Pd., Gr.</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              RPM Deep Learning 1 Pertemuan
            </h1>
            <p className="text-amber-100 text-sm sm:text-base mt-1 max-w-2xl leading-relaxed">
              Penyusun Perencanaan Pembelajaran Mendalam (2x40 Menit) dengan prinsip Mindful, Meaningful, dan Joyful, tabel 2 kolom header kuning (#fef08a), LKPD interaktif non-tabel, serta 10 lampiran asesmen komprehensif.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              onClick={() => setShowPromptModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-amber-900 font-bold text-xs sm:text-sm hover:bg-amber-50 transition shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              Prompt AI Master
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <School className="w-4 h-4 text-amber-600" />
              1. Identitas & Jenjang Pendidikan
            </h2>

            {/* Jenjang Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pilih Jenjang Sekolah
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {JENJANG_CONFIG.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => handleSelectJenjang(j.id)}
                    className={`px-3 py-2.5 rounded-xl text-left border transition ${
                      jenjang === j.id
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{j.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{j.badge}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Kelas Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tingkat Kelas & Fase ({jenjang})
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomGrade(!isCustomGrade)}
                  className="text-xs font-medium text-amber-700 hover:text-amber-800 underline"
                >
                  {isCustomGrade ? 'Gunakan Pilihan' : 'Ketik Manual'}
                </button>
              </div>

              {!isCustomGrade ? (
                <div className="grid grid-cols-3 gap-2">
                  {KELAS_PRESETS[jenjang]?.map((preset) => (
                    <button
                      key={preset.grade}
                      type="button"
                      onClick={() => handleSelectGrade(preset.grade, preset.fase, jenjang)}
                      className={`px-3 py-2 rounded-xl text-center border text-xs font-semibold transition ${
                        grade === preset.grade
                          ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={customGradeText}
                  onChange={(e) => setCustomGradeText(e.target.value)}
                  placeholder="Contoh: Kelas 7 SMP / MTs (Fase D)"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                />
              )}
              {errors.grade && <p className="text-xs text-rose-500 mt-1">{errors.grade}</p>}
            </div>

            {/* Dropdown Quick Select */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Atau pilih langsung dari semua jenjang:
              </label>
              <select
                value={isCustomGrade ? '' : grade}
                onChange={(e) => handleSelectDropdownGrade(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {ALL_KELAS_OPTIONS.map((opt) => (
                  <option key={opt.grade} value={opt.grade}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* School & Teacher Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Penyusun (Guru)</label>
                <input
                  type="text"
                  value={penyusun}
                  onChange={(e) => setPenyusun(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="Lendi Ike Hermawan, S.Pd., Gr."
                />
                {errors.penyusun && <p className="text-xs text-rose-500 mt-1">{errors.penyusun}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Satuan Pendidikan</label>
                <input
                  type="text"
                  value={sekolah}
                  onChange={(e) => setSekolah(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="SD Negeri Kalimantong"
                />
                {errors.sekolah && <p className="text-xs text-rose-500 mt-1">{errors.sekolah}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  value={mataPelajaran}
                  onChange={(e) => setMataPelajaran(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  value={tahunAjaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="1">1 (Ganjil)</option>
                  <option value="2">2 (Genap)</option>
                </select>
              </div>
            </div>

            {/* Alokasi Waktu Pertemuan (Editable + Quick Presets) */}
            <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Alokasi Waktu (1 Pertemuan)
                </label>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
                  Bisa Diedit
                </span>
              </div>
              <input
                type="text"
                value={alokasiWaktu}
                onChange={(e) => setAlokasiWaktu(e.target.value)}
                placeholder="Contoh: 2x40 Menit"
                className="w-full text-xs font-bold text-slate-900 bg-white px-3.5 py-2 rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-medium text-amber-800 mr-0.5">Pilih Cepat:</span>
                {['2x35 Menit', '2x40 Menit', '2x45 Menit', '3x35 Menit', '3x40 Menit'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAlokasiWaktu(preset)}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold transition border ${
                      alokasiWaktu === preset
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100/60'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Materi & Tujuan Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Target className="w-4 h-4 text-amber-600" />
              2. Topik & Tujuan Pembelajaran 1 Pertemuan (Sesuai Buku Panduan SIBI)
            </h2>

            <SibiUnitSelectorBar
              grade={grade}
              currentTopic={materi}
              onSelectUnit={(unit) => {
                setBab(`${unit.unitTitle} (Buku Panduan Guru SIBI)`);
                setMateri(unit.pokokMateri);
                setSemester(unit.semester);
                setAlokasiWaktu(unit.alokasiPertemuan);
                setTujuanPembelajaran(unit.tujuanPembelajaran.join(' '));
                setKonteksTambahan(`Rujukan Resmi SIBI: ${unit.sumberBukuSibi} | Pemanasan Permainan: ${unit.pemanasanPermainan}`);
              }}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit / Bab Buku Panduan SIBI</label>
              <input
                type="text"
                value={bab}
                onChange={(e) => setBab(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                placeholder="Bab 1: Kebugaran Jasmani"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Topik Spesifik Pertemuan Ini <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={materi}
                onChange={(e) => setMateri(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-semibold text-slate-900"
                placeholder="Contoh: Kebugaran Jasmani dan Sirkuit Latihan"
              />
              {errors.materi && <p className="text-xs text-rose-500 mt-1">{errors.materi}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Capaian Pembelajaran (CP)
              </label>
              <textarea
                rows={3}
                value={capaianPembelajaran}
                onChange={(e) => setCapaianPembelajaran(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 leading-relaxed"
                placeholder="Capaian Pembelajaran sesuai BSKAP 046/H/KR/2025"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tujuan Pembelajaran (1 Pertemuan) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={tujuanPembelajaran}
                onChange={(e) => setTujuanPembelajaran(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-900 leading-relaxed font-medium"
                placeholder="Contoh: Murid dapat menganalisis dan mempraktikkan keterampilan kebugaran jasmani..."
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Gunakan kata "Murid ..." dan cantumkan level kognitif Taksonomi Bloom (C1-C6).
              </p>
              {errors.tujuanPembelajaran && (
                <p className="text-xs text-rose-500 mt-1">{errors.tujuanPembelajaran}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Konteks / Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={konteksTambahan}
                onChange={(e) => setKonteksTambahan(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                placeholder="Contoh: Fokus pada latihan sirkuit 4 pos, sarana lapangan rumput"
              />
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyusun RPM 1 Pertemuan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-200" />
                  <span>Generate RPM 1 Pertemuan ({alokasiWaktu.trim() || '2x40 Menit'})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Document Preview */}
        <div className="lg:col-span-7 space-y-4">
          {rpmResult ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Action Toolbar */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-medium">
                  <button
                    onClick={() => setActiveTab('rpm')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeTab === 'rpm'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tabel RPM
                  </button>
                  <button
                    onClick={() => setActiveTab('lampiran')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeTab === 'lampiran'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Lampiran 1-10
                  </button>
                  <button
                    onClick={() => setActiveTab('lkpd')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeTab === 'lkpd'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    LKPD 1 Pertemuan
                  </button>
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeTab === 'all'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua Bagian
                  </button>
                </div>

                {/* Export Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadWord}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-xs"
                    title="Download sebagai file Microsoft Word (.doc)"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download Word (.doc)</span>
                  </button>
                  <button
                    onClick={handleCopyGoogleDocs}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-xs"
                    title="Buka di Google Docs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{copiedStatus ? 'Tersalin!' : 'Google Docs'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg transition font-medium"
                    title="Cetak Dokumen"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak</span>
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={exportingPdf}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg transition font-medium"
                    title="Download PDF"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-600" />
                    <span>{exportingPdf ? 'PDF...' : 'PDF'}</span>
                  </button>
                  <button
                    onClick={handleCopyHtml}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg transition font-medium"
                    title="Copy Text Format"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedTextStatus ? 'Tersalin' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Document Container */}
              <div 
                id="preview-rpm-pertemuan-container"
                className="p-6 sm:p-8 overflow-y-auto max-h-[850px] bg-white text-slate-800 text-xs leading-relaxed space-y-8"
              >
                {/* Header Title */}
                <div className="text-center pb-4 border-b border-slate-300">
                  <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-tight">
                    PERENCANAAN PEMBELAJARAN MENDALAM (RPM)
                  </h2>
                  <p className="text-xs font-semibold text-slate-600 mt-1">
                    Format Standar: Lendi Ike Hermawan, S.Pd., Gr. &bull; Alokasi Waktu: {rpmResult.identitas?.alokasiWaktu || alokasiWaktu || '2x40 Menit'} (1 Pertemuan)
                  </p>
                </div>

                {/* TABEL RPM SECTION */}
                {(activeTab === 'rpm' || activeTab === 'all') && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-extrabold text-slate-800 text-sm uppercase">
                        Tabel Utama Rencana Pembelajaran Mendalam
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-900 border border-yellow-300">
                        Template Versi 2
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-300 rounded-lg">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-white font-bold text-xs uppercase">
                            <th className="w-[32%] px-4 py-3 border border-slate-400">Komponen / Sub-komponen</th>
                            <th className="w-[68%] px-4 py-3 border border-slate-400">Isi Perencanaan Pembelajaran</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {/* A. IDENTITAS - Gold/Yellow Header #fef08a */}
                          <tr className="bg-[#fef08a] font-black text-stone-900">
                            <td colSpan={2} className="px-4 py-2.5 border border-slate-400 uppercase tracking-wide text-xs">
                              A. IDENTITAS
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 border border-slate-300 font-semibold bg-stone-50">Penyusun</td>
                            <td className="px-4 py-2 border border-slate-300 font-medium">{rpmResult.identitas?.penyusun || penyusun}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 border border-slate-300 font-semibold bg-stone-50">Sekolah</td>
                            <td className="px-4 py-2 border border-slate-300">{rpmResult.identitas?.sekolah || sekolah}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 border border-slate-300 font-semibold bg-stone-50">Tahun Ajaran</td>
                            <td className="px-4 py-2 border border-slate-300">{rpmResult.identitas?.tahunAjaran || tahunAjaran}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 border border-slate-300 font-semibold bg-stone-50">Semester</td>
                            <td className="px-4 py-2 border border-slate-300">{rpmResult.identitas?.semester || semester}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 border border-slate-300 font-semibold bg-stone-50">Mata Pelajaran</td>
                            <td className="px-4 py-2 border border-slate-300">{rpmResult.identitas?.mataPelajaran || mataPelajaran}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 border border-slate-300 font-semibold bg-stone-50">Kelas / Fase Capaian</td>
                            <td className="px-4 py-2 border border-slate-300">{rpmResult.identitas?.kelasFase || getEffectiveKelasFaseFormatted()}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 border border-slate-300 font-semibold bg-stone-50">Topik</td>
                            <td className="px-4 py-2 border border-slate-300 font-bold text-slate-900">{rpmResult.identitas?.topik || materi}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 border border-slate-300 font-semibold bg-stone-50">Alokasi Waktu</td>
                            <td className="px-4 py-2 border border-slate-300 font-semibold text-amber-900">{rpmResult.identitas?.alokasiWaktu || alokasiWaktu || '2x40 Menit'}</td>
                          </tr>

                          {/* B. IDENTIFIKASI - Gold/Yellow Header #fef08a */}
                          <tr className="bg-[#fef08a] font-black text-stone-900">
                            <td colSpan={2} className="px-4 py-2.5 border border-slate-400 uppercase tracking-wide text-xs">
                              B. IDENTIFIKASI
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border border-slate-300 font-semibold bg-stone-50 align-top">Identifikasi Murid</td>
                            <td className="px-4 py-3 border border-slate-300 whitespace-pre-wrap leading-relaxed">
                              {rpmResult.identifikasi?.muridOps || rpmResult.identifikasi?.identifikasiMurid}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border border-slate-300 font-semibold bg-stone-50 align-top">Materi Pelajaran</td>
                            <td className="px-4 py-3 border border-slate-300 whitespace-pre-wrap leading-relaxed">
                              {rpmResult.identifikasi?.materiPelajaranOps || rpmResult.identifikasi?.materiPelajaran}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border border-slate-300 font-semibold bg-stone-50 align-top">
                              Dimensi Profil Lulusan (8 DPL)
                            </td>
                            <td className="px-4 py-3 border border-slate-300">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {dplList.map((dplName, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <span className="text-emerald-700 font-bold">☑</span>
                                    <span className="text-slate-800">{dplName}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>

                          {/* C. DESAIN PEMBELAJARAN - Gold/Yellow Header #fef08a */}
                          <tr className="bg-[#fef08a] font-black text-stone-900">
                            <td colSpan={2} className="px-4 py-2.5 border border-slate-400 uppercase tracking-wide text-xs">
                              C. DESAIN PEMBELAJARAN
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border border-slate-300 font-semibold bg-stone-50 align-top">Capaian Pembelajaran</td>
                            <td className="px-4 py-3 border border-slate-300 leading-relaxed">
                              {rpmResult.desainPembelajaran?.capaianPembelajaranOps || rpmResult.desainPembelajaran?.capaianPembelajaran}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border border-slate-300 font-semibold bg-stone-50 align-top">Lintas Disiplin Ilmu</td>
                            <td className="px-4 py-3 border border-slate-300 leading-relaxed">
                              {rpmResult.desainPembelajaran?.lintasDisiplinIlmuOps || rpmResult.desainPembelajaran?.lintasDisiplinIlmu}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border border-slate-300 font-semibold bg-stone-50 align-top">Tujuan Pembelajaran</td>
                            <td className="px-4 py-3 border border-slate-300 leading-relaxed font-semibold text-slate-900 whitespace-pre-wrap">
                              {rpmResult.desainPembelajaran?.tujuanPembelajaran}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-stone-50 align-top">Topik Pembelajaran</td>
                            <td className="px-4 py-2.5 border border-slate-300 font-medium">
                              {rpmResult.desainPembelajaran?.topikPembelajaranOps || rpmResult.desainPembelajaran?.topikPembelajaran || materi}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border border-slate-300 font-semibold bg-stone-50 align-top">Praktik Pedagogis</td>
                            <td className="px-4 py-3 border border-slate-300 whitespace-pre-wrap leading-relaxed">
                              {rpmResult.desainPembelajaran?.praktikPedagogis}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-stone-50 align-top">Kemitraan Pembelajaran</td>
                            <td className="px-4 py-2.5 border border-slate-300 leading-relaxed">
                              {rpmResult.desainPembelajaran?.kemitraanPembelajaranOps || rpmResult.desainPembelajaran?.kemitraanPembelajaran}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-stone-50 align-top">Lingkungan Pembelajaran</td>
                            <td className="px-4 py-2.5 border border-slate-300 leading-relaxed">
                              {rpmResult.desainPembelajaran?.lingkunganPembelajaran}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-stone-50 align-top">Pemanfaatan Digital</td>
                            <td className="px-4 py-2.5 border border-slate-300 leading-relaxed">
                              {rpmResult.desainPembelajaran?.pemanfaatanDigitalOps || rpmResult.desainPembelajaran?.pemanfaatanDigital}
                            </td>
                          </tr>

                          {/* D. PENGALAMAN BELAJAR - Gold/Yellow Header #fef08a */}
                          <tr className="bg-[#fef08a] font-black text-stone-900">
                            <td colSpan={2} className="px-4 py-2.5 border border-slate-400 uppercase tracking-wide text-xs">
                              D. PENGALAMAN BELAJAR
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border border-slate-300 font-semibold bg-stone-50 align-top">
                              <div>Kegiatan Awal</div>
                              <span className="text-[11px] text-amber-800 font-medium">(15 Menit)</span>
                            </td>
                            <td className="px-4 py-3 border border-slate-300 whitespace-pre-wrap leading-relaxed">
                              {rpmResult.pengalamanBelajar?.kegiatanAwal}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border border-slate-300 font-semibold bg-stone-50 align-top">
                              <div>Kegiatan Inti</div>
                              <span className="text-[11px] text-amber-800 font-medium">(60 Menit)</span>
                            </td>
                            <td className="px-4 py-3 border border-slate-300 whitespace-pre-wrap leading-relaxed">
                              {rpmResult.pengalamanBelajar?.kegiatanInti}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border border-slate-300 font-semibold bg-stone-50 align-top">
                              <div>Kegiatan Penutup</div>
                              <span className="text-[11px] text-amber-800 font-medium">(5 Menit)</span>
                            </td>
                            <td className="px-4 py-3 border border-slate-300 whitespace-pre-wrap leading-relaxed">
                              {rpmResult.pengalamanBelajar?.kegiatanPenutup}
                            </td>
                          </tr>

                          {/* E. ASESMEN PEMBELAJARAN - Gold/Yellow Header #fef08a */}
                          <tr className="bg-[#fef08a] font-black text-stone-900">
                            <td colSpan={2} className="px-4 py-2.5 border border-slate-400 uppercase tracking-wide text-xs">
                              E. ASESMEN PEMBELAJARAN
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-stone-50">Asesmen Awal</td>
                            <td className="px-4 py-2.5 border border-slate-300 leading-relaxed">{rpmResult.asesmenPembelajaran?.awal}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-stone-50">Asesmen Proses</td>
                            <td className="px-4 py-2.5 border border-slate-300 leading-relaxed">{rpmResult.asesmenPembelajaran?.proses}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-stone-50">Asesmen Akhir</td>
                            <td className="px-4 py-2.5 border border-slate-300 leading-relaxed">{rpmResult.asesmenPembelajaran?.akhir}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Tanda Tangan Block */}
                    <div className="pt-6">
                      <div className="flex justify-between items-start text-xs pt-4">
                        <div className="text-center w-56">
                          <p>Mengetahui,</p>
                          <p className="font-semibold">Kepala Sekolah</p>
                          <div className="h-16" />
                          <p className="font-bold underline">
                            {rpmResult.tandaTangan?.kepalaSekolah?.nama || 'Soleh, S.Pd., M.Pd.'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {rpmResult.tandaTangan?.kepalaSekolah?.nip || 'NIP. 19750512 200003 1 004'}
                          </p>
                        </div>
                        <div className="text-center w-56">
                          <p>{rpmResult.tandaTangan?.tempatTanggal || 'Surakarta, 1 Juli 2025'}</p>
                          <p className="font-semibold">Guru Mata Pelajaran</p>
                          <div className="h-16" />
                          <p className="font-bold underline">
                            {rpmResult.tandaTangan?.guruMapel?.nama || penyusun}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {rpmResult.tandaTangan?.guruMapel?.nip || 'NIP. ........................................'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* LAMPIRAN 1-10 SECTION */}
                {(activeTab === 'lampiran' || activeTab === 'all') && (
                  <div className="space-y-6 pt-6 border-t-2 border-slate-300">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                      <span className="font-extrabold text-slate-900 text-sm uppercase">
                        LAMPIRAN ASESMEN & PERANGKAT PEMBELAJARAN (1 - 10)
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        10 Lampiran Lengkap
                      </span>
                    </div>

                    {/* Lampiran 1: Diagnostik Non-kognitif */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-[#fef08a] px-4 py-2 font-bold text-stone-900 text-xs uppercase border-b border-slate-300">
                        Lampiran 1: Lembar Asesmen Diagnostik Non-kognitif
                      </div>
                      <div className="p-4 space-y-3 bg-white">
                        <p className="font-medium text-slate-700">
                          Tujuan: {rpmResult.lampiran?.asesmenDiagnostikNonKognitif?.tujuan || 'Mengetahui kesiapan fisik, mental, dan emosional sebelum belajar.'}
                        </p>
                        <div className="space-y-2">
                          {(rpmResult.lampiran?.asesmenDiagnostikNonKognitif?.pertanyaan || [
                            { no: 1, teks: 'Bagaimana perasaanmu sebelum memulai jam pelajaran PJOK hari ini?' },
                            { no: 2, teks: 'Apakah kamu sudah sarapan sehat dan membawa botol minum air putih?' },
                            { no: 3, teks: 'Apakah saat ini tubuhmu terasa bugar dan siap beraktivitas di lapangan?' },
                            { no: 4, teks: 'Apakah ada bagian tubuh yang terasa nyeri atau cedera hari ini?' }
                          ]).map((q, idx) => (
                            <div key={idx} className="p-2.5 bg-stone-50 rounded-lg border border-slate-200">
                              <p className="font-semibold text-slate-800">{q.no}. {q.teks}</p>
                              <div className="mt-1.5 flex gap-4 text-[11px] text-slate-600">
                                <span>[  ] Sangat Siap / Bahagia</span>
                                <span>[  ] Cukup Siap</span>
                                <span>[  ] Kurang Fit / Butuh Istirahat</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Lampiran 2: Soal Asesmen Awal 5 Butir */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-[#fef08a] px-4 py-2 font-bold text-stone-900 text-xs uppercase border-b border-slate-300">
                        Lampiran 2: Soal Asesmen Awal Kognitif (5 Butir Soal & Kunci Jawaban)
                      </div>
                      <div className="p-4 space-y-3 bg-white">
                        {(rpmResult.lampiran?.soalAsesmenAwalList || []).map((s, idx) => (
                          <div key={idx} className="p-3 bg-stone-50 rounded-lg border border-slate-200 space-y-1">
                            <p className="font-bold text-slate-900">{s.no || idx + 1}. {s.pertanyaan}</p>
                            <p className="text-emerald-700 font-medium text-[11px]">
                              Kunci Jawaban: {s.kunciJawaban}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lampiran 3: Asesmen Formatif (Diskusi, Presentasi, Unjuk Kerja) */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-[#fef08a] px-4 py-2 font-bold text-stone-900 text-xs uppercase border-b border-slate-300">
                        Lampiran 3: Lembar Asesmen Formatif (Diskusi, Presentasi, Unjuk Kerja)
                      </div>
                      <div className="p-4 space-y-3 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200">
                            <div className="font-bold text-amber-900 mb-1">Diskusi Kelompok</div>
                            <p className="text-[11px] text-slate-700 leading-relaxed">
                              {rpmResult.lampiran?.asesmenFormatif?.keterangan?.diskusi || 'Melatih kolaborasi, keberanian mengemukakan ide solusi gerak, dan mendengarkan rekan tim.'}
                            </p>
                          </div>
                          <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-200">
                            <div className="font-bold text-blue-900 mb-1">Presentasi & Peragaan</div>
                            <p className="text-[11px] text-slate-700 leading-relaxed">
                              {rpmResult.lampiran?.asesmenFormatif?.keterangan?.presentasi || 'Melatih keberanian berbicara di depan kelas dan memperagakan teknik gerak dengan percaya diri.'}
                            </p>
                          </div>
                          <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200">
                            <div className="font-bold text-emerald-900 mb-1">Unjuk Kerja Praktik</div>
                            <p className="text-[11px] text-slate-700 leading-relaxed">
                              {rpmResult.lampiran?.asesmenFormatif?.keterangan?.unjukKerja || 'Menilai keterampilan motorik dan koordinasi tubuh yang dipraktikkan secara berkelanjutan.'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="font-semibold text-slate-800 text-xs mb-2">Rubrik Penilaian Formatif 5 Skala:</div>
                          <div className="space-y-1.5">
                            {(rpmResult.lampiran?.asesmenFormatif?.rubrikPenilaian || [
                              { skor: 5, deskripsi: 'Sangat aktif berkontribusi dalam diskusi & peragaan, teknik gerak sangat akurat, komunikatif, dan sangat konsisten.' },
                              { skor: 4, deskripsi: 'Aktif berdiskusi dan berlatih, mampu memperagakan gerak dengan baik, keterampilan gerak terlihat berkembang.' },
                              { skor: 3, deskripsi: 'Cukup aktif, berpartisipasi saat diarahkan, keterampilan dasar mulai tampak konsisten.' },
                              { skor: 2, deskripsi: 'Kurang aktif, pasif dalam kelompok, teknik gerak masih sering keliru.' },
                              { skor: 1, deskripsi: 'Tidak menunjukkan partisipasi, tidak menguasai gerakan, enggan mencoba.' }
                            ]).map((r, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs p-1.5 border-b border-slate-100">
                                <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px]">Skor {r.skor}</span>
                                <span className="text-slate-700">{r.deskripsi}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lampiran 4: Penilaian Sikap (Spiritual, Sosial, SL/SR/KD/TP) */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-[#fef08a] px-4 py-2 font-bold text-stone-900 text-xs uppercase border-b border-slate-300">
                        Lampiran 4: Lembar Penilaian Sikap (Spiritual, Sosial, Skala SL/SR/KD/TP)
                      </div>
                      <div className="p-4 space-y-3 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-stone-50 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-900 block mb-1">A. Sikap Spiritual (Penilaian Diri)</span>
                            <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                              {(rpmResult.lampiran?.penilaianSikap?.spiritual?.indikator || [
                                'Berdoa sebelum dan sesudah aktivitas pembelajaran dengan khusyuk',
                                'Menunjukkan rasa syukur atas kesehatan dan kebugaran tubuh',
                                'Menunjukkan empati dan sikap saling tolong-menolong antarteman',
                                'Menjaga sportivitas dan kejujuran dalam setiap aktivitas'
                              ]).map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-3 bg-stone-50 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-900 block mb-1">B. Sikap Sosial (Penilaian Antarteman)</span>
                            <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                              {(rpmResult.lampiran?.penilaianSikap?.sosial?.indikator || [
                                'Mampu berkomunikasi dengan santun dan positif saat berdiskusi',
                                'Bekerja sama secara aktif dan berbagi tugas merata dalam kelompok',
                                'Menghargai keberagaman kemampuan fisik dan pendapat teman',
                                'Peduli terhadap kebersihan lingkungan dan keselamatan sarana alat'
                              ]).map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="p-2.5 bg-yellow-50 rounded-lg border border-yellow-200 text-[11px] text-yellow-950 font-medium">
                          Keterangan Skala: SL = Selalu (4), SR = Sering (3), KD = Kadang-kadang (2), TP = Tidak Pernah (1). Rumus: (Jumlah Skor / 16) × 100.
                        </div>
                      </div>
                    </div>

                    {/* Lampiran 5: Penilaian Pengetahuan LKPD (4 Skala) */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-[#fef08a] px-4 py-2 font-bold text-stone-900 text-xs uppercase border-b border-slate-300">
                        Lampiran 5: Rubrik Penilaian Pengetahuan LKPD (4 Skala)
                      </div>
                      <div className="p-4 space-y-2.5 bg-white">
                        {(rpmResult.lampiran?.penilaianPengetahuan?.pedomanSkor || []).map((p, idx) => (
                          <div key={idx} className="p-2.5 bg-stone-50 rounded-lg border border-slate-200 text-xs">
                            <div className="font-bold text-slate-900 mb-1">{idx + 1}. Aspek: {p.aspek}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700">
                              <div><span className="font-semibold text-emerald-800">Skor 4:</span> {p.skor4}</div>
                              <div><span className="font-semibold text-blue-800">Skor 3:</span> {p.skor3}</div>
                              <div><span className="font-semibold text-amber-800">Skor 2:</span> {p.skor2}</div>
                              <div><span className="font-semibold text-rose-800">Skor 1:</span> {p.skor1}</div>
                            </div>
                          </div>
                        ))}
                        <p className="text-[11px] font-semibold text-slate-600 mt-1">
                          Rumus: {rpmResult.lampiran?.penilaianPengetahuan?.rumusNilai || 'Nilai Akhir = (Jumlah Skor Diperoleh / 16) × 100'}
                        </p>
                      </div>
                    </div>

                    {/* Lampiran 6: Penilaian Keterampilan Praktik (4 Skala) */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-[#fef08a] px-4 py-2 font-bold text-stone-900 text-xs uppercase border-b border-slate-300">
                        Lampiran 6: Rubrik Penilaian Keterampilan Unjuk Kerja Praktik (4 Skala)
                      </div>
                      <div className="p-4 space-y-2.5 bg-white">
                        {(rpmResult.lampiran?.penilaianKeterampilan?.pedomanSkor || []).map((p, idx) => (
                          <div key={idx} className="p-2.5 bg-stone-50 rounded-lg border border-slate-200 text-xs">
                            <div className="font-bold text-slate-900 mb-1">{idx + 1}. Aspek: {p.aspek}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700">
                              <div><span className="font-semibold text-emerald-800">Skor 4:</span> {p.skor4}</div>
                              <div><span className="font-semibold text-blue-800">Skor 3:</span> {p.skor3}</div>
                              <div><span className="font-semibold text-amber-800">Skor 2:</span> {p.skor2}</div>
                              <div><span className="font-semibold text-rose-800">Skor 1:</span> {p.skor1}</div>
                            </div>
                          </div>
                        ))}
                        <p className="text-[11px] font-semibold text-slate-600 mt-1">
                          Rumus: {rpmResult.lampiran?.penilaianKeterampilan?.rumusNilai || 'Nilai Akhir = (Jumlah Skor Diperoleh / 16) × 100'}
                        </p>
                      </div>
                    </div>

                    {/* Lampiran 7: Pengayaan & Remedial */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-[#fef08a] px-4 py-2 font-bold text-stone-900 text-xs uppercase border-b border-slate-300">
                        Lampiran 7: Strategi Pengayaan dan Remedial
                      </div>
                      <div className="p-4 space-y-3 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200">
                            <span className="font-bold text-rose-900 block mb-1">Program Remedial:</span>
                            <p className="text-[11px] text-slate-700 mb-2">
                              Tujuan: {rpmResult.lampiran?.pengayaanDanRemedial?.remedial?.tujuan || 'Membantu murid yang belum tuntas mencapai kompetensi gerak.'}
                            </p>
                            <div className="space-y-1.5">
                              {(rpmResult.lampiran?.pengayaanDanRemedial?.remedial?.strategi || []).map((s, i) => (
                                <div key={i} className="text-[11px] text-slate-800">
                                  <span className="font-semibold">&bull; {s.nama}:</span> {s.deskripsi}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                            <span className="font-bold text-emerald-900 block mb-1">Program Pengayaan:</span>
                            <p className="text-[11px] text-slate-700 mb-2">
                              Tujuan: {rpmResult.lampiran?.pengayaanDanRemedial?.pengayaan?.tujuan || 'Memberikan tantangan perluasan keterampilan dan kepemimpinan.'}
                            </p>
                            <div className="space-y-1.5">
                              {(rpmResult.lampiran?.pengayaanDanRemedial?.pengayaan?.strategi || []).map((s, i) => (
                                <div key={i} className="text-[11px] text-slate-800">
                                  <span className="font-semibold">&bull; {s.nama}:</span> {s.deskripsi}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lampiran 8: Refleksi Guru & Peserta Didik */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-[#fef08a] px-4 py-2 font-bold text-stone-900 text-xs uppercase border-b border-slate-300">
                        Lampiran 8: Lembar Refleksi Guru dan Peserta Didik
                      </div>
                      <div className="p-4 space-y-3 bg-white text-xs">
                        <div className="space-y-1.5">
                          <span className="font-bold text-slate-900 block">A. Refleksi Guru:</span>
                          {(rpmResult.lampiran?.refleksi?.guru || []).map((g, i) => (
                            <div key={i} className="p-2 bg-stone-50 rounded border border-slate-200 flex justify-between gap-2">
                              <span>{i + 1}. {g.refleksiGuru || g.aspek}</span>
                              <span className="text-slate-400 font-serif italic">[........................]</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2">
                          <span className="font-bold text-slate-900 block mb-1">B. Refleksi Peserta Didik:</span>
                          <p className="text-slate-700 text-[11px] leading-relaxed">
                            {rpmResult.lampiran?.refleksi?.pesertaDidik || 'Menutup pembelajaran dengan refleksi diri menggunakan lembar ceklis jurnal refleksi mengenai pengalaman gerak dan perasaan belajar hari ini.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Lampiran 9: Soal Asesmen Akhir Sumatif */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-[#fef08a] px-4 py-2 font-bold text-stone-900 text-xs uppercase border-b border-slate-300">
                        Lampiran 9: Soal Asesmen Akhir Lingkup Materi (5 Butir Soal & Kunci Jawaban)
                      </div>
                      <div className="p-4 space-y-3 bg-white">
                        {(rpmResult.lampiran?.soalAsesmenAkhirList || []).map((s, idx) => (
                          <div key={idx} className="p-3 bg-stone-50 rounded-lg border border-slate-200 space-y-1">
                            <p className="font-bold text-slate-900">{s.no || idx + 1}. {s.pertanyaan}</p>
                            <p className="text-emerald-700 font-medium text-[11px]">
                              Kunci Jawaban: {s.kunciJawaban}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lampiran 10: Materi Ajar Ringkas */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-[#fef08a] px-4 py-2 font-bold text-stone-900 text-xs uppercase border-b border-slate-300">
                        Lampiran 10: Ringkasan Materi Ajar
                      </div>
                      <div className="p-4 bg-white text-xs whitespace-pre-wrap leading-relaxed text-slate-800">
                        {rpmResult.lampiran?.materiAjarRingkas || rpmResult.lampiran?.materiAjar}
                      </div>
                    </div>
                  </div>
                )}

                {/* LKPD NON-TABEL SECTION */}
                {(activeTab === 'lkpd' || activeTab === 'all') && (
                  <div className="space-y-4 pt-6 border-t-2 border-slate-300">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                      <span className="font-extrabold text-slate-900 text-sm uppercase">
                        LEMBAR KERJA PESERTA DIDIK (LKPD) - NON-TABEL
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        1 Pertemuan ({rpmResult.identitas?.alokasiWaktu || alokasiWaktu || '2x40 Menit'})
                      </span>
                    </div>

                    <div className="p-6 bg-stone-50/60 rounded-xl border border-slate-300 shadow-2xs font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-900">
                      {rpmResult.lkpdList?.[0]?.content || (
                        <p className="italic text-slate-500">LKPD sedang disusun...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-xs">
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                RPM Deep Learning 1 Pertemuan Belum Digenerate
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Pilih jenjang, sesuaikan kelas, topik pembelajaran, dan rumuskan Tujuan Pembelajaran pada panel di sebelah kiri, lalu klik tombol <b>Generate RPM 1 Pertemuan</b>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Master Prompt Modal */}
      {showPromptModal && (
        <AiPromptModal
          isOpen={showPromptModal}
          onClose={() => setShowPromptModal(false)}
          title="Prompt AI Perencanaan Pembelajaran Mendalam (1 Pertemuan)"
          tabs={getDeepLearning1PertemuanPrompts({
            penyusun,
            sekolah,
            tahunAjaran,
            semester,
            mataPelajaran,
            kelasFase: getEffectiveKelasFaseFormatted(),
            topik: materi,
            alokasiWaktu: alokasiWaktu.trim() || '2x40 Menit',
            cpText: capaianPembelajaran
          })}
        />
      )}
    </div>
  );
}

export default DeepLearningRpm1PertemuanView;
