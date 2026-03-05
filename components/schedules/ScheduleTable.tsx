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
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Schedule, ScheduleStatus, ScheduleType, WeekDay } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface ScheduleTableProps {
  schedules: Schedule[];
  searchFilter: string;
  statusFilter: ScheduleStatus | "all";
  typeFilter: ScheduleType | "all";
  onEdit: (schedule: Schedule) => void;
  onToggleStatus: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
}

export function ScheduleTable({
  schedules,
  searchFilter,
  statusFilter,
  typeFilter,
  onEdit,
  onToggleStatus,
  onDelete,
}: ScheduleTableProps) {
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
        <p className="text-lg font-medium text-muted-foreground">No schedules found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new schedule to start sending dispatches
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted">
            <TableHead>Schedule</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>When</TableHead>
            <TableHead className="text-center">Leads</TableHead>
            <TableHead className="text-center">Sent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Next Run</TableHead>
            <TableHead className="w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((schedule) => {
            const statusCfg = STATUS_CONFIG[schedule.status];
            const StatusIcon = statusCfg.icon;

            return (
              <TableRow
                key={schedule.id}
                className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
                onClick={() => onEdit(schedule)}
              >
                <TableCell>
                  <div>
                    <span className="font-semibold text-foreground">{schedule.name}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {schedule.lead_selections.length} campaign(s)
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {schedule.type === "recurring" ? (
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <Repeat className="h-3.5 w-3.5 text-purple-500" />
                      Recurring
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" />
                      One-time
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      {schedule.type === "recurring" ? (
                        <span>{formatRecurringDays(schedule.recurring_days)}</span>
                      ) : (
                        <span>
                          {schedule.scheduled_date
                            ? new Date(schedule.scheduled_date).toLocaleDateString("en-US")
                            : "-"}
                        </span>
                      )}
                      <span className="ml-1.5 text-muted-foreground">
                        {schedule.scheduled_time}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium text-foreground">
                    {schedule.total_leads}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium text-foreground">
                    {schedule.leads_sent}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`gap-1 ${statusCfg.className}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusCfg.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-foreground">
                  {schedule.next_run_at
                    ? new Date(schedule.next_run_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
