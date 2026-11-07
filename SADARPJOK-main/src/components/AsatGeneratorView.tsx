import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  Copy,
  Check,
  Search,
  Filter,
  School,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Layers,
  HelpCircle,
  Eye,
  ListOrdered,
  FileCheck,
  ChevronRight,
  Info,
  GraduationCap
} from 'lucide-react';
import { AsatData, AsatKisiKisiItem } from '../types';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import AiPromptModal from './AiPromptModal';
import { getAsatPrompts } from '../utils/aiPromptGenerators';
import { downloadJsonFile, downloadDocFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';

export const AsatGeneratorView: React.FC = () => {
  // --- Form Inputs State ---
  const [mataPelajaran, setMataPelajaran] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)');
  const [kelas, setKelas] = useState('VII (Tujuh)');
  const [fase, setFase] = useState('Fase D');
  const [namaSekolah, setNamaSekolah] = useState('SD Negeri Kalimantong');
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  const [alokasiWaktu, setAlokasiWaktu] = useState('90 Menit');
  const [namaPenyusun, setNamaPenyusun] = useState('Budi Santoso, S.Pd., Gr.');
  const [nipPenyusun, setNipPenyusun] = useState('19880315 201402 1 003');
  const [namaKepalaSekolah, setNamaKepalaSekolah] = useState('Drs. H. Ahmad Dahlan, M.Pd.');
  const [nipKepalaSekolah, setNipKepalaSekolah] = useState('19720510 199803 1 002');

  // Tujuan Pembelajaran 2 Semester
  const [tujuanSemester1, setTujuanSemester1] = useState(
    '1. Mempraktikkan variasi gerak spesifik passing bola voli\n2. Menganalisis gerak spesifik lari jarak pendek (sprint)\n3. Mempraktikkan latihan kebugaran jasmani daya tahan jantung-paru'
  );
  const [tujuanSemester2, setTujuanSemester2] = useState(
    '1. Mempraktikkan variasi gerak spesifik servis dan smash bola voli\n2. Menganalisis pola senam lantai guling depan dan lenting\n3. Mempraktikkan gaya renang dada\n4. Mengenali pertolongan pertama cedera olahraga (RICE) dan pola hidup sehat remaja'
  );

  // View & Filter State
  const [activeSubTab, setActiveSubTab] = useState<'kisi_kisi' | 'lembar_soal' | 'kunci_skor'>('kisi_kisi');
  const [filterBentukSoal, setFilterBentukSoal] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [asatData, setAsatData] = useState<AsatData | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  // Preset Handlers
  const handleApplyPreset = (level: 'SMP' | 'SD' | 'SMA') => {
    if (level === 'SMP') {
      setKelas('VII (Tujuh)');
      setFase('Fase D');
      setTujuanSemester1(
        '1. Mempraktikkan variasi gerak spesifik passing bola voli\n2. Menganalisis gerak spesifik lari jarak pendek (sprint)\n3. Mempraktikkan latihan kebugaran jasmani daya tahan jantung-paru'
      );
      setTujuanSemester2(
        '1. Mempraktikkan variasi gerak spesifik servis dan smash bola voli\n2. Menganalisis pola senam lantai guling depan dan lenting\n3. Mempraktikkan gaya renang dada\n4. Mengenali pertolongan pertama cedera olahraga (RICE) dan pola hidup sehat remaja'
      );
    } else if (level === 'SD') {
      setKelas('IV (Empat)');
      setFase('Fase B');
      setTujuanSemester1(
        '1. Mempraktikkan variasi pola gerak dasar lokomotor melempar dan menangkap bola kasti\n2. Mempraktikkan variasi pola gerak lari dan lompat pada atletik anak\n3. Mengenali bagian-bagian tubuh dan cara menjaga kebersihan diri'
      );
      setTujuanSemester2(
        '1. Mempraktikkan kombinasi gerak dasar permainan bola kecil kasti mini\n2. Mempraktikkan gerak bertumpu dan berguling senam lantai\n3. Mempraktikkan pengenalan air dan keselamatan di kolam renang\n4. Mengenali makanan bergizi seimbang dan jajanan sehat'
      );
    } else {
      setKelas('X (Sepuluh)');
      setFase('Fase E');
      setTujuanSemester1(
        '1. Mengevaluasi keterampilan gerak permainan invasi sepak bola dan bola voli\n2. Menganalisis konsep latihan peningkatan kebugaran jasmani mandiri\n3. Menerapkan nilai sportivitas dan kepemimpinan dalam aktivitas olahraga'
      );
      setTujuanSemester2(
        '1. Merancang taktik penyerangan dan pertahanan bola voli serta bulu tangkis\n2. Mengevaluasi rangkaian senam ketangkasan dan pertolongan kecelakaan air\n3. Merancang rencana pola makan sehat dan pencegahan penyakit degeneratif'
      );
    }
  };

  // Generate ASAT
  const handleGenerateAsat = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-asat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mataPelajaran,
          kelas,
          fase,
          namaSekolah,
          tahunPelajaran,
          alokasiWaktu,
          penyusun: namaPenyusun,
          nipPenyusun,
          kepalaSekolah: namaKepalaSekolah,
          nipKepalaSekolah,
          tujuanSemester1,
          tujuanSemester2
        })
      });

      if (!response.ok) {
        throw new Error('Gagal memuat generator ASAT.');
      }

      const data: AsatData = await response.json();
      setAsatData(data);
    } catch (err: any) {
      console.warn('API call failed, using client-side generated ASAT template:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    if (!asatData) {
      handleGenerateAsat();
    }
  }, []);

  // Filtered Kisi-Kisi
  const filteredKisiKisi = useMemo(() => {
    if (!asatData) return [];
    return asatData.kisiKisi.filter(item => {
      const matchBentuk = filterBentukSoal === 'all' || item.bentukSoal === filterBentukSoal;
      const matchSemester = filterSemester === 'all' || item.semesterAsal.toString() === filterSemester;
      const matchSearch = !searchQuery ||
        item.naskahSoal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ruangLingkupMateri.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.indikatorSoal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tujuanPembelajaran.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBentuk && matchSemester && matchSearch;
    });
  }, [asatData, filterBentukSoal, filterSemester, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    if (!asatData) return { total: 0, sem1: 0, sem2: 0, pg: 0, pgk: 0, jodoh: 0, isian: 0, uraian: 0 };
    const all = asatData.kisiKisi;
    return {
      total: all.length,
      sem1: all.filter(k => k.semesterAsal === 1).length,
      sem2: all.filter(k => k.semesterAsal === 2).length,
      pg: all.filter(k => k.bentukSoal === 'Pilihan Ganda').length,
      pgk: all.filter(k => k.bentukSoal === 'Pilihan Ganda Kompleks').length,
      jodoh: all.filter(k => k.bentukSoal === 'Menjodohkan').length,
      isian: all.filter(k => k.bentukSoal === 'Isian Singkat').length,
      uraian: all.filter(k => k.bentukSoal === 'Uraian').length
    };
  }, [asatData]);

  // Build Print-Ready F4 HTML for Word & PDF
  const buildAsatHtml = (): string => {
    if (!asatData) return '';

    // Build Kisi-Kisi Table HTML
    const kisiKisiRows = asatData.kisiKisi.map((k, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${k.tujuanPembelajaran}</td>
        <td><b>${k.ruangLingkupMateri}</b></td>
        <td style="text-align: center;">${k.levelKognitif}</td>
        <td>${k.indikatorSoal}</td>
        <td style="text-align: center;">${k.bentukSoal}</td>
        <td style="text-align: center; font-weight: bold;">${k.nomorSoal}</td>
        <td>${k.naskahSoal.replace(/\n/g, '<br>')}</td>
        <td style="text-align: center; font-weight: bold; color: #047857;">${k.kunciJawaban}</td>
        <td style="text-align: center; font-weight: bold;">${k.skor}</td>
      </tr>
    `).join('');

    // Build Lembar Soal HTML
    const pgSoal = asatData.kisiKisi.filter(k => k.bentukSoal === 'Pilihan Ganda');
    const pgkSoal = asatData.kisiKisi.filter(k => k.bentukSoal === 'Pilihan Ganda Kompleks');
    const jodohSoal = asatData.kisiKisi.filter(k => k.bentukSoal === 'Menjodohkan');
    const isianSoal = asatData.kisiKisi.filter(k => k.bentukSoal === 'Isian Singkat');
    const uraianSoal = asatData.kisiKisi.filter(k => k.bentukSoal === 'Uraian');

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>ASAT_${mataPelajaran}_${kelas}</title>
        <style>
          @page { size: 215mm 330mm; margin: 1.2cm 1.5cm 1.2cm 1.5cm; }
          @page Section1 { size: 609.45pt 935.43pt; margin: 36pt 42.5pt 36pt 42.5pt; }
          div.Section1 { page: Section1; }
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10pt; line-height: 1.4; color: #111; }
          h2, h3, h4 { text-align: center; margin: 2px 0; font-weight: bold; }
          .header-box { text-align: center; border-bottom: 3px double #333; padding-bottom: 8px; margin-bottom: 14px; }
          table { border-collapse: collapse; width: 100%; margin-top: 8px; margin-bottom: 12px; }
          th { background-color: #f3f4f6; border: 1px solid #444; padding: 5px; font-size: 9pt; text-align: center; font-weight: bold; }
          td { border: 1px solid #666; padding: 5px; font-size: 8.5pt; vertical-align: top; }
          .soal-item { margin-bottom: 14px; page-break-inside: avoid; }
          .soal-text { font-size: 10pt; margin-bottom: 4px; font-weight: 500; }
          .opsi-list { margin-left: 18px; margin-top: 2px; }
          .gambar-box { background-color: #f8fafc; border: 1px dashed #0284c7; padding: 6px 10px; font-size: 8.5pt; color: #0369a1; margin-bottom: 6px; font-style: italic; }
          .section-title { background-color: #064e3b; color: white; padding: 6px 10px; font-weight: bold; margin-top: 18px; margin-bottom: 10px; font-size: 10.5pt; }
          .signatures { margin-top: 30px; width: 100%; }
          .signatures td { border: none; text-align: center; width: 50%; font-size: 9.5pt; }
        </style>
      </head>
      <body>
        <!-- BAGIAN 1: KISI-KISI ASESMEN SUMATIF -->
        <div data-f4-section="Bagian 1: Kisi-Kisi ASAT (10 Kolom)" data-f4-orientation="landscape">
          <div class="header-box">
            <div style="font-size: 13pt; font-weight: bold;">KISI-KISI ASESMEN SUMATIF AKHIR TAHUN (ASAT)</div>
            <div style="font-size: 11pt; font-weight: bold;">MATA PELAJARAN: ${mataPelajaran.toUpperCase()}</div>
            <div style="font-size: 9.5pt; color: #444;">${namaSekolah} • KELAS ${kelas} • TAHUN PELAJARAN ${tahunPelajaran}</div>
            <div style="font-size: 8.5pt; color: #047857; margin-top: 3px;">Bobot Materi: 30% Semester 1 & 70% Semester 2 • Total: 45 Butir Soal</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 4%;">No</th>
                <th style="width: 14%;">Tujuan Pembelajaran</th>
                <th style="width: 12%;">Ruang Lingkup Materi</th>
                <th style="width: 8%;">Level Kognitif</th>
                <th style="width: 16%;">Indikator Soal</th>
                <th style="width: 9%;">Bentuk Soal</th>
                <th style="width: 5%;">No Soal</th>
                <th style="width: 20%;">Naskah Soal</th>
                <th style="width: 7%;">Kunci</th>
                <th style="width: 5%;">Skor</th>
              </tr>
            </thead>
            <tbody>
              ${kisiKisiRows}
            </tbody>
          </table>
        </div>

        <div style="page-break-before: always;"></div>

        <!-- BAGIAN 2: LEMBAR NASKAH SOAL PILIHAN GANDA -->
        <div data-f4-section="Bagian 2: Naskah Soal Pilihan Ganda (Nomor 1 - 25)" data-f4-orientation="portrait">
          <div class="header-box" data-f4-kop="true">
            <div style="font-size: 13pt; font-weight: bold;">LEMBAR SOAL ASESMEN SUMATIF AKHIR TAHUN (ASAT)</div>
            <div style="font-size: 11pt; font-weight: bold;">${namaSekolah.toUpperCase()}</div>
            <div style="font-size: 9.5pt; margin-top: 4px;">
              Mata Pelajaran: <b>${mataPelajaran}</b> &nbsp;|&nbsp; Kelas/Semester: <b>${kelas} / Semester 2 (Genap)</b><br>
              Tahun Pelajaran: <b>${tahunPelajaran}</b> &nbsp;|&nbsp; Alokasi Waktu: <b>${alokasiWaktu}</b> &nbsp;|&nbsp; Jumlah: <b>45 Soal</b>
            </div>
          </div>

          <div style="background-color: #f9fafb; border: 1px solid #d1d5db; padding: 8px 12px; margin-bottom: 16px; font-size: 9pt;">
            <b>PETUNJUK PENGERJAAN:</b>
            <ol style="margin: 4px 0 0 16px; padding: 0;">
              ${asatData.petunjukPengerjaan.map(p => `<li>${p}</li>`).join('')}
            </ol>
          </div>

          <!-- Bagian A: Pilihan Ganda -->
          <div class="section-title">BAGIAN I: PILIHAN GANDA (Nomor 1 - 25)</div>
          <p style="font-size: 9pt; font-style: italic; margin-bottom: 10px;">Petunjuk: Pilihlah salah satu jawaban yang paling tepat dengan memberi tanda silang (X) pada huruf A, B, C, D, atau E di lembar jawaban!</p>

          ${pgSoal.map(s => `
            <div class="soal-item">
              <div class="soal-text"><b>${s.nomorSoal}.</b> ${s.naskahSoal.replace(/\n/g, '<br>')}</div>
              ${s.opsiJawaban ? `
                <div class="opsi-list">
                  ${s.opsiJawaban.map(op => `<div>${op}</div>`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <div style="page-break-before: always;"></div>

        <!-- BAGIAN 3: NASKAH SOAL PG KOMPLEKS, MENJODOHKAN, ISIAN & URAIAN -->
        <div data-f4-section="Bagian 3: Naskah Soal PGK, Menjodohkan, Isian & Uraian (Nomor 26 - 45)" data-f4-orientation="portrait">
          <!-- Bagian B: PG Kompleks -->
          <div class="section-title">BAGIAN II: PILIHAN GANDA KOMPLEKS (Nomor 26 - 30)</div>
          <p style="font-size: 9pt; font-style: italic; margin-bottom: 10px;">Petunjuk: Pilihlah kombinasi jawaban yang paling tepat sesuai instruksi pada setiap soal!</p>

          ${pgkSoal.map(s => `
            <div class="soal-item">
              <div class="soal-text"><b>${s.nomorSoal}.</b> ${s.naskahSoal.replace(/\n/g, '<br>')}</div>
              ${s.opsiJawaban ? `
                <div class="opsi-list">
                  ${s.opsiJawaban.map(op => `<div>${op}</div>`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}

          <!-- Bagian C: Menjodohkan -->
          <div class="section-title">BAGIAN III: MENJODOHKAN (Nomor 31 - 38)</div>
          <p style="font-size: 9pt; font-style: italic; margin-bottom: 10px;">Petunjuk: Jodohkanlah pernyataan/istilah di sebelah kiri dengan pilihan jawaban yang tepat di sebelah kanan!</p>

          ${jodohSoal.map(s => `
            <div class="soal-item">
              <div class="soal-text"><b>${s.nomorSoal}.</b> ${s.naskahSoal.replace(/\n/g, '<br>')}</div>
            </div>
          `).join('')}

          <!-- Bagian D: Isian Singkat -->
          <div class="section-title">BAGIAN IV: ISIAN SINGKAT (Nomor 39 - 43)</div>
          <p style="font-size: 9pt; font-style: italic; margin-bottom: 10px;">Petunjuk: Isilah titik-titik di bawah ini dengan jawaban yang singkat, tepat, dan benar!</p>

          ${isianSoal.map(s => `
            <div class="soal-item">
              <div class="soal-text"><b>${s.nomorSoal}.</b> ${s.naskahSoal.replace(/\n/g, '<br>')}</div>
            </div>
          `).join('')}

          <!-- Bagian E: Uraian -->
          <div class="section-title">BAGIAN V: URAIAN (Nomor 44 - 45)</div>
          <p style="font-size: 9pt; font-style: italic; margin-bottom: 10px;">Petunjuk: Jawablah pertanyaan-pertanyaan berikut dengan uraian yang jelas, sistematis, dan logis!</p>

          ${uraianSoal.map(s => `
            <div class="soal-item">
              <div class="soal-text"><b>${s.nomorSoal}.</b> ${s.naskahSoal.replace(/\n/g, '<br>')}</div>
            </div>
          `).join('')}
        </div>

        <div style="page-break-before: always;"></div>

        <!-- BAGIAN 4: TABEL KUNCI JAWABAN DAN PEDOMAN PENSKORAN -->
        <div data-f4-section="Bagian 4: Kunci Jawaban & Pedoman Penskoran ASAT" data-f4-orientation="portrait">
          <div class="header-box">
            <div style="font-size: 13pt; font-weight: bold;">TABEL KUNCI JAWABAN DAN PEDOMAN PENSKORAN</div>
            <div style="font-size: 11pt; font-weight: bold;">ASESMEN SUMATIF AKHIR TAHUN (${mataPelajaran.toUpperCase()})</div>
            <div style="font-size: 9.5pt; color: #444;">${namaSekolah} • KELAS ${kelas} • TAHUN PELAJARAN ${tahunPelajaran}</div>
          </div>

          <h4 style="text-align: left; margin-top: 14px; color: #064e3b;">A. Kunci Jawaban Pilihan Ganda & Skor (1 - 25)</h4>
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">No Soal</th>
                <th style="width: 15%;">Kunci</th>
                <th style="width: 10%;">Skor</th>
                <th style="width: 10%;">No Soal</th>
                <th style="width: 15%;">Kunci</th>
                <th style="width: 10%;">Skor</th>
                <th style="width: 10%;">No Soal</th>
                <th style="width: 15%;">Kunci</th>
                <th style="width: 10%;">Skor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center;">1</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">10</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">19</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
              </tr>
              <tr>
                <td style="text-align: center;">2</td><td style="text-align: center; font-weight: bold;">C</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">11</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">20</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
              </tr>
              <tr>
                <td style="text-align: center;">3</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">12</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">21</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
              </tr>
              <tr>
                <td style="text-align: center;">4</td><td style="text-align: center; font-weight: bold;">C</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">13</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">22</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
              </tr>
              <tr>
                <td style="text-align: center;">5</td><td style="text-align: center; font-weight: bold;">C</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">14</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">23</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
              </tr>
              <tr>
                <td style="text-align: center;">6</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">15</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">24</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
              </tr>
              <tr>
                <td style="text-align: center;">7</td><td style="text-align: center; font-weight: bold;">C</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">16</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">25</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
              </tr>
              <tr>
                <td style="text-align: center;">8</td><td style="text-align: center; font-weight: bold;">C</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">17</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">-</td><td style="text-align: center;">-</td><td style="text-align: center;">-</td>
              </tr>
              <tr>
                <td style="text-align: center;">9</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">18</td><td style="text-align: center; font-weight: bold;">B</td><td style="text-align: center;">1</td>
                <td style="text-align: center;">-</td><td style="text-align: center;">-</td><td style="text-align: center;">-</td>
              </tr>
            </tbody>
          </table>

          <h4 style="text-align: left; margin-top: 14px; color: #064e3b;">B. Kunci PG Kompleks, Menjodohkan & Isian Singkat</h4>
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">No Soal</th>
                <th style="width: 25%;">Bentuk Soal</th>
                <th style="width: 50%;">Kunci Jawaban</th>
                <th style="width: 15%;">Skor</th>
              </tr>
            </thead>
            <tbody>
              ${asatData.kisiKisi.filter(k => k.bentukSoal !== 'Pilihan Ganda' && k.bentukSoal !== 'Uraian').map(s => `
                <tr>
                  <td style="text-align: center; font-weight: bold;">${s.nomorSoal}</td>
                  <td>${s.bentukSoal}</td>
                  <td><b>${s.kunciJawaban}</b></td>
                  <td style="text-align: center; font-weight: bold;">${s.skor}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h4 style="text-align: left; margin-top: 14px; color: #064e3b;">C. Rubrik Pedoman Penskoran Uraian (Nomor 44 - 45)</h4>
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">No Soal</th>
                <th style="width: 75%;">Kriteria Penilaian & Kunci Uraian</th>
                <th style="width: 15%;">Skor Maksimal</th>
              </tr>
            </thead>
            <tbody>
              ${uraianSoal.map(s => `
                <tr>
                  <td style="text-align: center; font-weight: bold;">${s.nomorSoal}</td>
                  <td>
                    <p><b>Kunci / Indikator Jawaban:</b> ${s.kunciJawaban}</p>
                    <ul style="margin: 4px 0; padding-left: 16px;">
                      <li>Skor 5: Jawaban sangat lengkap, analisis mendalam, strategi/langkah sangat aplikatif.</li>
                      <li>Skor 3: Jawaban cukup lengkap namun kurang elaborasi analisis.</li>
                      <li>Skor 1: Menjawab singkat namun kurang tepat.</li>
                    </ul>
                  </td>
                  <td style="text-align: center; font-weight: bold; font-size: 11pt;">5</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="background-color: #ecfdf5; border: 1px solid #10b981; padding: 10px; margin-top: 14px; font-size: 9.5pt;">
            <b>RUMUS PERHITUNGAN NILAI AKHIR:</b><br>
            • Skor Maksimal PG: 25 butir × 1 = 25<br>
            • Skor Maksimal PG Kompleks: 5 butir × 2 = 10<br>
            • Skor Maksimal Menjodohkan: 8 butir × 1 = 8<br>
            • Skor Maksimal Isian Singkat: 5 butir × 2 = 10<br>
            • Skor Maksimal Uraian: 2 butir × 5 = 10<br>
            <b>TOTAL SKOR MAKSIMAL = 63</b><br><br>
            <span style="font-size: 11pt; color: #064e3b; font-weight: bold;">
              Nilai Akhir Siswa = (Total Skor Perolehan / 63) × 100
            </span>
          </div>

          <table class="signatures">
            <tr>
              <td>
                Mengetahui,<br>
                Kepala Sekolah ${namaSekolah}<br><br><br><br><br>
                <b><u>${namaKepalaSekolah}</u></b><br>
                NIP. ${nipKepalaSekolah || '....................................'}
              </td>
              <td>
                ........................, Juni 2026<br>
                Guru Mata Pelajaran ${mataPelajaran}<br><br><br><br><br>
                <b><u>${namaPenyusun}</u></b><br>
                NIP. ${nipPenyusun || '....................................'}
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;
  };

  // Export to Microsoft Word (.doc) F4 Multi-Section (Kisi-Kisi Landscape + Soal & Kunci Portrait)
  const handleExportWord = () => {
    if (!asatData) return;
    const wordContent = buildAsatHtml();
    const filename = `ASAT_F4_${mataPelajaran.replace(/\s+/g, '_')}_Kelas_${kelas.replace(/\s+/g, '_')}.doc`;
    downloadDocFile(filename, wordContent);
  };

  // Download as F4 PDF (.pdf)
  const handleDownloadPdf = async () => {
    if (!asatData || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docHtml = buildAsatHtml();
      const fileName = `ASAT_F4_${mataPelajaran.replace(/\s+/g, '_')}_Kelas_${kelas.replace(/\s+/g, '_')}.pdf`;
      await downloadHtmlAsPdf(docHtml, fileName, 'portrait');
    } catch (err) {
      console.error('Error generating ASAT F4 PDF:', err);
      printHtmlDocument(buildAsatHtml(), `ASAT - ${mataPelajaran}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print F4 Document
  const handlePrint = () => {
    if (!asatData) return;
    printHtmlDocument(buildAsatHtml(), `ASAT F4 - ${mataPelajaran} Kelas ${kelas}`);
  };

  // Copy structured text
  const handleCopyText = () => {
    if (!asatData) return;
    let text = `LEMBAR SOAL ASESMEN SUMATIF AKHIR TAHUN (ASAT)\n`;
    text += `Mata Pelajaran: ${mataPelajaran}\nKelas: ${kelas} (${fase})\nSekolah: ${namaSekolah}\nTahun: ${tahunPelajaran}\n\n`;

    asatData.kisiKisi.forEach(s => {
      text += `${s.nomorSoal}. [${s.bentukSoal}] (${s.ruangLingkupMateri})\n${s.naskahSoal}\n`;
      if (s.opsiJawaban) {
        text += `${s.opsiJawaban.join('\n')}\n`;
      }
      text += `Kunci: ${s.kunciJawaban} | Skor: ${s.skor}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Export JSON
  const handleExportJson = () => {
    if (!asatData) return;
    const filename = `ASAT_${mataPelajaran.replace(/[^a-zA-Z0-9]/g, '_')}_${kelas.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    downloadJsonFile(filename, asatData);
  };

  // Prompts for AI Modal
  const prompts = useMemo(() => {
    return getAsatPrompts({
      mataPelajaran,
      kelas,
      fase,
      tujuanSemester1,
      tujuanSemester2,
      namaSekolah,
      tahunPelajaran,
      alokasiWaktu
    });
  }, [mataPelajaran, kelas, fase, tujuanSemester1, tujuanSemester2, namaSekolah, tahunPelajaran, alokasiWaktu]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-950 text-white p-6 md:p-8 rounded-2xl shadow-lg border border-emerald-600/30">
        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-emerald-500/30 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5" />
              Generator Asesmen Sumatif Akhir Tahun (ASAT)
            </span>
            <span className="bg-amber-500/20 text-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-400/30">
              30% Semester 1 & 70% Semester 2 • 45 Soal
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Asesmen Sumatif Akhir Tahun (Materi 2 Semester)
          </h2>
          <p className="text-emerald-100/90 text-sm md:text-base mt-2 leading-relaxed">
            Menyusun instrumen evaluasi komprehensif akhir tahun lengkap dengan 
            <span className="font-semibold text-white"> Tabel Kisi-Kisi 10 Kolom Rinci</span>, 
            <span className="font-semibold text-white"> Naskah Lembar Soal Siswa</span> (25 PG, 5 PG Kompleks, 8 Menjodohkan, 5 Isian, 2 Uraian), serta 
            <span className="font-semibold text-white"> Tabel Kunci Jawaban & Pedoman Penskoran</span>. Dilengkapi stimulus bacaan & deskripsi gambar.
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={handleGenerateAsat}
              disabled={isGenerating}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyusun 45 Soal & Kisi-Kisi...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  Generate ASAT dengan AI
                </>
              )}
            </button>

            <button
              onClick={handleExportWord}
              disabled={!asatData}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
              title="Unduh file Microsoft Word (.doc) rapi ukuran F4 berisi Kisi-Kisi, Lembar Soal & Kunci Penskoran"
            >
              <Download className="w-4 h-4" />
              Unduh Word (.doc)
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={!asatData || isExportingPdf}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
              title="Unduh file PDF ukuran F4 (215mm x 330mm) per bagian atau gabungan siap cetak"
            >
              <FileText className="w-4 h-4" />
              {isExportingPdf ? 'Memproses PDF F4...' : 'Unduh PDF Per Bagian (F4)'}
            </button>

            <button
              onClick={handlePrint}
              disabled={!asatData}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Printer className="w-4 h-4" />
              Cetak Per Bagian (F4)
            </button>

            <ExportJsonPromptAiButtons
              variant="compact"
              onExportJson={handleExportJson}
              onOpenPromptAi={() => setIsPromptModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Input Form & Parameters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base">
              Identitas & Tujuan Pembelajaran 2 Semester
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-2 font-medium">Jenjang:</span>
            <button
              onClick={() => handleApplyPreset('SMP')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                kelas.includes('VII')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              SMP (Fase D)
            </button>
            <button
              onClick={() => handleApplyPreset('SD')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                kelas.includes('IV')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              SD (Fase B)
            </button>
            <button
              onClick={() => handleApplyPreset('SMA')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                kelas.includes('X')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              SMA (Fase E)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mata Pelajaran
            </label>
            <input
              type="text"
              value={mataPelajaran}
              onChange={e => setMataPelajaran(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kelas & Fase
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={kelas}
                onChange={e => setKelas(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Kelas"
              />
              <input
                type="text"
                value={fase}
                onChange={e => setFase(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Fase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Satuan Pendidikan
            </label>
            <input
              type="text"
              value={namaSekolah}
              onChange={e => setNamaSekolah(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tahun Ajaran & Alokasi Waktu
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={tahunPelajaran}
                onChange={e => setTahunPelajaran(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <input
                type="text"
                value={alokasiWaktu}
                onChange={e => setAlokasiWaktu(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Input TP 2 Semester */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                Tujuan Pembelajaran Semester 1 (Bobot 30% / ±14 Soal)
              </span>
              <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Semester Ganjil
              </span>
            </div>
            <textarea
              rows={4}
              value={tujuanSemester1}
              onChange={e => setTujuanSemester1(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="Masukkan tujuan pembelajaran semester 1 yang diujikan..."
            />
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                Tujuan Pembelajaran Semester 2 (Bobot 70% / ±31 Soal)
              </span>
              <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Semester Genap
              </span>
            </div>
            <textarea
              rows={4}
              value={tujuanSemester2}
              onChange={e => setTujuanSemester2(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Masukkan tujuan pembelajaran semester 2 yang diujikan..."
            />
          </div>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Soal</span>
          <span className="text-xl font-extrabold text-slate-900">{stats.total} Butir</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] uppercase font-bold text-amber-600 block">Semester 1 (30%)</span>
          <span className="text-xl font-extrabold text-amber-700">{stats.sem1} Soal</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-600 block">Semester 2 (70%)</span>
          <span className="text-xl font-extrabold text-emerald-700">{stats.sem2} Soal</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] uppercase font-bold text-blue-600 block">Pilihan Ganda</span>
          <span className="text-xl font-extrabold text-blue-700">{stats.pg} (A-E)</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] uppercase font-bold text-indigo-600 block">PGK & Menjodohkan</span>
          <span className="text-xl font-extrabold text-indigo-700">{stats.pgk + stats.jodoh} Soal</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] uppercase font-bold text-purple-600 block">Isian & Uraian</span>
          <span className="text-xl font-extrabold text-purple-700">{stats.isian + stats.uraian} Soal</span>
        </div>
      </div>

      {/* Tabs Navigation & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('kisi_kisi')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'kisi_kisi'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            1. Tabel Kisi-Kisi (10 Kolom)
          </button>
          <button
            onClick={() => setActiveSubTab('lembar_soal')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'lembar_soal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            2. Lembar Naskah Soal Siswa
          </button>
          <button
            onClick={() => setActiveSubTab('kunci_skor')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'kunci_skor'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            3. Kunci Jawaban & Penskoran
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {activeSubTab === 'kisi_kisi' && (
            <>
              <select
                value={filterBentukSoal}
                onChange={e => setFilterBentukSoal(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-semibold"
              >
                <option value="all">Semua Bentuk Soal</option>
                <option value="Pilihan Ganda">Pilihan Ganda (25)</option>
                <option value="Pilihan Ganda Kompleks">PG Kompleks (5)</option>
                <option value="Menjodohkan">Menjodohkan (8)</option>
                <option value="Isian Singkat">Isian Singkat (5)</option>
                <option value="Uraian">Uraian (2)</option>
              </select>

              <select
                value={filterSemester}
                onChange={e => setFilterSemester(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-semibold"
              >
                <option value="all">Semua Semester</option>
                <option value="1">Semester 1 (30%)</option>
                <option value="2">Semester 2 (70%)</option>
              </select>
            </>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari soal/materi..."
              className="text-xs pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 w-44"
            />
          </div>

          <button
            onClick={handleCopyText}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 font-semibold cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {isCopied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 print:p-0 print:border-none print:shadow-none">
        
        {/* SUBTAB 1: TABEL KISI-KISI 10 KOLOM */}
        {activeSubTab === 'kisi_kisi' && (
          <div className="space-y-4">
            <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-extrabold uppercase text-slate-900">
                KISI-KISI ASESMEN SUMATIF AKHIR TAHUN (ASAT)
              </h3>
              <p className="text-xs font-semibold text-emerald-800 uppercase">
                {mataPelajaran} • KELAS {kelas} ({fase}) • TAHUN AJARAN {tahunPelajaran}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Format 10 Kolom Baku: No, TP, Ruang Lingkup Materi, Level Kognitif, Indikator Soal, Bentuk Soal, No Soal, Naskah Soal, Kunci Jawaban, Skor
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wide">
                    <th className="py-2.5 px-2.5 border-r border-slate-200 w-12 text-center">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-48">Tujuan Pembelajaran</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-36">Ruang Lingkup Materi</th>
                    <th className="py-2.5 px-2.5 border-r border-slate-200 w-24 text-center">Level Kognitif</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-44">Indikator Soal</th>
                    <th className="py-2.5 px-2.5 border-r border-slate-200 w-28 text-center">Bentuk Soal</th>
                    <th className="py-2.5 px-2 border-r border-slate-200 w-14 text-center">No Soal</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-64">Naskah Soal</th>
                    <th className="py-2.5 px-2 border-r border-slate-200 w-20 text-center">Kunci</th>
                    <th className="py-2.5 px-2 w-12 text-center">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {filteredKisiKisi.map((k, idx) => (
                    <tr key={k.no} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-2.5 px-2.5 border-r border-slate-200 text-center font-medium text-slate-500 align-top">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 align-top leading-relaxed">
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-sm mb-1 ${
                          k.semesterAsal === 1 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          Sem {k.semesterAsal}
                        </span>
                        <div>{k.tujuanPembelajaran}</div>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900 align-top">
                        {k.ruangLingkupMateri}
                      </td>
                      <td className="py-2.5 px-2.5 border-r border-slate-200 text-center align-top font-semibold text-indigo-700">
                        {k.levelKognitif}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600 align-top leading-relaxed">
                        {k.indikatorSoal}
                      </td>
                      <td className="py-2.5 px-2.5 border-r border-slate-200 text-center align-top">
                        <span className="font-semibold text-slate-700 block">{k.bentukSoal}</span>
                      </td>
                      <td className="py-2.5 px-2 border-r border-slate-200 font-extrabold text-center text-slate-900 align-top bg-slate-50/50">
                        {k.nomorSoal}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800 align-top leading-relaxed">
                        {k.naskahSoal.includes('[Gambar:') ? (
                          <div className="bg-sky-50 border border-sky-200 text-sky-800 p-2 rounded-lg mb-2 text-[11px] italic">
                            📸 {k.naskahSoal.split('\n\n')[0]}
                          </div>
                        ) : null}
                        <div>{k.naskahSoal.replace(/\[Gambar:.*?\]\n\n?/, '')}</div>
                        {k.opsiJawaban && (
                          <div className="mt-1.5 space-y-0.5 text-slate-600 text-[11px] bg-slate-50 p-2 rounded">
                            {k.opsiJawaban.map(op => (
                              <div key={op}>{op}</div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 border-r border-slate-200 text-center align-top font-bold text-emerald-700 bg-emerald-50/30">
                        {k.kunciJawaban}
                      </td>
                      <td className="py-2.5 px-2 text-center align-top font-bold text-slate-900">
                        {k.skor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 2: LEMBAR NASKAH SOAL SISWA */}
        {activeSubTab === 'lembar_soal' && (
          <div className="space-y-6">
            {/* Kop Ujian */}
            <div className="text-center border-b-2 border-slate-900 pb-4">
              <h2 className="text-lg md:text-xl font-extrabold uppercase text-slate-900 tracking-tight">
                ASESMEN SUMATIF AKHIR TAHUN (ASAT)
              </h2>
              <h3 className="text-base font-bold text-emerald-800 uppercase mt-0.5">
                {namaSekolah}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>Mata Pelajaran: <b className="text-slate-800">{mataPelajaran}</b></div>
                <div>Kelas: <b className="text-slate-800">{kelas}</b> ({fase})</div>
                <div>Tahun Pelajaran: <b className="text-slate-800">{tahunPelajaran}</b></div>
                <div>Waktu: <b className="text-slate-800">{alokasiWaktu}</b> (45 Soal)</div>
              </div>
            </div>

            {/* Petunjuk Pengerjaan */}
            <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl text-xs text-slate-700">
              <span className="font-bold text-emerald-900 block mb-1.5 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-700" />
                PETUNJUK PENGERJAAN SOAL:
              </span>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                {asatData?.petunjukPengerjaan.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ol>
            </div>

            {/* Bagian I: Pilihan Ganda (1 - 25) */}
            <div>
              <div className="bg-emerald-900 text-white px-4 py-2 rounded-xl font-bold text-xs md:text-sm mb-4">
                BAGIAN I: PILIHAN GANDA (Nomor 1 - 25)
              </div>
              <p className="text-xs text-slate-500 italic mb-4">
                Pilihlah salah satu jawaban yang paling tepat dengan memberi tanda silang (X) pada huruf A, B, C, D, atau E!
              </p>

              <div className="space-y-6">
                {asatData?.kisiKisi.filter(k => k.bentukSoal === 'Pilihan Ganda').map(s => (
                  <div key={s.nomorSoal} className="border-b border-slate-100 pb-5">
                    <div className="flex items-start gap-2 text-sm text-slate-900 leading-relaxed font-medium">
                      <span className="font-extrabold text-emerald-800 w-6 shrink-0">{s.nomorSoal}.</span>
                      <div className="flex-1">
                        {s.naskahSoal.includes('[Gambar:') ? (
                          <div className="bg-sky-50 border border-sky-300 text-sky-900 p-3 rounded-xl mb-3 text-xs italic">
                            <b>📸 PANDUAN GAMBAR UNTUK GURU / SOAL:</b><br />
                            {s.naskahSoal.split('\n\n')[0]}
                          </div>
                        ) : null}
                        <div>{s.naskahSoal.replace(/\[Gambar:.*?\]\n\n?/, '')}</div>

                        {s.opsiJawaban && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pt-2">
                            {s.opsiJawaban.map(op => (
                              <div key={op} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs">
                                {op}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bagian II: PG Kompleks (26 - 30) */}
            <div className="pt-4">
              <div className="bg-teal-900 text-white px-4 py-2 rounded-xl font-bold text-xs md:text-sm mb-4">
                BAGIAN II: PILIHAN GANDA KOMPLEKS (Nomor 26 - 30)
              </div>
              <p className="text-xs text-slate-500 italic mb-4">
                Pilihlah kombinasi pernyataan yang benar sesuai petunjuk pada soal!
              </p>

              <div className="space-y-6">
                {asatData?.kisiKisi.filter(k => k.bentukSoal === 'Pilihan Ganda Kompleks').map(s => (
                  <div key={s.nomorSoal} className="border-b border-slate-100 pb-5">
                    <div className="flex items-start gap-2 text-sm text-slate-900 leading-relaxed font-medium">
                      <span className="font-extrabold text-teal-800 w-6 shrink-0">{s.nomorSoal}.</span>
                      <div className="flex-1">
                        <div className="whitespace-pre-line">{s.naskahSoal}</div>
                        {s.opsiJawaban && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pt-2">
                            {s.opsiJawaban.map(op => (
                              <div key={op} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-800">
                                {op}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bagian III: Menjodohkan (31 - 38) */}
            <div className="pt-4">
              <div className="bg-cyan-900 text-white px-4 py-2 rounded-xl font-bold text-xs md:text-sm mb-4">
                BAGIAN III: MENJODOHKAN (Nomor 31 - 38)
              </div>
              <p className="text-xs text-slate-500 italic mb-4">
                Jodohkanlah premis di sebelah kiri dengan pilihan respon yang paling sesuai di sebelah kanan!
              </p>

              <div className="space-y-4">
                {asatData?.kisiKisi.filter(k => k.bentukSoal === 'Menjodohkan').map(s => (
                  <div key={s.nomorSoal} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-2 text-xs text-slate-900 leading-relaxed">
                      <span className="font-extrabold text-cyan-800 w-6 shrink-0">{s.nomorSoal}.</span>
                      <div className="flex-1 whitespace-pre-line">
                        {s.naskahSoal}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bagian IV: Isian Singkat (39 - 43) */}
            <div className="pt-4">
              <div className="bg-indigo-900 text-white px-4 py-2 rounded-xl font-bold text-xs md:text-sm mb-4">
                BAGIAN IV: ISIAN SINGKAT (Nomor 39 - 43)
              </div>
              <p className="text-xs text-slate-500 italic mb-4">
                Jawablah titik-titik dengan konsep aplikasi kehidupan nyata secara singkat dan tepat!
              </p>

              <div className="space-y-4">
                {asatData?.kisiKisi.filter(k => k.bentukSoal === 'Isian Singkat').map(s => (
                  <div key={s.nomorSoal} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-2 text-xs text-slate-900 leading-relaxed">
                      <span className="font-extrabold text-indigo-800 w-6 shrink-0">{s.nomorSoal}.</span>
                      <div className="flex-1">
                        {s.naskahSoal}
                        <div className="mt-2 text-slate-400 italic">Jawaban: ..........................................................................</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bagian V: Uraian (44 - 45) */}
            <div className="pt-4">
              <div className="bg-purple-900 text-white px-4 py-2 rounded-xl font-bold text-xs md:text-sm mb-4">
                BAGIAN V: URAIAN / STUDI KASUS (Nomor 44 - 45)
              </div>
              <p className="text-xs text-slate-500 italic mb-4">
                Jawablah pertanyaan berikut dengan analisa dan langkah konkret pemecahan masalah!
              </p>

              <div className="space-y-6">
                {asatData?.kisiKisi.filter(k => k.bentukSoal === 'Uraian').map(s => (
                  <div key={s.nomorSoal} className="p-4 bg-purple-50/40 rounded-xl border border-purple-200">
                    <div className="flex items-start gap-2 text-xs md:text-sm text-slate-900 leading-relaxed font-medium">
                      <span className="font-extrabold text-purple-800 w-6 shrink-0">{s.nomorSoal}.</span>
                      <div className="flex-1 whitespace-pre-line">
                        {s.naskahSoal}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: KUNCI JAWABAN & PEDOMAN PENSKORAN */}
        {activeSubTab === 'kunci_skor' && (
          <div className="space-y-6">
            <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-extrabold uppercase text-slate-900">
                TABEL KUNCI JAWABAN DAN PEDOMAN PENSKORAN
              </h3>
              <p className="text-xs font-semibold text-emerald-800 uppercase">
                {mataPelajaran} • KELAS {kelas} ({fase}) • TAHUN AJARAN {tahunPelajaran}
              </p>
            </div>

            {/* Kunci PG 1-25 Grid */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                A. Kunci Jawaban Pilihan Ganda (Nomor 1 - 25) • Skor 1 Tiap Soal
              </h4>
              <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2 text-center text-xs">
                {asatData?.kisiKisi.filter(k => k.bentukSoal === 'Pilihan Ganda').map(s => (
                  <div key={s.nomorSoal} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">No. {s.nomorSoal}</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{s.kunciJawaban}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kunci Non-PG Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-3 bg-slate-100 font-bold text-xs text-slate-800 uppercase border-b border-slate-200">
                B. Kunci Jawaban PG Kompleks, Menjodohkan, & Isian Singkat
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                      <th className="py-2 px-3 w-16 text-center border-r border-slate-200">No</th>
                      <th className="py-2 px-3 w-32 border-r border-slate-200">Bentuk Soal</th>
                      <th className="py-2 px-3 border-r border-slate-200">Kunci Jawaban</th>
                      <th className="py-2 px-3 w-20 text-center">Skor Maks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {asatData?.kisiKisi.filter(k => k.bentukSoal !== 'Pilihan Ganda' && k.bentukSoal !== 'Uraian').map(s => (
                      <tr key={s.nomorSoal} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center font-bold text-slate-900 border-r border-slate-200">{s.nomorSoal}</td>
                        <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-600">{s.bentukSoal}</td>
                        <td className="py-2 px-3 border-r border-slate-200 font-bold text-emerald-800">{s.kunciJawaban}</td>
                        <td className="py-2 px-3 text-center font-bold">{s.skor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rubrik Uraian */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-3 bg-slate-100 font-bold text-xs text-slate-800 uppercase border-b border-slate-200">
                C. Rubrik Pedoman Penskoran Soal Uraian (Nomor 44 - 45)
              </div>
              <div className="p-4 space-y-4">
                {asatData?.kisiKisi.filter(k => k.bentukSoal === 'Uraian').map(s => (
                  <div key={s.nomorSoal} className="bg-purple-50/50 p-4 rounded-xl border border-purple-200">
                    <span className="font-extrabold text-purple-900 text-sm block mb-1">
                      Soal Nomor {s.nomorSoal} (Skor Maksimal: {s.skor})
                    </span>
                    <p className="text-xs text-slate-700 mb-2 leading-relaxed">
                      <b>Kunci / Arahan Jawaban:</b> {s.kunciJawaban}
                    </p>
                    <div className="bg-white p-3 rounded-lg border border-purple-100 text-xs space-y-1 text-slate-600">
                      <div>• <b>Skor 5:</b> Jawaban sangat lengkap, analisis mendalam, dan memberikan 3 strategi konkret.</div>
                      <div>• <b>Skor 3:</b> Menjawab separuh analisis atau 2 strategi saja.</div>
                      <div>• <b>Skor 1:</b> Menjawab singkat tanpa analisis komprehensif.</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formula Nilai Akhir */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-5 rounded-2xl text-xs text-slate-800">
              <h4 className="font-extrabold text-sm text-emerald-950 mb-2">
                FORMULA PERHITUNGAN NILAI AKHIR ASESMEN:
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center mb-3">
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <span className="block text-[10px] text-slate-400">PG (25 Soal)</span>
                  <span className="font-bold text-slate-800">Maks. 25</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <span className="block text-[10px] text-slate-400">PGK (5 Soal)</span>
                  <span className="font-bold text-slate-800">Maks. 10</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <span className="block text-[10px] text-slate-400">Jodoh (8 Soal)</span>
                  <span className="font-bold text-slate-800">Maks. 8</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <span className="block text-[10px] text-slate-400">Isian (5 Soal)</span>
                  <span className="font-bold text-slate-800">Maks. 10</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <span className="block text-[10px] text-slate-400">Uraian (2 Soal)</span>
                  <span className="font-bold text-slate-800">Maks. 10</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-600 text-white font-extrabold text-sm rounded-xl text-center shadow-xs">
                Nilai Akhir Siswa = (Total Skor Perolehan / 63) × 100
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-800">
              <div>
                <p className="text-slate-500 mb-1">Mengetahui,</p>
                <p className="font-bold text-slate-800">Kepala {namaSekolah}</p>
                <div className="h-16" />
                <p className="font-extrabold text-slate-900 underline text-sm">{namaKepalaSekolah}</p>
                <p className="text-slate-500 text-[11px]">NIP. {nipKepalaSekolah || '....................................'}</p>
              </div>

              <div>
                <p className="text-slate-500 mb-1">Ditetapkan di Sekolah, Juni 2026</p>
                <p className="font-bold text-slate-800">Guru Penyusun Asesmen</p>
                <div className="h-16" />
                <p className="font-extrabold text-slate-900 underline text-sm">{namaPenyusun}</p>
                <p className="text-slate-500 text-[11px]">NIP. {nipPenyusun || '....................................'}</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Prompt AI Master Modal */}
      <AiPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        title="Prompt AI Master Asesmen Sumatif Akhir Tahun (2 Semester)"
        subtitle="Prompt instruksi terstruktur untuk Google Gemini & ChatGPT sesuai bobot 30% Semester 1 & 70% Semester 2"
        tabs={prompts}
        jsonData={asatData}
        jsonFilename={`ASAT_${mataPelajaran.replace(/\s+/g, '_')}_${kelas.replace(/\s+/g, '_')}.json`}
      />
    </div>
  );
};
export default AsatGeneratorView;
