"use client";

import FilterBar from "@/components/dashboard/filter-bar";
import RecruitmentCard, {
  type RecruitmentPost,
} from "@/components/dashboard/recruitment-card";

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
  return (
    <div className="space-y-6">
      <FilterBar />
      <div className="grid gap-4 sm:grid-cols-2">
        {mockPosts.map((post) => (
          <RecruitmentCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
