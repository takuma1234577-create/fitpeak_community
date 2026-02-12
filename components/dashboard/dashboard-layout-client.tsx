"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { syncEmailConfirmed } from "@/lib/sync-email-confirmed";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import BottomNav from "@/components/dashboard/bottom-nav";
import Fab from "@/components/dashboard/fab";

/** 個別チャット画面のパスか（/messages/ から始まりIDが含まれる、または /dashboard/messages/[id]） */
export function isIndividualChatPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/messages/") && pathname.length > "/messages/".length) return true;
  const match = pathname.match(/^\/dashboard\/messages\/[^/]+$/);
  return !!match;
}

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChat = isIndividualChatPath(pathname);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (syncedRef.current) return;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      syncedRef.current = true;
      await syncEmailConfirmed(supabase, user);
    })();
  }, []);

  if (isChat) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
      <Fab />
    </div>
  );
}
