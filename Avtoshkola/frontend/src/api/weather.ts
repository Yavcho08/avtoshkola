// Безплатно метео от Open-Meteo (без API ключ, CORS-friendly).
// Прогноза за София, почасова, до 16 дни напред.

const LAT = 42.6977;
const LNG = 23.3219;

export interface HourWeather {
  temp: number;
  code: number;
  precip: number; // вероятност за валеж %
}

let cache: Record<string, HourWeather> | null = null;
let inflight: Promise<Record<string, HourWeather>> | null = null;

export function getForecast(): Promise<Record<string, HourWeather>> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}` +
    `&hourly=temperature_2m,weather_code,precipitation_probability` +
    `&timezone=Europe%2FSofia&forecast_days=16`;

  inflight = fetch(url)
    .then(r => r.json())
    .then((d: any) => {
      const map: Record<string, HourWeather> = {};
      const h = d.hourly;
      (h.time as string[]).forEach((t, i) => {
        map[t] = {
          temp: Math.round(h.temperature_2m[i]),
          code: h.weather_code[i],
          precip: h.precipitation_probability?.[i] ?? 0,
        };
      });
      cache = map;
      return map;
    })
    .catch(() => ({}));

  return inflight;
}

// Превръща ISO време в ключ за София (почасов), напр. "2026-06-13T14:00"
export function sofiaHourKey(iso: string): string {
  const d = new Date(iso);
  // sv-SE дава формат "YYYY-MM-DD HH:MM"
  const s = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Sofia',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d);
  const [date, time] = s.split(' ');
  return `${date}T${time.slice(0, 2)}:00`;
}

// WMO код → емоджи + надпис на български
export function weatherMeta(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: '☀️', label: 'Ясно' };
  if (code === 1 || code === 2) return { emoji: '🌤️', label: 'Предимно ясно' };
  if (code === 3) return { emoji: '☁️', label: 'Облачно' };
  if (code === 45 || code === 48) return { emoji: '🌫️', label: 'Мъгла' };
  if (code >= 51 && code <= 57) return { emoji: '🌦️', label: 'Ръмеж' };
  if (code >= 61 && code <= 67) return { emoji: '🌧️', label: 'Дъжд' };
  if (code >= 71 && code <= 77) return { emoji: '❄️', label: 'Сняг' };
  if (code >= 80 && code <= 82) return { emoji: '🌦️', label: 'Превалявания' };
  if (code === 85 || code === 86) return { emoji: '🌨️', label: 'Снежни превалявания' };
  if (code >= 95) return { emoji: '⛈️', label: 'Гръмотевици' };
  return { emoji: '🌡️', label: 'Неизвестно' };
}
