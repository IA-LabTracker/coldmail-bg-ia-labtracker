"use client";

import { memo, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MoreHorizontal, Pencil } from "lucide-react";
import { CampaignGroup } from "./CampaignList";
import { CampaignStatusBadge } from "./CampaignStatusBadge";
import { RenameCampaignDialog } from "./RenameCampaignDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CampaignListItemProps {
  campaign: CampaignGroup;
  index: number;
  onRenamed: () => void;
}

const avatarColors = [
  "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
];

function CampaignAvatar({ name }: { name: string }) {
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colorClass = avatarColors[hash % avatarColors.length];

  const initials = name
    .split(/[\s-_]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-transform duration-300 group-hover:scale-105 ${colorClass}`}
    >
      {initials || <Mail className="h-4 w-4" />}
    </div>
  );
}

function CampaignTags({ campaign }: { campaign: CampaignGroup }) {
  const tags: string[] = [];

  const words = campaign.campaignName.split(/[\s-_]+/).filter((w) => w.length > 2);
  if (words.length > 1) {
    tags.push(words[0]);
    if (words.length > 2) tags.push(words[Math.floor(words.length / 2)]);
  }

  if (tags.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

interface MetricBlockProps {
  value: number;
  label: string;
  sublabel: string;
}

function MetricBlock({ value, label, sublabel }: MetricBlockProps) {
  return (
    <div className="flex flex-col items-start min-w-[80px]">
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {value.toLocaleString()}
        </span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="text-[10px] text-muted-foreground/60">{sublabel}</span>
    </div>
  );
}

function CampaignListItemImpl({ campaign, index, onRenamed }: CampaignListItemProps) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);

  const createdLabel = useMemo(() => {
    if (!campaign.createdAtMs) return "—";
    return new Date(campaign.createdAtMs).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [campaign.createdAtMs]);

  return (
    <>
      <div
        className="animate-list-item hover-lift hover-glow group flex cursor-pointer items-center gap-5 rounded-xl border border-border bg-card px-6 py-5"
        style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
        onClick={() => router.push(`/campaigns/${encodeURIComponent(campaign.campaignName)}`)}
      >
        {/* Avatar */}
        <CampaignAvatar name={campaign.campaignName} />

        {/* Name, Description & Tags */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
            {campaign.campaignName}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {campaign.totalEmails} emails · Created {createdLabel}
          </p>
          <CampaignTags campaign={campaign} />
        </div>

        {/* Metrics */}
        <div className="hidden items-center gap-8 xl:flex">
          <MetricBlock value={campaign.sent} label="Sent" sublabel="Total" />
          <MetricBlock value={campaign.opened} label="Opened" sublabel="Last 30 Days" />
          <MetricBlock value={campaign.replied} label="Replied" sublabel="Last 30 Days" />
          <MetricBlock value={campaign.bounced} label="Bounced" sublabel="Last 30 Days" />
        </div>

        {/* Compact metrics for medium screens */}
        <div className="hidden items-center gap-4 md:flex xl:hidden">
          <div className="text-center">
            <span className="text-lg font-bold tabular-nums text-foreground">{campaign.sent}</span>
            <span className="ml-1 text-[11px] text-muted-foreground">sent</span>
          </div>
          <div className="text-center">
            <span className="text-lg font-bold tabular-nums text-foreground">
              {campaign.replied}
            </span>
            <span className="ml-1 text-[11px] text-muted-foreground">replied</span>
          </div>
        </div>

        {/* Status Badge */}
        <CampaignStatusBadge
          totalEmails={campaign.totalEmails}
          replied={campaign.replied}
          bounced={campaign.bounced}
        />

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 rounded-lg p-2 text-muted-foreground/40 opacity-0 transition-all duration-200 hover:bg-muted hover:text-muted-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
              aria-label="Campaign actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <RenameCampaignDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentName={campaign.campaignName}
        onRenamed={onRenamed}
      />
    </>
  );
}

export const CampaignListItem = memo(CampaignListItemImpl);
