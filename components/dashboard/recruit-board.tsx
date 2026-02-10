"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { safeList } from "@/lib/utils";
import RecruitFilterBar, {
  DEFAULT_FILTERS,
  type RecruitFilters,
} from "@/components/dashboard/recruit-filter-bar";

type RecruitmentRow = {
  id: string;
  title: string;
  description: string | null;
  target_body_part: string | null;
  event_date: string;
  location: string | null;
  status: string;
  user_id: string;
  profiles: { nickname: string | null; username: string | null; avatar_url: string | null } | null;
};

export default function RecruitBoard() {
  const [filters, setFilters] = useState<RecruitFilters>(DEFAULT_FILTERS);
  const [list, setList] = useState<RecruitmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      let q = (supabase as any)
        .from("recruitments")
        .select("id, title, description, target_body_part, event_date, location, status, user_id, profiles(nickname, username, avatar_url)")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (filters.area !== "all") {
        q = q.ilike("location", `%${filters.area}%`);
      }
      if (filters.bodyPart !== "all") {
        q = q.eq("target_body_part", filters.bodyPart);
      }
      if (filters.level !== "all") {
        q = q.eq("level", filters.level);
      }

      const { data, error } = await q;
      if (error) {
        console.error("[合トレ] 一覧取得失敗:", error);
        setList([]);
        return;
      }
      setList(safeList(data as RecruitmentRow[] | null));
    } catch (e) {
      console.error("[合トレ] 取得例外:", e);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [filters.area, filters.bodyPart, filters.level]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          合トレ募集
        </h1>
        <Link
          href="/dashboard/recruit/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3.5 text-sm font-black uppercase tracking-wider text-[#050505] shadow-lg shadow-gold/25 transition-all hover:bg-gold-light hover:shadow-xl active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          合トレを募集する
        </Link>
      </div>

      <RecruitFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        onApply={fetchList}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-muted-foreground">
            条件に合う募集はありません
          </p>
          <Link
            href="/dashboard/recruit/new"
            className="mt-3 inline-block text-sm font-bold text-gold hover:underline"
          >
            最初の募集を作成する
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map((r) => {
            const name = r.profiles?.nickname || r.profiles?.username || "ユーザー";
            const date = r.event_date
              ? new Date(r.event_date).toLocaleDateString("ja-JP", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—";
            return (
              <li key={r.id}>
                <Link
                  href={`/dashboard/recruit?r=${r.id}`}
                  className="block rounded-xl border border-border/40 bg-card p-4 transition-all hover:border-gold/30 hover:bg-card/80"
                >
                  <p className="font-bold text-foreground">{r.title}</p>
                  {r.target_body_part && (
                    <span className="mt-1 inline-block text-xs text-gold">
                      {r.target_body_part}
                    </span>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {date} {r.location && `・${r.location}`}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/80">{name}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
