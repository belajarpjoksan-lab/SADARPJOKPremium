import React from 'react';
import { Student } from '../types';
import { TpItem, TpDailyScores } from './nilaiHarianTypes';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface DetailNilaiHarianTpTableProps {
  activeTp: TpItem;
  students: Student[];
  dailyScores: { [studentId: string]: { [tpId: string]: TpDailyScores } };
  scores: { [studentId: string]: { [tpId: string]: number } };
  kktp: number;
  onUpdateDailyScore: (studentId: string, tpId: string, field: keyof TpDailyScores, val: number) => void;
  onUpdateTpFinalScore: (studentId: string, tpId: string, val: number) => void;
  onToggleGender?: (studentId: string) => void;
}

export default function DetailNilaiHarianTpTable({
  activeTp,
  students,
  dailyScores,
  scores,
  kktp,
  onUpdateDailyScore,
  onUpdateTpFinalScore,
  onToggleGender
}: DetailNilaiHarianTpTableProps) {
  // Calculate column averages
  const colAverages = React.useMemo(() => {
    let sumNh1 = 0, sumNh2 = 0, sumNh3 = 0, sumSumatif = 0, sumFinal = 0;
    let count = students.length || 1;

    students.forEach(s => {
      const d = dailyScores[s.id]?.[activeTp.id] || { nh1: 75, nh2: 75, nh3: 75, sumatifTp: 75 };
      const f = scores[s.id]?.[activeTp.id] ?? Math.round((d.nh1 + d.nh2 + d.nh3 + d.sumatifTp) / 4);
      sumNh1 += d.nh1;
      sumNh2 += d.nh2;
      sumNh3 += d.nh3;
      sumSumatif += d.sumatifTp;
      sumFinal += f;
    });

    return {
      nh1: Math.round(sumNh1 / count),
      nh2: Math.round(sumNh2 / count),
      nh3: Math.round(sumNh3 / count),
      sumatifTp: Math.round(sumSumatif / count),
      final: Math.round(sumFinal / count)
    };
  }, [students, dailyScores, scores, activeTp.id]);

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-900 text-white border-b border-slate-800 text-center font-extrabold">
            <th rowSpan={2} className="p-3 border-r border-slate-700 w-12">No</th>
            <th rowSpan={2} className="p-3 border-r border-slate-700 text-left min-w-[180px]">Nama Peserta Didik</th>
            <th rowSpan={2} className="p-3 border-r border-slate-700 w-12">L/P</th>
            <th colSpan={3} className="p-2 border-r border-slate-700 bg-teal-900 text-teal-100">
              Asesmen Formatif Harian ({activeTp.code})
            </th>
            <th rowSpan={2} className="p-2.5 border-r border-slate-700 bg-indigo-900 text-indigo-100 w-24">
              <div>Sumatif TP</div>
              <div className="text-[9px] font-normal text-indigo-300">Tes Lingkup Materi</div>
            </th>
            <th rowSpan={2} className="p-2.5 border-r border-slate-700 bg-emerald-900 text-emerald-100 w-24">
              <div>Nilai Akhir TP</div>
              <div className="text-[9px] font-normal text-emerald-300">Rerata Komponen</div>
            </th>
            <th rowSpan={2} className="p-2.5 text-center w-28 bg-slate-800">
              Ketuntasan (≥ {kktp})
            </th>
          </tr>
          <tr className="bg-slate-800 text-white font-bold text-[10px] text-center border-b border-slate-700">
            <th className="p-2 border-r border-slate-700 bg-teal-800/80 w-24" title="Formatif 1: Praktik Gerak Lapangan">
              <div>NH 1</div>
              <div className="text-[9px] font-normal opacity-80">Praktik Fisik</div>
            </th>
            <th className="p-2 border-r border-slate-700 bg-teal-800/80 w-24" title="Formatif 2: Tes Tertulis/Lisan">
              <div>NH 2</div>
              <div className="text-[9px] font-normal opacity-80">Teori / Kuis</div>
            </th>
            <th className="p-2 border-r border-slate-700 bg-teal-800/80 w-24" title="Formatif 3: Tugas Portofolio & Sikap">
              <div>NH 3</div>
              <div className="text-[9px] font-normal opacity-80">Tugas / Sikap</div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-medium text-center">
          {students.map((student, sIdx) => {
            const d = dailyScores[student.id]?.[activeTp.id] || { nh1: 75, nh2: 75, nh3: 75, sumatifTp: 75 };
            const finalScore = scores[student.id]?.[activeTp.id] !== undefined 
              ? scores[student.id][activeTp.id] 
              : Math.round((d.nh1 + d.nh2 + d.nh3 + d.sumatifTp) / 4);
            const isPassed = finalScore >= kktp;

            return (
              <tr key={student.id} className={sIdx % 2 === 1 ? 'bg-slate-50/60 hover:bg-slate-100' : 'hover:bg-slate-50'}>
                <td className="p-2.5 border-r border-slate-200 text-slate-400 font-mono font-bold">
                  {sIdx + 1}
                </td>
                <td className="p-2.5 border-r border-slate-200 text-left font-bold text-slate-800">
                  <div>{student.name}</div>
                  {student.nisn && (
                    <div className="text-[9px] text-slate-400 font-mono font-normal">NISN: {student.nisn}</div>
                  )}
                </td>
                <td className="p-2 border-r border-slate-200 text-center font-bold">
                  {onToggleGender ? (
                    <button
                      type="button"
                      onClick={() => onToggleGender(student.id)}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer no-print ${
                        student.gender === 'L' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                      title="Klik untuk ubah jenis kelamin"
                    >
                      {student.gender}
                    </button>
                  ) : (
                    <span>{student.gender}</span>
                  )}
                  <span className="hidden print:inline font-bold">{student.gender}</span>
                </td>

                {/* NH 1: Praktik Fisik Lapangan */}
                <td className="p-1.5 border-r border-slate-200">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={d.nh1}
                    onChange={(e) => onUpdateDailyScore(student.id, activeTp.id, 'nh1', Number(e.target.value))}
                    className="w-16 px-1.5 py-1 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 focus:outline-none no-print"
                  />
                  <span className="hidden print:inline font-bold">{d.nh1}</span>
                </td>

                {/* NH 2: Teori / Kuis */}
                <td className="p-1.5 border-r border-slate-200">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={d.nh2}
                    onChange={(e) => onUpdateDailyScore(student.id, activeTp.id, 'nh2', Number(e.target.value))}
                    className="w-16 px-1.5 py-1 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 focus:outline-none no-print"
                  />
                  <span className="hidden print:inline font-bold">{d.nh2}</span>
                </td>

                {/* NH 3: Tugas / Sikap */}
                <td className="p-1.5 border-r border-slate-200">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={d.nh3}
                    onChange={(e) => onUpdateDailyScore(student.id, activeTp.id, 'nh3', Number(e.target.value))}
                    className="w-16 px-1.5 py-1 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 focus:outline-none no-print"
                  />
                  <span className="hidden print:inline font-bold">{d.nh3}</span>
                </td>

                {/* Sumatif TP */}
                <td className="p-1.5 border-r border-slate-200 bg-indigo-50/40">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={d.sumatifTp}
                    onChange={(e) => onUpdateDailyScore(student.id, activeTp.id, 'sumatifTp', Number(e.target.value))}
                    className="w-16 px-1.5 py-1 text-center font-bold text-indigo-900 bg-white border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none no-print"
                  />
                  <span className="hidden print:inline font-bold text-indigo-900">{d.sumatifTp}</span>
                </td>

                {/* Nilai Akhir TP */}
                <td className="p-2 border-r border-slate-200 bg-emerald-50/40 font-black text-emerald-950 text-sm">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={finalScore}
                    onChange={(e) => onUpdateTpFinalScore(student.id, activeTp.id, Number(e.target.value))}
                    className="w-16 px-1.5 py-1 text-center font-black text-emerald-900 bg-emerald-100/70 border border-emerald-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none no-print"
                    title="Nilai akhir TP (terhitung otomatis, dapat disesuaikan)"
                  />
                  <span className="hidden print:inline font-black text-emerald-900">{finalScore}</span>
                </td>

                {/* Ketuntasan */}
                <td className="p-2 text-center">
                  {isPassed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      Tuntas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">
                      <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                      Remedial
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

          {/* Rata-rata Kelas Footer */}
          <tr className="bg-slate-100 text-slate-800 font-extrabold text-[11px] border-t-2 border-slate-300">
            <td colSpan={3} className="p-3 border-r border-slate-300 text-right uppercase tracking-wider">
              RATA-RATA KELAS:
            </td>
            <td className="p-2.5 border-r border-slate-300 text-teal-900 font-black">{colAverages.nh1}</td>
            <td className="p-2.5 border-r border-slate-300 text-teal-900 font-black">{colAverages.nh2}</td>
            <td className="p-2.5 border-r border-slate-300 text-teal-900 font-black">{colAverages.nh3}</td>
            <td className="p-2.5 border-r border-slate-300 bg-indigo-100 text-indigo-950 font-black">{colAverages.sumatifTp}</td>
            <td className="p-2.5 border-r border-slate-300 bg-emerald-200 text-emerald-950 font-black text-xs">{colAverages.final}</td>
            <td className="p-2.5 text-center text-emerald-800 font-black">
              {Math.round((students.filter(s => {
                const d = dailyScores[s.id]?.[activeTp.id] || { nh1: 75, nh2: 75, nh3: 75, sumatifTp: 75 };
                const f = scores[s.id]?.[activeTp.id] ?? Math.round((d.nh1 + d.nh2 + d.nh3 + d.sumatifTp) / 4);
                return f >= kktp;
              }).length / (students.length || 1)) * 100)}% Tuntas
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
