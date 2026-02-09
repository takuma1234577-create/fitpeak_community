"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Trash2,
  Pencil,
  UserPlus,
  UserX,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { bodyParts } from "@/components/dashboard/filter-bar";
import { PREFECTURES } from "@/lib/constants";

type RecruitmentRow = {
  id: string;
  title: string;
  description: string | null;
  target_body_part: string | null;
  event_date: string;
  location: string | null;
  status: string;
  created_at: string;
  chat_room_id: string | null;
};

type PendingParticipant = {
  user_id: string;
  recruitment_id: string;
  status: string;
  profiles: { nickname: string | null; username: string | null; avatar_url: string | null } | null;
};

export default function RecruitManage() {
  const [list, setList] = useState<RecruitmentRow[]>([]);
  const [pendingByRecruitment, setPendingByRecruitment] = useState<Record<string, PendingParticipant[]>>({});
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<RecruitmentRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTargetBodyPart, setEditTargetBodyPart] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventTime, setEditEventTime] = useState("12:00");
  const [editLocation, setEditLocation] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const listRef = useRef<Record<string, HTMLLIElement | null>>({});

  const fetchList = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await (supabase as any)
      .from("recruitments")
      .select("id, title, description, target_body_part, event_date, location, status, created_at, chat_room_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const safeList = Array.isArray(data) ? (data as RecruitmentRow[]) : [];
    if (!error) {
      setList(safeList);
      const ids = safeList.map((r) => r.id);
      if (ids.length > 0) {
        const { data: pending } = await (supabase as any)
          .from("recruitment_participants")
          .select("recruitment_id, user_id, status, profiles(nickname, username, avatar_url)")
          .in("recruitment_id", ids)
          .eq("status", "pending");
        const byRec: Record<string, PendingParticipant[]> = {};
        ids.forEach((id) => (byRec[id] = []));
        (pending ?? []).forEach((p: PendingParticipant) => {
          if (!byRec[p.recruitment_id]) byRec[p.recruitment_id] = [];
          byRec[p.recruitment_id].push(p);
        });
        setPendingByRecruitment(byRec);
      }
    } else {
      setList([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const r = params?.get("r");
    if (r && list.length > 0 && listRef.current[r]) {
      listRef.current[r]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [list]);

  const openEdit = (r: RecruitmentRow) => {
    setEditing(r);
    setEditTitle(r.title);
    setEditDescription(r.description ?? "");
    setEditTargetBodyPart(r.target_body_part ?? "all");
    const d = new Date(r.event_date);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    setEditEventDate(`${y}-${m}-${day}`);
    setEditEventTime(d.toTimeString().slice(0, 5));
    setEditLocation(r.location ?? "");
    setEditError(null);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditing(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError(null);
    if (!editTitle.trim()) {
      setEditError("タイトルを入力してください");
      return;
    }
    if (!editEventDate.trim()) {
      setEditError("日付を選択してください");
      return;
    }
    const dateTime = `${editEventDate}T${editEventTime}:00`;
    const eventDateTime = new Date(dateTime).toISOString();
    setEditSubmitting(true);
    const supabase = createClient();
    const { error } = await (supabase as any)
      .from("recruitments")
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        target_body_part: editTargetBodyPart && editTargetBodyPart !== "all" ? editTargetBodyPart : null,
        event_date: eventDateTime,
        location: editLocation.trim() || null,
      })
      .eq("id", editing.id);
    setEditSubmitting(false);
    if (error) {
      setEditError(error.message ?? "更新に失敗しました");
      return;
    }
    closeEdit();
    fetchList();
  };

  const handleDelete = async (r: RecruitmentRow) => {
    if (!confirm(`「${r.title}」を募集中止（削除）しますか？参加者に通知が送られます。`)) return;
    setActionLoading(r.id);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: participants } = await (supabase as any)
      .from("recruitment_participants")
      .select("user_id")
      .eq("recruitment_id", r.id)
      .in("status", ["pending", "approved"]);
    const userIds = (participants ?? []).map((p: { user_id: string }) => p.user_id);
    for (const uid of userIds) {
      if (uid === user?.id) continue;
      await (supabase as any).from("notifications").insert({
        user_id: uid,
        sender_id: user?.id ?? null,
        type: "cancel",
        content: `「${r.title}」の募集が中止されました`,
        link: "/dashboard/recruit",
      });
    }
    await (supabase as any).from("recruitments").delete().eq("id", r.id);
    setActionLoading(null);
    fetchList();
  };

  const handleApprove = async (
    recruitmentId: string,
    recruitmentTitle: string,
    participantUserId: string,
    chatRoomId: string | null
  ) => {
    setActionLoading(`${recruitmentId}-${participantUserId}`);
    const supabase = createClient();
    const { error: updateErr } = await (supabase as any)
      .from("recruitment_participants")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("recruitment_id", recruitmentId)
      .eq("user_id", participantUserId);
    if (updateErr) {
      setActionLoading(null);
      return;
    }
    if (chatRoomId) {
      await (supabase as any)
        .from("conversation_participants")
        .upsert(
          { conversation_id: chatRoomId, user_id: participantUserId },
          { onConflict: "conversation_id,user_id" }
        );
    }
    await (supabase as any).from("notifications").insert({
      user_id: participantUserId,
      sender_id: (await supabase.auth.getUser()).data.user?.id ?? null,
      type: "approve",
      content: `「${recruitmentTitle}」への参加が承認されました`,
      link: chatRoomId ? `/dashboard/messages/${chatRoomId}` : "/dashboard/recruit",
    });
    setActionLoading(null);
    fetchList();
  };

  const handleReject = async (recruitmentId: string, participantUserId: string) => {
    setActionLoading(`${recruitmentId}-${participantUserId}`);
    const supabase = createClient();
    await (supabase as any)
      .from("recruitment_participants")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("recruitment_id", recruitmentId)
      .eq("user_id", participantUserId);
    setActionLoading(null);
    fetchList();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/recruit"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="募集一覧に戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black tracking-wide text-foreground">自分の合トレ管理</h1>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-muted-foreground">まだ募集を作成していません</p>
          <Link
            href="/dashboard/recruit"
            className="mt-3 inline-block text-sm font-bold text-gold hover:underline"
          >
            募集一覧へ
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {(list || []).map((r) => {
            const d = new Date(r.event_date);
            const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
            const timeStr = d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
            const pendingList = (pendingByRecruitment[r.id] ?? []) as PendingParticipant[];
            return (
              <li
                key={r.id}
                ref={(el) => { listRef.current[r.id] = el; }}
                className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card px-4 py-4"
              >
                <div className="flex flex-start justify-between gap-2">
                  <h2 className="font-bold text-foreground">{r.title}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      r.status === "open" ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.status === "open" ? "募集中" : "終了"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-gold/70" />
                    {dateStr} {timeStr}
                  </span>
                  {r.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gold/70" />
                      {r.location}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(r)}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {actionLoading === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    削除
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="flex items-center gap-1.5 rounded-lg border border-gold/40 bg-transparent px-3 py-1.5 text-xs font-bold text-gold transition-colors hover:bg-gold/10"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    編集
                  </button>
                </div>
                {pendingList.length > 0 && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                      <UserPlus className="h-3.5 w-3.5" />
                      承認待ち ({pendingList.length}名)
                    </p>
                    <ul className="space-y-2">
                      {(pendingList || []).map((p) => {
                        const name = p.profiles?.nickname || p.profiles?.username || "ユーザー";
                        const key = `${r.id}-${p.user_id}`;
                        const isLoading = actionLoading === key;
                        return (
                          <li key={key} className="flex items-center justify-between gap-2 rounded bg-card px-2 py-1.5 text-sm">
                            <span className="font-medium text-foreground">{name}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={!!actionLoading}
                                onClick={() => handleApprove(r.id, r.title, p.user_id, r.chat_room_id)}
                                className="flex items-center gap-1 rounded border border-green-500/50 bg-green-500/10 px-2 py-1 text-xs font-bold text-green-600 hover:bg-green-500/20 dark:text-green-400 disabled:opacity-50"
                              >
                                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                                承認
                              </button>
                              <button
                                type="button"
                                disabled={!!actionLoading}
                                onClick={() => handleReject(r.id, p.user_id)}
                                className="flex items-center gap-1 rounded border border-red-500/50 bg-red-500/10 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-500/20 dark:text-red-400 disabled:opacity-50"
                              >
                                <UserX className="h-3 w-3" />
                                却下
                              </button>
                            </div>
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

      <Dialog open={editOpen} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-md border-border/60 bg-card">
          <DialogHeader>
            <DialogTitle>募集を編集</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                タイトル <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="例: 胸トレ合トレ募集！"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                説明（任意）
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="補足や条件など"
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                部位
              </label>
              <select
                value={editTargetBodyPart || "all"}
                onChange={(e) => setEditTargetBodyPart(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
              >
                {(bodyParts || []).map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  日付 <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={editEventDate}
                  onChange={(e) => setEditEventDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  時間
                </label>
                <input
                  type="time"
                  value={editEventTime}
                  onChange={(e) => setEditEventTime(e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                場所
              </label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="例: ゴールドジム原宿"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
              />
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <DialogFooter className="gap-2 sm:gap-0">
              <button type="button" onClick={closeEdit} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
                キャンセル
              </button>
              <button
                type="submit"
                disabled={editSubmitting}
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-[#050505] hover:bg-gold-light disabled:opacity-50"
              >
                {editSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
