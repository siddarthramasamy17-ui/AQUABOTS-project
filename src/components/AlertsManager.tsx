import React, { useState } from 'react';
import { FloodAlert, AlertSeverity } from '../types';
import {
  BellRing,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  Clock,
  MapPin,
  ShieldAlert,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react';

interface AlertsManagerProps {
  alerts: FloodAlert[];
  onAcknowledgeAlert: (alertId: string) => void;
  onAddAlert: (newAlert: FloodAlert) => void;
}

const CORRIDOR_SENSOR_MAP = [
  {
    sensorId: 'SEN-GYE-03',
    location: 'Av. Barcelona & Estadio Monumental',
    defaultWaterMm: 360,
    defaultRainMmH: 58,
    severity: 'Critical' as AlertSeverity,
    description: 'Estero Salado high tide surge combined with cloudburst has flooded underpasses and curb gutters. Severe hydro-lock hazard.',
    action: 'Civil Defense Directive: Eastbound vehicular detour active. Heavy pump trucks deployed.',
  },
  {
    sensorId: 'SEN-GYE-01',
    location: 'Urdesa Central - Av. Víctor Emilio Estrada',
    defaultWaterMm: 310,
    defaultRainMmH: 48,
    severity: 'Critical' as AlertSeverity,
    description: 'Tidal backflow in low-lying commercial blocks. Water overtopping sidewalk curbs by 110mm.',
    action: 'Transit Authority (ATM): Divert light vehicles via Av. Las Lomas and Circunvalación.',
  },
  {
    sensorId: 'SEN-GYE-04',
    location: 'Suburbio Oeste - Calle 29 y Portete',
    defaultWaterMm: 230,
    defaultRainMmH: 34,
    severity: 'High' as AlertSeverity,
    description: 'Storm culverts obstructed by alluvial sediment runoff. Street pooling reaching wheel hub clearance.',
    action: 'Municipal Emergency Crews: High-flow suction units activated at Portete junction.',
  },
  {
    sensorId: 'SEN-GYE-02',
    location: 'Av. 9 de Octubre & Malecón Simón Bolívar',
    defaultWaterMm: 160,
    defaultRainMmH: 26,
    severity: 'High' as AlertSeverity,
    description: 'Riverfront stormwater sluice gates restricted by Río Guayas high tide cycle.',
    action: 'Proceed with low speeds to prevent hydroplaning across Malecón avenues.',
  },
  {
    sensorId: 'SEN-GYE-05',
    location: 'Mapasingue Este - Vía a Daule Km 5.5',
    defaultWaterMm: 120,
    defaultRainMmH: 22,
    severity: 'Moderate' as AlertSeverity,
    description: 'Hillside runoff collecting at lower industrial feeder road.',
    action: 'Caution: Surface water pooling near curb gutters.',
  },
];

export const AlertsManager: React.FC<AlertsManagerProps> = ({
  alerts,
  onAcknowledgeAlert,
  onAddAlert,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'All' | AlertSeverity>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Acknowledged'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0);
  const [formWaterMm, setFormWaterMm] = useState<number>(360);
  const [formRainMmH, setFormRainMmH] = useState<number>(58);
  const [formSeverity, setFormSeverity] = useState<AlertSeverity>('Critical');
  const [formDescription, setFormDescription] = useState(
    'Estero Salado high tide surge combined with cloudburst has flooded underpasses and curb gutters.'
  );

  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalCount = alerts.filter((a) => a.severity === 'Critical' && !a.acknowledged).length;
  const highCount = alerts.filter((a) => a.severity === 'High' && !a.acknowledged).length;
  const modCount = alerts.filter((a) => a.severity === 'Moderate' && !a.acknowledged).length;

  const filteredAlerts = alerts.filter((a) => {
    const matchesSeverity = filterSeverity === 'All' || a.severity === filterSeverity;
    const matchesStatus =
      filterStatus === 'All'
        ? true
        : filterStatus === 'Active'
        ? !a.acknowledged
        : a.acknowledged;
    return matchesSeverity && matchesStatus;
  });

  const getGuayaquilTimestamp = () => {
    return (
      new Date().toLocaleTimeString('es-EC', {
        timeZone: 'America/Guayaquil',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' ECT'
    );
  };

  // 1-Click Fast Demo Alert Generator
  const handleQuickDemoAlert = () => {
    const randomPreset = CORRIDOR_SENSOR_MAP[Math.floor(Math.random() * CORRIDOR_SENSOR_MAP.length)];
    const timeStr = getGuayaquilTimestamp();

    const newAlert: FloodAlert = {
      id: `ALT-GYE-${Math.floor(100 + Math.random() * 900)}`,
      severity: randomPreset.severity,
      title: `${randomPreset.severity} Waterlogging Alert · ${randomPreset.location.split('-')[0].trim()}`,
      location: randomPreset.location,
      sensorId: randomPreset.sensorId,
      waterLevelMm: randomPreset.defaultWaterMm,
      rainfallRateMmH: randomPreset.defaultRainMmH,
      timestamp: timeStr,
      description: randomPreset.description,
      recommendedAction: randomPreset.action,
      acknowledged: false,
    };

    onAddAlert(newAlert);
    showToast(`Dispatched simulated alert for ${randomPreset.location} (${timeStr})! Sensor & map updated.`);
  };

  const handleCreateCustomAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const preset = CORRIDOR_SENSOR_MAP[selectedPresetIdx];
    const timeStr = getGuayaquilTimestamp();

    const newAlert: FloodAlert = {
      id: `ALT-GYE-${Math.floor(100 + Math.random() * 900)}`,
      severity: formSeverity,
      title: `${formSeverity} Waterlogging Surge · ${preset.location.split('-')[0].trim()}`,
      location: preset.location,
      sensorId: preset.sensorId,
      waterLevelMm: Number(formWaterMm),
      rainfallRateMmH: Number(formRainMmH),
      timestamp: timeStr,
      description: formDescription,
      recommendedAction:
        formSeverity === 'Critical'
          ? 'Civil Defense Notice: Immediate vehicular bypass active. Sensor & road segment flagged.'
          : 'Transit Notice: Proceed with caution, curb gutters overflowing.',
      acknowledged: false,
    };

    onAddAlert(newAlert);
    setIsModalOpen(false);
    showToast(`Simulated alert dispatched for ${preset.location}! Synchronized with sensor network.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-950 text-slate-100 min-h-full relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-slate-900 px-4 py-3 text-xs text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-amber-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Emergency Flood Alert Center
            </h1>
            <span className="rounded bg-sky-950 px-2 py-0.5 text-[10px] font-semibold text-sky-300 border border-sky-800">
              Guayaquil EOC
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time urban warning broadcasts, municipal transit advisories, and hydrological surge notifications.
          </p>
        </div>

        {/* Action Buttons: 1-Click Demo Alert + Custom Composer */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleQuickDemoAlert}
            className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-sky-400 active:scale-95 shadow-md shadow-sky-500/20"
            title="Immediately generate a random simulated flood alert and update sensor network"
          >
            <Zap className="h-4 w-4 fill-current" />
            <span>Generate Demo Alert</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            <Plus className="h-4 w-4 text-sky-400" />
            <span className="hidden sm:inline">Custom Composer</span>
          </button>
        </div>
      </div>

      {/* Severity Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <span className="text-xs text-slate-400 font-medium">Unacknowledged</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white tabular-nums">
              {activeAlerts.length}
            </span>
            <span className="text-xs text-amber-400">Active</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            Awaiting response
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <span className="text-xs text-slate-400 font-medium">Critical Emergencies</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-red-400 tabular-nums">
              {criticalCount}
            </span>
            <span className="text-xs text-slate-400">&gt;300mm</span>
          </div>
          <span className="text-[10px] text-red-400/80 block mt-1">
            Roadway closure active
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <span className="text-xs text-slate-400 font-medium">High Risk Advisories</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-amber-400 tabular-nums">
              {highCount}
            </span>
            <span className="text-xs text-slate-400">151-300mm</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            Curb level overflow
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <span className="text-xs text-slate-400 font-medium">Moderate Advisories</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-sky-400 tabular-nums">
              {modCount}
            </span>
            <span className="text-xs text-slate-400">51-150mm</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            Gutter ponding
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs">
        {/* Severity filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-slate-400 font-medium flex items-center gap-1 mr-1 shrink-0">
            <Filter className="h-3.5 w-3.5" />
            <span>Severity:</span>
          </span>
          {(['All', 'Critical', 'High', 'Moderate', 'Low'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition whitespace-nowrap ${
                filterSeverity === sev
                  ? 'bg-sky-500 text-slate-950 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status filter buttons */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Status:</span>
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg">
            {(['All', 'Active', 'Acknowledged'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  filterStatus === st
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border p-4 text-xs transition shadow-md ${
                alert.acknowledged
                  ? 'border-slate-800 bg-slate-900/40 opacity-75'
                  : alert.severity === 'Critical'
                  ? 'border-red-500/50 bg-red-950/20'
                  : alert.severity === 'High'
                  ? 'border-amber-500/50 bg-amber-950/20'
                  : 'border-sky-500/30 bg-slate-900/90'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        alert.severity === 'Critical'
                          ? 'bg-red-950 border border-red-800 text-red-300'
                          : alert.severity === 'High'
                          ? 'bg-amber-950 border border-amber-800 text-amber-300'
                          : alert.severity === 'Moderate'
                          ? 'bg-sky-950 border border-sky-800 text-sky-300'
                          : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                      }`}
                    >
                      {alert.severity} Hazard
                    </span>
                    <span className="font-mono text-slate-400 text-[11px] font-semibold">
                      {alert.id}
                    </span>
                    {alert.sensorId && (
                      <span className="font-mono text-sky-400 text-[11px]">
                        [{alert.sensorId}]
                      </span>
                    )}
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3" />
                      <span>{alert.timestamp}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{alert.title}</h3>

                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                    <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    <span>{alert.location}</span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed pt-1">
                    {alert.description}
                  </p>

                  {/* Civil Defense Directive */}
                  <div className="rounded-lg bg-slate-950/80 p-2.5 border border-slate-800 text-[11px] text-slate-300 mt-2">
                    <span className="font-semibold text-sky-400 block mb-0.5">
                      Civil Defense Directive:
                    </span>
                    <span>{alert.recommendedAction}</span>
                  </div>

                  {/* Telemetry Footprint */}
                  <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                    <span>
                      Water Depth: <strong className="text-white">{alert.waterLevelMm}mm</strong>
                    </span>
                    <span>
                      Rainfall Rate: <strong className="text-sky-300">{alert.rainfallRateMmH}mm/h</strong>
                    </span>
                    <span className="text-amber-400 text-[10px]">
                      [DEMO SIMULATION]
                    </span>
                  </div>
                </div>

                {/* Right Action: Acknowledge */}
                <div className="sm:self-center shrink-0">
                  {!alert.acknowledged ? (
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition active:scale-95"
                    >
                      Acknowledge Alert
                    </button>
                  ) : (
                    <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/60 p-2 text-right">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold justify-end">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Acknowledged</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {alert.acknowledgedAt || 'Recorded'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center text-xs text-slate-400 space-y-3">
            <BellRing className="h-8 w-8 text-slate-600 mx-auto" />
            <p>No active alerts matching the selected filter criteria.</p>
            <button
              onClick={handleQuickDemoAlert}
              className="rounded-lg bg-sky-500/20 border border-sky-500/40 px-3 py-1.5 text-xs text-sky-300 hover:bg-sky-500/30 font-medium"
            >
              Generate Demo Alert Now
            </button>
          </div>
        )}
      </div>

      {/* Simulated Alert Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-sky-400" />
                <h3 className="font-bold text-white text-base">
                  Compose Custom Simulated Flood Alert
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomAlert} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Corridor Target (Updates Connected Sensor & Road)
                </label>
                <select
                  value={selectedPresetIdx}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setSelectedPresetIdx(idx);
                    const preset = CORRIDOR_SENSOR_MAP[idx];
                    setFormWaterMm(preset.defaultWaterMm);
                    setFormRainMmH(preset.defaultRainMmH);
                    setFormSeverity(preset.severity);
                    setFormDescription(preset.description);
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {CORRIDOR_SENSOR_MAP.map((preset, idx) => (
                    <option key={preset.sensorId} value={idx}>
                      {preset.location} ({preset.sensorId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Water Level (mm)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="600"
                    value={formWaterMm}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormWaterMm(val);
                      if (val > 300) setFormSeverity('Critical');
                      else if (val > 150) setFormSeverity('High');
                      else if (val > 50) setFormSeverity('Moderate');
                      else setFormSeverity('Low');
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Rainfall Rate (mm/h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formRainMmH}
                    onChange={(e) => setFormRainMmH(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Severity Override
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Low', 'Moderate', 'High', 'Critical'] as const).map((sev) => (
                    <button
                      type="button"
                      key={sev}
                      onClick={() => setFormSeverity(sev)}
                      className={`rounded-lg py-1.5 text-xs font-semibold border transition ${
                        formSeverity === sev
                          ? sev === 'Critical'
                            ? 'bg-red-500 text-slate-950 border-red-400 font-bold'
                            : sev === 'High'
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                            : 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Incident Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Dispatch & Sync Telemetry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
