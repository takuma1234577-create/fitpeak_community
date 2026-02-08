import type { Metadata } from "next";
import RecruitmentBoard from "@/components/dashboard/recruitment-board";

export const metadata: Metadata = {
  title: "合トレ募集 - FITPEAK Community",
  description:
    "合トレ募集を探して、筋トレ仲間と一緒にトレーニングしよう。",
};

export default function RecruitPage() {
  return <RecruitmentBoard />;
}
