import { ProtaData, ProtaRow } from '../types';

/**
 * PRESET PROGRAM TAHUNAN (PROTA) KURIKULUM MERDEKA PJOK
 * Sesuai Keputusan Kepala BSKAP Nomor 046/H/KR/2025 & Permendikdasmen No. 13 Tahun 2025
 */

export const STORAGE_KEY_PROTA = 'perangkat_ajar_prota_data_v2';

// ----------------------------------------------------
// PRESET KELAS 5 (FASE C) - STANDAR UTAMA
// ----------------------------------------------------
export const PRESET_PROTA_KELAS_5: ProtaData = {
  identitas: {
    namaSekolah: 'SD NEGERI KALIMANTONG',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kelas: '5',
    fase: 'C',
    tahunPelajaran: '2026/2027',
    totalJp2Semester: '144 JP',
    alokasiWaktuTiapMinggu: '4 JP / Pekan',
    semester1Weeks: '19',
    semester2Weeks: '17',
    kepalaSekolah: 'Budi Santoso, S.Pd., M.M.',
    nipKepsek: '19750812 199903 1 002',
    guruMapel: 'Ahmad Fauzi, S.Pd.',
    nipGuru: '19880415 201502 1 003',
    kota: 'Jakarta'
  },
  rows: [
    // SEMESTER 1 (GANJIL)
    {
      no: '1.1',
      bab: 'Bab 1: Permainan Invasi (Sepak Bola Sederhana)',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik dapat mempraktikkan dan menganalisis variasi serta kombinasi pola gerak dasar menendang, menghentikan, dan menggiring bola pada permainan sepak bola sederhana dengan koordinasi yang baik.',
      materi: 'Variasi dan Kombinasi Gerak Dasar Menendang, Menghentikan, & Menggiring Bola',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Formatif & Unjuk Kerja Praktik'
    },
    {
      no: '1.2',
      bab: 'Bab 2: Permainan Net (Bola Voli Modifikasi)',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik dapat menunjukkan kemampuan mempraktikkan variasi pola gerak dasar passing bawah dan passing atas dalam permainan bola voli mini secara berpasangan atau berkelompok.',
      materi: 'Pola Gerak Dasar Passing Bawah & Passing Atas Bola Voli Mini',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Formatif & Penilaian Berpasangan'
    },
    {
      no: '1.3',
      bab: 'Bab 3: Permainan Lapangan (Kasti & Rounders)',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik dapat mempraktikkan dan menerapkan variasi gerak melempar melambung/mendatar, menangkap, dan memukul bola berayun pada permainan kasti/rounders dengan sportivitas tinggi.',
      materi: 'Teknik Dasar Melempar, Menangkap, & Memukul Bola Kasti',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Formatif & Game Lapangan'
    },
    {
      no: '1.4',
      bab: 'Bab 4: Kebugaran Jasmani untuk Kesehatan',
      elemen: 'Bergaya Hidup Aktif',
      tujuanPembelajaran: 'Peserta didik dapat mengidentifikasi dan mempraktikkan bentuk latihan kebugaran jasmani untuk meningkatkan daya tahan jantung-paru (jogging/lari interval) dan kekuatan otot (push-up, sit-up) secara teratur.',
      materi: 'Latihan Sirkuit Kebugaran Jasmani (Cardio & Kekuatan Otot)',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Tes Kebugaran Jasmani Siswa'
    },
    {
      no: '1.5',
      bab: 'Bab 5: Pola Hidup Sehat & Pemeliharaan Alat Reproduksi',
      elemen: 'Memilih Hidup yang Menyehatkan',
      tujuanPembelajaran: 'Peserta didik mampu memahami konsep pemeliharaan kebersihan alat reproduksi pada masa pubertas, memilih makanan sehat bergizi seimbang, dan mengidentifikasi bahaya merokok bagi tubuh.',
      materi: 'Kesehatan Alat Reproduksi Pubertas & Gizi Seimbang Anak',
      alokasiWaktu: '8 JP (2 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Penilaian Kognitif / Presentasi'
    },
    {
      no: '1.6',
      bab: 'Bab 6: Asesmen Sumatif & Cadangan Semester 1',
      elemen: 'Asesmen & Penguatan',
      tujuanPembelajaran: 'Mengukur ketercapaian seluruh tujuan pembelajaran semester ganjil melalui Sumatif Tengah Semester (STS), Sumatif Akhir Semester (SAS), remedial, dan pengayaan materi.',
      materi: 'STS, SAS Ganjil, Remedial, Pengayaan, & Jam Cadangan',
      alokasiWaktu: '16 JP (4 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Sumatif Tengah & Akhir Semester'
    },

    // SEMESTER 2 (GENAP)
    {
      no: '2.1',
      bab: 'Bab 7: Senam Lantai & Ketangkasan',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik dapat mempraktikkan kombinasi rangkaian gerak senam lantai berguling ke depan (forward roll) dan sikap lilin dengan pendaratan terkontrol dan memperhatikan unsur keselamatan.',
      materi: 'Rangkaian Senam Lantai Guling Depan & Keseimbangan Sikap Lilin',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Unjuk Kerja Matras & Pengamanan'
    },
    {
      no: '2.2',
      bab: 'Bab 8: Gerak Berirama (Senam SKJ & Ritmik Kreasi)',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik mampu memperagakan variasi langkah kaki dan ayunan lengan berirama mengikuti ketukan/musik dalam senam kebugaran jasmani secara kompak dan harmonis.',
      materi: 'Senam Irama Langkah Kaki & Ayunan Lengan Berkelompok',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Unjuk Kerja Koreografi Kelompok'
    },
    {
      no: '2.3',
      bab: 'Bab 9: Aktivitas Air & Keselamatan Diri (Renang Gaya Dada)',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik dapat memahami dan mempraktikkan keterampilan gerak meluncur, gerakan tungkai, dan pengambilan napas pada aktivitas air (renang gaya dada modifikasi) atau simulasi keselamatan air.',
      materi: 'Gerak Meluncur, Gerakan Kaki Renang Dada, & Etika Kolam',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Praktik Kolam / Alternatif Darat'
    },
    {
      no: '2.4',
      bab: 'Bab 10: Kerjasama, Kepemimpinan, & Nilai Gerak',
      elemen: 'Belajar Melalui Gerak',
      tujuanPembelajaran: 'Peserta didik mampu menerapkan nilai-nilai sportivitas, tanggung jawab sosial, kerjasama kelompok, dan kepemimpinan dalam berbagai situasi permainan tradisional dan tantangan gerak.',
      materi: 'Permainan Tradisional Kooperatif & Pembentukan Karakter',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Observasi Karakter Profil Pancasila'
    },
    {
      no: '2.5',
      bab: 'Bab 11: Pencegahan Penyakit Menular & Bahaya Obat Terlarang',
      elemen: 'Memilih Hidup yang Menyehatkan',
      tujuanPembelajaran: 'Peserta didik mampu menganalisis cara mencegah penyakit menular dan tidak menular, menjaga kebersihan lingkungan sekolah, serta menjauhi obat-obatan terlarang/NAPZA.',
      materi: 'Pencegahan Penyakit, Kebersihan Lingkungan, & Tolak NAPZA',
      alokasiWaktu: '8 JP (2 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Penilaian Portofolio / Poster Sehat'
    },
    {
      no: '2.6',
      bab: 'Bab 12: Asesmen Sumatif Akhir Tahun (SAT) & Cadangan',
      elemen: 'Asesmen & Penguatan',
      tujuanPembelajaran: 'Melaksanakan evaluasi menyeluruh ketercapaian ATP tahunan melalui Sumatif Akhir Tahun (SAT), uji keterampilan akhir fase, pengolahan nilai rapor, dan pekan cadangan kegiatan sekolah.',
      materi: 'Sumatif Akhir Tahun (SAT), Uji Kebugaran, Remedial, & Cadangan',
      alokasiWaktu: '16 JP (4 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Evaluasi Capaian Akhir Tahun'
    }
  ],
  totalJpSemester1: 72,
  totalJpSemester2: 72,
  totalJpTahunan: 144,
  tanggalDokumen: 'Jakarta, 13 Juli 2026',
  kepalaSekolah: 'Budi Santoso, S.Pd., M.M.',
  guruMapel: 'Ahmad Fauzi, S.Pd.',
  catatan: 'Disusun berdasarkan Alur Tujuan Pembelajaran (ATP) PJOK Fase C dengan bobot 4 JP/pekan dan cadangan waktu proporsional.'
};

