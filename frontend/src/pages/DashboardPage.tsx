import React, { useState, useEffect } from 'react';
import { ActiveWellCard } from '../components/Dashboard/ActiveWellCard';
import { RiskOverview } from '../components/Dashboard/RiskOverview';
import { LiveDrillingParams } from '../components/Dashboard/LiveDrillingParams';
import { DrillingChart } from '../components/Dashboard/DrillingChart';
import { MapPin, AlertCircle } from 'lucide-react';
import { getEvents } from '../services/api';
import type { HistoricalEvent } from '../types';

export const DashboardPage = () => {
  const [recentEvents, setRecentEvents] = useState<HistoricalEvent[]>([]);

  useEffect(() => {
    getEvents().then(data => setRecentEvents(data.slice(0, 5))).catch(() => {});
  }, []);

  const severityColor: Record<string, string> = {
    Low: 'bg-accent-green/20 text-accent-green border-accent-green/30',
    Medium: 'bg-accent-amber/20 text-accent-amber border-accent-amber/30',
    High: 'bg-accent-amber/20 text-accent-amber border-accent-amber/30',
    Severe: 'bg-accent-red/20 text-accent-red border-accent-red/30',
    Critical: 'bg-accent-red/20 text-accent-red border-accent-red/30',
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ActiveWellCard />
        </div>
        <div className="lg:col-span-2">
          <RiskOverview />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <LiveDrillingParams />
        </div>
        <div className="lg:col-span-2">
          <DrillingChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-secondary border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">Nearby Wells Map</h2>
          </div>
          <div className="h-[250px] bg-tertiary rounded border border-border flex items-center justify-center text-text-secondary text-sm">
            Navigate to Nearby Wells page for interactive map →
          </div>
        </div>

        <div className="bg-secondary border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-accent-amber" />
            <h2 className="text-lg font-semibold">Recent Events</h2>
          </div>
          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <div className="text-sm text-text-secondary text-center py-4">Loading events...</div>
            ) : (
              recentEvents.map(evt => (
                <div key={evt.id} className="bg-tertiary p-3 rounded border border-border flex justify-between items-center">
                  <div>
                    <div className="font-medium text-text-primary text-sm">{evt.event_type}</div>
                    <div className="text-xs text-text-secondary">{evt.well_id} • Depth: {evt.depth.toFixed(0)}m • {evt.formation_name}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full border ${severityColor[evt.severity] || 'bg-border text-text-secondary border-border'}`}>
                    {evt.severity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
