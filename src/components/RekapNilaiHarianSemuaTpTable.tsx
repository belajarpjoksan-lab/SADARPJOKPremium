import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { TpItem, TpDailyScores } from './nilaiHarianTypes';
import { CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, HelpCircle } from 'lucide-react';

interface RekapNilaiHarianSemuaTpTableProps {
  students: Student[];
  tps: TpItem[];
  dailyScores: { [studentId: string]: { [tpId: string]: TpDailyScores } };
  scores: { [studentId: string]: { [tpId: string]: number } };
  kktp: number;
  onUpdateDailyScore: (studentId: string, tpId: string, field: keyof TpDailyScores, val: number) => void;
  onUpdateTpFinalScore: (studentId: string, tpId: string, val: number) => void;
  onToggleGender?: (studentId: string) => void;
}

export default function RekapNilaiHarianSemuaTpTable({
  students,
  tps,
  dailyScores,
  scores,
  kktp,
  onUpdateDailyScore,
  onUpdateTpFinalScore,
  onToggleGender
}: RekapNilaiHarianSemuaTpTableProps) {
  // Option to toggle between full breakdown (NH1, NH2, NH3, Sumatif per TP) and compact view
  const [showDetailedSubcolumns, setShowDetailedSubcolumns] = useState<boolean>(true);

  // Calculate per-student data across all TPs
  const studentRows = useMemo(() => {
    return students.map(student => {
      let totalTpScoreSum = 0;
      const tpDetails: { 
        [tpId: string]: { 
          nh1: number; 
          nh2: number; 
          nh3: number; 
          sumatifTp: number; 
          finalScore: number;
        } 
      } = {};

      tps.forEach(tp => {
        const d = dailyScores[student.id]?.[tp.id] || { nh1: 75, nh2: 75, nh3: 75, sumatifTp: 75 };
        const explicitFinal = scores[student.id]?.[tp.id];
        const finalScore = explicitFinal !== undefined 
          ? explicitFinal 
          : Math.round((d.nh1 + d.nh2 + d.nh3 + d.sumatifTp) / 4);

        tpDetails[tp.id] = {
          nh1: d.nh1,
          nh2: d.nh2,
          nh3: d.nh3,
          sumatifTp: d.sumatifTp,
          finalScore
        };

        totalTpScoreSum += finalScore;
      });

      const rerataHarian = tps.length > 0 ? Math.round(totalTpScoreSum / tps.length) : 75;

      let predikat: 'A (Sangat Baik)' | 'B (Baik)' | 'C (Cukup)' | 'D (Perlu Bimbingan)' = 'B (Baik)';
      if (rerataHarian >= 90) predikat = 'A (Sangat Baik)';
      else if (rerataHarian >= 80) predikat = 'B (Baik)';
      else if (rerataHarian >= 70) predikat = 'C (Cukup)';
      else predikat = 'D (Perlu Bimbingan)';

      const isPassed = rerataHarian >= kktp;

      return {
        student,
        tpDetails,
        rerataHarian,
        predikat,
        isPassed
      };
    });
  }, [students, tps, dailyScores, scores, kktp]);

  // Calculate class averages for all components
  const classAverages = useMemo(() => {
    const totalCount = students.length || 1;
    const tpAvgs: { 
      [tpId: string]: { 
        nh1: number; 
        nh2: number; 
        nh3: number; 
        sumatifTp: number; 
        finalScore: number; 
      } 
    } = {};

    let sumOverallRerata = 0;
    let totalPassed = 0;

    tps.forEach(tp => {
      let sumNh1 = 0, sumNh2 = 0, sumNh3 = 0, sumSumatif = 0, sumFinal = 0;
      studentRows.forEach(row => {
        const item = row.tpDetails[tp.id];
        if (item) {
          sumNh1 += item.nh1;
          sumNh2 += item.nh2;
          sumNh3 += item.nh3;
          sumSumatif += item.sumatifTp;
          sumFinal += item.finalScore;
        }
      });
      tpAvgs[tp.id] = {
        nh1: Math.round(sumNh1 / totalCount),
        nh2: Math.round(sumNh2 / totalCount),
        nh3: Math.round(sumNh3 / totalCount),
        sumatifTp: Math.round(sumSumatif / totalCount),
        finalScore: Math.round(sumFinal / totalCount)
      };
    });

    studentRows.forEach(row => {
      sumOverallRerata += row.rerataHarian;
      if (row.isPassed) totalPassed++;
    });

    return {
      tpAvgs,
      overallRerata: Math.round(sumOverallRerata / totalCount),
      passedPercent: Math.round((totalPassed / totalCount) * 100),
      totalPassed,
      totalFailed: students.length - totalPassed
    };
  }, [students, tps, studentRows]);

  return (
    <div className="space-y-4">
      {/* Action Controls & Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl no-print">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Rekap Nilai Harian Semua TP:
          </span>
          <span className="text-slate-500 font-medium">
            Formatif Praktik (NH1), Teori (NH2), Tugas (NH3), &amp; Sumatif TP (S-TP)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDetailedSubcolumns(!showDetailedSubcolumns)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              showDetailedSubcolumns
                ? 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="Alihkan antara tampilan rincian penuh (NH1-3 + Sumatif) atau ringkas (Hanya Nilai TP)"
          >
            {showDetailedSubcolumns ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-teal-600" />
                <span>Ringkaskan Kolom Formatif</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Buka Rincian Lengkap NH1, NH2, NH3</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            {/* Main Header Row */}
            <tr className="bg-slate-900 text-white border-b border-slate-800 text-center font-extrabold">
              <th rowSpan={showDetailedSubcolumns ? 2 : 1} className="p-2.5 border-r border-slate-700 w-10">No</th>
              <th rowSpan={showDetailedSubcolumns ? 2 : 1} className="p-2.5 border-r border-slate-700 text-left min-w-[170px]">Nama Peserta Didik</th>
              <th rowSpan={showDetailedSubcolumns ? 2 : 1} className="p-2 border-r border-slate-700 w-10">L/P</th>

              {/* TP Super Headers */}
              {tps.map(tp => (
                <th
                  key={tp.id}
                  colSpan={showDetailedSubcolumns ? 5 : 1}
                  className="p-2 border-r border-slate-700 bg-teal-900 text-teal-100 group relative"
                  title={`${tp.code}: ${tp.text}`}
                >
                  <div className="font-extrabold text-xs">{tp.code}</div>
                  <div className="text-[10px] font-normal text-teal-200 truncate max-w-[200px] mx-auto opacity-90">
                    {tp.text}
                  </div>
                </th>
              ))}

              {/* Summary Columns */}
              <th rowSpan={showDetailedSubcolumns ? 2 : 1} className="p-2 border-r border-slate-700 bg-teal-950 text-teal-200 w-20">
                <div>R-TP</div>
                <div className="text-[9px] font-normal text-teal-300">Rerata Harian</div>
              </th>

              <th rowSpan={showDetailedSubcolumns ? 2 : 1} className="p-2 border-r border-slate-700 bg-slate-800 w-16">
                Predikat
              </th>

              <th rowSpan={showDetailedSubcolumns ? 2 : 1} className="p-2 bg-slate-800 w-24">
                Status (≥ {kktp})
              </th>
            </tr>

            {/* Subheader Row for Formatif Components */}
            {showDetailedSubcolumns && (
              <tr className="bg-slate-800 text-white font-bold text-[10px] text-center border-b border-slate-700">
                {tps.map(tp => (
                  <React.Fragment key={`sub-${tp.id}`}>
                    <th className="p-1 border-r border-slate-700 w-11 bg-slate-700/80 text-teal-200" title="Formatif Praktik Lapangan / Unjuk Kerja">
                      NH1
                    </th>
                    <th className="p-1 border-r border-slate-700 w-11 bg-slate-700/80 text-teal-200" title="Formatif Teori / Kuis Pemahaman Gerak">
                      NH2
                    </th>
                    <th className="p-1 border-r border-slate-700 w-11 bg-slate-700/80 text-teal-200" title="Formatif Tugas / Portofolio / Sikap Sportivitas">
                      NH3
                    </th>
                    <th className="p-1 border-r border-slate-700 w-12 bg-teal-800/90 text-amber-200" title="Asesmen Sumatif Lingkup Materi TP">
                      S-TP
                    </th>
                    <th className="p-1 border-r border-slate-700 w-12 bg-teal-700/90 text-white font-extrabold" title="Nilai Akhir TP = (NH1+NH2+NH3+S-TP)/4">
                      N-TP
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            )}
          </thead>

          <tbody className="divide-y divide-slate-200 font-medium text-center">
            {studentRows.map((row, sIdx) => {
              const { student, tpDetails, rerataHarian, predikat, isPassed } = row;
              let predBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
              if (predikat.startsWith('B')) predBg = 'bg-sky-50 text-sky-800 border-sky-300';
              else if (predikat.startsWith('C')) predBg = 'bg-amber-50 text-amber-800 border-amber-300';
              else if (predikat.startsWith('D')) predBg = 'bg-rose-50 text-rose-800 border-rose-300';

              return (
                <tr 
                  key={student.id} 
                  className={sIdx % 2 === 1 ? 'bg-slate-50/50 hover:bg-slate-100 transition-colors' : 'hover:bg-slate-50 transition-colors'}
                >
                  <td className="p-2 border-r border-slate-200 text-slate-400 font-mono font-bold">
                    {sIdx + 1}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-left font-bold text-slate-800">
                    <div>{student.name}</div>
                    {student.nisn && (
                      <div className="text-[9px] text-slate-400 font-mono font-normal">NISN: {student.nisn}</div>
                    )}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">
                    {onToggleGender ? (
                      <button
                        type="button"
                        onClick={() => onToggleGender(student.id)}
                        className={`px-1.5 py-0.5 rounded text-xs font-bold transition-all cursor-pointer no-print ${
                          student.gender === 'L' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                        title="Klik untuk ubah jenis kelamin siswa"
                      >
                        {student.gender}
                      </button>
                    ) : (
                      <span>{student.gender}</span>
                    )}
                    <span className="hidden print:inline font-bold">{student.gender}</span>
                  </td>

                  {/* TP Scores Columns */}
                  {tps.map(tp => {
                    const detail = tpDetails[tp.id] || { nh1: 75, nh2: 75, nh3: 75, sumatifTp: 75, finalScore: 75 };

                    if (showDetailedSubcolumns) {
                      return (
                        <React.Fragment key={`${student.id}-${tp.id}`}>
                          {/* NH1 (Praktik) */}
                          <td className="p-1 border-r border-slate-200">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={detail.nh1}
                              onChange={(e) => onUpdateDailyScore(student.id, tp.id, 'nh1', Number(e.target.value))}
                              className="w-10 px-1 py-1 text-center font-semibold text-slate-700 bg-white hover:bg-slate-100 focus:bg-teal-50 rounded border border-transparent hover:border-slate-300 focus:ring-1 focus:ring-teal-500 transition-all no-print"
                              title={`${tp.code} NH1 Praktik: ${student.name}`}
                            />
                            <span className="hidden print:inline font-semibold">{detail.nh1}</span>
                          </td>

                          {/* NH2 (Teori) */}
                          <td className="p-1 border-r border-slate-200">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={detail.nh2}
                              onChange={(e) => onUpdateDailyScore(student.id, tp.id, 'nh2', Number(e.target.value))}
                              className="w-10 px-1 py-1 text-center font-semibold text-slate-700 bg-white hover:bg-slate-100 focus:bg-teal-50 rounded border border-transparent hover:border-slate-300 focus:ring-1 focus:ring-teal-500 transition-all no-print"
                              title={`${tp.code} NH2 Teori: ${student.name}`}
                            />
                            <span className="hidden print:inline font-semibold">{detail.nh2}</span>
                          </td>

                          {/* NH3 (Tugas) */}
                          <td className="p-1 border-r border-slate-200">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={detail.nh3}
                              onChange={(e) => onUpdateDailyScore(student.id, tp.id, 'nh3', Number(e.target.value))}
                              className="w-10 px-1 py-1 text-center font-semibold text-slate-700 bg-white hover:bg-slate-100 focus:bg-teal-50 rounded border border-transparent hover:border-slate-300 focus:ring-1 focus:ring-teal-500 transition-all no-print"
                              title={`${tp.code} NH3 Tugas: ${student.name}`}
                            />
                            <span className="hidden print:inline font-semibold">{detail.nh3}</span>
                          </td>

                          {/* S-TP (Sumatif TP) */}
                          <td className="p-1 border-r border-slate-200 bg-amber-50/30">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={detail.sumatifTp}
                              onChange={(e) => onUpdateDailyScore(student.id, tp.id, 'sumatifTp', Number(e.target.value))}
                              className="w-10 px-1 py-1 text-center font-bold text-amber-900 bg-amber-50/50 hover:bg-amber-100 focus:bg-amber-100 rounded border border-transparent hover:border-amber-300 focus:ring-1 focus:ring-amber-500 transition-all no-print"
                              title={`${tp.code} Asesmen Sumatif TP: ${student.name}`}
                            />
                            <span className="hidden print:inline font-bold">{detail.sumatifTp}</span>
                          </td>

                          {/* N-TP (Nilai Akhir TP) */}
                          <td className="p-1 border-r border-slate-200 bg-teal-50/60 font-black text-teal-900 text-center text-xs">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={detail.finalScore}
                              onChange={(e) => onUpdateTpFinalScore(student.id, tp.id, Number(e.target.value))}
                              className="w-11 px-1 py-1 text-center font-black text-teal-950 bg-teal-100/60 hover:bg-teal-200 focus:bg-white rounded border border-transparent hover:border-teal-400 focus:ring-1 focus:ring-teal-500 transition-all no-print"
                              title={`${tp.code} Nilai Akhir TP: ${student.name}`}
                            />
                            <span className="hidden print:inline font-black">{detail.finalScore}</span>
                          </td>
                        </React.Fragment>
                      );
                    } else {
                      // Compact view: only show Nilai Akhir TP
                      return (
                        <td key={`${student.id}-${tp.id}`} className="p-1 border-r border-slate-200">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={detail.finalScore}
                            onChange={(e) => onUpdateTpFinalScore(student.id, tp.id, Number(e.target.value))}
                            className="w-12 px-1 py-1 text-center font-extrabold text-slate-800 bg-white hover:bg-slate-100 focus:bg-teal-50 rounded border border-transparent hover:border-slate-300 focus:ring-1 focus:ring-teal-500 transition-all no-print"
                          />
                          <span className="hidden print:inline font-extrabold">{detail.finalScore}</span>
                        </td>
                      );
                    }
                  })}

                  {/* Overall Rerata Nilai Harian Semua TP */}
                  <td className="p-2 border-r border-slate-200 font-black text-teal-950 bg-teal-50/70 text-center text-sm">
                    {rerataHarian}
                  </td>

                  {/* Predikat */}
                  <td className="p-1.5 border-r border-slate-200 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-black border ${predBg}`}>
                      {predikat.charAt(0)}
                    </span>
                  </td>

                  {/* Ketuntasan */}
                  <td className="p-2 text-center">
                    {isPassed ? (
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

            {/* Class Average Footer */}
            <tr className="bg-slate-100/90 text-slate-800 font-extrabold text-[11px] border-t-2 border-slate-300">
              <td colSpan={3} className="p-2.5 border-r border-slate-200 text-right uppercase tracking-wider">
                Rata-rata Kelas
              </td>

              {tps.map(tp => {
                const avgs = classAverages.tpAvgs[tp.id] || { nh1: 0, nh2: 0, nh3: 0, sumatifTp: 0, finalScore: 0 };
                if (showDetailedSubcolumns) {
                  return (
                    <React.Fragment key={`avg-${tp.id}`}>
                      <td className="p-1 border-r border-slate-200 text-slate-600 font-semibold">{avgs.nh1}</td>
                      <td className="p-1 border-r border-slate-200 text-slate-600 font-semibold">{avgs.nh2}</td>
                      <td className="p-1 border-r border-slate-200 text-slate-600 font-semibold">{avgs.nh3}</td>
                      <td className="p-1 border-r border-slate-200 text-amber-800 font-bold bg-amber-50/40">{avgs.sumatifTp}</td>
                      <td className="p-1 border-r border-slate-200 text-teal-900 font-black bg-teal-100/50">{avgs.finalScore}</td>
                    </React.Fragment>
                  );
                } else {
                  return (
                    <td key={`avg-${tp.id}`} className="p-1 border-r border-slate-200 text-teal-900 font-black">
                      {avgs.finalScore}
                    </td>
                  );
                }
              })}

              <td className="p-2 border-r border-slate-200 bg-teal-100 text-teal-950 font-black text-center text-xs">
                {classAverages.overallRerata}
              </td>

              <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-500">-</td>

              <td className="p-2 text-emerald-700 font-black text-center">
                {classAverages.passedPercent}% Tuntas
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Info & Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs no-print">
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
          <span className="text-slate-500 font-semibold">Total Siswa:</span>
          <span className="font-extrabold text-slate-800">{students.length} Peserta Didik</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
          <span className="text-slate-500 font-semibold">Rerata Nilai Harian Kelas:</span>
          <span className="font-black text-teal-700">{classAverages.overallRerata} / 100</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
          <span className="text-slate-500 font-semibold">Ketuntasan (≥ {kktp}):</span>
          <span className="font-black text-emerald-700">
            {classAverages.totalPassed} Siswa ({classAverages.passedPercent}%)
          </span>
        </div>
      </div>
    </div>
  );
}
