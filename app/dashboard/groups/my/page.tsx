import type { Metadata } from "next";
import MyGroupsClient from "@/components/groups/my-groups-client";

export const metadata: Metadata = {
  title: "自分のグループ - FITPEAK",
  description: "参加中・管理中のグループ一覧。",
};

export default function MyGroupsPage() {
  return <MyGroupsClient />;
}
