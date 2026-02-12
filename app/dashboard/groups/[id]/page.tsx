"use client";

import { useParams } from "next/navigation";
import GroupDetail from "@/components/groups/group-detail";

export default function GroupDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  if (!id) {
    return (
      <div className="space-y-6">
        <p className="text-sm font-semibold text-muted-foreground">グループIDが指定されていません</p>
      </div>
    );
  }

  return <GroupDetail groupId={id} />;
}
