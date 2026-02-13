"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

/**
 * マジックリンク（LINEログイン等）で戻ってきたときに、
 * URL の code または token_hash をセッションに交換してから next へリダイレクトする。
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") ?? "magiclink";
    const next = searchParams.get("next") ?? "/dashboard";
    const nextPath = next.startsWith("/") ? next : `/${next}`;

    (async () => {
      const supabase = createClient();

      // PKCE: code でセッション取得
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeError) {
          console.error("[auth/callback] exchangeCodeForSession error:", exchangeError);
          setError("認証の有効期限が切れています。もう一度ログインしてください。");
          return;
        }
        router.replace(nextPath);
        return;
      }

      // token_hash + type で検証（generateLink のリダイレクトで渡される場合がある）
      if (tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "magiclink" | "signup" | "recovery" | "invite" | "email_change" | "email",
        });
        if (cancelled) return;
        if (verifyError) {
          console.error("[auth/callback] verifyOtp error:", verifyError);
          setError("認証の有効期限が切れています。もう一度ログインしてください。");
          return;
        }
        router.replace(nextPath);
        return;
      }

      // 既にセッションがある場合（ハッシュで処理済み等）
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        router.replace(nextPath);
        return;
      }

      setError("認証情報がありません。ログイン画面からやり直してください。");
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-center text-sm text-red-500">{error}</p>
        <a
          href="/"
          className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-semibold text-foreground"
        >
          ログイン画面へ
        </a>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-gold" />
      <p className="text-sm font-semibold text-muted-foreground">ログイン処理中...</p>
    </main>
  );
}
