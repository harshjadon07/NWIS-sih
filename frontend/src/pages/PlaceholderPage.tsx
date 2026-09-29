import React from 'react';
import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

export const PlaceholderPage = () => {
  const location = useLocation();
  const state = location.state as { title?: string; phase2?: boolean } || {};
  const title = state.title || 'Feature in Development';

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-secondary border border-border rounded-lg shadow-lg">
      <div className="w-20 h-20 bg-tertiary rounded-full flex items-center justify-center mb-6">
        <Construction className="w-10 h-10 text-accent" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">{title}</h1>
      <p className="text-text-secondary max-w-md">
        {state.phase2 
          ? 'This feature is planned for Phase 2 of the Nearby Wells Intelligence System.'
          : 'This section is currently under development. Check back later for updates.'}
      </p>
    </div>
  );
};
