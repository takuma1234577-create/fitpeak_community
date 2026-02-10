import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 認証ユーザーがメール確認済みの場合、profiles.email_confirmed を true に更新する。
 * 確認メールリンククリック後やログイン時に呼ぶと、サイトの一覧に「反映」する条件を満たす。
 */
export async function syncEmailConfirmed(
  supabase: SupabaseClient,
  user: User | null
): Promise<void> {
  if (!user?.email_confirmed_at) return;
  const sb = supabase as any;
  await sb
    .from("profiles")
    .update({ email_confirmed: true })
    .eq("id", user.id);
}
