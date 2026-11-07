import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  PlusCircle, 
  FileText, 
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { ClassData, Student } from '../types';
import { downloadDocFile, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getUlanganHarianPrompts, getRekapNilaiTpPrompts } from '../utils/aiPromptGenerators';
import { TpItem, TpDailyScores, StudentSemesterScore, AssessmentWeights, StudentSemesterEvaluation } from './nilaiHarianTypes';
import { GRADE_SEMESTER_TP_PRESETS, calculateStudentSemesterEval } from './nilaiHarianPresets';
import DetailNilaiHarianTpTable from './DetailNilaiHarianTpTable';
import RekapNilaiHarianSemesterTable from './RekapNilaiHarianSemesterTable';
import RekapNilaiHarianSemuaTpTable from './RekapNilaiHarianSemuaTpTable';

interface RekapNilaiTpViewProps {
  classes: ClassData[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  onUpdateStudents?: (classId: string, students: Student[]) => void;
}

// Preset TPs based on Grade to make the tool instantly useful
const GRADE_TP_PRESETS: { [grade: number]: { code: string; text: string }[] } = {
  1: [
    { code: 'TP 1.1', text: 'Mempraktikkan variasi pola gerak dasar lokomotor (jalan, lari, lompat).' },
    { code: 'TP 1.2', text: 'Mempraktikkan pola gerak dasar non-lokomotor (meliuk, menekuk, meregang).' },
    { code: 'TP 1.3', text: 'Menunjukkan perilaku sportivitas dan kerjasama dalam aktivitas permainan sederhana.' }
  ],
  2: [
    { code: 'TP 2.1', text: 'Mempraktikkan variasi gerak dasar lokomotor dan non-lokomotor dalam bentuk permainan.' },
    { code: 'TP 2.2', text: 'Mempraktikkan aktivitas senam lantai sederhana tanpa alat secara seimbang.' },
    { code: 'TP 2.3', text: 'Mengenal bagian-bagian tubuh dan cara menjaga kebersihannya.' }
  ],
  3: [
    { code: 'TP 3.1', text: 'Mempraktikkan kombinasi gerak dasar manipulatif (melempar, menangkap, menendang).' },
    { code: 'TP 3.2', text: 'Mempraktikkan gerak dasar langkah kaki dalam aktivitas gerak berirama.' },
    { code: 'TP 3.3', text: 'Mengidentifikasi makanan bergizi dan pengaruhnya bagi kesehatan tubuh.' }
  ],
  4: [
    { code: 'TP 4.1', text: 'Mempraktikkan variasi pola gerak dasar dalam permainan kasti (melempar, menangkap, memukul).' },
    { code: 'TP 4.2', text: 'Mempraktikkan kombinasi gerak dasar atletik lari dan lompat melalui permainan modifikasi.' },
    { code: 'TP 4.3', text: 'Mengidentifikasi jenis cedera ringan saat berolahraga dan cara penanganannya.' }
  ],
  5: [
    { code: 'TP 5.1', text: 'Mempraktikkan kombinasi gerak dasar passing bawah dan atas pada permainan bola voli.' },
    { code: 'TP 5.2', text: 'Mempraktikkan aktivitas senam lantai guling depan (roll depan) secara aman.' },
    { code: 'TP 5.3', text: 'Menerapkan konsep kebugaran jasmani untuk meningkatkan daya tahan jantung (cardio).' }
  ],
  6: [
    { code: 'TP 6.1', text: 'Mempraktikkan variasi dan kombinasi gerak dasar menembak (shooting) dalam bola basket.' },
    { code: 'TP 6.2', text: 'Mempraktikkan taktik penyerangan dan pertahanan sederhana dalam pencak silat.' },
    { code: 'TP 6.3', text: 'Mempraktikkan latihan kelincahan (shuttle run) untuk menjaga kebugaran tubuh.' }
  ]
};

export default function RekapNilaiTpView({ classes, selectedClassId, setSelectedClassId, onUpdateStudents }: RekapNilaiTpViewProps) {
  const activeClass = useMemo(() => {
    return classes.find(c => c.id === selectedClassId) || classes[0] || { id: '', name: 'Tanpa Kelas', grade: 1, students: [] };
  }, [classes, selectedClassId]);

  const handleToggleGender = (studentId: string) => {
    if (!onUpdateStudents || !activeClass) return;
    const updated = activeClass.students.map(s => {
      if (s.id === studentId) {
        return { ...s, gender: (s.gender === 'L' ? 'P' : 'L') as 'L' | 'P' };
      }
      return s;
    });
    onUpdateStudents(activeClass.id, updated);
  };

  // Subject and school year configs
  const [subject, setSubject] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan');
  const [semester, setSemester] = useState<1 | 2>(1);
  const [schoolYear, setSchoolYear] = useState('2026/2027');
  const [kktp, setKktp] = useState<number>(70); // Kriteria Ketercapaian Tujuan Pembelajaran

  // View mode: 'all_daily_tp' (Rekap Nilai Harian Semua TP Lengkap) vs 'semester_rekap' (Rekap Nilai 1 Semester Rapor) vs 'daily_tp' (Detail Formatif per 1 TP) vs 'matrix' (Matriks Ringkas TP)
  const [viewMode, setViewMode] = useState<'all_daily_tp' | 'semester_rekap' | 'daily_tp' | 'matrix'>('all_daily_tp');
  const [activeTpId, setActiveTpId] = useState<string>('');
  const [showSidebarSettings, setShowSidebarSettings] = useState(false);

  // TPs State
  const [tps, setTps] = useState<TpItem[]>([]);
  const [newTpCode, setNewTpCode] = useState('');
  const [newTpText, setNewTpText] = useState('');
  const [isAddingTp, setIsAddingTp] = useState(false);

  // Scores state: { [studentId]: { [tpId]: score } }
  const [scores, setScores] = useState<{ [studentId: string]: { [tpId: string]: number } }>({});

  // Daily scores: { [studentId]: { [tpId]: { nh1, nh2, nh3, sumatifTp } } }
  const [dailyScores, setDailyScores] = useState<{ [studentId: string]: { [tpId: string]: TpDailyScores } }>({});

  // Semester scores: { [studentId]: { sts, sas } }
  const [semesterScores, setSemesterScores] = useState<{ [studentId: string]: StudentSemesterScore }>({});

  // Assessment weights: { tp: 2, sts: 1, sas: 1 } (50% TP, 25% STS, 25% SAS)
  const [weights, setWeights] = useState<AssessmentWeights>({ tp: 2, sts: 1, sas: 1 });
  const [showWeightConfig, setShowWeightConfig] = useState(false);

  // Institutional Signatures
  const [teacherName, setTeacherName] = useState('Sandi Rafsanjani, S.Pd.');
  const [teacherNip, setTeacherNip] = useState('19940812 202321 1 002');
  const [principalName, setPrincipalName] = useState('H. Ahmad Dahlan, M.Pd.');
  const [principalNip, setPrincipalNip] = useState('19780102 200501 1 003');
  const [printCity, setPrintCity] = useState('Jakarta');
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Load saved TPs, daily scores, and semester scores from localStorage on class or semester change
  useEffect(() => {
    if (!activeClass.id) return;

    const classPrefix = `${activeClass.id}_sm${semester}`;

    // 1. Load TPs
    const savedTps = localStorage.getItem(`rekap_tp_list_${classPrefix}`) || localStorage.getItem(`rekap_tp_list_${activeClass.id}`);
    let loadedTps: TpItem[] = [];
    if (savedTps) {
      try {
        loadedTps = JSON.parse(savedTps);
      } catch (e) {
        console.error(e);
      }
    }
    if (!loadedTps || loadedTps.length === 0) {
      const presets = GRADE_SEMESTER_TP_PRESETS[activeClass.grade]?.[semester] || GRADE_SEMESTER_TP_PRESETS[1][1];
      loadedTps = presets.map((p, idx) => ({
        id: `tp-${classPrefix}-${idx + 1}`,
        code: p.code,
        text: p.text
      }));
      localStorage.setItem(`rekap_tp_list_${classPrefix}`, JSON.stringify(loadedTps));
    }
    setTps(loadedTps);
    if (loadedTps.length > 0) {
      setActiveTpId(loadedTps[0].id);
    }

    // 2. Load Daily Scores (NH1, NH2, NH3, Sumatif TP)
    const savedDaily = localStorage.getItem(`rekap_tp_daily_${classPrefix}`);
    let currentDaily: { [studentId: string]: { [tpId: string]: TpDailyScores } } = {};
    if (savedDaily) {
      try {
        currentDaily = JSON.parse(savedDaily);
      } catch (e) {
        console.error(e);
      }
    }

    // 3. Load Overall TP Scores
    const savedScores = localStorage.getItem(`rekap_tp_scores_${classPrefix}`) || localStorage.getItem(`rekap_tp_scores_${activeClass.id}`);
    let currentScores: { [studentId: string]: { [tpId: string]: number } } = {};
    if (savedScores) {
      try {
        currentScores = JSON.parse(savedScores);
      } catch (e) {
        console.error(e);
      }
    }

    // 4. Load Semester Scores (STS & SAS)
    const savedSemesterScores = localStorage.getItem(`rekap_tp_semester_${classPrefix}`);
    let currentSemesterScores: { [studentId: string]: StudentSemesterScore } = {};
    if (savedSemesterScores) {
      try {
        currentSemesterScores = JSON.parse(savedSemesterScores);
      } catch (e) {
        console.error(e);
      }
    }

    // Initialize missing student scores
    activeClass.students.forEach(student => {
      if (!currentDaily[student.id]) currentDaily[student.id] = {};
      if (!currentScores[student.id]) currentScores[student.id] = {};

      const baseScore = Math.round((student.scores.cognitive + student.scores.psychomotor) / 2) || 78;

      loadedTps.forEach((tp, tIdx) => {
        if (!currentDaily[student.id][tp.id]) {
          const rand = ((student.id.charCodeAt(0) + tIdx * 3) % 9) - 4;
          const nh1 = Math.min(100, Math.max(60, baseScore + rand));
          const nh2 = Math.min(100, Math.max(60, baseScore + (rand > 0 ? rand - 1 : rand + 1)));
          const nh3 = Math.min(100, Math.max(65, baseScore + 2));
          const sumatif = Math.min(100, Math.max(60, baseScore + rand));
          currentDaily[student.id][tp.id] = { nh1, nh2, nh3, sumatifTp: sumatif };
        }

        if (currentScores[student.id][tp.id] === undefined) {
          const d = currentDaily[student.id][tp.id];
          currentScores[student.id][tp.id] = Math.round((d.nh1 + d.nh2 + d.nh3 + d.sumatifTp) / 4);
        }
      });

      if (!currentSemesterScores[student.id]) {
        currentSemesterScores[student.id] = {
          sts: Math.min(100, Math.max(65, baseScore)),
          sas: Math.min(100, Math.max(65, baseScore + 1))
        };
      }
    });

    setDailyScores(currentDaily);
    setScores(currentScores);
    setSemesterScores(currentSemesterScores);

    // Load Weights
    const savedWeights = localStorage.getItem(`rekap_tp_weights_${classPrefix}`);
    if (savedWeights) {
      try {
        setWeights(JSON.parse(savedWeights));
      } catch (e) {
        console.error(e);
      }
    }
  }, [activeClass.id, activeClass.grade, activeClass.students, semester]);

  // Save helpers
  const saveTpsToStorage = (updatedTps: TpItem[]) => {
    setTps(updatedTps);
    localStorage.setItem(`rekap_tp_list_${activeClass.id}_sm${semester}`, JSON.stringify(updatedTps));
  };

  const saveScoresToStorage = (updatedScores: typeof scores) => {
    setScores(updatedScores);
    localStorage.setItem(`rekap_tp_scores_${activeClass.id}_sm${semester}`, JSON.stringify(updatedScores));
  };

  const saveDailyScoresToStorage = (updatedDaily: typeof dailyScores) => {
    setDailyScores(updatedDaily);
    localStorage.setItem(`rekap_tp_daily_${activeClass.id}_sm${semester}`, JSON.stringify(updatedDaily));
  };

  const saveSemesterScoresToStorage = (updatedSemester: typeof semesterScores) => {
    setSemesterScores(updatedSemester);
    localStorage.setItem(`rekap_tp_semester_${activeClass.id}_sm${semester}`, JSON.stringify(updatedSemester));
  };

  const saveWeightsToStorage = (updatedWeights: AssessmentWeights) => {
    setWeights(updatedWeights);
    localStorage.setItem(`rekap_tp_weights_${activeClass.id}_sm${semester}`, JSON.stringify(updatedWeights));
  };

  // Update specific daily score component (NH1, NH2, NH3, Sumatif TP)
  const handleUpdateDailyScore = (studentId: string, tpId: string, field: keyof TpDailyScores, val: number) => {
    const num = Math.min(100, Math.max(0, val || 0));
    const currentStudentDaily = dailyScores[studentId]?.[tpId] || { nh1: 75, nh2: 75, nh3: 75, sumatifTp: 75 };
    const updatedStudentDaily = { ...currentStudentDaily, [field]: num };

    const newDaily = {
      ...dailyScores,
      [studentId]: {
        ...dailyScores[studentId],
        [tpId]: updatedStudentDaily
      }
    };
    saveDailyScoresToStorage(newDaily);

    // Automatically recalculate overall TP score
    const newFinalScore = Math.round(
      (updatedStudentDaily.nh1 + updatedStudentDaily.nh2 + updatedStudentDaily.nh3 + updatedStudentDaily.sumatifTp) / 4
    );
    const newScores = {
      ...scores,
      [studentId]: {
        ...scores[studentId],
        [tpId]: newFinalScore
      }
    };
    saveScoresToStorage(newScores);
  };

  // Update overall TP score directly
  const handleUpdateTpFinalScore = (studentId: string, tpId: string, val: number) => {
    const num = Math.min(100, Math.max(0, val || 0));
    const newScores = {
      ...scores,
      [studentId]: {
        ...scores[studentId],
        [tpId]: num
      }
    };
    saveScoresToStorage(newScores);
  };

  // Update Semester Score (STS / SAS)
  const handleUpdateSemesterScore = (studentId: string, field: 'sts' | 'sas', val: number) => {
    const num = Math.min(100, Math.max(0, val || 0));
    const current = semesterScores[studentId] || { sts: 75, sas: 75 };
    const updated = { ...current, [field]: num };
    const newSem = {
      ...semesterScores,
      [studentId]: updated
    };
    saveSemesterScoresToStorage(newSem);
  };

  // Add a new TP
  const handleAddTp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTpCode.trim() || !newTpText.trim()) return;

