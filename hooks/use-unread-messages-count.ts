"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

/** 未読メッセージ数（他ユーザーからのメッセージのうち、last_read_at より新しいもの）を取得。フォーカス・タブ表示・pathname 変更時に再取得する。 */
export function useUnreadMessagesCount(_pathname?: string): number {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCount(0);
        return;
      }
      const { data: parts } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", user.id);
      const partList = Array.isArray(parts) ? parts : [];
      const convIds = partList.map((p: { conversation_id: string }) => p.conversation_id);
      if (convIds.length === 0) {
        setCount(0);
        return;
      }
      const lastReadByConv = new Map<string, string>(
        partList.map((p: { conversation_id: string; last_read_at: string | null }) => [
          p.conversation_id,
          p.last_read_at || "1970-01-01T00:00:00.000Z",
        ])
      );
      const { data: messages } = await (supabase as any)
        .from("messages")
        .select("conversation_id, created_at, sender_id")
        .in("conversation_id", convIds)
        .neq("sender_id", user.id);
      const msgList = Array.isArray(messages) ? messages : [];
      let total = 0;
      for (const m of msgList as { conversation_id: string; created_at: string; sender_id: string }[]) {
        const lastRead = lastReadByConv.get(m.conversation_id) ?? "1970-01-01T00:00:00.000Z";
        if (new Date(m.created_at) > new Date(lastRead)) total += 1;
      }
      setCount(total);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount, _pathname]);

  useEffect(() => {
    const onFocus = () => fetchCount();
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchCount();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchCount]);

  return count;
}
