"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { createClient } from "@/utils/supabase/client";
import { useRecruitModal } from "@/contexts/recruit-modal-context";
import { Loader2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { bodyParts } from "./filter-bar";
import { PREFECTURES } from "@/lib/constants";

const levelOptions = [
  { value: "", label: "指定なし" },
  { value: "beginner", label: "初心者" },
  { value: "intermediate", label: "中級者" },
  { value: "advanced", label: "上級者" },
  { value: "competitor", label: "大会勢" },
];

const timeOptions: { value: string; label: string }[] = [];
for (let h = 0; h < 24; h++) {
  const hh = h.toString().padStart(2, "0");
  timeOptions.push({ value: `${hh}:00`, label: `${hh}:00` });
  timeOptions.push({ value: `${hh}:30`, label: `${hh}:30` });
}

export default function CreateRecruitmentDialog() {
  const { open, setOpen } = useRecruitModal();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetBodyPart, setTargetBodyPart] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [level, setLevel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateOpen, setDateOpen] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
    setTargetBodyPart("");
    setEventDate("");
    setEventTime("");
    setLocation("");
    setArea("");
    setLevel("");
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    setOpen(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    const dateStr = eventDate?.trim();
    const timeStr = eventTime || "12:00";
    if (!dateStr) {
      setError("日付を選択してください");
      return;
    }
    const dateTime = `${dateStr}T${timeStr}:00`;
    const eventDateTime = new Date(dateTime).toISOString();

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("ログインしてください");
        return;
      }
      const sb = supabase as any;
      await sb.from("profiles").upsert({ id: user.id }, { onConflict: "id" });
      const { data: conv, error: convErr } = await sb.from("conversations").insert({}).select("id").single();
      if (convErr || !conv?.id) {
        setError("チャットルームの作成に失敗しました");
        setIsSubmitting(false);
        return;
      }
      await sb.from("conversation_participants").insert({ conversation_id: conv.id, user_id: user.id });
      const baseRow = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        target_body_part: targetBodyPart && targetBodyPart !== "all" ? targetBodyPart : null,
        event_date: eventDateTime,
        location: location.trim() || null,
        status: "open",
        chat_room_id: conv.id,
      };
      const { error: insertError } = await sb.from("recruitments").insert(baseRow);
      if (insertError) throw insertError;
      handleOpenChange(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "募集の作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] w-full max-w-md overflow-y-auto border-border/60 bg-card p-4 sm:p-6 [&>*]:min-h-0">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg font-black tracking-wide text-foreground">
            合トレを募集する
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            日時・場所・部位を入力して募集を作成します
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-4 pb-20">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              タイトル <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 胸トレ合トレ募集！"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              説明（任意）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="補足や条件など"
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              部位
            </label>
            <select
              value={targetBodyPart}
              onChange={(e) => setTargetBodyPart(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
            >
              {(Array.isArray(bodyParts) ? bodyParts : []).map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                エリア
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
              >
                <option value="all">指定なし</option>
                {(Array.isArray(PREFECTURES) ? PREFECTURES : []).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                レベル
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
              >
                {(Array.isArray(levelOptions) ? levelOptions : []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                日付 <span className="text-red-400">*</span>
              </label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 flex items-center gap-2",
                      !eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 shrink-0 text-gold/70" />
                    {eventDate ? new Date(eventDate + "T12:00:00").toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" }) : "日付を選択"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-border bg-card" align="start">
                  <Calendar
                    mode="single"
                    selected={eventDate ? new Date(eventDate + "T12:00:00") : undefined}
                    onSelect={(d) => {
                      if (d) {
                        const y = d.getFullYear();
                        const m = (d.getMonth() + 1).toString().padStart(2, "0");
                        const day = d.getDate().toString().padStart(2, "0");
                        setEventDate(`${y}-${m}-${day}`);
                        setDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                時間
              </label>
              <Select value={eventTime || "12:00"} onValueChange={setEventTime}>
                <SelectTrigger className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-gold/50 focus:ring-1 focus:ring-gold/20">
                  <SelectValue placeholder="00:00〜23:30" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px] border-border bg-card">
                  {(Array.isArray(timeOptions) ? timeOptions : []).map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-foreground focus:bg-gold/10 focus:text-gold"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              場所（ジム名・住所など）
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例: ゴールドジム原宿"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <DialogFooter className="shrink-0 gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-secondary/80"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-black text-[#050505] transition-colors hover:bg-gold-light disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "募集する"
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
