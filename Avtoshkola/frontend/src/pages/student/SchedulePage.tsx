import { useEffect, useState } from 'react';
import { lessonsApi } from '../../api/lessons.api';
import { LessonWithRelations } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', weekday: 'short' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  scheduled:  { label: 'Насрочено', dot: 'bg-blue-400' },
  completed:  { label: 'Завършено', dot: 'bg-green-400' },
  cancelled:  { label: 'Отказано',  dot: 'bg-red-400'  },
};

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  theory:   { label: 'Теория',    bg: 'bg-violet-100', text: 'text-violet-700' },
  practice: { label: 'Практика', bg: 'bg-blue-100',   text: 'text-blue-700'   },
};

function EmptyLesson({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-gray-500 font-medium">{label}</p>
      <p className="text-gray-400 text-sm mt-1">Занятията ще се появят тук след насрочване</p>
    </div>
  );
}

export default function StudentSchedulePage() {
  const [lessons, setLessons] = useState<LessonWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    const now = new Date().toISOString();
    const params = tab === 'upcoming'
      ? { status: 'scheduled', from: now, limit: 50 }
      : { status: 'completed', limit: 50 };
    setIsLoading(true);
    lessonsApi.list(params).then(res => setLessons(res.data)).finally(() => setIsLoading(false));
  }, [tab]);

  const tabs: { key: 'upcoming' | 'past'; label: string; icon: string }[] = [
    { key: 'upcoming', label: 'Предстоящи', icon: '📅' },
    { key: 'past',     label: 'Минали',     icon: '✓'  },
  ];

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Моят График</h2>
          <p className="text-sm text-gray-500 mt-0.5">Всички твои занятия на едно място</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                ${tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner className="h-7 w-7 text-primary-600" /></div>
      ) : lessons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyLesson label={tab === 'upcoming' ? 'Няма насрочени занятия' : 'Няма завършени занятия'} />
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map(l => {
            const typeConf = TYPE_CONFIG[l.type] ?? { label: l.type, bg: 'bg-gray-100', text: 'text-gray-600' };
            const statusConf = STATUS_CONFIG[l.status] ?? { label: l.status, dot: 'bg-gray-400' };
            const duration = Math.round((new Date(l.end_time).getTime() - new Date(l.start_time).getTime()) / 60000);

            return (
              <div key={l.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start gap-4">
                  {/* Date box */}
                  <div className={`h-14 w-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${typeConf.bg}`}>
                    <span className={`text-xs font-bold uppercase ${typeConf.text}`}>
                      {new Date(l.start_time).toLocaleDateString('bg-BG', { month: 'short' })}
                    </span>
                    <span className={`text-xl font-extrabold leading-none ${typeConf.text}`}>
                      {new Date(l.start_time).getDate()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${typeConf.bg} ${typeConf.text}`}>
                        {typeConf.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                        {statusConf.label}
                      </span>
                    </div>

                    <p className="font-semibold text-gray-900 truncate">
                      {l.instructors?.profiles?.first_name} {l.instructors?.profiles?.last_name}
                    </p>

                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>{fmtDate(l.start_time)}</span>
                      <span className="text-gray-300">·</span>
                      <span>{fmtTime(l.start_time)} – {fmtTime(l.end_time)}</span>
                      <span className="text-gray-300">·</span>
                      <span>{duration} мин.</span>
                    </div>

                    {l.vehicles && (
                      <p className="text-xs font-mono text-gray-400 mt-1">{l.vehicles.registration_number}</p>
                    )}
                  </div>

                  {/* Grade */}
                  {l.grade != null && (
                    <div className="flex-shrink-0 text-center bg-primary-50 border border-primary-100 rounded-xl px-4 py-2">
                      <p className="text-3xl font-extrabold text-primary-600">{l.grade}</p>
                      <p className="text-[10px] text-primary-400 font-medium">ОЦЕНКА</p>
                    </div>
                  )}
                </div>

                {l.instructor_notes && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Бележки от инструктора</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">{l.instructor_notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
