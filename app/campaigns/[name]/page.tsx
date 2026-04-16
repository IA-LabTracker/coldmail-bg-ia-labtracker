"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Email } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { EmailDetailModal } from "@/components/dashboard/EmailDetailModal";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { AlertModal } from "@/components/shared/AlertModal";
import { EmailListTable } from "@/components/shared/EmailListTable";
import { EmailFilters } from "@/components/dashboard/EmailFilters";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useEmailSelection } from "@/hooks/useEmailSelection";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { ArrowLeft, Mail, Send, MessageSquare, Flame, Eye, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MiniSparkline } from "@/components/shared/MiniSparkline";
import { generateSparkline } from "@/lib/sparkline";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const campaignName = decodeURIComponent(params.name as string);

  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("");
  const [clientStepFilter, setClientStepFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const [selectedDetailEmail, setSelectedDetailEmail] = useState<Email | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Email | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  const {
    selectedIds,
    selectedEmails,
    isAllSelected,
    toggleEmailSelection,
    toggleSelectAllVisible,
    clearSelection,
  } = useEmailSelection(emails);

  const fetchEmails = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("emails")
        .select("*")
        .eq("user_id", user.id)
        .eq("campaign_name", campaignName)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setEmails(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaign emails");
    } finally {
      setLoading(false);
    }
  }, [user, campaignName]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const filteredEmails = useMemo(() => {
    let filtered = emails;

    if (searchFilter) {
      const lower = searchFilter.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.company.toLowerCase().includes(lower) ||
          e.email.toLowerCase().includes(lower) ||
          (e.lead_name || "").toLowerCase().includes(lower) ||
          (e.lead_category || "").toLowerCase().includes(lower),
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    if (classificationFilter) {
      filtered = filtered.filter((e) => e.lead_classification === classificationFilter);
    }

    if (clientStepFilter) {
      filtered = filtered.filter((e) => e.client_step === clientStepFilter);
    }

    if (dateRangeFilter?.from) {
      filtered = filtered.filter((e) => {
        const createdAt = e.created_at ? new Date(e.created_at) : null;
        if (!createdAt) return false;
        if (dateRangeFilter.from && createdAt < dateRangeFilter.from) return false;
        if (dateRangeFilter.to && createdAt > dateRangeFilter.to) return false;
        return true;
      });
    }

    return filtered;
  }, [emails, searchFilter, statusFilter, classificationFilter, clientStepFilter, dateRangeFilter]);

  // KPI calculations
  const totalEmails = emails.length;
  const uniqueCompanies = new Set(emails.map((e) => e.company)).size;
  const sentCount = emails.filter((e) => e.status === "sent").length;
  const repliedCount = emails.filter((e) => e.status === "replied").length;
  const bouncedCount = emails.filter((e) => e.status === "bounced").length;
  const openedCount = emails.filter((e) => e.status === "opened").length;
  const hotLeads = emails.filter((e) => e.lead_classification === "hot").length;
  const totalSentish = emails.filter((e) => e.status !== "researched").length;
  const replyRate = totalSentish > 0 ? Math.round((repliedCount / totalSentish) * 100) : 0;

  const handleViewDetails = useCallback((email: Email) => {
    setSelectedDetailEmail(email);
    setDetailModalOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((email: Email) => {
    setDeleteTarget(email);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const { error: deleteError } = await supabase
        .from("emails")
        .delete()
        .eq("id", deleteTarget.id);
      if (deleteError) throw deleteError;
      setEmails((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete email");
    } finally {
      setDeleteTarget(null);
      setDeleteModalOpen(false);
    }
  }, [deleteTarget]);

  const handleConfirmBulkDelete = useCallback(async () => {
    try {
      const ids = Array.from(selectedIds);
      const { error: deleteError } = await supabase.from("emails").delete().in("id", ids);
      if (deleteError) throw deleteError;
      setEmails((prev) => prev.filter((e) => !selectedIds.has(e.id)));
      clearSelection();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete emails");
    } finally {
      setBulkDeleteModalOpen(false);
    }
  }, [selectedIds, clearSelection]);

  // Campaign initial for avatar
  const campaignInitial = campaignName.charAt(0).toUpperCase();

  const kpis = useMemo(
    () => [
      {
        label: "Total",
        value: totalEmails,
        icon: Mail,
        color: "#3b82f6",
        text: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-500/8 dark:bg-blue-500/10",
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        border: "border-blue-200/60 dark:border-blue-800/30",
        filterValue: "",
        filterFn: () => true,
      },
      {
        label: "Sent",
        value: sentCount,
        icon: Send,
        color: "#8b5cf6",
        text: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-500/8 dark:bg-violet-500/10",
        iconBg: "bg-violet-100 dark:bg-violet-900/30",
        border: "border-violet-200/60 dark:border-violet-800/30",
        filterValue: "sent",
        filterFn: (e: Email) => e.status === "sent",
      },
      {
        label: "Replied",
        value: repliedCount,
        icon: MessageSquare,
        color: "#22c55e",
        text: "text-green-600 dark:text-green-400",
        bg: "bg-green-500/8 dark:bg-green-500/10",
        iconBg: "bg-green-100 dark:bg-green-900/30",
        border: "border-green-200/60 dark:border-green-800/30",
        filterValue: "replied",
        filterFn: (e: Email) => e.status === "replied",
      },
      {
        label: "Bounced",
        value: bouncedCount,
        icon: XCircle,
        color: "#ef4444",
        text: "text-red-600 dark:text-red-400",
        bg: "bg-red-500/8 dark:bg-red-500/10",
        iconBg: "bg-red-100 dark:bg-red-900/30",
        border: "border-red-200/60 dark:border-red-800/30",
        filterValue: "bounced",
        filterFn: (e: Email) => e.status === "bounced",
      },
      {
        label: "Opened",
        value: openedCount,
        icon: Eye,
        color: "#06b6d4",
        text: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-cyan-500/8 dark:bg-cyan-500/10",
        iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
        border: "border-cyan-200/60 dark:border-cyan-800/30",
        filterValue: "opened",
        filterFn: (e: Email) => e.status === "opened",
      },
      {
        label: "Reply Rate",
        value: `${replyRate}%`,
        icon: MessageSquare,
        color: "#10b981",
        text: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/8 dark:bg-emerald-500/10",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
        border: "border-emerald-200/60 dark:border-emerald-800/30",
        filterValue: "",
        filterFn: (e: Email) => e.status === "replied",
      },
      {
        label: "Hot Leads",
        value: hotLeads,
        icon: Flame,
        color: "#f97316",
        text: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-500/8 dark:bg-orange-500/10",
        iconBg: "bg-orange-100 dark:bg-orange-900/30",
        border: "border-orange-200/60 dark:border-orange-800/30",
        filterValue: "",
        filterFn: (e: Email) => e.lead_classification === "hot",
      },
    ],
    [totalEmails, sentCount, repliedCount, bouncedCount, openedCount, replyRate, hotLeads],
  );

  const sparklines = useMemo(() => {
    return kpis.map((kpi) => {
      const filtered = emails.filter(kpi.filterFn);
      return generateSparkline(filtered, (e) => e.date_sent || e.created_at);
    });
  }, [emails, kpis]);

  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => router.push("/campaigns")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
              {campaignInitial}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-foreground">{campaignName}</h1>
              <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                <span>{uniqueCompanies} companies</span>
                <span className="text-border">·</span>
                <span>{totalEmails} leads</span>
              </div>
            </div>
          </div>
          <DateRangePicker date={dateRangeFilter} onDateChange={setDateRangeFilter} />
        </div>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <div className="space-y-6">
            {/* KPI Skeletons */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-2.5 px-4 pt-3.5">
                    <Skeleton className="h-7 w-7 rounded-lg" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <div className="px-4 pt-2">
                    <Skeleton className="h-7 w-10" />
                  </div>
                  <Skeleton className="mt-2 h-8 w-full" />
                </div>
              ))}
            </div>

            <Skeleton className="h-10 w-full rounded-lg" />

            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-b border-border px-4 py-3">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {kpis.map((kpi, idx) => {
                const Icon = kpi.icon;
                const isActive = statusFilter === kpi.filterValue && kpi.filterValue !== "";
                return (
                  <div
                    key={kpi.label}
                    className={`
                      hover-lift sparkline-hover group
                      relative cursor-pointer overflow-hidden rounded-xl border
                      ${kpi.border} ${kpi.bg}
                      backdrop-blur-sm
                      animate-list-item
                      ${isActive ? "ring-2 ring-primary/30" : ""}
                    `}
                    style={{ animationDelay: `${idx * 80}ms` }}
                    onClick={() => {
                      if (kpi.filterValue) {
                        setStatusFilter(isActive ? "" : kpi.filterValue);
                        setClassificationFilter("");
                        setClientStepFilter("");
                      }
                    }}
                  >
                    <div className="flex items-center justify-between px-4 pt-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg ${kpi.iconBg} transition-transform duration-300 group-hover:scale-110`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${kpi.text}`} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {kpi.label}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 pt-1">
                      <span
                        className={`animate-value text-2xl font-bold tracking-tight ${kpi.text}`}
                        style={{ animationDelay: `${idx * 80 + 200}ms` }}
                      >
                        {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                      </span>
                    </div>
                    <div className="mt-1 h-8 px-1">
                      <MiniSparkline data={sparklines[idx]} color={kpi.color} height={28} />
                    </div>
                  </div>
                );
              })}
            </div>

            <EmailFilters
              search={searchFilter}
              onSearchChange={setSearchFilter}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              classification={classificationFilter}
              onClassificationChange={setClassificationFilter}
              clientStep={clientStepFilter}
              onClientStepChange={setClientStepFilter}
            />

            {selectedEmails.length > 0 && (
              <BulkActions
                selectedEmails={selectedEmails}
                onClear={clearSelection}
                onBulkDelete={() => setBulkDeleteModalOpen(true)}
              />
            )}

            <EmailListTable
              emails={filteredEmails}
              selectedIds={selectedIds}
              allVisibleEmails={filteredEmails}
              isAllSelected={isAllSelected(filteredEmails)}
              onSelectAll={() => toggleSelectAllVisible(filteredEmails)}
              onSelectEmail={toggleEmailSelection}
              onViewDetails={handleViewDetails}
              onDelete={handleDeleteRequest}
            />

            <EmailDetailModal
              email={selectedDetailEmail}
              open={detailModalOpen}
              onOpenChange={setDetailModalOpen}
              onUpdate={fetchEmails}
            />

            <AlertModal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
              <AlertModal.Header>
                <AlertModal.Title>Delete Record</AlertModal.Title>
                <AlertModal.Description>
                  Are you sure you want to delete the record for{" "}
                  <strong>{deleteTarget?.company}</strong>? This action cannot be undone.
                </AlertModal.Description>
              </AlertModal.Header>
              <AlertModal.Footer>
                <AlertModal.Cancel>Cancel</AlertModal.Cancel>
                <AlertModal.Action
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertModal.Action>
              </AlertModal.Footer>
            </AlertModal>

            <AlertModal open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
              <AlertModal.Header>
                <AlertModal.Title>Delete Selected Records</AlertModal.Title>
                <AlertModal.Description>
                  Are you sure you want to delete <strong>{selectedEmails.length}</strong> selected
                  record{selectedEmails.length > 1 ? "s" : ""}? This action cannot be undone.
                </AlertModal.Description>
              </AlertModal.Header>
              <AlertModal.Footer>
                <AlertModal.Cancel>Cancel</AlertModal.Cancel>
                <AlertModal.Action
                  onClick={handleConfirmBulkDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete All
                </AlertModal.Action>
              </AlertModal.Footer>
            </AlertModal>
          </>
        )}
      </div>
    </AppLayout>
  );
}
