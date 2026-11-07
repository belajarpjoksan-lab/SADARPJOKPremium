import React, { useState } from 'react';
import { Sparkles, FileText, ClipboardCopy, FileDown, BookOpen, User, Users, CheckCircle2, AlertCircle, RefreshCw, Printer, ExternalLink, Copy, Layers, Calendar, Clock, GraduationCap, School } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DeepLearningRPM } from '../types';
import { exportRpmToDoc, downloadDocFile, copyAndOpenGoogleDocs, copyRichHtmlToClipboard, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import { RPMTableSection, RPMLampiranSection, RPMLkpdSection } from './DeepLearningDocumentPreview';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getDeepLearningPrompts } from '../utils/aiPromptGenerators';
import SibiUnitSelectorBar from './SibiUnitSelectorBar';

// Konfigurasi Jenjang, Kelas, dan Fase Kurikulum Merdeka
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

const ALL_FASES = [
  { value: 'Fase Fondasi', label: 'Fase Fondasi (PAUD / TK)' },
  { value: 'Fase A', label: 'Fase A (SD Kelas 1 - 2)' },
  { value: 'Fase B', label: 'Fase B (SD Kelas 3 - 4)' },
  { value: 'Fase C', label: 'Fase C (SD Kelas 5 - 6)' },
  { value: 'Fase D', label: 'Fase D (SMP Kelas 7 - 9)' },
  { value: 'Fase E', label: 'Fase E (SMA/SMK Kelas 10)' },
  { value: 'Fase F', label: 'Fase F (SMA/SMK Kelas 11 - 12)' },
];

