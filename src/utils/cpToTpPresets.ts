import { CpToTpResult, TpItem } from '../types';

/**
 * BANK PRESET FORMULASI CP KE TP (TUJUAN PEMBELAJARAN) RESMI PJOK SD
 * Kurikulum Merdeka / Kurikulum Nasional
 * Sesuai Keputusan Kepala BSKAP Nomor 046/H/KR/2025
 */

export const PRESET_CP_TO_TP_DATA: Record<string, CpToTpResult> = {
  // ==========================================
  // FASE A - KELAS 1 - TERAMPIL BERGERAK
  // ==========================================
  'fase-a-kelas-1-terampil': {
    fase: 'Fase A (Kelas 1 & 2)',
    kelas: 'Kelas 1 SD',
    elemen: 'Terampil Bergerak',
    cpAsli: 'Mempraktikkan keterampilan gerak fundamental dan menerapkannya dalam berbagai situasi gerak yang berbeda; mengeksplorasi berbagai strategi gerak; dan mengeksplorasi berbagai konsep gerak serta menyimpulkan efektivitasnya.',
    materiSpesifik: 'Pola Gerak Dasar Lokomotor, Non-Lokomotor, & Manipulatif Sederhana',
    analisisDekonstruksi: {
      kompetensiUtama: [
        'Mempraktikkan (P3) pola gerak lokomotor',
        'Menirukan (P1) gerak non-lokomotor',
        'Mengeksplorasi (P2) gerak manipulatif dasar',
        'Menyimpulkan (C2) efektivitas gerakan sederhana'
      ],
      lingkupMateriUtama: [
        'Gerak lokomotor: Jalan maju, mundur, menyamping, lari lurus & berbelok, lompat satu & dua kaki',
        'Gerak non-lokomotor: Meliuk badan, menekuk lutut, mengayun lengan, memutar pinggang',
        'Gerak manipulatif: Melempar bola ke sasaran, menangkap bola lambung datar, menendang bola ke gawang kecil',
        'Permainan sederhana & tradisional: Kucing-tikus, gobak sodor mini, estafet kelereng sendok'
      ],
      variasiKarakteristikSiswa: 'Siswa kelas 1 berada pada tahap transisi awal perkembangan motorik kasar, membutuhkan instruksi konkret berbasis cerita (dongeng gerak), media visual yang menarik, serta durasi aktivitas pendek yang menyenangkan.'
    },
    daftarTp: [
      {
        kodeTp: 'TP 1.1',
        rumusanTp: 'Peserta didik mampu mempraktikkan pola gerak dasar jalan, lari, dan lompat dalam berbagai arah dan lintasan secara terkoordinasi dan riang gembira.',
        kompetensiKko: 'Mempraktikkan (P3)',
        lingkupMateri: 'Pola Gerak Dasar Lokomotor',
        indikatorKetercapaian: [
          'Melakukan jalan lurus, menyamping, dan zig-zag sejauh 10 meter tanpa terjatuh',
          'Melakukan lari cepat pelan (jogging) dengan ayunan tangan berirama',
          'Melakukan lompatan mendarat dengan kedua lutut mengeper aman'
        ],
        profilPancasila: 'Mandiri, Bernalar Kritis',
        targetKelasSemester: 'Kelas 1 / Semester 1',
        alokasiWaktu: '6 JP (2 Pertemuan)',
        rekomendasiAsesmen: 'Observasi Unjuk Kerja Gerak Lapangan'
      },
      {
        kodeTp: 'TP 1.2',
        rumusanTp: 'Peserta didik mampu mempraktikkan gerak non-lokomotor seperti menekuk, meliuk, memutar, dan mengayun lengan dalam posisi diam untuk melatih kelenturan tubuh.',
        kompetensiKko: 'Mempraktikkan (P3)',
        lingkupMateri: 'Pola Gerak Dasar Non-Lokomotor',
        indikatorKetercapaian: [
          'Menirukan gerakan pohon tertiup angin (meliuk kiri-kanan)',
          'Melakukan gerakan memutar lengan ke depan dan ke belakang secara seimbang',
          'Menekuk lutut dalam posisi jongkok dan berdiri tegak kembali dengan stabil'
        ],
        profilPancasila: 'Mandiri, Kreatif',
        targetKelasSemester: 'Kelas 1 / Semester 1',
        alokasiWaktu: '4 JP (2 Pertemuan)',
        rekomendasiAsesmen: 'Penilaian Kinerja / Lembar Ceklis Sikap Tubuh'
      },
      {
        kodeTp: 'TP 1.3',
        rumusanTp: 'Peserta didik mampu mempraktikkan gerak manipulatif melempar dan menangkap bola kecil/besar berpasangan dengan jarak terukur secara terkontrol.',
        kompetensiKko: 'Mempraktikkan & Mengontrol (P3)',
        lingkupMateri: 'Pola Gerak Dasar Manipulatif',
        indikatorKetercapaian: [
          'Melempar bola plastik ke dalam keranjang dari jarak 2 meter dengan 3 kali tepat',
          'Menangkap bola yang dilempar pelan oleh rekan menggunakan kedua tangan di depan dada',
          'Menendang bola diam mengarah ke gawang mini atau cone'
        ],
        profilPancasila: 'Bergotong Royong, Mandiri',
        targetKelasSemester: 'Kelas 1 / Semester 2',
        alokasiWaktu: '8 JP (3 Pertemuan)',
        rekomendasiAsesmen: 'Tes Keterampilan Praktik Melempar & Menangkap'
      },
      {
        kodeTp: 'TP 1.4',
        rumusanTp: 'Peserta didik mampu menerapkan kombinasi gerak dasar lokomotor dan manipulatif dalam bentuk permainan tradisional anak dengan mentaati peraturan bermain.',
        kompetensiKko: 'Menerapkan (P2)',
        lingkupMateri: 'Permainan Sederhana & Tradisional',
        indikatorKetercapaian: [
          'Berpartisipasi aktif dalam permainan tradisional (seperti lempar kaleng / bentengan mini)',
          'Menunjukkan sikap gembira dan mematuhi giliran bermain bersama rekan'
        ],
        profilPancasila: 'Bergotong Royong, Berkebinekaan Global',
        targetKelasSemester: 'Kelas 1 / Semester 2',
        alokasiWaktu: '6 JP (2 Pertemuan)',
        rekomendasiAsesmen: 'Observasi Perilaku Sosial & Unjuk Kerja Lapangan'
      }
    ],
    rekomendasiPendekatan: 'Pendekatan bermain (play-based learning), demonstrasi langsung oleh guru, imitasi gerak terarah, serta modifikasi sarana dengan bola busa/plastik yang aman.',
    catatanPendidik: 'Fokuskan asesmen pada keberanian mencoba dan keceriaan bergerak siswa, bukan pada teknik sempurna. Selalu sediakan penguatan positif (pujian) dan istirahat minum air putih.'
  },

  // ==========================================
  // FASE A - KELAS 1 - BELAJAR MELALUI GERAK
  // ==========================================
  'fase-a-kelas-1-belajar': {
    fase: 'Fase A (Kelas 1 & 2)',
    kelas: 'Kelas 1 SD',
    elemen: 'Belajar Melalui Gerak',
    cpAsli: 'Menaati peraturan untuk menumbuhkan fair play di dalam berbagai aktivitas jasmani; menerapkan strategi kolaborasi ketika berpartisipasi dalam aktivitas jasmani.',
    materiSpesifik: 'Aturan Bermain, Kejujuran, Kerjasama, & Keselamatan Lapangan',
    analisisDekonstruksi: {
      kompetensiUtama: [
        'Menaati (A2) peraturan sederhana',
        'Menunjukkan (A3) sikap jujur dan sportivitas awal',
        'Menerapkan (P2) kolaborasi dan berbagi alat olahraga',
        'Mengenali (C2) area aman saat bergerak'
      ],
      lingkupMateriUtama: [
        'Kesepakatan aturan kelas PJOK di lapangan',
        'Budaya antre dan berbagi peralatan olahraga',
        'Keselamatan diri dan menghargai ruang gerak teman',
        'Sikap ramah dan saling mendukung saat bermain bersama'
      ],
      variasiKarakteristikSiswa: 'Siswa kelas 1 masih memiliki egosentrisme perkembangan awal, sehingga membutuhkan pembiasaan berbagi alat, berbaris antre, dan bimbingan cara meminta maaf jika bertubrukan.'
    },
    daftarTp: [
      {
        kodeTp: 'TP 1.1',
        rumusanTp: 'Peserta didik mampu menunjukkan perilaku menaati kesepakatan aturan sederhana demi keselamatan diri dan teman saat beraktivitas jasmani di lapangan.',
        kompetensiKko: 'Menaati & Mematuhi (A2)',
        lingkupMateri: 'Aturan Keselamatan Lapangan',
        indikatorKetercapaian: [
          'Berhenti bergerak saat peluit guru berbunyi tanda istirahat',
          'Menggunakan sepatu dan pakaian olahraga yang sesuai',
          'Memperhatikan ruang kosong sebelum berlari agar tidak menabrak kawan'
        ],
        profilPancasila: 'Beriman, Bertakwa, & Mandiri',
        targetKelasSemester: 'Kelas 1 / Semester 1',
        alokasiWaktu: '4 JP (2 Pertemuan)',
        rekomendasiAsesmen: 'Observasi Kepatuhan & Kedisiplinan'
      },
      {
        kodeTp: 'TP 1.2',
        rumusanTp: 'Peserta didik mampu menerapkan sikap berbagi peralatan olahraga dan bekerjasama dalam kelompok kecil secara ramah dan inklusif tanpa membedakan teman.',
        kompetensiKko: 'Menerapkan & Berkolaborasi (A3)',
        lingkupMateri: 'Kerjasama & Berbagi Alat',
        indikatorKetercapaian: [
          'Menyerahkan bola/alat kepada teman setelah gilirannya selesai secara bergantian',
          'Mengajak teman yang menyendiri untuk ikut bermain bersama kelompok'
        ],
        profilPancasila: 'Gotong Royong, Berkebinekaan Global',
        targetKelasSemester: 'Kelas 1 / Semester 2',
        alokasiWaktu: '4 JP (2 Pertemuan)',
        rekomendasiAsesmen: 'Jurnal Observasi Sikap Sosial'
      }
    ],
    rekomendasiPendekatan: 'Pendekatan pembiasaan reflektif (Circle Time) sebelum dan sesudah aktivitas olahraga, pemberian reward lencana anak jujur/sportif.',
    catatanPendidik: 'Latih anak untuk saling menyapa dan mengucapkan tos/salam sportif pasca permainan mini.'
  },

  // ==========================================
  // FASE B - KELAS 4 - TERAMPIL BERGERAK
  // ==========================================
  'fase-b-kelas-4-terampil': {
    fase: 'Fase B (Kelas 3 & 4)',
    kelas: 'Kelas 4 SD',
    elemen: 'Terampil Bergerak',
    cpAsli: 'Menghaluskan keterampilan gerak fundamental dan menerapkannya dalam situasi gerak yang baru; menyesuaikan strategi gerak untuk mendapatkan capaian keterampilan gerak; dan memperagakan berbagai konsep gerak yang dapat diterapkan dalam rangkaian gerak.',
    materiSpesifik: 'Variasi & Kombinasi Permainan Bola Besar & Kecil, Senam Lantai, serta Senam Ritmik',
    analisisDekonstruksi: {
      kompetensiUtama: [
        'Mempraktikkan (P3) variasi gerak dasar',
        'Mengombinasikan (P4) pola gerak lokomotor dan manipulatif',
        'Menganalisis (C4) arah dan laju bola dalam permainan sederhana',
        'Menampilkan (P3) rangkaian gerak senam irama'
      ],
      lingkupMateriUtama: [
        'Permainan Bola Besar: Passing kaki bagian dalam/luar sepak bola, servis bawah mini voli, dribble bola tangan',
        'Permainan Bola Kecil: Melempar lambung & mendatar kasti, memukul bola bertongkat, menangkap bola melambung',
        'Senam Lantai: Guling ke depan (forward roll) dengan awalan jongkok dan tengkuk menempel matras',
        'Gerak Berirama: Kombinasi langkah kaki silang dan ayunan dua lengan mengikuti musik tempo sedang'
      ],
      variasiKarakteristikSiswa: 'Siswa kelas 4 memiliki koordinasi mata-tangan-kaki yang mulai matang, menyukai kompetisi beregu kecil, dan mampu memahami aturan strategi sederhana.'
    },
    daftarTp: [
      {
        kodeTp: 'TP 4.1',
        rumusanTp: 'Peserta didik mampu mempraktikkan variasi dan kombinasi gerak menendang, menghentikan, dan menggiring bola menggunakan kaki bagian dalam pada permainan sepak bola gawang kecil secara terarah.',
        kompetensiKko: 'Mengombinasikan & Mengontrol (P4)',
        lingkupMateri: 'Permainan Bola Besar (Sepak Bola Sederhana)',
        indikatorKetercapaian: [
          'Melakukan passing bola kaki bagian dalam tepat sasaran ke rekan sejauh 5 meter',
          'Menghentikan laju bola bergulir dengan telapak atau kaki bagian dalam tanpa memantul liar',
          'Menggiring bola berliku melewati 4 buah cone dengan kontrol stabil'
        ],
        profilPancasila: 'Mandiri, Gotong Royong',
        targetKelasSemester: 'Kelas 4 / Semester 1',
        alokasiWaktu: '9 JP (3 Pertemuan)',
        rekomendasiAsesmen: 'Tes Unjuk Kerja Keterampilan Passing & Dribbling'
      },
      {
        kodeTp: 'TP 4.2',
        rumusanTp: 'Peserta didik mampu mempraktikkan kombinasi gerak melempar, menangkap, dan memukul bola berpasangan serta berlari menuju pos dalam permainan kasti modifikasi.',
        kompetensiKko: 'Mengombinasikan (P4)',
        lingkupMateri: 'Permainan Bola Kecil (Kasti)',
        indikatorKetercapaian: [
          'Melempar bola kasti mendatar dan melambung dengan ayunan lengan yang pas',
          'Memukul bola yang dilempar pelambung menggunakan tongkat pemukul secara tepat',
          'Menangkap bola kasti menggunakan sarung tangan/dua tangan tanpa terjatuh'
        ],
        profilPancasila: 'Gotong Royong, Bernalar Kritis',
        targetKelasSemester: 'Kelas 4 / Semester 1',
        alokasiWaktu: '9 JP (3 Pertemuan)',
        rekomendasiAsesmen: 'Rubrik Penilaian Unjuk Kerja Permainan Kasti'
      },
      {
        kodeTp: 'TP 4.3',
        rumusanTp: 'Peserta didik mampu mempraktikkan rangkaian gerak guling ke depan (roll depan) di atas matras dengan posisi dagu menempel dada dan mendarat jongkok secara aman.',
        kompetensiKko: 'Mempraktikkan (P3)',
        lingkupMateri: 'Senam Lantai (Ketangkasan)',
        indikatorKetercapaian: [
          'Mengambil sikap awal jongkok kedua telapak tangan menempel matras selebar bahu',
          'Memasukkan kepala hingga tengkuk menyentuh matras saat berguling',
          'Mengakhiri gulingan dengan posisi jongkok seimbang kedua tangan lurus ke depan'
        ],
        profilPancasila: 'Mandiri, Bernalar Kritis',
        targetKelasSemester: 'Kelas 4 / Semester 2',
        alokasiWaktu: '6 JP (2 Pertemuan)',
        rekomendasiAsesmen: 'Tes Praktik Rubrik 3 Kriteria Senam Ketangkasan'
      },
      {
        kodeTp: 'TP 4.4',
        rumusanTp: 'Peserta didik mampu mempraktikkan kombinasi langkah kaki biasa/rapat dan ayunan lengan dalam aktivitas gerak berirama secara kompak dan selaras tempo.',
        kompetensiKko: 'Mempraktikkan & Menyelaraskan (P3)',
        lingkupMateri: 'Aktivitas Gerak Berirama (Senam Ritmik)',
        indikatorKetercapaian: [
          'Melakukan langkah kaki ke depan dan ke samping dengan ketukan 4/4 stabil',
          'Mengayunkan lengan ke atas dan ke samping secara harmonis dengan langkah kaki',
          'Menampilkan koreografi sederhana beregu 4 orang secara kompak'
        ],
        profilPancasila: 'Kreatif, Gotong Royong',
        targetKelasSemester: 'Kelas 4 / Semester 2',
        alokasiWaktu: '6 JP (2 Pertemuan)',
        rekomendasiAsesmen: 'Penilaian Kinerja Kelompok Gerak Berirama'
      }
    ],
    rekomendasiPendekatan: 'Teaching Games for Understanding (TGfU), pendekatan saintifik berbasis demonstrasi dan analisis video gerak lambat, serta koreksi timbal balik teman sebaya (peer assessment).',
    catatanPendidik: 'Prioritaskan keselamatan matras pada materi senam lantai. Berikan bantuan dorongan pinggul bagi siswa yang lehernya masih tegang.'
  },

  // ==========================================
  // FASE C - KELAS 5 - TERAMPIL BERGERAK
  // ==========================================
  'fase-c-kelas-5-terampil': {
    fase: 'Fase C (Kelas 5 & 6)',
    kelas: 'Kelas 5 SD',
    elemen: 'Terampil Bergerak',
    cpAsli: 'Menyesuaikan keterampilan gerak melintasi berbagai situasi gerak; mentransfer strategi gerak yang sudah dikuasai ke dalam berbagai situasi gerak yang berbeda; dan menginvestigasi berbagai konsep gerak yang dapat diterapkan untuk meningkatkan capaian keterampilan gerak',
    materiSpesifik: 'Gerak Spesifik Atletik, Bola Voli Mini, Bulutangkis, & Senam Lantai Lanjutan',
    analisisDekonstruksi: {
      kompetensiUtama: [
        'Memodifikasi (P4) keterampilan gerak spesifik',
        'Mempraktikkan (P3) teknik dasar cabang olahraga',
        'Menganalisis (C4) keselarasan dan mekanika gerak',
        'Menerapkan (P3) strategi permainan terstruktur'
      ],
      lingkupMateriUtama: [
        'Atletik: Awalan start jongkok lari 50 meter, teknik pergantian tongkat estafet visual & non-visual',
        'Bola Voli Mini: Servis bawah, passing bawah dua tangan, passing atas ke rekan setim',
        'Bulutangkis: Pegangan raket (forehand & backhand grip), servis pendek, pukulan lob tinggi',
        'Senam Lantai: Kombinasi sikap lilin menopang pinggul dan guling belakang aman'
      ],
      variasiKarakteristikSiswa: 'Siswa kelas 5 memasuki fase peralihan pra-pubertas dengan rentang tinggi dan berat badan yang mulai bervariasi, membutuhkan diferensiasi beban latihan gerak dan pendampingan psikomotorik yang bijak.'
    },
    daftarTp: [
      {
        kodeTp: 'TP 5.1',
        rumusanTp: 'Peserta didik mampu mempraktikkan gerak spesifik start jongkok, lari cepat 50 meter, dan ayunan tongkat estafet dalam olahraga atletik dasar secara tepat.',
        kompetensiKko: 'Mempraktikkan & Menyesuaikan (P3)',
        lingkupMateri: 'Atletik (Lari Cepat & Estafet)',
        indikatorKetercapaian: [
          'Melakukan aba-aba "Bersedia, Siap, Ya" dengan posisi pinggul lebih tinggi dari bahu',
          'Berlari dengan langkah panjang, ayunan siku 90 derajat, dan pandangan ke depan',
          'Melakukan perpindahan tongkat estafet lari sambung tanpa menjatuhkan tongkat'
        ],
        profilPancasila: 'Mandiri, Bernalar Kritis',
        targetKelasSemester: 'Kelas 5 / Semester 1',
        alokasiWaktu: '9 JP (3 Pertemuan)',
        rekomendasiAsesmen: 'Pengukuran Catatan Waktu Lari & Observasi Teknik Start'
      },
      {
        kodeTp: 'TP 5.2',
        rumusanTp: 'Peserta didik mampu memodifikasi dan mempraktikkan variasi passing bawah dan servis bawah dalam simulasi permainan bola voli mini secara sportif.',
        kompetensiKko: 'Memodifikasi & Mempraktikkan (P4)',
        lingkupMateri: 'Permainan Bola Voli Mini',
        indikatorKetercapaian: [
          'Melakukan passing bawah dengan perkenaan bola tepat pada bagian atas pergelangan tangan',
          'Mengirim umpan lambung stabil kepada rekan pengumpan di area depan net',
          'Melakukan servis bawah melewati net setinggi 2 meter dengan 3 kali keberhasilan'
        ],
        profilPancasila: 'Gotong Royong, Mandiri',
        targetKelasSemester: 'Kelas 5 / Semester 1',
        alokasiWaktu: '9 JP (3 Pertemuan)',
        rekomendasiAsesmen: 'Tes Keterampilan Passing Bawah & Lembar Kerja Formatif'
      },
      {
        kodeTp: 'TP 5.3',
        rumusanTp: 'Peserta didik mampu mempraktikkan teknik dasar servis dan pukulan lob dalam permainan bulutangkis dengan pegangan raket yang benar.',
        kompetensiKko: 'Mempraktikkan (P3)',
        lingkupMateri: 'Permainan Bola Kecil (Bulutangkis)',
        indikatorKetercapaian: [
          'Menunjukkan cara memegang raket (forehand grip & backhand grip) secara tepat',
          'Melakukan servis pendek dan servis panjang melintasi garis batas lapangan lawan',
          'Melakukan pukulan lob dari belakang lapangan mengarah ke area belakang lawan'
        ],
        profilPancasila: 'Mandiri, Bernalar Kritis',
        targetKelasSemester: 'Kelas 5 / Semester 2',
        alokasiWaktu: '9 JP (3 Pertemuan)',
        rekomendasiAsesmen: 'Tes Keterampilan Servis & Pukulan Shuttlecock'
      },
      {
        kodeTp: 'TP 5.4',
        rumusanTp: 'Peserta didik mampu mempraktikkan rangkaian senam lantai sikap lilin dan guling belakang dengan tumpuan tangan kokoh dan menjaga keseimbangan tubuh.',
        kompetensiKko: 'Mempraktikkan (P3)',
        lingkupMateri: 'Senam Lantai Kombinasi',
        indikatorKetercapaian: [
          'Menopang pinggul dengan kedua tangan saat mengangkat kedua kaki lurus tegak ke atas (sikap lilin) selama 5 detik',
          'Melakukan gulingan ke belakang dengan telapak tangan menolak di samping telinga hingga berdiri kembali'
        ],
        profilPancasila: 'Mandiri, Bernalar Kritis',
        targetKelasSemester: 'Kelas 5 / Semester 2',
        alokasiWaktu: '6 JP (2 Pertemuan)',
        rekomendasiAsesmen: 'Rubrik Penilaian Unjuk Kerja Senam Ketangkasan'
      }
    ],
    rekomendasiPendekatan: 'Pembelajaran berbasis proyek mini turnamen kelas, pendekatan diferensiasi proses berdasarkan tinggi badan & kekuatan otot, serta video self-recording gerak.',
    catatanPendidik: 'Gunakan net yang bisa disesuaikan ketinggiannya dan shuttlecock nilon yang tahan lama untuk efisiensi latihan bulutangkis.'
  },

  // ==========================================
  // FASE C - KELAS 6 - BERGAYA HIDUP AKTIF
  // ==========================================
  'fase-c-kelas-6-aktif': {
    fase: 'Fase C (Kelas 5 & 6)',
    kelas: 'Kelas 6 SD',
    elemen: 'Bergaya Hidup Aktif',
    cpAsli: 'Berpartisipasi dalam aktivitas jasmani dan menjelaskan pengaruh aktivitas jasmani yang teratur terhadap kesehatan; mengidentifikasi rekomendasi aktivitas jasmani serta pencegahan perilaku sedenter.',
    materiSpesifik: 'Pengukuran Denyut Nadi, Circuit Training Kebugaran Jasmani, & Jurnal Fisik',
    analisisDekonstruksi: {
      kompetensiUtama: [
        'Mempraktikkan (P3) sirkuit latihan kebugaran jasmani',
        'Memantau & Menghitung (C3) denyut nadi istirahat & latihan',
        'Menganalisis (C4) dampak latihan fisik terhadap imunitas tubuh',
        'Merancang (P2) jadwal olahraga mandiri mingguan'
      ],
      lingkupMateriUtama: [
        'Metode perabaan denyut nadi pada arteri radialis (pergelangan) dan arteri karotis (leher)',
        'Komponen kebugaran jasmani: Daya tahan (beep test sederhana), kekuatan (push-up, sit-up), kelenturan (sit & reach), kelincahan (shuttle run)',
        'Sirkuit training (pos latihan 4 pos terstruktur)',
        'Pembuatan lembar log aktivitas olahraga mandiri 30 menit per hari'
      ],
      variasiKarakteristikSiswa: 'Siswa kelas 6 sudah mampu berpikir logis kuantitatif (menghitung denyut nadi per menit, mencatat grafik kebugaran), membutuhkan motivasi intrinsik untuk mempertahankan kebugaran menjelang kelulusan SD.'
    },
    daftarTp: [
      {
        kodeTp: 'TP 6.1',
        rumusanTp: 'Peserta didik mampu menghitung frekuensi denyut nadi istirahat dan denyut nadi latihan selama 1 menit serta menyimpulkan respon fisiologis tubuh pasca berolahraga.',
        kompetensiKko: 'Menghitung & Menganalisis (C4)',
        lingkupMateri: 'Pengukuran Denyut Nadi & Respon Fisik',
        indikatorKetercapaian: [
          'Menemukan titik denyut nadi di pergelangan tangan atau leher dalam waktu 15 detik',
          'Menghitung jumlah denyut nadi istirahat sebelum beraktivitas (kisaran 70-90 bpm)',
          'Menghitung denyut nadi setelah lari cepat 5 menit dan membandingkan perubahannya'
        ],
        profilPancasila: 'Bernalar Kritis, Mandiri',
        targetKelasSemester: 'Kelas 6 / Semester 1',
        alokasiWaktu: '6 JP (2 Pertemuan)',
        rekomendasiAsesmen: 'Lembar Portofolio Pengukuran Nadi & Kuis Pemahaman'
      },
      {
        kodeTp: 'TP 6.2',
        rumusanTp: 'Peserta didik mampu mempraktikkan sirkuit latihan 4 pos (push-up modifikasi, sit-up, lari zig-zag, dan loncat tali) untuk meningkatkan daya tahan dan kekuatan otot.',
        kompetensiKko: 'Mempraktikkan (P3)',
        lingkupMateri: 'Latihan Kebugaran Jasmani (Circuit Training)',
        indikatorKetercapaian: [
          'Menyelesaikan sirkuit latihan di 4 pos secara berurutan dengan jeda istirahat 30 detik',
          'Melakukan gerakan push-up dan sit-up dengan posisi punggung dan leher yang aman',
          'Mencapai target pengulangan gerak sesuai kapasitas kebugaran dirinya'
        ],
        profilPancasila: 'Mandiri, Gotong Royong',
        targetKelasSemester: 'Kelas 6 / Semester 1',
        alokasiWaktu: '8 JP (3 Pertemuan)',
        rekomendasiAsesmen: 'Tes Tes Kebugaran Jasmani Indonesia (TKJI) SD'
      }
    ],
    rekomendasiPendekatan: 'Pendekatan kontekstual berbasis data kebugaran diri (Self-assessment), penggunaan stopwatch dan lembar kerja grafik perkembangan kebugaran.',
    catatanPendidik: 'Jangan bandingkan skor kebugaran antar siswa secara kaku; apresiasi setiap peningkatan (progress) pribadi siswa.'
  }
};

/**
 * Mencari preset terdekat berdasarkan faseId, kelas, dan nama/id elemen
 */
export function getPresetCpToTp(faseId: string, kelas: string, elementIdOrName: string): CpToTpResult | null {
  const normEl = elementIdOrName.toLowerCase();
  
  // Try exact key match first
  for (const [key, preset] of Object.entries(PRESET_CP_TO_TP_DATA)) {
    if (key.includes(faseId)) {
      if (
        (normEl.includes('terampil') && key.includes('terampil')) ||
        (normEl.includes('belajar') && key.includes('belajar')) ||
        (normEl.includes('aktif') && key.includes('aktif')) ||
        (normEl.includes('sehat') && key.includes('sehat'))
      ) {
        return {
          ...preset,
          kelas: `Kelas ${kelas} SD`
        };
      }
    }
  }

  // Fallback to first preset in list matching fase
  const fallback = Object.values(PRESET_CP_TO_TP_DATA).find(p => p.fase.toLowerCase().includes(faseId));
  if (fallback) {
    return {
      ...fallback,
      kelas: `Kelas ${kelas} SD`
    };
  }

  // Fallback to first overall
  return Object.values(PRESET_CP_TO_TP_DATA)[0];
}
