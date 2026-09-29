import React, { useState, useEffect } from 'react';
import { getEvents } from '../../services/api';
import type { HistoricalEvent } from '../../types';

interface Props {
  wellId?: string;
  eventType?: string;
  severity?: string;
  formationName?: string;
}

export const EventsTable: React.FC<Props> = ({ wellId, eventType, severity, formationName }) => {
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (wellId) params.well_id = wellId;
    if (eventType) params.event_type = eventType;
    if (severity) params.severity = severity;
    if (formationName) params.formation_name = formationName;
    
    getEvents(params)
      .then(data => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [wellId, eventType, severity, formationName]);

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'low': return 'bg-accent-green/20 text-accent-green border-accent-green/30';
      case 'medium': return 'bg-accent-amber/20 text-accent-amber border-accent-amber/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'severe': return 'bg-accent-red/20 text-accent-red border-accent-red/30';
      case 'critical': return 'bg-red-900/40 text-red-400 border-red-900/50';
      default: return 'bg-tertiary text-text-secondary border-border';
    }
  };

  if (loading) {
    return <div className="text-center text-text-secondary py-8">Loading events...</div>;
  }

  return (
    <div className="h-full overflow-y-auto pr-2">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-secondary z-10">
          <tr className="text-text-secondary border-b border-border">
            <th className="pb-3 font-medium">Event ID</th>
            <th className="pb-3 font-medium">Well</th>
            <th className="pb-3 font-medium">Depth</th>
            <th className="pb-3 font-medium">Formation</th>
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium">Severity</th>
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">NPT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {events.map((evt) => (
            <React.Fragment key={evt.id}>
              <tr
                className="hover:bg-tertiary cursor-pointer transition-colors"
                onClick={() => setExpandedId(expandedId === evt.id ? null : evt.id)}
              >
                <td className="py-3 text-accent font-medium">{evt.id}</td>
                <td className="py-3 text-text-primary">{evt.well_id}</td>
                <td className="py-3 font-mono text-text-primary">{evt.depth.toFixed(0)}m</td>
                <td className="py-3 text-text-secondary text-xs">{evt.formation_name}</td>
                <td className="py-3 text-text-primary">{evt.event_type}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${getSeverityBadge(evt.severity)}`}>
                    {evt.severity}
                  </span>
                </td>
                <td className="py-3 text-text-secondary">{evt.date}</td>
                <td className="py-3 font-mono">{evt.npt_hours.toFixed(1)}h</td>
              </tr>
              {expandedId === evt.id && (
                <tr className="bg-tertiary/50">
                  <td colSpan={8} className="px-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-xs font-semibold text-text-secondary uppercase mb-1">Description</h4>
                        <p className="text-sm text-text-primary">{evt.description}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-text-secondary uppercase mb-1">Mitigation</h4>
                        <p className="text-sm text-text-primary">{evt.mitigation}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-text-secondary uppercase mb-1">Outcome</h4>
                        <p className="text-sm text-text-primary">{evt.outcome}</p>
                        <div className="mt-2 text-xs text-text-secondary">
                          Duration: <span className="text-text-primary">{evt.duration_hours.toFixed(1)}h</span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {events.length === 0 && (
        <div className="text-center text-text-secondary py-8">No events found.</div>
      )}
    </div>
  );
};
