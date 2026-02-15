import { Mail, Send, MessageSquare, Flame, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

export function KPICards({ emails, activeFilter, onFilterChange }: KPICardsProps) {
  const totalResearched = emails.filter((e) => e.status === "researched").length;
  const totalSentEmails = emails.filter((e) => e.status === "sent").length;
  const repliesReceived = emails.filter((e) => e.status === "replied").length;
  const hotLeads = emails.filter((e) => e.lead_classification === "hot").length;
  const opened = emails.filter((e) => e.status === "opened").length;

  const kpis = [
    {
      label: "New Researches",
      value: totalResearched,
      icon: Mail,
      color: "bg-blue-50 text-blue-600",
      ringColor: "ring-blue-400",
      filter: { type: "status" as const, value: "researched" },
    },
    {
      label: "Total Sent",
      value: totalSentEmails,
      icon: Send,
      color: "bg-purple-50 text-purple-600",
      ringColor: "ring-purple-400",
      filter: { type: "status" as const, value: "sent" },
    },
    {
      label: "Replies Received",
      value: repliesReceived,
      icon: MessageSquare,
      color: "bg-green-50 text-green-600",
      ringColor: "ring-green-400",
      filter: { type: "status" as const, value: "replied" },
    },
    {
      label: "Hot Leads",
      value: hotLeads,
      icon: Flame,
      color: "bg-red-50 text-red-600",
      ringColor: "ring-red-400",
      filter: { type: "classification" as const, value: "hot" },
    },
    {
      label: "Opened",
      value: opened,
      icon: Eye,
      color: "bg-orange-50 text-orange-600",
      ringColor: "ring-orange-400",
      filter: { type: "status" as const, value: "opened" },
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isActive =
          activeFilter?.type === kpi.filter.type && activeFilter?.value === kpi.filter.value;

        return (
          <Card
            key={kpi.label}
            className={`cursor-pointer border-gray-200 transition-all ${
              isActive ? `ring-2 ${kpi.ringColor}` : "hover:shadow-md"
            }`}
            onClick={() => onFilterChange(isActive ? null : kpi.filter)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{kpi.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${kpi.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
