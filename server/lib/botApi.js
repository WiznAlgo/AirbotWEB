// Klien server-side untuk memanggil REST API dua bot (Barcode & CEIR).
// PENTING: token master di sini hanya pernah dipakai di server, tidak pernah
// dikirim ke browser. Semua penyaringan "data ini punya siapa" juga terjadi
// di sini / route, bukan di frontend, supaya user tidak bisa mengakalinya.

import { digitsOf, sameIdentity } from "./jid.js";
import { BOT_BARCODE_BASE_URL, BOT_BARCODE_API_TOKEN, BOT_CEIR_BASE_URL, BOT_CEIR_API_TOKEN } from "../config.js";

const BOTS = {
  barcode: {
    label: "Bot A - Barcode",
    baseUrl: BOT_BARCODE_BASE_URL.replace(/\/+$/, ""),
    token: BOT_BARCODE_API_TOKEN,
  },
  ceir: {
    label: "Bot B - CEIR",
    baseUrl: BOT_CEIR_BASE_URL.replace(/\/+$/, ""),
    token: BOT_CEIR_API_TOKEN,
  },
};

export function isValidBot(bot) {
  return Object.prototype.hasOwnProperty.call(BOTS, bot);
}

export function listBots() {
  return Object.keys(BOTS);
}

function botConfig(bot) {
  const cfg = BOTS[bot];
  if (!cfg) throw new Error(`Bot tidak dikenal: ${bot}`);
  if (!cfg.baseUrl) throw new Error(`BOT_${bot.toUpperCase()}_BASE_URL belum diset di .env`);
  return cfg;
}

