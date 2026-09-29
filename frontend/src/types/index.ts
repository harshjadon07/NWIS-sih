export interface Well {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  total_depth: number;
  well_type: string;
  status: string;
  spud_date: string;
  completion_date: string | null;
  operator: string;
  field_name: string;
  formations?: WellFormationDetail[];
  event_count?: number;
  distance_km?: number;
}

export interface Formation {
  id: number;
  name: string;
  description: string;
  lithology: string;
  porosity: number;
  permeability: number;
  pressure_gradient: number;
}

export interface WellFormation {
  id: number;
  well_id: string;
  formation_id: number;
  formation_name: string;
  top_depth: number;
  bottom_depth: number;
  remarks: string;
}

export interface WellFormationDetail {
  id: number;
  top_depth: number;
  bottom_depth: number;
  remarks: string | null;
  formation: Formation;
}

export interface DrillingParameters {
  well_id: string;
  timestamp: string;
  depth: number;
  rop: number;
  wob: number;
  torque: number;
  rpm: number;
  pump_pressure: number;
  flow_rate: number;
  mud_density: number;
  standpipe_pressure: number;
}

export interface HistoricalEvent {
  id: string;
  well_id: string;
  depth: number;
  formation_name: string;
  event_type: string;
  severity: string;
  description: string;
  mitigation: string;
  outcome: string;
  date: string;
  duration_hours: number;
  npt_hours: number;
}

export interface RiskPrediction {
  id: number;
  well_id: string;
  depth: number;
  risk_level: string;
  risk_score: number;
  mud_loss_score: number;
  stuck_pipe_score: number;
  kick_score: number;
  cementing_score: number;
  contributing_factors: string;
  nearby_events_count: number;
}

export interface RiskSummary {
  well_id: string;
  overall_risk_level: string;
  overall_risk_score: number;
  mud_loss_avg: number;
  stuck_pipe_avg: number;
  kick_avg: number;
  cementing_avg: number;
  mud_loss: number;
  stuck_pipe: number;
  kick: number;
  cementing: number;
}

export interface SimilarWell {
  well: Well;
  relevance_score: number;
  distance_km: number;
  formation_similarity: number;
  depth_similarity: number;
}

export interface SimilarWellResponse extends SimilarWell {}

export interface Document {
  id: number;
  filename: string;
  upload_date: string;
  status: string;
  well_id?: string;
}

export interface DocumentChunk {
  id: number;
  document_id: number;
  chunk_text: string;
  page_number: number;
}

export interface DocumentEntity {
  id: number;
  document_id: number;
  entity_type: string;
  entity_value: string;
}

export interface SearchResult {
  chunk: DocumentChunk;
  document: Document;
  entities: DocumentEntity[];
  score: number;
}

export interface ToolCallInfo {
  tool: string;
  args: Record<string, any>;
  summary: string;
}

export interface SourceCitation {
  title: string;
  page: number;
  excerpt: string;
  well: string;
  depth: string;
  event: string;
}

export interface CopilotContext {
  active_well: string;
  current_depth: number;
  formation: string;
  risk_level: string;
  risk_score: number;
  nearby_wells: string[];
  live_telemetry: {
    rop: number;
    wob: number;
    torque: number;
    standpipe_pressure: number;
  };
}

export interface CopilotResponse {
  reply: string;
  tools_called: ToolCallInfo[];
  context: Record<string, any>;
  sources: SourceCitation[];
  structured_data?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  tools_called?: ToolCallInfo[];
  sources?: SourceCitation[];
}
export interface Alert {
  id: number;
  timestamp: string;
  well_id: string;
  depth: number;
  risk_score: number;
  severity: string;
  reason: string;
  evidence: string;
  related_wells: string;
  related_reports: string;
  status: string;
  distance_to_zone?: number;
  historical_similarity?: number;
}
