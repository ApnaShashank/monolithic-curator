'use client';

import { useState, useEffect } from 'react';

interface EditItem {
  _id: string;
  title: string;
  url?: string;
  type: string;
  content?: string;
  summary?: string;
  tags: string[];
  collections?: string[];
}

interface Collection {
  _id: string;
  title: string;
  icon: string;
}

interface Props {
  item: EditItem | null;
  onClose: () => void;
  onSaved: (updated: EditItem) => void;
}

const TYPES = [
  { key: 'article', icon: 'article', label: 'Article' },
  { key: 'video', icon: 'movie', label: 'Video' },
  { key: 'pdf', icon: 'picture_as_pdf', label: 'PDF' },
  { key: 'tweet', icon: 'chat', label: 'Tweet' },
  { key: 'note', icon: 'edit_note', label: 'Note' },
  { key: 'link', icon: 'link', label: 'Link' },
] as const;

export default function EditItemModal({ item, onClose, onSaved }: Props) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('link');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/collections')
      .then(res => res.json())
      .then(data => setAvailableCollections(data.collections || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setUrl(item.url || '');
      setType(item.type || 'link');
      setContent(item.content || item.summary || '');
      setTagsInput(item.tags?.join(', ') || '');
      setSelectedCollection(item.collections?.[0] || '');
      setError('');
    }
  }, [item]);

  if (!item) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      const res = await fetch(`/api/items/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim() || undefined,
          type,
          content: content.trim(),
          tags,
          collections: selectedCollection ? [selectedCollection] : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');

      onSaved({
        ...item,
        title: title.trim(),
        url: url.trim(),
        type,
        content: content.trim(),
        tags,
        collections: selectedCollection ? [selectedCollection] : [],
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-[#0e0e0e] w-full max-w-lg rounded-xl border border-white/[0.06] shadow-2xl shadow-black/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'cardIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <div>
            <span className="block text-[9px] text-white/15 uppercase tracking-widest font-medium mb-0.5">Editing</span>
            <h2 className="text-base font-headline font-bold text-white">Edit Item</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.05] transition-colors"
          >
            <span className="material-symbols-outlined text-white/25 text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
          {/* Type */}
          <div className="space-y-1.5">
            <label className="block text-[9px] text-white/15 uppercase tracking-widest font-medium">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    type === key
                      ? 'bg-white text-black'
                      : 'bg-white/[0.04] text-white/25 hover:text-white/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-[9px] text-white/15 uppercase tracking-widest font-medium">Title</label>
            <input
              className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-white/20 px-3 py-2.5 text-sm text-white placeholder:text-white/10 rounded-lg outline-none transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title..."
            />
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <label className="block text-[9px] text-white/15 uppercase tracking-widest font-medium">URL</label>
            <input
              className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-white/20 px-3 py-2.5 text-sm text-white placeholder:text-white/10 rounded-lg outline-none transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>

          {/* Content / Notes */}
          <div className="space-y-1.5">
            <label className="block text-[9px] text-white/15 uppercase tracking-widest font-medium">Notes / Description</label>
            <textarea
              className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-white/20 px-3 py-2.5 text-sm text-white placeholder:text-white/10 rounded-lg outline-none transition-all resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add notes or description..."
              rows={3}
            />
          </div>

          {/* Collection Selection */}
          <div className="space-y-1.5">
            <label className="block text-[9px] text-white/15 uppercase tracking-widest font-medium">Collection</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedCollection('')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                  selectedCollection === '' 
                    ? 'bg-white text-black border-white' 
                    : 'bg-white/[0.02] text-white/20 border-white/[0.06] hover:border-white/20'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">label_off</span>
                None
              </button>
              {availableCollections.map(col => (
                <button
                  key={col._id}
                  onClick={() => setSelectedCollection(col._id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                    selectedCollection === col._id 
                      ? 'bg-white text-black border-white' 
                      : 'bg-white/[0.02] text-white/20 border-white/[0.06] hover:border-white/20'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{col.icon}</span>
                  <span className="truncate">{col.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="block text-[9px] text-white/15 uppercase tracking-widest font-medium">Tags (comma separated)</label>
            <input
              className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-white/20 px-3 py-2.5 text-sm text-white placeholder:text-white/10 rounded-lg outline-none transition-all"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ai, tech, design..."
            />
            {tagsInput && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tagsInput.split(',').map((t, i) => t.trim()).filter(t => t).map((tag, i) => (
                  <span key={i} className="text-[9px] text-white/20 font-medium bg-white/[0.04] px-1.5 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-[11px]">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.04] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-white/30 hover:text-white/60 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-black font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-white/90 transition-all active:scale-95 disabled:opacity-30 text-xs"
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">check</span>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
