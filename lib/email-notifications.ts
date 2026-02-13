import { Resend } from "resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "FITPEAK <onboarding@resend.dev>";
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function canSendEmail(): boolean {
  return resend !== null;
}

/** 合トレ参加申請が来たとき（募集者へ） */
export function getRecruitmentApplyEmailContent(applicantName: string, recruitmentTitle: string) {
  const subject = "【FITPEAK】合トレに参加申請が届きました";
  const text =
    `${applicantName}さんから「${recruitmentTitle}」への参加申請が届きました。\n\n` +
    "FITPEAK の通知画面、または募集管理ページからご確認のうえ、参加の可否をご返答ください。\n\n" +
    "※ 本メールは FITPEAK から自動送信されています。";
  return { subject, text };
}

/** グループチャットで新着メッセージが来たとき（参加者へ） */
export function getGroupMessageEmailContent(senderName: string, groupName: string) {
  const subject = `【FITPEAK】グループ「${groupName}」で新しいメッセージが届きました`;
  const text =
    `${senderName}さんがグループ「${groupName}」でメッセージを送信しました。\n\n` +
    "FITPEAK のメッセージ一覧からグループチャットを開いてご確認ください。\n\n" +
    "※ 本メールは FITPEAK から自動送信されています。";
  return { subject, text };
}

/** 個人チャットでメッセージが来たとき（相手へ） */
export function getIndividualMessageEmailContent(senderName: string) {
  const subject = `【FITPEAK】${senderName}さんからメッセージが届きました`;
  const text =
    `${senderName}さんからダイレクトメッセージが届きました。\n\n` +
    "FITPEAK のメッセージ一覧からチャットを開いてご確認ください。\n\n" +
    "※ 本メールは FITPEAK から自動送信されています。";
  return { subject, text };
}

/** 誰かからフォローされたとき（フォローされた人へ） */
export function getFollowEmailContent(followerName: string) {
  const subject = `【FITPEAK】${followerName}さんがあなたをフォローしました`;
  const text =
    `${followerName}さんがあなたをフォローしました。\n\n` +
    "FITPEAK でプロフィールをのぞいて、フォロワーとのつながりを深めましょう。\n\n" +
    "※ 本メールは FITPEAK から自動送信されています。";
  return { subject, text };
}

export async function sendNotificationEmail(to: string, subject: string, text: string): Promise<{ error: Error | null }> {
  if (!resend) return { error: null };
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    text,
  });
  return { error: error ? new Error(String(error)) : null };
}
