import React, { useState } from 'react';
import { 
  Award, 
  BookOpen, 
  Check, 
  CheckCircle2, 
  ClipboardCheck, 
  Download, 
  FileSignature, 
  Heart, 
  Printer, 
  Scale, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Building2, 
  Calendar,
  Share2,
  FileText
} from 'lucide-react';
import { downloadDocFile, downloadJsonFile } from '../lib/exportUtils';
import { downloadHtmlAsPdf, printHtmlDocument } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getKodeEtikKkoCetakPrompts } from '../utils/aiPromptGenerators';

export default function KodeEtikIkrarView() {
  const [activeTab, setActiveTab] = useState<'etik' | 'ikrar' | 'komitmen'>('etik');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  // States for Commitment Certificate
  const [teacherName, setTeacherName] = useState('San Rafsanjani, S.Pd.');
  const [teacherNip, setTeacherNip] = useState('19940812 202402 1 002');
  const [schoolName, setSchoolName] = useState('SD Negeri Pintar Bersama');
  const [district, setDistrict] = useState('Kota Bandung');
  const [commitDate, setCommitDate] = useState(new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }));
  const [isSigned, setIsSigned] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Official Indonesian Teacher Code of Ethics
  const kodeEtikList = [
    {
      no: 1,
      title: "Bakti Membimbing Peserta Didik",
      text: "Guru berbakti membimbing peserta didik untuk membentuk manusia Indonesia seutuhnya yang berjiwa Pancasila.",
      pedagogy: "Guru PJOK mengedepankan pembinaan karakter, sportivitas, kejujuran, dan keadilan saat mengajar di lapangan maupun di dalam kelas."
    },
    {
      no: 2,
      title: "Kejujuran Profesional",
      text: "Guru memiliki dan melaksanakan kejujuran profesional.",
      pedagogy: "Menilai aspek motorik, kognitif, dan afektif siswa secara objektif tanpa diskriminasi, serta jujur dalam melaporkan perkembangan kebugaran jasmani."
    },
    {
      no: 3,
      title: "Informasi & Pembinaan Siswa",
      text: "Guru berusaha memperoleh informasi tentang peserta didik sebagai bahan melakukan bimbingan dan pembinaan.",
      pedagogy: "Memahami kondisi fisik, riwayat medis, serta minat olahraga siswa agar bimbingan aktivitas fisik berlangsung aman dan tepat guna."
    },
    {
      no: 4,
      title: "Suasana Sekolah yang Kondusif",
      text: "Guru menciptakan suasana sekolah sebaik-baiknya yang menunjang berhasilnya proses belajar-mengajar.",
      pedagogy: "Menciptakan iklim pembelajaran outdoor yang menyenangkan, aman dari cedera, suportif, serta memotivasi siswa untuk aktif bergerak."
    },
    {
      no: 5,
      title: "Kemitraan dengan Orang Tua & Masyarakat",
      text: "Guru memelihara hubungan baik dengan orang tua murid dan masyarakat sekitarnya untuk membina peran serta dan rasa tanggung jawab bersama terhadap pendidikan.",
      pedagogy: "Mengomunikasikan pentingnya kebiasaan hidup sehat di rumah dan melibatkan orang tua dalam memantau kebugaran anak."
    },
    {
      no: 6,
      title: "Pengembangan Mutu Profesi",
      text: "Guru secara pribadi dan bersama-sama mengembangkan dan meningkatkan mutu dan martabat profesinya.",
      pedagogy: "Aktif dalam KKG PJOK (Kelompok Kerja Guru), mengikuti pelatihan olahraga pendidikan terbaru, dan terus memperbarui kompetensi diri."
    },
    {
      no: 7,
      title: "Hubungan Kekeluargaan Profesional",
      text: "Guru memelihara hubungan seprofesi, semangat kekeluargaan, dan kesetiakawanan sosial.",
      pedagogy: "Saling mendukung sesama pendidik, berkolaborasi membuat modul ajar bersama, dan menjunjung tinggi kehormatan profesi guru."
    },
    {
      no: 8,
      title: "Sinergi dengan Organisasi Profesi (PGRI)",
      text: "Guru secara bersama-sama memelihara dan meningkatkan mutu organisasi PGRI sebagai sarana perjuangan dan pengabdian.",
      pedagogy: "Berpartisipasi aktif dalam memajukan kualitas pendidikan nasional melalui kontribusi nyata di organisasi profesi keguruan."
    },
    {
      no: 9,
      title: "Kepatuhan Kebijakan Pemerintah",
      text: "Guru melaksanakan segala kebijakan Pemerintah dalam bidang pendidikan.",
      pedagogy: "Menerapkan kurikulum Merdeka secara kreatif, serta mensukseskan program kebugaran jasmani nasional dari Kementerian Pendidikan."
    }
  ];

  // Official Indonesian Teacher Pledge
  const ikrarList = [
    {
      no: 1,
      pledge: "Kami Guru Indonesia, adalah pendidik bangsa yang bertakwa kepada Tuhan Yang Maha Esa.",
      meaning: "Landasan spiritual dan ketakwaan sebagai fondasi utama dalam mendidik akhlak mulia generasi penerus bangsa."
    },
    {
      no: 2,
      pledge: "Kami Guru Indonesia, adalah pengemban dan pelaksana Pancasila dan Undang-Undang Dasar 1945.",
      meaning: "Komitmen setia terhadap ideologi negara dan mengintegrasikan nilai-nilai luhur Pancasila dalam setiap tindakan pembelajaran."
    },
    {
      no: 3,
      pledge: "Kami Guru Indonesia, bersatu dalam wadah Persatuan Guru Republik Indonesia, adalah pembela dan pengamal Pancasila dan Undang-Undang Dasar 1945.",
      meaning: "Menjunjung tinggi persatuan korps guru demi mewujudkan cita-cita proklamasi kemerdekaan yang berasaskan kekeluargaan."
    },
    {
      no: 4,
      pledge: "Kami Guru Indonesia, bertekad bulat mewujudkan tujuan nasional dalam mencerdaskan kehidupan bangsa.",
      meaning: "Tekad tanpa lelah untuk mencerdaskan intelektual, emosional, spiritual, serta kesehatan jasmani seluruh anak bangsa."
    },
    {
      no: 5,
      pledge: "Kami Guru Indonesia, bersumpah untuk membaktikan diri guna kepentingan nusa, bangsa, dan kemanusiaan.",
      meaning: "Menempatkan pengabdian mulia ini di atas kepentingan pribadi untuk kemaslahatan masyarakat dan peradaban dunia."
    }
  ];

  const handleCopyText = () => {
    let cleanText = "KODE ETIK GURU INDONESIA\n";
    cleanText += "=========================\n";
    kodeEtikList.forEach(item => {
      cleanText += `${item.no}. ${item.text}\n`;
    });

    cleanText += "\n\nIKRAR GURU INDONESIA\n";
    cleanText += "====================\n";
    ikrarList.forEach(item => {
      cleanText += `${item.no}. ${item.pledge}\n`;
    });

    navigator.clipboard.writeText(cleanText)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
  };

  const buildKodeEtikHtml = () => {
    return `
      <div style="font-family: 'Times New Roman', Times, serif; padding: 15px; line-height: 1.55;">
        <div class="header" data-f4-kop="true" style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 18px;">
          <h2 style="margin: 0; text-transform: uppercase; font-size: 14pt;">KODE ETIK & IKRAR GURU INDONESIA</h2>
          <p style="margin: 5px 0 0 0; font-size: 10pt; font-style: italic;">Pedoman Moral dan Etika Profesi Pendidik Bangsa • Satuan Pendidikan: ${schoolName}</p>
        </div>

        <div data-f4-section="Bagian 1: I. Kode Etik Guru Indonesia (9 Butir Pedoman)" data-f4-orientation="portrait">
          <h3 style="text-align: center; text-transform: uppercase; margin-bottom: 12px; font-size: 12pt; font-weight: bold; color: #111;">I. KODE ETIK GURU INDONESIA</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            ${kodeEtikList.map(item => `
              <tr>
                <td style="vertical-align: top; padding: 5px; font-size: 10.5pt; border: none;" width="5%"><strong>${item.no}.</strong></td>
                <td style="vertical-align: top; padding: 5px; font-size: 10.5pt; border: none;">
                  <strong>${item.title}</strong><br/>
                  ${item.text}<br/>
                  <span style="font-size: 9.5pt; color: #555; font-style: italic;">Penerapan Pedagogis: ${item.pedagogy}</span>
                </td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div data-f4-section="Bagian 2: II. Ikrar Guru Indonesia & III. Pakta Komitmen Guru" data-f4-orientation="portrait">
          <h3 style="text-align: center; text-transform: uppercase; margin-bottom: 12px; font-size: 12pt; font-weight: bold; color: #111;">II. IKRAR GURU INDONESIA</h3>
          <ol style="font-size: 11pt; margin-bottom: 24px; padding-left: 20px;">
            ${ikrarList.map(item => `
              <li style="margin-bottom: 8px;">
                <strong>${item.pledge}</strong><br/>
                <span style="font-size: 9.5pt; color: #555;">Makna: ${item.meaning}</span>
              </li>
            `).join('')}
          </ol>

          <div style="margin-top: 30px; border: 1px solid #000; padding: 15px; background-color: #fcfcfc; page-break-inside: avoid;">
            <h4 style="text-align: center; text-transform: uppercase; margin: 0 0 10px 0; font-size: 11pt;">KOMITMEN GURU INDONESIA</h4>
            <p style="text-align: center; font-size: 10.5pt; margin: 5px 0;">
              Saya yang bertanda tangan di bawah ini, berkomitmen penuh untuk menjunjung tinggi, 
              menghayati, dan mengamalkan Kode Etik serta Ikrar Guru Indonesia dalam tugas pengabdian sehari-hari.
            </p>
            <table class="no-border" style="width: 100%; margin-top: 20px; font-size: 10.5pt; border: none;">
              <tr>
                <td width="50%" style="border: none;"></td>
                <td width="50%" style="text-align: center; border: none;">
                  ${district}, ${commitDate}<br/>
                  <strong>Guru yang Berkomitmen,</strong>
                  <br/><br/><br/><br/>
                  <u><strong>${teacherName}</strong></u><br/>
                  NIP. ${teacherNip || '-'}<br/>
                  Satuan Pendidikan: ${schoolName}
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;
  };

  const handleExportDoc = () => {
    downloadDocFile(`Kode_Etik_dan_Ikrar_Guru_F4_${teacherName.replace(/\s+/g, '_')}`, buildKodeEtikHtml());
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const docHtml = buildKodeEtikHtml();
      const fileName = `Kode_Etik_dan_Ikrar_Guru_F4_${teacherName.replace(/\s+/g, '_')}.pdf`;
      await downloadHtmlAsPdf(docHtml, fileName, 'portrait');
    } catch (err) {
      console.error('Error generating Kode Etik F4 PDF:', err);
      printHtmlDocument(buildKodeEtikHtml(), `Kode Etik & Ikrar Guru F4 - ${teacherName}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    printHtmlDocument(buildKodeEtikHtml(), `Kode Etik & Ikrar Guru F4 - ${teacherName}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="kode-etik-ikrar-container">
      
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-12 pointer-events-none">
          <Scale className="w-80 h-80" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Etika &amp; Janji Luhur Profesi
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              Kode Etik &amp; Ikrar Guru Indonesia
            </h2>
            <p className="text-teal-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Panduan moral, pedoman sikap, dan janji suci Guru Republik Indonesia berdasarkan Pancasila, UUD 1945, dan undang-undang keguruan formal. Gunakan sebagai pembinaan karakter guru sejati.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <ExportJsonPromptAiButtons
              onExportJson={() => {
                const filename = `Kode_Etik_dan_Ikrar_Guru_${teacherName.replace(/\s+/g, '_')}.json`;
                downloadJsonFile(filename, {
                  guru: teacherName,
                  nip: teacherNip,
                  sekolah: schoolName,
                  daerah: district,
                  tanggal: commitDate,
                  kodeEtik: kodeEtikList,
                  ikrarGuru: ikrarList
                });
              }}
              onOpenPromptAi={() => setShowPromptModal(true)}
            />
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-all border border-white/10 cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Tersalin' : 'Salin Semua'}</span>
            </button>
            <button
              onClick={handleExportDoc}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Word (Doc)</span>
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF (F4)'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Piagam (F4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-6 no-print">
        <button
          onClick={() => setActiveTab('etik')}
          className={`pb-4 px-6 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'etik' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          Kode Etik Guru
        </button>
        <button
          onClick={() => setActiveTab('ikrar')}
          className={`pb-4 px-6 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ikrar' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          Ikrar Guru
        </button>
        <button
          onClick={() => setActiveTab('komitmen')}
          className={`pb-4 px-6 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'komitmen' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSignature className="w-4 h-4" />
          Komitmen &amp; Tanda Tangan Komitmen
        </button>
      </div>

      {/* TAB 1: KODE ETIK GURU INDONESIA */}
      {activeTab === 'etik' && (
        <div className="space-y-6">
          
          {/* Legal Basis Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
            <BookOpen className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px] text-amber-800 mb-0.5">Dasar Hukum &amp; Ketetapan</p>
              Kongres PGRI XX di Palembang menetapkan rumusan resmi Kode Etik Guru Indonesia sebagai landasan moral dan pedoman perilaku profesi guru dalam melaksanakan pengabdian mendidik bangsa. Hal ini sejalan dengan pasal 43 Undang-Undang Nomor 14 Tahun 2005 tentang Guru dan Dosen.
            </div>
          </div>

          {/* Interactive Code of Ethics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kodeEtikList.map((item) => (
              <div 
                key={item.no} 
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold flex items-center justify-center text-xs">
                      {item.no}
                    </span>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
                      Poin {item.no}
                    </span>
                  </div>
                  
                  <h3 className="font-extrabold text-sm text-slate-800">
                    {item.title}
                  </h3>
                  
                  <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                    "{item.text}"
                  </p>
                </div>

                <div className="bg-emerald-50/40 rounded-lg p-3.5 border border-emerald-100/50 mt-4">
                  <span className="text-[9px] uppercase font-black text-emerald-800 tracking-wider block mb-1">Implementasi PJOK SD:</span>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    {item.pedagogy}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 2: IKRAR GURU INDONESIA */}
      {activeTab === 'ikrar' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          
          <div className="text-center space-y-2 py-4">
            <h3 className="text-lg font-black uppercase text-slate-800 tracking-wide">IKRAR GURU INDONESIA</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">Janji setia pendidik bangsa yang diucapkan secara khidmat pada setiap upacara besar guru nasional.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 sm:p-10 space-y-8 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-600"></div>
            
            {ikrarList.map((item) => (
              <div key={item.no} className="flex gap-4 sm:gap-6 items-start">
                <span className="w-7 h-7 rounded-md bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                  {item.no}
                </span>
                <div className="space-y-1.5 flex-1">
                  <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed">
                    "{item.pledge}"
                  </p>
                  <p className="text-xs text-slate-500 italic">
                    <strong>Refleksi &amp; Makna:</strong> {item.meaning}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 3: SIGNING COMMITMENT CHARTER */}
      {activeTab === 'komitmen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Form Inputs */}
          <div className="lg:col-span-4 bg-white rounded-xl shadow-md border border-slate-100 p-6 space-y-4 h-fit">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <FileSignature className="w-4 h-4 text-emerald-600" />
              Identitas Komitmen
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Guru</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Misal: San Rafsanjani, S.Pd."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIP (Kosongkan jika Honorer/Swasta)</label>
                <input
                  type="text"
                  value={teacherNip}
                  onChange={(e) => setTeacherNip(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="NIP. 19940812 202402 1 002"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Satuan Pendidikan</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Misal: SD Negeri Pintar Bersama"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kabupaten / Kota Daerah</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Kota Bandung"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Komitmen</label>
                <input
                  type="text"
                  value={commitDate}
                  onChange={(e) => setCommitDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsSigned(!isSigned)}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSigned 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isSigned ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Buka Kunci Tanda Tangan
                  </>
                ) : (
                  <>
                    <FileSignature className="w-4 h-4" />
                    Bubuhkan Tanda Tangan
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Preview Certificate Panel */}
          <div className="lg:col-span-8">
            <div className="bg-amber-50/20 rounded-2xl border-4 border-double border-amber-600/60 p-6 sm:p-12 shadow-xl space-y-6 relative overflow-hidden bg-white max-w-3xl mx-auto">
              
              {/* Outer classic certificate border */}
              <div className="absolute inset-2 border border-amber-600/30 rounded-lg pointer-events-none"></div>

              {/* Certificate Header */}
              <div className="text-center space-y-2 relative z-10">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/20">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="text-[10px] uppercase font-black tracking-widest text-amber-800">
                  PIAGAM KOMITMEN PROFESIONAL
                </h4>
                <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">
                  PENEGAKAN KODE ETIK &amp; IKRAR GURU
                </h2>
                <div className="w-24 h-0.5 bg-amber-600 mx-auto"></div>
              </div>

              {/* Commitment Text */}
              <div className="text-center space-y-4 max-w-xl mx-auto text-xs sm:text-sm text-slate-700 leading-relaxed relative z-10 pt-4">
                <p>
                  Saya yang beridentitas di bawah ini, menyatakan berkomitmen secara sadar, tulus, dan penuh tanggung jawab untuk menghayati, menjunjung tinggi, serta senantiasa menerapkan:
                </p>
                
                <div className="flex justify-center gap-6 font-bold text-amber-900 my-4 text-[11px] sm:text-xs">
                  <span className="flex items-center gap-1.5 bg-amber-100/60 px-3 py-1.5 rounded-full border border-amber-200">
                    <Check className="w-3.5 h-3.5 text-amber-700" />
                    9 Sumpah Kode Etik Guru
                  </span>
                  <span className="flex items-center gap-1.5 bg-amber-100/60 px-3 py-1.5 rounded-full border border-amber-200">
                    <Check className="w-3.5 h-3.5 text-amber-700" />
                    5 Janji Luhur Ikrar Guru
                  </span>
                </div>

                <p>
                  Demi mendukung kualitas proses pendidikan nasional, mengawal tumbuh kembang peserta didik, dan memelihara martabat profesi pendidik yang mulia di Negara Kesatuan Republik Indonesia.
                </p>
              </div>

              {/* Signed Identity Grid */}
              <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 max-w-md mx-auto text-xs space-y-1 relative z-10">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-400">Nama Pendidik:</span>
                  <span className="font-extrabold text-slate-800">{teacherName || '_________________'}</span>
                </div>
                {teacherNip && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-400">NIP Resmi:</span>
                    <span className="font-medium text-slate-700">{teacherNip}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit Sekolah:</span>
                  <span className="font-extrabold text-slate-800">{schoolName || '_________________'}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 text-center text-xs pt-8 relative z-10">
                <div>
                  <p className="text-slate-400">Saksi Pimpinan,</p>
                  <p className="font-bold text-slate-800 mt-0.5">Kepala Sekolah</p>
                  <div className="h-14"></div>
                  <p className="font-extrabold text-slate-850 underline">_____________________</p>
                </div>
                <div className="relative">
                  <p className="text-slate-500">{district}, {commitDate}</p>
                  <p className="font-bold text-slate-800 mt-0.5">Guru yang Menyatakan,</p>
                  
                  {/* Signed Stamp */}
                  {isSigned ? (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 bg-emerald-600/10 border-4 border-dashed border-emerald-600 text-emerald-700 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg tracking-widest pointer-events-none select-none z-20">
                      KOMITMEN AKTIF
                    </div>
                  ) : null}

                  <div className="h-14 flex items-center justify-center font-serif italic text-emerald-700 font-bold">
                    {isSigned ? teacherName : ''}
                  </div>
                  <p className="font-extrabold text-slate-850 underline">{teacherName || '_____________________'}</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Kode Etik & Ikrar Guru PJOK"
        subtitle="Panduan Moral & Keteladanan Pendidik Jasmani Kurikulum Merdeka"
        tabs={getKodeEtikKkoCetakPrompts("Kode Etik dan Integritas Guru PJOK")}
        defaultActiveTab="prompt_menu"
        jsonData={{
          guru: teacherName,
          nip: teacherNip,
          sekolah: schoolName,
          daerah: district,
          tanggal: commitDate,
          kodeEtik: kodeEtikList,
          ikrarGuru: ikrarList
        }}
        jsonFilename={`Kode_Etik_dan_Ikrar_Guru_${teacherName.replace(/\s+/g, '_')}.json`}
      />
    </div>
  );
}
