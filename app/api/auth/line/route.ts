import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_SCOPE = "openid email profile";
const STATE_COOKIE_NAME = "line_oauth_state";
const LINE_AUTH_NEXT_COOKIE = "line_auth_next";

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!channelId || !appUrl) {
    return NextResponse.redirect(
      new URL("/?error=line_config_missing", request.url)
    );
  }

  const nextPath = request.nextUrl.searchParams.get("next");
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
  const response = NextResponse.redirect(authUrl);

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  // state を先に設定（signOut の前で確実にセット）
  response.cookies.set(STATE_COOKIE_NAME, state, {
    ...cookieOpts,
    maxAge: 60 * 10, // 10分
  });
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    response.cookies.set(LINE_AUTH_NEXT_COOKIE, nextPath, {
      ...cookieOpts,
      maxAge: 60 * 10,
    });
  }

  // 既存のSupabaseセッションを破棄（state は上で設定済み。signOut が Cookie を上書きしないよう注意）
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, { ...options, path: "/" })
          );
        },
      },
    });
    await supabase.auth.signOut();
  }

  // signOut の setAll のあとでも state を再設定して確実に残す
  response.cookies.set(STATE_COOKIE_NAME, state, {
    ...cookieOpts,
    maxAge: 60 * 10,
  });
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    response.cookies.set(LINE_AUTH_NEXT_COOKIE, nextPath, {
      ...cookieOpts,
      maxAge: 60 * 10,
    });
  }

  return response;
}
