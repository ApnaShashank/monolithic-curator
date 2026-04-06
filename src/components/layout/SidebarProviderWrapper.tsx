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
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  return (
    <>
      {!isLandingPage && <TopNavBar />}
      
      {/* Mobile Overlay */}
      {isOpen && !isLandingPage && (
        <div 
          className="sidebar-overlay" 
          onClick={closeSidebar}
        />
      )}

      {!isLandingPage && <SideNavBar />}
      
      <div className={`main-content-wrapper ${isOpen && !isLandingPage ? "content-shifted" : ""}`}>
        {children}
      </div>
      
      {!isLandingPage && <BottomNavBar />}
      {!isLandingPage && <FloatingAssistant />}
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
