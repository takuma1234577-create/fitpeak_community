import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecruitmentPost, RecruitmentRow, PendingParticipant } from "./types";
import { safeArray } from "@/lib/utils";

type RecruitmentsRow = {
  id: string;
  title: string | null;
  description: string | null;
  target_body_part: string | null;
  event_date: string;
  location: string | null;
  status: string;
  created_at: string;
  user_id: string;
  profiles: { id?: string; nickname?: string | null; username?: string | null; avatar_url?: string | null } | null;
  tags?: unknown;
};

function toRecruitmentPost(r: RecruitmentsRow): RecruitmentPost {
  const eventDate = r.event_date != null ? String(r.event_date) : "";
  const d = eventDate ? new Date(eventDate) : new Date();
  const dateStr = Number.isNaN(d.getTime()) ? "—" : `${d.getMonth() + 1}/${d.getDate()}`;
  const timeStr = Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) + "~";
  const prof = r.profiles;
  const name = (prof?.nickname ?? prof?.username ?? "ユーザー") as string;
  const tagsRaw = r.tags;
  const tags = Array.isArray(tagsRaw) ? tagsRaw.map((t) => String(t)) : r.target_body_part ? [String(r.target_body_part)] : [];
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    description: r.description != null ? String(r.description) : "",
    date: dateStr,
    time: timeStr,
    location: r.location != null ? String(r.location) : "未設定",
    tags: safeArray(tags),
    user_id: String(r.user_id ?? ""),
    user: { name, title: "", initial: name.charAt(0) || "?", avatar: prof?.avatar_url ?? undefined },
    spots: 1,
    spotsLeft: 1,
    event_date: eventDate,
  };
}

export async function fetchOpenRecruitments(supabase: SupabaseClient): Promise<RecruitmentPost[]> {
  const { data: rows, error } = await (supabase as any)
    .from("recruitments")
    .select("id, title, description, target_body_part, event_date, location, status, created_at, user_id, profiles(id, nickname, username, avatar_url)")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) return [];
  const list = Array.isArray(rows) ? rows : rows != null ? [rows] : [];
  const mapped = list
    .filter((r: unknown) => r != null && typeof r === "object")
    .map((r) => toRecruitmentPost(r as RecruitmentsRow));
  return mapped;
}

export async function fetchMyParticipantStatus(
  supabase: SupabaseClient,
  userId: string,
  recruitmentIds: string[]
): Promise<Record<string, "pending" | "approved" | "rejected" | "withdrawn">> {
  if (recruitmentIds.length === 0) return {};
  const { data: parts } = await (supabase as any)
    .from("recruitment_participants")
    .select("recruitment_id, status")
    .eq("user_id", userId)
    .in("recruitment_id", recruitmentIds);
  const arr = safeArray<{ recruitment_id: string; status: string }>(parts);
  const statusMap: Record<string, "pending" | "approved" | "rejected" | "withdrawn"> = {};
  arr.forEach((p) => {
    if (["pending", "approved", "rejected", "withdrawn"].includes(p.status)) {
      statusMap[p.recruitment_id] = p.status as "pending" | "approved" | "rejected" | "withdrawn";
    }
  });
  return statusMap;
}

export async function applyToRecruitment(
  supabase: SupabaseClient,
  recruitmentId: string,
  userId: string,
  applicantName: string,
  postUserId: string
): Promise<{ error: string | null }> {
  const { error } = await (supabase as any)
    .from("recruitment_participants")
    .insert({ recruitment_id: recruitmentId, user_id: userId, status: "pending" });
  if (error) return { error: error.message ?? "申請に失敗しました" };
  try {
    await (supabase as any).from("notifications").insert({
      user_id: postUserId,
      sender_id: userId,
      type: "apply",
      content: `${applicantName}さんから応募がありました`,
      link: `/dashboard/recruit/manage?r=${recruitmentId}`,
    });
  } catch {
    // ignore notification error
  }
  return { error: null };
}

