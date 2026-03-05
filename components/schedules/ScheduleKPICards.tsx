"use client";

import { CalendarClock, Play, Pause, CheckCircle2 } from "lucide-react";
import { Schedule } from "@/types";

interface ScheduleKPICardsProps {
  schedules: Schedule[];
}

const kpiConfig = [
  {
    label: "Total Schedules",
    icon: CalendarClock,
    iconColor: "text-indigo-500",
    valueColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "bg-indigo-500/70",
    compute: (schedules: Schedule[]) => schedules.length,
    subtitle: "All schedules",
  },
  {
    label: "Active",
    icon: Play,
    iconColor: "text-green-500",
    valueColor: "text-green-600 dark:text-green-400",
    borderColor: "bg-green-500/70",
    compute: (schedules: Schedule[]) =>
      schedules.filter((s) => s.status === "active").length,
    subtitle: "Currently running",
  },
  {
    label: "Paused",
    icon: Pause,
    iconColor: "text-yellow-500",
    valueColor: "text-yellow-600 dark:text-yellow-400",
    borderColor: "bg-yellow-500/70",
    compute: (schedules: Schedule[]) =>
      schedules.filter((s) => s.status === "paused").length,
    subtitle: "Temporarily stopped",
  },
  {
    label: "Completed",
    icon: CheckCircle2,
    iconColor: "text-blue-500",
    valueColor: "text-blue-600 dark:text-blue-400",
    borderColor: "bg-blue-500/70",
    compute: (schedules: Schedule[]) =>
      schedules.filter((s) => s.status === "completed").length,
    subtitle: "Finished dispatches",
  },
];

export function ScheduleKPICards({ schedules }: ScheduleKPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        const value = kpi.compute(schedules);

        return (
          <div
            key={kpi.label}
            className="relative overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="px-5 pb-4 pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {kpi.label}
                  </p>
                  <p className={`mt-2 text-3xl font-bold ${kpi.valueColor}`}>{value}</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{kpi.subtitle}</p>
                </div>
                <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
            </div>
            <div className={`h-0.5 w-full ${kpi.borderColor}`} />
          </div>
        );
      })}
    </div>
  );
}
