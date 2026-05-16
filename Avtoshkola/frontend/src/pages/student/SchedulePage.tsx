import { useEffect, useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { bg } from 'date-fns/locale/bg';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { lessonsApi } from '../../api/lessons.api';
import { LessonWithRelations } from '../../types';
import { Spinner } from '../../components/common/Spinner';
import { Modal } from '../../components/common/Modal';

const locales = {
  'bg-BG': bg,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

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

export default function StudentSchedulePage() {
  const [lessons, setLessons] = useState<LessonWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lessonDetailsModal, setLessonDetailsModal] = useState<LessonWithRelations | null>(null);

  useEffect(() => {
    setIsLoading(true);
    // Fetch all lessons for calendar view
    lessonsApi.list({ limit: 500 }).then(res => setLessons(res.data)).finally(() => setIsLoading(false));
  }, []);

  const events: Event[] = useMemo(() => {
    return lessons.map(l => ({
      id: l.id,
      title: `${TYPE_CONFIG[l.type]?.label} с ${l.instructors?.profiles?.first_name} ${l.instructors?.profiles?.last_name}`,
      start: new Date(l.start_time),
      end: new Date(l.end_time),
      resource: l,
    }));
  }, [lessons]);

  const eventPropGetter = (event: Event) => {
    const l = event.resource as LessonWithRelations;
    let backgroundColor = '#3b82f6'; // default practice
    if (l.type === 'theory') backgroundColor = '#8b5cf6'; // theory
    if (l.status === 'cancelled') backgroundColor = '#f87171'; // cancelled
    if (l.status === 'completed') backgroundColor = '#34d399'; // completed

    return { style: { backgroundColor, borderRadius: '4px', border: 'none', display: 'block' } };
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Моят График</h2>
          <p className="text-sm text-gray-500 mt-0.5">Всички твои занятия на едно място</p>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5" style={{ height: '700px' }}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center"><Spinner className="h-7 w-7 text-primary-600" /></div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            culture="bg-BG"
            messages={{
              next: "Напред",
              previous: "Назад",
              today: "Днес",
              month: "Месец",
              week: "Седмица",
              day: "Ден",
              agenda: "Програма",
              date: "Дата",
              time: "Час",
              event: "Занятие",
              noEventsInRange: "Няма занятия в този период."
            }}
            eventPropGetter={eventPropGetter}
            onSelectEvent={(e) => setLessonDetailsModal(e.resource as LessonWithRelations)}
          />
        )}
      </div>

      {/* Lesson Details Modal */}
      <Modal isOpen={!!lessonDetailsModal} onClose={() => setLessonDetailsModal(null)} title="Детайли за занятие" size="md">
        {lessonDetailsModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Инструктор</p>
                <p className="font-medium">{lessonDetailsModal.instructors?.profiles?.first_name} {lessonDetailsModal.instructors?.profiles?.last_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Тип</p>
                <p className="font-medium">{TYPE_CONFIG[lessonDetailsModal.type]?.label}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Статус</p>
                <p className="font-medium flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[lessonDetailsModal.status]?.dot}`} />
                  {STATUS_CONFIG[lessonDetailsModal.status]?.label}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Време</p>
                <p className="font-medium">{fmtDate(lessonDetailsModal.start_time)}, {fmtTime(lessonDetailsModal.start_time)} - {fmtTime(lessonDetailsModal.end_time)}</p>
              </div>
              {lessonDetailsModal.vehicles && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Автомобил</p>
                  <p className="font-medium">{lessonDetailsModal.vehicles.make} {lessonDetailsModal.vehicles.model} ({lessonDetailsModal.vehicles.registration_number})</p>
                </div>
              )}
            </div>

            {lessonDetailsModal.instructor_notes && (
              <div className="bg-gray-50 p-3 rounded-lg mt-2">
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Бележки от инструктора</p>
                <p className="text-sm">{lessonDetailsModal.instructor_notes}</p>
              </div>
            )}
            
            {lessonDetailsModal.grade != null && (
              <div className="bg-primary-50 p-3 rounded-lg mt-2 flex flex-col items-center">
                <p className="text-xs text-primary-600 font-semibold uppercase mb-1">Оценка</p>
                <p className="text-3xl font-bold text-primary-700">{lessonDetailsModal.grade}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
