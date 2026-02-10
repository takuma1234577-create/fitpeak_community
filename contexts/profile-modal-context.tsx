"use client";

import { createContext, useCallback, useContext, useState } from "react";
import ProfileModal from "@/components/profile/profile-modal";

type ProfileModalContextValue = {
  openProfileModal: (userId: string) => void;
};

const ProfileModalContext = createContext<ProfileModalContextValue | null>(null);

export function ProfileModalProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const openProfileModal = useCallback((id: string) => {
    setUserId(id);
    setOpen(true);
  }, []);

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setUserId(null);
  }, []);

  return (
    <ProfileModalContext.Provider value={{ openProfileModal }}>
      {children}
      <ProfileModal
        userId={userId}
        open={open}
        onOpenChange={onOpenChange}
      />
    </ProfileModalContext.Provider>
  );
}

export function useProfileModal(): ProfileModalContextValue {
  const ctx = useContext(ProfileModalContext);
  if (!ctx) {
    return {
      openProfileModal: () => {},
    };
  }
  return ctx;
}
