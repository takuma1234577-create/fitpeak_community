import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const AVATAR_BUCKET = "avatars";

/**
 * avatars ストレージバケットがなければ作成する（サービスロールキー必須）。
 * アップロード時の "Bucket not found" 対策。
 */
export async function POST() {
  try {
    const supabase = createAdminClient();
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === AVATAR_BUCKET);
    if (exists) {
      return NextResponse.json({ ok: true, created: false });
    }
    const { error } = await supabase.storage.createBucket(AVATAR_BUCKET, {
      public: true,
      fileSizeLimit: "2MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (error) {
      if (error.message?.includes("already exists") || error.message?.includes("BucketAlreadyExists")) {
        return NextResponse.json({ ok: true, created: false });
      }
      console.error("ensure-avatar-bucket:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, created: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { error: "サーバーにサービスロールキーが設定されていません。" },
        { status: 503 }
      );
    }
    console.error("ensure-avatar-bucket:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
