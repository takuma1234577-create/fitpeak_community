"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Users, Crown, Loader2, MessageCircle, Info, Pencil, MoreHorizontal, Flag, CalendarDays, MapPin, Dumbbell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReportDialog from "@/components/report-dialog";
import { createClient } from "@/utils/supabase/client";
import { safeList } from "@/lib/utils";
import GroupChatTab from "@/components/groups/group-chat-tab";
import CreateGroupDialog from "@/components/groups/create-group-dialog";
import { cn } from "@/lib/utils";

type GroupData = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_private: boolean;
  chat_room_id: string | null;
  created_by: string;
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

export default function GroupDetail({ groupId }: { groupId: string }) {
  const [tab, setTab] = useState<"overview" | "chat">("overview");
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [recruitment, setRecruitment] = useState<RecruitmentSummary | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadGroup = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setMyUserId(user.id);
    const { data: g, error } = await supabase
      .from("groups")
      .select("id, name, description, category, is_private, chat_room_id, created_by")
      .eq("id", groupId)
      .single();
    if (error || !g) {
      setGroup(null);
      setLoading(false);
      return;
    }
    setGroup({
      id: (g as GroupData).id,
      name: (g as GroupData).name,
      description: (g as GroupData).description,
      category: (g as GroupData).category,
      is_private: (g as GroupData).is_private ?? false,
      chat_room_id: (g as GroupData).chat_room_id,
      created_by: (g as GroupData).created_by,
    });

    const { data: memberRows } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);
    const userIds = safeList(memberRows as { user_id: string }[] | null).map((r) => r.user_id);
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nickname, username, avatar_url")
        .in("id", userIds);
      const creatorId = (g as GroupData).created_by;
      setMembers(
        safeList(profs as Record<string, unknown>[] | null).map((p) => {
          const id = (p as { id: string }).id;
          const name = (p as { nickname: string | null }).nickname || (p as { username: string | null }).username || "ユーザー";
          return {
            user_id: id,
            name,
            initial: name.charAt(0),
            avatar_url: (p as { avatar_url: string | null }).avatar_url ?? null,
            is_creator: id === creatorId,
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
      if (rec) {
        setRecruitment(rec as RecruitmentSummary);
      } else {
        setRecruitment(null);
      }
    } catch {
      setRecruitment(null);
    }

    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const ensureParticipant = useCallback(async () => {
    if (!group?.chat_room_id || !myUserId) return;
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", group.chat_room_id)
      .eq("user_id", myUserId)
      .single();
    if (existing) return;
    const { data: isMember } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("user_id", myUserId)
      .single();
    if (isMember) {
      await (supabase as any).from("conversation_participants").insert({
        conversation_id: group.chat_room_id,
        user_id: myUserId,
      });
    }
  }, [group?.chat_room_id, groupId, myUserId]);

  const handleJoin = async () => {
    if (!group || !myUserId) return;
    setJoining(true);
    try {
      const supabase = createClient();
      const sb = supabase as any;
      await sb.from("group_members").insert({
        group_id: group.id,
        user_id: myUserId,
      });
      if (group.chat_room_id) {
        await sb.from("conversation_participants").insert({
          conversation_id: group.chat_room_id,
          user_id: myUserId,
        });
      }
      await loadGroup();
    } catch (e) {
      console.error(e);
    } finally {
      setJoining(false);
    }
  };

  const handleJoinRequest = () => {
    setJoinRequestSent(true);
  };

  const isJoined = myUserId && members.some((m) => m.user_id === myUserId);
  const isCreator = myUserId === group?.created_by;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
        <p className="mt-2 text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/groups"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-light"
        >
          <ArrowLeft className="h-4 w-4" />
          グループ一覧へ
        </Link>
        <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-muted-foreground">グループが見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/groups"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-foreground transition-colors hover:bg-secondary/80"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-black tracking-tight text-foreground truncate flex-1 min-w-0">
          {group.name}
        </h1>
        {isCreator && (
          <CreateGroupDialog
            editGroupId={group.id}
            onCreated={loadGroup}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          >
            <button
              type="button"
              onClick={() => setEditDialogOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-foreground transition-colors hover:bg-secondary/80"
              aria-label="グループを編集"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </CreateGroupDialog>
        )}
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-foreground transition-colors hover:bg-secondary/80"
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
              このグループを通報する
            </button>
          </PopoverContent>
        </Popover>
        <ReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          targetId={group.id}
          type="group"
          title={group.name}
        />
      </div>

      <div className="flex gap-2 border-b border-border/40">
        <button
          type="button"
          onClick={() => setTab("overview")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors border-b-2 -mb-px",
            tab === "overview"
              ? "border-gold text-gold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Info className="h-4 w-4" />
          概要
        </button>
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors border-b-2 -mb-px",
            tab === "chat"
              ? "border-gold text-gold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageCircle className="h-4 w-4" />
          チャット
        </button>
      </div>

      {tab === "overview" && (
        <>
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border/60 bg-card">
            <Image
              src="/placeholder.svg"
              alt={group.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              {group.description && (
                <p className="line-clamp-2 text-sm font-bold text-white">
                  {group.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {group.category && (
                  <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold">
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

          <div className="rounded-xl border border-border/60 bg-card p-5">
            <h2 className="mb-4 text-sm font-bold text-foreground">メンバー</h2>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">まだメンバーがいません</p>
            ) : (
              <div className="flex flex-col gap-3">
                {members.map((m) => (
                  <div
                    key={m.user_id}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-secondary/30 px-4 py-3"
                  >
                    <Avatar className="h-10 w-10 ring-1 ring-border">
                      <AvatarImage src={m.avatar_url ?? undefined} alt={m.name} />
                      <AvatarFallback className="text-xs font-bold text-gold">
                        {m.initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.is_creator ? "管理者" : "メンバー"}
                      </p>
                    </div>
                    {m.is_creator && <Crown className="h-4 w-4 text-gold" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isJoined && group.chat_room_id ? (
            <Link
              href={`/dashboard/messages/${group.chat_room_id}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-3.5 text-sm font-bold text-[#050505] transition-all hover:bg-gold-light"
            >
              <MessageCircle className="h-4 w-4" />
              グループチャットへ
            </Link>
          ) : !isJoined && recruitment ? (
            <>
              <div className="rounded-xl border border-border/60 bg-gold/5 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gold">
                  <Dumbbell className="h-4 w-4" />
                  合トレ概要
                </h3>
                <p className="font-bold text-foreground">{recruitment.title}</p>
                {recruitment.event_date && (
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
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
                  <p className="mt-1 text-xs text-gold">{recruitment.target_body_part}</p>
                )}
                {recruitment.description && (
                  <p className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">
                    {recruitment.description}
                  </p>
                )}
              </div>
              <Link
                href={`/dashboard/recruit?r=${recruitment.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-3.5 text-sm font-bold text-[#050505] transition-all hover:bg-gold-light"
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
        </>
      )}

      {tab === "chat" && (
        <>
          {group.chat_room_id && isJoined ? (
            <GroupChatTab
              conversationId={group.chat_room_id}
              groupName={group.name}
              myUserId={myUserId!}
              onEnsureParticipant={ensureParticipant}
            />
          ) : !isJoined ? (
            <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
              <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                チャットに参加するにはグループに参加してください
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
              <p className="text-sm font-semibold text-muted-foreground">
                チャットは利用できません
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
