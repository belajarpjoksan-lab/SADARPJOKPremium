import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Sliders, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  Info,
  User,
  School,
  Clock,
  Layout,
  HelpCircle,
  Lightbulb,
  CornerDownRight,
  Compass,
  Smile,
  Flame,
  CheckSquare
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { copyAndOpenGoogleDocs, downloadDocFile, downloadJsonFile } from '../lib/exportUtils';
import { downloadElementAsPdf, downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getSlideMateriPrompts } from '../utils/aiPromptGenerators';
import SibiUnitSelectorBar from './SibiUnitSelectorBar';

// Types for Materi Ajar
export interface MateriPanel {
  judulPanel: string;
  icon: string;
  isiPenjelasan: string[];
  ilustrasiPrompt: string;
  tipsMemahami: string;
}

export interface MateriAjarData {
  identitas: {
    mataPelajaran: string;
    kelas: string;
    topikMateri: string;
    guruPenyusun: string;
    gayaDesain: string;
    tanggalDokumen: string;
    sekolah: string;
    alokasiWaktu: string;
  };
  judulMenarik: string;
  subJudul: string;
  pengantarKarakter: {
    namaKarakter: string;
    pesanBalon: string;
    deskripsiVisual: string;
  };
  mindmap: {
    ideUtama: string;
    cabangCabang: string[];
  };
  materiUtama: MateriPanel[];
  penutupDanTips: {
    judul: string;
    isiTips: string[];
    pesanMotivasi: string;
  };
  ujiPemahaman: {
    pertanyaan: string[];
    miniChecklist: string[];
  };
}

