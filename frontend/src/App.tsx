import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { NearbyWellsPage } from './pages/NearbyWellsPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { HistoricalEventsPage } from './pages/HistoricalEventsPage';
import { WellComparisonPage } from './pages/WellComparisonPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { ReportsPage } from './pages/ReportsPage';
import { KnowledgeSearchPage } from './pages/KnowledgeSearchPage';
import { CopilotPage } from './pages/CopilotPage';
import { AlertsPage } from './pages/AlertsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="nearby-wells" element={<NearbyWellsPage />} />
          <Route path="risk-analysis" element={<RiskAnalysisPage />} />
          <Route path="events" element={<HistoricalEventsPage />} />
          <Route path="compare" element={<WellComparisonPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="search" element={<KnowledgeSearchPage />} />
          <Route path="copilot" element={<CopilotPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="placeholder" element={<PlaceholderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
