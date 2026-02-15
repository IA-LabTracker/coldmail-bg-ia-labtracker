import { useState, useCallback, useEffect, useMemo, useRef } from "react";

interface WithId {
  id: string;
}

export function useSelection<T extends WithId>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastClickedIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const itemIds = new Set(items.map((i) => i.id));
    setSelectedIds((prev) => {
      const hasStale = Array.from(prev).some((id) => !itemIds.has(id));
      if (!hasStale) return prev;
      return new Set(Array.from(prev).filter((id) => itemIds.has(id)));
    });
  }, [items]);

  const toggleSelection = useCallback((id: string, visibleItems: T[], shiftKey: boolean) => {
    const currentIndex = visibleItems.findIndex((i) => i.id === id);

    if (shiftKey && lastClickedIndexRef.current !== null) {
      const start = Math.min(lastClickedIndexRef.current, currentIndex);
      const end = Math.max(lastClickedIndexRef.current, currentIndex);
      const rangeIds = visibleItems.slice(start, end + 1).map((i) => i.id);

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
  }, []);

  const toggleSelectAllVisible = useCallback(
    (visibleItems: T[]) => {
      const allVisible = visibleItems.every((i) => selectedIds.has(i.id));

      if (allVisible) {
        const newSet = new Set(selectedIds);
        visibleItems.forEach((i) => newSet.delete(i.id));
        setSelectedIds(newSet);
      } else {
        const newSet = new Set(selectedIds);
        visibleItems.forEach((i) => newSet.add(i.id));
        setSelectedIds(newSet);
      }
    },
    [selectedIds],
  );

  const isAllSelected = useCallback(
    (visibleItems: T[]) => {
      return visibleItems.length > 0 && visibleItems.every((i) => selectedIds.has(i.id));
    },
    [selectedIds],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastClickedIndexRef.current = null;
  }, []);

  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds],
  );

  return {
    selectedIds,
    selectedItems,
    toggleSelection,
    toggleSelectAllVisible,
    isAllSelected,
    clearSelection,
  };
}
