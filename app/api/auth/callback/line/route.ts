import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createAdminClient } from "@/utils/supabase/admin";
import { isProfileCompleted } from "@/lib/profile-completed";

const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const STATE_COOKIE_NAME = "line_oauth_state";
const LINE_AUTH_NEXT_COOKIE = "line_auth_next";

type LineIdTokenPayload = {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  email?: string;
  name?: string;
  picture?: string;
};

function getLoginUrl(request: NextRequest, errorCode: string): string {
  const base = request.nextUrl.origin;
  return `${base}/?error=${errorCode}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorFromLine = searchParams.get("error");

  const loginUrl = (code: string) => getLoginUrl(request, code);

  const cookieStore = await cookies();
  const nextPath = cookieStore.get(LINE_AUTH_NEXT_COOKIE)?.value;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? request.nextUrl.origin;
  const settingsFailUrl =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? `${baseUrl}${nextPath}?error=line_link_failed`
      : loginUrl("line_login_failed");

  if (errorFromLine) {
    return NextResponse.redirect(settingsFailUrl);
  }

  if (!code || !state) {
    return NextResponse.redirect(settingsFailUrl);
  }

  const savedState = cookieStore.get(STATE_COOKIE_NAME)?.value;
  if (!savedState || savedState !== state) {
    const stateFailUrl =
      nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
        ? `${baseUrl}${nextPath}?error=line_link_failed`
        : `${baseUrl}/?error=line_state_mismatch`;
    return NextResponse.redirect(stateFailUrl);
  }

  // state 使用済みなので Cookie を削除
  cookieStore.delete(STATE_COOKIE_NAME);

  const channelId = process.env.LINE_CHANNEL_ID;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!channelId || !channelSecret || !appUrl) {
    return NextResponse.redirect(settingsFailUrl);
  }

  const redirectUri = `${appUrl.replace(/\/$/, "")}/api/auth/callback/line`;

  // 1. 認可コードでトークン取得
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: channelId,
    client_secret: channelSecret,
  });

  let tokenRes: Response;
  try {
    tokenRes = await fetch(LINE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });
  } catch {
    return NextResponse.redirect(settingsFailUrl);
  }

  if (!tokenRes.ok) {
    return NextResponse.redirect(settingsFailUrl);
  }

  type LineTokenResponse = { id_token?: string };
  const tokenData = (await tokenRes.json()) as LineTokenResponse;
  const idToken = tokenData.id_token;

  if (!idToken) {
    return NextResponse.redirect(settingsFailUrl);
  }

  // 2. ID トークンを検証（LINE Web ログインは HS256 + Channel Secret）
  let payload: LineIdTokenPayload;
  try {
    payload = jwt.verify(idToken, channelSecret, {
      algorithms: ["HS256"],
      audience: channelId,
      issuer: "https://access.line.me",
    }) as LineIdTokenPayload;
  } catch {
    return NextResponse.redirect(settingsFailUrl);
  }

  const email = payload.email?.trim();
  const lineUserId = payload.sub;

  if (!email) {
    return NextResponse.redirect(nextPath && nextPath.startsWith("/") ? `${baseUrl}${nextPath}?error=line_email_required` : loginUrl("line_email_required"));
  }

  // 3. Supabase Admin でユーザーを確保し、マジックリンクでログイン
  const admin = createAdminClient();
  const emailLower = email.toLowerCase();

  /** メールで既存ユーザーを検索（複数ページ） */
  async function findUserByEmail(
    maxPages: number
  ): Promise<{ id: string; user_metadata?: Record<string, unknown> } | null> {
    for (let page = 1; page <= maxPages; page++) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: 100,
      });
      if (error || !data?.users?.length) return null;
      const user = data.users.find(
        (u) => u.email?.toLowerCase() === emailLower
      );
      if (user) return { id: user.id, user_metadata: user.user_metadata as Record<string, unknown> | undefined };
      if (data.users.length < 100) break;
    }
    return null;
  }

  let existingUser = await findUserByEmail(10);

  if (existingUser) {
    await admin.auth.admin.updateUserById(existingUser.id, {
      user_metadata: { ...existingUser.user_metadata, line_user_id: lineUserId },
    });
  } else {
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { line_user_id: lineUserId },
    });
    if (createError || !newUser?.user) {
      // 既存登録済みの可能性: もう一度検索して更新
      const found = await findUserByEmail(50);
      if (found) {
        await admin.auth.admin.updateUserById(found.id, {
          user_metadata: { ...found.user_metadata, line_user_id: lineUserId },
        });
      } else {
        console.error("[callback/line] createUser failed:", createError?.message);
        return NextResponse.redirect(settingsFailUrl);
      }
    }
  }

  // ログイン後の遷移先: プロフィール未完了なら必ずオンボーディングへ（nextPath は完了時のみ使用）
  const appBase = appUrl.replace(/\/$/, "");
  const targetUser = await findUserByEmail(1);
  if (!targetUser) {
    if (nextPath) cookieStore.delete(LINE_AUTH_NEXT_COOKIE);
    return NextResponse.redirect(settingsFailUrl);
  }

  // 公式LINE連携した時点で仮ユーザー（profiles）の箱を必ず作成。プロフィール未入力のままオンボーディングへ遷移し、入力後に本登録として表示される。
  const provisionalUsername = email ? email.split("@")[0] : (payload.name ?? "user");
  await (admin as any)
    .from("profiles")
    .upsert(
      { id: targetUser.id, username: provisionalUsername },
      { onConflict: "id", ignoreDuplicates: true }
    );

  // マジックリンク後に /auth/callback で code をセッションに交換してから next へ飛ばす（直接 /onboarding だとセッション未設定で「ログイン情報が取得できませんでした」になる）
  let nextPathAfterAuth: string;
  {
    const { data: profileRow } = await admin
      .from("profiles")
      .select("avatar_url, nickname, username, bio, prefecture, exercises")
      .eq("id", targetUser.id)
      .maybeSingle();
    const completed = isProfileCompleted(profileRow);
    if (completed && nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
      nextPathAfterAuth = nextPath;
    } else if (completed) {
      nextPathAfterAuth = "/dashboard";
    } else {
      nextPathAfterAuth = "/onboarding";
    }
  }
  const redirectTo = `${appBase}/auth/callback?next=${encodeURIComponent(nextPathAfterAuth)}`;
  if (nextPath) {
    cookieStore.delete(LINE_AUTH_NEXT_COOKIE);
  }
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.redirect(settingsFailUrl);
  }

  const actionLink = linkData.properties.action_link;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const magicLinkUrl = actionLink.startsWith("http")
    ? actionLink
    : `${supabaseUrl}/${actionLink.replace(/^\//, "")}`;

  return NextResponse.redirect(magicLinkUrl);
}
