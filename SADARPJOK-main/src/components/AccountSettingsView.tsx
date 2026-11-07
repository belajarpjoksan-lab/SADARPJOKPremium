import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Key } from 'lucide-react';
import { downloadJsonFile } from '../lib/exportUtils';
import AiPromptModal from './AiPromptModal';
import ExportJsonPromptAiButtons from './ExportJsonPromptAiButtons';
import { getKodeEtikKkoCetakPrompts } from '../utils/aiPromptGenerators';

export default function AccountSettingsView() {
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(() => {
    return localStorage.getItem('sadar_pjok_admin_username') || 'admin';
  });
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const actualPassword = localStorage.getItem('sadar_pjok_admin_password') || 'admin123';

    // 1. Validate old password
    if (oldPassword !== actualPassword) {
      setError('Password lama yang Anda masukkan salah.');
      return;
    }

    // 2. Validate new password matches confirm password
    if (newPassword !== confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    // 3. Minimum length for new password
    if (newPassword.length < 5) {
      setError('Password baru harus minimal terdiri dari 5 karakter.');
      return;
    }

    // 4. Save changes
    localStorage.setItem('sadar_pjok_admin_username', newUsername.trim());
    localStorage.setItem('sadar_pjok_admin_password', newPassword);
    
    setCurrentUsername(newUsername.trim());
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    setSuccess('Kredensial login Anda berhasil diperbarui! Silakan gunakan password baru ini untuk sesi masuk berikutnya.');
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-slate-700">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Key className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Keamanan Akun
            </div>
            <h2 className="text-3xl font-black tracking-tight">Pengaturan Kredensial</h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
              Kelola username dan password administrasi SADAR PJOK Anda untuk melindungi data rekap, jurnal, dan RPP Anda dari akses yang tidak diinginkan.
            </p>
          </div>
          <div className="shrink-0 bg-white/10 backdrop-blur-xs p-2 rounded-2xl border border-white/20">
            <ExportJsonPromptAiButtons
              onExportJson={() => {
                const filename = `Akun_Administrasi_SADAR_PJOK_${currentUsername}.json`;
                downloadJsonFile(filename, {
                  username: currentUsername,
                  lastUpdated: new Date().toISOString()
                });
              }}
              onOpenPromptAi={() => setShowPromptModal(true)}
            />
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-3xl border border-slate-150 p-6 md:p-8 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-600" />
          Ubah Password & Username
        </h3>

        <form onSubmit={handleUpdateAccount} className="space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-rose-700 text-xs leading-relaxed animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold">Gagal Menyimpan:</span> {error}
              </div>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-emerald-700 text-xs leading-relaxed">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Berhasil!</span> {success}
              </div>
            </div>
          )}

          {/* Username Row */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Username Baru
            </label>
            <div className="relative rounded-xl shadow-xs max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="admin"
                className="block w-full pl-10 pr-3 py-2.5 text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold"
              />
            </div>
            <p className="text-[10px] text-slate-400">Username aktif saat ini: <strong className="font-mono text-slate-500">{currentUsername}</strong></p>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-6">
            
            {/* Old Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Password Lama <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-xs max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showOldPass ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="block w-full pl-10 pr-10 py-2.5 text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showOldPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Verifikasi identitas Anda dengan memasukkan password lama sebelum mengubah kredensial.</p>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Password Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-xs max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password baru (min. 5 karakter)"
                  className="block w-full pl-10 pr-10 py-2.5 text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showNewPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Konfirmasi Password Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-xs max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className="block w-full pl-10 pr-10 py-2.5 text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>

      {/* MODAL PROMPT AI (GEMINI / CHATGPT) */}
      <AiPromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Prompt AI - Keamanan Data & Akun Guru"
        subtitle="Panduan Perlindungan Data Administrasi dan Privasi Siswa"
        tabs={getKodeEtikKkoCetakPrompts("Keamanan Data Siswa dan Akun Guru Digital")}
        defaultActiveTab="prompt_menu"
        jsonData={{
          username: currentUsername,
          lastUpdated: new Date().toISOString()
        }}
        jsonFilename={`Akun_Administrasi_SADAR_PJOK_${currentUsername}.json`}
      />
    </div>
  );
}
