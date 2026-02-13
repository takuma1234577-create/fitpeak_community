import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_SCOPE = "openid email profile";
const STATE_COOKIE_NAME = "line_oauth_state";

function generateState(): string {
  const array = new Uint8Array(24);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function GET(request: NextRequest) {
  const channelId = process.env.LINE_CHANNEL_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!channelId || !appUrl) {
    return NextResponse.redirect(
      new URL("/?error=line_config_missing", request.url)
    );
  }

  const state = generateState();
  const redirectUri = `${appUrl.replace(/\/$/, "")}/api/auth/callback/line`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: channelId,
    redirect_uri: redirectUri,
    state,
    scope: LINE_SCOPE,
  });

  const authUrl = `${LINE_AUTH_URL}?${params.toString()}`;
  const cookieStore = await cookies();

  cookieStore.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10分
    path: "/",
  });

  return NextResponse.redirect(authUrl);
}
