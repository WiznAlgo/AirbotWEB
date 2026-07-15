import React from 'react';
import { Activity, RefreshCw, WifiOff } from 'lucide-react';
import { BRAND } from '../constants';
import { BOT_META } from '../constants';
import { StatusDot } from '../components/ui';
import { Footer } from '../components/Footer';
import { BotKey } from '../types';

interface Props {
  botStatus: Record<BotKey, boolean>;
  onRetry: () => void;
  retrying?: boolean;
}

export function MaintenancePage({ botStatus, onRetry, retrying }: Props) {
  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center animate-[fadeIn_0.4s_ease-out]">
        <div className="flex items-center justify-center gap-3 text-blue-500 font-medium text-xs tracking-[0.2em] uppercase mb-10">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <Activity className="w-4 h-4 text-white" />
          </div>
          {BRAND.name}
        </div>

        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-7 h-7 text-slate-400" />
        </div>

        <h1 className="text-white text-xl font-bold mb-3">Layanan sedang tidak tersedia</h1>
        <p className="text-slate-400 text-[13px] leading-relaxed mb-8">
          WhatsApp Bot sedang dalam perbaikan / tidak dapat dihubungi saat ini. Silakan coba lagi beberapa saat lagi.
        </p>

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 mb-8 text-left space-y-3">
          <div className="text-[10px] font-bold tracking-[0.15em] text-slate-500 uppercase mb-3">Status Saat Ini</div>
          {(Object.keys(BOT_META) as BotKey[]).map((key) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-[13px] text-slate-300">{BOT_META[key].label}</span>
              <StatusDot status={botStatus[key] ? 'online' : 'maintenance'} label={botStatus[key] ? 'Online' : 'Maintenance'} />
            </div>
          ))}
        </div>

        <button
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[13px] font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          <RefreshCw className={retrying ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
          {retrying ? 'Mengecek ulang...' : 'Coba Lagi'}
        </button>
      </div>
      <div className="mt-10">
        <Footer dark />
      </div>
    </div>
  );
}
