"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export default function Fab() {
  return (
    <Link
      href="/dashboard/recruit/new"
      className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-[#050505] shadow-lg shadow-gold/30 transition-all duration-300 hover:scale-105 hover:bg-gold-light hover:shadow-xl hover:shadow-gold/40 active:scale-95 lg:bottom-8 lg:right-8"
      aria-label="合トレ募集"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </Link>
  );
}
