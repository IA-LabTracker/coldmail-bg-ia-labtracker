"use client";

import { Dispatch, SetStateAction, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Email, Schedule, ScheduleStatus, SenderEmail } from "@/types";
import { supabase } from "@/lib/supabase";
import { computeNextRunAt, isFutureRun, resolveSelectedEmails } from "@/lib/scheduleLogic";
import { triggerScheduleWebhook } from "@/lib/scheduleWebhook";

export type SaveScheduleInput = Omit<
  Schedule,
  | "id"
  | "user_id"
  | "created_at"
  | "updated_at"
  | "leads_sent"
  | "last_run_at"
  | "next_run_at"
>;

interface UseScheduleActionsOptions {
  user: User | null;
  emails: Email[];
  senderEmails: SenderEmail[];
  webhookUrl: string | null;
  setSchedules: Dispatch<SetStateAction<Schedule[]>>;
}

function findSenderEmail(senderEmails: SenderEmail[], id: string | null): SenderEmail | null {
  if (!id) return null;
  return senderEmails.find((se) => se.id === id) ?? null;
}

function resolveWebhookUrl(webhookUrl: string | null): string | undefined {
  return webhookUrl?.trim() || process.env.NEXT_PUBLIC_WEBHOOK_N8N;
}

export function useScheduleActions({
  user,
  emails,
  senderEmails,
  webhookUrl,
  setSchedules,
}: UseScheduleActionsOptions) {
  const saveSchedule = useCallback(
    async (data: SaveScheduleInput, editingSchedule: Schedule | null) => {
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

        if (data.status === "active" && !isFutureRun(nextRunAt)) {
          toast.error("Invalid schedule date/time. Please choose a future time.");
          return;
        }

        const webhook = resolveWebhookUrl(webhookUrl);
        if (data.status === "active" && !webhook) {
          toast.error("Webhook URL not configured. Please configure it in Settings.");
          return;
        }

        const senderEmail = findSenderEmail(senderEmails, data.sender_email_id);

        if (editingSchedule) {
          const previous = editingSchedule;
          const updatedAt = new Date().toISOString();
          const nextRun = data.status === "active" ? nextRunAt : null;

          const { error: updateError } = await supabase
            .from("schedules")
            .update({
              ...data,
              total_leads: selectedEmails.length,
              next_run_at: nextRun,
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
                    next_run_at: nextRun,
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
                webhookUrl: webhook,
                senderEmail,
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
          if (inserted) setSchedules((prev) => [inserted, ...prev]);

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
                webhookUrl: webhook,
                senderEmail,
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
    },
    [user, emails, senderEmails, webhookUrl, setSchedules],
  );

  const toggleStatus = useCallback(
    async (schedule: Schedule) => {
      const newStatus: ScheduleStatus = schedule.status === "active" ? "paused" : "active";

      try {
        const webhook = resolveWebhookUrl(webhookUrl);
        let selectedEmails: Email[] = [];

        if (newStatus === "active") {
          if (!webhook) {
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

        if (newStatus === "active" && !isFutureRun(nextRunAt)) {
          toast.error("Invalid schedule date/time. Please edit and pick a future time.");
          return;
        }

        const previous = schedule;
        const updatedAt = new Date().toISOString();
        const resolvedNextRun = newStatus === "active" ? nextRunAt : null;

        const { error: updateError } = await supabase
          .from("schedules")
          .update({
            status: newStatus,
            next_run_at: resolvedNextRun,
            updated_at: updatedAt,
          })
          .eq("id", schedule.id);

        if (updateError) throw updateError;

        setSchedules((prev) =>
          prev.map((s) =>
            s.id === schedule.id
              ? { ...s, status: newStatus, next_run_at: resolvedNextRun, updated_at: updatedAt }
              : s,
          ),
        );

        if (newStatus === "active" && nextRunAt) {
          const senderEmail = findSenderEmail(senderEmails, schedule.sender_email_id);
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
              webhookUrl: webhook,
              senderEmail,
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
    [emails, senderEmails, webhookUrl, setSchedules],
  );

  const deleteSchedule = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase.from("schedules").delete().eq("id", id);
        if (deleteError) throw deleteError;
        setSchedules((prev) => prev.filter((s) => s.id !== id));
        toast.success("Schedule deleted");
        return true;
      } catch {
        toast.error("Failed to delete schedule");
        return false;
      }
    },
    [setSchedules],
  );

  return { saveSchedule, toggleStatus, deleteSchedule };
}
