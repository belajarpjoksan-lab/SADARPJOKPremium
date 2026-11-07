import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CalendarDays,
  FileText,
  Download,
  Printer,
  Sparkles,
  Copy,
  Check,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  School,
  UserCheck,
  CheckCircle2,
  Clock,
  BookOpen,
  Share2,
  Info,
  Maximize2
} from 'lucide-react';
import { JurnalMapelData, JurnalMapelDay, JurnalMapelRow } from '../types';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import AiPromptModal from './AiPromptModal';
import { getJurnalSatuMapelPrompts } from '../utils/aiPromptGenerators';
import { downloadJsonFile, downloadDocFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';

export const JurnalSatuMapelView: React.FC = () => {
  // --- Form Inputs State ---
  const [mataPelajaran, setMataPelajaran] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)');
  const [namaSekolah, setNamaSekolah] = useState('SD Negeri Kalimantong');
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  const [semester, setSemester] = useState('Semester 1 (Ganjil)');
  const [namaGuru, setNamaGuru] = useState('Budi Santoso, S.Pd., Gr.');
  const [nipGuru, setNipGuru] = useState('19880315 201402 1 003');
  const [namaKepalaSekolah, setNamaKepalaSekolah] = useState('Drs. H. Ahmad Dahlan, M.Pd.');
  const [nipKepalaSekolah, setNipKepalaSekolah] = useState('19720510 199803 1 002');
  const [rentangJadwal, setRentangJadwal] = useState('14 Juli 2025 - 30 September 2025');
  const [asumsiSiswa, setAsumsiSiswa] = useState<number>(32);

  // Target Jenjang & TP
  const [jenjangMode, setJenjangMode] = useState<'SMP' | 'SD' | 'SMA'>('SMP');
  const [tujuanKelas7, setTujuanKelas7] = useState('Mempraktikkan dan menganalisis gerak spesifik passing bawah dan passing atas permainan bola voli, serta memelihara kebugaran jasmani');
  const [tujuanKelas8, setTujuanKelas8] = useState('Mempraktikkan dan menganalisis variasi dan kombinasi gerak spesifik servis bawah/atas dan spike pada permainan bola voli secara disiplin');
  const [tujuanKelas9, setTujuanKelas9] = useState('Merancang dan mempraktikkan taktik dan strategi penyerangan dan pertahanan bola voli sederhana secara kolaboratif');
  const [jadwalMingguan, setJadwalMingguan] = useState('Senin jam 1-2 kelas VII A, Senin jam 3-4 kelas VII B; Selasa jam 1-2 kelas VIII A, Selasa jam 3-4 kelas VIII B; Rabu jam 1-2 kelas IX A, Kamis jam 1-2 kelas IX B');

  // Generation & View State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [jurnalData, setJurnalData] = useState<JurnalMapelData | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'per_day' | 'unified'>('per_day');

  // Quick Preset Handlers
  const handleApplyPreset = (mode: 'SMP' | 'SD' | 'SMA') => {
    setJenjangMode(mode);
    if (mode === 'SMP') {
      setTujuanKelas7('Mempraktikkan dan menganalisis gerak spesifik passing bawah dan passing atas permainan bola voli, serta memelihara kebugaran jasmani');
      setTujuanKelas8('Mempraktikkan dan menganalisis variasi dan kombinasi gerak spesifik servis bawah/atas dan spike pada permainan bola voli secara disiplin');
      setTujuanKelas9('Merancang dan mempraktikkan taktik dan strategi penyerangan dan pertahanan bola voli sederhana secara kolaboratif');
      setJadwalMingguan('Senin jam 1-2 kelas VII A, Senin jam 3-4 kelas VII B; Selasa jam 1-2 kelas VIII A, Selasa jam 3-4 kelas VIII B; Rabu jam 1-2 kelas IX A, Kamis jam 1-2 kelas IX B');
    } else if (mode === 'SD') {
      setTujuanKelas7('Mempraktikkan variasi pola gerak dasar lokomotor dan manipulatif melempar & menangkap bola kasti');
      setTujuanKelas8('Mempraktikkan kombinasi gerak dasar lokomotor, non-lokomotor, dan manipulatif permainan kasti mini');
      setTujuanKelas9('Mempraktikkan latihan kebugaran jasmani daya tahan dan kelincahan dalam sirkuit pos menyenangkan');
      setJadwalMingguan('Senin jam 1-2 kelas IV A; Selasa jam 1-2 kelas V A; Rabu jam 1-2 kelas VI A; Kamis jam 1-2 kelas IV B; Jumat jam 1-2 kelas V B');
    } else {
      setTujuanKelas7('Mengevaluasi keterampilan teknik dan taktik penyerangan/pertahanan sepak bola atau bola voli');
      setTujuanKelas8('Merancang strategi permainan invasi dan pembinaan gaya hidup aktif preventif');
      setTujuanKelas9('Mengembangkan program kebugaran jasmani pribadi terukur dan manajemen pencegahan cedera');
      setJadwalMingguan('Senin jam 1-3 kelas X-1; Selasa jam 1-3 kelas XI-1; Rabu jam 1-3 kelas XII-1; Kamis jam 1-3 kelas X-2');
    }
  };

  // Generate Action (API with robust fallback)
  const handleGenerateJurnal = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-jurnal-mapel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mataPelajaran,
          namaSekolah,
          tahunPelajaran,
          semester,
          namaGuru,
          nipGuru,
          namaKepalaSekolah,
          nipKepalaSekolah,
          rentangJadwal,
          asumsiSiswa,
          tujuanKelas7,
          tujuanKelas8,
          tujuanKelas9,
          jadwalMingguan
        })
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi server generator.');
      }

      const data: JurnalMapelData = await response.json();
      setJurnalData(data);
    } catch (err: any) {
      console.warn('API error, using client-side generated dataset:', err);
      // Fallback fallback generator directly
      triggerClientFallback();
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerClientFallback = () => {
    // Generate immediate client fallback so user is never blocked
    const dummyDays: JurnalMapelDay[] = [
      {
        hariTanggal: 'Senin, 14 Juli 2025',
        catatanHarian: 'KBM Pembuka Semester Ganjil berlangsung aman dan tertib.',
        rows: [
          {
            id: 'r1',
            hariTanggal: 'Senin, 14 Juli 2025',
            jamKe: '1 - 2 (07.00 - 08.20)',
            kelas: 'VII A',
            tujuan: tujuanKelas7,
            materiPokok: 'Permainan Bola Voli (Passing Bawah)',
            rincianMateri: '1. Berbaris di lapangan, doa, presensi; 2. Pemanasan statis & dinamis 10 menit; 3. Demonstrasi kuda-kuda dan kaitan kedua tangan; 4. Drill berpasangan passing bawah jarak 3 meter; 5. Pendinginan dan refleksi nilai disiplin.',
            hasil: 'KBM berjalan sangat tertib dan lancar. 90% siswa sudah tepat pada posisi perkenaan bola di lengan bawah.',
            hadir: asumsiSiswa - 1,
            tidakHadir: '1 (Sakit: Ahmad Z.)',
            keterangan: 'Pemateri: Guru Mapel'
          },
          {
            id: 'r2',
            hariTanggal: 'Senin, 14 Juli 2025',
            jamKe: '3 - 4 (08.20 - 09.40)',
            kelas: 'VII B',
            tujuan: tujuanKelas7,
            materiPokok: 'Permainan Bola Voli (Passing Bawah)',
            rincianMateri: '1. Presensi & cek kesiapan seragam olahraga; 2. Pemanasan lari keliling lapangan 3 putaran; 3. Drill passing bawah lambung mandiri; 4. Latihan estafet passing regu kecil; 5. Refleksi dan penutupan.',
            hasil: 'KBM terlaksana dengan baik dan gembira. Siswa aktif mencoba variasi dorongan kaki saat menyentuh bola.',
            hadir: asumsiSiswa,
            tidakHadir: '0 (Nihil)',
            keterangan: 'Pemateri: Guru Mapel'
          }
        ]
      },
      {
        hariTanggal: 'Selasa, 15 Juli 2025',
        catatanHarian: 'Kegiatan outdoor lapangan utama.',
        rows: [
          {
            id: 'r3',
            hariTanggal: 'Selasa, 15 Juli 2025',
            jamKe: '1 - 2 (07.00 - 08.20)',
            kelas: 'VIII A',
            tujuan: tujuanKelas8,
            materiPokok: 'Permainan Bola Voli (Variasi Servis Bawah & Passing)',
            rincianMateri: '1. Apersepsi keselamatan; 2. Pemanasan kelenturan bahu; 3. Latihan akurasi servis bawah melewati net; 4. Kombinasi servis bawah dilanjutkan penerimaan passing bawah lawan; 5. Pendinginan.',
            hasil: 'KBM berlangsung lancar. Siswa mampu mengontrol ketinggian bola servis agar tidak keluar garis batas.',
            hadir: asumsiSiswa - 1,
            tidakHadir: '1 (Izin: Dina S.)',
            keterangan: 'Pemateri: Guru Mapel'
          },
          {
            id: 'r4',
            hariTanggal: 'Selasa, 15 Juli 2025',
            jamKe: '3 - 4 (08.20 - 09.40)',
            kelas: 'VIII B',
            tujuan: tujuanKelas8,
            materiPokok: 'Permainan Bola Voli (Variasi Servis Bawah & Passing)',
            rincianMateri: '1. Doa dan presensi; 2. Pemanasan dinamis shuttle run; 3. Latihan servis bawah bertahap dari jarak 6 meter ke 9 meter; 4. Mini game 4 vs 4; 5. Refleksi sportivitas.',
            hasil: 'KBM berjalan aktif dan kompetitif sehat. Seluruh regu menjunjung tinggi fair play.',
            hadir: asumsiSiswa,
            tidakHadir: '0 (Nihil)',
            keterangan: 'Pemateri: Guru Mapel'
          }
        ]
      },
      {
        hariTanggal: 'Rabu, 16 Juli 2025',
        catatanHarian: 'Penguatan formasi penyerangan.',
        rows: [
          {
            id: 'r5',
            hariTanggal: 'Rabu, 16 Juli 2025',
            jamKe: '1 - 2 (07.00 - 08.20)',
            kelas: 'IX A',
            tujuan: tujuanKelas9,
            materiPokok: 'Taktik Penyerangan dan Rotasi Posisi Bola Voli',
            rincianMateri: '1. Apersepsi formasi W dalam pertahanan servis; 2. Pemanasan dinamis; 3. Drill alur passing-tosser-smash pelan; 4. Game simulasi 6 lawan 6 dengan aturan rotasi; 5. Pendinginan.',
            hasil: 'KBM berlangsung sangat dinamis. Komunikasi antarpemain di lapangan terjalin efektif.',
            hadir: asumsiSiswa - 2,
            tidakHadir: '2 (1 Sakit, 1 Izin)',
            keterangan: 'Pemateri: Guru Mapel'
          }
        ]
      },
      {
        hariTanggal: 'Kamis, 17 Juli 2025',
        catatanHarian: 'Latihan tuntas target pekan 1.',
        rows: [
          {
            id: 'r6',
            hariTanggal: 'Kamis, 17 Juli 2025',
            jamKe: '1 - 2 (07.00 - 08.20)',
            kelas: 'IX B',
            tujuan: tujuanKelas9,
            materiPokok: 'Taktik Penyerangan dan Rotasi Posisi Bola Voli',
            rincianMateri: '1. Doa dan cek kebugaran siswa; 2. Pemanasan kelincahan footwork; 3. Drill penyerangan cepat; 4. Game bola voli 6 vs 6; 5. Evaluasi dan pendinginan.',
            hasil: 'KBM terlaksana sukses. Siswa menunjukkan pemahaman posisi peran pengumpan dan penyerang.',
            hadir: asumsiSiswa,
            tidakHadir: '0 (Nihil)',
            keterangan: 'Pemateri: Guru Mapel'
          }
        ]
      }
    ];

    setJurnalData({
      identitas: {
        mataPelajaran,
        namaSekolah,
        tahunPelajaran,
        semester,
        namaGuru,
        nipGuru,
        namaKepalaSekolah,
        nipKepalaSekolah,
        rentangJadwal,
        asumsiTotalSiswaPerKelas: asumsiSiswa
      },
      tujuanPembelajaranPerKelas: [
        { kelas: 'Kelas VII', tujuanList: [tujuanKelas7] },
        { kelas: 'Kelas VIII', tujuanList: [tujuanKelas8] },
        { kelas: 'Kelas IX', tujuanList: [tujuanKelas9] }
      ],
      jadwalMingguanSummary: jadwalMingguan,
      hariList: dummyDays,
      ringkasanKbm: {
        totalPertemuan: 6,
        totalHadirRataRata: `${asumsiSiswa - 1} Siswa / Pertemuan`,
        persentaseKetercapaian: '98.2%',
        catatanUmum: 'Seluruh KBM satu mapel terlaksana berkesinambungan sesuai kalender akademik.'
      }
    });
  };

  // If no data generated yet, initialize with default view
  React.useEffect(() => {
    if (!jurnalData) {
      handleGenerateJurnal();
    }
  }, []);

  // Filtered Rows computation
  const filteredDays = useMemo(() => {
    if (!jurnalData) return [];
    return jurnalData.hariList
      .map(day => {
        const filteredRows = day.rows.filter(row => {
          const matchClass = selectedClassFilter === 'all' || row.kelas.toLowerCase().includes(selectedClassFilter.toLowerCase());
          const matchQuery = !searchQuery || 
            row.materiPokok.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.tujuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.rincianMateri.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.hasil.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.hariTanggal.toLowerCase().includes(searchQuery.toLowerCase());
          return matchClass && matchQuery;
        });
        return {
          ...day,
          rows: filteredRows
        };
      })
      .filter(day => day.rows.length > 0);
  }, [jurnalData, selectedClassFilter, searchQuery]);

  // Unique classes for filter dropdown
  const classOptions = useMemo(() => {
    if (!jurnalData) return [];
    const set = new Set<string>();
    jurnalData.hariList.forEach(day => {
      day.rows.forEach(r => set.add(r.kelas));
    });
    return Array.from(set).sort();
  }, [jurnalData]);

  // Total statistics
  const stats = useMemo(() => {
    if (!jurnalData) return { totalDays: 0, totalRows: 0, avgAttendance: 0 };
    let rowsCount = 0;
    let hadirSum = 0;
    jurnalData.hariList.forEach(day => {
      rowsCount += day.rows.length;
      day.rows.forEach(r => {
        hadirSum += Number(r.hadir) || 0;
      });
    });
    return {
      totalDays: jurnalData.hariList.length,
      totalRows: rowsCount,
      avgAttendance: rowsCount > 0 ? (hadirSum / rowsCount).toFixed(1) : 0
    };
  }, [jurnalData]);

  // Build Print-Ready F4 Landscape HTML for Word & PDF
  const buildJurnalHtml = (): string => {
    if (!jurnalData) return '';

    let tableHtml = '';
    jurnalData.hariList.forEach((day) => {
      tableHtml += `
        <h4 style="margin-top: 16px; margin-bottom: 6px; color: #064e3b; font-size: 11pt; border-bottom: 2px solid #059669; padding-bottom: 3px;">
          📅 Tabel KBM: ${day.hariTanggal}
        </h4>
        <table border="1" cellpadding="6" cellspacing="0" class="kbm-table" style="border-collapse: collapse; width: 100%; margin-bottom: 12px; font-size: 9pt;">
          <thead>
            <tr style="background-color: #e6f4ea; color: #134e4a; text-align: center; font-weight: bold;">
              <th style="width: 11%; border: 1px solid #475569; padding: 6px;">Hari/Tanggal</th>
              <th style="width: 8%; border: 1px solid #475569; padding: 6px;">Jam ke-</th>
              <th style="width: 7%; border: 1px solid #475569; padding: 6px;">Kelas</th>
              <th style="width: 15%; border: 1px solid #475569; padding: 6px;">Tujuan</th>
              <th style="width: 13%; border: 1px solid #475569; padding: 6px;">Materi Pokok</th>
              <th style="width: 20%; border: 1px solid #475569; padding: 6px;">Rincian Materi</th>
              <th style="width: 11%; border: 1px solid #475569; padding: 6px;">Hasil</th>
              <th style="width: 5%; border: 1px solid #475569; padding: 6px;">Hadir</th>
              <th style="width: 5%; border: 1px solid #475569; padding: 6px;">Tidak Hadir</th>
              <th style="width: 5%; border: 1px solid #475569; padding: 6px;">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${day.rows.map(r => `
              <tr>
                <td style="text-align: center; border: 1px solid #64748b; padding: 5px;">${r.hariTanggal}</td>
                <td style="text-align: center; border: 1px solid #64748b; padding: 5px;">${r.jamKe}</td>
                <td style="text-align: center; font-weight: bold; border: 1px solid #64748b; padding: 5px;">${r.kelas}</td>
                <td style="border: 1px solid #64748b; padding: 5px;">${r.tujuan}</td>
                <td style="border: 1px solid #64748b; padding: 5px;"><b>${r.materiPokok}</b></td>
                <td style="border: 1px solid #64748b; padding: 5px;">${r.rincianMateri}</td>
                <td style="border: 1px solid #64748b; padding: 5px;">${r.hasil}</td>
                <td style="text-align: center; font-weight: bold; border: 1px solid #64748b; padding: 5px;">${r.hadir}</td>
                <td style="text-align: center; border: 1px solid #64748b; padding: 5px;">${r.tidakHadir}</td>
                <td style="text-align: center; border: 1px solid #64748b; padding: 5px;">${r.keterangan}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${day.catatanHarian ? `<p style="font-size: 8.5pt; font-style: italic; color: #555; margin-top: -6px; margin-bottom: 14px;">Catatan Harian: ${day.catatanHarian}</p>` : ''}
      `;
    });

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Jurnal Harian Guru - ${mataPelajaran}</title>
        <style>
          @page {
            size: 330mm 215mm;
            margin: 1.0cm 1.2cm 1.0cm 1.2cm;
          }
          @page Section1 {
            size: 935.43pt 609.45pt;
            margin: 28.35pt 34pt 28.35pt 34pt;
            mso-page-orientation: landscape;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-size: 9.5pt;
            line-height: 1.35;
            color: #111;
          }
          .header-box {
            text-align: center;
            border-bottom: 3px double #333;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }
          .header-title {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header-sub {
            font-size: 11pt;
            font-weight: bold;
            margin-top: 2px;
          }
          .header-meta {
            font-size: 9.5pt;
            color: #444;
            margin-top: 2px;
          }
          .identitas-table {
            width: 100%;
            margin-bottom: 14px;
            font-size: 9.5pt;
          }
          .identitas-table td {
            padding: 3px 0;
            vertical-align: top;
          }
          .signatures {
            margin-top: 30px;
            width: 100%;
            font-size: 9.5pt;
          }
          .signatures td {
            text-align: center;
            vertical-align: top;
            width: 50%;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="header-title">JURNAL HARIAN KEGIATAN PEMBELAJARAN GURU</div>
          <div class="header-sub">MATA PELAJARAN: ${mataPelajaran.toUpperCase()}</div>
          <div class="header-meta">${namaSekolah.toUpperCase()} • TAHUN PELAJARAN ${tahunPelajaran} • ${semester.toUpperCase()}</div>
          <div style="font-size: 8.5pt; color: #666; margin-top: 3px;">Rentang Kalender: ${rentangJadwal}</div>
        </div>

        <table class="identitas-table">
          <tr>
            <td style="width: 18%;"><b>Satuan Pendidikan</b></td>
            <td style="width: 3%;">:</td>
            <td style="width: 39%;">${namaSekolah}</td>
            <td style="width: 18%;"><b>Guru Mata Pelajaran</b></td>
            <td style="width: 3%;">:</td>
            <td style="width: 19%;">${namaGuru}</td>
          </tr>
          <tr>
            <td><b>Mata Pelajaran</b></td>
            <td>:</td>
            <td>${mataPelajaran}</td>
            <td><b>NIP Guru</b></td>
            <td>:</td>
            <td>${nipGuru || '-'}</td>
          </tr>
          <tr>
            <td><b>Tahun Pelajaran / Sem.</b></td>
            <td>:</td>
            <td>${tahunPelajaran} / ${semester}</td>
            <td><b>Jadwal Mengajar</b></td>
            <td>:</td>
            <td>${jadwalMingguan}</td>
          </tr>
        </table>

        ${tableHtml}

        <table class="signatures">
          <tr>
            <td>
              Mengetahui,<br>
              Kepala Sekolah ${namaSekolah}<br><br><br><br><br>
              <b><u>${namaKepalaSekolah}</u></b><br>
              NIP. ${nipKepalaSekolah || '....................................'}
            </td>
            <td>
              ........................, 30 September 2025<br>
              Guru Mata Pelajaran ${mataPelajaran}<br><br><br><br><br>
              <b><u>${namaGuru}</u></b><br>
              NIP. ${nipGuru || '....................................'}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  };

  // Export to Microsoft Word (.doc) F4 Landscape
  const handleExportWord = () => {
    if (!jurnalData) return;
    const wordContent = buildJurnalHtml();
    const filename = `Jurnal_Harian_F4_${mataPelajaran.replace(/\s+/g, '_')}_${namaSekolah.replace(/\s+/g, '_')}.doc`;
    downloadDocFile(filename, wordContent, 'landscape');
  };

  // Download as F4 Landscape PDF (.pdf)
  const handleDownloadPdf = async () => {
    if (!jurnalData || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docHtml = buildJurnalHtml();
      const fileName = `Jurnal_Harian_F4_${mataPelajaran.replace(/\s+/g, '_')}_${namaSekolah.replace(/\s+/g, '_')}.pdf`;
      const success = await downloadHtmlAsPdf(fileName, docHtml, {
        orientation: 'landscape',
        marginMm: 10
      });
      if (!success) {
        printHtmlDocument(docHtml, `Jurnal Harian F4 - ${mataPelajaran}`, 'landscape');
      }
    } catch (err) {
      console.error('Error generating Jurnal F4 PDF:', err);
      printHtmlDocument(buildJurnalHtml(), `Jurnal Harian F4 - ${mataPelajaran}`, 'landscape');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print F4 Document
  const handlePrint = () => {
    if (!jurnalData) return;
    printHtmlDocument(buildJurnalHtml(), `Jurnal Harian F4 - ${mataPelajaran}`, 'landscape');
  };

  // Copy structured text
  const handleCopyText = () => {
    if (!jurnalData) return;
    let text = `JURNAL HARIAN KEGIATAN PEMBELAJARAN GURU\n`;
    text += `Mata Pelajaran: ${mataPelajaran}\nSekolah: ${namaSekolah}\nTahun: ${tahunPelajaran} (${semester})\nRentang: ${rentangJadwal}\n\n`;

    jurnalData.hariList.forEach(day => {
      text += `========================================================\n`;
      text += `📅 HARI/TANGGAL: ${day.hariTanggal}\n`;
      text += `========================================================\n`;
      day.rows.forEach(r => {
        text += `[${r.jamKe}] Kelas: ${r.kelas}\n`;
        text += `- Tujuan: ${r.tujuan}\n`;
        text += `- Materi Pokok: ${r.materiPokok}\n`;
        text += `- Rincian Materi: ${r.rincianMateri}\n`;
        text += `- Hasil: ${r.hasil}\n`;
        text += `- Kehadiran: Hadir ${r.hadir} | Tidak Hadir: ${r.tidakHadir}\n`;
        text += `- Keterangan: ${r.keterangan}\n\n`;
      });
    });

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Export JSON
  const handleExportJson = () => {
    if (!jurnalData) return;
    const filename = `Jurnal_Mapel_${mataPelajaran.replace(/[^a-zA-Z0-9]/g, '_')}_${tahunPelajaran.replace('/', '-')}.json`;
    downloadJsonFile(filename, jurnalData);
  };

  // Prompts for AI Modal
  const prompts = useMemo(() => {
    return getJurnalSatuMapelPrompts({
      mataPelajaran,
      namaSekolah,
      tahunPelajaran,
      tujuanKelas7,
      tujuanKelas8,
      tujuanKelas9,
      jadwalMingguan,
      rentangJadwal
    });
  }, [mataPelajaran, namaSekolah, tahunPelajaran, tujuanKelas7, tujuanKelas8, tujuanKelas9, jadwalMingguan, rentangJadwal]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white p-6 md:p-8 rounded-2xl shadow-lg border border-emerald-600/30">
        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-emerald-500/30 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              Generator Jurnal 1 Mapel
            </span>
            <span className="bg-cyan-500/20 text-cyan-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-cyan-400/30">
              Format Tabel Per Hari & Ekspor Word
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Jurnal Harian Kegiatan Pembelajaran Guru (Satu Mapel)
          </h2>
          <p className="text-emerald-100/90 text-sm md:text-base mt-2 leading-relaxed">
            Susun jurnal harian mengajar untuk satu mata pelajaran secara otomatis dan runut. Tabel dibuat per hari dengan 10 kolom standar: 
            <span className="font-semibold text-white"> Hari/Tanggal, Jam ke-, Kelas, Tujuan, Materi Pokok, Rincian Materi, Hasil, Hadir, Tidak Hadir, dan Keterangan</span>. Dilengkapi ekspor langsung ke Microsoft Word (.doc) yang rapi tanpa perlu ditata ulang.
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={handleGenerateJurnal}
              disabled={isGenerating}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyusun Jurnal Harian...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  Generate Jurnal dengan AI
                </>
              )}
            </button>

            <button
              onClick={handleExportWord}
              disabled={!jurnalData}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
              title="Unduh file Microsoft Word (.doc) ukuran F4 rapi siap pakai"
            >
              <Download className="w-4 h-4" />
              Unduh Word (.doc)
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={!jurnalData || isExportingPdf}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
              title="Unduh file PDF ukuran F4 (330mm x 215mm) rapi siap cetak"
            >
              <FileText className="w-4 h-4" />
              {isExportingPdf ? 'Memproses PDF F4...' : 'Unduh PDF (F4)'}
            </button>

            <button
              onClick={handlePrint}
              disabled={!jurnalData}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Printer className="w-4 h-4" />
              Cetak F4
            </button>

            <ExportJsonPromptAiButtons
              variant="compact"
              onExportJson={handleExportJson}
              onOpenPromptAi={() => setIsPromptModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Configuration & Form Accordion */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base">
              Pengaturan Identitas & Parameter KBM Satu Mapel
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-2 font-medium">Jenjang Cepat:</span>
            <button
              onClick={() => handleApplyPreset('SMP')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                jenjangMode === 'SMP'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              SMP (VII, VIII, IX)
            </button>
            <button
              onClick={() => handleApplyPreset('SD')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                jenjangMode === 'SD'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              SD (Fase B/C)
            </button>
            <button
              onClick={() => handleApplyPreset('SMA')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                jenjangMode === 'SMA'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              SMA (X, XI, XII)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mata Pelajaran
            </label>
            <input
              type="text"
              value={mataPelajaran}
              onChange={e => setMataPelajaran(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Contoh: Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)"
            />
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
              placeholder="Contoh: SD Negeri Kalimantong"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tahun Pelajaran & Semester
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={tahunPelajaran}
                onChange={e => setTahunPelajaran(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="2026/2027"
              />
              <input
                type="text"
                value={semester}
                onChange={e => setSemester(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Semester 1 (Ganjil)"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Guru Mata Pelajaran & NIP
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={namaGuru}
                onChange={e => setNamaGuru(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Nama Guru"
              />
              <input
                type="text"
                value={nipGuru}
                onChange={e => setNipGuru(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="NIP Guru"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kepala Sekolah & NIP
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={namaKepalaSekolah}
                onChange={e => setNamaKepalaSekolah(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Nama Kepala Sekolah"
              />
              <input
                type="text"
                value={nipKepalaSekolah}
                onChange={e => setNipKepalaSekolah(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="NIP Kepala Sekolah"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Rentang Jadwal (Kalender) & Asumsi Siswa
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={rentangJadwal}
                onChange={e => setRentangJadwal(e.target.value)}
                className="col-span-2 w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="14 Juli 2025 - 30 September 2025"
              />
              <div className="flex items-center gap-1 border border-slate-200 rounded-xl px-2">
                <span className="text-xs text-slate-400">Jml:</span>
                <input
                  type="number"
                  value={asumsiSiswa}
                  onChange={e => setAsumsiSiswa(Number(e.target.value))}
                  className="w-full text-sm py-2 focus:outline-none font-bold text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Target Tujuan Pembelajaran per Kelas */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Tujuan Pembelajaran Per Tingkat Kelas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-emerald-700 block mb-1.5">
                1. {jenjangMode === 'SMP' ? 'Tujuan Pembelajaran Kelas VII' : jenjangMode === 'SD' ? 'Tujuan Pembelajaran Kelas IV' : 'Tujuan Pembelajaran Kelas X'}
              </span>
              <textarea
                rows={3}
                value={tujuanKelas7}
                onChange={e => setTujuanKelas7(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Isikan tujuan pembelajaran..."
              />
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-teal-700 block mb-1.5">
                2. {jenjangMode === 'SMP' ? 'Tujuan Pembelajaran Kelas VIII' : jenjangMode === 'SD' ? 'Tujuan Pembelajaran Kelas V' : 'Tujuan Pembelajaran Kelas XI'}
              </span>
              <textarea
                rows={3}
                value={tujuanKelas8}
                onChange={e => setTujuanKelas8(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Isikan tujuan pembelajaran..."
              />
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-cyan-700 block mb-1.5">
                3. {jenjangMode === 'SMP' ? 'Tujuan Pembelajaran Kelas IX' : jenjangMode === 'SD' ? 'Tujuan Pembelajaran Kelas VI' : 'Tujuan Pembelajaran Kelas XII'}
              </span>
              <textarea
                rows={3}
                value={tujuanKelas9}
                onChange={e => setTujuanKelas9(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Isikan tujuan pembelajaran..."
              />
            </div>
          </div>
        </div>

        {/* Jadwal Mengajar Mingguan */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Jadwal Mengajar Tiap Minggu
          </label>
          <input
            type="text"
            value={jadwalMingguan}
            onChange={e => setJadwalMingguan(e.target.value)}
            className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
            placeholder="Contoh: Senin jam 1-2 kelas VII A, Senin jam 3-4 kelas VII B, Rabu jam 3-4 kelas VIII D, dst."
          />
          <p className="text-[11px] text-slate-400 mt-1">
            * AI akan secara otomatis memetakan jadwal ini ke setiap pekan kalender akademik dan menyusun rincian langkah KBM per harinya.
          </p>
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClassFilter}
              onChange={e => setSelectedClassFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Kelas ({stats.totalRows} Jam)</option>
              {classOptions.map(cls => (
                <option key={cls} value={cls}>Kelas {cls}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari materi, tanggal, atau hasil..."
              className="text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56 md:w-72"
            />
          </div>
        </div>

        {/* View Mode & Stats */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 mr-2 border-r border-slate-200 pr-3">
            <span>Total: <strong className="text-slate-800">{stats.totalDays}</strong> Hari KBM</span>
            <span>•</span>
            <span><strong className="text-slate-800">{stats.totalRows}</strong> Sesi Pertemuan</span>
          </div>

          <button
            onClick={() => setViewMode('per_day')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'per_day'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tabel Per Hari
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'unified'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tabel Gabungan
          </button>

          <button
            onClick={handleCopyText}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-semibold cursor-pointer"
            title="Salin teks jurnal ke papan klip"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {isCopied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
      </div>

      {/* Main Jurnal Tables Section (Print-ready document container) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 print:p-0 print:border-none print:shadow-none">
        
        {/* Document Header (Formal School Style) */}
        <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
          <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-tight text-slate-900">
            JURNAL HARIAN KEGIATAN PEMBELAJARAN GURU
          </h2>
          <h3 className="text-sm md:text-base font-bold text-emerald-800 uppercase mt-0.5">
            MATA PELAJARAN: {mataPelajaran}
          </h3>
          <p className="text-xs font-medium text-slate-600 mt-1">
            {namaSekolah} • Tahun Pelajaran {tahunPelajaran} • {semester}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Rentang Jadwal: {rentangJadwal} | Jadwal: {jadwalMingguan}
          </p>
        </div>

        {/* Identity Metadata Card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Satuan Pendidikan</span>
            <span className="font-bold text-slate-800">{namaSekolah}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Guru Mata Pelajaran</span>
            <span className="font-bold text-slate-800">{namaGuru}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">NIP Guru</span>
            <span className="font-semibold text-slate-700">{nipGuru || '-'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Target Siswa / Rata-rata</span>
            <span className="font-semibold text-slate-700">{asumsiSiswa} Siswa / Kelas</span>
          </div>
        </div>

        {/* Render Tables Per Day (Default requested in prompt) */}
        {viewMode === 'per_day' ? (
          <div className="space-y-6">
            {filteredDays.map((day, dIdx) => (
              <div 
                key={day.hariTanggal + dIdx} 
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:border-emerald-300 transition-all"
              >
                {/* Header Bar per Hari */}
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border-b border-emerald-100 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <h4 className="font-extrabold text-sm text-emerald-950">
                      📅 {day.hariTanggal}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-emerald-100/70 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      {day.rows.length} Sesi Jam Mengajar
                    </span>
                  </div>
                </div>

                {/* 10 Columns Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wide">
                        <th className="py-2.5 px-3 border-r border-slate-200 w-28 text-center">Hari/Tanggal</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 w-24 text-center">Jam ke-</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 w-16 text-center">Kelas</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 w-48">Tujuan</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 w-40">Materi Pokok</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 min-w-56">Rincian Materi</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 w-36">Hasil</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 w-14 text-center">Hadir</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 w-24 text-center">Tidak Hadir</th>
                        <th className="py-2.5 px-3 w-28 text-center">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {day.rows.map((row, rIdx) => (
                        <tr key={row.id || rIdx} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-center align-top text-slate-600">
                            {row.hariTanggal}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-semibold text-center align-top text-emerald-800">
                            {row.jamKe}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-extrabold text-center align-top text-slate-900 bg-slate-50/50">
                            {row.kelas}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 align-top text-slate-700 leading-relaxed">
                            {row.tujuan}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 align-top font-bold text-slate-900">
                            {row.materiPokok}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 align-top text-slate-600 leading-relaxed">
                            {row.rincianMateri}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 align-top text-emerald-900 leading-relaxed">
                            {row.hasil}
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-center align-top text-emerald-700 bg-emerald-50/30">
                            {row.hadir}
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200 text-center align-top text-rose-700 text-[11px]">
                            {row.tidakHadir}
                          </td>
                          <td className="py-2.5 px-3 align-top text-center text-slate-500 font-medium text-[11px]">
                            {row.keterangan}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {day.catatanHarian && (
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 italic">
                    Catatan Guru: {day.catatanHarian}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Unified Single Table */
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-emerald-900 text-white border-b border-emerald-950 font-bold text-[11px] uppercase tracking-wide">
                  <th className="py-3 px-3 border-r border-emerald-800 w-28 text-center">Hari/Tanggal</th>
                  <th className="py-3 px-3 border-r border-emerald-800 w-24 text-center">Jam ke-</th>
                  <th className="py-3 px-3 border-r border-emerald-800 w-16 text-center">Kelas</th>
                  <th className="py-3 px-3 border-r border-emerald-800 w-48">Tujuan</th>
                  <th className="py-3 px-3 border-r border-emerald-800 w-40">Materi Pokok</th>
                  <th className="py-3 px-3 border-r border-emerald-800 min-w-56">Rincian Materi</th>
                  <th className="py-3 px-3 border-r border-emerald-800 w-36">Hasil</th>
                  <th className="py-3 px-2 border-r border-emerald-800 w-14 text-center">Hadir</th>
                  <th className="py-3 px-2 border-r border-emerald-800 w-24 text-center">Tidak Hadir</th>
                  <th className="py-3 px-3 w-28 text-center">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredDays.flatMap(day => day.rows).map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-center align-top text-slate-600">
                      {row.hariTanggal}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 font-semibold text-center align-top text-emerald-800">
                      {row.jamKe}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 font-extrabold text-center align-top text-slate-900 bg-slate-50/50">
                      {row.kelas}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 align-top text-slate-700 leading-relaxed">
                      {row.tujuan}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 align-top font-bold text-slate-900">
                      {row.materiPokok}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 align-top text-slate-600 leading-relaxed">
                      {row.rincianMateri}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 align-top text-emerald-900 leading-relaxed">
                      {row.hasil}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-center align-top text-emerald-700 bg-emerald-50/30">
                      {row.hadir}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 text-center align-top text-rose-700 text-[11px]">
                      {row.tidakHadir}
                    </td>
                    <td className="py-2.5 px-3 align-top text-center text-slate-500 font-medium text-[11px]">
                      {row.keterangan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Formal Signatures Section */}
        <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-800 break-inside-avoid">
          <div>
            <p className="text-slate-500 mb-1">Mengetahui,</p>
            <p className="font-bold text-slate-800">Kepala {namaSekolah}</p>
            <div className="h-20" />
            <p className="font-extrabold text-slate-900 underline text-sm">{namaKepalaSekolah}</p>
            <p className="text-slate-500 text-[11px]">NIP. {nipKepalaSekolah || '....................................'}</p>
          </div>

          <div>
            <p className="text-slate-500 mb-1">Ditetapkan di {namaSekolah.includes('SMP') ? 'Sekolah' : 'Kota/Kabupaten'}, 30 September 2025</p>
            <p className="font-bold text-slate-800">Guru Mata Pelajaran {mataPelajaran}</p>
            <div className="h-20" />
            <p className="font-extrabold text-slate-900 underline text-sm">{namaGuru}</p>
            <p className="text-slate-500 text-[11px]">NIP. {nipGuru || '....................................'}</p>
          </div>
        </div>

      </div>

      {/* Prompt AI Master Modal */}
      <AiPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        title="Prompt AI Master Jurnal Harian 1 Mapel"
        subtitle="Prompt instruksi terstruktur untuk Google Gemini & ChatGPT sesuai format Kurikulum Merdeka"
        tabs={prompts}
        jsonData={jurnalData}
        jsonFilename={`Jurnal_Harian_${mataPelajaran.replace(/\s+/g, '_')}.json`}
      />
    </div>
  );
};
