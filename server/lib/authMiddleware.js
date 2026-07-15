import { decodeSession } from "./session.js";
import { SESSION_COOKIE_NAME } from "../config.js";

const COOKIE_NAME = SESSION_COOKIE_NAME;

export function requireAuth(req, res, next) {
  const raw = req.signedCookies?.[COOKIE_NAME];
  const session = decodeSession(raw);
  if (!session) {
    return res.status(401).json({ ok: false, error: "Sesi tidak valid, silakan login lagi." });
  }
  req.session = session;
  next();
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
