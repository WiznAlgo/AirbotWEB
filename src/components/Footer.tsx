import React from 'react';
import { BRAND, DEVELOPER } from '../constants';

export function Footer({ dark = false }: { dark?: boolean }) {
  return (
    <footer className={dark ? 'text-slate-500' : 'text-slate-400'}>
      <div className="flex items-center justify-center gap-1.5 text-[11px] py-4 px-4 text-center flex-wrap">
        <span>Powered by <span className="font-semibold">{BRAND.name}</span></span>
        <span className="opacity-50">·</span>
        <span>
          Developed by{' '}
          <a
            href={DEVELOPER.github}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:text-blue-500 transition-colors underline decoration-dotted underline-offset-2"
          >
            {DEVELOPER.name}
          </a>
        </span>
      </div>
    </footer>
  );
}
