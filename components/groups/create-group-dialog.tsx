"use client";

import React, { useState } from "react";
import { Dumbbell } from "lucide-react";
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

const categories = [
  { value: "ウエイト", label: "ウエイト" },
  { value: "有酸素", label: "有酸素" },
  { value: "減量", label: "減量" },
  { value: "その他", label: "その他" },
];

export default function CreateGroupDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 focus:shadow-[0_0_16px_rgba(212,175,55,0.1)]";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    setGroupName("");
    setDescription("");
    setCategory("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="border-border/60 bg-card sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10">
              <Dumbbell className="h-4 w-4 text-gold" />
            </div>
            <DialogTitle className="text-lg font-black tracking-wide text-foreground">
              新しい部活を作る
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
              placeholder="例: ベンチプレス100kg目指す部"
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
              カテゴリ
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 border-border bg-secondary text-sm text-foreground transition-all duration-300 focus:border-gold focus:ring-1 focus:ring-gold/30">
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.value}
                    value={cat.value}
                    className="text-foreground focus:bg-gold/10 focus:text-gold"
                  >
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            type="submit"
            className="mt-1 flex h-12 w-full items-center justify-center rounded-lg bg-gold text-sm font-black uppercase tracking-[0.1em] text-[#050505] transition-all duration-300 hover:bg-gold-light hover:shadow-lg hover:shadow-gold/25 active:scale-[0.98]"
          >
            結成する
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
