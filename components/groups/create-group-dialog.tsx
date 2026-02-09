"use client";

import React, { useState, useEffect } from "react";
import { Dumbbell, Lock, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { GROUP_CATEGORIES } from "@/lib/group-constants";
import { useRouter } from "next/navigation";

export default function CreateGroupDialog({
  children,
  onCreated,
  editGroupId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  children: React.ReactNode;
  onCreated?: () => void;
  /** 指定時は編集モード（名前・説明・公開設定・カテゴリを更新） */
  editGroupId?: string | null;
  /** 制御用（編集ボタンなどから開く場合） */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOnOpenChange ? (controlledOpen ?? false) : internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(editGroupId);

  useEffect(() => {
    if (!open || !editGroupId) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("groups")
        .select("name, description, category, is_private")
        .eq("id", editGroupId)
        .single();
      if (data) {
        setGroupName((data as { name: string }).name ?? "");
        setDescription((data as { description: string | null }).description ?? "");
        setCategory((data as { category: string | null }).category ?? "");
        setIsPrivate((data as { is_private: boolean }).is_private ?? false);
      }
    })();
  }, [open, editGroupId]);

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 focus:shadow-[0_0_16px_rgba(212,175,55,0.1)]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!groupName.trim()) {
      setError("グループ名を入力してください。");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("ログインしてください。");
        setSubmitting(false);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      if (isEdit && editGroupId) {
        const { error: updateErr } = await sb
          .from("groups")
          .update({
            name: groupName.trim(),
            description: description.trim() || null,
            category: category || null,
            is_private: isPrivate,
          })
          .eq("id", editGroupId)
          .eq("created_by", user.id);
        if (updateErr) {
          setError("更新に失敗しました。");
          setSubmitting(false);
          return;
        }
        setOpen(false);
        setGroupName("");
        setDescription("");
        setCategory("");
        setIsPrivate(false);
        onCreated?.();
        router.refresh();
        setSubmitting(false);
        return;
      }
      const { data: conv, error: convErr } = await sb
        .from("conversations")
        .insert({})
        .select("id")
        .single();
      if (convErr || !conv) {
        setError("チャット用の会話を作成できませんでした。");
        setSubmitting(false);
        return;
      }
      const { data: group, error: groupErr } = await sb
        .from("groups")
        .insert({
          name: groupName.trim(),
          description: description.trim() || null,
          category: category || null,
          created_by: user.id,
          is_private: isPrivate,
          chat_room_id: conv.id,
        })
        .select("id")
        .single();
      if (groupErr || !group) {
        setError("グループの作成に失敗しました。");
        setSubmitting(false);
        return;
      }
      await sb.from("group_members").insert({
        group_id: group.id,
        user_id: user.id,
      });
      await sb.from("conversation_participants").insert({
        conversation_id: conv.id,
        user_id: user.id,
      });
      setOpen(false);
      setGroupName("");
      setDescription("");
      setCategory("");
      setIsPrivate(false);
      onCreated?.();
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(isEdit ? "更新に失敗しました。" : "作成に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {!controlledOnOpenChange && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent className="border-border/60 bg-card sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10">
              <Dumbbell className="h-4 w-4 text-gold" />
            </div>
            <DialogTitle className="text-lg font-black tracking-wide text-foreground">
              {isEdit ? "グループを編集" : "新しいグループを作る"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            グループを結成して、仲間とトレーニングを共有しよう
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="group-name"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              グループ名
            </label>
            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="例: ベンチプレス100kg目指す会"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="group-desc"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              活動内容・説明
            </label>
            <textarea
              id="group-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="どんな活動をするグループですか？"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              公開設定
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPrivate}
                  onChange={() => setIsPrivate(false)}
                  className="h-4 w-4 border-border text-gold focus:ring-gold"
                />
                <Globe className="h-4 w-4 text-gold/70" />
                <span className="text-sm font-medium text-foreground">
                  オープン（誰でも参加可）
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="visibility"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(true)}
                  className="h-4 w-4 border-border text-gold focus:ring-gold"
                />
                <Lock className="h-4 w-4 text-gold/70" />
                <span className="text-sm font-medium text-foreground">
                  承認制（管理者の許可が必要）
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              カテゴリ
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 border-border bg-secondary text-sm text-foreground transition-all duration-300 focus:border-gold focus:ring-1 focus:ring-gold/30">
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {GROUP_CATEGORIES.map((cat) => (
                  <SelectItem
                    key={cat}
                    value={cat}
                    className="text-foreground focus:bg-gold/10 focus:text-gold"
                  >
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex h-12 w-full items-center justify-center rounded-lg bg-gold text-sm font-black uppercase tracking-[0.1em] text-[#050505] transition-all duration-300 hover:bg-gold-light hover:shadow-lg hover:shadow-gold/25 active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? (isEdit ? "更新中..." : "作成中...") : isEdit ? "更新する" : "結成する"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
    {controlledOnOpenChange && children}
    </>
  );
}
