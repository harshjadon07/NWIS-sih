import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getLiveDrilling } from '../../services/api';

export const DrillingChart = () => {
  const [data, setData] = useState<{ time: string; rop: number; depth: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const live = await getLiveDrilling();
        const d = new Date(live.timestamp || new Date().toISOString());
        setData(prev => {
          const newData = [...prev, {
            time: d.toLocaleTimeString([], { hour12: false }),
            rop: live.rop,
            depth: live.depth
          }];
          if (newData.length > 20) return newData.slice(newData.length - 20);
          return newData;
        });
      } catch (e) {
        // silent
      }
    };
    fetchData(); // initial fetch
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-secondary border border-border rounded-lg p-5 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Rate of Penetration (ROP) Trend</h2>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} />
            <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', borderColor: '#1e3a5f', color: '#e2e8f0' }}
              itemStyle={{ color: '#06b6d4' }}
            />
            <Line 
              type="monotone" 
              dataKey="rop" 
              stroke="#06b6d4" 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
