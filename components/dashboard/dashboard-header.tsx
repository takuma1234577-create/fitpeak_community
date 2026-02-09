"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, Search, Bell, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { POPULAR_SEARCH_KEYWORDS } from "@/lib/search-constants";
import { createClient } from "@/utils/supabase/client";
import { safeArray } from "@/lib/utils";

function stripHash(kw: string) {
  return kw.startsWith("#") ? kw.slice(1) : kw;
}

export default function DashboardHeader() {
  const router = useRouter();
  const { profile } = useProfile();
  const [searchOpen, setSearchOpen] = useState(false);
  const avatarSrc = profile?.avatar_url
    ? `${profile.avatar_url}${profile.avatar_url.includes("?") ? "&" : "?"}v=${(profile as { updated_at?: string }).updated_at || Date.now()}`
    : null;
  const displayName = profile?.nickname || profile?.name || "U";
  const initial = displayName.charAt(0).toUpperCase();
  const [searchQuery, setSearchQuery] = useState("");
  const [showKeywords, setShowKeywords] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const desktopRef = useRef<HTMLFormElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count, error } = await (supabase as any)
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) {
        setUnreadCount(0);
        return;
      }
      setUnreadCount(typeof count === "number" ? count : 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  useEffect(() => {
    const onFocus = () => fetchUnread();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchUnread]);

  const goSearch = (q: string) => {
    const term = q.trim();
    if (term) router.push(`/dashboard/search?q=${encodeURIComponent(term)}`);
    setSearchOpen(false);
    setShowKeywords(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goSearch(searchQuery);
  };

  const handleKeywordClick = (kw: string) => {
    goSearch(stripHash(kw));
  };

  useEffect(() => {
    if (!searchOpen) setShowKeywords(false);
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <Dumbbell className="h-6 w-6 text-gold" strokeWidth={2.5} />
          <span className="text-xl font-black tracking-[0.15em] text-gold">
            FITPEAK
          </span>
        </Link>

        <div className="mx-8 hidden max-w-md flex-1 md:block">
          <form ref={desktopRef} onSubmit={handleSubmit} className="relative w-full">
            <div className="group relative w-full">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-gold" />
              <input
                type="text"
                placeholder="ニックネーム・ジム・種目で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowKeywords(true)}
                onBlur={() => setTimeout(() => setShowKeywords(false), 150)}
                className="h-10 w-full rounded-lg border border-border bg-secondary/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:border-gold/50 focus:bg-secondary focus:outline-none focus:ring-1 focus:ring-gold/20"
              />
            </div>
            {showKeywords && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border/60 bg-card p-3 shadow-xl">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  人気のキーワード
                </p>
                <div className="flex flex-wrap gap-2">
                  {safeArray(POPULAR_SEARCH_KEYWORDS).map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleKeywordClick(kw); }}
                      className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition-all hover:bg-gold/20"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
            aria-label="検索"
          >
            {searchOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </button>

          <Link
            href="/dashboard/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="通知"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <Link href="/profile" className="ml-1">
            <Avatar className="h-9 w-9 ring-2 ring-border transition-all hover:ring-gold/50">
              <AvatarImage src={avatarSrc ?? undefined} alt="プロフィール" />
              <AvatarFallback className="bg-secondary text-xs font-bold text-foreground">
                {initial}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div ref={mobileRef} className="animate-in slide-in-from-top-2 border-t border-border/40 bg-background/95 p-3 duration-200 md:hidden">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-gold" />
              <input
                type="text"
                placeholder="ニックネーム・ジム・種目で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="h-10 w-full rounded-lg border border-border bg-secondary/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
              />
            </div>
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                人気のキーワード
              </p>
              <div className="flex flex-wrap gap-2">
                {safeArray(POPULAR_SEARCH_KEYWORDS).map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => handleKeywordClick(kw)}
                    className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition-all hover:bg-gold/20"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
