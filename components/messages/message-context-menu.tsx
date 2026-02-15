"use client";

import { useEffect, useRef } from "react";
import { Copy, Trash2, Reply } from "lucide-react";
import { cn } from "@/lib/utils";

export type MessageContextMenuProps = {
  x: number;
  y: number;
  isOwnMessage: boolean;
  onCopy: () => void;
  onDelete?: () => void;
  onReply: () => void;
  onClose: () => void;
  className?: string;
};

export default function MessageContextMenu({
  x,
  y,
  isOwnMessage,
  onCopy,
  onDelete,
  onReply,
  onClose,
  className,
}: MessageContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleTouchOutside = (e: TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleScroll = () => onClose();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // 次のtickでリスナー登録（自分自身のクリックで即閉じないように）
    const t = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleTouchOutside, { passive: true });
      window.addEventListener("scroll", handleScroll, true);
      document.addEventListener("keydown", handleEscape);
    }, 0);

    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleTouchOutside);
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // 画面端に寄せない
  const safeX = Math.max(8, Math.min(x, typeof window !== "undefined" ? window.innerWidth - 180 : x));
  const safeY = Math.max(8, Math.min(y, typeof window !== "undefined" ? window.innerHeight - 140 : y));

  return (
    <div
      ref={ref}
      className={cn(
        "fixed z-[100] flex flex-col rounded-xl border border-border/60 bg-card py-1 shadow-lg",
        className
      )}
      style={{ left: safeX, top: safeY, minWidth: 140 }}
    >
      <button
        type="button"
        onClick={() => {
          onCopy();
          onClose();
        }}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary"
      >
        <Copy className="h-4 w-4 shrink-0" />
        コピー
      </button>
      {isOwnMessage && onDelete != null && (
        <button
          type="button"
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 shrink-0" />
          削除
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          onReply();
          onClose();
        }}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary"
      >
        <Reply className="h-4 w-4 shrink-0" />
        返信
      </button>
    </div>
  );
}
