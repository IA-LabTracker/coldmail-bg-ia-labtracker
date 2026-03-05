"use client";

import { WeekDay } from "@/types";
import { cn } from "@/lib/utils";

const DAYS: { value: WeekDay; label: string; short: string }[] = [
  { value: "mon", label: "Monday", short: "M" },
  { value: "tue", label: "Tuesday", short: "T" },
  { value: "wed", label: "Wednesday", short: "W" },
  { value: "thu", label: "Thursday", short: "T" },
  { value: "fri", label: "Friday", short: "F" },
  { value: "sat", label: "Saturday", short: "S" },
  { value: "sun", label: "Sunday", short: "S" },
];

const PRESETS = [
  { label: "Weekdays", days: ["mon", "tue", "wed", "thu", "fri"] as WeekDay[] },
  { label: "Weekends", days: ["sat", "sun"] as WeekDay[] },
  {
    label: "Mon/Wed/Fri",
    days: ["mon", "wed", "fri"] as WeekDay[],
  },
  {
    label: "Tue/Thu",
    days: ["tue", "thu"] as WeekDay[],
  },
  {
    label: "Every day",
    days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as WeekDay[],
  },
];

interface DaySelectorProps {
  selectedDays: WeekDay[];
  onChange: (days: WeekDay[]) => void;
}

export function DaySelector({ selectedDays, onChange }: DaySelectorProps) {
  const toggleDay = (day: WeekDay) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  const applyPreset = (preset: WeekDay[]) => {
    const isSamePreset =
      preset.length === selectedDays.length && preset.every((d) => selectedDays.includes(d));

    if (isSamePreset) {
      onChange([]);
    } else {
      onChange(preset);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {DAYS.map((day, idx) => (
          <button
            key={day.value}
            type="button"
            onClick={() => toggleDay(day.value)}
            title={day.label}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors",
              selectedDays.includes(day.value)
                ? "bg-primary text-primary-foreground"
                : "border border-input bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {day.short}
            {(idx === 1 || idx === 3 || idx === 5) && <span className="sr-only">{day.label}</span>}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => {
          const isActive =
            preset.days.length === selectedDays.length &&
            preset.days.every((d) => selectedDays.includes(d));

          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.days)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
