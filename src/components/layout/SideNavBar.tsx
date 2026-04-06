"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import SaveContentModal from "../modals/SaveContentModal";

import { signOut } from "next-auth/react";

export default function SideNavBar() {
  const pathname = usePathname();
  const { isOpen } = useSidebar();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "space_dashboard" },
    { name: "Neural Chat", href: "/neural-chat", icon: "psychology" },
    { name: "Library", href: "/library", icon: "inventory_2" },
    { name: "Search", href: "/search", icon: "search" },
    { name: "Knowledge Graph", href: "/knowledge-graph", icon: "hub" },
    { name: "Collections", href: "/collections", icon: "folder_special" },
  ];

  const bottomItems = [
    { name: "Settings", href: "/settings", icon: "tune" },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      <aside className={`fixed left-0 top-0 h-full w-60 bg-black/60 backdrop-blur-xl border-r border-white/5 flex flex-col py-6 px-3 z-50 mt-14 transition-transform duration-300 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } ${!isOpen ? "md:hidden" : ""}`}>
        
        {/* Navigation */}
        <div className="flex flex-col gap-0.5 flex-1 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 ${
                  isActive 
                    ? "text-white bg-white/10 font-medium" 
                    : "text-white/30 hover:text-white/60 hover:bg-white/5"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span>{item.name}</span>
                {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-white" />}
              </Link>
            );
          })}
        </div>
        
        {/* Bottom Section */}
        <div className="pt-3 border-t border-white/5 space-y-1">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-lg font-semibold text-xs active:scale-95 transition-all hover:bg-white/90"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Capture Thought
          </button>
          
          <div className="mt-2 space-y-0.5">
            {bottomItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
                    isActive 
                      ? "text-white bg-white/10 font-medium" 
                      : "text-white/25 hover:text-white/50 hover:bg-white/5"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
      <SaveContentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
