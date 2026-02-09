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
    (asBlocker ?? []).forEach((r: { blocked_id: string }) => ids.add(r.blocked_id));
    (asBlocked ?? []).forEach((r: { blocker_id: string }) => ids.add(r.blocker_id));
    setBlockedIds(ids);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { blockedIds, loading, refetch };
}
