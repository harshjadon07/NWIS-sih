import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Sparkles, FileText, AlertCircle, ChevronRight, Activity, Terminal, Mic, MicOff, Volume2, Square, Loader2
} from 'lucide-react';
import { getCopilotContext, sendCopilotMessage } from '../services/api';
import type { CopilotContext, ChatMessage } from '../types';

const QUICK_PROMPTS = [
  "Explain current risk factors",
  "Find similar historical wells",
  "What happened around 2500 metres?",
  "Which nearby wells experienced mud loss?"
];

export const CopilotPage = () => {
  const [context, setContext] = useState<CopilotContext | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputLanguage, setInputLanguage] = useState('en-US');
  const [isListening, setIsListening] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isTranslatingMsg, setIsTranslatingMsg] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
           setInput(prev => (prev ? prev + ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = inputLanguage;
          recognitionRef.current.start();
          setIsListening(true);
        } catch(e) {
          console.error(e);
        }
      } else {
        alert("Speech Recognition is not supported in this browser.");
      }
    }
  };

  const getTranslateLang = (bcp47: string) => {
    if (bcp47.startsWith('hi') || bcp47 === 'en-IN') return 'hi';
    return 'en';
  };

  const translateText = async (text: string, toLang: string) => {
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      return data[0].map((item: any) => item[0]).join('');
    } catch (e) {
      console.error("Translation error", e);
      return text;
    }
  };

  const handlePlayAudio = (msg: ChatMessage) => {
    if (playingId === msg.id) {
       window.speechSynthesis.cancel();
       setPlayingId(null);
       return;
    }
    window.speechSynthesis.cancel();
    setPlayingId(msg.id);

    let textToSpeak = msg.originalText || msg.text;
    textToSpeak = textToSpeak.replace(/[#*>_`]/g, '');

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(utterance);
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Welcome to the NWIS Drilling Copilot. I'm connected to your live telemetry and the historical well database.

**Current Active Well:** \`WELL-A\`  
I am tracking your depth, formation transitions, and offset hazard models in real time. 

How can I help you analyze the current drilling environment?`,
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
    setIsTranslatingMsg(true);

    try {
      let englishText = textToSend;
      const langCode = getTranslateLang(inputLanguage);
      if (langCode !== 'en') {
        englishText = await translateText(textToSend, 'en');
      }

      setIsTranslatingMsg(false);
      const response = await sendCopilotMessage(englishText, context?.active_well || 'WELL-A');
      
      let displayText = response.reply;
      if (langCode !== 'en') {
        setIsTranslatingMsg(true);
        displayText = await translateText(response.reply, langCode);
        setIsTranslatingMsg(false);
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: displayText,
        originalText: response.reply,
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
        text: "I was unable to connect to the backend services. Please ensure the server is running and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setIsTranslatingMsg(false);
    }
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-3 text-[15px] leading-relaxed text-text-primary">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-lg font-semibold text-text-primary mt-6 mb-2">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('#### ')) {
            return (
              <h4 key={idx} className="text-base font-medium text-text-primary mt-4 mb-2">
                {line.replace('#### ', '')}
              </h4>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="border-l-4 border-accent-amber/50 bg-accent-amber/10 px-4 py-2 text-text-secondary rounded-r-md my-3 italic">
                {line.replace('> ', '')}
              </blockquote>
            );
          }
          if (line.startsWith('* ') || line.startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-accent mt-1">•</span>
                <span dangerouslySetInnerHTML={{ 
                  __html: line.substring(2)
                    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-text-primary">$1</strong>')
                    .replace(/\`([^`]+)\`/g, '<code class="bg-tertiary border border-border px-1.5 py-0.5 rounded text-sm text-text-primary font-mono">$1</code>')
                }} />
              </div>
            );
          }
          if (line.startsWith('|') && line.endsWith('|')) {
            if (line.includes(':---')) return null;
            const cells = line.split('|').filter(c => c.trim() !== '');
            const isHeader = idx > 0 && lines[idx + 1]?.includes(':---');
            return (
              <div key={idx} className={`flex border-b border-border ${isHeader ? 'bg-tertiary font-medium text-sm' : 'text-sm'}`}>
                {cells.map((cell, cidx) => (
                  <div key={cidx} className="flex-1 px-4 py-2" dangerouslySetInnerHTML={{
                    __html: cell.trim()
                      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-text-primary">$1</strong>')
                      .replace(/\`([^`]+)\`/g, '<code class="bg-tertiary px-1 py-0.5 rounded text-xs font-mono">$1</code>')
                  }} />
                ))}
              </div>
            );
          }
          if (!line.trim()) {
            return null;
          }
          return (
            <p key={idx} dangerouslySetInnerHTML={{
              __html: line
                .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-text-primary">$1</strong>')
                .replace(/\`([^`]+)\`/g, '<code class="bg-tertiary border border-border px-1.5 py-0.5 rounded text-sm text-text-primary font-mono">$1</code>')
            }} />
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-5xl mx-auto bg-secondary rounded-xl border border-border overflow-hidden shadow-sm">
      
      {/* Header Context Banner */}
      <div className="bg-secondary border-b border-border px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-accent/10 p-2 rounded-lg">
            <Bot className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-text-primary">AI Copilot</h1>
            <p className="text-xs text-text-secondary">Assisting with real-time drilling operations</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 bg-tertiary px-3 py-1.5 rounded-md border border-border">
            <span className="text-text-secondary text-xs">Well:</span>
            <span className="font-medium text-text-primary">{context?.active_well || 'WELL-A'}</span>
          </div>
          <div className="flex items-center gap-2 bg-tertiary px-3 py-1.5 rounded-md border border-border">
            <span className="text-text-secondary text-xs">Depth:</span>
            <span className="font-medium text-accent-cyan">{context ? `${context.current_depth.toFixed(1)} m` : '2,430.0 m'}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-tertiary px-3 py-1.5 rounded-md border border-border">
            <span className="text-text-secondary text-xs">Formation:</span>
            <span className="font-medium text-text-primary truncate max-w-[150px]">{context?.formation || 'Disang Shale'}</span>
          </div>
          
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border ${
            context && context.risk_score >= 70 ? 'bg-accent-red/10 border-accent-red/30' :
            context && context.risk_score >= 40 ? 'bg-accent-amber/10 border-accent-amber/30' :
            'bg-accent-green/10 border-accent-green/30'
          }`}>
            <AlertCircle className={`w-4 h-4 ${
              context && context.risk_score >= 70 ? 'text-accent-red' :
              context && context.risk_score >= 40 ? 'text-accent-amber' :
              'text-accent-green'
            }`} />
            <span className={`text-xs font-medium ${
              context && context.risk_score >= 70 ? 'text-accent-red' :
              context && context.risk_score >= 40 ? 'text-accent-amber' :
              'text-accent-green'
            }`}>
              {context ? `${context.risk_level} RISK` : 'HIGH RISK'}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-primary custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Avatar */}
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Message Content */}
            <div className={`max-w-[85%] md:max-w-[75%] ${
              msg.sender === 'user' 
                ? 'bg-tertiary border border-border text-text-primary px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm' 
                : 'text-text-primary'
            }`}>
              
              {/* Tool Execution Tags */}
              {msg.tools_called && msg.tools_called.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {msg.tools_called.map((tc, t_idx) => (
                    <div key={t_idx} className="flex items-center gap-1.5 bg-tertiary border border-border px-2.5 py-1 rounded-md text-xs text-text-secondary">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>{tc.tool}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Text Body */}
              {msg.sender === 'user' ? (
                <div className="text-[15px]">{msg.text}</div>
              ) : (
                renderFormattedText(msg.text)
              )}

              {/* Citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Sources Used
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {msg.sources.map((src, s_idx) => (
                      <div 
                        key={s_idx} 
                        className="bg-secondary border border-border rounded-lg p-3 hover:border-accent/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm text-text-primary">{src.title}</span>
                          <span className="text-xs text-text-secondary bg-tertiary px-2 py-0.5 rounded-md">Page {src.page}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-secondary mb-2">
                          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {src.well}</span>
                          <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /> {src.depth}m</span>
                        </div>
                        <p className="text-xs text-text-secondary italic line-clamp-2 border-l-2 border-border pl-2">
                          "{src.excerpt}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {msg.sender === 'assistant' && msg.id !== 'welcome' && !msg.id.startsWith('err-') && (
                <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                  <button
                    onClick={() => handlePlayAudio(msg)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-tertiary hover:bg-tertiary/80 text-text-secondary hover:text-text-primary rounded-md border border-border transition-colors"
                  >
                    {playingId === msg.id ? (
                      <>
                        <Square className="w-3.5 h-3.5 text-accent-red" />
                        <span>Stop Audio</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-accent-cyan" />
                        <span>Listen in English</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-tertiary border border-border flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <User className="w-4 h-4 text-text-secondary" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 mt-1 shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              {isTranslatingMsg ? 'Translating...' : 'Analyzing context...'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-secondary border-t border-border shrink-0">
        <div className="max-w-4xl mx-auto">
          {/* Quick Prompts */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="text-xs bg-tertiary border border-border hover:bg-tertiary/80 text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-accent" />
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Language:</span>
              <select
                value={inputLanguage}
                onChange={(e) => setInputLanguage(e.target.value)}
                className="bg-primary border border-border text-text-primary text-xs rounded-md px-2 py-1 outline-none focus:border-accent/50"
              >
                <option value="en-US">English</option>
                <option value="hi-IN">Hindi</option>
                <option value="en-IN">Hinglish</option>
              </select>
            </div>
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-end gap-2"
          >
            <div className="flex-1 relative bg-primary border border-border focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 rounded-xl overflow-hidden transition-all shadow-sm flex items-center">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 transition-colors ${isListening ? 'text-accent-red animate-pulse' : 'text-text-secondary hover:text-accent'}`}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <textarea
                placeholder="Message Copilot..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={loading}
                className="w-full bg-transparent text-text-primary placeholder:text-text-secondary text-sm px-4 py-3.5 focus:outline-none resize-none min-h-[52px] max-h-[150px] custom-scrollbar"
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-accent hover:bg-accent/90 text-white p-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[11px] text-text-secondary">
              Copilot is an advisory system. Always verify information before making drilling decisions.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

