"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Email, Schedule, ScheduleStatus, ScheduleType, SenderEmail } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { ScheduleFilters } from "@/components/schedules/ScheduleFilters";
import { ScheduleCardList } from "@/components/schedules/ScheduleCardList";
import { ScheduleKPICards } from "@/components/schedules/ScheduleKPICards";
import { CreateScheduleDialog } from "@/components/schedules/CreateScheduleDialog";
import { ScheduleDetailModal } from "@/components/schedules/ScheduleDetailModal";
import { DeleteScheduleDialog } from "@/components/schedules/DeleteScheduleDialog";
import { SchedulesPageSkeleton } from "@/components/schedules/SchedulesPageSkeleton";
import { useScheduleActions } from "@/hooks/useScheduleActions";

export default function SchedulesPage() {
  const { user } = useAuth();

  const [emails, setEmails] = useState<Email[]>([]);
  const [senderEmails, setSenderEmails] = useState<SenderEmail[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScheduleStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ScheduleType | "all">("all");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [detailSchedule, setDetailSchedule] = useState<Schedule | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);

  const { saveSchedule, toggleStatus, deleteSchedule } = useScheduleActions({
    user,
    emails,
    senderEmails,
    webhookUrl,
    setSchedules,
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const [emailsResult, schedulesResult, settingsResult, senderEmailsResult] = await Promise.all(
        [
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
          supabase
            .from("sender_emails")
            .select("*")
            .eq("user_id", user.id)
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: false }),
        ],
      );

      if (emailsResult.error) throw emailsResult.error;
      setEmails(emailsResult.data ?? []);

      // Schedules table may not exist yet — swallow and start empty.
      setSchedules(schedulesResult.error ? [] : schedulesResult.data ?? []);

      if (!senderEmailsResult.error) setSenderEmails(senderEmailsResult.data ?? []);
      if (!settingsResult.error) {
        setWebhookUrl(settingsResult.data?.webhook_url?.trim() || null);
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
    async (data: Parameters<typeof saveSchedule>[0]) => {
      await saveSchedule(data, editingSchedule);
      setEditingSchedule(null);
    },
    [saveSchedule, editingSchedule],
  );

  const handleOpenCreate = useCallback(() => {
    setEditingSchedule(null);
    setCreateDialogOpen(true);
  }, []);

  const handleOpenDetail = useCallback((schedule: Schedule) => {
    setDetailSchedule(schedule);
    setDetailOpen(true);
  }, []);

  const handleEditFromDetail = useCallback(() => {
    if (!detailSchedule) return;
    setDetailOpen(false);
    setEditingSchedule(detailSchedule);
    setCreateDialogOpen(true);
  }, [detailSchedule]);

  const handleToggleFromDetail = useCallback(() => {
    if (!detailSchedule) return;
    toggleStatus(detailSchedule);
    setDetailOpen(false);
  }, [detailSchedule, toggleStatus]);

  const handleDeleteFromDetail = useCallback(() => {
    if (!detailSchedule) return;
    setDetailOpen(false);
    setDeleteTarget(detailSchedule);
  }, [detailSchedule]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const ok = await deleteSchedule(deleteTarget.id);
    if (ok) {
      setDetailOpen(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteSchedule]);

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
          <SchedulesPageSkeleton />
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
              onEdit={handleOpenDetail}
              onToggleStatus={toggleStatus}
              onDelete={setDeleteTarget}
            />
          </>
        )}
      </div>

      <CreateScheduleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        emails={emails}
        senderEmails={senderEmails}
        editingSchedule={editingSchedule}
        onSave={handleSaveSchedule}
      />

      <ScheduleDetailModal
        schedule={detailSchedule}
        senderEmails={senderEmails}
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
        onConfirm={handleConfirmDelete}
      />
    </AppLayout>
  );
}
