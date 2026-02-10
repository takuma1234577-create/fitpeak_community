import { createClient } from "@/utils/supabase/client";
import { safeList } from "@/lib/data-sanitizer";

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
  const myIds = safeList(myConvs as { conversation_id: string }[] | null).map((r) => r.conversation_id);
  if (myIds.length === 0) {
    return await createNewConversation(sb, myUserId, otherUserId);
  }

  const { data: otherInMy } = await sb
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", otherUserId)
    .in("conversation_id", myIds);

  const rows = safeList(otherInMy as { conversation_id: string }[] | null);
  const convId = rows[0]?.conversation_id;
  if (convId) return convId;

  return await createNewConversation(sb, myUserId, otherUserId);
}

async function createNewConversation(
  sb: ReturnType<typeof createClient>,
  myUserId: string,
  otherUserId: string
): Promise<string> {
  // Supabase 型定義が conversations の insert を許可していないため any で実行
  const sbAny = sb as any;
  const { data: conv, error: convErr } = await sbAny
    .from("conversations")
    .insert({})
    .select("id")
    .single();
  if (convErr || !conv?.id) throw new Error(convErr?.message ?? "会話の作成に失敗しました");

  const { error: pErr } = await sbAny.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: myUserId },
    { conversation_id: conv.id, user_id: otherUserId },
  ]);
  if (pErr) throw new Error(pErr.message);
  return conv.id;
}
