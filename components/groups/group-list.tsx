"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CreateGroupDialog from "@/components/groups/create-group-dialog";
import GroupCard, { type Group } from "@/components/groups/group-card";
import GroupDetailModal from "@/components/groups/group-detail-modal";
import { createClient } from "@/utils/supabase/client";
import { ensureArray } from "@/lib/data-sanitizer";
import { Loader2, UserCircle } from "lucide-react";

export default function GroupList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const loadGroups = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: list, error } = await supabase
      .from("groups")
      .select("id, name, description, category, chat_room_id, header_url")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("groups fetch:", error);
      setGroups([]);
      setLoading(false);
      return;
    }
    const listArr = ensureArray(list) as { id: string; name: string; description: string | null; category: string | null; chat_room_id: string | null; header_url?: string | null }[];
    const ids = listArr.map((g) => g.id);
    if (ids.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }
    const { data: members } = await supabase
      .from("group_members")
      .select("group_id, user_id")
      .in("group_id", ids);
    const membersArr = ensureArray(members) as { group_id: string; user_id: string }[];
    const countByGroup: Record<string, number> = {};
    const myJoined = new Set<string>();
    for (const m of membersArr) {
      const gid = m.group_id;
      countByGroup[gid] = (countByGroup[gid] ?? 0) + 1;
      if (user && m.user_id === user.id) myJoined.add(gid);
    }
    setGroups(
      listArr.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description ?? "",
        category: g.category ?? "その他",
        memberCount: countByGroup[g.id] ?? 0,
        image: g.header_url ?? "/placeholder.svg",
        isJoined: myJoined.has(g.id),
        chatRoomId: g.chat_room_id ?? null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-black tracking-tight text-foreground">グループ</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/groups/my"
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-bold text-foreground transition-all hover:border-gold/40 hover:bg-gold/10"
          >
            <UserCircle className="h-4 w-4" />
            自分のグループ
          </Link>
          <CreateGroupDialog onCreated={loadGroups}>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-gold/40 bg-transparent px-4 py-2.5 text-sm font-bold text-gold transition-all hover:border-gold hover:bg-gold hover:text-[#050505]"
            >
              グループを作る
            </button>
          </CreateGroupDialog>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-muted-foreground">まだグループがありません</p>
          <p className="mt-1 text-xs text-muted-foreground">最初のグループを作成しましょう</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onSelect={(id) => setSelectedGroupId(id)}
            />
          ))}
        </div>
      )}

      <GroupDetailModal
        groupId={selectedGroupId}
        open={selectedGroupId !== null}
        onOpenChange={(open) => !open && setSelectedGroupId(null)}
        onJoined={loadGroups}
      />
    </div>
  );
}
