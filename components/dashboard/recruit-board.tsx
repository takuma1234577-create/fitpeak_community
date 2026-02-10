"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Loader2, CalendarDays, MapPin, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { safeList } from "@/lib/utils";
import RecruitFilterBar, {
  DEFAULT_FILTERS,
  type RecruitFilters,
} from "@/components/dashboard/recruit-filter-bar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RecruitmentRow = {
  id: string;
  title: string;
  description: string | null;
  target_body_part: string | null;
  event_date: string;
  location: string | null;
  status: string;
  user_id: string;
  level?: string | null;
  profiles: { nickname: string | null; username: string | null; avatar_url: string | null } | null;
};

type RecruitmentDetail = RecruitmentRow;

export default function RecruitBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailId = searchParams.get("r");

  const [filters, setFilters] = useState<RecruitFilters>(DEFAULT_FILTERS);
  const [list, setList] = useState<RecruitmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<RecruitmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [participantStatus, setParticipantStatus] = useState<"none" | "pending" | "approved" | "rejected" | null>(null);
  const [applying, setApplying] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [applyFormOpen, setApplyFormOpen] = useState(false);
  const [applyReason, setApplyReason] = useState("");
  const [applySelfIntro, setApplySelfIntro] = useState("");
  const modalOpen = !!detailId;

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
      // level フィルターは recruitments.level カラムがある DB のみ（supabase-recruitments-area-level.sql 適用後）
      // カラムがないと 400 になるため、ここでは使わない

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

  // カードクリック時は一覧の行を即表示し、別途1件取得で最新を反映
  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      setParticipantStatus(null);
      setCurrentUserId(null);
      return;
    }
    const fromList = list.find((r) => r.id === detailId);
    if (fromList) {
      setDetail(fromList as RecruitmentDetail);
    } else {
      setDetail(null);
    }
    setDetailLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: recData, error: recError } = await (supabase as any)
          .from("recruitments")
          .select("id, title, description, target_body_part, event_date, location, status, user_id")
          .eq("id", detailId)
          .maybeSingle();
        if (cancelled) return;
        if (recError || !recData) {
          if (!fromList) setDetail(null);
          return;
        }
        const userId = recData.user_id;
        const { data: profileData } = await (supabase as any)
          .from("profiles")
          .select("nickname, username, avatar_url")
          .eq("id", userId)
          .maybeSingle();
        if (cancelled) return;
        setDetail({
          ...recData,
          profiles: profileData ?? null,
        } as RecruitmentDetail);
      } catch {
        if (!cancelled && !fromList) setDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [detailId, list]);

  // モーダル用: 現在ユーザーと参加申請状態を取得
  useEffect(() => {
    if (!detailId || !detail) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      setCurrentUserId(user?.id ?? null);
      if (!user?.id) {
        setParticipantStatus("none");
        return;
      }
      const { data } = await (supabase as any)
        .from("recruitment_participants")
        .select("status")
        .eq("recruitment_id", detailId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setParticipantStatus((data?.status as "pending" | "approved" | "rejected") ?? "none");
    })();
    return () => { cancelled = true; };
  }, [detailId, detail]);

  const openApplyForm = useCallback(() => {
    setApplyReason("");
    setApplySelfIntro("");
    setApplyFormOpen(true);
  }, []);

  const handleSubmitApplyForm = useCallback(async () => {
    if (!detailId || !detail || applying) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (detail.user_id === user.id) return;
    setApplying(true);
    try {
      const row: Record<string, unknown> = {
        recruitment_id: detailId,
        user_id: user.id,
        status: "pending",
        reason: applyReason.trim() || null,
        self_intro: applySelfIntro.trim() || null,
      };
      const { error } = await (supabase as any)
        .from("recruitment_participants")
        .insert(row);
      if (error) {
        if (error.code === "23505") setParticipantStatus("pending");
        else if (error.message?.includes("reason") || error.message?.includes("self_intro")) {
          const fallback = await (supabase as any)
            .from("recruitment_participants")
            .insert({ recruitment_id: detailId, user_id: user.id, status: "pending" });
          if (!fallback.error) setParticipantStatus("pending");
        }
        setApplyFormOpen(false);
        return;
      }
      setParticipantStatus("pending");
      setApplyFormOpen(false);

      const { data: myProfile } = await (supabase as any)
        .from("profiles")
        .select("nickname, username")
        .eq("id", user.id)
        .maybeSingle();
      const applicantDisplay =
        (myProfile?.nickname || myProfile?.username) ?? "誰か";

      await (supabase as any).from("notifications").insert({
        user_id: detail.user_id,
        sender_id: user.id,
        type: "apply",
        content: `${applicantDisplay}が「${detail.title}」に参加申請しました`,
        link: `/dashboard/recruit/manage?r=${detailId}&u=${user.id}`,
      });

      try {
        await fetch("/api/notify-recruitment-apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recruitment_id: detailId,
            recruitment_title: detail.title,
            creator_id: detail.user_id,
            applicant_nickname: applicantDisplay,
          }),
        });
      } catch {
        // メール送信は省略可
      }
    } finally {
      setApplying(false);
    }
  }, [detailId, detail, applying, applyReason, applySelfIntro]);

  const handleApply = useCallback(() => {
    if (!detailId || !detail || applying || !currentUserId) return;
    if (detail.user_id === currentUserId) return;
    openApplyForm();
  }, [detailId, detail, applying, currentUserId, openApplyForm]);

  const closeDetail = useCallback(() => {
    router.push("/dashboard/recruit", { scroll: false });
  }, [router]);

  const formatDetailDate = (d: string) =>
    d
      ? new Date(d).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const levelLabel: Record<string, string> = {
    beginner: "初心者",
    intermediate: "中級者",
    advanced: "上級者",
    competitor: "大会勢",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          合トレ募集
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/recruit/manage"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
          >
            合トレを管理する
          </Link>
          <Link
            href="/dashboard/recruit/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3.5 text-sm font-black uppercase tracking-wider text-[#050505] shadow-lg shadow-gold/25 transition-all hover:bg-gold-light hover:shadow-xl active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
            合トレを募集する
          </Link>
        </div>
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

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="max-w-md border-border/60 bg-card sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="sr-only">募集詳細</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <h2 className="text-lg font-black tracking-tight text-foreground">
                {detail.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                {detail.target_body_part && (
                  <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
                    {detail.target_body_part}
                  </span>
                )}
                {detail.level && levelLabel[detail.level] && (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {levelLabel[detail.level]}
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-gold/70" />
                  {formatDetailDate(detail.event_date)}
                </p>
                {detail.location && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-gold/70" />
                    {detail.location}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <User className="h-4 w-4 shrink-0 text-gold/70" />
                  {detail.profiles?.nickname || detail.profiles?.username || "ユーザー"}
                </p>
              </div>
              {detail.description && (
                <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {detail.description}
                  </p>
                </div>
              )}
              <div className="pt-2">
                {currentUserId && detail.user_id === currentUserId ? (
                  <p className="text-center text-sm text-muted-foreground">自分の募集です</p>
                ) : participantStatus === "pending" ? (
                  <p className="text-center text-sm font-semibold text-gold">申請中です</p>
                ) : participantStatus === "approved" ? (
                  <p className="text-center text-sm font-semibold text-green-500">参加が承認されました</p>
                ) : participantStatus === "rejected" ? (
                  <p className="text-center text-sm text-muted-foreground">申請は却下されました</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={applying || !currentUserId}
                    className="w-full rounded-lg bg-gold py-3.5 text-sm font-black uppercase tracking-wider text-[#050505] shadow-lg shadow-gold/25 transition-all hover:bg-gold-light disabled:opacity-60"
                  >
                    参加申請する
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              募集が見つかりませんでした
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* 参加申請フォーム（参加理由・自己紹介） */}
      <Dialog open={applyFormOpen} onOpenChange={setApplyFormOpen}>
        <DialogContent className="max-w-md border-border/60 bg-card sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              参加申請
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            募集者に伝わるよう、参加理由と自己紹介を記入してください。
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="apply-reason" className="mb-1.5 block text-sm font-bold text-foreground">
                参加理由（任意）
              </label>
              <textarea
                id="apply-reason"
                value={applyReason}
                onChange={(e) => setApplyReason(e.target.value)}
                placeholder="例: 同じ部位を鍛えたい方と一緒にトレーニングしたいです"
                rows={2}
                className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
                maxLength={300}
              />
            </div>
            <div>
              <label htmlFor="apply-selfintro" className="mb-1.5 block text-sm font-bold text-foreground">
                簡単な自己紹介（任意）
              </label>
              <textarea
                id="apply-selfintro"
                value={applySelfIntro}
                onChange={(e) => setApplySelfIntro(e.target.value)}
                placeholder="例: 筋トレ2年目。ベンチ80kg、スクワット100kgです。"
                rows={3}
                className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
                maxLength={500}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSubmitApplyForm}
              disabled={applying}
              className="flex-1 rounded-lg bg-gold py-3 text-sm font-black uppercase tracking-wider text-[#050505] shadow-lg shadow-gold/25 hover:bg-gold-light disabled:opacity-60"
            >
              {applying ? "送信中…" : "送信する"}
            </button>
            <button
              type="button"
              onClick={() => setApplyFormOpen(false)}
              className="rounded-lg border border-border px-4 py-3 text-sm font-bold text-foreground hover:bg-secondary"
            >
              キャンセル
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
