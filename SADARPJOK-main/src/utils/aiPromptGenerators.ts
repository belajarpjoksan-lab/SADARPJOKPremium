/**
 * Centralized Prompt AI & JSON Export Generators for all SADAR PJOK menus.
 * Designed to provide pedagogical, Kurikulum Merdeka compliant system prompts
 * and structured data for Google Gemini & ChatGPT.
 */

export interface PromptTabDefinition {
  id: string;
  label: string;
  prompt: string;
  description?: string;
}

/**
 * Common System Persona for PJOK Kurikulum Merdeka prompts aligned with SIBI
 */
export const PJOK_SYSTEM_ROLE = `Anda adalah Asisten Pakar Ahli Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK) serta Konsultan Kurikulum Merdeka Kementerian Pendidikan Dasar dan Menengah RI. Anda menyusun seluruh dokumen berdasarkan acuan resmi Buku Panduan Guru PJOK SD/MI Kelas I–VI pada Sistem Informasi Perbukuan Indonesia (SIBI - https://buku.kemendikdasmen.go.id, Penulis: Muhajir & Agus Gunawan / Hariyanto, Pusat Perbukuan BSKAP Kemendikdasmen RI). Anda memiliki keahlian mendalam dalam:
1. Struktur Unit Pembelajaran Buku Panduan Guru PJOK SIBI (Unit 1 s.d. Unit 8 per kelas) mencakup Pemanasan dalam Bentuk Permainan Kecil (Game-Based Warm-Up), Aktivitas Pembelajaran 1, 2, dan 3 secara bertahap (eksplorasi gerak, latihan berpasangan/berkelompok, permainan modifikasi), serta Pendinginan & Refleksi.
2. Capaian Pembelajaran (CP) dan Alur Tujuan Pembelajaran (ATP) PJOK Fase A, B, C, D, E, dan F.
3. Taksonomi Bloom Revisi (C1-C6), Taksonomi Dave/Simpson Ranah Psikomotor (P1-P5), dan SOLO Taxonomy.
4. Pembelajaran Berdiferensiasi (Konten, Proses, Produk) dan Pendekatan Deep Learning (Meaningful, Mindful, Joyful Learning).
5. Profil Pelajar Pancasila / Dimensi Profil Lulusan (Mandiri, Gotong Royong/Kolaborasi, Penalaran Kritis, Kreativitas, Kesehatan, Komunikasi).
6. Asesmen Otentik sesuai Buku Panduan Guru SIBI (Asesmen Awal, Formatif Proses, Sumatif Unjuk Kerja Praktik Lapangan, & Rubrik 4 Skala).`;

/**
 * 1. Capaian Pembelajaran (CP) Prompts
 */
export function getCpPrompts(currentFase: string, currentElement: string, cpText: string): PromptTabDefinition[] {
  return [
    {
      id: 'bedah_cp',
      label: 'Bedah Kompetensi & Konten CP',
      description: 'Menganalisis kalimat Capaian Pembelajaran menjadi kompetensi inti dan lingkup materi.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Lakukan dekonstruksi dan analisis mendalam terhadap Capaian Pembelajaran (CP) PJOK berikut:
- Fase: ${currentFase || 'Fase A/B/C/D/E/F'}
- Elemen: ${currentElement || 'Keterampilan / Pengetahuan / Pemanfaatan Gerak'}
- Kalimat CP: "${cpText || 'Peserta didik menunjukkan kemampuan dalam mempraktikkan dan menganalisis aktivitas pola gerak dasar...'}"

INSTRUKSI DETAIL:
1. Identifikasi Kompetensi Kunci (Kata kerja tindakan yang dituntut).
2. Identifikasi Konten / Materi Pokok PJOK yang harus dikuasai siswa.
3. Petakan tingkat kesulitan kognitif dan psikomotorik yang sesuai dengan tahapan usia/fase siswa.
4. Hubungkan dengan Dimensi Profil Pelajar Pancasila (P3) yang paling relevan.
5. Sajikan dalam tabel terstruktur dan berikan rekomendasi aktivitas gerak yang menyenangkan (joyful movement).`
    },
    {
      id: 'turunkan_atp',
      label: 'Alur Penurunan ke ATP',
      description: 'Panduan menurunkan CP menjadi Alur Tujuan Pembelajaran (ATP) berurutan dari mudah ke kompleks.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Susunlah Alur Tujuan Pembelajaran (ATP) PJOK yang logis, bertahap, dan terukur berdasarkan Capaian Pembelajaran berikut:
- Fase: ${currentFase || 'Semua Fase'}
- Elemen: ${currentElement || 'Elemen Terpilih'}
- Teks CP: "${cpText || 'Capaian Pembelajaran PJOK Kurikulum Merdeka'}"

FORMAT KELUARAN YANG DIINGINKAN:
1. Tabel Alur TP yang memuat:
   - Kode TP (misal: TP.1.1, TP.1.2)
   - Rumusan Tujuan Pembelajaran (memenuhi unsur Kompetensi + Konten)
   - Alokasi Perkiraan Waktu (Jam Pelajaran / JP)
   - Indikator Ketercapaian (IKTP)
   - Rekomendasi Media & Fasilitas (Bola, Lapangan, Kerucut/Cone, Modifikasi Alat)
2. Prinsip Pengurutan (Scaffolding): Jelaskan bagaimana alur bergerak dari keterampilan gerak fundamental menuju kombinasi taktik sederhana.`
    },
    {
      id: 'diferensiasi_cp',
      label: 'Strategi Pembelajaran Berdiferensiasi',
      description: 'Menyusun strategi diferensiasi konten, proses, dan produk sesuai keragaman fisik siswa.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Buatlah rancangan Pembelajaran Berdiferensiasi PJOK untuk mengakomodasi keragaman kondisi fisik, kebugaran, dan minat belajar siswa pada CP:
"${cpText || 'Pengembangan gerak dasar dan kebugaran jasmani'}"

RANCANG STRATEGI BERDASARKAN:
1. Diferensiasi Konten: Modifikasi aturan permainan, ukuran lapangan, atau alat bantu (misal: bola spon vs bola standar).
2. Diferensiasi Proses: Pengorganisasian stasiun belajar (circuits learning) dengan tingkat tantangan berjenjang (Pemula, Menengah, Mahir).
3. Diferensiasi Produk: Beragam bentuk unjuk kerja (praktik gerak langsung, video pendek, atau lembar refleksi diri).
4. Penanganan Khusus: Panduan inklusif untuk siswa dengan keterbatasan fisik ringan atau stamina rendah.`
    }
  ];
}

/**
 * 2. Formulasi CP ke TP Prompts
 */
export function getCpToTpPrompts(data: { fase?: string; kelas?: string; elemen?: string; cpText?: string; tpList?: any[] }): PromptTabDefinition[] {
  const tpSummary = data.tpList && data.tpList.length > 0 
    ? data.tpList.map((t, idx) => `${idx + 1}. [${t.kode || 'TP'}] ${t.rumusanTp || t.tujuanPembelajaran || ''}`).join('\n')
    : '(Belum ada TP yang diformulasikan)';

  return [
    {
      id: 'generator_tp',
      label: 'Formula TP Standar ABCD & Bloom',
      description: 'Menyusun rumusan Tujuan Pembelajaran baru yang presisi dan terukur.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Rumuskan Tujuan Pembelajaran (TP) PJOK Kurikulum Merdeka yang memenuhi kaidah ABCD (Audience, Behavior, Condition, Degree) dan Taksonomi Bloom/SOLO.
- Fase: ${data.fase || 'B'} | Kelas: ${data.kelas || '4'}
- Elemen: ${data.elemen || 'Keterampilan Gerak'}
- Kalimat CP: "${data.cpText || 'Peserta didik mempraktikkan variasi dan kombinasi pola gerak dasar lokomotor, non-lokomotor, dan manipulatif...'}"

INSTRUKSI:
1. Buat minimal 4-6 rumusan TP yang mencakup aspek Psikomotorik (kemampuan gerak), Kognitif (pengetahuan konsep gerak), dan Afektif (sportivitas & kerjasama).
2. Tentukan Kata Kerja Operasional (KKO) yang tepat dan dapat diamati secara objektif di lapangan.
3. Sertakan IKTP (Indikator Ketercapaian Tujuan Pembelajaran) untuk setiap TP.`
    },
    {
      id: 'validasi_tp',
      label: 'Telaah & Review TP Eksisting',
      description: 'Mengevaluasi apakah TP yang sudah dirumuskan sudah realistis dan terukur di lapangan.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Lakukan telaah kritis (Peer Review) terhadap daftar Rumusan TP PJOK berikut:
${tpSummary}

ASPEK YANG PERLU DINILAI:
1. Kejelasan KKO (Apakah kata kerja operasional terukur dan tidak multitafsir?).
2. Ketercapaian di Lapangan (Apakah realistis dicapai dengan alokasi JP dan sarana sekolah Indonesia?).
3. Integrasi Profil Pelajar Pancasila (Apakah nilai karakter melekat alami dalam aktivitas gerak?).
4. Berikan saran penyempurnaan redaksional untuk setiap TP agar semakin sempurna!`
    }
  ];
}

/**
 * 3. KKTP Generator Prompts
 */
export function getKktpPrompts(data: { tp?: string; materi?: string; kelas?: string }): PromptTabDefinition[] {
  return [
    {
      id: 'rubrik_kktp',
      label: 'Rubrik Deskripsi 4 Kategori KKTP',
      description: 'Menyusun kriteria ketercapaian dengan 4 level: Perlu Bimbingan, Cukup, Baik, Sangat Baik.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Susunlah instrumen Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) PJOK:
- Materi Pokok: ${data.materi || 'Kebugaran Jasmani / Keterampilan Permainan Bola'}
- Tujuan Pembelajaran (TP): "${data.tp || 'Mempraktikkan gerak dasar dengan koordinasi yang baik serta mematuhi aturan'}"
- Kelas / Fase: ${data.kelas || 'Fase B (Kelas 4)'}

INSTRUKSI PENYUSUNAN:
1. Gunakan Pendekatan Rubrik Deskriptif 4 Kategori:
   - Perlu Bimbingan (0 - 65%): Belum menguasai teknik dasar, butuh pendampingan intensif.
   - Cukup (66 - 75%): Menguasai teknik dasar namun gerakan masih kaku/terputus.
   - Baik (76 - 85%): Mampu mempraktikkan gerakan dengan lancar dan konsisten.
   - Sangat Baik (86 - 100%): Menguasai variasi gerakan sempurna, mampu membimbing rekan sebaya.
2. Buat indikator unjuk kerja fisik yang jelas (misal: posisi kaki, ayunan tangan, perkenaan bola).
3. Sertakan panduan intervensi bagi siswa yang berada di kategori 'Perlu Bimbingan'.`
    },
    {
      id: 'interval_nilai',
      label: 'Skala Interval & Tindak Lanjut',
      description: 'Menentukan ambang batas ketuntasan dan program intervensi cepat guru di lapangan.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Rancanglah pedoman Interval Nilai KKTP PJOK dan Program Intervensi Praktik:
- TP: "${data.tp || 'Aktivitas Kebugaran & Permainan'}"

Sertakan:
1. Tabel Konversi Kuantitatif ke Kualitatif (Rentang Skor 0-100).
2. Bentuk Tindak Lanjut Nyata di Lapangan:
   - Siswa belum tuntas: Latihan drill gerak sederhana berulang dengan teman sebaya.
   - Siswa tuntas: Permainan kompetisi mini (game-based practice) yang menantang kreativitas taktik.`
    }
  ];
}

/**
 * 4. RPE & Analisis Jam Prompts
 */
export function getRpePrompts(data: { semester?: string; tahunAjaran?: string; totalPekan?: number; pekanEfektif?: number }): PromptTabDefinition[] {
  return [
    {
      id: 'rpe_distribusi',
      label: 'Distribusi Alokasi JP PJOK',
      description: 'Membagi pekan efektif ke dalam seluruh lingkup materi PJOK secara proporsional.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Susunlah rekomendasi Distribusi Jam Pelajaran (JP) PJOK berdasarkan Rincian Pekan Efektif (RPE):
- Semester: ${data.semester || '1 (Ganjil)'}
- Tahun Ajaran: ${data.tahunAjaran || '2026/2027'}
- Total Pekan: ${data.totalPekan || 20} Pekan
- Pekan Efektif: ${data.pekanEfektif || 16} Pekan (Setara ${Number(data.pekanEfektif || 16) * 3} JP jika 3 JP/pekan)

INSTRUKSI:
1. Petakan alokasi JP untuk materi:
   - Permainan Invasi (Sepakbola/Bola Tangan)
   - Permainan Net (Bola Voli/Bulutangkis)
   - Permainan Lapangan (Kasti/Rounders)
   - Atletik / Gerak Dasar
   - Senam Lantai & Irama
   - Kebugaran Jasmani
   - Pola Hidup Sehat (Teori)
   - Cadangan / Asesmen Sumatif Akhir Semester
2. Pastikan proporsi seimbang antara materi dominan outdoor dan materi cadangan bila cuaca hujan.`
    }
  ];
}

/**
 * 5. PROTA & PROSEM Prompts
 */
