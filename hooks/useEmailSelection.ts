import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Email } from "@/types";

export function useEmailSelection(emails: Email[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastClickedIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const emailIds = new Set(emails.map((e) => e.id));
    setSelectedIds((prev) => {
      const hasStale = Array.from(prev).some((id) => !emailIds.has(id));
      if (!hasStale) return prev;
      const filtered = new Set(Array.from(prev).filter((id) => emailIds.has(id)));
      return filtered;
    });
  }, [emails]);

  const toggleEmailSelection = useCallback(
    (id: string, visibleEmails: Email[], shiftKey: boolean) => {
      const currentIndex = visibleEmails.findIndex((e) => e.id === id);

      if (shiftKey && lastClickedIndexRef.current !== null) {
        const start = Math.min(lastClickedIndexRef.current, currentIndex);
        const end = Math.max(lastClickedIndexRef.current, currentIndex);
        const rangeIds = visibleEmails.slice(start, end + 1).map((e) => e.id);

        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          rangeIds.forEach((rangeId) => newSet.add(rangeId));
          return newSet;
        });
      } else {
        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
      }

      lastClickedIndexRef.current = currentIndex;
    },
    [],
  );

  const toggleSelectAllVisible = useCallback(
    (visibleEmails: Email[]) => {
      const allVisible = visibleEmails.every((e) => selectedIds.has(e.id));

      if (allVisible) {
        const newSet = new Set(selectedIds);
        visibleEmails.forEach((e) => newSet.delete(e.id));
        setSelectedIds(newSet);
      } else {
        const newSet = new Set(selectedIds);
        visibleEmails.forEach((e) => newSet.add(e.id));
        setSelectedIds(newSet);
      }
    },
    [selectedIds],
  );

  const isAllSelected = useCallback(
    (visibleEmails: Email[]) => {
      return visibleEmails.length > 0 && visibleEmails.every((e) => selectedIds.has(e.id));
    },
    [selectedIds],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastClickedIndexRef.current = null;
  }, []);

  const selectedEmails = useMemo(
    () => emails.filter((e) => selectedIds.has(e.id)),
    [emails, selectedIds],
  );

  return {
    selectedIds,
    selectedEmails,
    toggleEmailSelection,
    toggleSelectAllVisible,
    isAllSelected,
    clearSelection,
  };
}
