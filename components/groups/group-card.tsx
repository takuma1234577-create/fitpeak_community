import { useState, useEffect } from "react";
import Image from "next/image";
import { Users, Dumbbell, ImagePlus } from "lucide-react";
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
  /** グループチャットの会話ID（参加中ならチャットへ遷移するときに使用） */
  chatRoomId?: string | null;
}

/** 合トレ募集用グループか（一覧で合トレタグを表示する） */
export function isRecruitmentGroup(category: string): boolean {
  return category === "合トレ募集";
}

const categoryStyles: Record<string, string> = {
  公式: "border-gold/40 bg-gold/20 text-gold",
  合トレ: "border-gold/30 bg-gold/15 text-gold",
  パワーリフティング: "border-gold/30 bg-gold/15 text-gold",
  ウェイトリフティング: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  合トレ募集: "border-gold/30 bg-gold/15 text-gold",
  有酸素: "border-orange-500/30 bg-orange-500/15 text-orange-400",
  減量: "border-sky-500/30 bg-sky-500/15 text-sky-400",
  ダイエット: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  ヨガ: "border-violet-500/30 bg-violet-500/15 text-violet-400",
  コンテスト: "border-gold/30 bg-gold/15 text-gold",
  ゆるトレ: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  ガチ勢: "border-gold/30 bg-gold/15 text-gold",
  エンジョイ: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  その他: "border-border bg-secondary text-muted-foreground",
};

export default function GroupCard({
  group,
  onSelect,
}: {
  group: Group;
  onSelect?: (groupId: string) => void;
}) {
  const showRecruitmentTag = isRecruitmentGroup(group.category);
  const handleClick = () => onSelect?.(group.id);
  const hasHeaderUrl = Boolean(group.image?.startsWith("http"));
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    setImageError(false);
  }, [group.image]);
  const showHeaderImage = hasHeaderUrl && !imageError;

  return (
    <article
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect ? handleClick : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/[0.04]",
        onSelect && "cursor-pointer"
      )}
    >
      <div className="relative block aspect-[16/9] overflow-hidden bg-secondary">
        {showHeaderImage ? (
          <Image
            key={group.image}
            src={group.image}
            alt={group.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gold/15 via-secondary to-gold/10">
            <ImagePlus className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
          {showRecruitmentTag && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 border-gold/40 bg-gold/20 px-2.5 py-0.5 text-[11px] font-bold text-foreground"
            >
              <Dumbbell className="h-3 w-3" />
              合トレ
            </Badge>
          )}
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
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="line-clamp-2 text-balance text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-gold">
          {group.name}
        </h3>
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
          <span className="rounded-lg bg-gold/10 px-3.5 py-2 text-xs font-bold text-foreground">
            参加中
          </span>
        ) : (
          <span className="rounded-lg border border-border/60 bg-secondary/50 px-3.5 py-2 text-xs font-semibold text-muted-foreground">
            未参加
          </span>
        )}
      </div>
    </article>
  );
}
