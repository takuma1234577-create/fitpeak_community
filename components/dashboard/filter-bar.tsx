"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";
import { PREFECTURES } from "@/lib/constants";

export const bodyParts = [
  { value: "all", label: "全部位" },
  { value: "chest", label: "胸" },
  { value: "back", label: "背中" },
  { value: "legs", label: "脚" },
  { value: "shoulders", label: "肩" },
  { value: "arms", label: "腕" },
  { value: "full", label: "全身" },
];

const levels = [
  { value: "all", label: "全レベル" },
  { value: "beginner", label: "初心者" },
  { value: "intermediate", label: "中級者" },
  { value: "advanced", label: "上級者" },
  { value: "competitor", label: "大会勢" },
];

export default function FilterBar() {
  const [prefecture, setPrefecture] = useState<string>("all");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">フィルター</span>
      </div>

      <div className="flex flex-1 flex-wrap gap-2">
        <Select value={prefecture} onValueChange={setPrefecture}>
          <SelectTrigger className="h-9 w-full border-border/60 bg-secondary/60 text-sm font-semibold focus:border-gold/50 focus:ring-gold/20 sm:w-[160px] [&>span]:text-foreground">
            <SelectValue placeholder="都道府県" />
          </SelectTrigger>
          <SelectContent className="border-border bg-card max-h-[300px]">
            <SelectItem value="all" className="font-medium focus:bg-gold/10 focus:text-gold">
              全県
            </SelectItem>
            {PREFECTURES.map((p) => (
              <SelectItem
                key={p}
                value={p}
                className="font-medium focus:bg-gold/10 focus:text-gold"
              >
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="h-9 w-full border-border/60 bg-secondary/60 text-sm font-semibold focus:border-gold/50 focus:ring-gold/20 sm:w-[130px] [&>span]:text-foreground">
            <SelectValue placeholder="部位" />
          </SelectTrigger>
          <SelectContent className="border-border bg-card">
            {bodyParts.map((part) => (
              <SelectItem
                key={part.value}
                value={part.value}
                className="font-medium focus:bg-gold/10 focus:text-gold"
              >
                {part.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="h-9 w-full border-border/60 bg-secondary/60 text-sm font-semibold focus:border-gold/50 focus:ring-gold/20 sm:w-[140px] [&>span]:text-foreground">
            <SelectValue placeholder="レベル" />
          </SelectTrigger>
          <SelectContent className="border-border bg-card">
            {levels.map((level) => (
              <SelectItem
                key={level.value}
                value={level.value}
                className="font-medium focus:bg-gold/10 focus:text-gold"
              >
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
