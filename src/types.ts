export type BotKey = "barcode" | "ceir";
export type Tab = "dashboard" | "console" | "history" | "saldo" | "profile" | "about";

export interface SessionUser {
  jid: string;
  name: string;
  username: string;
}

export interface BotAccess {
  barcode: boolean;
  ceir: boolean;
}

export interface BotHealth {
  ok: boolean;
  whatsappEnabled: boolean | null;
  botConnected: boolean;
}

// Data user sebagaimana dikembalikan oleh endpoint /users/:jid tiap bot
// (sudah aman, tidak pernah berisi password mentah - lihat summarizeUser
// di lib/httpApi.js masing-masing bot).
export interface BotProfile {
  jid: string;
  username: string;
  name: string;
  saldo: number;
  vip: boolean;
  hasPassword: boolean;
}

export interface ProfileSummaryResponse {
  ok: boolean;
  jid: string;
  name: string;
  username: string;
  bots: Record<BotKey, { ok: boolean; user: BotProfile | null; error?: string }>;
}

// Satu baris riwayat isi saldo (field "eksekutor" sudah dihapus oleh backend
// sebelum sampai ke frontend, sesuai permintaan: siapa yang mengisi tidak
// perlu ditampilkan ke user).
export interface SaldoHistoryRow {
  waktu: string;
  target_user: string;
  tipe_transaksi: string;
  nominal: number;
  saldo_akhir: number;
}

// Riwayat command Bot Barcode: satu baris log ringkas per kategori command.
export interface BarcodeLogRow {
  kategori: string;
  jumlah: number;
  tanggal: string;
}

export interface BarcodeHistoryResponse {
  ok: boolean;
  summary: { barcode_custom: number; barcode_acak: number; about: number; filter8: number } | null;
  logs: BarcodeLogRow[];
  error?: string;
}

// Riwayat command Bot CEIR: baris cek status / cek history IMEI.
export interface CeirLogRow {
  waktu: string;
  timestamp?: number;
  jenis?: string;
  user: string;
  nama?: string;
  jumlah_imei?: number;
  imei_list?: string[];
  total_biaya?: number;
}

export interface CeirHistoryResponse {
  ok: boolean;
  status: CeirLogRow[];
  history: CeirLogRow[];
  error?: string;
}

export interface ApiOutputItem {
  type: string;
  text?: string;
  caption?: string;
  message?: string;
  name?: string;
  filename?: string;
  fileName?: string;
  url?: string;
  mimeType?: string;
  base64?: string;
  data?: string;
  content?: string;
  body?: string;
  title?: string;
  raw?: unknown;
}

export interface LogEntryType {
  id: string;
  cmdText: string;
  isError: boolean;
  outputText: any;
  topText?: string;
  outputItems?: ApiOutputItem[];
  time: string;
  rawResponse?: string;
  rawObject?: any;
}
