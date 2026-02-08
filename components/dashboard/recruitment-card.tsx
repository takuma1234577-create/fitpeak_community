import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export interface RecruitmentPost {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  tags: string[];
  user: {
    name: string;
    title: string;
    avatar?: string;
    initial?: string;
  };
  spots: number;
  spotsLeft: number;
}

export default function RecruitmentCard({
  post,
}: {
  post: RecruitmentPost;
}) {
  const spotsPercent = ((post.spots - post.spotsLeft) / post.spots) * 100;
  const initial = post.user.initial ?? post.user.name.charAt(0);

  return (
    <article className="group flex flex-col rounded-xl border border-border/60 bg-card transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/[0.04]">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-gold" />
            <span className="font-bold">{post.date}</span>
            <span className="text-muted-foreground">{post.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-gold/70" />
          <span className="font-medium">{post.location}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-4">
        <h3 className="line-clamp-2 text-balance text-sm font-bold leading-snug text-foreground">
          {post.title}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="border-0 bg-gold/10 px-2.5 py-0.5 text-[11px] font-semibold text-gold/90 hover:bg-gold/20"
            >
              #{tag}
            </Badge>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">
              募集枠
            </span>
            <span className="text-[11px] font-bold text-foreground">
              <span className="text-gold">{post.spotsLeft}</span>
              <span className="text-muted-foreground">/{post.spots}名</span>
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gold/60 transition-all duration-500"
              style={{ width: `${spotsPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
            <AvatarImage
              src={post.user.avatar || "/placeholder.svg"}
              alt={post.user.name}
            />
            <AvatarFallback className="text-xs">{initial}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">
              {post.user.name}
            </span>
            <span className="text-[10px] font-medium text-gold/80">
              {post.user.title}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-gold/40 bg-transparent px-3.5 py-2 text-xs font-bold text-gold transition-all duration-300 hover:border-gold hover:bg-gold hover:text-[#050505] active:scale-[0.97]"
        >
          参加申請
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
