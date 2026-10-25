import { AvoidanceDetail, CalculatedRoute, RiskLevel, RoadSegment, SensorNode } from '../types';
import { ROAD_NODES } from '../data/roadGraph';

interface GraphEdge {
  targetNodeId: string;
  segment: RoadSegment;
  weight: number;
}

/**
 * Synchronizes road segments with active sensor measurements.
 */
export function updateSegmentsWithSensors(
  segments: RoadSegment[],
  sensors: SensorNode[]
): RoadSegment[] {
  const sensorMap = new Map(sensors.map((s) => [s.id, s]));

  return segments.map((seg) => {
    if (!seg.sensorIdNearby) return seg;
    const sensor = sensorMap.get(seg.sensorIdNearby);
    if (!sensor) return seg;

    return {
      ...seg,
      floodRisk: sensor.riskLevel,
      waterLevelMm: sensor.waterLevelMm,
      isClosed: sensor.riskLevel === 'Critical',
      closureReason:
        sensor.riskLevel === 'Critical'
          ? `Severe flood hazard (${sensor.waterLevelMm}mm water depth). Impassable.`
          : sensor.riskLevel === 'High'
          ? `Waterlogged roadway (${sensor.waterLevelMm}mm). Heavy resistance.`
          : undefined,
    };
  });
}

/**
 * Builds an adjacency list for the road graph with risk-weighted penalties.
 */
export function buildAdjacencyList(
  segments: RoadSegment[],
  mode: 'safe' | 'direct'
): Map<string, GraphEdge[]> {
  const adj = new Map<string, GraphEdge[]>();

  for (const node of ROAD_NODES) {
    adj.set(node.id, []);
  }

  for (const seg of segments) {
    let weight = seg.baseTimeMin;

    if (mode === 'safe') {
      // Risk penalties for flood avoidance: heavy penalty on waterlogged / closed edges
      if (seg.isClosed || seg.floodRisk === 'Critical') {
        weight = 10000 + seg.waterLevelMm * 10; // Extreme penalty to enforce bypass
      } else if (seg.floodRisk === 'High') {
        weight = weight * 4.5 + 45; // Substantial penalty
      } else if (seg.floodRisk === 'Moderate') {
        weight = weight * 1.6 + 6; // Minor delay penalty
      }
    } else {
      // Direct mode: shortest geographic corridor by distance (traverses standard surface avenues)
      weight = seg.distanceKm;
    }

    // Bidirectional road segments
    adj.get(seg.fromNodeId)?.push({ targetNodeId: seg.toNodeId, segment: seg, weight });
    adj.get(seg.toNodeId)?.push({ targetNodeId: seg.fromNodeId, segment: seg, weight });
  }

  return adj;
}

export interface DijkstraResult {
  pathSegments: RoadSegment[];
  totalTimeMin: number;
  totalDistanceKm: number;
}

/**
 * Standard Dijkstra shortest-path algorithm over the risk-weighted graph.
 */
export function dijkstra(
  startId: string,
  endId: string,
  segments: RoadSegment[],
  mode: 'safe' | 'direct'
): DijkstraResult | null {
  const adj = buildAdjacencyList(segments, mode);
  const distances = new Map<string, number>();
  const previous = new Map<string, { nodeId: string; segment: RoadSegment }>();
  const visited = new Set<string>();

  for (const node of ROAD_NODES) {
    distances.set(node.id, Infinity);
  }
  distances.set(startId, 0);

  const pq: { nodeId: string; dist: number }[] = [{ nodeId: startId, dist: 0 }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { nodeId: current, dist } = pq.shift()!;

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === endId) break;

    const neighbors = adj.get(current) || [];
    for (const edge of neighbors) {
      if (visited.has(edge.targetNodeId)) continue;
      const newDist = dist + edge.weight;
      if (newDist < (distances.get(edge.targetNodeId) ?? Infinity)) {
        distances.set(edge.targetNodeId, newDist);
        previous.set(edge.targetNodeId, { nodeId: current, segment: edge.segment });
        pq.push({ nodeId: edge.targetNodeId, dist: newDist });
      }
    }
  }

  if (distances.get(endId) === Infinity) return null;

  // Reconstruct path
  const pathSegments: RoadSegment[] = [];
  let curr = endId;
  while (curr !== startId) {
    const prevEntry = previous.get(curr);
    if (!prevEntry) break;
    pathSegments.unshift(prevEntry.segment);
    curr = prevEntry.nodeId;
  }

  const totalDistanceKm = Number(
    pathSegments.reduce((sum, s) => sum + s.distanceKm, 0).toFixed(1)
  );

  // Calculate realistic travel time based on distance & risk slowdowns
  const totalTimeMin = Math.round(
    pathSegments.reduce((sum, s) => {
      let time = s.baseTimeMin;
      if (s.floodRisk === 'Critical') time *= 3.0;
      else if (s.floodRisk === 'High') time *= 1.8;
      else if (s.floodRisk === 'Moderate') time *= 1.3;
      return sum + time;
    }, 0)
  );

  return { pathSegments, totalTimeMin, totalDistanceKm };
}

function getMaxRisk(segments: RoadSegment[]): RiskLevel {
  const risks: RiskLevel[] = segments.map((s) => s.floodRisk);
  if (risks.includes('Critical')) return 'Critical';
  if (risks.includes('High')) return 'High';
  if (risks.includes('Moderate')) return 'Moderate';
  return 'Low';
}

