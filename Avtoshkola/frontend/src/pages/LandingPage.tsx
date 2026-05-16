import { useState, MouseEvent, ReactNode } from 'react';
import { Link, LinkProps, useNavigate } from 'react-router-dom';

// ── Ripple util — direct DOM, no React state, guaranteed visible ──────────────
function spawnRipple(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const size = 18;
  const dot = document.createElement('span');
  Object.assign(dot.style, {
    position: 'absolute',
    borderRadius: '50%',
    width: `${size}px`,
    height: `${size}px`,
    left: `${e.clientX - rect.left - size / 2}px`,
    top: `${e.clientY - rect.top - size / 2}px`,
    background: 'rgba(255, 255, 255, 0.65)',
    pointerEvents: 'none',
    zIndex: '20',
    animation: 'ripple-out 0.75s ease-out forwards',
  });
  el.appendChild(dot);
  setTimeout(() => dot.remove(), 800);
}

// ── RippleLink — delays navigation by 220ms so the ripple is visible ─────────
function RippleLink({ className = '', children, to, ...props }: LinkProps & { children: ReactNode }) {
  const navigate = useNavigate();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    spawnRipple(e as unknown as MouseEvent<HTMLElement>);
    setTimeout(() => navigate(to as string), 220);
  };

  return (
    <Link
      {...props}
      to={to}
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}

