"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Send, MessageSquare, XCircle, Eye, ExternalLink } from "lucide-react";
import { Email } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
}

interface CampaignTableProps {
  emails: Email[];
  searchFilter: string;
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

  return Array.from(groups.entries())
    .map(([campaignName, campaignEmails]) => {
      const sent = campaignEmails.filter((e) => e.status === "sent").length;
      const replied = campaignEmails.filter((e) => e.status === "replied").length;
      const bounced = campaignEmails.filter((e) => e.status === "bounced").length;
      const opened = campaignEmails.filter((e) => e.status === "opened").length;
      const totalSentish = campaignEmails.filter((e) => e.status !== "researched").length;
      const replyRate = totalSentish > 0 ? Math.round((replied / totalSentish) * 100) : 0;

      const dates = campaignEmails
        .map((e) => e.created_at)
        .filter(Boolean)
        .sort();
      const createdAt = dates[0] || "";

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
      };
    })
    .sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export function CampaignTable({ emails, searchFilter }: CampaignTableProps) {
  const router = useRouter();

  const campaigns = useMemo(() => {
    const grouped = groupEmailsByCampaign(emails);
    if (!searchFilter) return grouped;
    const lower = searchFilter.toLowerCase();
    return grouped.filter((c) => c.campaignName.toLowerCase().includes(lower));
  }, [emails, searchFilter]);

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16">
        <p className="text-lg font-medium text-muted-foreground">No campaigns found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Import leads or trigger a search to create campaigns
        </p>
      </div>
    );
  }

  const handleNavigate = (campaignName: string) => {
    router.push(`/campaigns/${encodeURIComponent(campaignName)}`);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted">
            <TableHead>Campaign</TableHead>
            <TableHead className="text-center">Emails</TableHead>
            <TableHead className="text-center">Sent</TableHead>
            <TableHead className="text-center">Replied</TableHead>
            <TableHead className="text-center">Bounced</TableHead>
            <TableHead className="text-center">Opened</TableHead>
            <TableHead className="text-center">Reply Rate</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const replyRateColor =
              campaign.replyRate >= 10
                ? "text-green-600 dark:text-green-400"
                : campaign.replyRate >= 5
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-muted-foreground";

            return (
              <TableRow
                key={campaign.campaignName}
                className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
                onClick={() => handleNavigate(campaign.campaignName)}
              >
                <TableCell>
                  <span className="font-semibold text-foreground">{campaign.campaignName}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{campaign.totalEmails}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-foreground">{campaign.sent}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-foreground">{campaign.replied}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-foreground">{campaign.bounced}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-cyan-500" />
                    <span className="text-foreground">{campaign.opened}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`font-semibold ${replyRateColor}`}>{campaign.replyRate}%</span>
                </TableCell>
                <TableCell className="text-sm text-foreground">
                  {campaign.createdAt
                    ? new Date(campaign.createdAt).toLocaleDateString("en-US")
                    : "-"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(campaign.campaignName);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
