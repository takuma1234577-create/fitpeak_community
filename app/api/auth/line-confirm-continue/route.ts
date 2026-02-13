import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const LINE_CONFIRM_COOKIE = "line_confirm_token";

type Payload = { email: string; url: string; exp: number };

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(LINE_CONFIRM_COOKIE)?.value;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!token || !secret) {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  let payload: Payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: ["HS256"] }) as Payload;
    if (!payload.url) throw new Error("invalid payload");
  } catch {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  const response = NextResponse.redirect(payload.url);
  response.cookies.set(LINE_CONFIRM_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
