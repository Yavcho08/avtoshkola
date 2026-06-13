import { FormEvent, useState } from 'react';
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/client';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState((searchParams.get('ref') ?? '').toUpperCase());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (user) {
    const home = { admin: '/admin', instructor: '/instructor', student: '/student' } as const;
    return <Navigate to={home[user.role]} replace />;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Регистрацията е успешна!</h2>
          <p className="text-gray-500 mb-8">Акаунтът ви е създаден. Вече можете да влезете в системата.</p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Към страницата за вход
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Паролите не съвпадат.');
      return;
    }

    if (password.length < 6) {
      setError('Паролата трябва да е поне 6 символа.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/register', {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone: phone || undefined,
        referral_code: referralCode.trim() || undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error ?? 'Грешка при регистрация. Моля, опитайте отново.');
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
          <p className="text-gray-500 text-sm mt-1">Създайте нов акаунт</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Регистрация</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Собствено име"
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Иван"
                autoComplete="given-name"
                required
              />
              <Input
                label="Фамилно име"
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Петров"
                autoComplete="family-name"
                required
              />
            </div>

            <Input
              label="Телефон (по избор)"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+359 88 123 4567"
              autoComplete="tel"
            />

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
              placeholder="Минимум 6 символа"
              autoComplete="new-password"
              required
            />

            <Input
              label="Потвърди парола"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />

            <Input
              label="Реферален код (по избор)"
              type="text"
              value={referralCode}
              onChange={e => setReferralCode(e.target.value.toUpperCase())}
              placeholder="напр. AB3K9P"
              maxLength={6}
            />
            {referralCode.trim() && (
              <div className="rounded-lg bg-purple-50 border border-purple-100 p-3 text-xs text-purple-700 flex items-center gap-2">
                <span>🎁</span>
                Имаш покана! Ти и приятелят ти получавате 10% отстъпка.
              </div>
            )}

            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-600">
              Регистрацията създава акаунт на курсист. Инструктори и администратори се добавят от системата.
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
              Създай акаунт
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Вече имате акаунт?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
                Влезте тук
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
