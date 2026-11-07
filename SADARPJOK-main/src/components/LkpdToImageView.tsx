import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Download, 
  Image as ImageIcon, 
  FileText, 
  FileDown, 
  Copy, 
  Check, 
  RefreshCw, 
  Printer, 
  ExternalLink, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Palette, 
  HelpCircle,
  FileCheck2,
  Share2,
  RotateCcw,
  Sliders,
  Layers,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InteractiveLkpdData } from '../types';
import { exportLkpdToDoc, downloadDocFile, copyAndOpenGoogleDocs, copyRichHtmlToClipboard, downloadJsonFile } from '../lib/exportUtils';
import { downloadElementAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getLkpdToImagePrompts } from '../utils/aiPromptGenerators';
import html2canvas from 'html2canvas-pro';

// Sample LKPD presets for quick preview & inspiration
const LKPD_PRESETS = [
  {
    id: 'pjok_sepakbola',
    label: 'Sepak Bola Mini (Passing & Kontrol)',
    mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kelas: '4 SD / Fase B',
    topik: 'Variasi Gerak Dasar Lokomotor & Manipulatif Sepak Bola Mini',
    guru: 'Ahmad Rafsanjani, S.Pd.',
    sekolah: 'SD Negeri Kalimantong',
    alokasi: '2 x 35 Menit',
    rawText: `LEMBAR KERJA PESERTA DIDIK (LKPD)
Mata Pelajaran: PJOK
Kelas / Fase: IV SD / Fase B
Topik Materi: Variasi Gerak Passing dan Kontrol Sepak Bola Mini
Alokasi Waktu: 2 x 35 Menit

1. PETUNJUK BELAJAR
- Awali dengan berdoa dan lakukan pemanasan statis-dinamis 10 menit.
- Gunakan pakaian olahraga lengkap dan sepatu olahraga yang aman.
- Kerjakan setiap aktivitas dengan jujur, disiplin, dan menjunjung tinggi sportivitas.

2. MARI MEMAHAMI KONSEP GERAK
Passing dengan kaki bagian dalam memberikan kontrol arah bola yang paling stabil dan akurat. Saat menendang, kaki tumpu diletakkan di samping bola sekitar 10-15 cm, ujung kaki tumpu menghadap sasaran, dan lutut sedikit ditekuk untuk menjaga keseimbangan.

Pertanyaan Pemahaman:
1) Mengapa kaki tumpu harus berada sejajar di samping bola saat melakukan passing mendatar?
2) Jelaskan perbedaan perkenaan bola saat mengoper menggunakan kaki bagian dalam dengan ujung jari kaki!
3) Bagaimana cara meredam laju bola yang datang cepat agar bola tidak memantul jauh dari jangkauan kakimu?

3. TANTANGAN PRAKTIK LAPANGAN
Lakukan latihan passing-kontrol berpasangan dengan jarak 5 meter melewati gerbang kerucut (cone). Catat hasil latihan kelompokmu:
- Pengulangan 1: 10 kali operan mendatar (Berapa kali bola berhasil sampai tepat ke sasaran?)
- Pengulangan 2: Latihan kontrol bola lambung rendah menggunakan telapak kaki.

Ayo Pasangkan Istilah & Fungsinya:
- Passing Kaki Dalam <--> Mengoper bola jarak pendek dengan akurasi tinggi
- Stopping Telapak Kaki <--> Meredam dan menghentikan bola secara instan
- Dribbling Punggung Kaki <--> Menggiring bola ke ruang kosong melewati hadangan lawan

4. REFLEKSI & SIKAP SPORTIVITAS
- Nilai karakter apa yang paling kamu rasakan saat berlatih bersama teman kelompok?
- Tantangan gerak apa yang masih perlu kamu perbaiki pada pertemuan berikutnya?`
  },
  {
    id: 'pjok_kebugaran',
    label: 'Kebugaran Jasmani & Sirkuit Gerak',
    mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kelas: '5 SD / Fase C',
    topik: 'Aktivitas Latihan Daya Tahan Jantung dan Kekuatan Otot',
    guru: 'Guru PJOK SD',
    sekolah: 'SD Negeri Kalimantong',
    alokasi: '2 x 35 Menit',
    rawText: `LEMBAR KERJA PESERTA DIDIK (LKPD) KEBUGARAN JASMANI
Mata Pelajaran: PJOK
Kelas: V SD / Fase C
Topik: Latihan Kebugaran Sirkuit (Circuit Training)

PETUNJUK:
1. Bacalah materi stasiun kebugaran sebelum mencoba.
2. Hitung denyut nadi sebelum dan sesudah latihan selama 15 detik dikalikan 4.
3. Utamakan keselamatan dan jaga hidrasi tubuh.

STASIUN LATIHAN SIRKUIT:
- Pos 1: Shuttle Run (Lari bolak-balik 5 meter x 4 repetisi)
- Pos 2: Jumping Jacks (Lompat membuka dan menutup tangan-kaki 20 detik)
- Pos 3: Plank Tumpuan Lengan (Menahan posisi tubuh lurus 15 detik)
- Pos 4: Skipping / Lompat Tali (Irama teratur selama 30 detik)

PERTANYAAN ANALISIS:
1) Mengapa detak jantung berdenyut lebih kencang setelah menyelesaikan latihan pos sirkuit?
2) Bagaimana cara mengatur ritme napas yang tepat saat melakukan latihan ketahanan fisik?
3) Tuliskan 3 tanda fisik yang menunjukkan tubuhmu mulai mengalami kelelahan dan butuh istirahat!

REFLEKSI DIRI:
- Berapa jumlah air putih yang kamu minum hari ini?
- Apakah kamu merasa lebih bugar dan bersemangat setelah berolahraga?`
  },
  {
    id: 'pjok_senam',
    label: 'Senam Lantai (Keseimbangan & Guling Depan)',
    mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kelas: '3 SD / Fase B',
    topik: 'Keterampilan Gerak Senam Lantai di atas Matras',
    guru: 'Guru PJOK SD',
    sekolah: 'SD Negeri Kalimantong',
    alokasi: '2 x 35 Menit',
    rawText: `LEMBAR KERJA PESERTA DIDIK (LKPD) SENAM LANTAI
Mata Pelajaran: PJOK
Kelas: III SD / Fase B
Topik: Pola Gerak Dominan Senam Lantai (Bertumpu, Keseimbangan, Mendarat)

PETUNJUK PENGGUNAAN:
1. Latihan senam WAJIB dilakukan di atas matras senam yang aman.
2. Jangan melakukan gerakan sebelum mendapat aba-aba dan pengawasan dari guru.
3. Selalu awali dengan pemanasan leher dan pergelangan tangan secara menyeluruh.

MARI MENGAMATI & MEMAHAMI:
Sikap lilin melatih keseimbangan statis dengan tumpuan pada tengkuk dan ditopang oleh kedua telapak tangan pada pinggang. Kaki lurus vertikal ke atas dan pandangan rileks.

PERTANYAAN PEMAHAMAN:
1. Mengapa dagu harus menempel di dada saat melakukan awalan guling depan (forward roll)?
2. Apa fungsi kedua telapak tangan yang menopang pinggang pada gerakan sikap lilin?
3. Sebutkan aturan keselamatan yang paling penting saat menggunakan matras senam bersama teman!

TUGAS PENGAMATAN TEMAN SEBAYA:
Amati gerakan guling depan teman sekelasmu dan beri tanda centang:
- Kaki ditekuk merapat saat mengguling (Ya / Belum)
- Pendaratan dengan dua kaki seimbang dan mengeper (Ya / Belum)

PESAN MOTIVASI:
Berani mencoba dengan hati-hati adalah kunci keberhasilan pesenam cilik!`
  }
];

