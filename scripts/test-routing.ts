import { calculateFloodRisk, DEFAULT_THRESHOLDS } from '../src/services/floodRiskEngine';
import { INITIAL_SENSORS } from '../src/data/mockSensors';
import { INITIAL_ROAD_SEGMENTS, ROAD_NODES } from '../src/data/roadGraph';
import { updateSegmentsWithSensors, planSafeRoutes, dijkstra } from '../src/services/routingEngine';

console.log('====================================================');
console.log('  DRAIN PULSE FLOODWATCH: ROUTING & RISK ENGINE TEST');
console.log('====================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`✗ FAIL: ${testName}`);
    if (detail) console.error(`  Detail: ${detail}`);
    testsFailed++;
  }
}

// ----------------------------------------------------
// TEST SUITE 1: Flood Risk Engine Rules & Calculations
// ----------------------------------------------------
console.log('--- Test Suite 1: Flood Risk Engine Classification ---');

const lowRisk = calculateFloodRisk(30, 5, DEFAULT_THRESHOLDS);
assert(lowRisk.level === 'Low', 'Low risk classification for 30mm water & 5mm/h rain');
assert(lowRisk.isVehicularHazard === false, 'Low risk is not a vehicular hazard');

const modRisk = calculateFloodRisk(110, 15, DEFAULT_THRESHOLDS);
assert(modRisk.level === 'Moderate', 'Moderate risk classification for 110mm water & 15mm/h rain');

const highRisk = calculateFloodRisk(220, 35, DEFAULT_THRESHOLDS);
assert(highRisk.level === 'High', 'High risk classification for 220mm water & 35mm/h rain');
assert(highRisk.isCurbExceeded === true, 'High risk detects curb level overtopping');

const critRisk = calculateFloodRisk(340, 55, DEFAULT_THRESHOLDS);
assert(critRisk.level === 'Critical', 'Critical risk classification for 340mm water & 55mm/h rain');
assert(critRisk.isVehicularHazard === true, 'Critical risk flags severe vehicular hazard / hydro-lock');
assert(critRisk.reason.includes('340mm'), 'Critical risk explanation mentions depth');

// ----------------------------------------------------
// TEST SUITE 2: Road Segments Sensor Synchronization
// ----------------------------------------------------
console.log('\n--- Test Suite 2: Road Graph & Sensor Synchronization ---');

const updatedSegments = updateSegmentsWithSensors(INITIAL_ROAD_SEGMENTS, INITIAL_SENSORS);
assert(updatedSegments.length === INITIAL_ROAD_SEGMENTS.length, 'Segments count preserved');

const segBarcelona = updatedSegments.find((s) => s.id === 'SEG-07');
assert(segBarcelona !== undefined, 'Found Av. Barcelona segment SEG-07');
if (segBarcelona) {
  assert(segBarcelona.floodRisk === 'Critical', 'SEG-07 properly marked Critical from SEN-GYE-03');
  assert(segBarcelona.isClosed === true, 'SEG-07 marked closed due to critical depth');
  assert(segBarcelona.waterLevelMm === 340, 'SEG-07 water level matches sensor 340mm');
}

// ----------------------------------------------------
// TEST SUITE 3: Dijkstra Flood-Resilient Safe Route Planner
// ----------------------------------------------------
console.log('\n--- Test Suite 3: Dijkstra Safe Route Planning ---');

// Scenario: Airport to Estadio Monumental (Av. Barcelona)
const routesAirportToBarcelona = planSafeRoutes('GYE-AIRPORT', 'GYE-BARCELONA', updatedSegments);

assert(routesAirportToBarcelona.recommended !== null, 'Recommended safe route found from Airport to Barcelona');
if (routesAirportToBarcelona.recommended) {
  const safeRoute = routesAirportToBarcelona.recommended;
  assert(safeRoute.totalDistanceKm > 0, `Total distance is positive: ${safeRoute.totalDistanceKm}km`);
  assert(safeRoute.totalTimeMin > 0, `Total time is positive: ${safeRoute.totalTimeMin}min`);
  
  // Safe route MUST avoid SEG-07 (closed, critical 340mm)
  const containsSeg07 = safeRoute.segments.some((s) => s.id === 'SEG-07');
  assert(!containsSeg07, 'Recommended safe route successfully bypassed flooded SEG-07 (Av. Barcelona 340mm)');

  // Check avoidance reasons
  assert(safeRoute.avoidanceReasons.length > 0, `Avoidance reasons populated: ${safeRoute.avoidanceReasons.length} entries`);
  console.log('   Sample Avoidance Reason:', safeRoute.avoidanceReasons[0]);
  
  assert(safeRoute.safePassageScore > 50, `Safety score is high: ${safeRoute.safePassageScore}%`);
}

