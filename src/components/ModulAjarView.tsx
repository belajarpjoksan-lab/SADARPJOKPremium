import React, { useState } from 'react';
import { ModulAjar } from '../types';
import { 
  Plus, 
  Sparkles, 
  FileText, 
  Download, 
  Printer, 
  Trash2, 
  BookOpen, 
  Clock, 
  Map, 
  CheckCircle, 
  Briefcase,
  Layers,
  Check,
  AlertCircle,
  Copy
} from 'lucide-react';
import { exportModulToDoc, downloadDocFile, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getModulAjarPrompts } from '../utils/aiPromptGenerators';
import SibiUnitSelectorBar from './SibiUnitSelectorBar';

interface ModulAjarViewProps {
  moduls: ModulAjar[];
  onAddModul: (modul: ModulAjar) => void;
  onDeleteModul: (id: string) => void;
}

export default function ModulAjarView({ moduls, onAddModul, onDeleteModul }: ModulAjarViewProps) {
  const [activeModulId, setActiveModulId] = useState<string>(moduls[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // AI Form state
  const [aiMateri, setAiMateri] = useState('');
  const [aiGrade, setAiGrade] = useState('1');
  const [aiAlokasi, setAiAlokasi] = useState('2 x 35 Menit (1 Pertemuan)');

  // Manual Form State
  const [manualTitle, setManualTitle] = useState('');
  const [manualGrade, setManualGrade] = useState('1');
  const [manualSemester, setManualSemester] = useState('1');
  const [manualMateri, setManualMateri] = useState('');
  const [manualAlokasi, setManualAlokasi] = useState('2 x 35 Menit');
  const [manualTujuan, setManualTujuan] = useState('');
  const [manualPendahuluan, setManualPendahuluan] = useState('');
  const [manualInti, setManualInti] = useState('');
  const [manualPenutup, setManualPenutup] = useState('');
  const [manualSarana, setManualSarana] = useState('');
  const [manualRubrik, setManualRubrik] = useState('');

  const activeModul = moduls.find(m => m.id === activeModulId);

  const handleGenerateAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMateri.trim()) return;

    setIsGenerating(true);
    setApiError(null);

    try {
      const response = await fetch('/api/generate-modul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: aiGrade,
          materi: aiMateri,
          alokasiWaktu: aiAlokasi
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Terjadi kesalahan saat memanggil Gemini API.');
      }

      const data = await response.json();
      const newModul: ModulAjar = {
        id: 'modul-ai-' + Date.now(),
        title: data.title || `Modul Ajar PJOK Kelas ${aiGrade} - ${aiMateri}`,
        grade: parseInt(aiGrade),
        semester: 1,
        materiPokok: data.materiPokok || aiMateri,
        alokasiWaktu: data.alokasiWaktu || aiAlokasi,
        tujuanPembelajaran: data.tujuanPembelajaran || [],
        kegiatanPembelajaran: {
          pendahuluan: data.kegiatanPembelajaran?.pendahuluan || [],
          inti: data.kegiatanPembelajaran?.inti || [],
          penutup: data.kegiatanPembelajaran?.penutup || []
        },
        saranaPrasarana: data.saranaPrasarana || [],
        rubrikPenilaian: data.rubrikPenilaian || '',
        createdAt: new Date().toISOString().split('T')[0],
        isAiGenerated: true
      };

      onAddModul(newModul);
      setActiveModulId(newModul.id);
      setAiMateri('');
    } catch (err: any) {
      setApiError(err.message || 'Gagal generate modul ajar dengan AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualMateri.trim()) return;

    const newModul: ModulAjar = {
      id: 'modul-man-' + Date.now(),
      title: manualTitle,
      grade: parseInt(manualGrade),
      semester: parseInt(manualSemester) as 1 | 2,
      materiPokok: manualMateri,
      alokasiWaktu: manualAlokasi,
      tujuanPembelajaran: manualTujuan.split('\n').filter(t => t.trim() !== ''),
      kegiatanPembelajaran: {
        pendahuluan: manualPendahuluan.split('\n').filter(p => p.trim() !== ''),
        inti: manualInti.split('\n').filter(i => i.trim() !== ''),
        penutup: manualPenutup.split('\n').filter(pn => pn.trim() !== '')
      },
      saranaPrasarana: manualSarana.split('\n').filter(s => s.trim() !== ''),
      rubrikPenilaian: manualRubrik,
      createdAt: new Date().toISOString().split('T')[0],
      isAiGenerated: false
    };

    onAddModul(newModul);
    setActiveModulId(newModul.id);
    setIsManualOpen(false);

    // Reset Form
    setManualTitle('');
    setManualMateri('');
    setManualTujuan('');
    setManualPendahuluan('');
    setManualInti('');
    setManualPenutup('');
    setManualSarana('');
    setManualRubrik('');
  };

  const printModul = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar - List of Moduls */}
      <div className="lg:col-span-4 space-y-4 no-print">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm">Dokumen Modul Ajar</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {moduls.length} RPP
            </span>
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {moduls.map(m => (
              <div
                key={m.id}
                onClick={() => setActiveModulId(m.id)}
                className={`group cursor-pointer p-3 rounded-lg border text-left transition-all flex items-start gap-3 ${
                  activeModulId === m.id
                    ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900'
                    : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-2 rounded mt-0.5 ${
                  activeModulId === m.id ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs truncate group-hover:text-emerald-700 transition-colors">
                    {m.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span>Kelas {m.grade}</span>
                    <span>•</span>
                    <span>Sem {m.semester}</span>
                    {m.isAiGenerated && (
                      <span className="bg-teal-50 text-teal-600 font-medium px-1.5 py-0.2 rounded-full border border-teal-100 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </span>
                    )}
                  </div>
                </div>
                {deletingId === m.id ? (
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        onDeleteModul(m.id);
                        if (activeModulId === m.id) {
                          const remaining = moduls.filter(x => x.id !== m.id);
                          if (remaining.length > 0) {
                            setActiveModulId(remaining[0].id);
                          } else {
                            setActiveModulId('');
                          }
                        }
                        setDeletingId(null);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(m.id);
                    }}
                    className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {moduls.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                Belum ada dokumen Modul Ajar. Buat otomatis di bawah ini!
              </div>
            )}
          </div>

          <button
            onClick={() => setIsManualOpen(true)}
            className="w-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-slate-500" /> Tulis Manual RPP
          </button>
        </div>

        {/* AI Modul Builder Panel */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-xl shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">SADAR AI RPP Generator</h3>
              <p className="text-[10px] text-slate-300">Buat Modul Ajar Kurikulum Merdeka Terverifikasi</p>
            </div>
          </div>

          <form onSubmit={handleGenerateAi} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Sasaran Kelas</label>
              <select
                value={aiGrade}
                onChange={(e) => setAiGrade(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/80 text-white rounded-lg text-xs px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="1">Kelas 1 SD (Fase A)</option>
                <option value="2">Kelas 2 SD (Fase A)</option>
                <option value="3">Kelas 3 SD (Fase B)</option>
                <option value="4">Kelas 4 SD (Fase B)</option>
                <option value="5">Kelas 5 SD (Fase C)</option>
                <option value="6">Kelas 6 SD (Fase C)</option>
              </select>
            </div>

            <div className="bg-white rounded-xl p-1 text-slate-800">
              <SibiUnitSelectorBar
                grade={aiGrade}
                selectedMateri={aiMateri}
                onSelectUnit={(unit) => {
                  setAiMateri(`${unit.unitCode}: ${unit.pokokMateri}`);
                  setAiAlokasi(`${unit.alokasiJp} (${unit.alokasiPertemuan})`);
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Materi Pembelajaran PJOK (SIBI)</label>
              <input
                type="text"
                value={aiMateri}
                onChange={(e) => setAiMateri(e.target.value)}
                placeholder="Contoh: Gerak Kombinasi Guling Depan"
                className="w-full bg-slate-800/80 border border-slate-700/80 text-white rounded-lg text-xs px-3 py-2 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Alokasi Waktu</label>
              <input
                type="text"
                value={aiAlokasi}
                onChange={(e) => setAiAlokasi(e.target.value)}
                placeholder="Contoh: 2 x 35 Menit (1 Pertemuan)"
                className="w-full bg-slate-800/80 border border-slate-700/80 text-white rounded-lg text-xs px-3 py-2 text-white focus:outline-none"
              />
            </div>

            {apiError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-[10px] flex gap-1.5 items-start">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-500/10 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Menyusun RPP PJOK...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Susun RPP dengan AI
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Main Content - Document Viewer */}
      <div className="lg:col-span-8">
        {isManualOpen ? (
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Tulis Modul Ajar Secara Manual</h3>
                <p className="text-xs text-slate-500">Isi formulir berikut untuk membuat RPP sesuai preferensi Anda.</p>
              </div>
              <button 
                onClick={() => setIsManualOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Batal
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Judul RPP</label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Contoh: Kebugaran Jasmani Dasar"
                    className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Sasaran Kelas</label>
                  <select
                    value={manualGrade}
                    onChange={(e) => setManualGrade(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>Kelas {n} SD</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Semester</label>
                  <select
                    value={manualSemester}
                    onChange={(e) => setManualSemester(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2"
                  >
                    <option value="1">Semester I (Ganjil)</option>
                    <option value="2">Semester II (Genap)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Materi Pokok</label>
                  <input
                    type="text"
                    value={manualMateri}
                    onChange={(e) => setManualMateri(e.target.value)}
                    placeholder="Contoh: Gerak Lokomotor Berlari"
                    className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Alokasi Waktu</label>
                  <input
                    type="text"
                    value={manualAlokasi}
                    onChange={(e) => setManualAlokasi(e.target.value)}
                    placeholder="Contoh: 2 x 35 Menit"
                    className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Tujuan Pembelajaran (Satu baris per tujuan)</label>
                <textarea
                  value={manualTujuan}
                  onChange={(e) => setManualTujuan(e.target.value)}
                  placeholder="Siswa dapat mendemonstrasikan gerakan lari&#10;Siswa memahami teknik dasar tumpuan kaki"
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg text-xs p-3"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Kegiatan Pendahuluan (Per baris)</label>
                  <textarea
                    value={manualPendahuluan}
                    onChange={(e) => setManualPendahuluan(e.target.value)}
                    placeholder="Baris berbaris dan mengabsen&#10;Pemanasan dinamis sirkuit"
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg text-xs p-3"
                  ></textarea>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Kegiatan Inti (Per baris)</label>
                  <textarea
                    value={manualInti}
                    onChange={(e) => setManualInti(e.target.value)}
                    placeholder="Mendemonstrasikan gerakan&#10;Melakukan latihan 3 repetisi"
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg text-xs p-3"
                  ></textarea>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Kegiatan Penutup (Per baris)</label>
                  <textarea
                    value={manualPenutup}
                    onChange={(e) => setManualPenutup(e.target.value)}
                    placeholder="Cooling down & peregangan&#10;Umpan balik & doa penutup"
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg text-xs p-3"
                  ></textarea>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Sarana & Prasarana (Satu baris per alat)</label>
                <textarea
                  value={manualSarana}
                  onChange={(e) => setManualSarana(e.target.value)}
                  placeholder="Peluit&#10;Matras olahraga&#10;Cone pembatas"
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg text-xs p-3"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Rubrik Penilaian Performa</label>
                <textarea
                  value={manualRubrik}
                  onChange={(e) => setManualRubrik(e.target.value)}
                  placeholder="Kriteria penilaian keterampilan fisik murid..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg text-xs p-3"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-slate-800 transition-all shadow"
              >
                Simpan Modul Ajar
              </button>
            </form>
          </div>
        ) : activeModul ? (
          /* Printed Content framed inside a modern layout */
          <div id="printable-modul" className="bg-white p-6 md:p-8 rounded-xl border border-slate-100 shadow-sm space-y-6">
            
            {/* Control Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Dokumen Terpilih</span>
                {activeModul.isAiGenerated && (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-3 h-3" /> AI Generated
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ExportJsonPromptAiButtons
                  variant="compact"
                  onExportJson={() => {
                    const filename = `Modul_Ajar_${(activeModul.materiPokok || 'PJOK').replace(/\s+/g, '_')}_Kelas_${activeModul.grade}.json`;
                    downloadJsonFile(filename, activeModul);
                  }}
                  onOpenPromptAi={() => setShowPromptModal(true)}
                />
                <button
                  disabled={isExportingPdf}
                  onClick={async () => {
                    if (!activeModul || isExportingPdf) return;
                    setIsExportingPdf(true);
                    try {
                      const docContent = exportModulToDoc(activeModul);
                      const filename = `Modul_Ajar_PJOK_${activeModul.materiPokok.replace(/\s+/g, '_')}_Kelas_${activeModul.grade}`;
                      const success = await downloadHtmlAsPdf(filename, docContent, {
                        title: `Modul Ajar PJOK - ${activeModul.materiPokok}`,
                        orientation: 'portrait'
                      });
                      if (!success) {
                        printHtmlDocument(docContent, `Modul Ajar - ${activeModul.materiPokok}`);
                      }
                    } catch (err) {
                      console.error(err);
                      const docContent = exportModulToDoc(activeModul);
                      printHtmlDocument(docContent, `Modul Ajar - ${activeModul.materiPokok}`);
                    } finally {
                      setIsExportingPdf(false);
                    }
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-75"
                >
                  <Download className="w-4 h-4 text-rose-600" />
                  {isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF'}
                </button>
                <button
                  onClick={() => {
                    const docContent = exportModulToDoc(activeModul);
                    downloadDocFile(`Modul_Ajar_PJOK_${activeModul.materiPokok.replace(/\s+/g, '_')}`, docContent);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-600" />}
                  {isCopied ? 'Dokumen Diunduh!' : 'Unduh .Doc'}
                </button>
                <button
                  onClick={() => {
                    const docContent = exportModulToDoc(activeModul);
                    printHtmlDocument(docContent, `Modul Ajar PJOK - ${activeModul.materiPokok}`);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" /> Cetak
                </button>
              </div>
            </div>

            {/* Document Header */}
            <div className="text-center border-b-2 border-slate-800 pb-5 space-y-1">
              <h2 className="text-lg font-black tracking-tight uppercase text-slate-800">
                MODUL AJAR KURIKULUM MERDEKA
              </h2>
              <h3 className="text-base font-bold text-slate-700">
                PENDIDIKAN JASMANI, OLAHRAGA, DAN KESEHATAN (PJOK)
              </h3>
              <p className="text-xs text-slate-500 font-medium font-mono">SADAR PJOK - ADMINISTRASI PREMIUM</p>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs border border-slate-100">
              <div className="space-y-1.5">
                <p className="flex justify-between border-b border-slate-200/50 pb-1">
                  <span className="font-semibold text-slate-500">Mata Pelajaran:</span>
                  <span className="text-slate-800 font-medium">PJOK SD</span>
                </p>
                <p className="flex justify-between border-b border-slate-200/50 pb-1">
                  <span className="font-semibold text-slate-500">Fase / Kelas:</span>
                  <span className="text-slate-800 font-medium">
                    {activeModul.grade <= 2 ? 'A' : activeModul.grade <= 4 ? 'B' : 'C'} / Kelas {activeModul.grade}
                  </span>
                </p>
                <p className="flex justify-between border-b border-slate-200/50 pb-1">
                  <span className="font-semibold text-slate-500">Semester:</span>
                  <span className="text-slate-800 font-medium">{activeModul.semester} (Ganjil)</span>
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="flex justify-between border-b border-slate-200/50 pb-1">
                  <span className="font-semibold text-slate-500">Materi Pokok:</span>
                  <span className="text-slate-800 font-medium truncate max-w-[180px]">{activeModul.materiPokok}</span>
                </p>
                <p className="flex justify-between border-b border-slate-200/50 pb-1">
                  <span className="font-semibold text-slate-500">Alokasi Waktu:</span>
                  <span className="text-slate-800 font-medium">{activeModul.alokasiWaktu}</span>
                </p>
                <p className="flex justify-between border-b border-slate-200/50 pb-1">
                  <span className="font-semibold text-slate-500">Penyusun:</span>
                  <span className="text-emerald-700 font-semibold">SADAR Premium AI</span>
                </p>
              </div>
            </div>

            {/* Objectives */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                <BookOpen className="w-4 h-4 text-emerald-600" /> I. Kompetensi & Tujuan Pembelajaran
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                {activeModul.tujuanPembelajaran.map((tp, idx) => (
                  <li key={idx}>{tp}</li>
                ))}
              </ul>
            </div>

            {/* Infrastructure / Materials */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                <Briefcase className="w-4 h-4 text-emerald-600" /> II. Sarana Dan Prasarana
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeModul.saranaPrasarana.map((sp, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 text-[11px] px-2.5 py-1 rounded-md border border-slate-200/50">
                    {sp}
                  </span>
                ))}
              </div>
            </div>

            {/* Learning Activities (The core layout) */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                <Map className="w-4 h-4 text-emerald-600" /> III. Langkah-Langkah Pembelajaran (Kurikulum Merdeka)
              </h4>

              {/* Pendahuluan */}
              <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50 space-y-2">
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded">
                  A. Pendahuluan (15 Menit)
                </span>
                <ul className="list-decimal pl-5 space-y-1 text-xs text-slate-600">
                  {activeModul.kegiatanPembelajaran.pendahuluan.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>

              {/* Inti */}
              <div className="border border-slate-100 rounded-lg p-4 bg-emerald-50/10 space-y-2">
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">
                  B. Kegiatan Inti (45 Menit)
                </span>
                <ul className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700">
                  {activeModul.kegiatanPembelajaran.inti.map((i, idx) => (
                    <li key={idx} className="leading-relaxed">{i}</li>
                  ))}
                </ul>
              </div>

              {/* Penutup */}
              <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50 space-y-2">
                <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                  C. Penutup & Umpan Balik (10 Menit)
                </span>
                <ul className="list-decimal pl-5 space-y-1 text-xs text-slate-600">
                  {activeModul.kegiatanPembelajaran.penutup.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Assessment rubric */}
            {activeModul.rubrikPenilaian && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> IV. Penilaian & Rubrik Capaian
                </h4>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {activeModul.rubrikPenilaian}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-xl border border-slate-100 shadow-sm text-center text-slate-400">
            Pilih Modul Ajar di menu samping atau gunakan RPP AI Generator untuk menyusun Modul PJOK instan!
          </div>
        )}
      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Modul Ajar PJOK Kurikulum Merdeka"
        subtitle={activeModul ? `${activeModul.materiPokok} (Kelas ${activeModul.grade})` : 'Penyusunan RPP & Modul Ajar PJOK Berdiferensiasi'}
        tabs={getModulAjarPrompts(activeModul)}
        defaultActiveTab="diferensiasi_modul"
        jsonData={activeModul || moduls}
        jsonFilename={activeModul ? `Modul_Ajar_${activeModul.materiPokok.replace(/\s+/g, '_')}_Kelas_${activeModul.grade}.json` : 'Daftar_Modul_Ajar_PJOK.json'}
      />
    </div>
  );
}
