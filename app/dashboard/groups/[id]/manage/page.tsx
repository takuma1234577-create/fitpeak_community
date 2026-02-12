"use client";

import { useParams } from "next/navigation";
import GroupManageClient from "@/components/groups/group-manage-client";

export default function GroupManagePage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  if (!id) {
    return (
      <div className="space-y-6">
        <p className="text-sm font-semibold text-muted-foreground">グループIDが指定されていません</p>
      </div>
    );
  }

  return <GroupManageClient groupId={id} />;
}
