export interface TpDailyScores {
  nh1: number; // Nilai Harian 1: Formatif Praktik Lapangan / Unjuk Kerja
  nh2: number; // Nilai Harian 2: Formatif Teori / Kuis Pemahaman Gerak
  nh3: number; // Nilai Harian 3: Tugas / Portofolio / Sikap Sportivitas
  sumatifTp: number; // Asesmen Sumatif Lingkup Materi TP
}

export interface StudentSemesterScore {
  sts: number; // Sumatif Tengah Semester (STS)
  sas: number; // Sumatif Akhir Semester (SAS / PAS)
}

export interface AssessmentWeights {
  tp: number;  // Bobot Rerata TP (default 2 atau 50%)
  sts: number; // Bobot STS (default 1 atau 25%)
  sas: number; // Bobot SAS (default 1 atau 25%)
}

export interface TpItem {
  id: string;
  code: string;
  text: string;
}

export interface StudentSemesterEvaluation {
  studentId: string;
  studentName: string;
  gender: 'L' | 'P';
  tpScores: { [tpId: string]: number };
  rerataTp: number;
  sts: number;
  sas: number;
  nilaiAkhirSemester: number;
  predikat: 'A (Sangat Baik)' | 'B (Baik)' | 'C (Cukup)' | 'D (Perlu Bimbingan)';
  isPassed: boolean;
  deskripsiOptimal: string;
  deskripsiPerluBimbingan: string;
  deskripsiRapor: string;
}
