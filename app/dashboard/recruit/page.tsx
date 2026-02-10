import type { Metadata } from "next";
import RecruitBoard from "@/components/dashboard/recruit-board";

export const metadata: Metadata = {
  title: "合トレ募集 - FITPEAK Community",
  description: "合トレ募集を探して、筋トレ仲間と一緒にトレーニングしよう。",
};

export default function RecruitPage() {
  return <RecruitBoard />;
}
