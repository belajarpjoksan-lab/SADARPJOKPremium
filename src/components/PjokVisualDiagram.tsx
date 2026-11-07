import React from 'react';
import { 
  Activity, 
  Dumbbell, 
  Target, 
  Trophy, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  Info,
  Maximize2
} from 'lucide-react';

export type PjokVisualType = 
  | 'sepakbola' 
  | 'voli' 
  | 'basket' 
  | 'kasti' 
  | 'senam' 
  | 'atletik' 
  | 'kebugaran' 
  | 'renang' 
  | 'gobaksodor' 
  | 'silat';

export interface PjokVisualDiagramProps {
  type: PjokVisualType;
  caption?: string;
  sekolah?: string;
  details?: { label: string; desc: string }[];
  compact?: boolean;
}

export const PJOK_DIAGRAM_CATALOG: {
  type: PjokVisualType;
  title: string;
  subtitle: string;
  category: string;
  description: string;
}[] = [
  {
    type: 'sepakbola',
    title: 'Sepak Bola Mini: Teknik Passing & Stopping',
    subtitle: 'Lapangan Mini Rumput SD Negeri Kalimantong',
    category: 'Permainan Bola Besar',
    description: 'Diagram posisi kaki tumpu di samping bola (10-15 cm), pergelangan kaki dalam memutar keluar, dan lintasan passing mendatar 6 meter antar siswa.'
  },
  {
    type: 'voli',
    title: 'Bola Voli: Posisi Tangan & Passing Bawah',
    subtitle: 'Kuda-kuda Lutut Mengeper & Sudut Lengan 45°',
    category: 'Permainan Bola Besar',
    description: 'Ilustrasi genggaman ibu jari sejajar, lengan terkunci rapat lurus ke bawah, dan ayunan menerima bola melambung ke arah pengumpan.'
  },
  {
    type: 'basket',
    title: 'Bola Basket: Chest Pass & Bounce Pass',
    subtitle: 'Operan Setinggi Dada & Pantulan 2/3 Lantai',
    category: 'Permainan Bola Besar',
    description: 'Lintasan dorongan dua tangan setinggi dada (chest pass) dan operan memantul ke lantai (bounce pass) menuju kawan satu regu.'
  },
  {
    type: 'kasti',
    title: 'Denah Lapangan Kasti & Posisi Regu',
    subtitle: 'Tiang Pertolongan & Tiang Hinggap I, II, III',
    category: 'Permainan Bola Kecil',
    description: 'Skema denah lapangan kasti lengkap: ruang pemukul, ruang pelambung, ruang bebas, tiang pertolongan, dan arah lari pelari.'
  },
  {
    type: 'senam',
    title: 'Senam Lantai: 5 Tahap Guling Depan (Forward Roll)',
    subtitle: 'Jongkok - Dagu Dada - Tengkuk Matras - Mengguling - Berdiri',
    category: 'Senam Ketangkasan',
    description: 'Urutan gerak keselamatan guling depan di atas matras dengan titik tumpuan tengkuk (bukan ubun-ubun kepala) demi keselamatan leher.'
  },
  {
    type: 'atletik',
    title: 'Atletik: Start Jongkok & Bak Lompat Jauh',
    subtitle: 'Aba-aba Bersedia - Siap - Ya! & Papan Tolakan',
    category: 'Aktivitas Atletik',
    description: 'Posisi tiga aba-aba start pendek/menengah lari sprint 50m dan tahapan awalan melayang di atas bak pasir lompat jauh.'
  },
  {
    type: 'kebugaran',
    title: 'Kebugaran Jasmani: Sirkuit 4 Pos Latihan',
    subtitle: 'Shuttle Run, Push-up, Sit-up, & Step-up SDN Kalimantong',
    category: 'Kebugaran & Daya Tahan',
    description: 'Rute sirkuit training 4 pos terstruktur untuk melatih kelincahan, kekuatan otot lengan, otot perut, dan daya tahan jantung-paru.'
  },
  {
    type: 'gobaksodor',
    title: 'Permainan Tradisional: Lapangan Gobak Sodor',
    subtitle: '6 Petak Lapangan Garis Kapur Lapangan SDN Kalimantong',
    category: 'Permainan Tradisional',
    description: 'Denah petak hadang/gobak sodor: garis sodor penjelajah tengah, garis pembatas, dan rute pemain penyerang menerobos pertahanan.'
  },
  {
    type: 'renang',
    title: 'Aktivitas Air: Gerak Kaki Renang Gaya Dada',
    subtitle: 'Tekuk Lutut - Tendang Memutar - Rapat Meluncur',
    category: 'Aktivitas Air',
    description: 'Tiga fase tendangan katak renang gaya dada dan posisi tubuh meluncur horizontal telungkup di permukaan air dengan pelampung.'
  },
  {
    type: 'silat',
    title: 'Pencak Silat: Sikap Kuda-kuda & Sikap Pasang',
    subtitle: 'Kuda-kuda Depan, Tengah, & Pasang Tangan Terbuka',
    category: 'Beladiri Tradisional',
    description: 'Bentuk kokoh posisi telapak kaki, pembagian bobot berat badan, dan kesiapsiagaan tangan melindungi dada serta kepala.'
  }
];

