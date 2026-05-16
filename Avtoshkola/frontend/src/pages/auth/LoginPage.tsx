import { FormEvent, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export default function LoginPage() {
  const { login, user, profileError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Already logged in — redirect immediately (proper React way)
  if (user) {
    const home = { admin: '/admin', instructor: '/instructor', student: '/student' } as const;
    return <Navigate to={home[user.role]} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      // AuthContext listener will update user; AppRouter handles redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Грешка при вход.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Back to landing */}
      <Link
        to="/"
        className="fixed top-5 left-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl
                   bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-600
                   hover:text-gray-900 hover:shadow-md hover:border-gray-300
                   transition-all duration-150 active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Начална страница
      </Link>

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 mb-4 shadow-lg">
            <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m0 0h6m-6 0l-2-1m14-4h2a1 1 0 011 1v3a1 1 0 01-1 1h-1m-8-1h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Автошкола</h1>
          <p className="text-gray-500 text-sm mt-1">Информационна система</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Вход в системата</h2>

          {(error || profileError) && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error || profileError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Имейл адрес"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="потребител@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Парола"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
              Влез
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Нямате акаунт?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
                Регистрирайте се
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
