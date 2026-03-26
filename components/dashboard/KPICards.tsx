"use client";

import { Mail, Send, MessageSquare, Flame, Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMemo } from "react";
import { Email } from "@/types";
import { MiniSparkline } from "@/components/shared/MiniSparkline";
import { generateSparkline } from "@/lib/sparkline";

export interface KPIFilter {
  type: "status" | "classification";
  value: string;
}

interface KPICardsProps {
  emails: Email[];
  activeFilter: KPIFilter | null;
  onFilterChange: (filter: KPIFilter | null) => void;
}

const kpiConfig = [
  {
    label: "New Researches",
    icon: Mail,
    color: "#3b82f6",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/8 dark:bg-blue-500/10",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200/60 dark:border-blue-800/30",
    ringColor: "ring-blue-400",
    filter: { type: "status" as const, value: "researched" },
    compute: (emails: Email[]) => emails.filter((e) => e.status === "researched").length,
    filterFn: (e: Email) => e.status === "researched",
  },
  {
    label: "Total Sent",
    icon: Send,
    color: "#8b5cf6",
    text: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/8 dark:bg-purple-500/10",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    border: "border-purple-200/60 dark:border-purple-800/30",
    ringColor: "ring-purple-400",
    filter: { type: "status" as const, value: "sent" },
    compute: (emails: Email[]) => emails.filter((e) => e.status === "sent").length,
    filterFn: (e: Email) => e.status === "sent",
  },
  {
    label: "Replies Received",
    icon: MessageSquare,
    color: "#22c55e",
    text: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/8 dark:bg-green-500/10",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200/60 dark:border-green-800/30",
    ringColor: "ring-green-400",
    filter: { type: "status" as const, value: "replied" },
    compute: (emails: Email[]) => emails.filter((e) => e.status === "replied").length,
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
    ringColor: "ring-red-400",
    filter: { type: "classification" as const, value: "hot" },
    compute: (emails: Email[]) => emails.filter((e) => e.lead_classification === "hot").length,
    filterFn: (e: Email) => e.lead_classification === "hot",
  },
  {
    label: "Opened",
    icon: Eye,
    color: "#f97316",
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/8 dark:bg-orange-500/10",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    border: "border-orange-200/60 dark:border-orange-800/30",
    ringColor: "ring-orange-400",
    filter: { type: "status" as const, value: "opened" },
    compute: (emails: Email[]) => emails.filter((e) => e.status === "opened").length,
    filterFn: (e: Email) => e.status === "opened",
  },
];

export function KPICards({ emails, activeFilter, onFilterChange }: KPICardsProps) {
  const sparklines = useMemo(() => {
    return kpiConfig.map((kpi) => {
      const filtered = emails.filter(kpi.filterFn);
      return generateSparkline(filtered, (e) => e.date_sent || e.created_at);
    });
  }, [emails]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {kpiConfig.map((kpi, idx) => {
        const Icon = kpi.icon;
        const value = kpi.compute(emails);
        const isActive =
          activeFilter?.type === kpi.filter.type && activeFilter?.value === kpi.filter.value;

        return (
          <div
            key={kpi.label}
            className={`
              card-hover sparkline-hover
              relative cursor-pointer overflow-hidden rounded-xl border
              ${kpi.border} ${kpi.bg}
              backdrop-blur-sm transition-all
              ${isActive ? `ring-2 ${kpi.ringColor}` : ""}
              animate-fade-up stagger-${idx + 1}
            `}
            onClick={() => onFilterChange(isActive ? null : kpi.filter)}
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
                {value.toLocaleString()}
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
