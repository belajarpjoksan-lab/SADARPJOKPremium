/**
 * KATALOG RESMI BUKU PANDUAN GURU & BUKU SISWA PJOK SD/MI (KELAS I - VI)
 * SISTEM INFORMASI PERBUKUAN INDONESIA (SIBI)
 * Pusat Perbukuan - Badan Standar, Kurikulum, dan Asesmen Pendidikan (BSKAP)
 * Kementerian Pendidikan Dasar dan Menengah Republik Indonesia (https://buku.kemendikdasmen.go.id)
 */

export interface SibiUnitItem {
  id: string;
  grade: string;
  fase: 'Fase A' | 'Fase B' | 'Fase C';
  semester: '1' | '2';
  unitNumber: number;
  unitCode: string;
  unitTitle: string;
  pokokMateri: string;
  elemenCp: string;
  alokasiJp: string;
  alokasiPertemuan: string;
  pemanasanPermainan: string;
  aktivitasPembelajaran: string[];
  kataKunci: string[];
  tujuanPembelajaran: string[];
  sumberBukuSibi: string;
}

export interface SibiBookMetadata {
  grade: string;
  romanGrade: string;
  fase: 'Fase A' | 'Fase B' | 'Fase C';
  judulBukuGuru: string;
  penulis: string;
  penerbit: string;
  tahunTerbit: string;
  isbn: string;
  urlSibi: string;
  citationFull: string;
  units: SibiUnitItem[];
}

