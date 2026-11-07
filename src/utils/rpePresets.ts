import { RpeData } from '../types';

/**
 * KALENDER PENDIDIKAN STANDAR DAN PRESET RINCIAN PEKAN EFEKTIF (RPE) SD
 * Kurikulum Merdeka Tahun Ajaran 2026/2027
 */

export const PRESET_RPE_SEMESTER_GANJIL: RpeData = {
  identitas: {
    namaSekolah: 'SD NEGERI KALIMANTONG',
    kelas: '5',
    fase: 'Fase C',
    jpPerMinggu: 4,
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    semester: 'Ganjil',
    tahunPelajaran: '2026/2027',
    kepalaSekolah: 'Kepala Sekolah, M.Pd.',
    nipKepsek: '19750318 200003 1 005',
    namaGuru: 'Guru PJOK, S.Pd.',
    nipGuru: '19890512 201502 1 002',
    kota: 'Jakarta'
  },
  alokasiWaktu: {
    bulans: [
      {
        no: 1,
        bulan: 'Juli',
        jumlahPekan: 5,
        pekanEfektif: 2,
        pekanTidakEfektif: 3,
        keterangan: 'Libur Akhir Tahun Ajaran Lalu & Kegiatan MPLS'
      },
      {
        no: 2,
        bulan: 'Agustus',
        jumlahPekan: 4,
        pekanEfektif: 4,
        pekanTidakEfektif: 0,
        keterangan: 'Peringatan HUT Kemerdekaan RI'
      },
      {
        no: 3,
        bulan: 'September',
        jumlahPekan: 5,
        pekanEfektif: 4,
        pekanTidakEfektif: 1,
        keterangan: 'Asesmen Sumatif Tengah Semester (STS)'
      },
      {
        no: 4,
        bulan: 'Oktober',
        jumlahPekan: 4,
        pekanEfektif: 4,
        pekanTidakEfektif: 0,
        keterangan: 'KBM Efektif Penuh & Projek P5'
      },
      {
        no: 5,
        bulan: 'November',
        jumlahPekan: 4,
        pekanEfektif: 4,
        pekanTidakEfektif: 0,
        keterangan: 'KBM Efektif & Pembiasaan Kebugaran'
      },
      {
        no: 6,
        bulan: 'Desember',
        jumlahPekan: 5,
        pekanEfektif: 1,
        pekanTidakEfektif: 4,
        keterangan: 'Sumatif Akhir Semester (SAS), Pembagian Rapor & Libur Semester'
      }
    ],
    totalPekan: 27,
    totalPekanEfektif: 19,
    totalPekanTidakEfektif: 8
  },
  pekanTidakEfektif: [
    {
      no: 1,
      uraianKegiatan: 'Libur Kenaikan Kelas & Akhir Tahun Ajaran Sebelumnya',
      jumlahPekan: 2,
      keterangan: 'Juli (Pekan ke-1 dan ke-2)'
    },
    {
      no: 2,
      uraianKegiatan: 'Masa Pengenalan Lingkungan Sekolah (MPLS)',
      jumlahPekan: 1,
      keterangan: 'Juli (Pekan ke-3)'
    },
    {
      no: 3,
      uraianKegiatan: 'Asesmen Sumatif Tengah Semester (STS) Ganjil',
      jumlahPekan: 1,
      keterangan: 'September (Pekan ke-4)'
    },
    {
      no: 4,
      uraianKegiatan: 'Asesmen Sumatif Akhir Semester (SAS) Ganjil',
      jumlahPekan: 1,
      keterangan: 'Desember (Pekan ke-2)'
    },
    {
      no: 5,
      uraianKegiatan: 'Pengolahan Nilai & Pembagian Rapor Semester Ganjil',
      jumlahPekan: 1,
      keterangan: 'Desember (Pekan ke-3)'
    },
    {
      no: 6,
      uraianKegiatan: 'Libur Akhir Semester Ganjil',
      jumlahPekan: 2,
      keterangan: 'Desember (Pekan ke-4 dan ke-5)'
    }
  ],
  distribusiAlokasiWaktu: [
    {
      no: 1,
      materiPokok: 'Pola Gerak Dasar & Keterampilan Atletik (Lari Cepat & Estafet)',
      lingkupMateri: 'Elemen Terampil Bergerak',
      alokasiWaktuJp: 12,
      keterangan: '3 Pertemuan'
    },
    {
      no: 2,
      materiPokok: 'Permainan Bola Besar (Sepak Bola / Bola Voli Sederhana)',
      lingkupMateri: 'Elemen Terampil Bergerak',
      alokasiWaktuJp: 16,
      keterangan: '4 Pertemuan'
    },
    {
      no: 3,
      materiPokok: 'Permainan Bola Kecil (Kasti / Rounders Modifikasi)',
      lingkupMateri: 'Elemen Terampil Bergerak',
      alokasiWaktuJp: 16,
      keterangan: '4 Pertemuan'
    },
    {
      no: 4,
      materiPokok: 'Aktivitas Kebugaran Jasmani & Pengukuran Denyut Nadi',
      lingkupMateri: 'Elemen Bergaya Hidup Aktif',
      alokasiWaktuJp: 12,
      keterangan: '3 Pertemuan'
    },
    {
      no: 5,
      materiPokok: 'Pola Makan Bergizi Seimbang & Kebersihan Diri',
      lingkupMateri: 'Elemen Memilih Hidup yang Menyehatkan',
      alokasiWaktuJp: 8,
      keterangan: '2 Pertemuan'
    },
    {
      no: 6,
      materiPokok: 'Asesmen Sumatif Lingkup Materi & STS',
      lingkupMateri: 'Asesmen Formatif & Sumatif',
      alokasiWaktuJp: 8,
      keterangan: '2 Pertemuan'
    },
    {
      no: 7,
      materiPokok: 'Alokasi Waktu Jam Cadangan (Remedial & Cuaca Buruk)',
      lingkupMateri: 'Cadangan / Pengayaan',
      alokasiWaktuJp: 4,
      keterangan: '1 Pertemuan'
    }
  ],
  totalPekanEfektifFormula: '27 Pekan – 8 Pekan = 19 Pekan Efektif',
  totalJamEfektifFormula: '19 Pekan × 4 JP = 76 Jam Pelajaran (JP)',
  totalJamEfektif: 76,
  totalJamCadangan: 4,
  tanggalDokumen: 'Jakarta, 14 Juli 2026',
  catatanAnalisis: 'Pekan efektif KBM semester ganjil memiliki alokasi waktu yang cukup stabil (19 pekan efektif / 76 JP). Disediakan 4 JP jam cadangan untuk mengantisipasi kendala cuaca hujan di lapangan atau program remedial bagi siswa yang belum tuntas KKTP.'
};

