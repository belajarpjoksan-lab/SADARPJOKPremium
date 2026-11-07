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
  ArrowRight, 
  Award,
  BookMarked,
  Info,
  CheckCircle2,
  FileSignature,
  Download,
  Printer,
  ChevronRight,
  Plus,
  Trash2,
  FileSpreadsheet,
  ListOrdered,
  Eye,
  EyeOff,
  Users
} from 'lucide-react';
import { downloadDocFile, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getUlanganHarianPrompts } from '../utils/aiPromptGenerators';

// Pre-written common PJOK Learning Objectives (TP) for quick selection
const PRESETS_TP = [
  {
    grade: "4",
    text: "Siswa mampu mempraktikkan variasi pola gerak dasar melempar dan menangkap bola dalam permainan kasti dengan koordinasi yang baik.",
    materi: "Permainan Kasti / Bola Kecil"
  },
  {
    grade: "4",
    text: "Siswa mampu mempraktikkan gerakan passing bawah bola voli dengan posisi kedua lengan rapat dan lurus saat menyentuh bola.",
    materi: "Permainan Bola Voli / Bola Besar"
  },
  {
    grade: "5",
    text: "Siswa mampu mempraktikkan kombinasi gerak dasar langkah kaki dan ayunan lengan dalam aktivitas gerak berirama (senam irama) mengikuti ketukan.",
    materi: "Aktivitas Gerak Berirama"
  },
  {
    grade: "5",
    text: "Siswa mampu mempraktikkan gerakan guling depan (roll depan) di atas matras dengan posisi awalan, perkenaan tengkuk, dan sikap akhir jongkok secara aman.",
    materi: "Senam Lantai"
  },
  {
    grade: "6",
    text: "Siswa mampu melakukan aktivitas latihan kebugaran jasmani untuk meningkatkan kelincahan (agility) melalui latihan lari bolak-balik (shuttle run) secara disiplin.",
    materi: "Kebugaran Jasmani"
  },
  {
    grade: "3",
    text: "Siswa mampu mempraktikkan gerak dasar manipulatif menendang dan menghentikan bola dalam permainan sepak bola modifikasi.",
    materi: "Sepak Bola Modifikasi"
  }
];

