"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  MoreVertical,
  Send,
  ImagePlus,
  UserCircle,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  text: string;
  time: string;
  isMe: boolean;
}

export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  title: string;
  online: boolean;
}

interface ChatRoomProps {
  user: ChatUser;
  messages: Message[];
  onBack: () => void;
  /** メッセージ送信時（Supabase に保存する場合は親で実施） */
  onSend?: (text: string) => void | Promise<void>;
}

export default function ChatRoom({
  user,
  messages: initialMessages,
  onBack,
  onSend: onSendProp,
}: ChatRoomProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    if (onSendProp) {
      onSendProp(text);
      setInput("");
      return;
    }
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      text,
      time: new Date().toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMe: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3.5">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
          aria-label="戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 ring-1 ring-border/60">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback className="bg-secondary text-xs font-bold">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {user.online && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
          )}
        </div>
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-bold text-foreground">{user.name}</span>
          <span className="text-[11px] text-muted-foreground/70">
            {user.online ? (
              <span className="text-emerald-400">オンライン</span>
            ) : (
              user.title
            )}
          </span>
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="プロフィールを見る"
        >
          <UserCircle className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="メニュー"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4"
      >
        <div className="flex items-center justify-center py-3">
          <span className="rounded-full bg-secondary/80 px-3.5 py-1 text-[11px] font-semibold text-muted-foreground/70">
            Today
          </span>
        </div>

        {messages.map((msg, i) => {
          const showAvatar =
            !msg.isMe && (i === 0 || messages[i - 1]?.isMe);
          const isLast =
            i === messages.length - 1 || messages[i + 1]?.isMe !== msg.isMe;

          return (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-2",
                msg.isMe ? "justify-end" : "justify-start",
                isLast ? "mb-3" : "mb-0.5"
              )}
            >
              {!msg.isMe && (
                <div className="w-7 shrink-0">
                  {showAvatar && (
                    <Avatar className="h-7 w-7 ring-1 ring-border/40">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback className="text-[10px]">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}

              <div
                className={cn(
                  "flex items-end gap-1.5",
                  msg.isMe && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "max-w-[280px] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[360px]",
                    msg.isMe
                      ? "rounded-br-md bg-gold font-medium text-[#050505]"
                      : "rounded-bl-md bg-[#2a2a2a] text-foreground"
                  )}
                >
                  {msg.text}
                </div>
                <span className="shrink-0 pb-0.5 text-[10px] text-muted-foreground/40">
                  {msg.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/40 bg-background px-4 py-3">
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
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="メッセージを入力..."
              rows={1}
              className="w-full resize-none rounded-xl border border-border/60 bg-[#0a0a0a] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all duration-300 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
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
