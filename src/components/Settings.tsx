import React from 'react';
import { ThresholdConfig } from '../types';
import {
  Sliders,
  RotateCcw,
  ShieldCheck,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface SettingsProps {
  thresholds: ThresholdConfig;
  onUpdateThresholds: (thresholds: ThresholdConfig) => void;
  onResetData: () => void;
  onResetThresholds: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  thresholds,
  onUpdateThresholds,
  onResetData,
  onResetThresholds,
}) => {
  const [localThresholds, setLocalThresholds] = React.useState<ThresholdConfig>(thresholds);
  const [savedMessage, setSavedMessage] = React.useState<boolean>(false);

  const handleSave = () => {
    onUpdateThresholds(localThresholds);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-950 text-slate-100 min-h-full max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-sky-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            System Configuration & Risk Engine Calibration
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Tune hydrological sensitivity thresholds, alert rules, and municipal flood response triggers for Guayaquil.
        </p>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/40 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold">
            Threshold configurations successfully updated and applied across all sensor nodes!
          </span>
        </div>
      )}

      {/* Water Depth Thresholds Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-400" />
            <h3 className="font-bold text-white text-sm">
              Water Depth Risk Thresholds (Millimeters)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Physical Ponding Limits
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Low to Moderate */}
          <div className="rounded-lg bg-slate-800/60 p-3 border border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sky-300 font-semibold">Low Max / Mod Cutoff</span>
              <span className="font-mono text-white font-bold">{localThresholds.lowWaterMax} mm</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={localThresholds.lowWaterMax}
              onChange={(e) =>
                setLocalThresholds({ ...localThresholds, lowWaterMax: Number(e.target.value) })
              }
              className="w-full accent-sky-400"
            />
            <span className="text-[10px] text-slate-400 block">
              Gutter accumulation begins; safe for all transit.
            </span>
          </div>

          {/* Moderate to High */}
          <div className="rounded-lg bg-slate-800/60 p-3 border border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-amber-300 font-semibold">Mod Max / High Cutoff</span>
              <span className="font-mono text-white font-bold">{localThresholds.modWaterMax} mm</span>
            </div>
            <input
              type="range"
              min="80"
              max="220"
              step="10"
              value={localThresholds.modWaterMax}
              onChange={(e) =>
                setLocalThresholds({ ...localThresholds, modWaterMax: Number(e.target.value) })
              }
              className="w-full accent-amber-400"
            />
            <span className="text-[10px] text-slate-400 block">
              Curb height spillover limit; slow speeds required.
            </span>
          </div>

          {/* High to Critical */}
          <div className="rounded-lg bg-slate-800/60 p-3 border border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-red-300 font-semibold">High Max / Critical Cutoff</span>
              <span className="font-mono text-white font-bold">{localThresholds.highWaterMax} mm</span>
            </div>
            <input
              type="range"
              min="200"
              max="450"
              step="10"
              value={localThresholds.highWaterMax}
              onChange={(e) =>
                setLocalThresholds({ ...localThresholds, highWaterMax: Number(e.target.value) })
              }
              className="w-full accent-red-400"
            />
            <span className="text-[10px] text-slate-400 block">
              Exceeds sedan chassis clearance; road closure trigger.
            </span>
          </div>
        </div>
      </div>

      {/* Rainfall Intensity Thresholds Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-400" />
            <h3 className="font-bold text-white text-sm">
              Rainfall Intensity Rate Thresholds (mm/h)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Downpour Velocity
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-lg bg-slate-800/60 p-3 border border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sky-300 font-semibold">Light / Mod Rain</span>
              <span className="font-mono text-white font-bold">{localThresholds.lowRainMax} mm/h</span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={localThresholds.lowRainMax}
              onChange={(e) =>
                setLocalThresholds({ ...localThresholds, lowRainMax: Number(e.target.value) })
              }
              className="w-full accent-sky-400"
            />
            <span className="text-[10px] text-slate-400 block">
              Light coastal drizzle or gentle showers.
            </span>
          </div>

          <div className="rounded-lg bg-slate-800/60 p-3 border border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-amber-300 font-semibold">Mod / Torrential Rain</span>
              <span className="font-mono text-white font-bold">{localThresholds.modRainMax} mm/h</span>
            </div>
            <input
              type="range"
              min="15"
              max="40"
              step="5"
              value={localThresholds.modRainMax}
              onChange={(e) =>
                setLocalThresholds({ ...localThresholds, modRainMax: Number(e.target.value) })
              }
              className="w-full accent-amber-400"
            />
            <span className="text-[10px] text-slate-400 block">
              Storm sewer mains approach gravity limit.
            </span>
          </div>

          <div className="rounded-lg bg-slate-800/60 p-3 border border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-red-300 font-semibold">Extreme Downpour Limit</span>
              <span className="font-mono text-white font-bold">{localThresholds.highRainMax} mm/h</span>
            </div>
            <input
              type="range"
              min="35"
              max="80"
              step="5"
              value={localThresholds.highRainMax}
              onChange={(e) =>
                setLocalThresholds({ ...localThresholds, highRainMax: Number(e.target.value) })
              }
              className="w-full accent-red-400"
            />
            <span className="text-[10px] text-slate-400 block">
              El Niño tropical cloudburst; guaranteed surcharging.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onResetThresholds();
              setLocalThresholds(thresholds);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Thresholds to Baseline Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 transition"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Apply Calibration</span>
          </button>
        </div>
      </div>

      {/* Global Demo Management Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">
              Hackathon Demo Simulation State
            </h3>
          </div>
          <span className="text-amber-400 text-xs font-mono">DEMO SIMULATION</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Restore all Guayaquil sensor nodes, simulated alerts, and road segment flood risk weights back to their original baseline state.
        </p>
        <div className="pt-2">
          <button
            onClick={onResetData}
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition active:scale-95"
          >
            Reset All Application Data to Baseline
          </button>
        </div>
      </div>
    </div>
  );
};
