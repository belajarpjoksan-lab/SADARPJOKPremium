import { ProsemData, ProsemSemesterData, ProsemRow, ProsemMonthData, ProsemWeekValue } from '../types';

export const STORAGE_KEY_PROSEM = 'perangkat_ajar_prosem_data_v2';

// ----------------------------------------------------
// DEFAULT MONTH HEADERS
// ----------------------------------------------------
export const DEFAULT_MONTHS_GANJIL = [
  { monthName: 'Juli', totalWeeks: 4, nonEffectiveWeeks: [1, 2] },      // W1 Libur Smt, W2 MPLS
  { monthName: 'Agustus', totalWeeks: 5, nonEffectiveWeeks: [3] },    // W3 HUT RI
  { monthName: 'September', totalWeeks: 4, nonEffectiveWeeks: [3] },  // W3 STS Ganjil
  { monthName: 'Oktober', totalWeeks: 4, nonEffectiveWeeks: [] },     // Full efektif
  { monthName: 'November', totalWeeks: 4, nonEffectiveWeeks: [] },    // Full efektif
  { monthName: 'Desember', totalWeeks: 5, nonEffectiveWeeks: [1, 2, 4, 5] } // W1-2 SAS, W4-5 Libur Smt 1
];

export const DEFAULT_MONTHS_GENAP = [
  { monthName: 'Januari', totalWeeks: 4, nonEffectiveWeeks: [1] },    // W1 Awal Smt 2
  { monthName: 'Februari', totalWeeks: 4, nonEffectiveWeeks: [] },    // Full efektif
  { monthName: 'Maret', totalWeeks: 4, nonEffectiveWeeks: [2] },      // W2 STS Genap / Ramadhan
  { monthName: 'April', totalWeeks: 5, nonEffectiveWeeks: [2, 3] },   // W2-3 Idul Fitri
  { monthName: 'Mei', totalWeeks: 4, nonEffectiveWeeks: [] },         // Full efektif
  { monthName: 'Juni', totalWeeks: 5, nonEffectiveWeeks: [1, 2, 4, 5] } // W1-2 SAT, W4-5 Libur Akhir Tahun
];

/**
 * Helper to build empty weeks grid for a row based on monthsHeader
 */
export function createEmptyMonthData(monthsHeader: { monthName: string; totalWeeks: number; nonEffectiveWeeks: number[] }[]): ProsemMonthData[] {
  return monthsHeader.map(mh => ({
    monthName: mh.monthName,
    weeks: Array.from({ length: mh.totalWeeks }, (_, wIdx) => {
      const wNum = wIdx + 1;
      const isNonEff = mh.nonEffectiveWeeks.includes(wNum);
      return {
        weekNum: wNum,
        value: '',
        isEffective: !isNonEff
      };
    })
  }));
}

/**
 * Helper to populate scheduled hours sequentially across effective weeks
 */
export function autoScheduleSemesterRows(
  rows: ProsemRow[],
  monthsHeader: { monthName: string; totalWeeks: number; nonEffectiveWeeks: number[] }[],
  jpPerMinggu: number = 4
): ProsemRow[] {
  // Collect all effective slots in order (monthIndex, weekIndex)
  interface Slot {
    mIdx: number;
    wIdx: number;
    wNum: number;
    monthName: string;
  }
  const effectiveSlots: Slot[] = [];

  monthsHeader.forEach((mh, mIdx) => {
    for (let w = 1; w <= mh.totalWeeks; w++) {
      if (!mh.nonEffectiveWeeks.includes(w)) {
        effectiveSlots.push({
          mIdx,
          wIdx: w - 1,
          wNum: w,
          monthName: mh.monthName
        });
      }
    }
  });

  let currentSlotIndex = 0;

  return rows.map((row) => {
    // Determine how many weeks this row needs based on alokasiWaktu
    const match = row.alokasiWaktu.match(/(\d+)\s*JP/i) || row.alokasiWaktu.match(/^(\d+)/);
    const totalJp = match ? parseInt(match[1], 10) : 4;
    const weeksNeeded = Math.max(1, Math.ceil(totalJp / jpPerMinggu));

    // Create fresh months structure
    const updatedMonths: ProsemMonthData[] = createEmptyMonthData(monthsHeader);

    // Fill scheduled weeks
    for (let i = 0; i < weeksNeeded; i++) {
      if (currentSlotIndex < effectiveSlots.length) {
        const slot = effectiveSlots[currentSlotIndex];
        // Target month and week
        const targetMonth = updatedMonths[slot.mIdx];
        if (targetMonth && targetMonth.weeks[slot.wIdx]) {
          targetMonth.weeks[slot.wIdx].value = `${jpPerMinggu}`;
        }
        currentSlotIndex++;
      }
    }

    return {
      ...row,
      months: updatedMonths
    };
  });
}

