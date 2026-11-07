import { createClient } from '@supabase/supabase-js';
import { ClassData, JurnalMengajar, ModulAjar, RubrikFisik } from '../types';
import { INITIAL_CLASSES, INITIAL_JOURNALS, INITIAL_MODULS, PREBUILT_RUBRIKS } from '../data';

// Local storage keys
const STORAGE_KEYS = {
  CLASSES: 'sadar_pjok_classes',
  MODULS: 'sadar_pjok_moduls',
  JOURNALS: 'sadar_pjok_journals',
  RUBRIKS: 'sadar_pjok_rubriks',
  SUPABASE_URL: 'sadar_pjok_client_supabase_url',
  SUPABASE_ANON_KEY: 'sadar_pjok_client_supabase_anon_key',
};

export const DEFAULT_SUPABASE_CREDENTIALS = {
  url: 'https://gohycvfxflwwmdogiwse.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaHljdmZ4Zmx3d21kb2dpd3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMjAxODIsImV4cCI6MjEwMDg5NjE4Mn0.kUE56HSrf0AZB0a7HFDz2mjrEaPskQ-4RSOWDhrymPQ'
};

export function hasCustomClientCredentials(): boolean {
  const url = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL);
  const anonKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
  return Boolean(url && anonKey && url.trim() && anonKey.trim());
}

// Check if client-side Supabase is configured
export function getClientSupabaseCredentials() {
  const url = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL);
  const anonKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
  if (url && anonKey && url.trim() && anonKey.trim()) {
    return { url: url.trim(), anonKey: anonKey.trim(), isCustom: true };
  }
  return {
    ...DEFAULT_SUPABASE_CREDENTIALS,
    isCustom: false
  };
}

// Instantiate client-side Supabase if config exists
let clientSupabaseInstance: any = null;
let clientSupabaseUrlUsed: string = '';
let clientSupabaseKeyUsed: string = '';

export function saveClientSupabaseCredentials(url: string, anonKey: string) {
  clientSupabaseInstance = null;
  if (url.trim() && anonKey.trim()) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
  }
}

export function clearClientSupabaseCredentials() {
  clientSupabaseInstance = null;
  localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
  localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
}

export function getClientSupabase() {
  const creds = getClientSupabaseCredentials();
  if (!creds || !creds.url || !creds.anonKey) {
    clientSupabaseInstance = null;
    return null;
  }
  if (
    !clientSupabaseInstance ||
    clientSupabaseUrlUsed !== creds.url ||
    clientSupabaseKeyUsed !== creds.anonKey
  ) {
    try {
      let cleanedUrl = creds.url.trim();
      if (cleanedUrl.endsWith('/rest/v1/')) {
        cleanedUrl = cleanedUrl.slice(0, -9);
      } else if (cleanedUrl.endsWith('/rest/v1')) {
        cleanedUrl = cleanedUrl.slice(0, -8);
      }
      clientSupabaseInstance = createClient(cleanedUrl, creds.anonKey.trim());
      clientSupabaseUrlUsed = creds.url;
      clientSupabaseKeyUsed = creds.anonKey;
    } catch (e) {
      console.error('Error creating client-side Supabase:', e);
      return null;
    }
  }
  return clientSupabaseInstance;
}

// Check status (Unified status checker for Header/Settings view)
export interface UnifiedDbStatus {
  configured: boolean; // Is Supabase configured (either client or server)
  isClientSide: boolean; // Is it client-side config?
  connected: boolean; // Is connection working
  allExist: boolean; // Do tables exist
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
  error: string | null;
  sqlScript: string;
}

