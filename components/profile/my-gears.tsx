"use client";

import Image from "next/image";
import { useRef } from "react";
import { Wrench, ChevronLeft, ChevronRight } from "lucide-react";

const gears = [
  {
    name: "FITPEAK リストラップ Pro",
    category: "リストラップ",
    image: "/placeholder.svg",
  },
  {
    name: "FITPEAK パワーベルト Elite",
    category: "ベルト",
    image: "/placeholder.svg",
  },
  {
    name: "FITPEAK ニースリーブ X",
    category: "ニースリーブ",
    image: "/placeholder.svg",
  },
  {
    name: "FITPEAK エルボースリーブ",
    category: "エルボースリーブ",
    image: "/placeholder.svg",
  },
  {
    name: "FITPEAK リキッドチョーク",
    category: "チョーク",
    image: "/placeholder.svg",
  },
];

export default function MyGears() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 220;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-6">
      <div className="mb-5 flex items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">
            愛用ギア
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-secondary text-muted-foreground transition-colors hover:border-gold/30 hover:text-foreground"
            aria-label="左にスクロール"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-secondary text-muted-foreground transition-colors hover:border-gold/30 hover:text-foreground"
            aria-label="右にスクロール"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-3 overflow-x-auto px-5 pb-2 sm:px-8"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {gears.map((gear) => (
          <div
            key={gear.name}
            className="group w-40 flex-shrink-0 overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 sm:w-48"
          >
            <div className="relative aspect-square overflow-hidden bg-secondary">
              <Image
                src={gear.image || "/placeholder.svg"}
                alt={gear.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
            </div>
            <div className="p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gold/70">
                {gear.category}
              </p>
              <p className="line-clamp-2 text-xs font-bold leading-snug text-foreground">
                {gear.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
