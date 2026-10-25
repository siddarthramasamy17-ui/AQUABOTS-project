import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Radio,
  Route,
  BellRing,
  CloudRain,
  BarChart3,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'map'
  | 'sensors'
  | 'routes'
  | 'alerts'
  | 'rainfall'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeAlertsCount: number;
  criticalNodesCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeAlertsCount,
  criticalNodesCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'map' as NavTab,
      label: 'Live Flood Map',
      icon: MapPin,
      badge: criticalNodesCount > 0 ? `${criticalNodesCount} Danger` : null,
      badgeColor: 'text-red-400 bg-red-950/80 border-red-800',
    },
    {
      id: 'sensors' as NavTab,
      label: 'Sensor Network',
      icon: Radio,
      badge: '8 Nodes',
      badgeColor: 'text-slate-400 bg-slate-800 border-slate-700',
    },
    {
      id: 'routes' as NavTab,
      label: 'Safe Route Planner',
      icon: Route,
      badge: 'Dijkstra',
      badgeColor: 'text-sky-400 bg-sky-950/80 border-sky-800',
    },
    {
      id: 'alerts' as NavTab,
      label: 'Alerts & Notifications',
      icon: BellRing,
      badge: activeAlertsCount > 0 ? `${activeAlertsCount}` : null,
      badgeColor: 'text-amber-400 bg-amber-950/80 border-amber-800 animate-pulse',
    },
    {
      id: 'rainfall' as NavTab,
      label: 'Rainfall Forecast',
      icon: CloudRain,
      badge: 'Open-Meteo',
      badgeColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-800',
    },
    {
      id: 'analytics' as NavTab,
      label: 'Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: SlidersHorizontal,
      badge: null,
    },
  ];

  const handleItemClick = (id: NavTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Emergency Command
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-sky-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Guayaquil Flood Context Card */}
        <div className="p-3 border-t border-slate-800/80">
          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
              <Info className="h-3.5 w-3.5" />
              <span>Guayaquil Catchment Info</span>
            </div>
            <p className="leading-relaxed text-slate-300 text-[11px]">
              Tidal estuaries (Estero Salado) amplify heavy rain ponding across Urdesa and Av. Barcelona corridors.
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
              <span>HACK2IMPACT 2026</span>
              <span className="text-amber-400">DEMO SIMULATION</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
