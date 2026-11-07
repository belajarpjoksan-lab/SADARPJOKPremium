// Engine Generator Soal & Kartu Soal Sumatif PJOK SD (Kurikulum Merdeka)
// Mendukung permutasi dinamis, anti-duplikasi, acak variasi, multi-bentuk soal, dan distribusi presisi

export interface SummativeParams {
  jenisUjian?: string;
  mataPelajaran?: string;
  grade?: string;
  semester?: string;
  tahunPelajaran?: string;
  namaSekolah?: string;
  dinasPendidikan?: string;
  babMateri?: string;
  babMateriList?: string[];
  bentukSoal?: string;
  bentukSoalList?: string[];
  bentukSoalDistribution?: { name: string; count: number }[];
  bentukSoalCounts?: Record<string, number>;
  totalSoal?: string;
  jumlahOpsiPG?: string;
  levelKognitif?: string;
  modelStimulus?: string;
  dimensiP3?: string;
  skalaPenskoran?: string;
  seed?: string | number;
}

export interface QuestionOutput {
  noSoal: number;
  bentukSoal: string;
  levelKognitif: string;
  lingkupMateri: string;
  capaianPembelajaran: string;
  indikatorSoal: string;
  question: string;
  options: string[];
  pernyataanKompleks?: { pernyataan: string; jawabanBenar: string }[];
  menjodohkanPairs?: { premis: string; pasangan: string }[];
  correctAnswer: string;
  explanation: string;
  pedomanPenskoran: string;
  bobotSkor: number;
  dimensiP3: string;
}

export interface SummativeResultOutput {
  judulUjian: string;
  kop: {
    dinasPendidikan: string;
    namaSekolah: string;
    mataPelajaran: string;
    kelas: string;
    semester: string;
    tahunPelajaran: string;
    lingkupMateriList: string[];
    lingkupMateri: string;
    bentukSoalList: string[];
    bentukSoal: string;
    bentukSoalDistribution?: { name: string; count: number }[];
    bentukSoalSummary?: string;
    totalSoal: number;
  };
  questions: QuestionOutput[];
}

interface BankItem {
  id: string;
  topicCategory: string;
  subtopic: string;
  baseQuestion: string;
  correctConcept: string;
  distractors: string[];
  explanation: string;
  indikator: string;
  level: string;
  isianKeyword: string;
  uraianPrompt: string;
  uraianModelAnswer: string;
  uraianRubrik: string;
  pgkStatements: { pernyataan: string; jawabanBenar: 'Benar' | 'Salah' }[];
  matchingPairs: { premis: string; pasangan: string }[];
}

// Simple deterministic PRNG for seeded randomization
function createPrng(seedStr: string | number) {
  let hash = 0;
  const str = String(seedStr || Date.now());
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  let state = hash;

  return function next(): number {
    state = (state * 1664525 + 1013904223) | 0;
    return (state >>> 0) / 4294967296;
  };
}

// Shuffle array using PRNG
function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

