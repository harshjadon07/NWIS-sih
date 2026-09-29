import React, { useState, useEffect } from 'react';
import { getRiskSummary } from '../../services/api';
import type { RiskSummary } from '../../types';

const getRiskColor = (score: number) => {
  if (score >= 70) return { color: 'text-accent-red', bg: 'bg-accent-red/10', border: 'border-accent-red/30', level: 'HIGH' };
  if (score >= 40) return { color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/30', level: 'MEDIUM' };
  return { color: 'text-accent-green', bg: 'bg-accent-green/10', border: 'border-accent-green/30', level: 'LOW' };
};

export const RiskOverview = () => {
  const [summary, setSummary] = useState<RiskSummary | null>(null);

  useEffect(() => {
    getRiskSummary('WELL-A').then(setSummary).catch(() => {});
  }, []);

  const risks = summary ? [
    { label: 'Mud Loss', score: Math.round((summary as any).mud_loss_avg || summary.mud_loss) },
    { label: 'Stuck Pipe', score: Math.round((summary as any).stuck_pipe_avg || summary.stuck_pipe) },
    { label: 'Kick', score: Math.round((summary as any).kick_avg || summary.kick) },
    { label: 'Cementing', score: Math.round((summary as any).cementing_avg || summary.cementing) },
  ] : [
    { label: 'Mud Loss', score: 78 },
    { label: 'Stuck Pipe', score: 23 },
    { label: 'Kick', score: 12 },
    { label: 'Cementing', score: 8 },
  ];

  return (
    <div className="bg-secondary border border-border rounded-lg p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Risk Overview</h2>
        <span className="text-xs text-text-secondary bg-tertiary px-2 py-1 rounded border border-border">Prototype / simulated risk scores</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
        {risks.map((risk) => {
          const style = getRiskColor(risk.score);
          return (
            <div key={risk.label} className={`flex flex-col items-center justify-center p-4 rounded-lg border ${style.bg} ${style.border}`}>
              <span className="text-sm text-text-secondary mb-2 text-center">{risk.label}</span>
              <span className={`text-3xl font-bold font-mono mb-1 ${style.color}`}>{risk.score}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.color} border ${style.border}`}>
                {style.level}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
