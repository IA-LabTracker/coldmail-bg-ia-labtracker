"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Email } from "@/types";

interface UseCampaignEmailActionsArgs {
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>;
  setError: (message: string) => void;
  clearSelection: () => void;
}

export function useCampaignEmailActions({
  setEmails,
  setError,
  clearSelection,
}: UseCampaignEmailActionsArgs) {
  const deleteOne = useCallback(
    async (email: Email) => {
      try {
        const { error } = await supabase.from("emails").delete().eq("id", email.id);
        if (error) throw error;
        setEmails((prev) => prev.filter((e) => e.id !== email.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete email");
      }
    },
    [setEmails, setError],
  );

  const deleteMany = useCallback(
    async (ids: Set<string>) => {
      if (ids.size === 0) return;
      try {
        const idArray = Array.from(ids);
        const { error } = await supabase.from("emails").delete().in("id", idArray);
        if (error) throw error;
        setEmails((prev) => prev.filter((e) => !ids.has(e.id)));
        clearSelection();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete emails");
      }
    },
    [setEmails, setError, clearSelection],
  );

  return { deleteOne, deleteMany };
}
