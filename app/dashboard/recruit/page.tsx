import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "合トレ募集 - FITPEAK Community",
  description: "合トレ募集を探して、筋トレ仲間と一緒にトレーニングしよう。",
};

export default function RecruitPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">
        合トレ募集
      </h1>
      <p className="text-sm text-muted-foreground">
        準備中です。
      </p>
    </div>
  );
}
