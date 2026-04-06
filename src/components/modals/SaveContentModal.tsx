'use client';

import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SaveContentModal({ isOpen, onClose }: Props) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [type, setType] = useState<'article' | 'video' | 'pdf' | 'tweet' | 'note' | 'link'>('article');
  const [magicLoading, setMagicLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  if (!isOpen) return null;

  const handleMagicGenerate = async () => {
    if (!url.trim()) {
      setError('Paste a link first');
      return;
    }
    setMagicLoading(true);
    setError('');
    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.title) setTitle(data.title);
      if (!notes.trim()) {
        setNotes(data.description || `Captured from ${data.source || 'web'}.`);
      }
      if (data.type) setType(data.type);
      setPreview(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate');
    } finally {
      setMagicLoading(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setUrl(''); setTitle(''); setNotes('');
      setSaved(false); setError('');
      onClose();
    }
  };

  const detectTypeFromUrl = (u: string) => {
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'video';
    if (u.includes('twitter.com') || u.includes('x.com')) return 'tweet';
    if (u.endsWith('.pdf')) return 'pdf';
    return 'article';
  };

  const handleUrlChange = (u: string) => {
    setUrl(u);
    if (u) setType(detectTypeFromUrl(u));
  };

  const handleSave = async () => {
    if (!title.trim() && !url.trim()) {
      setError('Enter a title or URL');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: title.trim() || url.trim(),
        url: url.trim() || undefined,
        type,
        content: notes.trim(),
        source: url ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname : undefined,
      };
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || 'Failed to save');
      setSaved(true);
      setTimeout(() => {
        handleClose();
        window.location.reload(); 
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const TYPES = [
    { key: 'article', icon: 'article', label: 'Article' },
    { key: 'video', icon: 'movie', label: 'Video' },
    { key: 'pdf', icon: 'picture_as_pdf', label: 'PDF' },
    { key: 'tweet', icon: 'chat', label: 'Tweet' },
    { key: 'note', icon: 'edit_note', label: 'Note' },
    { key: 'link', icon: 'link', label: 'Link' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-[#0e0e0e] w-full max-w-2xl rounded-xl border border-white/[0.06] shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <div>
            <span className="block text-[9px] text-white/15 uppercase tracking-widest font-medium mb-0.5">New Entry</span>
            <h2 className="text-base font-headline font-bold text-white">Capture</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.05] transition-colors"
          >
            <span className="material-symbols-outlined text-white/25 text-[18px]">close</span>
          </button>
        </div>

        {/* Success */}
        {saved ? (
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <span className="material-symbols-outlined text-white/40 text-5xl mb-3">check_circle</span>
            <h3 className="text-white font-headline text-xl font-bold mb-1">Saved</h3>
            <p className="text-white/20 text-xs text-center">AI is processing tags and embeddings...</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-full">
            {/* Inputs */}
            <div className="flex-1 p-6 space-y-4 border-r border-white/[0.04]">
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
                <label className="flex items-center justify-between text-[9px] text-white/15 uppercase tracking-widest font-medium">
                  <span>Title</span>
                  <button 
                    onClick={handleMagicGenerate}
                    disabled={magicLoading}
                    className="flex items-center gap-1 text-white/20 hover:text-white/50 transition-colors disabled:opacity-30"
                  >
                    <span className={`material-symbols-outlined text-[12px] ${magicLoading ? 'animate-spin' : ''}`}>auto_awesome</span>
                    <span className="text-[8px]">Auto</span>
                  </button>
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-white/20 px-3 py-2.5 text-sm text-white placeholder:text-white/10 rounded-lg outline-none transition-all"
                    placeholder="What did you save?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  {magicLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-3 h-3 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* URL */}
              <div className="space-y-1.5">
                <label className="block text-[9px] text-white/15 uppercase tracking-widest font-medium">URL</label>
                <input
                  className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-white/20 px-3 py-2.5 text-sm text-white placeholder:text-white/10 rounded-lg outline-none transition-all"
                  placeholder="https://..."
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-[9px] text-white/15 uppercase tracking-widest font-medium">Notes</label>
                <textarea
                  className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-white/20 px-3 py-2.5 text-sm text-white placeholder:text-white/10 rounded-lg outline-none transition-all resize-none"
                  placeholder="Why did you save this?"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {error && <p className="text-red-400 text-[11px]">{error}</p>}
            </div>

            {/* AI Preview */}
            <div className="w-full md:w-72 bg-white/[0.01] p-5 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="material-symbols-outlined text-white/15 text-[14px]">auto_awesome</span>
                  <span className="text-[9px] text-white/20 uppercase tracking-widest font-medium">
                    {preview ? 'Preview' : 'AI Processing'}
                  </span>
                </div>

                {preview ? (
                  <div className="space-y-3">
                    {/* Thumbnail */}
                    {preview.thumbnail && (
                      <div className="rounded-lg overflow-hidden aspect-video bg-white/[0.03]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview.thumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Site info */}
                    <div className="flex items-center gap-2">
                      {preview.favicon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview.favicon} alt="" className="w-4 h-4 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      <span className="text-[10px] text-white/30 font-medium">{preview.siteName || preview.source}</span>
                    </div>

                    {/* Author */}
                    {preview.author && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px] text-white/10">person</span>
                        <span className="text-[10px] text-white/20">{preview.author}</span>
                      </div>
                    )}

                    {/* Word count */}
                    {preview.wordCount > 200 && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px] text-white/10">timer</span>
                        <span className="text-[10px] text-white/20">~{Math.ceil(preview.wordCount / 200)} min read</span>
                      </div>
                    )}

                    {/* Tags / Hashtags */}
                    {preview.hashtags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {preview.hashtags.slice(0, 5).map((h: string) => (
                          <span key={h} className="text-[8px] text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded">#{h}</span>
                        ))}
                      </div>
                    )}

                    {/* Social links */}
                    {preview.socialLinks?.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {preview.socialLinks.slice(0, 3).map((link: string, i: number) => {
                          const p = link.includes('twitter') || link.includes('x.com') ? 'X' 
                            : link.includes('github') ? 'GitHub' : link.includes('linkedin') ? 'LinkedIn' : 'Link';
                          return <span key={i} className="text-[8px] text-white/15 bg-white/[0.03] px-1.5 py-0.5 rounded font-mono">{p}</span>;
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[
                      { icon: 'sell', label: 'Auto Tags', desc: 'Generated from content' },
                      { icon: 'summarize', label: 'Summary', desc: 'AI-generated overview' },
                      { icon: 'account_tree', label: 'Graph', desc: 'Linked to related items' },
                    ].map(({ icon, label, desc }) => (
                      <div key={label} className="p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="material-symbols-outlined text-[12px] text-white/10">{icon}</span>
                          <span className="text-[9px] text-white/20 uppercase tracking-wider font-medium">{label}</span>
                        </div>
                        <p className="text-[10px] text-white/10">{desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || (!title.trim() && !url.trim())}
                  className="w-full bg-white text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white/90 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">database</span>
                      Save to Brain
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
