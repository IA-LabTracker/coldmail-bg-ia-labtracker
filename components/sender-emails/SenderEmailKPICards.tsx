"use client";

import { memo } from "react";
import { Eye, Flame, LucideIcon, Mail, MessageSquare, Send, XCircle } from "lucide-react";
import { Email } from "@/types";

export interface EmailKPIStats {
  total: number;
  sent: number;
  replied: number;
  bounced: number;
  opened: number;
  hotLeads: number;
  replyRate: number;
}

export function computeEmailStats(emails: Email[]): EmailKPIStats {
  let sent = 0;
  let replied = 0;
  let bounced = 0;
  let opened = 0;
  let hotLeads = 0;
  let sentish = 0;

  for (const e of emails) {
    if (e.status === "sent") sent++;
    else if (e.status === "replied") replied++;
    else if (e.status === "bounced") bounced++;
    else if (e.status === "opened") opened++;
    if (e.lead_classification === "hot") hotLeads++;
    if (e.status !== "researched") sentish++;
  }

  return {
    total: emails.length,
    sent,
    replied,
    bounced,
    opened,
    hotLeads,
    replyRate: sentish > 0 ? Math.round((replied / sentish) * 100) : 0,
  };
}

interface KPIDef {
  key: keyof EmailKPIStats | "replyRate";
  label: string;
  icon: LucideIcon;
  iconColor: string;
  valueColor: string;
  borderColor: string;
  /** Empty string means the card is informational only (no filter toggle). */
  filterValue: string;
  format: (s: EmailKPIStats) => string | number;
}

const KPI_DEFS: KPIDef[] = [
  {
    key: "total",
    label: "Total",
    icon: Mail,
    iconColor: "text-blue-500",
    valueColor: "text-blue-600 dark:text-blue-400",
    borderColor: "bg-blue-500/70",
    filterValue: "",
    format: (s) => s.total,
  },
  {
    key: "sent",
    label: "Sent",
    icon: Send,
    iconColor: "text-purple-500",
    valueColor: "text-purple-600 dark:text-purple-400",
    borderColor: "bg-purple-500/70",
    filterValue: "sent",
    format: (s) => s.sent,
  },
  {
    key: "replied",
    label: "Replied",
    icon: MessageSquare,
    iconColor: "text-green-500",
    valueColor: "text-green-600 dark:text-green-400",
    borderColor: "bg-green-500/70",
    filterValue: "replied",
    format: (s) => s.replied,
  },
  {
    key: "bounced",
    label: "Bounced",
    icon: XCircle,
    iconColor: "text-red-500",
    valueColor: "text-red-600 dark:text-red-400",
    borderColor: "bg-red-500/70",
    filterValue: "bounced",
    format: (s) => s.bounced,
  },
  {
    key: "opened",
    label: "Opened",
    icon: Eye,
    iconColor: "text-cyan-500",
    valueColor: "text-cyan-600 dark:text-cyan-400",
    borderColor: "bg-cyan-500/70",
    filterValue: "opened",
    format: (s) => s.opened,
  },
  {
    key: "replyRate",
    label: "Reply Rate",
    icon: MessageSquare,
    iconColor: "text-emerald-500",
    valueColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "bg-emerald-500/70",
    filterValue: "",
    format: (s) => `${s.replyRate}%`,
  },
  {
    key: "hotLeads",
    label: "Hot Leads",
    icon: Flame,
    iconColor: "text-orange-500",
    valueColor: "text-orange-600 dark:text-orange-400",
    borderColor: "bg-orange-500/70",
    filterValue: "",
    format: (s) => s.hotLeads,
  },
];

interface SenderEmailKPICardsProps {
  stats: EmailKPIStats;
  activeFilter: string;
  onFilterToggle: (filterValue: string) => void;
}

export const SenderEmailKPICards = memo(function SenderEmailKPICards({
  stats,
  activeFilter,
  onFilterToggle,
}: SenderEmailKPICardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
      {KPI_DEFS.map((kpi) => {
        const Icon = kpi.icon;
        const isClickable = kpi.filterValue !== "";
        const isActive = isClickable && activeFilter === kpi.filterValue;
        return (
          <button
            key={kpi.key}
            type="button"
            disabled={!isClickable}
            onClick={() => isClickable && onFilterToggle(kpi.filterValue)}
            className={`relative overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:shadow-md disabled:cursor-default ${
              isActive ? "ring-2 ring-primary" : ""
            } ${isClickable ? "cursor-pointer" : ""}`}
          >
            <div className="px-4 pb-3 pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {kpi.label}
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${kpi.valueColor}`}>{kpi.format(stats)}</p>
                </div>
                <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
              </div>
            </div>
            <div className={`h-0.5 w-full ${kpi.borderColor}`} />
          </button>
        );
      })}
    </div>
  );
});