export function getProtaProsemPrompts(type: 'prota' | 'prosem', data: any): PromptTabDefinition[] {
  return [
    {
      id: 'jadwal_generator',
      label: `Optimasi Alur ${type === 'prota' ? 'PROTA' : 'PROSEM'}`,
      description: `Rekomendasi urutan pembelajaran ${type.toUpperCase()} yang sesuai dengan kondisi fisik dan cuaca tahunan.`,
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Buatlah rencana optimalisasi ${type === 'prota' ? 'Program Tahunan (PROTA)' : 'Program Semester (PROSEM)'} PJOK Kurikulum Merdeka:
- Sasaran: SD/SMP/SMA PJOK
- Konteks: Kondisi sekolah di Indonesia (iklim tropis, musim hujan bulan Nov-Feb, lapangan multifungsi).

INSTRUKSI:
1. Urutkan lingkup materi dengan memperhatikan kurva kelelahan fisik siswa dan ketersediaan sarana.
2. Tempatkan materi teori kesehatan (kebersihan diri, gizi seimbang, bahaya merokok) pada pekan rawan cuaca ekstrem/hujan.
3. Rancang jeda pekan untuk Asesmen Sumatif Lingkup Materi dan Remedial.`
    }
  ];
}

/**
 * 6. Modul Ajar (RPP) Prompts
 */
export function getModulAjarPrompts(modul?: any): PromptTabDefinition[] {
  const judul = modul?.title || 'Modul Ajar PJOK';
  const materi = modul?.materiPokok || 'Aktivitas Permainan & Kebugaran';
  const kelas = modul?.grade ? `Kelas ${modul.grade}` : 'Kelas 4';

  return [
    {
      id: 'generator_modul',
      label: 'Sintaks Modul Ajar Lengkap',
      description: 'Menyusun Modul Ajar lengkap dengan Pertanyaan Pemantik, 3 Tahap Inti, dan Asesmen Otentik.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Susunlah Modul Ajar (RPP) PJOK Kurikulum Merdeka berstandar nasional yang lengkap dan inspiratif:
- Judul: ${judul}
- Materi Pokok: ${materi}
- Sasaran: ${kelas}
- Alokasi Waktu: 3 JP (3 x 35 Menit / 1 Pertemuan)

KOMPONEN WAJIB:
1. IDENTITAS & PROFIL: TP, Target Peserta Didik, Model Pembelajaran (Discovery / Problem-Based / Teaching Games for Understanding / TGfU).
2. PEMAHAMAN BERMAKNA & PERTANYAAN PEMANTIK: Pertanyaan menarik yang merangsang anak aktif bergerak dan berpikir kritis.
3. LANGKAH PEMBELAJARAN DETAIL:
   - Pendahuluan (15 menit): Pemanasan dinamis dalam bentuk permainan (Game-based warm up), apersepsi, ice breaking.
   - Kegiatan Inti (75 menit): Pembelajaran berdiferensiasi, eksplorasi gerak bebas, variasi tantangan gerak, permainan modifikasi.
   - Penutup (15 menit): Pendinginan (cooling down) santai, refleksi perasaan, apresiasi sportivitas.
4. ASESMEN: Lembar observasi unjuk kerja gerak & rubrik penilaian sikap gotong royong.`
    },
    {
      id: 'deep_learning_modul',
      label: 'Integrasi Deep Learning (Mindful, Meaningful, Joyful)',
      description: 'Meningkatkan modul ajar agar tidak sekadar latihan mekanik, tapi membentuk karakter mendalam.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Integrasikan prinsip Deep Learning ke dalam Modul Ajar PJOK "${judul} - ${materi}":

1. MINDFUL LEARNING (Sadar Penuh):
   - Bagaimana melatih kesadaran sensori siswa (merasakan detak jantung, ritme pernapasan, koordinasi mata dan tangan saat menyentuh bola).
2. MEANINGFUL LEARNING (Bermakna):
   - Mengaitkan aktivitas gerak ini dengan fungsi kesehatan jangka panjang, keselamatan diri, dan rasa percaya diri dalam kehidupan sehari-hari.
3. JOYFUL LEARNING (Menyenangkan):
   - Strategi mengubah latihan fisik yang berat menjadi tantangan bermain yang memicu tawa, kerjasama tim, dan antusiasme tinggi.`
    },
    {
      id: 'diferensiasi_modul',
      label: 'Adaptasi Diferensiasi & Inklusi',
      description: 'Panduan modifikasi gerakan bagi siswa dengan kemampuan motorik beragam di lapangan.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Buatlah panduan modifikasi pembelajaran berdiferensiasi untuk Modul Ajar PJOK "${judul}":
- Level 1 (Kemampuan Dasar): Penyesuaian jarak lemparan/tendangan lebih dekat, bola lebih empuk, target lebih besar.
- Level 2 (Kemampuan Menengah): Aturan standar dengan variasi tempo.
- Level 3 (Tantangan Mahir): Pembatasan sentuhan bola, penjagaan satu lawan satu, peran sebagai pengatur serangan.
Sertakan tips komunikasi positif bagi guru saat memotivasi anak yang minder atau takut berbuat salah.`
    }
  ];
}

export interface DeepLearningPromptInput {
  penyusun?: string;
  sekolah?: string;
  tahunAjaran?: string;
  semester?: string;
  mataPelajaran?: string;
  kelasFase?: string;
  topik?: string;
  alokasiWaktu?: string;
  cpText?: string;
}

/**
 * 7. Deep Learning RPM Prompts
 */
export function getDeepLearningPrompts(
  topicOrData?: string | DeepLearningPromptInput
): PromptTabDefinition[] {
  const data: DeepLearningPromptInput = typeof topicOrData === 'string'
    ? { topik: topicOrData }
    : (topicOrData || {});

  const penyusunVal = data.penyusun || 'Nama Guru';
  const sekolahVal = data.sekolah || 'SD Negeri Kalimantong';
  const tahunAjaranVal = data.tahunAjaran || '2026/2027';
  const semesterVal = data.semester || '1';
  const mapelVal = data.mataPelajaran || 'PJOK / Mata Pelajaran';
  const kelasFaseVal = data.kelasFase || 'Kelas 7 / Fase D';
  const topikVal = data.topik || 'Aktivitas Kebugaran & Keterampilan Gerak';
  const alokasiVal = data.alokasiWaktu || '2x40 Menit';
  const cpVal = data.cpText || `Peserta didik mampu mempraktikkan, menganalisis, dan membiasakan aktivitas ${topikVal} secara mindful, meaningful, dan joyful sesuai fase capaian.`;

  return [
    {
      id: 'rpm_lendi_hermawan',
      label: 'Format Standar RPM (Lendi Ike Hermawan, S.Pd., Gr.)',
      description: 'Format Perencanaan Pembelajaran Mendalam (RPM) Tabel 2-Kolom, Lampiran & LKPD Non-Tabel.',
      prompt: `Prompt Manyusun Perencanaan Pembelajaran Mendalam Menggunakan Claude, Gemini, ChatGPT, dll
Penyusun: Lendi Ike Hermawan, S.Pd., Gr.

Petunjuk: Ganti Bagian yang disesuaikan kebutuhan masing-masing

Tuliskan Perencanaan Pembelajaran Mendalam (RPM) dengan struktur format berikut dalam bentuk tabel:

A. Identitas
Penyusun: ${penyusunVal}
Sekolah: ${sekolahVal}
Tahun Ajaran: ${tahunAjaranVal}
Semester: ${semesterVal}
Mata Pelajaran: ${mapelVal}
Kelas/Fase Capaian: ${kelasFaseVal}
Topik: ${topikVal}
Alokasi Waktu: ${alokasiVal}

B. Identifikasi
Identifikasi Murid (uraikan pengetahuan awal, minat belajar, kebutuhan belajar).
Materi Pelajaran (faktual, konseptual, prosedural, metakognitif).
Dimensi Profil Lulusan (pilih dimensi yang sesuai yaitu keimanan dan ketakwaan kepada Tuhan Yang Maha Esa, kewargaan, penalaran kritis, kreativitas, kolaborasi, kemandirian, kesehatan, atau komunikasi).

C. Desain Pembelajaran
Capaian Pembelajaran (${cpVal})
Lintas Disiplin Ilmu
Tujuan Pembelajaran (berdasarkan capaian pembelajaran, tuliskan tujuan pembelajaran yang merinci kompetensi yang harus dikuasai murid dalam satu pertemuan sesuai alokasi waktu diatas mencakup level kognitif mengingat/memahami/menerapkan/menganalisis/merefleksi/mencipta. Buatkan 2-3 Tujuan pembelajaran).
Topik Pembelajaran
Praktik Pedagogis (Tuliskan Pendekatan Pembelajaran Mendalam, Model (Tuliskan juga sintaks/Langkah-langkahnya), Metode yang digunakan)
Kemitraan Pembelajaran
Lingkungan Pembelajaran
Pemanfaatan Digital

D. Pengalaman Belajar
Buatkan secara ringkas dan jelas langkah kegiatan awal dengan durasi 15 menit berdasarkan tujuan pembelajaran diatas, Susunlah kegiatan awal yang menerapkan prinsip pembelajaran berkesadaran, bermakna, dan menggembirakan. Prinsip tidak harus ketiganya. Kegiatan ini mencakup apersepsi, motivasi, dan pengkondisian yang membangun semangat serta keterhubungan dengan pengalaman siswa. Awali dengan mengucap salam kemudian kegiatan berdoa dan mengecek kehadiran. Identifikasi prinsip pembelajaran yang digunakan misal berkesadaran, bermakna, menggembirakan
Buatkan Langkah-langkah kegiatan inti dengan durasi 60 menit berdasarkan tujuan pembelajaran diatas Prinsip pembelajaran yang digunakan tetap mindful (berkesadaran), meaningful (bermakna), dan joyful (menggembirakan) agar murid aktif menggali makna dari materi. Identifikasi prinsip pembelajaran yang digunakan misal berkesadaran, bermakna, menggembirakan. Prinsip Pembelajaran yang digunakan ditulis di awal Setiap Kegiatan sebelum ke rincian aktivitas. Buatkan aktivitas pembelajaran pada pembelajaran mendalam dengan tahapan sebagai berikut:
Memahami
Mengaplikasikan
Merefleksi.
Aktifitas pembelajaran yang memuat memahami, mengaplikasikan, merefleksi memiliki kaitan dengan sintaks pembelajaran lengkap (sesuai model pembelajaran pada praktik pedagogis) dan juga memuat metode pembelajaran sesuai pada praktik pedagogis. Sintaks pembelajaran ditulis terintegrasi setelah pengalaman belajar dengan tanda kurung contoh:
Memahami (Sintaks Model Pembelajaran) (estimasi Waktu)
Mengaplikasikan (Sintaks Model Pembelajaran) (estimasi Waktu)
Merefleksikan (Sintaks Model Pembelajaran) (estimasi Waktu)
Dimensi Profil Lulusan (DPL) ditulis di akhir kalimat aktivitas pembelajaran dengan tanda kurung contoh : (... (Kesehatan, Kolaborasi))
Setiap tahapan Pengalaman Belajar (Memahami, Mengaplikasikan, dan Merefleksi) berisikan minimal 4 poin kegiatan/aktivitas pembelajaran. Gunakan penomoran 1, 2, 3, 4 pada setiap tahapan aktivitas.
Tuliskan kalimat aktivitas dengan bahasa formal dan konkret yang menggambarkan peran guru dan murid secara jelas.
Buatkan secara ringkas dan jelas langkah kegiatan penutup dengan durasi 5 menit berdasarkan tujuan pembelajaran diatas, Susunlah kegiatan penutup yang menerapkan prinsip pembelajaran berkesadaran, bermakna, dan menggembirakan. Prinsip tidak harus ketiganya. Kegiatan ini mencakup simpulan, umpan balik, dan rencana tindak lanjut yang memperkuat pemahaman serta keterhubungan pengalaman belajar dengan kehidupan sehari-hari. Akhiri dengan kegiatan berdoa dan mengucapkan salam. Identifikasi prinsip pembelajaran yang digunakan misal berkesadaran, bermakna, menggembirakan.

E. Asesmen Pembelajaran
Awal (Tuliskan jenis, bentuk, teknik)
Proses (Tuliskan jenis, bentuk, teknik)
Akhir (Tuliskan jenis, bentuk, teknik)

Tanda Tangan
Tuliskan Tempat tanggal pembuatan modul
Tanda tangan Kepala Sekolah bernama: Soleh, S.Pd., M.Pd. dan Guru Mata Pelajaran

Lampiran (Terpisah dengan Tabel RPP):
Soal asesmen awal: Buatkan 5 soal lisan/essay/uraian/pilihan ganda yang relevan dan singkat beserta jawabannya untuk mengukur pengetahuan awal murid terhadap topik materi yang akan dibahas
Rubrik Penilaian Sikap (Gunakan 4 Skala Penilaian) sesuai dengan Dimensi Profil Lulusan yang dipilih.
Rubrik Penilaian Pengetahuan (Gunakan 4 Skala Penilaian)
Rubrik Penilaian Keterampilan (Gunakan 4 Skala Penilaian)
Buatkan Rubrik penilaian dalam bentuk tabel yang rapi
Materi Ajar: Buatkan materi ajar yang ringkas dan jelas sesuai topik pembelajaran diatas

Lembar Kerja Peserta Didik (LKPD):
Buatkan LKPD yang lengkap dan terstruktur sesuai dengan sintaks dan topik pembelajaran yang bertujuan untuk mengembangkan Dimensi Profil Lulusan (DPL) yang dipilih dengan ketentuan:
1. Identitas diri di LKPD: nama peserta didik, mata pelajaran, no absen, kelas, tanggal.
2. Petunjuk penggunaan LKPD: instruksi yang jelas, alat yang dibutuhkan dan cara menjawab.
3. Sintaks Pembelajaran: langkah-langkah yang harus dilakukan siswa, aktivitas siswa yang sesuai sintaks dan topik, kolom atau ruang pengerjaan untuk setiap sintaks.
4. Pengalaman Belajar Mendalam:
   - Memahami: Materi, gambar atau teks ringkas untuk pemahaman awal siswa. Minimal 3 pertanyaan untuk mengecek pemahaman.
   - Mengaplikasikan: Tugas atau studi kasus nyata yang kontekstual. Instruksi yang jelas untuk pengerjaan. Ruang untuk siswa menuliskan jawaban atau hasil kerja.
   - Merefleksikan: 2-3 pertanyaan refleksi tentang proses belajar, pemahaman materi dan kesulitan yang dihadapi.
   - Bagian Penutup: Ucapan penyemangat, catatan atau feedback dari guru (opsional), cek pemahaman diri (checklist).
5. Sintaks dan pengalaman belajar diintegrasikan dalam LKPD.
6. LKPD TIDAK DIBUAT DALAM BENTUK TABEL.

Bentuk Output:
Buatkan RPM dalam bentuk tabel 2 kolom (Kolom 1: Komponen & Sub-komponen dibawahnya; Kolom 2: Isi).
Output tabel langsung rapi siap pakai orientasi potrait siap download langsung.
Lampiran dan LKPD dibuat terpisah dengan tabel RPM.`
    }
  ];
}

