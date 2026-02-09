"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useBlockedUserIds } from "@/hooks/use-blocked-ids";
import { safeArray } from "@/lib/utils";
import type { RecruitmentPost, SortKey } from "@/lib/recruit/types";
import {
  fetchOpenRecruitments,
  fetchMyParticipantStatus,
} from "@/lib/recruit/api";

export function useRecruitments() {
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("newest");
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myDisplayName, setMyDisplayName] = useState("");
  const [participantStatusByRecruitment, setParticipantStatusByRecruitment] = useState<
    Record<string, "pending" | "approved" | "rejected" | "withdrawn">
  >({});
  const { blockedIds } = useBlockedUserIds();

  const refetch = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setMyUserId(user.id);
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("nickname, username")
        .eq("id", user.id)
        .single();
      setMyDisplayName(profile?.nickname || profile?.username || "ユーザー");
    } else {
      setMyUserId(null);
      setMyDisplayName("");
    }

    const list = await fetchOpenRecruitments(supabase);
    setPosts(safeArray(list));

    if (user && list.length > 0) {
      const ids = list.map((p) => p.id);
      const statusMap = await fetchMyParticipantStatus(supabase, user.id, ids);
      setParticipantStatusByRecruitment(statusMap);
    } else {
      setParticipantStatusByRecruitment({});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const safeBlockedIds = blockedIds instanceof Set ? blockedIds : new Set<string>();
  const filtered = safeArray(posts).filter((p) => !p.user_id || !safeBlockedIds.has(p.user_id));

  const displayPosts: RecruitmentPost[] = (() => {
    if (sort === "newest") return filtered;
    const now = Date.now();
    const sorted = [...filtered].sort((a, b) => {
      const tA = a.event_date ? new Date(a.event_date).getTime() : 0;
      const tB = b.event_date ? new Date(b.event_date).getTime() : 0;
      if (sort === "date_nearest") return Math.abs(tA - now) - Math.abs(tB - now);
      return Math.abs(tB - now) - Math.abs(tA - now);
    });
    return sorted;
  })();

  const setParticipantStatus = useCallback((recruitmentId: string, status: "pending" | "approved" | "rejected" | "withdrawn") => {
    setParticipantStatusByRecruitment((prev) => ({ ...prev, [recruitmentId]: status }));
  }, []);

  return {
    posts: displayPosts,
    loading,
    sort,
    setSort,
    myUserId,
    myDisplayName,
    participantStatusByRecruitment,
    setParticipantStatus,
    refetch,
  };
}
