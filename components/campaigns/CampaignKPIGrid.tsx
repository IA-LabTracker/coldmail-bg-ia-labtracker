"use client";

import { memo, useMemo } from "react";
import { Eye, Flame, LucideIcon, Mail, MessageSquare, Send, XCircle } from "lucide-react";
import type { Email } from "@/types";
import { MiniSparkline } from "@/components/shared/MiniSparkline";
import { generateSparkline, SparklinePoint } from "@/lib/sparkline";
import type { CampaignDetailStats } from "@/lib/campaignDetailLogic";

type KpiKey =
  | "total"
  | "sent"
  | "replied"
  | "bounced"
  | "opened"
  | "replyRate"
  | "hotLeads";

interface KpiDef {
  key: KpiKey;
  label: string;
  icon: LucideIcon;
  color: string;
  text: string;
  bg: string;
  iconBg: string;
  border: string;
  /** Empty string = informational only (no filter toggle). */
  filterValue: string;
  match: (e: Email) => boolean;
  format: (s: CampaignDetailStats) => string | number;
}

const matchAll = () => true;
const matchSent = (e: Email) => e.status === "sent";
const matchReplied = (e: Email) => e.status === "replied";
const matchBounced = (e: Email) => e.status === "bounced";
const matchOpened = (e: Email) => e.status === "opened";
const matchHot = (e: Email) => e.lead_classification === "hot";

const KPIS: KpiDef[] = [
  {
    key: "total",
    label: "Total",
    icon: Mail,
    color: "#3b82f6",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/8 dark:bg-blue-500/10",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200/60 dark:border-blue-800/30",
    filterValue: "",
    match: matchAll,
    format: (s) => s.totalEmails,
  },
  {
    key: "sent",
    label: "Sent",
    icon: Send,
    color: "#8b5cf6",
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/8 dark:bg-violet-500/10",
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    border: "border-violet-200/60 dark:border-violet-800/30",
    filterValue: "sent",
    match: matchSent,
    format: (s) => s.sent,
  },
  {
    key: "replied",
    label: "Replied",
    icon: MessageSquare,
    color: "#22c55e",
    text: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/8 dark:bg-green-500/10",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200/60 dark:border-green-800/30",
    filterValue: "replied",
    match: matchReplied,
    format: (s) => s.replied,
  },
  {
    key: "bounced",
    label: "Bounced",
    icon: XCircle,
    color: "#ef4444",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/8 dark:bg-red-500/10",
    iconBg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-200/60 dark:border-red-800/30",
    filterValue: "bounced",
    match: matchBounced,
    format: (s) => s.bounced,
  },
  {
    key: "opened",
    label: "Opened",
    icon: Eye,
    color: "#06b6d4",
    text: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/8 dark:bg-cyan-500/10",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
    border: "border-cyan-200/60 dark:border-cyan-800/30",
    filterValue: "opened",
    match: matchOpened,
    format: (s) => s.opened,
  },
  {
    key: "replyRate",
    label: "Reply Rate",
    icon: MessageSquare,
    color: "#10b981",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/8 dark:bg-emerald-500/10",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    border: "border-emerald-200/60 dark:border-emerald-800/30",
    filterValue: "",
    match: matchReplied,
    format: (s) => `${s.replyRate}%`,
  },
  {
    key: "hotLeads",
    label: "Hot Leads",
    icon: Flame,
    color: "#f97316",
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/8 dark:bg-orange-500/10",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    border: "border-orange-200/60 dark:border-orange-800/30",
    filterValue: "",
    match: matchHot,
    format: (s) => s.hotLeads,
  },
];

const getDate = (e: Email) => e.date_sent || e.created_at;

interface CampaignKPIGridProps {
  emails: Email[];
  stats: CampaignDetailStats;
  activeFilter: string;
  onFilterToggle: (filterValue: string) => void;
}

function CampaignKPIGridImpl({
  emails,
  stats,
  activeFilter,
  onFilterToggle,
}: CampaignKPIGridProps) {
  const sparklines = useMemo<SparklinePoint[][]>(
    () => KPIS.map((kpi) => generateSparkline(emails.filter(kpi.match), getDate)),
    [emails],
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {KPIS.map((kpi, idx) => {
        const Icon = kpi.icon;
        const isClickable = kpi.filterValue !== "";
        const isActive = isClickable && activeFilter === kpi.filterValue;
        return (
          <div
            key={kpi.key}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={isClickable ? () => onFilterToggle(kpi.filterValue) : undefined}
            onKeyDown={
              isClickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onFilterToggle(kpi.filterValue);
                    }
                  }
                : undefined
            }
            className={`
              hover-lift sparkline-hover group
              relative overflow-hidden rounded-xl border
              ${kpi.border} ${kpi.bg}
              backdrop-blur-sm
              animate-list-item
              ${isClickable ? "cursor-pointer" : ""}
              ${isActive ? "ring-2 ring-primary/30" : ""}
            `}
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="flex items-center justify-between px-4 pt-3.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${kpi.iconBg} transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className={`h-3.5 w-3.5 ${kpi.text}`} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
              </div>
            </div>
            <div className="px-4 pt-1">
              <span
                className={`animate-value text-2xl font-bold tracking-tight ${kpi.text}`}
                style={{ animationDelay: `${idx * 80 + 200}ms` }}
              >
                {(() => {
                  const v = kpi.format(stats);
                  return typeof v === "number" ? v.toLocaleString() : v;
                })()}
              </span>
            </div>
            <div className="mt-1 h-8 px-1">
              <MiniSparkline data={sparklines[idx]} color={kpi.color} height={28} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const CampaignKPIGrid = memo(CampaignKPIGridImpl);
