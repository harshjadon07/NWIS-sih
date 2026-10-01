import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { getLiveDrilling } from '../../services/api';

export const TopBar = () => {
  const [depth, setDepth] = useState<number>(2430);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getLiveDrilling();
        setDepth(data.depth);
      } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 bg-primary border-b border-border flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="flex items-center gap-3">
        <Activity className="w-5 h-5 text-accent" />
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-text-primary tracking-tight">NWIS</span>
          <span className="text-sm text-text-secondary hidden sm:inline">Nearby Wells Intelligence System</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-green" />
          <span className="text-xs text-text-secondary font-medium">System Online</span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-3 text-sm">
          <span className="text-text-secondary">Active Well:</span>
          <span className="font-medium text-text-primary">WELL-A</span>
          <span className="text-border">/</span>
          <span className="font-medium text-text-primary">{depth.toFixed(1)}m</span>
        </div>
      </div>
    </header>
  );
};