export interface DeepLearningSatuBabPromptInput {
  penyusun?: string;
  sekolah?: string;
  tahunAjaran?: string;
  semester?: string;
  mataPelajaran?: string;
  kelasFase?: string;
  bab?: string;
  topik?: string;
  alokasiWaktu?: string;
  cpText?: string;
}

/**
 * 7b. Deep Learning RPM Satu Bab (16x40 Menit / 8 Pertemuan) Prompts
 */
export function getDeepLearningSatuBabPrompts(
  topicOrData?: string | DeepLearningSatuBabPromptInput
): PromptTabDefinition[] {
  const data: DeepLearningSatuBabPromptInput = typeof topicOrData === 'string'
    ? { topik: topicOrData }
    : (topicOrData || {});

  const penyusunVal = data.penyusun || 'Lendi Ike Hermawan, S.Pd., Gr.';
  const sekolahVal = data.sekolah || 'SD Negeri Kalimantong';
  const tahunAjaranVal = data.tahunAjaran || '2026/2027';
  const semesterVal = data.semester || '1';
  const mapelVal = data.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
  const kelasFaseVal = data.kelasFase || 'Kelas IV / Fase B';
  const babVal = data.bab || 'Bab 1: Pola Gerak Dasar dan Kebugaran Jasmani';
  const topikVal = data.topik || 'Variasi dan Kombinasi Gerak Dasar';
  const alokasiVal = data.alokasiWaktu || '16x40 Menit (8 Pertemuan)';
  const cpVal = data.cpText || `Peserta didik mampu mempraktikkan, menganalisis, dan membiasakan aktivitas ${topikVal} secara mindful, meaningful, dan joyful sesuai fase capaian.`;

  return [
    {
      id: 'rpm_satu_bab_lendi',
      label: 'Format Standar RPM 1 Bab (8 Pertemuan)',
      description: 'Format Perencanaan Pembelajaran Mendalam (RPM) 1 Bab Lengkap (16x40 Menit / 8 Pertemuan) Tabel 2-Kolom & LKPD Non-Tabel.',
      prompt: `Prompt Manyusun Perencanaan Pembelajaran Mendalam Menggunakan Claude, Gemini, ChatGPT, dll
Penyusun: Lendi Ike Hermawan, S.Pd., Gr.


Petunjuk: Ganti Bagian yang berwarna kuning sesuai kebutuhan masing-masing

Tuliskan Perencanaan Pembelajaran Mendalam (RPM) dengan struktur format berikut dalam bentuk tabel:

A. Identitas
Penyusun: ${penyusunVal}
Sekolah: ${sekolahVal}
Tahun Ajaran: ${tahunAjaranVal}
Semester: ${semesterVal}
Mata Pelajaran: ${mapelVal}
Kelas/Fase Capaian: ${kelasFaseVal}
Bab: ${babVal}
Topik: ${topikVal}
Alokasi Waktu: ${alokasiVal}

B. Identifikasi
Identifikasi Murid (uraikan pengetahuan awal, minat belajar, kebutuhan belajar).
Materi Pelajaran (faktual, konseptual, prosedural, metakognitif).
Dimensi Profil Lulusan (pilih dimensi yang sesuai yaitu keimanan dan ketakwaan kepada Tuhan Yang Maha Esa, kewargaan, penalaran kritis, kreativitas, kolaborasi, kemandirian, kesehatan, atau komunikasi).

C. Desain Pembelajaran
Capaian Pembelajaran (${cpVal})
Lintas Disiplin Ilmu
Tujuan Pembelajaran (berdasarkan capaian pembelajaran, tuliskan tujuan pembelajaran yang merinci kompetensi yang harus dikuasai murid dalam satu pertemuan sesuai alokasi waktu diatas mencakup level kognitif mengingat/memahami/menerapkan/menganalisis/merefleksi/mencipta. Gunakan kata “Murid …” dalam merumuskan Tujuan. Tujuan Pembelajaran dibuat untuk 1 bab dengan total 8 pertemuan. Uraikan untuk Pertemuan 1, Pertemuan 2, dan seterusnya).
Topik Pembelajaran (Sub topik yang dibahas setiap pertemuan, tuliskan Pertemuan 1, Pertemuan 2, dan seterusnya)
Praktik Pedagogis (Tuliskan Pendekatan Pembelajaran Mendalam (Deep Learning), Model (Tuliskan juga sintaks/Langkah-langkahnya), Metode yang digunakan. Model dan Metode dituliskan setiap pertemuan yaitu Pertemuan 1, Pertemuan 2, dan seterusnya)
Kemitraan Pembelajaran
Lingkungan Pembelajaran
Pemanfaatan Digital (bisa berupa presentasi interaktif, video pembelajaran, sumber belajar digital, atau yang lainnya)

D. Pengalaman Belajar
Buatkan secara ringkas dan jelas langkah kegiatan awal dengan durasi 15 menit berdasarkan tujuan pembelajaran diatas, Susunlah kegiatan awal yang menerapkan prinsip pembelajaran berkesadaran, bermakna, dan menggembirakan. Prinsip tidak harus ketiganya. Kegiatan ini mencakup apersepsi, motivasi, dan pengkondisian yang membangun semangat serta keterhubungan dengan pengalaman siswa. Awali dengan mengucap salam kemudian kegiatan berdoa dan mengecek kehadiran. Identifikasi prinsip pembelajaran yang digunakan misal berkesadaran, bermakna, menggembirakan
Buatkan Langkah-langkah kegiatan inti dengan durasi 60 menit setiap pertemuan berdasarkan tujuan pembelajaran diatas Prinsip pembelajaran yang digunakan tetap mindful (berkesadaran), meaningful (bermakna), dan joyful (menggembirakan) agar murid aktif menggali makna dari materi. Identifikasi prinsip pembelajaran yang digunakan misal berkesadaran, bermakna, menggembirakan. Buatkan aktivitas pembelajaran pada pembelajaran mendalam dengan tahapan sebagai berikut:
Memahami
Mengaplikasikan
Merefleksi.
Aktifitas pembelajaran yang memuat memahami, mengaplikasikan, merefleksi memiliki kaitan dengan sintaks pembelajaran lengkap (sesuai model pembelajaran pada praktik pedagogis) dan juga memuat metode pembelajaran sesuai pada praktik pedagogis. Sintaks pembelajaran diintegrasikan dengan pengalaman belajar dan dituliskan setelah pengalaman belajar dan diberi batas dengan tanda kurung (misal Memahami (Orientasi pada masalah)). Kegiatan pembelajaran inti untuk menggali Dimensi Profil Lulusan (DPL) sesuai dengan yang ada diatas. DPL dituliskan diakhir kalimat pada aktivitas dengan diberi tanda kurung. Topik pembelajaran sesuai dengan diatas. Kegiatan Inti dituliskan setiap pertemuan, Pertemuan 1, Pertemuan 2, dan seterusnya. Ketentuan pengembangan:
Setiap tahap mencantumkan estimasi waktu.
Setiap tahap diuraikan menjadi beberapa poin bernomor (minimal 4 poin aktivitas).
Setiap poin menjelaskan aktivitas konkret guru dan/atau Murid.
Gunakan bahasa formal, dan sistematis.
Format yang diharapkan:
[Nama Tahap Pembelajaran] (Sintaks Model) (Estimasi Waktu)
…
…
…
…
Kegiatan Inti setiap pertemuan harus dijabarkan dengan detail seperti ketentuan diatas.
Buatkan secara ringkas dan jelas langkah kegiatan penutup dengan durasi 5 menit berdasarkan tujuan pembelajaran diatas. Penutup pembelajaran dilakukan dengan menyimpulkan materi, memberikan umpan balik, merencanakan kegiatan selanjutnya dan doa kemudian diakhiri salam. Identifikasi prinsip pembelajaran yang digunakan misal berkesadaran, bermakna, menggembirakan. Gunakan kata “Murid atau Guru” dalam menyusun aktivitas.

E. Asesmen Pembelajaran
Awal (tuliskan jenis, Bentuk dan Teknik asesmen yang digunakan)
Proses (tuliskan jenis, Bentuk dan Teknik asesmen yang digunakan)
Akhir (tuliskan jenis, Bentuk dan Teknik asesmen yang digunakan)

Tuliskan Tanda Tangan Kepala Sekolah bernama Soleh, S.Pd., M.Pd.
Dan tanda tangan guru mapel


Lampiran (Terpisah dengan Tabel RPP)
Lampiran berikut berdasarkan asesmen awal, proses, dan akhir diatas
Asesmen Awal Pembelajaran
Soal asesmen awal (5 soal lisan/essay/uraian/pilihan ganda + jawaban)
Asesmen Proses Pembelajaran.
Rubrik Penilaian Sikap (4 skala)
Rubrik Penilaian Pengetahuan (4 skala)
Rubrik Penilaian Keterampilan (4 skala)
Asesmen Akhir Pembelajaran
Soal asesmen akhir (5 soal lisan/essay/uraian/pilihan ganda+ jawaban atau berupa proyek/karya/produk)
Materi Ajar

Tampilkan dalam bentuk tabel mulai dari identitas, identifikasi, pengalaman belajar, hingga asesmen pembelajaran (tabel dua kolom dengan rincian kolom pertama untuk menuliskan komponen sesuai struktur dan kolom kedua isi RPP). Pada format tersebut ada Komponen kemudian Sub-komponen, Tuliskan Sub-Komponennya dibawah Komponen. Sub-komponen seperti Penyusun, Sekolah, dll

Buatkan Lembar Kerja Peserta Didik (LKPD) yang lengkap dan terstruktur berdasarkan sintaks pembelajaran diatas, dengan topik diatas. Tujuan pembelajaran yang menjadi acuan adalah tujuan diatas LKPD ini bertujuan untuk mengembangkan dimensi profil lulusan diatas. Isi LKPD harus sesuai dengan kegiatan inti.
LKPD dibuat untuk setiap pertemuan sesuai kegiatan inti tersebut.
LKPD harus mencakup bagian-bagian berikut secara lengkap:
1.	Identitas diri di LKPD: nama peserta didik, mata pelajaran, no absen, kelas, tanggal
2.	Petunjuk penggunaan LKPD: berisi instruksi langkah-langkah mengerjakan, alat yang dibutuhkan, dan cara menjawab.
3.	Sintaks Pembelajaran, tuliskan tahapan kegiatan belajar sesuai sintaks, lalu berikan aktivitas siswa dan kolom untuk siswa mengerjakan.
4.	Pengalaman Belajar Mendalam, mencakup:
●   Memahami: sajikan materi, gambar, atau teks ringkas yang harus diamati/dibaca, lalu berikan pertanyaan pemahaman (minimal 3 soal).
●   Mengaplikasikan: buat tugas kasus nyata yang sesuai konteks kehidupan siswa, berikan instruksi kerja yang jelas, dan ruang jawaban siswa.
●   Merefleksikan: berikan pertanyaan refleksi (2–3 soal) yang menuntun siswa untuk meninjau proses belajarnya, kesulitan yang dihadapi, serta rencana perbaikan atau tindak lanjut.
●   Bagian Penutup: ucapan penyemangat, catatan guru (opsional), serta kolom cek pemahaman diri siswa (checklist atau skala sederhana). Sintaks pembelajaran dan pengalaman belajar mendalam diintegrasikan menjadi satu dan ditampilkan tidak dalam bentuk tabel.
Gunakan bahasa yang komunikatif, sesuai jenjang, dan dorong pembelajaran aktif, bermakna, berkesadaran, dan menggembirakan. LKPD harus muncul secara utuh dengan isi yang lengkap, bukan hanya berupa kerangka atau daftar isi.

Output: Buat outputnya dalam bentuk file word (docx) yang rapi siap pakai tanpa perlu edit kembali dengan orientasi potrait siap download langsung`
    }
  ];
}

export interface DeepLearning1TpPromptInput {
  penyusun?: string;
  sekolah?: string;
  tahunAjaran?: string;
  semester?: string;
  mataPelajaran?: string;
  kelasFase?: string;
  bab?: string;
  topik?: string;
  alokasiWaktu?: string;
  jumlahPertemuan?: string;
  tujuanPembelajaran?: string;
  capaianPembelajaran?: string;
  cpText?: string;
}

/**
 * 7c. Deep Learning RPM 1 TP (1 Tujuan Pembelajaran - 6x40 Menit / 2-3 Pertemuan) Prompts
 * Sesuai Format Standar rafsanjani, S.Pd., Gr.
 */
