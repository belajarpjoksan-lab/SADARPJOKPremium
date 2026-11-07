import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Server,
  Terminal,
  Info,
  Key,
  Globe,
  Trash2,
  Eye,
  EyeOff,
  UploadCloud,
  DownloadCloud,
  FileJson,
  FileCode,
  Layers,
  BookOpen,
  FileText,
  Printer,
  Sparkles,
  Activity,
  HardDrive,
  Cloud,
  Table,
  Code2,
  HelpCircle,
  CheckSquare
} from 'lucide-react';
import { 
  getClientSupabaseCredentials, 
  saveClientSupabaseCredentials, 
  clearClientSupabaseCredentials,
  DEFAULT_SUPABASE_CREDENTIALS,
  DEFAULT_SQL_SCRIPT,
  getLocalDataSummary,
  syncAllLocalToSupabase,
  pullAllFromSupabaseToLocal,
  exportFullBackupObject,
  restoreFullBackupObject
} from '../lib/dbClient';
import { downloadJsonFile, downloadDocFile } from '../lib/exportUtils';
import { downloadElementAsPdf } from '../lib/pdfUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getKodeEtikKkoCetakPrompts } from '../utils/aiPromptGenerators';

interface SupabaseStatus {
  configured: boolean;
  isClientSide: boolean;
  connected: boolean;
  allExist: boolean;
  tables: {
    classes: boolean;
    moduls: boolean;
    journals: boolean;
    rubriks: boolean;
  };
  tableCounts?: {
    classes: number;
    moduls: number;
    journals: number;
    rubriks: number;
  };
  activeUrl?: string;
  latencyMs?: number;
  sqlScript: string;
  error: string | null;
}

interface SupabaseIntegrationViewProps {
  supabaseStatus: SupabaseStatus | null;
  refetchStatus: () => Promise<void>;
}

