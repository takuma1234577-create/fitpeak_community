"use client";

import { createContext, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";

type ProfileModalContextValue = {
  /** 他ユーザーのプロフィールを開く（ページ遷移で /profile?u=userId） */
  openProfileModal: (userId: string) => void;
};

const ProfileModalContext = createContext<ProfileModalContextValue | null>(null);

export function ProfileModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const openProfileModal = useCallback(
    (id: string) => {
      router.push(`/profile?u=${encodeURIComponent(id)}`);
    },
    [router]
  );

  return (
    <ProfileModalContext.Provider value={{ openProfileModal }}>
      {children}
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
