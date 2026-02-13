import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "../../types/supabase";
import { isProfileCompleted } from "../../lib/profile-completed";

/**
 * ミドルウェア用: リクエストの Cookie を読み、セッション更新後にレスポンスに Cookie を書き戻す。
 * プロフィール未完了のログインユーザーは / および /dashboard から /onboarding へリダイレクトする。
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isTopOrDashboard = pathname === "/" || pathname.startsWith("/dashboard");

  if (user && isTopOrDashboard) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, nickname, username, bio, prefecture, exercises")
      .eq("id", user.id)
      .maybeSingle();
    if (!isProfileCompleted(profile)) {
      const onboardingUrl = new URL("/onboarding", request.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }

  return response;
}
