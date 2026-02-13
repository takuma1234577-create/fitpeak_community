import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getFollowEmailContent, sendNotificationEmail } from "@/lib/email-notifications";
import { sendLinePush } from "@/lib/line-notifications";

type Body = {
  /** フォローされた側（通知を受け取る人） */
  following_id: string;
  /** フォローした側のユーザーID（ニックネーム取得用） */
  follower_id: string;
};

export async function POST(request: Request) {
  try {
    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    const { following_id, follower_id } = body;

    if (!following_id || !follower_id) {
      return NextResponse.json(
        { error: "following_id and follower_id are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: { user: followedUser }, error: authError } = await (supabase as any).auth.admin.getUserById(
      following_id
    );
    if (authError || !followedUser?.email) {
      return NextResponse.json(
        { error: "Followed user not found or has no email" },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname, username")
      .eq("id", follower_id)
      .single();
    const followerName =
      (profile as { nickname?: string | null } | null)?.nickname ||
      (profile as { username?: string | null } | null)?.username ||
      "誰か";

    const { subject, text } = getFollowEmailContent(followerName);

    const { error: sendError } = await sendNotificationEmail(
      followedUser.email,
      subject,
      text
    );

    const lineUserId = (followedUser as { user_metadata?: { line_user_id?: string } }).user_metadata?.line_user_id;
    if (lineUserId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
      await sendLinePush(lineUserId, `【FITPEAK】${followerName}さんがあなたをフォローしました。`, {
        linkUrl: appUrl ? `${appUrl}/dashboard/notifications` : undefined,
      });
    }

    if (sendError) {
      console.error("[notify-follow] Resend error:", sendError);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("SUPABASE_SERVICE_ROLE_KEY")
    ) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }
    console.error("[notify-follow]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
