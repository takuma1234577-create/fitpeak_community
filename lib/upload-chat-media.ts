import { createClient } from "@/utils/supabase/client";

const BUCKET = "chat-media";

/**
 * チャット用画像/動画を Storage にアップロードし、公開 URL を返す。
 * バケット「chat-media」が存在し、RLS で INSERT が許可されている必要があります。
 */
export async function uploadChatMedia(
  conversationId: string,
  userId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "bin";
  const path = `${conversationId}/${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}

export function getMessageTypeFromFile(file: File): "image" | "video" {
  const type = file.type.toLowerCase();
  if (type.startsWith("video/")) return "video";
  return "image";
}
