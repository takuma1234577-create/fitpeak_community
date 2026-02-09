"use client";

import { Plus } from "lucide-react";
import { useRecruitModal } from "@/contexts/recruit-modal-context";

export default function Fab() {
  const { openModal } = useRecruitModal();

  return (
    <button
      type="button"
      onClick={openModal}
      className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-[#050505] shadow-lg shadow-gold/30 transition-all duration-300 hover:scale-105 hover:bg-gold-light hover:shadow-xl hover:shadow-gold/40 active:scale-95 lg:bottom-8 lg:right-8"
      aria-label="新規募集を作成"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
}
