"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarIcon, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { PREFECTURES } from "@/lib/constants";
import { BODY_PARTS, LEVELS } from "@/lib/recruit-constants";
import { safeArray } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

export default function NewRecruitPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [bodyPart, setBodyPart] = useState("all");
  const [level, setLevel] = useState("all");
  const [eventDate, setEventDate] = useState<string>("");
  const [eventTime, setEventTime] = useState("12:00");
  const [dateOpen, setDateOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    if (!eventDate.trim()) {
      setError("日付を選択してください");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("ログインしてください");
        setSubmitting(false);
        return;
      }
      const dateTime = `${eventDate}T${eventTime}:00`;
      const eventDateTime = new Date(dateTime).toISOString();
      const row: Record<string, unknown> = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        target_body_part: bodyPart === "all" ? null : bodyPart,
        event_date: eventDateTime,
        location: area.trim() || null,
        status: "open",
      };
      if (level !== "all") (row as Record<string, string>).level = level;

      let { error: insertError } = await (supabase as any).from("recruitments").insert(row);
      if (insertError && level !== "all") {
        delete (row as Record<string, string>).level;
        const retry = await (supabase as any).from("recruitments").insert(row);
        insertError = retry.error;
      }
      if (insertError) {
        setError(insertError.message ?? "作成に失敗しました");
        setSubmitting(false);
        return;
      }
      router.push("/dashboard/recruit");
      router.refresh();
    } catch (e) {
      console.error(e);
      setError("作成中にエラーが発生しました");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/dashboard/recruit"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        ← 募集一覧へ
      </Link>
      <h1 className="text-2xl font-black tracking-tight text-foreground">
        合トレを募集する
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-bold text-foreground">
            タイトル
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 胸の日一緒にやりませんか"
            className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="area" className="mb-1.5 block text-sm font-bold text-foreground">
            エリア
          </label>
          <select
            id="area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
          >
            <option value="">選択してください</option>
            {safeArray(PREFECTURES).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bodyPart" className="mb-1.5 block text-sm font-bold text-foreground">
            部位
          </label>
          <select
            id="bodyPart"
            value={bodyPart}
            onChange={(e) => setBodyPart(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
          >
            {safeArray(BODY_PARTS).map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="level" className="mb-1.5 block text-sm font-bold text-foreground">
            対象レベル
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
          >
            {safeArray(LEVELS).map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-foreground">
              日付
            </label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20",
                    !eventDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0 text-gold/70" />
                  {eventDate
                    ? new Date(eventDate + "T12:00:00").toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "日付を選択"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={eventDate ? new Date(eventDate + "T12:00:00") : undefined}
                  onSelect={(d) => {
                    if (d) {
                      setEventDate(d.toISOString().slice(0, 10));
                      setDateOpen(false);
                    }
                  }}
                  disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label htmlFor="eventTime" className="mb-1.5 block text-sm font-bold text-foreground">
              時間
            </label>
            <select
              id="eventTime"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-bold text-foreground">
            説明（任意）
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="メッセージや条件など"
            rows={4}
            className="w-full rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold py-3.5 text-sm font-black uppercase tracking-wider text-[#050505] shadow-lg shadow-gold/25 transition-all hover:bg-gold-light disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "募集する"
            )}
          </button>
          <Link
            href="/dashboard/recruit"
            className="flex items-center justify-center rounded-lg border border-border px-6 py-3.5 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
