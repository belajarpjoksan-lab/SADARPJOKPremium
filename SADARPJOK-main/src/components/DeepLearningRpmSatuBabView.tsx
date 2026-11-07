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
  ListOrdered
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DeepLearningRPM } from '../types';
import { exportRpmToDoc, downloadDocFile, copyAndOpenGoogleDocs, copyRichHtmlToClipboard, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import { RPMTableSection, RPMLampiranSection, RPMLkpdSection } from './DeepLearningDocumentPreview';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getDeepLearningSatuBabPrompts } from '../utils/aiPromptGenerators';
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

export function DeepLearningRpmSatuBabView() {
  // Jenjang, Kelas & Fase states
  const [jenjang, setJenjang] = useState<JenjangType>('SD');
  const [grade, setGrade] = useState('1');
  const [fase, setFase] = useState('Fase A');
  const [isCustomGrade, setIsCustomGrade] = useState(false);
  const [customGradeText, setCustomGradeText] = useState('');

  // Form Fields - Dedicated for 1 Bab
  const [bab, setBab] = useState('Bab 1: Pola Gerak Dasar dan Kebugaran Jasmani');
  const [materi, setMateri] = useState('Variasi Gerak Dasar Lokomotor, Non-Lokomotor, dan Manipulatif');
  const [penyusun, setPenyusun] = useState('Lendi Ike Hermawan, S.Pd., Gr.');
  const [sekolah, setSekolah] = useState('SD Negeri Kalimantong');
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027');
  const [semester, setSemester] = useState('1');
  const [mataPelajaran, setMataPelajaran] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)');
  const [alokasiWaktu, setAlokasiWaktu] = useState('16x40 Menit (8 Pertemuan)');
  const [konteksTambahan, setKonteksTambahan] = useState('');

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
    if (!bab.trim()) tempErrors.bab = 'Bab wajib diisi';
    if (!materi.trim()) tempErrors.materi = 'Topik / Lingkup Materi 1 Bab wajib diisi';
    if (!penyusun.trim()) tempErrors.penyusun = 'Nama Penyusun wajib diisi';
    if (!sekolah.trim()) tempErrors.sekolah = 'Nama Sekolah wajib diisi';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleGenerateRpm = async () => {
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
          materi: materi.trim(),
          penyusun: penyusun.trim(),
          sekolah: sekolah.trim(),
          tahunAjaran: tahunAjaran.trim(),
          semester,
          mataPelajaran: mataPelajaran.trim(),
          bab: bab.trim(),
          alokasiWaktu: alokasiWaktu.trim() || '16x40 Menit (8 Pertemuan)',
          jumlahPertemuan: '8',
          isSatuBab: true,
          mode: 'satu_bab',
          konteksTambahan: konteksTambahan.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server merespon dengan status ${response.status}`);
      }

      const result = await response.json();
      setRpmResult(result);
    } catch (err: any) {
      console.error('Failed to generate RPM 1 Bab:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat membuat modul perencanaan pembelajaran mendalam.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDoc = () => {
    if (!rpmResult) return;
    const docHtml = exportRpmToDoc(rpmResult);
    const fileName = `RPM_DeepLearning_1Bab_${rpmResult.identitas.mataPelajaran}_${rpmResult.identitas.kelasFase.replace(/[/\\?%*:|"<>]/g, '-')}.doc`;
    downloadDocFile(fileName, docHtml);
  };

  const handleCopyAndGoogleDocs = () => {
    if (!rpmResult) return;
    const docHtml = exportRpmToDoc(rpmResult);
    copyAndOpenGoogleDocs(docHtml);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 3000);
  };

  const handleCopyHtml = async () => {
    if (!rpmResult) return;
    const docHtml = exportRpmToDoc(rpmResult);
    const success = await copyRichHtmlToClipboard(docHtml);
    if (success) {
      setCopiedTextStatus(true);
      setTimeout(() => setCopiedTextStatus(false), 2500);
    }
  };

  const handleDownloadPdf = async () => {
    if (!rpmResult) return;
    setExportingPdf(true);
    try {
      const docHtml = exportRpmToDoc(rpmResult);
      const fileName = `RPM_DeepLearning_1Bab_${rpmResult.identitas.mataPelajaran}_${rpmResult.identitas.kelasFase.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
      await downloadHtmlAsPdf(fileName, docHtml, { orientation: 'portrait', marginMm: 12 });
    } catch (error) {
      console.error('Error generating PDF:', error);
      const docHtml = exportRpmToDoc(rpmResult);
      printHtmlDocument(docHtml);
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!rpmResult) return;
    const docHtml = exportRpmToDoc(rpmResult);
    printHtmlDocument(docHtml);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Standar Resmi Lendi Ike Hermawan, S.Pd., Gr.</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Generator RPM Deep Learning 1 Bab Lengkap
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base max-w-3xl leading-relaxed">
              Penyusunan Perencanaan Pembelajaran Mendalam (RPM) komprehensif untuk <strong>1 Bab Penuh</strong> dengan total 
              <span className="bg-emerald-800/80 px-2 py-0.5 rounded font-bold text-white mx-1">{alokasiWaktu || '16x40 Menit (8 Pertemuan)'}</span>. 
              Mencakup Desain Pembelajaran 8 Pertemuan, Kegiatan Inti Memahami-Mengaplikasikan-Merefleksikan (DPL di tiap aktivitas), 
              5 Soal Asesmen Awal & Akhir + Kunci, Rubrik 4 Skala, Materi Ajar, dan 8 LKPD Non-Tabel siap cetak / export Word.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => setShowPromptModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 font-bold hover:bg-emerald-50 transition-all shadow-md text-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Prompt AI Master (1 Bab)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Input & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <School className="w-5 h-5 text-emerald-600" />
              <span>Identitas & Parameter 1 Bab</span>
            </h2>

            {/* Jenjang Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Pilih Jenjang Sekolah
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
                {JENJANG_CONFIG.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => handleSelectJenjang(j.id)}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      jenjang === j.id
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div>{j.label}</div>
                    <div className="text-[10px] font-normal opacity-75">{j.badge}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Kelas & Fase Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Kelas & Fase
              </label>
              <div className="flex flex-wrap gap-2">
                {KELAS_PRESETS[jenjang]?.map((p) => {
                  const isSelected = !isCustomGrade && grade === p.grade;
                  return (
                    <button
                      key={p.grade}
                      type="button"
                      onClick={() => handleSelectGrade(p.grade, p.fase)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {p.label} <span className="opacity-80">({p.fase})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bab & Materi Pokok Input (Sesuai Buku Panduan Guru SIBI) */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <SibiUnitSelectorBar
                grade={grade}
                currentTopic={materi}
                onSelectUnit={(unit) => {
                  setBab(`${unit.unitTitle} (Buku Panduan Guru SIBI)`);
                  setMateri(unit.pokokMateri);
                  setSemester(unit.semester);
                  setKonteksTambahan(`Rujukan Resmi SIBI: ${unit.sumberBukuSibi} | Pemanasan Permainan: ${unit.pemanasanPermainan} | Aktivitas SIBI: ${unit.aktivitasPembelajaran.join(' ; ')}`);
                }}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Nama Unit / Bab Buku Panduan SIBI <span className="text-red-500">*</span></span>
                  <span className="text-[11px] text-slate-400 font-normal">Contoh: Unit 1 SIBI</span>
                </label>
                <input
                  type="text"
                  value={bab}
                  onChange={(e) => {
                    setBab(e.target.value);
                    if (errors.bab) setErrors({ ...errors, bab: '' });
                  }}
                  placeholder="Misal: Bab 1: Pola Gerak Dasar dan Kebugaran Jasmani"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    errors.bab ? 'border-red-400 bg-red-50/50' : 'border-slate-200'
                  }`}
                />
                {errors.bab && <p className="text-xs text-red-600">{errors.bab}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Topik / Ruang Lingkup Materi 1 Bab <span className="text-red-500">*</span></span>
                </label>
                <textarea
                  rows={2}
                  value={materi}
                  onChange={(e) => {
                    setMateri(e.target.value);
                    if (errors.materi) setErrors({ ...errors, materi: '' });
                  }}
                  placeholder="Misal: Pola Gerak Dasar Lokomotor, Non-lokomotor, dan Manipulatif serta Kebugaran Jasmani"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    errors.materi ? 'border-red-400 bg-red-50/50' : 'border-slate-200'
                  }`}
                />
                {errors.materi && <p className="text-xs text-red-600">{errors.materi}</p>}
              </div>
            </div>

            {/* Alokasi Waktu (Editable + Quick Presets) */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Alokasi Waktu & Pertemuan</span>
                </label>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                  Bisa Diedit
                </span>
              </div>
              <input
                type="text"
                value={alokasiWaktu}
                onChange={(e) => setAlokasiWaktu(e.target.value)}
                placeholder="Contoh: 16x40 Menit (8 Pertemuan)"
                className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-medium text-emerald-800 mr-0.5">Pilih Cepat:</span>
                {[
                  '16x35 Menit (8 Pertemuan)',
                  '16x40 Menit (8 Pertemuan)',
                  '16x45 Menit (8 Pertemuan)',
                  '12x40 Menit (6 Pertemuan)',
                  '8x40 Menit (4 Pertemuan)'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAlokasiWaktu(preset)}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold transition border cursor-pointer ${
                      alokasiWaktu === preset
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100/60'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Mata Pelajaran & Penyusun */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={mataPelajaran}
                  onChange={(e) => setMataPelajaran(e.target.value)}
                  placeholder="Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Penyusun <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={penyusun}
                  onChange={(e) => {
                    setPenyusun(e.target.value);
                    if (errors.penyusun) setErrors({ ...errors, penyusun: '' });
                  }}
                  placeholder="Lendi Ike Hermawan, S.Pd., Gr."
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    errors.penyusun ? 'border-red-400 bg-red-50/50' : 'border-slate-200'
                  }`}
                />
                {errors.penyusun && <p className="text-xs text-red-600">{errors.penyusun}</p>}
              </div>
            </div>

            {/* Sekolah, Tahun Ajaran, Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Sekolah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sekolah}
                  onChange={(e) => {
                    setSekolah(e.target.value);
                    if (errors.sekolah) setErrors({ ...errors, sekolah: '' });
                  }}
                  placeholder="SD Negeri Kalimantong"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    errors.sekolah ? 'border-red-400 bg-red-50/50' : 'border-slate-200'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  value={tahunAjaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  placeholder="2026/2027"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                >
                  <option value="1">Semester 1 (Ganjil)</option>
                  <option value="2">Semester 2 (Genap)</option>
                </select>
              </div>
            </div>

            {/* Konteks Tambahan (Opsional) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Instruksi Khusus / Konteks Tambahan</span>
                <span className="text-[11px] text-slate-400 font-normal">Opsional</span>
              </label>
              <textarea
                rows={2}
                value={konteksTambahan}
                onChange={(e) => setKonteksTambahan(e.target.value)}
                placeholder="Misal: Tekankan diferensiasi proses dengan variasi pos latihan sirkuit, integrasikan edukasi gizi sehat..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Gagal Menyusun Modul</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleGenerateRpm}
              disabled={loading}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] shadow-emerald-600/25'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Menyusun 1 Bab Lengkap (8 Pertemuan)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Buat RPM 1 Bab (8 Pertemuan) Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Preview & Results */}
        <div className="lg:col-span-7 space-y-4">
          {!rpmResult ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center space-y-4 min-h-[520px] flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner">
                <BookOpen className="w-10 h-10" />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-bold text-slate-800">
                  Belum Ada RPM 1 Bab yang Dibuat
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Lengkapi identitas Bab, Topik, dan Satuan Pendidikan di formulir samping, lalu klik 
                  <strong className="text-emerald-700"> "Buat RPM 1 Bab (8 Pertemuan) Sekarang"</strong>. 
                  Sistem akan menghasilkan Rencana Pembelajaran Mendalam lengkap dengan tabel 2 kolom, 
                  lampiran asesmen 4 skala, materi ajar ringkas, serta 8 LKPD non-tabel siap pakai.
                </p>
              </div>

              <div className="pt-4 flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setShowPromptModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Lihat Prompt AI Master (1 Bab)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      RPM 1 Bab Siap Digunakan
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {rpmResult.identitas?.alokasiWaktu || alokasiWaktu || '16x40 Menit (8 Pertemuan)'} | DPL Lengkap
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadDoc}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    title="Unduh dokumen dalam format Microsoft Word (.doc) portrait"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Ekspor Word (.doc)</span>
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    disabled={exportingPdf}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                    title="Unduh dokumen langsung dalam format PDF Portrait"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>{exportingPdf ? 'Memproses PDF...' : 'Unduh PDF'}</span>
                  </button>

                  <button
                    onClick={handleCopyAndGoogleDocs}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                    title="Buka langsung Google Docs baru dan salin format rapi"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{copiedStatus ? 'Tersalin!' : 'Buka di Docs'}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
                    title="Cetak langsung dokumen"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak</span>
                  </button>
                </div>
              </div>

              {/* View Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('rpm')}
                  className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                    activeTab === 'rpm'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tabel RPP 1 Bab (8 Pertemuan)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('lampiran')}
                  className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                    activeTab === 'lampiran'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lampiran & Asesmen (4 Skala)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('lkpd')}
                  className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                    activeTab === 'lkpd'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  8 LKPD Non-Tabel ({rpmResult.lkpdList?.length || 8})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Dokumen
                </button>
              </div>

              {/* Document Container */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 overflow-y-auto max-h-[800px] space-y-8">
                {activeTab === 'rpm' && (
                  <RPMTableSection rpm={rpmResult} />
                )}

                {activeTab === 'lampiran' && (
                  <RPMLampiranSection rpm={rpmResult} />
                )}

                {activeTab === 'lkpd' && (
                  <div className="space-y-4">
                    {/* Meeting Switcher for LKPD */}
                    {rpmResult.lkpdList && rpmResult.lkpdList.length > 0 && (
                      <div className="space-y-2 pb-4 border-b border-slate-200">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                          Pilih Pertemuan LKPD (1 s.d. 8)
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                          {rpmResult.lkpdList.map((lkpd, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedLkpdIndex(idx)}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                selectedLkpdIndex === idx
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              Pert. {idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <RPMLkpdSection rpm={rpmResult} selectedIndex={selectedLkpdIndex} />
                  </div>
                )}

                {activeTab === 'all' && (
                  <div className="space-y-10">
                    <RPMTableSection rpm={rpmResult} />
                    <div className="my-8 border-t-4 border-emerald-700" />
                    <RPMLampiranSection rpm={rpmResult} />
                    <div className="my-8 border-t-4 border-emerald-700" />
                    <RPMLkpdSection rpm={rpmResult} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Prompt Modal for 1 Bab */}
      {showPromptModal && (
        <AiPromptModal
          isOpen={showPromptModal}
          onClose={() => setShowPromptModal(false)}
          title={`Prompt AI - RPM Deep Learning 1 Bab Lengkap (${alokasiWaktu.trim() || '16x40 Menit (8 Pertemuan)'})`}
          subtitle={`${bab || 'Bab 1'} - ${materi || 'Deep Learning PJOK'} - Kelas ${grade} (${fase})`}
          tabs={getDeepLearningSatuBabPrompts({
            penyusun,
            sekolah,
            tahunAjaran,
            semester,
            mataPelajaran,
            kelasFase: getEffectiveKelasFaseFormatted(),
            bab,
            topik: materi,
            alokasiWaktu: alokasiWaktu.trim() || '16x40 Menit (8 Pertemuan)'
          })}
          defaultActiveTab="rpm_satu_bab_lendi"
          jsonData={rpmResult || {
            bab,
            topik: materi,
            jenjang,
            kelas: grade,
            fase,
            jumlahPertemuan: '8',
            alokasiWaktu: alokasiWaktu.trim() || '16x40 Menit (8 Pertemuan)',
            penyusun,
            sekolah
          }}
          jsonFilename={`RPM_1Bab_${(materi || 'PJOK').replace(/\s+/g, '_')}_Kelas_${grade}.json`}
        />
      )}
    </div>
  );
}

export default DeepLearningRpmSatuBabView;
