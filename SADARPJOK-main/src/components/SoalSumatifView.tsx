import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Download, 
  Printer, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  BrainCircuit,
  Eye,
  EyeOff,
  Copy,
  Check,
  FileText,
  FileSignature,
  Layers,
  GraduationCap,
  Calendar,
  School,
  ClipboardList,
  ChevronRight,
  Bookmark,
  ChevronLeft,
  SlidersHorizontal,
  Table,
  ListOrdered,
  Filter,
  Settings2,
  Plus,
  Trash2,
  Shuffle,
  RotateCw,
  ExternalLink,
  FileJson,
  Bot,
  X,
  Code2
} from 'lucide-react';
import { downloadDocFile, downloadJsonFile, copyAndOpenGoogleDocs } from '../lib/exportUtils';
import { generateSummativeAssessment } from '../utils/summativeGenerator';
import { downloadElementAsPdf, downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';

export interface PernyataanKompleksItem {
  pernyataan: string;
  jawabanBenar: string | boolean;
}

export interface MenjodohkanPairItem {
  premis: string;
  pasangan: string;
}

export type BentukSoalKey = 'pilihan_ganda' | 'pg_kompleks' | 'menjodohkan' | 'isian' | 'uraian';
export type BentukSoalType = BentukSoalKey | 'campuran' | string;

export interface BentukSoalOptionConfig {
  id: BentukSoalKey;
  label: string;
  name: string;
  shortLabel: string;
  activeBorder: string;
  activeBg: string;
  activeText: string;
  badgeClass: string;
  description: string;
}

export const BENTUK_SOAL_OPTIONS: BentukSoalOptionConfig[] = [
  {
    id: 'pilihan_ganda',
    label: '1. Pilihan Ganda (PG Tunggal)',
    name: 'Pilihan Ganda',
    shortLabel: 'PG Tunggal',
    activeBorder: 'border-teal-500',
    activeBg: 'bg-teal-50/80',
    activeText: 'text-teal-900',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
    description: '1 opsi benar dengan pilihan A, B, C (atau D/E) dan kunci pasti'
  },
  {
    id: 'pg_kompleks',
    label: '2. Pilihan Ganda Kompleks (PGK)',
    name: 'Pilihan Ganda Kompleks',
    shortLabel: 'PG Kompleks',
    activeBorder: 'border-sky-500',
    activeBg: 'bg-sky-50/80',
    activeText: 'text-sky-900',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    description: 'Stimulus multi-pernyataan dengan evaluasi Benar (B) atau Salah (S)'
  },
  {
    id: 'menjodohkan',
    label: '3. Menjodohkan (Matching)',
    name: 'Menjodohkan',
    shortLabel: 'Menjodohkan',
    activeBorder: 'border-amber-500',
    activeBg: 'bg-amber-50/80',
    activeText: 'text-amber-900',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Mencocokkan premis gerak Kolom A dengan jawaban di Kolom B'
  },
  {
    id: 'isian',
    label: '4. Isian Singkat',
    name: 'Isian Singkat',
    shortLabel: 'Isian Singkat',
    activeBorder: 'border-purple-500',
    activeBg: 'bg-purple-50/80',
    activeText: 'text-purple-900',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Pertanyaan terarah dijawab istilah atau kata kunci esensial gerak'
  },
  {
    id: 'uraian',
    label: '5. Uraian / Esai Penalaran',
    name: 'Uraian',
    shortLabel: 'Uraian / Esai',
    activeBorder: 'border-rose-500',
    activeBg: 'bg-rose-50/80',
    activeText: 'text-rose-900',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    description: 'Penalaran terbuka & analisis disertai rubrik penskoran berjenjang (1-5)'
  }
];

export interface Question {
  noSoal: number;
  bentukSoal: string;
  levelKognitif: string;
  lingkupMateri?: string;
  capaianPembelajaran: string;
  indikatorSoal: string;
  question: string;
  options?: string[];
  pernyataanKompleks?: PernyataanKompleksItem[];
  menjodohkanPairs?: MenjodohkanPairItem[];
  correctAnswer: string;
  explanation: string;
  pedomanPenskoran: string;
  bobotSkor?: number;
  dimensiP3?: string;
}

interface SumatifResult {
  judulUjian: string;
  kop: {
    dinasPendidikan: string;
    namaSekolah: string;
    mataPelajaran: string;
    kelas: string;
    semester: string;
    tahunPelajaran: string;
    lingkupMateriList?: string[];
    lingkupMateri?: string;
    bentukSoalList?: string[];
    bentukSoal?: string;
    bentukSoalSummary?: string;
    bentukSoalDistribution?: { name: string; count: number }[];
    totalSoal?: number;
  };
  questions: Question[];
}

export const MATERI_PRESETS_BY_GRADE: Record<string, string[]> = {
  '1': [
    'Pola Gerak Dasar Lokomotor (Jalan & Lari Santai)',
    'Pola Gerak Dasar Non-Lokomotor (Memutar & Mengayun Lengan)',
    'Pola Gerak Dasar Manipulatif (Melempar & Menangkap Bola Lunak)',
    'Pengenalan Kebersihan Anggota Tubuh & Pakaian Olahraga',
    'Aktivitas Keseimbangan Berdiri & Senam Lantai Sederhana'
  ],
  '2': [
    'Kombinasi Gerak Lokomotor Melompat dan Meloncat',
    'Gerak Non-Lokomotor Meliuk dan Meregangkan Otot',
    'Senam Ketangkasan Meniti Balok Keseimbangan & Berguling',
    'Pengenalan Air dan Keselamatan di Kolam Dangkal',
    'Membiasakan Cuci Tangan Pakai Sabun & Kebersihan Lingkungan'
  ],
  '3': [
    'Kombinasi Berlari Cepat, Melompat, dan Mendarat Aman',
    'Permainan Tradisional Lapangan (Gobak Sodor & Bentengan)',
    'Gerak Manipulatif Melempar, Menangkap, & Memukul Bola Kasti',
    'Kebugaran Jasmani: Daya Tahan Otot Kaki dan Kelenturan Sendi',
    'Pola Makan Bergizi Seimbang: Isi Piringku & Jajanan Sehat'
  ],
  '4': [
    'Permainan Bola Besar: Sepak Bola (Menendang & Menggiring Bola)',
    'Permainan Bola Kecil: Kasti (Teknik Melempar, Memukul, & Menangkap)',
    'Aktivitas Atletik: Lari Jarak Pendek (Sprint) & Lompat Jauh Gaya Jongkok',
    'Seni Beladiri Pencak Silat: Kuda-kuda, Sikap Pasang, & Pukulan Lurus',
    'Kebugaran Jasmani: Latihan Push-up, Sit-up, & Kelincahan Shuttle Run',
    'Pencegahan Penyakit Menular & Pemeliharaan Kebersihan Diri'
  ],
  '5': [
    'Permainan Bola Besar: Bola Voli (Variasi Passing Bawah & Servis Bawah)',
    'Permainan Bola Kecil: Rounders (Teknik Melempar & Mengetik Lawan)',
    'Senam Lantai: Rangkaian Guling Depan, Guling Belakang, & Sikap Lilin',
    'Aktivitas Air: Renang Gaya Dada (Gerakan Kaki & Pengambilan Napas)',
    'Bahaya Merokok, Miras, dan Obat Terlarang (NAPZA) bagi Organ Tubuh',
    'Pemeliharaan Kebersihan Alat Reproduksi Remaja Awal'
  ],
  '6': [
    'Permainan Bola Besar: Bola Basket (Chest Pass, Bounce Pass, & Dribbling)',
    'Aktivitas Atletik: Variasi Lari Estafet (Sambung Tongkat) & Jalan Cepat',
    'Senam Irama / Ritmik: Langkah Kaki Berirama & Ayunan Lengan',
    'Aktivitas Air: Renang Gaya Bebas & Penyelamatan Diri di Air',
    'Kebugaran Jasmani: Pengukuran Daya Tahan Jantung-Paru (Lari 1.000m)',
    'Menjaga Kesehatan Reproduksi dan Menghadapi Masa Pubertas'
  ]
};

export default function SoalSumatifView() {
  const [jenisUjian, setJenisUjian] = useState('Asesmen Sumatif Akhir Semester (SAS)');
  const [mataPelajaran, setMataPelajaran] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan');
  const [grade, setGrade] = useState('4');
  const [semester, setSemester] = useState('Ganjil');
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  
  // Multi-Topic / Lingkup Materi Support
  const [materiList, setMateriList] = useState<string[]>([
    'Permainan Bola Besar: Sepak Bola (Menendang & Menggiring Bola)'
  ]);
  const babMateri = materiList.filter(Boolean).join('; ');

  const handleAddMateriSlot = (presetText?: string) => {
    if (materiList.length < 5) {
      setMateriList(prev => [...prev, presetText || '']);
    }
  };

  const handleRemoveMateriSlot = (idx: number) => {
    if (materiList.length > 1) {
      setMateriList(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleUpdateMateriSlot = (idx: number, val: string) => {
    setMateriList(prev => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleTogglePresetMateri = (preset: string) => {
    const pTrim = preset.trim().toLowerCase();
    const existingIdx = materiList.findIndex(m => m.trim().toLowerCase() === pTrim);
    if (existingIdx !== -1) {
      if (materiList.length > 1) {
        handleRemoveMateriSlot(existingIdx);
      }
    } else {
      if (materiList.length === 1 && materiList[0].trim() === '') {
        setMateriList([preset]);
      } else if (materiList.length < 5) {
        setMateriList(prev => [...prev, preset]);
      }
    }
  };

  const [selectedBentukSoal, setSelectedBentukSoal] = useState<BentukSoalKey[]>([
    'pilihan_ganda'
  ]);

  const [bentukSoalCounts, setBentukSoalCounts] = useState<Record<BentukSoalKey, number>>({
    pilihan_ganda: 5,
    pg_kompleks: 2,
    menjodohkan: 2,
    isian: 2,
    uraian: 2
  });

  const totalCalculatedSoal = selectedBentukSoal.reduce((sum, key) => sum + (bentukSoalCounts[key] || 1), 0);

  const handleUpdateShapeCount = (id: BentukSoalKey, newCount: number) => {
    const valid = Math.max(1, Math.min(25, newCount));
    setBentukSoalCounts(prev => ({
      ...prev,
      [id]: valid
    }));
    if (!selectedBentukSoal.includes(id)) {
      const order: BentukSoalKey[] = ['pilihan_ganda', 'pg_kompleks', 'menjodohkan', 'isian', 'uraian'];
      const next = [...selectedBentukSoal, id];
      setSelectedBentukSoal(order.filter(k => next.includes(k)));
    }
  };

  const handleToggleBentukSoal = (id: BentukSoalKey) => {
    setSelectedBentukSoal(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Minimal 1 bentuk soal harus aktif
        return prev.filter(item => item !== id);
      } else {
        const order: BentukSoalKey[] = ['pilihan_ganda', 'pg_kompleks', 'menjodohkan', 'isian', 'uraian'];
        const next = [...prev, id];
        setBentukSoalCounts(c => ({
          ...c,
          [id]: c[id] && c[id] > 0 ? c[id] : (id === 'pilihan_ganda' ? 5 : 2)
        }));
        return order.filter(k => next.includes(k));
      }
    });
  };

  const handleSelectPresetBentuk = (preset: 'all' | 'pg_uraian' | 'pg_isian_uraian' | 'pg_only' | 'pg_pgk') => {
    if (preset === 'all') {
      setSelectedBentukSoal(['pilihan_ganda', 'pg_kompleks', 'menjodohkan', 'isian', 'uraian']);
      setBentukSoalCounts({
        pilihan_ganda: 5,
        pg_kompleks: 2,
        menjodohkan: 2,
        isian: 3,
        uraian: 2
      });
    } else if (preset === 'pg_uraian') {
      setSelectedBentukSoal(['pilihan_ganda', 'uraian']);
      setBentukSoalCounts(prev => ({
        ...prev,
        pilihan_ganda: 8,
        uraian: 2
      }));
    } else if (preset === 'pg_isian_uraian') {
      setSelectedBentukSoal(['pilihan_ganda', 'isian', 'uraian']);
      setBentukSoalCounts(prev => ({
        ...prev,
        pilihan_ganda: 5,
        isian: 3,
        uraian: 2
      }));
    } else if (preset === 'pg_pgk') {
      setSelectedBentukSoal(['pilihan_ganda', 'pg_kompleks']);
      setBentukSoalCounts(prev => ({
        ...prev,
        pilihan_ganda: 6,
        pg_kompleks: 4
      }));
    } else {
      setSelectedBentukSoal(['pilihan_ganda']);
      setBentukSoalCounts(prev => ({
        ...prev,
        pilihan_ganda: 5
      }));
    }
  };

  const applyQuickTotalPreset = (targetTotal: number) => {
    const activeKeys = selectedBentukSoal;
    if (activeKeys.length === 0) return;

    if (activeKeys.length === 1) {
      setBentukSoalCounts(prev => ({
        ...prev,
        [activeKeys[0]]: targetTotal
      }));
      return;
    }

    const newCounts = { ...bentukSoalCounts };
    if (activeKeys.includes('pilihan_ganda')) {
      const otherKeys = activeKeys.filter(k => k !== 'pilihan_ganda');
      const pgCount = Math.max(1, Math.round(targetTotal * 0.55));
      let rem = targetTotal - pgCount;
      newCounts['pilihan_ganda'] = pgCount;

      const baseEach = Math.max(1, Math.floor(rem / otherKeys.length));
      let extra = rem - (baseEach * otherKeys.length);
      for (const k of otherKeys) {
        newCounts[k] = Math.max(1, baseEach + (extra > 0 ? 1 : 0));
        if (extra > 0) extra--;
      }
    } else {
      const baseEach = Math.max(1, Math.floor(targetTotal / activeKeys.length));
      let extra = targetTotal % activeKeys.length;
      for (const k of activeKeys) {
        newCounts[k] = Math.max(1, baseEach + (extra > 0 ? 1 : 0));
        if (extra > 0) extra--;
      }
    }
    setBentukSoalCounts(newCounts);
  };

  const getBentukSoalName = (key: BentukSoalKey): string => {
    if (key === 'pg_kompleks') return 'Pilihan Ganda Kompleks';
    if (key === 'menjodohkan') return 'Menjodohkan';
    if (key === 'isian') return 'Isian Singkat';
    if (key === 'uraian') return 'Uraian';
    return 'Pilihan Ganda';
  };

  const bentukSoal: BentukSoalType = selectedBentukSoal.length === 1 
    ? selectedBentukSoal[0] 
    : (selectedBentukSoal.length === 5 ? 'campuran' : selectedBentukSoal.join('_'));

  const [levelKognitif, setLevelKognitif] = useState<'lots' | 'mots' | 'hots' | 'campuran'>('campuran');
  const [totalSoal, setTotalSoal] = useState('5');
  const [namaSekolah, setNamaSekolah] = useState(() => {
    return localStorage.getItem('sadar_nama_sekolah') || 'SD Negeri Kalimantong';
  });
  const [dinasPendidikan, setDinasPendidikan] = useState('Dinas Pendidikan Pemuda Dan Olahraga');

  // Complete Option Configurations
  const [jumlahOpsiPG, setJumlahOpsiPG] = useState<'3' | '4' | '5'>('4');
  const [skalaPenskoran, setSkalaPenskoran] = useState<'standar' | 'rata' | 'persen'>('standar');
  const [modelStimulus, setModelStimulus] = useState<'kontekstual' | 'studi_kasus' | 'gambar_observasi' | 'tradisional'>('kontekstual');
  const [dimensiP3, setDimensiP3] = useState<'terpadu' | 'gotong_royong' | 'mandiri' | 'bernalar_kritis' | 'kreatif'>('terpadu');
  const [showBobotOnNaskah, setShowBobotOnNaskah] = useState(true);
  const [showPetunjukUmum, setShowPetunjukUmum] = useState(true);
  const [showTandaTangan, setShowTandaTangan] = useState(true);
  const [filterBentukSoal, setFilterBentukSoal] = useState<string>('all');
  const [viewAllCards, setViewAllCards] = useState<boolean>(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<SumatifResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Tab within the result view
  const [resultTab, setResultTab] = useState<'naskah' | 'kunci' | 'kartu' | 'kisi' | 'ljs'>('naskah');
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [shuffleNotice, setShuffleNotice] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isCopyingGoogleDoc, setIsCopyingGoogleDoc] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptMode, setPromptMode] = useState<'generator' | 'reviewer' | 'variasi'>('generator');
  const [isPromptCopied, setIsPromptCopied] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);
  const printableContentRef = useRef<HTMLDivElement>(null);

  const handleSchoolChange = (val: string) => {
    setNamaSekolah(val);
    try {
      localStorage.setItem('sadar_nama_sekolah', val);
    } catch {}
  };

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    const presets = MATERI_PRESETS_BY_GRADE[newGrade];
    if (presets && presets.length > 0) {
      if (materiList.length <= 1) {
        setMateriList([presets[0]]);
      }
    }
  };

  useEffect(() => {
    if (!result) {
      handleGenerate();
    }
  }, []);

  const handleGenerate = async (e?: React.FormEvent, isShuffle = false) => {
    if (e) e.preventDefault();
    const cleanMateriList = materiList.map(m => m.trim()).filter(Boolean);
    const effectiveMateriList = cleanMateriList.length > 0 ? cleanMateriList : ['Permainan Bola Besar: Sepak Bola (Menendang & Menggiring Bola)'];
    const effectiveMateri = effectiveMateriList.join('; ');
    const selectedShapeNames = selectedBentukSoal.map(getBentukSoalName);

    const distributionList = selectedBentukSoal.map(key => ({
      key,
      name: getBentukSoalName(key),
      count: Math.max(1, Math.min(25, bentukSoalCounts[key] || 1))
    }));
    const totalCount = distributionList.reduce((acc, curr) => acc + curr.count, 0);
    const shapeSummary = distributionList.map(d => `${d.name}: ${d.count} soal`).join(' • ');

    const currentSeed = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    setIsGenerating(true);
    setApiError(null);
    setShuffleNotice(null);
    setActiveCardIdx(0);

    try {
      const response = await fetch('/api/generate-soal-sumatif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenisUjian,
          mataPelajaran,
          grade,
          semester,
          tahunPelajaran,
          babMateri: effectiveMateri,
          babMateriList: effectiveMateriList,
          bentukSoal,
          bentukSoalList: selectedShapeNames,
          bentukSoalCounts: distributionList.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.count }), {}),
          bentukSoalDistribution: distributionList.map(d => ({ name: d.name, count: d.count })),
          levelKognitif,
          totalSoal: String(totalCount),
          namaSekolah,
          dinasPendidikan,
          jumlahOpsiPG,
          skalaPenskoran,
          modelStimulus,
          dimensiP3,
          seed: currentSeed
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Terjadi kesalahan saat menyusun soal sumatif.');
      }

      const data = await response.json();

      // Ensure every question has 100% complete attributes
      const rawQuestions = Array.isArray(data.questions) ? data.questions : [];
      const count = totalCount || rawQuestions.length || 5;

      const normalizedQuestions: Question[] = rawQuestions.map((q: any, idx: number) => {
        let bSoal = q.bentukSoal;
        if (!bSoal || !selectedShapeNames.some(s => s.toLowerCase() === String(bSoal).toLowerCase())) {
          bSoal = selectedShapeNames[idx % selectedShapeNames.length] || 'Pilihan Ganda';
        }

        let bobot = q.bobotSkor;
        if (!bobot) {
          if (skalaPenskoran === 'rata') bobot = 10;
          else if (skalaPenskoran === 'persen') bobot = Math.max(1, Math.round(100 / count));
          else {
            if (bSoal === 'Pilihan Ganda') bobot = 1;
            else if (bSoal === 'Pilihan Ganda Kompleks') bobot = 2;
            else if (bSoal === 'Menjodohkan') bobot = 2;
            else if (bSoal === 'Isian Singkat') bobot = 3;
            else if (bSoal === 'Uraian') bobot = 5;
            else bobot = 1;
          }
        }

        let opts = Array.isArray(q.options) ? [...q.options] : [];
        if (bSoal === 'Pilihan Ganda' && opts.length > 0) {
          if (jumlahOpsiPG === '3') opts = opts.slice(0, 3);
          else if (jumlahOpsiPG === '5' && opts.length === 4) opts.push('E. Semua jawaban di atas benar');
        }

        const qMateri = q.lingkupMateri || effectiveMateriList[idx % effectiveMateriList.length];

        return {
          noSoal: q.noSoal ?? (idx + 1),
          bentukSoal: bSoal,
          levelKognitif: q.levelKognitif || 'Level 2 (C3 - Menerapkan)',
          lingkupMateri: qMateri,
          capaianPembelajaran: q.capaianPembelajaran || `Peserta didik mampu menguasai keterampilan gerak ${qMateri} Kelas ${grade} SD.`,
          indikatorSoal: q.indikatorSoal || q.indikator || `Disajikan stimulus terkait ${qMateri}, peserta didik dapat menjawab dengan tepat.`,
          question: q.question || q.questionText || q.pertanyaan || '',
          options: opts,
          pernyataanKompleks: Array.isArray(q.pernyataanKompleks) && q.pernyataanKompleks.length > 0 ? q.pernyataanKompleks : undefined,
          menjodohkanPairs: Array.isArray(q.menjodohkanPairs) && q.menjodohkanPairs.length > 0 ? q.menjodohkanPairs : undefined,
          correctAnswer: q.correctAnswer || q.kunciJawaban || 'A',
          explanation: q.explanation || q.pembahasan || '',
          pedomanPenskoran: q.pedomanPenskoran || 'Skor disesuaikan dengan kriteria rubrik.',
          bobotSkor: bobot,
          dimensiP3: q.dimensiP3 || (dimensiP3 === 'gotong_royong' ? 'Gotong Royong' : dimensiP3 === 'mandiri' ? 'Mandiri' : dimensiP3 === 'bernalar_kritis' ? 'Bernalar Kritis' : 'Terpadu P3')
        };
      });

      setResult({
        judulUjian: data.judulUjian || `${jenisUjian.toUpperCase()} - PJOK KELAS ${grade} SD`,
        kop: {
          dinasPendidikan: data.kop?.dinasPendidikan || dinasPendidikan,
          namaSekolah: data.kop?.namaSekolah || namaSekolah,
          mataPelajaran: data.kop?.mataPelajaran || mataPelajaran,
          kelas: data.kop?.kelas || grade,
          semester: data.kop?.semester || semester,
          tahunPelajaran: data.kop?.tahunPelajaran || tahunPelajaran,
          lingkupMateriList: data.kop?.lingkupMateriList || effectiveMateriList,
          lingkupMateri: data.kop?.lingkupMateri || effectiveMateri,
          bentukSoalList: data.kop?.bentukSoalList || selectedShapeNames,
          bentukSoal: data.kop?.bentukSoal || selectedShapeNames.join(', '),
          bentukSoalSummary: data.kop?.bentukSoalSummary || shapeSummary,
          bentukSoalDistribution: data.kop?.bentukSoalDistribution || distributionList.map(d => ({ name: d.name, count: d.count })),
          totalSoal: normalizedQuestions.length
        },
        questions: normalizedQuestions
      });

      if (isShuffle) {
        setShuffleNotice('Susunan soal baru berhasil diacak dan divariasikan tanpa duplikasi!');
        setTimeout(() => setShuffleNotice(null), 4000);
      }
    } catch (err: any) {
      console.warn('[Soal Sumatif] Error generating, using resilient fallback generator:', err);
      const cleanMateriList = materiList.map(m => m.trim()).filter(Boolean);
      const effectiveMateriList = cleanMateriList.length > 0 ? cleanMateriList : ['Permainan Bola Besar: Sepak Bola (Menendang & Menggiring Bola)'];
      const selectedShapeNames = selectedBentukSoal.map(getBentukSoalName);
      const distributionList = selectedBentukSoal.map(key => ({
        key,
        name: getBentukSoalName(key),
        count: Math.max(1, Math.min(25, bentukSoalCounts[key] || 1))
      }));
      const totalCount = distributionList.reduce((acc, curr) => acc + curr.count, 0);

      const generatedFallback = generateSummativeAssessment({
        jenisUjian,
        mataPelajaran,
        grade,
        semester,
        tahunPelajaran,
        namaSekolah,
        dinasPendidikan,
        babMateriList: effectiveMateriList,
        bentukSoalList: selectedShapeNames,
        bentukSoalDistribution: distributionList.map(d => ({ name: d.name, count: d.count })),
        bentukSoalCounts: distributionList.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.count }), {}),
        totalSoal: String(totalCount),
        jumlahOpsiPG,
        levelKognitif,
        dimensiP3,
        skalaPenskoran,
        seed: currentSeed
      });

      setResult(generatedFallback as any);

      if (isShuffle) {
        setShuffleNotice('Susunan variasi soal baru berhasil diacak dan disusun tanpa duplikasi!');
        setTimeout(() => setShuffleNotice(null), 4000);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getNaskahHtml = (): string => {
    if (!result) return '';

    const questionsHtml = result.questions.map((q, idx) => {
      let bodyHtml = '';

      if (q.bentukSoal === 'Pilihan Ganda Kompleks' || (q.pernyataanKompleks && q.pernyataanKompleks.length > 0)) {
        const pList = q.pernyataanKompleks || [
          { pernyataan: `Teknik dan sikap gerak pada ${babMateri} harus dilakukan dengan koordinasi yang seimbang dan aman.`, jawabanBenar: 'Benar' },
          { pernyataan: `Pemanasan tidak diperlukan saat memulai kegiatan pembelajaran fisik yang berintensitas tinggi.`, jawabanBenar: 'Salah' },
          { pernyataan: `Sportivitas, gotong royong, dan mematuhi tata tertib keselamatan wajib diterapkan oleh seluruh murid.`, jawabanBenar: 'Benar' }
        ];
        bodyHtml = `
          <div style="margin-left: 15px; margin-top: 6px; margin-bottom: 12px;">
            <p style="font-size: 8.5pt; font-style: italic; color: #334155; margin-bottom: 4px;">* Berikan tanda centang (&radic;) pada kolom Benar (B) jika pernyataan tepat atau Salah (S) jika pernyataan tidak tepat:</p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 9pt;">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="border: 1px solid #000; padding: 4px; text-align: center;" width="6%">No</th>
                  <th style="border: 1px solid #000; padding: 4px; text-align: left;" width="70%">Pernyataan / Aspek Gerak</th>
                  <th style="border: 1px solid #000; padding: 4px; text-align: center;" width="12%">Benar (B)</th>
                  <th style="border: 1px solid #000; padding: 4px; text-align: center;" width="12%">Salah (S)</th>
                </tr>
              </thead>
              <tbody>
                ${pList.map((p, pIdx) => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center;">${pIdx + 1}</td>
                    <td style="border: 1px solid #000; padding: 4px;">${p.pernyataan}</td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center;">[ &nbsp;&nbsp; ]</td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center;">[ &nbsp;&nbsp; ]</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else if (q.bentukSoal === 'Menjodohkan' || (q.menjodohkanPairs && q.menjodohkanPairs.length > 0)) {
        const pairs = q.menjodohkanPairs || [
          { premis: '1. Gerak Lokomotor', pasangan: 'A. Berpindah tempat (lari, lompat, jalan)' },
          { premis: '2. Gerak Non-Lokomotor', pasangan: 'B. Di tempat tanpa berpindah (meliuk, membungkuk)' },
          { premis: '3. Gerak Manipulatif', pasangan: 'C. Mengendalikan objek atau alat (bola, raket)' }
        ];
        bodyHtml = `
          <div style="margin-left: 15px; margin-top: 6px; margin-bottom: 12px;">
            <p style="font-size: 8.5pt; font-style: italic; color: #334155; margin-bottom: 4px;">* Pasangkanlah konsep pada Kolom A dengan keterangan yang sesuai pada Kolom B:</p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 9pt;">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="border: 1px solid #000; padding: 4px; text-align: left;" width="50%">Kolom A (Konsep / Gerak)</th>
                  <th style="border: 1px solid #000; padding: 4px; text-align: left;" width="50%">Kolom B (Keterangan / Fungsi)</th>
                </tr>
              </thead>
              <tbody>
                ${pairs.map((p) => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 5px;"><strong>${p.premis}</strong></td>
                    <td style="border: 1px solid #000; padding: 5px;">${p.pasangan}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top: 6px; font-size: 9pt;">
              <em>Lembar Isian Pasangan: ${pairs.map((_, pIdx) => `${pIdx + 1} &rarr; [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]`).join('&nbsp;&nbsp;&bull;&nbsp;&nbsp;')}</em>
            </div>
          </div>
        `;
      } else if (q.bentukSoal === 'Isian Singkat') {
        bodyHtml = `
          <div style="margin-left: 20px; margin-top: 8px; margin-bottom: 14px; font-size: 9.5pt;">
            <strong>Jawaban Singkat:</strong> ............................................................................................................................................
          </div>
        `;
      } else if (q.bentukSoal === 'Uraian') {
        bodyHtml = `
          <div style="margin-top: 10px; margin-left: 20px; margin-bottom: 15px;">
            <div style="border-bottom: 1px dotted #94a3b8; height: 18px; width: 95%;"></div>
            <div style="border-bottom: 1px dotted #94a3b8; height: 18px; width: 95%; margin-top: 6px;"></div>
            <div style="border-bottom: 1px dotted #94a3b8; height: 18px; width: 95%; margin-top: 6px;"></div>
          </div>
        `;
      } else if (q.options && q.options.length > 0) {
        bodyHtml = `
          <table style="width: 100%; border-collapse: collapse; border: none; margin-left: 20px; margin-top: 5px; margin-bottom: 10px;">
            <tr>
              <td style="border: none; padding: 2px 5px;" width="50%">${q.options[0] || ''}</td>
              <td style="border: none; padding: 2px 5px;" width="50%">${q.options[1] || ''}</td>
            </tr>
            <tr>
              <td style="border: none; padding: 2px 5px;">${q.options[2] || ''}</td>
              <td style="border: none; padding: 2px 5px;">${q.options[3] || ''}</td>
            </tr>
          </table>
        `;
      } else {
        bodyHtml = `
          <div style="margin-top: 20px; border-bottom: 1px dotted #cbd5e1; width: 95%; margin-left: 20px; margin-bottom: 15px;"></div>
        `;
      }

      return `
        <div style="margin-bottom: 15pt; line-height: 1.5;">
          <table style="width: 100%; border-collapse: collapse; border: none; margin: 0;">
            <tr>
              <td style="border: none; padding: 2px; font-weight: bold;" width="4%" valign="top">${idx + 1}.</td>
              <td style="border: none; padding: 2px; font-weight: normal;" width="96%">
                <span style="display: inline-block; background-color: #f1f5f9; color: #0369a1; font-weight: bold; font-size: 8pt; padding: 1px 6px; border: 1px solid #bae6fd; border-radius: 3px; margin-right: 4px;">
                  ${q.bentukSoal}
                </span>
                ${q.lingkupMateri ? `<span style="display: inline-block; background-color: #f0fdf4; color: #047857; font-weight: bold; font-size: 8pt; padding: 1px 6px; border: 1px solid #bbf7d0; border-radius: 3px; margin-right: 4px;">${q.lingkupMateri}</span>` : ''}
                ${q.question} 
                <span style="font-size: 8pt; color: #64748b; font-style: italic;">(${q.levelKognitif})</span>
              </td>
            </tr>
          </table>
          ${bodyHtml}
        </div>
      `;
    }).join('\n');

    return `
      <div style="font-family: 'Arial', sans-serif;">
        <div data-f4-kop="true">
          <!-- KOP SEKOLAH -->
          <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 15px;">
            <h2 style="margin: 0; text-transform: uppercase; font-size: 11pt;">${result.kop.dinasPendidikan.toUpperCase()}</h2>
            <h1 style="margin: 3px 0; font-size: 14pt; border: none; text-align: center; font-family: Arial; text-transform: uppercase;">${result.kop.namaSekolah.toUpperCase()}</h1>
            <p style="margin: 0; font-size: 9pt; font-style: italic;">Alamat Sekolah &bull; Kabupaten/Kota &bull; Provinsi</p>
          </div>

          <!-- JUDUL UJIAN -->
          <h3 style="text-align: center; text-transform: uppercase; margin-bottom: 15px; font-size: 12pt;">${result.judulUjian}</h3>

          <!-- GRID IDENTITAS -->
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 15px;">
            <tr>
              <td style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;" width="25%"><strong>Mata Pelajaran</strong></td>
              <td style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;" width="35%">: ${result.kop.mataPelajaran}</td>
              <td style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;" width="15%"><strong>Nama Siswa</strong></td>
              <td style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;" width="25%">: ____________________</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;"><strong>Kelas / Semester</strong></td>
              <td style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;">: Kelas ${result.kop.kelas} / ${result.kop.semester}</td>
              <td style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;"><strong>No. Absen</strong></td>
              <td style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;">: ____________________</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;"><strong>Tahun Pelajaran</strong></td>
              <td style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;">: ${result.kop.tahunPelajaran}</td>
              <td style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;"><strong>Nilai / Paraf</strong></td>
              <td style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;">: ________ / ________</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;"><strong>Lingkup Materi</strong></td>
              <td colspan="3" style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;">: ${result.kop.lingkupMateriList?.map((m, idx) => `Bab ${idx + 1}: ${m}`).join(' &bull; ') || result.kop.lingkupMateri || babMateri}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;"><strong>Bentuk Soal</strong></td>
              <td colspan="3" style="border: 1px solid #000; padding: 5px; font-size: 9.5pt;">: ${result.kop.bentukSoalSummary ? `${result.kop.bentukSoalSummary} (Total: ${result.questions.length} Butir Soal)` : (result.kop.bentukSoalList && result.kop.bentukSoalList.length > 0 ? result.kop.bentukSoalList.join(', ') : result.kop.bentukSoal || 'Pilihan Ganda')}</td>
            </tr>
          </table>
        </div>

        <div data-f4-section="Bagian 1: Naskah Soal Asesmen Sumatif">
          <!-- PETUNJUK UMUM -->
          <div style="border: 1px solid #94a3b8; padding: 8px; margin-bottom: 16px; font-size: 9pt; background-color: #f8fafc;">
            <strong>Petunjuk Umum:</strong>
            <ol style="margin-top: 3px; margin-bottom: 0; padding-left: 15px;">
              <li>Tuliskan identitas Anda secara lengkap di kolom yang telah disediakan.</li>
              <li>Bacalah setiap butir soal dengan saksama dan perhatikan petunjuk pengerjaan pada tiap bentuk soal.</li>
              <li>Kerjakan terlebih dahulu soal-soal yang Anda anggap lebih mudah.</li>
              <li>Periksa kembali seluruh lembar jawaban Anda sebelum diserahkan kepada bapak/ibu guru.</li>
            </ol>
          </div>

          <div style="margin-top: 15px;">
            ${questionsHtml}
          </div>
        </div>
      </div>
    `;
  };

  const handleExportNaskahDoc = () => {
    if (!result) return;
    const fullHtml = getAllSectionsHtml();
    downloadDocFile(`Paket_Soal_Sumatif_${result.judulUjian.replace(/\s+/g, '_')}_Kelas_${grade}`, fullHtml);
  };

  const getKunciHtml = (): string => {
    if (!result) return '';

    const keysHtml = result.questions.map((q, idx) => `
      <div style="margin-bottom: 15pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
        <p style="font-weight: bold; margin-bottom: 5px;">
          Soal No. ${idx + 1} 
          <span style="color: #0d9488; font-size: 9pt;">[Bentuk: ${q.bentukSoal}]</span> &bull; 
          <span style="color: #475569; font-size: 9pt;">[Level: ${q.levelKognitif}]</span>
        </p>
        <p style="margin-bottom: 5px;"><strong>Rumusan Soal:</strong> ${q.question}</p>
        <p style="color: #0d9488; font-weight: bold; margin-bottom: 3px;">Kunci Jawaban: ${q.correctAnswer}</p>
        <p style="font-size: 9.5pt; color: #475569; margin-bottom: 5px;"><strong>Penjelasan Pedagogis:</strong> ${q.explanation}</p>
        <p style="font-size: 9.5pt; background-color: #fef3c7; padding: 5px; border-radius: 4px; display: inline-block;"><strong>Kriteria Skor:</strong> ${q.pedomanPenskoran}</p>
      </div>
    `).join('\n');

    return `
      <div style="font-family: 'Arial', sans-serif;">
        <div data-f4-kop="true">
          <h1 style="font-size: 15pt; border-bottom: 2px solid #000; padding-bottom: 6px; text-align: center;">KUNCI JAWABAN & PEDOMAN PENSKORAN ASESMEN SUMATIF</h1>
          <p style="text-align: center; font-size: 10pt; color: #475569; margin-top: -4px;">${result.judulUjian} &bull; Kelas ${result.kop.kelas}</p>
        </div>
        
        <div data-f4-section="Bagian 1: Kunci Jawaban & Pedoman Penskoran" style="margin-top: 20px;">
          ${keysHtml}
        </div>
      </div>
    `;
  };

  const handleExportKunciDoc = () => {
    if (!result) return;
    const fullHtml = getAllSectionsHtml();
    downloadDocFile(`Kunci_Jawaban_${result.judulUjian.replace(/\s+/g, '_')}_Kelas_${grade}`, fullHtml);
  };

  const getKartuSoalHtml = (): string => {
    if (!result) return '';

    const cardsHtml = result.questions.map((q, idx) => `
      <div data-f4-section="Kartu Soal No. ${q.noSoal}: ${q.bentukSoal}" style="page-break-after: always; margin-bottom: 30pt;">
        <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; font-family: Arial, sans-serif;">
          <!-- BARIS KOP KARTU -->
          <tr style="background-color: #f1f5f9;">
            <td colspan="4" style="border: 1px solid #000; padding: 8px; text-align: center;">
              <strong style="font-size: 11pt; text-transform: uppercase;">KARTU SOAL SUMATIF SD (KURIKULUM MERDEKA)</strong><br>
              <span style="font-size: 9.5pt;">${result.kop.namaSekolah} &bull; ${result.kop.dinasPendidikan}</span>
            </td>
          </tr>
          <!-- IDENTITAS UTAMA -->
          <tr>
            <td style="border: 1px solid #000; padding: 6px; font-size: 9pt;" width="25%"><strong>Mata Pelajaran</strong></td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 9pt;" width="25%">${result.kop.mataPelajaran}</td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 9pt; background-color: #f0fdf4;" width="25%"><strong>Bentuk Soal</strong></td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 9pt; font-weight: bold; color: #0f766e; background-color: #f0fdf4;" width="25%">${q.bentukSoal}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px; font-size: 9pt;"><strong>Kelas / Semester</strong></td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 9pt;">Kelas ${result.kop.kelas} / ${result.kop.semester}</td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 9pt;"><strong>Nomor Soal</strong></td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 9pt; font-weight: bold; background-color: #f8fafc; text-align: center;">${q.noSoal}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px; font-size: 9pt;"><strong>Tahun Pelajaran</strong></td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 9pt;">${result.kop.tahunPelajaran}</td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 9pt;"><strong>Level Kognitif</strong></td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 9pt;">${q.levelKognitif}</td>
          </tr>
          
          <!-- LINGKUP MATERI -->
          <tr>
            <td style="border: 1px solid #000; padding: 6px; font-size: 9pt; background-color: #f8fafc;"><strong>Lingkup Materi</strong></td>
            <td colspan="3" style="border: 1px solid #000; padding: 6px; font-size: 9pt; font-weight: bold; color: #0369a1; background-color: #f8fafc;">${q.lingkupMateri || babMateri}</td>
          </tr>

          <!-- CAPAIAN PEMBELAJARAN & INDIKATOR -->
          <tr>
            <td colspan="4" style="border: 1px solid #000; padding: 8px; font-size: 9pt; background-color: #fafaf9;">
              <strong>Capaian Pembelajaran (CP) / Alur Tujuan Pembelajaran:</strong><br>
              ${q.capaianPembelajaran}
            </td>
          </tr>
          <tr>
            <td colspan="4" style="border: 1px solid #000; padding: 8px; font-size: 9pt; background-color: #fafaf9;">
              <strong>Indikator Pencapaian Kompetensi / Indikator Soal:</strong><br>
              ${q.indikatorSoal}
            </td>
          </tr>

          <!-- RUMUSAN BUTIR SOAL LENGKAP -->
          <tr>
            <td colspan="4" style="border: 1px solid #000; padding: 10px; font-size: 9.5pt; min-height: 120px;" valign="top">
              <div style="margin-bottom: 6px; font-weight: bold; color: #1e293b;">
                RUMUSAN BUTIR SOAL &bull; <span style="color: #0284c7;">[${q.bentukSoal}]</span>:
              </div>
              <p style="margin-top: 5px; font-weight: bold;">${q.question}</p>
              ${q.pernyataanKompleks && q.pernyataanKompleks.length > 0 ? `
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 8.5pt; margin-top: 8px;">
                  <thead>
                    <tr style="background-color: #f1f5f9;">
                      <th style="border: 1px solid #000; padding: 3px;" width="6%">No</th>
                      <th style="border: 1px solid #000; padding: 3px;" width="70%">Pernyataan</th>
                      <th style="border: 1px solid #000; padding: 3px; text-align: center;" width="12%">Benar (B)</th>
                      <th style="border: 1px solid #000; padding: 3px; text-align: center;" width="12%">Salah (S)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${q.pernyataanKompleks.map((p, pIdx) => `
                      <tr>
                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${pIdx + 1}</td>
                        <td style="border: 1px solid #000; padding: 4px;">${p.pernyataan}</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">[ &nbsp; ]</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">[ &nbsp; ]</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : q.menjodohkanPairs && q.menjodohkanPairs.length > 0 ? `
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 8.5pt; margin-top: 8px;">
                  <thead>
                    <tr style="background-color: #f1f5f9;">
                      <th style="border: 1px solid #000; padding: 3px;" width="50%">Kolom A (Konsep)</th>
                      <th style="border: 1px solid #000; padding: 3px;" width="50%">Kolom B (Pasangan)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${q.menjodohkanPairs.map((pair) => `
                      <tr>
                        <td style="border: 1px solid #000; padding: 4px;"><strong>${pair.premis}</strong></td>
                        <td style="border: 1px solid #000; padding: 4px;">${pair.pasangan}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : q.options && q.options.length > 0 ? `
                <div style="margin-left: 15px; margin-top: 6px;">
                  ${q.options.map(o => `<div style="margin-bottom: 2px;">${o}</div>`).join('')}
                </div>
              ` : q.bentukSoal === 'Isian Singkat' ? `
                <div style="margin-top: 8px; font-size: 9pt;"><strong>Jawaban Singkat:</strong> ........................................................................</div>
              ` : `
                <div style="margin-top: 8px; border-bottom: 1px dotted #94a3b8; height: 18px;"></div>
                <div style="margin-top: 4px; border-bottom: 1px dotted #94a3b8; height: 18px;"></div>
              `}
            </td>
          </tr>

          <!-- JAWABAN & PENSKORAN -->
          <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 8px; font-size: 9pt; background-color: #f0fdf4;" valign="top">
              <strong style="color: #166534;">KUNCI JAWABAN:</strong><br>
              <span style="font-weight: bold; font-size: 10pt; color: #166534;">${q.correctAnswer}</span>
              <p style="margin-top: 4px; font-size: 8.5pt; color: #374151;"><strong>Penjelasan Pedagogis:</strong> ${q.explanation}</p>
            </td>
            <td colspan="2" style="border: 1px solid #000; padding: 8px; font-size: 9pt; background-color: #fffbeb;" valign="top">
              <strong style="color: #92400e;">PEDOMAN PENSKORAN / EVALUASI:</strong><br>
              ${q.pedomanPenskoran}
            </td>
          </tr>
        </table>
      </div>
    `).join('\n');

    return `
      <div style="font-family: 'Arial', sans-serif;">
        <div data-f4-kop="true">
          <h1 style="font-size: 15pt; text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 20px;">BERKAS BUNDEL KARTU SOAL SUMATIF</h1>
        </div>
        ${cardsHtml}
      </div>
    `;
  };

  const handleExportKartuSoalDoc = () => {
    if (!result) return;
    const fullHtml = getAllSectionsHtml();
    downloadDocFile(`Kartu_Soal_Sumatif_${result.judulUjian.replace(/\s+/g, '_')}_Kelas_${grade}`, fullHtml);
  };

  const getKisiKisiHtml = (): string => {
    if (!result) return '';

    const rowsHtml = result.questions.map((q, idx) => `
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 8.5pt;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 8.5pt;">${q.capaianPembelajaran}</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 8.5pt;">${q.lingkupMateri || babMateri}</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 8.5pt;">${q.indikatorSoal}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 8.5pt;">${q.levelKognitif}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 8.5pt;">${q.bentukSoal}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 9pt;">${q.noSoal}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 8.5pt;">${q.bobotSkor || 1}</td>
      </tr>
    `).join('\n');

    return `
      <div style="font-family: 'Arial', sans-serif;">
        <div data-f4-kop="true">
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px;">
            <h2 style="margin: 0; font-size: 11pt; text-transform: uppercase;">${result.kop.dinasPendidikan}</h2>
            <h1 style="margin: 2px 0; font-size: 13pt; text-transform: uppercase;">${result.kop.namaSekolah}</h1>
            <h3 style="margin: 4px 0 0 0; font-size: 12pt; text-transform: uppercase;">KISI-KISI PENULISAN SOAL ASESMEN SUMATIF</h3>
          </div>

          <table style="width: 100%; font-size: 9pt; margin-bottom: 12px;">
            <tr>
              <td width="20%"><strong>Mata Pelajaran</strong></td>
              <td width="30%">: ${result.kop.mataPelajaran}</td>
              <td width="20%"><strong>Tahun Pelajaran</strong></td>
              <td width="30%">: ${result.kop.tahunPelajaran}</td>
            </tr>
            <tr>
              <td><strong>Kelas / Semester</strong></td>
              <td>: Kelas ${result.kop.kelas} / ${result.kop.semester}</td>
              <td><strong>Jumlah Soal</strong></td>
              <td>: ${result.questions.length} Butir Soal</td>
            </tr>
            <tr>
              <td><strong>Kurikulum</strong></td>
              <td>: Kurikulum Merdeka</td>
              <td><strong>Bentuk Asesmen</strong></td>
              <td>: ${bentukSoal.toUpperCase().replace('_', ' ')}</td>
            </tr>
            <tr>
              <td><strong>Lingkup Materi</strong></td>
              <td colspan="3">: ${result.kop.lingkupMateriList?.map((m, idx) => `Bab ${idx + 1}: ${m}`).join(' &bull; ') || result.kop.lingkupMateri || babMateri}</td>
            </tr>
          </table>
        </div>

        <div data-f4-section="Bagian 1: Kisi-Kisi Penulisan Soal Asesmen Sumatif" data-f4-orientation="landscape">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 8.5pt; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: center; font-weight: bold;">
                <th style="border: 1px solid #000; padding: 6px; width: 4%;">No</th>
                <th style="border: 1px solid #000; padding: 6px; width: 22%;">Capaian Pembelajaran (CP)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">Lingkup Materi</th>
                <th style="border: 1px solid #000; padding: 6px; width: 26%;">Indikator Soal</th>
                <th style="border: 1px solid #000; padding: 6px; width: 12%;">Level Kognitif</th>
                <th style="border: 1px solid #000; padding: 6px; width: 10%;">Bentuk Soal</th>
                <th style="border: 1px solid #000; padding: 6px; width: 5%;">No Soal</th>
                <th style="border: 1px solid #000; padding: 6px; width: 5%;">Bobot</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <table style="width: 100%; margin-top: 25px; font-size: 9.5pt;">
            <tr>
              <td width="50%" style="text-align: center;">
                Mengetahui,<br>
                Kepala Sekolah<br><br><br><br>
                <strong>_______________________</strong><br>
                NIP. ........................................
              </td>
              <td width="50%" style="text-align: center;">
                Guru Mata Pelajaran PJOK<br><br><br><br><br>
                <strong>_______________________</strong><br>
                NIP. ........................................
              </td>
            </tr>
          </table>
        </div>
      </div>
    `;
  };

  const handleExportKisiKisiDoc = () => {
    if (!result) return;
    const fullHtml = getAllSectionsHtml();
    downloadDocFile(`Kisi_Kisi_Soal_${result.judulUjian.replace(/\s+/g, '_')}_Kelas_${grade}`, fullHtml);
  };

  const getLjsHtml = (): string => {
    if (!result) return '';

    const pgOptions = jumlahOpsiPG === '3' ? ['A', 'B', 'C'] : jumlahOpsiPG === '5' ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

    return `
      <div style="font-family: 'Arial', sans-serif;">
        <div data-f4-kop="true">
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 12px;">
            <h2 style="margin: 0; font-size: 10pt; text-transform: uppercase;">${result.kop.dinasPendidikan}</h2>
            <h1 style="margin: 2px 0; font-size: 13pt; text-transform: uppercase;">${result.kop.namaSekolah}</h1>
            <h3 style="margin: 3px 0 0 0; font-size: 11pt; text-transform: uppercase;">LEMBAR JAWABAN ASESMEN SUMATIF (LJS)</h3>
          </div>

          <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px;">
            <tr>
              <td style="border: 1px solid #000; padding: 5px;" width="18%"><strong>Nama Peserta</strong></td>
              <td style="border: 1px solid #000; padding: 5px;" width="32%">: .................................................</td>
              <td style="border: 1px solid #000; padding: 5px;" width="18%"><strong>Mata Pelajaran</strong></td>
              <td style="border: 1px solid #000; padding: 5px;" width="32%">: ${result.kop.mataPelajaran}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 5px;"><strong>Nomor Peserta</strong></td>
              <td style="border: 1px solid #000; padding: 5px;">: .................................................</td>
              <td style="border: 1px solid #000; padding: 5px;"><strong>Kelas / Semester</strong></td>
              <td style="border: 1px solid #000; padding: 5px;">: Kelas ${result.kop.kelas} / ${result.kop.semester}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 5px;"><strong>Hari / Tanggal</strong></td>
              <td style="border: 1px solid #000; padding: 5px;">: .................................................</td>
              <td style="border: 1px solid #000; padding: 5px;"><strong>Tahun Pelajaran</strong></td>
              <td style="border: 1px solid #000; padding: 5px;">: ${result.kop.tahunPelajaran}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 5px;"><strong>Lingkup Materi</strong></td>
              <td colspan="3" style="border: 1px solid #000; padding: 5px;">: ${result.kop.lingkupMateriList?.map((m, idx) => `Bab ${idx + 1}: ${m}`).join(' &bull; ') || result.kop.lingkupMateri || babMateri}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 5px;"><strong>Bentuk Soal</strong></td>
              <td colspan="3" style="border: 1px solid #000; padding: 5px;">: ${result.kop.bentukSoalSummary ? `${result.kop.bentukSoalSummary} (Total: ${result.questions.length} Butir Soal)` : (result.kop.bentukSoalList && result.kop.bentukSoalList.length > 0 ? result.kop.bentukSoalList.join(', ') : result.kop.bentukSoal || 'Pilihan Ganda')}</td>
            </tr>
          </table>
        </div>

        <div data-f4-section="Bagian 1: Lembar Jawaban Siswa (LJS)">
          ${result.questions.some(q => q.bentukSoal === 'Pilihan Ganda') ? `
          <!-- LEMBAR JAWABAN BAGIAN PILIHAN GANDA -->
          <div style="margin-bottom: 14px; border: 1px solid #000; padding: 8px;">
            <strong style="font-size: 9.5pt;">LEMBAR JAWABAN: PILIHAN GANDA</strong>
            <p style="font-size: 8pt; color: #475569; margin: 2px 0 6px 0;">Berilah tanda silang (X) atau hitamkan lingkaran pada satu huruf jawaban yang paling benar!</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
              ${result.questions.filter(q => q.bentukSoal === 'Pilihan Ganda').map((q) => `
                <tr style="border-bottom: 1px dotted #cbd5e1;">
                  <td width="8%" style="padding: 4px; font-weight: bold;">${q.noSoal}.</td>
                  <td width="92%" style="padding: 4px;">
                    ${pgOptions.map(opt => `<span style="display: inline-block; margin-right: 18px; font-weight: bold;">( &nbsp; ) ${opt}</span>`).join('')}
                  </td>
                </tr>
              `).join('')}
            </table>
          </div>
          ` : ''}

          ${result.questions.some(q => q.bentukSoal !== 'Pilihan Ganda') ? `
          <!-- LEMBAR JAWABAN NON-PILIHAN GANDA -->
          <div style="border: 1px solid #000; padding: 8px; margin-bottom: 15px;">
            <strong style="font-size: 9.5pt;">LEMBAR JAWABAN: NON-PILIHAN GANDA (PG KOMPLEKS / MENJODOHKAN / ISIAN / URAIAN)</strong>
            <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 6px;">
              ${result.questions.filter(q => q.bentukSoal !== 'Pilihan Ganda').map((q) => `
                <tr>
                  <td width="15%" valign="top" style="padding: 6px 0; font-weight: bold;">Nomor ${q.noSoal} <span style="font-size: 8pt; color: #0284c7;">[${q.bentukSoal}]</span>:</td>
                  <td width="85%" valign="top" style="padding: 6px 0;">
                    <div style="border-bottom: 1px dotted #000; height: 16px; width: 100%; margin-bottom: 4px;"></div>
                    <div style="border-bottom: 1px dotted #000; height: 16px; width: 100%; margin-bottom: 4px;"></div>
                    ${q.bentukSoal === 'Uraian' ? '<div style="border-bottom: 1px dotted #000; height: 16px; width: 100%;"></div>' : ''}
                  </td>
                </tr>
              `).join('')}
            </table>
          </div>
          ` : ''}

          <!-- SCORE BOX -->
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 9pt;">
            <tr style="background-color: #f1f5f9; text-align: center; font-weight: bold;">
              <td style="border: 1px solid #000; padding: 6px;" width="33%">Nilai / Skor Akhir</td>
              <td style="border: 1px solid #000; padding: 6px;" width="33%">Tanda Tangan Guru</td>
              <td style="border: 1px solid #000; padding: 6px;" width="34%">Tanda Tangan Orang Tua</td>
            </tr>
            <tr style="height: 45px; text-align: center;">
              <td style="border: 1px solid #000; padding: 6px;"></td>
              <td style="border: 1px solid #000; padding: 6px;"></td>
              <td style="border: 1px solid #000; padding: 6px;"></td>
            </tr>
          </table>
        </div>
      </div>
    `;
  };

  const getAllSectionsHtml = (): string => {
    if (!result) return '';
    return `
      <div style="font-family: 'Arial', sans-serif;">
        <div data-f4-kop="true">
          <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 12px;">
            <h2 style="margin: 0; text-transform: uppercase; font-size: 11pt;">${result.kop.dinasPendidikan.toUpperCase()}</h2>
            <h1 style="margin: 3px 0; font-size: 14pt; border: none; text-align: center; font-family: Arial; text-transform: uppercase;">${result.kop.namaSekolah.toUpperCase()}</h1>
            <p style="margin: 0; font-size: 9pt; font-weight: bold;">${result.judulUjian} &bull; ${result.kop.mataPelajaran} &bull; Kelas ${result.kop.kelas} / Semester ${result.kop.semester} (${result.kop.tahunPelajaran})</p>
          </div>
        </div>

        <div data-f4-section="Bagian 1: Naskah Soal Asesmen Sumatif">
          ${getNaskahHtml().replace(/data-f4-section="[^"]*"/g, '').replace(/data-f4-kop="true"/g, '')}
        </div>

        <div data-f4-section="Bagian 2: Lembar Jawaban Siswa (LJS)">
          ${getLjsHtml().replace(/data-f4-section="[^"]*"/g, '').replace(/data-f4-kop="true"/g, '')}
        </div>

        <div data-f4-section="Bagian 3: Kunci Jawaban & Pedoman Penskoran">
          ${getKunciHtml().replace(/data-f4-section="[^"]*"/g, '').replace(/data-f4-kop="true"/g, '')}
        </div>

        <div data-f4-section="Bagian 4: Kisi-Kisi Penulisan Soal Asesmen Sumatif" data-f4-orientation="landscape">
          ${getKisiKisiHtml().replace(/data-f4-section="[^"]*"/g, '').replace(/data-f4-kop="true"/g, '')}
        </div>

        <div data-f4-section="Bagian 5: Bundel Kartu Soal Sumatif">
          ${getKartuSoalHtml().replace(/data-f4-section="[^"]*"/g, '').replace(/data-f4-kop="true"/g, '')}
        </div>
      </div>
    `;
  };

  const handleExportLjsDoc = () => {
    if (!result) return;
    const fullHtml = getAllSectionsHtml();
    downloadDocFile(`LJS_Lembar_Jawab_${result.judulUjian.replace(/\s+/g, '_')}_Kelas_${grade}`, fullHtml);
  };

  const getTabHtml = (tab: string): string => {
    switch (tab) {
      case 'naskah': return getAllSectionsHtml();
      case 'kunci': return getAllSectionsHtml();
      case 'kartu': return getAllSectionsHtml();
      case 'kisi': return getAllSectionsHtml();
      case 'ljs': return getAllSectionsHtml();
      default: return getAllSectionsHtml();
    }
  };

  const handleCetakPdf = async () => {
    if (!result || isExportingPdf) return;
    setIsExportingPdf(true);
    setPdfNotice('Menyiapkan dan menyusun dokumen PDF A4...');

    const cleanTitle = (result.judulUjian || 'Asesmen_Sumatif').replace(/[^a-zA-Z0-9_-]/g, '_');
    const tabFileMap: Record<string, string> = {
      naskah: `Naskah_Soal_${cleanTitle}_Kelas_${grade}`,
      kunci: `Kunci_Jawaban_${cleanTitle}_Kelas_${grade}`,
      kartu: `Kartu_Soal_Sumatif_${cleanTitle}_Kelas_${grade}`,
      kisi: `Kisi_Kisi_Soal_${cleanTitle}_Kelas_${grade}`,
      ljs: `Lembar_Jawab_LJS_${cleanTitle}_Kelas_${grade}`
    };
    const filename = tabFileMap[resultTab] || `Dokumen_Sumatif_${cleanTitle}`;
    const isLandscape = resultTab === 'kisi';

    // Temporarily ensure all cards are visible if on kartu tab
    const prevViewAll = viewAllCards;
    if (resultTab === 'kartu' && !viewAllCards) {
      setViewAllCards(true);
      await new Promise(r => setTimeout(r, 200));
    }

    try {
      let success = false;

      // 1. Clean Multi-Section F4 HTML to PDF
      const htmlDoc = getTabHtml(resultTab);
      if (htmlDoc) {
        success = await downloadHtmlAsPdf(filename, htmlDoc, {
          orientation: isLandscape ? 'landscape' : 'portrait',
          marginMm: 8,
          scale: 2
        });
      }

      // 2. Fallback: High fidelity render of current visible document element
      if (!success && printableContentRef.current) {
        success = await downloadElementAsPdf(printableContentRef.current, filename, {
          orientation: isLandscape ? 'landscape' : 'portrait',
          marginMm: 6,
          scale: 2
        });
      }

      // 3. Fallback: Isolated printable iframe
      if (!success) {
        const htmlDoc = getTabHtml(resultTab);
        if (htmlDoc) {
          printHtmlDocument(htmlDoc, filename.replace(/_/g, ' '));
          success = true;
        }
      }

      if (success) {
        setPdfNotice('Dokumen PDF berhasil dicetak dan diunduh ke perangkat Anda.');
        setTimeout(() => setPdfNotice(null), 4500);
      } else {
        setPdfNotice('Membuka jendela cetak browser...');
        window.print();
        setTimeout(() => setPdfNotice(null), 4000);
      }
    } catch (err) {
      console.error('PDF export error:', err);
      const htmlDoc = getTabHtml(resultTab);
      if (htmlDoc) {
        printHtmlDocument(htmlDoc, filename.replace(/_/g, ' '));
      } else {
        try { window.print(); } catch (_) {}
      }
      setPdfNotice('Membuka dialog cetak...');
      setTimeout(() => setPdfNotice(null), 4000);
    } finally {
      if (resultTab === 'kartu' && !prevViewAll) {
        setViewAllCards(prevViewAll);
      }
      setIsExportingPdf(false);
    }
  };

  const handleCetakGoogleDoc = async () => {
    if (!result) return;
    setIsCopyingGoogleDoc(true);
    setPdfNotice('Menyusun dan menyalin format dokumen untuk Google Docs...');

    const prevViewAll = viewAllCards;
    if (resultTab === 'kartu' && !viewAllCards) {
      setViewAllCards(true);
      await new Promise(r => setTimeout(r, 150));
    }

    try {
      const docHtml = getTabHtml(resultTab);
      if (docHtml) {
        const success = await copyAndOpenGoogleDocs(docHtml);
        if (success) {
          setPdfNotice('Dokumen berhasil disalin! Jendela Google Docs (docs.new) telah dibuka. Silakan tekan Ctrl+V (atau Cmd+V) di Google Docs.');
          setTimeout(() => setPdfNotice(null), 6000);
        } else {
          setPdfNotice('Gagal menyalin format dokumen ke papan klip.');
          setTimeout(() => setPdfNotice(null), 4000);
        }
      }
    } catch (err) {
      console.error('Google Docs export error:', err);
      setPdfNotice('Terjadi kendala saat menyalin dokumen ke Google Docs.');
      setTimeout(() => setPdfNotice(null), 4000);
    } finally {
      if (resultTab === 'kartu' && !prevViewAll) {
        setViewAllCards(prevViewAll);
      }
      setIsCopyingGoogleDoc(false);
    }
  };

  const handlePrintPreview = () => {
    if (!result) return;
    const cleanTitle = (result.judulUjian || 'Asesmen Sumatif').replace(/[^a-zA-Z0-9_-]/g, ' ');
    const docHtml = getTabHtml(resultTab);
    if (docHtml) {
      printHtmlDocument(docHtml, `${resultTab.toUpperCase()} - ${cleanTitle}`);
    } else if (printableContentRef.current) {
      printHtmlDocument(printableContentRef.current.innerHTML, cleanTitle);
    } else {
      window.print();
    }
  };

  const handleCopyClipboard = () => {
    if (!result) return;
    const cleanText = result.questions.map((q, idx) => {
      let bodyText = '';
      if (q.pernyataanKompleks && q.pernyataanKompleks.length > 0) {
        bodyText = '\nPernyataan Benar/Salah:\n' + q.pernyataanKompleks.map((p, pIdx) => `${pIdx + 1}. ${p.pernyataan} [Kunci: ${p.jawabanBenar}]`).join('\n');
      } else if (q.menjodohkanPairs && q.menjodohkanPairs.length > 0) {
        bodyText = '\nPasangan Menjodohkan:\n' + q.menjodohkanPairs.map(pair => `${pair.premis} <-> ${pair.pasangan}`).join('\n');
      } else if (q.options && q.options.length > 0) {
        bodyText = `\nOpsi Jawaban:\n${q.options.join('\n')}`;
      }

      return `Soal No. ${idx + 1} [Bentuk Soal: ${q.bentukSoal} | Level: ${q.levelKognitif}]
Pertanyaan: ${q.question}${bodyText}
Kunci Jawaban: ${q.correctAnswer}
Penjelasan Pedagogis: ${q.explanation}
Pedoman Penskoran: ${q.pedomanPenskoran}
----------------------------------------`;
    }).join('\n\n');

    navigator.clipboard.writeText(cleanText)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  };

  const handleExportJson = () => {
    if (!result) return;
    const cleanTitle = (result.judulUjian || 'Asesmen_Sumatif').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Asesmen_Sumatif_${cleanTitle}_Kelas_${grade}_${new Date().toISOString().slice(0, 10)}`;

    const exportPayload = {
      metadata: {
        judulUjian: result.judulUjian,
        mataPelajaran,
        grade: `Kelas ${grade} SD`,
        fase: grade === '1' || grade === '2' ? 'Fase A' : (grade === '3' || grade === '4' ? 'Fase B' : 'Fase C'),
        semester,
        tahunPelajaran,
        namaSekolah,
        dinasPendidikan,
        jenisUjian,
        levelKognitif,
        skalaPenskoran,
        modelStimulus,
        dimensiP3,
        jumlahSoal: result.questions.length,
        materiList,
        tanggalEkspor: new Date().toISOString()
      },
      kisiKisiRingkasan: result.questions.map((q, idx) => ({
        no: idx + 1,
        bentukSoal: q.bentukSoal,
        levelKognitif: q.levelKognitif,
        topik: q.materi,
        indikatorSoal: q.indikatorSoal,
        bobotSkor: q.bobotSkor
      })),
      soalDanKartu: result.questions.map((q, idx) => ({
        nomor: idx + 1,
        bentukSoal: q.bentukSoal,
        levelKognitif: q.levelKognitif,
        capaianPembelajaran: q.capaianPembelajaran,
        tujuanPembelajaran: q.tujuanPembelajaran,
        materi: q.materi,
        indikatorSoal: q.indikatorSoal,
        stimulus: q.stimulus,
        pertanyaan: q.question,
        pilihanJawaban: q.options || [],
        kunciJawaban: q.correctAnswer,
        bobotSkor: q.bobotSkor,
        pembahasanPedagogis: q.explanation,
        pedomanPenskoran: q.pedomanPenskoran,
        pernyataanKompleks: q.pernyataanKompleks || [],
        pasanganMenjodohkan: q.menjodohkanPairs || []
      }))
    };

    downloadJsonFile(filename, exportPayload);
    setPdfNotice('Berkas JSON Asesmen Sumatif & Kartu Soal berhasil diekspor & diunduh!');
    setTimeout(() => setPdfNotice(null), 4000);
  };

  const generateAiPrompt = (mode: 'generator' | 'reviewer' | 'variasi'): string => {
    const cleanMateri = materiList.filter(m => m.trim().length > 0).join(', ') || 'Aktivitas Kebugaran Jasmani & Pola Hidup Sehat';
    const cleanBentukNames = selectedBentukSoal.map(getBentukSoalName).join(', ');
    const distributionText = selectedBentukSoal.map(key => {
      const name = getBentukSoalName(key);
      const count = bentukSoalCounts[key] || 1;
      return `- ${name}: ${count} butir`;
    }).join('\n');

    if (mode === 'generator') {
      return `Bertindaklah sebagai Konsultan Evaluasi Pembelajaran & Penelaah Asesmen Kurikulum Merdeka Kemendikbudristek berpengalaman tinggi.

TUGAS ANDA:
Susunlah paket instrumen Asesmen Sumatif dan Kartu Soal lengkap untuk jenjang Sekolah Dasar berdasarkan spesifikasi resmi berikut:

[IDENTITAS ASESMEN]
- Jenis Ujian: ${jenisUjian}
- Mata Pelajaran: ${mataPelajaran}
- Tingkat / Fase: Kelas ${grade} SD (Fase ${grade === '1' || grade === '2' ? 'A' : (grade === '3' || grade === '4' ? 'B' : 'C')})
- Semester / Tahun: Semester ${semester} / Tahun Pelajaran ${tahunPelajaran}
- Satuan Pendidikan: ${namaSekolah} (${dinasPendidikan})
- Dimensi Profil Pelajar Pancasila: ${dimensiP3.toUpperCase().replace(/_/g, ' ')}

[SPESIFIKASI BUTIR SOAL]
- Ruang Lingkup Materi: ${cleanMateri}
- Total Butir Soal: ${totalSoal} butir
- Distribusi Bentuk Soal:
${distributionText}
- Level Kognitif: ${levelKognitif.toUpperCase()} (Proporsi berimbang Taksonomi Bloom C1-C6)
- Model Stimulus: ${modelStimulus.replace(/_/g, ' ').toUpperCase()} (kontekstual, studi kasus keseharian anak SD)
- Opsi Pilihan Ganda: ${jumlahOpsiPG} opsi (A, B, C${jumlahOpsiPG === '4' ? ', D' : (jumlahOpsiPG === '5' ? ', D, E' : '')})
- Skala Penskoran: ${skalaPenskoran}

[STANDAR FORMAT KELUARAN YANG DIBUTUHKAN]
Mohon hasilkan dalam 4 bagian terstruktur:
1. NASKAH SOAL SUMATIF: Kop sekolah formal, petunjuk pengerjaan, stimulus bacaan kontekstual, butir-butir soal yang rapi dan siap cetak.
2. KUNCI JAWABAN & PEMBAHASAN: Kunci setiap butir, penjelasan konsep pedagogis yang komprehensif, dan pedoman penskoran/rubrik penskoran terukur.
3. KARTU SOAL RESMI PER NOMOR:
   Untuk setiap butir soal, sajikan tabel Kartu Soal standar instrumen penilaian memuat:
   - Capaian Pembelajaran (CP) & Tujuan Pembelajaran (TP)
   - Indikator Soal spesifik
   - Level Kognitif (C1-C6 / LOTS-MOTS-HOTS)
   - Bentuk Soal & Nomor Butir
   - Rumusan Butir Soal & Kunci Jawaban
   - Pedoman Penskoran
4. KISI-KISI ASESMEN SUMATIF: Matriks pemetaan nomor soal, lingkup materi, indikator, level kognitif, dan bentuk soal.

Gunakan bahasa Indonesia baku yang komunikatif dan ramah anak Sekolah Dasar.`;
    }

    if (mode === 'reviewer') {
      const questionsSnippet = result ? result.questions.slice(0, 10).map((q, idx) => `
[Soal No. ${idx + 1}] (${q.bentukSoal} | Level: ${q.levelKognitif})
Indikator: ${q.indikatorSoal}
Pertanyaan: ${q.question}
Kunci: ${q.correctAnswer}
Rubrik: ${q.pedomanPenskoran}
`).join('\n') : '(Silakan jalankan atau masukkan butir-butir soal yang ingin ditelaah)';

      return `Bertindaklah sebagai Tim Ahli Reviewer & Validasi Butir Soal Asesmen Puspendik / BSKAP (berdasarkan standar Keputusan Kepala BSKAP Nomor 046/H/KR/2025).

TUGAS ANDA:
Lakukan telaah mutu instrumen (review kualitatif butir soal) terhadap paket asesmen sumatif berikut untuk memastikan evaluasi yang adil, valid, dan reliabel:

[DATA INSTRUMEN]
- Mata Pelajaran: ${mataPelajaran}
- Sasaran Siswa: Kelas ${grade} SD
- Materi Asesmen: ${cleanMateri}

[DAFTAR BUTIR SOAL YANG DITELAAH]
${questionsSnippet}

[ASPEK TELAAH YANG WAJIB ANDA ANALISIS]:
1. ASPEK MATERI:
   - Apakah materi yang diujikan esensial dan sesuai dengan Capaian Pembelajaran Fase?
   - Apakah kunci jawaban mutlak benar dan tidak menimbulkan multitafsir?
2. ASPEK KONSTRUKSI:
   - Apakah pokok soal dirumuskan secara jelas, tegas, dan tidak memberi petunjuk ke kunci jawaban?
   - Untuk Pilihan Ganda: Apakah pilihan pengecoh (distraktor) homogen, logis, dan berfungsi efektif?
   - Untuk Uraian/Isian: Apakah batasan jawaban dan pedoman penskoran jelas dan terukur?
3. ASPEK BAHASA & KETERBACAAN:
   - Apakah menggunakan bahasa Indonesia yang baik, benar, dan komunikatif bagi siswa Kelas ${grade} SD?
   - Apakah tidak mengandung bias budaya, SARA, atau gender?
4. REKOMENDASI PERBAIKAN:
   - Berikan rumusan revisi butir soal yang lebih tajam dan sempurna untuk setiap butir yang memerlukan perbaikan.`;
    }

    // mode === 'variasi'
    const currentQuestionsSummary = result ? result.questions.slice(0, 8).map((q, idx) => `
- Butir ${idx + 1} (${q.bentukSoal} | Level: ${q.levelKognitif}): Indikator [${q.indikatorSoal}] -> Kunci [${q.correctAnswer}]
`).join('\n') : '';

    return `Bertindaklah sebagai Pengembang Soal Asesmen Sumatif SD Kurikulum Merdeka.

TUGAS ANDA:
Buatkan "PAKET B / PAKET PARALEL (REMEDIAL)" yang memiliki tingkat kesukaran dan kisi-kisi yang SETARA (Equivalent Test Form) dengan paket soal acuan berikut:

[DATA UJIAN ACUAN]
- Mata Pelajaran: ${mataPelajaran}
- Kelas: Kelas ${grade} SD
- Materi Pokok: ${cleanMateri}
- Bentuk Soal: ${cleanBentukNames}
- Level Kognitif: ${levelKognitif.toUpperCase()}

[INDIKATOR ACUAN PAKET UTAMA]:
${currentQuestionsSummary}

[PETUNJUK WAJIB PENYUSUNAN PAKET PARALEL]:
1. Gunakan indikator butir soal dan tujuan pembelajaran yang PERSIS SAMA dengan paket acuan di atas.
2. Ubah konteks stimulus cerita, nama tokoh, angka, situasi ilustrasi gerak, atau sudut pandang pertanyaan sehingga butir soal BENAR-BENAR BARU dan tidak dapat dicontek dari paket utama.
3. Pertahankan format bentuk soal, jumlah opsi PG, dan tingkat kesukaran yang setara.
4. Sajikan Naskah Soal Paket B, Kunci Jawaban Lengkap, dan Pembahasan Pedagogis.`;
  };

  const handleCopyPrompt = (mode: 'generator' | 'reviewer' | 'variasi') => {
    const promptText = generateAiPrompt(mode);
    navigator.clipboard.writeText(promptText)
      .then(() => {
        setIsPromptCopied(true);
        setTimeout(() => setIsPromptCopied(false), 3000);
      })
      .catch(err => console.error('Failed to copy prompt: ', err));
  };

  const handleDownloadPromptTxt = (mode: 'generator' | 'reviewer' | 'variasi') => {
    const promptText = generateAiPrompt(mode);
    const blob = new Blob([promptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `Prompt_AI_${mode.toUpperCase()}_Soal_Sumatif_Kelas_${grade}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 30000);
  };

  const handleOpenGemini = () => {
    window.open('https://gemini.google.com/app', '_blank', 'noopener,noreferrer');
  };

  const handleOpenChatGPT = () => {
    window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="summative-assessment-generator">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <FileSignature className="w-8 h-8 text-teal-300 animate-pulse" />
              Penyusun Soal Sumatif &amp; Kartu Soal AI
            </h2>
            <p className="mt-2 text-teal-100 max-w-2xl text-xs sm:text-sm leading-relaxed">
              Buat Soal Sumatif formal lengkap dengan <strong>Naskah Soal</strong> terstruktur, <strong>Kunci Jawaban &amp; Rubrik Penskoran</strong>, serta <strong>Kartu Soal Kurikulum Merdeka</strong> resmi yang siap dicetak dan diekspor ke Word / Google Docs.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shrink-0 text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold tracking-widest text-teal-200 block">STANDAR NASIONAL</span>
            <span className="text-xs font-black text-white block mt-0.5">Kurikulum Merdeka 2026/2027</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Input Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
              <ClipboardList className="w-5 h-5 text-teal-600" />
              Pengaturan Asesmen
            </h3>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Asesmen Sumatif <span className="text-rose-500">*</span>
                </label>
                <select
                  value={jenisUjian}
                  onChange={(e) => setJenisUjian(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white"
                >
                  <option value="Asesmen Sumatif Akhir Semester (SAS)">Asesmen Sumatif Akhir Semester (SAS)</option>
                  <option value="Asesmen Sumatif Tengah Semester (STS)">Asesmen Sumatif Tengah Semester (STS)</option>
                  <option value="Asesmen Sumatif Lingkup Materi (Harian)">Asesmen Sumatif Lingkup Materi (Harian)</option>
                  <option value="Ujian Akhir Sekolah Dasar">Ujian Akhir Sekolah Dasar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={mataPelajaran}
                  onChange={(e) => setMataPelajaran(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white"
                  placeholder="Misal: Pendidikan Jasmani, Olahraga, dan Kesehatan"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kelas SD <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white font-semibold text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>Kelas {n} SD</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Bab / Lingkup Materi Utama <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      {materiList.length} Materi Terpilih
                    </span>
                  </div>
                  {materiList.length < 5 && (
                    <button
                      type="button"
                      onClick={() => handleAddMateriSlot('')}
                      className="text-[11px] flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md transition-all shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      Tambah Materi
                    </button>
                  )}
                </div>
                
                <p className="text-[11px] text-slate-500 leading-tight">
                  Anda dapat menentukan 1, 2, atau 3 materi sekaligus sebagai dasar pembuatan soal. AI akan otomatis mendistribusikan soal secara berimbang ke setiap materi.
                </p>

                {/* Input slots */}
                <div className="space-y-1.5">
                  {materiList.map((materi, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200 focus-within:border-teal-400 focus-within:bg-teal-50/20 transition-all">
                      <span className="text-[10px] font-black px-2 py-1 rounded bg-teal-600 text-white shrink-0 shadow-xs">
                        Materi {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={materi}
                        onChange={(e) => handleUpdateMateriSlot(idx, e.target.value)}
                        placeholder={`Contoh Materi ${idx + 1}: Permainan Bola Besar / Senam Lantai / Kebugaran`}
                        className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white font-medium text-slate-800"
                        required
                      />
                      {materiList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMateriSlot(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors shrink-0"
                          title="Hapus materi ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quick Topic Presets for Grade */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-semibold text-teal-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      Pilihan Cepat Materi Kurikulum Merdeka Kelas {grade} SD:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Klik untuk aktifkan / lepas
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {MATERI_PRESETS_BY_GRADE[grade]?.map((preset, pIdx) => {
                      const slotIdx = materiList.findIndex(m => m.trim().toLowerCase() === preset.trim().toLowerCase());
                      const isSelected = slotIdx !== -1;
                      return (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleTogglePresetMateri(preset)}
                          className={`text-[10px] px-2.5 py-1 rounded-md text-left transition-all border flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-teal-700 text-white border-teal-800 font-bold shadow-xs'
                              : 'bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isSelected && (
                            <span className="bg-white/20 text-white px-1 py-0.2 rounded text-[9px] font-black">
                              Materi {slotIdx + 1}
                            </span>
                          )}
                          <span>{preset}</span>
                          {isSelected ? (
                            <Check className="w-3 h-3 text-white ml-0.5 shrink-0" />
                          ) : (
                            <Plus className="w-3 h-3 text-slate-400 ml-0.5 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Multi-Selection Bentuk Soal Asesmen */}
              <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Bentuk Soal Asesmen <span className="text-rose-500">*</span>
                      <span className="ml-1.5 text-[10.5px] font-semibold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full border border-teal-200">
                        Multi-Pilih Aktif ({selectedBentukSoal.length} Terpilih)
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilih 1 atau lebih bentuk soal. Sistem akan menyusun dan mendistribusikan butir soal sesuai pilihan Anda.
                    </p>
                  </div>

                  {/* Preset Cepat */}
                  <div className="flex flex-wrap items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectPresetBentuk('all')}
                      title="Pilih seluruh 5 bentuk soal"
                      className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        selectedBentukSoal.length === 5
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                      }`}
                    >
                      ★ Semua (5)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPresetBentuk('pg_uraian')}
                      title="Pilihan Ganda & Uraian"
                      className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        selectedBentukSoal.length === 2 && selectedBentukSoal.includes('pilihan_ganda') && selectedBentukSoal.includes('uraian')
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                      }`}
                    >
                      PG + Uraian
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPresetBentuk('pg_isian_uraian')}
                      title="Pilihan Ganda, Isian, & Uraian"
                      className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        selectedBentukSoal.length === 3 && selectedBentukSoal.includes('pilihan_ganda') && selectedBentukSoal.includes('isian') && selectedBentukSoal.includes('uraian')
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                      }`}
                    >
                      PG + Isian + Uraian
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPresetBentuk('pg_only')}
                      title="Hanya Pilihan Ganda"
                      className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        selectedBentukSoal.length === 1 && selectedBentukSoal.includes('pilihan_ganda')
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                      }`}
                    >
                      Hanya PG
                    </button>
                  </div>
                </div>

                {/* 5 Cards for Bentuk Soal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {BENTUK_SOAL_OPTIONS.map((item) => {
                    const isSelected = selectedBentukSoal.includes(item.id);
                    const currentCount = bentukSoalCounts[item.id] || 1;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleBentukSoal(item.id)}
                        className={`flex flex-col justify-between p-3 rounded-lg border transition-all cursor-pointer select-none ${
                          isSelected
                            ? `${item.activeBg} ${item.activeBorder} shadow-2xs ring-1 ring-teal-500/20`
                            : 'bg-white hover:bg-slate-100/60 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleBentukSoal(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 mt-0.5 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-xs font-bold leading-tight ${isSelected ? item.activeText : 'text-slate-700'}`}>
                                {item.label}
                              </span>
                              {isSelected && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-white text-teal-700 border border-teal-300 shrink-0">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Pengatur Jumlah Soal per Bentuk */}
                        {isSelected ? (
                          <div 
                            className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[11px] font-bold text-slate-700">
                              Atur Jumlah:
                            </span>
                            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-md border border-slate-300 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleUpdateShapeCount(item.id, currentCount - 1)}
                                disabled={currentCount <= 1}
                                className="w-5 h-5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-black text-xs text-slate-700 cursor-pointer active:scale-90 transition-transform"
                                title="Kurangi 1 butir soal"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={25}
                                value={currentCount}
                                onChange={(e) => handleUpdateShapeCount(item.id, parseInt(e.target.value) || 1)}
                                className="w-8 text-center text-xs font-black text-slate-800 bg-transparent focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateShapeCount(item.id, currentCount + 1)}
                                disabled={currentCount >= 25}
                                className="w-5 h-5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-black text-xs text-slate-700 cursor-pointer active:scale-90 transition-transform"
                                title="Tambah 1 butir soal"
                              >
                                +
                              </button>
                              <span className="text-[10px] text-slate-400 font-semibold pr-0.5">butir</span>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400"
                          >
                            <span className="text-[10px] italic">Tidak aktif (0 butir)</span>
                            <span className="text-[10px] font-bold text-teal-600 hover:text-teal-700">
                              + Aktifkan
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Ringkasan Distribusi Bentuk & Total Butir Soal */}
                <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-700">
                        Distribusi Butir Soal:
                      </span>
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-teal-600 text-white shadow-2xs">
                        Total {totalCalculatedSoal} Butir Soal
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({selectedBentukSoal.length} bentuk aktif)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 shrink-0">
                      <span className="font-semibold text-slate-600 text-[10.5px]">Format Cepat:</span>
                      {[5, 10, 15, 20].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => applyQuickTotalPreset(num)}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer text-[10.5px] border ${
                            totalCalculatedSoal === num
                              ? 'bg-teal-50 border-teal-500 text-teal-800 font-extrabold shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {num} Soal
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chips per shape with exact count and percentage */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100">
                    {selectedBentukSoal.map((b) => {
                      const opt = BENTUK_SOAL_OPTIONS.find(o => o.id === b);
                      const cnt = bentukSoalCounts[b] || 1;
                      const pct = Math.round((cnt / totalCalculatedSoal) * 100);
                      return (
                        <div
                          key={b}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                          <span className="font-bold text-slate-800">{opt?.shortLabel || getBentukSoalName(b)}:</span>
                          <span className="font-black text-teal-700 bg-teal-100/80 px-1.5 py-0.2 rounded text-[11px]">
                            {cnt} butir
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Question Settings Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jumlah Opsi PG
                      {!selectedBentukSoal.includes('pilihan_ganda') && (
                        <span className="text-slate-400 font-normal ml-1">(Non-aktif)</span>
                      )}
                    </label>
                    <select
                      value={jumlahOpsiPG}
                      onChange={(e) => setJumlahOpsiPG(e.target.value as any)}
                      disabled={!selectedBentukSoal.includes('pilihan_ganda')}
                      className={`w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800 ${
                        !selectedBentukSoal.includes('pilihan_ganda') ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'
                      }`}
                    >
                      <option value="3">3 Opsi (A, B, C) — Fase A (Kelas 1-2)</option>
                      <option value="4">4 Opsi (A, B, C, D) — Fase B &amp; C (Kelas 3-6)</option>
                      <option value="5">5 Opsi (A, B, C, D, E) — Ujian Khusus</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Level Kognitif Target
                    </label>
                    <select
                      value={levelKognitif}
                      onChange={(e) => setLevelKognitif(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-semibold text-slate-800"
                    >
                      <option value="campuran">Berimbang (LOTS, MOTS &amp; HOTS)</option>
                      <option value="hots">Fokus HOTS (C4 Analisis - C6 Kreasi)</option>
                      <option value="mots">Fokus MOTS (C3 Penerapan/Aplikasi)</option>
                      <option value="lots">Fokus LOTS (C1 Mengingat &amp; C2 Pemahaman)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Total Butir Soal
                    </label>
                    <select
                      value={totalCalculatedSoal.toString()}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) applyQuickTotalPreset(val);
                      }}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-bold text-teal-800"
                    >
                      <option value="3">3 Soal</option>
                      <option value="5">5 Soal (Standar Formatif)</option>
                      <option value="10">10 Soal (Format STS)</option>
                      <option value="15">15 Soal (Format SAS)</option>
                      <option value="20">20 Soal (Ujian Lengkap)</option>
                      {![3, 5, 10, 15, 20].includes(totalCalculatedSoal) && (
                        <option value={totalCalculatedSoal.toString()}>
                          Kustom: {totalCalculatedSoal} Soal
                        </option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Extended Advanced Pedagogical Options */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3 text-teal-600" />
                    Opsi Pedagogis &amp; Stimulus P3
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Model Stimulus Soal
                    </label>
                    <select
                      value={modelStimulus}
                      onChange={(e) => setModelStimulus(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white"
                    >
                      <option value="kontekstual">Kontekstual Jasmani &amp; Kebugaran</option>
                      <option value="studi_kasus">Studi Kasus &amp; Sportivitas Lapangan</option>
                      <option value="gambar_observasi">Deskripsi Observasi &amp; Teknik Gerak</option>
                      <option value="tradisional">Permainan Tradisional Nusantara</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dimensi Profil Pancasila
                    </label>
                    <select
                      value={dimensiP3}
                      onChange={(e) => setDimensiP3(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white"
                    >
                      <option value="terpadu">Terpadu Seluruh Dimensi P3</option>
                      <option value="gotong_royong">Gotong Royong &amp; Kerja Sama</option>
                      <option value="mandiri">Mandiri &amp; Disiplin Pribadi</option>
                      <option value="bernalar_kritis">Bernalar Kritis &amp; Analitis</option>
                      <option value="kreatif">Kreatif &amp; Inovasi Gerak</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sistem Skala Penskoran
                  </label>
                  <select
                    value={skalaPenskoran}
                    onChange={(e) => setSkalaPenskoran(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white font-medium"
                  >
                    <option value="standar">Standar Kurikulum Merdeka (PG:1, PGK:2, Menjodohkan:2, Isian:3, Uraian:5)</option>
                    <option value="rata">Bobot Rata (10 Poin per Butir Soal)</option>
                    <option value="persen">Skala Persentase 100 Poin Otomatis</option>
                  </select>
                </div>

                {/* Document Display Checkboxes */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Opsi Kelengkapan Cetak:</span>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBobotOnNaskah}
                      onChange={(e) => setShowBobotOnNaskah(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>Tampilkan Bobot Skor pada Tiap Butir Soal</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPetunjukUmum}
                      onChange={(e) => setShowPetunjukUmum(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>Sertakan Kotak Petunjuk Pengerjaan Umum</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTandaTangan}
                      onChange={(e) => setShowTandaTangan(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>Sertakan Kolom Tanda Tangan Guru &amp; Kepala Sekolah</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identitas Sekolah Pembuat</p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Satuan Pendidikan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={namaSekolah}
                    onChange={(e) => handleSchoolChange(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white"
                    placeholder="SD Negeri Kalimantong"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dinas Pendidikan Daerah
                  </label>
                  <input
                    type="text"
                    value={dinasPendidikan}
                    onChange={(e) => setDinasPendidikan(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white"
                    placeholder="Dinas Pendidikan Kota Bandung"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tahun Pelajaran
                  </label>
                  <input
                    type="text"
                    value={tahunPelajaran}
                    onChange={(e) => setTahunPelajaran(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white"
                    placeholder="2026/2027"
                  />
                </div>
              </div>

              {apiError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2.5 rounded-lg text-xs leading-relaxed">
                  ⚠️ <strong>Gagal:</strong> {apiError}
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Menghitung &amp; Menulis Soal...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Susun Soal &amp; Kartu Soal</span>
                    </>
                  )}
                </button>

                {result && (
                  <button
                    type="button"
                    onClick={() => handleGenerate(undefined, true)}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs py-2.5 px-4 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    title="Acak butir soal dan buat variasi kombinasi baru tanpa soal yang sama"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Acak &amp; Susun Variasi Baru</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPromptMode('generator');
                    setShowPromptModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 text-purple-800 font-bold text-xs py-2.5 px-4 rounded-xl shadow-2xs transition-all cursor-pointer"
                  title="Dapatkan prompt rekayasa lengkap untuk dijalankan di Google Gemini atau ChatGPT"
                >
                  <Bot className="w-3.5 h-3.5 text-purple-600" />
                  <span>Prompt AI (Gemini / ChatGPT)</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Output View */}
        <div className="lg:col-span-8 space-y-6">
          {isGenerating ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[550px]">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-teal-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Menyusun Naskah Asesmen Sumatif...</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                Gemini AI sedang menelaah taksonomi kognitif dan menyusun Capaian Pembelajaran, Indikator Butir Soal, serta pedoman penskoran sesuai rubrik formal sekolah dasar. Harap tunggu sesaat...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {shuffleNotice && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs no-print">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{shuffleNotice}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-md">
                    Variasi Unik Aktif
                  </span>
                </div>
              )}

              {/* Action and Navigation Header */}
              <div className="bg-white rounded-xl shadow-xs p-4 border border-slate-100 flex flex-wrap gap-4 justify-between items-center no-print">
                {/* Result Tabs */}
                <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg gap-1">
                  <button
                    onClick={() => setResultTab('naskah')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${resultTab === 'naskah' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    📝 Naskah Soal
                  </button>
                  <button
                    onClick={() => setResultTab('kunci')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${resultTab === 'kunci' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    🔑 Kunci &amp; Rubrik
                  </button>
                  <button
                    onClick={() => setResultTab('kartu')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${resultTab === 'kartu' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    📇 Kartu Soal
                  </button>
                  <button
                    onClick={() => setResultTab('kisi')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${resultTab === 'kisi' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    📊 Kisi-Kisi Asesmen
                  </button>
                  <button
                    onClick={() => setResultTab('ljs')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${resultTab === 'ljs' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    📋 Lembar Jawab (LJS)
                  </button>
                </div>

                {/* Export Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {resultTab === 'naskah' && (
                    <button
                      onClick={handleExportNaskahDoc}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Naskah Word</span>
                    </button>
                  )}
                  {resultTab === 'kunci' && (
                    <button
                      onClick={handleExportKunciDoc}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Kunci Word</span>
                    </button>
                  )}
                  {resultTab === 'kartu' && (
                    <button
                      onClick={handleExportKartuSoalDoc}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Bundel Kartu Word</span>
                    </button>
                  )}
                  {resultTab === 'kisi' && (
                    <button
                      onClick={handleExportKisiKisiDoc}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Kisi-Kisi Word</span>
                    </button>
                  )}
                  {resultTab === 'ljs' && (
                    <button
                      onClick={handleExportLjsDoc}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh LJS Word</span>
                    </button>
                  )}

                  {/* Cetak Google Doc */}
                  <button
                    onClick={handleCetakGoogleDoc}
                    disabled={isCopyingGoogleDoc}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    title="Salin dokumen saat ini dan buka di Google Docs (docs.new) untuk dicetak / diedit"
                  >
                    {isCopyingGoogleDoc ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5" />
                    )}
                    <span>{isCopyingGoogleDoc ? 'Menyiapkan Docs...' : 'Cetak Google Doc'}</span>
                  </button>

                  {/* Ekspor JSON */}
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                    title="Ekspor seluruh struktur data soal, kunci, dan kartu soal dalam format file .JSON standar"
                  >
                    <FileJson className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ekspor JSON</span>
                  </button>

                  {/* Prompt AI (Gemini / ChatGPT) */}
                  <button
                    onClick={() => setShowPromptModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
                    title="Buka dan salin prompt rekayasa AI untuk Google Gemini atau ChatGPT"
                  >
                    <Bot className="w-3.5 h-3.5 text-purple-200" />
                    <span>Prompt AI (Gemini / ChatGPT)</span>
                  </button>

                  <button
                    onClick={() => handleGenerate(undefined, true)}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg transition-colors border border-emerald-300 shadow-2xs cursor-pointer disabled:opacity-50"
                    title="Acak butir soal dan dapatkan susunan variasi baru tanpa duplikasi"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Acak Variasi Baru</span>
                  </button>

                  <button
                    onClick={handleCopyClipboard}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-200 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Teks</span>
                  </button>

                  <button
                    onClick={handleCetakPdf}
                    disabled={isExportingPdf}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-60"
                    title="Cetak dan simpan berkas PDF standar A4 resmi langsung ke komputer/HP"
                  >
                    {isExportingPdf ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Printer className="w-3.5 h-3.5" />
                    )}
                    <span>{isExportingPdf ? 'Memproses PDF...' : 'Cetak PDF'}</span>
                  </button>

                  <button
                    onClick={handlePrintPreview}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-200 cursor-pointer"
                    title="Buka dialog cetak langsung ke printer fisik"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print Pratinjau</span>
                  </button>
                </div>
              </div>

              {/* PDF Feedback Alert */}
              {pdfNotice && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in duration-200 no-print">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{pdfNotice}</span>
                  </div>
                  <button onClick={() => setPdfNotice(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold underline ml-3 cursor-pointer">Tutup</button>
                </div>
              )}

              {/* Quick Filter Bar by Question Type for Naskah & Kartu Soal */}
              {(resultTab === 'naskah' || resultTab === 'kartu') && (
                <div className="bg-white rounded-xl shadow-xs px-4 py-2.5 border border-slate-100 flex flex-wrap items-center justify-between gap-2 no-print">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                    <Filter className="w-3.5 h-3.5 text-teal-600" />
                    <span>Filter Bentuk Soal:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {[
                      { id: 'all', label: 'Semua Bentuk' },
                      { id: 'Pilihan Ganda', label: 'Pilihan Ganda' },
                      { id: 'Pilihan Ganda Kompleks', label: 'PG Kompleks' },
                      { id: 'Menjodohkan', label: 'Menjodohkan' },
                      { id: 'Isian Singkat', label: 'Isian' },
                      { id: 'Uraian', label: 'Uraian' }
                    ].map((f) => {
                      const count = f.id === 'all' 
                        ? result.questions.length 
                        : result.questions.filter(q => q.bentukSoal === f.id).length;
                      if (count === 0 && f.id !== 'all') return null;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setFilterBentukSoal(f.id)}
                          className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                            filterBentukSoal === f.id
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {f.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Printable Wrapper for Document Content */}
              <div ref={printableContentRef} id="printable-sumatif-container" className="printable-document-sheet space-y-6">
              {/* RENDER TAB 1: NASKAH SOAL SISWA */}
              {resultTab === 'naskah' && (
                <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-8 space-y-6 print:p-0 print:border-none print:shadow-none">
                  
                  {/* Formal kop */}
                  <div className="text-center border-b-4 border-double border-slate-800 pb-3 mb-6 relative">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 leading-tight">
                      {result.kop.dinasPendidikan || 'DINAS PENDIDIKAN DAERAH'}
                    </p>
                    <h2 className="text-base font-extrabold uppercase mt-1 tracking-tight text-slate-800">
                      {result.kop.namaSekolah}
                    </h2>
                    <p className="text-[9.5px] text-slate-400 italic mt-0.5">
                      Alamat Satuan Pendidikan Utama &bull; Kurikulum Merdeka Terintegrasi AI
                    </p>
                  </div>

                  <h3 className="text-center text-sm font-black uppercase text-slate-800 tracking-wide">
                    {result.judulUjian}
                  </h3>

                  {/* Student Identity Grid */}
                  <div className="border border-slate-400 rounded-lg p-4 bg-slate-50/50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-xs font-semibold">
                      <div className="flex gap-1.5">
                        <span className="text-slate-400 w-24">Mata Pelajaran</span>
                        <span className="text-slate-800">: {result.kop.mataPelajaran}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="text-slate-400 w-24">Nama Lengkap</span>
                        <span className="text-slate-300">: _________________________</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="text-slate-400 w-24">Hari / Tanggal</span>
                        <span className="text-slate-300">: _________________________</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="text-slate-400 w-24">Kelas / Semester</span>
                        <span className="text-slate-800">: Kelas {result.kop.kelas} / {result.kop.semester}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="text-slate-400 w-24">Nomor Absen</span>
                        <span className="text-slate-300">: _________________________</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="text-slate-400 w-24">Nilai Kinerja</span>
                        <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 font-extrabold">: ______ / ______</span>
                      </div>
                      <div className="flex gap-1.5 col-span-2 md:col-span-3 pt-1 border-t border-slate-200">
                        <span className="text-slate-400 w-24 shrink-0">Lingkup Materi</span>
                        <span className="text-slate-800 font-bold">
                          : {result.kop.lingkupMateriList && result.kop.lingkupMateriList.length > 0 
                              ? result.kop.lingkupMateriList.map((m, mIdx) => `Bab ${mIdx + 1}: ${m}`).join(' • ')
                              : result.kop.lingkupMateri || babMateri}
                        </span>
                      </div>
                      <div className="flex gap-1.5 col-span-2 md:col-span-3 pt-1 border-t border-slate-200">
                        <span className="text-slate-400 w-24 shrink-0">Bentuk Soal</span>
                        <div className="flex-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-teal-800 font-bold">
                            : {result.kop.bentukSoalSummary 
                                ? result.kop.bentukSoalSummary
                                : (result.kop.bentukSoalList && result.kop.bentukSoalList.length > 0 
                                    ? result.kop.bentukSoalList.join(', ') 
                                    : result.kop.bentukSoal || 'Pilihan Ganda')}
                          </span>
                          <span className="text-[10.5px] px-2 py-0.2 rounded-full bg-teal-50 border border-teal-200 text-teal-700 font-bold">
                            Total {result.questions.length} Soal
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* General Instructions */}
                  {showPetunjukUmum && (
                    <div className="border border-slate-200/80 bg-slate-50 rounded-lg p-3 text-xs leading-relaxed text-slate-600">
                      <strong>Petunjuk Umum Pengisian:</strong>
                      <ol className="list-decimal pl-4 mt-1.5 space-y-1">
                        <li>Tulis terlebih dahulu identitas diri Anda pada kolom yang disediakan.</li>
                        <li>Periksa kelengkapan soal dan tanyakan kepada guru apabila terdapat cetakan yang kurang jelas.</li>
                        <li>Kerjakan soal-soal secara mandiri, jujur, dan penuh rasa sportivitas tinggi.</li>
                        <li>Periksa kembali pekerjaan Anda sebelum dikumpulkan kepada guru pengampu.</li>
                      </ol>
                    </div>
                  )}

                  {/* Question list */}
                  <div className="space-y-6 pt-2">
                    {result.questions
                      .filter(q => filterBentukSoal === 'all' || q.bentukSoal === filterBentukSoal)
                      .map((q, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-md bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 font-mono shadow-xs">
                            {q.noSoal || idx + 1}
                          </span>
                          <div className="space-y-2 flex-1">
                            {/* Badges Bentuk Soal & Level */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-teal-100 text-teal-900 border border-teal-200">
                                {q.bentukSoal}
                              </span>
                              {q.lingkupMateri && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {q.lingkupMateri}
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200/70 text-slate-700">
                                {q.levelKognitif}
                              </span>
                              {showBobotOnNaskah && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                  Bobot: {q.bobotSkor || 1} Poin
                                </span>
                              )}
                              {q.dimensiP3 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  P3: {q.dimensiP3}
                                </span>
                              )}
                            </div>

                            <p className="font-semibold text-xs sm:text-sm text-slate-900 leading-relaxed">
                              {q.question}
                            </p>

                            {/* Conditional Rendering by Bentuk Soal */}
                            {q.bentukSoal === 'Pilihan Ganda Kompleks' || (q.pernyataanKompleks && q.pernyataanKompleks.length > 0) ? (
                              <div className="mt-3 overflow-x-auto">
                                <p className="text-[11px] italic text-slate-500 mb-1.5 font-medium">
                                  Berikan tanda centang (✓) pada pilihan Benar atau Salah sesuai stimulus:
                                </p>
                                <table className="w-full text-xs border border-slate-300 rounded-lg overflow-hidden bg-white">
                                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-700">
                                    <tr>
                                      <th className="p-2 text-center w-10">No</th>
                                      <th className="p-2 text-left">Pernyataan</th>
                                      <th className="p-2 text-center w-20">Benar</th>
                                      <th className="p-2 text-center w-20">Salah</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 text-slate-800">
                                    {(q.pernyataanKompleks || []).map((item, pIdx) => (
                                      <tr key={pIdx} className="hover:bg-slate-50/70">
                                        <td className="p-2 text-center font-mono font-bold text-slate-500">{pIdx + 1}</td>
                                        <td className="p-2 leading-relaxed">{item.pernyataan}</td>
                                        <td className="p-2 text-center">
                                          <span className="inline-block w-4 h-4 border-2 border-slate-400 rounded-sm"></span>
                                        </td>
                                        <td className="p-2 text-center">
                                          <span className="inline-block w-4 h-4 border-2 border-slate-400 rounded-sm"></span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : q.bentukSoal === 'Menjodohkan' || (q.menjodohkanPairs && q.menjodohkanPairs.length > 0) ? (
                              <div className="mt-3 space-y-2">
                                <p className="text-[11px] italic text-slate-500 font-medium">
                                  Pasangkanlah konsep pada Kolom A dengan jawaban yang tepat pada Kolom B:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div className="bg-white border border-slate-300 rounded-lg p-3 space-y-2">
                                    <div className="font-bold text-slate-700 border-b pb-1 text-[11px] uppercase tracking-wider">
                                      Kolom A (Konsep / Premis)
                                    </div>
                                    {(q.menjodohkanPairs || []).map((pair, pairIdx) => (
                                      <div key={pairIdx} className="p-1.5 bg-slate-50 rounded border border-slate-200 font-semibold text-slate-800">
                                        {pair.premis}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="bg-white border border-slate-300 rounded-lg p-3 space-y-2">
                                    <div className="font-bold text-slate-700 border-b pb-1 text-[11px] uppercase tracking-wider">
                                      Kolom B (Pasangan / Deskripsi)
                                    </div>
                                    {(q.menjodohkanPairs || []).map((pair, pairIdx) => (
                                      <div key={pairIdx} className="p-1.5 bg-slate-50 rounded border border-slate-200 text-slate-700">
                                        {pair.pasangan}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2 text-xs text-amber-900 flex items-center gap-2">
                                  <span className="font-bold">Lembar Jawaban Siswa:</span>
                                  <span>{(q.menjodohkanPairs || []).map((_, i) => `${i + 1} ➔ [ .... ]`).join('  •  ')}</span>
                                </div>
                              </div>
                            ) : q.bentukSoal === 'Isian Singkat' ? (
                              <div className="pt-2 pb-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                  <span>Jawaban Singkat:</span>
                                  <div className="flex-1 border-b-2 border-dotted border-slate-400 h-6"></div>
                                </div>
                              </div>
                            ) : q.bentukSoal === 'Uraian' ? (
                              <div className="pt-2 pb-3 space-y-3">
                                <div className="border-b border-dashed border-slate-300 w-full h-4"></div>
                                <div className="border-b border-dashed border-slate-300 w-full h-4"></div>
                                <div className="border-b border-dashed border-slate-300 w-full h-4"></div>
                              </div>
                            ) : q.options && q.options.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {q.options.map((opt, optIdx) => (
                                  <div 
                                    key={optIdx} 
                                    className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                                  >
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="pt-2 pb-3 space-y-3">
                                <div className="border-b border-dashed border-slate-300 w-full h-4"></div>
                                <div className="border-b border-dashed border-slate-300 w-full h-4"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Signature Section */}
                  {showTandaTangan && (
                    <div className="grid grid-cols-2 text-center text-xs pt-12 border-t border-slate-100">
                      <div>
                        <p className="text-slate-500">Mengetahui,</p>
                        <p className="font-extrabold text-slate-850 mt-0.5">Kepala Sekolah</p>
                        <div className="h-16"></div>
                        <p className="font-extrabold text-slate-800 underline">________________________</p>
                        <p className="text-[10px] text-slate-400">NIP. ____________________</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Bandung, _________________</p>
                        <p className="font-extrabold text-slate-850 mt-0.5">Guru Pengampu Mapel</p>
                        <div className="h-16"></div>
                        <p className="font-extrabold text-slate-800 underline">________________________</p>
                        <p className="text-[10px] text-slate-400">NIP. ____________________</p>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* RENDER TAB 2: KUNCI JAWABAN & RUBRIK GURU */}
              {resultTab === 'kunci' && (
                <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-8 space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">Kunci Jawaban &amp; Pedoman Penskoran Resmi</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lingkup Materi: <strong>{result.kop.lingkupMateriList && result.kop.lingkupMateriList.length > 0 ? result.kop.lingkupMateriList.map((m, idx) => `Bab ${idx + 1}: ${m}`).join(' • ') : result.kop.lingkupMateri || babMateri}</strong> &bull; Kelas {grade} SD
                    </p>
                  </div>

                  <div className="space-y-6 divide-y divide-slate-100">
                    {result.questions.map((q, idx) => (
                      <div key={idx} className={`pt-6 ${idx === 0 ? 'pt-0' : ''} space-y-3`}>
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 font-mono">
                            {idx + 1}
                          </span>
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]">
                                {q.bentukSoal}
                              </span>
                              {q.lingkupMateri && (
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                                  {q.lingkupMateri}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                                {q.levelKognitif}
                              </span>
                            </div>
                            <p className="font-bold text-xs sm:text-sm text-slate-800">
                              {q.question}
                            </p>
                            <div className="bg-teal-50/50 border border-teal-100 p-3.5 rounded-xl space-y-2">
                              <p className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                                Kunci Jawaban: <span className="bg-teal-100 px-2.5 py-0.5 rounded text-teal-950">{q.correctAnswer}</span>
                              </p>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                <strong>Penjelasan Analitis:</strong> {q.explanation}
                              </p>
                            </div>
                            <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl">
                              <p className="text-xs font-bold text-amber-900">
                                📋 Pedoman &amp; Kriteria Penskoran:
                              </p>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {q.pedomanPenskoran}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RENDER TAB 3: KARTU SOAL SUMATIF */}
              {resultTab === 'kartu' && (
                <div className="space-y-6">
                  {/* Card selector deck & view mode */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 no-print">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveCardIdx(prev => Math.max(0, prev - 1))}
                        disabled={activeCardIdx === 0}
                        className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 text-slate-600"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-xs font-extrabold text-slate-700">
                        Kartu Soal {activeCardIdx + 1} dari {result.questions.length}
                      </span>
                      <button
                        onClick={() => setActiveCardIdx(prev => Math.min(result.questions.length - 1, prev + 1))}
                        disabled={activeCardIdx === result.questions.length - 1}
                        className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 text-slate-600"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewAllCards(!viewAllCards)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          viewAllCards
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {viewAllCards ? '👁️ Tampilkan Per Kartu' : '📜 Tampilkan Semua Kartu'}
                      </button>

                      <button
                        onClick={handleCetakGoogleDoc}
                        disabled={isCopyingGoogleDoc}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Buka dan cetak bundel kartu soal di Google Docs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                        <span>Cetak Kartu ke Docs</span>
                      </button>

                      <div className="hidden sm:flex gap-1.5">
                        {result.questions.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setActiveCardIdx(i);
                              setViewAllCards(false);
                            }}
                            className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${activeCardIdx === i && !viewAllCards ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* The Kartu Soal Paper Grid */}
                  {result.questions
                    .filter(q => filterBentukSoal === 'all' || q.bentukSoal === filterBentukSoal)
                    .map((q, qIndex) => {
                    const originalIdx = result.questions.indexOf(q);
                    const isVisible = viewAllCards || activeCardIdx === originalIdx;
                    return (
                    <div 
                      key={qIndex} 
                      className={`bg-white rounded-xl border-2 border-slate-300 p-6 shadow-md ${isVisible ? 'block mb-6' : 'hidden'}`}
                    >
                      <div className="text-center bg-slate-50 border border-slate-300 p-3 rounded-lg mb-4">
                        <h4 className="text-xs sm:text-sm font-black uppercase text-slate-800 leading-tight">
                          KARTU SOAL SUMATIF SD (KURIKULUM MERDEKA)
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {result.kop.namaSekolah} &bull; {result.kop.dinasPendidikan}
                        </p>
                      </div>

                      {/* Main grids */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-3">
                          <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left">
                              <tbody>
                                <tr className="border-b border-slate-100">
                                  <td className="p-2 bg-slate-50 font-bold text-slate-600" width="40%">Mata Pelajaran</td>
                                  <td className="p-2 text-slate-800 font-semibold">{result.kop.mataPelajaran}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                  <td className="p-2 bg-slate-50 font-bold text-slate-600">Kelas / Semester</td>
                                  <td className="p-2 text-slate-800">Kelas {result.kop.kelas} / {result.kop.semester}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                  <td className="p-2 bg-slate-50 font-bold text-slate-600">Tahun Pelajaran</td>
                                  <td className="p-2 text-slate-800">{result.kop.tahunPelajaran}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                  <td className="p-2 bg-slate-50 font-bold text-slate-600">Lingkup Materi</td>
                                  <td className="p-2 text-blue-700 font-bold">{q.lingkupMateri || babMateri}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 bg-slate-50 font-bold text-slate-600">Bobot Skor</td>
                                  <td className="p-2 font-black text-amber-700">{q.bobotSkor || 1} Poin</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left">
                              <tbody>
                                <tr className="border-b border-slate-100">
                                  <td className="p-2 bg-slate-50 font-bold text-slate-600" width="40%">Bentuk Soal</td>
                                  <td className="p-2 text-slate-800 font-bold">{q.bentukSoal}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                  <td className="p-2 bg-slate-50 font-bold text-slate-600">Nomor Soal</td>
                                  <td className="p-2 font-black text-amber-600 text-sm">{q.noSoal}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                  <td className="p-2 bg-slate-50 font-bold text-slate-600">Level Kognitif</td>
                                  <td className="p-2 text-slate-800 font-semibold">{q.levelKognitif}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 bg-slate-50 font-bold text-slate-600">Dimensi P3</td>
                                  <td className="p-2 text-indigo-700 font-medium">{q.dimensiP3 || 'Gotong Royong & Mandiri'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* CP / Kompetensi & Indikator */}
                        <div className="space-y-3">
                          <div className="bg-amber-50/20 border border-amber-200/50 p-3 rounded-lg text-[11px] leading-relaxed">
                            <strong className="text-amber-800 text-[10px] uppercase tracking-wider block mb-1">Capaian Pembelajaran (CP):</strong>
                            <p className="text-slate-700">{q.capaianPembelajaran}</p>
                          </div>

                          <div className="bg-indigo-50/20 border border-indigo-200/50 p-3 rounded-lg text-[11px] leading-relaxed">
                            <strong className="text-indigo-800 text-[10px] uppercase tracking-wider block mb-1">Indikator Soal:</strong>
                            <p className="text-slate-700">{q.indikatorSoal}</p>
                          </div>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="mt-4 border border-slate-200 rounded-lg p-4 bg-slate-50/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">RUMUSAN BUTIR SOAL:</span>
                          <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            Bentuk: {q.bentukSoal}
                          </span>
                        </div>
                        <p className="font-extrabold text-xs sm:text-sm text-slate-800 leading-relaxed">
                          {q.question}
                        </p>

                        {/* Format-specific display */}
                        {q.bentukSoal === 'Pilihan Ganda Kompleks' || (q.pernyataanKompleks && q.pernyataanKompleks.length > 0) ? (
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-xs border border-slate-300 rounded bg-white">
                              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                                <tr>
                                  <th className="p-1.5 text-center w-8">No</th>
                                  <th className="p-1.5 text-left">Pernyataan</th>
                                  <th className="p-1.5 text-center w-16">Benar</th>
                                  <th className="p-1.5 text-center w-16">Salah</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 text-slate-700">
                                {(q.pernyataanKompleks || []).map((item, pIdx) => (
                                  <tr key={pIdx}>
                                    <td className="p-1.5 text-center font-bold text-slate-400">{pIdx + 1}</td>
                                    <td className="p-1.5">{item.pernyataan}</td>
                                    <td className="p-1.5 text-center">[ &nbsp; ]</td>
                                    <td className="p-1.5 text-center">[ &nbsp; ]</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : q.bentukSoal === 'Menjodohkan' || (q.menjodohkanPairs && q.menjodohkanPairs.length > 0) ? (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="bg-white border border-slate-300 rounded p-2 space-y-1">
                              <span className="font-bold text-slate-700 text-[10px] uppercase">Kolom A:</span>
                              {(q.menjodohkanPairs || []).map((pair, pIdx) => (
                                <div key={pIdx} className="p-1 bg-slate-50 rounded text-slate-800 font-medium">
                                  {pair.premis}
                                </div>
                              ))}
                            </div>
                            <div className="bg-white border border-slate-300 rounded p-2 space-y-1">
                              <span className="font-bold text-slate-700 text-[10px] uppercase">Kolom B:</span>
                              {(q.menjodohkanPairs || []).map((pair, pIdx) => (
                                <div key={pIdx} className="p-1 bg-slate-50 rounded text-slate-700">
                                  {pair.pasangan}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : q.options && q.options.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="bg-white border border-slate-200 rounded-md p-2 text-xs text-slate-600">
                                {opt}
                              </div>
                            ))}
                          </div>
                        ) : q.bentukSoal === 'Isian Singkat' ? (
                          <div className="mt-2 text-xs text-slate-600 italic">
                            [Lembar isian singkat siswa]
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-slate-600 italic">
                            [Lembar uraian penalaran terstruktur]
                          </div>
                        )}
                      </div>

                      {/* Footer Grid: Kunci & Pedoman Penskoran */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                          <strong className="text-[10px] uppercase tracking-widest text-emerald-800 block mb-1">KUNCI JAWABAN GURU:</strong>
                          <span className="text-sm font-black text-emerald-950 bg-emerald-150 px-2.5 py-0.5 rounded border border-emerald-300">
                            {q.correctAnswer}
                          </span>
                          <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed">
                            <strong>Analisis:</strong> {q.explanation}
                          </p>
                        </div>

                        <div className="bg-teal-50/30 border border-teal-200 p-4 rounded-lg">
                          <strong className="text-[10px] uppercase tracking-widest text-teal-800 block mb-1">PEDOMAN PENSKORAN:</strong>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                            {q.pedomanPenskoran}
                          </p>
                        </div>
                      </div>
                    </div>
                  );})}
                </div>
              )}

              {/* RENDER TAB 4: KISI-KISI ASESMEN SUMATIF */}
              {resultTab === 'kisi' && (
                <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-8 space-y-6">
                  {/* Header Kisi-kisi */}
                  <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 leading-tight">
                      {result.kop.dinasPendidikan || 'DINAS PENDIDIKAN DAERAH'}
                    </p>
                    <h2 className="text-base font-extrabold uppercase mt-1 tracking-tight text-slate-800">
                      {result.kop.namaSekolah}
                    </h2>
                    <h3 className="text-sm font-black text-blue-800 uppercase mt-1">
                      MATRIKS KISI-KISI PENULISAN SOAL ASESMEN SUMATIF
                    </h3>
                  </div>

                  {/* Metadata Table */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400 font-bold block">Mata Pelajaran:</span>
                      <span className="text-slate-800 font-semibold">{result.kop.mataPelajaran}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Kelas / Semester:</span>
                      <span className="text-slate-800 font-semibold">Kelas {result.kop.kelas} / {result.kop.semester}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Tahun Pelajaran:</span>
                      <span className="text-slate-800 font-semibold">{result.kop.tahunPelajaran}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Kurikulum:</span>
                      <span className="text-slate-800 font-semibold">Kurikulum Merdeka</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Jumlah Soal:</span>
                      <span className="text-slate-800 font-semibold">{result.questions.length} Butir Soal</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Total Skor Maksimal:</span>
                      <span className="text-teal-700 font-bold">{result.questions.reduce((acc, q) => acc + (q.bobotSkor || 1), 0)} Poin</span>
                    </div>
                    <div className="col-span-2 md:col-span-3 pt-1 border-t border-slate-200">
                      <span className="text-slate-400 font-bold block">Lingkup Materi Terpilih:</span>
                      <span className="text-slate-800 font-bold">
                        {result.kop.lingkupMateriList && result.kop.lingkupMateriList.length > 0 
                          ? result.kop.lingkupMateriList.map((m, idx) => `Bab ${idx + 1}: ${m}`).join(' • ')
                          : result.kop.lingkupMateri || babMateri}
                      </span>
                    </div>
                  </div>

                  {/* Matrix Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-slate-300 rounded-lg overflow-hidden">
                      <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold text-center">
                        <tr>
                          <th className="p-2 border-r border-slate-300 w-8">No</th>
                          <th className="p-2 border-r border-slate-300 text-left w-1/4">Capaian Pembelajaran (CP)</th>
                          <th className="p-2 border-r border-slate-300 text-left w-1/6">Lingkup Materi</th>
                          <th className="p-2 border-r border-slate-300 text-left w-1/4">Indikator Soal</th>
                          <th className="p-2 border-r border-slate-300 w-20">Level Kognitif</th>
                          <th className="p-2 border-r border-slate-300 w-24">Bentuk Soal</th>
                          <th className="p-2 border-r border-slate-300 w-12">No. Soal</th>
                          <th className="p-2 w-12">Bobot</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800">
                        {result.questions.map((q, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-500 font-mono">{idx + 1}</td>
                            <td className="p-2 border-r border-slate-200 leading-relaxed">{q.capaianPembelajaran}</td>
                            <td className="p-2 border-r border-slate-200 font-medium text-slate-700">{q.lingkupMateri || babMateri}</td>
                            <td className="p-2 border-r border-slate-200 leading-relaxed">{q.indikatorSoal}</td>
                            <td className="p-2 border-r border-slate-200 text-center">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-[10px] text-slate-700">
                                {q.levelKognitif}
                              </span>
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center">
                              <span className="px-1.5 py-0.5 rounded bg-teal-50 font-bold text-[10px] text-teal-800 border border-teal-200">
                                {q.bentukSoal}
                              </span>
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center font-black text-slate-800">{q.noSoal}</td>
                            <td className="p-2 text-center font-bold text-amber-700">{q.bobotSkor || 1}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures */}
                  {showTandaTangan && (
                    <div className="grid grid-cols-2 text-center text-xs pt-8 border-t border-slate-100">
                      <div>
                        <p className="text-slate-500">Mengetahui,</p>
                        <p className="font-extrabold text-slate-850 mt-0.5">Kepala Sekolah</p>
                        <div className="h-16"></div>
                        <p className="font-extrabold text-slate-800 underline">________________________</p>
                        <p className="text-[10px] text-slate-400">NIP. ____________________</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Bandung, _________________</p>
                        <p className="font-extrabold text-slate-850 mt-0.5">Guru Mata Pelajaran</p>
                        <div className="h-16"></div>
                        <p className="font-extrabold text-slate-800 underline">________________________</p>
                        <p className="text-[10px] text-slate-400">NIP. ____________________</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RENDER TAB 5: LEMBAR JAWAB SISWA (LJS) */}
              {resultTab === 'ljs' && (
                <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-8 space-y-6">
                  {/* Kop LJS */}
                  <div className="text-center border-b-4 border-double border-slate-800 pb-3 mb-4">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 leading-tight">
                      {result.kop.dinasPendidikan || 'DINAS PENDIDIKAN DAERAH'}
                    </p>
                    <h2 className="text-base font-extrabold uppercase mt-1 tracking-tight text-slate-800">
                      {result.kop.namaSekolah}
                    </h2>
                    <h3 className="text-sm font-black text-emerald-800 uppercase mt-1">
                      LEMBAR JAWABAN ASESMEN SUMATIF (LJS)
                    </h3>
                  </div>

                  {/* Student info */}
                  <div className="border border-slate-400 rounded-lg p-3 bg-slate-50 text-xs">
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                      <div>
                        <span className="font-bold text-slate-600">Nama Siswa:</span>
                        <div className="border-b border-dotted border-slate-500 h-5 mt-0.5"></div>
                      </div>
                      <div>
                        <span className="font-bold text-slate-600">Mata Pelajaran:</span>
                        <div className="font-semibold text-slate-800 mt-0.5">{result.kop.mataPelajaran}</div>
                      </div>
                      <div>
                        <span className="font-bold text-slate-600">Nomor Peserta / Absen:</span>
                        <div className="border-b border-dotted border-slate-500 h-5 mt-0.5"></div>
                      </div>
                      <div>
                        <span className="font-bold text-slate-600">Kelas / Semester:</span>
                        <div className="font-semibold text-slate-800 mt-0.5">Kelas {result.kop.kelas} / {result.kop.semester}</div>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200">
                        <span className="font-bold text-slate-600">Lingkup Materi:</span>
                        <div className="font-semibold text-slate-800 mt-0.5">
                          {result.kop.lingkupMateriList && result.kop.lingkupMateriList.length > 0 
                            ? result.kop.lingkupMateriList.map((m, idx) => `Bab ${idx + 1}: ${m}`).join(' • ')
                            : result.kop.lingkupMateri || babMateri}
                        </div>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200">
                        <span className="font-bold text-slate-600">Bentuk Soal:</span>
                        <div className="font-semibold text-teal-800 mt-0.5">
                          {result.kop.bentukSoalSummary 
                            ? `${result.kop.bentukSoalSummary} (Total: ${result.questions.length} Butir Soal)`
                            : (result.kop.bentukSoalList && result.kop.bentukSoalList.length > 0 
                                ? result.kop.bentukSoalList.join(', ')
                                : result.kop.bentukSoal || 'Pilihan Ganda')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bagian Pilihan Ganda (jika ada) */}
                  {result.questions.some(q => q.bentukSoal === 'Pilihan Ganda') && (
                    <div className="border border-slate-300 rounded-lg p-4">
                      <h4 className="font-extrabold text-xs text-slate-800 uppercase mb-1">
                        LEMBAR JAWABAN: PILIHAN GANDA
                      </h4>
                      <p className="text-[11px] text-slate-500 mb-3">
                        Berilah tanda silang (X) atau hitamkan lingkaran huruf jawaban yang Anda pilih:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {result.questions.filter(q => q.bentukSoal === 'Pilihan Ganda').map((q) => (
                          <div key={q.noSoal} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-xs">
                            <span className="font-black w-6 text-slate-700">{q.noSoal}.</span>
                            <div className="flex items-center gap-2">
                              {(jumlahOpsiPG === '3' ? ['A', 'B', 'C'] : jumlahOpsiPG === '5' ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D']).map((opt) => (
                                <span key={opt} className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-slate-400 font-bold text-slate-700 hover:border-teal-500">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bagian Non-Pilihan Ganda (PGK, Menjodohkan, Isian, Uraian) */}
                  {result.questions.some(q => q.bentukSoal !== 'Pilihan Ganda') && (
                    <div className="border border-slate-300 rounded-lg p-4 space-y-3">
                      <h4 className="font-extrabold text-xs text-slate-800 uppercase">
                        LEMBAR JAWABAN: NON-PILIHAN GANDA (PG KOMPLEKS / MENJODOHKAN / ISIAN / URAIAN)
                      </h4>
                      <div className="space-y-4">
                        {result.questions.filter(q => q.bentukSoal !== 'Pilihan Ganda').map((q) => (
                          <div key={q.noSoal} className="flex items-start gap-2 text-xs">
                            <div className="w-24 shrink-0 pt-1 flex flex-col">
                              <span className="font-black text-slate-800">Nomor {q.noSoal}</span>
                              <span className="text-[10px] text-teal-700 font-semibold leading-tight">[{q.bentukSoal}]</span>
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="border-b border-dotted border-slate-400 h-6"></div>
                              <div className="border-b border-dotted border-slate-400 h-6"></div>
                              {q.bentukSoal === 'Uraian' && (
                                <div className="border-b border-dotted border-slate-400 h-6"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Score box */}
                  <div className="grid grid-cols-3 text-center text-xs border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                    <div className="p-3 border-r border-slate-300">
                      <span className="font-bold text-slate-600 block">Nilai / Skor Akhir</span>
                      <div className="h-10 mt-1 flex items-center justify-center text-lg font-black text-teal-700"></div>
                    </div>
                    <div className="p-3 border-r border-slate-300">
                      <span className="font-bold text-slate-600 block">Tanda Tangan Guru</span>
                      <div className="h-10 mt-1"></div>
                    </div>
                    <div className="p-3">
                      <span className="font-bold text-slate-600 block">Tanda Tangan Orang Tua</span>
                      <div className="h-10 mt-1"></div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400 flex flex-col items-center justify-center min-h-[450px]">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <BrainCircuit className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-base font-bold text-slate-700">Belum Ada Soal Sumatif</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                Tentukan target asesmen sumatif (seperti STS atau SAS), pilih kelas, dan masukkan materi pokok di panel samping untuk memformulasikan soal ujian yang berimbang.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white p-4 sm:p-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
                  <Bot className="w-6 h-6 text-purple-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                      Prompt Rekayasa AI (Gemini &amp; ChatGPT)
                    </h3>
                    <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Kurikulum Merdeka
                    </span>
                  </div>
                  <p className="text-xs text-purple-100 mt-1">
                    Gunakan prompt terstruktur ini langsung di Google Gemini atau ChatGPT untuk menyusun instrumen, telaah kualitatif, atau variasi soal.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPromptModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                title="Tutup dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs for Prompt Mode */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 pt-3 flex flex-wrap gap-2 text-xs font-bold">
              <button
                onClick={() => setPromptMode('generator')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  promptMode === 'generator'
                    ? 'border-purple-600 text-purple-700 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pembuat Soal &amp; Kartu Soal Baru</span>
              </button>
              <button
                onClick={() => setPromptMode('reviewer')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  promptMode === 'reviewer'
                    ? 'border-purple-600 text-purple-700 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Telaah &amp; Validasi Butir Soal</span>
              </button>
              <button
                onClick={() => setPromptMode('variasi')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  promptMode === 'variasi'
                    ? 'border-purple-600 text-purple-700 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Paket B / Soal Paralel (Remedial)</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Quick Instructions & AI Launchers */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-50/70 border border-purple-200/80 p-3 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-purple-900 font-medium">
                  <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-[11px] shrink-0">
                    💡
                  </span>
                  <span>Salin prompt di bawah, lalu langsung buka model AI pilihan Anda:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleOpenGemini}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
                    title="Buka Google Gemini di tab baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Google Gemini</span>
                  </button>
                  <button
                    onClick={handleOpenChatGPT}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
                    title="Buka ChatGPT di tab baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka ChatGPT</span>
                  </button>
                </div>
              </div>

              {/* Prompt Text Container */}
              <div className="relative rounded-xl border border-slate-300 bg-slate-900 text-slate-100 overflow-hidden shadow-inner">
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-mono font-semibold text-slate-300">Prompt AI Format Markdown ({promptMode})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{generateAiPrompt(promptMode).length} karakter</span>
                    <button
                      onClick={() => handleCopyPrompt(promptMode)}
                      className="flex items-center gap-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      {isPromptCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={generateAiPrompt(promptMode)}
                  rows={12}
                  className="w-full p-4 bg-transparent text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-hidden"
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                * Prompt ini telah dioptimalkan dengan teknik <em>System Role &amp; Constraint Prompting</em> agar output AI konsisten dengan format rubrik Kurikulum Merdeka, Taksonomi Bloom, dan standar Kartu Soal nasional.
              </p>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPromptTxt(promptMode)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unduh Berkas .TXT</span>
                </button>
                {result && (
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                  >
                    <FileJson className="w-3.5 h-3.5 text-amber-600" />
                    <span>Unduh Data JSON</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyPrompt(promptMode)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isPromptCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{isPromptCopied ? 'Prompt Berhasil Disalin!' : 'Salin Seluruh Prompt'}</span>
                </button>
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800 font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