// ----------------------------------------------------
// PRESET KELAS 1 (FASE A)
// ----------------------------------------------------
export const PRESET_PROTA_KELAS_1: ProtaData = {
  identitas: {
    namaSekolah: 'SD NEGERI KALIMANTONG',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kelas: '1',
    fase: 'A',
    tahunPelajaran: '2026/2027',
    totalJp2Semester: '144 JP',
    alokasiWaktuTiapMinggu: '4 JP / Pekan',
    semester1Weeks: '19',
    semester2Weeks: '17',
    kepalaSekolah: 'Budi Santoso, S.Pd., M.M.',
    nipKepsek: '19750812 199903 1 002',
    guruMapel: 'Ahmad Fauzi, S.Pd.',
    nipGuru: '19880415 201502 1 003',
    kota: 'Jakarta'
  },
  rows: [
    {
      no: '1.1',
      bab: 'Bab 1: Pola Gerak Dasar Lokomotor',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik mampu mempraktikkan pola gerak dasar berjalan, berlari, dan melompat ke berbagai arah dengan riang gembira dan percaya diri.',
      materi: 'Gerak Lokomotor (Jalan Santai, Lari Zig-zag, Lompat Garis)',
      alokasiWaktu: '16 JP (4 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Observasi Unjuk Kerja'
    },
    {
      no: '1.2',
      bab: 'Bab 2: Pola Gerak Dasar Non-Lokomotor',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik mampu memperagakan gerak non-lokomotor seperti menekuk, meliuk, memutar badan, dan mengayun tangan dalam posisi seimbang di tempat.',
      materi: 'Gerak Non-Lokomotor (Menirukan Pohon, Kupu-kupu, Mengayun Lengan)',
      alokasiWaktu: '16 JP (4 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Praktik Keseimbangan'
    },
    {
      no: '1.3',
      bab: 'Bab 3: Pola Gerak Dasar Manipulatif',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik mampu mempraktikkan keterampilan melempar dan menangkap bola plastik ukuran kecil/sedang secara berpasangan dengan koordinasi mata-tangan.',
      materi: 'Gerak Manipulatif Melempar & Menangkap Bola Ringan',
      alokasiWaktu: '16 JP (4 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Praktik Berpasangan'
    },
    {
      no: '1.4',
      bab: 'Bab 4: Pengenalan Anggota Tubuh & Kebersihan',
      elemen: 'Memilih Hidup yang Menyehatkan',
      tujuanPembelajaran: 'Peserta didik dapat mengenal nama bagian-bagian tubuh, pakaian pelindung, serta kebiasaan mencuci tangan memakai sabun sebelum dan sesudah makan.',
      materi: 'Bagian Tubuh, Kebersihan Tangan, Gigi, & Pakaian Bersih',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Penilaian Sikap Sehat'
    },
    {
      no: '1.5',
      bab: 'Bab 5: Sumatif & Cadangan Ganjil',
      elemen: 'Asesmen & Penguatan',
      tujuanPembelajaran: 'Melaksanakan Sumatif Tengah Semester, Sumatif Akhir Semester ganjil, remedial gerak, serta perayaan permainan anak.',
      materi: 'STS, SAS Ganjil, & Festival Gerak Anak',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Asesmen Semester 1'
    },

    // SEMESTER 2
    {
      no: '2.1',
      bab: 'Bab 6: Aktivitas Senam Ketangkasan Sederhana',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik mampu melakukan gerak bertumpu dengan dua tangan, melompat dari bangku rendah, dan mendarat dengan lutut mengeper secara aman.',
      materi: 'Gerak Bertumpu, Melompat, & Mendarat Aman',
      alokasiWaktu: '16 JP (4 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Praktik Matras Busa'
    },
    {
      no: '2.2',
      bab: 'Bab 7: Gerak Berirama Riang Gembira',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik mampu menggerakkan tubuh mengikuti irama lagu anak-anak atau ketukan tepuk tangan secara berirama dan ceria.',
      materi: 'Senam Irama Anak Musik Ceria (Tepuk & Langkah)',
      alokasiWaktu: '16 JP (4 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Senam Berkelompok'
    },
    {
      no: '2.3',
      bab: 'Bab 8: Pengenalan Aktivitas di Air',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik mengenal air, membasuh wajah, berjalan di kolam dangkal, serta memahami aturan keselamatan di sekitar kolam renang.',
      materi: 'Pengenalan Air Dangkal & Keselamatan Kolam Renang',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Praktik Kolam Dangkal'
    },
    {
      no: '2.4',
      bab: 'Bab 9: Pola Istirahat & Makanan Bergizi',
      elemen: 'Memilih Hidup yang Menyehatkan',
      tujuanPembelajaran: 'Peserta didik memahami pentingnya tidur cukup, minum air putih, dan makan sayur buah untuk pertumbuhan tubuh yang sehat dan kuat.',
      materi: 'Tidur Teratur, Minum Air Putih, & Makanan Sehat Bergizi',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Edukasi Kebiasaan Sehat'
    },
    {
      no: '2.5',
      bab: 'Bab 10: Sumatif Akhir Tahun & Pekan Olahraga Anak',
      elemen: 'Asesmen & Penguatan',
      tujuanPembelajaran: 'Melaksanakan Sumatif Akhir Tahun (SAT) kelas 1, unjuk kerja gerak ceria, remedial, dan pekan perayaan kebugaran.',
      materi: 'SAT Genap, Lomba Gerak Ceria, & Pelaporan Hasil Belajar',
      alokasiWaktu: '16 JP (4 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Asesmen Akhir Tahun'
    }
  ],
  totalJpSemester1: 72,
  totalJpSemester2: 72,
  totalJpTahunan: 144,
  tanggalDokumen: 'Jakarta, 13 Juli 2026',
  kepalaSekolah: 'Budi Santoso, S.Pd., M.M.',
  guruMapel: 'Ahmad Fauzi, S.Pd.',
  catatan: 'Program Tahunan Fase A Kelas 1 dengan pendekatan belajar sambil bermain (play-based learning).'
};

