"use client";

import { useMemo } from "react";
import {
  Clock,
  Calendar,
  Repeat,
  Play,
  Pause,
  CheckCircle2,
  FileEdit,
  Users,
  Megaphone,
  MoreHorizontal,
  Trash2,
  Send,
} from "lucide-react";
import { Schedule, ScheduleStatus, ScheduleType, WeekDay } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const WEEKDAY_LABELS: Record<WeekDay, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const STATUS_CONFIG: Record<
  ScheduleStatus,
  { label: string; className: string; icon: typeof Play }
> = {
  active: {
    label: "Active",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: Play,
  },
  paused: {
    label: "Paused",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Pause,
  },
  completed: {
    label: "Completed",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: CheckCircle2,
  },
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    icon: FileEdit,
  },
};

function formatRecurringDays(days: WeekDay[]): string {
  if (days.length === 7) return "Every day";
  if (days.length === 5 && !days.includes("sat") && !days.includes("sun"))
    return "Weekdays";
  if (days.length === 2 && days.includes("sat") && days.includes("sun"))
    return "Weekends";
  return days.map((d) => WEEKDAY_LABELS[d]).join(", ");
}

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${ampm}`;
}

interface ScheduleCardListProps {
  schedules: Schedule[];
  searchFilter: string;
  statusFilter: ScheduleStatus | "all";
  typeFilter: ScheduleType | "all";
  onEdit: (schedule: Schedule) => void;
  onToggleStatus: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
}

export function ScheduleCardList({
  schedules,
  searchFilter,
  statusFilter,
  typeFilter,
  onEdit,
  onToggleStatus,
  onDelete,
}: ScheduleCardListProps) {
  const filtered = useMemo(() => {
    let result = schedules;

    if (searchFilter) {
      const lower = searchFilter.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(lower));
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (typeFilter !== "all") {
      result = result.filter((s) => s.type === typeFilter);
    }

    return result;
  }, [schedules, searchFilter, statusFilter, typeFilter]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16">
        <CalendarEmpty />
        <p className="mt-3 text-lg font-medium text-muted-foreground">No schedules found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new schedule to start sending dispatches
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((schedule) => {
        const statusCfg = STATUS_CONFIG[schedule.status];
        const StatusIcon = statusCfg.icon;
        const progressPercent =
          schedule.total_leads > 0
            ? Math.round((schedule.leads_sent / schedule.total_leads) * 100)
            : 0;

        return (
          <div
            key={schedule.id}
            className="group cursor-pointer rounded-xl border border-border bg-card transition-colors hover:border-primary/30"
            onClick={() => onEdit(schedule)}
          >
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {schedule.name}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`gap-1 text-[11px] ${statusCfg.className}`}
                    >
                      <StatusIcon className="h-2.5 w-2.5" />
                      {statusCfg.label}
                    </Badge>
                    {schedule.type === "recurring" ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Repeat className="h-3 w-3" />
                        Recurring
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        One-time
                      </span>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(schedule);
                      }}
                    >
                      <FileEdit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {schedule.status !== "completed" && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(schedule);
                        }}
                      >
                        {schedule.status === "active" ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(schedule);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  {schedule.type === "recurring" ? (
                    <span>
                      {formatRecurringDays(schedule.recurring_days)} at{" "}
                      {formatTime12h(schedule.scheduled_time)}
                    </span>
                  ) : (
                    <span>
                      {schedule.scheduled_date
                        ? new Date(schedule.scheduled_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "No date"}{" "}
                      at {formatTime12h(schedule.scheduled_time)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Megaphone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{schedule.lead_selections.length} campaign(s)</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{schedule.total_leads} lead(s)</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Send className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    {schedule.leads_sent} sent ({progressPercent}%)
                  </span>
                </div>
              </div>

              {schedule.total_leads > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {schedule.next_run_at && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Next run:{" "}
                  {new Date(schedule.next_run_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarEmpty() {
  return (
    <Calendar className="h-10 w-10 text-muted-foreground/40" />
  );
}
