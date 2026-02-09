"use client";

import { Search, SquarePen } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  /** 会話が0件 or 検索0件時に表示するメッセージ */
  emptyMessage?: string;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  searchQuery,
  onSearchChange,
  emptyMessage,
}: ConversationListProps) {
  const filtered = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
        <h2 className="text-lg font-black tracking-wide text-foreground">
          Messages
        </h2>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-gold"
          aria-label="新規メッセージ"
        >
          <SquarePen className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 py-3">
        <div className="group relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-gold" />
          <input
            type="text"
            placeholder="ユーザーを検索..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-border/60 bg-[#0a0a0a] pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-300 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((conv) => (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelect(conv.id)}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all duration-200",
              activeId === conv.id
                ? "border-l-2 border-gold bg-gold/[0.08]"
                : "border-l-2 border-transparent hover:bg-secondary/50"
            )}
          >
            <div className="relative shrink-0">
              <Avatar className="h-12 w-12 ring-1 ring-border/60">
                <AvatarImage src={conv.avatar || "/placeholder.svg"} alt={conv.name} />
                <AvatarFallback className="bg-secondary text-sm font-bold">
                  {conv.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {conv.online && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
              )}
            </div>

            <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "truncate text-sm",
                    conv.unread > 0
                      ? "font-extrabold text-foreground"
                      : "font-semibold text-foreground/80"
                  )}
                >
                  {conv.name}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[11px]",
                    conv.unread > 0
                      ? "font-bold text-gold"
                      : "font-medium text-muted-foreground/60"
                  )}
                >
                  {conv.time}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "truncate text-xs",
                    conv.unread > 0
                      ? "font-semibold text-foreground/70"
                      : "font-normal text-muted-foreground/60"
                  )}
                >
                  {conv.lastMessage}
                </p>
                {conv.unread > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-[#050505]">
                    {conv.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
            <Search className="mb-2 h-8 w-8" />
            <p className="text-sm font-medium">{emptyMessage ?? "見つかりませんでした"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