const THEME_OPTIONS = [
  {
    id: 'emerald_teal',
    label: 'Modern Clean Edukatif',
    desc: 'Nuansa Emerald & Teal bersih, formal, dan nyaman di mata',
    accentColor: 'from-emerald-700 to-teal-800',
    headerBg: 'bg-emerald-800 text-white',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    sectionBorder: 'border-emerald-300',
    boxBg: 'bg-emerald-50/40 border-emerald-200',
    highlightTag: 'bg-emerald-600 text-white',
    ringColor: 'focus:ring-emerald-500'
  },
  {
    id: 'amber_orange',
    label: 'Ramah Siswa Ceria',
    desc: 'Nuansa Warm Amber & Orange yang energetik dan ramah anak',
    accentColor: 'from-amber-600 to-orange-700',
    headerBg: 'bg-amber-700 text-white',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    sectionBorder: 'border-amber-300',
    boxBg: 'bg-amber-50/40 border-amber-200',
    highlightTag: 'bg-amber-600 text-white',
    ringColor: 'focus:ring-amber-500'
  },
  {
    id: 'indigo_purple',
    label: 'Gen Z Vibrant Interactive',
    desc: 'Nuansa Indigo & Purple modern, dinamis, dan estetik',
    accentColor: 'from-indigo-700 to-purple-800',
    headerBg: 'bg-indigo-800 text-white',
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    sectionBorder: 'border-indigo-300',
    boxBg: 'bg-indigo-50/40 border-indigo-200',
    highlightTag: 'bg-indigo-600 text-white',
    ringColor: 'focus:ring-indigo-500'
  },
  {
    id: 'cobalt_cyan',
    label: 'Sporty Dynamic',
    desc: 'Nuansa Cobalt & Cyan berenergi tinggi untuk materi olahraga',
    accentColor: 'from-blue-700 to-cyan-800',
    headerBg: 'bg-blue-800 text-white',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    sectionBorder: 'border-blue-300',
    boxBg: 'bg-blue-50/40 border-blue-200',
    highlightTag: 'bg-blue-600 text-white',
    ringColor: 'focus:ring-blue-500'
  }
];

