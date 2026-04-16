import { useState, useRef, useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";
import SaveContentModal from "../modals/SaveContentModal";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const MOCK_NOTIFICATIONS = [
  { id: 1, text: "3 new thoughts indexed successfully", time: "2m ago", icon: "hub" },
  { id: 2, text: "Deep synthesis complete: 'Next.js Architecture'", time: "1h ago", icon: "psychology" },
  { id: 3, text: "Daily knowledge resurfacing ready", time: "4h ago", icon: "auto_awesome" },
];

export default function TopNavBar() {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { toggleSidebar } = useSidebar();
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      <nav className="fixed top-0 w-full h-14 z-50 bg-black/80 backdrop-blur-xl border-b border-white/6 flex justify-between items-center px-4 transition-all">
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-on-background flex items-center justify-center">
              <span className="text-background text-[10px] font-black tracking-tighter">N</span>
            </div>
            <span className="text-sm font-headline font-bold tracking-tight text-white/90">Noteslia</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-white text-black px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Capture</span>
          </button>
          <div className="flex items-center gap-1 ml-1 relative">
            {/* Notifications */}
            <div ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-lg transition-all ${showNotifications ? 'bg-white/8 text-white' : 'text-white/30 hover:text-white/70 hover:bg-white/4'}`}
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-[#0e0e0e] border border-white/6 rounded-xl shadow-2xl shadow-black/50 p-4 overflow-hidden z-50 overflow-y-auto max-h-[400px]"
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/4">
                      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Activity</span>
                      <button className="text-[10px] text-white/30 font-medium hover:text-white transition-colors">Clear</button>
                    </div>
                    <div className="space-y-3">
                      {MOCK_NOTIFICATIONS.map(n => (
                        <div key={n.id} className="flex gap-3 items-start group p-2 rounded-lg hover:bg-white/3 transition-colors">
                          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-white/50 text-[14px]">{n.icon}</span>
                          </div>
                          <div>
                            <p className="text-[11px] text-white/70 leading-tight">{n.text}</p>
                            <span className="text-[9px] text-white/20 font-medium block mt-1">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Menu */}
            <div ref={profileRef} className="relative">
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className={`w-7 h-7 rounded-full overflow-hidden border transition-all ${showProfile ? 'border-white/40 ring-1 ring-white/10' : 'border-white/8 hover:border-white/20'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  alt="User Avatar" 
                  src={session?.user?.image || "https://ui-avatars.com/api/?name=" + (session?.user?.name || "User") + "&background=random"} 
                />
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-[#0e0e0e] border border-white/6 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-white/4">
                      <p className="text-xs font-medium text-white/90 truncate">{session?.user?.name || "Brain Cache User"}</p>
                      <p className="text-[10px] text-white/25 mt-0.5 truncate">{session?.user?.email || "active@braincache.ai"}</p>
                    </div>
                    <div className="p-1.5">
                       <Link 
                        href="/settings" 
                        onClick={() => setShowProfile(false)}
                        className="flex items-center gap-2.5 p-2 rounded-lg text-[11px] text-white/40 hover:text-white hover:bg-white/4 transition-all w-full"
                      >
                        <span className="material-symbols-outlined text-[16px]">settings</span>
                        <span>Settings</span>
                      </Link>
                      <Link 
                        href="/settings" 
                        onClick={() => setShowProfile(false)}
                        className="flex items-center gap-2.5 p-2 rounded-lg text-[11px] text-white/40 hover:text-white hover:bg-white/4 transition-all w-full"
                      >
                        <span className="material-symbols-outlined text-[16px]">account_circle</span>
                        <span>Account</span>
                      </Link>
                      <div className="h-px bg-white/4 my-1 mx-1" />
                      <button 
                        onClick={handleSignOut}
                        className="flex items-center gap-2.5 p-2 rounded-lg text-[11px] text-red-400 hover:bg-red-400/10 transition-all w-full text-left"
                      >
                        <span className="material-symbols-outlined text-[16px]">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>
      <SaveContentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
