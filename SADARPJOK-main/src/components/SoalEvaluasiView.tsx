import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
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
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  RefreshCw,
  FileText,
  Lightbulb
} from 'lucide-react';
import { exportSoalToDoc, downloadDocFile, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getUlanganHarianPrompts } from '../utils/aiPromptGenerators';

export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

// Rekomendasi Topik Materi PJOK SD per Tingkat Kelas
const GRADE_PRESET_TOPICS: { [grade: string]: string[] } = {
  '1': [
    'Variasi Gerak Dasar Lokomotor (Jalan & Lari)',
    'Gerak Dasar Non-Lokomotor (Mengayun & Memutar)',
    'Pola Makan Bergizi & Kebersihan Diri'
  ],
  '2': [
    'Gerak Menekuk, Meliuk, dan Memutar Tubuh',
    'Aktivitas Senam Ketangkasan & Keseimbangan',
    'Memelihara Kebersihan Lingkungan Sekolah'
  ],
  '3': [
    'Kombinasi Gerak Lari dan Lompat Jauh',
    'Permainan Tradisional & Kerjasama Tim',
    'Memilih Makanan Sehat dan Jajanan Higienis'
  ],
  '4': [
    'Permainan Bola Besar: Sepak Bola (Passing & Dribble)',
    'Permainan Bola Kecil: Kasti (Melempar & Menangkap)',
    'Aktivitas Kebugaran Jasmani Daya Tahan & Kelincahan'
  ],
  '5': [
    'Permainan Bola Voli (Passing Bawah & Servis)',
    'Senam Lantai: Guling Depan & Sikap Lilin',
    'Bahaya Merokok, Minuman Keras, dan NAPZA'
  ],
  '6': [
    'Permainan Bola Basket (Chest Pass & Dribble)',
    'Aktivitas Air: Renang Gaya Dada & Keselamatan Kolam',
    'Pemeliharaan Kebersihan Alat Reproduksi'
  ]
};

