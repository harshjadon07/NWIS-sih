import React, { useState, useEffect } from 'react';
import { RiskByDepth } from '../components/Risk/RiskByDepth';
import { AlertTriangle, Info, MapPin, Database } from 'lucide-react';
import { getRiskByDepth, getEvents } from '../services/api';
import type { RiskPrediction, HistoricalEvent } from '../types';

export const RiskAnalysisPage = () => {
  const [selectedDepth, setSelectedDepth] = useState<number | null>(null);
  const [riskData, setRiskData] = useState<RiskPrediction[]>([]);
  const [nearbyEvents, setNearbyEvents] = useState<HistoricalEvent[]>([]);

  useEffect(() => {
    getRiskByDepth('WELL-A').then(setRiskData).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedDepth !== null) {
      getEvents().then(events => {
        const nearby = events.filter(e => Math.abs(e.depth - selectedDepth) <= 100);
        setNearbyEvents(nearby);
      }).catch(() => {});
    }
  }, [selectedDepth]);

  const selectedRisk = selectedDepth ? riskData.find(r => r.depth === selectedDepth) : null;

  const getFormation = (depth: number) => {
    if (depth < 1200) return 'FORMATION-A (Tipam Sandstone)';
    if (depth < 1800) return 'FORMATION-B (Girujan Clay)';
    if (depth < 2400) return 'FORMATION-C (Barail Series)';
    if (depth < 2800) return 'FORMATION-D (Disang Shale)';
    return 'FORMATION-X (Naga Thrust Zone)';
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL': case 'VERY HIGH': return 'bg-accent-red/20 text-accent-red border-accent-red/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM': return 'bg-accent-amber/20 text-accent-amber border-accent-amber/30';
      default: return 'bg-accent-green/20 text-accent-green border-accent-green/30';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Risk Analysis</h1>
        <p className="text-sm text-text-secondary">Depth-based risk profile for WELL-A based on historical event data from nearby wells.</p>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        <div className="flex-1 bg-secondary border border-border rounded-lg p-5 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Risk by Depth Profile</h2>
            <span className="text-xs text-text-secondary bg-tertiary px-2 py-1 rounded border border-border">Prototype / simulated risk layer</span>
          </div>
          <div className="flex-1 min-h-0">
            <RiskByDepth onSelectDepth={setSelectedDepth} />
          </div>
        </div>

        <div className="w-[350px] bg-secondary border border-border rounded-lg p-5 flex flex-col overflow-y-auto">
          {selectedRisk ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-text-primary mb-1">Depth: {selectedRisk.depth}m</h3>
                <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${getRiskBadge(selectedRisk.risk_level)}`}>
                  {selectedRisk.risk_level} — Score: {selectedRisk.risk_score.toFixed(0)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <Database className="w-4 h-4 text-accent" />
                  <span>Formation: <strong className="text-text-primary">{getFormation(selectedRisk.depth)}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <AlertTriangle className="w-4 h-4 text-accent-amber" />
                  <span>Historical Events ±100m: <strong className="text-text-primary">{nearbyEvents.length}</strong></span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3">Risk Breakdown</h4>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Mud Loss', score: selectedRisk.mud_loss_score },
                    { label: 'Stuck Pipe', score: selectedRisk.stuck_pipe_score },
                    { label: 'Kick', score: selectedRisk.kick_score },
                    { label: 'Cementing', score: selectedRisk.cementing_score },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-text-secondary">{item.label}</span>
                        <span className="font-mono">{item.score.toFixed(0)}</span>
                      </div>
                      <div className="h-1.5 bg-tertiary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.score >= 70 ? 'bg-accent-red' : item.score >= 40 ? 'bg-accent-amber' : 'bg-accent-green'}`} style={{ width: `${Math.min(item.score, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {nearbyEvents.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold mb-3">Nearby Events</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {nearbyEvents.slice(0, 5).map(evt => (
                      <div key={evt.id} className="bg-tertiary p-2 rounded text-xs border border-border">
                        <div className="font-medium text-text-primary">{evt.event_type} — {evt.well_id}</div>
                        <div className="text-text-secondary">{evt.depth.toFixed(0)}m • {evt.severity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary text-center">
              <AlertTriangle className="w-12 h-12 mb-4 text-border" />
              <p>Click on the depth profile chart to view detailed risk analysis at a specific depth.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
