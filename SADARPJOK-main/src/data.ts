import { ClassData, JurnalMengajar, ModulAjar, RubrikFisik, CpFase } from './types';

export const INITIAL_CLASSES: ClassData[] = [
  {
    id: 'class-1',
    name: 'Kelas 1-A',
    grade: 1,
    students: [
      {
        id: 's1-1', name: 'Ahmad Fauzi', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 80, psychomotor: 85, affective: 90 }
      },
      {
        id: 's1-2', name: 'Budi Santoso', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'S', '2026-07-03': 'H' },
        scores: { cognitive: 75, psychomotor: 80, affective: 85 }
      },
      {
        id: 's1-3', name: 'Candra Kirana', gender: 'P',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 85, psychomotor: 78, affective: 95 }
      },
      {
        id: 's1-4', name: 'Dwi Cahyo', gender: 'L',
        attendance: { '2026-07-01': 'I', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 70, psychomotor: 82, affective: 80 }
      },
      {
        id: 's1-5', name: 'Eka Lestari', gender: 'P',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 90, psychomotor: 84, affective: 92 }
      },
      {
        id: 's1-6', name: 'Fajar Nugroho', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'A', '2026-07-03': 'H' },
        scores: { cognitive: 72, psychomotor: 88, affective: 75 }
      },
      {
        id: 's1-7', name: 'Gita Amalia', gender: 'P',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 88, psychomotor: 75, affective: 88 }
      }
    ]
  },
  {
    id: 'class-2',
    name: 'Kelas 2-A',
    grade: 2,
    students: [
      {
        id: 's2-1', name: 'Ananda Putra', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 80, psychomotor: 82, affective: 85 }
      },
      {
        id: 's2-2', name: 'Bella Safira', gender: 'P',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 85, psychomotor: 80, affective: 90 }
      },
      {
        id: 's2-3', name: 'Guntur Pamungkas', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 75, psychomotor: 78, affective: 80 }
      }
    ]
  },
  {
    id: 'class-3',
    name: 'Kelas 3-A',
    grade: 3,
    students: [
      {
        id: 's3-1', name: 'Citra Lestari', gender: 'P',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 82, psychomotor: 85, affective: 88 }
      },
      {
        id: 's3-2', name: 'Deni Setiawan', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 78, psychomotor: 80, affective: 82 }
      },
      {
        id: 's3-3', name: 'Evi Susanti', gender: 'P',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 88, psychomotor: 82, affective: 85 }
      }
    ]
  },
  {
    id: 'class-4',
    name: 'Kelas 4-B',
    grade: 4,
    students: [
      {
        id: 's4-1', name: 'Hadi Wijaya', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 85, psychomotor: 88, affective: 92 }
      },
      {
        id: 's4-2', name: 'Indah Permata', gender: 'P',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'I' },
        scores: { cognitive: 88, psychomotor: 82, affective: 95 }
      },
      {
        id: 's4-3', name: 'Joko Susilo', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 78, psychomotor: 92, affective: 85 }
      },
      {
        id: 's4-4', name: 'Kartika Sari', gender: 'P',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 82, psychomotor: 80, affective: 90 }
      },
      {
        id: 's4-5', name: 'Lilik Kurniawan', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'S', '2026-07-03': 'H' },
        scores: { cognitive: 74, psychomotor: 86, affective: 80 }
      },
      {
        id: 's4-6', name: 'Muhammad Rizky', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 80, psychomotor: 90, affective: 88 }
      },
      {
        id: 's4-7', name: 'Novi Fitriani', gender: 'P',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 86, psychomotor: 84, affective: 92 }
      },
      {
        id: 's4-8', name: 'Oki Pratama', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'A', '2026-07-03': 'H' },
        scores: { cognitive: 72, psychomotor: 85, affective: 78 }
      }
    ]
  },
  {
    id: 'class-5',
    name: 'Kelas 5-A',
    grade: 5,
    students: [
      {
        id: 's5-1', name: 'Edo Pratama', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 84, psychomotor: 86, affective: 85 }
      },
      {
        id: 's5-2', name: 'Fitri Handayani', gender: 'P',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 88, psychomotor: 84, affective: 90 }
      },
      {
        id: 's5-3', name: 'Galang Rambu', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 80, psychomotor: 82, affective: 80 }
      }
    ]
  },
  {
    id: 'class-6',
    name: 'Kelas 6-C',
    grade: 6,
    students: [
      {
        id: 's6-1', name: 'Putu Gede', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 90, psychomotor: 95, affective: 92 }
      },
      {
        id: 's6-2', name: 'Rian Hidayat', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 82, psychomotor: 90, affective: 88 }
      },
      {
        id: 's6-3', name: 'Siti Aminah', gender: 'P',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 95, psychomotor: 85, affective: 96 }
      },
      {
        id: 's6-4', name: 'Taufik Hidayat', gender: 'L',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'S', '2026-07-03': 'H' },
        scores: { cognitive: 80, psychomotor: 92, affective: 84 }
      },
      {
        id: 's6-5', name: 'Utami Dewi', gender: 'P',
        attendance: { '2026-07-01': 'H', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 88, psychomotor: 86, affective: 94 }
      },
      {
        id: 's6-6', name: 'Wawan Hermawan', gender: 'L',
        attendance: { '2026-07-01': 'I', '2026-07-02': 'H', '2026-07-03': 'H' },
        scores: { cognitive: 78, psychomotor: 88, affective: 82 }
      }
    ]
  }
];

