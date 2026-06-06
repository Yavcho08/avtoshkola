import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface Props { title: string }

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Добро утро';
  if (h < 18) return 'Добър ден';
  return 'Добър вечер';
}

function NotificationBell() {
  const { state, error, subscribe, unsubscribe } = usePushNotifications();
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (state === 'unsupported') return null;

  const isSubscribed = state === 'subscribed';
  const isLoading = state === 'loading';

  const handleClick = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      const prevState = state;
      await subscribe();
      // Check if we just subscribed
      if (prevState !== 'subscribed') {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    }
  };

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      setShowError(true);
      const t = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isLoading || state === 'denied'}
        title={
          state === 'denied' ? 'Нотификациите са блокирани' :
          isSubscribed ? 'Нотификации: Включени — цъкни за изключване' :
          'Включи известия за нови занятия'
        }
        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all duration-150 active:scale-95 text-xs font-semibold
          ${isSubscribed
            ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400'
            : state === 'denied'
              ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
              : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'
          }`}
      >
        {isLoading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )}
        <span className="hidden sm:inline">
          {isLoading ? 'Зареждане...' : isSubscribed ? 'Известия: Вкл.' : 'Известия'}
        </span>
        {isSubscribed && <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
      </button>

      {/* Error toast */}
      {showError && error && (
        <div className="absolute top-12 right-0 z-50 w-72 bg-red-50 border border-red-200 rounded-xl p-3 shadow-lg text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Success toast */}
      {showSuccess && (
        <div className="absolute top-12 right-0 z-50 w-64 bg-green-50 border border-green-200 rounded-xl p-3 shadow-lg text-xs text-green-700 font-medium">
          Известията са включени успешно!
        </div>
      )}
    </div>
  );
}

function InstallButton() {
  const promptRef = useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setInstalled(true); setCanInstall(false); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!canInstall || installed) return null;

  const handleInstall = async () => {
    if (!promptRef.current) return;
    promptRef.current.prompt();
    const { outcome } = await promptRef.current.userChoice;
    if (outcome === 'accepted') { setCanInstall(false); }
    promptRef.current = null;
  };

  return (
    <button
      onClick={handleInstall}
      title="Инсталирай приложението на устройството си"
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 text-xs font-semibold
                 hover:bg-blue-100 active:scale-95 transition-all duration-150
                 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span className="hidden sm:inline">Инсталирай</span>
    </button>
  );
}

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={isDark ? 'Светъл режим' : 'Тъмен режим'}
      className="flex items-center justify-center h-9 w-9 rounded-xl border border-gray-200 bg-white text-gray-500
                 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50
                 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400 dark:hover:text-slate-200
                 active:scale-95 transition-all duration-150"
    >
      {isDark ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

export function Header({ title }: Props) {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
  };

  return (
    <header className="h-16 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between px-6 gap-4 transition-colors duration-200">
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-tight">{title}</h1>
        {user && (
          <p className="text-xs text-gray-400 dark:text-slate-500 leading-tight">
            {greeting()}, {user.profile.first_name}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <InstallButton />
        <ThemeToggle />
        <NotificationBell />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-500
                     border border-gray-200 bg-white
                     hover:text-red-600 hover:border-red-200 hover:bg-red-50
                     dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400
                     dark:hover:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-950
                     active:scale-95 transition-all duration-150"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Изход
        </button>
      </div>
    </header>
  );
}
