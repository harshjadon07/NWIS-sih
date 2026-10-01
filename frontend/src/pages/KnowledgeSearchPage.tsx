import React, { useState } from 'react';
import { Search, BookOpen, ChevronRight, FileText, Crosshair, AlertTriangle } from 'lucide-react';
import { searchReports } from '../services/api';
import type { SearchResult } from '../types';

export const KnowledgeSearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await searchReports(query);
      setResults(data || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold text-text-primary flex items-center justify-center gap-3">
          <BookOpen className="w-10 h-10 text-accent" />
          Historical Knowledge Search
        </h1>
        <p className="text-text-secondary max-w-2xl mx-auto text-lg">
          Ask complex questions about past drilling operations, formations, and incidents across the entire corpus.
        </p>
      </header>

      <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-text-secondary" />
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-24 py-4 bg-secondary border-2 border-border rounded-xl text-lg text-text-primary placeholder-text-secondary/50 focus:ring-accent focus:border-accent transition-colors"
          placeholder="e.g., 'What happened around 2500m in Well 1A?' or 'Show mud loss incidents'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute inset-y-2 right-2 px-6 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {hasSearched && !loading && results.length === 0 && (
        <div className="text-center py-12 text-text-secondary bg-secondary rounded-lg border border-border">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No relevant information found in the historical records.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 border-b border-border pb-2">
            <span className="bg-accent/20 text-accent px-2 py-0.5 rounded text-sm">{results.length}</span>
            Relevant Findings
          </h2>
          
          <div className="grid gap-6">
            {results.map((result, idx) => (
              <div key={idx} className="bg-secondary rounded-xl border border-border p-6 shadow-sm hover:border-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-tertiary rounded-lg">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{result.document.filename}</h3>
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <span>Page {result.chunk.page_number}</span>
                        {result.document.well_id && (
                          <>
                            <span>&bull;</span>
                            <span>Well: {result.document.well_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-tertiary px-3 py-1 rounded-full border border-border">
                    <Crosshair className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-text-secondary">
                      Score: {(result.score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="prose max-w-none mb-6 text-text-primary/90">
                  <p className="leading-relaxed bg-tertiary p-4 rounded-lg border-l-2 border-accent">
                    "{result.chunk.chunk_text}"
                  </p>
                </div>

                {result.entities && result.entities.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                    <span className="text-sm text-text-secondary flex items-center mr-2">
                      <AlertTriangle className="w-4 h-4 mr-1 opacity-70" />
                      Extracted Entities:
                    </span>
                    {result.entities.map((entity, i) => (
                      <span 
                        key={i} 
                        className="px-2 py-1 text-xs rounded-md font-medium capitalize flex items-center gap-1 border"
                        style={{
                          backgroundColor: entity.entity_type === 'event' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          borderColor: entity.entity_type === 'event' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                          color: entity.entity_type === 'event' ? '#eab308' : '#60a5fa'
                        }}
                      >
                        {entity.entity_type}: {entity.entity_value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
