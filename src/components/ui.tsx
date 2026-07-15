import React from 'react';
import { RefreshCw, Inbox } from 'lucide-react';
import { cn } from '../lib/utils';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'bg-white border border-slate-200/60 rounded-[1.25rem] overflow-hidden shadow-sm transition-shadow hover:shadow-md',
      'dark:bg-[#131B2A] dark:border-white/10 dark:shadow-none',
      className
    )}>
      {children}
    </div>
  );
}

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-4">
      <RefreshCw className="animate-spin text-blue-500 w-6 h-6" />
      {label && <span className="text-[12px] text-slate-400 font-medium">{label}</span>}
    </div>
  );
}

export function EmptyState({ text, icon: Icon = Inbox }: { text: string; icon?: any }) {
  return (
    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center flex flex-col items-center gap-3 dark:bg-white/[0.02] dark:border-white/10">
      <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center dark:bg-white/5 dark:border-white/10">
        <Icon className="w-4.5 h-4.5 text-slate-400" />
      </div>
      <span className="text-[13px] text-slate-500 dark:text-slate-400">{text}</span>
    </div>
  );
}

type StatusKind = 'online' | 'offline' | 'maintenance';

export function StatusDot({ status, label }: { status: StatusKind; label?: string }) {
  const cfg: Record<StatusKind, { dot: string; text: string; ring: string }> = {
    online: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', ring: 'bg-emerald-100 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' },
    offline: { dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400', ring: 'bg-red-100 border-red-200 dark:bg-red-500/10 dark:border-red-500/20' },
    maintenance: { dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400', ring: 'bg-slate-100 border-slate-200 dark:bg-white/5 dark:border-white/10' },
  };
  const c = cfg[status];
  return (
    <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-bold', c.ring, c.text)}>
      <span className={cn('w-2 h-2 rounded-full', c.dot, status === 'online' && 'animate-pulse')} />
      {label}
    </div>
  );
}