export async function checkUnifiedDbStatus(): Promise<UnifiedDbStatus> {
  const clientCreds = getClientSupabaseCredentials();
  const isCustomClient = hasCustomClientCredentials();
  const startTime = Date.now();

  // 1. If user explicitly configured client credentials in browser, test client-side first
  if (isCustomClient && clientCreds) {
    const supabase = getClientSupabase();
    if (supabase) {
      const tables = { classes: false, moduls: false, journals: false, rubriks: false };
      const tableCounts = { classes: 0, moduls: 0, journals: 0, rubriks: 0 };
      let allExist = false;
      let connected = false;
      let errorMsg: string | null = null;

      try {
        const [resClasses, resModuls, resJournals, resRubriks] = await Promise.all([
          supabase.from('classes').select('id', { count: 'exact', head: false }).limit(100),
          supabase.from('moduls').select('id', { count: 'exact', head: false }).limit(100),
          supabase.from('journals').select('id', { count: 'exact', head: false }).limit(100),
          supabase.from('rubriks').select('id', { count: 'exact', head: false }).limit(100)
        ]);

        connected = true;
        tables.classes = !resClasses.error || resClasses.error.code !== '42P01';
        tables.moduls = !resModuls.error || resModuls.error.code !== '42P01';
        tables.journals = !resJournals.error || resJournals.error.code !== '42P01';
        tables.rubriks = !resRubriks.error || resRubriks.error.code !== '42P01';

        tableCounts.classes = Array.isArray(resClasses.data) ? resClasses.data.length : 0;
        tableCounts.moduls = Array.isArray(resModuls.data) ? resModuls.data.length : 0;
        tableCounts.journals = Array.isArray(resJournals.data) ? resJournals.data.length : 0;
        tableCounts.rubriks = Array.isArray(resRubriks.data) ? resRubriks.data.length : 0;

        allExist = tables.classes && tables.moduls && tables.journals && tables.rubriks;
        if (resClasses.error && resClasses.error.code !== '42P01') {
          errorMsg = resClasses.error.message;
        }
      } catch (err: any) {
        errorMsg = err.message || 'Gagal menyambung ke Supabase dari peramban.';
      }

      return {
        configured: true,
        isClientSide: true,
        connected,
        allExist,
        tables,
        tableCounts,
        activeUrl: clientCreds.url,
        latencyMs: Date.now() - startTime,
        error: errorMsg,
        sqlScript: DEFAULT_SQL_SCRIPT
      };
    }
  }

  // 2. Try to check Server-side configuration
  try {
    const res = await fetch('/api/supabase-status');
    if (res.ok) {
      const serverStatus = await res.json();
      if (serverStatus.configured) {
        return {
          configured: true,
          isClientSide: false,
          connected: serverStatus.connected,
          allExist: serverStatus.allExist,
          tables: serverStatus.tables || { classes: false, moduls: false, journals: false, rubriks: false },
          activeUrl: clientCreds?.url || DEFAULT_SUPABASE_CREDENTIALS.url,
          latencyMs: Date.now() - startTime,
          error: serverStatus.error,
          sqlScript: serverStatus.sqlScript || DEFAULT_SQL_SCRIPT
        };
      }
    }
  } catch (e) {
    console.log('[Unified DB Check] API status endpoint not reachable. Falling back to client-side checks.');
  }

  // 3. Try Default Client-side configuration
  if (clientCreds) {
    const supabase = getClientSupabase();
    if (supabase) {
      const tables = { classes: false, moduls: false, journals: false, rubriks: false };
      const tableCounts = { classes: 0, moduls: 0, journals: 0, rubriks: 0 };
      let allExist = false;
      let connected = false;
      let errorMsg: string | null = null;

      try {
        const [resClasses, resModuls, resJournals, resRubriks] = await Promise.all([
          supabase.from('classes').select('id').limit(100),
          supabase.from('moduls').select('id').limit(100),
          supabase.from('journals').select('id').limit(100),
          supabase.from('rubriks').select('id').limit(100)
        ]);

        connected = true;
        tables.classes = !resClasses.error || resClasses.error.code !== '42P01';
        tables.moduls = !resModuls.error || resModuls.error.code !== '42P01';
        tables.journals = !resJournals.error || resJournals.error.code !== '42P01';
        tables.rubriks = !resRubriks.error || resRubriks.error.code !== '42P01';
        
        tableCounts.classes = Array.isArray(resClasses.data) ? resClasses.data.length : 0;
        tableCounts.moduls = Array.isArray(resModuls.data) ? resModuls.data.length : 0;
        tableCounts.journals = Array.isArray(resJournals.data) ? resJournals.data.length : 0;
        tableCounts.rubriks = Array.isArray(resRubriks.data) ? resRubriks.data.length : 0;

        allExist = tables.classes && tables.moduls && tables.journals && tables.rubriks;
        if (resClasses.error && resClasses.error.code !== '42P01') {
          errorMsg = resClasses.error.message;
        }
      } catch (err: any) {
        errorMsg = err.message || 'Gagal menyambung ke Supabase dari peramban.';
      }

      return {
        configured: true,
        isClientSide: true,
        connected,
        allExist,
        tables,
        tableCounts,
        activeUrl: clientCreds.url,
        latencyMs: Date.now() - startTime,
        error: errorMsg,
        sqlScript: DEFAULT_SQL_SCRIPT
      };
    }
  }

  // 4. Fallback to Local Storage only
  return {
    configured: false,
    isClientSide: false,
    connected: false,
    allExist: false,
    tables: { classes: false, moduls: false, journals: false, rubriks: false },
    tableCounts: { classes: 0, moduls: 0, journals: 0, rubriks: 0 },
    activeUrl: '',
    latencyMs: Date.now() - startTime,
    error: 'Supabase belum dikonfigurasi di server maupun peramban. Menggunakan Penyimpanan Lokal.',
    sqlScript: DEFAULT_SQL_SCRIPT
  };
}

