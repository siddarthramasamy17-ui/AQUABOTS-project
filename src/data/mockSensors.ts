import { SensorNode } from '../types';
import { calculateFloodRisk, DEFAULT_THRESHOLDS } from '../services/floodRiskEngine';

const RAW_SENSORS_DATA = [
  {
    id: 'SEN-GYE-01',
    name: 'Urdesa Central - Av. Víctor Emilio Estrada',
    neighborhood: 'Urdesa Central',
    lat: -2.1704,
    lng: -79.9125,
    waterLevelMm: 295, // High water due to Estero Salado high tide & rain
    rainfallRateMmH: 42.0,
    status: 'Active' as const,
    batteryPct: 91,
    signalStrengthDbm: -68,
    drainageCapacityMm: 120,
    elevationMeters: 4.2,
  },
  {
    id: 'SEN-GYE-02',
    name: 'Av. 9 de Octubre & Malecón 2000',
    neighborhood: 'Centro / Malecón',
    lat: -2.1932,
    lng: -79.8805,
    waterLevelMm: 140, // Moderate ponding along riverfront gutters
    rainfallRateMmH: 22.5,
    status: 'Active' as const,
    batteryPct: 96,
    signalStrengthDbm: -62,
    drainageCapacityMm: 180,
    elevationMeters: 5.8,
  },
  {
    id: 'SEN-GYE-03',
    name: 'Av. Barcelona & Estadio Monumental',
    neighborhood: 'Bellavista / Barcelona',
    lat: -2.1950,
    lng: -79.9078,
    waterLevelMm: 340, // Critical flood level
    rainfallRateMmH: 54.0,
    status: 'Active' as const,
    batteryPct: 84,
    signalStrengthDbm: -74,
    drainageCapacityMm: 110,
    elevationMeters: 3.6,
  },
  {
    id: 'SEN-GYE-04',
    name: 'Calle 29 y Portete de Tarqui',
    neighborhood: 'Suburbio Oeste',
    lat: -2.2130,
    lng: -79.9180,
    waterLevelMm: 210, // High water in low-elevation suburbio
    rainfallRateMmH: 31.0,
    status: 'Active' as const,
    batteryPct: 88,
    signalStrengthDbm: -71,
    drainageCapacityMm: 95,
    elevationMeters: 2.9,
  },
  {
    id: 'SEN-GYE-05',
    name: 'Mapasingue Este - Vía a Daule Km 5.5',
    neighborhood: 'Mapasingue / Vía a Daule',
    lat: -2.1520,
    lng: -79.9250,
    waterLevelMm: 65, // Moderate runoff from hillside
    rainfallRateMmH: 18.0,
    status: 'Active' as const,
    batteryPct: 94,
    signalStrengthDbm: -65,
    drainageCapacityMm: 220,
    elevationMeters: 14.5,
  },
  {
    id: 'SEN-GYE-06',
    name: 'Kennedy Norte - Av. Francisco de Orellana',
    neighborhood: 'Kennedy Norte',
    lat: -2.1610,
    lng: -79.8970,
    waterLevelMm: 35, // Low / nominal
    rainfallRateMmH: 9.5,
    status: 'Active' as const,
    batteryPct: 98,
    signalStrengthDbm: -59,
    drainageCapacityMm: 200,
    elevationMeters: 7.1,
  },
  {
    id: 'SEN-GYE-07',
    name: 'Alborada Etapa 6 - Av. Rodolfo Baquerizo',
    neighborhood: 'La Alborada',
    lat: -2.1380,
    lng: -79.8980,
    waterLevelMm: 25, // Low
    rainfallRateMmH: 6.0,
    status: 'Active' as const,
    batteryPct: 89,
    signalStrengthDbm: -67,
    drainageCapacityMm: 160,
    elevationMeters: 8.4,
  },
  {
    id: 'SEN-GYE-08',
    name: 'Puerto Santa Ana - Edificio The Point',
    neighborhood: 'Puerto Santa Ana',
    lat: -2.1810,
    lng: -79.8760,
    waterLevelMm: 45, // Low
    rainfallRateMmH: 11.0,
    status: 'Calibrating' as const,
    batteryPct: 76,
    signalStrengthDbm: -79,
    drainageCapacityMm: 190,
    elevationMeters: 6.2,
  },
];

export const INITIAL_SENSORS: SensorNode[] = RAW_SENSORS_DATA.map((s) => {
  const risk = calculateFloodRisk(s.waterLevelMm, s.rainfallRateMmH, DEFAULT_THRESHOLDS);
  return {
    ...s,
    riskLevel: risk.level,
    riskReason: risk.reason,
    lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 5 * 60 * 1000)).toISOString(),
  };
});
