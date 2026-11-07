import React, { useState, useEffect, useRef } from 'react';
import { loadCpData } from '../utils/cpDataManager';
import { getPresetCpToTp, PRESET_CP_TO_TP_DATA } from '../utils/cpToTpPresets';
import { CpToTpResult, TpItem, CpFase } from '../types';
import { 
  Target, 
  BookOpen, 
  Sparkles, 
  Printer, 
  Copy, 
  Check, 
  FileText, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  Download, 
  Layers, 
  Cpu, 
  Award, 
  Info, 
  ArrowRight,
  ListOrdered,
  HelpCircle,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Building,
  Upload,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Search,
  Sparkle
} from 'lucide-react';
import { exportCpToTpToDoc, downloadDocFile, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import { fetchWithRetry } from '../lib/fetchUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getCpToTpPrompts } from '../utils/aiPromptGenerators';

const LOCAL_STORAGE_SAVED_TP_KEY = 'sadar_pjok_cp_to_tp_saved_data_v2';

export default function CpToTpView() {
  const [cpDataList, setCpDataList] = useState<CpFase[]>(() => loadCpData());
  const [selectedFaseId, setSelectedFaseId] = useState<string>('fase-a');
  const [activeElementId, setActiveElementId] = useState<string>('fase-a-terampil');
  const [targetKelas, setTargetKelas] = useState<string>('1');
  const [targetSemester, setTargetSemester] = useState<string>('1');
  const [materiSpesifik, setMateriSpesifik] = useState<string>('');
  const [pendekatanFormat, setPendekatanFormat] = useState<string>('Standar Kurikulum Merdeka (Kompetensi + Lingkup Materi)');
  const [customCpText, setCustomCpText] = useState<string>('');

  // Active view tab mode
  const [activeTabMode, setActiveTabMode] = useState<'editor' | 'matriks' | 'dokumen' | 'panduan'>('editor');

  // School metadata for official print & documents
  const [namaSekolah, setNamaSekolah] = useState<string>(() => localStorage.getItem('sadar_pjok_sekolah_cp') || 'SD Negeri Kalimantong');
  const [namaGuru, setNamaGuru] = useState<string>(() => localStorage.getItem('sadar_pjok_guru_cp') || 'Guru PJOK, S.Pd.');
  const [nipGuru, setNipGuru] = useState<string>(() => localStorage.getItem('sadar_pjok_nip_guru_cp') || '19890512 201502 1 002');
  const [kepalaSekolah, setKepalaSekolah] = useState<string>(() => localStorage.getItem('sadar_pjok_kepsek_cp') || 'Kepala Sekolah, M.Pd.');
  const [nipKepsek, setNipKepsek] = useState<string>(() => localStorage.getItem('sadar_pjok_nip_kepsek_cp') || '19750318 200003 1 005');
  const [tahunAjaran, setTahunAjaran] = useState<string>(() => localStorage.getItem('sadar_pjok_thn_cp') || '2026/2027');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Result data loaded from localStorage or default preset (never empty!)
  const [resultData, setResultData] = useState<CpToTpResult>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SAVED_TP_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.daftarTp) && parsed.daftarTp.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gagal membaca saved TP dari localStorage:', e);
    }
    return getPresetCpToTp('fase-a', '1', 'terampil') || PRESET_CP_TO_TP_DATA['fase-a-kelas-1-terampil'];
  });

  // Modal Editing TP item states
  const [isEditTpModalOpen, setIsEditTpModalOpen] = useState(false);
  const [editingTpIndex, setEditingTpIndex] = useState<number | null>(null);
  const [editingTp, setEditingTp] = useState<TpItem | null>(null);
  const [tempNewIktpInput, setTempNewIktpInput] = useState('');

  // Modal Editing Dekonstruksi CP state
  const [isEditDekonstruksiOpen, setIsEditDekonstruksiOpen] = useState(false);
  const [tempKkoInput, setTempKkoInput] = useState('');
  const [tempMateriInput, setTempMateriInput] = useState('');
  const [tempDekonstruksiData, setTempDekonstruksiData] = useState<{
    kompetensiUtama: string[];
    lingkupMateriUtama: string[];
    variasiKarakteristikSiswa: string;
  }>({
    kompetensiUtama: [],
    lingkupMateriUtama: [],
    variasiKarakteristikSiswa: ''
  });

  // Modal Editing Catatan & Strategi
  const [isEditStrategiOpen, setIsEditStrategiOpen] = useState(false);
  const [tempRekomendasiPendekatan, setTempRekomendasiPendekatan] = useState('');
  const [tempCatatanPendidik, setTempCatatanPendidik] = useState('');

  // Feedback notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedTable, setCopiedTable] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen to CP updates from other views (such as CapaianPembelajaranView)
  useEffect(() => {
    const handleCpUpdated = () => {
      setCpDataList(loadCpData());
    };
    window.addEventListener('sadar_pjok_cp_updated', handleCpUpdated);
    return () => window.removeEventListener('sadar_pjok_cp_updated', handleCpUpdated);
  }, []);

  // Save resultData to localStorage whenever it changes
  useEffect(() => {
    if (resultData) {
      localStorage.setItem(LOCAL_STORAGE_SAVED_TP_KEY, JSON.stringify(resultData));
    }
  }, [resultData]);

  // Show temporary toast notification
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const activeFase = cpDataList.find(f => f.id === selectedFaseId) || cpDataList[0] || {
    id: 'fase-a',
    phaseName: 'Fase A',
    grades: 'Kelas 1 & 2',
    elements: []
  };
  const activeElement = activeFase.elements.find(e => e.id === activeElementId) || activeFase.elements[0] || {
    id: 'fase-a-terampil',
    name: 'Terampil Bergerak',
    description: ''
  };

  // Auto-sync CP text when phase or element changes
  const handleFaseSelect = (faseId: string) => {
    setSelectedFaseId(faseId);
    const targetFase = cpDataList.find(f => f.id === faseId);
    if (targetFase && targetFase.elements.length > 0) {
      setActiveElementId(targetFase.elements[0].id);
      setCustomCpText(targetFase.elements[0].description);
    }
    // Sync default grade based on phase
    if (faseId === 'fase-a') setTargetKelas('1');
    else if (faseId === 'fase-b') setTargetKelas('3');
    else if (faseId === 'fase-c') setTargetKelas('5');
    else if (faseId === 'fase-d') setTargetKelas('7');

    setGenerationError(null);
  };

  const handleElementSelect = (elementId: string) => {
    setActiveElementId(elementId);
    const targetEl = activeFase.elements.find(e => e.id === elementId);
    if (targetEl) {
      setCustomCpText(targetEl.description);
    }
    setGenerationError(null);
  };

  // Formulate CP to TP using AI API
  const handleGenerateCpToTp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationError(null);

    const cpContentToUse = customCpText.trim() || activeElement.description;

    try {
      const response = await fetchWithRetry('/api/generate-cp-to-tp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fase: `${activeFase.phaseName} (${activeFase.grades})`,
          kelas: `Kelas ${targetKelas} SD (Semester ${targetSemester})`,
          elemen: activeElement.name,
          cpText: cpContentToUse,
          materiSpesifik: materiSpesifik.trim(),
          pendekatanFormat
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data: CpToTpResult = await response.json();
      setResultData(data);
      showToast('Formulasi CP ke Tujuan Pembelajaran (TP) berhasil dirumuskan AI!', 'success');
    } catch (err: any) {
      console.error('CP to TP Generation error:', err);
      setGenerationError(err.message || 'Gagal merumuskan TP dengan AI. Anda dapat memuat Preset Standar atau membuat TP secara manual.');
    } finally {
      setIsGenerating(false);
    }
  };

  // LOAD PRESET STANDAR (NO AI REQUIRED)
  const handleLoadPreset = () => {
    const preset = getPresetCpToTp(selectedFaseId, targetKelas, activeElement.name);
    if (preset) {
      setResultData({
        ...preset,
        kelas: `Kelas ${targetKelas} SD (Semester ${targetSemester})`,
        fase: `${activeFase.phaseName} (${activeFase.grades})`,
        elemen: activeElement.name,
        cpAsli: customCpText.trim() || activeElement.description
      });
      showToast(`Preset Formulasi Standar untuk ${activeElement.name} (Kelas ${targetKelas}) berhasil dimuat!`, 'success');
    } else {
      showToast('Preset untuk kombinasi ini tidak ditemukan. Gunakan generator AI atau buat TP manual.', 'info');
    }
  };

  // CREATE NEW EMPTY FORMULATION MANUAL
  const handleCreateManualFormulation = () => {
    const newManual: CpToTpResult = {
      fase: `${activeFase.phaseName} (${activeFase.grades})`,
      kelas: `Kelas ${targetKelas} SD (Semester ${targetSemester})`,
      elemen: activeElement.name,
      cpAsli: customCpText.trim() || activeElement.description,
      materiSpesifik: materiSpesifik.trim() || activeElement.name,
      analisisDekonstruksi: {
        kompetensiUtama: ['Mempraktikkan (P3)', 'Menganalisis (C4)', 'Menunjukkan Sikap (A3)'],
        lingkupMateriUtama: activeElement.lingkupMateri && activeElement.lingkupMateri.length > 0 
          ? [...activeElement.lingkupMateri] 
          : ['Materi Pokok 1', 'Materi Pokok 2'],
        variasiKarakteristikSiswa: 'Siswa kelas ' + targetKelas + ' memiliki kemampuan motorik yang berkembang, membutuhkan panduan gerak jelas dan suasana pembelajaran yang kolaboratif.'
      },
      daftarTp: [
        {
          kodeTp: `TP ${targetKelas}.1`,
          rumusanTp: 'Peserta didik mampu mempraktikkan keterampilan gerak dasar sesuai dengan konsep gerak yang benar secara terkoordinasi dan berulang.',
          kompetensiKko: 'Mempraktikkan (P3)',
          lingkupMateri: activeElement.name,
          indikatorKetercapaian: [
            'Menjelaskan tahapan awal, pelaksanaan, dan sikap akhir gerak',
            'Melakukan gerakan secara mandiri dengan koordinasi yang baik',
            'Menunjukkan sikap sportif dan menghargai teman saat berlatih'
          ],
          profilPancasila: 'Mandiri, Gotong Royong',
          targetKelasSemester: `Kelas ${targetKelas} / Semester ${targetSemester}`,
          alokasiWaktu: '6 JP (2 Pertemuan)',
          rekomendasiAsesmen: 'Tes Unjuk Kerja Keterampilan Gerak & Observasi Sikap'
        }
      ],
      rekomendasiPendekatan: 'Pembelajaran berbasis aktivitas langsung (Direct Instruction) dikombinasikan dengan metode permainan beregu terarah.',
      catatanPendidik: 'Lakukan pemanasan peregangan menyeluruh dan berikan penguatan positif kepada siswa yang masih ragu mencoba.'
    };

    setResultData(newManual);
    showToast('Formulasi manual baru siap diedit.', 'info');
  };

  // OPEN EDIT TP MODAL
  const openEditTpModal = (index: number) => {
    setEditingTpIndex(index);
    setEditingTp({ ...resultData.daftarTp[index] });
    setTempNewIktpInput('');
    setIsEditTpModalOpen(true);
  };

  // SAVE EDITED TP
  const handleSaveEditTp = () => {
    if (editingTpIndex === null || !editingTp) return;
    if (!editingTp.rumusanTp.trim()) {
      showToast('Rumusan Tujuan Pembelajaran wajib diisi!', 'error');
      return;
    }

    const updatedTpList = [...resultData.daftarTp];
    updatedTpList[editingTpIndex] = editingTp;
    setResultData({
      ...resultData,
      daftarTp: updatedTpList
    });
    setIsEditTpModalOpen(false);
    setEditingTpIndex(null);
    setEditingTp(null);
    showToast(`Perubahan ${editingTp.kodeTp} berhasil disimpan!`, 'success');
  };

  // DELETE TP
  const handleDeleteTp = (index: number) => {
    if (resultData.daftarTp.length <= 1) {
      showToast('Formulasi minimal harus memiliki 1 Tujuan Pembelajaran (TP).', 'error');
      return;
    }

    const targetTp = resultData.daftarTp[index];
    if (confirm(`Apakah Anda yakin ingin menghapus ${targetTp.kodeTp}: "${targetTp.rumusanTp.slice(0, 40)}..."?`)) {
      const updatedTpList = resultData.daftarTp.filter((_, i) => i !== index);
      setResultData({
        ...resultData,
        daftarTp: updatedTpList
      });
      showToast(`${targetTp.kodeTp} berhasil dihapus.`, 'info');
    }
  };

  // MOVE TP UP / DOWN (REORDER)
  const handleMoveTp = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= resultData.daftarTp.length) return;

    const updatedTpList = [...resultData.daftarTp];
    const temp = updatedTpList[index];
    updatedTpList[index] = updatedTpList[newIndex];
    updatedTpList[newIndex] = temp;

    setResultData({
      ...resultData,
      daftarTp: updatedTpList
    });
  };

  // ADD NEW EMPTY TP
  const handleAddNewTp = () => {
    const nextNum = resultData.daftarTp.length + 1;
    const newTp: TpItem = {
      kodeTp: `TP ${targetKelas}.${nextNum}`,
      rumusanTp: 'Peserta didik mampu mempraktikkan keterampilan gerak spesifik dalam berbagai situasi permainan secara mandiri dan disiplin.',
      kompetensiKko: 'Mempraktikkan (P3)',
      lingkupMateri: activeElement.name,
      indikatorKetercapaian: [
        'Mengidentifikasi urutan gerak yang benar',
        'Melakukan gerakan secara mandiri dan percaya diri'
      ],
      profilPancasila: 'Mandiri, Gotong Royong',
      targetKelasSemester: `Kelas ${targetKelas} / Semester ${targetSemester}`,
      alokasiWaktu: '6 JP',
      rekomendasiAsesmen: 'Tes Unjuk Kerja Praktik'
    };

    setResultData({
      ...resultData,
      daftarTp: [...resultData.daftarTp, newTp]
    });
    showToast(`TP ${targetKelas}.${nextNum} berhasil ditambahkan! Anda dapat mengklik tombol edit untuk mengubahnya.`, 'success');
  };

  // OPEN EDIT DEKONSTRUKSI MODAL
  const openEditDekonstruksi = () => {
    setTempDekonstruksiData({
      kompetensiUtama: [...resultData.analisisDekonstruksi.kompetensiUtama],
      lingkupMateriUtama: [...resultData.analisisDekonstruksi.lingkupMateriUtama],
      variasiKarakteristikSiswa: resultData.analisisDekonstruksi.variasiKarakteristikSiswa || ''
    });
    setTempKkoInput('');
    setTempMateriInput('');
    setIsEditDekonstruksiOpen(true);
  };

  // SAVE EDIT DEKONSTRUKSI
  const handleSaveEditDekonstruksi = () => {
    setResultData({
      ...resultData,
      analisisDekonstruksi: {
        ...tempDekonstruksiData
      }
    });
    setIsEditDekonstruksiOpen(false);
    showToast('Hasil dekonstruksi CP berhasil diperbarui!', 'success');
  };

  // OPEN EDIT STRATEGI & CATATAN
  const openEditStrategi = () => {
    setTempRekomendasiPendekatan(resultData.rekomendasiPendekatan || '');
    setTempCatatanPendidik(resultData.catatanPendidik || '');
    setIsEditStrategiOpen(true);
  };

  // SAVE EDIT STRATEGI
  const handleSaveEditStrategi = () => {
    setResultData({
      ...resultData,
      rekomendasiPendekatan: tempRekomendasiPendekatan.trim(),
      catatanPendidik: tempCatatanPendidik.trim()
    });
    setIsEditStrategiOpen(false);
    showToast('Rekomendasi strategi dan catatan guru berhasil disimpan!', 'success');
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // EXPORT DOC
  const handleDownloadDoc = () => {
    const docHtml = exportCpToTpToDoc(resultData, {
      namaSekolah,
      namaGuru,
      nipGuru,
      kepalaSekolah,
      nipKepsek,
      tahunAjaran
    });
    downloadDocFile(`Formulasi_CP_ke_TP_F4_${resultData.elemen.replace(/\s+/g, '_')}_Kelas_${targetKelas}`, docHtml);
    showToast('Dokumen Formulasi CP ke TP Word (.doc) F4 berhasil diunduh!', 'success');
  };

  // EXPORT F4 PDF
  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docHtml = exportCpToTpToDoc(resultData, {
        namaSekolah,
        namaGuru,
        nipGuru,
        kepalaSekolah,
        nipKepsek,
        tahunAjaran
      });
      const fileName = `Formulasi_CP_ke_TP_F4_${resultData.elemen.replace(/\s+/g, '_')}_Kelas_${targetKelas}.pdf`;
      const success = await downloadHtmlAsPdf(fileName, docHtml, {
        orientation: 'portrait',
        marginMm: 12
      });
      if (success) {
        showToast('Dokumen PDF F4 Formulasi CP ke TP berhasil diunduh!', 'success');
      } else {
        printHtmlDocument(docHtml, `Formulasi CP ke TP F4 - Kelas ${targetKelas}`);
      }
    } catch (err) {
      console.error('Error generating CP ke TP F4 PDF:', err);
      handlePrint();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // PRINT F4
  const handlePrint = () => {
    const docHtml = exportCpToTpToDoc(resultData, {
      namaSekolah,
      namaGuru,
      nipGuru,
      kepalaSekolah,
      nipKepsek,
      tahunAjaran
    });
    printHtmlDocument(docHtml, `Formulasi CP ke TP F4 - Kelas ${targetKelas}`);
  };

  // EXPORT JSON
  const handleExportJson = () => {
    downloadJsonFile(`Formulasi_CP_TP_${activeFase.id}_Kelas_${targetKelas}`, {
      judul: 'Formulasi CP ke Tujuan Pembelajaran (TP) PJOK',
      tanggalEkspor: new Date().toISOString(),
      fase: resultData.fase,
      kelas: resultData.kelas,
      elemen: resultData.elemen,
      hasilFormulasi: resultData
    });
    showToast('Cadangan berkas JSON berhasil diunduh.', 'success');
  };

  // IMPORT JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const formulation = parsed.hasilFormulasi || parsed;
        if (formulation && Array.isArray(formulation.daftarTp)) {
          setResultData(formulation);
          showToast('Berhasil mengimpor formulasi TP dari berkas JSON!', 'success');
        } else {
          showToast('Berkas JSON tidak sesuai struktur formulasi TP.', 'error');
        }
      } catch (err) {
        showToast('Gagal memproses berkas JSON.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // COPY TEXT
  const copyToClipboard = () => {
    let text = `FORMULASI PENYUSUNAN CP KE TUJUAN PEMBELAJARAN (TP) - PJOK SD\n`;
    text += `=========================================================\n`;
    text += `Satuan Pendidikan: ${namaSekolah}\n`;
    text += `Fase / Target: ${resultData.fase} / ${resultData.kelas}\n`;
    text += `Elemen: ${resultData.elemen}\n`;
    text += `Teks CP: "${resultData.cpAsli}"\n\n`;

    text += `1. DEKONSTRUKSI CP:\n`;
    text += `   - Kompetensi KKO: ${(resultData.analisisDekonstruksi.kompetensiUtama || []).join(', ')}\n`;
    text += `   - Lingkup Materi: ${(resultData.analisisDekonstruksi.lingkupMateriUtama || []).join(', ')}\n`;
    text += `   - Karakteristik: ${resultData.analisisDekonstruksi.variasiKarakteristikSiswa}\n\n`;

    text += `2. DAFTAR RUMUSAN TUJUAN PEMBELAJARAN (TP):\n`;
    resultData.daftarTp.forEach((tp, i) => {
      text += `\n[${tp.kodeTp}] ${tp.rumusanTp}\n`;
      text += `   • KKO: ${tp.kompetensiKko} | Materi: ${tp.lingkupMateri}\n`;
      text += `   • Target: ${tp.targetKelasSemester} (${tp.alokasiWaktu}) | Asesmen: ${tp.rekomendasiAsesmen}\n`;
      text += `   • Profil Pancasila: ${tp.profilPancasila}\n`;
      if (tp.indikatorKetercapaian && tp.indikatorKetercapaian.length > 0) {
        text += `   • IKTP: ${tp.indikatorKetercapaian.join('; ')}\n`;
      }
    });

    text += `\n3. STRATEGI & CATATAN:\n`;
    text += `   - Pendekatan: ${resultData.rekomendasiPendekatan}\n`;
    text += `   - Catatan Guru: ${resultData.catatanPendidik}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast('Teks formulasi berhasil disalin ke clipboard!', 'success');
  };

  // COPY TABLE FOR EXCEL / SPREADSHEET
  const copyTableToClipboard = () => {
    let tsv = `No\tKode TP\tRumusan Tujuan Pembelajaran\tKompetensi (KKO)\tLingkup Materi\tIKTP\tTarget Kelas/Semester\tAlokasi Waktu\tProfil Pancasila\tAsesmen\n`;
    resultData.daftarTp.forEach((tp, idx) => {
      const iktpStr = (tp.indikatorKetercapaian || []).join('; ');
      tsv += `${idx + 1}\t${tp.kodeTp}\t${tp.rumusanTp}\t${tp.kompetensiKko}\t${tp.lingkupMateri}\t${iktpStr}\t${tp.targetKelasSemester}\t${tp.alokasiWaktu}\t${tp.profilPancasila}\t${tp.rekomendasiAsesmen}\n`;
    });

    navigator.clipboard.writeText(tsv);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2500);
    showToast('Format tabel disalin! Anda bisa langsung menempelkannya (Paste) di Microsoft Excel atau Google Spreadsheet.', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold animate-slideDown ${
          notification.type === 'success' 
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20' 
            : notification.type === 'error'
            ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/20'
            : 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/20'
        }`}>
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          {notification.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-sm border border-emerald-800/40 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Kurikulum Merdeka PJOK (BSKAP 046/H/KR/2025)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Dapat Diedit & Disimpan Lengkap
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-800 text-slate-300">
              {resultData.daftarTp.length} TP Tersedia
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Target className="w-6 h-6 text-emerald-400" />
            Formulasi &amp; Penurunan CP ke TP (Tujuan Pembelajaran)
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed">
            Alat analisis dekonstruksi Capaian Pembelajaran (CP) menjadi Tujuan Pembelajaran (TP) yang terukur, hirarkis, dan langsung siap dipetakan ke Alur Tujuan Pembelajaran (ATP), Modul Ajar, serta Rekap Asesmen.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadDoc}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Unduh Berkas Word Formulasi Lengkap (.doc)"
          >
            <Download className="w-4 h-4" />
            <span>Download Word</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Unduh Berkas PDF Ukuran F4 Siap Cetak"
          >
            <FileText className="w-4 h-4" />
            <span>{isExportingPdf ? 'Memproses PDF...' : 'Download PDF (F4)'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer"
            title="Cetak Berkas Formulasi F4"
          >
            <Printer className="w-4 h-4 text-emerald-300" />
            <span>Cetak F4</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            title="Cadangkan Konfigurasi TP ke JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Backup</span> JSON
          </button>

          <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Impor</span> JSON
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json" 
              onChange={handleImportJson} 
              className="hidden" 
            />
          </label>

          <ExportJsonPromptAiButtons
            onExportJson={handleExportJson}
            onOpenPromptAi={() => setShowPromptModal(true)}
          />
        </div>
      </div>

      {/* Sub Navigation Modes (Tabs) */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap gap-1 no-print">
        <button
          onClick={() => setActiveTabMode('editor')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTabMode === 'editor'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Editor &amp; Kartu TP Interaktif</span>
        </button>

        <button
          onClick={() => setActiveTabMode('matriks')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTabMode === 'matriks'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Matriks Tabel Lengkap (Excel)</span>
        </button>

        <button
          onClick={() => setActiveTabMode('dokumen')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTabMode === 'dokumen'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Dokumen Cetak Formal</span>
        </button>

        <button
          onClick={() => setActiveTabMode('panduan')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTabMode === 'panduan'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Panduan PPA &amp; Taksonomi KKO</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: EDITOR & KARTU TP INTERAKTIF (BENTO WORKFLOW) */}
      {/* ============================================================== */}
      {activeTabMode === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Form Setup Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4 no-print">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs">Parameter Capaian Pembelajaran</h3>
                    <p className="text-[10px] text-slate-400">Pilih Fase, Kelas, dan Elemen untuk formulasi TP</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLoadPreset}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  title="Muat contoh formulasi TP standar tanpa menunggu AI"
                >
                  <Sparkle className="w-3 h-3 text-amber-600" />
                  <span>Muat Preset Standar</span>
                </button>
              </div>

              <form onSubmit={handleGenerateCpToTp} className="space-y-4">
                
                {/* Fase Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tingkat Fase SD
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {cpDataList.slice(0, 3).map(f => (
                      <button
                        type="button"
                        key={f.id}
                        onClick={() => handleFaseSelect(f.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedFaseId === f.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <div className="text-xs">{f.phaseName}</div>
                        <div className={`text-[9px] mt-0.5 ${selectedFaseId === f.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {f.grades}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Kelas & Semester Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Target Kelas
                    </label>
                    <select
                      value={targetKelas}
                      onChange={(e) => setTargetKelas(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                    >
                      {selectedFaseId === 'fase-a' && (
                        <>
                          <option value="1">Kelas 1 SD</option>
                          <option value="2">Kelas 2 SD</option>
                        </>
                      )}
                      {selectedFaseId === 'fase-b' && (
                        <>
                          <option value="3">Kelas 3 SD</option>
                          <option value="4">Kelas 4 SD</option>
                        </>
                      )}
                      {selectedFaseId === 'fase-c' && (
                        <>
                          <option value="5">Kelas 5 SD</option>
                          <option value="6">Kelas 6 SD</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Target Semester
                    </label>
                    <select
                      value={targetSemester}
                      onChange={(e) => setTargetSemester(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="1">Semester 1 (Ganjil)</option>
                      <option value="2">Semester 2 (Genap)</option>
                    </select>
                  </div>
                </div>

                {/* Elemen Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Elemen PJOK
                  </label>
                  <div className="space-y-1.5">
                    {activeFase.elements.map(el => (
                      <button
                        type="button"
                        key={el.id}
                        onClick={() => handleElementSelect(el.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          activeElementId === el.id
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{el.name}</span>
                          {el.alias && <span className="text-[10px] text-slate-400 font-normal">({el.alias})</span>}
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 ${activeElementId === el.id ? 'text-emerald-600' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Teks CP Active Field (Editable) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Teks Capaian Pembelajaran (CP)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const el = activeFase.elements.find(e => e.id === activeElementId);
                        if (el) {
                          setCustomCpText(el.description);
                          showToast('Teks CP disinkronkan kembali dari data elemen resmi.', 'info');
                        }
                      }}
                      className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Sinkron Elemen
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={customCpText || activeElement.description}
                    onChange={(e) => setCustomCpText(e.target.value)}
                    placeholder="Isi atau sesuaikan kalimat Capaian Pembelajaran..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white resize-y"
                  />
                </div>

                {/* Materi Pokok Spesifik */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Fokus Topik / Materi Spesifik <span className="text-slate-400">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={materiSpesifik}
                    onChange={(e) => setMateriSpesifik(e.target.value)}
                    placeholder="Contoh: Sepak Bola, Kasti, Roll Depan, Atletik Lari..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  {activeElement.lingkupMateri && activeElement.lingkupMateri.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      <span className="text-[9px] text-slate-400 self-center">Pilih cepat:</span>
                      {activeElement.lingkupMateri.slice(0, 3).map((m, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setMateriSpesifik(m)}
                          className="text-[9px] bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pendekatan Format Perumusan */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Format / Pendekatan Perumusan TP
                  </label>
                  <select
                    value={pendekatanFormat}
                    onChange={(e) => setPendekatanFormat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Standar Kurikulum Merdeka (Kompetensi + Lingkup Materi)">
                      Standar Kurikulum Merdeka (Kompetensi + Lingkup Materi)
                    </option>
                    <option value="Format ABCD (Audience, Behavior, Condition, Degree)">
                      Format ABCD (Audience, Behavior, Condition, Degree)
                    </option>
                    <option value="Pendekatan KKO Bloom Taxonomy & SOLO">
                      Pendekatan KKO Bloom &amp; Taksonomi SOLO
                    </option>
                  </select>
                </div>

                {/* Action Buttons: Rumuskan AI & Manual */}
                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Membedah &amp; Merumuskan TP (AI)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Rumuskan CP ke TP dengan AI</span>
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleLoadPreset}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center"
                    >
                      Muat Preset Standar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateManualFormulation}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center"
                    >
                      + Buat Formulasi Manual
                    </button>
                  </div>
                </div>

              </form>
            </div>

            {/* Quick Tips */}
            <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>Tips Penyusunan TP:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Tujuan Pembelajaran harus memuat <strong>Kompetensi</strong> (kemampuan yang didemonstrasikan siswa) dan <strong>Lingkup Materi</strong>. Susun alur TP mulai dari yang sederhana (LOTS) menuju kompleks (HOTS).
              </p>
            </div>
          </div>

          {/* Right Output Display Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Action Bar Above Results */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Hasil Formulasi CP ke TP:</span>
                <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-extrabold">
                  {resultData.elemen}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  ({resultData.kelas})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyToClipboard}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Salin ringkasan teks TP"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>

                <button
                  onClick={copyTableToClipboard}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Salin format tabel untuk ditempelkan di Excel"
                >
                  {copiedTable ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Layers className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedTable ? 'Tersalin Excel!' : 'Salin Excel'}</span>
                </button>

                <button
                  onClick={handleDownloadDoc}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                  title="Unduh berkas Word"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Word</span>
                </button>
              </div>
            </div>

            {/* Error Notification if any */}
            {generationError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block">Gagal Menghubungkan ke AI:</strong>
                  <p>{generationError}</p>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isGenerating && (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">Sedang Merumuskan Tujuan Pembelajaran (AI)...</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Menganalisis kata kerja operasional (KKO) dan memetakan alur pembelajaran berurutan.
                </p>
              </div>
            )}

            {/* 1. KARTU DEKONSTRUKSI CP */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  <span>1. Analisis Dekonstruksi Capaian Pembelajaran (CP)</span>
                </div>
                <button
                  onClick={openEditDekonstruksi}
                  className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  title="Edit hasil dekonstruksi KKO & Materi"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Dekonstruksi</span>
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <span className="font-bold text-slate-400 text-[10px] uppercase block tracking-wider">Kalimat CP Asli:</span>
                <p className="italic text-slate-800 leading-relaxed font-serif">"{resultData.cpAsli}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* KKO Kompetensi */}
                <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    🎯 Kompetensi Utama (KKO):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(resultData.analisisDekonstruksi.kompetensiUtama || []).map((komp, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md text-[11px] font-semibold">
                        {komp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Lingkup Materi */}
                <div className="bg-blue-50/50 border border-blue-200/70 rounded-xl p-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                    📚 Lingkup Materi Pokok:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(resultData.analisisDekonstruksi.lingkupMateriUtama || []).map((mat, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md text-[11px] font-semibold">
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {resultData.analisisDekonstruksi.variasiKarakteristikSiswa && (
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                  <span className="font-bold text-slate-700">Karakteristik Siswa: </span>
                  <span>{resultData.analisisDekonstruksi.variasiKarakteristikSiswa}</span>
                </div>
              )}
            </div>

            {/* 2. KARTU DAFTAR TP TERSTRUKTUR */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                  <ListOrdered className="w-4 h-4 text-emerald-600" />
                  <span>2. Rumusan Tujuan Pembelajaran (TP) Terstruktur ({resultData.daftarTp.length} TP)</span>
                </div>

                <button
                  onClick={handleAddNewTp}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah TP Baru</span>
                </button>
              </div>

              {/* List of TP Cards */}
              <div className="space-y-3.5">
                {resultData.daftarTp.map((tp, index) => (
                  <div 
                    key={index} 
                    className="border border-slate-200 hover:border-emerald-400/80 rounded-2xl p-4 transition-all bg-white hover:shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black tracking-tight">
                          {tp.kodeTp}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {tp.targetKelasSemester}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {tp.alokasiWaktu}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-150">
                          {tp.rekomendasiAsesmen}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveTp(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                          title="Geser ke atas"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveTp(index, 'down')}
                          disabled={index === resultData.daftarTp.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                          title="Geser ke bawah"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditTpModal(index)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                          title="Edit TP Ini"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTp(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Hapus TP Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* TP Statement */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs md:text-sm leading-snug">
                        {tp.rumusanTp}
                      </h4>
                    </div>

                    {/* Metadata KKO & Materi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-150">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">KKO &amp; Materi:</span>
                        <span className="font-semibold text-slate-800">{tp.kompetensiKko}</span>
                        <span className="text-slate-400 mx-1">•</span>
                        <span className="text-slate-600">{tp.lingkupMateri}</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-150">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Profil Pancasila (P3):</span>
                        <span className="font-semibold text-emerald-800">{tp.profilPancasila}</span>
                      </div>
                    </div>

                    {/* IKTP Indicators List */}
                    {tp.indikatorKetercapaian && tp.indikatorKetercapaian.length > 0 && (
                      <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/70 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                          Indikator Ketercapaian Tujuan Pembelajaran (IKTP):
                        </span>
                        <ul className="space-y-1 text-xs text-slate-700 pl-1">
                          {tp.indikatorKetercapaian.map((ind, iIdx) => (
                            <li key={iIdx} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold text-xs mt-0.5">✓</span>
                              <span className="leading-relaxed">{ind}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. KARTU STRATEGI & CATATAN PENDIDIK */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>3. Rekomendasi Strategi &amp; Catatan Pendidik</span>
                </div>
                <button
                  onClick={openEditStrategi}
                  className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  title="Edit rekomendasi strategi dan catatan"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Catatan</span>
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  <span className="font-bold text-emerald-950 block mb-0.5">Pendekatan &amp; Metode Pembelajaran:</span>
                  <p className="leading-relaxed">{resultData.rekomendasiPendekatan}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-0.5">Catatan Pelaksanaan Guru:</span>
                  <p className="leading-relaxed text-slate-600">{resultData.catatanPendidik}</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: MATRIKS TABEL LENGKAP (EXCEL COMPATIBLE) */}
      {/* ============================================================== */}
      {activeTabMode === 'matriks' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Matriks Tabel Penurunan CP ke TP
              </h3>
              <p className="text-xs text-slate-400">
                Format tabel kurikulum formal siap disalin ke Microsoft Excel atau dicetak langsung.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyTableToClipboard}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                {copiedTable ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTable ? 'Berhasil Disalin!' : 'Salin untuk Excel (TSV)'}</span>
              </button>

              <button
                onClick={handleDownloadDoc}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Unduh Word</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px]">
                    <th className="p-3 w-12 text-center border-r border-slate-700">No</th>
                    <th className="p-3 w-24 text-center border-r border-slate-700">Kode TP</th>
                    <th className="p-3 w-64 border-r border-slate-700">Elemen &amp; Kalimat CP</th>
                    <th className="p-3 w-72 border-r border-slate-700">Rumusan Tujuan Pembelajaran (TP)</th>
                    <th className="p-3 w-56 border-r border-slate-700">Indikator Ketercapaian (IKTP)</th>
                    <th className="p-3 w-48 border-r border-slate-700">KKO &amp; Lingkup Materi</th>
                    <th className="p-3 w-32 text-center border-r border-slate-700">Target / Waktu</th>
                    <th className="p-3 w-40">Profil P3 &amp; Asesmen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {resultData.daftarTp.map((tp, idx) => (
                    <tr key={idx} className="align-top hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200 bg-slate-50/50">
                        {idx + 1}
                      </td>
                      <td className="p-3 text-center font-extrabold text-emerald-800 border-r border-slate-200 bg-emerald-50/20">
                        {tp.kodeTp}
                      </td>
                      {idx === 0 && (
                        <td 
                          rowSpan={resultData.daftarTp.length} 
                          className="p-3 border-r border-slate-200 bg-slate-50/30 text-justify text-slate-700 leading-relaxed"
                        >
                          <strong className="text-slate-900 block mb-1 text-xs">{resultData.elemen}</strong>
                          <p className="text-[11px] text-slate-600 italic">"{resultData.cpAsli}"</p>
                        </td>
                      )}
                      <td className="p-3 border-r border-slate-200 text-slate-900 font-semibold leading-relaxed">
                        {tp.rumusanTp}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-slate-600">
                        {tp.indikatorKetercapaian && tp.indikatorKetercapaian.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1 text-[11px]">
                            {tp.indikatorKetercapaian.map((ind, i) => (
                              <li key={i}>{ind}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-slate-700">
                        <div className="font-semibold text-emerald-800">{tp.kompetensiKko}</div>
                        <div className="text-slate-600 mt-1">{tp.lingkupMateri}</div>
                      </td>
                      <td className="p-3 text-center border-r border-slate-200">
                        <div className="font-semibold text-slate-800">{tp.targetKelasSemester}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">
                          {tp.alokasiWaktu}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">
                        <div className="text-emerald-800 font-medium text-[11px]">{tp.profilPancasila}</div>
                        <div className="text-slate-500 text-[10px] mt-1">{tp.rekomendasiAsesmen}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: DOKUMEN CETAK FORMAL BERSTANDAR */}
      {/* ============================================================== */}
      {activeTabMode === 'dokumen' && (
        <div className="space-y-6">
          
          {/* Identity Controls (persisted) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 no-print space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-600" />
                Data Satuan Pendidikan &amp; Tanda Tangan Dokumen
              </span>
              <span className="text-[10px] text-slate-400">
                Data disimpan untuk pencetakan dokumen formal
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Sekolah</label>
                <input
                  type="text"
                  value={namaSekolah}
                  onChange={(e) => setNamaSekolah(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  value={tahunAjaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Guru PJOK</label>
                <input
                  type="text"
                  value={namaGuru}
                  onChange={(e) => setNamaGuru(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">NIP Guru PJOK</label>
                <input
                  type="text"
                  value={nipGuru}
                  onChange={(e) => setNipGuru(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kepala Sekolah</label>
                <input
                  type="text"
                  value={kepalaSekolah}
                  onChange={(e) => setKepalaSekolah(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={nipKepsek}
                  onChange={(e) => setNipKepsek(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Printable Sheet A4 Paper Style */}
          <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-8 md:p-12 max-w-4xl mx-auto space-y-6 text-slate-900 font-serif print:shadow-none print:p-0 print:border-none">
            
            {/* Header KOP */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <h3 className="text-xs uppercase font-sans font-bold tracking-widest text-slate-600">
                Pemerintah Daerah &bull; Dinas Pendidikan
              </h3>
              <h2 className="text-base md:text-lg uppercase font-bold text-slate-900 tracking-wide">
                {namaSekolah}
              </h2>
              <h1 className="text-sm md:text-base font-black uppercase text-slate-900 pt-1">
                FORMULASI PENYUSUNAN CAPAIAN PEMBELAJARAN (CP) KE TUJUAN PEMBELAJARAN (TP)
              </h1>
              <p className="text-xs font-sans font-semibold text-slate-600">
                MATA PELAJARAN PJOK &bull; KURIKULUM MERDEKA &bull; TAHUN AJARAN {tahunAjaran}
              </p>
            </div>

            {/* Identitas Formulasi */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-sans text-xs">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 font-bold text-slate-500 w-36">Fase / Kelas</td>
                    <td className="py-1 font-bold text-slate-900">: {resultData.fase} ({resultData.kelas})</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold text-slate-500">Elemen Pembelajaran</td>
                    <td className="py-1 font-bold text-emerald-800">: {resultData.elemen}</td>
                  </tr>
                  {resultData.materiSpesifik && (
                    <tr>
                      <td className="py-1 font-bold text-slate-500">Topik / Materi</td>
                      <td className="py-1 text-slate-800">: {resultData.materiSpesifik}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-1 font-bold text-slate-500 align-top">Teks CP Asli</td>
                    <td className="py-1 italic text-slate-700 leading-relaxed">: "{resultData.cpAsli}"</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Dekonstruksi Tabel */}
            <div className="space-y-2">
              <h4 className="text-xs font-sans font-extrabold uppercase tracking-wider text-slate-800 border-l-4 border-emerald-600 pl-2">
                1. Hasil Dekonstruksi Capaian Pembelajaran (CP)
              </h4>
              <table className="w-full text-xs border border-slate-300 font-sans border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="p-2.5 text-left border border-slate-300 w-1/2">Kompetensi Utama (Kata Kerja Operasional)</th>
                    <th className="p-2.5 text-left border border-slate-300 w-1/2">Lingkup Materi Pokok</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2.5 border border-slate-300 align-top">
                      <ul className="list-disc list-inside space-y-1 text-slate-800">
                        {(resultData.analisisDekonstruksi.kompetensiUtama || []).map((k, i) => (
                          <li key={i}>{k}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-2.5 border border-slate-300 align-top">
                      <ul className="list-disc list-inside space-y-1 text-slate-800">
                        {(resultData.analisisDekonstruksi.lingkupMateriUtama || []).map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Rumusan TP Tabel */}
            <div className="space-y-2">
              <h4 className="text-xs font-sans font-extrabold uppercase tracking-wider text-slate-800 border-l-4 border-indigo-600 pl-2">
                2. Rumusan Tujuan Pembelajaran (TP) Terstruktur
              </h4>
              <table className="w-full text-xs border border-slate-300 font-sans border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="p-2.5 w-16 text-center border border-slate-300">Kode</th>
                    <th className="p-2.5 border border-slate-300 text-left">Rumusan Tujuan Pembelajaran &amp; IKTP</th>
                    <th className="p-2.5 w-44 border border-slate-300 text-left">KKO &amp; Materi</th>
                    <th className="p-2.5 w-24 text-center border border-slate-300">Waktu</th>
                    <th className="p-2.5 w-32 border border-slate-300 text-left">Asesmen</th>
                  </tr>
                </thead>
                <tbody>
                  {resultData.daftarTp.map((tp, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="p-2.5 text-center font-bold border border-slate-300">{tp.kodeTp}</td>
                      <td className="p-2.5 border border-slate-300">
                        <strong className="block text-slate-900 mb-1">{tp.rumusanTp}</strong>
                        {tp.indikatorKetercapaian && tp.indikatorKetercapaian.length > 0 && (
                          <div className="text-[10px] text-slate-600 pt-1">
                            <span className="font-bold block">IKTP:</span>
                            <ul className="list-disc list-inside space-y-0.5">
                              {tp.indikatorKetercapaian.map((ind, i) => (
                                <li key={i}>{ind}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 border border-slate-300">
                        <div className="font-bold text-slate-800">{tp.kompetensiKko}</div>
                        <div className="text-slate-600 mt-0.5">{tp.lingkupMateri}</div>
                      </td>
                      <td className="p-2.5 text-center border border-slate-300 font-semibold">{tp.alokasiWaktu}</td>
                      <td className="p-2.5 border border-slate-300 text-[11px] text-slate-600">{tp.rekomendasiAsesmen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signature Area */}
            <div className="pt-8 font-sans text-xs">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="w-1/2 text-center align-top space-y-1">
                      <p>Mengetahui,</p>
                      <p className="font-bold">Kepala Sekolah</p>
                      <div className="h-16"></div>
                      <p className="font-bold underline uppercase">{kepalaSekolah}</p>
                      <p className="text-[10px] text-slate-500">NIP. {nipKepsek}</p>
                    </td>

                    <td className="w-1/2 text-center align-top space-y-1">
                      <p>Ditetapkan di: Sekolah</p>
                      <p className="font-bold">Guru Mata Pelajaran PJOK</p>
                      <div className="h-16"></div>
                      <p className="font-bold underline uppercase">{namaGuru}</p>
                      <p className="text-[10px] text-slate-500">NIP. {nipGuru}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          <div className="flex flex-wrap justify-center gap-3 no-print">
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{isExportingPdf ? 'Memproses PDF F4...' : 'Download PDF (F4) Siap Cetak'}</span>
            </button>
            <button
              onClick={handleDownloadDoc}
              className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download Word (.doc)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Lembar Dokumen (F4)</span>
            </button>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: PANDUAN PPA & TAKSONOMI KKO */}
      {/* ============================================================== */}
      {activeTabMode === 'panduan' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 3 Alternatif Penurunan CP ke TP */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3 md:col-span-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                3 Alternatif Cara Merumuskan Tujuan Pembelajaran (Panduan Pembelajaran &amp; Asesmen Kemendikbudristek)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-1.5">
                  <span className="font-extrabold text-emerald-950 text-xs block">Alternatif 1:</span>
                  <strong className="text-emerald-800 text-[11px] block">Merumuskan Langsung dari Kalimat CP</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Pendidik membedah kalimat CP langsung menjadi beberapa TP dengan mengambil kata kerja operasional dan materi esensial secara utuh tanpa modifikasi besar.
                  </p>
                </div>

                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 space-y-1.5">
                  <span className="font-extrabold text-indigo-950 text-xs block">Alternatif 2 (Direkomendasikan):</span>
                  <strong className="text-indigo-800 text-[11px] block">Menganalisis Kompetensi &amp; Lingkup Materi</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Pendidik memisahkan antara Kata Kerja Operasional (KKO) dan materi pokok konten, lalu menyusun kombinasi TP yang terukur, hirarkis, dan bertahap.
                  </p>
                </div>

                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-1.5">
                  <span className="font-extrabold text-amber-950 text-xs block">Alternatif 3:</span>
                  <strong className="text-amber-800 text-[11px] block">Merumuskan Lintas Elemen CP</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Pendidik mengintegrasikan capaian dari elemen Keterampilan Gerak dengan Belajar Melalui Gerak (Karakter/Sportivitas) dalam satu rumusan TP komprehensif.
                  </p>
                </div>
              </div>
            </div>

            {/* Ranah Psikomotorik PJOK (Dave & Harrow) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3 md:col-span-2">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                Taksonomi KKO Ranah Psikomotorik (Gerak PJOK)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-emerald-800 text-[11px] block">P1: Menirukan (Imitation)</strong>
                  <p className="text-slate-600 text-[10px]">Meniru gerakan guru atau rekan: mengamati, mencontoh, meniru, mengulangi gerak.</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-indigo-800 text-[11px] block">P2: Memanipulasi (Manipulation)</strong>
                  <p className="text-slate-600 text-[10px]">Melakukan gerak berdasarkan instruksi/panduan: mempraktikkan, melakukan, menjalankan.</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-blue-800 text-[11px] block">P3: Presisi / Terampil (Precision)</strong>
                  <p className="text-slate-600 text-[10px]">Melakukan gerakan secara mandiri, akurat, dan terkontrol: menunjukkan, mendemonstrasikan, mengontrol.</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-amber-800 text-[11px] block">P4: Artikulasi / Modifikasi (Articulation)</strong>
                  <p className="text-slate-600 text-[10px]">Mengombinasikan dan memodifikasi beberapa gerak dalam situasi permainan: mengombinasikan, memvariasikan, memodifikasi.</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-rose-800 text-[11px] block">P5: Naturalisasi / Otomatisasi (Naturalization)</strong>
                  <p className="text-slate-600 text-[10px]">Gerakan refleks spontan berkecepatan tinggi dengan tingkat efisiensi gerak maksimal.</p>
                </div>
              </div>
            </div>

            {/* Formula ABCD */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Format Rumusan TP (ABCD)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <strong className="text-slate-800 block">A - Audience:</strong>
                  <span className="text-slate-500 text-[11px]">Peserta didik / Siswa</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <strong className="text-slate-800 block">B - Behavior:</strong>
                  <span className="text-slate-500 text-[11px]">Mempraktikkan variasi passing</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <strong className="text-slate-800 block">C - Condition:</strong>
                  <span className="text-slate-500 text-[11px]">Dalam permainan sepak bola mini</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <strong className="text-slate-800 block">D - Degree:</strong>
                  <span className="text-slate-500 text-[11px]">Secara terarah dan sportif</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: EDIT TP ITEM (COMPREHENSIVE) */}
      {/* ============================================================== */}
      {isEditTpModalOpen && editingTp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm">Edit {editingTp.kodeTp} - Tujuan Pembelajaran</h3>
                  <p className="text-[10px] text-slate-300">Sesuaikan rumusan, KKO, materi, indikator IKTP, dan alokasi waktu</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditTpModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kode TP</label>
                  <input
                    type="text"
                    value={editingTp.kodeTp}
                    onChange={(e) => setEditingTp({ ...editingTp, kodeTp: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Kelas &amp; Semester</label>
                  <input
                    type="text"
                    value={editingTp.targetKelasSemester}
                    onChange={(e) => setEditingTp({ ...editingTp, targetKelasSemester: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Alokasi Waktu (JP)</label>
                  <input
                    type="text"
                    value={editingTp.alokasiWaktu}
                    onChange={(e) => setEditingTp({ ...editingTp, alokasiWaktu: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* Rumusan Kalimat TP */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 block">Rumusan Kalimat Tujuan Pembelajaran (TP)</label>
                  <span className="text-[10px] text-slate-400">{editingTp.rumusanTp.length} karakter</span>
                </div>
                <textarea
                  rows={3}
                  value={editingTp.rumusanTp}
                  onChange={(e) => setEditingTp({ ...editingTp, rumusanTp: e.target.value })}
                  placeholder="Ketik rumusan Tujuan Pembelajaran terukur di sini..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kompetensi (Kata Kerja Operasional / KKO)</label>
                  <input
                    type="text"
                    value={editingTp.kompetensiKko}
                    onChange={(e) => setEditingTp({ ...editingTp, kompetensiKko: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['Mempraktikkan (P3)', 'Mengombinasikan (P4)', 'Memodifikasi (P4)', 'Menganalisis (C4)', 'Menunjukkan (A3)'].map((chip, ci) => (
                      <button
                        type="button"
                        key={ci}
                        onClick={() => setEditingTp({ ...editingTp, kompetensiKko: chip })}
                        className="text-[9px] bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Lingkup Materi Pokok</label>
                  <input
                    type="text"
                    value={editingTp.lingkupMateri}
                    onChange={(e) => setEditingTp({ ...editingTp, lingkupMateri: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Indikator Ketercapaian TP (IKTP) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  Indikator Ketercapaian Tujuan Pembelajaran (IKTP)
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempNewIktpInput}
                    onChange={(e) => setTempNewIktpInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tempNewIktpInput.trim()) {
                          const current = editingTp.indikatorKetercapaian || [];
                          setEditingTp({ ...editingTp, indikatorKetercapaian: [...current, tempNewIktpInput.trim()] });
                          setTempNewIktpInput('');
                        }
                      }
                    }}
                    placeholder="Ketik butir indikator baru lalu tekan Enter atau Tambah..."
                    className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempNewIktpInput.trim()) {
                        const current = editingTp.indikatorKetercapaian || [];
                        setEditingTp({ ...editingTp, indikatorKetercapaian: [...current, tempNewIktpInput.trim()] });
                        setTempNewIktpInput('');
                      }
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    + Tambah IKTP
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  {(editingTp.indikatorKetercapaian || []).map((ind, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    >
                      <span className="flex-1 leading-relaxed">
                        <span className="text-emerald-700 font-bold mr-1.5">✓</span> {ind}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = (editingTp.indikatorKetercapaian || []).filter((_, i) => i !== idx);
                          setEditingTp({ ...editingTp, indikatorKetercapaian: filtered });
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profil Pancasila & Asesmen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Dimensi Profil Pelajar Pancasila (P3)</label>
                  <input
                    type="text"
                    value={editingTp.profilPancasila}
                    onChange={(e) => setEditingTp({ ...editingTp, profilPancasila: e.target.value })}
                    placeholder="Contoh: Mandiri, Gotong Royong, Bernalar Kritis"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rekomendasi Bentuk Asesmen</label>
                  <input
                    type="text"
                    value={editingTp.rekomendasiAsesmen}
                    onChange={(e) => setEditingTp({ ...editingTp, rekomendasiAsesmen: e.target.value })}
                    placeholder="Contoh: Tes Unjuk Kerja Praktik Lapangan"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditTpModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditTp}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan TP</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT DEKONSTRUKSI CP */}
      {/* ============================================================== */}
      {isEditDekonstruksiOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm">Edit Analisis Dekonstruksi CP</h3>
                  <p className="text-[10px] text-slate-300">Sesuaikan daftar KKO, materi esensial, dan karakteristik peserta didik</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditDekonstruksiOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* KKO list */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Kompetensi Utama (KKO):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempKkoInput}
                    onChange={(e) => setTempKkoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tempKkoInput.trim()) {
                          setTempDekonstruksiData({
                            ...tempDekonstruksiData,
                            kompetensiUtama: [...tempDekonstruksiData.kompetensiUtama, tempKkoInput.trim()]
                          });
                          setTempKkoInput('');
                        }
                      }
                    }}
                    placeholder="Ketik KKO baru (misal: Mempraktikkan P3) lalu Enter..."
                    className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempKkoInput.trim()) {
                        setTempDekonstruksiData({
                          ...tempDekonstruksiData,
                          kompetensiUtama: [...tempDekonstruksiData.kompetensiUtama, tempKkoInput.trim()]
                        });
                        setTempKkoInput('');
                      }
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    + Tambah
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tempDekonstruksiData.kompetensiUtama.map((kko, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs">
                      <span>{kko}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = tempDekonstruksiData.kompetensiUtama.filter((_, idx) => idx !== i);
                          setTempDekonstruksiData({ ...tempDekonstruksiData, kompetensiUtama: filtered });
                        }}
                        className="text-emerald-600 hover:text-rose-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Materi list */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">Lingkup Materi Utama:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempMateriInput}
                    onChange={(e) => setTempMateriInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tempMateriInput.trim()) {
                          setTempDekonstruksiData({
                            ...tempDekonstruksiData,
                            lingkupMateriUtama: [...tempDekonstruksiData.lingkupMateriUtama, tempMateriInput.trim()]
                          });
                          setTempMateriInput('');
                        }
                      }
                    }}
                    placeholder="Ketik materi baru lalu tekan Enter..."
                    className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempMateriInput.trim()) {
                        setTempDekonstruksiData({
                          ...tempDekonstruksiData,
                          lingkupMateriUtama: [...tempDekonstruksiData.lingkupMateriUtama, tempMateriInput.trim()]
                        });
                        setTempMateriInput('');
                      }
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    + Tambah
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tempDekonstruksiData.lingkupMateriUtama.map((mat, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs">
                      <span>{mat}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = tempDekonstruksiData.lingkupMateriUtama.filter((_, idx) => idx !== i);
                          setTempDekonstruksiData({ ...tempDekonstruksiData, lingkupMateriUtama: filtered });
                        }}
                        className="text-blue-600 hover:text-rose-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Karakteristik siswa */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">Karakteristik &amp; Kebutuhan Siswa:</label>
                <textarea
                  rows={3}
                  value={tempDekonstruksiData.variasiKarakteristikSiswa}
                  onChange={(e) => setTempDekonstruksiData({ ...tempDekonstruksiData, variasiKarakteristikSiswa: e.target.value })}
                  placeholder="Catatan mengenai perkembangan fisik dan motorik peserta didik..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditDekonstruksiOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditDekonstruksi}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Dekonstruksi</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: EDIT CATATAN & STRATEGI PEMBELAJARAN */}
      {/* ============================================================== */}
      {isEditStrategiOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm">Edit Strategi &amp; Catatan Guru</h3>
                  <p className="text-[10px] text-slate-300">Sesuaikan pendekatan pembelajaran dan catatan bimbingan</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditStrategiOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Pendekatan &amp; Metode Pembelajaran:</label>
                <textarea
                  rows={3}
                  value={tempRekomendasiPendekatan}
                  onChange={(e) => setTempRekomendasiPendekatan(e.target.value)}
                  placeholder="Contoh: Pendekatan bermain, demonstrasi langsung, diferensiasi gerak..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Catatan Pelaksanaan Guru:</label>
                <textarea
                  rows={3}
                  value={tempCatatanPendidik}
                  onChange={(e) => setTempCatatanPendidik(e.target.value)}
                  placeholder="Catatan keselamatan lapangan, modifikasi sarana, atau instruksi khusus..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditStrategiOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditStrategi}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Catatan</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Formulasi CP ke TP PJOK"
        subtitle={`Fase ${activeFase.phaseName} • Kelas ${targetKelas} SD • Elemen ${activeElement.name}`}
        tabs={getCpToTpPrompts({
          fase: activeFase.phaseName,
          kelas: targetKelas,
          elemen: activeElement.name,
          cpText: customCpText || activeElement.description,
          tpList: resultData.daftarTp.map(t => t.rumusanTp)
        })}
        jsonData={{
          fase: resultData.fase,
          kelas: resultData.kelas,
          elemen: resultData.elemen,
          cpText: resultData.cpAsli,
          materiSpesifik,
          hasilFormulasi: resultData,
          tanggalEkspor: new Date().toISOString()
        }}
        jsonFilename={`Formulasi_CP_TP_Kelas_${targetKelas}`}
      />
    </div>
  );
}
