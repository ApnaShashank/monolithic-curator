"use client";

import { motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';

export default function ExtensionPage() {
  const { showToast } = useToast();

  const handleDownload = () => {
    window.location.href = '/api/extension/download';
    showToast('Preparing neural interface bundle...', { type: 'info' });
  };

  const steps = [
    {
      title: "Download Bundle",
      description: "Click the download button to receive your localized browser capture utility as a ZIP archive.",
      icon: "file_download",
    },
    {
      title: "Extract Files",
      description: "Unzip the downloaded folder to a permanent location on your drive (e.g., your Documents folder).",
      icon: "unarchive",
    },
    {
      title: "Open Extensions",
      description: "Navigate to chrome://extensions in your browser and enable 'Developer Mode' in the top right corner.",
      icon: "extension",
    },
    {
      title: "Load Unpacked",
      description: "Click 'Load unpacked' and select the folder you just extracted. The icon will appear in your toolbar.",
      icon: "publish",
    }
  ];

  return (
    <main className="page-container relative overflow-hidden min-h-[calc(100vh-4rem)]">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <section className="text-center mb-20 pt-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-4 block">Peripheral Interface</span>
            <h1 className="text-4xl md:text-6xl font-headline font-bold text-white tracking-tight mb-6">
              Extend your consciousness.
            </h1>
            <p className="text-lg text-white/30 max-w-2xl mx-auto leading-relaxed mb-10">
              The Monolithic Curator extension allows you to capture knowledge fragments directly from any web page without breaking your flow.
            </p>
            
            <button
              onClick={handleDownload}
              className="group relative inline-flex items-center gap-3 bg-white text-black font-bold px-8 py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.95] shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            >
              <span className="material-symbols-outlined group-hover:animate-bounce">download</span>
              Download Neural Capture Utility
            </button>
            <p className="text-[10px] text-white/10 mt-4 uppercase tracking-widest">Version 1.0.4 • Manifest v3</p>
          </motion.div>
        </section>

        {/* Setup Guide */}
        <section className="mb-32">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-xl font-headline font-bold text-white tracking-tight">Installation Guide</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-card p-8 group hover:bg-white/5 transition-all"
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-blue-500/30 group-hover:bg-blue-500/5 transition-all">
                    <span className="material-symbols-outlined text-white/30 group-hover:text-blue-400 transition-colors">
                      {step.icon}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-[10px] font-mono text-white/10">0{idx + 1}</span>
                       <h3 className="text-base font-bold text-white/80 group-hover:text-white transition-colors">{step.title}</h3>
                    </div>
                    <p className="text-sm text-white/30 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="mb-20">
          <div className="glass-card p-12 relative overflow-hidden border-blue-500/10">
            <div className="absolute top-0 right-0 p-10 opacity-5">
               <span className="material-symbols-outlined text-[200px] text-white">auto_awesome</span>
            </div>
            <div className="relative max-w-lg">
                <h2 className="text-2xl font-headline font-bold text-white mb-6">Seamless Intelligence</h2>
                <ul className="space-y-4">
                    {[
                        "One-click capture for links, articles, and research",
                        "Automatic semantic indexing directly into your library",
                        "Credential-synced secure authentication",
                        "Zero-latency background processing"
                    ].map(feature => (
                        <li key={feature} className="flex items-center gap-3 text-sm text-white/40">
                            <span className="material-symbols-outlined text-blue-400 text-base">check_circle</span>
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>
          </div>
        </section>

        <footer className="text-center pb-20">
           <p className="text-[10px] text-white/10 uppercase tracking-[0.4em]">Neural Link Protocol v0.1-Alpha</p>
        </footer>
      </div>
    </main>
  );
}
