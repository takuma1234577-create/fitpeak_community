"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Send, Paperclip, Loader2, UserCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { uploadChatMedia, getMessageTypeFromFile } from "@/lib/upload-chat-media";
import { cn } from "@/lib/utils";

type MessageRow = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  message_type: string | null;
};

type OtherUser = { id: string; name: string; avatar: string | null };

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export default function MessageChatPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      .select("user_id, profiles(id, nickname, username, avatar_url)")
      .eq("conversation_id", id);
    const list = (participants ?? []) as { user_id: string; profiles: { id: string; nickname: string | null; username: string | null; avatar_url: string | null } | null }[];
    const other = list.find((p) => p.user_id !== user.id);
    if (other?.profiles) {
      const p = other.profiles;
      setOtherUser({
        id: p.id,
        name: p.nickname || p.username || "ユーザー",
        avatar: p.avatar_url,
      });
    } else {
      setOtherUser({ id: "", name: "ユーザー", avatar: null });
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
  }, [id, router]);

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
          setMessages((prev) => [...prev, { ...row, message_type: row.message_type ?? "text" }]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, myUserId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendText = async () => {
    const text = input.trim();
    if (!text || !myUserId || !id || sending) return;
    setSending(true);
    try {
      const supabase = createClient();
      const { error } = await (supabase as any).from("messages").insert({
        conversation_id: id,
        sender_id: myUserId,
        content: text,
        message_type: "text",
      });
      if (error) throw error;
      setInput("");
    } catch (e) {
      console.error("send message:", e);
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
      const { error } = await (supabase as any).from("messages").insert({
        conversation_id: id,
        sender_id: myUserId,
        content: url,
        message_type: messageType,
      });
      if (error) throw error;
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border/40 bg-background px-4 py-3">
        <Link
          href="/dashboard/messages"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="一覧に戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border/60">
          <AvatarImage src={otherUser?.avatar ?? undefined} alt={otherUser?.name} />
          <AvatarFallback className="bg-secondary text-sm font-bold">
            {otherUser?.name?.charAt(0) ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{otherUser?.name ?? "ユーザー"}</p>
        </div>
        <Link
          href={otherUser?.id ? `/profile?u=${otherUser.id}` : "/dashboard/messages"}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="プロフィール"
        >
          <UserCircle className="h-5 w-5" />
        </Link>
      </header>

      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4"
      >
        {messages.map((msg) => {
          const isMe = msg.sender_id === myUserId;
          return (
            <div
              key={msg.id}
              className={cn("flex", isMe ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[280px] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[360px]",
                  isMe
                    ? "rounded-br-md bg-gold text-[#050505]"
                    : "rounded-bl-md bg-[#2a2a2a] text-foreground"
                )}
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
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                )}
                <span className={cn("mt-1 block text-[10px]", isMe ? "text-[#050505]/70" : "text-muted-foreground")}>
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-border/40 bg-background px-4 py-3">
        <div className="flex items-end gap-2">
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-gold disabled:opacity-50"
            aria-label="画像・動画を添付"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
          </button>
          <textarea
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
            className="min-h-[40px] w-full resize-none rounded-xl border border-border/60 bg-[#0a0a0a] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
          />
          <button
            type="button"
            onClick={sendText}
            disabled={!input.trim() || sending}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
              input.trim() && !sending
                ? "bg-gold text-[#050505] hover:bg-gold-light"
                : "bg-secondary text-muted-foreground/40"
            )}
            aria-label="送信"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
