"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Send,
  Loader2,
  UserCircle,
  MoreHorizontal,
  Check,
  CheckCheck,
  ChevronDown,
  ImagePlus,
  MapPin,
  Dumbbell,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useBlockedUserIds } from "@/hooks/use-blocked-ids";
import { uploadChatMedia, getMessageTypeFromFile } from "@/lib/upload-chat-media";
import { cn } from "@/lib/utils";

type MessageRow = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  message_type: string | null;
};

type OtherUser = {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  home_gym: string | null;
  exercises: string[] | null;
  prefecture: string | null;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function DateChip({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="rounded-full bg-[#1a1a1a] px-4 py-1.5 text-[11px] font-semibold text-muted-foreground/60 tracking-wide shadow-sm">
        {label}
      </span>
    </div>
  );
}

export default function IndividualChatView({
  conversationId: id,
  embedded = false,
}: {
  conversationId: string;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(null);
  const { blockedIds } = useBlockedUserIds();
  const visibleMessages = messages.filter(
    (msg) => msg.sender_id === myUserId || !blockedIds.has(msg.sender_id)
  );

  const fetchConversation = useCallback(async () => {
    if (!id) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/");
      return;
    }
    setMyUserId(user.id);

    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("user_id, last_read_at, profiles(id, nickname, username, avatar_url, bio, home_gym, exercises, prefecture)")
      .eq("conversation_id", id);
    const list = (participants ?? []) as {
      user_id: string;
      last_read_at: string | null;
      profiles: {
        id: string;
        nickname: string | null;
        username: string | null;
        avatar_url: string | null;
        bio: string | null;
        home_gym: string | null;
        exercises: string[] | null;
        prefecture: string | null;
      } | null;
    }[];
    const other = list.find((p) => p.user_id !== user.id);
    if (other?.profiles) {
      const p = other.profiles;
      setOtherUser({
        id: p.id,
        name: p.nickname || p.username || "ユーザー",
        avatar: p.avatar_url,
        bio: p.bio ?? null,
        home_gym: p.home_gym ?? null,
        exercises: p.exercises ?? null,
        prefecture: p.prefecture ?? null,
      });
      setOtherLastReadAt(other.last_read_at ?? null);
    } else {
      setOtherUser({
        id: "",
        name: "ユーザー",
        avatar: null,
        bio: null,
        home_gym: null,
        exercises: null,
        prefecture: null,
      });
      setOtherLastReadAt(null);
    }

    const { data: rows, error } = await (supabase as any)
      .from("messages")
      .select("id, sender_id, content, created_at, message_type")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (!error && Array.isArray(rows)) {
      setMessages((rows as MessageRow[]).map((r) => ({ ...r, message_type: r.message_type ?? "text" })));
    }
    setLoading(false);

    await (supabase as any)
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", id)
      .eq("user_id", user.id);
  }, [id, router]);

  const markAsRead = useCallback(async () => {
    if (!id || !myUserId) return;
    const supabase = createClient();
    await (supabase as any)
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", id)
      .eq("user_id", myUserId);
  }, [id, myUserId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  useEffect(() => {
    if (!id || !myUserId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          const row = payload.new as MessageRow;
          const normalized = { ...row, message_type: row.message_type ?? "text" };
          const isFromOther = normalized.sender_id !== myUserId;
          setMessages((prev) => {
            if (prev.some((m) => m.id === normalized.id)) return prev;
            const isFromMe = normalized.sender_id === myUserId;
            if (isFromMe) {
              const tempIdx = prev.findIndex(
                (m) => String(m.id).startsWith("temp-") && m.content === normalized.content
              );
              if (tempIdx !== -1) {
                const next = [...prev];
                next[tempIdx] = normalized;
                return next;
              }
            }
            return [...prev, normalized];
          });
          if (isFromOther) markAsRead();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, myUserId, markAsRead]);

  useEffect(() => {
    if (!id || !myUserId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`participants:${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversation_participants", filter: `conversation_id=eq.${id}` },
        (payload) => {
          const row = payload.new as { user_id: string; last_read_at: string | null };
          if (row.user_id !== myUserId && row.last_read_at) setOtherLastReadAt(row.last_read_at);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, myUserId]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [visibleMessages, scrollToBottom]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const notifyOtherParticipants = useCallback(
    async (supabase: ReturnType<typeof createClient>) => {
      const { data: participants } = await (supabase as any)
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", id);
      const otherIds = (participants ?? []).map((p: { user_id: string }) => p.user_id).filter((uid: string) => uid !== myUserId);
      for (const uid of otherIds) {
        await (supabase as any).from("notifications").insert({
          user_id: uid,
          sender_id: myUserId,
          type: "message",
          content: "新着メッセージがあります",
          link: `/dashboard/messages/${id}`,
        });
      }
    },
    [id, myUserId]
  );

  const sendText = async () => {
    const text = input.trim();
    if (!text || !myUserId || !id || sending) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic: MessageRow = {
      id: tempId,
      sender_id: myUserId,
      content: text,
      created_at: new Date().toISOString(),
      message_type: "text",
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setSending(true);
    try {
      const supabase = createClient();
      const { data: inserted, error } = await (supabase as any)
        .from("messages")
        .insert({
          conversation_id: id,
          sender_id: myUserId,
          content: text,
          message_type: "text",
        })
        .select("id, sender_id, content, created_at, message_type")
        .single();
      if (error) throw error;
      if (inserted) {
        const row: MessageRow = { ...inserted, message_type: inserted.message_type ?? "text" };
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? row : m))
        );
      }
      await notifyOtherParticipants(supabase);
      setInput("");
    } catch (e) {
      console.error("send message:", e);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const sendMedia = async (file: File) => {
    if (!myUserId || !id || uploading) return;
    setUploading(true);
    try {
      const url = await uploadChatMedia(id, myUserId, file);
      const messageType = getMessageTypeFromFile(file);
      const supabase = createClient();
      const { data: inserted, error } = await (supabase as any)
        .from("messages")
        .insert({
          conversation_id: id,
          sender_id: myUserId,
          content: url,
          message_type: messageType,
        })
        .select("id, sender_id, content, created_at, message_type")
        .single();
      if (error) throw error;
      if (inserted) {
        const row: MessageRow = { ...inserted, message_type: inserted.message_type ?? "text" };
        setMessages((prev) => [...prev, row]);
      }
      await notifyOtherParticipants(supabase);
    } catch (e) {
      console.error("upload/send media:", e);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.toLowerCase();
    if (!type.startsWith("image/") && !type.startsWith("video/")) return;
    sendMedia(file);
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center bg-[#060606]", embedded ? "h-[100dvh]" : "min-h-screen")}>
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  const otherName = otherUser?.name ?? "ユーザー";
  const otherAvatar = otherUser?.avatar ?? "/placeholder.svg";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* 1. ヘッダー (固定) */}
      <header className="flex-none h-14 border-b border-border/30 flex items-center px-4 bg-background/95 backdrop-blur z-10">
        <Link
          href="/dashboard/messages"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground -ml-1"
          aria-label="一覧に戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {otherUser?.id ? (
          <Link
            href={`/profile?u=${otherUser.id}`}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-colors hover:bg-secondary/40 -mx-1 px-1 py-0.5"
            aria-label={`${otherName}のプロフィール`}
          >
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-border/40 sm:h-10 sm:w-10">
              {otherUser?.avatar ? (
                <Image
                  src={otherAvatar}
                  alt={otherName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary text-sm font-bold text-foreground">
                  {otherName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-bold text-foreground">
                {otherName}
              </span>
              {!embedded && (
                <span className="text-[11px] leading-tight text-muted-foreground/50">
                  ダイレクトメッセージ
                </span>
              )}
            </div>
          </Link>
        ) : (
          <>
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-border/40 sm:h-10 sm:w-10">
              {otherUser?.avatar ? (
                <Image
                  src={otherAvatar}
                  alt={otherName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary text-sm font-bold text-foreground">
                  {otherName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-bold text-foreground">
                {otherName}
              </span>
              {!embedded && (
                <span className="text-[11px] leading-tight text-muted-foreground/50">
                  ダイレクトメッセージ
                </span>
              )}
            </div>
          </>
        )}
        {!embedded && (
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={otherUser?.id ? `/profile?u=${otherUser.id}` : "/dashboard/messages"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-secondary/60 hover:text-foreground"
              aria-label="プロフィール"
            >
              <UserCircle className="h-5 w-5" />
            </Link>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-secondary/60 hover:text-foreground"
              aria-label="メニュー"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        )}
      </header>

      {/* 2. メッセージエリア (スクロール領域) */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain p-4 scroll-smooth min-h-0 touch-pan-y scrollbar-hide"
      >
        <DateChip label="Today" />

        {visibleMessages.map((msg, i) => {
          const isMe = msg.sender_id === myUserId;
          const prevMsg = visibleMessages[i - 1];
          const nextMsg = visibleMessages[i + 1];
          const isFirst = !prevMsg || prevMsg.sender_id !== msg.sender_id;
          const isLast = !nextMsg || nextMsg.sender_id !== msg.sender_id;

          return (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-2",
                isMe ? "justify-end" : "justify-start",
                isLast ? "mb-3" : "mb-[3px]"
              )}
            >
              {!isMe && (
                <div className="w-7 shrink-0">
                  {isFirst && (
                    <div className="relative h-7 w-7 overflow-hidden rounded-full ring-1 ring-border/30">
                      {otherUser?.avatar ? (
                        <Image
                          src={otherAvatar}
                          alt={otherName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#1e1e1e] text-[10px] font-bold text-foreground">
                          {otherName.charAt(0)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className={cn("group flex items-end gap-1.5", isMe && "flex-row-reverse")}>
                <div
                  className={cn(
                    "relative max-w-[75vw] px-4 py-2.5 text-[14px] leading-[1.55] sm:max-w-[380px]",
                    isMe
                      ? cn(
                          "bg-gold text-[#050505] font-medium",
                          isFirst && isLast && "rounded-[20px]",
                          isFirst && !isLast && "rounded-[20px] rounded-br-[6px]",
                          !isFirst && !isLast && "rounded-[20px] rounded-r-[6px]",
                          !isFirst && isLast && "rounded-[20px] rounded-tr-[6px]"
                        )
                      : cn(
                          "bg-[#1e1e1e] text-foreground",
                          isFirst && isLast && "rounded-[20px]",
                          isFirst && !isLast && "rounded-[20px] rounded-bl-[6px]",
                          !isFirst && !isLast && "rounded-[20px] rounded-l-[6px]",
                          !isFirst && isLast && "rounded-[20px] rounded-tl-[6px]"
                        )
                  )}
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {msg.message_type === "image" && (
                    <a
                      href={msg.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-lg"
                    >
                      <img
                        src={msg.content}
                        alt=""
                        className="max-h-64 w-full object-cover"
                      />
                    </a>
                  )}
                  {msg.message_type === "video" && (
                    <video
                      src={msg.content}
                      controls
                      className="max-h-64 w-full rounded-lg object-cover"
                    />
                  )}
                  {msg.message_type !== "image" && msg.message_type !== "video" && (
                    <>{msg.content}</>
                  )}
                </div>

                <div
                  className={cn(
                    "flex shrink-0 flex-col items-end gap-0.5 pb-1 transition-opacity duration-200",
                    isLast ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <div className="flex items-center gap-0.5">
                    <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                      {formatTime(msg.created_at)}
                    </span>
                    {isMe && isLast && <CheckCheck className="h-3 w-3 text-gold/60" />}
                    {isMe && !isLast && <Check className="h-3 w-3 text-muted-foreground/30" />}
                  </div>
                  {isMe && otherLastReadAt && new Date(msg.created_at).getTime() <= new Date(otherLastReadAt).getTime() && (
                    <span className="text-xs text-gray-400">既読</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <div className="absolute bottom-20 right-4 z-20 sm:bottom-20 sm:right-6">
          <button
            type="button"
            onClick={scrollToBottom}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e1e1e] text-muted-foreground shadow-lg ring-1 ring-border/30 transition-all hover:bg-[#2a2a2a] hover:text-foreground"
            aria-label="最新メッセージへ"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 3. 入力エリア (下部固定) */}
      <footer className="flex-none border-t border-border/30 bg-background p-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <form
          className="flex gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            sendText();
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={onFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-secondary/50 hover:text-gold disabled:opacity-50"
            aria-label="画像を添付"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText();
              }
            }}
            placeholder="メッセージを入力..."
            rows={1}
            className="flex-1 min-h-[44px] max-h-32 p-2 border border-border rounded-2xl resize-none text-base focus:outline-none focus:ring-1 focus:ring-gold/25 bg-secondary text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-300",
              input.trim() && !sending
                ? "bg-gold text-[#050505] shadow-md shadow-gold/20 hover:bg-gold-light active:scale-95"
                : "bg-transparent text-muted-foreground/25 cursor-default"
            )}
            aria-label="送信"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className={cn("h-5 w-5", input.trim() && "-translate-x-[1px]")} />
            )}
          </button>
        </form>
      </footer>
    </div>
  );
}
