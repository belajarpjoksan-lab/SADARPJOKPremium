import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  AlertCircle,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  FileText,
  Sliders,
  Download,
  BookOpen,
  Layout,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
  Heart,
  Palette,
  CheckSquare,
  Printer,
  Zap,
  Shield,
  Flame,
  Target,
  Trophy,
  Dumbbell,
  Award,
  ChevronRight,
  Activity
} from 'lucide-react';
import { InteractiveLkpdData } from '../types';
import { downloadDocFile, copyAndOpenGoogleDocs, exportLkpdToDoc, downloadJsonFile } from '../lib/exportUtils';
import { downloadElementAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getLkpdPrompts } from '../utils/aiPromptGenerators';
import { 
  PJOK_SD_PRESETS, 
  DEFAULT_PJOK_KALIMANTONG_LKPD, 
  generateLkpdFromPreset, 
  PjokLkpdPreset 
} from '../data/pjokLkpdPresets';
import html2canvas from 'html2canvas-pro';

export default function LkpdGeneratorView() {
  // Input mode selection
  const [activeInputTab, setActiveInputTab] = useState<'v1' | 'v2' | 'infografis' | 'raw'>('v1');
  const [selectedInfoStyle, setSelectedInfoStyle] = useState<'info_v1' | 'info_v2' | 'info_v3' | 'info_v4'>('info_v1');

  // Shared states - Defaulted specifically to PJOK SD Negeri Kalimantong
  const [mataPelajaran, setMataPelajaran] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)');
  const [kelas, setKelas] = useState('4');
  const [topikMateri, setTopikMateri] = useState('Variasi & Kombinasi Pola Gerak Dasar Lokomotor dan Manipulatif (Sepak Bola Mini)');
  const [guruPenyusun, setGuruPenyusun] = useState('Ahmad Rafsanjani, S.Pd.');
  const [sekolah, setSekolah] = useState('SD Negeri Kalimantong');
  const [alokasiWaktu, setAlokasiWaktu] = useState('2 JP (2 x 35 Menit)');
  const [gayaDesain, setGayaDesain] = useState('Edukatif Profesional (Navy & Emerald)');
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Mode V1 Specific States
  const [fase, setFase] = useState('B');
  const [sintaks, setSintaks] = useState('Teaching Games for Understanding (TGfU) / Pendekatan Taktis Bermain');
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState('Peserta didik dapat menganalisis dan mempraktikkan variasi gerak dasar lokomotor (berlari, melompat) dan manipulatif (mengoper dan menghentikan bola) dengan koordinasi yang baik, disiplin, dan sportivitas di lapangan SD Negeri Kalimantong.');
  const [dimensiProfil, setDimensiProfil] = useState('Gotong Royong, Mandiri, dan Bernalar Kritis');

  // Mode V2 Specific States
  const [kegiatanInti, setKegiatanInti] = useState(
    '1. Pemanasan Game "Kucing Bola" di Lapangan SD Negeri Kalimantong (10 menit) untuk melatih reaksi gerak kaki.\n' +
    '2. Demonstrasi Guru: Posisi kaki tumpu sejajar bola, perkenaan kaki bagian dalam, dan cara meredam bola dengan telapak kaki.\n' +
    '3. Station 1 (Pos Akurasi): Latihan berpasangan passing mendatar 6 meter melewati celah 2 cone pembatas (10 kali pengulangan).\n' +
    '4. Station 2 (Pos Kontrol): Siswa bergantian melambungkan dan mengontrol bola jatuh dengan punggung kaki dan paha.\n' +
    '5. Mini Games Taktis (4 lawan 4): Bermain sepak bola mini tanpa kiper dengan aturan wajib 3 kali sentuhan sebelum menembak gawang.\n' +
    '6. Pendinginan & Refleksi: Pelemasan otot tungkai kaki, diskusi kesalahan gerak yang sering muncul, dan pengisian LKPD.'
  );

  // Mode Raw Specific States (backward compatibility)
  const [rawText, setRawText] = useState(`LEMBAR KERJA PESERTA DIDIK (LKPD) PJOK
Mata Pelajaran: Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)
Satuan Pendidikan: SD Negeri Kalimantong
Kelas / Fase: 4 SD / Fase B
Materi Pokok: Kombinasi Gerak Lokomotor & Manipulatif Sepak Bola Mini

Aktivitas 1: Analisis Gerak Dasar Passing Kaki Bagian Dalam
Saat melakukan operan bola mendatar, posisi kaki tumpu berada di samping bola sekitar 10-15 cm, lutut agak ditekuk, kaki tendang diayun dari belakang dengan pergelangan kaki diputar keluar.

Pertanyaan Analisis:
1. Mengapa mengoper dengan kaki bagian dalam menghasilkan arah bola yang lebih akurat daripada menggunakan ujung jari sepatu?
2. Bagaimana posisi badan dan kaki saat menerima operan bola agar bola tidak memantul jauh?
3. Apa tindakan sportivitasmu jika teman satu tim salah mengoper bola saat pertandingan?

Aktivitas 2: Tabel Observasi Praktik Berpasangan di Lapangan SD Negeri Kalimantong
Lakukan 10 kali operan berjarak 6 meter dan beri tanda centang pada lembar temanmu:
No | Nama Teman | Kaki Tumpu di Samping Bola | Perkenaan Kaki Bagian Dalam | Akurasi Bola Sampai ke Teman
1 | Ahmad Fauzi | Tepat | Tepat | Tepat
2 | Budi Santoso | Tepat | Belum Tepat | Tepat
3 | Candra Kirana | ... | ... | ...

Ayo Pasangkan Istilah dan Fungsinya:
- Menggiring (Dribbling) <--> Membawa bola melewati lawan ke ruang terbuka
- Mengoper (Passing) <--> Membagi bola secara akurat ke teman satu regu
- Mengontrol (Stopping) <--> Menghentikan dan menguasai laju bola

Refleksi Diri:
- Apakah saya sudah minum air putih yang cukup setelah berolahraga?
- Bagian tubuh mana yang paling bekerja keras dan butuh pelemasan?`);

  // Presets states
  const [selectedFaseFilter, setSelectedFaseFilter] = useState<'semua' | 'A' | 'B' | 'C'>('semua');
  const [activePresetId, setActivePresetId] = useState<string>('pjok-sepakbola-k4');
  const [presetToast, setPresetToast] = useState<string | null>(null);

  // Status states - initialize with pre-rendered PJOK SD Negeri Kalimantong worksheet
  const [lkpdResult, setLkpdResult] = useState<InteractiveLkpdData | null>(DEFAULT_PJOK_KALIMANTONG_LKPD);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Ref for the A4 sheet DOM element
  const lkpdContainerRef = useRef<HTMLDivElement>(null);

  // Helper to apply preset
  const handleApplyPreset = (preset: PjokLkpdPreset, immediatePreview: boolean = false) => {
    setActivePresetId(preset.id);
    setMataPelajaran(preset.mataPelajaran);
    setKelas(preset.kelas);
    setFase(preset.fase);
    setTopikMateri(preset.topikMateri);
    setSekolah(preset.sekolah);
    setGuruPenyusun(preset.guruPenyusun);
    setAlokasiWaktu(preset.alokasiWaktu);
    setGayaDesain(preset.gayaDesain);
    setSintaks(preset.sintaks);
    setTujuanPembelajaran(preset.tujuanPembelajaran);
    setDimensiProfil(preset.dimensiProfil);
    setKegiatanInti(preset.kegiatanInti);
    setRawText(preset.rawText);

    if (immediatePreview) {
      const generated = generateLkpdFromPreset(preset);
      setLkpdResult(generated);
      setPresetToast(`Materi "${preset.label}" langsung ditampilkan di kertas A4!`);
    } else {
      setPresetToast(`Data "${preset.label}" diterapkan ke formulir.`);
    }

    setTimeout(() => {
      setPresetToast(null);
    }, 4000);
  };

  const handleGenerateLkpd = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    // Basic shared validation
    if (!mataPelajaran.trim()) {
      setValidationError('Mata Pelajaran wajib diisi.');
      return;
    }
    if (!kelas.trim()) {
      setValidationError('Kelas wajib diisi.');
      return;
    }
    if (!topikMateri.trim()) {
      setValidationError('Topik / Materi Pembelajaran wajib diisi.');
      return;
    }
    if (!guruPenyusun.trim()) {
      setValidationError('Nama Guru Penyusun wajib diisi.');
      return;
    }

    // Tab-specific validation
    if (activeInputTab === 'v1') {
      if (!fase.trim()) {
        setValidationError('Fase pembelajaran (Kurikulum Merdeka) wajib diisi.');
        return;
      }
      if (!sintaks.trim()) {
        setValidationError('Sintaks Model & Metode Pembelajaran wajib diisi.');
        return;
      }
      if (!tujuanPembelajaran.trim()) {
        setValidationError('Tujuan Pembelajaran wajib diisi.');
        return;
      }
      if (!dimensiProfil.trim()) {
        setValidationError('Dimensi Profil Lulusan wajib diisi.');
        return;
      }
    } else if (activeInputTab === 'v2') {
      if (!kegiatanInti.trim()) {
        setValidationError('Rincian Kegiatan Inti RPP wajib diisi.');
        return;
      }
    } else if (activeInputTab === 'infografis') {
      if (!rawText.trim()) {
        setValidationError('Materi Rangkuman Ajar wajib diisi/ditempel.');
        return;
      }
    } else {
      if (!rawText.trim()) {
        setValidationError('Teks naskah LKPD asli wajib diisi/ditempel.');
        return;
      }
    }

    setIsGenerating(true);
    setLkpdResult(null);

    try {
      const requestBody = {
        mode: activeInputTab === 'infografis' ? selectedInfoStyle : activeInputTab,
        mataPelajaran,
        kelas,
        topikMateri,
        guruPenyusun,
        sekolah,
        alokasiWaktu,
        gayaDesain,
        fase: activeInputTab === 'v1' ? fase : undefined,
        sintaks: activeInputTab === 'v1' ? sintaks : undefined,
        tujuanPembelajaran: activeInputTab === 'v1' ? tujuanPembelajaran : undefined,
        dimensiProfil: activeInputTab === 'v1' ? dimensiProfil : undefined,
        kegiatanInti: activeInputTab === 'v2' ? kegiatanInti : undefined,
        rawText: (activeInputTab === 'raw' || activeInputTab === 'infografis') ? rawText : undefined
      };

      const response = await fetch('/api/generate-lkpd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal merancang LKPD dari AI.');
      }

      const data = await response.json();
      
      // Post-fill identitas to guarantee school and metadata are perfect
      if (data.identitas) {
        data.identitas.sekolah = sekolah.trim() || 'Sekolah Dasar';
        data.identitas.mataPelajaran = mataPelajaran;
        data.identitas.kelas = kelas;
        data.identitas.topikMateri = topikMateri;
        data.identitas.guruPenyusun = guruPenyusun;
        data.identitas.gayaDesain = gayaDesain;
        data.identitas.alokasiWaktu = alokasiWaktu;
      }
      setLkpdResult(data);
    } catch (err: any) {
      setApiError(err.message || 'Gagal memproses pembuatan rancangan LKPD.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAndGoToDocs = async () => {
    if (!lkpdResult) return;
    setCopySuccess(false);
    const docHtml = exportLkpdToDoc(lkpdResult);
    const success = await copyAndOpenGoogleDocs(docHtml);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const handleDownloadDoc = () => {
    if (!lkpdResult) return;
    const docHtml = exportLkpdToDoc(lkpdResult);
    downloadDocFile(`LKPD_${topikMateri.replace(/\s+/g, '_')}_Kelas_${kelas}.doc`, docHtml);
  };

  const handleDownloadPdf = async () => {
    if (!lkpdContainerRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const filename = `LKPD_${topikMateri.replace(/\s+/g, '_')}_Kelas_${kelas}`;
      const success = await downloadElementAsPdf(lkpdContainerRef.current, filename, {
        orientation: 'portrait',
        scale: 2,
        marginMm: 6
      });
      if (!success) {
        if (lkpdResult) {
          const docHtml = exportLkpdToDoc(lkpdResult);
          printHtmlDocument(docHtml, `LKPD - ${topikMateri}`);
        }
      }
    } catch (err) {
      console.error('PDF export error:', err);
      if (lkpdResult) {
        const docHtml = exportLkpdToDoc(lkpdResult);
        printHtmlDocument(docHtml, `LKPD - ${topikMateri}`);
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    if (lkpdContainerRef.current) {
      printHtmlDocument(lkpdContainerRef.current.innerHTML, `LKPD - ${topikMateri}`);
    } else if (lkpdResult) {
      const docHtml = exportLkpdToDoc(lkpdResult);
      printHtmlDocument(docHtml, `LKPD - ${topikMateri}`);
    }
  };

  const handleDownloadImage = async () => {
    if (!lkpdContainerRef.current) return;
    setIsCapturing(true);
    try {
      // Give a tiny timeout for DOM to settle
      await new Promise((resolve) => setTimeout(resolve, 400));
      const canvas = await html2canvas(lkpdContainerRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imageUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageUri;
      link.download = `LKPD_${topikMateri.replace(/\s+/g, '_')}_Kelas_${kelas}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Gagal mengambil tangkapan layar gambar:', err);
      alert('Terjadi kesalahan saat mengekspor gambar.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Visual Theme Helper for Mockup
  const getThemeStyles = () => {
    if (gayaDesain.includes('Ceria')) {
      return {
        cardBg: 'bg-amber-50/20',
        borderColor: 'border-orange-400',
        badgeBg: 'bg-orange-100 text-orange-800',
        sectionHeader: 'text-orange-700 border-orange-200',
        textColor: 'text-slate-800',
        subText: 'text-orange-600',
        accentColor: 'text-orange-500',
        inputBorder: 'border-amber-300 focus:ring-orange-500',
        cardBorder: 'border-amber-200',
        headerText: 'text-orange-800',
        tableHead: 'bg-amber-100/80 text-orange-900',
        bubbleBg: 'bg-amber-50/60 border-amber-200',
        highlightBg: 'bg-rose-50 border-rose-300 text-rose-900'
      };
    } else if (gayaDesain.includes('Pastel')) {
      return {
        cardBg: 'bg-teal-50/10',
        borderColor: 'border-teal-300',
        badgeBg: 'bg-teal-100 text-teal-800',
        sectionHeader: 'text-teal-700 border-teal-200',
        textColor: 'text-slate-700',
        subText: 'text-teal-600',
        accentColor: 'text-teal-500',
        inputBorder: 'border-teal-200 focus:ring-teal-500',
        cardBorder: 'border-teal-100',
        headerText: 'text-teal-800',
        tableHead: 'bg-teal-50/80 text-teal-900',
        bubbleBg: 'bg-purple-50/50 border-purple-100',
        highlightBg: 'bg-amber-50/80 border-amber-200 text-amber-900'
      };
    } else if (gayaDesain.includes('Edukatif')) {
      return {
        cardBg: 'bg-emerald-50/10',
        borderColor: 'border-emerald-500',
        badgeBg: 'bg-emerald-100 text-emerald-800',
        sectionHeader: 'text-emerald-800 border-emerald-200',
        textColor: 'text-slate-800',
        subText: 'text-emerald-700',
        accentColor: 'text-emerald-600',
        inputBorder: 'border-emerald-300 focus:ring-emerald-500',
        cardBorder: 'border-emerald-200',
        headerText: 'text-emerald-900',
        tableHead: 'bg-emerald-100/80 text-emerald-900',
        bubbleBg: 'bg-slate-50 border-slate-200',
        highlightBg: 'bg-blue-50 border-blue-200 text-blue-950'
      };
    } else {
      // Modern & Clean
      return {
        cardBg: 'bg-indigo-50/10',
        borderColor: 'border-indigo-600',
        badgeBg: 'bg-indigo-100 text-indigo-800',
        sectionHeader: 'text-indigo-800 border-slate-200',
        textColor: 'text-slate-800',
        subText: 'text-indigo-600',
        accentColor: 'text-indigo-600',
        inputBorder: 'border-slate-300 focus:ring-indigo-500',
        cardBorder: 'border-slate-200',
        headerText: 'text-indigo-900',
        tableHead: 'bg-slate-100 text-slate-800',
        bubbleBg: 'bg-indigo-50/30 border-indigo-100',
        highlightBg: 'bg-amber-50 border-amber-300 text-amber-900'
      };
    }
  };

  const theme = getThemeStyles();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="lkpd-interactive-generator">
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="bg-emerald-500/30 text-emerald-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1">
            🏫 SD Negeri Kalimantong
          </span>
          <span className="bg-amber-500/30 text-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1">
            ⚽ PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)
          </span>
          <span className="bg-teal-500/30 text-teal-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-teal-400/40">
            Kurikulum Merdeka (Fase A, B, & C)
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
          <FileText className="w-8 h-8 text-emerald-200" />
          Rancangan LKPD Gambar & Interaktif PJOK SD Negeri Kalimantong
        </h2>
        <p className="mt-2 text-emerald-100 max-w-3xl text-sm sm:text-base leading-relaxed">
          Rancang Lembar Kerja Peserta Didik (LKPD) PJOK bergambar dan interaktif berskala A4 Portrait khusus untuk pembelajaran di <strong>SD Negeri Kalimantong</strong>. Lengkap dengan analisis mekanika gerak, panduan keselamatan lapangan rumput, tabel observasi unjuk kerja teman sejawat, kuis mencocokkan taktis, dan refleksi gaya hidup sehat aktif.
        </p>
      </div>

      {/* Preset Feedback Toast Notification */}
      {presetToast && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{presetToast}</span>
          </div>
          <button 
            onClick={() => setPresetToast(null)} 
            className="text-emerald-700 hover:text-emerald-900 text-xs px-2 py-1 rounded bg-emerald-100/80 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Katalog Materi Khusus PJOK SD Negeri Kalimantong */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 sm:p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Katalog Materi Khusus Pembelajaran PJOK di SD Negeri Kalimantong
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pilih dari 9 paket materi PJOK berbasis Kurikulum Merdeka siap pakai atau sesuaikan dengan kebutuhan mengajar di lapangan sekolah.
            </p>
          </div>

          {/* Filter Fase Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSelectedFaseFilter('semua')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedFaseFilter === 'semua' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({PJOK_SD_PRESETS.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFaseFilter('A')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedFaseFilter === 'A' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fase A (Kls 1-2)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFaseFilter('B')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedFaseFilter === 'B' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fase B (Kls 3-4)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFaseFilter('C')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedFaseFilter === 'C' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fase C (Kls 5-6)
            </button>
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {PJOK_SD_PRESETS
            .filter(p => selectedFaseFilter === 'semua' || p.fase === selectedFaseFilter)
            .map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <div 
                  key={preset.id}
                  className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                    isSelected 
                      ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-400/40 shadow-sm' 
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        preset.fase === 'A' 
                          ? 'bg-teal-100 text-teal-800' 
                          : preset.fase === 'B' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        Fase {preset.fase} &bull; Kelas {preset.kelas} SD
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-medium">
                        {preset.alokasiWaktu}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug mb-1.5">
                      {preset.label}
                    </h4>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {preset.topikMateri}
                    </p>

                    <div className="text-[10px] text-slate-500 bg-white border border-slate-200 rounded-md p-2 mb-3">
                      <span className="font-bold text-slate-700">Model:</span> {preset.sintaks.split('/')[0]}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(preset, true)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg py-1.5 px-2 text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      title="Muat langsung ke preview lembar kertas A4 siap cetak"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      ⚡ Tampilkan di A4
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(preset, false)}
                      className="bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg py-1.5 px-2.5 text-[11px] font-semibold transition cursor-pointer"
                      title="Salin data ke kolom isian formulir"
                    >
                      Isi Form
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Help */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                Formulir Rancang LKPD Interaktif
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                SD Negeri Kalimantong
              </span>
            </div>

            {/* Quick Preset Selector Dropdown */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4">
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  Pilih Preset Materi PJOK SD Negeri Kalimantong:
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">{PJOK_SD_PRESETS.length} Pilihan</span>
              </label>
              <select
                value={activePresetId}
                onChange={(e) => {
                  const targetPreset = PJOK_SD_PRESETS.find(p => p.id === e.target.value);
                  if (targetPreset) {
                    handleApplyPreset(targetPreset, true);
                  }
                }}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
              >
                {PJOK_SD_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    [Kelas {p.kelas} - Fase {p.fase}] {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Tabs Selector */}
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg mb-4 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => { setActiveInputTab('v1'); setValidationError(null); }}
                className={`flex-1 min-w-[80px] py-1.5 px-2 rounded-md transition-all ${
                  activeInputTab === 'v1' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'hover:text-slate-800'
                }`}
              >
                Versi 1: Parameter
              </button>
              <button
                type="button"
                onClick={() => { setActiveInputTab('v2'); setValidationError(null); }}
                className={`flex-1 min-w-[80px] py-1.5 px-2 rounded-md transition-all ${
                  activeInputTab === 'v2' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'hover:text-slate-800'
                }`}
              >
                Versi 2: RPP
              </button>
              <button
                type="button"
                onClick={() => { setActiveInputTab('infografis'); setValidationError(null); }}
                className={`flex-1 min-w-[80px] py-1.5 px-2 rounded-md transition-all ${
                  activeInputTab === 'infografis' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'hover:text-slate-800'
                }`}
              >
                Infografis
              </button>
              <button
                type="button"
                onClick={() => { setActiveInputTab('raw'); setValidationError(null); }}
                className={`flex-1 min-w-[80px] py-1.5 px-2 rounded-md transition-all ${
                  activeInputTab === 'raw' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'hover:text-slate-800'
                }`}
              >
                Tata Letak Teks
              </button>
            </div>

            {validationError && (
              <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-500 rounded text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleGenerateLkpd} className="space-y-4">
              {/* SHARED FIELDS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mataPelajaran}
                    onChange={(e) => setMataPelajaran(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                    placeholder="Contoh: IPAS, Matematika"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas / Jenjang <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                    required
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={`${i + 1}`}>Kelas {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Sekolah / Instansi
                  </label>
                  <input
                    type="text"
                    value={sekolah}
                    onChange={(e) => setSekolah(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                    placeholder="Nama Sekolah Dasar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alokasi Waktu
                  </label>
                  <input
                    type="text"
                    value={alokasiWaktu}
                    onChange={(e) => setAlokasiWaktu(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                    placeholder="Contoh: 2 JP (2 x 35 Menit)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Topik / Materi Pokok <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={topikMateri}
                  onChange={(e) => setTopikMateri(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                  placeholder="Contoh: Bagian Tubuh Tumbuhan & Fungsinya"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Guru Penyusun <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guruPenyusun}
                    onChange={(e) => setGuruPenyusun(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                    placeholder="Nama Guru"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gaya Desain Visual <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gayaDesain}
                    onChange={(e) => setGayaDesain(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                    required
                  >
                    <option value="Modern & Clean (Indigo & Off-White)">Modern & Clean (Indigo)</option>
                    <option value="Ceria & Berwarna (Teal, Oranye, Kuning)">Ceria & Berwarna</option>
                    <option value="Estetik Pastel (Mint, Peach, Lavender)">Estetik Pastel</option>
                    <option value="Edukatif Profesional (Navy & Emerald)">Edukatif & Profesional</option>
                  </select>
                </div>
              </div>

              {/* TAB-SPECIFIC FIELDS */}
              {activeInputTab === 'v1' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 text-[11px] text-emerald-800">
                    💡 <strong>Versi 1: Desain Berbasis Sintaks</strong><br/>
                    AI akan otomatis menyusun lembar kerja yang lengkap sesuai sintaks model pembelajaran, tujuan, dan profil lulusan yang Anda input.
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Fase <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fase}
                        onChange={(e) => setFase(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                        placeholder="A, B, C, D, E, F"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Model / Sintaks Pembelajaran <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={sintaks}
                        onChange={(e) => setSintaks(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                        placeholder="Contoh: PBL, Project Based Learning, dsb."
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tujuan Pembelajaran (TP) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={tujuanPembelajaran}
                      onChange={(e) => setTujuanPembelajaran(e.target.value)}
                      rows={2}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                      placeholder="Masukkan tujuan pembelajaran..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dimensi Profil Pelajar Pancasila <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dimensiProfil}
                      onChange={(e) => setDimensiProfil(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                      placeholder="Contoh: Bernalar Kritis, Gotong Royong"
                      required
                    />
                  </div>
                </div>
              )}

              {activeInputTab === 'v2' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="bg-teal-50/50 p-2.5 rounded-lg border border-teal-100 text-[11px] text-teal-800">
                    💡 <strong>Versi 2: Desain Berbasis Kegiatan Inti RPP</strong><br/>
                    Tempelkan rencana kegiatan inti pembelajaran dari RPP Anda. AI akan merancang aktivitas lembar kerja terstruktur yang berkesinambungan.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rincian Kegiatan Inti RPP <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={kegiatanInti}
                      onChange={(e) => setKegiatanInti(e.target.value)}
                      rows={6}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white font-mono leading-relaxed"
                      placeholder="Tempelkan langkah kegiatan inti guru/siswa dari RPP Anda di sini..."
                      required
                    />
                  </div>
                </div>
              )}

              {activeInputTab === 'infografis' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 text-[11px] text-emerald-800">
                    💡 <strong>Konversi Rangkuman Materi menjadi Infografis</strong><br/>
                    Tempelkan materi/rangkuman pelajaran Anda. AI akan merancang layout poster visual berukuran A4 Portrait dengan ilustrasi panel, mind map, diagram, dan ringkasan materi tanpa mengurangi bobot materi.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pilih Gaya Desain Infografis <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedInfoStyle}
                      onChange={(e) => setSelectedInfoStyle(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                      required
                    >
                      <option value="info_v1">Versi 1: 3D Cartoon Animation (Pixar Style)</option>
                      <option value="info_v2">Versi 2: Cute 2D Cartoon Style (Poster Edukatif)</option>
                      <option value="info_v3">Versi 3: Modern Clean Gen Z (100% Verbatim & Mindmap)</option>
                      <option value="info_v4">Versi 4: 3D Clay Art Style (Plastisin Handmade)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Tempel Materi Rangkuman Ajar <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <textarea
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      rows={8}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white font-mono leading-relaxed"
                      placeholder="Masukkan draf rangkuman materi pelajaran di sini..."
                      required
                    />
                  </div>
                </div>
              )}

              {activeInputTab === 'raw' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 text-[11px] text-indigo-800">
                    💡 <strong>Tata Letak Ulang Teks LKPD Asli</strong><br/>
                    Tempelkan draf dokumen LKPD Anda. AI akan menyusun ulang penataannya menjadi interaktif dengan visual pendukung tanpa mengubah materi teks aslinya.
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Tempel Teks LKPD Asli <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <textarea
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      rows={8}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white font-mono leading-relaxed"
                      placeholder="Tempel draf dokumen LKPD mentah di sini..."
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl py-3 px-4 text-xs font-bold shadow-md hover:from-emerald-700 hover:to-teal-800 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mendesain LKPD Interaktif...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    Mulai Rancang LKPD AI
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Guidance */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 leading-relaxed">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              Panduan Guru & Desainer Pembelajaran
            </h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
              <li><strong>Ukuran Standar A4 Portrait:</strong> Desain diatur menyerupai layout A4 fisik dengan margin yang lega dan estetik.</li>
              <li><strong>Desain Ramah Siswa:</strong> Setiap pertanyaan dibungkus kotak respons kreatif (dotted, lines, speech bubble) agar siswa bergairah menulis jawaban mereka.</li>
              <li><strong>100% Verbatim:</strong> AI dilarang keras mengubah instruksi, pertanyaan, maupun teks pembelajaran asli Anda.</li>
              <li><strong>Dukungan Ekspor Multi-Format:</strong> Hasil akhir bisa diunduh langsung sebagai file gambar (PNG) berkualitas tinggi, file dokumen Word (.doc), atau disalin langsung ke Google Dokumen Anda dalam 1-klik!</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Output Showcase & A4 Portrait Canvas */}
        <div className="lg:col-span-7 space-y-6">
          {apiError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-600" />
              <div>
                <h5 className="font-bold">Gagal Merancang LKPD</h5>
                <p className="text-xs text-rose-700 mt-1">{apiError}</p>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="bg-white rounded-xl shadow-md p-12 border border-slate-100 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
              <h4 className="text-lg font-bold text-slate-800 font-sans tracking-tight">Menyusun Tata Letak Interaktif...</h4>
              <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed font-mono">
                Gemini AI sedang mengurai materi Anda, memisahkan teks pengamatan, membuat struktur tabel, memisahkan pasangan mencocokkan, menyematkan visual-metadata pembantu, serta merangkai template A4 Portrait bergaya "{gayaDesain}".
              </p>
            </div>
          )}

          {!lkpdResult && !isGenerating && !apiError && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <FileText className="w-16 h-16 text-slate-300 mb-4" />
              <h4 className="text-lg font-bold text-slate-700">Canvas LKPD Masih Kosong</h4>
              <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
                Silakan isi data formulir dan tempel teks LKPD asli Anda di panel kiri, kemudian tekan tombol <strong>"Mulai Rancang LKPD AI"</strong> untuk menampilkan karya seni lembar kerja Anda di sini.
              </p>
            </div>
          )}

          {lkpdResult && !isGenerating && (
            <div className="space-y-6">
              {/* Document Actions */}
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-md font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    LKPD Interaktif Berhasil Didesain!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Format visual A4 siap diunduh sebagai gambar PNG utuh atau diekspor ke Word/Docs.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2.5 items-center">
                  <ExportJsonPromptAiButtons
                    variant="compact"
                    onExportJson={() => {
                      downloadJsonFile(`LKPD_${topikMateri.replace(/\s+/g, '_')}_Kelas_${kelas}`, {
                        activeInputTab,
                        selectedInfoStyle,
                        mataPelajaran,
                        kelas,
                        topikMateri,
                        guruPenyusun,
                        sekolah,
                        alokasiWaktu,
                        gayaDesain,
                        fase,
                        sintaks,
                        tujuanPembelajaran,
                        hasilLkpd: lkpdResult,
                        tanggalEkspor: new Date().toISOString()
                      });
                    }}
                    onOpenPromptAi={() => setShowPromptModal(true)}
                  />

                  <button
                    onClick={handleDownloadPdf}
                    disabled={isExportingPdf}
                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs px-3.5 py-2 rounded-lg font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isExportingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memproses PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Unduh PDF
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadImage}
                    disabled={isCapturing}
                    className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs px-3.5 py-2 rounded-lg font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isCapturing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mengonversi...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        Unduh Gambar (PNG)
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopyAndGoToDocs}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-xs px-3.5 py-2 rounded-lg font-bold transition shadow-sm cursor-pointer"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Tersalin! Membuka Docs...
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Salin & Buka Google Docs
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadDoc}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 rounded-lg font-bold transition shadow-sm cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    Unduh Word (.doc)
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3.5 py-2 rounded-lg font-bold transition shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    Cetak
                  </button>
                </div>
              </div>

              {/* Informational message about clipboard & google docs */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed flex flex-col gap-2">
                <div className="flex gap-2">
                  <ExternalLink className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <strong>Tips Ekspor Google Docs:</strong> Tombol <strong>"Salin & Buka Google Docs"</strong> akan menyalin isi dokumen dalam format teks-berwarna dan tabel rapi beresolusi tinggi langsung ke clipboard Anda dan membuka Google Dokumen baru secara otomatis. Anda hanya perlu menekan tombol <strong>Ctrl+V / Cmd+V</strong> di tab baru tersebut untuk menempelkan hasil rancangan secara sempurna tanpa merusak tata letak asli!
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-amber-200">
                  <Layout className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <strong>Tips Desain Visual:</strong> Tombol <strong>"Unduh Gambar (PNG)"</strong> akan mengambil tangkapan layar (screenshot) beresolusi tinggi langsung dari canvas A4 di bawah ini agar Anda bisa langsung mencetaknya dalam format grafis yang menawan dan ramah Gen-Z!
                  </div>
                </div>
              </div>

              {/* Styled A4 Portrait Canvas Mockup */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                    <Layout className="w-4 h-4 text-emerald-600" />
                    Kertas A4 Portrait Mockup (Mencerminkan Cetakan Hasil Gambar)
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-bold">
                    A4 Portrait (21 cm x 29.7 cm)
                  </span>
                </div>

                {/* The A4 Canvas Element */}
                <div 
                  ref={lkpdContainerRef}
                  className={`w-full bg-white border border-slate-300 shadow-2xl p-6 sm:p-10 text-slate-800 relative flex flex-col justify-between overflow-hidden select-text ${theme.cardBg}`}
                  style={{ minHeight: '842px', fontFamily: '"Inter", sans-serif' }}
                >
                  {/* Outer double border decorations */}
                  <div className={`absolute inset-2 border-2 border-double pointer-events-none rounded-lg ${theme.borderColor} opacity-30`}></div>

                  {/* Header Logo & Title area */}
                  <div className="relative z-10 pb-5 mb-5 border-b-2 border-dashed border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-md ${theme.badgeBg}`}>
                            LEMBAR KERJA PESERTA DIDIK (LKPD)
                          </span>
                        </div>
                        <h1 className={`text-xl sm:text-2xl font-black tracking-tight mt-1.5 leading-tight ${theme.headerText}`}>
                          {lkpdResult.judulMenarik}
                        </h1>
                      </div>
                      
                      {/* Decorative elements representing custom printable format */}
                      <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100/80 border border-slate-200 text-center shrink-0">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">GAYA DESAIN</span>
                        <span className="text-[10px] font-extrabold text-slate-700">{lkpdResult.identitas.gayaDesain.split(' ')[0]}</span>
                      </div>
                    </div>

                    {/* Metadata Identity Box */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Mata Pelajaran</p>
                        <p className="font-semibold text-slate-700">{lkpdResult.identitas.mataPelajaran}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kelas / Jenjang</p>
                        <p className="font-semibold text-slate-700">Kelas {lkpdResult.identitas.kelas}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Sekolah</p>
                        <p className="font-semibold text-slate-700">{lkpdResult.identitas.sekolah || 'Sekolah Dasar'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Penyusun</p>
                        <p className="font-semibold text-slate-700 truncate">{lkpdResult.identitas.guruPenyusun}</p>
                      </div>
                    </div>

                    {/* Student Name and score area inside mockup */}
                    <div className="grid grid-cols-3 gap-3 mt-4 text-xs font-mono">
                      <div className="col-span-2 border border-slate-300 rounded-md bg-white p-2.5 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Nama Lengkap Siswa:</span>
                        <div className="border-b border-dashed border-slate-300 mt-2 text-slate-300">Tulis di sini...</div>
                      </div>
                      <div className="border-2 border-dashed border-indigo-200 rounded-md bg-slate-50 p-1 text-center flex flex-col justify-center items-center">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">NILAI AKHIR</span>
                        <span className="text-base font-black text-indigo-600">...... / 100</span>
                      </div>
                    </div>
                  </div>

                  {/* LKPD Body Content Blocks */}
                  <div className="relative z-10 flex-grow space-y-6">
                    {lkpdResult.sections.map((section, sIdx) => (
                      <div key={sIdx} className="space-y-3">
                        {/* Section Header with nice typography */}
                        <h3 className={`text-sm sm:text-md font-bold tracking-tight pb-1.5 border-b-2 flex items-center gap-2 uppercase ${theme.sectionHeader}`}>
                          <span className="text-lg">{section.icon || '📌'}</span>
                          {section.sectionTitle}
                        </h3>

                        {section.introText && (
                          <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium italic">
                            {section.introText}
                          </p>
                        )}

                        {/* Rendering blocks */}
                        <div className="space-y-4">
                          {section.contentBlocks.map((block, bIdx) => {
                            if (block.blockType === 'text' && block.exactText) {
                              return (
                                <p key={bIdx} className="text-xs text-slate-600 leading-relaxed font-sans">
                                  {block.exactText}
                                </p>
                              );
                            }

                            if (block.blockType === 'highlight' && block.exactText) {
                              return (
                                <div key={bIdx} className={`p-3 rounded-lg border-l-4 text-xs ${theme.highlightBg}`}>
                                  <div className="flex items-center gap-1 mb-1 font-bold">
                                    <span>💡</span>
                                    <span>INFO PENTING / PENJELASAN UTAMA:</span>
                                  </div>
                                  <p className="leading-relaxed italic font-medium">{block.exactText}</p>
                                </div>
                              );
                            }

                            if (block.blockType === 'question' && block.questionData) {
                              const q = block.questionData;
                              let inputArea = '';
                              let boxClass = 'border border-slate-300 bg-white rounded-lg p-3 min-height-12 text-slate-300 text-[10px] italic';
                              
                              if (q.answerBoxStyle === 'dotted_box') {
                                boxClass = 'border-2 border-dashed border-indigo-300 bg-slate-50 rounded-lg p-3 text-slate-400 text-[10px] italic';
                              } else if (q.answerBoxStyle === 'speech_bubble') {
                                boxClass = 'border border-teal-200 bg-teal-50/20 rounded-2xl p-3 border-l-4 border-l-teal-500 text-slate-400 text-[10px] italic relative';
                              } else if (q.answerBoxStyle === 'ruled_lines') {
                                boxClass = 'border-b border-slate-300 py-1 text-slate-300 text-[10px] italic min-h-12';
                              }

                              return (
                                <div key={bIdx} className="space-y-1.5">
                                  <div className="flex items-start justify-between gap-3">
                                    <h4 className="text-xs font-bold text-slate-800 flex items-start gap-1">
                                      <span className="text-emerald-600 shrink-0">✏️</span>
                                      <span>{q.questionText}</span>
                                    </h4>
                                    {q.score && (
                                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${theme.badgeBg} shrink-0`}>
                                        Skor: {q.score}
                                      </span>
                                    )}
                                  </div>

                                  {q.answerBoxStyle === 'ruled_lines' ? (
                                    <div className="space-y-4 pt-1 font-sans">
                                      <div className="border-b border-dashed border-slate-300 h-6"></div>
                                      <div className="border-b border-dashed border-slate-300 h-6"></div>
                                    </div>
                                  ) : (
                                    <div className={`${boxClass} flex items-center justify-start`}>
                                      <span>{q.placeholderText || 'Tuliskan jawaban rapi anak-anak di sini...'}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            if (block.blockType === 'table' && block.tableData) {
                              const tbl = block.tableData;
                              return (
                                <div key={bIdx} className="overflow-x-auto my-3 border border-slate-200 rounded-lg shadow-sm">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className={theme.tableHead}>
                                        {tbl.headers.map((h, hIdx) => (
                                          <th key={hIdx} className="p-2 border border-slate-200 font-bold text-[11px]">{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {tbl.rows.map((row, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-slate-50 bg-white">
                                          {row.map((cell, cIdx) => (
                                            <td key={cIdx} className="p-2 border border-slate-200 text-slate-600">{cell}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            }

                            if (block.blockType === 'matching' && block.matchingData) {
                              const mat = block.matchingData;
                              return (
                                <div key={bIdx} className="border border-dashed border-slate-300 bg-slate-50/50 rounded-xl p-3 my-4">
                                  <h4 className="text-xs font-extrabold text-indigo-700 flex items-center gap-1 mb-2.5">
                                    <span>🔗</span>
                                    <span>Hubungkan Pasangan yang Sesuai:</span>
                                  </h4>
                                  
                                  <div className="grid grid-cols-12 gap-2 text-xs">
                                    <div className="col-span-5 font-bold text-slate-500 pb-1 border-b border-slate-200">{mat.leftLabel || 'Kolom A'}</div>
                                    <div className="col-span-2"></div>
                                    <div className="col-span-5 font-bold text-slate-500 pb-1 border-b border-slate-200">{mat.rightLabel || 'Kolom B'}</div>
                                    
                                    {mat.pairs.map((pair, pIdx) => (
                                      <React.Fragment key={pIdx}>
                                        {/* Left block */}
                                        <div className="col-span-5 bg-white border border-slate-200 p-2 rounded-lg font-semibold text-slate-700 flex items-center shadow-sm">
                                          <span className="text-[10px] text-indigo-400 font-mono mr-1.5">{pIdx + 1}.</span>
                                          {pair.leftItem}
                                        </div>
                                        {/* Connector mockup lines */}
                                        <div className="col-span-2 flex items-center justify-center text-slate-300 select-none">
                                          <span className="font-mono text-center text-indigo-300/80 animate-pulse">&bull;&mdash;&mdash;&gt;&bull;</span>
                                        </div>
                                        {/* Right block */}
                                        <div className="col-span-5 bg-white border border-slate-200 p-2 rounded-lg text-slate-600 flex items-center shadow-sm italic font-medium">
                                          {pair.rightItem}
                                        </div>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            if (block.illustrationPrompt) {
                              return (
                                <div key={bIdx} className="border border-dashed border-teal-200 bg-teal-50/10 rounded-lg p-3 text-[10px] text-teal-800 leading-normal flex items-center gap-2">
                                  <span className="text-sm">🎨</span>
                                  <span>
                                    <strong>Ilustrasi Pendukung Disarankan:</strong> {block.illustrationPrompt}
                                  </span>
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>

                        {section.visualDesignTip && (
                          <div className="pt-1.5">
                            <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                              📌 Tips Visual: {section.visualDesignTip}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Self-Reflection checklist rendered in card */}
                    {lkpdResult.selfReflectionChecklist && lkpdResult.selfReflectionChecklist.length > 0 && (
                      <div className="mt-8 border border-emerald-200 bg-emerald-50/20 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 border-b border-emerald-200 pb-1.5 uppercase tracking-wide">
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                          Refleksi Mandiri Siswa
                        </h4>
                        <p className="text-[10px] text-emerald-700/80 italic mt-1 mb-2.5">Centanglah sesuai dengan apa yang kamu pahami!</p>
                        
                        <div className="space-y-2 text-xs">
                          {lkpdResult.selfReflectionChecklist.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-700 pr-4">{item}</span>
                              <div className="flex gap-4 shrink-0 font-mono text-[10px] text-slate-300">
                                <span className="flex items-center gap-1">
                                  <span className="w-3.5 h-3.5 border border-slate-300 rounded bg-white inline-block"></span> Ya
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-3.5 h-3.5 border border-slate-300 rounded bg-white inline-block"></span> Tidak
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* LKPD Footer */}
                  <div className="relative z-10 border-t border-dashed border-slate-200 pt-5 mt-6 flex flex-col items-center justify-between gap-2.5 text-center">
                    {lkpdResult.penutupMotivasi && (
                      <p className={`text-xs font-black tracking-wide ${theme.accentColor}`}>
                        ⭐ {lkpdResult.penutupMotivasi} ⭐
                      </p>
                    )}
                    <span className="text-[9px] text-slate-400 font-semibold font-mono">
                      LKPD INTERAKTIF &bull; DESAIN OLEH GURU MANDIRI AI STUDIO &bull; PORTRAIT A4 GRAPHICS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
