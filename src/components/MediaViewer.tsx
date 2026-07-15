import React, { useEffect, useState } from 'react';
import { mediaUrlOf, mediaToBlob, downloadSingleMedia } from '../lib/media';

export function MediaViewer({ item, index = 0 }: { item: any; index?: number }) {
  const fallbackUrl = mediaUrlOf(item);
  // Render pakai Blob URL, bukan data: URI mentah. Alasannya: begitu user
  // tahan-lama (long-press) gambar buat "Save image", browser nentuin nama
  // file dari src-nya — Blob URL bawa tipe MIME yang jelas (image/png dst),
  // jadi hasil save-nya konsisten .png, sedangkan data: URI suka nyasar jadi
  // file tanpa ekstensi di sebagian browser mobile.
  const [displayUrl, setDisplayUrl] = useState<string | null>(fallbackUrl);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setDisplayUrl(fallbackUrl);

    mediaToBlob(item).then((blob) => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setDisplayUrl(objectUrl);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  if (!fallbackUrl) return null;
  const url = displayUrl || fallbackUrl;

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadSingleMedia(item, index);
    } finally {
      setDownloading(false);
    }
  };

  const renderContent = () => {
    if (item.type === 'image') {
      return <img src={url} alt={item.caption || 'Image'} className="w-full h-full rounded-lg object-cover bg-slate-100" loading="lazy" />;
    }
    if (item.type === 'video') {
      return <video src={url} controls className="w-full rounded-lg bg-slate-100" />;
    }
    if (item.type === 'audio') {
      return <audio src={url} controls className="w-full mt-2" />;
    }
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white w-full">
        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center shrink-0">
           <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        </div>
        <div className="flex-1 min-w-0">
           <p className="text-sm font-bold text-slate-700 truncate">{item.fileName || item.name || 'Document File'}</p>
           {item.mimetype && <p className="text-[11px] text-slate-500 truncate">{item.mimetype}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="relative group w-full aspect-square flex flex-col items-center">
      {renderContent()}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-lg p-1 shadow-sm border border-slate-200">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="text-blue-600 hover:text-blue-700 px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide disabled:opacity-50"
          title="Download"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          {downloading ? '...' : 'Download'}
        </button>
      </div>
    </div>
  );
}
