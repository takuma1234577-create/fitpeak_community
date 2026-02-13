"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  FileText,
  MapPin,
  Dumbbell,
  Calendar,
  ArrowRight,
  Dumbbell as IconDumbbell,
  Loader2,
  Camera,
  Lock,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { uploadAvatar } from "@/lib/upload-avatar";
import { isProfileCompleted } from "@/lib/profile-completed";
import { PREFECTURES, EXERCISE_OPTIONS, GENDER_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function calcAge(birthday: string | null): number | null {
  if (!birthday) return null;
  const d = new Date(birthday);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function GoldInput({
  id,
  type = "text",
  placeholder,
  icon: Icon,
  label,
  value,
  onChange,
  as = "input",
  required,
}: {
  id: string;
  type?: string;
  placeholder: string;
  icon: React.ElementType;
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  as?: "input" | "textarea";
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const inputClass = `w-full rounded-lg border bg-secondary py-3.5 pl-11 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-300 focus:outline-none pr-4 ${
    focused
      ? "border-gold ring-1 ring-gold/40 shadow-[0_0_24px_rgba(212,175,55,0.18)]"
      : "border-border hover:border-foreground/20"
  }`;
  return (
    <div className="flex flex-col gap-2.5">
      {label}
      <div className="group relative">
        <Icon
          className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-300 ${
            focused ? "text-gold" : "text-muted-foreground/60"
          } ${as === "textarea" ? "top-4 translate-y-0" : ""}`}
        />
        {as === "textarea" ? (
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            rows={3}
            className={`${inputClass} resize-none pt-3.5`}
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            className={inputClass}
            required={required}
          />
        )}
      </div>
    </div>
  );
}

const labelClass =
  "text-xs font-bold tracking-wider uppercase text-muted-foreground";

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<string>("");
  const [birthday, setBirthday] = useState("");
  const [bio, setBio] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [homeGym, setHomeGym] = useState("");
  const [exercises, setExercises] = useState<string[]>([]);
  const [isAgePublic, setIsAgePublic] = useState(true);
  const [isPrefecturePublic, setIsPrefecturePublic] = useState(true);
  const [isHomeGymPublic, setIsHomeGymPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  const age = calcAge(birthday || null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function checkUserAndProfile() {
      try {
        await supabase.auth.refreshSession();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) return;
        setCurrentUser({ id: user.id });
        const { data } = await supabase.from("profiles").select("avatar_url, nickname, username, bio, prefecture, exercises").eq("id", user.id).maybeSingle();
        if (cancelled) return;
        const row = data as { avatar_url: string | null; nickname: string | null; username: string | null; bio: string | null; prefecture: string | null; exercises: string[] | null } | null;
        if (row && isProfileCompleted(row)) {
          router.replace("/dashboard");
        }
      } catch (e) {
        console.error("[onboarding] checkUserAndProfile:", e);
      } finally {
        if (!cancelled) {
          setCheckingProfile(false);
        }
      }
    }

    checkUserAndProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === "INITIAL_SESSION") {
        checkUserAndProfile();
      }
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!checkingProfile && !currentUser) {
      const t = setTimeout(() => {
        router.replace("/");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [checkingProfile, currentUser, router]);

  const toggleExercise = (opt: string) => {
    setExercises((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    );
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const userId = currentUser?.id;
    if (!userId) {
      setAvatarError("ログイン情報を読み込み中です。しばらく待ってからもう一度お試しください。");
      return;
    }
    setAvatarError(null);
    setSaveError(null);
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(userId, file);
      setAvatarUrl(url);
      setAvatarVersion((v) => v + 1);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "画像のアップロードに失敗しました。";
      setAvatarError(msg);
      setSaveError(msg);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    if (!nickname.trim()) {
      setSaveError("ニックネームを入力してください。");
      return;
    }
    if (!avatarUrl) {
      setSaveError("プロフィール画像を設定してください。");
      return;
    }
    if (!bio.trim()) {
      setSaveError("自己紹介文を入力してください。");
      return;
    }
    if (!prefecture) {
      setSaveError("住まい（都道府県）を選択してください。");
      return;
    }
    if (exercises.length === 0) {
      setSaveError("やってる種目を1つ以上選んでください。");
      return;
    }
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveError("ログインしていません。一度ログイン画面に戻ってください。");
        setIsSubmitting(false);
        return;
      }
      const updatedAt = new Date().toISOString();
      const payload = {
        username: nickname.trim(),
        nickname: nickname.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
        gender: gender || null,
        birthday: birthday?.trim() || null,
        prefecture: prefecture || null,
        home_gym: homeGym.trim() || null,
        exercises: exercises.length > 0 ? exercises : null,
        is_age_public: isAgePublic,
        is_prefecture_public: isPrefecturePublic,
        is_home_gym_public: isHomeGymPublic,
        area: prefecture || null,
        gym: homeGym.trim() || null,
        updated_at: updatedAt,
      };
      const sb = supabase as any;
      // 既存行を更新（サインアップ時の trigger で行がある想定）、無ければ挿入
      const { data: existing } = await sb.from("profiles").select("id").eq("id", user.id).maybeSingle();
      if (existing) {
        const { error } = await sb.from("profiles").update(payload).eq("id", user.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("profiles").insert({ id: user.id, ...payload });
        if (error) throw error;
      }
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown> | null;
      const message =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : errObj?.message != null
              ? String(errObj.message)
              : errObj?.error != null && typeof errObj.error === "object" && errObj.error !== null && "message" in errObj.error
                ? String((errObj.error as { message: unknown }).message)
                : errObj?.code != null
                  ? `[${errObj.code}] ${String(errObj.details ?? errObj.message ?? "")}`
                  : "";
      console.error("Profile save error:", err, "extracted:", message);
      if (!message && err && typeof err === "object") {
        console.error("Error keys:", Object.keys(err), "full:", JSON.stringify(err, null, 2));
      }
      setSaveError(
        message
          ? `プロフィールの保存に失敗しました。（${message}）`
          : "プロフィールの保存に失敗しました。もう一度お試しください。ブラウザの開発者ツール（F12）→ Console にエラーが出ていないか確認してください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-sm font-semibold text-muted-foreground">読み込み中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-[440px]">
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <IconDumbbell className="h-9 w-9 text-gold" strokeWidth={2.5} />
            <h1 className="text-3xl font-black tracking-[0.2em] text-gold">
              FITPEAK
            </h1>
          </div>
          <p className="text-center text-sm font-semibold text-muted-foreground">
            プロフィールを入力してください
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-2xl shadow-black/60 backdrop-blur-sm sm:p-10">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* アバター */}
            <div className="flex flex-col gap-2.5">
              <span className={labelClass}>
                プロフィール画像 <span className="text-red-400">*</span>
              </span>
              <div className={cn("flex items-center gap-5", !currentUser && "pointer-events-none opacity-80")}>
                <input
                  id="onboarding-avatar-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
                <label
                  htmlFor={currentUser && !avatarUploading ? "onboarding-avatar-input" : undefined}
                  className={cn(
                    "relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-border bg-secondary flex items-center justify-center",
                    currentUser && !avatarUploading && "cursor-pointer"
                  )}
                >
                  {!currentUser && checkingProfile ? (
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                  ) : avatarUploading ? (
                    <Loader2 className="h-10 w-10 animate-spin text-gold" />
                  ) : avatarUrl ? (
                    <Image
                      key={avatarVersion}
                      src={`${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}v=${avatarVersion}`}
                      alt="アバター"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Camera className="h-10 w-10" />
                    </div>
                  )}
                </label>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={currentUser && !avatarUploading ? "onboarding-avatar-input" : undefined}
                    className={cn(
                      "text-left text-sm font-semibold text-gold hover:text-gold-light transition-colors",
                      currentUser && !avatarUploading && "cursor-pointer"
                    )}
                  >
                    {checkingProfile
                      ? "読み込み中…"
                      : !currentUser
                        ? "ログイン後に利用できます"
                        : avatarUploading
                          ? "アップロード中…"
                          : "写真をアップロード"}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, WebP。2MB以下
                  </p>
                  {!currentUser && !checkingProfile && (
                    <p className="text-xs text-amber-600">
                      ログイン情報が取得できませんでした。ページを再読み込みするか、ログインし直してください。
                    </p>
                  )}
                  {avatarError && (
                    <p className="text-xs text-red-400">{avatarError}</p>
                  )}
                </div>
              </div>
            </div>

            <GoldInput
              id="nickname"
              placeholder="例: たなか"
              icon={User}
              label={
                <label htmlFor="nickname" className={labelClass}>
                  ニックネーム <span className="text-red-400">*</span>
                </label>
              }
              value={nickname}
              onChange={setNickname}
              required
            />

            {/* 性別 */}
            <div className="flex flex-col gap-2.5">
              <span className={labelClass}>性別</span>
              <div className="flex flex-wrap gap-4">
                {GENDER_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={opt.value}
                      checked={gender === opt.value}
                      onChange={() => setGender(opt.value)}
                      className="h-4 w-4 border-border text-gold focus:ring-gold"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 誕生日 + 年齢表示 */}
            <div className="flex flex-col gap-2.5">
              <label htmlFor="birthday" className={labelClass}>
                誕生日
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-0">
                  <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <input
                    id="birthday"
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary py-3.5 pl-11 pr-4 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
                  />
                </div>
                {age !== null && (
                  <span className="rounded-full bg-gold/10 px-3 py-1.5 text-sm font-bold text-gold">
                    {age}歳
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="is-age-private"
                  type="checkbox"
                  checked={!isAgePublic}
                  onChange={(e) => setIsAgePublic(!e.target.checked)}
                  className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                />
                <label
                  htmlFor="is-age-private"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Lock className="h-3 w-3" />
                  年齢を非公開にする
                </label>
              </div>
            </div>

            <GoldInput
              id="bio"
              placeholder="パワーリフティング中心。ベンチ100kg目標！今は週4でエニタイムに行ってます。"
              icon={FileText}
              label={
                <label htmlFor="bio" className={labelClass}>
                  自己紹介文 <span className="text-red-400">*</span>
                </label>
              }
              value={bio}
              onChange={setBio}
              as="textarea"
            />

            {/* 住まい（都道府県） + 非公開 */}
            <div className="flex flex-col gap-2.5">
              <label htmlFor="prefecture" className={labelClass}>
                住まい（都道府県） <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <select
                  id="prefecture"
                  value={prefecture}
                  onChange={(e) => setPrefecture(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-secondary py-3.5 pl-11 pr-10 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
                >
                  <option value="">選択してください</option>
                  {PREFECTURES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="is-prefecture-private"
                  type="checkbox"
                  checked={!isPrefecturePublic}
                  onChange={(e) => setIsPrefecturePublic(!e.target.checked)}
                  className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                />
                <label
                  htmlFor="is-prefecture-private"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Lock className="h-3 w-3" />
                  住まいを非公開にする
                </label>
              </div>
            </div>

            {/* よく行くジム + 非公開 */}
            <div className="flex flex-col gap-2.5">
              <GoldInput
                id="homeGym"
                placeholder="例: エニタイムフィットネス 渋谷店"
                icon={Dumbbell}
                label={<label htmlFor="homeGym" className={labelClass}>よく行くジム</label>}
                value={homeGym}
                onChange={setHomeGym}
              />
              <div className="flex items-center gap-2">
                <input
                  id="is-home-gym-private"
                  type="checkbox"
                  checked={!isHomeGymPublic}
                  onChange={(e) => setIsHomeGymPublic(!e.target.checked)}
                  className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                />
                <label
                  htmlFor="is-home-gym-private"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Lock className="h-3 w-3" />
                  よく行くジムを非公開にする
                </label>
              </div>
            </div>

            {/* エクササイズ（複数選択） */}
            <div className="flex flex-col gap-2.5">
              <span className={labelClass}>
                やってる種目（1個以上選択） <span className="text-red-400">*</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {EXERCISE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleExercise(opt)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all",
                      exercises.includes(opt)
                        ? "border-gold bg-gold/15 text-gold"
                        : "border-border bg-secondary text-muted-foreground hover:border-foreground/20"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {saveError && (
              <p className="whitespace-pre-line text-sm text-red-400" role="alert">
                {saveError}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-4 text-sm font-black uppercase tracking-[0.15em] text-[#050505] transition-all duration-300 hover:bg-gold-light hover:shadow-lg hover:shadow-gold/25 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  完了してダッシュボードへ
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