export default function MateriAjarView() {
  const [mataPelajaran, setMataPelajaran] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan');
  const [kelas, setKelas] = useState('4');
  const [sekolah, setSekolah] = useState('SD Negeri Kalimantong');
  const [alokasiWaktu, setAlokasiWaktu] = useState('2 x 35 Menit');
  const [topikMateri, setTopikMateri] = useState('Kombinasi Pola Gerak Dasar Lokomotor, Non-Lokomotor, dan Manipulatif');
  const [guruPenyusun, setGuruPenyusun] = useState('Guru PJOK Premium');
  const [selectedInfoStyle, setSelectedInfoStyle] = useState<'info_v1' | 'info_v2' | 'info_v3' | 'info_v4'>('info_v1');
  const [rawText, setRawText] = useState(
    "Gerak dasar lokomotor adalah gerakan berpindah tempat, di mana bagian tubuh tertentu bergerak atau berpindah tempat. Contohnya berjalan, berlari, melompat, dan meloncat.\n\n" +
    "Gerak non-lokomotor adalah gerakan yang dilakukan di tempat tanpa adanya perpindahan tempat. Contohnya menekuk lutut, memutar sendi, mengayunkan lengan, dan membungkuk.\n\n" +
    "Gerak manipulatif adalah gerakan yang melibatkan penguasaan pada sebuah objek atau alat. Contohnya melempar bola, menangkap bola, menendang bola, dan memukul shuttlecock."
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [materiResult, setMateriResult] = useState<MateriAjarData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleGenerateMateri = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    // Validation
    if (!mataPelajaran.trim()) {
      setValidationError('Mata Pelajaran wajib diisi.');
      return;
    }
    if (!topikMateri.trim()) {
      setValidationError('Topik / Materi Pembelajaran wajib diisi.');
      return;
    }
    if (!guruPenyusun.trim()) {
      setValidationError('Guru Penyusun wajib diisi.');
      return;
    }
    if (!rawText.trim()) {
      setValidationError('Rangkuman Materi Ajar wajib diisi.');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-lkpd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: selectedInfoStyle,
          mataPelajaran,
          kelas,
          topikMateri,
          guruPenyusun,
          sekolah,
          alokasiWaktu,
          rawText
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal membuat materi ajar dari AI.');
      }

      const data = await response.json();
      
      // Map to local structure if needed
      if (!data.identitas) {
        data.identitas = {
          mataPelajaran,
          kelas,
          topikMateri,
          guruPenyusun,
          sekolah,
          alokasiWaktu,
          gayaDesain: selectedInfoStyle,
          tanggalDokumen: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        };
      }
      
      // Make sure elements exist so render doesn't crash
      if (!data.judulMenarik) data.judulMenarik = topikMateri;
      if (!data.subJudul) data.subJudul = `Pembelajaran Kelas ${kelas} SD`;
      if (!data.pengantarKarakter) {
        data.pengantarKarakter = {
          namaKarakter: "Kak Bayu",
          pesanBalon: "Mari kita pelajari materi hari ini dengan gembira dan penuh semangat!",
          deskripsiVisual: "Karakter kartun anak berkacamata membawa buku olahraga."
        };
      }
      if (!data.mindmap) {
        data.mindmap = {
          ideUtama: topikMateri,
          cabangCabang: ["Pengertian Dasar", "Contoh Nyata", "Latihan Praktik"]
        };
      }
      if (!data.materiUtama || !Array.isArray(data.materiUtama)) {
        // Fallback mapping if sections structure is returned
        if (data.sections && Array.isArray(data.sections)) {
          data.materiUtama = data.sections.map((sec: any) => ({
            judulPanel: sec.sectionTitle || "Panel Materi",
            icon: sec.icon || "📌",
            isiPenjelasan: sec.contentBlocks?.map((block: any) => block.exactText || block.questionData?.questionText).filter(Boolean) || ["Informasi Penting"],
            ilustrasiPrompt: sec.visualDesignTip || "Ilustrasi poster visual",
            tipsMemahami: "Fokus pada gerakan dasar secara berulang."
          }));
        } else {
          data.materiUtama = [
            {
              judulPanel: "Pengenalan Konsep",
              icon: "💡",
              isiPenjelasan: [rawText],
              ilustrasiPrompt: "Diorama 3D konsep materi",
              tipsMemahami: "Bacalah secara saksama bagian kata kunci utama."
            }
          ];
        }
      }
      if (!data.penutupDanTips) {
        data.penutupDanTips = {
          judul: "Tips Praktis Pembelajaran",
          isiTips: ["Lakukan pemanasan sebelum praktik.", "Minta bimbingan guru jika kesulitan."],
          pesanMotivasi: data.penutupMotivasi || "Selamat belajar! Teruslah berlatih secara konsisten."
        };
      }
      if (!data.ujiPemahaman) {
        data.ujiPemahaman = {
          pertanyaan: ["Sebutkan pengertian utama dari materi hari ini!", "Berikan 2 contoh konkret penerapan materi ini!"],
          miniChecklist: ["Saya sudah membaca rangkuman", "Saya memahami seluruh materi", "Saya siap mempraktikkan"]
        };
      }

      setMateriResult(data);
    } catch (err: any) {
      setApiError(err.message || 'Gagal memproses pembuatan materi ajar.');
    } finally {
      setIsGenerating(false);
    }
  };

  // HTML Word formatting utility for Materi Ajar
  const generateMateriDocHtml = (data: MateriAjarData): string => {
    const panelsHtml = data.materiUtama.map((panel, idx) => `
      <div style="margin-bottom: 25px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; page-break-inside: avoid;">
        <h3 style="font-size: 12pt; font-weight: bold; color: #0f766e; margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          ${panel.icon} PANEL ${idx + 1}: ${panel.judulPanel}
        </h3>
        <ul style="font-size: 10pt; color: #1e293b; line-height: 1.5; padding-left: 20px; margin-top: 5px;">
          ${panel.isiPenjelasan.map(p => `<li style="margin-bottom: 6px;">${p}</li>`).join('')}
        </ul>
        <div style="background-color: #f0fdfa; border-left: 3px solid #0d9488; padding: 8px; font-size: 9pt; color: #0f766e; font-style: italic; margin-top: 10px;">
          <strong>Tips Memahami:</strong> ${panel.tipsMemahami}
        </div>
        <div style="font-size: 8.5pt; color: #64748b; margin-top: 8px;">
          <em>Visual Suggestion:</em> ${panel.ilustrasiPrompt}
        </div>
      </div>
    `).join('\n');

    const mindmapHtml = `
      <div style="margin-bottom: 25px; background-color: #f8fafc; border: 1px dashed #0d9488; border-radius: 8px; padding: 15px; text-align: center; page-break-inside: avoid;">
        <h3 style="font-size: 11pt; font-weight: bold; color: #0d9488; margin-top: 0; margin-bottom: 10px; text-transform: uppercase;">
          📌 PETA KONSEP UTAMA
        </h3>
        <strong style="font-size: 12pt; color: #1e293b; background-color: #e2e8f0; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-bottom: 15px;">
          ${data.mindmap.ideUtama}
        </strong>
        <table style="width: 100%; border-collapse: collapse; border: none; margin-top: 10px;">
          <tr>
            ${data.mindmap.cabangCabang.map(cabang => `
              <td style="border: none; padding: 5px; width: ${100 / data.mindmap.cabangCabang.length}%;">
                <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; font-size: 9.5pt; font-weight: bold; color: #334155;">
                  🌱 ${cabang}
                </div>
              </td>
            `).join('')}
          </tr>
        </table>
      </div>
    `;

    const checklistHtml = data.ujiPemahaman.miniChecklist.map(item => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px; font-size: 9.5pt; color: #1e293b; border: none; width: 30px; text-align: center;">[  ]</td>
        <td style="padding: 6px; font-size: 9.5pt; color: #1e293b; border: none;">${item}</td>
      </tr>
    `).join('\n');

    const questionsHtml = data.ujiPemahaman.pertanyaan.map((q, idx) => `
      <div style="margin-bottom: 12px;">
        <p style="font-size: 10pt; font-weight: bold; color: #1e293b; margin-bottom: 4px;">${idx + 1}. ${q}</p>
        <div style="border-bottom: 1px dashed #cbd5e1; height: 35px; margin-top: 5px;">&nbsp;</div>
      </div>
    `).join('\n');

    const content = `
      <div style="border: 4px double #0d9488; border-radius: 10px; padding: 25px; background-color: #ffffff; font-family: 'Arial', sans-serif;">
        
        <div data-f4-section="Bagian 1: Pengantar, Identitas & Peta Konsep Materi">
        <!-- HEADER POSTER -->
        <table data-f4-kop="true" style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 20px;">
          <tr>
            <td style="border: none; padding: 0; vertical-align: middle;">
              <span style="font-size: 9pt; font-weight: bold; color: #0d9488; text-transform: uppercase; letter-spacing: 1px;">POSTER INFOGRAFIS EDUKATIF</span>
              <h1 style="text-align: left; margin: 2px 0 0 0; font-size: 20pt; color: #0f766e; border: none; padding: 0; text-transform: uppercase; font-family: 'Arial Black', sans-serif;">
                ${data.judulMenarik}
              </h1>
              <p style="font-size: 11pt; font-weight: bold; color: #0d9488; margin: 4px 0 0 0;">
                ${data.subJudul}
              </p>
            </td>
            <td style="border: none; padding: 0; text-align: right; vertical-align: middle; width: 120px;">
              <div style="border: 2px solid #0d9488; border-radius: 8px; padding: 8px; text-align: center; background-color: #f0fdfa;">
                <span style="font-size: 8.5pt; font-weight: bold; color: #0d9488; text-transform: uppercase;">DESAIN F4</span><br/>
                <strong style="font-size: 11pt; color: #0f766e;">PORTRAIT</strong>
              </div>
            </td>
          </tr>
        </table>

        <!-- IDENTITAS PANEL -->
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 25px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; border: none;">
            <tr>
              <td style="padding: 4px; border: none;" width="50%"><strong>Mata Pelajaran:</strong> ${data.identitas.mataPelajaran}</td>
              <td style="padding: 4px; border: none;" width="50%"><strong>Sekolah:</strong> ${data.identitas.sekolah || 'SD Negeri Kalimantong'}</td>
            </tr>
            <tr>
              <td style="padding: 4px; border: none;"><strong>Kelas:</strong> Kelas ${data.identitas.kelas}</td>
              <td style="padding: 4px; border: none;"><strong>Materi Pokok:</strong> ${data.identitas.topikMateri}</td>
            </tr>
            <tr>
              <td style="padding: 4px; border: none;"><strong>Guru Pengampu:</strong> ${data.identitas.guruPenyusun || 'Guru PJOK'}</td>
              <td style="padding: 4px; border: none;"><strong>Alokasi Waktu:</strong> ${data.identitas.alokasiWaktu}</td>
            </tr>
          </table>
        </div>

        <!-- CHARACTER BALLOON -->
        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 25px; background-color: #fdf2f8; border-radius: 8px; padding: 12px; page-break-inside: avoid;">
          <tr>
            <td style="border: none; padding: 10px; width: 60px; text-align: center; vertical-align: middle;">
              <span style="font-size: 28pt;">🙋‍♂️</span>
            </td>
            <td style="border: none; padding: 10px; vertical-align: middle;">
              <strong style="font-size: 10pt; color: #db2777; text-transform: uppercase;">Pesan dari ${data.pengantarKarakter.namaKarakter}:</strong>
              <p style="font-size: 10.5pt; color: #831843; font-style: italic; margin: 4px 0 0 0; line-height: 1.4;">
                "${data.pengantarKarakter.pesanBalon}"
              </p>
            </td>
          </tr>
        </table>

        <!-- MIND MAP -->
        ${mindmapHtml}
        </div>

        <div data-f4-section="Bagian 2: Panel Materi Pokok & Langkah Pembelajaran Visual">
        <!-- MAIN PANELS -->
        ${panelsHtml}
        </div>

        <div data-f4-section="Bagian 3: Tantangan Pemahaman Mandiri & Tips Motivasi">
        <!-- CHECKS & QUESTIONS (UJI PEMAHAMAN) -->
        <div style="margin-top: 30px; background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 15px; page-break-inside: avoid;">
          <h3 style="font-size: 11pt; font-weight: bold; color: #78350f; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #e7e5e4; padding-bottom: 4px; text-transform: uppercase;">
            📝 TANTANGAN PEMAHAMAN MANDIRI
          </h3>
          
          <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 15px;">
            <tbody>
              ${checklistHtml}
            </tbody>
          </table>

          <div style="margin-top: 15px;">
            ${questionsHtml}
          </div>
        </div>

        <!-- TIPS DAN MOTIVASI FOOTER -->
        <div style="margin-top: 25px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 15px; page-break-inside: avoid;">
          <h4 style="font-size: 10.5pt; font-weight: bold; color: #0d9488; margin-top: 0; margin-bottom: 6px;">
            🌟 ${data.penutupDanTips.judul} 🌟
          </h4>
          <ul style="font-size: 9pt; color: #475569; display: inline-block; text-align: left; padding-left: 20px; margin-top: 0; margin-bottom: 12px;">
            ${data.penutupDanTips.isiTips.map(tip => `<li>${tip}</li>`).join('')}
          </ul>
          <p style="font-size: 11pt; font-weight: bold; color: #0f766e; margin-bottom: 2px;">
            ✨ ${data.penutupDanTips.pesanMotivasi} ✨
          </p>
        </div>
        </div>

      </div>
    `;

    return content;
  };

  const handleCopyAndGoToDocs = async () => {
    if (!materiResult) return;
    setCopySuccess(false);
    const contentHtml = generateMateriDocHtml(materiResult);
    const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>Materi_Ajar</title></head>
<body>${contentHtml}</body></html>`;
    const success = await copyAndOpenGoogleDocs(docHtml);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const handleDownloadDoc = () => {
    if (!materiResult) return;
    const contentHtml = generateMateriDocHtml(materiResult);
    const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>Materi_Ajar_F4</title>
<style>@page { size: 215mm 330mm; margin: 12mm 15mm; } @page Section1 { size: 609.45pt 935.43pt; margin: 36pt 42.5pt; } div.Section1 { page: Section1; }</style>
</head>
<body><div class="Section1">${contentHtml}</div></body></html>`;
    downloadDocFile(`Materi_Ajar_F4_${topikMateri.replace(/\s+/g, '_')}_Kelas_${kelas}.doc`, docHtml);
  };

  const handleDownloadPdf = async () => {
    if (!materiResult || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const fileName = `Materi_Ajar_F4_${topikMateri.replace(/\s+/g, '_')}_Kelas_${kelas}.pdf`;
      const contentHtml = generateMateriDocHtml(materiResult);
      await downloadHtmlAsPdf(contentHtml, fileName, 'portrait');
    } catch (err) {
      console.error('Error generating Materi Ajar F4 PDF:', err);
      if (materiResult) {
        printHtmlDocument(generateMateriDocHtml(materiResult), `Materi Ajar F4 - ${topikMateri}`, 'portrait');
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!materiResult) return;
    printHtmlDocument(generateMateriDocHtml(materiResult), `Materi Ajar F4 - ${topikMateri}`, 'portrait');
  };

  const handleDownloadImage = async () => {
    if (!canvasRef.current) return;
    setIsCapturing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imageUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageUri;
      link.download = `Materi_Ajar_Infografis_${topikMateri.replace(/\s+/g, '_')}_Kelas_${kelas}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to capture canvas:', err);
      alert('Terjadi kesalahan saat mengambil screenshot infografis.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Theme palettes based on chosen style
  const getStyleThemeClasses = (styleKey: typeof selectedInfoStyle) => {
    switch (styleKey) {
      case 'info_v1': // Pixar 3D
        return {
          wrapper: 'bg-gradient-to-br from-emerald-500 to-teal-700 p-8 rounded-2xl shadow-xl border-4 border-white text-slate-800',
          card: 'bg-white/95 rounded-2xl p-5 border border-emerald-100 shadow-md backdrop-blur-xs',
          headerBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 rounded-2xl shadow-sm text-center',
          accentBadge: 'bg-amber-100 text-amber-800 border border-amber-200',
          speechBubble: 'bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 shadow-xs relative',
          bubbleEmoji: '🙋‍♂️',
          panelHeader: 'text-sm font-extrabold text-teal-800 border-b pb-1.5 flex items-center gap-2',
          panelTipsBg: 'bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-2.5 rounded-r-lg mt-3 text-[11px]',
          footerBg: 'bg-slate-50 border border-slate-100 p-5 rounded-2xl text-center',
          mindmapNode: 'bg-teal-50 border border-teal-200 rounded-xl p-3 text-center shadow-xs font-bold text-teal-800 text-xs'
        };
      case 'info_v2': // Cute 2D Cartoon
        return {
          wrapper: 'bg-gradient-to-br from-sky-400 to-cyan-600 p-8 rounded-2xl shadow-xl border-4 border-white text-slate-800',
          card: 'bg-white/95 rounded-2xl p-5 border-2 border-dashed border-cyan-200 shadow-sm',
          headerBg: 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white p-5 rounded-2xl text-center border-b-4 border-cyan-600',
          accentBadge: 'bg-sky-100 text-sky-800 border border-sky-200',
          speechBubble: 'bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-xl p-4 relative',
          bubbleEmoji: '🐱',
          panelHeader: 'text-sm font-bold text-sky-700 border-b-2 border-dashed border-sky-100 pb-1.5 flex items-center gap-2',
          panelTipsBg: 'bg-sky-50 border border-sky-100 text-sky-800 p-2.5 rounded-lg mt-3 text-[11px]',
          footerBg: 'bg-amber-50/50 border border-amber-100 p-5 rounded-xl text-center',
          mindmapNode: 'bg-amber-50 border-2 border-amber-200 rounded-lg p-3 text-center shadow-xs font-semibold text-amber-900 text-xs'
        };
      case 'info_v3': // Modern Clean Gen Z
        return {
          wrapper: 'bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-8 rounded-2xl shadow-xl border border-slate-800 text-slate-200',
          card: 'bg-slate-900/80 rounded-xl p-5 border border-indigo-500/20 shadow-lg text-slate-300',
          headerBg: 'bg-gradient-to-r from-indigo-700 to-violet-700 text-white p-5 rounded-xl text-center shadow-md',
          accentBadge: 'bg-indigo-950 text-indigo-300 border border-indigo-500/30',
          speechBubble: 'bg-slate-850 border border-indigo-500/30 text-indigo-100 rounded-xl p-4 shadow-md relative',
          bubbleEmoji: '⚡',
          panelHeader: 'text-sm font-semibold tracking-wide text-indigo-400 border-b border-indigo-500/20 pb-1.5 flex items-center gap-2 uppercase',
          panelTipsBg: 'bg-indigo-950/40 border-l-2 border-indigo-500 text-indigo-300 p-2.5 rounded-r-lg mt-3 text-[11px]',
          footerBg: 'bg-slate-950 border border-slate-900 p-5 rounded-xl text-center',
          mindmapNode: 'bg-indigo-950 border border-indigo-500/30 rounded-xl p-3 text-center shadow-md font-bold text-indigo-300 text-xs'
        };
      case 'info_v4': // Clay Art
        return {
          wrapper: 'bg-gradient-to-br from-rose-400 to-orange-500 p-8 rounded-2xl shadow-xl border-8 border-amber-900/10 text-amber-950',
          card: 'bg-amber-50/95 rounded-3xl p-5 border-4 border-amber-950/10 shadow-inner',
          headerBg: 'bg-gradient-to-r from-rose-500 to-orange-500 text-white p-6 rounded-3xl text-center border-4 border-amber-950/10 shadow-md',
          accentBadge: 'bg-orange-100 text-orange-900 border border-orange-200 rounded-full px-3 py-1',
          speechBubble: 'bg-rose-50 border-4 border-rose-900/10 text-rose-950 rounded-2xl p-4 shadow-sm relative',
          bubbleEmoji: '🧸',
          panelHeader: 'text-sm font-extrabold text-rose-900 border-b-4 border-rose-950/10 pb-1.5 flex items-center gap-2',
          panelTipsBg: 'bg-orange-100/50 border-4 border-orange-950/10 text-orange-900 p-2.5 rounded-2xl mt-3 text-[11px] font-semibold',
          footerBg: 'bg-amber-100 border-4 border-amber-950/10 p-5 rounded-3xl text-center',
          mindmapNode: 'bg-rose-50 border-2 border-rose-200 rounded-xl p-3 text-center shadow-xs font-extrabold text-rose-900 text-xs'
        };
    }
  };

  const theme = getStyleThemeClasses(selectedInfoStyle);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="materi-ajar-ai-generator">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
          <BookOpen className="w-8 h-8 text-emerald-200" />
          Rancang Materi Ajar & Infografis AI
        </h2>
        <p className="mt-2 text-emerald-100 max-w-3xl text-sm sm:text-base leading-relaxed">
          Ubah ringkasan materi pelajaran Anda menjadi draf poster infografis berukuran A4 portrait siap cetak dengan ilustrasi panel 3D, peta konsep, dan balon dialog komunikatif menggunakan AI. Sempurna untuk diletakkan di papan tulis, mading, atau dibagikan digital ke siswa Anda!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              Parameter Materi Ajar
            </h3>

            <form onSubmit={handleGenerateMateri} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={mataPelajaran}
                  onChange={(e) => setMataPelajaran(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                  >
                    <option value="1">Kelas 1 (Fase A)</option>
                    <option value="2">Kelas 2 (Fase A)</option>
                    <option value="3">Kelas 3 (Fase B)</option>
                    <option value="4">Kelas 4 (Fase B)</option>
                    <option value="5">Kelas 5 (Fase C)</option>
                    <option value="6">Kelas 6 (Fase C)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alokasi Waktu
                  </label>
                  <input
                    type="text"
                    value={alokasiWaktu}
                    onChange={(e) => setAlokasiWaktu(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                    placeholder="2 x 35 Menit"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sekolah / Instansi
                </label>
                <input
                  type="text"
                  value={sekolah}
                  onChange={(e) => setSekolah(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                  placeholder="SD Negeri Kalimantong"
                />
              </div>

              <SibiUnitSelectorBar
                grade={kelas}
                selectedMateri={topikMateri}
                onSelectUnit={(unit) => {
                  setTopikMateri(`${unit.unitCode}: ${unit.unitTitle} (${unit.pokokMateri})`);
                  setAlokasiWaktu(`${unit.alokasiJp} (${unit.alokasiPertemuan})`);
                  setRawText(
                    `[${unit.unitCode} - ${unit.unitTitle}]\n` +
                    `Pokok Materi: ${unit.pokokMateri}\n` +
                    `Elemen CP: ${unit.elemenCp}\n\n` +
                    `Pemanasan Permainan Kecil (Buku SIBI):\n- ${unit.pemanasanPermainan}\n\n` +
                    `Tahapan Aktivitas Pembelajaran (Buku Panduan Guru PJOK SIBI):\n- ${unit.aktivitasPembelajaran.join('\n- ')}\n\n` +
                    `Kata Kunci: ${unit.kataKunci.join(', ')}\n` +
                    `Sumber Resmi: ${unit.sumberBukuSibi}`
                  );
                }}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Topik / Materi Pembelajaran (SIBI) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={topikMateri}
                  onChange={(e) => setTopikMateri(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guru Penyusun <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={guruPenyusun}
                  onChange={(e) => setGuruPenyusun(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Gaya Penyajian Infografis <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedInfoStyle}
                  onChange={(e) => setSelectedInfoStyle(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                  required
                >
                  <option value="info_v1">Versi 1: 3D Cartoon Animation (Pixar Style)</option>
                  <option value="info_v2">Versi 2: Cute 2D Cartoon Style (Poster Edukatif)</option>
                  <option value="info_v3">Versi 3: Modern Clean Gen Z (100% Verbatim & Mindmap)</option>
                  <option value="info_v4">Versi 4: 3D Clay Art Style (Plastisin Handmade)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tempel Draf Rangkuman Materi Ajar <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={8}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white font-mono leading-relaxed"
                  placeholder="Masukkan atau tempel draf rangkuman materi di sini..."
                  required
                />
              </div>

              {validationError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2.5 rounded-lg text-xs font-semibold">
                  ⚠️ {validationError}
                </div>
              )}

              {apiError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2.5 rounded-lg text-xs leading-relaxed">
                  ⚠️ <strong>Gagal:</strong> {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Mendesain Poster AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Rancang Poster dengan AI</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Interactive Presentation Canvas */}
        <div className="lg:col-span-8 space-y-6">
          {isGenerating ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[500px]">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-emerald-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Menyusun Layout Poster Infografis</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                Gemini AI sedang mengonseptualisasikan visual {selectedInfoStyle === 'info_v1' ? '3D Cartoon Pixar' : selectedInfoStyle === 'info_v2' ? 'Cute 2D Cartoon' : selectedInfoStyle === 'info_v3' ? 'Modern Clean Gen Z' : '3D Clay Art'}, memetakan peta konsep terstruktur, menuangkan balon dialog karakter, dan memilah poin ringkasan draf Anda agar pas dalam format A4 Portrait!
              </p>
            </div>
          ) : materiResult ? (
            <div className="space-y-4">
              {/* Action Bar */}
              <div className="bg-white rounded-xl shadow-xs p-4 border border-slate-100 flex flex-wrap gap-2 justify-between items-center no-print">
                <span className="text-xs font-bold text-slate-500">Rancangan Siap Diekspor:</span>
                <div className="flex gap-2 items-center flex-wrap">
                  <ExportJsonPromptAiButtons
                    variant="compact"
                    onExportJson={() => {
                      downloadJsonFile(`Materi_Ajar_${topikMateri.replace(/\s+/g, '_')}_Kelas_${kelas}`, {
                        mataPelajaran,
                        kelas,
                        sekolah,
                        alokasiWaktu,
                        topikMateri,
                        guruPenyusun,
                        gayaDesain: selectedInfoStyle,
                        rangkumanRaw: rawText,
                        hasilMateriAjar: materiResult,
                        tanggalEkspor: new Date().toISOString()
                      });
                    }}
                    onOpenPromptAi={() => setShowPromptModal(true)}
                  />

                  <button
                    onClick={handleCopyAndGoToDocs}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin & Buka Google Docs</span>
                  </button>
                  <button
                    onClick={handleDownloadDoc}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-200 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Word</span>
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isExportingPdf}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingPdf ? 'Memproses PDF...' : 'PDF (F4)'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-200 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>Cetak F4</span>
                  </button>
                  <button
                    onClick={handleDownloadImage}
                    disabled={isCapturing}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors border border-indigo-100 cursor-pointer"
                  >
                    {isCapturing ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-indigo-700" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Mengambil Gambar...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Unduh PNG</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tips Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed flex flex-col gap-2 no-print">
                <div className="flex gap-2">
                  <ExternalLink className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <strong>Tips Ekspor Google Docs:</strong> Tombol <strong>"Salin & Buka Google Docs"</strong> akan menyalin isi dokumen dalam format teks-berwarna dan tabel rapi beresolusi tinggi langsung ke clipboard Anda dan membuka Google Dokumen baru secara otomatis. Anda hanya perlu menekan tombol <strong>Ctrl+V / Cmd+V</strong> di tab baru tersebut untuk menempelkan hasil rancangan secara sempurna tanpa merusak tata letak asli!
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-amber-200">
                  <Layout className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <strong>Tips Desain Visual:</strong> Tombol <strong>"Unduh PNG"</strong> akan mengambil screenshot beresolusi tinggi langsung dari canvas A4 di bawah ini agar Anda bisa langsung mencetaknya dalam format grafis yang menawan dan ramah Gen-Z!
                  </div>
                </div>
              </div>

              {/* The Live A4 Canvas Layout View */}
              <div className="border border-slate-200 rounded-2xl shadow-xl bg-slate-100 overflow-x-auto p-4 flex justify-center">
                <div 
                  ref={canvasRef}
                  className={`${theme.wrapper} w-[800px] min-h-[1130px] flex flex-col gap-5 text-left bg-white font-sans`}
                  style={{ boxSizing: 'border-box' }}
                >
                  {/* Visual Header */}
                  <div className={theme.headerBg}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${theme.accentBadge}`}>
                        Kurikulum Merdeka • Kelas {materiResult.identitas.kelas}
                      </span>
                      <span className="text-[10px] font-bold text-white/90">A4 PORTRAIT POSTER</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">
                      {materiResult.judulMenarik}
                    </h2>
                    <p className="text-xs text-white/90 mt-1 font-medium">{materiResult.subJudul}</p>
                  </div>

                  {/* Identitas Card Grid */}
                  <div className={`${theme.card} grid grid-cols-2 gap-4 text-xs`}>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-500 font-medium">Mata Pelajaran:</span>
                      </div>
                      <span className="font-extrabold block pl-5 text-slate-800">{materiResult.identitas.mataPelajaran}</span>

                      <div className="flex items-center gap-1.5 pt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-500 font-medium">Alokasi Waktu:</span>
                      </div>
                      <span className="font-extrabold block pl-5 text-slate-800">{materiResult.identitas.alokasiWaktu || '2 x 35 Menit'}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-500 font-medium">Sekolah / Instansi:</span>
                      </div>
                      <span className="font-extrabold block pl-5 text-slate-800">{materiResult.identitas.sekolah || 'SD Negeri Kalimantong'}</span>

                      <div className="flex items-center gap-1.5 pt-1">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-500 font-medium">Guru Pengampu:</span>
                      </div>
                      <span className="font-extrabold block pl-5 text-slate-800">{materiResult.identitas.guruPenyusun || 'Guru PJOK'}</span>
                    </div>
                  </div>

                  {/* Character Welcome speech balloon */}
                  <div className={theme.speechBubble}>
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm border border-slate-100 shrink-0">
                        {theme.bubbleEmoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs font-black uppercase text-slate-700">Panduan {materiResult.pengantarKarakter.namaKarakter}:</strong>
                          <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold uppercase">{selectedInfoStyle} Mode</span>
                        </div>
                        <p className="text-xs font-semibold leading-relaxed mt-1 text-slate-800">
                          "{materiResult.pengantarKarakter.pesanBalon}"
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium mt-1 leading-none italic">
                          💡 Visual: {materiResult.pengantarKarakter.deskripsiVisual}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mind Map / Peta Konsep */}
                  <div className={`${theme.card}`}>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                      <Lightbulb className="w-4 h-4 text-amber-500" /> Peta Konsep Utama (Mind Map)
                    </h3>
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs text-center border-2 border-white max-w-sm">
                        {materiResult.mindmap.ideUtama}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 w-full mt-1">
                        {materiResult.mindmap.cabangCabang.map((cabang, cIdx) => (
                          <div key={cIdx} className={theme.mindmapNode}>
                            🌱 {cabang}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Content Panels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {materiResult.materiUtama.map((panel, pIdx) => (
                      <div key={pIdx} className={`${theme.card} flex flex-col justify-between h-full`}>
                        <div className="space-y-2">
                          <h4 className={theme.panelHeader}>
                            <span className="text-base shrink-0">{panel.icon || '📌'}</span>
                            <span>{panel.judulPanel}</span>
                          </h4>
                          
                          <ul className="text-xs leading-relaxed text-slate-700 space-y-2.5 pl-1.5">
                            {panel.isiPenjelasan.map((pText, piIdx) => (
                              <li key={piIdx} className="flex gap-2">
                                <span className="text-emerald-600 font-extrabold shrink-0">•</span>
                                <span className="font-semibold text-slate-700">{pText}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          {panel.tipsMemahami && (
                            <div className={theme.panelTipsBg}>
                              <strong>Tips Paham:</strong> {panel.tipsMemahami}
                            </div>
                          )}
                          <p className="text-[9px] text-slate-400 font-medium italic mt-2 leading-none">
                            🎨 Diorama: {panel.ilustrasiPrompt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Self-Reflection & Questions (Uji Pemahaman) */}
                  <div className={`${theme.card} space-y-3`}>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-indigo-500" /> Tantangan Pemahaman Mandiri
                    </h4>

                    {/* Checklists */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-2 border-b border-slate-100">
                      {materiResult.ujiPemahaman.miniChecklist.map((item, chIdx) => (
                        <label key={chIdx} className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200/60 rounded-lg p-2 hover:bg-slate-100 transition-colors">
                          <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold text-slate-600">{item}</span>
                        </label>
                      ))}
                    </div>

                    {/* Question Prompts */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pertanyaan Esai Nalar Kritis:</p>
                      {materiResult.ujiPemahaman.pertanyaan.map((qText, qIdx) => (
                        <div key={qIdx} className="space-y-1">
                          <p className="text-xs font-extrabold text-slate-700">{qIdx + 1}. {qText}</p>
                          <div className="border-b-2 border-dashed border-slate-200 h-8"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Banner */}
                  <div className={theme.footerBg}>
                    <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">
                      ⭐ {materiResult.penutupDanTips.judul} ⭐
                    </h4>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 justify-center mt-2.5 mb-3 text-[11px] font-semibold text-slate-500">
                      {materiResult.penutupDanTips.isiTips.map((tip, tIdx) => (
                        <span key={tIdx} className="flex items-center gap-1">
                          <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />
                          {tip}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs sm:text-sm font-black text-emerald-700 tracking-tight">
                      ✨ {materiResult.penutupDanTips.pesanMotivasi} ✨
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono mt-1">&copy; SADAR PJOK PREMIUM • Dibuat Otomatis dengan Gemini AI</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[500px]">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Menunggu Desain Anda</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                Silakan isi formulir parameter di kolom kiri, lalu klik <strong>"Rancang Poster dengan AI"</strong> untuk menghasilkan draf poster infografis edukatif premium siap cetak.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Materi Ajar Infografis PJOK"
        subtitle={`${topikMateri} • Kelas ${kelas}`}
        tabs={getSlideMateriPrompts(topikMateri)}
        jsonData={{
          mataPelajaran,
          kelas,
          sekolah,
          alokasiWaktu,
          topikMateri,
          guruPenyusun,
          gayaDesain: selectedInfoStyle,
          rangkumanRaw: rawText,
          hasilMateriAjar: materiResult,
          tanggalEkspor: new Date().toISOString()
        }}
        jsonFilename={`Materi_Ajar_${topikMateri.replace(/\s+/g, '_')}_Kelas_${kelas}`}
      />
    </div>
  );
}
