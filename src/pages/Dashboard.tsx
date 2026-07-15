import React, { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Command, CreditCard, Wallet, CheckCircle, TerminalSquare, Terminal, User as UserIcon } from 'lucide-react';
import { BotKey, SessionUser, BotProfile, BarcodeHistoryResponse, CeirHistoryResponse, SaldoHistoryRow } from '../types';
import { api } from '../lib/api';
import { formatRupiah, dateLabelFromWaktu, getGreeting, groupCount } from '../lib/format';
import { Card, LoadingSpinner, EmptyState } from '../components/ui';
import { BOT_META } from '../constants';
import { cn } from '../lib/utils';

type NavTarget = 'console' | 'history' | 'saldo' | 'profile';

export function Dashboard({ bot, profile, loadingProfile, user, onNavigate }: {
  bot: BotKey;
  profile: BotProfile | null;
  loadingProfile: boolean;
  user: SessionUser | null;
  onNavigate: (tab: NavTarget) => void;
}) {
  const [cmdData, setCmdData] = useState<BarcodeHistoryResponse | CeirHistoryResponse | null>(null);
  const [saldoRows, setSaldoRows] = useState<SaldoHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api(`/api/bots/${bot}/history/command`).catch(() => null),
      api(`/api/bots/${bot}/history/saldo`).catch(() => null),
    ]).then(([cmd, saldo]) => {
      if (cancelled) return;
      setCmdData(cmd);
      setSaldoRows(saldo?.rows || []);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bot]);

  if (loading) return <div className="py-16"><LoadingSpinner label="Memuat dashboard..." /></div>;

  const commandCount = bot === 'barcode'
    ? ((cmdData as BarcodeHistoryResponse)?.logs?.length || 0)
    : (((cmdData as CeirHistoryResponse)?.status?.length || 0) + ((cmdData as CeirHistoryResponse)?.history?.length || 0));

  const saldoCount = saldoRows.length;

  const saldoChartData = [...saldoRows].reverse().map((r, i) => ({
    name: dateLabelFromWaktu(r.waktu) || String(i + 1),
    saldo: r.saldo_akhir,
  }));

  let cmdChartData: { name: string; count: number }[] = [];
  let pieData: { name: string; value: number }[] = [];
  let recentActivity: { title: string; sub: string }[] = [];

  if (bot === 'barcode') {
    const d = cmdData as BarcodeHistoryResponse | null;
    const logsAsc = [...(d?.logs || [])].reverse();
    cmdChartData = groupCount(logsAsc, (l) => l.tanggal);
    const s = d?.summary;
    if (s) {
      pieData = [
        { name: 'Barcode Custom', value: s.barcode_custom || 0 },
        { name: 'Barcode Acak', value: s.barcode_acak || 0 },
        { name: 'About', value: s.about || 0 },
        { name: 'Filter8', value: s.filter8 || 0 },
      ].filter((p) => p.value > 0);
    }
    recentActivity = (d?.logs || []).slice(0, 5).map((l) => ({
      title: l.kategori.replace(/_/g, ' '),
      sub: l.tanggal,
    }));
  } else {
    const d = cmdData as CeirHistoryResponse | null;
    const statusRows = d?.status || [];
    const historyRows = d?.history || [];
    const all = [...statusRows, ...historyRows].reverse();
    cmdChartData = groupCount(all, (l: any) => dateLabelFromWaktu(l.waktu));
    pieData = [
      { name: 'Cek Status', value: statusRows.length },
      { name: 'Cek History', value: historyRows.length },
    ].filter((p) => p.value > 0);
    recentActivity = [...statusRows, ...historyRows]
      .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5)
      .map((l: any) => ({ title: l.nama || 'Tanpa nama', sub: `${l.jumlah_imei || 0} IMEI · ${dateLabelFromWaktu(l.waktu)}` }));
  }

  const recentSaldo = saldoRows.slice(0, 5);
  const pieColors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899'];

  const quickActions: { tab: NavTarget; label: string; icon: any }[] = [
    { tab: 'console', label: 'Console Command', icon: TerminalSquare },
    { tab: 'history', label: 'Riwayat Perintah', icon: Terminal },
    { tab: 'saldo', label: 'Riwayat Saldo', icon: CreditCard },
    { tab: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase mb-1">{getGreeting()}</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name || user?.username || 'Halo'} 👋</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          {quickActions.map((qa) => (
            <button
              key={qa.tab}
              onClick={() => onNavigate(qa.tab)}
              className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl px-3.5 py-2.5 text-[12px] font-bold text-slate-600 dark:text-slate-300 transition-all active:scale-[0.97] shadow-sm"
            >
              <qa.icon className="w-3.5 h-3.5" />
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0B1120] border border-slate-800 rounded-[1.25rem] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-4 right-4 text-slate-500 bg-slate-800/50 p-2 rounded-lg">
            <Wallet className="w-5 h-5 text-slate-300" />
          </div>
          <div className="text-[11px] font-bold tracking-[0.1em] text-slate-500 uppercase mb-2">Saldo Saat Ini</div>
          <div className="text-3xl font-bold text-white mb-2">
            {loadingProfile ? '...' : profile ? formatRupiah(profile.saldo) : 'Belum terdaftar'}
          </div>
          <div className="text-[12px] text-slate-400 mb-4">Diambil langsung dari database {BOT_META[bot].short}</div>
        </div>

        <Card className="p-6 flex flex-col justify-between relative">
          <div className="absolute top-4 right-4 text-slate-400 bg-slate-100 dark:bg-white/5 p-2 rounded-lg border border-slate-200 dark:border-white/10">
            <Command className="w-5 h-5" />
          </div>
          <div className="text-[11px] font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase mb-2">Riwayat Perintah</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{commandCount}</div>
          <div className="text-[12px] text-slate-500 dark:text-slate-400">Hanya data akun ini</div>
        </Card>

        <Card className="p-6 flex flex-col justify-between relative">
          <div className="absolute top-4 right-4 text-slate-400 bg-slate-100 dark:bg-white/5 p-2 rounded-lg border border-slate-200 dark:border-white/10">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="text-[11px] font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase mb-2">Riwayat Saldo</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{saldoCount}</div>
          <div className="text-[12px] text-slate-500 dark:text-slate-400">Transaksi tercatat</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-[11px] font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase mb-1">Aktivitas perintah</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Jumlah command per hari</h3>
            </div>
            <div className="bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full text-[12px] font-medium text-slate-600 dark:text-slate-300">{commandCount} total</div>
          </div>
          <div className="h-[250px] w-full bg-slate-50/50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/5 p-4">
            {cmdChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[13px] text-slate-400">Belum ada data untuk ditampilkan</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cmdChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dx={-10} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <div className="text-[11px] font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase mb-1">Distribusi</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Jenis perintah</h3>
          </div>
          <div className="h-[250px] w-full">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[13px] text-slate-400">Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {pieData.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {pieData.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                    <span className="text-slate-600 dark:text-slate-300">{p.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{p.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-[11px] font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase mb-1">Tren saldo</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Saldo akhir dari riwayat</h3>
          </div>
          <div className="bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full text-[12px] font-medium text-slate-600 dark:text-slate-300">{saldoCount} baris</div>
        </div>
        <div className="h-[220px] w-full bg-slate-50/50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/5 p-4">
          {saldoChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[13px] text-slate-400">Belum ada riwayat saldo</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={saldoChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v: any) => formatRupiah(Number(v))} />
                <Line type="monotone" dataKey="saldo" stroke="#3B82F6" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aktivitas terbaru</h3>
            <button onClick={() => onNavigate('history')} className="text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 hover:text-blue-700">Lihat semua</button>
          </div>
          {recentActivity.length === 0 ? (
            <EmptyState text="Belum ada aktivitas." />
          ) : (
            <div className="space-y-2">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3">
                  <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 capitalize truncate pr-2">{a.title}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">{a.sub}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transaksi saldo terbaru</h3>
            <button onClick={() => onNavigate('saldo')} className="text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 hover:text-blue-700">Lihat semua</button>
          </div>
          {recentSaldo.length === 0 ? (
            <EmptyState text="Belum ada transaksi saldo." />
          ) : (
            <div className="space-y-2">
              {recentSaldo.map((r, i) => {
                const isPlus = /\+/.test(r.tipe_transaksi) || Number(r.nominal) > 0;
                return (
                  <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3">
                    <span className={cn('text-[13px] font-bold truncate pr-2', isPlus ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>{r.tipe_transaksi}</span>
                    <span className={cn('text-[12px] font-bold shrink-0', isPlus ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
                      {isPlus ? '+' : ''}{formatRupiah(Math.abs(Number(r.nominal)))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="bg-[#0B1120] border border-slate-800 rounded-[1.25rem] p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-6 right-6 text-slate-500 bg-slate-800/50 p-2 rounded-lg">
          <Activity className="w-5 h-5 text-slate-300" />
        </div>
        <div className="text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase mb-1">Ringkasan akun · {BOT_META[bot].label}</div>
        <h3 className="text-2xl font-bold text-white mb-6">{profile ? (profile.vip ? 'VIP' : 'Reguler') : 'Belum terdaftar'}</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-[13px] text-slate-300">Saldo mengikuti database/API akun login</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-[13px] text-slate-300">Riwayat difilter, hanya menampilkan data akun ini</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-[13px] text-slate-300">Password ganti bisa dilakukan di menu Profile</span>
          </div>
        </div>
      </div>
    </div>
  );
}
