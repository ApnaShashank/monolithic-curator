import type { Metadata } from "next";
import "./globals.css";

import TopNavBar from "@/components/layout/TopNavBar";
import SideNavBar from "@/components/layout/SideNavBar";
import BottomNavBar from "@/components/layout/BottomNavBar";

import SidebarProviderWrapper from "@/components/layout/SidebarProviderWrapper";

import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "Monolithic Curator | Neural Knowledge Engine",
  description: "Architect your neural memory with Monolithic Curator. Automatically index, classify, and connect every fragment of your knowledge using advanced AI and vector embeddings.",
  icons: {
    icon: "/Monolithic Curator Icon.png",
    apple: "/Monolithic Curator Icon.png",
  },
  openGraph: {
    title: "Monolithic Curator | Neural Knowledge Engine",
    description: "Architect your neural memory with AI-powered knowledge management.",
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
          <SidebarProviderWrapper>
            {children}
          </SidebarProviderWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
