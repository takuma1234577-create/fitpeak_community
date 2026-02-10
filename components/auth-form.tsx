"use client";

import React, { useState } from "react";
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

/** プロフィール作成済みか（nickname または username が入っていれば作成済みとみなす） */
async function checkProfileCreated(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("nickname, username")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return false;
  const row = data as { nickname: string | null; username: string | null };
  return !!(row.nickname?.trim() || row.username?.trim());
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

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#06C755" aria-hidden="true">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .348-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .349-.281.631-.63.631h-2.386c-.345 0-.627-.282-.627-.631V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596a.626.626 0 0 1-.199.031c-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.627-.631.627-.346 0-.626-.283-.626-.627V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.627-.631.627-.345 0-.627-.283-.627-.627V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.627H4.917c-.345 0-.63-.282-.63-.627V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .346-.281.628-.629.628M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

export default function AuthForm() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

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
          ? await checkProfileCreated(supabase, authData.user.id)
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
          setAuthError(error.message === "User already registered" ? "このメールアドレスは既に登録されています" : error.message);
          return;
        }
        if (data.session && data.user) {
          await syncEmailConfirmed(supabase, data.user);
          const hasProfile = await checkProfileCreated(supabase, data.user.id);
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
        <div className="mb-8 flex gap-1 rounded-lg bg-secondary/80 p-1.5">
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

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">または</span>
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <div className="flex gap-3">
          <button type="button" className="flex flex-1 items-center justify-center gap-2.5 rounded-lg border border-border bg-secondary py-3 text-sm font-bold text-foreground transition-all duration-300 hover:border-gold/40 hover:bg-secondary/80">
            <GoogleIcon /> Google
          </button>
          <button type="button" className="flex flex-1 items-center justify-center gap-2.5 rounded-lg border border-border bg-secondary py-3 text-sm font-bold text-foreground transition-all duration-300 hover:border-gold/40 hover:bg-secondary/80">
            <LineIcon /> LINE
          </button>
        </div>

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
