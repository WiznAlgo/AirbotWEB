import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { BotKey, BarcodeHistoryResponse, CeirHistoryResponse } from '../types';
import { api } from '../lib/api';
import { formatRupiah } from '../lib/format';
import { Card, LoadingSpinner, EmptyState } from '../components/ui';

export function History({ bot }: { bot: BotKey }) {
  const [data, setData] = useState<BarcodeHistoryResponse | CeirHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    setQuery('');
    api(`/api/bots/${bot}/history/command`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [bot]);

  if (loading) return <div className="py-16"><LoadingSpinner label="Memuat riwayat perintah..." /></div>;

  if (bot === 'barcode') {
    const d = data as BarcodeHistoryResponse | null;
    const summary = d?.summary;
    const q = query.trim().toLowerCase();
    const logs = (d?.logs || []).filter((l) => !q || l.kategori.toLowerCase().includes(q) || l.tanggal.includes(q));

    return (
      <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Barcode Custom', value: summary?.barcode_custom || 0 },
            { label: 'Barcode Acak', value: summary?.barcode_acak || 0 },
            { label: 'About', value: summary?.about || 0 },
            { label: 'Filter8', value: summary?.filter8 || 0 },
          ].map((s) => (
            <Card key={s.label} className="p-5">
              <div className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-2">{s.label}</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-[11px] font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase mb-1">Detail log</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat perintah akun ini</h3>
            </div>
            <div className="bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-[12px] font-medium">{logs.length} baris</div>
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kategori atau tanggal (mis. 2026-04-17)..."
              className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl pl-11 pr-4 py-3 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-400"
            />
          </div>

          {logs.length === 0 ? (
            <EmptyState text="Belum ada riwayat perintah yang bisa ditampilkan." />
          ) : (
            <div className="max-h-[420px] overflow-y-auto space-y-2">
              {logs.map((l, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3">
                  <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 capitalize">{l.kategori.replace(/_/g, ' ')}</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 font-mono">{l.tanggal}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  const d = data as CeirHistoryResponse | null;
  const q = query.trim().toLowerCase();
  const filterRows = (rows: any[]) => (rows || []).filter((r) => !q || (r.nama || '').toLowerCase().includes(q) || (r.waktu || '').toLowerCase().includes(q));
  const statusRows = filterRows(d?.status || []);
  const historyRows = filterRows(d?.history || []);

  const RowList = ({ rows, emptyText }: { rows: any[]; emptyText: string }) =>
    rows.length === 0 ? (
      <EmptyState text={emptyText} />
    ) : (
      <div className="max-h-[360px] overflow-y-auto space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{r.nama || 'Tanpa nama'}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{r.waktu}</span>
            </div>
            <div className="flex gap-4 text-[12px] text-slate-500 dark:text-slate-400">
              <span>{r.jumlah_imei || 0} IMEI</span>
              {typeof r.total_biaya === 'number' && <span>{formatRupiah(r.total_biaya)}</span>}
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <Card className="p-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama atau tanggal..."
            className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl pl-11 pr-4 py-3 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-400"
          />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat cek status IMEI</h3>
          <div className="bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-[12px] font-medium">{statusRows.length} baris</div>
        </div>
        <RowList rows={statusRows} emptyText="Belum ada riwayat cek status." />
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat cek history IMEI</h3>
          <div className="bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full text-[12px] font-medium">{historyRows.length} baris</div>
        </div>
        <RowList rows={historyRows} emptyText="Belum ada riwayat cek history." />
      </Card>
    </div>
  );
}
