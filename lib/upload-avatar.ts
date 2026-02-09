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
        "プロフィール写真用のストレージが準備されていません。管理者に Supabase で「avatars」バケットの作成を依頼するか、.env.local に SUPABASE_SERVICE_ROLE_KEY を設定してください。"
      );
    }
    throw error;
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return publicUrl;
}
