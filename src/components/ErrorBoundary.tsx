import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { BRAND } from '../constants';

interface Props { children: React.ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h1 className="text-white text-lg font-bold mb-2">Terjadi kesalahan tak terduga</h1>
          <p className="text-slate-400 text-[13px] leading-relaxed mb-6">
            {BRAND.name} mengalami gangguan sementara di tampilan ini. Coba muat ulang halaman.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-bold px-5 py-3 rounded-xl transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }
}
