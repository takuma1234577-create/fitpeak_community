"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { safeArray } from "@/lib/utils";
import type { RecruitmentRow, PendingParticipant } from "@/lib/recruit/types";
import {
  fetchMyRecruitments,
  fetchPendingByRecruitment,
  deleteRecruitment as apiDeleteRecruitment,
  approveParticipant as apiApproveParticipant,
  rejectParticipant as apiRejectParticipant,
} from "@/lib/recruit/api";

export function useMyRecruitments() {
  const [list, setList] = useState<RecruitmentRow[]>([]);
  const [pendingByRecruitment, setPendingByRecruitment] = useState<Record<string, PendingParticipant[]>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const listRef = useRef<Record<string, HTMLLIElement | null>>({});

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setList([]);
      setPendingByRecruitment({});
      setLoading(false);
      return;
    }
    const rows = await fetchMyRecruitments(supabase, user.id);
    setList(safeArray(rows));
    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);
      const byRec = await fetchPendingByRecruitment(supabase, ids);
      setPendingByRecruitment(byRec);
    } else {
      setPendingByRecruitment({});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const r = params?.get("r");
    if (r && list.length > 0 && listRef.current[r]) {
      listRef.current[r]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [list]);

  const removeRecruitment = useCallback(async (r: RecruitmentRow) => {
    if (!confirm(`「${r.title}」を募集中止（削除）しますか？参加者に通知が送られます。`)) return;
    setActionLoading(r.id);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: participants } = await (supabase as any)
      .from("recruitment_participants")
      .select("user_id")
      .eq("recruitment_id", r.id)
      .in("status", ["pending", "approved"]);
    const userIds = safeArray<{ user_id: string }>(participants).map((p) => p.user_id);
    await apiDeleteRecruitment(supabase, r.id, r.title, userIds, user?.id ?? null);
    setActionLoading(null);
    refetch();
  }, [refetch]);

  const approveParticipant = useCallback(
    async (
      recruitmentId: string,
      recruitmentTitle: string,
      participantUserId: string,
      chatRoomId: string | null
    ) => {
      setActionLoading(`${recruitmentId}-${participantUserId}`);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await apiApproveParticipant(
        supabase,
        recruitmentId,
        participantUserId,
        chatRoomId,
        recruitmentTitle,
        user?.id ?? null
      );
      setActionLoading(null);
      refetch();
    },
    [refetch]
  );

  const rejectParticipant = useCallback(
    async (recruitmentId: string, participantUserId: string) => {
      setActionLoading(`${recruitmentId}-${participantUserId}`);
      const supabase = createClient();
      await apiRejectParticipant(supabase, recruitmentId, participantUserId);
      setActionLoading(null);
      refetch();
    },
    [refetch]
  );

  return {
    list,
    pendingByRecruitment,
    loading,
    actionLoading,
    listRef,
    refetch,
    removeRecruitment,
    approveParticipant,
    rejectParticipant,
  };
}
