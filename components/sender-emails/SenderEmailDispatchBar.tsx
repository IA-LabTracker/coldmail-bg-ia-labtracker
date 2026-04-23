"use client";

import { useState } from "react";
import axios from "axios";
import { Email, SenderEmail, SenderEmailPlatform } from "@/types";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PlatformIndicator } from "@/components/sender-emails/PlatformIndicator";

interface SenderEmailDispatchBarProps {
  senderEmail: SenderEmail;
  selectedEmails: Email[];
  onClear: () => void;
  onDispatchComplete: () => void;
}

const PLATFORM_OPTIONS: { value: SenderEmailPlatform; label: string }[] = [
  { value: "google", label: "Google / Gmail" },
  { value: "outlook", label: "Outlook" },
  { value: "smartlead", label: "SmartLead" },
  { value: "resend", label: "Resend" },
  { value: "zapmail", label: "Zapmail" },
];

export function SenderEmailDispatchBar({
  senderEmail,
  selectedEmails,
  onClear,
  onDispatchComplete,
}: SenderEmailDispatchBarProps) {
  const defaultPlatform =
    senderEmail.platform && senderEmail.platform !== "none"
      ? senderEmail.platform
      : "smartlead";

  const [platform, setPlatform] = useState<SenderEmailPlatform>(defaultPlatform as SenderEmailPlatform);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDispatch = async () => {
    if (selectedEmails.length === 0) return;

    const missingCampaign = selectedEmails.filter((e) => !e.campaign_name?.trim());
    if (missingCampaign.length > 0) {
      toast.error(`${missingCampaign.length} email(s) without campaign. Assign a campaign first.`);
      return;
    }

    if (!process.env.NEXT_PUBLIC_WEBHOOK_N8N) {
      toast.error("Webhook URL not configured. Set it in Settings.");
      return;
    }

    let scheduledIso: string | null = null;
    if (scheduleEnabled) {
      if (!scheduleAt) {
        toast.error("Select a date and time to schedule.");
        return;
      }
      const date = new Date(scheduleAt);
      if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
        toast.error("Scheduled time must be in the future.");
        return;
      }
      scheduledIso = date.toISOString();
    }

    // Deduplicate
    const seen = new Set<string>();
    const uniqueEmails = selectedEmails.filter((e) => {
      const key = e.email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setLoading(true);

    try {
      // Build payload — new dispatches[] format + legacy flat format for backward compat
      const dispatchGroup = {
        sender_email: {
          id: senderEmail.id,
          email_address: senderEmail.email_address,
          display_name: senderEmail.display_name,
          domain: senderEmail.domain,
          provider: senderEmail.provider,
          provider_id: senderEmail.provider_id,
          platform,
        },
        platform,
        emails: uniqueEmails,
      };

      await axios.post(process.env.NEXT_PUBLIC_WEBHOOK_N8N, {
        // New format
        dispatches: [dispatchGroup],
        total_leads: uniqueEmails.length,
        // Legacy format (backward compat)
        emails: uniqueEmails,
        sender_email: dispatchGroup.sender_email,
        platform,
        schedule: scheduleEnabled,
        date: scheduledIso,
      });

      // Post-dispatch: update leads in DB
      const leadIds = uniqueEmails.map((e) => e.id);
      await supabase
        .from("emails")
        .update({
          sender_email_id: senderEmail.id,
          sender_email: senderEmail.email_address,
          dispatch_platform: platform !== "none" ? platform : null,
        })
        .in("id", leadIds);

      toast.success(
        `Dispatched ${uniqueEmails.length} lead${uniqueEmails.length > 1 ? "s" : ""} via ${platform}`,
      );

      onClear();
      onDispatchComplete();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to trigger dispatch. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (selectedEmails.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {selectedEmails.length}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {selectedEmails.length} lead{selectedEmails.length > 1 ? "s" : ""} selected
            </p>
            <p className="text-xs text-muted-foreground">
              From: {senderEmail.email_address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Platform:</span>
          <Select value={platform} onValueChange={(v) => setPlatform(v as SenderEmailPlatform)}>
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLATFORM_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <PlatformIndicator platform={opt.value} size="md" iconOnly />
                    <span>{opt.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={scheduleEnabled}
            onCheckedChange={(checked) => {
              setScheduleEnabled(checked);
              if (checked && !scheduleAt) {
                const later = new Date(Date.now() + 10 * 60 * 1000);
                const local = new Date(later.getTime() - later.getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16);
                setScheduleAt(local);
              }
            }}
            disabled={loading}
          />
          <span className="text-xs font-medium text-foreground">Schedule</span>
        </div>

        {scheduleEnabled && (
          <Input
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            disabled={loading}
            className="h-8 w-[200px]"
          />
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClear} disabled={loading}>
            Clear
          </Button>
          <Button size="sm" onClick={handleDispatch} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {loading ? "Dispatching..." : "Dispatch"}
          </Button>
        </div>
      </div>
    </div>
  );
}
