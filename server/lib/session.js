// Sesi login disimpan LANGSUNG di dalam cookie (signed, anti-tamper oleh
// cookie-parser), bukan di memori server. Ini sengaja dibuat "stateless"
// supaya jalan di lingkungan mana pun: 1 proses VPS biasa, ATAU serverless
// kayak Vercel/Netlify Functions dimana tiap request bisa ditangani
// instance/container yang berbeda-beda (jadi Map di memori gampang "hilang").
//
// Cookie ini tidak dienkripsi, hanya ditandatangani (signed) - artinya isinya
// masih bisa dibaca kalau di-decode manual, tapi tidak bisa diubah/dipalsukan
// tanpa tahu SESSION_SECRET. Karena itu, JANGAN pernah taruh password atau
// data sensitif lain di payload sesi ini - cukup jid, nama, username, dan
// info akses (access flags) yang memang tidak rahasia.

import { SESSION_HOURS } from "../config.js";

export function encodeSession(payload) {
  const now = Date.now();
  const withExpiry = { ...payload, iat: now, exp: now + SESSION_HOURS * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(withExpiry), "utf-8").toString("base64url");
}

export function decodeSession(raw) {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, "base64url").toString("utf-8");
    const data = JSON.parse(json);
    if (!data?.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function sessionMaxAgeMs() {
  return SESSION_HOURS * 60 * 60 * 1000;
}
