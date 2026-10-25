import React, { useState } from 'react';
import {
  SensorNode,
  FloodAlert,
  RoadSegment,
  WeatherData,
} from '../types';
import { getRiskColorClass } from '../services/floodRiskEngine';
import {
  AlertTriangle,
  Radio,
  Route,
  CloudRain,
  MapPin,
  ArrowUpRight,
  Check,
  TrendingUp,
  Activity,
  Sparkles,
} from 'lucide-react';

interface OverviewProps {
  sensors: SensorNode[];
  alerts: FloodAlert[];
  roadSegments: RoadSegment[];
  weather: WeatherData | null;
  onNavigate: (tab: string) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onSelectSensor: (sensor: SensorNode) => void;
  onOpenSimulation: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  sensors,
  alerts,
  roadSegments,
  weather,
  onNavigate,
  onAcknowledgeAlert,
  onSelectSensor,
  onOpenSimulation,
}) => {
  const [trendRange, setTrendRange] = useState<'24h' | '7d'>('24h');

  // Computed metrics
  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalSensors = sensors.filter((s) => s.riskLevel === 'Critical');
  const highRiskSensors = sensors.filter((s) => s.riskLevel === 'High');
  const operationalSensors = sensors.filter((s) => s.status === 'Active');
  const affectedRoadSegments = roadSegments.filter(
    (s) => s.floodRisk === 'Critical' || s.floodRisk === 'High'
  );

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Top Banner / City & Emergency Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Emergency Command Center · Guayaquil
            </h1>
            <span className="rounded bg-sky-950 px-2 py-0.5 text-[10px] font-semibold text-sky-300 border border-sky-800">
              Estero Salado & Guayas Basin
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Real-time urban flood resilience intelligence for HACK2IMPACT 2026. Continuous monitoring of tidal surge ingress, stormwater drainage saturation, and emergency evacuation corridors.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('map')}
            className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 active:scale-95 shadow-md shadow-sky-500/20"
          >
            <MapPin className="h-4 w-4" />
            <span>Launch Live Map</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => onNavigate('routes')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            <Route className="h-4 w-4 text-emerald-400" />
            <span>Route Planner</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip (4 columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Flood Alerts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Alerts</span>
            <AlertTriangle className={`h-4 w-4 ${activeAlerts.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-white tabular-nums">
              {activeAlerts.length}
            </span>
            <span className="text-[11px] text-amber-400 font-medium">
              ({alerts.length - activeAlerts.length} Acknowledged)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {criticalSensors.length > 0 ? (
              <span className="text-red-400 font-medium">
                {criticalSensors.length} Critical sectors active
              </span>
            ) : (
              'All sectors within warning threshold'
            )}
          </div>
        </div>

        {/* Current Rain Intensity */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Precipitation Rate</span>
            <CloudRain className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-sky-300 tabular-nums">
              {weather ? `${weather.rainRateMmH.toFixed(1)}` : '18.4'}
            </span>
            <span className="text-xs text-slate-400 font-mono">mm/h</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{weather?.weatherDescription || 'Heavy tropical downpour'}</span>
            <span className="text-sky-400 font-mono text-[10px]">
              {weather?.source === 'live' ? 'Live API' : 'Demo API'}
            </span>
          </div>
        </div>

        {/* Operational Sensor Nodes */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Sensor Network</span>
            <Radio className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-white tabular-nums">
              {operationalSensors.length}/{sensors.length}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">
              {Math.round((operationalSensors.length / sensors.length) * 100)}% Online
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Telemetry latency &lt; 3.2s via LoRaWAN/MQTT
          </div>
        </div>

        {/* Affected Road Corridors */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Corridors Submerged</span>
            <Route className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-red-400 tabular-nums">
              {affectedRoadSegments.length}
            </span>
            <span className="text-[11px] text-slate-400">
              of {roadSegments.length} corridors
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Dijkstra rerouting active on arterial grid
          </div>
        </div>
      </div>

      {/* Middle Grid: Rainfall Trend & High Risk Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Rainfall & Water accumulation chart (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-400" />
              <h3 className="font-bold text-white text-sm">
                Rainfall & Ponding Accumulation Trend
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg text-[11px]">
              <button
                onClick={() => setTrendRange('24h')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  trendRange === '24h'
                    ? 'bg-sky-500 text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                24h Forecast
              </button>
              <button
                onClick={() => setTrendRange('7d')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  trendRange === '7d'
                    ? 'bg-sky-500 text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                7-Day Outlook
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-2">
            {trendRange === '24h' ? (
              <div className="space-y-2">
                <div className="flex items-end gap-2 h-44 border-b border-slate-800 pb-2 px-1">
                  {(weather?.hourlyTimes || []).slice(0, 10).map((time, idx) => {
                    const rain = weather?.hourlyPrecipitation?.[idx] ?? 0;
                    const heightPct = Math.min(100, Math.max(12, (rain / 40) * 100));
                    const isHigh = rain > 20;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {rain}mm
                        </span>
                        <div
                          className={`w-full rounded-t-sm transition-all duration-300 ${
                            isHigh ? 'bg-gradient-to-t from-sky-600 to-red-400' : 'bg-sky-500/80 hover:bg-sky-400'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[10px] font-mono text-slate-400 truncate w-full text-center">
                          {time}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 font-mono">
                  <span>Precipitation (mm/interval)</span>
                  <span className="text-sky-300">Peak Rain: 34.2mm expected at 14:00 ECT</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-end gap-2 h-44 border-b border-slate-800 pb-2 px-1">
                  {(weather?.dailyForecast || []).map((day, idx) => {
                    const heightPct = Math.min(100, Math.max(15, (day.precipSumMm / 55) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.precipSumMm}mm
                        </span>
                        <div
                          className="w-full rounded-t-sm bg-gradient-to-t from-sky-700 to-sky-400 hover:from-sky-600 hover:to-sky-300 transition-all duration-300"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[10px] font-semibold text-slate-300">
                          {day.dayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                  <span>7-Day Guayaquil Coastal Rain Index</span>
                  <span className="text-amber-300 font-mono">Total Cumulative: 188.6 mm</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* High Risk Guayaquil Corridors List (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-400" />
              <h3 className="font-bold text-white text-sm">High-Risk Corridors</h3>
            </div>
            <button
              onClick={() => onNavigate('map')}
              className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {[...criticalSensors, ...highRiskSensors].slice(0, 4).map((sensor) => {
              const colors = getRiskColorClass(sensor.riskLevel);
              return (
                <div
                  key={sensor.id}
                  onClick={() => {
                    onSelectSensor(sensor);
                    onNavigate('map');
                  }}
                  className="cursor-pointer rounded-lg border border-slate-800 bg-slate-800/60 p-2.5 transition hover:bg-slate-800 hover:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-sky-400 font-semibold">
                        {sensor.id}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-bold border ${colors.badgeBg}`}
                      >
                        {sensor.riskLevel}
                      </span>
                    </div>
                    <h4 className="font-semibold text-white text-[12px] mt-0.5">
                      {sensor.name}
                    </h4>
                    <p className="text-[10px] text-slate-400">{sensor.neighborhood}</p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-white block">
                      {sensor.waterLevelMm}mm
                    </span>
                    <span className="text-[10px] text-sky-400 font-mono">
                      {sensor.rainfallRateMmH.toFixed(1)} mm/h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Critical threshold: &gt; 300mm</span>
            <button
              onClick={onOpenSimulation}
              className="text-sky-400 font-medium hover:text-sky-300 flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>Simulate Surge Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Alerts Activity & Sensor Health Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Alerts Feed (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Recent Alert Activity</h3>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-[11px] text-sky-400 hover:underline"
            >
              Full Alert Center ➔
            </button>
          </div>

          <div className="space-y-2.5">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-3 text-xs transition ${
                  alert.acknowledged
                    ? 'border-slate-800/80 bg-slate-950/60 opacity-75'
                    : alert.severity === 'Critical'
                    ? 'border-red-500/40 bg-red-950/20'
                    : 'border-amber-500/40 bg-amber-950/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          alert.severity === 'Critical'
                            ? 'bg-red-900/60 text-red-300'
                            : 'bg-amber-900/60 text-amber-300'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="font-semibold text-white text-[12px]">
                        {alert.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>{alert.location}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-500">{alert.timestamp}</span>
                    </div>
                  </div>

                  {!alert.acknowledged ? (
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="rounded bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 shrink-0"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium shrink-0">
                      <Check className="h-3 w-3" />
                      <span>Acknowledged</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sensor Network Status Mini-Grid (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Sensor Node Health</h3>
            </div>
            <button
              onClick={() => onNavigate('sensors')}
              className="text-[11px] text-sky-400 hover:underline"
            >
              Sensor Table ➔
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {sensors.slice(0, 6).map((sensor) => (
              <div
                key={sensor.id}
                onClick={() => {
                  onSelectSensor(sensor);
                  onNavigate('map');
                }}
                className="cursor-pointer rounded-lg bg-slate-800/60 p-2 border border-slate-700/60 hover:border-sky-500/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-sky-400 font-bold">
                    {sensor.id}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      sensor.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                </div>
                <div className="text-[11px] font-medium text-slate-200 truncate mt-1">
                  {sensor.neighborhood}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>{sensor.waterLevelMm}mm</span>
                  <span>{sensor.batteryPct}% bat</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Guayaquil LoRaWAN Gateway Network</span>
            <span className="text-emerald-400">99.8% Packet Delivery</span>
          </div>
        </div>
      </div>
    </div>
  );
};
