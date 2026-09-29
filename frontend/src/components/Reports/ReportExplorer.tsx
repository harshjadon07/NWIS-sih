import React, { useState, useEffect } from 'react';
import { getReports } from '../../services/api';
import type { Document } from '../../types';
import { FileText, Calendar, Database, CheckCircle, Clock } from 'lucide-react';

export const ReportExplorer = () => {
  const [reports, setReports] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const data = await getReports();
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return <div className="text-text-secondary p-4">Loading reports...</div>;
  }

  return (
    <div className="bg-secondary rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase bg-tertiary/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 font-medium">Document Name</th>
              <th className="px-6 py-3 font-medium">Upload Date</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Well ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">
                  No reports found.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-tertiary/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-accent" />
                      <span className="font-medium text-text-primary">{report.filename}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Calendar className="w-4 h-4" />
                      {new Date(report.upload_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {report.status === 'indexed' || report.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Indexed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          Processing
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      {report.well_id || 'N/A'}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
