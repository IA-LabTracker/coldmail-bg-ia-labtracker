"use client";

import { useMemo } from "react";
import { Inbox } from "lucide-react";
import { Email } from "@/types";
import { CampaignListItem } from "./CampaignListItem";

export interface CampaignGroup {
  campaignName: string;
  emails: Email[];
  totalEmails: number;
  sent: number;
  replied: number;
  bounced: number;
  opened: number;
  replyRate: number;
  createdAt: string;
  createdAtMs: number;
}

interface CampaignListProps {
  emails: Email[];
  searchFilter: string;
  sortBy: "recent" | "emails" | "replies" | "rate";
  onRefresh: () => void;
}

export function groupEmailsByCampaign(emails: Email[]): CampaignGroup[] {
  const groups = new Map<string, Email[]>();

  for (const email of emails) {
    const name = email.campaign_name || "No Campaign";
    const existing = groups.get(name);
    if (existing) {
      existing.push(email);
    } else {
      groups.set(name, [email]);
    }
  }

  return Array.from(groups.entries()).map(([campaignName, campaignEmails]) => {
    let sent = 0;
    let replied = 0;
    let bounced = 0;
    let opened = 0;
    let totalSentish = 0;
    let earliest: string | null = null;

    for (const e of campaignEmails) {
      switch (e.status) {
        case "sent":
          sent++;
          break;
        case "replied":
          replied++;
          break;
        case "bounced":
          bounced++;
          break;
        case "opened":
          opened++;
          break;
      }
      if (e.status !== "researched") totalSentish++;
      if (e.created_at && (!earliest || e.created_at < earliest)) {
        earliest = e.created_at;
      }
    }

    const replyRate = totalSentish > 0 ? Math.round((replied / totalSentish) * 100) : 0;
    const createdAt = earliest ?? "";
    const createdAtMs = earliest ? Date.parse(earliest) : 0;

    return {
      campaignName,
      emails: campaignEmails,
      totalEmails: campaignEmails.length,
      sent,
      replied,
      bounced,
      opened,
      replyRate,
      createdAt,
      createdAtMs,
    };
  });
}

function sortCampaigns(campaigns: CampaignGroup[], sortBy: string): CampaignGroup[] {
  return [...campaigns].sort((a, b) => {
    switch (sortBy) {
      case "emails":
        return b.totalEmails - a.totalEmails;
      case "replies":
        return b.replied - a.replied;
      case "rate":
        return b.replyRate - a.replyRate;
      default:
        if (!a.createdAtMs && !b.createdAtMs) return 0;
        if (!a.createdAtMs) return 1;
        if (!b.createdAtMs) return -1;
        return b.createdAtMs - a.createdAtMs;
    }
  });
}

export function CampaignList({ emails, searchFilter, sortBy, onRefresh }: CampaignListProps) {
  const campaigns = useMemo(() => {
    const grouped = groupEmailsByCampaign(emails);
    const filtered = searchFilter
      ? grouped.filter((c) => c.campaignName.toLowerCase().includes(searchFilter.toLowerCase()))
      : grouped;
    return sortCampaigns(filtered, sortBy);
  }, [emails, searchFilter, sortBy]);

  if (campaigns.length === 0) {
    return (
      <div className="animate-fade-up flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted/50">
          <Inbox className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">No campaigns found</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Import leads or trigger a search to create campaigns
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {campaigns.map((campaign, idx) => (
        <CampaignListItem
          key={campaign.campaignName}
          campaign={campaign}
          index={idx}
          onRenamed={onRefresh}
        />
      ))}
    </div>
  );
}
