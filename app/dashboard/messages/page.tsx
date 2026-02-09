"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ConversationList, {
  type Conversation,
} from "@/components/messages/conversation-list";
import ChatRoom, {
  type Message,
  type ChatUser,
} from "@/components/messages/chat-room";
import { MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

function formatMessageTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 24 * 60 * 60 * 1000) return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  if (diff < 2 * 24 * 60 * 60 * 1000) return "昨日";
  if (diff < 7 * 24 * 60 * 60 * 1000) return "今週";
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

type MessageRow = { id: string; conversation_id?: string; sender_id: string; content: string; created_at: string };
type ParticipantRow = { conversation_id: string; user_id: string; profiles: { id: string; nickname: string | null; username: string | null; avatar_url: string | null } | null };

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }
    setMyUserId(user.id);

    const { data: myParts } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);
    const parts = (myParts ?? []) as { conversation_id: string }[];
    const convIds = parts.map((p) => p.conversation_id);
    if (convIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: lastMessages } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false });

    const lastMessagesList = (lastMessages ?? []) as MessageRow[];
    const lastByConv = new Map<string, { content: string; created_at: string }>();
    for (const m of lastMessagesList) {
      const cid = m.conversation_id;
      if (cid && !lastByConv.has(cid)) {
        lastByConv.set(cid, { content: m.content, created_at: m.created_at });
      }
    }

    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id, profiles(id, nickname, username, avatar_url)")
      .in("conversation_id", convIds);

    const participantsList = (participants ?? []) as ParticipantRow[];
    const otherByConv = new Map<string, { id: string; name: string; avatar: string | null }>();
    for (const p of participantsList) {
      if (p.user_id === user.id) continue;
      const prof = p.profiles;
      if (prof) {
        otherByConv.set(p.conversation_id, {
          id: prof.id,
          name: prof.nickname || prof.username || "ユーザー",
          avatar: prof.avatar_url,
        });
      }
    }

    const list: Conversation[] = convIds.map((cid) => {
      const last = lastByConv.get(cid);
      const other = otherByConv.get(cid);
      return {
        id: cid,
        name: other?.name ?? "不明",
        avatar: other?.avatar ?? "/placeholder.svg",
        lastMessage: last?.content ?? "",
        time: last ? formatMessageTime(last.created_at) : "",
        unread: 0,
        online: false,
      };
    });
    list.sort((a, b) => {
      const tA = lastByConv.get(a.id)?.created_at ?? "";
      const tB = lastByConv.get(b.id)?.created_at ?? "";
      return tB.localeCompare(tA);
    });
    setConversations(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!myUserId) return;
      setMessagesLoading(true);
      const supabase = createClient();
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("messages fetch:", error);
        setMessages([]);
        setMessagesLoading(false);
        return;
      }
      const msgsList = (msgs ?? []) as { id: string; sender_id: string; content: string; created_at: string }[];
      const list: Message[] = msgsList.map((m) => ({
        id: m.id,
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
        isMe: m.sender_id === myUserId,
      }));
      setMessages(list);

      const { data: parts } = await supabase
        .from("conversation_participants")
        .select("user_id, profiles(id, nickname, username, avatar_url)")
        .eq("conversation_id", conversationId)
        .neq("user_id", myUserId)
        .limit(1)
        .maybeSingle();
      const part = parts as { profiles: { id: string; nickname: string | null; username: string | null; avatar_url: string | null } | null } | null;
      const prof = part?.profiles;
      const conv = conversations.find((c) => c.id === conversationId);
      setOtherUser(
        prof
          ? {
              id: prof.id,
              name: prof.nickname || prof.username || "ユーザー",
              avatar: prof.avatar_url ?? "/placeholder.svg",
              title: "",
              online: false,
            }
          : conv
            ? { id: "", name: conv.name, avatar: conv.avatar, title: "", online: false }
            : { id: "", name: "ユーザー", avatar: "/placeholder.svg", title: "", online: false }
      );
      setMessagesLoading(false);
    },
    [myUserId, conversations]
  );

  const cFromUrl = searchParams.get("c");
  useEffect(() => {
    if (!cFromUrl || !myUserId) return;
    router.replace(`/messages/${cFromUrl}`);
  }, [cFromUrl, myUserId, router]);

  const handleSelect = (id: string) => {
    router.push(`/messages/${id}`);
  };

  const handleBack = () => {
    setShowChat(false);
  };

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!activeId || !myUserId) return;
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted, error } = await (supabase as any)
        .from("messages")
        .insert({
          conversation_id: activeId,
          sender_id: myUserId,
          content: text,
        })
        .select("id, content, created_at")
        .single();
      if (error) {
        console.error("send message:", error);
        return;
      }
      const row = inserted as { id: string; content: string; created_at: string } | null;
      if (!row) return;
      setMessages((prev) => [
        ...prev,
        {
          id: row.id,
          text: row.content,
          time: new Date(row.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
          isMe: true,
        },
      ]);
      loadConversations();
      await loadMessages(activeId);
    },
    [activeId, myUserId, loadConversations, loadMessages]
  );

  const filteredConversations = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const emptyConversations = !loading && conversations.length === 0;
  const emptyMessage =
    filteredConversations.length === 0
      ? emptyConversations
        ? "まだメッセージはありません"
        : "見つかりませんでした"
      : undefined;

  return (
    <div className="flex h-full overflow-hidden rounded-none lg:rounded-xl lg:border lg:border-border/40">
      <div
        className={cn(
          "h-full w-full shrink-0 border-r border-border/30 bg-background lg:block lg:w-[340px]",
          showChat ? "hidden lg:block" : "block"
        )}
      >
        <ConversationList
          conversations={filteredConversations}
          activeId={activeId}
          onSelect={handleSelect}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          emptyMessage={emptyMessage}
        />
      </div>

      <div
        className={cn(
          "h-full flex-1 bg-[#070707]",
          showChat ? "block" : "hidden lg:block"
        )}
      >
        {otherUser ? (
          messagesLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground/50">
              <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
              <p className="text-sm font-medium">読み込み中...</p>
            </div>
          ) : (
            <ChatRoom
              user={otherUser}
              messages={messages}
              onBack={handleBack}
              onSend={handleSendMessage}
            />
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground/30">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50">
              <MessageCircle className="h-10 w-10" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-muted-foreground/50">
                {conversations.length === 0 ? "まだメッセージはありません" : "メッセージを選択"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/30">
                {conversations.length === 0
                  ? "新しい会話を始めるとここに表示されます"
                  : "左のリストから会話を選んでください"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
