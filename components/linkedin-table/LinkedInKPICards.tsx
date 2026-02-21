import { Send, Eye, MessageSquare, Flame } from "lucide-react";
import { LinkedInMessage } from "@/types";
import { KPIFilter } from "@/components/dashboard/KPICards";

interface LinkedInKPICardsProps {
  messages: LinkedInMessage[];
  activeFilter: KPIFilter | null;
  onFilterChange: (filter: KPIFilter | null) => void;
}

const kpiConfig = [
  {
    label: "Total Sent",
    icon: Send,
    iconColor: "text-blue-500",
    valueColor: "text-blue-600 dark:text-blue-400",
    borderColor: "bg-blue-500/70",
    ringColor: "ring-blue-400",
    filter: { type: "status" as const, value: "sent" },
    compute: (msgs: LinkedInMessage[]) =>
      msgs.filter(
        (m) =>
          m.status === "sent" ||
          m.status === "delivered" ||
          m.status === "read" ||
          m.status === "replied",
      ).length,
    subtitle: "Messages sent",
  },
  {
    label: "Read",
    icon: Eye,
    iconColor: "text-purple-500",
    valueColor: "text-purple-600 dark:text-purple-400",
    borderColor: "bg-purple-500/70",
    ringColor: "ring-purple-400",
    filter: { type: "status" as const, value: "read" },
    compute: (msgs: LinkedInMessage[]) => msgs.filter((m) => m.status === "read").length,
    subtitle: "Messages read",
  },
  {
    label: "Replies",
    icon: MessageSquare,
    iconColor: "text-green-500",
    valueColor: "text-green-600 dark:text-green-400",
    borderColor: "bg-green-500/70",
    ringColor: "ring-green-400",
    filter: { type: "status" as const, value: "replied" },
    compute: (msgs: LinkedInMessage[]) => msgs.filter((m) => m.status === "replied").length,
    subtitle: "Total replies",
  },
  {
    label: "Hot Leads",
    icon: Flame,
    iconColor: "text-red-500",
    valueColor: "text-red-600 dark:text-red-400",
    borderColor: "bg-red-500/70",
    ringColor: "ring-red-400",
    filter: { type: "classification" as const, value: "hot" },
    compute: (msgs: LinkedInMessage[]) =>
      msgs.filter((m) => m.lead_classification === "hot").length,
    subtitle: "Hot classification",
  },
  {
    label: "Opened",
    icon: Eye,
    iconColor: "text-orange-500",
    valueColor: "text-orange-600 dark:text-orange-400",
    borderColor: "bg-orange-500/70",
    ringColor: "ring-orange-400",
    filter: { type: "status" as const, value: "opened" },
    compute: (msgs: LinkedInMessage[]) => msgs.filter((m) => m.status === "opened").length,
    subtitle: "Messages opened",
  },
];

export function LinkedInKPICards({
  messages,
  activeFilter,
  onFilterChange,
}: LinkedInKPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        const value = kpi.compute(messages);
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
                <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
            </div>
            <div className={`h-0.5 w-full ${kpi.borderColor}`} />
          </div>
        );
      })}
    </div>
  );
}