export const PRESET_RPE_SEMESTER_GENAP: RpeData = {
  identitas: {
    namaSekolah: 'SD NEGERI KALIMANTONG',
    kelas: '5',
    fase: 'Fase C',
    jpPerMinggu: 4,
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    semester: 'Genap',
    tahunPelajaran: '2026/2027',
    kepalaSekolah: 'Kepala Sekolah, M.Pd.',
    nipKepsek: '19750318 200003 1 005',
    namaGuru: 'Guru PJOK, S.Pd.',
    nipGuru: '19890512 201502 1 002',
    kota: 'Jakarta'
  },
  alokasiWaktu: {
    bulans: [
      {
        no: 1,
        bulan: 'Januari',
        jumlahPekan: 5,
        pekanEfektif: 4,
        pekanTidakEfektif: 1,
        keterangan: 'Libur Tahun Baru Masehi'
      },
      {
        no: 2,
        bulan: 'Februari',
        jumlahPekan: 4,
        pekanEfektif: 4,
        pekanTidakEfektif: 0,
        keterangan: 'KBM Efektif Penuh'
      },
      {
        no: 3,
        bulan: 'Maret',
        jumlahPekan: 4,
        pekanEfektif: 3,
        pekanTidakEfektif: 1,
        keterangan: 'Sumatif Tengah Semester & Libur Awal Ramadhan'
      },
      {
        no: 4,
        bulan: 'April',
        jumlahPekan: 5,
        pekanEfektif: 3,
        pekanTidakEfektif: 2,
        keterangan: 'Libur Hari Raya Idul Fitri'
      },
      {
        no: 5,
        bulan: 'Mei',
        jumlahPekan: 4,
        pekanEfektif: 4,
        pekanTidakEfektif: 0,
        keterangan: 'KBM Efektif & Latihan Senam'
      },
      {
        no: 6,
        bulan: 'Juni',
        jumlahPekan: 4,
        pekanEfektif: 1,
        pekanTidakEfektif: 3,
        keterangan: 'Sumatif Akhir Tahun (SAT), Rapor & Libur Kenaikan Kelas'
      }
    ],
    totalPekan: 26,
    totalPekanEfektif: 19,
    totalPekanTidakEfektif: 7
  },
  pekanTidakEfektif: [
    {
      no: 1,
      uraianKegiatan: 'Libur Awal Semester / Tahun Baru Masehi',
      jumlahPekan: 1,
      keterangan: 'Januari (Pekan ke-1)'
    },
    {
      no: 2,
      uraianKegiatan: 'Asesmen Sumatif Tengah Semester (STS) Genap & Libur Awal Ramadhan',
      jumlahPekan: 1,
      keterangan: 'Maret (Pekan ke-3)'
    },
    {
      no: 3,
      uraianKegiatan: 'Libur Hari Raya Idul Fitri',
      jumlahPekan: 2,
      keterangan: 'April (Pekan ke-2 dan ke-3)'
    },
    {
      no: 4,
      uraianKegiatan: 'Asesmen Sumatif Akhir Tahun (SAT) / Kenaikan Kelas',
      jumlahPekan: 1,
      keterangan: 'Juni (Pekan ke-2)'
    },
    {
      no: 5,
      uraianKegiatan: 'Pengolahan Nilai & Pembagian Rapor Kenaikan Kelas',
      jumlahPekan: 1,
      keterangan: 'Juni (Pekan ke-3)'
    },
    {
      no: 6,
      uraianKegiatan: 'Libur Kenaikan Kelas / Akhir Tahun Ajaran',
      jumlahPekan: 1,
      keterangan: 'Juni (Pekan ke-4)'
    }
  ],
  distribusiAlokasiWaktu: [
    {
      no: 1,
      materiPokok: 'Aktivitas Senam Lantai Ketangkasan (Roll Depan, Sikap Lilin)',
      lingkupMateri: 'Elemen Terampil Bergerak',
      alokasiWaktuJp: 12,
      keterangan: '3 Pertemuan'
    },
    {
      no: 2,
      materiPokok: 'Aktivitas Gerak Berirama (Senam Irama Kreasi Kelompok)',
      lingkupMateri: 'Elemen Terampil Bergerak',
      alokasiWaktuJp: 16,
      keterangan: '4 Pertemuan'
    },
    {
      no: 3,
      materiPokok: 'Aktivitas Permainan Air & Pengenalan Keselamatan (Kondisional)',
      lingkupMateri: 'Elemen Terampil Bergerak',
      alokasiWaktuJp: 12,
      keterangan: '3 Pertemuan'
    },
    {
      no: 4,
      materiPokok: 'Kesehatan Masa Pubertas & Pencegahan Bahaya NAPZA / Bullying',
      lingkupMateri: 'Elemen Memilih Hidup yang Menyehatkan',
      alokasiWaktuJp: 12,
      keterangan: '3 Pertemuan'
    },
    {
      no: 5,
      materiPokok: 'Pengembangan Sikap Sportif & Kolaborasi Melalui Gerak',
      lingkupMateri: 'Elemen Belajar Melalui Gerak',
      alokasiWaktuJp: 12,
      keterangan: '3 Pertemuan'
    },
    {
      no: 6,
      materiPokok: 'Asesmen Sumatif Lingkup Materi & Asesmen Akhir Tahun',
      lingkupMateri: 'Asesmen Sumatif',
      alokasiWaktuJp: 8,
      keterangan: '2 Pertemuan'
    },
    {
      no: 7,
      materiPokok: 'Alokasi Jam Cadangan & Remedial',
      lingkupMateri: 'Cadangan / Remedial',
      alokasiWaktuJp: 4,
      keterangan: '1 Pertemuan'
    }
  ],
  totalPekanEfektifFormula: '26 Pekan – 7 Pekan = 19 Pekan Efektif',
  totalJamEfektifFormula: '19 Pekan × 4 JP = 76 Jam Pelajaran (JP)',
  totalJamEfektif: 76,
  totalJamCadangan: 4,
  tanggalDokumen: 'Jakarta, 5 Januari 2027',
  catatanAnalisis: 'Semester genap memiliki jadwal libur hari raya keagamaan dan Asesmen Akhir Tahun (SAT). Tersedia 19 pekan efektif (76 JP) yang dirancang fleksibel dengan 4 JP jam cadangan untuk memastikan seluruh capaian materi tuntas sebelum kenaikan kelas.'
};

