/**
 * LINE Messaging API でプッシュ通知を送る。
 * 通知を受け取るには、ユーザーが公式アカウント（Messaging API チャネル）を友だち追加している必要がある。
 */

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

function getChannelAccessToken(): string | null {
  return process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN ?? null;
}

export function canSendLinePush(): boolean {
  return !!getChannelAccessToken();
}

export type LinePushResult = { error: null } | { error: Error };

/**
 * LINE ユーザーID（line_user_id）にテキストをプッシュ送信する。
 * 友だち追加していない・トークン未設定の場合はエラーにならず { error: null } を返す（送信スキップ）。
 */
export async function sendLinePush(
  lineUserId: string,
  text: string,
  options?: { linkUrl?: string }
): Promise<LinePushResult> {
  const token = getChannelAccessToken();
  if (!token) {
    console.warn("[LINE push] LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is not set. Skipping.");
    return { error: null };
  }
  if (!lineUserId?.trim()) {
    console.warn("[LINE push] lineUserId is empty. Skipping.");
    return { error: null };
  }

  const displayText = options?.linkUrl
    ? `${text}\n\n${options.linkUrl}`
    : text;

  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId.trim(),
        messages: [{ type: "text", text: displayText }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      // 400: 無効な to / 403: 友だちにいない / 401: トークン無効 など
      console.warn("[LINE push] API error. status:", res.status, "body:", body);
      return { error: null };
    }
    return { error: null };
  } catch (e) {
    console.warn("[LINE push] request error:", e);
    return { error: null };
  }
}
