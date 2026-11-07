import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Sliders, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Printer, 
  BookOpen, 
  Info, 
  User, 
  School, 
  Clock, 
  Layout, 
  HelpCircle, 
  Lightbulb, 
  Award, 
  MapPin, 
  FileSignature, 
  Upload, 
  RefreshCw, 
  Quote, 
  CheckCircle2, 
  FileSpreadsheet, 
  Calendar, 
  Layers, 
  Trophy, 
  ShieldCheck, 
  Flame, 
  X
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { copyAndOpenGoogleDocs, downloadDocFile, downloadJsonFile } from '../lib/exportUtils';
import { downloadElementAsPdf, downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getCoverPrompts } from '../utils/aiPromptGenerators';

export interface CoverData {
  judulUtama: string;
  subJudulKreatif: string;
  taglineSekolah: string;
  kutipanMotivasi: string;
  sumberKutipan: string;
  detailDokumen: {
    jenisDokumen: string;
    mataPelajaran: string;
    kelasFase: string;
    semester: string;
    tahunAjaran: string;
  };
  informasiPenyusun: {
    namaPenyusun: string;
    nipKeterangan: string;
    jabatan: string;
  };
  instansi: {
    namaSekolah: string;
    dinasPendidikan: string;
    kotaKabupaten: string;
  };
  gayaVisual: {
    rekomendasiWarnaBg: string;
    borderStyle: string;
    patternDescription: string;
    hiasanSudut: string;
  };
}

export interface DocumentPresetItem {
  id: string;
  jenisDokumen: string;
  judul: string;
  subJudul: string;
  taglineSekolah: string;
  kutipanMotivasi: string;
  sumberKutipan: string;
  coverStyle: 'classic_formal' | 'modern_minimalist' | 'cute_kids' | 'creative_art';
  warnaTema: 'emerald' | 'blue' | 'indigo' | 'slate' | 'amber' | 'rose' | 'teal' | 'ruby';
  category: 'nilai_presensi' | 'perangkat_ajar' | 'buku_kerja' | 'evaluasi_kinerja' | 'lainnya';
}

