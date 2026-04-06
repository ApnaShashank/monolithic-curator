'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const FLOATING_ICONS = [
  { icon: 'psychology', x: '10%', y: '20%', size: 40, delay: 0, duration: 8 },
  { icon: 'database', x: '80%', y: '15%', size: 32, delay: 1, duration: 10 },
  { icon: 'hub', x: '15%', y: '70%', size: 48, delay: 0.5, duration: 12 },
  { icon: 'bolt', x: '85%', y: '65%', size: 36, delay: 2, duration: 9 },
  { icon: 'auto_awesome', x: '50%', y: '10%', size: 28, delay: 1.5, duration: 11 },
  { icon: 'particle', x: '20%', y: '40%', size: 24, delay: 0.2, duration: 7 },
  { icon: 'brain', x: '75%', y: '80%', size: 52, delay: 2.5, duration: 14 },
  { icon: 'share', x: '40%', y: '85%', size: 30, delay: 0.8, duration: 13 },
];

function LandingCTA() {
  const { data: session } = useSession();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 1.1 }}
    >
      <Link 
        href={session ? "/dashboard" : "/login"}
        className="group relative inline-flex items-center gap-3 px-8 md:px-10 py-4 md:py-5 rounded-full bg-white text-black font-bold text-xs md:text-sm tracking-wide transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] duration-500 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity" />
        <span>{session ? "Resume Architecture" : "Initialize Brain"}</span>
        <motion.span 
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="material-symbols-outlined text-[16px] md:text-[18px]"
        >
          {session ? "terminal" : "arrow_forward"}
        </motion.span>
      </Link>
    </motion.div>
  );
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 50,
        y: (e.clientY / window.innerHeight - 0.5) * 50,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main 
      ref={containerRef}
      className="relative h-dvh w-full bg-[#050505] overflow-hidden flex flex-col items-center justify-start selection:bg-white/10 selection:text-white"
    >
      {/* Background Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -50, 100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" 
        />
        <motion.div 
          animate={{
            x: [0, -100, 50, 0],
            y: [0, 100, -50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[150px]" 
        />
      </div>

      {/* Floating Elements Container */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {FLOATING_ICONS.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.1, 1],
              x: mousePos.x * (idx % 2 === 0 ? 1 : -1) * 0.5,
              y: mousePos.y * (idx % 2 === 0 ? -1 : 1) * 0.5,
            }}
            transition={{
              opacity: { duration: item.duration, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 10, repeat: Infinity, ease: "easeInOut" },
              x: { type: "spring", stiffness: 50, damping: 20 },
              y: { type: "spring", stiffness: 50, damping: 20 }
            }}
            style={{ 
              position: 'absolute', 
              left: item.x, 
              top: item.y,
              filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.1))'
            }}
            className="flex items-center justify-center"
          >
            <motion.span 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: item.duration, repeat: Infinity, ease: "easeInOut" }}
              className="material-symbols-outlined text-white/20 select-none"
              style={{ fontSize: item.size }}
            >
              {item.icon}
            </motion.span>
          </motion.div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full w-full max-w-5xl px-6">
        {/* Neural Core Visualization (TOP POSITION) */}
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1.5, ease: "easeOut" }}
           className="relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center shrink-0 mb-10 md:mb-12"
        >
          {/* Core Glow */}
          <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full animate-pulse" />
          
          {/* Outer Ring (Rotating) */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-white/5 opacity-40 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"
          />
          
          {/* Static Inner Content (Logo) */}
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 50px rgba(255,255,255,0.05)",
                "0 0 100px rgba(255,255,255,0.2)",
                "0 0 50px rgba(255,255,255,0.05)"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center relative overflow-hidden z-20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <img 
              src="/Monolithic Curator Icon.png" 
              alt="Monolithic Curator Logo" 
              className="w-full h-full object-contain p-0 drop-shadow-[0_0_50px_rgba(255,255,255,0.6)]"
            />
          </motion.div>

          {/* Satellite Nodes */}
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <motion.div
              key={i}
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 20 + i * 5, repeat: Infinity, ease: "linear" },
                scale: { duration: 3, repeat: Infinity, delay: i * 0.5 }
              }}
              className="absolute top-1/2 left-1/2 -ml-1 -mt-1 w-2 h-2 bg-white/20 rounded-full blur-[1px]"
              style={{ transformOrigin: `0 ${80 + i * 10}px`, rotate: `${angle}deg` }}
            />
          ))}
        </motion.div>

        {/* Text Content */}
        <div className="text-center w-full">

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-4xl md:text-7xl lg:text-8xl font-headline font-bold text-white tracking-tighter leading-[0.9] mb-6"
          >
            Monolithic<br />
            <span className="text-white/40">Curator</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="text-[11px] md:text-lg text-white/30 max-w-lg mx-auto leading-relaxed mb-10 font-medium"
          >
            Architecting your neural memory in the age of information chaos. 
          </motion.p>

          <LandingCTA />
        </div>
      </div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-20 hover:opacity-40 transition-opacity whitespace-nowrap"
      >
        <div className="h-[1px] w-8 bg-white/30" />
        <span className="text-[10px] font-mono tracking-widest text-white uppercase select-none">
          Vectorized Intelligence 0.1
        </span>
        <div className="h-[1px] w-8 bg-white/30" />
      </motion.div>
    </main>
  );
}
