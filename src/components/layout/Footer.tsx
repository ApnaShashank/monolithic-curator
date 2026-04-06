import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 py-10 border-t border-white/[0.04] flex flex-col md:flex-row justify-between gap-10 text-white/15">
      <div className="space-y-3 max-w-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-white flex items-center justify-center">
            <span className="text-black text-[8px] font-black tracking-tighter">MC</span>
          </div>
          <span className="text-sm font-semibold text-white/50 tracking-tight">Monolithic Curator</span>
        </div>
        <p className="text-[11px] leading-relaxed text-white/15">
          Your second brain for the modern internet. Capture, organize, and resurface digital knowledge using AI.
        </p>
        <p className="text-[9px] uppercase tracking-widest text-white/10">© 2026 Brain Cache</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-12">
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-medium text-white/25 uppercase tracking-widest mb-1">Platform</span>
          <Link href="/neural-chat" className="text-[11px] hover:text-white/50 transition-colors">Neural Chat</Link>
          <Link href="/knowledge-graph" className="text-[11px] hover:text-white/50 transition-colors">Knowledge Graph</Link>
          <Link href="/library" className="text-[11px] hover:text-white/50 transition-colors">Library</Link>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-medium text-white/25 uppercase tracking-widest mb-1">Resources</span>
          <Link href="/settings" className="text-[11px] hover:text-white/50 transition-colors">Settings</Link>
          <Link href="/collections" className="text-[11px] hover:text-white/50 transition-colors">Collections</Link>
          <Link href="/search" className="text-[11px] hover:text-white/50 transition-colors">Search</Link>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-medium text-white/25 uppercase tracking-widest mb-1">About</span>
          <Link href="#" className="text-[11px] hover:text-white/50 transition-colors">Privacy</Link>
          <Link href="#" className="text-[11px] hover:text-white/50 transition-colors">API</Link>
        </div>
      </div>
    </footer>
  );
}
