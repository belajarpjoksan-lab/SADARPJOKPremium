import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Target, 
  ChevronRight, 
  Sparkles, 
  Printer, 
  Copy, 
  Check, 
  RotateCcw, 
  Info, 
  ListOrdered, 
  ClipboardCheck, 
  Activity, 
  ArrowRight,
  Sparkle,
  Edit3,
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  FileCheck,
  ShieldCheck,
  Building,
  User,
  Calendar,
  Layers,
  Search,
  FileSignature,
  Stamp,
  PenTool
} from 'lucide-react';
import { CpFase, CpElement, AtpResult } from '../types';
import { 
  loadCpData, 
  saveCpData, 
  resetCpDataToDefault, 
  exportCpDataToJson, 
  importCpDataFromJson,
  DEFAULT_AUTHENTIC_CP_DATA 
} from '../utils/cpDataManager';
import { exportAtpToDoc, exportCpToDoc, downloadDocFile, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import { fetchWithRetry } from '../lib/fetchUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getCpPrompts } from '../utils/aiPromptGenerators';
import DigitalSignaturePad from './DigitalSignaturePad';

export default function CapaianPembelajaranView() {
  // Main data list loaded from LocalStorage or default
  const [faseList, setFaseList] = useState<CpFase[]>(() => loadCpData());
  const [selectedFaseId, setSelectedFaseId] = useState<string>('fase-a');
  const [activeElementId, setActiveElementId] = useState<string>('fase-a-terampil');
  const [activeMainTab, setActiveMainTab] = useState<'detail' | 'dokumen' | 'rasional' | 'generator' | 'ttd'>('detail');

  // Load signature and place/date configurations from localStorage
  const initialTtdData = (() => {
    try {
      const raw = localStorage.getItem('sadar_pjok_cp_ttd_data');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse saved ttd data', e);
    }
    return null;
  })();

  // School identity metadata for official documents (persisted in localStorage)
  const [namaSekolah, setNamaSekolah] = useState<string>(() => localStorage.getItem('sadar_pjok_sekolah_cp') || 'SD NEGERI UNGGULAN');
  const [namaGuru, setNamaGuru] = useState<string>(() => localStorage.getItem('sadar_pjok_guru_cp') || 'Guru PJOK, S.Pd.');
  const [nipGuru, setNipGuru] = useState<string>(() => localStorage.getItem('sadar_pjok_nip_guru_cp') || '19890512 201502 1 002');
  const [jabatanGuru, setJabatanGuru] = useState<string>(() => initialTtdData?.jabatanGuru || 'Guru Mata Pelajaran PJOK');
  const [kepalaSekolah, setKepalaSekolah] = useState<string>(() => localStorage.getItem('sadar_pjok_kepsek_cp') || 'Kepala Sekolah, M.Pd.');
  const [nipKepsek, setNipKepsek] = useState<string>(() => localStorage.getItem('sadar_pjok_nip_kepsek_cp') || '19750318 200003 1 005');
  const [jabatanKepsek, setJabatanKepsek] = useState<string>(() => initialTtdData?.jabatanKepsek || 'Kepala Sekolah');
  const [tahunAjaran, setTahunAjaran] = useState<string>(() => localStorage.getItem('sadar_pjok_thn_cp') || '2026/2027');

  // Place and Date configuration
  const [tempatPenetapan, setTempatPenetapan] = useState<string>(() => initialTtdData?.tempatPenetapan || 'Jakarta');
  const [tanggalPenetapan, setTanggalPenetapan] = useState<string>(() => initialTtdData?.tanggalPenetapan || '15 Juli 2026');

  // Digital Signatures
  const [guruSignature, setGuruSignature] = useState<string>(() => initialTtdData?.guruSignature || '');
  const [kepsekSignature, setKepsekSignature] = useState<string>(() => initialTtdData?.kepsekSignature || '');

  // Third party signatory (Pengawas Sekolah / Komite)
  const [showPengawas, setShowPengawas] = useState<boolean>(() => initialTtdData?.showPengawas || false);
  const [namaPengawas, setNamaPengawas] = useState<string>(() => initialTtdData?.namaPengawas || 'Pengawas Pembina SD, M.Pd.');
  const [nipPengawas, setNipPengawas] = useState<string>(() => initialTtdData?.nipPengawas || '19700101 199503 1 003');
  const [jabatanPengawas, setJabatanPengawas] = useState<string>(() => initialTtdData?.jabatanPengawas || 'Pengawas Sekolah Pembina');
  const [pengawasSignature, setPengawasSignature] = useState<string>(() => initialTtdData?.pengawasSignature || '');

  // School Stamp (Cap Sekolah)
  const [showStempel, setShowStempel] = useState<boolean>(() => initialTtdData?.showStempel || false);
  const [stempelImage, setStempelImage] = useState<string>(() => initialTtdData?.stempelImage || '');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state for Capaian Umum Fase
  const [isEditingCapaianUmum, setIsEditingCapaianUmum] = useState(false);
  const [tempCapaianUmum, setTempCapaianUmum] = useState('');
  const [tempRasionalFase, setTempRasionalFase] = useState('');
  const [tempSkRegulasi, setTempSkRegulasi] = useState('');

  // Editing state for an Element
  const [isEditingElement, setIsEditingElement] = useState(false);
  const [editingElementData, setEditingElementData] = useState<CpElement | null>(null);
  const [isNewElement, setIsNewElement] = useState(false);
  const [tempNewMateriInput, setTempNewMateriInput] = useState('');
  const [tempNewTpInput, setTempNewTpInput] = useState('');

  // Feedback notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // AI Generation state
  const [materiSpesifik, setMateriSpesifik] = useState('');
  const [saranaSpesifik, setSaranaSpesifik] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedAtp, setGeneratedAtp] = useState<AtpResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync active fase & element
  const activeFase = faseList.find(f => f.id === selectedFaseId) || faseList[0] || DEFAULT_AUTHENTIC_CP_DATA[0];
  const activeElement = activeFase.elements.find(e => e.id === activeElementId) || activeFase.elements[0] || {
    id: 'fase-default',
    name: 'Elemen PJOK',
    description: ''
  };

  // Save school metadata & ttd changes to localStorage
  useEffect(() => {
    localStorage.setItem('sadar_pjok_sekolah_cp', namaSekolah);
    localStorage.setItem('sadar_pjok_guru_cp', namaGuru);
    localStorage.setItem('sadar_pjok_nip_guru_cp', nipGuru);
    localStorage.setItem('sadar_pjok_kepsek_cp', kepalaSekolah);
    localStorage.setItem('sadar_pjok_nip_kepsek_cp', nipKepsek);
    localStorage.setItem('sadar_pjok_thn_cp', tahunAjaran);

    // Save TTD bundle
    const ttdPayload = {
      tempatPenetapan,
      tanggalPenetapan,
      jabatanGuru,
      jabatanKepsek,
      guruSignature,
      kepsekSignature,
      showPengawas,
      namaPengawas,
      nipPengawas,
      jabatanPengawas,
      pengawasSignature,
      showStempel,
      stempelImage
    };
    localStorage.setItem('sadar_pjok_cp_ttd_data', JSON.stringify(ttdPayload));
  }, [
    namaSekolah, namaGuru, nipGuru, kepalaSekolah, nipKepsek, tahunAjaran,
    tempatPenetapan, tanggalPenetapan, jabatanGuru, jabatanKepsek, guruSignature, kepsekSignature,
    showPengawas, namaPengawas, nipPengawas, jabatanPengawas, pengawasSignature, showStempel, stempelImage
  ]);

  // Show temporary toast notification
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Change Fase
  const handleFaseSelect = (faseId: string) => {
    setSelectedFaseId(faseId);
    const targetFase = faseList.find(f => f.id === faseId);
    if (targetFase && targetFase.elements.length > 0) {
      setActiveElementId(targetFase.elements[0].id);
    }
    setGeneratedAtp(null);
    setGenerationError(null);
  };

  // OPEN EDIT CAPAIAN UMUM MODAL
  const openEditCapaianUmum = () => {
    setTempCapaianUmum(activeFase.capaianUmum || '');
    setTempRasionalFase(activeFase.rasionalFase || '');
    setTempSkRegulasi(activeFase.skRegulasi || 'Keputusan Kepala BSKAP Nomor 046/H/KR/2025');
    setIsEditingCapaianUmum(true);
  };

  // SAVE CAPAIAN UMUM
  const handleSaveCapaianUmum = () => {
    const updatedList = faseList.map(f => {
      if (f.id === activeFase.id) {
        return {
          ...f,
          capaianUmum: tempCapaianUmum.trim(),
          rasionalFase: tempRasionalFase.trim(),
          skRegulasi: tempSkRegulasi.trim()
        };
      }
      return f;
    });

    setFaseList(updatedList);
    saveCpData(updatedList);
    setIsEditingCapaianUmum(false);
    showToast(`Capaian Umum & Rasional ${activeFase.phaseName} berhasil diperbarui!`, 'success');
  };

  // OPEN EDIT ELEMENT MODAL
  const openEditElement = (el: CpElement) => {
    setEditingElementData({ ...el });
    setIsNewElement(false);
    setIsEditingElement(true);
  };

  // OPEN NEW ELEMENT MODAL
  const openAddNewElement = () => {
    const newId = `${activeFase.id}-custom-${Date.now()}`;
    setEditingElementData({
      id: newId,
      name: 'Elemen Baru / Muatan Lokal',
      alias: 'Muatan Khas Sekolah',
      description: '',
      lingkupMateri: [],
      contohTp: [],
      isCustom: true
    });
    setIsNewElement(true);
    setIsEditingElement(true);
  };

  // SAVE ELEMENT
  const handleSaveElement = () => {
    if (!editingElementData) return;
    if (!editingElementData.name.trim()) {
      showToast('Nama Elemen wajib diisi!', 'error');
      return;
    }
    if (!editingElementData.description.trim()) {
      showToast('Deskripsi Capaian Pembelajaran wajib diisi!', 'error');
      return;
    }

    const updatedList = faseList.map(f => {
      if (f.id === activeFase.id) {
        let updatedElements = [...f.elements];
        if (isNewElement) {
          updatedElements.push(editingElementData);
        } else {
          updatedElements = updatedElements.map(el => el.id === editingElementData.id ? editingElementData : el);
        }
        return {
          ...f,
          elements: updatedElements
        };
      }
      return f;
    });

    setFaseList(updatedList);
    saveCpData(updatedList);
    setActiveElementId(editingElementData.id);
    setIsEditingElement(false);
    setEditingElementData(null);
    showToast(isNewElement ? 'Elemen CP baru berhasil ditambahkan!' : 'Perubahan Elemen CP berhasil disimpan!', 'success');
  };

  // DELETE ELEMENT
  const handleDeleteElement = (elementId: string, elementName: string) => {
    if (activeFase.elements.length <= 1) {
      showToast('Setiap Fase minimal harus memiliki 1 elemen pembelajaran.', 'error');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus Elemen "${elementName}" dari ${activeFase.phaseName}?`)) {
      return;
    }

    const updatedList = faseList.map(f => {
      if (f.id === activeFase.id) {
        const filtered = f.elements.filter(el => el.id !== elementId);
        return {
          ...f,
          elements: filtered
        };
      }
      return f;
    });

    setFaseList(updatedList);
    saveCpData(updatedList);

    // Update active element
    const remaining = updatedList.find(f => f.id === activeFase.id)?.elements || [];
    if (remaining.length > 0) {
      setActiveElementId(remaining[0].id);
    }
    showToast(`Elemen "${elementName}" telah dihapus.`, 'info');
  };

  // RESET TO DEFAULT BSKAP
  const handleResetToDefault = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan seluruh Capaian Pembelajaran (Fase A, B, C, D) ke Standar Resmi Kemendikdasmen (Keputusan Kepala BSKAP Nomor 046/H/KR/2025)? Semua pengeditan kustom Anda akan direset.')) {
      const defaultData = resetCpDataToDefault();
      setFaseList(defaultData);
      setSelectedFaseId('fase-a');
      setActiveElementId('fase-a-terampil');
      setGeneratedAtp(null);
      showToast('Capaian Pembelajaran berhasil direset ke standar resmi Keputusan Kepala BSKAP Nomor 046/H/KR/2025!', 'success');
    }
  };

  // EXPORT JSON
  const handleExportJson = () => {
    exportCpDataToJson(faseList, `Capaian_Pembelajaran_PJOK_${activeFase.id}_${new Date().toISOString().slice(0, 10)}.json`);
    showToast('Cadangan konfigurasi CP berhasil diunduh.', 'success');
  };

  // IMPORT JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importCpDataFromJson(content);
      if (result.success && result.data) {
        setFaseList(result.data);
        showToast('Berhasil mengimpor konfigurasi Capaian Pembelajaran!', 'success');
      } else {
        showToast(result.error || 'Gagal mengimpor berkas JSON.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // COPY CP TEXT TO CLIPBOARD
  const handleCopyCpText = (text: string, title?: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${title || 'Teks CP'} berhasil disalin ke clipboard!`, 'success');
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const buildCpHtml = () => {
    return exportCpToDoc(
      activeFase.phaseName,
      activeFase.grades,
      activeFase.elements,
      {
        capaianUmum: activeFase.capaianUmum,
        skRegulasi: activeFase.skRegulasi,
        rasionalFase: activeFase.rasionalFase,
        namaSekolah,
        namaGuru,
        nipGuru,
        jabatanGuru,
        kepalaSekolah,
        nipKepsek,
        jabatanKepsek,
        tahunAjaran,
        tempatPenetapan,
        tanggalPenetapan,
        guruSignature,
        kepsekSignature,
        showPengawas,
        namaPengawas,
        nipPengawas,
        jabatanPengawas,
        pengawasSignature,
        showStempel,
        stempelImage
      }
    );
  };

  // EXPORT COMPLETE CP WORD DOCUMENT (.doc)
  const handleExportDoc = () => {
    const docHtml = buildCpHtml();
    downloadDocFile(`Dokumen_CP_PJOK_F4_${activeFase.phaseName.replace(/\s+/g, '_')}_${tahunAjaran.replace('/', '-')}`, docHtml);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2000);
    showToast('Dokumen CP resmi Word (.doc) F4 berhasil diunduh!', 'success');
  };

  // EXPORT COMPLETE CP PDF DOCUMENT (F4)
  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docHtml = buildCpHtml();
      const fileName = `Dokumen_CP_PJOK_F4_${activeFase.phaseName.replace(/\s+/g, '_')}_${tahunAjaran.replace('/', '-')}.pdf`;
      const success = await downloadHtmlAsPdf(fileName, docHtml, {
        orientation: 'portrait',
        marginMm: 12
      });
      if (success) {
        showToast('Dokumen CP resmi PDF (F4) berhasil diunduh!', 'success');
      } else {
        printHtmlDocument(docHtml, `Capaian Pembelajaran PJOK F4 - ${activeFase.phaseName}`);
      }
    } catch (err) {
      console.error('Error generating CP F4 PDF:', err);
      printHtmlDocument(buildCpHtml(), `Capaian Pembelajaran PJOK F4 - ${activeFase.phaseName}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintCp = () => {
    printHtmlDocument(buildCpHtml(), `Capaian Pembelajaran PJOK F4 - ${activeFase.phaseName}`);
  };

  // EXPORT LEMBAR PENGESAHAN WORD DOCUMENT (.doc)
  const buildPengesahanHtml = () => {
    const content = `
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10pt; margin-bottom: 15pt;">
        <h3 style="margin: 0; font-size: 11pt; text-transform: uppercase; color: #475569;">PEMERINTAH DAERAH &bull; DINAS PENDIDIKAN</h3>
        <h2 style="margin: 3pt 0 0 0; font-size: 14pt; text-transform: uppercase; color: #0f172a;">${namaSekolah}</h2>
        <h1 style="margin: 6pt 0 0 0; font-size: 14pt; color: #0f172a;">LEMBAR PENGESAHAN CAPAIAN PEMBELAJARAN (CP)</h1>
        <p style="margin: 3pt 0 0 0; font-size: 10pt; font-weight: bold; color: #334155;">MATA PELAJARAN: PENDIDIKAN JASMANI, OLAHRAGA, DAN KESEHATAN (PJOK)</p>
        <p style="margin: 2pt 0 0 0; font-size: 9pt; color: #64748b;">FASE / KELAS: ${activeFase.phaseName} (${activeFase.grades}) &bull; TAHUN AJARAN ${tahunAjaran}</p>
      </div>

      <div style="margin: 20pt 0; padding: 14pt; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 10.5pt; line-height: 1.8; text-align: justify;">
        <p style="margin: 0;">
          Setelah mencermati, menelaah, dan memvalidasi rumusan <strong>Capaian Pembelajaran (CP)</strong> Mata Pelajaran Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK) <strong>${activeFase.phaseName} (${activeFase.grades})</strong> Kurikulum Merdeka yang disusun oleh Guru Mata Pelajaran PJOK, maka dengan ini Kepala Satuan Pendidikan menyatakan bahwa dokumen tersebut:
        </p>
        <div style="text-align: center; margin: 15pt 0; font-size: 13pt; font-weight: bold; color: #065f46; letter-spacing: 2px;">
          DISAHKAN & DIBERLAKUKAN
        </div>
        <p style="margin: 0;">
          Sebagai acuan resmi operasional penyusunan Alur Tujuan Pembelajaran (ATP), Modul Ajar, dan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) pada <strong>${namaSekolah}</strong> untuk Tahun Ajaran <strong>${tahunAjaran}</strong>.
        </p>
      </div>

      <div style="margin-top: 35pt;">
        <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr>
            ${showPengawas ? `
              <td style="width: 33%; text-align: center; vertical-align: top;">
                Mengetahui,<br><strong>${jabatanKepsek}</strong><br>
                ${kepsekSignature ? `<img src="${kepsekSignature}" style="max-height: 65px; max-width: 140px; margin: 4px 0;" /><br>` : '<br><br><br><br>'}
                <strong style="text-decoration: underline;">${kepalaSekolah}</strong><br>
                NIP. ${nipKepsek}
              </td>
              <td style="width: 34%; text-align: center; vertical-align: top;">
                Mengesahkan,<br><strong>${jabatanPengawas}</strong><br>
                ${pengawasSignature ? `<img src="${pengawasSignature}" style="max-height: 65px; max-width: 140px; margin: 4px 0;" /><br>` : '<br><br><br><br>'}
                <strong style="text-decoration: underline;">${namaPengawas}</strong><br>
                NIP. ${nipPengawas}
              </td>
              <td style="width: 33%; text-align: center; vertical-align: top;">
                ${tempatPenetapan}, ${tanggalPenetapan}<br><strong>${jabatanGuru}</strong><br>
                ${guruSignature ? `<img src="${guruSignature}" style="max-height: 65px; max-width: 140px; margin: 4px 0;" /><br>` : '<br><br><br><br>'}
                <strong style="text-decoration: underline;">${namaGuru}</strong><br>
                NIP. ${nipGuru}
              </td>
            ` : `
              <td style="width: 50%; text-align: center; vertical-align: top;">
                Mengetahui,<br><strong>${jabatanKepsek}</strong><br>
                <div style="position: relative; display: inline-block;">
                  ${kepsekSignature ? `<img src="${kepsekSignature}" style="max-height: 70px; max-width: 150px; margin: 4px 0;" />` : '<div style="height: 60px;"></div>'}
                  ${showStempel && stempelImage ? `<img src="${stempelImage}" style="position: absolute; left: -20px; top: -10px; max-height: 80px; max-width: 80px; opacity: 0.85;" />` : ''}
                </div><br>
                <strong style="text-decoration: underline;">${kepalaSekolah}</strong><br>
                NIP. ${nipKepsek}
              </td>
              <td style="width: 50%; text-align: center; vertical-align: top;">
                Ditetapkan di: ${tempatPenetapan}<br>
                Pada tanggal: ${tanggalPenetapan}<br>
                <strong>${jabatanGuru}</strong><br>
                ${guruSignature ? `<img src="${guruSignature}" style="max-height: 70px; max-width: 150px; margin: 4px 0;" /><br>` : '<div style="height: 60px;"></div>'}
                <strong style="text-decoration: underline;">${namaGuru}</strong><br>
                NIP. ${nipGuru}
              </td>
            `}
          </tr>
        </table>
      </div>
    `;

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Lembar Pengesahan CP F4</title>
        <style>
          @page { size: 215mm 330mm; margin: 15mm 18mm; }
          @page Section1 { size: 609.45pt 935.43pt; margin: 42.5pt 51pt; }
          div.Section1 { page: Section1; }
        </style>
      </head>
      <body style="font-family: 'Times New Roman', Times, serif; padding: 15pt;"><div class="Section1">${content}</div></body>
      </html>
    `;
  };

  const handleExportPengesahanDoc = () => {
    downloadDocFile(`Lembar_Pengesahan_CP_F4_${activeFase.phaseName.replace(/\s+/g, '_')}_${tahunAjaran.replace('/', '-')}`, buildPengesahanHtml());
    showToast('Lembar Pengesahan Word (.doc) F4 berhasil diunduh!', 'success');
  };

  const handleExportPengesahanPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docHtml = buildPengesahanHtml();
      const fileName = `Lembar_Pengesahan_CP_F4_${activeFase.phaseName.replace(/\s+/g, '_')}_${tahunAjaran.replace('/', '-')}.pdf`;
      const success = await downloadHtmlAsPdf(fileName, docHtml, {
        orientation: 'portrait',
        marginMm: 14
      });
      if (success) {
        showToast('Lembar Pengesahan PDF (F4) berhasil diunduh!', 'success');
      } else {
        printHtmlDocument(docHtml, `Lembar Pengesahan CP F4 - ${activeFase.phaseName}`);
      }
    } catch (err) {
      console.error('Error generating Pengesahan F4 PDF:', err);
      printHtmlDocument(buildPengesahanHtml(), `Lembar Pengesahan CP F4 - ${activeFase.phaseName}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintPengesahan = () => {
    printHtmlDocument(buildPengesahanHtml(), `Lembar Pengesahan CP F4 - ${activeFase.phaseName}`);
  };

  // GENERATE ATP WITH AI
  const handleGenerateATP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedAtp(null);

    try {
      const response = await fetchWithRetry('/api/generate-atp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: `${activeFase.phaseName} (${activeFase.grades})`,
          element: activeElement.name,
          cpText: activeElement.description,
          materiSpesifik: materiSpesifik.trim(),
          saranaSpesifik: saranaSpesifik.trim()
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      setGeneratedAtp(data);
      showToast('ATP & KKTP Asesmen berhasil dirumuskan AI!', 'success');
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || 'Gagal terhubung ke AI. Pastikan server aktif dan API Key terpasang.');
    } finally {
      setIsGenerating(false);
    }
  };

  // COPY ATP RESULT
  const copyAtpToClipboard = () => {
    if (!generatedAtp) return;
    
    let text = `ALUR TUJUAN PEMBELAJARAN (ATP) & KRITERIA KETERCAPAIAN (KKTP)\n`;
    text += `=========================================================\n`;
    text += `Fase / Kelas: ${activeFase.phaseName} / ${activeFase.grades}\n`;
    text += `Elemen: ${activeElement.name}\n`;
    text += `Deskripsi CP: ${activeElement.description}\n`;
    if (materiSpesifik) text += `Materi Pokok: ${materiSpesifik}\n`;
    if (saranaSpesifik) text += `Kondisi Sarana: ${saranaSpesifik}\n\n`;
    
    text += `A. ALUR TUJUAN PEMBELAJARAN (ATP):\n`;
    generatedAtp.alurTujuanPembelajaran.forEach((step, i) => {
      text += `${i + 1}. ${step}\n`;
    });
    
    text += `\nB. KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) & RUBRIK:\n`;
    generatedAtp.kriteriaKetercapaian.forEach((item, i) => {
      text += `${i + 1}. Kriteria: ${item.kriteria}\n`;
      text += `   - Baru Berkembang (BB): ${item.baruBerkembang}\n`;
      text += `   - Layak (L): ${item.layak}\n`;
      text += `   - Mahir (M): ${item.mahir}\n\n`;
    });
    
    text += `C. REKOMENDASI PENDEKATAN PEMBELAJARAN:\n${generatedAtp.metodePembelajaran}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Hasil formulasi ATP berhasil disalin!', 'success');
  };

  // Filter elements by search
  const filteredElements = activeFase.elements.filter(el => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const inName = el.name.toLowerCase().includes(q);
    const inAlias = (el.alias || '').toLowerCase().includes(q);
    const inDesc = el.description.toLowerCase().includes(q);
    const inMateri = (el.lingkupMateri || []).some(m => m.toLowerCase().includes(q));
    return inName || inAlias || inDesc || inMateri;
  });

  return (
    <div className="space-y-6">
      
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

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 shadow-sm border border-slate-700/50 relative overflow-hidden no-print">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Kurikulum Merdeka BSKAP 046/H/KR/2025
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Dapat Diedit & Disesuaikan Penuh
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-700 text-slate-300">
                Tersimpan Otomatis (Local Storage)
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-emerald-400" />
              Capaian Pembelajaran (CP) PJOK Lengkap & Fleksibel
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Pusat referensi standar kompetensi nasional PJOK SD. Dilengkapi modul eksplorasi elemen, formulasi ATP, pratinjau dokumen resmi siap cetak, serta kebebasan mengedit teks deskripsi CP dan menambah materi sesuai KOSP satuan pendidikan.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportDoc}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Unduh Berkas Word Dokumen CP Resmi"
            >
              <Download className="w-4 h-4" />
              <span>{copiedDoc ? 'Diunduh!' : 'Download Word'}</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Unduh Berkas PDF Dokumen CP Ukuran F4 Siap Cetak"
            >
              <FileText className="w-4 h-4" />
              <span>{isExportingPdf ? 'Memproses PDF...' : 'Download PDF (F4)'}</span>
            </button>

            <button
              onClick={handlePrintCp}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer"
              title="Cetak Berkas Capaian Pembelajaran F4"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>Cetak F4</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              title="Cadangkan Konfigurasi CP ke Berkas JSON"
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

            <button
              onClick={handleResetToDefault}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl transition-all border border-rose-500/30 flex items-center gap-1.5 cursor-pointer"
              title="Kembalikan semua teks CP ke standar resmi Kemendikbudristek (BSKAP)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Reset Standar</span>
            </button>

            <ExportJsonPromptAiButtons
              onExportJson={() => {
                downloadJsonFile(`CP_PJOK_${activeFase.id}_${activeElement.name.replace(/\s+/g, '_')}`, {
                  judul: 'Capaian Pembelajaran & Alur Tujuan Pembelajaran (ATP) PJOK',
                  tanggalEkspor: new Date().toISOString(),
                  fase: activeFase,
                  elemenAktif: activeElement,
                  materiSpesifik,
                  saranaSpesifik,
                  hasilAtp: generatedAtp
                });
              }}
              onOpenPromptAi={() => setShowPromptModal(true)}
            />
          </div>
        </div>

        {/* Phase Selector & Tabs Navigation */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Phase Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {faseList.map((fase) => {
              const isSelected = selectedFaseId === fase.id;
              return (
                <button
                  key={fase.id}
                  onClick={() => handleFaseSelect(fase.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/40'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Target className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-emerald-400'}`} />
                  <span>{fase.phaseName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-slate-950/15 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {fase.grades}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub Navigation Modes */}
          <div className="bg-slate-950/60 p-1 rounded-xl border border-slate-800 flex gap-1 self-start md:self-auto overflow-x-auto">
            <button
              onClick={() => setActiveMainTab('detail')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeMainTab === 'detail'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Rincian & Edit Elemen</span>
            </button>
            <button
              onClick={() => setActiveMainTab('dokumen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeMainTab === 'dokumen'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Dokumen Resmi CP</span>
            </button>
            <button
              onClick={() => setActiveMainTab('rasional')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeMainTab === 'rasional'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Rasional & Karakteristik</span>
            </button>
            <button
              onClick={() => setActiveMainTab('generator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeMainTab === 'generator'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Formulasi ATP & KKTP (AI)</span>
            </button>
            <button
              onClick={() => setActiveMainTab('ttd')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeMainTab === 'ttd'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5 text-emerald-300" />
              <span>Menu TTD & Pengesahan</span>
            </button>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: RINCIAN & EDIT ELEMEN CP (BENTO GRID EXPLORER) */}
      {/* ============================================================== */}
      {activeMainTab === 'detail' && (
        <div className="space-y-6">
          
          {/* Card Capaian Umum Fase Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-full bg-linear-to-l from-emerald-50/70 to-transparent pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                  {activeFase.phaseName.replace('Fase ', '')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-800">
                      Capaian Pembelajaran Akhir {activeFase.phaseName} ({activeFase.grades})
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      {activeFase.skRegulasi || 'BSKAP 046/H/KR/2025'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Standar kompetensi umum yang harus dicapai peserta didik pada akhir fase ini.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={() => handleCopyCpText(activeFase.capaianUmum || '', `Capaian Umum ${activeFase.phaseName}`)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  title="Salin teks Capaian Umum"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </button>
                <button
                  onClick={openEditCapaianUmum}
                  className="px-3 py-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Edit Teks Capaian Umum & Rasional Fase Ini"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Capaian Umum</span>
                </button>
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-xl p-4 relative z-10">
              <p className="text-xs text-emerald-950 font-serif leading-relaxed italic">
                "{activeFase.capaianUmum}"
              </p>
            </div>

            {activeFase.rasionalFase && (
              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-150">
                <span className="font-bold text-slate-700 block mb-0.5">Rasional Pembelajaran Fase:</span>
                {activeFase.rasionalFase}
              </div>
            )}
          </div>

          {/* Search bar & Add Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Cari elemen atau materi di ${activeFase.phaseName}...`}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Total: <strong className="text-slate-800">{activeFase.elements.length} Elemen</strong>
              </span>
              <button
                onClick={openAddNewElement}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Elemen CP Baru</span>
              </button>
            </div>
          </div>

          {/* Grid of Elements */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Col: Element Navigation List (5 Cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-600" />
                    Daftar Elemen {activeFase.phaseName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Ketuk untuk melihat detail
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
                  {filteredElements.map((el, idx) => {
                    const isSelected = activeElementId === el.id;
                    return (
                      <div
                        key={el.id}
                        onClick={() => setActiveElementId(el.id)}
                        className={`p-4 transition-all cursor-pointer flex gap-3 items-start relative group ${
                          isSelected 
                            ? 'bg-emerald-50/70 border-l-4 border-emerald-600 shadow-inner' 
                            : 'hover:bg-slate-50/80 bg-white'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs mt-0.5 ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}>
                          {idx + 1}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-bold truncate ${
                              isSelected ? 'text-emerald-900' : 'text-slate-800'
                            }`}>
                              {el.name}
                            </span>
                            {el.isCustom && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded-md shrink-0">
                                Kustom
                              </span>
                            )}
                          </div>

                          {el.alias && (
                            <p className="text-[10px] font-semibold text-emerald-700 truncate">
                              {el.alias}
                            </p>
                          )}

                          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                            {el.description}
                          </p>

                          <div className="flex items-center gap-2 pt-1">
                            {el.lingkupMateri && el.lingkupMateri.length > 0 && (
                              <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                {el.lingkupMateri.length} Materi
                              </span>
                            )}
                            {el.contohTp && el.contohTp.length > 0 && (
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                                {el.contohTp.length} Contoh TP
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 items-center shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditElement(el);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
                            title="Edit Elemen Ini"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {el.isCustom && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteElement(el.id, el.name);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                              title="Hapus Elemen Kustom"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredElements.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Tidak ada elemen yang cocok dengan pencarian "{searchQuery}".
                    </div>
                  )}
                </div>
              </div>

              {/* Tips Callout */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex gap-3 text-xs text-indigo-900 leading-relaxed">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block mb-0.5 font-bold">Kewenangan Modifikasi Guru:</strong>
                  Sesuai Panduan Pembelajaran dan Asesmen Kurikulum Merdeka, guru berhak menyesuaikan rumusan kalimat CP, lingkup materi, serta alokasi waktu dengan karakteristik peserta didik dan kondisi sarana olahraga di sekolah.
                </div>
              </div>
            </div>

            {/* Right Col: Active Element Detailed View (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
                
                {/* Header detail */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {activeFase.phaseName} • {activeFase.grades}
                      </span>
                      {activeElement.isCustom && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          Elemen Kustom Sekolah
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      {activeElement.name}
                    </h2>
                    {activeElement.alias && (
                      <p className="text-xs font-semibold text-slate-500">
                        Alias / Sebutan: <span className="text-slate-800">{activeElement.alias}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCpText(activeElement.description, activeElement.name)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      title="Salin deskripsi teks CP ini"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin CP</span>
                    </button>

                    <button
                      onClick={() => openEditElement(activeElement)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="Edit kalimat atau materi elemen ini"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Elemen Ini</span>
                    </button>
                  </div>
                </div>

                {/* Deskripsi Teks CP */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    Teks Capaian Pembelajaran (CP) Resmi / Modifikasi:
                  </span>
                  <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-sans text-justify">
                    {activeElement.description}
                  </div>
                </div>

                {/* Lingkup Materi Pokok */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      Lingkup Materi Pokok Esensial:
                    </span>
                    <button
                      onClick={() => openEditElement(activeElement)}
                      className="text-[10px] text-emerald-700 hover:underline font-semibold"
                    >
                      + Sesuaikan Materi
                    </button>
                  </div>
                  
                  {activeElement.lingkupMateri && activeElement.lingkupMateri.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {activeElement.lingkupMateri.map((materi, idx) => (
                        <span 
                          key={idx}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-lg text-xs font-medium"
                        >
                          {materi}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada daftar lingkup materi spesifik. Klik 'Edit Elemen' untuk menambahkan.</p>
                  )}
                </div>

                {/* Contoh Formulasi Alur TP Turunan */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-emerald-600" />
                      Contoh Formulasi Tujuan Pembelajaran (TP) Turunan:
                    </span>
                    <button
                      onClick={() => openEditElement(activeElement)}
                      className="text-[10px] text-emerald-700 hover:underline font-semibold"
                    >
                      + Tambah Contoh TP
                    </button>
                  </div>

                  {activeElement.contohTp && activeElement.contohTp.length > 0 ? (
                    <div className="space-y-2">
                      {activeElement.contohTp.map((tp, idx) => (
                        <div 
                          key={idx}
                          className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-700 flex items-start gap-2.5"
                        >
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed flex-1">{tp}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada contoh TP turunan. Anda dapat menambahkan contoh TP atau menggunakan fitur Formulasi AI.</p>
                  )}
                </div>

                {/* Bottom Action Cards */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setActiveMainTab('generator');
                      setMateriSpesifik(activeElement.lingkupMateri?.[0] || '');
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Formulasikan ATP & KKTP dari Elemen Ini</span>
                  </button>

                  <button
                    onClick={handleExportDoc}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Unduh Dokumen CP (.doc)</span>
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: DOKUMEN RESMI CAPAIAN PEMBELAJARAN (SIAP CETAK) */}
      {/* ============================================================== */}
      {activeMainTab === 'dokumen' && (
        <div className="space-y-6">
          
          {/* Settings Bar for School & Signatures */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 no-print space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-600" />
                Data Administrasi Sekolah & Tanda Tangan Dokumen
              </span>
              <span className="text-[10px] text-slate-400">
                Data tersimpan otomatis untuk pencetakan dokumen resmi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Satuan Pendidikan</label>
                <input
                  type="text"
                  value={namaSekolah}
                  onChange={(e) => setNamaSekolah(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  value={tahunAjaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Guru PJOK</label>
                <input
                  type="text"
                  value={namaGuru}
                  onChange={(e) => setNamaGuru(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">NIP Guru PJOK</label>
                <input
                  type="text"
                  value={nipGuru}
                  onChange={(e) => setNipGuru(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kepala Sekolah</label>
                <input
                  type="text"
                  value={kepalaSekolah}
                  onChange={(e) => setKepalaSekolah(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={nipKepsek}
                  onChange={(e) => setNipKepsek(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Official Document Sheet Preview (A4 Paper style) */}
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
                CAPAIAN PEMBELAJARAN (CP) MATA PELAJARAN PJOK
              </h1>
              <p className="text-xs font-sans font-semibold text-slate-600">
                KURIKULUM MERDEKA &bull; TAHUN AJARAN {tahunAjaran}
              </p>
              <p className="text-[10px] font-sans text-slate-500 italic">
                Landasan Yuridis: {activeFase.skRegulasi || 'Keputusan Kepala BSKAP Nomor 046/H/KR/2025'}
              </p>
            </div>

            {/* Fase Metadata Info */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-sans text-xs">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 font-bold text-slate-500 w-36">Fase / Kelas</td>
                    <td className="py-1 font-bold text-slate-900">: {activeFase.phaseName} ({activeFase.grades})</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold text-slate-500">Mata Pelajaran</td>
                    <td className="py-1 text-slate-900">: Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold text-slate-500">Jumlah Elemen</td>
                    <td className="py-1 text-slate-900">: {activeFase.elements.length} Elemen Pembelajaran</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Capaian Pembelajaran Akhir Fase */}
            <div className="space-y-2">
              <h4 className="text-xs font-sans font-extrabold uppercase tracking-wider text-slate-800 border-l-4 border-emerald-600 pl-2">
                A. Capaian Pembelajaran Umum Akhir {activeFase.phaseName}
              </h4>
              <div className="p-4 bg-emerald-50/40 border border-emerald-200/70 rounded-xl text-xs leading-relaxed text-justify italic text-emerald-950 font-serif">
                "{activeFase.capaianUmum}"
              </div>
            </div>

            {/* Rasional Fase jika ada */}
            {activeFase.rasionalFase && (
              <div className="space-y-2">
                <h4 className="text-xs font-sans font-extrabold uppercase tracking-wider text-slate-800 border-l-4 border-slate-500 pl-2">
                  B. Rasional Pembelajaran {activeFase.phaseName}
                </h4>
                <p className="text-xs leading-relaxed text-slate-700 font-sans text-justify">
                  {activeFase.rasionalFase}
                </p>
              </div>
            )}

            {/* Elemen & Deskripsi CP Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-sans font-extrabold uppercase tracking-wider text-slate-800 border-l-4 border-indigo-600 pl-2">
                C. Elemen, Capaian Pembelajaran, & Lingkup Materi
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-300">
                <table className="w-full text-xs text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-3 w-10 text-center border-r border-slate-200">No</th>
                      <th className="p-3 w-48 border-r border-slate-200">Elemen Pembelajaran</th>
                      <th className="p-3 border-r border-slate-200">Deskripsi Capaian Pembelajaran (CP)</th>
                      <th className="p-3 w-56">Lingkup Materi Pokok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeFase.elements.map((el, idx) => (
                      <tr key={el.id} className="align-top hover:bg-slate-50/50">
                        <td className="p-3 text-center font-bold text-slate-600 border-r border-slate-200">{idx + 1}</td>
                        <td className="p-3 border-r border-slate-200">
                          <strong className="text-slate-900 block">{el.name}</strong>
                          {el.alias && <span className="text-[10px] text-slate-500 font-medium block mt-0.5">({el.alias})</span>}
                          {el.isCustom && <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-semibold inline-block mt-1">Muatan Kustom</span>}
                        </td>
                        <td className="p-3 border-r border-slate-200 text-slate-800 leading-relaxed text-justify">
                          {el.description}
                        </td>
                        <td className="p-3 text-slate-700">
                          {el.lingkupMateri && el.lingkupMateri.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-[11px]">
                              {el.lingkupMateri.map((m, mIdx) => (
                                <li key={mIdx}>{m}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Area */}
            <div className="pt-8 font-sans text-xs">
              <table className="w-full">
                <tbody>
                  <tr>
                    {showPengawas ? (
                      <>
                        <td className="w-1/3 text-center align-top space-y-1">
                          <p>Mengetahui,</p>
                          <p className="font-bold">{jabatanKepsek}</p>
                          <div className="h-20 flex items-center justify-center my-1 relative">
                            {kepsekSignature ? (
                              <img src={kepsekSignature} alt="TTD Kepala Sekolah" className="max-h-16 max-w-32 object-contain" />
                            ) : (
                              <div className="h-16"></div>
                            )}
                            {showStempel && stempelImage && (
                              <img src={stempelImage} alt="Stempel Sekolah" className="absolute -left-2 top-0 max-h-20 max-w-20 object-contain opacity-80 pointer-events-none" />
                            )}
                          </div>
                          <p className="font-bold underline uppercase">{kepalaSekolah}</p>
                          <p className="text-[10px] text-slate-500">NIP. {nipKepsek}</p>
                        </td>

                        <td className="w-1/3 text-center align-top space-y-1">
                          <p>Mengesahkan,</p>
                          <p className="font-bold">{jabatanPengawas}</p>
                          <div className="h-20 flex items-center justify-center my-1">
                            {pengawasSignature ? (
                              <img src={pengawasSignature} alt="TTD Pengawas" className="max-h-16 max-w-32 object-contain" />
                            ) : (
                              <div className="h-16"></div>
                            )}
                          </div>
                          <p className="font-bold underline uppercase">{namaPengawas}</p>
                          <p className="text-[10px] text-slate-500">NIP. {nipPengawas}</p>
                        </td>

                        <td className="w-1/3 text-center align-top space-y-1">
                          <p>{tempatPenetapan}, {tanggalPenetapan}</p>
                          <p className="font-bold">{jabatanGuru}</p>
                          <div className="h-20 flex items-center justify-center my-1">
                            {guruSignature ? (
                              <img src={guruSignature} alt="TTD Guru PJOK" className="max-h-16 max-w-32 object-contain" />
                            ) : (
                              <div className="h-16"></div>
                            )}
                          </div>
                          <p className="font-bold underline uppercase">{namaGuru}</p>
                          <p className="text-[10px] text-slate-500">NIP. {nipGuru}</p>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="w-1/2 text-center align-top space-y-1">
                          <p>Mengetahui,</p>
                          <p className="font-bold">{jabatanKepsek}</p>
                          <div className="h-20 flex items-center justify-center my-1 relative">
                            {kepsekSignature ? (
                              <img src={kepsekSignature} alt="TTD Kepala Sekolah" className="max-h-16 max-w-36 object-contain" />
                            ) : (
                              <div className="h-16"></div>
                            )}
                            {showStempel && stempelImage && (
                              <img src={stempelImage} alt="Stempel Sekolah" className="absolute left-8 top-0 max-h-20 max-w-20 object-contain opacity-80 pointer-events-none" />
                            )}
                          </div>
                          <p className="font-bold underline uppercase">{kepalaSekolah}</p>
                          <p className="text-[10px] text-slate-500">NIP. {nipKepsek}</p>
                        </td>

                        <td className="w-1/2 text-center align-top space-y-1">
                          <p>Ditetapkan di: {tempatPenetapan}</p>
                          <p className="text-[10px] text-slate-500 mb-0.5">Pada tanggal: {tanggalPenetapan}</p>
                          <p className="font-bold">{jabatanGuru}</p>
                          <div className="h-20 flex items-center justify-center my-1">
                            {guruSignature ? (
                              <img src={guruSignature} alt="TTD Guru PJOK" className="max-h-16 max-w-36 object-contain" />
                            ) : (
                              <div className="h-16"></div>
                            )}
                          </div>
                          <p className="font-bold underline uppercase">{namaGuru}</p>
                          <p className="text-[10px] text-slate-500">NIP. {nipGuru}</p>
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>

              <div className="mt-4 pt-3 border-t border-slate-200 text-center no-print">
                <button
                  type="button"
                  onClick={() => setActiveMainTab('ttd')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  <span>Buka Menu TTD & Lembar Pengesahan</span>
                </button>
              </div>
            </div>

          </div>

          {/* Action Toolbar on Bottom of Document */}
          <div className="flex flex-wrap justify-center gap-3 no-print">
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{isExportingPdf ? 'Memproses PDF F4...' : 'Download PDF (F4) Siap Cetak'}</span>
            </button>
            <button
              onClick={handleExportDoc}
              className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download Format Microsoft Word (.doc)</span>
            </button>
            <button
              onClick={handlePrintCp}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Lembar Dokumen (F4)</span>
            </button>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: RASIONAL & KARAKTERISTIK MAPEL PJOK */}
      {/* ============================================================== */}
      {activeMainTab === 'rasional' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Hakikat & Rasional PJOK */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Hakikat & Rasional Mapel PJOK SD
              </h3>
              <div className="text-xs text-slate-700 leading-relaxed space-y-3 text-justify">
                <p>
                  Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK) merupakan media edukasi yang memanfaatkan aktivitas fisik untuk menghasilkan perubahan holistik dalam kualitas individu, baik secara fisik, mental, maupun emosional.
                </p>
                <p>
                  PJOK bukan sekadar melatih keterampilan cabang olahraga kompetitif, melainkan menumbuhkan <strong>literasi gerak (physical literacy)</strong> sepanjang hayat, membiasakan gaya hidup aktif dan sehat, serta membina karakter gotong royong, kejujuran, dan sportivitas.
                </p>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold text-[11px]">
                  "Aktivitas jasmani yang teratur adalah investasi terbaik bagi kesehatan otak, konsentrasi belajar, dan ketahanan emosional peserta didik."
                </div>
              </div>
            </div>

            {/* 4 Elemen Utama PJOK Kurikulum Merdeka */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                4 Elemen Utama PJOK Kurikulum Merdeka
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-250">
                  <strong className="text-emerald-800 block text-[11px]">1. Terampil Bergerak (Keterampilan Gerak)</strong>
                  <p className="text-slate-600 text-[10px] mt-0.5">Penguasaan pola gerak dasar (lokomotor, non-lokomotor, manipulatif) hingga keterampilan gerak spesifik cabang olahraga dan aktivitas fisik terstruktur.</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-250">
                  <strong className="text-indigo-800 block text-[11px]">2. Belajar Melalui Gerak (Pengetahuan & Karakter Sosial)</strong>
                  <p className="text-slate-600 text-[10px] mt-0.5">Penanaman nilai fair play, kejujuran, kolaborasi tim, kepemimpinan, kepatuhan aturan, serta kemampuan memecahkan masalah dalam situasi gerak.</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-250">
                  <strong className="text-amber-800 block text-[11px]">3. Bergaya Hidup Aktif (Pemanfaatan Gerak & Kebugaran)</strong>
                  <p className="text-slate-600 text-[10px] mt-0.5">Partisipasi aktif kegiatan jasmani menyenangkan, latihan kebugaran jasmani, pemantauan denyut nadi, serta pembiasaan hidup aktif harian.</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-250">
                  <strong className="text-rose-800 block text-[11px]">4. Memilih Hidup yang Menyehatkan (Pola Hidup Sehat & Keselamatan)</strong>
                  <p className="text-slate-600 text-[10px] mt-0.5">Pemahaman nutrisi gizi seimbang, kebersihan diri & organ reproduksi, pencegahan cedera, mitigasi bahaya rokok/NAPZA, dan aksi anti-bullying.</p>
                </div>
              </div>
            </div>

            {/* Integrasi Profil Pelajar Pancasila */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Integrasi Dimensi Profil Pelajar Pancasila
              </h3>
              <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                <li><strong className="text-slate-900">Mandiri:</strong> Peserta didik membiasakan pemanasan mandiri, disiplin menjaga kebugaran, dan bertanggung jawab atas keselamatan dirinya.</li>
                <li><strong className="text-slate-900">Bergotong Royong:</strong> Kerjasama regu, saling mendukung, berbagi peran dalam permainan olahraga, dan tidak menyalahkan teman.</li>
                <li><strong className="text-slate-900">Bernalar Kritis:</strong> Menganalisis strategi menyerang/bertahan, mengoreksi teknik gerakan teman, dan memahami pentingnya gizi seimbang.</li>
                <li><strong className="text-slate-900">Berakhlak Mulia:</strong> Menjunjung tinggi sportivitas, menghormati wasit, dan bersikap santun terhadap lawan main.</li>
              </ul>
            </div>

            {/* Pendekatan Deep Learning & Diferensiasi */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Pendekatan Pembelajaran Mendalam (Deep Learning)
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed text-justify">
                Dalam pembelajaran PJOK era baru, guru menggunakan 3 pilar Deep Learning:
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                  <span className="font-bold text-indigo-900 block text-[11px]">Mindful</span>
                  <span className="text-[10px] text-slate-500">Kesadaran tubuh & gerak bermakna</span>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                  <span className="font-bold text-emerald-900 block text-[11px]">Meaningful</span>
                  <span className="text-[10px] text-slate-500">Terkoneksi kehidupan nyata & kebugaran</span>
                </div>
                <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                  <span className="font-bold text-amber-900 block text-[11px]">Joyful</span>
                  <span className="text-[10px] text-slate-500">Suasana bermain gembira & inklusif</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: FORMULASI ATP & KKTP (AI GENERATOR) */}
      {/* ============================================================== */}
      {activeMainTab === 'generator' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Input Form Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs">Konfigurasi Formulasi ATP & KKTP</h3>
                    <p className="text-[10px] text-slate-400">Turunkan CP aktif menjadi Tujuan Pembelajaran urut & rubrik</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Fase & Elemen Terpilih</span>
                    <span className="text-emerald-700 font-bold">{activeFase.phaseName} ({activeFase.grades})</span>
                  </div>
                  <p className="font-extrabold text-slate-900 text-xs">{activeElement.name}</p>
                  <p className="text-[11px] text-slate-600 line-clamp-3 italic pt-1 border-t border-slate-200">
                    "{activeElement.description}"
                  </p>
                </div>

                <form onSubmit={handleGenerateATP} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      Materi Pokok Spesifik <span className="text-slate-400">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={materiSpesifik}
                      onChange={(e) => setMateriSpesifik(e.target.value)}
                      placeholder="Contoh: Kasti, Senam Lantai, Atletik Lari, Bola Voli Mini..."
                      className="w-full border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                    {activeElement.lingkupMateri && activeElement.lingkupMateri.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
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

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      Kondisi Sarana / Batasan Sekolah <span className="text-slate-400">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={saranaSpesifik}
                      onChange={(e) => setSaranaSpesifik(e.target.value)}
                      placeholder="Contoh: Halaman terbatas, matras terbatas, tanpa lintasan lari"
                      className="w-full border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-slate-900 to-emerald-950 hover:from-emerald-700 hover:to-emerald-600 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {isGenerating ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Merumuskan ATP Kurikulum Merdeka...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Formulasikan ATP & KKTP dengan AI
                      </>
                    )}
                  </button>
                </form>

              </div>

              {/* Error Message */}
              {generationError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs flex gap-2.5 items-start">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <span className="font-bold">Gagal Merumuskan ATP: </span>
                    {generationError}
                  </div>
                </div>
              )}
            </div>

            {/* Result Column */}
            <div className="lg:col-span-7 space-y-4">
              {generatedAtp ? (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs animate-fadeIn">
                  
                  {/* Top Bar Result */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkle className="w-4 h-4 text-amber-500 fill-amber-500" />
                      Hasil Formulasi ATP & Rubrik KKTP
                    </span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={copyAtpToClipboard}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Tersalin!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" /> Salin Teks
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          const docContent = exportAtpToDoc(
                            activeFase.phaseName,
                            activeFase.grades,
                            activeElement.name,
                            materiSpesifik,
                            saranaSpesifik,
                            generatedAtp
                          );
                          downloadDocFile(`ATP_KKTP_${activeFase.phaseName.replace(/\s+/g, '_')}`, docContent);
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" /> Ekspor Word
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-6">
                    
                    {/* Alur Tujuan Pembelajaran */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-l-4 border-emerald-500 pl-2">
                        <ListOrdered className="w-4 h-4 text-emerald-600" /> Alur Tujuan Pembelajaran (ATP) Berurutan
                      </h4>
                      <div className="space-y-2.5 pl-2">
                        {generatedAtp.alurTujuanPembelajaran.map((step, idx) => (
                          <div key={idx} className="flex gap-3 items-start text-xs text-slate-700 bg-slate-50/50 p-2.5 rounded-xl border border-slate-150">
                            <span className="w-5 h-5 shrink-0 bg-emerald-600 text-white font-bold rounded-full flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <p className="pt-0.5 leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rubrik KKTP */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-l-4 border-indigo-500 pl-2">
                        <ClipboardCheck className="w-4 h-4 text-indigo-600" /> Kriteria Ketercapaian & Kategori Asesmen
                      </h4>
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-xs text-slate-700 text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                              <th className="p-3 w-1/4">Kriteria Penilaian</th>
                              <th className="p-3 w-1/4 text-amber-800 bg-amber-50/35">Baru Berkembang (BB)</th>
                              <th className="p-3 w-1/4 text-indigo-800 bg-indigo-50/20">Layak (L)</th>
                              <th className="p-3 w-1/4 text-emerald-800 bg-emerald-50/20">Mahir (M)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {generatedAtp.kriteriaKetercapaian.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/30">
                                <td className="p-3 font-bold text-slate-800 text-[11px]">{item.kriteria}</td>
                                <td className="p-3 text-[10px] leading-relaxed text-amber-700 bg-amber-50/10">{item.baruBerkembang}</td>
                                <td className="p-3 text-[10px] leading-relaxed text-indigo-700 bg-indigo-50/5">{item.layak}</td>
                                <td className="p-3 text-[10px] leading-relaxed text-emerald-700 bg-emerald-50/5">{item.mahir}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Rekomendasi Mengajar */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                      <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-indigo-600" /> Rekomendasi Pendekatan Mengajar PJOK
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed pl-5">
                        {generatedAtp.metodePembelajaran}
                      </p>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Formulasi Siap Dijalankan</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Klik tombol "Formulasikan ATP & KKTP dengan AI" untuk menurunkan capaian pembelajaran <strong>{activeElement.name}</strong> menjadi alur tujuan pembelajaran sistematis.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: MENU TTD & LEMBAR PENGESAHAN DOKUMEN CP */}
      {/* ============================================================== */}
      {activeMainTab === 'ttd' && (
        <div className="space-y-6">
          
          {/* Top Banner TTD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 no-print">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Administrasi Formal & Pengesahan
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {activeFase.phaseName} ({activeFase.grades})
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-emerald-600" />
                  Menu Tanda Tangan & Lembar Pengesahan Capaian Pembelajaran
                </h2>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                  Bubuhkan tanda tangan digital (gores langsung atau unggah pindaian), atur tempat dan tanggal penetapan, serta cetak lembar pengesahan resmi CP Kurikulum Merdeka.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPengesahanDoc}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Word Pengesahan</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPengesahanPdf}
                  disabled={isExportingPdf}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isExportingPdf ? 'Memproses PDF...' : 'Download PDF Pengesahan (F4)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintPengesahan}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Pengesahan (F4)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('dokumen')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lihat Dokumen Lengkap CP</span>
                </button>
              </div>
            </div>

            {/* Quick Status Chips */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[11px]">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500">Guru PJOK:</span>
                <strong className={guruSignature ? 'text-emerald-700' : 'text-slate-700'}>
                  {guruSignature ? '✓ TTD Digital Aktif' : 'TTD Basah Manual'}
                </strong>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500">Kepala Sekolah:</span>
                <strong className={kepsekSignature ? 'text-emerald-700' : 'text-slate-700'}>
                  {kepsekSignature ? '✓ TTD Digital Aktif' : 'TTD Basah Manual'}
                </strong>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500">Pengawas:</span>
                <strong className={showPengawas ? 'text-indigo-700' : 'text-slate-400'}>
                  {showPengawas ? (pengawasSignature ? '✓ Aktif & Bertanda Tangan' : 'Aktif (Manual)') : 'Nonaktif'}
                </strong>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500">Penetapan:</span>
                <strong className="text-slate-700">{tempatPenetapan}, {tanggalPenetapan}</strong>
              </div>
            </div>
          </div>

          {/* 3-Column Configuration Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
            
            {/* COLUMN 1: GURU PJOK */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  Identitas Guru PJOK
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      value={namaGuru}
                      onChange={(e) => setNamaGuru(e.target.value)}
                      placeholder="Contoh: Budi Santoso, S.Pd."
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">NIP / NUPTK</label>
                    <input
                      type="text"
                      value={nipGuru}
                      onChange={(e) => setNipGuru(e.target.value)}
                      placeholder="19890512 201502 1 002"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Jabatan Penandatangan</label>
                    <input
                      type="text"
                      value={jabatanGuru}
                      onChange={(e) => setJabatanGuru(e.target.value)}
                      placeholder="Guru Mata Pelajaran PJOK"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Digital Pad Guru */}
              <DigitalSignaturePad
                label="Tanda Tangan Guru PJOK"
                signatoryTitle={jabatanGuru}
                signatoryName={namaGuru}
                signatoryNip={nipGuru}
                signatureData={guruSignature}
                onSaveSignature={(data) => setGuruSignature(data)}
                onClearSignature={() => setGuruSignature('')}
              />
            </div>

            {/* COLUMN 2: KEPALA SEKOLAH */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Building className="w-3.5 h-3.5 text-emerald-600" />
                  Identitas Kepala Satuan Pendidikan
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Kepala Sekolah</label>
                    <input
                      type="text"
                      value={kepalaSekolah}
                      onChange={(e) => setKepalaSekolah(e.target.value)}
                      placeholder="Contoh: Dra. Hj. Siti Rahma, M.Pd."
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">NIP Kepala Sekolah</label>
                    <input
                      type="text"
                      value={nipKepsek}
                      onChange={(e) => setNipKepsek(e.target.value)}
                      placeholder="19750318 200003 1 005"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Jabatan Penandatangan</label>
                    <input
                      type="text"
                      value={jabatanKepsek}
                      onChange={(e) => setJabatanKepsek(e.target.value)}
                      placeholder="Kepala Sekolah"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Digital Pad Kepsek */}
              <DigitalSignaturePad
                label="Tanda Tangan Kepala Sekolah"
                signatoryTitle={jabatanKepsek}
                signatoryName={kepalaSekolah}
                signatoryNip={nipKepsek}
                signatureData={kepsekSignature}
                onSaveSignature={(data) => setKepsekSignature(data)}
                onClearSignature={() => setKepsekSignature('')}
              />
            </div>

            {/* COLUMN 3: TEMPAT, TANGGAL, PENGAWAS & STEMPEL */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Tempat & Tanggal Penetapan
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kota / Tempat</label>
                    <input
                      type="text"
                      value={tempatPenetapan}
                      onChange={(e) => setTempatPenetapan(e.target.value)}
                      placeholder="Contoh: Jakarta"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tanggal Penetapan</label>
                    <input
                      type="text"
                      value={tanggalPenetapan}
                      onChange={(e) => setTanggalPenetapan(e.target.value)}
                      placeholder="Contoh: 15 Juli 2026"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Stempel Sekolah Switch */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showStempel}
                      onChange={(e) => setShowStempel(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Stamp className="w-3.5 h-3.5 text-emerald-600" />
                      Sertakan Cap / Stempel Lembaga
                    </span>
                  </label>

                  {showStempel && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      {stempelImage ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src={stempelImage} alt="Stempel" className="w-12 h-12 object-contain bg-white p-1 rounded-lg border border-slate-200" />
                            <span className="text-[11px] font-bold text-slate-700">Stempel Aktif</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStempelImage('')}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                            title="Hapus Stempel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="border border-dashed border-slate-300 hover:border-emerald-500 rounded-lg p-2.5 text-center flex flex-col items-center justify-center cursor-pointer bg-white">
                          <Upload className="w-4 h-4 text-slate-400 mb-0.5" />
                          <span className="text-[11px] font-semibold text-slate-600">Unggah Gambar Cap Stempel</span>
                          <span className="text-[9px] text-slate-400">PNG Transparan disarankan</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                const r = new FileReader();
                                r.onload = (ev) => setStempelImage(ev.target?.result as string);
                                r.readAsDataURL(f);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Pengawas Sekolah Switch */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showPengawas}
                      onChange={(e) => setShowPengawas(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Sertakan Kolom Menyetujui Pengawas Sekolah / Komite
                    </span>
                  </label>

                  {showPengawas && (
                    <div className="space-y-2 text-xs pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Nama Pengawas</label>
                        <input
                          type="text"
                          value={namaPengawas}
                          onChange={(e) => setNamaPengawas(e.target.value)}
                          placeholder="Pengawas Pembina SD, M.Pd."
                          className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">NIP Pengawas</label>
                        <input
                          type="text"
                          value={nipPengawas}
                          onChange={(e) => setNipPengawas(e.target.value)}
                          placeholder="19700101 199503 1 003"
                          className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Digital Pad Pengawas jika aktif */}
              {showPengawas && (
                <DigitalSignaturePad
                  label="Tanda Tangan Pengawas Sekolah"
                  signatoryTitle={jabatanPengawas}
                  signatoryName={namaPengawas}
                  signatoryNip={nipPengawas}
                  signatureData={pengawasSignature}
                  onSaveSignature={(data) => setPengawasSignature(data)}
                  onClearSignature={() => setPengawasSignature('')}
                />
              )}
            </div>

          </div>

          {/* ============================================================== */}
          {/* LEMBAR PENGESAHAN DOKUMEN CAPAIAN PEMBELAJARAN (PRINT SHEET) */}
          {/* ============================================================== */}
          <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-8 md:p-12 max-w-4xl mx-auto space-y-6 text-slate-900 font-serif print:shadow-none print:p-0 print:border-none">
            
            {/* Header KOP */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <h3 className="text-xs uppercase font-sans font-bold tracking-widest text-slate-600">
                Pemerintah Daerah &bull; Dinas Pendidikan
              </h3>
              <h2 className="text-base md:text-lg uppercase font-bold text-slate-900 tracking-wide">
                {namaSekolah}
              </h2>
              <h1 className="text-sm md:text-base font-black uppercase text-slate-900 pt-2 tracking-wide">
                LEMBAR PENGESAHAN CAPAIAN PEMBELAJARAN (CP)
              </h1>
              <p className="text-xs font-sans font-semibold text-slate-700">
                MATA PELAJARAN: PENDIDIKAN JASMANI, OLAHRAGA, DAN KESEHATAN (PJOK)
              </p>
              <p className="text-[11px] font-sans text-slate-500">
                FASE / TINGKAT: {activeFase.phaseName} ({activeFase.grades}) &bull; TAHUN AJARAN {tahunAjaran}
              </p>
            </div>

            {/* Naskah Pernyataan Pengesahan */}
            <div className="p-6 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4 text-xs font-sans leading-relaxed text-justify">
              <p>
                Setelah melalui proses pencermatan, penelaahan, serta verifikasi internal terhadap rumusan kompetensi inti dan lingkup materi pada <strong>Capaian Pembelajaran (CP)</strong> Mata Pelajaran <strong>Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK) {activeFase.phaseName} ({activeFase.grades})</strong> Kurikulum Merdeka yang disusun oleh Guru Mata Pelajaran PJOK, maka dengan ini Kepala Satuan Pendidikan menyatakan bahwa dokumen tersebut:
              </p>
              
              <div className="text-center py-2">
                <span className="inline-block px-6 py-2 bg-emerald-100/70 border border-emerald-300 text-emerald-950 font-black text-sm uppercase tracking-widest rounded-xl">
                  DISAHKAN & DIBERLAKUKAN
                </span>
              </div>

              <p>
                Sebagai acuan resmi operasional penyusunan Alur Tujuan Pembelajaran (ATP), Modul Ajar, Perencanaan Pembelajaran Mendalam (Deep Learning), serta Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) pada <strong>{namaSekolah}</strong> untuk pelaksanaan kurikulum Tahun Ajaran <strong>{tahunAjaran}</strong>.
              </p>
            </div>

            {/* Kolom Tanda Tangan Formal */}
            <div className="pt-6 font-sans text-xs">
              <table className="w-full">
                <tbody>
                  <tr>
                    {showPengawas ? (
                      <>
                        <td className="w-1/3 text-center align-top space-y-1">
                          <p>Mengetahui,</p>
                          <p className="font-bold">{jabatanKepsek}</p>
                          <div className="h-24 flex items-center justify-center my-1 relative">
                            {kepsekSignature ? (
                              <img src={kepsekSignature} alt="TTD Kepala Sekolah" className="max-h-20 max-w-32 object-contain" />
                            ) : (
                              <div className="h-20"></div>
                            )}
                            {showStempel && stempelImage && (
                              <img src={stempelImage} alt="Stempel Sekolah" className="absolute -left-2 top-1 max-h-20 max-w-20 object-contain opacity-80 pointer-events-none" />
                            )}
                          </div>
                          <p className="font-bold underline uppercase">{kepalaSekolah}</p>
                          <p className="text-[10px] text-slate-500">NIP. {nipKepsek}</p>
                        </td>

                        <td className="w-1/3 text-center align-top space-y-1">
                          <p>Mengesahkan,</p>
                          <p className="font-bold">{jabatanPengawas}</p>
                          <div className="h-24 flex items-center justify-center my-1">
                            {pengawasSignature ? (
                              <img src={pengawasSignature} alt="TTD Pengawas" className="max-h-20 max-w-32 object-contain" />
                            ) : (
                              <div className="h-20"></div>
                            )}
                          </div>
                          <p className="font-bold underline uppercase">{namaPengawas}</p>
                          <p className="text-[10px] text-slate-500">NIP. {nipPengawas}</p>
                        </td>

                        <td className="w-1/3 text-center align-top space-y-1">
                          <p>{tempatPenetapan}, {tanggalPenetapan}</p>
                          <p className="font-bold">{jabatanGuru}</p>
                          <div className="h-24 flex items-center justify-center my-1">
                            {guruSignature ? (
                              <img src={guruSignature} alt="TTD Guru PJOK" className="max-h-20 max-w-32 object-contain" />
                            ) : (
                              <div className="h-20"></div>
                            )}
                          </div>
                          <p className="font-bold underline uppercase">{namaGuru}</p>
                          <p className="text-[10px] text-slate-500">NIP. {nipGuru}</p>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="w-1/2 text-center align-top space-y-1">
                          <p>Mengetahui,</p>
                          <p className="font-bold">{jabatanKepsek}</p>
                          <div className="h-24 flex items-center justify-center my-1 relative">
                            {kepsekSignature ? (
                              <img src={kepsekSignature} alt="TTD Kepala Sekolah" className="max-h-20 max-w-40 object-contain" />
                            ) : (
                              <div className="h-20"></div>
                            )}
                            {showStempel && stempelImage && (
                              <img src={stempelImage} alt="Stempel Sekolah" className="absolute left-10 top-1 max-h-22 max-w-22 object-contain opacity-80 pointer-events-none" />
                            )}
                          </div>
                          <p className="font-bold underline uppercase">{kepalaSekolah}</p>
                          <p className="text-[10px] text-slate-500">NIP. {nipKepsek}</p>
                        </td>

                        <td className="w-1/2 text-center align-top space-y-1">
                          <p>Ditetapkan di: {tempatPenetapan}</p>
                          <p className="text-[10px] text-slate-500 mb-0.5">Pada tanggal: {tanggalPenetapan}</p>
                          <p className="font-bold">{jabatanGuru}</p>
                          <div className="h-24 flex items-center justify-center my-1">
                            {guruSignature ? (
                              <img src={guruSignature} alt="TTD Guru PJOK" className="max-h-20 max-w-40 object-contain" />
                            ) : (
                              <div className="h-20"></div>
                            )}
                          </div>
                          <p className="font-bold underline uppercase">{namaGuru}</p>
                          <p className="text-[10px] text-slate-500">NIP. {nipGuru}</p>
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* Bottom Actions for Tab TTD */}
          <div className="flex flex-wrap justify-center gap-3 no-print">
            <button
              onClick={handleExportPengesahanPdf}
              disabled={isExportingPdf}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{isExportingPdf ? 'Memproses PDF F4...' : 'Download PDF Pengesahan (F4)'}</span>
            </button>
            <button
              onClick={handleExportPengesahanDoc}
              className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download Word Pengesahan (.doc)</span>
            </button>
            <button
              onClick={handlePrintPengesahan}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Lembar Pengesahan (F4)</span>
            </button>
          </div>

        </div>
      )}
      {/* ============================================================== */}
      {isEditingCapaianUmum && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm">Edit Capaian Pembelajaran Akhir {activeFase.phaseName}</h3>
                  <p className="text-[10px] text-slate-300">Sesuaikan kalimat capaian umum dan rasional untuk {activeFase.grades}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditingCapaianUmum(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Dasar Regulasi / SK Standar</label>
                <input
                  type="text"
                  value={tempSkRegulasi}
                  onChange={(e) => setTempSkRegulasi(e.target.value)}
                  placeholder="Contoh: Keputusan Kepala BSKAP Nomor 046/H/KR/2025"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 block">Teks Deskripsi Capaian Pembelajaran Akhir Fase</label>
                  <span className="text-[10px] text-slate-400">{tempCapaianUmum.length} karakter</span>
                </div>
                <textarea
                  rows={5}
                  value={tempCapaianUmum}
                  onChange={(e) => setTempCapaianUmum(e.target.value)}
                  placeholder="Ketik kalimat capaian pembelajaran umum akhir fase di sini..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Rasional Pembelajaran Fase (Opsional)</label>
                <textarea
                  rows={3}
                  value={tempRasionalFase}
                  onChange={(e) => setTempRasionalFase(e.target.value)}
                  placeholder="Ketik rasional dan fokus penekanan pembelajaran fase ini..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
                <span className="font-bold text-slate-700">Catatan:</span> Perubahan ini akan langsung disimpan ke memori aplikasi lokal dan diterapkan pada seluruh lembar cetak dokumen dan formulasi kurikulum.
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingCapaianUmum(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCapaianUmum}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT / TAMBAH ELEMEN CP */}
      {/* ============================================================== */}
      {isEditingElement && editingElementData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm">
                    {isNewElement ? `Tambah Elemen Baru di ${activeFase.phaseName}` : `Edit Elemen: ${editingElementData.name}`}
                  </h3>
                  <p className="text-[10px] text-slate-300">Sesuaikan nama, alias, deskripsi kalimat CP, materi, dan contoh TP</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditingElement(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nama Elemen Pembelajaran</label>
                  <input
                    type="text"
                    value={editingElementData.name}
                    onChange={(e) => setEditingElementData({ ...editingElementData, name: e.target.value })}
                    placeholder="Contoh: Terampil Bergerak, Olahraga Tradisional Daerah..."
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Alias / Sub-Judul Elemen (Opsional)</label>
                  <input
                    type="text"
                    value={editingElementData.alias || ''}
                    onChange={(e) => setEditingElementData({ ...editingElementData, alias: e.target.value })}
                    placeholder="Contoh: Keterampilan Gerak Spesifik Dasar"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Kalimat Deskripsi CP */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 block">
                    Deskripsi Kalimat Capaian Pembelajaran (CP)
                  </label>
                  <span className="text-[10px] text-slate-400">{editingElementData.description.length} karakter</span>
                </div>
                <textarea
                  rows={5}
                  value={editingElementData.description}
                  onChange={(e) => setEditingElementData({ ...editingElementData, description: e.target.value })}
                  placeholder="Ketik kalimat Capaian Pembelajaran resmi atau modifikasi di sini..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              {/* Lingkup Materi Editor */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  Lingkup Materi Pokok (Tag Materi)
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempNewMateriInput}
                    onChange={(e) => setTempNewMateriInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tempNewMateriInput.trim()) {
                          const current = editingElementData.lingkupMateri || [];
                          setEditingElementData({
                            ...editingElementData,
                            lingkupMateri: [...current, tempNewMateriInput.trim()]
                          });
                          setTempNewMateriInput('');
                        }
                      }
                    }}
                    placeholder="Ketik materi baru lalu tekan Enter atau tombol Tambah..."
                    className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempNewMateriInput.trim()) {
                        const current = editingElementData.lingkupMateri || [];
                        setEditingElementData({
                          ...editingElementData,
                          lingkupMateri: [...current, tempNewMateriInput.trim()]
                        });
                        setTempNewMateriInput('');
                      }
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    + Tambah
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(editingElementData.lingkupMateri || []).map((materi, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs"
                    >
                      <span>{materi}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = (editingElementData.lingkupMateri || []).filter((_, i) => i !== idx);
                          setEditingElementData({ ...editingElementData, lingkupMateri: filtered });
                        }}
                        className="text-emerald-600 hover:text-rose-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {(!editingElementData.lingkupMateri || editingElementData.lingkupMateri.length === 0) && (
                    <span className="text-[11px] text-slate-400 italic">Belum ada materi pokok.</span>
                  )}
                </div>
              </div>

              {/* Contoh Formulasi TP Turunan Editor */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  Contoh Tujuan Pembelajaran (TP) Turunan
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempNewTpInput}
                    onChange={(e) => setTempNewTpInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tempNewTpInput.trim()) {
                          const current = editingElementData.contohTp || [];
                          setEditingElementData({
                            ...editingElementData,
                            contohTp: [...current, tempNewTpInput.trim()]
                          });
                          setTempNewTpInput('');
                        }
                      }
                    }}
                    placeholder="Ketik contoh rumusan TP lalu tekan Enter..."
                    className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempNewTpInput.trim()) {
                        const current = editingElementData.contohTp || [];
                        setEditingElementData({
                          ...editingElementData,
                          contohTp: [...current, tempNewTpInput.trim()]
                        });
                        setTempNewTpInput('');
                      }
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    + Tambah TP
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  {(editingElementData.contohTp || []).map((tp, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                    >
                      <span className="flex-1 leading-relaxed">
                        <strong className="text-emerald-700 mr-1.5">{idx + 1}.</strong> {tp}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = (editingElementData.contohTp || []).filter((_, i) => i !== idx);
                          setEditingElementData({ ...editingElementData, contohTp: filtered });
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!editingElementData.contohTp || editingElementData.contohTp.length === 0) && (
                    <span className="text-[11px] text-slate-400 italic block">Belum ada contoh TP turunan.</span>
                  )}
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingElement(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveElement}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Elemen</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Capaian Pembelajaran & ATP PJOK"
        subtitle={`Fase ${activeFase.phaseName} (${activeFase.grades}) • Elemen ${activeElement.name}`}
        tabs={getCpPrompts(activeFase.phaseName, activeElement.name, activeElement.description)}
        jsonData={{
          fase: activeFase,
          elemen: activeElement,
          atpHasil: generatedAtp,
          tanggalEkspor: new Date().toISOString()
        }}
        jsonFilename={`CP_PJOK_${activeFase.id}_${activeElement.name.replace(/\s+/g, '_')}`}
      />
    </div>
  );
}