/**
 * Menghitung ulang seluruh angka RPE secara otomatis matematis
 */
export function recalculateRpe(current: RpeData): RpeData {
  const updatedBulans = current.alokasiWaktu.bulans.map(b => {
    const jmlPekan = Math.max(0, Number(b.jumlahPekan) || 0);
    const tidakEfektif = Math.max(0, Number(b.pekanTidakEfektif) || 0);
    const efektif = Math.max(0, jmlPekan - tidakEfektif);
    return {
      ...b,
      jumlahPekan: jmlPekan,
      pekanTidakEfektif: tidakEfektif,
      pekanEfektif: efektif
    };
  });

  const totalPekan = updatedBulans.reduce((sum, b) => sum + b.jumlahPekan, 0);
  const totalPekanTidakEfektif = updatedBulans.reduce((sum, b) => sum + b.pekanTidakEfektif, 0);
  const totalPekanEfektif = Math.max(0, totalPekan - totalPekanTidakEfektif);

  const jpPerMinggu = Math.max(1, Number(current.identitas.jpPerMinggu) || 4);
  const totalJamEfektif = totalPekanEfektif * jpPerMinggu;

  const totalPekanEfektifFormula = `${totalPekan} Pekan – ${totalPekanTidakEfektif} Pekan = ${totalPekanEfektif} Pekan Efektif`;
  const totalJamEfektifFormula = `${totalPekanEfektif} Pekan × ${jpPerMinggu} JP = ${totalJamEfektif} Jam Pelajaran (JP)`;

  return {
    ...current,
    alokasiWaktu: {
      bulans: updatedBulans,
      totalPekan,
      totalPekanEfektif,
      totalPekanTidakEfektif
    },
    totalPekanEfektifFormula,
    totalJamEfektifFormula,
    totalJamEfektif
  };
}