    const newTp = {
      id: `tp-${activeClass.id}-${Date.now()}`,
      code: newTpCode.trim(),
      text: newTpText.trim()
    };

    const updatedTps = [...tps, newTp];
    saveTpsToStorage(updatedTps);

    // Initialize scores for this new TP
    const updatedScores = { ...scores };
    activeClass.students.forEach(student => {
      if (!updatedScores[student.id]) {
        updatedScores[student.id] = {};
      }
      updatedScores[student.id][newTp.id] = 75; // Default score
    });
    saveScoresToStorage(updatedScores);

    setNewTpCode('');
    setNewTpText('');
    setIsAddingTp(false);
  };

  // Delete a TP
  const handleDeleteTp = (tpId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus TP ini? Semua nilai siswa untuk TP ini akan hilang.')) {
      const updatedTps = tps.filter(t => t.id !== tpId);
      saveTpsToStorage(updatedTps);

      // Clean scores
      const updatedScores = { ...scores };
      Object.keys(updatedScores).forEach(studentId => {
        delete updatedScores[studentId][tpId];
      });
      saveScoresToStorage(updatedScores);
    }
  };

  // Update specific student score
  const handleScoreChange = (studentId: string, tpId: string, val: string) => {
    let numericVal = parseInt(val, 10);
    if (isNaN(numericVal)) {
      numericVal = 0;
    }
    numericVal = Math.min(100, Math.max(0, numericVal));

    const updatedScores = {
      ...scores,
      [studentId]: {
        ...scores[studentId],
        [tpId]: numericVal
      }
    };
    saveScoresToStorage(updatedScores);
  };

  // Simulate sensible scores for the entire class (testing helper)
  const handleAutoFill = () => {
    if (window.confirm('Simulasikan pengisian nilai harian dan semester otomatis untuk kelas ini berdasarkan performa kognitif & psikomotorik siswa?')) {
      const updatedScores = { ...scores };
      const updatedDaily = { ...dailyScores };
      const updatedSemester = { ...semesterScores };

      activeClass.students.forEach(student => {
        updatedScores[student.id] = {};
        updatedDaily[student.id] = {};

        const base = Math.round((student.scores.cognitive + student.scores.psychomotor) / 2) || 78;

        tps.forEach((tp, tIdx) => {
          const rand = Math.floor(Math.random() * 11) - 5; // -5 to +5
          const nh1 = Math.min(100, Math.max(60, base + rand));
          const nh2 = Math.min(100, Math.max(60, base + (rand > 0 ? rand - 2 : rand + 2)));
          const nh3 = Math.min(100, Math.max(65, base + 2));
          const sumatifTp = Math.min(100, Math.max(60, base + rand));

          updatedDaily[student.id][tp.id] = { nh1, nh2, nh3, sumatifTp };
          updatedScores[student.id][tp.id] = Math.round((nh1 + nh2 + nh3 + sumatifTp) / 4);
        });

        const devSts = Math.floor(Math.random() * 9) - 4;
        const devSas = Math.floor(Math.random() * 9) - 4;
        updatedSemester[student.id] = {
          sts: Math.min(100, Math.max(60, base + devSts)),
          sas: Math.min(100, Math.max(60, base + devSas))
        };
      });

      saveScoresToStorage(updatedScores);
      saveDailyScoresToStorage(updatedDaily);
      saveSemesterScoresToStorage(updatedSemester);
    }
  };

  // Clear all scores
  const handleClearScores = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset seluruh nilai pada tabel ini menjadi 0?')) {
      const updatedScores = { ...scores };
      const updatedDaily = { ...dailyScores };
      const updatedSemester = { ...semesterScores };

      activeClass.students.forEach(student => {
        updatedScores[student.id] = {};
        updatedDaily[student.id] = {};
        tps.forEach(tp => {
          updatedScores[student.id][tp.id] = 0;
          updatedDaily[student.id][tp.id] = { nh1: 0, nh2: 0, nh3: 0, sumatifTp: 0 };
        });
        updatedSemester[student.id] = { sts: 0, sas: 0 };
      });

      saveScoresToStorage(updatedScores);
      saveDailyScoresToStorage(updatedDaily);
      saveSemesterScoresToStorage(updatedSemester);
    }
  };

  // Calculate comprehensive semester evaluations for each student
  const evaluations: StudentSemesterEvaluation[] = useMemo(() => {
    return activeClass.students.map(student => {
      return calculateStudentSemesterEval(student, tps, scores, dailyScores, semesterScores, weights, kktp);
    });
  }, [activeClass.students, tps, scores, dailyScores, semesterScores, weights, kktp]);

  // Per-student statistics mapping for convenient access across components and tables
  const studentStats = useMemo(() => {
    const map: { [studentId: string]: { average: number; isPassed: boolean; evaluation: StudentSemesterEvaluation } } = {};
    evaluations.forEach(ev => {
      map[ev.studentId] = {
        average: ev.rerataTp,
        isPassed: ev.isPassed,
        evaluation: ev
      };
    });
    return map;
  }, [evaluations]);

  // Currently selected TP for detailed formative scoring view
  const currentActiveTp: TpItem = useMemo(() => {
    return tps.find(t => t.id === activeTpId) || tps[0] || { id: 'tp-default', code: 'TP 1.1', text: 'Tujuan Pembelajaran' };
  }, [tps, activeTpId]);

  // Average score per TP column
  const tpClassAverages = useMemo(() => {
    const averages: { [tpId: string]: number } = {};
    tps.forEach(tp => {
      let sum = 0;
      let count = 0;
      evaluations.forEach(ev => {
        const val = ev.tpScores[tp.id];
        if (val !== undefined) {
          sum += val;
          count++;
        }
      });
      averages[tp.id] = count > 0 ? Math.round(sum / count) : 0;
    });
    return averages;
  }, [tps, evaluations]);

  // Overall class statistics summary
  const summaryStats = useMemo(() => {
    const studentList = activeClass.students;
    if (studentList.length === 0 || evaluations.length === 0) {
      return {
        classAverage: 0,
        classRerataTpAverage: 0,
        classStsAverage: 0,
        classSasAverage: 0,
        passedPercent: 0,
        totalPassed: 0,
        totalFailed: 0
      };
    }

    let sumFinal = 0;
    let sumRerataTp = 0;
    let sumSts = 0;
    let sumSas = 0;
    let totalPassed = 0;

    evaluations.forEach(ev => {
      sumFinal += ev.nilaiAkhirSemester;
      sumRerataTp += ev.rerataTp;
      sumSts += ev.sts;
      sumSas += ev.sas;
      if (ev.isPassed) totalPassed++;
    });

    const totalStudents = evaluations.length;
    return {
      classAverage: Math.round(sumFinal / totalStudents),
      classRerataTpAverage: Math.round(sumRerataTp / totalStudents),
      classStsAverage: Math.round(sumSts / totalStudents),
      classSasAverage: Math.round(sumSas / totalStudents),
      passedPercent: Math.round((totalPassed / totalStudents) * 100),
      totalPassed,
      totalFailed: totalStudents - totalPassed
    };
  }, [activeClass.students, evaluations]);

  // CSV Export handler
  const handleExportCsv = () => {
    let csv = '';
    if (viewMode === 'all_daily_tp') {
      csv = `REKAPITULASI NILAI HARIAN SEMUA TUJUAN PEMBELAJARAN (TP) - FORMATIF & SUMATIF\n`;
      csv += `Mata Pelajaran: ${subject}\n`;
      csv += `Kelas: ${activeClass.name}\n`;
      csv += `Semester: ${semester}\n`;
      csv += `Tahun Pelajaran: ${schoolYear}\n`;
      csv += `KKTP Threshold: ${kktp}\n\n`;

      csv += `No,Nama Peserta Didik,L/P,`;
      tps.forEach(tp => {
        csv += `"${tp.code} NH1 (Praktik)","${tp.code} NH2 (Teori)","${tp.code} NH3 (Tugas)","${tp.code} S-TP","${tp.code} N-TP",`;
      });
      csv += `Rerata Harian (R-TP),Predikat,Status Ketuntasan\n`;

      activeClass.students.forEach((student, idx) => {
        csv += `${idx + 1},"${student.name}","${student.gender}",`;
        let studentTotal = 0;
        tps.forEach(tp => {
          const d = dailyScores[student.id]?.[tp.id] || { nh1: 75, nh2: 75, nh3: 75, sumatifTp: 75 };
          const explicitFinal = scores[student.id]?.[tp.id];
          const finalScore = explicitFinal !== undefined ? explicitFinal : Math.round((d.nh1 + d.nh2 + d.nh3 + d.sumatifTp) / 4);
          studentTotal += finalScore;
          csv += `${d.nh1},${d.nh2},${d.nh3},${d.sumatifTp},${finalScore},`;
        });
        const rTp = tps.length > 0 ? Math.round(studentTotal / tps.length) : 75;
        const pred = rTp >= 90 ? 'A' : rTp >= 80 ? 'B' : rTp >= 70 ? 'C' : 'D';
        const status = rTp >= kktp ? 'Tuntas' : 'Remedial';
        csv += `${rTp},"${pred}","${status}"\n`;
      });

      // Class average row
      csv += `,,Rata-rata Kelas,`;
      tps.forEach(tp => {
        let sumNh1 = 0, sumNh2 = 0, sumNh3 = 0, sumSumatif = 0, sumFinal = 0;
        const count = activeClass.students.length || 1;
        activeClass.students.forEach(student => {
          const d = dailyScores[student.id]?.[tp.id] || { nh1: 75, nh2: 75, nh3: 75, sumatifTp: 75 };
          const explicitFinal = scores[student.id]?.[tp.id];
          const finalScore = explicitFinal !== undefined ? explicitFinal : Math.round((d.nh1 + d.nh2 + d.nh3 + d.sumatifTp) / 4);
          sumNh1 += d.nh1;
          sumNh2 += d.nh2;
          sumNh3 += d.nh3;
          sumSumatif += d.sumatifTp;
          sumFinal += finalScore;
        });
        csv += `${Math.round(sumNh1 / count)},${Math.round(sumNh2 / count)},${Math.round(sumNh3 / count)},${Math.round(sumSumatif / count)},${Math.round(sumFinal / count)},`;
      });
      csv += `${summaryStats.classRerataTpAverage},,${summaryStats.passedPercent}% Tuntas\n`;
    } else if (viewMode === 'semester_rekap') {
      csv = `REKAPITULASI NILAI HARIAN PER TP 1 SEMESTER LENGKAP (KURIKULUM MERDEKA)\n`;
      csv += `Mata Pelajaran: ${subject}\n`;
      csv += `Kelas: ${activeClass.name}\n`;
      csv += `Semester: ${semester}\n`;
      csv += `Tahun Pelajaran: ${schoolYear}\n`;
      csv += `KKTP Threshold: ${kktp}\n\n`;

      csv += `No,Nama Peserta Didik,L/P,`;
      tps.forEach(tp => {
        csv += `"${tp.code} - ${tp.text.replace(/"/g, '""')}",`;
      });
      csv += `Rerata TP,STS,SAS,Nilai Akhir (NA),Predikat,Status Ketuntasan,Deskripsi Capaian Rapor Kurikulum Merdeka\n`;

      evaluations.forEach((ev, idx) => {
        csv += `${idx + 1},"${ev.studentName}","${ev.gender}",`;
        tps.forEach(tp => {
          csv += `${ev.tpScores[tp.id] ?? 0},`;
        });
        csv += `${ev.rerataTp},${ev.sts},${ev.sas},${ev.nilaiAkhirSemester},"${ev.predikat}","${ev.isPassed ? 'Tuntas' : 'Remedial'}","${ev.deskripsiRapor.replace(/"/g, '""')}"\n`;
      });

      csv += `,,Rata-rata Kelas,`;
      tps.forEach(tp => {
        csv += `${tpClassAverages[tp.id] || 0},`;
      });
      csv += `${summaryStats.classRerataTpAverage},${summaryStats.classStsAverage},${summaryStats.classSasAverage},${summaryStats.classAverage},,${summaryStats.passedPercent}% Tuntas,\n`;
    } else if (viewMode === 'daily_tp') {
      csv = `DETAIL ASESMEN FORMATIF HARIAN PER TP (${currentActiveTp.code})\n`;
      csv += `Mata Pelajaran: ${subject}\n`;
      csv += `Tujuan Pembelajaran: "${currentActiveTp.text.replace(/"/g, '""')}"\n`;
      csv += `Kelas: ${activeClass.name} | Semester: ${semester} | KKTP: ${kktp}\n\n`;

      csv += `No,Nama Peserta Didik,L/P,NH1 (Praktik),NH2 (Teori),NH3 (Tugas),Sumatif TP,Nilai Akhir TP,Ketuntasan\n`;
      activeClass.students.forEach((student, idx) => {
        const d = dailyScores[student.id]?.[currentActiveTp.id] || { nh1: 75, nh2: 75, nh3: 75, sumatifTp: 75 };
        const finalScore = scores[student.id]?.[currentActiveTp.id] ?? Math.round((d.nh1 + d.nh2 + d.nh3 + d.sumatifTp) / 4);
        const status = finalScore >= kktp ? 'Tuntas' : 'Remedial';
        csv += `${idx + 1},"${student.name}","${student.gender}",${d.nh1},${d.nh2},${d.nh3},${d.sumatifTp},${finalScore},"${status}"\n`;
      });
    } else {
      csv = `REKAP NILAI HARIAN PER TUJUAN PEMBELAJARAN (TP)\n`;
      csv += `Mata Pelajaran: ${subject}\n`;
      csv += `Kelas: ${activeClass.name}\n`;
      csv += `Semester: ${semester}\n`;
      csv += `Tahun Pelajaran: ${schoolYear}\n`;
      csv += `KKTP Threshold: ${kktp}\n\n`;

      csv += `No,Nama Siswa,L/P,`;
      tps.forEach(tp => {
        csv += `"${tp.code} - ${tp.text.replace(/"/g, '""')}",`;
      });
      csv += `Rata-rata,Ketuntasan\n`;

      activeClass.students.forEach((student, idx) => {
        csv += `${idx + 1},"${student.name}","${student.gender}",`;
        tps.forEach(tp => {
          const score = scores[student.id]?.[tp.id] ?? 0;
          csv += `${score},`;
        });
        const avg = studentStats[student.id]?.average || 0;
        const status = avg >= kktp ? 'Tuntas' : 'Perlu Remedial';
        csv += `${avg},"${status}"\n`;
      });

      csv += `,,Rata-rata Kelas,`;
      tps.forEach(tp => {
        csv += `${tpClassAverages[tp.id]},`;
      });
      csv += `${summaryStats.classAverage},\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Nilai_TP_${activeClass.name.replace(/\s+/g, '_')}_Sm${semester}_${viewMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Build HTML for Word & F4 PDF Export
  const buildRekapNilaiHtml = () => {
    let mainTableSection = '';
    if (viewMode === 'all_daily_tp') {
      mainTableSection = `
        <h3 style="font-size: 12pt; text-transform: uppercase; margin-bottom: 8px;">B. Rekapitulasi Nilai Harian Semua TP (Formatif &amp; Sumatif Lengkap)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; text-align: center;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold;">
              <th style="border: 1px solid #000; padding: 4px;" rowspan="2">No</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: left;" rowspan="2">Nama Peserta Didik</th>
              <th style="border: 1px solid #000; padding: 4px;" rowspan="2">L/P</th>
              ${tps.map(tp => `
                <th style="border: 1px solid #000; padding: 4px;" colspan="5">${tp.code}</th>
              `).join('')}
              <th style="border: 1px solid #000; padding: 4px; background-color: #065f46;" rowspan="2">R-TP</th>
              <th style="border: 1px solid #000; padding: 4px;" rowspan="2">Pred</th>
              <th style="border: 1px solid #000; padding: 4px;" rowspan="2">Status</th>
            </tr>
            <tr style="background-color: #1e293b; color: #ffffff; font-weight: bold; font-size: 7pt;">
              ${tps.map(tp => `
                <th style="border: 1px solid #000; padding: 2px;">NH1</th>
                <th style="border: 1px solid #000; padding: 2px;">NH2</th>
                <th style="border: 1px solid #000; padding: 2px;">NH3</th>
                <th style="border: 1px solid #000; padding: 2px; background-color: #fffbeb; color: #78350f;">S-TP</th>
                <th style="border: 1px solid #000; padding: 2px; background-color: #047857; color: #ffffff;">N-TP</th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${activeClass.students.map((student, idx) => {
              let totalTp = 0;
              const tpCols = tps.map(tp => {
                const d = dailyScores[student.id]?.[tp.id] || { nh1: 75, nh2: 75, nh3: 75, sumatifTp: 75 };
                const explicitFinal = scores[student.id]?.[tp.id];
                const finalScore = explicitFinal !== undefined ? explicitFinal : Math.round((d.nh1 + d.nh2 + d.nh3 + d.sumatifTp) / 4);
                totalTp += finalScore;
                return `
                  <td style="border: 1px solid #000; padding: 2px;">${d.nh1}</td>
                  <td style="border: 1px solid #000; padding: 2px;">${d.nh2}</td>
                  <td style="border: 1px solid #000; padding: 2px;">${d.nh3}</td>
                  <td style="border: 1px solid #000; padding: 2px; background-color: #fffbeb;">${d.sumatifTp}</td>
                  <td style="border: 1px solid #000; padding: 2px; font-weight: bold; background-color: #ecfdf5;">${finalScore}</td>
                `;
              }).join('');

              const rTp = tps.length > 0 ? Math.round(totalTp / tps.length) : 75;
              const pred = rTp >= 90 ? 'A' : rTp >= 80 ? 'B' : rTp >= 70 ? 'C' : 'D';
              const status = rTp >= kktp ? 'Tuntas' : 'Remedial';

              return `
                <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                  <td style="border: 1px solid #000; padding: 2px;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 2px; text-align: left;"><strong>${student.name}</strong></td>
                  <td style="border: 1px solid #000; padding: 2px;">${student.gender}</td>
                  ${tpCols}
                  <td style="border: 1px solid #000; padding: 2px; font-weight: bold; background-color: #d1fae5;">${rTp}</td>
                  <td style="border: 1px solid #000; padding: 2px; font-weight: bold;">${pred}</td>
                  <td style="border: 1px solid #000; padding: 2px; font-weight: bold; color: ${rTp >= kktp ? '#16a34a' : '#dc2626'};">${status}</td>
                </tr>
              `;
            }).join('')}
            <tr style="font-weight: bold; background-color: #e2e8f0;">
              <td colspan="3" style="border: 1px solid #000; padding: 3px; text-align: right;">RATA-RATA KELAS:</td>
              ${tps.map(tp => {
                let sumNh1 = 0, sumNh2 = 0, sumNh3 = 0, sumSumatif = 0, sumFinal = 0;
                const count = activeClass.students.length || 1;
                activeClass.students.forEach(student => {
                  const d = dailyScores[student.id]?.[tp.id] || { nh1: 75, nh2: 75, nh3: 75, sumatifTp: 75 };
                  const explicitFinal = scores[student.id]?.[tp.id];
                  const finalScore = explicitFinal !== undefined ? explicitFinal : Math.round((d.nh1 + d.nh2 + d.nh3 + d.sumatifTp) / 4);
                  sumNh1 += d.nh1;
                  sumNh2 += d.nh2;
                  sumNh3 += d.nh3;
                  sumSumatif += d.sumatifTp;
                  sumFinal += finalScore;
                });
                return `
                  <td style="border: 1px solid #000; padding: 2px;">${Math.round(sumNh1 / count)}</td>
                  <td style="border: 1px solid #000; padding: 2px;">${Math.round(sumNh2 / count)}</td>
                  <td style="border: 1px solid #000; padding: 2px;">${Math.round(sumNh3 / count)}</td>
                  <td style="border: 1px solid #000; padding: 2px;">${Math.round(sumSumatif / count)}</td>
                  <td style="border: 1px solid #000; padding: 2px; background-color: #a7f3d0;">${Math.round(sumFinal / count)}</td>
                `;
              }).join('')}
              <td style="border: 1px solid #000; padding: 3px; background-color: #6ee7b7;">${summaryStats.classRerataTpAverage}</td>
              <td style="border: 1px solid #000; padding: 3px;">-</td>
              <td style="border: 1px solid #000; padding: 3px; color: #16a34a;">${summaryStats.passedPercent}% Tuntas</td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (viewMode === 'semester_rekap') {
      mainTableSection = `
        <h3 style="font-size: 12pt; text-transform: uppercase; margin-bottom: 8px;">B. Rekapitulasi Nilai Harian per TP 1 Semester Lengkap</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; text-align: center;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold;">
              <th style="border: 1px solid #000; padding: 4px;" rowspan="2">No</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: left;" rowspan="2">Nama Peserta Didik</th>
              <th style="border: 1px solid #000; padding: 4px;" rowspan="2">L/P</th>
              <th style="border: 1px solid #000; padding: 4px;" colspan="${tps.length}">Nilai Harian per TP</th>
              <th style="border: 1px solid #000; padding: 4px;" rowspan="2">R-TP</th>
              <th style="border: 1px solid #000; padding: 4px;" rowspan="2">STS</th>
              <th style="border: 1px solid #000; padding: 4px;" rowspan="2">SAS</th>
              <th style="border: 1px solid #000; padding: 4px; background-color: #065f46;" rowspan="2">NA</th>
              <th style="border: 1px solid #000; padding: 4px;" rowspan="2">Pred</th>
              <th style="border: 1px solid #000; padding: 4px;" rowspan="2">Status</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: left;" rowspan="2">Deskripsi Capaian Rapor</th>
            </tr>
            <tr style="background-color: #1e293b; color: #ffffff; font-weight: bold; font-size: 8pt;">
              ${tps.map(tp => `<th style="border: 1px solid #000; padding: 3px;">${tp.code}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${evaluations.map((ev, idx) => `
              <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                <td style="border: 1px solid #000; padding: 3px;">${idx + 1}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: left;"><strong>${ev.studentName}</strong></td>
                <td style="border: 1px solid #000; padding: 3px;">${ev.gender}</td>
                ${tps.map(tp => `<td style="border: 1px solid #000; padding: 3px;">${ev.tpScores[tp.id] ?? '-'}</td>`).join('')}
                <td style="border: 1px solid #000; padding: 3px; font-weight: bold;">${ev.rerataTp}</td>
                <td style="border: 1px solid #000; padding: 3px;">${ev.sts}</td>
                <td style="border: 1px solid #000; padding: 3px;">${ev.sas}</td>
                <td style="border: 1px solid #000; padding: 3px; font-weight: bold; background-color: #ecfdf5;">${ev.nilaiAkhirSemester}</td>
                <td style="border: 1px solid #000; padding: 3px; font-weight: bold;">${ev.predikat.charAt(0)}</td>
                <td style="border: 1px solid #000; padding: 3px; font-weight: bold; color: ${ev.isPassed ? '#16a34a' : '#dc2626'};">${ev.isPassed ? 'Tuntas' : 'Remedial'}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: left; font-size: 7.5pt;">${ev.deskripsiRapor}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; background-color: #e2e8f0;">
              <td colspan="3" style="border: 1px solid #000; padding: 4px; text-align: right;">RERATA KELAS:</td>
              ${tps.map(tp => `<td style="border: 1px solid #000; padding: 4px;">${tpClassAverages[tp.id] || 0}</td>`).join('')}
              <td style="border: 1px solid #000; padding: 4px;">${summaryStats.classRerataTpAverage}</td>
              <td style="border: 1px solid #000; padding: 4px;">${summaryStats.classStsAverage}</td>
              <td style="border: 1px solid #000; padding: 4px;">${summaryStats.classSasAverage}</td>
              <td style="border: 1px solid #000; padding: 4px; background-color: #d1fae5;">${summaryStats.classAverage}</td>
              <td colspan="2" style="border: 1px solid #000; padding: 4px; color: #16a34a;">${summaryStats.passedPercent}% Tuntas</td>
              <td style="border: 1px solid #000; padding: 4px; font-size: 8pt;">${summaryStats.totalPassed} Tuntas, ${summaryStats.totalFailed} Remedial</td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (viewMode === 'daily_tp') {
      mainTableSection = `
        <h3 style="font-size: 12pt; text-transform: uppercase; margin-bottom: 8px;">B. Detail Asesmen Formatif Harian: ${currentActiveTp.code}</h3>
        <p style="font-size: 10pt; margin-bottom: 12px;">Kompetensi: <em>${currentActiveTp.text}</em></p>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; text-align: center;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold;">
              <th style="border: 1px solid #000; padding: 6px; width: 5%;">No</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 28%;">Nama Siswa</th>
              <th style="border: 1px solid #000; padding: 6px; width: 7%;">L/P</th>
              <th style="border: 1px solid #000; padding: 6px;">NH1 (Praktik)</th>
              <th style="border: 1px solid #000; padding: 6px;">NH2 (Teori)</th>
              <th style="border: 1px solid #000; padding: 6px;">NH3 (Tugas)</th>
              <th style="border: 1px solid #000; padding: 6px;">Sumatif TP</th>
              <th style="border: 1px solid #000; padding: 6px; background-color: #065f46;">Nilai Akhir TP</th>
              <th style="border: 1px solid #000; padding: 6px;">Ketuntasan</th>
            </tr>
          </thead>
          <tbody>
            ${activeClass.students.map((student, idx) => {
              const d = dailyScores[student.id]?.[currentActiveTp.id] || { nh1: 75, nh2: 75, nh3: 75, sumatifTp: 75 };
              const f = scores[student.id]?.[currentActiveTp.id] ?? Math.round((d.nh1 + d.nh2 + d.nh3 + d.sumatifTp) / 4);
              const status = f >= kktp ? 'Tuntas' : 'Remedial';
              return `
                <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                  <td style="border: 1px solid #000; padding: 5px;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 5px; text-align: left;"><strong>${student.name}</strong></td>
                  <td style="border: 1px solid #000; padding: 5px;">${student.gender}</td>
                  <td style="border: 1px solid #000; padding: 5px;">${d.nh1}</td>
                  <td style="border: 1px solid #000; padding: 5px;">${d.nh2}</td>
                  <td style="border: 1px solid #000; padding: 5px;">${d.nh3}</td>
                  <td style="border: 1px solid #000; padding: 5px;">${d.sumatifTp}</td>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #ecfdf5;">${f}</td>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold; color: ${f >= kktp ? '#16a34a' : '#dc2626'}">${status}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      mainTableSection = `
        <h3 style="font-size: 12pt; text-transform: uppercase; margin-bottom: 8px;">B. Matriks Laporan Nilai Siswa</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; text-align: center;">
          <thead>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <th style="border: 1px solid #000; padding: 6px; width: 5%;">No</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 25%;">Nama Siswa</th>
              <th style="border: 1px solid #000; padding: 6px; width: 6%;">L/P</th>
              ${tps.map(tp => `<th style="border: 1px solid #000; padding: 6px;">${tp.code}</th>`).join('')}
              <th style="border: 1px solid #000; padding: 6px; width: 10%; background-color: #e2e8f0;">Rata-rata</th>
              <th style="border: 1px solid #000; padding: 6px; width: 12%;">Ketuntasan</th>
            </tr>
          </thead>
          <tbody>
            ${activeClass.students.map((student, idx) => {
              const avg = studentStats[student.id]?.average || 0;
              const ketuntasan = avg >= kktp ? 'Tuntas' : 'Remedial';
              return `
                <tr>
                  <td style="border: 1px solid #000; padding: 5px;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 5px; text-align: left;"><strong>${student.name}</strong></td>
                  <td style="border: 1px solid #000; padding: 5px;">${student.gender}</td>
                  ${tps.map(tp => {
                    const score = scores[student.id]?.[tp.id] ?? 0;
                    return `<td style="border: 1px solid #000; padding: 5px;">${score}</td>`;
                  }).join('')}
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #f8fafc;">${avg}</td>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold; color: ${avg >= kktp ? '#16a34a' : '#dc2626'}">${ketuntasan}</td>
                </tr>
              `;
            }).join('')}
            <tr style="font-weight: bold; background-color: #f1f5f9;">
              <td colspan="3" style="border: 1px solid #000; padding: 6px; text-align: right;">RATA-RATA KELAS:</td>
              ${tps.map(tp => `<td style="border: 1px solid #000; padding: 6px;">${tpClassAverages[tp.id]}</td>`).join('')}
              <td style="border: 1px solid #000; padding: 6px; background-color: #e2e8f0;">${summaryStats.classAverage}</td>
              <td style="border: 1px solid #000; padding: 6px; color: #16a34a;">${summaryStats.passedPercent}% Tuntas</td>
            </tr>
          </tbody>
        </table>
      `;
    }

    const isLandscape = viewMode === 'all_daily_tp' || viewMode === 'semester_rekap';

    const fullHtml = `
      <div style="font-family: 'Times New Roman', Times, serif; padding: 20px; line-height: 1.5; color: #000;">
        <div data-f4-kop="true" style="text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="margin: 0; text-transform: uppercase; font-size: 14pt;">
            ${viewMode === 'all_daily_tp'
              ? 'LAPORAN REKAPITULASI NILAI HARIAN SEMUA TP (FORMATIF & SUMATIF LENGKAP)'
              : viewMode === 'semester_rekap' 
              ? 'LAPORAN REKAPITULASI NILAI HARIAN PER TP 1 SEMESTER LENGKAP' 
              : viewMode === 'daily_tp' 
              ? `LAPORAN ASESMEN FORMATIF HARIAN (${currentActiveTp.code})` 
              : 'LAPORAN REKAPITULASI NILAI HARIAN PER TP'}
          </h2>
          <p style="margin: 5px 0 0 0; font-size: 11pt;">Satuan Pendidikan: <strong>SD Negeri Kalimantong</strong> &bull; Mata Pelajaran: <strong>${subject}</strong> | Tahun Pelajaran: ${schoolYear}</p>
          <p style="margin: 2px 0 0 0; font-size: 10pt;">Kelas: ${activeClass.name} &bull; Semester: ${semester} &bull; KKTP: ${kktp}</p>
        </div>

        <div data-f4-section="Bagian 1: A. Daftar Tujuan Pembelajaran (TP)" data-f4-orientation="${isLandscape ? 'landscape' : 'portrait'}">
          <h3 style="font-size: 12pt; text-transform: uppercase; margin-bottom: 8px;">A. Daftar Tujuan Pembelajaran (TP)</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 15%;">Kode TP</th>
                <th style="border: 1px solid #000; padding: 6px; text-align: left;">Deskripsi Kompetensi / Tujuan Pembelajaran</th>
              </tr>
            </thead>
            <tbody>
              ${tps.map(tp => `
                <tr>
                  <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${tp.code}</td>
                  <td style="border: 1px solid #000; padding: 6px;">${tp.text}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div data-f4-section="Bagian 2: B. Tabel Rekapitulasi Nilai & Pengesahan" data-f4-orientation="${isLandscape ? 'landscape' : 'portrait'}">
          ${mainTableSection}

          <div style="margin-top: 30px; font-size: 10.5pt; page-break-inside: avoid;">
            <table style="width: 100%; border: none;">
              <tr>
                <td style="border: none; text-align: center;" width="40%">
                  Mengetahui,<br/>
                  Kepala Sekolah
                  <br/><br/><br/><br/>
                  <strong>${principalName}</strong><br/>
                  NIP. ${principalNip}
                </td>
                <td style="border: none;" width="20%"></td>
                <td style="border: none; text-align: center;" width="40%">
                  ${printCity}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
                  Guru Mapel PJOK
                  <br/><br/><br/><br/>
                  <strong>${teacherName}</strong><br/>
                  NIP. ${teacherNip}
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;
    return fullHtml;
  };

  // Word Document Export handler
  const handleExportWord = () => {
    const fullHtml = buildRekapNilaiHtml();
    downloadDocFile(`Rekap_Nilai_TP_F4_Kelas_${activeClass.name.replace(/\s+/g, '_')}_Sem_${semester}_${viewMode}`, fullHtml);
  };

  // F4 PDF Export handler
  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const fullHtml = buildRekapNilaiHtml();
      const isLandscape = viewMode === 'all_daily_tp' || viewMode === 'semester_rekap';
      const fileName = `Rekap_Nilai_TP_F4_Kelas_${activeClass.name.replace(/\s+/g, '_')}_Sem_${semester}_${viewMode}.pdf`;
      const success = await downloadHtmlAsPdf(fileName, fullHtml, {
        orientation: isLandscape ? 'landscape' : 'portrait',
        marginMm: isLandscape ? 10 : 12
      });
      if (!success) {
        printHtmlDocument(fullHtml, `Rekap Nilai TP F4 - ${activeClass.name}`, isLandscape ? 'landscape' : 'portrait');
      }
    } catch (err) {
      console.error('Error generating Rekap Nilai TP F4 PDF:', err);
      const isLandscape = viewMode === 'all_daily_tp' || viewMode === 'semester_rekap';
      printHtmlDocument(buildRekapNilaiHtml(), `Rekap Nilai TP F4 - ${activeClass.name}`, isLandscape ? 'landscape' : 'portrait');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    const isLandscape = viewMode === 'all_daily_tp' || viewMode === 'semester_rekap';
    printHtmlDocument(buildRekapNilaiHtml(), `Rekap Nilai TP F4 - ${activeClass.name}`, isLandscape ? 'landscape' : 'portrait');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="rekap-nilai-tp-view">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-cyan-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-12 pointer-events-none">
          <Calculator className="w-80 h-80" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-200 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4 text-cyan-400" />
              Administrasi Kurikulum Merdeka
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              Rekap Nilai Per Tujuan Pembelajaran (TP)
            </h2>
            <p className="text-cyan-100 text-xs sm:text-sm max-w-4xl leading-relaxed">
              Kelola, hitung, dan petakan ketuntasan kriteria belajar (KKTP) siswa per Kompetensi Dasar/Tujuan Pembelajaran secara digital. Menghasilkan rata-rata akhir otomatis untuk pelaporan rapor yang rapi dan terstandarisasi.
            </p>
          </div>
          <div className="shrink-0 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/20">
            <ExportJsonPromptAiButtons
              onExportJson={() => {
                const filename = `Rekap_Nilai_TP_${activeClass.name.replace(/\s+/g, '_')}.json`;
                downloadJsonFile(filename, {
                  kelas: activeClass.name,
                  grade: activeClass.grade,
                  subject,
                  semester,
                  schoolYear,
                  kktp,
                  tps,
                  scores,
                  summaryStats
                });
              }}
              onOpenPromptAi={() => setShowPromptModal(true)}
            />
          </div>
        </div>
      </div>

      {/* Class Statistics Dashboard Widget Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 no-print">
        <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-teal-50 text-teal-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Jumlah Siswa</span>
            <p className="text-xl font-black text-slate-800 mt-0.5">{activeClass.students.length} Siswa</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-cyan-50 text-cyan-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Rata-rata Kelas</span>
            <p className="text-xl font-black text-slate-800 mt-0.5">{summaryStats.classAverage} / 100</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Tuntas Kriteria (≥ {kktp})</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">
              {summaryStats.totalPassed} <span className="text-xs text-slate-400 font-bold">({summaryStats.passedPercent}%)</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Perlu Remedial</span>
            <p className="text-xl font-black text-rose-700 mt-0.5">{summaryStats.totalFailed} Siswa</p>
          </div>
        </div>
      </div>

      {/* Main Form controls block (Hidden on Print) */}
      <div className="bg-white rounded-xl border border-slate-150 p-5 mb-8 space-y-4 shadow-sm no-print">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Konfigurasi Laporan &amp; Kelas</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAutoFill}
              className="px-3.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-xs font-bold transition-all border border-cyan-200 cursor-pointer flex items-center gap-1.5"
              title="Isi nilai simulasi untuk keperluan demo/cepat"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>Simulasi Nilai</span>
            </button>
            <button
              onClick={handleClearScores}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Tabel</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Rombel / Kelas</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white font-semibold"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} (Kelas {c.grade})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value) as 1 | 2)}
                className="w-full px-2 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value={1}>Ganjil (1)</option>
                <option value={2}>Genap (2)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Th Pelajaran</label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full px-2 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <span>Batas Kriteria KKTP</span>
              <span className="text-[10px] text-slate-400 font-medium">(≥ Tuntas)</span>
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={kktp}
              onChange={(e) => setKktp(Math.max(1, Math.min(100, Number(e.target.value))))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white font-extrabold text-teal-800"
            />
          </div>
        </div>
      </div>

      {/* View Mode Navigation Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs mb-6 no-print">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('all_daily_tp')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'all_daily_tp'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Rekap Nilai Harian Semua TP</span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 uppercase font-black">Lengkap</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('semester_rekap')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'semester_rekap'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Rekap 1 Semester (Rapor PJOK)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('daily_tp')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'daily_tp'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Input Khusus per 1 TP</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'matrix'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Matriks Ringkas TP</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'daily_tp' && tps.length > 0 && (
            <div className="flex items-center gap-1.5 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
              <span className="text-xs font-bold text-teal-800">Pilih TP:</span>
              <select
                value={activeTpId}
                onChange={(e) => setActiveTpId(e.target.value)}
                className="text-xs font-extrabold text-teal-900 bg-white border border-teal-300 rounded px-2 py-1"
              >
                {tps.map(tp => (
                  <option key={tp.id} value={tp.id}>
                    {tp.code} - {tp.text.length > 30 ? tp.text.substring(0, 30) + '...' : tp.text}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'semester_rekap' && (
            <button
              type="button"
              onClick={() => setShowWeightConfig(!showWeightConfig)}
              className="px-3 py-1.5 rounded-lg border border-slate-250 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Bobot: TP({weights.tp}) STS({weights.sts}) SAS({weights.sas})</span>
              <Edit3 className="w-3.5 h-3.5 text-teal-600" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSidebarSettings(!showSidebarSettings)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showSidebarSettings 
                ? 'bg-slate-800 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-250'
            }`}
            title="Tampilkan / Sembunyikan panel kelola TP dan Tanda Tangan"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{showSidebarSettings ? 'Sembunyikan Panel TP & TTD' : 'Kelola TP & TTD'}</span>
          </button>
        </div>
      </div>

      {showWeightConfig && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 mb-6 text-xs text-amber-900 no-print flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-extrabold flex items-center gap-1.5 text-amber-950">
              <Calculator className="w-4 h-4 text-amber-600" />
              Atur Bobot Penilaian Nilai Akhir (NA) Semester
            </h4>
            <p className="text-[11px] text-amber-800">
              Rumus: NA = [(Bobot TP × Rerata TP) + (Bobot STS × Nilai STS) + (Bobot SAS × Nilai SAS)] ÷ Total Bobot
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 font-bold">
              <span>Bobot TP:</span>
              <input
                type="number"
                min={1}
                max={10}
                value={weights.tp}
                onChange={(e) => saveWeightsToStorage({ ...weights, tp: Math.max(1, Number(e.target.value)) })}
                className="w-12 px-2 py-1 bg-white border border-amber-300 rounded font-bold text-center"
              />
            </label>
            <label className="flex items-center gap-1 font-bold">
              <span>Bobot STS:</span>
              <input
                type="number"
                min={0}
                max={10}
                value={weights.sts}
                onChange={(e) => saveWeightsToStorage({ ...weights, sts: Math.max(0, Number(e.target.value)) })}
                className="w-12 px-2 py-1 bg-white border border-amber-300 rounded font-bold text-center"
              />
            </label>
            <label className="flex items-center gap-1 font-bold">
              <span>Bobot SAS:</span>
              <input
                type="number"
                min={0}
                max={10}
                value={weights.sas}
                onChange={(e) => saveWeightsToStorage({ ...weights, sas: Math.max(0, Number(e.target.value)) })}
                className="w-12 px-2 py-1 bg-white border border-amber-300 rounded font-bold text-center"
              />
            </label>
            <button
              type="button"
              onClick={() => saveWeightsToStorage({ tp: 2, sts: 1, sas: 1 })}
              className="px-2.5 py-1 text-[11px] font-bold bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded cursor-pointer"
            >
              Reset (2:1:1)
            </button>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side Column: Manage Objectives list (TPs) */}
        {(showSidebarSettings || (viewMode !== 'semester_rekap' && viewMode !== 'all_daily_tp')) && (
          <div className="lg:col-span-4 space-y-6 no-print">
            <div className="bg-white rounded-xl border border-slate-150 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                Daftar TP Kelas Ini
              </h4>
              <button
                onClick={() => setIsAddingTp(!isAddingTp)}
                className="p-1 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-all"
                title="Tambah Tujuan Pembelajaran Baru"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Form to add a new TP */}
            {isAddingTp && (
              <form onSubmit={handleAddTp} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block font-bold text-slate-600 mb-0.5">Kode TP</label>
                    <input
                      type="text"
                      placeholder="TP 1.4"
                      value={newTpCode}
                      onChange={(e) => setNewTpCode(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs font-bold"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-600 mb-0.5">Kompetensi Inti/TP</label>
                    <input
                      type="text"
                      placeholder="Mempraktikkan gerakan..."
                      value={newTpText}
                      onChange={(e) => setNewTpText(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingTp(false)}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-500 bg-white border border-slate-250 rounded cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )}

            {/* TPs List */}
            <div className="space-y-2.5 text-xs">
              {tps.length === 0 ? (
                <div className="text-center py-6 text-slate-400 font-medium">
                  Belum ada Tujuan Pembelajaran yang ditambahkan.
                </div>
              ) : (
                tps.map(tp => (
                  <div 
                    key={tp.id} 
                    className="p-3 bg-slate-50/70 border border-slate-150 rounded-lg flex items-start justify-between gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <span className="inline-block px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[9px] font-black uppercase">
                        {tp.code}
                      </span>
                      <p className="text-slate-700 font-medium leading-relaxed mt-1">
                        {tp.text}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteTp(tp.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition-colors shrink-0"
                      title="Hapus TP"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Teacher and Institutional Info block */}
          <div className="bg-white rounded-xl border border-slate-150 p-5 space-y-3.5 shadow-sm">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-1.5 border-b border-slate-100">
              Pengesahan Laporan (Tanda Tangan)
            </h4>
            
            <div className="space-y-2.5 text-[11px]">
              <div>
                <label className="block font-bold text-slate-500 mb-0.5">Kota Cetak Laporan</label>
                <input
                  type="text"
                  value={printCity}
                  onChange={(e) => setPrintCity(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-0.5">Nama Guru Pengampu</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-0.5">NIP Guru</label>
                <input
                  type="text"
                  value={teacherNip}
                  onChange={(e) => setTeacherNip(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-0.5">Nama Kepala Sekolah</label>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-0.5">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={principalNip}
                  onChange={(e) => setPrincipalNip(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Right Side Column: Main Grid Recaps Matrix / Table */}
        <div className={`space-y-4 ${
          showSidebarSettings || (viewMode !== 'semester_rekap' && viewMode !== 'all_daily_tp') ? 'lg:col-span-8' : 'lg:col-span-12'
        }`}>
          
          {/* Header Toolbar Actions */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 no-print">
            <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-600" />
              {viewMode === 'all_daily_tp' ? 'REKAP NILAI HARIAN SEMUA TP' : viewMode === 'semester_rekap' ? 'REKAP 1 SEMESTER LENGKAP' : viewMode === 'daily_tp' ? `ASESMEN FORMATIF (${currentActiveTp.code})` : 'MATRIKS EVALUASI TP'}
            </span>

            <div className="flex items-center gap-2">
              <ExportJsonPromptAiButtons
                variant="compact"
                onExportJson={() => {
                  const filename = `Rekap_Nilai_TP_${activeClass.name.replace(/\s+/g, '_')}.json`;
                  downloadJsonFile(filename, {
                    kelas: activeClass.name,
                    grade: activeClass.grade,
                    subject,
                    semester,
                    schoolYear,
                    kktp,
                    tps,
                    scores,
                    dailyScores,
                    summaryStats
                  });
                }}
                onOpenPromptAi={() => setShowPromptModal(true)}
              />

              <button
                onClick={handleExportCsv}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ekspor Excel</span>
              </button>

              <button
                onClick={handleExportWord}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Word</span>
              </button>

              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isExportingPdf ? 'Memproses PDF...' : 'Download PDF (F4)'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-white rounded-lg text-xs font-bold border border-slate-750 cursor-pointer flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak F4</span>
              </button>
            </div>
          </div>

          {/* MAIN MATRIX RECAPS PRINT SHEET */}
          <div className="bg-white rounded-2xl border border-slate-250 shadow-md p-6 sm:p-8 space-y-6 relative print-sheet overflow-hidden">
            
            {/* Header Formality (KOP SURAT) */}
            <div className="text-center border-b-4 border-double border-slate-900 pb-4 mb-4 relative flex flex-col items-center">
              <span className="font-mono text-[9px] uppercase font-black tracking-widest text-slate-500 mb-1">DATA ADMINISTRASI ADMINISTRATOR GURU SD</span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                {viewMode === 'all_daily_tp'
                  ? 'REKAPITULASI NILAI HARIAN SEMUA TUJUAN PEMBELAJARAN (TP)'
                  : viewMode === 'semester_rekap' 
                  ? 'LAPORAN REKAPITULASI NILAI HARIAN PER TP 1 SEMESTER LENGKAP' 
                  : viewMode === 'daily_tp' 
                  ? `DETAIL ASESMEN FORMATIF HARIAN (${currentActiveTp.code})` 
                  : 'LAPORAN REKAPITULASI NILAI HARIAN PER TP'}
              </h2>
              <p className="text-xs text-slate-600 mt-1 font-semibold">
                Mata Pelajaran: {subject} &bull; Semester {semester} &bull; Tahun Pelajaran {schoolYear}
                {viewMode === 'all_daily_tp' && ' • Format Formatif Praktik (NH1), Teori (NH2), Tugas (NH3) & Sumatif TP'}
                {viewMode === 'daily_tp' && ` • Lingkup Materi: ${currentActiveTp.text}`}
              </p>
              <div className="w-full flex justify-between items-center text-[11px] font-bold text-slate-700 mt-3 pt-2 border-t border-slate-100/50">
                <span>Kelas: {activeClass.name}</span>
                <span>KKTP: {kktp}</span>
              </div>
            </div>

            {/* Dynamic Views: Rekap Semua TP vs Full Semester Recap vs Daily Formatif Breakdown vs Compact Matrix */}
            {viewMode === 'all_daily_tp' ? (
              <RekapNilaiHarianSemuaTpTable
                students={activeClass.students}
                tps={tps}
                dailyScores={dailyScores}
                scores={scores}
                kktp={kktp}
                onUpdateDailyScore={handleUpdateDailyScore}
                onUpdateTpFinalScore={handleUpdateTpFinalScore}
                onToggleGender={handleToggleGender}
              />
            ) : viewMode === 'semester_rekap' ? (
              <RekapNilaiHarianSemesterTable
                students={activeClass.students}
                tps={tps}
                evaluations={evaluations}
                tpClassAverages={tpClassAverages}
                classRerataTpAverage={summaryStats.classRerataTpAverage}
                classStsAverage={summaryStats.classStsAverage}
                classSasAverage={summaryStats.classSasAverage}
                classFinalAverage={summaryStats.classAverage}
                passedPercent={summaryStats.passedPercent}
                kktp={kktp}
                onUpdateTpScore={handleUpdateTpFinalScore}
                onUpdateSemesterScore={handleUpdateSemesterScore}
                onToggleGender={handleToggleGender}
              />
            ) : viewMode === 'daily_tp' ? (
              <DetailNilaiHarianTpTable
                activeTp={currentActiveTp}
                students={activeClass.students}
                dailyScores={dailyScores}
                scores={scores}
                kktp={kktp}
                onUpdateDailyScore={handleUpdateDailyScore}
                onUpdateTpFinalScore={handleUpdateTpFinalScore}
                onToggleGender={handleToggleGender}
              />
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-250 font-black uppercase text-[9px] tracking-wider text-center">
                      <th className="p-3 border-r border-slate-200 w-12">No</th>
                      <th className="p-3 border-r border-slate-200 text-left min-w-[160px]">Nama Siswa</th>
                      <th className="p-3 border-r border-slate-200 w-12">L/P</th>
                      
                      {/* TP Column Headers */}
                      {tps.map(tp => (
                        <th 
                          key={tp.id} 
                          className="p-3 border-r border-slate-200 w-20 text-center cursor-help group relative"
                          title={tp.text}
                        >
                          <span className="underline decoration-dotted decoration-teal-500 font-extrabold">{tp.code}</span>
                          {/* Tooltip on hover */}
                          <span className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg max-w-xs z-30 font-medium normal-case">
                            {tp.text}
                          </span>
                        </th>
                      ))}

                      <th className="p-3 border-r border-slate-200 w-24 bg-teal-50/50 text-teal-900 font-extrabold text-center">Rata-rata</th>
                      <th className="p-3 text-center w-28">Ketuntasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-medium text-center">
                    {activeClass.students.map((student, sIdx) => {
                      const stats = studentStats[student.id] || { average: 0, isPassed: false };
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50">
                          <td className="p-3 border-r border-slate-200 text-slate-400 font-mono font-bold">
                            {sIdx + 1}
                          </td>
                          <td className="p-3 border-r border-slate-200 text-left font-extrabold text-slate-800">
                            {student.name}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">
                            {onUpdateStudents ? (
                              <button
                                type="button"
                                onClick={() => handleToggleGender(student.id)}
                                className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer no-print ${
                                  student.gender === 'L'
                                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                }`}
                                title="Klik untuk mengubah jenis kelamin siswa (L <-> P)"
                              >
                                {student.gender}
                              </button>
                            ) : (
                              <span className="no-print">{student.gender}</span>
                            )}
                            <span className="hidden print:inline font-bold">{student.gender}</span>
                          </td>

                          {/* Interactive dynamic TP scores inputs */}
                          {tps.map(tp => {
                            const score = scores[student.id]?.[tp.id] ?? 0;
                            return (
                              <td key={tp.id} className="p-2 border-r border-slate-200 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={score}
                                  onChange={(e) => handleScoreChange(student.id, tp.id, e.target.value)}
                                  className="w-14 px-1 py-1 text-center font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50 hover:bg-slate-100 rounded border border-transparent hover:border-slate-300 transition-all no-print"
                                />
                                <span className="hidden print:inline font-bold">{score}</span>
                              </td>
                            );
                          })}

                          {/* Student Average score */}
                          <td className="p-3 border-r border-slate-200 font-black text-slate-900 bg-teal-50/30 text-center text-sm">
                            {stats.average}
                          </td>

                          {/* Ketuntasan badge indicator */}
                          <td className="p-3">
                            {stats.average >= kktp ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                Tuntas
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                                Remedial
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Summary Footer Class average indicators */}
                    <tr className="bg-slate-100/80 text-slate-800 font-extrabold text-[11px] border-t-2 border-slate-300">
                      <td colSpan={3} className="p-3 border-r border-slate-200 text-right uppercase tracking-wider">
                        Rata-rata Kelas
                      </td>
                      
                      {tps.map(tp => (
                        <td key={tp.id} className="p-3 border-r border-slate-200 text-teal-800 font-black">
                          {tpClassAverages[tp.id]}
                        </td>
                      ))}

                      <td className="p-3 border-r border-slate-200 bg-teal-100/50 text-teal-950 font-black text-center text-xs">
                        {summaryStats.classAverage}
                      </td>

                      <td className="p-3 text-emerald-700 font-black text-center">
                        {summaryStats.passedPercent}% Tuntas
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Standard Signature Blocks for official report (visible on print or export) */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-800 font-medium border-t border-slate-100">
              <div className="space-y-12">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-extrabold">Kepala Sekolah</p>
                </div>
                <div>
                  <p className="font-extrabold underline">{principalName}</p>
                  <p className="text-slate-500">NIP. {principalNip}</p>
                </div>
              </div>

              <div className="space-y-12">
                <div>
                  <p>{printCity}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-extrabold">Guru Mapel PJOK</p>
                </div>
                <div>
                  <p className="font-extrabold underline">{teacherName}</p>
                  <p className="text-slate-500">NIP. {teacherNip}</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Rekapitulasi Nilai & Ketercapaian TP"
        subtitle={`Kelas ${activeClass.name} - Nilai Rata-rata ${summaryStats.classAverage}`}
        tabs={getUlanganHarianPrompts(tps.map(t => t.text).join(', '))}
        defaultActiveTab="kisi_ulangan"
        jsonData={{
          kelas: activeClass.name,
          grade: activeClass.grade,
          subject,
          semester,
          schoolYear,
          kktp,
          tps,
          scores,
          summaryStats
        }}
        jsonFilename={`Rekap_Nilai_TP_${activeClass.name.replace(/\s+/g, '_')}.json`}
      />
    </div>
  );
}
