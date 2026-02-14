"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useProfileModal } from "@/contexts/profile-modal-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { followUser, unfollowUser } from "@/actions/follow";
import { Loader2 } from "lucide-react";
import { cn, safeArray } from "@/lib/utils";
import { ensureArray } from "@/lib/data-sanitizer";

export type FollowTab = "followers" | "following";

export interface FollowListItem {
  id: string;
  nickname: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  isFollowing: boolean;
}

interface FollowListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileUserId: string;
  myUserId: string | null;
  initialTab: FollowTab;
  onFollowChange?: () => void;
}

function FollowListProfileButton({
  p,
  displayName,
  onOpenChange,
}: {
  p: FollowListItem;
  displayName: (p: FollowListItem) => string;
  onOpenChange: (open: boolean) => void;
}) {
  const { openProfileModal } = useProfileModal();
  const handleClick = () => {
    openProfileModal(p.id);
    onOpenChange(false);
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex min-w-0 flex-1 items-center gap-3 text-left"
    >
      <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border/60">
        <AvatarImage src={p.avatar_url ?? undefined} alt={displayName(p)} />
        <AvatarFallback className="bg-secondary text-sm font-bold text-foreground">
          {displayName(p).charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">
          {displayName(p)}
        </p>
        {p.bio && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {p.bio}
          </p>
        )}
      </div>
    </button>
  );
}

async function fetchFollowers(profileUserId: string, myUserId: string | null): Promise<FollowListItem[]> {
  const supabase = createClient();
  const { data: rows } = await (supabase as any)
    .from("follows")
    .select("follower_id")
    .eq("following_id", profileUserId);
  const rowsList = ensureArray(rows) as { follower_id: string }[];
  const ids = rowsList.map((r) => r.follower_id);
  if (ids.length === 0) return [];
  const { data: profiles } = await (supabase as any)
    .from("profiles")
    .select("id, nickname, username, avatar_url, bio")
    .in("id", ids);
  const list = ensureArray(profiles) as unknown as { id: string; nickname: string | null; username: string | null; avatar_url: string | null; bio: string | null }[];
  if (!myUserId) return safeArray(list).map((p) => ({ ...p, isFollowing: false }));
  const { data: myFollows } = await (supabase as any)
    .from("follows")
    .select("following_id")
    .eq("follower_id", myUserId)
    .in("following_id", ids);
  const myFollowsList = ensureArray(myFollows) as { following_id: string }[];
  const followingSet = new Set(myFollowsList.map((r) => r.following_id));
  return safeArray(list).map((p) => ({ ...p, isFollowing: followingSet.has(p.id) }));
}

async function fetchFollowing(profileUserId: string, myUserId: string | null): Promise<FollowListItem[]> {
  const supabase = createClient();
  const { data: rows } = await (supabase as any)
    .from("follows")
    .select("following_id")
    .eq("follower_id", profileUserId);
  const rowsList = ensureArray(rows) as { following_id: string }[];
  const ids = rowsList.map((r) => r.following_id);
  if (ids.length === 0) return [];
  const { data: profiles } = await (supabase as any)
    .from("profiles")
    .select("id, nickname, username, avatar_url, bio")
    .in("id", ids);
  const list = ensureArray(profiles) as unknown as { id: string; nickname: string | null; username: string | null; avatar_url: string | null; bio: string | null }[];
  if (!myUserId) return safeArray(list).map((p) => ({ ...p, isFollowing: false }));
  const { data: myFollows } = await (supabase as any)
    .from("follows")
    .select("following_id")
    .eq("follower_id", myUserId)
    .in("following_id", ids);
  const myFollowsList = ensureArray(myFollows) as { following_id: string }[];
  const followingSet = new Set(myFollowsList.map((r) => r.following_id));
  return safeArray(list).map((p) => ({ ...p, isFollowing: followingSet.has(p.id) }));
}

export default function FollowListModal({
  open,
  onOpenChange,
  profileUserId,
  myUserId,
  initialTab,
  onFollowChange,
}: FollowListModalProps) {
  const [tab, setTab] = useState<FollowTab>(initialTab);
  const [followers, setFollowers] = useState<FollowListItem[]>([]);
  const [following, setFollowing] = useState<FollowListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadFollowers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchFollowers(profileUserId, myUserId);
      setFollowers(list);
    } finally {
      setLoading(false);
    }
  }, [profileUserId, myUserId]);

  const loadFollowing = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchFollowing(profileUserId, myUserId);
      setFollowing(list);
    } finally {
      setLoading(false);
    }
  }, [profileUserId, myUserId]);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    if (initialTab === "followers") loadFollowers();
    else loadFollowing();
  }, [open, initialTab, loadFollowers, loadFollowing]);

  const handleTabChange = (t: FollowTab) => {
    setTab(t);
    if (t === "followers" && followers.length === 0) loadFollowers();
    if (t === "following" && following.length === 0) loadFollowing();
  };

  const handleToggleFollow = async (userId: string, current: boolean) => {
    if (!myUserId || myUserId === userId) return;
    setTogglingId(userId);
    try {
      if (current) {
        await unfollowUser(userId);
        setFollowers((prev) => (prev || []).map((p) => (p.id === userId ? { ...p, isFollowing: false } : p)));
        setFollowing((prev) => (prev || []).map((p) => (p.id === userId ? { ...p, isFollowing: false } : p)));
      } else {
        await followUser(userId);
        setFollowers((prev) => (prev || []).map((p) => (p.id === userId ? { ...p, isFollowing: true } : p)));
        setFollowing((prev) => (prev || []).map((p) => (p.id === userId ? { ...p, isFollowing: true } : p)));
      }
      onFollowChange?.();
    } finally {
      setTogglingId(null);
    }
  };

  const list: FollowListItem[] = (tab === "followers" ? followers : following) ?? [];
  const displayName = (p: FollowListItem) => p.nickname || p.username || "ユーザー";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] w-full max-w-md overflow-hidden border-border/60 bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-3">
          <DialogTitle className="text-base font-bold text-foreground">
            {tab === "followers" ? "フォロワー" : "フォロー中"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex border-b border-border/40">
          <button
            type="button"
            onClick={() => handleTabChange("followers")}
            className={cn(
              "flex-1 py-3 text-sm font-semibold transition-colors",
              tab === "followers"
                ? "border-b-2 border-gold text-gold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            フォロワー
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("following")}
            className={cn(
              "flex-1 py-3 text-sm font-semibold transition-colors",
              tab === "following"
                ? "border-b-2 border-gold text-gold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            フォロー中
          </button>
        </div>
        <div className="max-h-[60dvh] overflow-y-auto pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : (list?.length ?? 0) === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {tab === "followers" ? "フォロワーはいません" : "フォローしているユーザーはいません"}
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {safeArray(list).map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <FollowListProfileButton
                    p={p}
                    displayName={displayName}
                    onOpenChange={onOpenChange}
                  />
                  {myUserId && myUserId !== p.id && (
                    <button
                      type="button"
                      disabled={togglingId === p.id}
                      onClick={() => handleToggleFollow(p.id, p.isFollowing)}
                      className={cn(
                        "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60",
                        p.isFollowing
                          ? "border-gold/50 bg-gold/10 text-foreground hover:bg-gold/20"
                          : "border-border bg-transparent text-foreground hover:border-gold/30 hover:bg-secondary/80"
                      )}
                    >
                      {togglingId === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : p.isFollowing ? (
                        "解除"
                      ) : (
                        "フォロー"
                      )}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
