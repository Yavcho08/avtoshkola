import { useEffect, useState, FormEvent, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { bg } from 'date-fns/locale/bg';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { lessonsApi } from '../../api/lessons.api';
import { studentsApi } from '../../api/students.api';
import { vehiclesApi } from '../../api/vehicles.api';
import { LessonWithRelations, StudentWithProfile, VehicleWithCategory, StudentProgressSummary } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { extractErrorMessage } from '../../api/client';

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
  return new Date(iso).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  scheduled:  { label: 'Насрочено', dot: 'bg-blue-400'  },
  completed:  { label: 'Завършено', dot: 'bg-green-400' },
  cancelled:  { label: 'Отказано',  dot: 'bg-red-400'   },
};

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  theory:   { label: 'Теория',    bg: 'bg-violet-100', text: 'text-violet-700' },
  practice: { label: 'Практика', bg: 'bg-blue-100',   text: 'text-blue-700'   },
};

const selectCls = 'block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

export default function InstructorSchedulePage() {
  const [lessons, setLessons] = useState<LessonWithRelations[]>([]);
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [vehicles, setVehicles] = useState<VehicleWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [notesModal, setNotesModal] = useState<LessonWithRelations | null>(null);
  const [lessonDetailsModal, setLessonDetailsModal] = useState<LessonWithRelations | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [studentProgress, setStudentProgress] = useState<StudentProgressSummary | null>(null);

  const [createForm, setCreateForm] = useState({
    student_id: '', vehicle_id: '', type: 'practice', start_time: '', end_time: '', location: '',
  });
  const [notesForm, setNotesForm] = useState({ instructor_notes: '', grade: '', status: 'completed' });

  const load = async () => {
    setIsLoading(true);
    try {
      const [lessonsRes, studentsRes, vehiclesRes] = await Promise.all([
        lessonsApi.list({ limit: 500 }), // Load a larger limit for calendar
        studentsApi.list({ limit: 500 }),
        vehiclesApi.list({ limit: 500 }),
      ]);
      setLessons(lessonsRes.data);
      setStudents(studentsRes.data);
      setVehicles(vehiclesRes.data);
      if (studentsRes.data.length > 0 && !createForm.student_id) {
        setCreateForm(f => ({ ...f, student_id: studentsRes.data[0].id }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (createForm.student_id) {
      studentsApi.getProgress(createForm.student_id).then(setStudentProgress).catch(console.error);
    } else {
      setStudentProgress(null);
    }
  }, [createForm.student_id]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      const created = await lessonsApi.create({
        ...createForm,
        instructor_id: '',
        vehicle_id: createForm.vehicle_id || null,
        location: createForm.location || null,
      });
      setLessons(prev => [created, ...prev]);
      setIsCreateOpen(false);
    } catch (err) { setFormError(extractErrorMessage(err)); }
    finally { setIsSaving(false); }
  };

  const handleComplete = async (e: FormEvent) => {
    e.preventDefault();
    if (!notesModal) return;
    setIsSaving(true);
    try {
      const updated = await lessonsApi.update(notesModal.id, {
        status: notesForm.status,
        instructor_notes: notesForm.instructor_notes || undefined,
        grade: notesForm.grade ? Number(notesForm.grade) : null,
      });
      setLessons(prev => prev.map(l => l.id === updated.id ? updated : l));
      setNotesModal(null);
      if (lessonDetailsModal && lessonDetailsModal.id === updated.id) {
        setLessonDetailsModal(updated);
      }
    } finally { setIsSaving(false); }
  };

  const handleCancel = async (id: string) => {
    try {
      await lessonsApi.cancel(id);
      setLessons(prev => prev.map(l => l.id === id ? { ...l, status: 'cancelled' } : l));
      if (lessonDetailsModal && lessonDetailsModal.id === id) {
        setLessonDetailsModal(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }
    } catch { /* noop */ }
  };

  const events: Event[] = useMemo(() => {
    return lessons.map(l => ({
      id: l.id,
      title: `${l.students?.profiles?.first_name} ${l.students?.profiles?.last_name} (${TYPE_CONFIG[l.type]?.label})`,
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Моят График</h2>
          <p className="text-sm text-gray-500 mt-0.5">Управление на всички занятия</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 shadow-lg shadow-blue-600/25"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Ново занятие
          </button>
        </div>
      </div>

      {/* Calendar */}
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
                <p className="text-xs text-gray-500 font-semibold uppercase">Студент</p>
                <p className="font-medium">{lessonDetailsModal.students?.profiles?.first_name} {lessonDetailsModal.students?.profiles?.last_name}</p>
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
              {lessonDetailsModal.location && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Място</p>
                  <p className="font-medium">{lessonDetailsModal.location}</p>
                </div>
              )}
              {lessonDetailsModal.vehicles && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Автомобил</p>
                  <p className="font-medium">{lessonDetailsModal.vehicles.make} {lessonDetailsModal.vehicles.model} ({lessonDetailsModal.vehicles.registration_number})</p>
                </div>
              )}
            </div>

            {lessonDetailsModal.instructor_notes && (
              <div className="bg-gray-50 p-3 rounded-lg mt-2">
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Бележки</p>
                <p className="text-sm">{lessonDetailsModal.instructor_notes}</p>
              </div>
            )}
            
            {lessonDetailsModal.grade && (
              <div className="bg-primary-50 p-3 rounded-lg mt-2">
                <p className="text-xs text-primary-600 font-semibold uppercase mb-1">Оценка</p>
                <p className="text-lg font-bold text-primary-700">{lessonDetailsModal.grade}</p>
              </div>
            )}

            {lessonDetailsModal.status === 'scheduled' && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={() => handleCancel(lessonDetailsModal.id)}>Откажи</Button>
                <Button onClick={() => { 
                  setNotesModal(lessonDetailsModal); 
                  setNotesForm({ instructor_notes: lessonDetailsModal.instructor_notes ?? '', grade: '', status: 'completed' }); 
                }}>Завърши</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Ново занятие">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{formError}</p>}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Студент</label>
            <select value={createForm.student_id} onChange={e => setCreateForm(f => ({ ...f, student_id: e.target.value }))} className={selectCls}>
              {students.map(s => <option key={s.id} value={s.id}>{s.profiles.first_name} {s.profiles.last_name} ({s.egn})</option>)}
            </select>
            
            {studentProgress && (
              <div className="mt-2 bg-blue-50 text-blue-800 p-3 rounded-xl text-sm space-y-1 border border-blue-100">
                <div className="flex justify-between">
                  <span>Теория: {studentProgress.completedTheoryHours} / {studentProgress.requiredTheoryHours} ч.</span>
                  <span className="font-semibold">Остават: {Math.max(0, studentProgress.requiredTheoryHours - studentProgress.completedTheoryHours)} ч.</span>
                </div>
                <div className="flex justify-between">
                  <span>Практика: {studentProgress.completedPracticeHours} / {studentProgress.requiredPracticeHours} ч.</span>
                  <span className="font-semibold">Остават: {Math.max(0, studentProgress.requiredPracticeHours - studentProgress.completedPracticeHours)} ч.</span>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">МПС (незадължително)</label>
            <select value={createForm.vehicle_id} onChange={e => setCreateForm(f => ({ ...f, vehicle_id: e.target.value }))} className={selectCls}>
              <option value="">-- Без МПС --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} – {v.make} {v.model}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Тип</label>
            <select value={createForm.type} onChange={e => setCreateForm(f => ({ ...f, type: e.target.value }))} className={selectCls}>
              <option value="theory">Теория</option>
              <option value="practice">Практика</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Начало" type="datetime-local" value={createForm.start_time} onChange={e => setCreateForm(f => ({ ...f, start_time: e.target.value }))} required />
            <Input label="Край"   type="datetime-local" value={createForm.end_time}   onChange={e => setCreateForm(f => ({ ...f, end_time:   e.target.value }))} required />
          </div>
          <Input label="Място за среща (незадължително)" type="text" value={createForm.location} onChange={e => setCreateForm(f => ({ ...f, location: e.target.value }))} placeholder="напр. пред КАТ, бул. България 1..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>Отказ</Button>
            <Button type="submit" isLoading={isSaving}>Запиши</Button>
          </div>
        </form>
      </Modal>

      {/* Complete / notes modal */}
      <Modal isOpen={!!notesModal} onClose={() => setNotesModal(null)} title="Завършване на занятие" size="sm">
        <form onSubmit={handleComplete} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Резултат</label>
            <select value={notesForm.status} onChange={e => setNotesForm(f => ({ ...f, status: e.target.value }))} className={selectCls}>
              <option value="completed">Завършено</option>
              <option value="cancelled">Отказано</option>
            </select>
          </div>
          <Input label="Оценка (2–6)" type="number" min="2" max="6" value={notesForm.grade} onChange={e => setNotesForm(f => ({ ...f, grade: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Бележки</label>
            <textarea
              value={notesForm.instructor_notes}
              onChange={e => setNotesForm(f => ({ ...f, instructor_notes: e.target.value }))}
              rows={3}
              className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setNotesModal(null)}>Отказ</Button>
            <Button type="submit" isLoading={isSaving}>Запази</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
