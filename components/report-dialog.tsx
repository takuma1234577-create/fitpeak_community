"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { reportContent, REPORT_REASON_OPTIONS, type ReportType } from "@/actions/safety";
import { Loader2 } from "lucide-react";

type ReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  type: ReportType;
  title?: string;
  onSuccess?: () => void;
};

export default function ReportDialog({
  open,
  onOpenChange,
  targetId,
  type,
  title,
  onSuccess,
}: ReportDialogProps) {
  const [reason, setReason] = useState("inappropriate");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const r = (reason && reason.trim()) || "other";
    setSubmitting(true);
    const result = await reportContent(targetId, type, r, details || undefined);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    setReason("");
    setDetails("");
    onSuccess?.();
  };

  const typeLabel = type === "user" ? "ユーザー" : type === "recruitment" ? "募集" : "グループ";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/60 bg-card">
        <DialogHeader>
          <DialogTitle>通報する</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {title ? `「${title}」を` : typeLabel + "を"}通報します。理由を選択し、必要に応じて詳細を入力してください。
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              理由
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
            >
              {REPORT_REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              詳細（任意）
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="補足があれば入力してください"
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-[#050505] hover:bg-gold-light disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "送信"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
