"use client";

import {
  Calendar,
  Clock,
  Repeat,
  Users,
  Megaphone,
  Play,
  Pause,
  Trash2,
} from "lucide-react";
import { Schedule, WeekDay } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatScheduleDateLocal } from "@/lib/scheduleDates";

const WEEKDAY_LABELS: Record<WeekDay, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

interface ScheduleDetailModalProps {
  schedule: Schedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export function ScheduleDetailModal({
  schedule,
  open,
  onOpenChange,
  onEdit,
  onToggleStatus,
  onDelete,
}: ScheduleDetailModalProps) {
  if (!schedule) return null;

  const progressPercent =
    schedule.total_leads > 0
      ? Math.round((schedule.leads_sent / schedule.total_leads) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{schedule.name}</DialogTitle>
          <DialogDescription>
            Schedule details and progress overview
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Type</p>
              <div className="flex items-center gap-1.5 text-sm text-foreground">
                {schedule.type === "recurring" ? (
                  <>
                    <Repeat className="h-3.5 w-3.5 text-purple-500" />
                    Recurring
                  </>
                ) : (
                  <>
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    One-time
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Time</p>
              <div className="flex items-center gap-1.5 text-sm text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {schedule.scheduled_time}
              </div>
            </div>
          </div>

          {schedule.type === "one_time" && schedule.scheduled_date && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Scheduled Date</p>
              <p className="text-sm text-foreground">
                {formatScheduleDateLocal(schedule.scheduled_date, "en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          {schedule.type === "recurring" && schedule.recurring_days.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Recurring Days</p>
              <div className="flex flex-wrap gap-1.5">
                {schedule.recurring_days.map((day) => (
                  <Badge key={day} variant="secondary" className="text-xs">
                    {WEEKDAY_LABELS[day]}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Campaigns ({schedule.lead_selections.length})
            </p>
            <div className="space-y-1">
              {schedule.lead_selections.map((sel) => (
                <div
                  key={sel.campaignName}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5"
                >
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
                    {sel.campaignName}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {sel.allLeads ? "All leads" : `${sel.leadIds.length} lead(s)`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Progress</p>
              <p className="text-xs text-muted-foreground">
                {schedule.leads_sent} / {schedule.total_leads} ({progressPercent}%)
              </p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {schedule.next_run_at && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Next Run</p>
              <p className="text-sm text-foreground">
                {new Date(schedule.next_run_at).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {schedule.last_run_at && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Last Run</p>
              <p className="text-sm text-foreground">
                {new Date(schedule.last_run_at).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{schedule.name}&quot;? This action cannot be undone.
              </AlertDialogDescription>
              <div className="flex justify-between gap-3">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            {schedule.status !== "completed" && (
              <Button variant="outline" size="sm" onClick={onToggleStatus}>
                {schedule.status === "active" ? (
                  <>
                    <Pause className="mr-1.5 h-3.5 w-3.5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                    Activate
                  </>
                )}
              </Button>
            )}
            <Button size="sm" onClick={onEdit}>
              Edit Schedule
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