export function detectPjokVisualType(input: string = ''): PjokVisualType {
  const t = input.toLowerCase();
  if (t.includes('voli') || t.includes('volley') || t.includes('passing bawah') || t.includes('servis')) {
    return 'voli';
  }
  if (t.includes('basket') || t.includes('chest pass') || t.includes('bounce pass') || t.includes('dribble')) {
    return 'basket';
  }
  if (t.includes('kasti') || t.includes('rounders') || t.includes('bola kecil') || t.includes('memukul bola') || t.includes('tiang hinggap')) {
    return 'kasti';
  }
  if (t.includes('senam') || t.includes('guling') || t.includes('roll') || t.includes('matras') || t.includes('sikap lilin') || t.includes('kayang')) {
    return 'senam';
  }
  if (t.includes('atletik') || t.includes('sprint') || t.includes('lari cepat') || t.includes('lompat jauh') || t.includes('start jongkok') || t.includes('estafet')) {
    return 'atletik';
  }
  if (t.includes('kebugaran') || t.includes('push-up') || t.includes('sit-up') || t.includes('shuttle run') || t.includes('sirkuit') || t.includes('kelincahan')) {
    return 'kebugaran';
  }
  if (t.includes('gobak sodor') || t.includes('bentengan') || t.includes('tradisional') || t.includes('hadang') || t.includes('asinan')) {
    return 'gobaksodor';
  }
  if (t.includes('renang') || t.includes('air') || t.includes('kolam') || t.includes('gaya dada') || t.includes('meluncur')) {
    return 'renang';
  }
  if (t.includes('silat') || t.includes('beladiri') || t.includes('kuda-kuda') || t.includes('pasang') || t.includes('pukulan lurus')) {
    return 'silat';
  }
  return 'sepakbola';
}

export default function PjokVisualDiagram({
  type,
  caption,
  sekolah = 'SD Negeri Kalimantong',
  details,
  compact = false
}: PjokVisualDiagramProps) {
  const info = PJOK_DIAGRAM_CATALOG.find(c => c.type === type) || PJOK_DIAGRAM_CATALOG[0];
  const displayCaption = caption || info.description;

  return (
    <div className="my-4 border-2 border-emerald-600/30 rounded-xl overflow-hidden bg-white shadow-sm print:border-slate-800 print:shadow-none">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-800 text-white px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/30 flex items-center justify-center text-emerald-200">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black tracking-wide uppercase flex items-center gap-1.5 text-white">
              {info.title}
            </h4>
            <p className="text-[10px] text-emerald-200 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-300" />
              {sekolah} &bull; {info.category}
            </p>
          </div>
        </div>
        <span className="text-[9px] font-mono font-bold bg-white/15 px-2 py-0.5 rounded text-emerald-100 border border-white/10 uppercase">
          Diagram Gerak PJOK
        </span>
      </div>

      {/* SVG Canvas Area */}
      <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex flex-col items-center justify-center">
        {type === 'sepakbola' && <SepakBolaDiagram sekolah={sekolah} />}
        {type === 'voli' && <VoliDiagram sekolah={sekolah} />}
        {type === 'basket' && <BasketDiagram sekolah={sekolah} />}
        {type === 'kasti' && <KastiDiagram sekolah={sekolah} />}
        {type === 'senam' && <SenamDiagram sekolah={sekolah} />}
        {type === 'atletik' && <AtletikDiagram sekolah={sekolah} />}
        {type === 'kebugaran' && <KebugaranDiagram sekolah={sekolah} />}
        {type === 'gobaksodor' && <GobakSodorDiagram sekolah={sekolah} />}
        {type === 'renang' && <RenangDiagram sekolah={sekolah} />}
        {type === 'silat' && <SilatDiagram sekolah={sekolah} />}
      </div>

      {/* Caption & Key Teaching Points */}
      <div className="p-3 bg-white space-y-2">
        <div className="flex items-start gap-2">
          <div className="p-1 rounded bg-teal-50 text-teal-700 mt-0.5 shrink-0">
            <Info className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed font-sans font-medium">
            <strong>Analisis Gerak di Lapangan:</strong> {displayCaption}
          </p>
        </div>

        {/* Step-by-step guidance chips */}
        {details && details.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            {details.map((d, dIdx) => (
              <div key={dIdx} className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 text-[10px]">
                <span className="font-bold text-teal-800 block mb-0.5">{d.label}</span>
                <span className="text-slate-600 leading-tight">{d.desc}</span>
              </div>
            ))}
          </div>
        ) : (
          <DefaultStepBadges type={type} />
        )}
      </div>
    </div>
  );
}