export default function SoalEvaluasiView() {
  const [grade, setGrade] = useState('4');
  const [materi, setMateri] = useState('Permainan Bola Besar: Sepak Bola');
  const [totalSoal, setTotalSoal] = useState('5');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [revealAnswerIdx, setRevealAnswerIdx] = useState<{ [key: number]: boolean }>({});
  const [isCopied, setIsCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [includeAnswersInExport, setIncludeAnswersInExport] = useState(true);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Edit Modal State
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Question>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 'A',
    explanation: ''
  });

  // New Question Modal
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestionForm, setNewQuestionForm] = useState<Question>({
    question: '',
    options: ['A. ', 'B. ', 'C. ', 'D. '],
    correctAnswer: 'A',
    explanation: ''
  });

  useEffect(() => {
    if (questions.length === 0) {
      handleGenerateQuestions();
    }
  }, []);

  const parseQuestionsResponse = (data: any): Question[] => {
    let extracted: Question[] = [];
    if (Array.isArray(data)) {
      extracted = data;
    } else if (Array.isArray(data?.questions)) {
      extracted = data.questions;
    } else if (Array.isArray(data?.soalList)) {
      extracted = data.soalList.map((item: any) => {
        let opts: string[] = [];
        if (Array.isArray(item.pilihan)) {
          opts = item.pilihan;
        } else if (item.pilihan && typeof item.pilihan === 'object') {
          opts = Object.entries(item.pilihan).map(([k, v]) => `${k}. ${v}`);
        } else if (Array.isArray(item.options)) {
          opts = item.options;
        }
        return {
          question: item.question || item.pertanyaan || '',
          options: opts.length > 0 ? opts : ['A. Opsi 1', 'B. Opsi 2', 'C. Opsi 3', 'D. Opsi 4'],
          correctAnswer: item.correctAnswer || item.kunciJawaban || 'A',
          explanation: item.explanation || item.pembahasan || ''
        };
      });
    }
    return extracted;
  };

  const handleGenerateQuestions = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const effectiveMateri = materi.trim() || 'Permainan Bola Besar: Sepak Bola';

    setIsGenerating(true);
    setApiError(null);
    setRevealAnswerIdx({});

    try {
      const response = await fetch('/api/generate-soal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          materi: effectiveMateri,
          totalSoal
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Terjadi kesalahan saat memproses bank soal AI.');
      }

      const data = await response.json();
      const loadedQuestions = parseQuestionsResponse(data);

      if (loadedQuestions.length === 0) {
        throw new Error('Format naskah soal tidak dapat dimuat. Silakan coba klik sekali lagi.');
      }

      setQuestions(loadedQuestions);
    } catch (err: any) {
      console.warn('[Bank Soal AI] Fetch error, using high-quality local fallback:', err);
      // Construct rich domain fallback questions matching the chosen topic
      const count = parseInt(totalSoal) || 5;
      const m = effectiveMateri.toLowerCase();
      let fallbackList: Question[] = [];

      if (m.includes('sepak') || m.includes('bola besar')) {
        fallbackList = [
          {
            question: 'Bagian kaki yang paling tepat dan akurat digunakan untuk mengoper bola jarak dekat (short passing) menyusur tanah kepada teman adalah...?',
            options: ['A. Kaki bagian dalam', 'B. Ujung jari kaki', 'C. Tumit bagian belakang', 'D. Punggung kaki bagian luar'],
            correctAnswer: 'A',
            explanation: 'Kaki bagian dalam memiliki bidang kontak yang lebar dan datar sehingga laju bola lebih terarah dan stabil menyusur tanah.'
          },
          {
            question: 'Sikap tubuh saat menghentikan bola (controlling) mendatar menggunakan kaki bagian dalam adalah...?',
            options: ['A. Kaki penahan ditarik sedikit ke belakang mengikuti laju bola agar pantulan bola tidak jauh', 'B. Kaki kaku menendang bola kembali', 'C. Melompat setinggi-tingginya', 'D. Memejamkan mata rapat-rapat'],
            correctAnswer: 'A',
            explanation: 'Gerak meredam laju bola dengan menarik kaki sedikit ke belakang menyerap energi kinetik bola sehingga bola berhenti di dekat penguasaan tubuh.'
          },
          {
            question: 'Tujuan utama dari gerakan menggiring bola (dribbling) dalam situasi permainan sepak bola adalah...?',
            options: ['A. Membawa bola mendekati area pertahanan lawan dan melewati hadangan lawan', 'B. Membuang waktu agar pertandingan cepat selesai', 'C. Menendang bola ke luar garis samping lapangan', 'D. Menyerahkan bola kepada penjaga gawang lawan'],
            correctAnswer: 'A',
            explanation: 'Dribbling berfungsi membuka ruang serang, mendekati gawang musuh, dan memancing pemain bertahan lawan keluar dari posisinya.'
          },
          {
            question: 'Dalam permainan sepak bola resmi, satu-satunya pemain yang berhak menyentuh dan memegang bola dengan kedua tangannya di dalam area kotak penalti sendiri adalah...?',
            options: ['A. Penjaga gawang (Kiper)', 'B. Bek bertahan', 'C. Penyerang depan', 'D. Kapten regu'],
            correctAnswer: 'A',
            explanation: 'Sesuai regulasi resmi IFAB/PSSI, penjaga gawang diberi keistimewaan memegang bola di dalam kotak penalti 16 meter regunya sendiri.'
          },
          {
            question: 'Sikap menjunjung tinggi sportivitas dalam permainan sepak bola di sekolah dicontohkan dengan...?',
            options: ['A. Membantu teman atau lawan yang terjatuh dan mematuhi keputusan wasit secara ksatria', 'B. Mendorong lawan saat berebut bola', 'C. Menolak berjabat tangan setelah pertandingan selesai', 'D. Menyalahkan rekan setim saat kebobolan gol'],
            correctAnswer: 'A',
            explanation: 'Pendidikan jasmani menanamkan profil pelajar Pancasila yang menghargai sesama, berjiwa ksatria, dan menjunjung sportivitas tinggi.'
          }
        ];
      } else {
        fallbackList = [
          {
            question: `Tujuan utama melakukan pemanasan (warming-up) teratur sebelum mempraktikkan materi "${effectiveMateri}" adalah...?`,
            options: ['A. Menaikkan suhu tubuh dan menyiapkan elastisitas otot agar terhindar dari risiko cedera', 'B. Menghabiskan seluruh tenaga sebelum bermain', 'C. Menunggu kawan yang terlambat datang ke sekolah', 'D. Membuat napas menjadi tersengal-sengal lelah'],
            correctAnswer: 'A',
            explanation: 'Pemanasan bertahap mempersiapkan detak jantung, persendian, dan otot tubuh agar siap beraktivitas inti dengan aman dan optimal.'
          },
          {
            question: `Gerakan berpindah posisi dari satu tempat ke tempat lainnya dalam aktivitas "${effectiveMateri}" tergolong pola gerak...?`,
            options: ['A. Gerak Lokomotor', 'B. Gerak Non-lokomotor', 'C. Gerak Manipulatif', 'D. Gerak Statis'],
            correctAnswer: 'A',
            explanation: 'Gerak lokomotor ditandai dengan perpindahan seluruh titik berat tubuh manusia, misalnya berjalan, berlari, melompat, dan meluncur.'
          },
          {
            question: `Sikap tubuh yang benar saat mendarat setelah melakukan gerakan melompat pada pembelajaran "${effectiveMateri}" adalah...?`,
            options: ['A. Kedua lutut sedikit ditekuk (mengeper) untuk meredam beban hentakan pendaratan tubuh', 'B. Kaki kaku lurus membentur tanah keras', 'C. Mendarat menggunakan bagian pinggang samping', 'D. Menumpu dengan satu ujung jari kaki saja'],
            correctAnswer: 'A',
            explanation: 'Gerakan lutut mengeper bekerja seperti pegas peredam kejut yang melindungi tulang belakang dan persendian lutut dari beban gravitasi.'
          },
          {
            question: `Sikap karakter Profil Pelajar Pancasila yang dilatih melalui kegiatan olahraga bersama pada materi "${effectiveMateri}" adalah...?`,
            options: ['A. Kerjasama tim yang solid, saling menghargai, dan menjunjung tinggi kejujuran sportivitas', 'B. Menganggap remeh kemampuan teman sekelas', 'C. Ingin menonjolkan diri sendiri di depan guru', 'D. Menolak berbagi giliran bermain peralatan olahraga'],
            correctAnswer: 'A',
            explanation: 'Olahraga mendidik anak untuk bergotong royong, berempati, taat pada aturan bersama, dan menghormati teman sepermainan.'
          },
          {
            question: `Aktivitas penting yang wajib dilakukan di akhir sesi olahraga setelah mempraktikkan "${effectiveMateri}" adalah...?`,
            options: ['A. Pendinginan (cooling down) dan merapikan kembali seluruh peralatan olahraga ke tempatnya', 'B. Langsung membeli dan meminum air es manis', 'C. Duduk diam di bawah terik sinar matahari', 'D. Berlari kencang keluar gerbang sekolah'],
            correctAnswer: 'A',
            explanation: 'Pendinginan bertahap menormalkan sirkulasi darah dan mencegah pusing, sedangkan merapikan alat melatih rasa tanggung jawab.'
          }
        ];
      }

      setQuestions(fallbackList.slice(0, count));
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleRevealAnswer = (idx: number) => {
    setRevealAnswerIdx(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const toggleAllAnswers = (reveal: boolean) => {
    const updated: { [key: number]: boolean } = {};
    questions.forEach((_, idx) => {
      updated[idx] = reveal;
    });
    setRevealAnswerIdx(updated);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (confirm(`Hapus butir soal nomor ${idx + 1}?`)) {
      setQuestions(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const startEditQuestion = (idx: number) => {
    setEditingIdx(idx);
    setEditForm({ ...questions[idx], options: [...questions[idx].options] });
  };

  const saveEditQuestion = () => {
    if (editingIdx === null) return;
    if (!editForm.question.trim()) {
      alert('Pertanyaan tidak boleh kosong.');
      return;
    }
    setQuestions(prev => prev.map((q, i) => (i === editingIdx ? editForm : q)));
    setEditingIdx(null);
  };

  const handleAddNewQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionForm.question.trim()) {
      alert('Pertanyaan tidak boleh kosong.');
      return;
    }
    setQuestions(prev => [...prev, newQuestionForm]);
    setNewQuestionForm({
      question: '',
      options: ['A. ', 'B. ', 'C. ', 'D. '],
      correctAnswer: 'A',
      explanation: ''
    });
    setIsAddingQuestion(false);
  };

  const handleDownloadPdf = async () => {
    if (questions.length === 0 || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docContent = exportSoalToDoc(grade, materi, questions, includeAnswersInExport);
      const filename = `Lembar_Soal_PJOK_Kelas_${grade}_${materi.replace(/\s+/g, '_')}`;
      const success = await downloadHtmlAsPdf(filename, docContent, {
        title: `Lembar Evaluasi Pengetahuan PJOK Kelas ${grade}`,
        orientation: 'portrait'
      });
      if (!success) {
        printHtmlDocument(docContent, `Lembar Soal PJOK Kelas ${grade}`);
      }
    } catch (err) {
      console.error(err);
      const docContent = exportSoalToDoc(grade, materi, questions, includeAnswersInExport);
      printHtmlDocument(docContent, `Lembar Soal PJOK Kelas ${grade}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadWord = () => {
    if (questions.length === 0) return;
    const docContent = exportSoalToDoc(grade, materi, questions, includeAnswersInExport);
    downloadDocFile(`Lembar_Soal_PJOK_Kelas_${grade}_${materi.replace(/\s+/g, '_')}`, docContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const printQuestions = () => {
    const docContent = exportSoalToDoc(grade, materi, questions, includeAnswersInExport);
    printHtmlDocument(docContent, `Lembar Soal PJOK Kelas ${grade}`);
  };

  const copyToClipboard = () => {
    if (questions.length === 0) return;
    const textFormatted = `NASKAH SOAL EVALUASI PENGETAHUAN PJOK
Kelas : ${grade} SD
Materi : ${materi}
Jumlah : ${questions.length} Butir Soal
=========================================

${questions.map((q, i) => {
  return `${i + 1}. ${q.question}
${q.options.join('\n')}
${includeAnswersInExport ? `Kunci Jawaban: ${q.correctAnswer}\nPembahasan: ${q.explanation}\n` : ''}`;
}).join('\n\n')}
`;
    navigator.clipboard.writeText(textFormatted).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(() => {
      alert('Gagal menyalin teks ke clipboard.');
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Settings Form (Sidebar) */}
      <div className="lg:col-span-4 space-y-4 no-print">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-lg space-y-4 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-tight">SADAR AI Bank Soal</h3>
              <p className="text-[11px] text-slate-300 font-medium">Generator Soal Pengetahuan PJOK SD</p>
            </div>
          </div>

          <form onSubmit={handleGenerateQuestions} className="space-y-4">
            {/* Pilihan Kelas */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Jenjang Kelas SD</label>
              <select
                value={grade}
                onChange={(e) => {
                  const newG = e.target.value;
                  setGrade(newG);
                  if (GRADE_PRESET_TOPICS[newG]?.[0]) {
                    setMateri(GRADE_PRESET_TOPICS[newG][0]);
                  }
                }}
                className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
              >
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>Kelas {n} SD (Fase {n <= 2 ? 'A' : n <= 4 ? 'B' : 'C'})</option>
                ))}
              </select>
            </div>

            {/* Input Materi & Preset Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Materi Pembelajaran PJOK</label>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Rekomendasi
                </span>
              </div>
              <input
                type="text"
                value={materi}
                onChange={(e) => setMateri(e.target.value)}
                placeholder="Ketik topik olahraga, misal: Sepak Bola / Senam Lantai"
                className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl text-xs px-3 py-2.5 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                required
              />

              {/* Preset buttons for instant selection */}
              <div className="pt-1.5 space-y-1">
                <p className="text-[10px] text-slate-400 font-medium">Klik rekomendasi materi Kelas {grade}:</p>
                <div className="flex flex-col gap-1.5">
                  {(GRADE_PRESET_TOPICS[grade] || []).map((preset, pIdx) => (
                    <button
                      type="button"
                      key={pIdx}
                      onClick={() => setMateri(preset)}
                      className={`text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        materi === preset 
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold' 
                          : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
                      }`}
                    >
                      • {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Jumlah Soal */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Jumlah Butir Soal</label>
              <select
                value={totalSoal}
                onChange={(e) => setTotalSoal(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="3">3 Soal (Kuis Singkat)</option>
                <option value="5">5 Soal (Ulangan Harian Ringkas)</option>
                <option value="10">10 Soal (Format Standar Formatif)</option>
                <option value="15">15 Soal (Asesmen Tengah Semester)</option>
                <option value="20">20 Soal (Paket Komprehensif)</option>
              </select>
            </div>

            {apiError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{apiError}</p>
                  <p className="text-[10px] text-rose-200/80">Sistem otomatis menyiapkan template soal kurikulum PJOK terbaik saat Anda menekan tombol di bawah.</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Merumuskan Butir Soal...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> 
                  <span>{questions.length > 0 ? 'Rumuskan Ulang Soal' : 'Rumuskan Soal PJOK'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Guidance Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2 text-xs">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-600" /> Standar Kognitif PJOK SD
          </h4>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Soal dirancang menguji pemahaman aturan bermain, keselamatan di lapangan, kebiasaan hidup bersih & sehat, serta dasar mekanika gerak sesuai Kurikulum Merdeka.
          </p>
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
            <p>✓ Dilengkapi 4 opsi pilihan ganda (A, B, C, D)</p>
            <p>✓ Kunci jawaban akurat dan penjelasan ramah anak</p>
            <p>✓ Siap diunduh ke Word (.doc), PDF, atau dicetak langsung</p>
          </div>
        </div>
      </div>

      {/* Questions Viewer (Main Area) */}
      <div className="lg:col-span-8 space-y-4">
        {questions.length > 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            {/* Header & Action Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 no-print">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase">
                    Kelas {grade} SD
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {questions.length} Butir Soal
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-800 mt-1">Ujian & Evaluasi Kognitif PJOK</h2>
                <p className="text-xs text-slate-500">Materi: <span className="font-semibold text-slate-700">{materi}</span></p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <ExportJsonPromptAiButtons
                  variant="compact"
                  onExportJson={() => {
                    const filename = `Soal_Evaluasi_PJOK_Kelas_${grade}_${materi.replace(/\s+/g, '_')}.json`;
                    downloadJsonFile(filename, {
                      kelas: grade,
                      materi,
                      totalSoal: questions.length,
                      questions
                    });
                  }}
                  onOpenPromptAi={() => setShowPromptModal(true)}
                />

                <button
                  type="button"
                  onClick={() => setIncludeAnswersInExport(!includeAnswersInExport)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    includeAnswersInExport 
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Klik untuk memilih apakah kunci jawaban diikutsertakan dalam unduhan/cetak"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>{includeAnswersInExport ? 'Mode Guru (Ada Kunci)' : 'Mode Siswa (Tanpa Kunci)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-75"
                >
                  <Download className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isExportingPdf ? 'PDF...' : 'PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadWord}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Word (.doc)</span>
                </button>

                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Salin semua butir soal ke clipboard"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin'}</span>
                </button>

                <button
                  type="button"
                  onClick={printQuestions}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
              </div>
            </div>

            {/* Quick Toggle Controls */}
            <div className="flex items-center justify-between no-print bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleAllAnswers(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Buka Semua Kunci
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => toggleAllAnswers(false)}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <EyeOff className="w-3.5 h-3.5" /> Tutup Semua Kunci
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingQuestion(true)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Soal Manual
              </button>
            </div>

            {/* Printable Document Header (Appears only on paper/print) */}
            <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6">
              <h1 className="text-lg font-black uppercase text-slate-900 tracking-wide">LEMBAR ASESMEN EVALUASI PENGETAHUAN PJOK</h1>
              <p className="text-xs font-semibold text-slate-700 mt-1">SD NEGERI KALIMANTONG • TAHUN PELAJARAN 2026/2027</p>
              <div className="grid grid-cols-2 text-left text-xs mt-4 pt-3 border-t border-slate-300">
                <div className="space-y-1">
                  <p><strong>Mata Pelajaran:</strong> PJOK</p>
                  <p><strong>Materi Pokok:</strong> {materi}</p>
                  <p><strong>Kelas / Semester:</strong> Kelas {grade} SD / Ganjil</p>
                </div>
                <div className="space-y-1 text-right">
                  <p><strong>Nama Siswa:</strong> ______________________</p>
                  <p><strong>Nomor Absen:</strong> ______________________</p>
                  <p><strong>Tanggal:</strong> ______________________</p>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-5">
              {questions.map((q, idx) => (
                <div 
                  key={idx} 
                  className="border border-slate-200/90 hover:border-slate-300 rounded-xl p-5 space-y-3.5 bg-slate-50/30 transition-all relative group"
                >
                  {/* Question Header & Controls */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-xs">
                        {idx + 1}
                      </span>
                      <p className="font-bold text-sm text-slate-800 pt-0.5 leading-relaxed">{q.question}</p>
                    </div>

                    {/* Edit & Delete Buttons */}
                    <div className="flex items-center gap-1 shrink-0 no-print opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => startEditQuestion(idx)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                        title="Edit Butir Soal"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Hapus Butir Soal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-10">
                    {q.options.map((opt, optIdx) => {
                      const optLetter = opt.trim().charAt(0).toUpperCase();
                      const isCorrect = optLetter === q.correctAnswer;
                      const isRevealed = revealAnswerIdx[idx];
                      return (
                        <div 
                          key={optIdx} 
                          className={`rounded-lg p-3 text-xs font-medium border transition-all ${
                            isRevealed && isCorrect
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold shadow-xs'
                              : 'bg-white border-slate-200/80 text-slate-700'
                          }`}
                        >
                          {opt}
                        </div>
                      );
                    })}
                  </div>

                  {/* Answer Reveal & Pedagogical Explanation */}
                  <div className="pl-10 pt-2 border-t border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
                    <button
                      type="button"
                      onClick={() => toggleRevealAnswer(idx)}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1.5 w-max cursor-pointer"
                    >
                      {revealAnswerIdx[idx] ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-teal-600" /> Sembunyikan Kunci Jawaban
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-teal-600" /> Lihat Kunci & Pembahasan Guru
                        </>
                      )}
                    </button>

                    {revealAnswerIdx[idx] && (
                      <div className="bg-emerald-50/50 border border-emerald-200 p-3 rounded-xl text-xs text-slate-700 flex-1 space-y-1 shadow-xs">
                        <p className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Kunci Jawaban: {q.correctAnswer}
                        </p>
                        <p className="text-[11px] leading-relaxed text-slate-600">
                          <strong>Pembahasan:</strong> {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Printed Teacher Answer Key (Print Only if Mode Guru is active) */}
                  {includeAnswersInExport && (
                    <div className="hidden print:block pl-10 pt-2 text-xs border-t border-dashed border-slate-300 text-slate-700 mt-2">
                      <p className="font-bold">Kunci Jawaban: {q.correctAnswer}</p>
                      <p className="text-[11px] italic text-slate-600">Pembahasan: {q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={() => setIsAddingQuestion(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Soal Manual
              </button>

              <button
                type="button"
                onClick={() => handleGenerateQuestions()}
                disabled={isGenerating}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Acak / Perbarui Soal Baru</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty Placeholder State */
          <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-xs text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-black text-base text-slate-800">Bank Soal Kognitif PJOK Siap Digunakan</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pilih jenjang kelas SD dan materi olahraga pada panel di sebelah kiri, lalu tekan tombol <strong>Rumuskan Soal PJOK</strong> untuk menghasilkan paket soal otomatis.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleGenerateQuestions()}
                disabled={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Mulai Buat Soal Sekarang
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Question Modal */}
      {editingIdx !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800">Edit Butir Soal Nomor {editingIdx + 1}</h3>
              <button
                type="button"
                onClick={() => setEditingIdx(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Teks Pertanyaan</label>
                <textarea
                  value={editForm.question}
                  onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Pilihan Jawaban (A, B, C, D)</label>
                {editForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-center font-bold text-slate-500">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...editForm.options];
                        newOpts[i] = e.target.value;
                        setEditForm({ ...editForm, options: newOpts });
                      }}
                      className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kunci Jawaban</label>
                  <select
                    value={editForm.correctAnswer}
                    onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-bold text-emerald-700"
                  >
                    {['A', 'B', 'C', 'D'].map(letter => (
                      <option key={letter} value={letter}>Opsi {letter}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pembahasan / Penjelasan</label>
                <textarea
                  value={editForm.explanation}
                  onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingIdx(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveEditQuestion}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Question Modal */}
      {isAddingQuestion && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <form onSubmit={handleAddNewQuestion} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800">Tambah Butir Soal Baru Secara Manual</h3>
              <button
                type="button"
                onClick={() => setIsAddingQuestion(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pertanyaan</label>
                <textarea
                  value={newQuestionForm.question}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, question: e.target.value })}
                  placeholder="Ketikkan teks pertanyaan di sini..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Pilihan Jawaban (A, B, C, D)</label>
                {newQuestionForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-center font-bold text-slate-500">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...newQuestionForm.options];
                        newOpts[i] = e.target.value;
                        setNewQuestionForm({ ...newQuestionForm, options: newOpts });
                      }}
                      className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kunci Jawaban</label>
                  <select
                    value={newQuestionForm.correctAnswer}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, correctAnswer: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-bold text-emerald-700"
                  >
                    {['A', 'B', 'C', 'D'].map(letter => (
                      <option key={letter} value={letter}>Opsi {letter}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pembahasan / Penjelasan Singkat</label>
                <textarea
                  value={newQuestionForm.explanation}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, explanation: e.target.value })}
                  placeholder="Jelaskan alasan jawaban tersebut benar..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddingQuestion(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tambahkan Soal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Bank Soal Evaluasi PJOK SD"
        subtitle={`Kelas ${grade} SD - ${materi}`}
        tabs={getUlanganHarianPrompts(materi)}
        defaultActiveTab="kisi_ulangan"
        jsonData={{
          kelas: grade,
          materi,
          totalSoal: questions.length,
          questions
        }}
        jsonFilename={`Soal_Evaluasi_PJOK_Kelas_${grade}_${materi.replace(/\s+/g, '_')}.json`}
      />
    </div>
  );
}
