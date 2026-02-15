import { Mail, Send, MessageSquare, Flame, Eye } from "lucide-react";
import { Email } from "@/types";

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
    iconBg: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-500",
    valueColor: "text-blue-600 dark:text-blue-400",
    borderColor: "bg-blue-500",
    ringColor: "ring-blue-400",
    filter: { type: "status" as const, value: "researched" },
    compute: (emails: Email[]) => emails.filter((e) => e.status === "researched").length,
    subtitle: "Researched leads",
  },
  {
    label: "Total Sent",
    icon: Send,
    iconBg: "bg-purple-50 dark:bg-purple-950",
    iconColor: "text-purple-500",
    valueColor: "text-purple-600 dark:text-purple-400",
    borderColor: "bg-purple-500",
    ringColor: "ring-purple-400",
    filter: { type: "status" as const, value: "sent" },
    compute: (emails: Email[]) => emails.filter((e) => e.status === "sent").length,
    subtitle: "Emails sent",
  },
  {
    label: "Replies Received",
    icon: MessageSquare,
    iconBg: "bg-green-50 dark:bg-green-950",
    iconColor: "text-green-500",
    valueColor: "text-green-600 dark:text-green-400",
    borderColor: "bg-green-500",
    ringColor: "ring-green-400",
    filter: { type: "status" as const, value: "replied" },
    compute: (emails: Email[]) => emails.filter((e) => e.status === "replied").length,
    subtitle: "Total replies",
  },
  {
    label: "Hot Leads",
    icon: Flame,
    iconBg: "bg-red-50 dark:bg-red-950",
    iconColor: "text-red-500",
    valueColor: "text-red-600 dark:text-red-400",
    borderColor: "bg-red-500",
    ringColor: "ring-red-400",
    filter: { type: "classification" as const, value: "hot" },
    compute: (emails: Email[]) => emails.filter((e) => e.lead_classification === "hot").length,
    subtitle: "Hot classification",
  },
  {
    label: "Opened",
    icon: Eye,
    iconBg: "bg-orange-50 dark:bg-orange-950",
    iconColor: "text-orange-500",
    valueColor: "text-orange-600 dark:text-orange-400",
    borderColor: "bg-orange-500",
    ringColor: "ring-orange-400",
    filter: { type: "status" as const, value: "opened" },
    compute: (emails: Email[]) => emails.filter((e) => e.status === "opened").length,
    subtitle: "Emails opened",
  },
];

export function KPICards({ emails, activeFilter, onFilterChange }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        const value = kpi.compute(emails);
        const isActive =
          activeFilter?.type === kpi.filter.type && activeFilter?.value === kpi.filter.value;

        return (
          <div
            key={kpi.label}
            className={`relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md ${
              isActive ? `ring-2 ${kpi.ringColor}` : ""
            }`}
            onClick={() => onFilterChange(isActive ? null : kpi.filter)}
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