export function getDeepLearning1TpPrompts(
  topicOrData?: string | DeepLearning1TpPromptInput
): PromptTabDefinition[] {
  const data: DeepLearning1TpPromptInput = typeof topicOrData === 'string'
    ? { topik: topicOrData }
    : (topicOrData || {});

  const penyusunVal = data.penyusun || 'rafsanjani, S.Pd., Gr.';
  const sekolahVal = data.sekolah || 'SD Negeri Kalimantong';
  const tahunAjaranVal = data.tahunAjaran || '2026/2027';
  const semesterVal = data.semester || '1';
  const mapelVal = data.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
  const kelasFaseVal = data.kelasFase || 'Kelas IV / Fase B';
  const topikVal = data.topik || 'Keterampilan Gerak Fundamental dan Kebugaran Jasmani';
  const alokasiVal = data.alokasiWaktu || '6x40 Menit (2 Pertemuan)';
  const cpVal = data.cpText || `Peserta didik mampu mempraktikkan, menganalisis, dan membiasakan aktivitas ${topikVal} secara mindful, meaningful, dan joyful sesuai fase capaian.`;
  const tpVal = data.tujuanPembelajaran || `Murid dapat menganalisis dan mempraktikkan variasi serta kombinasi aktivitas gerak ${topikVal} secara disiplin, percaya diri, dan menjunjung sportivitas (Level Kognitif: Menganalisis/C4 & Menerapkan/C3).`;

  return [
    {
      id: 'rpm_1tp_rafsanjani',
      label: 'Format Standar RPM 1 TP (rafsanjani, S.Pd., Gr.)',
      description: 'Format Perencanaan Pembelajaran Mendalam (RPM) untuk 1 TP spesifik (6x40 Menit / 2 Pertemuan) Tabel 2-Kolom & LKPD Non-Tabel.',
      prompt: `Prompt Manyusun Perencanaan Pembelajaran Mendalam Menggunakan Claude, Gemini, ChatGPT, dll
Penyusun: ${penyusunVal}


Petunjuk: Ganti Bagian yang berwarna kuning sesuai kebutuhan masing-masing


Tuliskan Perencanaan Pembelajaran Mendalam (RPM) dengan struktur format berikut dalam bentuk tabel:

A. Identitas
Penyusun: ${penyusunVal}
Sekolah: ${sekolahVal}
Tahun Ajaran: ${tahunAjaranVal}
Semester: ${semesterVal}
Mata Pelajaran: ${mapelVal}
Kelas/Fase Capaian: ${kelasFaseVal}
Topik: ${topikVal}
Alokasi Waktu: ${alokasiVal}

B. Identifikasi
Identifikasi Murid (uraikan pengetahuan awal, minat belajar, kebutuhan belajar).
Materi Pelajaran (faktual, konseptual, prosedural, metakognitif).
Dimensi Profil Lulusan (pilih dimensi yang sesuai yaitu keimanan dan ketakwaan kepada Tuhan Yang Maha Esa, kewargaan, penalaran kritis, kreativitas, kolaborasi, kemandirian, kesehatan, atau komunikasi).

C. Desain Pembelajaran
Capaian Pembelajaran (${cpVal})
Lintas Disiplin Ilmu
Tujuan Pembelajaran (berdasarkan capaian pembelajaran, tuliskan tujuan pembelajaran yang merinci kompetensi yang harus dikuasai murid dalam satu pertemuan sesuai alokasi waktu diatas mencakup level kognitif mengingat/memahami/menerapkan/menganalisis/merefleksi/mencipta dalam 1 tujuan saja. Gunakan kata “Murid …” dalam merumuskan Tujuan. 1 Tujuan Pembelajaran dibuat untuk 2-3 pertemuan: "${tpVal}").
Topik Pembelajaran (Sesuai dengan tujuan diuraikan setiap pertemuan)
Praktik Pedagogis (Tuliskan Pendekatan Pembelajaran Mendalam (Deep Learning), Model (Tuliskan juga sintaks/Langkah-langkahnya), Metode yang digunakan. Model dan Metode dituliskan setiap pertemuan yaitu Pertemuan 1, Pertemuan 2, dan seterusnya)
Kemitraan Pembelajaran
Lingkungan Pembelajaran
Pemanfaatan Digital (bisa berupa presentasi interaktif, video pembelajaran, sumber belajar digital, atau yang lainnya)

D. Pengalaman Belajar
Buatkan secara ringkas dan jelas langkah kegiatan awal dengan durasi 15 menit berdasarkan tujuan pembelajaran diatas, Susunlah kegiatan awal yang menerapkan prinsip pembelajaran berkesadaran, bermakna, dan menggembirakan. Prinsip tidak harus ketiganya. Kegiatan ini mencakup apersepsi, motivasi, dan pengkondisian yang membangun semangat serta keterhubungan dengan pengalaman siswa. Awali dengan mengucap salam kemudian kegiatan berdoa dan mengecek kehadiran. Identifikasi prinsip pembelajaran yang digunakan misal berkesadaran, bermakna, menggembirakan
Buatkan Langkah-langkah kegiatan inti dengan durasi 60 menit setiap pertemuan berdasarkan tujuan pembelajaran diatas Prinsip pembelajaran yang digunakan tetap mindful (berkesadaran), meaningful (bermakna), dan joyful (menggembirakan) agar murid aktif menggali makna dari materi. Identifikasi prinsip pembelajaran yang digunakan misal berkesadaran, bermakna, menggembirakan. Buatkan aktivitas pembelajaran pada pembelajaran mendalam dengan tahapan sebagai berikut:
Memahami
Mengaplikasikan
Merefleksi.
Aktifitas pembelajaran yang memuat memahami, mengaplikasikan, merefleksi memiliki kaitan dengan sintaks pembelajaran lengkap (sesuai model pembelajaran pada praktik pedagogis) dan juga memuat metode pembelajaran sesuai pada praktik pedagogis. Sintaks pembelajaran diintegrasikan dengan pengalaman belajar dan dituliskan setelah pengalaman belajar dan diberi batas dengan tanda kurung (misal Memahami (Orientasi pada masalah)). Kegiatan pembelajaran inti untuk menggali Dimensi Profil Lulusan (DPL) sesuai dengan yang ada diatas. DPL dituliskan diakhir kalimat pada aktivitas dengan diberi tanda kurung. Topik pembelajaran sesuai dengan diatas. Kegiatan Inti dituliskan setiap pertemuan, Pertemuan 1, Pertemuan 2, dan seterusnya. Ketentuan pengembangan:
Setiap tahap mencantumkan estimasi waktu.
Setiap tahap diuraikan menjadi beberapa poin bernomor (minimal 4 poin aktivitas).
Setiap poin menjelaskan aktivitas konkret guru dan/atau Murid.
Gunakan bahasa formal, dan sistematis.
Format yang diharapkan:
[Nama Tahap Pembelajaran] (Sintaks Model) (Estimasi Waktu)
…
…
…
…
Buatkan secara ringkas dan jelas langkah kegiatan penutup dengan durasi 5 menit berdasarkan tujuan pembelajaran diatas. Penutup pembelajaran dilakukan dengan menyimpulkan materi, memberikan umpan balik, merencanakan kegiatan selanjutnya dan doa kemudian diakhiri salam. Identifikasi prinsip pembelajaran yang digunakan misal berkesadaran, bermakna, menggembirakan. Gunakan kata “Murid atau Guru” dalam menyusun aktivitas.

E. Asesmen Pembelajaran
Awal (tuliskan jenis, Bentuk dan Teknik asesmen yang digunakan)
Proses (tuliskan jenis, Bentuk dan Teknik asesmen yang digunakan)
Akhir (tuliskan jenis, Bentuk dan Teknik asesmen yang digunakan)

Tuliskan Tanda Tangan Kepala Sekolah bernama Soleh, S.Pd., M.Pd.
Dan tanda tangan guru mapel (${penyusunVal})

Lampiran (Terpisah dengan Tabel RPP)
Lampiran berikut berdasarkan asesmen awal, proses, dan akhir diatas
Asesmen Awal Pembelajaran
Soal asesmen awal (5 soal lisan/essay/uraian/pilihan ganda + jawaban)
Asesmen Proses Pembelajaran.
Rubrik Penilaian Sikap (4 skala)
Rubrik Penilaian Pengetahuan (4 skala)
Rubrik Penilaian Keterampilan (4 skala)
Asesmen Akhir Pembelajaran
Soal asesmen akhir (5 soal lisan/essay/uraian/pilihan ganda+ jawaban atau berupa proyek/karya/produk/Praktik)
Materi Ajar

Tampilkan dalam bentuk tabel mulai dari identitas, identifikasi, pengalaman belajar, hingga asesmen pembelajaran (tabel dua kolom dengan rincian kolom pertama untuk menuliskan komponen sesuai struktur dan kolom kedua isi RPP). Pada format tersebut ada Komponen kemudian Sub-komponen, Tuliskan Sub-Komponennya dibawah Komponen. Sub-komponen seperti Penyusun, Sekolah, dll

Buatkan Lembar Kerja Peserta Didik (LKPD) yang lengkap dan terstruktur berdasarkan sintaks pembelajaran diatas, dengan topik diatas. Tujuan pembelajaran yang menjadi acuan adalah tujuan diatas LKPD ini bertujuan untuk mengembangkan dimensi profil lulusan diatas. Isi LKPD harus sesuai dengan kegiatan inti.
LKPD dibuat untuk setiap pertemuan sesuai kegiatan inti tersebut.
LKPD harus mencakup bagian-bagian berikut secara lengkap:
1.	Identitas diri di LKPD: nama peserta didik, mata pelajaran, no absen, kelas, tanggal
2.	Petunjuk penggunaan LKPD: berisi instruksi langkah-langkah mengerjakan, alat yang dibutuhkan, dan cara menjawab.
3.	Sintaks Pembelajaran, tuliskan tahapan kegiatan belajar sesuai sintaks, lalu berikan aktivitas siswa dan kolom untuk siswa mengerjakan.
4.	Pengalaman Belajar Mendalam, mencakup:
●   Memahami: sajikan materi, gambar, atau teks ringkas yang harus diamati/dibaca, lalu berikan pertanyaan pemahaman (minimal 3 soal).
●   Mengaplikasikan: buat tugas kasus nyata yang sesuai konteks kehidupan siswa, berikan instruksi kerja yang jelas, dan ruang jawaban siswa.
●   Merefleksikan: berikan pertanyaan refleksi (2–3 soal) yang menuntun siswa untuk meninjau proses belajarnya, kesulitan yang dihadapi, serta rencana perbaikan atau tindak lanjut.
●   Bagian Penutup: ucapan penyemangat, catatan guru (opsional), serta kolom cek pemahaman diri siswa (checklist atau skala sederhana). Sintaks pembelajaran dan pengalaman belajar mendalam diintegrasikan menjadi satu dan ditampilkan tidak dalam bentuk tabel.
Gunakan bahasa yang komunikatif, sesuai jenjang, dan dorong pembelajaran aktif, bermakna, berkesadaran, dan menggembirakan. LKPD harus muncul secara utuh dengan isi yang lengkap, bukan hanya berupa kerangka atau daftar isi.

Output: Buat outputnya dalam bentuk file word (docx) yang rapi siap pakai tanpa perlu edit kembali dengan orientasi potrait siap download langsung`
    }
  ];
}

export interface DeepLearning1PertemuanPromptInput {
  penyusun?: string;
  sekolah?: string;
  tahunAjaran?: string;
  semester?: string;
  mataPelajaran?: string;
  kelasFase?: string;
  topik?: string;
  alokasiWaktu?: string;
  cpText?: string;
  kepalaSekolah?: string;
}

/**
 * 7d. Deep Learning RPM 1 Pertemuan (2x40 Menit) Prompts
 * Sesuai Dokumen Template Versi 2 Modul Ajar Pembelajaran Mendalam (PDF)
 */
