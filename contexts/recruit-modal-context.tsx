"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type RecruitModalContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openModal: () => void;
};

const RecruitModalContext = createContext<RecruitModalContextValue | null>(null);

export function RecruitModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openModal = useCallback(() => setOpen(true), []);
  return (
    <RecruitModalContext.Provider value={{ open, setOpen, openModal }}>
      {children}
    </RecruitModalContext.Provider>
  );
}

export function useRecruitModal() {
  const ctx = useContext(RecruitModalContext);
  if (!ctx) throw new Error("useRecruitModal must be used within RecruitModalProvider");
  return ctx;
}
