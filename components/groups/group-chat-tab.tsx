"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Send, ImagePlus, MessageCircle, Loader2, Dumbbell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { cn, safeArray } from "@/lib/utils";
import { ensureArray } from "@/lib/data-sanitizer";
import MessageContextMenu from "@/components/messages/message-context-menu";

type MessageRow = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
};

interface GroupChatTabProps {
  conversationId: string;
  groupName: string;
  myUserId: string;
  onEnsureParticipant?: () => Promise<void>;
  /** true のときメッセージ画面でフル表示（高さを親に合わせる） */
  fullHeight?: boolean;
  /** 変更時にメッセージを再取得（招待送信後など） */
  refreshTrigger?: number;
}

export default function GroupChatTab({
  conversationId,
  groupName,
  myUserId,
  onEnsureParticipant,
  fullHeight = false,
  refreshTrigger = 0,
}: GroupChatTabProps) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msg: MessageRow } | null>(null);
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null);
  const pendingLongPressRef = useRef<{ timer: ReturnType<typeof setTimeout>; msg: MessageRow } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function getCopyableText(msg: MessageRow): string {
    try {
      const j = JSON.parse(msg.content) as { type?: string; text?: string };
      if (j.text) return j.text;
    } catch {
      /* not JSON */
    }
    return msg.content;
  }

  const handleCopyMessage = useCallback((msg: MessageRow) => {
    navigator.clipboard?.writeText(getCopyableText(msg)).catch(() => {});
  }, []);

  const handleDeleteMessage = useCallback(async (msg: MessageRow) => {
    if (msg.sender_id !== myUserId) return;
    try {
      const supabase = createClient();
      await (supabase as any).from("messages").delete().eq("id", msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch (e) {
      console.error("delete message:", e);
    }
  }, [myUserId]);

  const handleReplyToMessage = useCallback((msg: MessageRow) => {
    setReplyTo(msg);
  }, []);

  const loadMessages = useCallback(async () => {
    const supabase = createClient();
    const { data: msgData, error } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("group chat messages:", error);
      setMessages([]);
      setLoading(false);
      return;
    }
    const rawList = ensureArray(msgData) as unknown as { id: string; sender_id: string; content: string; created_at: string }[];
    const list = Array.isArray(rawList) ? rawList : [];
    const senderIds = [...new Set(list.map((m) => m.sender_id))];
    let nameMap: Record<string, { name: string; avatar: string | null }> = {};
    if (senderIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nickname, username, avatar_url")
        .in("id", senderIds);
      nameMap = ensureArray(profs).reduce(
        (acc, p) => {
          const id = (p as { id: string }).id;
          acc[id] = {
            name: ((p as { nickname: string | null }).nickname || (p as { username: string | null }).username) || "ユーザー",
            avatar: (p as { avatar_url: string | null }).avatar_url ?? null,
          };
          return acc;
        },
        {} as Record<string, { name: string; avatar: string | null }>
      );
    }
    const rows: MessageRow[] = list.map((m) => ({
      id: m.id,
      sender_id: m.sender_id,
      content: m.content,
      created_at: m.created_at,
      sender_name: nameMap[m.sender_id]?.name ?? "ユーザー",
      sender_avatar: nameMap[m.sender_id]?.avatar ?? null,
    }));
    setMessages(rows);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    onEnsureParticipant?.();
    loadMessages();
  }, [conversationId, loadMessages, onEnsureParticipant, refreshTrigger]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setReplyTo(null);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error } = await (supabase as any)
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: myUserId,
        content: text,
      })
      .select("id, sender_id, content, created_at")
      .single();
    if (error) {
      console.error("send group message:", error);
      return;
    }
    const insertedRow = inserted as { id: string; sender_id: string; content: string; created_at: string } | null;
    if (!insertedRow) return;
    const { data: prof } = await supabase
      .from("profiles")
      .select("nickname, username, avatar_url")
      .eq("id", myUserId)
      .single();
    const profRow = prof as { nickname: string | null; username: string | null; avatar_url: string | null } | null;
    const name = profRow?.nickname || profRow?.username || "自分";
    setMessages((prev) => [
      ...prev,
      {
        id: insertedRow.id,
        sender_id: insertedRow.sender_id,
        content: insertedRow.content,
        created_at: insertedRow.created_at,
        sender_name: name,
        sender_avatar: profRow?.avatar_url ?? null,
      },
    ]);

    // 参加者へ通知＋メール（自分以外）
    const { data: participants } = await (supabase as any)
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId);
    const participantIds = ensureArray(participants) as unknown as { user_id: string }[];
    const recipientIds = participantIds.map((p) => p.user_id).filter((uid) => uid !== myUserId);
    for (const uid of recipientIds) {
      await (supabase as any).from("notifications").insert({
        user_id: uid,
        sender_id: myUserId,
        type: "message",
        content: `${name}さんが「${groupName}」でメッセージを送信しました`,
        link: `/dashboard/messages/${conversationId}`,
      });
      try {
        await fetch("/api/notify-chat-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient_user_id: uid,
            sender_nickname: name,
            is_group: true,
            group_name: groupName,
          }),
        });
      } catch {
        // メール送信は省略可
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
        <p className="mt-2 text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-background",
        fullHeight
          ? "min-h-0 flex-1 rounded-none border-0"
          : "min-h-[400px] max-h-[60vh] rounded-xl border border-border/40"
      )}
    >
      {!fullHeight && (
        <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
          <MessageCircle className="h-5 w-5 text-gold" />
          <span className="text-sm font-bold text-foreground">{groupName} チャット</span>
        </div>
      )}

      <div
        ref={scrollRef}
        className={cn(
          "flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4",
          fullHeight ? "min-h-0" : "min-h-[240px]"
        )}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
            <MessageCircle className="h-10 w-10 mb-2" />
            <p className="text-sm">まだメッセージはありません</p>
            <p className="text-xs mt-1">最初のメッセージを送ってみましょう</p>
          </div>
        ) : (
          safeArray(messages).map((msg) => {
            const isMe = msg.sender_id === myUserId;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end gap-2",
                  isMe ? "justify-end" : "justify-start"
                )}
              >
                {!isMe && (
                  <Avatar className="h-7 w-7 shrink-0 ring-1 ring-border/40">
                    <AvatarImage src={msg.sender_avatar ?? undefined} alt={msg.sender_name} />
                    <AvatarFallback className="text-[10px]">{msg.sender_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("flex flex-col gap-0.5", isMe && "items-end")}>
                  {!isMe && (
                    <span className="text-[10px] font-semibold text-muted-foreground/80">
                      {msg.sender_name}
                    </span>
                  )}
                  <div
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "relative max-w-[280px] cursor-context-menu rounded-2xl px-4 py-2.5 text-sm leading-relaxed select-text sm:max-w-[360px]",
                      isMe
                        ? "rounded-br-md bg-gold font-medium text-[#050505]"
                        : "rounded-bl-md bg-secondary text-foreground"
                    )}
                    onTouchStart={(e) => {
                      const t = e.touches[0];
                      if (!t) return;
                      const timer = setTimeout(() => {
                        setContextMenu({ x: t.clientX, y: t.clientY, msg });
                        pendingLongPressRef.current = null;
                      }, 400);
                      pendingLongPressRef.current = { timer, msg };
                    }}
                    onTouchEnd={() => {
                      if (pendingLongPressRef.current) {
                        clearTimeout(pendingLongPressRef.current.timer);
                        pendingLongPressRef.current = null;
                      }
                    }}
                    onTouchMove={() => {
                      if (pendingLongPressRef.current) {
                        clearTimeout(pendingLongPressRef.current.timer);
                        pendingLongPressRef.current = null;
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, msg });
                    }}
                  >
                    {(() => {
                      try {
                        const j = JSON.parse(msg.content) as {
                          type?: string;
                          recruitmentId?: string;
                          title?: string;
                          text?: string;
                          groupId?: string;
                          groupName?: string;
                          groupUrl?: string;
                        };
                        if (j.type === "group_invite" && j.groupId) {
                          return (
                            <div className="space-y-2">
                              <Link
                                href={j.groupUrl ?? `/dashboard/groups/${j.groupId}`}
                                className="block rounded-lg border border-border/60 bg-background/80 p-2.5 transition-colors hover:border-gold/40"
                              >
                                <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                                  <MessageCircle className="h-4 w-4 shrink-0" />
                                  {j.groupName ?? "グループ"}
                                </span>
                                <span className="mt-1 block text-xs text-muted-foreground">グループを見る</span>
                              </Link>
                              <p>{j.text ?? "グループを共有しました"}</p>
                            </div>
                          );
                        }
                        if (j.recruitmentId && j.text) {
                          return (
                            <div className="space-y-2">
                              <Link
                                href={`/dashboard/recruit?r=${j.recruitmentId}`}
                                className="block rounded-lg border border-border/60 bg-background/80 p-2.5 transition-colors hover:border-gold/40"
                              >
                                <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                                  <Dumbbell className="h-4 w-4 shrink-0" />
                                  {j.title ?? "合トレ"}
                                </span>
                                <span className="mt-1 block text-xs text-muted-foreground">募集を見る</span>
                              </Link>
                              <p>{j.text}</p>
                            </div>
                          );
                        }
                      } catch {
                        /* not JSON */
                      }
                      return <>{msg.content}</>;
                    })()}
                  </div>
                  <span className="text-[10px] text-muted-foreground/40">
                    {new Date(msg.created_at).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {contextMenu && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOwnMessage={contextMenu.msg.sender_id === myUserId}
          onCopy={() => handleCopyMessage(contextMenu.msg)}
          onDelete={
            contextMenu.msg.sender_id === myUserId
              ? () => handleDeleteMessage(contextMenu.msg)
              : undefined
          }
          onReply={() => handleReplyToMessage(contextMenu.msg)}
          onClose={() => setContextMenu(null)}
        />
      )}

      <div className="border-t border-border/40 bg-background px-4 py-3">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-border/60 bg-secondary/50 px-3 py-2">
            <span className="line-clamp-1 text-xs text-muted-foreground">
              返信: {replyTo.sender_name} - {getCopyableText(replyTo).slice(0, 30)}
              {(getCopyableText(replyTo).length > 30) && "…"}
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="返信をキャンセル"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-secondary hover:text-gold"
            aria-label="画像を添付"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  if (e.nativeEvent.isComposing) return;
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="メッセージを入力..."
              rows={1}
              className="w-full resize-none rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all duration-300 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
              input.trim()
                ? "bg-gold text-[#050505] shadow-lg shadow-gold/20 hover:bg-gold-light"
                : "bg-secondary text-muted-foreground/40"
            )}
            aria-label="送信"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
