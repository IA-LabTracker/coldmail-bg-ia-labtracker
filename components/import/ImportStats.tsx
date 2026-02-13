"use client";

import { Card, CardContent } from "@/components/ui/card";
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
      label: "Total Rows",
      value: totalRawRows,
      icon: FileSpreadsheet,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Filtered Out",
      value: filteredOutRows,
      icon: Filter,
      color: "text-gray-600",
      bg: "bg-gray-50",
    },
    {
      label: "Valid for Import",
      value: validRows,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Warnings",
      value: warningCount,
      icon: AlertTriangle,
      color: warningCount > 0 ? "text-yellow-600" : "text-gray-400",
      bg: warningCount > 0 ? "bg-yellow-50" : "bg-gray-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`rounded-lg ${stat.bg} p-2`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
