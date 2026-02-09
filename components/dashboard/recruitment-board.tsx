"use client";

import { Plus } from "lucide-react";
import FilterBar from "@/components/dashboard/filter-bar";
import RecruitmentCard, {
  type RecruitmentPost,
} from "@/components/dashboard/recruitment-card";
import { useRecruitModal } from "@/contexts/recruit-modal-context";

const mockPosts: RecruitmentPost[] = [
  {
    id: "1",
    title: "胸トレ合トレ募集！ベンチ100kg目指してる方一緒にやりましょう",
    date: "2/10",
    time: "19:00~",
    location: "ゴールドジム原宿",
    tags: ["胸トレ", "合トレ", "ガチ勢"],
    user: { name: "田中 健二", title: "BIG3 500kg", initial: "田" },
    spots: 4,
    spotsLeft: 2,
  },
  {
    id: "2",
    title: "脚の日！スクワット中心にやります。補助お願いしたいです",
    date: "2/11",
    time: "10:00~",
    location: "エニタイム渋谷",
    tags: ["脚トレ", "スクワット"],
    user: { name: "鈴木 ユキ", title: "パワーリフター", initial: "鈴" },
    spots: 3,
    spotsLeft: 1,
  },
  {
    id: "3",
    title: "デッドリフト200kg超えメンバー集合！背中の日やりましょう",
    date: "2/12",
    time: "18:30~",
    location: "パワーハウスジム新宿",
    tags: ["背中", "デッドリフト"],
    user: { name: "佐藤 太郎", title: "大会勢", initial: "佐" },
    spots: 3,
    spotsLeft: 3,
  },
];

export default function RecruitmentBoard() {
  const { openModal } = useRecruitModal();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={openModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3.5 text-sm font-black uppercase tracking-wider text-[#050505] shadow-lg shadow-gold/25 transition-all duration-300 hover:bg-gold-light hover:shadow-xl hover:shadow-gold/30 active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          合トレを募集する
        </button>
      </div>
      <FilterBar />
      <div className="grid gap-4 sm:grid-cols-2">
        {mockPosts.map((post) => (
          <RecruitmentCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
