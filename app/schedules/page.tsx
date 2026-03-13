"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Email, Schedule, ScheduleStatus, ScheduleType, WeekDay } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { ScheduleFilters } from "@/components/schedules/ScheduleFilters";
import { ScheduleCardList } from "@/components/schedules/ScheduleCardList";
import { ScheduleKPICards } from "@/components/schedules/ScheduleKPICards";
import { CreateScheduleDialog } from "@/components/schedules/CreateScheduleDialog";
import { ScheduleDetailModal } from "@/components/schedules/ScheduleDetailModal";
import { DeleteScheduleDialog } from "@/components/schedules/DeleteScheduleDialog";
import { parseScheduleDateLocal } from "@/lib/scheduleDates";
import { toast } from "sonner";

const WEEKDAY_INDEX: Record<WeekDay, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function resolveSelectedEmails(emails: Email[], selections: Schedule["lead_selections"]): Email[] {
  const selected = new Map<string, Email>();

  for (const selection of selections) {
    const campaignName = selection.campaignName;
    const campaignEmails = emails.filter(
      (e) => (e.campaign_name || "No Campaign") === campaignName,
    );

    if (selection.allLeads) {
      for (const email of campaignEmails) {
        selected.set(email.id, email);
      }
      continue;
    }

    const idSet = new Set(selection.leadIds);
    for (const email of campaignEmails) {
      if (idSet.has(email.id)) {
        selected.set(email.id, email);
      }
    }
  }

  return Array.from(selected.values());
}

function computeNextRunAt(schedule: {
  type: ScheduleType;
  scheduled_date: string | null;
  scheduled_time: string;
  recurring_days: WeekDay[];
}): string | null {
  const [h, m] = schedule.scheduled_time.split(":");
  const hour = Number(h);
  const minute = Number(m);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  if (schedule.type === "one_time") {
    if (!schedule.scheduled_date) return null;
    const base = parseScheduleDateLocal(schedule.scheduled_date);
    if (!base) return null;
    if (Number.isNaN(base.getTime())) return null;
    base.setHours(hour, minute, 0, 0);
    return base.toISOString();
  }

  if (schedule.recurring_days.length === 0) return null;

  const now = new Date();
  const targetDays = new Set(schedule.recurring_days.map((d) => WEEKDAY_INDEX[d]));

  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    candidate.setHours(hour, minute, 0, 0);

    if (!targetDays.has(candidate.getDay())) continue;
    if (candidate.getTime() <= now.getTime()) continue;

    return candidate.toISOString();
  }

  return null;
}

async function triggerScheduleWebhook(params: {
  scheduleId: string;
  scheduleName: string;
  scheduleType: ScheduleType;
  scheduledDate: string | null;
  scheduledTime: string;
  recurringDays: WeekDay[];
  nextRunAt: string;
  emails: Email[];
  webhookUrl?: string | null;
}) {
  const resolvedWebhookUrl = params.webhookUrl?.trim() || process.env.NEXT_PUBLIC_WEBHOOK_N8N;

  if (!resolvedWebhookUrl) {
    throw new Error("Webhook URL not configured. Please configure it in Settings.");
  }

  const response = await fetch(resolvedWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      schedule: true,
      date: params.nextRunAt,
      schedule_id: params.scheduleId,
      schedule_name: params.scheduleName,
      schedule_type: params.scheduleType,
      scheduled_date: params.scheduledDate,
      scheduled_time: params.scheduledTime,
      recurring_days: params.recurringDays,
      emails: params.emails,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const details = errorText ? `: ${errorText}` : "";
    throw new Error(`Failed to trigger webhook${details}`);
  }
}