export const SIBI_PJOK_BOOKS: Record<string, SibiBookMetadata> = {
  '1': {
    grade: '1',
    romanGrade: 'I',
    fase: 'Fase A',
    judulBukuGuru: 'Buku Panduan Guru Pendidikan Jasmani, Olahraga, dan Kesehatan untuk SD/MI Kelas I',
    penulis: 'Muhajir & Agus Gunawan',
    penerbit: 'Pusat Perbukuan, BSKAP Kementerian Pendidikan Dasar dan Menengah RI (SIBI)',
    tahunTerbit: '2022 / Edisi Revisi Kurikulum Nasional',
    isbn: '978-602-244-877-8',
    urlSibi: 'https://buku.kemendikdasmen.go.id',
    citationFull: 'Muhajir & Agus Gunawan. Buku Panduan Guru Pendidikan Jasmani, Olahraga, dan Kesehatan untuk SD/MI Kelas I. Jakarta: Pusat Perbukuan BSKAP Kemendikdasmen RI (SIBI - buku.kemendikdasmen.go.id).',
    units: [
      {
        id: 'sibi-k1-u1',
        grade: '1',
        fase: 'Fase A',
        semester: '1',
        unitNumber: 1,
        unitCode: 'Unit 1',
        unitTitle: 'Unit 1: Aktivitas Pola Gerak Dasar Lokomotor',
        pokokMateri: 'Gerak Dasar Berjalan, Berlari, dan Melompat',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Menirukan Gerak Hewan di Hutan" (Kelinci melompat, kuda berlari, bebek berjalan)',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan gerak dasar berjalan lurus, berjalan langkah panjang-pendek, dan berjalan di atas garis lurus.',
          'Aktivitas Pembelajaran 2: Mempraktikkan gerak dasar berlari ke depan, berlari berbelok-belok (zig-zag) melewati corong/cone.',
          'Aktivitas Pembelajaran 3: Mempraktikkan gerak dasar melompat satu kaki dan meloncat dua kaki melewati rintangan rendah dalam permainan sederhana.'
        ],
        kataKunci: ['Gerak Lokomotor', 'Berjalan', 'Berlari', 'Melompat', 'Berpindah Tempat'],
        tujuanPembelajaran: [
          'Murid dapat memahami dan menjelaskan prosedur pola gerak dasar lokomotor (berjalan, berlari, dan melompat) sesuai buku panduan SIBI.',
          'Murid dapat mempraktikkan pola gerak dasar berjalan, berlari, dan melompat dalam berbagai permainan sederhana dengan koordinasi yang baik.',
          'Murid menunjukkan sikap mandiri, berani mencoba, kerja sama, dan menaati aturan permainan (fair play).'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas I (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 1, hlm. 1–34.'
      },
      {
        id: 'sibi-k1-u2',
        grade: '1',
        fase: 'Fase A',
        semester: '1',
        unitNumber: 2,
        unitCode: 'Unit 2',
        unitTitle: 'Unit 2: Aktivitas Pola Gerak Dasar Nonlokomotor',
        pokokMateri: 'Gerak Memutar, Mengayun, Membungkuk, Menekuk, dan Meliuk',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Pohon Tertiup Angin" dan "Kepala Pundak Lutut Kaki"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan gerak dasar memutar badan dan mengayunkan kedua lengan ke depan, belakang, dan samping.',
          'Aktivitas Pembelajaran 2: Mempraktikkan gerak dasar membungkukkan badan dan menekuk lutut (ke depan dan ke belakang) di tempat.',
          'Aktivitas Pembelajaran 3: Mempraktikkan gerak dasar meliukkan badan ke kiri dan ke kanan menirukan pohon tertiup angin.'
        ],
        kataKunci: ['Gerak Nonlokomotor', 'Memutar', 'Mengayun', 'Menekuk', 'Meliuk'],
        tujuanPembelajaran: [
          'Murid dapat mengidentifikasi prosedur gerak dasar nonlokomotor (memutar, mengayun, membungkuk, menekuk, dan meliuk) tanpa berpindah tempat.',
          'Murid dapat mempraktikkan variasi gerak dasar nonlokomotor dengan kelenturan dan keseimbangan tubuh yang baik.',
          'Murid menunjukkan sikap disiplin, gembira, dan tanggung jawab selama aktivitas pembelajaran.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas I (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 2, hlm. 35–68.'
      },
      {
        id: 'sibi-k1-u3',
        grade: '1',
        fase: 'Fase A',
        semester: '1',
        unitNumber: 3,
        unitCode: 'Unit 3',
        unitTitle: 'Unit 3: Aktivitas Pola Gerak Dasar Manipulatif',
        pokokMateri: 'Gerak Dasar Melempar dan Menangkap Bola',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Kucing dan Bola Berantai" dalam lingkaran',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan gerak dasar melambungkan dan menangkap bola kecil/besar di tempat secara mandiri.',
          'Aktivitas Pembelajaran 2: Mempraktikkan gerak dasar melempar bola menggelinding, mendatar, dan melambung ke sasaran/target.',
          'Aktivitas Pembelajaran 3: Mempraktikkan gerak dasar melempar dan menangkap bola secara berpasangan dalam permainan modifikasi.'
        ],
        kataKunci: ['Gerak Manipulatif', 'Melempar Bola', 'Menangkap Bola', 'Koordinasi Mata-Tangan'],
        tujuanPembelajaran: [
          'Murid dapat memahami konsep pola gerak dasar manipulatif melempar dan menangkap bola sesuai buku panduan SIBI.',
          'Murid dapat mempraktikkan gerak dasar melempar dan menangkap bola secara mandiri maupun berpasangan dengan koordinasi mata dan tangan.',
          'Murid menunjukkan sikap kerja sama, sportivitas, dan saling menghargai teman.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas I (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 3, hlm. 69–104.'
      },
      {
        id: 'sibi-k1-u4',
        grade: '1',
        fase: 'Fase A',
        semester: '1',
        unitNumber: 4,
        unitCode: 'Unit 4',
        unitTitle: 'Unit 4: Aktivitas Senam',
        pokokMateri: 'Gerak Dominan Keseimbangan Statis, Dinamis, dan Bertumpu',
        elemenCp: 'Terampil Bergerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Patung Pesawat Terbang" dan "Meniti Jembatan Garis"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan gerak keseimbangan statis berdiri satu kaki (sikap bangau dan sikap kapal terbang).',
          'Aktivitas Pembelajaran 2: Mempraktikkan gerak keseimbangan duduk membentuk huruf V dan bertumpu dengan kedua tangan di matras.',
          'Aktivitas Pembelajaran 3: Mempraktikkan gerak keseimbangan dinamis berjalan di atas garis lurus dan balok titian rendah.'
        ],
        kataKunci: ['Aktivitas Senam', 'Keseimbangan Statis', 'Keseimbangan Dinamis', 'Sikap Kapal Terbang'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan cara menjaga keseimbangan tubuh dalam posisi diam (statis) dan bergerak (dinamis).',
          'Murid dapat mempraktikkan gerak keseimbangan statis dan dinamis di atas matras/garis dengan aman dan percaya diri.',
          'Murid menunjukkan sikap berani, hati-hati, dan menjaga keselamatan diri serta teman.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas I (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 4, hlm. 105–134.'
      },
      {
        id: 'sibi-k1-u5',
        grade: '1',
        fase: 'Fase A',
        semester: '2',
        unitNumber: 5,
        unitCode: 'Unit 5',
        unitTitle: 'Unit 5: Aktivitas Gerak Berirama',
        pokokMateri: 'Gerak Langkah Kaki dan Ayunan Lengan Mengikuti Irama/Ketukan',
        elemenCp: 'Terampil Bergerak & Bergaya Hidup Aktif',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Tepuk Irama Gembira" dan gerak lagu anak-anak',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan gerak langkah kaki ke depan, belakang, samping kiri dan kanan sesuai ketukan/tepukan tangan.',
          'Aktivitas Pembelajaran 2: Mempraktikkan gerak mengayunkan lengan berirama secara perorangan dan berkelompok.',
          'Aktivitas Pembelajaran 3: Mempraktikkan rangkaian gerak langkah kaki dan ayunan lengan diiringi lagu anak-anak dengan gembira.'
        ],
        kataKunci: ['Gerak Berirama', 'Irama Ketukan', 'Langkah Kaki', 'Ayunan Lengan'],
        tujuanPembelajaran: [
          'Murid dapat mengenali ketukan dan irama dalam melakukan gerak langkah kaki serta ayunan lengan.',
          'Murid dapat mempraktikkan gerak berirama mengikuti tepukan atau musik lagu anak-anak secara kompak.',
          'Murid menunjukkan rasa percaya diri, kreativitas, dan kegembiraan dalam bergerak.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas I (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 5, hlm. 135–162.'
      },
      {
        id: 'sibi-k1-u6',
        grade: '1',
        fase: 'Fase A',
        semester: '2',
        unitNumber: 6,
        unitCode: 'Unit 6',
        unitTitle: 'Unit 6: Aktivitas Pengenalan Air',
        pokokMateri: 'Permainan di Air, Membasuh Wajah, dan Keselamatan di Kolam Renang',
        elemenCp: 'Terampil Bergerak & Memilih Hidup yang Menyehatkan',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Pemanasan tepi kolam dan permainan "Tangkap Ikan di Air Dangkal"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Memahami aturan keselamatan di kolam renang dan mempraktikkan duduk mencipratkan air dengan kaki.',
          'Aktivitas Pembelajaran 2: Mempraktikkan berjalan di kolam dangkal sambil berpegangan tangan secara berpasangan/berkelompok.',
          'Aktivitas Pembelajaran 3: Mempraktikkan membasuh wajah, memasukkan kepala sejenak ke air, dan membuang napas dari mulut di permukaan air.'
        ],
        kataKunci: ['Pengenalan Air', 'Kolam Dangkal', 'Keselamatan di Air', 'Keberanian'],
        tujuanPembelajaran: [
          'Murid dapat memahami aturan keselamatan diri dan orang lain saat berada di lingkungan kolam/air.',
          'Murid dapat mempraktikkan aktivitas pengenalan air (berjalan di air dan membasuh wajah) dengan berani dan aman.',
          'Murid menunjukkan sikap disiplin mematuhi instruksi guru dan menjaga keselamatan.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas I (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 6, hlm. 163–190.'
      },
      {
        id: 'sibi-k1-u7',
        grade: '1',
        fase: 'Fase A',
        semester: '2',
        unitNumber: 7,
        unitCode: 'Unit 7',
        unitTitle: 'Unit 7: Aktivitas Kebugaran Jasmani yang Berkaitan dengan Kesehatan',
        pokokMateri: 'Sikap Tubuh dalam Posisi Diam (Duduk/Berdiri) dan Sikap Tubuh Bergerak',
        elemenCp: 'Bergaya Hidup Aktif',
        alokasiJp: '8 JP (2 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Barisan Tentara Tegap"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan sikap tubuh duduk yang benar saat membaca/menulis dan sikap berdiri tegak anatomis.',
          'Aktivitas Pembelajaran 2: Mempraktikkan sikap tubuh dalam posisi bergerak (berjalan tegak dan berjalan membawa beban ringan di atas kepala).',
          'Aktivitas Pembelajaran 3: Mengevaluasi postur tubuh bersama teman sebaya agar tulang punggung tumbuh sehat.'
        ],
        kataKunci: ['Kebugaran Jasmani', 'Sikap Tubuh', 'Postur Duduk', 'Postur Berdiri'],
        tujuanPembelajaran: [
          'Murid dapat mengenali sikap tubuh yang benar saat duduk, berdiri, dan berjalan untuk menjaga kesehatan tulang.',
          'Murid dapat mempraktikkan sikap tubuh diam dan bergerak dengan postur yang tegak dan seimbang.',
          'Murid membiasakan postur tubuh yang sehat dalam aktivitas belajar sehari-hari.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas I (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 7, hlm. 191–216.'
      },
      {
        id: 'sibi-k1-u8',
        grade: '1',
        fase: 'Fase A',
        semester: '2',
        unitNumber: 8,
        unitCode: 'Unit 8',
        unitTitle: 'Unit 8: Mengenal Bagian-Bagian Tubuh',
        pokokMateri: 'Fungsi Bagian Tubuh, Bagian Tubuh yang Boleh/Tidak Boleh Disentuh, dan Kebersihan Diri',
        elemenCp: 'Memilih Hidup yang Menyehatkan',
        alokasiJp: '8 JP (2 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Lagu & Gerak "Sentuhan Boleh, Sentuhan Tidak Boleh" serta "Dua Mata Saya"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mengidentifikasi bagian-bagian tubuh (kepala, badan, tangan, kaki, panca indra) beserta kegunaannya.',
          'Aktivitas Pembelajaran 2: Mengidentifikasi bagian tubuh pribadi yang boleh dan tidak boleh disentuh oleh orang lain untuk menjaga keselamatan diri.',
          'Aktivitas Pembelajaran 3: Mempraktikkan cara menjaga kebersihan tubuh (mencuci tangan 6 langkah, menggosok gigi, mandi) dan kebersihan pakaian.'
        ],
        kataKunci: ['Bagian Tubuh', 'Kebersihan Diri', 'Pelindungan Diri', 'Hidup Sehat'],
        tujuanPembelajaran: [
          'Murid dapat menyebutkan bagian-bagian tubuh, fungsinya, serta cara merawat kebersihannya.',
          'Murid dapat membedakan bagian tubuh yang boleh dan tidak boleh disentuh orang lain sebagai perlindungan diri.',
          'Murid membiasakan perilaku hidup bersih dan sehat di rumah maupun di sekolah.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas I (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 8, hlm. 217–244.'
      }
    ]
  },

  '2': {
    grade: '2',
    romanGrade: 'II',
    fase: 'Fase A',
    judulBukuGuru: 'Buku Panduan Guru Pendidikan Jasmani, Olahraga, dan Kesehatan untuk SD/MI Kelas II',
    penulis: 'Muhajir & Hariyanto',
    penerbit: 'Pusat Perbukuan, BSKAP Kementerian Pendidikan Dasar dan Menengah RI (SIBI)',
    tahunTerbit: '2022 / Edisi Revisi Kurikulum Nasional',
    isbn: '978-602-244-881-5',
    urlSibi: 'https://buku.kemendikdasmen.go.id',
    citationFull: 'Muhajir & Hariyanto. Buku Panduan Guru Pendidikan Jasmani, Olahraga, dan Kesehatan untuk SD/MI Kelas II. Jakarta: Pusat Perbukuan BSKAP Kemendikdasmen RI (SIBI - buku.kemendikdasmen.go.id).',
    units: [
      {
        id: 'sibi-k2-u1',
        grade: '2',
        fase: 'Fase A',
        semester: '1',
        unitNumber: 1,
        unitCode: 'Unit 1',
        unitTitle: 'Unit 1: Aktivitas Variasi Pola Gerak Dasar Lokomotor',
        pokokMateri: 'Variasi Gerak Dasar Jalan, Lari, Lompat, dan Loncat Melewati Rintangan',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Menjala Ikan" dan "Lompat Kanguru Berantai"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan variasi gerak dasar berjalan maju, mundur, menyamping, dan berjalan berjinjit mengikuti garis.',
          'Aktivitas Pembelajaran 2: Mempraktikkan variasi gerak dasar berlari cepat, berlari melewati rintangan kardus/gawang rendah, dan lari bolak-balik.',
          'Aktivitas Pembelajaran 3: Mempraktikkan variasi gerak dasar melompat dan meloncat ke dalam lingkaran simpai (hula hoop) secara berkesinambungan.'
        ],
        kataKunci: ['Variasi Lokomotor', 'Jalan', 'Lari Rintangan', 'Loncat Simpai'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan prosedur variasi pola gerak dasar lokomotor jalan, lari, dan lompat sesuai buku panduan SIBI Kelas II.',
          'Murid dapat mempraktikkan variasi gerak dasar berjalan, berlari, dan melompat melewati rintangan dalam permainan sederhana.',
          'Murid menunjukkan sikap sportivitas, disiplin, dan kerja sama kelompok.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas II (Muhajir & Hariyanto, Pusat Perbukuan BSKAP - SIBI), Unit 1, hlm. 1–36.'
      },
      {
        id: 'sibi-k2-u2',
        grade: '2',
        fase: 'Fase A',
        semester: '1',
        unitNumber: 2,
        unitCode: 'Unit 2',
        unitTitle: 'Unit 2: Aktivitas Variasi Pola Gerak Dasar Nonlokomotor',
        pokokMateri: 'Variasi Gerak Memutar, Mengayun, Menekuk, dan Meliuk',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Kincir Angin Berputar" dan "Cermin Gerak Berpasangan"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan variasi gerak memutar lengan, memutar pinggang, dan mengayunkan lengan ke berbagai arah.',
          'Aktivitas Pembelajaran 2: Mempraktikkan variasi gerak menekuk lutut, membungkukkan badan menyentuh ujung kaki, dan peregangan otot.',
          'Aktivitas Pembelajaran 3: Mempraktikkan variasi gerak meliukkan badan menggunakan simpai/bola secara perorangan dan berpasangan.'
        ],
        kataKunci: ['Variasi Nonlokomotor', 'Memutar Lengan', 'Menekuk Lutut', 'Meliukkan Badan'],
        tujuanPembelajaran: [
          'Murid dapat memahami variasi gerak dasar nonlokomotor (memutar, mengayun, menekuk, dan meliuk).',
          'Murid dapat mempraktikkan variasi gerak dasar nonlokomotor dengan koordinasi dan kelenturan yang baik.',
          'Murid menunjukkan sikap tanggung jawab dan antusiasme dalam belajar.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas II (Muhajir & Hariyanto, Pusat Perbukuan BSKAP - SIBI), Unit 2, hlm. 37–68.'
      },
      {
        id: 'sibi-k2-u3',
        grade: '2',
        fase: 'Fase A',
        semester: '1',
        unitNumber: 3,
        unitCode: 'Unit 3',
        unitTitle: 'Unit 3: Aktivitas Variasi Pola Gerak Dasar Manipulatif',
        pokokMateri: 'Variasi Gerak Melempar, Menangkap, Menendang, dan Menahan Bola',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Lempar Tangkap Bola Sasaran" dan "Kucing-Kucingan Bola"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan variasi melempar dan menangkap bola kecil serta bola besar dengan berbagai arah lambungan.',
          'Aktivitas Pembelajaran 2: Mempraktikkan variasi menendang dan menahan/menghentikan bola menggunakan kaki bagian dalam dan luar.',
          'Aktivitas Pembelajaran 3: Mempraktikkan permainan modifikasi lempar-tangkap dan tendang-tahan bola secara berkelompok.'
        ],
        kataKunci: ['Variasi Manipulatif', 'Lempar Tangkap', 'Menendang Bola', 'Menahan Bola'],
        tujuanPembelajaran: [
          'Murid dapat menguraikan cara melakukan variasi gerak melempar, menangkap, menendang, dan menahan bola.',
          'Murid dapat mempraktikkan variasi gerak manipulatif menggunakan bola kecil dan bola besar secara terkontrol.',
          'Murid menerapkan kerja sama dan menaati peraturan permainan untuk fair play.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas II (Muhajir & Hariyanto, Pusat Perbukuan BSKAP - SIBI), Unit 3, hlm. 69–106.'
      },
      {
        id: 'sibi-k2-u4',
        grade: '2',
        fase: 'Fase A',
        semester: '1',
        unitNumber: 4,
        unitCode: 'Unit 4',
        unitTitle: 'Unit 4: Aktivitas Senam',
        pokokMateri: 'Variasi Pola Gerak Dominan Senam (Bertumpu, Keseimbangan, Tolakan, Melayang, Mendarat)',
        elemenCp: 'Terampil Bergerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Loncat Katak Mendarat Empuk"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan gerak bertumpu dengan tangan dan keseimbangan statis/dinamis di atas matras.',
          'Aktivitas Pembelajaran 2: Mempraktikkan gerak menolak, melayang, dan mendarat dengan kedua kaki mengeper dari boks rendah.',
          'Aktivitas Pembelajaran 3: Mempraktikkan gerak berguling ke samping (log roll) dan awalan guling depan di atas matras dengan pengawasan guru.'
        ],
        kataKunci: ['Gerak Dominan Senam', 'Bertumpu', 'Tolakan', 'Mendarat Mengeper'],
        tujuanPembelajaran: [
          'Murid dapat memahami prosedur gerak dominan senam (bertumpu, keseimbangan, tolakan, dan mendarat).',
          'Murid dapat mempraktikkan variasi gerak dominan senam lantai di atas matras dengan aman.',
          'Murid menunjukkan keberanian, percaya diri, dan kepedulian terhadap keselamatan.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas II (Muhajir & Hariyanto, Pusat Perbukuan BSKAP - SIBI), Unit 4, hlm. 107–138.'
      },
      {
        id: 'sibi-k2-u5',
        grade: '2',
        fase: 'Fase A',
        semester: '2',
        unitNumber: 5,
        unitCode: 'Unit 5',
        unitTitle: 'Unit 5: Aktivitas Gerak Berirama',
        pokokMateri: 'Variasi Gerak Langkah Kaki dan Ayunan Lengan Mengikuti Irama',
        elemenCp: 'Terampil Bergerak & Bergaya Hidup Aktif',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Kereta Api Berirama"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan variasi gerak langkah tunggal dan langkah rapat mengikuti ketukan.',
          'Aktivitas Pembelajaran 2: Mempraktikkan variasi gerak ayunan satu lengan dan dua lengan ke depan, belakang, dan samping.',
          'Aktivitas Pembelajaran 3: Mempraktikkan gabungan langkah kaki dan ayunan lengan mengikuti irama musik secara berkelompok.'
        ],
        kataKunci: ['Gerak Berirama', 'Langkah Rapat', 'Ayunan Lengan', 'Kekompakan'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan variasi langkah kaki dan ayunan lengan dalam aktivitas gerak berirama.',
          'Murid dapat mempraktikkan rangkaian gerak berirama sesuai ketukan/musik dengan gembira.',
          'Murid menunjukkan kekompakan, kerja sama, dan semangat bergerak aktif.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas II (Muhajir & Hariyanto, Pusat Perbukuan BSKAP - SIBI), Unit 5, hlm. 139–168.'
      },
      {
        id: 'sibi-k2-u6',
        grade: '2',
        fase: 'Fase A',
        semester: '2',
        unitNumber: 6,
        unitCode: 'Unit 6',
        unitTitle: 'Unit 6: Aktivitas Pengenalan Air',
        pokokMateri: 'Mengapung, Meluncur, dan Keselamatan di Kolam Renang',
        elemenCp: 'Terampil Bergerak & Memilih Hidup yang Menyehatkan',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Terowongan Air" di kolam dangkal',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan latihan pernapasan di air dan mengapung telungkup berpegangan pada dinding kolam.',
          'Aktivitas Pembelajaran 2: Mempraktikkan gerak meluncur dengan tolakan kaki dari dinding kolam menggunakan papan pelampung.',
          'Aktivitas Pembelajaran 3: Mempraktikkan gerak tendangan kaki di air dan aturan keselamatan di kolam renang.'
        ],
        kataKunci: ['Pengenalan Air', 'Mengapung', 'Meluncur', 'Papan Pelampung'],
        tujuanPembelajaran: [
          'Murid dapat memahami prosedur mengapung, meluncur, dan menjaga keselamatan di air.',
          'Murid dapat mempraktikkan gerak mengapung dan meluncur sederhana di kolam dangkal dengan bantuan pelampung.',
          'Murid menunjukkan sikap disiplin, hati-hati, dan berani.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas II (Muhajir & Hariyanto, Pusat Perbukuan BSKAP - SIBI), Unit 6, hlm. 169–198.'
      },
      {
        id: 'sibi-k2-u7',
        grade: '2',
        fase: 'Fase A',
        semester: '2',
        unitNumber: 7,
        unitCode: 'Unit 7',
        unitTitle: 'Unit 7: Aktivitas Kebugaran Jasmani untuk Kesehatan',
        pokokMateri: 'Latihan Kekuatan Otot Lengan, Bahu, Dada, Perut, dan Keseimbangan',
        elemenCp: 'Bergaya Hidup Aktif',
        alokasiJp: '8 JP (2 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Gerobak Dorong Berpasangan" dan "Kepiting Berjalan"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan latihan kekuatan otot lengan dan bahu melalui permainan mendorong telapak tangan dan jalan kepiting.',
          'Aktivitas Pembelajaran 2: Mempraktikkan latihan kekuatan otot perut dan punggung melalui gerak sit-up modifikasi dengan bola.',
          'Aktivitas Pembelajaran 3: Mempraktikkan latihan keseimbangan statis dan dinamis dalam sirkuit kebugaran ceria.'
        ],
        kataKunci: ['Kebugaran Jasmani', 'Kekuatan Otot', 'Keseimbangan', 'Gaya Hidup Aktif'],
        tujuanPembelajaran: [
          'Murid dapat mengidentifikasi manfaat latihan kekuatan otot dan keseimbangan bagi kesehatan tubuh.',
          'Murid dapat mempraktikkan latihan kekuatan otot lengan, perut, dan keseimbangan melalui permainan.',
          'Murid berpartisipasi aktif dan mengenali manfaat aktivitas jasmani yang menyenangkan.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas II (Muhajir & Hariyanto, Pusat Perbukuan BSKAP - SIBI), Unit 7, hlm. 199–226.'
      },
      {
        id: 'sibi-k2-u8',
        grade: '2',
        fase: 'Fase A',
        semester: '2',
        unitNumber: 8,
        unitCode: 'Unit 8',
        unitTitle: 'Unit 8: Cara Menjaga Kebersihan Lingkungan',
        pokokMateri: 'Menjaga Kebersihan Kamar Tidur, Rumah, Kelas, dan Lingkungan Sekolah',
        elemenCp: 'Memilih Hidup yang Menyehatkan',
        alokasiJp: '8 JP (2 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Simulasi "Detektif Lingkungan Bersih & Pemilihan Sampah"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mengidentifikasi cara menjaga kebersihan tempat tidur dan lingkungan rumah agar bebas penyakit.',
          'Aktivitas Pembelajaran 2: Mempraktikkan cara menjaga kebersihan ruang kelas dan halaman sekolah serta memilah sampah organik/anorganik.',
          'Aktivitas Pembelajaran 3: Menyusun jadwal kebiasaan hidup bersih di rumah dan di sekolah.'
        ],
        kataKunci: ['Kebersihan Lingkungan', 'Rumah Sehat', 'Sekolah Bersih', 'Pilah Sampah'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan cara menjaga kebersihan kamar tidur, rumah, kelas, dan lingkungan sekolah.',
          'Murid dapat mempraktikkan kebiasaan menjaga kebersihan lingkungan sekitar secara gotong royong.',
          'Murid menunjukkan sikap peduli lingkungan dan tanggung jawab.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas II (Muhajir & Hariyanto, Pusat Perbukuan BSKAP - SIBI), Unit 8, hlm. 227–252.'
      }
    ]
  },

  '3': {
    grade: '3',
    romanGrade: 'III',
    fase: 'Fase B',
    judulBukuGuru: 'Buku Panduan Guru Pendidikan Jasmani, Olahraga, dan Kesehatan untuk SD/MI Kelas III',
    penulis: 'Muhajir & Agus Gunawan',
    penerbit: 'Pusat Perbukuan, BSKAP Kementerian Pendidikan Dasar dan Menengah RI (SIBI)',
    tahunTerbit: '2022 / Edisi Revisi Kurikulum Nasional',
    isbn: '978-602-244-885-3',
    urlSibi: 'https://buku.kemendikdasmen.go.id',
    citationFull: 'Muhajir & Agus Gunawan. Buku Panduan Guru Pendidikan Jasmani, Olahraga, dan Kesehatan untuk SD/MI Kelas III. Jakarta: Pusat Perbukuan BSKAP Kemendikdasmen RI (SIBI - buku.kemendikdasmen.go.id).',
    units: [
      {
        id: 'sibi-k3-u1',
        grade: '3',
        fase: 'Fase B',
        semester: '1',
        unitNumber: 1,
        unitCode: 'Unit 1',
        unitTitle: 'Unit 1: Aktivitas Kombinasi Pola Gerak Dasar Lokomotor',
        pokokMateri: 'Kombinasi Gerak Dasar Jalan, Lari, Lompat, dan Loncat',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Hitam-Hijau" dan "Lompat Sungai Berantai"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan kombinasi gerak berjalan dan berlari mengubah arah sesuai aba-aba peluit.',
          'Aktivitas Pembelajaran 2: Mempraktikkan kombinasi gerak berlari dan melompat melewati rintangan gawang rendah/kardus.',
          'Aktivitas Pembelajaran 3: Mempraktikkan kombinasi jalan, lari, dan loncat dalam permainan estafet kelompok.'
        ],
        kataKunci: ['Kombinasi Lokomotor', 'Jalan dan Lari', 'Lari dan Lompat', 'Ketangkasan'],
        tujuanPembelajaran: [
          'Murid dapat memahami dan menjelaskan kombinasi pola gerak dasar lokomotor (jalan, lari, lompat, dan loncat).',
          'Murid dapat mempraktikkan kombinasi gerak dasar lokomotor dalam berbagai situasi permainan modifikasi.',
          'Murid menerapkan kerja sama, kejujuran, dan sportivitas dalam kelompok.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas III (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 1, hlm. 1–38.'
      },
      {
        id: 'sibi-k3-u2',
        grade: '3',
        fase: 'Fase B',
        semester: '1',
        unitNumber: 2,
        unitCode: 'Unit 2',
        unitTitle: 'Unit 2: Aktivitas Kombinasi Pola Gerak Dasar Nonlokomotor',
        pokokMateri: 'Kombinasi Gerak Memutar, Mengayun, Membungkuk, Menekuk, dan Meliuk',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Oper Simpai Berantai Tanpa Lepas Tangan"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan kombinasi gerak memutar dan mengayunkan lengan ke berbagai arah.',
          'Aktivitas Pembelajaran 2: Mempraktikkan kombinasi gerak membungkuk, menekuk lutut, dan meliukkan badan.',
          'Aktivitas Pembelajaran 3: Mempraktikkan kombinasi gerak nonlokomotor berpasangan menggunakan alat simpai/tongkat.'
        ],
        kataKunci: ['Kombinasi Nonlokomotor', 'Kelenturan Sendi', 'Mengayun dan Memutar', 'Menekuk dan Meliuk'],
        tujuanPembelajaran: [
          'Murid dapat menguraikan prosedur kombinasi pola gerak dasar nonlokomotor secara sistematis.',
          'Murid dapat mempraktikkan kombinasi gerak memutar, mengayun, menekuk, dan meliuk dengan luwes.',
          'Murid menunjukkan sikap disiplin dan bekerja sama secara positif.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas III (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 2, hlm. 39–70.'
      },
      {
        id: 'sibi-k3-u3',
        grade: '3',
        fase: 'Fase B',
        semester: '1',
        unitNumber: 3,
        unitCode: 'Unit 3',
        unitTitle: 'Unit 3: Aktivitas Kombinasi Pola Gerak Dasar Manipulatif',
        pokokMateri: 'Kombinasi Melempar, Menangkap, Menendang, Menahan, dan Menggiring Bola',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Bola Beranting" dan "Tembak Sasaran Kerucut"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan kombinasi gerak melambungkan, melempar, dan menangkap bola dalam gerak berpindah.',
          'Aktivitas Pembelajaran 2: Mempraktikkan kombinasi gerak menendang, menahan, dan menggiring bola melewati rintangan.',
          'Aktivitas Pembelajaran 3: Mempraktikkan kombinasi gerak memantulkan (dribbling) dan melempar bola dalam permainan sederhana.'
        ],
        kataKunci: ['Kombinasi Manipulatif', 'Menggiring Bola', 'Lempar Tangkap', 'Tendang Tahan'],
        tujuanPembelajaran: [
          'Murid dapat menganalisis prosedur kombinasi gerak dasar manipulatif menggunakan bola kecil dan bola besar.',
          'Murid dapat mempraktikkan kombinasi gerak melempar, menangkap, menendang, menahan, dan menggiring bola secara akurat.',
          'Murid menerapkan peraturan permainan untuk mendukung fair play dan kolaborasi.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas III (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 3, hlm. 71–108.'
      },
      {
        id: 'sibi-k3-u4',
        grade: '3',
        fase: 'Fase B',
        semester: '1',
        unitNumber: 4,
        unitCode: 'Unit 4',
        unitTitle: 'Unit 4: Aktivitas Gerak Dominan Senam',
        pokokMateri: 'Keseimbangan, Sikap Lilin, dan Guling Depan di Atas Matras',
        elemenCp: 'Terampil Bergerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Bangau Satu Kaki" dan peregangan leher-punggung',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan kombinasi gerak bertumpu dan keseimbangan (sikap kapal terbang dan sikap lilin).',
          'Aktivitas Pembelajaran 2: Mempraktikkan gerak tolakan, melayang, dan mendarat dengan dua kaki secara seimbang.',
          'Aktivitas Pembelajaran 3: Mempraktikkan rangkaian gerak guling depan (forward roll) di atas matras dengan tumpuan tengkuk yang aman.'
        ],
        kataKunci: ['Senam Lantai', 'Sikap Lilin', 'Guling Depan', 'Keseimbangan'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan tahapan gerak sikap lilin dan guling depan sesuai kaidah keselamatan senam lantai.',
          'Murid dapat mempraktikkan gerak keseimbangan, sikap lilin, dan guling depan di atas matras secara terkontrol.',
          'Murid menunjukkan sikap berani, percaya diri, dan saling membantu menjaga keselamatan teman.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas III (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 4, hlm. 109–140.'
      },
      {
        id: 'sibi-k3-u5',
        grade: '3',
        fase: 'Fase B',
        semester: '2',
        unitNumber: 5,
        unitCode: 'Unit 5',
        unitTitle: 'Unit 5: Aktivitas Gerak Berirama',
        pokokMateri: 'Kombinasi Gerak Langkah Kaki dan Ayunan Lengan Mengikuti Irama',
        elemenCp: 'Terampil Bergerak & Bergaya Hidup Aktif',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Senam ceria tepuk irama Nusantara',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan kombinasi gerak langkah biasa, langkah rapat, dan langkah samping sesuai ketukan.',
          'Aktivitas Pembelajaran 2: Mempraktikkan kombinasi gerak ayunan satu lengan dan dua lengan ke depan, samping, dan memutar.',
          'Aktivitas Pembelajaran 3: Mempraktikkan rangkaian kombinasi gerak langkah kaki dan ayunan lengan diiringi musik.'
        ],
        kataKunci: ['Kombinasi Gerak Berirama', 'Langkah Kaki', 'Ayunan Lengan', 'Harmoni Gerak'],
        tujuanPembelajaran: [
          'Murid dapat memahami prosedur kombinasi gerak langkah kaki dan ayunan lengan berirama.',
          'Murid dapat memperagakan rangkaian kombinasi gerak berirama mengikuti ketukan/musik dengan selaras.',
          'Murid menunjukkan kreativitas, kekompakan, dan kegembiraan.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas III (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 5, hlm. 141–170.'
      },
      {
        id: 'sibi-k3-u6',
        grade: '3',
        fase: 'Fase B',
        semester: '2',
        unitNumber: 6,
        unitCode: 'Unit 6',
        unitTitle: 'Unit 6: Aktivitas Permainan dan Olahraga di Air',
        pokokMateri: 'Gerak Dasar Meluncur, Gerakan Kaki, dan Lengan Renang Gaya Dada',
        elemenCp: 'Terampil Bergerak & Memilih Hidup yang Menyehatkan',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Pemanasan statis-dinamis tepi kolam dan permainan luncur roket air',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan gerak meluncur dari dinding kolam dan posisi tubuh streamline di permukaan air.',
          'Aktivitas Pembelajaran 2: Mempraktikkan gerak dasar cambukan kaki renang gaya dada (gerakan kaki katak) berpegangan tepi kolam/pelampung.',
          'Aktivitas Pembelajaran 3: Mempraktikkan gerak dasar ayunan/dayungan lengan dan pengambilan napas renang gaya dada serta keselamatan di air.'
        ],
        kataKunci: ['Olahraga Air', 'Renang Gaya Dada', 'Gerak Meluncur', 'Keselamatan Kolam'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan prosedur gerak dasar meluncur, gerakan kaki, dan lengan renang gaya dada.',
          'Murid dapat mempraktikkan gerak dasar renang gaya dada dan aturan keselamatan di kolam renang.',
          'Murid menunjukkan sikap disiplin, hati-hati, dan berani mencoba.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas III (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 6, hlm. 171–202.'
      },
      {
        id: 'sibi-k3-u7',
        grade: '3',
        fase: 'Fase B',
        semester: '2',
        unitNumber: 7,
        unitCode: 'Unit 7',
        unitTitle: 'Unit 7: Aktivitas Kebugaran Jasmani untuk Kesehatan',
        pokokMateri: 'Latihan Daya Tahan, Kekuatan, Kelenturan, dan Keseimbangan Bergerak',
        elemenCp: 'Bergaya Hidup Aktif',
        alokasiJp: '8 JP (2 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Pos Sirkuit Bugar Ceria"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan latihan kekuatan otot lengan, bahu, dada (push-up modifikasi) dan otot perut.',
          'Aktivitas Pembelajaran 2: Mempraktikkan latihan daya tahan melalui lompat tali (skipping) perorangan dan lari pelan berkelanjutan.',
          'Aktivitas Pembelajaran 3: Mempraktikkan latihan kelenturan persendian dan keseimbangan dinamis.'
        ],
        kataKunci: ['Kebugaran Jasmani', 'Daya Tahan', 'Kekuatan Otot', 'Lompat Tali'],
        tujuanPembelajaran: [
          'Murid dapat memahami komponen latihan kekuatan, daya tahan, kelenturan, dan keseimbangan untuk kesehatan.',
          'Murid dapat mempraktikkan berbagai bentuk latihan kebugaran jasmani sederhana secara teratur.',
          'Murid menunjukkan semangat hidup aktif dan pantang menyerah.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas III (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 7, hlm. 203–230.'
      },
      {
        id: 'sibi-k3-u8',
        grade: '3',
        fase: 'Fase B',
        semester: '2',
        unitNumber: 8,
        unitCode: 'Unit 8',
        unitTitle: 'Unit 8: Aktivitas Fisik, Istirahat, Pengisian Waktu Luang, serta Memilih Makanan Bergizi dan Seimbang',
        pokokMateri: 'Manfaat Istirahat/Tidur Cukup, Pengisian Waktu Luang, dan Makanan Bergizi Seimbang (Isi Piringku)',
        elemenCp: 'Memilih Hidup yang Menyehatkan',
        alokasiJp: '8 JP (2 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Susun Isi Piringku Sehat Bergizi"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mengidentifikasi manfaat istirahat/tidur malam yang cukup dan cara mengisi waktu luang dengan aktivitas fisik positif.',
          'Aktivitas Pembelajaran 2: Mengidentifikasi kandungan makanan bergizi seimbang (karbohidrat, protein, sayur, buah, air putih) sesuai pedoman Isi Piringku.',
          'Aktivitas Pembelajaran 3: Menyusun rencana menu makanan sehat harian dan jadwal istirahat teratur.'
        ],
        kataKunci: ['Istirahat Cukup', 'Waktu Luang', 'Makanan Bergizi Seimbang', 'Isi Piringku'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan manfaat istirahat cukup, pengisian waktu luang aktif, dan pola makan bergizi seimbang.',
          'Murid dapat memilih dan mengelompokkan jenis makanan sehat bergizi seimbang untuk pertumbuhan.',
          'Murid menerapkan kebiasaan hidup sehat dan bersyukur kepada Tuhan YME.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas III (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 8, hlm. 231–258.'
      }
    ]
  },

  '4': {
    grade: '4',
    romanGrade: 'IV',
    fase: 'Fase B',
    judulBukuGuru: 'Buku Panduan Guru Pendidikan Jasmani, Olahraga, dan Kesehatan untuk SD/MI Kelas IV',
    penulis: 'Muhajir & Agus Gunawan',
    penerbit: 'Pusat Perbukuan, BSKAP Kementerian Pendidikan Dasar dan Menengah RI (SIBI)',
    tahunTerbit: '2022 / Edisi Revisi Kurikulum Nasional',
    isbn: '978-602-244-889-1',
    urlSibi: 'https://buku.kemendikdasmen.go.id',
    citationFull: 'Muhajir & Agus Gunawan. Buku Panduan Guru Pendidikan Jasmani, Olahraga, dan Kesehatan untuk SD/MI Kelas IV. Jakarta: Pusat Perbukuan BSKAP Kemendikdasmen RI (SIBI - buku.kemendikdasmen.go.id).',
    units: [
      {
        id: 'sibi-k4-u1',
        grade: '4',
        fase: 'Fase B',
        semester: '1',
        unitNumber: 1,
        unitCode: 'Unit 1',
        unitTitle: 'Unit 1: Aktivitas Variasi dan Kombinasi Pola Gerak Dasar Permainan Invasi',
        pokokMateri: 'Variasi dan Kombinasi Gerak Dasar dalam Permainan Bola Tangan dan Sepak Bola Modifikasi',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Kucing Tikus Bola" dan "4 Lawan 2 Pertahankan Bola"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan variasi dan kombinasi gerak dasar melempar/mengoper dan menangkap bola dalam permainan bola tangan modifikasi.',
          'Aktivitas Pembelajaran 2: Mempraktikkan variasi dan kombinasi gerak dasar menendang (mengumpan), menghentikan, dan menggiring bola dalam sepak bola mini.',
          'Aktivitas Pembelajaran 3: Mempraktikkan permainan invasi lapangan kecil dengan peraturan yang dimodifikasi untuk melatih kerja sama dan ruang gerak.'
        ],
        kataKunci: ['Permainan Invasi', 'Sepak Bola Mini', 'Bola Tangan', 'Mengumpan dan Menggiring'],
        tujuanPembelajaran: [
          'Murid dapat memahami dan menjelaskan variasi serta kombinasi pola gerak dasar lokomotor, nonlokomotor, dan manipulatif dalam permainan invasi sesuai buku panduan SIBI Kelas IV.',
          'Murid dapat mempraktikkan variasi dan kombinasi mengoper, menangkap, menendang, menahan, serta menggiring bola dalam permainan invasi modifikasi.',
          'Murid menerapkan strategi gerak sederhana, peraturan fair play, dan kolaborasi positif dalam tim.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas IV (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 1, hlm. 1–42.'
      },
      {
        id: 'sibi-k4-u2',
        grade: '4',
        fase: 'Fase B',
        semester: '1',
        unitNumber: 2,
        unitCode: 'Unit 2',
        unitTitle: 'Unit 2: Aktivitas Variasi dan Kombinasi Pola Gerak Dasar Permainan Net',
        pokokMateri: 'Variasi dan Kombinasi Gerak Dasar Passing Bawah, Passing Atas, dan Servis Bola Voli Mini / Bulu Tangkis',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Jaga Balon/Bola Jangan Jatuh Lewati Tali"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan variasi dan kombinasi gerak dasar passing bawah dan passing atas bola voli mini secara perorangan dan berpasangan.',
          'Aktivitas Pembelajaran 2: Mempraktikkan variasi gerak dasar servis bawah melewati net/tali yang direntangkan.',
          'Aktivitas Pembelajaran 3: Mempraktikkan permainan bola voli mini 3 lawan 3 atau 4 lawan 4 dengan peraturan yang dimodifikasi.'
        ],
        kataKunci: ['Permainan Net', 'Bola Voli Mini', 'Passing Bawah', 'Passing Atas', 'Servis Bawah'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan mekanika gerak variasi dan kombinasi passing bawah, passing atas, dan servis bawah dalam permainan net.',
          'Murid dapat mempraktikkan variasi dan kombinasi gerak dasar permainan bola voli mini melewati net secara terkontrol.',
          'Murid menunjukkan sikap kerja sama, komunikasi efektif, dan sportivitas.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas IV (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 2, hlm. 43–80.'
      },
      {
        id: 'sibi-k4-u3',
        grade: '4',
        fase: 'Fase B',
        semester: '1',
        unitNumber: 3,
        unitCode: 'Unit 3',
        unitTitle: 'Unit 3: Aktivitas Variasi dan Kombinasi Pola Gerak Dasar Permainan Lapangan',
        pokokMateri: 'Variasi dan Kombinasi Gerak Melempar, Menangkap, dan Memukul Bola dalam Permainan Kasti',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Lempar Tangkap Bola Berpindah Pos"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan variasi dan kombinasi melempar bola melambung, mendatar, dan menyusur tanah serta menangkap bola kasti.',
          'Aktivitas Pembelajaran 2: Mempraktikkan variasi dan kombinasi gerak memukul bola kasti menggunakan kayu pemukul dilanjutkan berlari ke tiang hinggap.',
          'Aktivitas Pembelajaran 3: Mempraktikkan permainan kasti dengan peraturan yang dimodifikasi untuk mengembangkan taktik regu pemukul dan regu penjaga.'
        ],
        kataKunci: ['Permainan Lapangan', 'Permainan Kasti', 'Melempar dan Menangkap', 'Memukul Bola'],
        tujuanPembelajaran: [
          'Murid dapat menguraikan variasi dan kombinasi gerak dasar melempar, menangkap, dan memukul bola kasti.',
          'Murid dapat mempraktikkan keterampilan gerak permainan kasti dalam situasi permainan modifikasi.',
          'Murid menunjukkan kejujuran, kerja sama, dan kepatuhan pada aturan permainan.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas IV (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 3, hlm. 81–118.'
      },
      {
        id: 'sibi-k4-u4',
        grade: '4',
        fase: 'Fase B',
        semester: '1',
        unitNumber: 4,
        unitCode: 'Unit 4',
        unitTitle: 'Unit 4: Aktivitas Bela Diri Pencak Silat',
        pokokMateri: 'Gerak Dasar Kuda-Kuda, Pola Langkah, Pukulan, Tendangan, dan Tangkisan Pencak Silat',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Sentuh Lutut Berpasangan" untuk melatih kelincahan langkah dan elakan',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan sikap hormat, sikap tegak, variasi kuda-kuda (depan, belakang, tengah, samping), dan sikap pasang.',
          'Aktivitas Pembelajaran 2: Mempraktikkan pola langkah (lurus, gergaji/zig-zag, segitiga, ladam) dikombinasikan dengan pukulan depan.',
          'Aktivitas Pembelajaran 3: Mempraktikkan kombinasi gerak dasar tendangan dan tangkisan (luar, dalam, atas, bawah) secara terkontrol.'
        ],
        kataKunci: ['Bela Diri', 'Pencak Silat', 'Kuda-Kuda', 'Pola Langkah', 'Pukulan dan Tangkisan'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan variasi gerak dasar kuda-kuda, pola langkah, serangan, dan belaan dalam pencak silat.',
          'Murid dapat mempraktikkan kombinasi gerak dasar pencak silat dengan postur yang kokoh dan seimbang.',
          'Murid menunjukkan sikap disiplin, pengendalian diri, dan cinta budaya bangsa.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas IV (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 4, hlm. 119–152.'
      },
      {
        id: 'sibi-k4-u5',
        grade: '4',
        fase: 'Fase B',
        semester: '2',
        unitNumber: 5,
        unitCode: 'Unit 5',
        unitTitle: 'Unit 5: Aktivitas Atletik',
        pokokMateri: 'Variasi dan Kombinasi Jalan Cepat, Lari Jarak Pendek, Lompat Jauh, dan Lempar Roket/Turbo',
        elemenCp: 'Terampil Bergerak & Bergaya Hidup Aktif',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Lari Kejar Bendera" dan "Lompat Kardus Bersusun"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan kombinasi jalan cepat dan lari jarak pendek (sprint) dari berbagai posisi start.',
          'Aktivitas Pembelajaran 2: Mempraktikkan kombinasi awalan lari, tolakan satu kaki, melayang, dan mendarat dua kaki pada lompat jauh.',
          'Aktivitas Pembelajaran 3: Mempraktikkan kombinasi awalan langkah silang dan melempar roket/turbo ke sasaran jauh.'
        ],
        kataKunci: ['Atletik Kids', 'Lari Jarak Pendek', 'Lompat Jauh', 'Lempar Turbo'],
        tujuanPembelajaran: [
          'Murid dapat memahami tahapan gerak jalan cepat, lari cepat, lompat jauh, dan lempar turbo.',
          'Murid dapat mempraktikkan kombinasi gerak dasar atletik melalui permainan Kids Athletics.',
          'Murid menunjukkan daya juang, percaya diri, dan sportivitas.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas IV (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 5, hlm. 153–188.'
      },
      {
        id: 'sibi-k4-u6',
        grade: '4',
        fase: 'Fase B',
        semester: '2',
        unitNumber: 6,
        unitCode: 'Unit 6',
        unitTitle: 'Unit 6: Aktivitas Pola Gerak Dominan Senam',
        pokokMateri: 'Guling Depan, Guling Belakang, dan Sikap Kayang / Meroda di Atas Matras',
        elemenCp: 'Terampil Bergerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Pemanasan dinamis persendian dan permainan "Ayunan Perahu di Matras"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan gerak guling depan (forward roll) dari sikap jongkok dan berdiri di atas matras.',
          'Aktivitas Pembelajaran 2: Mempraktikkan gerak guling belakang (backward roll) dengan bantuan bidang miring/teman.',
          'Aktivitas Pembelajaran 3: Mempraktikkan rangkaian gerak keseimbangan, guling depan, dan lompat berputar dengan aman.'
        ],
        kataKunci: ['Senam Lantai', 'Guling Depan', 'Guling Belakang', 'Matras'],
        tujuanPembelajaran: [
          'Murid dapat menganalisis tahapan gerak bertumpu, putaran, dan mendarat pada guling depan serta guling belakang.',
          'Murid dapat mempraktikkan gerak dominan senam lantai di atas matras sesuai prosedur keselamatan.',
          'Murid menunjukkan sikap berani, disiplin, dan saling menjaga keselamatan.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas IV (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 6, hlm. 189–218.'
      },
      {
        id: 'sibi-k4-u7',
        grade: '4',
        fase: 'Fase B',
        semester: '2',
        unitNumber: 7,
        unitCode: 'Unit 7',
        unitTitle: 'Unit 7: Aktivitas Gerak Berirama',
        pokokMateri: 'Variasi dan Kombinasi Langkah Dasar dan Ayunan Lengan Mengikuti Irama',
        elemenCp: 'Terampil Bergerak & Bergaya Hidup Aktif',
        alokasiJp: '8 JP (2 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Senam Irama Nusantara Ceria',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan variasi gerak langkah biasa, langkah rapat, langkah keseimbangan, dan langkah depan.',
          'Aktivitas Pembelajaran 2: Mempraktikkan variasi ayunan satu lengan dan dua lengan ke depan-belakang serta samping.',
          'Aktivitas Pembelajaran 3: Mempraktikkan rangkaian kombinasi langkah kaki dan ayunan lengan berirama secara berkelompok.'
        ],
        kataKunci: ['Gerak Berirama', 'Langkah Keseimbangan', 'Ayunan Lengan', 'Koreografi'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan variasi dan kombinasi gerak langkah kaki serta ayunan lengan berirama.',
          'Murid dapat memperagakan rangkaian gerak berirama dengan ketukan/musik secara kompak.',
          'Murid menunjukkan kreativitas, kerja sama, dan rasa percaya diri.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas IV (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 7, hlm. 219–246.'
      },
      {
        id: 'sibi-k4-u8',
        grade: '4',
        fase: 'Fase B',
        semester: '2',
        unitNumber: 8,
        unitCode: 'Unit 8',
        unitTitle: 'Unit 8: Aktivitas Kebugaran Jasmani, Penanganan Cedera Ringan & Kebersihan Alat Reproduksi',
        pokokMateri: 'Latihan Kebugaran Jasmani, Pertolongan Pertama Cedera Ringan (Luka Lecet/Memar), dan Kebersihan Diri',
        elemenCp: 'Bergaya Hidup Aktif & Memilih Hidup yang Menyehatkan',
        alokasiJp: '8 JP (2 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Simulasi "Dokter Kecil Olahraga & Sirkuit Kebugaran"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan latihan kekuatan, kecepatan, dan kelincahan (shuttle run) dalam pos kebugaran.',
          'Aktivitas Pembelajaran 2: Mengidentifikasi jenis cedera ringan saat berolahraga (luka lecet, memar, kram) dan mempraktikkan pertolongan pertamanya.',
          'Aktivitas Pembelajaran 3: Memahami cara memelihara kebersihan dan kesehatan alat reproduksi serta pakaian sehari-hari.'
        ],
        kataKunci: ['Kebugaran Jasmani', 'Cedera Ringan', 'Pertolongan Pertama', 'Kebersihan Alat Reproduksi'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan jenis cedera ringan dalam aktivitas fisik beserta langkah pertolongan pertamanya.',
          'Murid dapat mempraktikkan latihan kebugaran jasmani dan simulasi penanganan luka lecet/memar secara tepat.',
          'Murid menerapkan perilaku hidup bersih dan menjaga keselamatan saat berolahraga.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas IV (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 8, hlm. 247–278.'
      }
    ]
  },

  '5': {
    grade: '5',
    romanGrade: 'V',
    fase: 'Fase C',
    judulBukuGuru: 'Buku Panduan Guru Pendidikan Jasmani, Olahraga, dan Kesehatan untuk SD/MI Kelas V',
    penulis: 'Muhajir & Agus Gunawan',
    penerbit: 'Pusat Perbukuan, BSKAP Kementerian Pendidikan Dasar dan Menengah RI (SIBI)',
    tahunTerbit: '2022 / Edisi Revisi Kurikulum Nasional',
    isbn: '978-602-244-893-8',
    urlSibi: 'https://buku.kemendikdasmen.go.id',
    citationFull: 'Muhajir & Agus Gunawan. Buku Panduan Guru Pendidikan Jasmani, Olahraga, dan Kesehatan untuk SD/MI Kelas V. Jakarta: Pusat Perbukuan BSKAP Kemendikdasmen RI (SIBI - buku.kemendikdasmen.go.id).',
    units: [
      {
        id: 'sibi-k5-u1',
        grade: '5',
        fase: 'Fase C',
        semester: '1',
        unitNumber: 1,
        unitCode: 'Unit 1',
        unitTitle: 'Unit 1: Aktivitas Modifikasi Pola Gerak Dasar Permainan Invasi',
        pokokMateri: 'Modifikasi Pola Gerak Dasar Mengumpan, Mengontrol, Menggiring, dan Menembak Bola pada Sepak Bola / Bola Tangan',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Rondo 4v1" dan "Serbu Gawang Mini"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan modifikasi gerak dasar menendang/mengumpan dan menghentikan bola menggunakan kaki bagian dalam, luar, dan punggung kaki.',
          'Aktivitas Pembelajaran 2: Mempraktikkan modifikasi gerak menggiring bola melewati rintangan dilanjutkan menembak (shooting) ke sasaran gawang.',
          'Aktivitas Pembelajaran 3: Mempraktikkan permainan sepak bola/bola tangan modifikasi 5 lawan 5 dengan menerapkan taktik menyerang dan bertahan.'
        ],
        kataKunci: ['Modifikasi Permainan Invasi', 'Sepak Bola', 'Passing dan Kontrol', 'Dribbling dan Shooting'],
        tujuanPembelajaran: [
          'Murid dapat menganalisis dan menginvestigasi konsep modifikasi pola gerak dasar dalam permainan invasi sesuai buku panduan SIBI Kelas V.',
          'Murid dapat mempraktikkan penyesuaian keterampilan mengumpan, mengontrol, menggiring, dan menembak bola dalam situasi permainan modifikasi.',
          'Murid menerapkan strategi kolaborasi, fair play, dan partisipasi inklusif dalam tim.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas V (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 1, hlm. 1–44.'
      },
      {
        id: 'sibi-k5-u2',
        grade: '5',
        fase: 'Fase C',
        semester: '1',
        unitNumber: 2,
        unitCode: 'Unit 2',
        unitTitle: 'Unit 2: Aktivitas Modifikasi Pola Gerak Dasar Permainan Net',
        pokokMateri: 'Modifikasi Pola Gerak Dasar Passing Bawah, Passing Atas, dan Servis pada Permainan Bola Voli / Bulu Tangkis',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Voli Pantul Lingkaran" dan "Target Servis Akurat"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan modifikasi kombinasi gerak passing bawah dan passing atas bola voli secara berpasangan dan segitiga.',
          'Aktivitas Pembelajaran 2: Mempraktikkan modifikasi gerak servis bawah dan servis atas melewati net ke area sasaran.',
          'Aktivitas Pembelajaran 3: Mempraktikkan permainan bola voli mini / bulu tangkis dengan peraturan modifikasi yang dirancang bersama.'
        ],
        kataKunci: ['Modifikasi Permainan Net', 'Bola Voli', 'Passing Bawah-Atas', 'Servis'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan dan menguji efektivitas konsep gerak passing bawah, passing atas, serta servis dalam permainan net.',
          'Murid dapat mempraktikkan modifikasi gerak dasar permainan bola voli melewati net secara konsisten.',
          'Murid menunjukkan kerja sama tim, komunikasi, dan sportivitas.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas V (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 2, hlm. 45–84.'
      },
      {
        id: 'sibi-k5-u3',
        grade: '5',
        fase: 'Fase C',
        semester: '1',
        unitNumber: 3,
        unitCode: 'Unit 3',
        unitTitle: 'Unit 3: Aktivitas Modifikasi Pola Gerak Dasar Permainan Lapangan',
        pokokMateri: 'Modifikasi Pola Gerak Dasar Melempar, Menangkap, dan Memukul Bola dalam Permainan Kasti / Bola Bakar',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Kasti Target Pos Cepat"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan modifikasi kombinasi melempar dan menangkap bola kasti dalam posisi bergerak cepat.',
          'Aktivitas Pembelajaran 2: Mempraktikkan modifikasi gerak memukul bola ke arah ruang kosong dan berlari menuju tiang hinggap.',
          'Aktivitas Pembelajaran 3: Mempraktikkan permainan kasti/bola bakar dengan menerapkan strategi regu pemukul dan penjaga.'
        ],
        kataKunci: ['Modifikasi Permainan Lapangan', 'Kasti', 'Bola Bakar', 'Strategi Tiang Hinggap'],
        tujuanPembelajaran: [
          'Murid dapat menganalisis variasi dan kombinasi gerak melempar, menangkap, dan memukul bola dalam permainan lapangan.',
          'Murid dapat mempraktikkan keterampilan bermain kasti/bola bakar dengan strategi yang efektif.',
          'Murid menjunjung tinggi nilai sportivitas, kejujuran, dan kerja sama.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas V (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 3, hlm. 85–122.'
      },
      {
        id: 'sibi-k5-u4',
        grade: '5',
        fase: 'Fase C',
        semester: '1',
        unitNumber: 4,
        unitCode: 'Unit 4',
        unitTitle: 'Unit 4: Aktivitas Bela Diri Pencak Silat',
        pokokMateri: 'Variasi dan Kombinasi Kuda-Kuda, Pola Langkah, Pukulan, Tendangan, Tangkisan, dan Elakan',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Bayangan Pendekar Tangkas"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan variasi dan kombinasi kuda-kuda dengan pola langkah serta pukulan lurus/bandul.',
          'Aktivitas Pembelajaran 2: Mempraktikkan variasi dan kombinasi tendangan (depan, sabit, T) dengan tangkisan.',
          'Aktivitas Pembelajaran 3: Mempraktikkan rangkaian jurus dasar serang-bela pencak silat secara berpasangan dengan terkontrol.'
        ],
        kataKunci: ['Pencak Silat', 'Serang-Bela', 'Tendangan dan Tangkisan', 'Elakan'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan variasi dan kombinasi gerak dasar serangan dan belaan dalam pencak silat.',
          'Murid dapat mempraktikkan rangkaian gerak dasar kuda-kuda, langkah, pukulan, tendangan, dan tangkisan.',
          'Murid menunjukkan sikap disiplin, santun, dan pengendalian diri.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas V (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 4, hlm. 123–156.'
      },
      {
        id: 'sibi-k5-u5',
        grade: '5',
        fase: 'Fase C',
        semester: '2',
        unitNumber: 5,
        unitCode: 'Unit 5',
        unitTitle: 'Unit 5: Aktivitas Gerak Dasar Atletik',
        pokokMateri: 'Modifikasi Start, Lari Cepat, Lari Sambung (Estafet), Lompat Jauh, dan Lempar Turbo',
        elemenCp: 'Terampil Bergerak & Bergaya Hidup Aktif',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Estafet Tongkat Berantai" dan "Lompat Zona Skor"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan kombinasi start, lari jarak pendek, dan pemberian/penerimaan tongkat lari estafet.',
          'Aktivitas Pembelajaran 2: Mempraktikkan kombinasi awalan, tolakan, sikap di udara, dan pendaratan lompat jauh.',
          'Aktivitas Pembelajaran 3: Mempraktikkan kombinasi awalan lari dan lempar roket/turbo melewati batas zona target.'
        ],
        kataKunci: ['Atletik', 'Lari Estafet', 'Lompat Jauh', 'Lempar Turbo'],
        tujuanPembelajaran: [
          'Murid dapat menganalisis koordinasi gerak lari estafet, lompat jauh, dan lempar turbo.',
          'Murid dapat mempraktikkan keterampilan gerak atletik dalam perlombaan modifikasi.',
          'Murid menunjukkan semangat juang, kerja sama tim, dan sportivitas.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas V (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 5, hlm. 157–192.'
      },
      {
        id: 'sibi-k5-u6',
        grade: '5',
        fase: 'Fase C',
        semester: '2',
        unitNumber: 6,
        unitCode: 'Unit 6',
        unitTitle: 'Unit 6: Aktivitas Senam Lantai',
        pokokMateri: 'Kombinasi Pola Gerak Dominan Senam Menggunakan Alat (Palang/Peti Lompat/Matras)',
        elemenCp: 'Terampil Bergerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Peregangan dinamis-statis dan permainan keseimbangan matras',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan kombinasi gerak bertumpu, keseimbangan, dan berguling (guling depan & belakang) di atas matras.',
          'Aktivitas Pembelajaran 2: Mempraktikkan kombinasi berlari, menolak pada papan tolakan, bertumpu di atas peti lompat rendah, dan mendarat dua kaki.',
          'Aktivitas Pembelajaran 3: Mempraktikkan rangkaian gerak senam ketangkasan secara berkesinambungan dan aman.'
        ],
        kataKunci: ['Senam Ketangkasan', 'Peti Lompat', 'Tolakan dan Mendarat', 'Guling Matras'],
        tujuanPembelajaran: [
          'Murid dapat memahami tahapan kombinasi pola gerak dominan senam lantai dan ketangkasan.',
          'Murid dapat mempraktikkan rangkaian gerak guling dan lompat kangkang di atas peti lompat rendah dengan aman.',
          'Murid menunjukkan sikap berani, percaya diri, dan mengutamakan keselamatan.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas V (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 6, hlm. 193–224.'
      },
      {
        id: 'sibi-k5-u7',
        grade: '5',
        fase: 'Fase C',
        semester: '2',
        unitNumber: 7,
        unitCode: 'Unit 7',
        unitTitle: 'Unit 7: Aktivitas Gerak Berirama',
        pokokMateri: 'Kombinasi Gerak Langkah Kaki dan Ayunan Lengan Mengikuti Irama',
        elemenCp: 'Terampil Bergerak & Bergaya Hidup Aktif',
        alokasiJp: '8 JP (2 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Senam Kreasi Pelajar Pancasila',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan kombinasi langkah biasa, langkah rapat, langkah samping, dan langkah keseimbangan.',
          'Aktivitas Pembelajaran 2: Mempraktikkan kombinasi ayunan satu/dua lengan ke depan, belakang, samping, dan silang dada.',
          'Aktivitas Pembelajaran 3: Menampilkan rangkaian koreografi senam irama secara berkelompok dengan iringan musik.'
        ],
        kataKunci: ['Senam Irama', 'Koreografi Kelompok', 'Langkah dan Ayunan', 'Irama Musik'],
        tujuanPembelajaran: [
          'Murid dapat merancang dan menjelaskan kombinasi gerak langkah kaki serta ayunan lengan berirama.',
          'Murid dapat mempraktikkan rangkaian gerak berirama secara berkelompok dengan kompak dan harmonis.',
          'Murid menunjukkan kreativitas, kolaborasi, dan rasa percaya diri.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas V (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 7, hlm. 225–252.'
      },
      {
        id: 'sibi-k5-u8',
        grade: '5',
        fase: 'Fase C',
        semester: '2',
        unitNumber: 8,
        unitCode: 'Unit 8',
        unitTitle: 'Unit 8: Aktivitas Kebugaran Jasmani untuk Kesehatan & Bahaya Merokok, Miras, dan NAPZA',
        pokokMateri: 'Latihan Daya Tahan Jantung-Paru (Cardiorespiratory) serta Pencegahan Bahaya Rokok, Minuman Keras, dan NAPZA',
        elemenCp: 'Bergaya Hidup Aktif & Memilih Hidup yang Menyehatkan',
        alokasiJp: '8 JP (2 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Latihan Sirkuit Jantung Sehat & Kampanye Poster Hidup Sehat Tanpa Asap Rokok',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan latihan daya tahan jantung dan paru-paru (lari interval, lompat tali, circuit training) serta menghitung denyut nadi.',
          'Aktivitas Pembelajaran 2: Mengidentifikasi kandungan berbahaya pada rokok, minuman keras, dan NAPZA terhadap kesehatan organ tubuh.',
          'Aktivitas Pembelajaran 3: Menyusun strategi penolakan tegas dan kampanye hidup sehat bebas rokok serta NAPZA di lingkungan sekolah.'
        ],
        kataKunci: ['Daya Tahan Jantung-Paru', 'Denyut Nadi', 'Bahaya Merokok', 'Pencegahan NAPZA'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan manfaat latihan daya tahan jantung-paru serta bahaya merokok, miras, dan NAPZA bagi kesehatan.',
          'Murid dapat mempraktikkan latihan kebugaran kardiorespirasi dan menghitung denyut nadi latihan.',
          'Murid menunjukkan komitmen memilih gaya hidup sehat dan menghindari zat adiktif.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas V (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 8, hlm. 253–286.'
      }
    ]
  },

  '6': {
    grade: '6',
    romanGrade: 'VI',
    fase: 'Fase C',
    judulBukuGuru: 'Buku Panduan Guru Pendidikan Jasmani, Olahraga, dan Kesehatan untuk SD/MI Kelas VI',
    penulis: 'Muhajir & Agus Gunawan',
    penerbit: 'Pusat Perbukuan, BSKAP Kementerian Pendidikan Dasar dan Menengah RI (SIBI)',
    tahunTerbit: '2022 / Edisi Revisi Kurikulum Nasional',
    isbn: '978-602-244-897-6',
    urlSibi: 'https://buku.kemendikdasmen.go.id',
    citationFull: 'Muhajir & Agus Gunawan. Buku Panduan Guru Pendidikan Jasmani, Olahraga, dan Kesehatan untuk SD/MI Kelas VI. Jakarta: Pusat Perbukuan BSKAP Kemendikdasmen RI (SIBI - buku.kemendikdasmen.go.id).',
    units: [
      {
        id: 'sibi-k6-u1',
        grade: '6',
        fase: 'Fase C',
        semester: '1',
        unitNumber: 1,
        unitCode: 'Unit 1',
        unitTitle: 'Unit 1: Aktivitas Modifikasi Pola Gerak Dasar Permainan Invasi',
        pokokMateri: 'Variasi dan Kombinasi Mengoper, Menangkap, Menggiring, dan Menembak Bola dalam Permainan Bola Basket / Sepak Bola',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Basket 3x3 Setengah Lapangan" dan "Passing Bergerak Cepat"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan variasi dan kombinasi lemparan dada (chest pass), lemparan pantul (bounce pass), dan lemparan atas kepala (overhead pass).',
          'Aktivitas Pembelajaran 2: Mempraktikkan kombinasi menggiring bola (dribbling) melewati lawan dan menembak bola (shooting / lay-up sederhana) ke ring/sasaran.',
          'Aktivitas Pembelajaran 3: Mempraktikkan permainan bola basket/sepak bola modifikasi dengan merancang taktik penyerangan dan pertahanan.'
        ],
        kataKunci: ['Permainan Invasi', 'Bola Basket Mini', 'Chest Pass & Bounce Pass', 'Dribbling & Shooting'],
        tujuanPembelajaran: [
          'Murid dapat menganalisis dan menguji efektivitas variasi serta kombinasi gerak dasar dalam permainan invasi sesuai buku panduan SIBI Kelas VI.',
          'Murid dapat mempraktikkan keterampilan mengoper, menangkap, menggiring, dan menembak bola dalam situasi permainan nyata.',
          'Murid merancang modifikasi aturan untuk mendukung fair play dan kolaborasi inklusif.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas VI (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 1, hlm. 1–46.'
      },
      {
        id: 'sibi-k6-u2',
        grade: '6',
        fase: 'Fase C',
        semester: '1',
        unitNumber: 2,
        unitCode: 'Unit 2',
        unitTitle: 'Unit 2: Aktivitas Modifikasi Pola Gerak Dasar Permainan Net',
        pokokMateri: 'Variasi dan Kombinasi Servis, Passing, dan Smash pada Bola Voli serta Pukulan Forehand/Backhand Bulu Tangkis',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Reli Tiga Sentuhan Lewati Net"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan variasi dan kombinasi servis bawah/atas dilanjutkan passing bawah dan passing atas bola voli.',
          'Aktivitas Pembelajaran 2: Mempraktikkan kombinasi gerak umpan (set-up) dan pukulan serangan/smash sederhana melewati net.',
          'Aktivitas Pembelajaran 3: Mempraktikkan permainan bola voli / bulu tangkis dengan menerapkan strategi penempatan bola ke ruang kosong.'
        ],
        kataKunci: ['Permainan Net', 'Bola Voli', 'Bulu Tangkis', 'Servis, Passing, dan Smash'],
        tujuanPembelajaran: [
          'Murid dapat menginvestigasi konsep gerak dan strategi penempatan bola dalam permainan net.',
          'Murid dapat mempraktikkan variasi dan kombinasi servis, passing, serta pukulan serangan dalam permainan bola voli/bulu tangkis.',
          'Murid menunjukkan kerja sama tim, sportivitas, dan kepemimpinan.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas VI (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 2, hlm. 47–86.'
      },
      {
        id: 'sibi-k6-u3',
        grade: '6',
        fase: 'Fase C',
        semester: '1',
        unitNumber: 3,
        unitCode: 'Unit 3',
        unitTitle: 'Unit 3: Aktivitas Modifikasi Pola Gerak Dasar Permainan Lapangan',
        pokokMateri: 'Variasi dan Kombinasi Melempar, Menangkap, Memukul Bola, dan Mematikan Lawan dalam Permainan Rounders / Kasti',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Kejar Bakar Base Rounders"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan variasi dan kombinasi lemparan melambung, mendatar, serta menangkap bola cepat.',
          'Aktivitas Pembelajaran 2: Mempraktikkan kombinasi memukul bola ke arah strategis dan berlari melewati base/tiang hinggap.',
          'Aktivitas Pembelajaran 3: Mempraktikkan taktik mematikan lawan (membakar base / menyentuh pelari) dalam permainan rounders/kasti.'
        ],
        kataKunci: ['Permainan Lapangan', 'Rounders', 'Kasti', 'Taktik Base'],
        tujuanPembelajaran: [
          'Murid dapat menganalisis taktik penyerangan dan pertahanan dalam permainan rounders/kasti.',
          'Murid dapat mempraktikkan variasi dan kombinasi gerak melempar, menangkap, memukul, dan berlari antar-base.',
          'Murid menerapkan nilai fair play, kerja sama, dan pengambilan keputusan cepat.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas VI (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 3, hlm. 87–124.'
      },
      {
        id: 'sibi-k6-u4',
        grade: '6',
        fase: 'Fase C',
        semester: '1',
        unitNumber: 4,
        unitCode: 'Unit 4',
        unitTitle: 'Unit 4: Aktivitas Bela Diri Pencak Silat',
        pokokMateri: 'Rangkaian Kuda-Kuda, Pola Langkah, Pukulan, Tendangan, Tangkisan, dan Elakan Pencak Silat',
        elemenCp: 'Terampil Bergerak & Belajar Melalui Gerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Reaksi Serang-Hindar Berpasangan"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan kombinasi kuda-kuda, pola langkah, dan variasi pukulan serta tendangan.',
          'Aktivitas Pembelajaran 2: Mempraktikkan kombinasi gerak elakan dan tangkisan menghadapi serangan lawan secara aman.',
          'Aktivitas Pembelajaran 3: Memperagakan rangkaian jurus kombinasi serangan dan belaan pencak silat.'
        ],
        kataKunci: ['Bela Diri Pencak Silat', 'Rangkaian Jurus', 'Elakan dan Tangkisan', 'Kontrol Diri'],
        tujuanPembelajaran: [
          'Murid dapat memahami dan merangkai gerak dasar serangan serta belaan pencak silat.',
          'Murid dapat mempraktikkan kombinasi kuda-kuda, langkah, pukulan, tendangan, tangkisan, dan elakan secara harmonis.',
          'Murid menunjukkan sikap ksatria, disiplin, dan menghormati sesama.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas VI (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 4, hlm. 125–158.'
      },
      {
        id: 'sibi-k6-u5',
        grade: '6',
        fase: 'Fase C',
        semester: '2',
        unitNumber: 5,
        unitCode: 'Unit 5',
        unitTitle: 'Unit 5: Aktivitas Gerak Dasar Atletik',
        pokokMateri: 'Variasi dan Kombinasi Lari Jarak Pendek, Lompat Jauh, dan Tolak Peluru / Lempar Roket',
        elemenCp: 'Terampil Bergerak & Bergaya Hidup Aktif',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Permainan "Kompetisi Tri-Lomba Atletik Mini"',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan koordinasi start jongkok, langkah lari sprint, dan teknik memasuki garis finis.',
          'Aktivitas Pembelajaran 2: Mempraktikkan rangkaian awalan, tumpuan, melayang gaya menggantung/berjalan di udara, dan mendarat pada lompat jauh.',
          'Aktivitas Pembelajaran 3: Mempraktikkan kombinasi memegang, awalan menyamping, dan menolak peluru modifikasi / melempar turbo.'
        ],
        kataKunci: ['Atletik', 'Start Jongkok', 'Lompat Jauh', 'Tolak Peluru Modifikasi'],
        tujuanPembelajaran: [
          'Murid dapat menganalisis prinsip mekanika gerak lari cepat, lompat jauh, dan tolak peluru.',
          'Murid dapat mempraktikkan rangkaian gerak dasar atletik dengan teknik yang efektif.',
          'Murid menunjukkan sportivitas, kemandirian, dan motivasi berprestasi.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas VI (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 5, hlm. 159–196.'
      },
      {
        id: 'sibi-k6-u6',
        grade: '6',
        fase: 'Fase C',
        semester: '2',
        unitNumber: 6,
        unitCode: 'Unit 6',
        unitTitle: 'Unit 6: Aktivitas Senam Lantai',
        pokokMateri: 'Rangkaian Gerak Dominan Senam Lantai (Guling Depan, Guling Belakang, dan Guling Lenting / Sikap Kayang)',
        elemenCp: 'Terampil Bergerak',
        alokasiJp: '12 JP (3 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Peregangan kelenturan tulang belakang dan permainan keseimbangan kelompok',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan rangkaian gerak keseimbangan (sikap kapal terbang/sikap lilin) dilanjutkan guling depan.',
          'Aktivitas Pembelajaran 2: Mempraktikkan rangkaian gerak guling depan dilanjutkan guling belakang secara berkesinambungan.',
          'Aktivitas Pembelajaran 3: Mempraktikkan gerak sikap kayang dan awalan guling lenting (neck kip) di atas matras dengan bantuan/pengawasan.'
        ],
        kataKunci: ['Rangkaian Senam Lantai', 'Guling Depan-Belakang', 'Sikap Kayang', 'Guling Lenting'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan tahapan rangkaian gerak guling depan, guling belakang, dan guling lenting.',
          'Murid dapat mempraktikkan rangkaian tiga gerak dominan senam lantai di atas matras secara luwes dan aman.',
          'Murid menunjukkan keberanian, tanggung jawab, dan kepedulian keselamatan.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas VI (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 6, hlm. 197–228.'
      },
      {
        id: 'sibi-k6-u7',
        grade: '6',
        fase: 'Fase C',
        semester: '2',
        unitNumber: 7,
        unitCode: 'Unit 7',
        unitTitle: 'Unit 7: Aktivitas Gerak Berirama',
        pokokMateri: 'Rangkaian Kombinasi Gerak Langkah Kaki dan Ayunan Lengan dengan Iringan Musik',
        elemenCp: 'Terampil Bergerak & Bergaya Hidup Aktif',
        alokasiJp: '8 JP (2 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Senam Kreasi Irama Nusantara',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan variasi dan kombinasi langkah dasar (langkah biasa, rapat, silang, segitiga) dengan ketukan.',
          'Aktivitas Pembelajaran 2: Mempraktikkan kombinasi ayunan lengan dengan variasi langkah kaki secara berpasangan dan berkelompok.',
          'Aktivitas Pembelajaran 3: Menampilkan koreografi senam irama lengkap (pemanasan, inti, pendinginan) dengan musik.'
        ],
        kataKunci: ['Senam Irama', 'Langkah Segitiga', 'Koreografi Musik', 'Keluwesan'],
        tujuanPembelajaran: [
          'Murid dapat merancang dan mengevaluasi rangkaian gerak langkah kaki serta ayunan lengan berirama.',
          'Murid dapat memperagakan koreografi senam irama mengikuti musik dengan keluwesan dan kekompakan.',
          'Murid menunjukkan kreativitas, kolaborasi, dan rasa percaya diri.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas VI (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 7, hlm. 229–256.'
      },
      {
        id: 'sibi-k6-u8',
        grade: '6',
        fase: 'Fase C',
        semester: '2',
        unitNumber: 8,
        unitCode: 'Unit 8',
        unitTitle: 'Unit 8: Aktivitas Kebugaran Jasmani, Pengukuran Kebugaran (TKJI) & Penanganan Cedera / Kesehatan Reproduksi',
        pokokMateri: 'Latihan dan Pengukuran Kebugaran Jasmani (TKJI SD) serta Penanganan Cedera (Metode RICE) & Kesehatan Reproduksi Pubertas',
        elemenCp: 'Bergaya Hidup Aktif & Memilih Hidup yang Menyehatkan',
        alokasiJp: '8 JP (2 Pertemuan)',
        alokasiPertemuan: '2 x 35 Menit',
        pemanasanPermainan: 'Sirkuit Tes Kebugaran Pelajar & Simulasi Pertolongan Pertama RICE',
        aktivitasPembelajaran: [
          'Aktivitas Pembelajaran 1: Mempraktikkan butir latihan dan pengukuran kebugaran jasmani sederhana (lari cepat 40m, baring duduk/sit-up, loncat tegak, lari 600m) serta menghitung denyut nadi.',
          'Aktivitas Pembelajaran 2: Mempraktikkan prosedur penanganan cedera olahraga akut menggunakan prinsip RICE (Rest, Ice, Compression, Elevation).',
          'Aktivitas Pembelajaran 3: Mengidentifikasi cara menjaga kebersihan dan kesehatan alat reproduksi pada masa pubertas.'
        ],
        kataKunci: ['Pengukuran Kebugaran (TKJI)', 'Metode RICE', 'Kesehatan Reproduksi', 'Masa Pubertas'],
        tujuanPembelajaran: [
          'Murid dapat menjelaskan cara mengukur kebugaran jasmani, prinsip pertolongan pertama RICE, dan kesehatan alat reproduksi.',
          'Murid dapat mempraktikkan tes kebugaran jasmani sederhana serta simulasi penanganan cedera terkilir/memar.',
          'Murid menerapkan gaya hidup aktif, sehat, dan bertanggung jawab menjaga diri.'
        ],
        sumberBukuSibi: 'Buku Panduan Guru PJOK SD/MI Kelas VI (Muhajir & Agus Gunawan, Pusat Perbukuan BSKAP - SIBI), Unit 8, hlm. 257–290.'
      }
    ]
  }
};

export function normalizeGradeKey(rawGrade?: string | number): string {
  const s = String(rawGrade || '4').trim().toUpperCase();
  if (s.includes('VI') || s.includes('6')) return '6';
  if (s.includes('IV') || s.includes('4')) return '4';
  if (s.includes('V') || s.includes('5')) return '5';
  if (s.includes('III') || s.includes('3')) return '3';
  if (s.includes('II') || s.includes('2')) return '2';
  if (s.includes('I') || s.includes('1')) return '1';
  return '4';
}

export function getSibiBookByGrade(rawGrade?: string | number): SibiBookMetadata {
  const key = normalizeGradeKey(rawGrade);
  return SIBI_PJOK_BOOKS[key] || SIBI_PJOK_BOOKS['4'];
}

export function getSibiUnitsByGrade(rawGrade?: string | number): SibiUnitItem[] {
  return getSibiBookByGrade(rawGrade).units;
}

export function findMatchingSibiUnit(rawGrade?: string | number, topicText?: string): SibiUnitItem {
  const units = getSibiUnitsByGrade(rawGrade);
  if (!topicText || !topicText.trim()) return units[0];
  const lower = topicText.toLowerCase();

  for (const u of units) {
    if (
      u.unitTitle.toLowerCase().includes(lower) ||
      u.pokokMateri.toLowerCase().includes(lower) ||
      lower.includes(u.unitTitle.toLowerCase().replace(/^unit \d+:\s*/i, '')) ||
      u.kataKunci.some(k => lower.includes(k.toLowerCase()))
    ) {
      return u;
    }
  }

  if (lower.includes('lokomotor') && !lower.includes('non')) return units[0];
  if (lower.includes('nonlokomotor') || lower.includes('non-lokomotor')) return units[1] || units[0];
  if (lower.includes('manipulatif') || lower.includes('kasti') || lower.includes('rounders') || lower.includes('lapangan')) return units[2] || units[0];
  if (lower.includes('invasi') || lower.includes('sepak') || lower.includes('basket') || lower.includes('bola tangan')) return units[0];
  if (lower.includes('net') || lower.includes('voli') || lower.includes('tangkis')) return units[1] || units[0];
  if (lower.includes('silat') || lower.includes('bela diri')) return units[3] || units[0];
  if (lower.includes('atletik') || lower.includes('lari') || lower.includes('lompat jauh')) return units[4] || units[0];
  if (lower.includes('senam') || lower.includes('guling') || lower.includes('keseimbangan')) return units.find(u => u.unitTitle.toLowerCase().includes('senam')) || units[3];
  if (lower.includes('irama') || lower.includes('ritmik')) return units.find(u => u.unitTitle.toLowerCase().includes('irama')) || units[4];
  if (lower.includes('air') || lower.includes('renang')) return units.find(u => u.unitTitle.toLowerCase().includes('air')) || units[5];
  if (lower.includes('kebugaran') || lower.includes('kesehatan') || lower.includes('gizi') || lower.includes('cedera') || lower.includes('reproduksi')) return units[units.length - 1];

  return units[0];
}

export function buildSibiPromptInstruction(rawGrade?: string | number, topicText?: string): string {
  const book = getSibiBookByGrade(rawGrade);
  const matchedUnit = findMatchingSibiUnit(rawGrade, topicText);

  return `
PEDOMAN WAJIB BUKU PANDUAN GURU SIBI (SISTEM INFORMASI PERBUKUAN INDONESIA - KEMENDIKDASMEN):
Seluruh hasil generate WAJIB diselaraskan dengan struktur, terminologi, tahapan aktivitas, dan asesmen pada buku teks resmi pemerintah:
- Judul Buku Rujukan Utama: "${book.judulBukuGuru}"
- Penulis: ${book.penulis}
- Penerbit: ${book.penerbit} (${book.urlSibi})
- ISBN: ${book.isbn}
- Unit Rujukan SIBI: ${matchedUnit.unitTitle}
- Pokok Materi SIBI: ${matchedUnit.pokokMateri}
- Permainan Pemanasan Khas SIBI: ${matchedUnit.pemanasanPermainan}
- Tahapan Aktivitas Pembelajaran SIBI:
  ${matchedUnit.aktivitasPembelajaran.map((a, i) => `${i + 1}) ${a}`).join('\n  ')}
- Ketentuan Khusus SIBI:
  1. Kegiatan Pendahuluan wajib memuat persiapan barisan, doa, presensi, pengecekan kesehatan fisik murid, apersepsi, serta Pemanasan dalam Bentuk Permainan Kecil (Game-Based Warm-Up) sesuai Buku Panduan Guru PJOK SIBI.
  2. Kegiatan Inti wajib menguraikan Aktivitas Pembelajaran 1, Aktivitas Pembelajaran 2, dan Aktivitas Pembelajaran 3 secara sistematis (dari gerak dasar/modifikasi menuju penerapan dalam permainan yang dimodifikasi / Modified Games), terintegrasi dengan tahapan Memahami, Mengaplikasikan, dan Merefleksi.
  3. Kegiatan Penutup wajib memuat Pendinginan (Cooling Down / Peregangan Statis), refleksi nilai fair play/kerja sama, kesimpulan, doa, dan pengembalian alat olahraga secara tertib.
  4. Cantumkan secara eksplisit kutipan "${matchedUnit.sumberBukuSibi}" pada bagian Sumber Belajar / Media / Materi Ajar.
`.trim();
}
