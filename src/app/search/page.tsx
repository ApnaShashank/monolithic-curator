'use client';

import { useState, useRef, useEffect } from 'react';

interface SearchResult {
  item: {
    _id: string;
    title: string;
    type: string;
    tags: string[];
    summary?: string;
    url?: string;
    thumbnail?: string;
    createdAt: string;
  };
  score: number;
  matchType: 'semantic' | 'text';
}

const TYPE_ICONS: Record<string, string> = {
  article: 'article', video: 'movie', pdf: 'picture_as_pdf',
  tweet: 'chat', image: 'image', note: 'edit_note', link: 'link',
};

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalFound, setTotalFound] = useState(0);
  const [searchType, setSearchType] = useState('');
  const [searchTime, setSearchTime] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('search-history');
    if (saved) setHistory(JSON.parse(saved));
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);

    const newHistory = [q, ...history.filter((h) => h !== q)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('search-history', JSON.stringify(newHistory));

    const start = Date.now();
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, limit: 10 }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setTotalFound(data.totalFound || 0);
      setSearchType(data.searchType || '');
      setSearchTime(Date.now() - start);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const scoreOpacity = (score: number) => {
    if (score >= 0.85) return 'text-white/70';
    if (score >= 0.7) return 'text-white/40';
    return 'text-white/20';
  };

  return (
    <main className="page-container">
      <div className="max-w-3xl mx-auto">
        {/* Search */}
        <section className="mb-12">
          <div className="relative">
            <div className="relative bg-white/[0.03] rounded-xl flex items-center border border-white/[0.06] focus-within:border-white/15 transition-all">
              <span className="material-symbols-outlined ml-4 text-white/15 text-[20px]">search</span>
              <input
                ref={inputRef}
                className="w-full bg-transparent text-white py-4 px-4 text-base placeholder:text-white/15 outline-none"
                placeholder="Search your brain..."
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <div className="pr-3">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
                ) : (
                  <button
                    onClick={() => handleSearch()}
                    className="bg-white text-black px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/90 transition-all active:scale-95"
                  >
                    Search
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="mt-3 flex gap-4 px-1 overflow-x-auto no-scrollbar">
              <span className="text-[9px] text-white/10 font-medium flex items-center gap-1.5 shrink-0 uppercase tracking-widest">
                <span className="w-1 h-1 rounded-full bg-white/10" /> Recent
              </span>
              {history.map((h) => (
                <button
                  key={h}
                  onClick={() => { setQuery(h); handleSearch(h); }}
                  className="text-[11px] text-white/15 hover:text-white/40 transition-colors whitespace-nowrap"
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Empty */}
        {!searched && !loading && (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-white/[0.06] text-7xl mb-4 block">search</span>
            <h2 className="text-white font-headline text-xl font-bold mb-2">Search your brain</h2>
            <p className="text-white/20 text-sm max-w-sm mx-auto leading-relaxed">
              Type anything — concepts, ideas, keywords. Semantic AI understands meaning, not just exact words.
            </p>
          </div>
        )}

        {/* No Results */}
        {searched && !loading && results.length === 0 && (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-white/[0.06] text-7xl mb-4 block">search_off</span>
            <h2 className="text-white font-headline text-xl font-bold mb-2">No matches found</h2>
            <p className="text-white/20 text-sm">Try different keywords or save more content first.</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[9px] text-white/15 uppercase tracking-widest font-medium block mb-1">
                  {searchType === 'semantic' ? 'Semantic Results' : 'Text Results'}
                </span>
                <h1 className="text-2xl font-bold font-headline text-white tracking-tight">
                  {totalFound} matches
                </h1>
              </div>
              <div className="text-[10px] text-white/15 font-mono">
                {searchTime}ms
              </div>
            </div>

            <div className="space-y-3">
              {results.map(({ item, score, matchType }, i) => (
                <a key={item._id} href={`/item/${item._id}`}>
                  <article className={`glass-card p-5 group hover:bg-white/[0.05] transition-all duration-200 ${i === 0 ? 'p-6' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2 items-center">
                        <span className="material-symbols-outlined text-white/10 text-[18px]">
                          {TYPE_ICONS[item.type] || 'link'}
                        </span>
                        <span className="text-[9px] font-medium tracking-widest text-white/15 uppercase">
                          {matchType === 'semantic' ? 'Semantic' : 'Text'} · {item.type}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-base font-bold font-headline ${scoreOpacity(score)}`}>
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                    </div>

                    <h2 className="text-sm font-semibold text-white/80 mb-2 leading-snug group-hover:text-white transition-colors">
                      {item.title}
                    </h2>

                    {item.summary && (
                      <p className="text-white/15 text-xs leading-relaxed mb-3 line-clamp-2">
                        {item.summary}
                      </p>
                    )}

                    {item.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {item.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="text-[9px] text-white/15 font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 border-t border-white/[0.04] pt-6 flex justify-between items-center text-white/10 text-[9px] tracking-widest uppercase font-medium">
          <div>Semantic Search</div>
          <div>Cohere + Pinecone</div>
        </footer>
      </div>
    </main>
  );
}
