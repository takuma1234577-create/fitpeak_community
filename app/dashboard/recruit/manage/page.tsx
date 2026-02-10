import type { Metadata } from "next";
import RecruitManage from "@/components/dashboard/recruit-manage";

export const metadata: Metadata = {
  title: "自分の合トレ管理 - FITPEAK Community",
  description: "作成した合トレ募集の一覧と管理",
};

export default function RecruitManagePage() {
  return <RecruitManage />;
}
