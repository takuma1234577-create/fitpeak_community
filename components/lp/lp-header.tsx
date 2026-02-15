"use client";

import { useState } from "react";
import Link from "next/link";
import { Dumbbell, Menu, X } from "lucide-react";

const navLinks = [
  { href: "#features", label: "機能" },
  { href: "#testimonials", label: "ユーザーの声" },
  { href: "#faq", label: "よくある質問" },
  { href: "/login", label: "ログイン" },
];

export default function LpHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5e5e5] bg-[#ffffff]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Dumbbell className="h-7 w-7 text-[#1f2937]" strokeWidth={2.5} />
          <span className="text-xl font-black tracking-widest text-[#1f2937]">
            FITPEAK
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-[#4b5563] transition-colors hover:text-[#1f2937]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-full bg-[#FF6B00] px-6 py-2.5 text-sm font-bold text-[#ffffff] transition-all hover:bg-[#FF8533] hover:shadow-lg"
          >
            無料で始める
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex items-center justify-center md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "メニューを閉じる" : "メニューを開く"}
        >
          {mobileOpen ? (
            <X className="h-6 w-6 text-[#1f2937]" />
          ) : (
            <Menu className="h-6 w-6 text-[#1f2937]" />
          )}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav
          className="flex flex-col gap-4 border-t border-[#e5e5e5] bg-[#ffffff] px-4 py-6 md:hidden"
          aria-label="Mobile navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-base font-semibold text-[#4b5563] transition-colors hover:text-[#1f2937]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="mt-2 rounded-full bg-[#FF6B00] px-6 py-3 text-center text-sm font-bold text-[#ffffff] transition-all hover:bg-[#FF8533]"
          >
            無料で始める
          </Link>
        </nav>
      )}
    </header>
  );
}
