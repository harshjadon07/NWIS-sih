import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, History, AlertTriangle } from 'lucide-react';
import { getAlerts } from '../services/api';
import type { Alert } from '../types';

export const AlertsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await getAlerts();
        setAlerts(data);
      } catch (err) {
        console.error("Failed to fetch alerts", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const resolvedAlerts = alerts.filter(a => a.status === 'RESOLVED');
  const historicalAlerts = alerts.filter(a => a.status === 'HISTORICAL');

  const getSeverityStyle = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return 'bg-accent-red/20 text-accent-red border-accent-red/50';
      case 'HIGH': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
      case 'WATCH': return 'bg-accent-amber/20 text-accent-amber border-accent-amber/50';
      case 'LOW': return 'bg-accent-green/20 text-accent-green border-accent-green/50';
      default: return 'bg-border text-text-secondary border-border';
    }
  };

  const renderAlertCard = (alert: Alert) => {
    const relatedWells = alert.related_wells ? JSON.parse(alert.related_wells) : [];
    const relatedReports = alert.related_reports ? JSON.parse(alert.related_reports) : [];
    
    return (
      <div key={alert.id} className="bg-secondary border border-border rounded-lg p-5 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 ${alert.status === 'ACTIVE' ? 'text-accent-red animate-pulse' : 'text-text-secondary'}`} />
            <div>
              <h3 className="font-bold text-lg text-text-primary">{alert.reason}</h3>
              <div className="text-xs text-text-secondary">{new Date(alert.timestamp).toLocaleString()}</div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityStyle(alert.severity)}`}>
            {alert.severity}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          <div className="bg-tertiary p-3 rounded">
            <div className="text-xs text-text-secondary">Current Depth</div>
            <div className="font-mono text-lg">{alert.depth.toFixed(1)}m</div>
          </div>
          <div className="bg-tertiary p-3 rounded">
            <div className="text-xs text-text-secondary">Distance to Zone</div>
            <div className="font-mono text-lg">{alert.distance_to_zone ? `${alert.distance_to_zone.toFixed(1)}m` : 'N/A'}</div>
          </div>
          <div className="bg-tertiary p-3 rounded">
            <div className="text-xs text-text-secondary">Risk Score</div>
            <div className="font-mono text-lg">{alert.risk_score.toFixed(1)}%</div>
          </div>
          <div className="bg-tertiary p-3 rounded">
            <div className="text-xs text-text-secondary">Hist. Similarity</div>
            <div className="font-mono text-lg">{alert.historical_similarity ? `${alert.historical_similarity.toFixed(1)}%` : 'N/A'}</div>
          </div>
        </div>

        <div className="mt-2 bg-tertiary p-4 rounded border border-border">
          <h4 className="text-sm font-semibold mb-2">Evidence</h4>
          <p className="text-sm text-text-secondary">{alert.evidence}</p>
        </div>

        {(relatedWells.length > 0 || relatedReports.length > 0) && (
          <div className="flex flex-col md:flex-row gap-4 mt-2 text-sm">
            {relatedWells.length > 0 && (
              <div className="flex-1">
                <span className="font-semibold">Related Wells: </span>
                <span className="text-text-secondary">{relatedWells.join(', ')}</span>
              </div>
            )}
            {relatedReports.length > 0 && (
              <div className="flex-1">
                <span className="font-semibold">Related Reports: </span>
                <span className="text-text-secondary">{relatedReports.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">Notification Center</h1>
      
      {loading ? (
        <div className="text-center py-10 text-text-secondary">Loading alerts...</div>
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <div className="flex items-center gap-2 mb-4 text-accent-red">
              <AlertCircle className="w-5 h-5" />
              <h2 className="text-xl font-bold">Active Alerts ({activeAlerts.length})</h2>
            </div>
            {activeAlerts.length > 0 ? (
              <div className="flex flex-col gap-4">
                {activeAlerts.map(renderAlertCard)}
              </div>
            ) : (
              <div className="bg-secondary p-5 rounded-lg border border-border text-text-secondary text-center">
                No active alerts at this time.
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4 text-accent-green">
              <CheckCircle2 className="w-5 h-5" />
              <h2 className="text-xl font-bold">Resolved Alerts ({resolvedAlerts.length})</h2>
            </div>
            {resolvedAlerts.length > 0 ? (
              <div className="flex flex-col gap-4">
                {resolvedAlerts.map(renderAlertCard)}
              </div>
            ) : (
              <div className="bg-secondary p-5 rounded-lg border border-border text-text-secondary text-center">
                No resolved alerts.
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4 text-text-secondary">
              <History className="w-5 h-5" />
              <h2 className="text-xl font-bold">Historical Alerts ({historicalAlerts.length})</h2>
            </div>
            {historicalAlerts.length > 0 ? (
              <div className="flex flex-col gap-4 opacity-75">
                {historicalAlerts.map(renderAlertCard)}
              </div>
            ) : (
              <div className="bg-secondary p-5 rounded-lg border border-border text-text-secondary text-center">
                No historical alerts.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