export const DOCUMENT_PRESETS: DocumentPresetItem[] = [
  {
    id: 'daftar_nilai',
    jenisDokumen: 'Buku Daftar Nilai & Rekapitulasi Nilai Siswa',
    judul: 'BUKU DAFTAR NILAI & REKAPITULASI HASIL BELAJAR PESERTA DIDIK',
    subJudul: 'Asesmen Formatif, Sumatif Lingkup Materi, dan Pengolahan Nilai Capaian Rapor',
    taglineSekolah: 'Objektif, Transparan, Akuntabel, dan Berkelanjutan',
    kutipanMotivasi: 'Penilaian bukan sekadar mengukur capaian angka akhir, melainkan menyalakan lentera potensi dan memotivasi setiap langkah perkembangan peserta didik.',
    sumberKutipan: 'Prinsip Pembelajaran & Asesmen Kurikulum Merdeka',
    coverStyle: 'classic_formal',
    warnaTema: 'blue',
    category: 'nilai_presensi'
  },
  {
    id: 'rekap_nilai_tp',
    jenisDokumen: 'Buku Rekap Nilai Harian per Tujuan Pembelajaran (TP)',
    judul: 'REKAPITULASI NILAI HARIAN PER TUJUAN PEMBELAJARAN (TP)',
    subJudul: 'Pemetaan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) Semester 1 & 2',
    taglineSekolah: 'Menuntaskan Kompetensi, Membangun Kemandirian Belajar Siswa',
    kutipanMotivasi: 'Setiap anak berkembang dengan kecepatan yang berbeda; tugas mulia kita adalah memastikan setiap langkah mereka bermakna dan terarah.',
    sumberKutipan: 'Panduan Asesmen Pembelajaran',
    coverStyle: 'classic_formal',
    warnaTema: 'emerald',
    category: 'nilai_presensi'
  },
  {
    id: 'daftar_hadir',
    jenisDokumen: 'Buku Daftar Hadir & Presensi Peserta Didik',
    judul: 'BUKU DAFTAR HADIR & REKAPITULASI PRESENSI SISWA',
    subJudul: 'Catatan Kehadiran, Kedisiplinan, dan Pembiasaan Sikap Positif Pembelajaran',
    taglineSekolah: 'Hadir Sepenuh Hati, Belajar dengan Bahagia dan Berprestasi',
    kutipanMotivasi: 'Disiplin dan konsistensi adalah jembatan kokoh antara impian belajar dan pencapaian keberhasilan masa depan.',
    sumberKutipan: 'Pendidikan Karakter Disiplin Positif',
    coverStyle: 'modern_minimalist',
    warnaTema: 'indigo',
    category: 'nilai_presensi'
  },
  {
    id: 'jurnal_mengajar',
    jenisDokumen: 'Buku Agenda & Jurnal Harian Mengajar Guru',
    judul: 'JURNAL HARIAN & AGENDA PELAKSANAAN PEMBELAJARAN GURU',
    subJudul: 'Rekam Jejak Aktivitas Mengajar, Refleksi Pembelajaran, dan Catatan Perkembangan Kelas',
    taglineSekolah: 'Reflektif, Berkelanjutan, dan Berpusat pada Kebutuhan Peserta Didik',
    kutipanMotivasi: 'Mengajar adalah menyentuh masa depan, merefleksikan proses, dan menumbuhkan budi pekerti luhur bagi anak-anak bangsa.',
    sumberKutipan: 'Filosofi Pendidikan Ki Hadjar Dewantara',
    coverStyle: 'classic_formal',
    warnaTema: 'slate',
    category: 'perangkat_ajar'
  },
  {
    id: 'modul_ajar',
    jenisDokumen: 'Modul Ajar Kurikulum Merdeka',
    judul: 'MODUL AJAR PENDIDIKAN JASMANI, OLAHRAGA, DAN KESEHATAN',
    subJudul: 'Aktivitas Pola Gerak Dasar, Kebugaran Jasmani, dan Pembentukan Karakter Sportif',
    taglineSekolah: 'Bergerak Aktif, Tumbuh Bugar, dan Memiliki Karakter Profil Pelajar Pancasila',
    kutipanMotivasi: 'Mens sana in corpore sano — Di dalam tubuh yang sehat terdapat jiwa yang kuat dan pikiran yang cemerlang.',
    sumberKutipan: 'Pepatah Olahraga & Kebugaran Klasik',
    coverStyle: 'modern_minimalist',
    warnaTema: 'teal',
    category: 'perangkat_ajar'
  },
  {
    id: 'buku_kerja_1',
    jenisDokumen: 'Buku Kerja Guru I (SKL, CP, TP, ATP, Modul Ajar, KKTP)',
    judul: 'BUKU KERJA GURU I — PERANGKAT PERENCANAAN PEMBELAJARAN',
    subJudul: 'Memuat SKL, Capaian Pembelajaran (CP), TP, ATP, Modul Ajar, dan Kriteria KKTP Lengkap',
    taglineSekolah: 'Perencanaan Terukur, Eksekusi Pembelajaran Efektif dan Bermakna',
    kutipanMotivasi: 'Perencanaan pembelajaran yang matang adalah separuh dari keberhasilan mencerdaskan kehidupan generasi penerus.',
    sumberKutipan: 'Manajemen Administrasi Guru Unggul',
    coverStyle: 'classic_formal',
    warnaTema: 'blue',
    category: 'buku_kerja'
  },
  {
    id: 'buku_kerja_2',
    jenisDokumen: 'Buku Kerja Guru II (Kode Etik, Prota, Prosem, Kalender)',
    judul: 'BUKU KERJA GURU II — PEDOMAN KINERJA & JADWAL TAHUNAN',
    subJudul: 'Memuat Kode Etik Guru, Ikrar Guru, Tata Tertib, Alokasi Jam, Prota, Prosem, & Kalender Pendidikan',
    taglineSekolah: 'Integritas, Loyalitas, Dedikasi, dan Profesionalisme Pendidik',
    kutipanMotivasi: 'Ing ngarsa sung tulada, ing madya mangun karsa, tut wuri handayani.',
    sumberKutipan: 'Semboyan Pendidikan Nasional — Ki Hadjar Dewantara',
    coverStyle: 'classic_formal',
    warnaTema: 'indigo',
    category: 'buku_kerja'
  },
  {
    id: 'buku_kerja_3',
    jenisDokumen: 'Buku Kerja Guru III (Daftar Hadir, Daftar Nilai, Remedial)',
    judul: 'BUKU KERJA GURU III — EVALUASI, ASESMEN, & TINDAK LANJUT',
    subJudul: 'Memuat Daftar Hadir, Buku Nilai, Penilaian Karakter Sikap, serta Program Remedial & Pengayaan',
    taglineSekolah: 'Tuntas Belajar Bersama Tanpa Meninggalkan Satu Anak pun',
    kutipanMotivasi: 'Pendidikan yang memerdekakan membimbing kodrat alam dan kodrat zaman anak agar mencapai keselamatan dan kebahagiaan setinggi-tingginya.',
    sumberKutipan: 'Prinsip Merdeka Belajar',
    coverStyle: 'classic_formal',
    warnaTema: 'amber',
    category: 'buku_kerja'
  },
  {
    id: 'buku_kerja_4',
    jenisDokumen: 'Buku Kerja Guru IV (Evaluasi Diri, PKG, SKP, RTL)',
    judul: 'BUKU KERJA GURU IV — PENGEMBANGAN KEPROFESIAN BERKELANJUTAN',
    subJudul: 'Memuat Evaluasi Diri Guru (EDG), Penilaian Kinerja Guru (PKG), Sasaran Kinerja Pegawai (SKP), & Rencana Tindak Lanjut',
    taglineSekolah: 'Pendidik Pembelajar Sepanjang Hayat Menuju Generasi Emas',
    kutipanMotivasi: 'Barangsiapa berhenti belajar, sesungguhnya ia telah berhenti mengajar dengan segenap hatinya.',
    sumberKutipan: 'Pesan Guru Profesional Indonesia',
    coverStyle: 'classic_formal',
    warnaTema: 'slate',
    category: 'buku_kerja'
  },
  {
    id: 'prota_prosem',
    jenisDokumen: 'Program Tahunan & Semester (PROTA / PROSEM)',
    judul: 'PROGRAM TAHUNAN & PROGRAM SEMESTER (PROTA & PROSEM)',
    subJudul: 'Pemetaan Distribusi Alokasi Waktu Efektif dan Lingkup Materi Pembelajaran PJOK',
    taglineSekolah: 'Terstruktur, Terarah, dan Terintegrasi dengan Kalender Akademik',
    kutipanMotivasi: 'Waktu yang terkelola dengan baik adalah fondasi pembelajaran yang mendalam, teratur, dan berdaya guna.',
    sumberKutipan: 'Pedoman Kurikulum Satuan Pendidikan',
    coverStyle: 'modern_minimalist',
    warnaTema: 'teal',
    category: 'perangkat_ajar'
  },
  {
    id: 'rpe',
    jenisDokumen: 'Rencana Pekan Efektif (RPE)',
    judul: 'ANALISIS RENCANA PEKAN EFEKTIF (RPE) PEMBELAJARAN',
    subJudul: 'Perhitungan Jumlah Pekan Efektif, Jam Pelajaran, dan Distribusi Waktu Semester',
    taglineSekolah: 'Alokasi Waktu Presisi untuk Capaian Pembelajaran Maksimal',
    kutipanMotivasi: 'Ketepatan dalam menghitung waktu belajar menjamin seluruh capaian kompetensi siswa tersampaikan dengan tuntas.',
    sumberKutipan: 'Administrasi Kurikulum Efektif',
    coverStyle: 'classic_formal',
    warnaTema: 'blue',
    category: 'perangkat_ajar'
  },
  {
    id: 'lkpd',
    jenisDokumen: 'Lembar Kerja Peserta Didik (LKPD)',
    judul: 'LEMBAR KERJA PESERTA DIDIK (LKPD) AKTIF & INTERAKTIF',
    subJudul: 'Panduan Praktik Gerak Mandiri, Kuis Pemahaman Kebugaran, dan Refleksi Karakter Siswa',
    taglineSekolah: 'Belajar Sambil Bergerak, Berpikir Kritis, dan Berkolaborasi Riang',
    kutipanMotivasi: 'Saya dengar saya lupa, saya lihat saya ingat, saya lakukan dan praktikkan saya paham.',
    sumberKutipan: 'Pepatah Pembelajaran Berbasis Pengalaman',
    coverStyle: 'cute_kids',
    warnaTema: 'amber',
    category: 'perangkat_ajar'
  },
  {
    id: 'soal_evaluasi',
    jenisDokumen: 'Kumpulan Bank Soal & Kisi-Kisi Sumatif (STS & SAS)',
    judul: 'KUMPULAN KISI-KISI & NASKAH SOAL ASESMEN SUMATIF',
    subJudul: 'Instrumen Penilaian Sumatif Tengah Semester (STS) dan Sumatif Akhir Semester (SAS)',
    taglineSekolah: 'Menguji Kompetensi, Menjunjung Tinggi Kejujuran dan Nilai Sportivitas',
    kutipanMotivasi: 'Kejujuran dan integritas adalah medali emas tertinggi dalam setiap ujian kehidupan dan arena olahraga.',
    sumberKutipan: 'Nilai Luhur Sportivitas & Karakter',
    coverStyle: 'classic_formal',
    warnaTema: 'rose',
    category: 'evaluasi_kinerja'
  },
  {
    id: 'rpp_rpm',
    jenisDokumen: 'Rencana Pembelajaran Mendalam (RPM / Deep Learning)',
    judul: 'RENCANA PEMBELAJARAN MENDALAM (RPM / DEEP LEARNING)',
    subJudul: 'Pendekatan Mindful, Meaningful, & Joyful Learning dalam Pendidikan Jasmani dan Olahraga',
    taglineSekolah: 'Bermakna, Menyenangkan, dan Menghidupkan Potensi Peserta Didik',
    kutipanMotivasi: 'Pembelajaran sejati terjadi saat pikiran, tubuh, dan hati selaras dalam rasa ingin tahu serta kegembiraan bergerak.',
    sumberKutipan: 'Prinsip Pembelajaran Mendalam (Deep Learning)',
    coverStyle: 'creative_art',
    warnaTema: 'indigo',
    category: 'perangkat_ajar'
  },
  {
    id: 'atp_cp',
    jenisDokumen: 'Alur Tujuan Pembelajaran (ATP) & Capaian Pembelajaran (CP)',
    judul: 'ALUR TUJUAN PEMBELAJARAN (ATP) & CAPAIAN PEMBELAJARAN',
    subJudul: 'Peta Navigasi Kompetensi Fase Belajar Berkelanjutan PJOK Kurikulum Merdeka',
    taglineSekolah: 'Menuntun Tahapan Belajar secara Komprehensif dan Berjenjang',
    kutipanMotivasi: 'Perjalanan prestasi seribu mil selalu dimulai dari satu langkah tujuan pembelajaran yang pasti dan konsisten.',
    sumberKutipan: 'Amsal Kebijaksanaan Pendidikan',
    coverStyle: 'modern_minimalist',
    warnaTema: 'blue',
    category: 'perangkat_ajar'
  },
  {
    id: 'kktp',
    jenisDokumen: 'Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)',
    judul: 'KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)',
    subJudul: 'Rubrik Deskripsi Kualitatif, Interval Nilai, dan Panduan Tindak Lanjut Pembelajaran',
    taglineSekolah: 'Tolok Ukur Jelas, Pembinaan Tepat Sasaran bagi Setiap Peserta Didik',
    kutipanMotivasi: 'Kriteria yang jelas memberikan peta jalan bagi murid untuk meraih potensi puncak prestasinya.',
    sumberKutipan: 'Panduan Asesmen Kurikulum Merdeka',
    coverStyle: 'classic_formal',
    warnaTema: 'emerald',
    category: 'perangkat_ajar'
  },
  {
    id: 'ekstrakurikuler',
    jenisDokumen: 'Buku Pembinaan Ekstrakurikuler Olahraga',
    judul: 'BUKU PROGRAM & CATATAN PEMBINAAN EKSTRAKURIKULER OLAHRAGA',
    subJudul: 'Pengembangan Minat Bakat, Pembibitan Atlet Usia Dini, dan Rekam Prestasi Pertandingan',
    taglineSekolah: 'Gali Potensi, Pupuk Mental Juara, Harumkan Nama Sekolah',
    kutipanMotivasi: 'Juara tidak diciptakan di atas podium, melainkan di balik ribuan jam latihan yang dilalui dengan tekad pantang menyerah.',
    sumberKutipan: 'Motto Atlet & Pembina Olahraga',
    coverStyle: 'creative_art',
    warnaTema: 'amber',
    category: 'lainnya'
  },
  {
    id: 'laporan_kinerja',
    jenisDokumen: 'Laporan Kinerja Guru & Portofolio SKP',
    judul: 'LAPORAN KINERJA & BUKTI DUKUNG SKP GURU PJOK',
    subJudul: 'Sasaran Kinerja Pegawai, Pengembangan Keprofesian, dan Dokumentasi Tugas Tambahan Guru',
    taglineSekolah: 'Akuntabel, Profesional, dan Berdampak Nyata bagi Satuan Pendidikan',
    kutipanMotivasi: 'Kinerja terbaik lahir dari ketulusan hati mengabdi untuk kemajuan dan kecerdasan anak-anak bangsa.',
    sumberKutipan: 'Nilai Dasar ASN BerAKHLAK',
    coverStyle: 'classic_formal',
    warnaTema: 'slate',
    category: 'evaluasi_kinerja'
  },
  {
    id: 'kosp',
    jenisDokumen: 'Kurikulum Operasional Satuan Pendidikan (KOSP)',
    judul: 'DOKUMEN KURIKULUM OPERASIONAL SATUAN PENDIDIKAN (KOSP)',
    subJudul: 'Karakteristik Satuan Pendidikan, Visi, Misi, dan Pengorganisasian Pembelajaran Sekolah',
    taglineSekolah: 'Kontekstual, Inovatif, dan Berakar Kuat pada Nilai Kearifan Bangsa',
    kutipanMotivasi: 'Kurikulum yang baik adalah kurikulum yang hidup dan bernapas bersama kebutuhan serta masa depan murid-muridnya.',
    sumberKutipan: 'Prinsip Otonomi Kurikulum Satuan Pendidikan',
    coverStyle: 'classic_formal',
    warnaTema: 'blue',
    category: 'lainnya'
  },
  {
    id: 'rapor_siswa',
    jenisDokumen: 'Buku Rapor & Laporan Hasil Belajar Siswa',
    judul: 'LAPORAN HASIL BELAJAR PESERTA DIDIK (BUKU RAPOR PJOK)',
    subJudul: 'Capaian Kompetensi Sikap, Keterampilan Gerak, Kebugaran Fisik, dan Pemahaman Siswa',
    taglineSekolah: 'Mencetak Generasi Sehat, Cerdas, dan Berbudi Luhur',
    kutipanMotivasi: 'Prestasi adalah buah dari ketekunan, kejujuran, dan semangat pantang berputus asa.',
    sumberKutipan: 'Refleksi Hasil Belajar Guru & Siswa',
    coverStyle: 'classic_formal',
    warnaTema: 'ruby',
    category: 'nilai_presensi'
  },
  {
    id: 'custom_doc',
    jenisDokumen: 'Lainnya / Input Judul Kustom (Manual)',
    judul: 'BUKU ADMINISTRASI & LAPORAN PEMBELAJARAN SEKOLAH',
    subJudul: 'Dokumentasi Resmi dan Kelengkapan Administrasi Guru Kurikulum Merdeka',
    taglineSekolah: 'Unggul dalam Mutu, Santun dalam Perilaku, Berprestasi dalam Tindakan',
    kutipanMotivasi: 'Belajar tanpa berpikir adalah sia-sia; berpikir tanpa belajar adalah bahaya besar.',
    sumberKutipan: 'Pepatah Kebijaksanaan Edukasi',
    coverStyle: 'classic_formal',
    warnaTema: 'emerald',
    category: 'lainnya'
  }
];

export const FAMOUS_QUOTES = [
  {
    quote: 'Mens sana in corpore sano — Di dalam tubuh yang sehat terdapat jiwa yang kuat.',
    author: 'Pepatah Olahraga Klasik'
  },
  {
    quote: 'Ing ngarsa sung tulada, ing madya mangun karsa, tut wuri handayani.',
    author: 'Ki Hadjar Dewantara'
  },
  {
    quote: 'Olahraga memiliki kekuatan untuk mengubah dunia, menginspirasi, dan menyatukan orang-orang dengan cara yang jarang bisa dilakukan hal lain.',
    author: 'Nelson Mandela'
  },
  {
    quote: 'Penilaian bukan akhir dari segalanya, melainkan cermin refleksi untuk melangkah lebih tinggi.',
    author: 'Prinsip Asesmen Bermakna'
  },
  {
    quote: 'Disiplin dan sportivitas adalah medali emas sejati dalam kehidupan sehari-hari.',
    author: 'Motto Karakter PJOK'
  },
  {
    quote: 'Setiap anak adalah bintang yang bersinar dengan bakat dan keunikannya masing-masing.',
    author: 'Filosofi Merdeka Belajar'
  }
];

