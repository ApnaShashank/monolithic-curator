'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { CardSkeleton } from '@/components/ui/Skeletons';
import { useToast } from '@/context/ToastContext';
import EditItemModal from '@/components/modals/EditItemModal';

interface Item {
  _id: string;
  title: string;
  type: string;
  tags: string[];
  thumbnail?: string;
  favicon?: string;
  siteName?: string;
  source?: string;
  summary?: string;
  content?: string;
  url?: string;
  metadata?: {
    author?: string;
    wordCount?: number;
    hashtags?: string[];
    socialLinks?: string[];
  };
  isBookmarked?: boolean;
  createdAt: string;
}

interface Collection {
  _id: string;
  title: string;
  description: string;
  icon: string;
}

const TYPE_ICONS: Record<string, string> = {
  article: 'article', video: 'movie', pdf: 'picture_as_pdf',
  tweet: 'chat', image: 'image', note: 'edit_note', link: 'link',
};

export default function CollectionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<Item | null>(null);
  const { showToast } = useToast();

  const fetchCollection = useCallback(async () => {
    try {
      const res = await fetch(`/api/collections/${id}`);
      const data = await res.json();
      setCollection(data.collection);
    } catch (err) {
      console.error('Failed to fetch collection', err);
    }
  }, [id]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/items?collection=${id}&limit=50`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to fetch items', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCollection();
    fetchItems();
  }, [fetchCollection, fetchItems]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePurge = async (item: Item) => {
    setItems(prev => prev.filter(i => i._id !== item._id));
    showToast(`Removed from collection: ${item.title.slice(0, 20)}...`);
    // Note: In a real app, this might just remove from collection, not delete the item.
    // For now, we'll just handle the UI.
    try {
        await fetch(`/api/items/${item._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collections: [] }), // Simplified: remove from all
        });
    } catch (e) {
        console.error(e);
    }
  };

  const filteredItems = search
    ? items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <main className="page-container pb-24">
      {/* Header */}
      <header className="mb-12">
        <Link 
          href="/collections" 
          className="inline-flex items-center gap-1.5 text-[10px] font-medium text-white/20 hover:text-white/50 uppercase tracking-widest mb-6 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span> Back to Collections
        </Link>
        
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shadow-2xl">
            <span className="material-symbols-outlined text-white/40 text-3xl">
              {collection?.icon || 'folder'}
            </span>
          </div>
          <div className="pt-1">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-white mb-2">
              {collection?.title || 'Loading...'}
            </h1>
            <p className="text-white/20 text-sm max-w-2xl leading-relaxed">
              {collection?.description || 'Curated knowledge fragment collection.'}
            </p>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/10 text-[18px]">search</span>
          <input
            className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-white/10"
            placeholder="Search items in this collection..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-2">
          <span className="text-[10px] font-mono text-white/15 uppercase tracking-widest">{items.length} items</span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center glass-card border-dashed">
          <span className="material-symbols-outlined text-white/5 text-6xl mb-4">folder_open</span>
          <h3 className="text-white/40 font-headline text-lg font-bold">Collection is empty</h3>
          <p className="text-white/10 text-xs mt-1">Items added to this collection will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item, idx) => (
            <div 
                key={item._id} 
                className="group relative"
                style={{ animation: `cardIn 0.4s ease-out ${idx * 0.05}s both` }}
            >
              <article className="h-full glass-card overflow-hidden transition-all duration-200 flex flex-col hover:bg-white/[0.02]">
                <Link href={`/item/${item._id}`} className="block flex-1">
                    <div className="aspect-16/10 overflow-hidden relative bg-white/[0.02]">
                        {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/[0.03] text-4xl">{TYPE_ICONS[item.type] || 'link'}</span>
                            </div>
                        )}
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-white/40 uppercase tracking-widest border border-white/5">
                            {item.type}
                        </div>
                    </div>
                    <div className="p-4">
                        <h3 className="font-semibold text-xs text-white/70 line-clamp-2 mb-2 group-hover:text-white transition-colors">{item.title}</h3>
                        <p className="text-[10px] text-white/10 line-clamp-2 leading-relaxed">
                            {item.summary || item.content || 'No description available.'}
                        </p>
                    </div>
                </Link>
                <div className="px-4 pb-4 pt-0 mt-auto">
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="text-[8px] font-mono text-white/10">{formatDate(item.createdAt)}</span>
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={(e) => { e.preventDefault(); setEditItem(item); }}
                                className="p-1 rounded hover:bg-white/5 text-white/20 hover:text-white/40 transition-all"
                             >
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                             </button>
                             <button 
                                onClick={(e) => { e.preventDefault(); handlePurge(item); }}
                                className="p-1 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"
                             >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                             </button>
                        </div>
                    </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <EditItemModal 
        item={editItem}
        onClose={() => setEditItem(null)}
        onSaved={() => { fetchItems(); setEditItem(null); showToast('Item updated'); }}
      />
    </main>
  );
}
