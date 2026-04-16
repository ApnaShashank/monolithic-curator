import type { Metadata } from "next";
import "./globals.css";

import TopNavBar from "@/components/layout/TopNavBar";
import SideNavBar from "@/components/layout/SideNavBar";
import BottomNavBar from "@/components/layout/BottomNavBar";

import SidebarProviderWrapper from "@/components/layout/SidebarProviderWrapper";

import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "Noteslia | Thought Architecture Engine",
  description: "Noteslia helps you architect your digital memory. Organize, connect, and retrieve every thought with a high-performance, grid-based interface.",
  icons: {
    icon: "/Monolithic Curator Icon.png",
    apple: "/Monolithic Curator Icon.png",
  },
  openGraph: {
    title: "Noteslia | Thought Architecture Engine",
    description: "Architect your thoughts with Noteslia's precision design system.",
    images: ["/Monolithic Curator Icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-body min-h-screen flex flex-col relative" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
