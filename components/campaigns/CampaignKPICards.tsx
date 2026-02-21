"use client";

import { Megaphone, Mail, Reply, Flame } from "lucide-react";
import { Email } from "@/types";

interface CampaignKPICardsProps {
  emails: Email[];
  totalCampaigns: number;
}

const kpiConfig = [
  {
    label: "Total Campaigns",
    icon: Megaphone,
    iconBg: "bg-indigo-50 dark:bg-indigo-950",
    iconColor: "text-indigo-500",
    valueColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "bg-indigo-500",
    compute: (_emails: Email[], totalCampaigns: number) => totalCampaigns,
    subtitle: "Active campaigns",
  },
  {
    label: "Total Emails",
    icon: Mail,
    iconBg: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-500",
    valueColor: "text-blue-600 dark:text-blue-400",
    borderColor: "bg-blue-500",
    compute: (emails: Email[]) => emails.length,
    subtitle: "Across all campaigns",
  },
  {
    label: "Reply Rate",
    icon: Reply,
    iconBg: "bg-green-50 dark:bg-green-950",
    iconColor: "text-green-500",
    valueColor: "text-green-600 dark:text-green-400",
    borderColor: "bg-green-500",
    compute: (emails: Email[]) => {
      const sent = emails.filter((e) => e.status !== "researched").length;
      if (sent === 0) return "0%";
      const replied = emails.filter((e) => e.status === "replied").length;
      return `${Math.round((replied / sent) * 100)}%`;
    },
    subtitle: "Overall reply rate",
  },
  {
    label: "Hot Leads",
    icon: Flame,
    iconBg: "bg-red-50 dark:bg-red-950",
    iconColor: "text-red-500",
    valueColor: "text-red-600 dark:text-red-400",
    borderColor: "bg-red-500",
    compute: (emails: Email[]) => emails.filter((e) => e.lead_classification === "hot").length,
    subtitle: "Hot classification",
  },
];

export function CampaignKPICards({ emails, totalCampaigns }: CampaignKPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        const value = kpi.compute(emails, totalCampaigns);

        return (
          <div
            key={kpi.label}
            className="relative overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="px-5 pb-4 pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {kpi.label}
                  </p>
                  <p className={`mt-2 text-3xl font-bold ${kpi.valueColor}`}>{value}</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{kpi.subtitle}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${kpi.iconBg}`}>
                  <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </div>
              </div>
            </div>
            <div className={`h-1 w-full ${kpi.borderColor}`} />
          </div>
        );
      })}
    </div>
  );
}
