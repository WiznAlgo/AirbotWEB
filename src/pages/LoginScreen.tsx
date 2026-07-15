import React, { useState, FormEvent } from 'react';
import { Activity, AlertCircle, RefreshCw, ChevronRight, Shield, TerminalSquare, CreditCard } from 'lucide-react';
import { BotKey, SessionUser, BotAccess } from '../types';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { BOT_META, BRAND } from '../constants';
import { Footer } from '../components/Footer';

export function LoginScreen({ onLogin }: { onLogin: (user: SessionUser, access: BotAccess, bot: BotKey) => void }) {
  const [loginBot, setLoginBot] = useState<BotKey>('barcode');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setError('');
    setLoading(true);
    try {
      const res = await api('/api/auth/login', { method: 'POST', body: { bot: loginBot, username, password } });
      if (res?.ok && res?.user) {
        onLogin(res.user, res.access, loginBot);
      } else {
        throw new Error(res?.error || 'Login gagal');
      }
    } catch (err: any) {
      setError(err.message || 'Login gagal');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center p-4 selection:bg-blue-500/30 font-sans">
      <div className="w-full max-w-5xl bg-[#131B2A] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-[fadeIn_0.4s_ease-out]">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="md:w-5/12 bg-white/[0.02] border-b md:border-b-0 md:border-r border-white/5 p-8 md:p-14 flex flex-col justify-between relative overflow-hidden backdrop-blur-xl">
          <div className="relative z-10">
            <div className="text-blue-500 font-medium text-xs tracking-[0.2em] uppercase mb-12 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                <Activity className="w-4 h-4 text-white" />
              </div>
              {BRAND.name}
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-5 leading-tight">
              Satu login,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">dua bot sekaligus.</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[300px] mb-10">
              Masuk dengan akun WhatsApp kamu untuk mengakses Bot Barcode dan Bot CEIR dari satu dashboard.
            </p>

            <div className="space-y-4">
              {[
                { icon: Shield, text: 'Data tiap akun terpisah & privat' },
                { icon: TerminalSquare, text: 'Console command real-time ke bot' },
                { icon: CreditCard, text: 'Riwayat perintah & saldo tercatat rapi' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-[13px] text-slate-300">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 text-[11px] font-mono text-slate-500 relative z-10 flex items-center gap-2">
            <ChevronRight className="w-3.5 h-3.5" /> Bot A · Barcode &amp; Bot B · CEIR
          </div>
        </div>

        <div className="md:w-7/12 p-8 md:p-14 flex flex-col justify-center bg-[#0B0F17]/50 backdrop-blur-xl relative z-10">
          <form onSubmit={handleSubmit} className="w-full max-w-[360px] mx-auto space-y-5">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-2 tracking-wide uppercase">Login sebagai</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(BOT_META) as BotKey[]).map((key) => {
                  const m = BOT_META[key];
                  const Icon = m.icon;
                  const isActive = loginBot === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setLoginBot(key)}
                      className={cn(
                        'flex flex-col items-start gap-2 rounded-xl border px-4 py-3.5 text-left transition-all active:scale-[0.98]',
                        isActive
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
                          : 'bg-[#131B2A] border-white/10 text-slate-400 hover:border-white/20'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-[13px] font-bold">{m.short}</span>
                      </div>
                      <span className={cn('text-[11px] leading-snug', isActive ? 'text-blue-100' : 'text-slate-500')}>
                        {m.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-2 tracking-wide uppercase">Username / ID dari Bot WhatsApp</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: 6281234567890"
                className="w-full bg-[#131B2A] border border-white/10 text-white rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-2 tracking-wide uppercase">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password akun kamu"
                className="w-full bg-[#131B2A] border border-white/10 text-white rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600 text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3.5 rounded-xl text-[13px] flex items-start gap-3 animate-[fadeIn_0.2s_ease-out]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-[15px] font-medium py-3.5 rounded-xl transition-all disabled:opacity-50 mt-6 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
            </button>
          </form>
        </div>
      </div>
      <div className="mt-6">
        <Footer dark />
      </div>
    </div>
  );
}