interface Question {
  number: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface EssayQuestion {
  number: number;
  questionText: string;
  expectedAnswer: string;
  scoreMax: number;
}

interface RubricCriterion {
  criteriaName: string;
  skor4: string;
  skor3: string;
  skor2: string;
  skor1: string;
}

interface GeneratedTestData {
  title: string;
  tujuanPembelajaran: string;
  materi: string;
  grade: string;
  tipeUlangan: string;
  questions: Question[];
  essayQuestions: EssayQuestion[];
  taskInstructions: string[];
  rubricCriteria: RubricCriterion[];
  scoringFormula: string;
  gradingGuide: string;
}

interface StudentGrade {
  id: string;
  name: string;
  scores: { [key: string]: number }; // Score per criteria (for practical)
  pgCorrectCount?: number;           // Correct count for written
  essayScore?: number;               // Score for written essay
}

export default function UlanganHarianView() {
  // Input form state
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState(PRESETS_TP[0].text);
  const [tipeUlangan, setTipeUlangan] = useState<'tulis' | 'praktik'>('tulis');
  const [grade, setGrade] = useState('4');
  const [materi, setMateri] = useState(PRESETS_TP[0].materi);
  const [jumlahSoal, setJumlahSoal] = useState(5);
  const [subject, setSubject] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan');
  
  // UI UX state
  const [isGenerating, setIsGenerating] = useState(false);
  const [testData, setTestData] = useState<GeneratedTestData | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'instrumen' | 'rekap'>('instrumen');
  
  // Toggles inside test paper
  const [showAnswers, setShowAnswers] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Classroom grading state (seeded with 8 standard student names)
  const [students, setStudents] = useState<StudentGrade[]>([
    { id: '1', name: 'Ahmad Faisal', scores: {}, pgCorrectCount: 4, essayScore: 8 },
    { id: '2', name: 'Budi Santoso', scores: {}, pgCorrectCount: 3, essayScore: 6 },
    { id: '3', name: 'Citra Kirana', scores: {}, pgCorrectCount: 5, essayScore: 10 },
    { id: '4', name: 'Dedi Kurniawan', scores: {}, pgCorrectCount: 4, essayScore: 7 },
    { id: '5', name: 'Evi Susanti', scores: {}, pgCorrectCount: 2, essayScore: 5 },
    { id: '6', name: 'Fajar Nugraha', scores: {}, pgCorrectCount: 5, essayScore: 9 },
    { id: '7', name: 'Gita Lestari', scores: {}, pgCorrectCount: 3, essayScore: 8 },
    { id: '8', name: 'Hendra Wijaya', scores: {}, pgCorrectCount: 4, essayScore: 6 }
  ]);
  const [newStudentName, setNewStudentName] = useState('');

  // Handle preset selection
  const handleSelectPreset = (preset: typeof PRESETS_TP[0]) => {
    setTujuanPembelajaran(preset.text);
    setGrade(preset.grade);
    setMateri(preset.materi);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tujuanPembelajaran.trim()) return;

    setIsGenerating(true);
    setApiError(null);
    setTestData(null);

    try {
      const response = await fetch('/api/generate-ulangan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tujuanPembelajaran,
          tipeUlangan,
          grade,
          mataPelajaran: subject,
          jumlahSoal
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal menghasilkan instrumen ulangan harian.');
      }

      const data = await response.json();
      setTestData(data);
      setViewTab('instrumen');

      // Initialize students' practical scores if empty
      if (data.tipeUlangan === 'praktik' && data.rubricCriteria) {
        const updated = students.map(st => {
          const initialScores: { [key: string]: number } = {};
          data.rubricCriteria.forEach((crit: RubricCriterion) => {
            initialScores[crit.criteriaName] = 3; // default score: 3 (Baik)
          });
          return {
            ...st,
            scores: initialScores
          };
        });
        setStudents(updated);
      }
    } catch (err: any) {
      setApiError(err.message || 'Gagal membuat koneksi dengan AI pembuat ulangan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    const newStudent: StudentGrade = {
      id: Date.now().toString(),
      name: newStudentName.trim(),
      scores: {},
      pgCorrectCount: 4,
      essayScore: 8
    };

    if (testData && testData.tipeUlangan === 'praktik' && testData.rubricCriteria) {
      testData.rubricCriteria.forEach(crit => {
        newStudent.scores[crit.criteriaName] = 3;
      });
    }

    setStudents([...students, newStudent]);
    setNewStudentName('');
  };

  const handleRemoveStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const handleUpdateScore = (studentId: string, key: string, val: number) => {
    setStudents(students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          scores: { ...s.scores, [key]: val }
        };
      }
      return s;
    }));
  };

  const handleUpdatePgCorrect = (studentId: string, val: number) => {
    setStudents(students.map(s => {
      if (s.id === studentId) {
        return { ...s, pgCorrectCount: Math.max(0, Math.min(jumlahSoal, val)) };
      }
      return s;
    }));
  };

  const handleUpdateEssayScore = (studentId: string, val: number) => {
    const maxEssayTotal = testData?.essayQuestions?.reduce((acc, q) => acc + q.scoreMax, 0) || 10;
    setStudents(students.map(s => {
      if (s.id === studentId) {
        return { ...s, essayScore: Math.max(0, Math.min(maxEssayTotal, val)) };
      }
      return s;
    }));
  };

  // Calculations for Grade
  const calculateStudentFinalGrade = (student: StudentGrade): number => {
    if (!testData) return 0;

    if (testData.tipeUlangan === 'tulis') {
      const pgWeight = 0.6; // 60% weight
      const essayWeight = 0.4; // 40% weight
      const maxEssayTotal = testData.essayQuestions?.reduce((acc, q) => acc + q.scoreMax, 0) || 10;
      
      const pgScore = ((student.pgCorrectCount || 0) / jumlahSoal) * 100;
      const essayScore = ((student.essayScore || 0) / maxEssayTotal) * 100;

      const final = (pgScore * pgWeight) + (essayScore * essayWeight);
      return Math.round(final);
    } else {
      // Practical
      if (!testData.rubricCriteria || testData.rubricCriteria.length === 0) return 0;
      let totalObtained = 0;
      testData.rubricCriteria.forEach(crit => {
        totalObtained += (student.scores[crit.criteriaName] || 3);
      });
      const maxTotal = testData.rubricCriteria.length * 4;
      const final = (totalObtained / maxTotal) * 100;
      return Math.round(final);
    }
  };

  // Copy text capability
  const handleCopyText = () => {
    if (!testData) return;
    let text = `${testData.title.toUpperCase()}\n`;
    text += `====================================\n`;
    text += `Mata Pelajaran  : ${subject}\n`;
    text += `Kelas / Semester: Kelas ${testData.grade} SD\n`;
    text += `Materi          : ${testData.materi}\n`;
    text += `Tujuan Pembelajaran: ${testData.tujuanPembelajaran}\n\n`;

    if (testData.tipeUlangan === 'tulis') {
      text += `A. SOAL PILIHAN GANDA\n`;
      text += `--------------------\n`;
      testData.questions.forEach(q => {
        text += `${q.number}. ${q.questionText}\n`;
        q.options.forEach(opt => text += `   ${opt}\n`);
        text += `   Kunci Jawaban: ${q.correctAnswer}\n`;
        text += `   Penjelasan: ${q.explanation}\n\n`;
      });

      text += `B. SOAL URAIAN (ESSAY)\n`;
      text += `---------------------\n`;
      testData.essayQuestions.forEach(q => {
        text += `${q.number}. ${q.questionText} (Skor Maks: ${q.scoreMax})\n`;
        text += `   Harapan Jawaban: ${q.expectedAnswer}\n\n`;
      });
    } else {
      text += `A. PETUNJUK UNJUK KERJA SISWA\n`;
      text += `----------------------------\n`;
      testData.taskInstructions.forEach(ins => text += `${ins}\n`);
      text += `\nB. RUBRIK PENILAIAN PRAKTIK\n`;
      text += `--------------------------\n`;
      testData.rubricCriteria.forEach(crit => {
        text += `Kriteria: ${crit.criteriaName}\n`;
        text += ` - Skor 4 (Sangat Baik): ${crit.skor4}\n`;
        text += ` - Skor 3 (Baik): ${crit.skor3}\n`;
        text += ` - Skor 2 (Cukup): ${crit.skor2}\n`;
        text += ` - Skor 1 (Perlu Bimbingan): ${crit.skor1}\n\n`;
      });
    }

    text += `C. PEDOMAN PENSKORAN\n`;
    text += `--------------------\n`;
    text += `${testData.scoringFormula}\n`;
    text += `${testData.gradingGuide}\n`;

    navigator.clipboard.writeText(text)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
  };

  // Generate HTML for Doc/PDF/Print
  const getUlanganHtml = () => {
    if (!testData) return '';

    let testSpecificHtml = '';

    if (testData.tipeUlangan === 'tulis') {
      testSpecificHtml = `
        <div data-f4-section="Bagian 1: I. Naskah Soal Pilihan Ganda" data-f4-orientation="portrait">
          <h3 style="margin-top: 20px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 4px;">I. SOAL PILIHAN GANDA</h3>
          <table class="no-border" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            ${testData.questions.map(q => `
              <tr>
                <td style="border: none; padding: 6px; font-weight: bold; width: 4%; vertical-align: top;">${q.number}.</td>
                <td style="border: none; padding: 6px; vertical-align: top;">
                  <strong>${q.questionText}</strong><br/>
                  <table class="no-border" style="width: 100%; border-collapse: collapse; margin-top: 5px; border: none;">
                    ${q.options.map(opt => `
                      <tr>
                        <td style="border: none; padding: 3px; font-size: 10pt;">${opt}</td>
                      </tr>
                    `).join('')}
                  </table>
                  <p style="margin-top: 6px; font-size: 9.5pt; color: #475569; font-style: italic; background-color: #f8fafc; padding: 5px;">
                    <strong>Kunci:</strong> ${q.correctAnswer} | <strong>Penjelasan:</strong> ${q.explanation}
                  </p>
                </td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div data-f4-section="Bagian 2: II. Soal Uraian (Essay) & Ekspektasi Jawaban" data-f4-orientation="portrait">
          <h3 style="margin-top: 25px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 4px;">II. SOAL URAIAN (ESSAY)</h3>
          <table class="no-border" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            ${testData.essayQuestions.map(q => `
              <tr>
                <td style="border: none; padding: 6px; font-weight: bold; width: 4%; vertical-align: top;">${q.number}.</td>
                <td style="border: none; padding: 6px; vertical-align: top;">
                  <strong>${q.questionText} (Skor Maks: ${q.scoreMax})</strong><br/>
                  <p style="margin-top: 4px; font-size: 9.5pt; color: #475569; font-style: italic; background-color: #f8fafc; padding: 5px;">
                    <strong>Ekspektasi Jawaban:</strong> ${q.expectedAnswer}
                  </p>
                </td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    } else {
      // Practical
      testSpecificHtml = `
        <div data-f4-section="Bagian 1: I. Petunjuk Tugas Unjuk Kerja & II. Rubrik Kinerja" data-f4-orientation="portrait">
          <h3 style="margin-top: 20px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 4px;">I. PETUNJUK TUGAS UNJUK KERJA SISWA</h3>
          <ol style="font-size: 11pt; line-height: 1.6; margin-top: 10px; padding-left: 20px;">
            ${testData.taskInstructions.map(ins => `<li style="margin-bottom: 6px;">${ins}</li>`).join('')}
          </ol>

          <h3 style="margin-top: 25px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 4px;">II. RUBRIK PENILAIAN KINERJA</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="border: 1px solid #000; padding: 8px; font-weight: bold;">Aspek Penilaian</th>
                <th style="border: 1px solid #000; padding: 8px; font-weight: bold;">Skor 4 (Sangat Baik)</th>
                <th style="border: 1px solid #000; padding: 8px; font-weight: bold;">Skor 3 (Baik)</th>
                <th style="border: 1px solid #000; padding: 8px; font-weight: bold;">Skor 2 (Cukup)</th>
                <th style="border: 1px solid #000; padding: 8px; font-weight: bold;">Skor 1 (Perlu Bimbingan)</th>
              </tr>
            </thead>
            <tbody>
              ${testData.rubricCriteria.map(crit => `
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold; background-color: #f8fafc;">${crit.criteriaName}</td>
                  <td style="border: 1px solid #000; padding: 8px; font-size: 9pt;">${crit.skor4}</td>
                  <td style="border: 1px solid #000; padding: 8px; font-size: 9pt;">${crit.skor3}</td>
                  <td style="border: 1px solid #000; padding: 8px; font-size: 9pt;">${crit.skor2}</td>
                  <td style="border: 1px solid #000; padding: 8px; font-size: 9pt;">${crit.skor1}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.5;">
        <div class="header" data-f4-kop="true">
          <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 14px;">
            <h2 style="margin: 0; text-transform: uppercase; font-size: 14pt;">${testData.title.toUpperCase()}</h2>
            <p style="margin: 5px 0 0 0; font-size: 10pt;">Mata Pelajaran: ${subject} | Kelas ${testData.grade} SD</p>
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 18px; font-size: 10pt;">
            <strong>Tujuan Pembelajaran (TP):</strong> ${testData.tujuanPembelajaran}<br/>
            <strong>Topik Materi:</strong> ${testData.materi}
          </div>
        </div>

        ${testSpecificHtml}

        <div data-f4-section="Bagian 3: III. Pedoman Penskoran & Lembar Pengesahan" data-f4-orientation="portrait">
          <h3 style="margin-top: 30px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 4px;">III. PEDOMAN PENSKORAN &amp; PENILAIAN</h3>
          <div style="background-color: #fcfcfc; border: 1px solid #000; padding: 12px; font-size: 10pt; line-height: 1.6;">
            <strong>Rumus Nilai Akhir:</strong> ${testData.scoringFormula}<br/>
            <strong>Panduan Penggredan:</strong> ${testData.gradingGuide}
          </div>

          <div style="margin-top: 40px; width: 100%;">
            <table class="no-border" style="width: 100%; border: none; font-size: 11pt;">
              <tr>
                <td style="border: none;" width="50%"></td>
                <td style="border: none; text-align: center;" width="50%">
                  Mengetahui,<br/>
                  <strong>Guru Pengampu,</strong>
                  <br/><br/><br/><br/>
                  ___________________________<br/>
                  NIP. ........................................
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;
  };

  // Word Export capability
  const handleExportDoc = () => {
    if (!testData) return;
    const fullHtml = getUlanganHtml();
    downloadDocFile(`Ulangan_Harian_Kelas${testData.grade}_${testData.materi.replace(/\s+/g, '_')}`, fullHtml);
  };

  // PDF Export capability
  const handleDownloadPdf = async () => {
    if (!testData || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const fullHtml = getUlanganHtml();
      const filename = `Ulangan_Harian_F4_Kelas${testData.grade}_${testData.materi.replace(/\s+/g, '_')}.pdf`;
      await downloadHtmlAsPdf(fullHtml, filename, 'portrait');
    } catch (err) {
      console.error(err);
      const fullHtml = getUlanganHtml();
      printHtmlDocument(fullHtml, testData.title || `Ulangan Harian - ${testData.materi}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!testData) return;
    const fullHtml = getUlanganHtml();
    printHtmlDocument(fullHtml, testData.title || `Ulangan Harian - ${testData.materi}`);
  };

  // CSV download for roster
  const handleExportCsv = () => {
    if (!testData) return;
    let csv = "Nama Siswa,";
    if (testData.tipeUlangan === 'tulis') {
      csv += "PG Betul,Nilai PG,Nilai Essay,Nilai Akhir\n";
      students.forEach(st => {
        const pgScore = ((st.pgCorrectCount || 0) / jumlahSoal) * 100;
        const maxEssayTotal = testData.essayQuestions?.reduce((acc, q) => acc + q.scoreMax, 0) || 10;
        const essayScore = ((st.essayScore || 0) / maxEssayTotal) * 100;
        const final = calculateStudentFinalGrade(st);
        csv += `"${st.name}",${st.pgCorrectCount},${Math.round(pgScore)},${Math.round(essayScore)},${final}\n`;
      });
    } else {
      testData.rubricCriteria.forEach(crit => {
        csv += `"${crit.criteriaName}",`;
      });
      csv += "Nilai Akhir\n";
      students.forEach(st => {
        csv += `"${st.name}",`;
        testData.rubricCriteria.forEach(crit => {
          csv += `${st.scores[crit.criteriaName] || 3},`;
        });
        csv += `${calculateStudentFinalGrade(st)}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Nilai_Kelas_${testData.grade}_${testData.materi.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="ulangan-harian-dashboard">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-16 -translate-y-16 pointer-events-none">
          <BookMarked className="w-80 h-80" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4 text-teal-400" />
              Evaluasi Per TP Kurikulum Merdeka
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              Ulangan Harian &amp; Praktik AI
            </h2>
            <p className="text-teal-100 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Buat instrumen penilaian harian berkualitas tinggi secara otomatis. Dukung <strong>Ujian Tulis</strong> (pilihan ganda dengan kunci jawaban + esai pemikiran tingkat tinggi) dan <strong>Ujian Praktik</strong> (instruksi tugas motorik terperinci + rubrik unjuk kerja dinamis).
            </p>
          </div>
          <div className="shrink-0 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/20">
            <ExportJsonPromptAiButtons
              onExportJson={() => {
                const filename = `Ulangan_Harian_Kelas_${grade}_${(materi || 'PJOK').replace(/\s+/g, '_')}.json`;
                downloadJsonFile(filename, testData || {
                  grade,
                  materi,
                  tujuanPembelajaran,
                  tipeUlangan,
                  students
                });
              }}
              onOpenPromptAi={() => setShowPromptModal(true)}
            />
          </div>
        </div>
      </div>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Input panel (Form & Presets) */}
        <div className="lg:col-span-5 space-y-6 no-print">
          
          {/* Quick Preset Selector */}
          <div className="bg-white rounded-xl border border-slate-150 p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              Pilih Draf Cepat (Template PJOK)
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {PRESETS_TP.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  className="text-left px-3 py-2.5 rounded-lg border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-xs font-medium text-slate-700 flex justify-between items-center gap-3 cursor-pointer"
                >
                  <span className="truncate flex-1">
                    <strong className="text-emerald-700 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Kelas {preset.grade} &bull; {preset.materi}</strong>
                    {preset.text}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Core Configuration Form */}
          <div className="bg-white rounded-xl border border-slate-150 p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Pengaturan Instrumen Evaluasi
            </h3>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Kelas</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>Kelas {n} SD</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Materi Pokok</label>
                  <input
                    type="text"
                    value={materi}
                    onChange={(e) => setMateri(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    placeholder="Contoh: Kasti / Atletik"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tujuan Pembelajaran (TP) Hasil Analisis</label>
                <textarea
                  value={tujuanPembelajaran}
                  onChange={(e) => setTujuanPembelajaran(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed bg-white"
                  placeholder="Misalnya: Siswa mampu mempraktikkan keterampilan gerak dasar lari estafet..."
                  required
                />
              </div>

              {/* Assessment Type Choices */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Tipe Penilaian Ulangan</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTipeUlangan('tulis')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      tipeUlangan === 'tulis'
                        ? 'border-emerald-600 bg-emerald-50/30 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ListOrdered className="w-4 h-4 text-emerald-600" />
                    <span>Ujian Tulis (PG + Essay)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipeUlangan('praktik')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      tipeUlangan === 'praktik'
                        ? 'border-emerald-600 bg-emerald-50/30 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Ujian Praktik (Kinerja)</span>
                  </button>
                </div>
              </div>

              {/* Conditional pg length selector */}
              {tipeUlangan === 'tulis' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Soal Pilihan Ganda</label>
                  <select
                    value={jumlahSoal}
                    onChange={(e) => setJumlahSoal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={5}>5 Soal PG + 2 Essay</option>
                    <option value={10}>10 Soal PG + 3 Essay</option>
                  </select>
                </div>
              )}

              {apiError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg">
                  ⚠️ <strong>Kesalahan:</strong> {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Mengevaluasi TP &amp; Membuat Soal...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Buat Ulangan Harian AI</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7">
          
          {isGenerating ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[450px]">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-emerald-600 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Menyusun Rubrik &amp; Soal Terbaik...</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                Gemini sedang memetakan Kompetensi TP ke instrumen penilaian SD yang logis. Menulis opsi pilihan ganda yang homogen, merancang esai, atau menjabarkan aspek rubrik psikomotor (awalan, inti, akhiran) yang konkret.
              </p>
            </div>
          ) : testData ? (
            <div className="space-y-6">
              
              {/* Toolbar Actions */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 no-print">
                <div className="flex bg-slate-200 p-0.5 rounded-lg">
                  <button
                    onClick={() => setViewTab('instrumen')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewTab === 'instrumen' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <FileSignature className="w-3.5 h-3.5 text-emerald-700" />
                    Lembar Soal / Rubrik
                  </button>
                  <button
                    onClick={() => setViewTab('rekap')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewTab === 'rekap' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    Grader &amp; Rekap Nilai Siswa
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <ExportJsonPromptAiButtons
                    variant="compact"
                    onExportJson={() => {
                      const filename = `Ulangan_Harian_${(testData.title || testData.materi).replace(/\s+/g, '_')}.json`;
                      downloadJsonFile(filename, testData);
                    }}
                    onOpenPromptAi={() => setShowPromptModal(true)}
                  />
                  {testData.tipeUlangan === 'tulis' && viewTab === 'instrumen' && (
                    <button
                      onClick={() => setShowAnswers(!showAnswers)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 cursor-pointer flex items-center gap-1"
                    >
                      {showAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showAnswers ? 'Sembunyikan Kunci' : 'Kunci Jawaban'}</span>
                    </button>
                  )}
                  <button
                    onClick={handleCopyText}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 cursor-pointer flex items-center gap-1"
                  >
                    {isCopied ? 'Tersalin!' : 'Salin Text'}
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isExportingPdf}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1 disabled:opacity-75"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF'}</span>
                  </button>
                  <button
                    onClick={handleExportDoc}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>Download Word</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-700 cursor-pointer flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak</span>
                  </button>
                </div>
              </div>

              {/* TAB CONTENT 1: SOAL / RUBRIK VIEW */}
              {viewTab === 'instrumen' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-10 space-y-6 relative print-sheet">
                  
                  {/* Formal Indonesian School Header (KOP SURAT) */}
                  <div className="text-center border-b-4 border-double border-slate-900 pb-4 mb-4 relative z-10 flex flex-col items-center">
                    <span className="font-mono text-[9px] uppercase font-extrabold tracking-widest text-slate-500 block mb-1">INSTRUMEN EVALUASI FORMATIF / HARIAN</span>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                      {testData.title || `ULANGAN HARIAN ${testData.tipeUlangan.toUpperCase()}`}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      Mata Pelajaran: {subject} &bull; Kelas {testData.grade} SD
                    </p>
                  </div>

                  {/* Objective Metainfo box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-700">
                    <div>
                      <strong className="text-emerald-800 uppercase text-[9px] font-black block mb-1">Tujuan Pembelajaran (TP):</strong>
                      <p className="leading-relaxed italic">"{testData.tujuanPembelajaran}"</p>
                    </div>
                    <div>
                      <strong className="text-emerald-800 uppercase text-[9px] font-black block mb-1">Materi Pembelajaran:</strong>
                      <p>{testData.materi}</p>
                    </div>
                  </div>

                  {/* WRITTEN TEST VIEW (tulis) */}
                  {testData.tipeUlangan === 'tulis' && (
                    <div className="space-y-6 text-slate-800 text-xs sm:text-sm">
                      
                      {/* Multiple Choice section */}
                      <div className="space-y-4">
                        <h3 className="font-extrabold text-slate-900 border-b border-slate-100 pb-1.5 uppercase text-xs tracking-wider flex items-center gap-1 text-emerald-800">
                          <span>A. Soal Pilihan Ganda (60% Bobot)</span>
                        </h3>

                        <div className="space-y-5">
                          {testData.questions.map((q) => (
                            <div key={q.number} className="space-y-2">
                              <p className="font-bold flex gap-1 text-slate-800 leading-relaxed">
                                <span className="text-emerald-700 font-mono shrink-0">{q.number}.</span>
                                <span>{q.questionText}</span>
                              </p>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                                {q.options.map((opt, oIdx) => (
                                  <div 
                                    key={oIdx} 
                                    className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 font-medium text-xs hover:bg-slate-100 transition-colors"
                                  >
                                    {opt}
                                  </div>
                                ))}
                              </div>

                              {/* Correct answer toggle */}
                              {showAnswers && (
                                <div className="ml-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs space-y-1 mt-2">
                                  <span className="font-black text-emerald-800 flex items-center gap-1">
                                    <Check className="w-4 h-4" /> Kunci Jawaban: {q.correctAnswer}
                                  </span>
                                  <p className="text-slate-600 font-medium leading-relaxed">
                                    <strong>Penjelasan:</strong> {q.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Essay questions section */}
                      <div className="space-y-4 pt-4">
                        <h3 className="font-extrabold text-slate-900 border-b border-slate-100 pb-1.5 uppercase text-xs tracking-wider flex items-center gap-1 text-emerald-800">
                          <span>B. Soal Uraian / Essay (40% Bobot)</span>
                        </h3>

                        <div className="space-y-4">
                          {testData.essayQuestions.map((q) => (
                            <div key={q.number} className="space-y-1.5">
                              <p className="font-bold flex gap-1 leading-relaxed">
                                <span className="text-emerald-700 font-mono shrink-0">{q.number}.</span>
                                <span>{q.questionText} <strong className="text-emerald-800 text-[11px] font-mono">(Skor Maksimal: {q.scoreMax})</strong></span>
                              </p>

                              {showAnswers && (
                                <div className="ml-4 p-3 bg-teal-50 border border-teal-100 rounded-lg text-xs space-y-1 mt-1">
                                  <strong className="text-teal-900">Ekspektasi Jawaban / Kriteria:</strong>
                                  <p className="text-slate-600 leading-relaxed font-medium">
                                    {q.expectedAnswer}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* PRACTICAL TEST VIEW (praktik) */}
                  {testData.tipeUlangan === 'praktik' && (
                    <div className="space-y-6 text-slate-850 text-xs sm:text-sm">
                      
                      {/* Task Instructions */}
                      <div className="space-y-3">
                        <h3 className="font-extrabold text-slate-900 border-b border-slate-150 pb-1.5 uppercase text-xs tracking-wider text-emerald-800">
                          I. Petunjuk Unjuk Kerja Siswa (Instruksi Tugas)
                        </h3>
                        <ol className="list-decimal pl-5 space-y-2 leading-relaxed font-medium">
                          {testData.taskInstructions.map((ins, idx) => (
                            <li key={idx} className="text-slate-700">
                              {ins}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Performance Scoring Rubric Table */}
                      <div className="space-y-3 pt-2">
                        <h3 className="font-extrabold text-slate-900 border-b border-slate-150 pb-1.5 uppercase text-xs tracking-wider text-emerald-800">
                          II. Rubrik Penilaian Kinerja Keterampilan
                        </h3>

                        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                                <th className="p-3 border-r border-slate-200 w-1/4">Aspek Penilaian</th>
                                <th className="p-3 border-r border-slate-200">Skor 4 (Sangat Baik)</th>
                                <th className="p-3 border-r border-slate-200">Skor 3 (Baik)</th>
                                <th className="p-3 border-r border-slate-200">Skor 2 (Cukup)</th>
                                <th className="p-3">Skor 1 (Perlu Bimbingan)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 leading-relaxed font-medium">
                              {testData.rubricCriteria.map((crit, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-3 border-r border-slate-200 font-extrabold text-slate-900 bg-slate-50">
                                    {crit.criteriaName}
                                  </td>
                                  <td className="p-3 border-r border-slate-200 text-slate-600">
                                    {crit.skor4}
                                  </td>
                                  <td className="p-3 border-r border-slate-200 text-slate-600">
                                    {crit.skor3}
                                  </td>
                                  <td className="p-3 border-r border-slate-200 text-slate-600">
                                    {crit.skor2}
                                  </td>
                                  <td className="p-3 text-slate-600">
                                    {crit.skor1}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Standard Scoring Guidelines / footer footer */}
                  <div className="border-t border-slate-200 pt-6 space-y-3 text-xs leading-relaxed text-slate-600">
                    <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider text-emerald-800">
                      III. Pedoman Penskoran &amp; Penggredan Akhir
                    </h4>
                    <div className="bg-slate-50/70 border border-slate-150 rounded-xl p-4 space-y-1.5 font-medium">
                      <p><strong>Formula Nilai:</strong> {testData.scoringFormula}</p>
                      <p><strong>Petunjuk Tambahan:</strong> {testData.gradingGuide}</p>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB CONTENT 2: LIVE GRADER & roster */}
              {viewTab === 'rekap' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600 animate-pulse" />
                        Grader Nilai Otomatis Kelas {testData.grade}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Masukkan pencapaian skor siswa di tabel berikut. Sistem akan langsung menghitung **Nilai Akhir (0-100)** berdasarkan bobot/rumus evaluasi TP secara real-time.
                      </p>
                    </div>

                    <button
                      onClick={handleExportCsv}
                      className="px-3.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Excel (CSV)</span>
                    </button>
                  </div>

                  {/* Quick Add Student */}
                  <div className="flex gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Masukkan nama murid baru..."
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddStudent();
                      }}
                    />
                    <button
                      onClick={handleAddStudent}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Siswa</span>
                    </button>
                  </div>

                  {/* Grading Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3 border-r border-slate-200 w-12 text-center">No</th>
                          <th className="p-3 border-r border-slate-200 w-1/3">Nama Siswa</th>
                          
                          {/* Columns depending on test type */}
                          {testData.tipeUlangan === 'tulis' ? (
                            <>
                              <th className="p-3 border-r border-slate-200 text-center w-28">PG Betul (Maks {jumlahSoal})</th>
                              <th className="p-3 border-r border-slate-200 text-center w-28">Skor Essay</th>
                            </>
                          ) : (
                            testData.rubricCriteria.map((crit, cIdx) => (
                              <th 
                                key={cIdx} 
                                className="p-3 border-r border-slate-200 text-center text-[9px] leading-tight"
                              >
                                {crit.criteriaName} (Skor 1-4)
                              </th>
                            ))
                          )}

                          <th className="p-3 text-center w-28 bg-emerald-50 text-emerald-900">Nilai Akhir (0-100)</th>
                          <th className="p-3 text-center w-12">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 font-medium">
                        {students.map((st, sIdx) => {
                          const finalGrade = calculateStudentFinalGrade(st);
                          return (
                            <tr key={st.id} className="hover:bg-slate-50/50">
                              <td className="p-3 border-r border-slate-200 text-center text-slate-400 font-mono">
                                {sIdx + 1}
                              </td>
                              <td className="p-3 border-r border-slate-200 font-bold text-slate-800">
                                {st.name}
                              </td>

                              {/* Input scores based on type */}
                              {testData.tipeUlangan === 'tulis' ? (
                                <>
                                  <td className="p-3 border-r border-slate-200 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={jumlahSoal}
                                      value={st.pgCorrectCount ?? 4}
                                      onChange={(e) => handleUpdatePgCorrect(st.id, Number(e.target.value))}
                                      className="w-16 text-center px-1 py-1 border border-slate-250 rounded font-bold bg-white"
                                    />
                                  </td>
                                  <td className="p-3 border-r border-slate-200 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={testData.essayQuestions?.reduce((acc, q) => acc + q.scoreMax, 0) || 10}
                                      value={st.essayScore ?? 8}
                                      onChange={(e) => handleUpdateEssayScore(st.id, Number(e.target.value))}
                                      className="w-16 text-center px-1 py-1 border border-slate-250 rounded font-bold bg-white"
                                    />
                                  </td>
                                </>
                              ) : (
                                testData.rubricCriteria.map((crit, cIdx) => (
                                  <td key={cIdx} className="p-3 border-r border-slate-200 text-center">
                                    <select
                                      value={st.scores[crit.criteriaName] ?? 3}
                                      onChange={(e) => handleUpdateScore(st.id, crit.criteriaName, Number(e.target.value))}
                                      className="px-1.5 py-1 border border-slate-250 rounded font-bold bg-white text-center"
                                    >
                                      <option value={4}>4 (Sangat Baik)</option>
                                      <option value={3}>3 (Baik)</option>
                                      <option value={2}>2 (Cukup)</option>
                                      <option value={1}>1 (Kurang)</option>
                                    </select>
                                  </td>
                                ))
                              )}

                              <td className="p-3 text-center bg-emerald-50/50 border-r border-slate-200">
                                <span className={`inline-flex items-center justify-center font-bold font-mono text-sm px-2.5 py-1 rounded-full ${
                                  finalGrade >= 75 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : finalGrade >= 60
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {finalGrade}
                                </span>
                              </td>

                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleRemoveStudent(st.id)}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors cursor-pointer"
                                  title="Hapus Siswa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[450px]">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <HelpCircle className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Belum Ada Soal / Rubrik Terbuat</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                Pilih atau ketik Tujuan Pembelajaran (TP) di sebelah kiri, tentukan tipe evaluasi yang diinginkan (Ujian Tulis atau Ujian Praktik), lalu klik tombol pembuatan untuk menghasilkan instrumen lengkap berbasis AI.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Ulangan Harian & Instrumen Asesmen PJOK"
        subtitle={`Kelas ${grade} SD - ${materi}`}
        tabs={getUlanganHarianPrompts(materi)}
        defaultActiveTab="kisi_ulangan"
        jsonData={testData || {
          grade,
          materi,
          tujuanPembelajaran,
          tipeUlangan,
          students
        }}
        jsonFilename={`Ulangan_Harian_Kelas_${grade}_${(materi || 'PJOK').replace(/\s+/g, '_')}.json`}
      />
    </div>
  );
}
