import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createAdminClient } from "@/utils/supabase/admin";

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

  if (errorFromLine) {
    return NextResponse.redirect(loginUrl("line_login_failed"));
  }

  if (!code || !state) {
    return NextResponse.redirect(loginUrl("line_login_failed"));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE_NAME)?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(loginUrl("line_login_failed"));
  }

  // state 使用済みなので Cookie を削除
  cookieStore.delete(STATE_COOKIE_NAME);

  const channelId = process.env.LINE_CHANNEL_ID;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!channelId || !channelSecret || !appUrl) {
    return NextResponse.redirect(loginUrl("line_login_failed"));
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
    return NextResponse.redirect(loginUrl("line_login_failed"));
  }

  if (!tokenRes.ok) {
    return NextResponse.redirect(loginUrl("line_login_failed"));
  }

  type LineTokenResponse = { id_token?: string };
  const tokenData = (await tokenRes.json()) as LineTokenResponse;
  const idToken = tokenData.id_token;

  if (!idToken) {
    return NextResponse.redirect(loginUrl("line_login_failed"));
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
    return NextResponse.redirect(loginUrl("line_login_failed"));
  }

  const email = payload.email?.trim();
  const lineUserId = payload.sub;

  if (!email) {
    return NextResponse.redirect(loginUrl("line_email_required"));
  }

  // 3. Supabase Admin でユーザーを確保し、マジックリンクでログイン
  const admin = createAdminClient();

  const { data: existingList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existingUser = existingList?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

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
      return NextResponse.redirect(loginUrl("line_login_failed"));
    }
  }

  // 4. マジックリンク発行してその URL へリダイレクト
  const nextPath = cookieStore.get(LINE_AUTH_NEXT_COOKIE)?.value;
  const baseUrl = appUrl.replace(/\/$/, "");
  const redirectTo =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? `${baseUrl}${nextPath}`
      : `${baseUrl}/dashboard`;
  if (nextPath) {
    cookieStore.delete(LINE_AUTH_NEXT_COOKIE);
  }
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.redirect(loginUrl("line_login_failed"));
  }

  const actionLink = linkData.properties.action_link;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const magicLinkUrl = actionLink.startsWith("http")
    ? actionLink
    : `${supabaseUrl}/${actionLink.replace(/^\//, "")}`;

  return NextResponse.redirect(magicLinkUrl);
}
