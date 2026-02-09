"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Users,
  MessageCircle,
  UserCircle,
  Settings,
  Dumbbell,
  Shield,
} from "lucide-react";
import { cn, safeArray } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "ホーム", icon: Home },
  { href: "/dashboard/search", label: "検索", icon: Search },
  { href: "/dashboard/recruit", label: "合トレ募集", icon: Users },
  { href: "/dashboard/groups", label: "グループ", icon: Shield },
  { href: "/dashboard/messages", label: "メッセージ", icon: MessageCircle },
  { href: "/profile", label: "マイページ", icon: UserCircle },
  { href: "/dashboard/settings", label: "設定", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-border/60 bg-background lg:flex lg:w-60 lg:shrink-0 lg:flex-col">
      <nav className="flex flex-1 flex-col gap-1 p-4 pt-6">
        {safeArray(navItems).map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-gold/10 text-gold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("h-5 w-5 shrink-0", isActive && "text-gold")}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/40 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10">
            <Dumbbell className="h-4 w-4 text-gold" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">PRO MEMBER</span>
            <span className="text-[10px] text-muted-foreground">
              2026/12まで有効
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
