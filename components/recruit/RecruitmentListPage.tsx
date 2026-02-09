"use client";

import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import { useRecruitModal } from "@/contexts/recruit-modal-context";
import { useRecruitments } from "@/hooks/use-recruitments";
import { SORT_OPTIONS } from "@/lib/recruit/constants";
import type { SortKey } from "@/lib/recruit/types";
import { safeArray } from "@/lib/utils";
import RecruitmentCard from "./RecruitmentCard";
import RecruitmentEmpty from "./RecruitmentEmpty";
import RecruitmentFilters from "./RecruitmentFilters";

export default function RecruitmentListPage() {
  const { openModal } = useRecruitModal();
  const {
    posts,
    loading,
    sort,
    setSort,
    myUserId,
    myDisplayName,
    participantStatusByRecruitment,
    setParticipantStatus,
  } = useRecruitments();

  const displayList = safeArray(posts);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3.5 text-sm font-black uppercase tracking-wider text-[#050505] shadow-lg shadow-gold/25 transition-all duration-300 hover:bg-gold-light hover:shadow-xl hover:shadow-gold/30 active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
            合トレを募集する
          </button>
          <Link
            href="/dashboard/recruit/manage"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-5 py-3.5 text-sm font-bold tracking-wider text-foreground transition-all duration-300 hover:border-gold/30 hover:bg-secondary/80"
          >
            <Settings2 className="h-5 w-5" />
            自分の合トレ管理
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            並び替え
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <RecruitmentFilters />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      ) : displayList.length === 0 ? (
        <RecruitmentEmpty onCreate={openModal} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayList.map((post) => (
            <RecruitmentCard
              key={post.id}
              post={post}
              myUserId={myUserId}
              myDisplayName={myDisplayName}
              participantStatus={participantStatusByRecruitment[post.id]}
              onApplied={() => myUserId && setParticipantStatus(post.id, "pending")}
              onWithdrawn={() => myUserId && setParticipantStatus(post.id, "withdrawn")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