// Comprehensive PJOK Question Bank
const QUESTION_BANK: BankItem[] = [
  // --- SEPAK BOLA & BOLA BESAR ---
  {
    id: 'sb-pass-dalam',
    topicCategory: 'sepak bola',
    subtopic: 'Passing Kaki Bagian Dalam',
    baseQuestion: 'Bagian kaki yang paling tepat dan efektif digunakan untuk melakukan operan bola jarak pendek (short pass) mendatar kepada rekan satu regu adalah...?',
    correctConcept: 'Kaki bagian dalam',
    distractors: ['Ujung jari-jari kaki', 'Tumit bagian belakang', 'Punggung kaki luar'],
    explanation: 'Kaki bagian dalam memiliki bidang kontak yang lebar dan datar sehingga laju bola lebih terarah, datar, dan mudah dikuasai rekan setim.',
    indikator: 'Disajikan situasi operan pendek dalam sepak bola, peserta didik dapat menentukan bagian kaki yang tepat.',
    level: 'Level 2 (C3 - Menerapkan)',
    isianKeyword: 'Kaki bagian dalam',
    uraianPrompt: 'Jelaskan mengapa operan pendek dalam sepak bola dianjurkan menggunakan kaki bagian dalam daripada ujung sepatu!',
    uraianModelAnswer: 'Karena bidang perkenaan kaki bagian dalam lebih lebar dan datar sehingga laju bola mendatar, akurat, tidak melambung liar, dan mudah dikontrol kawan.',
    uraianRubrik: 'Skor 5 jika menyebutkan bidang perkenaan luas dan akurasi operan; skor 3 jika menyebutkan satu alasan; skor 1 jika kurang lengkap.',
    pgkStatements: [
      { pernyataan: 'Operan jarak pendek mendatar paling akurat dilakukan menggunakan kaki bagian dalam.', jawabanBenar: 'Benar' },
      { pernyataan: 'Mengoper bola menggunakan ujung jari kaki menghasilkan laju bola yang stabil dan mudah dikontrol kawan.', jawabanBenar: 'Salah' },
      { pernyataan: 'Pandangan mata tertuju pada bola dan sasaran rekan saat melakukan tendangan operan.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Kaki bagian dalam', pasangan: 'A. Operan bola jarak pendek yang akurat dan mendatar' },
      { premis: '2. Punggung kaki (kura-kura)', pasangan: 'B. Menendang bola kencang mengarah ke gawang' },
      { premis: '3. Telapak kaki (sol sepatu)', pasangan: 'C. Menghentikan dan menguasai bola yang bergulir' }
    ]
  },
  {
    id: 'sb-dribble-kontrol',
    topicCategory: 'sepak bola',
    subtopic: 'Menggiring Bola (Dribbling)',
    baseQuestion: 'Gerakan menggiring bola (dribbling) dalam permainan sepak bola bertujuan utama untuk...?',
    correctConcept: 'Mendekati daerah pertahanan lawan sambil menjaga penguasaan bola',
    distractors: ['Membuang bola keluar garis samping', 'Menunda waktu pertandingan secara sengaja', 'Mengelabui wasit lapangan'],
    explanation: 'Dribbling adalah keterampilan menggerakkan bola dengan dorongan kaki secara terkontrol ke ruang kosong atau melewati pemain bertahan lawan.',
    indikator: 'Peserta didik dapat menganalisis tujuan utama teknik menggiring bola.',
    level: 'Level 1 (C2 - Memahami)',
    isianKeyword: 'Mendekati gawang lawan / menguasai bola',
    uraianPrompt: 'Sebutkan 3 bagian kaki yang dapat digunakan untuk menggiring bola dalam sepak bola!',
    uraianModelAnswer: '1. Punggung kaki, 2. Kaki bagian dalam, 3. Kaki bagian luar.',
    uraianRubrik: 'Skor 5 jika menyebutkan ketiga bagian kaki dengan benar; skor 3 jika 2 bagian; skor 1 jika 1 bagian.',
    pgkStatements: [
      { pernyataan: 'Menggiring bola bertujuan untuk mendekatkan bola ke daerah pertahanan lawan.', jawabanBenar: 'Benar' },
      { pernyataan: 'Saat menggiring bola jarak bola dengan kaki sebaiknya sejauh 5 meter agar leluasa berlari.', jawabanBenar: 'Salah' },
      { pernyataan: 'Menggiring bola dapat dilakukan dengan kaki bagian dalam, luar, maupun punggung kaki.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Dribble kaki luar', pasangan: 'A. Menggiring bola sambil mengubah arah ke sisi samping' },
      { premis: '2. Dribble punggung kaki', pasangan: 'B. Menggiring bola lurus dengan kecepatan tinggi' },
      { premis: '3. Dribble kaki dalam', pasangan: 'C. Menggiring bola dengan kontrol ketat di ruang sempit' }
    ]
  },
  {
    id: 'sb-kiper-aturan',
    topicCategory: 'sepak bola',
    subtopic: 'Aturan Penjaga Gawang & Handsball',
    baseQuestion: 'Satu-satunya pemain dalam regu sepak bola yang berhak menangkap atau memegang bola menggunakan tangan saat pertandingan berlangsung adalah...?',
    correctConcept: 'Penjaga gawang (kiper) di dalam kotak penalti sendiri',
    distractors: ['Kapten regu di lingkaran tengah', 'Pemain bek di garis pertahanan', 'Penyerang di kotak penalti lawan'],
    explanation: 'Sesuai regulasi Laws of the Game FIFA, hanya penjaga gawang yang berhak menggunakan tangan di area penaltinya sendiri.',
    indikator: 'Peserta didik dapat mengidentifikasi hak khusus penjaga gawang dalam sepak bola.',
    level: 'Level 1 (C1 - Mengingat)',
    isianKeyword: 'Penjaga gawang / Kiper',
    uraianPrompt: 'Jelaskan syarat sah saat melakukan lemparan ke dalam (throw-in) pada sepak bola!',
    uraianModelAnswer: 'Kedua tangan memegang bola dari belakang melewati atas kepala, kedua kaki menapak di tanah di luar garis tepi, dan melempar ke lapangan tanpa mengangkat salah satu kaki.',
    uraianRubrik: 'Skor 5 jika menjelaskan kedua tangan di atas kepala dan kedua kaki menapak tanah.',
    pgkStatements: [
      { pernyataan: 'Kiper boleh memegang bola di luar area penalti timnya sendiri.', jawabanBenar: 'Salah' },
      { pernyataan: 'Pemain selain kiper dinyatakan handsball jika sengaja menyentuh bola dengan lengan atau tangan.', jawabanBenar: 'Benar' },
      { pernyataan: 'Lemparan ke dalam (throw-in) dilakukan menggunakan kedua tangan dari atas kepala.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Penjaga gawang', pasangan: 'A. Menjaga gawang dan boleh memakai tangan di kotak penalti' },
      { premis: '2. Pemain bertahan (bek)', pasangan: 'B. Membendung serangan lawan sebelum masuk kotak penalti' },
      { premis: '3. Penyerang (striker)', pasangan: 'C. Mencetak gol ke gawang regu lawan' }
    ]
  },
  {
    id: 'sb-kontrol-telapak',
    topicCategory: 'sepak bola',
    subtopic: 'Menghentikan Bola (Stopping/Controlling)',
    baseQuestion: 'Ketika bola meluncur deras di permukaan tanah menuju ke arah tubuh, gerakan menghentikan bola paling stabil dilakukan dengan telapak kaki dengan cara...?',
    correctConcept: 'Mengangkat ujung jari kaki sedikit ke atas dan menginjak bola bagian atas secara lembut',
    distractors: ['Menendang keras bola kembali ke depan', 'Melompat tinggi dengan kedua kaki', 'Membiarkan bola melewati sela paha'],
    explanation: 'Menghentikan bola dengan telapak kaki dilakukan dengan mengangkat sedikit ujung sepatu dan meredam laju bola dengan sol sepatu.',
    indikator: 'Peserta didik dapat menganalisis mekanika kontak telapak kaki saat mengontrol bola.',
    level: 'Level 3 (C4 - Menganalisis)',
    isianKeyword: 'Telapak kaki / Sol sepatu',
    uraianPrompt: 'Tuliskan langkah-langkah menghentikan bola mendatar menggunakan kaki bagian dalam!',
    uraianModelAnswer: '1. Posisi badan menghadap arah datangnya bola. 2. Putar pergelangan kaki ke arah luar. 3. Sambut bola dan tarik kaki sedikit ke belakang untuk meredam kecepatan bola.',
    uraianRubrik: 'Skor 5 jika menguraikan 3 tahapan runtut; skor 3 jika 2 tahapan; skor 1 jika 1 tahapan.',
    pgkStatements: [
      { pernyataan: 'Meredam laju bola dengan menarik kaki sedikit ke belakang saat kontak dinamakan teknik controlling.', jawabanBenar: 'Benar' },
      { pernyataan: 'Menghentikan bola melambung tinggi di dada dilakukan dengan membusungkan dada sekeras mungkin.', jawabanBenar: 'Salah' },
      { pernyataan: 'Keseimbangan tubuh ditopang oleh kaki tumpu yang sedikit ditekuk.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Kontrol telapak kaki', pasangan: 'A. Meredam bola mendatar yang meluncur di tanah' },
      { premis: '2. Kontrol paha', pasangan: 'B. Meredam bola yang melayang setinggi pinggang' },
      { premis: '3. Kontrol dada', pasangan: 'C. Meredam bola lambung tinggi di udara' }
    ]
  },
  {
    id: 'sb-taktik-sportivitas',
    topicCategory: 'sepak bola',
    subtopic: 'Taktik Kerjasama & Sportivitas',
    baseQuestion: 'Pemain penyerang dihadang oleh dua pemain bertahan lawan di depan gawang. Keputusan taktis terbaik yang mencerminkan kerjasama tim adalah...?',
    correctConcept: 'Mengoper bola ke rekan setim yang berada dalam posisi bebas tanpa kawalan',
    distractors: ['Memaksakan menendang bola ke arah badan pemain lawan', 'Menjatuhkan diri secara sengaja (diving)', 'Berhenti bermain dan memegang bola'],
    explanation: 'Dalam permainan beregu, membagi bola ke kawan yang berdiri bebas membuka peluang mencetak gol lebih besar daripada memaksakan tembakan berisiko.',
    indikator: 'Peserta didik dapat mengevaluasi keputusan taktis terbaik dalam situasi penyerangan sepak bola.',
    level: 'Level 3 (C5 - Mengevaluasi)',
    isianKeyword: 'Mengoper ke rekan yang bebas',
    uraianPrompt: 'Mengapa sportivitas dan kerjasama tim sangat menentukan keberhasilan dalam sepak bola?',
    uraianModelAnswer: 'Karena sepak bola adalah permainan kelompok. Kekompakan operan, saling mendukung posisi, serta menjunjung tinggi kejujuran dan rasa hormat kepada lawan dan wasit menciptakan kemenangan yang bermartabat.',
    uraianRubrik: 'Skor 5 jika mengaitkan kerjasama tim, kejujuran, dan penghormatan aturan; skor 3 jika penjelasan parsial.',
    pgkStatements: [
      { pernyataan: 'Kerjasama tim dan operan tepat lebih efektif menghasilkan gol daripada bermain individualis.', jawabanBenar: 'Benar' },
      { pernyataan: 'Melakukan pelanggaran kasar secara sengaja dibenarkan demi mempertahankan keunggulan skor.', jawabanBenar: 'Salah' },
      { pernyataan: 'Menghormati keputusan wasit dan berjabat tangan dengan lawan merupakan wujud sportivitas.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Sportivitas', pasangan: 'A. Bersikap jujur, lapang dada, dan menghormati lawan' },
      { premis: '2. Kerjasama tim', pasangan: 'B. Saling mengoper dan menempati posisi kosong' },
      { premis: '3. Fair play', pasangan: 'C. Bermain bersih mematuhi peraturan pertandingan' }
    ]
  },

  // --- BOLA VOLI ---
  {
    id: 'bv-passing-bawah',
    topicCategory: 'bola voli',
    subtopic: 'Passing Bawah Bola Voli',
    baseQuestion: 'Posisi kedua lengan yang benar saat melakukan teknik passing bawah dalam permainan bola voli adalah...?',
    correctConcept: 'Kedua lengan dirapatkan dan diluruskan ke depan bawah dengan kedua ibu jari sejajar',
    distractors: ['Kedua siku ditekuk di samping telinga', 'Kedua tangan menyilang di depan dada', 'Satu tangan di atas kepala dan satu di pinggang'],
    explanation: 'Merapatkan dan meluruskan kedua lengan membentuk bidang datar yang rata sehingga pantulan bola voli menjadi terarah ke atas.',
    indikator: 'Peserta didik dapat mengidentifikasi posisi kedua lengan yang benar pada passing bawah bola voli.',
    level: 'Level 2 (C3 - Menerapkan)',
    isianKeyword: 'Dirapatkan dan diluruskan ke depan bawah',
    uraianPrompt: 'Jelaskan bagaimana posisi lutut dan gerakan tungkai saat melakukan passing bawah bola voli!',
    uraianModelAnswer: 'Lutut ditekuk membentuk kuda-kuda sedang, dan saat bola kontak dengan lengan, kedua kaki diluruskan ke atas untuk menyalurkan daya dorong tubuh.',
    uraianRubrik: 'Skor 5 jika menjelaskan tekukan lutut awal dan dorongan meluruskan kaki saat perkenaan bola.',
    pgkStatements: [
      { pernyataan: 'Kedua siku harus dikunci lurus dan ibu jari sejajar saat melakukan passing bawah.', jawabanBenar: 'Benar' },
      { pernyataan: 'Passing bawah dilakukan dengan mengayunkan lengan setinggi-tingginya melewati atas kepala.', jawabanBenar: 'Salah' },
      { pernyataan: 'Tekukan lutut berfungsi sebagai pegas yang membantu melambungkan bola ke atas.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Passing bawah', pasangan: 'A. Menerima bola servis atau smes rendah dari lawan' },
      { premis: '2. Passing atas', pasangan: 'B. Mengumpan bola lambung tinggi untuk dismes kawan' },
      { premis: '3. Servis bawah', pasangan: 'C. Pukulan bola pembuka dari belakang garis akhir' }
    ]
  },
  {
    id: 'bv-perkenaan-lengan',
    topicCategory: 'bola voli',
    subtopic: 'Titik Perkenaan Passing Bawah',
    baseQuestion: 'Area perkenaan bola yang ideal pada lengan saat melakukan passing bawah bola voli adalah pada...?',
    correctConcept: 'Bagian pergelangan tangan hingga 10 cm di atasnya pada bidang lengan bawah bagian dalam',
    distractors: ['Ujung jari-jemari tangan', 'Siku lengan bagian dalam', 'Bahu bagian luar'],
    explanation: 'Perkenaan di atas pergelangan tangan pada lengan bawah bagian dalam memberikan bidang pantul yang empuk, rata, dan terarah.',
    indikator: 'Peserta didik dapat menentukan titik perkenaan bola yang tepat pada passing bawah bola voli.',
    level: 'Level 1 (C2 - Memahami)',
    isianKeyword: 'Pergelangan tangan / lengan bawah bagian dalam',
    uraianPrompt: 'Sebutkan 2 jenis passing utama dalam permainan bola voli beserta fungsinya!',
    uraianModelAnswer: '1. Passing bawah: menerima bola servis atau serangan keras lawan. 2. Passing atas: mengumpankan bola tinggi dengan jari-jari tangan untuk dismes kawan.',
    uraianRubrik: 'Skor 5 jika menyebutkan passing bawah dan passing atas beserta fungsinya secara lengkap.',
    pgkStatements: [
      { pernyataan: 'Perkenaan bola passing bawah berada di antara pergelangan tangan dan lengan bawah.', jawabanBenar: 'Benar' },
      { pernyataan: 'Memukul bola passing bawah dengan ujung kepalan tangan menghasilkan pantulan yang stabil.', jawabanBenar: 'Salah' },
      { pernyataan: 'Pandangan mata selalu fokus mengamati arah datangnya bola.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Tosser (Setter)', pasangan: 'A. Pemain yang bertugas mengumpankan bola ke spiker' },
      { premis: '2. Spiker (Smasher)', pasangan: 'B. Pemain yang memukul bola menukik keras ke daerah lawan' },
      { premis: '3. Libero', pasangan: 'C. Pemain bertahan khusus yang lincah menerima bola di belakang' }
    ]
  },
  {
    id: 'bv-aturan-sentuhan',
    topicCategory: 'bola voli',
    subtopic: 'Aturan dan Kuota Sentuhan Bola Voli',
    baseQuestion: 'Berapa kali batas maksimal sentuhan bola oleh pemain dalam satu regu sebelum bola harus diseberangkan ke daerah lawan pada bola voli...?',
    correctConcept: '3 kali sentuhan',
    distractors: ['1 kali sentuhan', '4 kali sentuhan', 'Tidak ada batasan'],
    explanation: 'Regu memiliki hak maksimal 3 kali sentuhan (biasanya: penerimaan bola pertama, umpan setter, dan pukulan serangan).',
    indikator: 'Peserta didik dapat menyebutkan batas kuota sentuhan bola dalam satu regu bola voli.',
    level: 'Level 1 (C1 - Mengingat)',
    isianKeyword: '3 kali (tiga kali)',
    uraianPrompt: 'Tuliskan alur 3 sentuhan ideal dalam strategi penyerangan bola voli!',
    uraianModelAnswer: 'Sentuhan 1: Passing bawah menerima servis lawan; Sentuhan 2: Passing atas mengumpan dari tosser; Sentuhan 3: Pukulan smes tajam menyeberangkan bola ke area lawan.',
    uraianRubrik: 'Skor 5 jika merincikan alur sentuhan penerimaan, umpan, dan serangan dengan tepat.',
    pgkStatements: [
      { pernyataan: 'Satu pemain dilarang menyentuh bola dua kali berturut-turut (double hit).', jawabanBenar: 'Benar' },
      { pernyataan: 'Setiap regu diperbolehkan menyentuh bola sebanyak 5 kali sebelum menyeberang net.', jawabanBenar: 'Salah' },
      { pernyataan: 'Bola yang menyentuh pita net dan berhasil masuk ke daerah lawan dinyatakan sah.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Servis', pasangan: 'A. Pukulan pertama untuk memulai permainan' },
      { premis: '2. Blocking', pasangan: 'B. Membendung serangan smes lawan di atas net' },
      { premis: '3. Smes', pasangan: 'C. Pukulan tajam menukik ke lantai lapangan lawan' }
    ]
  },

  // --- BOLA BASKET ---
  {
    id: 'bb-chest-pass',
    topicCategory: 'bola basket',
    subtopic: 'Chest Pass (Operan Dada)',
    baseQuestion: 'Operan bola basket yang dilakukan lurus setinggi dada kepada rekan setim disebut dengan teknik...?',
    correctConcept: 'Chest pass (operan dada)',
    distractors: ['Bounce pass (operan pantul)', 'Overhead pass (operan atas kepala)', 'Baseball pass'],
    explanation: 'Chest pass adalah operan dari dada ke dada yang cepat, kuat, dan akurat untuk sirkulasi bola jarak menengah antar rekan.',
    indikator: 'Peserta didik dapat mengidentifikasi jenis operan setinggi dada dalam bola basket.',
    level: 'Level 1 (C2 - Memahami)',
    isianKeyword: 'Chest pass / Operan dada',
    uraianPrompt: 'Jelaskan tahapan melakukan gerakan chest pass dalam bola basket!',
    uraianModelAnswer: 'Pegang bola di depan dada dengan kedua tangan, langkahkan satu kaki ke depan, lalu dorong bola lurus ke depan dengan lecutan pergelangan tangan dan jari-jari membuka ke luar.',
    uraianRubrik: 'Skor 5 jika menyebutkan posisi awal dada, langkah kaki, dan dorongan lecutan pergelangan tangan.',
    pgkStatements: [
      { pernyataan: 'Chest pass diarahkan lurus setinggi dada penerima bola.', jawabanBenar: 'Benar' },
      { pernyataan: 'Saat melempar chest pass, kedua tangan diayunkan dari bawah lutut.', jawabanBenar: 'Salah' },
      { pernyataan: 'Lecutan pergelangan tangan memberikan tenaga dorong tambahan pada bola.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Chest pass', pasangan: 'A. Operan lurus setinggi dada rekan setim' },
      { premis: '2. Bounce pass', pasangan: 'B. Operan memantul ke lantai untuk mengecoh lawan' },
      { premis: '3. Overhead pass', pasangan: 'C. Operan melambung dari atas kepala melintasi lawan' }
    ]
  },
  {
    id: 'bb-dribble-pivot',
    topicCategory: 'bola basket',
    subtopic: 'Dribbling dan Pivot Bola Basket',
    baseQuestion: 'Gerakan memutar badan ke segala arah dengan salah satu kaki tetap menempel di lantai sebagai poros tumpuan disebut...?',
    correctConcept: 'Pivot (gerakan berporos)',
    distractors: ['Lay-up shoot', 'Travelling violation', 'Slam dunk'],
    explanation: 'Pivot memungkinkan pemain memutar posisi tubuh 360 derajat untuk mencari celah operan tanpa melanggar aturan langkah (travelling).',
    indikator: 'Peserta didik dapat menjelaskan konsep teknik pivot dalam bola basket.',
    level: 'Level 2 (C3 - Menerapkan)',
    isianKeyword: 'Pivot (kaki poros)',
    uraianPrompt: 'Mengapa kaki poros saat melakukan pivot tidak boleh bergeser atau terangkat sebelum bola dioper atau dipantulkan?',
    uraianModelAnswer: 'Karena jika kaki poros bergeser atau terangkat sebelum bola dilepas, wasit akan meniup peluit pelanggaran travelling (berjalan membawa bola).',
    uraianRubrik: 'Skor 5 jika mengaitkan dengan aturan pelanggaran travelling/walking.',
    pgkStatements: [
      { pernyataan: 'Pivot dilakukan untuk melindungi bola dari rebutan lawan sambil mencari rekan yang bebas.', jawabanBenar: 'Benar' },
      { pernyataan: 'Saat melakukan pivot, pemain diperbolehkan memindahkan kedua kaki sesuka hati.', jawabanBenar: 'Salah' },
      { pernyataan: 'Menggiring bola dalam basket dilakukan dengan mendorong bola menggunakan satu telapak tangan.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Dribble rendah', pasangan: 'A. Melindungi bola dari serobotan pemain bertahan lawan' },
      { premis: '2. Dribble tinggi', pasangan: 'B. Membawa bola berlari kencang saat serangan balik cepat' },
      { premis: '3. Kaki poros (pivot)', pasangan: 'C. Tumpuan satu kaki yang tidak boleh bergeser' }
    ]
  },

  // --- BOLA KECIL: KASTI & ROUNDERS ---
  {
    id: 'bk-kasti-lempar-tangkap',
    topicCategory: 'kasti',
    subtopic: 'Melempar dan Menangkap Bola Kasti',
    baseQuestion: 'Dalam permainan kasti, lemparan bola yang ditujukan untuk operan jarak jauh melintasi lapangan dilakukan dengan teknik lemparan...?',
    correctConcept: 'Lemparan melambung (overhead)',
    distractors: ['Lemparan menyusur tanah', 'Lemparan mendatar setinggi dada', 'Lemparan memantul pendek'],
    explanation: 'Lemparan melambung dengan lintasan parabola mencapai jangkauan terjauh melintasi pemain lain di lapangan.',
    indikator: 'Peserta didik dapat memilih jenis lemparan kasti yang tepat untuk sasaran jarak jauh.',
    level: 'Level 2 (C3 - Menerapkan)',
    isianKeyword: 'Lemparan melambung',
    uraianPrompt: 'Sebutkan 3 macam teknik melempar bola pada permainan kasti!',
    uraianModelAnswer: '1. Melempar melambung, 2. Melempar mendatar, 3. Melempar menyusur tanah.',
    uraianRubrik: 'Skor 5 jika menyebutkan ketiga jenis lemparan lengkap; skor 3 jika 2 jenis; skor 1 jika 1 jenis.',
    pgkStatements: [
      { pernyataan: 'Lemparan melambung digunakan untuk mengoper bola ke teman yang berjarak jauh.', jawabanBenar: 'Benar' },
      { pernyataan: 'Menangkap bola kasti dilakukan dengan mengepalkan tangan erat sebelum bola sampai.', jawabanBenar: 'Salah' },
      { pernyataan: 'Saat menangkap bola, kedua telapak tangan membuka membentuk corong menghadap bola.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Lemparan melambung', pasangan: 'A. Mengoper bola parabola untuk jarak jauh' },
      { premis: '2. Lemparan mendatar', pasangan: 'B. Mematikan pelari lawan yang sedang berlari kencang' },
      { premis: '3. Lemparan menyusur tanah', pasangan: 'C. Melempar bola rendah menyusuri rumput lapangan' }
    ]
  },
  {
    id: 'bk-kasti-pukul-skor',
    topicCategory: 'kasti',
    subtopic: 'Memukul Bola dan Aturan Skor Kasti',
    baseQuestion: 'Pukulan seorang pemain kasti dinyatakan sah dan pelari berhak berlari apabila bola yang dipukul...?',
    correctConcept: 'Jatuh ke depan di dalam lapangan dan tidak mengenai tangan sendiri',
    distractors: ['Jatuh di belakang garis ruang pemukul', 'Mengenai badan pemukul sendiri', 'Terpental ke atas genteng penonton'],
    explanation: 'Pukulan dinyatakan sah jika meluncur ke arah depan di dalam batas sudut lapangan permainan kasti.',
    indikator: 'Peserta didik dapat menentukan kriteria pukulan yang sah dalam permainan kasti.',
    level: 'Level 1 (C2 - Memahami)',
    isianKeyword: 'Jatuh ke depan di dalam lapangan permainan',
    uraianPrompt: 'Di mana kayu pemukul harus diletakkan setelah pemain selesai melakukan pukulan bola kasti?',
    uraianModelAnswer: 'Kayu pemukul harus diletakkan di dalam ruang pemukul dengan tertib dan tidak boleh dilempar sembarangan keluar garis.',
    uraianRubrik: 'Skor 5 jika menyebutkan diletakkan di ruang pemukul tanpa dilempar ke luar.',
    pgkStatements: [
      { pernyataan: 'Pelari yang berhasil pulang ke ruang bebas atas pukulannya sendiri mendapat nilai 2.', jawabanBenar: 'Benar' },
      { pernyataan: 'Tongkat pemukul boleh dilempar sembarangan ke arah lapangan demi keselamatan.', jawabanBenar: 'Salah' },
      { pernyataan: 'Regu penjaga bertugas menangkap bola dan melempar bola ke tubuh pelari lawan.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Ruang pemukul', pasangan: 'A. Tempat berdiri pemain yang akan memukul bola' },
      { premis: '2. Tiang hinggap (base)', pasangan: 'B. Tempat pelari berhenti sementara agar tidak dimatikan' },
      { premis: '3. Ruang bebas', pasangan: 'C. Tempat berkumpul pemain regu pemukul yang menunggu giliran' }
    ]
  },
  {
    id: 'bk-kasti-tangkap-bola',
    topicCategory: 'kasti',
    subtopic: 'Teknik Menangkap Bola Kasti',
    baseQuestion: 'Sikap kedua telapak tangan yang paling tepat saat bersiap menyambut dan menangkap bola lambung pada permainan kasti adalah...?',
    correctConcept: 'Membuka kedua telapak tangan menyerupai corong atau mangkuk menghadap arah datangnya bola',
    distractors: ['Mengepalkan kedua tangan kuat-kuat', 'Menyilangkan tangan di belakang punggung', 'Merentangkan kedua tangan ke samping badan'],
    explanation: 'Membuka kedua telapak tangan membentuk corong dengan jari-jari rileks memungkinkan bola masuk ke telapak tangan tanpa membal keluar.',
    indikator: 'Peserta didik dapat menentukan sikap tangan yang benar saat menangkap bola lambung kasti.',
    level: 'Level 2 (C3 - Menerapkan)',
    isianKeyword: 'Membentuk corong menghadap bola',
    uraianPrompt: 'Bagaimana cara meredam benturan keras saat menangkap bola kasti yang meluncur deras?',
    uraianModelAnswer: 'Saat bola menyentuh telapak tangan, kedua tangan langsung ditarik mengikuti laju bola ke arah dada untuk meredam kecepatan dan benturan.',
    uraianRubrik: 'Skor 5 jika menjelaskan gerakan meredam bola dengan menarik tangan ke arah dada.',
    pgkStatements: [
      { pernyataan: 'Menangkap bola dilakukan dengan pandangan mata selalu fokus ke arah datangnya bola.', jawabanBenar: 'Benar' },
      { pernyataan: 'Kedua tangan harus kaku dan dikepal saat menangkap bola agar tidak cedera.', jawabanBenar: 'Salah' },
      { pernyataan: 'Menarik kedua tangan sedikit ke belakang saat bola tiba berfungsi meredam laju bola.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Menangkap bola lambung', pasangan: 'A. Menjulurkan tangan ke atas membentuk corong menyambut bola' },
      { premis: '2. Menangkap bola mendatar', pasangan: 'B. Kedua tangan diletakkan di depan dada menghadap bola' },
      { premis: '3. Menangkap bola menyusur tanah', pasangan: 'C. Berjongkok atau bertumpu pada satu lutut di tanah' }
    ]
  },
  {
    id: 'bk-kasti-taktik-bakar',
    topicCategory: 'kasti',
    subtopic: 'Taktik Regu Penjaga & Mematikan Lawan',
    baseQuestion: 'Tindakan yang sah dilakukan oleh regu penjaga untuk mematikan langkah pelari lawan yang sedang berlari di luar tiang hinggap adalah...?',
    correctConcept: 'Melempar bola mengenai bagian tubuh pelari atau membakar ruang bebas jika ruang pemukul kosong',
    distractors: ['Menarik kaus atau menabrak pelari secara sengaja', 'Membuang bola keluar lapangan permainan', 'Menghalangi lari dengan memeluk badan lawan'],
    explanation: 'Dalam kasti, pemain pemukul yang sedang berlari dinyatakan mati sah apabila dilempar bola tepat mengenai tubuhnya atau ruang bebas dibakar oleh penjaga.',
    indikator: 'Peserta didik dapat menganalisis cara sah mematikan lawan dalam permainan kasti.',
    level: 'Level 3 (C4 - Menganalisis)',
    isianKeyword: 'Melempar bola mengenai tubuh pelari',
    uraianPrompt: 'Jelaskan apa yang dimaksud dengan istilah "membakar ruang bebas" dalam kasti dan kapan hal itu terjadi!',
    uraianModelAnswer: 'Membakar ruang bebas adalah tindakan pemain penjaga melempar atau meletakkan bola di ruang bebas saat ruang pemukul sedang kosong tak ada pemain yang memukul, sehingga terjadi pergantian bebas regu main.',
    uraianRubrik: 'Skor 5 jika menjelaskan kondisi ruang kosong dan proses meletakkan bola di ruang bebas.',
    pgkStatements: [
      { pernyataan: 'Lemparan bola kepada pelari lawan tidak boleh mengenai bagian kepala secara sengaja.', jawabanBenar: 'Benar' },
      { pernyataan: 'Pelari yang sudah menyentuh tiang hinggap tetap boleh dimatikan dengan dilempar bola.', jawabanBenar: 'Salah' },
      { pernyataan: 'Kerjasama operan cepat antarpenjaga mempermudah mematikan pelari lawan.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Mematikan pelari', pasangan: 'A. Melempar bola ke tubuh pelari yang berada di luar base' },
      { premis: '2. Membakar ruang bebas', pasangan: 'B. Menguasai bola di ruang bebas saat ruang regu pemukul kosong' },
      { premis: '3. Menghindar lemparan', pasangan: 'C. Melompat atau meliukkan tubuh tanpa keluar lintasan' }
    ]
  },

  // --- ATLETIK: LARI, LOMPAT, LEMPAR ---
  {
    id: 'atl-sprint-start',
    topicCategory: 'atletik',
    subtopic: 'Lari Jarak Pendek dan Start Jongkok',
    baseQuestion: 'Aba-aba resmi pada start jongkok lari jarak pendek (sprint) secara berurutan adalah...?',
    correctConcept: 'Bersedia, Siap, Ya! (atau bunyi pistol start)',
    distractors: ['Satu, Dua, Tiga, Lari!', 'Siap, Berdiri, Mulai!', 'Awas, Siap, Lompat!'],
    explanation: 'Sesuai regulasi atletik World Athletics, urutan aba-aba start jongkok resmi adalah Bersedia, Siap, Ya/Dor.',
    indikator: 'Peserta didik dapat menyebutkan urutan aba-aba start jongkok lari jarak pendek.',
    level: 'Level 1 (C1 - Mengingat)',
    isianKeyword: 'Bersedia, Siap, Ya! (atau tembakan pistol)',
    uraianPrompt: 'Jelaskan posisi tubuh saat mendengar aba-aba "Siap" pada start jongkok!',
    uraianModelAnswer: 'Pinggul diangkat sedikit lebih tinggi dari bahu, berat badan bertumpu ke depan pada kedua lengan, lutut kaki depan membentuk sudut 90 derajat, dan pandangan rileks ke lintasan.',
    uraianRubrik: 'Skor 5 jika menjelaskan pinggul diangkat lebih tinggi dari bahu dan tumpuan berat badan ke depan.',
    pgkStatements: [
      { pernyataan: 'Start jongkok digunakan untuk nomor lari jarak pendek (sprint).', jawabanBenar: 'Benar' },
      { pernyataan: 'Pada aba-aba "Bersedia", pelari langsung berdiri tegak dan berlari mendahului aba-aba.', jawabanBenar: 'Salah' },
      { pernyataan: 'Kedua siku ditekuk sekitar 90 derajat dan diayunkan selaras dengan irama langkah kaki.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Aba-aba "Bersedia"', pasangan: 'A. Berjongkok di belakang garis start dengan lutut menempel tanah' },
      { premis: '2. Aba-aba "Siap"', pasangan: 'B. Mengangkat pinggul lebih tinggi dari bahu dan tumpuan ke depan' },
      { premis: '3. Aba-aba "Ya / Dor"', pasangan: 'C. Menolak kaki sekuat tenaga dan melesat cepat ke depan' }
    ]
  },
  {
    id: 'atl-estafet-lompat',
    topicCategory: 'atletik',
    subtopic: 'Lari Estafet dan Lompat Jauh',
    baseQuestion: 'Saat mendarat pada bak pasir lompat jauh, kedua kaki harus mendarat bersamaan dengan lutut mengeper bertujuan untuk...?',
    correctConcept: 'Meredam hentakan benturan dan menjaga keseimbangan tubuh agar tidak jatuh ke belakang',
    distractors: ['Menambah jarak lompatan sejauh 2 meter', 'Menghindari debu pasir mengotori pakaian', 'Menghentikan waktu perlombaan juri'],
    explanation: 'Lutut yang mengeper saat mendarat meredam gaya gravitasi bumi, melindungi persendian lutut, dan menjaga momentum tubuh condong ke depan.',
    indikator: 'Peserta didik dapat menganalisis fungsi pendaratan mengeper pada lompat jauh.',
    level: 'Level 3 (C4 - Menganalisis)',
    isianKeyword: 'Meredam benturan / menjaga keseimbangan',
    uraianPrompt: 'Tuliskan 4 tahapan utama dalam gerakan lompat jauh gaya jongkok!',
    uraianModelAnswer: '1. Awalan (lari cepat terkontrol), 2. Tolakan (menggunakan satu kaki terkuat di papan tolak), 3. Melayang di udara (sikap jongkok), 4. Mendarat di bak pasir dengan kedua kaki mengeper.',
    uraianRubrik: 'Skor 5 jika menuliskan 4 tahapan lengkap dan berurutan; skor 3 jika 3 tahapan; skor 1 jika kurang dari 3.',
    pgkStatements: [
      { pernyataan: 'Tolakan lompat jauh harus menggunakan satu kaki terkuat di atas balok tumpuan.', jawabanBenar: 'Benar' },
      { pernyataan: 'Tongkat estafet boleh dilempar ke pelari berikutnya dari jarak 3 meter.', jawabanBenar: 'Salah' },
      { pernyataan: 'Mendarat dengan lutut mengeper mencegah risiko cedera pada persendian kaki.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Awalan lompat jauh', pasangan: 'A. Berlari cepat untuk membangun kecepatan horizontal' },
      { premis: '2. Tolakan lompat jauh', pasangan: 'B. Menjejakkan satu kaki terkuat untuk mengangkat tubuh ke atas' },
      { premis: '3. Pendaratan lompat jauh', pasangan: 'C. Mendarat bersamaan dengan kedua lutut mengeper di pasir' }
    ]
  },

  // --- SENAM LANTAI & KETANGKASAN ---
  {
    id: 'snm-guling-depan',
    topicCategory: 'senam lantai',
    subtopic: 'Guling Depan (Forward Roll)',
    baseQuestion: 'Bagian tubuh yang pertama kali menyentuh matras saat melakukan gerakan guling depan (forward roll) setelah kedua telapak tangan menumpu adalah...?',
    correctConcept: 'Tengkuk (leher bagian belakang)',
    distractors: ['Ubun-ubun puncak kepala', 'Dahi bagian depan', 'Punggung bagian bawah'],
    explanation: 'Menempelkan dagu rapat ke dada membuat tengkuk mendarat terlebih dahulu sehingga leher aman dari benturan langsung.',
    indikator: 'Peserta didik dapat mengidentifikasi bagian tubuh pertama yang kontak dengan matras pada guling depan.',
    level: 'Level 2 (C3 - Menerapkan)',
    isianKeyword: 'Tengkuk (leher bagian belakang)',
    uraianPrompt: 'Mengapa saat melakukan guling depan dagu harus dirapatkan ke dada?',
    uraianModelAnswer: 'Agar leher terlindungi dari tumpuan langsung dan tengkuk yang pertama kali menyentuh matras, sehingga gerakan berguling lancar dan terhindar dari cedera leher.',
    uraianRubrik: 'Skor 5 jika menjelaskan perlindungan leher dan perkenaan tengkuk secara jelas.',
    pgkStatements: [
      { pernyataan: 'Dagu wajib ditempelkan ke dada saat melakukan guling depan di atas matras.', jawabanBenar: 'Benar' },
      { pernyataan: 'Tumpuan guling depan bertumpu pada puncak ubun-ubun kepala.', jawabanBenar: 'Salah' },
      { pernyataan: 'Matras busa berfungsi sebagai alat pengaman utama pencegah cedera senam lantai.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Guling depan', pasangan: 'A. Berguling ke arah depan bertumpu pada tengkuk' },
      { premis: '2. Sikap lilin', pasangan: 'B. Tumpuan pundak dengan kedua kaki tegak lurus ke atas' },
      { premis: '3. Kayang', pasangan: 'C. Membusurkan badan ke atas dengan tumpuan telapak tangan dan kaki' }
    ]
  },
  {
    id: 'snm-sikap-lilin',
    topicCategory: 'senam lantai',
    subtopic: 'Sikap Lilin dan Keseimbangan',
    baseQuestion: 'Pada gerakan senam lantai sikap lilin, kedua kaki diangkat lurus vertikal ke atas dengan tumpuan berat badan berada pada...?',
    correctConcept: 'Pundak dan punggung atas dengan kedua tangan menopang pinggang',
    distractors: ['Kepala dan dahi bagian depan', 'Kedua telapak kaki', 'Ujung jari-jemari tangan'],
    explanation: 'Sikap lilin bertumpu pada pundak dan tengkuk dengan pinggang ditopang kokoh oleh kedua tangan agar kaki tegak lurus.',
    indikator: 'Peserta didik dapat menganalisis tumpuan tubuh yang benar pada sikap lilin.',
    level: 'Level 2 (C3 - Menerapkan)',
    isianKeyword: 'Pundak dan punggung atas',
    uraianPrompt: 'Jelaskan bagaimana cara melakukan sikap lilin yang benar dan aman di atas matras!',
    uraianModelAnswer: 'Tidur telentang di matras, angkat kedua kaki lurus ke atas, topang pinggang dengan kedua telapak tangan, dan jaga berat badan bertumpu pada pundak dengan kedua kaki rapat lurus.',
    uraianRubrik: 'Skor 5 jika menyebutkan posisi telentang, topangan tangan di pinggang, dan tumpuan pundak.',
    pgkStatements: [
      { pernyataan: 'Kedua tangan menopang pinggang untuk menjaga kedua kaki tetap lurus ke atas pada sikap lilin.', jawabanBenar: 'Benar' },
      { pernyataan: 'Gerakan senam lantai boleh dilakukan di atas lantai semen tanpa matras pengaman.', jawabanBenar: 'Salah' },
      { pernyataan: 'Senam lantai melatih kelenturan, kekuatan otot perut, dan keseimbangan tubuh.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Sikap kapal terbang', pasangan: 'A. Bertumpu pada satu kaki dengan badan dan satu kaki mendatar' },
      { premis: '2. Berdiri satu kaki', pasangan: 'B. Melatih keseimbangan statis tubuh di tempat' },
      { premis: '3. Matras senam', pasangan: 'C. Landasan empuk untuk meredam benturan pendaratan' }
    ]
  },

  // --- AKTIVITAS GERAK BERIRAMA (SENAM IRAMA) ---
  {
    id: 'irama-langkah-unsur',
    topicCategory: 'gerak berirama',
    subtopic: 'Langkah Dasar Senam Irama',
    baseQuestion: 'Unsur utama yang paling mendasar dalam aktivitas gerak berirama (senam irama) adalah...?',
    correctConcept: 'Keselarasan gerak langkah dan ayunan tangan dengan ketukan irama atau musik',
    distractors: ['Kecepatan memukul bola sekeras mungkin', 'Kekuatan mengangkat beban besi berat', 'Menahan napas selama mungkin'],
    explanation: 'Senam irama memadukan keindahan gerak tubuh selaras dengan tempo ketukan musik atau irama hitungan.',
    indikator: 'Peserta didik dapat mengidentifikasi unsur utama dalam aktivitas gerak berirama.',
    level: 'Level 1 (C1 - Mengingat)',
    isianKeyword: 'Keselarasan dengan irama / musik',
    uraianPrompt: 'Sebutkan 3 unsur penting yang harus diperhatikan dalam senam irama!',
    uraianModelAnswer: '1. Keluwesan gerak (fleksibilitas), 2. Ketepatan gerak dengan irama/musik, 3. Kontinuitas (kelancaran gerak tanpa terputus).',
    uraianRubrik: 'Skor 5 jika menyebutkan keluwesan, ketepatan irama, dan kontinuitas gerakan.',
    pgkStatements: [
      { pernyataan: 'Gerak langkah dan ayunan lengan dalam senam irama harus selaras dengan irama musik.', jawabanBenar: 'Benar' },
      { pernyataan: 'Gerakan tubuh saat senam irama harus kaku dan terburu-buru.', jawabanBenar: 'Salah' },
      { pernyataan: 'Senam irama beregu melatih kekompakan, keserasian gerak, dan gotong royong.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Looppas', pasangan: 'A. Gerakan langkah biasa secara wajar dan berirama' },
      { premis: '2. Bijtrekpas', pasangan: 'B. Gerakan langkah kaki rapat' },
      { premis: '3. Galoppas', pasangan: 'C. Gerakan langkah ke depan dengan irama cepat' }
    ]
  },

  // --- BELA DIRI PENCAK SILAT ---
  {
    id: 'slt-kuda-kuda-tangkisan',
    topicCategory: 'pencak silat',
    subtopic: 'Kuda-kuda dan Tangkisan Pencak Silat',
    baseQuestion: 'Sikap dasar menapakkan kaki untuk memperkokoh posisi tubuh agar tidak mudah goyah saat diserang lawan dalam pencak silat disebut...?',
    correctConcept: 'Kuda-kuda',
    distractors: ['Sikap santai berdiri', 'Sikap duduk bersila', 'Sikap berbaring telentang'],
    explanation: 'Kuda-kuda adalah pondasi kaki yang kokoh untuk menopang berat badan dan menjaga keseimbangan tubuh saat menyerang maupun bertahan.',
    indikator: 'Peserta didik dapat mengidentifikasi fungsi sikap kuda-kuda dalam pencak silat.',
    level: 'Level 1 (C1 - Mengingat)',
    isianKeyword: 'Kuda-kuda',
    uraianPrompt: 'Jelaskan mengapa sikap kuda-kuda sangat penting dalam bela diri pencak silat!',
    uraianModelAnswer: 'Karena kuda-kuda menjadi pondasi kokoh penyeimbang berat badan agar pesilat tidak mudah goyah atau terjatuh saat menerima atau melancarkan serangan.',
    uraianRubrik: 'Skor 5 jika menjelaskan fungsi keseimbangan tubuh dan pondasi kekuatan kaki.',
    pgkStatements: [
      { pernyataan: 'Kuda-kuda menjadi dasar tumpuan keseimbangan dalam pencak silat.', jawabanBenar: 'Benar' },
      { pernyataan: 'Gerakan tangkisan bertujuan mencederai lawan sebanyak mungkin.', jawabanBenar: 'Salah' },
      { pernyataan: 'Pencak silat mengajarkan budi pekerti luhur, disiplin diri, dan kerendahan hati.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Kuda-kuda depan', pasangan: 'A. Berat badan bertumpu pada kaki depan yang ditekuk' },
      { premis: '2. Tangkisan luar', pasangan: 'B. Membuang serangan lawan dari arah dalam ke luar tubuh' },
      { premis: '3. Pukulan lurus', pasangan: 'C. Dorongan kepalan tangan lurus ke depan sejajar dada' }
    ]
  },

  // --- KEBUGARAN JASMANI ---
  {
    id: 'kbg-otot-daya-tahan',
    topicCategory: 'kebugaran jasmani',
    subtopic: 'Latihan Kekuatan dan Daya Tahan',
    baseQuestion: 'Latihan gerak push-up secara teratur dan berulang bertujuan utama untuk melatih kekuatan dan daya tahan otot...?',
    correctConcept: 'Lengan, dada, dan bahu',
    distractors: ['Betis dan telapak kaki', 'Leher dan kepala', 'Jari-jari kaki'],
    explanation: 'Push-up melatih otot pektoralis (dada), trisep (lengan belakang), dan deltoid (bahu) melalui dorongan beban tubuh.',
    indikator: 'Peserta didik dapat mengidentifikasi kelompok otot yang dilatih pada gerakan push-up.',
    level: 'Level 1 (C2 - Memahami)',
    isianKeyword: 'Lengan, dada, dan bahu',
    uraianPrompt: 'Jelaskan perbedaan antara latihan sit-up dan push-up serta kelompok otot yang dilatihnya!',
    uraianModelAnswer: 'Push-up melatih otot lengan, bahu, dan dada dengan mendorong tubuh dari lantai. Sit-up melatih otot perut (abdomen) dengan mengangkat punggung dari posisi telentang.',
    uraianRubrik: 'Skor 5 jika membedakan kedua latihan beserta otot dada/lengan dan otot perut secara presisi.',
    pgkStatements: [
      { pernyataan: 'Push-up melatih kekuatan otot dada, lengan, dan bahu.', jawabanBenar: 'Benar' },
      { pernyataan: 'Setelah berlari kencang murid dianjurkan langsung duduk santai tanpa pendinginan.', jawabanBenar: 'Salah' },
      { pernyataan: 'Lari bolak-balik (shuttle run) bertujuan untuk mengukur kelincahan dan koordinasi gerak.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Push-up', pasangan: 'A. Melatih kekuatan otot lengan, dada, dan bahu' },
      { premis: '2. Sit-up', pasangan: 'B. Melatih kekuatan dan ketahanan otot perut (abdomen)' },
      { premis: '3. Shuttle run', pasangan: 'C. Melatih kelincahan dan kecepatan mengubah arah' }
    ]
  },
  {
    id: 'kbg-pemanasan-pendinginan',
    topicCategory: 'kebugaran jasmani',
    subtopic: 'Pemanasan dan Pendinginan',
    baseQuestion: 'Tujuan utama melakukan pemanasan (warming-up) sebelum memulai aktivitas olahraga inti adalah...?',
    correctConcept: 'Menaikkan suhu tubuh secara bertahap dan mencegah risiko cedera otot atau persendian',
    distractors: ['Menghabiskan tenaga sebelum bermain', 'Membuat tubuh cepat lelah dan mengantuk', 'Menunda dimulainya pelajaran'],
    explanation: 'Pemanasan meningkatkan elastisitas otot, melumasi persendian, dan menyiapkan sistem kardiovaskular menghadapi aktivitas berat.',
    indikator: 'Peserta didik dapat menganalisis fungsi pemanasan sebelum berolahraga.',
    level: 'Level 2 (C3 - Menerapkan)',
    isianKeyword: 'Menaikkan suhu tubuh dan mencegah cedera',
    uraianPrompt: 'Mengapa kita wajib melakukan pendinginan (cooling down) setelah berolahraga berat?',
    uraianModelAnswer: 'Karena pendinginan membantu menurunkan detak jantung dan peredaran darah kembali ke ritme normal, mencegah penumpukan asam laktat yang memicu kram, serta mencegah pusing atau pingsan.',
    uraianRubrik: 'Skor 5 jika mengaitkan detak jantung normal, pencegahan kram/asam laktat, dan aliran darah lancar.',
    pgkStatements: [
      { pernyataan: 'Pemanasan dinamis dan statis membantu mencegah terjadinya kram atau cedera otot.', jawabanBenar: 'Benar' },
      { pernyataan: 'Pendinginan tidak diperlukan bagi anak-anak usia sekolah dasar.', jawabanBenar: 'Salah' },
      { pernyataan: 'Meminum air putih bersih matang membantu mengembalikan cairan tubuh yang hilang lewat keringat.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Pemanasan (Warming up)', pasangan: 'A. Menaikkan suhu tubuh dan menyiapkan otot' },
      { premis: '2. Olahraga inti', pasangan: 'B. Aktivitas utama untuk mencapai tujuan pembelajaran gerak' },
      { premis: '3. Pendinginan (Cooling down)', pasangan: 'C. Menormalkan detak jantung dan meredakan ketegangan otot' }
    ]
  },

  // --- AKTIVITAS AIR & RENANG ---
  {
    id: 'air-renang-dada-napas',
    topicCategory: 'aktivitas air',
    subtopic: 'Renang Gaya Dada dan Keselamatan Air',
    baseQuestion: 'Pengambilan napas (inhalasi) pada renang gaya dada dilakukan saat...?',
    correctConcept: 'Kepala terangkat ke atas permukaan air saat kedua tangan melakukan tarikan membuka ke samping',
    distractors: ['Kepala terbenam sepenuhnya di dalam air', 'Kaki menendang ke dinding kolam', 'Tubuh berdiri di dasar kolam yang dalam'],
    explanation: 'Pada renang gaya dada, dorongan tarikan tangan mengangkat bahu dan kepala ke atas permukaan air untuk menghirup udara lewat mulut.',
    indikator: 'Peserta didik dapat menentukan waktu pengambilan napas pada renang gaya dada.',
    level: 'Level 2 (C3 - Menerapkan)',
    isianKeyword: 'Saat kepala terangkat di atas permukaan air',
    uraianPrompt: 'Tuliskan 3 aturan keselamatan penting yang wajib dipatuhi saat berada di kolam renang!',
    uraianModelAnswer: '1. Tidak boleh berlari di tepi kolam yang licin, 2. Melakukan pemanasan sebelum masuk air, 3. Berenang di kedalaman yang sesuai dengan kemampuan dan didampingi guru.',
    uraianRubrik: 'Skor 5 jika menyebutkan larangan berlari di tepi kolam, pemanasan, dan pengawasan guru/kedalaman yang aman.',
    pgkStatements: [
      { pernyataan: 'Menghembuskan napas di dalam air dilakukan melalui mulut atau hidung secara teratur.', jawabanBenar: 'Benar' },
      { pernyataan: 'Bercanda dan saling dorong di tepi kolam yang licin sangat dianjurkan untuk keberanian.', jawabanBenar: 'Salah' },
      { pernyataan: 'Posisi meluncur (streamline) dilakukan dengan tubuh lurus sejajar permukaan air.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Posisi meluncur', pasangan: 'A. Sikap tubuh lurus mendatar sejajar permukaan air' },
      { premis: '2. Gerakan tungkai gaya dada', pasangan: 'B. Menendang melingkar ke samping lalu menutup rapat seperti katak' },
      { premis: '3. Pelampung renang', pasangan: 'C. Alat bantu keselamatan menjaga tubuh tetap terapung' }
    ]
  },

  // --- KESEHATAN, GIZI & PHBS ---
  {
    id: 'kes-cuci-tangan-gizi',
    topicCategory: 'kesehatan',
    subtopic: 'Kebersihan Diri dan Gizi Seimbang',
    baseQuestion: 'Mencuci tangan menggunakan sabun dan air mengalir yang dianjurkan dilakukan selama minimal...?',
    correctConcept: '20 sampai 30 detik',
    distractors: ['2 detik', '5 menit', '1 jam'],
    explanation: 'Mencuci tangan dengan sabun selama 20-30 detik efektif merusak lapisan lemak pelindung kuman dan virus hingga mati.',
    indikator: 'Peserta didik dapat menyebutkan durasi mencuci tangan pakai sabun yang higienis.',
    level: 'Level 1 (C1 - Mengingat)',
    isianKeyword: '20 sampai 30 detik',
    uraianPrompt: 'Sebutkan 3 bagian tangan yang sering terlewatkan saat mencuci tangan!',
    uraianModelAnswer: '1. Sela-sela jari tangan, 2. Punggung tangan, 3. Bagian bawah kuku dan ujung jempol.',
    uraianRubrik: 'Skor 5 jika menyebutkan sela jari, punggung tangan, dan bawah kuku/ujung jempol.',
    pgkStatements: [
      { pernyataan: 'Mencuci tangan dengan sabun dan air bersih mengalir mematikan kuman penyakit.', jawabanBenar: 'Benar' },
      { pernyataan: 'Piring makan sehat Isi Piringku menganjurkan hanya memakan gorengan berlemak.', jawabanBenar: 'Salah' },
      { pernyataan: 'Mengganti pakaian olahraga yang basah oleh keringat mencegah penyakit gatal pada kulit.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Sayur dan buah', pasangan: 'A. Sumber vitamin, mineral, dan serat penjaga daya tahan tubuh' },
      { premis: '2. Makanan pokok (karbohidrat)', pasangan: 'B. Sumber tenaga utama untuk beraktivitas fisik' },
      { premis: '3. Lauk pauk (protein)', pasangan: 'C. Zat pembangun sel tubuh dan pertumbuhan otot' }
    ]
  },

  // --- PERMAINAN TRADISIONAL ---
  {
    id: 'trad-gobak-sodor',
    topicCategory: 'permainan tradisional',
    subtopic: 'Gobak Sodor (Galasin) dan Bentengan',
    baseQuestion: 'Pada permainan tradisional gobak sodor (galasin), pemain yang bertugas menjaga garis lurus tengah yang membelah lapangan dinamakan...?',
    correctConcept: 'Penjaga garis sodor',
    distractors: ['Penjaga gawang', 'Wasit garis luar', 'Kapten cadangan'],
    explanation: 'Penjaga garis sodor bertugas bergerak vertikal di garis lurus tengah untuk menghadang gerak lawan di seluruh petak.',
    indikator: 'Peserta didik dapat menentukan peran penjaga garis sodor pada permainan gobak sodor.',
    level: 'Level 1 (C2 - Memahami)',
    isianKeyword: 'Penjaga garis sodor',
    uraianPrompt: 'Jelaskan cara menentukan kemenangan regu penyerang dalam permainan gobak sodor!',
    uraianModelAnswer: 'Regu penyerang menang apabila ada anggotanya yang berhasil bolak-balik menembus seluruh garis penjagaan dari depan hingga ujung belakang dan kembali ke depan tanpa tersentuh oleh pemain penjaga.',
    uraianRubrik: 'Skor 5 jika menjelaskan rute bolak-balik melewati seluruh garis pertahanan tanpa tersentuh.',
    pgkStatements: [
      { pernyataan: 'Permainan tradisional gobak sodor melatih kelincahan, kecepatan lari, dan kerjasama tim.', jawabanBenar: 'Benar' },
      { pernyataan: 'Pemain penjaga garis sodor boleh berlari keluar dari garis batas tengah.', jawabanBenar: 'Salah' },
      { pernyataan: 'Bermain permainan tradisional ikut melestarikan warisan budaya luhur bangsa.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Gobak sodor', pasangan: 'A. Permainan hadang menghadang di atas petak bergaris' },
      { premis: '2. Bentengan', pasangan: 'B. Permainan adu lari dan taktik menyentuh tiang benteng lawan' },
      { premis: '3. Engklek', pasangan: 'C. Melompat satu kaki di atas petak-petak gambar di tanah' }
    ]
  },

  // --- POLA GERAK DASAR FUNDAMENTAL (LOKOMOTOR, NON-LOKOMOTOR, MANIPULATIF) ---
  {
    id: 'fnd-loko-nonloko-manip',
    topicCategory: 'pola gerak dasar',
    subtopic: 'Gerak Lokomotor, Non-Lokomotor, dan Manipulatif',
    baseQuestion: 'Gerakan tubuh yang ditandai dengan berpindahnya seluruh tubuh dari satu tempat ke tempat lain seperti berjalan dan berlari dinamakan pola gerak...?',
    correctConcept: 'Gerak lokomotor',
    distractors: ['Gerak non-lokomotor', 'Gerak manipulatif', 'Gerak pasif'],
    explanation: 'Gerak lokomotor adalah gerak dasar berpindah tempat (misal: jalan, lari, lompat, loncat, guling).',
    indikator: 'Peserta didik dapat mengklasifikasikan pola gerak dasar lokomotor.',
    level: 'Level 1 (C1 - Mengingat)',
    isianKeyword: 'Gerak lokomotor',
    uraianPrompt: 'Jelaskan perbedaan antara gerak lokomotor, non-lokomotor, dan manipulatif beserta contohnya!',
    uraianModelAnswer: 'Lokomotor: gerak berpindah tempat (contoh: berlari). Non-lokomotor: gerak di tempat tanpa berpindah (contoh: meliuk, membungkuk). Manipulatif: gerak menggunakan objek luar (contoh: melempar dan menangkap bola).',
    uraianRubrik: 'Skor 5 jika membedakan ketiganya dengan definisi dan contoh yang benar.',
    pgkStatements: [
      { pernyataan: 'Melompat, berjalan, dan berlari merupakan contoh gerak dasar lokomotor.', jawabanBenar: 'Benar' },
      { pernyataan: 'Menendang bola termasuk gerak non-lokomotor karena hanya menggunakan satu kaki.', jawabanBenar: 'Salah' },
      { pernyataan: 'Meliukkan badan dan mengayun lengan di tempat tergolong gerak non-lokomotor.', jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Gerak lokomotor', pasangan: 'A. Berpindah tempat (berjalan, berlari, melompat)' },
      { premis: '2. Gerak non-lokomotor', pasangan: 'B. Bergerak di tempat (meliuk, membungkuk, memutar)' },
      { premis: '3. Gerak manipulatif', pasangan: 'C. Mengendalikan alat/objek (melempar, menangkap, menendang bola)' }
    ]
  }
];

// Helper to find matching bank items for a topic
function getBankItemsForTopic(topic: string): BankItem[] {
  const tLower = (topic || '').toLowerCase();
  const matched = QUESTION_BANK.filter(item => {
    const cat = item.topicCategory.toLowerCase();
    const sub = item.subtopic.toLowerCase();
    return (
      tLower.includes(cat) ||
      cat.includes(tLower) ||
      tLower.includes(sub) ||
      sub.includes(tLower)
    );
  });

  if (matched.length > 0) return matched;

  // Fallback matching by keywords
  if (tLower.includes('sepak') || tLower.includes('bola besar')) {
    return QUESTION_BANK.filter(q => q.topicCategory === 'sepak bola');
  }
  if (tLower.includes('voli')) {
    return QUESTION_BANK.filter(q => q.topicCategory === 'bola voli');
  }
  if (tLower.includes('basket')) {
    return QUESTION_BANK.filter(q => q.topicCategory === 'bola basket');
  }
  if (tLower.includes('kasti') || tLower.includes('rounders') || tLower.includes('bola kecil')) {
    return QUESTION_BANK.filter(q => q.topicCategory === 'kasti');
  }
  if (tLower.includes('lari') || tLower.includes('lompat') || tLower.includes('atletik') || tLower.includes('estafet')) {
    return QUESTION_BANK.filter(q => q.topicCategory === 'atletik');
  }
  if (tLower.includes('senam') || tLower.includes('guling') || tLower.includes('lilin') || tLower.includes('lantai')) {
    return QUESTION_BANK.filter(q => q.topicCategory === 'senam lantai');
  }
  if (tLower.includes('irama') || tLower.includes('ritmik') || tLower.includes('musik')) {
    return QUESTION_BANK.filter(q => q.topicCategory === 'gerak berirama');
  }
  if (tLower.includes('silat') || tLower.includes('bela diri')) {
    return QUESTION_BANK.filter(q => q.topicCategory === 'pencak silat');
  }
  if (tLower.includes('bugar') || tLower.includes('kebugaran') || tLower.includes('kekuatan') || tLower.includes('kelenturan')) {
    return QUESTION_BANK.filter(q => q.topicCategory === 'kebugaran jasmani');
  }
  if (tLower.includes('renang') || tLower.includes('air') || tLower.includes('kolam')) {
    return QUESTION_BANK.filter(q => q.topicCategory === 'aktivitas air');
  }
  if (tLower.includes('sehat') || tLower.includes('gizi') || tLower.includes('kebersihan') || tLower.includes('phbs')) {
    return QUESTION_BANK.filter(q => q.topicCategory === 'kesehatan');
  }
  if (tLower.includes('tradisional') || tLower.includes('gobak') || tLower.includes('benteng') || tLower.includes('engklek')) {
    return QUESTION_BANK.filter(q => q.topicCategory === 'permainan tradisional');
  }

  // Return full pool shuffled as broad PJOK repository
  return QUESTION_BANK;
}

// Generate dynamic synthetic item when more questions are needed than in bank
function generateSyntheticItem(topic: string, index: number, rng: () => number): BankItem {
  const angles = [
    {
      title: 'Biomekanika & Sikap Tubuh',
      qText: `Dalam mempraktikkan materi "${topic}", sikap tumpuan tubuh dan pengaturan keseimbangan yang paling tepat pada posisi awal adalah...?`,
      correct: 'Kaki tumpu sedikit ditekuk lentur dan pandangan fokus ke arah sasaran',
      distractors: [
        'Menutup kedua mata rapat-rapat saat bergerak',
        'Mencondongkan badan ke belakang secara berlebihan',
        'Meluruskan lutut kaku tanpa tumpuan yang seimbang'
      ],
      explanation: `Pada materi "${topic}", tekukan lutut yang lentur berfungsi menjaga pusat gravitasi tubuh tetap stabil dan siap merespons perubahan gerakan.`,
      indikator: `Disajikan situasi gerak ${topic}, peserta didik dapat menganalisis sikap tumpuan tubuh yang seimbang.`,
      level: 'Level 2 (C3 - Menerapkan)',
      isianKeyword: 'Kaki tumpu sedikit ditekuk lentur',
      uraianPrompt: `Jelaskan secara runtut 3 langkah utama pelaksanaan serta 2 faktor keselamatan penting saat mempraktikkan aktivitas "${topic}"!`,
      uraianModelAnswer: `Langkah utama: 1) Pemanasan dan tumpuan seimbang, 2) Pelaksanaan gerakan inti dengan fokus dan koordinasi, 3) Gerak ikutan (follow-through). Faktor keselamatan: memakai pakaian olahraga yang nyaman dan memeriksa area lapangan bebas rintangan tajam.`,
      uraianRubrik: 'Skor 5 jika memaparkan 3 langkah runtut dan 2 faktor keselamatan dengan logis.'
    },
    {
      title: 'Aturan & Kerjasama Sportif',
      qText: `Ketika terjadi benturan atau perbedaan pendapat antartim saat memainkan materi "${topic}", tindakan terpuji yang mencerminkan sportivitas adalah...?`,
      correct: 'Membantu kawan yang terjatuh dan menghormati keputusan guru atau wasit',
      distractors: [
        'Membalas mendorong lawan secara diam-diam',
        'Memprotes keras dan mogok tidak mau melanjutkan kegiatan',
        'Mengejek kelemahan tim lawan di hadapan teman-teman'
      ],
      explanation: `Prinsip utama pembelajaran PJOK adalah menjunjung tinggi sportivitas, kejujuran, dan empati gotong royong di atas ambisi kemenangan semata.`,
      indikator: `Peserta didik dapat mengevaluasi penerapan nilai sportivitas dan gotong royong pada materi ${topic}.`,
      level: 'Level 3 (C5 - Mengevaluasi)',
      isianKeyword: 'Sportivitas dan gotong royong',
      uraianPrompt: `Mengapa kejujuran dan saling menghargai antarteman sangat penting dipraktikkan dalam kegiatan "${topic}"?`,
      uraianModelAnswer: `Karena kejujuran dan saling menghargai menciptakan suasana belajar yang aman, menyenangkan, menghindari pertengkaran, dan menumbuhkan karakter Profil Pelajar Pancasila.`,
      uraianRubrik: 'Skor 5 jika mengaitkan dengan rasa aman, kedamaian permainan, dan pembentukan karakter.'
    },
    {
      title: 'Keselamatan & Pencegahan Cedera',
      qText: `Tindakan preventif yang wajib dilakukan murid sebelum memulai praktik materi "${topic}" agar tidak mengalami kram atau cedera persendian adalah...?`,
      correct: 'Melakukan peregangan statis dan dinamis secara menyeluruh dari kepala hingga kaki',
      distractors: [
        'Meminum minuman manis bersoda dingin sebanyak-banyaknya',
        'Langsung mempraktikkan gerakan terberat tanpa pemanasan',
        'Duduk diam di pinggir lapangan sambil makan camilan'
      ],
      explanation: `Peregangan meningkatkan aliran darah ke jaringan otot, melumasi persendian, dan menaikkan suhu tubuh sehingga otot siap berkontraksi aman.`,
      indikator: `Peserta didik dapat mengidentifikasi prosedur keselamatan pencegahan cedera pada materi ${topic}.`,
      level: 'Level 1 (C2 - Memahami)',
      isianKeyword: 'Pemanasan peregangan otot dinamis dan statis',
      uraianPrompt: `Sebutkan 3 perlengkapan atau kondisi lapangan yang harus dipastikan keamanannya sebelum melaksanakan aktivitas "${topic}"!`,
      uraianModelAnswer: '1. Sepatu olahraga yang tidak licin dan bertali rapi, 2. Lapangan bebas dari kerikil tajam, pecahan kaca, atau genangan air, 3. Alat bantu (bola/matras) dalam kondisi layak pakai.',
      uraianRubrik: 'Skor 5 jika menyebutkan sepatu aman, lapangan bebas bahaya, dan kelayakan alat.'
    },
    {
      title: 'Analisis Kesalahan Gerak & Solusi',
      qText: `Seorang murid sering mengalami kegagalan arah saat melakukan gerakan pada materi "${topic}". Faktor penyebab mekanis yang paling mungkin terjadi adalah...?`,
      correct: 'Arah pandangan mata tidak fokus ke sasaran dan perkenaan titik kontak melenceng',
      distractors: [
        'Menggunakan seragam olahraga yang bersih',
        'Melakukan pemanasan yang cukup sebelum bermain',
        'Mendengarkan instruksi guru dengan saksama'
      ],
      explanation: `Fokus visual memandu koordinasi neuromuskular tubuh dalam mengarahkan gaya dorong tepat ke target yang dituju.`,
      indikator: `Peserta didik dapat mendiagnosis kesalahan mekanika gerak pada materi ${topic}.`,
      level: 'Level 3 (C4 - Menganalisis)',
      isianKeyword: 'Pandangan tidak fokus ke sasaran / titik kontak melenceng',
      uraianPrompt: `Bagaimana langkah-langkah yang harus dilakukan seorang murid untuk memperbaiki akurasi gerak pada materi "${topic}"?`,
      uraianModelAnswer: 'Melakukan latihan bertahap dari jarak dekat, mengatur posisi tumpuan kaki seimbang, mengarahkan pandangan ke target, dan mengulang gerakan secara konsisten.',
      uraianRubrik: 'Skor 5 jika menjelaskan tahapan latihan bertahap, perbaikan tumpuan, dan konsistensi repetisi.'
    }
  ];

  const angle = angles[index % angles.length];

  return {
    id: `syn-${topic.slice(0, 8)}-${index}-${Math.floor(rng() * 1000)}`,
    topicCategory: topic,
    subtopic: `${topic} (${angle.title})`,
    baseQuestion: angle.qText,
    correctConcept: angle.correct,
    distractors: angle.distractors,
    explanation: angle.explanation,
    indikator: angle.indikator,
    level: angle.level,
    isianKeyword: angle.isianKeyword,
    uraianPrompt: angle.uraianPrompt,
    uraianModelAnswer: angle.uraianModelAnswer,
    uraianRubrik: angle.uraianRubrik,
    pgkStatements: [
      { pernyataan: `Melakukan aktivitas "${topic}" secara teratur bermanfaat meningkatkan kebugaran jasmani dan koordinasi tubuh.`, jawabanBenar: 'Benar' },
      { pernyataan: `Saat mempraktikkan gerakan "${topic}", murid diperbolehkan bercanda dan mengabaikan aba-aba peluit guru demi hiburan.`, jawabanBenar: 'Salah' },
      { pernyataan: `Menerapkan nilai kejujuran dan disiplin aturan merupakan bagian penting dalam asesmen PJOK.`, jawabanBenar: 'Benar' }
    ],
    matchingPairs: [
      { premis: '1. Sikap Awalan', pasangan: 'A. Mengatur tumpuan seimbang dan fokus pandangan mata' },
      { premis: '2. Sikap Pelaksanaan', pasangan: 'B. Menyalurkan tenaga dorong gerakan secara terkontrol' },
      { premis: '3. Sikap Akhir (Follow-through)', pasangan: 'C. Menjaga keseimbangan tubuh agar tidak terjatuh' }
    ]
  };
}

export function generateSummativeAssessment(params: SummativeParams): SummativeResultOutput {
  const {
    jenisUjian = 'Sumatif Tengah Semester (STS)',
    mataPelajaran = 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    grade = '4',
    semester = '1',
    tahunPelajaran = '2026/2027',
    namaSekolah = 'SD Negeri Kalimantong',
    dinasPendidikan = 'Dinas Pendidikan Pemuda Dan Olahraga',
    babMateri = 'Permainan Bola Besar: Sepak Bola',
    babMateriList: incomingMateriList,
    bentukSoal = 'Pilihan Ganda',
    bentukSoalList = ['Pilihan Ganda'],
    bentukSoalDistribution,
    bentukSoalCounts = {},
    totalSoal = '5',
    jumlahOpsiPG = '4',
    levelKognitif = 'campuran',
    dimensiP3 = 'gotong_royong',
    skalaPenskoran = 'standar',
    seed
  } = params;

  // Initialize PRNG with unique seed or timestamp to guarantee fresh permutations
  const effectiveSeed = seed || `${Date.now()}_${Math.random()}_${totalSoal}_${grade}`;
  const rng = createPrng(effectiveSeed);

  // Parse materi list
  let cleanMateriList: string[] = [];
  if (Array.isArray(incomingMateriList) && incomingMateriList.length > 0) {
    cleanMateriList = incomingMateriList.map(m => String(m).trim()).filter(Boolean);
  } else if (typeof babMateri === 'string') {
    cleanMateriList = babMateri.split(/\n|;/).map(s => s.trim()).filter(Boolean);
  }
  if (cleanMateriList.length === 0) {
    cleanMateriList = ['Permainan Bola Besar: Sepak Bola'];
  }
  const effectiveBabMateri = cleanMateriList.join('; ');

  // Parse shapes
  let cleanBentukList: string[] = [];
  if (Array.isArray(bentukSoalList) && bentukSoalList.length > 0) {
    cleanBentukList = Array.from(new Set(bentukSoalList.map(s => String(s).trim()).filter(Boolean)));
  } else if (typeof bentukSoal === 'string') {
    cleanBentukList = Array.from(new Set(bentukSoal.split(',').map(s => s.trim()).filter(Boolean)));
  }
  if (cleanBentukList.length === 0) {
    cleanBentukList = ['Pilihan Ganda'];
  }

  // Parse distribution
  let shapeDistribution: { name: string; count: number }[] = [];
  if (Array.isArray(bentukSoalDistribution) && bentukSoalDistribution.length > 0) {
    shapeDistribution = bentukSoalDistribution
      .filter(d => d && d.name && d.count > 0)
      .map(d => ({ name: d.name, count: Math.max(1, Math.min(25, Number(d.count) || 1)) }));
  } else if (bentukSoalCounts && Object.keys(bentukSoalCounts).length > 0) {
    shapeDistribution = cleanBentukList.map(name => ({
      name,
      count: Math.max(1, Math.min(25, Number(bentukSoalCounts[name]) || 1))
    }));
  }

  // Build allocated shapes list
  const allocatedShapes: string[] = [];
  if (shapeDistribution.length > 0) {
    for (const sd of shapeDistribution) {
      for (let k = 0; k < sd.count; k++) {
        allocatedShapes.push(sd.name);
      }
    }
  } else {
    const rawCount = Math.min(25, Math.max(1, parseInt(totalSoal) || 5));
    const basePerShape = Math.floor(rawCount / cleanBentukList.length);
    let remShape = rawCount % cleanBentukList.length;
    for (let s = 0; s < cleanBentukList.length; s++) {
      const numForShape = basePerShape + (remShape > 0 ? 1 : 0);
      if (remShape > 0) remShape--;
      for (let k = 0; k < numForShape; k++) {
        allocatedShapes.push(cleanBentukList[s]);
      }
    }
  }

  const effectiveCount = allocatedShapes.length > 0 ? allocatedShapes.length : (parseInt(totalSoal) || 5);
  const gNum = parseInt(grade) || 4;

  // Build pool of questions per materi with anti-duplication tracking
  const usedQuestionIds = new Set<string>();
  const questions: QuestionOutput[] = [];

  // Pre-shuffle bank items for each unique topic with the session PRNG
  const topicPools = new Map<string, BankItem[]>();
  for (const mat of cleanMateriList) {
    const items = getBankItemsForTopic(mat);
    topicPools.set(mat, shuffleArray(items, rng));
  }

  for (let i = 0; i < effectiveCount; i++) {
    const targetBentuk = allocatedShapes[i] || cleanBentukList[i % cleanBentukList.length] || 'Pilihan Ganda';
    const qMateri = cleanMateriList[i % cleanMateriList.length];

    // Retrieve pre-shuffled candidate bank items for this topic
    const topicCandidates = topicPools.get(qMateri) || [];

    // Pick an unused candidate if available, otherwise generate a distinct synthetic item
    let pickedItem: BankItem | null = null;
    for (const item of topicCandidates) {
      if (!usedQuestionIds.has(item.id)) {
        pickedItem = item;
        usedQuestionIds.add(item.id);
        break;
      }
    }

    if (!pickedItem) {
      // Generate guaranteed unique synthetic question item
      pickedItem = generateSyntheticItem(qMateri, i, rng);
      usedQuestionIds.add(pickedItem.id);
    }

    // Build Capaian Pembelajaran (CP) per Fase
    let cpText = '';
    if (gNum <= 2) {
      cpText = `Fase A: Peserta didik menunjukkan kemampuan dalam menirukan dan mempraktikkan variasi pola gerak dasar lokomotor, non-lokomotor, dan manipulatif pada materi ${qMateri}, serta membiasakan pola hidup sehat di lingkungan sekolah dan rumah.`;
    } else if (gNum <= 4) {
      cpText = `Fase B: Peserta didik menunjukkan kemampuan dalam mempraktikkan variasi dan kombinasi pola gerak dasar serta keterampilan gerak pada materi ${qMateri}, memahami aturan keselamatan, sportivitas, dan kebugaran jasmani.`;
    } else {
      cpText = `Fase C: Peserta didik menunjukkan kemampuan dalam menganalisis dan mempraktikkan variasi dan kombinasi gerak spesifik pada materi ${qMateri}, menerapkan taktik sederhana, serta memelihara kebugaran fisik dan kesehatan reproduksi.`;
    }

    // Determine target Level Kognitif
    let qLevel = pickedItem.level;
    if (levelKognitif === 'lots') {
      qLevel = i % 2 === 0 ? 'Level 1 (C1 - Mengingat)' : 'Level 1 (C2 - Memahami)';
    } else if (levelKognitif === 'mots') {
      qLevel = 'Level 2 (C3 - Menerapkan)';
    } else if (levelKognitif === 'hots') {
      qLevel = i % 2 === 0 ? 'Level 3 (C4 - Menganalisis)' : 'Level 3 (C5 - Mengevaluasi)';
    }

    // Calculate score weight
    let bobot = 1;
    if (skalaPenskoran === 'rata') {
      bobot = 10;
    } else if (skalaPenskoran === 'persen') {
      bobot = Math.max(1, Math.round(100 / effectiveCount));
    } else {
      if (targetBentuk === 'Pilihan Ganda') bobot = 1;
      else if (targetBentuk === 'Pilihan Ganda Kompleks') bobot = 2;
      else if (targetBentuk === 'Menjodohkan') bobot = 2;
      else if (targetBentuk === 'Isian Singkat') bobot = 3;
      else if (targetBentuk === 'Uraian') bobot = 5;
    }

    // Determine Dimensi Profil Pelajar Pancasila
    let p3Label = 'Gotong Royong & Mandiri';
    if (dimensiP3 === 'gotong_royong') p3Label = 'Gotong Royong & Kerjasama';
    else if (dimensiP3 === 'mandiri') p3Label = 'Mandiri & Disiplin Diri';
    else if (dimensiP3 === 'bernalar_kritis') p3Label = 'Bernalar Kritis & Analitis';
    else if (dimensiP3 === 'kreatif') p3Label = 'Kreatif & Inovatif';

    // Format according to specific Bentuk Soal
    let qQuestionText = '';
    let qOptions: string[] = [];
    let qCorrectAns = '';
    let qExplanation = pickedItem.explanation;
    let qRubrik = '';
    let qPernyataanKompleks: { pernyataan: string; jawabanBenar: string }[] | undefined = undefined;
    let qMenjodohkanPairs: { premis: string; pasangan: string }[] | undefined = undefined;

    if (targetBentuk === 'Pilihan Ganda') {
      qQuestionText = pickedItem.baseQuestion;

      // Shuffle options and distribute correct answer across A, B, C, D
      const numOptions = jumlahOpsiPG === '3' ? 3 : jumlahOpsiPG === '5' ? 5 : 4;
      const rawDistractors = shuffleArray(pickedItem.distractors, rng).slice(0, numOptions - 1);
      const allChoices = shuffleArray([pickedItem.correctConcept, ...rawDistractors], rng);

      const labels = ['A', 'B', 'C', 'D', 'E'];
      qOptions = allChoices.map((choice, idx) => `${labels[idx]}. ${choice}`);

      const correctIdx = allChoices.indexOf(pickedItem.correctConcept);
      qCorrectAns = labels[correctIdx] || 'A';
      qRubrik = 'Skor 1 jika jawaban benar, skor 0 jika jawaban salah.';
    } else if (targetBentuk === 'Pilihan Ganda Kompleks') {
      qQuestionText = `Cermati beberapa pernyataan mengenai materi "${qMateri}" berikut. Tentukan kebenaran setiap pernyataan dengan memberikan tanda centang (✓) pada kolom Benar (B) atau Salah (S)!`;
      const statements = shuffleArray(pickedItem.pgkStatements, rng).slice(0, 3);
      qPernyataanKompleks = statements;
      qCorrectAns = statements.map((s, idx) => `Pernyataan ${idx + 1}: ${s.jawabanBenar}`).join(' | ');
      qRubrik = `Skor 1 untuk setiap pernyataan yang dijawab tepat (Skor maksimal ${statements.length}).`;
    } else if (targetBentuk === 'Menjodohkan') {
      qQuestionText = `Jodohkanlah konsep atau gerak dasar pada materi "${qMateri}" di Kolom A dengan fungsi atau keterangannya yang paling sesuai pada Kolom B!`;
      const pairs = shuffleArray(pickedItem.matchingPairs, rng).slice(0, 3);
      // Re-index premis and pairs cleanly
      const alphabet = ['A', 'B', 'C', 'D'];
      qMenjodohkanPairs = pairs.map((p, idx) => ({
        premis: `${idx + 1}. ${p.premis.replace(/^\d+\.\s*/, '')}`,
        pasangan: `${alphabet[idx]}. ${p.pasangan.replace(/^[A-Z]\.\s*/, '')}`
      }));
      qCorrectAns = qMenjodohkanPairs.map((p, idx) => `${idx + 1} -> ${alphabet[idx]}`).join(', ');
      qRubrik = `Skor 1 untuk setiap pasangan yang dijodohkan dengan tepat (Skor maksimal ${pairs.length}).`;
    } else if (targetBentuk === 'Isian Singkat') {
      qQuestionText = pickedItem.baseQuestion.replace(/\?\s*$/, '').replace(/\.\.\.$/, '') + ' dinamakan...?';
      qCorrectAns = pickedItem.isianKeyword;
      qRubrik = 'Skor 2 jika kata kunci tepat, skor 1 jika mendekati benar, skor 0 jika salah.';
    } else if (targetBentuk === 'Uraian') {
      qQuestionText = pickedItem.uraianPrompt;
      qCorrectAns = pickedItem.uraianModelAnswer;
      qRubrik = pickedItem.uraianRubrik;
    }

    questions.push({
      noSoal: i + 1,
      bentukSoal: targetBentuk,
      levelKognitif: qLevel,
      lingkupMateri: qMateri,
      capaianPembelajaran: cpText,
      indikatorSoal: pickedItem.indikator,
      question: qQuestionText,
      options: qOptions,
      pernyataanKompleks: qPernyataanKompleks,
      menjodohkanPairs: qMenjodohkanPairs,
      correctAnswer: qCorrectAns,
      explanation: qExplanation,
      pedomanPenskoran: qRubrik,
      bobotSkor: bobot,
      dimensiP3: p3Label
    });
  }

  const shapeSummary = shapeDistribution.length > 0
    ? shapeDistribution.map(s => `${s.name}: ${s.count} soal`).join(' • ')
    : cleanBentukList.join(', ');

  return {
    judulUjian: `${jenisUjian.toUpperCase()} - PJOK KELAS ${grade} SD`,
    kop: {
      dinasPendidikan,
      namaSekolah,
      mataPelajaran,
      kelas: grade,
      semester,
      tahunPelajaran,
      lingkupMateriList: cleanMateriList,
      lingkupMateri: effectiveBabMateri,
      bentukSoalList: cleanBentukList,
      bentukSoal: cleanBentukList.join(', '),
      bentukSoalDistribution: shapeDistribution.length > 0 ? shapeDistribution : undefined,
      bentukSoalSummary: shapeSummary,
      totalSoal: effectiveCount
    },
    questions
  };
}
