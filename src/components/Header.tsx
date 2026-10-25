import React, { useState, useEffect } from 'react';
import {
  Waves,
  CloudRain,
  ShieldAlert,
  RotateCcw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { WeatherData } from '../types';

interface HeaderProps {
  weather: WeatherData | null;
  activeAlertsCount: number;
  onOpenSimulation: () => void;
  onResetData: () => void;
  onSelectNav: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  weather,
  activeAlertsCount,
  onOpenSimulation,
  onResetData,
  onSelectNav,
}) => {
  const [guayaquilTime, setGuayaquilTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setGuayaquilTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'America/Guayaquil',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur-md sm:px-6">
      {/* Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
          <Waves className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              DRAIN PULSE
            </span>
            <span className="rounded bg-sky-950 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-sky-300 border border-sky-800">
              FLOODWATCH
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>Guayaquil, Ecuador</span>
            <span aria-hidden="true">·</span>
            <span>HACK2IMPACT 2026 Track 1</span>
          </div>
        </div>
      </div>

      {/* Middle Status / Weather Zone */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-slate-300 font-medium">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className="text-slate-400">ECT (UTC-5):</span>
          <span className="font-mono text-slate-200 tabular-nums">{guayaquilTime || '10:45:00'}</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800" />

        <div className="flex items-center gap-2">
          <CloudRain className="h-4 w-4 text-sky-400" />
          <span className="text-slate-400">Rainfall:</span>
          <span className="font-mono text-sky-300 font-semibold tabular-nums">
            {weather ? `${weather.rainRateMmH.toFixed(1)} mm/h` : '18.4 mm/h'}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
            {weather?.source === 'live' ? '(Open-Meteo Live)' : '(Demo Synced)'}
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800" />

        <button
          onClick={() => onSelectNav('alerts')}
          className="flex items-center gap-2 transition hover:text-amber-300"
          title="View active alerts"
        >
          <ShieldAlert className={`h-4 w-4 ${activeAlertsCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span>Active Alerts:</span>
          <span className={`font-mono font-bold tabular-nums ${activeAlertsCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {activeAlertsCount}
          </span>
        </button>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenSimulation}
          className="flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20 active:scale-95"
          title="Open interactive surge simulator"
        >
          <Sparkles className="h-3.5 w-3.5 text-sky-400" />
          <span className="hidden sm:inline">Surge Simulator</span>
          <span className="sm:hidden">Simulate</span>
        </button>

        <button
          onClick={onResetData}
          className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          title="Reset simulation data to baseline"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>
    </header>
  );
};
