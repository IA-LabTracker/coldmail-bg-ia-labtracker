"use client";

import { useState, useMemo, useCallback } from "react";
import { DateRange } from "react-day-picker";
import { Email, SenderEmail } from "@/types";
import { useSenderEmails } from "@/hooks/useSenderEmails";
import { KPICards, KPIFilter } from "@/components/dashboard/KPICards";
import { EmailFilters } from "@/components/dashboard/EmailFilters";
import { EmailTable } from "@/components/dashboard/EmailTable";
import { EmailDetailModal } from "@/components/dashboard/EmailDetailModal";
import { CreateLeadDialog } from "@/components/dashboard/CreateLeadDialog";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { useEmailSelection } from "@/hooks/useEmailSelection";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { groupEmailsByCompany } from "@/lib/groupEmailsByCompany";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertModal } from "@/components/shared/AlertModal";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface EmailManagerTabProps {
  emails: Email[];
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>;
  fetchEmails: () => Promise<void>;
  setError: (error: string) => void;
}

export function EmailManagerTab({ emails, setEmails, fetchEmails, setError }: EmailManagerTabProps) {
  const { senderEmails } = useSenderEmails();
  const [selectedDetailEmail, setSelectedDetailEmail] = useState<Email | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Email | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);

  const campaignNames = useMemo(() => {
    const names = new Set(emails.map((e) => e.campaign_name).filter(Boolean));
    return Array.from(names).sort();
  }, [emails]);

  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("");
  const [clientStepFilter, setClientStepFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const [kpiFilter, setKpiFilter] = useState<KPIFilter | null>(null);

  const {
    selectedIds,
    selectedEmails,
    isAllSelected,
    toggleEmailSelection,
    toggleSelectAllVisible,
    clearSelection,
  } = useEmailSelection(emails);

  const filteredEmails = useMemo(() => {
    let filtered = emails;

    if (searchFilter) {
      const lowerSearch = searchFilter.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.company.toLowerCase().includes(lowerSearch) ||
          e.email.toLowerCase().includes(lowerSearch) ||
          (e.lead_name || "").toLowerCase().includes(lowerSearch) ||
          (e.lead_category || "").toLowerCase().includes(lowerSearch) ||
          (e.client_tag || "").toLowerCase().includes(lowerSearch),
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

    if (campaignFilter) {
      filtered = filtered.filter((e) => e.campaign_name === campaignFilter);
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
  }, [emails, searchFilter, statusFilter, classificationFilter, clientStepFilter, campaignFilter, dateRangeFilter]);

  const companyGroups = useMemo(() => groupEmailsByCompany(filteredEmails), [filteredEmails]);
  const { visibleItems: visibleGroups, hasMore, sentinelRef } = useInfiniteScroll(companyGroups);
  const allVisibleEmails = useMemo(() => visibleGroups.flatMap((g) => g.emails), [visibleGroups]);

  const handleViewDetails = useCallback((email: Email) => {
    setSelectedDetailEmail(email);
    setDetailModalOpen(true);
  }, []);

  const handleToggleCompany = useCallback((companyKey: string) => {
    setExpandedCompanies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(companyKey)) newSet.delete(companyKey);
      else newSet.add(companyKey);
      return newSet;
    });
  }, []);

  const handleSelectGroup = useCallback(
    (emailIds: string[]) => {
      const allSelected = emailIds.every((id) => selectedIds.has(id));
      for (const id of emailIds) {
        const isCurrentlySelected = selectedIds.has(id);
        if (allSelected && isCurrentlySelected) {
          toggleEmailSelection(id, allVisibleEmails, false);
        } else if (!allSelected && !isCurrentlySelected) {
          toggleEmailSelection(id, allVisibleEmails, false);
        }
      }
    },
    [selectedIds, toggleEmailSelection, allVisibleEmails],
  );

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
  }, [deleteTarget, setEmails, setError]);

  const handleBulkDeleteRequest = useCallback(() => {
    setBulkDeleteModalOpen(true);
  }, []);

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
  }, [selectedIds, clearSelection, setEmails, setError]);

  return (
    <div className="space-y-6">
      <div className="animate-section flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Email Manager</h2>
          <p className="text-sm text-muted-foreground">Manage and track all your email outreach</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker date={dateRangeFilter} onDateChange={setDateRangeFilter} />
          <Button onClick={() => setCreateLeadOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        </div>
      </div>

      <KPICards
        emails={emails}
        activeFilter={kpiFilter}
        onFilterChange={(filter) => {
          setKpiFilter(filter);
          if (!filter) {
            setStatusFilter("");
            setClassificationFilter("");
          } else if (filter.type === "status") {
            setStatusFilter(filter.value);
            setClassificationFilter("");
          } else if (filter.type === "classification") {
            setClassificationFilter(filter.value);
            setStatusFilter("");
          }
        }}
      />

      <div className="mt-2">
        <EmailFilters
          search={searchFilter}
          onSearchChange={setSearchFilter}
          status={statusFilter}
          onStatusChange={(v) => {
            setStatusFilter(v);
            setKpiFilter(null);
          }}
          classification={classificationFilter}
          onClassificationChange={(v) => {
            setClassificationFilter(v);
            setKpiFilter(null);
          }}
          clientStep={clientStepFilter}
          onClientStepChange={setClientStepFilter}
          campaign={campaignFilter}
          onCampaignChange={setCampaignFilter}
          campaignOptions={campaignNames}
        />
      </div>

      {selectedEmails.length > 0 && (
        <BulkActions
          selectedEmails={selectedEmails}
          onClear={clearSelection}
          onBulkDelete={handleBulkDeleteRequest}
        />
      )}

      <div className="animate-section rounded-lg border border-border bg-card" style={{ animationDelay: "200ms" }}>
        <EmailTable
          groups={visibleGroups}
          selectedIds={selectedIds}
          expandedCompanies={expandedCompanies}
          onSelectEmail={(id, visible, shiftKey) => toggleEmailSelection(id, visible, shiftKey)}
          onSelectGroup={handleSelectGroup}
          onSelectAll={() => toggleSelectAllVisible(allVisibleEmails)}
          onToggleCompany={handleToggleCompany}
          onViewDetails={handleViewDetails}
          onDelete={handleDeleteRequest}
          isAllSelected={isAllSelected(allVisibleEmails)}
        />

        {hasMore && (
          <div ref={sentinelRef} className="space-y-1 px-4 py-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        )}
      </div>

      <EmailDetailModal
        email={selectedDetailEmail}
        senderEmails={senderEmails}
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
            Are you sure you want to delete <strong>{selectedEmails.length}</strong> selected record
            {selectedEmails.length > 1 ? "s" : ""}? This action cannot be undone.
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

      <CreateLeadDialog
        open={createLeadOpen}
        onOpenChange={setCreateLeadOpen}
        onCreated={fetchEmails}
        campaignNames={campaignNames}
        senderEmails={senderEmails}
      />
    </div>
  );
}
