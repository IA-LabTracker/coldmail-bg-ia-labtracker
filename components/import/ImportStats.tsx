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
      label: "Total",
      value: totalRawRows,
      icon: FileSpreadsheet,
      color: "text-blue-600",
    },
    {
      label: "Filtered",
      value: filteredOutRows,
      icon: Filter,
      color: "text-muted-foreground",
    },
    {
      label: "Valid",
      value: validRows,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: "Warnings",
      value: warningCount,
      icon: AlertTriangle,
      color: warningCount > 0 ? "text-yellow-600" : "text-muted-foreground",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-5">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-2">
          <stat.icon className={`h-4 w-4 ${stat.color}`} />
          <span className="text-sm font-semibold text-foreground">{stat.value}</span>
          <span className="text-xs text-muted-foreground">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