// 1. Sepak Bola Mini Diagram
function SepakBolaDiagram({ sekolah }: { sekolah: string }) {
  return (
    <svg viewBox="0 0 680 260" className="w-full max-w-2xl h-auto rounded-lg shadow-xs border border-emerald-200">
      {/* Grass Field */}
      <rect x="0" y="0" width="680" height="260" fill="#15803d" />
      <pattern id="grass-stripes" width="40" height="260" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="20" height="260" fill="#166534" opacity="0.35" />
      </pattern>
      <rect x="0" y="0" width="680" height="260" fill="url(#grass-stripes)" />

      {/* Field Markings */}
      <rect x="20" y="15" width="640" height="230" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.85" rx="4" />
      <line x1="340" y1="15" x2="340" y2="245" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.85" />
      <circle cx="340" cy="130" r="45" fill="none" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.85" />
      <circle cx="340" cy="130" r="3" fill="#ffffff" />

      {/* Watermark Text */}
      <text x="340" y="32" textAnchor="middle" fill="#ffffff" fillOpacity="0.6" fontSize="10" fontWeight="bold" fontFamily="sans-serif" letterSpacing="1">
        LAPANGAN RUMPUT {sekolah.toUpperCase()}
      </text>

      {/* Cones Markers */}
      <polygon points="260,115 252,145 268,145" fill="#ea580c" stroke="#ffffff" strokeWidth="1" />
      <polygon points="420,115 412,145 428,145" fill="#ea580c" stroke="#ffffff" strokeWidth="1" />

      {/* Player A (Pengoper / Passer) */}
      <g transform="translate(110, 130)">
        <circle cx="0" cy="-28" r="14" fill="#facc15" stroke="#713f12" strokeWidth="2" />
        {/* Torso */}
        <rect x="-12" y="-12" width="24" height="34" rx="6" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
        <text x="0" y="8" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">A</text>
        {/* Kaki Tumpu Kiri (Sejajar Bola) */}
        <rect x="-16" y="24" width="8" height="26" fill="#0f172a" rx="3" />
        {/* Kaki Kanan (Diputar Keluar) */}
        <path d="M 4 22 L 18 36 L 26 30" fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        {/* Sepatu */}
        <rect x="-20" y="48" width="14" height="6" fill="#dc2626" rx="2" />
        <rect x="22" y="26" width="14" height="7" fill="#dc2626" rx="2" />

        {/* Label Tag */}
        <rect x="-45" y="-55" width="90" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" />
        <text x="0" y="-43" textAnchor="middle" fill="#facc15" fontSize="9" fontWeight="bold">Siswa A (Pengoper)</text>
      </g>

      {/* Bola di kaki Siswa A */}
      <circle cx="148" cy="165" r="11" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
      <polygon points="148,158 154,163 152,170 144,170 142,163" fill="#0f172a" />

      {/* Lintasan Operan Mendatar (Passing Path) */}
      <defs>
        <marker id="arrow-passing" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#facc15" />
        </marker>
      </defs>
      <line x1="165" y1="165" x2="505" y2="165" stroke="#facc15" strokeWidth="3" strokeDasharray="6 4" markerEnd="url(#arrow-passing)" />
      <rect x="300" y="152" width="80" height="16" rx="3" fill="#0f172a" fillOpacity="0.85" />
      <text x="340" y="163" textAnchor="middle" fill="#facc15" fontSize="8.5" fontWeight="bold">Jarak 6 Meter (Passing)</text>

      {/* Player B (Penerima / Receiver) */}
      <g transform="translate(540, 130)">
        <circle cx="0" cy="-28" r="14" fill="#facc15" stroke="#713f12" strokeWidth="2" />
        {/* Torso */}
        <rect x="-12" y="-12" width="24" height="34" rx="6" fill="#16a34a" stroke="#15803d" strokeWidth="1.5" />
        <text x="0" y="8" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">B</text>
        {/* Kaki Kiri */}
        <rect x="4" y="24" width="8" height="26" fill="#0f172a" rx="3" />
        {/* Kaki Kanan Menyambut Mengontrol Bola */}
        <path d="M -6 22 L -18 36 L -24 32" fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        <rect x="2" y="48" width="14" height="6" fill="#dc2626" rx="2" />
        <rect x="-30" y="28" width="14" height="7" fill="#dc2626" rx="2" />

        {/* Label Tag */}
        <rect x="-45" y="-55" width="90" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" />
        <text x="0" y="-43" textAnchor="middle" fill="#86efac" fontSize="9" fontWeight="bold">Siswa B (Kontrol Bola)</text>
      </g>

      {/* Callout Kunci Gerak: Kaki Bagian Dalam */}
      <g transform="translate(70, 205)">
        <rect x="0" y="0" width="230" height="32" rx="6" fill="#ffffff" fillOpacity="0.95" stroke="#0284c7" strokeWidth="1.5" />
        <text x="8" y="14" fill="#0369a1" fontSize="9" fontWeight="bold">✓ Kaki Tumpu: 10-15 cm di samping bola</text>
        <text x="8" y="26" fill="#0f172a" fontSize="8.5">✓ Pergelangan kaki diputar keluar &amp; dikunci</text>
      </g>

      {/* Callout Kunci Gerak: Mengontrol Bola */}
      <g transform="translate(380, 205)">
        <rect x="0" y="0" width="230" height="32" rx="6" fill="#ffffff" fillOpacity="0.95" stroke="#16a34a" strokeWidth="1.5" />
        <text x="8" y="14" fill="#15803d" fontSize="9" fontWeight="bold">✓ Telapak / Sisi dalam kaki meredam bola</text>
        <text x="8" y="26" fill="#0f172a" fontSize="8.5">✓ Bola dihentikan tepat di depan badan</text>
      </g>
    </svg>
  );
}

