"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Inbox as InboxIcon, Archive } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Email, ReplyAction } from "@/types";
import {
  INTENT_LABELS,
  INTENT_ORDER,
  ReplyIntent,
  classifyReply,
} from "@/lib/replyClassifier";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InboxRow } from "@/components/inbox/InboxRow";
import { EmailDetailModal } from "@/components/dashboard/EmailDetailModal";
import { useSenderEmails } from "@/hooks/useSenderEmails";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

type IntentFilter = "all" | ReplyIntent;

const FILTER_TABS: { key: IntentFilter; label: string }[] = [
  { key: "all", label: "All" },
  ...INTENT_ORDER.map((intent) => ({ key: intent, label: INTENT_LABELS[intent] })),
];

export default function InboxPage() {
  const { user } = useAuth();
  const { senderEmails } = useSenderEmails();

  const [emails, setEmails] = useState<Email[]>([]);
  const [actionsByEmail, setActionsByEmail] = useState<Map<string, ReplyAction>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intentFilter, setIntentFilter] = useState<IntentFilter>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [detailEmail, setDetailEmail] = useState<Email | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchInbox = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const [emailsRes, actionsRes] = await Promise.all([
        supabase
          .from("emails")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "replied")
          .not("reply_we_got", "is", null)
          .order("updated_at", { ascending: false }),
        supabase.from("reply_actions").select("*").eq("user_id", user.id),
      ]);
      if (emailsRes.error) throw emailsRes.error;
      if (actionsRes.error) throw actionsRes.error;
      setEmails((emailsRes.data as Email[]) || []);
      const map = new Map<string, ReplyAction>();
      for (const a of (actionsRes.data as ReplyAction[]) || []) map.set(a.email_id, a);
      setActionsByEmail(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // Single-pass: per-email derived intent + bucket counts.
  const { rows, counts } = useMemo(() => {
    const bucketsByIntent: Record<IntentFilter, number> = {
      all: 0,
      positive: 0,
      objection: 0,
      negative: 0,
      ooo: 0,
      unsubscribe: 0,
      other: 0,
    };
    type Row = { email: Email; intent: ReplyIntent; archived: boolean };
    const rowsList: Row[] = [];
    for (const e of emails) {
      const action = actionsByEmail.get(e.id);
      const intent: ReplyIntent =
        (action?.intent_override as ReplyIntent | undefined) ?? classifyReply(e.reply_we_got);
      const archived = action?.is_archived ?? false;
      // Always count for "all" (regardless of archive). Per-intent count only
      // for non-archived rows so the filter chips reflect the active inbox.
      bucketsByIntent.all += 1;
      if (!archived) bucketsByIntent[intent] += 1;
      rowsList.push({ email: e, intent, archived });
    }
    return { rows: rowsList, counts: bucketsByIntent };
  }, [emails, actionsByEmail]);

  const visibleRows = useMemo(() => {
    return rows.filter((r) => {
      if (showArchived !== r.archived) return false;
      if (intentFilter === "all") return true;
      return r.intent === intentFilter;
    });
  }, [rows, intentFilter, showArchived]);

  const archivedCount = useMemo(() => rows.filter((r) => r.archived).length, [rows]);

  const upsertReplyAction = useCallback(
    async (emailId: string, patch: Partial<ReplyAction>) => {
      if (!user) return null;
      const existing = actionsByEmail.get(emailId);
      const payload = {
        email_id: emailId,
        user_id: user.id,
        intent_override: existing?.intent_override ?? null,
        is_archived: existing?.is_archived ?? false,
        archived_at: existing?.archived_at ?? null,
        ...patch,
      };
      const { data, error: upsertError } = await supabase
        .from("reply_actions")
        .upsert(payload, { onConflict: "email_id" })
        .select()
        .single();
      if (upsertError) {
        toast.error(upsertError.message);
        return null;
      }
      setActionsByEmail((prev) => {
        const next = new Map(prev);
        next.set(emailId, data as ReplyAction);
        return next;
      });
      return data as ReplyAction;
    },
    [user, actionsByEmail],
  );

  const handleSetArchived = useCallback(
    async (email: Email, archived: boolean) => {
      await upsertReplyAction(email.id, {
        is_archived: archived,
        archived_at: archived ? new Date().toISOString() : null,
      });
      toast.success(archived ? "Reply archived" : "Reply restored");
    },
    [upsertReplyAction],
  );

  const handleMarkDeal = useCallback(
    async (email: Email, status: "won" | "lost") => {
      const optimistic = emails.map((e) =>
        e.id === email.id
          ? { ...e, deal_status: status, deal_closed_at: new Date().toISOString() }
          : e,
      );
      setEmails(optimistic);

      const previous = emails;
      const { error: updateError } = await supabase
        .from("emails")
        .update({
          deal_status: status,
          deal_closed_at: new Date().toISOString(),
        })
        .eq("id", email.id);
      if (updateError) {
        // rollback to the snapshot taken before the optimistic write
        setEmails(previous);
        toast.error(updateError.message);
        return;
      }
      toast.success(status === "won" ? "Deal closed as won" : "Deal closed as lost");
    },
    [emails],
  );

  const handleOpenDetail = useCallback((email: Email) => {
    setDetailEmail(email);
    setDetailOpen(true);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              <InboxIcon className="h-6 w-6" />
              Inbox
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Triage replies from your campaigns. Replies are auto-classified by intent.
            </p>
          </div>
          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
          >
            <Archive className="mr-1.5 h-3.5 w-3.5" />
            Archived ({archivedCount})
          </Button>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Filter chips by intent */}
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const isActive = intentFilter === tab.key;
            const count = counts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setIntentFilter(tab.key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {tab.label}{" "}
                <span className={isActive ? "opacity-60" : "opacity-40"}>· {count}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center">
            <InboxIcon className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              {showArchived
                ? "No archived replies."
                : intentFilter === "all"
                  ? "No replies yet. They will appear here as soon as leads respond to your campaigns."
                  : `No replies classified as "${INTENT_LABELS[intentFilter as ReplyIntent]}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRows.map(({ email, archived }) => (
              <InboxRow
                key={email.id}
                email={email}
                intentOverride={
                  (actionsByEmail.get(email.id)?.intent_override as ReplyIntent | null) ?? null
                }
                isArchived={archived}
                onOpenDetail={handleOpenDetail}
                onSetArchived={handleSetArchived}
                onMarkDeal={handleMarkDeal}
              />
            ))}
          </div>
        )}
      </div>

      <EmailDetailModal
        email={detailEmail}
        senderEmails={senderEmails}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={fetchInbox}
      />
    </AppLayout>
  );
}
