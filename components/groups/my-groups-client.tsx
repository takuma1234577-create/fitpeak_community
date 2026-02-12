"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GroupCard, { type Group } from "@/components/groups/group-card";
import GroupManageClient from "@/components/groups/group-manage-client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { Loader2, ArrowLeft, Users, Crown } from "lucide-react";

type Row = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  chat_room_id: string | null;
  created_by: string;
};

function toGroup(row: Row, memberCount: number, isJoined: boolean): Group {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    category: row.category ?? "その他",
    memberCount,
    image: "/placeholder.svg",
    isJoined,
    chatRoomId: row.chat_room_id ?? null,
  };
}

export default function MyGroupsClient() {
  const router = useRouter();
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [managedGroups, setManagedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [manageModalGroupId, setManageModalGroupId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: memberRows } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);
      const joinedIds = (memberRows ?? []).map((r) => (r as { group_id: string }).group_id);

      const { data: managedRows } = await supabase
        .from("groups")
        .select("id, name, description, category, chat_room_id, created_by")
        .eq("created_by", user.id);
      const managedList = (managedRows ?? []) as Row[];

      const { data: joinedRows } =
        joinedIds.length > 0
          ? await supabase
              .from("groups")
              .select("id, name, description, category, chat_room_id, created_by")
              .in("id", joinedIds)
          : { data: [] };
      const joinedList = (joinedRows ?? []) as Row[];

      const allIds = [...new Set([...joinedList.map((g) => g.id), ...managedList.map((g) => g.id)])];
      const countByGroup: Record<string, number> = {};
      if (allIds.length > 0) {
        const { data: counts } = await supabase
          .from("group_members")
          .select("group_id")
          .in("group_id", allIds);
        for (const c of counts ?? []) {
          const gid = (c as { group_id: string }).group_id;
          countByGroup[gid] = (countByGroup[gid] ?? 0) + 1;
        }
      }

      setJoinedGroups(
        joinedList.map((row) =>
          toGroup(row, countByGroup[row.id] ?? 0, true)
        )
      );
      setManagedGroups(
        managedList.map((row) =>
          toGroup(row, countByGroup[row.id] ?? 0, true)
        )
      );
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-black tracking-tight text-foreground">自分のグループ</h1>
        <Link
          href="/dashboard/groups"
          className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-bold text-foreground transition-all hover:border-gold/40 hover:bg-gold/10"
        >
          <ArrowLeft className="h-4 w-4" />
          グループ一覧へ
        </Link>
      </div>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
          <Users className="h-5 w-5 text-gold/80" />
          参加してるグループ
        </h2>
        {joinedGroups.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
            <p className="text-sm font-semibold text-muted-foreground">参加中のグループはありません</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {joinedGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onSelect={(id) => id && router.push(`/dashboard/groups/${id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
          <Crown className="h-5 w-5 text-gold/80" />
          管理してるグループ
        </h2>
        {managedGroups.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
            <p className="text-sm font-semibold text-muted-foreground">管理しているグループはありません</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {managedGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onSelect={(id) => id && setManageModalGroupId(id)}
              />
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!manageModalGroupId} onOpenChange={(open) => !open && setManageModalGroupId(null)}>
        <DialogContent
          className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-0 gap-0 border-border/60 bg-card"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">グループを編集</DialogTitle>
          {manageModalGroupId && (
            <div className="p-5 sm:p-6">
              <GroupManageClient
                groupId={manageModalGroupId}
                embedded
                onClose={() => setManageModalGroupId(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
