"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, ImagePlus, Loader2, Pencil, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CreateGroupDialog from "@/components/groups/create-group-dialog";
import { createClient } from "@/utils/supabase/client";
import { ensureArray } from "@/lib/data-sanitizer";

type GroupData = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_private: boolean;
  created_by: string;
};

type MemberRow = {
  user_id: string;
  name: string;
  initial: string;
  avatar_url: string | null;
  is_creator: boolean;
};

export default function GroupManageClient({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const loadGroup = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: g, error } = await supabase
      .from("groups")
      .select("id, name, description, category, is_private, created_by")
      .eq("id", groupId)
      .single();

    if (error || !g) {
      setLoading(false);
      router.replace("/dashboard/groups");
      return;
    }

    const groupData = g as GroupData;
    if (groupData.created_by !== user.id) {
      router.replace(`/dashboard/groups/${groupId}`);
      return;
    }

    setGroup(groupData);

    const { data: memberRows } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);
    const memberList = ensureArray(memberRows) as { user_id: string }[];
    const userIds = memberList.map((r) => r.user_id);

    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nickname, username, avatar_url")
        .in("id", userIds);
      const profList = ensureArray(profs) as Record<string, unknown>[];
      setMembers(
        profList.map((p) => {
          const id = (p as { id: string }).id;
          const name =
            (p as { nickname: string | null }).nickname ||
            (p as { username: string | null }).username ||
            "ユーザー";
          return {
            user_id: id,
            name,
            initial: name.charAt(0),
            avatar_url: (p as { avatar_url: string | null }).avatar_url ?? null,
            is_creator: id === groupData.created_by,
          };
        })
      );
    } else {
      setMembers([]);
    }
    setLoading(false);
  }, [groupId, router]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-black tracking-tight text-foreground">グループ管理</h1>
        <Link
          href={`/dashboard/groups/${groupId}`}
          className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-bold text-foreground transition-all hover:border-gold/40 hover:bg-gold/10"
        >
          <ArrowLeft className="h-4 w-4" />
          グループ詳細へ
        </Link>
      </div>

      <section className="rounded-xl border border-border/60 bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{group.name}</h2>
            {group.category && (
              <p className="mt-1 text-sm text-muted-foreground">{group.category}</p>
            )}
          </div>
          <CreateGroupDialog
            editGroupId={groupId}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onCreated={loadGroup}
          >
            <button
              type="button"
              onClick={() => setEditDialogOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-gold/40 bg-transparent px-4 py-2.5 text-sm font-bold text-gold transition-all hover:border-gold hover:bg-gold hover:text-[#050505]"
            >
              <Pencil className="h-4 w-4" />
              グループ概要を編集
            </button>
          </CreateGroupDialog>
        </div>
        {group.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
            {group.description}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
          <ImagePlus className="h-5 w-5 text-gold/80" />
          ヘッダー画像
        </h2>
        <p className="text-sm text-muted-foreground">
          ヘッダー画像の設定は準備中です。今後追加予定です。
        </p>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
          <Users className="h-5 w-5 text-gold/80" />
          メンバー（{members.length}名）
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center gap-3 rounded-lg border border-border/40 bg-secondary/30 px-4 py-3"
            >
              <Avatar className="h-10 w-10 border-2 border-gold/20">
                <AvatarImage src={m.avatar_url ?? undefined} alt={m.name} />
                <AvatarFallback className="bg-gold/10 text-sm font-bold text-gold">
                  {m.initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{m.name}</p>
                {m.is_creator && (
                  <span className="inline-flex items-center gap-1 text-xs text-gold">
                    <Crown className="h-3 w-3" />
                    作成者
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
