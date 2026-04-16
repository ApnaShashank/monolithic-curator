'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { CardSkeleton } from '@/components/ui/Skeletons';

interface Item {
  _id: string;
  title: string;
  type: string;
  tags: string[];
  thumbnail?: string;
  summary?: string;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  article: 'article', video: 'movie', pdf: 'picture_as_pdf',
  tweet: 'chat', image: 'image', note: 'edit_note', link: 'link',
};

export default function Dashboard() {
  const [recent, setRecent] = useState<Item[]>([]);
  const [resurfaced, setResurfaced] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch('/api/items?limit=6&sort=newest')
      .then((r) => r.json())
      .then((data) => {
        setRecent(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(console.error);

    fetch('/api/items/resurface')
      .then((r) => r.json())
      .then((data) => {
        setResurfaced(data.items || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <main className="page-container">
      {/* Hero */}
      <section className="mb-16 md:mb-20">
        <div className="max-w-3xl space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-[0.2em]">
              {total > 0 ? `${total} thoughts architected` : 'Waiting for input'}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-extrabold leading-[0.95] text-white tracking-tighter">
            Architect your<br />digital memory.
          </h1>
          <p className="text-base md:text-lg text-white/30 max-w-xl leading-relaxed">
            Noteslia empowers you to index, connect, and structure every fragment of knowledge with precision using AI-driven architecture.
          </p>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
        <div className="glass-card p-5 group hover:bg-white/5 transition-all">
          <span className="material-symbols-outlined text-white/20 mb-3 text-2xl group-hover:text-white/40 transition-colors">database</span>
          <p className="text-2xl font-headline font-bold text-white">{total}</p>
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-medium mt-1">Fragments</p>
        </div>
        <div className="glass-card p-5 group hover:bg-white/5 transition-all">
          <span className="material-symbols-outlined text-white/20 mb-3 text-2xl group-hover:text-white/40 transition-colors">psychology</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-headline font-bold text-white">Live</p>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-medium mt-1">Noteslia AI</p>
        </div>
        <div className="glass-card p-5 group hover:bg-white/5 transition-all">
          <span className="material-symbols-outlined text-white/20 mb-3 text-2xl group-hover:text-white/40 transition-colors">hub</span>
          <p className="text-2xl font-headline font-bold text-white">Active</p>
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-medium mt-1">Graph</p>
        </div>
        <Link href="/library" className="bg-on-background p-5 rounded-2xl flex flex-col justify-between group transition-all hover:scale-[1.02] active:scale-[0.98]">
           <span className="material-symbols-outlined text-background/40 mb-3 text-2xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
           <div>
             <p className="text-sm font-bold text-background leading-tight">Architecture</p>
             <p className="text-[10px] text-background/40 mt-0.5">Browse your entire library</p>
           </div>
        </Link>
      </div>

      {/* Brain Resurfacing */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-white/20 text-xl">auto_awesome</span>
          <h2 className="text-lg font-headline font-bold text-white tracking-tight">Intelligence</h2>
          <div className="h-px flex-1 bg-white/4 ml-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? [1, 2].map(i => <div key={i} className="h-48 glass-card overflow-hidden"><CardSkeleton /></div>) :
           resurfaced.map((item) => (
            <Link key={item._id} href={`/item/${item._id}`} className="group">
              <div className="glass-card p-6 hover:bg-white/[0.05] transition-all cursor-pointer relative overflow-hidden h-full">
                 <div className="absolute top-0 right-0 p-5 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
                    <span className="material-symbols-outlined text-5xl text-white">{TYPE_ICONS[item.type]}</span>
                 </div>
                 <span className="text-[9px] text-white/20 font-medium uppercase tracking-[0.2em] mb-3 block">Memory Fragment</span>
                 <h3 className="text-base font-headline font-bold text-white/90 mb-3 group-hover:text-white transition-colors leading-snug line-clamp-2">
                    {item.title}
                 </h3>
                 <p className="text-xs text-white/20 line-clamp-2 mb-4 leading-relaxed">
                   {item.summary || "Indexed based on semantic similarity to your existing brain nodes."}
                 </p>
                 <div className="flex items-center gap-3 text-[9px] text-white/15 font-medium uppercase tracking-widest">
                    <span>{formatDate(item.createdAt)}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-white/10" />
                    <span>Revisit</span>
                 </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-lg font-headline font-bold text-white tracking-tight">Latest Entries</h2>
          <Link href="/library" className="text-[10px] font-medium text-white/20 hover:text-white/50 uppercase tracking-widest transition-colors">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? [1, 2, 3].map(i => <CardSkeleton key={i} />) : 
           recent.map((item) => (
            <Link key={item._id} href={`/item/${item._id}`}>
              <div className="group glass-card p-5 hover:bg-white/[0.05] transition-all flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="material-symbols-outlined text-white/15 text-lg">
                    {TYPE_ICONS[item.type] || 'link'}
                  </span>
                  <span className="text-[9px] text-white/15 font-medium uppercase tracking-widest">{item.type}</span>
                </div>
                <h3 className="font-semibold text-sm text-white/80 mb-2 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {item.tags.slice(0, 2).map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] text-white/25 rounded font-medium">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-auto text-[9px] text-white/15 font-medium uppercase tracking-widest">
                  {formatDate(item.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
