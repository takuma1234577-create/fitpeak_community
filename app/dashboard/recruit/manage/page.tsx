"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, CalendarDays, MapPin, Users, ChevronDown, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { safeList } from "@/lib/utils";

type RecruitmentManageRow = {
  id: string;
  title: string;
  description: string | null;
  target_body_part: string | null;
  event_date: string;
  location: string | null;
  status: string;
  created_at: string;
};

type ParticipantRow = {
  recruitment_id: string;
  user_id: string;
  status: string;
  created_at: string;
  profiles: { nickname: string | null; username: string | null } | null;
};

const statusLabel: Record<string, string> = {
  open: "募集中",
  closed: "終了",
};
const participantStatusLabel: Record<string, string> = {
  pending: "申請中",
  approved: "承認済み",
  rejected: "却下",
};

export default function RecruitManagePage() {
  const [list, setList] = useState<RecruitmentManageRow[]>([]);
  const [participantsByRecruitment, setParticipantsByRecruitment] = useState<Record<string, ParticipantRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchMyRecruitments = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return [];
    }
    const { data, error } = await (supabase as any)
      .from("recruitments")
      .select("id, title, description, target_body_part, event_date, location, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[合トレ管理] 一覧取得失敗:", error);
      return [];
    }
    return safeList(data as RecruitmentManageRow[] | null);
  }, []);

  const fetchParticipants = useCallback(async (recruitmentIds: string[]) => {
    if (recruitmentIds.length === 0) return {};
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("recruitment_participants")
      .select("recruitment_id, user_id, status, created_at, profiles(nickname, username)")
      .in("recruitment_id", recruitmentIds)
      .order("created_at", { ascending: false });
    if (error) return {};
    const rows = safeList(data as ParticipantRow[] | null);
    const byRec: Record<string, ParticipantRow[]> = {};
    recruitmentIds.forEach((id) => (byRec[id] = []));
    rows.forEach((r) => {
      if (!byRec[r.recruitment_id]) byRec[r.recruitment_id] = [];
      byRec[r.recruitment_id].push(r);
    });
    return byRec;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const recruitments = await fetchMyRecruitments();
      if (cancelled) return;
      setList(recruitments);
      const ids = recruitments.map((r) => r.id);
      const participants = await fetchParticipants(ids);
      if (cancelled) return;
      setParticipantsByRecruitment(participants);
    })().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchMyRecruitments, fetchParticipants]);

  const formatDate = (d: string) =>
    d
      ? new Date(d).toLocaleDateString("ja-JP", {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/dashboard/recruit"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        ← 募集一覧へ
      </Link>
      <h1 className="text-2xl font-black tracking-tight text-foreground">
        自分の合トレ管理
      </h1>
      <p className="text-sm text-muted-foreground">
        作成した募集と参加申請を確認できます。
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-muted-foreground">
            まだ募集を作成していません
          </p>
          <Link
            href="/dashboard/recruit/new"
            className="mt-3 inline-block text-sm font-bold text-gold hover:underline"
          >
            合トレを募集する
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => {
            const participants = participantsByRecruitment[r.id] ?? [];
            const pendingCount = participants.filter((p) => p.status === "pending").length;
            const isExpanded = expandedId === r.id;

            return (
              <li
                key={r.id}
                className="rounded-xl border border-border/40 bg-card overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-foreground">{r.title}</h2>
                      {r.target_body_part && (
                        <span className="mt-1 inline-block text-xs text-gold">
                          {r.target_body_part}
                        </span>
                      )}
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {formatDate(r.event_date)}
                        {r.location && (
                          <>
                            <span className="text-border">・</span>
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {r.location}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          r.status === "open"
                            ? "bg-gold/15 text-gold"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {statusLabel[r.status] ?? r.status}
                      </span>
                      {participants.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {participants.length}件
                          {pendingCount > 0 && (
                            <span className="text-gold">（{pendingCount}件申請中）</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="mt-3 flex items-center gap-1 text-sm font-semibold text-gold hover:underline"
                  >
                    {participants.length > 0 ? (
                      <>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        参加申請 {participants.length}件
                      </>
                    ) : (
                      <span className="text-muted-foreground">参加申請はまだありません</span>
                    )}
                  </button>
                </div>
                {isExpanded && participants.length > 0 && (
                  <div className="border-t border-border/40 bg-secondary/20 px-4 py-3">
                    <ul className="space-y-2">
                      {participants.map((p) => (
                        <li
                          key={`${p.recruitment_id}-${p.user_id}`}
                          className="flex items-center justify-between rounded-lg border border-border/40 bg-card/50 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-foreground">
                            {p.profiles?.nickname || p.profiles?.username || "ユーザー"}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              p.status === "pending"
                                ? "bg-gold/15 text-gold"
                                : p.status === "approved"
                                  ? "bg-green-500/15 text-green-600 dark:text-green-400"
                                  : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {participantStatusLabel[p.status] ?? p.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