const STORAGE_KEY = 'sadar_pjok_rpe_data_custom';

/**
 * Memuat data RPE tersimpan di local storage atau mengembalikan preset default
 */
export function loadSavedRpe(preferredSemester: string = 'Ganjil'): RpeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.identitas && parsed.alokasiWaktu && Array.isArray(parsed.alokasiWaktu.bulans)) {
        return recalculateRpe(parsed);
      }
    }
  } catch (e) {
    console.warn('Gagal memuat RPE dari localStorage:', e);
  }

  return preferredSemester.toLowerCase().includes('genap')
    ? { ...PRESET_RPE_SEMESTER_GENAP }
    : { ...PRESET_RPE_SEMESTER_GANJIL };
}

/**
 * Menyimpan data RPE ke local storage
 */
export function saveRpeToStorage(data: RpeData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('sadar_pjok_rpe_updated'));
  } catch (e) {
    console.error('Gagal menyimpan RPE ke localStorage:', e);
  }
}

/**
 * Mengatur ulang ke data preset standar
 */
export function resetRpeStorage(semester: string = 'Ganjil'): RpeData {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('sadar_pjok_rpe_updated'));
  } catch (e) {
    console.error('Gagal menghapus RPE dari localStorage:', e);
  }
  return semester.toLowerCase().includes('genap')
    ? { ...PRESET_RPE_SEMESTER_GENAP }
    : { ...PRESET_RPE_SEMESTER_GANJIL };
}

export interface GenerateRpeOptions {
  namaSekolah: string;
  kelas: string;
  fase?: string;
  mataPelajaran?: string;
  semester: 'Ganjil' | 'Genap';
  tahunPelajaran: string;
  jpPerMinggu: number;
  wilayahKalender?: 'nasional' | 'dki' | 'jabar' | 'jateng' | 'jatim' | 'kemenag';
  targetJamCadangan?: number;
  namaGuru?: string;
  nipGuru?: string;
  kepalaSekolah?: string;
  nipKepsek?: string;
  kota?: string;
  sertakanDistribusiMateri?: boolean;
}

/**
 * Otomatis menghasilkan tabel distribusi alokasi JP PJOK yang 100% seimbang
 */
