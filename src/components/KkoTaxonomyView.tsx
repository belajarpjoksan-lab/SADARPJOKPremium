import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  HelpCircle, 
  BookOpen, 
  Cpu, 
  Layers, 
  Flame, 
  BrainCircuit, 
  Activity, 
  TrendingUp, 
  Check, 
  Copy, 
  CornerDownRight, 
  ArrowRight, 
  Award,
  BookMarked,
  Info,
  CheckCircle2,
  FileSignature,
  Printer,
  Download
} from 'lucide-react';
import { downloadJsonFile, downloadDocFile } from '../lib/exportUtils';
import { printHtmlDocument, downloadHtmlAsPdf } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getKodeEtikKkoCetakPrompts } from '../utils/aiPromptGenerators';

interface KkoLevel {
  level: string;
  name: string;
  definition: string;
  verbs: string[];
  pjokExample: string;
  generalExample: string;
}

interface SoloLevel {
  level: string;
  name: string;
  symbol: string;
  definition: string;
  verbs: string[];
  pjokExample: string;
  generalExample: string;
}

export default function KkoTaxonomyView() {
  const [activeTab, setActiveTab] = useState<'bloom' | 'solo' | 'analyzer'>('bloom');
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for AI Analyzer
  const [draftTp, setDraftTp] = useState('Siswa dapat mempraktikkan cara melempar bola kasti dengan baik');
  const [subject, setSubject] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan');
  const [grade, setGrade] = useState('4');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Full Bloom's KKO Data
  const bloomKkoData: KkoLevel[] = [
    {
      level: "C1",
      name: "Mengingat (Remembering)",
      definition: "Mengambil pengetahuan yang relevan dari memori jangka panjang. Mengenali kembali (recalling) fakta, istilah, konsep dasar, atau jawaban.",
      verbs: [
        "Menyebutkan", "Menghafal", "Mengingat kembali", "Menyatakan", "Menuliskan", "Menunjukkan", 
        "Mendefinisikan", "Mendaftar", "Memilih", "Menandai", "Mencocokkan", "Mengidentifikasi", 
        "Mengulang", "Mereproduksi", "Menamai", "Menempatkan", "Meniru", "Menyusun daftar"
      ],
      pjokExample: "Siswa dapat menyebutkan minimal 3 macam pola gerak dasar lokomotor dalam permainan kasti.",
      generalExample: "Siswa dapat menyebutkan sila-sila dalam Pancasila secara berurutan dan tepat."
    },
    {
      level: "C2",
      name: "Memahami (Understanding)",
      definition: "Membangun makna dari materi instruksional, termasuk penjelasan lisan, tulisan, dan komunikasi grafis melalui penafsiran, contoh, klasifikasi, ringkasan, inferensi, perbandingan, dan penjelasan.",
      verbs: [
        "Menjelaskan", "Mengklasifikasikan", "Mengkategorikan", "Merangkum", "Membandingkan", "Menafsirkan", 
        "Menguraikan", "Mengidentifikasi prinsip", "Memberi contoh", "Menyimpulkan", "Memperkirakan", 
        "Menerjemahkan", "Membedakan", "Menjabarkan", "Mengilustrasikan", "Memetakan"
      ],
      pjokExample: "Siswa dapat menjelaskan perbedaan antara gerak lokomotor, non-lokomotor, dan manipulatif beserta contohnya.",
      generalExample: "Siswa dapat menjelaskan proses terjadinya siklus air berdasarkan diagram yang disajikan."
    },
    {
      level: "C3",
      name: "Menerapkan (Applying)",
      definition: "Menggunakan prosedur, aturan, metode, atau konsep yang telah dipelajari untuk menyelesaikan masalah atau melakukan tugas dalam situasi baru atau situasi yang konkret.",
      verbs: [
        "Mempraktikkan", "Melaksanakan", "Menggunakan", "Melakukan", "Mengoperasikan", "Menghitung", 
        "Mendemonstrasikan", "Menerapkan", "Membuat draf", "Menyesuaikan", "Memodifikasi", "Menguji",
        "Menemukan", "Memecahkan masalah", "Mengubah", "Menjalankan", "Menggunakan alat"
      ],
      pjokExample: "Siswa dapat mempraktikkan kombinasi gerak dasar lokomotor dan manipulatif saat melakukan lemparan melambung permainan kasti.",
      generalExample: "Siswa dapat menghitung luas permukaan kubus menggunakan rumus matematika yang tepat."
    },
    {
      level: "C4",
      name: "Menganalisis (Analyzing)",
      definition: "Memecah materi atau konsep menjadi bagian-bagian penyusunnya dan menentukan bagaimana bagian-bagian tersebut saling berhubungan satu sama lain dan terhadap struktur atau tujuan keseluruhan.",
      verbs: [
        "Menganalisis", "Mendiagnosis", "Menelaah", "Mengoreksi", "Mengaitkan", "Mendeteksi", "Memilih", 
        "Memisahkan", "Memecah", "Menguji", "Membandingkan perbedaan", "Menemukan pola", "Menyusun skema", 
        "Mengaudit", "Menyeleksi", "Menguraikan hubungan"
      ],
      pjokExample: "Siswa dapat mendiagnosis kesalahan posisi kaki dan lengan saat teman melakukan gerakan passing bawah bola voli.",
      generalExample: "Siswa dapat menelaah faktor-faktor penyebab terjadinya erosi tanah di daerah perbukitan tandus."
    },
    {
      level: "C5",
      name: "Mengevaluasi (Evaluating)",
      definition: "Membuat keputusan atau penilaian berdasarkan kriteria dan standar tertentu melalui pemeriksaan kualitas, efektivitas, efisiensi, kelayakan, atau konsistensi.",
      verbs: [
        "Mengevaluasi", "Menilai", "Mengkritik", "Memutuskan", "Mempertahankan", "Menyanggah", 
        "Memvalidasi", "Merekomendasikan", "Menaksir", "Memilih solusi terbaik", "Membandingkan standar", 
        "Menimbang", "Menilai efektivitas", "Menghakimi", "Mendukung argumentasi"
      ],
      pjokExample: "Siswa dapat menilai efektivitas strategi penyerangan regu pemukul dalam permainan kasti sederhana.",
      generalExample: "Siswa dapat mengevaluasi kredibilitas dua sumber berita yang membahas peristiwa sejarah yang sama."
    },
    {
      level: "C6",
      name: "Mengkreasi (Creating)",
      definition: "Menempatkan elemen-elemen bersama-sama untuk membentuk satu kesatuan yang koheren atau fungsional; menyusun kembali elemen-elemen ke dalam pola atau struktur baru melalui generasi, perencanaan, atau produksi.",
      verbs: [
        "Merancang", "Menciptakan", "Membuat", "Menyusun", "Mengembangkan", "Merumuskan", "Mendesain", 
        "Mengarang", "Mengintegrasikan", "Merekayasa", "Mengonstruksi", "Menghasilkan karya", 
        "Memodifikasi permainan", "Menggabungkan", "Memprakarsai"
      ],
      pjokExample: "Siswa dapat merancang variasi permainan bola kasti modifikasi dengan aturan baru yang menjunjung tinggi keadilan.",
      generalExample: "Siswa dapat menyusun teks cerita pendek orisinal yang mengandung amanat moral kebersamaan."
    }
  ];

  // Full SOLO Taxonomy Data
  const soloKkoData: SoloLevel[] = [
    {
      level: "Prestructural",
      name: "Pra-struktural (Pre-structural)",
      symbol: "🔴",
      definition: "Siswa tidak memahami materi, salah menafsirkan tugas, atau menggunakan pendekatan yang terlalu sederhana dan tidak relevan. Belum ada koneksi logis.",
      verbs: [
        "Merespons secara acak", "Menolak berpartisipasi", "Menyalin tanpa mengerti", 
        "Memberi jawaban tidak relevan", "Mengabaikan instruksi"
      ],
      pjokExample: "Siswa belum memahami konsep gerak dasar, hanya berlari tanpa arah dan tidak mempedulikan aturan permainan kasti.",
      generalExample: "Siswa menjawab pertanyaan matematika dengan menggambar objek yang tidak berhubungan."
    },
    {
      level: "Unistructural",
      name: "Uni-struktural (Uni-structural)",
      symbol: "🟢",
      definition: "Siswa memahami satu aspek tunggal dari materi atau tugas, namun hubungan antaraspek belum terlihat. Fokus hanya pada satu informasi yang jelas.",
      verbs: [
        "Mengidentifikasi satu aspek", "Menyebutkan satu hal", "Mengingat satu istilah", 
        "Melakukan satu instruksi sederhana", "Mengenali satu contoh"
      ],
      pjokExample: "Siswa dapat mengidentifikasi satu jenis lemparan saja dalam kasti, yaitu lemparan melambung tanpa tahu cara menangkapnya.",
      generalExample: "Siswa dapat menunjukkan letak ibu kota negara Indonesia di dalam peta."
    },
    {
      level: "Multistructural",
      name: "Multi-struktural (Multi-structural)",
      symbol: "🔵🔵",
      definition: "Siswa memahami beberapa aspek materi secara terpisah-pisah, namun belum mampu mengaitkan atau mengintegrasikan aspek-aspek tersebut menjadi satu kesatuan utuh.",
      verbs: [
        "Menyebutkan daftar", "Mendeskripsikan beberapa hal", "Mengklasifikasikan", 
        "Melakukan serangkaian gerakan terpisah", "Melaporkan kumpulan data"
      ],
      pjokExample: "Siswa dapat mendemonstrasikan gerakan melempar, menangkap, dan memukul kasti secara terpisah dengan baik, namun bingung menerapkannya di permainan dinamis.",
      generalExample: "Siswa dapat mendaftarkan 5 nama pahlawan nasional beserta asal daerahnya masing-masing secara benar."
    },
    {
      level: "Relational",
      name: "Relasional (Relational)",
      symbol: "🔗",
      definition: "Siswa mampu mengaitkan berbagai fakta, konsep, dan keterampilan yang dipelajari menjadi satu pemahaman yang utuh, koheren, dan fungsional. Mampu menganalisis hubungan sebab-akibat.",
      verbs: [
        "Mengaitkan", "Menghubungkan", "Menganalisis hubungan", "Membandingkan dan membedakan", 
        "Menerapkan secara kontekstual", "Menjelaskan sebab-akibat", "Mengintegrasikan keterampilan"
      ],
      pjokExample: "Siswa dapat mengaitkan koordinasi gerak melempar dan berlari ke tiang hinggap secara sinkron dan taktis berdasarkan posisi bola lawan saat bermain kasti.",
      generalExample: "Siswa dapat membandingkan pengaruh letak geografis Indonesia terhadap mata pencaharian penduduk di daerah pantai dan pegunungan."
    },
    {
      level: "Extended Abstract",
      name: "Abstrak Diperluas (Extended Abstract)",
      symbol: "🌟",
      definition: "Siswa mampu menyematkan pemahamannya ke tingkat konseptual yang lebih tinggi, membuat generalisasi, memformulasikan hipotesis, mentransfer prinsip ke situasi baru yang sangat berbeda, atau menciptakan konsep baru.",
      verbs: [
        "Membuat teori", "Membuktikan hipotesis", "Merefleksikan", "Menciptakan kreasi baru", 
        "Memformulasikan hukum", "Merancang solusi orisinal", "Menggeneralisasi prinsip"
      ],
      pjokExample: "Siswa mampu merefleksikan nilai sportivitas permainan kasti untuk menyelesaikan konflik sosial antar-teman saat bermain di lingkungan rumah.",
      generalExample: "Siswa dapat merancang model kota mandiri masa depan yang ramah lingkungan berdasarkan prinsip konservasi energi terbarukan."
    }
  ];

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTp.trim()) return;

    setIsAnalyzing(true);
    setApiError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze-kko', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tujuanPembelajaran: draftTp,
          mataPelajaran: subject,
          grade
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal menganalisis Tujuan Pembelajaran.');
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      setApiError(err.message || 'Gagal terhubung dengan server AI Analisis KKO.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyOption = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      });
  };

  // Filter verbs across both tables if search is active
  const filteredBloom = bloomKkoData.map(level => {
    if (!searchTerm) return level;
    const lowerSearch = searchTerm.toLowerCase();
    const matchesLevel = level.level.toLowerCase().includes(lowerSearch) || level.name.toLowerCase().includes(lowerSearch);
    const filteredVerbs = level.verbs.filter(verb => verb.toLowerCase().includes(lowerSearch));
    
    if (matchesLevel || filteredVerbs.length > 0 || level.definition.toLowerCase().includes(lowerSearch)) {
      return {
        ...level,
        highlightedVerbs: filteredVerbs.length > 0 ? filteredVerbs : level.verbs,
        isMatched: true
      };
    }
    return { ...level, isMatched: false };
  }).filter(l => (l as any).isMatched);

  const filteredSolo = soloKkoData.map(level => {
    if (!searchTerm) return level;
    const lowerSearch = searchTerm.toLowerCase();
    const matchesLevel = level.level.toLowerCase().includes(lowerSearch) || level.name.toLowerCase().includes(lowerSearch);
    const filteredVerbs = level.verbs.filter(verb => verb.toLowerCase().includes(lowerSearch));
    
    if (matchesLevel || filteredVerbs.length > 0 || level.definition.toLowerCase().includes(lowerSearch)) {
      return {
        ...level,
        highlightedVerbs: filteredVerbs.length > 0 ? filteredVerbs : level.verbs,
        isMatched: true
      };
    }
    return { ...level, isMatched: false };
  }).filter(l => (l as any).isMatched);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="kko-taxonomy-feature">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-cyan-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <Cpu className="w-8 h-8 text-emerald-300 animate-pulse" />
              Tabel KKO Taksonomi Bloom &amp; SOLO
            </h2>
            <p className="mt-2 text-emerald-100 max-w-2xl text-xs sm:text-sm leading-relaxed">
              Panduan interaktif <strong>Kata Kerja Operasional (KKO)</strong> Kurikulum Merdeka. Telaah klasifikasi kognitif <strong>Taksonomi Bloom (C1-C6)</strong> dan kedalaman respon siswa pada <strong>Taksonomi SOLO</strong>, dilengkapi AI Analyzer TP.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>Tabel KKO Taksonomi Bloom & SOLO (F4)</title>
