"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, ArrowRight, Settings, MoreHorizontal, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReportDialog from "@/components/report-dialog";
import { createClient } from "@/utils/supabase/client";

export interface RecruitmentPost {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  tags: string[];
  description?: string;
  user_id?: string;
  user: {
    name: string;
    title: string;
    avatar?: string;
    initial?: string;
  };
  spots: number;
  spotsLeft: number;
}

export default function RecruitmentCard({
  post,
  myUserId,
  myDisplayName,
  participantStatus,
  onApplied,
  onWithdrawn,
}: {
  post: RecruitmentPost;
  myUserId?: string | null;
  myDisplayName?: string;
  participantStatus?: "pending" | "approved" | "rejected" | "withdrawn";
  onApplied?: () => void;
  onWithdrawn?: () => void;
}) {
  const [applyOpen, setApplyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const spotsPercent = post?.spots != null && post.spots > 0 ? ((post.spots - (post.spotsLeft ?? 0)) / post.spots) * 100 : 0;
  const initial = post?.user?.initial ?? post?.user?.name?.charAt(0) ?? "?";
  const isCreator = myUserId && post?.user_id === myUserId;

  const buttonLabel =
    participantStatus === "approved"
      ? "参加確定"
      : participantStatus === "pending"
        ? "申請中"
        : "参加する";

  const handleApply = async () => {
    if (!myUserId || participantStatus) return;
    setSubmitting(true);
    setApplyError(null);
    const supabase = createClient();
    const { error } = await (supabase as any)
      .from("recruitment_participants")
      .insert({ recruitment_id: post.id, user_id: myUserId, status: "pending" });
    if (error) {
      setSubmitting(false);
      setApplyError(error.message ?? "申請に失敗しました");
      return;
    }
    const applicantName = myDisplayName || "ユーザー";
    await (supabase as any).from("notifications").insert({
      user_id: post.user_id,
      sender_id: myUserId,
      type: "apply",
      content: `${applicantName}さんから応募がありました`,
      link: `/dashboard/recruit/manage?r=${post.id}`,
    });
    setSubmitting(false);
    setApplyOpen(false);
    onApplied?.();
  };

  const handleWithdraw = async () => {
    if (!myUserId || participantStatus !== "approved") return;
    setWithdrawing(true);
    const supabase = createClient();
    const { data: recruitment } = await (supabase as any)
      .from("recruitments")
      .select("chat_room_id, user_id")
      .eq("id", post.id)
      .single();
    await (supabase as any)
      .from("recruitment_participants")
      .update({ status: "withdrawn", updated_at: new Date().toISOString() })
      .eq("recruitment_id", post.id)
      .eq("user_id", myUserId);
    if (recruitment?.chat_room_id) {
      await (supabase as any)
        .from("conversation_participants")
        .delete()
        .eq("conversation_id", recruitment.chat_room_id)
        .eq("user_id", myUserId);
    }
    const myName = myDisplayName || "ユーザー";
    await (supabase as any).from("notifications").insert({
      user_id: recruitment?.user_id,
      sender_id: myUserId,
      type: "cancel",
      content: `${myName}さんが「${post.title}」の参加を辞退しました`,
      link: `/dashboard/recruit/manage?r=${post.id}`,
    });
    setWithdrawing(false);
    setWithdrawConfirmOpen(false);
    onWithdrawn?.();
  };

  return (
    <article className="group relative flex flex-col rounded-xl border border-border/60 bg-card transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/[0.04]">
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
        {isCreator ? (
          <Link
            href={`/dashboard/recruit/manage?r=${post.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-gold"
            aria-label="この募集を管理"
          >
            <Settings className="h-4 w-4" />
          </Link>
        ) : (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="メニュー"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setReportOpen(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary"
              >
                <Flag className="h-4 w-4" />
                この募集を通報する
              </button>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-gold" />
            <span className="font-bold">{post.date}</span>
            <span className="text-muted-foreground">{post.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-gold/70" />
          <span className="font-medium">{post.location}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-4">
        <h3 className="line-clamp-2 text-balance text-sm font-bold leading-snug text-foreground">
          {post.title}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          {(post?.tags ?? []).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="border-0 bg-gold/10 px-2.5 py-0.5 text-[11px] font-semibold text-gold/90 hover:bg-gold/20"
            >
              #{tag}
            </Badge>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">
              募集枠
            </span>
            <span className="text-[11px] font-bold text-foreground">
              <span className="text-gold">{post.spotsLeft}</span>
              <span className="text-muted-foreground">/{post.spots}名</span>
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gold/60 transition-all duration-500"
              style={{ width: `${spotsPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
            <AvatarImage
              src={post.user.avatar || "/placeholder.svg"}
              alt={post.user.name}
            />
            <AvatarFallback className="text-xs">{initial}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">
              {post.user.name}
            </span>
            <span className="text-[10px] font-medium text-gold/80">
              {post.user.title}
            </span>
          </div>
        </div>

        {isCreator ? (
          <Link
            href={`/dashboard/recruit/manage?r=${post.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-gold/40 bg-transparent px-3.5 py-2 text-xs font-bold text-gold transition-all duration-300 hover:border-gold hover:bg-gold hover:text-[#050505] active:scale-[0.97]"
          >
            管理する
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            {participantStatus === "approved" && (
              <button
                type="button"
                disabled={withdrawing}
                onClick={() => setWithdrawConfirmOpen(true)}
                className="rounded-lg border border-red-500/40 bg-transparent px-2.5 py-1.5 text-xs font-bold text-red-500 transition-all hover:bg-red-500/10"
              >
                {withdrawing ? "処理中…" : "参加を辞退する"}
              </button>
            )}
            <button
              type="button"
              disabled={participantStatus === "pending" || participantStatus === "approved"}
              onClick={() => participantStatus ? undefined : setApplyOpen(true)}
              className={`
                flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-all duration-300 active:scale-[0.97]
                ${participantStatus === "approved"
                  ? "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400"
                  : participantStatus === "pending"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 cursor-default"
                    : "border-gold/40 bg-transparent text-gold hover:border-gold hover:bg-gold hover:text-[#050505]"
                }
              `}
            >
              {buttonLabel}
              {participantStatus !== "pending" && participantStatus !== "approved" && (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetId={post.id}
        type="recruitment"
        title={post.title}
      />

      <Dialog open={withdrawConfirmOpen} onOpenChange={setWithdrawConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>参加を辞退しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            「{post.title}」の参加を辞退すると、グループチャットからも退出します。募集者に通知が送られます。
          </p>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setWithdrawConfirmOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              キャンセル
            </button>
            <button
              type="button"
              disabled={withdrawing}
              onClick={handleWithdraw}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {withdrawing ? "処理中…" : "辞退する"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{post.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4 text-gold" />
              {post.date} {post.time}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-gold" />
              {post.location}
            </p>
            {post.description && (
              <p className="rounded-lg bg-secondary/50 p-3 text-foreground">
                {post.description}
              </p>
            )}
            {(post?.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(post?.tags ?? []).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {applyError && (
            <p className="text-sm text-destructive">{applyError}</p>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setApplyOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              キャンセル
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleApply}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-[#050505] hover:bg-gold-light disabled:opacity-50"
            >
              {submitting ? "送信中…" : "申請を送る"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
