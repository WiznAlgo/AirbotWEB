import { Smartphone, Database } from 'lucide-react';
import type { BotKey } from './types';

// Konfigurasi branding & kredit - satu tempat biar gampang diubah.

export const BRAND = {
  name: 'RadenUnlock',
  tagline: 'Dashboard untuk Bot Barcode & Bot CEIR',
  version: 'v1.1.0',
};

export const DEVELOPER = {
  name: 'WiznAlgo',
  github: 'https://github.com/WiznAlgo',
  portfolio: '',
  whatsapp: '+62 851-1313-3968',
  email: 'wisnutugas123@gmail.com',
};

export const BOT_CONTACT = {
  barcode: { waNumber: '0895-2326-1157' },
  ceir: { waNumber: '0895-2588-3317' },
};

export const BOT_META: Record<BotKey, { label: string; short: string; icon: any; accent: string; description: string }> = {
  barcode: {
    label: 'Bot A · Barcode',
    short: 'Barcode',
    icon: Smartphone,
    accent: 'blue',
    description: 'Generate & kelola barcode',
  },
  ceir: {
    label: 'Bot B · CEIR',
    short: 'CEIR',
    icon: Database,
    accent: 'purple',
    description: 'Cek status & history IMEI',
  },
};

export const FEATURES = [
  'Login aman per akun',
  'Integrasi REST API',
  'Console command ala WhatsApp',
  'Render gambar & media langsung',
  'Riwayat perintah & saldo',
  'Pelacakan saldo real-time',
  'Tampilan responsif di HP & desktop',
];
