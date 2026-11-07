import React from 'react';
import { DeepLearningRPM } from '../types';

interface DeepLearningDocumentPreviewProps {
  rpm: DeepLearningRPM;
  showAll?: boolean;
}

export function RPMTableSection({ rpm }: { rpm: DeepLearningRPM }) {
  const dplList = [
    'DPL1 Keimanan dan Ketakwaan terhadap Tuhan YME',
    'DPL2 Kewargaan',
    'DPL3 Penalaran Kritis',
    'DPL4 Kreativitas',
    'DPL5 Kolaborasi',
    'DPL6 Kemandirian',
    'DPL7 Kesehatan',
    'DPL8 Komunikasi'
  ];

  const selectedDpl = Array.isArray(rpm.identifikasi?.dimensiProfilLulusan)
    ? rpm.identifikasi.dimensiProfilLulusan
    : (typeof rpm.identifikasi?.dimensiProfilLulusan === 'string'
        ? [rpm.identifikasi.dimensiProfilLulusan]
        : []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-300 pb-2.5 gap-1">
        <div>
          <h3 className="font-bold text-slate-900 text-base uppercase tracking-tight">Tabel Rencana Pelaksanaan Pembelajaran (RPM)</h3>
          <p className="text-xs text-slate-500 font-medium">Format Standar Pembelajaran Mendalam (Mindful, Meaningful, Joyful)</p>
        </div>
        <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded border border-indigo-200 self-start sm:self-auto">
          Deep Learning
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-300 shadow-xs">
        <table className="w-full border-collapse text-left bg-white text-xs">
          <thead>
            <tr className="bg-slate-900 text-white text-xs uppercase font-bold tracking-wider">
              <th className="w-[32%] px-4 py-3 border border-slate-400">Komponen / Sub-komponen</th>
              <th className="w-[68%] px-4 py-3 border border-slate-400">Isi Perencanaan Pembelajaran</th>
            </tr>
          </thead>
          <tbody className="text-slate-800 divide-y divide-slate-300">
            {/* IDENTITAS CATEGORY */}
            <tr className="bg-indigo-50/80 font-bold text-indigo-950">
              <td colSpan={2} className="px-4 py-2.5 border border-slate-300 uppercase tracking-wide font-extrabold text-[11px] bg-indigo-100/70 text-indigo-900">
                A. IDENTITAS
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-slate-50/70">Penyusun</td>
              <td className="px-4 py-2.5 border border-slate-300 font-medium">{rpm.identitas?.penyusun || '-'}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-slate-50/70">Sekolah</td>
              <td className="px-4 py-2.5 border border-slate-300">{rpm.identitas?.sekolah || 'SD Negeri Kalimantong'}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-slate-50/70">Tahun Ajaran</td>
              <td className="px-4 py-2.5 border border-slate-300">{rpm.identitas?.tahunAjaran || '2026/2027'}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-slate-50/70">Semester</td>
              <td className="px-4 py-2.5 border border-slate-300">{rpm.identitas?.semester || '1'}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-slate-50/70">Mata Pelajaran</td>
              <td className="px-4 py-2.5 border border-slate-300">{rpm.identitas?.mataPelajaran || '-'}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-slate-50/70">Kelas / Fase Capaian</td>
              <td className="px-4 py-2.5 border border-slate-300">{rpm.identitas?.kelasFase || '-'}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-slate-50/70">Topik</td>
              <td className="px-4 py-2.5 border border-slate-300">{rpm.identitas?.topik || rpm.identitas?.topikElemen || '-'}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 border border-slate-300 font-semibold bg-slate-50/70">Alokasi Waktu</td>
              <td className="px-4 py-2.5 border border-slate-300">{rpm.identitas?.alokasiWaktu || '2x40 Menit'}</td>
            </tr>

            {/* IDENTIFIKASI CATEGORY */}
            <tr className="bg-indigo-50/80 font-bold text-indigo-950">
              <td colSpan={2} className="px-4 py-2.5 border border-slate-300 uppercase tracking-wide font-extrabold text-[11px] bg-indigo-100/70 text-indigo-900">
                B. IDENTIFIKASI
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 border border-slate-300 font-semibold bg-slate-50/70 align-top">Identifikasi Murid</td>
              <td className="px-4 py-3 border border-slate-300 whitespace-pre-wrap leading-relaxed">
                {rpm.identifikasi?.muridOps || rpm.identifikasi?.identifikasiMurid || '-'}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 border border-slate-300 font-semibold bg-slate-50/70 align-top">Materi Pelajaran</td>
              <td className="px-4 py-3 border border-slate-300 whitespace-pre-wrap leading-relaxed">
                {rpm.identifikasi?.materiPelajaranOps || rpm.identifikasi?.materiPelajaran || '-'}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 border border-slate-300 font-semibold bg-slate-50/70 align-top">Dimensi Profil Lulusan</td>
              <td className="px-4 py-3 border border-slate-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 py-1">
                  {dplList.map((dpl, idx) => {
                    const isChecked = selectedDpl.some(d => dpl.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(dpl.slice(0, 4).toLowerCase()));
                    return (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold border ${isChecked ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-400 bg-white text-transparent'}`}>
                          ✓
                        </span>
                        <span className={isChecked ? 'font-bold text-slate-900' : 'text-slate-600'}>{dpl}</span>
                      </div>
                    );
                  })}
                </div>
              </td>
            </tr>

            {/* DESAIN PEMBELAJARAN CATEGORY */}
            <tr className="bg-indigo-50/80 font-bold text-indigo-950">
              <td colSpan={2} className="px-4 py-2.5 border border-slate-300 uppercase tracking-wide font-extrabold text-[11px] bg-indigo-100/70 text-indigo-900">
                C. DESAIN PEMBELAJARAN
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 border border-slate-300 font-semibold bg-slate-50/70 align-top">Capaian Pembelajaran</td>
              <td className="px-4 py-3 border border-slate-300 leading-relaxed">{rpm.desainPembelajaran?.capaianPembelajaranOps || rpm.desainPembelajaran?.capaianPembelajaran || '-'}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 border border-slate-300 font-semibold bg-slate-50/70 align-top">Lintas Disiplin Ilmu</td>
              <td className="px-4 py-3 border border-slate-300 leading-relaxed">{rpm.desainPembelajaran?.lintasDisiplinIlmuOps || rpm.desainPembelajaran?.lintasDisiplinIlmu || '-'}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 border border-slate-300 font-semibold bg-slate-50/70 align-top">Tujuan Pembelajaran</td>
              <td className="px-4 py-3 border border-slate-300 whitespace-pre-wrap leading-relaxed">{rpm.desainPembelajaran?.tujuanPembelajaran || '-'}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 border border-slate-300 font-semibold bg-slate-50/70 align-top">Topik Pembelajaran</td>
              <td className="px-4 py-3 border border-slate-300 leading-relaxed">{rpm.desainPembelajaran?.topikPembelajaranOps || rpm.desainPembelajaran?.topikPembelajaran || '-'}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 border border-slate-300 font-semibold bg-slate-50/70 align-top">Praktik Pedagogis</td>
              <td className="px-4 py-3 border border-slate-300 whitespace-pre-wrap leading-relaxed">{rpm.desainPembelajaran?.praktikPedagogis || '-'}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 border border-slate-300 font-semibold bg-slate-50/70 align-top">Kemitraan Pembelajaran</td>
              <td className="px-4 py-3 border border-slate-300 leading-relaxed">{rpm.desainPembelajaran?.kemitraanPembelajaranOps || rpm.desainPembelajaran?.kemitraanPembelajaran || '-'}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 border border-slate-300 font-semibold bg-slate-50/70 align-top">Lingkungan Pembelajaran</td>
              <td className="px-4 py-3 border border-slate-300 leading-relaxed">{rpm.desainPembelajaran?.lingkunganPembelajaran || '-'}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 border border-slate-300 font-semibold bg-slate-50/70 align-top">Pemanfaatan Digital</td>
              <td className="px-4 py-3 border border-slate-300 leading-relaxed">{rpm.desainPembelajaran?.pemanfaatanDigitalOps || rpm.desainPembelajaran?.pemanfaatanDigital || '-'}</td>
            </tr>

            {/* PENGALAMAN BELAJAR CATEGORY */}
            <tr className="bg-indigo-50/80 font-bold text-indigo-950">
              <td colSpan={2} className="px-4 py-2.5 border border-slate-300 uppercase tracking-wide font-extrabold text-[11px] bg-indigo-100/70 text-indigo-900">
                D. PENGALAMAN BELAJAR
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="px-4 py-3.5 border border-slate-300 space-y-3 leading-relaxed">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">Langkah-langkah Pembelajaran:</div>
                
                {/* Awal */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-300 space-y-1">
                  <div className="font-bold text-indigo-900 text-xs">
                    Kegiatan Awal (15 Menit) - {rpm.pengalamanBelajar?.langkahPembelajaran?.awalOps?.prinsip || 'Berkesadaran, bermakna, menggembirakan'}
                  </div>
                  <div className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                    {rpm.pengalamanBelajar?.kegiatanAwal || rpm.pengalamanBelajar?.langkahPembelajaran?.awalOps?.deskripsi || 'Awali dengan mengucap salam kemudian kegiatan berdoa dan mengecek kehadiran. Apersepsi, motivasi, dan pengkondisian yang membangun semangat.'}
                  </div>
                </div>

                {/* Inti */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-300 space-y-2">
                  <div className="font-bold text-indigo-900 text-xs">
                    Kegiatan Inti (60 Menit) - Mindful (Berkesadaran), Meaningful (Bermakna), Joyful (Menggembirakan)
                  </div>
                  <div className="text-slate-700 text-xs whitespace-pre-wrap leading-relaxed">
                    {rpm.pengalamanBelajar?.kegiatanInti ? (
                      <div className="bg-white p-3 rounded border border-slate-200">
                        {rpm.pengalamanBelajar.kegiatanInti}
                      </div>
                    ) : (
                      <div className="space-y-3 pl-2 border-l-2 border-indigo-400">
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">
                            Memahami ({rpm.pengalamanBelajar?.langkahPembelajaran?.inti?.memahami?.prinsip || 'Orientasi Masalah) (15 Menit'})
                          </span>
                          <ul className="list-disc list-inside text-xs text-slate-700 pl-1 space-y-1">
                            {(rpm.pengalamanBelajar?.langkahPembelajaran?.inti?.memahami?.kegiatan || ['Siswa mengamati tayangan stimulus kontekstual mengenai materi pokok.']).map((k, idx) => (
                              <li key={idx}>{k}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="font-bold text-slate-900 text-xs block">
                            Mengaplikasikan ({rpm.pengalamanBelajar?.langkahPembelajaran?.inti?.mengaplikasi?.prinsip || 'Penyelidikan Mandiri & Kelompok) (30 Menit'})
                          </span>
                          <ul className="list-disc list-inside text-xs text-slate-700 pl-1 space-y-1">
                            {(rpm.pengalamanBelajar?.langkahPembelajaran?.inti?.mengaplikasi?.kegiatan || ['Siswa berkolaborasi dalam kelompok kecil menyelesaikan tugas aplikatif.']).map((k, idx) => (
                              <li key={idx}>{k}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="font-bold text-slate-900 text-xs block">
                            Merefleksi ({rpm.pengalamanBelajar?.langkahPembelajaran?.inti?.merefleksi?.prinsip || 'Penyajian & Refleksi Solusi) (15 Menit'})
                          </span>
                          <ul className="list-disc list-inside text-xs text-slate-700 pl-1 space-y-1">
                            {(rpm.pengalamanBelajar?.langkahPembelajaran?.inti?.merefleksi?.kegiatan || ['Kelompok lain memberikan tanggapan dan refleksi konstruktif atas presentasi.']).map((k, idx) => (
                              <li key={idx}>{k}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Penutup */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-300 space-y-1">
                  <div className="font-bold text-indigo-900 text-xs">
                    Kegiatan Penutup (5 Menit) - {rpm.pengalamanBelajar?.langkahPembelajaran?.penutupOps?.prinsip || 'Berkesadaran, bermakna, dan menggembirakan'}
                  </div>
                  <div className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                    {rpm.pengalamanBelajar?.kegiatanPenutup || rpm.pengalamanBelajar?.langkahPembelajaran?.penutupOps?.deskripsi || 'Pendinginan, simpulan bersama, umpan balik konstruktif, rencana tindak lanjut, berdoa, dan salam.'}
                  </div>
                </div>
              </td>
            </tr>

            {/* ASESMEN PEMBELAJARAN CATEGORY */}
            <tr className="bg-indigo-50/80 font-bold text-indigo-950">
              <td colSpan={2} className="px-4 py-2.5 border border-slate-300 uppercase tracking-wide font-extrabold text-[11px] bg-indigo-100/70 text-indigo-900">
                E. ASESMEN PEMBELAJARAN
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 border border-slate-300 font-semibold bg-slate-50/70 align-top">Awal</td>
              <td className="px-4 py-3 border border-slate-300 leading-relaxed whitespace-pre-wrap">{rpm.asesmenPembelajaran?.awal || '-'}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 border border-slate-300 font-semibold bg-slate-50/70 align-top">Proses</td>
              <td className="px-4 py-3 border border-slate-300 leading-relaxed whitespace-pre-wrap">{rpm.asesmenPembelajaran?.proses || '-'}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 border border-slate-300 font-semibold bg-slate-50/70 align-top">Akhir</td>
              <td className="px-4 py-3 border border-slate-300 leading-relaxed whitespace-pre-wrap">{rpm.asesmenPembelajaran?.akhir || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signatures block */}
      <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-300 mt-6 text-center text-xs page-break-avoid">
        <div className="space-y-12">
          <p className="text-slate-600">Mengetahui,</p>
          <p className="font-bold text-slate-900 text-sm">Kepala Sekolah</p>
          <div className="pt-8">
            <p className="font-bold text-slate-900 underline text-xs">
              {typeof rpm.tandaTangan?.kepalaSekolah === 'object' && rpm.tandaTangan?.kepalaSekolah !== null
                ? (rpm.tandaTangan.kepalaSekolah as { nama: string; nip: string }).nama
                : (typeof rpm.tandaTangan?.kepalaSekolah === 'string' && rpm.tandaTangan.kepalaSekolah.trim() ? rpm.tandaTangan.kepalaSekolah : 'Soleh, S.Pd., M.Pd.')}
            </p>
            <p className="text-slate-500 text-[11px]">
              {typeof rpm.tandaTangan?.kepalaSekolah === 'object' && rpm.tandaTangan?.kepalaSekolah !== null
                ? (rpm.tandaTangan.kepalaSekolah as { nama: string; nip: string }).nip
                : 'NIP. 19750512 200003 1 004'}
            </p>
          </div>
        </div>

        <div className="space-y-12">
          <p className="text-slate-600">{rpm.tandaTangan?.tempatTanggal || 'Jember, 1 Juli 2025'}</p>
          <p className="font-bold text-slate-900 text-sm">Guru Mata Pelajaran</p>
          <div className="pt-8">
            <p className="font-bold text-slate-900 underline text-xs">
              {typeof rpm.tandaTangan?.guruMapel === 'object' && rpm.tandaTangan?.guruMapel !== null
                ? (rpm.tandaTangan.guruMapel as { nama: string; nip: string }).nama
                : (typeof rpm.tandaTangan?.guruMapel === 'string' && rpm.tandaTangan.guruMapel.trim() ? rpm.tandaTangan.guruMapel : (rpm.identitas?.penyusun || 'Lendi Ike Hermawan, S.Pd., Gr.'))}
            </p>
            <p className="text-slate-500 text-[11px]">
              {typeof rpm.tandaTangan?.guruMapel === 'object' && rpm.tandaTangan?.guruMapel !== null
                ? (rpm.tandaTangan.guruMapel as { nama: string; nip: string }).nip
                : 'NIP. ........................................'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RPMLampiranSection({ rpm }: { rpm: DeepLearningRPM }) {
  // 5 initial questions
  const soalAwal = rpm.lampiran?.soalAsesmenAwalList || [
    { no: 1, pertanyaan: `Apa yang kamu ketahui tentang konsep dan manfaat dari aktivitas ${rpm.identitas?.topik || 'materi ini'}?`, kunciJawaban: 'Aktivitas fisik yang melatih koordinasi dan kekuatan tubuh untuk kebugaran jasmani dan kesehatan organ vital.' },
    { no: 2, pertanyaan: 'Mengapa kita wajib melakukan pemanasan (warm-up) sebelum melakukan latihan fisik inti?', kunciJawaban: 'Untuk meningkatkan suhu tubuh, melancarkan peredaran darah, melenturkan otot dan sendi, serta mencegah terjadinya cedera.' },
    { no: 3, pertanyaan: 'Sebutkan bagian tubuh atau otot utama yang paling aktif bekerja saat melakukan gerakan ini!', kunciJawaban: 'Otot tungkai/kaki, otot lengan dan bahu, serta otot inti tubuh (core muscles) yang menjaga keseimbangan.' },
    { no: 4, pertanyaan: 'Sikap apa yang harus kamu utamakan saat berlatih mempraktikkan gerakan bersama teman satu kelompok?', kunciJawaban: 'Sikap sportivitas, saling menghargai kemampuan teman, bekerja sama secara kompak (kolaborasi), dan menjaga keselamatan bersama.' },
    { no: 5, pertanyaan: 'Bagaimana cara mengatur pernapasan yang tepat saat melakukan aktivitas fisik yang membutuhkan tenaga?', kunciJawaban: 'Menghirup napas teratur melalui hidung dan menghembuskannya secara terkontrol melalui mulut tanpa menahan napas.' }
  ];

  // Rubrik Sikap 4 Skala
  const rubrikSikapAspek = rpm.lampiran?.rubrikSikap?.aspekList || [
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
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-300 pb-2.5">
        <h3 className="font-bold text-slate-900 text-base uppercase tracking-tight">Lampiran Dokumen RPM</h3>
        <p className="text-xs text-slate-500 font-medium">Instrumen Asesmen Awal, Rubrik 4 Skala, dan Materi Ajar Lengkap (Terpisah dengan Tabel RPP)</p>
      </div>

      {/* Lampiran 1: Soal Asesmen Awal (5 Butir Soal & Jawaban) */}
      <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-300 space-y-3 page-break-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
          <h4 className="font-bold text-indigo-950 text-sm uppercase">
            Lampiran 1: Soal Asesmen Awal (5 Soal Beserta Jawaban)
          </h4>
          <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 self-start">
            Diagnostik Kognitif Awal
          </span>
        </div>
        <p className="text-xs text-slate-600">
          5 butir pertanyaan pemantik lisan/tertulis singkat untuk mengukur kesiapan pengetahuan awal murid terhadap topik yang dibahas:
        </p>

        <div className="space-y-3 pt-1">
          {soalAwal.map((item, idx) => (
            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">
                {item.no}. {item.pertanyaan}
              </p>
              <p className="text-emerald-800 font-medium pl-4 border-l-2 border-emerald-500 bg-emerald-50/50 py-1 px-2 rounded-r">
                <strong>Kunci Jawaban:</strong> {item.kunciJawaban}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lampiran 2: Rubrik Penilaian Sikap (4 Skala) */}
      <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-300 space-y-3 page-break-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
          <h4 className="font-bold text-indigo-950 text-sm uppercase">
            Lampiran 2: Rubrik Penilaian Sikap (4 Skala Penilaian)
          </h4>
          <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 self-start">
            Sesuai Dimensi Profil Lulusan (DPL)
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse bg-white border border-slate-300">
            <thead className="bg-slate-100 font-bold text-slate-900">
              <tr>
                <th className="p-2 border border-slate-300 w-1/5 text-left">Dimensi / Indikator</th>
                <th className="p-2 border border-slate-300 w-1/5 text-left">Skor 4 (Sangat Baik)</th>
                <th className="p-2 border border-slate-300 w-1/5 text-left">Skor 3 (Baik)</th>
                <th className="p-2 border border-slate-300 w-1/5 text-left">Skor 2 (Cukup)</th>
                <th className="p-2 border border-slate-300 w-1/5 text-left">Skor 1 (Perlu Bimbingan)</th>
              </tr>
            </thead>
            <tbody>
              {rubrikSikapAspek.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-300 align-top">
                    <span className="font-bold text-indigo-950 block">{item.dimensi}</span>
                    <span className="text-[11px] text-slate-600">{item.indikator}</span>
                  </td>
                  <td className="p-2 border border-slate-300 align-top">{item.skor4}</td>
                  <td className="p-2 border border-slate-300 align-top">{item.skor3}</td>
                  <td className="p-2 border border-slate-300 align-top">{item.skor2}</td>
                  <td className="p-2 border border-slate-300 align-top">{item.skor1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-600 italic">
          Rumus Penilaian: Nilai Sikap = (Jumlah Skor Diperoleh / Total Skor Maksimal) × 100
        </p>
      </div>

      {/* Lampiran 3: Rubrik Penilaian Pengetahuan (4 Skala) */}
      <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-300 space-y-3 page-break-avoid">
        <h4 className="font-bold text-indigo-950 text-sm border-b border-slate-200 pb-1.5 uppercase">
          Lampiran 3: Rubrik Penilaian Pengetahuan (4 Skala Penilaian)
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse bg-white border border-slate-300">
            <thead className="bg-slate-100 font-bold text-slate-900">
              <tr>
                <th className="p-2 border border-slate-300 text-left w-1/5">Aspek Penilaian</th>
                <th className="p-2 border border-slate-300 text-left w-1/5">Skor 4 (Sangat Baik)</th>
                <th className="p-2 border border-slate-300 text-left w-1/5">Skor 3 (Baik)</th>
                <th className="p-2 border border-slate-300 text-left w-1/5">Skor 2 (Cukup)</th>
                <th className="p-2 border border-slate-300 text-left w-1/5">Skor 1 (Kurang)</th>
              </tr>
            </thead>
            <tbody>
              {(rpm.lampiran?.penilaianPengetahuan?.pedomanSkor || [
                { aspek: 'Kelengkapan Jawaban', skor4: 'Semua pertanyaan pemahaman dan studi kasus pada LKPD dijawab tuntas dan lengkap.', skor3: 'Sebagian besar pertanyaan dijawab lengkap sesuai instruksi.', skor2: 'Hanya separuh pertanyaan yang dijawab, beberapa bagian kosong.', skor1: 'Hampir seluruh lembar jawaban kosong atau tidak diisi.' },
                { aspek: 'Ketepatan Konsep Materi', skor4: 'Seluruh penjelasan konsep gerak dan fungsi kesehatan sangat tepat dan akurat.', skor3: 'Konsep materi dijelaskan dengan benar, hanya 1 kekeliruan kecil.', skor2: 'Beberapa penjelasan konsep masih keliru atau rancu.', skor1: 'Penjelasan konsep salah seluruhnya.' }
              ]).map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-300 font-bold text-slate-900 align-top">{p.aspek}</td>
                  <td className="p-2 border border-slate-300 align-top">{p.skor4}</td>
                  <td className="p-2 border border-slate-300 align-top">{p.skor3}</td>
                  <td className="p-2 border border-slate-300 align-top">{p.skor2}</td>
                  <td className="p-2 border border-slate-300 align-top">{p.skor1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-600 italic">
          Rumus Penilaian: Nilai Akhir = (Jumlah Skor Diperoleh / 16) × 100
        </p>
      </div>

      {/* Lampiran 4: Rubrik Penilaian Keterampilan (4 Skala) */}
      <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-300 space-y-3 page-break-avoid">
        <h4 className="font-bold text-indigo-950 text-sm border-b border-slate-200 pb-1.5 uppercase">
          Lampiran 4: Rubrik Penilaian Keterampilan (4 Skala Penilaian)
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse bg-white border border-slate-300">
            <thead className="bg-slate-100 font-bold text-slate-900">
              <tr>
                <th className="p-2 border border-slate-300 text-left w-1/5">Aspek Keterampilan</th>
                <th className="p-2 border border-slate-300 text-left w-1/5">Skor 4 (Sangat Baik)</th>
                <th className="p-2 border border-slate-300 text-left w-1/5">Skor 3 (Baik)</th>
                <th className="p-2 border border-slate-300 text-left w-1/5">Skor 2 (Cukup)</th>
                <th className="p-2 border border-slate-300 text-left w-1/5">Skor 1 (Kurang)</th>
              </tr>
            </thead>
            <tbody>
              {(rpm.lampiran?.penilaianKeterampilan?.pedomanSkor || [
                { aspek: 'Teknik Sikap Awalan & Tumpuan', skor4: 'Sikap awalan tubuh seimbang, posisi kaki/tumpuan sangat akurat dan mantap.', skor3: 'Sikap awalan cukup baik dan seimbang, tumpuan tepat.', skor2: 'Sikap awalan kurang seimbang, posisi tumpuan sering keliru.', skor1: 'Sikap awalan salah total dan tidak siap.' },
                { aspek: 'Koordinasi Fase Gerakan Inti', skor4: 'Gerakan luwes, irama gerak terkoordinasi sempurna, dan bertenaga.', skor3: 'Gerakan inti cukup terkoordinasi dengan baik.', skor2: 'Gerakan inti kaku atau terputus-putus.', skor1: 'Tidak mampu melakukan koordinasi gerakan inti.' }
              ]).map((k, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-300 font-bold text-slate-900 align-top">{k.aspek}</td>
                  <td className="p-2 border border-slate-300 align-top">{k.skor4}</td>
                  <td className="p-2 border border-slate-300 align-top">{k.skor3}</td>
                  <td className="p-2 border border-slate-300 align-top">{k.skor2}</td>
                  <td className="p-2 border border-slate-300 align-top">{k.skor1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-600 italic">
          Rumus Penilaian: Nilai Akhir = (Jumlah Skor Diperoleh / 16) × 100
        </p>
      </div>

      {/* Lampiran 5: Asesmen Akhir Pembelajaran (5 Soal Beserta Jawaban / Proyek) */}
      <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-300 space-y-3 page-break-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
          <h4 className="font-bold text-indigo-950 text-sm uppercase">
            Lampiran 5: Asesmen Akhir Pembelajaran (Sumatif Lingkup Materi)
          </h4>
          <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 self-start">
            5 Soal Sumatif + Jawaban / Proyek
          </span>
        </div>
        <p className="text-xs text-slate-600">
          Instrumen penilaian akhir untuk mengukur ketuntasan kompetensi murid pada lingkup materi:
        </p>

        <div className="space-y-3 pt-1">
          {(rpm.lampiran?.soalAsesmenAkhirList || [
            { no: 1, pertanyaan: `Jelaskan konsep dasar, variasi pola gerak, dan prinsip pelaksanaan aktivitas ${rpm.identitas?.topik || 'materi ini'}!`, kunciJawaban: 'Menjelaskan pengertian, ragam variasi gerak, posisi tubuh yang benar, dan prinsip keselamatan gerak secara sistematis.' },
            { no: 2, pertanyaan: 'Bagaimana cara mengatasi kendala teknis dan menjaga ritme keseimbangan saat melakukan aktivitas fisik ini?', kunciJawaban: 'Memusatkan perhatian (mindful), mengatur napas teratur, menyesuaikan tumpuan kaki, dan melakukan adaptasi gerak.' },
            { no: 3, pertanyaan: 'Analisis dampak jangka panjang dari pembiasaan aktivitas fisik ini terhadap kebugaran jasmani dan kesehatan organ vital!', kunciJawaban: 'Meningkatkan kapasitas kardiorespirasi (daya tahan paru-jantung), menguatkan massa otot, kelenturan sendi, dan imunitas tubuh.' },
            { no: 4, pertanyaan: 'Rancanglah sebuah modifikasi peraturan permainan atau strategi tim yang menerapkan nilai sportivitas (fair play) dan inklusif!', kunciJawaban: 'Modifikasi lapangan/alat yang memberi kesempatan setara bagi semua anggota tanpa diskriminasi, serta mengutamakan keselamatan.' },
            { no: 5, pertanyaan: 'Tuliskan refleksi evaluasi diri tentang perkembangan keterampilan, kedisiplinan, dan kerja sama tim yang Anda capai selama 1 bab ini!', kunciJawaban: 'Refleksi jujur mengenai peningkatan teknik gerak, kemampuan mengelola emosi dalam kompetisi, dan kontribusi aktif dalam kelompok.' }
          ]).map((item, idx) => (
            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">
                {item.no}. {item.pertanyaan}
              </p>
              <p className="text-emerald-800 font-medium pl-4 border-l-2 border-emerald-500 bg-emerald-50/50 py-1 px-2 rounded-r">
                <strong>Kunci Jawaban:</strong> {item.kunciJawaban}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lampiran 6: Materi Ajar Ringkas */}
      <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-300 space-y-3 page-break-avoid">
        <h4 className="font-bold text-indigo-950 text-sm border-b border-slate-200 pb-1.5 uppercase">
          Lampiran 6: Materi Ajar Ringkas dan Jelas
        </h4>
        <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
          {rpm.lampiran?.materiAjarRingkas || rpm.lampiran?.materiAjar || `RINGKASAN MATERI AJAR: ${rpm.identitas?.topik || 'Topik Pembelajaran'}
1. Pengertian & Konsep Dasar: Pembahasan konsep dasar dan prinsip mekanika gerak terkoordinasi.
2. Manfaat Pembelajaran: Menjaga kebugaran jasmani, kesehatan organ pernapasan & sirkulasi darah.
3. Prinsip Keselamatan: Pemanasan terarah, posisi tumpuan yang aman, hidrasi teratur, dan pendinginan relaksasi.`}
        </div>
      </div>
    </div>
  );
}

export function RPMLkpdSection({ rpm, selectedIndex }: { rpm: DeepLearningRPM; selectedIndex?: number }) {
  const lkpds = selectedIndex !== undefined ? [rpm.lkpdList[selectedIndex]] : rpm.lkpdList;

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 flex items-center justify-between">
        <span><strong>Format Standar LKPD:</strong> Lembar Kerja Peserta Didik disajikan secara mandiri terstruktur (NON-TABEL) siap cetak dan dibagikan ke siswa.</span>
        <span className="font-bold bg-amber-200/60 px-2 py-0.5 rounded text-[10px]">NON-TABEL</span>
      </div>

      {lkpds.map((lkpd, idx) => {
        const actualIdx = selectedIndex !== undefined ? selectedIndex : idx;
        if (!lkpd) return null;
        return (
          <div key={actualIdx} className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-sm space-y-5 page-break-avoid">
            {/* LKPD Header (Non-table) */}
            <div className="text-center border-b-2 border-slate-800 pb-3">
              <span className="text-[10px] font-extrabold tracking-widest text-indigo-700 uppercase bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 inline-block mb-1">
                LEMBAR KERJA PESERTA DIDIK (LKPD)
              </span>
              <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                {lkpd.title || `Pertemuan ${actualIdx + 1}: ${rpm.identitas?.topik || 'Materi Pokok'}`}
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {rpm.identitas?.sekolah || 'SD Negeri Kalimantong'} &bull; Tahun Ajaran {rpm.identitas?.tahunAjaran || '2026/2027'}
              </p>
            </div>

            {/* Student Identity Card (NON-TABEL) */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-300 text-xs space-y-2">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wide">
                1. IDENTITAS DIRI
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div><strong>Nama Peserta Didik:</strong> .....................................................</div>
                <div><strong>Mata Pelajaran:</strong> {rpm.identitas?.mataPelajaran || 'PJOK'}</div>
                <div><strong>No. Absen / Kelas:</strong> .......... / {rpm.identitas?.kelasFase || 'Kelas 7 / Fase D'}</div>
                <div><strong>Hari / Tanggal:</strong> .....................................................</div>
                <div className="sm:col-span-2"><strong>Topik / Materi:</strong> {rpm.identitas?.topik || rpm.identitas?.topikElemen || '-'}</div>
              </div>
            </div>

            {/* Full Content (NON-TABEL) */}
            <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans bg-white p-5 rounded-lg border border-slate-200 shadow-inner">
              {lkpd.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