export async function withdrawFromRecruitment(
  supabase: SupabaseClient,
  recruitmentId: string,
  userId: string,
  myName: string,
  ownerUserId: string
): Promise<void> {
  const { data: recruitment } = await (supabase as any)
    .from("recruitments")
    .select("chat_room_id, user_id")
    .eq("id", recruitmentId)
    .single();
  await (supabase as any)
    .from("recruitment_participants")
    .update({ status: "withdrawn", updated_at: new Date().toISOString() })
    .eq("recruitment_id", recruitmentId)
    .eq("user_id", userId);
  if (recruitment?.chat_room_id) {
    await (supabase as any)
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", recruitment.chat_room_id)
      .eq("user_id", userId);
  }
  try {
    await (supabase as any).from("notifications").insert({
      user_id: ownerUserId ?? recruitment?.user_id,
      sender_id: userId,
      type: "cancel",
      content: `${myName}さんが参加を辞退しました`,
      link: `/dashboard/recruit/manage?r=${recruitmentId}`,
    });
  } catch {
    // ignore
  }
}

export async function fetchMyRecruitments(supabase: SupabaseClient, userId: string): Promise<RecruitmentRow[]> {
  const { data, error } = await (supabase as any)
    .from("recruitments")
    .select("id, title, description, target_body_part, event_date, location, status, created_at, chat_room_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return Array.isArray(data) ? (data as RecruitmentRow[]) : [];
}

export async function fetchPendingByRecruitment(
  supabase: SupabaseClient,
  recruitmentIds: string[]
): Promise<Record<string, PendingParticipant[]>> {
  if (recruitmentIds.length === 0) return {};
  const { data: pending } = await (supabase as any)
    .from("recruitment_participants")
    .select("recruitment_id, user_id, status, profiles(nickname, username, avatar_url)")
    .in("recruitment_id", recruitmentIds)
    .eq("status", "pending");
  const list = Array.isArray(pending) ? pending : pending != null ? [pending] : [];
  const byRec: Record<string, PendingParticipant[]> = {};
  recruitmentIds.forEach((id) => (byRec[id] = []));
  list.forEach((p: PendingParticipant) => {
    if (!byRec[p.recruitment_id]) byRec[p.recruitment_id] = [];
    byRec[p.recruitment_id].push(p);
  });
  return byRec;
}

export async function createRecruitment(
  supabase: SupabaseClient,
  payload: {
    user_id: string;
    title: string;
    description: string | null;
    target_body_part: string | null;
    event_date: string;
    location: string | null;
    status: string;
    chat_room_id: string;
  }
): Promise<{ error: string | null }> {
  const { error } = await (supabase as any).from("recruitments").insert(payload);
  return { error: error?.message ?? null };
}

export async function updateRecruitment(
  supabase: SupabaseClient,
  id: string,
  payload: Partial<{
    title: string;
    description: string | null;
    target_body_part: string | null;
    event_date: string;
    location: string | null;
  }>
): Promise<{ error: string | null }> {
  const { error } = await (supabase as any).from("recruitments").update(payload).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteRecruitment(
  supabase: SupabaseClient,
  id: string,
  title: string,
  notifyUserIds: string[],
  senderId: string | null
): Promise<void> {
  for (const uid of notifyUserIds) {
    if (uid === senderId) continue;
    try {
      await (supabase as any).from("notifications").insert({
        user_id: uid,
        sender_id: senderId,
        type: "cancel",
        content: `「${title}」の募集が中止されました`,
        link: "/dashboard/recruit",
      });
    } catch {
      // ignore
    }
  }
  await (supabase as any).from("recruitments").delete().eq("id", id);
}

export async function approveParticipant(
  supabase: SupabaseClient,
  recruitmentId: string,
  participantUserId: string,
  chatRoomId: string | null,
  recruitmentTitle: string,
  senderId: string | null
): Promise<void> {
  await (supabase as any)
    .from("recruitment_participants")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("recruitment_id", recruitmentId)
    .eq("user_id", participantUserId);
  if (chatRoomId) {
    await (supabase as any)
      .from("conversation_participants")
      .upsert({ conversation_id: chatRoomId, user_id: participantUserId }, { onConflict: "conversation_id,user_id" });
  }
  try {
    await (supabase as any).from("notifications").insert({
      user_id: participantUserId,
      sender_id: senderId,
      type: "approve",
      content: `「${recruitmentTitle}」への参加が承認されました`,
      link: chatRoomId ? `/dashboard/messages/${chatRoomId}` : "/dashboard/recruit",
    });
  } catch {
    // ignore
  }
}

export async function rejectParticipant(
  supabase: SupabaseClient,
  recruitmentId: string,
  participantUserId: string
): Promise<void> {
  await (supabase as any)
    .from("recruitment_participants")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("recruitment_id", recruitmentId)
    .eq("user_id", participantUserId);
}
