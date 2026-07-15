// =====================================================================
// KONFIGURASI PANEL - edit langsung di file ini, gak perlu ngatur-ngatur
// Environment Variables di dashboard Vercel/hosting manapun.
//
// Cukup isi 2 token di bawah (TOKEN_BARCODE & TOKEN_CEIR), commit/upload
// ulang, lalu redeploy. Selesai.
//
// ⚠️ PENTING: token di bawah ini seperti "kunci master" yang bisa membaca
// & mengubah data SEMUA user di bot terkait. Jangan sampai file ini ke-
// upload ke repo GitHub PUBLIK atau dibagikan ke orang lain. Kalau repo
// kamu private atau kamu upload manual ke Vercel (bukan lewat GitHub),
// ini sudah cukup aman.
//
// Kalau suatu saat kamu tetap mau pakai Environment Variables (mis. supaya
// token tidak ikut ke-commit ke git), nilai di process.env akan otomatis
// dipakai duluan - isi di bawah ini cuma dipakai sebagai cadangan kalau
// env var-nya kosong.
// =====================================================================

const CONFIG = {
  barcode: {
    baseUrl: "https://bc.radenunlock.com/api",
    // Ambil dari config.api.authToken di project Bot Barcode kamu.
    apiToken: "PASTE_TOKEN_MASTER_BOT_BARCODE_DI_SINI",
  },
  ceir: {
    baseUrl: "https://cr.radenunlock.com/api",
    // Ambil dari config.api.authToken di project Bot CEIR kamu.
    apiToken: "PASTE_TOKEN_MASTER_BOT_CEIR_DI_SINI",
  },
  // String rahasia buat menandatangani cookie sesi login. Ganti dengan
  // string acak apa saja yang panjang (bebas, tidak harus dihafal).
  sessionSecret: "ganti-dengan-string-acak-bebas-yang-panjang-123456",
  sessionHours: 12,
  sessionCookieName: "airbot_panel_session",
};

function pick(envKey, fallback) {
  const fromEnv = process.env[envKey];
  return fromEnv && fromEnv.trim() ? fromEnv.trim() : fallback;
}

export const BOT_BARCODE_BASE_URL = pick("BOT_BARCODE_BASE_URL", CONFIG.barcode.baseUrl);
export const BOT_BARCODE_API_TOKEN = pick("BOT_BARCODE_API_TOKEN", CONFIG.barcode.apiToken);
export const BOT_CEIR_BASE_URL = pick("BOT_CEIR_BASE_URL", CONFIG.ceir.baseUrl);
export const BOT_CEIR_API_TOKEN = pick("BOT_CEIR_API_TOKEN", CONFIG.ceir.apiToken);
export const SESSION_SECRET = pick("SESSION_SECRET", CONFIG.sessionSecret);
export const SESSION_HOURS = Number(pick("SESSION_HOURS", String(CONFIG.sessionHours)));
export const SESSION_COOKIE_NAME = pick("SESSION_COOKIE_NAME", CONFIG.sessionCookieName);