export function getDeepLearning1PertemuanPrompts(
  topicOrData?: string | DeepLearning1PertemuanPromptInput
): PromptTabDefinition[] {
  const data: DeepLearning1PertemuanPromptInput = typeof topicOrData === 'string'
    ? { topik: topicOrData }
    : (topicOrData || {});

  const penyusunVal = data.penyusun || 'Lendi Ike Hermawan, S.Pd., Gr.';
  const sekolahVal = data.sekolah || 'SD Negeri Kalimantong';
  const tahunAjaranVal = data.tahunAjaran || '2026/2027';
  const semesterVal = data.semester || '1';
  const mapelVal = data.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
  const kelasFaseVal = data.kelasFase || 'Kelas VII / Fase D';
  const topikVal = data.topik || 'Keterampilan Variasi Gerak Spesifik Permainan Bola Voli';
  const alokasiVal = data.alokasiWaktu || '2 × 40 Menit (1 Pertemuan)';
  const cpVal = data.cpText || `Peserta didik mampu mempraktikkan keterampilan variasi dan kombinasi gerak spesifik, memahami konsep mekanika gerak, serta membiasakan gaya hidup aktif dan bugar secara mindful, meaningful, dan joyful.`;
  const kepsekVal = data.kepalaSekolah || 'Soleh, S.Pd., M.Pd.';

  return [
    {
      id: 'rpm_1_pertemuan_lendi',
      label: 'Format Standar RPM 1 Pertemuan (Word Ready)',
      description: 'Sesuai format baku template Modul Ajar Pembelajaran Mendalam 1 Pertemuan (2x40 Menit) lengkap tabel 2 kolom & lampiran instrumen asesmen dan LKPD terstruktur.',
      prompt: `Prompt Manyusun Perencanaan Pembelajaran Mendalam Menggunakan Claude, Gemini, ChatGPT, dll
Penyusun: ${penyusunVal}

Petunjuk: Ganti Bagian yang berwarna kuning sesuai kebutuhan masing-masing

Tuliskan Perencanaan Pembelajaran Mendalam (RPM) dengan struktur format berikut dalam bentuk tabel:

A. Identitas
Penyusun: ${penyusunVal}
Sekolah: ${sekolahVal}
Tahun Ajaran: ${tahunAjaranVal}
Semester: ${semesterVal}
Mata Pelajaran: ${mapelVal}
Kelas/Fase Capaian: ${kelasFaseVal}
Topik: ${topikVal}
Alokasi Waktu: ${alokasiVal}

B. Identifikasi
Identifikasi Murid (uraikan pengetahuan awal, minat belajar, kebutuhan belajar).
Materi Pelajaran (faktual, konseptual, prosedural, metakognitif).
Dimensi Profil Lulusan (pilih dimensi yang sesuai yaitu keimanan dan ketakwaan kepada Tuhan Yang Maha Esa, kewargaan, penalaran kritis, kreativitas, kolaborasi, kemandirian, kesehatan, atau komunikasi).

C. Desain Pembelajaran
Capaian Pembelajaran: ${cpVal}
Lintas Disiplin Ilmu
Tujuan Pembelajaran (berdasarkan capaian pembelajaran, tuliskan tujuan pembelajaran yang merinci kompetensi yang harus dikuasai murid dalam satu pertemuan sesuai alokasi waktu diatas mencakup level kognitif mengingat/memahami/menerapkan/menganalisis/merefleksi/mencipta. Buatkan 2-3 Tujuan pembelajaran).
Topik Pembelajaran: ${topikVal}
Praktik Pedagogis (Tuliskan Pendekatan Pembelajaran Mendalam, Model (Tuliskan juga sintaks/Langkah-langkahnya), Metode yang digunakan)
Kemitraan Pembelajaran
Lingkungan Pembelajaran
Pemanfaatan Digital

D. Pengalaman Belajar
Buatkan secara ringkas dan jelas langkah kegiatan awal dengan durasi 15 menit berdasarkan tujuan pembelajaran diatas, Susunlah kegiatan awal yang menerapkan prinsip pembelajaran berkesadaran, bermakna, dan menggembirakan. Prinsip tidak harus ketiganya. Kegiatan ini mencakup apersepsi, motivasi, dan pengkondisian yang membangun semangat serta keterhubungan dengan pengalaman siswa. Awali dengan mengucap salam kemudian kegiatan berdoa dan mengecek kehadiran. Identifikasi prinsip pembelajaran yang digunakan misal berkesadaran, bermakna, menggembirakan
Buatkan Langkah-langkah kegiatan inti dengan durasi 60 menit berdasarkan tujuan pembelajaran diatas Prinsip pembelajaran yang digunakan tetap mindful (berkesadaran), meaningful (bermakna), dan joyful (menggembirakan) agar murid aktif menggali makna dari materi. Identifikasi prinsip pembelajaran yang digunakan misal berkesadaran, bermakna, menggembirakan. Prinsip Pembelajaran yang digunakan ditulis di awal Setiap Kegiatan sebelum ke rincian aktivitas. Buatkan aktivitas pembelajaran pada pembelajaran mendalam dengan tahapan sebagai berikut:
Memahami
Mengaplikasikan
Merefleksi.
Aktifitas pembelajaran yang memuat memahami, mengaplikasikan, merefleksi memiliki kaitan dengan sintaks pembelajaran lengkap (sesuai model pembelajaran pada praktik pedagogis) dan juga memuat metode pembelajaran sesuai pada praktik pedagogis. Sintaks pembelajaran diintegrasikan dengan pengalaman belajar dan dituliskan setelah pengalaman belajar dan diberi batas dengan tanda kurung (misal Memahami (Orientasi pada masalah) (20 Menit)). Kegiatan pembelajaran inti untuk menggali Dimensi Profil Lulusan (DPL) sesuai dengan yang ada diatas. DPL dituliskan diakhir kalimat pada aktivitas dengan diberi tanda kurung. Topik pembelajaran sesuai dengan diatas. Ketentuan pengembangan:
Setiap tahap mencantumkan estimasi waktu.
Setiap tahap diuraikan menjadi beberapa poin bernomor (minimal 4 poin aktivitas).
Setiap poin menjelaskan aktivitas konkret guru dan/atau Murid.
Gunakan bahasa formal, dan sistematis.
Format yang diharapkan:
[Nama Tahap Pembelajaran] (Sintaks Model) (Estimasi Waktu)
…
…
…
…
Buatkan secara ringkas dan jelas langkah kegiatan penutup dengan durasi 5 menit berdasarkan tujuan pembelajaran diatas. Penutup pembelajaran dilakukan dengan menyimpulkan materi, memberikan umpan balik, merencanakan kegiatan selanjutnya dan doa kemudian diakhiri salam. Identifikasi prinsip pembelajaran yang digunakan misal berkesadaran, bermakna, menggembirakan.

E. Asesmen Pembelajaran
Awal (tuliskan jenis, Bentuk dan Teknik asesmen yang digunakan)
Proses (tuliskan jenis, Bentuk dan Teknik asesmen yang digunakan)
Akhir (tuliskan jenis, Bentuk dan Teknik asesmen yang digunakan)

Tuliskan Tanda Tangan Kepala Sekolah bernama ${kepsekVal}
Dan tanda tangan guru mapel ${penyusunVal}

Lampiran (Terpisah dengan Tabel RPP):
Lampiran berikut berdasarkan asesmen awal, proses, dan akhir diatas:
1. Asesmen Diagnostik Non Kognitif: Tabel pertanyaan (Apa kabar hari ini?, Apakah ada yang sakit?, Apakah kalian sehat?, Apakah anak-anak bersemangat?) dengan pilihan jawaban Ya / Tidak.
2. Soal Asesmen Awal: 5 soal lisan/essay/uraian/pilihan ganda + kunci jawaban.
3. Asesmen Formatif:
   - Penjelasan Diskusi, Presentasi, Unjuk Kerja.
   - Tabel Format Penilaian Formatif (No, Nama Peserta Didik, SKOR 1-5, Total Skor, Nilai).
   - Rubrik Penilaian Deskripsi Umum (Skor 5: Sangat aktif, 4: Aktif, 3: Cukup aktif, 2: Kurang aktif, 1: Tidak menunjukkan partisipasi).
4. Instrumen Penilaian Sikap:
   - Sikap Spiritual (Teknik Penilaian Diri, Rubrik 4 skala SL, SR, KD, TP)
   - Sikap Sosial (Teknik Penilaian Antar Teman, Rubrik 4 skala SL, SR, KD, TP)
   - Nilai Akhir = (Jumlah skor diperoleh / 16) x 100
5. Instrumen Penilaian Pengetahuan:
   - Penilaian Kelompok Pengerjaan LKPD (Tabel 4 Aspek Penilaian: Kelengkapan Jawaban, Ketepatan Konsep, Penyajian Data/Praktik, Refleksi/Pemahaman Aplikatif)
   - Pedoman Skor 1-4 (Sangat Baik, Baik, Cukup, Kurang)
   - Nilai Akhir = (Jumlah skor diperoleh / 16) x 100
6. Instrumen Penilaian Keterampilan:
   - Penilaian Hasil Unjuk Kerja Kelompok (Tabel 4 Aspek: Penyusunan/Praktik, Penjelasan Proses, Kerja Sama, Kreativitas Penyajian)
   - Pedoman Skor 1-4 (Sangat Baik, Baik, Cukup, Kurang)
   - Nilai Akhir = (Jumlah skor diperoleh / 16) x 100
7. Pengayaan dan Remedial:
   - Remedial: Tujuan dan strategi (Pendekatan Kontekstual, Bimbingan Terstruktur, Latihan Bertahap, Bimbingan Sebaya)
   - Pengayaan: Tujuan dan strategi (Membuat Soal Sendiri, Diskusi Lintas Kelompok, Kegiatan Tantangan)
8. Refleksi Guru dan Peserta Didik:
   - Refleksi Guru (Tabel 3 aspek: Penguasaan Materi, Penyampaian Materi, Umpan Balik)
   - Refleksi Peserta Didik
9. Materi Ajar Ringkas dan Jelas

Tampilkan dalam bentuk tabel mulai dari identitas, identifikasi, pengalaman belajar, hingga asesmen pembelajaran (tabel dua kolom dengan rincian kolom pertama untuk menuliskan komponen sesuai struktur dan kolom kedua isi RPP).

Buatkan Lembar Kerja Peserta Didik (LKPD) yang lengkap dan terstruktur berdasarkan sintaks pembelajaran diatas, dengan topik diatas.
LKPD harus mencakup bagian-bagian berikut secara lengkap:
1. Identitas diri di LKPD: nama peserta didik, mata pelajaran, no absen, kelas, tanggal
2. Petunjuk penggunaan LKPD: berisi instruksi langkah-langkah mengerjakan, alat yang dibutuhkan, dan cara menjawab.
3. Sintaks Pembelajaran, tuliskan tahapan kegiatan belajar sesuai sintaks, lalu berikan aktivitas siswa dan kolom untuk siswa mengerjakan.
4. Pengalaman Belajar Mendalam, mencakup:
   ● Memahami: sajikan materi, gambar, atau teks ringkas yang harus diamati/dibaca, lalu berikan pertanyaan pemahaman (minimal 3 soal).
   ● Mengaplikasikan: buat tugas kasus nyata yang sesuai konteks kehidupan siswa, berikan instruksi kerja yang jelas, dan ruang jawaban siswa.
   ● Merefleksikan: berikan pertanyaan refleksi (2–3 soal) yang menuntun siswa untuk meninjau proses belajarnya, kesulitan yang dihadapi, serta rencana perbaikan atau tindak lanjut.
   ● Bagian Penutup: ucapan penyemangat, catatan guru (opsional), serta kolom cek pemahaman diri siswa (checklist atau skala sederhana). Sintaks pembelajaran dan pengalaman belajar mendalam diintegrasikan menjadi satu dan ditampilkan tidak dalam bentuk tabel.
Gunakan bahasa yang komunikatif, sesuai jenjang, dan dorong pembelajaran aktif, bermakna, berkesadaran, dan menggembirakan. LKPD harus muncul secara utuh dengan isi yang lengkap.

Output: Buat outputnya dalam bentuk file word (docx) yang rapi siap pakai tanpa perlu edit kembali dengan orientasi potrait siap download langsung`
    }
  ];
}

/**
 * 8. Absensi & Penilaian Prompts
 */
export function getAbsensiPenilaianPrompts(className?: string, studentCount?: number): PromptTabDefinition[] {
  return [
    {
      id: 'catatan_rapor',
      label: 'Generator Narasi Deskripsi Rapor',
      description: 'Membuat narasi capaian kompetensi rapor otomatis berdasarkan capaian TP tertinggi dan TP yang perlu bimbingan.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Buatlah bank kalimat deskripsi Rapor Kurikulum Merdeka untuk mata pelajaran PJOK (Rentang 25 - 45 kata per siswa):
- Kelas: ${className || 'Kelas PJOK'}

Sediakan contoh deskripsi untuk 3 profil siswa:
1. Siswa Berprestasi Tinggi: "Menunjukkan penguasaan sangat baik dalam mempraktikkan variasi pola gerak dasar lokomotor dan manipulatif serta konsisten menunjukkan sportivitas tinggi."
2. Siswa Berkembang Sesuai Harapan: "Menunjukkan penguasaan baik dalam konsep gerak dan kebugaran jasmani, perlu sedikit latihan konsistensi dalam servis bola voli."
3. Siswa Perlu Bimbingan: "Mampu memahami konsep hidup sehat, namun masih memerlukan pendampingan dalam koordinasi gerak lari estafet dan keseimbangan senam lantai."`
    },
    {
      id: 'analisis_kehadiran',
      label: 'Surat Komunikasi Walikelas / Orang Tua',
      description: 'Draf naskah pesan WhatsApp / surat resmi pemantauan kebugaran dan kehadiran siswa.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Susunlah draf pesan komunikasi santun dan suportif dari Guru PJOK kepada Orang Tua / Wali Siswa mengenai:
1. Sosialisasi pentingnya sarapan sehat sebelum jam pelajaran olahraga pagi.
2. Pengingat pemakaian pakaian olahraga lengkap dan membawa botol air minum pribadi (hidrasi).
3. Penjelasan bagi siswa yang sakit atau tidak dapat mengikuti aktivitas fisik berat dengan opsi tugas pengganti literasi kesehatan.`
    }
  ];
}

/**
 * 8b. Presensi Mingguan PJOK (1 Bulan) Prompts
 */