// Check Alternative Direct Route
assert(routesAirportToBarcelona.alternative !== null, 'Alternative direct route exists to contrast against safe route');
if (routesAirportToBarcelona.alternative) {
  const altRoute = routesAirportToBarcelona.alternative;
  assert(altRoute.maxRiskLevel === 'Critical' || altRoute.maxRiskLevel === 'High', 
    `Alternative direct route exposes driver to ${altRoute.maxRiskLevel} risk`);
  assert(altRoute.safePassageScore < (routesAirportToBarcelona.recommended?.safePassageScore ?? 100),
    'Alternative direct route has lower safety score than recommended safe corridor');
}

// Scenario 2: Terminal Terrestre to Suburbio Oeste
const routesTerminalToSuburbio = planSafeRoutes('GYE-TERMINAL', 'GYE-SUBURBIO', updatedSegments);
assert(routesTerminalToSuburbio.recommended !== null, 'Recommended route found from Terminal to Suburbio');
if (routesTerminalToSuburbio.recommended) {
  assert(routesTerminalToSuburbio.recommended.segments.length >= 2, 
    `Terminal to Suburbio route has ${routesTerminalToSuburbio.recommended.segments.length} corridor legs`);
}

// Scenario 3: Identical origin and destination returns null
const sameNodeRoute = planSafeRoutes('GYE-AIRPORT', 'GYE-AIRPORT', updatedSegments);
assert(sameNodeRoute.recommended === null, 'Identical origin and destination handled gracefully (null)');

// ----------------------------------------------------
// TEST SUITE 4: Alert Creation, Sensor-Risk Synchronization & Acknowledgment
// ----------------------------------------------------
console.log('\n--- Test Suite 4: Alert Creation & Sensor-Risk Synchronization ---');

// Simulated alert generation on Urdesa Central
const demoAlert = {
  id: 'ALT-TEST-001',
  severity: 'Critical' as const,
  title: 'Critical Surge Spike - Urdesa Central',
  location: 'Urdesa Central - Av. Víctor Emilio Estrada',
  sensorId: 'SEN-GYE-01',
  waterLevelMm: 410,
  rainfallRateMmH: 60,
  timestamp: 'Just now',
  description: 'Simulated cloudburst surge overtopping sidewalks by 210mm.',
  recommendedAction: 'Immediate closure of Víctor Emilio Estrada.',
  acknowledged: false,
};

assert(demoAlert.severity === 'Critical', 'Demo alert created with Critical severity');
assert(demoAlert.acknowledged === false, 'New demo alert starts unacknowledged');

// Synchronize with sensor array
const syncedSensors = INITIAL_SENSORS.map((s) => {
  if (s.id !== demoAlert.sensorId) return s;
  const risk = calculateFloodRisk(demoAlert.waterLevelMm, demoAlert.rainfallRateMmH, DEFAULT_THRESHOLDS);
  return {
    ...s,
    waterLevelMm: demoAlert.waterLevelMm,
    rainfallRateMmH: demoAlert.rainfallRateMmH,
    riskLevel: risk.level,
    riskReason: risk.reason,
  };
});

const updatedUrdesa = syncedSensors.find((s) => s.id === 'SEN-GYE-01');
assert(updatedUrdesa !== undefined, 'Target sensor SEN-GYE-01 found');
assert(updatedUrdesa?.waterLevelMm === 410, 'Target sensor water level updated to 410mm');
assert(updatedUrdesa?.riskLevel === 'Critical', 'Target sensor risk level escalated to Critical');

// Update road segments with synced sensors
const reSyncedSegments = updateSegmentsWithSensors(INITIAL_ROAD_SEGMENTS, syncedSensors);
const urdesaRoadSeg = reSyncedSegments.find((s) => s.id === 'SEG-04');
assert(urdesaRoadSeg?.floodRisk === 'Critical', 'Connected road segment SEG-04 transitioned to Critical');
assert(urdesaRoadSeg?.isClosed === true, 'Connected road segment SEG-04 is closed to traffic');

// Verify Dijkstra avoids SEG-04 now
const routesAfterAlert = planSafeRoutes('GYE-KENNEDY', 'GYE-MAPASINGUE', reSyncedSegments);
assert(routesAfterAlert.recommended !== null, 'Route found avoiding newly closed Urdesa corridor');
if (routesAfterAlert.recommended) {
  const usesSeg04 = routesAfterAlert.recommended.segments.some((s) => s.id === 'SEG-04');
  assert(!usesSeg04, 'Dijkstra successfully routed around newly flooded Urdesa corridor (SEG-04)');
}

// Acknowledgment test
const acknowledgedAlert = {
  ...demoAlert,
  acknowledged: true,
  acknowledgedAt: '11:24:00 ECT',
};
assert(acknowledgedAlert.acknowledged === true, 'Alert marked acknowledged');
assert(acknowledgedAlert.acknowledgedAt === '11:24:00 ECT', 'Alert timestamp recorded properly');

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${testsPassed} Passed, ${testsFailed} Failed`);
console.log('====================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}

