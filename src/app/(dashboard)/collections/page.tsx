'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Collection {
  _id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  itemCount: number;
  createdAt: string;
  previewItems: Array<{ _id: string; title: string; type: string; thumbnail?: string }>;
}

interface Item {
  _id: string;
  title: string;
  type: string;
  tags: string[];
  createdAt: string;
}

const ICONS = ['folder', 'biotech', 'layers', 'psychology', 'code', 'science', 'book', 'language', 'lightbulb', 'star'];
const TYPE_ICONS: Record<string, string> = {
  article: 'article', video: 'movie', pdf: 'picture_as_pdf',
  tweet: 'chat', image: 'image', note: 'edit_note', link: 'link',
};

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('folder');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/collections').then((r) => r.json()),
      fetch('/api/items?limit=10&sort=newest').then((r) => r.json()),
    ])
      .then(([colData, itemData]) => {
        setCollections(colData.collections || []);
        setRecentItems(itemData.items || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc, icon: newIcon }),
      });
      const data = await res.json();
      setCollections((prev) => [{ ...data.collection, itemCount: 0, previewItems: [] }, ...prev]);
      setNewTitle(''); setNewDesc(''); setNewIcon('folder');
      setShowCreate(false);
    } catch (err) {
      console.error('Failed to create collection:', err);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <main className="page-container">
      {/* Header */}
      <section className="mb-10">
        <span className="text-[9px] text-white/15 font-medium tracking-widest uppercase block mb-2">Curated</span>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Collections</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-white text-black px-3.5 py-2 text-xs font-semibold rounded-lg hover:bg-white/90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">add</span> New Collection
          </button>
        </div>
      </section>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] w-full max-w-md rounded-xl border border-white/[0.06] shadow-2xl p-6">
            <h2 className="text-lg font-headline font-bold text-white mb-5">New Collection</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] text-white/15 uppercase tracking-widest block mb-2 font-medium">Title</label>
                <input
                  className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-white/20 px-3 py-2.5 text-sm text-white rounded-lg outline-none transition-all"
                  placeholder="My Research Notes..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[9px] text-white/15 uppercase tracking-widest block mb-2 font-medium">Description</label>
                <textarea
                  className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-white/20 px-3 py-2.5 text-sm text-white rounded-lg outline-none resize-none transition-all"
                  placeholder="What goes in here..."
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[9px] text-white/15 uppercase tracking-widest block mb-2 font-medium">Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewIcon(icon)}
                      className={`p-2 rounded-lg transition-all ${newIcon === icon ? 'bg-white text-black' : 'bg-white/[0.04] text-white/25 hover:text-white/50'}`}
                    >
                      <span className="material-symbols-outlined text-sm">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 bg-white/[0.04] text-white/40 text-xs font-medium rounded-lg hover:bg-white/[0.08] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newTitle.trim()}
                className="flex-1 py-2.5 bg-white text-black text-xs font-semibold rounded-lg disabled:opacity-30 hover:bg-white/90 transition-all"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card h-44 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && collections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <span className="material-symbols-outlined text-white/[0.06] text-6xl mb-4">folder_open</span>
          <h3 className="text-white font-headline text-lg font-bold mb-1.5">No collections yet</h3>
          <p className="text-white/20 text-xs max-w-sm mb-6">
            Organize your fragments into themed collections.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-white text-black px-5 py-2.5 rounded-lg font-semibold text-xs active:scale-95 transition-all"
          >
            Create First Collection
          </button>
        </div>
      )}

      {/* Grid */}
      {collections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <Link 
              key={col._id} 
              href={`/collections/${col._id}`}
              className="group glass-card p-5 transition-all hover:bg-white/[0.05] cursor-pointer flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <span className="material-symbols-outlined text-white/30 group-hover:text-black text-[20px]">
                    {col.icon}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded">
                  {col.itemCount}
                </span>
              </div>
              <div>
                <h3 className="font-headline text-base font-bold text-white/90 mb-1 group-hover:text-white transition-colors">{col.title}</h3>
                {col.description && (
                  <p className="text-[11px] text-white/15 line-clamp-2 leading-relaxed">{col.description}</p>
                )}
              </div>
              {/* Preview */}
              <div className="grid grid-cols-3 gap-1.5 mt-auto">
                {col.previewItems.slice(0, 2).map((item) => (
                  <div key={item._id} className="h-12 rounded-md bg-white/[0.03] overflow-hidden flex items-center justify-center">
                    {item.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover opacity-40" />
                    ) : (
                      <span className="material-symbols-outlined text-white/[0.06] text-lg">
                        {TYPE_ICONS[item.type] || 'link'}
                      </span>
                    )}
                  </div>
                ))}
                {col.itemCount > 2 && (
                  <div className="h-12 rounded-md bg-white/[0.03] flex items-center justify-center">
                    <span className="text-[9px] font-mono text-white/15">+{col.itemCount - 2}</span>
                  </div>
                )}
                {col.itemCount === 0 && (
                  <div className="col-span-3 h-12 rounded-md bg-white/[0.02] flex items-center justify-center">
                    <span className="text-[10px] text-white/10">Empty</span>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-white/10 font-medium">{formatDate(col.createdAt)}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Recent Table */}
      {recentItems.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-headline text-lg font-bold text-white">Recent</h3>
            <a className="text-[10px] font-medium text-white/15 hover:text-white/40 uppercase tracking-widest transition-colors" href="/library">
              View All →
            </a>
          </div>
          <div className="glass-card overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 border-b border-white/[0.04] text-[9px] font-medium text-white/15 uppercase tracking-widest">
              <div className="col-span-6">Name</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-3 text-right">Date</div>
            </div>
            {recentItems.map((item) => (
              <a key={item._id} href={`/item/${item._id}`} className="block">
                <div className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-white/[0.03] transition-colors group cursor-pointer border-t border-white/[0.03]">
                  <div className="col-span-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-white/10 text-[16px]">
                      {TYPE_ICONS[item.type] || 'link'}
                    </span>
                    <div>
                      <p className="text-[12px] font-medium text-white/50 group-hover:text-white/80 line-clamp-1 transition-colors">{item.title}</p>
                      {item.tags.length > 0 && (
                        <p className="text-[9px] text-white/10 mt-0.5">#{item.tags[0]}</p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <span className="text-[10px] text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded capitalize font-medium">
                      {item.type}
                    </span>
                  </div>
                  <div className="col-span-3 text-right text-[10px] text-white/15 font-mono">
                    {formatDate(item.createdAt)}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
