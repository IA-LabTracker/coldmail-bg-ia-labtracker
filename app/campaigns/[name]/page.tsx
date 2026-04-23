"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Email } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { EmailDetailModal } from "@/components/dashboard/EmailDetailModal";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { AlertModal } from "@/components/shared/AlertModal";
import { EmailListTable } from "@/components/shared/EmailListTable";
import { EmailFilters } from "@/components/dashboard/EmailFilters";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { useEmailSelection } from "@/hooks/useEmailSelection";
import { useCampaignEmailActions } from "@/hooks/useCampaignEmailActions";
import { computeCampaignDetailStats, filterCampaignEmails } from "@/lib/campaignDetailLogic";
import { CampaignDetailHeader } from "@/components/campaigns/CampaignDetailHeader";
import { CampaignDetailSkeleton } from "@/components/campaigns/CampaignDetailSkeleton";
import { CampaignKPIGrid } from "@/components/campaigns/CampaignKPIGrid";

export default function CampaignDetailPage() {
  const params = useParams();
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

  const { deleteOne, deleteMany } = useCampaignEmailActions({
    setEmails,
    setError,
    clearSelection,
  });

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

  const stats = useMemo(() => computeCampaignDetailStats(emails), [emails]);

  const filteredEmails = useMemo(
    () =>
      filterCampaignEmails(emails, {
        search: searchFilter,
        status: statusFilter,
        classification: classificationFilter,
        clientStep: clientStepFilter,
        dateRange: dateRangeFilter,
      }),
    [emails, searchFilter, statusFilter, classificationFilter, clientStepFilter, dateRangeFilter],
  );

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
    await deleteOne(deleteTarget);
    setDeleteTarget(null);
    setDeleteModalOpen(false);
  }, [deleteTarget, deleteOne]);

  const handleConfirmBulkDelete = useCallback(async () => {
    await deleteMany(selectedIds);
    setBulkDeleteModalOpen(false);
  }, [selectedIds, deleteMany]);

  const handleKpiFilterToggle = useCallback((filterValue: string) => {
    setStatusFilter((prev) => (prev === filterValue ? "" : filterValue));
    setClassificationFilter("");
    setClientStepFilter("");
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <CampaignDetailHeader
          campaignName={campaignName}
          totalEmails={stats.totalEmails}
          uniqueCompanies={stats.uniqueCompanies}
          dateRange={dateRangeFilter}
          onDateChange={setDateRangeFilter}
        />

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <CampaignDetailSkeleton />
        ) : (
          <>
            <CampaignKPIGrid
              emails={emails}
              stats={stats}
              activeFilter={statusFilter}
              onFilterToggle={handleKpiFilterToggle}
            />

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
