import { CpFase, CpElement } from '../types';

/**
 * DATA CAPAIAN PEMBELAJARAN (CP) RESMI & LENGKAP PJOK SD KURIKULUM MERDEKA
 * Berdasarkan:
 * Keputusan Kepala BSKAP Nomor 046/H/KR/2025 (Standar Capaian Pembelajaran Kurikulum Nasional / Merdeka Terbaru)
 * yang menyempurnakan Keputusan Kepala BSKAP No. 032/H/KR/2024 dan selaras dengan Permendikdasmen No. 13 Tahun 2025
 */
export const DEFAULT_AUTHENTIC_CP_DATA: CpFase[] = [
  {
    id: 'fase-a',
    phaseName: 'Fase A',
    grades: 'Kelas I dan II SD/MI/Program Paket A',
    skRegulasi: 'Keputusan Kepala BSKAP Nomor 046/H/KR/2025',
    rasionalFase: 'Mata pelajaran PJOK pada Fase A berfokus pada pembiasaan gerak dasar yang menyenangkan, pengembangan persepsi kinestetik melalui bermain, serta pembentukan karakter positif seperti kejujuran, disiplin, dan saling menghargai teman.',
    capaianUmum: 'Pada akhir Fase A, murid memiliki kemampuan sebagai berikut.',
    elements: [
      {
        id: 'fase-a-terampil',
        name: 'Terampil Bergerak',
        alias: '1.1. Terampil Bergerak',
        description: 'Mempraktikkan keterampilan gerak fundamental dan menerapkannya dalam berbagai situasi gerak yang berbeda; mengeksplorasi berbagai strategi gerak; dan mengeksplorasi berbagai konsep gerak serta menyimpulkan efektivitasnya.',
        lingkupMateri: [
          'Pola Gerak Dasar Lokomotor (Jalan, Lari, Lompat)',
          'Pola Gerak Dasar Non-Lokomotor (Meliuk, Menekuk, Mengayun)',
          'Pola Gerak Dasar Manipulatif (Melempar, Menangkap, Menendang)',
          'Permainan Sederhana & Tradisional Anak',
          'Aktivitas Senam & Keseimbangan Sederhana',
          'Gerak Berirama Mengikuti Irama Musik/Tepukan'
        ],
        contohTp: [
          'Mempraktikkan gerak dasar jalan dan lari dalam berbagai arah dan lintasan',
          'Mempraktikkan gerak dasar melompat dan meloncat dengan tolakan satu atau dua kaki',
          'Mempraktikkan gerak memutar dan mengayun lengan dengan koordinasi yang baik',
          'Mempraktikkan gerak melempar dan menangkap bola berpasangan dengan jarak terukur',
          'Mempraktikkan variasi langkah kaki berirama sesuai tempo ketukan sederhana'
        ]
      },
      {
        id: 'fase-a-belajar',
        name: 'Belajar Melalui Gerak',
        alias: '1.2. Belajar Melalui Gerak',
        description: 'Menaati peraturan untuk menumbuhkan fair play di dalam berbagai aktivitas jasmani; menerapkan strategi kolaborasi ketika berpartisipasi dalam aktivitas jasmani.',
        lingkupMateri: [
          'Peraturan dan Etika Bermain Sederhana',
          'Keselamatan Diri dan Teman Saat Bergerak',
          'Kolaborasi dan Berbagi Alat/Ruang',
          'Sikap Sportif dan Menerima Hasil Permainan'
        ],
        contohTp: [
          'Menjelaskan dan menaati aturan keselamatan saat beraktivitas di lapangan',
          'Menunjukkan sikap berbagi alat olahraga bersama teman secara bergantian',
          'Menerapkan sikap jujur dan saling menghargai dalam permainan beregu kecil',
          'Membiasakan diri mengucapkan terima kasih dan bersalaman setelah berolahraga'
        ]
      },
      {
        id: 'fase-a-aktif',
        name: 'Bergaya Hidup Aktif',
        alias: '1.3. Bergaya Hidup Aktif',
        description: 'Berpartisipasi di dalam berbagai aktivitas jasmani dan mengidentifikasi manfaatnya.',
        lingkupMateri: [
          'Aktivitas Jasmani Menyenangkan Harian',
          'Pemanasan & Pendinginan Sederhana',
          'Pengenalan Tanda-Tanda Kelelahan Fisik',
          'Manfaat Bergerak bagi Kesehatan Tubuh'
        ],
        contohTp: [
          'Berpartisipasi aktif dalam kegiatan gerak berdurasi minimal 30 menit',
          'Mengenali respon tubuh (haus, napas lebih cepat) setelah melakukan aktivitas fisik',
          'Mempraktikkan gerakan pemanasan dan pendinginan sederhana yang dipandu guru',
          'Menceritakan perasaan gembira setelah bermain dan berolahraga bersama teman'
        ]
      },
      {
        id: 'fase-a-menyehatkan',
        name: 'Memilih Hidup yang Menyehatkan',
        alias: '1.4. Memilih Hidup yang Menyehatkan',
        description: 'Mengenali gaya hidup aktif dan sehat; mengenali manfaat komponen makanan bergizi seimbang; serta mengenali situasi dan potensi yang berisiko terhadap kesehatan dan keselamatan serta strategi mencari bantuan kepada orang dewasa terpercaya.',
        lingkupMateri: [
          'Gizi Seimbang & Pilihan Makanan Sehat',
          'Kebersihan Diri (Cuci Tangan, Gigi, Mandi)',
          'Pakaian Bersih & Istirahat Cukup',
          'Pengenalan Sentuhan Boleh & Tidak Boleh',
          'Menghindari Bahaya di Sekitar Rumah & Sekolah'
        ],
        contohTp: [
          'Menyebutkan makanan dan minuman bergizi yang dibutuhkan untuk pertumbuhan',
          'Mempraktikkan cara mencuci tangan dengan sabun dan air mengalir yang benar',
          'Mengenali bagian tubuh yang tidak boleh disentuh orang lain dan cara melapor',
          'Menerapkan kebiasaan tidur tepat waktu dan menjaga kebersihan pakaian olahraga'
        ]
      }
    ]
  },
  {
    id: 'fase-b',
    phaseName: 'Fase B',
    grades: 'Kelas III dan IV SD/MI/Program Paket A',
    skRegulasi: 'Keputusan Kepala BSKAP Nomor 046/H/KR/2025',
    rasionalFase: 'Mata pelajaran PJOK pada Fase B menekankan penguasaan variasi dan kombinasi gerak secara mandiri tanpa meniru, peningkatan kapasitas kebugaran jasmani, penanaman kerjasama kelompok yang solid, serta pemahaman kebersihan alat reproduksi.',
    capaianUmum: 'Pada akhir Fase B, murid memiliki kemampuan sebagai berikut.',
    elements: [
      {
        id: 'fase-b-terampil',
        name: 'Terampil Bergerak',
        alias: '2.1. Terampil Bergerak',
        description: 'Menghaluskan keterampilan gerak fundamental dan menerapkannya dalam situasi gerak yang baru; menyesuaikan strategi gerak untuk mendapatkan capaian keterampilan gerak; dan memperagakan berbagai konsep gerak yang dapat diterapkan dalam rangkaian gerak.',
        lingkupMateri: [
          'Variasi & Kombinasi Gerak Lokomotor-Manipulatif',
          'Permainan Bola Besar Dasar (Sepak Bola, Bola Tangan, Bola Voli)',
          'Permainan Bola Kecil Dasar (Kasti, Rounders)',
          'Senam Ketangkasan & Guling Depan/Belakang',
          'Gerak Berirama Berpasangan / Kelompok',
          'Aktivitas Air / Pengenalan Air Aman (Kondisional)'
        ],
        contohTp: [
          'Mempraktikkan variasi lari dan melompat melewati rintangan dengan keseimbangan terjaga',
          'Mempraktikkan kombinasi melempar dan menangkap bola kasti dari berbagai arah',
          'Mempraktikkan gerak guling depan di atas matras dengan posisi dagu menempel dada',
          'Mempraktikkan rangkaian langkah kaki dan ayunan lengan berirama 4 hitungan',
          'Mempraktikkan teknik menendang dan menghentikan bola dengan kaki bagian dalam'
        ]
      },
      {
        id: 'fase-b-belajar',
        name: 'Belajar Melalui Gerak',
        alias: '2.2. Belajar Melalui Gerak',
        description: 'Menerapkan strategi gerak sederhana dan memecahkan masalah gerak; menerapkan peraturan untuk menumbuhkan fair play di dalam berbagai aktivitas jasmani; dan berpartisipasi secara positif dalam kelompok atau tim di dalam berbagai aktivitas jasmani.',
        lingkupMateri: [
          'Prosedur & Formasi Bermain Beregu',
          'Nilai Sportivitas & Fair Play Lapangan',
          'Komunikasi Positif & Mengatasi Konflik Kecil',
          'Menghargai Keberagaman Kemampuan Teman'
        ],
        contohTp: [
          'Menerapkan strategi pembagian posisi dan tugas dalam permainan kasti',
          'Menunjukkan sikap menghargai keputusan wasit/guru dan menerima kekalahan secara sportif',
          'Memberikan semangat kepada rekan tim yang mengalami kesulitan saat bermain',
          'Menjelaskan taktik bertahan dan menyerang sederhana pada permainan bola modifikasi'
        ]
      },
      {
        id: 'fase-b-aktif',
        name: 'Bergaya Hidup Aktif',
        alias: '2.3. Bergaya Hidup Aktif',
        description: 'Berpartisipasi dalam berbagai aktivitas jasmani dan mengenali faktor-faktor yang menyebabkan aktivitas jasmani menyenangkan.',
        lingkupMateri: [
          'Tes Kebugaran Jasmani Sederhana Siswa',
          'Pemanasan Statis & Dinamis Terarah',
          'Pendinginan & Peregangan Otot Pasca Olahraga',
          'Korelasi Frekuensi Olahraga dengan Imunitas & Stamina'
        ],
        contohTp: [
          'Melakukan pemanasan peregangan statis dan dinamis secara mandiri sebelum berlari',
          'Mencatat hasil tes lari bolak-balik atau push-up modifikasi untuk mengukur kebugaran',
          'Menjelaskan pentingnya bergerak aktif minimal 60 menit setiap hari',
          'Mempraktikkan gerakan pendinginan untuk menurunkan denyut jantung secara bertahap'
        ]
      },
      {
        id: 'fase-b-menyehatkan',
        name: 'Memilih Hidup yang Menyehatkan',
        alias: '2.4. Memilih Hidup yang Menyehatkan',
        description: 'Mengenali risiko kesehatan akibat gaya hidup dan berbagai aktivitas jasmani untuk pencegahannya; mengidentifikasi pola makan sehat dan bergizi seimbang sesuai rekomendasi kesehatan untuk menunjang aktivitas sehari-hari; dan mempraktikkan penanganan cedera ringan sesuai pemahaman tentang prinsip pertolongan pertama.',
        lingkupMateri: [
          'Kebutuhan Cairan & Hidrasi Olahraga',
          'Kebersihan Tubuh & Organ Reproduksi',
          'Penanganan Pertama Cedera Ringan (Metode RICE Dasar)',
          'Pencegahan Terpapar Penyakit Menular & Bahaya Lapangan'
        ],
        contohTp: [
          'Menerapkan kebiasaan minum air putih cukup sebelum, saat istirahat, dan setelah berolahraga',
          'Menjelaskan cara merawat kebersihan organ reproduksi secara benar',
          'Mempraktikkan pertolongan pertama sederhana (kompres dingin) saat terkilir ringan',
          'Mengidentifikasi area lapangan atau alat olahraga yang rusak dan berpotensi cedera'
        ]
      }
    ]
  },
  {
    id: 'fase-c',
    phaseName: 'Fase C',
    grades: 'Kelas V dan VI SD/MI/Program Paket A',
    skRegulasi: 'Keputusan Kepala BSKAP Nomor 046/H/KR/2025',
    rasionalFase: 'Mata pelajaran PJOK pada Fase C diarahkan pada modifikasi keterampilan gerak spesifik secara mandiri, latihan kebugaran jasmani berorientasi kesehatan yang terukur, kepemimpinan sportif, serta kesiapan menyongsong masa pubertas dan pencegahan bahaya zat berbahaya (NAPZA).',
    capaianUmum: 'Pada akhir Fase C, murid memiliki kemampuan sebagai berikut.',
    elements: [
      {
        id: 'fase-c-terampil',
        name: 'Terampil Bergerak',
        alias: '3.1. Terampil Bergerak',
        description: 'Menyesuaikan keterampilan gerak melintasi berbagai situasi gerak; mentransfer strategi gerak yang sudah dikuasai ke dalam berbagai situasi gerak yang berbeda; dan menginvestigasi berbagai konsep gerak yang dapat diterapkan untuk meningkatkan capaian keterampilan gerak',
        lingkupMateri: [
          'Keterampilan Gerak Spesifik Atletik (Lari Cepat, Estafet, Tolak Peluru Modifikasi)',
          'Keterampilan Gerak Spesifik Bola Besar (Passing, Dribbling, Shooting, Servis Bawah)',
          'Keterampilan Gerak Spesifik Bola Kecil (Servis, Smash Bulutangkis, Pukulan Kasti)',
          'Rangkaian Senam Lantai (Roll Depan, Roll Belakang, Sikap Lilin, Kayang Aman)',
          'Senam Irama Kreasi Kelompok dengan Variasi Langkah dan Musik',
          'Aktivitas Penyelamatan Diri di Air (Kondisional)'
        ],
        contohTp: [
          'Memodifikasi keterampilan variasi passing bawah serta passing atas bola voli dalam situasi pertandingan',
          'Mempraktikkan gerak spesifik lari sambung/estafet dengan teknik pergantian tongkat visual/non-visual',
          'Mempraktikkan rangkaian senam lantai berguling ke depan dilanjutkan sikap lilin secara terkoordinasi',
          'Menampilkan senam irama kreasi kelompok dengan keselarasan gerak dan tempo musik',
          'Mempraktikkan teknik dasar servis dan pukulan lob dalam bulutangkis secara akurat'
        ]
      },
      {
        id: 'fase-c-belajar',
        name: 'Belajar Melalui Gerak',
        alias: '3.2. Belajar Melalui Gerak',
        description: 'Menguji efektivitas penerapan strategi gerak dalam berbagai situasi gerak; merancang peraturan alternatif dan modifikasi permainan untuk mendukung fair play dan partisipasi inklusif; dan menjalankan berbagai peran untuk mencapai keberhasilan kelompok atau tim di dalam berbagai aktivitas jasmani.',
        lingkupMateri: [
          'Taktik Menyerang & Bertahan dalam Permainan Beregu',
          'Kepemimpinan (Captaincy) & Pembagian Peran Anggota Tim',
          'Regulasi Resmi & Etika Pertandingan Olahraga',
          'Manajemen Emosi dan Sikap Menghormati Lawan Maupun Wasit'
        ],
        contohTp: [
          'Menganalisis dan menerapkan strategi penempatan posisi pertahanan dalam permainan bola beregu',
          'Berperan aktif sebagai pemimpin regu yang mengayomi dan membimbing rekan satu tim',
          'Menunjukkan sikap lapang dada dan menghormati keputusan wasit tanpa memicu perselisihan',
          'Mengevaluasi kelebihan dan kelemahan taktik bermain kelompok pasca pertandingan'
        ]
      },
      {
        id: 'fase-c-aktif',
        name: 'Bergaya Hidup Aktif',
        alias: '3.3. Bergaya Hidup Aktif',
        description: 'Berpartisipasi dalam aktivitas jasmani dan menjelaskan pengaruh aktivitas jasmani yang teratur terhadap kesehatan; mengidentifikasi rekomendasi aktivitas jasmani serta pencegahan perilaku sedenter.',
        lingkupMateri: [
          'Komponen Kebugaran Jasmani (Cardiorespiratory, Strength, Flexibility)',
          'Pengukuran Denyut Nadi (Nadi Radial/Karotis di Pergelangan/Leher)',
          'Penyusunan Rencana Aktivitas Fisik Mingguan Mandiri',
          'Sirkuit Latihan (Circuit Training) & Pengukuran Vo2Max Sederhana'
        ],
        contohTp: [
          'Menghitung frekuensi denyut nadi istirahat dan denyut nadi setelah berolahraga selama 1 menit',
          'Mempraktikkan sirkuit latihan (circuit training) untuk meningkatkan daya tahan jantung dan kekuatan otot',
          'Menyusun jadwal olahraga mingguan mandiri dan merefleksikan peningkatannya',
          'Menjelaskan dampak positif kebugaran jasmani prima terhadap fokus belajar di kelas'
        ]
      },
      {
        id: 'fase-c-menyehatkan',
        name: 'Memilih Hidup yang Menyehatkan',
        alias: '3.4. Memilih Hidup yang Menyehatkan',
        description: 'Mengidentifikasi dan menghubungkan antara gaya hidup, risiko kesehatan, dan aktivitas pencegahannya sesuai rekomendasi otoritas kesehatan; menjelaskan pola makan sehat untuk menunjang aktivitas jasmani berdasarkan informasi kandungan gizi pada makanan; dan mempraktikkan penanganan cedera sedang sesuai pemahaman tentang prinsip pertolongan pertama.',
        lingkupMateri: [
          'Pola Makan Gizi Seimbang Sesuai Kebutuhan Kalori Remaja',
          'Kesehatan Reproduksi & Perubahan Fisik Masa Pubertas',
          'Edukasi Bahaya Rokok, Vape, Minuman Keras & Narkotika (NAPZA)',
          'Pencegahan Pelecehan Seksual & Aksi Anti-Perundungan (Bullying)',
          'Penanganan Darurat Cedera Berat & Tanggap Bencana'
        ],
        contohTp: [
          'Menjelaskan perubahan fisik dan psikis pada masa pubertas serta cara merawat kebersihan tubuhnya',
          'Mengidentifikasi bahaya zat adiktif (rokok, vape, alkohol) terhadap organ paru-paru dan jantung',
          'Mempraktikkan cara menolak ajakan yang membahayakan diri dan melaporkan kasus bullying',
          'Menyusun menu makanan bergizi seimbang untuk mendukung aktivitas olahraga intensif'
        ]
      }
    ]
  },
  {
    id: 'fase-d',
    phaseName: 'Fase D',
    grades: 'Kelas 7, 8 & 9 (SMP / Terbuka)',
    skRegulasi: 'Keputusan Kepala BSKAP Nomor 046/H/KR/2025',
    rasionalFase: 'Mata pelajaran PJOK pada Fase D dirancang sebagai jembatan kesinambungan dari SD, menekankan keterampilan gerak spesifik formal, taktik olahraga beregu dan perorangan, kebugaran jasmani mandiri, serta pengembangan karakter kewarganegaraan.',
    capaianUmum: 'Pada akhir Fase D, peserta didik dapat menunjukkan kemampuan dalam mempraktikkan keterampilan gerak spesifik serta mentransfernya ke dalam berbagai situasi gerak; menerapkan konsep dan prinsip gerak; menerapkan prosedur aktivitas jasmani untuk pengembangan kebugaran jasmani dan pola hidup sehat; menunjukkan perilaku tanggung jawab personal dan sosial; serta menginternalisasi nilai-nilai gerak.',
    elements: [
      {
        id: 'fase-d-terampil',
        name: 'Terampil Bergerak',
        alias: 'Keterampilan Gerak Spesifik Cabang Olahraga',
        description: 'Peserta didik menganalisis dan mempraktikkan keterampilan gerak spesifik dalam berbagai permainan bola besar (sepak bola, bola basket, bola voli), bola kecil (bulutangkis, tenis meja), atletik (lari jarak menengah/jauh, lompat jauh, tolak peluru), bela diri (pencak silat), senam lantai, dan aktivitas gerak berirama formal.',
        lingkupMateri: [
          'Teknik Gerak Spesifik Sepak Bola, Bola Voli, Bola Basket',
          'Teknik Gerak Spesifik Bulutangkis & Tenis Meja',
          'Atletik Lari Jarak Pendek/Menengah & Lompat Jauh',
          'Seni Bela Diri Tradisional (Pencak Silat: Kuda-kuda, Pukulan, Tangkisan)',
          'Senam Ketangkasan & Aerobik Irama Modern'
        ],
        contohTp: [
          'Menganalisis dan mempraktikkan teknik servis atas dan smash dalam permainan bola voli',
          'Mempraktikkan gerak spesifik jurus dasar pencak silat dengan penghayatan nilai seni',
          'Mempraktikkan teknik awalan, tumpuan, melayang, dan mendarat dalam lompat jauh gaya jongkok'
        ]
      },
      {
        id: 'fase-d-belajar',
        name: 'Belajar Melalui Gerak',
        alias: 'Taktik, Regulasi Resmi & Nilai Sportivitas',
        description: 'Peserta didik merancang dan menerapkan taktik menyerang serta bertahan dalam pertandingan olahraga; memahami dan mematuhi regulasi perwasitan resmi; serta menunjukkan kepemimpinan, kepedulian sosial, dan etika berkompetisi secara sportif.',
        lingkupMateri: [
          'Pola Penyerangan dan Pertahanan Formal',
          'Regulasi dan Isyarat Perwasitan Cabang Olahraga',
          'Etika Kompetisi dan Respek Terhadap Lawan'
        ],
        contohTp: [
          'Merancang strategi penyerangan cepat (fast break) dalam permainan bola basket',
          'Menerapkan sinyal dan keputusan wasit dalam simulasi pertandingan sepak bola'
        ]
      },
      {
        id: 'fase-d-aktif',
        name: 'Bergaya Hidup Aktif',
        alias: 'Program Latihan Fisik Mandiri & Kebugaran',
        description: 'Peserta didik merancang, mempraktikkan, dan mengevaluasi program kebugaran jasmani mandiri terkait kesehatan dan keterampilan; mengukur tingkat kebugaran melalui tes standar; serta membiasakan diri berolahraga teratur.',
        lingkupMateri: [
          'Prinsip FITT (Frequency, Intensity, Time, Type) dalam Latihan Fisik',
          'Tes Kebugaran Jasmani Indonesia (TKJI) / Balke Test Sederhana',
          'Evaluasi Perkembangan Kebugaran Jasmani Mandiri'
        ],
        contohTp: [
          'Menyusun program latihan kelincahan dan daya tahan selama 4 minggu berdasarkan prinsip FITT',
          'Melakukan evaluasi mandiri terhadap hasil tes kebugaran jasmani'
        ]
      },
      {
        id: 'fase-d-menyehatkan',
        name: 'Memilih Hidup yang Menyehatkan',
        alias: 'Kesehatan Remaja, Pencegahan NAPZA & Pola Hidup',
        description: 'Peserta didik memahami pentingnya nutrisi seimbang untuk remaja aktif; menganalisis bahaya pergaulan bebas, miras, rokok, dan narkoba; serta memahami penanganan cedera olahraga lanjutan (metode PRICE).',
        lingkupMateri: [
          'Kebutuhan Nutrisi & Hidrasi Atlet/Remaja',
          'Pencegahan Pergaulan Bebas, Penyakit Menular Seksual (PMS) & NAPZA',
          'Manajemen Stres dan Istirahat Produktif'
        ],
        contohTp: [
          'Menganalisis dampak negatif penyalahgunaan narkotika terhadap organ tubuh dan masa depan remaja',
          'Menerapkan prosedur penanganan cedera terkilir sendi menggunakan metode PRICE'
        ]
      }
    ]
  }
];