export default function CoverGeneratorView() {
  // Preset selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>('daftar_nilai');

  // Document specifications
  const [documentType, setDocumentType] = useState('Buku Daftar Nilai & Rekapitulasi Nilai Siswa');
  const [isCustomDocType, setIsCustomDocType] = useState(false);
  const [customDocTypeInput, setCustomDocTypeInput] = useState('');

  const [judul, setJudul] = useState('BUKU DAFTAR NILAI & REKAPITULASI HASIL BELAJAR PESERTA DIDIK');
  const [subJudul, setSubJudul] = useState('Asesmen Formatif, Sumatif Lingkup Materi, dan Pengolahan Nilai Capaian Rapor');
  const [taglineSekolah, setTaglineSekolah] = useState('Objektif, Transparan, Akuntabel, dan Berkelanjutan');
  const [kutipanMotivasi, setKutipanMotivasi] = useState('Penilaian bukan sekadar mengukur capaian angka akhir, melainkan menyalakan lentera potensi dan memotivasi setiap langkah perkembangan peserta didik.');
  const [sumberKutipan, setSumberKutipan] = useState('Prinsip Pembelajaran & Asesmen Kurikulum Merdeka');

  const [mataPelajaran, setMataPelajaran] = useState('Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)');
  const [kelas, setKelas] = useState('Kelas I - VI (Semua Rombel / Fase A, B, C)');
  const [semester, setSemester] = useState('Semester 1 & 2 (Tahun Pelajaran)');
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027');

  // Compiler and institutional info
  const [disusunOleh, setDisusunOleh] = useState('Sandi Rafsanjani, S.Pd.');
  const [nip, setNip] = useState('NIP. 19940812 202321 1 002');
  const [jabatan, setJabatan] = useState('Guru PJOK');
  const [namaSekolah, setNamaSekolah] = useState('SD Negeri Kalimantong');
  const [dinasPendidikan, setDinasPendidikan] = useState('Dinas Pendidikan Pemuda dan Olahraga');
  const [kotaKabupaten, setKotaKabupaten] = useState('Kota Bandung');

  // Visual styles and design
  const [coverStyle, setCoverStyle] = useState<'classic_formal' | 'modern_minimalist' | 'cute_kids' | 'creative_art'>('classic_formal');
  const [warnaTema, setWarnaTema] = useState<'emerald' | 'blue' | 'indigo' | 'slate' | 'amber' | 'rose' | 'teal' | 'ruby'>('blue');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [logoType, setLogoType] = useState<'tutwuri' | 'kemenag' | 'pancasila' | 'custom_upload' | 'custom_emoji' | 'none'>('tutwuri');
  const [customEmoji, setCustomEmoji] = useState('⚽');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);

  // Operation mode & states
  const [activeTabLeft, setActiveTabLeft] = useState<'dokumen' | 'instansi' | 'quote' | 'desain'>('dokumen');
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active cover data object built directly from state for instant real-time live preview
  const currentCoverData: CoverData = {
    judulUtama: judul,
    subJudulKreatif: subJudul,
    taglineSekolah: taglineSekolah,
    kutipanMotivasi: kutipanMotivasi,
    sumberKutipan: sumberKutipan,
    detailDokumen: {
      jenisDokumen: isCustomDocType ? (customDocTypeInput || 'Dokumen Administrasi') : documentType,
      mataPelajaran,
      kelasFase: kelas,
      semester,
      tahunAjaran
    },
    informasiPenyusun: {
      namaPenyusun: disusunOleh,
      nipKeterangan: nip,
      jabatan
    },
    instansi: {
      namaSekolah,
      dinasPendidikan,
      kotaKabupaten
    },
    gayaVisual: {
      rekomendasiWarnaBg: warnaTema,
      borderStyle: coverStyle,
      patternDescription: 'Tata Letak A4 Standar Kemdikbudristek',
      hiasanSudut: 'Ornamen Sudut Resmi'
    }
  };

  // Handle Preset selection change
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = DOCUMENT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    if (preset.id === 'custom_doc') {
      setIsCustomDocType(true);
      setCustomDocTypeInput('');
    } else {
      setIsCustomDocType(false);
      setDocumentType(preset.jenisDokumen);
    }

    setJudul(preset.judul);
    setSubJudul(preset.subJudul);
    setTaglineSekolah(preset.taglineSekolah);
    setKutipanMotivasi(preset.kutipanMotivasi);
    setSumberKutipan(preset.sumberKutipan);
    setCoverStyle(preset.coverStyle);
    setWarnaTema(preset.warnaTema);
  };

  // Handle Logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran gambar terlalu besar. Silakan pilih gambar di bawah 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomLogoUrl(event.target.result as string);
          setLogoType('custom_upload');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger AI to creatively enhance subtitle, tagline, and quotes based on the current title
  const handleGenerateCoverAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    if (!judul.trim()) {
      setValidationError('Judul Cover wajib diisi.');
      return;
    }
    if (!disusunOleh.trim()) {
      setValidationError('Nama Penyusun wajib diisi.');
      return;
    }
    if (!namaSekolah.trim()) {
      setValidationError('Nama Sekolah wajib diisi.');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentType: isCustomDocType ? customDocTypeInput : documentType,
          judul,
          subJudul,
          mataPelajaran,
          kelas,
          semester,
          tahunAjaran,
          disusunOleh,
          nip,
          namaSekolah,
          dinasPendidikan,
          kotaKabupaten,
          coverStyle,
          warnaTema,
          logoType,
          customEmoji
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memproses rekomendasi AI.');
      }

      const data: CoverData = await response.json();
      
      // Update form fields with AI refined values
      if (data.subJudulKreatif) setSubJudul(data.subJudulKreatif);
      if (data.taglineSekolah) setTaglineSekolah(data.taglineSekolah);
      if (data.kutipanMotivasi) setKutipanMotivasi(data.kutipanMotivasi);
      if (data.sumberKutipan) setSumberKutipan(data.sumberKutipan);
      if (data.informasiPenyusun?.jabatan) setJabatan(data.informasiPenyusun.jabatan);

    } catch (err: any) {
      console.warn('AI cover generation fallback to manual mode:', err);
      setApiError(err.message || 'Gagal menyusun dari AI. Anda tetap dapat melanjutkan secara manual langsung.');
    } finally {
      setIsGenerating(false);
    }
  };

  // HTML Export to Microsoft Word
  const generateCoverDocHtml = (data: CoverData): string => {
    let themeColorHex = '#0284c7';
    let secondaryColorHex = '#0369a1';
    let bgLightHex = '#f0f9ff';

    switch (warnaTema) {
      case 'emerald':
        themeColorHex = '#059669';
        secondaryColorHex = '#047857';
        bgLightHex = '#ecfdf5';
        break;
      case 'teal':
        themeColorHex = '#0d9488';
        secondaryColorHex = '#0f766e';
        bgLightHex = '#f0fdfa';
        break;
      case 'blue':
        themeColorHex = '#2563eb';
        secondaryColorHex = '#1d4ed8';
        bgLightHex = '#eff6ff';
        break;
      case 'indigo':
        themeColorHex = '#4f46e5';
        secondaryColorHex = '#4338ca';
        bgLightHex = '#e0e7ff';
        break;
      case 'slate':
        themeColorHex = '#475569';
        secondaryColorHex = '#334155';
        bgLightHex = '#f8fafc';
        break;
      case 'amber':
        themeColorHex = '#d97706';
        secondaryColorHex = '#b45309';
        bgLightHex = '#fef3c7';
        break;
      case 'rose':
        themeColorHex = '#db2777';
        secondaryColorHex = '#be185d';
        bgLightHex = '#fdf2f8';
        break;
      case 'ruby':
        themeColorHex = '#b91c1c';
        secondaryColorHex = '#991b1b';
        bgLightHex = '#fef2f2';
        break;
    }

    const coverBorder = 
      coverStyle === 'classic_formal' ? `border: 8px double ${themeColorHex};` :
      coverStyle === 'modern_minimalist' ? `border-left: 14px solid ${themeColorHex}; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;` :
      coverStyle === 'cute_kids' ? `border: 5px dashed ${themeColorHex}; border-radius: 24px;` :
      `border: 3px solid ${themeColorHex}; border-radius: 12px;`;

    const fontStyle = 
      coverStyle === 'classic_formal' ? "font-family: 'Times New Roman', 'Georgia', serif;" :
      coverStyle === 'modern_minimalist' ? "font-family: 'Arial', 'Helvetica Neue', sans-serif; letter-spacing: 0.5px;" :
      coverStyle === 'cute_kids' ? "font-family: 'Comic Sans MS', 'Arial', sans-serif;" :
      "font-family: 'Trebuchet MS', 'Arial', sans-serif;";

    let logoHtml = '';
    if (logoType === 'custom_upload' && customLogoUrl) {
      logoHtml = `<div style="text-align: center; margin: 25px 0;"><img src="${customLogoUrl}" width="80" height="80" style="object-fit: contain;" alt="Logo"/></div>`;
    } else if (logoType !== 'none') {
      const emojiIcon = logoType === 'tutwuri' ? '🎓' : logoType === 'kemenag' ? '🕌' : logoType === 'pancasila' ? '🦅' : customEmoji;
      logoHtml = `<div style="text-align: center; margin: 25px 0;"><span style="font-size: 42pt;">${emojiIcon}</span></div>`;
    }

    if (orientation === 'landscape') {
      return `
        <div style="width: 100%; max-width: 980px; min-height: 660px; padding: 35px 45px; background-color: #ffffff; ${coverBorder} ${fontStyle} box-sizing: border-box; position: relative;">
          <!-- HEADER INSTANSI -->
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid ${themeColorHex}; padding-bottom: 10px;">
            <p style="font-size: 9.5pt; text-transform: uppercase; margin: 0; color: #475569; letter-spacing: 1.5px; font-weight: bold;">
              ${data.instansi.dinasPendidikan || 'DINAS PENDIDIKAN'}
            </p>
            <h2 style="font-size: 14pt; margin: 4px 0; color: ${secondaryColorHex}; text-transform: uppercase; font-weight: 800;">
              ${data.instansi.namaSekolah}
            </h2>
            <p style="font-size: 9pt; color: #64748b; margin: 0; font-weight: bold; font-style: italic;">
              📍 ${data.instansi.kotaKabupaten} &bull; "${data.taglineSekolah}"
            </p>
          </div>

          <!-- 2-COLUMN MAIN CONTENT -->
          <table style="width: 100%; border: none; margin: 15px 0;">
            <tr>
              <td style="width: 38%; vertical-align: top; border-right: 1px solid #cbd5e1; padding-right: 25px; text-align: center;">
                ${logoHtml}
                <div style="margin-top: 15px;">
                  <p style="font-size: 8.5pt; text-transform: uppercase; color: #64748b; margin-bottom: 4px; font-weight: bold; letter-spacing: 1px;">
                    Disusun Oleh:
                  </p>
                  <h3 style="font-size: 12pt; color: ${secondaryColorHex}; font-weight: bold; margin: 0;">
                    ${data.informasiPenyusun.namaPenyusun}
                  </h3>
                  <p style="font-size: 9.5pt; color: #475569; margin: 3px 0 0 0; font-family: monospace;">
                    ${data.informasiPenyusun.nipKeterangan || '-'}
                  </p>
                  <p style="font-size: 9pt; font-style: italic; color: #64748b; margin-top: 2px;">
                    ${data.informasiPenyusun.jabatan || 'Guru Mata Pelajaran PJOK'}
                  </p>
                </div>
                <div style="background-color: #fafaf9; border-left: 3px solid ${themeColorHex}; padding: 10px 14px; margin-top: 20px; border-radius: 4px; font-style: italic; text-align: left;">
                  <p style="font-size: 8.5pt; color: #334155; line-height: 1.4; margin: 0 0 4px 0;">
                    "${data.kutipanMotivasi}"
                  </p>
                  <strong style="font-size: 8pt; color: ${themeColorHex}; display: block; text-align: right;">
                    &mdash; ${data.sumberKutipan}
                  </strong>
                </div>
              </td>
              <td style="width: 62%; vertical-align: middle; padding-left: 30px;">
                <span style="font-size: 9.5pt; font-weight: bold; background-color: ${bgLightHex}; color: ${secondaryColorHex}; padding: 5px 15px; border-radius: 20px; display: inline-block; margin-bottom: 12px; text-transform: uppercase; border: 1px solid ${themeColorHex}40;">
                  📁 ${data.detailDokumen.jenisDokumen}
                </span>
                <h1 style="font-size: 19pt; color: ${secondaryColorHex}; font-weight: 900; margin: 8px 0; line-height: 1.3; text-transform: uppercase;">
                  ${data.judulUtama}
                </h1>
                <p style="font-size: 10.5pt; font-style: italic; color: #475569; margin: 6px 0 20px 0; line-height: 1.4;">
                  "${data.subJudulKreatif}"
                </p>
                <table style="width: 100%; border-collapse: collapse; border: none; background-color: ${bgLightHex}; border-radius: 6px; padding: 10px;">
                  <tr>
                    <td style="padding: 7px 10px; font-size: 9.5pt; border: none; font-weight: bold; color: ${secondaryColorHex};" width="35%">Mata Pelajaran</td>
                    <td style="padding: 7px 10px; font-size: 9.5pt; border: none; color: #1e293b;" width="65%">: ${data.detailDokumen.mataPelajaran || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 10px; font-size: 9.5pt; border: none; font-weight: bold; color: ${secondaryColorHex};">Kelas / Fase</td>
                    <td style="padding: 7px 10px; font-size: 9.5pt; border: none; color: #1e293b;">: ${data.detailDokumen.kelasFase || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 10px; font-size: 9.5pt; border: none; font-weight: bold; color: ${secondaryColorHex};">Semester / Periode</td>
                    <td style="padding: 7px 10px; font-size: 9.5pt; border: none; color: #1e293b;">: ${data.detailDokumen.semester || '-'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 10px; font-size: 9.5pt; border: none; font-weight: bold; color: ${secondaryColorHex};">Tahun Pelajaran</td>
                    <td style="padding: 7px 10px; font-size: 9.5pt; border: none; color: #1e293b;">: ${data.detailDokumen.tahunAjaran || '-'}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- FOOTER TAHUN -->
          <div style="margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center;">
            <p style="font-size: 9pt; color: #64748b; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
              ${data.instansi.namaSekolah} &bull; TAHUN AJARAN ${data.detailDokumen.tahunAjaran || '2026/2027'}
            </p>
            <p style="font-size: 7.5pt; color: #94a3b8; margin-top: 3px;">
              &copy; SADAR PJOK PREMIUM &bull; Halaman Sampul Administrasi Guru SD
            </p>
          </div>
        </div>
      `;
    }

    return `
      <div style="width: 100%; max-width: 720px; min-height: 1000px; padding: 45px; background-color: #ffffff; ${coverBorder} ${fontStyle} box-sizing: border-box; position: relative;">
        
        <!-- HEADER INSTANSI -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid ${themeColorHex}; padding-bottom: 15px;">
          <p style="font-size: 10.5pt; text-transform: uppercase; margin: 0; color: #475569; letter-spacing: 1.5px; font-weight: bold;">
            ${data.instansi.dinasPendidikan || 'DINAS PENDIDIKAN'}
          </p>
          <h2 style="font-size: 14.5pt; margin: 6px 0; color: ${secondaryColorHex}; text-transform: uppercase; font-weight: 800;">
            ${data.instansi.namaSekolah}
          </h2>
          <p style="font-size: 9.5pt; color: #64748b; margin: 0; font-weight: bold; font-style: italic;">
            📍 ${data.instansi.kotaKabupaten} &bull; "${data.taglineSekolah}"
          </p>
        </div>

        <!-- LOGO -->
        ${logoHtml}

        <!-- JUDUL UTAMA -->
        <div style="text-align: ${coverStyle === 'modern_minimalist' ? 'left' : 'center'}; margin-top: 20px; margin-bottom: 25px;">
          <span style="font-size: 10.5pt; font-weight: bold; background-color: ${bgLightHex}; color: ${secondaryColorHex}; padding: 6px 18px; border-radius: 20px; display: inline-block; margin-bottom: 15px; text-transform: uppercase; border: 1px solid ${themeColorHex}40;">
            📁 ${data.detailDokumen.jenisDokumen}
          </span>
          <h1 style="font-size: 21pt; color: ${secondaryColorHex}; font-weight: 900; margin: 10px 0; line-height: 1.3; text-transform: uppercase;">
            ${data.judulUtama}
          </h1>
          <p style="font-size: 11.5pt; font-style: italic; color: #475569; margin: 8px 0; line-height: 1.5;">
            "${data.subJudulKreatif}"
          </p>
        </div>

        <!-- DETAIL SPESIFIKASI DOKUMEN -->
        <table style="width: 100%; border-collapse: collapse; border: none; margin: 35px 0; background-color: ${bgLightHex}; border-radius: 8px; padding: 15px;">
          <tr>
            <td style="padding: 9px 12px; font-size: 10pt; border: none; font-weight: bold; color: ${secondaryColorHex};" width="32%">Mata Pelajaran</td>
            <td style="padding: 9px 12px; font-size: 10pt; border: none; color: #1e293b;" width="68%">: ${data.detailDokumen.mataPelajaran || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 9px 12px; font-size: 10pt; border: none; font-weight: bold; color: ${secondaryColorHex};">Kelas / Fase</td>
            <td style="padding: 9px 12px; font-size: 10pt; border: none; color: #1e293b;">: ${data.detailDokumen.kelasFase || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 9px 12px; font-size: 10pt; border: none; font-weight: bold; color: ${secondaryColorHex};">Semester / Periode</td>
            <td style="padding: 9px 12px; font-size: 10pt; border: none; color: #1e293b;">: ${data.detailDokumen.semester || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 9px 12px; font-size: 10pt; border: none; font-weight: bold; color: ${secondaryColorHex};">Tahun Pelajaran</td>
            <td style="padding: 9px 12px; font-size: 10pt; border: none; color: #1e293b;">: ${data.detailDokumen.tahunAjaran || '-'}</td>
          </tr>
        </table>

        <!-- MOTIVASI QUOTE BOX -->
        <div style="background-color: #fafaf9; border-left: 4px solid ${themeColorHex}; padding: 14px 20px; margin: 25px 0; border-radius: 4px; font-style: italic;">
          <p style="font-size: 9.5pt; color: #334155; line-height: 1.5; margin: 0 0 6px 0;">
            "${data.kutipanMotivasi}"
          </p>
          <strong style="font-size: 8.5pt; color: ${themeColorHex}; display: block; text-align: right;">
            &mdash; ${data.sumberKutipan}
          </strong>
        </div>

        <!-- DETAIL PENYUSUN -->
        <div style="margin-top: 45px; text-align: ${coverStyle === 'modern_minimalist' ? 'left' : 'center'};">
          <p style="font-size: 9pt; text-transform: uppercase; color: #64748b; margin-bottom: 5px; font-weight: bold; letter-spacing: 1.5px;">
            Disusun Oleh:
          </p>
          <h3 style="font-size: 13pt; color: ${secondaryColorHex}; font-weight: bold; margin: 0 0 3px 0;">
            ${data.informasiPenyusun.namaPenyusun}
          </h3>
          <p style="font-size: 10pt; color: #475569; margin: 0; font-family: monospace;">
            ${data.informasiPenyusun.nipKeterangan || '-'}
          </p>
          <p style="font-size: 9.5pt; font-style: italic; color: #64748b; margin-top: 3px;">
            ${data.informasiPenyusun.jabatan || 'Guru Mata Pelajaran PJOK'}
          </p>
        </div>

        <!-- FOOTER TAHUN -->
        <div style="position: absolute; bottom: 30px; left: 0; right: 0; text-align: center;">
          <p style="font-size: 9.5pt; color: #64748b; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
            ${data.instansi.namaSekolah} &bull; TAHUN AJARAN ${data.detailDokumen.tahunAjaran || '2026/2027'}
          </p>
          <p style="font-size: 8pt; color: #94a3b8; margin-top: 4px;">
            &copy; SADAR PJOK PREMIUM &bull; Halaman Sampul Administrasi Guru SD
          </p>
        </div>

      </div>
    `;
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleCopyAndGoToDocs = async () => {
    setCopySuccess(false);
    const contentHtml = generateCoverDocHtml(currentCoverData);
    const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>Cover_Dokumen_F4</title>
<style>
@page {
  size: ${orientation === 'landscape' ? '330mm 215mm' : '215mm 330mm'};
  margin: 1.2cm;
}
@page Section1 {
  size: ${orientation === 'landscape' ? '935.43pt 609.45pt; mso-page-orientation: landscape;' : '609.45pt 935.43pt; mso-page-orientation: portrait;'};
  margin: 1.2cm;
}
div.Section1 { page: Section1; }
</style>
</head>
<body><div class="Section1">${contentHtml}</div></body></html>`;
    const success = await copyAndOpenGoogleDocs(docHtml);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const handleDownloadDoc = () => {
    const contentHtml = generateCoverDocHtml(currentCoverData);
    const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>Cover_Dokumen_F4</title>
<style>
@page {
  size: ${orientation === 'landscape' ? '330mm 215mm' : '215mm 330mm'};
  margin: 1.2cm;
}
@page Section1 {
  size: ${orientation === 'landscape' ? '935.43pt 609.45pt; mso-page-orientation: landscape;' : '609.45pt 935.43pt; mso-page-orientation: portrait;'};
  margin: 1.2cm;
}
div.Section1 { page: Section1; }
</style>
</head>
<body><div class="Section1">${contentHtml}</div></body></html>`;
    const cleanName = currentCoverData.detailDokumen.jenisDokumen.replace(/[^a-zA-Z0-9]/g, '_');
    downloadDocFile(`Cover_F4_${cleanName}_${orientation}_${currentCoverData.detailDokumen.tahunAjaran.replace(/[^0-9]/g, '_')}.doc`, docHtml);
  };

  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const cleanName = currentCoverData.detailDokumen.jenisDokumen.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Cover_F4_${cleanName}_${orientation}.pdf`;
      let success = false;
      if (canvasRef.current) {
        success = await downloadElementAsPdf(canvasRef.current, fileName, {
          orientation,
          marginMm: 8
        });
      }
      if (!success) {
        const contentHtml = generateCoverDocHtml(currentCoverData);
        await downloadHtmlAsPdf(fileName, contentHtml, {
          orientation,
          marginMm: 10
        });
      }
    } catch (err) {
      console.error('Failed to export Cover F4 PDF:', err);
      printHtmlDocument(generateCoverDocHtml(currentCoverData), 'Sampul Dokumen F4', orientation);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!canvasRef.current) return;
    setIsCapturing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imageUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageUri;
      const cleanName = currentCoverData.detailDokumen.jenisDokumen.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Cover_F4_${cleanName}_${orientation}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to capture cover canvas:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePrintCover = () => {
    printHtmlDocument(generateCoverDocHtml(currentCoverData), 'Sampul Dokumen F4', orientation);
  };

  // Theme styling helpers for preview canvas
  const getStyleThemeClasses = () => {
    const isClassic = coverStyle === 'classic_formal';
    const isModern = coverStyle === 'modern_minimalist';
    const isCute = coverStyle === 'cute_kids';

    let borderClass = '';
    let accentBadgeClass = '';
    let specsTableClass = '';
    let quoteClass = '';
    let primaryText = '';
    let secondaryText = '';

    switch (warnaTema) {
      case 'emerald':
        borderClass = isClassic ? 'border-8 double border-emerald-700' : isModern ? 'border-l-12 border-emerald-600' : isCute ? 'border-4 dashed border-emerald-400 rounded-3xl' : 'border-2 border-emerald-500/40 rounded-xl';
        accentBadgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
        specsTableClass = 'bg-emerald-50/60 border border-emerald-200/80 rounded-xl';
        quoteClass = 'bg-emerald-50/40 border-l-4 border-emerald-600 text-emerald-950';
        primaryText = 'text-emerald-800';
        secondaryText = 'text-emerald-950';
        break;
      case 'teal':
        borderClass = isClassic ? 'border-8 double border-teal-700' : isModern ? 'border-l-12 border-teal-600' : isCute ? 'border-4 dashed border-teal-400 rounded-3xl' : 'border-2 border-teal-500/40 rounded-xl';
        accentBadgeClass = 'bg-teal-100 text-teal-800 border border-teal-200';
        specsTableClass = 'bg-teal-50/60 border border-teal-200/80 rounded-xl';
        quoteClass = 'bg-teal-50/40 border-l-4 border-teal-600 text-teal-950';
        primaryText = 'text-teal-800';
        secondaryText = 'text-teal-950';
        break;
      case 'blue':
        borderClass = isClassic ? 'border-8 double border-blue-700' : isModern ? 'border-l-12 border-blue-600' : isCute ? 'border-4 dashed border-blue-400 rounded-3xl' : 'border-2 border-blue-500/40 rounded-xl';
        accentBadgeClass = 'bg-blue-100 text-blue-800 border border-blue-200';
        specsTableClass = 'bg-blue-50/60 border border-blue-200/80 rounded-xl';
        quoteClass = 'bg-sky-50/40 border-l-4 border-blue-600 text-sky-950';
        primaryText = 'text-blue-800';
        secondaryText = 'text-blue-950';
        break;
      case 'indigo':
        borderClass = isClassic ? 'border-8 double border-indigo-700' : isModern ? 'border-l-12 border-indigo-600' : isCute ? 'border-4 dashed border-indigo-400 rounded-3xl' : 'border-2 border-indigo-500/40 rounded-xl';
        accentBadgeClass = 'bg-indigo-100 text-indigo-800 border border-indigo-200';
        specsTableClass = 'bg-indigo-50/60 border border-indigo-200/80 rounded-xl';
        quoteClass = 'bg-indigo-50/40 border-l-4 border-indigo-600 text-indigo-950';
        primaryText = 'text-indigo-800';
        secondaryText = 'text-indigo-950';
        break;
      case 'slate':
        borderClass = isClassic ? 'border-8 double border-slate-700' : isModern ? 'border-l-12 border-slate-600' : isCute ? 'border-4 dashed border-slate-400 rounded-3xl' : 'border-2 border-slate-400 rounded-xl';
        accentBadgeClass = 'bg-slate-100 text-slate-800 border border-slate-300';
        specsTableClass = 'bg-slate-50 border border-slate-200 rounded-xl';
        quoteClass = 'bg-slate-50 border-l-4 border-slate-700 text-slate-900';
        primaryText = 'text-slate-800';
        secondaryText = 'text-slate-950';
        break;
      case 'amber':
        borderClass = isClassic ? 'border-8 double border-amber-700' : isModern ? 'border-l-12 border-amber-600' : isCute ? 'border-4 dashed border-amber-400 rounded-3xl' : 'border-2 border-amber-500/40 rounded-xl';
        accentBadgeClass = 'bg-amber-100 text-amber-900 border border-amber-200';
        specsTableClass = 'bg-amber-50/60 border border-amber-200/80 rounded-xl';
        quoteClass = 'bg-amber-50/40 border-l-4 border-amber-600 text-amber-950';
        primaryText = 'text-amber-800';
        secondaryText = 'text-amber-950';
        break;
      case 'rose':
        borderClass = isClassic ? 'border-8 double border-rose-700' : isModern ? 'border-l-12 border-rose-600' : isCute ? 'border-4 dashed border-rose-400 rounded-3xl' : 'border-2 border-rose-500/40 rounded-xl';
        accentBadgeClass = 'bg-rose-100 text-rose-800 border border-rose-200';
        specsTableClass = 'bg-rose-50/60 border border-rose-200/80 rounded-xl';
        quoteClass = 'bg-rose-50/40 border-l-4 border-rose-600 text-rose-950';
        primaryText = 'text-rose-800';
        secondaryText = 'text-rose-950';
        break;
      case 'ruby':
        borderClass = isClassic ? 'border-8 double border-red-800' : isModern ? 'border-l-12 border-red-700' : isCute ? 'border-4 dashed border-red-400 rounded-3xl' : 'border-2 border-red-500/40 rounded-xl';
        accentBadgeClass = 'bg-red-100 text-red-900 border border-red-200';
        specsTableClass = 'bg-red-50/60 border border-red-200/80 rounded-xl';
        quoteClass = 'bg-red-50/40 border-l-4 border-red-700 text-red-950';
        primaryText = 'text-red-800';
        secondaryText = 'text-red-950';
        break;
    }

    return {
      borderClass,
      accentBadgeClass,
      specsTableClass,
      quoteClass,
      primaryText,
      secondaryText,
      fontFamily: isClassic ? 'font-serif' : isModern ? 'font-sans tracking-wide' : isCute ? 'font-sans' : 'font-sans'
    };
  };

  const theme = getStyleThemeClasses();

  // Render official educational emblem or user custom logo
  const renderLogo = () => {
    switch (logoType) {
      case 'custom_upload':
        return customLogoUrl ? (
          <div className="flex flex-col items-center justify-center py-2">
            <img src={customLogoUrl} alt="Logo Instansi" className="w-20 h-20 object-contain drop-shadow-sm" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">LOGO SATUAN PENDIDIKAN</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 mt-1">Unggah file logo di panel</p>
          </div>
        );
      case 'tutwuri':
        return (
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-18 h-18 bg-blue-600 rounded-full flex items-center justify-center shadow-md relative border-4 border-amber-300">
              <span className="text-3xl text-white font-bold">🎓</span>
              <div className="absolute -bottom-1 bg-amber-400 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase text-blue-950 border border-white">
                TUT WURI
              </div>
            </div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-1.5">KEMENTERIAN PENDIDIKAN RI</p>
          </div>
        );
      case 'kemenag':
        return (
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-18 h-18 bg-emerald-600 rounded-full flex items-center justify-center shadow-md relative border-4 border-emerald-200">
              <span className="text-3xl text-white font-bold">🕌</span>
              <div className="absolute -bottom-1 bg-emerald-800 text-[8px] px-2 py-0.5 rounded-full font-black uppercase text-white border border-white">
                KEMENAG
              </div>
            </div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-1.5">IKHLAS BERAMAL</p>
          </div>
        );
      case 'pancasila':
        return (
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-18 h-18 bg-amber-500 rounded-full flex items-center justify-center shadow-md relative border-4 border-red-500">
              <span className="text-3xl text-white">🦅</span>
              <div className="absolute -bottom-1 bg-red-600 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase text-white border border-white">
                PANCASILA
              </div>
            </div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-1.5">BHINNEKA TUNGGAL IKA</p>
          </div>
        );
      case 'custom_emoji':
        return (
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-18 h-18 bg-slate-100 rounded-2xl flex items-center justify-center shadow-xs border border-slate-300">
              <span className="text-4xl">{customEmoji}</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">SIMBOL PEMBELAJARAN</p>
          </div>
        );
      case 'none':
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="cover-page-ai-generator">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-8 pointer-events-none">
          <Award className="w-72 h-72 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold uppercase tracking-wider">
              <FileSignature className="w-4 h-4 text-blue-300" />
              Administrasi Resmi Guru SD &bull; Kurikulum Merdeka
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Halaman Cover / Sampul Dokumen Lengkap
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Buat halaman sampul resmi untuk <strong>Buku Daftar Nilai</strong>, <strong>Buku Presensi / Absensi</strong>, <strong>Modul Ajar</strong>, <strong>Jurnal Mengajar</strong>, <strong>Buku Kerja Guru</strong>, dan perangkat lainnya. Semua elemen dapat <strong>di-input secara manual</strong> secara langsung atau disempurnakan dengan bantuan AI.
            </p>
          </div>
          <div className="shrink-0 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/20 no-print">
            <ExportJsonPromptAiButtons
              onExportJson={() => {
                downloadJsonFile(`Cover_${currentCoverData.detailDokumen.jenisDokumen.replace(/\s+/g, '_')}`, {
                  dataCover: currentCoverData,
                  warnaTema,
                  coverStyle,
                  logoType,
                  customEmoji,
                  tanggalEkspor: new Date().toISOString()
                });
              }}
              onOpenPromptAi={() => setShowPromptModal(true)}
            />
          </div>
        </div>
      </div>

      {/* QUICK PRESET BAR: Satu Klik Untuk Semua Dokumen Utama */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs no-print">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Pilihan Cepat Cover Dokumen (Mulai dari Daftar Nilai, Presensi, Modul, dll):
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Klik untuk terapkan otomatis</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {DOCUMENT_PRESETS.slice(0, 8).map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedPresetId === preset.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {preset.id === 'daftar_nilai' && <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />}
              {preset.id === 'rekap_nilai_tp' && <Award className="w-3.5 h-3.5 text-emerald-400" />}
              {preset.id === 'daftar_hadir' && <Calendar className="w-3.5 h-3.5 text-indigo-400" />}
              {preset.id === 'jurnal_mengajar' && <Clock className="w-3.5 h-3.5 text-slate-400" />}
              {preset.id === 'modul_ajar' && <BookOpen className="w-3.5 h-3.5 text-teal-400" />}
              {preset.id === 'buku_kerja_1' && <Layers className="w-3.5 h-3.5 text-blue-400" />}
              {preset.id === 'buku_kerja_2' && <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}
              {preset.id === 'buku_kerja_3' && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{preset.jenisDokumen.split('(')[0].trim()}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Comprehensive Manual Input Controls (Hidden on Print) */}
        <div className="lg:col-span-5 space-y-4 no-print">
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Tab navigation inside left panel */}
            <div className="grid grid-cols-4 bg-slate-100 border-b border-slate-200 text-xs font-bold text-center">
              <button
                type="button"
                onClick={() => setActiveTabLeft('dokumen')}
                className={`py-3 px-2 transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  activeTabLeft === 'dokumen' ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Dokumen</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTabLeft('instansi')}
                className={`py-3 px-2 transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  activeTabLeft === 'instansi' ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <School className="w-4 h-4" />
                <span>Sekolah/Guru</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTabLeft('quote')}
                className={`py-3 px-2 transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  activeTabLeft === 'quote' ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Quote className="w-4 h-4" />
                <span>Slogan & Motto</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTabLeft('desain')}
                className={`py-3 px-2 transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  activeTabLeft === 'desain' ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Gaya & Logo</span>
              </button>
            </div>

            <form onSubmit={handleGenerateCoverAi} className="p-5 space-y-4">
              
              {/* TAB 1: IDENTITAS DOKUMEN */}
              {activeTabLeft === 'dokumen' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilih Jenis Dokumen Resmi
                    </label>
                    <select
                      value={isCustomDocType ? 'custom' : selectedPresetId}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomDocType(true);
                        } else {
                          handleSelectPreset(e.target.value);
                        }
                      }}
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <optgroup label="1. Administrasi Nilai & Kehadiran">
                        <option value="daftar_nilai">Buku Daftar Nilai &amp; Rekapitulasi Nilai Siswa</option>
                        <option value="rekap_nilai_tp">Buku Rekap Nilai Harian per TP (Formatif &amp; Sumatif)</option>
                        <option value="daftar_hadir">Buku Daftar Hadir &amp; Presensi Siswa</option>
                        <option value="rapor_siswa">Buku Rapor &amp; Laporan Hasil Belajar Siswa</option>
                      </optgroup>
                      <optgroup label="2. Administrasi Pembelajaran & Modul">
                        <option value="modul_ajar">Modul Ajar Kurikulum Merdeka</option>
                        <option value="rpp_rpm">Rencana Pembelajaran Mendalam (RPM / Deep Learning)</option>
                        <option value="jurnal_mengajar">Buku Agenda &amp; Jurnal Harian Mengajar Guru</option>
                        <option value="prota_prosem">Program Tahunan &amp; Semester (PROTA / PROSEM)</option>
                        <option value="rpe">Rencana Pekan Efektif (RPE)</option>
                        <option value="atp_cp">Alur Tujuan Pembelajaran (ATP) &amp; CP</option>
                        <option value="kktp">Kriteria Ketercapaian TP (KKTP)</option>
                        <option value="lkpd">Lembar Kerja Peserta Didik (LKPD)</option>
                        <option value="soal_evaluasi">Kumpulan Bank Soal &amp; Kisi-Kisi Sumatif</option>
                      </optgroup>
                      <optgroup label="3. Buku Kerja Guru (PKG / Akreditasi)">
                        <option value="buku_kerja_1">Buku Kerja Guru I (SKL, CP, TP, ATP, Modul Ajar)</option>
                        <option value="buku_kerja_2">Buku Kerja Guru II (Kode Etik, Prota, Prosem, Kalender)</option>
                        <option value="buku_kerja_3">Buku Kerja Guru III (Daftar Hadir, Nilai, Remedial)</option>
                        <option value="buku_kerja_4">Buku Kerja Guru IV (Evaluasi Diri, PKG, SKP, RTL)</option>
                      </optgroup>
                      <optgroup label="4. Kinerja, Ekstrakurikuler, & KOSP">
                        <option value="laporan_kinerja">Laporan Kinerja Guru &amp; Portofolio SKP</option>
                        <option value="ekstrakurikuler">Buku Pembinaan Ekstrakurikuler Olahraga</option>
                        <option value="kosp">Dokumen Kurikulum Operasional (KOSP)</option>
                      </optgroup>
                      <optgroup label="5. Kustom / Bebas">
                        <option value="custom">Lainnya / Input Jenis Dokumen Manual (Ketik Sendiri)</option>
                      </optgroup>
                    </select>
                  </div>

                  {isCustomDocType && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                      <label className="block text-xs font-bold text-amber-900">
                        Ketik Jenis Dokumen Kustom Anda:
                      </label>
                      <input
                        type="text"
                        value={customDocTypeInput}
                        onChange={(e) => setCustomDocTypeInput(e.target.value)}
                        placeholder="Contoh: Dokumen Ujian Praktik PJOK 2026"
                        className="w-full text-xs px-3 py-2 border border-amber-300 rounded-lg bg-white font-semibold"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Judul Utama Cover</span>
                      <span className="text-[10px] text-slate-400 font-normal">Dapat diketik manual</span>
                    </label>
                    <textarea
                      value={judul}
                      onChange={(e) => setJudul(e.target.value)}
                      rows={2}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-bold text-slate-800"
                      placeholder="Masukkan judul utama cover..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subjudul / Penjelasan Dokumen
                    </label>
                    <textarea
                      value={subJudul}
                      onChange={(e) => setSubJudul(e.target.value)}
                      rows={2}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Penjelasan materi pokok, ruang lingkup atau keterangan asesmen..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mata Pelajaran
                    </label>
                    <input
                      type="text"
                      value={mataPelajaran}
                      onChange={(e) => setMataPelajaran(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Pendidikan Jasmani, Olahraga, dan Kesehatan"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kelas / Fase
                      </label>
                      <input
                        type="text"
                        value={kelas}
                        onChange={(e) => setKelas(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Kelas I - VI / Fase B"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Semester
                      </label>
                      <input
                        type="text"
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Semester Ganjil / Genap"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tahun Pelajaran
                    </label>
                    <input
                      type="text"
                      value={tahunAjaran}
                      onChange={(e) => setTahunAjaran(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="2026/2027"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: IDENTITAS GURU & SEKOLAH */}
              {activeTabLeft === 'instansi' && (
                <div className="space-y-4">
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Informasi ini akan tertera pada kolom penyusun dan KOP instansi.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Guru Penyusun (Lengkap &amp; Gelar) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={disusunOleh}
                      onChange={(e) => setDisusunOleh(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                      placeholder="Sandi Rafsanjani, S.Pd."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        NIP / NUPTK
                      </label>
                      <input
                        type="text"
                        value={nip}
                        onChange={(e) => setNip(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="NIP. 19940812 202321 1 002"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jabatan Pendidik
                      </label>
                      <input
                        type="text"
                        value={jabatan}
                        onChange={(e) => setJabatan(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Guru Mata Pelajaran PJOK"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Sekolah / Satuan Pendidikan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={namaSekolah}
                      onChange={(e) => setNamaSekolah(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                      placeholder="SD Negeri Kalimantong"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Dinas Pendidikan
                      </label>
                      <input
                        type="text"
                        value={dinasPendidikan}
                        onChange={(e) => setDinasPendidikan(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Dinas Pendidikan Pemuda & Olahraga"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kota / Kabupaten
                      </label>
                      <input
                        type="text"
                        value={kotaKabupaten}
                        onChange={(e) => setKotaKabupaten(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Kota Bandung"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SLOGAN, MOTTO & KUTIPAN */}
              {activeTabLeft === 'quote' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Slogan / Tagline Sekolah
                    </label>
                    <input
                      type="text"
                      value={taglineSekolah}
                      onChange={(e) => setTaglineSekolah(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Cerdas, Tangguh, Berkarakter, dan Berprestasi"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Kutipan Motivasi / Motto Dokumen</span>
                      <span className="text-[10px] text-slate-400">Manual / Preset</span>
                    </label>
                    <textarea
                      value={kutipanMotivasi}
                      onChange={(e) => setKutipanMotivasi(e.target.value)}
                      rows={3}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white italic"
                      placeholder="Masukkan kata mutiara atau motivasi pendidikan..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sumber Kutipan / Tokoh
                    </label>
                    <input
                      type="text"
                      value={sumberKutipan}
                      onChange={(e) => setSumberKutipan(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Ki Hadjar Dewantara / Pepatah Olahraga"
                    />
                  </div>

                  {/* Quick Quote Inserter */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      Pilih Cepat Kutipan Populer:
                    </span>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {FAMOUS_QUOTES.map((q, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setKutipanMotivasi(q.quote);
                            setSumberKutipan(q.author);
                          }}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 text-[11px] text-slate-700 hover:text-blue-900 border border-slate-200 cursor-pointer transition-colors"
                        >
                          <p className="line-clamp-2 italic">"{q.quote}"</p>
                          <span className="text-[9px] font-bold text-slate-400 block text-right mt-0.5">&mdash; {q.author}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: GAYA, WARNA & LOGO */}
              {activeTabLeft === 'desain' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Orientasi Bentuk Kertas
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrientation('portrait')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          orientation === 'portrait'
                            ? 'border-blue-600 ring-2 ring-blue-300 bg-blue-50/50 text-blue-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Layout className="w-4 h-4 rotate-90 text-blue-600" />
                        <span>Portrait (Tegak A4)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrientation('landscape')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          orientation === 'landscape'
                            ? 'border-blue-600 ring-2 ring-blue-300 bg-blue-50/50 text-blue-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Layout className="w-4 h-4 text-blue-600" />
                        <span>Landscape (Mendatar)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gaya &amp; Ornamen Cover
                    </label>
                    <select
                      value={coverStyle}
                      onChange={(e) => setCoverStyle(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                    >
                      <option value="classic_formal">Formal Tradisional (Garis Ganda, Serif, Ornamen Sudut Klasik)</option>
                      <option value="modern_minimalist">Modern Minimalist (Bersih, Garis Ramping &amp; Elegan)</option>
                      <option value="cute_kids">Cute Playful (Ceria, Berbingkai &amp; Ramah Anak)</option>
                      <option value="creative_art">Artistik Kreatif (Abstrak Geometris, Modern &amp; Dinamis)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Warna Tema Sampul
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'blue', label: 'Ocean Blue', bg: 'bg-blue-600' },
                        { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-600' },
                        { id: 'teal', label: 'Teal Cyan', bg: 'bg-teal-600' },
                        { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600' },
                        { id: 'amber', label: 'Amber Gold', bg: 'bg-amber-600' },
                        { id: 'slate', label: 'Monochrome', bg: 'bg-slate-700' },
                        { id: 'rose', label: 'Rose Pink', bg: 'bg-pink-600' },
                        { id: 'ruby', label: 'Ruby Red', bg: 'bg-red-700' },
                      ].map(color => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setWarnaTema(color.id as any)}
                          className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            warnaTema === color.id
                              ? 'border-blue-600 ring-2 ring-blue-300 bg-blue-50/50 text-blue-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full ${color.bg} shrink-0`}></span>
                          <span className="truncate">{color.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="block text-xs font-bold text-slate-700">
                      Logo / Lambang Sampul
                    </label>
                    <select
                      value={logoType}
                      onChange={(e) => setLogoType(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="tutwuri">Logo Tut Wuri Handayani (Kemendikbudristek)</option>
                      <option value="kemenag">Logo Kementerian Agama RI (Kemenag)</option>
                      <option value="pancasila">Logo Garuda Pancasila</option>
                      <option value="custom_upload">Upload Gambar Logo Sekolah Sendiri (File PNG/JPG)</option>
                      <option value="custom_emoji">Custom Emoji / Simbol Khusus</option>
                      <option value="none">Tanpa Logo (Hanya Teks Bersih)</option>
                    </select>

                    {logoType === 'custom_upload' && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700">Pilih File Logo Sekolah:</span>
                          {customLogoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomLogoUrl(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              Hapus Logo
                            </button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                        {customLogoUrl && (
                          <div className="flex items-center gap-2 pt-1">
                            <img src={customLogoUrl} alt="Pratinjau" className="w-10 h-10 object-contain rounded border border-slate-200 p-0.5 bg-white" />
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Logo sekolah siap ditampilkan di sampul
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {logoType === 'custom_emoji' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customEmoji}
                          onChange={(e) => setCustomEmoji(e.target.value)}
                          maxLength={5}
                          className="w-16 text-center text-xl py-1.5 border border-slate-300 rounded-xl bg-white"
                        />
                        <span className="text-xs text-slate-500">Ketik emoji olahraga atau simbol yang diinginkan</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error alerts if any */}
              {validationError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2.5 rounded-xl text-xs font-semibold">
                  ⚠️ {validationError}
                </div>
              )}

              {apiError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2.5 rounded-xl text-xs leading-relaxed flex items-start gap-2">
                  <span className="text-sm">💡</span>
                  <div>
                    <strong>Pemberitahuan AI:</strong> {apiError}
                    <p className="mt-1 text-[11px] text-amber-800">
                      Anda tetap dapat melanjutkan secara manual langsung. Seluruh perubahan pada form langsung aktif pada pratinjau live di sebelah kanan.
                    </p>
                  </div>
                </div>
              )}

              {/* Dual Action: Manual Sync Notice & AI Enhance Button */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Input Manual Aktif &amp; Terhubung Langsung
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      // Trigger state refresh for safety
                      setJudul(prev => prev);
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Segarkan Pratinjau
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                  title="Gunakan Gemini AI untuk memperkaya redaksi subjudul, slogan, dan kutipan motivasi yang lebih estetik"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Menyusun Redaksi Estetik dengan AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Sempurnakan Redaksi &amp; Quote dengan AI</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Right Column: Interactive Live Cover Canvas Preview */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Top Actions Bar for Export, Print, and Download */}
          <div className="bg-white rounded-2xl shadow-xs p-3.5 border border-slate-200 flex flex-wrap gap-2 justify-between items-center no-print">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileSignature className="w-4 h-4 text-blue-600" />
                <span>Sampul A4:</span>
              </span>

              {/* Fast 1-Click Orientation Switcher */}
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    orientation === 'portrait'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Gunakan format kertas tegak (Portrait)"
                >
                  <Layout className="w-3.5 h-3.5 rotate-90" />
                  <span>Portrait</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    orientation === 'landscape'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Gunakan format kertas mendatar (Landscape)"
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Landscape</span>
                </button>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase hidden sm:inline">
                {orientation === 'landscape' ? 'F4 Landscape' : 'F4 Portrait'}
              </span>
            </div>

            <div className="flex gap-1.5 items-center flex-wrap">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Unduh file PDF ukuran F4 (215mm x 330mm) rapi siap cetak"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF (F4)'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintCover}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Cetak langsung ke printer ukuran F4"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Sampul (F4)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadDoc}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors border border-slate-200 cursor-pointer"
                title="Unduh dokumen Word (.doc) F4"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Word</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isCapturing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors border border-indigo-200 cursor-pointer"
                title="Simpan sebagai gambar PNG resolusi tinggi 2x"
              >
                {isCapturing ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-indigo-700" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Menyimpan PNG...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Unduh PNG</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyAndGoToDocs}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
                title="Salin tata letak cover ke clipboard atau Google Docs"
              >
                {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Salin Docs</span>
              </button>
            </div>
          </div>

          {/* Guidelines Bar */}
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5 no-print">
            <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold text-blue-950">Petunjuk Cetak ({orientation === 'landscape' ? 'Bentuk Kertas Landscape / Mendatar' : 'Bentuk Kertas Portrait / Tegak'}):</span>
              <p className="text-[11px] text-blue-800">
                Tata letak sampul otomatis disesuaikan dengan rasio standar F4 {orientation === 'landscape' ? 'Landscape (Mendatar: 330mm × 215mm)' : 'Portrait (Tegak: 215mm × 330mm)'}. Format Landscape sangat ideal untuk <strong>Buku Nilai, Daftar Hadir, Ledger, dan Buku Agenda</strong>. Klik <strong>"Unduh PDF (F4)"</strong>, <strong>"Cetak Sampul (F4)"</strong>, atau <strong>"Unduh PNG"</strong> untuk hasil beresolusi tinggi.
              </p>
            </div>
          </div>

          {/* Dynamic Print CSS for Portrait / Landscape F4 */}
          <style>{`
            @media print {
              @page {
                size: ${orientation === 'landscape' ? '330mm 215mm' : '215mm 330mm'};
                margin: 0;
              }
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              #cover-page-ai-generator {
                padding: 0 !important;
                margin: 0 !important;
                max-width: 100% !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          {/* LIVE COVER CANVAS (Adapts to Portrait 794x1123px or Landscape 1050x740px) */}
          <div className="border border-slate-200 rounded-2xl shadow-xl bg-slate-100 overflow-x-auto p-4 sm:p-6 flex justify-center">
            <div 
              ref={canvasRef}
              className={`relative bg-white flex flex-col justify-between shadow-2xl overflow-hidden border-box ${theme.fontFamily} ${
                orientation === 'landscape'
                  ? 'w-[1050px] min-h-[740px] p-8 sm:p-10'
                  : 'w-[794px] min-h-[1123px] p-12'
              }`}
              style={{ boxSizing: 'border-box' }}
            >
              
              {/* Outer Decorative Frame Border */}
              <div className={`absolute inset-4 pointer-events-none ${theme.borderClass}`}>
                
                {/* Classic Formal Corner Ornaments */}
                {coverStyle === 'classic_formal' && (
                  <>
                    <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-slate-400"></div>
                    <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-slate-400"></div>
                    <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-slate-400"></div>
                    <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-slate-400"></div>
                  </>
                )}

                {/* Cute Kids Corner Icons */}
                {coverStyle === 'cute_kids' && (
                  <>
                    <span className="absolute top-3 left-3 text-lg">☀️</span>
                    <span className="absolute top-3 right-3 text-lg">🎈</span>
                    <span className="absolute bottom-3 left-3 text-lg">🌸</span>
                    <span className="absolute bottom-3 right-3 text-lg">⭐</span>
                  </>
                )}

                {/* Creative Art Visual Botanical Accents */}
                {coverStyle === 'creative_art' && (
                  <>
                    <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-indigo-200/40 to-transparent rounded-full -translate-x-6 -translate-y-6"></div>
                    <div className="absolute bottom-0 right-0 w-28 h-28 bg-gradient-to-tl from-emerald-200/40 to-transparent rounded-full translate-x-8 translate-y-8"></div>
                  </>
                )}
              </div>

              {/* Creative Art Subtle Backdrop Blobs */}
              {coverStyle === 'creative_art' && (
                <div className="absolute top-1/4 -right-12 w-72 h-72 rounded-full bg-gradient-to-tr from-violet-200/20 via-pink-100/10 to-transparent blur-3xl pointer-events-none"></div>
              )}

              {orientation === 'landscape' ? (
                /* ================= LANDSCAPE SPECIALIZED PANORAMIC LAYOUT ================= */
                <div className="w-full flex-1 flex flex-col justify-between relative z-10">
                  {/* Landscape Header Instansi */}
                  <div className="w-full text-center border-b-2 border-slate-200 pb-2 relative z-10">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 leading-tight">
                      {currentCoverData.instansi.dinasPendidikan || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
                    </p>
                    <h3 className={`text-base sm:text-lg font-black uppercase mt-0.5 tracking-tight ${theme.primaryText}`}>
                      {currentCoverData.instansi.namaSekolah}
                    </h3>
                    <p className="text-[9.5px] font-bold text-slate-500 mt-0.5 italic flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {currentCoverData.instansi.kotaKabupaten} &bull; "{currentCoverData.taglineSekolah}"
                    </p>
                  </div>

                  {/* Landscape Middle: Balanced 2-Column Grid */}
                  <div className="grid grid-cols-12 gap-8 my-auto items-center py-4 relative z-10">
                    {/* Left Column (5 cols): Logo, Disusun Oleh & Quote Motivasi */}
                    <div className="col-span-5 flex flex-col items-center text-center space-y-3.5 border-r border-slate-200/80 pr-6">
                      <div className="scale-105">
                        {renderLogo()}
                      </div>

                      <div className="w-full pt-0.5">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Disusun Oleh:</p>
                        <h4 className={`text-base font-black ${theme.primaryText}`}>
                          {currentCoverData.informasiPenyusun.namaPenyusun}
                        </h4>
                        <p className="text-xs font-mono text-slate-600 font-semibold mt-0.5">
                          {currentCoverData.informasiPenyusun.nipKeterangan || '-'}
                        </p>
                        <p className="text-xs text-slate-500 italic font-medium">
                          {currentCoverData.informasiPenyusun.jabatan || 'Guru Mata Pelajaran PJOK'}
                        </p>
                      </div>

                      <div className={`p-3 rounded-xl text-xs w-full italic ${theme.quoteClass} shadow-2xs text-left`}>
                        <p className="leading-relaxed text-slate-700 font-medium text-[10.5px]">
                          "{currentCoverData.kutipanMotivasi}"
                        </p>
                        <span className={`block text-right text-[9px] font-extrabold uppercase tracking-wider mt-1 ${theme.primaryText}`}>
                          &mdash; {currentCoverData.sumberKutipan}
                        </span>
                      </div>
                    </div>

                    {/* Right Column (7 cols): Document Badge, Title, Subtitle & Specs Table */}
                    <div className="col-span-7 flex flex-col justify-center space-y-3 pl-2">
                      <div>
                        <span className={`inline-block text-[10.5px] font-extrabold uppercase px-4 py-1.5 rounded-full ${theme.accentBadgeClass} mb-2 tracking-wider shadow-2xs`}>
                          📁 {currentCoverData.detailDokumen.jenisDokumen}
                        </span>
                        
                        <h1 className={`text-2xl sm:text-3xl font-black uppercase leading-tight tracking-tight mt-1 ${theme.primaryText}`}>
                          {currentCoverData.judulUtama}
                        </h1>
                        
                        <p className="text-xs sm:text-sm font-medium text-slate-600 italic mt-2 leading-relaxed">
                          "{currentCoverData.subJudulKreatif}"
                        </p>
                      </div>

                      <div className={`p-3.5 ${theme.specsTableClass} w-full shadow-2xs`}>
                        <table className="w-full text-xs font-semibold">
                          <tbody>
                            <tr className="border-b border-slate-200/60">
                              <td className={`py-1.5 pr-3 font-extrabold uppercase tracking-wide text-[10px] ${theme.primaryText}`} width="35%">Mata Pelajaran</td>
                              <td className="py-1.5 text-slate-800">: {currentCoverData.detailDokumen.mataPelajaran || '-'}</td>
                            </tr>
                            <tr className="border-b border-slate-200/60">
                              <td className={`py-1.5 pr-3 font-extrabold uppercase tracking-wide text-[10px] ${theme.primaryText}`}>Kelas / Fase</td>
                              <td className="py-1.5 text-slate-800">: {currentCoverData.detailDokumen.kelasFase || '-'}</td>
                            </tr>
                            <tr className="border-b border-slate-200/60">
                              <td className={`py-1.5 pr-3 font-extrabold uppercase tracking-wide text-[10px] ${theme.primaryText}`}>Semester / Periode</td>
                              <td className="py-1.5 text-slate-800">: {currentCoverData.detailDokumen.semester || '-'}</td>
                            </tr>
                            <tr>
                              <td className={`py-1.5 pr-3 font-extrabold uppercase tracking-wide text-[10px] ${theme.primaryText}`}>Tahun Pelajaran</td>
                              <td className="py-1.5 text-slate-800">: {currentCoverData.detailDokumen.tahunAjaran || '-'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Landscape Footer */}
                  <div className="w-full text-center border-t border-slate-200 pt-2 relative z-10">
                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                      {currentCoverData.instansi.namaSekolah} &bull; TAHUN AJARAN {currentCoverData.detailDokumen.tahunAjaran || '2026/2027'}
                    </p>
                    <p className="text-[8px] text-slate-300 font-mono mt-0.5">&copy; 2026 SADAR PJOK PREMIUM &bull; COVER GENERATOR RESMI</p>
                  </div>
                </div>
              ) : (
                /* ================= PORTRAIT STANDARD ELEGANT LAYOUT ================= */
                <>
                  {/* SECTION 1: TOP HEADER INSTANSI */}
                  <div className="w-full text-center border-b-2 border-slate-200 pb-3 relative z-10">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 leading-tight">
                      {currentCoverData.instansi.dinasPendidikan || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
                    </p>
                    <h3 className={`text-base sm:text-lg font-black uppercase mt-1 tracking-tight ${theme.primaryText}`}>
                      {currentCoverData.instansi.namaSekolah}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5 italic flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {currentCoverData.instansi.kotaKabupaten} &bull; "{currentCoverData.taglineSekolah}"
                    </p>
                  </div>

                  {/* SECTION 2: OFFICIAL LOGO */}
                  <div className="my-2 relative z-10">
                    {renderLogo()}
                  </div>

                  {/* SECTION 3: DOCUMENT TITLE & BADGE */}
                  <div className={`my-3 relative z-10 ${coverStyle === 'modern_minimalist' ? 'text-left pl-6' : 'text-center'}`}>
                    <span className={`inline-block text-[10.5px] font-extrabold uppercase px-4 py-1.5 rounded-full ${theme.accentBadgeClass} mb-3 tracking-wider shadow-2xs`}>
                      📁 {currentCoverData.detailDokumen.jenisDokumen}
                    </span>
                    
                    <h1 className={`text-2xl sm:text-3xl font-black uppercase leading-tight tracking-tight mt-1 max-w-2xl mx-auto ${theme.primaryText}`}>
                      {currentCoverData.judulUtama}
                    </h1>
                    
                    <p className="text-xs sm:text-sm font-medium text-slate-600 italic mt-3 max-w-xl mx-auto leading-relaxed">
                      "{currentCoverData.subJudulKreatif}"
                    </p>
                  </div>

                  {/* SECTION 4: DOCUMENT SPECS TABLE */}
                  <div className={`p-4 relative z-10 ${theme.specsTableClass} max-w-xl mx-auto w-full shadow-2xs`}>
                    <table className="w-full text-xs font-semibold">
                      <tbody>
                        <tr className="border-b border-slate-200/60">
                          <td className={`py-2 pr-4 font-extrabold uppercase tracking-wide text-[10px] ${theme.primaryText}`} width="35%">Mata Pelajaran</td>
                          <td className="py-2 text-slate-800">: {currentCoverData.detailDokumen.mataPelajaran || '-'}</td>
                        </tr>
                        <tr className="border-b border-slate-200/60">
                          <td className={`py-2 pr-4 font-extrabold uppercase tracking-wide text-[10px] ${theme.primaryText}`}>Kelas / Fase</td>
                          <td className="py-2 text-slate-800">: {currentCoverData.detailDokumen.kelasFase || '-'}</td>
                        </tr>
                        <tr className="border-b border-slate-200/60">
                          <td className={`py-2 pr-4 font-extrabold uppercase tracking-wide text-[10px] ${theme.primaryText}`}>Semester / Periode</td>
                          <td className="py-2 text-slate-800">: {currentCoverData.detailDokumen.semester || '-'}</td>
                        </tr>
                        <tr>
                          <td className={`py-2 pr-4 font-extrabold uppercase tracking-wide text-[10px] ${theme.primaryText}`}>Tahun Pelajaran</td>
                          <td className="py-2 text-slate-800">: {currentCoverData.detailDokumen.tahunAjaran || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* SECTION 5: MOTIVATIONAL QUOTE & MOTTO */}
                  <div className={`p-4 rounded-xl text-xs max-w-lg mx-auto italic relative z-10 ${theme.quoteClass} shadow-2xs`}>
                    <p className="leading-relaxed text-slate-700 font-medium">
                      "{currentCoverData.kutipanMotivasi}"
                    </p>
                    <span className={`block text-right text-[10px] font-extrabold uppercase tracking-wider mt-2 ${theme.primaryText}`}>
                      &mdash; {currentCoverData.sumberKutipan}
                    </span>
                  </div>

                  {/* SECTION 6: COMPILER & TEACHER IDENTITY */}
                  <div className={`my-3 relative z-10 ${coverStyle === 'modern_minimalist' ? 'text-left pl-6' : 'text-center'}`}>
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Disusun Oleh:</p>
                    <h4 className={`text-base font-black ${theme.primaryText}`}>
                      {currentCoverData.informasiPenyusun.namaPenyusun}
                    </h4>
                    <p className="text-xs font-mono text-slate-600 font-semibold mt-0.5">
                      {currentCoverData.informasiPenyusun.nipKeterangan || '-'}
                    </p>
                    <p className="text-xs text-slate-500 italic font-medium mt-0.5">
                      {currentCoverData.informasiPenyusun.jabatan || 'Guru Mata Pelajaran PJOK'}
                    </p>
                  </div>

                  {/* SECTION 7: BOTTOM ACADEMIC YEAR FOOTER */}
                  <div className="w-full text-center border-t border-slate-200 pt-3 relative z-10">
                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                      {currentCoverData.instansi.namaSekolah} &bull; TAHUN AJARAN {currentCoverData.detailDokumen.tahunAjaran || '2026/2027'}
                    </p>
                    <p className="text-[8px] text-slate-300 font-mono mt-1">&copy; 2026 SADAR PJOK PREMIUM &bull; COVER GENERATOR RESMI</p>
                  </div>
                </>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT / MIDJOURNEY) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Cover Sampul Administrasi Guru PJOK"
        subtitle={`${currentCoverData.judulUtama} • ${currentCoverData.instansi.namaSekolah}`}
        tabs={getCoverPrompts()}
        jsonData={{
          dataCover: currentCoverData,
          warnaTema,
          coverStyle,
          logoType,
          customEmoji,
          tanggalEkspor: new Date().toISOString()
        }}
        jsonFilename={`Cover_${currentCoverData.detailDokumen.jenisDokumen.replace(/\s+/g, '_')}`}
      />
    </div>
  );
}