export const INITIAL_MODULS: ModulAjar[] = [
  {
    id: 'modul-1',
    title: 'Gerak Dasar Lokomotor - Berlari',
    grade: 1,
    semester: 1,
    materiPokok: 'Gerak Lokomotor Berlari Cepat dan Berkelok-kelok',
    alokasiWaktu: '2 x 35 Menit (1 Pertemuan)',
    tujuanPembelajaran: [
      'Siswa dapat mengidentifikasi berbagai macam gerak lokomotor khususnya berlari dengan benar.',
      'Siswa dapat mempraktikkan kombinasi gerak berlari cepat dan berkelok-kelok dengan koordinasi yang baik.',
      'Siswa menunjukkan sikap kerja sama dan disiplin selama melakukan aktivitas permainan fisik.'
    ],
    kegiatanPembelajaran: {
      pendahuluan: [
        'Guru menyapa siswa, mengabsen, berdoa bersama, dan memastikan kesiapan fisik siswa.',
        'Pemanasan dinamis dipimpin guru dikemas dalam permainan "Kucing dan Tikus" untuk melatih kelincahan kaki selama 10 menit.',
        'Guru memberikan persepsi tentang pentingnya kekuatan kaki untuk berlari.'
      ],
      inti: [
        'Siswa menyimak demonstrasi guru tentang sikap tubuh yang benar saat berlari cepat (badan condong, ayunan tangan, dan pendaratan kaki).',
        'Latihan individu: Siswa berlari lurus 15 meter secara bergantian.',
        'Latihan kombinasi: Siswa berlari berkelok-kelok (zig-zag) melewati rintangan cone/corong yang disusun berjarak 1.5 meter.',
        'Permainan beregu: Siswa dibagi menjadi 3 tim untuk lomba estafet lari zig-zag membawa bola kecil.'
      ],
      penutup: [
        'Pendinginan statis dipandu oleh salah satu siswa berprestasi.',
        'Evaluasi singkat: Guru menanyakan bagian tubuh mana yang paling bekerja dan cara berlari yang benar.',
        'Refleksi sikap kerjasama tim selama perlombaan.',
        'Berdoa bersama untuk menutup pembelajaran.'
      ]
    },
    saranaPrasarana: ['Cone/Corong Pembatas (10 buah)', 'Peluit Guru', 'Stopwatch', 'Bola kecil (3 buah)'],
    rubrikPenilaian: 'Aspek Keterampilan:\n- Sangat Baik: Berlari cepat dengan postur badan condong depan, ayunan tangan aktif, dan berhasil melintasi rintangan zig-zag tanpa menyentuh cone.\n- Cukup: Berlari cepat namun kadang menyentuh cone saat berkelok.\n- Kurang: Postur lari terlalu tegak dan sering terjatuh atau menabrak rintangan.',
    createdAt: '2026-07-01'
  },
  {
    id: 'modul-2',
    title: 'Variasi dan Kombinasi Passing Bawah Sepak Bola',
    grade: 4,
    semester: 1,
    materiPokok: 'Permainan Bola Besar - Sepak Bola',
    alokasiWaktu: '3 x 35 Menit (1 Pertemuan)',
    tujuanPembelajaran: [
      'Siswa dapat menganalisis cara menendang bola dengan kaki bagian dalam dengan tepat.',
      'Siswa dapat mempraktikkan passing bawah sepak bola secara berpasangan dengan akurasi arah yang baik.',
      'Siswa menunjukkan sikap sportivitas dan menghargai kemampuan teman dalam permainan.'
    ],
    kegiatanPembelajaran: {
      pendahuluan: [
        'Apersepsi: Guru mengaitkan materi dengan pertandingan timnas sepak bola terbaru.',
        'Pemanasan: Lari keliling lapangan bola, dilanjutkan dengan stretching statis fokus pada otot tungkai dan paha.'
      ],
      inti: [
        'Guru menjelaskan dan menunjukkan teknik dasar menendang bola (passing) dengan kaki bagian dalam (posisi kaki tumpu, perkenaan kaki dengan bola, dan follow-through).',
        'Siswa melakukan latihan berpasangan jarak 5 meter: satu menendang, satu menghentikan (control) bola.',
        'Variasi latihan: Jarak berpasangan dijauhkan menjadi 8 meter dengan menambah rintangan di tengah.',
        'Game Modifikasi: Bermain sepak bola gawang kecil (5 lawan 5) dengan aturan wajib melakukan minimal 3 kali passing sebelum menembak ke gawang.'
      ],
      penutup: [
        'Pendinginan sambil duduk meluruskan kaki untuk menghindari kram.',
        'Siswa merangkum tips melakukan passing akurat.',
        'Apresiasi dari guru kepada tim yang bermain paling sportif.'
      ]
    },
    saranaPrasarana: ['Bola Sepak No. 4 (6 buah)', 'Cone (12 buah)', 'Rompi tim (2 warna berbeda)', 'Peluit'],
    rubrikPenilaian: 'Aspek Keterampilan:\n- Sangat Baik: Kaki tumpu sejajar bola, perkenaan kaki bagian dalam pas di tengah bola, hasil umpan datar dan akurat mengarah ke rekan.\n- Cukup: Teknik benar namun arah bola kadang melenceng atau melambung tinggi.\n- Kurang: Menendang menggunakan ujung kaki, bola melenceng jauh dari rekan.',
    createdAt: '2026-07-03'
  }
];

