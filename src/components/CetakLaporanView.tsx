import React, { useState, useRef } from 'react';
import { ClassData, ModulAjar, JurnalMengajar, RubrikFisik } from '../types';
import { 
  Printer, 
  Settings2, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  Layers, 
  School, 
  User, 
  Check, 
  Info,
  Award,
  Download,
  Loader2
} from 'lucide-react';
import { downloadElementAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import { downloadJsonFile, downloadDocFile } from '../lib/exportUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getKodeEtikKkoCetakPrompts } from '../utils/aiPromptGenerators';

interface CetakLaporanViewProps {
  classes: ClassData[];
  moduls: ModulAjar[];
  journals: JurnalMengajar[];
  rubriks: RubrikFisik[];
}

export default function CetakLaporanView({ classes, moduls, journals, rubriks }: CetakLaporanViewProps) {
  // Config States
  const [docType, setDocType] = useState<'rapor' | 'modul' | 'jurnal' | 'rubrik'>('rapor');
  
  // Context selection states
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedModulId, setSelectedModulId] = useState<string>(moduls[0]?.id || '');
  const [selectedRubrikId, setSelectedRubrikId] = useState<string>(rubriks[0]?.id || '');
  const [jurnalFilter, setJurnalFilter] = useState<'all' | 'class'>('all');
  const [jurnalClassId, setJurnalClassId] = useState<string>(classes[0]?.id || '');

  // Institutional Details State
  const [schoolName, setSchoolName] = useState('SD Negeri Kalimantong');
  const [schoolAddress, setSchoolAddress] = useState('Jl. Pendidikan Olahraga No. 88, Jakarta Selatan');
  const [schoolDistrict, setSchoolDistrict] = useState('Kecamatan Kebayoran Baru, Kota Jakarta Selatan');
  const [teacherName, setTeacherName] = useState('Sandi Rafsanjani, S.Pd.');
  const [teacherNip, setTeacherNip] = useState('19940812 202321 1 002');
  const [principalName, setPrincipalName] = useState('H. Ahmad Dahlan, M.Pd.');
  const [principalNip, setPrincipalNip] = useState('19780102 200501 1 003');
  const [printDate, setPrintDate] = useState(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
  const [printCity, setPrintCity] = useState('Jakarta');

  // Print Settings Options
  const [showKop, setShowKop] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Active object finders
  const activeClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const activeModul = moduls.find(m => m.id === selectedModulId) || moduls[0];
  const activeRubrik = rubriks.find(r => r.id === selectedRubrikId) || rubriks[0];
  
  // Filtered journals
  const filteredJournals = journals.filter(j => {
    if (jurnalFilter === 'all') return true;
    return j.classId === jurnalClassId;
  });

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const filename = `Laporan_${docType.toUpperCase()}_${schoolName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}`;
      const success = await downloadElementAsPdf(printAreaRef.current, filename, {
        orientation: 'portrait',
        marginMm: 8,
        scale: 2
      });

      if (!success) {
        if (printAreaRef.current) {
          printHtmlDocument(printAreaRef.current.innerHTML, `Laporan ${docType.toUpperCase()}`);
        }
      }
    } catch (err) {
      console.error('PDF export error:', err);
      if (printAreaRef.current) {
        printHtmlDocument(printAreaRef.current.innerHTML, `Laporan ${docType.toUpperCase()}`);
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    if (printAreaRef.current) {
      printHtmlDocument(printAreaRef.current.innerHTML, `Cetak Administrasi & Laporan PJOK - ${docType.toUpperCase()}`);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title & Actions (Hidden on Print) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Printer className="w-6 h-6 text-emerald-600" />
            Cetak Administrasi & Laporan PJOK
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ekspor dan cetak lembar administrasi guru dengan tabel rapi, KOP resmi, dan tanda tangan terstandarisasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ExportJsonPromptAiButtons
            onExportJson={() => {
              const filename = `Cetak_Laporan_${docType}_PJOK.json`;
              const payload = {
                tipeDokumen: docType,
                sekolah: schoolName,
                alamat: schoolAddress,
                guru: teacherName,
                nipGuru: teacherNip,
                kepsek: principalName,
                nipKepsek: principalNip,
                kota: printCity,
                tanggal: printDate,
                dataDokumen: docType === 'rapor' ? activeClass : docType === 'modul' ? activeModul : docType === 'jurnal' ? filteredJournals : activeRubrik
              };
              downloadJsonFile(filename, payload);
            }}
            onOpenPromptAi={() => setShowPromptModal(true)}
          />

          <button
            type="button"
            onClick={() => {
              if (!printAreaRef.current) return;
              const filename = `Laporan_${docType.toUpperCase()}_F4_${schoolName.replace(/\s+/g, '_')}.doc`;
              downloadDocFile(filename, printAreaRef.current.innerHTML, 'portrait');
            }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>Unduh Word (F4)</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-rose-500/10 hover:shadow-lg hover:shadow-rose-500/15 transition-all cursor-pointer shrink-0 disabled:opacity-75"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh PDF (F4)</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/15 transition-all cursor-pointer shrink-0"
          >
            <Printer className="w-4 h-4" />
            Cetak Dokumen (F4)
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Document & Print Configuration Controllers (Hidden on Print) */}
        <div className="lg:col-span-4 space-y-6 no-print">
          
          {/* Document Selector */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-slate-400" />
              1. Pilih Tipe Dokumen
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => setDocType('rapor')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl font-semibold text-xs text-left transition-all border ${
                  docType === 'rapor' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600'
                }`}
              >
                <FileSpreadsheet className={`w-5 h-5 shrink-0 ${docType === 'rapor' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <p className="font-bold">Laporan Daftar Nilai & Presensi</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Tabel rekap nilai kognitif, psikomotorik & absensi kelas</p>
                </div>
              </button>

              <button
                onClick={() => setDocType('modul')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl font-semibold text-xs text-left transition-all border ${
                  docType === 'modul' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600'
                }`}
              >
                <FileText className={`w-5 h-5 shrink-0 ${docType === 'modul' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <p className="font-bold">Modul Ajar / RPP Resmi</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Dokumen RPP PJOK lengkap Kurikulum Merdeka</p>
                </div>
              </button>

              <button
                onClick={() => setDocType('jurnal')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl font-semibold text-xs text-left transition-all border ${
                  docType === 'jurnal' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600'
                }`}
              >
                <Calendar className={`w-5 h-5 shrink-0 ${docType === 'jurnal' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <p className="font-bold">Jurnal Harian Mengajar</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Catatan kejadian penting kelas & tindak lanjut guru</p>
                </div>
              </button>

              <button
                onClick={() => setDocType('rubrik')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl font-semibold text-xs text-left transition-all border ${
                  docType === 'rubrik' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600'
                }`}
              >
                <Layers className={`w-5 h-5 shrink-0 ${docType === 'rubrik' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <p className="font-bold">Rubrik Evaluasi Fisik AI</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Matriks indikator penilaian performa & gerak</p>
                </div>
              </button>
            </div>
          </div>

          {/* Contextual Selector Options */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-slate-400" />
              2. Saring Sumber Data
            </h3>

            {docType === 'rapor' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">Pilih Kelas / Rombel</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-emerald-600"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.students.length} Siswa)</option>
                  ))}
                </select>
              </div>
            )}

            {docType === 'modul' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">Pilih Modul Ajar RPP</label>
                <select
                  value={selectedModulId}
                  onChange={(e) => setSelectedModulId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-emerald-600"
                >
                  {moduls.map(m => (
                    <option key={m.id} value={m.id}>{m.title} (Kelas {m.grade})</option>
                  ))}
                </select>
                {moduls.length === 0 && (
                  <p className="text-[10px] text-rose-500 font-semibold">Belum ada modul ajar yang tersimpan.</p>
                )}
              </div>
            )}

            {docType === 'jurnal' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Filter Jurnal</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setJurnalFilter('all')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        jurnalFilter === 'all' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Semua Jurnal
                    </button>
                    <button
                      onClick={() => setJurnalFilter('class')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        jurnalFilter === 'class' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Filter Kelas
                    </button>
                  </div>
                </div>

                {jurnalFilter === 'class' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Pilih Kelas</label>
                    <select
                      value={jurnalClassId}
                      onChange={(e) => setJurnalClassId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-emerald-600"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {docType === 'rubrik' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">Pilih Rubrik Kinerja Fisik</label>
                <select
                  value={selectedRubrikId}
                  onChange={(e) => setSelectedRubrikId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-emerald-600"
                >
                  {rubriks.map(r => (
                    <option key={r.id} value={r.id}>{r.materi} ({r.kategori})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Institutional Information */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <School className="w-4 h-4 text-slate-400" />
              3. Info Sekolah & Tanda Tangan
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Sekolah</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100/80 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Sekolah</label>
                <input
                  type="text"
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100/80 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kecamatan / Kota</label>
                <input
                  type="text"
                  value={schoolDistrict}
                  onChange={(e) => setSchoolDistrict(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100/80 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Guru PJOK</label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100/80 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NIP Guru</label>
                  <input
                    type="text"
                    value={teacherNip}
                    onChange={(e) => setTeacherNip(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100/80 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kepala Sekolah</label>
                  <input
                    type="text"
                    value={principalName}
                    onChange={(e) => setPrincipalName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100/80 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NIP Kepsek</label>
                  <input
                    type="text"
                    value={principalNip}
                    onChange={(e) => setPrincipalNip(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100/80 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kota Cetak</label>
                  <input
                    type="text"
                    value={printCity}
                    onChange={(e) => setPrintCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100/80 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tgl Cetak</label>
                  <input
                    type="text"
                    value={printDate}
                    onChange={(e) => setPrintDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100/80 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* Layout options checkboxes */}
              <div className="pt-2 space-y-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showKop}
                    onChange={(e) => setShowKop(e.target.checked)}
                    className="rounded border-slate-200 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-600 select-none">Tampilkan Kop Surat Resmi</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSignatures}
                    onChange={(e) => setShowSignatures(e.target.checked)}
                    className="rounded border-slate-200 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-600 select-none">Tampilkan Kolom Tanda Tangan</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: F4 Document Print Preview Stage */}
        <div className="lg:col-span-8 flex flex-col items-center">
          
          <div className="no-print mb-3 text-xs font-bold text-slate-500 flex items-center gap-1.5 self-start">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pratinjau Kertas F4 / Folio (21,5 cm × 33 cm — Siap Cetak):</span>
          </div>

          {/* Realistic F4 page container */}
          <div 
            ref={printAreaRef}
            className="print-area bg-white text-black p-[1.5cm] w-full max-w-[215mm] min-h-[330mm] shadow-xl border border-slate-200/60 rounded-sm font-serif overflow-hidden relative break-words"
            style={{ fontSize: '12px', lineHeight: '1.5' }}
          >
            
            {/* 1. KOP SURAT (Institutional Header) */}
            {showKop && (
              <div className="border-b-4 border-double border-black pb-3 mb-6 text-center select-all flex flex-col items-center justify-center font-sans">
                <p className="text-xs uppercase font-extrabold tracking-widest text-slate-700">Pemerintah Kota {printCity}</p>
                <p className="text-xs uppercase font-extrabold tracking-widest text-slate-700">Dinas Pendidikan Pemuda Dan Olahraga</p>
                <h2 className="text-lg uppercase font-black text-black leading-tight mt-0.5 tracking-tight">{schoolName}</h2>
                <p className="text-[10px] italic text-slate-500 mt-1">
                  Alamat: {schoolAddress} • {schoolDistrict}
                </p>
                <p className="text-[9px] italic text-slate-500">
                  Telp: (021) 555-3211 • Email: info@{schoolName.toLowerCase().replace(/\s+/g, '')}.sch.id
                </p>
              </div>
            )}

            {/* 2. DYNAMIC DOCUMENT CONTENT */}
            
            {/* DOCUMENT A: RAPOR NILAI & PRESENSI */}
            {docType === 'rapor' && activeClass && (
              <div className="space-y-6 font-sans">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black tracking-wide uppercase underline">DAFTAR NILAI & PRESENSI SISWA PJOK</h3>
                  <p className="text-xs text-slate-600 font-medium">Semester Ganjil • Tahun Ajaran 2026/2027</p>
                </div>

                {/* Document Metadata Table */}
                <table className="w-full text-xs font-semibold text-slate-700">
                  <tbody>
                    <tr>
                      <td className="w-24 py-0.5">Satuan Pendidikan</td>
                      <td className="w-4 py-0.5">:</td>
                      <td className="py-0.5 font-bold">{schoolName}</td>
                      <td className="w-24 py-0.5">Kelas / Rombel</td>
                      <td className="w-4 py-0.5">:</td>
                      <td className="py-0.5 font-bold">{activeClass.name}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Mata Pelajaran</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">Pendidikan Jasmani, Olahraga, & Kesehatan (PJOK)</td>
                      <td className="py-0.5">Fase CP</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">
                        {activeClass.grade <= 2 ? 'Fase A' : activeClass.grade <= 4 ? 'Fase B' : 'Fase C'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Guru PJOK</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">{teacherName}</td>
                      <td className="py-0.5">Tanggal Cetak</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">{printDate}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Main Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-black">
                    <thead>
                      <tr className="bg-slate-100 text-center font-bold">
                        <th className="border border-black px-1.5 py-2 w-8" rowSpan={2}>No</th>
                        <th className="border border-black px-2 py-2 text-left" rowSpan={2}>Nama Lengkap Siswa</th>
                        <th className="border border-black px-1.5 py-2 w-10" rowSpan={2}>L/P</th>
                        <th className="border border-black px-2 py-1" colSpan={4}>Presensi (Kehadiran)</th>
                        <th className="border border-black px-2 py-1" colSpan={3}>Nilai Penilaian (PJOK)</th>
                        <th className="border border-black px-2 py-2 w-16" rowSpan={2}>Rata-rata</th>
                        <th className="border border-black px-2 py-2 text-center" rowSpan={2}>Hasil</th>
                      </tr>
                      <tr className="bg-slate-50 text-center font-bold">
                        <th className="border border-black px-1 py-1 w-7 text-[10px]">H</th>
                        <th className="border border-black px-1 py-1 w-7 text-[10px]">S</th>
                        <th className="border border-black px-1 py-1 w-7 text-[10px]">I</th>
                        <th className="border border-black px-1 py-1 w-7 text-[10px]">A</th>
                        <th className="border border-black px-1 py-1 w-10 text-[10px]">Kog</th>
                        <th className="border border-black px-1 py-1 w-10 text-[10px]">Psi</th>
                        <th className="border border-black px-1 py-1 w-10 text-[10px]">Afe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeClass.students.map((student, idx) => {
                        // Attendance calculation
                        let countH = 0, countS = 0, countI = 0, countA = 0;
                        Object.values(student.attendance || {}).forEach(status => {
                          if (status === 'H') countH++;
                          if (status === 'S') countS++;
                          if (status === 'I') countI++;
                          if (status === 'A') countA++;
                        });

                        // Standard fallbacks for scores
                        const cognitive = student.scores?.cognitive ?? 0;
                        const psychomotor = student.scores?.psychomotor ?? 0;
                        const affective = student.scores?.affective ?? 0;
                        const average = Math.round((cognitive + psychomotor + affective) / 3);
                        const isTuntas = average >= 75;

                        return (
                          <tr key={student.id} className="hover:bg-slate-50 text-slate-800">
                            <td className="border border-black px-1.5 py-1.5 text-center font-bold">{idx + 1}</td>
                            <td className="border border-black px-2 py-1.5 font-medium">{student.name}</td>
                            <td className="border border-black px-1.5 py-1.5 text-center font-bold">{student.gender}</td>
                            <td className="border border-black px-1 py-1.5 text-center font-bold text-emerald-600">{countH || '-'}</td>
                            <td className="border border-black px-1 py-1.5 text-center text-blue-600">{countS || '-'}</td>
                            <td className="border border-black px-1 py-1.5 text-center text-amber-600">{countI || '-'}</td>
                            <td className="border border-black px-1 py-1.5 text-center text-rose-600 font-bold">{countA || '-'}</td>
                            <td className="border border-black px-1 py-1.5 text-center font-medium">{cognitive}</td>
                            <td className="border border-black px-1 py-1.5 text-center font-medium">{psychomotor}</td>
                            <td className="border border-black px-1 py-1.5 text-center font-medium">{affective}</td>
                            <td className="border border-black px-2 py-1.5 text-center font-extrabold bg-slate-50/50">{average}</td>
                            <td className="border border-black px-2 py-1.5 text-center font-bold">
                              {isTuntas ? (
                                <span className="text-emerald-700">Tuntas</span>
                              ) : (
                                <span className="text-rose-600">Perbaikan</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="text-[10px] text-slate-500 font-medium italic">
                  * KBM (Ketuntasan Belajar Minimal) PJOK ditetapkan pada skor 75.<br />
                  * Kog: Pengetahuan/Kognitif | Psi: Keterampilan/Psikomotorik | Afe: Karakter/Afektif.
                </div>
              </div>
            )}

            {/* DOCUMENT B: MODUL AJAR RPP */}
            {docType === 'modul' && activeModul && (
              <div className="space-y-6 font-sans">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black tracking-wide uppercase underline">MODUL AJAR / RENCANA PELAKSANAAN PEMBELAJARAN (RPP)</h3>
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mt-1">KURIKULUM MERDEKA</p>
                </div>

                {/* Section I: INFORMASI UMUM */}
                <div className="space-y-2">
                  <div className="bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider border border-black/10">
                    I. INFORMASI UMUM
                  </div>
                  <table className="w-full text-xs font-semibold text-slate-700">
                    <tbody>
                      <tr>
                        <td className="w-32 py-1">Penyusun / Guru</td>
                        <td className="w-4 py-1">:</td>
                        <td className="py-1 font-bold text-black">{teacherName}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Nama Satuan Pendidikan</td>
                        <td className="py-1">:</td>
                        <td className="py-1">{schoolName}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Fase / Kelas</td>
                        <td className="py-1">:</td>
                        <td className="py-1">Fase {activeModul.grade <= 2 ? 'A' : activeModul.grade <= 4 ? 'B' : 'C'} / Kelas {activeModul.grade}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Mata Pelajaran</td>
                        <td className="py-1">:</td>
                        <td className="py-1">Pendidikan Jasmani, Olahraga, & Kesehatan (PJOK)</td>
                      </tr>
                      <tr>
                        <td className="py-1">Materi Pokok</td>
                        <td className="py-1">:</td>
                        <td className="py-1 font-bold text-emerald-800">{activeModul.materiPokok}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Semester / Alokasi Waktu</td>
                        <td className="py-1">:</td>
                        <td className="py-1">Semester {activeModul.semester} / {activeModul.alokasiWaktu}</td>
                      </tr>
                      <tr>
                        <td className="py-1 valign-top">Sarana & Prasarana</td>
                        <td className="py-1 valign-top">:</td>
                        <td className="py-1 text-slate-600 leading-relaxed font-medium">
                          {activeModul.saranaPrasarana ? activeModul.saranaPrasarana.join(', ') : 'Peralatan standar olahraga sekolah'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section II: KOMPONEN INTI */}
                <div className="space-y-4">
                  <div className="bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider border border-black/10">
                    II. KOMPONEN INTI
                  </div>

                  {/* 1. Tujuan Pembelajaran */}
                  <div className="space-y-1.5 pl-2">
                    <h4 className="text-xs font-bold text-black uppercase tracking-wide">A. Tujuan Pembelajaran</h4>
                    <ul className="list-disc pl-5 text-xs text-slate-700 font-medium space-y-1">
                      {activeModul.tujuanPembelajaran ? (
                        activeModul.tujuanPembelajaran.map((tujuan, idx) => (
                          <li key={idx} className="leading-relaxed">{tujuan}</li>
                        ))
                      ) : (
                        <li>Siswa mampu menguasai teknik dasar sesuai modul.</li>
                      )}
                    </ul>
                  </div>

                  {/* 2. Kegiatan Pembelajaran */}
                  <div className="space-y-3 pl-2">
                    <h4 className="text-xs font-bold text-black uppercase tracking-wide">B. Kegiatan Pembelajaran</h4>
                    
                    {/* Pendahuluan */}
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-800 block">1. Kegiatan Pendahuluan (Apersepsi & Pemanasan)</span>
                      <ul className="list-decimal pl-5 text-xs text-slate-600 space-y-1 leading-relaxed">
                        {activeModul.kegiatanPembelajaran?.pendahuluan?.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        )) || (
                          <li>Guru mengumpulkan siswa, presensi, berdoa, dan pemanasan mandiri.</li>
                        )}
                      </ul>
                    </div>

                    {/* Inti */}
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-800 block">2. Kegiatan Inti (Praktek Olahraga & Eksplorasi)</span>
                      <ul className="list-decimal pl-5 text-xs text-slate-600 space-y-1 leading-relaxed">
                        {activeModul.kegiatanPembelajaran?.inti?.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        )) || (
                          <li>Siswa mempraktekkan teknik dasar olahraga PJOK secara bertahap.</li>
                        )}
                      </ul>
                    </div>

                    {/* Penutup */}
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-800 block">3. Kegiatan Penutup (Pendinginan & Refleksi)</span>
                      <ul className="list-decimal pl-5 text-xs text-slate-600 space-y-1 leading-relaxed">
                        {activeModul.kegiatanPembelajaran?.penutup?.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        )) || (
                          <li>Guru memimpin pendinginan otot, melakukan refleksi singkat, dan berdoa bersama.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* 3. Penilaian */}
                  <div className="space-y-1.5 pl-2">
                    <h4 className="text-xs font-bold text-black uppercase tracking-wide">C. Sistem Asesmen / Penilaian</h4>
                    <div className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 border border-slate-100 p-3 rounded-lg whitespace-pre-line">
                      {activeModul.rubrikPenilaian || 'Penilaian Sikap (Keaktifan), Pengetahuan (Pemahaman aturan main), dan Keterampilan (Teknik Gerak Fisik).'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENT C: JURNAL HARIAN */}
            {docType === 'jurnal' && (
              <div className="space-y-6 font-sans">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black tracking-wide uppercase underline">JURNAL HARIAN MENGAJAR GURU PJOK</h3>
                  <p className="text-xs text-slate-600 font-medium">Laporan Rekap Kegiatan Pembelajaran & Kejadian Siswa</p>
                </div>

                {/* Meta details */}
                <table className="w-full text-xs font-semibold text-slate-700">
                  <tbody>
                    <tr>
                      <td className="w-32 py-0.5">Nama Guru</td>
                      <td className="w-4 py-0.5">:</td>
                      <td className="py-0.5 font-bold text-black">{teacherName}</td>
                      <td className="w-32 py-0.5">Tahun Ajaran</td>
                      <td className="w-4 py-0.5">:</td>
                      <td className="py-0.5">2026/2027</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Satuan Pendidikan</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">{schoolName}</td>
                      <td className="py-0.5">Filter Tampilan</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5 font-bold text-emerald-800">
                        {jurnalFilter === 'all' ? 'Semua Kelas' : `Khusus Kelas`}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Journal Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-black">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center">
                        <th className="border border-black px-1.5 py-2 w-8">No</th>
                        <th className="border border-black px-2 py-2 w-28 text-left">Hari / Tanggal</th>
                        <th className="border border-black px-1.5 py-2 w-16">Kelas</th>
                        <th className="border border-black px-2 py-2 text-left">Materi / Sub-Materi</th>
                        <th className="border border-black px-2 py-2 text-left">Catatan Kejadian / Kasus Penting</th>
                        <th className="border border-black px-2 py-2 text-left w-44">Tindak Lanjut Guru</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJournals.map((j, idx) => (
                        <tr key={j.id} className="hover:bg-slate-50 text-slate-800">
                          <td className="border border-black px-1.5 py-2 text-center font-bold">{idx + 1}</td>
                          <td className="border border-black px-2 py-2 font-medium">{j.date}</td>
                          <td className="border border-black px-1.5 py-2 text-center font-bold">{j.className}</td>
                          <td className="border border-black px-2 py-2 leading-relaxed font-semibold">{j.materi}</td>
                          <td className="border border-black px-2 py-2 leading-relaxed text-slate-600">{j.catatanKejadian || '-'}</td>
                          <td className="border border-black px-2 py-2 leading-relaxed text-slate-700 font-medium">{j.tindakLanjut || '-'}</td>
                        </tr>
                      ))}
                      {filteredJournals.length === 0 && (
                        <tr>
                          <td colSpan={6} className="border border-black px-4 py-8 text-center text-slate-400 italic">
                            Belum ada catatan jurnal mengajar yang sesuai filter ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DOCUMENT D: RUBRIK FISIK */}
            {docType === 'rubrik' && activeRubrik && (
              <div className="space-y-6 font-sans">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black tracking-wide uppercase underline">RUBRIK EVALUASI KINERJA FISIK & KETERAMPILAN GERAK</h3>
                  <p className="text-xs text-slate-600 font-medium">Asesmen Pembelajaran Praktik PJOK Sekolah Dasar</p>
                </div>

                {/* Metadata */}
                <table className="w-full text-xs font-semibold text-slate-700">
                  <tbody>
                    <tr>
                      <td className="w-32 py-0.5">Satuan Pendidikan</td>
                      <td className="w-4 py-0.5">:</td>
                      <td className="py-0.5 font-bold text-black">{schoolName}</td>
                      <td className="w-32 py-0.5">Kategori Materi</td>
                      <td className="w-4 py-0.5">:</td>
                      <td className="py-0.5 font-bold text-emerald-800">{activeRubrik.kategori}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Materi Pokok</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5 font-bold text-black">{activeRubrik.materi}</td>
                      <td className="py-0.5">Guru Asesor</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">{teacherName}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Rubric Grid Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border-collapse border border-black">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center">
                        <th className="border border-black px-2 py-2 w-8">No</th>
                        <th className="border border-black px-2 py-2 w-36 text-left">Indikator Kinerja</th>
                        <th className="border border-black px-3 py-2 text-left bg-emerald-50 text-emerald-900 w-44">
                          Sangat Baik (Skor 3 / Mahir)
                        </th>
                        <th className="border border-black px-3 py-2 text-left bg-slate-50 text-slate-900 w-44">
                          Cukup (Skor 2 / Layak)
                        </th>
                        <th className="border border-black px-3 py-2 text-left bg-amber-50 text-amber-900 w-44">
                          Perlu Bimbingan (Skor 1)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRubrik.indikator?.map((ind, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="border border-black px-2 py-3.5 text-center font-bold text-xs">{idx + 1}</td>
                          <td className="border border-black px-2.5 py-3.5 font-bold text-slate-800 text-xs">{ind.nama}</td>
                          <td className="border border-black px-3 py-3.5 leading-relaxed text-emerald-950 font-medium bg-emerald-50/20">{ind.kriteriaBagus}</td>
                          <td className="border border-black px-3 py-3.5 leading-relaxed text-slate-700">{ind.kriteriaCukup}</td>
                          <td className="border border-black px-3 py-3.5 leading-relaxed text-amber-950 bg-amber-50/10">{ind.kriteriaKurang}</td>
                        </tr>
                      ))}
                      {(!activeRubrik.indikator || activeRubrik.indikator.length === 0) && (
                        <tr>
                          <td colSpan={5} className="border border-black px-4 py-8 text-center text-slate-400 italic">
                            Indikator rubrik tidak ditemukan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="text-[10px] text-slate-500 font-semibold italic">
                  Catatan: Lembar rubrik ini digunakan guru saat memantau teknik praktek lapangan untuk memberikan skor performa siswa secara adil dan objektif.
                </div>
              </div>
            )}


            {/* 3. FORMAL SIGNATURE SECTIONS (Bottom Section) */}
            {showSignatures && (
              <div className="mt-12 grid grid-cols-2 gap-8 text-xs font-sans text-black select-all pt-4 page-break-avoid">
                {/* Left: Headmaster column */}
                <div className="text-center space-y-16">
                  <div>
                    <p className="font-semibold text-slate-600 leading-normal">Mengetahui,</p>
                    <p className="font-bold uppercase text-black leading-normal">Kepala Sekolah {schoolName}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-black underline leading-none">{principalName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">NIP. {principalNip || '-'}</p>
                  </div>
                </div>

                {/* Right: Teacher column */}
                <div className="text-center space-y-16">
                  <div>
                    <p className="font-semibold text-slate-600 leading-normal">{printCity}, {printDate}</p>
                    <p className="font-bold uppercase text-black leading-normal">Guru Mata Pelajaran PJOK</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-black underline leading-none">{teacherName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">NIP. {teacherNip || '-'}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Cetak Laporan & Administrasi Resmi"
        subtitle={`Format Dokumen: ${docType === 'rapor' ? 'Laporan Rapor & Presensi' : docType === 'modul' ? 'Modul Ajar' : docType === 'jurnal' ? 'Jurnal Mengajar' : 'Rubrik Kinerja'}`}
        tabs={getKodeEtikKkoCetakPrompts("Standar Format Dokumen dan Cetak Laporan Administrasi PJOK")}
        defaultActiveTab="prompt_menu"
        jsonData={{
          tipeDokumen: docType,
          sekolah: schoolName,
          alamat: schoolAddress,
          guru: teacherName,
          nipGuru: teacherNip,
          kepsek: principalName,
          nipKepsek: principalNip,
          kota: printCity,
          tanggal: printDate,
          dataDokumen: docType === 'rapor' ? activeClass : docType === 'modul' ? activeModul : docType === 'jurnal' ? filteredJournals : activeRubrik
        }}
        jsonFilename={`Cetak_Laporan_${docType}_PJOK.json`}
      />
    </div>
  );
}
