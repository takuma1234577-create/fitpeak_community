import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <h1 className="text-2xl font-black text-foreground">404</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        お探しのページが見つかりませんでした。
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-[#050505] transition-colors hover:bg-gold-light"
      >
        ダッシュボードへ戻る
      </Link>
    </div>
  );
}
