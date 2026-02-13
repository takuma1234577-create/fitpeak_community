import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  getRecruitmentApplyEmailContent,
  sendNotificationEmail,
} from "@/lib/email-notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      creator_id,
      recruitment_title,
      applicant_nickname,
    }: {
      creator_id?: string;
      recruitment_title?: string;
      applicant_nickname?: string;
    } = body;

    if (!creator_id) {
      return NextResponse.json(
        { error: "creator_id is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: { user: creator }, error: authError } = await (supabase as any).auth.admin.getUserById(
      creator_id
    );
    if (authError || !creator?.email) {
      return NextResponse.json(
        { error: "Creator not found or has no email" },
        { status: 404 }
      );
    }

    const applicant = applicant_nickname ?? "誰か";
    const title = recruitment_title ?? "募集";
    const { subject, text } = getRecruitmentApplyEmailContent(applicant, title);

    const { error: sendError } = await sendNotificationEmail(creator.email, subject, text);

    if (sendError) {
      console.error("[notify-recruitment-apply] Resend error:", sendError);
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
    console.error("[notify-recruitment-apply]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
