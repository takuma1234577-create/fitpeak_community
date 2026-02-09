"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

export function useBlockStatus(targetUserId: string | null) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsBlocked(false);
      setLoading(false);
      return;
    }
    const { data } = await (supabase as any)
      .from("blocks")
      .select("blocker_id")
      .eq("blocker_id", user.id)
      .eq("blocked_id", targetUserId)
      .maybeSingle();
    setIsBlocked(!!data);
    setLoading(false);
  }, [targetUserId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { isBlocked, loading, refetch };
}
