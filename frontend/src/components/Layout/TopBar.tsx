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
    <header className="h-14 bg-secondary border-b border-border flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-accent" />
        <div>
          <span className="text-lg font-bold text-text-primary tracking-wide">NWIS</span>
          <span className="text-xs text-text-secondary ml-2 hidden sm:inline">Nearby Wells Intelligence System</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          <span className="text-xs text-accent-green font-medium">SYSTEM ONLINE</span>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-secondary">Active Well:</span>
          <span className="font-bold text-text-primary">WELL-A</span>
          <span className="text-text-secondary">|</span>
          <span className="font-mono text-accent-cyan">{depth.toFixed(1)}m</span>
        </div>
      </div>
    </header>
  );
};
