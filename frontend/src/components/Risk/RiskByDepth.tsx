import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { getRiskByDepth } from '../../services/api';
import type { RiskPrediction } from '../../types';

interface Props {
  onSelectDepth: (depth: number) => void;
}

export const RiskByDepth: React.FC<Props> = ({ onSelectDepth }) => {
  const [data, setData] = useState<RiskPrediction[]>([]);

  useEffect(() => {
    getRiskByDepth('WELL-A')
      .then(setData)
      .catch(() => {});
  }, []);

  const getRiskColor = (score: number) => {
    if (score >= 75) return '#ef4444';
    if (score >= 50) return '#f97316';
    if (score >= 30) return '#f59e0b';
    return '#22c55e';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as RiskPrediction;
      return (
        <div className="bg-secondary border border-border p-3 rounded shadow-lg text-sm">
          <div className="text-text-primary font-bold mb-1">Depth: {item.depth} m</div>
          <div className="text-text-secondary mb-1">Risk Score: <span className="font-mono text-text-primary">{item.risk_score.toFixed(0)}</span></div>
          <div style={{ color: getRiskColor(item.risk_score) }} className="font-bold">
            {item.risk_level}
          </div>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return <div className="text-text-secondary text-center py-8">Loading risk profile...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
        onClick={(e: any) => {
          if (e && e.activePayload) {
            onSelectDepth(e.activePayload[0].payload.depth);
          }
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
        <YAxis
          dataKey="depth"
          type="category"
          reversed={true}
          stroke="#6b7280"
          tick={{ fontSize: 11 }}
          width={60}
          tickFormatter={(val) => `${val}m`}
        />
        <XAxis
          type="number"
          domain={[0, 100]}
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
          tickFormatter={(val) => `${val}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
        <Bar dataKey="risk_score" radius={[0, 4, 4, 0]} cursor="pointer">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getRiskColor(entry.risk_score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