// ── RippleButton — button that emits a ripple on click ───────────────────────
function RippleButton({
  className = '',
  children,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={`relative overflow-hidden ${className}`}
      onClick={e => { spawnRipple(e); onClick?.(e); }}
    >
      {children}
    </button>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const features = [
  {
    role: 'Курсисти',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
    color: 'from-blue-500 to-cyan-400',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/20',
    items: [
      'Преглед на учебния график и предстоящи уроци',
      'Проследяване на напредъка в обучението',
      'Резултати от изпити (теория и практика)',
      'История на плащанията и финансово състояние',
      'Информация за записани часове',
    ],
  },
  {
    role: 'Инструктори',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: 'from-violet-500 to-purple-400',
    border: 'border-violet-500/30',
    glow: 'shadow-violet-500/20',
    items: [
      'Личен учебен календар с всички уроци',
      'Списък с курсисти и техния напредък',
      'Управление на часовете (теория / практика)',
      'Статус на приключени и предстоящи занятия',
    ],
  },
  {
    role: 'Администратори',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m0 0h6m-6 0l-2-1m14-4h2a1 1 0 011 1v3a1 1 0 01-1 1h-1m-8-1h6" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-400',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
    items: [
      'Пълно управление на курсисти и инструктори',
      'Контрол на автомобилния парк',
      'Планиране и проследяване на изпити',
      'Финансово табло — приходи, плащания, разходи',
      'Статистики и ключови показатели (KPI)',
    ],
  },
];

const stats = [
  { value: '3',    label: 'Роли в системата' },
  { value: '100%', label: 'Дигитален процес' },
  { value: '24/7', label: 'Достъп онлайн' },
  { value: '∞',   label: 'Данни в реално време' },
];

const benefits = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Прозрачност',
    desc: 'Всеки вижда точно своите данни — без объркване и излишна комуникация.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Бързина',
    desc: 'Моментален достъп до графика, резултатите и историята на плащанията.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Сигурност',
    desc: 'Ролево базиран достъп — всеки потребител вижда само своята информация.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Аналитика',
    desc: 'Администраторите разполагат с детайлни справки и финансово табло.',
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  const handleScrollToFeatures = (e: MouseEvent<HTMLButtonElement>) => {
    spawnRipple(e);
    setScrolled(true);
    setTimeout(() => setScrolled(false), 400);
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden select-none">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m0 0h6m-6 0l-2-1m14-4h2a1 1 0 011 1v3a1 1 0 01-1 1h-1m-8-1h6" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight">Автошкола</span>
          </div>

          <RippleLink
            to="/login"
            className="px-5 py-2 rounded-xl bg-blue-600 text-sm font-semibold
                       transition-all duration-100
                       hover:bg-blue-500 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/40
                       active:scale-95 active:bg-blue-700"
          >
            Вход в системата
          </RippleLink>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-28 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[120px]" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-cyan-600/8 rounded-full blur-[100px]" />
        </div>

        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Информационна система за управление
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            Вашето{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
              обучение
            </span>
            ,<br />
            изцяло дигитално
          </h1>

          <p className="text-gray-400 text-xl leading-relaxed max-w-2xl mx-auto mb-12">
            Модерна платформа за автошколи — курсисти проследяват напредъка си,
            инструктори управляват графика, администраторите контролират всичко от едно място.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Primary CTA */}
            <RippleLink
              to="/login"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg
                         bg-gradient-to-r from-blue-600 to-cyan-500
                         shadow-2xl shadow-blue-600/30
                         transition-all duration-100
                         hover:scale-105 hover:shadow-blue-500/50
                         active:scale-95 active:brightness-90"
            >
              Влез в системата
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </RippleLink>

            {/* Scroll button */}
            <RippleButton
              onClick={handleScrollToFeatures}
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 bg-white/5
                         font-semibold text-lg cursor-pointer
                         transition-all duration-100
                         hover:bg-white/10 hover:scale-105 hover:border-white/20
                         active:scale-95 active:bg-white/15
                         ${scrolled ? 'scale-95 bg-white/15' : ''}`}
            >
              Разгледай функциите
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${scrolled ? 'translate-y-1' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </RippleButton>
          </div>
        </div>

        <div className="relative max-w-3xl mx-auto mt-20">
          <div className="rounded-3xl border border-white/8 bg-gradient-to-b from-white/5 to-transparent p-8 backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Активни курсисти', value: '48',  icon: '👤' },
                { label: 'Уроци тази седмица', value: '127', icon: '📅' },
                { label: 'Успешни изпити',    value: '94%', icon: '🏆' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-2xl p-5 text-center border border-white/5">
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-gray-500 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.02] py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Какво предлага системата?
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Три различни роли, всяка с персонализиран достъп до точно нужната информация.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div
                key={f.role}
                className={`relative rounded-3xl border ${f.border} bg-white/[0.03] p-8
                            hover:bg-white/[0.06] transition-all duration-300 group overflow-hidden`}
              >
                <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100
                                 transition-opacity duration-500 bg-gradient-to-br ${f.color}
                                 blur-3xl -z-10 scale-75`} />
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl
                                 bg-gradient-to-br ${f.color} mb-6 shadow-xl ${f.glow}`}>
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold mb-5">{f.role}</h3>
                <ul className="space-y-3">
                  {f.items.map(item => (
                    <li key={item} className="flex items-start gap-3 text-gray-400 text-sm leading-relaxed">
                      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"
                           stroke="currentColor" strokeWidth={2.5} style={{ color: 'rgb(99 179 237)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ───────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Защо да изберете нас?
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Разработена специално за нуждите на съвременната автошкола.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map(b => (
              <div
                key={b.title}
                className="p-6 rounded-2xl border border-white/8 bg-white/[0.03]
                           hover:border-blue-500/30 hover:bg-white/[0.06]
                           transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500
                                flex items-center justify-center mb-4
                                shadow-lg shadow-blue-600/20
                                group-hover:scale-110 transition-transform duration-300">
                  {b.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{b.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-[700px] h-[400px] bg-blue-600/15 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Готови сте да започнете?
          </h2>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed">
            Влезте в системата с вашите данни и получете незабавен достъп
            до вашия персонализиран панел.
          </p>
          <RippleLink
            to="/login"
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-xl
                       bg-gradient-to-r from-blue-600 to-cyan-500
                       shadow-2xl shadow-blue-600/40
                       transition-all duration-100
                       hover:scale-105 hover:shadow-blue-500/60
                       active:scale-95 active:brightness-90"
          >
            Влез в системата
            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-150"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </RippleLink>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m0 0h6m-6 0l-2-1m14-4h2a1 1 0 011 1v3a1 1 0 01-1 1h-1m-8-1h6" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-400">Автошкола — Информационна система</span>
          </div>
          <p className="text-gray-600 text-sm">© {new Date().getFullYear()} Всички права запазени.</p>
        </div>
      </footer>
    </div>
  );
}