export const INITIAL_JOURNALS: JurnalMengajar[] = [
  {
    id: 'j-1',
    date: '2026-07-02',
    classId: 'class-1',
    className: 'Kelas 1-A',
    materi: 'Gerak Lokomotor Berlari',
    catatanKejadian: 'Siswa bernama Budi Santoso mengeluh sakit lutut ringan setelah lari zig-zag. Segera ditangani dengan kompres es di UKS. Siswa Ahmad Fauzi menunjukkan kelincahan luar biasa.',
    tindakLanjut: 'Memantau perkembangan cedera Budi di pertemuan berikutnya. Memberikan variasi rintangan yang lebih aman.'
  },
  {
    id: 'j-2',
    date: '2026-07-03',
    classId: 'class-2',
    className: 'Kelas 4-B',
    materi: 'Permainan Bola Besar - Passing Sepak Bola',
    catatanKejadian: 'Siswa bermain game modifikasi sepak bola 5v5 dengan semangat tinggi. Terjadi sedikit benturan antara Joko dan Oki, namun langsung saling bersalaman dengan sportif.',
    tindakLanjut: 'Pertahankan iklim kompetisi yang sportif ini. Pertemuan berikutnya lanjut ke materi shooting.'
  }
];

export const PREBUILT_RUBRIKS: RubrikFisik[] = [
  {
    id: 'r-1',
    materi: 'Passing Kaki Bagian Dalam (Sepak Bola)',
    kategori: 'Bola Besar',
    indikator: [
      {
        nama: 'Posisi Kaki Tumpuan',
        kriteriaBagus: 'Kaki tumpu diletakkan di samping bola (jarak ± 1 kepal) dengan lutut sedikit ditekuk.',
        kriteriaCukup: 'Kaki tumpu terlalu dekat atau terlalu jauh dari bola, atau lutut kaku.',
        kriteriaKurang: 'Kaki tumpu di depan atau di belakang bola, menyulitkan gerakan ayunan.'
      },
      {
        nama: 'Perkenaan Bola pada Kaki',
        kriteriaBagus: 'Bola disentuh tepat pada bagian tengah dalam sepatu dengan pergelangan kaki dikunci.',
        kriteriaCukup: 'Sentuhan bola agak melenceng ke arah punggung kaki atau tumit.',
        kriteriaKurang: 'Bola disentuh menggunakan ujung kaki (nyungkil) atau sol sepatu.'
      },
      {
        nama: 'Akurasi & Kontrol Hasil Umpan',
        kriteriaBagus: 'Umpan bergulir mulus di atas tanah (datar) dan mengarah tepat ke target.',
        kriteriaCukup: 'Umpan agak melambung atau sedikit melenceng ke kiri/kanan target.',
        kriteriaKurang: 'Umpan melambung tinggi, terlalu deras, atau melenceng sangat jauh.'
      }
    ]
  },
  {
    id: 'r-2',
    materi: 'Roll Depan / Guling Depan (Senam Lantai)',
    kategori: 'Senam',
    indikator: [
      {
        nama: 'Tumpuan Tangan & Kepala',
        kriteriaBagus: 'Kedua tangan dibuka selebar bahu di matras, dagu merapat ke dada (tengkuk menempel matras pertama kali).',
        kriteriaCukup: 'Tumpuan tangan tidak rata, kepala diletakkan pada dahi/ubun-ubun bukan tengkuk.',
        kriteriaKurang: 'Tumpuan tangan terlalu sempit/lebar, dahi membentur matras sehingga leher tegang.'
      },
      {
        nama: 'Gulingan & Fleksibilitas',
        kriteriaBagus: 'Badan membulat sempurna saat berguling, punggung menyentuh matras dengan mulus.',
        kriteriaCukup: 'Gulingan miring atau badan kurang menekuk sehingga gulingan terhambat.',
        kriteriaKurang: 'Badan kaku, posisi berguling jatuh ke samping matras.'
      },
      {
        nama: 'Sikap Akhir & Keseimbangan',
        kriteriaBagus: 'Kembali ke posisi jongkok dengan kedua kaki rapat dan tangan lurus ke depan untuk menjaga keseimbangan.',
        kriteriaCukup: 'Kembali berdiri namun goyah, atau harus ditopang tangan di lantai untuk tegak.',
        kriteriaKurang: 'Terjatuh terlentang, tidak mampu melakukan dorongan untuk jongkok.'
      }
    ]
  },
  {
    id: 'r-3',
    materi: 'Lari Cepat 50 Meter (Atletik)',
    kategori: 'Atletik',
    indikator: [
      {
        nama: 'Sikap Start (Sedia/Siap/Ya)',
        kriteriaBagus: 'Menggunakan start jongkok dengan pinggul lebih tinggi dari bahu, berat badan bertumpu pada lengan.',
        kriteriaCukup: 'Start jongkok tetapi berat badan di belakang atau kaki goyah.',
        kriteriaKurang: 'Melakukan start berdiri atau tidak memahami aba-aba dengan benar.'
      },
      {
        nama: 'Sikap Berlari',
        kriteriaBagus: 'Langkah kaki panjang dan cepat, paha diangkat tinggi, ayunan lengan 90 derajat rileks, badan condong depan.',
        kriteriaCukup: 'Langkah kaki pendek, badan terlalu tegak, ayunan lengan melintang di dada.',
        kriteriaKurang: 'Langkah lambat, berlari dengan tumit mendarat keras terlebih dahulu, wajah tegang.'
      }
    ]
  }
];

import { DEFAULT_AUTHENTIC_CP_DATA } from './utils/cpDataManager';

export const PREBUILT_CP_DATA: CpFase[] = DEFAULT_AUTHENTIC_CP_DATA;

