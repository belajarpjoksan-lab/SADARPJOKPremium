import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  AlertCircle,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Presentation,
  Sliders,
  Download,
  BookOpen,
  Layout,
  MessageSquare,
  Compass,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Play,
  X,
  Tag,
  GraduationCap,
  User,
  Calendar,
  Layers,
  Printer,
  FileText
} from 'lucide-react';
import { SlidePresentationData } from '../types';
import { downloadDocFile, copyAndOpenGoogleDocs, exportSlidesToDoc, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getSlideMateriPrompts } from '../utils/aiPromptGenerators';

export default function SlideGeneratorView() {
  // Input states
  const [mataPelajaran, setMataPelajaran] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan');
  const [kelas, setKelas] = useState('5');
  const [fase, setFase] = useState('C');
  const [topikMateri, setTopikMateri] = useState('Kombinasi Pola Gerak Dasar Lokomotor, Non-Lokomotor, dan Manipulatif');
  const [jumlahSlide, setJumlahSlide] = useState('8');
  const [gayaDesain, setGayaDesain] = useState('Sederhana & Minimalis (Slate & Off-White)');
  const [guruPenyusun, setGuruPenyusun] = useState('Ahmad Rafsanjani, S.Pd.');
  const [tanggalDokumen, setTanggalDokumen] = useState('');

  // Status states
  const [slidesResult, setSlidesResult] = useState<SlidePresentationData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyDeckSuccess, setCopyDeckSuccess] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copiedSlideNo, setCopiedSlideNo] = useState<number | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Active slide index for previewing in mockup
  const [activePreviewIdx, setActivePreviewIdx] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotesInFullscreen, setShowNotesInFullscreen] = useState(false);

  // Keyboard navigation for presentation mode
  useEffect(() => {
    if (!isFullscreen || !slidesResult) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space' || e.key === 'PageDown') {
        e.preventDefault();
        setActivePreviewIdx(prev => Math.min(prev + 1, slidesResult.slides.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setActivePreviewIdx(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, slidesResult]);

  // Auto-calculate Fase based on Kelas
  const handleKelasChange = (val: string) => {
    setKelas(val);
    if (val === '1' || val === '2') {
      setFase('A');
    } else if (val === '3' || val === '4') {
      setFase('B');
    } else if (val === '5' || val === '6') {
      setFase('C');
    } else if (val === '7' || val === '8' || val === '9') {
      setFase('D');
    } else if (val === '10') {
      setFase('E');
    } else if (val === '11' || val === '12') {
      setFase('F');
    }
  };

  const handleGenerateSlides = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    // Form validation
    if (!mataPelajaran.trim()) {
      setValidationError('Mata Pelajaran wajib diisi.');
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
    if (!topikMateri.trim()) {
      setValidationError('Topik / Materi Pembelajaran wajib diisi.');
      return;
    }
    if (!jumlahSlide.trim()) {
      setValidationError('Jumlah slide wajib diisi.');
      return;
    }

    setIsGenerating(true);
    setSlidesResult(null);

    const docDate = tanggalDokumen.trim() || `${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    try {
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mataPelajaran,
          kelas,
          fase,
          topikMateri,
          jumlahSlide,
          gayaDesain,
          guruPenyusun,
          tanggalDokumen: docDate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal merancang slide dari AI.');
      }

      const data = await response.json();
      setSlidesResult(data);
      setActivePreviewIdx(0); // reset preview to first slide
    } catch (err: any) {
      setApiError(err.message || 'Gagal memproses pembuatan rancangan slide.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAndGoToDocs = async () => {
    if (!slidesResult) return;
    setCopySuccess(false);
    const docHtml = exportSlidesToDoc(slidesResult);
    const success = await copyAndOpenGoogleDocs(docHtml);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const handleDownloadDoc = () => {
    if (!slidesResult) return;
    const docHtml = exportSlidesToDoc(slidesResult);
    downloadDocFile(`PPT_${topikMateri.replace(/\s+/g, '_')}_Kelas_${kelas}.doc`, docHtml);
  };

  const handleDownloadPdf = async () => {
    if (!slidesResult || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docHtml = exportSlidesToDoc(slidesResult);
      const filename = `Slide_PPT_${topikMateri.replace(/\s+/g, '_')}_Kelas_${kelas}`;
      const success = await downloadHtmlAsPdf(filename, docHtml, {
        title: `Slide PPT - ${topikMateri}`,
        orientation: 'landscape'
      });
      if (!success) {
        printHtmlDocument(docHtml, `Slide PPT - ${topikMateri}`);
      }
    } catch (err) {
      console.error(err);
      const docHtml = exportSlidesToDoc(slidesResult);
      printHtmlDocument(docHtml, `Slide PPT - ${topikMateri}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!slidesResult) return;
    const docHtml = exportSlidesToDoc(slidesResult);
    printHtmlDocument(docHtml, `Slide PPT - ${topikMateri}`);
  };

  const handleCopyDeckStructure = async () => {
    if (!slidesResult) return;
    
    let text = `===========================================================\n`;
    text += `RANCANGAN STRUKTUR SLIDE PRESENTASI PPT (POWERPOINT)\n`;
    text += `===========================================================\n`;
    text += `• Mata Pelajaran  : ${slidesResult.identitas.mataPelajaran}\n`;
    text += `• Kelas / Fase    : Kelas ${slidesResult.identitas.kelas} (Fase ${slidesResult.identitas.fase})\n`;
    text += `• Topik / Materi  : ${slidesResult.identitas.topikMateri}\n`;
    text += `• Jumlah Slide    : ${slidesResult.identitas.jumlahSlide} Slide\n`;
    text += `• Gaya Desain     : ${slidesResult.identitas.gayaDesain}\n`;
    text += `• Guru Penyusun   : ${slidesResult.identitas.guruPenyusun || 'Guru Kelas'}\n`;
    text += `• Tanggal Dokumen : ${slidesResult.identitas.tanggalDokumen}\n\n`;
    text += `-----------------------------------------------------------\n`;
    text += `RINCIAN STRUKTUR LENGKAP PER SLIDE (${slidesResult.slides.length} SLIDE)\n`;
    text += `-----------------------------------------------------------\n\n`;

    slidesResult.slides.forEach((slide) => {
      text += `[SLIDE ${slide.slideNo}] : ${slide.title}\n`;
      text += `• Tipe Layout    : ${slide.layoutType}\n`;
      text += `• Topik / Materi : ${slidesResult.identitas.topikMateri}\n`;
      text += `• Poin Isi Slide :\n`;
      slide.points.forEach((pt, idx) => {
        text += `  ${idx + 1}. ${pt}\n`;
      });
      text += `• Panduan Desain & Visual : ${slide.visualRecommendation}\n`;
      text += `• Panduan Narasi Guru (Speaker Notes) : "${slide.speakerNotes}"\n`;
      text += `\n-----------------------------------------------------------\n\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopyDeckSuccess(true);
      setTimeout(() => setCopyDeckSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to copy slide deck structure:', err);
    }
  };

  const handleCopySingleSlide = async (slide: SlidePresentationData['slides'][0]) => {
    if (!slidesResult) return;

    let text = `[SLIDE ${slide.slideNo}] : ${slide.title}\n`;
    text += `• Tipe Layout    : ${slide.layoutType}\n`;
    text += `• Topik / Materi : ${slidesResult.identitas.topikMateri}\n`;
    text += `• Teks Isi Slide :\n`;
    slide.points.forEach((pt, idx) => {
      text += `  ${idx + 1}. ${pt}\n`;
    });
    text += `• Panduan Visual : ${slide.visualRecommendation}\n`;
    text += `• Catatan Guru (Speaker Notes) : "${slide.speakerNotes}"\n`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedSlideNo(slide.slideNo);
      setTimeout(() => setCopiedSlideNo(null), 2500);
    } catch (err) {
      console.error('Failed to copy single slide:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="slide-presentation-generator">
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
          <Presentation className="w-8 h-8 text-indigo-200" />
          Rancangan Slide Presentasi PPT Pembelajaran
        </h2>
        <p className="mt-2 text-indigo-100 max-w-3xl text-sm sm:text-base leading-relaxed">
          Rancang slide presentasi PowerPoint interaktif untuk KBM Anda menggunakan AI. Dapatkan pembagian topik per slide secara merata, lengkap dengan tata letak visual, konten poin-poin terstruktur, serta catatan guru (speaker notes) yang siap diekspor ke Google Dokumen / Word.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Help */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              Formulir Slide PPT
            </h3>

            {validationError && (
              <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-500 rounded text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleGenerateSlides} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={mataPelajaran}
                  onChange={(e) => setMataPelajaran(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  placeholder="Contoh: PJOK, Matematika, IPAS"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={kelas}
                    onChange={(e) => handleKelasChange(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    required
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={`${i + 1}`}>Kelas {i + 1}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fase <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fase}
                    onChange={(e) => setFase(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed font-bold text-center"
                    readOnly
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Topik / Materi Pembelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={topikMateri}
                  onChange={(e) => setTopikMateri(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  placeholder="Contoh: Siklus Air atau Pencernaan Manusia"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Slide <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={jumlahSlide}
                    onChange={(e) => setJumlahSlide(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    required
                  >
                    <option value="5">5 Slide (Ringkas)</option>
                    <option value="8">8 Slide (Standar)</option>
                    <option value="10">10 Slide (Lengkap)</option>
                    <option value="12">12 Slide (Mendalam)</option>
                    <option value="15">15 Slide (Komprehensif)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gaya Desain Visual <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gayaDesain}
                    onChange={(e) => setGayaDesain(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    required
                  >
                    <option value="Sederhana & Minimalis (Slate & Off-White)">Sederhana & Minimalis</option>
                    <option value="Profesional & Formal (Navy & Emas)">Profesional & Formal (Navy)</option>
                    <option value="Kreatif & Berwarna (Teal, Pink, & Kuning)">Kreatif & Berwarna</option>
                    <option value="Interaktif & Menyenangkan (Hijau Daun & Oranye)">Interaktif & Ceria</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Guru Penyusun (Opsional)
                </label>
                <input
                  type="text"
                  value={guruPenyusun}
                  onChange={(e) => setGuruPenyusun(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  placeholder="Contoh: Nama Anda, S.Pd."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Dokumen (Opsional)
                </label>
                <input
                  type="text"
                  value={tanggalDokumen}
                  onChange={(e) => setTanggalDokumen(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  placeholder="Bila kosong menggunakan tanggal hari ini"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl py-3 px-4 text-xs font-bold shadow-md hover:from-indigo-700 hover:to-purple-800 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyusun Rancangan Slide...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    Rancang Slide PPT AI
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Guidance */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 leading-relaxed">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              Alur Rancangan PPT Interaktif
            </h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
              <li><strong>Slide 1:</strong> Judul & Subjudul menarik yang berpusat pada murid.</li>
              <li><strong>Slide 2:</strong> Apersepsi & Kompetensi Dasar / Tujuan Pembelajaran.</li>
              <li><strong>Slide Inti:</strong> Poin-poin penjelas dengan muatan pertanyaan interaktif pemancing nalar kritis siswa.</li>
              <li><strong>Slide Terakhir:</strong> Refleksi, kuis interaktif (Asesmen Formatif), serta pesan penutup pembelajaran.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Output Showcase & Preview */}
        <div className="lg:col-span-8 space-y-6">
          {apiError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-600" />
              <div>
                <h5 className="font-bold">Gagal Merancang Slide</h5>
                <p className="text-xs text-rose-700 mt-1">{apiError}</p>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="bg-white rounded-xl shadow-md p-12 border border-slate-100 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <h4 className="text-lg font-bold text-slate-800 font-sans tracking-tight">Kecerdasan Buatan Sedang Menyusun Slide...</h4>
              <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed font-mono">
                Gemini AI sedang menyusun materi ({topikMateri}) menjadi {jumlahSlide} bagian slide, mengintegrasikan topik pada setiap pembahasan, dan merancang speaker notes naratif untuk guru.
              </p>
            </div>
          )}

          {!slidesResult && !isGenerating && !apiError && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <Presentation className="w-16 h-16 text-slate-300 mb-4" />
              <h4 className="text-lg font-bold text-slate-700">Rancangan PPT Belum Dibuat</h4>
              <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
                Silakan isi data topik mata pelajaran, jumlah slide, dan gaya desain di panel kiri, kemudian tekan tombol <strong>"Rancang Slide PPT AI"</strong> untuk memulai penyusunan cerdas.
              </p>
            </div>
          )}

          {slidesResult && !isGenerating && (
            <div className="space-y-6">
              {/* Document Actions & Topic Summary Header */}
              <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 border border-slate-100 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                        <Check className="w-3.5 h-3.5" /> Slide PPT Siap
                      </span>
                      <span className="text-xs text-slate-400">|</span>
                      <span className="text-xs font-bold text-slate-500">
                        {slidesResult.slides.length} Slide
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-1.5 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-600 shrink-0" />
                      {slidesResult.identitas.topikMateri}
                    </h3>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 rounded-lg font-bold transition shadow-sm cursor-pointer"
                      title="Tayangkan slide dalam mode layar penuh (Full Screen Slideshow)"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Tayang Layar Penuh
                    </button>

                    <ExportJsonPromptAiButtons
                      variant="compact"
                      onExportJson={() => {
                        downloadJsonFile(`Slide_PPT_PJOK_Kelas_${kelas}_${topikMateri.replace(/\s+/g, '_')}`, {
                          mataPelajaran,
                          kelas,
                          fase,
                          topikMateri,
                          jumlahSlide,
                          gayaDesain,
                          guruPenyusun,
                          tanggalDokumen,
                          hasilSlide: slidesResult,
                          tanggalEkspor: new Date().toISOString()
                        });
                      }}
                      onOpenPromptAi={() => setShowPromptModal(true)}
                    />

                    <button
                      onClick={handleDownloadPdf}
                      disabled={isExportingPdf}
                      className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs px-3.5 py-2 rounded-lg font-bold transition shadow-sm cursor-pointer disabled:opacity-75"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF'}</span>
                    </button>

                    <button
                      onClick={handleCopyAndGoToDocs}
                      className="flex items-center gap-1.5 bg-slate-850 hover:bg-black text-white text-xs px-3.5 py-2 rounded-lg font-bold transition shadow-sm cursor-pointer"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Tersalin! Membuka Docs...
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Salin ke Docs
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadDoc}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-3.5 py-2 rounded-lg font-bold transition shadow-sm cursor-pointer border border-slate-200"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Unduh (.doc)
                    </button>

                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-3.5 py-2 rounded-lg font-bold transition shadow-sm cursor-pointer border border-slate-200"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      Cetak
                    </button>
                  </div>
                </div>

                {/* Metadata Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mata Pelajaran</span>
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">{slidesResult.identitas.mataPelajaran}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kelas / Fase</span>
                    <span className="text-xs font-bold text-slate-800">Kelas {slidesResult.identitas.kelas} (Fase {slidesResult.identitas.fase})</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Guru Penyusun</span>
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">{slidesResult.identitas.guruPenyusun || 'Guru Kelas'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gaya Desain</span>
                    <span className="text-xs font-bold text-indigo-700 line-clamp-1">{slidesResult.identitas.gayaDesain}</span>
                  </div>
                </div>
              </div>

              {/* Informational message about clipboard & google docs */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
                <ExternalLink className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <strong>Petunjuk Ekspor:</strong> Gunakan tombol <strong>"Salin ke Docs"</strong> untuk menempelkan ke Google Slides / Dokumen (tekan <strong>Ctrl+V</strong> di tab baru yang terbuka), atau unduh format <strong>.doc (Word Landscape)</strong> untuk mencetak format slide interaktif.
                </div>
              </div>

              {/* Slide Mockup Visualizer (16:9 Aspect Ratio) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Layout className="w-4 h-4 text-indigo-600" />
                    Pratinjau Visual Slide (16:9 Mockup)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      Layar Penuh
                    </button>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                      Slide {activePreviewIdx + 1} dari {slidesResult.slides.length}
                    </span>
                  </div>
                </div>

                {/* The 16:9 interactive mock card */}
                <div className="w-full aspect-[16/9] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative flex flex-col justify-between p-5 sm:p-8 md:p-10 text-white select-none">
                  {/* Decorative background grid & glow elements */}
                  <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] opacity-15"></div>
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                  {/* Slide header banner */}
                  <div className="flex items-center justify-between relative z-10 border-b border-slate-700/60 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] sm:text-xs font-black tracking-widest text-indigo-400 uppercase">
                        {slidesResult.identitas.mataPelajaran}
                      </span>
                      <span className="text-slate-600 hidden sm:inline">•</span>
                      <span className="text-[9px] sm:text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                        📌 Topik: {slidesResult.identitas.topikMateri}
                      </span>
                    </div>

                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 bg-slate-800/90 px-2.5 py-0.5 rounded-md border border-slate-700">
                      {slidesResult.slides[activePreviewIdx].layoutType} • Kelas {slidesResult.identitas.kelas}
                    </span>
                  </div>

                  {/* Slide Main Content */}
                  {activePreviewIdx === 0 ? (
                    /* Title / Cover Slide Specialized Presentation Layout */
                    <div className="my-auto relative z-10 space-y-3 sm:space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600/90 border border-indigo-400/40 text-white text-[10px] sm:text-xs font-extrabold rounded-full uppercase tracking-wider shadow-sm">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        SLIDE PEMBELAJARAN
                      </div>
                      
                      <h3 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                        {slidesResult.slides[0].title}
                      </h3>

                      {/* Prominent Topic Subtitle Banner */}
                      <div className="bg-gradient-to-r from-indigo-900/90 to-purple-900/90 border-l-4 border-amber-400 p-3 sm:p-4 rounded-r-xl max-w-2xl shadow-md">
                        <p className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider">
                          Materi Pembelajaran:
                        </p>
                        <p className="text-sm sm:text-lg md:text-xl font-black text-white mt-0.5">
                          {slidesResult.identitas.topikMateri}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] sm:text-xs text-slate-300 font-medium">
                        <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                          📖 {slidesResult.identitas.mataPelajaran}
                        </span>
                        <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                          🎓 Kelas {slidesResult.identitas.kelas} (Fase {slidesResult.identitas.fase})
                        </span>
                        <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                          👤 {slidesResult.identitas.guruPenyusun || 'Guru Kelas'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Content Slides (Slide 2+) */
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-auto relative z-10 items-center">
                      <div className="md:col-span-8 space-y-2.5 sm:space-y-3">
                        <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[11px] font-bold text-indigo-300 bg-indigo-950/70 border border-indigo-500/30 px-2 py-0.5 rounded">
                          <BookOpen className="w-3 h-3 text-indigo-400" />
                          Topik: {slidesResult.identitas.topikMateri}
                        </div>

                        <h3 className="text-base sm:text-xl md:text-2xl font-extrabold tracking-tight text-white leading-snug">
                          {slidesResult.slides[activePreviewIdx].title}
                        </h3>

                        <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm md:text-base text-slate-100 pl-4 list-disc font-medium leading-relaxed">
                          {slidesResult.slides[activePreviewIdx].points.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Right Mock Asset suggestion */}
                      <div className="hidden md:block md:col-span-4 bg-slate-850/80 border border-indigo-500/30 rounded-xl p-3.5 text-[10px] sm:text-xs text-indigo-100 leading-relaxed shadow-md">
                        <p className="font-bold text-amber-300 mb-1 flex items-center gap-1 text-[11px]">
                          <Compass className="w-3.5 h-3.5 text-amber-400" />
                          Arah Visual & Desain:
                        </p>
                        <p className="text-slate-200 italic font-mono text-[10px] leading-relaxed">
                          {slidesResult.slides[activePreviewIdx].visualRecommendation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Slide Footer */}
                  <div className="flex items-center justify-between relative z-10 border-t border-slate-700/50 pt-2.5">
                    <span className="text-[9px] sm:text-[10px] text-slate-300 font-medium truncate max-w-[70%]">
                      <strong>Topik:</strong> {slidesResult.identitas.topikMateri} | <strong>Penyusun:</strong> {slidesResult.identitas.guruPenyusun || 'Guru Kelas'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-indigo-300 font-extrabold tracking-widest uppercase shrink-0">
                      SLIDE {slidesResult.slides[activePreviewIdx].slideNo} / {slidesResult.slides.length}
                    </span>
                  </div>
                </div>

                {/* Slide pagination controls */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2">
                  <button
                    disabled={activePreviewIdx === 0}
                    onClick={() => setActivePreviewIdx(prev => prev - 1)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition cursor-pointer font-bold disabled:opacity-45 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Sebelumnya
                  </button>
                  
                  {/* Indicator chips */}
                  <div className="flex flex-wrap gap-1 justify-center max-w-[60%]">
                    {slidesResult.slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePreviewIdx(idx)}
                        className={`w-7 h-7 rounded-md text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                          idx === activePreviewIdx 
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                        title={`Slide ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={activePreviewIdx === slidesResult.slides.length - 1}
                    onClick={() => setActivePreviewIdx(prev => prev + 1)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition cursor-pointer font-bold disabled:opacity-45 flex items-center gap-1"
                  >
                    Berikutnya
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Speaker Notes Viewer for selected slide */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Panduan Narasi Guru (Speaker Notes) — Slide {activePreviewIdx + 1}: {slidesResult.slides[activePreviewIdx].title}
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Materi: {slidesResult.identitas.topikMateri}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed italic font-medium bg-white/90 p-3.5 rounded-lg border border-emerald-200 shadow-xs">
                  "{slidesResult.slides[activePreviewIdx].speakerNotes}"
                </p>
              </div>

              {/* Complete Deck Outline Details List */}
              <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-md font-bold flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                      Rincian Lengkap Struktur Slide Deck
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Topik Utama: <strong className="text-amber-300">{slidesResult.identitas.topikMateri}</strong>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-indigo-200 bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-700/60">
                      {slidesResult.slides.length} Total Slide
                    </span>

                    <button
                      onClick={handleCopyDeckStructure}
                      className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg font-bold transition shadow-sm cursor-pointer ${
                        copyDeckSuccess 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                      title="Salin seluruh teks dan struktur lengkap slide deck ke clipboard"
                    >
                      {copyDeckSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Struktur Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Rincian Struktur Slide Deck</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Feedback Alert Bar when copied */}
                {copyDeckSuccess && (
                  <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Rincian lengkap struktur {slidesResult.slides.length} slide deck berhasil disalin ke clipboard!</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 hidden sm:inline">
                      Siap ditempelkan (Ctrl+V) ke PowerPoint / Docs / WhatsApp
                    </span>
                  </div>
                )}

                <div className="p-6 space-y-6 divide-y divide-slate-100">
                  {slidesResult.slides.map((slide, sIdx) => (
                    <div key={slide.slideNo} className={`pt-6 ${sIdx === 0 ? 'pt-0' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-slate-800">
                            Slide {slide.slideNo}: {slide.title}
                          </h4>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Topik: {slidesResult.identitas.topikMateri}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                            {slide.layoutType}
                          </span>

                          <button
                            onClick={() => handleCopySingleSlide(slide)}
                            className={`text-[11px] px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer border ${
                              copiedSlideNo === slide.slideNo
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                            }`}
                            title={`Salin teks dan panduan Slide ${slide.slideNo}`}
                          >
                            {copiedSlideNo === slide.slideNo ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-500" />
                                <span>Salin Slide Ini</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teks Slide / Poin Utama</p>
                          <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1.5 leading-relaxed">
                            {slide.points.map((pt, pIdx) => (
                              <li key={pIdx}>{pt}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wider mb-1">Panduan Visual & Desain</p>
                            <p className="text-xs text-slate-600 italic bg-pink-50/60 p-2.5 rounded-lg border border-pink-100/60 leading-relaxed">
                              {slide.visualRecommendation}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Catatan Suara / Panduan Guru</p>
                            <p className="text-xs text-slate-700 leading-relaxed bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/60">
                              {slide.speakerNotes}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Interactive Presentation Mode Modal */}
      {isFullscreen && slidesResult && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between text-white p-4 sm:p-8 animate-in fade-in duration-200">
          {/* Top Bar Navigation in Fullscreen */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-extrabold text-indigo-400 uppercase tracking-wider">
                {slidesResult.identitas.mataPelajaran}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs sm:text-sm font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                📌 Topik: {slidesResult.identitas.topikMateri}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNotesInFullscreen(!showNotesInFullscreen)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  showNotesInFullscreen ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Catatan Guru
              </button>

              <button
                onClick={() => setIsFullscreen(false)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition cursor-pointer"
                title="Keluar Layar Penuh (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Center Slide Canvas (16:9 Max Box) */}
          <div className="my-auto max-w-5xl w-full mx-auto aspect-[16/9] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-2xl border border-slate-700 shadow-2xl p-6 sm:p-12 flex flex-col justify-between relative overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>

            {/* Slide Header */}
            <div className="flex items-center justify-between relative z-10 border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-amber-300 bg-amber-950/90 border border-amber-500/40 px-3 py-0.5 rounded-md">
                  Topik: {slidesResult.identitas.topikMateri}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-0.5 rounded-md">
                Slide {activePreviewIdx + 1} dari {slidesResult.slides.length}
              </span>
            </div>

            {/* Slide Body */}
            {activePreviewIdx === 0 ? (
              <div className="my-auto relative z-10 space-y-4">
                <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-extrabold rounded-full uppercase tracking-wider">
                  MATERI PEMBELAJARAN
                </span>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
                  {slidesResult.slides[0].title}
                </h2>
                <div className="bg-gradient-to-r from-indigo-900/90 to-purple-900/90 border-l-4 border-amber-400 p-4 rounded-r-xl">
                  <p className="text-xs text-amber-300 font-bold uppercase">Topik / Materi Pelajaran:</p>
                  <p className="text-lg sm:text-2xl font-black text-white mt-1">
                    {slidesResult.identitas.topikMateri}
                  </p>
                </div>
                <div className="flex gap-3 text-xs sm:text-sm text-slate-300">
                  <span>📖 {slidesResult.identitas.mataPelajaran}</span>
                  <span>•</span>
                  <span>🎓 Kelas {slidesResult.identitas.kelas} (Fase {slidesResult.identitas.fase})</span>
                  <span>•</span>
                  <span>👤 {slidesResult.identitas.guruPenyusun || 'Guru Kelas'}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-auto relative z-10 items-center">
                <div className="md:col-span-8 space-y-3 sm:space-y-4">
                  <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Topik: {slidesResult.identitas.topikMateri}
                  </div>
                  <h2 className="text-xl sm:text-3xl font-black text-white">
                    {slidesResult.slides[activePreviewIdx].title}
                  </h2>
                  <ul className="space-y-2.5 text-sm sm:text-lg text-slate-100 pl-5 list-disc font-medium leading-relaxed">
                    {slidesResult.slides[activePreviewIdx].points.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>

                <div className="hidden md:block md:col-span-4 bg-slate-850/90 border border-indigo-500/30 rounded-xl p-4 text-xs text-indigo-100">
                  <p className="font-bold text-amber-300 mb-1 flex items-center gap-1">
                    <Compass className="w-4 h-4 text-amber-400" />
                    Petunjuk Visual Guru:
                  </p>
                  <p className="text-slate-200 italic font-mono text-xs leading-relaxed">
                    {slidesResult.slides[activePreviewIdx].visualRecommendation}
                  </p>
                </div>
              </div>
            )}

            {/* Slide Footer */}
            <div className="flex items-center justify-between relative z-10 border-t border-slate-700/50 pt-3">
              <span className="text-xs text-slate-300">
                Topik: {slidesResult.identitas.topikMateri} | {slidesResult.identitas.guruPenyusun || 'Guru Kelas'}
              </span>
              <span className="text-xs font-extrabold text-indigo-300">
                SLIDE {slidesResult.slides[activePreviewIdx].slideNo} / {slidesResult.slides.length}
              </span>
            </div>
          </div>

          {/* Optional Speaker Notes Drawer in Fullscreen */}
          {showNotesInFullscreen && (
            <div className="max-w-5xl mx-auto w-full mt-3 bg-emerald-950/90 border border-emerald-600 rounded-xl p-4 text-emerald-100 text-xs sm:text-sm">
              <span className="font-bold text-emerald-300 block mb-1">🎤 Panduan Narasi Guru:</span>
              "{slidesResult.slides[activePreviewIdx].speakerNotes}"
            </div>
          )}

          {/* Fullscreen Bottom Navigation Controls */}
          <div className="flex items-center justify-between max-w-5xl mx-auto w-full pt-3">
            <button
              disabled={activePreviewIdx === 0}
              onClick={() => setActivePreviewIdx(prev => prev - 1)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>

            <div className="flex gap-1.5">
              {slidesResult.slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePreviewIdx(idx)}
                  className={`w-7 h-7 rounded-md text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                    idx === activePreviewIdx ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              disabled={activePreviewIdx === slidesResult.slides.length - 1}
              onClick={() => setActivePreviewIdx(prev => prev + 1)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
            >
              Berikutnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Slide Presentasi PPT PJOK"
        subtitle={`${topikMateri} • Kelas ${kelas} (Fase ${fase})`}
        tabs={getSlideMateriPrompts(topikMateri)}
        jsonData={{
          mataPelajaran,
          kelas,
          fase,
          topikMateri,
          jumlahSlide,
          gayaDesain,
          guruPenyusun,
          tanggalDokumen,
          hasilSlide: slidesResult,
          tanggalEkspor: new Date().toISOString()
        }}
        jsonFilename={`Slide_PPT_PJOK_Kelas_${kelas}_${topikMateri.replace(/\s+/g, '_')}`}
      />
    </div>
  );
}