export function getAbsensiMingguanPjokPrompts(
  className?: string, 
  monthName?: string, 
  year?: number, 
  topics?: string[]
): PromptTabDefinition[] {
  const materiStr = topics && topics.length > 0 ? topics.join('; ') : 'Kebugaran Jasmani dan Permainan Gerak Dasar';
  return [
    {
      id: 'analisis_kehadiran_pjok',
      label: 'Analisis Partisipasi & Kebugaran Mingguan',
      description: 'Menganalisis keterlibatan gerak, kepatuhan pakaian olahraga, dan ketidakhadiran siswa dalam 1 bulan.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Lakukan telaah dan analisis pedagogis terhadap data presensi mingguan mata pelajaran PJOK:
- Rombel / Kelas: ${className || 'Kelas PJOK SD'}
- Periode: Bulan ${monthName || 'Bulan Berjalan'} ${year || 2026}
- Materi / Topik Pertemuan 1 s.d. 4-5 Pekan: ${materiStr}

INSTRUKSI ANALISIS:
1. Evaluasi tingkat kehadiran siswa dalam aktivitas fisik lapangan (apakah siswa antusias mengikuti materi praktik mingguan).
2. Tinjauan kepatuhan seragam olahraga: dampak siswa yang tidak berseragam lengkap terhadap keselamatan (safety) dan kenyamanan gerak.
3. Rekomendasi solusi bagi siswa yang berstatus Sakit (S) atau Dispensasi fisik agar tetap mendapatkan nilai pemahaman gerak tanpa membahayakan kondisi kesehatannya.
4. Susun 3 tips motivasi gerak seru untuk pertemuan pekan berikutnya.`
    },
    {
      id: 'dispensasi_adaptif',
      label: 'Panduan Modifikasi Siswa Sakit/Dispensasi',
      description: 'Strategi penugasan alternatif yang edukatif bagi siswa yang tidak dapat beraktivitas fisik berat.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Rancanglah panduan tugas alternatif & asesmen adaptif bagi siswa PJOK yang memiliki keterangan Sakit (S), Izin Sakit Ringan, atau Dispensasi Cedera fisik:
1. Peran Pengamat / Juri Teman Sebaya (Peer Assessor): Siswa bertugas mengamati teknik teman sekelas dengan lembar ceklis sederhana.
2. Peran Asisten Pencatat Skor & Waktu: Siswa mencatat waktu lari atau skor permainan kasti/voli.
3. Tugas Literasi Gerak: Ringkasan singkat aturan permainan dan pentingnya pemanasan/pendinginan.
4. Tips komunikasi empati guru agar siswa tidak merasa dikucilkan saat tidak bisa berlari di lapangan.`
    },
    {
      id: 'laporan_bulanan_pjok',
      label: 'Laporan Pembelajaran Mingguan ke Kepala Sekolah',
      description: 'Format naskah laporan kedinasan rekapitulasi keterlaksanaan jam tatap muka PJOK sebulan.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Susunlah naskah laporan bulanan keterlaksanaan mata pelajaran PJOK kepada Kepala Sekolah:
- Rombel: ${className || 'Kelas PJOK'}
- Bulan / Tahun: ${monthName || 'Bulan Berjalan'} ${year || 2026}
- Rincian Pertemuan: 4 s.d. 5 Pekan Tatap Muka Lapangan

FORMAT DOKUMEN:
1. Pendahuluan (Ketercapaian Alokasi Waktu 3-4 JP per minggu).
2. Rekapitulasi Kehadiran & Partisipasi Siswa (Persentase Hadir, Sakit, Izin, Alpa).
3. Catatan Penggunaan Sarana & Prasarana Lapangan (Bola, Matras, Kerucut/Cone, Lapangan).
4. Catatan Keselamatan Siswa (Zero accident / Penanganan cedera ringan).
5. Tanda tangan resmi pelaporan oleh Guru Pengampu PJOK.`
    }
  ];
}

/**
 * 8c. Rekapitulasi Presensi 1 Semester PJOK Prompts
 */
export function getRekapSemesterPjokPrompts(
  className?: string,
  semester?: number,
  tahunAjaran?: string,
  avgAttendancePercent?: number,
  totalJp?: number
): PromptTabDefinition[] {
  return [
    {
      id: 'analisis_semester_pjok',
      label: 'Evaluasi & Refleksi Kehadiran 1 Semester',
      description: 'Analisis komprehensif kehadiran lapangan, kepatuhan seragam, dan pemenuhan alokasi JP PJOK semester.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Lakukan analisis evaluasi akhir semester terhadap keterlaksanaan dan kehadiran pembelajaran PJOK:
- Rombongan Belajar: ${className || 'Kelas PJOK SD'}
- Semester: Semester ${semester === 1 ? '1 (Ganjil)' : '2 (Genap)'}
- Tahun Ajaran: ${tahunAjaran || '2026/2027'}
- Rata-rata Kehadiran Kelas: ${avgAttendancePercent || 92}%
- Total Alokasi JP Terealisasi: ${totalJp || 54} JP

INSTRUKSI ANALISIS:
1. Tinjau konsistensi kehadiran peserta didik selama 6 bulan dalam mengikuti aktivitas fisik lapangan.
2. Analisis tren ketidakhadiran (apakah ada bulan-bulan tertentu dengan lonjakan sakit akibat pergantian musim cuaca/hujan).
3. Evaluasi kepatuhan tata tertib berpakaian olahraga dan dampaknya terhadap keselamatan gerak siswa.
4. Rancang 3 strategi taktis untuk mempertahankan kebugaran dan meminimalkan angka ketidakhadiran di semester berikutnya.`
    },
    {
      id: 'deskripsi_rapor_kebugaran',
      label: 'Perumusan Kalimat Rapor Semester (Kehadiran & Disiplin Fisik)',
      description: 'Menyusun narasi deskripsi capaian rapor Kurikulum Merdeka terkait keaktifan fisik dan kehadiran semester.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Susunlah 4 tingkatan narasi deskripsi Rapor Kurikulum Merdeka aspek Kehadiran, Partisipasi Gerak, dan Kebiasaan Hidup Sehat untuk 1 Semester:
- Mata Pelajaran: PJOK
- Kelas: ${className || 'Kelas PJOK SD'}

FORMAT NARASI:
1. Kategori Sangat Baik (Kehadiran 95-100%): "Sangat aktif, bersemangat dan konsisten mempraktikkan gaya hidup aktif serta disiplin mengenakan seragam olahraga di setiap pertemuan lapangan."
2. Kategori Baik (Kehadiran 80-94%): "Menunjukkan partisipasi baik dalam sebagian besar aktivitas gerak lapangan dan mampu bekerja sama dengan sportif bersama teman."
3. Kategori Cukup (Kehadiran 70-79%): "Cukup aktif dalam aktivitas fisik, perlu meningkatkan kedisiplinan kehadiran dan kelengkapan pakaian olahraga."
4. Kategori Perlu Bimbingan (< 70% atau sering izin/sakit): "Perlu motivasi lebih dalam menjaga kebugaran jasmani dan pendampingan orang tua terkait kontinuitas kehadiran jam PJOK."`
    },
    {
      id: 'laporan_semester_kepsek',
      label: 'Laporan Keterlaksanaan Semester ke Kepala Sekolah & Pengawas',
      description: 'Naskah dinas laporan pertanggungjawaban keterlaksanaan kurikulum PJOK selama 1 semester.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Buatlah naskah Laporan Akhir Semester Keterlaksanaan Pembelajaran PJOK kepada Kepala Sekolah dan Pengawas Pembina:
- Sekolah: SD Negeri Kalimantong
- Rombel: ${className || 'Kelas PJOK'}
- Periode: Semester ${semester === 1 ? '1 (Ganjil)' : '2 (Genap)'} T.A. ${tahunAjaran || '2026/2027'}

STRUKTUR DOKUMEN:
1. Dasar Pelaksanaan (Kurikulum Merdeka PJOK & Standar Alokasi Jam Mengajar 3 JP/pekan).
2. Ketercapaian Alokasi Waktu Tatap Muka (Persentase keterlaksanaan materi lapangan vs teori kelas).
3. Rekapitulasi Kehadiran Kolektif (Hadir: %, Sakit: %, Izin: %, Alpa: %).
4. Kondisi Sarana Prasarana Olahraga (Alat bola, matras, lapangan) dan Insiden Keselamatan (Zero Accident).
5. Rekomendasi Pengadaan Sarana PJOK Semester Mendatang.
6. Kolom Tanda Tangan Guru Pengampu PJOK dan Mengetahui Kepala Sekolah.`
    }
  ];
}

/**
 * 9. Jurnal Harian Prompts
 */
export function getJurnalPrompts(journalCount?: number): PromptTabDefinition[] {
  return [
    {
      id: 'refleksi_jurnal',
      label: 'Refleksi Pedagogis Guru PJOK',
      description: 'Menyusun catatan reflektif pembelajaran di lapangan untuk dokumen evaluasi kinerja.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Susunlah format refleksi jurnal mengajar harian guru PJOK yang tajam dan profesional:
Memuat 4 kuadran reflektif:
1. Keberhasilan (What went well): Aktivitas apa yang paling memicu partisipasi aktif siswa di lapangan hari ini?
2. Hambatan Lapangan (Challenges): Faktor cuaca panas, keterbatasan alat bola, atau perselisihan sportivitas antar siswa.
3. Penanganan Langsung (Action taken): Solusi cepat yang diambil guru saat situasi terjadi.
4. Rencana Perbaikan Pekan Depan (Next steps): Penyesuaian modul atau penambahan variasi game.`
    }
  ];
}

/**
 * 10. Rubrik Fisik AI Prompts
 */
export function getRubrikFisikPrompts(materi?: string): PromptTabDefinition[] {
  return [
    {
      id: 'rubrik_gerak',
      label: 'Rubrik Tes Gerak Otentik & TKJI',
      description: 'Rubrik evaluasi biomekanika gerak cabang olahraga dan tes kebugaran jasmani.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Susunlah Rubrik Penilaian Kinerja Praktik (Psychomotor Authentic Rubric) untuk cabang:
- Materi / Cabang Olahraga: ${materi || 'Keterampilan Dasar Sepakbola / Bola Voli / Senam / Atletik'}

KRITERIA ASESMEN:
1. Tahap Persiapan (Sikap Awal): Keseimbangan tubuh, pandangan mata, posisi tumpuan kaki.
2. Tahap Pelaksanaan (Gerakan Inti): Koordinasi tungkai dan lengan, titik perkenaan bola/alat, transfer tenaga.
3. Tahap Akhir (Follow-Through): Gerak lanjutan, pemulihan keseimbangan tubuh.
4. Format Skor: 1 (Kurang), 2 (Cukup), 3 (Baik), 4 (Sangat Baik) lengkap dengan deskriptor operasional.`
    }
  ];
}

/**
 * 11. Slide PPT & Materi Ajar Prompts
 */
export function getSlideMateriPrompts(title?: string): PromptTabDefinition[] {
  return [
    {
      id: 'outline_slide',
      label: 'Outline Naskah Slide Presentasi (10 Slide)',
      description: 'Naskah slide presentasi visual siap salin ke PowerPoint / Gamma App / Canva.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Susun naskah slide presentasi edukasi interaktif untuk siswa dengan materi:
- Judul: ${title || 'Pola Hidup Sehat & Kebugaran Jasmani PJOK'}

STRUKTUR 10 SLIDE:
- Slide 1: Judul Keren & Maskot PJOK
- Slide 2: Pertanyaan Pemantik / Tebak Gambar
- Slide 3: Mengapa Tubuh Kita Butuh Bergerak?
- Slide 4: Konsep Gerak Inti (Anatomi & Prinsip Fisik Sederhana)
- Slide 5: Langkah Praktik 1-2-3 (Visual Step)
- Slide 6: Kesalahan Umum yang Sering Terjadi di Lapangan
- Slide 7: Tips Keselamatan & Pencegahan Cedera
- Slide 8: Kuis Kilat 3 Soal Interaktif (Benar/Salah)
- Slide 9: Tantangan Gerak di Rumah (Home Movement Challenge)
- Slide 10: Pesan Motivasi Juara & Penutup`
    }
  ];
}

/**
 * 12. LKPD Gambar Prompts
 */
export function getLkpdPrompts(title?: string): PromptTabDefinition[] {
  return [
    {
      id: 'desain_lkpd',
      label: 'Lembar Kerja Praktik Siswa Berdiferensiasi',
      description: 'Merancang format lembar kerja peserta didik yang visual, interaktif, dan memuat tugas gerak lapangan.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Rancang naskah Lembar Kerja Peserta Didik (LKPD) PJOK Kurikulum Merdeka yang ramah anak:
- Materi: ${title || 'Aktivitas Kebugaran & Permainan Tradisional'}

BAGIAN LKPD:
1. Misi Gerak (Story-based Mission): Ubah tugas fisik menjadi misi petualangan pahlawan kebugaran.
2. Gambar & Bagan Pos Lapangan: Instruksi per pos gerak (Pos A, Pos B, Pos C).
3. Lembar Pengamatan Teman Sebaya (Peer-Assessment): Checklist sederhana apakah teman sudah melakukan gerak dengan benar.
4. Refleksi Emotikon: Kolom ekspresi wajah (Senang, Lelah tapi Bangga, Perlu Belajar Lagi).`
    }
  ];
}

/**
 * 12b. Ubah LKPD Menjadi Gambar Interaktif (A4 Portrait) Prompts
 */
export function getLkpdToImagePrompts(rawText?: string, metadata?: { mataPelajaran?: string; kelas?: string; topik?: string; gayaDesain?: string; }): PromptTabDefinition[] {
  const content = rawText && rawText.trim().length > 0 ? rawText : '{MASUKKAN ISI LKPD DISINI}';
  const mapel = metadata?.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
  const kls = metadata?.kelas || '4 SD';
  const tpk = metadata?.topik || 'Kombinasi Pola Gerak Dasar & Kebugaran';
  const gaya = metadata?.gayaDesain || 'Modern Clean Edukatif';

  return [
    {
      id: 'ubah_lkpd_gambar',
      label: 'Prompt Ubah LKPD Jadi Gambar A4',
      description: 'Master prompt standar untuk mengubah naskah teks LKPD menjadi LKPD bergambar interaktif ukuran A4 Portrait (21 cm x 29,7 cm).',
      prompt: `PROMPT UBAH LKPD MENJADI LEBIH MENARIK

Anda adalah seorang desainer pembelajaran profesional sekaligus ahli dalam mengembangkan LKPD interaktif berbasis visual untuk peserta didik. Tugas Anda adalah mengubah LKPD pada lampiran berikut menjadi LKPD bergambar interaktif dengan ukuran A4 (21 cm x 29,7 cm) orientasi portrait (Hasil Akhir Bentuk Gambar). LKPD harus didesain dengan gaya modern, clean, edukatif, serta ramah siswa, menggunakan warna yang cerah namun tetap nyaman di mata. Desain harus memanfaatkan ilustrasi, ikon, dan elemen visual interaktif agar lebih menarik dan mudah dipahami sesuai dengan jenjang peserta didik.
Penting: seluruh isi teks, soal, instruksi, dan materi dalam LKPD harus dipertahankan 100% sama persis dengan file asli tanpa ada pengurangan, penambahan, ataupun perubahan redaksi. Tugas Anda hanya mengubah tampilan menjadi lebih visual, menarik, dan interaktif tanpa mengubah isi kontennya. Ubah penyajiannya menjadi lebih interaktif, seperti menggunakan kotak jawaban yang menarik, ikon pendukung, garis atau panah untuk mencocokkan, serta penguatan visual berupa ilustrasi atau diagram sederhana yang relevan. Gunakan elemen visual seperti ikon (📌, ✏️, 💡, 🔍), highlight warna pada poin penting, serta ruang eksplorasi yang tetap mempertahankan isi jawaban yang diminta. Bahasa tidak boleh diubah, namun tampilannya dibuat lebih engaging dan mudah dibaca.
Hasil akhir LKPD harus memiliki tata letak yang rapi, proporsional, tidak terlalu padat, serta memiliki variasi desain di setiap bagian agar tidak monoton, sehingga hasil akhir lebih menarik dan sesuai dengan karakter siswa generasi Gen Z.
Buatkan hasil akhirnya langsung dalam bentuk file gambar.

Data LKPD:
- Mata Pelajaran: ${mapel}
- Kelas: ${kls}
- Topik: ${tpk}
- Gaya Desain: ${gaya}
- Ukuran: A4 Portrait (21 cm x 29,7 cm)

Lampiran LKPD:
${content}`
    }
  ];
}

/**
 * 13. Cover Sampul Prompts
 */
export function getCoverPrompts(): PromptTabDefinition[] {
  return [
    {
      id: 'dalle_cover_prompt',
      label: 'Prompt AI Generator Gambar Cover (Midjourney / DALL-E)',
      description: 'Prompt bahasa Inggris detail untuk menghasilkan gambar sampul ilustrasi PJOK modern tanpa teks.',
      prompt: `Prompt Gambar AI (Salin ke Midjourney / DALL-E / Bing Image Creator):

"A vibrant, high-resolution vector illustration of Indonesian school students (elementary to middle school boys and girls) happily participating in dynamic physical education activities, playing sports on an outdoor sports field under morning sunlight. Modern Indonesian school sport uniforms in green and white colors, bright tropical trees in the background, joyful facial expressions, clean minimalist educational cover art style, cinematic lighting, ultra-detailed, flat design with rich depth, 8k resolution, aspect ratio 3:4 --v 6.0 --no text letters"`
    }
  ];
}

