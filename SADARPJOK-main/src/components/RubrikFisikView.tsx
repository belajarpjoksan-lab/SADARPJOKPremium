import React, { useState } from 'react';
import { RubrikFisik } from '../types';
import { 
  Plus, 
  Sparkles, 
  Trash2, 
  Search, 
  Flame, 
  BookOpen, 
  Award, 
  Check, 
  X,
  AlertCircle,
  Printer,
  Copy,
  Download
} from 'lucide-react';
import { exportRubrikToDoc, downloadDocFile, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getRubrikFisikPrompts } from '../utils/aiPromptGenerators';

interface RubrikFisikViewProps {
  rubriks: RubrikFisik[];
  onAddRubrik: (rubrik: RubrikFisik) => void;
  onDeleteRubrik: (id: string) => void;
}

export default function RubrikFisikView({ rubriks, onAddRubrik, onDeleteRubrik }: RubrikFisikViewProps) {
  const [activeRubrikId, setActiveRubrikId] = useState<string>(rubriks[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Form State
  const [materiInput, setMateriInput] = useState('');
  const [kategoriInput, setKategoriInput] = useState('Bola Besar');

  const handleGenerateRubrik = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiInput.trim()) return;

    setIsGenerating(true);
    setApiError(null);

    try {
      const response = await fetch('/api/generate-rubrik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materi: materiInput,
          kategori: kategoriInput
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal terhubung dengan generator AI.');
      }

      const data = await response.json();
      
      const newRubrik: RubrikFisik = {
        id: 'rubrik-ai-' + Date.now(),
        materi: data.materi || materiInput,
        kategori: data.kategori || kategoriInput,
        indikator: data.indikator || []
      };

      onAddRubrik(newRubrik);
      setActiveRubrikId(newRubrik.id);
      setMateriInput('');
    } catch (err: any) {
      setApiError(err.message || 'Gagal membuat rubrik dengan AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredRubriks = rubriks.filter(r => 
    r.materi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.kategori.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRubrik = rubriks.find(r => r.id === activeRubrikId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar - Rubric List & Generator */}
      <div className="lg:col-span-4 space-y-4">
        {/* Generator Form */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-xl shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">SADAR AI Rubrik Generator</h3>
              <p className="text-[10px] text-slate-300">Buat Rubrik Kinerja Motorik Objektif</p>
            </div>
          </div>

          <form onSubmit={handleGenerateRubrik} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Kategori Gerak</label>
              <select
                value={kategoriInput}
                onChange={(e) => setKategoriInput(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/80 text-white rounded-lg text-xs px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="Bola Besar">Permainan Bola Besar (Fisik)</option>
                <option value="Bola Kecil">Permainan Bola Kecil (Akurasi)</option>
                <option value="Senam">Senam Lantai & Ketangkasan</option>
                <option value="Atletik">Atletik (Lari, Lompat, Lempar)</option>
                <option value="Air">Aktivitas Air / Renang</option>
                <option value="Kebugaran">Latihan Kebugaran Jasmani</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Materi Spesifik</label>
              <input
                type="text"
                value={materiInput}
                onChange={(e) => setMateriInput(e.target.value)}
                placeholder="Contoh: Lay-up Shoot Bola Basket"
                className="w-full bg-slate-800/80 border border-slate-700/80 text-white rounded-lg text-xs px-3 py-2 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {apiError && (
              <div className="p-2 bg-rose-500/15 border border-rose-500/20 rounded text-rose-300 text-[10px] flex gap-1 items-start">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Menyusun Rubrik...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Susun Rubrik PJOK AI
                </>
              )}
            </button>
          </form>
        </div>

        {/* Saved Rubrics */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 className="font-semibold text-slate-800 text-sm">Rubrik Tersimpan</h3>
            <span className="text-xs text-slate-400 font-mono">{filteredRubriks.length} Rubrik</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari rubrik..."
              className="w-full border border-slate-100 rounded-lg text-[11px] pl-8 pr-3 py-1.5 bg-slate-50"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {filteredRubriks.map(r => (
              <div
                key={r.id}
                onClick={() => setActiveRubrikId(r.id)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                  activeRubrikId === r.id
                    ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900 font-semibold'
                    : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="min-w-0">
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider block mb-1 w-max">
                    {r.kategori}
                  </span>
                  <h4 className="text-xs truncate">{r.materi}</h4>
                </div>
                {deletingId === r.id ? (
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        onDeleteRubrik(r.id);
                        if (activeRubrikId === r.id) {
                          const remaining = rubriks.filter(x => x.id !== r.id);
                          if (remaining.length > 0) {
                            setActiveRubrikId(remaining[0].id);
                          } else {
                            setActiveRubrikId('');
                          }
                        }
                        setDeletingId(null);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(r.id);
                    }}
                    className="text-slate-300 hover:text-rose-600 p-1 rounded shrink-0 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {filteredRubriks.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                Tidak ada rubrik olahraga ditemukan.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Rubric Indicators View */}
      <div className="lg:col-span-8">
        {activeRubrik ? (
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded">
                  Kategori: {activeRubrik.kategori}
                </span>
                <h2 className="text-lg font-black text-slate-800 mt-2">
                  Rubrik Penilaian Motorik: {activeRubrik.materi}
                </h2>
                <p className="text-xs text-slate-400 mt-1">Gunakan rubrik kriteria ini untuk mengevaluasi gerak fisik secara presisi dan objektif.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0 no-print">
                <ExportJsonPromptAiButtons
                  variant="compact"
                  onExportJson={() => {
                    const filename = `Rubrik_Penilaian_${(activeRubrik.materi || 'Fisik').replace(/\s+/g, '_')}.json`;
                    downloadJsonFile(filename, activeRubrik);
                  }}
                  onOpenPromptAi={() => setShowPromptModal(true)}
                />
                <button
                  disabled={isExportingPdf}
                  onClick={async () => {
                    if (!activeRubrik || isExportingPdf) return;
                    setIsExportingPdf(true);
                    try {
                      const docContent = exportRubrikToDoc(activeRubrik);
                      const filename = `Rubrik_PJOK_${activeRubrik.materi.replace(/\s+/g, '_')}`;
                      const success = await downloadHtmlAsPdf(filename, docContent, {
                        title: `Rubrik Penilaian Motorik - ${activeRubrik.materi}`,
                        orientation: 'portrait'
                      });
                      if (!success) {
                        printHtmlDocument(docContent, `Rubrik Penilaian - ${activeRubrik.materi}`);
                      }
                    } catch (err) {
                      console.error(err);
                      const docContent = exportRubrikToDoc(activeRubrik);
                      printHtmlDocument(docContent, `Rubrik Penilaian - ${activeRubrik.materi}`);
                    } finally {
                      setIsExportingPdf(false);
                    }
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-75"
                >
                  <Download className="w-3.5 h-3.5 text-rose-600" />
                  {isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF'}
                </button>
                <button
                  onClick={() => {
                    const docContent = exportRubrikToDoc(activeRubrik);
                    downloadDocFile(`Rubrik_PJOK_${activeRubrik.materi.replace(/\s+/g, '_')}`, docContent);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-600" />}
                  {isCopied ? 'Dokumen Diunduh!' : 'Unduh .Doc'}
                </button>
                <button
                  onClick={() => {
                    const docContent = exportRubrikToDoc(activeRubrik);
                    printHtmlDocument(docContent, `Rubrik Penilaian - ${activeRubrik.materi}`);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" /> Cetak
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {activeRubrik.indikator.map((ind, idx) => (
                <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                  {/* Indicator Title Bar */}
                  <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                    <div className="p-1 bg-emerald-500/10 text-emerald-600 rounded">
                      <Award className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-xs">
                      Indikator {idx + 1}: {ind.nama}
                    </h3>
                  </div>

                  {/* Kriteria Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {/* Bagian Bagus */}
                    <div className="p-4 bg-emerald-50/5 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 block w-max uppercase">
                        Sangat Baik / Bagus (86-100)
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed pt-1.5">
                        {ind.kriteriaBagus}
                      </p>
                    </div>

                    {/* Bagian Cukup */}
                    <div className="p-4 bg-amber-50/5 space-y-1">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 block w-max uppercase">
                        Cukup / Layak (71-85)
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed pt-1.5">
                        {ind.kriteriaCukup}
                      </p>
                    </div>

                    {/* Bagian Kurang */}
                    <div className="p-4 bg-rose-50/5 space-y-1">
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 block w-max uppercase">
                        Perlu Bimbingan (0-70)
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed pt-1.5">
                        {ind.kriteriaKurang}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-xl border border-slate-100 shadow-sm text-center text-slate-400">
            Pilih rubrik penilaian fisik di panel samping atau buat rubrik gerak baru secara otomatis menggunakan AI.
          </div>
        )}
      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Rubrik Penilaian Kinerja Praktik PJOK"
        subtitle={activeRubrik ? `${activeRubrik.materi} (${activeRubrik.kategori})` : 'Kriteria Penilaian Gerak Otentik'}
        tabs={getRubrikFisikPrompts(activeRubrik?.materi)}
        defaultActiveTab="rubrik_gerak"
        jsonData={activeRubrik || rubriks}
        jsonFilename={`Rubrik_Penilaian_${(activeRubrik?.materi || 'PJOK').replace(/\s+/g, '_')}.json`}
      />
    </div>
  );
}
