"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import CreateGroupDialog from "@/components/groups/create-group-dialog";
import GroupCard, { type Group } from "@/components/groups/group-card";
import GroupDetailModal from "@/components/groups/group-detail-modal";
import { createClient } from "@/utils/supabase/client";
import { ensureArray } from "@/lib/data-sanitizer";
import { PREFECTURES } from "@/lib/constants";
import { Loader2, UserCircle, Search, Filter } from "lucide-react";

type GroupWithPrefecture = Group & { prefecture?: string | null };

export default function GroupList() {
  const [groups, setGroups] = useState<GroupWithPrefecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [prefectureFilter, setPrefectureFilter] = useState<string>("");

  const loadGroups = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: list, error } = await supabase
      .from("groups")
      .select("id, name, description, category, chat_room_id, header_url, prefecture")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("groups fetch:", error);
      setGroups([]);
      setLoading(false);
      return;
    }
    const listArr = ensureArray(list) as unknown as { id: string; name: string; description: string | null; category: string | null; chat_room_id: string | null; header_url?: string | null; prefecture?: string | null }[];
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
    const membersArr = ensureArray(members) as unknown as { group_id: string; user_id: string }[];
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
        prefecture: g.prefecture ?? null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(groups.map((g) => g.category));
    return Array.from(set).sort((a, b) => {
      if (a === "公式") return -1;
      if (b === "公式") return 1;
      return a.localeCompare(b);
    });
  }, [groups]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchName = g.name.toLowerCase().includes(q);
        const matchDesc = g.description.toLowerCase().includes(q);
        const matchPref = (g.prefecture ?? "").toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchPref) return false;
      }
      if (categoryFilter && g.category !== categoryFilter) return false;
      if (prefectureFilter && g.prefecture !== prefectureFilter) return false;
      return true;
    });
  }, [groups, searchQuery, categoryFilter, prefectureFilter]);

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

      {/* 検索・絞り込み */}
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="グループ名・説明・地域で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              クリア
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground">絞り込み</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
          >
            <option value="">カテゴリ（すべて）</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={prefectureFilter}
            onChange={(e) => setPrefectureFilter(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
          >
            <option value="">地域（すべて）</option>
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {(searchQuery || categoryFilter || prefectureFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("");
                setPrefectureFilter("");
              }}
              className="rounded-lg border border-border/60 bg-secondary/80 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              リセット
            </button>
          )}
        </div>
        {(searchQuery || categoryFilter || prefectureFilter) && (
          <p className="text-xs text-muted-foreground">
            {filteredGroups.length}件のグループが表示されています
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-muted-foreground">まだグループがありません</p>
          <p className="mt-1 text-xs text-muted-foreground">最初のグループを作成しましょう</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-muted-foreground">絞り込み条件に一致するグループがありません</p>
          <p className="mt-1 text-xs text-muted-foreground">検索ワードや絞り込み条件を変更してみてください</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("");
              setPrefectureFilter("");
            }}
            className="mt-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-bold text-gold hover:bg-gold/20"
          >
            絞り込みをリセット
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => (
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
