import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (token: string, username: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Identifiant ou mot de passe incorrect');
      }

      if (rememberMe) {
        localStorage.setItem('mk_auth_token', data.token);
        localStorage.setItem('mk_auth_user', data.user.username);
      } else {
        sessionStorage.setItem('mk_auth_token', data.token);
        sessionStorage.setItem('mk_auth_user', data.user.username);
      }

      onLoginSuccess(data.token, data.user.username);
    } catch (err: any) {
      setError(err.message || 'Échec de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            {!logoFailed ? (
              <img
                src="/logo.png"
                alt="MK Monitor"
                onError={() => setLogoFailed(true)}
                className="w-16 h-16 rounded-2xl object-contain bg-neutral-900 border border-neutral-800 p-2 shadow-xl"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-2xl shadow-xl">
                MK
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            MK Monitor
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Surveillance & Audit Technique · Matt Konnect
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-800">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-neutral-200">
              Authentification Administrateur
            </h2>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Username field */}
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                Identifiant
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 font-mono focus:outline-none focus:border-emerald-500/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-start pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-neutral-950 border-neutral-800 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                />
                <span>Se souvenir de moi</span>
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg font-semibold transition-all disabled:opacity-60 active:scale-98 shadow-sm"
            >
              <span>{loading ? 'Connexion en cours...' : 'Accéder au tableau de bord'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Discreet Help Note */}
          <div className="mt-6 pt-4 border-t border-neutral-800/80 text-[11px] text-neutral-400 flex items-center justify-between">
            <span>Accès sécurisé pour l'équipe Matt Konnect</span>
            <div className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chiffrement Scrypt</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
