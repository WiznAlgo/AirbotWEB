import React, { useState } from 'react';
import {
  Activity, LogOut, Terminal, TerminalSquare, User as UserIcon, LayoutDashboard,
  Menu, X, CreditCard, Info, Sun, Moon,
} from 'lucide-react';
import { BotKey, Tab, SessionUser, BotAccess, BotProfile } from '../types';
import { cn } from '../lib/utils';
import { formatRupiah } from '../lib/format';
import { BOT_META, BRAND } from '../constants';
import { Footer } from './Footer';

interface Props {
  user: SessionUser | null;
  access: BotAccess;
  activeBot: BotKey;
  setActiveBot: (bot: BotKey) => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogout: () => void;
  botProfile: BotProfile | null;
  botProfileLoading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  children: React.ReactNode;
}

const navItems: { id: Tab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'console', label: 'Console Command', icon: TerminalSquare },
  { id: 'history', label: 'Riwayat Perintah', icon: Terminal },
  { id: 'saldo', label: 'Riwayat Saldo', icon: CreditCard },
];

const tabTitles: Record<Tab, string> = {
  dashboard: 'Dashboard',
  console: 'Console Command',
  history: 'Riwayat Perintah',
  saldo: 'Riwayat Saldo',
  profile: 'Profile',
  about: 'Tentang',
};

export function AppShell({
  user, access, activeBot, setActiveBot, activeTab, setActiveTab, onLogout,
  botProfile, botProfileLoading, theme, toggleTheme, children,
}: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const meta = BOT_META[activeBot];

  const ThemeToggle = ({ full = false }: { full?: boolean }) => (
    <button
      onClick={toggleTheme}
      className={cn(
        'flex items-center gap-2 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10',
        full ? 'w-full justify-center px-4 py-2.5 text-[13px] font-medium' : 'p-2.5'
      )}
      title={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {full && (theme === 'dark' ? 'Mode Terang' : 'Mode Gelap')}
    </button>
  );

  const BotSwitcher = ({ compact = false }: { compact?: boolean }) => (
    <div className={cn('grid grid-cols-2 gap-2', compact ? 'mb-3' : 'mb-4')}>
      {(Object.keys(BOT_META) as BotKey[]).map((key) => {
        const m = BOT_META[key];
        const Icon = m.icon;
        const isActive = activeBot === key;
        return (
          <button
            key={key}
            onClick={() => { setActiveBot(key); setActiveTab('dashboard'); }}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all active:scale-[0.97]',
              isActive
                ? 'bg-[#0F172A] text-white border-slate-900/10 shadow-sm dark:bg-blue-600 dark:border-blue-500'
                : 'bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[11px] font-bold leading-tight">{m.short}</span>
            {!access[key] && <span className="text-[9px] font-medium opacity-70">belum terdaftar</span>}
          </button>
        );
      })}
    </div>
  );

  const NavButton = ({ id, label, icon: Icon }: { id: Tab; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-200',
        activeTab === id
          ? 'bg-[#0F172A] dark:bg-blue-600 text-white shadow-sm border border-slate-900/10 dark:border-blue-500'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
      )}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-[#0B0F17] text-slate-800 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[260px] flex-col bg-white dark:bg-[#0E1524] border-r border-slate-200/60 dark:border-white/5 z-20">
        <div className="h-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white font-semibold text-lg tracking-wide">
            <div className="w-8 h-8 rounded-lg bg-[#0F172A] dark:bg-blue-600 flex items-center justify-center shrink-0 shadow-md">
              <Activity className="w-4 h-4 text-white" />
            </div>
            {BRAND.name}
          </div>
        </div>
        <div className="px-4">
          <BotSwitcher />
        </div>
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => <NavButton key={item.id} {...item} />)}
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 space-y-1.5">
            <NavButton id="profile" label="Profile" icon={UserIcon} />
            <NavButton id="about" label="Tentang" icon={Info} />
          </div>
        </nav>
        <div className="p-5 border-t border-slate-200/60 dark:border-white/5 space-y-3">
          <ThemeToggle full />
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name || user?.username || 'User'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.jid?.split('@')[0] || '-'}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="md:hidden">
        <div className="absolute top-0 left-0 right-0 h-16 bg-white dark:bg-[#0E1524] border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-lg">
            <div className="w-6 h-6 rounded-md bg-[#0F172A] dark:bg-blue-600 flex items-center justify-center shrink-0">
              <Activity className="w-3 h-3 text-white" />
            </div>
            {BRAND.name}
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500 dark:text-slate-400">
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-10 pt-16" onClick={() => setIsSidebarOpen(false)}>
            <div className="bg-white dark:bg-[#0E1524] w-72 h-full border-r border-slate-200 dark:border-white/5 flex flex-col overflow-y-auto animate-[fadeIn_0.15s_ease-out]" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                <BotSwitcher compact />
              </div>
              <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-medium',
                      activeTab === item.id ? 'bg-[#0F172A] dark:bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/5 space-y-1">
                  {[{ id: 'profile' as Tab, label: 'Profile', icon: UserIcon }, { id: 'about' as Tab, label: 'Tentang', icon: Info }].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-medium',
                        activeTab === item.id ? 'bg-[#0F172A] dark:bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </nav>
              <div className="p-4 border-t border-slate-200 dark:border-white/5">
                <button onClick={onLogout} className="w-full py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl">Log Out</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-[#0B0F17] pt-16 md:pt-0 overflow-hidden relative transition-colors duration-300">
        <header className="hidden md:flex h-20 items-center px-8 bg-slate-100 dark:bg-[#0B0F17] z-10 sticky top-0 transition-colors duration-300">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">{meta.label}</span>
            <h1 className="text-xl font-bold capitalize text-slate-900 dark:text-white tracking-tight">{tabTitles[activeTab]}</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[12px] font-bold tracking-wide flex items-center gap-1.5">
              Online
            </div>
            {activeTab !== 'profile' && activeTab !== 'about' && (
              <div className="px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 text-[12px] font-bold tracking-wide flex items-center gap-2">
                {botProfileLoading ? '...' : botProfile ? formatRupiah(botProfile.saldo) : 'Belum terdaftar'}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:px-8 md:pb-4 relative z-0">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