// ----------------------------------------------------
// PRESET KELAS 4 (FASE B)
// ----------------------------------------------------
export const PRESET_PROTA_KELAS_4: ProtaData = {
  identitas: {
    namaSekolah: 'SD NEGERI KALIMANTONG',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kelas: '4',
    fase: 'B',
    tahunPelajaran: '2026/2027',
    totalJp2Semester: '144 JP',
    alokasiWaktuTiapMinggu: '4 JP / Pekan',
    semester1Weeks: '19',
    semester2Weeks: '17',
    kepalaSekolah: 'Budi Santoso, S.Pd., M.M.',
    nipKepsek: '19750812 199903 1 002',
    guruMapel: 'Ahmad Fauzi, S.Pd.',
    nipGuru: '19880415 201502 1 003',
    kota: 'Jakarta'
  },
  rows: [
    {
      no: '1.1',
      bab: 'Bab 1: Permainan Bola Besar (Sepak Bola & Bola Voli)',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik dapat mempraktikkan variasi gerak dasar lokomotor, non-lokomotor, dan manipulatif dalam menendang, menghentikan, dan passing bawah permainan bola besar modifikasi.',
      materi: 'Variasi Gerak Dasar Permainan Bola Besar Modifikasi',
      alokasiWaktu: '16 JP (4 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Unjuk Kerja Praktik'
    },
    {
      no: '1.2',
      bab: 'Bab 2: Permainan Bola Kecil (Kasti Sederhana)',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik mampu mempraktikkan variasi gerak melempar melambung, menangkap bola mendatar, dan memukul bola berayun pada permainan kasti berpasangan.',
      materi: 'Variasi Gerak Dasar Permainan Kasti Modifikasi',
      alokasiWaktu: '16 JP (4 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Praktik & Kerjasama Tim'
    },
    {
      no: '1.3',
      bab: 'Bab 3: Atletik Anak (Lari Cepat & Lompat Katak)',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik dapat memperagakan variasi start lari cepat, lari berkelok-kelok (slalom), serta lompat katak menolak dengan kedua kaki secara terkontrol.',
      materi: 'Dasar-Dasar Atletik Anak (Kids Athletics Sprint & Jump)',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Pengukuran Waktu & Jarak'
    },
    {
      no: '1.4',
      bab: 'Bab 4: Kebugaran Jasmani & Daya Tahan Tubuh',
      elemen: 'Bergaya Hidup Aktif',
      tujuanPembelajaran: 'Peserta didik mampu mempraktikkan aktivitas fisik berupa latihan sirkuit untuk menjaga daya tahan otot dan kelenturan tubuh serta memahami manfaatnya.',
      materi: 'Latihan Sirkuit Kebugaran (Lari Bolak-Balik, Kelenturan Tubuh)',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Tes Kebugaran Dasar'
    },
    {
      no: '1.5',
      bab: 'Bab 5: Kebersihan Lingkungan & Asesmen Ganjil',
      elemen: 'Memilih Hidup yang Menyehatkan',
      tujuanPembelajaran: 'Peserta didik memahami cara menjaga kebersihan lingkungan rumah dan sekolah, serta mengikuti evaluasi sumatif tengah dan akhir semester ganjil.',
      materi: 'Sanitasi Lingkungan, Bahaya Sampah, STS & SAS Ganjil',
      alokasiWaktu: '16 JP (4 Pertemuan)',
      semester: 'I (Ganjil)',
      keterangan: 'Penilaian Kognitif & STS/SAS'
    },

    // SEMESTER 2
    {
      no: '2.1',
      bab: 'Bab 6: Senam Lantai Ketangkasan (Guling Depan & Keseimbangan)',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik mampu mempraktikkan gerak guling ke depan pada matras dengan sikap awalan, berguling membulat, dan sikap akhir jongkok berdiri secara aman.',
      materi: 'Teknik Dasar Guling Depan & Sikap Keseimbangan Matras',
      alokasiWaktu: '16 JP (4 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Praktik Berkelanjutan'
    },
    {
      no: '2.2',
      bab: 'Bab 7: Gerak Berirama (Senam Irama Musik Tradisional)',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik mampu mempraktikkan variasi langkah kaki silang dan ayunan lengan berirama mengikuti musik daerah atau nasional secara serasi.',
      materi: 'Senam Ritmik Variasi Langkah & Ayunan Musik Daerah',
      alokasiWaktu: '16 JP (4 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Unjuk Kerja Kelompok'
    },
    {
      no: '2.3',
      bab: 'Bab 8: Pengenalan Gerak Dasar Renang & Keselamatan',
      elemen: 'Terampil Bergerak',
      tujuanPembelajaran: 'Peserta didik mampu memperagakan gerak dasar meluncur, mengapung di air dangkal, serta memahami pentingnya mematuhi instruksi penjaga kolam.',
      materi: 'Meluncur, Mengapung, & Etika Keselamatan di Kolam Renang',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Praktik Kolam Renang'
    },
    {
      no: '2.4',
      bab: 'Bab 9: Makanan Sehat, Cedera Ringan, & P3K Sekolah',
      elemen: 'Memilih Hidup yang Menyehatkan',
      tujuanPembelajaran: 'Peserta didik mampu mengenal gizi seimbang serta cara sederhana menangani luka lecet atau memar saat berolahraga (metode kompres es).',
      materi: 'Gizi Seimbang "Isi Piringku" & Penanganan Pertama Cedera Olahraga',
      alokasiWaktu: '12 JP (3 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Simulasi P3K Ringan'
    },
    {
      no: '2.5',
      bab: 'Bab 10: Sumatif Akhir Tahun (SAT) & Pengayaan',
      elemen: 'Asesmen & Penguatan',
      tujuanPembelajaran: 'Melaksanakan evaluasi menyeluruh ketercapaian ATP semester genap melalui Sumatif Akhir Tahun (SAT), remedial, dan persiapan kenaikan kelas.',
      materi: 'Sumatif Akhir Tahun (SAT), Pengolahan Nilai, & Jam Cadangan',
      alokasiWaktu: '16 JP (4 Pertemuan)',
      semester: 'II (Genap)',
      keterangan: 'Evaluasi Akhir Tahun'
    }
  ],
  totalJpSemester1: 72,
  totalJpSemester2: 72,
  totalJpTahunan: 144,
  tanggalDokumen: 'Jakarta, 13 Juli 2026',
  kepalaSekolah: 'Budi Santoso, S.Pd., M.M.',
  guruMapel: 'Ahmad Fauzi, S.Pd.',
  catatan: 'Program Tahunan Fase B Kelas 4 SD berfokus pada variasi gerak terkoordinasi dan gaya hidup sehat.'
};

