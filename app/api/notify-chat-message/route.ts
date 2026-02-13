import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  getGroupMessageEmailContent,
  getIndividualMessageEmailContent,
  sendNotificationEmail,
} from "@/lib/email-notifications";
import { sendLinePush } from "@/lib/line-notifications";

type Body = {
  recipient_user_id: string;
  sender_nickname?: string;
  is_group?: boolean;
  group_name?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const {
      recipient_user_id,
      sender_nickname = "誰か",
      is_group = false,
      group_name,
    } = body;

    if (!recipient_user_id) {
      return NextResponse.json(
        { error: "recipient_user_id is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: { user: recipient }, error: authError } = await (supabase as any).auth.admin.getUserById(
      recipient_user_id
    );
    if (authError || !recipient?.email) {
      return NextResponse.json(
        { error: "Recipient not found or has no email" },
        { status: 404 }
      );
    }

    const { subject, text } = is_group
      ? getGroupMessageEmailContent(sender_nickname, group_name ?? "グループ")
      : getIndividualMessageEmailContent(sender_nickname);

    const { error: sendError } = await sendNotificationEmail(recipient.email, subject, text);

    const lineUserId = (recipient as { user_metadata?: { line_user_id?: string } }).user_metadata?.line_user_id;
    if (lineUserId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
      const lineText = is_group
        ? `【FITPEAK】${sender_nickname}さんがグループ「${group_name ?? "グループ"}」でメッセージを送信しました。`
        : `【FITPEAK】${sender_nickname}さんからダイレクトメッセージが届きました。`;
      await sendLinePush(lineUserId, lineText, {
        linkUrl: appUrl ? `${appUrl}/dashboard/messages` : undefined,
      });
    } else {
      console.info("[notify-chat-message] Recipient has no line_user_id (not linked LINE login), skipping LINE push. recipient_user_id:", recipient_user_id);
    }

    if (sendError) {
      console.error("[notify-chat-message] Resend error:", sendError);
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
    console.error("[notify-chat-message]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
