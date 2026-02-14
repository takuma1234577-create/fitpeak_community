"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Dumbbell, Loader2, Crown, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, safeArray } from "@/lib/utils";

type GroupItem = {
  id: string;
  name: string;
  created_by: string;
  chat_room_id: string | null;
  is_mine: boolean; // 管理している
};

type RecruitmentItem = {
  id: string;
  title: string;
  status: string;
  user_id: string;
  is_mine: boolean; // 管理している
};

type ChatInviteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  myUserId: string;
  /** 1:1 のとき招待する相手のID。グループチャットのときは null（全員に共有） */
  targetUserId: string | null;
  /** グループチャットのときのグループ名（表示用） */
  groupChatName?: string;
  onInviteSent?: () => void;
};

function getBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export default function ChatInviteModal({
  open,
  onOpenChange,
  conversationId,
  myUserId,
  targetUserId,
  groupChatName,
  onInviteSent,
}: ChatInviteModalProps) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [myGroups, setMyGroups] = useState<GroupItem[]>([]);
  const [myRecruitments, setMyRecruitments] = useState<RecruitmentItem[]>([]);

  const loadData = useCallback(async () => {
    if (!myUserId) return;
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 管理しているグループ
    const { data: managedGroups } = await supabase
      .from("groups")
      .select("id, name, created_by, chat_room_id")
      .eq("created_by", myUserId);
    const managedList = safeArray(managedGroups) as { id: string; name: string; created_by: string; chat_room_id: string | null }[];
    const managed = managedList.map((g) => ({
      id: g.id,
      name: g.name,
      created_by: g.created_by,
      chat_room_id: g.chat_room_id,
      is_mine: true,
    }));

    // 所属しているグループ（管理以外）
    const { data: memberRows } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", myUserId);
    const memberRowsList = safeArray(memberRows) as { group_id: string }[];
    const memberGroupIds = memberRowsList.map((r) => r.group_id);
    const excludeIds = new Set(managed.map((g) => g.id));
    const belongIds = memberGroupIds.filter((id) => !excludeIds.has(id));

    let belong: GroupItem[] = [];
    if (belongIds.length > 0) {
      const { data: belongGroups } = await supabase
        .from("groups")
        .select("id, name, created_by, chat_room_id")
        .in("id", belongIds);
      const belongList = safeArray(belongGroups) as { id: string; name: string; created_by: string; chat_room_id: string | null }[];
      belong = belongList.map((g) => ({
        id: g.id,
        name: g.name,
        created_by: g.created_by,
        chat_room_id: g.chat_room_id,
        is_mine: false,
      }));
    }

    setMyGroups([...managed, ...belong]);

    // 管理している合トレ（募集中のみ）
    const { data: managedRecs } = await supabase
      .from("recruitments")
      .select("id, title, status, user_id")
      .eq("user_id", myUserId)
      .eq("status", "open");
    const managedRecsList = safeArray(managedRecs) as { id: string; title: string; status: string; user_id: string }[];
    const managedRecList = managedRecsList.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      user_id: r.user_id,
      is_mine: true,
    }));

    // 申請中の合トレ
    const { data: appliedRows } = await (supabase as any)
      .from("recruitment_participants")
      .select("recruitment_id")
      .eq("user_id", myUserId);
    const appliedRowsList = safeArray(appliedRows) as { recruitment_id: string }[];
    const appliedIds = [...new Set(appliedRowsList.map((r) => r.recruitment_id))];
    const appliedExclude = new Set(managedRecList.map((r) => r.id));
    const appliedOnlyIds = appliedIds.filter((id) => !appliedExclude.has(id));

    let appliedRecList: RecruitmentItem[] = [];
    if (appliedOnlyIds.length > 0) {
      const { data: appliedRecs } = await supabase
        .from("recruitments")
        .select("id, title, status, user_id")
        .in("id", appliedOnlyIds)
        .eq("status", "open");
      const appliedRecsList = safeArray(appliedRecs) as { id: string; title: string; status: string; user_id: string }[];
      appliedRecList = appliedRecsList.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        user_id: r.user_id,
        is_mine: false,
      }));
    }

    setMyRecruitments([...managedRecList, ...appliedRecList]);
    setLoading(false);
  }, [myUserId]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      loadData();
    }
  }, [open, loadData]);

  const sendGroupInvite = async (g: GroupItem) => {
    setSending(g.id);
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/dashboard/groups/${g.id}`;
    const text = targetUserId
      ? `${g.name}に招待しました`
      : `${g.name}を共有しました`;
    const content = JSON.stringify({
      type: "group_invite",
      groupId: g.id,
      groupName: g.name,
      groupUrl: url,
      text,
    });

    const supabase = createClient();
    const sb = supabase as any;

    try {
      await sb.from("messages").insert({
        conversation_id: conversationId,
        sender_id: myUserId,
        content,
        message_type: "group_invite",
      });

      if (targetUserId && g.is_mine) {
        try {
          await sb.from("group_members").insert({ group_id: g.id, user_id: targetUserId });
          if (g.chat_room_id) {
            await sb.from("conversation_participants").insert({
              conversation_id: g.chat_room_id,
              user_id: targetUserId,
            });
          }
        } catch {
          // RLS で拒否される場合はスキップ（メッセージは送信済み）
        }
      }

      onInviteSent?.();
      onOpenChange(false);
    } catch (e) {
      console.error("sendGroupInvite:", e);
    } finally {
      setSending(null);
    }
  };

  const sendRecruitmentInvite = async (r: RecruitmentItem) => {
    setSending(r.id);
    const text = targetUserId
      ? `合トレ「${r.title}」に招待しました`
      : `合トレ「${r.title}」を共有しました`;
    const content = JSON.stringify({
      recruitmentId: r.id,
      title: r.title,
      text,
    });

    const supabase = createClient();
    const sb = supabase as any;

    try {
      await sb.from("messages").insert({
        conversation_id: conversationId,
        sender_id: myUserId,
        content,
        message_type: "recruitment_invite",
      });

      onInviteSent?.();
      onOpenChange(false);
    } catch (e) {
      console.error("sendRecruitmentInvite:", e);
    } finally {
      setSending(null);
    }
  };

  const hasGroups = myGroups.length > 0;
  const hasRecruitments = myRecruitments.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col border-border/60 bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-left">
            {targetUserId ? "招待する" : "共有する"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : !hasGroups && !hasRecruitments ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            招待できるグループや合トレがありません
          </p>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {hasGroups && (
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <MessageCircle className="h-4 w-4 text-gold" />
                  グループ
                </h3>
                <ul className="space-y-1.5">
                  {myGroups.map((g) => (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => sendGroupInvite(g)}
                        disabled={!!sending}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border border-border/60 bg-secondary/40 px-4 py-3 text-left transition-all hover:border-gold/40 hover:bg-secondary/80 disabled:opacity-60",
                          sending === g.id && "opacity-60"
                        )}
                      >
                        {sending === g.id ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold" />
                        ) : g.is_mine ? (
                          <Crown className="h-4 w-4 shrink-0 text-gold" />
                        ) : (
                          <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="flex-1 truncate text-sm font-medium text-foreground">
                          {g.name}
                        </span>
                        {g.is_mine && (
                          <span className="shrink-0 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">
                            管理
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {hasRecruitments && (
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Dumbbell className="h-4 w-4 text-gold" />
                  合トレ
                </h3>
                <ul className="space-y-1.5">
                  {myRecruitments.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => sendRecruitmentInvite(r)}
                        disabled={!!sending}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border border-border/60 bg-secondary/40 px-4 py-3 text-left transition-all hover:border-gold/40 hover:bg-secondary/80 disabled:opacity-60",
                          sending === r.id && "opacity-60"
                        )}
                      >
                        {sending === r.id ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold" />
                        ) : (
                          <Dumbbell className="h-4 w-4 shrink-0 text-gold" />
                        )}
                        <span className="flex-1 truncate text-sm font-medium text-foreground">
                          {r.title}
                        </span>
                        {r.is_mine && (
                          <span className="shrink-0 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">
                            管理
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
