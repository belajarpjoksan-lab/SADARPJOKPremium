import React from 'react';
import { Student } from '../types';
import { TpItem, StudentSemesterEvaluation } from './nilaiHarianTypes';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface RekapNilaiHarianSemesterTableProps {
  students: Student[];
  tps: TpItem[];
  evaluations: StudentSemesterEvaluation[];
  tpClassAverages: { [tpId: string]: number };
  classRerataTpAverage: number;
  classStsAverage: number;
  classSasAverage: number;
  classFinalAverage: number;
  passedPercent: number;
  kktp: number;
  onUpdateTpScore: (studentId: string, tpId: string, val: number) => void;
  onUpdateSemesterScore: (studentId: string, field: 'sts' | 'sas', val: number) => void;
  onToggleGender?: (studentId: string) => void;
}

export default function RekapNilaiHarianSemesterTable({
  students,
  tps,
  evaluations,
  tpClassAverages,
  classRerataTpAverage,
  classStsAverage,
  classSasAverage,
  classFinalAverage,
  passedPercent,
  kktp,
  onUpdateTpScore,
  onUpdateSemesterScore,
  onToggleGender
}: RekapNilaiHarianSemesterTableProps) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-900 text-white border-b border-slate-800 text-center font-extrabold">
            <th rowSpan={2} className="p-3 border-r border-slate-700 w-10">No</th>
            <th rowSpan={2} className="p-3 border-r border-slate-700 text-left min-w-[160px]">Nama Peserta Didik</th>
            <th rowSpan={2} className="p-3 border-r border-slate-700 w-10">L/P</th>
            
            {/* TPs Header */}
            <th colSpan={tps.length} className="p-2 border-r border-slate-700 bg-teal-900 text-teal-100">
              Nilai Harian per Tujuan Pembelajaran (TP) 1 Semester
            </th>

            <th rowSpan={2} className="p-2 border-r border-slate-700 bg-teal-950 text-teal-200 w-16">
              <div>R-TP</div>
              <div className="text-[9px] font-normal text-teal-300">Rerata TP</div>
            </th>

            <th rowSpan={2} className="p-2 border-r border-slate-700 bg-indigo-900 text-indigo-100 w-16">
              <div>STS</div>
              <div className="text-[9px] font-normal text-indigo-300">Tengah Sem.</div>
            </th>

            <th rowSpan={2} className="p-2 border-r border-slate-700 bg-indigo-950 text-indigo-200 w-16">
              <div>SAS</div>
              <div className="text-[9px] font-normal text-indigo-300">Akhir Sem.</div>
            </th>

            <th rowSpan={2} className="p-2.5 border-r border-slate-700 bg-emerald-900 text-emerald-100 w-20">
              <div>NA Rapor</div>
              <div className="text-[9px] font-normal text-emerald-300">Nilai Akhir</div>
            </th>

            <th rowSpan={2} className="p-2 border-r border-slate-700 bg-slate-800 w-14">
              Predikat
            </th>

            <th rowSpan={2} className="p-2 border-r border-slate-700 bg-slate-800 w-24">
              Status (≥ {kktp})
            </th>

            <th rowSpan={2} className="p-2 text-left min-w-[240px] bg-slate-800">
              Deskripsi Capaian Rapor Kurikulum Merdeka
            </th>
          </tr>

          {/* Subheader: TP codes */}
          <tr className="bg-slate-800 text-white font-bold text-[10px] text-center border-b border-slate-700">
            {tps.map(tp => (
              <th 
                key={tp.id} 
                className="p-1.5 border-r border-slate-700 min-w-[48px] bg-slate-700/90 text-white"
                title={`${tp.code}: ${tp.text}`}
              >
                {tp.code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-medium text-center">
          {evaluations.map((ev, sIdx) => {
            const student = students.find(s => s.id === ev.studentId);
            let predBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
            if (ev.predikat.startsWith('B')) predBg = 'bg-sky-50 text-sky-800 border-sky-300';
            else if (ev.predikat.startsWith('C')) predBg = 'bg-amber-50 text-amber-800 border-amber-300';
            else if (ev.predikat.startsWith('D')) predBg = 'bg-rose-50 text-rose-800 border-rose-300';

            return (
              <tr key={ev.studentId} className={sIdx % 2 === 1 ? 'bg-slate-50/60 hover:bg-slate-100' : 'hover:bg-slate-50'}>
                <td className="p-2 border-r border-slate-200 text-slate-400 font-mono font-bold">
                  {sIdx + 1}
                </td>
                <td className="p-2 border-r border-slate-200 text-left font-bold text-slate-800">
                  <div>{ev.studentName}</div>
                  {student?.nisn && (
                    <div className="text-[9px] text-slate-400 font-mono font-normal">NISN: {student.nisn}</div>
                  )}
                </td>
                <td className="p-1.5 border-r border-slate-200 text-center font-bold">
                  {onToggleGender ? (
                    <button
                      type="button"
                      onClick={() => onToggleGender(ev.studentId)}
                      className={`px-1.5 py-0.5 rounded text-xs font-bold transition-all cursor-pointer no-print ${
                        ev.gender === 'L' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                      title="Klik untuk ubah jenis kelamin"
                    >
                      {ev.gender}
                    </button>
                  ) : (
                    <span>{ev.gender}</span>
                  )}
                  <span className="hidden print:inline font-bold">{ev.gender}</span>
                </td>

                {/* TP Scores columns */}
                {tps.map(tp => {
                  const val = ev.tpScores[tp.id] ?? 75;
                  return (
                    <td key={tp.id} className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={val}
                        onChange={(e) => onUpdateTpScore(ev.studentId, tp.id, Number(e.target.value))}
                        className="w-12 px-1 py-1 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none no-print text-[11px]"
                      />
                      <span className="hidden print:inline font-bold">{val}</span>
                    </td>
                  );
                })}

                {/* Rerata TP */}
                <td className="p-2 border-r border-slate-200 bg-teal-50/50 font-black text-teal-950 text-xs">
                  {ev.rerataTp}
                </td>

                {/* STS */}
                <td className="p-1 border-r border-slate-200 bg-indigo-50/30">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={ev.sts}
                    onChange={(e) => onUpdateSemesterScore(ev.studentId, 'sts', Number(e.target.value))}
                    className="w-12 px-1 py-1 text-center font-bold text-indigo-900 bg-white border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none no-print text-[11px]"
                  />
                  <span className="hidden print:inline font-bold text-indigo-900">{ev.sts}</span>
                </td>

                {/* SAS */}
                <td className="p-1 border-r border-slate-200 bg-indigo-50/50">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={ev.sas}
                    onChange={(e) => onUpdateSemesterScore(ev.studentId, 'sas', Number(e.target.value))}
                    className="w-12 px-1 py-1 text-center font-bold text-indigo-950 bg-white border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none no-print text-[11px]"
                  />
                  <span className="hidden print:inline font-bold text-indigo-950">{ev.sas}</span>
                </td>

                {/* NA Rapor */}
                <td className="p-2 border-r border-slate-200 bg-emerald-100/70 font-black text-emerald-950 text-sm">
                  {ev.nilaiAkhirSemester}
                </td>

                {/* Predikat */}
                <td className="p-1.5 border-r border-slate-200">
                  <span className={`px-2 py-0.5 rounded font-black text-[10px] border ${predBg}`}>
                    {ev.predikat.substring(0, 1)}
                  </span>
                </td>

                {/* Ketuntasan */}
                <td className="p-1.5 border-r border-slate-200">
                  {ev.isPassed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                      Tuntas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                      <AlertCircle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                      Remedial
                    </span>
                  )}
                </td>

                {/* Deskripsi Rapor */}
                <td className="p-2 text-left text-[11px] text-slate-700 leading-snug">
                  {ev.deskripsiRapor}
                </td>
              </tr>
            );
          })}

          {/* Rata-rata Kelas Footer */}
          <tr className="bg-slate-100 text-slate-800 font-extrabold text-[11px] border-t-2 border-slate-300">
            <td colSpan={3} className="p-2.5 border-r border-slate-300 text-right uppercase tracking-wider">
              RATA-RATA KELAS:
            </td>
            {tps.map(tp => (
              <td key={tp.id} className="p-2 border-r border-slate-300 text-teal-900 font-black">
                {tpClassAverages[tp.id] || 0}
              </td>
            ))}
            <td className="p-2 border-r border-slate-300 bg-teal-100 font-black text-teal-950">{classRerataTpAverage}</td>
            <td className="p-2 border-r border-slate-300 bg-indigo-100 font-black text-indigo-950">{classStsAverage}</td>
            <td className="p-2 border-r border-slate-300 bg-indigo-100 font-black text-indigo-950">{classSasAverage}</td>
            <td className="p-2 border-r border-slate-300 bg-emerald-200 font-black text-emerald-950 text-xs">{classFinalAverage}</td>
            <td colSpan={2} className="p-2 border-r border-slate-300 text-emerald-800 font-black text-center">
              {passedPercent}% Tuntas
            </td>
            <td className="p-2 text-left text-[10px] text-slate-500 font-normal">
              Nilai Akhir = (2 &times; R-TP + STS + SAS) / 4
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
