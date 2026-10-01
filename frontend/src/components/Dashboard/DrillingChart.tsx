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
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickMargin={10} />
            <YAxis stroke="#6b7280" fontSize={12} domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827' }}
              itemStyle={{ color: '#0891b2' }}
            />
            <Line 
              type="monotone" 
              dataKey="rop" 
              stroke="#2563eb" 
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