// 2. Bola Voli Diagram (Passing Bawah)
function VoliDiagram({ sekolah }: { sekolah: string }) {
  return (
    <svg viewBox="0 0 680 250" className="w-full max-w-2xl h-auto rounded-lg shadow-xs border border-teal-200">
      <rect x="0" y="0" width="680" height="250" fill="#f8fafc" />
      
      {/* Floor & Net Line */}
      <rect x="20" y="210" width="640" height="15" fill="#e2e8f0" rx="3" />
      <line x1="600" y1="40" x2="600" y2="210" stroke="#0f172a" strokeWidth="4" />
      {/* Net Mesh */}
      <rect x="585" y="60" width="30" height="80" fill="#38bdf8" fillOpacity="0.3" stroke="#0284c7" strokeWidth="1.5" />
      <text x="600" y="155" textAnchor="middle" fill="#0369a1" fontSize="8.5" fontWeight="bold">Net Voli</text>

      {/* Stage 1: Genggaman Tangan */}
      <g transform="translate(100, 115)">
        <rect x="-80" y="-75" width="160" height="155" rx="8" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" />
        <text x="0" y="-55" textAnchor="middle" fill="#166534" fontSize="10" fontWeight="bold">1. Posisi Tangan Rapat</text>
        {/* Hands Illustration */}
        <path d="M -30 -20 Q 0 -35 30 -20 Q 25 15 0 25 Q -25 15 -30 -20" fill="#fed7aa" stroke="#c2410c" strokeWidth="2" />
        {/* Ibu Jari Sejajar */}
        <rect x="-8" y="-30" width="8" height="35" rx="3" fill="#fdba74" stroke="#ea580c" strokeWidth="1.5" />
        <rect x="0" y="-30" width="8" height="35" rx="3" fill="#fdba74" stroke="#ea580c" strokeWidth="1.5" />
        <text x="0" y="45" textAnchor="middle" fill="#0f172a" fontSize="8.5" fontWeight="bold">Ibu Jari Sejajar Rata</text>
        <text x="0" y="60" textAnchor="middle" fill="#475569" fontSize="8">Kedua lengan lurus terkunci</text>
      </g>

      {/* Stage 2: Sikap Kuda-kuda & Ayunan Lengan */}
      <g transform="translate(340, 115)">
        <rect x="-110" y="-75" width="220" height="155" rx="8" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5" />
        <text x="0" y="-55" textAnchor="middle" fill="#1e40af" fontSize="10" fontWeight="bold">2. Sikap Kuda-Kuda 45°</text>
        {/* Head */}
        <circle cx="-10" cy="-25" r="13" fill="#fed7aa" stroke="#713f12" strokeWidth="1.5" />
        {/* Body bent */}
        <path d="M -10 -12 L 0 25 L -25 55 L -35 85" fill="none" stroke="#0284c7" strokeWidth="7" strokeLinecap="round" />
        <path d="M 0 25 L 20 55 L 25 85" fill="none" stroke="#0284c7" strokeWidth="7" strokeLinecap="round" />
        {/* Arms outstretched 45 deg */}
        <path d="M -10 5 L 35 25" fill="none" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" />
        <circle cx="38" cy="22" r="5" fill="#facc15" />
        
        {/* Angle notation */}
        <path d="M 15 25 A 20 20 0 0 0 35 12" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="2 2" />
        <text x="48" y="10" fill="#dc2626" fontSize="8" fontWeight="bold">± 45°</text>

        <text x="0" y="55" textAnchor="middle" fill="#0f172a" fontSize="8.5" fontWeight="bold">Lutut Mengeper Ditekuk</text>
        <text x="0" y="70" textAnchor="middle" fill="#475569" fontSize="8">Pandangan fokus ke arah bola</text>
      </g>

      {/* Volley Ball in Motion */}
      <g transform="translate(480, 75)">
        <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
        <path d="M -14 0 Q 0 -14 14 0" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
        <path d="M 0 -14 Q 14 0 0 14" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
        {/* Arrow path up */}
        <path d="M -60 50 Q -10 20 0 0" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="4 3" />
        <text x="15" y="-8" fill="#0284c7" fontSize="8.5" fontWeight="bold">Pantulan Parabola</text>
      </g>
    </svg>
  );
}

