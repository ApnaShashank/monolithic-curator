'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

function InteractiveGrid() {
  const [hoveredCell, setHoveredCell] = useState<{ x: number, y: number } | null>(null);
  
  return (
    <div 
      className="absolute inset-0 z-0 noteslia-grid pointer-events-none opacity-20"
      onMouseMove={(e) => {
        const x = Math.floor(e.clientX / 40);
        const y = Math.floor(e.clientY / 40);
        setHoveredCell({ x, y });
      }}
    >
      {/* Dynamic scanline or grid interaction can be added here if needed */}
    </div>
  );
}

function GridBox({ title, description, icon }: { title: string, description: string, icon: string }) {
  return (
    <div className="noteslia-card noteslia-card-hover p-6 flex flex-col gap-4 group">
      <span className="material-symbols-outlined text-tertiary text-[24px] group-hover:text-primary transition-colors">
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-headline font-bold mb-2 text-white">{title}</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <main className="relative min-h-screen w-full bg-background overflow-x-hidden flex flex-col items-center selection:bg-accent selection:text-white">
      {/* Interactive Grid Background */}
      <div className="absolute inset-0 z-0 noteslia-grid opacity-10" />
      
      {/* Hero Section */}
      <section className="relative z-10 w-full max-w-7xl px-6 pt-32 pb-20 flex flex-col items-center">
        {/* Aesthetic Construction Lines (Noteslia Signature) */}
        <div className="absolute top-20 left-10 w-40 h-px bg-outline/20 hidden lg:block" />
        <div className="absolute top-10 left-20 h-40 w-px bg-outline/20 hidden lg:block" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative mb-12"
        >
          {/* Central Logo Box */}
          <div className="w-24 h-24 border-2 border-primary bg-background flex items-center justify-center relative overflow-hidden group">
             <span className="text-4xl font-headline font-black text-primary z-10">N</span>
             {/* Decorative Internal Grid */}
             <div className="absolute inset-0 noteslia-grid opacity-20 scale-50 group-hover:scale-100 transition-transform duration-700" />
          </div>
          {/* Orbital Circle (Static & Clean) */}
          <div className="absolute inset-[-40px] border border-outline/10 rounded-full pointer-events-none" />
          <div className="absolute inset-[-80px] border border-outline/5 rounded-full pointer-events-none" />
        </motion.div>

        <div className="text-center max-w-4xl">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="noteslia-header mb-6"
          >
            Digital Memory Architecture
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-5xl md:text-8xl font-headline font-bold text-white tracking-tighter mb-8"
          >
            Design Your <span className="text-tertiary">Knowledge</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-base md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-12"
          >
            Noteslia is a high-performance substrate for your thoughts. 
            Capture, architecture, and connect fragments in a precision-designed neural interface.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link 
              href={session ? "/dashboard" : "/login"}
              className="px-10 py-4 bg-primary text-background font-bold text-sm tracking-wider uppercase hover:bg-neutral-200 transition-all active:scale-95"
            >
              {session ? "Enter Dashboard" : "Get Started"}
            </Link>
            <button className="px-10 py-4 border border-outline text-white font-bold text-sm tracking-wider uppercase hover:bg-surface-container transition-all">
              Documentation
            </button>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="relative z-10 w-full max-w-6xl px-6 py-20 border-y border-outline/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-l border-t border-outline/10">
          <div className="border-r border-b border-outline/10">
            <GridBox 
              icon="grid_view"
              title="Box-Based Organization"
              description="A unique spatial interface that treats every note as a fundamental architectural unit."
            />
          </div>
          <div className="border-r border-b border-outline/10">
            <GridBox 
              icon="architecture"
              title="Thought Architecture"
              description="Build deep hierarchies and lateral connections across your entire mental repository."
            />
          </div>
          <div className="border-r border-b border-outline/10">
            <GridBox 
              icon="query_stats"
              title="Neural Graphing"
              description="Visualize the growth of your ideas through an interactive, multi-dimensional knowledge graph."
            />
          </div>
        </div>
      </section>

      {/* Decorative Branding Section */}
      <section className="relative z-10 w-full max-w-7xl px-6 py-40 flex flex-col items-center justify-center overflow-hidden">
        {/* Large Aesthetic Circle */}
        <div className="absolute w-[600px] h-[600px] border border-outline/5 rounded-full pointer-events-none flex items-center justify-center">
            <div className="w-[400px] h-[400px] border border-outline/5 rounded-full" />
            <div className="w-[200px] h-[200px] border border-outline/5 rounded-full" />
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center z-10"
        >
          <h2 className="text-xs uppercase tracking-[0.5em] text-on-surface-variant font-mono mb-8">System Status: Optimal</h2>
          <div className="flex items-center gap-12 sm:gap-24 opacity-20">
            <span className="material-symbols-outlined text-[64px]">all_inclusive</span>
            <span className="material-symbols-outlined text-[64px]">fingerprint</span>
            <span className="material-symbols-outlined text-[64px]">token</span>
          </div>
        </motion.div>
      </section>

      {/* Footer Branding */}
      <footer className="relative z-10 w-full py-12 px-10 border-t border-outline/10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-white flex items-center justify-center text-[10px] font-black text-black">N</div>
          <span className="text-xs font-bold tracking-widest uppercase">Noteslia</span>
        </div>
        <div className="flex gap-8 text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
          <a href="#" className="hover:text-white transition-colors">Enterprise</a>
        </div>
      </footer>
    </main>
  );
}
