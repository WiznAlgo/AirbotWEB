import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { encodeSession, sessionMaxAgeMs } from "./lib/session.js";
import { requireAuth, COOKIE_NAME_EXPORT as COOKIE_NAME } from "./lib/authMiddleware.js";
import { SESSION_SECRET } from "./config.js";
import {
  isValidBot,
  listBots,
  verifyLogin,
  getUserProfile,
  getHistorySaldo,
  getHistoryPemakaian,
  getPendingDeposits,
  sendCommand,
  setPassword,
  getHealth,
} from "./lib/botApi.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable("x-powered-by");
// Di belakang proxy/load-balancer (Vercel, Railway, Render, dll) supaya
// "secure" cookie & IP untuk rate-limit terbaca benar.
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser(SESSION_SECRET));

const isProd = process.env.NODE_ENV === "production";
const cookieOpts = {
  httpOnly: true,
  signed: true,
  sameSite: "lax",
  secure: isProd,
  maxAge: sessionMaxAgeMs(),
  path: "/",
};

function botParam(req, res, next) {
  const bot = req.params.bot;
  if (!isValidBot(bot)) {
    return res.status(400).json({ ok: false, error: `Bot tidak dikenal: ${bot}` });
  }
  next();
}

// ---------- AUTH ----------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Terlalu banyak percobaan login. Coba lagi beberapa menit lagi." },
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const bot = String(req.body?.bot || "").trim();
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "").trim();
  if (!isValidBot(bot)) {
    return res.status(400).json({ ok: false, error: "Pilih bot (Barcode/CEIR) terlebih dahulu" });
  }
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: "Username dan password wajib diisi" });
  }

  // Verifikasi password HANYA ke bot yang dipilih user di layar login.
  const result = await verifyLogin(bot, username, password);
  if (!result.ok) {
    return res.status(401).json({ ok: false, error: result.error || "Login gagal" });
  }

  // Cek keberadaan akun ini di bot yang SATUNYA (pakai token master, tidak
  // perlu password cocok) supaya badge "belum terdaftar" di UI akurat, dan
  // supaya saldo/riwayat bot satunya tetap bisa ditampilkan kalau memang ada.
  const otherBot = listBots().find((b) => b !== bot);
  const otherProfile = otherBot ? await getUserProfile(otherBot, result.jid) : { ok: false };

  const access = {
    [bot]: true,
    ...(otherBot ? { [otherBot]: Boolean(otherProfile.ok && otherProfile.user) } : {}),
  };

  const cookieValue = encodeSession({
    jid: result.jid,
    name: result.name,
    username: result.username,
    access,
  });

  res.cookie(COOKIE_NAME, cookieValue, cookieOpts);
  return res.json({
    ok: true,
    user: { jid: result.jid, name: result.name, username: result.username },
    access,
  });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOpts, maxAge: undefined });
  res.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const { jid, name, username, access } = req.session;
  res.json({ ok: true, user: { jid, name, username }, access });
});

// ---------- PER-BOT DATA (selalu discope ke jid dari sesi) ----------
app.get("/api/bots/:bot/profile", requireAuth, botParam, async (req, res) => {
  const bot = req.params.bot;
  const result = await getUserProfile(bot, req.session.jid);
  res.json(result);
});

// Status publik (TANPA perlu login) buat ngecek apakah masing-masing bot API
// bisa dihubungi sama sekali. Dipakai frontend untuk nampilin halaman
// maintenance yang rapi kalau semua bot lagi down, bukannya website blank/error.
app.get("/api/status", async (req, res) => {
  const bots = listBots();
  const entries = await Promise.all(bots.map(async (bot) => [bot, await getHealth(bot)]));
  const status = Object.fromEntries(entries);
  const anyReachable = entries.some(([, h]) => h.ok);
  res.json({ ok: true, allDown: !anyReachable, bots: status });
});

app.get("/api/bots/:bot/health", requireAuth, botParam, async (req, res) => {
  const bot = req.params.bot;
  const result = await getHealth(bot);
  res.json(result);
});

app.get("/api/bots/:bot/history/saldo", requireAuth, botParam, async (req, res) => {
  const bot = req.params.bot;
  const result = await getHistorySaldo(bot, req.session.jid);
  res.json(result);
});

app.get("/api/bots/:bot/history/command", requireAuth, botParam, async (req, res) => {
  const bot = req.params.bot;
  const result = await getHistoryPemakaian(bot, req.session.jid);
  res.json(result);
});

app.get("/api/bots/:bot/deposits/pending", requireAuth, botParam, async (req, res) => {
  const bot = req.params.bot;
  if (bot !== "ceir") return res.json({ ok: true, rows: [] });
  const result = await getPendingDeposits(bot, req.session.jid);
  res.json(result);
});

app.post("/api/bots/:bot/console", requireAuth, botParam, async (req, res) => {
  const bot = req.params.bot;
  const text = String(req.body?.text || "").trim();
  const deliver = Boolean(req.body?.deliver);
  if (!text) return res.status(400).json({ ok: false, error: "Command wajib diisi" });

  const result = await sendCommand(bot, req.session.jid, { text, deliver });
  res.json(result);
});

// ---------- PROFILE (gabungan 2 bot) ----------
app.get("/api/profile/summary", requireAuth, async (req, res) => {
  const bots = listBots();
  const entries = await Promise.all(bots.map(async (bot) => [bot, await getUserProfile(bot, req.session.jid)]));
  const summary = Object.fromEntries(entries);
  res.json({ ok: true, jid: req.session.jid, name: req.session.name, username: req.session.username, bots: summary });
});

app.post("/api/profile/password", requireAuth, async (req, res) => {
  const newPassword = String(req.body?.newPassword || "").trim();
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ ok: false, error: "Password baru minimal 4 karakter" });
  }

  const bots = listBots();
  const results = await Promise.all(bots.map((bot) => setPassword(bot, req.session.jid, newPassword)));
  const perBot = Object.fromEntries(bots.map((bot, i) => [bot, results[i]]));
  const anyOk = results.some((r) => r.ok);

  res.status(anyOk ? 200 : 400).json({ ok: anyOk, perBot });
});

// ---------- Serve frontend build ----------
// Di Vercel, file statis di folder dist/ sudah dilayani langsung oleh Vercel
// sendiri (lihat vercel.json), jadi blok ini kita lewati supaya function
// tidak perlu ikut membawa seluruh folder dist/ (lebih ringan & cepat cold-start).
// Di VPS/lokal (`npm start`), blok ini yang menyajikan hasil build frontend.
if (!process.env.VERCEL) {
  const distDir = path.join(__dirname, "..", "dist");
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get(/^(?!\/api\/).*/, (req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }
}

app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Route tidak ditemukan" });
});

export default app;
