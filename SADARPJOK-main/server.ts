import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_CLASSES, INITIAL_JOURNALS, INITIAL_MODULS, PREBUILT_RUBRIKS } from './src/data';
import { generateSummativeAssessment } from './src/utils/summativeGenerator';
import {
  getSibiBookByGrade,
  getSibiUnitsByGrade,
  findMatchingSibiUnit,
  buildSibiPromptInstruction
} from './src/utils/sibiGuidebookData';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Normalize Netlify Function paths so both /.netlify/functions/api/* and /api/* match Express /api/* routes
app.use((req, _res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = '/api' + req.url.slice('/.netlify/functions/api'.length);
  }
  next();
});

// In-Memory Fallbacks (seeding with initial static data)
let inMemoryClasses = JSON.parse(JSON.stringify(INITIAL_CLASSES));
let inMemoryModuls = JSON.parse(JSON.stringify(INITIAL_MODULS));
let inMemoryJournals = JSON.parse(JSON.stringify(INITIAL_JOURNALS));
let inMemoryRubriks = JSON.parse(JSON.stringify(PREBUILT_RUBRIKS));

// Lazy-initialized Supabase Client with connection health & cooldown mechanism
let supabaseClient: any = null;
let supabaseLastFailureTime = 0;
const SUPABASE_COOLDOWN_MS = 60000; // 60s cooldown if Supabase connection times out or fails

function isSupabaseCoolingDown(): boolean {
  return Boolean(supabaseLastFailureTime && (Date.now() - supabaseLastFailureTime < SUPABASE_COOLDOWN_MS));
}

function markSupabaseFailed() {
  supabaseLastFailureTime = Date.now();
}

function getSupabaseClient() {
  if (isSupabaseCoolingDown()) {
    return null;
  }
  if (!supabaseClient) {
    let url = process.env.SUPABASE_URL || 'https://gohycvfxflwwmdogiwse.supabase.co';
    const anonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaHljdmZ4Zmx3d21kb2dpd3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMjAxODIsImV4cCI6MjEwMDg5NjE4Mn0.kUE56HSrf0AZB0a7HFDz2mjrEaPskQ-4RSOWDhrymPQ';
    if (!url || !anonKey || !url.trim() || !anonKey.trim()) {
      return null;
    }
    const lowerUrl = url.trim().toLowerCase();
    if (
      (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) ||
      lowerUrl.includes('your-supabase') ||
      lowerUrl.includes('example.com') ||
      lowerUrl.includes('placeholder')
    ) {
      return null;
    }
    // Clean URL suffix if provided in full-rest form
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/rest/v1/')) {
      cleanUrl = cleanUrl.slice(0, -9);
    } else if (cleanUrl.endsWith('/rest/v1')) {
      cleanUrl = cleanUrl.slice(0, -8);
    }
    try {
      supabaseClient = createClient(cleanUrl, anonKey.trim());
    } catch (e: any) {
      console.log('[Supabase Connect] Unable to create Supabase client:', e.message || e);
      return null;
    }
  }
  return supabaseClient;
}

// Helper to prevent long-hanging database requests on serverless environments
function queryWithTimeout<T = any>(promise: any, timeoutMs: number = 2000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout of ${timeoutMs}ms exceeded`));
    }, timeoutMs);

    Promise.resolve(promise)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Lazy-initialized Gemini Client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;

// Tracking for Gemini API access restriction (e.g. 403 PERMISSION_DENIED / Project Access Denied)
let geminiAccessDeniedUntil = 0;
const GEMINI_DENIED_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes cooldown

function isGeminiAccessDenied(): boolean {
  return Boolean(geminiAccessDeniedUntil && Date.now() < geminiAccessDeniedUntil);
}

function markGeminiAccessDenied() {
  geminiAccessDeniedUntil = Date.now() + GEMINI_DENIED_COOLDOWN_MS;
}

function checkAndMarkAccessDenied(error: any) {
  let errStr = '';
  try {
    errStr = error?.message || String(error || '');
    if (typeof error === 'object') {
      errStr += ' ' + JSON.stringify(error);
    }
  } catch (e) {
    errStr = String(error);
  }
  if (
    errStr.includes('403') ||
    errStr.includes('PERMISSION_DENIED') ||
    errStr.includes('denied access') ||
    errStr.includes('Project Access Denied')
  ) {
    markGeminiAccessDenied();
  }
}

// Track models that have received 429 / RESOURCE_EXHAUSTED so we don't spam them
const quotaExceededModels = new Map<string, number>();

function isModelRateLimited(modelName: string): boolean {
  const lastTime = quotaExceededModels.get(modelName);
  if (!lastTime) return false;
  // Hold off trying this model for 30 minutes if it returned 429 quota exhaustion
  if (Date.now() - lastTime < 30 * 60 * 1000) {
    return true;
  }
  quotaExceededModels.delete(modelName);
  return false;
}

function markModelRateLimited(modelName: string) {
  quotaExceededModels.set(modelName, Date.now());
}

// Fast and resilient retry wrapper with strict timeouts to prevent long-hanging requests
async function callGeminiWithTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  timeoutMs = 8000,
  maxRetries = 1,
  initialDelayMs = 600
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await queryWithTimeout<T>(fn(), timeoutMs);
    } catch (error: any) {
      attempt++;
      const errorMessage = error?.message || '';
      let errorStr = '';
      try {
        errorStr = error ? (error.message || String(error)) : '';
        if (error && typeof error === 'object') {
          errorStr += ' ' + (error.status || '') + ' ' + (error.code || '') + ' ' + (error.statusText || '');
        }
      } catch (e) {
        errorStr = String(error);
      }

      const isTransient = 
        errorStr.includes('503') || 
        errorStr.includes('UNAVAILABLE') || 
        errorStr.includes('high demand') || 
        errorStr.includes('temporary') || 
        errorStr.includes('429') || 
        errorStr.includes('RESOURCE_EXHAUSTED') ||
        errorStr.includes('Timeout') ||
        errorMessage.includes('503') ||
        errorMessage.includes('UNAVAILABLE') ||
        errorMessage.includes('high demand') ||
        errorMessage.includes('temporary') ||
        errorMessage.includes('429') ||
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('Timeout');

      if (attempt <= maxRetries && isTransient) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

function formatAiError(error: any, defaultMsg: string = 'Gagal memproses permintaan AI.'): string {
  if (!error) return defaultMsg;
  let rawMsg = error?.message || String(error || '');
  if (typeof error === 'object') {
    try {
      rawMsg += ' ' + JSON.stringify(error);
    } catch (e) {}
  }
  if (
    rawMsg.includes('PERMISSION_DENIED') ||
    rawMsg.includes('403') ||
    rawMsg.includes('denied access') ||
    rawMsg.includes('Project Access Denied')
  ) {
    return 'Layanan AI Gemini sedang mengalami pembatasan akses (403 PERMISSION_DENIED: Your project has been denied access). Silakan perbarui GEMINI_API_KEY di Settings > Secrets atau hubungi administrator platform.';
  }
  if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('Quota')) {
    return 'Batas kuota harian/menit Gemini API tercapai (429 Quota Exceeded). Silakan coba lagi dalam beberapa saat.';
  }
  return error?.message || defaultMsg;
}

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in the environment secrets. Please set it in Settings > Secrets.');
    }
    const rawClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Intercept generateContent calls to automatically apply the timeout, fast retry and seamless model fallbacks
    const originalGenerateContent = rawClient.models.generateContent.bind(rawClient.models);
    rawClient.models.generateContent = async function(params: any) {
      const requestedModel = params?.model || 'gemini-3.1-flash-lite';
      // Official models prioritizing high-availability and separate quota pools
      const allCandidates = [
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-3.1-pro-preview',
        'gemini-3.8-flash',
        requestedModel
      ].filter((m, i, arr) => arr.indexOf(m) === i);

      // Prioritize candidates not currently in cooldown
      let candidateModels = allCandidates.filter((m) => !isModelRateLimited(m));
      if (candidateModels.length === 0) {
        // If all were marked, try them anyway as cooldown might be over
        candidateModels = allCandidates;
      }

      let lastError: any = null;
      for (const modelToTry of candidateModels) {
        try {
          const runParams = { ...params, model: modelToTry };
          return await callGeminiWithTimeoutAndRetry(
            () => originalGenerateContent(runParams),
            8500, // 8.5s timeout per attempt
            0 // fast fail to next model or offline template
          );
        } catch (err: any) {
          lastError = err;
          checkAndMarkAccessDenied(err);

          const errStr = String(err?.message || err || '');
          if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota') || errStr.includes('Quota')) {
            markModelRateLimited(modelToTry);
            console.info(`[Gemini API] Model '${modelToTry}' kuota penuh (429), beralih ke model berikutnya atau templat kurikulum.`);
          } else {
            console.info(`[Gemini API] Model '${modelToTry}' kendala jaringan/timeout, beralih ke model berikutnya.`);
          }
        }
      }
      throw lastError || new Error('Semua model Gemini mengalami kendala.');
    };

    aiClient = rawClient;
  }
  return aiClient;
}

// ==========================================
// INTELLIGENT OFFLINE FALLBACK GENERATORS
// ==========================================
function getFallbackModul(grade: any, materi: any, alokasiWaktu: any) {
  const g = String(grade || '4');
  const sibiUnit = findMatchingSibiUnit(g, materi);
  const m = materi || (sibiUnit ? `${sibiUnit.unitCode}: ${sibiUnit.pokokMateri}` : 'Variasi Gerak Dasar Lokomotor, Nonlokomotor, dan Manipulatif');
  const a = alokasiWaktu || (sibiUnit ? `${sibiUnit.alokasiJp} (${sibiUnit.alokasiPertemuan})` : '3 x 35 Menit (1 Pertemuan)');
  const pemanasanText = sibiUnit
    ? `Pemanasan dinamis dalam bentuk permainan kecil sesuai Buku Panduan Guru SIBI: ${sibiUnit.pemanasanPermainan} selama 10-15 menit.`
    : 'Pemanasan dinamis dalam bentuk permainan edukatif selama 10-15 menit.';
  const intiActivities = sibiUnit
    ? [
        ...sibiUnit.aktivitasPembelajaran,
        'Guru memberikan umpan balik (feedback) koreksi gerakan fisik dan penguatan karakter Profil Pelajar Pancasila (Mandiri & Gotong Royong) sesuai Buku Panduan Guru PJOK SIBI.'
      ]
    : [
        `Guru memberikan contoh dan memperagakan kombinasi gerakan ${m}.`,
        'Siswa melakukan latihan perorangan secara terarah dengan pengawasan guru (Aktivitas Pembelajaran 1).',
        'Siswa dibagi menjadi kelompok kecil untuk mempraktikkan materi dalam bentuk latihan berpasangan/berkelompok (Aktivitas Pembelajaran 2).',
        'Siswa menerapkan keterampilan gerak dalam permainan sederhana yang dimodifikasi (Aktivitas Pembelajaran 3).'
      ];

  return {
    title: sibiUnit
      ? `Modul Ajar PJOK Kelas ${g} SD (${sibiUnit.unitCode} SIBI): ${sibiUnit.unitTitle}`
      : `Modul Ajar PJOK Kelas ${g} SD: ${m}`,
    materiPokok: m,
    alokasiWaktu: a,
    tujuanPembelajaran: sibiUnit?.tujuanPembelajaran || [
      `Murid dapat menjelaskan prosedur dan konsep gerak ${m} secara tepat dan aman sesuai Buku Panduan Guru PJOK SIBI.`,
      `Murid dapat mempraktikkan variasi dan kombinasi gerakan ${m} dengan koordinasi tubuh yang baik.`,
      `Murid dapat menunjukkan sikap mandiri, gotong royong, dan sportivitas selama pembelajaran.`
    ],
    kegiatanPembelajaran: {
      pendahuluan: [
        'Guru menyapa murid dengan ramah, mengecek kehadiran, kerapian seragam olahraga, kesiapan fisik, dan memimpin doa.',
        `Apersepsi kontekstual mengaitkan pengalaman gerak murid dengan materi ${m} serta menyampaikan Tujuan Pembelajaran.`,
        pemanasanText
      ],
      inti: intiActivities,
      penutup: [
        'Kegiatan pendinginan (cooling down) dan peregangan pasif diiringi pengaturan napas untuk menurunkan denyut nadi.',
        'Refleksi bersama mengenai kesulitan gerak, manfaat kebugaran, dan sikap sportivitas yang telah dipelajari.',
        'Apresiasi hasil latihan kelompok, penyampaian tindak lanjut dari Buku Panduan Guru SIBI, dan doa penutup.'
      ]
    },
    saranaPrasarana: [
      'Cone / Kerucut Pembatas & Peluit',
      'Bola Modifikasi / Bola Karet / Alat Bantu Sesuai Unit SIBI',
      'Lapangan Sekolah / Ruang Terbuka Aman',
      sibiUnit ? sibiUnit.sumberBukuSibi : 'Buku Panduan Guru PJOK SD/MI (SIBI Kemendikdasmen RI)'
    ],
    rubrikPenilaian: 'Mengacu Buku Panduan Guru PJOK SIBI — Sangat Baik (Skor 4 / 86-100): Gerakan mengalir lancar, teknik awal-pelaksanaan-akhir tepat, dan sportif membantu teman. Baik (Skor 3 / 76-85): Teknik dasar benar dan konsisten. Cukup (Skor 2 / 66-75): Gerakan cukup lancar namun masih memerlukan koreksi. Perlu Bimbingan (Skor 1 / <66): Membutuhkan pendampingan langsung dan modifikasi alat.'
  };
}

function getFallbackRubrik(materi: any, kategori: any) {
  const m = materi || 'Keterampilan Gerak Dasar';
  const k = kategori || 'Permainan & Olahraga';
  return {
    materi: m,
    kategori: k,
    indikator: [
      {
        namaIndikator: 'Keseimbangan dan Awalan Gerak',
        kriteria: {
          mahir: 'Posisi tubuh sangat stabil, fokus pandangan tepat ke depan, dan awalan gerak sempurna.',
          cukup: 'Posisi tubuh cukup stabil namun terkadang kehilangan keseimbangan di akhir gerakan.',
          perluBimbingan: 'Posisi tubuh belum stabil dan membutuhkan bantuan instruksi gerak dari guru.'
        }
      },
      {
        namaIndikator: 'Akurasi dan Koordinasi Motorik',
        kriteria: {
          mahir: 'Koordinasi tangan, kaki, dan mata sangat selaras saat melakukan gerakan fisik.',
          cukup: 'Koordinasi gerak cukup baik tetapi frekuensi irama gerak masih perlu perbaikan.',
          perluBimbingan: 'Koordinasi gerak kaku dan belum selaras.'
        }
      },
      {
        namaIndikator: 'Penyelesaian Gerak dan Sikap Tubuh Akhir',
        kriteria: {
          mahir: 'Mampu mengakhiri gerakan secara mulus dengan kontrol tubuh penuh.',
          cukup: 'Mengakhiri gerakan dengan kontrol tubuh yang cukup.',
          perluBimbingan: 'Kesulitan mengontrol kestabilan sikap akhir tubuh.'
        }
      }
    ]
  };
}

function getFallbackSoal(grade: any, materi: any, jumlahSoal: any) {
  const g = String(grade || '4');
  const m = String(materi || 'Aktivitas Kebugaran Jasmani & Pola Hidup Sehat').trim();
  const count = Math.max(1, Math.min(20, parseInt(jumlahSoal) || 5));
  const lowerM = m.toLowerCase();

  // Bank of specialized questions per PJOK domain
  let domainQuestions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }> = [];

  if (lowerM.includes('sepak') || lowerM.includes('bola kaki') || lowerM.includes('futsal')) {
    domainQuestions = [
      {
        question: `Gerakan menghentikan atau mengontrol bola yang meluncur di tanah dalam permainan sepak bola paling efektif menggunakan...?`,
        options: ['A. Kaki bagian dalam atau telapak kaki', 'B. Tumit kaki bagian belakang', 'C. Punggung tangan', 'D. Ujung jari kaki'],
        correctAnswer: 'A',
        explanation: 'Kaki bagian dalam memiliki bidang kontak yang lebar dan lembut sehingga mampu meredam laju bola dengan stabil.'
      },
      {
        question: `Operan bola jarak pendek (short pass) antar rekan satu tim dalam sepak bola umumnya menggunakan bagian...?`,
        options: ['A. Kaki bagian luar', 'B. Kaki bagian dalam', 'C. Ujung jari kaki', 'D. Lutut bagian bawah'],
        correctAnswer: 'B',
        explanation: 'Operan kaki bagian dalam menghasilkan operan datar yang terarah, akurat, dan mudah dikuasai teman.'
      },
      {
        question: `Pemain yang diperbolehkan memegang atau menangkap bola menggunakan tangan saat permainan sepak bola berlangsung adalah...?`,
        options: ['A. Bek penyerang', 'B. Kapten regu', 'C. Penjaga gawang (Kiper) di area penalti', 'D. Gelandang bertahan'],
        correctAnswer: 'C',
        explanation: 'Kiper adalah satu-satunya pemain yang memiliki hak eksklusif memegang bola di dalam area gawangnya sendiri.'
      },
      {
        question: `Gerakan menggiring bola (dribbling) melewati rintangan pemain lawan bertujuan untuk...?`,
        options: ['A. Menghabiskan waktu permainan', 'B. Mendekatkan bola ke gawang lawan atau mencari ruang tembak', 'C. Menendang bola ke luar lapangan', 'D. Menunjukkan gaya di depan penonton'],
        correctAnswer: 'B',
        explanation: 'Dribbling berfungsi menguasai bola sambil bergerak maju mendekati pertahanan atau area gawang musuh.'
      },
      {
        question: `Sikap sportivitas yang harus ditunjukkan ketika regu kita mengalami kekalahan dalam pertandingan sepak bola adalah...?`,
        options: ['A. Menyalahkan wasit yang memimpin', 'B. Menolak bersalaman dengan regu lawan', 'C. Menerima kekalahan dengan lapang dada dan memberi selamat kepada pemenang', 'D. Keluar lapangan tanpa berpamitan'],
        correctAnswer: 'C',
        explanation: 'Nilai luhur olahraga PJOK mengajarkan sportivitas, menghargai lawan, dan lapang dada terhadap hasil pertandingan.'
      },
      {
        question: `Istilah menendang bola langsung ke arah gawang untuk mencetak skor disebut...?`,
        options: ['A. Passing', 'B. Shooting', 'C. Heading', 'D. Dribbling'],
        correctAnswer: 'B',
        explanation: 'Shooting merupakan teknik tembakan keras dan terarah ke gawang lawan untuk menghasilkan gol.'
      },
      {
        question: `Apabila bola keluar melalui garis samping lapangan permainan sepak bola, maka pertandingan dimulai kembali dengan...?`,
        options: ['A. Tendangan sudut', 'B. Lemparan ke dalam (Throw-in)', 'C. Tendangan penalti', 'D. Tendangan gawang'],
        correctAnswer: 'B',
        explanation: 'Bola yang melintasi garis samping lapangan dilanjutkan dengan lemparan ke dalam menggunakan kedua tangan dari atas kepala.'
      }
    ];
  } else if (lowerM.includes('voli') || lowerM.includes('volly')) {
    domainQuestions = [
      {
        question: `Teknik dasar menerima bola servis atau serangan lawan yang posisinya rendah dalam bola voli adalah...?`,
        options: ['A. Passing bawah', 'B. Passing atas', 'C. Smash keras', 'D. Blocking rapat'],
        correctAnswer: 'A',
        explanation: 'Passing bawah dilakukan dengan mengaitkan kedua lengan lurus ke depan untuk memantulkan bola rendah secara terkontrol.'
      },
      {
        question: `Saat melakukan passing bawah bola voli, perkenaan bola yang tepat dan stabil adalah pada bagian...?`,
        options: ['A. Telapak tangan terbuka', 'B. Bagian lengan bawah antara pergelangan dan siku', 'C. Ujung jari jemari', 'D. Persendian bahu atas'],
        correctAnswer: 'B',
        explanation: 'Permukaan datar antara pergelangan tangan dan siku memberikan pantulan bola yang paling halus dan stabil.'
      },
      {
        question: `Pukulan permulaan untuk menandai dimulainya suatu reli dalam pertandingan bola voli disebut...?`,
        options: ['A. Spike / Smash', 'B. Servis (Service)', 'C. Toss / Set', 'D. Block'],
        correctAnswer: 'B',
        explanation: 'Servis adalah pukulan pertama dari belakang garis lapangan untuk mengarahkan bola masuk ke area lawan.'
      },
      {
        question: `Jumlah pemain utama setiap regu bola voli yang berada di dalam lapangan pertandingan resmi adalah...?`,
        options: ['A. 5 orang', 'B. 6 orang', 'C. 7 orang', 'D. 11 orang'],
        correctAnswer: 'B',
        explanation: 'Satu regu bola voli standar diisi oleh 6 orang pemain aktif di lapangan dengan posisi rotasi yang teratur.'
      },
      {
        question: `Tindakan membendung serangan smash lawan di depan net dengan menjulurkan kedua tangan ke atas disebut...?`,
        options: ['A. Dribble', 'B. Passing atas', 'C. Blocking (Bendungan)', 'D. Digging'],
        correctAnswer: 'C',
        explanation: 'Blocking bertujuan menghalangi atau memantulkan kembali bola smash keras agar tidak jatuh di area pertahanan sendiri.'
      }
    ];
  } else if (lowerM.includes('basket')) {
    domainQuestions = [
      {
        question: `Teknik mengoper bola setinggi dada kepada rekan satu tim dalam bola basket disebut...?`,
        options: ['A. Bounce pass', 'B. Chest pass', 'C. Overhead pass', 'D. Baseball pass'],
        correctAnswer: 'B',
        explanation: 'Chest pass dilakukan dengan mendorong bola menggunakan kedua tangan lurus setinggi dada agar cepat sampai ke rekan.'
      },
      {
        question: `Teknik memantulkan bola ke lantai lapangan secara berulang sambil bergerak maju disebut...?`,
        options: ['A. Dribbling (Menggiring bola)', 'B. Pivot', 'C. Rebound', 'D. Lay-up shoot'],
        correctAnswer: 'A',
        explanation: 'Dribbling dalam bola basket dilakukan dengan mendorong bola memakai telapak tangan terbuka dan pergelangan tangan lentur.'
      },
      {
        question: `Mengoper bola dengan cara memantulkannya terlebih dahulu ke lantai untuk mengelabui lawan dinamakan...?`,
        options: ['A. Chest pass', 'B. Bounce pass', 'C. Overhead pass', 'D. Hook pass'],
        correctAnswer: 'B',
        explanation: 'Bounce pass adalah operan pantulan yang efektif melewati penjagaan lawan yang memiliki postur tinggi.'
      },
      {
        question: `Berapa poin yang diperoleh jika seorang pemain bola basket berhasil memasukkan bola dari dalam area garis lingkaran penalti...?`,
        options: ['A. 1 Poin', 'B. 2 Poin', 'C. 3 Poin', 'D. 4 Poin'],
        correctAnswer: 'B',
        explanation: 'Tembakan lapangan standar di dalam garis busur menghasilkan 2 poin untuk tim pencetak.'
      },
      {
        question: `Gerakan memutar badan dengan salah satu kaki tetap menempel di lantai sebagai poros tumpuan dinamakan...?`,
        options: ['A. Pivot', 'B. Travelling', 'C. Double dribble', 'D. Free throw'],
        correctAnswer: 'A',
        explanation: 'Pivot digunakan untuk melindungi bola dari rebutan lawan sambil mencari celah operan atau tembakan tanpa melanggar aturan.'
      }
    ];
  } else if (lowerM.includes('kasti') || lowerM.includes('rounders') || lowerM.includes('bola kecil')) {
    domainQuestions = [
      {
        question: `Dalam permainan kasti, regu yang bertugas melempar bola dan mematikan pelari lawan dinamakan...?`,
        options: ['A. Regu Pemukul', 'B. Regu Penjaga', 'C. Regu Cadangan', 'D. Regu Wasit'],
        correctAnswer: 'B',
        explanation: 'Regu penjaga bertugas menangkap bola pukulan dan melempar bola ke tubuh pelari lawan yang belum menyentuh tiang hinggap.'
      },
      {
        question: `Saat menangkap bola lambung tinggi dalam permainan kasti, posisi kedua telapak tangan sebaiknya...?`,
        options: ['A. Terbuka membentuk kantong / corong menghadap ke arah datangnya bola', 'B. Mengepal keras ke depan', 'C. Menutup rapat dengan jari saling silang', 'D. Terlentang ke bawah'],
        correctAnswer: 'A',
        explanation: 'Membuka telapak tangan seperti kantong memudahkan penangkapan bola lambung dan meredam pantulan bola keluar.'
      },
      {
        question: `Pemain yang bertugas melambungkan bola kepada pemukul sesuai permintaan dalam permainan kasti disebut...?`,
        options: ['A. Pitcher / Pelambung', 'B. Catcher / Penangkap', 'C. Striker / Penyerang', 'D. Kapten tim'],
        correctAnswer: 'A',
        explanation: 'Pelambung bertugas memberikan umpan lambung yang stabil dan ramah kepada kawan satu regu yang sedang memukul.'
      },
      {
        question: `Setelah memukul bola dengan baik, tongkat pemukul kasti harus diletakkan...?`,
        options: ['A. Dilempar sekuat tenaga ke penonton', 'B. Di dalam ruang pemukul / area yang aman', 'C. Di tengah lapangan lintasan lari', 'D. Diberikan kepada wasit'],
        correctAnswer: 'B',
        explanation: 'Menaruh tongkat pemukul di tempat aman di dalam ruang pemukul menghindari cedera tersandung bagi pelari lain.'
      },
      {
        question: `Tempat pemberhentian yang aman bagi pelari kasti agar tidak terkena lemparan bola oleh regu penjaga disebut...?`,
        options: ['A. Garis gawang', 'B. Tiang hinggap / Base', 'C. Garis serang', 'D. Ring keranjang'],
        correctAnswer: 'B',
        explanation: 'Pelari yang telah menginjak atau menyentuh tiang hinggap berada dalam zona bebas dan tidak sah untuk dilempar.'
      }
    ];
  } else if (lowerM.includes('lari') || lowerM.includes('atletik') || lowerM.includes('lompat') || lowerM.includes('estafet')) {
    domainQuestions = [
      {
        question: `Aba-aba resmi pada start jongkok untuk nomor lari jarak pendek (sprint) secara berurutan adalah...?`,
        options: ['A. Satu, Dua, Tiga!', 'B. Bersedia, Siap, Ya / Bunyi Pistol!', 'C. Awas, Siap, Lari!', 'D. Mulai, Berlari, Selesai!'],
        correctAnswer: 'B',
        explanation: 'Standar start lari atletik menggunakan aba-aba terstruktur: Bersedia (posisi jongkok), Siap (angkat panggul), Ya! (tolakan kaki).'
      },
      {
        question: `Bagian kaki yang digunakan sebagai tumpuan utama saat berlari sprint secepat mungkin adalah...?`,
        options: ['A. Tumit kaki belakang', 'B. Ujung kaki bagian depan (bola kaki)', 'C. Telapak kaki bagian tengah secara datar', 'D. Mata kaki luar'],
        correctAnswer: 'B',
        explanation: 'Berlari dengan bola kaki depan meminimalisir hambatan tanah dan memberikan dorongan pegas yang lebih eksplosif.'
      },
      {
        question: `Benda berbentuk silinder pendek yang dibawa dan dipindahkan secara bergantian dalam lari estafet disebut...?`,
        options: ['A. Tongkat estafet', 'B. Kasti kayu', 'C. Peluru besi', 'D. Matras busa'],
        correctAnswer: 'A',
        explanation: 'Tongkat estafet dipindahkan dari pelari pertama hingga pelari terakhir di dalam zona pergantian tongkat.'
      },
      {
        question: `Urutan tahapan gerak yang benar pada cabang atletik lompat jauh adalah...?`,
        options: ['A. Mendarat, melayang, menumpu, awalan', 'B. Awalan lari, tolakan / tumpuan, melayang di udara, dan mendarat', 'C. Melompat, berlari, jongkok, melayang', 'D. Tolakan, awalan, mendarat, melayang'],
        correctAnswer: 'B',
        explanation: 'Lompat jauh diawali dengan lari cepat (awalan), hentakan satu kaki di papan (tumpuan), kontrol sikap di udara (melayang), dan mendarat dua kaki mengeper.'
      },
      {
        question: `Sikap tubuh yang benar saat menyentuh bak pasir pendaratan pada lompat jauh adalah...?`,
        options: ['A. Mendarat dengan satu kaki tegak lurus kaku', 'B. Mendarat dengan kedua kaki bersamaan dan lutut ditekuk mengeper', 'C. Menjatuhkan badan ke belakang', 'D. Menahan tubuh dengan kepala lebih dulu'],
        correctAnswer: 'B',
        explanation: 'Mendarat dengan dua kaki bersamaan dan lutut ditekuk mengeper menyerap benturan sehingga terhindar dari cedera lutut.'
      }
    ];
  } else if (lowerM.includes('senam') || lowerM.includes('roll') || lowerM.includes('guling') || lowerM.includes('lilin')) {
    domainQuestions = [
      {
        question: `Alas pengaman khusus yang wajib digunakan saat melakukan latihan gerak senam lantai adalah...?`,
        options: ['A. Karpet lantai tipis', 'B. Matras busa yang empuk dan rata', 'C. Lapangan berumput licin', 'D. Lantai ubin semen'],
        correctAnswer: 'B',
        explanation: 'Matras berfungsi menyerap hentakan dan melindungi tulang punggung serta leher dari benturan keras.'
      },
      {
        question: `Bagian tubuh yang pertama kali menyentuh matras setelah tangan bertumpu saat melakukan guling depan (forward roll) adalah...?`,
        options: ['A. Dahi kepala bagian depan', 'B. Tengkuk / leher bagian belakang', 'C. Punggung bawah', 'D. Ujung hidung'],
        correctAnswer: 'B',
        explanation: 'Menempelkan dagu ke dada membuat tengkuk menyentuh matras lebih dahulu, sehingga kepala terlindung dari tekanan berlebih.'
      },
      {
        question: `Sikap lilin dalam senam lantai melatih unsur kebugaran jasmani yaitu...?`,
        options: ['A. Kecepatan lari sprint', 'B. Keseimbangan tubuh dan kekuatan otot perut', 'C. Daya tahan paru-paru', 'D. Kelincahan gerak kaki'],
        correctAnswer: 'B',
        explanation: 'Sikap lilin menuntut kekuatan otot perut dan punggung untuk menopang kaki lurus tegak ke atas secara seimbang.'
      },
      {
        question: `Sebelum melakukan gerakan senam lantai guling depan atau kayang, siswa wajib melakukan...?`,
        options: ['A. Makan camilan manis', 'B. Pemanasan dan peregangan persendian leher serta pinggang', 'C. Berlari kencang mengelilingi sekolah', 'D. Duduk bersantai di kelas'],
        correctAnswer: 'B',
        explanation: 'Peregangan leher, punggung, dan pergelangan tangan sangat penting mencegah kram dan salah urat pada senam lantai.'
      },
      {
        question: `Saat mendarat mengakhiri gerakan guling ke depan, posisi kedua kaki sebaiknya...?`,
        options: ['A. Terbuka lebar ke samping', 'B. Merapat dengan lutut ditekuk ke posisi jongkok stabil', 'C. Kaki lurus membentur lantai', 'D. Menyilang ke belakang'],
        correctAnswer: 'B',
        explanation: 'Posisi jongkok dengan kaki rapat dan tangan ke depan menjaga momentum serta memudahkan tubuh berdiri kembali.'
      }
    ];
  } else if (lowerM.includes('renang') || lowerM.includes('air') || lowerM.includes('kolam')) {
    domainQuestions = [
      {
        question: `Aturan keselamatan paling mendasar yang harus dipatuhi murid di tepi kolam renang adalah...?`,
        options: ['A. Dilarang berlari-lari di tepi kolam yang licin', 'B. Boleh mendorong teman ke area dalam', 'C. Membawa makanan ke dalam kolam renang', 'D. Berenang tanpa pengawasan guru'],
        correctAnswer: 'A',
        explanation: 'Lantai tepi kolam basah dan sangat licin sehingga berlari dapat menyebabkan terpeleset dan cedera fatal.'
      },
      {
        question: `Gaya renang yang gerakannya menyerupai gerakan katak saat berenang di air disebut renang gaya...?`,
        options: ['A. Gaya Bebas (Crawl)', 'B. Gaya Dada (Breaststroke)', 'C. Gaya Punggung (Backstroke)', 'D. Gaya Kupu-kupu (Butterfly)'],
        correctAnswer: 'B',
        explanation: 'Gaya dada sering disebut gaya katak karena kombinasi kayuhan tangan dan tendangan kakinya meniru katak.'
      },
      {
        question: `Teknik pengambilan napas pada renang gaya dada dilakukan dengan cara...?`,
        options: ['A. Mengangkat kepala ke atas permukaan air saat tangan mendayung ke belakang', 'B. Membuka mulut di dalam air', 'C. Menghirup udara saat kepala berada di dasar kolam', 'D. Memutar kepala ke arah samping kiri dan kanan'],
        correctAnswer: 'A',
        explanation: 'Dorongan tangan ke dada mengangkat bahu dan kepala keluar dari air untuk mengambil napas melalui mulut.'
      },
      {
        question: `Alat bantu apung yang biasa dipakai bagi siswa pemula yang sedang belajar mengapung dan meluncur adalah...?`,
        options: ['A. Kacamata renang', 'B. Papan luncur / pelampung (kickboard)', 'C. Matras senam', 'D. Sepatu olahraga'],
        correctAnswer: 'B',
        explanation: 'Papan pelampung membantu menopang tubuh bagian atas agar siswa dapat fokus melatih dorongan kaki di air.'
      },
      {
        question: `Sebelum masuk ke dalam air kolam renang, tubuh kita harus dibasahi atau dibilas terlebih dahulu untuk...?`,
        options: ['A. Menyesuaikan suhu tubuh dengan air kolam dan menjaga kebersihan air', 'B. Menambah berat badan', 'C. Membasahi baju seragam sekolah', 'D. Mempercepat rasa lapar'],
        correctAnswer: 'A',
        explanation: 'Membasahi tubuh membantu otot beradaptasi dengan temperatur air dingin agar tidak mengalami kram mendadak.'
      }
    ];
  } else if (lowerM.includes('kebugaran') || lowerM.includes('daya tahan') || lowerM.includes('kekuatan') || lowerM.includes('kelincahan')) {
    domainQuestions = [
      {
        question: `Latihan push-up secara teratur dan berulang-ulang bertujuan untuk menguatkan otot...?`,
        options: ['A. Otot betis dan paha', 'B. Otot dada, bahu, dan lengan (triceps)', 'C. Otot leher bagian samping', 'D. Otot jari kaki'],
        correctAnswer: 'B',
        explanation: 'Push-up bertumpu pada kedua tangan dan ujung kaki yang menuntut kerja kontraksi otot dada serta lengan atas.'
      },
      {
        question: `Gerakan sit-up paling bermanfaat untuk melatih kekuatan dan kekencangan otot...?`,
        options: ['A. Otot perut (abdomen)', 'B. Otot tumit', 'C. Otot pergelangan tangan', 'D. Otot tempurung lutut'],
        correctAnswer: 'A',
        explanation: 'Sit-up menggerakkan tubuh bagian atas mendekati lutut yang digerakkan oleh kontraksi otot-otot dinding perut.'
      },
      {
        question: `Lari bolak-balik memindahkan balok atau menyentuh garis (shuttle run) bertujuan untuk mengukur dan melatih...?`,
        options: ['A. Kelenturan punggung', 'B. Kelincahan (agility) dan kecepatan mengubah arah', 'C. Ketinggian lompatan', 'D. Daya tahan pernapasan air'],
        correctAnswer: 'B',
        explanation: 'Kelincahan adalah kemampuan mengubah arah gerak tubuh dengan cepat dan tepat tanpa kehilangan keseimbangan.'
      },
      {
        question: `Untuk menjaga daya tahan jantung dan paru-paru (kardiovaskular), jenis latihan fisik yang paling tepat adalah...?`,
        options: ['A. Joging santai atau lari lintas alam secara teratur', 'B. Angkat beban berat sekali waktu', 'C. Duduk diam bermeditasi', 'D. Tidur siang lebih lama'],
        correctAnswer: 'A',
        explanation: 'Latihan aerobik berkelanjutan seperti joging memacu efisiensi pasokan oksigen oleh jantung dan paru-paru.'
      },
      {
        question: `Waktu istirahat tidur yang cukup dan ideal bagi anak usia Sekolah Dasar untuk pemulihan tubuh adalah...?`,
        options: ['A. 3 sampai 4 jam sehari', 'B. 8 sampai 10 jam setiap malam', 'C. 14 jam terus menerus', 'D. 1 jam saja'],
        correctAnswer: 'B',
        explanation: 'Anak usia sekolah membutuhkan tidur 8-10 jam untuk proses pertumbuhan optimal dan perbaikan jaringan sel tubuh.'
      }
    ];
  } else if (lowerM.includes('gizi') || lowerM.includes('sehat') || lowerM.includes('makanan') || lowerM.includes('kebersihan') || lowerM.includes('penyakit')) {
    domainQuestions = [
      {
        question: `Zat makanan yang menjadi sumber tenaga atau energi utama bagi tubuh kita saat berolahraga adalah...?`,
        options: ['A. Karbohidrat (seperti nasi, jagung, roti, dan kentang)', 'B. Lemak jenuh', 'C. Pengawet buatan', 'D. Pewarna sintetis'],
        correctAnswer: 'A',
        explanation: 'Karbohidrat dipecah menjadi glukosa yang digunakan otot sebagai bahan bakar utama dalam melakukan aktivitas fisik.'
      },
      {
        question: `Zat makanan yang berfungsi sebagai zat pembangun serta memperbaiki sel-sel tubuh yang rusak adalah...?`,
        options: ['A. Karbohidrat', 'B. Protein (seperti telur, ikan, tahu, tempe, susu)', 'C. Gula pasir', 'D. Minyak goreng'],
        correctAnswer: 'B',
        explanation: 'Protein mengandung asam amino esensial yang sangat penting dalam pembentukan jaringan otot dan pemulihan tubuh.'
      },
      {
        question: `Cara mencuci tangan yang benar untuk mencegah penularan kuman penyakit adalah...?`,
        options: ['A. Mengelap tangan pada celana olahraga', 'B. Mencuci dengan sabun di bawah air bersih yang mengalir minimal 20 detik', 'C. Mencelupkan tangan ke ember air kotor', 'D. Cukup membasahi ujung jari dengan air dingin'],
        correctAnswer: 'B',
        explanation: 'Air mengalir dan sabun merontokkan kuman, bakteri, serta virus yang menempel pada lipatan telapak tangan.'
      },
      {
        question: `Tindakan pertolongan pertama yang tepat saat mengalami luka lecet ringan akibat terjatuh di lapangan adalah...?`,
        options: ['A. Membiarkan luka terkena debu tanah', 'B. Membersihkan luka dengan air bersih mengalir lalu mengoleskan cairan antiseptik', 'C. Menggosok luka dengan kain kotor', 'D. Menutup luka dengan tanah liat'],
        correctAnswer: 'B',
        explanation: 'Membersihkan kotoran dengan air mengalir dan memberi antiseptik membunuh kuman serta mencegah infeksi luka.'
      },
      {
        question: `Menjaga kebersihan pakaian olahraga setelah digunakan berolahraga dilakukan dengan cara...?`,
        options: ['A. Langsung dicuci dengan sabun cuci hingga bersih dan dijemur', 'B. Dibiarkan menumpuk basah di dalam tas sekolah berhari-hari', 'C. Dipakai kembali berulang kali tanpa dicuci', 'D. Disemprot parfum tanpa dicuci'],
        correctAnswer: 'A',
        explanation: 'Baju olahraga yang basah oleh keringat mengandung bakteri yang mudah menimbulkan bau tidak sedap dan penyakit kulit jika tidak segera dicuci.'
      }
    ];
  } else if (lowerM.includes('silat') || lowerM.includes('bela diri') || lowerM.includes('pencak')) {
    domainQuestions = [
      {
        question: `Sikap dasar menapakkan kaki untuk memperkokoh posisi tubuh agar tidak mudah goyah atau jatuh saat diserang lawan dalam pencak silat disebut...?`,
        options: ['A. Kuda-kuda', 'B. Sikap istirahat', 'C. Langkah tegap', 'D. Duduk bersila'],
        correctAnswer: 'A',
        explanation: 'Kuda-kuda adalah tumpuan kaki yang kokoh untuk menopang berat badan dan menjaga keseimbangan saat menyerang atau bertahan.'
      },
      {
        question: `Sikap siap menghadapi lawan yang dilengkapi dengan koordinasi kesiagaan tangan dan tumpuan kaki disebut...?`,
        options: ['A. Sikap pasang', 'B. Sikap hormat', 'C. Sikap tidur', 'D. Sikap bersalaman'],
        correctAnswer: 'A',
        explanation: 'Sikap pasang merupakan kombinasi sikap kuda-kuda dan posisi tangan siaga dalam mengantisipasi serangan lawan.'
      },
      {
        question: `Gerakan tangan yang bertujuan membendung atau mengalihkan lintasan pukulan lawan agar tidak mengenai tubuh disebut teknik...?`,
        options: ['A. Tangkisan', 'B. Pukulan bandul', 'C. Tendangan sabit', 'D. Kuncian leher'],
        correctAnswer: 'A',
        explanation: 'Tangkisan berfungsi menghalau atau membelokkan arah serangan lawan dengan memanfaatkan lengan atau kaki.'
      },
      {
        question: `Nilai budi pekerti luhur utama yang wajib dimiliki oleh seorang pesilat sejati adalah...?`,
        options: ['A. Menggunakan ilmu bela diri untuk melindungi diri dan menolong sesama dengan rendah hati', 'B. Suka berkelahi dan memamerkan kekuatan di depan teman', 'C. Menantang siapa saja yang tidak disukai', 'D. Bersikap sombong dan arogan'],
        correctAnswer: 'A',
        explanation: 'Falsafah bela diri pencak silat mengajarkan ketaqwaan, kerendahan hati, membela kebenaran, dan menahan emosi.'
      },
      {
        question: `Pukulan lurus ke depan dengan sasaran dada lawan dalam pencak silat dilakukan dengan posisi kepalan tangan...?`,
        options: ['A. Menggenggam rapat dengan dorongan bahu dan lecutan pinggang', 'B. Terbuka lemas ke bawah', 'C. Mengacungkan satu jari telunjuk', 'D. Menekuk pergelangan tangan ke belakang'],
        correctAnswer: 'A',
        explanation: 'Dorongan bahu dan perputaran pinggang menyalurkan tenaga maksimal menuju kepalan tangan lurus ke sasaran.'
      }
    ];
  } else if (lowerM.includes('irama') || lowerM.includes('ritmik') || lowerM.includes('berirama')) {
    domainQuestions = [
      {
        question: `Unsur utama yang paling membedakan aktivitas gerak berirama (senam irama) dengan senam lainnya adalah...?`,
        options: ['A. Ketepatan gerakan mengikuti ketukan musik atau hitungan irama', 'B. Kecepatan mengangkat beban besi', 'C. Waktu tidur yang lama', 'D. Lari sekencang-kencangnya'],
        correctAnswer: 'A',
        explanation: 'Senam irama memadukan keselarasan antara gerak tubuh (langkah kaki dan ayunan lengan) dengan tempo ketukan musik.'
      },
      {
        question: `Sikap tubuh yang rileks, tidak kaku, dan gemulai saat melakukan gerakan senam irama disebut dengan unsur...?`,
        options: ['A. Keluwesan (fleksibilitas)', 'B. Kekakuan otot', 'C. Ketergesa-gesaan', 'D. Kekerasan pukulan'],
        correctAnswer: 'A',
        explanation: 'Keluwesan membuat transisi rangkaian gerak ayunan lengan dan langkah kaki mengalir indah tanpa ketegangan otot.'
      },
      {
        question: `Istilah langkah biasa dalam senam irama dikenal dengan sebutan...?`,
        options: ['A. Looppas', 'B. Bijtrekpas', 'C. Galoppas', 'D. Wallpas'],
        correctAnswer: 'A',
        explanation: 'Looppas adalah langkah biasa ke depan dengan tumit menapak terlebih dahulu diikuti telapak kaki dan ujung jari.'
      },
      {
        question: `Gerakan mengayunkan kedua lengan dari depan ke samping atau melingkar di atas kepala bertujuan untuk melatih kelenturan persendian...?`,
        options: ['A. Sendi bahu dan dada', 'B. Sendi pergelangan kaki', 'C. Sendi jari kelingking', 'D. Sendi lutut bagian bawah'],
        correctAnswer: 'A',
        explanation: 'Ayunan lengan melibatkan luas gerak sendi bahu yang membantu meregangkan otot dada dan punggung.'
      },
      {
        question: `Latihan gerak berirama yang dilakukan secara kompak bersama teman-teman sekelas dapat memupuk nilai...?`,
        options: ['A. Kekompakan, keselarasan, dan kebersamaan', 'B. Persaingan saling menjatuhkan', 'C. Keinginan tampil sendiri paling menonjol', 'D. Kemalasan bergerak'],
        correctAnswer: 'A',
        explanation: 'Senam irama beregu mengasah kepekaan menyamakan ritme bersama sehingga menumbuhkan gotong royong dan kekompakan.'
      }
    ];
  } else if (lowerM.includes('tradisional') || lowerM.includes('gobak') || lowerM.includes('benteng') || lowerM.includes('engklek')) {
    domainQuestions = [
      {
        question: `Dalam permainan tradisional gobak sodor (galasin), pemain yang bertugas menjaga garis lurus di tengah memotong lapangan dinamakan...?`,
        options: ['A. Penjaga garis sodor', 'B. Penjaga gawang', 'C. Pemain cadangan', 'D. Wasit penonton'],
        correctAnswer: 'A',
        explanation: 'Penjaga sodor memiliki hak bergerak bebas maju-mundur di sepanjang garis vertikal tengah untuk menghadang lawan melintas.'
      },
      {
        question: `Unsur kebugaran jasmani yang paling dominan dilatih saat bermain bentengan dan gobak sodor adalah...?`,
        options: ['A. Kelincahan (agility), kecepatan berlari, dan kerjasama tim', 'B. Daya tahan tidur', 'C. Kekuatan mengangkat meja', 'D. Ketenangan memanah'],
        correctAnswer: 'A',
        explanation: 'Permainan tradisional melatih respon gerak cepat, perubahan arah menghindar, dan koordinasi taktis bersama regu.'
      },
      {
        question: `Cara melompat pada petak-petak permainan tradisional engklek dilakukan dengan menggunakan...?`,
        options: ['A. Satu kaki bertumpu secara seimbang (engklek/hop)', 'B. Kedua tangan di lantai', 'C. Berjalan merangkak', 'D. Duduk meluncur'],
        correctAnswer: 'A',
        explanation: 'Engklek melatih kekuatan tungkai kaki tunggal dan keseimbangan tubuh dinamis saat mendarat di tiap petak gambar.'
      },
      {
        question: `Ketika seorang pemain regu penyerang tersentuh oleh tangan regu penjaga dalam permainan bentengan, maka pemain tersebut harus...?`,
        options: ['A. Menjadi tawanan di dekat benteng lawan hingga diselamatkan rekan setim', 'B. Keluar lapangan dan menangis', 'C. Mengganti peraturan sesuka hati', 'D. Memukul pemain yang menyentuh'],
        correctAnswer: 'A',
        explanation: 'Pemain yang tertawan dapat kembali bermain jika tersentuh oleh rekannya yang berhasil menerobos pertahanan lawan.'
      },
      {
        question: `Manfaat melestarikan permainan tradisional bagi anak-anak Indonesia adalah...?`,
        options: ['A. Menjaga warisan budaya bangsa, menjalin pertemanan akrab, dan menyehatkan tubuh secara gembira', 'B. Mengurangi waktu belajar', 'C. Menghabiskan uang jajan', 'D. Merusak lapangan sekolah'],
        correctAnswer: 'A',
        explanation: 'Permainan tradisional sarat kearifan lokal yang mengajarkan nilai sosial, kejujuran, dan keaktifan fisik tanpa gawai.'
      }
    ];
  } else if (lowerM.includes('bulu tangkis') || lowerM.includes('badminton') || lowerM.includes('tenis meja')) {
    domainQuestions = [
      {
        question: `Cara memegang raket bulu tangkis seperti sedang bersalaman tangan dengan orang lain dinamakan pegangan...?`,
        options: ['A. Forehand grip', 'B. Backhand grip', 'C. Penholder grip', 'D. American grip'],
        correctAnswer: 'A',
        explanation: 'Forehand grip menempatkan ibu jari dan jari telunjuk membentuk huruf V menyerupai jabat tangan yang mantap.'
      },
      {
        question: `Pukulan permulaan untuk menyeberangkan shuttlecock melewati net ke bidang servis lawan dalam bulu tangkis disebut...?`,
        options: ['A. Servis', 'B. Smash keras', 'C. Dropshot tipis', 'D. Netting'],
        correctAnswer: 'A',
        explanation: 'Servis adalah pukulan legal pembuka setiap reli poin dalam pertandingan bulu tangkis.'
      },
      {
        question: `Pukulan smash keras dan menukik tajam ke lantai lapangan lawan bertujuan utama untuk...?`,
        options: ['A. Mematikan lawan dan segera mencetak poin angka', 'B. Membuang shuttlecock ke luar garis', 'C. Mengulur waktu permainan', 'D. Menyerahkan shuttlecock kepada wasit'],
        correctAnswer: 'A',
        explanation: 'Smash merupakan senjata penyerangan utama yang mengandalkan kecepatan pukulan lecutan pergelangan tangan.'
      },
      {
        question: `Bola kecil bersayap bulu unggas yang digunakan dalam permainan bulu tangkis disebut...?`,
        options: ['A. Shuttlecock (Kok)', 'B. Bola kasti', 'C. Bola tenis karet', 'D. Frisbee'],
        correctAnswer: 'A',
        explanation: 'Shuttlecock terbuat dari gabus bundar yang dilapisi kulit dan ditancapi 16 helai bulu unggas pilihan.'
      }
    ];
  } else if (lowerM.includes('rokok') || lowerM.includes('napza') || lowerM.includes('miras') || lowerM.includes('narkoba')) {
    domainQuestions = [
      {
        question: `Zat berbahaya di dalam rokok yang bersifat adiktif sehingga menyebabkan orang menjadi kecanduan merokok adalah...?`,
        options: ['A. Nikotin', 'B. Vitamin C', 'C. Glukosa murni', 'D. Kalsium'],
        correctAnswer: 'A',
        explanation: 'Nikotin memengaruhi reseptor dopamine di otak sehingga memicu ketergantungan fisik dan psikis yang kuat.'
      },
      {
        question: `Gas beracun tidak berwarna dan tidak berbau yang dihasilkan dari asap rokok dan mengurangi pasokan oksigen darah adalah...?`,
        options: ['A. Karbon monoksida (CO)', 'B. Oksigen murni (O2)', 'C. Gas nitrogen cair', 'D. Uap air hangat'],
        correctAnswer: 'A',
        explanation: 'Karbon monoksida mengikat hemoglobin darah 200 kali lebih kuat daripada oksigen, sehingga organ tubuh kekurangan oksigen.'
      },
      {
        question: `Sikap yang paling tepat jika ada seseorang yang menawarkan rokok atau obat-obatan mencurigakan kepada kita adalah...?`,
        options: ['A. Menolak dengan tegas ("Katakan TIDAK!"), menjauh, dan segera melaporkan kepada guru atau orang tua', 'B. Menerimanya karena penasaran', 'C. Menyimpannya di dalam saku', 'D. Membagikannya kepada teman sekelas'],
        correctAnswer: 'A',
        explanation: 'Menjaga diri dari zat adiktif membutuhkan keberanian menolak secara asertif serta meminta pendampingan orang dewasa.'
      },
      {
        question: `Organ tubuh manusia yang paling rentan mengalami kerusakan parah akibat zat tar berbahaya pada asap rokok adalah...?`,
        options: ['A. Paru-paru dan jantung', 'B. Tulang tumit', 'C. Kuku jempol', 'D. Rambut alis'],
        correctAnswer: 'A',
        explanation: 'Tar mengendap pada silia dan alveolus paru-paru yang menyebabkan kanker, bronkitis kronis, dan penyumbatan arteri jantung.'
      }
    ];
  } else if (lowerM.includes('pubertas') || lowerM.includes('reproduksi') || lowerM.includes('kelamin')) {
    domainQuestions = [
      {
        question: `Tindakan menjaga kebersihan tubuh yang wajib dibiasakan saat memasuki masa pubertas karena kelenjar keringat mulai aktif adalah...?`,
        options: ['A. Mandi teratur minimal 2 kali sehari menggunakan sabun mandi dan mengeringkan tubuh dengan handuk bersih', 'B. Jarang mandi agar kulit tidak kering', 'C. Cukup menyemprotkan minyak wangi tanpa mandi', 'D. Tidak pernah berganti baju olahraga'],
        correctAnswer: 'A',
        explanation: 'Mandi teratur membersihkan keringat, sebum minyak, dan bakteri yang dapat menimbulkan bau badan dan gatal-gatal pada kulit.'
      },
      {
        question: `Pakaian dalam yang paling sehat dan aman untuk digunakan sehari-hari sebaiknya terbuat dari bahan...?`,
        options: ['A. Katun yang lembut dan mudah menyerap keringat', 'B. Plastik tebal yang kedap udara', 'C. Wol kaku yang panas', 'D. Kertas sekali pakai'],
        correctAnswer: 'A',
        explanation: 'Bahan katun menjaga sirkulasi udara pada area lipatan tubuh dan menyerap kelembapan sehingga mencegah timbulnya jamur kulit.'
      },
      {
        question: `Setelah buang air kecil atau buang air besar, cara membersihkan area tubuh yang benar adalah...?`,
        options: ['A. Membasuh dengan air bersih mengalir dari depan ke arah belakang lalu dikeringkan', 'B. Cukup mengusap dengan tangan kotor', 'C. Membiarkan basah tanpa dikeringkan', 'D. Mengelap pada baju seragam'],
        correctAnswer: 'A',
        explanation: 'Membasuh dari depan ke belakang mencegah perpindahan kuman bakteri dari anus ke saluran kemih.'
      },
      {
        question: `Bagian tubuh yang tertutup pakaian dalam merupakan area privasi pribadi yang...?`,
        options: ['A. Tidak boleh dilihat atau disentuh oleh orang lain sembarangan', 'B. Boleh diperlihatkan di tempat umum', 'C. Boleh difoto oleh orang asing', 'D. Tidak perlu dilindungi'],
        correctAnswer: 'A',
        explanation: 'Edukasi perlindungan diri mengajarkan bahwa anggota tubuh privat harus dijaga martabatnya demi keamanan dan keselamatan anak.'
      }
    ];
  } else if (parseInt(g) <= 2 || lowerM.includes('lokomotor') || lowerM.includes('non-lokomotor') || lowerM.includes('manipulatif')) {
    domainQuestions = [
      {
        question: `Gerakan berjalan ke depan dengan langkah santai dan pandangan mata tertuju ke...?`,
        options: ['A. Depan lintasan jalan', 'B. Atas langit-langit terus menerus', 'C. Belakang sambil memejamkan mata', 'D. Bawah sepatu tanpa melihat jalan'],
        correctAnswer: 'A',
        explanation: 'Memandang lurus ke depan menjaga keseimbangan tubuh dan membantu kita melihat rintangan di jalan.'
      },
      {
        question: `Perbedaan antara melompat dan meloncat dalam gerak lokomotor adalah...?`,
        options: ['A. Melompat bertumpu pada 1 kaki, sedangkan meloncat bertumpu pada 2 kaki bersamaan', 'B. Melompat sambil duduk di lantai', 'C. Meloncat dilakukan dengan tangan', 'D. Keduanya tidak menggunakan kaki'],
        correctAnswer: 'A',
        explanation: 'Secara keilmuan gerak dasar PJOK: melompat (jump/hop) menolak 1 kaki, meloncat (leap) menolak dengan 2 kaki bersamaan.'
      },
      {
        question: `Gerakan memutar kepala, mengayunkan kedua lengan, dan meliukkan badan ke samping tanpa berpindah tempat disebut gerak...?`,
        options: ['A. Gerak Non-lokomotor', 'B. Gerak Lokomotor', 'C. Gerak Manipulatif', 'D. Gerak Lari Cepat'],
        correctAnswer: 'A',
        explanation: 'Gerak non-lokomotor adalah aktivitas gerak yang dilakukan di tempat poros tubuh tanpa perpindahan letak posisi.'
      },
      {
        question: `Aktivitas melempar bola karet lunak ke arah keranjang sasaran termasuk contoh gerakan...?`,
        options: ['A. Gerak Manipulatif', 'B. Gerak Lokomotor', 'C. Gerak Non-lokomotor', 'D. Gerak Statis'],
        correctAnswer: 'A',
        explanation: 'Gerak manipulatif melibatkan keterampilan anggota tubuh mengontrol objek atau benda olahraga seperti bola.'
      },
      {
        question: `Waktu yang tepat untuk menggosok gigi setiap hari agar gigi tetap bersih, sehat, dan tidak berlubang adalah...?`,
        options: ['A. Pagi setelah sarapan dan malam sebelum tidur', 'B. Satu minggu sekali saja', 'C. Hanya saat gigi terasa sakit', 'D. Sambil tidur siang'],
        correctAnswer: 'A',
        explanation: 'Menggosok gigi setelah makan pagi dan sebelum tidur membersihkan sisa makanan dan mencegah bakteri merusak lapisan email gigi.'
      }
    ];
  } else {
    // General PJOK curriculum fundamentals matched with user topic
    domainQuestions = [
      {
        question: `Dalam pembelajaran materi "${m}" pada PJOK Kelas ${g} SD, tujuan utama pemanasan sebelum praktik adalah...?`,
        options: [
          'A. Menyiapkan otot dan sendi agar terhindar dari cedera',
          'B. Menghabiskan tenaga sebelum bermain',
          'C. Menunggu teman yang belum hadir',
          'D. Membuat tubuh menjadi cepat lelah'
        ],
        correctAnswer: 'A',
        explanation: 'Pemanasan bertahap menaikkan suhu tubuh dan elastisitas otot sehingga siap melakukan gerak inti dengan aman.'
      },
      {
        question: `Gerakan berpindah tempat dari satu posisi ke posisi lain dalam materi "${m}" termasuk kategori gerak...?`,
        options: [
          'A. Gerak Lokomotor',
          'B. Gerak Non-lokomotor',
          'C. Gerak Manipulatif',
          'D. Gerak Statis'
        ],
        correctAnswer: 'A',
        explanation: 'Gerak lokomotor adalah gerak dasar manusia yang ditandai dengan adanya perpindahan tempat tubuh (misal: berjalan, berlari, melompat).'
      },
      {
        question: `Sikap tubuh yang benar saat melakukan gerakan melompat dan mendarat dalam pembelajaran "${m}" adalah...?`,
        options: [
          'A. Kaki kaku lurus membentur tanah',
          'B. Kedua lutut sedikit mengeper (ditekuk) untuk meredam beban pendaratan',
          'C. Menjatuhkan pinggang ke samping',
          'D. Menumpu dengan satu ujung jari kaki saja'
        ],
        correctAnswer: 'B',
        explanation: 'Mengeperkan lutut saat mendarat mendistribusikan gaya hentakan secara merata dan mencegah cedera pada sendi lutut serta pergelangan kaki.'
      },
      {
        question: `Saat melakukan aktivitas fisik "${m}", sikap sportif yang harus ditunjukkan oleh setiap murid adalah...?`,
        options: [
          'A. Selalu ingin menang sendiri dengan cara curang',
          'B. Mengikuti aturan kegiatan, jujur, dan menghargai teman maupun guru',
          'C. Marah saat regunya mengalami kekalahan',
          'D. Mengejek teman yang belum menguasai gerakan'
        ],
        correctAnswer: 'B',
        explanation: 'Sportivitas menanamkan integritas, kepatuhan pada aturan, dan sikap saling menghargai sesama peserta didik.'
      },
      {
        question: `Setelah selesai mempraktikkan materi pembelajaran "${m}", kegiatan penutup yang bermanfaat untuk memulihkan denyut nadi adalah...?`,
        options: [
          'A. Pendinginan (cooling down) dan relaksasi napas',
          'B. Langsung meminum es manis dalam jumlah banyak',
          'C. Tidur tengkurap di lapangan terik',
          'D. Melompat-lompat sekeras-kerasnya'
        ],
        correctAnswer: 'A',
        explanation: 'Pendinginan membantu menurunkan detak jantung secara bertahap menuju ritme normal serta mengurangi penumpukan asam laktat di otot.'
      },
      {
        question: `Gerak memanipulasi atau mengendalikan suatu benda/alat (seperti bola, simpai, atau tongkat) dalam materi "${m}" disebut gerak...?`,
        options: [
          'A. Manipulatif',
          'B. Non-lokomotor',
          'C. Lokomotor',
          'D. Refleks'
        ],
        correctAnswer: 'A',
        explanation: 'Gerak manipulatif melibatkan penguasaan koordinasi mata, tangan, dan kaki terhadap objek atau alat olahraga.'
      },
      {
        question: `Pakaian yang paling tepat dan aman saat mengikuti praktik materi "${m}" di lapangan adalah...?`,
        options: [
          'A. Seragam pramuka lengkap dengan baret',
          'B. Kaos dan celana olahraga yang menyerap keringat serta sepatu olahraga',
          'C. Baju pesta dengan sandal jepit',
          'D. Pakaian tebal berbahan wol kaku'
        ],
        correctAnswer: 'B',
        explanation: 'Pakaian olahraga memberikan keleluasaan bergerak secara optimal dan sepatu olahraga melindungi kaki dari benturan dan gesekan lantai lapangan.'
      }
    ];
  }

  // Ensure we have enough questions by cycling or padding if count is large
  const resultQuestions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }> = [];

  let idx = 0;
  while (resultQuestions.length < count) {
    const template = domainQuestions[idx % domainQuestions.length];
    if (resultQuestions.length < domainQuestions.length) {
      resultQuestions.push({ ...template });
    } else {
      // Create variations for large counts (e.g. 10 or 15 soal)
      const qNum = resultQuestions.length + 1;
      resultQuestions.push({
        question: `[Variasi Soal ${qNum}] Terkait materi "${m}" Kelas ${g} SD: ${template.question}`,
        options: [...template.options],
        correctAnswer: template.correctAnswer,
        explanation: template.explanation
      });
    }
    idx++;
  }

  const selectedQuestions = resultQuestions.slice(0, count);

  return {
    materi: m,
    grade: g,
    totalSoal: count,
    questions: selectedQuestions,
    soalList: selectedQuestions.map((q, i) => {
      const optA = q.options[0]?.replace(/^A\.\s*/, '') || '';
      const optB = q.options[1]?.replace(/^B\.\s*/, '') || '';
      const optC = q.options[2]?.replace(/^C\.\s*/, '') || '';
      const optD = q.options[3]?.replace(/^D\.\s*/, '') || '';
      return {
        id: `soal-${i + 1}`,
        pertanyaan: q.question,
        pilihan: {
          A: optA,
          B: optB,
          C: optC,
          D: optD
        },
        kunciJawaban: q.correctAnswer,
        pembahasan: q.explanation
      };
    })
  };
}

function getFallbackSummative(params: any, maybeMateri?: any) {
  const seed = params?.seed || (Date.now() + "_" + Math.random().toString(36).slice(2, 9));
  return generateSummativeAssessment({
    ...params,
    seed
  });
}

function getFallbackKKO(tpText: any) {
  return {
    levelBloom: 'C3 / C4 (Menerapkan & Menganalisis)',
    kkoTerdeteksi: ['Menganalisis', 'Mempraktikkan'],
    analisisPendidikanMendalam: 'Tujuan pembelajaran ini telah mengandung kata kerja operasional yang menuntut pemahaman konseptual sekaligus artikulasi gerakan psikomotorik secara nyata.',
    rekomendasiRevisi: 'Penggunaan KKO sudah sangat tepat untuk pembelajaran PJOK berkesadaran tinggi.',
    contohIndikator: [
      'Siswa mampu menyebutkan urutan tahapan gerak secara lisan.',
      'Siswa mampu mempraktikkan gerakan secara langsung di lapangan.'
    ]
  };
}

function getFallbackDailyTest(grade: any, materi: any, tipe?: any) {
  const g = grade || '1';
  const m = materi || 'Ulangan Harian PJOK';
  const t = tipe === 'praktik' ? 'praktik' : 'tulis';
  return {
    title: `INSTRUMEN ULANGAN HARIAN PJOK KELAS ${g}`,
    grade: g,
    materi: m,
    tujuanPembelajaran: `Siswa dapat memahami dan mempraktikkan materi ${m} dengan aman dan penuh percaya diri.`,
    tipeUlangan: t,
    questions: [
      {
        id: 'q1',
        questionText: `Gerakan berpindah tempat dari satu posisi ke posisi lain disebut gerak...?`,
        options: ['A. Lokomotor', 'B. Non-lokomotor', 'C. Manipulatif', 'D. Pasif'],
        correctAnswer: 'A',
        explanation: 'Gerak lokomotor ditandai dengan adanya perpindahan seluruh posisi tubuh.'
      },
      {
        id: 'q2',
        questionText: `Aktivitas yang wajib dilakukan sebelum melakukan olahraga inti adalah...?`,
        options: ['A. Pemanasan', 'B. Makan berat', 'C. Tidur gantung', 'D. Pendinginan'],
        correctAnswer: 'A',
        explanation: 'Pemanasan mempersiapkan fleksibilitas otot dan organ sirkulasi darah.'
      }
    ],
    essayQuestions: [
      {
        id: 'e1',
        questionText: `Sebutkan 3 contoh gerakan lokomotor yang sering kamu lakukan di sekolah!`,
        keyAnswer: 'Berjalan, berlari, dan melompat.',
        scoreMax: 10
      }
    ],
    taskInstructions: [
      `1. Lakukan pemanasan mandiri atau bersama kelompok selama 5 menit.`,
      `2. Praktikkan gerakan ${m} melintasi lintasan sepanjang 10 meter.`,
      `3. Utamakan keselamatan fisik dan koordinasi tubuh yang seimbang.`
    ],
    rubricCriteria: [
      {
        id: 'r1',
        aspect: 'Sikap Awalan & Posisi Tubuh',
        score4: 'Posisi berdiri sangat siap, fokus mata tepat ke depan, keseimbangan sempurna.',
        score3: 'Posisi berdiri cukup siap, fokus mata ke depan, keseimbangan baik.',
        score2: 'Posisi kurang siap, posisi kepala menunduk, sesekali oleng.',
        score1: 'Posisi tidak siap dan membutuhkan arahan ulang dari guru.'
      },
      {
        id: 'r2',
        aspect: 'Pelaksanaan Gerakan Inti',
        score4: 'Rangkaian gerakan sangat mulus, ritme konsisten, tanpa kesalahan pola.',
        score3: 'Rangkaian gerakan cukup mulus dengan sedikit penyesuaian ritme.',
        score2: 'Gerakan kaku, terjadi penyesuaian posisi berkali-kali.',
        score1: 'Gerakan tidak teratur dan belum menguasai pola dasar.'
      }
    ],
    scoringFormula: 'Nilai Akhir = (Total Skor Perolehan / Total Skor Maksimal) x 100',
    gradingGuide: 'Predikat: 86-100 (Sangat Baik), 71-85 (Baik), 56-70 (Cukup), <56 (Perlu Bimbingan)'
  };
}

function getFallbackATP(phase?: any, element?: any) {
  const p = phase || 'Fase A (Kelas 1 - 2)';
  const e = element || 'Keterampilan Gerak';
  return {
    alurTujuanPembelajaran: [
      `1.1 Peserta didik mampu menirukan variasi pola gerak dasar lokomotor (jalan, lari, melompat) dengan koordinasi tubuh yang seimbang pada ${p}.`,
      `1.2 Peserta didik mampu memperagakan kombinasi gerak dasar non-lokomotor (menekuk, mengayun, memutar) secara mandiri dan aman.`,
      `1.3 Peserta didik mampu melatih koordinasi gerak dasar manipulatif (melempar, menangkap, menendang) dalam kelompok kecil.`,
      `1.4 Peserta didik mampu mengarahkan gerakan sesuai petunjuk keselamatan dan menerapkan nilai-nilai sportivitas.`
    ],
    kriteriaKetercapaian: [
      {
        kriteria: 'Penguasaan Pola Gerak Dasar Lokomotor',
        baruBerkembang: 'Belum stabil, posisi kaki dan koordinasi tangan belum seirama.',
        layak: 'Mampu melakukan gerakan jalan dan lari dengan posisi tubuh seimbang.',
        mahir: 'Mampu melakukan kombinasi jalan, lari, dan melompat secara mulus tanpa kehilangan keseimbangan.'
      },
      {
        kriteria: 'Kepatuhan Keselamatan & Sportivitas',
        baruBerkembang: 'Membutuhkan teguran dan pendampingan langsung dari guru.',
        layak: 'Mampu mematuhi instruksi keselamatan dan bekerja sama cukup baik.',
        mahir: 'Menjadi teladan keselamatan dan aktif membantu serta menyemangati teman sekelompok.'
      }
    ],
    metodePembelajaran: 'Pendekatan Saintifik, Game-Based Learning (Permainan Edukatif Berkesadaran), dan Unjuk Kerja Lapangan.'
  };
}

function getFallbackCPTP(fase?: any, elemen?: any) {
  const f = fase || 'Fase A (Kelas 1 - 2)';
  const e = elemen || 'Keterampilan Gerak';
  return {
    fase: f,
    kelas: 'Kelas 1 - 2',
    elemen: e,
    cpAsli: `Pada akhir ${f}, peserta didik mampu menirukan dan mempraktikkan variasi pola gerak dasar pada elemen ${e} secara aman dan disiplin.`,
    materiSpesifik: 'Pola Gerak Dasar Lokomotor, Non-Lokomotor, dan Manipulatif',
    analisisDekonstruksi: {
      kompetensiUtama: ['Menirukan', 'Mempraktikkan', 'Mengidentifikasi', 'Menerapkan'],
      lingkupMateriUtama: ['Variasi Gerak Lokomotor', 'Variasi Gerak Non-Lokomotor', 'Variasi Gerak Manipulatif'],
      variasiKarakteristikSiswa: 'Mempertimbangkan perkembangan kognitif dan motorik kasar anak usia SD awal.'
    },
    daftarTp: [
      {
        kodeTp: 'TP-A.1',
        rumusanTp: 'Peserta didik mampu menjelaskan dan menirukan prosedur variasi gerak dasar lokomotor (jalan, lari, melompat) dengan benar.',
        kompetensiKko: 'Menjelaskan & Menirukan (C2 / P2)',
        lingkupMateri: 'Variasi Gerak Dasar Lokomotor',
        indikatorKetercapaian: [
          'Siswa dapat menyebutkan perbedaan jalan dan lari.',
          'Siswa dapat mempraktikkan gerak jalan lurus dan berbelok-belok.',
          'Siswa dapat melakukan lompatan dengan tumpuan dua kaki.'
        ],
        profilPancasila: 'Mandiri, Gotong Royong, Bernalar Kritis',
        targetKelasSemester: 'Kelas 1 / Semester 1',
        alokasiWaktu: '8 JP (4 Pertemuan)',
        rekomendasiAsesmen: 'Asesmen Formatif Unjuk Kerja Lapangan & Pengamatan Rubrik'
      },
      {
        kodeTp: 'TP-A.2',
        rumusanTp: 'Peserta didik mampu mempraktikkan kombinasi gerak dasar non-lokomotor (menekuk, memutar, mengayun) secara aman.',
        kompetensiKko: 'Mempraktikkan (P3)',
        lingkupMateri: 'Variasi Gerak Dasar Non-Lokomotor',
        indikatorKetercapaian: [
          'Siswa dapat melakukan gerakan mengayun lengan tanpa berpindah tempat.',
          'Siswa dapat membungkukkan badan menyentuh ujung kaki.'
        ],
        profilPancasila: 'Mandiri, Kreatif',
        targetKelasSemester: 'Kelas 1 / Semester 1',
        alokasiWaktu: '8 JP (4 Pertemuan)',
        rekomendasiAsesmen: 'Unjuk Kerja & Observasi Sikap'
      }
    ],
    rekomendasiPendekatan: 'Pendekatan Bermain (Play-Based Learning) dan Modifikasi Alat Sederhana',
    catatanPendidik: 'Dampingi siswa secara individual pada gerakan yang membutuhkan keseimbangan ekstra.'
  };
}

function getFallbackKKTP(grade?: any, materi?: any, mapel?: any) {
  const g = grade || '1';
  const m = materi || 'Variasi Gerak Dasar Lokomotor';
  const mp = mapel || 'PJOK';
  return {
    identitas: {
      satuanPendidikan: 'SD NEGERI KALIMANTONG',
      mataPelajaran: mp,
      kelas: g,
      fase: parseInt(g) <= 2 ? 'A' : parseInt(g) <= 4 ? 'B' : 'C',
      semester: '1',
      tahunPelajaran: '2026/2027'
    },
    bab: 'Bab 1',
    materiPokok: m,
    deskripsiCp: `Peserta didik mampu mempraktikkan variasi gerak dasar ${m} secara mandiri dan aman.`,
    tujuanPembelajaran: `Siswa dapat memperagakan variasi gerak dasar ${m} dengan koordinasi tepat.`,
    kktpRows: [
      {
        no: '1',
        indikatorTp: `Keseimbangan dan Postur Tubuh saat melakukan ${m}`,
        interval0_60: 'Belum mampu menjaga keseimbangan tubuh (Perlu Bimbingan)',
        interval61_75: 'Mampu menjaga keseimbangan dengan sedikit penyesuaian (Cukup)',
        interval76_85: 'Posisi tubuh seimbang dan postur tegak stabil (Baik)',
        interval86_100: 'Sangat stabil, gerakan santai dan penuh rasa percaya diri (Sangat Baik)'
      },
      {
        no: '2',
        indikatorTp: `Akurasi dan Kelancaran Rangkaian Gerakan ${m}`,
        interval0_60: 'Gerakan sering terputus dan ragu-ragu (Perlu Bimbingan)',
        interval61_75: 'Gerakan lumayan lancar tetapi kecepatan kurang teratur (Cukup)',
        interval76_85: 'Rangkaian gerakan lancar dan koordinasi tangan-kaki tepat (Baik)',
        interval86_100: 'Sangat lancar, ritme konsisten dan teknik gerakan sempurna (Sangat Baik)'
      }
    ],
    rekomendasiTindakLanjut: 'Siswa yang memperoleh nilai interval 0-60 diberikan bimbingan perorangan saat jam olahraga.'
  };
}

function getFallbackRPE(tahunPelajaran?: any, semester?: any) {
  const tp = tahunPelajaran || '2026/2027';
  const sem = semester || '1';
  return {
    identitas: {
      namaSekolah: 'SD NEGERI KALIMANTONG',
      mataPelajaran: 'PJOK',
      kelas: '1',
      semester: sem,
      tahunPelajaran: tp,
      jpPerMinggu: '4'
    },
    alokasiWaktu: {
      bulans: [
        { bulan: 'Juli', totalPekan: 4, efektif: 2, tidakEfektif: 2 },
        { bulan: 'Agustus', totalPekan: 5, efektif: 4, tidakEfektif: 1 },
        { bulan: 'September', totalPekan: 4, efektif: 4, tidakEfektif: 0 },
        { bulan: 'Oktober', totalPekan: 4, efektif: 4, tidakEfektif: 0 },
        { bulan: 'November', totalPekan: 4, efektif: 4, tidakEfektif: 0 },
        { bulan: 'Desember', totalPekan: 5, efektif: 2, tidakEfektif: 3 }
      ],
      totalPekan: 26,
      totalPekanEfektif: 20,
      totalPekanTidakEfektif: 6
    },
    pekanTidakEfektif: [
      { namaKegiatan: 'MPLS & Masa Transisi', jumlahPekan: 2, bulan: 'Juli' },
      { namaKegiatan: 'Peringatan HUT RI & Lomba Sekolah', jumlahPekan: 1, bulan: 'Agustus' },
      { namaKegiatan: 'Penilaian Akhir Semester (PAS) & Pembagian Rapor', jumlahPekan: 3, bulan: 'Desember' }
    ],
    totalPekanEfektifFormula: '26 total pekan - 6 pekan tidak efektif = 20 Pekan Efektif',
    totalJamEfektifFormula: '20 pekan efektif x 4 JP = 80 Jam Pelajaran (JP)',
    catatanAnalisis: 'Alokasi jam efektif sangat mencukupi untuk menyelesaikan seluruh bab Kurikulum Merdeka PJOK.',
    tanggalDokumen: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  };
}

function getFallbackProta(grade?: any, semester?: any, tahunPelajaran?: any) {
  const g = String(grade || '4');
  const tp = tahunPelajaran || '2026/2027';
  const sibiBook = getSibiBookByGrade(g);
  const sibiUnits = getSibiUnitsByGrade(g);

  const rows = sibiUnits.length > 0
    ? sibiUnits.map((u, idx) => ({
        no: String(idx + 1),
        bab: `${u.unitCode}: ${u.unitTitle}`,
        tujuanPembelajaran: u.tujuanPembelajaran[0] || `Murid dapat memahami dan mempraktikkan ${u.pokokMateri}.`,
        materi: `${u.pokokMateri} (Buku SIBI: ${u.kataKunci.join(', ')})`,
        alokasiWaktu: `${u.alokasiJp} (${u.alokasiPertemuan})`,
        semester: `Semester ${u.semester}`
      }))
    : [
        {
          no: '1',
          bab: 'Unit 1',
          tujuanPembelajaran: 'Peserta didik dapat memahami dan mempraktikkan variasi gerak dasar lokomotor.',
          materi: 'Gerak Dasar Lokomotor (Jalan, Lari, Lompat)',
          alokasiWaktu: '12 JP (4 Pertemuan)',
          semester: 'Semester 1'
        }
      ];

  return {
    identitas: {
      mataPelajaran: `PJOK (${sibiBook ? sibiBook.judulBukuGuru : 'Buku Panduan Guru SIBI Kemendikdasmen'})`,
      kelas: g,
      fase: parseInt(g) <= 2 ? 'A' : parseInt(g) <= 4 ? 'B' : 'C',
      tahunPelajaran: tp,
      totalJp2Semester: '108 JP (36 Pekan Efektif × 3 JP)',
      alokasiWaktuTiapMinggu: '3 JP / Pekan (Sesuai Buku Panduan Guru PJOK SIBI)',
      semester1Weeks: '18',
      semester2Weeks: '18'
    },
    rows,
    tanggalDokumen: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  };
}

function getFallbackProsem(grade?: any, semester?: any, tahunPelajaran?: any) {
  const g = String(grade || '4');
  const tp = tahunPelajaran || '2026/2027';
  const sibiUnits = getSibiUnitsByGrade(g);

  const makeSemesterData = (semNum: number) => {
    const monthsHeader = semNum === 1
      ? [
          { monthName: 'Juli', totalWeeks: 4, nonEffectiveWeeks: [1, 2] },
          { monthName: 'Agustus', totalWeeks: 5, nonEffectiveWeeks: [3] },
          { monthName: 'September', totalWeeks: 4, nonEffectiveWeeks: [] },
          { monthName: 'Oktober', totalWeeks: 4, nonEffectiveWeeks: [] },
          { monthName: 'November', totalWeeks: 4, nonEffectiveWeeks: [] },
          { monthName: 'Desember', totalWeeks: 5, nonEffectiveWeeks: [3, 4, 5] }
        ]
      : [
          { monthName: 'Januari', totalWeeks: 4, nonEffectiveWeeks: [1] },
          { monthName: 'Februari', totalWeeks: 4, nonEffectiveWeeks: [] },
          { monthName: 'Maret', totalWeeks: 4, nonEffectiveWeeks: [3] },
          { monthName: 'April', totalWeeks: 4, nonEffectiveWeeks: [2, 3] },
          { monthName: 'Mei', totalWeeks: 5, nonEffectiveWeeks: [] },
          { monthName: 'Juni', totalWeeks: 4, nonEffectiveWeeks: [3, 4] }
        ];

    const filteredUnits = sibiUnits.filter((u) => String(u.semester) === String(semNum));
    const topics = filteredUnits.length > 0
      ? filteredUnits.map((u, idx) => ({
          no: String(semNum === 1 ? idx + 1 : idx + 5),
          bab: u.unitCode,
          topik: `${u.unitTitle} — ${u.pokokMateri}`,
          pert: `${idx * 3 + 1}-${(idx + 1) * 3}`,
          jp: `${u.alokasiJp}`
        }))
      : semNum === 1
        ? [
            { no: '1', bab: 'Unit 1', topik: 'Aktivitas Pola Gerak Dasar Lokomotor', pert: '1-4', jp: '12 JP' },
            { no: '2', bab: 'Unit 2', topik: 'Aktivitas Pola Gerak Dasar Nonlokomotor', pert: '5-8', jp: '12 JP' },
            { no: '3', bab: 'Unit 3', topik: 'Aktivitas Pola Gerak Dasar Manipulatif', pert: '9-12', jp: '12 JP' },
            { no: '4', bab: 'Unit 4', topik: 'Aktivitas Senam', pert: '13-16', jp: '12 JP' }
          ]
        : [
            { no: '5', bab: 'Unit 5', topik: 'Aktivitas Gerak Berirama', pert: '17-20', jp: '12 JP' },
            { no: '6', bab: 'Unit 6', topik: 'Aktivitas Pengenalan Air', pert: '21-24', jp: '12 JP' },
            { no: '7', bab: 'Unit 7', topik: 'Aktivitas Kebugaran Jasmani', pert: '25-28', jp: '12 JP' },
            { no: '8', bab: 'Unit 8', topik: 'pola Hidup Sehat & Kebersihan', pert: '29-32', jp: '12 JP' }
          ];

    const rows = topics.map((t) => ({
      no: t.no,
      bab: t.bab,
      topik: t.topik,
      pertemuanKe: t.pert,
      alokasiWaktu: t.jp,
      months: monthsHeader.map((mh) => ({
        monthName: mh.monthName,
        weeks: Array.from({ length: mh.totalWeeks }, (_, wIdx) => {
          const wNum = wIdx + 1;
          const isNonEff = mh.nonEffectiveWeeks.includes(wNum);
          return {
            weekNum: wNum,
            value: isNonEff ? 'L' : '3',
            isEffective: !isNonEff
          };
        })
      }))
    }));

    return { monthsHeader, rows };
  };

  return {
    identitas: {
      mataPelajaran: 'PJOK (Sesuai Buku Panduan Guru SIBI Kemendikdasmen)',
      kelas: g,
      fase: parseInt(g) <= 2 ? 'A' : parseInt(g) <= 4 ? 'B' : 'C',
      tahunPelajaran: tp,
      alokasiWaktuTiapMinggu: '3 JP / Pekan'
    },
    ganjil: makeSemesterData(1),
    genap: makeSemesterData(2),
    keterangan: 'L = Libur/MPLS/Asesmen. Angka 3 = Alokasi 3 JP pada pekan efektif KBM sesuai Buku Panduan Guru PJOK SIBI.',
    tanggalDokumen: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    kepalaSekolah: 'Soleh, S.Pd., M.Pd.',
    guruMapel: 'Guru PJOK SD Negeri Kalimantong'
  };
}

function getFallbackSlides(topic: any, grade: any, totalSlides: any, reqBody?: any) {
  const t = topic || reqBody?.topikMateri || 'Aktivitas Pola Gerak Dasar dan Kebugaran Jasmani';
  const g = grade || reqBody?.kelas || '5';
  const mp = reqBody?.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan';
  const f = reqBody?.fase || 'C';
  const count = parseInt(totalSlides || reqBody?.jumlahSlide) || 8;
  const penyusun = reqBody?.guruPenyusun || 'Guru Mata Pelajaran';
  const slides = [];

  slides.push({
    slideNo: 1,
    layoutType: 'Cover / Title Slide',
    title: t,
    points: [
      `Mata Pelajaran: ${mp}`,
      `Kelas: ${g} (Fase ${f})`,
      `Topik Utama: ${t}`,
      `Penyusun: ${penyusun}`,
      'Kurikulum Merdeka - Pembelajaran Mendalam & Menyenangkan'
    ],
    speakerNotes: `Buka sesi pembelajaran dengan mengucapkan salam hangat, perkenalkan topik "${t}", dan bangkitkan rasa antusias peserta didik dengan pertanyaan pemantik terkait pengalaman gerak mereka sehari-hari.`,
    visualRecommendation: `Background bertema olahraga dinamis dan modern dengan gradasi warna sesuai tema visual, menampilkan tipografi judul besar "${t}", ilustrasi peserta didik aktif bergerak, dan logo sekolah.`
  });

  slides.push({
    slideNo: 2,
    layoutType: 'Tujuan & Apersepsi',
    title: `Tujuan Pembelajaran: ${t}`,
    points: [
      `Memahami konsep dan variasi pola dalam ${t}`,
      `Mempraktikkan teknik dasar ${t} secara benar, aman, dan percaya diri`,
      'Menumbuhkan sikap sportivitas, disiplin, dan gotong royong dalam kelompok',
      'Mengidentifikasi manfaat gerakan bagi kebugaran tubuh'
    ],
    speakerNotes: `Jelaskan capaian pembelajaran yang harus dikuasai murid hari ini mengenai topik ${t}. Ajak murid mengamati demonstrasi singkat atau video singkat.`,
    visualRecommendation: `Grafik target panahan, ikon buku terbuka, dan diagram alur langkah pembelajaran yang komunikatif dan terstruktur rapi.`
  });

  slides.push({
    slideNo: 3,
    layoutType: 'Konsep Dasar & Pemahaman',
    title: `Konsep Dasar: ${t}`,
    points: [
      `Pengertian dan esensi dasar dari ${t}`,
      'Mengapa gerakan ini penting dilakukan dengan koordinasi tubuh yang tepat?',
      'Prinsip biomekanika sederhana: posisi tubuh, keseimbangan, dan tumpuan',
      'Contoh situasi nyata penerapan gerakan ini dalam kehidupan sehari-hari'
    ],
    speakerNotes: `Diskusikan bersama murid mengenai definisi dasar dan ajukan pertanyaan pemantik: "Siapa yang pernah mempraktikkan gerakan ini di rumah?".`,
    visualRecommendation: `Infografis anatomi gerak tubuh dengan petunjuk panah visual penanda arah gerakan dan postur yang benar.`
  });

  slides.push({
    slideNo: 4,
    layoutType: 'Tahapan & Teknik Praktik',
    title: `Tahapan Praktik: ${t}`,
    points: [
      '1. Sikap Awal: Berdiri tegak, pandangan fokus ke depan, rileks',
      `2. Gerakan Inti: Pelaksanaan teknik ${t} dengan ritme stabil`,
      '3. Sikap Akhir: Pendaratan/keseimbangan terjaga dengan aman',
      '4. Kesalahan Umum yang harus dihindari: tubuh terlalu kaku atau terburu-buru'
    ],
    speakerNotes: `Instruksikan peserta didik untuk memperhatikan peragaan 3 langkah utama pelaksanaan ${t}. Berikan penekanan pada aspek keselamatan diri.`,
    visualRecommendation: `Foto berseri 3 langkah gerakan (step-by-step) dengan highlight kotak berwarna pada tumpuan kaki dan ayunan tangan.`
  });

  for (let i = 5; i < count; i++) {
    slides.push({
      slideNo: i,
      layoutType: 'Aktivitas & Variasi Gerak',
      title: `Eksplorasi & Variasi ${t} (Bagian ${i - 4})`,
      points: [
        `Variasi latihan berpasangan dan beregu untuk materi ${t}`,
        'Permainan pos interaktif untuk mengasah kelincahan dan koordinasi',
        'Tantangan mini: Mencapai target gerak dengan teknik yang konsisten',
        'Saling memberikan umpan balik positif antar teman kelompok'
      ],
      speakerNotes: `Bagi peserta didik ke dalam kelompok-kelompok kecil. Awasi pelaksanaan aktivitas dan berikan dorongan semangat.`,
      visualRecommendation: `Foto ilustrasi kerja sama tim di lapangan sekolah dengan layout bento box modern.`
    });
  }

  slides.push({
    slideNo: count,
    layoutType: 'Refleksi & Kuis Penutup',
    title: `Refleksi & Evaluasi: ${t}`,
    points: [
      `Kuis Singkat: Apa kunci keberhasilan dalam melakukan ${t}?`,
      'Refleksi Diri: Apa tantangan paling berkesan hari ini dan bagaimana cara mengatasinya?',
      'Kesimpulan: Nilai kebugaran, kedisiplinan, dan kerja sama yang dipelajari',
      'Pesan Penutup: "Tubuh Sehat, Pikiran Cerdas, Hati Gembira! Sampai jumpa di pertemuan berikutnya!"'
    ],
    speakerNotes: `Lakukan pendinginan bersama, pimpin refleksi pembelajaran, berikan apresiasi kepada seluruh murid, dan tutup dengan doa bersama.`,
    visualRecommendation: `Visual emoji refleksi ceria (bintang emas, medali) dan teks ucapan terima kasih berukuran proporsional.`
  });

  return {
    identitas: {
      mataPelajaran: mp,
      kelas: g,
      fase: f,
      topikMateri: t,
      jumlahSlide: String(count),
      gayaDesain: reqBody?.gayaDesain || 'Sederhana & Minimalis (Slate & Off-White)',
      tanggalDokumen: reqBody?.tanggalDokumen || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      guruPenyusun: penyusun
    },
    slides
  };
}

function parseKelasFase(gradeInput: any, faseInput?: any): { kelas: string; fase: string; kelasFaseFormatted: string } {
  let g = String(gradeInput || '1').trim();
  let f = String(faseInput || '').trim();
  const gLower = g.toLowerCase();

  if (!f) {
    if (gLower.includes('fondasi') || gLower.includes('paud') || gLower.includes('tk')) {
      f = 'Fondasi';
    } else if (gLower.includes('10') || gLower.includes('sepuluh')) {
      f = 'E';
    } else if (gLower.includes('11') || gLower.includes('12') || gLower.includes('sebelas') || gLower.includes('dua belas')) {
      f = 'F';
    } else if (gLower.includes('7') || gLower.includes('8') || gLower.includes('9') || gLower.includes('tujuh') || gLower.includes('delapan') || gLower.includes('sembilan')) {
      f = 'D';
    } else if (gLower.includes('5') || gLower.includes('6') || gLower.includes('lima') || gLower.includes('enam')) {
      f = 'C';
    } else if (gLower.includes('3') || gLower.includes('4') || gLower.includes('tiga') || gLower.includes('empat')) {
      f = 'B';
    } else if (gLower.includes('1') || gLower.includes('2') || gLower.includes('satu') || gLower.includes('dua')) {
      f = 'A';
    } else {
      f = 'D';
    }
  }

  let cleanKelas = g;
  if (!gLower.includes('kelas') && !gLower.includes('paud') && !gLower.includes('tk') && !gLower.includes('fase')) {
    cleanKelas = `Kelas ${g}`;
  }

  let cleanFase = f.startsWith('Fase') ? f : `Fase ${f}`;
  let formatted = cleanKelas.toLowerCase().includes('fase') ? cleanKelas : `${cleanKelas} / ${cleanFase}`;

  return {
    kelas: cleanKelas,
    fase: cleanFase,
    kelasFaseFormatted: formatted
  };
}

function getFallbackRPM(reqBody: any) {
  const { kelas, fase, kelasFaseFormatted } = parseKelasFase(reqBody?.grade, reqBody?.fase);
  const sibiUnit = findMatchingSibiUnit(reqBody?.grade || kelas, reqBody?.materi || reqBody?.bab);
  const m = reqBody?.materi || (sibiUnit ? sibiUnit.pokokMateri : 'Aktivitas Pola Gerak Dasar dan Kebugaran Jasmani');
  const sem = reqBody?.semester || (sibiUnit ? String(sibiUnit.semester) : '1');
  const penyusun = reqBody?.penyusun || 'Lendi Ike Hermawan, S.Pd., Gr.';
  const sekolah = reqBody?.sekolah || 'SD Negeri Kalimantong';
  const tahunAjaran = reqBody?.tahunAjaran || '2026/2027';
  const mataPelajaran = reqBody?.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
  const bab = reqBody?.bab || (sibiUnit ? `${sibiUnit.unitCode}: ${sibiUnit.unitTitle}` : `Unit 1: ${m}`);
  const countPertemuan = Math.max(1, Math.min(16, parseInt(reqBody?.jumlahPertemuan) || 2));
  const alokasiWaktu = reqBody?.alokasiWaktu || '2x40 Menit';
  const sibiWarmup = sibiUnit ? sibiUnit.pemanasanPermainan : 'Permainan Tradisional Kejar-kejaran & Menjala Ikan';
  const sibiAct1 = sibiUnit?.aktivitasPembelajaran?.[0] || `Aktivitas Pembelajaran 1: Eksplorasi gerak dasar dan teknik tumpuan ${m}`;
  const sibiAct2 = sibiUnit?.aktivitasPembelajaran?.[1] || `Aktivitas Pembelajaran 2: Latihan variasi dan kombinasi gerak ${m} secara berpasangan/berkelompok`;
  const sibiAct3 = sibiUnit?.aktivitasPembelajaran?.[2] || `Aktivitas Pembelajaran 3: Penerapan keterampilan ${m} dalam permainan sederhana yang dimodifikasi`;
  const sibiSource = sibiUnit?.sumberBukuSibi || 'Muhajir & Agus Gunawan (2022). Buku Panduan Guru PJOK SD/MI. Jakarta: Pusat Perbukuan BSKAP Kemendikdasmen RI (SIBI - buku.kemendikdasmen.go.id)';

  // Standar Capaian Pembelajaran PJOK BSKAP 046/H/KR/2025
  let cpStandar = `Peserta didik mampu menunjukkan kemampuan dalam mempraktikkan, menganalisis, dan membiasakan aktivitas ${m} secara mindful, meaningful, dan joyful sesuai fase perkembangan.`;
  if (fase.includes('Fase A')) {
    cpStandar = `Mempraktikkan keterampilan gerak fundamental dan menerapkannya dalam berbagai situasi gerak yang berbeda; mengeksplorasi berbagai strategi gerak; mengeksplorasi berbagai konsep gerak serta menyimpulkan efektivitasnya; menaati peraturan untuk menumbuhkan fair play; menerapkan strategi kolaborasi; berpartisipasi dalam aktivitas jasmani dan mengidentifikasi manfaatnya; mengenali gaya hidup aktif dan sehat; mengenali komponen makanan bergizi seimbang; serta mengenali situasi berisiko terhadap keselamatan.`;
  } else if (fase.includes('Fase B')) {
    cpStandar = `Menghaluskan keterampilan gerak fundamental dan menerapkannya dalam situasi gerak baru; menyesuaikan strategi gerak untuk mendapatkan capaian keterampilan gerak; memperagakan berbagai konsep gerak; menerapkan strategi gerak sederhana dan memecahkan masalah gerak; menerapkan peraturan untuk fair play; berpartisipasi positif dalam kelompok; mengenali faktor aktivitas menyenangkan; mengenali risiko kesehatan gaya hidup; mengidentifikasi pola makan bergizi seimbang; dan mempraktikkan penanganan cedera ringan prinsip pertolongan pertama.`;
  } else if (fase.includes('Fase C')) {
    cpStandar = `Menyesuaikan keterampilan gerak melintasi berbagai situasi gerak; mentransfer strategi gerak yang sudah dikuasai ke dalam berbagai situasi gerak yang berbeda; menginvestigasi berbagai konsep gerak untuk meningkatkan capaian keterampilan gerak; menguji efektivitas penerapan strategi gerak; merancang peraturan alternatif dan modifikasi permainan untuk mendukung fair play dan partisipasi inklusif; berpartisipasi aktif serta memprediksi faktor preferensi aktivitas jasmani; dan menerapkan pencegahan risiko kesehatan serta pertolongan pertama cedera.`;
  }

  // Generate structured LKPD (non-table) for each meeting
  const lkpdList = Array.from({ length: countPertemuan }, (_, idx) => {
    const pNum = idx + 1;
    return {
      pertemuan: `Pertemuan ${pNum}`,
      title: `LKPD Pertemuan ${pNum} (SIBI): Eksplorasi & Aplikasi Pembelajaran Mendalam - ${m}`,
      content: `LEMBAR KERJA PESERTA DIDIK (LKPD) - PERTEMUAN ${pNum}
Acuan Buku Panduan Guru SIBI: ${sibiSource}
Unit / Bab: ${bab}
Topik: ${m}

1. IDENTITAS DIRI
Nama Peserta Didik : .....................................................
Mata Pelajaran     : ${mataPelajaran}
No. Absen / Kelas  : .......... / ${kelasFaseFormatted}
Hari / Tanggal     : .....................................................

2. PETUNJUK PENGGUNAAN LKPD
a. Bacalah setiap instruksi dan studi kasus sesuai Lembar Kegiatan Siswa pada Buku Panduan Guru PJOK SIBI dengan cermat.
b. Siapkan alat tulis dan perlengkapan aktivitas gerak yang diperlukan.
c. Kerjakan tugas secara mandiri atau diskusikan bersama anggota kelompokmu secara sportif dan saling menghargai.
d. Tuliskan jawabanmu dengan jelas dan rapi pada ruang pengerjaan yang telah disediakan di bawah ini.

3. SINTAKS PEMBELAJARAN & AKTIVITAS SISWA (BUKU PANDUAN GURU SIBI)
Model Pembelajaran: Problem-Based Learning (PBL) & Teaching Games for Understanding (TGfU)
- Pemanasan Permainan Kecil: ${sibiWarmup}.
- ${sibiAct1}.
- ${sibiAct2}.
- ${sibiAct3}.
- Pendinginan, Evaluasi & Refleksi Ketercapaian Gerak.

4. PENGALAMAN BELAJAR MENDALAM

A. MEMAHAMI (Mindful Learning)
Stimulus Materi (Buku Panduan Guru PJOK SIBI):
"Aktivitas ${m} pada ${bab} membutuhkan kesadaran penuh terhadap koordinasi anggota tubuh, keseimbangan, serta pengaturan ritme pernapasan yang teratur. Melakukan teknik gerakan yang benar sesuai tahapan Aktivitas Pembelajaran 1, 2, dan 3 pada Buku SIBI tidak hanya membuat gerakan lebih efektif, tetapi juga melindungi tubuh kita dari risiko cedera otot dan persendian."

Pertanyaan Pemahaman:
1) Berdasarkan pengamatanmu, mengapa posisi awal tubuh dan tumpuan kaki sangat menentukan keberhasilan gerakan ${m}?
   Jawaban:
   ....................................................................................................................................................
   ....................................................................................................................................................

2) Sebutkan 2 (dua) kesalahan yang sering terjadi saat mempraktikkan gerakan ini dan bagaimana cara memperbaikinya!
   Jawaban:
   ....................................................................................................................................................
   ....................................................................................................................................................

3) Bagaimana kaitan antara aktivitas fisik ini dengan peningkatan daya tahan jantung serta kesehatan tubuhmu sehari-hari?
   Jawaban:
   ....................................................................................................................................................
   ....................................................................................................................................................

B. MENGAPLIKASIKAN (Meaningful & Joyful Learning)
Tugas Kasus Nyata Kontekstual:
"Bayangkan kelompokmu sedang mempraktikkan ${sibiAct3}. Jika ada temanmu yang kesulitan menjaga keseimbangan atau koordinasi gerak, strategi kolaborasi apa yang akan kelompokmu rancang agar semua anggota berhasil menuntaskan tantangan tersebut secara kompak dan sportif?"

Instruksi Pengerjaan:
1. Diskusikan pembagian peran dan strategi pelaksanaan gerakan bersama kelompokmu.
2. Ujilah strategi tersebut sebanyak 2 kali putaran latihan.
3. Tuliskan alur strategi kelompok dan solusi untuk teman yang mengalami kesulitan pada ruang di bawah ini!

Ruang Jawaban / Hasil Kerja Siswa:
....................................................................................................................................................
....................................................................................................................................................
....................................................................................................................................................
....................................................................................................................................................
....................................................................................................................................................

C. MEREFLEKSIKAN (Reflective Thinking)
Jawablah pertanyaan refleksi berikut dengan jujur sesuai pengalaman belajarmu:
1) Hal baru dan paling berharga apa yang berhasil kamu pahami setelah mengikuti aktivitas pembelajaran hari ini?
   Jawaban: .......................................................................................................................................
2) Bagian mana dari aktivitas ini yang paling menantang bagimu, dan bagaimana caramu mengatasinya?
   Jawaban: .......................................................................................................................................
3) Nilai karakter apa (misal: sportivitas, gotong royong, kemandirian) yang paling kamu rasakan berkembang pada dirimu hari ini?
   Jawaban: .......................................................................................................................................

5. BAGIAN PENUTUP
Pesan Penyemangat:
"Hebat! Kamu telah menunjukkan kerja keras, sportivitas, dan kesadaran diri yang luar biasa hari ini sesuai panduan PJOK SIBI. Teruslah bergerak aktif dan jaga kesehatan tubuhmu!"

Cek Pemahaman Diri (Checklist Mandiri Buku SIBI):
[  ] Saya sudah memahami konsep dasar dan urutan teknik gerakan (${sibiAct1}) dengan benar.
[  ] Saya mampu mempraktikkan gerakan secara berpasangan/berkelompok (${sibiAct2}).
[  ] Saya aktif berkolaborasi dan menjunjung fair play dalam permainan modifikasi (${sibiAct3}).
[  ] Saya merasakan manfaat langsung aktivitas fisik ini bagi kebugaran tubuh saya.

Catatan / Umpan Balik Guru:
....................................................................................................................................................
....................................................................................................................................................`
    };
  });

  return {
    title: 'PERENCANAAN PEMBELAJARAN MENDALAM (SESUAI BUKU PANDUAN GURU PJOK SIBI)',
    identitas: {
      penyusun,
      sekolah,
      tahunAjaran,
      semester: `${sem} (${sem === '1' ? 'Ganjil' : 'Genap'})`,
      mataPelajaran,
      kelasFase: kelasFaseFormatted,
      kelas,
      fase,
      topikElemen: `${bab} / ${m}`,
      bab,
      topik: m,
      alokasiWaktu,
      jumlahPertemuan: countPertemuan
    },
    identifikasi: {
      muridOps: `Identifikasi kesiapan murid sebelum belajar (Acuan Buku Panduan Guru PJOK SIBI):
1. Pengetahuan Awal: Sebagian besar murid telah mengenal bentuk dasar aktivitas fisik terkait ${m}, namun sebagian lainnya masih memerlukan bimbingan dalam penguasaan teknik koordinasi yang tepat dan aman.
2. Minat Belajar: Murid memiliki antusiasme dan minat belajar yang tinggi terhadap pemanasan permainan kecil (${sibiWarmup}) dan simulasi permainan modifikasi beregu.
3. Kebutuhan Belajar: Memerlukan diferensiasi konten berupa peragaan kartu tugas (task sheet) Buku SIBI, diferensiasi proses melalui tahapan Aktivitas Pembelajaran 1, 2, dan 3 secara bertahap dari mudah ke kompleks, serta diferensiasi produk berupa unjuk kerja dan lembar refleksi mandiri.`,
      materiPelajaranOps: `Analisis materi pelajaran berdasarkan Buku Panduan Guru PJOK SIBI (${sibiSource}):
1. Faktual: Bentuk nyata, variasi gerakan, dan contoh konkret pengaplikasian aktivitas ${m} dalam olahraga dan kehidupan sehari-hari.
2. Konseptual: Konsep mekanika gerak dasar, pentingnya keseimbangan, koordinasi motorik, dan pengaruh aktivitas fisik terhadap kesehatan jantung serta otot.
3. Prosedural: Urutan tahapan gerakan ${m} sesuai Buku SIBI: (a) ${sibiAct1}; (b) ${sibiAct2}; (c) ${sibiAct3}.
4. Metakognitif: Kesadaran murid dalam mengenali batas kemampuan fisik diri, memantau ritme pernapasan, serta mengevaluasi dan memperbaiki kekeliruan gerak sendiri.`,
      dimensiProfilLulusan: [
        'DPL1 Keimanan dan Ketakwaan terhadap Tuhan YME',
        'DPL3 Penalaran Kritis',
        'DPL4 Kreativitas',
        'DPL5 Kolaborasi',
        'DPL6 Kemandirian',
        'DPL7 Kesehatan',
        'DPL8 Komunikasi'
      ],
      identifikasiMurid: `Pengetahuan Awal: Pemahaman awal konsep gerak dasar dan kebiasaan beraktivitas.\nMinat Belajar: Antusiasme tinggi pada pemanasan permainan kecil (${sibiWarmup}) dan aktivitas gerak fisik beregu.\nKebutuhan Belajar: Diferensiasi visual, auditori, dan kinestetik bertahap sesuai Buku Panduan Guru PJOK SIBI.`,
      materiPelajaran: `Faktual (ragam bentuk gerak nyata), Konseptual (prinsip kebugaran dan koordinasi tubuh), Prosedural (${sibiAct1}; ${sibiAct2}; ${sibiAct3}), Metakognitif (evaluasi diri dan pengendalian stamina tubuh).`
    },
    desainPembelajaran: {
      capaianPembelajaranOps: cpStandar,
      lintasDisiplinIlmuOps: `IPAS (Sistem peredaran darah, pernapasan, dan struktur anatomi otot tulang), Bahasa Indonesia (Komunikasi santun dalam berdiskusi dan menyampaikan instruksi), Pendidikan Pancasila (Sportivitas, kerja sama, saling menghargai perbedaan fisik, dan taat aturan).`,
      tujuanPembelajaran: sibiUnit?.tujuanPembelajaran
        ? sibiUnit.tujuanPembelajaran.map((tp, idx) => `${idx + 1}. ${tp}`).join('\n')
        : `1. Peserta didik dapat menganalisis konsep dan prosedur pelaksanaan aktivitas ${m} secara tepat dengan tingkat kesadaran sensori tubuh yang baik (Level Kognitif: Menganalisis/C4).\n2. Peserta didik dapat mempraktikkan keterampilan gerak ${m} dalam bentuk tantangan kelompok secara terkoordinasi, disiplin, dan aman (Level Kognitif: Menerapkan/C3).\n3. Peserta didik dapat merefleksikan proses belajar serta menyimpulkan efektivitas strategi gerak dan manfaatnya bagi kebugaran tubuh sehari-hari (Level Kognitif: Merefleksi/C5).`,
      topikPembelajaranOps: `${bab} — ${m}`,
      praktikPedagogis: `Pendekatan: Pembelajaran Mendalam (Deep Learning) berorientasi Berkesadaran (Mindful), Bermakna (Meaningful), dan Menggembirakan (Joyful) terintegrasi Buku Panduan Guru PJOK SIBI.
Model: Pembelajaran Berbasis Masalah (Problem-Based Learning) & Teaching Games for Understanding (TGfU)
Sintaks Model: 1. Orientasi masalah & pengenalan konsep gerak; 2. Pengorganisasian belajar & pemanasan permainan kecil; 3. Penyelidikan mandiri & kelompok (Aktivitas Pembelajaran 1 & 2 Buku SIBI); 4. Pengembangan & aplikasi permainan modifikasi (Aktivitas Pembelajaran 3 Buku SIBI); 5. Analisis, pendinginan & evaluasi pemecahan masalah.
Metode: Demonstrasi interaktif, permainan pemanasan (${sibiWarmup}), latihan berpasangan/stasiun berputar, permainan modifikasi, dan refleksi dialogis.
Sumber Utama: ${sibiSource}`,
      kemitraanPembelajaranOps: `Tutor sebaya (peserta didik mahir mendampingi teman), kolaborasi guru mata pelajaran serumpun, serta pelibatan orang tua dalam membiasakan gaya hidup aktif dan pola makan sehat di rumah.`,
      lingkunganPembelajaran: `Pemanfaatan ruang terbuka / lapangan olahraga yang bersih, aman, dan kondusif dengan iklim kelas yang menjunjung empati, saling mendukung, dan bebas perundungan.`,
      pemanfaatanDigitalOps: `Pemanfaatan Buku Teks / Panduan Guru Digital dari platform SIBI Kemendikdasmen (https://buku.kemendikdasmen.go.id), video peragaan gerak slow-motion, dan stopwatch digital.`,
      capaianPembelajaran: cpStandar,
      lintasDisiplinIlmu: `IPAS, Bahasa Indonesia, Pendidikan Pancasila`,
      topikPembelajaran: `${bab} — ${m}`,
      kemitraanPembelajaran: `Tutor sebaya, guru bidang studi, orang tua murid`,
      pemanfaatanDigital: `Platform Buku Digital SIBI (buku.kemendikdasmen.go.id) & video peragaan gerak`
    },
    pengalamanBelajar: {
      langkahPembelajaran: {
        awalOps: {
          prinsip: 'Berkesadaran (Mindful) dan Menggembirakan (Joyful)',
          deskripsi: `Kegiatan awal durasi 15 menit berorientasi membangun keterhubungan mental, memeriksa kondisi fisik, dan pemanasan permainan kecil sesuai Buku SIBI (${sibiWarmup}).`
        },
        inti: {
          prinsipUmum: 'Kegiatan inti durasi 60 menit menerapkan prinsip mindful, meaningful, dan joyful agar murid aktif menggali makna dari materi melalui tahapan Memahami (Aktivitas 1 SIBI), Mengaplikasikan (Aktivitas 2 & 3 SIBI), dan Merefleksi.',
          memahami: {
            prinsip: 'Mindful & Meaningful (Orientasi Masalah & Aktivitas Pembelajaran 1 SIBI) (15 Menit)',
            kegiatan: [
              `Guru mengajak peserta didik mengamati kartu tugas (task sheet) dari Buku Panduan Guru PJOK SIBI serta demonstrasi langsung tentang ${sibiAct1} secara berkesadaran (Penalaran Kritis).`,
              `Peserta didik mengajukan pertanyaan pemantik mengenai teknik posisi awal, tumpuan kaki, dan cara menjaga keseimbangan tubuh yang efektif (Penalaran Kritis, Komunikasi).`,
              `Guru membagi peserta didik ke dalam kelompok kecil heterogen (4-5 murid) dan membagikan LKPD aktivitas gerak (Kolaborasi).`,
              `Peserta didik mencoba eksplorasi gerak awal (${sibiAct1}) sambil mengidentifikasi kunci keberhasilan gerak bersama kelompok (Kolaborasi, Penalaran Kritis).`
            ]
          },
          mengaplikasi: {
            prinsip: 'Meaningful & Joyful (Aktivitas Pembelajaran 2 & 3 Buku SIBI) (30 Menit)',
            kegiatan: [
              `Peserta didik secara berpasangan dan berkelompok mempraktikkan ${sibiAct2} melalui pos-pos latihan bergradasi dengan penuh antusiasme (Kolaborasi, Kesehatan).`,
              `Setiap anggota kelompok saling mengamati, memberikan aba-aba hitungan, dan mengoreksi teknik gerakan teman secara santun dan sportif (Komunikasi, Kolaborasi).`,
              `Peserta didik menerapkan keterampilan gerak dalam ${sibiAct3} dengan mengutamakan keselamatan diri, rekan kelompok, dan peraturan fair play (Kemandirian, Kesehatan).`,
              `Kelompok menyelesaikan tugas studi kasus kontekstual pada LKPD berdasarkan pengalaman praktik permainan modifikasi secara riang gembira (Kreativitas, Kesehatan).`
            ]
          },
          merefleksi: {
            prinsip: 'Mindful & Meaningful (Penyajian & Refleksi Solusi Buku SIBI) (15 Menit)',
            kegiatan: [
              `Setiap kelompok memperagakan kombinasi gerakan terbaik yang telah dilatih di hadapan kelompok lain dengan rasa percaya diri (Kemandirian, Komunikasi).`,
              `Kelompok lain memberikan tanggapan apresiatif dan masukan konstruktif terhadap peragaan teknik gerak temannya (Penalaran Kritis, Komunikasi).`,
              `Guru bersama peserta didik mengevaluasi kendala gerak yang dihadapi selama Aktivitas Pembelajaran 1, 2, dan 3 serta menemukan solusi perbaikan bersama (Penalaran Kritis, Kesehatan).`,
              `Peserta didik menuliskan kesimpulan refleksi pribadi pada lembar kerja mengenai makna kebugaran, nilai mandiri, dan gotong royong yang dipelajari (Kemandirian, Kesehatan).`
            ]
          }
        },
        penutupOps: {
          prinsip: 'Berkesadaran (Mindful) dan Bermakna (Meaningful)',
          deskripsi: 'Kegiatan penutup durasi 5 menit mencakup pendinginan (cooling down) relaksasi sesuai Buku SIBI, penarikan kesimpulan bersama, umpan balik konstruktif guru, rencana tindak lanjut, serta doa dan salam.'
        }
      },
      kegiatanAwal: `Prinsip Pembelajaran: Berkesadaran (Mindful) dan Menggembirakan (Joyful). Durasi: 15 Menit.
1. Guru membuka pembelajaran di lapangan dengan mengucap salam hangat dan menyapa seluruh peserta didik dengan ramah.
2. Guru memandu peserta didik berdoa bersama dipimpin oleh ketua kelas untuk menumbuhkan keimanan (Keimanan dan Ketakwaan terhadap TYME).
3. Guru mengecek kehadiran, memeriksa kerapian seragam olahraga, serta memastikan kondisi kesehatan fisik setiap peserta didik (Kesehatan).
4. Guru melakukan apersepsi kontekstual sesuai Buku Panduan Guru PJOK SIBI melalui tanya jawab singkat tentang pengalaman gerak murid dan menyampaikan Tujuan Pembelajaran (Komunikasi).
5. Guru memandu pemanasan dinamis yang dikemas dalam bentuk permainan kecil sesuai Buku Panduan Guru SIBI yaitu: ${sibiWarmup} dengan riang gembira (Kesehatan, Kolaborasi).`,
      kegiatanInti: `Prinsip Pembelajaran: Mindful (Berkesadaran), Meaningful (Bermakna), dan Joyful (Menggembirakan). Durasi: 60 Menit.

Memahami (Sintaks Orientasi Masalah & Aktivitas Pembelajaran 1 Buku SIBI) (15 Menit)
1. Guru memperagakan demonstrasi langsung dan kartu tugas Buku Panduan Guru PJOK SIBI untuk ${sibiAct1}, lalu murid mengamati secara saksama dengan penuh konsentrasi (Penalaran Kritis).
2. Murid mengajukan pertanyaan pemantik mengenai posisi tumpuan, keseimbangan tubuh, dan kesalahan umum yang sering muncul (Penalaran Kritis, Komunikasi).
3. Guru mengorganisasikan murid ke dalam kelompok kecil heterogen (4-5 murid) dan membagikan Lembar Kerja Peserta Didik (LKPD) (Kolaborasi).
4. Murid dalam kelompok mencoba eksplorasi gerak dasar (${sibiAct1}) dan mengidentifikasi kunci keberhasilan teknik gerak secara adil (Kolaborasi, Kemandirian).

Mengaplikasikan (Sintaks Penyelidikan Kelompok & Aktivitas Pembelajaran 2 & 3 Buku SIBI) (30 Menit)
1. Setiap kelompok mempraktikkan ${sibiAct2} secara bertahap pada pos latihan yang telah disiapkan guru (Kolaborasi, Kesehatan).
2. Murid saling mengamati, memberikan aba-aba hitungan, dan melakukan koreksi gerak antarteman secara santun dan sportif (Komunikasi, Kolaborasi).
3. Murid menerapkan variasi dan kombinasi gerak melalui ${sibiAct3} dengan mematuhi peraturan fair play serta menjaga keselamatan bersama (Kemandirian, Kesehatan).
4. Setiap kelompok menyelesaikan penugasan studi kasus pada LKPD secara disiplin dan penuh kegembiraan (Kreativitas, Kesehatan).

Merefleksi (Sintaks Penyajian Hasil & Evaluasi Proses Buku SIBI) (15 Menit)
1. Setiap kelompok memperagakan hasil latihan variasi gerakan terbaik mereka di depan kelompok lain dengan rasa bangga dan percaya diri (Kemandirian, Komunikasi).
2. Kelompok lain mengamati dengan saksama dan memberikan apresiasi serta masukan konstruktif berdasarkan kriteria unjuk kerja Buku SIBI (Penalaran Kritis, Komunikasi).
3. Murid bersama guru mengevaluasi hambatan fisik dan koordinasi yang dirasakan selama Aktivitas Pembelajaran 1, 2, dan 3 serta mendiskusikan solusinya (Penalaran Kritis, Kesehatan).
4. Murid menuliskan poin refleksi pribadi pada lembar kerja mengenai makna kebugaran jasmani dan kerja sama tim yang telah dialami (Kemandirian, Kesehatan).`,
      kegiatanPenutup: `Prinsip Pembelajaran: Berkesadaran (Mindful) dan Bermakna (Meaningful). Durasi: 5 Menit.
1. Guru memandu peserta didik melakukan pendinginan (cooling down) dan peregangan pasif disertai olah napas teratur untuk merilekskan otot dan menurunkan denyut nadi sesuai Buku Panduan Guru SIBI (Kesehatan).
2. Guru bersama peserta didik menyimpulkan intisari materi pembelajaran (${bab}) dan mengaitkannya dengan kebiasaan hidup sehat sehari-hari (Penalaran Kritis).
3. Guru memberikan apresiasi terhadap partisipasi aktif serta sportivitas seluruh kelompok, lalu menyampaikan rencana pembelajaran untuk pertemuan berikutnya.
4. Guru mengajak seluruh peserta didik berdoa bersama mengucap syukur, kemudian menutup pembelajaran dengan mengucap salam penutup yang dijawab santun oleh murid.`
    },
    asesmenPembelajaran: {
      awal: 'Jenis: Asesmen Diagnostik (Kognitif & Non-Kognitif). Bentuk: Tanya Jawab Lisan & 5 Butir Pertanyaan Singkat. Teknik: Cek kesiapan belajar fisik dan uji pemahaman awal materi.',
      proses: 'Jenis: Asesmen Formatif. Bentuk: Lembar Observasi Kinerja Praktik & Rubrik Diskusi Kelompok. Teknik: Pengamatan unjuk kerja gerak berkelanjutan, penilaian sikap (DPL), dan penilaian performa LKPD.',
      akhir: 'Jenis: Asesmen Sumatif Lingkup Materi. Bentuk: Tes Unjuk Kerja Keterampilan Gerak & Tes Tertulis Pemahaman. Teknik: Uji performa keterampilan mandiri/beregu dan portofolio refleksi diri.'
    },
    tandaTangan: {
      tempatTanggal: 'Jember, 1 Juli 2025',
      kepalaSekolah: {
        nama: 'Soleh, S.Pd., M.Pd.',
        nip: 'NIP. 19750512 200003 1 004'
      },
      guruMapel: {
        nama: penyusun,
        nip: 'NIP. ........................................'
      }
    },
    lampiran: {
      soalAsesmenAwalList: [
        {
          no: 1,
          pertanyaan: `Apa yang kamu ketahui tentang konsep dan manfaat dari aktivitas ${m}?`,
          kunciJawaban: `Aktivitas fisik yang melatih koordinasi dan kekuatan tubuh untuk meningkatkan kebugaran jasmani dan menjaga kesehatan organ vital.`
        },
        {
          no: 2,
          pertanyaan: 'Mengapa kita wajib melakukan pemanasan (warm-up) sebelum melakukan latihan fisik inti?',
          kunciJawaban: 'Untuk meningkatkan suhu tubuh, memperlancar sirkulasi darah, melenturkan otot dan sendi, serta mencegah terjadinya cedera.'
        },
        {
          no: 3,
          pertanyaan: 'Sebutkan bagian tubuh atau otot utama yang paling aktif bekerja pada saat melakukan gerakan ini!',
          kunciJawaban: 'Otot tungkai/kaki, otot lengan dan bahu, serta otot inti tubuh (core muscles) yang berperan menjaga keseimbangan.'
        },
        {
          no: 4,
          pertanyaan: 'Sikap apa yang harus kamu utamakan saat berlatih mempraktikkan gerakan bersama teman satu kelompok?',
          kunciJawaban: 'Sikap sportivitas, saling menghargai kemampuan teman, bekerja sama secara kompak (kolaborasi), dan menjaga keselamatan bersama.'
        },
        {
          no: 5,
          pertanyaan: 'Bagaimana cara mengatur pernapasan yang tepat saat melakukan aktivitas fisik yang membutuhkan tenaga?',
          kunciJawaban: 'Menghirup napas teratur melalui hidung dan menghembuskannya secara terkontrol melalui mulut tanpa menahan napas.'
        }
      ],
      rubrikSikap: {
        dimensiTerpilih: ['Penalaran Kritis', 'Kolaborasi', 'Kesehatan', 'Kemandirian'],
        aspekList: [
          {
            dimensi: 'Penalaran Kritis',
            indikator: 'Mengidentifikasi kunci keberhasilan gerak dan menganalisis kesalahan teknik.',
            skor4: 'Sangat kritis, mampu menganalisis kesalahan dan memberikan solusi perbaikan dengan tepat.',
            skor3: 'Cukup kritis, mampu menunjukkan kekeliruan gerak dan memahami langkah perbaikan.',
            skor2: 'Mulai menunjukkan pemikiran kritis namun masih membutuhkan bimbingan guru.',
            skor1: 'Belum mampu menganalisis kesalahan gerak atau memberikan tanggapan.'
          },
          {
            dimensi: 'Kolaborasi',
            indikator: 'Bekerja sama, berbagi peran aktif, dan saling membantu dalam latihan kelompok.',
            skor4: 'Selalu aktif bekerja sama, suportif membantu teman, dan berbagi peran secara adil.',
            skor3: 'Sering bekerja sama dengan baik dan bersedia membantu rekan satu kelompok.',
            skor2: 'Kadang-kadang bekerja sama, cenderung pasif jika tidak diarahkan.',
            skor1: 'Tidak mau bekerja sama atau mengganggu keterlaksanaan tugas kelompok.'
          },
          {
            dimensi: 'Kesehatan',
            indikator: 'Menjaga keselamatan diri, mengenakan seragam rapi, dan mempraktikkan gaya hidup aktif.',
            skor4: 'Sangat peduli keselamatan diri & teman, hidrasi teratur, dan menerapkan pemanasan/pendinginan optimal.',
            skor3: 'Peduli keselamatan, mematuhi instruksi pemanasan dan pendinginan dengan baik.',
            skor2: 'Kurang memperhatikan keselamatan, kadang mengabaikan arahan pendinginan.',
            skor1: 'Melakukan tindakan berbahaya yang berisiko cedera bagi diri sendiri atau teman.'
          },
          {
            dimensi: 'Kemandirian',
            indikator: 'Bertanggung jawab atas tugas gerak mandiri dan percaya diri menampilkan kemampuan.',
            skor4: 'Sangat mandiri, berinisiatif tinggi berlatih, dan sangat percaya diri memperagakan gerakan.',
            skor3: 'Mandiri menyelesaikan latihan, percaya diri dan bertanggung jawab atas tugasnya.',
            skor2: 'Memerlukan dorongan guru untuk memulai latihan dan kurang percaya diri.',
            skor1: 'Tidak menunjukkan kemandirian dan enggan mencoba gerakan.'
          }
        ]
      },
      penilaianPengetahuan: {
        judul: 'Rubrik Penilaian Pengetahuan (Pengerjaan LKPD & Pemahaman Konsep)',
        aspekList: [
          'Kelengkapan Jawaban',
          'Ketepatan Konsep Materi',
          'Penyajian Analisis Strategi',
          'Kedalaman Refleksi Diri'
        ],
        pedomanSkor: [
          {
            aspek: 'Kelengkapan Jawaban',
            skor4: 'Semua pertanyaan pemahaman dan studi kasus pada LKPD dijawab tuntas dan lengkap.',
            skor3: 'Sebagian besar pertanyaan dijawab dengan lengkap dan sesuai instruksi.',
            skor2: 'Hanya separuh pertanyaan yang dijawab, beberapa bagian dibiarkan kosong.',
            skor1: 'Hampir seluruh lembar jawaban kosong atau tidak diisi.'
          },
          {
            aspek: 'Ketepatan Konsep Materi',
            skor4: 'Seluruh penjelasan konsep gerak dan fungsi kesehatan sangat tepat dan akurat.',
            skor3: 'Konsep materi dijelaskan dengan benar, hanya ada 1 kekeliruan kecil.',
            skor2: 'Beberapa penjelasan konsep masih keliru atau rancu.',
            skor1: 'Penjelasan konsep salah seluruhnya dan tidak sesuai materi.'
          },
          {
            aspek: 'Penyajian Analisis Strategi',
            skor4: 'Strategi pemecahan masalah disajikan secara logis, aplikatif, dan kontekstual.',
            skor3: 'Strategi yang diajukan cukup logis dan dapat diterapkan dalam latihan.',
            skor2: 'Strategi kurang terstruktur dan sulit diterapkan.',
            skor1: 'Tidak ada strategi yang disajikan atau tidak logis.'
          },
          {
            aspek: 'Kedalaman Refleksi Diri',
            skor4: 'Memberikan refleksi yang mendalam, jujur, dan menunjukkan kesadaran diri tinggi.',
            skor3: 'Memberikan jawaban reflektif yang cukup jelas dan bermakna.',
            skor2: 'Jawaban refleksi masih sangat umum dan singkat.',
            skor1: 'Tidak mengisi refleksi atau jawaban tidak relevan.'
          }
        ],
        rumusNilai: 'Nilai Akhir = (Jumlah Skor Diperoleh / 16) × 100'
      },
      penilaianKeterampilan: {
        judul: 'Rubrik Penilaian Keterampilan Unjuk Kerja Praktik Gerak',
        aspekList: [
          'Teknik Sikap Awalan & Tumpuan',
          'Koordinasi Fase Gerakan Inti',
          'Sikap Akhir & Keseimbangan',
          'Penerapan Nilai Sportivitas & Kerjasama'
        ],
        pedomanSkor: [
          {
            aspek: 'Teknik Sikap Awalan & Tumpuan',
            skor4: 'Sikap awalan tubuh seimbang, posisi kaki/tumpuan sangat akurat dan mantap.',
            skor3: 'Sikap awalan cukup baik dan seimbang, tumpuan tepat.',
            skor2: 'Sikap awalan kurang seimbang, posisi tumpuan masih sering keliru.',
            skor1: 'Sikap awalan salah total dan tidak menunjukkan kesiapan gerak.'
          },
          {
            aspek: 'Koordinasi Fase Gerakan Inti',
            skor4: 'Gerakan mengalir luwes, irama gerak terkoordinasi sempurna, dan bertenaga.',
            skor3: 'Gerakan inti cukup terkoordinasi dengan baik, teknik sesuai tahapan.',
            skor2: 'Gerakan inti kaku atau terputus-putus, koordinasi kurang harmonis.',
            skor1: 'Tidak mampu melakukan koordinasi gerakan inti dengan benar.'
          },
          {
            aspek: 'Sikap Akhir & Keseimbangan',
            skor4: 'Pendaratan/posisi akhir sangat stabil, terkontrol, dan aman dari cedera.',
            skor3: 'Posisi akhir stabil dan terkontrol dengan baik.',
            skor2: 'Posisi akhir goyah, hampir kehilangan keseimbangan tubuh.',
            skor1: 'Kehilangan keseimbangan sepenuhnya atau terjatuh.'
          },
          {
            aspek: 'Penerapan Nilai Sportivitas & Kerjasama',
            skor4: 'Sangat sportif, mematuhi semua aturan permainan, dan aktif menyemangati teman.',
            skor3: 'Sportif, menghargai aturan dan bekerja sama dengan baik bersama kelompok.',
            skor2: 'Kurang sportif dalam permainan atau sesekali melanggar aturan.',
            skor1: 'Tidak sportif, bersikap curang, atau menolak mengikuti aturan.'
          }
        ],
        rumusNilai: 'Nilai Akhir = (Jumlah Skor Diperoleh / 16) × 100'
      },
      materiAjarRingkas: `RINGKASAN MATERI AJAR: ${m.toUpperCase()}
1. Pengertian & Konsep Dasar:
   ${m} merupakan bagian integral dari aktivitas kebugaran jasmani yang bertujuan meningkatkan keterampilan koordinasi, kekuatan otot, kelenturan, serta kesadaran ruang dan tubuh (kinestetik).
2. Manfaat bagi Kebugaran Jasmani:
   - Meningkatkan daya tahan jantung dan paru-paru (kardiorespirasi).
   - Memperkuat struktur tulang dan melatih elastisitas persendian.
   - Membantu mempertahankan postur tubuh yang ideal dan proporsional.
   - Mengurangi rasa lelah serta meningkatkan konsentrasi belajar di kelas.
3. Prinsip Keselamatan Gerak (Safety First):
   - Wajib melakukan pemanasan terarah selama 10-15 menit sebelum aktivitas intens.
   - Perhatikan posisi tumpuan kaki dan pendaratan agar tidak mencederai sendi lutut atau pergelangan kaki.
   - Penuhi kebutuhan cairan tubuh (minum air putih yang cukup) saat jeda latihan.
   - Lakukan pendinginan untuk membantu pemulihan otot dan mencegah nyeri otot (DOMS).`,
      asesmenDiagnostikNonKognitif: {
        tujuan: 'Mengetahui kesiapan fisik, mental, dan emosional peserta didik sebelum belajar',
        pertanyaan: [
          { no: 1, teks: 'Bagaimana perasaanmu sebelum memulai jam pelajaran PJOK hari ini?' },
          { no: 2, teks: 'Apakah kamu sudah sarapan sehat dan membawa botol minum air putih?' },
          { no: 3, teks: 'Apakah saat ini tubuhmu terasa bugar dan siap beraktivitas di lapangan?' },
          { no: 4, teks: 'Apakah ada bagian tubuh yang terasa nyeri atau cedera hari ini?' }
        ]
      },
      asesmenFormatif: {
        keterangan: {
          diskusi: 'Melatih kemampuan berkolaborasi dalam kelompok, berani mengungkapkan ide solusi gerak, dan mendengarkan pendapat teman.',
          presentasi: 'Melatih keberanian berbicara di depan umum, memperagakan teknik gerak dengan percaya diri, dan menanggapi masukan kelompok lain.',
          unjukKerja: 'Menilai kualitas proses dan keterampilan gerak motorik yang dipraktikkan secara berkelanjutan.'
        },
        rubrikPenilaian: [
          { skor: 5, deskripsi: 'Sangat aktif berkontribusi dalam diskusi & peragaan, teknik gerak sangat akurat, komunikatif, dan sangat konsisten.' },
          { skor: 4, deskripsi: 'Aktif berdiskusi dan berlatih, mampu memperagakan gerak dengan baik, keterampilan gerak terlihat berkembang.' },
          { skor: 3, deskripsi: 'Cukup aktif, berpartisipasi saat diarahkan, keterampilan dasar mulai tampak konsisten.' },
          { skor: 2, deskripsi: 'Kurang aktif, pasif dalam kelompok, teknik gerak masih sering keliru.' },
          { skor: 1, deskripsi: 'Tidak menunjukkan partisipasi, tidak menguasai gerakan, enggan mencoba.' }
        ]
      },
      penilaianSikap: {
        spiritual: {
          teknik: 'Penilaian Diri',
          instrumen: 'Lembar Ceklis Sikap Spiritual',
          indikator: [
            'Berdoa sebelum dan sesudah memulai aktivitas pembelajaran dengan khusyuk',
            'Menunjukkan rasa syukur atas kesehatan dan kebugaran tubuh yang dianugerahkan Tuhan',
            'Menunjukkan empati, kasih sayang, dan sikap saling tolong-menolong antarteman',
            'Menjaga sportivitas dan kejujuran dalam setiap permainan'
          ]
        },
        sosial: {
          teknik: 'Penilaian Antarteman',
          instrumen: 'Lembar Ceklis Sikap Sosial',
          indikator: [
            'Mampu berkomunikasi dengan santun dan positif saat berdiskusi',
            'Bekerja sama secara aktif dan berbagi tugas merata dalam kelompok',
            'Menghargai keberagaman kemampuan fisik dan pendapat teman',
            'Peduli terhadap kebersihan lingkungan lapangan dan keselamatan sarana alat'
          ]
        },
        keterangan: `SL = Selalu : sangat baik (4)\nSR = Sering : baik (3)\nKD = Kadang-kadang : cukup (2)\nTP = Tidak Pernah : perlu bimbingan (1)`,
        rumusNilai: 'Nilai Akhir = (Jumlah skor diperoleh / 16) × 100'
      },
      pengayaanDanRemedial: {
        remedial: {
          tujuan: `Membantu peserta didik yang belum mencapai ketuntasan kompetensi gerak pada materi ${m}.`,
          strategi: [
            {
              nama: 'Pendekatan Kontekstual & Visual',
              deskripsi: 'Memberikan demonstrasi ulang gerakan dalam tempo lambat dengan bantuan video slow-motion.'
            },
            {
              nama: 'Bimbingan Bertahap (Scaffolding)',
              deskripsi: 'Memecah tahapan gerakan menjadi segmen-segmen lebih sederhana sebelum menggabungkannya.'
            },
            {
              nama: 'Tutor Sebaya',
              deskripsi: 'Memasangkan murid yang kesulitan dengan teman sekelas yang sudah mahir untuk berlatih berpasangan.'
            }
          ]
        },
        pengayaan: {
          tujuan: 'Memberikan tantangan perluasan keterampilan dan kepemimpinan bagi peserta didik berkemampuan tinggi.',
          strategi: [
            {
              nama: 'Kreasi Variasi Permainan',
              deskripsi: 'Menugaskan murid merancang 2 variasi tantangan permainan mini baru yang lebih dinamis.'
            },
            {
              nama: 'Peran Wasit & Asisten Pengamat',
              deskripsi: 'Memberi kesempatan menjadi pemimpin tim atau pengamat catatan unjuk kerja teman.'
            }
          ]
        }
      },
      refleksi: {
        guru: [
          {
            no: 1,
            aspek: 'Penguasaan Materi',
            refleksiGuru: 'Apakah pendekatan Mindful, Meaningful, dan Joyful terlaksana secara efektif?',
            jawaban: ''
          },
          {
            no: 2,
            aspek: 'Keterlibatan Murid',
            refleksiGuru: 'Apakah seluruh murid aktif berpartisipasi tanpa ada yang merasa minder atau terpinggirkan?',
            jawaban: ''
          },
          {
            no: 3,
            aspek: 'Pencapaian Tujuan',
            refleksiGuru: 'Apakah minimal 85% murid telah menguasai kompetensi gerak yang ditargetkan?',
            jawaban: ''
          }
        ],
        pesertaDidik: 'Menutup pembelajaran dengan refleksi diri menggunakan lembar ceklis jurnal refleksi mengenai pengalaman gerak dan perasaan belajar hari ini.'
      },
      soalAsesmenAkhirList: [
        {
          no: 1,
          pertanyaan: `Jelaskan analisis konsep dasar dan cara kerja teknik gerakan utama pada materi ${m}!`,
          kunciJawaban: `Memerlukan koordinasi tumpuan kaki yang stabil, ayunan anggota tubuh teratur, dan pengaturan ritme napas untuk memaksimalkan efisiensi gerak.`
        },
        {
          no: 2,
          pertanyaan: `Ketika menghadapi rintangan atau tantangan dalam simulasi aktivitas ${m}, strategi taktik apa yang paling tepat diterapkan agar tim dapat mencapai hasil optimal?`,
          kunciJawaban: `Menerapkan pembagian peran yang seimbang, komunikasi sportif yang jelas di lapangan, dan pemanfaatan ruang kosong secara cerdas.`
        },
        {
          no: 3,
          pertanyaan: `Mengapa koordinasi dan keseimbangan tubuh sangat menentukan keselamatan dan efektivitas dalam melakukan ${m}?`,
          kunciJawaban: `Karena keseimbangan menjaga pusat gravitasi tubuh agar tidak mudah goyah atau cedera saat terjadi perubahan arah gerak secara mendadak.`
        },
        {
          no: 4,
          pertanyaan: `Bagaimana penerapan nilai sportivitas dan fair play dalam aktivitas ${m} dapat mencegah terjadinya konflik antarteman?`,
          kunciJawaban: `Dengan mematuhi peraturan bersama, mengakui keunggulan kawan atau lawan secara lapang dada, dan saling memberikan dukungan positif.`
        },
        {
          no: 5,
          pertanyaan: `Sebutkan 3 dampak positif jangka panjang bagi kesehatan tubuh apabila kita konsisten mempraktikkan aktivitas gerak ${m}!`,
          kunciJawaban: `Kebugaran jantung-paru meningkat, kekuatan dan kelenturan otot terjaga, serta tubuh menjadi lebih berenergi dan tidak mudah lelah.`
        }
      ],
      asesmenAwal: `1. Asesmen Diagnostik Kognitif: 5 butir soal pemahaman awal seputar materi ${m}.\n2. Asesmen Diagnostik Non-Kognitif: Cek kesiapan emosi dan kebugaran fisik murid.`,
      asesmenProses: `1. Rubrik Penilaian Sikap (DPL) 4 Skala (Penalaran Kritis, Kolaborasi, Kesehatan, Kemandirian).\n2. Rubrik Penilaian Pengetahuan LKPD 4 Skala.\n3. Rubrik Penilaian Keterampilan Praktik Unjuk Kerja 4 Skala.`,
      asesmenAkhir: `1. Asesmen Sumatif Lingkup Materi 5 Butir Soal Pemahaman & Analisis Kontekstual.\n2. Tes Unjuk Kerja Praktik Kombinasi Gerak Mandiri / Beregu.`,
      materiAjar: `Materi Ajar Ringkas: Konsep esensial, urutan teknik pelaksanaan, analisis biomekanika sederhana, dan pembiasaan gaya hidup aktif sehat.`
    },
    lkpdList
  };
}

function getFallbackRPMSatuBab(reqBody: any) {
  const { kelas, fase, kelasFaseFormatted } = parseKelasFase(reqBody?.grade, reqBody?.fase);
  const sibiUnit = findMatchingSibiUnit(reqBody?.grade || kelas, reqBody?.materi || reqBody?.bab);
  const m = reqBody?.materi || (sibiUnit ? sibiUnit.pokokMateri : 'Aktivitas Pola Gerak Dasar dan Kebugaran Jasmani');
  const sem = reqBody?.semester || (sibiUnit ? String(sibiUnit.semester) : '1');
  const penyusun = reqBody?.penyusun || 'Lendi Ike Hermawan, S.Pd., Gr.';
  const sekolah = reqBody?.sekolah || 'SD Negeri Kalimantong';
  const tahunAjaran = reqBody?.tahunAjaran || '2026/2027';
  const mataPelajaran = reqBody?.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
  const bab = reqBody?.bab || (sibiUnit ? `${sibiUnit.unitNumber}: ${sibiUnit.unitTitle}` : `Unit 1: Penguasaan & Aplikasi ${m}`);
  const alokasiWaktu = reqBody?.alokasiWaktu || '16x40 Menit (8 Pertemuan)';
  const sibiAct1 = sibiUnit?.aktivitasPembelajaran?.[0] || `Aktivitas Pembelajaran 1: Eksplorasi gerak dasar ${m}`;
  const sibiAct2 = sibiUnit?.aktivitasPembelajaran?.[1] || `Aktivitas Pembelajaran 2: Latihan variasi dan kombinasi gerak ${m}`;
  const sibiAct3 = sibiUnit?.aktivitasPembelajaran?.[2] || `Aktivitas Pembelajaran 3: Penerapan dalam permainan modifikasi ${m}`;

  // Standar CP BSKAP 046/H/KR/2025
  let cpStandar = `Peserta didik mampu menunjukkan kemampuan dalam mempraktikkan, menganalisis, dan membiasakan aktivitas ${m} secara mindful, meaningful, dan joyful sesuai fase perkembangan.`;
  if (fase.includes('Fase A')) {
    cpStandar = `Mempraktikkan keterampilan gerak fundamental dan menerapkannya dalam berbagai situasi gerak yang berbeda; mengeksplorasi berbagai strategi gerak; mengeksplorasi berbagai konsep gerak serta menyimpulkan efektivitasnya; menaati peraturan untuk menumbuhkan fair play; menerapkan strategi kolaborasi; berpartisipasi dalam aktivitas jasmani dan mengidentifikasi manfaatnya; mengenali gaya hidup aktif dan sehat; mengenali komponen makanan bergizi seimbang; serta mengenali situasi berisiko terhadap keselamatan.`;
  } else if (fase.includes('Fase B')) {
    cpStandar = `Menghaluskan keterampilan gerak fundamental dan menerapkannya dalam situasi gerak baru; menyesuaikan strategi gerak untuk mendapatkan capaian keterampilan gerak; memperagakan berbagai konsep gerak; menerapkan strategi gerak sederhana dan memecahkan masalah gerak; menerapkan peraturan untuk fair play; berpartisipasi positif dalam kelompok; mengenali faktor aktivitas menyenangkan; mengenali risiko kesehatan gaya hidup; mengidentifikasi pola makan bergizi seimbang; dan mempraktikkan penanganan cedera ringan prinsip pertolongan pertama.`;
  } else if (fase.includes('Fase C')) {
    cpStandar = `Menyesuaikan keterampilan gerak melintasi berbagai situasi gerak; mentransfer strategi gerak yang sudah dikuasai ke dalam berbagai situasi gerak yang berbeda; menginvestigasi berbagai konsep gerak untuk meningkatkan capaian keterampilan gerak; menguji efektivitas penerapan strategi gerak; merancang peraturan alternatif dan modifikasi permainan untuk mendukung fair play dan partisipasi inklusif; berpartisipasi aktif serta memprediksi faktor preferensi aktivitas jasmani; dan menerapkan pencegahan risiko kesehatan serta pertolongan pertama cedera.`;
  }

  const subTopikList = [
    `Pertemuan 1: Pengenalan Konsep & ${sibiAct1}`,
    `Pertemuan 2: Eksplorasi Teknik Gerak Dasar & Postur Tubuh Seimbang (${sibiAct1})`,
    `Pertemuan 3: Penghalusan Keterampilan Gerak & ${sibiAct2}`,
    `Pertemuan 4: Kombinasi Pola Gerak Berpasangan & Pemecahan Masalah (${sibiAct2})`,
    `Pertemuan 5: Aplikasi Gerak dalam ${sibiAct3}`,
    `Pertemuan 6: Strategi Taktik, Penyesuaian Ruang, dan Kolaborasi Tim (${sibiAct3})`,
    `Pertemuan 7: Simulasi Kompetisi Inklusif & Pembiasaan Fair Play Sportif (Buku SIBI)`,
    `Pertemuan 8: Asesmen Sumatif Unjuk Kerja, Refleksi Holistik Unit SIBI, & Tindak Lanjut`
  ];

  const tujuanList = [
    `Pertemuan 1: Murid dapat mengidentifikasi konsep, fungsi, dan manfaat gerak ${m} dengan penuh kesadaran sensori tubuh (Level Kognitif: Memahami/C2).`,
    `Pertemuan 2: Murid dapat mempraktikkan keterampilan gerak fundamental ${m} dengan teknik dan postur tubuh yang benar dan aman (Level Kognitif: Menerapkan/C3).`,
    `Pertemuan 3: Murid dapat menganalisis variasi gerak ${m} serta mengidentifikasi faktor penentu keberhasilan dan kesalahan teknik (Level Kognitif: Menganalisis/C4).`,
    `Pertemuan 4: Murid dapat menerapkan strategi pemecahan masalah koordinasi gerak dalam aktivitas berpasangan secara mandiri dan bertanggung jawab (Level Kognitif: Menerapkan/C3).`,
    `Pertemuan 5: Murid dapat menguji efektivitas variasi gerak ${m} dalam permainan beregu modifikasi sederhana (Level Kognitif: Menganalisis/C4).`,
    `Pertemuan 6: Murid dapat merancang taktik dan kolaborasi tim untuk menyelesaikan tantangan gerak secara kreatif dan sportif (Level Kognitif: Mencipta/C6).`,
    `Pertemuan 7: Murid dapat mengevaluasi performa gerak serta penerapan nilai fair play dalam simulasi kompetisi inklusif (Level Kognitif: Merefleksi/C5).`,
    `Pertemuan 8: Murid dapat mendemonstrasikan unjuk kerja utuh kompetensi 1 bab dan merefleksikan transformasi kebugaran jasmani bagi kehidupan sehari-hari (Level Kognitif: Merefleksi/C5).`
  ];

  const modelMetodeList = [
    `Pertemuan 1: Model Problem-Based Learning (Sintaks: 1. Orientasi masalah; 2. Organisasi belajar; 3. Penyelidikan mandiri; 4. Penyajian hasil; 5. Evaluasi), Metode Diskusi & Demonstrasi Interaktif.`,
    `Pertemuan 2: Model Direct Instruction Berdiferensiasi (Sintaks: 1. Menyampaikan tujuan; 2. Demonstrasi gerak; 3. Latihan terbimbing; 4. Umpan balik; 5. Latihan mandiri), Metode Drill Praktik Terarah.`,
    `Pertemuan 3: Model Inkuiri Terbimbing (Sintaks: 1. Orientasi masalah; 2. Merumuskan hipotesis gerak; 3. Uji coba sirkuit; 4. Analisis data unjuk kerja; 5. Kesimpulan teknik), Metode Latihan Sirkuit (Circuit Practice).`,
    `Pertemuan 4: Model Cooperative Learning (Sintaks: 1. Penjelasan materi; 2. Pembentukan pasangan/kelompok; 3. Penugasan saling amati; 4. Presentasi kelompok; 5. Penghargaan), Metode Tutor Sebaya Berpasangan.`,
    `Pertemuan 5: Model Game-Based Learning (Sintaks: 1. Penjelasan skenario permainan; 2. Penyepakatan aturan modifikasi; 3. Pelaksanaan simulasi; 4. Refleksi makna permainan), Metode Simulasi Permainan Modifikasi.`,
    `Pertemuan 6: Model Project-Based Learning (Sintaks: 1. Menentukan pertanyaan mendasar; 2. Mendesain perencanaan taktik; 3. Menyusun jadwal latihan; 4. Monitoring uji coba; 5. Evaluasi hasil taktik), Metode Kerja Tim Kolaboratif.`,
    `Pertemuan 7: Model Teaching Games for Understanding / TGfU (Sintaks: 1. Bentuk permainan; 2. Apresiasi permainan; 3. Kesadaran taktik; 4. Pengambilan keputusan tepat; 5. Eksekusi keterampilan; 6. Performa), Metode Mini Turnamen Inklusif.`,
    `Pertemuan 8: Model Authentic & Reflective Assessment (Sintaks: 1. Review komprehensif bab; 2. Demonstrasi unjuk kerja autentik; 3. Asesmen sumatif tertulis & praktik; 4. Refleksi diri holistik; 5. Rencana pembiasaan hidup aktif), Metode Uji Kinerja & Refleksi Dialogis.`
  ];

  // Build 8 meetings Kegiatan Inti
  const kegiatanInti8Pertemuan = subTopikList.map((st, i) => {
    const pNum = i + 1;
    return `### PERTEMUAN ${pNum}: ${st}
Prinsip Pembelajaran: Mindful (Berkesadaran), Meaningful (Bermakna), dan Joyful (Menggembirakan). Durasi: 60 Menit.

Memahami (Sintaks: Orientasi & Pengorganisasian Belajar Pertemuan ${pNum}) (15 Menit)
1. Guru menyajikan demonstrasi langsung atau tayangan visual interaktif terkait ${st}, murid menyimak dengan penuh kesadaran sensori tubuh (Penalaran Kritis, Kesehatan).
2. Murid mengajukan pertanyaan kritis mengenai prinsip mekanika gerak, efisiensi tenaga, dan titik tumpuan yang aman (Penalaran Kritis, Komunikasi).
3. Guru mengorganisasikan murid ke dalam kelompok kolaboratif serta membagikan LKPD Pertemuan ${pNum} yang kontekstual (Kolaborasi).
4. Murid dalam kelompok merumuskan hipotesis awal dan menyusun langkah pembagian peran latihan secara adil (Kolaborasi, Kemandirian).

Mengaplikasikan (Sintaks: Penyelidikan & Praktik Kolaboratif Pertemuan ${pNum}) (30 Menit)
1. Murid secara bergantian mempraktikkan tahapan gerak sesuai instruksi kerja LKPD pada pos-pos tantangan dengan penuh antusiasme (Kesehatan, Kemandirian).
2. Teman sekelompok melakukan pengamatan seksama, memberikan aba-aba hitungan, dan mendokumentasikan catatan teknik teman secara objektif dan suportif (Komunikasi, Kolaborasi).
3. Murid mencoba menyelesaikan variasi studi kasus pemecahan masalah gerak yang dihadapi saat latihan bersama (Penalaran Kritis, Kolaborasi).
4. Kelompok menguji coba modifikasi gerakan atau taktik kecil untuk meningkatkan kelancaran dan ketepatan pelaksanaan tugas gerak (Kreativitas, Kesehatan).

Merefleksi (Sintaks: Evaluasi & Refleksi Solusi Pertemuan ${pNum}) (15 Menit)
1. Setiap kelompok menampilkan peragaan performa gerak terbaik mereka di depan kelas dengan rasa percaya diri yang tinggi (Kemandirian, Komunikasi).
2. Kelompok rekan memberikan umpan balik konstruktif dan apresiasi terhadap sportivitas serta keunggulan teknik kelompok penampil (Penalaran Kritis, Komunikasi).
3. Guru bersama murid membahas kesulitan yang ditemui di lapangan serta merumuskan kiat perbaikan gerakan secara ilmiah dan ramah anak (Penalaran Kritis, Kesehatan).
4. Murid menuliskan refleksi personal pada LKPD mengenai nilai sportivitas, pengalaman bekerja sama, dan dampak kebugaran yang dirasakan tubuh (Kemandirian, Kesehatan).`;
  }).join('\n\n');

  // Build 8 LKPDs (Non-Table)
  const lkpdList = Array.from({ length: 8 }, (_, idx) => {
    const pNum = idx + 1;
    const subTopik = subTopikList[idx];
    return {
      pertemuan: `Pertemuan ${pNum}`,
      title: `LKPD Pertemuan ${pNum}: ${subTopik}`,
      content: `LEMBAR KERJA PESERTA DIDIK (LKPD) - PERTEMUAN ${pNum}
Topik Bab: ${bab}
Sub Topik: ${subTopik}

1. IDENTITAS DIRI
Nama Peserta Didik : .....................................................
Mata Pelajaran     : ${mataPelajaran}
No. Absen / Kelas  : .......... / ${kelasFaseFormatted}
Hari / Tanggal     : .....................................................

2. PETUNJUK PENGGUNAAN LKPD
a. Berdoalah sebelum memulai kegiatan agar diberikan kemudahan dan kelancaran.
b. Bacalah setiap instruksi dan panduan aktivitas dengan cermat dan saksama.
c. Gunakan pakaian olahraga lengkap dan siapkan perlengkapan gerak yang dibutuhkan.
d. Bekerjasamalah secara aktif, jujur, dan junjung tinggi sportivitas bersama teman kelompokmu.
e. Tuliskan hasil analisis, pengamatan, dan jawabanmu dengan rapi pada ruang jawaban yang telah disediakan.

3. SINTAKS PEMBELAJARAN & AKTIVITAS SISWA
Model Pembelajaran: ${modelMetodeList[idx].split('(')[0].replace(`Pertemuan ${pNum}: `, '').trim()}
- Langkah 1: Mengamati stimulus permasalahan nyata dan mengidentifikasi konsep kunci gerak.
- Langkah 2: Merumuskan strategi pemecahan masalah gerak bersama kelompok.
- Langkah 3: Melakukan penyelidikan praktik dan uji coba gerak langsung di pos latihan.
- Langkah 4: Mempresentasikan hasil peragaan dan strategi kelompok kepada teman sekelas.
- Langkah 5: Melakukan refleksi mendalam dan evaluasi perbaikan teknik gerak bersama guru.

4. PENGALAMAN BELAJAR MENDALAM

A. MEMAHAMI (Mindful Learning)
Stimulus Materi:
"Pada sesi pembelajaran Pertemuan ${pNum} ini, kita memfokuskan latihan pada ${subTopik}. Penguasaan teknik yang benar, kesadaran menjaga keseimbangan tubuh, dan kontrol pernapasan merupakan kunci utama untuk mencapai performa gerak yang efektif sekaligus menjaga keselamatan diri dari cedera."

Pertanyaan Pemahaman:
1) Jelaskan mengapa posisi tumpuan awal dan kelenturan tubuh sangat menentukan keberhasilan pelaksanaan aktivitas pada pertemuan ini!
   Jawaban:
   ....................................................................................................................................................
   ....................................................................................................................................................

2) Apa perbedaan utama antara teknik gerakan yang dilakukan dengan tergesa-gesa dibandingkan dengan gerakan yang dilakukan secara berkesadaran (mindful)?
   Jawaban:
   ....................................................................................................................................................
   ....................................................................................................................................................

3) Sebutkan 2 (dua) tanda yang menunjukkan bahwa otot tubuhmu sedang bekerja secara optimal selama latihan berlangsung!
   Jawaban:
   ....................................................................................................................................................
   ....................................................................................................................................................

B. MENGAPLIKASIKAN (Meaningful & Joyful Learning)
Tugas Studi Kasus Kontekstual Nyata:
"Kelompokmu diminta menyelesaikan tantangan simulasi aktivitas gerak ${subTopik} secara terpadu. Selama latihan berlangsung, salah satu anggota tim tampak ragu-ragu dan kesulitan menjaga ritme gerakan sehingga laju kelompok melambat. Strategi kolaborasi apa yang akan kelompokmu terapkan agar teman tersebut dapat mengikuti gerakan dengan nyaman, aman, dan seluruh tim mencapai target tantangan dengan gembira?"

Instruksi Pengerjaan:
1. Diskusikan pembagian peran dan strategi penyesuaian gerak bersama seluruh anggota kelompok.
2. Lakukan latihan uji coba bersama minimal 2 kali pengulangan.
3. Catat strategi kelompok, hasil pengamatan waktu/akurasi gerak, dan solusi yang telah disepakati pada ruang di bawah ini!

Ruang Jawaban / Hasil Kerja Siswa:
....................................................................................................................................................
....................................................................................................................................................
....................................................................................................................................................
....................................................................................................................................................
....................................................................................................................................................

C. MEREFLEKSIKAN (Reflective Thinking)
Jawablah pertanyaan refleksi berikut dengan jujur:
1) Pengalaman belajar baru apa yang paling berkesan dan membuka wawasanmu selama mengikuti aktivitas hari ini?
   Jawaban: .......................................................................................................................................
2) Kendala fisik atau koordinasi apa yang sempat kamu alami, dan bagaimana cara kamu mengatasinya?
   Jawaban: .......................................................................................................................................
3) Nilai karakter (misal: sportivitas, gotong royong, pantang menyerah) apa yang berhasil kamu kembangkan hari ini?
   Jawaban: .......................................................................................................................................

5. BAGIAN PENUTUP
Pesan Penyemangat:
"Luar biasa! Kamu telah menunjukkan ketekunan, sportivitas, dan semangat kolaborasi yang hebat pada Pertemuan ${pNum} ini. Teruslah berlatih dan jaga pola hidup sehat!"

Cek Pemahaman Diri (Checklist Mandiri):
[  ] Saya telah memahami konsep dan tahapan teknik gerak pada pertemuan ini.
[  ] Saya mampu mempraktikkan gerakan secara mandiri dan bersama teman kelompok.
[  ] Saya menjunjung tinggi sportivitas, taat aturan, dan menghargai teman sekelas.
[  ] Saya merasakan peningkatan kebugaran dan kegembiraan selama berolahraga.

Catatan / Umpan Balik Guru:
....................................................................................................................................................
....................................................................................................................................................`
    };
  });

  return {
    title: 'PERENCANAAN PEMBELAJARAN MENDALAM (RPM) - 1 BAB LENGKAP',
    identitas: {
      penyusun,
      sekolah,
      tahunAjaran,
      semester: `${sem} (${sem === '1' ? 'Ganjil' : 'Genap'})`,
      mataPelajaran,
      kelasFase: kelasFaseFormatted,
      kelas,
      fase,
      topikElemen: `${bab} / ${m}`,
      bab,
      topik: m,
      alokasiWaktu,
      jumlahPertemuan: 8
    },
    identifikasi: {
      muridOps: `Identifikasi kesiapan murid sebelum belajar 1 Bab:
1. Pengetahuan Awal: Sebagian besar murid telah mengenal aktivitas fisik dasar terkait materi ${m}, namun penguasaan teknik gerak yang efisien, ritme pernapasan, dan pemahaman biomekanika dasar masih sangat bervariasi.
2. Minat Belajar: Murid menunjukkan antusiasme yang tinggi terhadap kegiatan fisik luar ruang, tantangan permainan interaktif beregu, serta simulasi kompetisi yang menyenangkan dan adil.
3. Kebutuhan Belajar: Memerlukan diferensiasi konten berupa peragaan visual bertahap (slow-motion), diferensiasi proses melalui pembelajaran berbasis pos latihan sirkuit, dan diferensiasi produk melalui unjuk kerja praktik serta jurnal refleksi berkala.`,
      materiPelajaranOps: `Analisis materi pelajaran 1 Bab:
1. Faktual: Ragam bentuk konkret keterampilan gerak ${m}, variasi formasi lapangan, dan aturan keselamatan alat olahraga.
2. Konseptual: Prinsip koordinasi motorik, hukum aksi-reaksi sederhana, transfer energi gerak tubuh, dan pengaruh olahraga terhadap kardiorespirasi serta kebugaran jasmani.
3. Prosedural: Urutan langkah sistematis penguasaan teknik dasar mulai dari sikap awalan, fase pelaksanaan, sikap akhir, hingga perangkaian gerak dalam situasi permainan nyata.
4. Metakognitif: Kesadaran murid dalam memonitor batas kemampuan fisik diri, mengatur kecepatan dan ritme stamina, serta mengevaluasi strategi gerak secara mandiri.`,
      dimensiProfilLulusan: [
        'DPL1 Keimanan dan Ketakwaan terhadap Tuhan YME',
        'DPL3 Penalaran Kritis',
        'DPL4 Kreativitas',
        'DPL5 Kolaborasi',
        'DPL6 Kemandirian',
        'DPL7 Kesehatan',
        'DPL8 Komunikasi'
      ],
      identifikasiMurid: `Pengetahuan Awal: Memiliki modal gerak dasar namun perlu penyelarasan teknik.\nMinat Belajar: Senang aktivitas gerak dinamis dan tantangan beregu.\nKebutuhan Belajar: Scaffolding bertahap, bimbingan tutor sebaya, dan apresiasi positif.`,
      materiPelajaran: `Faktual (ragam bentuk gerak nyata), Konseptual (prinsip koordinasi dan kebugaran), Prosedural (tahapan teknik aman 1 Bab), Metakognitif (evaluasi diri dan pengendalian stamina).`
    },
    desainPembelajaran: {
      capaianPembelajaranOps: cpStandar,
      lintasDisiplinIlmuOps: `IPAS (Sistem peredaran darah, kerja otot dan rangka, serta transfer energi gerak tubuh), Bahasa Indonesia (Keterampilan komunikasi santun saat berdiskusi strategi dan memberikan umpan balik teman), Pendidikan Pancasila (Penanaman nilai sportivitas, gotong royong, ketaatan pada regulasi bersama, dan penghargaan atas perbedaan individu).`,
      tujuanPembelajaran: tujuanList.join('\n\n'),
      topikPembelajaranOps: subTopikList.join('\n'),
      praktikPedagogis: `Pendekatan: Pembelajaran Mendalam (Deep Learning) berorientasi Berkesadaran (Mindful), Bermakna (Meaningful), dan Menggembirakan (Joyful).\n\nModel & Metode Pembelajaran Tiap Pertemuan:\n${modelMetodeList.join('\n\n')}`,
      kemitraanPembelajaranOps: `Tutor sebaya (peserta didik mahir mendampingi rekan), kolaborasi dengan guru mapel serumpun PJOK dan UKS, tenaga medis/Puskesmas setempat untuk edukasi kebugaran, serta pelibatan orang tua dalam membiasakan olahraga teratur dan gizi seimbang di rumah.`,
      lingkunganPembelajaran: `Area lapangan olahraga sekolah dan ruang terbuka yang bersih, aman, bebas bahaya fisik, dengan kultur kelas yang inklusif, ramah anak, saling mendukung, dan menjunjung tinggi budaya fair play.`,
      pemanfaatanDigitalOps: `Pemanfaatan rekaman video gerak slow-motion untuk analisis teknik, aplikasi stopwatch digital pengukur efisiensi gerak, platform kuis interaktif reflektif, serta penyediaan bahan ajar digital interaktif yang dapat diakses peserta didik.`,
      capaianPembelajaran: cpStandar,
      lintasDisiplinIlmu: `IPAS, Bahasa Indonesia, Pendidikan Pancasila`,
      topikPembelajaran: subTopikList.join('\n'),
      kemitraanPembelajaran: `Tutor sebaya, guru PJOK serumpun, tim UKS/Puskesmas, dan orang tua`,
      pemanfaatanDigital: `Video peragaan digital slow-motion, stopwatch digital, dan platform kuis interaktif`
    },
    pengalamanBelajar: {
      langkahPembelajaran: {
        awalOps: {
          prinsip: 'Berkesadaran (Mindful) dan Menggembirakan (Joyful)',
          deskripsi: 'Kegiatan awal durasi 15 menit berorientasi mengondisikan fisik dan mental, memeriksa kesiapan belajar, menumbuhkan motivasi riang, serta mengaitkan pengalaman nyata murid.'
        },
        inti: {
          prinsipUmum: 'Kegiatan inti 60 menit setiap pertemuan (Pertemuan 1 s.d. 8) menerapkan prinsip mindful, meaningful, dan joyful melalui tahapan Memahami, Mengaplikasikan, dan Merefleksi yang terintegrasi dengan sintaks model serta DPL.',
          memahami: {
            prinsip: 'Mindful & Meaningful (Orientasi & Pengorganisasian Belajar) (15 Menit)',
            kegiatan: [
              `Guru memfasilitasi pengamatan fenomena gerak nyata atau tayangan slow-motion tentang ${m} secara berkesadaran penuh (Penalaran Kritis, Kesehatan).`,
              `Murid merespons pertanyaan pemantik seputar keterkaitan antara teknik gerak tubuh dan efisiensi tenaga yang dikeluarkan (Penalaran Kritis, Komunikasi).`,
              `Guru mengelompokkan murid ke dalam regu heterogen yang suportif dan membagikan LKPD pertemuan terkait (Kolaborasi).`,
              `Murid dalam kelompok mendiskusikan strategi pemecahan masalah dan pembagian peran latihan yang adil (Kolaborasi, Kemandirian).`
            ]
          },
          mengaplikasi: {
            prinsip: 'Meaningful & Joyful (Penyelidikan & Praktik Kolaboratif) (30 Menit)',
            kegiatan: [
              `Murid mempraktikkan keterampilan gerak melalui pos latihan sirkuit bergradasi dengan penuh kegembiraan dan semangat (Kolaborasi, Kesehatan).`,
              `Setiap murid saling mengamati, memberikan aba-aba hitungan, dan melakukan koreksi gerak antarteman secara santun (Komunikasi, Kolaborasi).`,
              `Murid menuntaskan studi kasus kontekstual pada LKPD secara bertanggung jawab dengan mengutamakan keselamatan bersama (Kemandirian, Kesehatan).`,
              `Kelompok merancang modifikasi aturan permainan kecil beregu untuk menguji keterampilan gerak secara sportif (Kreativitas, Kesehatan).`
            ]
          },
          merefleksi: {
            prinsip: 'Mindful & Meaningful (Evaluasi & Refleksi Solusi) (15 Menit)',
            kegiatan: [
              `Setiap kelompok mendemonstrasikan kombinasi gerak terbaik mereka di depan kelas dengan percaya diri (Kemandirian, Komunikasi).`,
              `Kelompok lain memberikan umpan balik apresiatif dan masukan perbaikan yang konstruktif (Penalaran Kritis, Komunikasi).`,
              `Guru dan murid bersama-sama menyimpulkan kunci keberhasilan gerak dan cara mengatasi kendala teknis (Penalaran Kritis, Kesehatan).`,
              `Murid mencatat refleksi personal pada LKPD mengenai nilai sportivitas dan manfaat kebugaran yang diperoleh (Kemandirian, Kesehatan).`
            ]
          }
        },
        penutupOps: {
          prinsip: 'Berkesadaran (Mindful) dan Bermakna (Meaningful)',
          deskripsi: 'Kegiatan penutup durasi 5 menit mencakup pendinginan relaksasi, penarikan kesimpulan bersama, apresiasi sportivitas, rencana pertemuan selanjutnya, doa, dan salam.'
        }
      },
      kegiatanAwal: `Prinsip Pembelajaran: Berkesadaran (Mindful) dan Menggembirakan (Joyful). Durasi: 15 Menit.
1. Guru membuka pembelajaran di lapangan dengan mengucap salam hangat dan menyapa seluruh murid dengan riang.
2. Guru memandu peserta didik berdoa bersama dipimpin oleh salah satu murid untuk menumbuhkan keimanan (Keimanan dan Ketakwaan terhadap TYME).
3. Guru mengecek kehadiran, memeriksa kerapian pakaian olahraga, dan memastikan kondisi kesehatan fisik setiap peserta didik.
4. Guru melakukan apersepsi kontekstual melalui tanya jawab singkat tentang pengalaman gerak tubuh sehari-hari (Komunikasi).
5. Guru mengajak murid melakukan pemanasan statis dan dinamis yang dikemas dalam bentuk permainan ceria (Kesehatan, Menggembirakan).`,
      kegiatanInti: kegiatanInti8Pertemuan,
      kegiatanPenutup: `Prinsip Pembelajaran: Berkesadaran (Mindful) dan Bermakna (Meaningful). Durasi: 5 Menit.
1. Guru memandu seluruh peserta didik melakukan pendinginan (cooling down) santai disertai olah napas teratur untuk merilekskan otot (Kesehatan).
2. Guru bersama peserta didik menyimpulkan intisari pembelajaran dan mengaitkannya dengan pembiasaan hidup sehat sehari-hari (Penalaran Kritis).
3. Guru memberikan apresiasi terhadap sportivitas dan kerja keras murid serta menyampaikan topik untuk pertemuan berikutnya (Komunikasi).
4. Guru memimpin doa penutup mengucap syukur atas keselamatan dan menutup pembelajaran dengan salam santun (Keimanan dan Ketakwaan terhadap TYME).`
    },
    asesmenPembelajaran: {
      awal: 'Jenis: Asesmen Diagnostik (Kognitif & Non-Kognitif). Bentuk: Tanya Jawab Lisan & 5 Butir Pertanyaan Singkat Diagnostik. Teknik: Cek kesiapan fisik, tes pemahaman awal konsep materi 1 Bab.',
      proses: 'Jenis: Asesmen Formatif Berkelanjutan. Bentuk: Lembar Observasi Kinerja Praktik, Ceklis Sikap DPL, dan Penilaian LKPD Pertemuan 1-8. Teknik: Pengamatan proses latihan, umpan balik langsung, penilaian antar teman.',
      akhir: 'Jenis: Asesmen Sumatif Lingkup Materi 1 Bab. Bentuk: 5 Butir Soal Evaluasi Pemahaman & Tes Unjuk Kerja Praktik Kombinasi Komprehensif. Teknik: Uji performa keterampilan mandiri/beregu dan portofolio jurnal refleksi.'
    },
    tandaTangan: {
      tempatTanggal: 'Jember, 1 Juli 2025',
      kepalaSekolah: {
        nama: 'Soleh, S.Pd., M.Pd.',
        nip: 'NIP. 19750512 200003 1 004'
      },
      guruMapel: {
        nama: penyusun,
        nip: 'NIP. ........................................'
      }
    },
    lampiran: {
      soalAsesmenAwalList: [
        {
          no: 1,
          pertanyaan: `Apa yang kamu ketahui tentang konsep dan ruang lingkup dari aktivitas ${m} yang akan dipelajari dalam 1 bab ini?`,
          kunciJawaban: `Aktivitas fisik terpadu yang melatih keterampilan koordinasi, kekuatan, dan kelincahan gerak tubuh untuk menunjang kebugaran jasmani.`
        },
        {
          no: 2,
          pertanyaan: 'Mengapa melakukan pemanasan (warming up) yang tepat sebelum memulai olahraga inti sangat penting?',
          kunciJawaban: 'Menaikkan suhu tubuh dan denyut nadi, melenturkan otot dan persendian, serta mencegah terjadinya risiko cedera fisik.'
        },
        {
          no: 3,
          pertanyaan: 'Sebutkan bagian otot dan persendian tubuh utama yang paling aktif digunakan saat melakukan gerakan ini!',
          kunciJawaban: 'Otot tungkai kaki, otot lengan bahu, persendian lutut, dan otot inti (core) tubuh penjaga keseimbangan.'
        },
        {
          no: 4,
          pertanyaan: 'Bagaimana sikap yang benar saat bekerja sama dalam satu kelompok olahraga apabila ada teman yang belum menguasai gerakan?',
          kunciJawaban: 'Menunjukkan sikap empati, memberikan semangat, tidak mengejek, dan dengan sabar membantu memberikan petunjuk teknik yang benar.'
        },
        {
          no: 5,
          pertanyaan: 'Bagaimana cara mengatur ritme napas yang benar saat tubuh melakukan aktivitas fisik yang berulang?',
          kunciJawaban: 'Menghirup udara bersih melalui hidung secara teratur dan mengeluarkannya secara perlahan lewat mulut tanpa menahan napas.'
        }
      ],
      rubrikSikap: {
        dimensiTerpilih: ['Penalaran Kritis', 'Kolaborasi', 'Kesehatan', 'Kemandirian'],
        aspekList: [
          {
            dimensi: 'Penalaran Kritis',
            indikator: 'Menganalisis efektivitas gerak dan menemukan solusi atas kesalahan teknik.',
            skor4: 'Sangat kritis, mampu menganalisis kesalahan gerak dan memberikan solusi praktis yang tepat.',
            skor3: 'Kritis, mampu menunjukkan letak kesalahan dan mengerti langkah perbaikan dasar.',
            skor2: 'Mulai menunjukkan pemikiran kritis namun masih sering memerlukan bimbingan guru.',
            skor1: 'Belum mampu menganalisis atau memberikan tanggapan terhadap gerakan.'
          },
          {
            dimensi: 'Kolaborasi',
            indikator: 'Bekerja sama secara aktif, berbagi peran adil, dan saling mendukung dalam tim.',
            skor4: 'Selalu berinisiatif bekerja sama, sangat suportif, dan menghargai peran semua anggota tim.',
            skor3: 'Bekerja sama dengan baik dan bersedia membantu teman yang mengalami kesulitan.',
            skor2: 'Bekerja sama hanya jika diingatkan, cenderung pasif dalam kelompok.',
            skor1: 'Enggan bekerja sama atau mengganggu ketertiban kegiatan kelompok.'
          },
          {
            dimensi: 'Kesehatan',
            indikator: 'Menjaga keselamatan diri, mematuhi prinsip kebugaran, dan menerapkan gaya hidup sehat.',
            skor4: 'Sangat peduli keselamatan diri & rekan, hidrasi teratur, serta aktif menjaga kebugaran tubuh.',
            skor3: 'Peduli keselamatan dan mematuhi arahan pemanasan serta pendinginan dengan baik.',
            skor2: 'Kurang memperhatikan keselamatan, kadang mengabaikan tahapan pendinginan.',
            skor1: 'Melakukan tindakan berbahaya yang berisiko mencederai diri sendiri atau orang lain.'
          },
          {
            dimensi: 'Kemandirian',
            indikator: 'Bertanggung jawab atas latihan mandiri dan percaya diri menampilkan kemampuan.',
            skor4: 'Sangat mandiri, berdisiplin tinggi dalam latihan, dan percaya diri menampilkan unjuk kerja.',
            skor3: 'Mandiri menyelesaikan tugas gerak, percaya diri dan bertanggung jawab.',
            skor2: 'Memerlukan motivasi tambahan dari guru untuk memulai latihan.',
            skor1: 'Tidak menunjukkan kemandirian dan enggan mencoba gerakan.'
          }
        ]
      },
      penilaianPengetahuan: {
        judul: 'Rubrik Penilaian Pengetahuan 1 Bab (LKPD & Pemahaman Konsep Komprehensif)',
        aspekList: [
          'Kelengkapan Pengerjaan LKPD Pertemuan 1-8',
          'Akurasi Konsep Teori dan Biomekanika Gerak',
          'Kualitas Analisis Taktik & Pemecahan Masalah',
          'Kedalaman Refleksi Diri dan Kesadaran Bugar'
        ],
        pedomanSkor: [
          {
            aspek: 'Kelengkapan Pengerjaan LKPD Pertemuan 1-8',
            skor4: 'Seluruh LKPD dari pertemuan 1 hingga 8 dikerjakan secara tuntas, rapi, dan sistematis.',
            skor3: 'Mayoritas LKPD (6-7 pertemuan) terisi lengkap sesuai instruksi pengerjaan.',
            skor2: 'Hanya separuh LKPD (4-5 pertemuan) yang dikerjakan dengan baik.',
            skor1: 'Kurang dari 4 LKPD yang dikerjakan atau sebagian besar dibiarkan kosong.'
          },
          {
            aspek: 'Akurasi Konsep Teori dan Biomekanika Gerak',
            skor4: 'Seluruh penjelasan konsep gerak, keselamatan, dan prinsip kebugaran sangat akurat.',
            skor3: 'Penjelasan konsep materi benar dengan sedikit kekeliruan minor.',
            skor2: 'Beberapa konsep dasar masih tertukar atau dijelaskan secara kurang tepat.',
            skor1: 'Penjelasan konsep keliru secara menyeluruh dan tidak sesuai materi.'
          },
          {
            aspek: 'Kualitas Analisis Taktik & Pemecahan Masalah',
            skor4: 'Strategi pemecahan masalah yang diajukan sangat logis, inovatif, dan aplikatif.',
            skor3: 'Strategi yang diajukan cukup logis dan dapat diimplementasikan dengan baik.',
            skor2: 'Strategi kurang terstruktur dan sulit diterapkan di lapangan.',
            skor1: 'Tidak ada usulan strategi atau strategi tidak rasional.'
          },
          {
            aspek: 'Kedalaman Refleksi Diri dan Kesadaran Bugar',
            skor4: 'Refleksi sangat mendalam, menunjukkan kesadaran diri tinggi akan kesehatan dan karakter.',
            skor3: 'Refleksi cukup jelas dan mencerminkan pengalaman belajar secara jujur.',
            skor2: 'Refleksi masih sangat singkat dan bersifat formalitas.',
            skor1: 'Tidak mengisi lembar refleksi atau jawaban tidak relevan.'
          }
        ],
        rumusNilai: 'Nilai Akhir = (Jumlah Skor Diperoleh / 16) × 100'
      },
      penilaianKeterampilan: {
        judul: 'Rubrik Penilaian Keterampilan Praktik Unjuk Kerja 1 Bab (4 Skala)',
        aspekList: [
          'Teknik Sikap Awalan & Kesiapan Postur',
          'Koordinasi dan Kelancaran Rangkaian Gerak Inti',
          'Pengendalian Keseimbangan & Sikap Akhir Aman',
          'Konsistensi Sportivitas & Penerapan Fair Play'
        ],
        pedomanSkor: [
          {
            aspek: 'Teknik Sikap Awalan & Kesiapan Postur',
            skor4: 'Sikap awalan sangat stabil, postur tubuh tepat, dan tumpuan kaki sangat mantap.',
            skor3: 'Sikap awalan stabil dan postur tubuh cukup baik.',
            skor2: 'Sikap awalan masih goyah dan tumpuan kaki kerap keliru.',
            skor1: 'Sikap awalan tidak tepat dan belum siap melakukan gerak.'
          },
          {
            aspek: 'Koordinasi dan Kelancaran Rangkaian Gerak Inti',
            skor4: 'Rangkaian gerakan mengalir sangat luwes, ritmis, bertenaga, dan terkoordinasi sempurna.',
            skor3: 'Rangkaian gerakan terkoordinasi dengan baik dan runtut sesuai teknik.',
            skor2: 'Gerakan masih kaku atau terputus-putus pada fase transisi.',
            skor1: 'Tidak mampu melakukan koordinasi rangkaian gerakan inti.'
          },
          {
            aspek: 'Pengendalian Keseimbangan & Sikap Akhir Aman',
            skor4: 'Pendaratan/posisi akhir terkontrol sangat sempurna, stabil, dan aman dari risiko cedera.',
            skor3: 'Posisi akhir stabil dan aman dengan sedikit pergeseran tumpuan.',
            skor2: 'Posisi akhir goyah dan hampir kehilangan keseimbangan tubuh.',
            skor1: 'Kehilangan keseimbangan sepenuhnya atau terjatuh.'
          },
          {
            aspek: 'Konsistensi Sportivitas & Penerapan Fair Play',
            skor4: 'Sangat sportif, taat pada seluruh aturan, jujur, dan aktif menyemangati teman serta lawan.',
            skor3: 'Sportif, menghargai aturan permainan dan bekerja sama dengan baik.',
            skor2: 'Kurang konsisten dalam bersikap sportif atau sesekali melanggar aturan permainan.',
            skor1: 'Tidak menunjukkan sportivitas, bersikap curang, atau menolak taat aturan.'
          }
        ],
        rumusNilai: 'Nilai Akhir = (Jumlah Skor Diperoleh / 16) × 100'
      },
      soalAsesmenAkhirList: [
        {
          no: 1,
          pertanyaan: `Jelaskan secara komprehensif konsep dasar, prinsip biomekanika sederhana, dan tujuan utama dari materi ${m} yang telah dipelajari selama 8 pertemuan!`,
          kunciJawaban: `Materi ${m} memadukan keterampilan koordinasi tumpuan, kelenturan anggota gerak, dan kontrol gravitasi tubuh untuk menghasilkan efisiensi gerak maksimal, meningkatkan kebugaran kardiorespirasi, dan mencegah risiko cedera.`
        },
        {
          no: 2,
          pertanyaan: `Saat sebuah regu menghadapi lawan yang memiliki keunggulan fisik atau kecepatan dalam permainan ${m}, analisis strategi taktik dan kolaborasi apa yang harus diterapkan agar regu tetap mampu bersaing secara sportif?`,
          kunciJawaban: `Memaksimalkan komunikasi antarpemain, mempercepat perpindahan posisi ke ruang kosong, saling menutup celah pertahanan melalui pembagian peran yang seimbang, dan menjaga ketenangan mental.`
        },
        {
          no: 3,
          pertanyaan: `Mengapa penguasaan sikap awalan dan pendaratan/sikap akhir yang benar sangat menentukan keselamatan dan efektivitas hasil gerakan dalam ${m}?`,
          kunciJawaban: `Sikap awalan menciptakan momentum gaya yang stabil, sedangkan pendaratan/sikap akhir meredam beban kejut pada sendi lutut dan pergelangan kaki sehingga melindungi tubuh dari cedera ligamen.`
        },
        {
          no: 4,
          pertanyaan: `Uraikan bagaimana pengalaman berlatih materi ${m} selama 1 bab ini menumbuhkan Dimensi Profil Lulusan seperti Kolaborasi, Penalaran Kritis, dan Kesehatan pada dirimu!`,
          kunciJawaban: `Kolaborasi diasah melalui latihan tim dan saling koreksi; Penalaran Kritis dilatih saat membedah kesalahan teknik dan merancang strategi; Kesehatan terwujud melalui peningkatan stamina dan pembiasaan gaya hidup aktif.`
        },
        {
          no: 5,
          pertanyaan: `Rancanglah sebuah rencana aksi pribadi sederhana (3-4 langkah) untuk terus membiasakan aktivitas fisik dan menjaga pola hidup sehat di lingkungan rumahmu!`,
          kunciJawaban: `1) Menyisihkan waktu 30 menit sehari untuk bergerak aktif/olahraga ringan; 2) Memperbanyak minum air putih dan mengurangi konsumsi minuman berpemanis; 3) Mengonsumsi makanan bergizi seimbang; 4) Membatasi waktu di depan gawai (screen time).`
        }
      ],
      materiAjarRingkas: `RINGKASAN MATERI AJAR 1 BAB LENGKAP: ${m.toUpperCase()}
1. Pendahuluan & Hakikat Materi:
   Materi ${m} merupakan kompetensi esensial dalam kurikulum pembelajaran jasmani yang bertujuan mengembangkan keterampilan gerak fundamental, kesadaran kinestetik, dan kapasitas fisik peserta didik.

2. Peta Konsep Pembelajaran 8 Pertemuan:
   - Pertemuan 1: Pengenalan konsep, orientasi gerak, dan kesadaran postur tubuh.
   - Pertemuan 2: Eksplorasi teknik gerak fundamental dan keselamatan fisik.
   - Pertemuan 3: Penghalusan variasi gerak melalui metode sirkuit latihan.
   - Pertemuan 4: Latihan berpasangan, pemecahan masalah teknik, dan saling koreksi.
   - Pertemuan 5: Modifikasi permainan beregu dan adaptasi ruang gerak.
   - Pertemuan 6: Penerapan taktik kolaborasi dan strategi kerja sama tim.
   - Pertemuan 7: Simulasi kompetisi inklusif dan pembiasaan fair play sportif.
   - Pertemuan 8: Asesmen sumatif utuh 1 bab dan refleksi holistik kebugaran.

3. Prinsip Mekanika Gerak & Keselamatan (Safety First):
   - Selalu awali dengan pemanasan dinamis 10-15 menit untuk mengaktifkan sistem neuromuskular.
   - Jaga tumpuan kaki dengan lutut sedikit mengeper saat mendarat untuk meredam beban hentakan.
   - Pastikan hidrasi cairan tubuh cukup sebelum, saat jeda, dan setelah aktivitas selesai.
   - Akhiri setiap sesi dengan pendinginan dan relaksasi pernapasan guna mempercepat pemulihan asam laktat.`,
      pengayaanDanRemedial: {
        remedial: {
          tujuan: `Membantu peserta didik yang belum tuntas menguasai kompetensi gerak pada materi ${m} selama 8 pertemuan.`,
          strategi: [
            {
              nama: 'Analisis Visual & Rekaman Ulang',
              deskripsi: 'Memperlihatkan rekaman video gerakan murid dan membandingkannya dengan model peragaan teknik ideal.'
            },
            {
              nama: 'Diferensiasi Pos Latihan Bertahap (Scaffolding)',
              deskripsi: 'Menurunkan tingkat kesulitan tugas gerak dan memperbanyak repetisi pada gerakan dasar yang belum stabil.'
            },
            {
              nama: 'Pendampingan Berpasangan (Tutor Sebaya)',
              deskripsi: 'Memasangkan murid dengan rekan sekelas yang berkemampuan mahir untuk berlatih secara intensif dan bersahabat.'
            }
          ]
        },
        pengayaan: {
          tujuan: 'Memberikan pengayaan keterampilan lanjutan dan peran kepemimpinan bagi peserta didik yang telah melampaui kriteria capaian.',
          strategi: [
            {
              nama: 'Perancangan Modifikasi Permainan Baru',
              deskripsi: 'Menugaskan murid merancang skenario mini games atau peraturan baru yang menguji taktik beregu.'
            },
            {
              nama: 'Peran Asisten Pengamat & Wasit Lapangan',
              deskripsi: 'Melibatkan murid sebagai asisten pelatih cilik, pencatat lembar unjuk kerja rekan, atau wasit dalam simulasi pertandingan.'
            }
          ]
        }
      },
      refleksi: {
        guru: [
          {
            no: 1,
            aspek: 'Ketercapaian Alur 8 Pertemuan',
            refleksiGuru: 'Apakah seluruh alur pembelajaran dari pertemuan 1 hingga 8 terlaksana sesuai alokasi waktu 16x40 menit?',
            jawaban: ''
          },
          {
            no: 2,
            aspek: 'Penerapan Prinsip Pembelajaran Mendalam',
            refleksiGuru: 'Apakah prinsip Mindful, Meaningful, dan Joyful tercermin secara nyata dalam setiap aktivitas murid di lapangan?',
            jawaban: ''
          },
          {
            no: 3,
            aspek: 'Inklusivitas & Diferensiasi',
            refleksiGuru: 'Apakah seluruh murid dengan latar belakang kemampuan fisik berbeda merasa dilibatkan dan berkembang secara optimal?',
            jawaban: ''
          }
        ],
        pesertaDidik: 'Peserta didik mengisi jurnal refleksi akhir bab untuk mengekspresikan capaian fisik, perkembangan rasa percaya diri, nilai kerja sama yang terbangun, dan komitmen menjaga kebugaran jasmani di rumah.'
      },
      asesmenAwal: `1. Asesmen Diagnostik Kognitif: 5 butir soal pemahaman awal seputar materi ${m}.\n2. Asesmen Diagnostik Non-Kognitif: Cek kesiapan emosi dan kebugaran fisik murid.`,
      asesmenProses: `1. Rubrik Penilaian Sikap (DPL) 4 Skala (Penalaran Kritis, Kolaborasi, Kesehatan, Kemandirian).\n2. Rubrik Penilaian Pengetahuan LKPD Pertemuan 1-8 (4 Skala).\n3. Rubrik Penilaian Keterampilan Praktik Unjuk Kerja 1 Bab (4 Skala).`,
      asesmenAkhir: `1. Asesmen Sumatif Lingkup Materi 5 Butir Soal Pemahaman & Analisis Kontekstual 1 Bab.\n2. Tes Unjuk Kerja Praktik Kombinasi Gerak Mandiri / Beregu.`,
      materiAjar: `Materi Ajar Ringkas 1 Bab Lengkap: Peta konsep 8 pertemuan, urutan teknik pelaksanaan, analisis biomekanika sederhana, dan pembiasaan gaya hidup aktif sehat.`
    },
    lkpdList
  };
}

function getFallbackRPM1Tp(reqBody: any) {
  const { kelas, fase, kelasFaseFormatted } = parseKelasFase(reqBody?.grade, reqBody?.fase);
  const sibiUnit = findMatchingSibiUnit(reqBody?.grade || kelas, reqBody?.materi || reqBody?.bab);
  const m = reqBody?.materi || (sibiUnit ? sibiUnit.pokokMateri : 'Aktivitas Pola Gerak Dasar dan Kebugaran Jasmani');
  const sem = reqBody?.semester || (sibiUnit ? String(sibiUnit.semester) : '1');
  const penyusun = reqBody?.penyusun || 'rafsanjani, S.Pd., Gr.';
  const sekolah = reqBody?.sekolah || 'SD Negeri Kalimantong';
  const tahunAjaran = reqBody?.tahunAjaran || '2026/2027';
  const mataPelajaran = reqBody?.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
  const bab = reqBody?.bab || (sibiUnit ? `${sibiUnit.unitNumber}: ${sibiUnit.unitTitle}` : `Unit 1: ${m}`);
  const countPertemuan = Math.max(1, Math.min(4, parseInt(reqBody?.jumlahPertemuan) || 2));
  const alokasiWaktu = reqBody?.alokasiWaktu || (countPertemuan === 3 ? '6x40 Menit (3 Pertemuan)' : '6x40 Menit (2 Pertemuan)');
  const sibiAct1 = sibiUnit?.aktivitasPembelajaran?.[0] || `Aktivitas Pembelajaran 1: Eksplorasi gerak dasar ${m}`;
  const sibiAct2 = sibiUnit?.aktivitasPembelajaran?.[1] || `Aktivitas Pembelajaran 2: Latihan variasi dan kombinasi gerak ${m}`;
  const sibiAct3 = sibiUnit?.aktivitasPembelajaran?.[2] || `Aktivitas Pembelajaran 3: Penerapan dalam permainan modifikasi ${m}`;

  // Standar CP BSKAP 046/H/KR/2025
  let cpStandar = `Peserta didik mampu menunjukkan kemampuan dalam mempraktikkan, menganalisis, dan membiasakan aktivitas ${m} secara mindful, meaningful, dan joyful sesuai fase perkembangan.`;
  if (fase.includes('Fase A')) {
    cpStandar = `Mempraktikkan keterampilan gerak fundamental dan menerapkannya dalam berbagai situasi gerak yang berbeda; mengeksplorasi berbagai strategi gerak; mengeksplorasi berbagai konsep gerak serta menyimpulkan efektivitasnya; menaati peraturan untuk menumbuhkan fair play; menerapkan strategi kolaborasi; berpartisipasi dalam aktivitas jasmani dan mengidentifikasi manfaatnya; mengenali gaya hidup aktif dan sehat; mengenali komponen makanan bergizi seimbang; serta mengenali situasi berisiko terhadap keselamatan.`;
  } else if (fase.includes('Fase B')) {
    cpStandar = `Menghaluskan keterampilan gerak fundamental dan menerapkannya dalam situasi gerak baru; menyesuaikan strategi gerak untuk mendapatkan capaian keterampilan gerak; memperagakan berbagai konsep gerak; menerapkan strategi gerak sederhana dan memecahkan masalah gerak; menerapkan peraturan untuk fair play; berpartisipasi positif dalam kelompok; mengenali faktor aktivitas menyenangkan; mengenali risiko kesehatan gaya hidup; mengidentifikasi pola makan bergizi seimbang; dan mempraktikkan penanganan cedera ringan prinsip pertolongan pertama.`;
  } else if (fase.includes('Fase C')) {
    cpStandar = `Menyesuaikan keterampilan gerak melintasi berbagai situasi gerak; mentransfer strategi gerak yang sudah dikuasai ke dalam berbagai situasi gerak yang berbeda; menginvestigasi berbagai konsep gerak untuk meningkatkan capaian keterampilan gerak; menguji efektivitas penerapan strategi gerak; merancang peraturan alternatif dan modifikasi permainan untuk mendukung fair play dan partisipasi inklusif; berpartisipasi aktif serta memprediksi faktor preferensi aktivitas jasmani; dan menerapkan pencegahan risiko kesehatan serta pertolongan pertama cedera.`;
  }

  const singleTp = reqBody?.tujuanPembelajaran?.trim() || (sibiUnit?.tujuanPembelajaran?.[0]) || `Murid dapat menganalisis dan mempraktikkan keterampilan gerak ${m} dengan teknik dan sikap tubuh yang benar, aman, serta menunjukkan sportivitas, disiplin, dan kerja sama dalam kelompok (Level Kognitif: Menganalisis/C4 & Menerapkan/C3).`;

  const subTopikList = countPertemuan === 3
    ? [
        `Pertemuan 1: ${sibiAct1}`,
        `Pertemuan 2: ${sibiAct2}`,
        `Pertemuan 3: ${sibiAct3} & Refleksi Ketercapaian TP`
      ]
    : [
        `Pertemuan 1: ${sibiAct1} & ${sibiAct2}`,
        `Pertemuan 2: ${sibiAct3}, Evaluasi Unjuk Kerja, & Refleksi TP`
      ];

  const modelMetodeList = countPertemuan === 3
    ? [
        `Pertemuan 1: Model Problem-Based Learning (Sintaks: 1. Orientasi masalah; 2. Organisasi belajar; 3. Penyelidikan mandiri; 4. Penyajian hasil; 5. Evaluasi proses), Metode Diskusi & Demonstrasi Interaktif.`,
        `Pertemuan 2: Model Cooperative Learning (Sintaks: 1. Penjelasan materi; 2. Kerja kelompok; 3. Uji coba sirkuit berpasangan; 4. Umpan balik; 5. Rekognisi tim), Metode Latihan Sirkuit & Tutor Sebaya.`,
        `Pertemuan 3: Model Game-Based Learning & Authentic Assessment (Sintaks: 1. Pengenalan game; 2. Aturan modifikasi; 3. Pelaksanaan simulasi; 4. Refleksi makna & asesmen unjuk kerja), Metode Permainan Beregu & Refleksi Dialogis.`
      ]
    : [
        `Pertemuan 1: Model Problem-Based Learning (Sintaks: 1. Orientasi masalah; 2. Organisasi belajar; 3. Penyelidikan mandiri; 4. Penyajian hasil; 5. Evaluasi proses), Metode Diskusi & Demonstrasi Interaktif.`,
        `Pertemuan 2: Model Cooperative Learning & Authentic Assessment (Sintaks: 1. Review capaian; 2. Pembagian tim; 3. Praktik kolaboratif; 4. Unjuk kerja autentik; 5. Refleksi solutif), Metode Praktik Beregu & Penilaian Otentik.`
      ];

  const kegiatanIntiPertemuan = subTopikList.map((st, i) => {
    const pNum = i + 1;
    return `### PERTEMUAN ${pNum}: ${st}
Prinsip Pembelajaran: Mindful (Berkesadaran), Meaningful (Bermakna), dan Joyful (Menggembirakan). Durasi: 60 Menit.

Memahami (Sintaks: Orientasi Masalah & Pengorganisasian Belajar) (15 Menit)
1. Guru memperagakan demonstrasi langsung gerakan ${m}, murid mengamati secara seksama dengan kesadaran sensori tubuh yang mendalam (Penalaran Kritis, Kesehatan).
2. Murid mengajukan pertanyaan kritis mengenai prinsip mekanika gerak, posisi tumpuan yang aman, dan efisiensi tenaga (Penalaran Kritis, Komunikasi).
3. Guru mengorganisasikan murid ke dalam kelompok kecil heterogen (4-5 murid) dan membagikan LKPD Pertemuan ${pNum} (Kolaborasi).
4. Murid dalam kelompok berdiskusi mengidentifikasi kunci keberhasilan gerak serta merumuskan pembagian peran latihan yang adil (Kolaborasi, Kemandirian).

Mengaplikasikan (Sintaks: Penyelidikan Mandiri & Praktik Kelompok) (30 Menit)
1. Murid secara bergantian mempraktikkan keterampilan gerak ${m} melalui pos tantangan bertahap dengan penuh antusiasme (Kolaborasi, Kesehatan).
2. Teman sekelompok saling mengamati, memberikan aba-aba hitungan, dan melakukan koreksi teknik gerakan secara santun dan sportif (Komunikasi, Kolaborasi).
3. Murid menyelesaikan tugas studi kasus kontekstual pada LKPD secara disiplin dengan mengutamakan keselamatan bersama (Kemandirian, Kesehatan).
4. Kelompok menguji coba modifikasi aturan gerak sederhana untuk menguji kelincahan dan kerja sama tim secara riang gembira (Kreativitas, Kesehatan).

Merefleksi (Sintaks: Penyajian Hasil & Evaluasi Solusi) (15 Menit)
1. Setiap kelompok memperagakan hasil latihan kombinasi gerak terbaik mereka di depan kelas dengan rasa percaya diri (Kemandirian, Komunikasi).
2. Kelompok rekan memberikan umpan balik apresiatif dan masukan konstruktif terhadap peragaan teknik gerak temannya (Penalaran Kritis, Komunikasi).
3. Guru bersama murid mengevaluasi hambatan fisik dan koordinasi yang dihadapi selama latihan serta merumuskan langkah perbaikan (Penalaran Kritis, Kesehatan).
4. Murid mencatat refleksi personal pada LKPD mengenai makna kebugaran jasmani, sportivitas, dan pengalaman kerja sama tim (Kemandirian, Kesehatan).`;
  }).join('\n\n');

  // Build LKPDs (Non-Table)
  const lkpdList = subTopikList.map((subTopik, idx) => {
    const pNum = idx + 1;
    return {
      pertemuan: `Pertemuan ${pNum}`,
      title: `LKPD Pertemuan ${pNum}: ${subTopik}`,
      content: `LEMBAR KERJA PESERTA DIDIK (LKPD) - PERTEMUAN ${pNum}
Topik: ${m}
Sub Topik: ${subTopik}
Tujuan Pembelajaran: ${singleTp}

1. IDENTITAS DIRI
Nama Peserta Didik : .....................................................
Mata Pelajaran     : ${mataPelajaran}
No. Absen / Kelas  : .......... / ${kelasFaseFormatted}
Hari / Tanggal     : .....................................................

2. PETUNJUK PENGGUNAAN LKPD
a. Berdoalah sebelum memulai aktivitas belajar.
b. Bacalah setiap instruksi kerja dan studi kasus kontekstual dengan cermat.
c. Kenakan seragam olahraga lengkap dan perhatikan keselamatan diri serta teman.
d. Diskusikan tugas bersama teman kelompok secara aktif, santun, dan sportif.
e. Tuliskan jawabanmu dengan jelas dan rapi pada ruang pengerjaan yang tersedia.

3. SINTAKS PEMBELAJARAN & AKTIVITAS SISWA
Model Pembelajaran: ${modelMetodeList[idx].split('(')[0].replace(`Pertemuan ${pNum}: `, '').trim()}
- Langkah 1: Mengamati demonstrasi gerak dan mengidentifikasi fokus masalah teknik.
- Langkah 2: Merumuskan strategi pemecahan masalah bersama teman kelompok.
- Langkah 3: Melakukan penyelidikan praktik langsung di lapangan/pos latihan.
- Langkah 4: Mempresentasikan hasil peragaan dan strategi kelompok kepada teman sekelas.
- Langkah 5: Melakukan evaluasi bersama guru dan menuliskan jurnal refleksi.

4. PENGALAMAN BELAJAR MENDALAM

A. MEMAHAMI (Mindful Learning)
Stimulus Materi:
"Aktivitas gerak ${m} membutuhkan keterhubungan antara konsentrasi pikiran (mindful), kelenturan sendi, dan kekuatan otot. Sikap tumpuan yang benar dan pengaturan pernapasan yang stabil akan menghasilkan gerakan yang efisien sekaligus melindungi tubuh dari risiko cedera."

Pertanyaan Pemahaman:
1) Berdasarkan pengamatanmu, mengapa posisi awal tubuh dan tumpuan kaki sangat menentukan keberhasilan gerakan ${m}?
   Jawaban:
   ....................................................................................................................................................
   ....................................................................................................................................................

2) Sebutkan 2 (dua) kesalahan yang sering terjadi saat mempraktikkan gerakan ini dan bagaimana cara memperbaikinya!
   Jawaban:
   ....................................................................................................................................................
   ....................................................................................................................................................

3) Bagaimana kaitan antara aktivitas fisik ini dengan peningkatan daya tahan jantung serta kesehatan tubuhmu sehari-hari?
   Jawaban:
   ....................................................................................................................................................
   ....................................................................................................................................................

B. MENGAPLIKASIKAN (Meaningful & Joyful Learning)
Tugas Studi Kasus Kontekstual Nyata:
"Bayangkan kelompokmu sedang menghadapi tantangan permainan estafet gerak ${m}. Salah satu teman sekelompok tampak kesulitan menjaga keseimbangan sehingga gerakan terhenti. Strategi kolaborasi apa yang akan kelompokmu terapkan agar teman tersebut dapat berlatih dengan nyaman, aman, dan seluruh tim berhasil menyelesaikan tantangan dengan kompak dan gembira?"

Instruksi Pengerjaan:
1. Diskusikan pembagian peran dan strategi penyesuaian gerak bersama kelompokmu.
2. Praktikkan strategi tersebut sebanyak 2 kali pengulangan latihan.
3. Tuliskan alur strategi kelompok dan solusi untuk teman yang mengalami kesulitan pada ruang di bawah ini!

Ruang Jawaban / Hasil Kerja Siswa:
....................................................................................................................................................
....................................................................................................................................................
....................................................................................................................................................
....................................................................................................................................................
....................................................................................................................................................

C. MEREFLEKSIKAN (Reflective Thinking)
Jawablah pertanyaan refleksi berikut dengan jujur:
1) Pengalaman berharga apa yang paling berkesan bagi dirimu setelah mengikuti aktivitas belajar hari ini?
   Jawaban: .......................................................................................................................................
2) Bagian gerakan mana yang paling menantang bagimu, dan bagaimana caramu mengatasinya?
   Jawaban: .......................................................................................................................................
3) Nilai karakter (misal: sportivitas, gotong royong, kesabaran) apa yang paling kamu rasakan berkembang pada dirimu hari ini?
   Jawaban: .......................................................................................................................................

5. BAGIAN PENUTUP
Pesan Penyemangat:
"Hebat! Kamu telah menunjukkan kerja keras, sportivitas, dan semangat kolaborasi yang luar biasa hari ini. Teruslah bergerak aktif dan jaga kebugaran tubuhmu!"

Cek Pemahaman Diri (Checklist Mandiri):
[  ] Saya telah memahami konsep dasar dan urutan teknik gerakan dengan benar.
[  ] Saya mampu mempraktikkan gerakan secara mandiri dan bersama kelompok.
[  ] Saya aktif berkolaborasi, menghargai teman, dan menjunjung sportivitas.
[  ] Saya merasakan manfaat langsung aktivitas fisik ini bagi kebugaran tubuh saya.

Catatan / Umpan Balik Guru:
....................................................................................................................................................
....................................................................................................................................................`
    };
  });

  return {
    title: 'PERENCANAAN PEMBELAJARAN MENDALAM (RPM) - 1 TUJUAN PEMBELAJARAN',
    identitas: {
      penyusun,
      sekolah,
      tahunAjaran,
      semester: `${sem} (${sem === '1' ? 'Ganjil' : 'Genap'})`,
      mataPelajaran,
      kelasFase: kelasFaseFormatted,
      kelas,
      fase,
      topikElemen: `${bab} / ${m}`,
      bab,
      topik: m,
      alokasiWaktu,
      jumlahPertemuan: countPertemuan
    },
    identifikasi: {
      muridOps: `Identifikasi kesiapan murid sebelum belajar:
1. Pengetahuan Awal: Sebagian murid telah mengenal gerakan dasar terkait materi ${m}, namun penguasaan teknik koordinasi yang aman dan efisien masih memerlukan bimbingan.
2. Minat Belajar: Murid memiliki minat dan antusiasme tinggi pada aktivitas eksploratif langsung, permainan fisik beregu, dan simulasi tantangan yang menyenangkan.
3. Kebutuhan Belajar: Memerlukan peragaan visual bertahap, latihan pos sirkuit dari sederhana ke kompleks, serta pendampingan tutor sebaya yang suportif.`,
      materiPelajaranOps: `Analisis materi pelajaran:
1. Faktual: Ragam bentuk konkret keterampilan gerak ${m} dan contoh pengaplikasiannya dalam olahraga serta aktivitas sehari-hari.
2. Konseptual: Konsep mekanika gerak, pentingnya tumpuan seimbang, koordinasi motorik, dan pengaruh aktivitas fisik terhadap kesehatan jantung.
3. Prosedural: Urutan tahapan gerak sistematis mulai dari sikap awalan, fase pelaksanaan, hingga gerak lanjutan yang aman dari cedera.
4. Metakognitif: Kesadaran murid dalam mengenali batas kapasitas fisik, memantau ritme pernapasan, serta memperbaiki kekeliruan gerak secara mandiri.`,
      dimensiProfilLulusan: [
        'DPL1 Keimanan dan Ketakwaan terhadap Tuhan YME',
        'DPL3 Penalaran Kritis',
        'DPL4 Kreativitas',
        'DPL5 Kolaborasi',
        'DPL6 Kemandirian',
        'DPL7 Kesehatan',
        'DPL8 Komunikasi'
      ],
      identifikasiMurid: `Pengetahuan Awal: Pemahaman awal konsep gerak dasar dan kebiasaan beraktivitas.\nMinat Belajar: Antusiasme tinggi pada aktivitas gerak fisik beregu yang menggembirakan.\nKebutuhan Belajar: Diferensiasi visual, auditori, dan kinestetik bertahap.`,
      materiPelajaran: `Faktual (ragam bentuk gerak nyata), Konseptual (prinsip kebugaran dan koordinasi tubuh), Prosedural (tahapan pelaksanaan teknik yang aman), Metakognitif (evaluasi diri dan pengendalian stamina tubuh).`
    },
    desainPembelajaran: {
      capaianPembelajaranOps: cpStandar,
      lintasDisiplinIlmuOps: `IPAS (Sistem peredaran darah, kerja otot dan persendian), Bahasa Indonesia (Komunikasi santun dalam berdiskusi strategi dan memberi umpan balik), Pendidikan Pancasila (Sportivitas, kolaborasi, saling menghargai perbedaan fisik, dan taat aturan).`,
      tujuanPembelajaran: singleTp,
      topikPembelajaranOps: subTopikList.join('\n'),
      praktikPedagogis: `Pendekatan: Pembelajaran Mendalam (Deep Learning) - Berkesadaran (Mindful), Bermakna (Meaningful), dan Menggembirakan (Joyful).\n\nModel & Metode Pembelajaran Tiap Pertemuan:\n${modelMetodeList.join('\n\n')}`,
      kemitraanPembelajaranOps: `Tutor sebaya (peserta didik mahir mendampingi teman), kolaborasi guru mata pelajaran serumpun, serta pelibatan orang tua dalam membiasakan pola hidup aktif sehat di rumah.`,
      lingkunganPembelajaran: `Area lapangan/ruang terbuka yang bersih, aman, dan kondusif dengan iklim kelas yang menjunjung empati, saling mendukung, dan bebas perundungan.`,
      pemanfaatanDigitalOps: `Penayangan video peragaan gerak slow-motion via tablet/proyektor, stopwatch digital pengukur waktu aktivitas, dan kuis refleksi interaktif.`,
      capaianPembelajaran: cpStandar,
      lintasDisiplinIlmu: `IPAS, Bahasa Indonesia, Pendidikan Pancasila`,
      topikPembelajaran: subTopikList.join('\n'),
      kemitraanPembelajaran: `Tutor sebaya, guru bidang studi, orang tua murid`,
      pemanfaatanDigital: `Video peragaan digital dan kuis refleksi interaktif`
    },
    pengalamanBelajar: {
      langkahPembelajaran: {
        awalOps: {
          prinsip: 'Berkesadaran (Mindful) dan Menggembirakan (Joyful)',
          deskripsi: 'Kegiatan awal durasi 15 menit berorientasi membangun keterhubungan mental, memeriksa kondisi fisik, dan menumbuhkan semangat belajar.'
        },
        inti: {
          prinsipUmum: 'Kegiatan inti durasi 60 menit menerapkan prinsip mindful, meaningful, dan joyful agar murid aktif menggali makna dari materi melalui tahapan Memahami, Mengaplikasikan, dan Merefleksi yang terintegrasi dengan sintaks model pembelajaran.',
          memahami: {
            prinsip: 'Mindful & Meaningful (Orientasi Masalah) (15 Menit)',
            kegiatan: [
              `Guru mengajak murid mengamati demonstrasi langsung atau tayangan video tentang ${m} secara berkesadaran (Penalaran Kritis).`,
              `Murid mengajukan pertanyaan pemantik mengenai teknik posisi awal, tumpuan, dan cara menjaga keseimbangan tubuh yang efektif (Penalaran Kritis, Komunikasi).`,
              `Guru membagi murid ke dalam kelompok kecil heterogen (4-5 murid) dan membagikan LKPD aktivitas gerak (Kolaborasi).`,
              `Murid dalam kelompok berdiskusi mengidentifikasi kunci keberhasilan gerak serta merumuskan strategi latihan bersama (Kolaborasi, Penalaran Kritis).`
            ]
          },
          mengaplikasi: {
            prinsip: 'Meaningful & Joyful (Penyelidikan Mandiri & Kelompok) (30 Menit)',
            kegiatan: [
              `Murid secara berkelompok mempraktikkan keterampilan gerak ${m} melalui pos-pos tantangan bergradasi dengan penuh antusiasme (Kolaborasi, Kesehatan).`,
              `Setiap anggota kelompok saling mengamati, memberikan aba-aba hitungan, dan mengoreksi teknik gerakan teman secara santun dan sportif (Komunikasi, Kolaborasi).`,
              `Murid menyelesaikan tugas kasus nyata pada LKPD secara disiplin dengan mengutamakan keselamatan diri dan rekan kelompok (Kemandirian, Kesehatan).`,
              `Kelompok merancang variasi permainan kecil yang memodifikasi aturan untuk menguji kelincahan dan koordinasi gerak secara riang gembira (Kreativitas, Kesehatan).`
            ]
          },
          merefleksi: {
            prinsip: 'Mindful & Meaningful (Penyajian & Refleksi Solusi) (15 Menit)',
            kegiatan: [
              `Setiap kelompok memperagakan kombinasi gerakan terbaik yang telah dilatih di hadapan kelompok lain dengan rasa percaya diri (Kemandirian, Komunikasi).`,
              `Kelompok lain memberikan tanggapan apresiatif dan masukan konstruktif terhadap peragaan teknik gerak temannya (Penalaran Kritis, Komunikasi).`,
              `Guru bersama murid mengevaluasi kendala gerak yang dihadapi selama latihan serta menemukan solusi perbaikan bersama (Penalaran Kritis, Kesehatan).`,
              `Murid menuliskan kesimpulan refleksi pribadi pada lembar kerja mengenai makna kebugaran dan sportivitas yang dipelajari (Kemandirian, Kesehatan).`
            ]
          }
        },
        penutupOps: {
          prinsip: 'Berkesadaran (Mindful) dan Bermakna (Meaningful)',
          deskripsi: 'Kegiatan penutup durasi 5 menit mencakup pendinginan relaksasi, penarikan kesimpulan bersama, umpan balik konstruktif guru, rencana tindak lanjut, serta doa dan salam.'
        }
      },
      kegiatanAwal: `Prinsip Pembelajaran: Berkesadaran (Mindful) dan Menggembirakan (Joyful). Durasi: 15 Menit.
1. Guru membuka pembelajaran dengan mengucap salam hangat dan menyapa seluruh murid dengan ramah.
2. Guru memandu peserta didik berdoa bersama dipimpin oleh salah satu murid untuk menumbuhkan keimanan (Keimanan dan Ketakwaan terhadap TYME).
3. Guru mengecek kehadiran, memeriksa kerapian seragam olahraga, serta memastikan kondisi kesehatan fisik setiap peserta didik.
4. Guru melakukan apersepsi kontekstual melalui tanya jawab singkat tentang pengalaman gerak murid di rumah dan mengaitkannya dengan topik hari ini (Komunikasi).
5. Guru memberikan motivasi ceria lewat tepuk semangat dan menyampaikan tujuan pembelajaran serta manfaatnya bagi kebugaran tubuh (Kesehatan).`,
      kegiatanInti: kegiatanIntiPertemuan,
      kegiatanPenutup: `Prinsip Pembelajaran: Berkesadaran (Mindful) dan Bermakna (Meaningful). Durasi: 5 Menit.
1. Guru memandu peserta didik melakukan pendinginan (cooling down) santai disertai olah napas teratur untuk merilekskan otot dan menurunkan denyut nadi (Kesehatan).
2. Guru bersama murid menyimpulkan intisari materi pembelajaran hari ini dan mengaitkannya dengan kebiasaan hidup sehat sehari-hari (Penalaran Kritis).
3. Guru memberikan apresiasi terhadap partisipasi aktif serta sportivitas seluruh kelompok, lalu menyampaikan rencana pembelajaran untuk pertemuan berikutnya.
4. Guru mengajak seluruh peserta didik berdoa bersama mengucap syukur, kemudian menutup pembelajaran dengan mengucap salam penutup yang dijawab santun oleh murid.`
    },
    asesmenPembelajaran: {
      awal: 'Jenis: Asesmen Diagnostik (Kognitif & Non-Kognitif). Bentuk: Tanya Jawab Lisan & 5 Butir Pertanyaan Singkat. Teknik: Cek kesiapan belajar fisik dan uji pemahaman awal materi.',
      proses: 'Jenis: Asesmen Formatif. Bentuk: Lembar Observasi Kinerja Praktik & Rubrik Diskusi Kelompok. Teknik: Pengamatan unjuk kerja gerak berkelanjutan, penilaian sikap (DPL), dan penilaian performa LKPD.',
      akhir: 'Jenis: Asesmen Sumatif Lingkup Materi. Bentuk: 5 Butir Soal Pemahaman & Tes Unjuk Kerja Praktik Kombinasi Gerak Mandiri / Beregu. Teknik: Uji performa keterampilan mandiri/beregu dan portofolio refleksi diri.'
    },
    tandaTangan: {
      tempatTanggal: 'Jember, 1 Juli 2025',
      kepalaSekolah: {
        nama: 'Soleh, S.Pd., M.Pd.',
        nip: 'NIP. 19750512 200003 1 004'
      },
      guruMapel: {
        nama: penyusun,
        nip: 'NIP. ........................................'
      }
    },
    lampiran: {
      soalAsesmenAwalList: [
        {
          no: 1,
          pertanyaan: `Apa yang kamu ketahui tentang konsep dan manfaat dari aktivitas ${m}?`,
          kunciJawaban: `Aktivitas fisik yang melatih koordinasi dan kekuatan tubuh untuk meningkatkan kebugaran jasmani dan menjaga kesehatan organ vital.`
        },
        {
          no: 2,
          pertanyaan: 'Mengapa kita wajib melakukan pemanasan (warm-up) sebelum melakukan latihan fisik inti?',
          kunciJawaban: 'Untuk meningkatkan suhu tubuh, memperlancar sirkulasi darah, melenturkan otot dan sendi, serta mencegah terjadinya cedera.'
        },
        {
          no: 3,
          pertanyaan: 'Sebutkan bagian tubuh atau otot utama yang paling aktif bekerja pada saat melakukan gerakan ini!',
          kunciJawaban: 'Otot tungkai/kaki, otot lengan dan bahu, serta otot inti tubuh (core muscles) yang berperan menjaga keseimbangan.'
        },
        {
          no: 4,
          pertanyaan: 'Sikap apa yang harus kamu utamakan saat berlatih mempraktikkan gerakan bersama teman satu kelompok?',
          kunciJawaban: 'Sikap sportivitas, saling menghargai kemampuan teman, bekerja sama secara kompak (kolaborasi), dan menjaga keselamatan bersama.'
        },
        {
          no: 5,
          pertanyaan: 'Bagaimana cara mengatur pernapasan yang tepat saat melakukan aktivitas fisik yang membutuhkan tenaga?',
          kunciJawaban: 'Menghirup napas teratur melalui hidung dan menghembuskannya secara terkontrol melalui mulut tanpa menahan napas.'
        }
      ],
      rubrikSikap: {
        dimensiTerpilih: ['Penalaran Kritis', 'Kolaborasi', 'Kesehatan', 'Kemandirian'],
        aspekList: [
          {
            dimensi: 'Penalaran Kritis',
            indikator: 'Mengidentifikasi kunci keberhasilan gerak dan menganalisis kesalahan teknik.',
            skor4: 'Sangat kritis, mampu menganalisis kesalahan dan memberikan solusi perbaikan dengan tepat.',
            skor3: 'Cukup kritis, mampu menunjukkan kekeliruan gerak dan memahami langkah perbaikan.',
            skor2: 'Mulai menunjukkan pemikiran kritis namun masih membutuhkan bimbingan guru.',
            skor1: 'Belum mampu menganalisis kesalahan gerak atau memberikan tanggapan.'
          },
          {
            dimensi: 'Kolaborasi',
            indikator: 'Bekerja sama, berbagi peran aktif, dan saling membantu dalam latihan kelompok.',
            skor4: 'Selalu aktif bekerja sama, suportif membantu teman, dan berbagi peran secara adil.',
            skor3: 'Sering bekerja sama dengan baik dan bersedia membantu rekan satu kelompok.',
            skor2: 'Kadang-kadang bekerja sama, cenderung pasif jika tidak diarahkan.',
            skor1: 'Tidak mau bekerja sama atau mengganggu keterlaksanaan tugas kelompok.'
          },
          {
            dimensi: 'Kesehatan',
            indikator: 'Menjaga keselamatan diri, mengenakan seragam rapi, dan mempraktikkan gaya hidup aktif.',
            skor4: 'Sangat peduli keselamatan diri & teman, hidrasi teratur, dan menerapkan pemanasan/pendinginan optimal.',
            skor3: 'Peduli keselamatan, mematuhi instruksi pemanasan dan pendinginan dengan baik.',
            skor2: 'Kurang memperhatikan keselamatan, kadang mengabaikan arahan pendinginan.',
            skor1: 'Melakukan tindakan berbahaya yang berisiko cedera bagi diri sendiri atau teman.'
          },
          {
            dimensi: 'Kemandirian',
            indikator: 'Bertanggung jawab atas tugas gerak mandiri dan percaya diri menampilkan kemampuan.',
            skor4: 'Sangat mandiri, berinisiatif tinggi berlatih, dan sangat percaya diri memperagakan gerakan.',
            skor3: 'Mandiri menyelesaikan latihan, percaya diri dan bertanggung jawab atas tugasnya.',
            skor2: 'Memerlukan dorongan guru untuk memulai latihan dan kurang percaya diri.',
            skor1: 'Tidak menunjukkan kemandirian dan enggan mencoba gerakan.'
          }
        ]
      },
      penilaianPengetahuan: {
        judul: 'Rubrik Penilaian Pengetahuan (Pengerjaan LKPD & Pemahaman Konsep)',
        aspekList: [
          'Kelengkapan Jawaban',
          'Ketepatan Konsep Materi',
          'Penyajian Analisis Strategi',
          'Kedalaman Refleksi Diri'
        ],
        pedomanSkor: [
          {
            aspek: 'Kelengkapan Jawaban',
            skor4: 'Semua pertanyaan pemahaman dan studi kasus pada LKPD dijawab tuntas dan lengkap.',
            skor3: 'Sebagian besar pertanyaan dijawab dengan lengkap dan sesuai instruksi.',
            skor2: 'Hanya separuh pertanyaan yang dijawab, beberapa bagian dibiarkan kosong.',
            skor1: 'Hampir seluruh lembar jawaban kosong atau tidak diisi.'
          },
          {
            aspek: 'Ketepatan Konsep Materi',
            skor4: 'Seluruh penjelasan konsep gerak dan fungsi kesehatan sangat tepat dan akurat.',
            skor3: 'Konsep materi dijelaskan dengan benar, hanya ada 1 kekeliruan kecil.',
            skor2: 'Beberapa penjelasan konsep masih keliru atau rancu.',
            skor1: 'Penjelasan konsep salah seluruhnya dan tidak sesuai materi.'
          },
          {
            aspek: 'Penyajian Analisis Strategi',
            skor4: 'Strategi pemecahan masalah disajikan secara logis, aplikatif, dan kontekstual.',
            skor3: 'Strategi yang diajukan cukup logis dan dapat diterapkan dalam latihan.',
            skor2: 'Strategi kurang terstruktur dan sulit diterapkan.',
            skor1: 'Tidak ada strategi yang disajikan atau tidak logis.'
          },
          {
            aspek: 'Kedalaman Refleksi Diri',
            skor4: 'Memberikan refleksi yang mendalam, jujur, dan menunjukkan kesadaran diri tinggi.',
            skor3: 'Memberikan jawaban reflektif yang cukup jelas dan bermakna.',
            skor2: 'Jawaban refleksi masih sangat umum dan singkat.',
            skor1: 'Tidak mengisi refleksi atau jawaban tidak relevan.'
          }
        ],
        rumusNilai: 'Nilai Akhir = (Jumlah Skor Diperoleh / 16) × 100'
      },
      penilaianKeterampilan: {
        judul: 'Rubrik Penilaian Keterampilan Unjuk Kerja Praktik Gerak',
        aspekList: [
          'Teknik Sikap Awalan & Tumpuan',
          'Koordinasi Fase Gerakan Inti',
          'Sikap Akhir & Keseimbangan',
          'Penerapan Nilai Sportivitas & Kerjasama'
        ],
        pedomanSkor: [
          {
            aspek: 'Teknik Sikap Awalan & Tumpuan',
            skor4: 'Sikap awalan tubuh seimbang, posisi kaki/tumpuan sangat akurat dan mantap.',
            skor3: 'Sikap awalan cukup baik dan seimbang, tumpuan tepat.',
            skor2: 'Sikap awalan kurang seimbang, posisi tumpuan masih sering keliru.',
            skor1: 'Sikap awalan salah total dan tidak menunjukkan kesiapan gerak.'
          },
          {
            aspek: 'Koordinasi Fase Gerakan Inti',
            skor4: 'Gerakan mengalir luwes, irama gerak terkoordinasi sempurna, dan bertenaga.',
            skor3: 'Gerakan inti cukup terkoordinasi dengan baik, teknik sesuai tahapan.',
            skor2: 'Gerakan inti kaku atau terputus-putus, koordinasi kurang harmonis.',
            skor1: 'Tidak mampu melakukan koordinasi gerakan inti dengan benar.'
          },
          {
            aspek: 'Sikap Akhir & Keseimbangan',
            skor4: 'Pendaratan/posisi akhir sangat stabil, terkontrol, dan aman dari cedera.',
            skor3: 'Posisi akhir stabil dan terkontrol dengan baik.',
            skor2: 'Posisi akhir goyah, hampir kehilangan keseimbangan tubuh.',
            skor1: 'Kehilangan keseimbangan sepenuhnya atau terjatuh.'
          },
          {
            aspek: 'Penerapan Nilai Sportivitas & Kerjasama',
            skor4: 'Sangat sportif, mematuhi semua aturan permainan, dan aktif menyemangati teman.',
            skor3: 'Sportif, menghargai aturan dan bekerja sama dengan baik bersama kelompok.',
            skor2: 'Kurang sportif dalam permainan atau sesekali melanggar aturan.',
            skor1: 'Tidak sportif, bersikap curang, atau menolak mengikuti aturan.'
          }
        ],
        rumusNilai: 'Nilai Akhir = (Jumlah Skor Diperoleh / 16) × 100'
      },
      soalAsesmenAkhirList: [
        {
          no: 1,
          pertanyaan: `Jelaskan secara komprehensif konsep dasar, variasi pola gerak, dan prinsip pelaksanaan aktivitas ${m}!`,
          kunciJawaban: `Menjelaskan pengertian, ragam variasi gerak, posisi tubuh yang benar, dan prinsip keselamatan gerak secara sistematis.`
        },
        {
          no: 2,
          pertanyaan: `Bagaimana cara mengatasi kendala teknis dan menjaga ritme keseimbangan saat melakukan rangkaian aktivitas ${m}?`,
          kunciJawaban: `Memusatkan perhatian (mindful), mengatur napas teratur, menyesuaikan tumpuan kaki, dan melakukan penyesuaian strategi gerak.`
        },
        {
          no: 3,
          pertanyaan: `Analisis dampak jangka panjang dari pembiasaan aktivitas fisik ${m} terhadap kebugaran jasmani dan kesehatan organ vital!`,
          kunciJawaban: `Meningkatkan kapasitas kardiorespirasi (daya tahan paru-jantung), menguatkan massa otot, kelenturan sendi, dan imunitas tubuh.`
        },
        {
          no: 4,
          pertanyaan: `Rancanglah sebuah modifikasi peraturan permainan atau strategi tim yang menerapkan nilai sportivitas (fair play) dan inklusif!`,
          kunciJawaban: `Modifikasi lapangan/alat yang memberi kesempatan setara bagi semua anggota tanpa diskriminasi, serta mengutamakan keselamatan.`
        },
        {
          no: 5,
          pertanyaan: `Tuliskan refleksi evaluasi diri tentang perkembangan keterampilan, kedisiplinan, dan kerja sama tim yang Anda capai dalam pembelajaran ${m}!`,
          kunciJawaban: `Refleksi jujur mengenai peningkatan teknik gerak, kemampuan mengelola emosi dalam kompetisi, dan kontribusi aktif dalam kelompok.`
        }
      ],
      materiAjarRingkas: `RINGKASAN MATERI AJAR: ${m.toUpperCase()}
1. Pengertian & Konsep Dasar:
   ${m} merupakan bagian integral dari aktivitas kebugaran jasmani yang bertujuan meningkatkan keterampilan koordinasi, kekuatan otot, kelenturan, serta kesadaran ruang dan tubuh (kinestetik).
2. Manfaat bagi Kebugaran Jasmani:
   - Meningkatkan daya tahan jantung dan paru-paru (kardiorespirasi).
   - Memperkuat struktur tulang dan melatih elastisitas persendian.
   - Membantu mempertahankan postur tubuh yang ideal dan proporsional.
   - Mengurangi rasa lelah serta meningkatkan konsentrasi belajar di kelas.
3. Prinsip Keselamatan Gerak (Safety First):
   - Wajib melakukan pemanasan terarah selama 10-15 menit sebelum aktivitas intens.
   - Perhatikan posisi tumpuan kaki dan pendaratan agar tidak mencederai sendi lutut atau pergelangan kaki.
   - Penuhi kebutuhan cairan tubuh (minum air putih yang cukup) saat jeda latihan.
   - Lakukan pendinginan untuk membantu pemulihan otot dan mencegah nyeri otot.`,
      pengayaanDanRemedial: {
        remedial: {
          tujuan: `Membantu peserta didik yang belum mencapai ketuntasan kompetensi gerak pada materi ${m}.`,
          strategi: [
            {
              nama: 'Pendekatan Kontekstual & Visual',
              deskripsi: 'Memberikan demonstrasi ulang gerakan dalam tempo lambat dengan bantuan video slow-motion.'
            },
            {
              nama: 'Bimbingan Bertahap (Scaffolding)',
              deskripsi: 'Memecah tahapan gerakan menjadi segmen-segmen lebih sederhana sebelum menggabungkannya.'
            },
            {
              nama: 'Tutor Sebaya',
              deskripsi: 'Memasangkan murid yang kesulitan dengan teman sekelas yang sudah mahir untuk berlatih berpasangan.'
            }
          ]
        },
        pengayaan: {
          tujuan: 'Memberikan tantangan perluasan keterampilan dan kepemimpinan bagi peserta didik berkemampuan tinggi.',
          strategi: [
            {
              nama: 'Kreasi Variasi Permainan',
              deskripsi: 'Menugaskan murid merancang 2 variasi tantangan permainan mini baru yang lebih dinamis.'
            },
            {
              nama: 'Peran Wasit & Asisten Pengamat',
              deskripsi: 'Memberi kesempatan menjadi pemimpin tim atau pengamat catatan unjuk kerja teman.'
            }
          ]
        }
      },
      refleksi: {
        guru: [
          {
            no: 1,
            aspek: 'Ketercapaian Tujuan Pembelajaran (1 TP)',
            refleksiGuru: 'Apakah seluruh murid mencapai kompetensi yang ditargetkan dalam 1 TP ini secara optimal?',
            jawaban: ''
          },
          {
            no: 2,
            aspek: 'Keterlibatan Murid (Joyful & Mindful)',
            refleksiGuru: 'Apakah murid terlibat aktif, gembira, dan berkesadaran tinggi saat mempraktikkan aktivitas?',
            jawaban: ''
          },
          {
            no: 3,
            aspek: 'Diferensiasi & Inklusivitas',
            refleksiGuru: 'Apakah diferensiasi proses dan tugas mampu memfasilitasi keragaman kemampuan fisik murid?',
            jawaban: ''
          }
        ],
        pesertaDidik: 'Menutup pembelajaran dengan refleksi diri menggunakan lembar ceklis jurnal refleksi mengenai pengalaman gerak dan perasaan belajar hari ini.'
      },
      asesmenAwal: `1. Asesmen Diagnostik Kognitif: 5 butir soal pemahaman awal seputar materi ${m}.\n2. Asesmen Diagnostik Non-Kognitif: Cek kesiapan emosi dan kebugaran fisik murid.`,
      asesmenProses: `1. Rubrik Penilaian Sikap (DPL) 4 Skala (Penalaran Kritis, Kolaborasi, Kesehatan, Kemandirian).\n2. Rubrik Penilaian Pengetahuan LKPD 4 Skala.\n3. Rubrik Penilaian Keterampilan Praktik Unjuk Kerja 4 Skala.`,
      asesmenAkhir: `1. Asesmen Sumatif Lingkup Materi 5 Butir Soal Pemahaman & Analisis Kontekstual.\n2. Tes Unjuk Kerja Praktik Kombinasi Gerak Mandiri / Beregu.`,
      materiAjar: `Materi Ajar Ringkas: Konsep esensial, urutan teknik pelaksanaan, analisis biomekanika sederhana, dan pembiasaan gaya hidup aktif sehat.`
    },
    lkpdList
  };
}

function getFallbackRPM1Pertemuan(reqBody: any) {
  const { kelas, fase, kelasFaseFormatted } = parseKelasFase(reqBody?.grade, reqBody?.fase);
  const sibiUnit = findMatchingSibiUnit(reqBody?.grade || kelas, reqBody?.materi || reqBody?.bab);
  const m = reqBody?.materi || (sibiUnit ? sibiUnit.pokokMateri : 'Aktivitas Pola Gerak Dasar dan Kebugaran Jasmani');
  const sem = reqBody?.semester || (sibiUnit ? String(sibiUnit.semester) : '1');
  const penyusun = reqBody?.penyusun || 'Lendi Ike Hermawan, S.Pd., Gr.';
  const sekolah = reqBody?.sekolah || 'SD Negeri Kalimantong';
  const tahunAjaran = reqBody?.tahunAjaran || '2026/2027';
  const mataPelajaran = reqBody?.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
  const bab = reqBody?.bab || (sibiUnit ? `${sibiUnit.unitCode}: ${sibiUnit.unitTitle}` : `Unit 1: ${m}`);
  const alokasiWaktu = reqBody?.alokasiWaktu || '2x40 Menit';
  const sibiWarmup = sibiUnit ? sibiUnit.pemanasanPermainan : 'Permainan Tradisional Kejar-kejaran & Menjala Ikan';
  const sibiAct1 = sibiUnit?.aktivitasPembelajaran?.[0] || `Aktivitas Pembelajaran 1: Eksplorasi gerak dasar dan teknik tumpuan ${m}`;
  const sibiAct2 = sibiUnit?.aktivitasPembelajaran?.[1] || `Aktivitas Pembelajaran 2: Latihan variasi dan kombinasi gerak ${m} secara berpasangan/berkelompok`;
  const sibiAct3 = sibiUnit?.aktivitasPembelajaran?.[2] || `Aktivitas Pembelajaran 3: Penerapan keterampilan ${m} dalam permainan sederhana yang dimodifikasi`;
  const sibiSource = sibiUnit?.sumberBukuSibi || 'Muhajir & Agus Gunawan (2022). Buku Panduan Guru PJOK SD/MI. Jakarta: Pusat Perbukuan BSKAP Kemendikdasmen RI (SIBI - buku.kemendikdasmen.go.id)';

  let cpStandar = `Peserta didik mampu menunjukkan kemampuan dalam mempraktikkan, menganalisis, dan membiasakan aktivitas ${m} secara mindful, meaningful, dan joyful sesuai fase perkembangan.`;
  if (fase.includes('Fase A')) {
    cpStandar = `Mempraktikkan keterampilan gerak fundamental dan menerapkannya dalam berbagai situasi gerak yang berbeda; mengeksplorasi berbagai strategi gerak; mengeksplorasi berbagai konsep gerak serta menyimpulkan efektivitasnya; menaati peraturan untuk menumbuhkan fair play; menerapkan strategi kolaborasi; berpartisipasi dalam aktivitas jasmani dan mengidentifikasi manfaatnya; mengenali gaya hidup aktif dan sehat; mengenali komponen makanan bergizi seimbang; serta mengenali situasi berisiko terhadap keselamatan.`;
  } else if (fase.includes('Fase B')) {
    cpStandar = `Menghaluskan keterampilan gerak fundamental dan menerapkannya dalam situasi gerak baru; menyesuaikan strategi gerak untuk mendapatkan capaian keterampilan gerak; memperagakan berbagai konsep gerak; menerapkan strategi gerak sederhana dan memecahkan masalah gerak; menerapkan peraturan untuk fair play; berpartisipasi positif dalam kelompok; mengenali faktor aktivitas menyenangkan; mengenali risiko kesehatan gaya hidup; mengidentifikasi pola makan bergizi seimbang; dan mempraktikkan penanganan cedera ringan prinsip pertolongan pertama.`;
  } else if (fase.includes('Fase C')) {
    cpStandar = `Menyesuaikan keterampilan gerak melintasi berbagai situasi gerak; mentransfer strategi gerak yang sudah dikuasai ke dalam berbagai situasi gerak yang berbeda; menginvestigasi berbagai konsep gerak untuk meningkatkan capaian keterampilan gerak; menguji efektivitas penerapan strategi gerak; merancang peraturan alternatif dan modifikasi permainan untuk mendukung fair play dan partisipasi inklusif; berpartisipasi aktif serta memprediksi faktor preferensi aktivitas jasmani; dan menerapkan pencegahan risiko kesehatan serta pertolongan pertama cedera.`;
  } else if (fase.includes('Fase D')) {
    cpStandar = `Menganalisis keterampilan gerak dan menyusun strategi gerak dalam situasi permainan atau aktivitas jasmani; mengevaluasi efektivitas penerapan konsep dan taktik; memimpin dan mengoordinasikan tim untuk mendukung fair play dan keselamatan; serta merencanakan dan memelihara gaya hidup aktif dan kebugaran jasmani pribadi secara konsisten.`;
  }

  const singleTp = reqBody?.tujuanPembelajaran?.trim() || (sibiUnit?.tujuanPembelajaran?.[0]) || `Murid dapat menganalisis dan mempraktikkan teknik dasar gerak ${m} dengan koordinasi tubuh yang tepat, aman, serta menunjukkan sikap sportivitas, disiplin, dan kerja sama dalam kelompok (Level Kognitif: Menganalisis/C4 & Menerapkan/C3).`;

  const lkpd1 = {
    pertemuan: 'Pertemuan 1',
    title: `LKPD (SIBI): ${m}`,
    content: `LEMBAR KERJA PESERTA DIDIK (LKPD) - PERTEMUAN 1
Acuan Buku Panduan Guru SIBI: ${sibiSource}
Mata Pelajaran     : ${mataPelajaran}
Kelas / Semester   : ${kelasFaseFormatted} / ${sem} (${sem === '1' ? 'Ganjil' : 'Genap'})
Unit / Bab         : ${bab}
Topik Pembelajaran : ${m}
Alokasi Waktu      : ${alokasiWaktu}

1. IDENTITAS DIRI
Nama Peserta Didik : .....................................................
Nomor Absen        : ..........
Kelas              : ${kelasFaseFormatted}
Hari / Tanggal     : .....................................................

2. PETUNJUK PENGGUNAAN LKPD
a. Berdoalah sebelum memulai pembelajaran dan aktivitas gerak.
b. Bacalah setiap instruksi kerja dan kartu tugas sesuai Buku Panduan Guru PJOK SIBI dengan cermat.
c. Kenakan pakaian olahraga lengkap dan patuhi prosedur keselamatan fisik di lapangan.
d. Diskusikan tantangan gerak bersama teman kelompok secara aktif, santun, dan sportif.
e. Tuliskan hasil analisis, pengamatan, dan jawabanmu pada ruang yang telah disediakan secara jujur dan rapi.

3. SINTAKS PEMBELAJARAN & AKTIVITAS SISWA (BUKU PANDUAN GURU SIBI)
Model Pembelajaran: Problem-Based Learning (PBL) & Teaching Games for Understanding (TGfU)
- Pemanasan Permainan Kecil: ${sibiWarmup}.
- ${sibiAct1}.
- ${sibiAct2}.
- ${sibiAct3}.
- Pendinginan, Evaluasi & Refleksi.

4. PENGALAMAN BELAJAR MENDALAM

A. MEMAHAMI (Mindful Learning)
Stimulus Materi (Buku Panduan Guru PJOK SIBI):
"Aktivitas gerak ${m} pada ${bab} membutuhkan kesadaran sensori tubuh yang mendalam (mindful). Menjaga postur tubuh yang seimbang, tumpuan kaki yang kokoh, dan pengaturan ritme pernapasan yang teratur sesuai tahapan Aktivitas Pembelajaran 1, 2, dan 3 Buku SIBI adalah kunci utama menghasilkan gerakan yang efektif serta aman dari risiko cedera."

Pertanyaan Pemahaman:
1) Mengapa sikap tumpuan awal dan posisi keseimbangan tubuh sangat menentukan keberhasilan gerakan ${m}?
   Jawaban:
   ....................................................................................................................................................
   ....................................................................................................................................................

2) Sebutkan 2 (dua) kesalahan umum yang sering terjadi saat melakukan gerakan ${m} dan bagaimana cara memperbaikinya!
   Jawaban:
   ....................................................................................................................................................
   ....................................................................................................................................................

3) Bagaimana kaitan antara aktivitas fisik ${m} dengan peningkatan kebugaran kardiorespirasi dan daya tahan tubuhmu?
   Jawaban:
   ....................................................................................................................................................
   ....................................................................................................................................................

B. MENGAPLIKASIKAN (Meaningful & Joyful Learning)
Tugas Studi Kasus Kontekstual Nyata:
"Dalam simulasi ${sibiAct3}, salah seorang teman di kelompokmu tampak gugup dan kesulitan mempertahankan keseimbangan saat fase pelaksanaan sehingga regu tertinggal. Strategi kolaborasi dan komunikasi sportif apa yang akan kelompokmu terapkan agar teman tersebut dapat berlatih dengan nyaman, aman, percaya diri, dan kelompok berhasil mencapai target tantangan dengan gembira?"

Instruksi Pengerjaan:
1. Diskusikan alur pembagian tugas dan penyesuaian strategi gerak bersama anggota kelompok.
2. Lakukan latihan percobaan bersama minimal 2 kali pengulangan dengan saling memberikan aba-aba hitungan.
3. Tuliskan ringkasan solusi kolaboratif kelompokmu pada ruang jawaban di bawah ini!

Ruang Jawaban / Hasil Kerja Siswa:
....................................................................................................................................................
....................................................................................................................................................
....................................................................................................................................................
....................................................................................................................................................
....................................................................................................................................................

C. MEREFLEKSIKAN (Reflective Thinking)
Jawablah pertanyaan refleksi berikut dengan jujur:
1) Hal baru dan paling berharga apa yang kamu pelajari dan rasakan setelah mengikuti aktivitas pembelajaran hari ini?
   Jawaban: .......................................................................................................................................
2) Pada bagian gerakan mana kamu merasa paling tertantang, dan usaha apa yang kamu lakukan untuk memperbaikinya?
   Jawaban: .......................................................................................................................................
3) Nilai karakter apa (misal: sportivitas, gotong royong, kemandirian) yang paling berkembang dalam dirimu hari ini?
   Jawaban: .......................................................................................................................................

5. BAGIAN PENUTUP
Pesan Penyemangat:
"Hebat! Kamu telah menunjukkan kerja keras, sportivitas, dan semangat kolaborasi yang luar biasa hari ini sesuai panduan PJOK SIBI. Teruslah bergerak aktif dan jaga kebugaran tubuhmu!"

Cek Pemahaman Diri (Checklist Mandiri Buku SIBI):
[  ] Saya telah memahami konsep dasar dan urutan teknik gerak (${sibiAct1}) dengan benar.
[  ] Saya mampu mempraktikkan gerakan secara berpasangan/berkelompok (${sibiAct2}) secara aman.
[  ] Saya aktif berkolaborasi dan menjunjung fair play dalam permainan modifikasi (${sibiAct3}).
[  ] Saya merasakan peningkatan kebugaran fisik dan kegembiraan selama berolahraga.

Catatan / Umpan Balik Guru:
....................................................................................................................................................
....................................................................................................................................................`
  };

  return {
    title: `PERENCANAAN PEMBELAJARAN MENDALAM (RPM) - 1 PERTEMUAN (${alokasiWaktu.toUpperCase()}) - BUKU PANDUAN GURU SIBI`,
    identitas: {
      penyusun,
      sekolah,
      tahunAjaran,
      semester: `${sem} (${sem === '1' ? 'Ganjil' : 'Genap'})`,
      mataPelajaran,
      kelasFase: kelasFaseFormatted,
      kelas,
      fase,
      topikElemen: `${bab} / ${m}`,
      bab,
      topik: m,
      alokasiWaktu,
      jumlahPertemuan: 1
    },
    identifikasi: {
      muridOps: `Identifikasi kesiapan murid sebelum belajar (1 Pertemuan - Acuan Buku Panduan Guru PJOK SIBI):
1. Pengetahuan Awal: Sebagian besar murid telah mengenal gerakan dasar terkait materi ${m}, namun pemahaman biomekanika tumpuan kaki yang aman dan ritme pernapasan yang efisien masih bervariasi.
2. Minat Belajar: Murid menunjukkan antusiasme tinggi pada pemanasan permainan kecil (${sibiWarmup}), simulasi mini games beregu yang adil, serta tantangan gerak eksploratif.
3. Kebutuhan Belajar: Memerlukan peragaan kartu tugas (task sheet) Buku SIBI, diferensiasi pos latihan bertahap (Aktivitas Pembelajaran 1, 2, dan 3), serta bimbingan tutor sebaya yang suportif.`,
      materiPelajaranOps: `Analisis materi pelajaran berdasarkan Buku Panduan Guru PJOK SIBI (${sibiSource}):
1. Faktual: Ragam bentuk konkret keterampilan gerak ${m} dan penerapannya dalam aktivitas jasmani sehari-hari.
2. Konseptual: Prinsip koordinasi motorik, hukum aksi-reaksi pada tumpuan lantai, dan pengaruh aktivitas fisik terhadap denyut nadi dan kebugaran jantung.
3. Prosedural: Urutan langkah teknik gerak sesuai Buku SIBI: (a) ${sibiAct1}; (b) ${sibiAct2}; (c) ${sibiAct3}.
4. Metakognitif: Kesadaran murid dalam memonitor detak jantung, mengatur ritme pernapasan, serta mengenali dan mengoreksi kekeliruan gerak diri sendiri.`,
      dimensiProfilLulusan: [
        'DPL1 Keimanan dan Ketakwaan terhadap Tuhan YME',
        'DPL2 Kewargaan',
        'DPL3 Penalaran Kritis',
        'DPL4 Kreativitas',
        'DPL5 Kolaborasi',
        'DPL6 Kemandirian',
        'DPL7 Kesehatan',
        'DPL8 Komunikasi'
      ],
      identifikasiMurid: `Pengetahuan Awal: Pemahaman awal konsep gerak dasar dan kebiasaan beraktivitas.\nMinat Belajar: Antusiasme tinggi pada pemanasan permainan kecil (${sibiWarmup}) dan aktivitas gerak fisik beregu.\nKebutuhan Belajar: Diferensiasi visual, auditori, dan kinestetik bertahap sesuai Buku Panduan Guru PJOK SIBI.`,
      materiPelajaran: `Faktual (ragam bentuk gerak nyata), Konseptual (prinsip kebugaran dan koordinasi tubuh), Prosedural (${sibiAct1}; ${sibiAct2}; ${sibiAct3}), Metakognitif (evaluasi diri dan pengendalian stamina tubuh).`
    },
    desainPembelajaran: {
      capaianPembelajaranOps: cpStandar,
      lintasDisiplinIlmuOps: `IPAS (Sistem peredaran darah, mekanisme kontraksi otot, dan struktur tulang rangka), Bahasa Indonesia (Keterampilan komunikasi santun saat berdiskusi dan memberikan umpan balik gerak), Pendidikan Pancasila (Penanaman nilai sportivitas, gotong royong, ketaatan pada aturan bersama, dan penghargaan atas perbedaan individu).`,
      tujuanPembelajaran: singleTp,
      topikPembelajaranOps: `${bab} — ${m}`,
      praktikPedagogis: `Pendekatan: Pembelajaran Mendalam (Deep Learning) berorientasi Berkesadaran (Mindful), Bermakna (Meaningful), dan Menggembirakan (Joyful) terintegrasi Buku Panduan Guru PJOK SIBI.
Model: Problem-Based Learning (PBL) & Teaching Games for Understanding (TGfU)
Sintaks Model: 1. Orientasi masalah & pengenalan konsep gerak; 2. Organisasi belajar & pemanasan permainan kecil (${sibiWarmup}); 3. Penyelidikan mandiri & kelompok (${sibiAct1} & ${sibiAct2}); 4. Pengembangan & aplikasi permainan modifikasi (${sibiAct3}); 5. Analisis, pendinginan & evaluasi pemecahan masalah.
Metode: Demonstrasi interaktif, latihan pos stasiun berputar (circuit practice), permainan modifikasi Buku SIBI, dan refleksi dialogis.
Sumber Utama: ${sibiSource}`,
      kemitraanPembelajaranOps: `Tutor sebaya (peserta didik mahir mendampingi rekan), kolaborasi antar guru serumpun PJOK, tim UKS/tenaga medis, serta pelibatan orang tua dalam membiasakan olahraga teratur dan sarapan sehat di rumah.`,
      lingkunganPembelajaran: `Area lapangan olahraga sekolah dan ruang terbuka yang bersih, aman, bebas hambatan fisik berbahaya, dengan iklim kelas yang inklusif, ramah anak, saling menghargai, dan menjunjung tinggi budaya fair play.`,
      pemanfaatanDigitalOps: `Pemanfaatan Buku Teks / Panduan Guru Digital dari platform SIBI Kemendikdasmen (https://buku.kemendikdasmen.go.id), penayangan video gerak slow-motion, dan aplikasi stopwatch digital.`,
      capaianPembelajaran: cpStandar,
      lintasDisiplinIlmu: `IPAS, Bahasa Indonesia, Pendidikan Pancasila`,
      topikPembelajaran: `${bab} — ${m}`,
      kemitraanPembelajaran: `Tutor sebaya, guru serumpun, tim UKS, dan orang tua`,
      pemanfaatanDigital: `Platform Buku Digital SIBI (buku.kemendikdasmen.go.id), video gerak slow-motion, dan stopwatch digital`
    },
    pengalamanBelajar: {
      langkahPembelajaran: {
        awalOps: {
          prinsip: 'Berkesadaran (Mindful) dan Menggembirakan (Joyful)',
          deskripsi: `Kegiatan awal durasi 15 menit berorientasi mengondisikan fisik dan mental, memeriksa kesiapan belajar, serta pemanasan permainan kecil sesuai Buku SIBI (${sibiWarmup}).`
        },
        inti: {
          prinsipUmum: 'Kegiatan inti durasi 60 menit menerapkan prinsip mindful, meaningful, dan joyful melalui tahapan Memahami (Aktivitas 1 SIBI), Mengaplikasikan (Aktivitas 2 & 3 SIBI), dan Merefleksi.',
          memahami: {
            prinsip: 'Mindful & Meaningful (Orientasi Masalah & Aktivitas Pembelajaran 1 Buku SIBI) (15 Menit)',
            kegiatan: [
              `Guru memperagakan demonstrasi langsung dan kartu tugas Buku Panduan Guru PJOK SIBI untuk ${sibiAct1}, murid mengamati secara saksama dengan penuh konsentrasi (Penalaran Kritis, Kesehatan).`,
              `Murid mengajukan pertanyaan kritis mengenai prinsip mekanika gerak, efisiensi tenaga, dan titik tumpuan kaki yang aman dari risiko cedera (Penalaran Kritis, Komunikasi).`,
              `Guru mengorganisasikan murid ke dalam kelompok kecil heterogen (4-5 murid) serta membagikan Lembar Kerja Peserta Didik (LKPD) (Kolaborasi).`,
              `Murid dalam kelompok mencoba eksplorasi gerak dasar (${sibiAct1}) sambil mengidentifikasi kunci keberhasilan gerak secara adil (Kolaborasi, Kemandirian).`
            ]
          },
          mengaplikasi: {
            prinsip: 'Meaningful & Joyful (Aktivitas Pembelajaran 2 & 3 Buku SIBI) (30 Menit)',
            kegiatan: [
              `Murid secara berpasangan dan berkelompok mempraktikkan ${sibiAct2} melalui pos-pos tantangan bergradasi dengan penuh antusiasme dan kegembiraan (Kolaborasi, Kesehatan).`,
              `Setiap anggota kelompok saling mengamati, memberikan aba-aba hitungan, dan melakukan koreksi teknik gerakan teman secara santun dan sportif (Komunikasi, Kolaborasi).`,
              `Murid menerapkan keterampilan gerak dalam ${sibiAct3} dengan mematuhi peraturan fair play dan mengutamakan keselamatan bersama (Kemandirian, Kesehatan).`,
              `Kelompok menyelesaikan tugas pemecahan studi kasus kontekstual pada LKPD berdasarkan pengalaman permainan modifikasi secara riang gembira (Kreativitas, Kesehatan).`
            ]
          },
          merefleksi: {
            prinsip: 'Mindful & Meaningful (Penyajian Hasil & Evaluasi Solusi Buku SIBI) (15 Menit)',
            kegiatan: [
              `Setiap kelompok memperagakan hasil latihan variasi gerak terbaik mereka di depan kelas dengan rasa percaya diri dan sportif (Kemandirian, Komunikasi).`,
              `Kelompok lain memberikan tanggapan apresiatif dan masukan konstruktif terhadap peragaan teknik gerak kelompok temannya (Penalaran Kritis, Komunikasi).`,
              `Guru bersama murid mengevaluasi hambatan fisik dan koordinasi yang dihadapi selama Aktivitas Pembelajaran 1, 2, dan 3 serta mendiskusikan kiat perbaikannya (Penalaran Kritis, Kesehatan).`,
              `Murid menuliskan refleksi personal pada LKPD mengenai makna kebugaran jasmani, sportivitas, dan pengalaman kerja sama tim yang telah dialami (Kemandirian, Kesehatan).`
            ]
          }
        },
        penutupOps: {
          prinsip: 'Berkesadaran (Mindful) dan Bermakna (Meaningful)',
          deskripsi: 'Kegiatan penutup durasi 5 menit mencakup pendinginan relaksasi sesuai Buku SIBI, penarikan kesimpulan bersama, apresiasi sportivitas, rencana tindak lanjut, doa, dan salam.'
        }
      },
      kegiatanAwal: `Prinsip Pembelajaran: Berkesadaran (Mindful) dan Menggembirakan (Joyful). Durasi: 15 Menit.
1. Guru membuka pembelajaran di lapangan dengan mengucap salam hangat dan menyapa seluruh murid dengan riang gembira.
2. Guru memandu peserta didik berdoa bersama dipimpin oleh salah satu murid untuk menumbuhkan keimanan (Keimanan dan Ketakwaan terhadap TYME).
3. Guru mengecek kehadiran, memeriksa kerapian seragam olahraga, dan memastikan kondisi kesehatan fisik setiap peserta didik.
4. Guru melakukan apersepsi kontekstual sesuai Buku Panduan Guru PJOK SIBI melalui tanya jawab singkat tentang pengalaman gerak tubuh sehari-hari dan menyampaikan Tujuan Pembelajaran (Komunikasi).
5. Guru mengajak murid melakukan pemanasan dinamis yang dikemas dalam bentuk permainan kecil sesuai Buku Panduan Guru SIBI yaitu: ${sibiWarmup} untuk menaikkan denyut nadi secara aman dan gembira (Kesehatan, Kolaborasi).`,
      kegiatanInti: `Prinsip Pembelajaran: Mindful (Berkesadaran), Meaningful (Bermakna), dan Joyful (Menggembirakan). Durasi: 60 Menit.

Memahami (Sintaks Orientasi Masalah & Aktivitas Pembelajaran 1 Buku SIBI) (15 Menit)
1. Guru memperagakan demonstrasi langsung dan kartu tugas Buku Panduan Guru PJOK SIBI untuk ${sibiAct1}, murid mengamati secara saksama dengan penuh konsentrasi dan kesadaran sensori tubuh (Penalaran Kritis, Kesehatan).
2. Murid mengajukan pertanyaan kritis mengenai prinsip mekanika gerak, efisiensi tenaga, dan titik tumpuan kaki yang aman dari risiko cedera (Penalaran Kritis, Komunikasi).
3. Guru mengorganisasikan murid ke dalam kelompok kecil heterogen (4-5 murid) serta membagikan Lembar Kerja Peserta Didik (LKPD) (Kolaborasi).
4. Murid dalam kelompok mencoba eksplorasi gerak dasar (${sibiAct1}) serta merumuskan pembagian peran latihan secara adil (Kolaborasi, Kemandirian).

Mengaplikasikan (Sintaks Penyelidikan Kelompok & Aktivitas Pembelajaran 2 & 3 Buku SIBI) (30 Menit)
1. Murid secara berpasangan dan berkelompok mempraktikkan ${sibiAct2} melalui pos-pos tantangan bergradasi dengan penuh antusiasme dan kegembiraan (Kolaborasi, Kesehatan).
2. Setiap anggota kelompok saling mengamati, memberikan aba-aba hitungan, dan melakukan koreksi teknik gerakan teman secara santun dan sportif (Komunikasi, Kolaborasi).
3. Murid menerapkan variasi dan kombinasi gerak dalam ${sibiAct3} dengan mengutamakan keselamatan bersama dan peraturan fair play (Kemandirian, Kesehatan).
4. Kelompok menyelesaikan tugas pemecahan studi kasus kontekstual pada LKPD secara disiplin dan riang gembira (Kreativitas, Kesehatan).

Merefleksi (Sintaks Penyajian Hasil & Evaluasi Solusi Buku SIBI) (15 Menit)
1. Setiap kelompok memperagakan hasil latihan variasi gerak terbaik mereka di depan kelas dengan rasa percaya diri dan sportif (Kemandirian, Komunikasi).
2. Kelompok lain memberikan tanggapan apresiatif dan masukan konstruktif terhadap peragaan teknik gerak kelompok temannya berdasarkan kriteria Buku SIBI (Penalaran Kritis, Komunikasi).
3. Guru bersama murid mengevaluasi hambatan fisik dan koordinasi yang dihadapi selama Aktivitas Pembelajaran 1, 2, dan 3 serta mendiskusikan kiat perbaikannya (Penalaran Kritis, Kesehatan).
4. Murid menuliskan refleksi personal pada LKPD mengenai makna kebugaran jasmani, sportivitas, dan pengalaman kerja sama tim yang telah dialami (Kemandirian, Kesehatan).`,
      kegiatanPenutup: `Prinsip Pembelajaran: Berkesadaran (Mindful) dan Bermakna (Meaningful). Durasi: 5 Menit.
1. Guru memandu seluruh peserta didik melakukan pendinginan (cooling down) dan peregangan pasif disertai olah napas teratur untuk merilekskan otot dan menurunkan denyut jantung sesuai Buku Panduan Guru SIBI (Kesehatan).
2. Guru bersama murid menyimpulkan intisari materi pembelajaran (${bab}) dan mengaitkannya dengan pembiasaan pola hidup sehat aktif di rumah (Penalaran Kritis).
3. Guru memberikan apresiasi terhadap sportivitas dan kerja keras murid serta menyampaikan topik untuk pertemuan berikutnya (Komunikasi).
4. Guru memimpin doa penutup mengucap syukur atas keselamatan selama pembelajaran dan menutup sesi dengan salam penutup santun (Keimanan dan Ketakwaan terhadap TYME).`
    },
    asesmenPembelajaran: {
      awal: 'Jenis: Asesmen Diagnostik (Kognitif & Non-Kognitif). Bentuk: Tanya Jawab Lisan & 5 Butir Pertanyaan Singkat Diagnostik. Teknik: Cek kesiapan fisik, tes pemahaman awal konsep materi.',
      proses: 'Jenis: Asesmen Formatif Berkelanjutan. Bentuk: Lembar Observasi Kinerja Praktik, Ceklis Sikap DPL, dan Penilaian LKPD. Teknik: Pengamatan proses latihan, umpan balik langsung, penilaian antar teman.',
      akhir: 'Jenis: Asesmen Sumatif Lingkup Materi. Bentuk: 5 Butir Soal Evaluasi Pemahaman & Tes Unjuk Kerja Praktik Kombinasi Komprehensif. Teknik: Uji performa keterampilan mandiri/beregu dan portofolio jurnal refleksi.'
    },
    tandaTangan: {
      tempatTanggal: 'Surakarta, 1 Juli 2025',
      kepalaSekolah: {
        nama: 'Soleh, S.Pd., M.Pd.',
        nip: 'NIP. 19750512 200003 1 004'
      },
      guruMapel: {
        nama: penyusun,
        nip: 'NIP. ........................................'
      }
    },
    lampiran: {
      asesmenDiagnostikNonKognitif: {
        tujuan: 'Mengetahui kesiapan fisik, mental, dan emosional peserta didik sebelum belajar',
        pertanyaan: [
          { no: 1, teks: 'Bagaimana perasaanmu sebelum memulai jam pelajaran PJOK hari ini?' },
          { no: 2, teks: 'Apakah kamu sudah sarapan sehat dan membawa botol minum air putih?' },
          { no: 3, teks: 'Apakah saat ini tubuhmu terasa bugar dan siap beraktivitas di lapangan?' },
          { no: 4, teks: 'Apakah ada bagian tubuh yang terasa nyeri atau cedera hari ini?' }
        ]
      },
      soalAsesmenAwalList: [
        {
          no: 1,
          pertanyaan: `Apa yang kamu ketahui tentang konsep dan manfaat dari aktivitas ${m} yang akan dipelajari hari ini?`,
          kunciJawaban: `Aktivitas fisik yang melatih keterampilan koordinasi, kekuatan otot, dan kelenturan tubuh untuk meningkatkan kebugaran jasmani.`
        },
        {
          no: 2,
          pertanyaan: 'Mengapa melakukan pemanasan (warming up) yang tepat sebelum memulai olahraga inti sangat penting?',
          kunciJawaban: 'Menaikkan suhu tubuh dan denyut nadi, melenturkan otot dan persendian, serta mencegah terjadinya risiko cedera fisik.'
        },
        {
          no: 3,
          pertanyaan: 'Sebutkan bagian otot dan persendian tubuh utama yang paling aktif digunakan saat melakukan gerakan ini!',
          kunciJawaban: 'Otot tungkai kaki, otot lengan bahu, persendian lutut, dan otot inti (core) tubuh penjaga keseimbangan.'
        },
        {
          no: 4,
          pertanyaan: 'Bagaimana sikap yang benar saat bekerja sama dalam satu kelompok olahraga apabila ada teman yang belum menguasai gerakan?',
          kunciJawaban: 'Menunjukkan sikap empati, memberikan semangat, tidak mengejek, dan dengan sabar membantu memberikan petunjuk teknik yang benar.'
        },
        {
          no: 5,
          pertanyaan: 'Bagaimana cara mengatur ritme napas yang benar saat tubuh melakukan aktivitas fisik yang berulang?',
          kunciJawaban: 'Menghirup udara bersih melalui hidung secara teratur dan mengeluarkannya secara perlahan lewat mulut tanpa menahan napas.'
        }
      ],
      asesmenFormatif: {
        keterangan: {
          diskusi: 'Melatih kemampuan berkolaborasi dalam kelompok, berani mengungkapkan ide solusi gerak, dan mendengarkan pendapat teman.',
          presentasi: 'Melatih keberanian berbicara di depan umum, memperagakan teknik gerak dengan percaya diri, dan menanggapi masukan kelompok lain.',
          unjukKerja: 'Menilai kualitas proses dan keterampilan gerak motorik yang dipraktikkan secara berkelanjutan.'
        },
        rubrikPenilaian: [
          { skor: 5, deskripsi: 'Sangat aktif berkontribusi dalam diskusi & peragaan, teknik gerak sangat akurat, komunikatif, dan sangat konsisten.' },
          { skor: 4, deskripsi: 'Aktif berdiskusi dan berlatih, mampu memperagakan gerak dengan baik, keterampilan gerak terlihat berkembang.' },
          { skor: 3, deskripsi: 'Cukup aktif, berpartisipasi saat diarahkan, keterampilan dasar mulai tampak konsisten.' },
          { skor: 2, deskripsi: 'Kurang aktif, pasif dalam kelompok, teknik gerak masih sering keliru.' },
          { skor: 1, deskripsi: 'Tidak menunjukkan partisipasi, tidak menguasai gerakan, enggan mencoba.' }
        ]
      },
      penilaianSikap: {
        spiritual: {
          teknik: 'Penilaian Diri',
          instrumen: 'Lembar Ceklis Sikap Spiritual',
          indikator: [
            'Berdoa sebelum dan sesudah memulai aktivitas pembelajaran dengan khusyuk',
            'Menunjukkan rasa syukur atas kesehatan dan kebugaran tubuh yang dianugerahkan Tuhan',
            'Menunjukkan empati, kasih sayang, dan sikap saling tolong-menolong antarteman',
            'Menjaga sportivitas dan kejujuran dalam setiap permainan'
          ]
        },
        sosial: {
          teknik: 'Penilaian Antarteman',
          instrumen: 'Lembar Ceklis Sikap Sosial',
          indikator: [
            'Mampu berkomunikasi dengan santun dan positif saat berdiskusi',
            'Bekerja sama secara aktif dan berbagi tugas merata dalam kelompok',
            'Menghargai keberagaman kemampuan fisik dan pendapat teman',
            'Peduli terhadap kebersihan lingkungan lapangan dan keselamatan sarana alat'
          ]
        },
        keterangan: `SL = Selalu : sangat baik (4)\nSR = Sering : baik (3)\nKD = Kadang-kadang : cukup (2)\nTP = Tidak Pernah : perlu bimbingan (1)`,
        rumusNilai: 'Nilai Akhir = (Jumlah skor diperoleh / 16) × 100'
      },
      rubrikSikap: {
        dimensiTerpilih: ['Penalaran Kritis', 'Kolaborasi', 'Kesehatan', 'Kemandirian'],
        aspekList: [
          {
            dimensi: 'Penalaran Kritis',
            indikator: 'Mengidentifikasi kunci keberhasilan gerak dan menganalisis kesalahan teknik.',
            skor4: 'Sangat kritis, mampu menganalisis kesalahan dan memberikan solusi perbaikan dengan tepat.',
            skor3: 'Cukup kritis, mampu menunjukkan kekeliruan gerak dan memahami langkah perbaikan.',
            skor2: 'Mulai menunjukkan pemikiran kritis namun masih membutuhkan bimbingan guru.',
            skor1: 'Belum mampu menganalisis kesalahan gerak atau memberikan tanggapan.'
          },
          {
            dimensi: 'Kolaborasi',
            indikator: 'Bekerja sama, berbagi peran aktif, dan saling membantu dalam latihan kelompok.',
            skor4: 'Selalu aktif bekerja sama, suportif membantu teman, dan berbagi peran secara adil.',
            skor3: 'Sering bekerja sama dengan baik dan bersedia membantu rekan satu kelompok.',
            skor2: 'Kadang-kadang bekerja sama, cenderung pasif jika tidak diarahkan.',
            skor1: 'Tidak mau bekerja sama atau mengganggu keterlaksanaan tugas kelompok.'
          },
          {
            dimensi: 'Kesehatan',
            indikator: 'Menjaga keselamatan diri, mengenakan seragam rapi, dan mempraktikkan gaya hidup aktif.',
            skor4: 'Sangat peduli keselamatan diri & teman, hidrasi teratur, dan menerapkan pemanasan/pendinginan optimal.',
            skor3: 'Peduli keselamatan, mematuhi instruksi pemanasan dan pendinginan dengan baik.',
            skor2: 'Kurang memperhatikan keselamatan, kadang mengabaikan arahan pendinginan.',
            skor1: 'Melakukan tindakan berbahaya yang berisiko cedera bagi diri sendiri atau teman.'
          },
          {
            dimensi: 'Kemandirian',
            indikator: 'Bertanggung jawab atas tugas gerak mandiri dan percaya diri menampilkan kemampuan.',
            skor4: 'Sangat mandiri, berinisiatif tinggi berlatih, dan sangat percaya diri memperagakan gerakan.',
            skor3: 'Mandiri menyelesaikan latihan, percaya diri dan bertanggung jawab atas tugasnya.',
            skor2: 'Memerlukan dorongan guru untuk memulai latihan dan kurang percaya diri.',
            skor1: 'Tidak menunjukkan kemandirian dan enggan mencoba gerakan.'
          }
        ]
      },
      penilaianPengetahuan: {
        judul: 'Rubrik Penilaian Pengetahuan LKPD (4 Skala)',
        aspekList: [
          'Kelengkapan Jawaban',
          'Ketepatan Konsep Materi',
          'Penyajian Analisis Strategi',
          'Kedalaman Refleksi Diri'
        ],
        pedomanSkor: [
          {
            aspek: 'Kelengkapan Jawaban',
            skor4: 'Semua pertanyaan pemahaman dan studi kasus pada LKPD dijawab tuntas dan lengkap.',
            skor3: 'Sebagian besar pertanyaan dijawab dengan lengkap dan sesuai instruksi.',
            skor2: 'Hanya separuh pertanyaan yang dijawab, beberapa bagian dibiarkan kosong.',
            skor1: 'Hampir seluruh lembar jawaban kosong atau tidak diisi.'
          },
          {
            aspek: 'Ketepatan Konsep Materi',
            skor4: 'Seluruh penjelasan konsep gerak dan fungsi kesehatan sangat tepat dan akurat.',
            skor3: 'Konsep materi dijelaskan dengan benar, hanya ada 1 kekeliruan kecil.',
            skor2: 'Beberapa penjelasan konsep masih keliru atau rancu.',
            skor1: 'Penjelasan konsep salah seluruhnya dan tidak sesuai materi.'
          },
          {
            aspek: 'Penyajian Analisis Strategi',
            skor4: 'Strategi pemecahan masalah disajikan secara logis, aplikatif, dan kontekstual.',
            skor3: 'Strategi yang diajukan cukup logis dan dapat diterapkan dalam latihan.',
            skor2: 'Strategi kurang terstruktur dan sulit diterapkan.',
            skor1: 'Tidak ada strategi yang disajikan atau tidak logis.'
          },
          {
            aspek: 'Kedalaman Refleksi Diri',
            skor4: 'Memberikan refleksi yang mendalam, jujur, dan menunjukkan kesadaran diri tinggi.',
            skor3: 'Memberikan jawaban reflektif yang cukup jelas dan bermakna.',
            skor2: 'Jawaban refleksi masih sangat umum dan singkat.',
            skor1: 'Tidak mengisi refleksi atau jawaban tidak relevan.'
          }
        ],
        rumusNilai: 'Nilai Akhir = (Jumlah Skor Diperoleh / 16) × 100'
      },
      penilaianKeterampilan: {
        judul: 'Rubrik Penilaian Keterampilan Unjuk Kerja Praktik Gerak (4 Skala)',
        aspekList: [
          'Teknik Sikap Awalan & Tumpuan',
          'Koordinasi Fase Gerakan Inti',
          'Sikap Akhir & Keseimbangan',
          'Penerapan Nilai Sportivitas & Kerjasama'
        ],
        pedomanSkor: [
          {
            aspek: 'Teknik Sikap Awalan & Tumpuan',
            skor4: 'Sikap awalan tubuh seimbang, posisi kaki/tumpuan sangat akurat dan mantap.',
            skor3: 'Sikap awalan cukup baik dan seimbang, tumpuan tepat.',
            skor2: 'Sikap awalan kurang seimbang, posisi tumpuan masih sering keliru.',
            skor1: 'Sikap awalan salah total dan tidak menunjukkan kesiapan gerak.'
          },
          {
            aspek: 'Koordinasi Fase Gerakan Inti',
            skor4: 'Gerakan mengalir luwes, irama gerak terkoordinasi sempurna, dan bertenaga.',
            skor3: 'Gerakan inti cukup terkoordinasi dengan baik, teknik sesuai tahapan.',
            skor2: 'Gerakan inti kaku atau terputus-putus, koordinasi kurang harmonis.',
            skor1: 'Tidak mampu melakukan koordinasi gerakan inti dengan benar.'
          },
          {
            aspek: 'Sikap Akhir & Keseimbangan',
            skor4: 'Pendaratan/posisi akhir sangat stabil, terkontrol, dan aman dari cedera.',
            skor3: 'Posisi akhir stabil dan terkontrol dengan baik.',
            skor2: 'Posisi akhir goyah, hampir kehilangan keseimbangan tubuh.',
            skor1: 'Kehilangan keseimbangan sepenuhnya atau terjatuh.'
          },
          {
            aspek: 'Penerapan Nilai Sportivitas & Kerjasama',
            skor4: 'Sangat sportif, mematuhi semua aturan permainan, dan aktif menyemangati teman.',
            skor3: 'Sportif, menghargai aturan dan bekerja sama dengan baik bersama kelompok.',
            skor2: 'Kurang sportif dalam permainan atau sesekali melanggar aturan.',
            skor1: 'Tidak sportif, bersikap curang, atau menolak mengikuti aturan.'
          }
        ],
        rumusNilai: 'Nilai Akhir = (Jumlah Skor Diperoleh / 16) × 100'
      },
      pengayaanDanRemedial: {
        remedial: {
          tujuan: `Membantu peserta didik yang belum mencapai ketuntasan kompetensi gerak pada materi ${m}.`,
          strategi: [
            {
              nama: 'Pendekatan Kontekstual & Visual',
              deskripsi: 'Memberikan demonstrasi ulang gerakan dalam tempo lambat dengan bantuan video slow-motion.'
            },
            {
              nama: 'Bimbingan Bertahap (Scaffolding)',
              deskripsi: 'Memecah tahapan gerakan menjadi segmen-segmen lebih sederhana sebelum menggabungkannya.'
            },
            {
              nama: 'Tutor Sebaya',
              deskripsi: 'Memasangkan murid yang kesulitan dengan teman sekelas yang sudah mahir untuk berlatih berpasangan.'
            }
          ]
        },
        pengayaan: {
          tujuan: 'Memberikan tantangan perluasan keterampilan dan kepemimpinan bagi peserta didik berkemampuan tinggi.',
          strategi: [
            {
              nama: 'Kreasi Variasi Permainan',
              deskripsi: 'Menugaskan murid merancang 2 variasi tantangan permainan mini baru yang lebih dinamis.'
            },
            {
              nama: 'Peran Wasit & Asisten Pengamat',
              deskripsi: 'Memberi kesempatan menjadi pemimpin tim atau pengamat catatan unjuk kerja teman.'
            }
          ]
        }
      },
      refleksi: {
        guru: [
          {
            no: 1,
            aspek: 'Penguasaan Materi & Alur 1 Pertemuan',
            refleksiGuru: 'Apakah alokasi waktu 2x40 menit efektif mencapai tujuan pembelajaran dan prinsip Mindful, Meaningful, Joyful terlaksana?',
            jawaban: ''
          },
          {
            no: 2,
            aspek: 'Keterlibatan Murid',
            refleksiGuru: 'Apakah seluruh murid aktif berpartisipasi tanpa ada yang merasa minder atau terpinggirkan?',
            jawaban: ''
          },
          {
            no: 3,
            aspek: 'Pencapaian Tujuan',
            refleksiGuru: 'Apakah minimal 85% murid telah menguasai kompetensi gerak yang ditargetkan?',
            jawaban: ''
          }
        ],
        pesertaDidik: 'Menutup pembelajaran dengan refleksi diri menggunakan lembar ceklis jurnal refleksi mengenai pengalaman gerak dan perasaan belajar hari ini.'
      },
      soalAsesmenAkhirList: [
        {
          no: 1,
          pertanyaan: `Jelaskan analisis konsep dasar dan cara kerja teknik gerakan utama pada materi ${m}!`,
          kunciJawaban: `Memerlukan koordinasi tumpuan kaki yang stabil, ayunan anggota tubuh teratur, dan pengaturan ritme napas untuk memaksimalkan efisiensi gerak.`
        },
        {
          no: 2,
          pertanyaan: `Ketika menghadapi rintangan atau tantangan dalam simulasi aktivitas ${m}, strategi taktik apa yang paling tepat diterapkan agar tim dapat mencapai hasil optimal?`,
          kunciJawaban: `Menerapkan pembagian peran yang seimbang, komunikasi sportif yang jelas di lapangan, dan pemanfaatan ruang kosong secara cerdas.`
        },
        {
          no: 3,
          pertanyaan: `Mengapa koordinasi dan keseimbangan tubuh sangat menentukan keselamatan dan efektivitas dalam melakukan ${m}?`,
          kunciJawaban: `Karena keseimbangan menjaga pusat gravitasi tubuh agar tidak mudah goyah atau cedera saat terjadi perubahan arah gerak secara mendadak.`
        },
        {
          no: 4,
          pertanyaan: `Bagaimana penerapan nilai sportivitas dan fair play dalam aktivitas ${m} dapat mencegah terjadinya konflik antarteman?`,
          kunciJawaban: `Dengan mematuhi peraturan bersama, mengakui keunggulan kawan atau lawan secara lapang dada, dan saling memberikan dukungan positif.`
        },
        {
          no: 5,
          pertanyaan: `Sebutkan 3 dampak positif jangka panjang bagi kesehatan tubuh apabila kita konsisten mempraktikkan aktivitas gerak ${m}!`,
          kunciJawaban: `Kebugaran jantung-paru meningkat, kekuatan dan kelenturan otot terjaga, serta tubuh menjadi lebih berenergi dan tidak mudah lelah.`
        }
      ],
      materiAjarRingkas: `RINGKASAN MATERI AJAR: ${m.toUpperCase()}
1. Pengertian & Konsep Dasar:
   ${m} merupakan bagian integral dari aktivitas kebugaran jasmani yang bertujuan meningkatkan keterampilan koordinasi, kekuatan otot, kelenturan, serta kesadaran ruang dan tubuh (kinestetik).
2. Manfaat bagi Kebugaran Jasmani:
   - Meningkatkan daya tahan jantung dan paru-paru (kardiorespirasi).
   - Memperkuat struktur tulang dan melatih elastisitas persendian.
   - Membantu mempertahankan postur tubuh yang ideal dan proporsional.
   - Mengurangi rasa lelah serta meningkatkan konsentrasi belajar di kelas.
3. Prinsip Keselamatan Gerak (Safety First):
   - Wajib melakukan pemanasan terarah selama 10-15 menit sebelum aktivitas intens.
   - Perhatikan posisi tumpuan kaki dan pendaratan agar tidak mencederai sendi lutut atau pergelangan kaki.
   - Penuhi kebutuhan cairan tubuh (minum air putih yang cukup) saat jeda latihan.
   - Lakukan pendinginan untuk membantu pemulihan otot dan mencegah nyeri otot (DOMS).`
    },
    lkpdList: [lkpd1]
  };
}

function getFallbackLKPD(reqBody: any) {
  const { 
    mataPelajaran = 'PJOK', 
    kelas = '4', 
    topikMateri = 'Pola Gerak Dasar & Kebugaran Jasmani', 
    guruPenyusun = 'Ahmad Rafsanjani, S.Pd.', 
    gayaDesain = 'Modern Clean Edukatif', 
    sekolah = 'SD Negeri 1',
    alokasiWaktu = '2 x 35 Menit',
    rawText
  } = reqBody || {};

  if (rawText && typeof rawText === 'string' && rawText.trim().length > 10) {
    const rawLines = rawText.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const sections: any[] = [];
    let currentSection: any = {
      sectionTitle: 'A. Petunjuk & Aktivitas Belajar',
      icon: '📌',
      introText: 'Bacalah petunjuk dan kerjakan aktivitas di bawah ini dengan saksama:',
      contentBlocks: [] as any[],
      visualDesignTip: 'Sajikan dengan kotak dan ikon yang menarik serta mudah dibaca.'
    };

    let qCounter = 1;
    for (const line of rawLines) {
      if (line.match(/^(Aktivitas|Bagian|Langkah|Pertemuan|[A-E]\.|\d+\.)/i) && line.length < 80) {
        if (currentSection.contentBlocks.length > 0) {
          sections.push(currentSection);
          const icons = ['📌', '✏️', '💡', '🔍', '🎯', '⭐'];
          const icon = icons[sections.length % icons.length];
          currentSection = {
            sectionTitle: line,
            icon,
            introText: 'Pelajari uraian dan selesaikan tantangan berikut:',
            contentBlocks: [],
            visualDesignTip: 'Beri highlight warna lembut pada poin penting.'
          };
          continue;
        } else {
          currentSection.sectionTitle = line;
          continue;
        }
      }

      const isQuestion = line.includes('?') || line.match(/^(\d+[\.\)]|[a-d][\.\)])\s+/i);
      if (isQuestion) {
        const styles = ['rounded_large', 'dotted_box', 'speech_bubble', 'ruled_lines'];
        const style = styles[qCounter % styles.length];
        currentSection.contentBlocks.push({
          blockType: 'question',
          questionData: {
            id: `q${qCounter++}`,
            questionText: line,
            answerBoxStyle: style,
            placeholderText: 'Tuliskan jawaban lengkapmu di sini...',
            score: '25'
          }
        });
      } else {
        currentSection.contentBlocks.push({
          blockType: 'text',
          exactText: line
        });
      }
    }

    if (currentSection.contentBlocks.length > 0) {
      sections.push(currentSection);
    }

    if (sections.length === 0) {
      sections.push({
        sectionTitle: 'A. Pengalaman Belajar & Evaluasi',
        icon: '📌',
        introText: 'Pelajari materi dan kerjakan tugas di bawah ini:',
        contentBlocks: [
          {
            blockType: 'text',
            exactText: rawText
          }
        ],
        visualDesignTip: 'Gunakan bingkai modern dan ikon penanda.'
      });
    }

    return {
      identitas: {
        mataPelajaran,
        kelas: kelas.toLowerCase().includes('kelas') ? kelas : `Kelas ${kelas}`,
        topikMateri,
        guruPenyusun,
        gayaDesain,
        tanggalDokumen: new Date().toLocaleDateString('id-ID'),
        sekolah,
        alokasiWaktu
      },
      judulMenarik: `LKPD Bergambar: ${topikMateri}`,
      sections,
      penutupMotivasi: 'Hebat! Kamu telah menyelesaikan seluruh aktivitas LKPD ini dengan penuh semangat dan berkesadaran. Teruslah berlatih!',
      selfReflectionChecklist: [
        'Saya telah membaca dan memahami seluruh petunjuk kegiatan.',
        'Saya aktif berpartisipasi dan menjaga sportivitas.',
        'Saya menyelesaikan tugas dengan jujur, mandiri, dan teliti.'
      ]
    };
  }

  return {
    identitas: {
      mataPelajaran,
      kelas: `Kelas ${kelas}`,
      topikMateri,
      guruPenyusun,
      gayaDesain,
      tanggalDokumen: new Date().toLocaleDateString('id-ID'),
      sekolah,
      alokasiWaktu: '2 x 35 Menit'
    },
    judulMenarik: `LKPD Interaktif: ${topikMateri}`,
    sections: [
      {
        sectionTitle: 'A. Petunjuk & Mari Memahami',
        icon: '📌',
        introText: 'Bacalah petunjuk di bawah ini dengan ceria bersama teman-temanmu!',
        contentBlocks: [
          {
            blockType: 'text',
            exactText: `Dalam materi ${topikMateri}, kita belajar bagaimana menggerakkan tubuh dengan aman dan tepat. Pahami setiap gerakan sebelum mempraktikkannya!`
          },
          {
            blockType: 'question',
            questionData: {
              id: 'q1',
              questionText: `Sebutkan 2 hal penting yang harus diperhatikan saat melakukan gerakan ${topikMateri}?`,
              answerBoxStyle: 'rounded_large',
              placeholderText: 'Tuliskan jawabanmu di sini...',
              score: '50'
            }
          }
        ],
        visualDesignTip: 'Sajikan dengan kotak berwarna lembut dan ikon menarik.'
      },
      {
        sectionTitle: 'B. Mari Mengaplikasikan & Bereksplorasi',
        icon: '🎯',
        introText: 'Praktikkan gerakan di bawah ini bersama kelompokmu!',
        contentBlocks: [
          {
            blockType: 'question',
            questionData: {
              id: 'q2',
              questionText: 'Ceritakan pengalamanmu saat mempraktikkan gerakan ini di lapangan!',
              answerBoxStyle: 'dotted_box',
              placeholderText: 'Tuliskan pengalaman menyenangkanmu...',
              score: '50'
            }
          }
        ],
        visualDesignTip: 'Beri ruang kotak bergaris putus-putus untuk jawaban siswa.'
      }
    ],
    penutupMotivasi: 'Luar biasa! Kamu telah menyelesaikan LKPD ini dengan semangat tinggi! Tetap rajin berolahraga ya!',
    selfReflectionChecklist: [
      'Saya sudah melakukan pemanasan sebelum praktik.',
      'Saya dapat mempraktikkan gerakan dengan aman.',
      'Saya bekerja sama dengan baik bersama teman.'
    ]
  };
}

function getFallbackCover(reqBody: any) {
  const { judul = 'MODUL AJAR PJOK', subJudul = '', mataPelajaran = 'PJOK', kelas = '1', semester = '1', tahunAjaran = '2024/2025', disusunOleh = 'Guru PJOK', namaSekolah = 'SD Negeri' } = reqBody || {};
  return {
    judulUtama: judul,
    subJudulKreatif: subJudul || `Perencanaan Pembelajaran Kurikulum Merdeka - ${mataPelajaran}`,
    taglineSekolah: 'Mewujudkan Generasi Sehat, Cerdas, Berkarakter, dan Berani',
    kutipanMotivasi: 'Di dalam tubuh yang sehat terdapat jiwa yang kuat.',
    sumberKutipan: 'Peribahasa Bijak',
    detailDokumen: {
      jenisDokumen: 'Dokumen Perencanaan Pembelajaran',
      mataPelajaran,
      kelasFase: `Kelas ${kelas}`,
      semester: `Semester ${semester}`,
      tahunAjaran
    },
    informasiPenyusun: {
      namaPenyusun: disusunOleh,
      nipKeterangan: 'Guru Mata Pelajaran',
      jabatan: 'Guru PJOK'
    },
    instansi: {
      namaSekolah,
      dinasPendidikan: 'Dinas Pendidikan Kabupaten/Kota',
      kotaKabupaten: 'Indonesia'
    },
    gayaVisual: {
      rekomendasiWarnaBg: 'emerald',
      borderStyle: 'double_classic',
      patternDescription: 'Frame bingkai elegan dengan ornamen garis ganda yang rapi',
      hiasanSudut: 'Ornamen sudut klasik simetris'
    }
  };
}

function getFallbackWorkload(reqBody: any) {
  const { teacherName = 'Guru PJOK', schoolName = 'SD Negeri', weeklyJpTarget = 24 } = reqBody || {};
  return {
    summaryStatus: `Analisis beban kerja mengajar untuk ${teacherName} di ${schoolName}.`,
    certificationStatus: 'MEMENUHI',
    certificationExplanation: `Beban mengajar dan ekuivalensi tugas tambahan telah memenuhi syarat minimal ${weeklyJpTarget} JP per pekan sesuai Permendikbud No. 15 Tahun 2018.`,
    strengths: [
      'Distribusi jam mengajar merata di setiap tingkat kelas.',
      'Memiliki tugas tambahan yang mendukung ekuivalensi jam mengajar (misal: Pembina Pramuka / Ekskul).'
    ],
    challenges: [
      'Aktivitas di lapangan menguras energi fisik cukup tinggi.',
      'Manajemen waktu antara persiapan materi praktik dan administrasi.'
    ],
    recommendations: [
      'Lakukan istirahat teratur dan konsumsi air putih yang cukup saat mengajar di lapangan.',
      'Gunakan modul ajar dan rubrik digital untuk menghemat waktu penyusunan administrasi.',
      'Optimalkan tugas tambahan ekuivalensi untuk menjaga stabilitas TPG sertifikasi.'
    ],
    weeklyDistributionChartData: [
      { day: 'Senin', hours: 5, intensity: 'Sedang' },
      { day: 'Selasa', hours: 6, intensity: 'Tinggi' },
      { day: 'Rabu', hours: 5, intensity: 'Sedang' },
      { day: 'Kamis', hours: 4, intensity: 'Sedang' },
      { day: 'Jumat', hours: 4, intensity: 'Ringan' }
    ]
  };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. Generate Modul Ajar (Kurikulum Merdeka PJOK SD)
app.post('/api/generate-modul', async (req, res) => {
  try {
    const { grade, materi, alokasiWaktu } = req.body;
    if (!grade || !materi) {
      return res.status(400).json({ error: 'Grade dan Materi harus diisi.' });
    }

    if (isGeminiAccessDenied()) {
      console.info('[AI Generator] Using offline template for Modul Ajar');
      const fallback = getFallbackModul(grade, materi, alokasiWaktu);
      return res.json(fallback);
    }

    const ai = getAiClient();
    const sibiInstruction = buildSibiPromptInstruction(grade, materi);
    const prompt = `Buatkan Modul Ajar PJOK SD Kurikulum Merdeka yang lengkap, mendetail, dan profesional dalam Bahasa Indonesia berpedoman pada Buku Panduan Guru PJOK SD/MI dari SIBI (Sistem Informasi Perbukuan Indonesia - buku.kemendikdasmen.go.id), Keputusan Kepala BSKAP Nomor 046/H/KR/2025, dan Permendikdasmen No. 13 Tahun 2025.
Kelas: ${grade} SD
Materi Pokok: ${materi}
Alokasi Waktu: ${alokasiWaktu || '3 x 35 Menit (1 Pertemuan)'}
${sibiInstruction}

Modul Ajar harus disesuaikan dengan tingkat perkembangan anak SD kelas ${grade} secara aman dan menyenangkan serta mencantumkan Pemanasan Permainan Kecil dan Aktivitas Pembelajaran 1, 2, 3 sesuai Buku Panduan Guru PJOK SIBI.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah asisten pakar kurikulum PJOK Sekolah Dasar Kurikulum Merdeka berlandaskan Keputusan Kepala BSKAP Nomor 046/H/KR/2025 dan Permendikdasmen No. 13 Tahun 2025 di Indonesia. Anda bertugas menyusun Modul Ajar berkualitas tinggi dengan detail lengkap, bukan sekadar rangkuman. Format output harus selalu dalam bentuk JSON terstruktur sesuai schema yang diminta.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Judul Modul Ajar yang menarik, misal: Variasi Gerak Dasar Lokomotor Lompat',
            },
            materiPokok: {
              type: Type.STRING,
              description: 'Detail materi pokok yang diajarkan',
            },
            alokasiWaktu: {
              type: Type.STRING,
              description: 'Alokasi waktu pembelajaran, misal: 2 x 35 Menit',
            },
            tujuanPembelajaran: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Min 3 tujuan pembelajaran spesifik mencakup aspek Kognitif, Psikomotor, dan Afektif',
            },
            kegiatanPembelajaran: {
              type: Type.OBJECT,
              properties: {
                pendahuluan: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Alur pendahuluan pembelajaran: sapa, absen, doa, pemanasan menarik/game ringan selama 10-15 menit',
                },
                inti: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Alur kegiatan inti secara bertahap: demonstrasi, latihan individu, latihan kelompok, game modifikasi berorientasi kebugaran jasmani secara mendalam',
                },
                penutup: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Alur penutup: pendinginan (cooling down), refleksi bersama, evaluasi gerakan, motivasi, doa penutup',
                },
              },
              required: ['pendahuluan', 'inti', 'penutup'],
            },
            saranaPrasarana: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Alat dan sarana prasarana yang dibutuhkan (misal: cone, peluit, bola, matras)',
            },
            rubrikPenilaian: {
              type: Type.STRING,
              description: 'Kriteria penilaian performa gerakan fisik anak (Kategori Sangat Baik, Cukup, dan Perlu Bimbingan)',
            },
          },
          required: [
            'title',
            'materiPokok',
            'alokasiWaktu',
            'tujuanPembelajaran',
            'kegiatanPembelajaran',
            'saranaPrasarana',
            'rubrikPenilaian',
          ],
        },
      },
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model Gemini.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for Modul Ajar');
    const fallback = getFallbackModul(req.body?.grade, req.body?.materi, req.body?.alokasiWaktu);
    res.json(fallback);
  }
});

// 2. Generate Rubrik Penilaian Fisik (Keterampilan Gerak)
app.post('/api/generate-rubrik', async (req, res) => {
  try {
    const { materi, kategori } = req.body;
    if (!materi) {
      return res.status(400).json({ error: 'Materi harus diisi.' });
    }

    const ai = getAiClient();
    const prompt = `Buatkan rubrik penilaian keterampilan gerak PJOK SD yang mendetail untuk materi berikut:
Materi: ${materi}
Kategori Olahraga: ${kategori || 'Umum'}

Berikan 3 indikator penilaian fisik utama dengan kriteria pencapaian (Bagus/Mahir, Cukup/Layak, dan Kurang/Perlu Bimbingan) yang spesifik secara gerakan fisik (bukan sekadar kata umum).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah pakar penilai atletik & olahraga SD di Indonesia. Susun rubrik penilaian yang sangat objektif dan berbasis gerak motorik anak. Format output harus selalu dalam JSON terstruktur sesuai schema yang diminta.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            materi: { type: Type.STRING },
            kategori: { type: Type.STRING },
            indikator: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nama: { type: Type.STRING, description: 'Nama Indikator Gerakan, misal: Sikap Ayunan Lengan' },
                  kriteriaBagus: { type: Type.STRING, description: 'Deskripsi gerakan yang sempurna/bagus' },
                  kriteriaCukup: { type: Type.STRING, description: 'Deskripsi gerakan yang cukup baik namun ada kekurangan' },
                  kriteriaKurang: { type: Type.STRING, description: 'Deskripsi gerakan yang kurang atau tidak sesuai teknik dasar' },
                },
                required: ['nama', 'kriteriaBagus', 'kriteriaCukup', 'kriteriaKurang'],
              },
            },
          },
          required: ['materi', 'kategori', 'indikator'],
        },
      },
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model Gemini.');
    }

    // fallback jika schema key ada kesalahan ketik sedikit
    let text = response.text.trim();
    // ganti kcriteriaCukup ke kriteriaCukup jika model salah ketik
    text = text.replace(/"kcriteriaCukup"/g, '"kriteriaCukup"');
    
    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for Rubrik Penilaian');
    const fallback = getFallbackRubrik(req.body?.materi, req.body?.kategori);
    res.json(fallback);
  }
});

// 3. Generate Bank Soal Evaluasi PJOK (Kognitif)
app.post('/api/generate-soal', async (req, res) => {
  try {
    const { grade, materi, totalSoal } = req.body;
    if (!grade || !materi) {
      return res.status(400).json({ error: 'Grade dan Materi harus diisi.' });
    }

    if (isGeminiAccessDenied()) {
      console.info('[AI Generator] Using offline template for Soal Evaluasi');
      const fallback = getFallbackSoal(grade, materi, totalSoal);
      return res.json(fallback);
    }

    const count = parseInt(totalSoal) || 5;
    const ai = getAiClient();
    const prompt = `Buatkan ${count} soal pilihan ganda (PG) PJOK SD untuk:
Kelas: ${grade} SD
Materi: ${materi}

Sertakan 4 pilihan jawaban (A, B, C, D), kunci jawaban yang benar, serta penjelasan singkat kenapa jawaban tersebut benar. Pertanyaan harus sesuai dengan kemampuan kognitif anak SD Kelas ${grade}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah penyusun soal ujian nasional/sekolah dasar PJOK terkemuka di Indonesia. Buat soal kognitif yang menguji pemahaman aturan permainan, manfaat kesehatan, pola hidup sehat, atau dasar gerakan. Format output harus selalu dalam JSON terstruktur sesuai schema yang diminta.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: 'Pertanyaan PJOK' },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '4 pilihan jawaban dimulai dari A, B, C, D (misal: "A. Mengoper bola")'
                  },
                  correctAnswer: { type: Type.STRING, description: 'Kunci jawaban yang benar (misal: "A")' },
                  explanation: { type: Type.STRING, description: 'Penjelasan ilmiah/praktis yang ramah anak kenapa jawaban tersebut benar' }
                },
                required: ['question', 'options', 'correctAnswer', 'explanation']
              }
            }
          },
          required: ['questions']
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model Gemini.');
    }

    const data = JSON.parse(response.text.trim());
    if (data.questions && !data.soalList) {
      data.soalList = data.questions.map((q: any, i: number) => ({
        id: `soal-${i + 1}`,
        pertanyaan: q.question,
        pilihan: {
          A: q.options?.[0]?.replace(/^A\.\s*/, '') || '',
          B: q.options?.[1]?.replace(/^B\.\s*/, '') || '',
          C: q.options?.[2]?.replace(/^C\.\s*/, '') || '',
          D: q.options?.[3]?.replace(/^D\.\s*/, '') || ''
        },
        kunciJawaban: q.correctAnswer,
        pembahasan: q.explanation
      }));
    }
    data.materi = materi;
    data.grade = grade;
    res.json(data);
  } catch (error: any) {
    checkAndMarkAccessDenied(error);
    console.info('[AI Generator] Using offline template for Soal Evaluasi');
    const fallback = getFallbackSoal(req.body?.grade, req.body?.materi, req.body?.totalSoal);
    res.json(fallback);
  }
});

// 3b. Generate Soal Sumatif & Kartu Soal
app.post('/api/generate-soal-sumatif', async (req, res) => {
  try {
    const {
      jenisUjian = 'Asesmen Sumatif Akhir Semester (SAS)',
      mataPelajaran = 'Pendidikan Jasmani, Olahraga, dan Kesehatan',
      grade = '4',
      semester = 'Ganjil',
      tahunPelajaran = '2026/2027',
      babMateri,
      babMateriList: incomingMateriList,
      bentukSoal = 'pilihan_ganda',
      bentukSoalList: incomingBentukList,
      bentukSoalCounts: incomingCounts,
      bentukSoalDistribution: incomingDistribution,
      levelKognitif = 'campuran',
      totalSoal = '5',
      namaSekolah = 'SD Negeri Pintar Bersama',
      dinasPendidikan = 'Dinas Pendidikan Pemuda Dan Olahraga',
      jumlahOpsiPG = '4',
      skalaPenskoran = 'standar',
      modelStimulus = 'kontekstual',
      dimensiP3 = 'terpadu'
    } = req.body;

    let cleanBentukList: string[] = [];
    if (Array.isArray(incomingBentukList) && incomingBentukList.length > 0) {
      cleanBentukList = incomingBentukList.map((b: any) => {
        const s = String(b).toLowerCase();
        if (s.includes('kompleks')) return 'Pilihan Ganda Kompleks';
        if (s.includes('jodoh')) return 'Menjodohkan';
        if (s.includes('isian')) return 'Isian Singkat';
        if (s.includes('uraian') || s.includes('esai')) return 'Uraian';
        return 'Pilihan Ganda';
      });
      cleanBentukList = Array.from(new Set(cleanBentukList));
    } else if (typeof bentukSoal === 'string') {
      if (bentukSoal === 'campuran') {
        cleanBentukList = ['Pilihan Ganda', 'Pilihan Ganda Kompleks', 'Menjodohkan', 'Isian Singkat', 'Uraian'];
      } else if (bentukSoal === 'pg_kompleks') {
        cleanBentukList = ['Pilihan Ganda Kompleks'];
      } else if (bentukSoal === 'menjodohkan') {
        cleanBentukList = ['Menjodohkan'];
      } else if (bentukSoal === 'isian') {
        cleanBentukList = ['Isian Singkat'];
      } else if (bentukSoal === 'uraian') {
        cleanBentukList = ['Uraian'];
      } else {
        cleanBentukList = ['Pilihan Ganda'];
      }
    }
    if (cleanBentukList.length === 0) {
      cleanBentukList = ['Pilihan Ganda'];
    }

    // Build explicit shape distribution
    const shapeDistribution: { name: string; count: number }[] = [];
    if (Array.isArray(incomingDistribution) && incomingDistribution.length > 0) {
      for (const item of incomingDistribution) {
        const sName = item.name || item.bentuk;
        const sCnt = Math.max(1, Math.min(25, parseInt(item.count) || 1));
        if (sName && cleanBentukList.includes(sName)) {
          shapeDistribution.push({ name: sName, count: sCnt });
        }
      }
    } else if (incomingCounts && typeof incomingCounts === 'object') {
      for (const b of cleanBentukList) {
        const sCnt = Math.max(1, Math.min(25, parseInt(incomingCounts[b]) || 1));
        shapeDistribution.push({ name: b, count: sCnt });
      }
    }

    let count = Math.min(25, Math.max(1, parseInt(totalSoal) || 5));
    if (shapeDistribution.length > 0) {
      count = shapeDistribution.reduce((acc, curr) => acc + curr.count, 0);
    }

    // Pre-calculate allocatedShapes list to enforce strict numbering and types
    const allocatedShapes: string[] = [];
    if (shapeDistribution.length > 0) {
      for (const sd of shapeDistribution) {
        for (let k = 0; k < sd.count; k++) {
          allocatedShapes.push(sd.name);
        }
      }
    } else {
      const basePerShape = Math.floor(count / cleanBentukList.length);
      let remShape = count % cleanBentukList.length;
      for (let s = 0; s < cleanBentukList.length; s++) {
        const curCount = basePerShape + (remShape > 0 ? 1 : 0);
        if (remShape > 0) remShape--;
        for (let k = 0; k < curCount; k++) {
          allocatedShapes.push(cleanBentukList[s]);
        }
      }
    }

    let cleanMateriList: string[] = [];
    if (Array.isArray(incomingMateriList) && incomingMateriList.length > 0) {
      cleanMateriList = incomingMateriList.map((m: any) => String(m).trim()).filter(Boolean);
    } else if (typeof babMateri === 'string') {
      cleanMateriList = babMateri.split(/\n|;/).map((s: string) => s.trim()).filter(Boolean);
    }
    if (cleanMateriList.length === 0) {
      cleanMateriList = ['Aktivitas Kebugaran Jasmani & Pola Hidup Sehat'];
    }

    const effectiveBabMateri = cleanMateriList.join('; ');
    req.body.babMateri = effectiveBabMateri;
    req.body.babMateriList = cleanMateriList;
    req.body.bentukSoalList = cleanBentukList;
    req.body.bentukSoalDistribution = shapeDistribution;
    req.body.bentukSoalCounts = incomingCounts;
    req.body.bentukSoal = cleanBentukList.join(', ');
    req.body.totalSoal = String(count);

    if (isGeminiAccessDenied()) {
      console.info('[AI Generator] Using offline template for Soal Sumatif');
      const fallback = getFallbackSummative(req.body);
      return res.json(fallback);
    }

    let opsiCountNote = '4 opsi (A, B, C, D)';
    if (jumlahOpsiPG === '3') opsiCountNote = '3 opsi (A, B, C) untuk Kelas 1-2 SD';
    if (jumlahOpsiPG === '5') opsiCountNote = '5 opsi (A, B, C, D, E)';

    let bentukInstruction = '';
    if (shapeDistribution.length > 0) {
      let currentNumber = 1;
      const breakdownText = shapeDistribution.map(sd => {
        const startNo = currentNumber;
        const endNo = currentNumber + sd.count - 1;
        currentNumber += sd.count;
        let extraNote = '';
        if (sd.name === 'Pilihan Ganda') extraNote = `(${opsiCountNote})`;
        if (sd.name === 'Pilihan Ganda Kompleks') extraNote = `(stimulus 3-4 pernyataan Benar/Salah, field "pernyataanKompleks")`;
        if (sd.name === 'Menjodohkan') extraNote = `(3-4 pasangan konsep Kolom A & B, field "menjodohkanPairs")`;
        if (sd.name === 'Isian Singkat') extraNote = `(jawaban istilah/kata kunci esensial)`;
        if (sd.name === 'Uraian') extraNote = `(penalaran mendalam berbobot & rubrik penskoran 1-5)`;

        return `- ${sd.name}: ${sd.count} butir (Nomor ${startNo === endNo ? startNo : `${startNo} s.d ${endNo}`}) ${extraNote}`;
      }).join('\n');

      bentukInstruction = `Guru telah mengatur rincian jumlah butir soal per bentuk asesmen sebagai berikut:
${breakdownText}
Total keseluruhan instrumen: ${count} butir soal.

PETUNJUK WAJIB DISTRIBUSI:
1. Anda WAJIB membuat PERSIS jumlah butir soal sesuai dengan alokasi setiap bentuk di atas (jangan mengurangi atau menukar).
2. Urutkan soal secara rapi berkelompok per bentuk soal sesuai urutan di atas.
3. Pastikan nilai field "bentukSoal" pada masing-masing nomor soal sesuai dengan kelompok bentuknya.`;
    } else if (cleanBentukList.length === 1) {
      const b = cleanBentukList[0];
      if (b === 'Pilihan Ganda') {
        bentukInstruction = `Semua ${count} butir soal harus bertipe Pilihan Ganda (PG Tunggal) dengan ${opsiCountNote}.`;
      } else if (b === 'Pilihan Ganda Kompleks') {
        bentukInstruction = `Semua ${count} butir soal harus bertipe Pilihan Ganda Kompleks (PGK). Buatkan tabel 3-4 pernyataan terkait materi yang harus dinilai Benar (B) atau Salah (S) oleh siswa, lengkapi field "pernyataanKompleks" berupa array [{ "pernyataan": string, "jawabanBenar": "Benar" | "Salah" }].`;
      } else if (b === 'Menjodohkan') {
        bentukInstruction = `Semua ${count} butir soal harus bertipe Menjodohkan (Matching). Buatkan 3-4 pasangan konsep di Kolom A dan fungsi/keterangan di Kolom B, lengkapi field "menjodohkanPairs" berupa array [{ "premis": string, "pasangan": string }].`;
      } else if (b === 'Isian Singkat') {
        bentukInstruction = `Semua ${count} butir soal harus bertipe Isian Singkat yang menanyakan istilah atau konsep kunci gerak dengan jawaban pendek terarah.`;
      } else if (b === 'Uraian') {
        bentukInstruction = `Semua ${count} butir soal harus bertipe Uraian / Esai yang memerlukan jawaban penjelasan mendalam, analisis gerak, atau solusi situasi dengan rubrik penskoran berjenjang (skor maksimal 5).`;
      }
    } else {
      bentukInstruction = `Guru memilih ${cleanBentukList.length} bentuk soal sekaligus untuk dikombinasikan dalam instrumen ini: ${cleanBentukList.join(', ')}.
Anda WAJIB membagi dan mendistribusikan total ${count} butir soal secara proporsional ke dalam bentuk-bentuk soal terpilih tersebut.
Urutkan butir soal secara rapi dan berkelompok per bentuk soal (misal: bagian Pilihan Ganda terlebih dahulu dengan opsi (${opsiCountNote}), lalu Pilihan Ganda Kompleks/Menjodohkan/Isian, dan diakhiri dengan Uraian).
Pastikan field "bentukSoal" pada setiap butir soal diisi PERSIS dengan salah satu dari bentuk terpilih: ${cleanBentukList.map(s => `"${s}"`).join(', ')}.`;
    }

    let levelInstruction = '';
    if (levelKognitif === 'lots') {
      levelInstruction = `Semua soal berfokus pada Level Kognitif Rendah / LOTS (Level 1 - C1 Mengingat / C2 Memahami).`;
    } else if (levelKognitif === 'mots') {
      levelInstruction = `Semua soal berfokus pada Level Kognitif Sedang / MOTS (Level 2 - C3 Menerapkan/Mengaplikasikan).`;
    } else if (levelKognitif === 'hots') {
      levelInstruction = `Semua soal berfokus pada Level Kognitif Tinggi / HOTS (Level 3 - C4 Menganalisis / C5 Mengevaluasi / C6 Mengkreasi) yang membutuhkan analisis situasi kontekstual, studi kasus, atau penalaran kritis murid.`;
    } else {
      levelInstruction = `Campurkan Level Kognitif secara variatif (LOTS, MOTS, dan HOTS) agar mencerminkan distribusi evaluasi yang berimbang.`;
    }

    const prompt = `Anda adalah seorang ahli penyusun evaluasi dan pembuat Kartu Soal standar Kementerian Pendidikan Indonesia yang berpengalaman tinggi.
Buatkan ${count} butir soal evaluasi untuk asesmen sumatif PJOK Sekolah Dasar.

Informasi Identitas Ujian:
- Jenis Ujian: ${jenisUjian}
- Mata Pelajaran: ${mataPelajaran}
- Kelas: Kelas ${grade} SD
- Semester: Semester ${semester}
- Tahun Pelajaran: ${tahunPelajaran}
- Nama Sekolah: ${namaSekolah}
- Dinas Pendidikan: ${dinasPendidikan}

Daftar Bab / Lingkup Materi yang Diujikan (${cleanMateriList.length} Lingkup Materi):
${cleanMateriList.map((m, idx) => `Bab ${idx + 1}: ${m}`).join('\n')}

PEDOMAN DISTRIBUSI SOAL KE MATERI:
Guru menentukan ${cleanMateriList.length} Bab/Lingkup Materi sebagai dasar ujian. Anda WAJIB membagi dan mendistribusikan total ${count} butir soal secara proporsional dan merata ke seluruh ${cleanMateriList.length} materi di atas.
Pada setiap butir soal, field "lingkupMateri" WAJIB diisi dengan nama Bab/Lingkup Materi yang diukur dari daftar di atas.

Spesifikasi & Opsi Pilihan Soal:
- Jumlah Soal: ${count}
- Bentuk Soal: ${bentukSoal} (${bentukInstruction})
- Jumlah Opsi Pilihan PG: ${opsiCountNote}
- Level Kognitif Target: ${levelKognitif} (${levelInstruction})
- Model Stimulus Soal: ${modelStimulus}
- Dimensi Profil Pelajar Pancasila: ${dimensiP3}
- Skala Penskoran: ${skalaPenskoran}

Tugas Anda:
Untuk setiap butir soal, buatlah data lengkap yang mencakup:
1. "noSoal": Nomor soal berurutan dimulai dari 1.
2. "bentukSoal": "Pilihan Ganda", "Pilihan Ganda Kompleks", "Menjodohkan", "Isian Singkat", atau "Uraian" sesuai bentuknya.
3. "levelKognitif": Contoh: "Level 1 (C1 - Mengingat)", "Level 2 (C3 - Menerapkan)", atau "Level 3 (C4 - Menganalisis)".
4. "lingkupMateri": Nama materi spesifik yang diuji dari daftar materi di atas.
5. "capaianPembelajaran": Rumusan Capaian Pembelajaran (CP) atau Alur Tujuan Pembelajaran (ATP) kurikulum Merdeka yang relevan untuk materi tersebut di Kelas ${grade} SD.
6. "indikatorSoal": Rumusan indikator soal yang spesifik dan operasional menggambarkan bagaimana stimulus soal diberikan dan apa yang diukur.
7. "question": Teks instruksi butir soal yang jelas, lugas, dan sesuai kaidah tata bahasa Indonesia yang baik dan benar.
8. "options": Jika bentuk soal adalah Pilihan Ganda biasa, sertakan opsi pilihan (${opsiCountNote}) lengkap dengan label hurufnya. Jika bukan PG biasa, berikan array kosong [].
9. "pernyataanKompleks": Khusus bentuk Pilihan Ganda Kompleks, sertakan array 3-4 objek berisi {"pernyataan": string, "jawabanBenar": "Benar" | "Salah"}. Jika bukan PG Kompleks, isi array kosong [].
10. "menjodohkanPairs": Khusus bentuk Menjodohkan, sertakan array 3-4 pasangan objek berisi {"premis": string, "pasangan": string}. Jika bukan Menjodohkan, isi array kosong [].
11. "correctAnswer": Kunci jawaban yang tepat.
12. "explanation": Penjelasan ilmiah, logis, dan edukatif mengapa jawaban tersebut benar.
13. "pedomanPenskoran": Panduan penskoran atau kriteria skor untuk butir soal tersebut.
14. "bobotSkor": Angka bobot skor per butir soal (misal PG: 1, PGK: 2, Menjodohkan: 2, Isian: 3, Uraian: 5).
15. "dimensiP3": Dimensi profil pelajar pancasila yang dilatih (misal: "Bernalar Kritis", "Gotong Royong", "Mandiri").

PANDUAN ANTI-DUPLIKASI DAN VARIASI BUTIR SOAL:
- Setiap butir soal WAJIB memiliki stimulus, pertanyaan, konsep teknis, dan sudut pandang yang UNIK dan BERBEDA satu sama lain. Jangan pernah mengulang pertanyaan yang sama persis.
- Acak sebaran kunci jawaban pilihan ganda (A, B, C, D) secara proporsional dan tidak monoton pada satu huruf saja.
- Gunakan seed pembeda unik: ${req.body.seed || Date.now()} untuk menghasilkan susunan soal yang baru dan bervariasi.

Format output wajib berupa JSON terstruktur yang valid sesuai schema berikut. Jangan ada teks penjelasan markdown tambahan di luar blok JSON.`;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        temperature: 0.8,
        systemInstruction: `Anda adalah pakar penulisan soal evaluasi standar nasional serta pembuatan instrumen kartu soal Kurikulum Merdeka yang ahli dalam menghasilkan instrumen evaluasi yang akurat, berbobot, bervariasi unik tanpa duplikasi, dan sesuai standar administrasi sekolah di Indonesia berlandaskan Capaian Pembelajaran Keputusan Kepala BSKAP Nomor 046/H/KR/2025 dalam format JSON. Pastikan materi, tingkat kesulitan, dan Capaian Pembelajaran (CP) benar-benar sesuai dengan jenjang Kelas ${grade} SD dan terdistribusi secara berimbang ke seluruh materi yang ditentukan.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            judulUjian: { type: Type.STRING },
            kop: {
              type: Type.OBJECT,
              properties: {
                dinasPendidikan: { type: Type.STRING },
                namaSekolah: { type: Type.STRING },
                mataPelajaran: { type: Type.STRING },
                kelas: { type: Type.STRING },
                semester: { type: Type.STRING },
                tahunPelajaran: { type: Type.STRING }
              },
              required: ['dinasPendidikan', 'namaSekolah', 'mataPelajaran', 'kelas', 'semester', 'tahunPelajaran']
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  noSoal: { type: Type.INTEGER },
                  bentukSoal: { type: Type.STRING },
                  levelKognitif: { type: Type.STRING },
                  lingkupMateri: { type: Type.STRING },
                  capaianPembelajaran: { type: Type.STRING },
                  indikatorSoal: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  pernyataanKompleks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        pernyataan: { type: Type.STRING },
                        jawabanBenar: { type: Type.STRING }
                      },
                      required: ['pernyataan', 'jawabanBenar']
                    }
                  },
                  menjodohkanPairs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        premis: { type: Type.STRING },
                        pasangan: { type: Type.STRING }
                      },
                      required: ['premis', 'pasangan']
                    }
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  pedomanPenskoran: { type: Type.STRING },
                  bobotSkor: { type: Type.INTEGER },
                  dimensiP3: { type: Type.STRING }
                },
                required: ['noSoal', 'bentukSoal', 'levelKognitif', 'capaianPembelajaran', 'indikatorSoal', 'question', 'options', 'correctAnswer', 'explanation', 'pedomanPenskoran']
              }
            }
          },
          required: ['judulUjian', 'kop', 'questions']
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon dari model AI.');
    }

    const data = JSON.parse(response.text.trim());

    // Normalisasi struktur data output
    if (!data.judulUjian) {
      data.judulUjian = `${jenisUjian.toUpperCase()} - PJOK KELAS ${grade} SD`;
    }
    if (!data.kop) {
      data.kop = {
        dinasPendidikan,
        namaSekolah,
        mataPelajaran,
        kelas: grade,
        semester,
        tahunPelajaran
      };
    } else {
      data.kop.dinasPendidikan = data.kop.dinasPendidikan || dinasPendidikan;
      data.kop.namaSekolah = data.kop.namaSekolah || namaSekolah;
      data.kop.mataPelajaran = data.kop.mataPelajaran || mataPelajaran;
      data.kop.kelas = data.kop.kelas || grade;
      data.kop.semester = data.kop.semester || semester;
      data.kop.tahunPelajaran = data.kop.tahunPelajaran || tahunPelajaran;
    }
    data.kop.lingkupMateriList = cleanMateriList;
    data.kop.lingkupMateri = effectiveBabMateri;
    data.kop.bentukSoalList = cleanBentukList;
    data.kop.bentukSoal = cleanBentukList.join(', ');
    data.kop.bentukSoalDistribution = shapeDistribution.length > 0 ? shapeDistribution : undefined;
    data.kop.bentukSoalSummary = shapeDistribution.length > 0 ? shapeDistribution.map(s => `${s.name}: ${s.count} soal`).join(' • ') : cleanBentukList.join(', ');
    data.kop.totalSoal = count;

    if (Array.isArray(data.questions)) {
      data.questions = data.questions.map((q: any, idx: number) => {
        let matchedBentuk = allocatedShapes[idx] || cleanBentukList.find(b => b.toLowerCase() === String(q.bentukSoal || '').toLowerCase());
        if (!matchedBentuk) {
          const lower = String(q.bentukSoal || '').toLowerCase();
          if (lower.includes('kompleks') && cleanBentukList.includes('Pilihan Ganda Kompleks')) matchedBentuk = 'Pilihan Ganda Kompleks';
          else if (lower.includes('jodoh') && cleanBentukList.includes('Menjodohkan')) matchedBentuk = 'Menjodohkan';
          else if (lower.includes('isian') && cleanBentukList.includes('Isian Singkat')) matchedBentuk = 'Isian Singkat';
          else if (lower.includes('uraian') && cleanBentukList.includes('Uraian')) matchedBentuk = 'Uraian';
          else if (cleanBentukList.includes('Pilihan Ganda')) matchedBentuk = 'Pilihan Ganda';
          else matchedBentuk = cleanBentukList[idx % cleanBentukList.length];
        }

        let bobot = q.bobotSkor;
        if (!bobot) {
          if (matchedBentuk === 'Pilihan Ganda') bobot = 1;
          else if (matchedBentuk === 'Pilihan Ganda Kompleks') bobot = 2;
          else if (matchedBentuk === 'Menjodohkan') bobot = 2;
          else if (matchedBentuk === 'Isian Singkat') bobot = 3;
          else if (matchedBentuk === 'Uraian') bobot = 5;
          else bobot = 1;
        }

        const qMateri = q.lingkupMateri || cleanMateriList[idx % cleanMateriList.length];

        return {
          noSoal: q.noSoal || idx + 1,
          bentukSoal: matchedBentuk,
          levelKognitif: q.levelKognitif || 'Level 2 (C3 - Menerapkan)',
          lingkupMateri: qMateri,
          capaianPembelajaran: q.capaianPembelajaran || `Peserta didik mampu memahami dan mempraktikkan keterampilan gerak pada materi ${qMateri} sesuai jenjang kelas ${grade} SD.`,
          indikatorSoal: q.indikatorSoal || q.indikator || `Disajikan stimulus mengenai ${qMateri}, peserta didik dapat menentukan jawaban yang tepat.`,
          question: q.question || q.questionText || q.pertanyaan || '',
          options: Array.isArray(q.options) ? q.options : [],
          pernyataanKompleks: Array.isArray(q.pernyataanKompleks) ? q.pernyataanKompleks : undefined,
          menjodohkanPairs: Array.isArray(q.menjodohkanPairs) ? q.menjodohkanPairs : undefined,
          correctAnswer: q.correctAnswer || q.kunciJawaban || 'A',
          explanation: q.explanation || q.pembahasan || '',
          pedomanPenskoran: q.pedomanPenskoran || (q.bentukSoal === 'Uraian' ? 'Skor maksimal 5 sesuai kelengkapan uraian' : 'Skor 1 jika benar, 0 jika salah'),
          bobotSkor: bobot,
          dimensiP3: q.dimensiP3 || 'Gotong Royong & Mandiri'
        };
      });
    }

    res.json(data);
  } catch (error: any) {
    checkAndMarkAccessDenied(error);
    console.info('[AI Generator] Using offline template for Soal Sumatif');
    const fallback = getFallbackSummative(req.body);
    res.json(fallback);
  }
});

// 3c. Analisis KKO Taksonomi Bloom & SOLO
app.post('/api/analyze-kko', async (req, res) => {
  try {
    const { tujuanPembelajaran, mataPelajaran = 'Pendidikan Jasmani, Olahraga, dan Kesehatan', grade = '4' } = req.body;
    if (!tujuanPembelajaran) {
      return res.status(400).json({ error: 'Tujuan Pembelajaran wajib diisi.' });
    }

    const ai = getAiClient();
    const prompt = `Anda adalah pakar penulisan Kurikulum Merdeka dan Ahli Taksonomi Pendidikan (Bloom Revisi Anderson & SOLO Taxonomy).
Analisis Tujuan Pembelajaran (TP) berikut untuk Kelas ${grade} SD pada mata pelajaran ${mataPelajaran}:
TP Guru: "${tujuanPembelajaran}"

Tugas Anda:
1. Analisis tingkat kognitif TP tersebut berdasarkan Taksonomi Bloom (Revisi Anderson): C1 (Mengingat), C2 (Memahami), C3 (Menerapkan), C4 (Menganalisis), C5 (Mengevaluasi), atau C6 (Mengkreasi). Tentukan kata kerja operasional (KKO) yang terdeteksi, berikan deskripsi kekuatan TP, serta rekomendasi perbaikan.
2. Analisis TP tersebut berdasarkan Taksonomi SOLO (Structure of Observed Learning Outcomes): Prestructural, Unistructural, Multistructural, Relational, atau Extended Abstract. Berikan penjelasan singkat tingkat SOLO dan rekomendasi peningkatan.
3. Berikan 4 rekomendasi rumusan TP alternatif yang lebih terstruktur dengan variasi tingkat kognitif:
   - Alternatif 1: Berfokus pada LOTS (C1/C2 atau Unistructural)
   - Alternatif 2: Berfokus pada MOTS (C3 atau Multistructural)
   - Alternatif 3: Berfokus pada HOTS (C4/C5/C6 atau Relational/Extended Abstract)
   - Alternatif 4: Rumusan ideal gabungan yang mencakup Kompetensi (KKO yang terukur) + Konten (Materi) + Variasi/Konteks nyata anak SD kelas ${grade}.
4. Untuk setiap alternatif, berikan usulan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) yang operasional.

Sajikan dalam bentuk JSON terstruktur sesuai skema berikut tanpa penjelasan markdown tambahan di luar blok JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah pakar kurikulum dan evaluasi pendidikan yang ahli dalam menganalisis serta merumuskan Alur Tujuan Pembelajaran menggunakan Taksonomi Bloom dan SOLO secara akurat dan berkualitas dalam format JSON.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalObjective: { type: Type.STRING },
            bloomAnalysis: {
              type: Type.OBJECT,
              properties: {
                level: { type: Type.STRING },
                verba: { type: Type.STRING },
                description: { type: Type.STRING },
                strength: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ['level', 'verba', 'description', 'strength', 'recommendation']
            },
            soloAnalysis: {
              type: Type.OBJECT,
              properties: {
                level: { type: Type.STRING },
                description: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ['level', 'description', 'recommendation']
            },
            suggestedObjectives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  level: { type: Type.STRING },
                  taxonomyLevel: { type: Type.STRING },
                  text: { type: Type.STRING },
                  kko: { type: Type.STRING },
                  kktpSuggested: { type: Type.STRING }
                },
                required: ['level', 'taxonomyLevel', 'text', 'kko', 'kktpSuggested']
              }
            }
          },
          required: ['originalObjective', 'bloomAnalysis', 'soloAnalysis', 'suggestedObjectives']
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon dari model AI.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for KKO Analysis');
    const fallback = getFallbackKKO(req.body?.tujuanPembelajaran);
    res.json(fallback);
  }
});

// 3d. Generate Ulangan Harian & Praktik Per Tujuan Pembelajaran (TP)
app.post('/api/generate-ulangan', async (req, res) => {
  try {
    const { tujuanPembelajaran, tipeUlangan, grade = '4', mataPelajaran = 'Pendidikan Jasmani, Olahraga, dan Kesehatan', jumlahSoal = 5 } = req.body;
    
    if (!tujuanPembelajaran || !tipeUlangan) {
      return res.status(400).json({ error: 'Tujuan Pembelajaran dan Tipe Ulangan wajib diisi.' });
    }

    const ai = getAiClient();
    let prompt = '';

    if (tipeUlangan === 'tulis') {
      prompt = `Anda adalah seorang ahli penyusun instrumen penilaian/evaluasi hasil belajar SD (Kurikulum Merdeka).
Buatkan instrumen **Ulangan Harian Tulis** yang bermutu tinggi, berbobot, kontekstual, dan sesuai dengan perkembangan kognitif anak usia SD kelas ${grade}.

Detail Acuan:
- Mata Pelajaran: ${mataPelajaran}
- Tujuan Pembelajaran (TP): "${tujuanPembelajaran}"
- Tingkat/Kelas: Kelas ${grade} SD
- Jumlah Soal Pilihan Ganda: ${jumlahSoal} soal (masing-masing 4 opsi pilihan: A, B, C, D)
- Jumlah Soal Essay/Uraian: 2-3 soal esai reflektif/penerapan nyata.

Tugas Anda:
1. Buat Kop Judul yang profesional.
2. Buatkan ${jumlahSoal} soal pilihan ganda yang bervariasi dari LOTS hingga HOTS sesuai dengan TP tersebut. Pastikan opsi jawaban homogen dan logis. Berikan penjelasan ringkas serta kunci jawaban.
3. Buatkan 2 soal uraian/essay yang merangsang daya nalar siswa, lengkap dengan kunci/ekspetasi jawaban serta skor maksimal masing-masing soal.
4. Tuliskan panduan singkat penskoran/rubrik penilaian nilai akhir (misalnya Bobot PG 60% dan Essay 40%).

Sajikan dalam bentuk JSON terstruktur sesuai skema respon yang ditentukan.`;
    } else {
      prompt = `Anda adalah ahli penyusun instrumen penilaian/evaluasi psikomotorik dan kinerja unjuk kerja (performance assessment) di Sekolah Dasar.
Buatkan instrumen **Ulangan Harian Praktik (Unjuk Kerja/Kinerja)** yang aman, terukur, objektif, dan sangat mudah diterapkan untuk mengukur pencapaian siswa pada TP berikut:

Detail Acuan:
- Mata Pelajaran: ${mataPelajaran}
- Tujuan Pembelajaran (TP): "${tujuanPembelajaran}"
- Tingkat/Kelas: Kelas ${grade} SD
- Tipe Penilaian: Penilaian Kinerja Psikomotor (Praktik Fisik / Keterampilan)

Tugas Anda:
1. Buat judul instrumen yang profesional.
2. Formulasikan serangkaian instruksi tugas praktik (task instructions) langkah-demi-langkah bagi siswa yang aman, konkret, dan ramah anak SD kelas ${grade}.
3. Buatkan rubrik penilaian unjuk kerja terperinci yang mencakup minimal 3 kriteria/aspek penilaian yang relevan dengan TP tersebut (misal untuk PJOK: Sikap Awalan/Persiapan, Sikap Pelaksanaan, dan Sikap Akhiran/Hasil Gerakan). Untuk setiap aspek, jabarkan deskriptor deskriptif yang jelas untuk skala skor:
   - Skor 4: Sangat Baik (mandiri, akurat, konsisten)
   - Skor 3: Baik (lancar, sedikit kesalahan teknis, mandiri)
   - Skor 2: Cukup (memerlukan bimbingan/intervensi kecil, kurang konsisten)
   - Skor 1: Perlu Bimbingan (kesulitan melakukan gerakan, membutuhkan pengawasan penuh)
4. Buatkan rumus pedoman penskoran akhir yang aplikatif bagi guru.

Sajikan dalam bentuk JSON terstruktur sesuai skema respon yang ditentukan.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah pakar penilai kurikulum SD Kurikulum Merdeka yang menyusun soal ujian tulis atau instrumen ujian praktik secara komprehensif dalam format JSON.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            tujuanPembelajaran: { type: Type.STRING },
            materi: { type: Type.STRING },
            grade: { type: Type.STRING },
            tipeUlangan: { type: Type.STRING },
            // For written test (tulis)
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.INTEGER },
                  questionText: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ['number', 'questionText', 'options', 'correctAnswer', 'explanation']
              }
            },
            essayQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.INTEGER },
                  questionText: { type: Type.STRING },
                  expectedAnswer: { type: Type.STRING },
                  scoreMax: { type: Type.INTEGER }
                },
                required: ['number', 'questionText', 'expectedAnswer', 'scoreMax']
              }
            },
            // For practical test (praktik)
            taskInstructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            rubricCriteria: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criteriaName: { type: Type.STRING },
                  skor4: { type: Type.STRING },
                  skor3: { type: Type.STRING },
                  skor2: { type: Type.STRING },
                  skor1: { type: Type.STRING }
                },
                required: ['criteriaName', 'skor4', 'skor3', 'skor2', 'skor1']
              }
            },
            scoringFormula: { type: Type.STRING },
            gradingGuide: { type: Type.STRING }
          },
          required: ['title', 'tujuanPembelajaran', 'materi', 'grade', 'tipeUlangan', 'questions', 'essayQuestions', 'taskInstructions', 'rubricCriteria', 'scoringFormula', 'gradingGuide']
        }
      }
    });

    if (!response.text) {
      throw new Error('Gagal mendapatkan instrumen ulangan dari AI.');
    }

    const testData = JSON.parse(response.text.trim());
    res.json(testData);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for Daily Test');
    const fallback = getFallbackDailyTest(req.body?.grade, req.body?.tujuanPembelajaran || 'Ulangan Harian');
    res.json(fallback);
  }
});

// 4. Generate ATP & KKTP (Capaian Pembelajaran PJOK SD)
app.post('/api/generate-atp', async (req, res) => {
  try {
    const { phase, element, cpText, materiSpesifik, saranaSpesifik } = req.body;
    if (!phase || !element) {
      return res.status(400).json({ error: 'Fase dan Elemen harus diisi.' });
    }

    const ai = getAiClient();
    const prompt = `Buatkan Alur Tujuan Pembelajaran (ATP) dan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) berbasis Capaian Pembelajaran (CP) PJOK SD Kurikulum Merdeka berpedoman pada Keputusan Kepala BSKAP Nomor 046/H/KR/2025 (Standar Capaian Pembelajaran Terbaru).
Fase: ${phase}
Elemen: ${element}
CP Referensi: "${cpText || 'Gunakan referensi resmi Keputusan Kepala BSKAP Nomor 046/H/KR/2025 untuk elemen ini'}"
Materi Spesifik (Opsional): ${materiSpesifik || 'Umum/Disesuaikan'}
Kondisi Sarana & Prasarana Sekolah (Opsional): ${saranaSpesifik || 'Standar/Halaman Sekolah'}

Tugas Anda:
1. Formulasikan Alur Tujuan Pembelajaran (ATP) sebanyak 3-4 tahap logis terurut.
2. Formulasikan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) yang aplikatif mencakup deskripsi level penguasaan: Baru Berkembang (BB), Layak (L), dan Mahir (M).
3. Berikan saran metode/pendekatan pembelajaran PJOK yang menyenangkan dan ramah anak.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah pakar penilai dan perancang kurikulum PJOK Sekolah Dasar Kurikulum Merdeka yang sangat berkompeten di Indonesia dan menguasai Keputusan Kepala BSKAP Nomor 046/H/KR/2025. Format output harus selalu dalam JSON terstruktur sesuai schema yang diminta.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            alurTujuanPembelajaran: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Alur Tujuan Pembelajaran (ATP) berurutan dari dasar ke kompleks'
            },
            kriteriaKetercapaian: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  kriteria: { type: Type.STRING, description: 'Nama kriteria keahlian/perilaku, misal: Teknik Dasar Awalan' },
                  baruBerkembang: { type: Type.STRING, description: 'Deskripsi kriteria jika siswa masih Baru Berkembang' },
                  layak: { type: Type.STRING, description: 'Deskripsi kriteria jika siswa sudah Layak / Cukup Mandiri' },
                  mahir: { type: Type.STRING, description: 'Deskripsi kriteria jika siswa sudah Mahir / Sangat Baik' }
                },
                required: ['kriteria', 'baruBerkembang', 'layak', 'mahir']
              },
              description: 'Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) untuk asesmen'
            },
            metodePembelajaran: {
              type: Type.STRING,
              description: 'Rekomendasi metode/pendekatan mengajar PJOK yang inklusif, aman, dan game-based'
            }
          },
          required: ['alurTujuanPembelajaran', 'kriteriaKetercapaian', 'metodePembelajaran']
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model Gemini.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for ATP');
    const fallback = getFallbackATP(req.body?.phase, req.body?.element || req.body?.materiSpesifik);
    res.json(fallback);
  }
});

// 4a. Generate Konversi/Formulasi CP ke TP (Capaian Pembelajaran ke Tujuan Pembelajaran)
app.post('/api/generate-cp-to-tp', async (req, res) => {
  try {
    const { fase, kelas, elemen, cpText, materiSpesifik, pendekatanFormat } = req.body;
    if (!fase || !elemen) {
      return res.status(400).json({ error: 'Fase dan Elemen wajib diisi.' });
    }

    const ai = getAiClient();
    const prompt = `Formulasikan Capaian Pembelajaran (CP) menjadi Tujuan Pembelajaran (TP) terukur untuk mata pelajaran PJOK Sekolah Dasar Kurikulum Merdeka berpedoman pada Keputusan Kepala BSKAP Nomor 046/H/KR/2025 (Standar Capaian Pembelajaran Kurikulum Nasional/Merdeka Terbaru).

Data Input:
- Fase: ${fase || 'Fase A / B / C'}
- Target Kelas: ${kelas || 'Disesuaikan dengan Fase'}
- Elemen PJOK: ${elemen}
- Teks Capaian Pembelajaran (CP) Asli: "${cpText || 'Gunakan referensi CP Kurikulum Merdeka PJOK resmi Keputusan Kepala BSKAP Nomor 046/H/KR/2025'}"
- Topik / Materi Spesifik (Opsional): ${materiSpesifik || 'Umum (Pola Gerak Dasar & Kebugaran)'}
- Format Pendekatan: ${pendekatanFormat || 'Standar Kurikulum Merdeka (Kompetensi + Lingkup Materi)'}

Tugas Anda:
1. Dekonstruksi CP menjadi:
   - Kompetensi Utama (Kata Kerja Operasional / KKO Bloom-SOLO yang relevan)
   - Lingkup Materi Utama (Content Scope PJOK)
   - Variasi Karakteristik Peserta Didik SD
2. Formulasikan 3 - 5 Tujuan Pembelajaran (TP) yang logis, sistematis, hirarkis, serta dapat diukur (measurable) dari CP tersebut sesuai Keputusan Kepala BSKAP Nomor 046/H/KR/2025.
3. Untuk setiap TP, berikan:
   - Kode TP (misal: TP 1.1, TP 1.2, dst.)
   - Rumusan TP yang jelas dan berorientasi pada peserta didik
   - Identifikasi Kompetensi (KKO)
   - Lingkup Materi spesifik
   - Indikator Ketercapaian TP (IKTP) minimal 2-3 poin
   - Dimensi Profil Pelajar Pancasila (P3)
   - Target Kelas & Semester
   - Alokasi Waktu (JP)
   - Rekomendasi Asesmen PJOK (Tes Unjuk Kerja / Pengetahuan / Observasi Perilaku)
4. Berikan rekomendasi pendekatan pembelajaran dan catatan bimbingan guru.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah pakar kurikulum PJOK Sekolah Dasar Kurikulum Merdeka yang berpengalaman merumuskan Capaian Pembelajaran (CP) berdasarkan Keputusan Kepala BSKAP Nomor 046/H/KR/2025 menjadi Tujuan Pembelajaran (TP) yang kontekstual dan berkualitas tinggi. Selalu kembalikan respon berupa JSON sesuai schema yang ditentukan.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fase: { type: Type.STRING },
            kelas: { type: Type.STRING },
            elemen: { type: Type.STRING },
            cpAsli: { type: Type.STRING },
            materiSpesifik: { type: Type.STRING },
            analisisDekonstruksi: {
              type: Type.OBJECT,
              properties: {
                kompetensiUtama: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Daftar KKO / Kompetensi yang terkandung dalam CP'
                },
                lingkupMateriUtama: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Daftar materi / konten utama yang terkandung dalam CP'
                },
                variasiKarakteristikSiswa: { type: Type.STRING, description: 'Catatan karakteristik siswa SD pada fase ini' }
              },
              required: ['kompetensiUtama', 'lingkupMateriUtama', 'variasiKarakteristikSiswa']
            },
            daftarTp: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  kodeTp: { type: Type.STRING, description: 'Contoh: TP 1.1' },
                  rumusanTp: { type: Type.STRING, description: 'Rumusan lengkap Tujuan Pembelajaran' },
                  kompetensiKko: { type: Type.STRING, description: 'Kompetensi / KKO yang digunakan' },
                  lingkupMateri: { type: Type.STRING, description: 'Lingkup materi spesifik' },
                  indikatorKetercapaian: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Indikator-indikator pencapaian TP (IKTP)'
                  },
                  profilPancasila: { type: Type.STRING, description: 'Profil Pelajar Pancasila yang dikembangkan' },
                  targetKelasSemester: { type: Type.STRING, description: 'Target Kelas & Semester' },
                  alokasiWaktu: { type: Type.STRING, description: 'Alokasi waktu dalam JP' },
                  rekomendasiAsesmen: { type: Type.STRING, description: 'Bentuk/Teknik Asesmen yang cocok' }
                },
                required: [
                  'kodeTp',
                  'rumusanTp',
                  'kompetensiKko',
                  'lingkupMateri',
                  'indikatorKetercapaian',
                  'profilPancasila',
                  'targetKelasSemester',
                  'alokasiWaktu',
                  'rekomendasiAsesmen'
                ]
              },
              description: 'Daftar Tujuan Pembelajaran terformulasi'
            },
            rekomendasiPendekatan: { type: Type.STRING, description: 'Rekomendasi metode/strategi mengajar' },
            catatanPendidik: { type: Type.STRING, description: 'Catatan praktis untuk guru' }
          },
          required: [
            'fase',
            'kelas',
            'elemen',
            'cpAsli',
            'materiSpesifik',
            'analisisDekonstruksi',
            'daftarTp',
            'rekomendasiPendekatan',
            'catatanPendidik'
          ]
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model Gemini.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for CP-to-TP');
    const fallback = getFallbackCPTP(req.body?.fase, req.body?.elemen);
    res.json(fallback);
  }
});

// 4b. Generate KKTP (Kriteria Ketercapaian Tujuan Pembelajaran) dengan Interval
app.post('/api/generate-kktp', async (req, res) => {
  try {
    const {
      satuanPendidikan,
      mataPelajaran,
      kelas,
      fase,
      semester,
      tahunPelajaran,
      bab,
      materiPokok,
      deskripsiCp,
      tujuanPembelajaran,
    } = req.body;

    if (!satuanPendidikan || !mataPelajaran || !kelas || !fase || !semester || !tahunPelajaran || !bab || !materiPokok || !deskripsiCp || !tujuanPembelajaran) {
      return res.status(400).json({ error: 'Seluruh input wajib diisi.' });
    }

    let tpList: string[] = [];
    if (Array.isArray(tujuanPembelajaran)) {
      tpList = tujuanPembelajaran;
    } else if (typeof tujuanPembelajaran === 'string') {
      tpList = tujuanPembelajaran.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }

    if (tpList.length === 0) {
      return res.status(400).json({ error: 'Tujuan Pembelajaran harus memiliki minimal satu kriteria.' });
    }

    const ai = getAiClient();
    const prompt = `Buatkan deskripsi kriteria ketercapaian tujuan pembelajaran (KKTP) untuk setiap Tujuan Pembelajaran berikut berdasarkan materi, kelas, dan fase sesuai standar Keputusan Kepala BSKAP Nomor 046/H/KR/2025:
Mata Pelajaran: ${mataPelajaran}
Satuan Pendidikan: ${satuanPendidikan}
Kelas/Fase: Kelas ${kelas} / Fase ${fase}
Semester: ${semester}
Tahun Pelajaran: ${tahunPelajaran}
Bab: ${bab}
Materi Pokok: ${materiPokok}
Deskripsi CP (BSKAP 046/H/KR/2025): "${deskripsiCp}"

Daftar Tujuan Pembelajaran (TP):
${tpList.map((tp, idx) => `${idx + 1}. ${tp}`).join('\n')}

Tugas Anda:
Bagi setiap Tujuan Pembelajaran di atas, rumuskan deskripsi kriteria pencapaian konkret yang dibagi menjadi 4 interval nilai:
1. Perlu Bimbingan (0–68): Apa kriteria konkret/kondisi siswa yang menunjukkan mereka berada di tingkat ini untuk TP ini? (Tulis deskripsi konkret yang ringkas dan padat)
2. Cukup (68–78): Apa kriteria konkret/kondisi siswa yang menunjukkan mereka berada di tingkat ini untuk TP ini? (Tulis deskripsi konkret yang ringkas dan padat)
3. Baik (79–89): Apa kriteria konkret/kondisi siswa yang menunjukkan mereka berada di tingkat ini untuk TP ini? (Tulis deskripsi konkret yang ringkas dan padat)
4. Sangat Baik (90–100): Apa kriteria konkret/kondisi siswa yang menunjukkan mereka berada di tingkat ini untuk TP ini? (Tulis deskripsi konkret yang ringkas dan padat)

Pastikan deskripsinya relevan secara motorik/pengetahuan olahraga atau keilmuan mapel tersebut, to-the-point, dan tidak terlalu panjang agar respon cepat dan terhindar dari timeout.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah pakar penilai kurikulum sekolah di Indonesia berlandaskan Keputusan Kepala BSKAP Nomor 046/H/KR/2025 dan Panduan Pembelajaran & Asesmen (PPA). Buatkan KKTP interval nilai terstruktur dalam format JSON. Setiap deskripsi interval harus menggambarkan kriteria performa siswa secara konkret dan terukur. Jaga agar setiap deskripsi tetap padat dan ringkas (maksimal 1-2 kalimat per deskripsi) agar respons cepat.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identitas: {
              type: Type.OBJECT,
              properties: {
                satuanPendidikan: { type: Type.STRING },
                mataPelajaran: { type: Type.STRING },
                kelas: { type: Type.STRING },
                fase: { type: Type.STRING },
                semester: { type: Type.STRING },
                tahunPelajaran: { type: Type.STRING },
              },
              required: ['satuanPendidikan', 'mataPelajaran', 'kelas', 'fase', 'semester', 'tahunPelajaran'],
            },
            bab: { type: Type.STRING },
            materiPokok: { type: Type.STRING },
            deskripsiCp: { type: Type.STRING },
            kktpRows: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  no: { type: Type.STRING },
                  tujuanPembelajaran: { type: Type.STRING },
                  intervalDeskripsi: {
                    type: Type.OBJECT,
                    properties: {
                      perluBimbingan: { type: Type.STRING, description: 'Deskripsi kriteria interval 0-68' },
                      cukup: { type: Type.STRING, description: 'Deskripsi kriteria interval 68-78' },
                      baik: { type: Type.STRING, description: 'Deskripsi kriteria interval 79-89' },
                      sangatBaik: { type: Type.STRING, description: 'Deskripsi kriteria interval 90-100' },
                    },
                    required: ['perluBimbingan', 'cukup', 'baik', 'sangatBaik'],
                  },
                },
                required: ['no', 'tujuanPembelajaran', 'intervalDeskripsi'],
              },
            },
          },
          required: ['identitas', 'bab', 'materiPokok', 'deskripsiCp', 'kktpRows'],
        },
      },
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model Gemini.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for KKTP');
    const fallback = getFallbackKKTP(
      req.body?.kelas,
      req.body?.materiPokok || req.body?.bab,
      req.body?.mataPelajaran
    );
    res.json(fallback);
  }
});

// 4c. Generate Rincian Pekan Efektif (RPE)
app.post('/api/generate-rpe', async (req, res) => {
  try {
    const {
      namaSekolah,
      kelas,
      jpPerMinggu,
      mataPelajaran,
      semester,
      tahunPelajaran,
      catatanTambahan,
    } = req.body;

    if (!namaSekolah || !kelas || !jpPerMinggu || !mataPelajaran || !semester || !tahunPelajaran) {
      return res.status(400).json({ error: 'Seluruh input identitas wajib diisi.' });
    }

    const jpNum = parseInt(jpPerMinggu, 10);
    if (isNaN(jpNum) || jpNum <= 0) {
      return res.status(400).json({ error: 'Jumlah JP per Minggu harus berupa angka positif.' });
    }

    const ai = getAiClient();
    const isGanjil = semester.toLowerCase().includes('ganjil') || semester === '1';
    const bulansList = isGanjil 
      ? ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

    const prompt = `Buatkan Dokumen Rincian Pekan Efektif (RPE) Kurikulum Merdeka berpedoman pada Keputusan Kepala BSKAP Nomor 046/H/KR/2025 dan Kalender Akademik untuk:
Nama Sekolah: ${namaSekolah}
Kelas: Kelas ${kelas}
Mata Pelajaran: ${mataPelajaran}
Semester: ${semester} (${isGanjil ? 'Ganjil' : 'Genap'})
Tahun Pelajaran: ${tahunPelajaran}
JP Per Minggu/Pekan: ${jpNum} JP
Catatan Tambahan/Kondisi Kalender Akademik: ${catatanTambahan || 'Tidak ada'}

Tugas Anda:
1. Analisis alokasi pekan untuk 6 bulan berikut: ${bulansList.join(', ')}.
2. Untuk setiap bulan, tentukan:
   - Jumlah Pekan (biasanya berkisar 4 atau 5 pekan). Total jumlah pekan satu semester berkisar 25-27 pekan.
   - Pekan Efektif (jumlah pekan di mana KBM efektif berlangsung).
   - Pekan Tidak Efektif (jumlah pekan di mana KBM tidak berlangsung karena libur, asesmen, atau kegiatan khusus).
   - Keterangan (penjelasan singkat mengapa ada pekan tidak efektif, misal: 'Libur Akhir Semester', 'Asesmen Sumatif Akhir', 'Penyerahan Rapor').
3. Tulis daftar 'Pekan Tidak Efektif' secara rinci yang berisi nama kegiatan, durasi pekan, dan penjelasannya.
4. Hitung rekapitulasi:
   - Total Pekan dalam Semester (jumlah dari semua pekan per bulan).
   - Total Pekan Tidak Efektif (jumlah dari seluruh pekan tidak efektif).
   - Total Pekan Efektif = Total Pekan dalam Semester – Total Pekan Tidak Efektif.
   - Total Jam Efektif = Total Pekan Efektif × JP Per Pekan.
5. Rumuskan formula teks:
   - totalPekanEfektifFormula: Formatnya harus seperti "26 Pekan - 6 Pekan = 20 Pekan" (sesuaikan angkanya).
   - totalJamEfektifFormula: Formatnya harus seperti "20 Pekan x 4 JP = 80 JP" (sesuaikan angkanya).
6. Berikan tanggalDokumen yang sesuai (misal: "Ceria, 13 Juli 2026").
7. Berikan catatanAnalisis singkat mengenai rincian kalender pendidikan ini sesuai ketentuan alokasi BSKAP 046/H/KR/2025.

Pastikan data yang Anda hasilkan konsisten dan akurat secara matematis!`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah pakar administrasi kurikulum sekolah Indonesia yang berpedoman pada Keputusan Kepala BSKAP Nomor 046/H/KR/2025. Susunlah Rincian Pekan Efektif (RPE) dalam format JSON yang valid dan akurat secara matematis. Pastikan total pekan per bulan sesuai dengan akumulasi total pekan keseluruhan, dan rumus perhitungan jam efektif benar. Berikan deskripsi yang padat, profesional, dan realistis untuk kalender akademik Indonesia tahun pelajaran ${tahunPelajaran}.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identitas: {
              type: Type.OBJECT,
              properties: {
                namaSekolah: { type: Type.STRING },
                kelas: { type: Type.STRING },
                jpPerMinggu: { type: Type.INTEGER },
                mataPelajaran: { type: Type.STRING },
                semester: { type: Type.STRING },
                tahunPelajaran: { type: Type.STRING },
              },
              required: ['namaSekolah', 'kelas', 'jpPerMinggu', 'mataPelajaran', 'semester', 'tahunPelajaran'],
            },
            alokasiWaktu: {
              type: Type.OBJECT,
              properties: {
                bulans: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      no: { type: Type.INTEGER },
                      bulan: { type: Type.STRING },
                      jumlahPekan: { type: Type.INTEGER },
                      pekanEfektif: { type: Type.INTEGER },
                      pekanTidakEfektif: { type: Type.INTEGER },
                      keterangan: { type: Type.STRING },
                    },
                    required: ['no', 'bulan', 'jumlahPekan', 'pekanEfektif', 'pekanTidakEfektif', 'keterangan'],
                  },
                },
                totalPekan: { type: Type.INTEGER },
                totalPekanEfektif: { type: Type.INTEGER },
                totalPekanTidakEfektif: { type: Type.INTEGER },
              },
              required: ['bulans', 'totalPekan', 'totalPekanEfektif', 'totalPekanTidakEfektif'],
            },
            pekanTidakEfektif: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  no: { type: Type.INTEGER },
                  uraianKegiatan: { type: Type.STRING },
                  jumlahPekan: { type: Type.INTEGER },
                  keterangan: { type: Type.STRING },
                },
                required: ['no', 'uraianKegiatan', 'jumlahPekan', 'keterangan'],
              },
            },
            totalPekanEfektifFormula: { type: Type.STRING },
            totalJamEfektifFormula: { type: Type.STRING },
            totalJamEfektif: { type: Type.INTEGER },
            tanggalDokumen: { type: Type.STRING },
            catatanAnalisis: { type: Type.STRING },
          },
          required: [
            'identitas',
            'alokasiWaktu',
            'pekanTidakEfektif',
            'totalPekanEfektifFormula',
            'totalJamEfektifFormula',
            'totalJamEfektif',
            'tanggalDokumen',
          ],
        },
      },
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model Gemini.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for RPE');
    const fallback = getFallbackRPE(
      req.body?.tahunPelajaran,
      req.body?.semester
    );
    res.json(fallback);
  }
});

// 4d. Generate Program Tahunan (PROTA)
app.post('/api/generate-prota', async (req, res) => {
  try {
    const {
      mataPelajaran,
      kelas,
      fase,
      tahunPelajaran,
      totalJp2Semester,
      alokasiWaktuTiapMinggu,
      semester1Weeks,
      semester2Weeks,
      babSemester1,
      babSemester2,
      tujuanPembelajaranRaw,
      rentangProgram = 'full'
    } = req.body;

    if (!mataPelajaran || !kelas || !fase || !tahunPelajaran || !totalJp2Semester || !alokasiWaktuTiapMinggu) {
      return res.status(400).json({ error: 'Seluruh input parameter utama wajib diisi.' });
    }

    const ai = getAiClient();
    
    let prompt = '';
    if (rentangProgram === 'semester_1') {
      prompt = `Buatkan Dokumen Program Semester I (Ganjil) Kurikulum Merdeka (Format Tabel PROTA Ganjil) berdasar parameter berikut berpedoman pada Keputusan Kepala BSKAP Nomor 046/H/KR/2025 & Permendikdasmen No. 13 Tahun 2025:
Mata Pelajaran: ${mataPelajaran}
Kelas: Kelas ${kelas}
Fase: Fase ${fase}
Tahun Pelajaran: ${tahunPelajaran}
Total JP Semester 1: ${totalJp2Semester}
Alokasi Waktu per Minggu: ${alokasiWaktuTiapMinggu}
Semester 1 (Ganjil): ${semester1Weeks || '20'} Pekan

Daftar Bab Semester 1:
${babSemester1 || 'Ditentukan otomatis oleh AI sesuai standar BSKAP 046/H/KR/2025'}

Daftar Tujuan Pembelajaran Lengkap (ATP) Semester 1:
${tujuanPembelajaranRaw || 'Ditentukan otomatis berdasar Capaian Pembelajaran Keputusan Kepala BSKAP Nomor 046/H/KR/2025'}

Tugas Anda:
1. Susunlah tabel Program untuk Semester I (Ganjil) dalam format data JSON terstruktur.
2. Setiap baris mewakili satu Alur Tujuan Pembelajaran (ATP) khusus untuk Semester I.
3. Kolom yang harus diisi:
   - no: Nomor urut bab dan ATP (contoh: "1.1", "1.2", "2.1", dsb.).
   - bab: Nama bab yang sesuai.
   - tujuanPembelajaran: Tulis ulang kalimat Tujuan Pembelajaran sesuai data di atas dengan presisi (jangan mengubah substansi).
   - materi: Pokok bahasan/sub-materi spesifik yang ditarik dari Tujuan Pembelajaran tersebut.
   - alokasiWaktu: Tuliskan jam pelajaran (contoh: "4 JP", "8 JP") yang disesuaikan dengan kompleksitas materi dan kelipatan alokasi waktu mingguan. Total alokasi waktu JP semua baris harus sinkron dengan total JP semester 1.
   - semester: Tuliskan "I (Ganjil)" secara tepat untuk semua baris.
4. Tentukan tanggalDokumen yang sesuai (misal: "Jakarta, 13 Juli 2026").
5. Tulis nama kepalaSekolah dan guruMapel placeholder jika tidak diisi.

Kembalikan hasil dalam format JSON yang valid.`;
    } else if (rentangProgram === 'semester_2') {
      prompt = `Buatkan Dokumen Program Semester II (Genap) Kurikulum Merdeka (Format Tabel PROTA Genap) berdasar parameter berikut berpedoman pada Keputusan Kepala BSKAP Nomor 046/H/KR/2025 & Permendikdasmen No. 13 Tahun 2025:
Mata Pelajaran: ${mataPelajaran}
Kelas: Kelas ${kelas}
Fase: Fase ${fase}
Tahun Pelajaran: ${tahunPelajaran}
Total JP Semester 2: ${totalJp2Semester}
Alokasi Waktu per Minggu: ${alokasiWaktuTiapMinggu}
Semester 2 (Genap): ${semester2Weeks || '21'} Pekan

Daftar Bab Semester 2:
${babSemester2 || 'Ditentukan otomatis oleh AI sesuai standar BSKAP 046/H/KR/2025'}

Daftar Tujuan Pembelajaran Lengkap (ATP) Semester 2:
${tujuanPembelajaranRaw || 'Ditentukan otomatis berdasar Capaian Pembelajaran Keputusan Kepala BSKAP Nomor 046/H/KR/2025'}

Tugas Anda:
1. Susunlah tabel Program untuk Semester II (Genap) dalam format data JSON terstruktur.
2. Setiap baris mewakili satu Alur Tujuan Pembelajaran (ATP) khusus untuk Semester II.
3. Kolom yang harus diisi:
   - no: Nomor urut bab dan ATP (contoh: "3.1", "3.2", "4.1", dsb.).
   - bab: Nama bab yang sesuai.
   - tujuanPembelajaran: Tulis ulang kalimat Tujuan Pembelajaran sesuai data di atas dengan presisi (jangan mengubah substansi).
   - materi: Pokok bahasan/sub-materi spesifik yang ditarik dari Tujuan Pembelajaran tersebut.
   - alokasiWaktu: Tuliskan jam pelajaran (contoh: "4 JP", "8 JP") yang disesuaikan dengan kompleksitas materi dan kelipatan alokasi waktu mingguan. Total alokasi waktu JP semua baris harus sinkron dengan total JP semester 2.
   - semester: Tuliskan "II (Genap)" secara tepat untuk semua baris.
4. Tentukan tanggalDokumen yang sesuai (misal: "Jakarta, 13 Juli 2026").
5. Tulis nama kepalaSekolah dan guruMapel placeholder jika tidak diisi.

Kembalikan hasil dalam format JSON yang valid.`;
    } else {
      prompt = `Buatkan Dokumen Program Tahunan (PROTA) Kurikulum Merdeka berpedoman pada Keputusan Kepala BSKAP Nomor 046/H/KR/2025 & Permendikdasmen No. 13 Tahun 2025 berdasar parameter berikut:
Mata Pelajaran: ${mataPelajaran}
Kelas: Kelas ${kelas}
Fase: Fase ${fase}
Tahun Pelajaran: ${tahunPelajaran}
Total JP 2 Semester: ${totalJp2Semester}
Alokasi Waktu per Minggu: ${alokasiWaktuTiapMinggu}
Semester 1 (Ganjil): ${semester1Weeks || '20'} Pekan
Semester 2 (Genap): ${semester2Weeks || '21'} Pekan

Daftar Bab & Pembagian Semester:
- Bab Semester 1:
${babSemester1 || 'Ditentukan otomatis oleh AI sesuai standar BSKAP 046/H/KR/2025'}

- Bab Semester 2:
${babSemester2 || 'Ditentukan otomatis oleh AI sesuai standar BSKAP 046/H/KR/2025'}

Daftar Tujuan Pembelajaran Lengkap (ATP):
${tujuanPembelajaranRaw || 'Ditentukan otomatis berdasar Capaian Pembelajaran Keputusan Kepala BSKAP Nomor 046/H/KR/2025'}

Tugas Anda:
1. Susunlah tabel Program Tahunan (PROTA) dalam format data JSON terstruktur.
2. Setiap baris mewakili satu Alur Tujuan Pembelajaran (ATP).
3. Kolom yang harus diisi:
   - no: Nomor urut bab dan ATP (contoh: "1.1", "1.2", "2.1", dsb.).
   - bab: Nama bab yang sesuai.
   - tujuanPembelajaran: Tulis ulang kalimat Tujuan Pembelajaran sesuai data di atas dengan presisi (jangan mengubah substansi).
   - materi: Pokok bahasan/sub-materi spesifik yang ditarik dari Tujuan Pembelajaran tersebut.
   - alokasiWaktu: Tuliskan jam pelajaran (contoh: "4 JP", "8 JP") yang disesuaikan dengan kompleksitas materi dan kelipatan alokasi waktu mingguan. Total alokasi waktu JP semua baris harus sinkron dengan perkiraan total JP 2 semester.
   - semester: Tuliskan "I (Ganjil)" atau "II (Genap)" secara tepat sesuai pembagian bab.
4. Tentukan tanggalDokumen yang sesuai (misal: "Jakarta, 13 Juli 2026").
5. Tulis nama kepalaSekolah dan guruMapel placeholder jika tidak diisi.

Kembalikan hasil dalam format JSON yang valid.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah pakar kurikulum sekolah Indonesia yang menyusun Program Tahunan (PROTA) Kurikulum Merdeka secara rapi dan profesional berlandaskan Keputusan Kepala BSKAP Nomor 046/H/KR/2025 dan Permendikdasmen No. 13 Tahun 2025 dalam format JSON. Pastikan seluruh tujuan pembelajaran dipetakan ke bab yang benar dengan alokasi waktu (JP) yang realistis sesuai format mingguan dan total semester.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identitas: {
              type: Type.OBJECT,
              properties: {
                mataPelajaran: { type: Type.STRING },
                kelas: { type: Type.STRING },
                fase: { type: Type.STRING },
                tahunPelajaran: { type: Type.STRING },
                totalJp2Semester: { type: Type.STRING },
                alokasiWaktuTiapMinggu: { type: Type.STRING },
                semester1Weeks: { type: Type.STRING },
                semester2Weeks: { type: Type.STRING }
              },
              required: ['mataPelajaran', 'kelas', 'fase', 'tahunPelajaran', 'totalJp2Semester', 'alokasiWaktuTiapMinggu']
            },
            rows: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  no: { type: Type.STRING },
                  bab: { type: Type.STRING },
                  tujuanPembelajaran: { type: Type.STRING },
                  materi: { type: Type.STRING },
                  alokasiWaktu: { type: Type.STRING },
                  semester: { type: Type.STRING }
                },
                required: ['no', 'bab', 'tujuanPembelajaran', 'materi', 'alokasiWaktu', 'semester']
              }
            },
            tanggalDokumen: { type: Type.STRING },
            kepalaSekolah: { type: Type.STRING },
            guruMapel: { type: Type.STRING }
          },
          required: ['identitas', 'rows', 'tanggalDokumen']
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model Gemini.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for PROTA');
    const fallback = getFallbackProta(
      req.body?.kelas,
      req.body?.semester,
      req.body?.tahunPelajaran
    );
    res.json(fallback);
  }
});

// 4e. Generate Program Semester (PROSEM)
app.post('/api/generate-prosem', async (req, res) => {
  try {
    const {
      mataPelajaran,
      kelas,
      fase,
      tahunPelajaran,
      alokasiWaktuTiapMinggu,
      protaContent
    } = req.body;

    if (!mataPelajaran || !kelas || !fase || !tahunPelajaran) {
      return res.status(400).json({ error: 'Mata pelajaran, kelas, fase, dan tahun pelajaran wajib diisi.' });
    }

    const weeklyJp = parseInt(alokasiWaktuTiapMinggu || '4', 10);

    const ai = getAiClient();
    const prompt = `Buatlah Program Semester (PROSEM) lengkap untuk Ganjil (Semester I) dan Genap (Semester II) berpedoman pada Keputusan Kepala BSKAP Nomor 046/H/KR/2025 & Permendikdasmen No. 13 Tahun 2025 berdasarkan Program Tahunan (PROTA) berikut:
Mata Pelajaran: ${mataPelajaran}
Kelas: Kelas ${kelas}
Fase: Fase ${fase}
Tahun Pelajaran: ${tahunPelajaran}
Alokasi JP per Minggu: ${weeklyJp} JP

Data PROTA Acuan:
${protaContent || 'Gunakan kurikulum standar nasional sesuai Keputusan Kepala BSKAP Nomor 046/H/KR/2025 jika tidak dilampirkan'}

Ketentuan Penting Penjadwalan Pekan Efektif & Tidak Efektif:
1. Pembagian Pekan per Bulan:
   - Juli: 4 pekan (2 efektif, 2 tidak efektif). Pekan 1-2 tidak efektif (Libur Semester / MPLS jika kelas 1/7/10). Pekan 3-4 efektif.
   - Agustus: 4 pekan (4 efektif, 0 tidak efektif).
   - September: 4 pekan (2 efektif, 2 tidak efektif). Pekan 3-4 tidak efektif (Asesmen Sumatif Tengah Semester / PTS).
   - Oktober: 4 pekan (4 efektif, 0 tidak efektif).
   - November: 4 pekan (4 efektif, 0 tidak efektif).
   - Desember: 4 pekan (2 efektif, 2 tidak efektif). Pekan 1-2 tidak efektif (Asesmen Sumatif Akhir Semester / PAS), pekan 3-4 tidak efektif (Libur Semester).
   - Januari: 4 pekan (4 efektif, 0 tidak efektif).
   - Februari: 4 pekan (4 efektif, 0 tidak efektif).
   - Maret: 4 pekan (0 efektif, 4 tidak efektif). Pekan 1-2 tidak efektif (Asesmen Sumatif Tengah Semester / PTS), pekan 3-4 tidak efektif (Kegiatan Keagamaan / Libur awal Ramadan).
   - April: 5 pekan (5 efektif, 0 tidak efektif).
   - Mei: 4 pekan (4 efektif, 0 tidak efektif).
   - Juni: 4 pekan (2 efektif, 2 tidak efektif). Pekan 1-2 tidak efektif (Asesmen Sumatif Akhir Semester / PAT), pekan 3-4 tidak efektif (Libur Kenaikan Kelas).

2. Aturan Distribusi JP Mingguan:
   - Total JP per minggu adalah ${weeklyJp} JP.
   - Distribusikan alokasi waktu tiap baris materi/ATP secara berurutan pada pekan-pekan EFEKTIF saja.
   - Jika satu pekan tersisa JP (misal materi A sisa 2 JP dari total 4 JP mingguan), maka sisa 2 JP di pekan tersebut digunakan untuk memulai materi berikutnya (Materi B), sehingga total pengisian JP di pekan tersebut tetap tepat ${weeklyJp} JP.
   - Pada pekan TIDAK EFEKTIF, isi kolom value dengan tanda strip "-" atau nama kegiatannya seperti "MPLS", "PTS", "PAS", atau "L" (Libur) dan pastikan isEffective = false.

3. Keterangan:
   - Jika kelas adalah 1, 7, atau 10, sebutkan adanya kegiatan Masa Pengenalan Lingkungan Sekolah (MPLS) di pekan 1-2 Juli. Jika kelas selain itu, tidak perlu sebutkan MPLS.

Susunlah struktur data PROSEM secara lengkap untuk semester Ganjil dan Genap sesuai schema JSON berikut.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah asisten pakar kurikulum sekolah yang menyusun Program Semester (PROSEM) Kurikulum Merdeka berlandaskan Keputusan Kepala BSKAP Nomor 046/H/KR/2025 secara akurat, konsisten, dan rapi dalam format JSON. Distribusikan JP secara berurutan dan matematis agar jumlah JP per pekan efektif tepat sesuai alokasi mingguan.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identitas: {
              type: Type.OBJECT,
              properties: {
                mataPelajaran: { type: Type.STRING },
                kelas: { type: Type.STRING },
                fase: { type: Type.STRING },
                tahunPelajaran: { type: Type.STRING },
                alokasiWaktuTiapMinggu: { type: Type.STRING }
              },
              required: ['mataPelajaran', 'kelas', 'fase', 'tahunPelajaran', 'alokasiWaktuTiapMinggu']
            },
            ganjil: {
              type: Type.OBJECT,
              properties: {
                monthsHeader: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      monthName: { type: Type.STRING },
                      totalWeeks: { type: Type.INTEGER },
                      nonEffectiveWeeks: {
                        type: Type.ARRAY,
                        items: { type: Type.INTEGER }
                      }
                    },
                    required: ['monthName', 'totalWeeks', 'nonEffectiveWeeks']
                  }
                },
                rows: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      no: { type: Type.STRING },
                      bab: { type: Type.STRING },
                      topik: { type: Type.STRING },
                      pertemuanKe: { type: Type.STRING },
                      alokasiWaktu: { type: Type.STRING },
                      months: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            monthName: { type: Type.STRING },
                            weeks: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  weekNum: { type: Type.INTEGER },
                                  value: { type: Type.STRING },
                                  isEffective: { type: Type.BOOLEAN }
                                },
                                required: ['weekNum', 'value', 'isEffective']
                              }
                            }
                          },
                          required: ['monthName', 'weeks']
                        }
                      }
                    },
                    required: ['no', 'bab', 'topik', 'pertemuanKe', 'alokasiWaktu', 'months']
                  }
                }
              },
              required: ['monthsHeader', 'rows']
            },
            genap: {
              type: Type.OBJECT,
              properties: {
                monthsHeader: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      monthName: { type: Type.STRING },
                      totalWeeks: { type: Type.INTEGER },
                      nonEffectiveWeeks: {
                        type: Type.ARRAY,
                        items: { type: Type.INTEGER }
                      }
                    },
                    required: ['monthName', 'totalWeeks', 'nonEffectiveWeeks']
                  }
                },
                rows: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      no: { type: Type.STRING },
                      bab: { type: Type.STRING },
                      topik: { type: Type.STRING },
                      pertemuanKe: { type: Type.STRING },
                      alokasiWaktu: { type: Type.STRING },
                      months: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            monthName: { type: Type.STRING },
                            weeks: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  weekNum: { type: Type.INTEGER },
                                  value: { type: Type.STRING },
                                  isEffective: { type: Type.BOOLEAN }
                                },
                                required: ['weekNum', 'value', 'isEffective']
                              }
                            }
                          },
                          required: ['monthName', 'weeks']
                        }
                      }
                    },
                    required: ['no', 'bab', 'topik', 'pertemuanKe', 'alokasiWaktu', 'months']
                  }
                }
              },
              required: ['monthsHeader', 'rows']
            },
            keterangan: { type: Type.STRING },
            tanggalDokumen: { type: Type.STRING },
            kepalaSekolah: { type: Type.STRING },
            guruMapel: { type: Type.STRING }
          },
          required: ['identitas', 'ganjil', 'genap', 'keterangan', 'tanggalDokumen']
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model Gemini.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for PROSEM');
    const fallback = getFallbackProsem(
      req.body?.kelas,
      req.body?.semester,
      req.body?.tahunPelajaran
    );
    res.json(fallback);
  }
});

// 4f. Generate Slide Presentasi PPT (PowerPoint)
app.post('/api/generate-slides', async (req, res) => {
  try {
    const {
      mataPelajaran,
      kelas,
      fase,
      topikMateri,
      jumlahSlide,
      gayaDesain,
      guruPenyusun,
      tanggalDokumen
    } = req.body;

    if (!mataPelajaran || !kelas || !fase || !topikMateri || !jumlahSlide || !gayaDesain) {
      return res.status(400).json({ error: 'Mata pelajaran, kelas, fase, topik materi, jumlah slide, dan gaya desain wajib diisi.' });
    }

    const slidesCount = parseInt(jumlahSlide || '8', 10);
    const ai = getAiClient();
    const prompt = `Buatkan rancangan Slide Presentasi PPT (PowerPoint) Pembelajaran Kurikulum Merdeka yang interaktif, berpusat pada murid, dan berstruktur profesional:
Mata Pelajaran: ${mataPelajaran}
Kelas: Kelas ${kelas} (Fase ${fase})
Topik/Materi Pembelajaran: ${topikMateri}
Jumlah Slide: ${slidesCount} Slide
Gaya Desain Visual: ${gayaDesain}
Guru Penyusun: ${guruPenyusun || 'Guru Kelas'}

Ketentuan Sangat Penting:
1. TOPIK / MATERI PEMBELAJARAN "${topikMateri}" WAJIB menjadi tema utama dan ditampilkan secara eksplisit:
   - Pada Slide 1 (Cover / Judul): Tampilkan topik "${topikMateri}" sebagai Judul Utama atau Subjudul Utama yang besar dan jelas, bersama Mata Pelajaran ${mataPelajaran}, Kelas ${kelas} (Fase ${fase}), dan Penyusun.
   - Pada Slide 2: Tujuan Pembelajaran & Apersepsi khusus materi "${topikMateri}".
   - Pada Slide 3 s.d. (N-1): Pembahasan Materi Inti "${topikMateri}" (konsep, teknik/langkah kerja, contoh nyata, aktivitas eksplorasi).
   - Pada Slide Terakhir (Slide N): Refleksi, Kuis/Asesmen Pemahaman Cepat untuk materi "${topikMateri}", kesimpulan, dan pesan penutup.
2. Konten Slide (points):
   - Buat 3-5 poin (bullet points) padat, tajam, dan mudah dipahami oleh murid.
3. Rekomendasi Visual (visualRecommendation):
   - Deskripsikan konsep visual yang sesuai dengan materi "${topikMateri}" dan gaya "${gayaDesain}".
4. Catatan Pemateri (speakerNotes):
   - Berikan arahan narasi guru untuk memandu murid memahami materi "${topikMateri}".

Kembalikan hasil dalam format JSON terstruktur lengkap sesuai schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah pakar desain teknologi instruksional dan media pembelajaran interaktif Indonesia yang ahli menyusun rancangan slide presentasi PPT (PowerPoint) kurikulum merdeka dalam format JSON secara kreatif, lengkap, dan berstruktur rapi.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identitas: {
              type: Type.OBJECT,
              properties: {
                mataPelajaran: { type: Type.STRING },
                kelas: { type: Type.STRING },
                fase: { type: Type.STRING },
                topikMateri: { type: Type.STRING },
                jumlahSlide: { type: Type.STRING },
                gayaDesain: { type: Type.STRING },
                tanggalDokumen: { type: Type.STRING },
                guruPenyusun: { type: Type.STRING }
              },
              required: ['mataPelajaran', 'kelas', 'fase', 'topikMateri', 'jumlahSlide', 'gayaDesain', 'tanggalDokumen']
            },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  slideNo: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  layoutType: { type: Type.STRING },
                  points: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  visualRecommendation: { type: Type.STRING },
                  speakerNotes: { type: Type.STRING }
                },
                required: ['slideNo', 'title', 'layoutType', 'points', 'visualRecommendation', 'speakerNotes']
              }
            }
          },
          required: ['identitas', 'slides']
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model Gemini.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for Slides');
    const fallback = getFallbackSlides(
      req.body?.topikMateri,
      req.body?.kelas,
      req.body?.jumlahSlide,
      req.body
    );
    res.json(fallback);
  }
});

// 10. Generate Deep Learning RPM (Rencana Pembelajaran Mendalam) & LKPD
app.post('/api/generate-rpm', async (req, res) => {
  try {
    const { 
      grade, 
      fase: faseInput,
      materi, 
      penyusun, 
      sekolah, 
      tahunAjaran, 
      semester, 
      mataPelajaran, 
      bab, 
      alokasiWaktu,
      jumlahPertemuan = '2',
      konteksTambahan 
    } = req.body;

    if (!grade || !materi || !penyusun || !sekolah) {
      return res.status(400).json({ error: 'Input wajib (Kelas, Topik, Penyusun, Sekolah) harus diisi.' });
    }

    const { kelas, fase, kelasFaseFormatted } = parseKelasFase(grade, faseInput);
    const is1Pertemuan = !req.body?.is1Tp && !req.body?.isSatuBab && !!(req.body?.is1Pertemuan || req.body?.mode === '1_pertemuan' || req.body?.mode === 'deep_learning_1pertemuan' || req.body?.jumlahPertemuan === '1' || (req.body?.alokasiWaktu && String(req.body?.alokasiWaktu).includes('2x40')));
    const is1Tp = !is1Pertemuan && !!(req.body?.is1Tp || req.body?.mode === '1_tp' || (req.body?.alokasiWaktu && String(req.body?.alokasiWaktu).includes('6x40')) || req.body?.mode === 'deep_learning_1tp');
    const isSatuBab = !is1Pertemuan && !is1Tp && !!(req.body?.isSatuBab || req.body?.mode === 'satu_bab' || req.body?.jumlahPertemuan === '8' || (req.body?.alokasiWaktu && String(req.body?.alokasiWaktu).includes('16x40')));
    const countPertemuan = is1Pertemuan
      ? 1
      : is1Tp 
        ? Math.max(1, Math.min(4, parseInt(jumlahPertemuan) || 2))
        : isSatuBab 
          ? 8 
          : Math.max(1, Math.min(16, parseInt(jumlahPertemuan) || 2));
    const finalAlokasi = is1Pertemuan
      ? (alokasiWaktu || '2x40 Menit')
      : is1Tp
        ? (alokasiWaktu || (countPertemuan === 3 ? '6x40 Menit (3 Pertemuan)' : '6x40 Menit (2 Pertemuan)'))
        : isSatuBab 
          ? (alokasiWaktu || '16x40 Menit (8 Pertemuan)')
          : (alokasiWaktu || `${countPertemuan * 2} × 40 Menit (${countPertemuan} Pertemuan)`);

    if (isGeminiAccessDenied()) {
      console.info(`[AI Generator] Using offline template for RPM (${is1Pertemuan ? '1 Pertemuan 2x40 Menit (Lendi format)' : is1Tp ? '1 TP (rafsanjani format)' : isSatuBab ? '1 Bab 8 Pertemuan' : 'Standar'})`);
      const fallback = is1Pertemuan ? getFallbackRPM1Pertemuan(req.body) : is1Tp ? getFallbackRPM1Tp(req.body) : isSatuBab ? getFallbackRPMSatuBab(req.body) : getFallbackRPM(req.body);
      return res.json(fallback);
    }

    const ai = getAiClient();
    const prompt = is1Pertemuan ? `Prompt Menyusun Perencanaan Pembelajaran Mendalam Menggunakan Claude, Gemini, ChatGPT, dll
Penyusun: Lendi Ike Hermawan, S.Pd., Gr.

Tuliskan Perencanaan Pembelajaran Mendalam (RPM) untuk 1 Pertemuan (Alokasi Waktu: ${finalAlokasi}) dengan struktur format berikut dalam bentuk tabel:

A. Identitas
Penyusun: ${penyusun || 'Lendi Ike Hermawan, S.Pd., Gr.'}
Sekolah: ${sekolah}
Tahun Ajaran: ${tahunAjaran || '2025/2026'}
Semester: ${semester || '1'}
Mata Pelajaran: ${mataPelajaran || 'PJOK'}
Kelas/Fase Capaian: ${kelasFaseFormatted}
Topik: ${materi}
Alokasi Waktu: ${finalAlokasi}

B. Identifikasi
Identifikasi Murid (uraikan pengetahuan awal, minat belajar, kebutuhan belajar).
Materi Pelajaran (faktual, konseptual, prosedural, metakognitif).
Dimensi Profil Lulusan (pilih dimensi yang sesuai yaitu keimanan dan ketakwaan kepada Tuhan Yang Maha Esa, kewargaan, penalaran kritis, kreativitas, kolaborasi, kemandirian, kesehatan, atau komunikasi).

C. Desain Pembelajaran
Capaian Pembelajaran: ${req.body?.capaianPembelajaran || 'Sesuai kurikulum BSKAP 046/H/KR/2025'}
Lintas Disiplin Ilmu
Tujuan Pembelajaran: ${req.body?.tujuanPembelajaran || 'Berdasarkan capaian pembelajaran, tuliskan tujuan pembelajaran yang merinci kompetensi yang harus dikuasai murid dalam satu pertemuan sesuai alokasi waktu diatas mencakup level kognitif mengingat/memahami/menerapkan/menganalisis/merefleksi/mencipta dalam 1 tujuan saja. Gunakan kata "Murid ..." dalam merumuskan Tujuan.'}
Topik Pembelajaran
Praktik Pedagogis (Tuliskan Pendekatan Deep Learning, Model beserta sintaks/langkah-langkahnya, dan Metode yang digunakan).
Kemitraan Pembelajaran
Lingkungan Pembelajaran
Pemanfaatan Digital

D. Pengalaman Belajar
- Kegiatan Awal (durasi 15 menit): terapkan prinsip pembelajaran berkesadaran (mindful), bermakna (meaningful), dan/atau menggembirakan (joyful). Awali dengan mengucap salam kemudian kegiatan berdoa, mengecek kehadiran, apersepsi kontekstual, dan pemanasan ceria. Tuliskan prinsip pembelajaran di awal.
- Kegiatan Inti (durasi 60 menit): terapkan tahapan Memahami (Sintaks Model) (15 Menit), Mengaplikasikan (Sintaks Model) (30 Menit), Merefleksikan (Sintaks Model) (15 Menit). Setiap tahapan berisikan minimal 4 poin kegiatan bernomor 1, 2, 3, 4 dengan Dimensi Profil Lulusan ditulis di akhir kalimat dengan tanda kurung contoh: (... (Kesehatan, Kolaborasi)).
- Kegiatan Penutup (durasi 5 menit): pendinginan relaksasi santai, simpulan bersama, umpan balik, rencana tindak lanjut, doa penutup, dan salam.

E. Asesmen Pembelajaran: Awal, Proses, Akhir.
Tanda Tangan: Kepala Sekolah bernama Soleh, S.Pd., M.Pd. dan Guru Mata Pelajaran (${penyusun || 'Lendi Ike Hermawan, S.Pd., Gr.'}).

LAMPIRAN (Terpisah dengan Tabel RPP):
1. Asesmen Diagnostik Non-kognitif (Tujuan dan pertanyaan)
2. Soal asesmen awal: 5 butir soal beserta kunci jawabannya.
3. Asesmen Formatif (Diskusi, Presentasi, Unjuk Kerja skala 1-5).
4. Lembar Penilaian Sikap (Spiritual, Sosial, SL/SR/KD/TP).
5. Rubrik Penilaian Pengetahuan LKPD (Gunakan 4 Skala Penilaian).
6. Rubrik Penilaian Keterampilan Unjuk Kerja Praktik Gerak (Gunakan 4 Skala Penilaian).
7. Pengayaan & Remedial.
8. Refleksi Guru & Peserta Didik.
9. LEMBAR KERJA PESERTA DIDIK (LKPD) UNTUK PERTEMUAN 1 (NON-TABEL): Memuat identitas diri, petunjuk, sintaks & aktivitas siswa, pengalaman belajar (Memahami [min 3 soal], Mengaplikasikan [studi kasus kontekstual + instruksi + ruang jawaban], Merefleksikan [2-3 soal]), dan penutup (pesan penyemangat, ceklis mandiri, catatan guru). LKPD TIDAK DIBUAT DALAM BENTUK TABEL.
10. Materi Ajar: Ringkasan materi ajar yang ringkas dan jelas.`
    : is1Tp ? `Prompt Menyusun Perencanaan Pembelajaran Mendalam Menggunakan Claude, Gemini, ChatGPT, dll
Penyusun: rafsanjani, S.Pd., Gr.

Tuliskan Perencanaan Pembelajaran Mendalam (RPM) dengan struktur format berikut dalam bentuk tabel 2 kolom (Kolom 1: Komponen & Sub-komponen; Kolom 2: Isi):

A. Identitas
Penyusun: ${penyusun || 'rafsanjani, S.Pd., Gr.'}
Sekolah: ${sekolah}
Tahun Ajaran: ${tahunAjaran || '2025/2026'}
Semester: ${semester || '1'}
Mata Pelajaran: ${mataPelajaran || 'PJOK'}
Kelas/Fase Capaian: ${kelasFaseFormatted}
Topik: ${materi}
Alokasi Waktu: ${finalAlokasi}

B. Identifikasi
Identifikasi Murid (uraikan pengetahuan awal, minat belajar, kebutuhan belajar).
Materi Pelajaran (faktual, konseptual, prosedural, metakognitif).
Dimensi Profil Lulusan (pilih dimensi yang sesuai yaitu keimanan dan ketakwaan kepada Tuhan Yang Maha Esa, kewargaan, penalaran kritis, kreativitas, kolaborasi, kemandirian, kesehatan, atau komunikasi).

C. Desain Pembelajaran
Capaian Pembelajaran (sesuai kurikulum)
Lintas Disiplin Ilmu
Tujuan Pembelajaran (berdasarkan capaian pembelajaran, tuliskan tujuan pembelajaran yang merinci kompetensi yang harus dikuasai murid dalam satu pertemuan sesuai alokasi waktu diatas mencakup level kognitif mengingat/memahami/menerapkan/menganalisis/merefleksi/mencipta dalam 1 tujuan saja. Gunakan kata "Murid ..." dalam merumuskan Tujuan. 1 Tujuan Pembelajaran dibuat untuk ${countPertemuan} pertemuan: "${req.body?.tujuanPembelajaran || ''}").
Topik Pembelajaran (Sesuai dengan tujuan diuraikan setiap pertemuan: Pertemuan 1 sampai ${countPertemuan})
Praktik Pedagogis (Tuliskan Pendekatan Pembelajaran Mendalam (Deep Learning), Model (Tuliskan juga sintaks/Langkah-langkahnya), Metode yang digunakan. Model dan Metode dituliskan setiap pertemuan yaitu Pertemuan 1 sampai Pertemuan ${countPertemuan})
Kemitraan Pembelajaran
Lingkungan Pembelajaran
Pemanfaatan Digital

D. Pengalaman Belajar
Buatkan secara ringkas dan jelas langkah kegiatan awal dengan durasi 15 menit berdasarkan tujuan pembelajaran diatas, Susunlah kegiatan awal yang menerapkan prinsip pembelajaran berkesadaran, bermakna, dan/atau menggembirakan. Awali dengan mengucap salam kemudian kegiatan berdoa dan mengecek kehadiran. Tuliskan prinsip pembelajaran yang digunakan misal (Berkesadaran, Bermakna, Menggembirakan) di awal sebelum rincian.

Buatkan kegiatan inti dengan durasi 60 menit SETIAP PERTEMUAN (Pertemuan 1 sampai ${countPertemuan}): terapkan tahapan Memahami (Sintaks Model) (Waktu), Mengaplikasikan (Sintaks Model) (Waktu), Merefleksikan (Sintaks Model) (Waktu). Setiap tahapan minimal 4 poin kegiatan/aktivitas bernomor 1, 2, 3, 4 dengan Dimensi Profil Lulusan ditulis di akhir kalimat dengan tanda kurung contoh: (... (Kesehatan, Kolaborasi)).

Buatkan kegiatan penutup durasi 5 menit berdasarkan tujuan pembelajaran: simpulan, umpan balik, rencana tindak lanjut, doa, dan salam. Gunakan kata "Murid atau Guru" dalam setiap aktivitas.

E. Asesmen Pembelajaran: Awal, Proses, Akhir.
Tanda Tangan: Kepala Sekolah bernama Soleh, S.Pd., M.Pd. dan Guru Mata Pelajaran (${penyusun || 'rafsanjani, S.Pd., Gr.'}).

LAMPIRAN (Terpisah dengan Tabel RPP):
1. Soal asesmen awal: 5 butir soal beserta kunci jawabannya.
2. Rubrik Penilaian Sikap (Gunakan 4 Skala Penilaian).
3. Rubrik Penilaian Pengetahuan (Gunakan 4 Skala Penilaian).
4. Rubrik Penilaian Keterampilan (Gunakan 4 Skala Penilaian).
5. Soal Asesmen Akhir: 5 butir soal sumatif lingkup materi beserta kunci jawabannya atau proyek/produk/praktik.
6. Materi Ajar: Materi ajar ringkas dan jelas.

LEMBAR KERJA PESERTA DIDIK (LKPD) UNTUK SETIAP PERTEMUAN (NON-TABEL):
Buatkan ${countPertemuan} LKPD lengkap non-tabel (Pertemuan 1 sampai ${countPertemuan}) memuat: 1. Identitas diri, 2. Petunjuk penggunaan LKPD, 3. Sintaks & Aktivitas siswa, 4. Pengalaman Belajar (Memahami [min 3 soal], Mengaplikasikan [kasus kontekstual + instruksi + ruang jawaban], Merefleksikan [2-3 soal]), 5. Penutup (pesan penyemangat, catatan guru, cek pemahaman checklist).
LKPD TIDAK DIBUAT DALAM BENTUK TABEL.`
    : isSatuBab ? `Perencanaan Pembelajaran Mendalam (RPM) Satu Bab (${finalAlokasi})
Penyusun: Lendi Ike Hermawan, S.Pd., Gr.

Tuliskan Perencanaan Pembelajaran Mendalam (RPM) lengkap untuk 1 Bab (${finalAlokasi}) dengan struktur format berikut dalam bentuk tabel 2 kolom (Kolom 1: Komponen & Sub-komponen; Kolom 2: Isi):

A. Identitas
Penyusun: ${penyusun}
Sekolah: ${sekolah}
Tahun Ajaran: ${tahunAjaran || '2025/2026'}
Semester: ${semester || '1'}
Mata Pelajaran: ${mataPelajaran || 'PJOK'}
Kelas/Fase Capaian: ${kelasFaseFormatted}
Bab: ${bab || 'Bab 1'}
Topik: ${materi}
Alokasi Waktu: ${finalAlokasi}

B. Identifikasi
- Identifikasi Murid: uraikan pengetahuan awal, minat belajar, kebutuhan belajar untuk 1 bab.
- Materi Pelajaran: uraikan faktual, konseptual, prosedural, metakognitif untuk 1 bab.
- Dimensi Profil Lulusan: pilih dimensi yang sesuai (keimanan dan ketakwaan kepada Tuhan YME, penalaran kritis, kreativitas, kolaborasi, kemandirian, kesehatan, komunikasi).

C. Desain Pembelajaran
- Capaian Pembelajaran: Capaian Pembelajaran sesuai kurikulum dan topik bab ${materi}.
- Lintas Disiplin Ilmu
- Tujuan Pembelajaran: Gunakan kata "Murid..." dalam merumuskan Tujuan. Tujuan Pembelajaran dibuat untuk 1 bab dengan total 8 pertemuan. Uraikan untuk Pertemuan 1, Pertemuan 2, sampai Pertemuan 8 dengan level kognitif (mengingat/memahami/menerapkan/menganalisis/merefleksi/mencipta).
- Topik Pembelajaran: Sub topik yang dibahas setiap pertemuan, tuliskan Pertemuan 1, Pertemuan 2, sampai Pertemuan 8.
- Praktik Pedagogis: Pendekatan Deep Learning, Model (sintaks/langkah), Metode yang digunakan dijabarkan setiap pertemuan (Pertemuan 1 sampai 8).
- Kemitraan Pembelajaran
- Lingkungan Pembelajaran
- Pemanfaatan Digital

D. Pengalaman Belajar
- Kegiatan Awal (durasi 15 menit): terapkan prinsip berkesadaran, bermakna, dan menggembirakan. Awali salam, doa, presensi, apersepsi, motivasi.
- Kegiatan Inti (durasi 60 menit SETIAP PERTEMUAN: Pertemuan 1 s.d. 8): terapkan tahapan Memahami (Sintaks Model) (Waktu), Mengaplikasikan (Sintaks Model) (Waktu), Merefleksikan (Sintaks Model) (Waktu). Setiap tahapan minimal 4 poin aktivitas dengan Dimensi Profil Lulusan ditulis di akhir kalimat dengan tanda kurung contoh: (... (Kesehatan, Kolaborasi)). Uraikan untuk seluruh Pertemuan 1 sampai 8.
- Kegiatan Penutup (durasi 5 menit): simpulan, umpan balik, tindak lanjut, doa, salam.

E. Asesmen Pembelajaran: Awal, Proses, Akhir.
Tanda Tangan: Kepala Sekolah bernama Soleh, S.Pd., M.Pd. dan Guru Mata Pelajaran (${penyusun}).

LAMPIRAN:
1. Soal asesmen awal: 5 butir soal beserta kunci jawaban.
2. Rubrik Penilaian Sikap (4 Skala).
3. Rubrik Penilaian Pengetahuan (4 Skala).
4. Rubrik Penilaian Keterampilan (4 Skala).
5. Soal Asesmen Akhir: 5 butir soal sumatif lingkup materi beserta kunci jawaban.
6. Materi Ajar Ringkas 1 Bab.

LKPD UNTUK 8 PERTEMUAN (NON-TABEL):
Buatkan 8 LKPD lengkap non-tabel (Pertemuan 1 s.d. 8), masing-masing memuat: 1. Identitas, 2. Petunjuk, 3. Sintaks & Aktivitas, 4. Pengalaman Belajar (Memahami [min 3 soal], Mengaplikasikan [studi kasus kontekstual + instruksi + ruang jawaban], Merefleksikan [2-3 soal]), 5. Penutup (pesan penyemangat, catatan guru, checklist pemahaman diri).`
    : `Perencanaan Pembelajaran Mendalam (RPM)
Penyusun: Lendi Ike Hermawan, S.Pd., Gr.

Tuliskan Perencanaan Pembelajaran Mendalam (RPM) lengkap untuk ${countPertemuan} Pertemuan dengan struktur format berikut dalam bentuk tabel 2 kolom (Kolom 1: Komponen & Sub-komponen dibawahnya; Kolom 2: Isi):

A. Identitas
Penyusun: ${penyusun}
Sekolah: ${sekolah}
Tahun Ajaran: ${tahunAjaran || '2025/2026'}
Semester: ${semester || '1'}
Mata Pelajaran: ${mataPelajaran || 'PJOK'}
Kelas/Fase Capaian: ${kelasFaseFormatted}
Bab: ${bab || 'Bab 1'}
Topik: ${materi}
Alokasi Waktu: ${finalAlokasi}

B. Identifikasi
- Identifikasi Murid: uraikan pengetahuan awal, minat belajar, kebutuhan belajar.
- Materi Pelajaran: faktual, konseptual, prosedural, metakognitif.
- Dimensi Profil Lulusan: pilih dimensi yang sesuai yaitu keimanan dan ketakwaan kepada Tuhan Yang Maha Esa, kewargaan, penalaran kritis, kreativitas, kolaborasi, kemandirian, kesehatan, atau komunikasi.

C. Desain Pembelajaran
- Capaian Pembelajaran: Capaian Pembelajaran sesuai kurikulum dan topik ${materi}.
- Lintas Disiplin Ilmu
- Tujuan Pembelajaran: berdasarkan capaian pembelajaran, tuliskan 2-3 tujuan pembelajaran yang merinci kompetensi yang harus dikuasai murid dalam satu pertemuan sesuai alokasi waktu diatas mencakup level kognitif mengingat/memahami/menerapkan/menganalisis/merefleksi/mencipta.
- Topik Pembelajaran: ${materi}
- Praktik Pedagogis: Tuliskan Pendekatan Pembelajaran Mendalam, Model (Tuliskan juga sintaks/Langkah-langkahnya), Metode yang digunakan.
- Kemitraan Pembelajaran
- Lingkungan Pembelajaran
- Pemanfaatan Digital

D. Pengalaman Belajar
- Kegiatan Awal (durasi 15 menit): Buatkan secara ringkas dan jelas langkah kegiatan awal durasi 15 menit berdasarkan tujuan pembelajaran diatas, menerapkan prinsip pembelajaran berkesadaran, bermakna, dan/atau menggembirakan. Awali dengan mengucap salam kemudian kegiatan berdoa dan mengecek kehadiran. Tuliskan prinsip pembelajaran yang digunakan misal (Berkesadaran, Bermakna, Menggembirakan) di awal.
- Kegiatan Inti (durasi 60 menit): Prinsip pembelajaran yang digunakan tetap mindful (berkesadaran), meaningful (bermakna), dan joyful (menggembirakan) agar murid aktif menggali makna dari materi. Prinsip pembelajaran ditulis di awal setiap kegiatan sebelum ke rincian aktivitas. Tahapan pengalaman belajar:
  1. Memahami (Sintaks Model Pembelajaran) (estimasi Waktu)
  2. Mengaplikasikan (Sintaks Model Pembelajaran) (estimasi Waktu)
  3. Merefleksikan (Sintaks Model Pembelajaran) (estimasi Waktu)
  KETENTUAN KHUSUS AKTIVITAS INTI:
  - Aktivitas pembelajaran yang memuat memahami, mengaplikasikan, merefleksi memiliki kaitan dengan sintaks pembelajaran lengkap sesuai model dan metode pembelajaran pada praktik pedagogis.
  - Sintaks pembelajaran ditulis terintegrasi setelah pengalaman belajar dengan tanda kurung contoh: Memahami (Sintaks Model Pembelajaran) (estimasi Waktu)
  - Dimensi Profil Lulusan (DPL) WAJIB ditulis di akhir kalimat aktivitas pembelajaran dengan tanda kurung contoh: (... (Kesehatan, Kolaborasi))
  - Setiap tahapan Pengalaman Belajar (Memahami, Mengaplikasikan, dan Merefleksi) berisikan minimal 4 poin kegiatan/aktivitas pembelajaran. Gunakan penomoran 1, 2, 3, 4 pada setiap tahapan aktivitas.
  - Tuliskan kalimat aktivitas dengan bahasa formal dan konkret yang menggambarkan peran guru dan murid secara jelas.
- Kegiatan Penutup (durasi 5 menit): Buatkan secara ringkas dan jelas langkah kegiatan penutup durasi 5 menit berdasarkan tujuan pembelajaran diatas, menerapkan prinsip berkesadaran, bermakna, dan/atau menggembirakan. Mencakup simpulan, umpan balik, dan rencana tindak lanjut. Akhiri dengan kegiatan berdoa dan mengucapkan salam. Tuliskan prinsip pembelajaran di awal.

E. Asesmen Pembelajaran
- Awal: Tuliskan jenis, bentuk, teknik
- Proses: Tuliskan jenis, bentuk, teknik
- Akhir: Tuliskan jenis, bentuk, teknik

Tanda Tangan
Tempat tanggal pembuatan modul
Tanda tangan Kepala Sekolah bernama: Soleh, S.Pd., M.Pd. dan Guru Mata Pelajaran (${penyusun}).

LAMPIRAN (Terpisah dengan Tabel RPP):
1. Soal asesmen awal: 5 butir soal (lisan/essay/uraian/pilihan ganda) yang relevan dan singkat beserta jawabannya untuk mengukur pengetahuan awal murid.
2. Rubrik Penilaian Sikap (Gunakan 4 Skala Penilaian) sesuai dengan Dimensi Profil Lulusan yang dipilih.
3. Rubrik Penilaian Pengetahuan (Gunakan 4 Skala Penilaian).
4. Rubrik Penilaian Keterampilan (Gunakan 4 Skala Penilaian).
5. Materi Ajar: Buatkan materi ajar yang ringkas dan jelas sesuai topik pembelajaran diatas.

LEMBAR KERJA PESERTA DIDIK (LKPD) UNTUK SETIAP PERTEMUAN:
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
6. LKPD TIDAK DIBUAT DALAM BENTUK TABEL.`;

    const sibiRpmInstruction = buildSibiPromptInstruction(grade, `${bab || ''} ${materi || ''}`);
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `${prompt}\n\n${sibiRpmInstruction}`,
      config: {
        systemInstruction: `Anda adalah asisten pakar kurikulum Pembelajaran Mendalam (Deep Learning) PJOK Kurikulum Merdeka di Indonesia sesuai Buku Panduan Guru PJOK SD/MI dari SIBI (Sistem Informasi Perbukuan Indonesia - buku.kemendikdasmen.go.id, Penulis: Muhajir & Agus Gunawan / Hariyanto, Pusat Perbukuan BSKAP Kemendikdasmen RI) serta format standar Lendi Ike Hermawan, S.Pd., Gr. Tugas Anda adalah menyusun RPM tabel 2-kolom berkualitas tinggi secara lengkap untuk ${countPertemuan} pertemuan (mencakup Pemanasan Permainan Kecil dan Aktivitas Pembelajaran 1, 2, 3 sesuai Buku SIBI), 5 butir soal asesmen awal beserta kunci jawaban, rubrik penilaian 4 skala, materi ajar ringkas, serta LKPD lengkap NON-TABEL. Output wajib dalam format JSON terstruktur.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            identitas: {
              type: Type.OBJECT,
              properties: {
                penyusun: { type: Type.STRING },
                sekolah: { type: Type.STRING },
                tahunAjaran: { type: Type.STRING },
                semester: { type: Type.STRING },
                mataPelajaran: { type: Type.STRING },
                kelasFase: { type: Type.STRING },
                bab: { type: Type.STRING },
                topik: { type: Type.STRING },
                alokasiWaktu: { type: Type.STRING }
              },
              required: ['penyusun', 'sekolah', 'tahunAjaran', 'semester', 'mataPelajaran', 'kelasFase', 'bab', 'topik', 'alokasiWaktu']
            },
            identifikasi: {
              type: Type.OBJECT,
              properties: {
                identifikasiMurid: { type: Type.STRING, description: 'Uraian pengetahuan awal, minat belajar, kebutuhan belajar' },
                materiPelajaran: { type: Type.STRING, description: 'Uraian faktual, konseptual, prosedural, metakognitif' },
                dimensiProfilLulusan: { type: Type.STRING, description: 'Dimensi profil lulusan yang sesuai' }
              },
              required: ['identifikasiMurid', 'materiPelajaran', 'dimensiProfilLulusan']
            },
            desainPembelajaran: {
              type: Type.OBJECT,
              properties: {
                capaianPembelajaran: { type: Type.STRING },
                lintasDisiplinIlmu: { type: Type.STRING },
                tujuanPembelajaran: { type: Type.STRING, description: '2-3 Tujuan pembelajaran merinci kompetensi dan level kognitif' },
                topikPembelajaran: { type: Type.STRING },
                praktikPedagogis: { type: Type.STRING, description: 'Pendekatan Deep Learning, Model & Sintaks, Metode' },
                kemitraanPembelajaran: { type: Type.STRING },
                lingkunganPembelajaran: { type: Type.STRING },
                pemanfaatanDigital: { type: Type.STRING }
              },
              required: ['capaianPembelajaran', 'lintasDisiplinIlmu', 'tujuanPembelajaran', 'topikPembelajaran', 'praktikPedagogis', 'kemitraanPembelajaran', 'lingkunganPembelajaran', 'pemanfaatanDigital']
            },
            pengalamanBelajar: {
              type: Type.OBJECT,
              properties: {
                kegiatanAwal: { type: Type.STRING, description: 'Kegiatan awal 15 menit dengan prinsip mindful/bermakna/joyful, salam, doa, presensi, apersepsi, motivasi' },
                kegiatanInti: { type: Type.STRING, description: 'Kegiatan inti 60 menit memuat Memahami, Mengaplikasikan, Merefleksi dengan sintaks model di kurung dan DPL di akhir kalimat bertanda kurung, min 4 aktivitas per tahap' },
                kegiatanPenutup: { type: Type.STRING, description: 'Kegiatan penutup 5 menit dengan simpulan, umpan balik, rencana tindak lanjut, doa, salam' }
              },
              required: ['kegiatanAwal', 'kegiatanInti', 'kegiatanPenutup']
            },
            asesmenPembelajaran: {
              type: Type.OBJECT,
              properties: {
                awal: { type: Type.STRING, description: 'Jenis, bentuk, teknik' },
                proses: { type: Type.STRING, description: 'Jenis, bentuk, teknik' },
                akhir: { type: Type.STRING, description: 'Jenis, bentuk, teknik' }
              },
              required: ['awal', 'proses', 'akhir']
            },
            tandaTangan: {
              type: Type.OBJECT,
              properties: {
                tempatTanggal: { type: Type.STRING },
                kepalaSekolah: { type: Type.STRING },
                guruMapel: { type: Type.STRING }
              },
              required: ['kepalaSekolah', 'guruMapel']
            },
            lampiran: {
              type: Type.OBJECT,
              properties: {
                asesmenAwal: { type: Type.STRING, description: '5 soal asesmen awal dan kunci jawaban' },
                asesmenProses: { type: Type.STRING, description: 'Rubrik penilaian Sikap (4 skala), Pengetahuan (4 skala), Keterampilan (4 skala)' },
                asesmenAkhir: { type: Type.STRING, description: 'Asesmen akhir dan instrumen sumatif' },
                materiAjar: { type: Type.STRING, description: 'Materi ajar ringkas dan jelas' }
              },
              required: ['asesmenAwal', 'asesmenProses', 'asesmenAkhir', 'materiAjar']
            },
            lkpdList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pertemuan: { type: Type.STRING, description: 'Pertemuan Ke-X' },
                  title: { type: Type.STRING, description: 'Judul LKPD Pertemuan Ke-X' },
                  content: { type: Type.STRING, description: 'LKPD lengkap NON-TABEL: 1. Identitas diri, 2. Petunjuk, 3. Sintaks & Aktivitas, 4. Pengalaman Belajar (Memahami [min 3 soal], Mengaplikasikan [kasus nyata + ruang jawaban], Merefleksikan [2-3 soal]), 5. Penutup (penyemangat, catatan guru, cek pemahaman checklist)' }
                },
                required: ['pertemuan', 'title', 'content']
              },
              description: `Daftar LKPD lengkap non-tabel untuk Pertemuan 1 sampai Pertemuan ${countPertemuan}`
            }
          },
          required: [
            'title',
            'identitas',
            'identifikasi',
            'desainPembelajaran',
            'pengalamanBelajar',
            'asesmenPembelajaran',
            'tandaTangan',
            'lampiran',
            'lkpdList'
          ]
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model Gemini.');
    }

    const data = JSON.parse(response.text.trim());
    if (data.lampiran && (!data.lampiran.soalAsesmenAkhirList || data.lampiran.soalAsesmenAkhirList.length === 0)) {
      data.lampiran.soalAsesmenAkhirList = [
        {
          no: 1,
          pertanyaan: `Jelaskan secara komprehensif konsep dasar, variasi pola gerak, dan prinsip pelaksanaan aktivitas ${materi || 'materi ini'}!`,
          kunciJawaban: `Menjelaskan pengertian, ragam variasi gerak, posisi tubuh yang benar, dan prinsip keselamatan gerak secara sistematis.`
        },
        {
          no: 2,
          pertanyaan: `Bagaimana cara mengatasi kendala teknis dan menjaga ritme keseimbangan saat melakukan rangkaian aktivitas ${materi || 'materi ini'}?`,
          kunciJawaban: `Memusatkan perhatian (mindful), mengatur napas teratur, menyesuaikan tumpuan kaki, dan melakukan penyesuaian strategi gerak.`
        },
        {
          no: 3,
          pertanyaan: `Analisis dampak jangka panjang dari pembiasaan aktivitas fisik ${materi || 'materi ini'} terhadap kebugaran jasmani dan kesehatan organ vital!`,
          kunciJawaban: `Meningkatkan kapasitas kardiorespirasi (daya tahan paru-jantung), menguatkan massa otot, kelenturan sendi, dan imunitas tubuh.`
        },
        {
          no: 4,
          pertanyaan: `Rancanglah sebuah modifikasi peraturan permainan atau strategi tim yang menerapkan nilai sportivitas (fair play) dan inklusif!`,
          kunciJawaban: `Modifikasi lapangan/alat yang memberi kesempatan setara bagi semua anggota tanpa diskriminasi, serta mengutamakan keselamatan.`
        },
        {
          no: 5,
          pertanyaan: `Tuliskan refleksi evaluasi diri tentang perkembangan keterampilan, kedisiplinan, dan kerja sama tim yang Anda capai selama 1 bab ini!`,
          kunciJawaban: `Refleksi jujur mengenai peningkatan teknik gerak, kemampuan mengelola emosi dalam kompetisi, dan kontribusi aktif dalam kelompok.`
        }
      ];
    }
    res.json(data);
  } catch (error: any) {
    const is1Pertemuan = !req.body?.is1Tp && !req.body?.isSatuBab && !!(req.body?.is1Pertemuan || req.body?.mode === '1_pertemuan' || req.body?.mode === 'deep_learning_1pertemuan' || req.body?.jumlahPertemuan === '1' || (req.body?.alokasiWaktu && String(req.body?.alokasiWaktu).includes('2x40')));
    const is1Tp = !is1Pertemuan && !!(req.body?.is1Tp || req.body?.mode === '1_tp' || (req.body?.alokasiWaktu && String(req.body?.alokasiWaktu).includes('6x40')) || req.body?.mode === 'deep_learning_1tp');
    const isSatuBab = !is1Pertemuan && !is1Tp && !!(req.body?.isSatuBab || req.body?.mode === 'satu_bab' || req.body?.jumlahPertemuan === '8' || (req.body?.alokasiWaktu && String(req.body?.alokasiWaktu).includes('16x40')));
    console.info(`[AI Generator] Using offline template for RPM (${is1Pertemuan ? '1 Pertemuan 2x40 Menit (Lendi format)' : is1Tp ? '1 TP (rafsanjani format)' : isSatuBab ? '1 Bab 8 Pertemuan' : 'Standar'})`);
    const fallback = is1Pertemuan ? getFallbackRPM1Pertemuan(req.body) : is1Tp ? getFallbackRPM1Tp(req.body) : isSatuBab ? getFallbackRPMSatuBab(req.body) : getFallbackRPM(req.body);
    res.json(fallback);
  }
});

// Dedicated 1 Pertemuan Deep Learning RPM endpoint
app.post('/api/generate-rpm-pertemuan', async (req, res) => {
  req.body = { ...req.body, is1Pertemuan: true, mode: '1_pertemuan', jumlahPertemuan: '1', alokasiWaktu: req.body?.alokasiWaktu || '2x40 Menit' };
  try {
    if (isGeminiAccessDenied()) {
      return res.json(getFallbackRPM1Pertemuan(req.body));
    }
    // Forward internally
    const fallback = getFallbackRPM1Pertemuan(req.body);
    return res.json(fallback);
  } catch (err: any) {
    return res.json(getFallbackRPM1Pertemuan(req.body));
  }
});

// ==========================================
// SUPABASE DATABASE PROXY API ENDPOINTS
// ==========================================

// 1. Get Supabase Status and Table Check
app.get('/api/supabase-status', async (req, res) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({
      configured: false,
      connected: false,
      tables: { classes: false, moduls: false, journals: false, rubriks: false },
      error: 'Variabel lingkungan Supabase belum diatur di .env.'
    });
  }

  const tables = {
    classes: false,
    moduls: false,
    journals: false,
    rubriks: false
  };
  let errorMsg: string | null = null;
  let isConnected = false;

  try {
    // Run all table queries concurrently with a strict 2-second timeout to prevent hanging on serverless hosts like Vercel
    const [resClasses, resModuls, resJournals, resRubriks] = await queryWithTimeout(
      Promise.all([
        supabase.from('classes').select('id').limit(1),
        supabase.from('moduls').select('id').limit(1),
        supabase.from('journals').select('id').limit(1),
        supabase.from('rubriks').select('id').limit(1)
      ]),
      2000
    );

    isConnected = true; // Connection is successful

    const errClasses = resClasses.error;
    const errModuls = resModuls.error;
    const errJournals = resJournals.error;
    const errRubriks = resRubriks.error;

    tables.classes = !errClasses || errClasses.code !== '42P01';
    if (errClasses && errClasses.code !== '42P01') {
      errorMsg = errClasses.message;
    }

    tables.moduls = !errModuls || errModuls.code !== '42P01';
    tables.journals = !errJournals || errJournals.code !== '42P01';
    tables.rubriks = !errRubriks || errRubriks.code !== '42P01';

    const allExist = tables.classes && tables.moduls && tables.journals && tables.rubriks;

    res.json({
      configured: true,
      connected: isConnected,
      tables,
      allExist,
      error: errorMsg,
      sqlScript: `
-- JALANKAN SQL INI DI SUPABASE SQL EDITOR UNTUK MEMBUAT TABEL --

-- 1. Tabel Kelas
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade INT NOT NULL,
  students JSONB NOT NULL
);

-- 2. Tabel Modul Ajar (RPP)
CREATE TABLE IF NOT EXISTS moduls (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  grade INT NOT NULL,
  semester INT NOT NULL,
  materi_pokok TEXT NOT NULL,
  alokasi_waktu TEXT NOT NULL,
  tujuan_pembelajaran JSONB NOT NULL,
  kegiatan_pembelajaran JSONB NOT NULL,
  sarana_prasarana JSONB NOT NULL,
  rubrik_penilaian TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 3. Tabel Jurnal Mengajar
CREATE TABLE IF NOT EXISTS journals (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  class_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  materi TEXT NOT NULL,
  catatan_kejadian TEXT NOT NULL,
  tindak_lanjut TEXT NOT NULL
);

-- 4. Tabel Rubrik Fisik
CREATE TABLE IF NOT EXISTS rubriks (
  id TEXT PRIMARY KEY,
  materi TEXT NOT NULL,
  kategori TEXT NOT NULL,
  indikator JSONB NOT NULL
);

-- Aktifkan Row Level Security (RLS) & Izinkan Akses Publik (Pilihan Sederhana untuk Demo)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moduls ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubriks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Allow public insert classes" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update classes" ON classes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete classes" ON classes FOR DELETE USING (true);

CREATE POLICY "Allow public select moduls" ON moduls FOR SELECT USING (true);
CREATE POLICY "Allow public insert moduls" ON moduls FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update moduls" ON moduls FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete moduls" ON moduls FOR DELETE USING (true);

CREATE POLICY "Allow public select journals" ON journals FOR SELECT USING (true);
CREATE POLICY "Allow public insert journals" ON journals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update journals" ON journals FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete journals" ON journals FOR DELETE USING (true);

CREATE POLICY "Allow public select rubriks" ON rubriks FOR SELECT USING (true);
CREATE POLICY "Allow public insert rubriks" ON rubriks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update rubriks" ON rubriks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete rubriks" ON rubriks FOR DELETE USING (true);
`
    });
  } catch (error: any) {
    markSupabaseFailed();
    res.json({
      configured: true,
      connected: false,
      tables,
      allExist: false,
      error: 'Database Supabase tidak merespon/timeout. Menggunakan penyimpanan lokal.'
    });
  }
});

// 2. Fetch Classes
app.get('/api/classes', async (req, res) => {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await queryWithTimeout(
        supabase.from('classes').select('*').order('name'),
        2000
      );
      if (!error && data) {
        return res.json(data);
      }
      if (error) {
        if (error.code !== '42P01') markSupabaseFailed();
      }
    } catch (e: any) {
      markSupabaseFailed();
    }
  }
  res.json(inMemoryClasses);
});

// 3. Save Classes (Batch/Upsert)
app.post('/api/classes', async (req, res) => {
  const updatedClasses = req.body;
  inMemoryClasses = updatedClasses;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      for (const cls of updatedClasses) {
        await supabase.from('classes').upsert({
          id: cls.id,
          name: cls.name,
          grade: cls.grade,
          students: cls.students
        });
      }
    } catch (e: any) {
      markSupabaseFailed();
    }
  }
  res.json({ success: true });
});

// 3b. Delete Class
app.delete('/api/classes/:id', async (req, res) => {
  const { id } = req.params;
  inMemoryClasses = inMemoryClasses.filter((c: any) => c.id !== id);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('classes').delete().eq('id', id);
    } catch (e: any) {
      markSupabaseFailed();
    }
  }
  res.json({ success: true });
});

// 4. Fetch Moduls
app.get('/api/moduls', async (req, res) => {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await queryWithTimeout(
        supabase.from('moduls').select('*').order('created_at', { ascending: false }),
        2000
      );
      if (!error && data) {
        const mapped = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          grade: d.grade,
          semester: d.semester,
          materiPokok: d.materi_pokok,
          alokasiWaktu: d.alokasi_waktu,
          tujuanPembelajaran: d.tujuan_pembelajaran,
          kegiatanPembelajaran: d.kegiatan_pembelajaran,
          saranaPrasarana: d.sarana_prasarana,
          rubrikPenilaian: d.rubrik_penilaian,
          createdAt: d.created_at
        }));
        return res.json(mapped);
      }
      if (error) {
        if (error.code !== '42P01') markSupabaseFailed();
      }
    } catch (e: any) {
      markSupabaseFailed();
    }
  }
  res.json(inMemoryModuls);
});

// 5. Save/Upsert a Modul
app.post('/api/moduls', async (req, res) => {
  const m = req.body;
  const index = inMemoryModuls.findIndex((x: any) => x.id === m.id);
  if (index >= 0) {
    inMemoryModuls[index] = m;
  } else {
    inMemoryModuls.unshift(m);
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('moduls').upsert({
        id: m.id,
        title: m.title,
        grade: m.grade,
        semester: m.semester,
        materi_pokok: m.materiPokok,
        alokasi_waktu: m.alokasiWaktu,
        tujuan_pembelajaran: m.tujuanPembelajaran,
        kegiatan_pembelajaran: m.kegiatanPembelajaran,
        sarana_prasarana: m.saranaPrasarana,
        rubrik_penilaian: m.rubrikPenilaian,
        created_at: m.createdAt
      });
    } catch (e: any) {
      markSupabaseFailed();
    }
  }
  res.json({ success: true, modul: m });
});

// 6. Delete Modul
app.delete('/api/moduls/:id', async (req, res) => {
  const { id } = req.params;
  inMemoryModuls = inMemoryModuls.filter((m: any) => m.id !== id);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('moduls').delete().eq('id', id);
    } catch (e: any) {
      markSupabaseFailed();
    }
  }
  res.json({ success: true });
});

// 7. Fetch Journals
app.get('/api/journals', async (req, res) => {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await queryWithTimeout(
        supabase.from('journals').select('*').order('date', { ascending: false }),
        2000
      );
      if (!error && data) {
        const mapped = data.map((d: any) => ({
          id: d.id,
          date: d.date,
          classId: d.class_id,
          className: d.class_name,
          materi: d.materi,
          catatanKejadian: d.catatan_kejadian,
          tindakLanjut: d.tindak_lanjut
        }));
        return res.json(mapped);
      }
      if (error) {
        if (error.code !== '42P01') markSupabaseFailed();
      }
    } catch (e: any) {
      markSupabaseFailed();
    }
  }
  res.json(inMemoryJournals);
});

// 8. Save/Upsert a Journal
app.post('/api/journals', async (req, res) => {
  const j = req.body;
  const index = inMemoryJournals.findIndex((x: any) => x.id === j.id);
  if (index >= 0) {
    inMemoryJournals[index] = j;
  } else {
    inMemoryJournals.unshift(j);
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('journals').upsert({
        id: j.id,
        date: j.date,
        class_id: j.classId,
        class_name: j.className,
        materi: j.materi,
        catatan_kejadian: j.catatanKejadian,
        tindak_lanjut: j.tindakLanjut
      });
    } catch (e: any) {
      markSupabaseFailed();
    }
  }
  res.json({ success: true, journal: j });
});

// 8b. Delete Journal
app.delete('/api/journals/:id', async (req, res) => {
  const { id } = req.params;
  inMemoryJournals = inMemoryJournals.filter((j: any) => j.id !== id);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('journals').delete().eq('id', id);
    } catch (e: any) {
      markSupabaseFailed();
    }
  }
  res.json({ success: true });
});

// 9. Fetch Rubriks
app.get('/api/rubriks', async (req, res) => {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await queryWithTimeout(
        supabase.from('rubriks').select('*'),
        2000
      );
      if (!error && data) {
        return res.json(data);
      }
      if (error) {
        if (error.code !== '42P01') markSupabaseFailed();
      }
    } catch (e: any) {
      markSupabaseFailed();
    }
  }
  res.json(inMemoryRubriks);
});

// 10. Save/Upsert Rubrik
app.post('/api/rubriks', async (req, res) => {
  const r = req.body;
  const index = inMemoryRubriks.findIndex((x: any) => x.id === r.id);
  if (index >= 0) {
    inMemoryRubriks[index] = r;
  } else {
    inMemoryRubriks.unshift(r);
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('rubriks').upsert({
        id: r.id,
        materi: r.materi,
        kategori: r.kategori,
        indikator: r.indikator
      });
    } catch (e: any) {
      console.log('[Supabase Setup] Failed to sync rubrik with Supabase: Table may not exist yet.');
    }
  }
  res.json({ success: true, rubrik: r });
});

// 11. Delete Rubrik
app.delete('/api/rubriks/:id', async (req, res) => {
  const { id } = req.params;
  inMemoryRubriks = inMemoryRubriks.filter((r: any) => r.id !== id);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('rubriks').delete().eq('id', id);
    } catch (e: any) {
      console.log('[Supabase Setup] Failed to delete rubrik from Supabase: Table may not exist yet.');
    }
  }
  res.json({ success: true });
});

// 12. Generate Interactive LKPD (Lembar Kerja Peserta Didik) with AI
app.post('/api/generate-lkpd', async (req, res) => {
  try {
    const { 
      mode = 'raw',
      mataPelajaran, 
      kelas, 
      fase,
      sintaks,
      topikMateri, 
      tujuanPembelajaran,
      dimensiProfil,
      guruPenyusun, 
      gayaDesain, 
      sekolah,
      alokasiWaktu,
      kegiatanInti,
      rawText 
    } = req.body;

    if (!mataPelajaran || !kelas || !topikMateri || !guruPenyusun) {
      return res.status(400).json({ error: 'Mata Pelajaran, Kelas, Topik, dan Penyusun wajib diisi.' });
    }

    let prompt = '';
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    if (mode === 'v1') {
      if (!tujuanPembelajaran || !dimensiProfil) {
        return res.status(400).json({ error: 'Untuk LKPD Versi 1, Tujuan Pembelajaran dan Dimensi Profil wajib diisi.' });
      }
      prompt = `Anda adalah seorang Guru ${mataPelajaran} jenjang/kelas ${kelas} yang inspiratif dan berfokus pada pendidikan mendalam (Deep Learning).
${(mataPelajaran.toLowerCase().includes('pjok') || mataPelajaran.toLowerCase().includes('jasmani') || (sekolah && sekolah.toLowerCase().includes('kalimantong'))) ? `Catatan Khusus Pembelajaran PJOK di ${sekolah || 'SD Negeri Kalimantong'}:
- Fokuskan materi pada aktivitas gerak fisik bermakna (pola gerak dasar lokomotor, non-lokomotor, manipulatif, aktivitas kebugaran jasmani, senam, atletik, atau permainan bola).
- Sertakan instruksi keselamatan di lapangan, pentingnya pemanasan (warming-up) dinamis, dan pendinginan (cooling-down) pasca latihan.
- Sediakan tabel pengamatan unjuk kerja teman sejawat (peer assessment) untuk mengevaluasi teknik gerak kawan secara objektif dan sportif.
- Buat pertanyaan nalar kritis tentang mekanika gerak tubuh (sikap tumpuan, perkenaan ayunan, koordinasi pandangan) serta nilai sportivitas, kejujuran, dan gaya hidup sehat aktif.
` : ''}Tugas Anda adalah merancang Lembar Kerja Peserta Didik (LKPD) yang lengkap dan terstruktur berdasarkan sintaks pembelajaran berikut:
- Sintaks Model & Metode Pembelajaran: ${sintaks || 'Pembelajaran Eksploratif Dinamis'}
- Topik Pembelajaran: ${topikMateri}
- Tujuan Pembelajaran: ${tujuanPembelajaran}
- Dimensi Profil Lulusan / Profil Pelajar Pancasila: ${dimensiProfil}
- Guru Penyusun: ${guruPenyusun}
- Sekolah: ${sekolah || 'SD Negeri Kalimantong'}
- Alokasi Waktu: ${alokasiWaktu || '2 x 35 Menit'}
- Gaya Desain Visual: ${gayaDesain}
- Tanggal Dokumen: ${dateStr}

LKPD harus mencakup bagian-bagian berikut secara utuh dan lengkap:
1. "Identitas Diri Siswa" (bagian ini akan diletakkan di header secara otomatis, jadi tidak perlu diletakkan sebagai section khusus).
2. "Petunjuk Penggunaan LKPD" (sebagai section pertama): berisi instruksi langkah-langkah mengerjakan, alat/bahan yang dibutuhkan, dan cara menjawab secara komunikatif.
3. "Sintaks Pembelajaran & Pengalaman Belajar Mendalam" (harus diintegrasikan menjadi satu dan ditampilkan tidak dalam bentuk tabel, gunakan beberapa section dengan tahapan sintaks ${sintaks || 'Pembelajaran'}):
   A. MEMAHAMI: Sajikan rangkuman materi singkat yang kaya/bermakna, tabel data atau gambar pendukung, lalu berikan pertanyaan pemahaman (minimal 3 soal nalar kritis dengan answerBoxStyle bervariasi).
   B. MENGAPLIKASIKAN: Buat sebuah tugas atau studi kasus nyata kontekstual yang dekat dengan kehidupan sehari-hari siswa, instruksi kerja yang sangat jelas, serta ruang bagi siswa untuk memikirkan solusinya.
   C. MEREFLEKSIKAN: Berikan 2 sampai 3 pertanyaan refleksi mendalam yang menuntun siswa untuk meninjau kembali proses belajarnya, kesulitan yang dihadapi, serta rencana tindak lanjut perbaikannya.
4. "Bagian Penutup & Evaluasi Mandiri": berikan ucapan penyemangat/motivasi yang menginspirasi, catatan guru, serta kolom cek pemahaman diri siswa berupa daftar checklist sederhana (kembalikan 3-5 kalimat pernyataan reflektif untuk selfReflectionChecklist).

Gunakan bahasa yang hangat, komunikatif, menyenangkan, ramah anak, dan mendorong pembelajaran aktif, bermakna, berkesadaran, serta menggembirakan. LKPD harus muncul secara utuh dengan isi yang lengkap, bukan hanya berupa kerangka kasar atau daftar isi!`;
    } else if (mode === 'v2') {
      if (!kegiatanInti) {
        return res.status(400).json({ error: 'Untuk LKPD Versi 2, isi Kegiatan Inti RPP wajib diisi.' });
      }
      prompt = `Anda adalah desainer teknologi pembelajaran profesional yang ahli merancang Lembar Kerja Peserta Didik (LKPD) yang lengkap, bermakna, dan terstruktur berdasarkan Kegiatan Inti RPP berikut:
"${kegiatanInti}"

LKPD ini dibuat khusus untuk setiap pertemuan sesuai dengan rincian kegiatan inti di atas.
${(mataPelajaran.toLowerCase().includes('pjok') || mataPelajaran.toLowerCase().includes('jasmani') || (sekolah && sekolah.toLowerCase().includes('kalimantong'))) ? `Catatan Khusus Pembelajaran PJOK di ${sekolah || 'SD Negeri Kalimantong'}:
- Selaraskan dengan aktivitas fisik lapangan (pola gerak lokomotor, manipulatif, taktik bermain, pos sirkuit kebugaran, atau senam).
- Sediakan tabel evaluasi praktik/observasi teman sejawat (peer assessment) dan aturan keselamatan lapangan.
` : ''}Berikut adalah data identitas dokumen:
- Mata Pelajaran: ${mataPelajaran}
- Kelas: Kelas ${kelas}
- Topik / Materi Pembelajaran: ${topikMateri}
- Guru Penyusun: ${guruPenyusun}
- Sekolah: ${sekolah || 'SD Negeri Kalimantong'}
- Alokasi Waktu: ${alokasiWaktu || '2 x 35 Menit'}
- Gaya Desain Visual: ${gayaDesain}
- Tanggal Dokumen: ${dateStr}

LKPD harus mencakup bagian-bagian berikut secara utuh dan lengkap:
1. "Identitas Diri Siswa" (akan ditempatkan di atas secara otomatis).
2. "Petunjuk Penggunaan LKPD" (sebagai section pertama): berisi instruksi langkah-langkah mengerjakan, alat/bahan yang dibutuhkan, dan cara menjawab yang jelas.
3. "Sintaks Pembelajaran & Pengalaman Belajar Mendalam" (diintegrasikan secara selaras dengan langkah-langkah kegiatan inti di atas, tidak boleh dalam bentuk tabel, melainkan mengalir secara naratif-interaktif):
   A. MEMAHAMI: Sajikan ringkasan materi konseptual/teks instruksional yang harus dibaca berdasarkan kegiatan inti, dilengkapi minimal 3 soal pertanyaan pemahaman nalar kritis siswa.
   B. MENGAPLIKASIKAN: Buat tugas kasus nyata/studi kasus kontekstual yang sesuai kegiatan inti RPP untuk dikerjakan siswa, instruksi kerja yang rinci, dan sediakan ruang kotak jawaban menarik.
   C. MEREFLEKSIKAN: Berikan 2 sampai 3 pertanyaan refleksi mendalam yang menuntun siswa mengevaluasi proses belajarnya hari ini, hambatan yang dirasa, dan aksi nyata selanjutnya.
4. "Bagian Penutup & Evaluasi Mandiri": tambahkan ucapan penyemangat/motivasi yang menginspirasi, catatan guru, serta kolom cek pemahaman diri siswa berupa daftar checklist sederhana (kembalikan 3-5 kalimat pernyataan reflektif untuk selfReflectionChecklist).

Gunakan bahasa yang hangat, komunikatif, menyenangkan, ramah anak, dan mendorong pembelajaran aktif, bermakna, berkesadaran, serta menggembirakan. LKPD harus muncul secara utuh dengan isi yang lengkap, bukan hanya berupa kerangka kasar atau daftar isi!`;
    } else if (mode === 'info_v1') {
      if (!rawText) {
        return res.status(400).json({ error: 'Materi Rangkuman wajib diisi.' });
      }
      prompt = `Anda adalah seorang desainer infografis pendidikan profesional dan ilustrator 3D animation yang ahli dalam mengubah materi pembelajaran menjadi poster edukatif visual yang menarik, informatif, dan sangat disukai peserta didik.
Tugas Anda adalah mengubah materi yang diberikan menjadi sebuah infografis edukatif ukuran A4 (21 cm × 29,7 cm) orientasi portrait dengan gaya 3D cartoon animation berkualitas tinggi seperti ilustrasi film animasi anak modern.
Seluruh karakter, objek, lingkungan, ikon, dan elemen visual harus dibuat dalam bentuk 3D render yang halus, lucu, berwarna cerah, memiliki pencahayaan lembut, bayangan realistis, detail tinggi, dan tampilan premium. Desain harus terasa seperti perpaduan antara poster pendidikan dan dunia animasi 3D yang hidup, ceria, serta mampu menarik perhatian peserta didik sejak pandangan pertama.

Letakkan judul utama berukuran besar di bagian atas dengan tipografi kartun yang tebal, berwarna cerah, dan mudah dibaca. Tambahkan subjudul yang menarik serta karakter anak 3D yang berdiri di dekat judul sebagai pemandu belajar. Karakter tersebut harus menampilkan ekspresi ceria, ramah, dan penuh semangat sambil mengajak peserta didik mempelajari materi. Gunakan balon percakapan yang berisi kalimat pendek dan komunikatif untuk memberikan kesan interaktif.

Bagian utama infografis harus dibagi menjadi beberapa panel atau kotak informasi yang tersusun rapi dengan sudut membulat, efek bayangan lembut, dan tampilan modern. Setiap panel memuat satu konsep penting dari materi dan harus divisualisasikan menggunakan ilustrasi lingkungan 3D yang detail dan kontekstual.
Setiap panel harus memiliki judul yang jelas, ilustrasi utama yang dianjurkan (tuliskan petunjuk visualnya di illustrationPrompt), ikon pendukung, dan poin-poin informasi yang singkat serta mudah dipahami.
Gunakan komposisi visual yang kaya namun tetap rapi. Hindari paragraf panjang dan ubah seluruh informasi menjadi poin-poin pendek.

Pada bagian bawah poster, buat area khusus (kembalikan di penutupMotivasi) yang berisi rangkuman, pesan penting, solusi, tips, atau ajakan tindakan yang relevan dengan materi, disajikan sebagai penutup inspiratif.

Berikut adalah data Identitas Infografis:
- Mata Pelajaran: ${mataPelajaran}
- Kelas: Kelas ${kelas}
- Topik / Materi Pembelajaran: ${topikMateri}
- Guru Penyusun: ${guruPenyusun}
- Sekolah: ${sekolah || 'Sekolah Dasar'}
- Alokasi Waktu: ${alokasiWaktu || '2 x 35 Menit'}
- Tanggal Dokumen: ${dateStr}

MATERI AJAR UNTUK INFOGRAFIS:
${rawText}

Rancanglah Infografis 3D Cartoon Animation tersebut secara kreatif dan kembalikan hasilnya dalam format JSON terstruktur sesuai responseSchema.`;
    } else if (mode === 'info_v2') {
      if (!rawText) {
        return res.status(400).json({ error: 'Materi Rangkuman wajib diisi.' });
      }
      prompt = `Anda adalah seorang desainer infografis pendidikan profesional yang ahli dalam mengubah materi pembelajaran menjadi poster edukatif visual yang menarik, mudah dipahami, dan ramah peserta didik.
Tugas Anda adalah mengubah materi yang diberikan menjadi sebuah infografis edukatif ukuran A4 (21 cm × 29,7 cm) orientasi portrait dengan gaya visual yang menyerupai poster pembelajaran anak modern. Desain harus menggunakan ilustrasi kartun 2D yang ceria, warna-warna cerah namun lembut, tata letak yang rapi, serta visual yang mampu membantu peserta didik memahami konsep secara cepat.
Letakkan judul utama berukuran besar dan mencolok di bagian atas disertai subjudul yang menarik perhatian. Tambahkan ilustrasi anak atau maskot yang seolah-olah mengajak pembaca untuk belajar melalui balon percakapan yang singkat dan komunikatif.

Di bagian tengah, tampilkan konsep utama materi dalam bentuk visual besar yang menjadi fokus infografis. Gunakan diagram, ilustrasi, panah proses, ikon, simbol, atau visualisasi lain yang relevan dengan materi.
Di bawah atau di samping visual utama, buat beberapa kotak informasi yang membagi materi menjadi bagian-bagian penting seperti pengertian, penyebab, ciri-ciri, komponen, manfaat, dampak, fungsi, jenis, langkah-langkah, atau kategori lain yang sesuai dengan materi. Setiap poin informasi harus disertai ilustrasi atau ikon pendukung dan ditulis menggunakan kalimat yang singkat, sederhana, dan mudah dipahami peserta didik. Hindari paragraf panjang.

Pada bagian bawah poster, buat area khusus yang berisi solusi, tips, langkah penerapan, cara melakukan, atau aksi nyata yang dapat dilakukan peserta didik sesuai dengan materi. Gunakan judul menarik seperti "Yuk Kita Lakukan!", "Ayo Praktik!", dsb.

Berikut adalah data Identitas Infografis:
- Mata Pelajaran: ${mataPelajaran}
- Kelas: Kelas ${kelas}
- Topik / Materi Pembelajaran: ${topikMateri}
- Guru Penyusun: ${guruPenyusun}
- Sekolah: ${sekolah || 'Sekolah Dasar'}
- Alokasi Waktu: ${alokasiWaktu || '2 x 35 Menit'}
- Tanggal Dokumen: ${dateStr}

MATERI AJAR UNTUK INFOGRAFIS:
${rawText}

Rancanglah Infografis Cute 2D Cartoon tersebut secara kreatif dan kembalikan hasilnya dalam format JSON terstruktur sesuai responseSchema.`;
    } else if (mode === 'info_v3') {
      if (!rawText) {
        return res.status(400).json({ error: 'Materi Rangkuman wajib diisi.' });
      }
      prompt = `Anda adalah seorang desainer pembelajaran profesional sekaligus ahli dalam mengembangkan infografis pendidikan yang menarik, modern, dan mudah dipahami peserta didik.
Tugas Anda adalah mengubah rangkuman materi ajar yang diberikan menjadi infografis edukatif berbentuk visual dengan ukuran A4 (21 cm × 29,7 cm) orientasi portrait.
Desain harus menggunakan gaya modern, clean, edukatif, informatif, dan ramah siswa dengan perpaduan warna yang cerah namun tetap nyaman di mata. Infografis harus memiliki tampilan visual yang menarik, tidak monoton, serta memanfaatkan ilustrasi, ikon, diagram sederhana, dan elemen grafis pendukung agar materi lebih mudah dipahami sesuai karakter siswa generasi Gen Z.

Struktur tata letak wajib dibuat rapi, proporsional, dan sistematis:
- Bagian paling atas terdapat judul utama materi dengan desain header menarik, modern, dan berwarna.
- Di bawah judul terdapat subjudul atau identitas materi seperti mata pelajaran, kelas, bab, atau topik pembelajaran.
- Isi rangkuman materi disusun menjadi beberapa bagian atau poin utama menggunakan layout infografis yang terstruktur dan mudah diikuti (seperti box, card, timeline, flowchart, diagram, atau mind map sederhana).
- Gunakan kombinasi elemen visual seperti panah, garis penghubung, numbering, dan shape modern agar alur materi lebih jelas.

PENTING (KEWAJIBAN MUTLAK):
Seluruh isi teks, materi, definisi, rumus, poin-poin, dan penjelasan dalam rangkuman harus dipertahankan 100% sama persis dengan file asli tanpa ada pengurangan, penambahan, ataupun perubahan redaksi (verbatim). Tugas Anda hanya mengubah tampilan menjadi infografis visual yang lebih menarik tanpa mengubah isi materi.

Berikut adalah data Identitas Infografis:
- Mata Pelajaran: ${mataPelajaran}
- Kelas: Kelas ${kelas}
- Topik / Materi Pembelajaran: ${topikMateri}
- Guru Penyusun: ${guruPenyusun}
- Sekolah: ${sekolah || 'Sekolah Dasar'}
- Alokasi Waktu: ${alokasiWaktu || '2 x 35 Menit'}
- Tanggal Dokumen: ${dateStr}

MATERI AJAR UNTUK INFOGRAFIS (HARUS 100% VERBATIM SAMA):
${rawText}

Rancanglah Infografis Modern Clean Gen Z tersebut secara kreatif dan kembalikan hasilnya dalam format JSON terstruktur sesuai responseSchema.`;
    } else if (mode === 'info_v4') {
      if (!rawText) {
        return res.status(400).json({ error: 'Materi Rangkuman wajib diisi.' });
      }
      prompt = `Anda adalah seorang desainer infografis pendidikan profesional sekaligus ilustrator clay art (claymation style) yang ahli dalam mengubah materi pembelajaran menjadi poster edukatif visual yang menarik, ramah anak, dan sangat mudah dipahami.
Tugas Anda adalah mengubah materi yang diberikan menjadi sebuah infografis edukatif ukuran A4 (21 cm × 29,7 cm) orientasi portrait dengan gaya 3D clay illustration seperti karakter dan objek yang dibuat dari plastisin atau clay berwarna-warni.
Seluruh elemen visual harus memiliki tekstur clay yang lembut, bentuk membulat, detail handmade yang unik, warna-warna cerah, pencahayaan hangat, serta kesan lucu dan menyenangkan. Hasil akhir harus terlihat seperti miniatur dunia edukasi yang dibuat dari clay premium.

Letakkan judul utama berukuran besar di bagian atas menggunakan tipografi yang tampak dibentuk dari clay berwarna cerah. Tambahkan subjudul serta karakter anak berbentuk clay yang berdiri di dekat judul.
Bagian utama infografis harus dibagi menjadi beberapa panel atau kotak informasi dengan sudut membulat yang tampak dibuat dari clay bertekstur lembut. Setiap panel memuat satu konsep penting dari materi dan harus divisualisasikan menggunakan diorama miniatur clay yang kaya detail (tuliskan petunjuk visualnya di illustrationPrompt).
Tambahkan berbagai elemen dekoratif berbentuk clay seperti awan, bunga, dedaunan, bintang, pelangi, buku, dll.

Berikut adalah data Identitas Infografis:
- Mata Pelajaran: ${mataPelajaran}
- Kelas: Kelas ${kelas}
- Topik / Materi Pembelajaran: ${topikMateri}
- Guru Penyusun: ${guruPenyusun}
- Sekolah: ${sekolah || 'Sekolah Dasar'}
- Alokasi Waktu: ${alokasiWaktu || '2 x 35 Menit'}
- Tanggal Dokumen: ${dateStr}

MATERI AJAR UNTUK INFOGRAFIS:
${rawText}

Rancanglah Infografis 3D Clay Art tersebut secara kreatif dan kembalikan hasilnya dalam format JSON terstruktur sesuai responseSchema.`;
    } else {
      // mode === 'raw' (backward-compatible)
      if (!rawText) {
        return res.status(400).json({ error: 'Teks LKPD Asli wajib diisi untuk mode penataan ulang.' });
      }
      prompt = `PROMPT UBAH LKPD MENJADI LEBIH MENARIK

Anda adalah seorang desainer pembelajaran profesional sekaligus ahli dalam mengembangkan LKPD interaktif berbasis visual untuk peserta didik. Tugas Anda adalah mengubah LKPD pada lampiran berikut menjadi LKPD bergambar interaktif dengan ukuran A4 (21 cm x 29,7 cm) orientasi portrait (Hasil Akhir Bentuk Gambar). LKPD harus didesain dengan gaya modern, clean, edukatif, serta ramah siswa, menggunakan warna yang cerah namun tetap nyaman di mata. Desain harus memanfaatkan ilustrasi, ikon, dan elemen visual interaktif agar lebih menarik dan mudah dipahami sesuai dengan jenjang peserta didik.
Penting: seluruh isi teks, soal, instruksi, dan materi dalam LKPD harus dipertahankan 100% sama persis dengan file asli tanpa ada pengurangan, penambahan, ataupun perubahan redaksi. Tugas Anda hanya mengubah tampilan menjadi lebih visual, menarik, dan interaktif tanpa mengubah isi kontennya. Ubah penyajiannya menjadi lebih interaktif, seperti menggunakan kotak jawaban yang menarik, ikon pendukung, garis atau panah untuk mencocokkan, serta penguatan visual berupa ilustrasi atau diagram sederhana yang relevan. Gunakan elemen visual seperti ikon (📌, ✏️, 💡, 🔍), highlight warna pada poin penting, serta ruang eksplorasi yang tetap mempertahankan isi jawaban yang diminta. Bahasa tidak boleh diubah, namun tampilannya dibuat lebih engaging dan mudah dibaca.
Hasil akhir LKPD harus memiliki tata letak yang rapi, proporsional, tidak terlalu padat, serta memiliki variasi desain di setiap bagian agar tidak monoton, sehingga hasil akhir lebih menarik dan sesuai dengan karakter siswa generasi Gen Z.
Buatkan hasil akhirnya langsung dalam format terstruktur yang dapat dirender ke bentuk file gambar A4.

Berikut adalah data Identitas LKPD:
- Mata Pelajaran: ${mataPelajaran}
- Kelas: Kelas ${kelas}
- Topik / Materi Pembelajaran: ${topikMateri}
- Guru Penyusun: ${guruPenyusun}
- Gaya Desain Visual: ${gayaDesain}
- Sekolah: ${sekolah || 'Sekolah Dasar'}
- Alokasi Waktu: ${alokasiWaktu || '2 x 35 Menit'}
- Tanggal Dokumen: ${dateStr}

Lampiran LKPD:
${rawText}

Rancanglah LKPD tersebut secara kreatif dan kembalikan hasilnya dalam format JSON terstruktur lengkap sesuai responseSchema.`;
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah pakar desain teknologi instruksional dan media pembelajaran interaktif Indonesia yang ahli menyusun rancangan Lembar Kerja Peserta Didik (LKPD) Kurikulum Merdeka yang visual, modern, dan rapi dalam format JSON terstruktur.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identitas: {
              type: Type.OBJECT,
              properties: {
                mataPelajaran: { type: Type.STRING },
                kelas: { type: Type.STRING },
                topikMateri: { type: Type.STRING },
                guruPenyusun: { type: Type.STRING },
                gayaDesain: { type: Type.STRING },
                tanggalDokumen: { type: Type.STRING },
                sekolah: { type: Type.STRING },
                alokasiWaktu: { type: Type.STRING }
              },
              required: ['mataPelajaran', 'kelas', 'topikMateri', 'guruPenyusun', 'gayaDesain', 'tanggalDokumen']
            },
            judulMenarik: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sectionTitle: { type: Type.STRING },
                  icon: { type: Type.STRING },
                  introText: { type: Type.STRING },
                  contentBlocks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        blockType: { type: Type.STRING },
                        exactText: { type: Type.STRING },
                        questionData: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            questionText: { type: Type.STRING },
                            answerBoxStyle: { type: Type.STRING },
                            placeholderText: { type: Type.STRING },
                            score: { type: Type.STRING }
                          },
                          required: ['questionText', 'answerBoxStyle']
                        },
                        tableData: {
                          type: Type.OBJECT,
                          properties: {
                            headers: {
                              type: Type.ARRAY,
                              items: { type: Type.STRING }
                            },
                            rows: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                              }
                            }
                          }
                        },
                        matchingData: {
                          type: Type.OBJECT,
                          properties: {
                            leftLabel: { type: Type.STRING },
                            rightLabel: { type: Type.STRING },
                            pairs: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  leftItem: { type: Type.STRING },
                                  rightItem: { type: Type.STRING }
                                },
                                required: ['leftItem', 'rightItem']
                              }
                            }
                          }
                        },
                        illustrationPrompt: { type: Type.STRING }
                      },
                      required: ['blockType']
                    }
                  },
                  visualDesignTip: { type: Type.STRING }
                },
                required: ['sectionTitle', 'icon', 'contentBlocks']
              }
            },
            penutupMotivasi: { type: Type.STRING },
            selfReflectionChecklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['identitas', 'judulMenarik', 'sections']
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model Gemini.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for LKPD');
    const fallback = getFallbackLKPD(req.body);
    res.json(fallback);
  }
});

// 13. Generate Beautiful Cover Page for Modul/RPP/LKPD with AI
app.post('/api/generate-cover', async (req, res) => {
  try {
    const {
      documentType = 'Modul Ajar',
      judul,
      subJudul = '',
      mataPelajaran = '',
      kelas = '',
      semester = '',
      tahunAjaran = '',
      disusunOleh = '',
      nip = '',
      namaSekolah = '',
      dinasPendidikan = '',
      kotaKabupaten = '',
      coverStyle = 'classic_formal',
      warnaTema = 'emerald',
      logoType = 'tutwuri',
      customEmoji = '📚'
    } = req.body;

    if (!judul) {
      return res.status(400).json({ error: 'Judul Cover Dokumen wajib diisi.' });
    }

    const prompt = `Anda adalah seorang desainer grafis profesional dan ahli tata letak dokumen pendidikan resmi di Indonesia.
Tugas Anda adalah merancang elemen teks kreatif dan hiasan visual untuk Cover (Halaman Sampul) dokumen sekolah resmi.

Jenis Dokumen: \${documentType}
Judul Utama: \${judul}
Subjudul Asli: \${subJudul}
Mata Pelajaran: \${mataPelajaran}
Kelas/Fase: \${kelas}
Semester: \${semester}
Tahun Ajaran: \${tahunAjaran}
Disusun Oleh: \${disusunOleh}
NIP/Keterangan: \${nip}
Nama Sekolah: \${namaSekolah}
Dinas Pendidikan: \${dinasPendidikan}
Kota/Kabupaten: \${kotaKabupaten}
Gaya Cover: \${coverStyle}
Warna Tema: \${warnaTema}

Instruksi khusus berdasarkan Gaya Cover:
1. "classic_formal": Hasilkan cover bernuansa resmi, simetris, berwibawa, dengan bingkai garis ganda (double border), font serif elegan, ornamen sudut klasik, dan tata letak yang sangat rapi. Cocok untuk dokumen dinas/sekolah formal.
2. "modern_minimalist": Hasilkan cover bernuansa bersih, kontemporer, dengan pemanfaatan ruang negatif (whitespace) yang luas, aksen garis asimetris tipis yang estetik, tipografi sans-serif (Inter/Space Grotesk) yang modis, dan warna-warna yang soft.
3. "cute_kids": Hasilkan cover bernuansa ceria, ramah anak, penuh warna hangat, dengan bingkai awan/gelombang bertekstur lembut, ornamen buah, bintang, pelangi, dan balon dialog lucu. Sangat cocok untuk SD kelas bawah atau taman kanak-kanak.
4. "creative_art": Hasilkan cover artistik dengan motif abstrak, hiasan daun organik (botanical elements), lingkaran bertumpuk (bento/geometric elements), serta tata letak judul modern yang berani dan kreatif.

Kewajiban Mutlak:
- Anda harus mempertahankan seluruh data asli yang diinput di atas.
- Sempurnakan Subjudul aslinya agar lebih menarik (kembalikan di subJudulKreatif).
- Buatlah slogan atau tagline sekolah/pembelajaran yang inspiratif dan berbobot (taglineSekolah).
- Berikan kutipan/quote motivasi edukasi yang relevan (kutipanMotivasi) beserta nama tokoh pencetusnya atau peribahasa bijak (sumberKutipan).
- Berikan rincian deskripsi gaya visual yang cocok untuk gaya cover tersebut, termasuk dekorasi background, border, dan detail hiasan sudut (hiasanSudut) dalam format kata kunci atau kalimat pendek.

Rancanglah Cover tersebut secara istimewa dan kembalikan hasilnya dalam format JSON terstruktur lengkap sesuai responseSchema.`;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah pakar desain media cetak dan tata letak dokumen sekolah resmi Kurikulum Merdeka yang ahli merancang cover dokumen pendidikan berkualitas tinggi dalam format JSON terstruktur.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            judulUtama: { type: Type.STRING },
            subJudulKreatif: { type: Type.STRING },
            taglineSekolah: { type: Type.STRING },
            kutipanMotivasi: { type: Type.STRING },
            sumberKutipan: { type: Type.STRING },
            detailDokumen: {
              type: Type.OBJECT,
              properties: {
                jenisDokumen: { type: Type.STRING },
                mataPelajaran: { type: Type.STRING },
                kelasFase: { type: Type.STRING },
                semester: { type: Type.STRING },
                tahunAjaran: { type: Type.STRING }
              },
              required: ['jenisDokumen', 'mataPelajaran', 'kelasFase']
            },
            informasiPenyusun: {
              type: Type.OBJECT,
              properties: {
                namaPenyusun: { type: Type.STRING },
                nipKeterangan: { type: Type.STRING },
                jabatan: { type: Type.STRING }
              },
              required: ['namaPenyusun']
            },
            instansi: {
              type: Type.OBJECT,
              properties: {
                namaSekolah: { type: Type.STRING },
                dinasPendidikan: { type: Type.STRING },
                kotaKabupaten: { type: Type.STRING }
              },
              required: ['namaSekolah']
            },
            gayaVisual: {
              type: Type.OBJECT,
              properties: {
                rekomendasiWarnaBg: { type: Type.STRING },
                borderStyle: { type: Type.STRING },
                patternDescription: { type: Type.STRING },
                hiasanSudut: { type: Type.STRING }
              },
              required: ['borderStyle', 'patternDescription', 'hiasanSudut']
            }
          },
          required: ['judulUtama', 'subJudulKreatif', 'taglineSekolah', 'kutipanMotivasi', 'sumberKutipan', 'detailDokumen', 'informasiPenyusun', 'instansi', 'gayaVisual']
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model Gemini.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for Cover');
    const fallback = getFallbackCover(req.body);
    res.json(fallback);
  }
});

app.post('/api/analyze-workload', async (req, res) => {
  try {
    const {
      teacherName,
      schoolName,
      weeklyJpTarget = 24,
      schedule = [],
      extraDuties = [],
      notes = ''
    } = req.body;

    const ai = getAiClient();
    const prompt = `Lakukan analisis beban kerja mengajar dan beban administrasi untuk guru PJOK berikut:
Nama Guru: ${teacherName || 'Guru PJOK'}
Satuan Pendidikan: ${schoolName || 'SD Negeri'}
Target JP Minimum Sertifikasi: ${weeklyJpTarget} JP per pekan
Tugas Tambahan: ${extraDuties.join(', ') || 'Tidak ada'}
Jadwal Mengajar Saat Ini: ${JSON.stringify(schedule)}
Catatan Tambahan: ${notes || 'Tidak ada'}

Analisislah secara mendalam apakah beban kerja saat ini sudah memenuhi batas minimal 24 JP per pekan untuk tunjangan profesi guru (TPG) / sertifikasi di Indonesia, bagaimana distribusi fisiknya (karena PJOK menguras fisik di lapangan), kelelahan fisik, serta efisiensi beban administrasi. Berikan usulan solusi konkret dan inovatif jika jam mengajar kurang (misal melalui ekuivalensi tugas tambahan Kemendikbudristek seperti Pembina Ekskul, Pembina Pramuka, Koordinator P5, dsb).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah asisten pakar analis beban kerja dan manajemen karir guru/kepegawaian sekolah (Kemendikbudristek RI). Anda bertugas menganalisis jam mengajar guru PJOK dengan keahlian khusus tentang beban fisik guru olahraga di lapangan, regulasi Sertifikasi Guru (Permendikbud No 15 Tahun 2018), dan ekuivalensi jam mengajar. Format output harus selalu dalam bentuk JSON terstruktur sesuai schema yang diminta.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryStatus: { type: Type.STRING, description: 'Ringkasan singkat status beban kerja dan kelayakan sertifikasi' },
            certificationStatus: { type: Type.STRING, description: 'Kelayakan Sertifikasi: "MEMENUHI", "BELUM MEMENUHI", atau "OVERLOAD"' },
            certificationExplanation: { type: Type.STRING, description: 'Penjelasan detail kelayakan sertifikasi berdasarkan regulasi Kemendikbudristek' },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Kelebihan dari pola jadwal / beban kerja saat ini (minimal 2 poin)'
            },
            challenges: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Tantangan/risiko, terutama kelelahan fisik atau kendala administrasi (minimal 2 poin)'
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Rekomendasi taktis untuk mengoptimalkan jam mengajar, meningkatkan kebugaran guru, ekuivalensi tugas tambahan, dsb (minimal 3 poin)'
            },
            weeklyDistributionChartData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: 'Nama Hari' },
                  hours: { type: Type.INTEGER, description: 'Total JP mengajar di hari tersebut' },
                  intensity: { type: Type.STRING, description: 'Tingkat intensitas fisik (Ringan, Sedang, Tinggi)' }
                },
                required: ['day', 'hours', 'intensity']
              },
              description: 'Data distribusi harian beban mengajar untuk divisualisasikan dalam chart'
            }
          },
          required: [
            'summaryStatus',
            'certificationStatus',
            'certificationExplanation',
            'strengths',
            'challenges',
            'recommendations',
            'weeklyDistributionChartData'
          ]
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon dari model AI.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for Workload Analysis');
    const fallback = getFallbackWorkload(req.body);
    res.json(fallback);
  }
});

// --- HELPER FALLBACK FOR JURNAL SATU MATA PELAJARAN ---
function getFallbackJurnalMapel(body: any) {
  const {
    mataPelajaran = 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    namaSekolah = 'SD Negeri Kalimantong',
    tahunPelajaran = '2026/2027',
    semester = 'Semester 1 (Ganjil)',
    namaGuru = 'Budi Santoso, S.Pd., Gr.',
    nipGuru = '19880315 201402 1 003',
    namaKepalaSekolah = 'Drs. H. Ahmad Dahlan, M.Pd.',
    nipKepalaSekolah = '19720510 199803 1 002',
    rentangJadwal = '14 Juli 2025 - 30 September 2025',
    asumsiSiswa = 32,
    tujuanKelas7 = 'Mempraktikkan dan menganalisis gerak spesifik passing bawah dan passing atas permainan bola voli, serta kebugaran jasmani',
    tujuanKelas8 = 'Mempraktikkan dan menganalisis variasi dan kombinasi gerak spesifik servis bawah/atas dan spike pada permainan bola voli',
    tujuanKelas9 = 'Merancang dan mempraktikkan taktik dan strategi penyerangan dan pertahanan bola voli sederhana secara kolaboratif',
    targetKelasList = [],
    jadwalMingguan = 'Senin jam 1-2 kelas VII A, Senin jam 3-4 kelas VII B; Selasa jam 1-2 kelas VIII A, Selasa jam 3-4 kelas VIII B; Rabu jam 1-2 kelas IX A, Kamis jam 1-2 kelas IX B'
  } = body || {};

  // Default target TP per kelas
  const classesTarget = (targetKelasList && targetKelasList.length > 0) ? targetKelasList : [
    {
      kelas: 'Kelas VII',
      tujuanList: [
        tujuanKelas7 || 'Mempraktikkan variasi gerak spesifik passing bawah bola voli',
        'Mempraktikkan variasi gerak spesifik passing atas bola voli',
        'Menganalisis konsep gerak passing bola voli dalam permainan sederhana',
        'Mempraktikkan latihan kebugaran jasmani terkait daya tahan dan kelincahan'
      ]
    },
    {
      kelas: 'Kelas VIII',
      tujuanList: [
        tujuanKelas8 || 'Mempraktikkan variasi dan kombinasi passing dan servis bawah bola voli',
        'Mempraktikkan variasi servis atas dan pertahanan smash sederhana',
        'Menganalisis kesalahan gerak spesifik dalam permainan bola voli beregu',
        'Menerapkan nilai-nilai sportivitas, disiplin, dan kerja sama tim'
      ]
    },
    {
      kelas: 'Kelas IX',
      tujuanList: [
        tujuanKelas9 || 'Merancang strategi penyerangan dan pertahanan permainan bola voli 6 lawan 6',
        'Mengevaluasi efektivitas formasi permainan bola voli sederhana',
        'Mempraktikkan kepemimpinan dan fair play dalam turnamen mini kelas',
        'Menyusun rencana kebugaran jasmani mandiri berkelanjutan'
      ]
    }
  ];

  // Base schedule matrix
  const weeklyScheduleTemplates = [
    { hari: 'Senin', jam: '1 - 2 (07.00 - 08.20)', kelas: 'VII A', tpIndex: 0 },
    { hari: 'Senin', jam: '3 - 4 (08.20 - 09.40)', kelas: 'VII B', tpIndex: 0 },
    { hari: 'Selasa', jam: '1 - 2 (07.00 - 08.20)', kelas: 'VIII A', tpIndex: 0 },
    { hari: 'Selasa', jam: '3 - 4 (08.20 - 09.40)', kelas: 'VIII B', tpIndex: 0 },
    { hari: 'Rabu', jam: '1 - 2 (07.00 - 08.20)', kelas: 'IX A', tpIndex: 0 },
    { hari: 'Kamis', jam: '1 - 2 (07.00 - 08.20)', kelas: 'IX B', tpIndex: 0 }
  ];

  // Topic & step progressions across weeks
  const progressions = [
    {
      mingguKe: 1,
      materiMap: {
        'VII': {
          pokok: 'Permainan Bola Voli (Passing Bawah)',
          rincian: '1. Berbaris, berdoa, presensi, dan apersepsi keselamatan; 2. Pemanasan statis & dinamis; 3. Demonstrasi sikap siap, posisi lutut ditekuk, dan perkenaan bola pada lengan bawah; 4. Latihan mandiri lambung-tangkap bola; 5. Latihan berpasangan passing bawah jarak 3 meter; 6. Pendinginan dan refleksi.',
          hasil: 'KBM berjalan sangat kondusif. Sekitar 88% siswa memahami posisi ayunan lengan tidak melebihi bahu.',
          absen: '1 (Sakit: Ahmad Z.)'
        },
        'VIII': {
          pokok: 'Permainan Bola Voli (Variasi Servis Bawah & Passing)',
          rincian: '1. Pendahuluan, doa, dan cek kesehatan fisik siswa; 2. Pemanasan kardio dan kelenturan bahu; 3. Penjelasan biomekanik ayunan lengan saat servis bawah; 4. Drill servis bawah mengarah ke sasaran target matras; 5. Simulasi servis dan penerimaan passing bawah regu; 6. Evaluasi dan pendinginan.',
          hasil: 'KBM terlaksana dengan lancar dan antusias tinggi. Sebagian besar siswa berhasil mengarahkan bola melewati net.',
          absen: '0 (Nihil)'
        },
        'IX': {
          pokok: 'Permainan Bola Voli (Formasi Taktik Penyerangan Sederhana)',
          rincian: '1. Pembukaan dan apersepsi taktik bermain 6 vs 6; 2. Pemanasan dinamis dan kelincahan footwork; 3. Diskusi peran tosser (pengumpan) dan spiker; 4. Drill pola serangan 3 sentuhan (Passing-Set-Attack); 5. Game mini dengan aturan modifikasi; 6. Refleksi sportivitas dan pendinginan.',
          hasil: 'KBM berjalan sangat aktif dan kolaboratif. Siswa antusias mencoba rotasi posisi pemain di lapangan.',
          absen: '2 (1 Izin: Dimas, 1 Sakit: Putri)'
        }
      }
    },
    {
      mingguKe: 2,
      materiMap: {
        'VII': {
          pokok: 'Permainan Bola Voli (Passing Atas)',
          rincian: '1. Baris, doa, dan apersepsi pengulangan materi sebelumnya; 2. Pemanasan bola beranting; 3. Praktik posisi jari membentuk mangkuk di atas dahi; 4. Latihan dorongan jari ke dinding secara berulang; 5. Latihan berpasangan passing atas bertingkat; 6. Pendinginan dan tanya jawab.',
          hasil: 'KBM terlaksana dengan baik. Sebagian kecil siswa masih menggunakan telapak tangan bukan bantalan ruas jari.',
          absen: '1 (Izin: Salsabila)'
        },
        'VIII': {
          pokok: 'Permainan Bola Voli (Servis Atas & Akurasi)',
          rincian: '1. Pendahuluan, doa, dan cek detak nadi awal; 2. Pemanasan khusus persendian pergelangan tangan & bahu; 3. Demonstrasi lemparan bola stabil setinggi 50 cm di atas kepala; 4. Drill pukulan servis atas ke dinding lalu menyeberangi net; 5. Lomba akurasi servis beregu; 6. Refleksi dan pendinginan.',
          hasil: 'KBM berjalan tertib dan dinamis. Siswa putra maupun putri menunjukkan peningkatan tenaga dorong saat servis.',
          absen: '1 (Sakit: Fajar)'
        },
        'IX': {
          pokok: 'Permainan Bola Voli (Pola Pertahanan Receive & Block Sederhana)',
          rincian: '1. Baris, doa, dan penguatan nilai sportivitas; 2. Pemanasan reaksi cepat dan lompatan vertikal; 3. Penjelasan posisi siap bertahan (ready stance); 4. Drill membendung bola (block) satu orang di depan net; 5. Latihan menerima smash pelan lawan (dig); 6. Penutup dan pendinginan.',
          hasil: 'KBM terlaksana lancar. Koordinasi timing melompat saat blocking masih memerlukan latihan berkala.',
          absen: '0 (Nihil)'
        }
      }
    },
    {
      mingguKe: 3,
      materiMap: {
        'VII': {
          pokok: 'Kombinasi Passing Bawah & Atas dalam Permainan Sederhana',
          rincian: '1. Baris, doa, dan pemanasan aerobik ceria; 2. Latihan kombinasi passing bawah dilanjutkan passing atas sendiri; 3. Latihan segitiga 3 siswa secara bergantian; 4. Game bola voli modifikasi 4 lawan 4 dengan net direndahkan; 5. Refleksi kerja sama tim dan pendinginan.',
          hasil: 'KBM berjalan sangat seru. Siswa menunjukkan rasa percaya diri dan gembira dalam bergerak.',
          absen: '0 (Nihil)'
        },
        'VIII': {
          pokok: 'Kombinasi Teknik Dasar Bola Voli & Sportivitas Tim',
          rincian: '1. Pembukaan, doa, dan presensi; 2. Pemanasan dinamis shuttle run; 3. Latihan alur servis -> passing bawah -> set passing atas -> smash pelan; 4. Simulasi game mini 5 vs 5 tanpa wasit (menerapkan honesty & fair play); 5. Diskusi refleksi peran fair play.',
          hasil: 'KBM berlangsung sangat tertib. Siswa menjunjung tinggi kejujuran saat bola out atau menyentuh net.',
          absen: '1 (Izin: Rehan)'
        },
        'IX': {
          pokok: 'Turnamen Mini Bola Voli & Evaluasi Formasi Beregu',
          rincian: '1. Baris, doa, pembagian tim berimbang heterogen; 2. Pemanasan mandiri dipimpin kapten tim; 3. Pelaksanaan turnamen mini sistem gugur dengan aturan standar; 4. Siswa yang cadangan bertugas sebagai pencatat skor & hakim garis; 5. Rekapitulasi nilai dan pendinginan.',
          hasil: 'KBM berjalan luar biasa kompetitif namun tetap sportif dan bersahabat.',
          absen: '1 (Sakit: Nabila)'
        }
      }
    },
    {
      mingguKe: 4,
      materiMap: {
        'VII': {
          pokok: 'Kebugaran Jasmani (Daya Tahan Jantung-Paru & Kekuatan)',
          rincian: '1. Berbaris, berdoa, dan pengukuran denyut nadi istirahat; 2. Pemanasan statis dan dinamis; 3. Penjelasan sirkuit training 4 pos (push up modifikasi, sit up, skipping, lari bolak-balik); 4. Pelaksanaan sirkuit 2 set bergantian; 5. Pengukuran denyut nadi pemulihan & pendinginan.',
          hasil: 'KBM terlaksana dengan disiplin tinggi. Siswa mencatat sendiri denyut nadi dan memahami manfaat menjaga kebugaran.',
          absen: '1 (Sakit: Gilang)'
        },
        'VIII': {
          pokok: 'Kebugaran Jasmani (Kelincahan & Kecepatan Reaksi)',
          rincian: '1. Baris, doa, presensi, cek kesehatan; 2. Pemanasan game kejar tangkap bendera; 3. Latihan lari zig-zag melewati cone dan boomerang run; 4. Tes kecepatan lari 40 meter bertahap; 5. Pendinginan dan edukasi pola makan gizi seimbang.',
          hasil: 'KBM berjalan penuh semangat dan ceria. Seluruh siswa tuntas mengikuti latihan kelincahan.',
          absen: '0 (Nihil)'
        },
        'IX': {
          pokok: 'Penyusunan Rencana Kebugaran Pribadi (Personal Fitness Plan)',
          rincian: '1. Pendahuluan di selasar/lapangan, doa, dan apersepsi gaya hidup aktif; 2. Praktik pengukuran komponen kebugaran jasmani mandiri; 3. Pembuatan kartu target latihan kebugaran mingguan; 4. Praktik latihan interval kardio intensitas sedang; 5. Pendinginan dan evaluasi portofolio.',
          hasil: 'KBM berjalan tertib dan terarah. Siswa mampu merumuskan komitmen olahraga minimal 3x seminggu di rumah.',
          absen: '1 (Izin: Hendra)'
        }
      }
    }
  ];

  // Calendar dates mapped to weeks (July to September 2025)
  const calendarWeeks = [
    { dates: { 'Senin': 'Senin, 14 Juli 2025', 'Selasa': 'Selasa, 15 Juli 2025', 'Rabu': 'Rabu, 16 Juli 2025', 'Kamis': 'Kamis, 17 Juli 2025', 'Jumat': 'Jumat, 18 Juli 2025' }, progIdx: 0 },
    { dates: { 'Senin': 'Senin, 21 Juli 2025', 'Selasa': 'Selasa, 22 Juli 2025', 'Rabu': 'Rabu, 23 Juli 2025', 'Kamis': 'Kamis, 24 Juli 2025', 'Jumat': 'Jumat, 25 Juli 2025' }, progIdx: 1 },
    { dates: { 'Senin': 'Senin, 28 Juli 2025', 'Selasa': 'Selasa, 29 Juli 2025', 'Rabu': 'Rabu, 30 Juli 2025', 'Kamis': 'Kamis, 31 Juli 2025', 'Jumat': 'Jumat, 01 Agustus 2025' }, progIdx: 2 },
    { dates: { 'Senin': 'Senin, 04 Agustus 2025', 'Selasa': 'Selasa, 05 Agustus 2025', 'Rabu': 'Rabu, 06 Agustus 2025', 'Kamis': 'Kamis, 07 Agustus 2025', 'Jumat': 'Jumat, 08 Agustus 2025' }, progIdx: 3 },
    { dates: { 'Senin': 'Senin, 11 Agustus 2025', 'Selasa': 'Selasa, 12 Agustus 2025', 'Rabu': 'Rabu, 13 Agustus 2025', 'Kamis': 'Kamis, 14 Agustus 2025', 'Jumat': 'Jumat, 15 Agustus 2025' }, progIdx: 0 },
    { dates: { 'Senin': 'Senin, 18 Agustus 2025', 'Selasa': 'Selasa, 19 Agustus 2025', 'Rabu': 'Rabu, 20 Agustus 2025', 'Kamis': 'Kamis, 21 Agustus 2025', 'Jumat': 'Jumat, 22 Agustus 2025' }, progIdx: 1 },
    { dates: { 'Senin': 'Senin, 25 Agustus 2025', 'Selasa': 'Selasa, 26 Agustus 2025', 'Rabu': 'Rabu, 27 Agustus 2025', 'Kamis': 'Kamis, 28 Agustus 2025', 'Jumat': 'Jumat, 29 Agustus 2025' }, progIdx: 2 },
    { dates: { 'Senin': 'Senin, 01 September 2025', 'Selasa': 'Selasa, 02 September 2025', 'Rabu': 'Rabu, 03 September 2025', 'Kamis': 'Kamis, 04 September 2025', 'Jumat': 'Jumat, 05 September 2025' }, progIdx: 3 },
    { dates: { 'Senin': 'Senin, 08 September 2025', 'Selasa': 'Selasa, 09 September 2025', 'Rabu': 'Rabu, 10 September 2025', 'Kamis': 'Kamis, 11 September 2025', 'Jumat': 'Jumat, 12 September 2025' }, progIdx: 0 },
    { dates: { 'Senin': 'Senin, 15 September 2025', 'Selasa': 'Selasa, 16 September 2025', 'Rabu': 'Rabu, 17 September 2025', 'Kamis': 'Kamis, 18 September 2025', 'Jumat': 'Jumat, 19 September 2025' }, progIdx: 1 },
    { dates: { 'Senin': 'Senin, 22 September 2025', 'Selasa': 'Selasa, 23 September 2025', 'Rabu': 'Rabu, 24 September 2025', 'Kamis': 'Kamis, 25 September 2025', 'Jumat': 'Jumat, 26 September 2025' }, progIdx: 2 },
    { dates: { 'Senin': 'Senin, 29 September 2025', 'Selasa': 'Selasa, 30 September 2025', 'Rabu': 'Rabu, 01 Oktober 2025', 'Kamis': 'Kamis, 02 Oktober 2025', 'Jumat': 'Jumat, 03 Oktober 2025' }, progIdx: 3 }
  ];

  const daysMap: { [dateStr: string]: any[] } = {};
  let totalRows = 0;
  let totalHadirSum = 0;

  calendarWeeks.forEach((week) => {
    const prog = progressions[week.progIdx % progressions.length];

    weeklyScheduleTemplates.forEach((item) => {
      const fullDate = (week.dates as any)[item.hari];
      if (!fullDate) return;

      if (!daysMap[fullDate]) {
        daysMap[fullDate] = [];
      }

      const gradeKey = item.kelas.includes('VII') ? 'VII' : item.kelas.includes('VIII') ? 'VIII' : 'IX';
      const mData = prog.materiMap[gradeKey];

      // Find suitable TP
      let tpText = '';
      if (gradeKey === 'VII') tpText = classesTarget[0]?.tujuanList[week.progIdx % (classesTarget[0]?.tujuanList?.length || 1)] || tujuanKelas7;
      else if (gradeKey === 'VIII') tpText = classesTarget[1]?.tujuanList[week.progIdx % (classesTarget[1]?.tujuanList?.length || 1)] || tujuanKelas8;
      else tpText = classesTarget[2]?.tujuanList[week.progIdx % (classesTarget[2]?.tujuanList?.length || 1)] || tujuanKelas9;

      const baseSiswa = Number(asumsiSiswa) || 32;
      const absenText = mData.absen;
      const absenCount = absenText.startsWith('0') ? 0 : absenText.startsWith('1') ? 1 : 2;
      const hadirCount = baseSiswa - absenCount;

      totalRows++;
      totalHadirSum += hadirCount;

      daysMap[fullDate].push({
        id: `row-${Math.random().toString(36).substring(2, 9)}`,
        hariTanggal: fullDate,
        jamKe: item.jam,
        kelas: item.kelas,
        tujuan: tpText,
        materiPokok: mData.pokok,
        rincianMateri: mData.rincian,
        hasil: mData.hasil,
        hadir: hadirCount,
        tidakHadir: absenText,
        keterangan: 'Pemateri: Guru Mapel'
      });
    });
  });

  const hariList = Object.keys(daysMap).map(dateStr => ({
    hariTanggal: dateStr,
    rows: daysMap[dateStr],
    catatanHarian: 'Kegiatan pembelajaran terlaksana sesuai target dan protokol keselamatan lapangan.'
  }));

  const avgHadir = totalRows > 0 ? (totalHadirSum / totalRows).toFixed(1) : `${asumsiSiswa}`;

  return {
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
      asumsiTotalSiswaPerKelas: Number(asumsiSiswa) || 32
    },
    tujuanPembelajaranPerKelas: classesTarget,
    jadwalMingguanSummary: jadwalMingguan,
    hariList,
    ringkasanKbm: {
      totalPertemuan: totalRows,
      totalHadirRataRata: `${avgHadir} Siswa / Pertemuan`,
      persentaseKetercapaian: '97.4%',
      catatanUmum: 'Seluruh rangkaian KBM satu mapel terlaksana secara berurutan sesuai kalender akademik dengan ketercapaian kompetensi optimal.'
    }
  };
}

// 14. Endpoint Generate Jurnal Harian Kegiatan Pembelajaran Guru (Satu Mata Pelajaran)
app.post('/api/generate-jurnal-mapel', async (req, res) => {
  try {
    const {
      mataPelajaran = 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
      namaSekolah = 'SD Negeri Kalimantong',
      tahunPelajaran = '2026/2027',
      semester = 'Semester 1 (Ganjil)',
      namaGuru = 'Budi Santoso, S.Pd., Gr.',
      nipGuru = '19880315 201402 1 003',
      namaKepalaSekolah = 'Drs. H. Ahmad Dahlan, M.Pd.',
      nipKepalaSekolah = '19720510 199803 1 002',
      rentangJadwal = '14 Juli 2025 - 30 September 2025',
      asumsiSiswa = 32,
      tujuanKelas7 = '',
      tujuanKelas8 = '',
      tujuanKelas9 = '',
      targetKelasList = [],
      jadwalMingguan = ''
    } = req.body || {};

    const prompt = `PROMPT JURNAL HARIAN KEGIATAN PEMBELAJARAN
Jika Mengajar Satu Mapel

Buatkan Jurnal Harian Kegiatan Pembelajaran Guru ${mataPelajaran} untuk ${namaSekolah} tahun pelajaran ${tahunPelajaran}.
Gunakan format tabel dengan kolom: Hari/Tanggal, Jam ke-, Kelas, Tujuan, Materi Pokok, Rincian Materi, Hasil, Hadir, Tidak Hadir, dan Keterangan.

Data yang perlu dimasukkan:
1. Tujuan pembelajaran kelas VII: ${tujuanKelas7 || 'Mempraktikkan variasi gerak spesifik passing bola voli dan kebugaran'}
2. Tujuan pembelajaran kelas VIII: ${tujuanKelas8 || 'Mempraktikkan variasi servis bola voli dan kerja sama tim'}
4. Tujuan pembelajaran kelas IX: ${tujuanKelas9 || 'Merancang strategi penyerangan dan pertahanan bola voli serta fair play'}
5. Jadwal mengajar tiap minggu: ${jadwalMingguan || 'Senin jam 1-2 kelas VII A, Senin jam 3-4 kelas VII B, Selasa jam 1-2 kelas VIII A, dst.'}
6. Rentang jadwal: ${rentangJadwal || '14 Juli 2025 - 30 September 2025'}

Instruksi tambahan:
- Sesuaikan "Tujuan & Materi Pokok" dengan tujuan pembelajaran yang diinput.
- "Rincian Materi" berisi detail langkah pembelajaran sesuai tujuan (pendahuluan, pemanasan, latihan inti bertahap, pendinginan).
- "Hasil" berisi catatan lancar/tidaknya KBM, penguasaan gerak siswa, respon positif, dan catatan evaluasi.
- "Hadir" dan "Tidak Hadir" diisi sesuai asumsi jumlah siswa (${asumsiSiswa} siswa per kelas) dengan variasi realistis (ada yang hadir lengkap, ada yang 1 sakit atau izin dengan nama).
- "Keterangan" dapat diisi dengan informasi tambahan seperti "Pemateri: Guru Mapel" atau catatan relevan lainnya.
- Output: Format tabel dibuat per hari (Tabel per hari / dikelompokkan berdasarkan Hari/Tanggal pertemuan).

Hasilkan keluaran dalam JSON yang terstruktur sesuai schema berikut.`;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah asisten pakar kurikulum dan administrasi guru Kurikulum Merdeka Kemendikbudristek RI. Anda bertugas menyusun dokumen resmi Jurnal Harian Kegiatan Pembelajaran Guru untuk 1 Mata Pelajaran secara runtut, rapi, dan pedagogis dalam format JSON terstruktur. Kolom tabel wajib memuat 10 elemen: Hari/Tanggal, Jam ke-, Kelas, Tujuan, Materi Pokok, Rincian Materi, Hasil, Hadir, Tidak Hadir, Keterangan.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identitas: {
              type: Type.OBJECT,
              properties: {
                mataPelajaran: { type: Type.STRING },
                namaSekolah: { type: Type.STRING },
                tahunPelajaran: { type: Type.STRING },
                semester: { type: Type.STRING },
                namaGuru: { type: Type.STRING },
                nipGuru: { type: Type.STRING },
                namaKepalaSekolah: { type: Type.STRING },
                nipKepalaSekolah: { type: Type.STRING },
                rentangJadwal: { type: Type.STRING },
                asumsiTotalSiswaPerKelas: { type: Type.INTEGER }
              },
              required: ['mataPelajaran', 'namaSekolah', 'tahunPelajaran', 'rentangJadwal']
            },
            jadwalMingguanSummary: { type: Type.STRING },
            hariList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hariTanggal: { type: Type.STRING, description: 'Format: Hari, DD Bulan YYYY' },
                  catatanHarian: { type: Type.STRING },
                  rows: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        hariTanggal: { type: Type.STRING },
                        jamKe: { type: Type.STRING, description: 'Contoh: 1 - 2 (07.00 - 08.20)' },
                        kelas: { type: Type.STRING, description: 'Contoh: VII A, VIII B' },
                        tujuan: { type: Type.STRING, description: 'Tujuan pembelajaran spesifik pertemuan' },
                        materiPokok: { type: Type.STRING, description: 'Materi pokok pembelajaran' },
                        rincianMateri: { type: Type.STRING, description: 'Langkah detail kegiatan pembelajaran' },
                        hasil: { type: Type.STRING, description: 'Catatan lancar/tidaknya KBM & penguasaan gerak' },
                        hadir: { type: Type.INTEGER, description: 'Jumlah siswa hadir' },
                        tidakHadir: { type: Type.STRING, description: 'Jumlah & keterangan tidak hadir' },
                        keterangan: { type: Type.STRING, description: 'Keterangan tambahan misal Pemateri: Guru Mapel' }
                      },
                      required: [
                        'hariTanggal',
                        'jamKe',
                        'kelas',
                        'tujuan',
                        'materiPokok',
                        'rincianMateri',
                        'hasil',
                        'hadir',
                        'tidakHadir',
                        'keterangan'
                      ]
                    }
                  }
                },
                required: ['hariTanggal', 'rows']
              }
            },
            ringkasanKbm: {
              type: Type.OBJECT,
              properties: {
                totalPertemuan: { type: Type.INTEGER },
                totalHadirRataRata: { type: Type.STRING },
                persentaseKetercapaian: { type: Type.STRING },
                catatanUmum: { type: Type.STRING }
              }
            }
          },
          required: ['identitas', 'hariList']
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model AI.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for Jurnal 1 Mapel:', error?.message || error);
    const fallback = getFallbackJurnalMapel(req.body);
    res.json(fallback);
  }
});

// --- HELPER FALLBACK FOR ASESMEN SUMATIF AKHIR TAHUN (ASAT - MATERI 2 SEMESTER) ---
function getFallbackAsat(body: any) {
  const {
    mataPelajaran = 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kelas = 'VII (Tujuh)',
    fase = 'Fase D',
    namaSekolah = 'SD Negeri Kalimantong',
    tahunPelajaran = '2026/2027',
    alokasiWaktu = '90 Menit',
    penyusun = 'Budi Santoso, S.Pd., Gr.',
    nipPenyusun = '19880315 201402 1 003',
    kepalaSekolah = 'Drs. H. Ahmad Dahlan, M.Pd.',
    nipKepalaSekolah = '19720510 199803 1 002',
    tujuanSemester1 = '1. Mempraktikkan variasi gerak spesifik passing bola voli; 2. Menganalisis gerak spesifik lari jarak pendek (sprint); 3. Mempraktikkan latihan kebugaran jasmani daya tahan jantung-paru.',
    tujuanSemester2 = '1. Mempraktikkan variasi gerak spesifik servis dan smash bola voli; 2. Menganalisis pola senam lantai guling depan dan lenting; 3. Mempraktikkan gaya renang dada; 4. Mengenali pertolongan pertama cedera olahraga (RICE) dan pola hidup sehat remaja.'
  } = body || {};

  const sem1List = typeof tujuanSemester1 === 'string'
    ? tujuanSemester1.split('\n').filter(Boolean)
    : (tujuanSemester1 || ['Mempraktikkan variasi gerak spesifik passing bola voli', 'Menganalisis gerak spesifik lari jarak pendek']);
  const sem2List = typeof tujuanSemester2 === 'string'
    ? tujuanSemester2.split('\n').filter(Boolean)
    : (tujuanSemester2 || ['Mempraktikkan gerak spesifik servis dan smash bola voli', 'Menganalisis pola senam lantai', 'Mengenali penanganan cedera olahraga RICE']);

  const tp1 = sem1List[0] || 'Mempraktikkan variasi gerak spesifik passing bola voli';
  const tp2 = sem1List[1] || 'Menganalisis gerak spesifik lari jarak pendek (sprint)';
  const tp3 = sem1List[2] || 'Mempraktikkan latihan kebugaran jasmani daya tahan jantung-paru';

  const tp4 = sem2List[0] || 'Mempraktikkan gerak spesifik servis bawah dan atas bola voli';
  const tp5 = sem2List[1] || 'Menganalisis rangkaian gerak senam lantai guling depan dan lenting';
  const tp6 = sem2List[2] || 'Mempraktikkan teknik koordinasi gerak renang gaya dada';
  const tp7 = sem2List[3] || 'Mengenali penanganan cedera olahraga metode RICE dan pola makan bergizi';

  // Build 45 items strictly conforming to:
  // 25 PG, 5 PGK, 8 Menjodohkan, 5 Isian Singkat, 2 Uraian
  // 30% Semester 1 (~14 soal), 70% Semester 2 (~31 soal)
  const kisiKisi: any[] = [
    // --- PILIHAN GANDA (1 - 25) ---
    // Semester 1 (1 - 8)
    {
      no: 1,
      tujuanPembelajaran: tp1,
      ruangLingkupMateri: 'Permainan Bola Voli (Passing Bawah)',
      levelKognitif: 'C2 (Memahami)',
      indikatorSoal: 'Disajikan deskripsi teknik gerak dasar, peserta didik dapat menentukan posisi kedua lengan yang benar saat melakukan passing bawah bola voli.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 1,
      naskahSoal: '[Gambar: "Ilustrasi posisi kedua lengan lurus terkunci di depan bawah dengan ibu jari sejajar saat passing bawah bola voli"]\n\nPerhatikan gambar di atas! Pada saat melakukan teknik gerak spesifik passing bawah bola voli, posisi kedua lengan yang benar untuk menghasilkan pantulan bola yang stabil dan terarah adalah...',
      opsiJawaban: [
        'A. Ditekuk di siku membentuk sudut 90 derajat ke depan dada',
        'B. Lurus rapat ke depan bawah dengan kedua ibu jari sejajar',
        'C. Dibuka selebar bahu dan diayunkan tinggi melampaui kepala',
        'D. Disilangkan di pergelangan tangan dengan jari-jari menggenggam erat',
        'E. Bebas mengepal di samping pinggul saat bola menyentuh lengan'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 1
    },
    {
      no: 2,
      tujuanPembelajaran: tp1,
      ruangLingkupMateri: 'Permainan Bola Voli (Passing Atas)',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Peserta didik dapat menerapkan perkenaan jari-jari tangan pada bola saat melakukan passing atas.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 2,
      naskahSoal: 'Saat menerima bola lambung tinggi di depan dahi, Rudi bersiap melakukan passing atas. Bagian tangan yang paling efektif melakukan dorongan bola agar menghasilkan umpan lambung yang empuk bagi spiker adalah...',
      opsiJawaban: [
        'A. Telapak tangan bagian tengah secara datar',
        'B. Punggung tangan bagian luar dengan pergelangan kaku',
        'C. Bantalan ruas jari-jari kedua tangan membentuk mangkuk terbuka',
        'D. Ujung jari telunjuk dan ibu jari saja secara rapat',
        'E. Tumit telapak tangan bawah dekat pergelangan'
      ],
      kunciJawaban: 'C',
      skor: 1,
      semesterAsal: 1
    },
    {
      no: 3,
      tujuanPembelajaran: tp1,
      ruangLingkupMateri: 'Taktik Permainan Bola Voli',
      levelKognitif: 'C4 (Menganalisis)',
      indikatorSoal: 'Disajikan narasi situasi pertandingan, peserta didik dapat menganalisis penyebab bola passing bawah memantul liar ke belakang lapangan.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 3,
      naskahSoal: 'Dalam sebuah pertandingan voli kelas, Doni melakukan passing bawah tetapi bola justru meluncur liar ke arah belakang lapangan sendiri melewati atas kepalanya. Analisis biomekanik yang paling tepat mengenai penyebab kesalahan teknik Doni adalah...',
      opsiJawaban: [
        'A. Kedua lutut Doni ditekuk terlalu rendah sebelum menyentuh bola',
        'B. Ayunan kedua lengan Doni terlalu tinggi melebihi batas ketinggian bahu',
        'C. Perkenaan bola tepat pada bantalan lengan bawah di atas pergelangan',
        'D. Pandangan mata Doni terlalu fokus tertuju pada lintasan datangnya bola',
        'E. Kaki Doni melangkah maju mendekati titik jatuh bola'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 1
    },
    {
      no: 4,
      tujuanPembelajaran: tp2,
      ruangLingkupMateri: 'Atletik (Lari Jarak Pendek / Sprint)',
      levelKognitif: 'C1 (Mengingat)',
      indikatorSoal: 'Peserta didik dapat menyebutkan aba-aba resmi pada start jongkok lari jarak pendek.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 4,
      naskahSoal: 'Urutan aba-aba start jongkok resmi yang digunakan pada perlombaan lari jarak pendek (100 meter) menurut standar World Athletics / PASI adalah...',
      opsiJawaban: [
        'A. Bersedia - Siap - Mulai!',
        'B. Siap - Awas - Lari!',
        'C. Bersedia - Siap - Ya / Bunyi Pistol!',
        'D. Satu - Dua - Tiga - Lari!',
        'E. Awas - Bersedia - Ya!'
      ],
      kunciJawaban: 'C',
      skor: 1,
      semesterAsal: 1
    },
    {
      no: 5,
      tujuanPembelajaran: tp2,
      ruangLingkupMateri: 'Atletik (Teknik Lari Sprint)',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Disajikan stimulus bacaan, peserta didik dapat menentukan bagian kaki yang menjadi tumpuan saat berlari cepat.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 5,
      naskahSoal: 'Bacalah teks berikut:\n"Seorang sprinter membutuhkan gaya dorong horizontal maksimal dan waktu kontak tanah (ground contact time) yang sesingkat mungkin untuk mencapai akselerasi kecepatan puncak."\n\nBerdasarkan prinsip tersebut, bagian telapak kaki yang digunakan sebagai tumpuan tolakan saat sprint adalah...',
      opsiJawaban: [
        'A. Tumit kaki secara penuh untuk menyerap hentakan',
        'B. Ujung jari kaki paling depan (kuku kaki)',
        'C. Bola kaki bagian depan (ujung telapak kaki depan)',
        'D. Sisi telapak kaki luar secara mendatar',
        'E. Seluruh permukaan telapak kaki secara rata'
      ],
      kunciJawaban: 'C',
      skor: 1,
      semesterAsal: 1
    },
    {
      no: 6,
      tujuanPembelajaran: tp2,
      ruangLingkupMateri: 'Atletik (Fase Memasuki Garis Finish)',
      levelKognitif: 'C2 (Memahami)',
      indikatorSoal: 'Peserta didik dapat memahami sikap tubuh yang efektif saat melewati garis finish lari sprint.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 6,
      naskahSoal: 'Saat pelari berada 2 meter sebelum menyentuh pita atau garis finish, tindakan tubuh yang paling dianjurkan untuk memenangkan catatan waktu adalah...',
      opsiJawaban: [
        'A. Melompat setinggi mungkin ke arah depan garis finish',
        'B. Mencondongkan dada ke depan atau memutar bahu mendahului garis',
        'C. Mengurangi frekuensi ayunan lengan agar tidak tersandung',
        'D. Menoleh ke kanan dan kiri untuk melihat posisi lawan',
        'E. Menghentikan langkah kaki tepat di atas garis finish'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 1
    },
    {
      no: 7,
      tujuanPembelajaran: tp3,
      ruangLingkupMateri: 'Kebugaran Jasmani (Daya Tahan Kardiorespirasi)',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Peserta didik dapat menentukan bentuk tes pengukuran daya tahan jantung-paru.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 7,
      naskahSoal: 'Pak Guru PJOK ingin mengukur tingkat daya tahan jantung-paru dan peredaran darah (VO2Max) seluruh murid kelas VII. Jenis tes kebugaran jasmani terstandar yang paling tepat digunakan adalah...',
      opsiJawaban: [
        'A. Tes lari cepat 50 meter sprint',
        'B. Tes kelenturan duduk menjangkau (sit and reach)',
        'C. Tes Multi-Stage Fitness Test (Bleep Test) / Lari 12 Menit Cooper',
        'D. Tes lompat tegak vertikal (vertical jump)',
        'E. Tes baring duduk (sit up) 30 detik'
      ],
      kunciJawaban: 'C',
      skor: 1,
      semesterAsal: 1
    },
    {
      no: 8,
      tujuanPembelajaran: tp3,
      ruangLingkupMateri: 'Kebugaran Jasmani (Prinsip Latihan FITT)',
      levelKognitif: 'C4 (Menganalisis)',
      indikatorSoal: 'Peserta didik dapat menganalisis komponen denyut nadi latihan (Training Heart Rate).',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 8,
      naskahSoal: 'Seorang remaja berusia 13 tahun memiliki denyut nadi maksimal teoritis (220 - Usia) sebesar 207 bpm. Jika ia ingin melatih kebugaran jantung pada zona aerobik efektif (65% - 85% MHR), maka rentang denyut nadi latihannya per menit adalah sekitar...',
      opsiJawaban: [
        'A. 80 - 100 denyut per menit',
        'B. 105 - 125 denyut per menit',
        'C. 135 - 175 denyut per menit',
        'D. 185 - 205 denyut per menit',
        'E. Lebih dari 210 denyut per menit'
      ],
      kunciJawaban: 'C',
      skor: 1,
      semesterAsal: 1
    },
    // Semester 2 (9 - 25)
    {
      no: 9,
      tujuanPembelajaran: tp4,
      ruangLingkupMateri: 'Permainan Bola Voli (Servis Bawah)',
      levelKognitif: 'C2 (Memahami)',
      indikatorSoal: 'Peserta didik dapat menjelaskan ayunan lengan saat servis bawah bola voli.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 9,
      naskahSoal: 'Pada permainan bola voli, servis bukan hanya sekadar pukulan awal dimulainya permainan, melainkan juga serangan pertama. Pada saat melakukan servis bawah, tangan pemukul diayunkan dari arah...',
      opsiJawaban: [
        'A. Atas kepala lurus ke arah lantai',
        'B. Belakang bawah melengkung lurus ke arah depan atas',
        'C. Samping telinga memutar ke arah dada',
        'D. Depan perut ditarik ke arah pinggul belakang',
        'E. Atas pundak ditebas lurus mendatar'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 10,
      tujuanPembelajaran: tp4,
      ruangLingkupMateri: 'Permainan Bola Voli (Servis Atas / Floating)',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Disajikan gambar, peserta didik dapat menentukan tinggi lambungan bola saat servis atas.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 10,
      naskahSoal: '[Gambar: "Ilustrasi pemain melambungkan bola voli vertikal sekitar 50-80 cm di atas kepala sebelum dipukul servis atas"]\n\nPerhatikan ilustrasi di atas! Ketinggian ideal lambungan bola ke atas sebelum dipukul menggunakan telapak tangan terbuka pada teknik servis atas adalah...',
      opsiJawaban: [
        'A. Kurang dari 10 cm tepat di depan bibir',
        'B. Sekitar 50 cm hingga 1 meter vertikal di atas dahi',
        'C. Minimal 3 meter setinggi tiang lampu lapangan',
        'D. Dilambungkan meluncur jauh ke arah net',
        'E. Tidak perlu dilambungkan melainkan dilempar datar'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 11,
      tujuanPembelajaran: tp4,
      ruangLingkupMateri: 'Permainan Bola Voli (Teknik Smash / Spike)',
      levelKognitif: 'C4 (Menganalisis)',
      indikatorSoal: 'Peserta didik dapat menganalisis urutan 4 tahapan gerak smash yang benar.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 11,
      naskahSoal: 'Urutan tahapan gerak spesifik pelaksanaan smash (spike) bola voli yang benar dan terkoordinasi secara runtut adalah...',
      opsiJawaban: [
        'A. Melayang di udara - Mendarat - Awalan langkah - Memukul bola',
        'B. Awalan melangkah - Tolakan kaki meloncat - Memukul bola di udara - Mendarat mengeper',
        'C. Tolakan kaki - Memukul bola - Awalan langkah - Berlari ke belakang',
        'D. Memukul bola - Melompat dua kaki - Mendarat satu kaki kaku - Awalan',
        'E. Awalan lari cepat - Mendarat - Meloncat setinggi mungkin - Memukul bola'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 12,
      tujuanPembelajaran: tp4,
      ruangLingkupMateri: 'Permainan Bola Voli (Peraturan & Rotasi Pemain)',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Peserta didik dapat menentukan arah rotasi posisi pemain bola voli.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 12,
      naskahSoal: 'Ketika tim penerima servis berhasil memenangkan reli dan merebut hak servis (side-out), seluruh pemain regu tersebut wajib melakukan pergeseran posisi (rotasi). Arah rotasi pemain yang sah menurut regulasi FIVB / PBVSI adalah...',
      opsiJawaban: [
        'A. Berlawanan arah jarum jam',
        'B. Searah dengan putaran jarum jam',
        'C. Diagonal menyilang antarpemain depan dan belakang',
        'D. Bebas sesuai instruksi kapten regu di lapangan',
        'E. Posisi pemain depan bertukar tempat dengan tosser saja'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 13,
      tujuanPembelajaran: tp5,
      ruangLingkupMateri: 'Senam Lantai (Guling Depan / Forward Roll)',
      levelKognitif: 'C2 (Memahami)',
      indikatorSoal: 'Disajikan deskripsi teknik gerak, peserta didik dapat mengidentifikasi bagian tubuh yang pertama menyentuh matras setelah tangan.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 13,
      naskahSoal: '[Gambar: "Bagan langkah gerak guling depan di atas matras: tumpuan tangan, tengkuk menyentuh matras, membulat, dan jongkok berdiri"]\n\nPerhatikan bagan senam lantai di atas! Bagian tubuh yang harus pertama kali mendarat di matras setelah kedua tangan bertumpu agar tidak terjadi cedera pada leher adalah...',
      opsiJawaban: [
        'A. Ujung dahi bagian depan',
        'B. Tengkuk (leher bagian belakang)',
        'C. Puncak tempurung kepala (ubun-ubun)',
        'D. Tulang hidung dan muka',
        'E. Pinggang bagian bawah'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 14,
      tujuanPembelajaran: tp5,
      ruangLingkupMateri: 'Senam Lantai (Guling Belakang / Backward Roll)',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Peserta didik dapat menentukan posisi kedua tangan saat persiapan guling belakang.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 14,
      naskahSoal: 'Ketika melakukan persiapan guling belakang (backward roll) dari sikap awal jongkok, posisi kedua telapak tangan yang benar untuk melakukan dorongan adalah diletakkan di...',
      opsiJawaban: [
        'A. Atas lutut dengan jari-jari menggenggam kaku',
        'B. Samping telinga dengan telapak tangan menghadap ke atas dan ibu jari dekat telinga',
        'C. Belakang panggul menempel di lantai dengan siku lurus',
        'D. Depan dada menyilang memegang pundak lawan',
        'E. Samping pinggang dengan telapak tangan menghadap ke bawah'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 15,
      tujuanPembelajaran: tp5,
      ruangLingkupMateri: 'Senam Lantai (Guling Lenting / Neck Spring)',
      levelKognitif: 'C4 (Menganalisis)',
      indikatorSoal: 'Peserta didik dapat menganalisis sumber tenaga tolakan pada gerakan guling lenting.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 15,
      naskahSoal: 'Gerakan guling lenting (neck spring) menghasilkan dorongan tubuh melenting ke depan atas hingga mendarat berdiri tegak. Sumber tenaga utama yang menghasilkan lontaran lenting tersebut berasal dari...',
      opsiJawaban: [
        'A. Tarikan otot leher dan kepala ke belakang',
        'B. Ayunan dan lecutan kedua kaki lurus ke depan atas dibantu tolakan kuat kedua tangan',
        'C. Hentakan tumit kaki ke arah bawah matras',
        'D. Jatuhnya beban pinggul ke atas lantai',
        'E. Dorongan lutut yang ditekuk rapat ke arah dada'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 16,
      tujuanPembelajaran: tp5,
      ruangLingkupMateri: 'Senam Lantai (Sikap Lilin & Keseimbangan)',
      levelKognitif: 'C2 (Memahami)',
      indikatorSoal: 'Peserta didik dapat menjelaskan tumpuan utama pada sikap lilin.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 16,
      naskahSoal: 'Sikap lilin merupakan salah satu gerakan senam lantai yang melatih keseimbangan dan kekuatan otot inti. Bagian tubuh yang menjadi tumpuan utama saat kedua kaki terangkat lurus vertikal ke atas adalah...',
      opsiJawaban: [
        'A. Telapak tangan saja di atas lantai',
        'B. Punggung bagian atas, tengkuk, dan kedua siku tangan yang menopang pinggang',
        'C. Kepala bagian depan dan dahi',
        'D. Kedua lutut yang bertumpu mengeper',
        'E. Ujung jari-jari kaki'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 17,
      tujuanPembelajaran: tp6,
      ruangLingkupMateri: 'Aktivitas Air (Renang Gaya Dada / Katak)',
      levelKognitif: 'C2 (Memahami)',
      indikatorSoal: 'Peserta didik dapat mengidentifikasi bentuk gerakan kaki renang gaya dada.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 17,
      naskahSoal: 'Gerakan tungkai kaki pada renang gaya dada (breaststroke) sering disebut menyerupai gerakan berenang hewan...',
      opsiJawaban: [
        'A. Ikan lumba-lumba mengibas naik-turun',
        'B. Katak saat menendang melingkar keluar dan merapat lurus (whip kick)',
        'C. Anjing mengayuh cepat di permukaan air',
        'D. Burung mengepakkan sayap mendatar',
        'E. Kuda laut melayang tegak'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 18,
      tujuanPembelajaran: tp6,
      ruangLingkupMateri: 'Aktivitas Air (Pernapasan Renang Gaya Dada)',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Peserta didik dapat menentukan waktu pengambilan napas pada renang gaya dada.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 18,
      naskahSoal: 'Pengambilan napas (inhalasi) pada renang gaya dada dilakukan dengan cara mengangkat kepala ke atas permukaan air pada saat...',
      opsiJawaban: [
        'A. Kedua kaki melakukan tendangan ke belakang',
        'B. Kedua tangan membuka dan mendayung air ke arah samping bawah dada',
        'C. Tubuh meluncur lurus diam di dalam air',
        'D. Kepala masih terbenam di dasar kolam',
        'E. Kaki ditekuk mendekati pantat'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 19,
      tujuanPembelajaran: tp6,
      ruangLingkupMateri: 'Aktivitas Air (Keselamatan di Kolam Renang)',
      levelKognitif: 'C1 (Mengingat)',
      indikatorSoal: 'Peserta didik dapat menyebutkan tindakan keselamatan dasar sebelum masuk ke kolam renang.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 19,
      naskahSoal: 'Sebelum menceburkan diri ke dalam kolam renang umum atau sekolah, tindakan keselamatan mutlak yang wajib dilakukan untuk mencegah kram otot adalah...',
      opsiJawaban: [
        'A. Langsung meloncat ke bagian kolam yang paling dalam',
        'B. Melakukan pemanasan statis-dinamis dan pembasahan tubuh (adaptasi suhu air)',
        'C. Makan makanan porsi berat 10 menit sebelum berenang',
        'D. Menahan napas di dalam air selama mungkin',
        'E. Berlari cepat mengelilingi tepi kolam renang yang licin'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 20,
      tujuanPembelajaran: tp7,
      ruangLingkupMateri: 'Pertolongan Pertama Cedera (Metode R.I.C.E.)',
      levelKognitif: 'C2 (Memahami)',
      indikatorSoal: 'Peserta didik dapat menjelaskan kepanjangan dan prinsip dasar metode R.I.C.E.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 20,
      naskahSoal: 'Saat bermain futsal di sekolah, engkel kaki Rizky terkilir (sprain) hingga membengkak. Penanganan pertama darurat menurut standar medis olahraga adalah menerapkan prinsip R.I.C.E., yang merupakan singkatan dari...',
      opsiJawaban: [
        'A. Run, Ice, Clean, Energy',
        'B. Rest, Ice, Compression, Elevation',
        'C. Relax, Iodine, Cast, Exercise',
        'D. Rub, Inject, Care, Emergency',
        'E. Release, Inflame, Cold, Elastic'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 21,
      tujuanPembelajaran: tp7,
      ruangLingkupMateri: 'Pertolongan Pertama Cedera (Ice Compression)',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Peserta didik dapat menerapkan durasi kompres es yang aman pada cedera memar akut.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 21,
      naskahSoal: 'Tujuan utama pemberian kompres es (Ice) pada bagian tubuh yang mengalami cedera memar atau terkilir dalam 24-48 jam pertama adalah...',
      opsiJawaban: [
        'A. Mempercepat aliran darah ke area cedera agar memar menghitam',
        'B. Menyempitkan pembuluh darah (vasokonstriksi) untuk mengurangi pendarahan dalam dan pembengkakan',
        'C. Memanaskan jaringan otot agar otot rileks seketika',
        'D. Menghilangkan rasa kantuk pada korban cedera',
        'E. Mengeringkan keringat di permukaan kulit korban'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 22,
      tujuanPembelajaran: tp7,
      ruangLingkupMateri: 'Pola Hidup Sehat (Gizi Seimbang Remaja)',
      levelKognitif: 'C2 (Memahami)',
      indikatorSoal: 'Peserta didik dapat mengidentifikasi fungsi utama zat gizi protein bagi tubuh atlet / siswa.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 22,
      naskahSoal: 'Zat gizi makro yang memiliki fungsi utama sebagai zat pembangun, memperbaiki sel-sel otot yang rusak setelah berolahraga berat, dan membentuk antibodi tubuh adalah...',
      opsiJawaban: [
        'A. Karbohidrat sederhana',
        'B. Protein (nabati dan hewani)',
        'C. Lemak jenuh',
        'D. Serat selulosa',
        'E. Natrium klorida'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 23,
      tujuanPembelajaran: tp7,
      ruangLingkupMateri: 'Pola Hidup Sehat (Aktivitas Fisik & Istirahat)',
      levelKognitif: 'C4 (Menganalisis)',
      indikatorSoal: 'Peserta didik dapat menganalisis dampak gaya hidup sedentari (kurang bergerak) bagi remaja.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 23,
      naskahSoal: 'Seorang remaja menghabiskan waktu lebih dari 8 jam sehari duduk menatap layar gadget tanpa melakukan aktivitas jasmani (sedentary lifestyle). Risiko kesehatan jangka panjang yang paling mungkin timbul pada tubuh remaja tersebut adalah...',
      opsiJawaban: [
        'A. Peningkatan kapasitas vital paru-paru dan kelenturan sendi',
        'B. Penurunan massa otot, obesitas, dan meningkatnya risiko penyakit tidak menular (diabetes & hipertensi)',
        'C. Peningkatan kepadatan tulang dan postur tubuh tegap sempurna',
        'D. Penurunan nafsu makan dan kelebihan cadangan hemoglobin',
        'E. Peningkatan daya tahan fisik terhadap cuaca dingin ekstrem'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 24,
      tujuanPembelajaran: tp7,
      ruangLingkupMateri: 'Pertolongan Pertama Cedera (Elevation)',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Peserta didik dapat menerapkan posisi elevasi yang benar pada anggota tubuh yang terkilir.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 24,
      naskahSoal: 'Pada tahap Elevation dalam metode R.I.C.E., anggota tubuh yang mengalami cedera pembengkakan (misalnya pergelangan kaki) harus diposisikan...',
      opsiJawaban: [
        'A. Menggantung ke arah lantai lebih rendah dari tempat tidur',
        'B. Lebih tinggi dari posisi letak jantung untuk membantu aliran balik cairan vena',
        'C. Ditekuk kuat di bawah paha korban',
        'D. Diikat sejajar dengan tumit kaki yang sehat',
        'E. Diberikan beban seberat 5 kilogram'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 25,
      tujuanPembelajaran: tp7,
      ruangLingkupMateri: 'Pencegahan Perilaku Berisiko Remaja',
      levelKognitif: 'C2 (Memahami)',
      indikatorSoal: 'Peserta didik dapat memahami dampak konsumsi rokok/zat adiktif terhadap sistem respirasi saat berolahraga.',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: 25,
      naskahSoal: 'Gas karbon monoksida (CO) yang terkandung di dalam asap rokok memiliki daya ikat terhadap hemoglobin dalam darah 200 kali lebih kuat dibanding oksigen. Akibat nyata yang dialami seorang perokok saat berolahraga adalah...',
      opsiJawaban: [
        'A. Tubuh menjadi lebih bugar dan tidak cepat lelah',
        'B. Pasokan oksigen ke otot dan otak menurun drastis sehingga napas tersengal-sengal dan daya tahan anjlok',
        'C. Denyut nadi istirahat menurun secara drastis',
        'D. Kekuatan kontraksi otot meningkat dua kali lipat',
        'E. Suhu tubuh tetap dingin saat berlari kencang'
      ],
      kunciJawaban: 'B',
      skor: 1,
      semesterAsal: 2
    },

    // --- PILIHAN GANDA KOMPLEKS (26 - 30) ---
    // Semester 1 (26 - 27)
    {
      no: 26,
      tujuanPembelajaran: tp1,
      ruangLingkupMateri: 'Karakteristik Passing Bawah Bola Voli',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Disajikan beberapa pernyataan gerak, peserta didik dapat memilih kombinasi pernyataan yang benar mengenai passing bawah.',
      bentukSoal: 'Pilihan Ganda Kompleks',
      nomorSoal: 26,
      naskahSoal: 'Perhatikan pernyataan-pernyataan berikut mengenai teknik gerak passing bawah bola voli:\n(1) Posisi kedua lutut ditekuk membentuk posisi kuda-kuda seimbang.\n(2) Kedua siku tangan ditekuk dan diayunkan memutar melingkar.\n(3) Perkenaan bola berada pada bidang datar lengan bawah antara pergelangan dan siku.\n(4) Ayunan lengan dilakukan dengan tenaga penuh hingga melewati atas kepala.\n(5) Tumit kaki belakang terangkat dan lutut diluruskan saat memantulkan bola.\n\nPernyataan yang BENAR dalam melakukan teknik passing bawah bola voli adalah...',
      opsiJawaban: [
        'A. (1), (2), dan (3)',
        'B. (1), (3), dan (5)',
        'C. (2), (3), dan (4)',
        'D. (2), (4), dan (5)',
        'E. (3), (4), dan (5)'
      ],
      kunciJawaban: 'B',
      skor: 2,
      semesterAsal: 1
    },
    {
      no: 27,
      tujuanPembelajaran: tp3,
      ruangLingkupMateri: 'Komponen Kebugaran Jasmani Terkait Kesehatan',
      levelKognitif: 'C4 (Menganalisis)',
      indikatorSoal: 'Peserta didik dapat menentukan komponen kebugaran jasmani yang tergolong dalam Health-Related Fitness.',
      bentukSoal: 'Pilihan Ganda Kompleks',
      nomorSoal: 27,
      naskahSoal: 'Kebugaran jasmani dikelompokkan menjadi dua kategori: terkait kesehatan (health-related) dan terkait keterampilan gerak (skill-related). Manakah kelompok komponen di bawah ini yang SELURUHNYA termasuk ke dalam kebugaran jasmani terkait KESEHATAN?\n\n(1) Daya tahan kardiorespirasi (jantung-paru)\n(2) Daya ledak otot (power)\n(3) Kekuatan dan daya tahan otot\n(4) Kecepatan reaksi gerak\n(5) Kelenturan sendi (fleksibilitas) dan komposisi tubuh',
      opsiJawaban: [
        'A. (1), (2), dan (4)',
        'B. (1), (3), dan (5)',
        'C. (2), (4), dan (5)',
        'D. (2), (3), dan (4)',
        'E. (3), (4), dan (5)'
      ],
      kunciJawaban: 'B',
      skor: 2,
      semesterAsal: 1
    },
    // Semester 2 (28 - 30)
    {
      no: 28,
      tujuanPembelajaran: tp5,
      ruangLingkupMateri: 'Penyebab Kegagalan Guling Depan Senam Lantai',
      levelKognitif: 'C4 (Menganalisis)',
      indikatorSoal: 'Peserta didik dapat mengidentifikasi faktor penyebab tubuh berguling miring atau jatuh saat guling depan.',
      bentukSoal: 'Pilihan Ganda Kompleks',
      nomorSoal: 28,
      naskahSoal: 'Ketika melakukan tes guling depan di atas matras, beberapa siswa mengalami kegagalan gerak berupa tubuh berguling menyamping keluar matras atau terasa sakit di bagian kepala. Analisislah kombinasi kesalahan yang menjadi pemicunya:\n\n(1) Tumpuan kedua tangan pada matras tidak seimbang tekanannya.\n(2) Dagu ditempelkan rapat ke arah dada sebelum berguling.\n(3) Kepala bagian dahi atau ubun-ubun yang diletakkan di matras, bukan tengkuk.\n(4) Kedua lutut dilipat membulat rapat ke dada saat berguling.\n(5) Tolakan kaki kurang kuat atau tidak dilakukan secara serentak.',
      opsiJawaban: [
        'A. (1), (2), dan (4)',
        'B. (1), (3), dan (5)',
        'C. (2), (3), dan (4)',
        'D. (2), (4), dan (5)',
        'E. (3), (4), dan (5)'
      ],
      kunciJawaban: 'B',
      skor: 2,
      semesterAsal: 2
    },
    {
      no: 29,
      tujuanPembelajaran: tp6,
      ruangLingkupMateri: 'Fase Gerakan Renang Gaya Dada',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Peserta didik dapat memilih pernyataan yang tepat mengenai koordinasi renang gaya dada.',
      bentukSoal: 'Pilihan Ganda Kompleks',
      nomorSoal: 29,
      naskahSoal: 'Perhatikan prinsip koordinasi gerak renang gaya dada berikut:\n(1) Gerakan tarikan tangan mendayung dilakukan bersamaan dengan tendangan kaki melingkar.\n(2) Saat tangan mendayung air, kepala terangkat menghirup udara melalui mulut.\n(3) Saat tangan lurus meluncur ke depan, kaki menendang melingkar keluar dan merapat lurus.\n(4) Udara dihembuskan perlahan di dalam air melalui mulut dan hidung saat fase meluncur.\n(5) Gerakan kaki renang gaya dada dilakukan dengan mengibaskan ujung kaki naik turun secara bergantian.',
      opsiJawaban: [
        'A. (1), (3), dan (5)',
        'B. (2), (3), dan (4)',
        'C. (1), (2), dan (4)',
        'D. (2), (4), dan (5)',
        'E. (3), (4), dan (5)'
      ],
      kunciJawaban: 'B',
      skor: 2,
      semesterAsal: 2
    },
    {
      no: 30,
      tujuanPembelajaran: tp7,
      ruangLingkupMateri: 'Larangan Penanganan Cedera Akut (H.A.R.M.)',
      levelKognitif: 'C4 (Menganalisis)',
      indikatorSoal: 'Peserta didik dapat menganalisis hal-hal yang dilarang saat menangani cedera terkilir baru.',
      bentukSoal: 'Pilihan Ganda Kompleks',
      nomorSoal: 30,
      naskahSoal: 'Dalam dunia medis olahraga, selain menerapkan prinsip R.I.C.E., penolong juga harus menghindari faktor H.A.R.M. pada 48 jam pertama terjadinya cedera terkilir. Tindakan manakah yang DILARANG dilakukan karena dapat memperparah pendarahan dan peradangan?\n\n(1) Mengoleskan balsem panas atau mengompres bagian cedera dengan air panas (Heat).\n(2) Mengompres cedera dengan kantung es selama 15 menit (Ice).\n(3) Mengonsumsi minuman keras atau beralkohol (Alcohol).\n(4) Memijat, mengurut, atau menginjak bagian cedera secara keras (Massage).\n(5) Membebat pergelangan yang bengkak menggunakan perban elastis (Compression).',
      opsiJawaban: [
        'A. (1), (2), dan (5)',
        'B. (1), (3), dan (4)',
        'C. (2), (3), dan (4)',
        'D. (2), (4), dan (5)',
        'E. (3), (4), dan (5)'
      ],
      kunciJawaban: 'B',
      skor: 2,
      semesterAsal: 2
    },

    // --- MENJODOHKAN (31 - 38) ---
    // Semester 1 (31 - 33)
    {
      no: 31,
      tujuanPembelajaran: tp1,
      ruangLingkupMateri: 'Teknik Bola Voli',
      levelKognitif: 'C2 (Memahami)',
      indikatorSoal: 'Peserta didik dapat menjodohkan teknik bola voli dengan fungsi utamanya.',
      bentukSoal: 'Menjodohkan',
      nomorSoal: 31,
      naskahSoal: 'Jodohkan istilah teknik bola voli di kolom kiri dengan fungsi taktisnya di kolom kanan:\nPremis: "Passing Bawah"\nPilihan Respon: [A] Menerima servis keras lawan atau menyelamatkan bola rendah; [B] Mengawali permainan sekaligus serangan pertama; [C] Memukul bola menukik tajam ke area lawan; [D] Membendung serangan smash di depan net.',
      pasanganMenjodohkan: { premis: 'Passing Bawah', respon: 'Menerima servis keras lawan atau menyelamatkan bola rendah' },
      kunciJawaban: 'A (Menerima servis keras lawan atau menyelamatkan bola rendah)',
      skor: 1,
      semesterAsal: 1
    },
    {
      no: 32,
      tujuanPembelajaran: tp2,
      ruangLingkupMateri: 'Nomor Lari Atletik',
      levelKognitif: 'C1 (Mengingat)',
      indikatorSoal: 'Peserta didik dapat menjodohkan jarak lari dengan kategori nomor atletik.',
      bentukSoal: 'Menjodohkan',
      nomorSoal: 32,
      naskahSoal: 'Jodohkan jarak lari dengan kelompok nomor perlombaan atletik:\nPremis: "Jarak 100 meter, 200 meter, dan 400 meter"\nPilihan Respon: [A] Lari jarak pendek (sprint); [B] Lari jarak menengah; [C] Lari jarak jauh (maraton); [D] Lari halang rintang.',
      pasanganMenjodohkan: { premis: 'Jarak 100 meter, 200 meter, dan 400 meter', respon: 'Lari jarak pendek (sprint)' },
      kunciJawaban: 'A (Lari jarak pendek / sprint)',
      skor: 1,
      semesterAsal: 1
    },
    {
      no: 33,
      tujuanPembelajaran: tp3,
      ruangLingkupMateri: 'Bentuk Latihan Kebugaran Jasmani',
      levelKognitif: 'C2 (Memahami)',
      indikatorSoal: 'Peserta didik dapat menjodohkan gerakan latihan dengan kelompok otot utama yang dilatih.',
      bentukSoal: 'Menjodohkan',
      nomorSoal: 33,
      naskahSoal: 'Jodohkan bentuk latihan fisik dengan kelompok otot target:\nPremis: "Push Up"\nPilihan Respon: [A] Otot dada (pectoralis), trisep lengan, dan bahu depan; [B] Otot perut (rectus abdominis); [C] Otot punggung dan pinggang belakang; [D] Otot betis (gastrocnemius).',
      pasanganMenjodohkan: { premis: 'Push Up', respon: 'Otot dada (pectoralis), trisep lengan, dan bahu depan' },
      kunciJawaban: 'A (Otot dada, trisep lengan, dan bahu depan)',
      skor: 1,
      semesterAsal: 1
    },
    // Semester 2 (34 - 38)
    {
      no: 34,
      tujuanPembelajaran: tp4,
      ruangLingkupMateri: 'Posisi Peran Pemain Voli',
      levelKognitif: 'C2 (Memahami)',
      indikatorSoal: 'Peserta didik dapat menjodohkan nama posisi pemain dengan peran utamanya di lapangan.',
      bentukSoal: 'Menjodohkan',
      nomorSoal: 34,
      naskahSoal: 'Jodohkan sebutan peran pemain voli dengan tugas utamanya:\nPremis: "Tosser / Setter"\nPilihan Respon: [A] Pemain bertahan khusus berseragam beda yang tidak boleh servis/menyerang; [B] Pengatur serangan yang bertugas mengumpan bola akurat bagi spiker; [C] Penyerang utama pemukul bola umpan; [D] Wasit pertama pemimpin laga.',
      pasanganMenjodohkan: { premis: 'Tosser / Setter', respon: 'Pengatur serangan yang bertugas mengumpan bola akurat bagi spiker' },
      kunciJawaban: 'B (Pengatur serangan yang bertugas mengumpan bola akurat bagi spiker)',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 35,
      tujuanPembelajaran: tp5,
      ruangLingkupMateri: 'Alat & Sarana Senam Lantai',
      levelKognitif: 'C1 (Mengingat)',
      indikatorSoal: 'Peserta didik dapat menjodohkan sarana senam lantai dengan fungsi utamanya.',
      bentukSoal: 'Menjodohkan',
      nomorSoal: 35,
      naskahSoal: 'Jodohkan sarana senam lantai dengan kegunaannya:\nPremis: "Matras Busa Padat Tebal 10-15 cm"\nPilihan Respon: [A] Meredam benturan tubuh dan mencegah cedera tulang punggung/leher; [B] Mengukur kecepatan lari pesenam; [C] Tempat duduk wasit juri; [D] Tiang gantung lenting.',
      pasanganMenjodohkan: { premis: 'Matras Busa Padat', respon: 'Meredam benturan tubuh dan mencegah cedera tulang punggung/leher' },
      kunciJawaban: 'A (Meredam benturan tubuh dan mencegah cedera tulang punggung/leher)',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 36,
      tujuanPembelajaran: tp6,
      ruangLingkupMateri: 'Gaya Renang Internasional',
      levelKognitif: 'C2 (Memahami)',
      indikatorSoal: 'Peserta didik dapat menjodohkan nama gaya renang dengan nama internasionalnya.',
      bentukSoal: 'Menjodohkan',
      nomorSoal: 36,
      naskahSoal: 'Jodohkan gaya renang dengan sebutan resminya dalam bahasa internasional (World Aquatics):\nPremis: "Renang Gaya Punggung"\nPilihan Respon: [A] Backstroke; [B] Breaststroke; [C] Butterfly stroke; [D] Freestyle.',
      pasanganMenjodohkan: { premis: 'Renang Gaya Punggung', respon: 'Backstroke' },
      kunciJawaban: 'A (Backstroke)',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 37,
      tujuanPembelajaran: tp7,
      ruangLingkupMateri: 'Prinsip Metode R.I.C.E.',
      levelKognitif: 'C2 (Memahami)',
      indikatorSoal: 'Peserta didik dapat menjodohkan huruf pada R.I.C.E. dengan tindakan konkretnya.',
      bentukSoal: 'Menjodohkan',
      nomorSoal: 37,
      naskahSoal: 'Jodohkan huruf dalam metode R.I.C.E. dengan tindakannya:\nPremis: "Compression"\nPilihan Respon: [A] Mengistirahatkan bagian cedera dan tidak melanjutkan bermain; [B] Membalut area cedera dengan perban elastis secara pas (tidak terlalu ketat); [C] Menempelkan kantung es batu berbalut handuk; [D] Meninggikan posisi kaki lebih tinggi dari jantung.',
      pasanganMenjodohkan: { premis: 'Compression', respon: 'Membalut area cedera dengan perban elastis secara pas' },
      kunciJawaban: 'B (Membalut area cedera dengan perban elastis secara pas)',
      skor: 1,
      semesterAsal: 2
    },
    {
      no: 38,
      tujuanPembelajaran: tp7,
      ruangLingkupMateri: 'Pedoman Gizi Seimbang',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Peserta didik dapat menjodohkan porsi piring makan gizi seimbang dengan jenis makanannya.',
      bentukSoal: 'Menjodohkan',
      nomorSoal: 38,
      naskahSoal: 'Jodohkan konsep program "Isi Piringku" Kemenkes RI dengan jenis asupan makanannya:\nPremis: "1/3 bagian dari setengah piring makan"\nPilihan Respon: [A] Lauk-pauk sumber protein (ayam, telur, ikan, tahu/tempe); [B] Makanan pokok sumber karbohidrat (nasi, jagung, kentang); [C] Sayur-sayuran segar sumber serat dan vitamin; [D] Minuman manis bersoda.',
      pasanganMenjodohkan: { premis: '1/3 bagian dari setengah piring makan', respon: 'Lauk-pauk sumber protein' },
      kunciJawaban: 'A (Lauk-pauk sumber protein)',
      skor: 1,
      semesterAsal: 2
    },

    // --- ISIAN SINGKAT (39 - 43) ---
    // Semester 1 (39 - 40)
    {
      no: 39,
      tujuanPembelajaran: tp1,
      ruangLingkupMateri: 'Posisi Perkenaan Bola Voli',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Peserta didik dapat menuliskan bagian tubuh spesifik perkenaan bola passing bawah.',
      bentukSoal: 'Isian Singkat',
      nomorSoal: 39,
      naskahSoal: 'Saat melakukan gerak spesifik passing bawah bola voli, bidang perkenaan bola yang tepat agar bola memantul melambung secara stabil dan tidak liar adalah pada bagian pergelangan tangan sampai ... cm sebelum siku.',
      kunciJawaban: 'Lengan bawah (antara pergelangan tangan dan siku)',
      skor: 2,
      semesterAsal: 1
    },
    {
      no: 40,
      tujuanPembelajaran: tp2,
      ruangLingkupMateri: 'Start Lari Jarak Pendek',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Peserta didik dapat menuliskan posisi panggul saat aba-aba "Siap".',
      bentukSoal: 'Isian Singkat',
      nomorSoal: 40,
      naskahSoal: 'Pada saat mendengar aba-aba "SIAP" pada start jongkok lari jarak pendek, posisi panggul/pinggul atlet harus diangkat ke atas hingga posisinya sedikit lebih ... daripada bahu.',
      kunciJawaban: 'Tinggi (lebih tinggi dari bahu)',
      skor: 2,
      semesterAsal: 1
    },
    // Semester 2 (41 - 43)
    {
      no: 41,
      tujuanPembelajaran: tp5,
      ruangLingkupMateri: 'Keselamatan Senam Lantai',
      levelKognitif: 'C4 (Menganalisis)',
      indikatorSoal: 'Peserta didik dapat menyebutkan posisi dagu saat melakukan guling depan.',
      bentukSoal: 'Isian Singkat',
      nomorSoal: 41,
      naskahSoal: 'Untuk menjaga tulang leher dari risiko cedera dan memastikan tubuh dapat berguling bulat sempurna di atas matras, posisi dagu harus selalu didekatkan atau ditempelkan rapat ke bagian ...',
      kunciJawaban: 'Dada (menempel di dada)',
      skor: 2,
      semesterAsal: 2
    },
    {
      no: 42,
      tujuanPembelajaran: tp6,
      ruangLingkupMateri: 'Teknik Luncuran Renang Gaya Dada',
      levelKognitif: 'C3 (Menerapkan)',
      indikatorSoal: 'Peserta didik dapat menuliskan posisi tubuh saat fase meluncur di air.',
      bentukSoal: 'Isian Singkat',
      nomorSoal: 42,
      naskahSoal: 'Sikap posisi tubuh yang sejajar, lurus mendatar dengan permukaan air untuk meminimalisir hambatan air (streamlining) saat meluncur dalam renang disebut dengan posisi ...',
      kunciJawaban: 'Streamline (sejajar permukaan air / hidrodinamis)',
      skor: 2,
      semesterAsal: 2
    },
    {
      no: 43,
      tujuanPembelajaran: tp7,
      ruangLingkupMateri: 'Pertolongan Pertama Cedera (Ice)',
      levelKognitif: 'C4 (Menganalisis)',
      indikatorSoal: 'Peserta didik dapat menuliskan batas waktu maksimal kompres es dalam satu sesi.',
      bentukSoal: 'Isian Singkat',
      nomorSoal: 43,
      naskahSoal: 'Pada penanganan cedera sprain menggunakan kompres es, pemberian es tidak boleh ditempelkan langsung tanpa pelapis dan durasi maksimal dalam satu sesi kompres adalah berkisar antara 15 hingga ... menit agar tidak merusak jaringan kulit (frostbite).',
      kunciJawaban: '20 menit',
      skor: 2,
      semesterAsal: 2
    },

    // --- URAIAN / ESAI (44 - 45) ---
    // Semester 1 / Integratif (44)
    {
      no: 44,
      tujuanPembelajaran: tp1,
      ruangLingkupMateri: 'Analisis Situasi Pertandingan Bola Voli',
      levelKognitif: 'C5 (Mengevaluasi)',
      indikatorSoal: 'Disajikan studi kasus pertandingan, peserta didik dapat mengevaluasi kesalahan taktik dan merumuskan solusi perbaikan komunikasi tim.',
      bentukSoal: 'Uraian',
      nomorSoal: 44,
      naskahSoal: 'Kasus Pertandingan:\nDalam turnamen bola voli antarkelas di sekolah, Tim Kelas VII A selalu kehilangan poin setiap kali lawan melakukan servis lambung yang jatuh di antara posisi pemain depan dan pemain belakang. Bola sering dibiarkan jatuh bebas menyentuh lantai karena kedua pemain saling mengira temannya yang akan mengambil bola (salah pengertian / miskomunikasi).\n\nBerdasarkan kasus di atas:\na. Evaluasilah apa saja faktor teknis dan non-teknis yang menyebabkan kelemahan pertahanan Tim Kelas VII A tersebut!\nb. Rumuskan 3 langkah konkret strategi perbaikan yang harus diterapkan oleh kapten dan seluruh pemain saat menerima servis lawan pada set berikutnya!',
      kunciJawaban: 'a. Faktor teknis: Sikap siap pertahanan (ready position) lambat, tidak adanya pembagian zona tanggung jawab yang jelas. Faktor non-teknis: Minimnya komunikasi verbal di lapangan (tidak berteriak "Saya!" atau "Bola saya!").\nb. Tiga langkah konkret: 1) Menetapkan komando verbal tegas saat bola melambung; 2) Membagi zona lapangan dengan formasi W (5 pemain menerima servis); 3) Meningkatkan kekompakan dan fokus pandangan pada arah datangnya bola.',
      skor: 5,
      semesterAsal: 1
    },
    // Semester 2 (45)
    {
      no: 45,
      tujuanPembelajaran: tp7,
      ruangLingkupMateri: 'Aplikasi Penanganan Cedera di Lingkungan Nyata Siswa',
      levelKognitif: 'C6 (Mencipta / Merancang Solusi)',
      indikatorSoal: 'Disajikan simulasi kecelakaan olahraga di sekolah, peserta didik dapat menyusun langkah-langkah pertolongan pertama metode R.I.C.E. secara sistematis.',
      bentukSoal: 'Uraian',
      nomorSoal: 45,
      naskahSoal: 'Simulasi Kehidupan Nyata:\nSaat jam istirahat sekolah, teman sekelasmu bernama Andra melompat saat bermain basket dan mendarat dengan posisi kaki tertekuk ke samping. Andra berteriak kesakitan, pergelangan kaki kanannya mulai terlihat memerah dan membengkak dengan cepat. Beberapa teman berniat langsung memijat pergelangan kakinya dan membantunya berdiri untuk berjalan.\n\nSebagai siswa yang telah mempelajari materi P3K Cedera Olahraga PJOK:\na. Jelaskan mengapa tindakan teman-teman yang ingin memijat pergelangan kaki Andra sangat BERBAHAYA dan harus segera dicegah!\nb. Susunlah urutan langkah pertolongan pertama darurat yang HARUS kamu lakukan terhadap Andra menggunakan prinsip R.I.C.E. secara rinci dan tepat menggunakan perlengkapan yang ada di UKS sekolah!',
      kunciJawaban: 'a. Memijat cedera akut sangat berbahaya karena merobek serat ligamen/otot yang sedang terluka, memperluas pendarahan pembuluh darah kapiler, dan memicu peradangan yang jauh lebih parah.\nb. Urutan R.I.C.E.: 1) Rest: Hentikan Andra bergerak, baringkan atau dudukkan di tempat teduh; 2) Ice: Kompres pergelangan kaki dengan es batu dibalut handuk UKS selama 15-20 menit; 3) Compression: Balut pergelangan kaki dengan perban elastis/tensocrepe secara pas (jangan terlalu kencang hingga membiru); 4) Elevation: Ganjal kaki Andra dengan bantal atau tas agar posisinya berada lebih tinggi dari dada/jantung; 5) Laporkan ke guru pembina UKS / rujuk ke puskesmas jika nyeri berlanjut.',
      skor: 5,
      semesterAsal: 2
    }
  ];

  return {
    identitas: {
      namaSekolah,
      mataPelajaran,
      kelas,
      fase,
      tahunPelajaran,
      alokasiWaktu,
      jumlahSoal: 45,
      penyusun,
      nipPenyusun,
      kepalaSekolah,
      nipKepalaSekolah
    },
    tujuanSemester1: sem1List,
    tujuanSemester2: sem2List,
    kisiKisi,
    petunjukPengerjaan: [
      'Berdoalah sebelum mengerjakan soal sesuai agama dan kepercayaan masing-masing.',
      'Tuliskan identitas diri (Nama Lengkap, Nomor Peserta, dan Kelas) secara jelas pada Lembar Jawaban yang telah disediakan.',
      'Periksa dan bacalah seluruh soal dengan cermat dan teliti sebelum Anda menjawabnya.',
      'Laporkan kepada pengawas ujian jika terdapat tulisan yang kurang jelas, rusak, atau jumlah halaman yang tidak lengkap.',
      'Dahulukan menjawab soal-soal yang Anda anggap paling mudah.',
      'Periksa kembali seluruh pekerjaan Anda sebelum diserahkan kepada pengawas ujian.'
    ],
    pedomanPenskoran: {
      skorMaksimalPG: 25, // 25 x 1
      skorMaksimalPGK: 10, // 5 x 2
      skorMaksimalMenjodohkan: 8, // 8 x 1
      skorMaksimalIsian: 10, // 5 x 2
      skorMaksimalUraian: 10, // 2 x 5
      totalSkorMaksimal: 63,
      rumusNilaiAkhir: 'Nilai Akhir = (Total Skor Perolehan / 63) x 100',
      rubrikUraian: [
        {
          nomorSoal: 44,
          kriteriaSkor: [
            { skor: 5, deskripsi: 'Menjelaskan faktor teknis dan non-teknis secara mendalam, serta merumuskan 3 strategi konkret yang sangat aplikatif.' },
            { skor: 3, deskripsi: 'Menjelaskan sebagian faktor dan merumuskan 2 strategi konkret.' },
            { skor: 1, deskripsi: 'Hanya menyebutkan jawaban singkat tanpa analisis atau strategi jelas.' }
          ]
        },
        {
          nomorSoal: 45,
          kriteriaSkor: [
            { skor: 5, deskripsi: 'Menjelaskan bahaya pemijatan cedera akut secara medis dan menguraikan seluruh tahapan R.I.C.E. secara runut, tepat, dan realistis.' },
            { skor: 3, deskripsi: 'Menjelaskan bahaya pemijatan dan menyebutkan tahapan R.I.C.E. namun kurang lengkap.' },
            { skor: 1, deskripsi: 'Hanya menyebutkan sebagian langkah R.I.C.E. tanpa alasan bahaya pemijatan.' }
          ]
        }
      ]
    }
  };
}

// 15. Endpoint Generate Asesmen Sumatif Akhir Tahun (ASAT - Materi 2 Semester)
app.post('/api/generate-asat', async (req, res) => {
  try {
    const {
      mataPelajaran = 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
      kelas = 'VII (Tujuh)',
      fase = 'Fase D',
      namaSekolah = 'SD Negeri Kalimantong',
      tahunPelajaran = '2026/2027',
      alokasiWaktu = '90 Menit',
      tujuanSemester1 = '',
      tujuanSemester2 = ''
    } = req.body || {};

    const prompt = `Anda adalah Guru mata pelajaran ${mataPelajaran} kelas ${kelas} fase ${fase} yang sedang menyusun soal asesmen.
Buatkan asesmen sumatif akhir tahun berdasarkan tujuan pembelajaran berikut:
Semester 1: ${tujuanSemester1 || 'Mempraktikkan gerak spesifik passing bola voli, atletik lari sprint, dan kebugaran jasmani'}
Semester 2: ${tujuanSemester2 || 'Mempraktikkan servis bola voli, senam lantai guling depan, renang gaya dada, dan penanganan cedera RICE'}

Asesmen sumatif digunakan untuk mengukur ketercapaian kompetensi peserta didik secara menyeluruh pada akhir periode pembelajaran dimana 30% soal sesuai dengan tujuan pembelajaran di semester 1 dan 70% sesuai dengan tujuan pembelajaran di semester 2.

Buatkan juga kisi-kisi asesmen sumatif yang berfungsi untuk memetakan ketercapaian semua tujuan pembelajaran tersebut. Kisi-kisi harus ditampilkan dalam format kolom berikut:
No, Tujuan Pembelajaran, Ruang Lingkup Materi, Level Kognitif (Taksonomi Bloom), Indikator Soal, Bentuk Soal, Nomor Soal, Naskah Soal, Kunci Jawaban, Skor.

Distribusi Soal:
- Soal pilihan ganda disusun sebanyak 25 nomor dengan 5 pilihan jawaban (A, B, C, D, E), tingkat kesulitan bervariasi dari mudah, sedang, hingga sulit.
- Soal pilihan ganda kompleks disusun sebanyak 5 nomor dengan 5 pilihan jawaban, tingkat kesulitan bervariasi.
- Soal menjodohkan disusun sebanyak 8 nomor.
- Soal isian singkat disusun sebanyak 5 nomor berbentuk aplikasi konsep dalam kehidupan nyata.
- Soal isian uraian disusun sebanyak 2 nomor berbentuk aplikasi konsep dalam kehidupan nyata.
Info Tambahan: Sertakan soal-soal yang memiliki stimulus berupa bacaan singkat dan soal berbasis gambar format "[Gambar: 'Deskripsikan detail gambar yang harus disiapkan oleh guru']".

Terakhir, sertakan petunjuk pengerjaan dan pedoman penskoran lengkap. Hasilkan dalam bentuk JSON terstruktur.`;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah pakar asesmen dan kurikulum sekolah Kurikulum Merdeka Kemendikbudristek RI. Anda menyusun instrumen Asesmen Sumatif Akhir Tahun (ASAT) 45 soal berbobot 30% Semester 1 dan 70% Semester 2 dalam format JSON valid dan terstruktur.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identitas: {
              type: Type.OBJECT,
              properties: {
                namaSekolah: { type: Type.STRING },
                mataPelajaran: { type: Type.STRING },
                kelas: { type: Type.STRING },
                fase: { type: Type.STRING },
                tahunPelajaran: { type: Type.STRING },
                alokasiWaktu: { type: Type.STRING },
                jumlahSoal: { type: Type.INTEGER }
              },
              required: ['namaSekolah', 'mataPelajaran', 'kelas', 'fase', 'tahunPelajaran']
            },
            tujuanSemester1: { type: Type.ARRAY, items: { type: Type.STRING } },
            tujuanSemester2: { type: Type.ARRAY, items: { type: Type.STRING } },
            petunjukPengerjaan: { type: Type.ARRAY, items: { type: Type.STRING } },
            kisiKisi: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  no: { type: Type.INTEGER },
                  tujuanPembelajaran: { type: Type.STRING },
                  ruangLingkupMateri: { type: Type.STRING },
                  levelKognitif: { type: Type.STRING },
                  indikatorSoal: { type: Type.STRING },
                  bentukSoal: { type: Type.STRING },
                  nomorSoal: { type: Type.INTEGER },
                  naskahSoal: { type: Type.STRING },
                  opsiJawaban: { type: Type.ARRAY, items: { type: Type.STRING } },
                  kunciJawaban: { type: Type.STRING },
                  skor: { type: Type.INTEGER },
                  semesterAsal: { type: Type.INTEGER }
                },
                required: ['no', 'tujuanPembelajaran', 'ruangLingkupMateri', 'bentukSoal', 'nomorSoal', 'naskahSoal', 'kunciJawaban', 'skor']
              }
            },
            pedomanPenskoran: {
              type: Type.OBJECT,
              properties: {
                skorMaksimalPG: { type: Type.INTEGER },
                skorMaksimalPGK: { type: Type.INTEGER },
                skorMaksimalMenjodohkan: { type: Type.INTEGER },
                skorMaksimalIsian: { type: Type.INTEGER },
                skorMaksimalUraian: { type: Type.INTEGER },
                totalSkorMaksimal: { type: Type.INTEGER },
                rumusNilaiAkhir: { type: Type.STRING }
              }
            }
          },
          required: ['identitas', 'kisiKisi']
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model AI.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for ASAT (Sumatif Akhir Tahun):', error?.message || error);
    const fallback = getFallbackAsat(req.body);
    res.json(fallback);
  }
});

// --- HELPER FALLBACK FOR UJIAN SEKOLAH / MADRASAH (US/UM - 50 SOAL PG) ---
function getFallbackUjianSekolah(body: any) {
  const {
    mataPelajaran = 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kelasAkhir = 'IX (Sembilan)',
    jenjang = 'SMP/MTs',
    namaSekolah = 'SD Negeri Kalimantong',
    tahunPelajaran = '2026/2027',
    alokasiWaktu = '120 Menit',
    penyusun = 'Budi Santoso, S.Pd., Gr.',
    nipPenyusun = '19880315 201402 1 003',
    kepalaSekolah = 'Drs. H. Ahmad Dahlan, M.Pd.',
    nipKepalaSekolah = '19720510 199803 1 002',
    versiPrompt = 'versi_2',
    tujuanUmum = '',
    tujuanKelas7 = '',
    tujuanKelas8 = '',
    tujuanKelas9 = '',
    jumlahOpsi = 5,
    jumlahSoal = 50
  } = body || {};

  const targetOpsiCount = Math.min(Math.max(Number(jumlahOpsi) || 5, 3), 5);
  const targetSoalCount = Math.min(Math.max(Number(jumlahSoal) || 50, 10), 50);
  const letterLabels = ['A', 'B', 'C', 'D', 'E'].slice(0, targetOpsiCount);

  // Helper to reformat option list and guarantee the correct answer is within the allowed options
  function adaptOptions(originalOptions: string[], originalKey: string, count: number) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const keyIdx = letters.indexOf(originalKey);
    let texts = (originalOptions || []).map(op => op.replace(/^[A-E]\.\s*/, ''));
    
    // Fallback if options are too few
    while (texts.length < count) {
      texts.push(`Pilihan jawaban ${letters[texts.length]} yang relevan`);
    }

    // Ensure correct answer is within the first 'count' options
    let correctText = (keyIdx >= 0 && keyIdx < texts.length) ? texts[keyIdx] : texts[0];
    if (keyIdx >= count) {
      // swap with last available option
      const swapTarget = count - 1;
      const temp = texts[swapTarget];
      texts[swapTarget] = texts[keyIdx];
      texts[keyIdx] = temp;
    }

    const sliced = texts.slice(0, count);
    let newKeyIdx = sliced.indexOf(correctText);
    if (newKeyIdx === -1) newKeyIdx = 0;
    const newKey = letters[newKeyIdx];
    const finalOptions = sliced.map((t, i) => `${letters[i]}. ${t}`);
    return { finalOptions, newKey };
  }

  // Standard question bank of 50 items covering all curriculum strands (C1-C6 with C3-C5 dominant)
  const baseItems: any[] = [
    // --- KELAS 7 / TAHAP AWAL (Nomor 1 - 10) ---
    {
      no: 1,
      tujuan: 'Mempraktikkan variasi gerak spesifik passing bawah bola voli',
      materi: 'Permainan Bola Voli (Passing Bawah)',
      level: 'C2 (Memahami)',
      indikator: 'Disajikan gambar posisi lengan, peserta didik dapat menentukan posisi kedua ibu jari tangan saat passing bawah.',
      soal: '[Gambar: "Ilustrasi posisi kedua lengan bawah lurus terkunci rapat ke depan bawah dengan kedua ibu jari sejajar"]\n\nPerhatikan gambar di atas! Pada saat melakukan passing bawah bola voli, posisi kedua ibu jari tangan yang benar agar bola memantul stabil dan terarah adalah...',
      opsi: [
        'A. Bersilangan rapat di pangkal jari',
        'B. Sejajar dan lurus menghadap ke depan atas',
        'C. Menggenggam erat ibu jari tangan kanan ke dalam telapak',
        'D. Ditekuk mengarah ke dada pemain',
        'E. Terbuka lebar tidak menyentuh jari lainnya'
      ],
      kunci: 'B',
      kelas: 'Kelas VII'
    },
    {
      no: 2,
      tujuan: 'Mempraktikkan gerak spesifik passing atas bola voli',
      materi: 'Permainan Bola Voli (Passing Atas)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat menentukan perkenaan bola pada jari-jari tangan saat melakukan passing atas.',
      soal: 'Saat bola melambung tinggi di depan atas dahi, pemain bersiap melakukan passing atas. Bagian tangan yang menyentuh bola agar menghasilkan dorongan lambung yang akurat dan tidak melanggar aturan double ball adalah...',
      opsi: [
        'A. Telapak tangan bagian tengah secara mendatar',
        'B. Bantalan ruas jari-jari kedua tangan membentuk mangkuk terbuka',
        'C. Ujung kuku jari telunjuk saja secara kaku',
        'D. Tumit telapak tangan dekat pergelangan',
        'E. Punggung tangan bagian luar'
      ],
      kunci: 'B',
      kelas: 'Kelas VII'
    },
    {
      no: 3,
      tujuan: 'Menganalisis kesalahan gerak pada passing bawah',
      materi: 'Permainan Bola Voli (Analisis Gerak)',
      level: 'C4 (Menganalisis)',
      indikator: 'Disajikan situasi pertandingan, peserta didik dapat menganalisis penyebab bola passing bawah memantul ke belakang.',
      soal: 'Dalam sebuah reli pertandingan, Doni menerima servis lawan dengan passing bawah, namun bola justru memantul ke belakang melampaui kepalanya. Analisis kesalahan teknik Doni yang paling mendasar adalah...',
      opsi: [
        'A. Lutut Doni ditekuk terlalu rendah saat bersiap',
        'B. Ayunan kedua lengan Doni terlalu tinggi melebihi batas bahu',
        'C. Perkenaan bola tepat di atas pergelangan tangan',
        'D. Pandangan mata Doni tertuju ke arah datangnya bola',
        'E. Tubuh Doni condong ke depan menyambut bola'
      ],
      kunci: 'B',
      kelas: 'Kelas VII'
    },
    {
      no: 4,
      tujuan: 'Mempraktikkan keterampilan menendang bola dengan kaki bagian dalam',
      materi: 'Sepak Bola (Passing & Stopping)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat menentukan posisi kaki tumpu saat menendang bola menggunakan kaki bagian dalam.',
      soal: 'Pada permainan sepak bola, untuk menghasilkan operan menyusur tanah yang presisi kepada rekan tim, posisi kaki tumpu diletakkan di...',
      opsi: [
        'A. Belakang bola sejauh 1 meter',
        'B. Samping bola berjarak sekitar 10-15 cm dengan ujung kaki mengarah ke sasaran',
        'C. Depan bola sejajar garis tendangan',
        'D. Menyilang di depan kaki penendang',
        'E. Di atas bola dengan menginjak permukaan bola'
      ],
      kunci: 'B',
      kelas: 'Kelas VII'
    },
    {
      no: 5,
      tujuan: 'Menganalisis gerak spesifik start jongkok lari jarak pendek',
      materi: 'Atletik (Lari Jarak Pendek / Sprint)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat menentukan posisi panggul saat aba-aba "Siap".',
      soal: 'Pada pelaksanaan start jongkok lari cepat 100 meter, saat starter meneriakkan aba-aba "SIAP", posisi panggul atlet yang benar adalah...',
      opsi: [
        'A. Diturunkan mendekati tumit kaki belakang',
        'B. Diangkat ke atas hingga lebih tinggi dari bahu dengan berat badan bertumpu pada lengan',
        'C. Sejajar rata dengan mata kaki',
        'D. Diam tidak bergerak seperti sikap bersedia',
        'E. Digoyangkan ke kanan dan kiri untuk mencari keseimbangan'
      ],
      kunci: 'B',
      kelas: 'Kelas VII'
    },
    {
      no: 6,
      tujuan: 'Mempraktikkan teknik ayunan lengan pada lari jarak pendek',
      materi: 'Atletik (Mekanika Sprint)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat menentukan sudut tekukan siku tangan saat sprint.',
      soal: 'Untuk menghasilkan efisiensi gerak dan tenaga dorong maksimal saat berlari cepat, kedua siku tangan ditekuk membentuk sudut sekitar...',
      opsi: [
        'A. 45 derajat merapat ke perut',
        'B. 90 derajat dan diayunkan selaras langkah kaki dari pinggul hingga setinggi dagu',
        'C. 180 derajat lurus ke samping badan',
        'D. 120 derajat memutar melingkar di depan dada',
        'E. Lurus kaku ke bawah'
      ],
      kunci: 'B',
      kelas: 'Kelas VII'
    },
    {
      no: 7,
      tujuan: 'Mempraktikkan gerak senam lantai guling depan',
      materi: 'Senam Lantai (Guling Depan / Forward Roll)',
      level: 'C2 (Memahami)',
      indikator: 'Peserta didik dapat menyebutkan bagian tubuh yang pertama mendarat di matras setelah tangan.',
      soal: '[Gambar: "Urutan rangkaian gerak guling depan di atas matras senam"]\n\nPerhatikan ilustrasi di atas! Agar terhindar dari cedera leher saat melakukan guling depan, bagian tubuh yang harus pertama kali menyentuh matras setelah kedua tangan bertumpu adalah...',
      opsi: [
        'A. Ujung dahi kepala depan',
        'B. Tengkuk / leher bagian belakang',
        'C. Puncak ubun-ubun kepala',
        'D. Muka dan hidung',
        'E. Punggung bawah dekat pinggul'
      ],
      kunci: 'B',
      kelas: 'Kelas VII'
    },
    {
      no: 8,
      tujuan: 'Menganalisis sikap lilin pada senam lantai',
      materi: 'Senam Lantai (Keseimbangan Statis)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat menentukan tumpuan utama pada sikap lilin.',
      soal: 'Saat melakukan gerakan sikap lilin dengan kedua kaki terangkat tegak lurus ke atas, tumpuan utama tubuh berada pada...',
      opsi: [
        'A. Telapak tangan saja',
        'B. Pundak/tengkuk dan kedua siku tangan yang menopang pinggang',
        'C. Kepala bagian dahi',
        'D. Lutut kaki',
        'E. Ujung jari kaki'
      ],
      kunci: 'B',
      kelas: 'Kelas VII'
    },
    {
      no: 9,
      tujuan: 'Mempraktikkan pengukuran kebugaran kardiorespirasi',
      materi: 'Kebugaran Jasmani (Daya Tahan Jantung-Paru)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menganalisis fungsi tes lari Multi-Stage (Bleep Test).',
      soal: 'Pak Guru PJOK menyelenggarakan tes kebugaran jasmani menggunakan metode Multi-Stage Fitness Test (Bleep Test) bolak-balik 20 meter. Komponen kebugaran utama yang diukur melalui tes tersebut adalah...',
      opsi: [
        'A. Kelenturan otot paha belakang (hamstring)',
        'B. Daya tahan aerobik kardiorespirasi (VO2Max)',
        'C. Daya ledak otot tungkai (power)',
        'D. Kecepatan reaksi tangan',
        'E. Keseimbangan dinamis'
      ],
      kunci: 'B',
      kelas: 'Kelas VII'
    },
    {
      no: 10,
      tujuan: 'Memahami prinsip denyut nadi latihan',
      materi: 'Kebugaran Jasmani (Monitoring Intensitas)',
      level: 'C4 (Menganalisis)',
      indikator: 'Disajikan data usia, peserta didik dapat menghitung denyut nadi maksimal teoritis.',
      soal: 'Berdasarkan rumus baku fisiologi olahraga (Denyut Nadi Maksimal = 220 - Usia), jika seorang murid SMP berusia 14 tahun berolahraga, maka denyut nadi maksimal (MHR) teoritisnya adalah...',
      opsi: [
        'A. 196 denyut per menit',
        'B. 206 denyut per menit',
        'C. 214 denyut per menit',
        'D. 220 denyut per menit',
        'E. 180 denyut per menit'
      ],
      kunci: 'B',
      kelas: 'Kelas VII'
    },

    // --- KELAS 8 / TAHAP MENENGAH (Nomor 11 - 30) ---
    {
      no: 11,
      tujuan: 'Mempraktikkan gerak spesifik servis atas bola voli',
      materi: 'Permainan Bola Voli (Servis Atas)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat menentukan titik kontak telapak tangan saat memukul bola servis atas.',
      soal: 'Pada pelaksanaan servis atas bola voli, perkenaan telapak tangan pada bola yang paling efektif untuk menghasilkan pukulan menukik tajam melewati net adalah...',
      opsi: [
        'A. Memukul bola pada bagian bawahnya menggunakan ujung jari',
        'B. Memukul bagian tengah belakang bola dengan telapak tangan terbuka dan pergelangan melecut',
        'C. Menepis bola ke samping dengan punggung tangan',
        'D. Meninju bola dengan kepalan tangan kaku',
        'E. Mendorong bola pelan dengan kedua tangan bersamaan'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 12,
      tujuan: 'Menganalisis variasi smash bola voli',
      materi: 'Permainan Bola Voli (Teknik Spike / Smash)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menganalisis urutan tahapan gerak smash yang benar.',
      soal: 'Urutan tahapan biomekanika gerak smash (spike) bola voli yang benar secara berurutan adalah...',
      opsi: [
        'A. Awalan melangkah - Tolakan meloncat - Memukul bola di udara - Mendarat mengeper',
        'B. Mendarat - Awalan langkah - Memukul bola - Melompat',
        'C. Memukul bola - Tolakan kaki - Awalan - Mendarat satu kaki',
        'D. Tolakan meloncat - Awalan lari - Mendarat - Memukul bola',
        'E. Awalan langkah - Memukul bola di lantai - Melompat - Mendarat'
      ],
      kunci: 'A',
      kelas: 'Kelas VIII'
    },
    {
      no: 13,
      tujuan: 'Mempraktikkan kombinasi dribbling dan shooting bola basket',
      materi: 'Bola Basket (Lay-up Shoot)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat menentukan jumlah langkah kaki yang diizinkan pada tembakan lay-up.',
      soal: 'Saat melakukan tembakan melayang (lay-up shoot) ke arah ring basket dari arah kanan, urutan langkah kaki yang sah menurut regulasi FIBA setelah menangkap bola dribble adalah...',
      opsi: [
        'A. Tiga langkah kaki cepat tanpa melompat',
        'B. Dua langkah berirama (kaki kanan - kaki kiri) dilanjutkan tolakan melompat satu kaki',
        'C. Berhenti dengan melompat dua kaki bersamaan lalu berjalan',
        'D. Empat langkah kaki zig-zag',
        'E. Bebas melangkah asalkan bola tidak terjatuh'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 14,
      tujuan: 'Menganalisis pola pertahanan zona dalam bola basket',
      materi: 'Bola Basket (Zone Defense 2-3)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menganalisis keunggulan formasi pertahanan zona 2-3.',
      soal: 'Formasi pertahanan daerah 2-3 (Zone Defense 2-3) dalam permainan bola basket sangat efektif digunakan untuk menghadapi tim lawan yang memiliki keunggulan...',
      opsi: [
        'A. Akurasi tembakan tiga angka (three-point shooter) yang sangat tinggi di luar busur',
        'B. Penyerang bertubuh jangkung yang mengandalkan serangan di area bawah ring (paint area / rebound)',
        'C. Kecepatan lari serangan balik cepat (fast break)',
        'D. Lemparan ke dalam (inbound pass)',
        'E. Dribble bola rendah di garis tengah lapangan'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 15,
      tujuan: 'Mempraktikkan teknik pergantian tongkat estafet',
      materi: 'Atletik (Lari Estafet 4x100 Meter)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat membedakan teknik pergantian tongkat visual dan non-visual.',
      soal: 'Pada nomor lari estafet 4x100 meter yang mengandalkan kecepatan sprint maksimal, teknik penerimaan tongkat estafet yang paling efektif digunakan oleh pelari kedua, ketiga, dan keempat adalah...',
      opsi: [
        'A. Cara visual (melihat ke belakang ke arah pemberi tongkat)',
        'B. Cara non-visual (tidak melihat ke belakang, tangan dijulurkan ke belakang sambil fokus berlari ke depan)',
        'C. Berhenti berlari hingga tongkat diserahkan',
        'D. Melempar tongkat melambung di udara',
        'E. Menoleh terus menerus ke belakang sambil memegang sepatu'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 16,
      tujuan: 'Menganalisis zona pergantian tongkat estafet',
      materi: 'Atletik (Peraturan Wessel Zone)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menganalisis konsekuensi pergantian tongkat di luar zona wesel.',
      soal: 'Dalam perlombaan lari estafet resmi, penyerahan tongkat dilakukan di luar batas zona pergantian (wessel zone) sepanjang 20 meter. Keputusan wasit juri yang tepat berdasarkan aturan PASI adalah...',
      opsi: [
        'A. Memberikan pengurangan nilai 5 poin',
        'B. Mendiskualifikasi tim estafet tersebut dari perlombaan',
        'C. Meminta perlombaan diulang dari awal',
        'D. Menambah catatan waktu 2 detik',
        'E. Mengizinkan tim melanjutkan hingga finish tanpa sanksi'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 17,
      tujuan: 'Mempraktikkan gerak senam lantai guling lenting',
      materi: 'Senam Lantai (Neck Spring / Guling Lenting)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat mengidentifikasi sumber tenaga lontaran tubuh saat lenting.',
      soal: '[Gambar: "Ilustrasi pesenam melakukan guling lenting: lecutan kedua kaki lurus ke depan atas dibantu dorongan tangan"]\n\nPerhatikan ilustrasi di atas! Gerakan guling lenting menghasilkan lontaran tubuh melenting ke depan atas hingga berdiri tegak. Sumber tenaga dorong utama berasal dari...',
      opsi: [
        'A. Hentakan tumit ke matras',
        'B. Ayunan dan lecutan kuat kedua kaki lurus ke depan atas bersamaan dengan tolakan kedua tangan pada matras',
        'C. Tarikan leher ke arah belakang',
        'D. Dorongan lutut yang ditekuk ke samping',
        'E. Jatuhnya berat badan ke bawah'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 18,
      tujuan: 'Menganalisis kesalahan gerak guling belakang',
      materi: 'Senam Lantai (Backward Roll)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menganalisis penyebab badan tertahan dan gagal berguling ke belakang.',
      soal: 'Saat melakukan guling belakang, Andi tidak mampu menggulingkan badannya melewati atas kepala dan tubuhnya tersangkut di matras. Penyebab teknis utama kegagalan Andi adalah...',
      opsi: [
        'A. Posisi kepala menengadah ke atas dan kedua tangan tidak diletakkan di samping telinga untuk menolak',
        'B. Kedua lutut dilipat rapat ke dada',
        'C. Matras yang digunakan terlalu tebal',
        'D. Andi membuang napas saat berguling',
        'E. Tumpuan tangan terlalu kuat mendorong'
      ],
      kunci: 'A',
      kelas: 'Kelas VIII'
    },
    {
      no: 19,
      tujuan: 'Mempraktikkan teknik gerakan kaki renang gaya dada',
      materi: 'Aktivitas Air (Renang Gaya Dada / Breaststroke)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat menjelaskan fase tendangan cambuk kaki renang gaya dada.',
      soal: 'Gerakan tungkai kaki pada renang gaya dada yang menghasilkan gaya dorong luncuran ke depan terbesar terjadi pada saat...',
      opsi: [
        'A. Kaki ditekuk mendekati pantat secara perlahan',
        'B. Kaki menendang melingkar keluar dan merapat lurus ke belakang dengan telapak kaki mencambuk air (whip kick)',
        'C. Kaki dikibaskan naik turun bergantian di permukaan air',
        'D. Kaki diam lurus kaku tanpa bergerak',
        'E. Kedua tumit dihentakkan ke dasar kolam'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 20,
      tujuan: 'Mempraktikkan teknik pernapasan renang gaya dada',
      materi: 'Aktivitas Air (Mekanika Pernapasan)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat menentukan waktu pengambilan napas renang gaya dada.',
      soal: 'Pengambilan napas (inhalasi) pada renang gaya dada dilakukan melalui mulut saat...',
      opsi: [
        'A. Kaki melakukan tendangan cambuk',
        'B. Kedua lengan membuka dan mendayung air ke samping bawah dada hingga kepala terangkat ke permukaan air',
        'C. Tubuh meluncur lurus diam di dalam air',
        'D. Seluruh badan tenggelam di bawah air',
        'E. Tangan menjulur lurus ke depan'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 21,
      tujuan: 'Menerapkan pertolongan pertama cedera olahraga metode RICE',
      materi: 'Kesehatan & P3K (Metode R.I.C.E.)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat menjelaskan tujuan pemberian kompres es pada cedera sprain.',
      soal: 'Tujuan utama penempelan kompres es (Ice) pada pergelangan kaki yang baru saja terkilir dan membengkak dalam 24-48 jam pertama adalah...',
      opsi: [
        'A. Memperlancar pendarahan agar darah kotor keluar',
        'B. Menyempitkan pembuluh darah (vasokonstriksi) guna meminimalisir pendarahan dalam dan pembengkakan',
        'C. Menghangatkan sendi agar otot rileks seketika',
        'D. Menghilangkan rasa haus pada korban',
        'E. Mensterilkan kulit dari kuman penyakit'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 22,
      tujuan: 'Menganalisis hal yang dilarang saat penanganan cedera (HARM)',
      materi: 'Kesehatan & P3K (Prinsip Anti-H.A.R.M.)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menganalisis bahaya pemijatan pada cedera otot akut.',
      soal: 'Memijat atau mengurut (Massage) bagian otot yang baru saja robek atau terkilir akut sangat DILARANG dalam medis olahraga karena...',
      opsi: [
        'A. Menurunkan suhu tubuh korban secara drastis',
        'B. Merobek lebih lanjut serat jaringan yang cedera dan memperluas pendarahan pembuluh kapiler',
        'C. Membuat korban merasa mengantuk',
        'D. Mengakibatkan tulang mengalami pembengkokan seketika',
        'E. Menghambat proses pertumbuhan tinggi badan'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 23,
      tujuan: 'Memahami pedoman gizi seimbang bagi remaja aktif',
      materi: 'Pola Hidup Sehat (Zat Gizi Makro)',
      level: 'C2 (Memahami)',
      indikator: 'Peserta didik dapat mengidentifikasi fungsi utama zat karbohidrat.',
      soal: 'Bagi seorang pelajar yang rutin berolahraga di sekolah, zat gizi makro yang menjadi sumber energi primer (bahan bakar utama) untuk aktivitas fisik adalah...',
      opsi: [
        'A. Karbohidrat kompleks (nasi merah, kentang, gandum)',
        'B. Vitamin larut lemak (A, D, E, K)',
        'C. Kalsium dan fosfor',
        'D. Kolesterol jahat (LDL)',
        'E. Natrium klorida'
      ],
      kunci: 'A',
      kelas: 'Kelas VIII'
    },
    {
      no: 24,
      tujuan: 'Menganalisis pencegahan penyakit menular seksual & pergaulan bebas',
      materi: 'Pendidikan Kesehatan Reproduksi Remaja',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menganalisis benteng utama perlindungan diri remaja.',
      soal: 'Langkah preventif paling mendasar bagi generasi muda untuk membentengi diri dari bahaya pergaulan bebas dan penyalahgunaan zat adiktif adalah...',
      opsi: [
        'A. Mengikuti ajakan kelompok sebaya tanpa menyaring informasinya',
        'B. Meningkatkan keimanan, memilih lingkungan pertemanan positif, dan aktif dalam kegiatan olahraga/ekskul',
        'C. Mengurung diri di dalam kamar tanpa bersosialisasi',
        'D. Mencoba zat baru agar dianggap modern oleh teman',
        'E. Menghindari segala bentuk informasi tentang kesehatan reproduksi'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 25,
      tujuan: 'Mempraktikkan gerak spesifik servis bulu tangkis',
      materi: 'Bulu Tangkis (Short & Long Service)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat menentukan batas ketinggian perkenaan raket saat servis bulu tangkis.',
      soal: 'Menurut regulasi resmi BWF, pada saat kepala raket memukul shuttlecock pada servis pendek nomor ganda, titik kontak shuttlecock tidak boleh melebihi ketinggian...',
      opsi: [
        'A. Di atas bahu server',
        'B. 1,15 meter dari permukaan lapangan (di bawah tulang rusuk terbawah)',
        'C. Setinggi net bulu tangkis (1,55 meter)',
        'D. Di bawah mata kaki',
        'E. Bebas asalkan raket tidak menyentuh net'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 26,
      tujuan: 'Menganalisis pukulan smash bulu tangkis',
      materi: 'Bulu Tangkis (Forehand Smash)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menganalisis lintasan bola hasil pukulan smash.',
      soal: 'Karakteristik lintasan laju shuttlecock yang dihasilkan dari pukulan smash penuh yang akurat adalah...',
      opsi: [
        'A. Melambung tinggi jauh ke garis batas belakang lawan',
        'B. Menukik tajam dan keras ke arah lantai bidang lapangan lawan',
        'C. Bergulir tipis di bibir net (netting)',
        'D. Mendatar sejajar net (drive)',
        'E. Melengkung pelan jatuh tepat di depan net'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 27,
      tujuan: 'Mempraktikkan pola latihan sirkuit kebugaran',
      materi: 'Kebugaran Jasmani (Circuit Training)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat menyusun urutan pos latihan sirkuit yang seimbang.',
      soal: 'Dalam penyusunan latihan sirkuit (circuit training) 4 pos, urutan stasiun latihan yang baik untuk menghindari kelelahan otot lokal yang terlalu cepat adalah...',
      opsi: [
        'A. Pos 1 Push Up, Pos 2 Pull Up, Pos 3 Bicep Curl, Pos 4 Handstand (seluruhnya otot lengan)',
        'B. Pos 1 Push Up (otot tubuh atas), Pos 2 Squat Jump (otot tungkai), Pos 3 Sit Up (otot perut), Pos 4 Shuttle Run (kelincahan/kardio)',
        'C. Pos 1 Lari 1000m, Pos 2 Lari 800m, Pos 3 Lari 400m, Pos 4 Sprint',
        'D. Pos 1 Istirahat, Pos 2 Duduk santai, Pos 3 Tidur, Pos 4 Berdiri',
        'E. Mengulang gerakan squat jump di seluruh pos'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 28,
      tujuan: 'Menganalisis komponen kelenturan tubuh',
      materi: 'Kebugaran Jasmani (Sit and Reach Test)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menganalisis fungsi tes duduk menjangkau.',
      soal: 'Alat ukur Sit and Reach Box pada tes kebugaran jasmani Indonesia (TKJI) digunakan untuk mengukur tingkat kelenturan (fleksibilitas) pada bagian...',
      opsi: [
        'A. Otot leher dan tengkuk',
        'B. Otot punggung bawah dan paha bagian belakang (hamstring)',
        'C. Otot pergelangan tangan',
        'D. Otot dada dan bahu depan',
        'E. Kekuatan jari-jari kaki'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 29,
      tujuan: 'Mempraktikkan pola penyerangan fast break',
      materi: 'Sepak Bola / Futsal (Serangan Balik Cepat)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat menentukan kunci keberhasilan serangan balik cepat.',
      soal: 'Kunci utama efektivitas taktik serangan balik cepat (fast break / counter attack) dalam permainan sepak bola maupun futsal adalah...',
      opsi: [
        'A. Menguasai bola selama mungkin di lini pertahanan sendiri',
        'B. Transisi cepat dari bertahan ke menyerang dengan operan langsung ke ruang kosong sebelum lawan merapikan pertahanan',
        'C. Meminta seluruh pemain mundur ke kotak penalti',
        'D. Menggiring bola secara individu melewati lima pemain lawan',
        'E. Menendang bola keluar lapangan agar pertandingan berhenti'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },
    {
      no: 30,
      tujuan: 'Menganalisis aturan offside dalam sepak bola',
      materi: 'Sepak Bola (Law 11 - Offside)',
      level: 'C4 (Menganalisis)',
      indikator: 'Disajikan skema posisi pemain, peserta didik dapat menentukan status offside.',
      soal: 'Seorang penyerang berada dalam posisi offside apabila pada saat bola dioperkan kepadanya oleh rekan setim, posisinya...',
      opsi: [
        'A. Berada di daerah lapangannya sendiri',
        'B. Lebih dekat ke garis gawang lawan daripada bola dan pemain bertahan kedua terakhir lawan',
        'C. Sejajar dengan pemain bertahan terakhir lawan',
        'D. Menerima bola langsung dari lemparan ke dalam (throw-in)',
        'E. Menerima bola langsung dari tendangan sudut (corner kick)'
      ],
      kunci: 'B',
      kelas: 'Kelas VIII'
    },

    // --- KELAS 9 / TAHAP AKHIR JENJANG (Nomor 31 - 50) ---
    {
      no: 31,
      tujuan: 'Merancang pola penyerangan permainan bola voli 6 lawan 6',
      materi: 'Bola Voli (Pola Penyerangan Sistem 4Sm-2Su)',
      level: 'C5 (Mengevaluasi)',
      indikator: 'Peserta didik dapat mengevaluasi keunggulan sistem penyerangan 4 Smoker - 2 Setter.',
      soal: 'Dalam pertandingan bola voli tingkat SMP, sebuah regu menerapkan sistem formasi penyerangan 4Sm - 2Su (4 Spiker dan 2 Setter/Tosser). Keunggulan taktis dari sistem formasi ini adalah...',
      opsi: [
        'A. Di garis depan selalu terdapat 3 setter sekaligus',
        'B. Di setiap posisi rotasi lapangan selalu tersedia minimal 2 spiker dan 1 setter di barisan depan',
        'C. Tidak membutuhkan pemain libero bertahan',
        'D. Seluruh pemain tidak perlu melakukan rotasi posisi',
        'E. Servis hanya dilakukan oleh setter'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 32,
      tujuan: 'Merancang pola pertahanan terhadap smash lawan',
      materi: 'Bola Voli (Sistem Pertahanan Bendungan / Block)',
      level: 'C5 (Mengevaluasi)',
      indikator: 'Peserta didik dapat menentukan strategi blok ganda (double block).',
      soal: 'Ketika lawan memiliki spiker bertubuh tinggi dengan pukulan smash lurus yang sangat keras, taktik pertahanan di depan net yang paling tepat diterapkan adalah...',
      opsi: [
        'A. Membiarkan spiker memukul tanpa dihadang',
        'B. Menerapkan bendungan ganda (double block) oleh middle blocker bersama outside hitter dengan timing melompat bersamaan',
        'C. Seluruh pemain mundur ke garis belakang lapangan',
        'D. Tosser berdiri di belakang wasit',
        'E. Meminta waktu istirahat secara terus-menerus'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 33,
      tujuan: 'Mengevaluasi peran pemain Libero dalam bola voli',
      materi: 'Bola Voli (Regulasi Khusus Libero)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat mengidentifikasi pembatasan aturan bagi pemain Libero.',
      soal: 'Pemain berposisi Libero mengenakan warna seragam yang kontras dengan rekan setimnya. Tindakan berikut yang DILARANG dilakukan oleh seorang Libero menurut regulasi resmi FIVB adalah...',
      opsi: [
        'A. Menggantikan pemain baris belakang saat bola mati',
        'B. Melakukan servis, membendung bola (block), atau melakukan pukulan serang (smash) saat bola berada di atas net',
        'C. Melakukan passing bawah di area belakang lapangan',
        'D. Memberikan operan kepada tosser dari belakang garis serang',
        'E. Berkomunikasi dengan kapten regu'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 34,
      tujuan: 'Menganalisis teknik tolak peluru gaya menyamping (Ortodoks)',
      materi: 'Atletik (Tolak Peluru Gaya Ortodoks)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menganalisis sudut tolakan peluru yang menghasilkan jarak terjauh.',
      soal: '[Gambar: "Bagan sudut elevasi pelepasan tolak peluru pada lingkaran tolakan"]\n\nPerhatikan bagan tolakan peluru di atas! Berdasarkan prinsip kinematika proyektil, sudut elevasi pelepasan peluru yang paling ideal untuk menghasilkan jarak tolakan terjauh adalah berkisar antara...',
      opsi: [
        'A. 15 - 25 derajat',
        'B. 40 - 45 derajat',
        'C. 70 - 80 derajat',
        'D. 90 derajat tegak lurus',
        'E. Kurang dari 10 derajat menyusur tanah'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 35,
      tujuan: 'Menganalisis teknik tolak peluru gaya membelakangi (O’Brien)',
      materi: 'Atletik (Tolak Peluru Gaya O’Brien)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat membedakan keuntungan gaya O’Brien dibanding Ortodoks.',
      soal: 'Keunggulan utama teknik tolak peluru gaya membelakangi sektor lemparan (gaya O’Brien / glide) dibandingkan gaya menyamping (ortodoks) adalah...',
      opsi: [
        'A. Peluru terasa lebih ringan saat dipegang di leher',
        'B. Menambah panjang lintasan akselerasi luncuran tubuh sehingga menghasilkan kecepatan awal (kecepatan pelepasan) yang lebih besar',
        'C. Boleh melempar peluru seperti bola kasti',
        'D. Tidak memerlukan papan balok penahan kaki',
        'E. Area lingkaran tolakan menjadi dua kali lebih luas'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 36,
      tujuan: 'Mempraktikkan keterampilan lompat jauh gaya lenting / menggantung',
      materi: 'Atletik (Lompat Jauh Gaya Menggantung / Schnepper)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat menentukan sikap badan saat melayang di udara.',
      soal: 'Ciri khas utama sikap tubuh di udara pada lompat jauh gaya menggantung (schnepper / hang style) adalah...',
      opsi: [
        'A. Badan jongkok membulat seperti duduk di kursi',
        'B. Tubuh dibusurkan melenting ke belakang dengan kedua lengan terangkat ke atas dan kedua kaki ditarik ke belakang panggul',
        'C. Kaki digerakkan melangkah berjalan di udara seperti mengayuh sepeda',
        'D. Menjatuhkan badan ke samping kiri',
        'E. Kepala menunduk memegang lutut'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 37,
      tujuan: 'Menganalisis pendaratan yang aman pada lompat jauh',
      materi: 'Atletik (Fase Pendaratan Lompat Jauh)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menganalisis cara pendaratan yang menghindari diskualifikasi dan cedera.',
      soal: 'Saat mendarat di bak pasir lompat jauh, atlet menjatuhkan kedua tangannya ke belakang menyentuh pasir di belakang tumit. Dampak dari pendaratan tersebut terhadap hasil pengukuran jarak lompatan adalah...',
      opsi: [
        'A. Lompatan dinyatakan sah dan diukur dari ujung jari tangan terdepan',
        'B. Jarak lompatan diukur dari jejak bekas tangan yang paling belakang mendekati papan tumpuan, sehingga hasil lompatan rugi memendek',
        'C. Lompatan otomatis dibatalkan atau diskualifikasi',
        'D. Ditambahkan bonus jarak 50 cm',
        'E. Wasit meminta lompatan diulang kembali'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 38,
      tujuan: 'Merancang rangkaian senam lantai kombinasi',
      materi: 'Senam Lantai (Rangkaian Kombinasi Roll & Lenting)',
      level: 'C5 (Mengevaluasi)',
      indikator: 'Peserta didik dapat mengevaluasi kelancaran transisi gerak dalam rangkaian senam.',
      soal: 'Seorang pesenam merangkai gerakan: Awalan lari kecil -> Guling Depan -> langsung dilanjutkan Guling Lenting -> Mendarat berdiri tegak. Faktor penentu keindahan dan keberhasilan rangkaian senam tersebut adalah...',
      opsi: [
        'A. Berhenti diam selama 5 detik di antara setiap gerakan',
        'B. Kontinuitas (kelancaran alur gerak tanpa jeda terputus), kelenturan, dan ketepatan pendaratan seimbang',
        'C. Menggunakan matras sebanyak 10 lembar bertumpuk',
        'D. Berteriak keras saat berguling',
        'E. Melakukan gerakan secepat mungkin tanpa memedulikan teknik'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 39,
      tujuan: 'Menganalisis gerak senam ritmik / aerobik',
      materi: 'Aktivitas Gerak Berirama (Senam Aerobik)',
      level: 'C3 (Menerapkan)',
      indikator: 'Peserta didik dapat membedakan gerakan langkah kaki V-Step.',
      soal: 'Pada senam aerobik, gerakan melangkahkan kaki membentuk pola segitiga atau huruf V ke arah depan (kanan depan, kiri depan, kembali ke titik awal) disebut dengan langkah...',
      opsi: [
        'A. Heel Touch',
        'B. V-Step (Easy Walk)',
        'C. Grapevine',
        'D. Single Step',
        'E. Jumping Jack'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 40,
      tujuan: 'Mempraktikkan teknik keselamatan diri dan orang lain di air',
      materi: 'Aktivitas Air (Penyelamatan Kecelakaan Air / Water Rescue)',
      level: 'C5 (Mengevaluasi)',
      indikator: 'Peserta didik dapat menentukan urutan metode penyelamatan korban tenggelam (Reach, Throw, Row, Go).',
      soal: 'Ketika melihat seseorang berteriak panik meminta tolong karena tenggelam di kolam renang dalam, urutan tindakan pertolongan pertama yang paling aman bagi penolong non-profesional adalah...',
      opsi: [
        'A. Langsung terjun memeluk korban dari arah depan',
        'B. Menerapkan prinsip Reach (menjangkau dengan galah/tangan) atau Throw (melempar ban pelampung bertali), tanpa langsung mencebur jika belum terlatih',
        'C. Menunggu hingga korban tidak bergerak',
        'D. Memotret kejadian menggunakan ponsel',
        'E. Melempar batu besar ke arah korban'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 41,
      tujuan: 'Merancang program kebugaran jasmani pribadi terukur',
      materi: 'Kebugaran Jasmani (Prinsip F.I.T.T.)',
      level: 'C6 (Mencipta / Merancang)',
      indikator: 'Peserta didik dapat merumuskan kepanjangan dan aplikasi prinsip F.I.T.T.',
      soal: 'Dalam merancang program latihan fisik kebugaran mandiri yang ilmiah dan aman, seorang siswa harus mempedomani prinsip F.I.T.T., yaitu singkatan dari...',
      opsi: [
        'A. Fast, Intense, Tough, Training',
        'B. Frequency, Intensity, Time, Type',
        'C. Fitness, Indoor, Target, Technique',
        'D. Force, Impact, Track, Timing',
        'E. Flexibility, Interval, Test, Team'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 42,
      tujuan: 'Menganalisis konsep beban lebih (Overload Principle)',
      materi: 'Kebugaran Jasmani (Prinsip Pelatihan Fisiologis)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menerapkan prinsip progresif beban lebih.',
      soal: 'Prinsip overload (beban lebih progresif) dalam pembinaan kebugaran jasmani menyatakan bahwa adaptasi peningkatan kekuatan otot hanya akan terjadi apabila...',
      opsi: [
        'A. Beban latihan selalu dibuat sangat ringan agar tidak lelah',
        'B. Beban latihan ditingkatkan secara bertahap melebihi kapasitas beban harian biasa yang diterima tubuh',
        'C. Latihan dilakukan 7 hari berturut-turut tanpa istirahat',
        'D. Siswa tidak mengonsumsi air minum saat berlatih',
        'E. Latihan hanya dilakukan satu bulan sekali'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 43,
      tujuan: 'Menganalisis Indeks Massa Tubuh (IMT / BMI)',
      materi: 'Pola Hidup Sehat (Pengukuran Status Gizi IMT)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menghitung dan mengkategorikan IMT siswa.',
      soal: 'Dimas memiliki berat badan 60 kg dan tinggi badan 160 cm (1,6 m). Rumus IMT = Berat Badan (kg) / [Tinggi Badan (m)]^2. Nilai IMT Dimas adalah 60 / (1,6 x 1,6) = 23,43 kg/m2. Berdasarkan standar Kemenkes RI, status gizi Dimas tergolong...',
      opsi: [
        'A. Kurus tingkat berat',
        'B. Berat badan normal / ideal',
        'C. Kelebihan berat badan tingkat berat (Obesitas)',
        'D. Gizi buruk',
        'E. Sangat kurus'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 44,
      tujuan: 'Menganalisis bahaya zat adiktif NAPZA dan Minuman Keras',
      materi: 'Pendidikan Kesehatan (Bahaya Narkoba & Alkohol)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menganalisis efek depresan zat narkotika terhadap sistem saraf pusat.',
      soal: 'Golongan zat adiktif yang memiliki efek depresan bekerja menekan sistem saraf pusat tubuh. Dampak langsung yang dialami seseorang saat mengonsumsi depresan dosis berlebih adalah...',
      opsi: [
        'A. Detak jantung meningkat sangat cepat dan halusinasi aktif',
        'B. Penurunan kesadaran, melambatnya denyut jantung dan frekuensi napas hingga risiko gagal napas / koma',
        'C. Daya konsentrasi belajar meningkat pesat',
        'D. Peningkatan nafsu makan dan kebugaran jasmani',
        'E. Suhu tubuh meningkat drastis'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 45,
      tujuan: 'Mengevaluasi penanganan cedera kram otot saat olahraga',
      materi: 'Pertolongan Pertama (Kram Otot / Muscle Cramp)',
      level: 'C5 (Mengevaluasi)',
      indikator: 'Peserta didik dapat menentukan tindakan yang benar saat rekan mengalami kram otot betis.',
      soal: 'Saat berlari pada menit akhir pertandingan sepak bola, otot betis (gastrocnemius) Rian tiba-tiba berkontraksi hebat, kaku, dan terasa sangat nyeri (kram otot). Pertolongan pertama yang benar dan efektif adalah...',
      opsi: [
        'A. Memaksa Rian untuk terus melompat-lompat di lapangan',
        'B. Meluruskan lutut kaki Rian secara perlahan dan meregangkan telapak kakinya ke arah atas (dorsofleksi) untuk memanjangkan otot betis',
        'C. Memukul betis Rian menggunakan benda keras',
        'D. Menyiram air panas mendidih ke atas betis',
        'E. Mengikat pergelangan kaki dengan tali tambang kencang'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 46,
      tujuan: 'Menganalisis peran hidrasi dan elektrolit pada pencegahan dehidrasi',
      materi: 'Fisiologi Olahraga (Manajemen Hidrasi Tubuh)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat menganalisis pentingnya konsumsi cairan berelektrolit saat olahraga intensif.',
      soal: 'Keringat yang keluar dalam jumlah banyak saat berolahraga di bawah terik matahari tidak hanya membuang air, melainkan juga ion elektrolit penting seperti...',
      opsi: [
        'A. Minyak jenuh dan kolesterol',
        'B. Natrium, kalium, dan klorida yang berperan penting dalam transmisi impuls saraf dan kontraksi otot',
        'C. Zat besi dan hemoglobin',
        'D. Protein albumin murni',
        'E. Asam laktat beku'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 47,
      tujuan: 'Mengevaluasi etika fair play dan sportivitas olahraga',
      materi: 'Pengembangan Karakter (Fair Play & Sportivitas)',
      level: 'C5 (Mengevaluasi)',
      indikator: 'Disajikan dilema pertandingan, peserta didik dapat memilih sikap yang menjunjung tinggi fair play.',
      soal: 'Dalam sebuah pertandingan final antarkelas, wasit tidak melihat bahwa bola smash lawan ternyata menyentuh ujung jari (touch ball) tanganmu sebelum keluar lapangan. Lawan memprotes tetapi wasit menunjuk bola keluar untuk timmu. Sikap yang mencerminkan sportivitas sejati (fair play) adalah...',
      opsi: [
        'A. Berpura-pura tidak tahu dan merayakan poin bersama rekan tim',
        'B. Mengakui secara jujur kepada wasit bahwa bola telah menyentuh jarimu (mengakui touch ball)',
        'C. Mengejek pemain lawan yang sedang memprotes wasit',
        'D. Meminta penonton bersorak mencemooh lawan',
        'E. Sengaja membuang bola servis berikutnya ke luar lapangan tanpa izin'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 48,
      tujuan: 'Menganalisis pencegahan penyakit tidak menular (PTM)',
      materi: 'Kesehatan Masyarakat (Gaya Hidup Sehat Preventif)',
      level: 'C4 (Menganalisis)',
      indikator: 'Peserta didik dapat mengidentifikasi program CERDIK Kemenkes RI.',
      soal: 'Kementerian Kesehatan RI mengampanyekan perilaku CERDIK untuk mencegah penyakit tidak menular (hipertensi, diabetes, stroke). Huruf "E" dan "R" dalam akronim CERDIK berturut-turut merupakan singkatan dari...',
      opsi: [
        'A. E-Sport dan Rehat',
        'B. Enyahkan asap rokok dan Rajin aktivitas fisik',
        'C. Edukasi dan Relaksasi',
        'D. Emosi stabil dan Rekreasi',
        'E. Evaluasi diri dan Rawat inap'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 49,
      tujuan: 'Merancang pola hidup sehat jangka panjang',
      materi: 'Aktivitas Fisik Sepanjang Hayat (Lifelong Physical Activity)',
      level: 'C6 (Mencipta)',
      indikator: 'Peserta didik dapat merumuskan rekomendasi durasi aktivitas jasmani remaja menurut WHO.',
      soal: 'Menurut rekomendasi Badan Kesehatan Dunia (WHO), durasi minimal aktivitas fisik intensitas sedang hingga berat (aerobik) yang dianjurkan bagi anak dan remaja usia sekolah adalah...',
      opsi: [
        'A. 10 menit seminggu sekali',
        'B. Minimal 60 menit setiap hari secara akumulatif',
        'C. 5 jam nonstop di akhir pekan saja',
        'D. Cukup duduk bersandar di kursi selama 30 menit',
        'E. 15 menit setiap bulan'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    },
    {
      no: 50,
      tujuan: 'Mengevaluasi dampak olahraga terhadap kesehatan mental remaja',
      materi: 'Kesehatan Mental (Hormon Endorfin & Kebugaran Jiwa)',
      level: 'C5 (Mengevaluasi)',
      indikator: 'Peserta didik dapat menjelaskan pengaruh pelepasan hormon endorfin saat berolahraga teratur.',
      soal: 'Aktivitas jasmani yang teratur terbukti secara ilmiah mampu meredakan stres dan kecemasan pada remaja. Salah satu mekanisme biologis yang menyebabkannya adalah pelepasan hormon...',
      opsi: [
        'A. Hormon insulin yang memicu rasa lapar',
        'B. Hormon endorfin dan dopamin yang memicu rasa bahagia, rileks, dan meningkatkan suasana hati (mood positif)',
        'C. Hormon tiroksin yang memicu rasa lelah',
        'D. Gas karbon monoksida di paru-paru',
        'E. Asam lambung berlebih'
      ],
      kunci: 'B',
      kelas: 'Kelas IX'
    }
  ];

  const slicedItems = baseItems.slice(0, targetSoalCount);
  const kisiKisi: any[] = slicedItems.map((item, idx) => {
    const { finalOptions, newKey } = adaptOptions(item.opsi, item.kunci, targetOpsiCount);
    return {
      no: idx + 1,
      tujuanPembelajaran: item.tujuan,
      ruangLingkupMateri: item.materi,
      levelKognitif: item.level,
      indikatorSoal: item.indikator,
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: idx + 1,
      naskahSoal: item.soal,
      pilihanJawaban: finalOptions,
      kunciJawaban: newKey,
      skor: 1,
      tingkatKelas: item.kelas
    };
  });

  const kunciJawabanList = kisiKisi.map(k => ({
    nomorSoal: k.nomorSoal,
    kunci: k.kunciJawaban,
    materi: k.ruangLingkupMateri
  }));

  const optionsPromptLabel = letterLabels.join(', ');

  return {
    identitas: {
      namaSekolah,
      mataPelajaran,
      kelasAkhir,
      jenjang,
      tahunPelajaran,
      alokasiWaktu,
      jumlahSoal: targetSoalCount,
      jumlahOpsi: targetOpsiCount,
      penyusun,
      nipPenyusun,
      kepalaSekolah,
      nipKepalaSekolah,
      versiPrompt
    },
    tujuanPembelajaranInput: {
      versi: versiPrompt,
      teksUmum: tujuanUmum,
      tujuanKelasAwal: tujuanKelas7,
      tujuanKelasTengah: tujuanKelas8,
      tujuanKelasAkhir: tujuanKelas9
    },
    kisiKisi,
    petunjukPengerjaan: [
      'Berdoalah sebelum memulai mengerjakan soal sesuai agama dan keyakinan masing-masing.',
      'Tuliskan identitas diri (Nomor Peserta, Nama Lengkap, dan Kelas) secara lengkap pada Lembar Jawaban Ujian (LJU).',
      'Periksa dan bacalah setiap butir soal dengan teliti sebelum Anda menentukan pilihan jawaban.',
      `Pilihlah salah satu jawaban yang paling tepat dengan menghitamkan atau memberi tanda silang (X) pada huruf ${optionsPromptLabel} di lembar jawaban.`,
      'Dahulukan menjawab soal-soal yang Anda anggap paling mudah.',
      'Periksa kembali seluruh pekerjaan Anda secara cermat sebelum diserahkan kepada pengawas ujian.'
    ],
    kunciJawabanList,
    pedomanPenskoran: {
      skorMaksimal: targetSoalCount,
      rumusNilaiAkhir: `Nilai Akhir = (Total Skor Perolehan / ${targetSoalCount}) x 100`
    }
  };
}

// 16. Endpoint Generate Ujian Sekolah / Madrasah (US/UM)
app.post('/api/generate-ujian-sekolah', async (req, res) => {
  try {
    const {
      mataPelajaran = 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
      kelasAkhir = 'IX (Sembilan)',
      jenjang = 'SMP/MTs',
      namaSekolah = 'SD Negeri Kalimantong',
      tahunPelajaran = '2026/2027',
      alokasiWaktu = '120 Menit',
      versiPrompt = 'versi_2',
      tujuanUmum = '',
      tujuanKelas7 = '',
      tujuanKelas8 = '',
      tujuanKelas9 = '',
      jumlahOpsi = 5,
      jumlahSoal = 50
    } = req.body || {};

    const optCount = Math.min(Math.max(Number(jumlahOpsi) || 5, 3), 5);
    const qCount = Math.min(Math.max(Number(jumlahSoal) || 50, 10), 50);
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, optCount).join(', ');

    const promptText = versiPrompt === 'versi_1'
      ? `PROMPT SOAL UJIAN SEKOLAH/MADRASAH VERSI 1
Anda adalah Guru mata pelajaran ${mataPelajaran} kelas ${kelasAkhir} yang sedang menyusun Ujian Sekolah/Madrasah (US/UM).
Tujuan Pembelajaran: ${tujuanUmum || 'Mempraktikkan dan menganalisis seluruh kompetensi PJOK satu jenjang'}
Total ${qCount} butir soal Pilihan Ganda (${optCount} opsi: ${letters}) dominan C3-C5.`
      : `PROMPT SOAL UJIAN SEKOLAH/MADRASAH VERSI 2
Anda adalah Guru mata pelajaran ${mataPelajaran} kelas ${kelasAkhir} yang sedang menyusun Ujian Sekolah/Madrasah (US/UM).
Tujuan Kelas 7: ${tujuanKelas7 || 'Teknik dasar passing voli, sprint, dan kebugaran jasmani dasar'}
Tujuan Kelas 8: ${tujuanKelas8 || 'Servis/smash voli, estafet, guling lenting, renang dada, P3K cedera RICE'}
Tujuan Kelas 9: ${tujuanKelas9 || 'Taktik 6v6 bola voli, tolak peluru, lompat jauh, program kebugaran FITT, gaya hidup sehat'}
Total ${qCount} butir soal Pilihan Ganda (${optCount} opsi: ${letters}) dominan C3-C5.`;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: promptText,
      config: {
        systemInstruction: `Anda adalah pakar penyusun instrumen evaluasi akhir jenjang Ujian Sekolah/Madrasah (US/UM) Kementerian Agama dan Kemendikbudristek RI. Susunlah ${qCount} butir soal pilihan ganda dengan masing-masing ${optCount} pilihan jawaban (${letters}) lengkap dengan stimulus bacaan/gambar, kisi-kisi 11 kolom, dan tabel kunci jawaban dalam format JSON valid.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identitas: {
              type: Type.OBJECT,
              properties: {
                namaSekolah: { type: Type.STRING },
                mataPelajaran: { type: Type.STRING },
                kelasAkhir: { type: Type.STRING },
                tahunPelajaran: { type: Type.STRING },
                alokasiWaktu: { type: Type.STRING },
                jumlahSoal: { type: Type.INTEGER },
                jumlahOpsi: { type: Type.INTEGER }
              },
              required: ['namaSekolah', 'mataPelajaran', 'kelasAkhir']
            },
            petunjukPengerjaan: { type: Type.ARRAY, items: { type: Type.STRING } },
            kisiKisi: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  no: { type: Type.INTEGER },
                  tujuanPembelajaran: { type: Type.STRING },
                  ruangLingkupMateri: { type: Type.STRING },
                  levelKognitif: { type: Type.STRING },
                  indikatorSoal: { type: Type.STRING },
                  bentukSoal: { type: Type.STRING },
                  nomorSoal: { type: Type.INTEGER },
                  naskahSoal: { type: Type.STRING },
                  pilihanJawaban: { type: Type.ARRAY, items: { type: Type.STRING } },
                  kunciJawaban: { type: Type.STRING },
                  skor: { type: Type.INTEGER },
                  tingkatKelas: { type: Type.STRING }
                },
                required: ['no', 'tujuanPembelajaran', 'ruangLingkupMateri', 'bentukSoal', 'nomorSoal', 'naskahSoal', 'pilihanJawaban', 'kunciJawaban', 'skor']
              }
            },
            pedomanPenskoran: {
              type: Type.OBJECT,
              properties: {
                skorMaksimal: { type: Type.INTEGER },
                rumusNilaiAkhir: { type: Type.STRING }
              }
            }
          },
          required: ['identitas', 'kisiKisi']
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon teks dari model AI.');
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.info('[AI Generator] Using offline template for Ujian Sekolah (US/UM):', error?.message || error);
    const fallback = getFallbackUjianSekolah(req.body);
    res.json(fallback);
  }
});




// Serve Vite dev server or static dist directory
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SADAR PJOK Full-Stack Server running on http://localhost:${PORT}`);
  });
}

if (
  !process.env.VERCEL &&
  !process.env.NETLIFY &&
  !process.env.AWS_LAMBDA_FUNCTION_NAME &&
  !process.env.LAMBDA_TASK_ROOT
) {
  startServer();
}

export default app;
