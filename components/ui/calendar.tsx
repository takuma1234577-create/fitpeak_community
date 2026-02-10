"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ja } from "react-day-picker/locale";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const navBtnBase = "absolute h-7 w-7 rounded-md border border-border bg-transparent p-0 opacity-70 hover:opacity-100 inline-flex items-center justify-center";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = ja,
  captionLayout = "dropdown",
  navLayout = "around",
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={locale}
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      navLayout={navLayout}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous: cn(navBtnBase, "left-1"),
        button_next: cn(navBtnBase, "right-1"),
        dropdowns: "flex items-center gap-1",
        dropdown_root: "relative",
        dropdown: "rounded-md border border-border bg-secondary/80 px-2 py-1 text-sm font-medium text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md",
        day_button: cn(
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-md",
          "hover:bg-gold/20 focus:bg-gold/20 focus:outline-none"
        ),
        range_end: "day-range-end",
        selected:
          "bg-gold text-[#050505] hover:bg-gold hover:text-[#050505] focus:bg-gold focus:text-[#050505]",
        today: "bg-gold/20 text-foreground",
        outside:
          "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        range_middle: "aria-selected:bg-gold/10 aria-selected:text-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
