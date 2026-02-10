"use client";

import { useProfileById } from "@/hooks/use-profile-by-id";
import { useBlockedUserIds } from "@/hooks/use-blocked-ids";
import OtherProfileTop from "@/components/profile/other-profile-top";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function ProfileModal({
  userId,
  open,
  onOpenChange,
}: {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { profile, isLoading } = useProfileById(open ? userId : null);
  const { blockedIds } = useBlockedUserIds();
  const profileUserId = profile?.id ?? userId ?? null;
  const isBlocked = profileUserId ? (blockedIds instanceof Set ? blockedIds : new Set<string>()).has(profileUserId) : false;

  if (!userId) return null;

  const name =
    profile
      ? ((profile as { nickname?: string | null }).nickname ||
          (profile as { username?: string | null }).username ||
          (profile as { name?: string | null }).name) ??
        "名前未設定"
      : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-[min(100vw-2rem,28rem)] overflow-hidden flex flex-col p-0 gap-0 border-border/60 bg-card"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="overflow-y-auto flex-1 min-h-0 pt-10 pr-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
              <p className="mt-3 text-sm text-muted-foreground">読み込み中...</p>
            </div>
          ) : !profile ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              ユーザーが見つかりません
            </div>
          ) : isBlocked ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              このユーザーは表示できません
            </div>
          ) : (
            <OtherProfileTop
              headerUrl={(profile as { header_url?: string | null }).header_url ?? null}
              avatarUrl={profile.avatar_url ?? null}
              name={name}
              onBack={() => onOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
