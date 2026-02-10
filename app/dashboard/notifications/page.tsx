"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { safeList } from "@/lib/utils";

type NotificationRow = {
  id: string;
  user_id: string;
  sender_id: string | null;
  type: string;
  content: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [list, setList] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await (supabase as any)
      .from("notifications")
      .select("id, sender_id, type, content, is_read, link, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error) setList(safeList(data as NotificationRow[] | null));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const markReadAndGo = async (n: NotificationRow) => {
    const supabase = createClient();
    if (!n.is_read) {
      await (supabase as any).from("notifications").update({ is_read: true }).eq("id", n.id);
    }
    if (n.link) {
      router.push(n.link);
    } else {
      setList((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="ダッシュボードに戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-black tracking-wide text-foreground">
          <Bell className="h-6 w-6 text-gold" />
          通知
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-muted-foreground">通知はありません</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {list.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => markReadAndGo(n)}
                className={`flex w-full flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors hover:bg-secondary/80 ${
                  n.is_read ? "border-border/40 bg-card/50" : "border-gold/30 bg-gold/5"
                }`}
              >
                <p className="text-sm font-medium text-foreground">{n.content}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("ja-JP")}
                  {!n.is_read && (
                    <span className="ml-2 inline-block rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">
                      未読
                    </span>
                  )}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
