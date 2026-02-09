import { createClient } from "@/utils/supabase/client";

/**
 * 自分と相手の1対1会話を取得。無ければ作成して conversation_id を返す。
 */
export async function getOrCreateConversation(
  myUserId: string,
  otherUserId: string
): Promise<string> {
  if (myUserId === otherUserId) {
    throw new Error("自分自身とは会話できません");
  }
  const supabase = createClient();
  const sb = supabase as any;

  const { data: myConvs } = await sb
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", myUserId);
  const myIds = (myConvs ?? []).map((r: { conversation_id: string }) => r.conversation_id);
  if (myIds.length === 0) {
    return await createNewConversation(sb, myUserId, otherUserId);
  }

  const { data: otherInMy } = await sb
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", otherUserId)
    .in("conversation_id", myIds);

  const rows = (otherInMy ?? []) as { conversation_id: string }[];
  const convId = rows[0]?.conversation_id;
  if (convId) return convId;

  return await createNewConversation(sb, myUserId, otherUserId);
}

async function createNewConversation(
  sb: ReturnType<typeof createClient>,
  myUserId: string,
  otherUserId: string
): Promise<string> {
  const { data: conv, error: convErr } = await sb
    .from("conversations")
    .insert({})
    .select("id")
    .single();
  if (convErr || !conv?.id) throw new Error(convErr?.message ?? "会話の作成に失敗しました");

  const { error: pErr } = await sb.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: myUserId },
    { conversation_id: conv.id, user_id: otherUserId },
  ]);
  if (pErr) throw new Error(pErr.message);
  return conv.id;
}
