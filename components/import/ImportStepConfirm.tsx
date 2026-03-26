"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import {
  FileSpreadsheet,
  CheckCircle,
  Loader2,
  Users,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { ImportStatus } from "@/types";

interface ImportStepConfirmProps {
  status: ImportStatus;
  totalRows: number;
  importedRows: number;
  warningCount: number;
  defaultCampaign: string;
  rowsWithoutCampaign: number;
}

export function ImportStepConfirm({
  status,
  totalRows,
  importedRows,
  warningCount,
  defaultCampaign,
  rowsWithoutCampaign,
}: ImportStepConfirmProps) {
  const progress = totalRows > 0 ? Math.round((importedRows / totalRows) * 100) : 0;

  if (status === "success") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10"
        >
          <CheckCircle className="h-12 w-12 text-green-500" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-2xl font-semibold text-foreground">Import Complete!</p>
          <p className="mt-1 text-muted-foreground">
            {importedRows} leads have been imported successfully.
          </p>
        </motion.div>
      </div>
    );
  }

  if (status === "importing") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-primary" />
        </motion.div>
        <div className="w-full max-w-sm text-center">
          <p className="mb-3 text-base font-medium text-foreground">Importing leads...</p>
          <Progress value={progress} className="h-2" />
          <p className="mt-2 text-sm text-muted-foreground">
            {importedRows} of {totalRows} ({progress}%)
          </p>
        </div>
      </div>
    );
  }

  const summaryItems = [
    {
      icon: Users,
      label: "Leads to import",
      value: totalRows.toLocaleString(),
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Tag,
      label: "Default campaign",
      value: defaultCampaign.trim() || "None",
      color: defaultCampaign.trim() ? "text-primary" : "text-muted-foreground",
      bg: defaultCampaign.trim() ? "bg-primary/10" : "bg-muted",
    },
    {
      icon: AlertTriangle,
      label: "Warnings",
      value: warningCount.toString(),
      color: warningCount > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600",
      bg: warningCount > 0 ? "bg-yellow-500/10" : "bg-green-500/10",
    },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10"
      >
        <FileSpreadsheet className="h-10 w-10 text-primary" />
      </motion.div>

      <div className="text-center">
        <p className="text-xl font-semibold text-foreground">Ready to Import</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the summary below before importing.
        </p>
      </div>

      {rowsWithoutCampaign > 0 && !defaultCampaign.trim() && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3"
        >
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <p className="text-sm text-orange-600 dark:text-orange-400">
            {rowsWithoutCampaign} lead{rowsWithoutCampaign > 1 ? "s" : ""} without campaign.
            Go back to assign campaigns or set a default.
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid w-full max-w-md gap-3"
      >
        {summaryItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bg}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
