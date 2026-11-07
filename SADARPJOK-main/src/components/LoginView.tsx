import React, { useState } from 'react';
import { Flame, Lock, User, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const expectedUsername = localStorage.getItem('sadar_pjok_admin_username') || 'admin';
    const expectedPassword = localStorage.getItem('sadar_pjok_admin_password') || 'admin123';

    if (username.trim() === expectedUsername && password === expectedPassword) {
      sessionStorage.setItem('sadar_pjok_logged_in', 'true');
      onLoginSuccess();
    } else {
      setError('Username atau password yang Anda masukkan salah.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo Brand */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-500/10 mb-4 animate-bounce">
          <Flame className="w-8 h-8 fill-white" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
          SADAR <span className="text-emerald-600">PJOK</span>
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Administrasi Guru Premium &bull; Masuk ke Akun
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-100 sm:rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-rose-700 text-xs leading-relaxed animate-shake">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">Gagal Masuk:</span> {error}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="block w-full pl-10 pr-3 py-2.5 text-slate-800 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 text-slate-800 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                Masuk Sekarang
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Kredensial Default
              </div>
              <div className="text-[11px] text-slate-500 space-y-1">
                <p>Silakan gunakan akun bawaan untuk masuk pertama kali:</p>
                <div className="grid grid-cols-2 bg-white rounded-lg p-2 border border-slate-100 font-mono text-[10px]">
                  <div><span className="text-slate-400">User:</span> admin</div>
                  <div><span className="text-slate-400">Pass:</span> admin123</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
