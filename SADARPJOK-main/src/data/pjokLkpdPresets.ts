import { InteractiveLkpdData } from '../types';

export interface PjokLkpdPreset {
  id: string;
  label: string;
  kategori: 'Fase A (Kelas 1-2)' | 'Fase B (Kelas 3-4)' | 'Fase C (Kelas 5-6)';
  fase: 'A' | 'B' | 'C';
  kelas: string;
  topikMateri: string;
  mataPelajaran: string;
  sekolah: string;
  guruPenyusun: string;
  alokasiWaktu: string;
  gayaDesain: string;
  sintaks: string;
  tujuanPembelajaran: string;
  dimensiProfil: string;
  kegiatanInti: string;
  rawText: string;
  iconName: string;
}

export const DEFAULT_PJOK_KALIMANTONG_LKPD: InteractiveLkpdData = {
  identitas: {
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kelas: '4',
    topikMateri: 'Variasi & Kombinasi Pola Gerak Dasar Lokomotor dan Manipulatif (Sepak Bola Mini)',
    guruPenyusun: 'Ahmad Rafsanjani, S.Pd.',
    sekolah: 'SD Negeri Kalimantong',
    alokasiWaktu: '2 x 35 Menit (1 Pertemuan)',
    gayaDesain: 'Edukatif Profesional (Navy & Emerald)',
    tanggalDokumen: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  },
  judulMenarik: 'Eksplorasi Gerak Sepak Bola Mini: Mengoper & Mengontrol Bola di Lapangan SD Negeri Kalimantong',
  sections: [
    {
      sectionTitle: 'Petunjuk Penggunaan LKPD & Keselamatan Praktik Fisik',
      icon: '📋',
      introText: 'Bacalah petunjuk dengan teliti sebelum beraktivitas di lapangan rumput SD Negeri Kalimantong:',
      contentBlocks: [
        {
          blockType: 'highlight',
          exactText: 'WAJIB: Kenakan seragam olahraga lengkap dan sepatu bertali, lakukan pemanasan dinamis 10 menit untuk mencegah kram otot, serta siapkan botol air minum pribadi untuk hidrasi pasca latihan.'
        },
        {
          blockType: 'text',
          exactText: 'LKPD ini dikerjakan secara berpasangan (teman sebangku/satu kelompok). Selama kegiatan, amati gerak temanmu secara jujur dan catat hasil observasi pada tabel yang tersedia dengan penuh sportivitas.'
        }
      ],
      visualDesignTip: 'Sediakan area catatan persiapan fisik dan nomor presensi kelompok.'
    },
    {
      sectionTitle: 'Tahap 1 (Memahami): Analisis Kunci Gerak Passing & Stopping',
      icon: '🧠',
      introText: 'Pelajari konsep mekanika gerak menendang dan menghentikan bola berikut:',
      contentBlocks: [
        {
          blockType: 'text',
          exactText: 'Dalam sepak bola mini, akurasi operan (passing) menentukan kelancaran serangan tim. Kaki tumpu diletakkan di samping bola berjarak sekitar 10–15 cm dengan lutut sedikit ditekuk. Kaki tendang ditarik ke belakang, pergelangan kaki dikunci dan diputar ke arah luar, lalu diayunkan tepat mengenai titik tengah bola.'
        },
        {
          blockType: 'illustrationPrompt',
          illustrationPrompt: 'Diagram posisi kaki tumpu sejajar bola, pergelangan kaki tendang diputar ke arah luar, dan arah laju bola mendatar menuju kaki kawan satu tim di lapangan rumput.'
        },
        {
          blockType: 'question',
          questionData: {
            id: 'q1',
            questionText: 'Mengapa saat mengoper bola mendatar ke kawan regu dianjurkan memakai kaki bagian dalam daripada ujung jari kaki? Jelaskan kaitannya dengan arah laju bola!',
            answerBoxStyle: 'speech_bubble',
            placeholderText: 'Kaki bagian dalam memiliki bidang perkenaan lebih luas sehingga laju bola lebih terarah...',
            score: '30'
          }
        },
        {
          blockType: 'question',
          questionData: {
            id: 'q2',
            questionText: 'Bagaimana posisi kaki dan badan saat menghentikan bola (trapping) mendatar agar bola tidak memantul liar menjauh dari penguasaanmu?',
            answerBoxStyle: 'dotted_box',
            placeholderText: 'Kaki penahan sedikit diangkat menyongsong bola lalu ditarik mengikuti laju bola (meredam gaya)...',
            score: '35'
          }
        },
        {
          blockType: 'question',
          questionData: {
            id: 'q3',
            questionText: 'Bagaimana kamu menunjukkan sikap sportivitas dan saling menghargai ketika teman satu timmu salah mengoper bola saat permainan berlangsung?',
            answerBoxStyle: 'ruled_lines',
            placeholderText: 'Memberikan semangat, tidak menyalahkan, dan membantu merebut kembali bola...',
            score: '35'
          }
        }
      ],
      visualDesignTip: 'Beri ikon bola sepak di sisi kiri pertanyaan nalar kritis.'
    },
    {
      sectionTitle: 'Tahap 2 (Mengaplikasikan): Praktik Berpasangan & Observasi Teman Sejawat',
      icon: '⚽',
      introText: 'Lakukan latihan berpasangan 10 kali operan bolak-balik dengan jarak 6 meter, lalu amati gerakan temanmu:',
      contentBlocks: [
        {
          blockType: 'text',
          exactText: 'Berikan tanda centang (✓) pada kolom jika temanmu sudah melakukan gerakan dengan benar, atau tanda silang (✗) jika masih perlu perbaikan:'
        },
        {
          blockType: 'table',
          tableData: {
            headers: [
              'No',
              'Nama Teman Praktik',
              'Kaki Tumpu di Samping Bola',
              'Perkenaan Kaki Bagian Dalam',
              'Akurasi Operan Tepat Sasaran',
              'Hasil Penilaian'
            ],
            rows: [
              ['1', 'Ahmad Fauzi', 'Tepat (✓)', 'Tepat (✓)', 'Tepat (✓)', 'Sangat Baik'],
              ['2', 'Budi Santoso', 'Tepat (✓)', 'Belum Tepat (✗)', 'Tepat (✓)', 'Cukup Baik'],
              ['3', 'Candra Kirana', 'Tepat (✓)', 'Tepat (✓)', 'Tepat (✓)', 'Sangat Baik'],
              ['4', 'Dwi Cahyo', 'Belum Tepat (✗)', 'Tepat (✓)', 'Belum Tepat (✗)', 'Perlu Bimbingan']
            ]
          }
        },
        {
          blockType: 'matching',
          matchingData: {
            leftLabel: 'Teknik Dasar PJOK',
            rightLabel: 'Fungsi Taktis di Lapangan',
            pairs: [
              {
                leftItem: 'Menggiring Bola (Dribbling)',
                rightItem: 'Membawa bola mendekati gawang lawan / mencari ruang kosong'
              },
              {
                leftItem: 'Mengoper Bola (Passing)',
                rightItem: 'Membagi bola secara cepat dan terarah ke kawan satu regu'
              },
              {
                leftItem: 'Menghentikan Bola (Control)',
                rightItem: 'Meredam kecepatan bola agar siap diumpan atau ditembak'
              },
              {
                leftItem: 'Menembak Bola (Shooting)',
                rightItem: 'Mengarahkan bola kencang ke arah gawang untuk mencetak gol'
              }
            ]
          }
        }
      ],
      visualDesignTip: 'Gunakan tabel bergaris kontras dengan baris selang-seling agar mudah dicatat dengan pensil di lapangan.'
    },
    {
      sectionTitle: 'Tahap 3 (Merefleksikan): Pembiasaan Sehat & Evaluasi Diri',
      icon: '🌟',
      introText: 'Tuliskan pengalaman belajarmu setelah berolahraga di lapangan SD Negeri Kalimantong:',
      contentBlocks: [
        {
          blockType: 'question',
          questionData: {
            id: 'ref1',
            questionText: 'Apa bagian tubuh yang paling terasa lelah saat melakukan latihan operan bola tadi, dan apa manfaat latihan pendinginan untuk ototmu?',
            answerBoxStyle: 'rounded_large',
            placeholderText: 'Tungkai kaki dan paha; pendinginan membantu mengembalikan aliran darah dan mencegah pegal...',
            score: 'Refleksi'
          }
        },
        {
          blockType: 'highlight',
          exactText: 'Pesan Guru PJOK: Jangan langsung minum air es secara berlebihan setelah berlari kencang. Istirahatlah sejenak, minum air putih bersuhu ruang, dan bersihkan tangan serta wajah setelah beraktivitas di lapangan.'
        }
      ]
    }
  ],
  selfReflectionChecklist: [
    'Saya mengikuti instruksi pemanasan dinamis dengan disiplin dan tertib di lapangan.',
    'Saya mampu mempraktikkan passing kaki bagian dalam secara terarah kepada teman.',
    'Saya mampu mengontrol bola mendatar menggunakan telapak atau kaki bagian dalam.',
    'Saya menghormati teman, menjunjung nilai sportivitas, dan tidak mengejek rekan yang keliru.',
    'Saya melakukan pendinginan dan menjaga kebersihan diri serta merapikan peralatan bola/cone.'
  ],
  penutupMotivasi: 'Tubuh yang Bugar Menghadirkan Jiwa yang Kuat dan Tangguh! Salam Olahraga dari Guru PJOK SD Negeri Kalimantong.'
};

