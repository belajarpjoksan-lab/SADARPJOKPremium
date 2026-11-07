import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Download, 
  Printer, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { KktpData } from '../types';
import { downloadDocFile, copyAndOpenGoogleDocs, exportKktpToDoc, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getKktpPrompts } from '../utils/aiPromptGenerators';

export default function KktpGeneratorView() {
  // Input states
  const [satuanPendidikan, setSatuanPendidikan] = useState('SD Negeri Kalimantong');
  const [mataPelajaran, setMataPelajaran] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan');
  const [kelas, setKelas] = useState('4');
  const [fase, setFase] = useState('B');
  const [semester, setSemester] = useState('Ganjil');
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  const [bab, setBab] = useState('Bab I');
  const [materiPokok, setMateriPokok] = useState('Aktivitas Pola Gerak Dasar Lokomotor');
  const [deskripsiCp, setDeskripsiCp] = useState('Peserta didik dapat menunjukkan kemampuan dalam mempraktikkan dan menganalisis variasi dan kombinasi aktivitas pola gerak dasar lokomotor (jalan, lari, lompat).');
  const [tujuanPembelajaranRaw, setTujuanPembelajaranRaw] = useState(
    "1. Peserta didik dapat mempraktikkan kombinasi gerak dasar jalan dan lari dengan koordinasi yang baik.\n" +
    "2. Peserta didik dapat menganalisis dan menjelaskan prosedur kombinasi gerakan lari dan lompat secara tepat.\n" +
    "3. Peserta didik dapat menunjukkan sikap disiplin, tanggung jawab, dan sportif selama aktivitas fisik berlangsung."
  );

  // Status states
  const [kktpResult, setKktpResult] = useState<KktpData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Auto-set Fase based on Kelas
  const handleKelasChange = (val: string) => {
    setKelas(val);
    if (val === '1' || val === '2') {
      setFase('A');
    } else if (val === '3' || val === '4') {
      setFase('B');
    } else if (val === '5' || val === '6') {
      setFase('C');
    }
  };

  const handleGenerateKktp = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    // Form validation
    if (!satuanPendidikan.trim()) {
      setValidationError('Satuan Pendidikan wajib diisi.');
      return;
    }
    if (!mataPelajaran.trim()) {
      setValidationError('Nama Mata Pelajaran wajib diisi.');
      return;
    }
    if (!kelas.trim()) {
      setValidationError('Kelas wajib diisi.');
      return;
    }
    if (!fase.trim()) {
      setValidationError('Fase wajib diisi.');
      return;
    }
    if (!semester.trim()) {
      setValidationError('Semester wajib diisi.');
      return;
    }
    if (!tahunPelajaran.trim()) {
      setValidationError('Tahun Pelajaran wajib diisi.');
      return;
    }
    if (!bab.trim()) {
      setValidationError('Bab wajib diisi.');
      return;
    }
    if (!materiPokok.trim()) {
      setValidationError('Materi Pokok wajib diisi.');
      return;
    }
    if (!deskripsiCp.trim()) {
      setValidationError('Deskripsi Capaian Pembelajaran wajib diisi.');
      return;
    }
    if (!tujuanPembelajaranRaw.trim()) {
      setValidationError('Tujuan Pembelajaran minimal harus diisi satu.');
      return;
    }

    const tps = tujuanPembelajaranRaw
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (tps.length === 0) {
      setValidationError('Tujuan Pembelajaran minimal harus memiliki satu baris kalimat.');
      return;
    }

    setIsGenerating(true);
    setKktpResult(null);

    try {
      const response = await fetch('/api/generate-kktp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          satuanPendidikan,
          mataPelajaran,
          kelas,
          fase,
          semester,
          tahunPelajaran,
          bab,
          materiPokok,
          deskripsiCp,
          tujuanPembelajaran: tps
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Terjadi kesalahan sistem AI saat memproses KKTP.');
      }

      const data = await response.json();
      setKktpResult(data);
    } catch (err: any) {
      setApiError(err.message || 'Gagal menyusun Kriteria Ketercapaian Tujuan Pembelajaran.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAndGoToDocs = async () => {
    if (!kktpResult) return;
    setCopySuccess(false);
    const docHtml = exportKktpToDoc(kktpResult);
    const success = await copyAndOpenGoogleDocs(docHtml);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const handleDownloadDoc = () => {
    if (!kktpResult) return;
    const docHtml = exportKktpToDoc(kktpResult);
    const filename = `KKTP_${kktpResult.identitas.mataPelajaran.replace(/\s+/g, '_')}_Kelas${kktpResult.identitas.kelas}`;
    downloadDocFile(filename, docHtml);
  };

  const handleDownloadPdf = async () => {
    if (!kktpResult || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docHtml = exportKktpToDoc(kktpResult);
      const filename = `KKTP_${kktpResult.identitas.mataPelajaran.replace(/\s+/g, '_')}_Kelas${kktpResult.identitas.kelas}`;
      const success = await downloadHtmlAsPdf(filename, docHtml, {
        title: `KKTP - ${kktpResult.identitas.mataPelajaran}`,
        orientation: 'landscape'
      });
      if (!success) {
        printHtmlDocument(docHtml, `KKTP - ${kktpResult.identitas.mataPelajaran}`);
      }
    } catch (err) {
      console.error(err);
      const docHtml = exportKktpToDoc(kktpResult);
      printHtmlDocument(docHtml, `KKTP - ${kktpResult.identitas.mataPelajaran}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!kktpResult) return;
    const docHtml = exportKktpToDoc(kktpResult);
    printHtmlDocument(docHtml, `KKTP - ${kktpResult.identitas.mataPelajaran}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Kiri: Form Input Parameter KKTP */}
      <div className="lg:col-span-4 space-y-4 no-print">
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-5 rounded-2xl shadow-lg border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Penyusun KKTP AI</h3>
              <p className="text-[10px] text-slate-300 font-medium">Buat Tabel Kriteria & Interval Nilai</p>
            </div>
          </div>

          <form onSubmit={handleGenerateKktp} className="space-y-4">
            
            {/* Validasi Error Lokal */}
            {validationError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-200 text-xs rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Identitas Section */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">1. Identitas Sekolah</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-300 block">Satuan Pendidikan</label>
                  <input 
                    type="text" 
                    value={satuanPendidikan}
                    onChange={(e) => setSatuanPendidikan(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    placeholder="SD Negeri..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-300 block">Mata Pelajaran</label>
                  <input 
                    type="text" 
                    value={mataPelajaran}
                    onChange={(e) => setMataPelajaran(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    placeholder="PJOK / Matematika..."
                  />
                </div>
              </div>

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
                  <label className="text-[10px] font-semibold text-slate-300 block">Fase (Otomatis)</label>
                  <input 
                    type="text" 
                    value={`Fase ${fase}`}
                    disabled
                    className="w-full bg-slate-800/40 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-400 cursor-not-allowed text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-300 block">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-300 block">Tahun Pelajaran</label>
                <input 
                  type="text" 
                  value={tahunPelajaran}
                  onChange={(e) => setTahunPelajaran(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 2026/2027"
                />
              </div>
            </div>

            {/* Bab & Capaian Section */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">2. Bab & Capaian Belajar</span>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] font-semibold text-slate-300 block">Nomor Bab</label>
                  <input 
                    type="text" 
                    value={bab}
                    onChange={(e) => setBab(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Bab I"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-semibold text-slate-300 block">Materi Pokok</label>
                  <input 
                    type="text" 
                    value={materiPokok}
                    onChange={(e) => setMateriPokok(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Aktivitas Senam..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-300 block">Deskripsi Capaian Pembelajaran (CP)</label>
                <textarea 
                  value={deskripsiCp}
                  onChange={(e) => setDeskripsiCp(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Tuliskan rumusan CP utuh..."
                />
              </div>
            </div>

            {/* Daftar Tujuan Pembelajaran */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">3. Tujuan Pembelajaran (TP)</span>
                <span className="text-[9px] text-slate-400 italic">Satu per baris</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-300 block">Daftar TP Yang Dimiliki</label>
                <textarea 
                  value={tujuanPembelajaranRaw}
                  onChange={(e) => setTujuanPembelajaranRaw(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  placeholder="Tuliskan tujuan pembelajaran, pisahkan dengan baris baru..."
                />
              </div>
            </div>

            {/* Action Submit */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyusun KKTP AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Susun KKTP Interval AI</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Informational Tip Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-slate-800">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <h4 className="font-semibold text-xs text-slate-900">Tentang KKTP Interval</h4>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) ini disusun menggunakan metode <b>Rubrik Interval Deskriptif</b>. Guru dapat menentukan kesiapan peserta didik berdasarkan 4 level interval:
          </p>
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-medium">
            <span className="px-2 py-1 rounded bg-red-50 text-red-700 border border-red-100 text-center">0–68: Perlu Bimbingan</span>
            <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-100 text-center">68–78: Cukup</span>
            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 text-center">79–89: Baik</span>
            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-center">90–100: Sangat Baik</span>
          </div>
        </div>
      </div>

      {/* Kanan: Hasil Pratinjau KKTP & Ekspor */}
      <div className="lg:col-span-8 flex flex-col h-full min-h-[600px]">
        {isGenerating ? (
          <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Menganalisis Tujuan Pembelajaran</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
              Gemini AI sedang merumuskan indikator deskriptif motorik & kognitif terperinci untuk 4 rentang interval nilai...
            </p>
            <div className="w-48 bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full w-2/3 rounded-full animate-infinite-scroll"></div>
            </div>
          </div>
        ) : apiError ? (
          <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Penyusunan KKTP Gagal</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
              {apiError}
            </p>
            <button
              onClick={handleGenerateKktp}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Coba Lagi
            </button>
          </div>
        ) : kktpResult ? (
          <div className="flex-1 flex flex-col space-y-4">
            
            {/* Toolbar Aksi Atas */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-800">Pratinjau Dokumen KKTP</span>
              </div>
              
              <div className="flex items-center flex-wrap gap-2">
                
                {/* Salin ke Clipboard & Buka Google Docs */}
                <button
                  onClick={handleCopyAndGoToDocs}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                  title="Salin tabel rapi dan buat dokumen Google baru otomatis"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Disalin! Membuka Google Docs...</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin & Buka Google Docs</span>
                      <ExternalLink className="w-3 h-3 text-indigo-200" />
                    </>
                  )}
                </button>

                <ExportJsonPromptAiButtons
                  variant="compact"
                  onExportJson={() => {
                    downloadJsonFile(`KKTP_PJOK_Kelas_${kelas}_${materiPokok.replace(/\s+/g, '_')}`, {
                      satuanPendidikan,
                      mataPelajaran,
                      kelas,
                      fase,
                      semester,
                      tahunPelajaran,
                      bab,
                      materiPokok,
                      deskripsiCp,
                      tujuanPembelajaranRaw,
                      hasilKktp: kktpResult,
                      tanggalEkspor: new Date().toISOString()
                    });
                  }}
                  onOpenPromptAi={() => setShowPromptModal(true)}
                />

                <button
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-75"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>{isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF'}</span>
                </button>

                <button
                  onClick={handleDownloadDoc}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unduh Word</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cetak</span>
                </button>
              </div>
            </div>

            {/* Lembar Cetak Dokumen Real */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6 overflow-x-auto print-sheet">
              
              {/* Identitas Dokumen Atas */}
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-800">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight uppercase">
                  Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
                </h2>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Kurikulum Merdeka {kktpResult.identitas.mataPelajaran}
                </h3>
              </div>

              {/* Grid Metadata Identitas */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                <div className="flex items-center justify-between sm:justify-start gap-4">
                  <span className="font-semibold text-slate-500 w-32 shrink-0">Nama Sekolah</span>
                  <span className="text-slate-800 font-bold">: {kktpResult.identitas.satuanPendidikan}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-4">
                  <span className="font-semibold text-slate-500 w-32 shrink-0">Mata Pelajaran</span>
                  <span className="text-slate-800 font-bold">: {kktpResult.identitas.mataPelajaran}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-4">
                  <span className="font-semibold text-slate-500 w-32 shrink-0">Kelas / Fase</span>
                  <span className="text-slate-800 font-bold">: Kelas {kktpResult.identitas.kelas} / Fase {kktpResult.identitas.fase}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-4">
                  <span className="font-semibold text-slate-500 w-32 shrink-0">Semester</span>
                  <span className="text-slate-800 font-bold">: {kktpResult.identitas.semester} (Ganjil)</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-4 col-span-1 sm:col-span-2">
                  <span className="font-semibold text-slate-500 w-32 shrink-0">Tahun Pelajaran</span>
                  <span className="text-slate-800 font-bold">: {kktpResult.identitas.tahunPelajaran}</span>
                </div>
              </div>

              {/* Tabel KKTP Utama */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold">
                      <th rowSpan={2} className="border border-slate-300 px-3 py-2.5 text-center w-8">No</th>
                      <th rowSpan={2} className="border border-slate-300 px-3 py-2.5 w-16 text-center">Bab</th>
                      <th rowSpan={2} className="border border-slate-300 px-3 py-2.5 w-24">Materi Pokok</th>
                      <th rowSpan={2} className="border border-slate-300 px-3 py-2.5 w-40">Deskripsi Capaian Pembelajaran (CP)</th>
                      <th rowSpan={2} className="border border-slate-300 px-3 py-2.5 w-40">Tujuan Pembelajaran (TP)</th>
                      <th colSpan={4} className="border border-slate-300 px-3 py-1.5 text-center bg-slate-900">Interval Nilai & Kriteria Deskriptif</th>
                    </tr>
                    <tr className="bg-slate-700 text-white font-semibold">
                      <th className="border border-slate-300 px-2 py-2 text-center bg-red-800 text-red-50 text-[10px] w-32">Perlu Bimbingan (0-68)</th>
                      <th className="border border-slate-300 px-2 py-2 text-center bg-amber-700 text-amber-50 text-[10px] w-32">Cukup (68-78)</th>
                      <th className="border border-slate-300 px-2 py-2 text-center bg-blue-800 text-blue-50 text-[10px] w-32">Baik (79-89)</th>
                      <th className="border border-slate-300 px-2 py-2 text-center bg-emerald-800 text-emerald-50 text-[10px] w-32">Sangat Baik (90-100)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kktpResult.kktpRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors align-top">
                        <td className="border border-slate-300 px-3 py-2 text-center font-mono font-bold text-slate-600">{row.no}</td>
                        <td className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-700">{kktpResult.bab}</td>
                        <td className="border border-slate-300 px-3 py-2 text-slate-800">{kktpResult.materiPokok}</td>
                        <td className="border border-slate-300 px-3 py-2 text-slate-500 leading-relaxed text-[11px]">{kktpResult.deskripsiCp}</td>
                        <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-900 leading-relaxed">{row.tujuanPembelajaran}</td>
                        <td className="border border-slate-300 px-2.5 py-2 bg-red-50/40 text-red-950 text-[11px] leading-relaxed italic">{row.intervalDeskripsi.perluBimbingan}</td>
                        <td className="border border-slate-300 px-2.5 py-2 bg-amber-50/40 text-amber-950 text-[11px] leading-relaxed">{row.intervalDeskripsi.cukup}</td>
                        <td className="border border-slate-300 px-2.5 py-2 bg-blue-50/40 text-blue-950 text-[11px] leading-relaxed">{row.intervalDeskripsi.baik}</td>
                        <td className="border border-slate-300 px-2.5 py-2 bg-emerald-50/40 text-emerald-950 text-[11px] leading-relaxed font-medium">{row.intervalDeskripsi.sangatBaik}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tanda Tangan */}
              <div className="grid grid-cols-2 text-center text-xs text-slate-800 pt-8 border-t border-slate-100">
                <div className="space-y-12">
                  <div>
                    <p>Mengetahui,</p>
                    <p className="font-bold">Kepala Sekolah</p>
                  </div>
                  <div>
                    <p className="font-bold underline">___________________________</p>
                    <p className="text-[10px] text-slate-500">NIP. _______________________</p>
                  </div>
                </div>
                <div className="space-y-12">
                  <div>
                    <p>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="font-bold">Guru Mata Pelajaran</p>
                  </div>
                  <div>
                    <p className="font-bold underline">___________________________</p>
                    <p className="text-[10px] text-slate-500">NIP. _______________________</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">KKTP Belum Disusun</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
              Silakan isi formulir identitas dan masukkan daftar Tujuan Pembelajaran (TP) di panel kiri, kemudian klik tombol <b>Susun KKTP Interval AI</b> untuk merumuskan deskripsi otomatis.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Cepat</span>
              <span>•</span>
              <span>Sesuai Kurikulum Merdeka</span>
              <span>•</span>
              <span>Ekspor Google Docs</span>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - KKTP PJOK SD"
        subtitle={`${materiPokok} • Kelas ${kelas} (Fase ${fase})`}
        tabs={getKktpPrompts({
          tp: tujuanPembelajaranRaw,
          materi: materiPokok,
          kelas: `Kelas ${kelas} (Fase ${fase})`
        })}
        jsonData={{
          satuanPendidikan,
          mataPelajaran,
          kelas,
          fase,
          semester,
          tahunPelajaran,
          bab,
          materiPokok,
          deskripsiCp,
          tujuanPembelajaranRaw,
          hasilKktp: kktpResult,
          tanggalEkspor: new Date().toISOString()
        }}
        jsonFilename={`KKTP_PJOK_Kelas_${kelas}_${materiPokok.replace(/\s+/g, '_')}`}
      />
    </div>
  );
}
