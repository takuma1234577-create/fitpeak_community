"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  FileText,
  MapPin,
  Dumbbell,
  Target,
  Calendar,
  ArrowRight,
  Dumbbell as IconDumbbell,
  Loader2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { ProfilesInsert } from "@/types/supabase";

function GoldInput({
  id,
  type = "text",
  placeholder,
  icon: Icon,
  label,
  value,
  onChange,
  as = "input",
}: {
  id: string;
  type?: string;
  placeholder: string;
  icon: React.ElementType;
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  as?: "input" | "textarea";
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
          />
        )}
      </div>
    </div>
  );
}

const labelClass =
  "text-xs font-bold tracking-wider uppercase text-muted-foreground";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [area, setArea] = useState("");
  const [gym, setGym] = useState("");
  const [goal, setGoal] = useState("");
  const [trainingYears, setTrainingYears] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveError("ログインしていません。一度ログイン画面に戻ってください。");
        setIsSubmitting(false);
        return;
      }
      const years = trainingYears.trim() ? parseInt(trainingYears, 10) : null;
      const payload: ProfilesInsert = {
        id: user.id,
        username: name.trim() || null,
        bio: bio.trim() || null,
        area: area.trim() || null,
        gym: gym.trim() || null,
        goal: goal.trim() || null,
        training_years: years != null && !Number.isNaN(years) ? years : null,
        updated_at: new Date().toISOString(),
      };
      // @ts-expect-error - Supabase generic not inferred from createClient
      const { error } = await supabase.from("profiles").upsert(payload, {
        onConflict: "id",
      });
      if (error) throw error;
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setSaveError("プロフィールの保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <GoldInput
              id="name"
              placeholder="例: 田中 太郎"
              icon={User}
              label={<label htmlFor="name" className={labelClass}>お名前</label>}
              value={name}
              onChange={setName}
            />
            <GoldInput
              id="bio"
              placeholder="例: パワーリフティング歴5年。BIG3合計600kg目指しています。"
              icon={FileText}
              label={<label htmlFor="bio" className={labelClass}>自己紹介</label>}
              value={bio}
              onChange={setBio}
              as="textarea"
            />
            <GoldInput
              id="area"
              placeholder="例: 東京・渋谷エリア"
              icon={MapPin}
              label={<label htmlFor="area" className={labelClass}>よく行くエリア</label>}
              value={area}
              onChange={setArea}
            />
            <GoldInput
              id="gym"
              placeholder="例: GOLD'S GYM 原宿"
              icon={Dumbbell}
              label={<label htmlFor="gym" className={labelClass}>よく行くジム</label>}
              value={gym}
              onChange={setGym}
            />
            <GoldInput
              id="goal"
              placeholder="例: BIG3合計600kgを目指す"
              icon={Target}
              label={<label htmlFor="goal" className={labelClass}>目標</label>}
              value={goal}
              onChange={setGoal}
            />
            <GoldInput
              id="trainingYears"
              type="number"
              placeholder="例: 5"
              icon={Calendar}
              label={<label htmlFor="trainingYears" className={labelClass}>トレーニング年数（年）</label>}
              value={trainingYears}
              onChange={setTrainingYears}
            />

            {saveError && (
              <p className="text-sm text-red-400" role="alert">{saveError}</p>
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

          <p className="mt-6 text-center text-xs text-muted-foreground">
            あとで
            <Link href="/dashboard" className="ml-1 font-bold text-gold transition-colors hover:text-gold-light">
              スキップ
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
