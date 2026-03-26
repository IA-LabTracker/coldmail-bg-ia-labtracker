"use client";

import { Megaphone, Mail, Reply, Flame } from "lucide-react";
import { useMemo } from "react";
import { Email } from "@/types";
import { MiniSparkline } from "@/components/shared/MiniSparkline";
import { generateSparkline } from "@/lib/sparkline";

interface CampaignKPICardsProps {
  emails: Email[];
  totalCampaigns: number;
}

const kpiConfig = [
  {
    label: "Total Campaigns",
    icon: Megaphone,
    color: "#6366f1",
    text: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/8 dark:bg-indigo-500/10",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
    border: "border-indigo-200/60 dark:border-indigo-800/30",
    compute: (_emails: Email[], totalCampaigns: number) => totalCampaigns,
    filterFn: () => true,
  },
  {
    label: "Total Emails",
    icon: Mail,
    color: "#3b82f6",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/8 dark:bg-blue-500/10",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200/60 dark:border-blue-800/30",
    compute: (emails: Email[]) => emails.length,
    filterFn: () => true,
  },
  {
    label: "Reply Rate",
    icon: Reply,
    color: "#22c55e",
    text: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/8 dark:bg-green-500/10",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200/60 dark:border-green-800/30",
    compute: (emails: Email[]) => {
      const sent = emails.filter((e) => e.status !== "researched").length;
      if (sent === 0) return "0%";
      const replied = emails.filter((e) => e.status === "replied").length;
      return `${Math.round((replied / sent) * 100)}%`;
    },
    filterFn: (e: Email) => e.status === "replied",
  },
  {
    label: "Hot Leads",
    icon: Flame,
    color: "#ef4444",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/8 dark:bg-red-500/10",
    iconBg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-200/60 dark:border-red-800/30",
    compute: (emails: Email[]) => emails.filter((e) => e.lead_classification === "hot").length,
    filterFn: (e: Email) => e.lead_classification === "hot",
  },
];

export function CampaignKPICards({ emails, totalCampaigns }: CampaignKPICardsProps) {
  const sparklines = useMemo(() => {
    return kpiConfig.map((kpi) => {
      const filtered = emails.filter(kpi.filterFn);
      return generateSparkline(filtered, (e) => e.date_sent || e.created_at);
    });
  }, [emails]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpiConfig.map((kpi, idx) => {
        const Icon = kpi.icon;
        const value = kpi.compute(emails, totalCampaigns);

        return (
          <div
            key={kpi.label}
            className={`
              card-hover sparkline-hover
              relative overflow-hidden rounded-xl border
              ${kpi.border} ${kpi.bg}
              backdrop-blur-sm
              animate-fade-up stagger-${idx + 1}
            `}
          >
            <div className="flex items-center justify-between px-4 pt-3.5">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${kpi.iconBg}`}>
                  <Icon className={`h-3.5 w-3.5 ${kpi.text}`} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
              </div>
            </div>
            <div className="px-4 pt-1">
              <span className={`text-2xl font-bold tracking-tight ${kpi.text}`}>
                {typeof value === "number" ? value.toLocaleString() : value}
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