export const PJOK_SD_PRESETS: PjokLkpdPreset[] = [
  {
    id: 'pjok-sepakbola-k4',
    label: 'Kelas 4: Sepak Bola Mini (Passing & Control)',
    kategori: 'Fase B (Kelas 3-4)',
    fase: 'B',
    kelas: '4',
    topikMateri: 'Variasi & Kombinasi Pola Gerak Dasar Lokomotor dan Manipulatif dalam Permainan Sepak Bola Mini',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    sekolah: 'SD Negeri Kalimantong',
    guruPenyusun: 'Ahmad Rafsanjani, S.Pd.',
    alokasiWaktu: '2 JP (2 x 35 Menit)',
    gayaDesain: 'Edukatif Profesional (Navy & Emerald)',
    sintaks: 'Teaching Games for Understanding (TGfU) / Pendekatan Taktis Bermain',
    tujuanPembelajaran: 'Peserta didik dapat menganalisis dan mempraktikkan variasi gerak dasar lokomotor (berlari, melompat) dan manipulatif (mengoper dan menghentikan bola) dengan koordinasi yang baik, disiplin, dan sportivitas di lapangan SD Negeri Kalimantong.',
    dimensiProfil: 'Gotong Royong, Mandiri, dan Bernalar Kritis',
    kegiatanInti: 
      '1. Pemanasan Game "Kucing Bola" di Lapangan SD Negeri Kalimantong (10 menit) untuk melatih reaksi gerak kaki.\n' +
      '2. Demonstrasi Guru: Posisi kaki tumpu sejajar bola, perkenaan kaki bagian dalam, dan cara meredam bola dengan telapak kaki.\n' +
      '3. Station 1 (Pos Akurasi): Latihan berpasangan passing mendatar 6 meter melewati celah 2 cone pembatas (10 kali pengulangan).\n' +
      '4. Station 2 (Pos Kontrol): Siswa bergantian melambungkan dan mengontrol bola jatuh dengan punggung kaki dan paha.\n' +
      '5. Mini Games Taktis (4 lawan 4): Bermain sepak bola mini tanpa kiper dengan aturan wajib 3 kali sentuhan sebelum menembak gawang.\n' +
      '6. Pendinginan & Refleksi: Pelemasan otot tungkai kaki, diskusi kesalahan gerak yang sering muncul, dan pengisian LKPD.',
    rawText: 
      'LEMBAR KERJA PESERTA DIDIK (LKPD) PJOK\n' +
      'Mata Pelajaran: Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)\n' +
      'Satuan Pendidikan: SD Negeri Kalimantong\n' +
      'Kelas / Fase: 4 SD / Fase B\n' +
      'Materi Pokok: Kombinasi Gerak Lokomotor & Manipulatif Sepak Bola Mini\n\n' +
      'Aktivitas 1: Analisis Gerak Dasar Passing Kaki Bagian Dalam\n' +
      'Saat melakukan operan bola mendatar, posisi kaki tumpu berada di samping bola sekitar 10-15 cm, lutut agak ditekuk, kaki tendang diayun dari belakang dengan pergelangan kaki diputar keluar.\n\n' +
      'Pertanyaan Analisis:\n' +
      '1. Mengapa mengoper dengan kaki bagian dalam menghasilkan arah bola yang lebih akurat daripada menggunakan ujung jari sepatu?\n' +
      '2. Bagaimana posisi badan dan kaki saat menerima operan bola agar bola tidak memantul jauh?\n' +
      '3. Apa tindakan sportivitasmu jika teman satu tim salah mengoper bola saat pertandingan?\n\n' +
      'Aktivitas 2: Tabel Observasi Praktik Berpasangan di Lapangan SD Negeri Kalimantong\n' +
      'Lakukan 10 kali operan berjarak 6 meter dan beri tanda centang pada lembar temanmu:\n' +
      'No | Nama Teman | Kaki Tumpu di Samping Bola | Perkenaan Kaki Bagian Dalam | Akurasi Bola Sampai ke Teman\n' +
      '1 | Ahmad Fauzi | Tepat | Tepat | Tepat\n' +
      '2 | Budi Santoso | Tepat | Belum Tepat | Tepat\n' +
      '3 | Candra Kirana | ... | ... | ...\n\n' +
      'Ayo Pasangkan Istilah dan Fungsinya:\n' +
      '- Menggiring (Dribbling) <--> Membawa bola melewati lawan ke ruang terbuka\n' +
      '- Mengoper (Passing) <--> Membagi bola secara akurat ke teman satu regu\n' +
      '- Mengontrol (Stopping) <--> Menghentikan dan menguasai laju bola\n\n' +
      'Refleksi Diri:\n' +
      '- Apakah saya sudah minum air putih yang cukup setelah berolahraga?\n' +
      '- Bagian tubuh mana yang paling bekerja keras dan butuh pelemasan?',
    iconName: 'Activity'
  },
  {
    id: 'pjok-lokomotor-k1',
    label: 'Kelas 1: Pola Gerak Dasar Lokomotor (Lari & Lompat)',
    kategori: 'Fase A (Kelas 1-2)',
    fase: 'A',
    kelas: '1',
    topikMateri: 'Pola Gerak Dasar Lokomotor Berlari Berkelok-kelok dan Melompati Rintangan Lapangan',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    sekolah: 'SD Negeri Kalimantong',
    guruPenyusun: 'Ahmad Rafsanjani, S.Pd.',
    alokasiWaktu: '2 JP (2 x 35 Menit)',
    gayaDesain: 'Ceria & Berwarna (Teal, Oranye, Kuning)',
    sintaks: 'Pembelajaran Tematik Eksploratif & Game-Based Learning',
    tujuanPembelajaran: 'Peserta didik kelas 1 dapat mengenali dan mempraktikkan gerak dasar berpindah tempat (berjalan, berlari lurus, berlari zig-zag, dan melompati bilah bambu/cone) dengan aman dan gembira di lapangan SD Negeri Kalimantong.',
    dimensiProfil: 'Mandiri dan Gotong Royong',
    kegiatanInti: 
      '1. Senam Pemanasan Ceria: Menirukan gerakan hewan lincah (Kelinci melompat, Kuda berlari) di lapangan rumput SD Negeri Kalimantong.\n' +
      '2. Eksplorasi Gerak 1: Siswa berjalan dan berlari lurus menyentuh garis batas cone secara bergiliran.\n' +
      '3. Eksplorasi Gerak 2: Siswa berlari zig-zag melewati 5 rintangan corong plastik warna-warni.\n' +
      '4. Permainan Estafet Ceria: Membawa bendera kecil sambil melompati rintangan busa lunak setinggi 15 cm.\n' +
      '5. Pendinginan: Bernyanyi bersama sambil mengayunkan tangan dan menarik napas dalam.',
    rawText: 
      'LEMBAR KERJA PESERTA DIDIK (LKPD) KELAS 1\n' +
      'Mata Pelajaran: PJOK\n' +
      'Sekolah: SD Negeri Kalimantong\n' +
      'Materi: Gerak Dasar Lokomotor (Jalan, Lari, Lompat Ceria)\n\n' +
      'Ayo Mengenal Gerak Berpindah Tempat!\n' +
      'Gerak lokomotor adalah gerakan yang membuat tubuh kita berpindah tempat, seperti berjalan kaki, berlari cepat, dan melompat tinggi.\n\n' +
      'Pertanyaan Bergambar & Menyenangkan:\n' +
      '1. Saat berlari cepat ke depan, bagaimana ayunan tanganmu? (Disilang / Diayun kuat ke depan dan belakang)\n' +
      '2. Kaki manakah yang digunakan untuk mendarat saat melompat agar lutut tidak sakit?\n' +
      '3. Apa yang harus kamu lakukan jika melihat temanmu terjatuh saat berlari di lapangan SD Negeri Kalimantong?\n\n' +
      'Ayo Cocokkan Gerakan dengan Gambarnya:\n' +
      '- Berjalan Santai <--> Melangkahkan kaki bergantian dengan tempo teratur\n' +
      '- Berlari Cepat <--> Melangkah lebar dan cepat dengan ayunan tangan kuat\n' +
      '- Melompat Rintangan <--> Menolak dengan dua kaki dan mendarat mengeper\n\n' +
      'Checklist Sikap Bintang Ceria:\n' +
      '- Aku antre giliran dengan tertib saat bermain estafet.\n' +
      '- Aku minum air putih dan tidak jajan sembarangan.',
    iconName: 'Zap'
  },
  {
    id: 'pjok-manipulatif-k2',
    label: 'Kelas 2: Gerak Manipulatif (Lempar Tangkap Bola)',
    kategori: 'Fase A (Kelas 1-2)',
    fase: 'A',
    kelas: '2',
    topikMateri: 'Pola Gerak Dasar Manipulatif Melempar dan Menangkap Bola Kecil Berpasangan',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    sekolah: 'SD Negeri Kalimantong',
    guruPenyusun: 'Ahmad Rafsanjani, S.Pd.',
    alokasiWaktu: '2 JP (2 x 35 Menit)',
    gayaDesain: 'Estetik Pastel (Mint, Peach, Lavender)',
    sintaks: 'Model Demonstrasi dan Praktik Terbimbing (Guided Practice)',
    tujuanPembelajaran: 'Peserta didik mampu memahami dan mempraktikkan keterampilan gerak melempar bola lambung, melempar mendatar, serta menangkap bola dengan dua tangan secara berpasangan dengan koordinasi mata-tangan yang baik.',
    dimensiProfil: 'Mandiri dan Bernalar Kritis',
    kegiatanInti: 
      '1. Pemanasan melempar balon berpasangan untuk melatih respon tangkapan tanpa rasa takut terkena bola.\n' +
      '2. Demonstrasi teknik melempar bola kasti dari bawah dan dari atas bahu ke arah teman.\n' +
      '3. Praktik berpasangan melempar dan menangkap bola berjarak 3 meter dengan 10 kali tangkapan.\n' +
      '4. Permainan lempar sasaran: Memasukkan bola ke dalam keranjang dari jarak 4 meter.\n' +
      '5. Refleksi dan pendinginan mengendurkan otot lengan.',
    rawText: 
      'LEMBAR KERJA PESERTA DIDIK (LKPD) KELAS 2 PJOK\n' +
      'Sekolah: SD Negeri Kalimantong\n' +
      'Topik: Gerak Manipulatif Melempar dan Menangkap Bola\n\n' +
      'Petunjuk Belajar:\n' +
      'Perhatikan arah datangnya bola dan gunakan kedua telapak tangan membentuk mangkuk saat menangkap bola.\n\n' +
      'Pertanyaan Latihan:\n' +
      '1. Mengapa pandangan mata harus selalu tertuju ke arah bola saat hendak menangkap bola lemparan kawan?\n' +
      '2. Apa yang terjadi jika jari-jari tanganmu kaku saat menangkap bola yang meluncur cepat?\n' +
      '3. Bagaimana cara melempar bola agar mudah ditangkap oleh kawanmu?\n\n' +
      'Tabel Latihan Menangkap Bola Berpasangan (10 Kali Lemparan):\n' +
      'No | Nama Pasangan | Tangkapan Berhasil | Tangkapan Lepas | Nilai Bintang\n' +
      '1 | Latihan Jarak 2 Meter | 8 | 2 | ⭐⭐⭐⭐\n' +
      '2 | Latihan Jarak 3 Meter | ... | ... | ...\n\n' +
      'Hubungkan Gerakan Lemparan:\n' +
      '- Lemparan Melambung <--> Arah bola ke atas melewati rintangan\n' +
      '- Lemparan Mendatar <--> Arah bola lurus setinggi dada teman\n' +
      '- Lemparan Menyusur Tanah <--> Bola digelindingkan di atas rumput',
    iconName: 'Target'
  },
  {
    id: 'pjok-voli-k3',
    label: 'Kelas 3: Bola Voli Mini (Passing Bawah)',
    kategori: 'Fase B (Kelas 3-4)',
    fase: 'B',
    kelas: '3',
    topikMateri: 'Kombinasi Gerak Dasar Non-Lokomotor dan Manipulatif Passing Bawah Bola Voli Mini',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    sekolah: 'SD Negeri Kalimantong',
    guruPenyusun: 'Ahmad Rafsanjani, S.Pd.',
    alokasiWaktu: '2 JP (2 x 35 Menit)',
    gayaDesain: 'Modern & Clean (Indigo & Off-White)',
    sintaks: 'Problem Based Learning (PBL) dalam Keterampilan Gerak Net',
    tujuanPembelajaran: 'Peserta didik dapat mengidentifikasi sikap awal, perkenaan lengan bawah, dan ayunan tubuh saat melakukan passing bawah bola voli mini serta mempraktikkannya dalam formasi lingkaran dengan tepat.',
    dimensiProfil: 'Gotong Royong dan Mandiri',
    kegiatanInti: 
      '1. Pemanasan dinamis dengan permainan tepuk bola voli balon di lapangan SD Negeri Kalimantong.\n' +
      '2. Penjelasan guru tentang kaitan kedua tangan (ibu jari sejajar) dan perkenaan bola di atas pergelangan tangan.\n' +
      '3. Latihan passing bawah perorangan (memantulkan bola ke atas sendiri sebanyak 5 kali berturut-turut).\n' +
      '4. Latihan passing bawah berpasangan melewati net mini atau tali yang dibentangkan setinggi 1,8 meter.\n' +
      '5. Mini game 3 lawan 3 dengan aturan bola boleh memantul satu kali di lantai sebelum dipassing.',
    rawText: 
      'LEMBAR KERJA PESERTA DIDIK (LKPD) PJOK KELAS 3\n' +
      'Sekolah: SD Negeri Kalimantong\n' +
      'Topik: Keterampilan Passing Bawah Permainan Bola Voli Mini\n\n' +
      'Kunci Gerak Passing Bawah:\n' +
      '1. Kaki dibuka selebar bahu, lutut sedikit ditekuk seperti posisi jongkok ringan.\n' +
      '2. Kedua tangan dirapatkan dan lurus ke depan, kedua ibu jari sejajar.\n' +
      '3. Perkenaan bola tepat pada bagian lengan bawah di atas pergelangan tangan.\n\n' +
      'Pertanyaan Pemahaman:\n' +
      '1. Apa yang akan terjadi jika bola voli mengenai tepat di ujung jari-jari tanganmu saat passing bawah?\n' +
      '2. Mengapa lutut harus mengeper (ditekuk lalu diluruskan) saat bola menyentuh lengan?\n' +
      '3. Bagaimana cara berkomunikasi dengan teman regu agar tidak saling bertabrakan saat berebut bola voli?\n\n' +
      'Ayo Pasangkan Istilah Voli:\n' +
      '- Servis Bawah <--> Pukulan awal untuk memulai jalannya permainan voli\n' +
      '- Passing Bawah <--> Menerima bola servis atau operan rendah dari kawan\n' +
      '- Passing Atas <--> Menerima atau mengumpan bola yang berada di atas dahi',
    iconName: 'Shield'
  },
  {
    id: 'pjok-kebugaran-k4',
    label: 'Kelas 4: Kebugaran Jasmani (Sirkuit Daya Tahan & Kelincahan)',
    kategori: 'Fase B (Kelas 3-4)',
    fase: 'B',
    kelas: '4',
    topikMateri: 'Aktivitas Kebugaran Jasmani: Sirkuit Pelatihan Daya Tahan Jantung-Paru dan Kelincahan',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    sekolah: 'SD Negeri Kalimantong',
    guruPenyusun: 'Ahmad Rafsanjani, S.Pd.',
    alokasiWaktu: '2 JP (2 x 35 Menit)',
    gayaDesain: 'Edukatif Profesional (Navy & Emerald)',
    sintaks: 'Circuit Training (Pelatihan Sirkuit Pos Terpadu)',
    tujuanPembelajaran: 'Peserta didik dapat memahami konsep kebugaran jasmani serta mampu melakukan serangkaian aktivitas pos sirkuit (lari bolak-balik shuttle run, jumping jack, push-up modifikasi dinding, dan sit-up santai) dengan teratur.',
    dimensiProfil: 'Mandiri dan Bernalar Kritis',
    kegiatanInti: 
      '1. Pemeriksaan denyut nadi istirahat selama 15 detik dikalikan 4 di pinggir lapangan SD Negeri Kalimantong.\n' +
      '2. Pemanasan statis dan dinamis dipimpin ketua kelas.\n' +
      '3. Penjelasan 4 Pos Sirkuit Kebugaran: Pos 1 (Shuttle Run 4x5 meter), Pos 2 (Jumping Jack 15 detik), Pos 3 (Step-up tangga/bangku mini), Pos 4 (Kelenturan cium lutut).\n' +
      '4. Siswa bergerak berotasi antar pos setiap berbunyi peluit guru (interval 30 detik kerja, 30 detik istirahat).\n' +
      '5. Pengukuran denyut nadi kerja dan pendinginan pernapasan relaksasi.',
    rawText: 
      'LEMBAR KERJA PESERTA DIDIK (LKPD) KEBUGARAN JASMANI\n' +
      'Satuan Pendidikan: SD Negeri Kalimantong\n' +
      'Kelas / Fase: 4 SD / Fase B\n' +
      'Materi: Sirkuit Kebugaran Jasmani untuk Daya Tahan & Kelincahan\n\n' +
      'Apa itu Kebugaran Jasmani?\n' +
      'Kebugaran jasmani adalah kemampuan tubuh kita untuk melakukan aktivitas sehari-hari tanpa merasakan kelelahan yang berlebihan, dan masih memiliki cadangan tenaga untuk bermain dan belajar.\n\n' +
      'Pertanyaan Evaluasi Diri:\n' +
      '1. Mengapa setelah berlari cepat bolak-balik detak jantungmu berdegup jauh lebih kencang dibanding saat duduk santai?\n' +
      '2. Apa manfaat memiliki otot kaki yang lincah dan kuat saat bermain di halaman sekolah?\n' +
      '3. Sebutkan 3 makanan sehat bergizi seimbang yang mendukung stamina tubuhmu tetap bugar!\n\n' +
      'Catatan Data Sirkuit Latihan Siswa:\n' +
      'Pos Latihan | Target Waktu/Gerakan | Hasil Capaianku | Tingkat Kelelahan (Ringan/Sedang/Berat)\n' +
      'Pos 1: Shuttle Run | 4 x 5 Meter | ... Detik | ...\n' +
      'Pos 2: Jumping Jack | 15 Kali Gerak | ... Kali | ...\n' +
      'Pos 3: Naik Turun Bangku | 10 Kali | ... Kali | ...\n' +
      'Pos 4: Kelenturan Duduk | Menahan 10 Hitungan | Berhasil | ...',
    iconName: 'Flame'
  },
  {
    id: 'pjok-basket-k5',
    label: 'Kelas 5: Bola Basket Mini (Dribble & Chest Pass)',
    kategori: 'Fase C (Kelas 5-6)',
    fase: 'C',
    kelas: '5',
    topikMateri: 'Kombinasi Pola Gerak Manipulatif dan Lokomotor Dribbling serta Chest Pass Bola Basket Mini',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    sekolah: 'SD Negeri Kalimantong',
    guruPenyusun: 'Ahmad Rafsanjani, S.Pd.',
    alokasiWaktu: '2 JP (2 x 35 Menit)',
    gayaDesain: 'Modern & Clean (Indigo & Off-White)',
    sintaks: 'Teaching Games for Understanding (TGfU) Olahraga Invasi',
    tujuanPembelajaran: 'Peserta didik kelas 5 dapat menganalisis dan mempraktikkan keterampilan menggiring bola setinggi pinggang dan melakukan operan dada (chest pass) lurus ke arah kawan regu dengan koordinasi dan kerja sama tim yang solid.',
    dimensiProfil: 'Gotong Royong dan Bernalar Kritis',
    kegiatanInti: 
      '1. Pemanasan dribble bola basket di tempat dengan tangan kanan dan kiri secara bergantian di lapangan semen/rumput SD Negeri Kalimantong.\n' +
      '2. Demonstrasi dorongan kedua tangan dari depan dada menuju dada kawan satu tim dengan satu langkah kaki maju.\n' +
      '3. Latihan chest pass berpasangan 5 meter dengan target dada kawan (10 kali lemparan).\n' +
      '4. Latihan kombinasi: Dribble 5 meter melewati rintangan cone lalu melakukan chest pass kepada kawan yang berlari membuka ruang.\n' +
      '5. Game 3 on 3 bola basket mini setengah lapangan dengan aturan tanpa boleh lari membawa bola tanpa dribble.',
    rawText: 
      'LEMBAR KERJA PESERTA DIDIK (LKPD) BOLA BASKET MINI\n' +
      'Satuan Pendidikan: SD Negeri Kalimantong\n' +
      'Kelas / Fase: 5 SD / Fase C\n' +
      'Materi: Keterampilan Dribble & Chest Pass Permainan Invasi\n\n' +
      'Aktivitas Teori dan Praktik:\n' +
      'Chest pass adalah operan setinggi dada yang paling efektif untuk memindahkan bola dengan cepat kepada kawan yang bebas dari kawalan lawan.\n\n' +
      'Pertanyaan Nalar Taktis:\n' +
      '1. Mengapa bola basket dipantulkan menggunakan jari-jari tangan (bukan dipukul dengan telapak tangan) saat melakukan dribbling?\n' +
      '2. Mengapa saat melakukan chest pass, salah satu kaki harus melangkah ke depan mengikuti dorongan tangan?\n' +
      '3. Apa yang harus dilakukan pemain penyerang jika ruang operan dada ditutup rapat oleh pemain lawan yang tinggi?\n\n' +
      'Hubungkan Jenis Operan Bola Basket:\n' +
      '- Chest Pass (Operan Dada) <--> Operan lurus kencang setinggi dada teman\n' +
      '- Bounce Pass (Operan Pantul) <--> Memantulkan bola 2/3 jarak ke arah teman untuk melewati lawan\n' +
      '- Overhead Pass (Operan Atas Kepala) <--> Melempar bola dari atas kepala untuk operan jauh',
    iconName: 'Award'
  },
  {
    id: 'pjok-sprint-k5',
    label: 'Kelas 5: Atletik Lari Cepat (Sprint 50m & Start Jongkok)',
    kategori: 'Fase C (Kelas 5-6)',
    fase: 'C',
    kelas: '5',
    topikMateri: 'Keterampilan Dasar Atletik Nomor Lari Jarak Pendek (Sprint 50 Meter) dan Aba-aba Start Jongkok',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    sekolah: 'SD Negeri Kalimantong',
    guruPenyusun: 'Ahmad Rafsanjani, S.Pd.',
    alokasiWaktu: '2 JP (2 x 35 Menit)',
    gayaDesain: 'Edukatif Profesional (Navy & Emerald)',
    sintaks: 'Pendekatan Saintifik & Demonstrasi Berulang',
    tujuanPembelajaran: 'Peserta didik dapat memahami posisi aba-aba start jongkok (Bersedia, Siap, Ya/Bunyi Peluit) serta mampu mempraktikkan lari sprint 50 meter dengan koordinasi ayunan tangan, langkah kaki cepat, dan posisi badan condong ke depan di lintasan lari SD Negeri Kalimantong.',
    dimensiProfil: 'Mandiri dan Bernalar Kritis',
    kegiatanInti: 
      '1. Pemanasan statis dan dinamis peregangan otot hamstring, paha, betis, dan pergelangan kaki.\n' +
      '2. Penjelasan dan demonstrasi posisi lutut dan jari tangan (membentuk huruf V terbalik di belakang garis start) pada aba-aba Bersedia, Siap, dan Ya.\n' +
      '3. Latihan reaksi start dari berbagai posisi (duduk, telungkup, jongkok) merespons bunyi peluit guru.\n' +
      '4. Praktik lari cepat 50 meter di lintasan lari lapangan SD Negeri Kalimantong menggunakan stopwatch.\n' +
      '5. Pendinginan pernapasan dan pencatatan catatan waktu lari pada LKPD.',
    rawText: 
      'LEMBAR KERJA PESERTA DIDIK (LKPD) ATLETIK LARI CEPAT\n' +
      'Satuan Pendidikan: SD Negeri Kalimantong\n' +
      'Kelas / Fase: 5 SD / Fase C\n' +
      'Topik: Lari Jarak Pendek 50 Meter & Posisi Start Jongkok\n\n' +
      'Tahapan Aba-Aba Start Jongkok:\n' +
      '1. "Bersedia": Kaki depan di belakang garis, lutut kaki belakang menempel tanah, jari tangan membentuk V terbalik di belakang garis start.\n' +
      '2. "Siap": Pinggul diangkat sedikit lebih tinggi dari bahu, berat badan bertumpu pada kedua tangan, pandangan ke bawah.\n' +
      '3. "Ya / Peluit": Menolak kuat dengan kedua kaki, badan melesat ke depan dan tidak langsung tegak.\n\n' +
      'Pertanyaan Uji Pemahaman:\n' +
      '1. Mengapa pada lari jarak pendek (sprint) digunakan start jongkok bukan start berdiri?\n' +
      '2. Apa akibatnya jika seorang pelari langsung menegakkan badannya tepat setelah aba-aba "Ya"?\n' +
      '3. Bagaimana sikap dada dan langkah kaki saat mendekati dan melewati garis finish?\n\n' +
      'Tabel Catatan Waktu Lari Sprint 50 Meter:\n' +
      'No | Nama Siswa Pelari | Percobaan 1 (Detik) | Percobaan 2 (Detik) | Waktu Terbaik | Predikat Kecepatan\n' +
      '1 | Budi Santoso | 8.8 s | 8.5 s | 8.5 s | Sangat Cepat\n' +
      '2 | Dwi Cahyo | 9.4 s | 9.1 s | 9.1 s | Baik\n' +
      '3 | ... | ... | ... | ... | ...',
    iconName: 'Zap'
  },
  {
    id: 'pjok-senam-k6',
    label: 'Kelas 6: Senam Lantai (Guling Depan / Forward Roll)',
    kategori: 'Fase C (Kelas 5-6)',
    fase: 'C',
    kelas: '6',
    topikMateri: 'Rangkaian Pola Gerak Dominan Senam Lantai Ketangkasan (Guling Depan) dengan Keamanan Matras',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    sekolah: 'SD Negeri Kalimantong',
    guruPenyusun: 'Ahmad Rafsanjani, S.Pd.',
    alokasiWaktu: '2 JP (2 x 35 Menit)',
    gayaDesain: 'Modern & Clean (Indigo & Off-White)',
    sintaks: 'Pendekatan Bertahap Berbasis Keselamatan (Safety First In Gymnastics)',
    tujuanPembelajaran: 'Peserta didik dapat menganalisis urutan gerak guling depan (sikap awal jongkok, penempatan telapak tangan, tengkuk menyentuh matras, berguling membulat, dan sikap akhir jongkok seimbang) serta mempraktikkannya dengan aman dan percaya diri di atas matras senam SD Negeri Kalimantong.',
    dimensiProfil: 'Mandiri dan Bernalar Kritis',
    kegiatanInti: 
      '1. Pemanasan khusus kelenturan leher, pergelangan tangan, pinggang, dan punggung untuk menyiapkan otot.\n' +
      '2. Latihan pengkondisian berguling seperti perahu goyang di atas matras senam untuk melatih punggung membulat.\n' +
      '3. Demonstrasi guru: Dagu wajib ditempelkan rapat ke dada (tengkuk yang menyentuh matras, bukan ubun-ubun kepala!).\n' +
      '4. Praktik guling depan dengan pendampingan dan penjagaan keselamatan (spotting) oleh guru PJOK.\n' +
      '5. Pengamatan berpasangan terhadap kelancaran putaran guling depan teman dan pendinginan pelemasan tulang belakang.',
    rawText: 
      'LEMBAR KERJA PESERTA DIDIK (LKPD) SENAM LANTAI\n' +
      'Satuan Pendidikan: SD Negeri Kalimantong\n' +
      'Kelas / Fase: 6 SD / Fase C\n' +
      'Materi: Pola Gerak Dominan Guling Depan (Forward Roll) Senam Ketangkasan\n\n' +
      'PENTING - KESELAMATAN NOMOR SATU (SAFETY FIRST):\n' +
      'Bagian kepala yang pertama kali menyentuh matras adalah TENGKUK (leher bagian belakang), BUKAN ubun-ubun kepala. Dagu harus selalu ditarik rapat menempel ke dada!\n\n' +
      'Pertanyaan Analisis Mekanika Gerak:\n' +
      '1. Mengapa tubuh harus ditekuk membulat saat berguling ke depan di atas matras?\n' +
      '2. Apa bahayanya jika siswa memaksakan berguling dengan menumpu pada ubun-ubun kepala?\n' +
      '3. Bagaimana sikap kedua tangan saat melakukan dorongan untuk mendarat kembali ke posisi jongkok seimbang?\n\n' +
      'Checklist Penilaian Praktik Teman (Beri Centang Sesuai Pengamatan):\n' +
      'No | Indikator Gerak | Terlaksana (✓) | Belum Terlaksana (✗) | Catatan Kerapian\n' +
      '1 | Kedua tangan menumpu kuat selebar bahu di matras | ... | ... | ...\n' +
      '2 | Dagu menempel rapat di dada saat mengguling | ... | ... | ...\n' +
      '3 | Tengkuk menyentuh matras dan punggung membulat | ... | ... | ...\n' +
      '4 | Mendarat kembali dengan posisi jongkok seimbang | ... | ... | ...',
    iconName: 'Compass'
  },
  {
    id: 'pjok-kesehatan-k6',
    label: 'Kelas 6: Kesehatan & Pencegahan Cedera (Metode RICE)',
    kategori: 'Fase C (Kelas 5-6)',
    fase: 'C',
    kelas: '6',
    topikMateri: 'Pola Hidup Sehat dan Pertolongan Pertama Cedera Olahraga Ringan dengan Metode R.I.C.E.',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    sekolah: 'SD Negeri Kalimantong',
    guruPenyusun: 'Ahmad Rafsanjani, S.Pd.',
    alokasiWaktu: '2 JP (2 x 35 Menit)',
    gayaDesain: 'Estetik Pastel (Mint, Peach, Lavender)',
    sintaks: 'Studi Kasus Kontekstual & Simulasi Praktik UKS Sekolah',
    tujuanPembelajaran: 'Peserta didik dapat memahami konsep penanganan pertama pada cedera memar dan terkilir (keseleo) saat berolahraga menggunakan prinsip R.I.C.E. (Rest, Ice, Compression, Elevation) serta mensimulasikannya dengan terampil.',
    dimensiProfil: 'Bernalar Kritis, Mandiri, dan Gotong Royong',
    kegiatanInti: 
      '1. Apersepsi: Guru menceritakan situasi nyata seorang siswa terkilir pergelangan kakinya saat bermain sepak bola di lapangan SD Negeri Kalimantong.\n' +
      '2. Penjelasan 4 Langkah Emas Pertolongan Pertama: Rest (Istirahatkan), Ice (Kompres Es), Compression (Balut Tekan Elastis), Elevation (Tinggikan posisi kaki lebih tinggi dari jantung).\n' +
      '3. Simulasi Praktik: Siswa berpasangan mempraktikkan cara membalut pergelangan kaki menggunakan perban elastis dan kantong es.\n' +
      '4. Diskusi hal yang DILARANG saat cedera baru terjadi (H.A.R.M. - Heat/Panas, Alcohol, Running, Massage/Pijat paksa).\n' +
      '5. Evaluasi dan pengisian lembar kerja studi kasus di kelas.',
    rawText: 
      'LEMBAR KERJA PESERTA DIDIK (LKPD) KESEHATAN PJOK\n' +
      'Satuan Pendidikan: SD Negeri Kalimantong\n' +
      'Kelas / Fase: 6 SD / Fase C\n' +
      'Materi: Pertolongan Pertama Cedera Olahraga (Prinsip R.I.C.E.)\n\n' +
      'Prinsip Pertolongan Pertama Cedera Akut (R.I.C.E.):\n' +
      'Saat terjadi cedera terkilir (sprain) atau memar akibat benturan fisik olahraga, lakukan langkah berikut dalam 24-48 jam pertama:\n' +
      'R = REST (Istirahatkan bagian tubuh yang sakit)\n' +
      'I = ICE (Kompres dengan es batu berbalut kain selama 15-20 menit)\n' +
      'C = COMPRESSION (Balut dengan perban elastis tapi jangan terlalu kencang)\n' +
      'E = ELEVATION (Posisikan bagian cedera lebih tinggi dari posisi jantung)\n\n' +
      'Studi Kasus Nalar Kritis:\n' +
      '1. Saat bermain kasti di halaman SD Negeri Kalimantong, pergelangan kaki Budi terkilir dan mulai membengkak. Temannya berniat memijat pergelangan kaki Budi dengan keras. Apakah tindakan memijat itu tepat? Jelaskan alasanmu berdasarkan ilmu kesehatan!\n' +
      '2. Mengapa kompres es tidak boleh ditempelkan langsung tanpa kain pelapis ke kulit yang cedera?\n' +
      '3. Mengapa posisi kaki yang bengkak perlu ditinggikan saat korban sedang berbaring istirahat?\n\n' +
      'Hubungkan Huruf R-I-C-E dengan Tindakannya:\n' +
      '- R (Rest) <--> Menghentikan aktivitas fisik agar cedera tidak bertambah parah\n' +
      '- I (Ice) <--> Mengurangi pembengkakan dan meredakan rasa nyeri\n' +
      '- C (Compression) <--> Mencegah penumpukan cairan darah berlebih pada sendi\n' +
      '- E (Elevation) <--> Membantu aliran darah kembali ke jantung untuk kurangi bengkak',
    iconName: 'Heart'
  }
];

