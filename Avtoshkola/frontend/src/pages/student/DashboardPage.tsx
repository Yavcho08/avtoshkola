import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard.api';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { WeatherChip } from '../../components/WeatherChip';
import { useAuth } from '../../hooks/useAuth';
import { LessonWithRelations } from '../../types';

type Stats = Awaited<ReturnType<typeof dashboardApi.student>>;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
}
function fmt(n: number) {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(n);
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ label, current, required, color = 'from-blue-500 to-cyan-400' }:
  { label: string; current: number; required: number; color?: string }) {
  const pct = required > 0 ? Math.min(100, Math.round((current / required) * 100)) : 0;
  const done = pct >= 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{current} / {required} ч.</span>
          {done && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
              ✓ Завършено
            </span>
          )}
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${done ? 'from-green-400 to-emerald-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-right text-xs text-gray-400 mt-1">{pct}%</p>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, icon, bg, textColor }:
  { value: string; label: string; icon: React.ReactNode; bg: string; textColor: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyCard({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 text-gray-300">
        {icon}
      </div>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi.student().then(setStats).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  const theoryPct = stats && stats.requiredTheoryHours > 0
    ? Math.min(100, Math.round((stats.completedTheoryHours / stats.requiredTheoryHours) * 100))
    : 0;
  const practicePct = stats && stats.requiredPracticeHours > 0
    ? Math.min(100, Math.round((stats.completedPracticeHours / stats.requiredPracticeHours) * 100))
    : 0;
  const overallPct = Math.round((theoryPct + practicePct) / 2);

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Welcome banner ──────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-lg shadow-blue-600/20">
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -right-4 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-1/3 w-16 h-16 bg-white/5 rounded-full" />

        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Добре дошъл обратно,</p>
            <h2 className="text-2xl font-bold">{user?.profile.first_name} {user?.profile.last_name}</h2>
            <p className="text-blue-200 text-sm mt-2">
              Ти си на <span className="text-white font-bold">{overallPct}%</span> от общото си обучение
            </p>
          </div>
          <div className="flex flex-col items-center bg-white/10 rounded-2xl px-6 py-4 backdrop-blur-sm border border-white/10">
            <div className="text-3xl font-extrabold">{overallPct}%</div>
            <div className="text-blue-200 text-xs mt-1">Завършено</div>
            <div className="w-20 h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          value={String(stats?.examsPassed ?? 0)}
          label="Издържани изпити"
          bg="bg-green-50"
          textColor="text-green-600"
          icon={<svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          value={String(stats?.examsFailed ?? 0)}
          label="Неиздържани изпити"
          bg="bg-red-50"
          textColor="text-red-500"
          icon={<svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          value={fmt(stats?.totalPaid ?? 0)}
          label="Платено"
          bg="bg-blue-50"
          textColor="text-blue-600"
          icon={<svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
        />
        <StatCard
          value={fmt(stats?.totalOwed ?? 0)}
          label="Оставащо"
          bg="bg-orange-50"
          textColor="text-orange-600"
          icon={<svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* ── Progress ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Напредък по обучение</h2>
          <Link to="/student/schedule" className="text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors">
            Виж график →
          </Link>
        </div>
        <div className="space-y-5">
          <ProgressBar
            label="Теория"
            current={stats?.completedTheoryHours ?? 0}
            required={stats?.requiredTheoryHours ?? 30}
            color="from-violet-500 to-purple-400"
          />
          <ProgressBar
            label="Практика"
            current={stats?.completedPracticeHours ?? 0}
            required={stats?.requiredPracticeHours ?? 40}
            color="from-blue-500 to-cyan-400"
          />
        </div>
      </div>

      {/* ── Upcoming ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Lessons */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Предстоящи занятия</h2>
            <Link to="/student/schedule" className="text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors">
              Всички →
            </Link>
          </div>

          {!stats?.nextLessons?.length ? (
            <EmptyCard
              icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              text="Няма насрочени занятия"
            />
          ) : (
            <div className="space-y-2">
              {(stats.nextLessons as LessonWithRelations[]).map(l => (
                <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all duration-150">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold text-xs leading-none">{fmtDate(l.start_time)}</span>
                    <span className="text-blue-500 text-[10px] leading-none mt-0.5">{fmtTime(l.start_time)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {l.instructors?.profiles?.first_name} {l.instructors?.profiles?.last_name}
                    </p>
                    {l.vehicles && (
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{l.vehicles.registration_number}</p>
                    )}
                  </div>
                  {l.type === 'practice' && <WeatherChip startTime={l.start_time} />}
                  <Badge label={l.type} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exams */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Предстоящи изпити</h2>
          </div>

          {!stats?.nextExams?.length ? (
            <EmptyCard
              icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
              text="Няма насрочени изпити"
            />
          ) : (
            <div className="space-y-2">
              {(stats.nextExams as Array<{ id: string; type: string; exam_date: string }>).map(ex => (
                <div key={ex.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-violet-50 border border-transparent hover:border-violet-100 transition-all duration-150">
                  <div className="h-10 w-10 rounded-xl bg-violet-100 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-violet-700 font-bold text-xs leading-none">{fmtDate(ex.exam_date)}</span>
                    <span className="text-violet-500 text-[10px] leading-none mt-0.5">{fmtTime(ex.exam_date)}</span>
                  </div>
                  <div className="flex-1">
                    <Badge label={ex.type} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
