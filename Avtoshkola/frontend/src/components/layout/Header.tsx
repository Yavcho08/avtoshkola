import { useAuth } from '../../hooks/useAuth';

interface Props { title: string }

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Добро утро';
  if (h < 18) return 'Добър ден';
  return 'Добър вечер';
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
    </header>
  );
}
