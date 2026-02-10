"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Loader2,
  CalendarDays,
  MapPin,
  Users,
  Settings,
  Pencil,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  User,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { safeList } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type RecruitmentRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_body_part: string | null;
  event_date: string;
  location: string | null;
  status: string;
  created_at: string;
  max_participants?: number | null;
};

type ParticipantRow = {
  recruitment_id: string;
  user_id: string;
  status: string;
  created_at: string;
  reason?: string | null;
  self_intro?: string | null;
  profiles: { nickname: string | null; username: string | null; avatar_url: string | null } | null;
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

function participantKey(recId: string, userId: string) {
  return `${recId}-${userId}`;
}

export default function RecruitManagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [createdList, setCreatedList] = useState<RecruitmentRow[]>([]);
  const [appliedList, setAppliedList] = useState<{ recruitment: RecruitmentRow; myStatus: string }[]>([]);
  const [participantsByRecruitment, setParticipantsByRecruitment] = useState<Record<string, ParticipantRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailModalId, setDetailModalId] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [expandedParticipantKey, setExpandedParticipantKey] = useState<string | null>(null);
  const notificationDeepLinkApplied = useRef(false);

  const fetchCreated = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("recruitments")
      .select("id, user_id, title, description, target_body_part, event_date, location, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[合トレ管理] 作成一覧取得失敗:", error);
      return [];
    }
    return safeList(data as RecruitmentRow[] | null);
  }, []);

  const fetchApplied = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data: partData, error: partError } = await (supabase as any)
      .from("recruitment_participants")
      .select("recruitment_id, status")
      .eq("user_id", userId);
    if (partError || !partData?.length) return [];
    const recIds = [...new Set((partData as { recruitment_id: string }[]).map((p) => p.recruitment_id))];
    const { data: recData, error: recError } = await (supabase as any)
      .from("recruitments")
      .select("id, user_id, title, description, target_body_part, event_date, location, status, created_at")
      .in("id", recIds);
    if (recError || !recData?.length) return [];
    const recMap = new Map((recData as RecruitmentRow[]).map((r) => [r.id, r]));
    const statusMap = new Map((partData as { recruitment_id: string; status: string }[]).map((p) => [p.recruitment_id, p.status]));
    return recIds
      .map((id) => {
        const recruitment = recMap.get(id);
        if (!recruitment) return null;
        return { recruitment, myStatus: statusMap.get(id) ?? "pending" };
      })
      .filter((x): x is { recruitment: RecruitmentRow; myStatus: string } => x != null);
  }, []);

  const fetchParticipants = useCallback(async (recruitmentIds: string[]) => {
    if (recruitmentIds.length === 0) return {};
    const supabase = createClient();
    let { data, error } = await (supabase as any)
      .from("recruitment_participants")
      .select("recruitment_id, user_id, status, created_at, reason, self_intro, profiles(nickname, username, avatar_url)")
      .in("recruitment_id", recruitmentIds)
      .order("created_at", { ascending: false });
    if (error) {
      const fallback = await (supabase as any)
        .from("recruitment_participants")
        .select("recruitment_id, user_id, status, created_at, profiles(nickname, username, avatar_url)")
        .in("recruitment_id", recruitmentIds)
        .order("created_at", { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }
    if (error) return {};
    const rows = safeList((data as ParticipantRow[] | null) ?? []);
    const byRec: Record<string, ParticipantRow[]> = {};
    recruitmentIds.forEach((id) => (byRec[id] = []));
    rows.forEach((r) => {
      if (!byRec[r.recruitment_id]) byRec[r.recruitment_id] = [];
      byRec[r.recruitment_id].push(r);
    });
    return byRec;
  }, []);

  const loadAll = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setCreatedList([]);
      setAppliedList([]);
      return;
    }
    setCurrentUserId(user.id);
    setLoading(true);
    const [created, applied] = await Promise.all([
      fetchCreated(user.id),
      fetchApplied(user.id),
    ]);
    setCreatedList(created);
    setAppliedList(applied);
    const allIds = [...created.map((r) => r.id), ...applied.map((a) => a.recruitment.id)];
    const uniqIds = [...new Set(allIds)];
    const participants = await fetchParticipants(uniqIds);
    setParticipantsByRecruitment(participants);
    setLoading(false);
  }, [fetchCreated, fetchApplied, fetchParticipants]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // 通知クリックで ?r=募集ID&u=申請者ID で遷移した場合、該当募集のモーダルを開き申請者の参加理由・自己紹介を表示
  useEffect(() => {
    if (loading || notificationDeepLinkApplied.current) return;
    const r = searchParams.get("r");
    const u = searchParams.get("u");
    if (!r || !u) return;
    notificationDeepLinkApplied.current = true;
    setDetailModalId(r);
    setExpandedParticipantKey(participantKey(r, u));
    router.replace("/dashboard/recruit/manage", { scroll: false });
  }, [loading, searchParams, router]);

  const handleCloseRecruitment = useCallback(
    async (id: string) => {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from("recruitments")
        .update({ status: "closed" })
        .eq("id", id);
      if (!error) loadAll();
    },
    [loadAll]
  );

  const handleApprove = useCallback(
    async (recruitmentId: string, userId: string) => {
      setApproving(`${recruitmentId}-${userId}`);
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from("recruitment_participants")
        .update({ status: "approved" })
        .eq("recruitment_id", recruitmentId)
        .eq("user_id", userId);
      if (error) {
        setApproving(null);
        return;
      }
      const { data: rec } = await (supabase as any)
        .from("recruitments")
        .select("group_id, chat_room_id, user_id, title")
        .eq("id", recruitmentId)
        .single();
      if (rec?.group_id) {
        await (supabase as any).from("group_members").insert({ group_id: rec.group_id, user_id: userId });
      }
      if (rec?.chat_room_id) {
        await (supabase as any)
          .from("conversation_participants")
          .insert({ conversation_id: rec.chat_room_id, user_id: userId });
        const content = JSON.stringify({
          recruitmentId,
          title: rec.title ?? "",
          text: "合トレを承認しました。",
        });
        await (supabase as any)
          .from("messages")
          .insert({
            conversation_id: rec.chat_room_id,
            sender_id: rec.user_id,
            content,
            message_type: "recruitment_approved",
          });
      }
      setApproving(null);
      loadAll();
    },
    [loadAll]
  );

  const formatDate = (d: string) =>
    d
      ? new Date(d).toLocaleDateString("ja-JP", {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

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

  const selectedRecruitment = detailModalId
    ? createdList.find((r) => r.id === detailModalId)
    : null;
  const selectedParticipants = selectedRecruitment
    ? participantsByRecruitment[selectedRecruitment.id] ?? []
    : [];
  const approvedCount = selectedParticipants.filter((p) => p.status === "approved").length;
  const maxPart = selectedRecruitment?.max_participants ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link
        href="/dashboard/recruit"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        ← 募集一覧へ
      </Link>
      <h1 className="text-2xl font-black tracking-tight text-foreground">
        合トレを管理する
      </h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
        </div>
      ) : (
        <>
          {/* 作成した合トレ */}
          <section>
            <h2 className="mb-3 text-lg font-bold text-foreground">
              作成した合トレ
            </h2>
            {createdList.length === 0 ? (
              <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  まだ募集を作成していません
                </p>
                <Link
                  href="/dashboard/recruit/new"
                  className="mt-2 inline-block text-sm font-bold text-gold hover:underline"
                >
                  合トレを募集する
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {createdList.map((r) => {
                  const participants = participantsByRecruitment[r.id] ?? [];
                  const pending = participants.filter((p) => p.status === "pending");
                  const approved = participants.filter((p) => p.status === "approved");
                  const maxP = r.max_participants ?? null;
                  const isExpanded = expandedId === r.id;

                  return (
                    <li
                      key={r.id}
                      className="rounded-xl border border-border/40 bg-card overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailModalId(r.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <h3 className="font-bold text-foreground hover:text-gold">
                              {r.title}
                            </h3>
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
                          </button>
                          <div className="flex shrink-0 items-center gap-1">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                r.status === "open"
                                  ? "bg-gold/15 text-gold"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {statusLabel[r.status] ?? r.status}
                            </span>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                                  aria-label="メニュー"
                                >
                                  <Settings className="h-4 w-4" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-48 p-1">
                                <Link
                                  href={`/dashboard/recruit/${r.id}/edit`}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary"
                                >
                                  <Pencil className="h-4 w-4" />
                                  編集
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleCloseRecruitment(r.id)}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-secondary"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  削除（募集終了）
                                </button>
                                <Link
                                  href={`/dashboard/recruit/new?copy=${r.id}`}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary"
                                >
                                  <Copy className="h-4 w-4" />
                                  複製
                                </Link>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {/* 参加人数バー */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              参加人数: {approved.length}人
                              {maxP != null && (
                                <span> / 定員 {maxP}人（残り {Math.max(0, maxP - approved.length)}人）</span>
                              )}
                            </span>
                          </div>
                          {maxP != null && maxP > 0 && (
                            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                              <div
                                className="h-full rounded-full bg-gold/70 transition-all"
                                style={{
                                  width: `${Math.min(100, (approved.length / maxP) * 100)}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : r.id)}
                          className="mt-2 flex items-center gap-1 text-sm font-semibold text-gold hover:underline"
                        >
                          {participants.length > 0 ? (
                            <>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              申請一覧 {participants.length}件
                            </>
                          ) : (
                            <span className="text-muted-foreground">申請はまだありません</span>
                          )}
                        </button>
                      </div>
                      {isExpanded && participants.length > 0 && (
                        <div className="border-t border-border/40 bg-secondary/20 px-4 py-3">
                          <ul className="space-y-2">
                            {participants.map((p) => {
                              const key = participantKey(r.id, p.user_id);
                              const isParticipantExpanded = expandedParticipantKey === key;
                              const name = p.profiles?.nickname || p.profiles?.username || "ユーザー";
                              return (
                                <li
                                  key={key}
                                  className="rounded-lg border border-border/40 bg-card/50 overflow-hidden"
                                >
                                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isParticipantExpanded) {
                                          router.push(`/profile?u=${p.user_id}`);
                                        } else {
                                          setExpandedParticipantKey(key);
                                        }
                                      }}
                                      className="flex min-w-0 flex-1 items-center gap-2 text-left hover:opacity-90"
                                    >
                                      <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border">
                                        <AvatarImage src={p.profiles?.avatar_url ?? undefined} alt={name} />
                                        <AvatarFallback className="text-xs font-bold text-foreground">
                                          {(name || "?").slice(0, 1)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate font-medium text-foreground">{name}</span>
                                    </button>
                                    <div className="flex shrink-0 items-center gap-2">
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
                                      {p.status === "pending" && (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleApprove(r.id, p.user_id); }}
                                          disabled={approving === `${r.id}-${p.user_id}`}
                                          className="rounded bg-gold px-2 py-1 text-xs font-bold text-[#050505] hover:bg-gold-light disabled:opacity-50"
                                        >
                                          {approving === `${r.id}-${p.user_id}` ? "処理中…" : "承認する"}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {isParticipantExpanded && (
                                    <div className="border-t border-border/40 bg-secondary/30 px-3 py-2 text-sm">
                                      {p.reason && (
                                        <p className="mb-1">
                                          <span className="font-semibold text-muted-foreground">参加理由: </span>
                                          <span className="text-foreground">{p.reason}</span>
                                        </p>
                                      )}
                                      {p.self_intro && (
                                        <p className="mb-2">
                                          <span className="font-semibold text-muted-foreground">自己紹介: </span>
                                          <span className="whitespace-pre-wrap text-foreground">{p.self_intro}</span>
                                        </p>
                                      )}
                                      {!p.reason && !p.self_intro && (
                                        <p className="mb-2 text-muted-foreground">参加理由・自己紹介は未記入です</p>
                                      )}
                                      <p className="text-xs text-gold">名前またはアイコンをクリックでプロフィールへ</p>
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* 申請した合トレ */}
          <section>
            <h2 className="mb-3 text-lg font-bold text-foreground">
              申請した合トレ
            </h2>
            {appliedList.length === 0 ? (
              <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  まだ申請した募集はありません
                </p>
                <Link
                  href="/dashboard/recruit"
                  className="mt-2 inline-block text-sm font-bold text-gold hover:underline"
                >
                  募集を探す
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {appliedList.map(({ recruitment: r, myStatus }) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-border/40 bg-card p-4"
                  >
                    <Link href={`/dashboard/recruit?r=${r.id}`} className="block">
                      <h3 className="font-bold text-foreground hover:text-gold">
                        {r.title}
                      </h3>
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
                    </Link>
                    <p className="mt-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          myStatus === "approved"
                            ? "bg-green-500/15 text-green-600 dark:text-green-400"
                            : myStatus === "pending"
                              ? "bg-gold/15 text-gold"
                              : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {participantStatusLabel[myStatus] ?? myStatus}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {/* 詳細モーダル（募集内容 + 申請者リスト + 承認） */}
      <Dialog
        open={!!detailModalId}
        onOpenChange={(open) => {
          if (!open) {
            setDetailModalId(null);
            setExpandedParticipantKey(null);
          }
        }}
      >
        <DialogContent className="max-w-md border-border/60 bg-card sm:rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">募集詳細</DialogTitle>
          </DialogHeader>
          {selectedRecruitment && (
            <div className="space-y-4">
              <h2 className="text-lg font-black tracking-tight text-foreground">
                {selectedRecruitment.title}
              </h2>
              {selectedRecruitment.target_body_part && (
                <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
                  {selectedRecruitment.target_body_part}
                </span>
              )}
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-gold/70" />
                  {formatDetailDate(selectedRecruitment.event_date)}
                </p>
                {selectedRecruitment.location && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-gold/70" />
                    {selectedRecruitment.location}
                  </p>
                )}
              </div>
              {selectedRecruitment.description && (
                <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {selectedRecruitment.description}
                  </p>
                </div>
              )}

              {/* 参加人数バー（モーダル内） */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  参加人数: {approvedCount}人
                  {maxPart != null && (
                    <span> / 定員 {maxPart}人（残り {Math.max(0, maxPart - approvedCount)}人）</span>
                  )}
                </p>
                {(maxPart != null && maxPart > 0) && (
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gold/70"
                      style={{
                        width: `${Math.min(100, (approvedCount / maxPart) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 申請してるユーザーリスト + 承認 */}
              <div>
                <h3 className="mb-2 text-sm font-bold text-foreground">申請者</h3>
                {selectedParticipants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">まだ申請はありません</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedParticipants.map((p) => {
                      const key = participantKey(selectedRecruitment.id, p.user_id);
                      const isParticipantExpanded = expandedParticipantKey === key;
                      const name = p.profiles?.nickname || p.profiles?.username || "ユーザー";
                      return (
                        <li
                          key={p.user_id}
                          className="rounded-lg border border-border/40 bg-card/50 overflow-hidden"
                        >
                          <div className="flex items-center justify-between gap-2 px-3 py-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (isParticipantExpanded) {
                                  router.push(`/profile?u=${p.user_id}`);
                                } else {
                                  setExpandedParticipantKey(key);
                                }
                              }}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left hover:opacity-90"
                            >
                              <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border">
                                <AvatarImage src={p.profiles?.avatar_url ?? undefined} alt={name} />
                                <AvatarFallback className="text-xs font-bold text-foreground">
                                  {(name || "?").slice(0, 1)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate font-medium text-foreground">{name}</span>
                            </button>
                            <div className="flex shrink-0 items-center gap-2">
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
                              {p.status === "pending" && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(selectedRecruitment.id, p.user_id)}
                                  disabled={approving === `${selectedRecruitment.id}-${p.user_id}`}
                                  className="rounded bg-gold px-2 py-1 text-xs font-bold text-[#050505] hover:bg-gold-light disabled:opacity-50"
                                >
                                  {approving === `${selectedRecruitment.id}-${p.user_id}` ? "処理中…" : "承認する"}
                                </button>
                              )}
                            </div>
                          </div>
                          {isParticipantExpanded && (
                            <div className="border-t border-border/40 bg-secondary/30 px-3 py-2 text-sm">
                              {p.reason && (
                                <p className="mb-1">
                                  <span className="font-semibold text-muted-foreground">参加理由: </span>
                                  <span className="text-foreground">{p.reason}</span>
                                </p>
                              )}
                              {p.self_intro && (
                                <p className="mb-2">
                                  <span className="font-semibold text-muted-foreground">自己紹介: </span>
                                  <span className="whitespace-pre-wrap text-foreground">{p.self_intro}</span>
                                </p>
                              )}
                              {!p.reason && !p.self_intro && (
                                <p className="mb-2 text-muted-foreground">参加理由・自己紹介は未記入です</p>
                              )}
                              <p className="text-xs text-gold">名前またはアイコンをクリックでプロフィールへ</p>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
