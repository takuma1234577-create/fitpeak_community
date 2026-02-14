"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { syncEmailConfirmed } from "@/lib/sync-email-confirmed";
import { isProfileCompleted } from "@/lib/profile-completed";

/** プロフィール完了済みか（オンボーディング必須項目が揃っているか） */
async function checkProfileCompleted(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("avatar_url, nickname, username, bio, prefecture, exercises")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return false;
  return isProfileCompleted(data as { avatar_url: string | null; nickname: string | null; username: string | null; bio: string | null; prefecture: string | null; exercises: string[] | null });
}

function GoldInput({
  id,
  type = "text",
  placeholder,
  icon: Icon,
  label,
  value,
  onChange,
  toggleable,
  revealed,
  onToggle,
}: {
  id: string;
  type?: string;
  placeholder: string;
  icon: React.ElementType;
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  toggleable?: boolean;
  revealed?: boolean;
  onToggle?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const resolvedType = toggleable ? (revealed ? "text" : "password") : type;
  return (
    <div className="flex flex-col gap-2.5">
      {label}
      <div className="group relative">
        <Icon
          className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-300 ${
            focused ? "text-gold" : "text-muted-foreground/60"
          }`}
        />
        <input
          id={id}
          type={resolvedType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={`w-full rounded-lg border bg-secondary py-3.5 pl-11 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-300 focus:outline-none ${
            toggleable ? "pr-12" : "pr-4"
          } ${
            focused
              ? "border-gold ring-1 ring-gold/40 shadow-[0_0_24px_rgba(212,175,55,0.18)]"
              : "border-border hover:border-foreground/20"
          }`}
        />
        {toggleable && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-foreground"
            aria-label={revealed ? "パスワードを隠す" : "パスワードを表示"}
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function LineIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5"} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .348-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .349-.281.631-.63.631h-2.386c-.345 0-.627-.282-.627-.631V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596a.626.626 0 0 1-.199.031c-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.627-.631.627-.346 0-.626-.283-.626-.627V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.627-.631.627-.345 0-.627-.283-.627-.627V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.627H4.917c-.345 0-.63-.282-.63-.627V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .346-.281.628-.629.628M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

const LINE_ERROR_MESSAGES: Record<string, string> = {
  line_login_failed: "LINEログインに失敗しました。もう一度お試しください。",
  line_state_mismatch: "LINEの認証が期限切れか無効です。もう一度「LINEでログイン」からやり直してください。",
  line_email_required: "LINEでメールアドレスを取得できませんでした。LINEの設定でメールを公開してください。",
  line_config_missing: "LINEログインの設定がありません。",
};

export default function AuthForm() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err && LINE_ERROR_MESSAGES[err]) {
      setAuthError(LINE_ERROR_MESSAGES[err]);
      setActiveTab("login");
    }
  }, [searchParams]);

  const CONFIRM_EMAIL_MESSAGE = "確認メールを送信しました。メール内のリンクから認証を完了してください。迷惑メールフォルダもご確認ください。";

  const handleResendConfirmation = async () => {
    if (!email.trim() || resendLoading) return;
    setResendLoading(true);
    setAuthError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
      if (error) {
        setAuthError(error.message === "Email rate limit exceeded" ? "送信回数の上限に達しました。しばらく待ってからお試しください。" : error.message);
        return;
      }
      setAuthSuccess("確認メールを再送信しました。届かない場合は迷惑メールフォルダをご確認ください。");
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "再送信に失敗しました");
    } finally {
      setResendLoading(false);
    }
  };

  const handleLoginOrSignup = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    if (activeTab === "login") {
      if (!email.trim() || !password) {
        setAuthError("メールアドレスとパスワードを入力してください");
        return;
      }
      setIsSubmitting(true);
      try {
        const supabase = createClient();
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          setAuthError(error.message === "Invalid login credentials" ? "メールアドレスまたはパスワードが正しくありません" : error.message);
          return;
        }
        if (authData.user) {
          await syncEmailConfirmed(supabase, authData.user);
        }
        const hasProfile = authData.user
          ? await checkProfileCompleted(supabase, authData.user.id)
          : false;
        window.location.href = hasProfile ? "/dashboard" : "/onboarding";
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : "ログインに失敗しました");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    if (activeTab === "signup") {
      if (!email.trim() || !password) {
        setAuthError("メールアドレスとパスワードを入力してください");
        return;
      }
      if (password.length < 6) {
        setAuthError("パスワードは6文字以上で入力してください");
        return;
      }
      setIsSubmitting(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: name.trim() ? { data: { display_name: name.trim() } } : undefined,
        });
        if (error) {
          let message = error.message;
          if (error.message === "User already registered") {
            message = "このメールアドレスは既に登録されています";
          } else if (error.message?.toLowerCase().includes("confirmation email") || error.message === "Error sending confirmation email") {
            message = "確認メールの送信に失敗しました。しばらく経ってから再試行するか、管理者に問い合わせてください。（SMTP設定の確認が必要な場合があります）";
          }
          setAuthError(message);
          return;
        }
        if (data.session && data.user) {
          await syncEmailConfirmed(supabase, data.user);
          const hasProfile = await checkProfileCompleted(supabase, data.user.id);
          window.location.href = hasProfile ? "/dashboard" : "/onboarding";
        } else {
          setAuthSuccess(CONFIRM_EMAIL_MESSAGE);
        }
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : "登録に失敗しました");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const labelClass = "text-xs font-bold tracking-wider uppercase text-muted-foreground";

  return (
    <div className="mx-auto w-full max-w-[440px]">
      <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-xl shadow-black/10 backdrop-blur-sm sm:p-10">
        {/* LINE で新規登録・ログイン（メイン CTA） */}
        <a
          href="/api/auth/line"
          className="group relative mb-6 flex w-full items-center justify-center gap-3 rounded-xl bg-[#06C755] py-4 text-base font-bold text-white shadow-lg shadow-[#06C755]/25 transition-all duration-300 hover:bg-[#05b34a] hover:shadow-xl hover:shadow-[#06C755]/30 active:scale-[0.98]"
        >
          <span className="absolute -top-1.5 right-4 rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#050505]">
            おすすめ
          </span>
          <LineIcon className="h-6 w-6 text-white" />
          <span>LINEで新規登録・ログイン</span>
        </a>
        <p className="mb-8 text-center text-xs text-muted-foreground">
          ワンクリックで簡単スタート。公式LINE連携で新着メッセージの受け取りができます。
        </p>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">またはメールで</span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <div className="mt-6 mb-6 flex gap-1 rounded-lg bg-secondary/80 p-1.5">
          <button
            type="button"
            onClick={() => { setActiveTab("login"); setAuthError(null); setAuthSuccess(null); }}
            className={`flex-1 rounded-md py-3 text-sm font-extrabold uppercase tracking-wider transition-all duration-300 ${
              activeTab === "login" ? "bg-gold text-[#050505] shadow-lg shadow-gold/25" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("signup"); setAuthError(null); setAuthSuccess(null); }}
            className={`flex-1 rounded-md py-3 text-sm font-extrabold uppercase tracking-wider transition-all duration-300 ${
              activeTab === "signup" ? "bg-gold text-[#050505] shadow-lg shadow-gold/25" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            新規登録
          </button>
        </div>

        <form noValidate onSubmit={(e) => { e.preventDefault(); handleLoginOrSignup(); }} className="flex flex-col gap-5">
          {activeTab === "signup" && (
            <GoldInput id="name" placeholder="フルネームを入力" icon={User} label={<label htmlFor="name" className={labelClass}>お名前</label>} value={name} onChange={setName} />
          )}
          <GoldInput id="email" type="email" placeholder="you@example.com" icon={Mail} label={<label htmlFor="email" className={labelClass}>メールアドレス</label>} value={email} onChange={setEmail} />
          <GoldInput
            id="password"
            type="password"
            placeholder={activeTab === "login" ? "パスワードを入力" : "パスワードを作成"}
            icon={Lock}
            label={
              <div className="flex items-center justify-between">
                <label htmlFor="password" className={labelClass}>パスワード</label>
                {activeTab === "login" && (
                  <button type="button" className="text-xs font-semibold tracking-wide text-foreground transition-colors hover:text-gold">パスワードをお忘れの方</button>
                )}
              </div>
            }
            value={password}
            onChange={setPassword}
            toggleable
            revealed={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />
          {authError && <p className="text-sm text-red-400" role="alert">{authError}</p>}
          {authSuccess && (
            <div className="space-y-2">
              <p className="text-sm text-green-400" role="status">{authSuccess}</p>
              {authSuccess.startsWith("確認メールを送信しました") && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="text-xs font-semibold text-gold transition-colors hover:text-gold-light disabled:opacity-60"
                >
                  {resendLoading ? "送信中…" : "確認メールを再送信する"}
                </button>
              )}
            </div>
          )}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleLoginOrSignup}
            className="group mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-4 text-sm font-black uppercase tracking-[0.15em] text-[#050505] transition-all duration-300 hover:bg-gold-light hover:shadow-lg hover:shadow-gold/25 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{activeTab === "login" ? "ログイン" : "チームに参加する"}<ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /></>}
          </button>
        </form>

        <p className="mt-7 text-center text-xs text-muted-foreground">
          {activeTab === "login" ? (<>アカウントをお持ちでない方は <button type="button" onClick={() => setActiveTab("signup")} className="font-bold text-foreground transition-colors hover:text-gold-light">新規登録</button></>) : (<>アカウントをお持ちの方は <button type="button" onClick={() => setActiveTab("login")} className="font-bold text-foreground transition-colors hover:text-gold-light">ログイン</button></>)}
        </p>
      </div>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground/40">
        続けることで、FITPEAKの <button type="button" className="underline transition-colors hover:text-muted-foreground/60">利用規約</button> および <button type="button" className="underline transition-colors hover:text-muted-foreground/60">プライバシーポリシー</button> に同意したものとみなされます。
      </p>
    </div>
  );
}
