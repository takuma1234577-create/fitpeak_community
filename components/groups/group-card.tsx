import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  image: string;
  isJoined?: boolean;
}

const categoryStyles: Record<string, string> = {
  パワーリフティング: "border-gold/30 bg-gold/15 text-gold",
  ウェイトリフティング: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  有酸素: "border-orange-500/30 bg-orange-500/15 text-orange-400",
  減量: "border-sky-500/30 bg-sky-500/15 text-sky-400",
  ダイエット: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  ヨガ: "border-violet-500/30 bg-violet-500/15 text-violet-400",
  コンテスト: "border-gold/30 bg-gold/15 text-gold",
  合トレ募集: "border-gold/30 bg-gold/15 text-gold",
  ゆるトレ: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  ガチ勢: "border-gold/30 bg-gold/15 text-gold",
  エンジョイ: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  その他: "border-border bg-secondary text-muted-foreground",
};

export default function GroupCard({ group }: { group: Group }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/[0.04]">
      <Link
        href={`/dashboard/groups/${group.id}`}
        className="relative block aspect-[16/9] overflow-hidden"
      >
        <Image
          src={group.image || "/placeholder.svg"}
          alt={group.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <Badge
            variant="outline"
            className={cn(
              "px-2.5 py-0.5 text-[11px] font-bold",
              categoryStyles[group.category] ?? categoryStyles["その他"]
            )}
          >
            {group.category}
          </Badge>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link href={`/dashboard/groups/${group.id}`}>
          <h3 className="line-clamp-2 text-balance text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-gold">
            {group.name}
          </h3>
        </Link>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {group.description}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 px-5 py-3.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-gold/70" />
          <span className="font-semibold">{group.memberCount}名</span>
        </div>
        {group.isJoined ? (
          <span className="rounded-lg bg-gold/10 px-3.5 py-2 text-xs font-bold text-gold">
            参加中
          </span>
        ) : (
          <button
            type="button"
            className="rounded-lg border border-gold/40 bg-transparent px-3.5 py-2 text-xs font-bold text-gold transition-all duration-300 hover:border-gold hover:bg-gold hover:text-[#050505] active:scale-[0.97]"
          >
            参加する
          </button>
        )}
      </div>
    </article>
  );
}