export default function SchedulesPage() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);

  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScheduleStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ScheduleType | "all">("all");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [detailSchedule, setDetailSchedule] = useState<Schedule | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const [emailsResult, schedulesResult, settingsResult] = await Promise.all([
        supabase
          .from("emails")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("schedules")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("settings").select("webhook_url").eq("user_id", user.id).maybeSingle(),
      ]);

      if (emailsResult.error) throw emailsResult.error;
      setEmails(emailsResult.data || []);

      if (schedulesResult.error) {
        // Table may not exist yet - start with empty state
        setSchedules([]);
      } else {
        setSchedules(schedulesResult.data || []);
      }

      if (!settingsResult.error) {
        const configuredUrl = settingsResult.data?.webhook_url?.trim() || null;
        setWebhookUrl(configuredUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveSchedule = useCallback(
    async (
      data: Omit<
        Schedule,
        | "id"
        | "user_id"
        | "created_at"
        | "updated_at"
        | "leads_sent"
        | "last_run_at"
        | "next_run_at"
      >,
    ) => {
      if (!user) return;

      try {
        const selectedEmails = resolveSelectedEmails(emails, data.lead_selections);
        if (selectedEmails.length === 0) {
          toast.error("No leads selected for this schedule.");
          return;
        }
        const nextRunAt = computeNextRunAt({
          type: data.type,
          scheduled_date: data.scheduled_date,
          scheduled_time: data.scheduled_time,
          recurring_days: data.recurring_days,
        });
        const isFutureRun = nextRunAt && new Date(nextRunAt).getTime() > Date.now();

        if (data.status === "active") {
          if (!nextRunAt || !isFutureRun) {
            toast.error("Invalid schedule date/time. Please choose a future time.");
            return;
          }
        }

        const resolvedWebhookUrl = webhookUrl?.trim() || process.env.NEXT_PUBLIC_WEBHOOK_N8N;

        if (data.status === "active" && !resolvedWebhookUrl) {
          toast.error("Webhook URL not configured. Please configure it in Settings.");
          return;
        }

        if (editingSchedule) {
          const previous = editingSchedule;
          const updatedAt = new Date().toISOString();
          const { error: updateError } = await supabase
            .from("schedules")
            .update({
              ...data,
              total_leads: selectedEmails.length,
              next_run_at: data.status === "active" ? nextRunAt : null,
              updated_at: updatedAt,
            })
            .eq("id", editingSchedule.id);

          if (updateError) throw updateError;

          setSchedules((prev) =>
            prev.map((s) =>
              s.id === editingSchedule.id
                ? {
                    ...s,
                    ...data,
                    total_leads: selectedEmails.length,
                    next_run_at: data.status === "active" ? nextRunAt : null,
                    updated_at: updatedAt,
                  }
                : s,
            ),
          );

          if (data.status === "active" && nextRunAt) {
            try {
              await triggerScheduleWebhook({
                scheduleId: editingSchedule.id,
                scheduleName: data.name,
                scheduleType: data.type,
                scheduledDate: data.scheduled_date,
                scheduledTime: data.scheduled_time,
                recurringDays: data.recurring_days,
                nextRunAt,
                emails: selectedEmails,
                webhookUrl: resolvedWebhookUrl,
              });
            } catch (webhookError) {
              const rollbackAt = new Date().toISOString();
              await supabase
                .from("schedules")
                .update({
                  name: previous.name,
                  type: previous.type,
                  status: previous.status,
                  scheduled_date: previous.scheduled_date,
                  scheduled_time: previous.scheduled_time,
                  recurring_days: previous.recurring_days,
                  lead_selections: previous.lead_selections,
                  total_leads: previous.total_leads,
                  next_run_at: previous.next_run_at,
                  updated_at: rollbackAt,
                })
                .eq("id", previous.id);

              setSchedules((prev) =>
                prev.map((s) =>
                  s.id === previous.id ? { ...previous, updated_at: rollbackAt } : s,
                ),
              );

              throw webhookError;
            }
          }

          toast.success("Schedule updated successfully");
        } else {
          const newSchedule = {
            ...data,
            user_id: user.id,
            leads_sent: 0,
            last_run_at: null,
            next_run_at: data.status === "active" ? nextRunAt : null,
            total_leads: selectedEmails.length,
          };

          const { data: inserted, error: insertError } = await supabase
            .from("schedules")
            .insert(newSchedule)
            .select()
            .single();

          if (insertError) throw insertError;

          if (inserted) {
            setSchedules((prev) => [inserted, ...prev]);
          }

          if (inserted && data.status === "active" && nextRunAt) {
            try {
              await triggerScheduleWebhook({
                scheduleId: inserted.id,
                scheduleName: data.name,
                scheduleType: data.type,
                scheduledDate: data.scheduled_date,
                scheduledTime: data.scheduled_time,
                recurringDays: data.recurring_days,
                nextRunAt,
                emails: selectedEmails,
                webhookUrl: resolvedWebhookUrl,
              });
            } catch (webhookError) {
              await supabase.from("schedules").delete().eq("id", inserted.id);
              setSchedules((prev) => prev.filter((s) => s.id !== inserted.id));
              throw webhookError;
            }
          }

          toast.success("Schedule created successfully");
        }
      } catch (err) {
        const baseMessage = editingSchedule
          ? "Failed to update schedule"
          : "Failed to create schedule";
        const detail = err instanceof Error && err.message ? `: ${err.message}` : "";
        toast.error(`${baseMessage}${detail}`);
      }

      setEditingSchedule(null);
    },
    [user, editingSchedule, emails, webhookUrl],
  );

  const handleToggleStatus = useCallback(
    async (schedule: Schedule) => {
      const newStatus: ScheduleStatus = schedule.status === "active" ? "paused" : "active";

      try {
        const resolvedWebhookUrl = webhookUrl?.trim() || process.env.NEXT_PUBLIC_WEBHOOK_N8N;

        let selectedEmails: Email[] = [];
        if (newStatus === "active") {
          if (!resolvedWebhookUrl) {
            toast.error("Webhook URL not configured. Please configure it in Settings.");
            return;
          }
          selectedEmails = resolveSelectedEmails(emails, schedule.lead_selections);
          if (selectedEmails.length === 0) {
            toast.error("No leads selected for this schedule.");
            return;
          }
        }

        const nextRunAt =
          newStatus === "active"
            ? computeNextRunAt({
                type: schedule.type,
                scheduled_date: schedule.scheduled_date,
                scheduled_time: schedule.scheduled_time,
                recurring_days: schedule.recurring_days,
              })
            : null;
        const isFutureRun = nextRunAt && new Date(nextRunAt).getTime() > Date.now();

        if (newStatus === "active" && (!nextRunAt || !isFutureRun)) {
          toast.error("Invalid schedule date/time. Please edit and pick a future time.");
          return;
        }

        const previous = schedule;
        const updatedAt = new Date().toISOString();
        const { error: updateError } = await supabase
          .from("schedules")
          .update({
            status: newStatus,
            next_run_at: newStatus === "active" ? nextRunAt : null,
            updated_at: updatedAt,
          })
          .eq("id", schedule.id);

        if (updateError) throw updateError;

        setSchedules((prev) =>
          prev.map((s) =>
            s.id === schedule.id
              ? {
                  ...s,
                  status: newStatus,
                  next_run_at: newStatus === "active" ? nextRunAt : null,
                  updated_at: updatedAt,
                }
              : s,
          ),
        );

        if (newStatus === "active" && nextRunAt) {
          try {
            await triggerScheduleWebhook({
              scheduleId: schedule.id,
              scheduleName: schedule.name,
              scheduleType: schedule.type,
              scheduledDate: schedule.scheduled_date,
              scheduledTime: schedule.scheduled_time,
              recurringDays: schedule.recurring_days,
              nextRunAt,
              emails: selectedEmails,
              webhookUrl: resolvedWebhookUrl,
            });
          } catch (webhookError) {
            const rollbackAt = new Date().toISOString();
            await supabase
              .from("schedules")
              .update({
                status: previous.status,
                next_run_at: previous.next_run_at,
                updated_at: rollbackAt,
              })
              .eq("id", previous.id);

            setSchedules((prev) =>
              prev.map((s) =>
                s.id === previous.id
                  ? {
                      ...s,
                      status: previous.status,
                      next_run_at: previous.next_run_at,
                      updated_at: rollbackAt,
                    }
                  : s,
              ),
            );

            throw webhookError;
          }
        }

        toast.success(newStatus === "active" ? "Schedule activated" : "Schedule paused");
      } catch (err) {
        const detail = err instanceof Error && err.message ? `: ${err.message}` : "";
        toast.error(`Failed to update schedule status${detail}`);
      }
    },
    [emails, webhookUrl],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      const { error: deleteError } = await supabase
        .from("schedules")
        .delete()
        .eq("id", deleteTarget.id);

      if (deleteError) throw deleteError;

      setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDetailOpen(false);
      setDeleteTarget(null);
      toast.success("Schedule deleted");
    } catch {
      toast.error("Failed to delete schedule");
    }
  }, [deleteTarget]);

  const handleEditFromDetail = useCallback(() => {
    if (!detailSchedule) return;
    setDetailOpen(false);
    setEditingSchedule(detailSchedule);
    setCreateDialogOpen(true);
  }, [detailSchedule]);

  const handleToggleFromDetail = useCallback(() => {
    if (!detailSchedule) return;
    handleToggleStatus(detailSchedule);
    setDetailOpen(false);
  }, [detailSchedule, handleToggleStatus]);

  const handleDeleteFromDetail = useCallback(() => {
    if (!detailSchedule) return;
    setDetailOpen(false);
    setDeleteTarget(detailSchedule);
  }, [detailSchedule]);

  const handleOpenCreate = useCallback(() => {
    setEditingSchedule(null);
    setCreateDialogOpen(true);
  }, []);

  const handleTableEdit = useCallback((schedule: Schedule) => {
    setDetailSchedule(schedule);
    setDetailOpen(true);
  }, []);

  const handleTableToggle = useCallback(
    (schedule: Schedule) => {
      handleToggleStatus(schedule);
    },
    [handleToggleStatus],
  );

  const handleTableDelete = useCallback((schedule: Schedule) => {
    setDeleteTarget(schedule);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Schedules</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Schedule and automate your email dispatches
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Schedule
          </Button>
        </div>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <ScheduleKPICards schedules={schedules} />

            <ScheduleFilters
              search={searchFilter}
              onSearchChange={setSearchFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
            />

            <ScheduleCardList
              schedules={schedules}
              searchFilter={searchFilter}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              onEdit={handleTableEdit}
              onToggleStatus={handleTableToggle}
              onDelete={handleTableDelete}
            />
          </>
        )}
      </div>

      <CreateScheduleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        emails={emails}
        editingSchedule={editingSchedule}
        onSave={handleSaveSchedule}
      />

      <ScheduleDetailModal
        schedule={detailSchedule}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEditFromDetail}
        onToggleStatus={handleToggleFromDetail}
        onDelete={handleDeleteFromDetail}
      />

      <DeleteScheduleDialog
        schedule={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />
    </AppLayout>
  );
}