const LOCAL_STORAGE_KEY = 'sadar_pjok_curriculum_cp_data_v4';

/**
 * Membaca data Capaian Pembelajaran dari LocalStorage (atau fallback ke data resmi)
 */
export function loadCpData(): CpFase[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Otomatis sinkronisasi teks CP standar resmi jika masih memuat teks lama
        const synced = parsed.map((f: CpFase) => {
          const defaultFase = DEFAULT_AUTHENTIC_CP_DATA.find(df => df.id === f.id);
          if (!defaultFase) return f;

          // Perbarui teks regulasi jika lama
          const skRegulasi = 'Keputusan Kepala BSKAP Nomor 046/H/KR/2025';

          // Periksa elemen: perbarui deskripsi elemen standar jika belum dikustomisasi
          const updatedElements = f.elements.map(el => {
            const defaultEl = defaultFase.elements.find(de => de.id === el.id);
            if (defaultEl && !el.isCustom) {
              return {
                ...el,
                alias: defaultEl.alias,
                description: defaultEl.description,
                name: defaultEl.name
              };
            }
            return el;
          });

          return {
            ...f,
            grades: defaultFase.grades,
            capaianUmum: defaultFase.capaianUmum || f.capaianUmum,
            skRegulasi,
            elements: updatedElements
          };
        });
        return synced;
      }
    }
  } catch (err) {
    console.warn('Gagal memuat data CP tersimpan, menggunakan standar:', err);
  }
  return DEFAULT_AUTHENTIC_CP_DATA;
}

