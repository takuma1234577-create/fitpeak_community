"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <h2 className="text-lg font-bold text-foreground">問題が発生しました</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        申し訳ありません。エラーが発生しました。
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-[#050505] transition-colors hover:bg-gold-light"
      >
        再試行
      </button>
    </div>
  );
}
