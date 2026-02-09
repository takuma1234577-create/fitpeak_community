"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { followUser, unfollowUser } from "@/actions/follow";

export function useFollow(
  profileUserId: string | null,
  myUserId: string | null,
  options?: { onSuccess?: () => void }
) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkDone, setCheckDone] = useState(false);
  const onSuccess = options?.onSuccess;

  const check = useCallback(async () => {
    if (!profileUserId || !myUserId || profileUserId === myUserId) {
      setCheckDone(true);
      return;
    }
    const supabase = createClient();
    const { data } = await (supabase as any)
      .from("follows")
      .select("follower_id")
      .eq("follower_id", myUserId)
      .eq("following_id", profileUserId)
      .maybeSingle();
    setIsFollowing(!!data);
    setCheckDone(true);
  }, [profileUserId, myUserId]);

  useEffect(() => {
    check();
  }, [check]);

  const toggle = useCallback(async () => {
    if (!profileUserId || !myUserId || profileUserId === myUserId) return;
    setLoading(true);
    try {
      if (isFollowing) {
        const res = await unfollowUser(profileUserId);
        if (res.error) {
          console.error("unfollow:", res.error);
          return;
        }
        setIsFollowing(false);
      } else {
        const res = await followUser(profileUserId);
        if (res.error) {
          console.error("follow:", res.error);
          return;
        }
        setIsFollowing(true);
      }
      onSuccess?.();
    } catch (e) {
      console.error("follow toggle:", e);
    } finally {
      setLoading(false);
    }
  }, [profileUserId, myUserId, isFollowing, onSuccess]);

  return { isFollowing, toggle, loading, checkDone, refetch: check };
}
