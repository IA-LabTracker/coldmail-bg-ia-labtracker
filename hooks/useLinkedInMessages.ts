"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { LinkedInMessage } from "@/types";
import { KPIFilter } from "@/components/dashboard/KPICards";
import { groupLinkedInByCompany } from "@/lib/groupLinkedInByCompany";
import { useSelection } from "@/hooks/useSelection";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

export function useLinkedInMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LinkedInMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LinkedInMessage | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const [kpiFilter, setKpiFilter] = useState<KPIFilter | null>(null);

  const { selectedIds, selectedItems: selectedMessages, isAllSelected, toggleSelection, toggleSelectAllVisible, clearSelection } =
    useSelection(messages);

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
    if (statusFilter) filtered = filtered.filter((m) => m.status === statusFilter);
    if (classificationFilter) filtered = filtered.filter((m) => m.lead_classification === classificationFilter);
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.first_name.toLowerCase().includes(q) ||
          m.last_name.toLowerCase().includes(q) ||
          m.current_company.toLowerCase().includes(q) ||
          m.current_position.toLowerCase().includes(q) ||
          (m.headline || "").toLowerCase().includes(q) ||
          (m.location || "").toLowerCase().includes(q),
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
  const allVisibleMessages = useMemo(() => visibleGroups.flatMap((g) => g.messages), [visibleGroups]);
  const allSelected = useMemo(() => isAllSelected(allVisibleMessages), [isAllSelected, allVisibleMessages]);

  const handleSelectGroup = useCallback(
    (messageIds: string[]) => {
      const allGroupSelected = messageIds.every((id) => selectedIds.has(id));
      for (const id of messageIds) {
        const isCurrentlySelected = selectedIds.has(id);
        if (allGroupSelected && isCurrentlySelected) {
          toggleSelection(id, allVisibleMessages, false);
        } else if (!allGroupSelected && !isCurrentlySelected) {
          toggleSelection(id, allVisibleMessages, false);
        }
      }
    },
    [selectedIds, toggleSelection, allVisibleMessages],
  );

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setKpiFilter(null);
  }, []);

  const handleClassificationChange = useCallback((value: string) => {
    setClassificationFilter(value);
    setKpiFilter(null);
  }, []);

  const handleKpiFilterChange = useCallback((filter: KPIFilter | null) => {
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
  }, []);

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

  return {
    messages,
    loading,
    error,
    // filters
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
    // table data
    visibleGroups,
    hasMore,
    sentinelRef,
    allVisibleMessages,
    // selection
    selectedIds,
    selectedMessages,
    allSelected,
    toggleSelection,
    toggleSelectAllVisible,
    clearSelection,
    handleSelectGroup,
    // delete
    deleteTarget,
    deleteModalOpen,
    setDeleteModalOpen,
    bulkDeleteModalOpen,
    setBulkDeleteModalOpen,
    handleDeleteRequest,
    handleConfirmDelete,
    handleConfirmBulkDelete,
    // refetch
    fetchMessages,
  };
}
