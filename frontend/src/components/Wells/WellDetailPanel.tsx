import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { getWell, getEvents } from '../../services/api';
import type { Well, HistoricalEvent } from '../../types';

interface Props {
  wellId: string;
  onClose: () => void;
}

export const WellDetailPanel: React.FC<Props> = ({ wellId, onClose }) => {
  const [well, setWell] = useState<Well | null>(null);
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getWell(wellId),
      getEvents({ well_id: wellId })
    ]).then(([wellData, eventsData]) => {
      setWell(wellData);
      setEvents(eventsData.slice(0, 5));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [wellId]);

  if (loading) {
    return (
      <div className="bg-secondary border border-border rounded-lg p-5 flex items-center justify-center h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!well) return null;

  const severityColor: Record<string, string> = {
    Low: 'text-accent-green',
    Medium: 'text-accent-amber',
    High: 'text-accent-amber',
    Severe: 'text-accent-red',
    Critical: 'text-accent-red',
  };

  return (
    <div className="bg-secondary border border-border rounded-lg p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-text-primary">{well.id}</h3>
          <span className="text-xs text-text-secondary">{well.name} • {well.well_type}</span>
        </div>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-text-secondary">Total Depth</span>
          <span className="text-text-primary font-mono">{well.total_depth.toFixed(0)} m</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-text-secondary">Status</span>
          <span className={`text-text-primary ${well.status === 'active' ? 'text-accent-green' : ''}`}>{well.status}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-text-secondary">Spud Date</span>
          <span className="text-text-primary">{well.spud_date}</span>
        </div>
        {well.completion_date && (
          <div className="flex justify-between border-b border-border pb-2">
            <span className="text-text-secondary">Completion</span>
            <span className="text-text-primary">{well.completion_date}</span>
          </div>
        )}
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-text-secondary">Location</span>
          <span className="text-text-primary font-mono text-xs">{well.latitude.toFixed(3)}°N, {well.longitude.toFixed(3)}°E</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-text-secondary">Operator</span>
          <span className="text-text-primary">{well.operator}</span>
        </div>
      </div>

      {events.length > 0 && (
        <div className="mt-2">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-accent-amber" />
            Historical Events ({events.length})
          </h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {events.map(evt => (
              <div key={evt.id} className="bg-tertiary p-2 rounded text-xs border border-border">
                <div className={`font-medium mb-1 ${severityColor[evt.severity] || 'text-text-primary'}`}>
                  {evt.severity} {evt.event_type} ({evt.depth.toFixed(0)}m)
                </div>
                <div className="text-text-secondary">{evt.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
