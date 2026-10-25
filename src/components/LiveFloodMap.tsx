import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  SensorNode,
  RiskLevel,
  RoadSegment,
  SensorStatus,
} from '../types';
import { getRiskColorClass } from '../services/floodRiskEngine';
import {
  Layers,
  Filter,
  AlertTriangle,
  Radio,
  X,
  Droplets,
  ExternalLink,
} from 'lucide-react';

interface LiveFloodMapProps {
  sensors: SensorNode[];
  roadSegments: RoadSegment[];
  selectedSensor: SensorNode | null;
  onSelectSensor: (sensor: SensorNode | null) => void;
  onUpdateSensorWater: (sensorId: string, deltaMm: number) => void;
  onOpenRoutePlannerWithNode?: (sensorId: string) => void;
}

export const LiveFloodMap: React.FC<LiveFloodMapProps> = ({
  sensors,
  roadSegments,
  selectedSensor,
  onSelectSensor,
  onUpdateSensorWater,
  onOpenRoutePlannerWithNode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);
  const roadsLayerRef = useRef<L.LayerGroup | null>(null);

  // Filters & Layers
  const [riskFilter, setRiskFilter] = useState<'All' | RiskLevel>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | SensorStatus>('All');
  const [showRings, setShowRings] = useState<boolean>(true);
  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [basemapStyle, setBasemapStyle] = useState<'dark' | 'osm'>('dark');

  const baseLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already created

    // Centered on Guayaquil
    const map = L.map(mapContainerRef.current, {
      center: [-2.1894, -79.8891],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    baseLayerGroupRef.current = L.layerGroup().addTo(map);

    // Initial Dark Basemap (Keyless, Zero Watermarks)
    const baseDark = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16,
      }
    );
    const refLabels = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '',
        maxZoom: 16,
        opacity: 0.75,
      }
    );

    baseLayerGroupRef.current.addLayer(baseDark);
    baseLayerGroupRef.current.addLayer(refLabels);

    markersLayerRef.current = L.layerGroup().addTo(map);
    circlesLayerRef.current = L.layerGroup().addTo(map);
    roadsLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Handle container resize & invalidation
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap when toggled
  useEffect(() => {
    if (!baseLayerGroupRef.current) return;
    baseLayerGroupRef.current.clearLayers();

    if (basemapStyle === 'dark') {
      const baseDark = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ | Free Keyless Basemap',
          maxZoom: 16,
        }
      );
      const refLabels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '',
          maxZoom: 16,
          opacity: 0.75,
        }
      );
      baseLayerGroupRef.current.addLayer(baseDark);
      baseLayerGroupRef.current.addLayer(refLabels);
    } else {
      const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Free Keyless Basemap',
        maxZoom: 19,
      });
      baseLayerGroupRef.current.addLayer(osmLayer);
    }
  }, [basemapStyle]);

  // Update Road Corridors Layer
  useEffect(() => {
    if (!roadsLayerRef.current) return;
    roadsLayerRef.current.clearLayers();

    if (!showRoads) return;

    roadSegments.forEach((segment) => {
      const color =
        segment.floodRisk === 'Critical'
          ? '#ef4444'
          : segment.floodRisk === 'High'
          ? '#f59e0b'
          : segment.floodRisk === 'Moderate'
          ? '#38bdf8'
          : '#10b981';

      const polyline = L.polyline(segment.pathCoordinates, {
        color,
        weight: segment.floodRisk === 'Critical' ? 5 : 4,
        opacity: 0.85,
        dashArray: segment.isClosed ? '6, 8' : undefined,
      });

      polyline.bindTooltip(
        `<div class="text-xs font-sans">
          <strong>${segment.name}</strong><br/>
          Risk: <span style="color:${color};font-weight:bold">${segment.floodRisk}</span> (${segment.waterLevelMm}mm)
          ${segment.isClosed ? '<br/><span style="color:#ef4444;font-weight:bold">ROAD CLOSED</span>' : ''}
          <div style="font-size:10px;color:#94a3b8;margin-top:2px;">[DEMO SIMULATION]</div>
        </div>`,
        { sticky: true }
      );

      roadsLayerRef.current?.addLayer(polyline);
    });
  }, [roadSegments, showRoads]);

  // Update Sensor Markers & Hazard Rings Layer
  useEffect(() => {
    if (!markersLayerRef.current || !circlesLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();
    circlesLayerRef.current.clearLayers();

    const filteredSensors = sensors.filter((s) => {
      if (riskFilter !== 'All' && s.riskLevel !== riskFilter) return false;
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      return true;
    });

    filteredSensors.forEach((sensor) => {
      const colors = getRiskColorClass(sensor.riskLevel);
      const isCritical = sensor.riskLevel === 'Critical';
      const isSelected = selectedSensor?.id === sensor.id;

      // Hazard circle
      if (showRings) {
        const radius = Math.min(600, Math.max(120, sensor.waterLevelMm * 1.5));
        const circle = L.circle([sensor.lat, sensor.lng], {
          color: colors.markerColor,
          fillColor: colors.markerColor,
          fillOpacity: isCritical ? 0.28 : 0.16,
          radius,
          weight: isCritical ? 2 : 1,
        });
        circlesLayerRef.current?.addLayer(circle);
      }

      // Marker Icon SVG
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
          ${
            isCritical
              ? `<div class="absolute -inset-2 rounded-full bg-red-500/30 animate-ping"></div>`
              : ''
          }
          <div class="h-8 w-8 rounded-full flex items-center justify-center shadow-lg border-2" 
               style="background-color: #0f172a; border-color: ${colors.markerColor}; ${
        isSelected ? 'box-shadow: 0 0 0 3px #38bdf8;' : ''
      }">
            <span class="text-[10px] font-mono font-bold" style="color: ${colors.markerColor};">
              ${sensor.waterLevelMm}
            </span>
          </div>
          <div class="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border border-slate-900" 
               style="background-color: ${sensor.status === 'Active' ? '#10b981' : '#f59e0b'};">
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-sensor-icon',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([sensor.lat, sensor.lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectSensor(sensor);
      });

      // Hover tooltip
      marker.bindTooltip(
        `<div class="p-1 text-xs">
          <div class="font-bold text-white">${sensor.name}</div>
          <div class="text-slate-300">Water Depth: <span style="color:${colors.markerColor};font-weight:600">${sensor.waterLevelMm} mm</span></div>
          <div class="text-slate-400">Risk: ${sensor.riskLevel} · Rain: ${sensor.rainfallRateMmH} mm/h</div>
          <div style="font-size:9px;color:#f59e0b;font-weight:600;margin-top:2px;">[DEMO SIMULATION]</div>
        </div>`,
        { direction: 'top', offset: [0, -16] }
      );

      // Detailed Click Popup
      const popupHtml = `
        <div style="font-family:'Plus Jakarta Sans',sans-serif; min-width: 230px; padding: 4px 6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <span style="font-family:monospace; font-weight:700; color:#38bdf8; font-size:12px;">${sensor.id}</span>
            <span style="font-size:10px; font-weight:700; padding: 2px 6px; border-radius: 4px; background-color:${colors.markerColor}22; color:${colors.markerColor}; border:1px solid ${colors.markerColor}55;">
              ${sensor.riskLevel} Risk
            </span>
          </div>
          <div style="font-weight:700; color:#ffffff; font-size:13px; line-height:1.2; margin-bottom: 2px;">
            ${sensor.name}
          </div>
          <div style="font-size:11px; color:#94a3b8; margin-bottom: 8px;">
            ${sensor.neighborhood} · [${sensor.lat.toFixed(4)}, ${sensor.lng.toFixed(4)}]
          </div>

          <div style="background:#090d16; border:1px solid #1e293b; border-radius:6px; padding:6px 8px; margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:3px;">
              <span style="color:#94a3b8;">Water Level:</span>
              <strong style="color:#ffffff; font-family:monospace;">${sensor.waterLevelMm} mm</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:3px;">
              <span style="color:#94a3b8;">Rainfall Rate:</span>
              <strong style="color:#38bdf8; font-family:monospace;">${sensor.rainfallRateMmH.toFixed(1)} mm/h</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:3px;">
              <span style="color:#94a3b8;">Basin Elevation:</span>
              <span style="color:#cbd5e1; font-family:monospace;">${sensor.elevationMeters}m MSL</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:10px; color:#64748b;">
              <span>Status: <strong style="color:#10b981;">${sensor.status}</strong></span>
              <span>Bat: ${sensor.batteryPct}%</span>
            </div>
          </div>

          <div style="font-size:10px; color:#94a3b8; line-height:1.3; margin-bottom:6px;">
            ${sensor.riskReason}
          </div>

          <div style="font-size:9px; color:#f59e0b; font-weight:600; text-align:center; padding:3px 0; border-top:1px solid #1e293b;">
            DEMO SIMULATION · Synthetic Telemetry
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 280,
        className: 'custom-leaflet-popup',
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [sensors, riskFilter, statusFilter, showRings, selectedSensor]);

  // Center on selected sensor when chosen
  useEffect(() => {
    if (selectedSensor && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedSensor.lat, selectedSensor.lng], 14, {
        duration: 1.2,
      });
    }
  }, [selectedSensor]);

  return (
    <div className="relative flex h-[calc(100vh-65px)] w-full flex-col overflow-hidden bg-slate-950">
      {/* Top Filter and Layer Bar */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 backdrop-blur-md text-xs">
        {/* Risk Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-400 font-medium flex items-center gap-1 mr-1 shrink-0">
            <Filter className="h-3.5 w-3.5" />
            <span>Risk:</span>
          </span>
          {(['All', 'Critical', 'High', 'Moderate', 'Low'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setRiskFilter(lvl)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                riskFilter === lvl
                  ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Layer Toggles & Demo Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowRings(!showRings)}
            className={`flex items-center gap-1 rounded px-2.5 py-1 transition ${
              showRings
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Catchment Rings</span>
          </button>

          <button
            onClick={() => setShowRoads(!showRoads)}
            className={`flex items-center gap-1 rounded px-2.5 py-1 transition ${
              showRoads
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Radio className="h-3 w-3" />
            <span>Road Status</span>
          </button>

          {/* Keyless Basemap Selector */}
          <div className="flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-[11px]">
            <button
              onClick={() => setBasemapStyle('dark')}
              className={`rounded px-2 py-0.5 font-medium transition ${
                basemapStyle === 'dark'
                  ? 'bg-slate-700 text-sky-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Keyless Dark Canvas (Esri)"
            >
              Dark
            </button>
            <button
              onClick={() => setBasemapStyle('osm')}
              className={`rounded px-2 py-0.5 font-medium transition ${
                basemapStyle === 'osm'
                  ? 'bg-slate-700 text-sky-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="OpenStreetMap Street View"
            >
              OSM
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-300 font-medium">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <span>DEMO SIMULATION</span>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-5 left-4 z-[1000] rounded-xl border border-slate-800 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md text-[11px] text-slate-300 max-w-xs">
          <div className="font-semibold text-white mb-2 flex items-center justify-between">
            <span>Flood Risk Legend</span>
            <span className="text-[10px] text-slate-500 font-mono">mm Water</span>
          </div>
          <div className="space-y-1.5 font-medium">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500"></span>
                <span>Critical (Impassable)</span>
              </div>
              <span className="font-mono text-red-400">&gt;300mm</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                <span>High (Curb Spillover)</span>
              </div>
              <span className="font-mono text-amber-400">151-300mm</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-sky-500"></span>
                <span>Moderate (Gutter Pooling)</span>
              </div>
              <span className="font-mono text-sky-400">51-150mm</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                <span>Low (Nominal Runoff)</span>
              </div>
              <span className="font-mono text-emerald-400">&le;50mm</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 leading-tight">
            Click any sensor marker or road segment to inspect live hydrological readings.
          </div>
        </div>

        {/* Selected Sensor Inspection Drawer */}
        {selectedSensor && (
          <div className="absolute top-4 right-4 z-[1000] w-88 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-sky-400">
                    {selectedSensor.id}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                      getRiskColorClass(selectedSensor.riskLevel).badgeBg
                    }`}
                  >
                    {selectedSensor.riskLevel} Risk
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm mt-0.5 leading-snug">
                  {selectedSensor.name}
                </h3>
                <p className="text-[11px] text-slate-400">{selectedSensor.neighborhood}</p>
              </div>
              <button
                onClick={() => onSelectSensor(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Gauge & Metrics */}
            <div className="my-3 space-y-3">
              {/* Water Depth Progress */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5 text-sky-400" />
                    <span>Water Depth:</span>
                  </span>
                  <span className="font-mono font-bold text-slate-100 tabular-nums">
                    {selectedSensor.waterLevelMm} mm / max {selectedSensor.drainageCapacityMm} mm
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      selectedSensor.riskLevel === 'Critical'
                        ? 'bg-red-500'
                        : selectedSensor.riskLevel === 'High'
                        ? 'bg-amber-500'
                        : selectedSensor.riskLevel === 'Moderate'
                        ? 'bg-sky-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (selectedSensor.waterLevelMm / 350) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Rain Rate & Elevation Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-slate-800/60 p-2 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Rainfall Rate</span>
                  <span className="font-mono font-semibold text-sky-300 text-sm">
                    {selectedSensor.rainfallRateMmH.toFixed(1)} mm/h
                  </span>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-2 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Basin Elevation</span>
                  <span className="font-mono font-semibold text-slate-200 text-sm">
                    {selectedSensor.elevationMeters}m MSL
                  </span>
                </div>
              </div>

              {/* Hydrological Assessment */}
              <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800 text-[11px] leading-relaxed">
                <span className="font-semibold text-slate-300 block mb-0.5">
                  Civil Defense Analysis:
                </span>
                <p className="text-slate-400">{selectedSensor.riskReason}</p>
              </div>

              {/* Hardware Health */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                <span>Battery: {selectedSensor.batteryPct}%</span>
                <span>Signal: {selectedSensor.signalStrengthDbm} dBm</span>
                <span className="text-emerald-400">Status: {selectedSensor.status}</span>
              </div>
            </div>

            {/* Quick Demo Controls on this sensor */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Demo Simulation Controls
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateSensorWater(selectedSensor.id, 60)}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/20 active:scale-95"
                >
                  +60mm Surge Spike
                </button>
                <button
                  onClick={() => onUpdateSensorWater(selectedSensor.id, -60)}
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20 active:scale-95"
                >
                  Drain Recede (-60mm)
                </button>
              </div>

              {onOpenRoutePlannerWithNode && (
                <button
                  onClick={() => onOpenRoutePlannerWithNode(selectedSensor.id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 py-1.5 text-[11px] font-medium text-sky-300 transition hover:bg-sky-500/20"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Calculate Safe Route Around This Node</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
