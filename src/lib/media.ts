import JSZip from 'jszip';

// --- Extract text/media dari output command (dipakai Console) ---
export function extractOutputs(obj: any): { text: string[], media: any[] } {
  let text: string[] = [];
  let media: any[] = [];
  if (!obj) return { text, media };

  if (typeof obj === 'string') {
    text.push(obj);
    return { text, media };
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const res = extractOutputs(item);
      text.push(...res.text);
      media.push(...res.media);
    }
    return { text, media };
  }

  if (typeof obj === 'object') {
    const hasMediaData = Boolean(obj.url || obj.base64 || obj.dataUrl || (obj.media && (obj.media.base64 || obj.media.dataUrl || obj.media.url)));
    if (hasMediaData || (obj.type && ['image', 'video', 'audio', 'document'].includes(obj.type))) {
      let mediaItem = { ...obj };
      if (obj.media) {
        mediaItem = { ...mediaItem, ...obj.media };
      }
      if (mediaItem.dataUrl && !mediaItem.url) {
        mediaItem.url = mediaItem.dataUrl;
      }

      if (!mediaItem.type) {
        const mime = mediaItem.mimetype || mediaItem.mimeType || '';
        if (mime.startsWith('image/')) mediaItem.type = 'image';
        else if (mime.startsWith('video/')) mediaItem.type = 'video';
        else if (mime.startsWith('audio/')) mediaItem.type = 'audio';
        else if (mediaItem.base64 || mediaItem.url) mediaItem.type = 'image';
        else mediaItem.type = 'document';
      }

      media.push(mediaItem);
    }

    if (typeof obj.text === 'string') {
      text.push(obj.text);
    } else if (typeof obj.message === 'string') {
      text.push(obj.message);
    } else if (typeof obj.replyText === 'string') {
      text.push(obj.replyText);
    }

    for (const key in obj) {
      if (key !== 'raw' && key !== 'id' && key !== 'text' && key !== 'message' && key !== 'replyText' && key !== 'type' && typeof obj[key] === 'object') {
        const res = extractOutputs(obj[key]);
        text.push(...res.text);
        media.push(...res.media);
      }
    }
  }
  return { text, media };
}

// --- Download / zip media (dipakai Console) ---
function mimeToExt(mime: string | undefined) {
  const m = (mime || '').toLowerCase();
  if (m.includes('jpeg') || m.includes('jpg')) return '.jpg';
  if (m.includes('png')) return '.png';
  if (m.includes('webp')) return '.webp';
  if (m.includes('gif')) return '.gif';
  if (m.includes('mp4')) return '.mp4';
  if (m.includes('mpeg') && m.includes('audio')) return '.mp3';
  if (m.includes('ogg')) return '.ogg';
  if (m.includes('pdf')) return '.pdf';
  return '.bin';
}

function filenameForMedia(item: any, index: number) {
  if (item.fileName) return item.fileName;
  if (item.name) return item.name;
  // Samain default mime-nya sama yang dipakai mediaUrlOf() buat nge-render
  // preview-nya (base64 tanpa mimeType eksplisit dianggap image/png) — kalau
  // enggak, ekstensi filename bisa beda sama tipe yang sebenernya ditampilkan.
  const mime = item.mimeType || item.mimetype || (item.base64 ? 'image/png' : '');
  const ext = mimeToExt(mime);
  return `gambar-${index + 1}${ext}`;
}

export function mediaUrlOf(item: any): string | null {
  return item.url || (item.base64 ? `data:${item.mimeType || item.mimetype || 'image/png'};base64,${item.base64}` : null);
}

export async function mediaToBlob(item: any): Promise<Blob | null> {
  const url = mediaUrlOf(item);
  if (!url) return null;
  try {
    const res = await fetch(url);
    return await res.blob();
  } catch {
    return null;
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Dipakai Console buat mutusin kapan galeri media langsung ditampilkan inline
// vs kapan cukup dikasih ringkasan + tombol download aja (biar console gak
// keberatan render puluhan gambar sekaligus).
export const MAX_INLINE_MEDIA = 6;

// Download 1 item media langsung dengan nama file + ekstensi yang benar.
// Dipakai juga oleh MediaViewer (tombol download per-gambar), supaya nggak
// ada 2 versi logic download yang beda (yang lama sempet ada tombol terpisah
// yang gak nebak ekstensi sama sekali, makanya kesave jadi file tanpa tipe).
export async function downloadSingleMedia(item: any, index = 0) {
  const blob = await mediaToBlob(item);
  if (!blob) return false;
  triggerBlobDownload(blob, filenameForMedia(item, index));
  return true;
}

// Download semua media dalam 1 output command. Kalau cuma 1 file, langsung
// download filenya. Kalau lebih dari 1, dibungkus jadi 1 file .zip (item
// yang masuk sini sudah dipastikan tidak ada duplikat oleh pemanggilnya).
export async function downloadMediaBundle(items: any[], baseName: string) {
  const valid = items.filter((it) => mediaUrlOf(it));
  if (valid.length === 0) return;

  if (valid.length === 1) {
    await downloadSingleMedia(valid[0], 0);
    return;
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();
  for (let i = 0; i < valid.length; i++) {
    const blob = await mediaToBlob(valid[i]);
    if (!blob) continue;
    let name = filenameForMedia(valid[i], i);
    while (usedNames.has(name)) {
      const dot = name.lastIndexOf('.');
      name = dot > -1 ? `${name.slice(0, dot)}-${i}${name.slice(dot)}` : `${name}-${i}`;
    }
    usedNames.add(name);
    zip.file(name, blob);
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(zipBlob, `${baseName}.zip`);
}