// 3. Basket Diagram (Chest Pass & Bounce Pass)
function BasketDiagram({ sekolah }: { sekolah: string }) {
  return (
    <svg viewBox="0 0 680 230" className="w-full max-w-2xl h-auto rounded-lg shadow-xs border border-orange-200">
      <rect x="0" y="0" width="680" height="230" fill="#fff7ed" />
      <line x1="30" y1="190" x2="650" y2="190" stroke="#fed7aa" strokeWidth="3" />

      {/* Player 1 (Left) */}
      <g transform="translate(120, 120)">
        <circle cx="0" cy="-35" r="14" fill="#fde047" stroke="#713f12" strokeWidth="1.5" />
        <rect x="-12" y="-20" width="24" height="42" rx="4" fill="#ea580c" stroke="#c2410c" strokeWidth="1.5" />
        <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">1</text>
        <line x1="-6" y1="22" x2="-14" y2="70" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        <line x1="6" y1="22" x2="16" y2="70" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        {/* Arm push */}
        <line x1="5" y1="-10" x2="35" y2="-10" stroke="#ea580c" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* Player 2 (Right) */}
      <g transform="translate(540, 120)">
        <circle cx="0" cy="-35" r="14" fill="#fde047" stroke="#713f12" strokeWidth="1.5" />
        <rect x="-12" y="-20" width="24" height="42" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
        <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">2</text>
        <line x1="-6" y1="22" x2="-10" y2="70" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        <line x1="6" y1="22" x2="10" y2="70" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        {/* Arm ready */}
        <line x1="-5" y1="-10" x2="-25" y2="-10" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* Path 1: Chest Pass (Lurus Dada) */}
      <line x1="160" y1="110" x2="510" y2="110" stroke="#ea580c" strokeWidth="3" strokeDasharray="5 4" />
      <circle cx="330" cy="110" r="11" fill="#f97316" stroke="#0f172a" strokeWidth="1.5" />
      <rect x="250" y="78" width="160" height="20" rx="4" fill="#ea580c" />
      <text x="330" y="92" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">CHEST PASS (Operan Dada Mendatar)</text>

      {/* Path 2: Bounce Pass (Pantulan Lantai) */}
      <path d="M 160 125 L 340 188 L 510 125" fill="none" stroke="#0284c7" strokeWidth="3" strokeDasharray="5 4" />
      <circle cx="340" cy="188" r="7" fill="#0284c7" />
      <rect x="240" y="194" width="200" height="20" rx="4" fill="#0284c7" />
      <text x="340" y="208" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">BOUNCE PASS (Pantul 2/3 Jarak Lantai)</text>
    </svg>
  );
}

// 4. Kasti Diagram (Denah Lapangan)
function KastiDiagram({ sekolah }: { sekolah: string }) {
  return (
    <svg viewBox="0 0 680 250" className="w-full max-w-2xl h-auto rounded-lg shadow-xs border border-emerald-300">
      <rect x="0" y="0" width="680" height="250" fill="#15803d" />
      {/* Lapangan Utama Kasti */}
      <rect x="40" y="20" width="600" height="210" fill="#166534" stroke="#ffffff" strokeWidth="2.5" rx="6" />

      {/* Ruang Petak Pemukul & Pelambung */}
      <rect x="40" y="20" width="90" height="70" fill="#1e3a8a" fillOpacity="0.4" stroke="#ffffff" strokeWidth="1.5" />
      <text x="85" y="55" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">Ruang Pelambung</text>

      <rect x="40" y="90" width="90" height="70" fill="#b91c1c" fillOpacity="0.4" stroke="#ffffff" strokeWidth="1.5" />
      <text x="85" y="125" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">Ruang Pemukul</text>

      <rect x="40" y="160" width="90" height="70" fill="#047857" fillOpacity="0.4" stroke="#ffffff" strokeWidth="1.5" />
      <text x="85" y="195" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">Ruang Bebas</text>

      {/* Tiang Pertolongan */}
      <circle cx="210" cy="55" r="10" fill="#facc15" stroke="#ffffff" strokeWidth="2" />
      <text x="210" y="80" textAnchor="middle" fill="#facc15" fontSize="8.5" fontWeight="bold">Tiang Pertolongan</text>

      {/* Tiang Hinggap 1 */}
      <circle cx="580" cy="55" r="12" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
      <text x="580" y="80" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">Tiang Hinggap I</text>

      {/* Tiang Hinggap 2 */}
      <circle cx="580" cy="195" r="12" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
      <text x="580" y="180" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">Tiang Hinggap II</text>

      {/* Running Arrow Path */}
      <path d="M 130 125 L 210 55 L 580 55 L 580 195 L 130 195" fill="none" stroke="#facc15" strokeWidth="2.5" strokeDasharray="5 4" />
      <text x="360" y="45" textAnchor="middle" fill="#facc15" fontSize="9" fontWeight="bold">Arah Lari Regu Pemukul &gt;&gt;&gt;</text>
      <text x="360" y="215" textAnchor="middle" fill="#86efac" fontSize="9" fontWeight="bold">&lt;&lt;&lt; Kembali ke Ruang Bebas (Poin 1 / 2)</text>
    </svg>
  );
}

