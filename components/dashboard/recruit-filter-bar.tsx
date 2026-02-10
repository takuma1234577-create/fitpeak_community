"use client";

import { PREFECTURES } from "@/lib/constants";
import { BODY_PARTS, LEVELS } from "@/lib/recruit-constants";
import { safeArray } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type RecruitFilters = {
  area: string;
  bodyPart: string;
  level: string;
};

const DEFAULT_FILTERS: RecruitFilters = {
  area: "all",
  bodyPart: "all",
  level: "all",
};

type Props = {
  filters: RecruitFilters;
  onFiltersChange: (f: RecruitFilters) => void;
  onApply?: () => void;
};

export default function RecruitFilterBar({ filters, onFiltersChange, onApply }: Props) {
  return (
    <div className="flex flex-row flex-wrap items-center gap-2 sm:gap-3">
      <div className="flex shrink-0 items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">フィルター</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-row flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
        <Select
          value={filters.area}
          onValueChange={(v) => onFiltersChange({ ...filters, area: v })}
        >
          <SelectTrigger className="h-9 w-full min-w-0 border-border/60 bg-secondary/60 text-sm font-semibold sm:w-[140px] [&>span]:text-foreground">
            <SelectValue placeholder="エリア" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] border-border bg-card">
            <SelectItem value="all" className="font-medium focus:bg-gold/10 focus:text-gold">
              全エリア
            </SelectItem>
            {safeArray(PREFECTURES).map((p) => (
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

        <Select
          value={filters.bodyPart}
          onValueChange={(v) => onFiltersChange({ ...filters, bodyPart: v })}
        >
          <SelectTrigger className="h-9 w-full min-w-0 border-border/60 bg-secondary/60 text-sm font-semibold sm:w-[120px] [&>span]:text-foreground">
            <SelectValue placeholder="部位" />
          </SelectTrigger>
          <SelectContent className="border-border bg-card">
            {safeArray(BODY_PARTS).map((part) => (
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

        <Select
          value={filters.level}
          onValueChange={(v) => onFiltersChange({ ...filters, level: v })}
        >
          <SelectTrigger className="h-9 w-full min-w-0 border-border/60 bg-secondary/60 text-sm font-semibold sm:w-[130px] [&>span]:text-foreground">
            <SelectValue placeholder="レベル" />
          </SelectTrigger>
          <SelectContent className="border-border bg-card">
            {safeArray(LEVELS).map((level) => (
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

        {onApply && (
          <button
            type="button"
            onClick={onApply}
            className="h-9 shrink-0 rounded-lg border border-gold/50 bg-gold/10 px-4 text-sm font-bold text-foreground transition-colors hover:bg-gold/20"
          >
            絞り込み
          </button>
        )}
      </div>
    </div>
  );
}

export { DEFAULT_FILTERS };
