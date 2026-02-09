"use server";

import { createClient } from "@/lib/supabase/server";

export type ReportType = "user" | "recruitment" | "group";

const REPORT_REASONS = [
  { value: "inappropriate", label: "不適切な内容" },
  { value: "spam", label: "スパム" },
  { value: "harassment", label: "攻撃的な言動・嫌がらせ" },
  { value: "fake", label: "虚偽・なりすまし" },
  { value: "other", label: "その他" },
] as const;

export const REPORT_REASON_OPTIONS = REPORT_REASONS;

export async function blockUser(targetUserId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインしてください" };
  if (user.id === targetUserId) return { error: "自分自身をブロックできません" };
  const { error } = await (supabase as any)
    .from("blocks")
    .insert({ blocker_id: user.id, blocked_id: targetUserId });
  return error ? { error: error.message } : {};
}

export async function unblockUser(targetUserId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインしてください" };
  const { error } = await (supabase as any)
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetUserId);
  return error ? { error: error.message } : {};
}

export async function reportContent(
  targetId: string,
  type: ReportType,
  reason: string,
  details?: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインしてください" };
  const { error } = await (supabase as any)
    .from("reports")
    .insert({
      reporter_id: user.id,
      target_id: targetId,
      type,
      reason: reason.trim() || "other",
      details: details?.trim() || null,
    });
  return error ? { error: error.message } : {};
}
