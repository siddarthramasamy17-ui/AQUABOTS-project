import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { RoadNode, RoadSegment, CalculatedRoute, RiskLevel } from '../types';
import { ROAD_NODES } from '../data/roadGraph';
import { planSafeRoutes } from '../services/routingEngine';
import { getRiskColorClass } from '../services/floodRiskEngine';
import {
  Navigation,
  ArrowRightLeft,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Compass,
  CheckCircle2,
  AlertOctagon,
  Info,
  Car,
} from 'lucide-react';

interface SafeRoutePlannerProps {
  roadSegments: RoadSegment[];
  initialStartNodeId?: string;
}

export const SafeRoutePlanner: React.FC<SafeRoutePlannerProps> = ({
  roadSegments,
  initialStartNodeId,
}) => {
  const [startNodeId, setStartNodeId] = useState<string>(initialStartNodeId || 'GYE-AIRPORT');
  const [endNodeId, setEndNodeId] = useState<string>('GYE-BARCELONA');
  const [selectedRouteType, setSelectedRouteType] = useState<'recommended' | 'alternative'>('recommended');

  const [routes, setRoutes] = useState<{
    recommended: CalculatedRoute | null;
    alternative: CalculatedRoute | null;
  }>({ recommended: null, alternative: null });

  // Map Refs
  const routeMapContainerRef = useRef<HTMLDivElement>(null);
  const routeMapRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);

  // Recalculate routes on change
  useEffect(() => {
    if (startNodeId && endNodeId && startNodeId !== endNodeId) {
      const calculated = planSafeRoutes(startNodeId, endNodeId, roadSegments);
      setRoutes(calculated);
      setSelectedRouteType('recommended');
    } else {
      setRoutes({ recommended: null, alternative: null });
    }
  }, [startNodeId, endNodeId, roadSegments]);

  // Initialize Route Leaflet Map
  useEffect(() => {
    if (!routeMapContainerRef.current) return;
    if (routeMapRef.current) return;

    const map = L.map(routeMapContainerRef.current, {
      center: [-2.18, -79.9],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    // Keyless Dark Canvas Basemap (Zero API Key Required, No Watermarks)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ | Free Keyless Basemap',
        maxZoom: 16,
      }
    ).addTo(map);

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '',
        maxZoom: 16,
        opacity: 0.75,
      }
    ).addTo(map);

    routeLayersRef.current = L.layerGroup().addTo(map);
    routeMapRef.current = map;

    // Handle container resize & invalidation
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (routeMapContainerRef.current) {
      resizeObserver.observe(routeMapContainerRef.current);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      routeMapRef.current = null;
    };
  }, []);

  // Update Route Polylines and Markers on Leaflet Map
  useEffect(() => {
    if (!routeMapRef.current || !routeLayersRef.current) return;
    routeLayersRef.current.clearLayers();

    const activeRoute =
      selectedRouteType === 'recommended' ? routes.recommended : routes.alternative;

    // Draw alternative in background if available
    if (routes.alternative && selectedRouteType === 'recommended') {
      const altPoly = L.polyline(routes.alternative.allCoordinates, {
        color: '#f59e0b',
        weight: 3,
        opacity: 0.5,
        dashArray: '5, 8',
      });
      altPoly.bindTooltip('Alternative Route (Traverses wet sectors)', { sticky: true });
      routeLayersRef.current.addLayer(altPoly);
    }

    // Draw active route
    if (activeRoute && activeRoute.allCoordinates.length > 0) {
      const color = selectedRouteType === 'recommended' ? '#10b981' : '#f59e0b';
      const mainPoly = L.polyline(activeRoute.allCoordinates, {
        color,
        weight: 6,
        opacity: 0.9,
      });
      routeLayersRef.current.addLayer(mainPoly);

      // Start Marker
      const startCoord = activeRoute.allCoordinates[0];
      const startIcon = L.divIcon({
        className: 'route-start-icon',
        html: `<div class="flex items-center justify-center h-6 w-6 rounded-full bg-sky-500 border-2 border-white shadow-lg text-slate-950 font-bold text-[10px]">A</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const startMarker = L.marker(startCoord, { icon: startIcon });
      startMarker.bindTooltip('Origin: ' + ROAD_NODES.find((n) => n.id === startNodeId)?.name);
      routeLayersRef.current.addLayer(startMarker);

      // End Marker
      const endCoord = activeRoute.allCoordinates[activeRoute.allCoordinates.length - 1];
      const endIcon = L.divIcon({
        className: 'route-end-icon',
        html: `<div class="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500 border-2 border-white shadow-lg text-slate-950 font-bold text-[10px]">B</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const endMarker = L.marker(endCoord, { icon: endIcon });
      endMarker.bindTooltip('Destination: ' + ROAD_NODES.find((n) => n.id === endNodeId)?.name);
      routeLayersRef.current.addLayer(endMarker);

      // Fit map bounds
      const bounds = L.latLngBounds(activeRoute.allCoordinates);
      routeMapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [routes, selectedRouteType, startNodeId, endNodeId]);

  const handleSwap = () => {
    setStartNodeId(endNodeId);
    setEndNodeId(startNodeId);
  };

  const activeRoute =
    selectedRouteType === 'recommended' ? routes.recommended : routes.alternative;

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Safe Emergency Route Intelligence
            </h1>
            <span className="rounded bg-sky-950 px-2 py-0.5 text-[10px] font-semibold text-sky-300 border border-sky-800">
              Dijkstra Risk-Penalized
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Calculates flood-resilient routes across Guayaquil, dynamically routing around submerged corridors and high-risk tidal basins.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg shrink-0">
          <AlertTriangle className="h-4 w-4" />
          <span>DEMO SIMULATION: Synthetic Graph</span>
        </div>
      </div>

      {/* Main Grid: Controls & Routes on Left, Map on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Route Configuration & Results (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Waypoints Selection Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Waypoint Corridors
            </span>

            {/* Origin Select */}
            <div>
              <label className="block text-[11px] font-semibold text-sky-400 mb-1">
                Start Point (Origin)
              </label>
              <select
                value={startNodeId}
                onChange={(e) => setStartNodeId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-sky-500 focus:outline-none"
              >
                {ROAD_NODES.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name} ({node.zone})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1">
              <button
                onClick={handleSwap}
                className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] text-slate-300 transition hover:bg-slate-700 hover:text-white"
                title="Swap origin and destination"
              >
                <ArrowRightLeft className="h-3 w-3" />
                <span>Swap Directions</span>
              </button>
            </div>

            {/* Destination Select */}
            <div>
              <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
                Destination Point
              </label>
              <select
                value={endNodeId}
                onChange={(e) => setEndNodeId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-sky-500 focus:outline-none"
              >
                {ROAD_NODES.map((node) => (
                  <option key={node.id} value={node.id} disabled={node.id === startNodeId}>
                    {node.name} ({node.zone})
                  </option>
                ))}
              </select>
            </div>

            {/* Preset Scenarios */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1.5">
                Quick Test Scenarios:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setStartNodeId('GYE-AIRPORT');
                    setEndNodeId('GYE-BARCELONA');
                  }}
                  className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  Airport ➔ Barcelona (Estadio)
                </button>
                <button
                  onClick={() => {
                    setStartNodeId('GYE-TERMINAL');
                    setEndNodeId('GYE-SUBURBIO');
                  }}
                  className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  Terminal ➔ Suburbio
                </button>
                <button
                  onClick={() => {
                    setStartNodeId('GYE-KENNEDY');
                    setEndNodeId('GYE-CENTRO');
                  }}
                  className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  Kennedy ➔ Centro 9 Octubre
                </button>
              </div>
            </div>
          </div>

          {/* Route Comparison Selector */}
          {routes.recommended ? (
            <div className="space-y-3">
              {/* Recommended Route Card */}
              <div
                onClick={() => setSelectedRouteType('recommended')}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedRouteType === 'recommended'
                    ? 'border-emerald-500 bg-emerald-950/30 shadow-lg ring-1 ring-emerald-500/50'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <span className="font-bold text-white text-sm">
                      Recommended Safe Route
                    </span>
                  </div>
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800">
                    Safe Score: {routes.recommended.safePassageScore}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Distance</span>
                    <span className="font-mono font-bold text-slate-100">
                      {routes.recommended.totalDistanceKm} km
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Est. Time</span>
                    <span className="font-mono font-bold text-emerald-300">
                      {routes.recommended.totalTimeMin} mins
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Peak Risk</span>
                    <span
                      className={`font-semibold ${
                        getRiskColorClass(routes.recommended.maxRiskLevel).text
                      }`}
                    >
                      {routes.recommended.maxRiskLevel}
                    </span>
                  </div>
                </div>

                {/* Avoidance Explanations */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-2">
                  <div className="font-semibold text-emerald-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Avoided Hazard Corridors ({routes.recommended.avoidanceReasons.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Dijkstra Pruned</span>
                  </div>

                  {routes.recommended.avoidanceDetails && routes.recommended.avoidanceDetails.length > 0 ? (
                    <div className="space-y-1.5">
                      {routes.recommended.avoidanceDetails.map((detail, idx) => {
                        const colors = getRiskColorClass(detail.riskLevel);
                        return (
                          <div
                            key={idx}
                            className="rounded-lg bg-slate-950 p-2.5 border border-slate-800 text-[11px] space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-[11px]">
                                {detail.segmentName}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-semibold text-slate-300">
                                  {detail.waterLevelMm}mm
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.2 text-[9px] font-bold border ${colors.badgeBg}`}
                                >
                                  {detail.riskLevel}
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug">
                              {detail.reason}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {routes.recommended.avoidanceReasons.map((reason, idx) => (
                        <p
                          key={idx}
                          className="leading-snug text-slate-400 pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-emerald-400"
                        >
                          {reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Alternative Route Card (if direct path differed) */}
              {routes.alternative && (
                <div
                  onClick={() => setSelectedRouteType('alternative')}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedRouteType === 'alternative'
                      ? 'border-amber-500 bg-amber-950/30 shadow-lg ring-1 ring-amber-500/50'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="h-5 w-5 text-amber-400" />
                      <span className="font-bold text-white text-sm">
                        Direct Corridor (Flooded)
                      </span>
                    </div>
                    <span className="rounded bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-800">
                      Score: {routes.alternative.safePassageScore}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Distance</span>
                      <span className="font-mono font-bold text-slate-100">
                        {routes.alternative.totalDistanceKm} km
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Est. Delay Time</span>
                      <span className="font-mono font-bold text-amber-300">
                        {routes.alternative.totalTimeMin} mins
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Peak Risk</span>
                      <span className="font-bold text-red-400">
                        {routes.alternative.maxRiskLevel} Risk
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-amber-300/90 space-y-1">
                    <div className="font-semibold text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Why this route is dangerous:</span>
                    </div>
                    {routes.alternative.avoidanceReasons.map((reason, idx) => (
                      <p key={idx} className="leading-snug text-slate-400 pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-amber-400">
                        {reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Road Segments Accordion */}
              {activeRoute && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs space-y-2">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                    Corridor Itinerary ({activeRoute.segments.length} Legs)
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {activeRoute.segments.map((seg, idx) => (
                      <div
                        key={seg.id}
                        className="flex items-center justify-between rounded bg-slate-800/60 p-2 text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 font-bold">
                            {idx + 1}.
                          </span>
                          <span className="text-slate-200 font-medium">{seg.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">{seg.distanceKm}km</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                              getRiskColorClass(seg.floodRisk).badgeBg
                            }`}
                          >
                            {seg.floodRisk}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center text-xs text-slate-400">
              <Navigation className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <span>Select origin and destination to calculate Dijkstra flood-penalized path.</span>
            </div>
          )}
        </div>

        {/* Right Column: Route Leaflet Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[520px] rounded-xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/80 text-xs">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-sky-400" />
              <span className="font-semibold text-white">Route Visualizer</span>
              <span className="text-slate-500">· Guayaquil Network</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-emerald-500"></span>
                <span className="text-slate-300">Safe Corridor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-amber-500 border border-dashed border-amber-300"></span>
                <span className="text-slate-400">Flooded Direct</span>
              </div>
            </div>
          </div>

          <div className="relative flex-1 w-full h-full">
            <div ref={routeMapContainerRef} className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
