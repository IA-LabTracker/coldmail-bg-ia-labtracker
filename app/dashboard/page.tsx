"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Email } from "@/types";
import { Navbar } from "@/components/Navbar";
import { KPICards } from "@/components/dashboard/KPICards";
import { EmailFilters } from "@/components/dashboard/EmailFilters";
import { EmailTable } from "@/components/dashboard/EmailTable";
import { ExpandableRow } from "@/components/dashboard/ExpandableRow";
import { EmailDetailModal } from "@/components/dashboard/EmailDetailModal";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { useEmailSelection } from "@/hooks/useEmailSelection";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { AlertModal } from "@/components/shared/AlertModal";

export default function DashboardPage() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDetailEmail, setSelectedDetailEmail] = useState<Email | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Email | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const {
    selectedIds,
    selectedEmails,
    isAllSelected,
    toggleEmailSelection,
    toggleSelectAllVisible,
    clearSelection,
  } = useEmailSelection(emails);

  // Fetch emails
  const fetchEmails = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("emails")
        .select("*")
        .eq("user_id", user.id)
        .order("date_sent", { ascending: false });

      if (fetchError) throw fetchError;
      setEmails(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emails");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Apply filters
  const filteredEmails = useMemo(() => {
    let filtered = emails;

    if (statusFilter) {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    if (classificationFilter) {
      filtered = filtered.filter((e) => e.lead_classification === classificationFilter);
    }

    if (campaignFilter) {
      const lowerCampaign = campaignFilter.toLowerCase();
      filtered = filtered.filter((e) =>
        e.campaign_name.toLowerCase().includes(lowerCampaign),
      );
    }

    if (searchFilter) {
      const lowerSearch = searchFilter.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.company.toLowerCase().includes(lowerSearch) ||
          e.email.toLowerCase().includes(lowerSearch),
      );
    }

    return filtered;
  }, [emails, statusFilter, classificationFilter, campaignFilter, searchFilter]);

  const { visibleItems: visibleEmails, hasMore, sentinelRef } = useInfiniteScroll(filteredEmails);

  const handleViewDetails = useCallback((email: Email) => {
    setSelectedDetailEmail(email);
    setDetailModalOpen(true);
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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

  const handleBulkDeleteRequest = useCallback(() => {
    setBulkDeleteModalOpen(true);
  }, []);

  const handleConfirmBulkDelete = useCallback(async () => {
    try {
      const ids = Array.from(selectedIds);
      const { error: deleteError } = await supabase
        .from("emails")
        .delete()
        .in("id", ids);
      if (deleteError) throw deleteError;
      setEmails((prev) => prev.filter((e) => !selectedIds.has(e.id)));
      clearSelection();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete emails");
    } finally {
      setBulkDeleteModalOpen(false);
    }
  }, [selectedIds, clearSelection]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

          {error && <ErrorMessage message={error} />}

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <KPICards emails={emails} />

              <div className="rounded-lg bg-white p-4">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Filters</h2>
                <EmailFilters
                  status={statusFilter}
                  onStatusChange={setStatusFilter}
                  classification={classificationFilter}
                  onClassificationChange={setClassificationFilter}
                  campaign={campaignFilter}
                  onCampaignChange={setCampaignFilter}
                  search={searchFilter}
                  onSearchChange={setSearchFilter}
                />
              </div>

              {selectedEmails.length > 0 && (
                <BulkActions selectedEmails={selectedEmails} onClear={clearSelection} onBulkDelete={handleBulkDeleteRequest} />
              )}

              <div className="rounded-lg border border-gray-200 bg-white">
                <EmailTable
                  emails={visibleEmails}
                  selectedIds={selectedIds}
                  expandedIds={expandedIds}
                  sortConfig={null}
                  onSelectEmail={(id, visible, shiftKey) => toggleEmailSelection(id, visible, shiftKey)}
                  onSelectAll={() => toggleSelectAllVisible(filteredEmails)}
                  onToggleExpand={handleToggleExpand}
                  onViewDetails={handleViewDetails}
                  onDelete={handleDeleteRequest}
                  isAllSelected={isAllSelected(filteredEmails)}
                />

                {visibleEmails.map((email) => {
                  if (!expandedIds.has(email.id)) return null;
                  return (
                    <div key={`expanded-${email.id}`}>
                      <ExpandableRow email={email} />
                    </div>
                  );
                })}

                {hasMore && (
                  <div ref={sentinelRef} className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                )}
              </div>

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
                    Are you sure you want to delete{" "}
                    <strong>{selectedEmails.length}</strong> selected record
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
