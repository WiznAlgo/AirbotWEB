// Helper format & agregasi kecil yang dipakai di beberapa halaman.

export function formatRupiah(n: number | undefined | null) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

export function dateLabelFromWaktu(waktu: string | undefined) {
  if (!waktu) return '-';
  return waktu.split(',')[0]?.trim() || waktu;
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 19) return 'Selamat sore';
  return 'Selamat malam';
}

export function groupCount(items: any[], keyFn: (item: any) => string) {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = keyFn(item) || 'Lainnya';
    map.set(k, (map.get(k) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
}
