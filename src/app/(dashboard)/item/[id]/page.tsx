'use client';

import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import { useToast } from '@/context/ToastContext';
import { DetailSkeleton, SidebarSkeleton } from '@/components/ui/Skeletons';
import EditItemModal from '@/components/modals/EditItemModal';

interface IItem {
  _id: string;
  title: string;
  url?: string;
  type: string;
  content: string;
  summary?: string;
  tags: string[];
  thumbnail?: string;
  source?: string;
  metadata?: {
    author?: string;
    readTime?: number;
    platform?: string;
    publishedAt?: string;
  };
  highlights: Array<{ text: string; color: string; note?: string }>;
  isBookmarked?: boolean;
  collections?: string[];
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  article: 'article', video: 'movie', pdf: 'picture_as_pdf',
  tweet: 'chat', image: 'image', note: 'edit_note', link: 'link',
};

export default function ItemDetail({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { showToast } = useToast();
  
  const [item, setItem] = useState<IItem | null>(null);
  const [related, setRelated] = useState<IItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState({ text: '', x: 0, y: 0 });
  const [editMode, setEditMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/items/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Item not found');
        return res.json();
      })
      .then((data) => {
        setItem(data.item);
        setRelated(data.related || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({
        text: sel.toString().trim(),
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 40,
      });
    } else {
      setSelection({ text: '', x: 0, y: 0 });
    }
  };

  const addHighlight = async () => {
    if (!item || !selection.text) return;
    const newHighlight = { text: selection.text, color: '#FFFFFF' };
    const updatedHighlights = [...(item.highlights || []), newHighlight];
    setItem({ ...item, highlights: updatedHighlights });
    setSelection({ text: '', x: 0, y: 0 });
    try {
      await fetch(`/api/items/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ highlights: updatedHighlights }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDelete = async () => {
    if (!item) return;
    const savedItem = { ...item };
    setItem(null);
    
    showToast(`Fragment deleted`, {
      type: "undo",
      duration: 5000,
      onUndo: () => {
        if (deleteTimerRef.current) {
          clearTimeout(deleteTimerRef.current);
          deleteTimerRef.current = null;
        }
        setItem(savedItem);
      }
    });

    deleteTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/items/${params.id}`, { method: 'DELETE' });
        if (res.ok) {
          router.push('/library');
        } else {
          setItem(savedItem);
          showToast("Delete failed", { type: "error" });
        }
      } catch (e) {
        setItem(savedItem);
        console.error(e);
      } finally {
        deleteTimerRef.current = null;
      }
    }, 5100);
  };

  if (loading) return (
    <main className="md:pl-64 pt-14 flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden">
      <div className="flex-1 max-w-4xl mx-auto px-6 lg:px-12 py-12">
        <DetailSkeleton />
      </div>
      <aside className="w-full lg:w-80 border-l border-white/[0.04] bg-black/40 lg:sticky lg:top-14 h-[calc(100vh-3.5rem)]">
        <SidebarSkeleton />
      </aside>
    </main>
  );

  if (error || (!item && !loading)) return (
    <div className="md:pl-64 pt-24 px-12 text-center h-screen flex flex-col items-center justify-center bg-[#050505] w-full overflow-x-hidden">
      <span className="material-symbols-outlined text-5xl text-white/[0.06] mb-4">error</span>
      <h1 className="text-xl font-headline font-bold text-white mb-3">Content not found</h1>
      <Link href="/library" className="bg-white/[0.06] px-6 py-2.5 rounded-lg text-white/50 text-xs font-medium hover:bg-white hover:text-black transition-all">
        Back to Library
      </Link>
    </div>
  );

  if (!item) return null;

  const isYouTube = item.url?.includes('youtube.com') || item.url?.includes('youtu.be');
  const videoId = isYouTube ? item.url?.match(/(?:v=|\/|embed\/|youtu.be\/)([^&?#/]{11})/)?.[1] : null;

  return (
    <main className="md:pl-64 pt-14 min-h-screen bg-[#050505] flex flex-col items-center w-full overflow-x-hidden">
      {/* Selection Tooltip */}
      {selection.text && (
        <button
          onClick={addHighlight}
          className="fixed z-[100] bg-white text-black px-3 py-1.5 rounded-lg text-[10px] font-semibold shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-105 transition-transform"
          style={{ top: selection.y, left: selection.x, transform: 'translateX(-50%)' }}
        >
          Highlight
        </button>
      )}

      <div className="w-full flex flex-col lg:flex-row divide-x divide-white/[0.04]">
        {/* Content */}
        <div className="flex-1 max-w-4xl mx-auto px-6 lg:px-12 py-10 lg:py-16">
          <header className="mb-12">
            <div className="flex items-center gap-2.5 mb-6">
              <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[9px] font-medium uppercase tracking-widest text-white/30">
                {item.type}
              </span>
              <div className="h-px w-8 bg-white/[0.06]" />
              <span className="text-[9px] text-white/15 uppercase tracking-widest font-medium">
                {item.source || 'Manual Entry'}
              </span>
            </div>
            
            <h1 className="font-headline text-3xl lg:text-5xl font-bold text-white mb-6 leading-tight tracking-tight selection:bg-white/20">
              {item.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-[10px] text-white/20 uppercase tracking-widest font-medium">
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white/50 transition-colors group">
                  <span className="material-symbols-outlined text-sm text-white/15">link</span>
                  <span>Source</span>
                </a>
              )}
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-white/15">calendar_today</span>
                <span>{new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              {item.metadata?.author && (
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-white/15">person</span>
                  <span>{item.metadata.author}</span>
                </div>
              )}
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 hover:text-white/50 transition-colors group"
              >
                <span className="material-symbols-outlined text-sm text-white/15">edit</span>
                <span>Edit</span>
              </button>
            </div>

            {item.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-1.5">
                {item.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-white/[0.04] rounded text-[9px] text-white/20 font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Media */}
          <div className="mb-12">
            {videoId ? (
              <section className="rounded-xl overflow-hidden aspect-video bg-black border border-white/[0.06]">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                  title={item.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </section>
            ) : item.thumbnail ? (
              <section className="rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  alt={item.title} 
                  className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-500" 
                  src={item.thumbnail} 
                  loading="lazy"
                />
              </section>
            ) : null}
          </div>

          <div className="max-w-3xl">
            {/* AI Summary */}
            {item.summary && (
              <section className="mb-12 relative pl-5 border-l border-white/[0.06]">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="material-symbols-outlined text-white/15 text-sm">auto_awesome</span>
                  <span className="text-[9px] text-white/15 uppercase tracking-widest font-medium">AI Summary</span>
                </div>
                <p className="text-lg leading-relaxed text-white/40 italic">
                  &ldquo;{item.summary}&rdquo;
                </p>
              </section>
            )}

            {/* Content */}
            <article 
              ref={contentRef}
              onMouseUp={handleSelection}
              className="prose prose-invert"
            >
              <div className="whitespace-pre-wrap text-base leading-relaxed text-white/40 selection:bg-white/10">
                {item.content || "No detailed content extracted yet."}
              </div>
            </article>

            {/* Highlights */}
            {item.highlights?.length > 0 && (
              <section className="mt-16 pt-12 border-t border-white/[0.04]">
                <div className="flex items-center gap-2 mb-6">
                   <span className="material-symbols-outlined text-white/15 text-lg">draw</span>
                   <h3 className="font-headline text-lg font-bold text-white">Highlights</h3>
                </div>
                <div className="space-y-4">
                  {item.highlights.map((h, i) => (
                    <div key={i} className="glass-card p-5 hover:bg-white/[0.05] transition-all">
                      <p className="text-sm text-white/50 italic leading-relaxed">&ldquo;{h.text}&rdquo;</p>
                      {h.note && (
                        <p className="mt-2 text-[9px] text-white/15 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-0.5 h-0.5 rounded-full bg-white/15" />
                          {h.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <footer className="mt-16 pt-8 border-t border-white/[0.04] flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-4">
              <button 
                onClick={async () => {
                   if (!item) return;
                   const newState = !item.isBookmarked;
                   setItem({ ...item, isBookmarked: newState });
                   try {
                     await fetch(`/api/items/${item._id}`, {
                       method: 'PATCH',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ isBookmarked: newState }),
                     });
                     showToast(newState ? 'Saved to bookmarks' : 'Removed from bookmarks');
                   } catch (e) {
                     setItem({ ...item, isBookmarked: !newState });
                     showToast('Failed to update bookmark', { type: 'error' });
                   }
                }}
                className={`group flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-widest transition-colors ${
                  item.isBookmarked ? 'text-white' : 'text-white/15 hover:text-white/40'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: item.isBookmarked ? "'FILL' 1" : "'FILL' 0" }}>
                  bookmark
                </span> 
                {item.isBookmarked ? 'Saved' : 'Save'}
              </button>
              <button className="group flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-widest text-white/15 hover:text-white/40 transition-colors">
                <span className="material-symbols-outlined text-[16px]">share</span> Share
              </button>
            </div>
            
            <button 
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-widest text-red-400/40 hover:text-red-400 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Delete
            </button>
          </footer>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block w-80 bg-black/30 p-8 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto no-scrollbar">
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[9px] font-medium tracking-widest text-white/15 uppercase">Connections</h3>
                <span className="material-symbols-outlined text-white/10 text-sm">hub</span>
              </div>
              
              <div className="space-y-3">
                {related.length > 0 ? related.map((rel: any) => (
                  <Link key={rel._id} href={`/item/${rel._id}`} className="block group">
                    <div className="glass-card p-4 hover:bg-white/[0.05] transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[12px] text-white/10">
                            {TYPE_ICONS[rel.type] || 'article'}
                          </span>
                          <span className="text-[8px] text-white/10 uppercase tracking-wider font-medium">{rel.type}</span>
                        </div>
                        <span className="text-[9px] font-mono text-white/20">
                          {Math.round((rel.score || 0) * 100)}%
                        </span>
                      </div>
                      
                      <h4 className="text-[12px] font-medium text-white/40 leading-snug group-hover:text-white/70 transition-colors line-clamp-2">
                        {rel.title}
                      </h4>
                    </div>
                  </Link>
                )) : (
                  <div className="p-4 border border-dashed border-white/[0.06] rounded-xl text-center">
                    <p className="text-[9px] text-white/10 uppercase tracking-widest">No connections</p>
                  </div>
                )}
              </div>
            </div>

            <div>
               <h3 className="text-[9px] font-medium tracking-widest text-white/15 uppercase mb-3">Tags</h3>
               <div className="flex flex-wrap gap-1.5">
                {item.tags.map(t => (
                  <span key={t} className="text-[9px] bg-white/[0.04] px-2 py-0.5 rounded text-white/20 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-card p-4">
               <h3 className="text-[9px] text-white/15 uppercase tracking-widest font-medium mb-1.5">Intelligence</h3>
               <p className="text-[11px] text-white/20 leading-relaxed">
                 Connected to {related.length} other fragments in your brain.
               </p>
            </div>
          </div>
        </aside>
      </div>

      <Footer />

      {/* Edit Modal */}
      <EditItemModal
        item={editMode ? item : null}
        onClose={() => setEditMode(false)}
        onSaved={(updated) => {
          setItem(prev => prev ? { ...prev, ...updated } : prev);
          showToast('Item updated');
        }}
      />
    </main>
  );
}
