"use client";

import CreateGroupDialog from "@/components/groups/create-group-dialog";
import GroupCard, { type Group } from "@/components/groups/group-card";

const mockGroups: Group[] = [
  {
    id: "bench-100",
    name: "ベンチプレス100kg目指す部",
    description: "ベンチ100kgを目標にフォーム改善やプログラムを共有し合うグループです。",
    category: "ガチ勢",
    memberCount: 24,
    image: "/placeholder.svg",
    isJoined: true,
  },
  {
    id: "summer-diet",
    name: "夏までに絞る会 2026",
    description: "食事管理と有酸素の併用で夏までに体脂肪率10%台を目指すグループ。",
    category: "減量",
    memberCount: 42,
    image: "/placeholder.svg",
    isJoined: true,
  },
  {
    id: "deadlift-lovers",
    name: "デッドリフト愛好会",
    description: "コンベンショナル派もスモウ派も集まれ！週1で合トレしています。",
    category: "ガチ勢",
    memberCount: 18,
    image: "/placeholder.svg",
  },
];

export default function GroupList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight text-foreground">部活</h1>
        <CreateGroupDialog>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-gold/40 bg-transparent px-4 py-2.5 text-sm font-bold text-gold transition-all hover:border-gold hover:bg-gold hover:text-[#050505]"
          >
            部活を作る
          </button>
        </CreateGroupDialog>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockGroups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
