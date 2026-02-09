import { createClient } from "@/utils/supabase/client";

const AVATAR_BUCKET = "avatars";
const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB for header

/** ヘッダー画像を avatars バケットにアップロードし、公開URLを返す */
export async function uploadHeader(userId: string, blob: Blob): Promise<string> {
  if (blob.size > MAX_SIZE_BYTES) {
    throw new Error("ヘッダー画像は3MB以下にしてください。");
  }
  const path = `${userId}/header.jpg`;
  const supabase = createClient();
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, blob, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) throw error;
  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return publicUrl;
}
