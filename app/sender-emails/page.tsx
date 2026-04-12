"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { SenderEmail } from "@/types";
import { useSenderEmails, CreateSenderEmailInput, UpdateSenderEmailInput } from "@/hooks/useSenderEmails";
import { AppLayout } from "@/components/AppLayout";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { SenderEmailCard } from "@/components/sender-emails/SenderEmailCard";
import { CreateSenderEmailDialog } from "@/components/sender-emails/CreateSenderEmailDialog";

export default function SenderEmailsPage() {
  const {
    senderEmails,
    loading,
    createSenderEmail,
    updateSenderEmail,
    deleteSenderEmail,
    setDefault,
  } = useSenderEmails();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<SenderEmail | null>(null);

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

  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Sender Emails
            </h1>
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
        {!loading && senderEmails.length > 0 && (
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>
              <span className="font-medium tabular-nums text-foreground">{senderEmails.length}</span>
              {" "}email{senderEmails.length !== 1 ? "s" : ""}
            </span>
            {defaultEmail && (
              <>
                <span className="text-border">|</span>
                <span>
                  Default: <span className="font-medium text-foreground">{defaultEmail.email_address}</span>
                </span>
              </>
            )}
            {(() => {
              const providers = new Set(senderEmails.map((se) => se.provider));
              const providerCount = providers.size;
              if (providerCount <= 1) return null;
              return (
                <>
                  <span className="text-border">|</span>
                  <span>
                    <span className="font-medium tabular-nums text-foreground">{providerCount}</span> providers
                  </span>
                </>
              );
            })()}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : senderEmails.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-sm text-muted-foreground">
              No sender emails yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Add an email address to start dispatching campaigns.
            </p>
            <Button onClick={handleOpenCreate} variant="outline" size="sm" className="mt-5">
              Add your first email
            </Button>
          </div>
        ) : (
          <>
            {/* List header */}
            <div className="flex items-center gap-4 px-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              <div className="w-9 shrink-0" />
              <div className="min-w-0 flex-1">Email</div>
              <div className="hidden w-20 text-center sm:block">Provider</div>
              <div className="hidden w-16 text-center sm:block">Status</div>
              <div className="w-7 shrink-0" />
            </div>

            {/* List */}
            <div className="space-y-1.5">
              {senderEmails.map((senderEmail, index) => (
                <SenderEmailCard
                  key={senderEmail.id}
                  senderEmail={senderEmail}
                  index={index}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                />
              ))}
            </div>
          </>
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
