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
  Layers, 
  Calendar, 
  Clock, 
  GraduationCap, 
  School,
  Target,
  FileCheck2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DeepLearningRPM } from '../types';
import { exportRpmToDoc, downloadDocFile, copyAndOpenGoogleDocs, copyRichHtmlToClipboard, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import { RPMTableSection, RPMLampiranSection, RPMLkpdSection } from './DeepLearningDocumentPreview';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getDeepLearning1TpPrompts } from '../utils/aiPromptGenerators';
import SibiUnitSelectorBar from './SibiUnitSelectorBar';

type JenjangType = 'SD' | 'SMP' | 'SMA' | 'PAUD';

const JENJANG_CONFIG: Array<{ id: JenjangType; label: string; badge: string; color: string }> = [
  { id: 'SD', label: 'SD / MI', badge: 'Fase A, B, C', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'SMP', label: 'SMP / MTs', badge: 'Fase D', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'SMA', label: 'SMA / SMK', badge: 'Fase E & F', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { id: 'PAUD', label: 'PAUD / TK', badge: 'Fase Fondasi', color: 'text-amber-700 bg-amber-50 border-amber-200' },
];

const KELAS_PRESETS: Record<JenjangType, Array<{ grade: string; label: string; fase: string; desc: string }>> = {
  SD: [
    { grade: '1', label: 'Kelas 1', fase: 'Fase A', desc: 'Kelas 1 SD (Fase A)' },
    { grade: '2', label: 'Kelas 2', fase: 'Fase A', desc: 'Kelas 2 SD (Fase A)' },
    { grade: '3', label: 'Kelas 3', fase: 'Fase B', desc: 'Kelas 3 SD (Fase B)' },
    { grade: '4', label: 'Kelas 4', fase: 'Fase B', desc: 'Kelas 4 SD (Fase B)' },
    { grade: '5', label: 'Kelas 5', fase: 'Fase C', desc: 'Kelas 5 SD (Fase C)' },
    { grade: '6', label: 'Kelas 6', fase: 'Fase C', desc: 'Kelas 6 SD (Fase C)' },
  ],
  SMP: [
    { grade: '7', label: 'Kelas 7', fase: 'Fase D', desc: 'Kelas 7 SMP (Fase D)' },
    { grade: '8', label: 'Kelas 8', fase: 'Fase D', desc: 'Kelas 8 SMP (Fase D)' },
    { grade: '9', label: 'Kelas 9', fase: 'Fase D', desc: 'Kelas 9 SMP (Fase D)' },
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
  { grade: 'PAUD', label: 'PAUD / TK (Fase Fondasi)', fase: 'Fase Fondasi', jenjang: 'PAUD' as JenjangType },
  { grade: '1', label: 'Kelas 1 SD / MI (Fase A)', fase: 'Fase A', jenjang: 'SD' as JenjangType },
  { grade: '2', label: 'Kelas 2 SD / MI (Fase A)', fase: 'Fase A', jenjang: 'SD' as JenjangType },
  { grade: '3', label: 'Kelas 3 SD / MI (Fase B)', fase: 'Fase B', jenjang: 'SD' as JenjangType },
  { grade: '4', label: 'Kelas 4 SD / MI (Fase B)', fase: 'Fase B', jenjang: 'SD' as JenjangType },
  { grade: '5', label: 'Kelas 5 SD / MI (Fase C)', fase: 'Fase C', jenjang: 'SD' as JenjangType },
  { grade: '6', label: 'Kelas 6 SD / MI (Fase C)', fase: 'Fase C', jenjang: 'SD' as JenjangType },
  { grade: '7', label: 'Kelas 7 SMP / MTs (Fase D)', fase: 'Fase D', jenjang: 'SMP' as JenjangType },
  { grade: '8', label: 'Kelas 8 SMP / MTs (Fase D)', fase: 'Fase D', jenjang: 'SMP' as JenjangType },
  { grade: '9', label: 'Kelas 9 SMP / MTs (Fase D)', fase: 'Fase D', jenjang: 'SMP' as JenjangType },
  { grade: '10', label: 'Kelas 10 SMA / SMK (Fase E)', fase: 'Fase E', jenjang: 'SMA' as JenjangType },
  { grade: '11', label: 'Kelas 11 SMA / SMK (Fase F)', fase: 'Fase F', jenjang: 'SMA' as JenjangType },
  { grade: '12', label: 'Kelas 12 SMA / SMK (Fase F)', fase: 'Fase F', jenjang: 'SMA' as JenjangType },
];

export function DeepLearningRpm1TpView() {
  // Jenjang, Kelas & Fase states
  const [jenjang, setJenjang] = useState<JenjangType>('SD');
  const [grade, setGrade] = useState('4');
  const [fase, setFase] = useState('Fase B');
  const [isCustomGrade, setIsCustomGrade] = useState(false);
  const [customGradeText, setCustomGradeText] = useState('');

  // Form Fields - Dedicated for 1 TP (rafsanjani, S.Pd., Gr. format & SIBI Guidebook)
  const [bab, setBab] = useState('Unit 1: Aktivitas Pola Gerak Dasar Lokomotor, Nonlokomotor, dan Manipulatif Melalui Permainan Invasi');
  const [materi, setMateri] = useState('Variasi dan Kombinasi Pola Gerak Dasar Melempar, Menangkap, Menggiring, dan Menendang Bola dalam Permainan Invasi (Bola Tangan & Sepak Bola Mini)');
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState(
    'Murid dapat mempraktikkan dan menganalisis konsep variasi serta kombinasi gerak dasar lokomotor, nonlokomotor, dan manipulatif dalam permainan invasi serta menunjukkan nilai mandiri dan gotong royong sesuai Buku Panduan Guru PJOK SIBI.'
  );
  const [penyusun, setPenyusun] = useState('rafsanjani, S.Pd., Gr.');
  const [sekolah, setSekolah] = useState('SD Negeri Kalimantong');
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027');
  const [semester, setSemester] = useState('1');
  const [mataPelajaran, setMataPelajaran] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)');
  const [jumlahPertemuan, setJumlahPertemuan] = useState<'2' | '3'>('2');
  const [alokasiWaktu, setAlokasiWaktu] = useState('6x35 Menit (2 Pertemuan)');
  const [konteksTambahan, setKonteksTambahan] = useState('Sesuai Buku Panduan Guru PJOK Kelas IV SD/MI SIBI Kemendikdasmen (Muhajir & Agus Gunawan)');

  // UI state
  const [loading, setLoading] = useState(false);
  const [rpmResult, setRpmResult] = useState<DeepLearningRPM | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'rpm' | 'lampiran' | 'lkpd' | 'all'>('rpm');
  const [selectedLkpdIndex, setSelectedLkpdIndex] = useState(0);
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [copiedTextStatus, setCopiedTextStatus] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handlePertemuanChange = (count: '2' | '3') => {
    setJumlahPertemuan(count);
    if (count === '2') {
      setAlokasiWaktu('6x40 Menit (2 Pertemuan)');
    } else {
      setAlokasiWaktu('6x40 Menit (3 Pertemuan)');
    }
  };

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
    if (!tujuanPembelajaran.trim()) tempErrors.tujuanPembelajaran = 'Tujuan Pembelajaran (1 TP) wajib dirumuskan';
    if (!penyusun.trim()) tempErrors.penyusun = 'Nama Guru Penyusun wajib diisi';
    if (!sekolah.trim()) tempErrors.sekolah = 'Nama Sekolah wajib diisi';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleGenerate = async () => {
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
          penyusun,
          sekolah,
          tahunAjaran,
          semester,
          mataPelajaran,
          bab,
          tujuanPembelajaran,
          alokasiWaktu,
          jumlahPertemuan,
          konteksTambahan,
          is1Tp: true,
          mode: '1_tp'
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menyusun RPM 1 TP dari server');
      }

      const data = await response.json();
      if (!data || !data.identitas) {
        throw new Error('Format data RPM 1 TP tidak valid');
      }

      setRpmResult(data);
      setActiveTab('rpm');
      setSelectedLkpdIndex(0);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses generator RPM 1 TP.');
    } finally {
      setLoading(false);
    }
  };

  // Export handlers
  const handleExportWord = () => {
    if (!rpmResult) return;
    const docHtml = exportRpmToDoc(rpmResult);
    const fileName = `RPM_DeepLearning_1TP_${(rpmResult.identitas.topik || 'PJOK').replace(/[^a-zA-Z0-9]/g, '_')}_${rpmResult.identitas.kelasFase.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
    downloadDocFile(fileName, docHtml);
  };

  const handleCopyGoogleDocs = async () => {
    if (!rpmResult) return;
    const docHtml = exportRpmToDoc(rpmResult);
    const success = await copyAndOpenGoogleDocs(docHtml);
    if (success) {
      setCopiedStatus(true);
      setTimeout(() => setCopiedStatus(false), 3000);
    }
  };

  const handleCopyRichHtml = async () => {
    if (!rpmResult) return;
    const docHtml = exportRpmToDoc(rpmResult);
    const success = await copyRichHtmlToClipboard(docHtml);
    if (success) {
      setCopiedTextStatus(true);
      setTimeout(() => setCopiedTextStatus(false), 2500);
    }
  };

  const handleExportPdf = async () => {
    if (!rpmResult) return;
    setExportingPdf(true);
    try {
      const docHtml = exportRpmToDoc(rpmResult);
      const fileName = `RPM_DeepLearning_1TP_${(rpmResult.identitas.topik || 'PJOK').replace(/[^a-zA-Z0-9]/g, '_')}_${rpmResult.identitas.kelasFase.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      await downloadHtmlAsPdf(fileName, docHtml, {
        orientation: 'portrait',
        marginMm: 12
      });
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setExportingPdf(false);
    }
  };

  const promptTabs = getDeepLearning1TpPrompts({
    penyusun,
    sekolah,
    tahunAjaran,
    semester,
    mataPelajaran,
    kelasFase: getEffectiveKelasFaseFormatted(),
    bab,
    topik: materi,
    alokasiWaktu,
    capaianPembelajaran: 'Peserta didik mampu mempraktikkan, menganalisis, dan membiasakan aktivitas fisik secara mindful, meaningful, dan joyful sesuai fase perkembangan.',
    tujuanPembelajaran,
    jumlahPertemuan
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-cyan-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-teal-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Generator RPM Deep Learning: 1 TP (Tujuan Pembelajaran)
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Perencanaan Pembelajaran Mendalam (RPM) 1 TP
            </h1>
            <p className="text-teal-100 text-sm md:text-base leading-relaxed">
              Format baku master prompt karya <strong>rafsanjani, S.Pd., Gr.</strong> dengan 1 Tujuan Pembelajaran fokus untuk 2-3 pertemuan, tabel terstruktur 2-kolom, asesmen 5 butir soal, rubrik 4 skala, materi ajar, dan LKPD interaktif non-tabel lengkap siap download.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setShowPromptModal(true)}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <FileCheck2 className="w-4 h-4 text-amber-300" />
              Prompt AI (rafsanjani)
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Inputs and Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs Panel */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                Parameter RPM 1 TP
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                1 TP Fokus
              </span>
            </div>

            {/* Jenjang Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                1. Jenjang Pendidikan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {JENJANG_CONFIG.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => handleSelectJenjang(j.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col justify-between ${
                      jenjang === j.id
                        ? `${j.color} shadow-sm ring-2 ring-emerald-500/20 font-bold`
                        : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{j.label}</span>
                    <span className="text-[10px] opacity-75 font-normal">{j.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Kelas & Fase Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  2. Kelas & Fase Capaian
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomGrade(!isCustomGrade)}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2"
                >
                  {isCustomGrade ? 'Pilih dari Preset' : '+ Kustom Kelas'}
                </button>
              </div>

              {isCustomGrade ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customGradeText}
                    onChange={(e) => setCustomGradeText(e.target.value)}
                    placeholder="Contoh: Kelas 3 SD / MI"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Pilih Fase:</span>
                    <select
                      value={fase}
                      onChange={(e) => setFase(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Fase Fondasi">Fase Fondasi (PAUD)</option>
                      <option value="Fase A">Fase A (Kelas 1-2 SD)</option>
                      <option value="Fase B">Fase B (Kelas 3-4 SD)</option>
                      <option value="Fase C">Fase C (Kelas 5-6 SD)</option>
                      <option value="Fase D">Fase D (Kelas 7-9 SMP)</option>
                      <option value="Fase E">Fase E (Kelas 10 SMA)</option>
                      <option value="Fase F">Fase F (Kelas 11-12 SMA)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={grade}
                    onChange={(e) => handleSelectDropdownGrade(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {ALL_KELAS_OPTIONS.map((opt) => (
                      <option key={opt.grade} value={opt.grade}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                    <span>Fase Terpilih: <strong className="text-emerald-700">{fase}</strong></span>
                    <span>Tingkat: <strong className="text-slate-700">{getEffectiveGradeText()}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Bab & Topik */}
            <div className="space-y-3">
              <SibiUnitSelectorBar
                grade={grade}
                selectedMateri={materi}
                onSelectUnit={(unit) => {
                  setBab(`${unit.unitCode}: ${unit.unitTitle}`);
                  setMateri(unit.pokokMateri);
                  setSemester(String(unit.semester));
                  if (unit.tujuanPembelajaran && unit.tujuanPembelajaran.length > 0) {
                    setTujuanPembelajaran(unit.tujuanPembelajaran[0]);
                  }
                  setKonteksTambahan(
                    `Sesuai Buku Panduan Guru PJOK SIBI (${unit.sumberBukuSibi}). Pemanasan Permainan: ${unit.pemanasanPermainan}. Aktivitas Inti: ${unit.aktivitasPembelajaran.join(' | ')}.`
                  );
                  if (errors.materi) setErrors({ ...errors, materi: '' });
                }}
              />

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  3. Judul Bab / Unit SIBI
                </label>
                <input
                  type="text"
                  value={bab}
                  onChange={(e) => setBab(e.target.value)}
                  placeholder="Misal: Bab 1: Pola Gerak Dasar dan Kebugaran Jasmani"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  4. Topik / Sub Topik Materi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={materi}
                  onChange={(e) => {
                    setMateri(e.target.value);
                    if (errors.materi) setErrors({ ...errors, materi: '' });
                  }}
                  placeholder="Misal: Variasi Gerak Dasar Lokomotor, Non-Lokomotor, dan Manipulatif"
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 ${
                    errors.materi
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {errors.materi && <p className="text-xs text-rose-500 mt-1">{errors.materi}</p>}
              </div>

              {/* Single Tujuan Pembelajaran (1 TP) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    5. Tujuan Pembelajaran (1 TP) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Gunakan "Murid ..."
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={tujuanPembelajaran}
                  onChange={(e) => {
                    setTujuanPembelajaran(e.target.value);
                    if (errors.tujuanPembelajaran) setErrors({ ...errors, tujuanPembelajaran: '' });
                  }}
                  placeholder="Murid dapat menganalisis dan mempraktikkan keterampilan... (Level Kognitif: Menganalisis/C4 & Menerapkan/C3)"
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 ${
                    errors.tujuanPembelajaran
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Sesuai format rafsanjani: Buat 1 tujuan pembelajaran yang merinci kompetensi dan level kognitif untuk 2-3 pertemuan.
                </p>
                {errors.tujuanPembelajaran && <p className="text-xs text-rose-500 mt-1">{errors.tujuanPembelajaran}</p>}
              </div>
            </div>

            {/* Jumlah Pertemuan & Alokasi Waktu */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                6. Jumlah Pertemuan & Alokasi Waktu
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePertemuanChange('2')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col justify-between ${
                    jumlahPertemuan === '2'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    2 Pertemuan (Default)
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Struktur 2 Pertemuan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePertemuanChange('3')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col justify-between ${
                    jumlahPertemuan === '3'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    3 Pertemuan
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Struktur 3 Pertemuan</span>
                </button>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Detail Alokasi Waktu (Bisa Diedit Manual)
                </label>
                <input
                  type="text"
                  value={alokasiWaktu}
                  onChange={(e) => setAlokasiWaktu(e.target.value)}
                  placeholder="Contoh: 6x40 Menit (2 Pertemuan)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    `4x35 Menit (${jumlahPertemuan} Pertemuan)`,
                    `6x35 Menit (${jumlahPertemuan} Pertemuan)`,
                    `4x40 Menit (${jumlahPertemuan} Pertemuan)`,
                    `6x40 Menit (${jumlahPertemuan} Pertemuan)`,
                    `6x45 Menit (${jumlahPertemuan} Pertemuan)`,
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAlokasiWaktu(preset)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all ${
                        alokasiWaktu === preset
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Identitas Guru & Sekolah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Guru Penyusun
                </label>
                <input
                  type="text"
                  value={penyusun}
                  onChange={(e) => setPenyusun(e.target.value)}
                  placeholder="rafsanjani, S.Pd., Gr."
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Nama Sekolah
                </label>
                <input
                  type="text"
                  value={sekolah}
                  onChange={(e) => setSekolah(e.target.value)}
                  placeholder="SD Negeri Kalimantong"
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="1">Semester 1 (Ganjil)</option>
                  <option value="2">Semester 2 (Genap)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  value={tahunAjaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  placeholder="2026/2027"
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-800 hover:from-teal-800 hover:via-emerald-800 hover:to-cyan-900 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyusun RPM 1 TP ({jumlahPertemuan} Pertemuan)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate RPM Deep Learning 1 TP</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results & Document Preview Panel */}
        <div className="lg:col-span-8 space-y-4">
          {rpmResult ? (
            <div className="space-y-4">
              {/* Document Action Toolbar */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('rpm')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'rpm'
                        ? 'bg-white text-emerald-800 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tabel RPM (A-E)
                  </button>
                  <button
                    onClick={() => setActiveTab('lampiran')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'lampiran'
                        ? 'bg-white text-emerald-800 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Lampiran Asesmen
                  </button>
                  <button
                    onClick={() => setActiveTab('lkpd')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'lkpd'
                        ? 'bg-white text-emerald-800 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    LKPD ({rpmResult.lkpdList?.length || jumlahPertemuan} Pertemuan)
                  </button>
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'all'
                        ? 'bg-white text-emerald-800 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua Bagian
                  </button>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportWord}
                    title="Download Word (.doc)"
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <FileDown className="w-3.5 h-3.5 text-blue-600" />
                    <span>Download Word (.doc)</span>
                  </button>
                  <button
                    onClick={handleExportPdf}
                    disabled={exportingPdf}
                    title="Download PDF Siap Cetak"
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {exportingPdf ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Printer className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={handleCopyGoogleDocs}
                    title="Buka dan Salin ke Google Docs"
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                    <span>{copiedStatus ? 'Tersalin!' : 'Google Docs'}</span>
                  </button>
                  <button
                    onClick={handleCopyRichHtml}
                    title="Salin Teks Lengkap"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ClipboardCopy className="w-3.5 h-3.5 text-slate-600" />
                    <span>{copiedTextStatus ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* LKPD Sub-Selector if in LKPD tab */}
              {activeTab === 'lkpd' && rpmResult.lkpdList && rpmResult.lkpdList.length > 1 && (
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
                  <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Pilih Pertemuan:</span>
                  {rpmResult.lkpdList.map((lk, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedLkpdIndex(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedLkpdIndex === idx
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {lk.pertemuan}
                    </button>
                  ))}
                </div>
              )}

              {/* Rendered Document Container */}
              <div
                id="rpm-preview-container"
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-8"
              >
                {/* Header Title Document */}
                <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900">
                    PERENCANAAN PEMBELAJARAN MENDALAM (RPM)
                  </h2>
                  <p className="text-sm font-bold text-emerald-800">
                    1 TUJUAN PEMBELAJARAN ({rpmResult.identitas.alokasiWaktu || alokasiWaktu})
                  </p>
                  <p className="text-xs text-slate-600">
                    Format Baku Master: rafsanjani, S.Pd., Gr. | {rpmResult.identitas.sekolah}
                  </p>
                </div>

                {/* Content according to active tab */}
                {(activeTab === 'rpm' || activeTab === 'all') && (
                  <RPMTableSection rpm={rpmResult} />
                )}

                {(activeTab === 'lampiran' || activeTab === 'all') && (
                  <RPMLampiranSection rpm={rpmResult} />
                )}

                {(activeTab === 'lkpd' || activeTab === 'all') && (
                  <RPMLkpdSection 
                    rpm={rpmResult} 
                    selectedIndex={activeTab === 'all' ? undefined : selectedLkpdIndex} 
                  />
                )}
              </div>

              {/* Bottom Quick Tools */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Dokumen RPM 1 TP siap diexport atau dicetak sesuai standar format rafsanjani, S.Pd., Gr.
                </div>
                <ExportJsonPromptAiButtons
                  onExportJson={() => {
                    const filename = `RPM_1TP_${(materi || 'PJOK').replace(/\s+/g, '_')}_Kelas_${grade}.json`;
                    downloadJsonFile(filename, rpmResult);
                  }}
                  onOpenPromptAi={() => setShowPromptModal(true)}
                  aiLabel="Prompt AI (rafsanjani)"
                />
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100 shadow-sm">
                <Target className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-800">
                  Siap Menyusun RPM Deep Learning 1 TP
                </h3>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                  Pilih Jenjang, Kelas, Topik Materi, dan rumuskan 1 Tujuan Pembelajaran (dengan kata <em>"Murid..."</em> dan level kognitif). Generator akan menyusun RPM tabel 2-kolom, asesmen awal/proses/akhir, rubrik 4 skala, dan LKPD non-tabel lengkap untuk 2-3 pertemuan.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200">
                  Penyusun: rafsanjani, S.Pd., Gr.
                </span>
                <span className="text-[11px] px-3 py-1 bg-blue-50 text-blue-700 font-semibold rounded-full border border-blue-200">
                  Kepsek: Soleh, S.Pd., M.Pd.
                </span>
                <span className="text-[11px] px-3 py-1 bg-purple-50 text-purple-700 font-semibold rounded-full border border-purple-200">
                  Alokasi: {alokasiWaktu || '6x40 Menit (2-3 Pertemuan)'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ai Prompt Modal */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI Perencanaan Pembelajaran Mendalam (1 TP)"
        tabs={promptTabs}
      />
    </div>
  );
}

export default DeepLearningRpm1TpView;
