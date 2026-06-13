import { useEffect, useState, useMemo, FormEvent } from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { bg } from 'date-fns/locale/bg';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { lessonsApi } from '../../api/lessons.api';
import { instructorsApi } from '../../api/instructors.api';
import { LessonWithRelations, InstructorWithProfile } from '../../types';
import { Spinner } from '../../components/common/Spinner';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { extractErrorMessage } from '../../api/client';

const locales = { 'bg-BG': bg };

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
  scheduled: { label: 'Насрочено', dot: 'bg-blue-400'  },
  completed: { label: 'Завършено', dot: 'bg-green-400' },
  cancelled: { label: 'Отказано',  dot: 'bg-red-400'   },
};

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  theory:   { label: 'Теория',    bg: 'bg-violet-100', text: 'text-violet-700' },
  practice: { label: 'Практика', bg: 'bg-blue-100',   text: 'text-blue-700'   },
};

const selectCls = 'block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

export default function StudentSchedulePage() {
  const [lessons, setLessons]         = useState<LessonWithRelations[]>([]);
  const [instructors, setInstructors] = useState<InstructorWithProfile[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [isBookOpen, setIsBookOpen]   = useState(false);
  const [detailsModal, setDetailsModal] = useState<LessonWithRelations | null>(null);
  const [formError, setFormError]     = useState('');
  const [isSaving, setIsSaving]       = useState(false);

  const [form, setForm] = useState({
    instructor_id: '',
    type:          'practice',
    start_time:    '',
    end_time:      '',
    location:      '',
  });

  const load = async () => {
    setIsLoading(true);
    // Занятията и инструкторите се зареждат независимо — провал на едното
    // не бива да изпразва календара.
    try {
      const lessonsRes = await lessonsApi.list({ limit: 500 });
      setLessons(lessonsRes.data);
    } catch { /* при грешка календарът остава празен, но без да блокира */ }

    try {
      const instructorsRes = await instructorsApi.list({ limit: 100, is_active: true });
      setInstructors(instructorsRes.data);
      if (instructorsRes.data.length > 0) {
        setForm(f => ({ ...f, instructor_id: instructorsRes.data[0].id }));
      }
    } catch { /* списъкът за заявка може да липсва, но графикът пак се вижда */ }

    setIsLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const handleBook = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      const created = await lessonsApi.create({
        instructor_id: form.instructor_id,
        type:          form.type,
        start_time:    form.start_time,
        end_time:      form.end_time,
        location:      form.location || null,
      });
      setLessons(prev => [created, ...prev]);
      setIsBookOpen(false);
      setForm(f => ({ ...f, start_time: '', end_time: '', location: '' }));
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const events: Event[] = useMemo(() => lessons.map(l => ({
    id:       l.id,
    title:    `${TYPE_CONFIG[l.type]?.label} с ${l.instructors?.profiles?.first_name} ${l.instructors?.profiles?.last_name}`,
    start:    new Date(l.start_time),
    end:      new Date(l.end_time),
    resource: l,
  })), [lessons]);

  const eventPropGetter = (event: Event) => {
    const l = event.resource as LessonWithRelations;
    const bg =
      l.status === 'cancelled' ? '#f87171' :
      l.status === 'completed' ? '#34d399' :
      l.type   === 'theory'    ? '#8b5cf6' : '#3b82f6';
    return { style: { backgroundColor: bg, borderRadius: '4px', border: 'none', display: 'block' } };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Моят График</h2>
          <p className="text-sm text-gray-500 mt-0.5">Всички твои занятия на едно място</p>
        </div>
        <button
          onClick={() => setIsBookOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 active:scale-95 transition-all duration-150 shadow-lg shadow-primary-600/25"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Заяви урок
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5" style={{ height: '700px' }}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="h-7 w-7 text-primary-600" />
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            culture="bg-BG"
            messages={{
              next: 'Напред', previous: 'Назад', today: 'Днес',
              month: 'Месец', week: 'Седмица', day: 'Ден',
              agenda: 'Програма', date: 'Дата', time: 'Час',
              event: 'Занятие', noEventsInRange: 'Няма занятия в този период.',
            }}
            eventPropGetter={eventPropGetter}
            onSelectEvent={e => setDetailsModal(e.resource as LessonWithRelations)}
          />
        )}
      </div>

      {/* Lesson details modal */}
      <Modal isOpen={!!detailsModal} onClose={() => setDetailsModal(null)} title="Детайли за занятие" size="md">
        {detailsModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Инструктор</p>
                <p className="font-medium">
                  {detailsModal.instructors?.profiles?.first_name} {detailsModal.instructors?.profiles?.last_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Тип</p>
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-lg ${TYPE_CONFIG[detailsModal.type]?.bg} ${TYPE_CONFIG[detailsModal.type]?.text}`}>
                  {TYPE_CONFIG[detailsModal.type]?.label}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Статус</p>
                <p className="font-medium flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[detailsModal.status]?.dot}`} />
                  {STATUS_CONFIG[detailsModal.status]?.label}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Час</p>
                <p className="font-medium">{fmtDate(detailsModal.start_time)}</p>
                <p className="text-sm text-gray-500">{fmtTime(detailsModal.start_time)} – {fmtTime(detailsModal.end_time)}</p>
              </div>
              {detailsModal.location && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Място</p>
                  <p className="font-medium">{detailsModal.location}</p>
                </div>
              )}
              {detailsModal.vehicles && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Автомобил</p>
                  <p className="font-medium">
                    {detailsModal.vehicles.make} {detailsModal.vehicles.model} ({detailsModal.vehicles.registration_number})
                  </p>
                </div>
              )}
            </div>

            {detailsModal.instructor_notes && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Бележки от инструктора</p>
                <p className="text-sm">{detailsModal.instructor_notes}</p>
              </div>
            )}

            {detailsModal.grade != null && (
              <div className="bg-primary-50 p-3 rounded-lg flex flex-col items-center">
                <p className="text-xs text-primary-600 font-semibold uppercase mb-1">Оценка</p>
                <p className="text-3xl font-bold text-primary-700">{detailsModal.grade}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Book lesson modal */}
      <Modal isOpen={isBookOpen} onClose={() => { setIsBookOpen(false); setFormError(''); }} title="Заяви урок">
        <form onSubmit={handleBook} className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{formError}</p>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Инструктор</label>
            <select
              value={form.instructor_id}
              onChange={e => setForm(f => ({ ...f, instructor_id: e.target.value }))}
              className={selectCls}
              required
            >
              <option value="">— Избери инструктор —</option>
              {instructors.map(i => (
                <option key={i.id} value={i.id}>
                  {i.profiles.first_name} {i.profiles.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Тип</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className={selectCls}
            >
              <option value="practice">Практика</option>
              <option value="theory">Теория</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Начало"
              type="datetime-local"
              value={form.start_time}
              onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
              required
            />
            <Input
              label="Край"
              type="datetime-local"
              value={form.end_time}
              onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
              required
            />
          </div>

          <Input
            label="Място за среща (незадължително)"
            type="text"
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="напр. пред КАТ, бул. България 1..."
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setIsBookOpen(false); setFormError(''); }}>
              Отказ
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Запиши урок
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
