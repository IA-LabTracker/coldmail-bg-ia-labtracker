"use client";

import { FileSpreadsheet, Filter, CheckCircle, AlertTriangle } from "lucide-react";

interface ImportStatsProps {
  totalRawRows: number;
  filteredOutRows: number;
  validRows: number;
  warningCount: number;
}

export function ImportStats({
  totalRawRows,
  filteredOutRows,
  validRows,
  warningCount,
}: ImportStatsProps) {
  const stats = [
    {
      label: "Total rows",
      value: totalRawRows,
      icon: FileSpreadsheet,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Filtered out",
      value: filteredOutRows,
      icon: Filter,
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
    },
    {
      label: "Valid",
      value: validRows,
      icon: CheckCircle,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Warnings",
      value: warningCount,
      icon: AlertTriangle,
      iconBg: warningCount > 0 ? "bg-yellow-500/10" : "bg-muted",
      iconColor: warningCount > 0
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-muted-foreground",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2"
        >
          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${stat.iconBg}`}>
            <stat.icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none text-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
