"use client";

import { useState, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { LinkedInKPICards } from "@/components/linkedin-table/LinkedInKPICards";
import { LinkedInFilters } from "@/components/linkedin-table/LinkedInFilters";
import { LinkedInTable } from "@/components/linkedin-table/LinkedInTable";
import { LinkedInDetailModal } from "@/components/linkedin-table/LinkedInDetailModal";
import { LinkedInBulkBar } from "@/components/linkedin-table/LinkedInBulkBar";
import { LinkedInDeleteModals } from "@/components/linkedin-table/LinkedInDeleteModals";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useLinkedInMessages } from "@/hooks/useLinkedInMessages";
import { LinkedInMessage } from "@/types";

export default function LinkedInTablePage() {
  const [selectedDetail, setSelectedDetail] = useState<LinkedInMessage | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

  const {
    messages,
    loading,
    error,
    searchFilter,
    setSearchFilter,
    statusFilter,
    handleStatusChange,
    classificationFilter,
    handleClassificationChange,
    dateRangeFilter,
    setDateRangeFilter,
    kpiFilter,
    handleKpiFilterChange,
    visibleGroups,
    hasMore,
    sentinelRef,
    allVisibleMessages,
    selectedIds,
    selectedMessages,
    allSelected,
    toggleSelection,
    toggleSelectAllVisible,
    clearSelection,
    handleSelectGroup,
    deleteTarget,
    deleteModalOpen,
    setDeleteModalOpen,
    bulkDeleteModalOpen,
    setBulkDeleteModalOpen,
    handleDeleteRequest,
    handleConfirmDelete,
    handleConfirmBulkDelete,
    fetchMessages,
  } = useLinkedInMessages();

  const handleViewDetails = useCallback((msg: LinkedInMessage) => {
    setSelectedDetail(msg);
    setDetailModalOpen(true);
  }, []);

  const handleToggleCompany = useCallback((companyKey: string) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(companyKey)) next.delete(companyKey);
      else next.add(companyKey);
      return next;
    });
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">LinkedIn Messages</h1>
          <DateRangePicker date={dateRangeFilter} onDateChange={setDateRangeFilter} />
        </div>

        <LinkedInBulkBar
          count={selectedMessages.length}
          onDelete={() => setBulkDeleteModalOpen(true)}
          onClear={clearSelection}
        />

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-10 w-64 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border-b border-border px-4 py-3.5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-36" />
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
            <LinkedInKPICards
              messages={messages}
              activeFilter={kpiFilter}
              onFilterChange={handleKpiFilterChange}
            />

            <div className="mt-2">
              <LinkedInFilters
                search={searchFilter}
                onSearchChange={setSearchFilter}
                status={statusFilter}
                onStatusChange={handleStatusChange}
                classification={classificationFilter}
                onClassificationChange={handleClassificationChange}
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
                isAllSelected={allSelected}
              />
              {hasMore && (
                <div ref={sentinelRef} className="space-y-1 px-4 py-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <LinkedInDetailModal
              message={selectedDetail}
              open={detailModalOpen}
              onOpenChange={setDetailModalOpen}
              onUpdate={fetchMessages}
            />

            <LinkedInDeleteModals
              deleteTarget={deleteTarget}
              deleteModalOpen={deleteModalOpen}
              onDeleteOpenChange={setDeleteModalOpen}
              onConfirmDelete={handleConfirmDelete}
              bulkDeleteModalOpen={bulkDeleteModalOpen}
              onBulkDeleteOpenChange={setBulkDeleteModalOpen}
              onConfirmBulkDelete={handleConfirmBulkDelete}
              selectedCount={selectedMessages.length}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
