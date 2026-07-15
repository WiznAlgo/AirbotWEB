import React, { useEffect, useState, FormEvent } from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';
import { BotKey, ProfileSummaryResponse } from '../types';
import { api } from '../lib/api';
import { formatRupiah } from '../lib/format';
import { Card, LoadingSpinner } from '../components/ui';
import { BOT_META } from '../constants';
import { cn } from '../lib/utils';

export function Profile({ toast }: { toast: (m: string) => void }) {
  const [summary, setSummary] = useState<ProfileSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [updating, setUpdating] = useState(false);
  const [passResult, setPassResult] = useState<Record<string, { ok: boolean; error?: string }> | null>(null);

  const load = () => {
    setLoading(true);
    api('/api/profile/summary')
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updatePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!pass || pass.length < 4) { toast('Password baru minimal 4 karakter'); return; }
    if (pass !== confirmPass) { toast('Konfirmasi password tidak cocok'); return; }
    setUpdating(true);
    setPassResult(null);
    try {
      const res = await api('/api/profile/password', { method: 'POST', body: { newPassword: pass } });
      setPassResult(res.perBot || null);
      if (res.ok) {
        toast('Password berhasil diperbarui');
        setPass('');
        setConfirmPass('');
        load();
      } else {
        toast('Gagal memperbarui password');
      }
    } catch (err: any) {
      toast('Error: ' + err.message);
    }
    setUpdating(false);
  };

  if (loading) return <div className="py-16"><LoadingSpinner label="Memuat profile..." /></div>;

  return (
    <div className="space-y-6 max-w-4xl animate-[fadeIn_0.3s_ease-out]">
      <Card className="p-6">
        <div className="mb-6">
          <div className="text-[11px] font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase mb-1">Identitas</div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{summary?.name || summary?.username || 'User'}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 border border-slate-100 dark:border-white/5">
            <div className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-1">USERNAME</div>
            <div className="font-bold text-slate-900 dark:text-white">{summary?.username || '-'}</div>
          </div>
          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 border border-slate-100 dark:border-white/5">
            <div className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-1">JID</div>
            <div className="font-bold text-slate-900 dark:text-white">{summary?.jid?.split('@')[0] || '-'}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(BOT_META) as BotKey[]).map((key) => {
          const meta = BOT_META[key];
          const Icon = meta.icon;
          const entry = summary?.bots?.[key];
          const u = entry?.user;
          return (
            <Card key={key} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="text-[11px] font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">{meta.label}</div>
              </div>
              {u ? (
                <>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{formatRupiah(u.saldo)}</div>
                  <div className="text-[12px] text-slate-500 dark:text-slate-400">{u.vip ? 'Status VIP' : 'Status reguler'}</div>
                </>
              ) : (
                <div className="text-[13px] text-slate-400">Belum terdaftar di bot ini.</div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <div className="text-[11px] font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase mb-1">Ganti password</div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Password akun ini</h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">Password baru akan berlaku untuk Bot A &amp; Bot B sekaligus.</p>
        </div>

        <form onSubmit={updatePassword} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2">Password baru</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Minimal 4 karakter"
              className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3.5 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-400"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2">Konfirmasi password baru</label>
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3.5 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={updating || !pass}
            className="w-full bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-50 text-white rounded-xl px-6 py-3.5 text-[13px] font-bold flex justify-center items-center gap-2 transition-all active:scale-[0.99]"
          >
            <Shield className="w-4 h-4" />
            {updating ? 'Menyimpan...' : 'Simpan password'}
          </button>

          {passResult && (
            <div className="flex gap-3">
              {(Object.keys(BOT_META) as BotKey[]).map((key) => {
                const r = passResult[key];
                if (!r) return null;
                return (
                  <div key={key} className={cn('flex-1 rounded-xl px-4 py-3 text-[12px] font-bold flex items-center gap-2', r.ok ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20')}>
                    <CheckCircle2 className="w-4 h-4" />
                    {BOT_META[key].short}: {r.ok ? 'Berhasil' : (r.error || 'Gagal')}
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-4 mt-4 text-[12px] text-slate-500 dark:text-slate-400">
            Password hanya berlaku untuk akun yang sedang login ini. Data user lain tidak ikut terpengaruh atau ditampilkan.
          </div>
        </form>
      </Card>
    </div>
  );
}