export function LkpdToImageView() {
  // Input parameters
  const [rawText, setRawText] = useState(LKPD_PRESETS[0].rawText);
  const [mataPelajaran, setMataPelajaran] = useState(LKPD_PRESETS[0].mapel);
  const [kelas, setKelas] = useState(LKPD_PRESETS[0].kelas);
  const [topikMateri, setTopikMateri] = useState(LKPD_PRESETS[0].topik);
  const [guruPenyusun, setGuruPenyusun] = useState(LKPD_PRESETS[0].guru);
  const [sekolah, setSekolah] = useState(LKPD_PRESETS[0].sekolah);
  const [alokasiWaktu, setAlokasiWaktu] = useState(LKPD_PRESETS[0].alokasi);
  const [selectedThemeId, setSelectedThemeId] = useState('emerald_teal');

  // UI state
  const [loading, setLoading] = useState(false);
  const [capturingImage, setCapturingImage] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [lkpdResult, setLkpdResult] = useState<InteractiveLkpdData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [copiedTextStatus, setCopiedTextStatus] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // A4 DOM Reference
  const a4ContainerRef = useRef<HTMLDivElement>(null);

  const currentTheme = THEME_OPTIONS.find(t => t.id === selectedThemeId) || THEME_OPTIONS[0];

  const handleApplyPreset = (preset: typeof LKPD_PRESETS[0]) => {
    setRawText(preset.rawText);
    setMataPelajaran(preset.mapel);
    setKelas(preset.kelas);
    setTopikMateri(preset.topik);
    setGuruPenyusun(preset.guru);
    setSekolah(preset.sekolah);
    setAlokasiWaktu(preset.alokasi);
  };

  const handleGenerate = async () => {
    if (!rawText.trim()) {
      setErrorMessage('Lampiran naskah teks LKPD asli wajib diisi atau ditempel.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/generate-lkpd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'raw',
          mataPelajaran,
          kelas,
          topikMateri,
          guruPenyusun,
          sekolah,
          alokasiWaktu,
          gayaDesain: currentTheme.label,
          rawText
        })
      });

      if (!response.ok) {
        throw new Error('Gagal memproses pengubahan LKPD.');
      }

      const data = await response.json();
      if (!data || !data.sections) {
        throw new Error('Format respon LKPD tidak valid.');
      }

      setLkpdResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses generator LKPD.');
    } finally {
      setLoading(false);
    }
  };

  // Direct Image Download (PNG HD) via html2canvas-pro
  const handleDownloadImage = async (format: 'png' | 'jpeg' = 'png') => {
    if (!a4ContainerRef.current) return;
    setCapturingImage(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const element = a4ContainerRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2.5, // 2.5x high resolution for crisp 300 DPI A4 printout
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200
      });

      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const imageUri = canvas.toDataURL(mimeType, 0.95);
      const link = document.createElement('a');
      const safeTitle = (topikMateri || 'LKPD').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.href = imageUri;
      link.download = `LKPD_A4_Gambar_${safeTitle}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Gagal mengambil tangkapan layar gambar:', err);
      alert('Terjadi kesalahan saat mengekspor gambar LKPD.');
    } finally {
      setCapturingImage(false);
    }
  };

  // Copy Image directly to Clipboard
  const handleCopyImage = async () => {
    if (!a4ContainerRef.current) return;
    setCapturingImage(true);

    try {
      const element = a4ContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Blob tidak terbentuk');
        if (navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedStatus(true);
          setTimeout(() => setCopiedStatus(false), 2500);
        } else {
          // Fallback to image download
          handleDownloadImage('png');
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      handleDownloadImage('png');
    } finally {
      setCapturingImage(false);
    }
  };

  // PDF Export
  const handleExportPdf = async () => {
    if (!a4ContainerRef.current) return;
    setExportingPdf(true);
    try {
      const fileName = `LKPD_F4_Portrait_${(topikMateri || 'PJOK').replace(/\s+/g, '_')}.pdf`;
      await downloadElementAsPdf(a4ContainerRef.current, fileName, {
        orientation: 'portrait',
        marginMm: 8
      });
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setExportingPdf(false);
    }
  };

  // Word Export
  const handleExportWord = () => {
    if (!lkpdResult) return;
    const docHtml = exportLkpdToDoc(lkpdResult);
    const fileName = `LKPD_F4_${(topikMateri || 'PJOK').replace(/\s+/g, '_')}.doc`;
    downloadDocFile(fileName, docHtml);
  };

  // Copy Google Docs
  const handleCopyGoogleDocs = async () => {
    if (!lkpdResult) return;
    const docBlob = exportLkpdToDoc(lkpdResult);
    const success = await copyAndOpenGoogleDocs(docBlob);
    if (success) {
      setCopiedTextStatus(true);
      setTimeout(() => setCopiedTextStatus(false), 2500);
    }
  };

  const promptTabs = getLkpdToImagePrompts(rawText, {
    mataPelajaran,
    kelas,
    topik: topikMateri,
    gayaDesain: currentTheme.label
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-teal-100">
              <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
              Generator Visual Interaktif • Ukuran F4 (21,5 cm x 33 cm) Portrait
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Ubah LKPD Menjadi Gambar Interaktif
            </h1>
            <p className="text-teal-100 text-sm md:text-base leading-relaxed">
              Mengubah naskah LKPD asli menjadi lembar kerja visual bergambar interaktif ukuran F4 portrait dengan <strong>100% teks & soal dipertahankan sama persis</strong>, kotak jawaban kreatif, ikon pendukung (📌, ✏️, 💡, 🔍), dan langsung dapat didownload dalam bentuk <strong>file gambar (PNG HD / JPEG) maupun PDF F4 Siap Cetak</strong>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setShowPromptModal(true)}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-amber-300" />
              Prompt AI Ubah LKPD
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Input and Live A4 Visual Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel (Col 5) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                Input Naskah LKPD
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% Teks Asli
              </span>
            </div>

            {/* Presets Quick Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                Muat Contoh LKPD Cepat:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {LKPD_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-2 rounded-xl text-left border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-xs cursor-pointer flex flex-col justify-between"
                  >
                    <span className="font-bold text-slate-800 truncate block">{p.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{p.kelas}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lampiran LKPD Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  Lampiran LKPD Asli <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-500">
                  {rawText.length} karakter
                </span>
              </div>
              <textarea
                rows={9}
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Tempel seluruh naskah isi LKPD di sini (soal, petunjuk, materi, dan tabel). Seluruh redaksi teks akan dipertahankan 100% sama persis..."
                className="w-full px-3.5 py-2.5 text-xs font-mono leading-relaxed rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 leading-tight">
                💡 <em>Sesuai instruksi: Seluruh teks, pertanyaan, instruksi, dan materi dalam LKPD dipertahankan 100% sama persis tanpa pengurangan. Hanya tata letak visualnya yang diubah menjadi menarik, rapi, dan interaktif.</em>
              </p>
            </div>

            {/* Pilihan Gaya Desain Visual */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-600" />
                Gaya Desain Visual & Warna
              </label>
              <div className="grid grid-cols-2 gap-2">
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedThemeId(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedThemeId === t.id
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${t.accentColor}`} />
                      <span className="text-xs font-bold text-slate-800">{t.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block leading-tight">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    value={mataPelajaran}
                    onChange={(e) => setMataPelajaran(e.target.value)}
                    placeholder="PJOK"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Kelas / Fase
                  </label>
                  <input
                    type="text"
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    placeholder="4 SD / Fase B"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Guru Penyusun
                  </label>
                  <input
                    type="text"
                    value={guruPenyusun}
                    onChange={(e) => setGuruPenyusun(e.target.value)}
                    placeholder="Nama Guru"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
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
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Topik / Materi Pokok
                </label>
                <input
                  type="text"
                  value={topikMateri}
                  onChange={(e) => setTopikMateri(e.target.value)}
                  placeholder="Keterampilan Gerak & Kebugaran"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-800 hover:from-teal-800 hover:via-emerald-800 hover:to-cyan-900 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mendesain LKPD A4 Bergambar...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Ubah Menjadi LKPD Bergambar A4</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Panel: A4 Sheet Preview & Image Export (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Action Toolbar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Format F4 (21,5 x 33 cm) Siap Cetak
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Download PNG HD Button */}
              <button
                onClick={() => handleDownloadImage('png')}
                disabled={capturingImage}
                title="Download Gambar LKPD Format PNG Resolusi Tinggi"
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {capturingImage ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>Download Gambar (PNG HD)</span>
              </button>

              {/* Download JPEG */}
              <button
                onClick={() => handleDownloadImage('jpeg')}
                disabled={capturingImage}
                title="Download Gambar LKPD Format JPEG"
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>JPEG</span>
              </button>

              {/* Download PDF */}
              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                title="Download Dokumen PDF F4 Portrait Siap Cetak"
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
              >
                {exportingPdf ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span>PDF (F4)</span>
              </button>

              {/* Salin Gambar */}
              <button
                onClick={handleCopyImage}
                disabled={capturingImage}
                title="Salin Gambar ke Clipboard"
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-amber-600" />
                <span>{copiedStatus ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Rendered F4 Sheet Container */}
          <div className="flex justify-center bg-slate-200/60 p-3 sm:p-6 rounded-2xl border border-slate-200 overflow-x-auto shadow-inner">
            <div
              ref={a4ContainerRef}
              id="a4-lkpd-sheet"
              className="w-full max-w-[812px] bg-white shadow-2xl rounded-xs p-6 sm:p-8 space-y-5 text-slate-800 border border-slate-300 relative print:p-0 print:border-none print:shadow-none"
              style={{
                minHeight: '1247px', // Standard F4 Aspect Ratio at 96 DPI (812px x 1247px)
                boxSizing: 'border-box'
              }}
            >
              {/* A4 Watermark Background Accent */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.025] flex items-center justify-center overflow-hidden">
                <span className="text-[120px] font-black uppercase text-slate-900 rotate-[-35deg] select-none">
                  LKPD SISWA
                </span>
              </div>

              {/* Kop Header LKPD */}
              <div className="relative border-b-2 border-slate-800 pb-3 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-sm ${currentTheme.headerBg}`}>
                    ⚡
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 leading-tight">
                      LEMBAR KERJA PESERTA DIDIK (LKPD)
                    </h2>
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                      {sekolah} • {mataPelajaran}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Tahun Ajaran 2026/2027 • Kurikulum Merdeka
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${currentTheme.badgeBg}`}>
                    {kelas}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">Alokasi: {alokasiWaktu}</p>
                </div>
              </div>

              {/* Student Identity Grid Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Nama Murid:</span>
                  <div className="border-b border-dotted border-slate-400 pb-1 mt-0.5 text-slate-700 font-medium">
                    ..........................................
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">No. Absen:</span>
                  <div className="border-b border-dotted border-slate-400 pb-1 mt-0.5 text-slate-700 font-medium">
                    .........
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Hari / Tanggal:</span>
                  <div className="border-b border-dotted border-slate-400 pb-1 mt-0.5 text-slate-700 font-medium">
                    ..........................................
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Nilai / Paraf Guru:</span>
                  <div className="border-b border-dotted border-slate-400 pb-1 mt-0.5 text-slate-700 font-medium flex items-center justify-between">
                    <span>⭐⭐⭐⭐</span>
                    <span>(.........)</span>
                  </div>
                </div>
              </div>

              {/* Judul Topik Banner */}
              <div className={`p-3.5 rounded-xl text-white shadow-sm flex items-center justify-between gap-3 bg-gradient-to-r ${currentTheme.accentColor}`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 block">
                    Topik Pembelajaran
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold leading-tight">
                    {topikMateri}
                  </h3>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-lg text-xs font-semibold flex-shrink-0">
                  <span>Guru: {guruPenyusun}</span>
                </div>
              </div>

              {/* Content Render: If generated, render structured sections; otherwise render raw text in high-end layout */}
              {lkpdResult && lkpdResult.sections ? (
                <div className="space-y-4">
                  {lkpdResult.sections.map((section, sIdx) => (
                    <div
                      key={sIdx}
                      className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-3 shadow-2xs"
                    >
                      {/* Section Title with Icon */}
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <span className="text-base">{section.icon || '📌'}</span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                          {section.sectionTitle}
                        </h4>
                      </div>

                      {section.introText && (
                        <p className="text-xs text-slate-600 italic">
                          {section.introText}
                        </p>
                      )}

                      {/* Content Blocks */}
                      <div className="space-y-3">
                        {section.contentBlocks.map((block, bIdx) => (
                          <div key={bIdx} className="text-xs space-y-2">
                            {block.blockType === 'text' && (
                              <p className="text-slate-700 leading-relaxed font-normal whitespace-pre-line bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                                {block.exactText}
                              </p>
                            )}

                            {block.blockType === 'question' && block.questionData && (
                              <div className={`p-3 rounded-xl border ${currentTheme.boxBg} space-y-2`}>
                                <div className="flex items-start gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${currentTheme.highlightTag}`}>
                                    ✏️
                                  </span>
                                  <p className="font-bold text-slate-800 text-xs leading-snug">
                                    {block.questionData.questionText}
                                  </p>
                                </div>

                                {/* Answer Box Stylings */}
                                {block.questionData.answerBoxStyle === 'rounded_large' && (
                                  <div className="bg-white border-2 border-slate-300 rounded-xl p-3 min-h-[60px] text-slate-400 italic text-[11px] flex items-start">
                                    <span>{block.questionData.placeholderText || 'Tuliskan jawaban analisismu di sini...'}</span>
                                  </div>
                                )}

                                {block.questionData.answerBoxStyle === 'dotted_box' && (
                                  <div className="bg-white border-2 border-dashed border-slate-400 rounded-xl p-3 min-h-[60px] text-slate-400 italic text-[11px]">
                                    <span>{block.questionData.placeholderText || 'Tuangkan ide dan hasil eksplorasimu...'}</span>
                                  </div>
                                )}

                                {block.questionData.answerBoxStyle === 'speech_bubble' && (
                                  <div className="relative bg-white border border-slate-300 rounded-2xl p-3 min-h-[50px] text-slate-400 text-[11px] shadow-2xs">
                                    <span>💬 {block.questionData.placeholderText || 'Jawaban murid...'}</span>
                                  </div>
                                )}

                                {block.questionData.answerBoxStyle === 'ruled_lines' && (
                                  <div className="space-y-2 pt-1">
                                    <div className="border-b border-slate-300 h-4" />
                                    <div className="border-b border-slate-300 h-4" />
                                    <div className="border-b border-slate-300 h-4" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Table Data */}
                            {block.tableData && (
                              <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-[11px] text-left">
                                  <thead className="bg-slate-100 font-bold text-slate-700">
                                    <tr>
                                      {block.tableData.headers?.map((h, hIdx) => (
                                        <th key={hIdx} className="px-2.5 py-1.5 border-b border-slate-200">
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {block.tableData.rows?.map((r, rIdx) => (
                                      <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50">
                                        {r.map((cell, cIdx) => (
                                          <td key={cIdx} className="px-2.5 py-1.5">
                                            {cell}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Matching Pairs */}
                            {block.matchingData && (
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                                <p className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                                  <span>🔄 Tarik garis untuk mencocokkan:</span>
                                </p>
                                <div className="space-y-1.5">
                                  {block.matchingData.pairs?.map((pair, pIdx) => (
                                    <div key={pIdx} className="flex items-center justify-between gap-3 text-xs">
                                      <div className="bg-white border border-slate-300 px-3 py-1.5 rounded-lg font-semibold text-slate-800 flex-1">
                                        {pair.leftItem}
                                      </div>
                                      <div className="text-slate-400 font-bold">➔</div>
                                      <div className="bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-slate-700 flex-1">
                                        {pair.rightItem}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Motivasi & Checklist Penutup */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                    {lkpdResult.penutupMotivasi && (
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                        <span>🌟</span>
                        <span>{lkpdResult.penutupMotivasi}</span>
                      </div>
                    )}

                    {lkpdResult.selfReflectionChecklist && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Cek Pemahaman Diri (Centang Jika Sesuai):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {lkpdResult.selfReflectionChecklist.map((item, idx) => (
                            <label key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                              <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                              <span>{item}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Raw Preview Mode (Shows verbatim text wrapped in interactive A4 visual boxes) */
                <div className="space-y-4">
                  {rawText.split('\n\n').map((paragraph, pIdx) => {
                    const trimmed = paragraph.trim();
                    if (!trimmed) return null;

                    const isTitle = trimmed.match(/^(Aktivitas|Bagian|Langkah|Pertemuan|[0-9]\.|\bPETUNJUK\b|\bMARI\b)/i) && trimmed.length < 80;
                    const hasQuestions = trimmed.includes('?') || trimmed.includes('1)') || trimmed.includes('2)');

                    return (
                      <div
                        key={pIdx}
                        className={`rounded-xl p-3.5 border transition-all ${
                          isTitle 
                            ? 'bg-slate-50/80 border-slate-200 font-bold text-slate-800' 
                            : hasQuestions 
                              ? `${currentTheme.boxBg} border-emerald-300` 
                              : 'bg-white border-slate-200'
                        }`}
                      >
                        {isTitle ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">📌</span>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">{trimmed}</h4>
                          </div>
                        ) : hasQuestions ? (
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-emerald-700">✏️</span>
                              <p className="text-xs text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                                {trimmed}
                              </p>
                            </div>
                            <div className="bg-white border-2 border-dashed border-slate-300 rounded-lg p-2.5 text-[11px] text-slate-400 italic">
                              [ Ruang Jawaban / Eksplorasi Murid ]
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {trimmed}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* Fallback Checklist */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Refleksi & Sikap Sportivitas:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                        <span className="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-[10px]">✓</span>
                        <span>Saya melakukan aktivitas dengan sportif & jujur.</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                        <span className="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-[10px]">✓</span>
                        <span>Saya menjaga keselamatan diri dan teman kelompok.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* A4 Footer Bar */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <span>Ukuran Cetak: A4 Portrait (21 cm x 29,7 cm)</span>
                <span>Halaman 1 dari 1</span>
                <span>SADAR PJOK • Kurikulum Merdeka</span>
              </div>
            </div>
          </div>

          {/* Bottom Tools & JSON Export */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              LKPD siap didownload langsung dalam bentuk <strong>Gambar HD</strong> untuk dicetak atau dibagikan ke siswa/wali murid.
            </div>
            <ExportJsonPromptAiButtons
              onExportJson={() => {
                const filename = `LKPD_A4_${(topikMateri || 'PJOK').replace(/\s+/g, '_')}.json`;
                downloadJsonFile(filename, lkpdResult || {
                  topikMateri,
                  mataPelajaran,
                  kelas,
                  guruPenyusun,
                  sekolah,
                  alokasiWaktu,
                  rawText
                });
              }}
              onOpenPromptAi={() => setShowPromptModal(true)}
              aiLabel="Prompt AI Ubah LKPD"
            />
          </div>
        </div>
      </div>

      {/* Ai Prompt Modal */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI Ubah LKPD Menjadi Gambar A4"
        tabs={promptTabs}
      />
    </div>
  );
}

export default LkpdToImageView;
