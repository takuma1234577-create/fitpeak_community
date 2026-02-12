import { createClient } from "@/utils/supabase/client";

const AVATAR_BUCKET = "avatars";
const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

/**
 * グループヘッダー画像を avatars バケットにアップロードし、公開URLを返す。
 * パスは createdByUserId/group-{groupId}-header.jpg とし、RLS（作成者のみアップロード可）を満たす。
 */
export async function uploadGroupHeader(
  createdByUserId: string,
  groupId: string,
  blob: Blob
): Promise<string> {
  if (blob.size > MAX_SIZE_BYTES) {
    throw new Error("ヘッダー画像は3MB以下にしてください。");
  }
  const path = `${createdByUserId}/group-${groupId}-header.jpg`;
  const supabase = createClient();
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, blob, {
    upsert: true,
    contentType: blob.type || "image/jpeg",
  });
  if (error) throw error;
  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  // キャッシュ回避: 同じURLで上書きしてもブラウザが新しい画像を取得するようにクエリを付与
  const separator = publicUrl.includes("?") ? "&" : "?";
  return `${publicUrl}${separator}v=${Date.now()}`;
}
