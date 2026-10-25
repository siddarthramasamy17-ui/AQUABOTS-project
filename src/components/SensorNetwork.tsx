import React, { useState } from 'react';
import {
  SensorNode,
  RiskLevel,
  SensorStatus,
} from '../types';
import { getRiskColorClass } from '../services/floodRiskEngine';
import {
  Radio,
  Search,
  Filter,
  Sliders,
  Sparkles,
  Droplets,
  RotateCcw,
  Battery,
  Wifi,
  MapPin,
  AlertTriangle,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';

interface SensorNetworkProps {
  sensors: SensorNode[];
  onUpdateSensorWater: (sensorId: string, deltaMm: number) => void;
  onSetSensorWater: (sensorId: string, waterLevelMm: number) => void;
  onSelectSensor: (sensor: SensorNode) => void;
  onNavigateToMap: () => void;
  onResetData: () => void;
}

export const SensorNetwork: React.FC<SensorNetworkProps> = ({
  sensors,
  onUpdateSensorWater,
  onSetSensorWater,
  onSelectSensor,
  onNavigateToMap,
  onResetData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<'All' | RiskLevel>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | SensorStatus>('All');

  // Quick stats
  const totalSensors = sensors.length;
  const activeSensors = sensors.filter((s) => s.status === 'Active').length;
  const criticalSensors = sensors.filter((s) => s.riskLevel === 'Critical').length;
  const avgWaterLevel = Math.round(
    sensors.reduce((acc, s) => acc + s.waterLevelMm, 0) / totalSensors
  );

  const filteredSensors = sensors.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = filterRisk === 'All' || s.riskLevel === filterRisk;
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchesSearch && matchesRisk && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-sky-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Guayaquil Urban Sensor Node Telemetry
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time waterlogging ultrasound transducers & rain gauges installed across vulnerable estuarine corridors.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-3 py-1.5 rounded-lg shrink-0 font-medium">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span>DEMO SIMULATION: Synthetic IoT Network</span>
        </div>
      </div>

      {/* Network Health Metric Cards (4 cols) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <span className="text-slate-400 text-xs">Total Node Array</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white tabular-nums">
              {totalSensors}
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              {activeSensors} Online ({Math.round((activeSensors / totalSensors) * 100)}%)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            Transmitting every 60s
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <span className="text-slate-400 text-xs">Average Water Level</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-sky-400 tabular-nums">
              {avgWaterLevel}
            </span>
            <span className="text-xs text-slate-400 font-mono">mm</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            Guayaquil Basin Mean
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <span className="text-slate-400 text-xs">Critical Ponding Nodes</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-red-400 tabular-nums">
              {criticalSensors}
            </span>
            <span className="text-xs text-slate-400">Above 300mm curb limit</span>
          </div>
          <span className="text-[10px] text-red-400/80 block mt-1">
            Vehicular bypass required
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <span className="text-slate-400 text-xs">Network Reliability</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
              99.4%
            </span>
            <span className="text-xs text-slate-400">Uptime</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            Solar/LiFePO4 battery backed
          </span>
        </div>
      </div>

      {/* Simulator Quick Action Strip */}
      <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-400" />
              <h3 className="font-bold text-white text-sm">
                Interactive Sensor Surge Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly simulate torrential storm events or drain blockages to evaluate flood classification and Dijkstra routing responses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                sensors.forEach((s) => onUpdateSensorWater(s.id, 50));
              }}
              className="rounded-lg bg-sky-500/20 border border-sky-500/40 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/30 transition active:scale-95"
            >
              +50mm Torrential Rain (City-wide)
            </button>

            <button
              onClick={() => {
                onUpdateSensorWater('SEN-GYE-03', 100); // Barcelona spike
                onUpdateSensorWater('SEN-GYE-01', 80); // Urdesa spike
              }}
              className="rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30 transition active:scale-95"
            >
              Surge Estuary High-Tide (Urdesa/Barcelona)
            </button>

            <button
              onClick={() => {
                sensors.forEach((s) => onUpdateSensorWater(s.id, -40));
              }}
              className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition active:scale-95"
            >
              -40mm Sump Pump Recede
            </button>

            <button
              onClick={onResetData}
              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Reset all sensor readings to baseline"
            >
              <RotateCcw className="h-3.5 w-3.5 inline mr-1" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Sensor Table and Filter Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-800 bg-slate-950/40">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search corridor, neighborhood, sensor ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Risk:</span>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value as any)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="All">All Risks</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-400">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Calibrating">Calibrating</option>
                <option value="Degraded">Degraded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Node ID / Location</th>
                <th className="py-3 px-4">Water Depth (mm)</th>
                <th className="py-3 px-4">Rain Rate</th>
                <th className="py-3 px-4">Risk Classification</th>
                <th className="py-3 px-4">Hardware Health</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredSensors.length > 0 ? (
                filteredSensors.map((sensor) => {
                  const colors = getRiskColorClass(sensor.riskLevel);
                  return (
                    <tr
                      key={sensor.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sky-400 font-semibold">
                            {sensor.id}
                          </span>
                          <span className="text-slate-200 font-medium">
                            {sensor.neighborhood}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                          {sensor.name}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm tabular-nums">
                            {sensor.waterLevelMm} mm
                          </span>
                          <span className="text-[10px] text-slate-500">
                            / {sensor.drainageCapacityMm}mm
                          </span>
                        </div>
                        {/* Mini Progress */}
                        <div className="h-1.5 w-28 rounded-full bg-slate-800 overflow-hidden mt-1">
                          <div
                            className={`h-full ${
                              sensor.riskLevel === 'Critical'
                                ? 'bg-red-500'
                                : sensor.riskLevel === 'High'
                                ? 'bg-amber-500'
                                : sensor.riskLevel === 'Moderate'
                                ? 'bg-sky-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (sensor.waterLevelMm / 350) * 100)}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-sky-300">
                        {sensor.rainfallRateMmH.toFixed(1)} mm/h
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold border ${colors.badgeBg}`}
                        >
                          {sensor.riskLevel}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-tight">
                          {sensor.riskReason}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-[11px] font-mono text-slate-400">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              sensor.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                          <span>{sensor.status}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Bat: {sensor.batteryPct}% · Sig: {sensor.signalStrengthDbm}dBm
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              onSelectSensor(sensor);
                              onNavigateToMap();
                            }}
                            className="rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-sky-400 hover:bg-slate-700 hover:text-sky-300 border border-slate-700 transition"
                            title="Inspect on Leaflet Map"
                          >
                            <MapPin className="h-3 w-3 inline mr-1" />
                            Map
                          </button>

                          <button
                            onClick={() => onUpdateSensorWater(sensor.id, 40)}
                            className="rounded bg-red-950/60 border border-red-800/80 px-2 py-1 text-[10px] font-semibold text-red-300 hover:bg-red-900/80 transition"
                            title="Spike water level +40mm"
                          >
                            +40mm
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No sensor nodes match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