// ----------------------------------------------------
// PRESET KELAS 5 (FASE C) - KURIKULUM MERDEKA PJOK
// ----------------------------------------------------
const rawRowsGanjilKelas5: ProsemRow[] = [
  {
    no: '1.1',
    bab: 'Bab 1: Permainan Invasi',
    topik: 'Variasi dan Kombinasi Menendang & Menghentikan Bola Sepak',
    pertemuanKe: '1 - 3',
    alokasiWaktu: '12 JP',
    months: []
  },
  {
    no: '1.2',
    bab: 'Bab 2: Permainan Net',
    topik: 'Pola Gerak Dasar Passing Bawah & Passing Atas Bola Voli Mini',
    pertemuanKe: '4 - 6',
    alokasiWaktu: '12 JP',
    months: []
  },
  {
    no: '1.3',
    bab: 'Bab 3: Permainan Lapangan',
    topik: 'Variasi Melempar, Menangkap, & Memukul Bola Kasti',
    pertemuanKe: '7 - 9',
    alokasiWaktu: '12 JP',
    months: []
  },
  {
    no: 'STS',
    bab: 'Sumatif Tengah Semester',
    topik: 'Asesmen Sumatif Tengah Semester 1 (STS Ganjil)',
    pertemuanKe: '10',
    alokasiWaktu: '4 JP',
    months: []
  },
  {
    no: '1.4',
    bab: 'Bab 4: Kebugaran Jasmani',
    topik: 'Latihan Sirkuit Kebugaran Daya Tahan Jantung & Kekuatan Otot',
    pertemuanKe: '11 - 13',
    alokasiWaktu: '12 JP',
    months: []
  },
  {
    no: '1.5',
    bab: 'Bab 5: Pola Hidup Sehat',
    topik: 'Kesehatan Alat Reproduksi Pubertas & Gizi Seimbang',
    pertemuanKe: '14 - 15',
    alokasiWaktu: '8 JP',
    months: []
  },
  {
    no: 'SAS',
    bab: 'Sumatif Akhir Semester',
    topik: 'Sumatif Akhir Semester 1 (SAS Ganjil) & Pengolahan Rapor',
    pertemuanKe: '16 - 17',
    alokasiWaktu: '8 JP',
    months: []
  },
  {
    no: 'CAD',
    bab: 'Jam Cadangan',
    topik: 'Penguatan Materi & Antisipasi Kegiatan Sekolah',
    pertemuanKe: '18',
    alokasiWaktu: '4 JP',
    months: []
  }
];

const rawRowsGenapKelas5: ProsemRow[] = [
  {
    no: '2.1',
    bab: 'Bab 6: Senam Lantai',
    topik: 'Rangkaian Senam Lantai Guling Depan & Sikap Lilin',
    pertemuanKe: '1 - 3',
    alokasiWaktu: '12 JP',
    months: []
  },
  {
    no: '2.2',
    bab: 'Bab 7: Gerak Berirama',
    topik: 'Senam Irama Langkah Kaki & Ayunan Lengan Kelompok',
    pertemuanKe: '4 - 6',
    alokasiWaktu: '12 JP',
    months: []
  },
  {
    no: 'STS',
    bab: 'Sumatif Tengah Semester',
    topik: 'Asesmen Sumatif Tengah Semester 2 (STS Genap)',
    pertemuanKe: '7',
    alokasiWaktu: '4 JP',
    months: []
  },
  {
    no: '2.3',
    bab: 'Bab 8: Aktivitas Air',
    topik: 'Meluncur, Gerak Kaki Renang Dada, & Etika Keselamatan Kolam',
    pertemuanKe: '8 - 10',
    alokasiWaktu: '12 JP',
    months: []
  },
  {
    no: '2.4',
    bab: 'Bab 9: Karakter & Kerjasama',
    topik: 'Permainan Tradisional Kooperatif & Sportivitas Tim',
    pertemuanKe: '11 - 13',
    alokasiWaktu: '12 JP',
    months: []
  },
  {
    no: '2.5',
    bab: 'Bab 10: Pencegahan Penyakit',
    topik: 'Pencegahan Penyakit Menular & Bahaya Merokok/NAPZA',
    pertemuanKe: '14 - 15',
    alokasiWaktu: '8 JP',
    months: []
  },
  {
    no: 'SAT',
    bab: 'Sumatif Akhir Tahun',
    topik: 'Sumatif Akhir Tahun (SAT) & Pengolahan Capaian Fase C',
    pertemuanKe: '16 - 17',
    alokasiWaktu: '8 JP',
    months: []
  },
  {
    no: 'CAD',
    bab: 'Jam Cadangan',
    topik: 'Uji Kebugaran Jasmani Siswa & Pekan Olahraga Sekolah',
    pertemuanKe: '18',
    alokasiWaktu: '4 JP',
    months: []
  }
];