export function generateLkpdFromPreset(preset: PjokLkpdPreset): InteractiveLkpdData {
  if (preset.id === 'pjok-sepakbola-k4') {
    return DEFAULT_PJOK_KALIMANTONG_LKPD;
  }

  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Custom tailoring per topic
  if (preset.id === 'pjok-lokomotor-k1') {
    return {
      identitas: {
        mataPelajaran: preset.mataPelajaran,
        kelas: preset.kelas,
        topikMateri: preset.topikMateri,
        guruPenyusun: preset.guruPenyusun,
        sekolah: preset.sekolah,
        alokasiWaktu: preset.alokasiWaktu,
        gayaDesain: preset.gayaDesain,
        tanggalDokumen: dateStr
      },
      judulMenarik: 'Petualangan Gerak Lokomotor Ceria di Lapangan SD Negeri Kalimantong',
      sections: [
        {
          sectionTitle: 'Petunjuk Guru & Keselamatan Lapangan',
          icon: '🏃‍♂️',
          introText: 'Ayo anak-anak hebat kelas 1, siapkan diri kalian untuk berolahraga dengan ceria:',
          contentBlocks: [
            {
              blockType: 'highlight',
              exactText: 'Pesan Keselamatan: Berlarilah di dalam lintasan yang sudah diberi batas bendera/cone. Jika terjatuh, segera berdiri atau beri tahu guru PJOK.'
            },
            {
              blockType: 'text',
              exactText: 'Setiap anak akan mencoba berjalan jinjit, berlari cepat, dan melompati balok lunak secara bergantian.'
            }
          ]
        },
        {
          sectionTitle: 'Tahap Memahami: Ragam Gerak Berpindah Tempat',
          icon: '🌟',
          introText: 'Amati gambar dan jawab pertanyaan seru di bawah ini:',
          contentBlocks: [
            {
              blockType: 'illustrationPrompt',
              illustrationPrompt: 'Kartun anak SD memakai seragam olahraga hijau toska sedang melompati rintangan cone dan tersenyum gembira di halaman sekolah yang asri.'
            },
            {
              blockType: 'question',
              questionData: {
                id: 'k1-q1',
                questionText: 'Saat kamu berlari mengejar bola, bagaimana posisi kedua tanganmu yang benar?',
                answerBoxStyle: 'speech_bubble',
                placeholderText: 'Tangan ditekuk di samping badan dan diayunkan maju mundur...',
                score: '50'
              }
            },
            {
              blockType: 'question',
              questionData: {
                id: 'k1-q2',
                questionText: 'Bagaimana cara mendarat yang aman setelah melompat agar kakimu tidak sakit?',
                answerBoxStyle: 'dotted_box',
                placeholderText: 'Mendarat dengan dua kaki bersamaan dan lutut ditekuk mengeper...',
                score: '50'
              }
            }
          ]
        },
        {
          sectionTitle: 'Tahap Mengaplikasikan: Sirkuit Gerak Ceria & Cocokkan Gambar',
          icon: '🎯',
          contentBlocks: [
            {
              blockType: 'matching',
              matchingData: {
                leftLabel: 'Nama Gerakan',
                rightLabel: 'Cara Melakukan',
                pairs: [
                  { leftItem: 'Lari Zig-Zag', rightItem: 'Berlari belok-belok melewati rintangan cone' },
                  { leftItem: 'Jalan Jinjit', rightItem: 'Melangkah pelan dengan tumpuan ujung jari kaki' },
                  { leftItem: 'Lompat Kodok', rightItem: 'Menolak dengan dua kaki lalu mendarat jongkok' }
                ]
              }
            },
            {
              blockType: 'table',
              tableData: {
                headers: ['No', 'Tantangan Gerak', 'Bisa Sendiri', 'Perlu Bantuan Guru'],
                rows: [
                  ['1', 'Berlari lurus 15 meter tanpa berhenti', 'Bisa (✓)', '-'],
                  ['2', 'Melompati bilah bambu 15 cm', 'Bisa (✓)', '-'],
                  ['3', 'Berlari zig-zag 4 rintangan corong', 'Bisa (✓)', '-']
                ]
              }
            }
          ]
        }
      ],
      selfReflectionChecklist: [
        'Saya senang berolahraga bersama teman-teman di lapangan SD Negeri Kalimantong.',
        'Saya mau mendengarkan aba-aba peluit dari Pak Guru PJOK.',
        'Saya selalu tertib menunggu giliran dan tidak mendorong kawan.'
      ],
      penutupMotivasi: 'Bermain Sambil Berolahraga Membuat Badan Sehat dan Senang! Semangat Siswa Kelas 1 SD Negeri Kalimantong!'
    };
  }

  if (preset.id === 'pjok-kebugaran-k4') {
    return {
      identitas: {
        mataPelajaran: preset.mataPelajaran,
        kelas: preset.kelas,
        topikMateri: preset.topikMateri,
        guruPenyusun: preset.guruPenyusun,
        sekolah: preset.sekolah,
        alokasiWaktu: preset.alokasiWaktu,
        gayaDesain: preset.gayaDesain,
        tanggalDokumen: dateStr
      },
      judulMenarik: 'Tantangan Sirkuit Kebugaran Jasmani: Mengukur Stamina & Kelincahan di SD Negeri Kalimantong',
      sections: [
        {
          sectionTitle: 'Petunjuk Pelaksanaan Pos Sirkuit Kebugaran',
          icon: '⏱️',
          introText: 'Ikuti alur rotasi 4 pos latihan yang telah disusun Guru PJOK di lapangan:',
          contentBlocks: [
            {
              blockType: 'highlight',
              exactText: 'Sirkuit ini melatih 2 komponen utama kebugaran jasmani: Daya Tahan Kardiorespirasi (Jantung-Paru) dan Kelincahan (Agility). Lakukan secara jujur sesuai kemampuanmu!'
            }
          ]
        },
        {
          sectionTitle: 'Tahap 1: Konsep Detak Jantung & Stamina',
          icon: '❤️',
          contentBlocks: [
            {
              blockType: 'question',
              questionData: {
                id: 'keb-q1',
                questionText: 'Hitung denyut nadimu di pergelangan tangan selama 15 detik lalu kalikan 4. Berapa denyut nadi istirahatmu sebelum sirkuit dimulai?',
                answerBoxStyle: 'rounded_large',
                placeholderText: 'Contoh: 20 denyut x 4 = 80 detak per menit...',
                score: '25'
              }
            },
            {
              blockType: 'question',
              questionData: {
                id: 'keb-q2',
                questionText: 'Mengapa tubuh kita mengeluarkan keringat dan bernapas lebih cepat saat melakukan shuttle run?',
                answerBoxStyle: 'speech_bubble',
                placeholderText: 'Karena otot membutuhkan lebih banyak oksigen sehingga jantung memompa darah lebih cepat...',
                score: '35'
              }
            }
          ]
        },
        {
          sectionTitle: 'Tahap 2: Lembar Rekam Data Hasil Sirkuit Kebugaran',
          icon: '📊',
          introText: 'Catat capaian masing-masing pos pada tabel di bawah ini:',
          contentBlocks: [
            {
              blockType: 'table',
              tableData: {
                headers: ['Pos Latihan', 'Jenis Aktivitas Fisik', 'Target Gerak', 'Hasil Saya', 'Status Evaluasi'],
                rows: [
                  ['Pos 1', 'Lari Bolak-Balik (Shuttle Run)', '4 x 5 Meter', '12.4 Detik', 'Sangat Lincah'],
                  ['Pos 2', 'Jumping Jacks (Lompat Bintang)', '15 Kali Hitungan', '15 Kali', 'Tuntas'],
                  ['Pos 3', 'Modifikasi Push-Up Bangku', '10 Kali Dorongan', '10 Kali', 'Kuat'],
                  ['Pos 4', 'Kelenturan Duduk Cium Lutut', 'Tahan 10 Detik', 'Tercapai', 'Lentur']
                ]
              }
            },
            {
              blockType: 'matching',
              matchingData: {
                leftLabel: 'Komponen Kebugaran',
                rightLabel: 'Bentuk Latihan Penguji',
                pairs: [
                  { leftItem: 'Daya Tahan Jantung (Cardio)', rightItem: 'Lari jogging mengelilingi lapangan 3 putaran' },
                  { leftItem: 'Kelincahan (Agility)', rightItem: 'Lari zig-zag bolak-balik menyentuh cone' },
                  { leftItem: 'Kekuatan Otot (Strength)', rightItem: 'Push-up dan sit-up bertahap' },
                  { leftItem: 'Kelenturan (Flexibility)', rightItem: 'Peregangan statis mencium lutut' }
                ]
              }
            }
          ]
        },
        {
          sectionTitle: 'Tahap 3: Refleksi Pola Hidup Sehat Siswa',
          icon: '🥗',
          contentBlocks: [
            {
              blockType: 'question',
              questionData: {
                id: 'keb-ref',
                questionText: 'Tuliskan 3 kebiasaan sehat sehari-hari yang akan kamu lakukan di rumah untuk menjaga tubuh tetap bugar dan bersemangat belajar!',
                answerBoxStyle: 'ruled_lines',
                placeholderText: '1. Tidur teratur 8 jam, 2. Rajin minum air putih dan kurangi minuman manis, 3. Bersepeda/berjalan kaki...',
                score: '40'
              }
            }
          ]
        }
      ],
      selfReflectionChecklist: [
        'Saya menyelesaikan seluruh 4 pos sirkuit kebugaran dengan antusias dan pantang menyerah.',
        'Saya jujur mencatat hasil waktu dan repetisi tanpa melebih-lebihkan data.',
        'Saya mematuhi prinsip pendinginan dan peregangan otot pasca sirkuit.',
        'Saya bertekad menjaga asupan makanan bergizi seimbang di rumah dan sekolah.'
      ],
      penutupMotivasi: 'Kebugaran Bukan Hadiah, Melainkan Hasil Disiplin Berlatih! Tetap Kuat dan Sehat Bersama Guru PJOK SD Negeri Kalimantong.'
    };
  }

  // Default fallback builder for other presets (e.g. basket, atletik, senam, kesehatan)
  return {
    identitas: {
      mataPelajaran: preset.mataPelajaran,
      kelas: preset.kelas,
      topikMateri: preset.topikMateri,
      guruPenyusun: preset.guruPenyusun,
      sekolah: preset.sekolah,
      alokasiWaktu: preset.alokasiWaktu,
      gayaDesain: preset.gayaDesain,
      tanggalDokumen: dateStr
    },
    judulMenarik: `${preset.topikMateri} - Pembelajaran PJOK Terintegrasi SD Negeri Kalimantong`,
    sections: [
      {
        sectionTitle: 'Petunjuk Belajar & Keselamatan Lapangan',
        icon: '📋',
        introText: 'Bacalah petunjuk dengan teliti sebelum beraktivitas di lingkungan SD Negeri Kalimantong:',
        contentBlocks: [
          {
            blockType: 'highlight',
            exactText: `Materi ${preset.topikMateri} ini menuntut konsentrasi, koordinasi tubuh yang baik, dan kepatuhan pada aturan keselamatan. Patuhi setiap aba-aba guru PJOK demi kenyamanan bersama.`
          },
          {
            blockType: 'text',
            exactText: preset.kegiatanInti
          }
        ]
      },
      {
        sectionTitle: 'Tahap 1: Pendalaman Konsep & Uji Nalar Kritis',
        icon: '🧠',
        introText: 'Jawablah pertanyaan analisis gerak berdasarkan pengamatan praktik berikut:',
        contentBlocks: [
          {
            blockType: 'question',
            questionData: {
              id: `${preset.id}-q1`,
              questionText: `Jelaskan kunci keberhasilan dan posisi tubuh yang benar saat mempraktikkan materi ${preset.topikMateri}!`,
              answerBoxStyle: 'speech_bubble',
              placeholderText: 'Tuliskan analisis posisi tumpuan, ayunan, dan koordinasi pandangan mata...',
              score: '35'
            }
          },
          {
            blockType: 'question',
            questionData: {
              id: `${preset.id}-q2`,
              questionText: 'Apa kesalahan yang paling sering terjadi saat melakukan gerakan ini dan bagaimana solusi memperbaikinya?',
              answerBoxStyle: 'dotted_box',
              placeholderText: 'Kesalahan umum dan langkah koreksi teknik yang tepat...',
              score: '35'
            }
          },
          {
            blockType: 'question',
            questionData: {
              id: `${preset.id}-q3`,
              questionText: 'Nilai karakter apa (sportivitas, kejujuran, disiplin, gotong royong) yang paling kamu rasakan saat latihan berlangsung?',
              answerBoxStyle: 'ruled_lines',
              placeholderText: 'Saya belajar menghargai usaha kawan dan bersikap sportif...',
              score: '30'
            }
          }
        ]
      },
      {
        sectionTitle: 'Tahap 2: Lembar Observasi Keterampilan Praktik Siswa',
        icon: '📝',
        introText: 'Tabel unjuk kerja dan penilaian teman sebangku di lapangan SD Negeri Kalimantong:',
        contentBlocks: [
          {
            blockType: 'table',
            tableData: {
              headers: ['No', 'Indikator Gerak Utama', 'Sikap Awal', 'Pelaksanaan Gerak', 'Sikap Akhir / Pendaratan'],
              rows: [
                ['1', 'Kesiapan Fisik & Posisi Tubuh', 'Sangat Baik (✓)', 'Baik (✓)', 'Sangat Baik (✓)'],
                ['2', 'Kelancaran Alur Gerakan', 'Baik (✓)', 'Baik (✓)', 'Cukup Baik'],
                ['3', 'Akurasi & Kontrol Keseimbangan', 'Sangat Baik (✓)', 'Sangat Baik (✓)', 'Sangat Baik (✓)'],
                ['4', 'Kepatuhan Aturan & Sportivitas', 'Sangat Baik (✓)', 'Sangat Baik (✓)', 'Sangat Baik (✓)']
              ]
            }
          }
        ]
      }
    ],
    selfReflectionChecklist: [
      `Saya memahami prinsip dasar materi ${preset.topikMateri} dengan baik.`,
      'Saya aktif mencoba setiap tahapan gerak dengan sungguh-sungguh di lapangan SD Negeri Kalimantong.',
      'Saya selalu menjaga keselamatan diri sendiri dan kawan saat beraktivitas fisik.',
      'Saya bersikap sportif, menerima masukan kawan, dan menghargai keputusan guru.'
    ],
    penutupMotivasi: `Badan Bugar, Pikiran Segar, Belajar Makin Bersemangat! Salam Olahraga dari Guru PJOK SD Negeri Kalimantong.`
  };
}

