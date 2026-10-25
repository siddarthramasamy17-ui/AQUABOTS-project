import React, { useState } from 'react';
import { SensorNode } from '../types';
import {
  Sparkles,
  X,
  Droplets,
  CloudRain,
  RotateCcw,
  Waves,
  AlertTriangle,
  Play,
  ArrowRight,
} from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensors: SensorNode[];
  onUpdateSensorWater: (sensorId: string, deltaMm: number) => void;
  onSetSensorWater: (sensorId: string, waterLevelMm: number) => void;
  onResetData: () => void;
  onNavigateToMap: () => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  sensors,
  onUpdateSensorWater,
  onSetSensorWater,
  onResetData,
  onNavigateToMap,
}) => {
  const [selectedSensorId, setSelectedSensorId] = useState<string>(sensors[0]?.id || '');

  if (!isOpen) return null;

  const activeSensor = sensors.find((s) => s.id === selectedSensorId) || sensors[0];

  const handleScenario1 = () => {
    // El Niño Storm
    sensors.forEach((s) => onUpdateSensorWater(s.id, 80));
    onClose();
  };

  const handleScenario2 = () => {
    // Estuary Surge Urdesa & Barcelona
    onUpdateSensorWater('SEN-GYE-01', 110);
    onUpdateSensorWater('SEN-GYE-03', 130);
    onClose();
  };

  const handleScenario3 = () => {
    // Suburbio flood
    onUpdateSensorWater('SEN-GYE-04', 120);
    onClose();
  };

  const handleScenarioDrain = () => {
    // Pumping drainage
    sensors.forEach((s) => onUpdateSensorWater(s.id, -60));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-xs space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Urban Flood Surge Scenario Simulator
              </h2>
              <span className="text-[11px] text-amber-400 font-mono">
                DEMO SIMULATION · HACK2IMPACT 2026
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Rapid Hackathon Demonstration Scenarios
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleScenario1}
              className="flex flex-col text-left rounded-xl border border-slate-800 bg-slate-800/60 p-3 hover:border-sky-500 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center justify-between text-sky-400 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <CloudRain className="h-4 w-4" />
                  <span>El Niño Cloudburst</span>
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-sky-300">
                  +80mm Citywide
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Simulates tropical atmospheric river deluge elevating water levels across all 8 Guayaquil quadrants.
              </p>
            </button>

            <button
              onClick={handleScenario2}
              className="flex flex-col text-left rounded-xl border border-slate-800 bg-slate-800/60 p-3 hover:border-red-500 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center justify-between text-red-400 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <Waves className="h-4 w-4" />
                  <span>Estuary Tidal Surge</span>
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-red-300">
                  Urdesa / Barcelona
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Spikes Estero Salado sea water levels past 350mm, triggering vehicular rerouting on Av. Barcelona.
              </p>
            </button>

            <button
              onClick={handleScenario3}
              className="flex flex-col text-left rounded-xl border border-slate-800 bg-slate-800/60 p-3 hover:border-amber-500 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center justify-between text-amber-400 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Suburbio Drain Blockage</span>
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-amber-300">
                  Calle 29 y Portete
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Simulates trash/debris obstruction in low-elevation stormwater culverts (+120mm ponding).
              </p>
            </button>

            <button
              onClick={handleScenarioDrain}
              className="flex flex-col text-left rounded-xl border border-slate-800 bg-slate-800/60 p-3 hover:border-emerald-500 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <Droplets className="h-4 w-4" />
                  <span>Sump Pumps Activated</span>
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-emerald-300">
                  -60mm Recede
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Emulates municipal emergency suction pumps clearing arterial roadway corridors.
              </p>
            </button>
          </div>
        </div>

        {/* Individual Sensor Precision Slider */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Individual Sensor Manual Calibration
          </span>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Select Sensor Node</label>
            <select
              value={selectedSensorId}
              onChange={(e) => setSelectedSensorId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              {sensors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}: {s.name} ({s.waterLevelMm}mm - {s.riskLevel})
                </option>
              ))}
            </select>
          </div>

          {activeSensor && (
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Adjust Water Depth:</span>
                <span className="font-mono font-bold text-sky-400 text-sm">
                  {activeSensor.waterLevelMm} mm
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="5"
                value={activeSensor.waterLevelMm}
                onChange={(e) => onSetSensorWater(activeSensor.id, Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 mm (Bone dry)</span>
                <span>150 mm (Curb)</span>
                <span>300 mm (Critical)</span>
                <span>500 mm (Submerged)</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onResetData();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to Baseline</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigateToMap();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 transition"
          >
            <span>View Response on Live Map</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
