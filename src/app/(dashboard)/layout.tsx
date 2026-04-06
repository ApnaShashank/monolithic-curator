import SidebarProviderWrapper from "@/components/layout/SidebarProviderWrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProviderWrapper>
      {children}
    </SidebarProviderWrapper>
  );
}
