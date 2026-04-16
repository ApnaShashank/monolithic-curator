'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/login?message=Registration successful. Please sign in.');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative h-dvh w-full bg-background overflow-hidden flex items-center justify-center selection:bg-accent selection:text-white">
      {/* Interactive Grid Background */}
      <div className="absolute inset-0 noteslia-grid opacity-5 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="noteslia-card bg-surface p-8 md:p-10 border border-outline-variant"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-headline font-bold text-white tracking-tight mb-2">Create Account</h1>
            <p className="text-white/40 text-sm">Design your Noteslia profile</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-xs text-center font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div className="group relative">
                <label className="block text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1.5 ml-1">Full Name</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Leonardo Da Vinci"
                  required
                  suppressHydrationWarning
                  className="w-full bg-transparent border border-white/10 rounded-none px-4 py-3.5 text-white text-sm transition-all focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="group relative">
                <label className="block text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1.5 ml-1">Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="leo@noteslia.ai"
                  required
                  suppressHydrationWarning
                  className="w-full bg-transparent border border-white/10 rounded-none px-4 py-3.5 text-white text-sm transition-all focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="group relative">
                <label className="block text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1.5 ml-1">Password</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  suppressHydrationWarning
                  className="w-full bg-transparent border border-white/10 rounded-none px-4 py-3.5 text-white text-sm transition-all focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-black font-bold py-4 transition-all hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? "Syncing..." : "Initialize Profile"}
                {!isLoading && <span className="material-symbols-outlined text-[18px]">verified_user</span>}
              </span>
            </button>
          </form>

          <p className="mt-8 text-center text-white/20 text-xs">
            Already have a profile? {' '}
            <Link href="/login" className="text-white/60 hover:text-white transition-colors underline underline-offset-4">
              Sign in to core
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
