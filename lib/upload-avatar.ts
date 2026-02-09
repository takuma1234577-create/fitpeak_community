import { createClient } from "@/utils/supabase/client";

const AVATAR_BUCKET = "avatars";
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** バケットが無い場合に作成する（サービスロールキーが設定されていれば実行） */
async function ensureAvatarBucket(): Promise<void> {
  try {
    const res = await fetch("/api/ensure-avatar-bucket", { method: "POST" });
    if (res.ok) return;
    if (res.status === 503) return; // サービスロール未設定 → アップロードを試し、失敗時はメッセージ表示
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || res.statusText);
  } catch (e) {
    if (e instanceof Error && e.message.includes("SUPABASE_SERVICE_ROLE_KEY")) return;
    throw e;
  }
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("ファイルは2MB以下にしてください。");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("JPG、PNG、WebP形式のみ対応しています。");
  }
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/avatar.${ext}`;
  const supabase = createClient();

  await ensureAvatarBucket();

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true });
  if (error) {
    if (error.message?.toLowerCase().includes("bucket") && error.message?.toLowerCase().includes("not found")) {
      throw new Error(
        "プロフィール写真用の「avatars」バケットがありません。次のどちらかを行ってください。\n\n" +
          "【方法1】.env.local にサービスロールキーを追加する\n" +
          "1. Supabase ダッシュボード → Project Settings → API\n" +
          "2. 「service_role」のキーをコピー\n" +
          "3. .env.local に 1 行追加: SUPABASE_SERVICE_ROLE_KEY=貼り付けたキー\n" +
          "4. 開発サーバーを再起動（npm run dev）\n\n" +
          "【方法2】手動でバケットを作る\n" +
          "1. Supabase ダッシュボード → Storage → New bucket\n" +
          "2. Name に「avatars」、Public をオンにして作成\n" +
          "3. SQL Editor で supabase-storage-policies.sql を実行"
      );
    }
    throw error;
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return publicUrl;
}
