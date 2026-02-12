"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Users, Crown, Loader2, MessageCircle, CalendarDays, MapPin, Dumbbell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { safeArray } from "@/lib/utils";
import { ensureArray } from "@/lib/data-sanitizer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GroupData = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_private: boolean;
  chat_room_id: string | null;
  created_by: string;
  header_url: string | null;
};

type MemberRow = {
  user_id: string;
  name: string;
  initial: string;
  avatar_url: string | null;
  is_creator: boolean;
};

type RecruitmentSummary = {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  description: string | null;
  target_body_part: string | null;
};

export default function GroupDetailModal({
  groupId,
  open,
  onOpenChange,
  onJoined,
}: {
  groupId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoined?: () => void;
}) {
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [recruitment, setRecruitment] = useState<RecruitmentSummary | null>(null);

  const loadGroup = useCallback(async () => {
    if (!groupId) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setMyUserId(user.id);
    const { data: g, error } = await supabase
      .from("groups")
      .select("id, name, description, category, is_private, chat_room_id, created_by, header_url")
      .eq("id", groupId)
      .single();
    if (error || !g) {
      setGroup(null);
      setLoading(false);
      return;
    }
    setGroup(g as GroupData);

    const { data: memberRows } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);
    const memberList = ensureArray(memberRows) as { user_id: string }[];
    const userIds = memberList.map((r) => r.user_id);
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nickname, username, avatar_url")
        .in("id", userIds);
      const profList = ensureArray(profs) as Record<string, unknown>[];
      setMembers(
        profList.map((p) => {
          const id = (p as { id: string }).id;
          const name = (p as { nickname: string | null }).nickname || (p as { username: string | null }).username || "ユーザー";
          return {
            user_id: id,
            name,
            initial: name.charAt(0),
            avatar_url: (p as { avatar_url: string | null }).avatar_url ?? null,
            is_creator: id === (g as GroupData).created_by,
          };
        })
      );
    } else {
      setMembers([]);
    }

    try {
      const { data: rec } = await (supabase as any)
        .from("recruitments")
        .select("id, title, event_date, location, description, target_body_part")
        .eq("group_id", groupId)
        .eq("status", "open")
        .maybeSingle();
      setRecruitment(rec ? (rec as RecruitmentSummary) : null);
    } catch {
      setRecruitment(null);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    if (open && groupId) {
      loadGroup();
    } else {
      setGroup(null);
      setMembers([]);
      setRecruitment(null);
    }
  }, [open, groupId, loadGroup]);

  const handleJoin = async () => {
    if (!group || !myUserId) return;
    setJoining(true);
    try {
      const supabase = createClient();
      const sb = supabase as any;
      await sb.from("group_members").insert({ group_id: group.id, user_id: myUserId });
      if (group.chat_room_id) {
        await sb.from("conversation_participants").insert({
          conversation_id: group.chat_room_id,
          user_id: myUserId,
        });
      }
      await loadGroup();
      onJoined?.();
    } catch (e) {
      console.error(e);
    } finally {
      setJoining(false);
    }
  };

  const handleJoinRequest = () => setJoinRequestSent(true);

  const isJoined = myUserId && members.some((m) => m.user_id === myUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border/60 bg-card p-0 sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{group?.name ?? "グループ"}</DialogTitle>
        </DialogHeader>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
            <p className="mt-2 text-sm text-muted-foreground">読み込み中...</p>
          </div>
        ) : !group ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">グループが見つかりません</p>
          </div>
        ) : (
          <div className="space-y-5 px-6 pb-6 pt-12">
            <h2 className="pr-10 text-lg font-black tracking-tight text-foreground">
              {group.name}
            </h2>

            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border/60 bg-card">
              <Image
                src={group.header_url || "/placeholder.svg"}
                alt=""
                fill
                className="object-cover"
                unoptimized={!!group.header_url}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                {group.description && (
                  <p className="line-clamp-2 text-sm font-bold text-white">{group.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {group.category && (
                    <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-foreground">
                      {group.category}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                    <Users className="h-4 w-4" />
                    {members.length}人
                  </span>
                  {group.is_private && (
                    <span className="text-[11px] font-medium text-white/70">承認制</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h3 className="mb-3 text-sm font-bold text-foreground">メンバー</h3>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">まだメンバーがいません</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {safeArray(members).map((m) => (
                    <div
                      key={m.user_id}
                      className="flex items-center gap-3 rounded-lg border border-border/40 bg-secondary/30 px-3 py-2.5"
                    >
                      <Avatar className="h-9 w-9 ring-1 ring-border">
                        <AvatarImage src={m.avatar_url ?? undefined} alt={m.name} />
                        <AvatarFallback className="text-xs font-bold text-foreground">{m.initial}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {m.is_creator ? "管理者" : "メンバー"}
                        </p>
                      </div>
                      {m.is_creator && <Crown className="h-4 w-4 shrink-0 text-gold" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isJoined && group.chat_room_id ? (
              <Link
                href={`/dashboard/messages/${group.chat_room_id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-3.5 text-sm font-bold text-[#050505] transition-all hover:bg-gold-light"
                onClick={() => onOpenChange(false)}
              >
                <MessageCircle className="h-4 w-4" />
                グループチャットへ
              </Link>
            ) : !isJoined && recruitment ? (
              <>
                <div className="rounded-xl border border-border/60 bg-gold/5 p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                    <Dumbbell className="h-4 w-4" />
                    合トレ概要
                  </h3>
                  <p className="font-bold text-foreground">{recruitment.title}</p>
                  {recruitment.event_date && (
                    <p className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(recruitment.event_date).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  {recruitment.location && (
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {recruitment.location}
                    </p>
                  )}
                  {recruitment.target_body_part && (
                    <p className="mt-1 text-xs text-foreground">{recruitment.target_body_part}</p>
                  )}
                  {recruitment.description && (
                    <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                      {recruitment.description}
                    </p>
                  )}
                </div>
                <Link
                  href={`/dashboard/recruit?r=${recruitment.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-3.5 text-sm font-bold text-[#050505] transition-all hover:bg-gold-light"
                  onClick={() => onOpenChange(false)}
                >
                  <Dumbbell className="h-4 w-4" />
                  合トレ申請
                </Link>
              </>
            ) : !isJoined ? (
              group.is_private ? (
                <button
                  type="button"
                  disabled={joinRequestSent}
                  onClick={handleJoinRequest}
                  className="w-full rounded-lg border border-gold/40 bg-transparent py-3.5 text-sm font-bold text-gold transition-all hover:border-gold hover:bg-gold hover:text-[#050505] disabled:opacity-60"
                >
                  {joinRequestSent ? "申請済み" : "参加申請する"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={joining}
                  onClick={handleJoin}
                  className="w-full rounded-lg border border-gold/40 bg-transparent py-3.5 text-sm font-bold text-gold transition-all hover:border-gold hover:bg-gold hover:text-[#050505] disabled:opacity-60"
                >
                  {joining ? "参加処理中..." : "参加する"}
                </button>
              )
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
