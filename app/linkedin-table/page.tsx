"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { LinkedInMessage } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { KPIFilter } from "@/components/dashboard/KPICards";
import { LinkedInKPICards } from "@/components/linkedin-table/LinkedInKPICards";
import { LinkedInFilters } from "@/components/linkedin-table/LinkedInFilters";
import { LinkedInTable } from "@/components/linkedin-table/LinkedInTable";
import { LinkedInDetailModal } from "@/components/linkedin-table/LinkedInDetailModal";
import { useSelection } from "@/hooks/useSelection";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { groupLinkedInByCompany } from "@/lib/groupLinkedInByCompany";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { AlertModal } from "@/components/shared/AlertModal";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export default function LinkedInTablePage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LinkedInMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<LinkedInMessage | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<LinkedInMessage | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const [kpiFilter, setKpiFilter] = useState<KPIFilter | null>(null);

  const {
    selectedIds,
    selectedItems: selectedMessages,
    isAllSelected,
    toggleSelection,
    toggleSelectAllVisible,
    clearSelection,
  } = useSelection(messages);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("linkedin_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setMessages(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load LinkedIn messages");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const filteredMessages = useMemo(() => {
    let filtered = messages;

    if (statusFilter) {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    if (classificationFilter) {
      filtered = filtered.filter((m) => m.lead_classification === classificationFilter);
    }

    if (searchFilter) {
      const lowerSearch = searchFilter.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.first_name.toLowerCase().includes(lowerSearch) ||
          m.last_name.toLowerCase().includes(lowerSearch) ||
          m.current_company.toLowerCase().includes(lowerSearch) ||
          m.current_position.toLowerCase().includes(lowerSearch) ||
          (m.headline || "").toLowerCase().includes(lowerSearch) ||
          (m.location || "").toLowerCase().includes(lowerSearch),
      );
    }

    if (dateRangeFilter?.from) {
      filtered = filtered.filter((m) => {
        const createdAt = m.created_at ? new Date(m.created_at) : null;
        if (!createdAt) return false;
        if (dateRangeFilter.from && createdAt < dateRangeFilter.from) return false;
        if (dateRangeFilter.to && createdAt > dateRangeFilter.to) return false;
        return true;
      });
    }

    return filtered;
  }, [messages, searchFilter, statusFilter, classificationFilter, dateRangeFilter]);

  const companyGroups = useMemo(() => groupLinkedInByCompany(filteredMessages), [filteredMessages]);

  const { visibleItems: visibleGroups, hasMore, sentinelRef } = useInfiniteScroll(companyGroups);

  const allVisibleMessages = useMemo(
    () => visibleGroups.flatMap((g) => g.messages),
    [visibleGroups],
  );

  const handleViewDetails = useCallback((msg: LinkedInMessage) => {
    setSelectedDetail(msg);
    setDetailModalOpen(true);
  }, []);

  const handleToggleCompany = useCallback((companyKey: string) => {
    setExpandedCompanies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(companyKey)) {
        newSet.delete(companyKey);
      } else {
        newSet.add(companyKey);
      }
      return newSet;
    });
  }, []);

  const handleSelectGroup = useCallback(
    (messageIds: string[]) => {
      const allSelected = messageIds.every((id) => selectedIds.has(id));
      for (const id of messageIds) {
        const isCurrentlySelected = selectedIds.has(id);
        if (allSelected && isCurrentlySelected) {
          toggleSelection(id, allVisibleMessages, false);
        } else if (!allSelected && !isCurrentlySelected) {
          toggleSelection(id, allVisibleMessages, false);
        }
      }
    },
    [selectedIds, toggleSelection, allVisibleMessages],
  );

  const handleDeleteRequest = useCallback((msg: LinkedInMessage) => {
    setDeleteTarget(msg);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const { error: deleteError } = await supabase
        .from("linkedin_messages")
        .delete()
        .eq("id", deleteTarget.id);
      if (deleteError) throw deleteError;
      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete message");
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
        .from("linkedin_messages")
        .delete()
        .in("id", ids);
      if (deleteError) throw deleteError;
      setMessages((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      clearSelection();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete messages");
    } finally {
      setBulkDeleteModalOpen(false);
    }
  }, [selectedIds, clearSelection]);

  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">LinkedIn Messages</h1>
          <div className="flex items-center gap-3">
            <DateRangePicker date={dateRangeFilter} onDateChange={setDateRangeFilter} />
          </div>
        </div>
        <div className="flex items-center justify-end">
          {selectedMessages.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {selectedMessages.length} selected
              </span>
              <button
                onClick={handleBulkDeleteRequest}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete Selected
              </button>
              <button
                onClick={clearSelection}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <LinkedInKPICards
              messages={messages}
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
              <LinkedInFilters
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
              />
            </div>

            <div className="rounded-lg border border-border bg-card">
              <LinkedInTable
                groups={visibleGroups}
                selectedIds={selectedIds}
                expandedCompanies={expandedCompanies}
                onSelectMessage={(id, visible, shiftKey) => toggleSelection(id, visible, shiftKey)}
                onSelectGroup={handleSelectGroup}
                onSelectAll={() => toggleSelectAllVisible(allVisibleMessages)}
                onToggleCompany={handleToggleCompany}
                onViewDetails={handleViewDetails}
                onDelete={handleDeleteRequest}
                isAllSelected={isAllSelected(allVisibleMessages)}
              />

              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              )}
            </div>

            <LinkedInDetailModal
              message={selectedDetail}
              open={detailModalOpen}
              onOpenChange={setDetailModalOpen}
              onUpdate={fetchMessages}
            />

            <AlertModal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
              <AlertModal.Header>
                <AlertModal.Title>Delete Record</AlertModal.Title>
                <AlertModal.Description>
                  Are you sure you want to delete the record for{" "}
                  <strong>
                    {deleteTarget
                      ? `${deleteTarget.first_name} ${deleteTarget.last_name}`.trim()
                      : ""}
                  </strong>
                  ? This action cannot be undone.
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
                  Are you sure you want to delete <strong>{selectedMessages.length}</strong>{" "}
                  selected record
                  {selectedMessages.length > 1 ? "s" : ""}? This action cannot be undone.
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
