import React, { useState, useEffect } from 'react';
import { getLiveDrilling } from '../../services/api';
import type { DrillingParameters } from '../../types';

export const LiveDrillingParams = () => {
  const [params, setParams] = useState<DrillingParameters | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLiveDrilling();
        setParams(data);
        setError(false);
      } catch {
        setError(true);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const dataPoints = params ? [
    { label: 'Depth (m)', value: params.depth.toFixed(1) },
    { label: 'ROP (m/hr)', value: params.rop.toFixed(1) },
    { label: 'WOB (klbf)', value: params.wob.toFixed(1) },
    { label: 'Torque (kNm)', value: params.torque.toFixed(1) },
    { label: 'RPM', value: Math.round(params.rpm).toString() },
    { label: 'Pump Press (psi)', value: Math.round(params.pump_pressure).toString() },
    { label: 'Flow Rate (gpm)', value: Math.round(params.flow_rate).toString() },
    { label: 'Mud Density (SG)', value: params.mud_density.toFixed(2) },
    { label: 'SPP (psi)', value: Math.round(params.standpipe_pressure).toString() },
  ] : [];

  return (
    <div className="bg-secondary border border-border rounded-lg p-5 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Live Drilling Parameters</h2>
        <div className="flex items-center gap-1 text-xs text-accent-green">
          <span className={`w-2 h-2 rounded-full ${error ? 'bg-accent-red' : 'bg-accent-green animate-pulse'}`} />
          {error ? 'Offline' : 'Live'}
        </div>
      </div>

      {!params ? (
        <div className="text-text-secondary text-sm text-center py-8">Loading parameters...</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {dataPoints.map((dp, idx) => (
            <div key={idx} className="bg-tertiary border border-border p-3 rounded">
              <div className="text-xs text-text-secondary mb-1">{dp.label}</div>
              <div className="text-lg font-mono text-text-primary">{dp.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