/**
 * 14. Ulangan Harian & Rekap Nilai TP Prompts
 */
export function getUlanganHarianPrompts(materi?: string): PromptTabDefinition[] {
  return [
    {
      id: 'kisi_ulangan',
      label: 'Kisi-Kisi & Soal Ulangan Harian PJOK',
      description: 'Paket ulangan harian: 10 PG HOTS, 5 Isian Singkat, dan 1 Penugasan Praktik Lapangan.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Susunlah paket Ulangan Harian PJOK Kurikulum Merdeka:
- Materi: ${materi || 'Kebugaran Jasmani & Pola Hidup Sehat'}
- Bentuk: 10 Soal Pilihan Ganda (berbasis stimulus situasi nyata), 5 Soal Isian Singkat, dan 1 Rubrik Penugasan Praktik.
- Kunci Jawaban Lengkap dan Pembahasan Pedagogis.`
    }
  ];
}

/**
 * 14b. Rekap Nilai Harian per TP 1 Semester Prompts
 */
export function getRekapNilaiTpPrompts(
  className?: string,
  grade?: number,
  semester?: number,
  classAverage?: number,
  kktp?: number,
  tpListStr?: string
): PromptTabDefinition[] {
  return [
    {
      id: 'analisis_rekap_semester',
      label: 'Analisis Evaluasi Nilai 1 Semester',
      description: 'Analisis komprehensif ketuntasan TP, nilai harian, dan rekomendasi tindak lanjut.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Lakukan telaah dan analisis komprehensif terhadap Laporan Rekapitulasi Nilai Harian per Tujuan Pembelajaran (TP) 1 Semester:
- Rombel / Kelas: ${className || 'Kelas PJOK SD'} (Kelas ${grade || 1})
- Semester: Semester ${semester === 1 ? '1 (Ganjil)' : '2 (Genap)'}
- Batas Ketuntasan KKTP: ${kktp || 70}
- Rata-rata Nilai Akhir Kelas: ${classAverage || 78}
- Daftar Tujuan Pembelajaran (TP) Semester:
${tpListStr || '1. Gerak Dasar Lokomotor; 2. Gerak Dasar Non-Lokomotor; 3. Kebugaran Jasmani'}

INSTRUKSI ANALISIS:
1. Evaluasi pencapaian kompetensi: Tujuan Pembelajaran (TP) mana yang memiliki tingkat ketuntasan tertinggi dan terendah.
2. Analisis korelasi antara Nilai Harian Praktik Lapangan, Teori Pemahaman, dan Nilai Sumatif Akhir Semester (SAS).
3. Rancang rencana tindak lanjut pembinaan kebugaran dan teknik gerak untuk semester berikutnya.`
    },
    {
      id: 'narasi_rapor_kurmer',
      label: 'Panduan Narasi Deskripsi Rapor Kurikulum Merdeka',
      description: 'Standar perumusan narasi capaian tertinggi & terendah rapor semester PJOK.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Berikan panduan dan bank kalimat narasi deskripsi Rapor Kurikulum Merdeka bidang PJOK Semester ${semester === 1 ? '1 (Ganjil)' : '2 (Genap)'}:
- Kelas: ${className || 'Kelas SD'}
- Standar KKTP: ${kktp || 70}

Sertakan:
1. Formula baku narasi capaian optimal (Kategori Sangat Baik / Nilai 90-100).
2. Formula baku narasi capaian berkembang baik (Kategori Baik / Nilai 80-89).
3. Formula baku narasi perlu penguatan/bimbingan (Kategori Kurang / Nilai < 70).
4. Contoh deskripsi konkret yang menggabungkan aspek keterampilan gerak fisik dan sikap sportivitas.`
    },
    {
      id: 'program_remedial_pengayaan',
      label: 'Program Remedial & Pengayaan Berbasis TP',
      description: 'Desain program perbaikan dan pengayaan praktis untuk siswa di bawah dan di atas KKTP.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Rancanglah draf resmi Program Remedial dan Pengayaan Hasil Asesmen Harian per TP PJOK:
- Tingkat: Kelas ${grade || 1} SD Semester ${semester === 1 ? '1' : '2'}
- Kriteria KKTP: ${kktp || 70}

FORMAT DOKUMEN:
1. Rencana Remedial: Pendampingan tutor sebaya, modifikasi alat/lapangan, dan tes ulang berbasis performa.
2. Rencana Pengayaan: Pemberian tantangan gerak kombinasi yang lebih dinamis dan peran kepemimpinan mini (kapten regu).
3. Format tabel monitoring pelaksanaan remedial & pengayaan beserta tanggal dan paraf guru.`
    }
  ];
}

/**
 * 15. Kode Etik, KKO & Cetak Laporan Prompts
 */
export function getKodeEtikKkoCetakPrompts(menuName: string): PromptTabDefinition[] {
  return [
    {
      id: 'prompt_menu',
      label: `Panduan Profesional ${menuName}`,
      description: `Rekomendasi implementasi praktis nilai-nilai profesionalisme guru PJOK.`,
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Berikan telaah dan panduan profesional untuk Guru PJOK terkait topik:
"${menuName}"

Sertakan:
1. Prinsip Etika & Keamanan di Lapangan Olahraga Sekolah.
2. Strategi keteladanan guru dalam membina karakter sportivitas siswa.
3. Keterkaitan langsung dengan standar kompetensi guru dan Kurikulum Merdeka.`
    }
  ];
}

/**
 * 16. Jurnal Harian Kegiatan Pembelajaran Guru (Satu Mata Pelajaran) Prompts
 */
export function getJurnalSatuMapelPrompts(params: {
  mataPelajaran?: string;
  namaSekolah?: string;
  tahunPelajaran?: string;
  tujuanKelas7?: string;
  tujuanKelas8?: string;
  tujuanKelas9?: string;
  jadwalMingguan?: string;
  rentangJadwal?: string;
  catatanTambahan?: string;
}): PromptTabDefinition[] {
  const mapel = params.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
  const sekolah = params.namaSekolah || 'SD Negeri Kalimantong';
  const tahun = params.tahunPelajaran || '2026/2027';
  const tp7 = params.tujuanKelas7 || 'Mempraktikkan dan menganalisis gerak spesifik passing bawah dan passing atas permainan bola voli, serta kebugaran jasmani';
  const tp8 = params.tujuanKelas8 || 'Mempraktikkan dan menganalisis variasi dan kombinasi gerak spesifik servis bawah/atas dan spike pada permainan bola voli';
  const tp9 = params.tujuanKelas9 || 'Merancang dan mempraktikkan taktik dan strategi penyerangan dan pertahanan bola voli sederhana secara kolaboratif';
  const jadwal = params.jadwalMingguan || 'Senin jam 1-2 kelas VII A, Senin jam 3-4 kelas VII B; Selasa jam 1-2 kelas VIII A, Selasa jam 3-4 kelas VIII B; Rabu jam 1-2 kelas IX A, Kamis jam 1-2 kelas IX B';
  const rentang = params.rentangJadwal || '14 Juli 2025 - 30 September 2025';

  return [
    {
      id: 'prompt_master_jurnal_mapel',
      label: 'Prompt Master Jurnal 1 Mapel (Word Ready)',
      description: 'Sesuai format baku instruksi penyusunan Jurnal Harian Guru Satu Mapel per hari.',
      prompt: `PROMPT JURNAL HARIAN KEGIATAN PEMBELAJARAN

Jika Mengajar Satu Mapel
Buatkan Jurnal Harian Kegiatan Pembelajaran Guru ${mapel} untuk ${sekolah} tahun pelajaran ${tahun}.  
Gunakan format tabel dengan kolom: Hari/Tanggal, Jam ke-, Kelas, Tujuan, Materi Pokok, Rincian Materi, Hasil, Hadir, Tidak Hadir, dan Keterangan.  

Data yang perlu dimasukkan:  
1. Tujuan pembelajaran kelas VII: ${tp7}
2. Tujuan pembelajaran kelas VIII: ${tp8}
4. Tujuan pembelajaran kelas IX: ${tp9}
5. Jadwal mengajar tiap minggu: ${jadwal}
6. Rentang jadwal: ${rentang}  

Instruksi tambahan:  
- Sesuaikan "Tujuan & Materi Pokok" dengan tujuan pembelajaran yang diinput.  
- "Rincian Materi" berisi detail langkah pembelajaran sesuai tujuan.  
- "Hasil" berisi catatan lancar/tidaknya KBM.  
- "Hadir" dan "Tidak Hadir" diisi sesuai asumsi jumlah siswa.  
- "Keterangan" dapat diisi dengan informasi tambahan seperti "Pemateri: Guru Mapel" atau catatan lain.  

Output: buatkan outputnya berupa tabel rapi mirip format jurnal harian guru. Tabel dibuat per hari. Berikan file dalam bentuk word yang rapi.`
    },
    {
      id: 'prompt_json_jurnal_mapel',
      label: 'Prompt Ekspor JSON Terstruktur',
      description: 'Format data JSON agar siap diintegrasikan atau disimpan ke database.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Hasilkan data Jurnal Harian Kegiatan Pembelajaran Guru ${mapel} dalam format JSON valid dan komprehensif.
Satuan Pendidikan: ${sekolah}
Tahun Pelajaran: ${tahun}
Rentang Tanggal: ${rentang}
Jadwal Mingguan: ${jadwal}

Struktur JSON yang wajib dihasilkan:
{
  "identitas": {
    "mataPelajaran": "${mapel}",
    "namaSekolah": "${sekolah}",
    "tahunPelajaran": "${tahun}",
    "semester": "Semester 1 (Ganjil)",
    "rentangJadwal": "${rentang}"
  },
  "hariList": [
    {
      "hariTanggal": "Senin, 14 Juli 2025",
      "rows": [
        {
          "hariTanggal": "Senin, 14 Juli 2025",
          "jamKe": "1-2 (07.00 - 08.20)",
          "kelas": "VII A",
          "tujuan": "Mempraktikkan gerak spesifik passing bawah bola voli...",
          "materiPokok": "Permainan Bola Voli (Passing Bawah)",
          "rincianMateri": "Pemanasan dinamis, demonstrasi posisi kuda-kuda dan ayunan lengan, drill berpasangan, pendinginan",
          "hasil": "KBM berjalan sangat tertib dan antusias, 90% siswa menguasai teknik perkenaan bola",
          "hadir": 31,
          "tidakHadir": "1 (Sakit: Budi)",
          "keterangan": "Pemateri: Guru Mapel"
        }
      ]
    }
  ]
}`
    }
  ];
}

/**
 * 17. Asesmen Sumatif Akhir Tahun (ASAT - Materi 2 Semester) Prompts
 */
