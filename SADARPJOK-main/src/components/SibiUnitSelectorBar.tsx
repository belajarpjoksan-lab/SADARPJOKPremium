import React, { useState } from 'react';
import { BookOpen, CheckCircle2, ExternalLink, Sparkles, ChevronDown, ChevronUp, BookmarkCheck } from 'lucide-react';
import { getSibiBookByGrade, SibiUnitItem } from '../utils/sibiGuidebookData';

interface SibiUnitSelectorBarProps {
  grade: string | number;
  currentTopic?: string;
  selectedMateri?: string;
  onSelectUnit: (unit: SibiUnitItem, bookCitation: string) => void;
  compact?: boolean;
}

export default function SibiUnitSelectorBar({
  grade,
  currentTopic = '',
  selectedMateri = '',
  onSelectUnit,
  compact = false
}: SibiUnitSelectorBarProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const book = getSibiBookByGrade(grade);

  const handleChooseUnit = (unit: SibiUnitItem) => {
    setSelectedUnitId(unit.id);
    onSelectUnit(unit, book.citationFull);
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 p-4 shadow-xs space-y-3 no-print">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                Standar Resmi SIBI Kemendikdasmen
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                Kelas {book.romanGrade} SD ({book.fase}) • ISBN {book.isbn}
              </span>
            </div>
            <h4 className="text-xs font-extrabold text-slate-900 mt-1">
              {book.judulBukuGuru}
            </h4>
            <p className="text-[11px] text-slate-600">
              Penulis: <strong>{book.penulis}</strong> • {book.penerbit}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={book.urlSibi}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 transition"
            title="Buka Katalog Resmi SIBI Kemendikdasmen"
          >
            <span>Katalog SIBI</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>{isExpanded ? 'Sembunyikan Unit SIBI' : 'Pilih Unit Buku SIBI (8 Unit)'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="pt-2 border-t border-emerald-200/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Klik salah satu Unit di bawah untuk mengisi Topik, Bab, CP, &amp; Aktivitas sesuai Buku Panduan Guru SIBI Kelas {book.romanGrade}:
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {book.units.map((u) => {
              const isSelected =
                selectedUnitId === u.id ||
                (currentTopic && currentTopic.toLowerCase().includes(u.pokokMateri.toLowerCase().slice(0, 18)));

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleChooseUnit(u)}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white hover:bg-emerald-50/80 text-slate-800 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.unitCode} • Smt {u.semester}
                      </span>
                      <span className={`text-[10px] font-semibold truncate ${
                        isSelected ? 'text-emerald-100' : 'text-slate-500'
                      }`}>
                        {u.alokasiJp}
                      </span>
                    </div>
                    <p className={`text-xs font-bold leading-snug ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {u.unitTitle.replace(/^Unit \d+:\s*/i, '')}
                    </p>
                    <p className={`text-[11px] line-clamp-1 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                      Pokok Materi: {u.pokokMateri}
                    </p>
                  </div>
                  <div className="shrink-0 mt-1">
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Pilih
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
