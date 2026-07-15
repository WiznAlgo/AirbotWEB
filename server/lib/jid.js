// Helper untuk menormalkan JID / username WhatsApp supaya perbandingan
// "apakah baris data ini milik user yang sedang login" selalu konsisten,
// apapun format mentahnya (62812xxx@lid, 62812xxx@s.whatsapp.net, atau
// cuma digitnya saja seperti yang dipakai di history_saldo.json).

export function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

// Ambil bagian sebelum "@" kalau ada, lalu ambil digitnya saja.
export function digitsOf(value = "") {
  const raw = String(value || "").trim();
  const beforeAt = raw.includes("@") ? raw.split("@")[0] : raw;
  return onlyDigits(beforeAt);
}

// Bandingkan dua identitas (jid lengkap, username, atau digit polos)
// berdasarkan digit intinya saja.
export function sameIdentity(a = "", b = "") {
  const da = digitsOf(a);
  const db = digitsOf(b);
  if (!da || !db) return false;
  return da === db;
}

export function toLidJid(digits = "") {
  const d = onlyDigits(digits);
  return d ? `${d}@lid` : "";
}
