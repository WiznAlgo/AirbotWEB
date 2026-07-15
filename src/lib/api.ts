// API client - semua panggilan lewat backend kita sendiri (server/app.js)
// lewat path relatif "/api/...". Cookie sesi (httpOnly) otomatis ikut
// terkirim oleh browser (credentials: 'same-origin'), tidak ada token yang
// pernah disimpan/terlihat di kode frontend ini.

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api(path: string, opts: { method?: string; body?: any } = {}) {
  const res = await fetch(path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let data: any = null;
  try { data = await res.json(); } catch { /* bukan JSON */ }
  if (!res.ok) {
    throw new ApiError(data?.error || `HTTP ${res.status}`, res.status);
  }
  return data;
}
