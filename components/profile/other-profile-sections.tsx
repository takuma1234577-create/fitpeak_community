"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CalendarDays, Users, Shield, Loader2, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ensureArray } from "@/lib/data-sanitizer";

type RecruitmentItem = {
  id: string;
  title: string;
  description: string | null;
  target_body_part: string | null;
  event_date: string;
  location: string | null;
  status: string;
};

type GroupItem = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  memberCount: number;
};

export default function OtherProfileSections({ profileUserId }: { profileUserId: string }) {
  const [openRecruitments, setOpenRecruitments] = useState<RecruitmentItem[]>([]);
  const [participatingRecruitments, setParticipatingRecruitments] = useState<RecruitmentItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!profileUserId) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      const [openRes, partRes, gmRes] = await Promise.all([
        (supabase as any)
          .from("recruitments")
          .select("id, title, description, target_body_part, event_date, location, status")
          .eq("user_id", profileUserId)
          .eq("status", "open")
          .order("event_date", { ascending: true })
          .limit(20),
        (supabase as any)
          .from("recruitment_participants")
          .select("recruitment_id, recruitments(id, title, description, target_body_part, event_date, location, status)")
          .eq("user_id", profileUserId)
          .eq("status", "approved"),
        (supabase as any)
          .from("group_members")
          .select("group_id, groups(id, name, description, category)")
          .eq("user_id", profileUserId),
      ]);

      const openList = ensureArray(openRes?.data) as unknown as RecruitmentItem[];
      setOpenRecruitments(openList);

      const partRows = ensureArray(partRes?.data) as unknown as {
        recruitment_id: string;
        recruitments: RecruitmentItem | null;
      }[];
      const participating = partRows
        .map((p) => p.recruitments)
        .filter((r): r is RecruitmentItem => r != null && r.event_date >= now && r.status === "open");
      participating.sort((a, b) => a.event_date.localeCompare(b.event_date));
      setParticipatingRecruitments(participating.slice(0, 20));

      const gmRows = ensureArray(gmRes?.data) as unknown as {
        group_id: string;
        groups: { id: string; name: string; description: string | null; category: string | null } | null;
      }[];
      const groupIds = gmRows.map((g) => g.group_id).filter(Boolean);
      if (groupIds.length === 0) {
        setGroups([]);
      } else {
        const { data: countData } = await (supabase as any)
          .from("group_members")
          .select("group_id")
          .in("group_id", groupIds);
        const countByGroup: Record<string, number> = {};
        for (const row of ensureArray(countData) as unknown as { group_id: string }[]) {
          countByGroup[row.group_id] = (countByGroup[row.group_id] ?? 0) + 1;
        }
        const list = gmRows
          .filter((g) => g.groups)
          .map((g) => ({
            id: g.groups!.id,
            name: g.groups!.name,
            description: g.groups!.description ?? null,
            category: g.groups!.category ?? null,
            memberCount: countByGroup[g.groups!.id] ?? 0,
          }));
        setGroups(list);
      }
    } catch (e) {
      console.error("[OtherProfileSections]", e);
      setOpenRecruitments([]);
      setParticipatingRecruitments([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [profileUserId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
      </div>
    );
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-8 px-5 pb-10 sm:px-8">
      {/* 募集中の合トレ一覧 */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground">
          <CalendarDays className="h-5 w-5 text-gold" />
          募集中の合トレ一覧
        </h2>
        {openRecruitments.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/50 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">募集中の合トレはありません</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {openRecruitments.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/recruit?r=${r.id}`}
                  className="flex items-start gap-2 rounded-xl border border-border/40 bg-card p-4 transition-all hover:border-gold/30 hover:bg-card/80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground">{r.title}</p>
                    {r.target_body_part && (
                      <span className="mt-0.5 inline-block text-xs text-foreground">{r.target_body_part}</span>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(r.event_date)}
                      {r.location && ` ・ ${r.location}`}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 参加予定の合トレ一覧 */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground">
          <Users className="h-5 w-5 text-gold" />
          参加予定の合トレ一覧
        </h2>
        {participatingRecruitments.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/50 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">参加予定の合トレはありません</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {participatingRecruitments.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/recruit?r=${r.id}`}
                  className="flex items-start gap-2 rounded-xl border border-border/40 bg-card p-4 transition-all hover:border-gold/30 hover:bg-card/80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground">{r.title}</p>
                    {r.target_body_part && (
                      <span className="mt-0.5 inline-block text-xs text-foreground">{r.target_body_part}</span>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(r.event_date)}
                      {r.location && ` ・ ${r.location}`}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 所属中のグループ */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground">
          <Shield className="h-5 w-5 text-gold" />
          所属中のグループ
        </h2>
        {groups.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/50 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">所属中のグループはありません</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {groups.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/dashboard/groups/${g.id}`}
                  className="flex items-start gap-2 rounded-xl border border-border/40 bg-card p-4 transition-all hover:border-gold/30 hover:bg-card/80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground">{g.name}</p>
                    {g.category && (
                      <span className="mt-0.5 inline-block text-xs text-muted-foreground">{g.category}</span>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {g.memberCount}名
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