export const PRESET_PROSEM_KELAS_5: ProsemData = {
  identitas: {
    namaSekolah: 'SD NEGERI KALIMANTONG',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kelas: '5',
    fase: 'C',
    tahunPelajaran: '2026/2027',
    alokasiWaktuTiapMinggu: '4 JP',
    kepalaSekolah: 'Budi Santoso, S.Pd., M.M.',
    nipKepsek: '19750812 199903 1 002',
    guruMapel: 'Ahmad Fauzi, S.Pd.',
    nipGuru: '19880415 201502 1 003',
    kota: 'Jakarta'
  },
  ganjil: {
    monthsHeader: DEFAULT_MONTHS_GANJIL,
    rows: autoScheduleSemesterRows(rawRowsGanjilKelas5, DEFAULT_MONTHS_GANJIL, 4)
  },
  genap: {
    monthsHeader: DEFAULT_MONTHS_GENAP,
    rows: autoScheduleSemesterRows(rawRowsGenapKelas5, DEFAULT_MONTHS_GENAP, 4)
  },
  keterangan: 'Angka 4 = Beban 4 Jam Pelajaran (JP) pada pekan KBM efektif.\nSTS = Sumatif Tengah Semester.\nSAS = Sumatif Akhir Semester.\nL = Libur Semester / Hari Besar Nasional.',
  tanggalDokumen: 'Jakarta, 13 Juli 2026',
  kepalaSekolah: 'Budi Santoso, S.Pd., M.M.',
  guruMapel: 'Ahmad Fauzi, S.Pd.'
};

// ----------------------------------------------------
// PRESET KELAS 1 (FASE A)
// ----------------------------------------------------
const rawRowsGanjilKelas1: ProsemRow[] = [
  { no: '1.1', bab: 'Bab 1: Gerak Lokomotor', topik: 'Jalan santai, lari zig-zag, dan melompat rintangan tali', pertemuanKe: '1 - 4', alokasiWaktu: '16 JP', months: [] },
  { no: '1.2', bab: 'Bab 2: Gerak Non-Lokomotor', topik: 'Gerak menekuk, memutar, dan meliuk menirukan pohon', pertemuanKe: '5 - 8', alokasiWaktu: '16 JP', months: [] },
  { no: 'STS', bab: 'STS 1', topik: 'Sumatif Tengah Semester 1 & Gerak Ceria', pertemuanKe: '9', alokasiWaktu: '4 JP', months: [] },
  { no: '1.3', bab: 'Bab 3: Gerak Manipulatif', topik: 'Melempar dan menangkap bola plastik berpasangan', pertemuanKe: '10 - 13', alokasiWaktu: '16 JP', months: [] },
  { no: '1.4', bab: 'Bab 4: Kebersihan Diri', topik: 'Mencuci tangan, merawat gigi, dan kebiasaan hidup bersih', pertemuanKe: '14 - 16', alokasiWaktu: '12 JP', months: [] },
  { no: 'SAS', bab: 'SAS 1', topik: 'Sumatif Akhir Semester 1 & Lomba Gerak Gembira', pertemuanKe: '17 - 18', alokasiWaktu: '8 JP', months: [] }
];

