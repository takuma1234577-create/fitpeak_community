"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

export function useFollow(profileUserId: string | null, myUserId: string | null) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkDone, setCheckDone] = useState(false);

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
      const supabase = createClient();
      const sb = supabase as any;
      if (isFollowing) {
        await sb.from("follows").delete().eq("follower_id", myUserId).eq("following_id", profileUserId);
        setIsFollowing(false);
      } else {
        await sb.from("follows").insert({ follower_id: myUserId, following_id: profileUserId });
        setIsFollowing(true);
      }
    } catch (e) {
      console.error("follow toggle:", e);
    } finally {
      setLoading(false);
    }
  }, [profileUserId, myUserId, isFollowing]);

  return { isFollowing, toggle, loading, checkDone };
}
