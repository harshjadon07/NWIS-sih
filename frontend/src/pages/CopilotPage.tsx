import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Sparkles, AlertTriangle, ShieldCheck, Database, 
  MapPin, Layers, FileText, ArrowRight, Activity, Terminal, RefreshCw
} from 'lucide-react';
import { getCopilotContext, sendCopilotMessage } from '../services/api';
import type { CopilotContext, ChatMessage } from '../types';

const QUICK_PROMPTS = [
  "Explain Current Risk",
  "Find Similar Wells",
  "Historical Events Near Me",
  "Show Supporting Reports",
  "Compare Wells",
  "Upcoming Risk Zones",
  "What happened around 2500 metres?",
  "Which nearby wells experienced mud loss?"
];

export const CopilotPage = () => {
  const [context, setContext] = useState<CopilotContext | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `### Welcome to the NWIS AI Drilling Copilot

I am your decision-support assistant grounded in offset well historical telemetry, geological databases, and archived drilling reports.

**Current Active Well:** \`WELL-A\`  
I am continuously tracking your depth, formation transitions, and offset hazard models in real time. 

Feel free to ask questions about current operational risks, nearby analog wells, historical mitigations, or select any quick prompt below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tools_called: [],
      sources: []
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchContext = async () => {
    try {
      const data = await getCopilotContext();
      setContext(data);
    } catch (e) {
      console.error('Failed to load copilot context', e);
    }
  };

  useEffect(() => {
    fetchContext();
    const interval = setInterval(fetchContext, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const response = await sendCopilotMessage(textToSend, context?.active_well || 'WELL-A');
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tools_called: response.tools_called,
        sources: response.sources
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Copilot query error:', error);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "I could not retrieve an answer from the NWIS system at this moment. Please verify backend connectivity and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedText = (text: string) => {
    // Process markdown-like lines for clean control-room presentation
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-bold text-accent-cyan flex items-center gap-2 mt-3 mb-1">
                <Sparkles className="w-4 h-4 text-accent" />
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('#### ')) {
            return (
              <h4 key={idx} className="text-sm font-semibold text-text-primary mt-2 mb-1">
                {line.replace('#### ', '')}
              </h4>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="border-l-2 border-accent-amber bg-tertiary/40 px-3 py-1.5 rounded text-text-secondary text-xs italic my-2">
                {line.replace('> ', '')}
              </blockquote>
            );
          }
          if (line.startsWith('* ') || line.startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2 text-text-secondary">
                <span className="text-accent">•</span>
                <span dangerouslySetInnerHTML={{ 
                  __html: line.substring(2)
                    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-text-primary">$1</strong>')
                    .replace(/\`([^`]+)\`/g, '<code class="bg-tertiary px-1 py-0.5 rounded text-accent-cyan font-mono text-xs">$1</code>')
                }} />
              </div>
            );
          }
          if (line.startsWith('|') && line.endsWith('|')) {
            // Markdown table row
            if (line.includes(':---')) return null;
            const cells = line.split('|').filter(c => c.trim() !== '');
            const isHeader = idx > 0 && lines[idx + 1]?.includes(':---');
            return (
              <div key={idx} className={`grid grid-cols-${cells.length} gap-2 p-1.5 rounded text-xs ${isHeader ? 'bg-tertiary/80 font-bold text-text-primary border-b border-border' : 'hover:bg-tertiary/30 text-text-secondary'}`}>
                {cells.map((cell, cidx) => (
                  <div key={cidx} dangerouslySetInnerHTML={{
                    __html: cell.trim()
                      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-text-primary">$1</strong>')
                      .replace(/\`([^`]+)\`/g, '<code class="bg-tertiary px-1 py-0.5 rounded text-accent-cyan font-mono text-xs">$1</code>')
                  }} />
                ))}
              </div>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} className="text-text-primary" dangerouslySetInnerHTML={{
              __html: line
                .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-text-primary">$1</strong>')
                .replace(/\`([^`]+)\`/g, '<code class="bg-tertiary px-1 py-0.5 rounded text-accent-cyan font-mono text-xs">$1</code>')
            }} />
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] gap-4">
      {/* 1. REAL-TIME OPERATIONAL CONTEXT BANNER */}
      <div className="bg-secondary border border-border rounded-lg p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-green animate-pulse" />
              <span className="font-bold text-text-primary text-sm tracking-wide">
                COPILOT MONITOR
              </span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-secondary">Well:</span>
              <span className="font-mono font-bold text-text-primary bg-tertiary px-2 py-0.5 rounded">
                {context?.active_well || 'WELL-A'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-secondary">Depth:</span>
              <span className="font-mono font-bold text-accent-cyan bg-tertiary px-2 py-0.5 rounded">
                {context ? `${context.current_depth.toFixed(1)} m` : '2,430.0 m'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs hidden md:flex">
              <span className="text-text-secondary">Formation:</span>
              <span className="font-medium text-text-primary bg-tertiary px-2 py-0.5 rounded">
                {context?.formation || 'FORMATION-D (Disang Shale)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-text-secondary">Current Risk:</span>
              <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                context && context.risk_score >= 70 ? 'bg-accent-red/20 text-accent-red border border-accent-red/30' :
                context && context.risk_score >= 40 ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30' :
                'bg-accent-green/20 text-accent-green border border-accent-green/30'
              }`}>
                {context ? `${context.risk_score.toFixed(0)}% (${context.risk_level})` : '78% (HIGH)'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-secondary hidden lg:flex">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              <span>Offsets: {context?.nearby_wells?.join(', ') || 'WELL-B, WELL-C, WELL-D'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CHAT CONTAINER */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left: Chat history and interaction */}
        <div className="flex-1 bg-secondary border border-border rounded-lg flex flex-col min-h-0 overflow-hidden shadow-sm">
          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0 text-accent mt-0.5">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-lg p-4 border ${
                  msg.sender === 'user' 
                    ? 'bg-accent/10 border-accent/30 text-text-primary' 
                    : 'bg-tertiary/70 border-border text-text-primary'
                }`}>
                  {/* Tool execution badge */}
                  {msg.tools_called && msg.tools_called.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3 pb-2 border-b border-border/50">
                      <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1 mr-1">
                        <Terminal className="w-3 h-3 text-accent-cyan" />
                        Tools Executed:
                      </span>
                      {msg.tools_called.map((tc, t_idx) => (
                        <span 
                          key={t_idx} 
                          className="bg-secondary px-2 py-0.5 rounded text-[10px] font-mono text-accent-cyan border border-border"
                          title={tc.summary}
                        >
                          {tc.tool}()
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Render content */}
                  {renderFormattedText(msg.text)}

                  {/* Source citations cards */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/60">
                      <div className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 mb-2">
                        <FileText className="w-3.5 h-3.5 text-accent-amber" />
                        Documented Sources & Evidence Citations:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {msg.sources.map((src, s_idx) => (
                          <div 
                            key={s_idx} 
                            className="bg-secondary/90 p-2.5 rounded border border-border/80 hover:border-accent/40 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-xs text-accent-cyan truncate">{src.title}</span>
                              <span className="text-[10px] bg-tertiary px-1 rounded text-text-secondary shrink-0">p. {src.page}</span>
                            </div>
                            <div className="text-[11px] text-text-secondary mb-1">
                              Well: <strong className="text-text-primary">{src.well}</strong> | Depth: <strong className="text-text-primary">{src.depth}</strong> | {src.event}
                            </div>
                            <p className="text-[11px] text-text-secondary italic line-clamp-2">
                              "{src.excerpt}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-text-secondary text-right mt-1 opacity-70">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center text-text-secondary text-xs pl-2">
                <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0 text-accent">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <span>Querying offset telemetry, historical incident records, and RAG document archive...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2 border-t border-border bg-secondary/80 flex items-center gap-2 overflow-x-auto custom-scrollbar">
            <span className="text-[11px] text-text-secondary font-medium shrink-0 flex items-center gap-1 pl-1">
              <Sparkles className="w-3 h-3 text-accent" /> Quick:
            </span>
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="text-xs bg-tertiary border border-border hover:border-accent hover:text-accent-cyan text-text-secondary px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-border bg-secondary">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Ask about current risk, offset wells, stuck pipe mitigations, or 2500m hazards..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 bg-tertiary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-accent text-white px-5 py-2.5 rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2 font-medium text-sm disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Ask</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Operational Telemetry & Decision-Support Panel */}
        <div className="w-[320px] bg-secondary border border-border rounded-lg p-4 flex flex-col gap-4 overflow-y-auto hidden xl:flex">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-accent" />
              Live Rig Telemetry
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-tertiary p-2 rounded border border-border">
                <span className="text-text-secondary">ROP</span>
                <div className="font-mono text-sm font-bold text-text-primary">
                  {context?.live_telemetry.rop || 12.4} m/hr
                </div>
              </div>
              <div className="bg-tertiary p-2 rounded border border-border">
                <span className="text-text-secondary">WOB</span>
                <div className="font-mono text-sm font-bold text-text-primary">
                  {context?.live_telemetry.wob || 18.2} klbf
                </div>
              </div>
              <div className="bg-tertiary p-2 rounded border border-border">
                <span className="text-text-secondary">Torque</span>
                <div className="font-mono text-sm font-bold text-text-primary">
                  {context?.live_telemetry.torque || 22.5} kNm
                </div>
              </div>
              <div className="bg-tertiary p-2 rounded border border-border">
                <span className="text-text-secondary">SPP</span>
                <div className="font-mono text-sm font-bold text-text-primary">
                  {context?.live_telemetry.standpipe_pressure || 2980} psi
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-accent-cyan" />
              Tool-Calling Architecture
            </h3>
            <div className="space-y-1.5 text-xs text-text-secondary">
              <div className="bg-tertiary/60 p-2 rounded border border-border/80">
                <span className="font-mono text-accent-cyan font-bold block">search_reports()</span>
                RAG search on indexed PDF archives
              </div>
              <div className="bg-tertiary/60 p-2 rounded border border-border/80">
                <span className="font-mono text-accent-cyan font-bold block">get_risk_factors()</span>
                Synthesizes ML model & offset hazards
              </div>
              <div className="bg-tertiary/60 p-2 rounded border border-border/80">
                <span className="font-mono text-accent-cyan font-bold block">get_events_by_depth()</span>
                Depth-window incident correlation
              </div>
              <div className="bg-tertiary/60 p-2 rounded border border-border/80">
                <span className="font-mono text-accent-cyan font-bold block">compare_wells()</span>
                Cross-well stratigraphy & NPT metrics
              </div>
            </div>
          </div>

          <div className="mt-auto border-t border-border pt-3 text-[11px] text-text-secondary leading-relaxed bg-tertiary/30 p-2.5 rounded border border-border">
            <div className="flex items-center gap-1.5 font-bold text-accent-amber mb-1">
              <ShieldCheck className="w-4 h-4 text-accent-amber" />
              Decision-Support Standard
            </div>
            NWIS AI Drilling Copilot provides advisory decision-support grounded in offset well historical evidence. It does not issue autonomous rig commands.
          </div>
        </div>
      </div>
    </div>
  );
};
