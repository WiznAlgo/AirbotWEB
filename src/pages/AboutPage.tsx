import React from 'react';
import { Github, Mail, MessageCircle, CheckCircle2, Code2, Layers, Palette, Server } from 'lucide-react';
import { BRAND, DEVELOPER, FEATURES, BOT_CONTACT, BOT_META } from '../constants';
import { Card } from '../components/ui';
import { BotKey } from '../types';

const ROLES = [
  { icon: Layers, label: 'Frontend' },
  { icon: Server, label: 'Backend Integration' },
  { icon: Code2, label: 'REST API Integration' },
  { icon: Server, label: 'System Architecture' },
  { icon: Palette, label: 'UI/UX Design' },
];

export function AboutPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="p-8 text-center">
        <div className="text-[11px] font-bold tracking-[0.15em] text-blue-600 dark:text-blue-400 uppercase mb-2">Tentang</div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{BRAND.name}</h1>
        <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
          Website ini menyediakan dashboard modern untuk mengakses layanan Bot Barcode dan Bot CEIR lewat REST API,
          lengkap dengan riwayat pemakaian, riwayat saldo, dan console command interaktif — semuanya dari satu login.
        </p>
        <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          Versi {BRAND.version}
        </div>
      </Card>

      <Card className="p-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Fitur</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-[13px] text-slate-700 dark:text-slate-300">{f}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Bot yang Tersedia</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.keys(BOT_META) as BotKey[]).map((key) => {
            const m = BOT_META[key];
            const Icon = m.icon;
            return (
              <div key={key} className="border border-slate-100 dark:border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{m.label}</span>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-1">{m.description}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{BOT_CONTACT[key].waNumber}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-8 text-center">
        <div className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-2">Developer</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Developed &amp; Maintained by</h2>
        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 mb-6">
          {DEVELOPER.name}
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {ROLES.map((r) => (
            <div key={r.label} className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[12px] font-bold px-3 py-1.5 rounded-full">
              <r.icon className="w-3.5 h-3.5" />
              {r.label}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={DEVELOPER.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-[13px] font-bold px-5 py-2.5 rounded-xl transition-all active:scale-[0.98]"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
          {DEVELOPER.portfolio && (
            <a
              href={DEVELOPER.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-[13px] font-bold px-5 py-2.5 rounded-xl transition-all active:scale-[0.98]"
            >
              Portfolio
            </a>
          )}
          <a
            href={`https://wa.me/${DEVELOPER.whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[13px] font-bold px-5 py-2.5 rounded-xl transition-all active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
          <a
            href={`mailto:${DEVELOPER.email}`}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-[13px] font-bold px-5 py-2.5 rounded-xl transition-all active:scale-[0.98]"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
        </div>
      </Card>
    </div>
  );
}
