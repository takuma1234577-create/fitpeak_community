import DashboardLayoutClient from "@/components/dashboard/dashboard-layout-client";
import { RecruitModalProvider } from "@/contexts/recruit-modal-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RecruitModalProvider>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </RecruitModalProvider>
  );
}
