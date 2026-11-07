import React, { useState } from 'react';
import { JurnalMengajar, ClassData } from '../types';
import { 
  Plus, 
  Calendar, 
  User, 
  BookOpen, 
  AlertTriangle, 
  HeartHandshake, 
  ArrowRight,
  ShieldAlert,
  Search,
  CheckCircle,
  Clock,
  Trash2,
  Printer,
  Copy,
  Check,
  FileDown
} from 'lucide-react';
import { exportJurnalToDoc, downloadDocFile, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getJurnalPrompts } from '../utils/aiPromptGenerators';

interface JurnalViewProps {
  journals: JurnalMengajar[];
  classes: ClassData[];
  onAddJournal: (journal: JurnalMengajar) => void;
  onDeleteJournal: (id: string) => void;
}

export default function JurnalView({ journals, classes, onAddJournal, onDeleteJournal }: JurnalViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [materi, setMateri] = useState('');
  const [catatanKejadian, setCatatanKejadian] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState('');

  // Quick Preset tags for incident logs
  const handleQuickPreset = (type: 'cedera' | 'sportif' | 'sarana') => {
    if (type === 'cedera') {
      setCatatanKejadian(prev => prev + 'Siswa [Nama] mengalami cedera ringan (keseleo/lecet) saat melakukan latihan [Materi]. Segera ditangani dengan metode RICE (Rest, Ice, Compression, Elevation) di UKS.');
      setTindakLanjut(prev => prev + 'Memantau kesiapan fisik siswa di pertemuan berikutnya. Mengingatkan kembali pentingnya pemanasan.');
    } else if (type === 'sportif') {
      setCatatanKejadian(prev => prev + 'Siswa menunjukkan sikap sportivitas tinggi, bersedia meminjamkan alat olahraga dan menyemangati tim lawan yang kalah.');
      setTindakLanjut(prev => prev + 'Memberikan apresiasi lisan di depan kelas dan poin sikap afektif tambahan.');
    } else if (type === 'sarana') {
      setCatatanKejadian(prev => prev + 'Beberapa bola [Materi] dalam kondisi kempis dan cone pembatas kurang memadai.');
      setTindakLanjut(prev => prev + 'Melaporkan ke bagian sarana prasarana sekolah untuk pengadaan/pompa bola sebelum jam praktik berikutnya.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!classId) {
      setFormError('Rombongan belajar wajib dipilih!');
      return;
    }
    if (!materi.trim()) {
      setFormError('Materi yang diajarkan wajib diisi!');
      return;
    }
    if (!catatanKejadian.trim()) {
      setFormError('Catatan kejadian pembelajaran wajib diisi!');
      return;
    }

    const selectedClass = classes.find(c => c.id === classId);
    if (!selectedClass) {
      setFormError('Kelas terpilih tidak ditemukan!');
      return;
    }

    const newJournal: JurnalMengajar = {
      id: 'journal-' + Date.now(),
      date,
      classId,
      className: selectedClass.name,
      materi: materi.trim(),
      catatanKejadian: catatanKejadian.trim(),
      tindakLanjut: tindakLanjut.trim()
    };

    onAddJournal(newJournal);
    setIsOpen(false);
    setFormError(null);

    // Reset Form
    setMateri('');
    setCatatanKejadian('');
    setTindakLanjut('');
  };

  const filteredJournals = journals.filter(j => 
    j.materi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.catatanKejadian.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section with Action Buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Jurnal Mengajar PJOK</h2>
          <p className="text-xs text-slate-500">Log harian aktivitas mengajar fisik, kejadian luar biasa, cedera, dan pembinaan karakter sportif.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportJsonPromptAiButtons
            onExportJson={() => {
              const filename = `Jurnal_Mengajar_PJOK_${new Date().toISOString().split('T')[0]}.json`;
              downloadJsonFile(filename, journals);
            }}
            onOpenPromptAi={() => setShowPromptModal(true)}
          />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {isOpen ? 'Tutup Form Jurnal' : 'Tambah Jurnal Baru'}
          </button>
        </div>
      </div>

      {/* Write Jurnal Panel */}
      {isOpen && (
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <div className="border-b border-slate-50 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Catat Jurnal Pembelajaran Hari Ini</h3>
            <p className="text-[10px] text-slate-500">Pendataan autentik pasca-praktik di lapangan/halaman sekolah.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-xs flex items-center gap-2 font-bold animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Tanggal Mengajar</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg text-xs pl-9 pr-3 py-2 text-slate-700"
                    required
                  />
                </div>
              </div>

              {/* Class Select */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Rombongan Belajar</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 text-slate-700"
                  required
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Materi */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Materi yang Diajarkan</label>
                <input
                  type="text"
                  value={materi}
                  onChange={(e) => setMateri(e.target.value)}
                  placeholder="Contoh: Senam Ketangkasan Lompat"
                  className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 text-slate-700"
                  required
                />
              </div>
            </div>

            {/* Quick Presets for PJOK */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 block">Template Insiden & Kondisi Lapangan (Klik untuk Isi Instan)</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickPreset('cedera')}
                  className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> + Penanganan Cedera Ringan
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('sportif')}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-all cursor-pointer"
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" /> + Karakter Sportif & Gotong Royong
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('sarana')}
                  className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> + Kendala Alat & Lapangan
                </button>
              </div>
            </div>

            {/* Incident Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Catatan Kejadian Pembelajaran</label>
              <textarea
                value={catatanKejadian}
                onChange={(e) => setCatatanKejadian(e.target.value)}
                placeholder="Tuliskan jalannya kelas, respon siswa, kecelakaan/cedera fisik, perselisihan, atau capaian istimewa murid."
                rows={3}
                className="w-full border border-slate-200 rounded-lg text-xs p-3 text-slate-700"
                required
              ></textarea>
            </div>

            {/* Follow up */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Tindak Lanjut / Solusi Guru</label>
              <textarea
                value={tindakLanjut}
                onChange={(e) => setTindakLanjut(e.target.value)}
                placeholder="Rencana perbaikan di rombel berikutnya, koordinasi wali kelas/orang tua, atau servis sarana prasarana."
                rows={2}
                className="w-full border border-slate-200 rounded-lg text-xs p-3 text-slate-700"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-950 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-slate-800 transition-all shadow"
            >
              Simpan Jurnal PJOK
            </button>
          </form>
        </div>
      )}

      {/* Export & Cetak Bar (no-print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150 no-print">
        <div className="text-xs">
          <p className="font-extrabold text-slate-800">Administrasi Jurnal Mengajar</p>
          <p className="text-[10px] text-slate-500 font-medium">Cetak seluruh catatan jurnal mengajar atau salin kode Tailwind CSS rapi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const docContent = exportJurnalToDoc(filteredJournals);
              downloadDocFile(`Jurnal_Mengajar_PJOK_F4`, docContent);
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-600" />}
            {isCopied ? 'Dokumen Diunduh!' : 'Unduh Word (.doc)'}
          </button>
          <button
            onClick={async () => {
              if (isExportingPdf) return;
              setIsExportingPdf(true);
              try {
                const docContent = exportJurnalToDoc(filteredJournals);
                const success = await downloadHtmlAsPdf('Jurnal_Mengajar_PJOK_F4.pdf', docContent, {
                  orientation: 'portrait',
                  marginMm: 12
                });
                if (!success) {
                  printHtmlDocument(docContent, 'Jurnal Mengajar PJOK F4');
                }
              } finally {
                setIsExportingPdf(false);
              }
            }}
            disabled={isExportingPdf}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            {isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF (F4)'}
          </button>
          <button
            onClick={() => {
              const docContent = exportJurnalToDoc(filteredJournals);
              printHtmlDocument(docContent, 'Jurnal Mengajar PJOK F4');
            }}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" /> Cetak F4
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari materi atau rombel..."
            className="w-full border border-slate-200 rounded-lg text-xs pl-9 pr-3 py-2 text-slate-700"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">Menampilkan {filteredJournals.length} Catatan Jurnal</span>
      </div>

      {/* Jurnal List */}
      <div className="space-y-4">
        {filteredJournals.map(j => (
          <div key={j.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3 relative overflow-hidden">
            {/* Left Accent indicator for PJOK context */}
            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-emerald-500"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md">
                  {j.className}
                </span>
                <span className="text-slate-400 text-xs font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {j.date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {j.catatanKejadian.includes('cedera') && (
                    <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-100">
                      Insiden Cedera
                    </span>
                  )}
                  {(j.catatanKejadian.includes('sportivitas') || j.catatanKejadian.includes('sportif')) && (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100">
                      Nilai Karakter
                    </span>
                  )}
                </div>

                {deletingId === j.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        onDeleteJournal(j.id);
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
                    onClick={() => setDeletingId(j.id)}
                    className="text-slate-300 hover:text-rose-600 p-1 rounded shrink-0 transition-colors cursor-pointer"
                    title="Hapus Jurnal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-sm text-slate-800">Materi: {j.materi}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Catatan Kelas:</strong> {j.catatanKejadian}
              </p>
            </div>

            {j.tindakLanjut && (
              <div className="p-3.5 bg-emerald-50/20 border border-emerald-100/50 rounded-lg text-xs text-slate-700 flex items-start gap-2">
                <div className="p-1 bg-emerald-500/10 rounded text-emerald-600 shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-emerald-800">Tindak Lanjut Guru:</strong> {j.tindakLanjut}
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredJournals.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
            Tidak menemukan catatan jurnal yang cocok.
          </div>
        )}
      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Jurnal Refleksi Mengajar PJOK"
        subtitle={`Total ${journals.length} Catatan Kejadian & Refleksi Pembelajaran`}
        tabs={getJurnalPrompts(journals.length)}
        defaultActiveTab="refleksi_jurnal"
        jsonData={journals}
        jsonFilename={`Jurnal_Mengajar_PJOK_${new Date().toISOString().split('T')[0]}.json`}
      />
    </div>
  );
}
