import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

interface NavItem { to: string; label: string; icon: JSX.Element }

const adminNav: NavItem[] = [
  { to: '/admin',             label: 'Табло',             icon: <HomeIcon /> },
  { to: '/admin/students',    label: 'Курсисти',          icon: <UsersIcon /> },
  { to: '/admin/instructors', label: 'Инструктори',       icon: <InstructorIcon /> },
  { to: '/admin/vehicles',    label: 'Превозни средства', icon: <CarIcon /> },
  { to: '/admin/exams',       label: 'Изпити',            icon: <ClipboardIcon /> },
  { to: '/admin/finances',    label: 'Финанси',           icon: <CurrencyIcon /> },
  { to: '/admin/emails',      label: 'Имейли',            icon: <EmailIcon /> },
  { to: '/admin/map',         label: 'Карта на местата',  icon: <MapIcon /> },
];

const instructorNav: NavItem[] = [
  { to: '/instructor',          label: 'Табло',       icon: <HomeIcon /> },
  { to: '/instructor/schedule', label: 'График',      icon: <CalendarIcon /> },
  { to: '/instructor/chat',     label: 'Съобщения',   icon: <ChatIcon /> },
  { to: '/instructor/map',      label: 'Карта',       icon: <MapIcon /> },
];

const studentNav: NavItem[] = [
  { to: '/student',          label: 'Табло',       icon: <HomeIcon /> },
  { to: '/student/schedule', label: 'График',      icon: <CalendarIcon /> },
  { to: '/student/payments', label: 'Плащания',    icon: <CurrencyIcon /> },
  { to: '/student/chat',     label: 'Съобщения',   icon: <ChatIcon /> },
  { to: '/student/ai',       label: 'AI Асистент', icon: <AiIcon /> },
  { to: '/student/exam',     label: 'Симулация',   icon: <ExamIcon /> },
  { to: '/student/map',      label: 'Карта',       icon: <MapIcon /> },
  { to: '/student/referral', label: 'Покани приятел', icon: <GiftIcon /> },
];

const navByRole: Record<UserRole, NavItem[]> = {
  admin: adminNav,
  instructor: instructorNav,
  student: studentNav,
};

const roleLabel: Record<UserRole, string> = {
  admin: 'Администратор',
  instructor: 'Инструктор',
  student: 'Курсист',
};

const roleBadgeColor: Record<UserRole, string> = {
  admin: 'bg-amber-500/20 text-amber-300',
  instructor: 'bg-violet-500/20 text-violet-300',
  student: 'bg-blue-500/20 text-blue-300',
};

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const letters = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return <>{letters.toUpperCase()}</>;
}

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;
  const items = navByRole[user.role];
  const fullName = `${user.profile.first_name} ${user.profile.last_name}`;

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-950 flex flex-col min-h-screen border-r border-white/5">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m0 0h6m-6 0l-2-1m14-4h2a1 1 0 011 1v3a1 1 0 01-1 1h-1m-8-1h6" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">Автошкола</p>
            <p className="text-gray-500 text-xs mt-0.5">Информационна система</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin' || item.to === '/instructor' || item.to === '/student'}
            className={({ isActive }) => [
              'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:bg-white/5 hover:text-white',
            ].join(' ')}
          >
            {({ isActive }) => (
              <>
                <span className={`h-5 w-5 flex-shrink-0 transition-transform duration-150 ${!isActive ? 'group-hover:scale-110' : ''}`}>
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* avtoizpit.com link — only for students */}
      {user.role === 'student' && (
        <div className="px-3 pb-2">
          <a
            href="https://avtoizpit.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 transition-all duration-150 group"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-blue-300 leading-tight">Тест по теория</p>
              <p className="text-[10px] text-blue-400/70 leading-tight">avtoizpit.com</p>
            </div>
            <svg className="w-3 h-3 text-blue-400/50 group-hover:text-blue-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* User chip */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-white/5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg">
            <Initials name={fullName} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{fullName}</p>
            <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md mt-0.5 ${roleBadgeColor[user.role]}`}>
              {roleLabel[user.role]}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function HomeIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function UsersIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}
function InstructorIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
function CarIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m0 0h6m-6 0l-2-1m14-4h2a1 1 0 011 1v3a1 1 0 01-1 1h-1m-8-1h6" /></svg>;
}
function ClipboardIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
}
function CurrencyIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function CalendarIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function EmailIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function ChatIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
}
function AiIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>;
}
function ExamIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>;
}
function MapIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>;
}
function GiftIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
}
