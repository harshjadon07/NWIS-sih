import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { getLiveDrilling } from '../../services/api';
import type { DrillingParameters } from '../../types';

export const ActiveWellCard = () => {
  const [params, setParams] = useState<DrillingParameters | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getLiveDrilling();
        setParams(data);
      } catch (e) { /* silent */ }
    };
    fetch();
    const interval = setInterval(fetch, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentFormation = params && params.depth < 1200 ? 'FORMATION-A' :
    params && params.depth < 1800 ? 'FORMATION-B' :
    params && params.depth < 2400 ? 'FORMATION-C' :
    params && params.depth < 2800 ? 'FORMATION-D' : 'FORMATION-X';

  return (
    <div className="bg-secondary border border-border rounded-lg p-5 h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">WELL-A</h2>
          <p className="text-sm text-text-secondary">Development Well • Assam-Synthetic</p>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-green/10 text-accent-green text-xs font-medium rounded-full border border-accent-green/20">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"></span>
          ACTIVE
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end border-b border-border pb-3">
          <span className="text-text-secondary text-sm">Current Depth</span>
          <span className="text-2xl font-mono text-accent-cyan font-semibold">
            {params ? params.depth.toFixed(1) : '---'} m
          </span>
        </div>
        
        <div className="flex justify-between items-end border-b border-border pb-3">
          <span className="text-text-secondary text-sm">Target Depth</span>
          <span className="text-lg font-mono text-text-primary">3,500.0 m</span>
        </div>

        <div className="flex justify-between items-end border-b border-border pb-3">
          <span className="text-text-secondary text-sm">Current Formation</span>
          <span className="text-sm font-medium text-text-primary bg-tertiary px-2 py-1 rounded">{currentFormation}</span>
        </div>

        <div className="flex justify-between items-end pb-1">
          <span className="text-text-secondary text-sm">Status</span>
          <span className="text-sm font-medium text-accent-green">DRILLING</span>
        </div>
      </div>
    </div>
  );
};
