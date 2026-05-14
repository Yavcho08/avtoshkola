import { useEffect, useState } from 'react';
import { lessonsApi } from '../../api/lessons.api';
import { LessonWithRelations } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' });
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

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['upcoming', 'past'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'upcoming' ? 'Предстоящи' : 'Минали'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div>
      ) : lessons.length === 0 ? (
        <EmptyState title={tab === 'upcoming' ? 'Няма насрочени занятия' : 'Няма завършени занятия'} />
      ) : (
        <div className="space-y-3">
          {lessons.map(l => (
            <div key={l.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge label={l.type} />
                    <Badge label={l.status} />
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    Инструктор: {l.instructors?.profiles?.first_name} {l.instructors?.profiles?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {fmtDateTime(l.start_time)} — {new Date(l.end_time).toLocaleTimeString('bg-BG', { timeStyle: 'short' })}
                  </p>
                  {l.vehicles && (
                    <p className="text-sm text-gray-500">МПС: <span className="font-mono">{l.vehicles.registration_number}</span></p>
                  )}
                </div>
                {l.grade != null && (
                  <div className="flex-shrink-0 text-center">
                    <p className="text-3xl font-bold text-primary-600">{l.grade}</p>
                    <p className="text-xs text-gray-400">оценка</p>
                  </div>
                )}
              </div>
              {l.instructor_notes && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-400 mb-1">БЕЛЕЖКИ</p>
                  <p className="text-sm text-gray-700">{l.instructor_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
