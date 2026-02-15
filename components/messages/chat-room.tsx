"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Send,
  ImagePlus,
  Phone,
  MoreHorizontal,
  UserCircle,
  Check,
  CheckCheck,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MessageContextMenu from "@/components/messages/message-context-menu";

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
  onSend?: (text: string) => void | Promise<void>;
  myUserId?: string | null;
  onDeleteMessage?: (msgId: string) => void | Promise<void>;
}

function DateChip({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="rounded-full bg-white/90 px-4 py-1.5 text-[11px] font-semibold text-foreground tracking-wide shadow-sm">
        {label}
      </span>
    </div>
  );
}

export default function ChatRoom({
  user,
  messages,
  onBack,
  onSend: onSendProp,
  myUserId = null,
  onDeleteMessage,
}: ChatRoomProps) {
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msg: Message } | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const pendingLongPressRef = useRef<{ timer: ReturnType<typeof setTimeout>; msg: Message } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    if (onSendProp) {
      onSendProp(text);
      setInput("");
      setReplyTo(null);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      return;
    }
    setInput("");
  };

  const handleCopyMessage = useCallback((msg: Message) => {
    navigator.clipboard?.writeText(msg.text).catch(() => {});
  }, []);

  const handleDeleteMessage = useCallback(
    async (msg: Message) => {
      if (msg.isMe && onDeleteMessage) {
        await onDeleteMessage(msg.id);
      }
    },
    [onDeleteMessage]
  );

  const avatarSrc = user.avatar || "/placeholder.svg";

  return (
    <div className="flex h-full flex-col bg-[#060606]">
      {/* ── Header (V0 style) ── */}
      <header className="relative z-10 flex items-center gap-3 border-b border-border/30 bg-[#0c0c0c]/90 px-3 py-3 backdrop-blur-xl sm:px-5">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground lg:hidden"
          aria-label="戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="relative shrink-0">
          <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-border/40">
            <Image
              src={avatarSrc}
              alt={user.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          {user.online && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-[2.5px] ring-[#0c0c0c]" />
          )}
        </div>

        <div className="flex flex-1 flex-col min-w-0">
          <span className="truncate text-sm font-bold text-foreground leading-tight">
            {user.name}
          </span>
          <span className="text-[11px] leading-tight">
            {user.online ? (
              <span className="text-emerald-400 font-medium">オンライン</span>
            ) : (
              <span className="text-muted-foreground/50">{user.title}</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-secondary/60 hover:text-foreground"
            aria-label="通話"
          >
            <Phone className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-secondary/60 hover:text-foreground"
            aria-label="メニュー"
          >
            <UserCircle className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-secondary/60 hover:text-foreground"
            aria-label="その他"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ── Messages area (V0 style) ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-4 py-2 scrollbar-hide sm:px-6"
      >
        <DateChip label="Today" />

        {messages.map((msg, i) => {
          const prevMsg = messages[i - 1];
          const nextMsg = messages[i + 1];
          const isFirst = !prevMsg || prevMsg.isMe !== msg.isMe;
          const isLast = !nextMsg || nextMsg.isMe !== msg.isMe;

          return (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-2",
                msg.isMe ? "justify-end" : "justify-start",
                isLast ? "mb-3" : "mb-[3px]"
              )}
            >
              {!msg.isMe && (
                <div className="w-7 shrink-0">
                  {isFirst && (
                    <div className="relative h-7 w-7 overflow-hidden rounded-full ring-1 ring-border/30">
                      <Image
                        src={avatarSrc}
                        alt={user.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              )}

              <div className={cn("group flex items-end gap-1.5", msg.isMe && "flex-row-reverse")}>
                <div
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "relative max-w-[75vw] cursor-context-menu px-4 py-2.5 text-[14px] leading-[1.55] select-text sm:max-w-[380px]",
                    msg.isMe
                      ? cn(
                          "bg-gold text-[#050505] font-medium",
                          isFirst && isLast && "rounded-[20px]",
                          isFirst && !isLast && "rounded-[20px] rounded-br-[6px]",
                          !isFirst && !isLast && "rounded-[20px] rounded-r-[6px]",
                          !isFirst && isLast && "rounded-[20px] rounded-tr-[6px]"
                        )
                      : cn(
                          "bg-secondary text-foreground",
                          isFirst && isLast && "rounded-[20px]",
                          isFirst && !isLast && "rounded-[20px] rounded-bl-[6px]",
                          !isFirst && !isLast && "rounded-[20px] rounded-l-[6px]",
                          !isFirst && isLast && "rounded-[20px] rounded-tl-[6px]"
                        )
                  )}
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
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
                  {msg.text}
                </div>

                <div
                  className={cn(
                    "flex shrink-0 items-center gap-0.5 pb-1 transition-opacity duration-200",
                    isLast ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                    {msg.time}
                  </span>
                  {msg.isMe && isLast && <CheckCheck className="h-3 w-3 text-gold/60" />}
                  {msg.isMe && !isLast && <Check className="h-3 w-3 text-muted-foreground/30" />}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom FAB */}
      {showScrollBtn && (
        <div className="absolute bottom-24 right-6 z-20">
          <button
            type="button"
            onClick={scrollToBottom}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-lg ring-1 ring-border/30 transition-all hover:bg-secondary/80 hover:text-foreground"
            aria-label="最新メッセージへ"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}

      {contextMenu && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOwnMessage={contextMenu.msg.isMe}
          onCopy={() => handleCopyMessage(contextMenu.msg)}
          onDelete={
            contextMenu.msg.isMe && onDeleteMessage
              ? () => handleDeleteMessage(contextMenu.msg)
              : undefined
          }
          onReply={() => {
            setReplyTo(contextMenu.msg);
            textareaRef.current?.focus();
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* ── Input area (V0 style) ── */}
      <div className="relative z-10 border-t border-border/20 bg-background/95 px-3 py-2.5 backdrop-blur-xl sm:px-5 sm:py-3">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-border/60 bg-secondary/50 px-3 py-2">
            <span className="line-clamp-1 text-xs text-muted-foreground">
              返信: {replyTo.text.slice(0, 40)}
              {replyTo.text.length > 40 && "…"}
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
          <div className="flex shrink-0 items-center gap-0.5 pb-1">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-secondary/50 hover:text-gold"
              aria-label="画像を添付"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
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
              className="w-full resize-none rounded-[22px] border-0 bg-[#161616] px-5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/35 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gold/25 max-h-[120px]"
              style={{ minHeight: "42px" }}
            />
          </div>

          <div className="shrink-0 pb-0.5">
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
                input.trim()
                  ? "bg-gold text-[#050505] shadow-md shadow-gold/20 hover:bg-gold-light active:scale-95"
                  : "bg-transparent text-muted-foreground/25 cursor-default"
              )}
              aria-label="送信"
            >
              <Send className={cn("h-[18px] w-[18px]", input.trim() && "-translate-x-[1px]")} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
