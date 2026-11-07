import { TpItem, TpDailyScores, StudentSemesterScore, AssessmentWeights, StudentSemesterEvaluation } from './nilaiHarianTypes';
import { Student } from '../types';

export const GRADE_SEMESTER_TP_PRESETS: { [grade: number]: { [sem: number]: { code: string; text: string }[] } } = {
  1: {
    1: [
      { code: 'TP 1.1', text: 'Mempraktikkan variasi pola gerak dasar lokomotor (jalan, lari, lompat) dalam permainan sederhana.' },
      { code: 'TP 1.2', text: 'Mempraktikkan pola gerak dasar non-lokomotor (meliuk, menekuk, meregang) secara seimbang.' },
      { code: 'TP 1.3', text: 'Mempraktikkan pola gerak dasar manipulatif melempar dan menangkap benda.' },
      { code: 'TP 1.4', text: 'Menunjukkan sikap sportif, disiplin seragam olahraga, dan kerjasama dengan teman.' }
    ],
    2: [
      { code: 'TP 1.5', text: 'Mempraktikkan pola gerak dominan senam lantai bertumpu dan berguling sederhana.' },
      { code: 'TP 1.6', text: 'Mempraktikkan variasi pola gerak berirama mengikuti ketukan musik atau tepukan tangan.' },
      { code: 'TP 1.7', text: 'Mengenal bagian-bagian tubuh dan cara menjaga kebersihan pakaian olahraga.' },
      { code: 'TP 1.8', text: 'Mempraktikkan aktivitas pengenalan air dan keselamatan diri di air dangkal.' }
    ]
  },
  2: {
    1: [
      { code: 'TP 2.1', text: 'Mempraktikkan variasi gerak lokomotor dan non-lokomotor dalam bentuk permainan modifikasi.' },
      { code: 'TP 2.2', text: 'Mempraktikkan variasi gerak manipulatif memantulkan dan menggiring bola kecil/besar.' },
      { code: 'TP 2.3', text: 'Mempraktikkan kebugaran jasmani dasar melatih kelincahan dan koordinasi tubuh.' },
      { code: 'TP 2.4', text: 'Menerapkan pola hidup bersih dan sehat dalam kehidupan sehari-hari di sekolah.' }
    ],
    2: [
      { code: 'TP 2.5', text: 'Mempraktikkan gerak dominan senam lantai keseimbangan satu kaki dan guling depan.' },
      { code: 'TP 2.6', text: 'Mempraktikkan rangkaian gerak berirama langkah kaki dan ayunan lengan.' },
      { code: 'TP 2.7', text: 'Mengenal makanan bergizi seimbang dan pentingnya sarapan sebelum berolahraga.' },
      { code: 'TP 2.8', text: 'Mempraktikkan gerakan meluncur dan mengapung dengan aman di kolam renang.' }
    ]
  },
  3: {
    1: [
      { code: 'TP 3.1', text: 'Mempraktikkan kombinasi gerak dasar lokomotor dan manipulatif permainan bola kecil.' },
      { code: 'TP 3.2', text: 'Mempraktikkan kombinasi gerak dasar lokomotor dan manipulatif permainan bola besar.' },
      { code: 'TP 3.3', text: 'Mempraktikkan latihan kebugaran daya tahan dan kelenturan tubuh.' },
      { code: 'TP 3.4', text: 'Memahami prosedur pertolongan pertama sederhana (P3K) pada luka lecet.' }
    ],
    2: [
      { code: 'TP 3.5', text: 'Mempraktikkan senam lantai rangkaian guling depan dan sikap lilin terkontrol.' },
      { code: 'TP 3.6', text: 'Mempraktikkan gerak berirama kombinasi langkah tegap dan ayunan tangan.' },
      { code: 'TP 3.7', text: 'Memilih jajanan sehat serta memahami pengaruh istirahat cukup bagi tubuh.' },
      { code: 'TP 3.8', text: 'Mempraktikkan gerak dasar renang gaya dada gerak kaki dan tangan.' }
    ]
  },
  4: {
    1: [
      { code: 'TP 4.1', text: 'Mempraktikkan variasi gerak dasar melempar, menangkap, memukul pada permainan kasti.' },
      { code: 'TP 4.2', text: 'Mempraktikkan kombinasi gerak dasar atletik lari cepat dan lompat jauh modifikasi.' },
      { code: 'TP 4.3', text: 'Mempraktikkan gerak dasar bela diri pencak silat sikap kuda-kuda dan pukulan.' },
      { code: 'TP 4.4', text: 'Menerapkan konsep kebugaran jasmani melatih daya tahan kardiorespirasi.' }
    ],
    2: [
      { code: 'TP 4.5', text: 'Mempraktikkan variasi senam lantai guling lenting dan handstand dinding.' },
      { code: 'TP 4.6', text: 'Mempraktikkan senam SKJ atau gerak ritmik beregu dengan kekompakan gerak.' },
      { code: 'TP 4.7', text: 'Memahami penanganan cedera memar dan kram otot saat berolahraga.' },
      { code: 'TP 4.8', text: 'Mempraktikkan renang gaya bebas koordinasi pernapasan dan luncuran.' }
    ]
  },
  5: {
    1: [
      { code: 'TP 5.1', text: 'Mempraktikkan kombinasi gerak passing bawah dan atas pada permainan bola voli.' },
      { code: 'TP 5.2', text: 'Mempraktikkan kombinasi gerak menendang, menghentikan, menggiring sepak bola.' },
      { code: 'TP 5.3', text: 'Mempraktikkan variasi tangkisan dan tendangan bela diri pencak silat.' },
      { code: 'TP 5.4', text: 'Mengukur kebugaran jasmani mandiri (push up, sit up, lari multi tahap).' }
    ],
    2: [
      { code: 'TP 5.5', text: 'Mempraktikkan rangkaian senam lantai guling depan, guling belakang, dan meroda.' },
      { code: 'TP 5.6', text: 'Mempraktikkan koreografi senam aerobik irama musik modern berenergi.' },
      { code: 'TP 5.7', text: 'Memahami bahaya merokok, minuman keras, dan zat adiktif bagi kesehatan fisik.' },
      { code: 'TP 5.8', text: 'Mempraktikkan teknik renang gaya dada jarak 15-25 meter secara teratur.' }
    ]
  },
  6: {
    1: [
      { code: 'TP 6.1', text: 'Mempraktikkan variasi dribbling, passing, shooting pada permainan bola basket.' },
      { code: 'TP 6.2', text: 'Mempraktikkan taktik permainan lapangan rounders atau kasti beregu.' },
      { code: 'TP 6.3', text: 'Mempraktikkan teknik dasar tolak peluru dan lari estafet modifikasi.' },
      { code: 'TP 6.4', text: 'Menerapkan program circuit training untuk meningkatkan kebugaran jasmani.' }
    ],
    2: [
      { code: 'TP 6.5', text: 'Mempraktikkan senam ketangkasan melompat peti lompat dengan pendaratan aman.' },
      { code: 'TP 6.6', text: 'Menciptakan variasi rangkaian gerak berirama kreatif beregu secara kompak.' },
      { code: 'TP 6.7', text: 'Memahami cara memelihara kebersihan alat reproduksi dan pola hidup remaja sehat.' },
      { code: 'TP 6.8', text: 'Mempraktikkan keselamatan di air dan teknik pertolongan mandiri (survival swim).' }
    ]
  }
};

