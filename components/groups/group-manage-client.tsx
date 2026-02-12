"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, ImagePlus, Loader2, Pencil, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CreateGroupDialog from "@/components/groups/create-group-dialog";
import { createClient } from "@/utils/supabase/client";
import { ensureArray } from "@/lib/data-sanitizer";
import { safeArray } from "@/lib/utils";
import { uploadGroupHeader } from "@/lib/upload-group-header";

type GroupData = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_private: boolean;
  created_by: string;
  header_url: string | null;
};

type MemberRow = {
  user_id: string;
  name: string;
  initial: string;
  avatar_url: string | null;
  is_creator: boolean;
};

type GroupManageClientProps = {
  groupId: string;
  /** モーダル内で表示するとき true。閉じるボタンと onClose を使う */
  embedded?: boolean;
  onClose?: () => void;
  /** グループ情報更新時（ヘッダー保存など）に親が一覧を再取得する用 */
  onGroupUpdated?: () => void;
};

export default function GroupManageClient({ groupId, embedded, onClose, onGroupUpdated }: GroupManageClientProps) {
  const router = useRouter();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [headerUploading, setHeaderUploading] = useState(false);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [headerPreviewFile, setHeaderPreviewFile] = useState<File | null>(null);
  const [headerPreviewUrl, setHeaderPreviewUrl] = useState<string | null>(null);
  const [headerImageKey, setHeaderImageKey] = useState(0);
  const headerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (headerPreviewUrl) URL.revokeObjectURL(headerPreviewUrl);
    };
  }, [headerPreviewUrl]);

  const loadGroup = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: g, error } = await supabase
      .from("groups")
      .select("id, name, description, category, is_private, created_by, header_url")
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
    const memberList = ensureArray(memberRows) as unknown as { user_id: string }[];
    const userIds = memberList.map((r) => r.user_id);

    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nickname, username, avatar_url")
        .in("id", userIds);
      const profList = ensureArray(profs) as unknown as Record<string, unknown>[];
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
        {embedded && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-bold text-foreground transition-all hover:border-gold/40 hover:bg-gold/10"
          >
            <ArrowLeft className="h-4 w-4" />
            閉じる
          </button>
        ) : (
          <Link
            href={`/dashboard/groups/${groupId}`}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-bold text-foreground transition-all hover:border-gold/40 hover:bg-gold/10"
          >
            <ArrowLeft className="h-4 w-4" />
            グループ詳細へ
          </Link>
        )}
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
        <div className="rounded-xl border border-border bg-secondary overflow-hidden">
          <div className="relative aspect-[3/1] w-full max-h-40">
            {headerPreviewUrl ? (
              <Image
                src={headerPreviewUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : group.header_url ? (
              <Image
                key={`header-${group.id}-${headerImageKey}`}
                src={group.header_url}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-gold/20 via-secondary to-gold/20 flex items-center justify-center">
                <ImagePlus className="h-12 w-12 text-muted-foreground/40" />
              </div>
            )}
          </div>
        </div>
        <input
          ref={headerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            e.target.value = "";
            setHeaderError(null);
            if (headerPreviewUrl) URL.revokeObjectURL(headerPreviewUrl);
            setHeaderPreviewFile(file);
            setHeaderPreviewUrl(URL.createObjectURL(file));
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => headerInputRef.current?.click()}
            disabled={headerUploading}
            className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-bold text-foreground transition-all hover:border-gold/40 hover:bg-gold/10 disabled:opacity-50"
          >
            ヘッダー画像を選択
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!headerPreviewFile || !group) return;
              setHeaderError(null);
              setHeaderUploading(true);
              try {
                const url = await uploadGroupHeader(group.created_by, group.id, headerPreviewFile);
                const supabase = createClient();
                const { error: updateErr } = await (supabase as any)
                  .from("groups")
                  .update({ header_url: url })
                  .eq("id", group.id)
                  .eq("created_by", group.created_by);
                if (updateErr) throw new Error(updateErr.message);
                setGroup((prev) => (prev ? { ...prev, header_url: url } : null));
                setHeaderImageKey((k) => k + 1);
                if (headerPreviewUrl) URL.revokeObjectURL(headerPreviewUrl);
                setHeaderPreviewFile(null);
                setHeaderPreviewUrl(null);
                onGroupUpdated?.();
              } catch (err) {
                setHeaderError(err instanceof Error ? err.message : "アップロードに失敗しました");
              } finally {
                setHeaderUploading(false);
              }
            }}
            disabled={headerUploading || !headerPreviewFile}
            className="rounded-lg border border-gold/40 bg-gold px-4 py-2 text-sm font-bold text-[#050505] transition-all hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {headerUploading ? "保存中..." : "保存する"}
          </button>
          <span className="text-xs text-muted-foreground">3MB以下。JPEG/PNG/WebP（画像選択後に保存）</span>
        </div>
        {headerError && (
          <p className="mt-2 text-sm text-red-400" role="alert">
            {headerError}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
          <Users className="h-5 w-5 text-gold/80" />
          メンバー（{members.length}名）
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {safeArray(members).map((m) => (
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
