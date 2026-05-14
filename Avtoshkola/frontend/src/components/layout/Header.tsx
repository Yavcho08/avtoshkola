import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';

interface Props {
  title: string;
}

export function Header({ title }: Props) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
  };

  return (
    <header className="h-16 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Изход
      </Button>
    </header>
  );
}
