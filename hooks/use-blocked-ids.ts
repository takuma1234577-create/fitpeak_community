"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Returns the set of user IDs that should be hidden from the current user:
 * - users I have blocked
 * - users who have blocked me
 */
export function useBlockedUserIds(): { blockedIds: Set<string>; loading: boolean; refetch: () => Promise<void> } {
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBlockedIds(new Set());
        setLoading(false);
        return;
      }
      const { data: asBlocker } = await (supabase as any)
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", user.id);
      const { data: asBlocked } = await (supabase as any)
        .from("blocks")
        .select("blocker_id")
        .eq("blocked_id", user.id);
      const ids = new Set<string>();
      const blockerList = Array.isArray(asBlocker) ? asBlocker : [];
      const blockedList = Array.isArray(asBlocked) ? asBlocked : [];
      blockerList.forEach((r: { blocked_id?: string }) => r.blocked_id && ids.add(r.blocked_id));
      blockedList.forEach((r: { blocker_id?: string }) => r.blocker_id && ids.add(r.blocker_id));
      setBlockedIds(ids);
    } catch (e) {
      console.warn("[useBlockedUserIds] 取得エラー (続行):", e);
      setBlockedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { blockedIds, loading, refetch };
}