export function getAsatPrompts(params: {
  mataPelajaran?: string;
  kelas?: string;
  fase?: string;
  tujuanSemester1?: string;
  tujuanSemester2?: string;
  namaSekolah?: string;
  tahunPelajaran?: string;
  alokasiWaktu?: string;
}): PromptTabDefinition[] {
  const mapel = params.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
  const kelas = params.kelas || 'VII (Tujuh)';
  const fase = params.fase || 'Fase D';
  const sem1 = params.tujuanSemester1 || '1. Mempraktikkan variasi gerak spesifik passing bola voli; 2. Menganalisis gerak spesifik lari jarak pendek (sprint); 3. Mempraktikkan latihan kebugaran jasmani daya tahan jantung-paru.';
  const sem2 = params.tujuanSemester2 || '1. Mempraktikkan variasi gerak spesifik servis dan smash bola voli; 2. Menganalisis pola senam lantai guling depan dan lenting; 3. Mempraktikkan gaya renang dada; 4. Mengenali pertolongan pertama cedera olahraga (RICE) dan pola hidup sehat remaja.';
  const sekolah = params.namaSekolah || 'SD Negeri Kalimantong';
  const tahun = params.tahunPelajaran || '2026/2027';
  const waktu = params.alokasiWaktu || '90 Menit';

  return [
    {
      id: 'prompt_master_asat',
      label: 'Prompt Master ASAT (2 Semester)',
      description: 'Sesuai format baku instruksi Asesmen Sumatif Akhir Tahun dengan 45 soal berbobot 30% Semester 1 & 70% Semester 2.',
      prompt: `Prompt Asesmen Sumatif Akhir Tahun (Materi 2 Semester)
Sebelum menggunakan prompt ini, pastikan sudah membuat CP dan ATP menggunakan Prompt Menyusun CP, ATP

Anda adalah Guru mata pelajaran ${mapel} kelas ${kelas} fase ${fase} yang sedang menyusun soal asesmen. Buatkan asesmen sumatif akhir tahun berdasarkan tujuan pembelajaran berikut
Semester 1: ${sem1}
Semester 2: ${sem2}
Asesmen sumatif digunakan untuk mengukur ketercapaian kompetensi peserta didik secara menyeluruh pada akhir periode pembelajaran dimana 30% soal sesuai dengan tujuan pembelajaran di semester 1 dan 70% sesuai dengan tujuan pembelajaran di semester 2.
Buatkan juga kisi-kisi asesmen sumatif yang berfungsi untuk memetakan ketercapaian semua tujuan pembelajaran tersebut. Kisi-kisi harus ditampilkan dalam bentuk tabel dengan format berikut:
| No | Tujuan Pembelajaran | Ruang Lingkup Materi | Level Kognitif (Taksonomi Bloom) | Indikator Soal | Bentuk Soal | Nomor Soal | Naskah Soal | Kunci Jawaban | Skor |

Kisi-kisi soal dibuat detail tiap nomor soal
Soal pilihan ganda disusun sebanyak 25 nomor dengan 5 pilihan jawaban, tingkat kesulitan bervariasi dari mudah, sedang, hingga sulit.
Soal pilihan ganda kompleks disusun sebanyak 5 nomor dengan 5 pilihan jawaban, tingkat kesulitan bervariasi dari mudah, sedang, hingga sulit.
Soal menjodohkan disusun sebanyak 8 nomor, tingkat kesulitan bervariasi dari mudah, sedang, hingga sulit.
Soal isian singkat disusun sebanyak 5 nomor dengan tingkat kesukaran sedang hingga tinggi, berbentuk aplikasi konsep dalam kehidupan nyata peserta didik.
Soal isian uraian disusun sebanyak 2 nomor dengan tingkat kesukaran sedang hingga tinggi, berbentuk aplikasi konsep dalam kehidupan nyata peserta didik.
Info Tambahan: Sertakan soal-soal yang memiliki stimulus berupa bacaan singkat yang sesuai dengan pertanyaan dan juga sertakan Soal-soal berbasis gambar (seperti diagram, grafik, peta, ilustrasi, atau tabel). Karena Anda berbasis teks gunakan format “[Gambar:”Deskripsikan detail gambar yang harus disiapkan oleh guru”] diatas tekas pertanyaan soal.

Terakhir, tampilkan lembar soal asesmen sumatif yang memuat:
Identitas soal (nama sekolah: ${sekolah}, mata pelajaran: ${mapel}, kelas/semester: ${kelas}/Semester 2 (Genap), tahun pelajaran: ${tahun}, waktu: ${waktu}, jumlah soal: 45 butir).
Petunjuk pengerjaan.
Soal

TABEL KUNCI JAWABAN DAN PEDOMAN PENSKORAN`
    },
    {
      id: 'prompt_json_asat',
      label: 'Format Ekspor JSON Terstruktur',
      description: 'Skema JSON lengkap untuk pengolahan naskah asesmen, kisi-kisi, kunci, dan pedoman penskoran.',
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Hasilkan naskah Asesmen Sumatif Akhir Tahun (ASAT) lengkap untuk mata pelajaran ${mapel} kelas ${kelas} (${fase}) dalam format JSON terstruktur.
Pembagian materi: 30% Semester 1, 70% Semester 2.
Distribusi soal (Total 45 Soal):
- 25 Soal Pilihan Ganda (A-E)
- 5 Soal Pilihan Ganda Kompleks (A-E)
- 8 Soal Menjodohkan
- 5 Soal Isian Singkat
- 2 Soal Uraian

Format JSON yang dihasilkan:
{
  "identitas": {
    "namaSekolah": "${sekolah}",
    "mataPelajaran": "${mapel}",
    "kelas": "${kelas}",
    "fase": "${fase}",
    "tahunPelajaran": "${tahun}",
    "alokasiWaktu": "${waktu}",
    "jumlahSoal": 45
  },
  "kisiKisi": [
    {
      "no": 1,
      "tujuanPembelajaran": "...",
      "ruangLingkupMateri": "...",
      "levelKognitif": "C2 (Memahami)",
      "indikatorSoal": "Disajikan deskripsi gerak...",
      "bentukSoal": "Pilihan Ganda",
      "nomorSoal": 1,
      "naskahSoal": "[Gambar: ...] Berdasarkan gambar...",
      "opsiJawaban": ["A. ...", "B. ...", "C. ...", "D. ...", "E. ..."],
      "kunciJawaban": "B",
      "skor": 1,
      "semesterAsal": 1
    }
  ],
  "pedomanPenskoran": {
    "skorMaksimalPG": 25,
    "skorMaksimalPGK": 10,
    "skorMaksimalMenjodohkan": 8,
    "skorMaksimalIsian": 10,
    "skorMaksimalUraian": 10,
    "totalSkorMaksimal": 63,
    "rumusNilaiAkhir": "Nilai Akhir = (Total Skor Perolehan / 63) x 100"
  }
}`
    }
  ];
}

/**
 * 18. Ujian Sekolah / Madrasah (US/UM - 50 Soal PG) Prompts (Versi 1 & Versi 2)
 */
export function getUjianSekolahPrompts(params: {
  mataPelajaran?: string;
  kelasAkhir?: string;
  tujuanUmum?: string;
  tujuanKelas7?: string;
  tujuanKelas8?: string;
  tujuanKelas9?: string;
  namaSekolah?: string;
  tahunPelajaran?: string;
  alokasiWaktu?: string;
  jumlahOpsi?: number;
  jumlahSoal?: number;
}): PromptTabDefinition[] {
  const mapel = params.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
  const kelas = params.kelasAkhir || 'IX (Sembilan) SMP/MTs';
  const tujuanUmum = params.tujuanUmum || `1. Mempraktikkan keterampilan variasi dan kombinasi gerak spesifik permainan invasi, net, dan lapangan (bola voli, sepak bola, bola basket, bulu tangkis, kasti).
2. Mempraktikkan dan menganalisis gerak dasar atletik (lari jarak pendek/sprint, lari estafet, lompat jauh, tolak peluru) dan senam lantai (guling depan, guling belakang, guling lenting).
3. Merancang latihan peningkatan derajat kebugaran jasmani (daya tahan jantung-paru, kekuatan, kelenturan, kelincahan).
4. Memahami pertolongan pertama pada cedera olahraga (metode RICE), pola makan bergizi seimbang, dan pencegahan bahaya zat adiktif.`;

  const tp7 = params.tujuanKelas7 || `Mempraktikkan gerak spesifik passing bawah/atas bola voli, lari sprint 100m, dan pengukuran kebugaran kardiorespirasi`;
  const tp8 = params.tujuanKelas8 || `Mempraktikkan variasi servis/smash bola voli, senam lantai guling depan/lenting, dan penanganan cedera sprain`;
  const tp9 = params.tujuanKelas9 || `Merancang taktik permainan bola voli 6v6, gaya renang dada & penyelamatan diri, serta program kebugaran mandiri`;
  const sekolah = params.namaSekolah || 'SD Negeri Kalimantong';
  const tahun = params.tahunPelajaran || '2026/2027';
  const waktu = params.alokasiWaktu || '120 Menit';
  const jumlahOpsi = Math.min(Math.max(params.jumlahOpsi || 5, 3), 5);
  const jumlahSoal = params.jumlahSoal || 50;
  const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, jumlahOpsi).join(', ');
  const jsonOptionsSample = ['A', 'B', 'C', 'D', 'E'].slice(0, jumlahOpsi).map(l => `"${l}. ..."`).join(', ');

  return [
    {
      id: 'prompt_us_versi_1',
      label: 'Prompt US/UM Versi 1 (Umum 1 Jenjang)',
      description: `Sesuai format Versi 1: Kisi-kisi 11 kolom, ${jumlahSoal} soal PG (${jumlahOpsi} Pilihan: ${letters}), dominan C3-C5, stimulus bacaan & gambar, dan tabel kunci jawaban.`,
      prompt: `PROMPT SOAL UJIAN SEKOLAH/MADRASAH
VERSI 1

Anda adalah Guru mata pelajaran ${mapel} kelas ${kelas} yang sedang menyusun Ujian Sekolah/Madrasah (US/UM).
Buatkan instrumen Ujian Sekolah/Madrasah berdasarkan seluruh tujuan pembelajaran atau capaian pembelajaran utama yang telah dipelajari peserta didik selama satu jenjang pendidikan berikut:
${tujuanUmum}.
Ujian Sekolah/Madrasah digunakan untuk mengukur ketercapaian kompetensi peserta didik secara komprehensif pada akhir jenjang pendidikan, sehingga soal harus mengukur kemampuan:
pemahaman konsep
penerapan konsep
penalaran
analisis
pemecahan masalah kontekstual dalam kehidupan nyata
Gunakan variasi level kognitif Taksonomi Bloom (C1–C6) dengan dominasi C3–C5.

1. Kisi-Kisi Ujian Sekolah/Madrasah
Buatkan kisi-kisi ujian untuk memetakan ketercapaian semua tujuan pembelajaran tersebut.
Tampilkan dalam tabel dengan format berikut:
| No | Tujuan Pembelajaran | Ruang Lingkup Materi | Level Kognitif (Taksonomi Bloom) | Indikator Soal | Bentuk Soal | Nomor Soal | Naskah Soal | Pilihan Jawaban | Kunci Jawaban | Skor |
Ketentuan:
Kisi-kisi dibuat detail untuk setiap nomor soal
Bentuk soal pilihan ganda
Total ${jumlahSoal} nomor soal

2. Soal Ujian Sekolah/Madrasah
Susun soal pilihan ganda berdasarkan Kisi-kisi tersebut dengan ketentuan:
Setiap soal memiliki ${jumlahOpsi} pilihan jawaban (${letters})
Tampilkan soal dengan format yang rapi (mulai dari Identitas soal (nama sekolah: ${sekolah}, mata pelajaran: ${mapel}, kelas/semester: ${kelas}/Genap, tahun pelajaran: ${tahun}, waktu: ${waktu}, jumlah soal: ${jumlahSoal} soal), Petunjuk pengerjaan Singkat hingga soal)
Soal harus:
kontekstual
berbasis pemahaman konsep
mengukur kemampuan berpikir tingkat tinggi (HOTS)
Munculkan beberapa soal memiliki stimulus berupa bacaan singkat agar soal bervariasi
Munculkan juga beberapa soal dengan stimulus berupa gambar

3. Kunci Jawaban
Buatlah kunci jawaban dalam bentuk tabel yang rapi sehingga mudah digunakan untuk melakukan koreksi`
    },
    {
      id: 'prompt_us_versi_2',
      label: 'Prompt US/UM Versi 2 (Berjenjang Kelas 7, 8, 9)',
      description: `Sesuai format Versi 2: Pembagian nomor berjenjang ${jumlahSoal} soal (${jumlahOpsi} Pilihan: ${letters}).`,
      prompt: `PROMPT SOAL UJIAN SEKOLAH/MADRASAH
VERSI 2

Anda adalah Guru mata pelajaran ${mapel} kelas ${kelas} yang sedang menyusun Ujian Sekolah/Madrasah (US/UM).
Buatkan instrumen Ujian Sekolah/Madrasah berdasarkan seluruh tujuan pembelajaran atau capaian pembelajaran utama yang telah dipelajari peserta didik selama satu jenjang pendidikan berikut:
Tujuan Kelas 7 (Soal Nomor 1-10):
${tp7}.
Tujuan Kelas 8 (Soal Nomor 11-30):
${tp8}.
Tujuan Kelas 9 (Soal Nomor 31-50):
${tp9}.
Ujian Sekolah/Madrasah digunakan untuk mengukur ketercapaian kompetensi peserta didik secara komprehensif pada akhir jenjang pendidikan, sehingga soal harus mengukur kemampuan:
pemahaman konsep
penerapan konsep
penalaran
analisis
pemecahan masalah kontekstual dalam kehidupan nyata
Gunakan variasi level kognitif Taksonomi Bloom (C1–C6) dengan dominasi C3–C5.
Buatlah Dokumen dengan isi sebagai berikut:
1. Kisi-Kisi Ujian Sekolah/Madrasah
Buatkan kisi-kisi ujian untuk memetakan ketercapaian semua tujuan pembelajaran tersebut.
Tampilkan dalam tabel dengan format berikut:
| No | Tujuan Pembelajaran | Ruang Lingkup Materi | Level Kognitif (Taksonomi Bloom) | Indikator Soal | Bentuk Soal | Nomor Soal | Naskah Soal | Pilihan Jawaban | Kunci Jawaban | Skor |
Ketentuan:
Kisi-kisi dibuat detail untuk setiap nomor soal
Bentuk soal pilihan ganda
Total ${jumlahSoal} nomor soal
2. Soal Ujian Sekolah/Madrasah
Susun soal pilihan ganda berdasarkan Kisi-kisi tersebut dengan ketentuan:
Setiap soal memiliki ${jumlahOpsi} pilihan jawaban (${letters})
Tampilkan soal dengan format yang rapi (mulai dari Identitas soal (nama sekolah: ${sekolah}, mata pelajaran: ${mapel}, kelas/semester: ${kelas}/Genap, tahun pelajaran: ${tahun}, waktu: ${waktu}, jumlah soal: ${jumlahSoal} soal), Petunjuk pengerjaan Singkat hingga soal)
Soal harus:
Kontekstual (Sebagian)
berbasis pemahaman konsep
mengukur kemampuan berpikir tingkat tinggi (HOTS)
Munculkan beberapa soal memiliki stimulus berupa bacaan singkat agar soal bervariasi
Munculkan juga beberapa soal dengan stimulus berupa gambar
3. Kunci Jawaban
Buatlah kunci jawaban dalam bentuk tabel yang rapi sehingga mudah digunakan untuk melakukan koreksi`
    },
    {
      id: 'prompt_us_json',
      label: 'Format Ekspor JSON Terstruktur',
      description: `Skema JSON lengkap ${jumlahSoal} soal (${jumlahOpsi} Pilihan: ${letters}) untuk integrasi database dan cetak Word.`,
      prompt: `${PJOK_SYSTEM_ROLE}

TUGAS: Hasilkan instrumen Ujian Sekolah/Madrasah (US/UM) ${jumlahSoal} butir soal Pilihan Ganda (${letters}) untuk ${mapel} kelas ${kelas} dalam format JSON terstruktur lengkap.

Format JSON yang dihasilkan:
{
  "identitas": {
    "namaSekolah": "${sekolah}",
    "mataPelajaran": "${mapel}",
    "kelasAkhir": "${kelas}",
    "tahunPelajaran": "${tahun}",
    "alokasiWaktu": "${waktu}",
    "jumlahSoal": ${jumlahSoal},
    "jumlahOpsi": ${jumlahOpsi}
  },
  "kisiKisi": [
    {
      "no": 1,
      "tujuanPembelajaran": "...",
      "ruangLingkupMateri": "...",
      "levelKognitif": "C3 (Menerapkan)",
      "indikatorSoal": "...",
      "bentukSoal": "Pilihan Ganda",
      "nomorSoal": 1,
      "naskahSoal": "[Gambar: ...] Berdasarkan gambar...",
      "pilihanJawaban": [${jsonOptionsSample}],
      "kunciJawaban": "B",
      "skor": 1,
      "tingkatKelas": "Kelas VII"
    }
  ],
  "pedomanPenskoran": {
    "skorMaksimal": ${jumlahSoal},
    "rumusNilaiAkhir": "Nilai Akhir = (Total Skor Perolehan / ${jumlahSoal}) x 100"
  }
}`
    }
  ];
}



