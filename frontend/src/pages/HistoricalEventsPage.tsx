import React, { useState } from 'react';
import { EventsTable } from '../components/Events/EventsTable';

const EVENT_TYPES = ['Mud Loss', 'Stuck Pipe', 'Kick', 'High Torque', 'Overpressure', 'Lost Circulation', 'Fishing', 'Cementing Issue', 'Casing Issue', 'NPT'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Severe', 'Critical'];
const FORMATIONS = ['FORMATION-A', 'FORMATION-B', 'FORMATION-C', 'FORMATION-D', 'FORMATION-X'];
const WELLS = ['WELL-A', 'WELL-B', 'WELL-C', 'WELL-D', 'WELL-E', 'WELL-F', 'WELL-G', 'WELL-H', 'WELL-I', 'WELL-J', 'WELL-K', 'WELL-L', 'WELL-M', 'WELL-N', 'WELL-O'];

export const HistoricalEventsPage = () => {
  const [eventType, setEventType] = useState('');
  const [severity, setSeverity] = useState('');
  const [formation, setFormation] = useState('');
  const [wellId, setWellId] = useState('');

  return (
    <div className="flex flex-col h-full gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Historical Events Log</h1>
        <p className="text-sm text-text-secondary">Search and filter recorded NPT events and incidents from offset wells.</p>
      </div>

      <div className="bg-secondary border border-border rounded-lg p-5 flex-1 flex flex-col min-h-0">
        <div className="flex flex-wrap gap-4 mb-4">
          <select value={wellId} onChange={e => setWellId(e.target.value)} className="bg-tertiary border border-border text-sm rounded px-3 py-1.5 text-text-primary outline-none focus:border-accent">
            <option value="">All Wells</option>
            {WELLS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select value={eventType} onChange={e => setEventType(e.target.value)} className="bg-tertiary border border-border text-sm rounded px-3 py-1.5 text-text-primary outline-none focus:border-accent">
            <option value="">All Event Types</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={severity} onChange={e => setSeverity(e.target.value)} className="bg-tertiary border border-border text-sm rounded px-3 py-1.5 text-text-primary outline-none focus:border-accent">
            <option value="">All Severities</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={formation} onChange={e => setFormation(e.target.value)} className="bg-tertiary border border-border text-sm rounded px-3 py-1.5 text-text-primary outline-none focus:border-accent">
            <option value="">All Formations</option>
            {FORMATIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-hidden">
          <EventsTable
            wellId={wellId || undefined}
            eventType={eventType || undefined}
            severity={severity || undefined}
            formationName={formation || undefined}
          />
        </div>
      </div>
    </div>
  );
};
