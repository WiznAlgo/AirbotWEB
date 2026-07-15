import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BotKey, SaldoHistoryRow } from '../types';
import { api } from '../lib/api';
import { formatRupiah, dateLabelFromWaktu } from '../lib/format';
import { Card, LoadingSpinner, EmptyState } from '../components/ui';
import { cn } from '../lib/utils';

export function Saldo({ bot }: { bot: BotKey }) {
  const [rows, setRows] = useState<SaldoHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api(`/api/bots/${bot}/history/saldo`)
      .then((res) => setRows(res?.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [bot]);

  if (loading) return <div className="py-16"><LoadingSpinner label="Memuat riwayat saldo..." /></div>;

  const chartData = [...rows].reverse().map((r, i) => ({ name: dateLabelFromWaktu(r.waktu) || String(i + 1), saldo: r.saldo_akhir }));
  const latestSaldo = rows[0]?.saldo_akhir;

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-[11px] font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase mb-1">Tren saldo</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Saldo akhir dari riwayat</h3>
          </div>
          <div className="bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full text-[12px] font-medium text-slate-600 dark:text-slate-300">
            {latestSaldo !== undefined ? formatRupiah(latestSaldo) : '-'}
          </div>
        </div>
        <div className="h-[250px] w-full bg-slate-50/50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/5 p-4">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[13px] text-slate-400">Belum ada riwayat saldo</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dx={-10} />
                <Tooltip formatter={(v: any) => formatRupiah(Number(v))} />
                <Line type="monotone" dataKey="saldo" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-[11px] font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase mb-1">Detail transaksi</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat isi saldo akun ini</h3>
          </div>
          <div className="bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full text-[12px] font-medium text-slate-600 dark:text-slate-300">{rows.length} baris</div>
        </div>

        {rows.length === 0 ? (
          <EmptyState text="Belum ada riwayat saldo yang bisa ditampilkan." />
        ) : (
          <div className="max-h-[420px] overflow-y-auto space-y-2">
            {rows.map((r, i) => {
              const isPlus = /\+/.test(r.tipe_transaksi) || Number(r.nominal) > 0;
              return (
                <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3">
                  <div>
                    <div className={cn('text-[13px] font-bold', isPlus ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>{r.tipe_transaksi}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{r.waktu}</div>
                  </div>
                  <div className="text-right">
                    <div className={cn('text-[13px] font-bold', isPlus ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
                      {isPlus ? '+' : ''}{formatRupiah(Math.abs(Number(r.nominal)))}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Saldo akhir: {formatRupiah(r.saldo_akhir)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-4 mt-4 text-[12px] text-slate-500 dark:text-slate-400">
          Catatan: nama/nomor yang melakukan pengisian saldo tidak ditampilkan di sini.
        </div>
      </Card>
    </div>
  );
}
