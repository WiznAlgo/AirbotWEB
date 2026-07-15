import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { BotKey, Tab, SessionUser, BotAccess, BotProfile } from './types';
import { api } from './lib/api';
import { useTheme } from './lib/theme';
import { AppShell } from './components/AppShell';
import { LoginScreen } from './pages/LoginScreen';
import { MaintenancePage } from './pages/MaintenancePage';
import { AboutPage } from './pages/AboutPage';
import { Dashboard } from './pages/Dashboard';
import { Console } from './pages/Console';
import { History } from './pages/History';
import { Saldo } from './pages/Saldo';
import { Profile } from './pages/Profile';
import { cn } from './lib/utils';

type BootState = 'checking' | 'maintenance' | 'ready';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [boot, setBoot] = useState<BootState>('checking');
  const [botStatus, setBotStatus] = useState<Record<BotKey, boolean>>({ barcode: false, ceir: false });
  const [retrying, setRetrying] = useState(false);

  const [authState, setAuthState] = useState<'checking' | 'guest' | 'authed'>('checking');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [access, setAccess] = useState<BotAccess>({ barcode: false, ceir: false });
  const [activeBot, setActiveBot] = useState<BotKey>('barcode');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [toastMsg, setToastMsg] = useState('');
  const [botProfile, setBotProfile] = useState<BotProfile | null>(null);
  const [botProfileLoading, setBotProfileLoading] = useState(false);

  const displayToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const checkStatus = async () => {
    try {
      const res = await api('/api/status');
      const bots = res?.bots || {};
      setBotStatus({ barcode: Boolean(bots.barcode?.ok), ceir: Boolean(bots.ceir?.ok) });
      setBoot(res?.allDown ? 'maintenance' : 'ready');
    } catch {
      setBotStatus({ barcode: false, ceir: false });
      setBoot('maintenance');
    }
  };

  useEffect(() => { checkStatus(); }, []);

  useEffect(() => {
    if (boot !== 'ready') return;
    api('/api/auth/me')
      .then((res) => {
        setUser(res.user);
        setAccess(res.access);
        setAuthState('authed');
      })
      .catch(() => setAuthState('guest'));
  }, [boot]);

  useEffect(() => {
    if (authState !== 'authed') return;
    let cancelled = false;
    setBotProfileLoading(true);
    api(`/api/bots/${activeBot}/profile`)
      .then((res) => { if (!cancelled) setBotProfile(res?.user || null); })
      .catch(() => { if (!cancelled) setBotProfile(null); })
      .finally(() => { if (!cancelled) setBotProfileLoading(false); });
    return () => { cancelled = true; };
  }, [activeBot, authState]);

  const handleRetry = async () => {
    setRetrying(true);
    await checkStatus();
    setRetrying(false);
  };

  const handleLogin = (u: SessionUser, a: BotAccess, bot: BotKey) => {
    setUser(u);
    setAccess(a);
    setActiveBot(bot);
    setAuthState('authed');
  };

  const handleLogout = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* abaikan */ }
    setUser(null);
    setAuthState('guest');
    setActiveTab('dashboard');
  };

  if (boot === 'checking' || authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F17]">
        <RefreshCw className="animate-spin text-blue-400 w-8 h-8" />
      </div>
    );
  }

  if (boot === 'maintenance') {
    return <MaintenancePage botStatus={botStatus} onRetry={handleRetry} retrying={retrying} />;
  }

  if (authState === 'guest') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <>
      <AppShell
        user={user}
        access={access}
        activeBot={activeBot}
        setActiveBot={setActiveBot}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        botProfile={botProfile}
        botProfileLoading={botProfileLoading}
        theme={theme}
        toggleTheme={toggleTheme}
      >
        {activeTab === 'dashboard' && <Dashboard bot={activeBot} profile={botProfile} loadingProfile={botProfileLoading} user={user} onNavigate={setActiveTab} />}
        {activeTab === 'console' && <Console bot={activeBot} />}
        {activeTab === 'history' && <History bot={activeBot} />}
        {activeTab === 'saldo' && <Saldo bot={activeBot} />}
        {activeTab === 'profile' && <Profile toast={displayToast} />}
        {activeTab === 'about' && <AboutPage />}
      </AppShell>

      <div className={cn(
        'fixed bottom-6 right-6 bg-slate-800 border border-slate-700 text-slate-200 px-4 py-3 rounded-lg shadow-xl transition-all z-50',
        toastMsg ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}>
        {toastMsg}
      </div>
    </>
  );
}
