import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../types/supabase";

/**
 * サーバー専用。SUPABASE_SERVICE_ROLE_KEY を使い、RLS をバイパスするクライアント。
 * バケット作成など管理者操作にのみ使用すること。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin の設定がありません。SUPABASE_SERVICE_ROLE_KEY を設定してください。"
    );
  }
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}
