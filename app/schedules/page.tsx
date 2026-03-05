"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Email, Schedule, ScheduleStatus, ScheduleType } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { ScheduleFilters } from "@/components/schedules/ScheduleFilters";
import { ScheduleCardList } from "@/components/schedules/ScheduleCardList";
import { CreateScheduleDialog } from "@/components/schedules/CreateScheduleDialog";
import { ScheduleDetailModal } from "@/components/schedules/ScheduleDetailModal";
import { DeleteScheduleDialog } from "@/components/schedules/DeleteScheduleDialog";
import { toast } from "sonner";

export default function SchedulesPage() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
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

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const [emailsResult, schedulesResult] = await Promise.all([
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
      ]);

      if (emailsResult.error) throw emailsResult.error;
      setEmails(emailsResult.data || []);

      if (schedulesResult.error) {
        // Table may not exist yet - start with empty state
        setSchedules([]);
      } else {
        setSchedules(schedulesResult.data || []);
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
        "id" | "user_id" | "created_at" | "updated_at" | "leads_sent" | "last_run_at" | "next_run_at"
      >
    ) => {
      if (!user) return;

      try {
        if (editingSchedule) {
          const { error: updateError } = await supabase
            .from("schedules")
            .update({
              ...data,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingSchedule.id);

          if (updateError) throw updateError;

          setSchedules((prev) =>
            prev.map((s) =>
              s.id === editingSchedule.id
                ? { ...s, ...data, updated_at: new Date().toISOString() }
                : s
            )
          );
          toast.success("Schedule updated successfully");
        } else {
          const newSchedule = {
            ...data,
            user_id: user.id,
            leads_sent: 0,
            last_run_at: null,
            next_run_at: null,
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
          toast.success("Schedule created successfully");
        }
      } catch (err) {
        toast.error(
          editingSchedule
            ? "Failed to update schedule"
            : "Failed to create schedule"
        );
      }

      setEditingSchedule(null);
    },
    [user, editingSchedule]
  );

  const handleToggleStatus = useCallback(
    async (schedule: Schedule) => {
      const newStatus: ScheduleStatus =
        schedule.status === "active" ? "paused" : "active";

      try {
        const { error: updateError } = await supabase
          .from("schedules")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", schedule.id);

        if (updateError) throw updateError;

        setSchedules((prev) =>
          prev.map((s) =>
            s.id === schedule.id
              ? { ...s, status: newStatus, updated_at: new Date().toISOString() }
              : s
          )
        );
        toast.success(
          newStatus === "active" ? "Schedule activated" : "Schedule paused"
        );
      } catch {
        toast.error("Failed to update schedule status");
      }
    },
    []
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
    [handleToggleStatus]
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
