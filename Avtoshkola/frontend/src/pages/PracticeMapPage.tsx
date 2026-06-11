import { useEffect, useMemo, useState, FormEvent } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { locationsApi, PracticeLocation, LocationType, NewLocation } from '../api/locations.api';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/common/Spinner';
import { extractErrorMessage } from '../api/client';

// Център по подразбиране — София
const DEFAULT_CENTER: [number, number] = [42.6977, 23.3219];

const TYPE_META: Record<LocationType, { label: string; emoji: string; color: string }> = {
  maneuvers:    { label: 'Маневри',     emoji: '🚗', color: '#2563eb' },
  intersection: { label: 'Кръстовище',  emoji: '🚦', color: '#dc2626' },
  parking:      { label: 'Паркиране',   emoji: '🅿️', color: '#7c3aed' },
  highway:      { label: 'Магистрала',  emoji: '🛣️', color: '#ea580c' },
  other:        { label: 'Друго',       emoji: '📍', color: '#475569' },
};

function makeIcon(type: LocationType): L.DivIcon {
  const { emoji, color } = TYPE_META[type];
  return L.divIcon({
    className: '',
    html: `<div style="
      width:34px;height:34px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;">
      <span style="transform:rotate(45deg);font-size:16px;line-height:1;">${emoji}</span>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}

// Прихваща клик върху картата (само в режим на добавяне)
function ClickHandler({ active, onPick }: { active: boolean; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (active) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const selectCls = 'block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

export default function PracticeMapPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'instructor';

  const [locations, setLocations] = useState<PracticeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState(false);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<LocationType | 'all'>('all');
  const [form, setForm] = useState<{ name: string; description: string; type: LocationType }>({
    name: '', description: '', type: 'maneuvers',
  });

  useEffect(() => {
    locationsApi.list()
      .then(setLocations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const icons = useMemo(() => ({
    maneuvers: makeIcon('maneuvers'),
    intersection: makeIcon('intersection'),
    parking: makeIcon('parking'),
    highway: makeIcon('highway'),
    other: makeIcon('other'),
  }), []);

  const visible = filter === 'all' ? locations : locations.filter(l => l.type === filter);

  const center = locations.length > 0
    ? [locations[0].lat, locations[0].lng] as [number, number]
    : DEFAULT_CENTER;

  const handlePick = (lat: number, lng: number) => {
    setPending({ lat, lng });
    setError('');
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    if (!form.name.trim()) { setError('Въведи име на мястото.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload: NewLocation = { ...form, name: form.name.trim(), lat: pending.lat, lng: pending.lng };
      const created = await locationsApi.create(payload);
      setLocations(prev => [created, ...prev]);
      setPending(null);
      setAddMode(false);
      setForm({ name: '', description: '', type: 'maneuvers' });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await locationsApi.remove(id);
      setLocations(prev => prev.filter(l => l.id !== id));
    } catch { /* noop */ }
  };

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Карта на местата за упражнение</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {locations.length} места · паркинги, кръстовища и маршрути за кормуване
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setAddMode(m => !m); setPending(null); setError(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 shadow-lg active:scale-95
              ${addMode
                ? 'bg-gray-200 text-gray-700 shadow-gray-200'
                : 'bg-blue-600 text-white shadow-blue-600/25 hover:bg-blue-700'}`}
          >
            {addMode ? (
              <>✕ Откажи добавяне</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Добави място
              </>
            )}
          </button>
        )}
      </div>

      {/* Add-mode hint */}
      {addMode && !pending && (
        <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700 font-medium flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Кликни върху картата, за да отбележиш ново място.
        </div>
      )}

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
            ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Всички ({locations.length})
        </button>
        {(Object.keys(TYPE_META) as LocationType[]).map(t => {
          const cnt = locations.filter(l => l.type === t).length;
          if (cnt === 0) return null;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1
                ${filter === t ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={filter === t ? { background: TYPE_META[t].color } : undefined}
            >
              <span>{TYPE_META[t].emoji}</span> {TYPE_META[t].label} ({cnt})
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white relative" style={{ height: '60vh', minHeight: 420 }}>
        {loading ? (
          <div className="flex justify-center items-center h-full"><Spinner className="h-7 w-7 text-blue-600" /></div>
        ) : (
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%', cursor: addMode ? 'crosshair' : 'grab' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler active={addMode} onPick={handlePick} />

            {visible.map(loc => (
              <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={icons[loc.type]}>
                <Popup>
                  <div className="space-y-1.5 min-w-[160px]">
                    <div className="flex items-center gap-1.5">
                      <span>{TYPE_META[loc.type].emoji}</span>
                      <span className="font-bold text-gray-900">{loc.name}</span>
                    </div>
                    <span
                      className="inline-block text-[10px] font-bold px-2 py-0.5 rounded text-white"
                      style={{ background: TYPE_META[loc.type].color }}
                    >
                      {TYPE_META[loc.type].label}
                    </span>
                    {loc.description && (
                      <p className="text-xs text-gray-600 leading-snug">{loc.description}</p>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline font-medium inline-block"
                    >
                      Навигирай →
                    </a>
                    {canEdit && (
                      <button
                        onClick={() => handleDelete(loc.id)}
                        className="block text-xs text-red-600 hover:underline font-medium"
                      >
                        Изтрий мястото
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Pending marker (преди запазване) */}
            {pending && (
              <Marker position={[pending.lat, pending.lng]} icon={icons[form.type]} />
            )}
          </MapContainer>
        )}
      </div>

      {/* Empty state */}
      {!loading && locations.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-2">
          {canEdit
            ? 'Още няма отбелязани места. Натисни „Добави място“ и кликни върху картата.'
            : 'Все още няма отбелязани места за упражнение.'}
        </div>
      )}

      {/* New location form */}
      {pending && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">Ново място</h3>
            <span className="text-xs text-gray-400 font-mono">
              {pending.lat.toFixed(5)}, {pending.lng.toFixed(5)}
            </span>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Име</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="напр. Паркинг до Mall Sofia"
              className={selectCls}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Тип</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as LocationType }))}
              className={selectCls}
            >
              {(Object.keys(TYPE_META) as LocationType[]).map(t => (
                <option key={t} value={t}>{TYPE_META[t].emoji} {TYPE_META[t].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Описание (по избор)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="напр. Удобно за паралелно паркиране, спокойно е сутрин"
              rows={2}
              className={selectCls}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setPending(null)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Откажи
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <><Spinner className="h-4 w-4 text-white" /> Запазване…</> : 'Запази мястото'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
