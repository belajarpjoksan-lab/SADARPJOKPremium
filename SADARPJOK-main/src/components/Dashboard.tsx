import React, { useState } from 'react';
import { ClassData, JurnalMengajar, ModulAjar } from '../types';
import { 
  Users, 
  FileText, 
  Calendar, 
  Award, 
  Activity, 
  TrendingUp, 
  UserCheck, 
  BrainCircuit,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { downloadJsonFile } from '../lib/exportUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getKodeEtikKkoCetakPrompts } from '../utils/aiPromptGenerators';

interface DashboardProps {
  classes: ClassData[];
  journals: JurnalMengajar[];
  moduls: ModulAjar[];
  onTabChange: (tab: any) => void;
  setSelectedClassId: (id: string) => void;
}

export default function Dashboard({ 
  classes, 
  journals, 
  moduls, 
  onTabChange, 
  setSelectedClassId 
}: DashboardProps) {
  const [showPromptModal, setShowPromptModal] = useState(false);
  
  // Calculations
  const totalClasses = classes.length;
  const totalStudents = classes.reduce((acc, c) => acc + c.students.length, 0);
  const totalJournals = journals.length;
  const totalModuls = moduls.length;

  // Average Scores across all students
  let totalCognitive = 0;
  let totalPsychomotor = 0;
  let totalAffective = 0;
  let studentCount = 0;

  classes.forEach(c => {
    c.students.forEach(s => {
      totalCognitive += s.scores.cognitive;
      totalPsychomotor += s.scores.psychomotor;
      totalAffective += s.scores.affective;
      studentCount++;
    });
  });

  const avgCognitive = studentCount > 0 ? Math.round(totalCognitive / studentCount) : 0;
  const avgPsychomotor = studentCount > 0 ? Math.round(totalPsychomotor / studentCount) : 0;
  const avgAffective = studentCount > 0 ? Math.round(totalAffective / studentCount) : 0;

  // Calculate generic physical fitness level from Psychomotor & Affective
  const overallFitnessScore = Math.round((avgPsychomotor * 0.7) + (avgAffective * 0.3));

  // Attendance rate
  let totalAttendanceDays = 0;
  let presentDays = 0;
  classes.forEach(c => {
    c.students.forEach(s => {
      Object.values(s.attendance).forEach(status => {
        totalAttendanceDays++;
        if (status === 'H') {
          presentDays++;
        }
      });
    });
  });

  const attendanceRate = totalAttendanceDays > 0 
    ? Math.round((presentDays / totalAttendanceDays) * 100) 
    : 100;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 rounded-2xl shadow-md border border-emerald-500/20">
        <div className="relative z-10 max-w-2xl">
          <span className="bg-emerald-500/30 text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Premium Portal - Guru PJOK SD
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-3">
            Selamat datang di SADAR PJOK
          </h2>
          <p className="text-emerald-100/90 text-sm md:text-base mt-2">
            Kelola RPP Kurikulum Merdeka secara otomatis dengan AI, catat jurnal harian, rekap absensi taktis, dan pantau perkembangan motorik & kebugaran jasmani siswa secara premium.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <button 
              onClick={() => onTabChange('modul')}
              className="bg-white text-teal-800 hover:bg-emerald-50 transition-colors text-xs font-semibold px-4 py-2 rounded-lg shadow cursor-pointer"
            >
              Buat RPP AI Baru
            </button>
            <button 
              onClick={() => onTabChange('cp_to_tp')}
              className="bg-emerald-500/40 text-white border border-emerald-400/30 hover:bg-emerald-500/60 transition-colors text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              Formulasi CP ke TP
            </button>
            <button 
              onClick={() => onTabChange('rpm_pertemuan')}
              className="bg-amber-500/40 text-white border border-amber-400/30 hover:bg-amber-500/60 transition-colors text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              RPM 1 Pertemuan (2x40m)
            </button>
            <button 
              onClick={() => onTabChange('rpm_tp')}
              className="bg-teal-500/40 text-white border border-teal-400/30 hover:bg-teal-500/60 transition-colors text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              RPM Deep Learning 1 TP
            </button>
            <button 
              onClick={() => onTabChange('lkpd_gambar')}
              className="bg-amber-500/40 text-white border border-amber-400/30 hover:bg-amber-500/60 transition-colors text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              LKPD Menjadi Gambar
            </button>
            <button 
              onClick={() => onTabChange('jurnal_mapel')}
              className="bg-cyan-500/40 text-white border border-cyan-400/30 hover:bg-cyan-500/60 transition-colors text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              Jurnal 1 Mapel
            </button>
            <button 
              onClick={() => onTabChange('asat')}
              className="bg-indigo-500/40 text-white border border-indigo-400/30 hover:bg-indigo-500/60 transition-colors text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              Sumatif Akhir Tahun (ASAT)
            </button>
            <button 
              onClick={() => onTabChange('ujian_sekolah')}
              className="bg-purple-500/40 text-white border border-purple-400/30 hover:bg-purple-500/60 transition-colors text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              Ujian Sekolah (US/UM)
            </button>
            <button 
              onClick={() => onTabChange('penilaian')}
              className="bg-emerald-500/40 text-white border border-emerald-400/30 hover:bg-emerald-500/60 transition-colors text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              Input Nilai Fisik
            </button>
            <button 
              onClick={() => onTabChange('analisis_jam')}
              className="bg-cyan-600/40 text-white border border-cyan-400/30 hover:bg-cyan-600/60 transition-colors text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              Analisis Jam Mengajar
            </button>
            <div className="bg-white/10 backdrop-blur-xs p-1 rounded-xl border border-white/20">
              <ExportJsonPromptAiButtons
                variant="compact"
                onExportJson={() => {
                  const filename = `Dashboard_SADAR_PJOK_${new Date().toISOString().split('T')[0]}.json`;
                  downloadJsonFile(filename, {
                    statistikUtama: {
                      totalSiswa: totalStudents,
                      totalKelas: totalClasses,
                      totalModul: totalModuls,
                      totalJurnal: totalJournals,
                      rataRataKognitif: avgCognitive,
                      rataRataPsikomotorik: avgPsychomotor,
                      rataRataAfektif: avgAffective,
                      skorKebugaranTotal: overallFitnessScore
                    },
                    kelas: classes,
                    jurnalTerbaru: journals.slice(0, 5)
                  });
                }}
                onOpenPromptAi={() => setShowPromptModal(true)}
              />
            </div>
          </div>
        </div>
        {/* Background Decorative Abstract Shapes */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Activity className="w-48 h-48 text-white" />
        </div>
      </div>

      {/* Numerical Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider block">Total Siswa Binaan</span>
            <span className="text-2xl font-bold text-slate-800">{totalStudents}</span>
            <span className="text-[10px] text-slate-400 block">{totalClasses} Rombel Terdaftar</span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Modul Ajar */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider block">Modul Ajar RPP</span>
            <span className="text-2xl font-bold text-slate-800">{totalModuls}</span>
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
              Siap Cetak / Edit
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Jurnal */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider block">Jurnal Mengajar</span>
            <span className="text-2xl font-bold text-slate-800">{totalJournals}</span>
            <span className="text-[10px] text-slate-400 block">Tercatat Semester Ini</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Kehadiran */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider block">Rata-rata Presensi</span>
            <span className="text-2xl font-bold text-slate-800">{attendanceRate}%</span>
            <span className="text-[10px] text-emerald-600 font-medium block">Sangat Bagus</span>
          </div>
          <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Core Educational/Physical Diagnostics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Average Scores and Development Status */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Analisis Kinerja Motorik & Akademik PJOK</h3>
              <p className="text-xs text-slate-500">Rata-rata capaian kompetensi dasar dari seluruh rombongan belajar</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> +2.4% vs Bulan Lalu
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cognitive */}
            <div className="border border-slate-50 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Kognitif (Pengetahuan)</span>
                <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">Teori</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-800">{avgCognitive}</span>
                <span className="text-xs text-slate-400">/100</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${avgCognitive}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-500">Pemahaman taktis & pola kesehatan</p>
            </div>

            {/* Psychomotor */}
            <div className="border border-slate-50 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Psikomotor (Gerak Fisik)</span>
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Praktik</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-800">{avgPsychomotor}</span>
                <span className="text-xs text-slate-400">/100</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${avgPsychomotor}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-500">Keterampilan manipulatif & olahraga</p>
            </div>

            {/* Affective */}
            <div className="border border-slate-50 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Afektif (Sikap)</span>
                <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">Sportif</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-800">{avgAffective}</span>
                <span className="text-xs text-slate-400">/100</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${avgAffective}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-500">Kerjasama, sportivitas & karakter</p>
            </div>
          </div>

          {/* Visualizing Physical/Fitness Overall Index */}
          <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-500/10 rounded-full text-teal-600">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-teal-900">Indeks Kebugaran Jasmani Siswa</h4>
                <p className="text-xs text-teal-700">Skor gabungan dari aspek keterampilan psikomotorik dan karakter disiplin olahraga.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-lg border border-teal-100 shadow-sm shrink-0">
              <div className="text-center">
                <span className="text-[10px] font-medium uppercase text-slate-400 block">Indeks SADAR</span>
                <span className="text-xl font-bold text-teal-800">{overallFitnessScore} / 100</span>
              </div>
              <div className="text-xs font-semibold px-2 py-1 bg-teal-100 text-teal-800 rounded">
                Sangat Baik
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Fast Class Actions / Quick Navigation */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-800">Rombongan Belajar (Rombel)</h3>
          <p className="text-xs text-slate-500">Klik kelas untuk langsung mengelola nilai & mengabsen siswa hari ini.</p>
          
          <div className="space-y-3 pt-2">
            {classes.map(c => {
              // Calculate average score for class
              let classTotal = 0;
              c.students.forEach(s => {
                classTotal += (s.scores.cognitive + s.scores.psychomotor + s.scores.affective) / 3;
              });
              const classAvg = c.students.length > 0 ? Math.round(classTotal / c.students.length) : 0;

              return (
                <div 
                  key={c.id}
                  onClick={() => {
                    setSelectedClassId(c.id);
                    onTabChange('penilaian');
                  }}
                  className="group cursor-pointer p-4 rounded-xl border border-slate-50 hover:border-emerald-100 hover:bg-emerald-50/10 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                      {c.grade}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">{c.name}</h4>
                      <p className="text-xs text-slate-400">{c.students.length} Siswa Terdaftar</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Rata-rata Kelas</span>
                    <span className="text-sm font-bold text-slate-700">{classAvg}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-50 text-center">
            <button 
              onClick={() => onTabChange('rubrik')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
            >
              Lihat Rubrik Penilaian Fisik <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Jurnal Mengajar Entries */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Catatan Jurnal Mengajar Terbaru</h3>
            <p className="text-xs text-slate-500">Laporan peristiwa penting, sportivitas, atau penanganan cedera di lapangan</p>
          </div>
          <button 
            onClick={() => onTabChange('jurnal')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
          >
            Lihat Semua Jurnal <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {journals.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            Belum ada catatan jurnal mengajar harian.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {journals.slice(0, 2).map(j => (
              <div key={j.id} className="border border-slate-50 rounded-xl p-4 bg-slate-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {j.className}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {j.date}
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-800">Materi: {j.materi}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    <strong>Catatan:</strong> {j.catatanKejadian}
                  </p>
                </div>
                <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-100">
                  <strong className="text-emerald-700">Tindak Lanjut:</strong> {j.tindakLanjut}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Konsultan & Perencana SADAR PJOK"
        subtitle="Analisis Komprehensif Administrasi & Kebugaran Jasmani Siswa"
        tabs={getKodeEtikKkoCetakPrompts("Dashboard dan Manajemen Administrasi Pembelajaran PJOK")}
        defaultActiveTab="prompt_menu"
        jsonData={{
          statistikUtama: {
            totalSiswa: totalStudents,
            totalKelas: totalClasses,
            totalModul: totalModuls,
            totalJurnal: totalJournals,
            rataRataKognitif: avgCognitive,
            rataRataPsikomotorik: avgPsychomotor,
            rataRataAfektif: avgAffective,
            skorKebugaranTotal: overallFitnessScore
          },
          kelas: classes,
          jurnalTerbaru: journals.slice(0, 5)
        }}
        jsonFilename={`Dashboard_SADAR_PJOK_${new Date().toISOString().split('T')[0]}.json`}
      />
    </div>
  );
}
