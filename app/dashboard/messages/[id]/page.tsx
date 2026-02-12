"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import IndividualChatView from "@/components/messages/individual-chat-view";
import GroupChatView from "@/components/messages/group-chat-view";
import { Loader2 } from "lucide-react";

type GroupInfo = { id: string; name: string; chat_room_id: string };

export default function DashboardMessageChatPage() {
  const params = useParams();
  const id = params.id as string;
  const [group, setGroup] = useState<GroupInfo | null | undefined>(undefined);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setMyUserId(user.id);
      const { data: g } = await supabase
        .from("groups")
        .select("id, name, chat_room_id")
        .eq("chat_room_id", id)
        .maybeSingle();
      if (cancelled) return;
      setGroup(g ? (g as GroupInfo) : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (group === undefined || (group && !myUserId)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (group) {
    return (
      <GroupChatView
        conversationId={id}
        groupName={group.name}
        groupId={group.id}
        myUserId={myUserId!}
      />
    );
  }

  return <IndividualChatView conversationId={id} embedded />;
}
