import React, { useState, useMemo, useEffect } from 'react';
import { ClassData, Student } from '../types';
import { 
  Calendar, 
  FileSpreadsheet, 
  Printer, 
  FileDown, 
  Check, 
  Sparkles, 
  RotateCcw, 
  Settings, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  Shirt,
  HeartPulse,
  Award,
  Layers,
  Sparkle,
  CalendarRange,
  BookOpen,
  ClipboardList
} from 'lucide-react';
import { 
  exportAbsensiMingguanPjokToDoc, 
  exportRekapSemesterPjokToDoc,
  PjokWeekMeeting, 
  PjokStudentWeeklyRecord, 
  StudentSemesterPjokRow,
  RekapSemesterPjokMeta,
  SemesterWeekInfo,
  downloadDocFile, 
  downloadJsonFile 
} from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { 
  getAbsensiMingguanPjokPrompts, 
  getRekapSemesterPjokPrompts 
} from '../utils/aiPromptGenerators';

interface AbsensiMingguanPjokViewProps {
  activeClass: ClassData;
  onUpdateStudents: (classId: string, students: Student[]) => void;
}

const BULAN_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
];

const HARI_PJOK_OPTIONS = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' }
];

const MATERI_PJOK_PRESETS = [
  'Aktivitas Kebugaran Jasmani & Kelincahan',
  'Variasi Pola Gerak Dasar Lokomotor (Lari & Lompat)',
  'Permainan Bola Besar (Sepak Bola / Futsal Mini)',
  'Permainan Bola Besar (Bola Voli Mini / Passing)',
  'Permainan Bola Kecil (Kasti / Rounders)',
  'Senam Lantai (Guling Depan & Keseimbangan)',
  'Senam Irama & Gerak Berirama SKJ',
  'Aktivitas Air & Pengenalan Air / Renang Dasar',
  'Pendidikan Kesehatan (Gizi Seimbang & Kebersihan Diri)',
  'Evaluasi Praktik Akhir & Tes Kebugaran Jasmani'
];