// Helper to load fallback data from localStorage or standard mock data
function getLocalFallback<T>(key: string, initialData: T): T {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored) as T;
    } catch (e) {
      console.error(`Error parsing localStorage key: ${key}`, e);
    }
  }
  return initialData;
}

function saveLocalFallback<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

function normalizeClasses(classes: ClassData[]): ClassData[] {
  if (!Array.isArray(classes)) return [];
  return classes.map(cls => ({
    ...cls,
    students: (cls.students || []).map(st => {
      const rawG = String(st.gender || '').trim().toUpperCase();
      const validGender: 'L' | 'P' = (rawG === 'P' || rawG === 'PEREMPUAN' || rawG === 'W' || rawG === 'WANITA' || rawG === 'FEMALE') ? 'P' : 'L';
      return {
        ...st,
        gender: validGender
      };
    })
  }));
}

// Unified CRUD operations
export async function getClasses(): Promise<ClassData[]> {
  // Check client Supabase
  const clientSupabase = getClientSupabase();
  if (clientSupabase) {
    try {
      const { data, error } = await clientSupabase.from('classes').select('*').order('name');
      if (!error && data) {
        const normalized = normalizeClasses(data as ClassData[]);
        saveLocalFallback(STORAGE_KEYS.CLASSES, normalized);
        return normalized;
      }
    } catch (e) {
      console.error('Error fetching classes from client Supabase:', e);
    }
  }

  // Check Server Supabase Proxy
  try {
    const res = await fetch('/api/classes');
    if (res.ok) {
      const data = await res.json();
      const normalized = normalizeClasses(data);
      saveLocalFallback(STORAGE_KEYS.CLASSES, normalized);
      return normalized;
    }
  } catch (e) {
    console.log('[DB Client] API /api/classes failed, using local storage.');
  }

  // Fallback to Local Storage
  const local = getLocalFallback<ClassData[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  return normalizeClasses(local);
}

export async function saveClasses(allClasses: ClassData[]): Promise<boolean> {
  // Always update local storage first (offline compatibility)
  saveLocalFallback(STORAGE_KEYS.CLASSES, allClasses);

  // Sync to Client Supabase
  const clientSupabase = getClientSupabase();
  if (clientSupabase) {
    try {
      for (const cls of allClasses) {
        await clientSupabase.from('classes').upsert({
          id: cls.id,
          name: cls.name,
          grade: cls.grade,
          students: cls.students
        });
      }
      return true;
    } catch (e) {
      console.error('Error syncing classes to client Supabase:', e);
    }
  }

  // Sync to Server Supabase Proxy
  try {
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allClasses)
    });
    return res.ok;
  } catch (e) {
    console.error('[DB Client] API save classes failed:', e);
    return false;
  }
}

export async function deleteClass(classId: string): Promise<boolean> {
  const current = await getClasses();
  const updated = current.filter(c => c.id !== classId);
  saveLocalFallback(STORAGE_KEYS.CLASSES, updated);

  const clientSupabase = getClientSupabase();
  if (clientSupabase) {
    try {
      await clientSupabase.from('classes').delete().eq('id', classId);
    } catch (e) {
      console.error(e);
    }
  }

  try {
    await fetch(`/api/classes/${classId}`, { method: 'DELETE' }).catch(() => null);
  } catch (e) {}
  
  return true;
}

