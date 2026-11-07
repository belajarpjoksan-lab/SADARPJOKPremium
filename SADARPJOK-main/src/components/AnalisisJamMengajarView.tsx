import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  Plus, 
  Trash2, 
  Briefcase, 
  Activity, 
  ShieldCheck, 
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  TrendingUp,
  Award,
  HeartPulse,
  Printer,
  Download
} from 'lucide-react';
import { downloadJsonFile, downloadDocFile } from '../lib/exportUtils';
import { printHtmlDocument, downloadHtmlAsPdf } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';

interface ScheduleEntry {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  className: string;
  jp: number; // Jam Pelajaran (1 JP = 40 Menit)
  notes?: string;
}

interface ExtraDuty {
  id: string;
  name: string;
  equivalentJp: number;
  checked: boolean;
  category: string;
}

interface AiAnalysisResult {
  summaryStatus: string;
  certificationStatus: 'MEMENUHI' | 'BELUM MEMENUHI' | 'OVERLOAD';
  certificationExplanation: string;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  weeklyDistributionChartData: { day: string; hours: number; intensity: 'Ringan' | 'Sedang' | 'Tinggi' }[];
}

export default function AnalisisJamMengajarView() {
  // 1. Basic Info State
  const [teacherName, setTeacherName] = useState('Budi Prasetyo, S.Pd.');
  const [schoolName, setSchoolName] = useState('SD Negeri Kalimantong');
  const [weeklyJpTarget, setWeeklyJpTarget] = useState(24);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // 2. Schedule Entries (Prefilled with realistic PJOK schedule for SD)
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([
    { id: '1', day: 'Senin', className: 'Kelas I-A', jp: 4, notes: 'PJOK Dasar & Motorik Kasar' },
    { id: '2', day: 'Senin', className: 'Kelas I-B', jp: 4, notes: 'PJOK Dasar & Motorik Kasar' },
    { id: '3', day: 'Selasa', className: 'Kelas II-A', jp: 4, notes: 'Aktivitas Kebugaran' },
    { id: '4', day: 'Selasa', className: 'Kelas II-B', jp: 4, notes: 'Aktivitas Kebugaran' },
    { id: '5', day: 'Rabu', className: 'Kelas III-A', jp: 4, notes: 'Atletik Dasar & Lempar-Tangkap' },
    { id: '6', day: 'Rabu', className: 'Kelas III-B', jp: 4, notes: 'Atletik Dasar & Lempar-Tangkap' },
    { id: '7', day: 'Kamis', className: 'Kelas IV-A', jp: 4, notes: 'Senam Lantai & Ketangkasan' },
    { id: '8', day: 'Jumat', className: 'Kelas V-A', jp: 4, notes: 'Permainan Bola Besar (Sepakbola)' },
  ]);

  // 3. Extra Duties (Equivalence weights in Indonesia - Permendikbud No 15 Tahun 2018)
  const [extraDuties, setExtraDuties] = useState<ExtraDuty[]>([
    { id: '1', name: 'Pembina Pramuka', equivalentJp: 2, checked: true, category: 'Ko-Kurikuler' },
    { id: '2', name: 'Koordinator P5 (Projek Penguatan Profil Pelajar Pancasila)', equivalentJp: 2, checked: false, category: 'Ko-Kurikuler' },
    { id: '3', name: 'Pembina Ekstrakurikuler Olahraga / Sports Club', equivalentJp: 2, checked: true, category: 'Ekstrakurikuler' },
    { id: '4', name: 'Wali Kelas', equivalentJp: 2, checked: false, category: 'Administratif' },
    { id: '5', name: 'Pembina UKS (Usaha Kesehatan Sekolah)', equivalentJp: 2, checked: false, category: 'Kesehatan' },
    { id: '6', name: 'Kepala Perpustakaan / Lab Sekolah', equivalentJp: 12, checked: false, category: 'Tugas Tambahan Besar' },
    { id: '7', name: 'Tim Pencegahan & Penanganan Kekerasan (TPPK)', equivalentJp: 2, checked: false, category: 'Satgas Sekolah' },
  ]);

  // 4. Input states for adding new schedule
  const [newDay, setNewDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Senin');
  const [newClassName, setNewClassName] = useState('Kelas VI-A');
  const [newJp, setNewJp] = useState(4);
  const [newNotes, setNewNotes] = useState('');

  // 5. UI control states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);
  const [expandedSection, setExpandedSection] = useState<'schedule' | 'duties' | 'chart'>('schedule');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper calculation
  const totalScheduleJp = schedule.reduce((sum, item) => sum + item.jp, 0);
  const totalExtraDutyJp = extraDuties.filter(d => d.checked).reduce((sum, d) => sum + d.equivalentJp, 0);
  const grandTotalJp = totalScheduleJp + totalExtraDutyJp;

  // Physical load calculation (specifically designed for physical field activity of PJOK)
  // PJOK teacher physical intensity: more sessions per day or teaching under midday sun (JP 5-8) increases load
  const calculatePhysicalIntensity = () => {
    const daysWithSchedules = new Set(schedule.map(s => s.day)).size;
    if (daysWithSchedules === 0) return { score: 0, text: 'Nol Beban', color: 'text-slate-400', bg: 'bg-slate-100' };
    
    // Base physical load: total direct JP taught
    let score = totalScheduleJp * 2.5;
    
    // Add penalty for dense days (teaching > 4 JP per day)
    const dayCounts: Record<string, number> = {};
    schedule.forEach(s => {
      dayCounts[s.day] = (dayCounts[s.day] || 0) + s.jp;
    });
    
    Object.values(dayCounts).forEach(jp => {
      if (jp > 6) score += 15; // Extremely dense physical day (e.g. 8 JP of sports)
      else if (jp > 4) score += 5;
    });

    if (score > 80) return { score: Math.min(score, 100), text: 'Ekstrem (Risiko Burnout Tinggi)', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
    if (score > 55) return { score, text: 'Tinggi (Butuh Recovery Cukup)', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
    if (score > 30) return { score, text: 'Ideal (Seimbang)', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    return { score, text: 'Ringan (Kurang Optimal)', color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' };
  };

  const intensityMetric = calculatePhysicalIntensity();

  // Handle schedule modifiers
  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newEntry: ScheduleEntry = {
      id: Date.now().toString(),
      day: newDay,
      className: newClassName,
      jp: Number(newJp),
      notes: newNotes
    };

    setSchedule(prev => [...prev, newEntry]);
    setNewNotes('');
    showFeedback('success', `Jadwal mengajar ${newClassName} berhasil ditambahkan!`);
  };

  const handleDeleteSchedule = (id: string) => {
    const item = schedule.find(s => s.id === id);
    setSchedule(prev => prev.filter(s => s.id !== id));
    if (item) {
      showFeedback('success', `Jadwal ${item.className} dihapus.`);
    }
  };

  const toggleExtraDuty = (id: string) => {
    setExtraDuties(prev => prev.map(d => d.id === id ? { ...d, checked: !d.checked } : d));
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // 6. Call Server API for AI analysis (using the endpoint we added in server.ts)
  const handleAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiResult(null);
    try {
      const response = await fetch('/api/analyze-workload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherName,
          schoolName,
          weeklyJpTarget,
          schedule: schedule.map(s => ({ day: s.day, class: s.className, jp: s.jp, notes: s.notes })),
          extraDuties: extraDuties.filter(d => d.checked).map(d => `${d.name} (${d.equivalentJp} JP)`),
          notes: `Total JP mengajar mandiri: ${totalScheduleJp} JP. Total JP Tugas Tambahan: ${totalExtraDutyJp} JP. Total seluruhnya: ${grandTotalJp} JP.`
        })
      });

      if (!response.ok) {
        throw new Error('Gagal berkomunikasi dengan server analisis.');
      }

      const data = await response.json();
      setAiResult(data);
      showFeedback('success', 'Analisis AI Gemini berhasil disusun!');
    } catch (error: any) {
      console.error(error);
      showFeedback('error', error.message || 'Koneksi bermasalah. Pastikan API key terpasang.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Compile Chart Data dynamically
  const daysOfWeek: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu')[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const chartData = daysOfWeek.map(day => {
    const dailySchedule = schedule.filter(s => s.day === day);
    const hours = dailySchedule.reduce((sum, s) => sum + s.jp, 0);
    return {
      name: day,
      'Jam Pelajaran (JP)': hours,
      intensity: hours > 6 ? 3 : hours > 4 ? 2 : hours > 0 ? 1 : 0
    };
  });

  return (
    <div className="space-y-8 animate-fade-in" id="analisis-jam-container">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 blur-3xl w-96 h-96 bg-white rounded-full"></div>
        <div className="absolute left-1/3 bottom-0 opacity-10 w-64 h-64 bg-teal-300 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            <Clock className="w-3.5 h-3.5 text-teal-200 animate-pulse" />
            Modul Analisis Jam Kerja
          </div>
          <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight">
            Analisis Jam Mengajar &amp; Beban Kerja Guru PJOK
          </h2>
          <p className="text-emerald-100 text-xs md:text-sm max-w-2xl font-medium leading-relaxed">
            Pantau pemenuhan syarat minimal 24 JP untuk Tunjangan Profesi Guru (TPG), kalkulasi ekuivalensi tugas tambahan Kemendikbudristek, serta ukur indeks kelelahan fisik di lapangan secara real-time.
          </p>
        </div>

        <div className="relative z-10 shrink-0 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>Analisis Jam Mengajar PJOK F4</title>
<style>
  @page { size: 215mm 330mm; margin: 15mm 18mm; }
  body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; line-height: 1.4; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
  th, td { border: 1px solid #000; padding: 6pt 8pt; vertical-align: top; }
  th { background-color: #ecfdf5; font-weight: bold; text-align: center; }
</style></head>
<body>
  <div data-f4-kop="true" style="text-align:center; border-bottom:3px double #000; padding-bottom:8pt; margin-bottom:12pt;">
    <h2 style="margin:0; font-size:14pt; text-transform:uppercase;">LAPORAN ANALISIS JAM MENGAJAR &amp; BEBAN KERJA GURU PJOK</h2>
    <p style="margin:3pt 0 0 0; font-size:11pt; font-weight:bold;">${schoolName} — Guru Pengampu: ${teacherName}</p>
  </div>
  <div data-f4-section="Bagian 1: Ringkasan Beban Kerja & Jadwal Tatap Muka Mingguan">
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">I. RINGKASAN PEMENUHAN BEBAN KERJA MINGGUAN (SYARAT TPG)</h3>
    <table>
      <thead><tr><th>Komponen Beban Kerja</th><th>Jumlah JP / Pekan</th><th>Status Kelayakan</th></tr></thead>
      <tbody>
        <tr><td>Jam Mengajar Tatap Muka Mandiri</td><td style="text-align:center; font-weight:bold;">${totalScheduleJp} JP</td><td rowspan="3" style="text-align:center; vertical-align:middle; font-weight:bold;">${grandTotalJp >= weeklyJpTarget ? 'MEMENUHI SYARAT (≥ ' + weeklyJpTarget + ' JP)' : 'KURang ' + (weeklyJpTarget - grandTotalJp) + ' JP'}</td></tr>
        <tr><td>Ekuivalensi Tugas Tambahan Resmi</td><td style="text-align:center; font-weight:bold;">${totalExtraDutyJp} JP</td></tr>
        <tr style="background:#f0fdf4;"><td style="font-weight:bold;">TOTAL AKUMULASI BEBAN KERJA</td><td style="text-align:center; font-weight:bold;">${grandTotalJp} JP</td></tr>
      </tbody>
    </table>
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">II. JADWAL MENGAJAR TATAP MUKA PER HARI</h3>
    <table>
      <thead><tr><th style="width:35px;">No</th><th style="width:90px;">Hari</th><th>Kelas / Rombel</th><th style="width:80px;">Alokasi (JP)</th><th>Catatan Materi / Lapangan</th></tr></thead>
      <tbody>
        ${schedule.map((s, idx) => `<tr><td style="text-align:center;">${idx + 1}</td><td style="text-align:center; font-weight:bold;">${s.day}</td><td>${s.className}</td><td style="text-align:center; font-weight:bold;">${s.jp} JP</td><td>${s.notes || '-'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div data-f4-section="Bagian 2: Ekuivalensi Tugas Tambahan & Rekomendasi Ergonomi">
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">III. RINCIAN TUGAS TAMBAHAN GURU</h3>
    <table>
      <thead><tr><th style="width:35px;">No</th><th>Nama Tugas Tambahan</th><th style="width:120px;">Ekuivalensi JP</th><th style="width:120px;">Status Aktif</th></tr></thead>
      <tbody>
        ${extraDuties.map((d, idx) => `<tr><td style="text-align:center;">${idx + 1}</td><td>${d.name}</td><td style="text-align:center; font-weight:bold;">${d.equivalentJp} JP</td><td style="text-align:center;">${d.checked ? 'Aktif Diampu' : '-'}</td></tr>`).join('')}
      </tbody>
    </table>
    ${aiResult ? `
      <h3 style="font-size:11.5pt; margin-bottom:6pt;">IV. REKOMENDASI ANALISIS BEBAN KERJA &amp; ERGONOMI</h3>
      <p><strong>Status Beban Kerja:</strong> ${aiResult.workloadStatus} (${aiResult.fatigueRiskLevel})</p>
      <p>${aiResult.summaryAnalysis}</p>
      <ul>${(aiResult.ergonomicRecommendations || []).map(r => `<li>${r}</li>`).join('')}</ul>
    ` : ''}
  </div>
</body></html>`;
              printHtmlDocument(html, `Analisis Jam Mengajar F4 - ${teacherName}`, 'portrait');
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
<head><meta charset="utf-8"><title>Analisis Jam Mengajar PJOK F4</title>
<style>
  @page { size: 215mm 330mm; margin: 15mm 18mm; }
  body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; line-height: 1.4; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
  th, td { border: 1px solid #000; padding: 6pt 8pt; vertical-align: top; }
  th { background-color: #ecfdf5; font-weight: bold; text-align: center; }
</style></head>
<body>
  <div data-f4-kop="true" style="text-align:center; border-bottom:3px double #000; padding-bottom:8pt; margin-bottom:12pt;">
    <h2 style="margin:0; font-size:14pt; text-transform:uppercase;">LAPORAN ANALISIS JAM MENGAJAR &amp; BEBAN KERJA GURU PJOK</h2>
    <p style="margin:3pt 0 0 0; font-size:11pt; font-weight:bold;">${schoolName} — Guru Pengampu: ${teacherName}</p>
  </div>
  <div data-f4-section="Bagian 1: Ringkasan Beban Kerja & Jadwal Tatap Muka Mingguan">
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">I. RINGKASAN PEMENUHAN BEBAN KERJA MINGGUAN (SYARAT TPG)</h3>
    <table>
      <thead><tr><th>Komponen Beban Kerja</th><th>Jumlah JP / Pekan</th><th>Status Kelayakan</th></tr></thead>
      <tbody>
        <tr><td>Jam Mengajar Tatap Muka Mandiri</td><td style="text-align:center; font-weight:bold;">${totalScheduleJp} JP</td><td rowspan="3" style="text-align:center; vertical-align:middle; font-weight:bold;">${grandTotalJp >= weeklyJpTarget ? 'MEMENUHI SYARAT (≥ ' + weeklyJpTarget + ' JP)' : 'KURANG ' + (weeklyJpTarget - grandTotalJp) + ' JP'}</td></tr>
        <tr><td>Ekuivalensi Tugas Tambahan Resmi</td><td style="text-align:center; font-weight:bold;">${totalExtraDutyJp} JP</td></tr>
        <tr style="background:#f0fdf4;"><td style="font-weight:bold;">TOTAL AKUMULASI BEBAN KERJA</td><td style="text-align:center; font-weight:bold;">${grandTotalJp} JP</td></tr>
      </tbody>
    </table>
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">II. JADWAL MENGAJAR TATAP MUKA PER HARI</h3>
    <table>
      <thead><tr><th style="width:35px;">No</th><th style="width:90px;">Hari</th><th>Kelas / Rombel</th><th style="width:80px;">Alokasi (JP)</th><th>Catatan Materi / Lapangan</th></tr></thead>
      <tbody>
        ${schedule.map((s, idx) => `<tr><td style="text-align:center;">${idx + 1}</td><td style="text-align:center; font-weight:bold;">${s.day}</td><td>${s.className}</td><td style="text-align:center; font-weight:bold;">${s.jp} JP</td><td>${s.notes || '-'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div data-f4-section="Bagian 2: Ekuivalensi Tugas Tambahan & Rekomendasi Ergonomi">
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">III. RINCIAN TUGAS TAMBAHAN GURU</h3>
    <table>
      <thead><tr><th style="width:35px;">No</th><th>Nama Tugas Tambahan</th><th style="width:120px;">Ekuivalensi JP</th><th style="width:120px;">Status Aktif</th></tr></thead>
      <tbody>
        ${extraDuties.map((d, idx) => `<tr><td style="text-align:center;">${idx + 1}</td><td>${d.name}</td><td style="text-align:center; font-weight:bold;">${d.equivalentJp} JP</td><td style="text-align:center;">${d.checked ? 'Aktif Diampu' : '-'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</body></html>`;
              downloadHtmlAsPdf(html, `Analisis_Jam_Mengajar_F4_${teacherName.replace(/\s+/g, '_')}.pdf`, 'portrait');
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
<head><meta charset="utf-8"><title>Analisis Jam Mengajar PJOK F4</title>
<style>
  @page { size: 215mm 330mm; margin: 15mm 18mm; }
  body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; line-height: 1.4; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
  th, td { border: 1px solid #000; padding: 6pt 8pt; vertical-align: top; }
  th { background-color: #ecfdf5; font-weight: bold; text-align: center; }
</style></head>
<body>
  <div data-f4-kop="true" style="text-align:center; border-bottom:3px double #000; padding-bottom:8pt; margin-bottom:12pt;">
    <h2 style="margin:0; font-size:14pt; text-transform:uppercase;">LAPORAN ANALISIS JAM MENGAJAR &amp; BEBAN KERJA GURU PJOK</h2>
    <p style="margin:3pt 0 0 0; font-size:11pt; font-weight:bold;">${schoolName} — Guru Pengampu: ${teacherName}</p>
  </div>
  <div data-f4-section="Bagian 1: Ringkasan Beban Kerja & Jadwal Tatap Muka Mingguan">
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">I. RINGKASAN PEMENUHAN BEBAN KERJA MINGGUAN (SYARAT TPG)</h3>
    <table>
      <thead><tr><th>Komponen Beban Kerja</th><th>Jumlah JP / Pekan</th><th>Status Kelayakan</th></tr></thead>
      <tbody>
        <tr><td>Jam Mengajar Tatap Muka Mandiri</td><td style="text-align:center; font-weight:bold;">${totalScheduleJp} JP</td><td rowspan="3" style="text-align:center; vertical-align:middle; font-weight:bold;">${grandTotalJp >= weeklyJpTarget ? 'MEMENUHI SYARAT (≥ ' + weeklyJpTarget + ' JP)' : 'KURANG ' + (weeklyJpTarget - grandTotalJp) + ' JP'}</td></tr>
        <tr><td>Ekuivalensi Tugas Tambahan Resmi</td><td style="text-align:center; font-weight:bold;">${totalExtraDutyJp} JP</td></tr>
        <tr style="background:#f0fdf4;"><td style="font-weight:bold;">TOTAL AKUMULASI BEBAN KERJA</td><td style="text-align:center; font-weight:bold;">${grandTotalJp} JP</td></tr>
      </tbody>
    </table>
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">II. JADWAL MENGAJAR TATAP MUKA PER HARI</h3>
    <table>
      <thead><tr><th style="width:35px;">No</th><th style="width:90px;">Hari</th><th>Kelas / Rombel</th><th style="width:80px;">Alokasi (JP)</th><th>Catatan Materi / Lapangan</th></tr></thead>
      <tbody>
        ${schedule.map((s, idx) => `<tr><td style="text-align:center;">${idx + 1}</td><td style="text-align:center; font-weight:bold;">${s.day}</td><td>${s.className}</td><td style="text-align:center; font-weight:bold;">${s.jp} JP</td><td>${s.notes || '-'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div data-f4-section="Bagian 2: Ekuivalensi Tugas Tambahan & Rekomendasi Ergonomi">
    <h3 style="font-size:11.5pt; margin-bottom:6pt;">III. RINCIAN TUGAS TAMBAHAN GURU</h3>
    <table>
      <thead><tr><th style="width:35px;">No</th><th>Nama Tugas Tambahan</th><th style="width:120px;">Ekuivalensi JP</th><th style="width:120px;">Status Aktif</th></tr></thead>
      <tbody>
        ${extraDuties.map((d, idx) => `<tr><td style="text-align:center;">${idx + 1}</td><td>${d.name}</td><td style="text-align:center; font-weight:bold;">${d.equivalentJp} JP</td><td style="text-align:center;">${d.checked ? 'Aktif Diampu' : '-'}</td></tr>`).join('')}
      </tbody>
    </table>
    ${aiResult ? `
      <h3 style="font-size:11.5pt; margin-bottom:6pt;">IV. REKOMENDASI ANALISIS BEBAN KERJA &amp; ERGONOMI</h3>
      <p><strong>Status Beban Kerja:</strong> ${aiResult.workloadStatus} (${aiResult.fatigueRiskLevel})</p>
      <p>${aiResult.summaryAnalysis}</p>
      <ul>${(aiResult.ergonomicRecommendations || []).map(r => `<li>${r}</li>`).join('')}</ul>
    ` : ''}
  </div>
</body></html>`;
              downloadDocFile(`Analisis_Jam_Mengajar_F4_${teacherName.replace(/\s+/g, '_')}.doc`, html, 'portrait');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Unduh Word (F4)</span>
          </button>
          <ExportJsonPromptAiButtons
            onExportJson={() => {
              downloadJsonFile(`Analisis_Jam_Mengajar_${teacherName.replace(/\s+/g, '_')}`, {
                teacherName,
                schoolName,
                weeklyJpTarget,
                grandTotalJp,
                tatapMukaJp: totalScheduleJp,
                extraDutyJp: totalExtraDutyJp,
                schedule,
                extraDuties,
                aiAnalysisResult: aiResult,
                tanggalEkspor: new Date().toISOString()
              });
            }}
            onOpenPromptAi={() => setShowPromptModal(true)}
          />
        </div>
      </div>

      {/* Real-time Feedback Toast */}
      {feedbackMsg && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-bounce ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Top Main Cards: Overview KPI Metric Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Metric 1: Total JP */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-3xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Akumulasi Jam</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-2 block">
              {grandTotalJp} <span className="text-sm font-semibold text-slate-500">JP / Pekan</span>
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">{totalScheduleJp} JP</span> mengajar + <span className="font-semibold text-teal-600">{totalExtraDutyJp} JP</span> tugas tambahan
          </div>
        </div>

        {/* Metric 2: Kelayakan Sertifikasi */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-teal-300 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-teal-50 rounded-bl-3xl flex items-center justify-center text-teal-500 group-hover:scale-110 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Syarat TPG Sertifikasi</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-2 block">
              {weeklyJpTarget} <span className="text-sm font-semibold text-slate-500">JP Minimum</span>
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2">
            {grandTotalJp >= weeklyJpTarget ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle className="w-3 h-3 text-emerald-600" /> Memenuhi Syarat
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-amber-600" /> Kurang {weeklyJpTarget - grandTotalJp} JP
              </span>
            )}
          </div>
        </div>

        {/* Metric 3: Indeks Kelelahan Fisik PJOK */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-orange-300 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-3xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Beban Fisik Lapangan</span>
            <span className={`text-sm font-extrabold mt-2 block ${intensityMetric.color}`}>
              {intensityMetric.text}
            </span>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  intensityMetric.score > 75 ? 'bg-rose-500' : intensityMetric.score > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${intensityMetric.score}%` }}
              ></div>
            </div>
            <p className="text-[9px] text-slate-400 leading-none">Skor Intensitas: {Math.round(intensityMetric.score)} / 100</p>
          </div>
        </div>

        {/* Metric 4: Estimasi Jam Lembur */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-cyan-300 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-50 rounded-bl-3xl flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Estimasi Kelebihan Jam</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-2 block">
              {grandTotalJp > 24 ? `+${grandTotalJp - 24}` : '0'} <span className="text-sm font-semibold text-slate-500">JP Lembur</span>
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-400 leading-relaxed">
            {grandTotalJp > 24 
              ? 'Jam mengajar di luar tugas pokok dapat diajukan insentif lembur/insentif sekolah.'
              : 'Belum memiliki kelebihan beban mengajar mandiri.'}
          </div>
        </div>

      </div>

      {/* Main Settings Input and Extra Duties Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column Left (7/12): Profile, Schedule list & Duty Picker */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Profil Guru & Instansi */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">Profil & Target Tugas Mengajar</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Nama Lengkap Guru</label>
                <input 
                  type="text" 
                  value={teacherName} 
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="Nama Guru"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Satuan Pendidikan</label>
                <input 
                  type="text" 
                  value={schoolName} 
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="Nama Sekolah"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Target Minimal Sertifikasi</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={weeklyJpTarget} 
                    onChange={(e) => setWeeklyJpTarget(Math.max(1, Number(e.target.value)))}
                    className="w-20 text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-slate-500 font-bold">JP / Pekan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Interactive Jp Schedule Builder */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Jadwal Mengajar Mandiri (Rombel)</h3>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                {schedule.length} Kelas Terdaftar
              </span>
            </div>

            {/* Form Tambah Jam */}
            <form onSubmit={handleAddSchedule} className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Hari</label>
                <select 
                  value={newDay} 
                  onChange={(e) => setNewDay(e.target.value as any)}
                  className="w-full text-xs font-semibold px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none"
                >
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                </select>
              </div>
              
              <div className="md:col-span-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rombel / Kelas</label>
                <input 
                  type="text" 
                  value={newClassName} 
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full text-xs font-semibold px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none"
                  placeholder="Contoh: Kelas VI-B"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Beban JP</label>
                <input 
                  type="number" 
                  value={newJp} 
                  onChange={(e) => setNewJp(Math.max(1, Number(e.target.value)))}
                  className="w-full text-xs font-semibold px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Topik / Catatan</label>
                <input 
                  type="text" 
                  value={newNotes} 
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-xs font-semibold px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none"
                  placeholder="Keterangan materi"
                />
              </div>

              <div className="md:col-span-2">
                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-md transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              </div>
            </form>

            {/* List Schedule */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2 pl-2">Hari</th>
                    <th className="py-2">Rombel / Kelas</th>
                    <th className="py-2 text-center">Beban JP</th>
                    <th className="py-2">Topik Keterangan</th>
                    <th className="py-2 text-right pr-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                        Belum ada jadwal mengajar terdaftar. Gunakan form di atas untuk menambahkan.
                      </td>
                    </tr>
                  ) : (
                    schedule.map(item => (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 pl-2 font-bold text-slate-700">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.day === 'Senin' ? 'bg-amber-100 text-amber-800' :
                            item.day === 'Selasa' ? 'bg-blue-100 text-blue-800' :
                            item.day === 'Rabu' ? 'bg-purple-100 text-purple-800' :
                            item.day === 'Kamis' ? 'bg-pink-100 text-pink-800' :
                            item.day === 'Jumat' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>{item.day}</span>
                        </td>
                        <td className="py-2.5 font-bold text-slate-800">{item.className}</td>
                        <td className="py-2.5 text-center font-bold text-emerald-600">{item.jp} JP</td>
                        <td className="py-2.5 text-slate-500 font-medium italic">{item.notes || '-'}</td>
                        <td className="py-2.5 text-right pr-2">
                          <button 
                            onClick={() => handleDeleteSchedule(item.id)}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded-md transition-all hover:bg-rose-50"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between items-center text-[11px] font-bold bg-emerald-50/30 p-2.5 rounded-lg border border-emerald-100 text-emerald-800">
              <span>Subtotal Mengajar Mandiri:</span>
              <span>{totalScheduleJp} JP / Pekan</span>
            </div>
          </div>

          {/* Section 3: Extra Duties / Tugas Tambahan Equivalent */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-sm">Tugas Tambahan & Ekuivalensi JP</h3>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-teal-50 px-2 py-0.5 rounded-md">
                Ekuivalensi: +{totalExtraDutyJp} JP
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Berdasarkan Permendikbudristek RI, beberapa tugas tambahan di sekolah berhak diakumulasikan secara resmi ke dalam total Jam Kerja Mengajar guru untuk pemenuhan sertifikasi.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {extraDuties.map(duty => (
                <button
                  key={duty.id}
                  onClick={() => toggleExtraDuty(duty.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    duty.checked 
                      ? 'bg-teal-50/50 border-teal-300 text-teal-900 shadow-xs font-semibold' 
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2 max-w-[80%]">
                    <input 
                      type="checkbox" 
                      checked={duty.checked} 
                      onChange={() => {}} // Controlled by button onClick
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <p className="text-xs font-bold leading-tight">{duty.name}</p>
                      <span className="text-[9px] text-slate-400 block font-medium mt-0.5">{duty.category}</span>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    duty.checked ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    +{duty.equivalentJp} JP
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Column Right (5/12): Interactive Visual Chart & AI Analysis Counselor */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 1: Weekly JP Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">Visualisasi Distribusi JP Harian</h3>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }} 
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  />
                  <ReferenceLine y={weeklyJpTarget / 5} stroke="#cbd5e1" strokeDasharray="3 3" />
                  <Bar dataKey="Jam Pelajaran (JP)" radius={[4, 4, 0, 0]} barSize={24}>
                    {chartData.map((entry, index) => {
                      const hours = entry['Jam Pelajaran (JP)'];
                      let fill = '#10b981'; // Emerald (seimbang)
                      if (hours > 6) fill = '#ef4444'; // Red (overload)
                      else if (hours > 4) fill = '#f59e0b'; // Amber (tinggi)
                      else if (hours === 0) fill = '#cbd5e1'; // Grey (kosong)
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-500 pt-1">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Ideal (&le; 4 JP)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Padat (5-6 JP)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Ekstrem (&gt; 6 JP)</div>
            </div>
          </div>

          {/* Section 2: AI Workload Advisor / Counselor */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-600/5 to-transparent rounded-bl-full pointer-events-none"></div>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Konsultasi Beban Kerja AI</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Gemini 3.5 Active
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Analisis struktur jadwal, tugas tambahan, dan kecukupan jam mengajar secara otomatis menurut regulasi Dapodik dan beban ketahanan tubuh Guru Olahraga.
            </p>

            <button
              onClick={handleAiAnalysis}
              disabled={isAiLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isAiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sedang Menganalisis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-100" />
                  <span>Kalkulasi Analisis AI Gemini</span>
                </>
              )}
            </button>

            {/* AI Results Render Container */}
            {aiResult && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in text-xs">
                
                {/* Result Status Header */}
                <div className={`p-4 rounded-xl border ${
                  aiResult.certificationStatus === 'MEMENUHI' 
                    ? 'bg-emerald-50/50 border-emerald-100' 
                    : aiResult.certificationStatus === 'OVERLOAD'
                    ? 'bg-amber-50/50 border-amber-100'
                    : 'bg-rose-50/50 border-rose-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {aiResult.certificationStatus === 'MEMENUHI' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className={`w-5 h-5 shrink-0 ${
                        aiResult.certificationStatus === 'OVERLOAD' ? 'text-amber-500' : 'text-rose-500'
                      }`} />
                    )}
                    <div>
                      <h4 className="font-extrabold text-slate-800 leading-none">
                        Status Kelayakan: <span className={
                          aiResult.certificationStatus === 'MEMENUHI' ? 'text-emerald-700' :
                          aiResult.certificationStatus === 'OVERLOAD' ? 'text-amber-700' : 'text-rose-700'
                        }>{aiResult.certificationStatus}</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-1">{aiResult.summaryStatus}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium mt-2">
                    {aiResult.certificationExplanation}
                  </p>
                </div>

                {/* Strengths (Kelebihan) */}
                {aiResult.strengths && aiResult.strengths.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 
                      Potensi Positif Jadwal:
                    </h5>
                    <ul className="space-y-1.5 pl-3 text-slate-600 font-medium list-disc">
                      {aiResult.strengths.map((s, idx) => (
                        <li key={idx} className="leading-relaxed">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Challenges (Tantangan) */}
                {aiResult.challenges && aiResult.challenges.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h5 className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 
                      Tantangan & Risiko Fisik:
                    </h5>
                    <ul className="space-y-1.5 pl-3 text-slate-600 font-medium list-disc">
                      {aiResult.challenges.map((c, idx) => (
                        <li key={idx} className="leading-relaxed">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations (Rekomendasi Taktis) */}
                {aiResult.recommendations && aiResult.recommendations.length > 0 && (
                  <div className="space-y-2 pt-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Rekomendasi Taktis & Karir:
                    </h5>
                    <ol className="space-y-2 pl-4 text-slate-600 font-medium list-decimal">
                      {aiResult.recommendations.map((r, idx) => (
                        <li key={idx} className="leading-relaxed">{r}</li>
                      ))}
                    </ol>
                  </div>
                )}

              </div>
            )}

            {/* Static tips fallback when AI not requested yet */}
            {!aiResult && !isAiLoading && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-500 space-y-2 text-[11px] leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>Petunjuk Kuantitas Jam Kerja:</span>
                </div>
                <p>
                  1. <strong>Beban Guru Olahraga</strong>: Idealnya tidak melebihi 28 JP per minggu karena tingginya tingkat kelelahan fisik di bawah terik matahari langsung.
                </p>
                <p>
                  2. <strong>Batas Maksimal</strong>: Maksimum jam mengajar dalam Dapodik adalah 40 JP per minggu. Kelebihan dari itu tidak diakui untuk tunjangan profesi tambahan.
                </p>
                <p>
                  3. <strong>Tugas Tambahan</strong>: Manfaatkan tugas pembina ekstrakurikuler atau pramuka untuk melengkapi jam mengajar jika jumlah rombongan belajar di sekolah kurang.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Analisis Jam Mengajar & Beban Kerja PJOK"
        subtitle={`Guru: ${teacherName} • ${schoolName} (${grandTotalJp} JP/pekan)`}
        tabs={[
          {
            id: 'beban_kerja',
            label: 'Analisis Beban Kerja & TPG 24 JP',
            prompt: `Anda adalah Konsultan Kepegawaian Pendidik & Ahli Ergonomi Pendidikan Jasmani.
Analisis beban mengajar guru PJOK berikut:
- Nama Guru: ${teacherName}
- Sekolah: ${schoolName}
- Target Minimal: ${weeklyJpTarget} JP/minggu
- Total Beban Mengajar: ${grandTotalJp} JP (Tatap Muka: ${totalScheduleJp} JP, Tugas Tambahan: ${totalExtraDutyJp} JP)

Jadwal Mingguan:
${schedule.map(s => `- ${s.day}: ${s.className} (${s.jp} JP) - ${s.notes || ''}`).join('\n')}

Tugas Tambahan:
${extraDuties.filter(e => e.checked).map(e => `- ${e.name} (${e.equivalentJp} JP Ekuivalensi)`).join('\n') || '- Tidak ada'}

INSTRUKSI:
1. Evaluasi apakah beban mengajar sudah memenuhi syarat minimal 24 JP TPG (Tunjangan Profesi Guru).
2. Analisis indeks kelelahan fisik guru di lapangan (apakah ada hari dengan beban > 6 JP berturut-turut di lapangan).
3. Berikan 3 rekomendasi taktis penjadwalan agar stamina guru tetap prima.`
          },
          {
            id: 'laporan_kepsek',
            label: 'Laporan Jam Mengajar ke Kepala Sekolah',
            prompt: `Buatlah naskah Surat Laporan Pembagian Tugas Mengajar & Beban Kerja Guru PJOK resmi kepada Kepala Sekolah:
- Nama: ${teacherName}
- Unit Kerja: ${schoolName}
- Akumulasi: ${grandTotalJp} JP / Pekan

Format naskah kedinasan yang memuat:
1. Dasar Hukum (Permendikbudristek No 15 Tahun 2018 tentang Pemenuhan Beban Kerja Guru).
2. Rincian Tatap Muka di Lapangan & Tugas Tambahan.
3. Permohonan pengesahan dan usulan sarana penunjang kesehatan guru.`
          }
        ]}
        jsonData={{
          teacherName,
          schoolName,
          weeklyJpTarget,
          grandTotalJp,
          schedule,
          extraDuties,
          tanggalEkspor: new Date().toISOString()
        }}
        jsonFilename={`Analisis_Beban_Jam_${teacherName.replace(/\s+/g, '_')}`}
      />
    </div>
  );
}