const DATABASE_SCHEMA_DEFINITIONS = [
  {
    tableName: 'classes',
    key: 'classes' as const,
    title: 'Tabel Kelas & Rombongan Belajar',
    description: 'Menyimpan daftar kelas (Kelas I s.d. VI), identitas rombel, daftar siswa, rekam absensi harian/mingguan/bulanan, serta rekap nilai PJOK.',
    primaryKey: 'id (TEXT)',
    columns: [
      { name: 'id', type: 'TEXT PRIMARY KEY', desc: 'ID unik kelas (contoh: cls-1, cls-4a)' },
      { name: 'name', type: 'TEXT NOT NULL', desc: 'Nama rombel kelas (contoh: Kelas IV-A)' },
      { name: 'grade', type: 'INT NOT NULL', desc: 'Tingkat kelas (1, 2, 3, 4, 5, atau 6)' },
      { name: 'students', type: 'JSONB NOT NULL', desc: 'Array data siswa, presensi, & nilai formatif/sumatif' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', desc: 'Waktu pembaruan terakhir otomatis' }
    ],
    rlsPolicies: ['SELECT (Public)', 'INSERT (Public)', 'UPDATE (Public)', 'DELETE (Public)']
  },
  {
    tableName: 'moduls',
    key: 'moduls' as const,
    title: 'Tabel Modul Ajar (RPP) & Deep Learning',
    description: 'Menyimpan dokumen Modul Ajar Kurikulum Merdeka, Tujuan Pembelajaran, Langkah Kegiatan (Pendahuluan, Inti, Penutup), Sarana Prasarana, dan Rubrik.',
    primaryKey: 'id (TEXT)',
    columns: [
      { name: 'id', type: 'TEXT PRIMARY KEY', desc: 'ID unik modul ajar' },
      { name: 'title', type: 'TEXT NOT NULL', desc: 'Judul Modul Ajar / Topik Materi' },
      { name: 'grade', type: 'INT NOT NULL', desc: 'Tingkat kelas (1 - 6)' },
      { name: 'semester', type: 'INT NOT NULL', desc: 'Semester (1 Ganjil / 2 Genap)' },
      { name: 'materi_pokok', type: 'TEXT NOT NULL', desc: 'Materi pokok pembelajaran PJOK' },
      { name: 'alokasi_waktu', type: 'TEXT NOT NULL', desc: 'Alokasi waktu (misal: 2 x 35 Menit / 3 JP)' },
      { name: 'tujuan_pembelajaran', type: 'JSONB NOT NULL', desc: 'Daftar Tujuan Pembelajaran (TP)' },
      { name: 'kegiatan_pembelajaran', type: 'JSONB NOT NULL', desc: 'Rincian kegiatan awal, inti, dan penutup' },
      { name: 'sarana_prasarana', type: 'JSONB NOT NULL', desc: 'Alat, media, dan sumber belajar' },
      { name: 'rubrik_penilaian', type: 'TEXT NOT NULL', desc: 'Instrumen dan rubrik asesmen' },
      { name: 'created_at', type: 'TEXT NOT NULL', desc: 'Tanggal pembuatan dokumen' }
    ],
    rlsPolicies: ['SELECT (Public)', 'INSERT (Public)', 'UPDATE (Public)', 'DELETE (Public)']
  },
  {
    tableName: 'journals',
    key: 'journals' as const,
    title: 'Tabel Jurnal Mengajar Harian Guru',
    description: 'Menyimpan catatan pelaksanaan pembelajaran harian di lapangan/kelas, materi yang diajarkan, kejadian khusus siswa, dan tindak lanjut.',
    primaryKey: 'id (TEXT)',
    columns: [
      { name: 'id', type: 'TEXT PRIMARY KEY', desc: 'ID unik jurnal mengajar' },
      { name: 'date', type: 'TEXT NOT NULL', desc: 'Tanggal pelaksanaan pembelajaran' },
      { name: 'class_id', type: 'TEXT NOT NULL', desc: 'Relasi ID kelas' },
      { name: 'class_name', type: 'TEXT NOT NULL', desc: 'Nama kelas yang diajar' },
      { name: 'materi', type: 'TEXT NOT NULL', desc: 'Topik / materi yang disampaikan' },
      { name: 'catatan_kejadian', type: 'TEXT NOT NULL', desc: 'Catatan keaktifan/kendala siswa di lapangan' },
      { name: 'tindak_lanjut', type: 'TEXT NOT NULL', desc: 'Rencana tindak lanjut / remedial / pengayaan' }
    ],
    rlsPolicies: ['SELECT (Public)', 'INSERT (Public)', 'UPDATE (Public)', 'DELETE (Public)']
  },
  {
    tableName: 'rubriks',
    key: 'rubriks' as const,
    title: 'Tabel Rubrik Penilaian Fisik & Keterampilan',
    description: 'Menyimpan bank instrumen rubrik penilaian praktik olahraga, indikator psikomotorik, dan kriteria skor 1–4.',
    primaryKey: 'id (TEXT)',
    columns: [
      { name: 'id', type: 'TEXT PRIMARY KEY', desc: 'ID unik rubrik fisik' },
      { name: 'materi', type: 'TEXT NOT NULL', desc: 'Nama keterampilan gerak / cabang olahraga' },
      { name: 'kategori', type: 'TEXT NOT NULL', desc: 'Kategori (Bola Besar, Atletik, Senam, Kebugaran, dll.)' },
      { name: 'indikator', type: 'JSONB NOT NULL', desc: 'Daftar aspek penilaian & deskripsi skor 1-4' }
    ],
    rlsPolicies: ['SELECT (Public)', 'INSERT (Public)', 'UPDATE (Public)', 'DELETE (Public)']
  },
  {
    tableName: 'perangkat_ajar',
    key: 'classes' as const, // Fallback indicator
    title: 'Tabel Arsip Perangkat Ajar Lengkap (RPM, PROTA, PROSEM, RPE, KKTP)',
    description: 'Tabel opsional terpadu untuk mengarsipkan seluruh dokumen hasil generate AI (RPM 1 Pertemuan, RPM 1 Bab, RPM 1 TP, PROTA, PROSEM, ASAT, US/UM).',
    primaryKey: 'id (TEXT)',
    columns: [
      { name: 'id', type: 'TEXT PRIMARY KEY', desc: 'ID unik dokumen perangkat ajar' },
      { name: 'kategori', type: 'TEXT NOT NULL', desc: 'Jenis dokumen (RPM, PROTA, PROSEM, RPE, KKTP, ASAT, US)' },
      { name: 'judul', type: 'TEXT NOT NULL', desc: 'Judul dokumen administrasi' },
      { name: 'sekolah', type: 'TEXT', desc: 'Default: SD Negeri Kalimantong' },
      { name: 'tahun_ajaran', type: 'TEXT', desc: 'Default: 2026/2027' },
      { name: 'payload', type: 'JSONB NOT NULL', desc: 'Seluruh isi dokumen dalam format JSON terstruktur' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', desc: 'Waktu penyimpanan dokumen' }
    ],
    rlsPolicies: ['ALL (Public Read/Write)']
  }
];

export default function SupabaseIntegrationView({ supabaseStatus, refetchStatus }: SupabaseIntegrationViewProps) {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const [clientUrl, setClientUrl] = useState('');
  const [clientKey, setClientKey] = useState('');
  const [projectName, setProjectName] = useState('SADAR PJOK - SD Negeri Kalimantong');
  const [namaSekolah, setNamaSekolah] = useState('SD Negeri Kalimantong');
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');

  const [showKey, setShowKey] = useState(true);
  const [copiedBearer, setCopiedBearer] = useState(false);
  const [copiedRefId, setCopiedRefId] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [confirmResetModal, setConfirmResetModal] = useState(false);

  // Sync & Backup States
  const [isSyncingUp, setIsSyncingUp] = useState(false);
  const [isSyncingDown, setIsSyncingDown] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [localStats, setLocalStats] = useState(() => getLocalDataSummary());
  const [sqlTab, setSqlTab] = useState<'full' | 'ddl' | 'rls'>('full');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const fileRestoreInputRef = useRef<HTMLInputElement>(null);
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Sync state with local storage credentials on mount or status refresh
  useEffect(() => {
    const creds = getClientSupabaseCredentials();
    if (creds) {
      setClientUrl(creds.url);
      setClientKey(creds.anonKey);
    } else {
      setClientUrl(DEFAULT_SUPABASE_CREDENTIALS.url);
      setClientKey(DEFAULT_SUPABASE_CREDENTIALS.anonKey);
    }
    setLocalStats(getLocalDataSummary());
  }, [supabaseStatus]);

  const activeSqlScript = (() => {
    const fullScript = (supabaseStatus?.sqlScript && supabaseStatus.sqlScript.trim().length > 100)
      ? DEFAULT_SQL_SCRIPT.trim()
      : DEFAULT_SQL_SCRIPT.trim();

    if (sqlTab === 'ddl') {
      return fullScript.split('-- =========================================================================\n-- KONFIGURASI ROW LEVEL SECURITY')[0].trim();
    }
    if (sqlTab === 'rls') {
      const parts = fullScript.split('-- =========================================================================\n-- KONFIGURASI ROW LEVEL SECURITY');
      return parts[1]
        ? `-- =========================================================================\n-- KONFIGURASI ROW LEVEL SECURITY${parts[1].trim()}`
        : fullScript;
    }
    return fullScript;
  })();

  const envBlockText = `# KONFIGURASI ENVIRONMENT VARIABLES SUPABASE - SADAR PJOK
# Satuan Pendidikan : ${namaSekolah}
# Tahun Pelajaran   : ${tahunPelajaran}

SUPABASE_URL="${clientUrl || DEFAULT_SUPABASE_CREDENTIALS.url}"
SUPABASE_ANON_KEY="${clientKey || DEFAULT_SUPABASE_CREDENTIALS.anonKey}"

# Variabel Frontend (Vite / Vercel)
VITE_SUPABASE_URL="${clientUrl || DEFAULT_SUPABASE_CREDENTIALS.url}"
VITE_SUPABASE_ANON_KEY="${clientKey || DEFAULT_SUPABASE_CREDENTIALS.anonKey}"`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(activeSqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadSqlFile = () => {
    const blob = new Blob([activeSqlScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Skema_Supabase_SADAR_PJOK_SDN_Kalimantong_2026_2027.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envBlockText);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  const handleConnectClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientUrl.trim() || !clientKey.trim()) return;

    setIsSaving(true);
    setSyncFeedback(null);
    try {
      saveClientSupabaseCredentials(clientUrl, clientKey);
      setSaveSuccess(true);
      await refetchStatus();
      setSyncFeedback({
        type: 'success',
        message: 'Kredensial Supabase berhasil disimpan dan diuji! Status koneksi telah diperbarui.'
      });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err?.message || 'Gagal menyimpan kredensial Supabase.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseDefaultCredentials = async () => {
    setClientUrl(DEFAULT_SUPABASE_CREDENTIALS.url);
    setClientKey(DEFAULT_SUPABASE_CREDENTIALS.anonKey);
    saveClientSupabaseCredentials(DEFAULT_SUPABASE_CREDENTIALS.url, DEFAULT_SUPABASE_CREDENTIALS.anonKey);
    await refetchStatus();
    setSyncFeedback({
      type: 'info',
      message: 'Kredensial default Supabase SADAR PJOK telah diterapkan.'
    });
  };

  const handleDisconnectClient = async () => {
    clearClientSupabaseCredentials();
    setClientUrl(DEFAULT_SUPABASE_CREDENTIALS.url);
    setClientKey(DEFAULT_SUPABASE_CREDENTIALS.anonKey);
    setConfirmResetModal(false);
    await refetchStatus();
    setSyncFeedback({
      type: 'info',
      message: 'Kredensial kustom peramban telah dihapus dan dikembalikan ke pengaturan awal.'
    });
  };

  const handlePushToCloud = async () => {
    setIsSyncingUp(true);
    setSyncFeedback(null);
    try {
      const res = await syncAllLocalToSupabase();
      setLocalStats(getLocalDataSummary());
      await refetchStatus();
      setSyncFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message
      });
    } finally {
      setIsSyncingUp(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsSyncingDown(true);
    setSyncFeedback(null);
    try {
      const res = await pullAllFromSupabaseToLocal();
      setLocalStats(getLocalDataSummary());
      await refetchStatus();
      setSyncFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message
      });
    } finally {
      setIsSyncingDown(false);
    }
  };

  const handleExportFullBackup = () => {
    const backup = exportFullBackupObject();
    downloadJsonFile(`Backup_Lengkap_SADAR_PJOK_SDN_Kalimantong_${tahunPelajaran.replace('/', '_')}.json`, backup);
    setSyncFeedback({
      type: 'success',
      message: 'File Backup JSON lengkap berhasil diunduh ke perangkat Anda.'
    });
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        const res = restoreFullBackupObject(parsed);
        setLocalStats(getLocalDataSummary());
        setSyncFeedback({
          type: res.success ? 'success' : 'error',
          message: res.message
        });
      } catch (err) {
        setSyncFeedback({
          type: 'error',
          message: 'Gagal memproses file JSON. Pastikan file backup valid.'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportWordF4 = () => {
    if (!printContainerRef.current) return;
    const htmlContent = `
      <div style="font-family: 'Times New Roman', serif; color: #000;">
        <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 14pt; text-transform: uppercase;">DOKUMENTASI & KONFIGURASI INTEGRASI DATABASE SUPABASE</h2>
          <h3 style="margin: 4px 0; font-size: 12pt; text-transform: uppercase;">${namaSekolah.toUpperCase()}</h3>
          <p style="margin: 0; font-size: 10pt;">Tahun Pelajaran ${tahunPelajaran} • Aplikasi Administrasi Guru SADAR PJOK</p>
        </div>

        <h4 style="font-size: 11pt; text-transform: uppercase; margin: 12px 0 6px 0;">A. IDENTITAS & STATUS KONEKSI DATABASE</h4>
        <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 14px;">
          <tr>
            <td style="width: 30%; font-weight: bold; background: #f1f5f9;">Nama Satuan Pendidikan</td>
            <td>${namaSekolah}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f1f5f9;">Tahun Pelajaran</td>
            <td>${tahunPelajaran}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f1f5f9;">Nama Proyek Cloud</td>
            <td>${projectName}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f1f5f9;">Endpoint Supabase URL</td>
            <td style="font-family: monospace; word-break: break-all;">${clientUrl || DEFAULT_SUPABASE_CREDENTIALS.url}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f1f5f9;">REST API Endpoint</td>
            <td style="font-family: monospace; word-break: break-all;">${(clientUrl || DEFAULT_SUPABASE_CREDENTIALS.url).replace(/\/$/, '')}/rest/v1</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f1f5f9;">API Key / Anon Public Key (Lengkap)</td>
            <td style="font-family: monospace; font-size: 8.5pt; word-break: break-all; background: #f8fafc;">${clientKey || DEFAULT_SUPABASE_CREDENTIALS.anonKey}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f1f5f9;">Status Koneksi & Skema</td>
            <td>${supabaseStatus?.connected ? 'Terhubung (Online)' : 'Mode Penyimpanan Lokal'} — ${supabaseStatus?.allExist ? 'Seluruh Tabel Lengkap' : 'Perlu Menjalankan Skrip SQL'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f1f5f9;">Rekap Data Tersimpan</td>
            <td>${localStats.classesCount} Kelas (${localStats.studentsCount} Siswa), ${localStats.modulsCount} Modul Ajar, ${localStats.journalsCount} Jurnal, ${localStats.rubriksCount} Rubrik</td>
          </tr>
        </table>

        <h4 style="font-size: 11pt; text-transform: uppercase; margin: 12px 0 6px 0;">B. STRUKTUR TABEL DATABASE POSTGRESQL (PUBLIC SCHEMA)</h4>
        <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 14px;">
          <thead>
            <tr style="background: #fef08a; font-weight: bold; text-align: center;">
              <th style="width: 6%;">No</th>
              <th style="width: 18%;">Nama Tabel</th>
              <th style="width: 26%;">Fungsi Utama</th>
              <th style="width: 34%;">Kolom & Tipe Data</th>
              <th style="width: 16%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${DATABASE_SCHEMA_DEFINITIONS.map((t, idx) => {
              const isReady = supabaseStatus?.tables?.[t.key];
              return `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td style="font-family: monospace; font-weight: bold;">${t.tableName}</td>
                  <td>${t.title}<br/><span style="font-size: 8.5pt; color: #334155;">${t.description}</span></td>
                  <td>${t.columns.map(c => `<div>• <b>${c.name}</b> (${c.type})</div>`).join('')}</td>
                  <td style="text-align: center; font-weight: bold;">${isReady ? 'READY (Aktif)' : 'SETUP SQL'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <h4 style="font-size: 11pt; text-transform: uppercase; margin: 12px 0 6px 0;">C. SKRIP SQL LENGKAP (DDL & ROW LEVEL SECURITY)</h4>
        <pre style="font-family: 'Courier New', monospace; font-size: 8.5pt; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; white-space: pre-wrap;">${activeSqlScript}</pre>
      </div>
    `;
    downloadDocFile(`Integrasi_Supabase_F4_${namaSekolah.replace(/\s+/g, '_')}_2026_2027.doc`, htmlContent, 'portrait');
  };

  const handleExportPdfF4 = async () => {
    if (!printContainerRef.current) return;
    setIsExportingPdf(true);
    try {
      await downloadElementAsPdf(
        printContainerRef.current,
        `Integrasi_Supabase_F4_${namaSekolah.replace(/\s+/g, '_')}_2026_2027.pdf`,
        { orientation: 'portrait' }
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const statusData: SupabaseStatus = supabaseStatus || {
    configured: true,
    isClientSide: true,
    connected: false,
    allExist: false,
    tables: { classes: false, moduls: false, journals: false, rubriks: false },
    tableCounts: { classes: 0, moduls: 0, journals: 0, rubriks: 0 },
    activeUrl: DEFAULT_SUPABASE_CREDENTIALS.url,
    sqlScript: DEFAULT_SQL_SCRIPT,
    error: null
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      
      {/* Top Hero & Action Bar */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-slate-700/80">
        <div className="absolute -top-6 -right-6 p-8 opacity-10 pointer-events-none">
          <Database className="w-56 h-56" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-widest border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Cloud Database & Sync Center
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
                {namaSekolah} • T.P. {tahunPelajaran}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Menu Integrasi Supabase Cloud Lengkap
            </h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-3xl leading-relaxed">
              Kelola kredensial koneksi PostgreSQL Supabase, periksa kesehatan skema tabel secara real-time, lakukan sinkronisasi dua arah (Unggah/Unduh Cloud), cadangkan database (`.json`), dan salin skrip SQL lengkap untuk <strong>{namaSekolah}</strong> Tahun Pelajaran <strong>{tahunPelajaran}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportWordF4}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm cursor-pointer"
              title="Unduh Dokumentasi & Skrip SQL dalam Format Word F4"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Word (F4)</span>
            </button>
            <button
              onClick={handleExportPdfF4}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white transition-all shadow-sm cursor-pointer"
              title="Unduh Dokumentasi & Skrip SQL dalam Format PDF F4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Mencetak...' : 'PDF (F4)'}</span>
            </button>
            <div className="bg-white/10 backdrop-blur-xs p-1.5 rounded-2xl border border-white/15">
              <ExportJsonPromptAiButtons
                onExportJson={handleExportFullBackup}
                onOpenPromptAi={() => setShowPromptModal(true)}
              />
            </div>
          </div>
        </div>
      </div>



      {/* Feedback Banner */}
      {syncFeedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
          syncFeedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : syncFeedback.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-bold">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : syncFeedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-xs font-bold underline opacity-75 hover:opacity-100 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Printable / Main Content Container */}
      <div ref={printContainerRef} className="space-y-8">
        
        {/* BAGIAN 1: RINGKASAN STATUS & STATISTIK REAL-TIME */}
        <div
          data-f4-section="Bagian 1: Status Koneksi & Statistik Database"
          data-f4-orientation="portrait"
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Status Kredensial */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Server className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {statusData.isClientSide ? 'Browser Config' : 'Server Config'}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Status Kredensial</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate" title={clientUrl}>
                  {clientUrl || DEFAULT_SUPABASE_CREDENTIALS.url}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Terkonfigurasi
                  </span>
                  {statusData.latencyMs && (
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {statusData.latencyMs} ms
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Kesehatan Tabel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Database className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    statusData.allExist
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {Object.values(statusData.tables).filter(Boolean).length} / 4 Tabel Inti
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Kesehatan Skema Tabel</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  classes, moduls, journals, rubriks
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                {statusData.connected && statusData.allExist ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Semua Tabel Siap (READY)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Siap Dijalankan di SQL Editor
                  </span>
                )}
              </div>
            </div>

            {/* Card 3: Statistik Data Lokal */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Data Aktif
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Data Administrasi Guru</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {localStats.classesCount} Rombel ({localStats.studentsCount} Siswa) • {localStats.modulsCount} Modul
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span>{localStats.journalsCount} Jurnal</span>
                <span>•</span>
                <span>{localStats.rubriksCount} Rubrik Fisik</span>
              </div>
            </div>

            {/* Card 4: Mode Sinkronisasi */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <button
                    onClick={refetchStatus}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Cek Ulang
                  </button>
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Mode Penyimpanan</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hybrid Cloud Sync + Offline LocalStorage
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Auto-Fallback Aman Aktif
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN 2: FORM KONFIGURASI KREDENSIAL SUPABASE (SELALU TAMPIL LENGKAP) */}
        <div
          data-f4-section="Bagian 2: Form Konfigurasi Kredensial & Endpoint Supabase"
          data-f4-orientation="portrait"
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  1. Pengaturan Kredensial & Koneksi Project Supabase
                </h3>
                <p className="text-xs text-slate-500">
                  Masukkan Project URL dan Anon Public Key dari menu <strong>Project Settings → API</strong> di dashboard Supabase Anda.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseDefaultCredentials}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Gunakan Kredensial Default
              </button>
              <button
                type="button"
                onClick={refetchStatus}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Uji Koneksi
              </button>
            </div>
          </div>

          <form onSubmit={handleConnectClient} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Nama Satuan Pendidikan
                </label>
                <input
                  type="text"
                  value={namaSekolah}
                  onChange={(e) => setNamaSekolah(e.target.value)}
                  placeholder="SD Negeri Kalimantong"
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Tahun Pelajaran
                </label>
                <input
                  type="text"
                  value={tahunPelajaran}
                  onChange={(e) => setTahunPelajaran(e.target.value)}
                  placeholder="2026/2027"
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Label Proyek Database
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="SADAR PJOK - SD Negeri Kalimantong"
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Input URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Supabase Project URL (API URL) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(clientUrl || DEFAULT_SUPABASE_CREDENTIALS.url);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedUrl ? 'URL Tersalin!' : 'Salin Project URL'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={clientUrl}
                    onChange={(e) => setClientUrl(e.target.value)}
                    placeholder="https://gohycvfxflwwmdogiwse.supabase.co"
                    className="w-full text-xs font-mono font-bold text-slate-800 border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    required
                  />
                  <Globe className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Input Anon Key / API Key Full View */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700">
                    Supabase API Key / Anon Key (Public JWT Lengkap) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showKey ? 'Mode Password' : 'Tampilkan Lengkap'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(clientKey || DEFAULT_SUPABASE_CREDENTIALS.anonKey);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-lg cursor-pointer shadow-2xs"
                    >
                      {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedKey ? 'API Key Tersalin!' : 'Salin API Key / Anon Key'}
                    </button>
                  </div>
                </div>
                <div className="relative">
                  {showKey ? (
                    <textarea
                      rows={3}
                      value={clientKey}
                      onChange={(e) => setClientKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full text-xs font-mono font-semibold text-slate-800 border border-slate-300 rounded-xl p-3.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none break-all leading-relaxed"
                      required
                    />
                  ) : (
                    <input
                      type="password"
                      value={clientKey}
                      onChange={(e) => setClientKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full text-xs font-mono border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                      required
                    />
                  )}
                </div>
              </div>
            </div>

            {/* PANEL DETAIL LENGKAP API KEY, ANON KEY & ENDPOINT SUPABASE */}
            <div className="rounded-2xl bg-slate-900 text-slate-100 p-5 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Rincian Lengkap Kredensial API Key & Anon Key Supabase Aktif
                  </h4>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Role: anon (Public API Key) • Berlaku s.d. 2036
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Project Reference ID */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Project Reference ID
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const refMatch = (clientUrl || DEFAULT_SUPABASE_CREDENTIALS.url).match(/https?:\/\/([^.]+)\.supabase\.co/);
                        const refId = refMatch ? refMatch[1] : 'gohycvfxflwwmdogiwse';
                        navigator.clipboard.writeText(refId);
                        setCopiedRefId(true);
                        setTimeout(() => setCopiedRefId(false), 2000);
                      }}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedRefId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedRefId ? 'Tersalin' : 'Salin ID'}
                    </button>
                  </div>
                  <p className="font-mono font-bold text-white select-all break-all">
                    {((clientUrl || DEFAULT_SUPABASE_CREDENTIALS.url).match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]) || 'gohycvfxflwwmdogiwse'}
                  </p>
                </div>

                {/* Project URL */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Project URL / REST Endpoint
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(clientUrl || DEFAULT_SUPABASE_CREDENTIALS.url);
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2000);
                      }}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedUrl ? 'Tersalin' : 'Salin URL'}
                    </button>
                  </div>
                  <p className="font-mono font-bold text-emerald-300 select-all break-all">
                    {clientUrl || DEFAULT_SUPABASE_CREDENTIALS.url}
                  </p>
                </div>
              </div>

              {/* Full API Key / Anon Key Box */}
              <div className="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    API Key / Anon Key (Public JWT Token Lengkap)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(clientKey || DEFAULT_SUPABASE_CREDENTIALS.anonKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedKey ? 'Berhasil Disalin!' : 'Salin API Key Lengkap'}
                  </button>
                </div>
                <p className="font-mono text-xs text-amber-300 break-all leading-relaxed select-all bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  {clientKey || DEFAULT_SUPABASE_CREDENTIALS.anonKey}
                </p>
              </div>

              {/* Authorization Bearer Header Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    HTTP Header Authorization (Bearer Token) &amp; apikey
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`Authorization: Bearer ${clientKey || DEFAULT_SUPABASE_CREDENTIALS.anonKey}\napikey: ${clientKey || DEFAULT_SUPABASE_CREDENTIALS.anonKey}`);
                      setCopiedBearer(true);
                      setTimeout(() => setCopiedBearer(false), 2000);
                    }}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBearer ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedBearer ? 'Header Tersalin!' : 'Salin HTTP Header'}
                  </button>
                </div>
                <pre className="font-mono text-[11px] text-slate-300 whitespace-pre-wrap break-all select-all leading-relaxed">
{`apikey: ${clientKey || DEFAULT_SUPABASE_CREDENTIALS.anonKey}
Authorization: Bearer ${clientKey || DEFAULT_SUPABASE_CREDENTIALS.anonKey}`}
                </pre>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{saveSuccess ? 'Koneksi Berhasil Disimpan!' : 'Simpan & Hubungkan Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmResetModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reset ke Pengaturan Awal</span>
                </button>
              </div>

              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 transition"
              >
                <span>Buka Dashboard Supabase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </form>
        </div>

        {/* BAGIAN 3: PUSAT SINKRONISASI DATA DUA ARAH & BACKUP RESTORE */}
        <div
          data-f4-section="Bagian 3: Sinkronisasi Cloud Dua Arah & Backup Database"
          data-f4-orientation="portrait"
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                2. Pusat Sinkronisasi Data Dua Arah (Cloud Sync) & Pencadangan (.JSON)
              </h3>
              <p className="text-xs text-slate-500">
                Unggah seluruh data lokal ke Supabase Cloud, unduh data dari Cloud ke perangkat ini, atau simpan salinan cadangan penuh.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Push Local to Cloud */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <UploadCloud className="w-5 h-5 text-emerald-600" />
                  <span>Unggah Lokal ke Cloud (Push)</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Kirim dan simpan seluruh data Kelas ({localStats.classesCount}), Siswa ({localStats.studentsCount}), Modul ({localStats.modulsCount}), Jurnal ({localStats.journalsCount}), dan Rubrik ({localStats.rubriksCount}) dari peramban ini ke tabel Supabase Cloud.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePushToCloud}
                disabled={isSyncingUp}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                {isSyncingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                <span>{isSyncingUp ? 'Mengunggah ke Cloud...' : 'Sinkronkan Lokal ke Supabase'}</span>
              </button>
            </div>

            {/* Pull Cloud to Local */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                  <DownloadCloud className="w-5 h-5 text-blue-600" />
                  <span>Unduh Cloud ke Lokal (Pull)</span>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Ambil data terbaru dari server Supabase Cloud dan perbarui penyimpanan lokal di perangkat ini agar sinkron antar-laptop/HP.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePullFromCloud}
                disabled={isSyncingDown}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                {isSyncingDown ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                <span>{isSyncingDown ? 'Mengunduh dari Cloud...' : 'Ambil Data dari Supabase'}</span>
              </button>
            </div>

            {/* Backup & Restore JSON */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <FileJson className="w-5 h-5 text-amber-600" />
                  <span>Cadangkan & Pulihkan (.JSON)</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Ekspor seluruh database administrasi PJOK ke file <code>.json</code> atau pulihkan data dari file cadangan kapan saja tanpa internet.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Backup JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileRestoreInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Restore JSON</span>
                </button>
                <input
                  ref={fileRestoreInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN 4: RINCIAN LENGKAP SKEMA TABEL & STRUKTUR KOLOM DATABASE */}
        <div
          data-f4-section="Bagian 4: Struktur Lengkap Skema Tabel PostgreSQL"
          data-f4-orientation="portrait"
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  3. Struktur Lengkap Skema Tabel Database PostgreSQL (Schema: <code>public</code>)
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar seluruh tabel beserta kolom, tipe data, kebijakan keamanan RLS, dan status kesiapan tabel di Supabase.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {DATABASE_SCHEMA_DEFINITIONS.map((schema, index) => {
              const tableExists = statusData.tables[schema.key];
              const cloudCount = statusData.tableCounts?.[schema.key] ?? 0;
              const localCount =
                schema.tableName === 'classes'
                  ? localStats.classesCount
                  : schema.tableName === 'moduls'
                  ? localStats.modulsCount
                  : schema.tableName === 'journals'
                  ? localStats.journalsCount
                  : schema.tableName === 'rubriks'
                  ? localStats.rubriksCount
                  : 4;

              return (
                <div
                  key={schema.tableName}
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/40"
                >
                  <div className="bg-slate-100/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900">
                            public.{schema.tableName}
                          </span>
                          <span className="text-xs font-bold text-slate-600">
                            — {schema.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{schema.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                        Lokal: {localCount} baris
                      </span>
                      {statusData.connected && (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-700">
                          Cloud: {cloudCount} baris
                        </span>
                      )}
                      {tableExists ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" /> READY
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertCircle className="w-3.5 h-3.5" /> PERLU SQL SETUP
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                          <th className="py-1.5 px-2 w-1/4">Nama Kolom</th>
                          <th className="py-1.5 px-2 w-1/4">Tipe Data PostgreSQL</th>
                          <th className="py-1.5 px-2">Keterangan / Fungsi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60">
                        {schema.columns.map((col) => (
                          <tr key={col.name} className="hover:bg-white">
                            <td className="py-1.5 px-2 font-mono font-bold text-slate-800">{col.name}</td>
                            <td className="py-1.5 px-2 font-mono text-emerald-700 font-semibold">{col.type}</td>
                            <td className="py-1.5 px-2 text-slate-600">{col.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold">Kebijakan RLS:</span>
                        {schema.rlsPolicies.map((pol) => (
                          <span key={pol} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 font-semibold">
                            {pol}
                          </span>
                        ))}
                      </div>
                      <span className="font-mono text-slate-400">Primary Key: {schema.primaryKey}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BAGIAN 5: SKRIP SQL LENGKAP (TAMPIL PENUH TANPA TERPOTONG) */}
        <div
          data-f4-section="Bagian 5: Skrip SQL Lengkap Pembuatan Tabel & RLS Supabase"
          data-f4-orientation="portrait"
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  4. Skrip SQL Lengkap Supabase (DDL Tabel & Kebijakan Row Level Security)
                </h3>
                <p className="text-xs text-slate-500">
                  Salin skrip SQL di bawah ini lalu jalankan pada menu <strong>SQL Editor → New Query → Run</strong> di Dashboard Supabase Anda.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSqlTab('full')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    sqlTab === 'full' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  SQL Lengkap (Tabel + RLS)
                </button>
                <button
                  type="button"
                  onClick={() => setSqlTab('ddl')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    sqlTab === 'ddl' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hanya Tabel (DDL)
                </button>
                <button
                  type="button"
                  onClick={() => setSqlTab('rls')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    sqlTab === 'rls' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hanya Policy (RLS)
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Skrip SQL Tersalin!' : 'Salin Skrip SQL'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSqlFile}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Unduh .SQL</span>
              </button>
            </div>
          </div>

          {/* Full Unclipped SQL Code Block */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>supabase_schema_sadar_pjok_sdn_kalimantong.sql</span>
              <span>PostgreSQL 15+ • Idempotent (Aman dijalankan berulang)</span>
            </div>
            <pre className="p-5 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap select-all">
              {activeSqlScript}
            </pre>
          </div>
        </div>

        {/* BAGIAN 6: KONFIGURASI ENVIRONMENT (.ENV) & PANDUAN LENGKAP */}
        <div
          data-f4-section="Bagian 6: Konfigurasi Environment (.env) & Panduan Langkah-demi-Langkah"
          data-f4-orientation="portrait"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Left: .env Configuration */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    5. Konfigurasi File <code>.env</code> (Server / Vercel / Hosting)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Gunakan variabel ini jika Anda men-deploy aplikasi ke Vercel, Netlify, atau Cloud Run.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyEnv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEnv ? 'Tersalin' : 'Salin .env'}</span>
              </button>
            </div>

            <pre className="bg-slate-900 text-amber-200 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap border border-slate-800">
              {envBlockText}
            </pre>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Keunggulan Arsitektur Dual-Sync SADAR PJOK:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-emerald-700">
                <li><strong>Tanpa Kehilangan Data:</strong> Setiap perubahan disimpan seketika di <code>LocalStorage</code> peramban sekaligus dikirim ke Supabase Cloud.</li>
                <li><strong>Siap Offline di Lapangan:</strong> Saat mengajar di lapangan olahraga tanpa sinyal internet, absensi dan penilaian tetap berjalan lancar.</li>
                <li><strong>Multi-Perangkat:</strong> Cukup masukkan URL & Anon Key yang sama di laptop dan smartphone untuk berbagi database sekolah.</li>
              </ul>
            </div>
          </div>

          {/* Right: Step-by-Step Guide */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  6. Panduan Lengkap Integrasi Supabase dari Awal
                </h4>
                <p className="text-[11px] text-slate-500">
                  Langkah praktis menyiapkan database cloud gratis untuk {namaSekolah}.
                </p>
              </div>
            </div>

            <ol className="space-y-3 text-xs text-slate-600">
              <li className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <p className="font-bold text-slate-800">Buat Project Baru di Supabase.com</p>
                  <p className="text-[11px] mt-0.5">
                    Buka <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-semibold">supabase.com</a>, login dengan akun Google/GitHub, lalu klik <strong>New Project</strong>. Beri nama misal <code>sadar-pjok-kalimantong</code> dan pilih region terdekat (Singapore).
                  </p>
                </div>
              </li>
              <li className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <p className="font-bold text-slate-800">Salin Project URL & Anon Key</p>
                  <p className="text-[11px] mt-0.5">
                    Di menu kiri Supabase, buka <strong>Project Settings (ikon roda gigi) → API</strong>. Salin <strong>Project URL</strong> dan <strong>Project API Keys (anon / public)</strong> ke formulir Bagian 1 di halaman ini, lalu klik <strong>Simpan & Hubungkan Supabase</strong>.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <p className="font-bold text-slate-800">Jalankan Skrip SQL di SQL Editor</p>
                  <p className="text-[11px] mt-0.5">
                    Klik tombol <strong>Salin Skrip SQL</strong> pada Bagian 4 di atas. Buka menu <strong>SQL Editor</strong> di dashboard Supabase, klik <strong>New Query</strong>, tempelkan skrip, lalu tekan tombol <strong>Run</strong>.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">4</span>
                <div>
                  <p className="font-bold text-slate-800">Verifikasi & Sinkronkan Data</p>
                  <p className="text-[11px] mt-0.5">
                    Klik tombol <strong>Uji Koneksi</strong> untuk memastikan seluruh tabel berstatus <strong>READY</strong>, kemudian klik <strong>Sinkronkan Lokal ke Supabase</strong> untuk mengunggah seluruh data awal Anda ke cloud.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Reset Kredensial (Pengganti window.confirm) */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-base text-slate-900">Reset Kredensial Supabase?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kredensial kustom di peramban ini akan dihapus dan dikembalikan ke pengaturan default. Data administrasi lokal Anda di peramban tetap aman dan tidak terhapus.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDisconnectClient}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Ya, Reset Kredensial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Database & Cloud Sync Supabase"
        subtitle={`Panduan Sinkronisasi Database PostgreSQL - ${namaSekolah} (${tahunPelajaran})`}
        tabs={getKodeEtikKkoCetakPrompts("Integrasi Database Supabase dan Cloud Storage")}
        defaultActiveTab="prompt_menu"
        jsonData={{
          satuanPendidikan: namaSekolah,
          tahunPelajaran,
          status: statusData,
          configured: statusData.configured,
          tables: statusData.tables,
          localStats: {
            classes: localStats.classesCount,
            students: localStats.studentsCount,
            moduls: localStats.modulsCount,
            journals: localStats.journalsCount,
            rubriks: localStats.rubriksCount
          },
          sqlSchemaScript: activeSqlScript
        }}
        jsonFilename="Supabase_Config_SADAR_PJOK_SDN_Kalimantong.json"
      />
    </div>
  );
}
