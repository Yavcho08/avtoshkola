import { useAuth } from '../../hooks/useAuth';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface Props { title: string }

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Добро утро';
  if (h < 18) return 'Добър ден';
  return 'Добър вечер';
}

function NotificationBell() {
  const { state, subscribe, unsubscribe } = usePushNotifications();

  if (state === 'unsupported') return null;

  const isSubscribed = state === 'subscribed';
  const isLoading = state === 'loading';

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading || state === 'denied'}
      title={
        state === 'denied' ? 'Нотификациите са блокирани в браузъра' :
        isSubscribed ? 'Изключи нотификации' :
        'Включи нотификации'
      }
      className={`relative flex items-center justify-center h-9 w-9 rounded-xl border transition-all duration-150 active:scale-95
        ${isSubscribed
          ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
          : state === 'denied'
            ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
            : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
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
      {isSubscribed && (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500" />
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
    <header className="h-16 flex-shrink-0 bg-white border-b border-gray-100 flex items-center justify-between px-6 gap-4">
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-gray-900 leading-tight">{title}</h1>
        {user && (
          <p className="text-xs text-gray-400 leading-tight">
            {greeting()}, {user.profile.first_name}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-500
                     border border-gray-200 bg-white
                     hover:text-red-600 hover:border-red-200 hover:bg-red-50
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
