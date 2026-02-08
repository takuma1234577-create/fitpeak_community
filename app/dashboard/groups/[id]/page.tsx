import type { Metadata } from "next";
import GroupDetail from "@/components/groups/group-detail";

export const metadata: Metadata = {
  title: "グループ詳細 - FITPEAK",
  description: "FITPEAKコミュニティグループの詳細ページ。",
};

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GroupDetail groupId={id} />;
}
