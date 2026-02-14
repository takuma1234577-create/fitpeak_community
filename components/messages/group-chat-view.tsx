"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, UserPlus } from "lucide-react";
import GroupChatTab from "@/components/groups/group-chat-tab";
import ChatInviteModal from "@/components/messages/chat-invite-modal";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

export default function GroupChatView({
  conversationId,
  groupName,
  groupId,
  myUserId,
}: {
  conversationId: string;
  groupName: string;
  groupId: string;
  myUserId: string;
}) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const ensureParticipant = async () => {
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
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
        conversation_id: conversationId,
        user_id: myUserId,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/30 bg-background/95 px-4 backdrop-blur">
        <Link
          href="/dashboard/messages"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground -ml-1"
          aria-label="一覧に戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link
          href={`/dashboard/groups/${groupId}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-colors hover:bg-secondary/40 -mx-1 px-1 py-0.5"
          aria-label={`${groupName}の詳細`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary ring-2 ring-border/40 sm:h-10 sm:w-10">
            <MessageCircle className="h-5 w-5 text-gold" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-bold text-foreground">{groupName}</span>
            <span className="text-[11px] leading-tight text-muted-foreground/50">グループチャット</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-secondary/60 hover:text-foreground"
          aria-label="グループ・合トレを共有"
        >
          <UserPlus className="h-5 w-5" />
        </button>
      </header>
      <div className={cn("flex min-h-0 flex-1 flex-col bg-[#070707]")}>
        <GroupChatTab
          conversationId={conversationId}
          groupName={groupName}
          myUserId={myUserId}
          onEnsureParticipant={ensureParticipant}
          fullHeight
          refreshTrigger={refreshTrigger}
        />
      </div>

      <ChatInviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        conversationId={conversationId}
        myUserId={myUserId}
        targetUserId={null}
        groupChatName={groupName}
        onInviteSent={() => setRefreshTrigger((t) => t + 1)}
      />
    </div>
  );
}
