import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  AlertCircle,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  ClipboardList,
  Calendar,
  Download,
  Printer,
  FileText,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Upload,
  BookOpen,
  BarChart2,
  Edit3,
  Clock,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  Zap,
  MapPin,
  Sliders,
  ArrowRight,
  Compass
} from 'lucide-react';
import { RpeData } from '../types';
import { 
  loadSavedRpe, 
  saveRpeToStorage, 
  resetRpeStorage, 
  recalculateRpe,
  generateAutomaticRpe,
  generatePjokDistribution,
  PRESET_RPE_SEMESTER_GANJIL,
  PRESET_RPE_SEMESTER_GENAP 
} from '../utils/rpePresets';
import { downloadDocFile, copyAndOpenGoogleDocs, exportRpeToDoc, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import { getRpePrompts } from '../utils/aiPromptGenerators';

export default function RpeGeneratorView() {
  // Active Tab: 'generate' | 'editor' | 'preview' | 'matriks' | 'panduan'
  const [activeTab, setActiveTab] = useState<'generate' | 'editor' | 'preview' | 'matriks' | 'panduan'>('generate');

  // Main RPE Data State (initialized from LocalStorage or Default Preset)
  const [rpeData, setRpeData] = useState<RpeData>(() => loadSavedRpe('Ganjil'));

  // UI state for notifications
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Auto-Generate Form States
  const [genNamaSekolah, setGenNamaSekolah] = useState(rpeData.identitas.namaSekolah || 'SD Negeri Unggulan');
  const [genKelas, setGenKelas] = useState(rpeData.identitas.kelas || '5');
  const [genFase, setGenFase] = useState(rpeData.identitas.fase || 'Fase C');
  const [genSemester, setGenSemester] = useState<'Ganjil' | 'Genap'>(
    rpeData.identitas.semester === 'Genap' ? 'Genap' : 'Ganjil'
  );
  const [genTahunPelajaran, setGenTahunPelajaran] = useState(rpeData.identitas.tahunPelajaran || '2026/2027');
  const [genJpPerMinggu, setGenJpPerMinggu] = useState<number>(rpeData.identitas.jpPerMinggu || 4);
  const [genWilayah, setGenWilayah] = useState<'nasional' | 'dki' | 'jabar' | 'jateng' | 'jatim' | 'kemenag'>('nasional');
  const [genTargetJamCadangan, setGenTargetJamCadangan] = useState<number>(4);
  const [genSertakanDistribusi, setGenSertakanDistribusi] = useState<boolean>(true);
  const [genKota, setGenKota] = useState(rpeData.identitas.kota || 'Jakarta');
  const [genGuru, setGenGuru] = useState(rpeData.identitas.namaGuru || '');
  const [genNipGuru, setGenNipGuru] = useState(rpeData.identitas.nipGuru || '');
  const [genKepsek, setGenKepsek] = useState(rpeData.identitas.kepalaSekolah || '');
  const [genNipKepsek, setGenNipKepsek] = useState(rpeData.identitas.nipKepsek || '');

  // AI Form inputs (for custom generation)
  const [aiNotes, setAiNotes] = useState(
    "Minggu ke-1 & 2 Juli: Libur Semester Genap TA Sebelumnya\n" +
    "Minggu ke-3 Juli: Masa Pengenalan Lingkungan Sekolah (MPLS)\n" +
    "Minggu ke-4 September: Asesmen Sumatif Tengah Semester (STS)\n" +
    "Minggu ke-2 Desember: Asesmen Sumatif Akhir Semester (SAS)\n" +
    "Minggu ke-3 Desember: Pembagian Rapor & Libur Semester Ganjil"
  );
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Hidden file input for JSON restore
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save whenever rpeData changes
  useEffect(() => {
    saveRpeToStorage(rpeData);
  }, [rpeData]);

  // Synchronize Fase when Kelas changes in Generator
  const handleKelasChangeInGenerator = (val: string) => {
    setGenKelas(val);
    if (['1', '2'].includes(val)) setGenFase('Fase A');
    else if (['3', '4'].includes(val)) setGenFase('Fase B');
    else if (['5', '6'].includes(val)) setGenFase('Fase C');
    else if (['7', '8', '9'].includes(val)) setGenFase('Fase D');
  };

  // Execute Automatic Generation (Instant Algorithm)
  const handleRunAutomaticGenerate = () => {
    const newRpe = generateAutomaticRpe({
      namaSekolah: genNamaSekolah,
      kelas: genKelas,
      fase: genFase,
      mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
      semester: genSemester,
      tahunPelajaran: genTahunPelajaran,
      jpPerMinggu: genJpPerMinggu,
      wilayahKalender: genWilayah,
      targetJamCadangan: genTargetJamCadangan,
      namaGuru: genGuru || rpeData.identitas.namaGuru,
      nipGuru: genNipGuru || rpeData.identitas.nipGuru,
      kepalaSekolah: genKepsek || rpeData.identitas.kepalaSekolah,
      nipKepsek: genNipKepsek || rpeData.identitas.nipKepsek,
      kota: genKota,
      sertakanDistribusiMateri: genSertakanDistribusi
    });

    setRpeData(newRpe);
    setSaveStatus(`Berhasil men-generate RPE otomatis untuk Semester ${genSemester} Kelas ${genKelas} (${genWilayah.toUpperCase()})!`);
    setTimeout(() => setSaveStatus(null), 4000);
    setActiveTab('editor');
  };

  // One-click Auto-Distribute PJOK Hours inside Editor
  const handleAutoDistributePjokInEditor = () => {
    const distributed = generatePjokDistribution(
      rpeData.identitas.fase || 'Fase C',
      rpeData.identitas.kelas || '5',
      rpeData.identitas.semester === 'Genap' ? 'Genap' : 'Ganjil',
      rpeData.totalJamEfektif,
      rpeData.totalJamCadangan || 4
    );

    setRpeData(prev => ({
      ...prev,
      distribusiAlokasiWaktu: distributed
    }));

    setSaveStatus('Distribusi materi PJOK berhasil di-generate otomatis 100% seimbang!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Handler: Update Identitas fields
  const handleIdentitasChange = (field: keyof RpeData['identitas'], value: any) => {
    setRpeData(prev => {
      const updated = {
        ...prev,
        identitas: {
          ...prev.identitas,
          [field]: value
        }
      };
      if (field === 'jpPerMinggu') {
        return recalculateRpe(updated);
      }
      return updated;
    });
    showSaveNotification();
  };

  // Handler: Update Bulan Row in Table 1
  const handleBulanChange = (index: number, field: string, value: any) => {
    setRpeData(prev => {
      const newBulans = [...prev.alokasiWaktu.bulans];
      newBulans[index] = {
        ...newBulans[index],
        [field]: value
      };
      const updated = {
        ...prev,
        alokasiWaktu: {
          ...prev.alokasiWaktu,
          bulans: newBulans
        }
      };
      return recalculateRpe(updated);
    });
    showSaveNotification();
  };

  // Handler: Add Bulan Row
  const handleAddBulan = () => {
    setRpeData(prev => {
      const nextNo = prev.alokasiWaktu.bulans.length + 1;
      const newBulans = [
        ...prev.alokasiWaktu.bulans,
        {
          no: nextNo,
          bulan: `Bulan Tambahan ${nextNo}`,
          jumlahPekan: 4,
          pekanEfektif: 4,
          pekanTidakEfektif: 0,
          keterangan: 'KBM Efektif'
        }
      ];
      return recalculateRpe({
        ...prev,
        alokasiWaktu: {
          ...prev.alokasiWaktu,
          bulans: newBulans
        }
      });
    });
    showSaveNotification();
  };

  // Handler: Remove Bulan Row
  const handleRemoveBulan = (index: number) => {
    if (rpeData.alokasiWaktu.bulans.length <= 1) return;
    setRpeData(prev => {
      const newBulans = prev.alokasiWaktu.bulans
        .filter((_, idx) => idx !== index)
        .map((b, idx) => ({ ...b, no: idx + 1 }));
      return recalculateRpe({
        ...prev,
        alokasiWaktu: {
          ...prev.alokasiWaktu,
          bulans: newBulans
        }
      });
    });
    showSaveNotification();
  };

  // Handler: Update Pekan Tidak Efektif Row
  const handlePekanTidakEfektifChange = (index: number, field: string, value: any) => {
    setRpeData(prev => {
      const newRows = [...prev.pekanTidakEfektif];
      newRows[index] = {
        ...newRows[index],
        [field]: field === 'jumlahPekan' ? Math.max(0, Number(value) || 0) : value
      };
      return {
        ...prev,
        pekanTidakEfektif: newRows
      };
    });
    showSaveNotification();
  };

  // Handler: Add Pekan Tidak Efektif Row
  const handleAddPekanTidakEfektif = () => {
    setRpeData(prev => {
      const nextNo = prev.pekanTidakEfektif.length + 1;
      const newRows = [
        ...prev.pekanTidakEfektif,
        {
          no: nextNo,
          uraianKegiatan: 'Kegiatan Baru / Libur Khusus',
          jumlahPekan: 1,
          keterangan: 'Keterangan waktu pelaksanaan'
        }
      ];
      return {
        ...prev,
        pekanTidakEfektif: newRows
      };
    });
    showSaveNotification();
  };

  // Handler: Remove Pekan Tidak Efektif Row
  const handleRemovePekanTidakEfektif = (index: number) => {
    setRpeData(prev => {
      const newRows = prev.pekanTidakEfektif
        .filter((_, idx) => idx !== index)
        .map((row, idx) => ({ ...row, no: idx + 1 }));
      return {
        ...prev,
        pekanTidakEfektif: newRows
      };
    });
    showSaveNotification();
  };

  // Handler: Update Distribusi Alokasi Waktu Row
  const handleDistribusiChange = (index: number, field: string, value: any) => {
    setRpeData(prev => {
      const currentList = prev.distribusiAlokasiWaktu || [];
      const newList = [...currentList];
      newList[index] = {
        ...newList[index],
        [field]: field === 'alokasiWaktuJp' ? Math.max(0, Number(value) || 0) : value
      };
      return {
        ...prev,
        distribusiAlokasiWaktu: newList
      };
    });
    showSaveNotification();
  };

  // Handler: Add Distribusi Row
  const handleAddDistribusi = () => {
    setRpeData(prev => {
      const currentList = prev.distribusiAlokasiWaktu || [];
      const nextNo = currentList.length + 1;
      const newList = [
        ...currentList,
        {
          no: nextNo,
          materiPokok: 'Materi Pokok PJOK Baru',
          lingkupMateri: 'Elemen Terampil Bergerak',
          alokasiWaktuJp: 8,
          keterangan: '2 Pertemuan'
        }
      ];
      return {
        ...prev,
        distribusiAlokasiWaktu: newList
      };
    });
    showSaveNotification();
  };

  // Handler: Remove Distribusi Row
  const handleRemoveDistribusi = (index: number) => {
    setRpeData(prev => {
      const currentList = prev.distribusiAlokasiWaktu || [];
      const newList = currentList
        .filter((_, idx) => idx !== index)
        .map((row, idx) => ({ ...row, no: idx + 1 }));
      return {
        ...prev,
        distribusiAlokasiWaktu: newList
      };
    });
    showSaveNotification();
  };

  // Switch Semester Preset
  const handleLoadPreset = (sem: 'Ganjil' | 'Genap') => {
    if (window.confirm(`Muat kalender standar untuk Semester ${sem}? Data saat ini akan diperbarui sesuai kalender akademik.`)) {
      const preset = sem === 'Genap' ? { ...PRESET_RPE_SEMESTER_GENAP } : { ...PRESET_RPE_SEMESTER_GANJIL };
      preset.identitas.namaSekolah = rpeData.identitas.namaSekolah || preset.identitas.namaSekolah;
      preset.identitas.namaGuru = rpeData.identitas.namaGuru || preset.identitas.namaGuru;
      preset.identitas.nipGuru = rpeData.identitas.nipGuru || preset.identitas.nipGuru;
      preset.identitas.kepalaSekolah = rpeData.identitas.kepalaSekolah || preset.identitas.kepalaSekolah;
      preset.identitas.nipKepsek = rpeData.identitas.nipKepsek || preset.identitas.nipKepsek;
      preset.identitas.kelas = rpeData.identitas.kelas || preset.identitas.kelas;
      preset.identitas.fase = rpeData.identitas.fase || preset.identitas.fase;
      
      setRpeData(recalculateRpe(preset));
      setSaveStatus(`Berhasil memuat kalender standar Semester ${sem}!`);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Reset to factory default
  const handleReset = () => {
    if (window.confirm('Reset seluruh data RPE ke pengaturan awal kalender standar?')) {
      const defaultData = resetRpeStorage(rpeData.identitas.semester);
      setRpeData(defaultData);
      setSaveStatus('Data RPE telah di-reset ke standar awal.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Helper notification
  const showSaveNotification = () => {
    setSaveStatus('Tersimpan di perangkat');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  // Total calculated distributed JP
  const totalDistribusiJp = (rpeData.distribusiAlokasiWaktu || []).reduce(
    (sum, item) => sum + (Number(item.alokasiWaktuJp) || 0), 
    0
  );
  const diffJp = totalDistribusiJp - rpeData.totalJamEfektif;

  // Total weeks in non-effective table
  const totalPekanTidakEfektifRincian = rpeData.pekanTidakEfektif.reduce(
    (sum, item) => sum + (Number(item.jumlahPekan) || 0),
    0
  );

  // Copy & Open Google Docs
  const handleCopyAndGoToDocs = async () => {
    setCopySuccess(false);
    const docHtml = exportRpeToDoc(rpeData);
    const success = await copyAndOpenGoogleDocs(docHtml);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  // Download Docx (.doc)
  const handleDownloadDoc = () => {
    const docHtml = exportRpeToDoc(rpeData);
    const filename = `RPE_${rpeData.identitas.mataPelajaran.replace(/\s+/g, '_')}_Kelas${rpeData.identitas.kelas}_${rpeData.identitas.semester}_${(rpeData.identitas.tahunPelajaran || '').replace(/\//g, '-')}`;
    downloadDocFile(filename, docHtml);
    setSaveStatus('Dokumen Word (.doc) berhasil diunduh dalam format tabel rapi dan siap cetak!');
    setTimeout(() => setSaveStatus(null), 4000);
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docHtml = exportRpeToDoc(rpeData);
      const filename = `RPE_${rpeData.identitas.mataPelajaran.replace(/\s+/g, '_')}_Kelas${rpeData.identitas.kelas}_${rpeData.identitas.semester}`;
      const success = await downloadHtmlAsPdf(filename, docHtml, {
        title: `RPE - ${rpeData.identitas.mataPelajaran}`,
        orientation: 'portrait'
      });
      if (!success) {
        printHtmlDocument(docHtml, `RPE - ${rpeData.identitas.mataPelajaran}`);
      }
    } catch (err) {
      console.error(err);
      const docHtml = exportRpeToDoc(rpeData);
      printHtmlDocument(docHtml, `RPE - ${rpeData.identitas.mataPelajaran}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print
  const handlePrint = () => {
    const docHtml = exportRpeToDoc(rpeData);
    printHtmlDocument(docHtml, `RPE - ${rpeData.identitas.mataPelajaran}`);
  };

  // Copy as Excel / Spreadsheet TSV
  const handleCopyExcel = () => {
    let tsv = `RINCIAN PEKAN EFEKTIF (RPE) - ${rpeData.identitas.namaSekolah}\n`;
    tsv += `Mata Pelajaran\t${rpeData.identitas.mataPelajaran}\n`;
    tsv += `Kelas / Fase\tKelas ${rpeData.identitas.kelas} (${rpeData.identitas.fase || '-'})\n`;
    tsv += `Semester / TA\t${rpeData.identitas.semester} / ${rpeData.identitas.tahunPelajaran}\n`;
    tsv += `JP Per Minggu\t${rpeData.identitas.jpPerMinggu} JP\n\n`;

    tsv += `I. PERHITUNGAN PEKAN EFEKTIF\n`;
    tsv += `No\tBulan\tJumlah Pekan\tPekan Efektif\tPekan Tidak Efektif\tKeterangan\n`;
    rpeData.alokasiWaktu.bulans.forEach(b => {
      tsv += `${b.no}\t${b.bulan}\t${b.jumlahPekan}\t${b.pekanEfektif}\t${b.pekanTidakEfektif}\t${b.keterangan || '-'}\n`;
    });
    tsv += `Total\t-\t${rpeData.alokasiWaktu.totalPekan}\t${rpeData.alokasiWaktu.totalPekanEfektif}\t${rpeData.alokasiWaktu.totalPekanTidakEfektif}\t-\n\n`;

    tsv += `II. RINCIAN PEKAN TIDAK EFEKTIF\n`;
    tsv += `No\tUraian Kegiatan\tJumlah Pekan\tKeterangan\n`;
    rpeData.pekanTidakEfektif.forEach(p => {
      tsv += `${p.no}\t${p.uraianKegiatan}\t${p.jumlahPekan}\t${p.keterangan || '-'}\n`;
    });
    tsv += `Total\t-\t${rpeData.alokasiWaktu.totalPekanTidakEfektif}\tPekan\n\n`;

    tsv += `III. REKAPITULASI & FORMULA\n`;
    tsv += `Rumus Pekan Efektif\t${rpeData.totalPekanEfektifFormula}\n`;
    tsv += `Rumus Jam Efektif\t${rpeData.totalJamEfektifFormula}\n`;
    tsv += `Total Jam Pelajaran Efektif\t${rpeData.totalJamEfektif} JP\n\n`;

    if (rpeData.distribusiAlokasiWaktu && rpeData.distribusiAlokasiWaktu.length > 0) {
      tsv += `IV. DISTRIBUSI ALOKASI WAKTU PEMBELAJARAN\n`;
      tsv += `No\tMateri Pokok\tLingkup Materi\tAlokasi Waktu (JP)\tKeterangan\n`;
      rpeData.distribusiAlokasiWaktu.forEach(d => {
        tsv += `${d.no}\t${d.materiPokok}\t${d.lingkupMateri || '-'}\t${d.alokasiWaktuJp}\t${d.keterangan || '-'}\n`;
      });
      tsv += `Total Terdistribusi\t-\t-\t${totalDistribusiJp} JP\t-\n`;
    }

    navigator.clipboard.writeText(tsv).then(() => {
      alert('Tabel RPE berhasil disalin dalam format Excel/Spreadsheet! Anda dapat langsung mem-paste (Ctrl+V) ke Microsoft Excel atau Google Spreadsheet.');
    });
  };

  // Export JSON Backup
  const handleExportJson = () => {
    downloadJsonFile(
      `RPE_${rpeData.identitas.namaSekolah.replace(/\s+/g, '_')}_Kelas${rpeData.identitas.kelas}_${rpeData.identitas.semester}`,
      rpeData
    );
  };

  // Import JSON Backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && parsed.identitas && parsed.alokasiWaktu) {
          const rec = recalculateRpe(parsed);
          setRpeData(rec);
          setSaveStatus('Data RPE berhasil diimpor!');
          setTimeout(() => setSaveStatus(null), 3000);
        } else {
          alert('Format berkas JSON tidak sesuai untuk dokumen RPE.');
        }
      } catch (err) {
        alert('Gagal membaca berkas JSON: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Generate with AI (Advanced custom analysis)
  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAiGenerating(true);
    setAiError(null);

    try {
      const response = await fetch('/api/generate-rpe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaSekolah: genNamaSekolah || rpeData.identitas.namaSekolah,
          kelas: genKelas || rpeData.identitas.kelas,
          jpPerMinggu: genJpPerMinggu || rpeData.identitas.jpPerMinggu,
          mataPelajaran: rpeData.identitas.mataPelajaran,
          semester: genSemester || rpeData.identitas.semester,
          tahunPelajaran: genTahunPelajaran || rpeData.identitas.tahunPelajaran,
          catatanTambahan: aiNotes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Terjadi kendala saat menyusun RPE AI.');
      }

      const generated: RpeData = await response.json();
      
      const merged: RpeData = {
        ...generated,
        identitas: {
          ...generated.identitas,
          fase: genFase || rpeData.identitas.fase,
          kepalaSekolah: genKepsek || rpeData.identitas.kepalaSekolah,
          nipKepsek: genNipKepsek || rpeData.identitas.nipKepsek,
          namaGuru: genGuru || rpeData.identitas.namaGuru,
          nipGuru: genNipGuru || rpeData.identitas.nipGuru,
          kota: genKota || rpeData.identitas.kota
        },
        distribusiAlokasiWaktu: generatePjokDistribution(
          genFase,
          genKelas,
          genSemester,
          generated.totalJamEfektif,
          genTargetJamCadangan
        )
      };

      setRpeData(recalculateRpe(merged));
      setSaveStatus('RPE berhasil disusun otomatis dengan analisis AI!');
      setTimeout(() => setSaveStatus(null), 3000);
      setActiveTab('editor');
    } catch (err: any) {
      setAiError(err.message || 'Gagal menyusun RPE dengan AI.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hidden file input for JSON Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportJson} 
        accept=".json" 
        className="hidden" 
      />

      {/* TOP HEADER & ACTION BAR */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl shadow-xs">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                  Rincian Pekan Efektif (RPE)
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3 text-indigo-600" /> Generate Otomatis
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                    Dapat Diedit Penuh
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  Perhitungan alokasi pekan efektif KBM & distribusi jam pelajaran PJOK Kurikulum Merdeka (Keputusan Kepala BSKAP Nomor 046/H/KR/2025)
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Presets */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleDownloadDoc}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-blue-950/20"
              title="Download berkas Word (.doc) lengkap dengan tabel bergaris rapi dan format siap cetak"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Download Word (.doc) Rapi</span>
            </button>

            <button
              onClick={() => setActiveTab('generate')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                activeTab === 'generate'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-950/20'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Menu Generate Otomatis</span>
            </button>

            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => handleLoadPreset('Ganjil')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  rpeData.identitas.semester === 'Ganjil'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Muat template kalender semester ganjil (Juli - Desember)"
              >
                <span>☀️ Ganjil</span>
              </button>
              <button
                onClick={() => handleLoadPreset('Genap')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  rpeData.identitas.semester === 'Genap'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Muat template kalender semester genap (Januari - Juni)"
              >
                <span>🌱 Genap</span>
              </button>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              title="Kembalikan ke kalender standar BSKAP Nomor 046/H/KR/2025"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              title="Cadangkan data RPE ke berkas JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Backup</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              title="Buka kembali berkas cadangan JSON"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Impor</span>
            </button>
          </div>
        </div>

        {/* Live Notification Bar */}
        {saveStatus && (
          <div className="py-2 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-medium flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* QUICK METRICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
          
          {/* Card 1: Total Pekan */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Pekan Semester</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-slate-900">{rpeData.alokasiWaktu.totalPekan}</span>
              <span className="text-xs text-slate-500 font-semibold">Pekan</span>
            </div>
            <span className="text-[10px] text-slate-400">Total 6 bulan kalender</span>
          </div>

          {/* Card 2: Pekan Tidak Efektif */}
          <div className="bg-red-50/60 rounded-xl p-3 border border-red-200/70">
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Pekan Tidak Efektif</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-red-700">{rpeData.alokasiWaktu.totalPekanTidakEfektif}</span>
              <span className="text-xs text-red-500 font-semibold">Pekan</span>
            </div>
            <span className="text-[10px] text-red-500">Libur, STS, SAS, MPLS</span>
          </div>

          {/* Card 3: Pekan Efektif */}
          <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-200/70">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Pekan Efektif KBM</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-emerald-700">{rpeData.alokasiWaktu.totalPekanEfektif}</span>
              <span className="text-xs text-emerald-600 font-semibold">Pekan</span>
            </div>
            <span className="text-[10px] text-emerald-600">Aktif Pembelajaran</span>
          </div>

          {/* Card 4: Total Jam Efektif */}
          <div className="bg-indigo-50/70 rounded-xl p-3 border border-indigo-200/70">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Total JP Efektif</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-indigo-700">{rpeData.totalJamEfektif}</span>
              <span className="text-xs text-indigo-600 font-semibold">JP</span>
            </div>
            <span className="text-[10px] text-indigo-500">{rpeData.alokasiWaktu.totalPekanEfektif} pekan × {rpeData.identitas.jpPerMinggu} JP</span>
          </div>

          {/* Card 5: Status Distribusi JP */}
          <div className={`col-span-2 sm:col-span-4 lg:col-span-1 rounded-xl p-3 border ${
            diffJp === 0 
              ? 'bg-emerald-50/80 border-emerald-200' 
              : diffJp > 0 
                ? 'bg-amber-50/80 border-amber-200' 
                : 'bg-blue-50/80 border-blue-200'
          }`}>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Distribusi Materi</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-xl font-extrabold ${diffJp === 0 ? 'text-emerald-700' : diffJp > 0 ? 'text-amber-700' : 'text-blue-700'}`}>
                {totalDistribusiJp}
              </span>
              <span className="text-xs text-slate-500 font-semibold">/ {rpeData.totalJamEfektif} JP</span>
            </div>
            <span className={`text-[10px] font-bold ${diffJp === 0 ? 'text-emerald-700' : diffJp > 0 ? 'text-amber-700' : 'text-blue-700'}`}>
              {diffJp === 0 ? '✅ Tepat Seimbang' : diffJp > 0 ? `⚠️ Berlebih +${diffJp} JP` : `ℹ️ Belum Terbagi ${Math.abs(diffJp)} JP`}
            </span>
          </div>

        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1 border-b border-slate-200 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'generate'
                ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>1. Generate Otomatis (Instan & AI)</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'editor'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>2. Editor & Penyesuaian Interaktif</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'preview'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>3. Pratinjau Dokumen Resmi (Format Cetak)</span>
          </button>

          <button
            onClick={() => setActiveTab('matriks')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'matriks'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>4. Matriks Distribusi JP PJOK</span>
          </button>

          <button
            onClick={() => setActiveTab('panduan')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'panduan'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>5. Panduan & Aturan RPE</span>
          </button>
        </div>

      </div>

      {/* TAB CONTENT 1: MENU GENERATE OTOMATIS */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="max-w-2xl space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold">
                <Zap className="w-3.5 h-3.5" />
                <span>Fitur Otomatisasi Administrasi Guru PJOK</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Generate Otomatis Rincian Pekan Efektif (RPE)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Susun dokumen RPE lengkap hanya dalam 1 detik. Sistem otomatis menghitung total pekan kalender, memetakan agenda tidak efektif, menghitung jam pelajaran efektif, dan mendistribusikan materi pokok PJOK secara 100% seimbang.
              </p>
            </div>
          </div>

          {/* Dual Generator Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Kiri: Generator Cepat Berdasarkan Kalender Wilayah (Algoritma Instan) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                    <Zap className="w-5 h-5 text-amber-600" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Mode 1: Generate Instan (Standar Kalender Wilayah)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Perhitungan baku langsung jadi sesuai aturan Keputusan Kepala BSKAP Nomor 046/H/KR/2025 & Kalender Pendidikan
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Nama Sekolah */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">Satuan Pendidikan / Nama Sekolah</label>
                  <input
                    type="text"
                    value={genNamaSekolah}
                    onChange={(e) => setGenNamaSekolah(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                    placeholder="SD Negeri..."
                  />
                </div>

                {/* Semester */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Target Semester</label>
                  <select
                    value={genSemester}
                    onChange={(e) => setGenSemester(e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-indigo-900 bg-white"
                  >
                    <option value="Ganjil">☀️ Semester Ganjil (Juli - Desember)</option>
                    <option value="Genap">🌱 Semester Genap (Januari - Juni)</option>
                  </select>
                </div>

                {/* Tahun Pelajaran */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tahun Pelajaran</label>
                  <input
                    type="text"
                    value={genTahunPelajaran}
                    onChange={(e) => setGenTahunPelajaran(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                    placeholder="2026/2027"
                  />
                </div>

                {/* Kelas */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tingkat Kelas</label>
                  <select
                    value={genKelas}
                    onChange={(e) => handleKelasChangeInGenerator(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs font-semibold bg-white"
                  >
                    <option value="1">Kelas 1 SD (Fase A)</option>
                    <option value="2">Kelas 2 SD (Fase A)</option>
                    <option value="3">Kelas 3 SD (Fase B)</option>
                    <option value="4">Kelas 4 SD (Fase B)</option>
                    <option value="5">Kelas 5 SD (Fase C)</option>
                    <option value="6">Kelas 6 SD (Fase C)</option>
                    <option value="7">Kelas 7 SMP (Fase D)</option>
                    <option value="8">Kelas 8 SMP (Fase D)</option>
                    <option value="9">Kelas 9 SMP (Fase D)</option>
                  </select>
                </div>

                {/* Fase */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Fase Kurikulum Merdeka</label>
                  <input
                    type="text"
                    value={genFase}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-indigo-700 text-xs cursor-not-allowed"
                  />
                </div>

                {/* Kalender Pendidikan Wilayah */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700 flex items-center justify-between">
                    <span>Dasar Kalender Pendidikan Wilayah</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-indigo-600" /> Sesuai SK Dinas
                    </span>
                  </label>
                  <select
                    value={genWilayah}
                    onChange={(e) => setGenWilayah(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs font-medium bg-white"
                  >
                    <option value="nasional">🏛️ Standar Nasional Kemendikbudristek RI</option>
                    <option value="dki">🏙️ Provinsi DKI Jakarta (MPLS & Kalender Dinas DKI)</option>
                    <option value="jabar">🌄 Provinsi Jawa Barat & Banten (MPLS Ramah Anak)</option>
                    <option value="jateng">🌾 Provinsi Jawa Tengah & D.I. Yogyakarta</option>
                    <option value="jatim">🏖️ Provinsi Jawa Timur & Bali</option>
                    <option value="kemenag">🕌 Kalender Kementerian Agama RI (Madrasah / MI / MTs)</option>
                  </select>
                </div>

                {/* Beban JP / Minggu */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Beban JP Per Minggu</label>
                  <select
                    value={genJpPerMinggu}
                    onChange={(e) => setGenJpPerMinggu(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-indigo-700 bg-white"
                  >
                    <option value="4">4 JP / Pekan (Standar Nasional PJOK)</option>
                    <option value="3">3 JP / Pekan (Muatan Khusus)</option>
                    <option value="2">2 JP / Pekan</option>
                    <option value="5">5 JP / Pekan (Plus Ekstrakurikuler)</option>
                  </select>
                </div>

                {/* Target Jam Cadangan */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Target Alokasi Jam Cadangan</label>
                  <select
                    value={genTargetJamCadangan}
                    onChange={(e) => setGenTargetJamCadangan(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs font-semibold bg-white"
                  >
                    <option value="4">4 JP (1 Pertemuan - Direkomendasikan)</option>
                    <option value="2">2 JP (Minimal)</option>
                    <option value="6">6 JP (Kondisi Lapangan Terbuka/Hujan)</option>
                    <option value="8">8 JP (2 Pertemuan)</option>
                  </select>
                </div>

                {/* Checkbox Otomatis Distribusi */}
                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-start gap-2.5 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl cursor-pointer hover:bg-indigo-50 transition">
                    <input
                      type="checkbox"
                      checked={genSertakanDistribusi}
                      onChange={(e) => setGenSertakanDistribusi(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-indigo-900 block text-xs">
                        Otomatis Buat Distribusi Materi Pokok PJOK Seimbang 100%
                      </span>
                      <p className="text-[11px] text-slate-600">
                        Membagi total JP secara proporsional ke elemen Terampil Bergerak, Bergaya Hidup Aktif, Hidup Sehat, Asesmen SAS/STS, dan Jam Cadangan.
                      </p>
                    </div>
                  </label>
                </div>

              </div>

              {/* Action Button */}
              <button
                onClick={handleRunAutomaticGenerate}
                className="w-full py-3 px-5 bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-amber-950/20 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99]"
              >
                <Zap className="w-4 h-4 text-amber-200" />
                <span>⚡ Generate RPE Otomatis Sekarang (Instan)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* Kanan: Generator Cerdas dengan AI Gemini (Custom Agenda Sekolah) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Mode 2: Generate Cerdas AI (Kalender Khusus)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Gunakan AI jika sekolah memiliki agenda libur atau ujian khusus
                    </p>
                  </div>
                </div>

                {aiError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                )}

                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-700 block">
                    Keterangan Kalender Khusus / Agenda Sekolah Anda:
                  </label>
                  <textarea
                    rows={6}
                    value={aiNotes}
                    onChange={(e) => setAiNotes(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl font-mono text-indigo-950 text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Tuliskan jadwal ujian, libur pondok pesantren, class meeting, kegiatan P5, atau hari libur khusus yayasan..."
                  />
                  <p className="text-[11px] text-slate-500 leading-normal">
                    AI Gemini akan menganalisis tanggal-tanggal tersebut dan menghitung ulang alokasi pekan efektif belajar secara tepat.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <button
                  onClick={handleAiGenerate}
                  disabled={isAiGenerating}
                  className="w-full py-3 px-5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-950/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI Sedang Menganalisis Kalender...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      <span>✨ Generate RPE Otomatis dengan AI Gemini</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    onClick={() => setShowPromptModal(true)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline transition"
                  >
                    Buka Salin Prompt AI (ChatGPT / Gemini Eksternal)
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Information Card on Auto-Generate Features */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Keunggulan Fitur Generate Otomatis RPE SADAR PJOK:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-600 text-[11px]">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">1. 100% Akurat Matematis</span>
                <p>Tidak ada lagi kesalahan hitung selisih pekan total dan pekan libur, formula langsung terakumulasi tepat.</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">2. Seimbang Sesuai Elemen CP</span>
                <p>Jam pelajaran otomatis didistribusikan ke 4 elemen gerak dan kesehatan PJOK sesuai proporsi resmi Kemendikbudristek.</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">3. Fleksibel & Bebas Diedit</span>
                <p>Setelah di-generate, seluruh baris tabel di Tab Editor tetap dapat Anda sesuaikan kapan saja tanpa batas.</p>
              </div>
            </div>
          </div>

          {/* Quick Download Word Card */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 rounded-2xl p-5 border border-blue-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Format Tabel Word (.doc) Sudah Dalam Keadaan Rapi & Siap Cetak
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed max-w-xl">
                Seluruh tabel (pekan efektif, rincian libur/agenda, rumus alokasi waktu, serta distribusi materi PJOK) telah diformat dengan garis tabel baku, margin A4 standar, dan kolom tanda tangan pengesahan resmi.
              </p>
            </div>
            <button
              onClick={handleDownloadDoc}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-950/20 transition shrink-0"
              title="Unduh dokumen RPE dalam format Word (.doc) rapi siap cetak"
            >
              <Download className="w-4 h-4" />
              <span>Download Word (.doc) Siap Cetak</span>
            </button>
          </div>

        </div>
      )}

      {/* TAB CONTENT 2: INTERACTIVE EDITOR */}
      {activeTab === 'editor' && (
        <div className="space-y-6">

          {/* Quick Auto-Distribute & Download Banner */}
          <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-amber-50 p-4 rounded-2xl border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Aksi Cepat Dokumen RPE
              </span>
              <p className="text-[11px] text-slate-600">
                Generate pembagian jam materi otomatis atau unduh langsung berkas Word rapi siap cetak.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
              <button
                onClick={handleDownloadDoc}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                title="Download dokumen Word (.doc) rapi siap cetak"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Word Siap Cetak</span>
              </button>
              <button
                onClick={handleAutoDistributePjokInEditor}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Auto-Distribusi JP PJOK</span>
              </button>
            </div>
          </div>

          {/* Section 1: Informasi Dokumen & Identitas */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Identitas Satuan Pendidikan & Pengesahan
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Informasi ini akan tercetak otomatis pada header dan kolom tanda tangan dokumen resmi
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Sekolah</label>
                <input 
                  type="text"
                  value={rpeData.identitas.namaSekolah}
                  onChange={(e) => handleIdentitasChange('namaSekolah', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                  placeholder="SD Negeri..."
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mata Pelajaran</label>
                <input 
                  type="text"
                  value={rpeData.identitas.mataPelajaran}
                  onChange={(e) => handleIdentitasChange('mataPelajaran', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Kelas</label>
                <input 
                  type="text"
                  value={rpeData.identitas.kelas}
                  onChange={(e) => handleIdentitasChange('kelas', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                  placeholder="5 (Lima)"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Fase</label>
                <input 
                  type="text"
                  value={rpeData.identitas.fase || 'Fase C'}
                  onChange={(e) => handleIdentitasChange('fase', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                  placeholder="Fase A / B / C"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Semester</label>
                <select
                  value={rpeData.identitas.semester}
                  onChange={(e) => handleIdentitasChange('semester', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-xs font-medium bg-white"
                >
                  <option value="Ganjil">Ganjil (1)</option>
                  <option value="Genap">Genap (2)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tahun Pelajaran</label>
                <input 
                  type="text"
                  value={rpeData.identitas.tahunPelajaran}
                  onChange={(e) => handleIdentitasChange('tahunPelajaran', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                  placeholder="2026/2027"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Beban JP / Pekan</span>
                  <span className="text-[10px] text-indigo-600 font-bold">Wajib dihitung</span>
                </label>
                <input 
                  type="number"
                  min="1"
                  max="10"
                  value={rpeData.identitas.jpPerMinggu}
                  onChange={(e) => handleIdentitasChange('jpPerMinggu', parseInt(e.target.value, 10) || 4)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-xs font-bold text-indigo-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Kota / Tempat Pembuatan</label>
                <input 
                  type="text"
                  value={rpeData.identitas.kota || 'Jakarta'}
                  onChange={(e) => handleIdentitasChange('kota', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Guru Pengampu</label>
                <input 
                  type="text"
                  value={rpeData.identitas.namaGuru || ''}
                  onChange={(e) => handleIdentitasChange('namaGuru', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                  placeholder="Nama Guru, S.Pd."
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">NIP Guru</label>
                <input 
                  type="text"
                  value={rpeData.identitas.nipGuru || ''}
                  onChange={(e) => handleIdentitasChange('nipGuru', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                  placeholder="19890512 201502 1 002"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Kepala Sekolah</label>
                <input 
                  type="text"
                  value={rpeData.identitas.kepalaSekolah || ''}
                  onChange={(e) => handleIdentitasChange('kepalaSekolah', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                  placeholder="Nama Kepala Sekolah, M.Pd."
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">NIP Kepala Sekolah</label>
                <input 
                  type="text"
                  value={rpeData.identitas.nipKepsek || ''}
                  onChange={(e) => handleIdentitasChange('nipKepsek', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                  placeholder="19750318 200003 1 005"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Tabel 1 - Perhitungan Alokasi Pekan per Bulan */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">I</span>
                  Perhitungan Jumlah Pekan dalam Semester {rpeData.identitas.semester}
                </h3>
                <p className="text-[10px] text-slate-500">
                  Ubah jumlah pekan total dan pekan tidak efektif per bulan. Pekan efektif dan total jam akan terhitung otomatis!
                </p>
              </div>

              <button
                onClick={handleAddBulan}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 self-start sm:self-auto transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Bulan</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold">
                    <th className="border border-slate-300 px-3 py-2 text-center w-12">No</th>
                    <th className="border border-slate-300 px-3 py-2 w-36">Nama Bulan</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-28">Jumlah Pekan</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-28 bg-emerald-800 text-emerald-100">Pekan Efektif</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-28 bg-red-800 text-red-100">Tidak Efektif</th>
                    <th className="border border-slate-300 px-3 py-2">Keterangan Kegiatan / Agenda Kalender</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-12">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rpeData.alokasiWaktu.bulans.map((bulan, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition align-middle">
                      <td className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-500">
                        {bulan.no}
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5">
                        <input 
                          type="text"
                          value={bulan.bulan}
                          onChange={(e) => handleBulanChange(idx, 'bulan', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded font-semibold text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center">
                        <input 
                          type="number"
                          min="0"
                          max="6"
                          value={bulan.jumlahPekan}
                          onChange={(e) => handleBulanChange(idx, 'jumlahPekan', e.target.value)}
                          className="w-16 px-2 py-1 border border-slate-200 rounded text-center font-bold text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 mx-auto"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center bg-emerald-50/40">
                        <span className="font-extrabold text-emerald-700 text-sm">
                          {bulan.pekanEfektif}
                        </span>
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center bg-red-50/40">
                        <input 
                          type="number"
                          min="0"
                          max={bulan.jumlahPekan}
                          value={bulan.pekanTidakEfektif}
                          onChange={(e) => handleBulanChange(idx, 'pekanTidakEfektif', e.target.value)}
                          className="w-16 px-2 py-1 border border-red-200 rounded text-center font-bold text-red-700 text-xs focus:ring-1 focus:ring-red-500 mx-auto bg-white"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5">
                        <input 
                          type="text"
                          value={bulan.keterangan || ''}
                          onChange={(e) => handleBulanChange(idx, 'keterangan', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500"
                          placeholder="e.g. Asesmen Sumatif Tengah Semester..."
                        />
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center">
                        <button
                          onClick={() => handleRemoveBulan(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                          title="Hapus baris bulan ini"
                          disabled={rpeData.alokasiWaktu.bulans.length <= 1}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Summary Row */}
                  <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-400">
                    <td colSpan={2} className="border border-slate-300 px-3 py-2 text-center uppercase tracking-wide">
                      Jumlah Total Pekan
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-center text-sm">
                      {rpeData.alokasiWaktu.totalPekan}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-center text-emerald-700 text-sm bg-emerald-100/50">
                      {rpeData.alokasiWaktu.totalPekanEfektif}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-center text-red-700 text-sm bg-red-100/50">
                      {rpeData.alokasiWaktu.totalPekanTidakEfektif}
                    </td>
                    <td colSpan={2} className="border border-slate-300 px-3 py-2 text-slate-500 text-[11px] italic">
                      Dihitung otomatis: {rpeData.alokasiWaktu.totalPekan} - {rpeData.alokasiWaktu.totalPekanTidakEfektif} = {rpeData.alokasiWaktu.totalPekanEfektif} Pekan Efektif
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Visual Formula Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 space-y-1">
                <span className="font-bold text-emerald-800 uppercase tracking-wide block text-[10px]">
                  Formula 1: Banyaknya Pekan Efektif
                </span>
                <p className="text-[11px] text-slate-600">Rumus: Total Pekan Semester – Total Pekan Tidak Efektif</p>
                <p className="text-sm font-extrabold font-mono text-emerald-700">
                  {rpeData.totalPekanEfektifFormula}
                </p>
              </div>

              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-950 space-y-1">
                <span className="font-bold text-indigo-800 uppercase tracking-wide block text-[10px]">
                  Formula 2: Jumlah Jam Pelajaran (JP) Efektif
                </span>
                <p className="text-[11px] text-slate-600">Rumus: Pekan Efektif × Beban JP/Pekan</p>
                <p className="text-sm font-extrabold font-mono text-indigo-700">
                  {rpeData.totalJamEfektifFormula}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Tabel 2 - Rincian Pekan Tidak Efektif */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">II</span>
                  Rincian Banyaknya Pekan Tidak Efektif (Agenda & Libur)
                </h3>
                <p className="text-[10px] text-slate-500">
                  Uraian agenda sekolah yang menyebabkan KBM reguler ditiadakan (libur semester, MPLS, asesmen sumatif, dsb)
                </p>
              </div>

              <button
                onClick={handleAddPekanTidakEfektif}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1 self-start sm:self-auto transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kegiatan Libur/Agenda</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-700 text-white font-bold">
                    <th className="border border-slate-300 px-3 py-2 text-center w-12">No</th>
                    <th className="border border-slate-300 px-3 py-2 w-96">Uraian Kegiatan / Agenda Sekolah</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-36 bg-red-800 text-red-100">Jumlah (Pekan)</th>
                    <th className="border border-slate-300 px-3 py-2">Keterangan / Waktu Pelaksanaan</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-12">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rpeData.pekanTidakEfektif.map((act, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition align-middle">
                      <td className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-500">
                        {act.no}
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5">
                        <input 
                          type="text"
                          value={act.uraianKegiatan}
                          onChange={(e) => handlePekanTidakEfektifChange(idx, 'uraianKegiatan', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded font-semibold text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center bg-red-50/30">
                        <input 
                          type="number"
                          min="1"
                          max="10"
                          value={act.jumlahPekan}
                          onChange={(e) => handlePekanTidakEfektifChange(idx, 'jumlahPekan', e.target.value)}
                          className="w-20 px-2 py-1 border border-red-200 rounded text-center font-bold text-red-700 text-xs focus:ring-1 focus:ring-red-500 mx-auto"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5">
                        <input 
                          type="text"
                          value={act.keterangan || ''}
                          onChange={(e) => handlePekanTidakEfektifChange(idx, 'keterangan', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500"
                          placeholder="e.g. Juli (Pekan ke-1 dan ke-2)"
                        />
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center">
                        <button
                          onClick={() => handleRemovePekanTidakEfektif(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                          title="Hapus baris kegiatan ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Summary Row */}
                  <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-400">
                    <td colSpan={2} className="border border-slate-300 px-3 py-2 text-center uppercase tracking-wide">
                      Jumlah Total Pekan Tidak Efektif
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-center text-red-700 text-sm bg-red-100/50">
                      {totalPekanTidakEfektifRincian} Pekan
                    </td>
                    <td colSpan={2} className="border border-slate-300 px-3 py-2 text-slate-600 text-xs">
                      {totalPekanTidakEfektifRincian === rpeData.alokasiWaktu.totalPekanTidakEfektif ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Cocok dengan akumulasi Tabel 1 ({rpeData.alokasiWaktu.totalPekanTidakEfektif} Pekan)
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Berbeda dari akumulasi Tabel 1 ({rpeData.alokasiWaktu.totalPekanTidakEfektif} Pekan). Anda dapat menyesuaikan keduanya agar sinkron.
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Tabel 3 - Distribusi Alokasi Waktu (Materi Pokok PJOK) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">III</span>
                  Distribusi Alokasi Waktu Pembelajaran PJOK (Materi Pokok)
                </h3>
                <p className="text-[10px] text-slate-500">
                  Pembagian total {rpeData.totalJamEfektif} JP ke dalam bab/elemen materi pokok, asesmen harian/sumatif, dan jam cadangan
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleAutoDistributePjokInEditor}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  title="Otomatis menyusun distribusi materi PJOK 100% seimbang"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Auto-Distribusi Cepat</span>
                </button>
                <button
                  onClick={handleAddDistribusi}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Materi Pokok</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold">
                    <th className="border border-slate-300 px-3 py-2 text-center w-12">No</th>
                    <th className="border border-slate-300 px-3 py-2 w-96">Materi Pokok Pembelajaran PJOK</th>
                    <th className="border border-slate-300 px-3 py-2 w-64">Lingkup Materi / Elemen CP</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-28 bg-indigo-800 text-indigo-100">Alokasi Waktu (JP)</th>
                    <th className="border border-slate-300 px-3 py-2">Keterangan</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-12">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(rpeData.distribusiAlokasiWaktu || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition align-middle">
                      <td className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-500">
                        {item.no}
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5">
                        <input 
                          type="text"
                          value={item.materiPokok}
                          onChange={(e) => handleDistribusiChange(idx, 'materiPokok', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded font-semibold text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5">
                        <input 
                          type="text"
                          value={item.lingkupMateri || ''}
                          onChange={(e) => handleDistribusiChange(idx, 'lingkupMateri', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-slate-600 text-xs focus:ring-1 focus:ring-indigo-500"
                          placeholder="e.g. Elemen Terampil Bergerak"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center bg-indigo-50/30">
                        <input 
                          type="number"
                          min="1"
                          max="40"
                          value={item.alokasiWaktuJp}
                          onChange={(e) => handleDistribusiChange(idx, 'alokasiWaktuJp', e.target.value)}
                          className="w-20 px-2 py-1 border border-indigo-200 rounded text-center font-bold text-indigo-700 text-xs focus:ring-1 focus:ring-indigo-500 mx-auto"
                        />
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5">
                        <input 
                          type="text"
                          value={item.keterangan || ''}
                          onChange={(e) => handleDistribusiChange(idx, 'keterangan', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-slate-600 text-xs focus:ring-1 focus:ring-indigo-500"
                          placeholder="e.g. 3 Pertemuan KBM"
                        />
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center">
                        <button
                          onClick={() => handleRemoveDistribusi(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                          title="Hapus baris materi ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Summary Row */}
                  <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-400">
                    <td colSpan={3} className="border border-slate-300 px-3 py-2 text-center uppercase tracking-wide">
                      Total Jam Pembelajaran Didistribusikan
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-center text-indigo-700 text-sm bg-indigo-100/50">
                      {totalDistribusiJp} JP
                    </td>
                    <td colSpan={2} className="border border-slate-300 px-3 py-2 text-xs">
                      {diffJp === 0 ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sempurna: Total distribusi persis sama dengan total JP efektif ({rpeData.totalJamEfektif} JP).
                        </span>
                      ) : diffJp > 0 ? (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Kelebihan {diffJp} JP dari total JP efektif ({rpeData.totalJamEfektif} JP). Kurangi alokasi salah satu materi atau cadangan.
                        </span>
                      ) : (
                        <span className="text-blue-700 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Masih ada sisa {Math.abs(diffJp)} JP belum didistribusikan dari total {rpeData.totalJamEfektif} JP. Anda bisa menambahkannya ke jam cadangan atau pengayaan.
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Catatan Analisis Kalender */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Catatan & Rekomendasi Analisis Kalender
            </h3>
            <textarea
              rows={3}
              value={rpeData.catatanAnalisis || ''}
              onChange={(e) => {
                setRpeData(prev => ({ ...prev, catatanAnalisis: e.target.value }));
                showSaveNotification();
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 font-normal leading-relaxed"
              placeholder="Tuliskan catatan khusus terkait kalender sekolah, antisipasi cuaca hujan saat praktik di lapangan terbuka, atau jadwal remedial..."
            />
          </div>

        </div>
      )}

      {/* TAB CONTENT 3: OFFICIAL PRINT & EXPORT PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          
          {/* Action Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-800">
                Pratinjau Dokumen Siap Cetak (Standar Administrasi Guru)
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={handleCopyAndGoToDocs}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                title="Salin dan buka di Google Docs"
              >
                {copySuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Disalin! Membuka Docs...</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin ke Google Docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </>
                )}
              </button>

              <button
                onClick={handleCopyExcel}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                title="Salin format tabel untuk di-paste langsung ke Microsoft Excel atau Google Spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Salin ke Excel</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-75"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>{isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF'}</span>
              </button>

              <button
                onClick={handleDownloadDoc}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                title="Unduh berkas Word (.doc) dengan garis tabel rapi, margin standar A4, dan kolom tanda tangan siap cetak"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Unduh Word (.doc) Siap Cetak</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Cetak Lembar Kerja</span>
              </button>
            </div>
          </div>

          {/* Real Print Sheet Layout */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 overflow-x-auto print-sheet max-w-5xl mx-auto">
            
            {/* Header Title Kop */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                {rpeData.identitas.namaSekolah}
              </h3>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                RINCIAN PEKAN EFEKTIF (RPE)
              </h2>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                KURIKULUM MERDEKA &bull; TAHUN PELAJARAN {rpeData.identitas.tahunPelajaran}
              </h4>
            </div>

            {/* Identitas Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-500 w-32 shrink-0">Satuan Pendidikan</span>
                <span className="font-bold">: {rpeData.identitas.namaSekolah}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-500 w-32 shrink-0">Mata Pelajaran</span>
                <span className="font-bold">: {rpeData.identitas.mataPelajaran}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-500 w-32 shrink-0">Kelas / Fase</span>
                <span className="font-bold">: Kelas {rpeData.identitas.kelas} {rpeData.identitas.fase ? `(${rpeData.identitas.fase})` : ''}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-500 w-32 shrink-0">Semester</span>
                <span className="font-bold">: Semester {rpeData.identitas.semester}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-500 w-32 shrink-0">Beban Alokasi</span>
                <span className="font-bold">: {rpeData.identitas.jpPerMinggu} Jam Pelajaran (JP) / Pekan</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-500 w-32 shrink-0">Tahun Pelajaran</span>
                <span className="font-bold">: {rpeData.identitas.tahunPelajaran}</span>
              </div>
            </div>

            {/* Bagian I: Perhitungan Pekan Efektif */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                I. PERHITUNGAN ALOKASI WAKTU PEKAN EFEKTIF
              </h3>

              <div className="space-y-1">
                <h4 className="text-[11px] font-bold text-slate-700">1. Jumlah Pekan dalam Semester {rpeData.identitas.semester}</h4>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold">
                      <th className="border border-slate-300 px-3 py-2 text-center w-12">No</th>
                      <th className="border border-slate-300 px-3 py-2 text-left w-36">Nama Bulan</th>
                      <th className="border border-slate-300 px-3 py-2 text-center w-28">Jumlah Pekan</th>
                      <th className="border border-slate-300 px-3 py-2 text-center w-28 bg-emerald-800 text-emerald-50">Pekan Efektif</th>
                      <th className="border border-slate-300 px-3 py-2 text-center w-28 bg-red-800 text-red-50">Tidak Efektif</th>
                      <th className="border border-slate-300 px-3 py-2 text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rpeData.alokasiWaktu.bulans.map((b, idx) => (
                      <tr key={idx} className="align-middle">
                        <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-slate-500">{b.no}</td>
                        <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-800">{b.bulan}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-center">{b.jumlahPekan}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-emerald-700">{b.pekanEfektif}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-red-700">{b.pekanTidakEfektif}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-600">{b.keterangan || '-'}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td colSpan={2} className="border border-slate-300 px-3 py-2 text-center">Jumlah Total</td>
                      <td className="border border-slate-300 px-3 py-2 text-center">{rpeData.alokasiWaktu.totalPekan}</td>
                      <td className="border border-slate-300 px-3 py-2 text-center text-emerald-700 font-extrabold">{rpeData.alokasiWaktu.totalPekanEfektif}</td>
                      <td className="border border-slate-300 px-3 py-2 text-center text-red-700 font-extrabold">{rpeData.alokasiWaktu.totalPekanTidakEfektif}</td>
                      <td className="border border-slate-300 px-3 py-2 text-slate-400">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Rincian Pekan Tidak Efektif */}
              <div className="space-y-1 pt-2">
                <h4 className="text-[11px] font-bold text-slate-700">2. Rincian Banyaknya Pekan Tidak Efektif</h4>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-700 text-white font-bold">
                      <th className="border border-slate-300 px-3 py-2 text-center w-12">No</th>
                      <th className="border border-slate-300 px-3 py-2 text-left w-80">Uraian Kegiatan / Agenda Sekolah</th>
                      <th className="border border-slate-300 px-3 py-2 text-center w-36">Jumlah (Pekan)</th>
                      <th className="border border-slate-300 px-3 py-2 text-left">Keterangan / Waktu Pelaksanaan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rpeData.pekanTidakEfektif.map((act, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-slate-500">{act.no}</td>
                        <td className="border border-slate-300 px-3 py-1.5 font-semibold text-slate-800">{act.uraianKegiatan}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-red-700">{act.jumlahPekan}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-600">{act.keterangan || '-'}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td colSpan={2} className="border border-slate-300 px-3 py-2 text-center">Jumlah Total Pekan Tidak Efektif</td>
                      <td className="border border-slate-300 px-3 py-2 text-center text-red-700 font-extrabold">{rpeData.alokasiWaktu.totalPekanTidakEfektif}</td>
                      <td className="border border-slate-300 px-3 py-2 text-slate-600">Pekan</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Rumus Pekan Efektif & JP Efektif */}
              <div className="space-y-2 pt-2">
                <h4 className="text-[11px] font-bold text-slate-700">3. Perhitungan Pekan Efektif & Jam Pelajaran (JP) Efektif</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-600 text-[11px]">a. Banyaknya Pekan Efektif:</span>
                    <p className="text-[10px] text-slate-400">Total Pekan – Pekan Tidak Efektif</p>
                    <p className="font-mono font-extrabold text-emerald-700 text-xs">
                      = {rpeData.totalPekanEfektifFormula}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-600 text-[11px]">b. Jumlah Jam Pelajaran (JP) Efektif:</span>
                    <p className="text-[10px] text-slate-400">Pekan Efektif × Beban JP/Pekan</p>
                    <p className="font-mono font-extrabold text-indigo-700 text-xs">
                      = {rpeData.totalJamEfektifFormula}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Bagian II: Distribusi Alokasi Waktu */}
            {rpeData.distribusiAlokasiWaktu && rpeData.distribusiAlokasiWaktu.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                  II. DISTRIBUSI ALOKASI WAKTU PEMBELAJARAN (MATERI POKOK)
                </h3>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold">
                      <th className="border border-slate-300 px-3 py-2 text-center w-12">No</th>
                      <th className="border border-slate-300 px-3 py-2 text-left">Materi Pokok / Lingkup Materi PJOK</th>
                      <th className="border border-slate-300 px-3 py-2 text-center w-28 bg-indigo-800 text-indigo-50">Alokasi Waktu</th>
                      <th className="border border-slate-300 px-3 py-2 text-left w-48">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rpeData.distribusiAlokasiWaktu.map((d, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-slate-500">{d.no}</td>
                        <td className="border border-slate-300 px-3 py-1.5">
                          <span className="font-bold text-slate-800">{d.materiPokok}</span>
                          {d.lingkupMateri && (
                            <div className="text-[10px] text-slate-500">{d.lingkupMateri}</div>
                          )}
                        </td>
                        <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-indigo-700">{d.alokasiWaktuJp} JP</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-600">{d.keterangan || '-'}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td colSpan={2} className="border border-slate-300 px-3 py-2 text-center">Jumlah Total Jam Pembelajaran</td>
                      <td className="border border-slate-300 px-3 py-2 text-center text-indigo-700 font-extrabold">{totalDistribusiJp} JP</td>
                      <td className="border border-slate-300 px-3 py-2 text-slate-600">
                        {diffJp === 0 ? 'Sesuai dengan Alokasi Jam Efektif' : `${diffJp > 0 ? `Lebih ${diffJp} JP` : `Kurang ${Math.abs(diffJp)} JP`}`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Bagian III: Catatan Analisis */}
            {rpeData.catatanAnalisis && (
              <div className="space-y-1 pt-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                  III. CATATAN & REKOMENDASI ANALISIS KALENDER
                </h3>
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 leading-relaxed italic">
                  {rpeData.catatanAnalisis}
                </div>
              </div>
            )}

            {/* Tanda Tangan */}
            <div className="grid grid-cols-2 text-center text-xs text-slate-800 pt-8 border-t border-slate-200 avoid-break">
              <div className="space-y-14">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-bold">Kepala Sekolah {rpeData.identitas.namaSekolah}</p>
                </div>
                <div>
                  <p className="font-bold underline">{rpeData.identitas.kepalaSekolah || '___________________________'}</p>
                  <p className="text-[11px] text-slate-600">NIP. {rpeData.identitas.nipKepsek || '_______________________'}</p>
                </div>
              </div>
              <div className="space-y-14">
                <div>
                  <p>{rpeData.identitas.kota || 'Jakarta'}, {rpeData.tanggalDokumen || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold">Guru Mata Pelajaran PJOK</p>
                </div>
                <div>
                  <p className="font-bold underline">{rpeData.identitas.namaGuru || '___________________________'}</p>
                  <p className="text-[11px] text-slate-600">NIP. {rpeData.identitas.nipGuru || '_______________________'}</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT 4: MATRIKS DISTRIBUSI JP PJOK */}
      {activeTab === 'matriks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                  Matriks & Diagnostik Alokasi Waktu PJOK
                </h3>
                <p className="text-xs text-slate-500">
                  Visualisasi sebaran jam pelajaran per elemen materi dan kecukupan waktu pembelajaran
                </p>
              </div>

              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                diffJp === 0 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                  : diffJp > 0 
                    ? 'bg-amber-50 text-amber-700 border-amber-300' 
                    : 'bg-blue-50 text-blue-700 border-blue-300'
              }`}>
                {diffJp === 0 ? 'Status: 100% Seimbang' : diffJp > 0 ? `Kelebihan: +${diffJp} JP` : `Sisa Jam: ${Math.abs(diffJp)} JP`}
              </div>
            </div>

            {/* Progress Bar Visual */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Alokasi Jam Terpakai vs Kapasitas Efektif</span>
                <span className="font-mono">{totalDistribusiJp} / {rpeData.totalJamEfektif} JP ({Math.round((totalDistribusiJp / (rpeData.totalJamEfektif || 1)) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                {(rpeData.distribusiAlokasiWaktu || []).map((item, idx) => {
                  const colors = [
                    'bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 
                    'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-purple-500'
                  ];
                  const percent = Math.min(100, Math.round(((item.alokasiWaktuJp || 0) / (rpeData.totalJamEfektif || 1)) * 100));
                  return (
                    <div 
                      key={idx} 
                      style={{ width: `${percent}%` }}
                      className={`${colors[idx % colors.length]} h-full transition-all`}
                      title={`${item.materiPokok}: ${item.alokasiWaktuJp} JP`}
                    />
                  );
                })}
              </div>
            </div>

            {/* List Breakdown Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {(rpeData.distribusiAlokasiWaktu || []).map((item, idx) => {
                const percent = Math.round(((item.alokasiWaktuJp || 0) / (rpeData.totalJamEfektif || 1)) * 100);
                return (
                  <div key={idx} className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-extrabold flex items-center justify-center">
                          {item.no}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">{item.materiPokok}</h4>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        {item.lingkupMateri || 'Elemen Capaian Pembelajaran'}
                      </span>
                      {item.keterangan && (
                        <span className="text-[10px] text-slate-400 block italic">
                          Keterangan: {item.keterangan}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-extrabold text-indigo-700 font-mono block">
                        {item.alokasiWaktuJp} JP
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {percent}% dari semester
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Diagnostic Advice */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-2">
              <h4 className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Rekomendasi Alokasi JP PJOK Berdasarkan Standar Kemendikbudristek:
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-700 text-[11px]">
                <li><b>Elemen Terampil Bergerak (Permainan & Olahraga):</b> Dianjurkan mendapat alokasi 50% - 60% total jam (sekitar 36–48 JP).</li>
                <li><b>Elemen Bergaya Hidup Aktif (Kebugaran):</b> Dianjurkan mendapat alokasi 15% - 20% total jam (sekitar 12–16 JP).</li>
                <li><b>Elemen Memilih Hidup Menyehatkan (Gizi & Kesehatan Diri):</b> Dianjurkan mendapat alokasi 10% - 15% total jam (sekitar 8–12 JP).</li>
                <li><b>Jam Cadangan (Remedial / Cuaca Ekstrem):</b> Selalu sisakan minimal 4 JP (1 pekan) untuk mengantisipasi hujan lebat atau ujian susulan.</li>
              </ul>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT 5: PANDUAN & REGULASI RPE */}
      {activeTab === 'panduan' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Panduan Lengkap Penyusunan Rincian Pekan Efektif (RPE)
            </h3>
            <p className="text-xs text-slate-500">
              Landasan regulasi dan tahapan sistematis penyusunan kalender pendidikan Kurikulum Merdeka
            </p>
          </div>

          {/* Section: Definisi */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              1. Apa itu RPE (Rincian Pekan Efektif)?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Rincian Pekan Efektif (RPE) adalah hitungan banyaknya pekan atau minggu yang dapat digunakan untuk kegiatan belajar mengajar (KBM) efektif tatap muka dalam satu semester. RPE merupakan dokumen acuan utama sebelum guru menyusun <b>Program Tahunan (PROTA)</b>, <b>Program Semester (PROSEM)</b>, dan <b>Modul Ajar PJOK</b>.
            </p>
          </div>

          {/* Section: 4 Langkah */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              2. Empat Langkah Menghitung RPE
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-indigo-700 block">Langkah 1: Hitung Pekan Kalender</span>
                <p className="text-slate-600 text-[11px]">
                  Hitung seluruh jumlah pekan dalam setiap bulan dari kalender pendidikan dinas (Juli–Desember untuk Ganjil, Januari–Juni untuk Genap). Sebuah pekan dihitung jika memiliki minimal 3 hari kerja aktif.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-red-700 block">Langkah 2: Data Pekan Tidak Efektif</span>
                <p className="text-slate-600 text-[11px]">
                  Petakan minggu di mana KBM reguler libur: Libur Akhir Semester, MPLS, Asesmen Tengah/Akhir Semester (STS/SAS), Penyerahan Rapor, dan Libur Hari Raya Keagamaan.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-emerald-700 block">Langkah 3: Hitung Pekan Efektif</span>
                <p className="text-slate-600 text-[11px]">
                  Gunakan formula: <br/>
                  <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-emerald-800 font-mono">
                    Pekan Efektif = Total Pekan – Pekan Tidak Efektif
                  </code>
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-purple-700 block">Langkah 4: Hitung Total Jam Efektif</span>
                <p className="text-slate-600 text-[11px]">
                  Kalikan pekan efektif dengan alokasi jam pelajaran mingguan (PJOK SD umumnya 4 JP/pekan): <br/>
                  <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-purple-800 font-mono">
                    Total JP = Pekan Efektif × Beban JP
                  </code>
                </p>
              </div>
            </div>
          </div>

          {/* Section: Tips PJOK */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-2">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Tips Khusus Guru PJOK dalam Mengelola Alokasi Waktu:
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-700 text-[11px]">
              <li><b>Kondisi Cuaca Lapangan:</b> Pada musim hujan (Oktober–Februari), pastikan memiliki rencana cadangan pembelajaran materi teori di dalam kelas (misal: Pola Hidup Sehat, Pertolongan Pertama).</li>
              <li><b>Uji Kebugaran Jasmani (TKJI):</b> Jadwalkan tes kebugaran di awal dan di akhir semester untuk memantau perkembangan fisik peserta didik secara objektif.</li>
              <li><b>Alokasi Cadangan:</b> Sisakan 4 hingga 8 JP untuk remedial asesmen praktik keterampilan motorik bagi siswa yang membutuhkan intervensi khusus.</li>
            </ul>
          </div>

        </div>
      )}

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Rincian Pekan Efektif (RPE) PJOK"
        subtitle={`Semester ${rpeData.identitas.semester} TA ${rpeData.identitas.tahunPelajaran} • ${rpeData.identitas.namaSekolah}`}
        tabs={getRpePrompts({
          semester: rpeData.identitas.semester,
          tahunAjaran: rpeData.identitas.tahunPelajaran,
          totalPekan: rpeData.alokasiWaktu.totalPekan,
          pekanEfektif: rpeData.alokasiWaktu.totalPekanEfektif
        })}
        jsonData={rpeData}
        jsonFilename={`RPE_${rpeData.identitas.namaSekolah.replace(/\s+/g, '_')}_Kelas${rpeData.identitas.kelas}`}
      />

    </div>
  );
}