export function calculateStudentSemesterEval(
  student: Student,
  tps: TpItem[],
  scores: { [studentId: string]: { [tpId: string]: number } },
  dailyScores: { [studentId: string]: { [tpId: string]: TpDailyScores } },
  semesterScores: { [studentId: string]: StudentSemesterScore },
  weights: AssessmentWeights,
  kktp: number
): StudentSemesterEvaluation {
  const studentTpScores: { [tpId: string]: number } = {};
  let tpSum = 0;
  let highestScore = -1;
  let lowestScore = 101;
  let highestTp: TpItem | null = null;
  let lowestTp: TpItem | null = null;

  tps.forEach(tp => {
    let score = scores[student.id]?.[tp.id];
    if (score === undefined) {
      const d = dailyScores[student.id]?.[tp.id];
      if (d) {
        score = Math.round((d.nh1 + d.nh2 + d.nh3 + d.sumatifTp) / 4);
      } else {
        score = 75;
      }
    }
    studentTpScores[tp.id] = score;
    tpSum += score;

    if (score > highestScore) {
      highestScore = score;
      highestTp = tp;
    }
    if (score < lowestScore) {
      lowestScore = score;
      lowestTp = tp;
    }
  });

  const rerataTp = tps.length > 0 ? Math.round(tpSum / tps.length) : 75;
  const sts = semesterScores[student.id]?.sts !== undefined ? semesterScores[student.id].sts : rerataTp;
  const sas = semesterScores[student.id]?.sas !== undefined ? semesterScores[student.id].sas : rerataTp;

  const totalWeights = (weights.tp || 2) + (weights.sts || 1) + (weights.sas || 1);
  const weightedSum = (rerataTp * (weights.tp || 2)) + (sts * (weights.sts || 1)) + (sas * (weights.sas || 1));
  const nilaiAkhirSemester = Math.round(weightedSum / (totalWeights > 0 ? totalWeights : 1));

  let predikat: 'A (Sangat Baik)' | 'B (Baik)' | 'C (Cukup)' | 'D (Perlu Bimbingan)' = 'B (Baik)';
  if (nilaiAkhirSemester >= 90) predikat = 'A (Sangat Baik)';
  else if (nilaiAkhirSemester >= 80) predikat = 'B (Baik)';
  else if (nilaiAkhirSemester >= 70) predikat = 'C (Cukup)';
  else predikat = 'D (Perlu Bimbingan)';

  const isPassed = nilaiAkhirSemester >= kktp;

  const optimalText = highestTp ? (highestTp as TpItem).text.toLowerCase() : 'pembelajaran fisik lapangan';
  const lowestText = lowestTp ? (lowestTp as TpItem).text.toLowerCase() : 'pemahaman materi olahraga';

  const deskripsiOptimal = `Menunjukkan penguasaan sangat baik dalam ${optimalText}.`;
  const deskripsiPerluBimbingan = lowestScore < kktp || lowestScore < 80 
    ? `Perlu peningkatan dan pendampingan latihan dalam ${lowestText}.`
    : `Dapat ditingkatkan lebih optimal lagi dalam ${lowestText}.`;
  const deskripsiRapor = `${deskripsiOptimal} ${deskripsiPerluBimbingan}`;

  return {
    studentId: student.id,
    studentName: student.name,
    gender: student.gender,
    tpScores: studentTpScores,
    rerataTp,
    sts,
    sas,
    nilaiAkhirSemester,
    predikat,
    isPassed,
    deskripsiOptimal,
    deskripsiPerluBimbingan,
    deskripsiRapor
  };
}
