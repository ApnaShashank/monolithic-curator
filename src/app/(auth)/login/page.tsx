'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setError(res.error === 'CredentialsSignin' ? 'Invalid email or password' : res.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative"
      >
        {/* Glow Effect */}
        <div className="absolute -inset-0.5 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur opacity-30" />
        
        <div className="relative bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-none p-8 md:p-10">
          <div className="text-center mb-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-white flex items-center justify-center mb-6"
            >
               <span className="text-2xl font-headline font-black text-black">N</span>
            </motion.div>
            <h1 className="text-3xl font-headline font-bold text-white tracking-tight mb-2">Access Core</h1>
            <p className="text-white/40 text-sm">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-none p-3 text-red-400 text-xs text-center font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div className="group relative">
                <label className="block text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1.5 ml-1">Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
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
                {isLoading ? (
                  <motion.span 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="material-symbols-outlined text-[20px]"
                  >
                    sync
                  </motion.span>
                ) : (
                  <>
                    Initialize
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </span>
            </button>
          </form>

          <p className="mt-8 text-center text-white/20 text-xs">
            New here? {' '}
            <Link href="/register" className="text-white/60 hover:text-white transition-colors">
              Initialize Profile
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

    <main className="relative h-dvh w-full bg-background overflow-hidden flex items-center justify-center selection:bg-accent selection:text-white">
      {/* Interactive Grid Background */}
      <div className="absolute inset-0 noteslia-grid opacity-5 pointer-events-none" />

      <Suspense fallback={<div className="text-white/20 animate-pulse uppercase tracking-widest font-mono text-xs">Synchronizing...</div>}>
        <LoginForm />
      </Suspense>
      
      {/* Footer Branding */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none select-none">
        <span className="text-[10px] font-mono tracking-[0.5em] text-white uppercase">
          Noteslia Secure Substrate
        </span>
      </div>
    </main>
  );
}