export function generatePjokDistribution(
  fase: string = 'Fase C',
  kelas: string = '5',
  semester: 'Ganjil' | 'Genap' = 'Ganjil',
  totalJamEfektif: number = 76,
  targetJamCadangan: number = 4
) {
  const isGanjil = semester === 'Ganjil';
  const faseClean = (fase || 'Fase C').toLowerCase();
  
  interface TemplateMateri {
    materiPokok: string;
    lingkupMateri: string;
    bobotPersen: number;
    keterangan: string;
  }

  let templates: TemplateMateri[] = [];

  if (faseClean.includes('fase a') || ['1', '2'].includes(kelas)) {
    // Fase A (Kelas 1-2)
    templates = isGanjil ? [
      { materiPokok: 'Pola Gerak Dasar Lokomotor (Jalan, Lari, dan Melompat)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 20, keterangan: 'Gerak dasar berpetualang' },
      { materiPokok: 'Pola Gerak Dasar Nonlokomotor (Menekuk, Memutar, Mengayun)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 18, keterangan: 'Keseimbangan statis & dinamis' },
      { materiPokok: 'Pola Gerak Dasar Manipulatif (Melempar dan Menangkap Bola)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 20, keterangan: 'Permainan bola sederhana' },
      { materiPokok: 'Pengenalan Kebugaran Tubuh Melalui Permainan Ceria', lingkupMateri: 'Elemen Bergaya Hidup Aktif', bobotPersen: 15, keterangan: 'Kebugaran gerak anak' },
      { materiPokok: 'Mengenal Bagian Tubuh & Kebiasaan Menjaga Kebersihan Diri', lingkupMateri: 'Elemen Memilih Hidup yang Menyehatkan', bobotPersen: 12, keterangan: 'Pola hidup bersih dan sehat' },
      { materiPokok: 'Asesmen Sumatif Lingkup Materi & STS', lingkupMateri: 'Asesmen Formatif & Sumatif', bobotPersen: 10, keterangan: 'Uji capaian keterampilan' },
    ] : [
      { materiPokok: 'Aktivitas Senam Ketangkasan Sederhana (Keseimbangan & Berguling)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 22, keterangan: 'Senam lantai ramah anak' },
      { materiPokok: 'Aktivitas Gerak Berirama (Senam Irama Musik Riang)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 20, keterangan: 'Irama langkah dan ayunan' },
      { materiPokok: 'Pengenalan Aktivitas di Air & Keselamatan Dasar', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 16, keterangan: 'Kondisional kolam/permainan air' },
      { materiPokok: 'Manfaat Aktivitas Fisik untuk Pertumbuhan dan Kesehatan', lingkupMateri: 'Elemen Bergaya Hidup Aktif', bobotPersen: 15, keterangan: 'Edukasi gerak aktif harian' },
      { materiPokok: 'Kebiasaan Istirahat, Tidur Cukup, dan Memilih Makanan Bersih', lingkupMateri: 'Elemen Memilih Hidup yang Menyehatkan', bobotPersen: 12, keterangan: 'Edukasi istirahat sehat' },
      { materiPokok: 'Asesmen Sumatif Akhir Tahun (SAT) & Pengolahan Capaian', lingkupMateri: 'Asesmen Sumatif', bobotPersen: 10, keterangan: 'Penilaian akhir semester' },
    ];
  } else if (faseClean.includes('fase b') || ['3', '4'].includes(kelas)) {
    // Fase B (Kelas 3-4)
    templates = isGanjil ? [
      { materiPokok: 'Kombinasi Pola Gerak Dasar pada Permainan Tradisional', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 18, keterangan: 'Egrang, gobak sodor, lari balok' },
      { materiPokok: 'Variasi Gerak Manipulatif Permainan Bola Besar (Sepak Bola Sederhana)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 22, keterangan: 'Menendang, menghentikan, menggiring' },
      { materiPokok: 'Variasi Gerak Dasar Permainan Bola Kecil (Kasti Modifikasi)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 20, keterangan: 'Melempar, memukul, menangkap' },
      { materiPokok: 'Latihan Peningkatan Daya Tahan Otot dan Kelenturan Tubuh', lingkupMateri: 'Elemen Bergaya Hidup Aktif', bobotPersen: 15, keterangan: 'Latihan circuit sederhana' },
      { materiPokok: 'Pola Makan Bergizi Seimbang & Waktu Istirahat yang Efektif', lingkupMateri: 'Elemen Memilih Hidup yang Menyehatkan', bobotPersen: 10, keterangan: 'Gizi sehat isi piringku' },
      { materiPokok: 'Asesmen Sumatif Lingkup Materi & STS', lingkupMateri: 'Asesmen Sumatif', bobotPersen: 10, keterangan: 'Uji keterampilan gerak' },
    ] : [
      { materiPokok: 'Aktivitas Senam Lantai (Guling Depan & Sikap Lilin Bertahap)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 20, keterangan: 'Ketangkasan matras senam' },
      { materiPokok: 'Senam Kesegaran Jasmani (SKJ) & Gerak Irama Kreasi', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 20, keterangan: 'Senam irama berkelompok' },
      { materiPokok: 'Aktivitas Penyelamatan Diri di Air & Menjaga Keselamatan Teman', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 16, keterangan: 'Kondisional sarana air' },
      { materiPokok: 'Pengembangan Sikap Kolaborasi & Sportivitas Melalui Gerak', lingkupMateri: 'Elemen Belajar Melalui Gerak', bobotPersen: 15, keterangan: 'Kerjasama tim & fair play' },
      { materiPokok: 'Menjaga Kebersihan Alat Reproduksi & Pakaian Olahraga', lingkupMateri: 'Elemen Memilih Hidup yang Menyehatkan', bobotPersen: 14, keterangan: 'Kesehatan pubertas dini' },
      { materiPokok: 'Asesmen Sumatif Akhir Tahun (SAT) & Pengayaan', lingkupMateri: 'Asesmen Sumatif', bobotPersen: 10, keterangan: 'Penilaian akhir semester' },
    ];
  } else if (faseClean.includes('fase d') || ['7', '8', '9'].includes(kelas)) {
    // Fase D (Kelas 7-9 SMP)
    templates = isGanjil ? [
      { materiPokok: 'Keterampilan Gerak Spesifik Permainan Invasi (Sepak Bola / Bola Basket)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 22, keterangan: 'Teknik dasar & strategi bermain' },
      { materiPokok: 'Keterampilan Gerak Spesifik Permainan Net (Bola Voli / Bulu Tangkis)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 20, keterangan: 'Servis, passing, smash' },
      { materiPokok: 'Keterampilan Gerak Atletik (Lari Jarak Pendek & Tolak Peluru)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 18, keterangan: 'Teknik start, lari, tolakan' },
      { materiPokok: 'Latihan Kebugaran Jasmani Terprogram (Circuit Training & VO2Max Sederhana)', lingkupMateri: 'Elemen Bergaya Hidup Aktif', bobotPersen: 15, keterangan: 'Pengukuran denyut nadi latihan' },
      { materiPokok: 'Pencegahan Bahaya Pergaulan Bebas, Rokok, dan NAPZA bagi Remaja', lingkupMateri: 'Elemen Memilih Hidup yang Menyehatkan', bobotPersen: 10, keterangan: 'Pendidikan kesehatan remaja' },
      { materiPokok: 'Asesmen Sumatif Lingkup Materi & STS Ganjil', lingkupMateri: 'Asesmen Sumatif', bobotPersen: 10, keterangan: 'Uji tertulis & unjuk kerja' },
    ] : [
      { materiPokok: 'Rangkaian Senam Lantai (Guling Lenting, Meroda, Round Off)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 20, keterangan: 'Kombinasi gerak senam' },
      { materiPokok: 'Aktivitas Gerak Berirama (Senam Aerobik Koreografi Tim)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 20, keterangan: 'Kreasi ritmik kelompok' },
      { materiPokok: 'Aktivitas Olahraga Air / Penyelamatan Diri & Pertolongan Korban di Air', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 16, keterangan: 'Penyelamatan kecelakaan air' },
      { materiPokok: 'Konsep Pertolongan Pertama Pada Kecelakaan (P3K) & Penanganan Cedera Olahraga', lingkupMateri: 'Elemen Memilih Hidup yang Menyehatkan', bobotPersen: 14, keterangan: 'Metode RICE pada cedera' },
      { materiPokok: 'Pola Hidup Sehat, Manajemen Stres, dan Pemeliharaan Kesehatan Mental', lingkupMateri: 'Elemen Belajar Melalui Gerak', bobotPersen: 15, keterangan: 'Gaya hidup sehat seimbang' },
      { materiPokok: 'Asesmen Sumatif Akhir Tahun (SAT) & Uji Kebugaran', lingkupMateri: 'Asesmen Sumatif', bobotPersen: 10, keterangan: 'Penilaian unjuk kerja akhir' },
    ];
  } else {
    // Fase C (Kelas 5-6 SD) - Default
    templates = isGanjil ? [
      { materiPokok: 'Keterampilan Gerak Atletik (Lari Cepat 50M, Estafet, dan Lompat Jauh)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 18, keterangan: 'Teknik lari & ayunan lengan' },
      { materiPokok: 'Permainan Bola Besar (Sepak Bola & Bola Voli Mini Modifikasi)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 22, keterangan: 'Passing, dribbling, shooting' },
      { materiPokok: 'Permainan Bola Kecil (Kasti dan Rounders Lapangan Terbuka)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 20, keterangan: 'Melempar, memukul, menangkap' },
      { materiPokok: 'Aktivitas Kebugaran Jasmani & Pengukuran Denyut Nadi Istirahat/Latihan', lingkupMateri: 'Elemen Bergaya Hidup Aktif', bobotPersen: 15, keterangan: 'Tes kebugaran jasmani dasar' },
      { materiPokok: 'Pola Makan Bergizi Seimbang, Istirahat, dan Pemeliharaan Kebersihan Diri', lingkupMateri: 'Elemen Memilih Hidup yang Menyehatkan', bobotPersen: 12, keterangan: 'Gizi sehat & kebersihan organ' },
      { materiPokok: 'Asesmen Sumatif Lingkup Materi & STS Ganjil', lingkupMateri: 'Asesmen Formatif & Sumatif', bobotPersen: 10, keterangan: 'Uji keterampilan & pengetahuan' },
    ] : [
      { materiPokok: 'Aktivitas Senam Lantai Ketangkasan (Roll Depan, Sikap Lilin, Kayang Ringan)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 20, keterangan: 'Kelenturan & kekuatan otot' },
      { materiPokok: 'Aktivitas Gerak Berirama (Senam Irama Kreasi Kelompok Musik Nasional)', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 20, keterangan: 'Irama langkah kaki & koordinasi' },
      { materiPokok: 'Aktivitas Permainan Air & Pengenalan Keselamatan di Kolam Renang', lingkupMateri: 'Elemen Terampil Bergerak', bobotPersen: 16, keterangan: 'Kondisional sarana renang' },
      { materiPokok: 'Kesehatan Masa Pubertas & Pencegahan Bahaya NAPZA / Bullying', lingkupMateri: 'Elemen Memilih Hidup yang Menyehatkan', bobotPersen: 14, keterangan: 'Edukasi pubertas & etika bergaul' },
      { materiPokok: 'Pengembangan Sikap Sportif, Kepemimpinan, dan Kolaborasi Melalui Gerak', lingkupMateri: 'Elemen Belajar Melalui Gerak', bobotPersen: 15, keterangan: 'Fair play & kepemimpinan' },
      { materiPokok: 'Asesmen Sumatif Akhir Tahun (SAT) & Pengolahan Rapor', lingkupMateri: 'Asesmen Sumatif', bobotPersen: 10, keterangan: 'Penilaian akhir semester' },
    ];
  }

  // Calculate target JP for materials excluding reserve
  const jamCadangan = Math.max(2, Math.min(8, Number(targetJamCadangan) || 4));
  const sisaJamMateri = Math.max(10, totalJamEfektif - jamCadangan);

  const totalBobot = templates.reduce((acc, curr) => acc + curr.bobotPersen, 0);

  // Allocate in multiples of 2 JP
  let distributedList = templates.map((t, idx) => {
    let rawJp = Math.round((t.bobotPersen / totalBobot) * sisaJamMateri);
    // ensure even numbers (multiple of 2)
    let evenJp = Math.max(2, Math.round(rawJp / 2) * 2);
    return {
      no: idx + 1,
      materiPokok: t.materiPokok,
      lingkupMateri: t.lingkupMateri,
      alokasiWaktuJp: evenJp,
      keterangan: `${Math.round(evenJp / 4) || 1} - ${Math.round(evenJp / 2)} Pertemuan (${t.keterangan})`
    };
  });

  // Rebalance difference so total exactly matches sisaJamMateri
  let currentSum = distributedList.reduce((acc, curr) => acc + curr.alokasiWaktuJp, 0);
  let diff = sisaJamMateri - currentSum;

  if (diff !== 0 && distributedList.length > 0) {
    // Add/subtract diff from largest subject
    distributedList[1].alokasiWaktuJp = Math.max(2, distributedList[1].alokasiWaktuJp + diff);
  }

  // Append Jam Cadangan
  distributedList.push({
    no: distributedList.length + 1,
    materiPokok: isGanjil 
      ? 'Alokasi Jam Cadangan (Remedial & Antisipasi Cuaca Hujan di Lapangan)'
      : 'Alokasi Jam Cadangan & Uji Remedial Akhir Tahun',
    lingkupMateri: 'Cadangan / Remedial',
    alokasiWaktuJp: jamCadangan,
    keterangan: `${Math.round(jamCadangan / 4) || 1} Pertemuan (Fleksibel)`
  });

  return distributedList;
}

/**
 * Menghasilkan Kalender RPE Lengkap Otomatis Berdasarkan Opsi Wilayah dan Kurikulum
 */
export function generateAutomaticRpe(options: GenerateRpeOptions): RpeData {
  const isGanjil = options.semester === 'Ganjil';
  const wilayah = options.wilayahKalender || 'nasional';
  const jpPerMinggu = Math.max(1, Number(options.jpPerMinggu) || 4);
  const targetJamCadangan = Number(options.targetJamCadangan) || 4;

  let basePreset = isGanjil ? { ...PRESET_RPE_SEMESTER_GANJIL } : { ...PRESET_RPE_SEMESTER_GENAP };

  // Adjust bulans based on regional academic calendars
  let bulans = basePreset.alokasiWaktu.bulans.map(b => ({ ...b }));
  let pekanTidakEfektif = basePreset.pekanTidakEfektif.map(p => ({ ...p }));

  if (isGanjil) {
    if (wilayah === 'dki') {
      bulans[0].keterangan = 'Libur Akhir Tahun, MPLS DKI & Orientasi Siswa Baru';
      pekanTidakEfektif[1].keterangan = 'Juli (Pekan ke-2 & ke-3)';
    } else if (wilayah === 'jabar') {
      bulans[0].keterangan = 'Libur Kenaikan Kelas, MPLS Ramah Anak Jabar';
    } else if (wilayah === 'kemenag') {
      bulans[0].keterangan = 'Matsama (Masa Ta\'aruf Siswa Madrasah) & Libur TA Lalu';
      pekanTidakEfektif[1].uraianKegiatan = 'Masa Ta\'aruf Siswa Madrasah (Matsama)';
    }
  } else {
    // Semester Genap
    if (wilayah === 'kemenag') {
      pekanTidakEfektif[1].uraianKegiatan = 'Asesmen Madrasah (AM) / STS & Libur Awal Ramadhan';
    }
  }

  // Recalculate totals
  const totalPekan = bulans.reduce((sum, b) => sum + b.jumlahPekan, 0);
  const totalPekanTidakEfektif = bulans.reduce((sum, b) => sum + b.pekanTidakEfektif, 0);
  const totalPekanEfektif = Math.max(0, totalPekan - totalPekanTidakEfektif);
  const totalJamEfektif = totalPekanEfektif * jpPerMinggu;

  const totalPekanEfektifFormula = `${totalPekan} Pekan – ${totalPekanTidakEfektif} Pekan = ${totalPekanEfektif} Pekan Efektif`;
  const totalJamEfektifFormula = `${totalPekanEfektif} Pekan × ${jpPerMinggu} JP = ${totalJamEfektif} Jam Pelajaran (JP)`;

  // Generate balanced PJOK distribution if requested
  const distribusiAlokasiWaktu = options.sertakanDistribusiMateri !== false
    ? generatePjokDistribution(
        options.fase || 'Fase C',
        options.kelas || '5',
        options.semester,
        totalJamEfektif,
        targetJamCadangan
      )
    : basePreset.distribusiAlokasiWaktu;

  const kotaDefault = wilayah === 'dki' ? 'Jakarta' : wilayah === 'jabar' ? 'Bandung' : wilayah === 'jateng' ? 'Semarang' : wilayah === 'jatim' ? 'Surabaya' : 'Kota';

  const defaultTanggal = isGanjil 
    ? `${options.kota || kotaDefault}, 14 Juli ${options.tahunPelajaran.split('/')[0] || '2026'}`
    : `${options.kota || kotaDefault}, 5 Januari ${options.tahunPelajaran.split('/')[1] || '2027'}`;

  const generatedRpe: RpeData = {
    identitas: {
      namaSekolah: options.namaSekolah || 'SD Negeri Kalimantong',
      kelas: options.kelas || '5',
      fase: options.fase || 'Fase C',
      jpPerMinggu: jpPerMinggu,
      mataPelajaran: options.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
      semester: options.semester,
      tahunPelajaran: options.tahunPelajaran || '2026/2027',
      kepalaSekolah: options.kepalaSekolah || 'Kepala Sekolah, M.Pd.',
      nipKepsek: options.nipKepsek || '19750318 200003 1 005',
      namaGuru: options.namaGuru || 'Guru PJOK, S.Pd.',
      nipGuru: options.nipGuru || '19890512 201502 1 002',
      kota: options.kota || kotaDefault
    },
    alokasiWaktu: {
      bulans,
      totalPekan,
      totalPekanEfektif,
      totalPekanTidakEfektif
    },
    pekanTidakEfektif,
    distribusiAlokasiWaktu,
    totalPekanEfektifFormula,
    totalJamEfektifFormula,
    totalJamEfektif,
    totalJamCadangan: targetJamCadangan,
    tanggalDokumen: defaultTanggal,
    catatanAnalisis: `Hasil generate otomatis RPE Kurikulum Merdeka untuk ${options.semester} TA ${options.tahunPelajaran}. Alokasi pekan efektif KBM sebanyak ${totalPekanEfektif} pekan (${totalJamEfektif} JP) telah dioptimalkan secara seimbang ke seluruh materi pokok PJOK serta ${targetJamCadangan} JP jam cadangan.`
  };

  return generatedRpe;
}
