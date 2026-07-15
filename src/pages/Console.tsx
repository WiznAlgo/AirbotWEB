import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Send, RefreshCw, TerminalSquare, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { BotKey, LogEntryType, BotHealth } from '../types';
import { api } from '../lib/api';
import { extractOutputs, downloadMediaBundle, MAX_INLINE_MEDIA } from '../lib/media';
import { Card } from '../components/ui';
import { JsonViewer } from '../components/JsonViewer';
import { MediaViewer } from '../components/MediaViewer';
import { BOT_META } from '../constants';
import { cn } from '../lib/utils';

type RunState = 'idle' | 'running' | 'done';

export function Console({ bot }: { bot: BotKey }) {
  const [input, setInput] = useState('');
  const [deliver, setDeliver] = useState(false);
  const [logs, setLogs] = useState<LogEntryType[]>([]);
  const [runState, setRunState] = useState<RunState>('idle');
  const [rawOpenId, setRawOpenId] = useState<string | null>(null);
  const [zippingId, setZippingId] = useState<string | null>(null);
  const [health, setHealth] = useState<BotHealth | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    setLogs([]);
    setHealth(null);
    api(`/api/bots/${bot}/health`).then(setHealth).catch(() => setHealth(null));
  }, [bot]);

  useEffect(() => () => { if (doneTimerRef.current) clearTimeout(doneTimerRef.current); }, []);

  const whatsappOff = health?.ok && health.whatsappEnabled === false;

  const getLogOutputs = (log: LogEntryType) => {
    if (typeof log.outputText !== 'object' || log.outputText === null) {
      return { uniqueTexts: [] as string[], uniqueMedia: [] as any[] };
    }
    const { text, media } = extractOutputs(log.outputText);
    let uniqueTexts = Array.from(new Set(text.map((t) => (typeof t === 'string' ? t.trim() : String(t))).filter(Boolean)));
    uniqueTexts = uniqueTexts.filter((t, i, a) => !a.some((other, j) => i !== j && other.includes(t)));
    const uniqueMedia = media.filter((v, i, a) =>
      a.findIndex((t) =>
        (t.url && v.url && t.url === v.url) ||
        (t.base64 && v.base64 && t.base64 === v.base64) ||
        (t.dataUrl && v.dataUrl && t.dataUrl === v.dataUrl)
      ) === i
    );
    if (uniqueTexts.length === 0 && uniqueMedia.length === 0) {
      const errMsg = (log.outputText as any)?.error;
      if (typeof errMsg === 'string' && errMsg.trim()) {
        uniqueTexts = [`⚠️ Bot mengembalikan error: ${errMsg.trim()}`];
      }
    }
    return { uniqueTexts, uniqueMedia };
  };

  const handleDownloadAll = async (log: LogEntryType, media: any[]) => {
    if (zippingId || media.length === 0) return;
    setZippingId(log.id);
    try {
      const safeCmd = log.cmdText.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'output';
      await downloadMediaBundle(media, `${safeCmd}-${log.id}`);
    } finally {
      setZippingId(null);
    }
  };

  const handleRun = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || runState !== 'idle') return;

    let cmd = input.trim();
    if (!/^[./!#]/.test(cmd)) cmd = '.' + cmd;

    setRunState('running');
    try {
      const res = await api(`/api/bots/${bot}/console`, { method: 'POST', body: { text: cmd, deliver } });
      const newLog: LogEntryType = {
        id: Date.now().toString(),
        cmdText: cmd + (deliver ? ' (Delivered)' : ''),
        isError: !res?.ok,
        outputText: res?.response ?? res,
        time: new Date().toLocaleTimeString(),
        rawObject: res,
      };
      setLogs((prev) => [...prev, newLog]);
    } catch (err: any) {
      const newLog: LogEntryType = {
        id: Date.now().toString(),
        cmdText: cmd,
        isError: true,
        outputText: err.message,
        time: new Date().toLocaleTimeString(),
      };
      setLogs((prev) => [...prev, newLog]);
    }
    setInput('');
    setRunState('done');
    doneTimerRef.current = setTimeout(() => setRunState('idle'), 1100);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[800px] gap-6 animate-[fadeIn_0.3s_ease-out]">
      {whatsappOff && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-2xl px-5 py-4 text-[13px] flex items-start gap-3 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Mode API-only aktif di {BOT_META[bot].label}.</span> WhatsApp belum tersambung
            di bot ini, jadi eksekusi command lewat console belum bisa dipakai. Data saldo, riwayat, dan profile tetap
            berjalan normal seperti biasa.
          </div>
        </div>
      )}
      <Card className="flex-1 flex flex-col min-h-0">
        <div className="p-5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center shrink-0">
          <div>
            <div className="text-[11px] font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase mb-1">Live Feed · {BOT_META[bot].label}</div>
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">Interactive Console</h3>
          </div>
          <button onClick={() => setLogs([])} className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full">Clear Output</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 dark:bg-transparent">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <TerminalSquare className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-sm font-medium">Ketik command di bawah untuk mencoba, mis. ".menu"</p>
            </div>
          ) : (
            logs.map((log) => {
              const { uniqueTexts, uniqueMedia } = getLogOutputs(log);
              return (
              <div key={log.id} className={cn('p-5 rounded-2xl border bg-white dark:bg-white/[0.03] shadow-sm animate-[slideUp_0.25s_ease-out]', log.isError ? 'border-red-200 dark:border-red-500/20' : 'border-slate-200 dark:border-white/10')}>
                <div className="flex justify-between items-center text-xs mb-4 pb-4 border-b border-slate-100 dark:border-white/5">
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{log.cmdText}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{log.time}</span>
                </div>
                <div className="text-sm overflow-x-auto space-y-4">
                  {typeof log.outputText === 'object' ? (
                    <>
                      {uniqueTexts.length === 0 && uniqueMedia.length === 0 && (
                        <div className="text-[13px] text-slate-400 italic">Tidak ada output teks/media dari command ini.</div>
                      )}
                      {uniqueTexts.length > 0 && (
                        <div className="space-y-2 mb-4 bg-slate-50 dark:bg-white/[0.03] p-4 rounded-xl border border-slate-100 dark:border-white/5">
                          {uniqueTexts.map((t, idx) => (
                            <div key={idx} className={cn('whitespace-pre-wrap text-[13px] leading-relaxed font-mono', log.isError ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300')}>{t}</div>
                          ))}
                        </div>
                      )}
                      {uniqueMedia.length > 0 && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{uniqueMedia.length} file media</span>
                            <button
                              onClick={() => handleDownloadAll(log, uniqueMedia)}
                              disabled={zippingId === log.id}
                              className="text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {zippingId === log.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 rotate-180" />}
                              {zippingId === log.id ? 'Menyiapkan...' : uniqueMedia.length > 1 ? `Download semua (.zip)` : 'Download'}
                            </button>
                          </div>
                          {uniqueMedia.length > MAX_INLINE_MEDIA ? (
                            <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] mb-3">
                              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                                <ImageIcon className="w-4 h-4 text-blue-500" />
                              </div>
                              <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                Ada <span className="font-bold text-slate-700 dark:text-slate-200">{uniqueMedia.length} gambar</span> dari command ini — kebanyakan buat ditampilkan langsung di sini. Download dulu file-nya (otomatis jadi .zip), baru dibuka dari situ ya.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3 mb-3">
                              {uniqueMedia.map((m, idx) => (
                                <div key={idx} className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-2 rounded-xl flex flex-col relative overflow-hidden group">
                                  <MediaViewer item={m} index={idx} />
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div className={cn('whitespace-pre-wrap text-[13px] leading-relaxed p-4 rounded-xl font-mono', log.isError ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20' : 'bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-white/5')}>
                      {log.outputText}
                    </div>
                  )}
                  {log.rawObject && (
                    <div>
                      <button
                        onClick={() => setRawOpenId(rawOpenId === log.id ? null : log.id)}
                        className="text-[11px] font-bold uppercase tracking-wide text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {rawOpenId === log.id ? 'Sembunyikan raw response' : 'Lihat raw response'}
                      </button>
                      {rawOpenId === log.id && (
                        <div className="mt-2 bg-[#0B1120] rounded-xl p-4 overflow-x-auto">
                          <JsonViewer data={log.rawObject} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>
      </Card>

      <Card className="shrink-0 p-4">
        <form onSubmit={handleRun}>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1 w-full relative">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Input Command</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={whatsappOff ? 'Console belum tersedia (mode API-only)' : 'Ketik command (mis. .menu)...\nTekan Enter untuk baris baru'}
                disabled={whatsappOff}
                className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3 text-[13px] font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all resize-none min-h-[60px] max-h-[200px] disabled:opacity-60 disabled:cursor-not-allowed"
                rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 5) : 2}
              />
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              {!whatsappOff && (
                <label className="flex items-center gap-2 text-[12px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={deliver}
                    onChange={(e) => setDeliver(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/50"
                  />
                  Kirim ke WA saya
                </label>
              )}
              <button
                type="submit"
                disabled={runState !== 'idle' || !input.trim() || whatsappOff}
                className={cn(
                  'flex-1 md:flex-none w-[150px] disabled:opacity-50 text-white rounded-xl px-6 py-3 font-bold flex items-center justify-center gap-2 transition-all shadow-lg',
                  runState === 'done' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                )}
              >
                {runState === 'running' && <RefreshCw className="w-4 h-4 animate-spin" />}
                {runState === 'done' && <CheckCircle2 className="w-4 h-4" />}
                {runState === 'idle' && <Send className="w-4 h-4" />}
                {runState === 'running' ? 'Running...' : runState === 'done' ? 'Done' : 'Execute'}
              </button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
