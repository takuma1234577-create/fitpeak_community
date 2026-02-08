import {
  Clock,
  Dumbbell,
  Handshake,
  Trophy,
  Flame,
  TrendingUp,
} from "lucide-react";

const activities = [
  {
    id: 1,
    type: "collab" as const,
    title: "佐藤さんと合トレしました",
    description:
      "脚の日 - スクワット中心メニュー @ GOLD'S GYM 原宿",
    time: "2時間前",
    icon: "handshake" as const,
  },
  {
    id: 2,
    type: "record" as const,
    title: "デッドリフト自己ベスト更新!",
    description: "220kg達成 - 前回+5kgアップ",
    time: "昨日",
    icon: "trophy" as const,
  },
  {
    id: 3,
    type: "training" as const,
    title: "胸・三頭トレーニング完了",
    description:
      "ベンチプレス 5x5 / インクラインDB 4x10 / ケーブルフライ 3x15",
    time: "2日前",
    icon: "dumbbell" as const,
  },
  {
    id: 4,
    type: "streak" as const,
    title: "30日連続トレーニング達成",
    description: "継続は力なり! ストリーク記録更新中",
    time: "3日前",
    icon: "flame" as const,
  },
  {
    id: 5,
    type: "collab" as const,
    title: "鈴木さんと合トレしました",
    description:
      "背中の日 - デッドリフト＋ラットプル @ エニタイム渋谷",
    time: "5日前",
    icon: "handshake" as const,
  },
];

const iconMap = {
  dumbbell: Dumbbell,
  trophy: Trophy,
  handshake: Handshake,
  flame: Flame,
};

const iconColorMap: Record<string, string> = {
  training: "bg-secondary text-foreground",
  record: "bg-gold/10 text-gold",
  collab: "bg-emerald-400/10 text-emerald-400",
  streak: "bg-orange-400/10 text-orange-400",
};

export default function ActivityTimeline() {
  return (
    <section className="px-5 py-6 sm:px-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">
            最近のアクティビティ
          </h2>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-semibold text-gold/80 transition-colors hover:text-gold"
        >
          すべて見る
          <TrendingUp className="h-3 w-3" />
        </button>
      </div>

      <div className="flex flex-col gap-0">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.icon];
          const colorClass =
            iconColorMap[activity.type] ?? "bg-secondary text-foreground";
          const isLast = index === activities.length - 1;

          return (
            <div key={activity.id} className="group flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all group-hover:scale-110 ${colorClass}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {!isLast && (
                  <div className="my-1 flex-1 bg-border/40 w-px" />
                )}
              </div>

              <div className={`flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold leading-snug text-foreground">
                    {activity.title}
                  </h3>
                  <span className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-muted-foreground/60">
                    {activity.time}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {activity.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
