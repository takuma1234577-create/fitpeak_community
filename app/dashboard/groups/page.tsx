import type { Metadata } from "next";
import GroupList from "@/components/groups/group-list";

export const metadata: Metadata = {
  title: "コミュニティグループ - FITPEAK",
  description: "FITPEAKコミュニティの部活・グループ一覧。仲間と繋がろう。",
};

export default function GroupsPage() {
  return <GroupList />;
}