function calculateScore(segments: RoadSegment[]): number {
  if (segments.length === 0) return 0;
  let penalty = 0;
  for (const s of segments) {
    if (s.floodRisk === 'Critical') penalty += 45;
    else if (s.floodRisk === 'High') penalty += 20;
    else if (s.floodRisk === 'Moderate') penalty += 8;
  }
  return Math.max(10, 100 - penalty);
}

/**
 * Calculates both Recommended Safe Route and Alternative Direct Route,
 * producing structured avoidance explanations for each dangerous corridor bypassed.
 */
export function planSafeRoutes(
  startId: string,
  endId: string,
  segments: RoadSegment[]
): {
  recommended: CalculatedRoute | null;
  alternative: CalculatedRoute | null;
} {
  if (startId === endId) return { recommended: null, alternative: null };

  const safeResult = dijkstra(startId, endId, segments, 'safe');
  const directResult = dijkstra(startId, endId, segments, 'direct');

  if (!safeResult) {
    return { recommended: null, alternative: null };
  }

  // Identify segments traversed in direct route that are avoided in safe route
  const safeSegmentIds = new Set(safeResult.pathSegments.map((s) => s.id));
  const directSegmentIds = new Set(directResult?.pathSegments.map((s) => s.id) || []);

  // Avoided hazardous segments
  const avoidedSegments = segments.filter(
    (s) =>
      !safeSegmentIds.has(s.id) &&
      (directSegmentIds.has(s.id) || s.floodRisk === 'Critical' || s.floodRisk === 'High')
  );

  const avoidanceDetails: AvoidanceDetail[] = [];
  const avoidanceReasons: string[] = [];

  for (const hazard of avoidedSegments.slice(0, 4)) {
    let specificReason = '';
    if (hazard.floodRisk === 'Critical') {
      specificReason = `Bypassed ${hazard.name}: Submerged at ${hazard.waterLevelMm}mm (CRITICAL). Exceeds 200mm vehicle intake clearance; severe danger of engine hydro-lock.`;
    } else if (hazard.floodRisk === 'High') {
      specificReason = `Bypassed ${hazard.name}: Waterlogged at ${hazard.waterLevelMm}mm (HIGH). Curb overtopping creates dangerous hydroplaning currents and brake fade.`;
    } else {
      specificReason = `Bypassed ${hazard.name}: ${hazard.waterLevelMm}mm ponding (MODERATE). Avoided to prevent localized traffic delay.`;
    }

    avoidanceReasons.push(specificReason);
    avoidanceDetails.push({
      segmentId: hazard.id,
      segmentName: hazard.name,
      riskLevel: hazard.floodRisk,
      waterLevelMm: hazard.waterLevelMm,
      reason: specificReason,
    });
  }

  if (avoidanceReasons.length === 0) {
    avoidanceReasons.push('Standard low-risk transit corridors chosen across all road segments.');
  }

  // Flatten coordinates for polyline
  const safeCoords: [number, number][] = [];
  safeResult.pathSegments.forEach((seg, idx) => {
    if (idx === 0) {
      safeCoords.push(...seg.pathCoordinates);
    } else {
      safeCoords.push(...seg.pathCoordinates.slice(1));
    }
  });

  const recommended: CalculatedRoute = {
    id: 'route-safe',
    type: 'recommended',
    name: 'Flood-Resilient Safe Corridor (Recommended)',
    segments: safeResult.pathSegments,
    totalDistanceKm: safeResult.totalDistanceKm,
    totalTimeMin: safeResult.totalTimeMin,
    maxRiskLevel: getMaxRisk(safeResult.pathSegments),
    avoidanceReasons,
    avoidanceDetails,
    safePassageScore: calculateScore(safeResult.pathSegments),
    allCoordinates: safeCoords,
  };

  let alternative: CalculatedRoute | null = null;
  if (directResult) {
    const isIdentical =
      directResult.pathSegments.length === safeResult.pathSegments.length &&
      directResult.pathSegments.every((s, i) => s.id === safeResult.pathSegments[i].id);

    if (!isIdentical) {
      const directCoords: [number, number][] = [];
      directResult.pathSegments.forEach((seg, idx) => {
        if (idx === 0) directCoords.push(...seg.pathCoordinates);
        else directCoords.push(...seg.pathCoordinates.slice(1));
      });

      const altRisks = directResult.pathSegments
        .filter((s) => s.floodRisk === 'Critical' || s.floodRisk === 'High')
        .map((s) => `Traverses ${s.name} (${s.waterLevelMm}mm ponding, ${s.floodRisk} risk).`);

      alternative = {
        id: 'route-direct',
        type: 'alternative',
        name: 'Shortest Direct Corridor (Traverses Flooded Sectors)',
        segments: directResult.pathSegments,
        totalDistanceKm: directResult.totalDistanceKm,
        totalTimeMin: directResult.totalTimeMin,
        maxRiskLevel: getMaxRisk(directResult.pathSegments),
        avoidanceReasons:
          altRisks.length > 0
            ? altRisks
            : ['Alternative path with standard traffic and moderate water level.'],
        safePassageScore: calculateScore(directResult.pathSegments),
        allCoordinates: directCoords,
      };
    }
  }

  return { recommended, alternative };
}
