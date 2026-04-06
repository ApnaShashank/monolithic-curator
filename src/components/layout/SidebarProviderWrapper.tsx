"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { ToastProvider } from "@/context/ToastContext";
import TopNavBar from "./TopNavBar";
import SideNavBar from "./SideNavBar";
import BottomNavBar from "./BottomNavBar";

import FloatingAssistant from "../ai/FloatingAssistant";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen, closeSidebar } = useSidebar();

  return (
    <>
      <TopNavBar />
      
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={closeSidebar}
        />
      )}

      <SideNavBar />
      
      <div className={`main-content-wrapper ${isOpen ? "content-shifted" : ""}`}>
        {children}
      </div>
      
      <BottomNavBar />
      <FloatingAssistant />
    </>
  );
}

export default function SidebarProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </ToastProvider>
  );
}
