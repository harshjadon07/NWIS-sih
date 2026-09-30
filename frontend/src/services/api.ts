import axios from 'axios';
import type { 
  Well, SimilarWell, SimilarWellResponse, Formation, HistoricalEvent, 
  DrillingParameters, RiskPrediction, RiskSummary, CopilotContext, CopilotResponse 
} from '../types';

const api = axios.create({
  baseURL: 'BACKEND_URL',
});

export const getWells = async (params?: Record<string, any>) => {
  const { data } = await api.get<Well[]>('/wells', { params });
  return data;
};

export const getWell = async (wellId: string) => {
  const { data } = await api.get<Well>(`/wells/${wellId}`);
  return data;
};

export const getNearbyWells = async (lat: number, lon: number, radiusKm: number) => {
  const { data } = await api.get<Well[]>('/wells/nearby', { params: { lat, lon, radius_km: radiusKm } });
  return data;
};

export const getSimilarWells = async (wellId: string) => {
  const { data } = await api.get<SimilarWellResponse[]>(`/wells/${wellId}/similar`);
  return data;
};

export const getFormations = async () => {
  const { data } = await api.get<Formation[]>('/formations');
  return data;
};

export const getEvents = async (params?: Record<string, any>) => {
  const { data } = await api.get<HistoricalEvent[]>('/events', { params });
  return data;
};

export const getEvent = async (eventId: string) => {
  const { data } = await api.get<HistoricalEvent>(`/events/${eventId}`);
  return data;
};

export const getLiveDrilling = async () => {
  const { data } = await api.get<DrillingParameters>('/drilling/live');
  return data;
};

export const getRiskByDepth = async (wellId: string) => {
  const { data } = await api.get<RiskPrediction[]>('/risk/depth', { params: { well_id: wellId } });
  return data;
};

export const getRiskSummary = async (wellId: string) => {
  const { data } = await api.get<RiskSummary>('/risk/summary', { params: { well_id: wellId } });
  return data;
};

export const uploadReport = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getReports = async () => {
  const { data } = await api.get('/reports');
  return data;
};

export const searchReports = async (query: string) => {
  const { data } = await api.get('/reports/search', { params: { q: query } });
  return data;
};

// =======================
// COPILOT API ENDPOINTS
// =======================

export const getCopilotContext = async () => {
  const { data } = await api.get<CopilotContext>('/copilot/context');
  return data;
};

export const sendCopilotMessage = async (message: string, wellId: string = 'WELL-A') => {
  const { data } = await api.post<CopilotResponse>('/copilot/chat', {
    message,
    well_id: wellId
  });
  return data;
};

export const getCopilotTools = async () => {
  const { data } = await api.get<Array<{ name: string; description: string }>>('/copilot/tools');
  return data;
};

export const getAlerts = async () => {
  const { data } = await api.get<any[]>('/alerts');
  return data;
};