const rawRowsGenapKelas1: ProsemRow[] = [
  { no: '2.1', bab: 'Bab 5: Senam Ketangkasan', topik: 'Gerak bertumpu tangan, melompat, & mendarat matras', pertemuanKe: '1 - 4', alokasiWaktu: '16 JP', months: [] },
  { no: '2.2', bab: 'Bab 6: Senam Irama', topik: 'Gerak berirama musik ceria tepuk tangan & langkah', pertemuanKe: '5 - 8', alokasiWaktu: '16 JP', months: [] },
  { no: 'STS', bab: 'STS 2', topik: 'Sumatif Tengah Semester 2', pertemuanKe: '9', alokasiWaktu: '4 JP', months: [] },
  { no: '2.3', bab: 'Bab 7: Pengenalan Air', topik: 'Mengenal air, membasuh wajah, dan keselamatan kolam', pertemuanKe: '10 - 12', alokasiWaktu: '12 JP', months: [] },
  { no: '2.4', bab: 'Bab 8: Istirahat & Makan', topik: 'Pentingnya tidur cukup, air putih, dan makan sayur buah', pertemuanKe: '13 - 15', alokasiWaktu: '12 JP', months: [] },
  { no: 'SAT', bab: 'SAT 2', topik: 'Sumatif Akhir Tahun (SAT) Kenaikan Kelas & Festival Anak', pertemuanKe: '16 - 17', alokasiWaktu: '8 JP', months: [] },
  { no: 'CAD', bab: 'Cadangan', topik: 'Pekan Olahraga Ramah Anak & Cadangan', pertemuanKe: '18', alokasiWaktu: '4 JP', months: [] }
];

export const PRESET_PROSEM_KELAS_1: ProsemData = {
  identitas: {
    namaSekolah: 'SD NEGERI KALIMANTONG',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kelas: '1',
    fase: 'A',
    tahunPelajaran: '2026/2027',
    alokasiWaktuTiapMinggu: '4 JP',
    kepalaSekolah: 'Budi Santoso, S.Pd., M.M.',
    nipKepsek: '19750812 199903 1 002',
    guruMapel: 'Ahmad Fauzi, S.Pd.',
    nipGuru: '19880415 201502 1 003',
    kota: 'Jakarta'
  },
  ganjil: {
    monthsHeader: DEFAULT_MONTHS_GANJIL,
    rows: autoScheduleSemesterRows(rawRowsGanjilKelas1, DEFAULT_MONTHS_GANJIL, 4)
  },
  genap: {
    monthsHeader: DEFAULT_MONTHS_GENAP,
    rows: autoScheduleSemesterRows(rawRowsGenapKelas1, DEFAULT_MONTHS_GENAP, 4)
  },
  keterangan: 'Penyusunan Program Semester Fase A Kelas 1 dengan pendekatan belajar sambil bermain.',
  tanggalDokumen: 'Jakarta, 13 Juli 2026',
  kepalaSekolah: 'Budi Santoso, S.Pd., M.M.',
  guruMapel: 'Ahmad Fauzi, S.Pd.'
};

/**
 * Mendapatkan Preset Berdasarkan Kelas
 */
export function getPresetProsemByKelas(kelas: string): ProsemData {
  if (['1', '2'].includes(kelas)) {
    return JSON.parse(JSON.stringify(PRESET_PROSEM_KELAS_1));
  } else {
    return JSON.parse(JSON.stringify(PRESET_PROSEM_KELAS_5));
  }
}

/**
 * Hitung Total Jam Pelajaran Terjadwal pada Semester
 */
export function calculateSemesterTotalJp(semesterData: ProsemSemesterData): {
  totalJp: number;
  totalPekanEfektif: number;
  totalPekanKalender: number;
} {
  let totalJp = 0;
  let totalPekanKalender = 0;
  let totalPekanEfektif = 0;

  semesterData.monthsHeader.forEach((m) => {
    totalPekanKalender += m.totalWeeks;
    totalPekanEfektif += m.totalWeeks - m.nonEffectiveWeeks.length;
  });

  semesterData.rows.forEach((r) => {
    r.months.forEach((m) => {
      m.weeks.forEach((w) => {
        const valNum = parseInt(w.value, 10);
        if (!isNaN(valNum)) {
          totalJp += valNum;
        }
      });
    });
  });

  return { totalJp, totalPekanEfektif, totalPekanKalender };
}

/**
 * LocalStorage Helpers
 */
export function loadSavedProsem(): ProsemData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROSEM);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.ganjil && parsed.genap && parsed.ganjil.rows && parsed.genap.rows) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Gagal membaca data PROSEM dari localStorage', e);
  }
  return JSON.parse(JSON.stringify(PRESET_PROSEM_KELAS_5));
}

export function saveProsemToStorage(data: ProsemData): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROSEM, JSON.stringify(data));
  } catch (e) {
    console.error('Gagal menyimpan data PROSEM ke localStorage', e);
  }
}

export function resetProsemStorage(): ProsemData {
  try {
    localStorage.removeItem(STORAGE_KEY_PROSEM);
  } catch (e) {
    console.error('Gagal reset data PROSEM', e);
  }
  return JSON.parse(JSON.stringify(PRESET_PROSEM_KELAS_5));
}
