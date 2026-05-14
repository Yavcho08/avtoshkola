import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
}

const adminNav: NavItem[] = [
  { to: '/admin',             label: 'Табло',               icon: <HomeIcon /> },
  { to: '/admin/students',    label: 'Студенти',            icon: <UsersIcon /> },
  { to: '/admin/instructors', label: 'Инструктори',         icon: <InstructorIcon /> },
  { to: '/admin/vehicles',    label: 'Превозни средства',   icon: <CarIcon /> },
  { to: '/admin/exams',       label: 'Изпити',              icon: <ClipboardIcon /> },
  { to: '/admin/finances',    label: 'Финанси',             icon: <CurrencyIcon /> },
];

const instructorNav: NavItem[] = [
  { to: '/instructor',          label: 'Табло',      icon: <HomeIcon /> },
  { to: '/instructor/schedule', label: 'График',     icon: <CalendarIcon /> },
];

const studentNav: NavItem[] = [
  { to: '/student',          label: 'Табло',      icon: <HomeIcon /> },
  { to: '/student/schedule', label: 'График',     icon: <CalendarIcon /> },
  { to: '/student/payments', label: 'Плащания',   icon: <CurrencyIcon /> },
];

const navByRole: Record<UserRole, NavItem[]> = {
  admin: adminNav,
  instructor: instructorNav,
  student: studentNav,
};

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;
  const items = navByRole[user.role];

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 flex flex-col min-h-screen">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-gray-700">
        <p className="text-white font-bold text-lg leading-tight">Автошкола</p>
        <p className="text-gray-400 text-xs mt-0.5">Информационна система</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin' || item.to === '/instructor' || item.to === '/student'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
              ].join(' ')
            }
          >
            <span className="h-5 w-5 flex-shrink-0">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User chip */}
      <div className="px-4 py-4 border-t border-gray-700">
        <p className="text-sm font-medium text-white truncate">
          {user.profile.first_name} {user.profile.last_name}
        </p>
        <p className="text-xs text-gray-400 capitalize mt-0.5">
          {{ admin: 'Администратор', instructor: 'Инструктор', student: 'Студент' }[user.role]}
        </p>
      </div>
    </aside>
  );
}

// ── Inline icon components (avoids external dep) ─────────────────────────────
function HomeIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>;
}
function UsersIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>;
}
function InstructorIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>;
}
function CarIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m0 0h6m-6 0l-2-1m14-4h2a1 1 0 011 1v3a1 1 0 01-1 1h-1m-8-1h6" />
  </svg>;
}
function ClipboardIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>;
}
function CurrencyIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>;
}
function CalendarIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>;
}
