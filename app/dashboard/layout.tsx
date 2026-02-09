import DashboardHeader from "@/components/dashboard/dashboard-header";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import BottomNav from "@/components/dashboard/bottom-nav";
import Fab from "@/components/dashboard/fab";
import CreateRecruitmentDialog from "@/components/dashboard/create-recruitment-dialog";
import { RecruitModalProvider } from "@/contexts/recruit-modal-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RecruitModalProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader />

        <div className="flex flex-1">
          <DashboardSidebar />

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-5xl px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
              {children}
            </div>
          </main>
        </div>

        <BottomNav />
        <Fab />
        <CreateRecruitmentDialog />
      </div>
    </RecruitModalProvider>
  );
}
