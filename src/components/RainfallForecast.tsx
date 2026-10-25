import React, { useState } from 'react';
import { WeatherData } from '../types';
import {
  CloudRain,
  RefreshCw,
  Droplets,
  Wind,
  Thermometer,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface RainfallForecastProps {
  weather: WeatherData | null;
  isLoading: boolean;
  onRefreshWeather: () => void;
}

export const RainfallForecast: React.FC<RainfallForecastProps> = ({
  weather,
  isLoading,
  onRefreshWeather,
}) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  if (!weather && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3 min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-sky-400" />
        <span className="text-sm">Fetching Open-Meteo rainfall model for Guayaquil...</span>
      </div>
    );
  }

  const current = weather || {
    source: 'fallback' as const,
    temperatureC: 28.5,
    humidityPct: 86,
    precipitationMm: 14.8,
    rainRateMmH: 26.4,
    windSpeedKmh: 18.2,
    weatherCode: 65,
    weatherDescription: 'Heavy tropical rain',
    hourlyTimes: ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
    hourlyPrecipitation: [4.2, 18.5, 34.2, 19.8, 8.4, 3.1],
    hourlyProbability: [60, 85, 95, 80, 50, 30],
    dailyForecast: [],
    fetchedAt: 'Just now',
  };

  const isLive = current.source === 'live';

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CloudRain className="h-5 w-5 text-sky-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Meteorological & Precipitation Radar
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Grounded in Open-Meteo High-Resolution Forecasting Model for Guayaquil (-2.1894°S, -79.8891°W).
          </p>
        </div>

        {/* Source Feed Demarcation Badge & Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              isLive
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/70 border-amber-800 text-amber-300'
            }`}
          >
            {isLive ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span>{isLive ? 'LIVE OPEN-METEO API FEED' : 'OFFLINE FALLBACK DATA'}</span>
          </div>

          <button
            onClick={onRefreshWeather}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
            title="Refresh current meteorological conditions"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Current Conditions Card Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Precipitation Rate</span>
            <Droplets className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-sky-300 tabular-nums">
              {current.rainRateMmH.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">mm/h</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            Current surface accumulation
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Ambient Temperature</span>
            <Thermometer className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-white tabular-nums">
              {current.temperatureC.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">°C</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            Coastal equatorial thermal index
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Relative Humidity</span>
            <CloudRain className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
              {current.humidityPct}
            </span>
            <span className="text-xs font-mono text-slate-400">%</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            Saturated air mass
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Wind Speed</span>
            <Wind className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
              {current.windSpeedKmh.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">km/h</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            Estuary Gulf breezes (SW)
          </span>
        </div>
      </div>

      {/* Hourly Timeline Chart Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-400" />
            <h3 className="font-bold text-white text-sm">
              Hourly Rainfall & Probability Trend (Next 10 Intervals)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Synced: {current.fetchedAt}
          </span>
        </div>

        {/* Bar & Probability Chart */}
        <div className="pt-2">
          <div className="flex items-end gap-3 h-48 border-b border-slate-800 pb-3 px-2">
            {current.hourlyTimes.map((time, idx) => {
              const rain = current.hourlyPrecipitation[idx] ?? 0;
              const prob = current.hourlyProbability[idx] ?? 0;
              const heightPct = Math.min(100, Math.max(12, (rain / 40) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-mono font-bold text-sky-300">
                    {rain}mm
                  </span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-sky-700 to-sky-400 group-hover:from-sky-600 group-hover:to-sky-300 transition-all duration-300"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] font-mono font-semibold text-slate-300">
                    {time}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {prob}% prob
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 pt-2">
            <span>Bars denote millimeter rainfall accumulation per hour.</span>
            <span className="text-amber-400">
              Downpour probability exceeds 80% during peak afternoon thermal convection.
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Guayaquil Synoptic Forecast Outlook */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">
              7-Day Hydrometeorological Outlook (Guayaquil Metropolitan Area)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Daily Precipitation Aggregates
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {current.dailyForecast.map((day, idx) => (
            <div
              key={day.date}
              onClick={() => setSelectedDayIdx(idx)}
              className={`cursor-pointer rounded-xl border p-3 text-xs transition-all flex flex-col justify-between ${
                selectedDayIdx === idx
                  ? 'border-sky-500 bg-sky-950/40 ring-1 ring-sky-500/50'
                  : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div>
                <span className="font-bold text-white block text-[13px]">
                  {day.dayName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{day.date}</span>
              </div>

              <div className="my-3">
                <CloudRain className="h-6 w-6 text-sky-400 mx-auto" />
                <span className="text-[11px] text-slate-300 block text-center mt-1 truncate">
                  {day.description}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Rain:</span>
                  <span className="font-bold text-sky-300">{day.precipSumMm}mm</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Prob:</span>
                  <span>{day.precipProbMax}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
