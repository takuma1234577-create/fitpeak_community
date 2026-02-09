"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Loader2, User, MapPin, Dumbbell } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { POPULAR_SEARCH_KEYWORDS } from "@/lib/search-constants";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { ProfilesRow } from "@/types/supabase";

function stripHash(kw: string) {
  return kw.startsWith("#") ? kw.slice(1) : kw;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(qParam);
  const [results, setResults] = useState<ProfilesRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (searchText: string) => {
    const term = searchText.trim();
    setQuery(term);
    setSearched(true);
    if (!term) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("search_profiles", {
        search_text: term,
      });
      if (error) {
        console.error("search_profiles:", error);
        setResults([]);
        return;
      }
      setResults((data as ProfilesRow[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (qParam) runSearch(qParam);
  }, [qParam]); // eslint-disable-line react-hooks/exhaustive-deps -- run once when q param is set

  const handleKeywordClick = (kw: string) => {
    const term = stripHash(kw);
    runSearch(term);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const showKeywords = !searched || (!query.trim() && results.length === 0 && !loading);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          検索
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ニックネーム・自己紹介・住まい・ジム・種目で検索
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="キーワードを入力..."
            className="h-12 w-full rounded-xl border border-border bg-secondary/60 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>

        {showKeywords && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              人気のキーワード
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCH_KEYWORDS.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => handleKeywordClick(kw)}
                  className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition-all hover:bg-gold/20 hover:border-gold/50"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
        </div>
      )}

      {!loading && searched && query.trim() && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-muted-foreground">
            「{query}」で {results.length} 件
          </p>
          {results.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
              <Search className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                該当するユーザーはいません
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {results.map((profile) => {
                const name = profile.nickname || profile.username || "ユーザー";
                const initial = name.charAt(0);
                return (
                  <li key={profile.id}>
                    <Link
                      href={profile.id ? `/profile?u=${profile.id}` : "/profile"}
                      className="flex items-center gap-4 rounded-xl border border-border/40 bg-card px-4 py-3.5 transition-all hover:border-gold/30 hover:bg-card/80"
                    >
                      <Avatar className="h-12 w-12 shrink-0 ring-1 ring-border/60">
                        <AvatarImage src={profile.avatar_url ?? undefined} alt={name} />
                        <AvatarFallback className="bg-secondary text-sm font-bold">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">
                          {name}
                        </p>
                        {profile.bio && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {profile.bio}
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/80">
                          {profile.prefecture && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gold/70" />
                              {profile.prefecture}
                            </span>
                          )}
                          {profile.home_gym && (
                            <span className="flex items-center gap-1">
                              <Dumbbell className="h-3 w-3 text-gold/70" />
                              {profile.home_gym}
                            </span>
                          )}
                          {profile.exercises && profile.exercises.length > 0 && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 text-gold/70" />
                              {profile.exercises.slice(0, 2).join("・")}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-muted-foreground/40">→</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
