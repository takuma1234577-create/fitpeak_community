import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "自分の合トレ管理 - FITPEAK Community",
  description: "自分が作成した合トレ募集の管理",
};

export default function RecruitManagePage() {
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/recruit"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        ← 募集一覧へ
      </Link>
      <h1 className="text-2xl font-black tracking-tight text-foreground">
        自分の合トレ管理
      </h1>
      <p className="text-sm text-muted-foreground">
        準備中です。
      </p>
    </div>
  );
}
