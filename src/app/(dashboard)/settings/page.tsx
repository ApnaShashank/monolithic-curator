"use client";

import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';

export default function Settings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: ''
  });
  const [config, setConfig] = useState({
    semanticSearch: true,
    autoTagging: true,
    frequency: 70,
    theme: 'dark' as 'dark' | 'light' | 'system'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/user/settings');
        const data = await res.json();
        if (data.settings) {
          setConfig(data.settings);
        }
        setUserData({
          name: data.name || '',
          email: data.email || ''
        });
      } catch (err) {
        console.error('Failed to fetch settings', err);
        showToast('Failed to load settings', { type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showToast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: config })
      });
      if (res.ok) {
        showToast('Preferences saved successfully', { type: 'success' });
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      showToast('Failed to save preferences', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePurge = async () => {
    if (!confirm('Are you absolutely sure? This will permanently delete all your saved items and collections. This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/user/purge', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        showToast(`Success: Purged ${data.itemsDeleted} fragments`, { type: 'success' });
      } else {
        throw new Error('Purge failed');
      }
    } catch (err) {
      showToast('Failed to purge data', { type: 'error' });
    }
  };

  if (loading) {
    return (
      <main className="page-container flex items-center justify-center py-20">
        <div className="text-white/20 animate-pulse font-mono text-xs uppercase tracking-widest">
          Loading Preferences...
        </div>
      </main>
    );
  }

  return (
    <main className="page-container">
      <div className="max-w-3xl">
        {/* Header */}
        <header className="mb-10">
          <span className="text-[9px] text-white/15 font-medium tracking-widest uppercase mb-2 block">Configuration</span>
          <h1 className="text-3xl font-headline font-bold text-white tracking-tight">Settings</h1>
        </header>

        <div className="space-y-12">
          {/* AI Configuration */}
          <section>
            <div className="mb-5 flex items-baseline justify-between border-b border-white/4 pb-3">
              <h2 className="text-base font-headline font-semibold text-white tracking-tight">AI Configuration</h2>
              <span className="text-[9px] text-white/15 font-mono">v4.2.0</span>
            </div>
            
            <div className="space-y-3">
              {/* Toggle: Semantic Search */}
              <div className="flex items-center justify-between p-4 glass-card group hover:bg-white/5 transition-all">
                <div>
                  <h3 className="text-sm font-medium text-white/80">Semantic Search</h3>
                  <p className="text-[11px] text-white/20 mt-0.5">Deep vector-based retrieval for conceptual queries</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    checked={config.semanticSearch} 
                    onChange={(e) => setConfig({ ...config, semanticSearch: e.target.checked })}
                    className="sr-only peer" 
                    type="checkbox" 
                  />
                  <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:inset-s-[2px] after:bg-white/40 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
                </label>
              </div>
              
              {/* Toggle: Auto-tagging */}
              <div className="flex items-center justify-between p-4 glass-card group hover:bg-white/5 transition-all">
                <div>
                  <h3 className="text-sm font-medium text-white/80">Auto-tagging</h3>
                  <p className="text-[11px] text-white/20 mt-0.5">Categorize new entries using entity extraction</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    checked={config.autoTagging} 
                    onChange={(e) => setConfig({ ...config, autoTagging: e.target.checked })}
                    className="sr-only peer" 
                    type="checkbox" 
                  />
                  <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:inset-s-[2px] after:bg-white/40 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
                </label>
              </div>
              
              {/* Slider */}
              <div className="p-4 glass-card space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-white/80">Resurfacing Frequency</h3>
                    <p className="text-[11px] text-white/20 mt-0.5">How often forgotten connections are suggested</p>
                  </div>
                  <span className="text-[10px] font-mono text-white/40 bg-white/4 px-2 py-0.5 rounded">Daily</span>
                </div>
                <input 
                  className="w-full h-0.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white" 
                  max="100" min="0" type="range" 
                  value={config.frequency}
                  onChange={(e) => setConfig({ ...config, frequency: parseInt(e.target.value) })}
                />
                <div className="flex justify-between text-[9px] text-white/15 uppercase tracking-widest">
                  <span>Minimal</span>
                  <span>Aggressive</span>
                </div>
              </div>
            </div>
          </section>

          {/* Account */}
          <section>
            <div className="mb-5 border-b border-white/4 pb-3">
              <h2 className="text-base font-headline font-semibold text-white tracking-tight">Account</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-widest text-white/15 font-medium px-1">Email</label>
                <input 
                  className="w-full bg-white/3 border border-white/6 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:border-white/20 transition-all outline-none" 
                  type="email" 
                  value={userData.email} 
                  readOnly
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-widest text-white/15 font-medium px-1">Plan</label>
                <div className="flex items-center justify-between w-full bg-white/3 border border-white/6 rounded-lg px-3 py-2.5 text-sm">
                  <span className="text-white/70 font-medium">Pro</span>
                  <span className="text-[9px] bg-white text-black px-1.5 py-0.5 rounded font-medium">Active</span>
                </div>
              </div>
              
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[9px] uppercase tracking-widest text-white/15 font-medium px-1">API Key</label>
                <div className="relative">
                  <input 
                    className="w-full bg-white/3 border border-white/6 rounded-lg px-3 py-2.5 text-sm text-white/30 outline-none" 
                    readOnly 
                    type={showKey ? "text" : "password"} 
                    defaultValue="sk_monolith_7721_v923184210" 
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-all text-[11px] font-medium"
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Maintenance */}
          <section>
            <div className="mb-5 flex items-center gap-2 border-b border-white/4 pb-3">
              <h2 className="text-base font-headline font-semibold text-white tracking-tight">Maintenance</h2>
              <span className="text-[8px] bg-white/6 text-white/30 px-1.5 py-0.5 rounded font-medium uppercase tracking-wider">Admin</span>
            </div>
            
            <div className="glass-card p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-white/80">Neural Index Re-sync</h3>
                  <p className="text-[11px] text-white/20 mt-0.5">Re-process items with missing tags or embeddings</p>
                </div>
                <button 
                  onClick={async () => {
                    showToast('Re-sync started...', { type: 'info' });
                    try {
                      const res = await fetch('/api/admin/resync', { method: 'POST' });
                      const data = await res.json();
                      showToast(`Done: ${data.processed || 0} items processed`, { type: 'success' });
                    } catch (e) {
                      showToast('Re-sync failed', { type: 'error' });
                    }
                  }}
                  className="px-4 py-2 bg-white/6 text-white/50 text-xs font-medium rounded-lg hover:bg-white hover:text-black transition-all whitespace-nowrap"
                >
                  Start Re-sync
                </button>
              </div>
            </div>
          </section>

          {/* Extension */}
          <section>
            <div className="mb-5 border-b border-white/4 pb-3">
              <h2 className="text-base font-headline font-semibold text-white tracking-tight">Browser Extension</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a href="/extension" className="glass-card p-5 space-y-3 block hover:bg-white/5 transition-all">
                <span className="material-symbols-outlined text-white/15 text-2xl">extension</span>
                <div>
                  <h3 className="text-sm font-medium text-white/80">Chrome Extension</h3>
                  <p className="text-[11px] text-white/20 mt-0.5">Capture anything from your browser with one click</p>
                </div>
                <div className="pt-1">
                  <span className="text-[9px] font-medium text-blue-400 uppercase tracking-widest flex items-center gap-1">
                    Manage & Download →
                  </span>
                </div>
              </a>

              <div className="glass-card p-5 space-y-3 opacity-40 cursor-not-allowed">
                <span className="material-symbols-outlined text-white/15 text-2xl">terminal</span>
                <div>
                  <h3 className="text-sm font-medium text-white/40">CLI Tool</h3>
                  <p className="text-[11px] text-white/10 mt-0.5">Batch import local files via command line</p>
                </div>
                <span className="text-[9px] font-medium text-white/10 uppercase tracking-widest">Coming Soon</span>
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section>
            <div className="mb-5 border-b border-white/4 pb-3">
              <h2 className="text-base font-headline font-semibold text-white tracking-tight">Appearance</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button 
                onClick={() => setConfig({ ...config, theme: 'dark' })}
                className={`flex flex-col items-center gap-2.5 p-3 glass-card transition-all ${config.theme === 'dark' ? 'border-white/40 bg-white/5' : 'hover:bg-white/5 opacity-50'}`}
              >
                <div className="w-full aspect-video bg-black rounded-md overflow-hidden border border-white/6 p-2 space-y-1">
                  <div className="h-0.5 w-1/2 bg-white/20 rounded"></div>
                  <div className="h-0.5 w-full bg-white/10 rounded"></div>
                  <div className="h-0.5 w-3/4 bg-white/10 rounded"></div>
                </div>
                <span className="text-[11px] font-medium text-white/70">Dark</span>
              </button>
              
              <button 
                 onClick={() => setConfig({ ...config, theme: 'light' })}
                 className={`flex flex-col items-center gap-2.5 p-3 glass-card transition-all ${config.theme === 'light' ? 'border-white/40 bg-white/5' : 'hover:bg-white/5 opacity-50'}`}
              >
                <div className="w-full aspect-video bg-white rounded-md overflow-hidden border border-black/5 p-2 space-y-1">
                  <div className="h-0.5 w-1/2 bg-black/20 rounded"></div>
                  <div className="h-0.5 w-full bg-black/10 rounded"></div>
                  <div className="h-0.5 w-3/4 bg-black/10 rounded"></div>
                </div>
                <span className="text-[11px] font-medium text-white/70">Light</span>
              </button>
              
              <button 
                onClick={() => setConfig({ ...config, theme: 'system' })}
                className={`flex flex-col items-center gap-2.5 p-3 glass-card transition-all ${config.theme === 'system' ? 'border-white/40 bg-white/5' : 'hover:bg-white/5 opacity-50'}`}
              >
                <div className="w-full aspect-video flex rounded-md overflow-hidden border border-white/4">
                  <div className="w-1/2 h-full bg-white p-1.5"><div className="h-0.5 w-full bg-black/15 rounded"></div></div>
                  <div className="w-1/2 h-full bg-black p-1.5"><div className="h-0.5 w-full bg-white/15 rounded"></div></div>
                </div>
                <span className="text-[11px] font-medium text-white/70">System</span>
              </button>
            </div>
          </section>

          {/* Danger */}
          <section className="mt-8 pt-8 border-t border-red-500/10">
            <div className="bg-red-500/4 border border-red-500/10 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-red-400/80">Delete All Data</h3>
                <p className="text-[11px] text-red-400/30 mt-0.5">Permanently remove all saved fragments and embeddings</p>
              </div>
              <button 
                onClick={handlePurge}
                className="px-4 py-2 bg-red-500/10 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500 hover:text-white transition-all active:scale-95 shrink-0"
              >
                Delete Data
              </button>
            </div>
          </section>
        </div>

        {/* Save Bar */}
        <div className="mt-12 flex items-center justify-end gap-3 border-t border-white/4 pt-6">
          <button className="px-4 py-2 text-xs font-medium text-white/20 hover:text-white/50 transition-all">Cancel</button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-white text-black text-xs font-semibold rounded-lg hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <span className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </main>
  );
}
