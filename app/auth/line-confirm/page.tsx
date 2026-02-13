import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import Link from "next/link";

const LINE_CONFIRM_COOKIE = "line_confirm_token";

type Payload = { email: string; url: string; exp: number };

export default async function LineConfirmPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(LINE_CONFIRM_COOKIE)?.value;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!token || !secret) {
    redirect("/");
  }

  let payload: Payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: ["HS256"] }) as Payload;
    if (!payload.email || !payload.url) throw new Error("invalid payload");
  } catch {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
        <h1 className="text-lg font-bold text-foreground">ログインの確認</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          以下のメールアドレスでログインします。よろしければ「続ける」を押してください。
        </p>
        <p className="mt-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-foreground">
          {payload.email}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          別のアカウントの場合は「キャンセル」して、正しいLINEアカウントで再度お試しください。
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/api/auth/line-confirm-continue"
            className="flex w-full items-center justify-center rounded-xl bg-[#06C755] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            続ける
          </Link>
          <Link
            href="/"
            className="block w-full rounded-xl border border-border py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            キャンセル
          </Link>
        </div>
      </div>
    </div>
  );
}
