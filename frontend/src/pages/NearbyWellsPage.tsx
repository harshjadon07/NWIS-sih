import React, { useState } from 'react';
import { NearbyWellMap } from '../components/Map/NearbyWellMap';
import { WellRelevanceList } from '../components/Wells/WellRelevanceList';
import { WellDetailPanel } from '../components/Wells/WellDetailPanel';

export const NearbyWellsPage = () => {
  const [selectedRadius, setSelectedRadius] = useState<number>(10);
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null);
  
  const radii = [1, 5, 10, 25, 50];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
      <div className="flex justify-between items-center bg-secondary border border-border p-4 rounded-lg">
        <h1 className="text-xl font-bold text-text-primary">Nearby Wells Intelligence</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">Search Radius:</span>
          <div className="flex border border-border rounded-md overflow-hidden">
            {radii.map(r => (
              <button
                key={r}
                onClick={() => setSelectedRadius(r)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  selectedRadius === r 
                    ? 'bg-accent text-white font-medium' 
                    : 'bg-tertiary text-text-secondary hover:bg-tertiary/80'
                } border-r border-border last:border-r-0`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 h-full overflow-hidden">
        {/* Map Section */}
        <div className="flex-1 bg-secondary border border-border rounded-lg overflow-hidden flex flex-col relative">
          <NearbyWellMap 
            radius={selectedRadius} 
            selectedWellId={selectedWellId}
            onSelectWell={setSelectedWellId}
          />
        </div>

        {/* Right Sidebar - Dynamic Content */}
        <div className="w-[350px] flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
          {selectedWellId ? (
            <WellDetailPanel 
              wellId={selectedWellId} 
              onClose={() => setSelectedWellId(null)} 
            />
          ) : null}
          
          <WellRelevanceList 
            radius={selectedRadius}
            onSelectWell={setSelectedWellId}
            selectedWellId={selectedWellId}
          />
        </div>
      </div>
    </div>
  );
};
