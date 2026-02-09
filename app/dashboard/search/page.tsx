"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Loader2,
  User,
  MapPin,
  Dumbbell,
  Users,
  FolderOpen,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useBlockedUserIds } from "@/hooks/use-blocked-ids";
import { POPULAR_SEARCH_KEYWORDS } from "@/lib/search-constants";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type ProfileRow = {
  id: string;
  nickname: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  prefecture: string | null;
  home_gym: string | null;
  exercises: string[] | null;
};

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
};

type RecruitmentRow = {
  id: string;
  user_id?: string;
  title: string;
  description: string | null;
  target_body_part: string | null;
  event_date: string;
  location: string | null;
  status: string;
};

type SearchResults = {
  users: ProfileRow[];
  groups: GroupRow[];
  recruitments: RecruitmentRow[];
};

function stripHash(kw: string) {
  return kw.startsWith("#") ? kw.slice(1) : kw;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";
  const viewParam = searchParams.get("view") ?? ""; // "users" | ""
  const [query, setQuery] = useState(qParam);
  const [results, setResults] = useState<SearchResults>({
    users: [],
    groups: [],
    recruitments: [],
  });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { blockedIds } = useBlockedUserIds();

  const runSearch = useCallback(async (searchText: string) => {
    const term = searchText.trim();
    setQuery(term);
    setSearched(true);
    if (!term) {
      setResults({ users: [], groups: [], recruitments: [] });
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const sb = supabase as any;
      const pattern = `%${term}%`;

      const [profilesRes, groupsRes, recruitmentsRes] = await Promise.all([
        sb.rpc("search_profiles", { search_text: term }),
        sb
          .from("groups")
          .select("id, name, description, category")
          .or(`name.ilike.${pattern},category.ilike.${pattern},description.ilike.${pattern}`),
        sb
          .from("recruitments")
          .select("id, user_id, title, description, target_body_part, event_date, location, status")
          .eq("status", "open")
          .or(`title.ilike.${pattern},target_body_part.ilike.${pattern},location.ilike.${pattern},description.ilike.${pattern}`),
      ]);

      setResults({
        users: (profilesRes.data ?? []) as ProfileRow[],
        groups: (groupsRes.data ?? []) as GroupRow[],
        recruitments: (recruitmentsRes.data ?? []) as RecruitmentRow[],
      });

      if (profilesRes.error) console.error("search_profiles:", profilesRes.error);
      if (groupsRes.error) console.error("groups search:", groupsRes.error);
      if (recruitmentsRes.error) console.error("recruitments search:", recruitmentsRes.error);
    } catch (err) {
      console.error("Search error:", err);
      setResults({ users: [], groups: [], recruitments: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (qParam) runSearch(qParam);
  }, [qParam]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeywordClick = (kw: string) => {
    const term = stripHash(kw);
    runSearch(term);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const showKeywords = !searched || (!query.trim() && results.users.length === 0 && results.groups.length === 0 && results.recruitments.length === 0 && !loading);

  const filteredUsers = results.users.filter((u) => !blockedIds.has(u.id));
  const filteredRecruitments = results.recruitments.filter((r) => !r.user_id || !blockedIds.has(r.user_id));
  const totalCount = filteredUsers.length + results.groups.length + filteredRecruitments.length;
  const userPreviewCount = 5;
  const showUserMore = filteredUsers.length > userPreviewCount;
  const usersToShow = viewParam === "users" ? filteredUsers : filteredUsers.slice(0, userPreviewCount);

  const hasAnyResults = totalCount > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          検索
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ユーザー・グループ・合トレ募集をまとめて検索
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
        <div className="flex flex-col gap-8">
          {!hasAnyResults ? (
            <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
              <Search className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                「{query}」に一致する結果はありませんでした
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-muted-foreground">
                「{query}」で {totalCount} 件
              </p>

              {/* 1. ユーザー検索 (Users) */}
              <section className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-base font-black tracking-tight text-foreground">
                  <Users className="h-4 w-4 text-gold" />
                  Users / ユーザー
                </h2>
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">該当するユーザーはいません</p>
                ) : (
                  <>
                    <div
                      className={
                        viewParam === "users"
                          ? "flex flex-col gap-2"
                          : "flex gap-3 overflow-x-auto pb-2 scrollbar-thin md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3"
                      }
                    >
                      {usersToShow.map((profile) => {
                        const name = profile.nickname || profile.username || "ユーザー";
                        const initial = name.charAt(0);
                        return (
                          <Link
                            key={profile.id}
                            href={profile.id ? `/profile?u=${profile.id}` : "/profile"}
                            className="flex shrink-0 items-center gap-4 rounded-xl border border-border/40 bg-card px-4 py-3.5 transition-all hover:border-gold/30 hover:bg-card/80 md:shrink"
                          >
                            <Avatar className="h-12 w-12 shrink-0 ring-1 ring-border/60">
                              <AvatarImage src={profile.avatar_url ?? undefined} alt={name} />
                              <AvatarFallback className="bg-secondary text-sm font-bold">
                                {initial}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-foreground">{name}</p>
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
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                          </Link>
                        );
                      })}
                    </div>
                    {showUserMore && viewParam !== "users" && (
                      <Link
                        href={`/dashboard/search?q=${encodeURIComponent(query)}&view=users`}
                        className="self-start rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-bold text-gold transition-colors hover:bg-gold/20"
                      >
                        もっと見る（ユーザー {filteredUsers.length} 件）
                      </Link>
                    )}
                  </>
                )}
              </section>

              {/* 2. グループ検索 (Groups) */}
              <section className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-base font-black tracking-tight text-foreground">
                  <FolderOpen className="h-4 w-4 text-gold" />
                  Groups / グループ
                </h2>
                {results.groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">該当するグループはありません</p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {results.groups.map((group) => (
                      <li key={group.id}>
                        <Link
                          href={`/dashboard/groups/${group.id}`}
                          className="flex flex-col gap-1.5 rounded-xl border border-border/40 bg-card px-4 py-3.5 transition-all hover:border-gold/30 hover:bg-card/80"
                        >
                          <p className="font-bold text-foreground">{group.name}</p>
                          {group.category && (
                            <span className="text-xs text-gold">{group.category}</span>
                          )}
                          {group.description && (
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {group.description}
                            </p>
                          )}
                          <span className="mt-1 flex items-center text-xs text-muted-foreground/80">
                            詳細 <ChevronRight className="h-3 w-3" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* 3. 合トレ検索 (Recruitments) */}
              <section className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-base font-black tracking-tight text-foreground">
                  <CalendarDays className="h-4 w-4 text-gold" />
                  Recruitments / 合トレ募集
                </h2>
                {filteredRecruitments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">該当する募集はありません</p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {filteredRecruitments.map((rec) => {
                      const eventDate = rec.event_date
                        ? new Date(rec.event_date).toLocaleDateString("ja-JP", {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "";
                      return (
                        <li key={rec.id}>
                          <Link
                            href={`/dashboard/recruit?r=${rec.id}`}
                            className="flex flex-col gap-1.5 rounded-xl border border-border/40 bg-card px-4 py-3.5 transition-all hover:border-gold/30 hover:bg-card/80"
                          >
                            <p className="font-bold text-foreground">{rec.title}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              {rec.target_body_part && (
                                <span className="text-gold">{rec.target_body_part}</span>
                              )}
                              {rec.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {rec.location}
                                </span>
                              )}
                              {eventDate && (
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  {eventDate}
                                </span>
                              )}
                            </div>
                            {rec.description && (
                              <p className="line-clamp-2 text-xs text-muted-foreground">
                                {rec.description}
                              </p>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
