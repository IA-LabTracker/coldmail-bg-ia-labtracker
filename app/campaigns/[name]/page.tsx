"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Email } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { EmailDetailModal } from "@/components/dashboard/EmailDetailModal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { AlertModal } from "@/components/shared/AlertModal";
import { EmailListTable } from "@/components/shared/EmailListTable";
import { EmailFilters } from "@/components/dashboard/EmailFilters";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useEmailSelection } from "@/hooks/useEmailSelection";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { ArrowLeft, Mail, Send, MessageSquare, Flame, Eye, XCircle, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const kpis = [
    {
      label: "Total Emails",
      value: totalEmails,
      icon: Mail,
      iconColor: "text-blue-500",
      valueColor: "text-blue-600 dark:text-blue-400",
      borderColor: "bg-blue-500/70",
      filterValue: "",
    },
    {
      label: "Companies Contacted",
      value: sentCount,
      icon: Building,
      iconColor: "text-purple-500",
      valueColor: "text-purple-600 dark:text-purple-400",
      borderColor: "bg-purple-500/70",
      filterValue: "sent",
    },
    {
      label: "Replied",
      value: repliedCount,
      icon: MessageSquare,
      iconColor: "text-green-500",
      valueColor: "text-green-600 dark:text-green-400",
      borderColor: "bg-green-500/70",
      filterValue: "replied",
    },
    {
      label: "Bounced",
      value: bouncedCount,
      icon: XCircle,
      iconColor: "text-red-500",
      valueColor: "text-red-600 dark:text-red-400",
      borderColor: "bg-red-500/70",
      filterValue: "bounced",
    },
    {
      label: "Opened",
      value: openedCount,
      icon: Eye,
      iconColor: "text-cyan-500",
      valueColor: "text-cyan-600 dark:text-cyan-400",
      borderColor: "bg-cyan-500/70",
      filterValue: "opened",
    },
    {
      label: "Reply Rate",
      value: `${replyRate}%`,
      icon: MessageSquare,
      iconColor: "text-emerald-500",
      valueColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "bg-emerald-500/70",
      filterValue: "",
    },
    {
      label: "Hot Leads",
      value: hotLeads,
      icon: Flame,
      iconColor: "text-orange-500",
      valueColor: "text-orange-600 dark:text-orange-400",
      borderColor: "bg-orange-500/70",
      filterValue: "",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/campaigns")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{campaignName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {totalEmails} email{totalEmails !== 1 ? "s" : ""} in this campaign
              </p>
            </div>
          </div>
          <DateRangePicker date={dateRangeFilter} onDateChange={setDateRangeFilter} />
        </div>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                const isActive = statusFilter === kpi.filterValue && kpi.filterValue !== "";
                return (
                  <div
                    key={kpi.label}
                    className={`relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md ${
                      isActive ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => {
                      if (kpi.filterValue) {
                        setStatusFilter(isActive ? "" : kpi.filterValue);
                        setClassificationFilter("");
                        setClientStepFilter("");
                      }
                    }}
                  >
                    <div className="px-4 pb-3 pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {kpi.label}
                          </p>
                          <p className={`mt-1 text-2xl font-bold ${kpi.valueColor}`}>{kpi.value}</p>
                        </div>
                        <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
                      </div>
                    </div>
                    <div className={`h-0.5 w-full ${kpi.borderColor}`} />
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