/**
 * Menyimpan data Capaian Pembelajaran ke LocalStorage dan mengirim event sync
 */
export function saveCpData(data: CpFase[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    // Trigger custom window event agar komponen lain (seperti CpToTpView) langsung tersinkron
    window.dispatchEvent(new CustomEvent('sadar_pjok_cp_updated', { detail: data }));
  } catch (err) {
    console.error('Gagal menyimpan CP ke LocalStorage:', err);
  }
}

/**
 * Mengembalikan data Capaian Pembelajaran ke standar asli Kemendikdasmen (Keputusan Kepala BSKAP Nomor 046/H/KR/2025)
 */
export function resetCpDataToDefault(): CpFase[] {
  saveCpData(DEFAULT_AUTHENTIC_CP_DATA);
  return DEFAULT_AUTHENTIC_CP_DATA;
}

/**
 * Mengunduh cadangan konfigurasi CP dalam format JSON
 */
export function exportCpDataToJson(data: CpFase[], filename?: string): void {
  const exportPayload = {
    judul: 'Konfigurasi Capaian Pembelajaran (CP) PJOK Kurikulum Merdeka',
    aplikasi: 'SADAR PJOK SD',
    tanggalEkspor: new Date().toISOString(),
    regulasi: 'Keputusan Kepala BSKAP Nomor 046/H/KR/2025',
    dataFase: data
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `Cadangan_CP_PJOK_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Mengimpor cadangan konfigurasi CP dari berkas JSON
 */
export function importCpDataFromJson(jsonString: string): { success: boolean; data?: CpFase[]; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const faseList = Array.isArray(parsed) ? parsed : parsed.dataFase;
    if (!Array.isArray(faseList) || faseList.length === 0) {
      return { success: false, error: 'Format berkas JSON tidak valid. Pastikan berkas berasal dari ekspor cadangan CP.' };
    }
    // Validasi minimal ada id dan elements
    for (const f of faseList) {
      if (!f.id || !f.phaseName || !Array.isArray(f.elements)) {
        return { success: false, error: 'Struktur data Fase tidak memenuhi standar Capaian Pembelajaran.' };
      }
    }
    saveCpData(faseList);
    return { success: true, data: faseList };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memproses berkas JSON.' };
  }
}
