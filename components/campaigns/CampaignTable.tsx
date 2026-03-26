"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  MessageSquare,
  XCircle,
  Eye,
  Mail,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { Email } from "@/types";
import { Badge } from "@/components/ui/badge";

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

function ReplyRateBar({ rate }: { rate: number }) {
  const color =
    rate >= 10
      ? "bg-green-500"
      : rate >= 5
        ? "bg-yellow-500"
        : "bg-slate-400 dark:bg-slate-600";

  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <span
        className={`text-xs font-semibold tabular-nums ${
          rate >= 10
            ? "text-green-600 dark:text-green-400"
            : rate >= 5
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-muted-foreground"
        }`}
      >
        {rate}%
      </span>
    </div>
  );
}

const metrics = [
  { key: "sent" as const, label: "Sent", icon: Send, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "replied" as const, label: "Replied", icon: MessageSquare, color: "text-green-500", bg: "bg-green-500/10" },
  { key: "bounced" as const, label: "Bounced", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
  { key: "opened" as const, label: "Opened", icon: Eye, color: "text-cyan-500", bg: "bg-cyan-500/10" },
] as const;

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
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
        <Mail className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-lg font-medium text-muted-foreground">No campaigns found</p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Import leads or trigger a search to create campaigns
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((campaign, idx) => (
        <div
          key={campaign.campaignName}
          className={`
            group cursor-pointer rounded-xl border border-border bg-card
            p-5 transition-all duration-200
            hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
            animate-fade-up stagger-${(idx % 6) + 1}
          `}
          onClick={() =>
            router.push(`/campaigns/${encodeURIComponent(campaign.campaignName)}`)
          }
        >
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                {campaign.campaignName}
              </h3>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {campaign.createdAt
                    ? new Date(campaign.createdAt).toLocaleDateString("pt-BR")
                    : "—"}
                </span>
                <Badge variant="secondary" className="px-2 py-0 text-[10px]">
                  {campaign.totalEmails} emails
                </Badge>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>

          {/* Reply Rate */}
          <div className="mb-4">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Reply Rate
            </p>
            <ReplyRateBar rate={campaign.replyRate} />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-4 gap-2">
            {metrics.map((m) => {
              const Icon = m.icon;
              const value = campaign[m.key];
              return (
                <div
                  key={m.key}
                  className={`flex flex-col items-center rounded-lg ${m.bg} py-2`}
                >
                  <Icon className={`mb-1 h-3.5 w-3.5 ${m.color}`} />
                  <span className="text-sm font-bold text-foreground">{value}</span>
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
