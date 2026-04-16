"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { SenderEmail, Email } from "@/types";
import {
  useSenderEmails,
  CreateSenderEmailInput,
  UpdateSenderEmailInput,
} from "@/hooks/useSenderEmails";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  SenderEmailListItem,
  SenderEmailGroup,
} from "@/components/sender-emails/SenderEmailListItem";
import { CreateSenderEmailDialog } from "@/components/sender-emails/CreateSenderEmailDialog";

function buildSenderEmailGroups(senderEmails: SenderEmail[], emails: Email[]): SenderEmailGroup[] {
  const emailsBySender = new Map<string, Email[]>();
  for (const email of emails) {
    if (!email.sender_email_id) continue;
    const list = emailsBySender.get(email.sender_email_id) || [];
    list.push(email);
    emailsBySender.set(email.sender_email_id, list);
  }

  return senderEmails.map((se) => {
    const seEmails = emailsBySender.get(se.id) || [];
    return {
      senderEmail: se,
      totalEmails: seEmails.length,
      sent: seEmails.filter((e) => e.status === "sent").length,
      replied: seEmails.filter((e) => e.status === "replied").length,
      bounced: seEmails.filter((e) => e.status === "bounced").length,
      opened: seEmails.filter((e) => e.status === "opened").length,
    };
  });
}

export default function SenderEmailsPage() {
  const { user } = useAuth();
  const {
    senderEmails,
    loading,
    createSenderEmail,
    updateSenderEmail,
    deleteSenderEmail,
    setDefault,
  } = useSenderEmails();

  const [emails, setEmails] = useState<Email[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<SenderEmail | null>(null);

  // Fetch all emails for metrics
  useEffect(() => {
    if (!user) return;
    setEmailsLoading(true);
    supabase
      .from("emails")
      .select("id,status,sender_email_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setEmails((data as Email[]) || []);
        setEmailsLoading(false);
      });
  }, [user]);

  const groups = useMemo(
    () => buildSenderEmailGroups(senderEmails, emails),
    [senderEmails, emails],
  );

  const handleOpenCreate = useCallback(() => {
    setEditingEmail(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((senderEmail: SenderEmail) => {
    setEditingEmail(senderEmail);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    async (input: CreateSenderEmailInput) => {
      const result = await createSenderEmail(input);
      return !!result;
    },
    [createSenderEmail],
  );

  const handleUpdate = useCallback(
    async (id: string, updates: UpdateSenderEmailInput) => {
      return updateSenderEmail(id, updates);
    },
    [updateSenderEmail],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteSenderEmail(id);
    },
    [deleteSenderEmail],
  );

  const handleSetDefault = useCallback(
    async (id: string) => {
      await setDefault(id);
    },
    [setDefault],
  );

  const defaultEmail = senderEmails.find((se) => se.is_default);
  const isLoading = loading || emailsLoading;

  // Platform stats
  const platformCounts = senderEmails.reduce(
    (acc, se) => {
      const p = se.platform || "none";
      if (p !== "none") acc[p] = (acc[p] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Sender Emails</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage the addresses used to dispatch your campaigns
            </p>
          </div>
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add email
          </Button>
        </div>

        {/* Summary bar */}
        {!isLoading && senderEmails.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>
              <span className="font-medium tabular-nums text-foreground">
                {senderEmails.length}
              </span>{" "}
              email{senderEmails.length !== 1 ? "s" : ""}
            </span>
            {defaultEmail && (
              <>
                <span className="text-border">|</span>
                <span>
                  Default:{" "}
                  <span className="font-medium text-foreground">{defaultEmail.email_address}</span>
                </span>
              </>
            )}
            {Object.entries(platformCounts).map(([platform, count]) => (
              <span key={platform}>
                <span className="text-border">|</span>{" "}
                <span className="font-medium tabular-nums text-foreground">{count}</span> on{" "}
                <span className="capitalize">{platform}</span>
              </span>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            {/* Summary bar */}
            <div className="flex items-center gap-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-48" />
            </div>

            {/* List items */}
            <div className="space-y-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4"
                >
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <Skeleton className="h-4 w-44" />
                      {i === 0 && <Skeleton className="h-4 w-12 rounded-md" />}
                    </div>
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ) : senderEmails.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-sm text-muted-foreground">No sender emails yet</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Add an email address to start dispatching campaigns.
            </p>
            <Button onClick={handleOpenCreate} variant="outline" size="sm" className="mt-5">
              Add your first email
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group, index) => (
              <SenderEmailListItem
                key={group.senderEmail.id}
                group={group}
                index={index}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}
      </div>

      <CreateSenderEmailDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingEmail(null);
        }}
        editingEmail={editingEmail}
        onSave={handleSave}
        onUpdate={handleUpdate}
      />
    </AppLayout>
  );
}
