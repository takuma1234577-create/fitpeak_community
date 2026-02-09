"use client";

import { useState } from "react";
import { MoreHorizontal, Ban, MessageCircleOff, Flag } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReportDialog from "@/components/report-dialog";
import { blockUser, unblockUser } from "@/actions/safety";

type UserActionsMenuProps = {
  targetUserId: string;
  targetName?: string;
  isBlocked: boolean;
  onBlockChange?: () => void;
  className?: string;
};

export default function UserActionsMenu({
  targetUserId,
  targetName,
  isBlocked,
  onBlockChange,
  className,
}: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleBlock = async () => {
    setActionLoading(true);
    await blockUser(targetUserId);
    setActionLoading(false);
    setOpen(false);
    onBlockChange?.();
  };

  const handleUnblock = async () => {
    setActionLoading(true);
    await unblockUser(targetUserId);
    setActionLoading(false);
    setOpen(false);
    onBlockChange?.();
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-colors hover:bg-background/80 ${className ?? ""}`}
            aria-label="メニュー"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="end">
          <div className="py-1">
            {isBlocked ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleUnblock}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary"
              >
                <MessageCircleOff className="h-4 w-4" />
                ブロック解除
              </button>
            ) : (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleBlock}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary"
              >
                <Ban className="h-4 w-4" />
                このユーザーをブロックする
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setReportOpen(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary"
            >
              <Flag className="h-4 w-4" />
              通報する
            </button>
          </div>
        </PopoverContent>
      </Popover>
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetId={targetUserId}
        type="user"
        title={targetName}
      />
    </>
  );
}
