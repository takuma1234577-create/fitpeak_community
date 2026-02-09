import { Trophy } from "lucide-react";

interface StatsGridProps {
  benchMax: number;
  squatMax: number;
  deadliftMax: number;
}

export default function StatsGrid({
  benchMax,
  squatMax,
  deadliftMax,
}: StatsGridProps) {
  const big3Stats = [
    { label: "ベンチプレス", value: benchMax, unit: "kg" },
    { label: "スクワット", value: squatMax, unit: "kg" },
    { label: "デッドリフト", value: deadliftMax, unit: "kg" },
  ];

  return (
    <section className="px-5 py-6 sm:px-8">
      <div className="mb-5 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-gold" />
        <h2 className="text-lg font-extrabold tracking-tight text-foreground">
          BIG3 記録
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(big3Stats || []).map((stat) => (
          <div
            key={stat.label}
            className="relative rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-gold/20 sm:p-5"
          >
            <p className="mb-2 text-[10px] font-bold uppercase leading-tight tracking-wider text-muted-foreground sm:text-xs">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="tabular-nums text-3xl font-black leading-none text-foreground sm:text-4xl">
                {stat.value}
              </span>
              <span className="text-sm font-bold text-muted-foreground/70">
                {stat.unit}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
