"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Email, SenderEmail } from "@/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { autoRouteLeads } from "@/lib/autoRouting";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SenderEmailSelect } from "@/components/sender-emails/SenderEmailSelect";
import { AlertCircle, CheckCircle, Info, Send, Trash2, X } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface BulkActionsProps {
  selectedEmails: Email[];
  onClear: () => void;
  onBulkDelete: () => void;
}

type MessageType = "success" | "error" | "info";

interface Message {
  type: MessageType;
  text: string;
}

export function BulkActions({ selectedEmails, onClear, onBulkDelete }: BulkActionsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleAt, setScheduleAt] = useState<string>("");
  const [senderEmails, setSenderEmails] = useState<SenderEmail[]>([]);
  const [senderEmailId, setSenderEmailId] = useState<string | null>(null);

  // Fetch sender emails
  useEffect(() => {
    if (!user) return;
    supabase
      .from("sender_emails")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setSenderEmails(data);
          const def = data.find((se) => se.is_default);
          if (def) setSenderEmailId(def.id);
        }
      });
  }, [user]);

  const ensureDefaultScheduleTime = () => {
    if (scheduleAt) return;
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    const localIso = new Date(
      tenMinutesLater.getTime() - tenMinutesLater.getTimezoneOffset() * 60 * 1000,
    )
      .toISOString()
      .slice(0, 16);
    setScheduleAt(localIso);
  };

  const handleSendInitialEmail = async () => {
    const missingCampaign = selectedEmails.filter((e) => !e.campaign_name?.trim());
    if (missingCampaign.length > 0) {
      setMessage({
        type: "error",
        text: `${missingCampaign.length} email${missingCampaign.length > 1 ? "s" : ""} without a campaign assigned. Please assign a campaign before sending.`,
      });
      return;
    }

    if (!process.env.NEXT_PUBLIC_WEBHOOK_N8N) {
      setMessage({
        type: "error",
        text: "Webhook URL not configured. Please set it in Settings.",
      });
      return;
    }

    let scheduledIso: string | null = null;
    if (scheduleEnabled) {
      if (!scheduleAt) {
        setMessage({ type: "error", text: "Select a date and time to schedule the send." });
        return;
      }
      const scheduledDate = new Date(scheduleAt);
      if (Number.isNaN(scheduledDate.getTime())) {
        setMessage({ type: "error", text: "Invalid schedule date/time." });
        return;
      }
      if (scheduledDate.getTime() <= Date.now()) {
        setMessage({ type: "error", text: "Scheduled time must be in the future." });
        return;
      }
      scheduledIso = scheduledDate.toISOString();
    }

    // Deduplicate by email address — safety net
    const seen = new Set<string>();
    const uniqueEmails = selectedEmails.filter((e) => {
      const key = e.email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setLoading(true);
    setMessage({ type: "info", text: "Preparing dispatch..." });

    try {
      const isAutoRoute = senderEmailId === "__auto__";

      let dispatches: {
        sender_email: Record<string, unknown> | null;
        platform: string;
        emails: Email[];
      }[];

      if (isAutoRoute && user) {
        // Auto-routing: distribute leads across senders with remaining quota
        const groups = await autoRouteLeads(user.id, senderEmails, uniqueEmails);
        if (groups.length === 0) {
          setMessage({
            type: "error",
            text: "No sender emails with remaining daily quota. Increase limits or add more senders.",
          });
          setLoading(false);
          return;
        }
        dispatches = groups.map((g) => ({
          sender_email: {
            id: g.senderEmail.id,
            email_address: g.senderEmail.email_address,
            display_name: g.senderEmail.display_name,
            domain: g.senderEmail.domain,
            provider: g.senderEmail.provider,
            provider_id: g.senderEmail.provider_id,
            platform: g.senderEmail.platform,
          },
          platform: g.platform,
          emails: g.emails,
        }));
      } else {
        // Single sender mode
        const selectedSender = senderEmails.find((se) => se.id === senderEmailId) ?? null;
        const senderPayload = selectedSender
          ? {
              id: selectedSender.id,
              email_address: selectedSender.email_address,
              display_name: selectedSender.display_name,
              domain: selectedSender.domain,
              provider: selectedSender.provider,
              provider_id: selectedSender.provider_id,
              platform: selectedSender.platform,
            }
          : null;
        dispatches = [
          {
            sender_email: senderPayload,
            platform: selectedSender?.platform ?? "none",
            emails: uniqueEmails,
          },
        ];
      }

      setMessage({ type: "info", text: "Triggering dispatch..." });

      // Build payload
      const firstDispatch = dispatches[0];
      await axios.post(process.env.NEXT_PUBLIC_WEBHOOK_N8N, {
        dispatches,
        total_leads: uniqueEmails.length,
        // Legacy compat (first dispatch group)
        emails: firstDispatch.emails,
        sender_email: firstDispatch.sender_email,
        platform: firstDispatch.platform,
        schedule: scheduleEnabled,
        date: scheduledIso,
      });

      // Post-dispatch: update leads in DB per dispatch group
      for (const group of dispatches) {
        if (!group.sender_email) continue;
        const leadIds = group.emails.map((e) => e.id);
        const senderId = group.sender_email.id as string;
        const senderAddr = group.sender_email.email_address as string;
        await supabase
          .from("emails")
          .update({
            sender_email_id: senderId,
            sender_email: senderAddr,
            dispatch_platform: group.platform !== "none" ? group.platform : null,
          })
          .in("id", leadIds);
      }

      const summary = isAutoRoute
        ? `Auto-routed ${uniqueEmails.length} lead${uniqueEmails.length > 1 ? "s" : ""} across ${dispatches.length} sender${dispatches.length > 1 ? "s" : ""}`
        : `Dispatch triggered for ${uniqueEmails.length} recipient${uniqueEmails.length > 1 ? "s" : ""}${firstDispatch.platform !== "none" ? ` via ${firstDispatch.platform}` : ""}`;

      setMessage({ type: "success", text: summary });

      setTimeout(() => {
        onClear();
        setMessage(null);
      }, 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to trigger webhook. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (selectedEmails.length === 0) {
    return null;
  }

  const messageIcons: Record<MessageType, React.ReactNode> = {
    success: <CheckCircle className="h-4 w-4 text-green-600" />,
    error: <AlertCircle className="h-4 w-4 text-red-600" />,
    info: <Info className="h-4 w-4 text-blue-600" />,
  };

  const messageBgs: Record<MessageType, string> = {
    success:
      "bg-green-50 border-green-100 text-green-800 dark:bg-green-950/30 dark:border-green-900 dark:text-green-300",
    error:
      "bg-red-50 border-red-100 text-red-800 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300",
    info: "bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-300",
  };

  const selectedSender = senderEmails.find((se) => se.id === senderEmailId);

  return (
    <Card className="border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
              {selectedEmails.length}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selectedEmails.length} email{selectedEmails.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-muted-foreground">
                Choose an action to run on the selected records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSendInitialEmail} disabled={loading} size="sm" className="gap-2">
              {loading ? <LoadingSpinner /> : <Send className="h-4 w-4" />}
              {loading ? "Sending..." : "Send Initial Email"}
            </Button>

            <Button
              onClick={onBulkDelete}
              disabled={loading}
              variant="outline"
              size="sm"
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>

            <Button
              onClick={onClear}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        {/* Sender email + platform + schedule row */}
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">From:</span>
            <div className="w-[260px]">
              <SenderEmailSelect
                senderEmails={senderEmails}
                value={senderEmailId}
                onChange={setSenderEmailId}
                placeholder="Select sender"
                disabled={loading}
                allowAutoRoute
              />
            </div>
            {senderEmailId === "__auto__" ? (
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                Auto
              </span>
            ) : selectedSender?.platform && selectedSender.platform !== "none" ? (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {selectedSender.platform}
              </span>
            ) : null}
          </div>

          <div className="mx-1 h-5 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Switch
              checked={scheduleEnabled}
              onCheckedChange={(checked) => {
                setScheduleEnabled(checked);
                if (checked) ensureDefaultScheduleTime();
              }}
              disabled={loading}
            />
            <span className="text-xs font-medium text-foreground">Schedule</span>
          </div>
          {scheduleEnabled && (
            <div className="flex items-center gap-2">
              <Input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                disabled={!scheduleEnabled || loading}
                className="w-[200px]"
              />
              <span className="text-[10px] text-muted-foreground">Local time</span>
            </div>
          )}
        </div>

        {message && (
          <div
            className={`flex items-center gap-3 rounded-md border p-3 text-sm ${messageBgs[message.type]}`}
          >
            {messageIcons[message.type]}
            <p>{message.text}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
