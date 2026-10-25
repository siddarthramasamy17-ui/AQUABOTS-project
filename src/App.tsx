import React, { useState, useEffect, useCallback } from 'react';
import {
  SensorNode,
  FloodAlert,
  RoadSegment,
  ThresholdConfig,
  WeatherData,
} from './types';
import { INITIAL_SENSORS } from './data/mockSensors';
import { INITIAL_ALERTS } from './data/mockAlerts';
import { INITIAL_ROAD_SEGMENTS } from './data/roadGraph';
import { DEFAULT_THRESHOLDS, calculateFloodRisk } from './services/floodRiskEngine';
import { updateSegmentsWithSensors } from './services/routingEngine';
import { fetchGuayaquilWeather, FALLBACK_WEATHER } from './services/weatherService';

import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { Overview } from './components/Overview';
import { LiveFloodMap } from './components/LiveFloodMap';
import { SafeRoutePlanner } from './components/SafeRoutePlanner';
import { SensorNetwork } from './components/SensorNetwork';
import { AlertsManager } from './components/AlertsManager';
import { RainfallForecast } from './components/RainfallForecast';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { SimulationModal } from './components/SimulationModal';
import { Menu, ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('map');
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [sensors, setSensors] = useState<SensorNode[]>(INITIAL_SENSORS);
  const [alerts, setAlerts] = useState<FloodAlert[]>(INITIAL_ALERTS);
  const [roadSegments, setRoadSegments] = useState<RoadSegment[]>(() =>
    updateSegmentsWithSensors(INITIAL_ROAD_SEGMENTS, INITIAL_SENSORS)
  );

  const [weather, setWeather] = useState<WeatherData | null>(FALLBACK_WEATHER);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [selectedSensor, setSelectedSensor] = useState<SensorNode | null>(null);
  const [routeStartNodeId, setRouteStartNodeId] = useState<string>('GYE-AIRPORT');
  const [isSimulationOpen, setIsSimulationOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Fetch live weather on mount
  const loadWeather = useCallback(async () => {
    setIsWeatherLoading(true);
    try {
      const data = await fetchGuayaquilWeather();
      setWeather(data);
    } catch {
      setWeather(FALLBACK_WEATHER);
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  // Keep road segments synced with sensors
  useEffect(() => {
    setRoadSegments((prev) => updateSegmentsWithSensors(prev, sensors));
  }, [sensors]);

  // Update a sensor's water level by delta
  const handleUpdateSensorWater = (sensorId: string, deltaMm: number) => {
    setSensors((prevSensors) =>
      prevSensors.map((s) => {
        if (s.id !== sensorId) return s;
        const newWater = Math.max(0, s.waterLevelMm + deltaMm);
        const risk = calculateFloodRisk(newWater, s.rainfallRateMmH, thresholds);
        const updated = {
          ...s,
          waterLevelMm: newWater,
          riskLevel: risk.level,
          riskReason: risk.reason,
          lastUpdated: new Date().toISOString(),
        };

        // If sensor entered Critical or High, trigger an alert if not already logged recently
        if (risk.level === 'Critical' && s.riskLevel !== 'Critical') {
          const newAlert: FloodAlert = {
            id: `ALT-GYE-${Math.floor(100 + Math.random() * 900)}`,
            severity: 'Critical',
            title: `Critical Surge Threshold Exceeded - ${s.neighborhood}`,
            location: s.name,
            sensorId: s.id,
            waterLevelMm: newWater,
            rainfallRateMmH: s.rainfallRateMmH,
            timestamp: 'Just now',
            description: `Sensor ${s.id} recorded water ponding of ${newWater}mm, exceeding municipal curb clearance. Immediate roadway bypass active.`,
            recommendedAction: 'Transit warning: Avoid low-lying lane corridors; divert via high-elevation arteries.',
            acknowledged: false,
          };
          setAlerts((prev) => [newAlert, ...prev]);
        }

        return updated;
      })
    );
  };

  // Set absolute water level for a sensor
  const handleSetSensorWater = (sensorId: string, waterLevelMm: number) => {
    setSensors((prevSensors) =>
      prevSensors.map((s) => {
        if (s.id !== sensorId) return s;
        const newWater = Math.max(0, waterLevelMm);
        const risk = calculateFloodRisk(newWater, s.rainfallRateMmH, thresholds);
        return {
          ...s,
          waterLevelMm: newWater,
          riskLevel: risk.level,
          riskReason: risk.reason,
          lastUpdated: new Date().toISOString(),
        };
      })
    );
  };

  // Acknowledge alert with formatted Guayaquil timestamp
  const handleAcknowledgeAlert = (alertId: string) => {
    const formattedTime =
      new Date().toLocaleTimeString('es-EC', {
        timeZone: 'America/Guayaquil',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' ECT';

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              acknowledged: true,
              acknowledgedAt: formattedTime,
            }
          : a
      )
    );
  };

  // Add new alert and synchronize with sensor node and road network risk state
  const handleAddAlert = (newAlert: FloodAlert) => {
    setAlerts((prev) => [newAlert, ...prev]);

    // Find target sensor by sensorId or matching corridor location
    const targetSensor = sensors.find(
      (s) =>
        (newAlert.sensorId && s.id === newAlert.sensorId) ||
        newAlert.location.toLowerCase().includes(s.neighborhood.toLowerCase()) ||
        newAlert.location.toLowerCase().includes(s.id.toLowerCase())
    );

    if (targetSensor) {
      setSensors((prevSensors) =>
        prevSensors.map((s) => {
          if (s.id !== targetSensor.id) return s;
          const newWater = newAlert.waterLevelMm;
          const newRain = newAlert.rainfallRateMmH;
          const risk = calculateFloodRisk(newWater, newRain, thresholds);
          return {
            ...s,
            waterLevelMm: newWater,
            rainfallRateMmH: newRain,
            riskLevel: risk.level,
            riskReason: risk.reason,
            lastUpdated: new Date().toISOString(),
          };
        })
      );
    }
  };

  // Reset data to baseline
  const handleResetData = () => {
    setSensors(INITIAL_SENSORS);
    setAlerts(INITIAL_ALERTS);
    setRoadSegments(updateSegmentsWithSensors(INITIAL_ROAD_SEGMENTS, INITIAL_SENSORS));
    setSelectedSensor(null);
  };

  // Update thresholds and recalculate risk across all nodes
  const handleUpdateThresholds = (newThresholds: ThresholdConfig) => {
    setThresholds(newThresholds);
    setSensors((prev) =>
      prev.map((s) => {
        const risk = calculateFloodRisk(s.waterLevelMm, s.rainfallRateMmH, newThresholds);
        return {
          ...s,
          riskLevel: risk.level,
          riskReason: risk.reason,
        };
      })
    );
  };

  const handleResetThresholds = () => {
    handleUpdateThresholds(DEFAULT_THRESHOLDS);
  };

  const handleOpenRoutePlannerWithNode = (sensorId: string) => {
    // Map sensor to road node
    if (sensorId === 'SEN-GYE-01') setRouteStartNodeId('GYE-URDESA');
    else if (sensorId === 'SEN-GYE-03') setRouteStartNodeId('GYE-BARCELONA');
    else if (sensorId === 'SEN-GYE-04') setRouteStartNodeId('GYE-SUBURBIO');
    else if (sensorId === 'SEN-GYE-02') setRouteStartNodeId('GYE-CENTRO');
    else setRouteStartNodeId('GYE-AIRPORT');

    setActiveTab('routes');
  };

  const activeAlertsCount = alerts.filter((a) => !a.acknowledged).length;
  const criticalNodesCount = sensors.filter((s) => s.riskLevel === 'Critical').length;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-slate-950">
      {/* Mobile Top Navigation Toggle Bar */}
      <div className="flex lg:hidden items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2.5">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:text-white"
          aria-label="Open emergency navigation menu"
        >
          <Menu className="h-4 w-4" />
          <span className="text-xs font-semibold">Menu</span>
        </button>

        <div className="flex items-center gap-1.5 font-bold text-xs tracking-tight text-white">
          <span>DRAIN PULSE</span>
          <span className="text-sky-400">FLOODWATCH</span>
        </div>

        <button
          onClick={() => setIsSimulationOpen(true)}
          className="rounded-lg bg-sky-500/20 border border-sky-500/40 px-2.5 py-1 text-[11px] font-semibold text-sky-300"
        >
          Simulate
        </button>
      </div>

      {/* Main Top Header */}
      <Header
        weather={weather}
        activeAlertsCount={activeAlertsCount}
        onOpenSimulation={() => setIsSimulationOpen(true)}
        onResetData={handleResetData}
        onSelectNav={(tab) => setActiveTab(tab as NavTab)}
      />

      {/* Body Area with Sidebar and Active Tab View */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
          }}
          activeAlertsCount={activeAlertsCount}
          criticalNodesCount={criticalNodesCount}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-950">
          {activeTab === 'overview' && (
            <Overview
              sensors={sensors}
              alerts={alerts}
              roadSegments={roadSegments}
              weather={weather}
              onNavigate={(tab) => setActiveTab(tab as NavTab)}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onSelectSensor={(sensor) => setSelectedSensor(sensor)}
              onOpenSimulation={() => setIsSimulationOpen(true)}
            />
          )}

          {activeTab === 'map' && (
            <LiveFloodMap
              sensors={sensors}
              roadSegments={roadSegments}
              selectedSensor={selectedSensor}
              onSelectSensor={setSelectedSensor}
              onUpdateSensorWater={handleUpdateSensorWater}
              onOpenRoutePlannerWithNode={handleOpenRoutePlannerWithNode}
            />
          )}

          {activeTab === 'routes' && (
            <SafeRoutePlanner
              roadSegments={roadSegments}
              initialStartNodeId={routeStartNodeId}
            />
          )}

          {activeTab === 'sensors' && (
            <SensorNetwork
              sensors={sensors}
              onUpdateSensorWater={handleUpdateSensorWater}
              onSetSensorWater={handleSetSensorWater}
              onSelectSensor={setSelectedSensor}
              onNavigateToMap={() => setActiveTab('map')}
              onResetData={handleResetData}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsManager
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onAddAlert={handleAddAlert}
            />
          )}

          {activeTab === 'rainfall' && (
            <RainfallForecast
              weather={weather}
              isLoading={isWeatherLoading}
              onRefreshWeather={loadWeather}
            />
          )}

          {activeTab === 'analytics' && (
            <Analytics
              sensors={sensors}
              alerts={alerts}
              roadSegments={roadSegments}
              weather={weather}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              thresholds={thresholds}
              onUpdateThresholds={handleUpdateThresholds}
              onResetData={handleResetData}
              onResetThresholds={handleResetThresholds}
            />
          )}
        </main>
      </div>

      {/* Global Scenario Simulation Modal */}
      <SimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        sensors={sensors}
        onUpdateSensorWater={handleUpdateSensorWater}
        onSetSensorWater={handleSetSensorWater}
        onResetData={handleResetData}
        onNavigateToMap={() => setActiveTab('map')}
      />
    </div>
  );
}
