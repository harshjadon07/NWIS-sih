import React, { useState, useEffect } from 'react';
import { GitCompare, AlertTriangle, Loader2 } from 'lucide-react';
import { getWells, getWell, getEvents } from '../services/api';
import type { Well, HistoricalEvent } from '../types';

export const WellComparisonPage = () => {
  const [allWells, setAllWells] = useState<Well[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(['WELL-A', 'WELL-B']);
  const [wellDetails, setWellDetails] = useState<Record<string, Well>>({});
  const [wellEvents, setWellEvents] = useState<Record<string, HistoricalEvent[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWells().then(setAllWells).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all(
      selectedIds.map(async id => {
        const [well, events] = await Promise.all([getWell(id), getEvents({ well_id: id })]);
        return { id, well, events };
      })
    ).then(results => {
      const details: Record<string, Well> = {};
      const evts: Record<string, HistoricalEvent[]> = {};
      results.forEach(r => { details[r.id] = r.well; evts[r.id] = r.events; });
      setWellDetails(details);
      setWellEvents(evts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedIds]);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(w => w !== id));
    } else if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Count events by type
  const countByType = (events: HistoricalEvent[]) => {
    const counts: Record<string, number> = {};
    events.forEach(e => { counts[e.event_type] = (counts[e.event_type] || 0) + 1; });
    return counts;
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Well Comparison</h1>
          <p className="text-sm text-text-secondary">Compare parameters and historical events across multiple wells.</p>
        </div>
        <span className="text-xs text-accent bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20 flex items-center gap-2">
          <GitCompare className="w-3.5 h-3.5" />
          Well comparison foundation — advanced comparison in Phase 2
        </span>
      </div>

      <div className="bg-secondary border border-border rounded-lg p-5">
        <h3 className="text-sm font-semibold mb-3">Select Wells to Compare (Max 3)</h3>
        <div className="flex flex-wrap gap-2">
          {allWells.map(well => (
            <button
              key={well.id}
              onClick={() => handleToggle(well.id)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                selectedIds.includes(well.id)
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-tertiary border-border text-text-secondary hover:border-text-secondary'
              }`}
            >
              {well.id}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
      ) : selectedIds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedIds.map(id => {
            const well = wellDetails[id];
            const events = wellEvents[id] || [];
            const eventCounts = countByType(events);
            if (!well) return null;
            return (
              <div key={id} className="bg-secondary border border-border rounded-lg overflow-hidden">
                <div className="bg-tertiary p-4 border-b border-border flex justify-between items-center">
                  <h2 className="text-lg font-bold text-text-primary">{well.id}</h2>
                  <span className={`text-xs px-2 py-1 rounded border ${
                    well.status === 'active' ? 'bg-accent-green/10 text-accent-green border-accent-green/30' : 'bg-border/50 text-text-secondary border-border'
                  }`}>
                    {well.status}
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-sm text-text-secondary">Total Depth</span>
                    <span className="text-sm text-accent-cyan font-mono">{well.total_depth.toFixed(0)}m</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-sm text-text-secondary">Well Type</span>
                    <span className="text-sm text-text-primary">{well.well_type}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-sm text-text-secondary">Spud Date</span>
                    <span className="text-sm text-text-primary">{well.spud_date}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-sm text-text-secondary">Field</span>
                    <span className="text-sm text-text-primary">{well.field_name}</span>
                  </div>
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold text-text-secondary uppercase mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Events ({events.length})
                    </h4>
                    {events.length === 0 ? (
                      <div className="text-sm text-text-secondary italic">No events recorded</div>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(eventCounts).map(([type, count]) => (
                          <div key={type} className="flex justify-between items-center bg-tertiary px-3 py-2 rounded border border-border">
                            <span className="text-sm">{type}</span>
                            <span className="bg-accent-red/20 text-accent-red text-xs px-1.5 rounded font-bold">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-secondary border border-border rounded-lg text-text-secondary">
          Select at least one well to view comparison data.
        </div>
      )}
    </div>
  );
};