/**
 * Mendapatkan Preset Berdasarkan Kelas
 */
export function getPresetProtaByKelas(kelas: string): ProtaData {
  if (['1', '2'].includes(kelas)) {
    return JSON.parse(JSON.stringify(PRESET_PROTA_KELAS_1));
  } else if (['3', '4'].includes(kelas)) {
    return JSON.parse(JSON.stringify(PRESET_PROTA_KELAS_4));
  } else {
    // Default Kelas 5 & 6 (Fase C)
    return JSON.parse(JSON.stringify(PRESET_PROTA_KELAS_5));
  }
}

/**
 * Hitung Ulang Total Jam Pelajaran dari Baris PROTA
 */
export function recalculateProtaTotals(rows: ProtaRow[]): {
  totalJpSemester1: number;
  totalJpSemester2: number;
  totalJpTahunan: number;
} {
  let totalSmt1 = 0;
  let totalSmt2 = 0;

  rows.forEach((row) => {
    // Ekstrak angka dari string "12 JP", "8 JP (2 Pertemuan)", dsb.
    const match = row.alokasiWaktu.match(/(\d+)\s*JP/i) || row.alokasiWaktu.match(/^(\d+)/);
    const jp = match ? parseInt(match[1], 10) : 0;

    const semClean = row.semester.toLowerCase();
    if (semClean.includes('1') || semClean.includes('ganjil') || semClean.includes('i')) {
      totalSmt1 += jp;
    } else {
      totalSmt2 += jp;
    }
  });

  return {
    totalJpSemester1: totalSmt1,
    totalJpSemester2: totalSmt2,
    totalJpTahunan: totalSmt1 + totalSmt2
  };
}

/**
 * Penyimpanan Lokal (LocalStorage)
 */
export function loadSavedProta(): ProtaData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROTA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.rows) && parsed.rows.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Gagal membaca data PROTA dari localStorage', e);
  }
  return JSON.parse(JSON.stringify(PRESET_PROTA_KELAS_5));
}

export function saveProtaToStorage(data: ProtaData): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROTA, JSON.stringify(data));
  } catch (e) {
    console.error('Gagal menyimpan data PROTA ke localStorage', e);
  }
}

export function resetProtaStorage(): ProtaData {
  try {
    localStorage.removeItem(STORAGE_KEY_PROTA);
  } catch (e) {
    console.error('Gagal reset data PROTA', e);
  }
  return JSON.parse(JSON.stringify(PRESET_PROTA_KELAS_5));
}
