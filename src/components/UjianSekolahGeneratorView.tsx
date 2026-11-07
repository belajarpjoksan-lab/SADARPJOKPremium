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
  BookOpen,
  Layers,
  FileCheck,
  Info,
  Clock,
  Award,
  ListOrdered,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { UsData, UsKisiKisiItem } from '../types';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import AiPromptModal from './AiPromptModal';
import { getUjianSekolahPrompts } from '../utils/aiPromptGenerators';
import { downloadJsonFile, downloadDocFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';

export const UjianSekolahGeneratorView: React.FC = () => {
  // --- Form & Configuration State ---
  const [versiPrompt, setVersiPrompt] = useState<'versi_1' | 'versi_2'>('versi_2');
  const [jenjangMode, setJenjangMode] = useState<'SMP' | 'SD' | 'SMA'>('SMP');
  const [mataPelajaran, setMataPelajaran] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)');
  const [kelasAkhir, setKelasAkhir] = useState('IX (Sembilan)');
  const [jenjang, setJenjang] = useState('SMP/MTs');
  const [namaSekolah, setNamaSekolah] = useState('SD Negeri Kalimantong');
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  const [alokasiWaktu, setAlokasiWaktu] = useState('120 Menit');
  const [namaPenyusun, setNamaPenyusun] = useState('Budi Santoso, S.Pd., Gr.');
  const [nipPenyusun, setNipPenyusun] = useState('19880315 201402 1 003');
  const [namaKepalaSekolah, setNamaKepalaSekolah] = useState('Drs. H. Ahmad Dahlan, M.Pd.');
  const [nipKepalaSekolah, setNipKepalaSekolah] = useState('19720510 199803 1 002');

  // Input Tujuan Pembelajaran
  const [tujuanUmum, setTujuanUmum] = useState(
    `1. Mempraktikkan keterampilan variasi dan kombinasi gerak spesifik permainan invasi, net, dan lapangan (bola voli, sepak bola, bola basket, bulu tangkis, kasti).
2. Mempraktikkan dan menganalisis gerak dasar atletik (lari jarak pendek/sprint, lari estafet, lompat jauh, tolak peluru) dan senam lantai (guling depan, guling belakang, guling lenting).
3. Merancang latihan peningkatan derajat kebugaran jasmani (daya tahan jantung-paru, kekuatan, kelenturan, kelincahan).
4. Memahami pertolongan pertama pada cedera olahraga (metode RICE), pola makan bergizi seimbang, dan pencegahan bahaya zat adiktif.`
  );

  const [tujuanKelas7, setTujuanKelas7] = useState(
    'Mempraktikkan gerak spesifik passing bawah dan passing atas bola voli, start jongkok lari jarak pendek 100m, guling depan senam lantai, dan pengukuran kebugaran kardiorespirasi (Bleep Test).'
  );
  const [tujuanKelas8, setTujuanKelas8] = useState(
    'Mempraktikkan variasi servis atas dan smash bola voli, lay-up shoot bola basket, lari estafet 4x100m, guling lenting, renang gaya dada, serta penanganan cedera sprain metode R.I.C.E.'
  );
  const [tujuanKelas9, setTujuanKelas9] = useState(
    'Merancang taktik permainan bola voli 6v6 (sistem 4Sm-2Su), menganalisis tolak peluru gaya O’Brien dan lompat jauh gaya menggantung, penyelamatan kecelakaan air, program kebugaran F.I.T.T., dan pola hidup sehat pencegahan PTM.'
  );

  // View & UI State
  const [activeSubTab, setActiveSubTab] = useState<'kisi_kisi' | 'lembar_soal' | 'kunci_jawaban'>('kisi_kisi');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [usData, setUsData] = useState<UsData | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  // Jumlah Opsi Pilihan Ganda (3, 4, atau 5) & Jumlah Soal
  const [jumlahOpsi, setJumlahOpsi] = useState<3 | 4 | 5>(5);
  const [jumlahSoal, setJumlahSoal] = useState<number>(50);

  // Helper untuk adaptasi data secara instan di sisi klien
  const adaptUsDataClient = (sourceData: UsData, targetOpsi: 3 | 4 | 5, targetSoal: number): UsData => {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const letterLabels = letters.slice(0, targetOpsi);
    const optionsPromptLabel = letterLabels.join(', ');

    const newKisiKisi = sourceData.kisiKisi.slice(0, targetSoal).map((item, idx) => {
      let texts = (item.pilihanJawaban || []).map(op => op.replace(/^[A-E]\.\s*/, ''));
      const keyIdx = letters.indexOf(item.kunciJawaban);
      while (texts.length < targetOpsi) {
        texts.push(`Pilihan jawaban ${letters[texts.length]} alternatif`);
      }
      let correctText = (keyIdx >= 0 && keyIdx < texts.length) ? texts[keyIdx] : texts[0];
      if (keyIdx >= targetOpsi) {
        const swapTarget = targetOpsi - 1;
        const temp = texts[swapTarget];
        texts[swapTarget] = texts[keyIdx];
        texts[keyIdx] = temp;
      }
      const sliced = texts.slice(0, targetOpsi);
      let newKeyIdx = sliced.indexOf(correctText);
      if (newKeyIdx === -1) newKeyIdx = 0;
      const newKey = letters[newKeyIdx];
      const finalOptions = sliced.map((t, i) => `${letters[i]}. ${t}`);

      return {
        ...item,
        no: idx + 1,
        nomorSoal: idx + 1,
        pilihanJawaban: finalOptions,
        kunciJawaban: newKey
      };
    });

    return {
      ...sourceData,
      identitas: {
        ...sourceData.identitas,
        jumlahSoal: targetSoal,
        jumlahOpsi: targetOpsi
      },
      kisiKisi: newKisiKisi,
      petunjukPengerjaan: [
        'Berdoalah sebelum memulai mengerjakan soal sesuai agama dan keyakinan masing-masing.',
        'Tuliskan identitas diri (Nomor Peserta, Nama Lengkap, dan Kelas) secara lengkap pada Lembar Jawaban Ujian (LJU).',
        'Periksa dan bacalah setiap butir soal dengan teliti sebelum Anda menentukan pilihan jawaban.',
        `Pilihlah salah satu jawaban yang paling tepat dengan menghitamkan atau memberi tanda silang (X) pada huruf ${optionsPromptLabel} di lembar jawaban.`,
        'Dahulukan menjawab soal-soal yang Anda anggap paling mudah.',
        'Periksa kembali seluruh pekerjaan Anda secara cermat sebelum diserahkan kepada pengawas ujian.'
      ],
      kunciJawabanList: newKisiKisi.map(k => ({
        nomorSoal: k.nomorSoal,
        kunci: k.kunciJawaban,
        materi: k.ruangLingkupMateri
      })),
      pedomanPenskoran: {
        skorMaksimal: targetSoal,
        rumusNilaiAkhir: `Nilai Akhir = (Total Skor Perolehan / ${targetSoal}) × 100`
      }
    };
  };

  // Switcher Jumlah Opsi
  const handleOptionChange = (newOpsi: 3 | 4 | 5) => {
    setJumlahOpsi(newOpsi);
    if (usData) {
      setUsData(prev => prev ? adaptUsDataClient(prev, newOpsi, jumlahSoal) : null);
    }
  };

  // Switcher Jumlah Soal
  const handleQuestionCountChange = (newCount: number) => {
    setJumlahSoal(newCount);
    if (usData) {
      setUsData(prev => prev ? adaptUsDataClient(prev, jumlahOpsi, newCount) : null);
    }
  };

  // Apply Presets
  const handleApplyJenjang = (mode: 'SMP' | 'SD' | 'SMA') => {
    setJenjangMode(mode);
    if (mode === 'SMP') {
      setKelasAkhir('IX (Sembilan)');
      setJenjang('SMP/MTs');
      setJumlahOpsi(4);
      setJumlahSoal(50);
      setTujuanKelas7('Mempraktikkan gerak spesifik passing bawah/atas bola voli, lari sprint 100m, guling depan, dan kebugaran kardiorespirasi.');
      setTujuanKelas8('Mempraktikkan variasi servis/smash bola voli, lay-up shoot basket, lari estafet, renang gaya dada, dan penanganan cedera RICE.');
      setTujuanKelas9('Merancang taktik 6v6 bola voli, tolak peluru O’Brien, lompat jauh, program kebugaran FITT, dan pencegahan bahaya narkoba.');
      if (usData) setUsData(prev => prev ? adaptUsDataClient(prev, 4, 50) : null);
    } else if (mode === 'SD') {
      setKelasAkhir('VI (Enam)');
      setJenjang('SD/MI');
      setJumlahOpsi(4);
      setJumlahSoal(30);
      setTujuanKelas7('Mempraktikkan pola gerak dasar lokomotor, non-lokomotor, dan manipulatif permainan kasti dan atletik anak (Kelas IV).');
      setTujuanKelas8('Mempraktikkan kombinasi gerak dasar permainan bola besar sepak bola/voli dan senam ketangkasan (Kelas V).');
      setTujuanKelas9('Mempraktikkan variasi gerak spesifik permainan rounders, kebugaran jasmani, dan pola hidup bersih sehat (Kelas VI).');
      if (usData) setUsData(prev => prev ? adaptUsDataClient(prev, 4, 30) : null);
    } else {
      setKelasAkhir('XII (Dua Belas)');
      setJenjang('SMA/MA');
      setJumlahOpsi(5);
      setJumlahSoal(50);
      setTujuanKelas7('Mengevaluasi keterampilan gerak permainan invasi, atletik sprint, dan kebugaran jasmani mandiri (Kelas X).');
      setTujuanKelas8('Merancang pola penyerangan/pertahanan permainan net, senam ketangkasan alat, dan keselamatan air (Kelas XI).');
      setTujuanKelas9('Merancang dan mempraktikkan program latihan kebugaran personal jangka panjang, manajemen stres, dan pencegahan cedera (Kelas XII).');
      if (usData) setUsData(prev => prev ? adaptUsDataClient(prev, 5, 50) : null);
    }
  };

  // Generate Handler
  const handleGenerateUS = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-ujian-sekolah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mataPelajaran,
          kelasAkhir,
          jenjang,
          namaSekolah,
          tahunPelajaran,
          alokasiWaktu,
          penyusun: namaPenyusun,
          nipPenyusun,
          kepalaSekolah: namaKepalaSekolah,
          nipKepalaSekolah,
          versiPrompt,
          tujuanUmum,
          tujuanKelas7,
          tujuanKelas8,
          tujuanKelas9,
          jumlahOpsi,
          jumlahSoal
        })
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi generator Ujian Sekolah.');
      }

      const data: UsData = await response.json();
      setUsData(data);
    } catch (err: any) {
      console.warn('API error, using client-side generated dataset:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    if (!usData) {
      handleGenerateUS();
    }
  }, []);

  // Filtered Kisi-Kisi
  const filteredKisiKisi = useMemo(() => {
    if (!usData) return [];
    return usData.kisiKisi.filter(item => {
      const matchKelas = filterKelas === 'all' || (item.tingkatKelas && item.tingkatKelas.includes(filterKelas));
      const matchSearch = !searchQuery ||
        item.naskahSoal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ruangLingkupMateri.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.indikatorSoal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tujuanPembelajaran.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKelas && matchSearch;
    });
  }, [usData, filterKelas, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    if (!usData) return { total: 0, k7: 0, k8: 0, k9: 0 };
    const all = usData.kisiKisi;
    const total = all.length;
    const split1 = Math.max(1, Math.round(total * 0.2));
    const split2 = Math.max(split1 + 1, Math.round(total * 0.6));
    return {
      total,
      k7: all.filter(k => k.tingkatKelas?.includes('VII') || k.tingkatKelas?.includes('IV') || k.tingkatKelas?.includes('X') || (k.nomorSoal >= 1 && k.nomorSoal <= split1)).length,
      k8: all.filter(k => k.tingkatKelas?.includes('VIII') || k.tingkatKelas?.includes('V') || k.tingkatKelas?.includes('XI') || (k.nomorSoal > split1 && k.nomorSoal <= split2)).length,
      k9: all.filter(k => k.tingkatKelas?.includes('IX') || k.tingkatKelas?.includes('VI') || k.tingkatKelas?.includes('XII') || (k.nomorSoal > split2)).length
    };
  }, [usData]);

  // Build Print-Ready F4 HTML for Word & PDF
  const buildUsHtml = (): string => {
    if (!usData) return '';

    // 11-column Kisi-kisi Table
    const kisiRows = usData.kisiKisi.map((k, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${k.tujuanPembelajaran}</td>
        <td><b>${k.ruangLingkupMateri}</b></td>
        <td style="text-align: center;">${k.levelKognitif}</td>
        <td>${k.indikatorSoal}</td>
        <td style="text-align: center;">${k.bentukSoal}</td>
        <td style="text-align: center; font-weight: bold;">${k.nomorSoal}</td>
        <td>${k.naskahSoal.replace(/\n/g, '<br>')}</td>
        <td>
          <ol type="A" style="margin: 0; padding-left: 16px;">
            ${(k.pilihanJawaban || []).map(p => `<li>${p.replace(/^[A-E]\.\s*/, '')}</li>`).join('')}
          </ol>
        </td>
        <td style="text-align: center; font-weight: bold; color: #047857;">${k.kunciJawaban}</td>
        <td style="text-align: center; font-weight: bold;">${k.skor}</td>
      </tr>
    `).join('');

    // Naskah Soal Siswa
    const soalItems = usData.kisiKisi.map(s => `
      <div style="margin-bottom: 14px; page-break-inside: avoid;">
        <div style="font-size: 10pt; font-weight: 500;">
          <b>${s.nomorSoal}.</b> ${s.naskahSoal.replace(/\n/g, '<br>')}
        </div>
        <div style="margin-left: 20px; margin-top: 3px;">
          ${(s.pilihanJawaban || []).map(op => `<div style="font-size: 9.5pt; margin-bottom: 2px;">${op}</div>`).join('')}
        </div>
      </div>
    `).join('');

    // Kunci Jawaban Table Grid (Dynamic based on total questions)
    const totalQ = usData.kisiKisi.length;
    const currentOpsi = usData.identitas.jumlahOpsi || jumlahOpsi;
    const opsiLetters = ['A-C', 'A-D', 'A-E'][(currentOpsi || 5) - 3] || 'A-E';
    const rowsPerCol = Math.ceil(totalQ / 5);

    let kunciTableHtml = '';
    for (let i = 0; i < rowsPerCol; i++) {
      kunciTableHtml += '<tr>';
      for (let col = 0; col < 5; col++) {
        const no = i + 1 + (col * rowsPerCol);
        if (no <= totalQ) {
          const item = usData.kisiKisi.find(k => k.nomorSoal === no);
          kunciTableHtml += `
            <td style="text-align: center; font-weight: bold; background-color: #f9fafb;">${no}</td>
            <td style="text-align: center; font-weight: bold; color: #064e3b; font-size: 10.5pt;">${item?.kunciJawaban || '-'}</td>
          `;
        } else {
          kunciTableHtml += `
            <td style="background-color: #f9fafb;"></td>
            <td></td>
          `;
        }
      }
      kunciTableHtml += '</tr>';
    }

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Ujian_Sekolah_${mataPelajaran}_${kelasAkhir}</title>
        <style>
          @page { size: 215mm 330mm; margin: 1.2cm 1.5cm 1.2cm 1.5cm; }
          @page Section1 { size: 609.45pt 935.43pt; margin: 36pt 42.5pt 36pt 42.5pt; }
          div.Section1 { page: Section1; }
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10pt; line-height: 1.4; color: #111; }
          .header-box { text-align: center; border-bottom: 3px double #333; padding-bottom: 8px; margin-bottom: 14px; }
          table { border-collapse: collapse; width: 100%; margin-top: 8px; margin-bottom: 14px; }
          th { background-color: #f3f4f6; border: 1px solid #444; padding: 5px; font-size: 9pt; text-align: center; font-weight: bold; }
          td { border: 1px solid #666; padding: 4.5px; font-size: 8.5pt; vertical-align: top; }
          .signatures { margin-top: 30px; width: 100%; }
          .signatures td { border: none; text-align: center; width: 50%; font-size: 9.5pt; }
        </style>
      </head>
      <body>
        <!-- DOKUMEN 1: KISI-KISI 11 KOLOM -->
        <div data-f4-section="Bagian 1: Kisi-Kisi Ujian Sekolah (11 Kolom Baku)" data-f4-orientation="landscape">
          <div class="header-box">
            <div style="font-size: 13pt; font-weight: bold;">KISI-KISI UJIAN SEKOLAH / MADRASAH (US/UM)</div>
            <div style="font-size: 11pt; font-weight: bold;">MATA PELAJARAN: ${mataPelajaran.toUpperCase()}</div>
            <div style="font-size: 9.5pt; color: #444;">${namaSekolah} • KELAS ${kelasAkhir} • TAHUN PELAJARAN ${tahunPelajaran}</div>
            <div style="font-size: 8.5pt; color: #047857; margin-top: 2px;">Format 11 Kolom Baku Sesuai Standar Ujian • Total ${totalQ} Butir Pilihan Ganda (${currentOpsi} Opsi: ${opsiLetters})</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 3%;">No</th>
                <th style="width: 13%;">Tujuan Pembelajaran</th>
                <th style="width: 11%;">Ruang Lingkup Materi</th>
                <th style="width: 7%;">Level Kognitif</th>
                <th style="width: 14%;">Indikator Soal</th>
                <th style="width: 7%;">Bentuk</th>
                <th style="width: 4%;">No</th>
                <th style="width: 19%;">Naskah Soal</th>
                <th style="width: 13%;">Pilihan Jawaban</th>
                <th style="width: 5%;">Kunci</th>
                <th style="width: 4%;">Skor</th>
              </tr>
            </thead>
            <tbody>
              ${kisiRows}
            </tbody>
          </table>
        </div>

        <div style="page-break-before: always;"></div>

        <!-- DOKUMEN 2: LEMBAR NASKAH SOAL -->
        <div data-f4-section="Bagian 2: Lembar Naskah Soal Pilihan Ganda (${totalQ} Butir)" data-f4-orientation="portrait">
          <div class="header-box" data-f4-kop="true">
            <div style="font-size: 13pt; font-weight: bold;">LEMBAR NASKAH SOAL UJIAN SEKOLAH / MADRASAH</div>
            <div style="font-size: 11pt; font-weight: bold;">${namaSekolah.toUpperCase()}</div>
            <div style="font-size: 9.5pt; margin-top: 4px;">
              Mata Pelajaran: <b>${mataPelajaran}</b> &nbsp;|&nbsp; Tingkat/Kelas: <b>${kelasAkhir}</b><br>
              Tahun Pelajaran: <b>${tahunPelajaran}</b> &nbsp;|&nbsp; Waktu: <b>${alokasiWaktu}</b> &nbsp;|&nbsp; Bentuk: <b>Pilihan Ganda (${currentOpsi} Opsi: ${opsiLetters})</b> &nbsp;|&nbsp; Jumlah: <b>${totalQ} Butir</b>
            </div>
          </div>

          <div style="background-color: #f9fafb; border: 1px solid #d1d5db; padding: 8px 12px; margin-bottom: 16px; font-size: 9pt;">
            <b>PETUNJUK PENGERJAAN:</b>
            <ol style="margin: 4px 0 0 16px; padding: 0;">
              ${usData.petunjukPengerjaan.map(p => `<li>${p}</li>`).join('')}
            </ol>
          </div>

          <h4 style="text-align: left; background-color: #064e3b; color: white; padding: 6px 10px; margin-bottom: 12px;">
            SOAL PILIHAN GANDA (NOMOR 1 - ${totalQ}) • ${currentOpsi} PILIHAN (${opsiLetters})
          </h4>

          ${soalItems}
        </div>

        <div style="page-break-before: always;"></div>

        <!-- DOKUMEN 3: TABEL KUNCI JAWABAN & PEDOMAN PENSKORAN -->
        <div data-f4-section="Bagian 3: Tabel Kunci Jawaban & Pedoman Penskoran US/UM" data-f4-orientation="portrait">
          <div class="header-box">
            <div style="font-size: 13pt; font-weight: bold;">TABEL KUNCI JAWABAN DAN PEDOMAN PENSKORAN</div>
            <div style="font-size: 11pt; font-weight: bold;">UJIAN SEKOLAH / MADRASAH (US/UM)</div>
            <div style="font-size: 9.5pt; color: #444;">${namaSekolah} • ${mataPelajaran} • KELAS ${kelasAkhir} • ${totalQ} SOAL (${currentOpsi} OPSI)</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 10%;">No</th><th style="width: 10%;">Kunci</th>
                <th style="width: 10%;">No</th><th style="width: 10%;">Kunci</th>
                <th style="width: 10%;">No</th><th style="width: 10%;">Kunci</th>
                <th style="width: 10%;">No</th><th style="width: 10%;">Kunci</th>
                <th style="width: 10%;">No</th><th style="width: 10%;">Kunci</th>
              </tr>
            </thead>
            <tbody>
              ${kunciTableHtml}
            </tbody>
          </table>

          <div style="background-color: #ecfdf5; border: 1px solid #10b981; padding: 12px; margin-top: 16px; font-size: 9.5pt;">
            <b>PEDOMAN PENSKORAN:</b><br>
            • Setiap jawaban benar bernilai skor <b>1</b><br>
            • Jawaban salah atau kosong bernilai skor <b>0</b><br>
            • Total Skor Maksimal = <b>${totalQ}</b><br><br>
            <span style="font-size: 11pt; color: #064e3b; font-weight: bold;">
              Nilai Akhir Ujian Sekolah = (Total Skor Perolehan / ${totalQ}) × 100
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
                ........................, Mei 2026<br>
                Guru Penyusun Ujian Sekolah<br><br><br><br><br>
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
    if (!usData) return;
    const currentOpsi = usData.identitas.jumlahOpsi || jumlahOpsi;
    const wordContent = buildUsHtml();
    const filename = `Ujian_Sekolah_F4_${mataPelajaran.replace(/\s+/g, '_')}_${kelasAkhir.replace(/\s+/g, '_')}_${currentOpsi}Opsi.doc`;
    downloadDocFile(filename, wordContent);
  };

  // Download as F4 PDF (.pdf)
  const handleDownloadPdf = async () => {
    if (!usData || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const currentOpsi = usData.identitas.jumlahOpsi || jumlahOpsi;
      const docHtml = buildUsHtml();
      const fileName = `Ujian_Sekolah_F4_${mataPelajaran.replace(/\s+/g, '_')}_${kelasAkhir.replace(/\s+/g, '_')}_${currentOpsi}Opsi.pdf`;
      await downloadHtmlAsPdf(docHtml, fileName, 'portrait');
    } catch (err) {
      console.error('Error generating US F4 PDF:', err);
      printHtmlDocument(buildUsHtml(), `Ujian Sekolah F4 - ${mataPelajaran}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print F4 Document
  const handlePrint = () => {
    if (!usData) return;
    printHtmlDocument(buildUsHtml(), `Ujian Sekolah F4 - ${mataPelajaran} Kelas ${kelasAkhir}`);
  };

  // Copy structured text
  const handleCopyText = () => {
    if (!usData) return;
    const currentOpsi = usData.identitas.jumlahOpsi || jumlahOpsi;
    let text = `SOAL UJIAN SEKOLAH / MADRASAH (${usData.kisiKisi.length} BUTIR PG - ${currentOpsi} OPSI)\n`;
    text += `Mata Pelajaran: ${mataPelajaran}\nKelas: ${kelasAkhir}\nSekolah: ${namaSekolah}\n\n`;

    usData.kisiKisi.forEach(s => {
      text += `${s.nomorSoal}. [${s.levelKognitif}] (${s.ruangLingkupMateri})\n${s.naskahSoal}\n`;
      (s.pilihanJawaban || []).forEach(op => {
        text += `${op}\n`;
      });
      text += `Kunci: ${s.kunciJawaban}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Export JSON
  const handleExportJson = () => {
    if (!usData) return;
    const filename = `Ujian_Sekolah_${mataPelajaran.replace(/[^a-zA-Z0-9]/g, '_')}_${kelasAkhir.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    downloadJsonFile(filename, usData);
  };

  // Prompts for AI Modal
  const prompts = useMemo(() => {
    return getUjianSekolahPrompts({
      mataPelajaran,
      kelasAkhir,
      tujuanUmum,
      tujuanKelas7,
      tujuanKelas8,
      tujuanKelas9,
      namaSekolah,
      tahunPelajaran,
      alokasiWaktu,
      jumlahOpsi,
      jumlahSoal
    });
  }, [mataPelajaran, kelasAkhir, tujuanUmum, tujuanKelas7, tujuanKelas8, tujuanKelas9, namaSekolah, tahunPelajaran, alokasiWaktu, jumlahOpsi, jumlahSoal]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-lg border border-teal-600/30">
        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-teal-500/30 text-teal-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-teal-400/30 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              Generator Ujian Sekolah / Madrasah (US/UM)
            </span>
            <span className="bg-emerald-500/20 text-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              {jumlahSoal} Soal PG • {jumlahOpsi} Opsi ({['A-C', 'A-D', 'A-E'][jumlahOpsi - 3]}) • Kisi-Kisi 11 Kolom
            </span>
            <span className="bg-amber-500/20 text-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-400/30">
              Jenjang: {jenjang}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Instrumen Ujian Sekolah / Madrasah (US / UM)
          </h2>
          <p className="text-emerald-100/90 text-sm md:text-base mt-2 leading-relaxed">
            Menyusun paket naskah Ujian Sekolah komprehensif akhir jenjang ({jumlahSoal} Butir Pilihan Ganda {jumlahOpsi} Opsi [{['A-C', 'A-D', 'A-E'][jumlahOpsi - 3]}], dominan level C3–C5 HOTS). Mendukung 
            <span className="font-semibold text-white"> Versi 1 (Umum 1 Jenjang)</span> dan 
            <span className="font-semibold text-white"> Versi 2 (Berjenjang: Kelas 7 No 1-10, Kelas 8 No 11-30, Kelas 9 No 31-50)</span>, lengkap dengan Tabel Kisi-Kisi 11 Kolom Baku, Naskah Soal, dan Kunci Jawaban.
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={handleGenerateUS}
              disabled={isGenerating}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyusun {jumlahSoal} Soal ({jumlahOpsi} Opsi)...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  Generate Ujian Sekolah AI
                </>
              )}
            </button>

            <button
              onClick={handleExportWord}
              disabled={!usData}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
              title="Unduh file Microsoft Word (.doc) ukuran F4 rapi berisi Kisi-Kisi 11 Kolom, Naskah Soal, & Kunci Jawaban"
            >
              <Download className="w-4 h-4" />
              Unduh Word (.doc)
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={!usData || isExportingPdf}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
              title="Unduh file PDF ukuran F4 (215mm x 330mm) per bagian atau gabungan siap cetak"
            >
              <FileText className="w-4 h-4" />
              {isExportingPdf ? 'Memproses PDF F4...' : 'Unduh PDF Per Bagian (F4)'}
            </button>

            <button
              onClick={handlePrint}
              disabled={!usData}
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

      {/* Configuration & Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
        
        {/* Top Control Bar: Jenjang Preset & Mode Prompt */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-800 text-base">
              Konfigurasi Ujian Sekolah / Madrasah
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Preset Jenjang Cepat */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Preset:</span>
              {(['SMP', 'SD', 'SMA'] as const).map(j => (
                <button
                  key={j}
                  type="button"
                  onClick={() => handleApplyJenjang(j)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    jenjangMode === j
                      ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {j === 'SMP' ? 'SMP/MTs' : j === 'SD' ? 'SD/MI' : 'SMA/MA'}
                </button>
              ))}
            </div>

            {/* Mode Switcher: Versi 1 vs Versi 2 */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setVersiPrompt('versi_1')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  versiPrompt === 'versi_1'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Versi 1 (Umum)
              </button>
              <button
                type="button"
                onClick={() => setVersiPrompt('versi_2')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  versiPrompt === 'versi_2'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Versi 2 (Berjenjang)
              </button>
            </div>
          </div>
        </div>

        {/* Identitas Soal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
            <input
              type="text"
              value={mataPelajaran}
              onChange={e => setMataPelajaran(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Akhir & Jenjang</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={kelasAkhir}
                onChange={e => setKelasAkhir(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <input
                type="text"
                value={jenjang}
                onChange={e => setJenjang(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Satuan Pendidikan</label>
            <input
              type="text"
              value={namaSekolah}
              onChange={e => setNamaSekolah(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Ajaran & Waktu</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={tahunPelajaran}
                onChange={e => setTahunPelajaran(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <input
                type="text"
                value={alokasiWaktu}
                onChange={e => setAlokasiWaktu(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* PENGATURAN JUMLAH OPSI PG & JUMLAH SOAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-teal-50/50 p-4 rounded-xl border border-teal-100">
          
          {/* Jumlah Opsi Pilihan Ganda (PG) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-700" />
                Jumlah Opsi Pilihan Ganda (PG)
              </label>
              <span className="text-[11px] font-extrabold text-teal-800 bg-teal-100/90 px-2.5 py-0.5 rounded-full border border-teal-300">
                {jumlahOpsi} Pilihan ({['A, B, C', 'A, B, C, D', 'A, B, C, D, E'][jumlahOpsi - 3]})
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleOptionChange(3)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  jumlahOpsi === 3
                    ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'
                }`}
              >
                <div className="font-extrabold text-sm flex items-center justify-between">
                  3 Opsi
                  {jumlahOpsi === 3 && <CheckCircle2 className="w-3.5 h-3.5 fill-white text-teal-700" />}
                </div>
                <div className={`text-[10px] mt-0.5 ${jumlahOpsi === 3 ? 'text-teal-100' : 'text-slate-500'}`}>
                  (A, B, C) • SD Kelas Awal
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOptionChange(4)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  jumlahOpsi === 4
                    ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'
                }`}
              >
                <div className="font-extrabold text-sm flex items-center justify-between">
                  4 Opsi
                  {jumlahOpsi === 4 && <CheckCircle2 className="w-3.5 h-3.5 fill-white text-teal-700" />}
                </div>
                <div className={`text-[10px] mt-0.5 ${jumlahOpsi === 4 ? 'text-teal-100' : 'text-slate-500'}`}>
                  (A, B, C, D) • Standar SD & SMP
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOptionChange(5)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  jumlahOpsi === 5
                    ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'
                }`}
              >
                <div className="font-extrabold text-sm flex items-center justify-between">
                  5 Opsi
                  {jumlahOpsi === 5 && <CheckCircle2 className="w-3.5 h-3.5 fill-white text-teal-700" />}
                </div>
                <div className={`text-[10px] mt-0.5 ${jumlahOpsi === 5 ? 'text-teal-100' : 'text-slate-500'}`}>
                  (A, B, C, D, E) • Standar SMA / US
                </div>
              </button>
            </div>
          </div>

          {/* Jumlah Butir Soal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-teal-700" />
                Jumlah Butir Soal Ujian
              </label>
              <span className="text-[11px] font-extrabold text-teal-800 bg-teal-100/90 px-2.5 py-0.5 rounded-full border border-teal-300">
                {jumlahSoal} Butir Soal
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[20, 25, 30, 40, 50].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleQuestionCountChange(count)}
                  className={`flex-1 py-2 rounded-xl text-center border font-bold text-xs transition-all cursor-pointer ${
                    jumlahSoal === count
                      ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  {count}
                  <span className="block text-[9px] font-normal opacity-80">Soal</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Tujuan Pembelajaran Berdasarkan Versi */}
        {versiPrompt === 'versi_1' ? (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                Seluruh Tujuan Pembelajaran / Capaian Pembelajaran Utama Satu Jenjang
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">Total {jumlahSoal} Soal ({jumlahOpsi} Opsi: {['A-C', 'A-D', 'A-E'][jumlahOpsi - 3]})</span>
            </div>
            <textarea
              rows={4}
              value={tujuanUmum}
              onChange={e => setTujuanUmum(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
              placeholder="Masukkan seluruh tujuan pembelajaran atau CP utama yang diujikan..."
            />
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-teal-800 block mb-1.5">
                1. Tujuan Kelas 7 / Awal Jenjang (Soal No. 1 - {Math.round(jumlahSoal * 0.2)})
              </span>
              <textarea
                rows={3}
                value={tujuanKelas7}
                onChange={e => setTujuanKelas7(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="Tujuan pembelajaran tahap awal..."
              />
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-emerald-800 block mb-1.5">
                2. Tujuan Kelas 8 / Tengah Jenjang (Soal No. {Math.round(jumlahSoal * 0.2) + 1} - {Math.round(jumlahSoal * 0.6)})
              </span>
              <textarea
                rows={3}
                value={tujuanKelas8}
                onChange={e => setTujuanKelas8(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="Tujuan pembelajaran tahap tengah..."
              />
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-indigo-800 block mb-1.5">
                3. Tujuan Kelas 9 / Akhir Jenjang (Soal No. {Math.round(jumlahSoal * 0.6) + 1} - {jumlahSoal})
              </span>
              <textarea
                rows={3}
                value={tujuanKelas9}
                onChange={e => setTujuanKelas9(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="Tujuan pembelajaran tahap akhir..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Soal PG</span>
          <span className="text-xl font-extrabold text-slate-900">{stats.total} Butir</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] uppercase font-bold text-amber-600 block">Opsi Pilihan Ganda</span>
          <span className="text-xl font-extrabold text-amber-700">{jumlahOpsi} Pilihan ({['A-C', 'A-D', 'A-E'][jumlahOpsi - 3]})</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] uppercase font-bold text-teal-600 block">Tahap Awal Jenjang</span>
          <span className="text-xl font-extrabold text-teal-700">{stats.k7} Soal</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-600 block">Tahap Tengah Jenjang</span>
          <span className="text-xl font-extrabold text-emerald-700">{stats.k8} Soal</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] uppercase font-bold text-indigo-600 block">Tahap Akhir Jenjang</span>
          <span className="text-xl font-extrabold text-indigo-700">{stats.k9} Soal</span>
        </div>
      </div>

      {/* Tabs Navigation & Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('kisi_kisi')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'kisi_kisi'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            1. Tabel Kisi-Kisi (11 Kolom Baku)
          </button>
          <button
            onClick={() => setActiveSubTab('lembar_soal')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'lembar_soal'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            2. Lembar Naskah 50 Soal PG (A-E)
          </button>
          <button
            onClick={() => setActiveSubTab('kunci_jawaban')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'kunci_jawaban'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            3. Tabel Kunci Jawaban
          </button>
        </div>

        {/* Filter & Search */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'kisi_kisi' && (
            <select
              value={filterKelas}
              onChange={e => setFilterKelas(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-semibold"
            >
              <option value="all">Semua Tingkat</option>
              <option value="VII">Kelas VII (1-10)</option>
              <option value="VIII">Kelas VIII (11-30)</option>
              <option value="IX">Kelas IX (31-50)</option>
            </select>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari materi/soal..."
              className="text-xs pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 w-44"
            />
          </div>

          <button
            onClick={handleCopyText}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 font-semibold cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
            {isCopied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 print:p-0 print:border-none print:shadow-none">
        
        {/* SUBTAB 1: KISI-KISI 11 KOLOM */}
        {activeSubTab === 'kisi_kisi' && (
          <div className="space-y-4">
            <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
              <h3 className="text-lg font-extrabold uppercase text-slate-900">
                KISI-KISI UJIAN SEKOLAH / MADRASAH (US/UM)
              </h3>
              <p className="text-xs font-semibold text-teal-800 uppercase">
                {mataPelajaran} • KELAS {kelasAkhir} • TAHUN AJARAN {tahunPelajaran}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Format 11 Kolom Baku: No, TP, Ruang Lingkup Materi, Level Kognitif, Indikator Soal, Bentuk Soal, No Soal, Naskah Soal, Pilihan Jawaban, Kunci Jawaban, Skor
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wide">
                    <th className="py-2.5 px-2 border-r border-slate-200 w-10 text-center">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-44">Tujuan Pembelajaran</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-36">Ruang Lingkup Materi</th>
                    <th className="py-2.5 px-2 border-r border-slate-200 w-24 text-center">Level Kognitif</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-44">Indikator Soal</th>
                    <th className="py-2.5 px-2 border-r border-slate-200 w-20 text-center">Bentuk</th>
                    <th className="py-2.5 px-2 border-r border-slate-200 w-12 text-center">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-56">Naskah Soal</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-48">Pilihan Jawaban</th>
                    <th className="py-2.5 px-2 border-r border-slate-200 w-14 text-center">Kunci</th>
                    <th className="py-2.5 px-2 w-12 text-center">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {filteredKisiKisi.map((k, idx) => (
                    <tr key={k.no} className="hover:bg-teal-50/20 transition-colors">
                      <td className="py-2.5 px-2 border-r border-slate-200 text-center font-medium text-slate-500 align-top">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 align-top leading-relaxed">
                        {k.tingkatKelas && (
                          <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded-sm mb-1">
                            {k.tingkatKelas}
                          </span>
                        )}
                        <div>{k.tujuanPembelajaran}</div>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900 align-top">
                        {k.ruangLingkupMateri}
                      </td>
                      <td className="py-2.5 px-2 border-r border-slate-200 text-center align-top font-semibold text-indigo-700">
                        {k.levelKognitif}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600 align-top leading-relaxed">
                        {k.indikatorSoal}
                      </td>
                      <td className="py-2.5 px-2 border-r border-slate-200 text-center align-top font-semibold text-slate-600">
                        {k.bentukSoal}
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
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 align-top text-[11px] space-y-0.5 text-slate-600">
                        {(k.pilihanJawaban || []).map(op => (
                          <div key={op}>{op}</div>
                        ))}
                      </td>
                      <td className="py-2.5 px-2 border-r border-slate-200 text-center align-top font-extrabold text-emerald-700 bg-emerald-50/40">
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

        {/* SUBTAB 2: LEMBAR NASKAH 50 SOAL SISWA */}
        {activeSubTab === 'lembar_soal' && (
          <div className="space-y-6">
            {/* Kop Ujian */}
            <div className="text-center border-b-2 border-slate-900 pb-4">
              <h2 className="text-lg md:text-xl font-extrabold uppercase text-slate-900 tracking-tight">
                LEMBAR SOAL UJIAN SEKOLAH / MADRASAH (US/UM)
              </h2>
              <h3 className="text-base font-bold text-teal-800 uppercase mt-0.5">
                {namaSekolah}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>Mata Pelajaran: <b className="text-slate-800">{mataPelajaran}</b></div>
                <div>Tingkat / Kelas: <b className="text-slate-800">{kelasAkhir}</b></div>
                <div>Tahun Pelajaran: <b className="text-slate-800">{tahunPelajaran}</b></div>
                <div>Waktu: <b className="text-slate-800">{alokasiWaktu}</b> (50 Soal PG)</div>
              </div>
            </div>

            {/* Petunjuk Pengerjaan */}
            <div className="bg-teal-50/60 border border-teal-200 p-4 rounded-xl text-xs text-slate-700">
              <span className="font-bold text-teal-900 block mb-1.5 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-teal-700" />
                PETUNJUK PENGERJAAN SOAL:
              </span>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                {usData?.petunjukPengerjaan.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ol>
            </div>

            {/* 50 Soal PG List */}
            <div className="space-y-6">
              {usData?.kisiKisi.map(s => (
                <div key={s.nomorSoal} className="border-b border-slate-100 pb-5">
                  <div className="flex items-start gap-2.5 text-sm text-slate-900 leading-relaxed font-medium">
                    <span className="font-extrabold text-teal-800 w-7 shrink-0 text-base">{s.nomorSoal}.</span>
                    <div className="flex-1">
                      {s.naskahSoal.includes('[Gambar:') ? (
                        <div className="bg-sky-50 border border-sky-300 text-sky-900 p-3 rounded-xl mb-3 text-xs italic">
                          <b>📸 PANDUAN GAMBAR SOAL UJIAN:</b><br />
                          {s.naskahSoal.split('\n\n')[0]}
                        </div>
                      ) : null}
                      <div>{s.naskahSoal.replace(/\[Gambar:.*?\]\n\n?/, '')}</div>

                      {s.pilihanJawaban && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pt-2">
                          {s.pilihanJawaban.map(op => (
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
        )}

        {/* SUBTAB 3: TABEL KUNCI JAWABAN */}
        {activeSubTab === 'kunci_jawaban' && (
          <div className="space-y-6">
            <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-extrabold uppercase text-slate-900">
                TABEL KUNCI JAWABAN UJIAN SEKOLAH / MADRASAH
              </h3>
              <p className="text-xs font-semibold text-teal-800 uppercase">
                {mataPelajaran} • KELAS {kelasAkhir} • TAHUN PELAJARAN {tahunPelajaran}
              </p>
            </div>

            {/* Keys Grid */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Matriks Kunci Jawaban Lengkap (Nomor 1 - {usData?.kisiKisi.length || jumlahSoal}) • Skor 1 Per Soal
              </h4>
              <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2 text-center text-xs">
                {usData?.kisiKisi.map(s => (
                  <div key={s.nomorSoal} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">No. {s.nomorSoal}</span>
                    <span className="font-extrabold text-teal-800 text-base">{s.kunciJawaban}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Formula Pedoman Penskoran */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 p-5 rounded-2xl text-xs text-slate-800">
              <h4 className="font-extrabold text-sm text-teal-950 mb-2">
                PEDOMAN PENSKORAN & PERHITUNGAN NILAI AKHIR:
              </h4>
              <ul className="list-disc list-inside space-y-1 mb-3 text-slate-700">
                <li>Setiap jawaban yang benar bernilai skor <b>1</b>.</li>
                <li>Jawaban yang salah atau tidak diisi bernilai skor <b>0</b>.</li>
                <li>Total Skor Maksimal = <b>{usData?.kisiKisi.length || jumlahSoal}</b>.</li>
              </ul>
              <div className="p-3 bg-teal-700 text-white font-extrabold text-sm rounded-xl text-center shadow-xs">
                Nilai Akhir Ujian Sekolah = (Total Skor Perolehan / {usData?.kisiKisi.length || jumlahSoal}) × 100
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
                <p className="text-slate-500 mb-1">Ditetapkan di Sekolah, Mei 2026</p>
                <p className="font-bold text-slate-800">Guru Penyusun Ujian Sekolah</p>
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
        title="Prompt AI Master Ujian Sekolah / Madrasah (US/UM)"
        subtitle="Prompt instruksi terstruktur untuk Google Gemini & ChatGPT sesuai format baku Versi 1 dan Versi 2"
        tabs={prompts}
        jsonData={usData}
        jsonFilename={`Ujian_Sekolah_${mataPelajaran.replace(/\s+/g, '_')}_${kelasAkhir.replace(/\s+/g, '_')}.json`}
      />
    </div>
  );
};
export default UjianSekolahGeneratorView;
