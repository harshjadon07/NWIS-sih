import React, { useState, useEffect } from 'react';
import { getSimilarWells } from '../../services/api';
import type { SimilarWellResponse } from '../../types';

interface Props {
  radius: number;
  selectedWellId: string | null;
  onSelectWell: (id: string) => void;
}

export const WellRelevanceList: React.FC<Props> = ({ radius, selectedWellId, onSelectWell }) => {
  const [wells, setWells] = useState<SimilarWellResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSimilarWells('WELL-A')
      .then(data => {
        setWells(data.filter(sw => sw.distance_km <= radius));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [radius]);

  return (
    <div className="bg-secondary border border-border rounded-lg p-4 flex flex-col flex-1 min-h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-bold text-text-primary">Similar Wells</h3>
        <span className="text-[10px] text-text-secondary bg-tertiary px-1.5 py-0.5 rounded border border-border uppercase tracking-wide">
          Prototype Relevance Score
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <div className="text-sm text-text-secondary text-center py-8">Loading...</div>
        ) : wells.length === 0 ? (
          <div className="text-sm text-text-secondary text-center py-8">
            No similar wells found within {radius} km radius.
          </div>
        ) : (
          wells.map(sw => (
            <div
              key={sw.well.id}
              onClick={() => onSelectWell(sw.well.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedWellId === sw.well.id
                  ? 'bg-accent/10 border-accent'
                  : 'bg-tertiary border-border hover:border-accent/50'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm text-text-primary">{sw.well.id}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  sw.relevance_score >= 80 ? 'bg-accent-green/20 text-accent-green' :
                  sw.relevance_score >= 60 ? 'bg-accent-amber/20 text-accent-amber' :
                  'bg-border text-text-secondary'
                }`}>
                  {sw.relevance_score.toFixed(0)}% Match
                </span>
              </div>
              <div className="flex justify-between text-xs text-text-secondary">
                <span>{sw.distance_km.toFixed(1)} km away</span>
                <span>Depth: {sw.well.total_depth.toFixed(0)}m</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