export default function AbsensiMingguanPjokView({
  activeClass,
  onUpdateStudents
}: AbsensiMingguanPjokViewProps) {
  // Main view mode: 'mingguan' (1 month) vs 'semester' (1 whole semester)
  const [viewMode, setViewMode] = useState<'mingguan' | 'semester'>('mingguan');

  const currentDate = new Date();
  const currentMonthNum = currentDate.getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(2); // Default Selasa

  // Semester Mode States
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(currentMonthNum >= 7 ? 1 : 2);
  const [jpPerPertemuan, setJpPerPertemuan] = useState<number>(3); // 3 JP default Kemendikbudristek

  // Institutional Metadata
  const [namaSekolah, setNamaSekolah] = useState('SD NEGERI KALIMANTONG');
  const [namaGuru, setNamaGuru] = useState('Ahmad Rafsanjani, S.Pd.');
  const [nipGuru, setNipGuru] = useState('19880512 201503 1 002');
  const [namaKepalaSekolah, setNamaKepalaSekolah] = useState('H. Muhammad Nur, M.Pd.');
  const [nipKepalaSekolah, setNipKepalaSekolah] = useState('19750814 199903 1 004');
  const [kota, setKota] = useState('Jakarta');

  const [showSettings, setShowSettings] = useState(false);
  const [showMeetingsConfig, setShowMeetingsConfig] = useState(false);
  const [isExportedDoc, setIsExportedDoc] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Storage key for persistent weekly PJOK configuration of active month
  const storageKey = `sadar_pjok_weekly_${activeClass.id}_${selectedYear}_${selectedMonth}`;

  // State for Meetings (4 to 5 weeks in the active month)
  const [meetings, setMeetings] = useState<PjokWeekMeeting[]>([]);
  // State for student weekly records: studentId -> weekNum -> record
  const [weeklyRecords, setWeeklyRecords] = useState<{
    [studentId: string]: { [weekNum: number]: PjokStudentWeeklyRecord };
  }>({});
  // Custom notes per student (monthly)
  const [studentNotes, setStudentNotes] = useState<{ [studentId: string]: string }>({});

  // Custom notes per student (semester)
  const [semesterStudentNotes, setSemesterStudentNotes] = useState<{ [studentId: string]: string }>({});

  // Custom weeks configuration per month in semester view (e.g. { 7: 5, 8: 5, 9: 4, 10: 5, 11: 4, 12: 5 })
  const [customSemesterWeeks, setCustomSemesterWeeks] = useState<{ [monthNum: number]: number }>(() => {
    try {
      const saved = localStorage.getItem(`sadar_pjok_semester_weeks_${activeClass.id}_${selectedSemester}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // State to show/hide monthly totals column beside weeks in semester table
  const [showMonthlyTotals, setShowMonthlyTotals] = useState(false);

  // State to trigger recalculation when a cell in the semester table is modified
  const [semesterUpdateTrigger, setSemesterUpdateTrigger] = useState(0);

  // Save custom weeks whenever changed
  useEffect(() => {
    if (Object.keys(customSemesterWeeks).length > 0) {
      localStorage.setItem(
        `sadar_pjok_semester_weeks_${activeClass.id}_${selectedSemester}`,
        JSON.stringify(customSemesterWeeks)
      );
    }
  }, [customSemesterWeeks, activeClass.id, selectedSemester]);

  const namaBulan = useMemo(() => {
    return BULAN_OPTIONS.find(b => b.value === selectedMonth)?.label || 'Bulan';
  }, [selectedMonth]);

  const tahunAjaran = useMemo(() => {
    return selectedMonth >= 7 
      ? `${selectedYear}/${selectedYear + 1}` 
      : `${selectedYear - 1}/${selectedYear}`;
  }, [selectedMonth, selectedYear]);

  // Calculate default weekly meeting dates for a given weekday in selected month
  const generateDefaultMeetings = (dayOfWeek: number, month: number, year: number): PjokWeekMeeting[] => {
    const dates: string[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month - 1, d);
      if (dt.getDay() === dayOfWeek) {
        const dStr = String(d).padStart(2, '0');
        const mStr = String(month).padStart(2, '0');
        dates.push(`${year}-${mStr}-${dStr}`);
      }
    }

    return dates.map((dtStr, idx) => ({
      weekNum: idx + 1,
      date: dtStr,
      topic: MATERI_PJOK_PRESETS[idx % MATERI_PJOK_PRESETS.length],
      venue: 'Lapangan Olahraga',
      executionStatus: 'Terlaksana'
    }));
  };

  // Load active month data from localStorage or initialize
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.meetings && parsed.meetings.length > 0) {
          setMeetings(parsed.meetings);
        } else {
          setMeetings(generateDefaultMeetings(selectedDayOfWeek, selectedMonth, selectedYear));
        }
        if (parsed.weeklyRecords) {
          setWeeklyRecords(parsed.weeklyRecords);
        } else {
          setWeeklyRecords({});
        }
        if (parsed.studentNotes) {
          setStudentNotes(parsed.studentNotes);
        }
        if (parsed.dayOfWeek) {
          setSelectedDayOfWeek(parsed.dayOfWeek);
        }
        return;
      } catch (e) {
        console.error('Failed parsing weekly pjok storage', e);
      }
    }

    // Default initialization
    const initialMeetings = generateDefaultMeetings(selectedDayOfWeek, selectedMonth, selectedYear);
    setMeetings(initialMeetings);
    setWeeklyRecords({});
    setStudentNotes({});
  }, [storageKey]);

  // Auto-save active month data to localStorage
  useEffect(() => {
    if (meetings.length > 0) {
      const payload = {
        meetings,
        weeklyRecords,
        studentNotes,
        dayOfWeek: selectedDayOfWeek
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    }
  }, [meetings, weeklyRecords, studentNotes, selectedDayOfWeek, storageKey]);

  // Trigger quick success toast
  const triggerNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Auto regenerate dates based on weekday
  const handleAutoGenerateDates = () => {
    const newMeetings = generateDefaultMeetings(selectedDayOfWeek, selectedMonth, selectedYear);
    setMeetings(newMeetings);
    triggerNotification(`Berhasil memperbarui ${newMeetings.length} pekan pertemuan PJOK setiap hari ${HARI_PJOK_OPTIONS.find(h => h.value === selectedDayOfWeek)?.label}!`);
  };

  // Update specific meeting attribute
  const handleUpdateMeeting = (weekNum: number, field: keyof PjokWeekMeeting, value: any) => {
    setMeetings(prev => prev.map(m => m.weekNum === weekNum ? { ...m, [field]: value } : m));
  };

  // Toggle student status for specific week: H -> S -> I -> A -> H
  const handleToggleStudentStatus = (studentId: string, weekNum: number) => {
    setWeeklyRecords(prev => {
      const currentStudentRec = prev[studentId] || {};
      const currentWeekRec = currentStudentRec[weekNum] || { status: 'H', uniform: true };
      
      let nextStatus: 'H' | 'S' | 'I' | 'A' = 'H';
      if (currentWeekRec.status === 'H') nextStatus = 'S';
      else if (currentWeekRec.status === 'S') nextStatus = 'I';
      else if (currentWeekRec.status === 'I') nextStatus = 'A';
      else nextStatus = 'H';

      return {
        ...prev,
        [studentId]: {
          ...currentStudentRec,
          [weekNum]: {
            ...currentWeekRec,
            status: nextStatus
          }
        }
      };
    });
  };

  // Toggle uniform check for specific week
  const handleToggleStudentUniform = (studentId: string, weekNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setWeeklyRecords(prev => {
      const currentStudentRec = prev[studentId] || {};
      const currentWeekRec = currentStudentRec[weekNum] || { status: 'H', uniform: true };
      return {
        ...prev,
        [studentId]: {
          ...currentStudentRec,
          [weekNum]: {
            ...currentWeekRec,
            uniform: !currentWeekRec.uniform
          }
        }
      };
    });
  };

  // Cycle physical status note (Bugar -> Dispensasi -> Cedera -> Bugar)
  const handleCyclePhysicalStatus = (studentId: string, weekNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setWeeklyRecords(prev => {
      const currentStudentRec = prev[studentId] || {};
      const currentWeekRec = currentStudentRec[weekNum] || { status: 'H', uniform: true };
      
      let nextNote: string | undefined = undefined;
      if (!currentWeekRec.physicalNote || currentWeekRec.physicalNote === 'Bugar') nextNote = 'Dispensasi Fisik';
      else if (currentWeekRec.physicalNote === 'Dispensasi Fisik') nextNote = 'Cedera Ringan';
      else nextNote = 'Bugar';

      return {
        ...prev,
        [studentId]: {
          ...currentStudentRec,
          [weekNum]: {
            ...currentWeekRec,
            physicalNote: nextNote
          }
        }
      };
    });
  };

  // Quick Action: Mark all students as 'H' for a specific week
  const handleMarkAllPresent = (weekNum: number) => {
    setWeeklyRecords(prev => {
      const updated = { ...prev };
      (activeClass?.students || []).forEach(st => {
        const cur = updated[st.id] || {};
        updated[st.id] = {
          ...cur,
          [weekNum]: {
            status: 'H',
            uniform: cur[weekNum]?.uniform !== undefined ? cur[weekNum].uniform : true,
            physicalNote: cur[weekNum]?.physicalNote
          }
        };
      });
      return updated;
    });
    triggerNotification(`Seluruh siswa ditandai Hadir (H) pada Minggu ke-${weekNum}.`);
  };

  // Quick Action: Mark all students uniform as complete for a specific week
  const handleMarkAllUniform = (weekNum: number) => {
    setWeeklyRecords(prev => {
      const updated = { ...prev };
      (activeClass?.students || []).forEach(st => {
        const cur = updated[st.id] || {};
        updated[st.id] = {
          ...cur,
          [weekNum]: {
            status: cur[weekNum]?.status || 'H',
            uniform: true,
            physicalNote: cur[weekNum]?.physicalNote
          }
        };
      });
      return updated;
    });
    triggerNotification(`Seragam olahraga seluruh siswa ditandai Lengkap pada Minggu ke-${weekNum}.`);
  };

  // Sync to general attendance system in activeClass.students[].attendance[dateKey]
  const handleSyncToSystemAttendance = () => {
    const updatedStudents = (activeClass?.students || []).map(st => {
      const nextAtt = { ...(st.attendance || {}) };
      meetings.forEach(m => {
        if (m.date) {
          const rec = weeklyRecords[st.id]?.[m.weekNum] || { status: 'H', uniform: true };
          nextAtt[m.date] = rec.status;
        }
      });
      return { ...st, attendance: nextAtt };
    });

    onUpdateStudents(activeClass.id, updatedStudents);
    triggerNotification(`Berhasil menyinkronkan data presensi mingguan PJOK ke database absensi harian kelas!`);
  };

  // Monthly summary stats
  const summaryStats = useMemo(() => {
    let totalH = 0;
    let totalS = 0;
    let totalI = 0;
    let totalA = 0;
    let totalUniform = 0;
    let totalSpots = 0;
    let perfectStudentsCount = 0;
    let attentionStudentsCount = 0;

    const studentsList = activeClass?.students || [];
    const studentCount = studentsList.length;
    const meetingCount = meetings.length;

    studentsList.forEach(st => {
      let stH = 0;
      let stS = 0;
      meetings.forEach(m => {
        const rec = weeklyRecords[st.id]?.[m.weekNum] || { status: 'H', uniform: true };
        totalSpots++;
        if (rec.status === 'H') {
          totalH++;
          stH++;
          if (rec.uniform !== false) totalUniform++;
        } else if (rec.status === 'S') {
          totalS++;
          stS++;
        } else if (rec.status === 'I') {
          totalI++;
        } else if (rec.status === 'A') {
          totalA++;
        }
      });

      if (stH === meetingCount && meetingCount > 0) {
        perfectStudentsCount++;
      }
      if (stS > 0 || (studentNotes[st.id] && studentNotes[st.id].trim())) {
        attentionStudentsCount++;
      }
    });

    const attendanceRate = totalSpots > 0 ? Math.round((totalH / totalSpots) * 100) : 100;
    const uniformRate = totalH > 0 ? Math.round((totalUniform / totalH) * 100) : 100;

    return {
      totalH,
      totalS,
      totalI,
      totalA,
      attendanceRate,
      uniformRate,
      perfectStudentsCount,
      attentionStudentsCount,
      meetingCount,
      studentCount
    };
  }, [activeClass.students, meetings, weeklyRecords, studentNotes]);

  // ==========================================
  // SEMESTER RECAPITULATION LOGIC (6 MONTHS)
  // ==========================================
  const semesterMonths = useMemo(() => {
    const rawMonths = selectedSemester === 1 
      ? [
          { monthNum: 7, monthName: 'Juli', defaultWeeks: 5 },
          { monthNum: 8, monthName: 'Agustus', defaultWeeks: 5 },
          { monthNum: 9, monthName: 'September', defaultWeeks: 4 },
          { monthNum: 10, monthName: 'Oktober', defaultWeeks: 5 },
          { monthNum: 11, monthName: 'November', defaultWeeks: 4 },
          { monthNum: 12, monthName: 'Desember', defaultWeeks: 5 }
        ]
      : [
          { monthNum: 1, monthName: 'Januari', defaultWeeks: 5 },
          { monthNum: 2, monthName: 'Februari', defaultWeeks: 4 },
          { monthNum: 3, monthName: 'Maret', defaultWeeks: 5 },
          { monthNum: 4, monthName: 'April', defaultWeeks: 4 },
          { monthNum: 5, monthName: 'Mei', defaultWeeks: 5 },
          { monthNum: 6, monthName: 'Juni', defaultWeeks: 4 }
        ];

    return rawMonths.map(m => {
      // 1. Priority: User's custom week count
      let wCount = customSemesterWeeks[m.monthNum];

      // 2. Priority: Saved monthly meetings in localStorage
      let savedMeetings: PjokWeekMeeting[] = [];
      const monthKey = `sadar_pjok_weekly_${activeClass.id}_${selectedYear}_${m.monthNum}`;
      const saved = localStorage.getItem(monthKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.meetings && parsed.meetings.length > 0) {
            savedMeetings = parsed.meetings;
            if (!wCount) {
              wCount = parsed.meetings.length;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }

      // 3. Priority: Calculated from selectedDayOfWeek in calendar
      const defaultMeetings = generateDefaultMeetings(selectedDayOfWeek, m.monthNum, selectedYear);
      if (!wCount) {
        wCount = defaultMeetings.length > 0 ? defaultMeetings.length : m.defaultWeeks;
      }

      // Ensure between 1 and 6 weeks
      wCount = Math.max(1, Math.min(6, wCount));

      // Build weeks list: Ming 1, Ming 2, Ming 3, Ming 4, Ming 5...
      const weeks: SemesterWeekInfo[] = Array.from({ length: wCount }, (_, idx) => {
        const weekNum = idx + 1;
        const matchingMeeting = savedMeetings.find(sm => sm.weekNum === weekNum) || defaultMeetings[idx];
        return {
          weekNum,
          dateStr: matchingMeeting?.date || '',
          dateLabel: `Ming ${weekNum}`
        };
      });

      return {
        monthNum: m.monthNum,
        monthName: m.monthName,
        meetingCount: wCount,
        weeks
      };
    });
  }, [selectedSemester, selectedYear, selectedDayOfWeek, customSemesterWeeks, activeClass.id, semesterUpdateTrigger]);

  // Aggregate semester rows across all 6 months for each student
  const semesterRows: StudentSemesterPjokRow[] = useMemo(() => {
    return (activeClass?.students || []).map(student => {
      const monthlyData: { [monthNum: number]: { hadir: number; sakit: number; izin: number; alpa: number; totalMeetings: number; uniformCount: number } } = {};
      const weeklyStatus: { [monthNum: number]: { [weekNum: number]: 'H' | 'S' | 'I' | 'A' } } = {};
      
      let semesterTotalH = 0;
      let semesterTotalS = 0;
      let semesterTotalI = 0;
      let semesterTotalA = 0;
      let semesterTotalMeetings = 0;
      let semesterTotalUniform = 0;

      semesterMonths.forEach(m => {
        const monthKey = `sadar_pjok_weekly_${activeClass.id}_${selectedYear}_${m.monthNum}`;
        let parsedWeeklyRecords: { [studentId: string]: { [weekNum: number]: PjokStudentWeeklyRecord } } | null = null;
        let parsedMeetings: PjokWeekMeeting[] = [];

        const savedMonth = localStorage.getItem(monthKey);
        if (savedMonth) {
          try {
            const parsed = JSON.parse(savedMonth);
            parsedWeeklyRecords = parsed.weeklyRecords || null;
            parsedMeetings = parsed.meetings || [];
          } catch (e) {
            console.error(e);
          }
        }

        let mH = 0;
        let mS = 0;
        let mI = 0;
        let mA = 0;
        let mUniform = 0;
        weeklyStatus[m.monthNum] = {};

        m.weeks.forEach(w => {
          let status: 'H' | 'S' | 'I' | 'A' = 'H';
          let uniform = true;

          // 1. Check saved weekly record
          if (parsedWeeklyRecords && parsedWeeklyRecords[student.id]?.[w.weekNum]) {
            const rec = parsedWeeklyRecords[student.id][w.weekNum];
            status = rec.status;
            uniform = rec.uniform !== false;
          } else {
            // 2. Fallback: check student.attendance for matching date
            const meetingDate = parsedMeetings.find(mt => mt.weekNum === w.weekNum)?.date || w.dateStr;
            if (meetingDate && student.attendance?.[meetingDate]) {
              const attStatus = student.attendance[meetingDate] as 'H' | 'S' | 'I' | 'A';
              if (['H', 'S', 'I', 'A'].includes(attStatus)) {
                status = attStatus;
              }
              uniform = true;
            } else {
              // Default to 'H'
              status = 'H';
              uniform = true;
            }
          }

          weeklyStatus[m.monthNum][w.weekNum] = status;

          if (status === 'H') {
            mH++;
            if (uniform) mUniform++;
          } else if (status === 'S') {
            mS++;
          } else if (status === 'I') {
            mI++;
          } else if (status === 'A') {
            mA++;
          }
        });

        monthlyData[m.monthNum] = {
          hadir: mH,
          sakit: mS,
          izin: mI,
          alpa: mA,
          totalMeetings: m.weeks.length,
          uniformCount: mUniform
        };

        semesterTotalH += mH;
        semesterTotalS += mS;
        semesterTotalI += mI;
        semesterTotalA += mA;
        semesterTotalMeetings += m.weeks.length;
        semesterTotalUniform += mUniform;
      });

      const semesterTotalJp = semesterTotalH * jpPerPertemuan;
      const baseMeetingDivider = semesterTotalMeetings > 0 ? semesterTotalMeetings : 1;
      const semesterAttendancePercent = Math.round((semesterTotalH / baseMeetingDivider) * 100);
      const semesterUniformPercent = semesterTotalH > 0 ? Math.round((semesterTotalUniform / semesterTotalH) * 100) : 100;

      let predicate: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan' = 'Sangat Baik';
      if (semesterAttendancePercent >= 95) predicate = 'Sangat Baik';
      else if (semesterAttendancePercent >= 80) predicate = 'Baik';
      else if (semesterAttendancePercent >= 70) predicate = 'Cukup';
      else predicate = 'Perlu Bimbingan';

      const existingNote = semesterStudentNotes[student.id];
      let defaultNote = 'Sangat disiplin dan aktif mengikuti pembelajaran fisik lapangan.';
      if (predicate === 'Baik') defaultNote = 'Partisipasi baik dalam aktivitas fisik, selalu menjaga sportivitas.';
      else if (predicate === 'Cukup') defaultNote = 'Cukup aktif, perlu memelihara stamina dan konsistensi kehadiran.';
      else if (predicate === 'Perlu Bimbingan') defaultNote = 'Perlu pendampingan intensif terkait kehadiran dan kebugaran tubuh.';

      return {
        studentId: student.id,
        studentName: student.name,
        nisn: student.nisn,
        gender: student.gender,
        weeklyStatus,
        monthlyData,
        semesterTotalH,
        semesterTotalS,
        semesterTotalI,
        semesterTotalA,
        semesterTotalMeetings,
        semesterTotalJp,
        semesterAttendancePercent,
        semesterUniformPercent,
        predicate,
        catatanRaporPjok: existingNote !== undefined ? existingNote : defaultNote
      };
    });
  }, [activeClass.students, activeClass.id, selectedSemester, selectedYear, semesterMonths, jpPerPertemuan, semesterStudentNotes, semesterUpdateTrigger]);

  // Semester collective stats
  const semesterClassStats = useMemo(() => {
    let totH = 0;
    let totMeetings = 0;
    let totUniform = 0;
    let perfectCount = 0;
    let attentionCount = 0;

    semesterRows.forEach(r => {
      totH += r.semesterTotalH;
      totMeetings += r.semesterTotalMeetings;
      totUniform += (r.semesterTotalH * (r.semesterUniformPercent / 100));

      if (r.semesterAttendancePercent === 100) perfectCount++;
      if (r.semesterAttendancePercent < 80 || r.semesterTotalS > 2) attentionCount++;
    });

    const avgAttendancePercent = totMeetings > 0 ? Math.round((totH / totMeetings) * 100) : 100;
    const avgUniformPercent = totH > 0 ? Math.round((totUniform / totH) * 100) : 100;
    const totalSemesterJp = totH * jpPerPertemuan;

    return {
      avgAttendancePercent,
      avgUniformPercent,
      totalSemesterJp,
      perfectStudentsCount: perfectCount,
      attentionStudentsCount: attentionCount
    };
  }, [semesterRows, jpPerPertemuan]);

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const buildMonthlyHtml = () => {
    const meta = {
      bulan: selectedMonth,
      tahun: selectedYear,
      namaSekolah,
      namaGuru,
      nipGuru,
      namaKepalaSekolah,
      nipKepalaSekolah,
      kota,
      dayOfWeekName: HARI_PJOK_OPTIONS.find(h => h.value === selectedDayOfWeek)?.label,
      meetings,
      weeklyRecords,
      studentNotes
    };
    return exportAbsensiMingguanPjokToDoc(activeClass, meta);
  };

  const buildSemesterHtml = () => {
    const meta: RekapSemesterPjokMeta = {
      semester: selectedSemester,
      tahunAjaran,
      namaSekolah,
      namaGuru,
      nipGuru,
      namaKepalaSekolah,
      nipKepalaSekolah,
      kota,
      jpPerPertemuan,
      months: semesterMonths,
      studentRows: semesterRows,
      classStats: semesterClassStats
    };
    return exportRekapSemesterPjokToDoc(activeClass, meta);
  };

  // Export handlers
  const handleExportMonthlyDoc = () => {
    const docHtml = buildMonthlyHtml();
    downloadDocFile(`Presensi_Mingguan_PJOK_F4_${activeClass.name.replace(/\s+/g, '_')}_${namaBulan}_${selectedYear}`, docHtml);
    setIsExportedDoc(true);
    triggerNotification('Dokumen Word Presensi Mingguan PJOK 1 Bulan (F4) berhasil diunduh!');
    setTimeout(() => setIsExportedDoc(false), 4000);
  };

  const handleExportMonthlyPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docHtml = buildMonthlyHtml();
      const fileName = `Presensi_Mingguan_PJOK_F4_${activeClass.name.replace(/\s+/g, '_')}_${namaBulan}_${selectedYear}.pdf`;
      const success = await downloadHtmlAsPdf(fileName, docHtml, {
        orientation: 'landscape',
        marginMm: 10
      });
      if (success) {
        triggerNotification('Dokumen PDF (F4 Landscape) Presensi Mingguan PJOK berhasil diunduh!');
      } else {
        printHtmlDocument(docHtml, `Presensi Mingguan PJOK F4 - ${activeClass.name}`, 'landscape');
      }
    } catch (err) {
      console.error('Error generating Monthly PJOK F4 PDF:', err);
      printHtmlDocument(buildMonthlyHtml(), `Presensi Mingguan PJOK F4 - ${activeClass.name}`, 'landscape');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportSemesterDoc = () => {
    const docHtml = buildSemesterHtml();
    downloadDocFile(`Rekap_Semester_PJOK_F4_${activeClass.name.replace(/\s+/g, '_')}_Sem_${selectedSemester}_${tahunAjaran.replace(/\//g, '-')}`, docHtml);
    setIsExportedDoc(true);
    triggerNotification('Dokumen Word Rekapitulasi Presensi 1 Semester PJOK (F4) berhasil diunduh!');
    setTimeout(() => setIsExportedDoc(false), 4000);
  };

  const handleExportSemesterPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docHtml = buildSemesterHtml();
      const fileName = `Rekap_Semester_PJOK_F4_${activeClass.name.replace(/\s+/g, '_')}_Sem_${selectedSemester}_${tahunAjaran.replace(/\//g, '-')}.pdf`;
      const success = await downloadHtmlAsPdf(fileName, docHtml, {
        orientation: 'landscape',
        marginMm: 10
      });
      if (success) {
        triggerNotification('Dokumen PDF (F4 Landscape) Rekapitulasi 1 Semester PJOK berhasil diunduh!');
      } else {
        printHtmlDocument(docHtml, `Rekap Semester PJOK F4 - ${activeClass.name}`, 'landscape');
      }
    } catch (err) {
      console.error('Error generating Semester PJOK F4 PDF:', err);
      printHtmlDocument(buildSemesterHtml(), `Rekap Semester PJOK F4 - ${activeClass.name}`, 'landscape');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Toggle status for a student in a specific month & week in the semester view
  const handleToggleStudentSemesterWeekStatus = (
    studentId: string,
    monthNum: number,
    weekNum: number
  ) => {
    const monthKey = `sadar_pjok_weekly_${activeClass.id}_${selectedYear}_${monthNum}`;
    let currentRecs: { [sId: string]: { [wNum: number]: PjokStudentWeeklyRecord } } = {};
    let currentMeetings: PjokWeekMeeting[] = [];
    let currentNotes = {};
    let dayOfWeek = selectedDayOfWeek;

    const saved = localStorage.getItem(monthKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        currentRecs = parsed.weeklyRecords || {};
        currentMeetings = parsed.meetings || [];
        currentNotes = parsed.studentNotes || {};
        if (parsed.dayOfWeek) dayOfWeek = parsed.dayOfWeek;
      } catch (e) {
        console.error(e);
      }
    }

    if (currentMeetings.length === 0) {
      currentMeetings = generateDefaultMeetings(dayOfWeek, monthNum, selectedYear);
    }

    const existingStatus = currentRecs[studentId]?.[weekNum]?.status || 'H';
    const cycleMap: { [k in 'H' | 'S' | 'I' | 'A']: 'H' | 'S' | 'I' | 'A' } = {
      'H': 'S',
      'S': 'I',
      'I': 'A',
      'A': 'H'
    };
    const newStatus = cycleMap[existingStatus];

    if (!currentRecs[studentId]) {
      currentRecs[studentId] = {};
    }
    currentRecs[studentId][weekNum] = {
      status: newStatus,
      uniform: newStatus === 'H',
      physicalNote: 'Bugar'
    };

    const payload = {
      meetings: currentMeetings,
      weeklyRecords: currentRecs,
      studentNotes: currentNotes,
      dayOfWeek
    };
    localStorage.setItem(monthKey, JSON.stringify(payload));
    setSemesterUpdateTrigger(prev => prev + 1);

    const studentName = activeClass.students.find(s => s.id === studentId)?.name || 'Siswa';
    const monthObj = BULAN_OPTIONS.find(b => b.value === monthNum);
    triggerNotification(`${studentName} (${monthObj?.label} Ming ${weekNum}): status diubah ke ${newStatus}`);
  };

  // Adjust number of weeks for a specific month
  const handleSetMonthWeeks = (monthNum: number, delta: number) => {
    const currentM = semesterMonths.find(m => m.monthNum === monthNum);
    const curCount = currentM ? currentM.meetingCount : 5;
    const newCount = Math.max(1, Math.min(6, curCount + delta));
    setCustomSemesterWeeks(prev => ({
      ...prev,
      [monthNum]: newCount
    }));
    triggerNotification(`Bulan ${currentM?.monthName}: diatur menjadi ${newCount} Minggu (Ming 1 s.d. ${newCount})`);
  };

  // Preset: set all months to 5 weeks (Ming 1 to 5)
  const handleResetToStandardWeeks = () => {
    const newConfig: { [monthNum: number]: number } = {};
    semesterMonths.forEach(m => {
      newConfig[m.monthNum] = 5;
    });
    setCustomSemesterWeeks(newConfig);
    triggerNotification('Format disetel seragam: Seluruh bulan menggunakan 5 Minggu (Ming 1 s.d. 5)');
  };

  // Preset: reset to auto calendar calculations
  const handleResetCalendarWeeks = () => {
    setCustomSemesterWeeks({});
    localStorage.removeItem(`sadar_pjok_semester_weeks_${activeClass.id}_${selectedSemester}`);
    triggerNotification('Jumlah minggu dikembalikan sesuai perhitungan otomatis kalender akademik.');
  };

  // Batch: Mark all students present for all weeks in the semester
  const handleMarkAllSemesterPresent = () => {
    semesterMonths.forEach(m => {
      const monthKey = `sadar_pjok_weekly_${activeClass.id}_${selectedYear}_${m.monthNum}`;
      let currentMeetings = generateDefaultMeetings(selectedDayOfWeek, m.monthNum, selectedYear);
      let currentRecs: { [sId: string]: { [wNum: number]: PjokStudentWeeklyRecord } } = {};

      const saved = localStorage.getItem(monthKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.meetings && parsed.meetings.length > 0) currentMeetings = parsed.meetings;
          currentRecs = parsed.weeklyRecords || {};
        } catch (e) {
          console.error(e);
        }
      }

      activeClass.students.forEach(s => {
        if (!currentRecs[s.id]) currentRecs[s.id] = {};
        m.weeks.forEach(w => {
          currentRecs[s.id][w.weekNum] = {
            status: 'H',
            uniform: true,
            physicalNote: 'Bugar'
          };
        });
      });

      localStorage.setItem(monthKey, JSON.stringify({
        meetings: currentMeetings,
        weeklyRecords: currentRecs,
        studentNotes: {},
        dayOfWeek: selectedDayOfWeek
      }));
    });

    setSemesterUpdateTrigger(prev => prev + 1);
    triggerNotification('Seluruh peserta didik berhasil ditandai Hadir (H) untuk seluruh minggu semester ini!');
  };

  const handlePrint = () => {
    if (viewMode === 'semester') {
      printHtmlDocument(buildSemesterHtml(), `Rekap Semester PJOK F4 - ${activeClass.name}`, 'landscape');
    } else {
      printHtmlDocument(buildMonthlyHtml(), `Presensi Mingguan PJOK F4 - ${activeClass.name}`, 'landscape');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* CSS Styles for Print Format (Landscape F4: 330mm x 215mm) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #weekly-pjok-print-sheet, #weekly-pjok-print-sheet * {
            visibility: visible;
          }
          #weekly-pjok-print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 6mm 4mm;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 7.5pt;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: 330mm 215mm;
            margin: 6mm 4mm;
          }
        }
      `}</style>

      {/* TOP VIEW MODE SWITCHER (MINGGUAN 1 BULAN vs REKAP 1 SEMESTER) */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('mingguan')}
            className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'mingguan'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Presensi Mingguan (1 Bulan)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('semester')}
            className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'semester'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            <span>Rekapitulasi 1 Semester (6 Bulan)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[9px] font-black uppercase">
              Rapor
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 pr-1 text-xs">
          <span className="text-slate-400 font-semibold hidden sm:inline">Rombel:</span>
          <span className="font-extrabold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            {activeClass.name} (Kelas {activeClass.grade})
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODE 1: PRESENSI MINGGUAN PER BULAN (1 BULAN)                   */}
      {/* ============================================================== */}
      {viewMode === 'mingguan' && (
        <div className="space-y-6">
          {/* TOP CONTROL BAR (NO-PRINT) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <Activity className="w-5 h-5 text-emerald-700" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      Presensi Mingguan Khusus Guru PJOK (1 Bulan)
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                        1 Pertemuan / Pekan
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Catat kehadiran siswa setiap pekan, materi ajar lapangan, kepatuhan seragam olahraga, serta status kebugaran fisik.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <ExportJsonPromptAiButtons
                  variant="compact"
                  onExportJson={() => {
                    const filename = `Presensi_Mingguan_PJOK_${activeClass.name.replace(/\s+/g, '_')}_${namaBulan}_${selectedYear}.json`;
                    downloadJsonFile(filename, {
                      kelas: activeClass.name,
                      grade: activeClass.grade,
                      bulan: namaBulan,
                      tahun: selectedYear,
                      hariMengajar: HARI_PJOK_OPTIONS.find(h => h.value === selectedDayOfWeek)?.label,
                      sekolah: namaSekolah,
                      guru: namaGuru,
                      nipGuru,
                      kepsek: namaKepalaSekolah,
                      nipKepsek: nipKepalaSekolah,
                      meetings,
                      weeklyRecords,
                      studentNotes,
                      summaryStats
                    });
                  }}
                  onOpenPromptAi={() => setShowPromptModal(true)}
                />

                <button
                  type="button"
                  onClick={handleExportMonthlyDoc}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Unduh format Microsoft Word (.doc) resmi F4 landscape"
                >
                  {isExportedDoc ? <Check className="w-4 h-4 text-emerald-200" /> : <FileDown className="w-4 h-4" />}
                  <span>{isExportedDoc ? 'Tersimpan!' : 'Unduh Word (.doc)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportMonthlyPdf}
                  disabled={isExportingPdf}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh PDF ukuran F4 Landscape rapi siap cetak"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF (F4)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Cetak format F4 landscape"
                >
                  <Printer className="w-4 h-4 text-slate-300" />
                  <span>Cetak F4</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    showSettings ? 'bg-slate-100 border-slate-400 text-slate-800' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-600'
                  }`}
                  title="Pengaturan Kop Sekolah & Tanda Tangan"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Kop & TTD</span>
                  {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Filter Bar (Bulan, Tahun, Hari PJOK, Auto-dates) */}
            <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="font-bold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Periode Bulan:
                </span>
                
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 bg-white focus:ring-1 focus:ring-emerald-500"
                >
                  {BULAN_OPTIONS.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 bg-white focus:ring-1 focus:ring-emerald-500"
                >
                  {[2024, 2025, 2026, 2027, 2028].map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>

                <span className="font-bold text-slate-600 ml-2">Hari Mengajar:</span>
                <select
                  value={selectedDayOfWeek}
                  onChange={(e) => setSelectedDayOfWeek(Number(e.target.value))}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 bg-white focus:ring-1 focus:ring-emerald-500"
                >
                  {HARI_PJOK_OPTIONS.map(h => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAutoGenerateDates}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Kalkulasi otomatis tanggal pertemuan sesuai hari mengajar dalam bulan terpilih"
                >
                  <RotateCcw className="w-3 h-3 text-emerald-600" />
                  <span>Auto Set Tanggal</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMeetingsConfig(!showMeetingsConfig)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{showMeetingsConfig ? 'Tutup Rincian Materi' : 'Atur Materi 4-5 Pekan'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncToSystemAttendance}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Sinkronkan tanggal dan status hadir mingguan ke menu presensi harian utama"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sinkron ke Presensi Sistem</span>
                </button>
              </div>
            </div>

            {/* Action Success Toast Banner */}
            {actionSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {/* EXPANDABLE: Form Pengaturan Kop & Tanda Tangan */}
            {showSettings && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-300">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  Pengaturan Identitas Lembaga & Lembar Pengesahan Resmi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Satuan Pendidikan</label>
                    <input
                      type="text"
                      value={namaSekolah}
                      onChange={(e) => setNamaSekolah(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Guru PJOK Pengampu</label>
                    <input
                      type="text"
                      value={namaGuru}
                      onChange={(e) => setNamaGuru(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">NIP Guru PJOK</label>
                    <input
                      type="text"
                      value={nipGuru}
                      onChange={(e) => setNipGuru(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Kepala Sekolah</label>
                    <input
                      type="text"
                      value={namaKepalaSekolah}
                      onChange={(e) => setNamaKepalaSekolah(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">NIP Kepala Sekolah</label>
                    <input
                      type="text"
                      value={nipKepalaSekolah}
                      onChange={(e) => setNipKepalaSekolah(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kota / Kabupaten</label>
                    <input
                      type="text"
                      value={kota}
                      onChange={(e) => setKota(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* EXPANDABLE: Form Rincian Materi 4-5 Pekan Pertemuan PJOK */}
            {showMeetingsConfig && (
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Daftar Topik & Materi Pertemuan PJOK ({meetings.length} Pekan Tatap Muka)
                  </h4>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Pilih atau ketik topik materi yang diajarkan pada setiap minggu
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {meetings.map((m) => (
                    <div key={m.weekNum} className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-black text-xs text-emerald-800 flex items-center gap-1">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                            {m.weekNum}
                          </span>
                          Minggu Ke-{m.weekNum}
                        </span>
                        <input
                          type="date"
                          value={m.date}
                          onChange={(e) => handleUpdateMeeting(m.weekNum, 'date', e.target.value)}
                          className="border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Materi / Topik PJOK</label>
                        <input
                          type="text"
                          value={m.topic}
                          onChange={(e) => handleUpdateMeeting(m.weekNum, 'topic', e.target.value)}
                          placeholder="Topik materi gerak..."
                          className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500"
                        />
                        
                        {/* Quick Preset Selector */}
                        <div className="mt-1.5 flex items-center gap-1">
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleUpdateMeeting(m.weekNum, 'topic', e.target.value);
                            }}
                            className="text-[10px] border border-slate-200 rounded px-1.5 py-0.5 text-slate-500 bg-slate-50 w-full"
                          >
                            <option value="">Pilih Preset Materi PJOK...</option>
                            {MATERI_PJOK_PRESETS.map((p, pIdx) => (
                              <option key={pIdx} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Lokasi</label>
                          <input
                            type="text"
                            value={m.venue || 'Lapangan'}
                            onChange={(e) => handleUpdateMeeting(m.weekNum, 'venue', e.target.value)}
                            className="w-full border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Status</label>
                          <select
                            value={m.executionStatus || 'Terlaksana'}
                            onChange={(e) => handleUpdateMeeting(m.weekNum, 'executionStatus', e.target.value as any)}
                            className="w-full border border-slate-200 rounded px-1.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50"
                          >
                            <option value="Terlaksana">Terlaksana Lapangan</option>
                            <option value="Teori Kelas">Teori di Kelas (Hujan)</option>
                            <option value="Ujian Praktik">Ujian Praktik</option>
                            <option value="Libur">Libur / Ditunda</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* DASHBOARD RINGKASAN STATISTIK PJOK (NO-PRINT) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Rata-rata Kehadiran</span>
                <p className="text-xl font-black text-slate-800 leading-tight mt-0.5">{summaryStats.attendanceRate}%</p>
                <span className="text-[10px] text-emerald-600 font-semibold">{summaryStats.totalH} kali hadir siswa</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Shirt className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Kepatuhan Seragam</span>
                <p className="text-xl font-black text-slate-800 leading-tight mt-0.5">{summaryStats.uniformRate}%</p>
                <span className="text-[10px] text-blue-600 font-semibold">Kaos & training olahraga</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Hadir Sempurna</span>
                <p className="text-xl font-black text-slate-800 leading-tight mt-0.5">{summaryStats.perfectStudentsCount} Siswa</p>
                <span className="text-[10px] text-teal-600 font-semibold">100% hadir sebulan</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Perhatian Kebugaran</span>
                <p className="text-xl font-black text-slate-800 leading-tight mt-0.5">{summaryStats.attentionStudentsCount} Siswa</p>
                <span className="text-[10px] text-amber-600 font-semibold">Pernah sakit / catatan fisik</span>
              </div>
            </div>
          </div>

          {/* QUICK BATCH PER-PEKAN ACTION BAR (NO-PRINT) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                <Sparkle className="w-3.5 h-3.5 text-amber-500" />
                Tindakan Cepat Per Pekan:
              </span>
              <span className="text-slate-500 text-[11px]">
                Klik tombol status sel untuk mengubah <strong>(H &rarr; S &rarr; I &rarr; A)</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {meetings.map(m => (
                <div key={m.weekNum} className="inline-flex items-center rounded-lg border border-slate-250 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => handleMarkAllPresent(m.weekNum)}
                    className="px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                    title={`Tandai seluruh siswa Hadir pada Minggu ${m.weekNum}`}
                  >
                    M{m.weekNum}: Hadir Semua
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleMarkAllUniform(m.weekNum)}
                    className="px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    title={`Tandai seragam lengkap pada Minggu ${m.weekNum}`}
                  >
                    👕 Seragam OK
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* MATRIKS TABEL UTAMA PRESENSI MINGGUAN SISWA (INTERAKTIF & CETAK) */}
          <div 
            id="weekly-pjok-print-sheet" 
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden space-y-6"
          >
            {/* KOP RESMI CETAK */}
            <div className="text-center border-b-2 border-slate-900 pb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                DINAS PENDIDIKAN & KEBUDAYAAN &bull; PEMERINTAH KOTA / KABUPATEN
              </p>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-0.5">
                {namaSekolah}
              </h2>
              <h1 className="text-base font-extrabold text-slate-800 uppercase tracking-tight mt-1 text-emerald-800">
                PRESENSI & OBSERVASI PEMBELAJARAN MINGGUAN GURU PJOK (1 BULAN)
              </h1>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                BULAN: {namaBulan.toUpperCase()} {selectedYear} &bull; T.A. {tahunAjaran} &bull; MAPEL: PENDIDIKAN JASMANI, OLAHRAGA, DAN KESEHATAN
              </p>
            </div>

            {/* IDENTITAS KELAS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs border-b border-slate-150 pb-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Rombongan Belajar</span>
                <p className="font-extrabold text-slate-800">{activeClass.name} (Kelas {activeClass.grade} SD)</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Jadwal Tatap Muka</span>
                <p className="font-bold text-slate-800">
                  Setiap Hari {HARI_PJOK_OPTIONS.find(h => h.value === selectedDayOfWeek)?.label} ({meetings.length} Pertemuan)
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Guru Pengampu PJOK</span>
                <p className="font-bold text-slate-800">{namaGuru}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Jumlah Murid Terdaftar</span>
                <p className="font-bold text-slate-800">{(activeClass?.students || []).length} Siswa</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Fase Kurikulum</span>
                <p className="font-bold text-slate-800">Fase {activeClass.grade <= 2 ? 'A' : activeClass.grade <= 4 ? 'B' : 'C'}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Rata-rata Kehadiran</span>
                <p className="font-extrabold text-emerald-700">{summaryStats.attendanceRate}%</p>
              </div>
            </div>

            {/* TABEL RINCIAN PERTEMUAN MINGGUAN (TANGGAL & MATERI) */}
            <div className="border border-emerald-200 rounded-xl overflow-hidden">
              <div className="bg-emerald-800 text-white px-3 py-1.5 font-bold text-xs flex items-center justify-between">
                <span>Rincian Pertemuan & Materi Praktik Mingguan PJOK:</span>
                <span className="text-[10px] text-emerald-200">Alokasi: {jpPerPertemuan} JP / Pertemuan</span>
              </div>
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-emerald-50 text-emerald-900 border-b border-emerald-200 font-bold text-[11px]">
                  <tr>
                    <th className="p-2 text-center w-24 border-r border-emerald-200">Pekan</th>
                    <th className="p-2 w-32 border-r border-emerald-200">Tanggal</th>
                    <th className="p-2 border-r border-emerald-200">Materi Pokok / Aktivitas Gerak PJOK</th>
                    <th className="p-2 w-48 text-center">Lokasi & Keterlaksanaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100 font-medium">
                  {meetings.map(m => (
                    <tr key={m.weekNum} className="hover:bg-emerald-50/40">
                      <td className="p-2 text-center font-bold text-emerald-900 border-r border-emerald-100">
                        Minggu {m.weekNum}
                      </td>
                      <td className="p-2 border-r border-emerald-100 font-semibold text-slate-700">
                        {m.date ? new Date(m.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="p-2 border-r border-emerald-100 text-slate-800">
                        {m.topic || 'Aktivitas Kebugaran Jasmani'}
                      </td>
                      <td className="p-2 text-center text-[11px]">
                        <span className="font-bold text-emerald-700">{m.venue || 'Lapangan'}</span> &bull; {m.executionStatus || 'Terlaksana'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TABEL UTAMA MATRIKS PRESENSI MINGGUAN PER SISWA */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-900 text-white font-extrabold text-center">
                    <th rowSpan={2} className="p-2 w-10 border border-slate-400">No.</th>
                    <th rowSpan={2} className="p-2 text-left w-52 border border-slate-400">Nama Siswa</th>
                    <th rowSpan={2} className="p-2 w-10 border border-slate-400">L/P</th>
                    <th colSpan={meetings.length} className="p-2 border border-slate-400 bg-slate-800">
                      PRESENSI PERTEMUAN MINGGUAN ({namaBulan.toUpperCase()} {selectedYear})
                    </th>
                    <th colSpan={4} className="p-2 border border-slate-400 bg-slate-800">REKAP</th>
                    <th rowSpan={2} className="p-2 w-12 border border-slate-400">%</th>
                    <th rowSpan={2} className="p-2 text-left w-56 border border-slate-400">Catatan Kebugaran & Observasi Guru</th>
                  </tr>
                  <tr className="bg-slate-800 text-white font-bold text-[11px] text-center">
                    {meetings.map(m => (
                      <th key={m.weekNum} className="p-1.5 w-24 border border-slate-400">
                        <div>Minggu {m.weekNum}</div>
                        <div className="text-[9px] font-normal opacity-75">{m.date ? m.date.slice(5) : ''}</div>
                      </th>
                    ))}
                    <th className="p-1 w-8 border border-slate-400 bg-emerald-700 text-white" title="Hadir">H</th>
                    <th className="p-1 w-8 border border-slate-400 bg-blue-700 text-white" title="Sakit">S</th>
                    <th className="p-1 w-8 border border-slate-400 bg-amber-700 text-white" title="Izin">I</th>
                    <th className="p-1 w-8 border border-slate-400 bg-rose-700 text-white" title="Alpa">A</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(activeClass?.students || []).map((student, sIdx) => {
                    let stH = 0;
                    let stS = 0;
                    let stI = 0;
                    let stA = 0;

                    return (
                      <tr key={student.id} className={sIdx % 2 === 1 ? 'bg-slate-50/70 hover:bg-slate-100' : 'hover:bg-slate-50'}>
                        <td className="p-2 text-center font-medium border border-slate-250 text-slate-500">
                          {sIdx + 1}
                        </td>
                        <td className="p-2 border border-slate-250 font-bold text-slate-800">
                          <div>{student.name}</div>
                          {student.nisn && (
                            <div className="text-[10px] font-normal text-slate-400 font-mono">NISN: {student.nisn}</div>
                          )}
                        </td>
                        <td className={`p-2 text-center font-extrabold border border-slate-250 ${student.gender === 'L' ? 'text-blue-600' : 'text-pink-600'}`}>
                          {student.gender}
                        </td>

                        {/* Weekly Columns */}
                        {meetings.map(m => {
                          const rec = weeklyRecords[student.id]?.[m.weekNum] || { status: 'H', uniform: true };
                          const status = rec.status || 'H';
                          const isUniform = rec.uniform !== false;

                          if (status === 'H') stH++;
                          else if (status === 'S') stS++;
                          else if (status === 'I') stI++;
                          else if (status === 'A') stA++;

                          let badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                          if (status === 'S') badgeBg = 'bg-blue-50 text-blue-800 border-blue-200';
                          if (status === 'I') badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
                          if (status === 'A') badgeBg = 'bg-rose-50 text-rose-800 border-rose-200';

                          return (
                            <td 
                              key={m.weekNum} 
                              className="p-1.5 text-center border border-slate-250 align-middle"
                            >
                              <div className="flex flex-col items-center justify-center gap-1">
                                {/* Status Button (Toggle H -> S -> I -> A) */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleStudentStatus(student.id, m.weekNum)}
                                  className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center border shadow-xs transition-transform active:scale-95 cursor-pointer ${badgeBg}`}
                                  title="Klik untuk ubah status: H / S / I / A"
                                >
                                  {status}
                                </button>

                                {/* Uniform and Health Controls */}
                                <div className="flex items-center gap-1">
                                  {/* Uniform Check */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleStudentUniform(student.id, m.weekNum, e)}
                                    className={`text-[9px] px-1 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                                      isUniform 
                                        ? 'bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200' 
                                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                    }`}
                                    title={isUniform ? 'Seragam Olahraga Lengkap (Klik jika tidak berseragam)' : 'Tidak Berseragam Olahraga Lengkap'}
                                  >
                                    {isUniform ? '👕 Srgm' : '⚠️ No'}
                                  </button>

                                  {/* Physical Status Indicator */}
                                  {rec.physicalNote && rec.physicalNote !== 'Bugar' && (
                                    <span 
                                      onClick={(e) => handleCyclePhysicalStatus(student.id, m.weekNum, e)}
                                      className="text-[8px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-bold cursor-pointer"
                                      title={rec.physicalNote}
                                    >
                                      🩺 {rec.physicalNote.slice(0, 4)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })}

                        {/* Summary Totals */}
                        <td className="p-1.5 text-center font-black border border-slate-250 bg-emerald-50/50 text-emerald-800">
                          {stH}
                        </td>
                        <td className="p-1.5 text-center font-bold border border-slate-250 bg-blue-50/50 text-blue-800">
                          {stS}
                        </td>
                        <td className="p-1.5 text-center font-bold border border-slate-250 bg-amber-50/50 text-amber-800">
                          {stI}
                        </td>
                        <td className="p-1.5 text-center font-bold border border-slate-250 bg-rose-50/50 text-rose-800">
                          {stA}
                        </td>

                        {/* Percentage */}
                        <td className="p-1.5 text-center font-black border border-slate-250 text-slate-800">
                          {meetings.length > 0 ? Math.round((stH / meetings.length) * 100) : 100}%
                        </td>

                        {/* Custom Observation Note */}
                        <td className="p-1.5 border border-slate-250 text-xs">
                          <input
                            type="text"
                            value={studentNotes[student.id] !== undefined ? studentNotes[student.id] : (stH === meetings.length ? 'Sangat aktif & bugar' : stS > 0 ? 'Perlu perhatian fisik' : '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStudentNotes(prev => ({ ...prev, [student.id]: val }));
                            }}
                            placeholder="Catatan kebugaran siswa..."
                            className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white text-slate-700 text-[11px] p-1 focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Table Footer Totals */}
                <tfoot>
                  <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-900 text-slate-800">
                    <td colSpan={3} className="p-2 text-right border border-slate-300">
                      TOTAL KEHADIRAN KELAS:
                    </td>
                    {meetings.map(m => {
                      const mCountH = (activeClass?.students || []).filter(st => {
                        const rec = weeklyRecords[st.id]?.[m.weekNum];
                        return !rec || rec.status === 'H';
                      }).length;
                      return (
                        <td key={m.weekNum} className="p-2 text-center border border-slate-300 text-emerald-800 font-black text-xs">
                          {mCountH} Hadir
                        </td>
                      );
                    })}
                    <td className="p-2 text-center border border-slate-300 bg-emerald-100 text-emerald-800 font-black">
                      {summaryStats.totalH}
                    </td>
                    <td className="p-2 text-center border border-slate-300 bg-blue-100 text-blue-800 font-black">
                      {summaryStats.totalS}
                    </td>
                    <td className="p-2 text-center border border-slate-300 bg-amber-100 text-amber-800 font-black">
                      {summaryStats.totalI}
                    </td>
                    <td className="p-2 text-center border border-slate-300 bg-rose-100 text-rose-800 font-black">
                      {summaryStats.totalA}
                    </td>
                    <td className="p-2 text-center border border-slate-300 text-emerald-800 font-black">
                      {summaryStats.attendanceRate}%
                    </td>
                    <td className="border border-slate-300"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* KETERANGAN KODE FORMAT & CEKLIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-250 space-y-1.5">
                <span className="font-extrabold text-slate-700 block">Keterangan Status & Simbol:</span>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                  <div><strong className="text-emerald-700">H</strong> = Hadir di Lapangan/Kelas</div>
                  <div><strong className="text-blue-700">S</strong> = Sakit (Dengan Surat/Pemberitahuan)</div>
                  <div><strong className="text-amber-700">I</strong> = Izin Resmi / Keperluan Keluarga</div>
                  <div><strong className="text-rose-700">A</strong> = Alpa / Tanpa Keterangan</div>
                  <div><strong>👕 Srgm</strong> = Pakaian Olahraga Lengkap</div>
                  <div><strong>⚠️ No</strong> = Tidak Berseragam Lengkap</div>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-extrabold text-emerald-800 block">Ringkasan Evaluasi Pembelajaran PJOK:</span>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Tingkat partisipasi fisik siswa kelas {activeClass.name} berada pada angka <strong>{summaryStats.attendanceRate}%</strong> dengan tingkat kepatuhan pakaian olahraga sebesar <strong>{summaryStats.uniformRate}%</strong>. Sebanyak <strong>{summaryStats.perfectStudentsCount}</strong> siswa hadir penuh pada seluruh {meetings.length} pertemuan.
                </p>
              </div>
            </div>

            {/* LEMBAR PENGESAHAN TANDA TANGAN */}
            <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
              <div className="space-y-1">
                <p className="font-medium text-slate-600">Mengetahui,</p>
                <p className="font-extrabold text-slate-900 uppercase">Kepala Sekolah {namaSekolah}</p>
                <div className="h-16"></div>
                <p className="font-black underline text-slate-900">{namaKepalaSekolah}</p>
                <p className="text-slate-500 font-mono text-[11px]">NIP. {nipKepalaSekolah}</p>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-slate-600">{kota}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-extrabold text-slate-900 uppercase">Guru Mata Pelajaran PJOK</p>
                <div className="h-16"></div>
                <p className="font-black underline text-slate-900">{namaGuru}</p>
                <p className="text-slate-500 font-mono text-[11px]">NIP. {nipGuru}</p>
              </div>
            </div>
          </div>

          {/* MODAL PROMPT AI (GEMINI / CHATGPT) - MONTHLY */}
          <AiPromptModal
            isOpen={showPromptModal}
            onClose={() => setShowPromptModal(false)}
            title="Prompt AI - Presensi & Observasi Mingguan PJOK"
            subtitle={`Rombel ${activeClass.name} • Bulan ${namaBulan} ${selectedYear} (${meetings.length} Pekan)`}
            tabs={getAbsensiMingguanPjokPrompts(
              activeClass.name, 
              namaBulan, 
              selectedYear, 
              meetings.map(m => `Minggu ${m.weekNum}: ${m.topic}`)
            )}
            defaultActiveTab="analisis_kehadiran_pjok"
            jsonData={{
              kelas: activeClass.name,
              grade: activeClass.grade,
              bulan: namaBulan,
              tahun: selectedYear,
              hariMengajar: HARI_PJOK_OPTIONS.find(h => h.value === selectedDayOfWeek)?.label,
              sekolah: namaSekolah,
              guru: namaGuru,
              nipGuru,
              kepsek: namaKepalaSekolah,
              nipKepsek: nipKepalaSekolah,
              meetings,
              weeklyRecords,
              studentNotes,
              summaryStats
            }}
            jsonFilename={`Presensi_Mingguan_PJOK_${activeClass.name.replace(/\s+/g, '_')}_${namaBulan}_${selectedYear}.json`}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: REKAPITULASI PRESENSI 1 SEMESTER (6 BULAN)              */}
      {/* ============================================================== */}
      {viewMode === 'semester' && (
        <div className="space-y-6">
          {/* TOP CONTROL BAR (NO-PRINT) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <CalendarRange className="w-5 h-5 text-emerald-700" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      Rekapitulasi Presensi 1 Semester Guru PJOK (6 Bulan)
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wide">
                        Semester {selectedSemester === 1 ? '1 (Ganjil)' : '2 (Genap)'}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Agregasi kehadiran 6 bulan, total jam pelajaran (JP) tatap muka, kepatuhan seragam olahraga, predikat partisipasi, dan catatan deskripsi rapor PJOK.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <ExportJsonPromptAiButtons
                  variant="compact"
                  onExportJson={() => {
                    const filename = `Rekap_Presensi_Semester_PJOK_${activeClass.name.replace(/\s+/g, '_')}_Sem_${selectedSemester}_${tahunAjaran.replace(/\//g, '-')}.json`;
                    downloadJsonFile(filename, {
                      kelas: activeClass.name,
                      grade: activeClass.grade,
                      semester: selectedSemester,
                      tahunAjaran,
                      sekolah: namaSekolah,
                      guru: namaGuru,
                      nipGuru,
                      kepsek: namaKepalaSekolah,
                      nipKepsek: nipKepalaSekolah,
                      jpPerPertemuan,
                      semesterMonths,
                      semesterClassStats,
                      studentRows: semesterRows
                    });
                  }}
                  onOpenPromptAi={() => setShowPromptModal(true)}
                />

                <button
                  type="button"
                  onClick={handleExportSemesterDoc}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Unduh format Microsoft Word (.doc) resmi F4 rekapitulasi semester"
                >
                  {isExportedDoc ? <Check className="w-4 h-4 text-emerald-200" /> : <FileDown className="w-4 h-4" />}
                  <span>{isExportedDoc ? 'Tersimpan!' : 'Unduh Word Rekap (.doc)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportSemesterPdf}
                  disabled={isExportingPdf}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh PDF ukuran F4 Landscape rekapitulasi semester rapi siap cetak"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF Semester (F4)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Cetak format cetak F4 landscape semester"
                >
                  <Printer className="w-4 h-4 text-slate-300" />
                  <span>Cetak F4 Semester</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    showSettings ? 'bg-slate-100 border-slate-400 text-slate-800' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-600'
                  }`}
                  title="Pengaturan Kop Sekolah & Tanda Tangan"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Kop & TTD</span>
                  {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Filter Bar (Semester, Tahun Ajaran, JP per Pertemuan) */}
            <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-600 flex items-center gap-1">
                  <CalendarRange className="w-3.5 h-3.5 text-slate-400" /> Pilih Semester:
                </span>
                
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedSemester(1)}
                    className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      selectedSemester === 1 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semester 1 (Ganjil: Jul - Des)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSemester(2)}
                    className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      selectedSemester === 2 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semester 2 (Genap: Jan - Jun)
                  </button>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  <span className="font-bold text-slate-600">Alokasi Tatap Muka:</span>
                  <select
                    value={jpPerPertemuan}
                    onChange={(e) => setJpPerPertemuan(Number(e.target.value))}
                    className="border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 bg-white"
                  >
                    <option value={2}>2 JP / Pekan</option>
                    <option value={3}>3 JP / Pekan (Standar SD)</option>
                    <option value={4}>4 JP / Pekan</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">
                  T.A. <strong>{tahunAjaran}</strong> &bull; Total Beban Rapor: <strong>{semesterClassStats.totalSemesterJp} JP</strong>
                </span>
              </div>
            </div>

            {/* EXPANDABLE: Form Pengaturan Kop & Tanda Tangan */}
            {showSettings && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-300">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  Pengaturan Identitas Lembaga & Lembar Pengesahan Resmi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Satuan Pendidikan</label>
                    <input
                      type="text"
                      value={namaSekolah}
                      onChange={(e) => setNamaSekolah(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Guru PJOK Pengampu</label>
                    <input
                      type="text"
                      value={namaGuru}
                      onChange={(e) => setNamaGuru(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">NIP Guru PJOK</label>
                    <input
                      type="text"
                      value={nipGuru}
                      onChange={(e) => setNipGuru(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Kepala Sekolah</label>
                    <input
                      type="text"
                      value={namaKepalaSekolah}
                      onChange={(e) => setNamaKepalaSekolah(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">NIP Kepala Sekolah</label>
                    <input
                      type="text"
                      value={nipKepalaSekolah}
                      onChange={(e) => setNipKepalaSekolah(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kota / Kabupaten</label>
                    <input
                      type="text"
                      value={kota}
                      onChange={(e) => setKota(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PANEL KONTROL JUMLAH MINGGU PER BULAN (MING 1, 2, 3, 4, 5) - NO PRINT */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-4 sm:p-5 space-y-3.5 no-print">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Calendar className="w-5 h-5 text-emerald-700" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    Distribusi Kolom Minggu Per Bulan ({selectedSemester === 1 ? 'Juli s.d. Desember' : 'Januari s.d. Juni'})
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                      Ming 1, 2, 3, 4, 5
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Jumlah kolom minggu pada tabel rekapitulasi semester disesuaikan otomatis dengan kalender tiap bulan. Klik <strong>+</strong> atau <strong>-</strong> untuk menyesuaikan bila ada pekan libur/efektif.
                  </p>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleResetToStandardWeeks}
                  className="px-3 py-1.5 rounded-lg font-bold bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                  title="Format seragam seluruh bulan menggunakan 5 Minggu (Ming 1 s.d. 5)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Format 5 Minggu (Ming 1-5)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetCalendarWeeks}
                  className="px-3 py-1.5 rounded-lg font-bold bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                  title="Hitung ulang otomatis berdasarkan kalender akademik"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hitung Kalender</span>
                </button>

                <label className="flex items-center gap-2 font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer shadow-2xs hover:bg-slate-100 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={showMonthlyTotals}
                    onChange={(e) => setShowMonthlyTotals(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span>Kolom Total Bulanan</span>
                </label>

                <button
                  type="button"
                  onClick={handleMarkAllSemesterPresent}
                  className="px-3 py-1.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                  title="Isi seluruh minggu 6 bulan dengan status Hadir (H)"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Isi Hadir Semua</span>
                </button>
              </div>
            </div>

            {/* Stepper buttons per month: Juli, Agustus, September, Oktober, November, Desember */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100">
              {semesterMonths.map(m => (
                <div 
                  key={m.monthNum}
                  className="bg-slate-50/80 border border-slate-200 rounded-xl p-2.5 flex flex-col items-center justify-between gap-1.5 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all shadow-2xs"
                >
                  <div className="text-center">
                    <span className="font-black text-xs text-slate-800 uppercase block tracking-wide">
                      {m.monthName}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                      Ming 1 s.d. {m.weeks.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-1 bg-white border border-slate-250 rounded-lg p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleSetMonthWeeks(m.monthNum, -1)}
                      disabled={m.weeks.length <= 1}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-800 font-black text-xs flex items-center justify-center transition-all cursor-pointer"
                      title={`Kurangi 1 minggu bulan ${m.monthName}`}
                    >
                      -
                    </button>
                    <span className="font-extrabold text-xs text-slate-800 min-w-[24px] text-center font-mono">
                      {m.weeks.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSetMonthWeeks(m.monthNum, 1)}
                      disabled={m.weeks.length >= 6}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-800 font-black text-xs flex items-center justify-center transition-all cursor-pointer"
                      title={`Tambah 1 minggu bulan ${m.monthName}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DASHBOARD STATISTIK SEMESTER (NO-PRINT) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Rata-rata Semester</span>
                <p className="text-xl font-black text-slate-800 leading-tight mt-0.5">{semesterClassStats.avgAttendancePercent}%</p>
                <span className="text-[10px] text-emerald-600 font-semibold">{semesterClassStats.totalSemesterJp} Total JP Terealisasi</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Shirt className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Disiplin Seragam PJOK</span>
                <p className="text-xl font-black text-slate-800 leading-tight mt-0.5">{semesterClassStats.avgUniformPercent}%</p>
                <span className="text-[10px] text-blue-600 font-semibold">Kepatuhan pakaian 1 semester</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Presensi Sempurna</span>
                <p className="text-xl font-black text-slate-800 leading-tight mt-0.5">{semesterClassStats.perfectStudentsCount} Siswa</p>
                <span className="text-[10px] text-teal-600 font-semibold">100% hadir 6 bulan</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Perlu Pembinaan</span>
                <p className="text-xl font-black text-slate-800 leading-tight mt-0.5">{semesterClassStats.attentionStudentsCount} Siswa</p>
                <span className="text-[10px] text-amber-600 font-semibold">Kehadiran &lt; 80% / sering sakit</span>
              </div>
            </div>
          </div>

          {/* TABEL UTAMA REKAPITULASI PRESENSI 1 SEMESTER SISWA */}
          <div 
            id="weekly-pjok-print-sheet" 
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden space-y-6"
          >
            {/* KOP RESMI CETAK */}
            <div className="text-center border-b-2 border-slate-900 pb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                DINAS PENDIDIKAN & KEBUDAYAAN &bull; PEMERINTAH KOTA / KABUPATEN
              </p>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-0.5">
                {namaSekolah}
              </h2>
              <h1 className="text-base font-extrabold text-slate-800 uppercase tracking-tight mt-1 text-emerald-800">
                REKAPITULASI PRESENSI & PARTISIPASI GERAK PJOK SEMESTER {selectedSemester === 1 ? '1 (GANJIL)' : '2 (GENAP)'}
              </h1>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                TAHUN AJARAN {tahunAjaran} &bull; MATA PELAJARAN: PENDIDIKAN JASMANI, OLAHRAGA, DAN KESEHATAN (PJOK)
              </p>
            </div>

            {/* IDENTITAS KELAS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs border-b border-slate-150 pb-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Rombongan Belajar</span>
                <p className="font-extrabold text-slate-800">{activeClass.name} (Kelas {activeClass.grade} SD)</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Periode Semester</span>
                <p className="font-bold text-slate-800">
                  Semester {selectedSemester === 1 ? '1 (Juli - Desember)' : '2 (Januari - Juni)'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Guru Pengampu PJOK</span>
                <p className="font-bold text-slate-800">{namaGuru}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Murid</span>
                <p className="font-bold text-slate-800">{(activeClass?.students || []).length} Siswa</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Alokasi Waktu Tatap Muka</span>
                <p className="font-bold text-slate-800">{jpPerPertemuan} JP / Pertemuan</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Rerata Kehadiran Semester</span>
                <p className="font-extrabold text-emerald-700">{semesterClassStats.avgAttendancePercent}%</p>
              </div>
            </div>

            {/* TABEL REKAPITULASI 6 BULAN PER SISWA */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-900 text-white font-extrabold text-center">
                    <th rowSpan={2} className="p-2 w-8 border border-slate-400">No.</th>
                    <th rowSpan={2} className="p-2 text-left w-44 border border-slate-400">Nama Siswa</th>
                    <th rowSpan={2} className="p-2 w-8 border border-slate-400">L/P</th>
                    {semesterMonths.map(m => (
                      <th 
                        key={m.monthNum} 
                        colSpan={m.weeks.length + (showMonthlyTotals ? 1 : 0)} 
                        className="p-1.5 border border-slate-400 bg-slate-800 text-center"
                      >
                        <div className="font-black text-xs tracking-wider text-white">{m.monthName.toUpperCase()}</div>
                        <div className="text-[10px] font-normal text-slate-300">({m.weeks.length} Minggu)</div>
                      </th>
                    ))}
                    <th colSpan={4} className="p-1.5 border border-slate-400 bg-emerald-900 text-emerald-100">
                      TOTAL SEMESTER
                    </th>
                    <th rowSpan={2} className="p-1 w-14 border border-slate-400 bg-slate-800">TOTAL JP</th>
                    <th rowSpan={2} className="p-1 w-12 border border-slate-400 bg-slate-800">% HADIR</th>
                    <th rowSpan={2} className="p-1 w-12 border border-slate-400 bg-slate-800">% SRGM</th>
                    <th rowSpan={2} className="p-1 w-24 border border-slate-400 bg-slate-800">PREDIKAT</th>
                    <th rowSpan={2} className="p-2 text-left w-56 border border-slate-400 bg-slate-800">
                      Catatan Deskripsi Rapor PJOK
                    </th>
                  </tr>
                  <tr className="bg-slate-800 text-white font-bold text-[10px] text-center">
                    {semesterMonths.map(m => (
                      <React.Fragment key={m.monthNum}>
                        {m.weeks.map(w => (
                          <th 
                            key={w.weekNum} 
                            className="p-1 min-w-[32px] border border-slate-400 bg-slate-700 text-white font-bold text-center text-[10px]"
                            title={`Bulan ${m.monthName} - Minggu ke-${w.weekNum}${w.dateStr ? ` (${w.dateStr})` : ''}`}
                          >
                            Ming {w.weekNum}
                          </th>
                        ))}
                        {showMonthlyTotals && (
                          <th 
                            className="p-1 min-w-[28px] border border-slate-400 bg-emerald-900/90 text-emerald-100 font-extrabold text-center text-[10px]"
                            title={`Total Hadir Bulan ${m.monthName}`}
                          >
                            Tot H
                          </th>
                        )}
                      </React.Fragment>
                    ))}
                    <th className="p-1 w-7 border border-slate-400 bg-emerald-700 text-white font-black" title="Hadir">H</th>
                    <th className="p-1 w-7 border border-slate-400 bg-blue-700 text-white font-black" title="Sakit">S</th>
                    <th className="p-1 w-7 border border-slate-400 bg-amber-700 text-white font-black" title="Izin">I</th>
                    <th className="p-1 w-7 border border-slate-400 bg-rose-700 text-white font-black" title="Alpa">A</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {semesterRows.map((row, sIdx) => {
                    let predBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    if (row.predicate === 'Baik') predBg = 'bg-sky-50 text-sky-800 border-sky-200';
                    else if (row.predicate === 'Cukup') predBg = 'bg-amber-50 text-amber-800 border-amber-200';
                    else if (row.predicate === 'Perlu Bimbingan') predBg = 'bg-rose-50 text-rose-800 border-rose-200';

                    return (
                      <tr key={row.studentId} className={sIdx % 2 === 1 ? 'bg-slate-50/70 hover:bg-slate-100' : 'hover:bg-slate-50'}>
                        <td className="p-1.5 text-center font-medium border border-slate-250 text-slate-500">
                          {sIdx + 1}
                        </td>
                        <td className="p-1.5 border border-slate-250 font-bold text-slate-800">
                          <div>{row.studentName}</div>
                          {row.nisn && (
                            <div className="text-[9px] font-normal text-slate-400 font-mono">NISN: {row.nisn}</div>
                          )}
                        </td>
                        <td className={`p-1.5 text-center font-extrabold border border-slate-250 ${row.gender === 'L' ? 'text-blue-600' : 'text-pink-600'}`}>
                          {row.gender}
                        </td>

                        {/* 6 Months Breakdown with Ming 1, 2, 3, 4, 5 */}
                        {semesterMonths.map(m => {
                          const mData = row.monthlyData[m.monthNum] || { hadir: 0, sakit: 0, izin: 0, alpa: 0, totalMeetings: m.weeks.length, uniformCount: 0 };
                          return (
                            <React.Fragment key={m.monthNum}>
                              {m.weeks.map(w => {
                                const status = row.weeklyStatus?.[m.monthNum]?.[w.weekNum] || 'H';
                                let badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100';
                                if (status === 'S') badgeStyle = 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100';
                                if (status === 'I') badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100';
                                if (status === 'A') badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100';

                                return (
                                  <td key={w.weekNum} className="p-0.5 text-center border border-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStudentSemesterWeekStatus(row.studentId, m.monthNum, w.weekNum)}
                                      title={`${row.studentName} - Bulan ${m.monthName} Ming ${w.weekNum}: Status ${status} (Klik untuk ubah: H -> S -> I -> A)`}
                                      className={`w-7 h-6 mx-auto rounded font-black text-[11px] border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${badgeStyle}`}
                                    >
                                      {status}
                                    </button>
                                  </td>
                                );
                              })}
                              {showMonthlyTotals && (
                                <td className="p-1 text-center font-black border border-slate-200 bg-emerald-50/70 text-emerald-800 text-[11px]">
                                  {mData.hadir}
                                </td>
                              )}
                            </React.Fragment>
                          );
                        })}

                        {/* Semester Totals */}
                        <td className="p-1.5 text-center font-black border border-slate-250 bg-emerald-100/70 text-emerald-900 text-xs">
                          {row.semesterTotalH}
                        </td>
                        <td className="p-1.5 text-center font-bold border border-slate-250 bg-blue-100/70 text-blue-900 text-xs">
                          {row.semesterTotalS}
                        </td>
                        <td className="p-1.5 text-center font-bold border border-slate-250 bg-amber-100/70 text-amber-900 text-xs">
                          {row.semesterTotalI}
                        </td>
                        <td className="p-1.5 text-center font-bold border border-slate-250 bg-rose-100/70 text-rose-900 text-xs">
                          {row.semesterTotalA}
                        </td>

                        {/* Total JP */}
                        <td className="p-1.5 text-center font-black border border-slate-250 text-emerald-800">
                          {row.semesterTotalJp} JP
                        </td>

                        {/* Attendance % */}
                        <td className="p-1.5 text-center font-black border border-slate-250 text-slate-800">
                          {row.semesterAttendancePercent}%
                        </td>

                        {/* Uniform % */}
                        <td className="p-1.5 text-center font-bold border border-slate-250 text-blue-800">
                          {row.semesterUniformPercent}%
                        </td>

                        {/* Predicate */}
                        <td className="p-1.5 text-center border border-slate-250">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${predBg}`}>
                            {row.predicate}
                          </span>
                        </td>

                        {/* Editable Rapor Catatan */}
                        <td className="p-1.5 border border-slate-250 text-xs">
                          <input
                            type="text"
                            value={row.catatanRaporPjok}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSemesterStudentNotes(prev => ({ ...prev, [row.studentId]: val }));
                            }}
                            className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white text-slate-700 text-[11px] p-1 focus:outline-none"
                            placeholder="Catatan kebugaran rapor..."
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Footer Totals */}
                <tfoot>
                  <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-900 text-slate-800 text-center">
                    <td colSpan={3} className="p-2 text-right border border-slate-300">
                      TOTAL HADIR PER MINGGU:
                    </td>
                    {semesterMonths.map(m => {
                      const mTotalH = semesterRows.reduce((acc, r) => acc + (r.monthlyData[m.monthNum]?.hadir || 0), 0);
                      return (
                        <React.Fragment key={m.monthNum}>
                          {m.weeks.map(w => {
                            const countH = semesterRows.filter(r => (r.weeklyStatus?.[m.monthNum]?.[w.weekNum] || 'H') === 'H').length;
                            return (
                              <td 
                                key={w.weekNum} 
                                className="p-1 border border-slate-300 bg-emerald-50 font-black text-emerald-800 text-center text-[10px]"
                                title={`Total Hadir Bulan ${m.monthName} Minggu ke-${w.weekNum}: ${countH} Siswa`}
                              >
                                {countH}
                              </td>
                            );
                          })}
                          {showMonthlyTotals && (
                            <td className="p-1 border border-slate-300 bg-emerald-100 font-black text-emerald-900 text-center text-[11px]">
                              {mTotalH}
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
                    <td className="p-2 border border-slate-300 bg-emerald-200 text-emerald-900 font-black">
                      {semesterRows.reduce((acc, r) => acc + r.semesterTotalH, 0)}
                    </td>
                    <td className="p-2 border border-slate-300 bg-blue-200 text-blue-900 font-black">
                      {semesterRows.reduce((acc, r) => acc + r.semesterTotalS, 0)}
                    </td>
                    <td className="p-2 border border-slate-300 bg-amber-200 text-amber-900 font-black">
                      {semesterRows.reduce((acc, r) => acc + r.semesterTotalI, 0)}
                    </td>
                    <td className="p-2 border border-slate-300 bg-rose-200 text-rose-900 font-black">
                      {semesterRows.reduce((acc, r) => acc + r.semesterTotalA, 0)}
                    </td>
                    <td className="p-2 border border-slate-300 font-black text-emerald-800">
                      {semesterClassStats.totalSemesterJp} JP
                    </td>
                    <td className="p-2 border border-slate-300 font-black text-emerald-800">
                      {semesterClassStats.avgAttendancePercent}%
                    </td>
                    <td className="p-2 border border-slate-300 font-bold text-blue-800">
                      {semesterClassStats.avgUniformPercent}%
                    </td>
                    <td colSpan={2} className="border border-slate-300"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* KETERANGAN SKALA PREDIKAT & LEMBAR TTD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-250 space-y-1.5">
                <span className="font-extrabold text-slate-700 block">Kriteria Predikat Partisipasi PJOK Semester:</span>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                  <div><strong className="text-emerald-700">Sangat Baik</strong>: &ge; 95% Kehadiran Lapangan</div>
                  <div><strong className="text-sky-700">Baik</strong>: 80% - 94% Kehadiran Lapangan</div>
                  <div><strong className="text-amber-700">Cukup</strong>: 70% - 79% Kehadiran Lapangan</div>
                  <div><strong className="text-rose-700">Perlu Bimbingan</strong>: &lt; 70% Kehadiran Lapangan</div>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-extrabold text-emerald-800 block">Evaluasi Ketercapaian Kurikulum PJOK:</span>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Rombel {activeClass.name} telah menuntaskan pembelajaran PJOK semester {selectedSemester} dengan rata-rata kehadiran <strong>{semesterClassStats.avgAttendancePercent}%</strong> dan kepatuhan seragam <strong>{semesterClassStats.avgUniformPercent}%</strong>. Sebanyak <strong>{semesterClassStats.perfectStudentsCount}</strong> siswa berhasil mencatat rekor kehadiran sempurna selama 6 bulan.
                </p>
              </div>
            </div>

            {/* LEMBAR PENGESAHAN TANDA TANGAN */}
            <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
              <div className="space-y-1">
                <p className="font-medium text-slate-600">Mengetahui,</p>
                <p className="font-extrabold text-slate-900 uppercase">Kepala Sekolah {namaSekolah}</p>
                <div className="h-16"></div>
                <p className="font-black underline text-slate-900">{namaKepalaSekolah}</p>
                <p className="text-slate-500 font-mono text-[11px]">NIP. {nipKepalaSekolah}</p>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-slate-600">{kota}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-extrabold text-slate-900 uppercase">Guru Mata Pelajaran PJOK</p>
                <div className="h-16"></div>
                <p className="font-black underline text-slate-900">{namaGuru}</p>
                <p className="text-slate-500 font-mono text-[11px]">NIP. {nipGuru}</p>
              </div>
            </div>
          </div>

          {/* MODAL PROMPT AI (GEMINI / CHATGPT) - SEMESTER */}
          <AiPromptModal
            isOpen={showPromptModal}
            onClose={() => setShowPromptModal(false)}
            title="Prompt AI - Rekapitulasi Presensi 1 Semester PJOK"
            subtitle={`Rombel ${activeClass.name} • Semester ${selectedSemester === 1 ? '1 (Ganjil)' : '2 (Genap)'} T.A. ${tahunAjaran}`}
            tabs={getRekapSemesterPjokPrompts(
              activeClass.name,
              selectedSemester,
              tahunAjaran,
              semesterClassStats.avgAttendancePercent,
              semesterClassStats.totalSemesterJp
            )}
            defaultActiveTab="analisis_semester_pjok"
            jsonData={{
              kelas: activeClass.name,
              grade: activeClass.grade,
              semester: selectedSemester,
              tahunAjaran,
              sekolah: namaSekolah,
              guru: namaGuru,
              nipGuru,
              kepsek: namaKepalaSekolah,
              nipKepsek: nipKepalaSekolah,
              jpPerPertemuan,
              semesterMonths,
              semesterClassStats,
              studentRows: semesterRows
            }}
            jsonFilename={`Rekap_Semester_PJOK_${activeClass.name.replace(/\s+/g, '_')}_Sem_${selectedSemester}_${tahunAjaran.replace(/\//g, '-')}.json`}
          />
        </div>
      )}

    </div>
  );
}
