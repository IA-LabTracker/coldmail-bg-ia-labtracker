"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DateRange } from "react-day-picker";
import { Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Email, SenderEmail } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { EmailDetailModal } from "@/components/dashboard/EmailDetailModal";
import { EmailFilters } from "@/components/dashboard/EmailFilters";
import { EmailListTable } from "@/components/shared/EmailListTable";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { SenderEmailDispatchBar } from "@/components/sender-emails/SenderEmailDispatchBar";
import { SenderEmailDetailHeader } from "@/components/sender-emails/SenderEmailDetailHeader";
import { SenderEmailDetailSkeleton } from "@/components/sender-emails/SenderEmailDetailSkeleton";
import {
  computeEmailStats,
  SenderEmailKPICards,
} from "@/components/sender-emails/SenderEmailKPICards";
import { useEmailSelection } from "@/hooks/useEmailSelection";
import { useTemplates } from "@/hooks/useTemplates";
import { resolveTemplateForSender } from "@/lib/resolveTemplate";

interface Filters {
  search: string;
  status: string;
  classification: string;
  clientStep: string;
  dateRange: DateRange | undefined;
}

function applyEmailFilters(emails: Email[], f: Filters): Email[] {
  const search = f.search.trim().toLowerCase();
  const fromMs = f.dateRange?.from?.getTime();
  const toMs = f.dateRange?.to?.getTime();

  return emails.filter((e) => {
    if (f.status && e.status !== f.status) return false;
    if (f.classification && e.lead_classification !== f.classification) return false;
    if (f.clientStep && e.client_step !== f.clientStep) return false;
    if (fromMs !== undefined) {
      const d = e.created_at ? new Date(e.created_at).getTime() : NaN;
      if (Number.isNaN(d) || d < fromMs) return false;
      if (toMs !== undefined && d > toMs) return false;
    }
    if (search) {
      const hit =
        e.company.toLowerCase().includes(search) ||
        e.email.toLowerCase().includes(search) ||
        (e.lead_name ?? "").toLowerCase().includes(search) ||
        (e.lead_category ?? "").toLowerCase().includes(search);
      if (!hit) return false;
    }
    return true;
  });
}

export default function SenderEmailDetailPage() {
  const params = useParams();
  const senderEmailId = params.id as string;
  const { user } = useAuth();
  const { templates } = useTemplates();

  const [senderEmail, setSenderEmail] = useState<SenderEmail | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [classification, setClassification] = useState("");
  const [clientStep, setClientStep] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [detailEmail, setDetailEmail] = useState<Email | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Email | null>(null);

  const {
    selectedIds,
    selectedEmails,
    isAllSelected,
    toggleEmailSelection,
    toggleSelectAllVisible,
    clearSelection,
  } = useEmailSelection(emails);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const [seRes, emailsRes] = await Promise.all([
        supabase
          .from("sender_emails")
          .select("*")
          .eq("id", senderEmailId)
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("emails")
          .select("*")
          .eq("user_id", user.id)
          .eq("sender_email_id", senderEmailId)
          .order("created_at", { ascending: false }),
      ]);

      if (seRes.error) throw seRes.error;
      setSenderEmail(seRes.data);
      setEmails(emailsRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sender email");
    } finally {
      setLoading(false);
    }
  }, [user, senderEmailId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => computeEmailStats(emails), [emails]);

  const filteredEmails = useMemo(
    () => applyEmailFilters(emails, { search, status, classification, clientStep, dateRange }),
    [emails, search, status, classification, clientStep, dateRange],
  );

  const resolvedTemplate = useMemo(
    () => resolveTemplateForSender(senderEmail?.platform, templates),
    [senderEmail?.platform, templates],
  );

  const handleViewDetails = useCallback((email: Email) => {
    setDetailEmail(email);
    setDetailOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((email: Email) => {
    setDeleteTarget(email);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    try {
      await supabase.from("emails").delete().eq("id", id);
      setEmails((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  const handleKpiFilterToggle = useCallback((filterValue: string) => {
    setStatus((prev) => (prev === filterValue ? "" : filterValue));
    setClassification("");
    setClientStep("");
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <SenderEmailDetailHeader
          senderEmail={senderEmail}
          totalEmails={stats.total}
          template={resolvedTemplate}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <SenderEmailDetailSkeleton />
        ) : (
          <>
            <SenderEmailKPICards
              stats={stats}
              activeFilter={status}
              onFilterToggle={handleKpiFilterToggle}
            />

            <EmailFilters
              search={search}
              onSearchChange={setSearch}
              status={status}
              onStatusChange={setStatus}
              classification={classification}
              onClassificationChange={setClassification}
              clientStep={clientStep}
              onClientStepChange={setClientStep}
            />

            {senderEmail && selectedEmails.length > 0 && (
              <SenderEmailDispatchBar
                senderEmail={senderEmail}
                selectedEmails={selectedEmails}
                onClear={clearSelection}
                onDispatchComplete={fetchData}
              />
            )}

            {stats.total === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-16 text-center">
                <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No leads assigned to this sender email yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Dispatch leads from the Dashboard to assign them here.
                </p>
              </div>
            ) : (
              <EmailListTable
                emails={filteredEmails}
                selectedIds={selectedIds}
                allVisibleEmails={filteredEmails}
                isAllSelected={isAllSelected(filteredEmails)}
                onSelectAll={() => toggleSelectAllVisible(filteredEmails)}
                onSelectEmail={toggleEmailSelection}
                onViewDetails={handleViewDetails}
                onDelete={handleDeleteRequest}
              />
            )}

            <EmailDetailModal
              email={detailEmail}
              open={detailOpen}
              onOpenChange={setDetailOpen}
              onUpdate={fetchData}
            />

            <ConfirmDeleteDialog
              open={!!deleteTarget}
              onOpenChange={(open) => !open && setDeleteTarget(null)}
              title="Delete Record"
              description={
                <>
                  Are you sure you want to delete the record for{" "}
                  <strong>{deleteTarget?.company}</strong>?
                </>
              }
              onConfirm={handleConfirmDelete}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