<style>
  @page { size: 215mm 330mm; margin: 15mm 18mm; }
  body { font-family: 'Times New Roman', serif; font-size: 10.5pt; color: #000; line-height: 1.4; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14pt; }
  th, td { border: 1px solid #000; padding: 5pt 7pt; vertical-align: top; }
  th { background-color: #ecfdf5; font-weight: bold; text-align: center; }
</style></head>
<body>
  <div data-f4-kop="true" style="text-align:center; border-bottom:3px double #000; padding-bottom:8pt; margin-bottom:12pt;">
    <h2 style="margin:0; font-size:14pt; text-transform:uppercase;">PEDOMAN KATA KERJA OPERASIONAL (KKO) KURIKULUM MERDEKA</h2>
    <p style="margin:3pt 0 0 0; font-size:10.5pt; font-weight:bold;">Klasifikasi Kognitif Taksonomi Bloom (C1–C6) &amp; Kedalaman Respon Taksonomi SOLO</p>
  </div>
  <div data-f4-section="Bagian 1: Tabel KKO Taksonomi Bloom Revisi (C1 - C6)">
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">I. TABEL KKO TAKSONOMI BLOOM REVISI (ANDERSON &amp; KRATHWOHL)</h3>
    <table>
      <thead><tr><th style="width:90px;">Level</th><th style="width:160px;">Definisi Kognitif</th><th>Daftar Kata Kerja Operasional (KKO)</th><th style="width:190px;">Contoh Penerapan TP PJOK</th></tr></thead>
      <tbody>
        ${bloomKkoData.map(b => `<tr><td style="text-align:center; font-weight:bold;">${b.level}<br/><span style="font-size:9pt; font-weight:normal;">${b.name}</span></td><td>${b.definition}</td><td>${b.verbs.join(', ')}</td><td>${b.pjokExample}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div data-f4-section="Bagian 2: Tabel KKO Taksonomi SOLO (Structure of Observed Learning Outcomes)">
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">II. TABEL KEDALAMAN PEMAHAMAN TAKSONOMI SOLO (BIGGS &amp; COLLIS)</h3>
    <table>
      <thead><tr><th style="width:120px;">Tingkatan SOLO</th><th style="width:170px;">Deskripsi Struktur Respon</th><th>Indikator Kata Kerja</th><th style="width:190px;">Contoh Kontekstual PJOK</th></tr></thead>
      <tbody>
        ${soloKkoData.map(s => `<tr><td style="text-align:center; font-weight:bold;">${s.name}</td><td>${s.definition}</td><td>${s.verbs.join(', ')}</td><td>${s.pjokExample}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</body></html>`;
                printHtmlDocument(html, 'Tabel KKO Taksonomi Bloom & SOLO (F4)', 'portrait');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-xs transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Per Bagian (F4)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>Tabel KKO Taksonomi Bloom & SOLO (F4)</title>
<style>
  @page { size: 215mm 330mm; margin: 15mm 18mm; }
  body { font-family: 'Times New Roman', serif; font-size: 10.5pt; color: #000; line-height: 1.4; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14pt; }
  th, td { border: 1px solid #000; padding: 5pt 7pt; vertical-align: top; }
  th { background-color: #ecfdf5; font-weight: bold; text-align: center; }
</style></head>
<body>
  <div data-f4-kop="true" style="text-align:center; border-bottom:3px double #000; padding-bottom:8pt; margin-bottom:12pt;">
    <h2 style="margin:0; font-size:14pt; text-transform:uppercase;">PEDOMAN KATA KERJA OPERASIONAL (KKO) KURIKULUM MERDEKA</h2>
    <p style="margin:3pt 0 0 0; font-size:10.5pt; font-weight:bold;">Klasifikasi Kognitif Taksonomi Bloom (C1–C6) &amp; Kedalaman Respon Taksonomi SOLO</p>
  </div>
  <div data-f4-section="Bagian 1: Tabel KKO Taksonomi Bloom Revisi (C1 - C6)">
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">I. TABEL KKO TAKSONOMI BLOOM REVISI (ANDERSON &amp; KRATHWOHL)</h3>
    <table>
      <thead><tr><th style="width:90px;">Level</th><th style="width:160px;">Definisi Kognitif</th><th>Daftar Kata Kerja Operasional (KKO)</th><th style="width:190px;">Contoh Penerapan TP PJOK</th></tr></thead>
      <tbody>
        ${bloomKkoData.map(b => `<tr><td style="text-align:center; font-weight:bold;">${b.level}<br/><span style="font-size:9pt; font-weight:normal;">${b.name}</span></td><td>${b.definition}</td><td>${b.verbs.join(', ')}</td><td>${b.pjokExample}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div data-f4-section="Bagian 2: Tabel KKO Taksonomi SOLO (Structure of Observed Learning Outcomes)">
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">II. TABEL KEDALAMAN PEMAHAMAN TAKSONOMI SOLO (BIGGS &amp; COLLIS)</h3>
    <table>
      <thead><tr><th style="width:120px;">Tingkatan SOLO</th><th style="width:170px;">Deskripsi Struktur Respon</th><th>Indikator Kata Kerja</th><th style="width:190px;">Contoh Kontekstual PJOK</th></tr></thead>
      <tbody>
        ${soloKkoData.map(s => `<tr><td style="text-align:center; font-weight:bold;">${s.name}</td><td>${s.definition}</td><td>${s.verbs.join(', ')}</td><td>${s.pjokExample}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</body></html>`;
                downloadHtmlAsPdf(html, 'Tabel_KKO_Taksonomi_Bloom_SOLO_F4.pdf', 'portrait');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Per Bagian (F4)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>Tabel KKO Taksonomi Bloom & SOLO (F4)</title>
<style>
  @page { size: 215mm 330mm; margin: 15mm 18mm; }
  body { font-family: 'Times New Roman', serif; font-size: 10.5pt; color: #000; line-height: 1.4; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14pt; }
  th, td { border: 1px solid #000; padding: 5pt 7pt; vertical-align: top; }
  th { background-color: #ecfdf5; font-weight: bold; text-align: center; }
</style></head>
<body>
  <div data-f4-kop="true" style="text-align:center; border-bottom:3px double #000; padding-bottom:8pt; margin-bottom:12pt;">
    <h2 style="margin:0; font-size:14pt; text-transform:uppercase;">PEDOMAN KATA KERJA OPERASIONAL (KKO) KURIKULUM MERDEKA</h2>
    <p style="margin:3pt 0 0 0; font-size:10.5pt; font-weight:bold;">Klasifikasi Kognitif Taksonomi Bloom (C1–C6) &amp; Kedalaman Respon Taksonomi SOLO</p>
  </div>
  <div data-f4-section="Bagian 1: Tabel KKO Taksonomi Bloom Revisi (C1 - C6)">
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">I. TABEL KKO TAKSONOMI BLOOM REVISI (ANDERSON &amp; KRATHWOHL)</h3>
    <table>
      <thead><tr><th style="width:90px;">Level</th><th style="width:160px;">Definisi Kognitif</th><th>Daftar Kata Kerja Operasional (KKO)</th><th style="width:190px;">Contoh Penerapan TP PJOK</th></tr></thead>
      <tbody>
        ${bloomKkoData.map(b => `<tr><td style="text-align:center; font-weight:bold;">${b.level}<br/><span style="font-size:9pt; font-weight:normal;">${b.name}</span></td><td>${b.definition}</td><td>${b.verbs.join(', ')}</td><td>${b.pjokExample}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div data-f4-section="Bagian 2: Tabel KKO Taksonomi SOLO (Structure of Observed Learning Outcomes)">
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">II. TABEL KEDALAMAN PEMAHAMAN TAKSONOMI SOLO (BIGGS &amp; COLLIS)</h3>
    <table>
      <thead><tr><th style="width:120px;">Tingkatan SOLO</th><th style="width:170px;">Deskripsi Struktur Respon</th><th>Indikator Kata Kerja</th><th style="width:190px;">Contoh Kontekstual PJOK</th></tr></thead>
      <tbody>
        ${soloKkoData.map(s => `<tr><td style="text-align:center; font-weight:bold;">${s.name}</td><td>${s.definition}</td><td>${s.verbs.join(', ')}</td><td>${s.pjokExample}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</body></html>`;
                downloadDocFile('Tabel_KKO_Taksonomi_Bloom_SOLO_F4.doc', html, 'portrait');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-xs"
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>Unduh Word (F4)</span>
            </button>
            <ExportJsonPromptAiButtons
              onExportJson={() => {
                const filename = `Tabel_KKO_Taksonomi_Bloom_SOLO.json`;
                downloadJsonFile(filename, {
                  taksonomiBloom: bloomKkoData,
                  taksonomiSolo: soloKkoData,
                  analisisTerakhir: analysisResult
                });
              }}
              onOpenPromptAi={() => setShowPromptModal(true)}
            />
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-slate-200 pb-4 mb-6 no-print">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('bloom')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'bloom' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            Taksonomi Bloom (C1 - C6)
          </button>
          <button
            onClick={() => setActiveTab('solo')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'solo' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Taksonomi SOLO
          </button>
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'analyzer' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600 animate-bounce" />
            AI TP Analyzer
          </button>
        </div>

        {/* Global Search across standard taxonomies */}
        {activeTab !== 'analyzer' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Kata Kerja (KKO) / Level..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>
        )}
      </div>

      {/* TAB 1: BLOOM TAXONOMY TAB */}
      {activeTab === 'bloom' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 leading-relaxed flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Taksonomi Bloom (Revisi Lorin Anderson &amp; David Krathwohl):</strong> Mengklasifikasikan proses kognitif ke dalam 6 tingkatan yang progresif dari berpikir tingkat rendah (LOTS) ke berpikir tingkat tinggi (HOTS). Guru menggunakan kata kerja operasional (KKO) di bawah ini untuk merumuskan indikator dan tujuan pembelajaran yang spesifik, terukur, dan berorientasi pada pencapaian murid.
            </div>
          </div>

          {filteredBloom.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-500 text-xs">
              Tidak ada Kata Kerja Operasional (KKO) yang cocok dengan pencarian "<strong>{searchTerm}</strong>".
            </div>
          ) : (
            <div className="space-y-6">
              {filteredBloom.map((item) => (
                <div key={item.level} className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden">
                  {/* Card Header */}
                  <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-emerald-600 text-white font-mono font-black text-xs rounded-lg">
                        {item.level}
                      </span>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                        {item.name}
                      </h3>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      item.level === 'C1' || item.level === 'C2' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : item.level === 'C3'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {item.level === 'C1' || item.level === 'C2' ? 'LOTS' : item.level === 'C3' ? 'MOTS' : 'HOTS'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Definisi Tingkatan</h4>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                        {item.definition}
                      </p>
                    </div>

                    {/* KKO Verbs List */}
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                        Daftar Kata Kerja Operasional (KKO) Utama
                      </h4>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(item as any).highlightedVerbs ? (
                          (item as any).highlightedVerbs.map((verb: string, idx: number) => (
                            <span 
                              key={idx} 
                              className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                            >
                              {verb}
                            </span>
                          ))
                        ) : (
                          item.verbs.map((verb, idx) => (
                            <span 
                              key={idx} 
                              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200/60 text-slate-700 rounded-lg text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-colors"
                            >
                              {verb}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Pedagogical Examples Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-sky-50/40 border border-sky-100 rounded-xl p-4 space-y-1.5">
                        <span className="text-[9px] uppercase font-black text-sky-800 tracking-wider flex items-center gap-1">
                          <Activity className="w-3 h-3 text-sky-600 animate-pulse" />
                          Contoh PJOK SD (Fisik &amp; Kebugaran)
                        </span>
                        <p className="text-xs text-slate-750 font-medium leading-relaxed">
                          {item.pjokExample}
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                        <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          Contoh Umum Kelas SD
                        </span>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {item.generalExample}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SOLO TAXONOMY TAB */}
      {activeTab === 'solo' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 leading-relaxed flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Taksonomi SOLO (Structure of Observed Learning Outcomes):</strong> Merupakan taksonomi yang berfokus pada evaluasi <strong>kualitas respons</strong> belajar siswa terhadap suatu tugas atau konsep. Berbeda dengan Bloom yang berfokus pada proses berpikir internal guru, SOLO menilai perkembangan kompleksitas pemahaman siswa secara konkret dari tidak mengerti (Prestructural) hingga tingkat abstrak tinggi (Extended Abstract).
            </div>
          </div>

          {filteredSolo.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-500 text-xs">
              Tidak ada tingkat SOLO yang cocok dengan pencarian "<strong>{searchTerm}</strong>".
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSolo.map((item) => (
                <div key={item.level} className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-base sm:text-lg">{item.symbol}</span>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                        {item.name}
                      </h3>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-400">
                      Tingkat {item.level}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Karakteristik &amp; Kedalaman Berpikir</h4>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                        {item.definition}
                      </p>
                    </div>

                    {/* Verbs */}
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                        KKO yang Biasa Muncul
                      </h4>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.verbs.map((verb, idx) => (
                          <span 
                            key={idx} 
                            className="px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-900 rounded-lg text-xs font-semibold"
                          >
                            {verb}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Pedagogical Examples Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 space-y-1.5">
                        <span className="text-[9px] uppercase font-black text-emerald-800 tracking-wider flex items-center gap-1">
                          <Activity className="w-3 h-3 text-emerald-600" />
                          Implementasi PJOK SD
                        </span>
                        <p className="text-xs text-slate-750 font-medium leading-relaxed">
                          {item.pjokExample}
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                        <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          Penerapan Umum Kelas SD
                        </span>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {item.generalExample}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI ANALYZER TAB */}
      {activeTab === 'analyzer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Form Input */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-emerald-600" />
                Input Draf Tujuan Pembelajaran
              </h3>

              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Draf / Gagasan Tujuan Pembelajaran Guru <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={draftTp}
                    onChange={(e) => setDraftTp(e.target.value)}
                    rows={4}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed"
                    placeholder="Contoh: Siswa bisa mempraktikkan cara melakukan smash bulu tangkis yang keras dan benar"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    Tulis ide kasar tujuan pembelajaran Anda. AI akan merombak dan memetakannya ke level taksonomi Bloom dan SOLO yang formal.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kelas SD</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>Kelas {n} SD</option>
                      ))}
                    </select>
                  </div>
                </div>

                {apiError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2.5 rounded-lg text-xs">
                    ⚠️ <strong>Kesalahan:</strong> {apiError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Menganalisis KKO &amp; Taksonomi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analisis &amp; Petakan Sekarang</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Output Panel */}
          <div className="lg:col-span-7 space-y-6">
            {isAnalyzing ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[350px]">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Menelaah Kedalaman KKO...</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                  Gemini sedang mengidentifikasi kata kerja, membandingkan dengan kriteria C1-C6 Anderson, mengestimasi kedalaman respons SOLO, serta memformulasikan rekomendasi TP terbaik untuk Anda.
                </p>
              </div>
            ) : analysisResult ? (
              <div className="space-y-6">
                
                {/* Taxonomy Mapping Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bloom Map card */}
                  <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-5 space-y-2">
                    <span className="text-[10px] uppercase font-black text-emerald-800 tracking-wider block">TAKSONOMI BLOOM</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-extrabold text-emerald-900 font-mono">
                        {analysisResult.bloomAnalysis.level}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {analysisResult.bloomAnalysis.verba}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {analysisResult.bloomAnalysis.description}
                    </p>
                  </div>

                  {/* SOLO Map Card */}
                  <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-5 space-y-2">
                    <span className="text-[10px] uppercase font-black text-blue-800 tracking-wider block">TAKSONOMI SOLO</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-extrabold text-blue-900">
                        {analysisResult.soloAnalysis.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {analysisResult.soloAnalysis.description}
                    </p>
                  </div>
                </div>

                {/* Strength and Recommendation */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-6 space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Review &amp; Evaluasi Pedagogis
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <strong className="text-slate-800 font-bold">Kelebihan / Kekuatan TP:</strong>
                      <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                        {analysisResult.bloomAnalysis.strength}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-slate-800 font-bold">Rekomendasi Perbaikan:</strong>
                      <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                        {analysisResult.bloomAnalysis.recommendation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progressive Suggested Alternatives */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Rekomendasi Formulasi TP Alternatif (Progresif)
                  </h4>

                  <div className="space-y-3">
                    {analysisResult.suggestedObjectives.map((item: any, idx: number) => {
                      const isBestOption = idx === 3;
                      return (
                        <div 
                          key={idx} 
                          className={`rounded-xl p-5 border transition-all ${
                            isBestOption 
                              ? 'bg-emerald-50/50 border-2 border-emerald-400 shadow-md relative' 
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          {isBestOption && (
                            <span className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-600 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-md flex items-center gap-1 shadow-xs">
                              <CheckCircle2 className="w-3 h-3" /> Rekomendasi Utama
                            </span>
                          )}

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center font-mono ${
                                isBestOption ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                                {item.level} &bull; <span className="text-slate-600">{item.taxonomyLevel}</span>
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm font-extrabold text-slate-800 leading-relaxed">
                              "{item.text}"
                            </p>

                            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                              <span>KKO: <strong className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{item.kko}</strong></span>
                            </div>

                            <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-200/50 text-xs">
                              <strong className="text-slate-700 font-bold block mb-1">Usulan KKTP Operasional:</strong>
                              <p className="text-slate-600 leading-normal font-medium">{item.kktpSuggested}</p>
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => handleCopyOption(item.text, idx)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition-colors border border-slate-200 cursor-pointer"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Salin TP</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[350px]">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <HelpCircle className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Belum Ada Hasil Analisis</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                  Masukkan draf tujuan pembelajaran guru di formulir kiri dan klik tombol analisis untuk memetakan level kognitif secara otomatis.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Taksonomi KKO & Analisis Level TP"
        subtitle="Rekomendasi Kata Kerja Operasional Bloom (C1-C6) & SOLO Taxonomy PJOK"
        tabs={getKodeEtikKkoCetakPrompts("Taksonomi KKO Bloom dan SOLO")}
        defaultActiveTab="prompt_menu"
        jsonData={{
          taksonomiBloom: bloomKkoData,
          taksonomiSolo: soloKkoData,
          drafTp: draftTp,
          analisisTerakhir: analysisResult
        }}
        jsonFilename="Tabel_KKO_Taksonomi_Bloom_SOLO.json"
      />
    </div>
  );
}
