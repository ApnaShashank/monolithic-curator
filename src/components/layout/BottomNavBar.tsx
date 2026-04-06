"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SaveContentModal from "../modals/SaveContentModal";

export default function BottomNavBar() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/", icon: "space_dashboard" },
    { name: "Library", href: "/library", icon: "inventory_2" },
    { name: "AI", href: "/neural-chat", icon: "psychology" },
    { name: "Settings", href: "/settings", icon: "tune" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 w-full h-16 bg-black/90 backdrop-blur-xl md:hidden flex justify-around items-center z-50 border-t border-white/[0.04] px-2 pb-safe">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          
          if (index === 2) {
            return (
              <div key="add-btn-wrapper" className="flex items-center gap-4">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-white text-black w-10 h-10 rounded-xl flex items-center justify-center -mt-8 shadow-[0_4px_20px_rgba(255,255,255,0.15)] cursor-pointer hover:scale-105 active:scale-95 transition-all border-2 border-black"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
                <Link 
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 min-w-[56px] transition-colors ${isActive ? "text-white" : "text-white/20"}`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="text-[9px] font-medium">{item.name}</span>
                </Link>
              </div>
            );
          }

          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center gap-1 min-w-[56px] transition-colors ${isActive ? "text-white" : "text-white/20"}`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[9px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <SaveContentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
