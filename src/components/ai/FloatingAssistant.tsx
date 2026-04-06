"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  context?: Array<{ _id: string; title: string }>;
}

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: messages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.response,
        context: data.context
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-4 md:bottom-8 md:right-6 z-50 w-11 h-11 rounded-xl shadow-2xl shadow-black/50 transition-all duration-300 flex items-center justify-center ${
          isOpen 
            ? 'bg-white text-black rotate-90' 
            : 'bg-white/[0.08] backdrop-blur-xl border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.12]'
        }`}
      >
        <span className="material-symbols-outlined text-xl">
          {isOpen ? 'close' : 'psychology'}
        </span>
      </button>

      {/* Drawer */}
      <div
        className={`fixed bottom-24 right-4 md:bottom-[76px] md:right-6 z-50 w-[calc(100vw-2rem)] md:w-80 bg-[#0a0a0a] backdrop-blur-xl rounded-xl border border-white/[0.06] shadow-2xl shadow-black/60 transition-all duration-300 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-[420px]">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.04] flex items-center gap-2">
            <span className="material-symbols-outlined text-white/15 text-[16px]">hub</span>
            <div>
              <h3 className="text-[11px] font-semibold text-white/60">Neural Chat</h3>
              <p className="text-[8px] text-white/15 uppercase tracking-widest">Connected</p>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar"
          >
            {messages.length === 0 && (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-white/[0.06] text-3xl mb-2 block">forum</span>
                <p className="text-[10px] text-white/15 leading-relaxed max-w-[200px] mx-auto">
                  Ask anything about your saved knowledge
                </p>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-[11px] leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-white text-black rounded-tr-sm' 
                    : 'bg-white/[0.04] text-white/50 border border-white/[0.04] rounded-tl-sm'
                }`}>
                  {m.content}
                  
                  {m.context && m.context.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-1">
                       <p className="text-[8px] text-white/15 uppercase tracking-widest">Sources</p>
                       <div className="flex flex-wrap gap-1">
                        {m.context.slice(0, 2).map(ctx => (
                          <Link 
                            key={ctx._id} 
                            href={`/item/${ctx._id}`}
                            className="bg-white/[0.04] hover:bg-white/[0.08] px-1.5 py-0.5 rounded text-[9px] text-white/30 transition-colors"
                          >
                            {ctx.title.slice(0, 20)}...
                          </Link>
                        ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] p-3 rounded-xl rounded-tl-sm flex gap-1 items-center">
                  <div className="w-1 h-1 bg-white/20 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1 h-1 bg-white/20 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1 h-1 bg-white/20 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-white/[0.04]">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your brain..."
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg py-2.5 pl-3 pr-10 text-xs text-white focus:outline-none focus:border-white/15 transition-all placeholder:text-white/10"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-white text-black flex items-center justify-center disabled:opacity-20 transition-all hover:scale-105"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