async function callBot(bot, path, { method = "GET", body, useMasterToken = true, extraHeaders = {} } = {}) {
  const cfg = botConfig(bot);
  const url = `${cfg.baseUrl}${path}`;
  const headers = { "Content-Type": "application/json", ...extraHeaders };
  if (useMasterToken && cfg.token) {
    headers.Authorization = `Bearer ${cfg.token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Vercel (paket Hobby) membatasi durasi serverless function ke ~10 detik,
    // jadi timeout ke bot dibuat di bawah itu supaya selalu sempat balas
    // dengan pesan error yang jelas, bukan timeout mentah dari platform.
    signal: AbortSignal.timeout(8000),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { httpOk: res.ok, status: res.status, data };
}

// --- Auth: dipakai HANYA untuk verifikasi username/password saat login.
// Setelah login sukses kita tidak menyimpan token per-user ini; server
// panel pakai token master untuk semua panggilan berikutnya, dan selalu
// menyaring berdasarkan jid yang tersimpan di sesi milik server sendiri.
export async function verifyLogin(bot, username, password) {
  try {
    const { httpOk, data } = await callBot(bot, "/login", {
      method: "POST",
      body: { username, password },
      useMasterToken: false,
    });
    if (httpOk && data?.ok && data?.user?.jid) {
      return {
        ok: true,
        jid: data.user.jid,
        name: data.user.name || data.user.username || "",
        username: data.user.username || "",
      };
    }
    return { ok: false, error: data?.error || "Username atau password salah" };
  } catch (err) {
    return { ok: false, error: `Gagal menghubungi ${BOTS[bot]?.label || bot}: ${err.message}` };
  }
}

// Ambil data satu user (saldo, nama, vip) langsung dari endpoint yang
// sudah discope by jid di path-nya sendiri.
export async function getUserProfile(bot, jid) {
  try {
    const { httpOk, status, data } = await callBot(bot, `/users/${encodeURIComponent(jid)}`);
    if (httpOk && data && !data.error) return { ok: true, user: data };
    if (status === 404) return { ok: true, user: null };
    return { ok: false, error: data?.error || "Gagal mengambil profil" };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Riwayat isi saldo, difilter ke jid milik user & field "eksekutor"
// (siapa yang mengisi) DIHAPUS sebelum dikirim ke frontend.
export async function getHistorySaldo(bot, jid) {
  try {
    const { httpOk, data } = await callBot(bot, "/history/saldo");
    if (!httpOk || !Array.isArray(data)) return { ok: false, error: "Gagal mengambil riwayat saldo" };
    const mine = data
      .filter((row) => sameIdentity(row?.target_user, jid))
      .map(({ eksekutor, ...rest }) => rest)
      .reverse(); // terbaru dulu
    return { ok: true, rows: mine };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Riwayat pemakaian command. Struktur berbeda antara Barcode (object
// keyed by jid) dan CEIR (object {status:[], history:[]} array flat).
export async function getHistoryPemakaian(bot, jid) {
  try {
    const { httpOk, data } = await callBot(bot, "/history/pemakaian");
    if (!httpOk || !data) return { ok: false, error: "Gagal mengambil riwayat command" };

    if (bot === "barcode") {
      const entry = data[jid] || data[Object.keys(data).find((k) => sameIdentity(k, jid))] || null;
      const logs = Array.isArray(entry?.logs) ? [...entry.logs].reverse() : [];
      return {
        ok: true,
        summary: entry
          ? {
              barcode_custom: entry.barcode_custom || 0,
              barcode_acak: entry.barcode_acak || 0,
              about: entry.about || 0,
              filter8: entry.filter8 || 0,
            }
          : null,
        logs,
      };
    }

    // CEIR
    const filterLogs = (arr) => (Array.isArray(arr) ? arr.filter((row) => sameIdentity(row?.user, jid)).reverse() : []);
    return {
      ok: true,
      status: filterLogs(data.status),
      history: filterLogs(data.history),
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Deposit pending (khusus CEIR), difilter ke milik user sendiri.
export async function getPendingDeposits(bot, jid) {
  try {
    const { httpOk, data } = await callBot(bot, "/deposits/pending");
    if (!httpOk || !Array.isArray(data)) return { ok: true, rows: [] };
    const mine = data.filter((row) => sameIdentity(row?.user || row?.jid, jid));
    return { ok: true, rows: mine };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Kirim command ke handler bot (mode preview by default). jid SELALU
// dipaksa dari parameter yang diberikan route (session), tidak pernah
// dari input mentah frontend, supaya user tidak bisa menyamar jadi jid lain.
// Field "body" adalah teks command mentah (mis. ".menu"), sesuai kontrak
// endpoint /inbound di kedua bot.
export async function sendCommand(bot, jid, { text, deliver = false } = {}) {
  try {
    const { data } = await callBot(bot, "/inbound", {
      method: "POST",
      body: { jid, body: text, deliver: Boolean(deliver) },
    });
    if (!data) return { ok: false, error: "Bot tidak memberi respon" };
    return { ok: Boolean(data.ok), response: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Ganti password. jid dipaksa dari sesi, tidak pernah dari body request.
export async function setPassword(bot, jid, newPassword) {
  try {
    const { httpOk, data } = await callBot(bot, "/user/password", {
      method: "POST",
      body: { jid, password: newPassword },
    });
    if (httpOk && data?.ok) return { ok: true };
    return { ok: false, error: data?.error || "Gagal mengubah password" };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export function botLabel(bot) {
  return BOTS[bot]?.label || bot;
}

// Cek status koneksi WhatsApp bot (dipakai buat kasih tau user kalau bot
// lagi jalan di mode API-only, supaya Console gak nyoba eksekusi command
// yang pasti gagal).
export async function getHealth(bot) {
  try {
    const { httpOk, data } = await callBot(bot, "/health", { useMasterToken: false });
    if (!httpOk || !data) return { ok: false, whatsappEnabled: null, botConnected: false };
    return {
      ok: true,
      whatsappEnabled: data.whatsappEnabled !== false,
      botConnected: Boolean(data.botConnected),
    };
  } catch (err) {
    return { ok: false, whatsappEnabled: null, botConnected: false, error: err.message };
  }
}
