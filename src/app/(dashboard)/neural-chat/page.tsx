'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'USER' | 'ASSISTANT';
  message: string;
  timestamp: Date;
}

export default function NeuralChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text = input) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'USER', message: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          history: messages.slice(-5) 
        }),
      });
      const data = await res.json();
      
      if (!res.ok || data.error) {
        const assistantMsg: Message = { 
          role: 'ASSISTANT', 
          message: `⚠️ ${data.error || 'Neural sync failed. Try again.'}`, 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, assistantMsg]);
        return;
      }

      const assistantMsg: Message = { 
        role: 'ASSISTANT', 
        message: data.response || 'No response generated.', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Neural Sync Failed:', error);
      const errorMsg: Message = { 
        role: 'ASSISTANT', 
        message: '⚠️ Connection failed. Check your internet and try again.', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    { label: "Maine aaj kya save kiya?", icon: "today" },
    { label: "Mere sab items bata with details", icon: "view_list" },
    { label: "Find connections about AI", icon: "hub" },
    { label: "Meri library mein kitne items hai?", icon: "analytics" },
    { label: "Show recent videos", icon: "movie" },
    { label: "Summarize my saved articles", icon: "article" },
  ];

  return (
    <main className="fixed inset-0 pt-14 md:pl-60 bg-[#050505] flex flex-col h-screen overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.01] rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="px-6 py-4 border-b border-white/[0.04] bg-black/40 backdrop-blur-xl z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-white/20 text-xl">psychology</span>
          <div>
            <h1 className="text-sm font-semibold text-white/80 tracking-tight">Neural Intelligence</h1>
            <p className="text-[9px] text-white/15 font-medium uppercase tracking-widest">Connected to your library</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-[9px] font-medium text-white/25 uppercase tracking-widest">Synced</span>
        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 no-scrollbar relative z-10" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-10">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-white/20 text-2xl">neurology</span>
              </div>
              <h2 className="text-2xl font-headline font-bold text-white tracking-tight">Ask your brain anything</h2>
              <p className="text-white/20 text-sm leading-relaxed">
                Search across your saved fragments, find connections, or ask about what you captured today.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => handleSend(prompt.label)}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-left group"
                >
                  <span className="material-symbols-outlined text-white/15 text-[18px] group-hover:text-white/30 transition-colors">{prompt.icon}</span>
                  <span className="text-xs text-white/30 group-hover:text-white/60 transition-colors">{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="group/msg relative max-w-[80%]">
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'USER' 
                      ? 'bg-white text-black rounded-tr-sm' 
                      : 'bg-white/[0.04] border border-white/[0.06] text-white/70 rounded-tl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>

                  {/* Action buttons — show on hover for USER messages */}
                  {msg.role === 'USER' && (
                    <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 flex items-center gap-1 justify-end mt-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.message);
                          setCopiedIndex(i);
                          setTimeout(() => setCopiedIndex(null), 1500);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-all"
                        title="Copy"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {copiedIndex === i ? 'check' : 'content_copy'}
                        </span>
                        <span>{copiedIndex === i ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setInput(msg.message);
                          // Remove this user msg and its following assistant reply
                          setMessages(prev => {
                            const updated = [...prev];
                            // Remove the AI reply if it's the next message
                            if (updated[i + 1]?.role === 'ASSISTANT') {
                              updated.splice(i, 2);
                            } else {
                              updated.splice(i, 1);
                            }
                            return updated;
                          });
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-all"
                        title="Edit & Resend"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        <span>Edit</span>
                      </button>
                    </div>
                  )}

                  {/* Action buttons — copy for ASSISTANT messages */}
                  {msg.role === 'ASSISTANT' && (
                    <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 flex items-center gap-1 mt-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.message);
                          setCopiedIndex(i);
                          setTimeout(() => setCopiedIndex(null), 1500);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-all"
                        title="Copy"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {copiedIndex === i ? 'check' : 'content_copy'}
                        </span>
                        <span>{copiedIndex === i ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white/[0.04] border border-white/[0.06] p-4 rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-white/20 text-[16px] animate-pulse">neurology</span>
                  <span className="text-[10px] text-white/20 font-medium uppercase tracking-widest">Thinking</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent z-20">
        <div className="max-w-3xl mx-auto relative">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your brain..."
            className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-xl py-4 pl-5 pr-14 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/15 transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-white text-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:hover:scale-100"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
          </button>
        </div>
        <p className="text-center mt-3 text-[9px] text-white/10 font-medium">
          Neural Intelligence • {messages.length} messages
        </p>
      </div>
    </main>
  );
}
