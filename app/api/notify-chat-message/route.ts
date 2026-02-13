import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  getGroupMessageEmailContent,
  getIndividualMessageEmailContent,
  sendNotificationEmail,
} from "@/lib/email-notifications";

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
