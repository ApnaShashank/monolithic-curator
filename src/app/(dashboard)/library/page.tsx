'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CardSkeleton } from '@/components/ui/Skeletons';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
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
    publishedAt?: string;
  };
  isBookmarked?: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  article: 'article', video: 'movie', pdf: 'picture_as_pdf',
  tweet: 'chat', image: 'image', note: 'edit_note', link: 'link',
};

export default function Library() {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [tagCounts, setTagCounts] = useState<Array<{ tag: string; count: number }>>([]);
  const [hasMore, setHasMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handlePurge = async (item: Item) => {
    const itemToRestore = { ...item };
    setItems(prev => prev.filter(i => i._id !== item._id));

    showToast(`Purged: ${item.title.slice(0, 25)}...`, {
      type: 'undo',
      duration: 5000,
      onUndo: () => {
        setItems(prev => [itemToRestore, ...prev].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    });

    setTimeout(async () => {
      try {
        await fetch(`/api/items/${item._id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Purge failed:', e);
      }
    }, 5100);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const idsToRemove = [...selectedIds];
    const itemsToRestore = items.filter(item => idsToRemove.includes(item._id));
    
    setItems(prev => prev.filter(item => !idsToRemove.includes(item._id)));
    setSelectedIds([]);
    setIsSelectionMode(false);

    showToast(`Purged ${idsToRemove.length} fragments`, {
      type: 'undo',
      duration: 5000,
      onUndo: () => {
        setItems(prev => [...itemsToRestore, ...prev].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    });

    setTimeout(async () => {
      try {
        await Promise.all(idsToRemove.map(id => fetch(`/api/items/${id}`, { method: 'DELETE' })));
      } catch (e) {
        console.error('Bulk delete failed:', e);
      }
    }, 5100);
  };

  const fetchItems = useCallback(async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    try {
      const params = new URLSearchParams({
        sort,
        page: String(currentPage),
        limit: '12',
        ...(activeType ? { type: activeType } : {}),
        ...(activeTag ? { tag: activeTag } : {}),
      });
      const res = await fetch(`/api/items?${params}`);
      const data = await res.json();
      const newItems = data.items || [];
      setItems(reset ? newItems : (prev) => [...prev, ...newItems]);
      setTotal(data.total);
      setTypeCounts(data.typeCounts || {});
      setTagCounts(data.tagCounts || []);
      setHasMore(data.page < data.totalPages);
      if (reset) setPage(1);
    } catch (err) {
      console.error('Failed to fetch items', err);
    } finally {
      setLoading(false);
    }
  }, [sort, activeType, activeTag, page]);

  useEffect(() => {
    fetchItems(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, activeType, activeTag]);

  const filteredItems = search
    ? items.filter(
        (i) =>
          i.title?.toLowerCase().includes(search.toLowerCase()) ||
          i.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : items;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const dynamicTypes = Object.entries(typeCounts)
    .filter(([_, count]) => count > 0)
    .map(([key, count]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1) + (key.endsWith('s') ? '' : 's'),
      icon: TYPE_ICONS[key] || 'label',
      count
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <main className="page-container">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-60 lg:min-w-60 lg:max-w-60 shrink-0 flex flex-col gap-5 lg:sticky lg:top-20 self-start lg:h-[calc(100vh-6rem)] lg:overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-headline text-2xl font-bold tracking-tight text-white mb-1">Library</h1>
              <p className="text-white/20 text-xs font-medium">
                {loading ? '...' : `${total} items saved`}
              </p>
            </div>
            <button 
              onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); }}
              className={`p-1.5 rounded-lg transition-all ${
                isSelectionMode ? 'bg-white text-black' : 'bg-white/[0.04] text-white/20 hover:text-white/50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSelectionMode ? 'close' : 'checklist'}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Sort */}
            <section>
              <label className="text-[9px] font-medium tracking-widest text-white/15 uppercase mb-2 block">Sort</label>
              <div className="bg-white/[0.03] rounded-lg p-0.5 flex">
                {[['newest', 'Newest'], ['oldest', 'Oldest']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setSort(val)}
                    className={`flex-1 text-[11px] font-medium py-1.5 rounded-md transition-all ${
                      sort === val
                        ? 'bg-white text-black'
                        : 'text-white/25 hover:text-white/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Desktop Filters */}
            <section className="hidden lg:block space-y-5">
              <div>
                <label className="text-[9px] font-medium tracking-widest text-white/15 uppercase mb-3 block">Types</label>
                <div className="space-y-0.5">
                  <button
                    onClick={() => setActiveType(null)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                      !activeType 
                        ? 'bg-white/[0.08] text-white' 
                        : 'text-white/25 hover:bg-white/[0.03] hover:text-white/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">apps</span> All
                    </span>
                    <span className="text-[9px] bg-white/[0.06] px-1.5 py-0.5 rounded font-mono">{total}</span>
                  </button>
                  {dynamicTypes.map(({ key, label, icon, count }) => (
                    <button
                      key={key}
                      onClick={() => setActiveType(activeType === key ? null : key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                        activeType === key
                          ? 'bg-white/[0.08] text-white'
                          : 'text-white/25 hover:bg-white/[0.03] hover:text-white/50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">{icon}</span> {label}
                      </span>
                      <span className="text-[9px] bg-white/[0.06] px-1.5 py-0.5 rounded font-mono">{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {tagCounts.length > 0 && (
                <div>
                  <label className="text-[9px] font-medium tracking-widest text-white/15 uppercase mb-3 block">Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {tagCounts.map(({ tag }) => (
                      <button
                        key={tag}
                        onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                        className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                          activeTag === tag
                            ? 'bg-white text-black'
                            : 'bg-white/[0.04] text-white/25 hover:text-white/50'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </aside>

        {/* Content */}
        <div className="grow min-w-0">
          {/* Mobile Filters */}
          <div className="lg:hidden mb-6 -mx-4 px-4 overflow-x-auto no-scrollbar flex items-center gap-1.5 pb-2">
            <button
              onClick={() => setActiveType(null)}
              className={`flex-none px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                !activeType ? 'bg-white text-black' : 'bg-white/[0.04] text-white/25'
              }`}
            >
              All
            </button>
            {dynamicTypes.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveType(activeType === key ? null : key)}
                className={`flex-none px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                  activeType === key ? 'bg-white text-black' : 'bg-white/[0.04] text-white/25'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mb-8 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/15 text-[18px]">search</span>
            <input
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-white/15"
              placeholder="Search saved items..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Loading */}
          {loading && items.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (<CardSkeleton key={i} />))}
            </div>
          )}

          {/* Empty */}
          {!loading && filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <span className="material-symbols-outlined text-white/10 text-5xl mb-4">inventory_2</span>
              <h3 className="text-white font-headline text-lg font-bold mb-1">Nothing saved yet</h3>
              <p className="text-white/20 text-xs max-w-xs">
                Click <strong className="text-white/50">Capture</strong> in the top bar to save your first fragment.
              </p>
            </div>
          )}

          {/* Grid */}
          {filteredItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 relative">
              {filteredItems.map((item, idx) => (
                <div 
                  key={item._id} 
                  className="relative group h-full"
                  style={{ animation: `cardIn 0.4s ease-out ${idx * 0.05}s both` }}
                >
                  {isSelectionMode && (
                    <div 
                      onClick={() => toggleSelection(item._id)}
                      className={`absolute top-3 right-3 z-30 w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                        selectedIds.includes(item._id) ? 'bg-white border-white' : 'bg-black/50 border-white/20'
                      }`}
                    >
                      {selectedIds.includes(item._id) && <span className="material-symbols-outlined text-black text-[14px]">check</span>}
                    </div>
                  )}
                  
                  <div className={`h-full transition-opacity ${isSelectionMode && !selectedIds.includes(item._id) ? 'opacity-40' : 'opacity-100'}`}>
                    <article className={`group h-full glass-card overflow-hidden transition-all duration-200 flex flex-col ${
                      selectedIds.includes(item._id) ? 'border-white/30 ring-1 ring-white/10' : 'hover:bg-white/[0.02]'
                    }`}>
                      {/* Navigation Wrapper for Top part */}
                      <div className="relative flex-1">
                        <Link 
                          href={isSelectionMode ? '#' : `/item/${item._id}`}
                          onClick={(e) => {
                            if (isSelectionMode) { e.preventDefault(); toggleSelection(item._id); }
                          }}
                          className="block h-full"
                        >
                          {/* Thumbnail */}
                          <div className="aspect-16/10 overflow-hidden relative bg-white/[0.02]">
                            {item.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                src={item.thumbnail}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/[0.06] text-5xl">
                                  {TYPE_ICONS[item.type] || 'link'}
                                </span>
                              </div>
                            )}
                            {/* Type badge */}
                            <div className="absolute top-3 left-3">
                              <span className="bg-black/70 backdrop-blur-md text-[9px] font-medium uppercase tracking-widest text-white/60 px-2 py-0.5 rounded">
                                {item.type}
                              </span>
                            </div>
                            {/* Read time */}
                            {item.metadata?.wordCount && item.metadata.wordCount > 100 && (
                              <div className="absolute bottom-3 right-3">
                                <span className="bg-black/70 backdrop-blur-md text-[8px] font-medium text-white/40 px-1.5 py-0.5 rounded">
                                  ~{Math.ceil(item.metadata.wordCount / 200)} min read
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-5">
                            {/* Source row */}
                            <div className="flex items-center gap-2 mb-2">
                              {item.favicon && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                  src={item.favicon} 
                                  alt="" 
                                  className="w-3.5 h-3.5 rounded-sm opacity-50" 
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <span className="text-[9px] text-white/20 font-medium truncate">
                                {item.siteName || item.source || (item.url ? new URL(item.url).hostname : 'Manual')}
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="font-semibold text-sm text-white/80 leading-snug group-hover:text-white transition-colors line-clamp-2 mb-2">
                               {item.title}
                            </h3>

                            {/* Description / Summary */}
                            {(item.summary || item.content) && (
                              <p className="text-white/15 text-xs line-clamp-2 mb-3 leading-relaxed">
                                {item.summary || item.content}
                              </p>
                            )}

                            {/* Tags */}
                            {(item.tags?.length || 0) > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {item.tags?.slice(0, 4).map((tag) => (
                                  <span key={tag} className="text-[9px] text-white/20 font-medium bg-white/[0.03] px-1.5 py-0.5 rounded">
                                    #{tag}
                                  </span>
                                ))}
                                {(item.tags?.length || 0) > 4 && (
                                  <span className="text-[8px] text-white/10 font-mono">+{(item.tags?.length || 0) - 4}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Floating Action Buttons (Outside Link) */}
                        {!isSelectionMode && (
                          <div className="absolute bottom-4 right-5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity z-20">
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditItem(item); }}
                              className="p-1.5 rounded-md bg-black/60 backdrop-blur-md border border-white/5 text-white/30 hover:text-white/60 transition-all"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePurge(item); }}
                              className="p-1.5 rounded-md bg-black/60 backdrop-blur-md border border-white/5 text-white/30 hover:text-red-400 transition-all"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Footer (Non-clickable for main nav) */}
                      <div className="px-5 pb-5 pt-0 mt-auto">
                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                          <span className="text-[9px] text-white/15 font-medium">
                            {formatDate(item.createdAt)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newState = !item.isBookmarked;
                              setItems(prev => prev.map(i => i._id === item._id ? { ...i, isBookmarked: newState } : i));
                              fetch(`/api/items/${item._id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isBookmarked: newState }),
                              }).catch(() => {
                                setItems(prev => prev.map(i => i._id === item._id ? { ...i, isBookmarked: !newState } : i));
                              });
                              showToast(newState ? 'Bookmarked' : 'Bookmark removed');
                            }}
                            className={`transition-all hover:scale-110 active:scale-95 z-20 ${
                              item.isBookmarked ? 'text-white/60' : 'text-white/10 hover:text-white/30'
                            }`}
                            title={item.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                          >
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: item.isBookmarked ? "'FILL' 1" : "'FILL' 0" }}>
                              bookmark
                            </span>
                          </button>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bulk Actions */}
          {isSelectionMode && selectedIds.length > 0 && (
            <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white text-black px-5 py-3 rounded-xl shadow-[0_0_60px_rgba(255,255,255,0.1)] flex items-center gap-6">
               <span className="font-semibold text-xs">{selectedIds.length} selected</span>
               <div className="w-px h-4 bg-black/10" />
               <button onClick={handleBulkDelete} className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 hover:scale-105 transition-transform">
                 <span className="material-symbols-outlined text-[16px]">delete</span> Delete
               </button>
               <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} className="flex items-center gap-1.5 text-[11px] font-medium text-black/40 hover:scale-105 transition-transform">
                 <span className="material-symbols-outlined text-[16px]">close</span> Cancel
               </button>
            </div>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <div className="mt-12 flex justify-center pb-24">
              <button
                onClick={() => { setPage((p) => p + 1); fetchItems(false); }}
                className="px-6 py-2.5 bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs font-medium rounded-lg hover:bg-white/[0.08] hover:text-white/60 transition-all active:scale-95"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditItemModal
        item={editItem}
        onClose={() => setEditItem(null)}
        onSaved={(updated) => {
          setItems(prev => prev.map(i => i._id === updated._id ? { ...i, ...updated } : i));
          showToast('Item updated successfully');
        }}
      />
    </main>
  );
}