export function DeepLearningRPMView() {
  // Jenjang, Kelas & Fase states
  const [jenjang, setJenjang] = useState<JenjangType>('SD');
  const [grade, setGrade] = useState('4');
  const [fase, setFase] = useState('Fase B');
  const [isCustomGrade, setIsCustomGrade] = useState(false);
  const [customGradeText, setCustomGradeText] = useState('');

  // Other Input fields state
  const [materi, setMateri] = useState('Variasi dan Kombinasi Pola Gerak Dasar Melempar, Menangkap, Menggiring, dan Menendang Bola dalam Permainan Invasi (Bola Tangan & Sepak Bola Mini)');
  const [penyusun, setPenyusun] = useState('Lendi Ike Hermawan, S.Pd., Gr.');
  const [sekolah, setSekolah] = useState('SD Negeri Kalimantong');
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027');
  const [semester, setSemester] = useState('1');
  const [mataPelajaran, setMataPelajaran] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)');
  const [bab, setBab] = useState('Unit 1: Aktivitas Pola Gerak Dasar Lokomotor, Nonlokomotor, dan Manipulatif Melalui Permainan Invasi');
  const [jumlahPertemuan, setJumlahPertemuan] = useState('2');
  const [alokasiWaktu, setAlokasiWaktu] = useState('6 × 35 Menit (2 Pertemuan)');
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

  // Validation
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

  const handleJumlahPertemuanChange = (val: string) => {
    setJumlahPertemuan(val);
    const count = parseInt(val) || 2;
    setAlokasiWaktu(`${count * 2} × 35 Menit (${count} Pertemuan)`);
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
    if (!materi.trim()) tempErrors.materi = 'Materi/Topik wajib diisi';
    if (!penyusun.trim()) tempErrors.penyusun = 'Nama Penyusun wajib diisi';
    if (!sekolah.trim()) tempErrors.sekolah = 'Nama Sekolah wajib diisi';
    if (!bab.trim()) tempErrors.bab = 'Bab wajib diisi';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!validateForm()) {
      setErrorMessage('Harap isi semua kolom input yang wajib bertanda bintang (*).');
      return;
    }

    const effectiveGrade = isCustomGrade ? customGradeText.trim() : grade;

    setLoading(true);
    try {
      const response = await fetch('/api/generate-rpm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: effectiveGrade,
          fase,
          materi,
          penyusun,
          sekolah,
          tahunAjaran,
          semester,
          mataPelajaran,
          bab,
          jumlahPertemuan,
          alokasiWaktu,
          konteksTambahan
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Terjadi kesalahan sistem saat menghubungi Gemini.');
      }

      const data = await response.json();
      setRpmResult(data);
      setSelectedLkpdIndex(0);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal menyusun RPM. Pastikan kunci API Gemini Anda valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboardAndOpenDocs = async () => {
    if (!rpmResult) return;
    const docHtml = exportRpmToDoc(rpmResult);
    const success = await copyAndOpenGoogleDocs(docHtml);
    if (success) {
      setCopiedStatus(true);
      setTimeout(() => setCopiedStatus(false), 3000);
    }
  };

  const handleDownloadDoc = () => {
    if (!rpmResult) return;
    const docHtml = exportRpmToDoc(rpmResult);
    const filename = `RPM_${rpmResult.identitas.mataPelajaran || 'Mapel'}_Kelas_${rpmResult.identitas.kelasFase || 'Fase'}_${(rpmResult.identitas.topik || 'Topik').replace(/\s+/g, '_')}`;
    downloadDocFile(filename, docHtml);
  };

  const handleDownloadPdf = async () => {
    if (!rpmResult || exportingPdf) return;
    setExportingPdf(true);
    try {
      const docHtml = exportRpmToDoc(rpmResult);
      const filename = `RPM_${rpmResult.identitas.mataPelajaran || 'Mapel'}_Kelas_${rpmResult.identitas.kelasFase || 'Fase'}_${(rpmResult.identitas.topik || 'Topik').replace(/\s+/g, '_')}`;
      const success = await downloadHtmlAsPdf(filename, docHtml, {
        title: `RPM & LKPD - ${rpmResult.identitas.mataPelajaran || 'Mata Pelajaran'}`,
        orientation: 'portrait'
      });
      
      if (!success) {
        printHtmlDocument(docHtml, `RPM & LKPD - ${rpmResult.identitas.mataPelajaran || 'Mata Pelajaran'}`);
      }
    } catch (err) {
      console.error('PDF export error:', err);
      const docHtml = exportRpmToDoc(rpmResult);
      printHtmlDocument(docHtml, `RPM & LKPD - ${rpmResult.identitas.mataPelajaran || 'Mata Pelajaran'}`);
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePrintDocument = () => {
    if (!rpmResult) return;
    const docHtml = exportRpmToDoc(rpmResult);
    printHtmlDocument(docHtml, `Cetak RPM & LKPD - ${rpmResult.identitas.mataPelajaran || 'Mata Pelajaran'}`);
  };

  const handleCopyFullText = async () => {
    if (!rpmResult) return;
    const docHtml = exportRpmToDoc(rpmResult);
    const success = await copyRichHtmlToClipboard(docHtml);
    if (success) {
      setCopiedTextStatus(true);
      setTimeout(() => setCopiedTextStatus(false), 3000);
    }
  };

  const currentLkpdCount = rpmResult?.lkpdList?.length || parseInt(jumlahPertemuan) || 2;

  return (
    <div className="space-y-6">
      {/* Header section (Hidden on print) */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
            Pembelajaran Mendalam (Deep Learning) - RPM & LKPD
          </h1>
          <p className="text-slate-500 mt-1 text-sm max-w-3xl">
            Rancang Rencana Pembelajaran Mendalam (RPM) bersintaks terstruktur dan Lembar Kerja Peserta Didik (LKPD) mandiri bermakna (mindful, meaningful, joyful) dengan penyesuaian Kelas, Fase Kurikulum Merdeka, dan Jumlah Pertemuan secara instan.
          </p>
        </div>
        <ExportJsonPromptAiButtons
          onExportJson={() => {
            const dataToExport = rpmResult || {
              materi: materi || 'Materi Belum Diisi',
              jenjang,
              kelas: grade,
              fase,
              jumlahPertemuan,
              penyusun,
              sekolah
            };
            const filename = `RPM_Deep_Learning_${(dataToExport.materi || 'PJOK').replace(/\s+/g, '_')}_Kelas_${grade}.json`;
            downloadJsonFile(filename, dataToExport);
          }}
          onOpenPromptAi={() => setShowPromptModal(true)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Form Column (Left - Hidden on print) */}
        <div className="lg:col-span-4 space-y-6 no-print">
          <form onSubmit={handleGenerate} className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 border-b pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Parameter Dokumen
            </h2>

            {/* Penyusun */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Penyusun (Nama Guru) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={penyusun}
                onChange={(e) => {
                  setPenyusun(e.target.value);
                  if (errors.penyusun) setErrors({ ...errors, penyusun: '' });
                }}
                className={`w-full text-sm border px-3 py-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  errors.penyusun ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200'
                }`}
                placeholder="Contoh: Soleh, S.Pd., M.Pd."
              />
              {errors.penyusun && <p className="text-rose-500 text-xs mt-1">{errors.penyusun}</p>}
            </div>

            {/* Sekolah */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Sekolah <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={sekolah}
                onChange={(e) => {
                  setSekolah(e.target.value);
                  if (errors.sekolah) setErrors({ ...errors, sekolah: '' });
                }}
                className={`w-full text-sm border px-3 py-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  errors.sekolah ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200'
                }`}
                placeholder="Contoh: SD Negeri Kalimantong"
              />
              {errors.sekolah && <p className="text-rose-500 text-xs mt-1">{errors.sekolah}</p>}
            </div>

            {/* PENGATURAN KELAS & FASE (KURIKULUM MERDEKA) */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Kelas & Fase Kurikulum Merdeka <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomGrade(!isCustomGrade)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                >
                  {isCustomGrade ? '← Mode Pilihan Cepat' : 'Kustom / Manual'}
                </button>
              </div>

              {!isCustomGrade ? (
                <>
                  {/* Tab Jenjang Pendidikan */}
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/60 rounded-lg">
                    {JENJANG_CONFIG.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectJenjang(item.id)}
                        className={`py-1.5 text-xs font-semibold rounded-md transition-all text-center ${
                          jenjang === item.id
                            ? 'bg-white text-indigo-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Tombol Cepat Kelas Sesuai Jenjang */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
                      <span>Pilih Kelas:</span>
                      <span className="text-[10px] text-indigo-600 font-semibold">
                        {JENJANG_CONFIG.find((j) => j.id === jenjang)?.badge}
                      </span>
                    </div>
                    <div className={`grid ${jenjang === 'SD' ? 'grid-cols-3' : jenjang === 'SMP' || jenjang === 'SMA' ? 'grid-cols-3' : 'grid-cols-1'} gap-1.5`}>
                      {KELAS_PRESETS[jenjang].map((preset) => {
                        const isSelected = grade === preset.grade;
                        return (
                          <button
                            key={preset.grade}
                            type="button"
                            onClick={() => handleSelectGrade(preset.grade, preset.fase, jenjang)}
                            className={`p-2 text-xs rounded-lg border transition-all text-left flex flex-col items-center justify-center gap-0.5 ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <span className="font-bold">{preset.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {preset.fase}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dropdown Kelas & Fase Terkoordinasi */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Pilih Kelas:
                      </label>
                      <select
                        value={grade}
                        onChange={(e) => handleSelectDropdownGrade(e.target.value)}
                        className="w-full text-xs border border-slate-200 bg-white px-2 py-1.5 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {ALL_KELAS_OPTIONS.map((k) => (
                          <option key={k.grade} value={k.grade}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Fase Capaian:
                      </label>
                      <select
                        value={fase}
                        onChange={(e) => setFase(e.target.value)}
                        className="w-full text-xs border border-slate-200 bg-white px-2 py-1.5 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {ALL_FASES.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                /* Mode Kustom / Manual */
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Ketik Kelas Kustom <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customGradeText}
                      onChange={(e) => {
                        setCustomGradeText(e.target.value);
                        if (errors.grade) setErrors({ ...errors, grade: '' });
                      }}
                      className="w-full text-xs border border-slate-200 px-3 py-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Contoh: Kelas 7 Unggulan atau Kelas 4"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Pilih Fase:
                    </label>
                    <select
                      value={fase}
                      onChange={(e) => setFase(e.target.value)}
                      className="w-full text-xs border border-slate-200 bg-white px-2.5 py-2 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {ALL_FASES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Status Banner Format Terpilih */}
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs">
                <span className="text-slate-600 text-[11px]">Format Identitas Dokumen:</span>
                <span className="font-bold text-indigo-900 text-[11px]">
                  {getEffectiveKelasFaseFormatted()}
                </span>
              </div>
              {errors.grade && <p className="text-rose-500 text-xs mt-1">{errors.grade}</p>}
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={mataPelajaran}
                onChange={(e) => setMataPelajaran(e.target.value)}
                className="w-full text-sm border border-slate-200 px-3 py-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="Contoh: Matematika / PJOK / IPA"
              />
            </div>

            {/* Bab & Topik */}
            <div className="grid grid-cols-1 gap-3">
              <SibiUnitSelectorBar
                grade={grade}
                selectedMateri={materi}
                onSelectUnit={(unit) => {
                  setBab(`${unit.unitCode}: ${unit.unitTitle}`);
                  setMateri(unit.pokokMateri);
                  setSemester(String(unit.semester));
                  setKonteksTambahan(
                    `Sesuai Buku Panduan Guru PJOK SIBI (${unit.sumberBukuSibi}). Pemanasan Permainan: ${unit.pemanasanPermainan}. Aktivitas Inti: ${unit.aktivitasPembelajaran.join(' | ')}.`
                  );
                  if (errors.bab || errors.materi) setErrors({ ...errors, bab: '', materi: '' });
                }}
              />

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Bab / Unit SIBI <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bab}
                  onChange={(e) => {
                    setBab(e.target.value);
                    if (errors.bab) setErrors({ ...errors, bab: '' });
                  }}
                  className={`w-full text-sm border px-3 py-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    errors.bab ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200'
                  }`}
                  placeholder="Contoh: Bab 1: Bilangan Bulat"
                />
                {errors.bab && <p className="text-rose-500 text-xs mt-1">{errors.bab}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Topik Utama <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={materi}
                  onChange={(e) => {
                    setMateri(e.target.value);
                    if (errors.materi) setErrors({ ...errors, materi: '' });
                  }}
                  className={`w-full text-sm border px-3 py-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    errors.materi ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200'
                  }`}
                  placeholder="Contoh: Operasi Bilangan Bulat"
                />
                {errors.materi && <p className="text-rose-500 text-xs mt-1">{errors.materi}</p>}
              </div>
            </div>

            {/* Fitur: Berapa Kali Pertemuan Mengajar */}
            <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Berapa Kali Pertemuan Mengajar?
                </label>
                <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                  {jumlahPertemuan} Pertemuan
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {['1', '2', '3', '4', '6', '8'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleJumlahPertemuanChange(num)}
                    className={`py-1 px-1 text-xs font-semibold rounded-md border transition-all text-center ${
                      jumlahPertemuan === num
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>

              {/* Dropdown for specific meeting count */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-indigo-900 font-medium whitespace-nowrap">Pilih Jumlah Lain:</span>
                <select
                  value={jumlahPertemuan}
                  onChange={(e) => handleJumlahPertemuanChange(e.target.value)}
                  className="w-full text-xs border border-indigo-200 bg-white px-2.5 py-1.5 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {Array.from({ length: 16 }, (_, i) => (i + 1).toString()).map((n) => (
                    <option key={n} value={n}>
                      {n} Kali Pertemuan (Menghasilkan {n} LKPD & Sintaks)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tahun Ajaran, Semester, Alokasi Waktu */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  value={tahunAjaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  className="w-full text-xs border border-slate-200 px-2 py-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="2026/2027"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full text-xs border border-slate-200 px-2 py-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="1">1 (Ganjil)</option>
                  <option value="2">2 (Genap)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center justify-between">
                  <span>Alokasi Waktu</span>
                </label>
                <input
                  type="text"
                  value={alokasiWaktu}
                  onChange={(e) => setAlokasiWaktu(e.target.value)}
                  className="w-full text-xs border border-slate-200 px-2 py-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="2 × 35 Menit"
                />
              </div>
            </div>

            {/* Konteks Tambahan */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Konteks Tambahan (Opsional)
              </label>
              <textarea
                value={konteksTambahan}
                onChange={(e) => setKonteksTambahan(e.target.value)}
                className="w-full text-xs border border-slate-200 px-3 py-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all h-20 resize-none"
                placeholder="Contoh: Fokuskan pada metode visual garis bilangan untuk siswa lambat belajar, atau integrasikan game kartu bilangan bulat..."
              />
            </div>

            {/* Error Message banner */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Action submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-medium text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98] transition-all disabled:opacity-75 disabled:hover:bg-slate-900 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  Menyusun {jumlahPertemuan} Pertemuan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Susun RPM & {jumlahPertemuan} LKPD
                </>
              )}
            </button>
          </form>

          {/* Quick tips about deep learning */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              Mengapa Pendekatan Deep Learning?
            </h3>
            <p className="text-xs text-indigo-700/90 leading-relaxed">
              Model pembelajaran ini membimbing siswa melampaui hafalan rutin dengan mengedepankan pengalaman belajar holistik:
            </p>
            <ul className="text-xs text-indigo-800 space-y-1.5 list-disc list-inside pl-1 font-medium">
              <li><strong>Mindful</strong> (Berkesadaran penuh dalam proses)</li>
              <li><strong>Meaningful</strong> (Menemukan makna nyata & korelasi)</li>
              <li><strong>Joyful</strong> (Menggembirakan & membangun gairah)</li>
            </ul>
          </div>
        </div>

        {/* Output Column (Right) */}
        <div className="lg:col-span-8 print-sheet">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-stage"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm space-y-4"
              >
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-200 animate-pulse flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-indigo-600 animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-800">
                    Menyusun Dokumen Deep Learning ({jumlahPertemuan} Pertemuan)...
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    AI sedang merancang Rencana Pembelajaran Mendalam (RPM) berkesadaran, bermakna, menggembirakan beserta {jumlahPertemuan} bundel LKPD mandiri untuk {getEffectiveKelasFaseFormatted()}.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 bg-indigo-50/70 border border-indigo-100 px-3 py-1.5 rounded-full text-xs text-indigo-700 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Mengintegrasikan 8 Dimensi Profil Lulusan & Sintaks Pembelajaran...
                </div>
              </motion.div>
            ) : rpmResult ? (
              <motion.div
                key="result-stage"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Actions & Export Toolbar (Hidden on print) */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Tampilan:</span>
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveTab('rpm')}
                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                          activeTab === 'rpm'
                            ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tabel RPM
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('lampiran')}
                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                          activeTab === 'lampiran'
                            ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Lampiran Lengkap
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('lkpd')}
                        className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                          activeTab === 'lkpd'
                            ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>Bundel LKPD</span>
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                          {currentLkpdCount}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('all')}
                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                          activeTab === 'all'
                            ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Semua Bagian
                      </button>
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <ExportJsonPromptAiButtons
                      variant="compact"
                      onExportJson={() => {
                        const filename = `RPM_${rpmResult.identitas.mataPelajaran || 'PJOK'}_Kelas_${rpmResult.identitas.kelasFase || grade}_${(rpmResult.identitas.topik || 'Topik').replace(/\s+/g, '_')}.json`;
                        downloadJsonFile(filename, rpmResult);
                      }}
                      onOpenPromptAi={() => setShowPromptModal(true)}
                    />

                    <button
                      type="button"
                      onClick={handleCopyToClipboardAndOpenDocs}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all shadow-2xs"
                    >
                      {copiedStatus ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5" />}
                      {copiedStatus ? 'Tersalin & Membuka Docs...' : 'Google Docs'}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadDoc}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all shadow-2xs"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Unduh Word (.doc)
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={exportingPdf}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all shadow-2xs disabled:opacity-50"
                    >
                      {exportingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                      {exportingPdf ? 'Mengekspor...' : 'Cetak PDF'}
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintDocument}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyFullText}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all shadow-2xs"
                    >
                      {copiedTextStatus ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedTextStatus ? 'Tersalin!' : 'Salin Semua'}
                    </button>
                  </div>
                </div>

                {/* Specific Meeting Selector Sub-tab if activeTab === 'lkpd' (Hidden on print) */}
                {activeTab === 'lkpd' && rpmResult.lkpdList && rpmResult.lkpdList.length > 1 && (
                  <div className="bg-white rounded-xl border border-indigo-100 p-3 shadow-xs flex items-center justify-between gap-3 no-print">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      Pilih Lembar LKPD Pertemuan:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rpmResult.lkpdList.map((_, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setSelectedLkpdIndex(pIdx)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                            selectedLkpdIndex === pIdx
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50'
                          }`}
                        >
                          LKPD Pertemuan {pIdx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Main Preview Section */}
                <div className="space-y-6">
                  {/* Title banner */}
                  <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-xs text-center space-y-1">
                    <h2 className="text-lg font-black text-slate-900 tracking-wide uppercase">
                      {rpmResult.title || 'PERENCANAAN PEMBELAJARAN MENDALAM'}
                    </h2>
                    <p className="text-xs font-semibold text-indigo-800">
                      {rpmResult.identitas.mataPelajaran || 'Mata Pelajaran'} &bull; {rpmResult.identitas.kelasFase || 'Kelas / Fase'} &bull; {rpmResult.identitas.alokasiWaktu || 'Alokasi Waktu'}
                    </p>
                  </div>

                  {/* Render based on selected activeTab */}
                  {(activeTab === 'rpm' || activeTab === 'all') && (
                    <RPMTableSection rpm={rpmResult} />
                  )}

                  {(activeTab === 'lampiran' || activeTab === 'all') && (
                    <RPMLampiranSection rpm={rpmResult} />
                  )}

                  {(activeTab === 'lkpd' || activeTab === 'all') && (
                    <RPMLkpdSection
                      rpm={rpmResult}
                      selectedIndex={activeTab === 'lkpd' ? selectedLkpdIndex : undefined}
                    />
                  )}
                </div>
              </motion.div>
            ) : (
              /* Empty state before generating */
              <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-indigo-500" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-slate-800">
                    Formulir Generator RPM & LKPD Siap Dikelola
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Silakan tentukan Jenjang, Kelas, Fase Kurikulum Merdeka, Bab, Topik, serta Jumlah Pertemuan Mengajar pada formulir di sebelah kiri, kemudian klik tombol <strong>"Susun RPM"</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-4 text-left">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-bold text-slate-800">1. Kelas & Fase Akurat</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Pemetaan otomatis Fase A s/d F & Fondasi sesuai Kurikulum Merdeka.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-bold text-slate-800">2. Fleksibel Pertemuan</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Menghasilkan sintaks & LKPD lengkap dari 1 hingga 16 pertemuan.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-bold text-slate-800">3. Siap Ekspor & Cetak</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Langsung unduh dalam format Word (.doc), Google Docs, PDF, atau cetak.</p>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Rencana Pembelajaran Mendalam (RPM)"
        subtitle={`${materi || 'Deep Learning PJOK'} - Kelas ${grade} (${fase})`}
        tabs={getDeepLearningPrompts({
          penyusun: penyusun || rpmResult?.identitas?.penyusun || 'Lendi Ike Hermawan, S.Pd., Gr.',
          sekolah: sekolah || rpmResult?.identitas?.sekolah || 'SD / SMP / SMA Negeri',
          tahunAjaran: tahunAjaran || rpmResult?.identitas?.tahunAjaran || '2026/2027',
          semester: semester || rpmResult?.identitas?.semester || '1',
          mataPelajaran: mataPelajaran || rpmResult?.identitas?.mataPelajaran || 'PJOK',
          kelasFase: getEffectiveGradeText() || rpmResult?.identitas?.kelasFase || `Kelas ${grade} / ${fase}`,
          topik: materi || rpmResult?.identitas?.topik || 'Aktivitas Kebugaran & Keterampilan Gerak',
          alokasiWaktu: alokasiWaktu || rpmResult?.identitas?.alokasiWaktu || '2x40 Menit'
        })}
        defaultActiveTab="rpm_lendi_hermawan"
        jsonData={rpmResult || {
          topik: materi,
          jenjang,
          kelas: grade,
          fase,
          jumlahPertemuan,
          alokasiWaktu,
          penyusun,
          sekolah
        }}
        jsonFilename={`RPM_Deep_Learning_${(materi || 'PJOK').replace(/\s+/g, '_')}_Kelas_${grade}.json`}
      />
    </div>
  );
}
