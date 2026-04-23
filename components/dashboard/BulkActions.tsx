"use client";

import { useState, useEffect } from "react";
import { Email, SenderEmail } from "@/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DispatchDialog } from "@/components/dashboard/DispatchDialog";
import { Send, Trash2, X } from "lucide-react";

interface BulkActionsProps {
  selectedEmails: Email[];
  onClear: () => void;
  onBulkDelete: () => void;
}

export function BulkActions({ selectedEmails, onClear, onBulkDelete }: BulkActionsProps) {
  const { user } = useAuth();
  const [senderEmails, setSenderEmails] = useState<SenderEmail[]>([]);
  const [dispatchOpen, setDispatchOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("sender_emails")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setSenderEmails(data);
      });
  }, [user]);

  if (selectedEmails.length === 0) return null;

  return (
    <>
      <Card className="border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
              {selectedEmails.length}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selectedEmails.length} lead{selectedEmails.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-muted-foreground">
                Choose an action for the selected records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setDispatchOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>

            <Button
              onClick={onBulkDelete}
              variant="outline"
              size="sm"
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>

            <Button
              onClick={onClear}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <DispatchDialog
        open={dispatchOpen}
        onOpenChange={setDispatchOpen}
        selectedEmails={selectedEmails}
        senderEmails={senderEmails}
        onDispatchComplete={onClear}
      />
    </>
  );
}
