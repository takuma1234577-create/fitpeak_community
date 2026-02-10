"use client";

import { ProfileModalProvider } from "@/contexts/profile-modal-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ProfileModalProvider>{children}</ProfileModalProvider>;
}
