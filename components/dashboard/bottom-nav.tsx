"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Shield, MessageCircle, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "ホーム", icon: Home },
  { href: "/dashboard/recruit", label: "合トレ", icon: Users },
  { href: "/dashboard/groups", label: "グループ", icon: Shield },
  { href: "/dashboard/messages", label: "メッセージ", icon: MessageCircle },
  { href: "/profile", label: "マイページ", icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-stretch">
        {(Array.isArray(navItems) ? navItems : []).map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors",
                isActive ? "text-gold" : "text-muted-foreground active:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gold" />
              )}
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.label === "メッセージ" && (
                  <span className="absolute -right-2.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-[#050505]">
                    3
                  </span>
                )}
              </div>
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
