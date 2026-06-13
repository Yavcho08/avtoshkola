import { useEffect, useState } from 'react';
import { getForecast, sofiaHourKey, weatherMeta, HourWeather } from '../api/weather';

// Малък метео индикатор за конкретно занятие (по час и дата).
// Показва се само ако занятието е в рамките на прогнозата (16 дни напред).
export function WeatherChip({ startTime }: { startTime: string }) {
  const [weather, setWeather] = useState<HourWeather | null>(null);

  useEffect(() => {
    let active = true;
    getForecast().then(map => {
      if (!active) return;
      const w = map[sofiaHourKey(startTime)];
      if (w) setWeather(w);
    });
    return () => { active = false; };
  }, [startTime]);

  if (!weather) return null;

  const { emoji, label } = weatherMeta(weather.code);
  const rainy = weather.precip >= 50;

  return (
    <span
      title={`${label} · ${weather.temp}°C · ${weather.precip}% валеж`}
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg flex-shrink-0
        ${rainy ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}
    >
      <span>{emoji}</span>
      <span>{weather.temp}°</span>
      {weather.precip >= 30 && <span className="text-blue-500">💧{weather.precip}%</span>}
    </span>
  );
}
