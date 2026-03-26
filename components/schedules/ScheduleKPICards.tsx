"use client";

import { CalendarClock, Play, Pause, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import { Schedule } from "@/types";
import { MiniSparkline } from "@/components/shared/MiniSparkline";
import { generateSparkline } from "@/lib/sparkline";

interface ScheduleKPICardsProps {
  schedules: Schedule[];
}

const kpiConfig = [
  {
    label: "Total Schedules",
    icon: CalendarClock,
    color: "#6366f1",
    text: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/8 dark:bg-indigo-500/10",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
    border: "border-indigo-200/60 dark:border-indigo-800/30",
    compute: (schedules: Schedule[]) => schedules.length,
    filterFn: () => true,
  },
  {
    label: "Active",
    icon: Play,
    color: "#22c55e",
    text: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/8 dark:bg-green-500/10",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200/60 dark:border-green-800/30",
    compute: (schedules: Schedule[]) =>
      schedules.filter((s) => s.status === "active").length,
    filterFn: (s: Schedule) => s.status === "active",
  },
  {
    label: "Paused",
    icon: Pause,
    color: "#eab308",
    text: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500/8 dark:bg-yellow-500/10",
    iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
    border: "border-yellow-200/60 dark:border-yellow-800/30",
    compute: (schedules: Schedule[]) =>
      schedules.filter((s) => s.status === "paused").length,
    filterFn: (s: Schedule) => s.status === "paused",
  },
  {
    label: "Completed",
    icon: CheckCircle2,
    color: "#3b82f6",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/8 dark:bg-blue-500/10",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200/60 dark:border-blue-800/30",
    compute: (schedules: Schedule[]) =>
      schedules.filter((s) => s.status === "completed").length,
    filterFn: (s: Schedule) => s.status === "completed",
  },
];

export function ScheduleKPICards({ schedules }: ScheduleKPICardsProps) {
  const sparklines = useMemo(() => {
    return kpiConfig.map((kpi) => {
      const filtered = schedules.filter(kpi.filterFn);
      return generateSparkline(filtered, (s) => s.created_at);
    });
  }, [schedules]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpiConfig.map((kpi, idx) => {
        const Icon = kpi.icon;
        const value = kpi.compute(schedules);

        return (
          <div
            key={kpi.label}
            className={`
              card-hover sparkline-hover
              relative overflow-hidden rounded-xl border
              ${kpi.border} ${kpi.bg}
              backdrop-blur-sm
              animate-fade-up stagger-${idx + 1}
            `}
          >
            <div className="flex items-center justify-between px-4 pt-3.5">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${kpi.iconBg}`}>
                  <Icon className={`h-3.5 w-3.5 ${kpi.text}`} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
              </div>
            </div>
            <div className="px-4 pt-1">
              <span className={`text-2xl font-bold tracking-tight ${kpi.text}`}>
                {value.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 h-8 px-1">
              <MiniSparkline data={sparklines[idx]} color={kpi.color} height={28} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
