import type { Metadata } from "next";
import GroupManageClient from "@/components/groups/group-manage-client";

export const metadata: Metadata = {
  title: "グループ管理 - FITPEAK",
  description: "グループの設定・メンバー管理。",
};

export default async function GroupManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GroupManageClient groupId={id} />;
}
