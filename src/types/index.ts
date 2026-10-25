export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export type SensorStatus = 'Active' | 'Degraded' | 'Calibrating' | 'Offline';

export interface SensorNode {
  id: string;
  name: string;
  neighborhood: string;
  lat: number;
  lng: number;
  waterLevelMm: number; // in millimeters
  rainfallRateMmH: number; // in mm/h
  riskLevel: RiskLevel;
  riskReason: string;
  status: SensorStatus;
  batteryPct: number;
  signalStrengthDbm: number;
  lastUpdated: string; // ISO string or formatted
  drainageCapacityMm: number; // maximum nominal capacity before spillover
  elevationMeters: number;
}

export type AlertSeverity = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface FloodAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  location: string;
  sensorId?: string;
  waterLevelMm: number;
  rainfallRateMmH: number;
  timestamp: string;
  description: string;
  recommendedAction: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface RoadNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zone: string;
}

export interface RoadSegment {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  name: string;
  distanceKm: number;
  baseTimeMin: number;
  sensorIdNearby?: string; // Associated sensor monitoring this stretch
  floodRisk: RiskLevel;
  waterLevelMm: number;
  isClosed: boolean;
  closureReason?: string;
  pathCoordinates: [number, number][]; // lat, lng points
}

export interface AvoidanceDetail {
  segmentId: string;
  segmentName: string;
  riskLevel: RiskLevel;
  waterLevelMm: number;
  reason: string;
}

export interface CalculatedRoute {
  id: string;
  type: 'recommended' | 'alternative';
  name: string;
  segments: RoadSegment[];
  totalDistanceKm: number;
  totalTimeMin: number;
  maxRiskLevel: RiskLevel;
  avoidanceReasons: string[];
  avoidanceDetails?: AvoidanceDetail[];
  safePassageScore: number; // 0 - 100
  allCoordinates: [number, number][];
}

export interface ThresholdConfig {
  lowWaterMax: number; // default: 50 mm
  modWaterMax: number; // default: 150 mm
  highWaterMax: number; // default: 300 mm
  // Rain thresholds (mm/h)
  lowRainMax: number; // default: 10 mm/h
  modRainMax: number; // default: 25 mm/h
  highRainMax: number; // default: 50 mm/h
}

export interface WeatherData {
  source: 'live' | 'fallback';
  temperatureC: number;
  humidityPct: number;
  precipitationMm: number;
  rainRateMmH: number;
  windSpeedKmh: number;
  weatherCode: number;
  weatherDescription: string;
  hourlyTimes: string[];
  hourlyPrecipitation: number[];
  hourlyProbability: number[];
  dailyForecast: {
    date: string;
    dayName: string;
    precipSumMm: number;
    precipProbMax: number;
    weatherCode: number;
    description: string;
  }[];
  fetchedAt: string;
}
