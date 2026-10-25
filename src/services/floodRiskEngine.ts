import { RiskLevel, ThresholdConfig } from '../types';

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  lowWaterMax: 50,    // 0 - 50 mm: Low risk
  modWaterMax: 150,   // 51 - 150 mm: Moderate risk (curb overflow begins)
  highWaterMax: 300,  // 151 - 300 mm: High risk (standard sedan exhaust depth)
  // Rain rate thresholds in mm/h
  lowRainMax: 10,     // 0 - 10 mm/h: Light / gentle
  modRainMax: 25,     // 10 - 25 mm/h: Moderate rainfall
  highRainMax: 50,    // 25 - 50 mm/h: Torrential tropical downpour
};

/**
 * Calculates the flood risk level based on water depth and rainfall rate.
 * Uses a combined matrix evaluating physical ponding depth and active accumulation velocity.
 */
export function calculateFloodRisk(
  waterLevelMm: number,
  rainfallRateMmH: number,
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): {
  level: RiskLevel;
  score: number; // 0 - 100 severity index
  reason: string;
  isCurbExceeded: boolean;
  isVehicularHazard: boolean;
} {
  const safeWater = Math.max(0, waterLevelMm);
  const safeRain = Math.max(0, rainfallRateMmH);

  // Score calculation (weighted 65% water level, 35% rain rate)
  const waterScore = Math.min(100, (safeWater / (thresholds.highWaterMax * 1.3)) * 100);
  const rainScore = Math.min(100, (safeRain / (thresholds.highRainMax * 1.2)) * 100);
  const compositeScore = Math.round(waterScore * 0.65 + rainScore * 0.35);

  const isCurbExceeded = safeWater > thresholds.modWaterMax;
  const isVehicularHazard = safeWater > thresholds.highWaterMax;

  // Classification logic with deterministic rules
  if (safeWater > thresholds.highWaterMax || safeRain > thresholds.highRainMax) {
    let reason = `Critical alert: Severe ponding at ${safeWater}mm`;
    if (safeWater > thresholds.highWaterMax && safeRain > thresholds.highRainMax) {
      reason += ` combined with torrential rain of ${safeRain}mm/h exceeding Guayaquil drainage basin threshold. High risk of engine hydro-lock.`;
    } else if (safeWater > thresholds.highWaterMax) {
      reason += ` exceeds municipal curb clearance (${thresholds.highWaterMax}mm). Impassable for sedans and light ambulances.`;
    } else {
      reason += ` caused by extreme rainfall rate (${safeRain}mm/h) overloading storm sewer collector mains.`;
    }

    return {
      level: 'Critical',
      score: Math.max(80, compositeScore),
      reason,
      isCurbExceeded: true,
      isVehicularHazard: true,
    };
  }

  if (safeWater > thresholds.modWaterMax || safeRain > thresholds.modRainMax) {
    let reason = `High risk: Water level ${safeWater}mm`;
    if (safeRain > thresholds.modRainMax) {
      reason += ` with heavy rainfall (${safeRain}mm/h) creating surface runoff and drainage backflow into low-lying street corridors.`;
    } else {
      reason += ` reaching curb level. Vehicles must reduce speed to prevent hydroplaning and wake damage.`;
    }

    return {
      level: 'High',
      score: Math.max(55, Math.min(79, compositeScore)),
      reason,
      isCurbExceeded: true,
      isVehicularHazard: false,
    };
  }

  if (safeWater > thresholds.lowWaterMax || safeRain > thresholds.lowRainMax) {
    return {
      level: 'Moderate',
      score: Math.max(25, Math.min(54, compositeScore)),
      reason: `Moderate water pooling (${safeWater}mm, rain: ${safeRain}mm/h). Storm drains active; slow traffic expected near gutter grates.`,
      isCurbExceeded: false,
      isVehicularHazard: false,
    };
  }

  return {
    level: 'Low',
    score: Math.min(24, compositeScore),
    reason: `Normal nominal conditions (${safeWater}mm, rain: ${safeRain}mm/h). Runoff is draining freely through gravity outlets.`,
    isCurbExceeded: false,
    isVehicularHazard: false,
  };
}

export function getRiskColorClass(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
  markerColor: string;
  badgeBg: string;
} {
  switch (level) {
    case 'Critical':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/30',
        markerColor: '#ef4444',
        badgeBg: 'bg-red-950/60 text-red-300 border-red-700/50',
      };
    case 'High':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        markerColor: '#f59e0b',
        badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-700/50',
      };
    case 'Moderate':
      return {
        bg: 'bg-sky-500/10',
        text: 'text-sky-400',
        border: 'border-sky-500/30',
        markerColor: '#0ea5e9',
        badgeBg: 'bg-sky-950/60 text-sky-300 border-sky-700/50',
      };
    case 'Low':
    default:
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        markerColor: '#10b981',
        badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
      };
  }
}