export async function getModuls(): Promise<ModulAjar[]> {
  const clientSupabase = getClientSupabase();
  if (clientSupabase) {
    try {
      const { data, error } = await clientSupabase.from('moduls').select('*').order('created_at', { ascending: false });
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
        saveLocalFallback(STORAGE_KEYS.MODULS, mapped);
        return mapped as ModulAjar[];
      }
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const res = await fetch('/api/moduls');
    if (res.ok) {
      const data = await res.json();
      saveLocalFallback(STORAGE_KEYS.MODULS, data);
      return data;
    }
  } catch (e) {}

  return getLocalFallback<ModulAjar[]>(STORAGE_KEYS.MODULS, INITIAL_MODULS);
}

export async function saveModul(modul: ModulAjar): Promise<boolean> {
  const current = await getModuls();
  const exists = current.some(m => m.id === modul.id);
  const updated = exists ? current.map(m => m.id === modul.id ? modul : m) : [modul, ...current];
  saveLocalFallback(STORAGE_KEYS.MODULS, updated);

  const clientSupabase = getClientSupabase();
  if (clientSupabase) {
    try {
      await clientSupabase.from('moduls').upsert({
        id: modul.id,
        title: modul.title,
        grade: modul.grade,
        semester: modul.semester,
        materi_pokok: modul.materiPokok,
        alokasi_waktu: modul.alokasiWaktu,
        tujuan_pembelajaran: modul.tujuanPembelajaran,
        kegiatan_pembelajaran: modul.kegiatanPembelajaran,
        sarana_prasarana: modul.saranaPrasarana,
        rubrik_penilaian: modul.rubrikPenilaian,
        created_at: modul.createdAt
      });
      return true;
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const res = await fetch('/api/moduls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modul)
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function deleteModul(id: string): Promise<boolean> {
  const current = await getModuls();
  const updated = current.filter(m => m.id !== id);
  saveLocalFallback(STORAGE_KEYS.MODULS, updated);

  const clientSupabase = getClientSupabase();
  if (clientSupabase) {
    try {
      await clientSupabase.from('moduls').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  }

  try {
    await fetch(`/api/moduls/${id}`, { method: 'DELETE' }).catch(() => null);
  } catch (e) {}

  return true;
}

export async function getJournals(): Promise<JurnalMengajar[]> {
  const clientSupabase = getClientSupabase();
  if (clientSupabase) {
    try {
      const { data, error } = await clientSupabase.from('journals').select('*').order('date', { ascending: false });
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
        saveLocalFallback(STORAGE_KEYS.JOURNALS, mapped);
        return mapped as JurnalMengajar[];
      }
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const res = await fetch('/api/journals');
    if (res.ok) {
      const data = await res.json();
      saveLocalFallback(STORAGE_KEYS.JOURNALS, data);
      return data;
    }
  } catch (e) {}

  return getLocalFallback<JurnalMengajar[]>(STORAGE_KEYS.JOURNALS, INITIAL_JOURNALS);
}

export async function saveJournal(journal: JurnalMengajar): Promise<boolean> {
  const current = await getJournals();
  const exists = current.some(j => j.id === journal.id);
  const updated = exists ? current.map(j => j.id === journal.id ? journal : j) : [journal, ...current];
  saveLocalFallback(STORAGE_KEYS.JOURNALS, updated);

  const clientSupabase = getClientSupabase();
  if (clientSupabase) {
    try {
      await clientSupabase.from('journals').upsert({
        id: journal.id,
        date: journal.date,
        class_id: journal.classId,
        class_name: journal.className,
        materi: journal.materi,
        catatan_kejadian: journal.catatanKejadian,
        tindak_lanjut: journal.tindakLanjut
      });
      return true;
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const res = await fetch('/api/journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(journal)
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function deleteJournal(id: string): Promise<boolean> {
  const current = await getJournals();
  const updated = current.filter(j => j.id !== id);
  saveLocalFallback(STORAGE_KEYS.JOURNALS, updated);

  const clientSupabase = getClientSupabase();
  if (clientSupabase) {
    try {
      await clientSupabase.from('journals').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  }

  try {
    await fetch(`/api/journals/${id}`, { method: 'DELETE' }).catch(() => null);
  } catch (e) {}

  return true;
}

export async function getRubriks(): Promise<RubrikFisik[]> {
  const clientSupabase = getClientSupabase();
  if (clientSupabase) {
    try {
      const { data, error } = await clientSupabase.from('rubriks').select('*');
      if (!error && data) {
        saveLocalFallback(STORAGE_KEYS.RUBRIKS, data);
        return data as RubrikFisik[];
      }
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const res = await fetch('/api/rubriks');
    if (res.ok) {
      const data = await res.json();
      saveLocalFallback(STORAGE_KEYS.RUBRIKS, data);
      return data;
    }
  } catch (e) {}

  return getLocalFallback<RubrikFisik[]>(STORAGE_KEYS.RUBRIKS, PREBUILT_RUBRIKS);
}

export async function saveRubrik(rubrik: RubrikFisik): Promise<boolean> {
  const current = await getRubriks();
  const exists = current.some(r => r.id === rubrik.id);
  const updated = exists ? current.map(r => r.id === rubrik.id ? rubrik : r) : [rubrik, ...current];
  saveLocalFallback(STORAGE_KEYS.RUBRIKS, updated);

  const clientSupabase = getClientSupabase();
  if (clientSupabase) {
    try {
      await clientSupabase.from('rubriks').upsert({
        id: rubrik.id,
        materi: rubrik.materi,
        kategori: rubrik.kategori,
        indikator: rubrik.indikator
      });
      return true;
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const res = await fetch('/api/rubriks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rubrik)
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function deleteRubrik(id: string): Promise<boolean> {
  const current = await getRubriks();
  const updated = current.filter(r => r.id !== id);
  saveLocalFallback(STORAGE_KEYS.RUBRIKS, updated);

  const clientSupabase = getClientSupabase();
  if (clientSupabase) {
    try {
      await clientSupabase.from('rubriks').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  }

  try {
    await fetch(`/api/rubriks/${id}`, { method: 'DELETE' }).catch(() => null);
  } catch (e) {}

  return true;
}

export const DEFAULT_SQL_SCRIPT = `
-- =========================================================================
-- SKRIP SQL INTEGRASI SUPABASE CLOUD - SADAR PJOK (SD NEGERI KALIMANTONG)
-- TAHUN PELAJARAN 2026/2027
-- Jalankan seluruh skrip ini di menu SQL Editor pada Dashboard Supabase Anda
-- =========================================================================

-- 1. Tabel Kelas & Rombongan Belajar (classes)
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade INT NOT NULL,
  students JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Modul Ajar / RPP & RPM Deep Learning (moduls)
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

-- 3. Tabel Jurnal Mengajar Harian (journals)
CREATE TABLE IF NOT EXISTS journals (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  class_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  materi TEXT NOT NULL,
  catatan_kejadian TEXT NOT NULL,
  tindak_lanjut TEXT NOT NULL
);

-- 4. Tabel Rubrik Penilaian Fisik & Keterampilan (rubriks)
CREATE TABLE IF NOT EXISTS rubriks (
  id TEXT PRIMARY KEY,
  materi TEXT NOT NULL,
  kategori TEXT NOT NULL,
  indikator JSONB NOT NULL
);

-- 5. Tabel Arsip Perangkat Ajar Kurikulum Merdeka (perangkat_ajar)
CREATE TABLE IF NOT EXISTS perangkat_ajar (
  id TEXT PRIMARY KEY,
  kategori TEXT NOT NULL, -- 'RPM_1_PERTEMUAN' | 'RPM_1_BAB' | 'RPM_1_TP' | 'PROTA' | 'PROSEM' | 'RPE' | 'KKTP' | 'ASAT' | 'US'
  judul TEXT NOT NULL,
  sekolah TEXT DEFAULT 'SD Negeri Kalimantong',
  tahun_ajaran TEXT DEFAULT '2026/2027',
  kelas TEXT,
  semester TEXT,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- KONFIGURASI ROW LEVEL SECURITY (RLS) & KEBIJAKAN AKSES (POLICIES)
-- =========================================================================
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moduls ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubriks ENABLE ROW LEVEL SECURITY;
ALTER TABLE perangkat_ajar ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika sudah ada agar tidak bentrok saat dijalankan ulang
DROP POLICY IF EXISTS "Allow public select classes" ON classes;
DROP POLICY IF EXISTS "Allow public insert classes" ON classes;
DROP POLICY IF EXISTS "Allow public update classes" ON classes;
DROP POLICY IF EXISTS "Allow public delete classes" ON classes;

DROP POLICY IF EXISTS "Allow public select moduls" ON moduls;
DROP POLICY IF EXISTS "Allow public insert moduls" ON moduls;
DROP POLICY IF EXISTS "Allow public update moduls" ON moduls;
DROP POLICY IF EXISTS "Allow public delete moduls" ON moduls;

DROP POLICY IF EXISTS "Allow public select journals" ON journals;
DROP POLICY IF EXISTS "Allow public insert journals" ON journals;
DROP POLICY IF EXISTS "Allow public update journals" ON journals;
DROP POLICY IF EXISTS "Allow public delete journals" ON journals;

DROP POLICY IF EXISTS "Allow public select rubriks" ON rubriks;
DROP POLICY IF EXISTS "Allow public insert rubriks" ON rubriks;
DROP POLICY IF EXISTS "Allow public update rubriks" ON rubriks;
DROP POLICY IF EXISTS "Allow public delete rubriks" ON rubriks;

DROP POLICY IF EXISTS "Allow public all perangkat_ajar" ON perangkat_ajar;

-- Buat Policy Akses Publik (Anon Key)
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

CREATE POLICY "Allow public all perangkat_ajar" ON perangkat_ajar FOR ALL USING (true) WITH CHECK (true);
`;

export function getLocalDataSummary() {
  const classes = getLocalFallback<ClassData[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const moduls = getLocalFallback<ModulAjar[]>(STORAGE_KEYS.MODULS, INITIAL_MODULS);
  const journals = getLocalFallback<JurnalMengajar[]>(STORAGE_KEYS.JOURNALS, INITIAL_JOURNALS);
  const rubriks = getLocalFallback<RubrikFisik[]>(STORAGE_KEYS.RUBRIKS, PREBUILT_RUBRIKS);
  const totalStudents = classes.reduce((acc, c) => acc + (c.students?.length || 0), 0);

  return {
    classesCount: classes.length,
    studentsCount: totalStudents,
    modulsCount: moduls.length,
    journalsCount: journals.length,
    rubriksCount: rubriks.length,
    classes,
    moduls,
    journals,
    rubriks
  };
}

export async function syncAllLocalToSupabase(): Promise<{
  success: boolean;
  message: string;
  syncedCounts: { classes: number; moduls: number; journals: number; rubriks: number };
}> {
  const summary = getLocalDataSummary();
  const supabase = getClientSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'Klien Supabase belum dikonfigurasi.',
      syncedCounts: { classes: 0, moduls: 0, journals: 0, rubriks: 0 }
    };
  }

  let cCount = 0;
  let mCount = 0;
  let jCount = 0;
  let rCount = 0;

  try {
    for (const cls of summary.classes) {
      const { error } = await supabase.from('classes').upsert({
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        students: cls.students
      });
      if (!error) cCount++;
    }

    for (const m of summary.moduls) {
      const { error } = await supabase.from('moduls').upsert({
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
      if (!error) mCount++;
    }

    for (const j of summary.journals) {
      const { error } = await supabase.from('journals').upsert({
        id: j.id,
        date: j.date,
        class_id: j.classId,
        class_name: j.className,
        materi: j.materi,
        catatan_kejadian: j.catatanKejadian,
        tindak_lanjut: j.tindakLanjut
      });
      if (!error) jCount++;
    }

    for (const r of summary.rubriks) {
      const { error } = await supabase.from('rubriks').upsert({
        id: r.id,
        materi: r.materi,
        kategori: r.kategori,
        indikator: r.indikator
      });
      if (!error) rCount++;
    }

    return {
      success: true,
      message: `Berhasil mengunggah ${cCount} Kelas, ${mCount} Modul Ajar, ${jCount} Jurnal, dan ${rCount} Rubrik ke Supabase Cloud.`,
      syncedCounts: { classes: cCount, moduls: mCount, journals: jCount, rubriks: rCount }
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal melakukan sinkronisasi ke Supabase Cloud.',
      syncedCounts: { classes: cCount, moduls: mCount, journals: jCount, rubriks: rCount }
    };
  }
}

export async function pullAllFromSupabaseToLocal(): Promise<{
  success: boolean;
  message: string;
  pulledCounts: { classes: number; moduls: number; journals: number; rubriks: number };
}> {
  const supabase = getClientSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'Klien Supabase belum dikonfigurasi.',
      pulledCounts: { classes: 0, moduls: 0, journals: 0, rubriks: 0 }
    };
  }

  try {
    const [resC, resM, resJ, resR] = await Promise.all([
      supabase.from('classes').select('*').order('name'),
      supabase.from('moduls').select('*').order('created_at', { ascending: false }),
      supabase.from('journals').select('*').order('date', { ascending: false }),
      supabase.from('rubriks').select('*')
    ]);

    let cCount = 0;
    let mCount = 0;
    let jCount = 0;
    let rCount = 0;

    if (!resC.error && Array.isArray(resC.data) && resC.data.length > 0) {
      const normalized = normalizeClasses(resC.data as ClassData[]);
      saveLocalFallback(STORAGE_KEYS.CLASSES, normalized);
      cCount = normalized.length;
    }

    if (!resM.error && Array.isArray(resM.data) && resM.data.length > 0) {
      const mapped = resM.data.map((d: any) => ({
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
      saveLocalFallback(STORAGE_KEYS.MODULS, mapped);
      mCount = mapped.length;
    }

    if (!resJ.error && Array.isArray(resJ.data) && resJ.data.length > 0) {
      const mapped = resJ.data.map((d: any) => ({
        id: d.id,
        date: d.date,
        classId: d.class_id,
        className: d.class_name,
        materi: d.materi,
        catatanKejadian: d.catatan_kejadian,
        tindakLanjut: d.tindak_lanjut
      }));
      saveLocalFallback(STORAGE_KEYS.JOURNALS, mapped);
      jCount = mapped.length;
    }

    if (!resR.error && Array.isArray(resR.data) && resR.data.length > 0) {
      saveLocalFallback(STORAGE_KEYS.RUBRIKS, resR.data);
      rCount = resR.data.length;
    }

    return {
      success: true,
      message: `Berhasil mengunduh data dari Supabase Cloud ke Peramban (${cCount} Kelas, ${mCount} Modul, ${jCount} Jurnal, ${rCount} Rubrik).`,
      pulledCounts: { classes: cCount, moduls: mCount, journals: jCount, rubriks: rCount }
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal mengunduh data dari Supabase Cloud.',
      pulledCounts: { classes: 0, moduls: 0, journals: 0, rubriks: 0 }
    };
  }
}

export function exportFullBackupObject() {
  const summary = getLocalDataSummary();
  const creds = getClientSupabaseCredentials();
  return {
    app: 'SADAR PJOK - Administrasi Guru PJOK Premium',
    satuanPendidikan: 'SD Negeri Kalimantong',
    tahunPelajaran: '2026/2027',
    exportedAt: new Date().toISOString(),
    supabaseConfig: {
      url: creds.url,
      isCustom: creds.isCustom
    },
    data: {
      classes: summary.classes,
      moduls: summary.moduls,
      journals: summary.journals,
      rubriks: summary.rubriks,
      prota: localStorage.getItem('perangkat_ajar_prota_data_v2') ? JSON.parse(localStorage.getItem('perangkat_ajar_prota_data_v2')!) : null,
      prosem: localStorage.getItem('perangkat_ajar_prosem_data_v2') ? JSON.parse(localStorage.getItem('perangkat_ajar_prosem_data_v2')!) : null
    }
  };
}

export function restoreFullBackupObject(backupJson: any): { success: boolean; message: string } {
  try {
    const payload = backupJson?.data || backupJson;
    if (!payload || typeof payload !== 'object') {
      return { success: false, message: 'Format file backup JSON tidak valid.' };
    }
    if (Array.isArray(payload.classes)) {
      saveLocalFallback(STORAGE_KEYS.CLASSES, normalizeClasses(payload.classes));
    }
    if (Array.isArray(payload.moduls)) {
      saveLocalFallback(STORAGE_KEYS.MODULS, payload.moduls);
    }
    if (Array.isArray(payload.journals)) {
      saveLocalFallback(STORAGE_KEYS.JOURNALS, payload.journals);
    }
    if (Array.isArray(payload.rubriks)) {
      saveLocalFallback(STORAGE_KEYS.RUBRIKS, payload.rubriks);
    }
    if (payload.prota) {
      localStorage.setItem('perangkat_ajar_prota_data_v2', JSON.stringify(payload.prota));
    }
    if (payload.prosem) {
      localStorage.setItem('perangkat_ajar_prosem_data_v2', JSON.stringify(payload.prosem));
    }
    return {
      success: true,
      message: 'Seluruh data backup berhasil dipulihkan ke penyimpanan lokal aplikasi!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal membaca file backup JSON.'
    };
  }
}