// 5. Senam Lantai Diagram (5 Tahap Roll Depan)
function SenamDiagram({ sekolah }: { sekolah: string }) {
  const steps = [
    { no: '1', title: 'Sikap Awal', desc: 'Jongkok, tangan di matras selebar bahu' },
    { no: '2', title: 'Dagu Menempel', desc: 'Dagu rapat ke dada, angkat pinggul' },
    { no: '3', title: 'Tengkuk Mendarat', desc: 'Tengkuk menyentuh matras (bukan kepala)' },
    { no: '4', title: 'Mengguling', desc: 'Badan membulat, tangan peluk lutut' },
    { no: '5', title: 'Sikap Akhir', desc: 'Mendarat jongkok lalu berdiri seimbang' },
  ];

  return (
    <div className="w-full max-w-2xl bg-indigo-50/50 p-3 rounded-lg border border-indigo-200">
      <div className="grid grid-cols-5 gap-2">
        {steps.map((st, i) => (
          <div key={i} className="bg-white p-2 rounded-lg border border-indigo-100 flex flex-col items-center text-center shadow-xs">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-1.5 shadow-xs">
              {st.no}
            </div>
            {/* Simple silhouette SVG representation of each stage */}
            <svg viewBox="0 0 50 50" className="w-12 h-12 my-1">
              {i === 0 && (
                <g fill="#4f46e5">
                  <circle cx="25" cy="18" r="6" />
                  <path d="M 16 32 C 16 26, 34 26, 34 32 L 32 44 L 18 44 Z" />
                  <rect x="5" y="44" width="40" height="4" fill="#0284c7" rx="1" />
                </g>
              )}
              {i === 1 && (
                <g fill="#4f46e5">
                  <circle cx="20" cy="24" r="6" />
                  <path d="M 12 36 Q 25 15 38 36 L 30 44 L 18 44 Z" />
                  <rect x="5" y="44" width="40" height="4" fill="#0284c7" rx="1" />
                </g>
              )}
              {i === 2 && (
                <g fill="#4f46e5">
                  <circle cx="28" cy="34" r="6" />
                  <path d="M 10 40 Q 25 20 40 40 Z" />
                  <rect x="5" y="44" width="40" height="4" fill="#dc2626" rx="1" />
                </g>
              )}
              {i === 3 && (
                <g fill="#4f46e5">
                  <circle cx="25" cy="25" r="14" fillOpacity="0.2" stroke="#4f46e5" strokeWidth="3" />
                  <circle cx="22" cy="22" r="5" />
                  <rect x="5" y="44" width="40" height="4" fill="#0284c7" rx="1" />
                </g>
              )}
              {i === 4 && (
                <g fill="#16a34a">
                  <circle cx="25" cy="12" r="6" />
                  <line x1="25" y1="18" x2="25" y2="34" stroke="#16a34a" strokeWidth="4" />
                  <line x1="25" y1="34" x2="18" y2="46" stroke="#16a34a" strokeWidth="3" />
                  <line x1="25" y1="34" x2="32" y2="46" stroke="#16a34a" strokeWidth="3" />
                  <line x1="12" y1="24" x2="38" y2="24" stroke="#16a34a" strokeWidth="3" />
                  <rect x="5" y="46" width="40" height="3" fill="#0284c7" rx="1" />
                </g>
              )}
            </svg>
            <span className="text-[10px] font-black text-indigo-900 block leading-tight">{st.title}</span>
            <span className="text-[8px] text-slate-500 leading-tight mt-0.5">{st.desc}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-center text-[9px] font-bold text-rose-700 bg-rose-50 py-1 rounded border border-rose-200">
        ⚠️ PERINGATAN KESELAMATAN: Tumpuan roll depan adalah TENGKUK leher bagian belakang, BUKAN puncak ubun-ubun kepala!
      </div>
    </div>
  );
}

// 6. Atletik Diagram (Start & Lompat Jauh)
function AtletikDiagram({ sekolah }: { sekolah: string }) {
  return (
    <svg viewBox="0 0 680 220" className="w-full max-w-2xl h-auto rounded-lg shadow-xs border border-amber-300">
      <rect x="0" y="0" width="680" height="220" fill="#fffbeb" />

      {/* Bagian Kiri: Start Jongkok */}
      <g transform="translate(140, 110)">
        <rect x="-120" y="-80" width="240" height="165" rx="6" fill="#ffffff" stroke="#fcd34d" strokeWidth="1.5" />
        <text x="0" y="-60" textAnchor="middle" fill="#92400e" fontSize="10" fontWeight="bold">Start Jongkok Sprint (Aba-Aba)</text>

        <path d="M -80 40 L 80 40" stroke="#d97706" strokeWidth="3" />
        <text x="-60" y="20" fill="#b45309" fontSize="8" fontWeight="bold">Garis Start</text>

        <circle cx="-30" cy="-10" r="10" fill="#fde047" stroke="#78350f" strokeWidth="1.5" />
        {/* Silhouette crouch */}
        <path d="M -20 -5 L 0 5 L -10 38" fill="none" stroke="#d97706" strokeWidth="5" strokeLinecap="round" />
        <path d="M -15 20 L -30 38" fill="none" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
        <line x1="-15" y1="5" x2="-40" y2="38" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />

        <text x="0" y="55" textAnchor="middle" fill="#0f172a" fontSize="8.5" fontWeight="bold">1. Bersedia | 2. Siap | 3. YA!</text>
      </g>

      {/* Bagian Kanan: Bak Pasir Lompat Jauh */}
      <g transform="translate(480, 110)">
        <rect x="-160" y="-80" width="320" height="165" rx="6" fill="#ffffff" stroke="#fcd34d" strokeWidth="1.5" />
        <text x="0" y="-60" textAnchor="middle" fill="#92400e" fontSize="10" fontWeight="bold">Bak Pasir Lompat Jauh</text>

        {/* Lintasan Lari Awalan */}
        <rect x="-140" y="10" width="80" height="30" fill="#f87171" stroke="#dc2626" strokeWidth="1" />
        <text x="-100" y="28" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">Awalan</text>

        {/* Papan Tolakan */}
        <rect x="-60" y="10" width="16" height="30" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
        <text x="-52" y="52" textAnchor="middle" fill="#b91c1c" fontSize="7.5" fontWeight="bold">Tolakan</text>

        {/* Bak Pasir */}
        <rect x="-40" y="5" width="180" height="40" fill="#fde68a" stroke="#d97706" strokeWidth="1.5" rx="2" />
        <text x="50" y="28" textAnchor="middle" fill="#78350f" fontSize="9" fontWeight="bold">Bak Pasir Pendaratan</text>

        {/* Parabola melayang */}
        <path d="M -52 10 Q 0 -35 60 15" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="4 3" />
        <text x="0" y="-20" textAnchor="middle" fill="#dc2626" fontSize="8" fontWeight="bold">Melayang di Udara</text>
        <text x="0" y="62" textAnchor="middle" fill="#0f172a" fontSize="8">Mendarat dengan kedua kaki mengeper</text>
      </g>
    </svg>
  );
}

// 7. Kebugaran Sirkuit Pos Diagram
function KebugaranDiagram({ sekolah }: { sekolah: string }) {
  const poses = [
    { pos: 'POS 1', name: 'Shuttle Run', desc: 'Lari bolak-balik 5m memindahkan balok/cone' },
    { pos: 'POS 2', name: 'Push-Up', desc: 'Latihan kekuatan otot lengan dan bahu' },
    { pos: 'POS 3', name: 'Sit-Up', desc: 'Latihan daya tahan dan kekuatan otot perut' },
    { pos: 'POS 4', name: 'Step-Up Bangku', desc: 'Naik turun bangku melatih otot tungkai kaki' }
  ];

  return (
    <div className="w-full max-w-2xl bg-teal-50/60 p-3 rounded-lg border border-teal-200">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {poses.map((p, idx) => (
          <div key={idx} className="bg-white p-2.5 rounded-lg border border-teal-200/80 shadow-xs flex flex-col items-center text-center">
            <span className="text-[10px] font-mono font-black bg-teal-700 text-white px-2 py-0.5 rounded mb-1">
              {p.pos}
            </span>
            <span className="text-xs font-bold text-slate-800 mt-1">{p.name}</span>
            <span className="text-[9px] text-slate-600 leading-tight mt-1">{p.desc}</span>
            <div className="mt-2 text-[8px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
              Waktu: 30 - 45 Detik
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-center text-[9px] text-teal-800 font-medium bg-white/80 py-1 rounded border border-teal-100">
        Rute Sirkuit Lapangan Olahraga {sekolah} &bull; Dilakukan bergiliran 2 putaran dengan istirahat antar pos 15 detik.
      </div>
    </div>
  );
}

// 8. Gobak Sodor Diagram
function GobakSodorDiagram({ sekolah }: { sekolah: string }) {
  return (
    <svg viewBox="0 0 680 230" className="w-full max-w-2xl h-auto rounded-lg shadow-xs border border-emerald-300">
      <rect x="0" y="0" width="680" height="230" fill="#f0fdf4" />
      {/* 6 Boxes Layout */}
      <rect x="60" y="30" width="560" height="170" fill="#ffffff" stroke="#0f172a" strokeWidth="3" rx="4" />
      {/* Garis Horizontal Tengah */}
      <line x1="60" y1="115" x2="620" y2="115" stroke="#0f172a" strokeWidth="2.5" />
      {/* Garis Vertikal Pembagi Petak */}
      <line x1="246" y1="30" x2="246" y2="200" stroke="#0f172a" strokeWidth="2.5" />
      <line x1="433" y1="30" x2="433" y2="200" stroke="#0f172a" strokeWidth="2.5" />

      {/* Garis Sodor Tengah (Merah) */}
      <line x1="60" y1="115" x2="620" y2="115" stroke="#dc2626" strokeWidth="4" />
      <text x="340" y="110" textAnchor="middle" fill="#dc2626" fontSize="9" fontWeight="bold">
        GARIS SODOR TENGAH (Bisa bergerak sepanjang garis merah)
      </text>

      {/* Label Petak */}
      <text x="153" y="70" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">PETAK 1</text>
      <text x="340" y="70" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">PETAK 2</text>
      <text x="526" y="70" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">PETAK 3</text>

      <text x="153" y="160" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">PETAK 4</text>
      <text x="340" y="160" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">PETAK 5</text>
      <text x="526" y="160" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">PETAK 6</text>

      {/* Arah Penyerang */}
      <text x="25" y="118" textAnchor="middle" fill="#16a34a" fontSize="10" fontWeight="bold">MASUK</text>
      <text x="655" y="118" textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="bold">KEMBALI</text>
    </svg>
  );
}

// 9. Renang Diagram
function RenangDiagram({ sekolah }: { sekolah: string }) {
  const steps = [
    { title: '1. Menekuk Lutut', desc: 'Kedua tumit ditarik mendekati pantat secara rileks' },
    { title: '2. Membuka & Menendang', desc: 'Ujung telapak kaki diputar ke luar lalu mendorong ke belakang melingkar' },
    { title: '3. Merapat Meluncur', desc: 'Kedua kaki dirapatkan lurus sejajar untuk menghasilkan gaya dorong meluncur' }
  ];

  return (
    <div className="w-full max-w-2xl bg-cyan-50/70 p-3 rounded-lg border border-cyan-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {steps.map((s, i) => (
          <div key={i} className="bg-white p-2.5 rounded-lg border border-cyan-200 shadow-xs text-center">
            <span className="text-xs font-black text-cyan-800 block mb-1">{s.title}</span>
            <p className="text-[10px] text-slate-600 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 text-center text-[9px] font-bold text-cyan-900 bg-cyan-100/60 py-1 rounded">
        Gerakan Tungkai Kaki Renang Gaya Dada &bull; Pertahankan posisi kepala dan tubuh horizontal telungkup di air.
      </div>
    </div>
  );
}

// 10. Silat Diagram
function SilatDiagram({ sekolah }: { sekolah: string }) {
  const stances = [
    { name: 'Kuda-Kuda Depan', desc: 'Kaki depan ditekuk, kaki belakang lurus, berat badan condong ke depan.' },
    { name: 'Kuda-Kuda Tengah', desc: 'Kedua kaki dibuka melebar, kedua lutut ditekuk sejajar, berat badan di tengah.' },
    { name: 'Sikap Pasang', desc: 'Kombinasi kuda-kuda kokoh dengan kedua tangan waspada melindungi dada dan wajah.' }
  ];

  return (
    <div className="w-full max-w-2xl bg-rose-50/60 p-3 rounded-lg border border-rose-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {stances.map((st, i) => (
          <div key={i} className="bg-white p-2.5 rounded-lg border border-rose-200 shadow-xs text-center">
            <span className="text-xs font-bold text-rose-900 block mb-1">{st.name}</span>
            <p className="text-[10px] text-slate-600 leading-relaxed">{st.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper default badges
function DefaultStepBadges({ type }: { type: PjokVisualType }) {
  if (type === 'sepakbola') {
    return (
      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 text-[10px]">
        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
          🎯 Kaki Tumpu: Di samping bola 10-15 cm
        </span>
        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
          👟 Perkenaan: Kaki bagian dalam
        </span>
        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
          🏹 Arah: Lurus mendatar ke kaki kawan
        </span>
      </div>
    );
  }
  return null;
}

/**
 * Word (.doc) HTML Export Helper for PJOK Diagrams
 */
export function getPjokDiagramHtml(
  type: PjokVisualType, 
  caption?: string, 
  sekolah: string = 'SD Negeri Kalimantong'
): string {
  const info = PJOK_DIAGRAM_CATALOG.find(c => c.type === type) || PJOK_DIAGRAM_CATALOG[0];
  const desc = caption || info.description;

  return `
    <div style="margin: 15px 0; border: 2px solid #059669; border-radius: 8px; background-color: #f0fdf4; padding: 12px; page-break-inside: avoid;">
      <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 8px;">
        <tr>
          <td style="border: none; padding: 0;">
            <span style="font-size: 11pt; font-weight: bold; color: #065f46; text-transform: uppercase;">
              🏅 DIAGRAM VISUAL: ${info.title}
            </span>
            <br>
            <span style="font-size: 8.5pt; color: #047857; font-weight: bold;">
              Lokasi: Lapangan Olahraga ${sekolah} &bull; ${info.category}
            </span>
          </td>
          <td style="border: none; padding: 0; text-align: right;">
            <span style="font-size: 8pt; font-weight: bold; background-color: #059669; color: #ffffff; padding: 3px 8px; border-radius: 4px;">
              PJOK KURIKULUM MERDEKA
            </span>
          </td>
        </tr>
      </table>

      <div style="background-color: #ffffff; border: 1px solid #a7f3d0; border-radius: 6px; padding: 10px; margin-bottom: 10px; font-size: 9.5pt; line-height: 1.5; color: #1e293b;">
        <strong>Panduan Gerak &amp; Mekanika Fisik:</strong><br>
        ${desc}
      </div>

      <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 9pt;">
        <tr style="background-color: #065f46; color: #ffffff;">
          <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; width: 15%;">Tahap</th>
          <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: left; width: 45%;">Instruksi Kunci Siswa</th>
          <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: left; width: 40%;">Fokus Pengamatan Guru</th>
        </tr>
        <tr style="background-color: #ffffff;">
          <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">Tahap 1</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">Posisi kuda-kuda awal seimbang, pandangan ke arah target</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">Keseimbangan statis &amp; titik tumpu badan</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">Tahap 2</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">Pelaksanaan ayunan / tolakan gerak secara berirama</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">Akurasi perkenaan &amp; pelepasan gaya</td>
        </tr>
        <tr style="background-color: #ffffff;">
          <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">Tahap 3</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">Gerakan ikutan (follow-through) dan pendaratan aman</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">Mencegah cedera &amp; siap ke posisi berikutnya</td>
        </tr>
      </table>
    </div>
  `;
}
