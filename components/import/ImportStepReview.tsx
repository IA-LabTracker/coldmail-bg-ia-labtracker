"use client";

import { motion } from "framer-motion";
import { ImportRow, ImportValidation } from "@/types";
import { ImportStats } from "./ImportStats";
import { PreviewTable } from "./PreviewTable";
import { ValidationWarnings } from "./ValidationWarnings";
import { CampaignAssignBar } from "./CampaignAssignBar";
import { AlertCircle } from "lucide-react";

interface ImportStepReviewProps {
  rows: ImportRow[];
  validations: ImportValidation[];
  totalRawRows: number;
  filteredOutRows: number;
  warningCount: number;
  rowsWithoutCampaign: number;
  defaultCampaign: string;
  selectedRows: Set<number>;
  campaignSuggestions: string[];
  onRowUpdate: (rowIndex: number, field: keyof ImportRow, value: string) => void;
  onSelectRow: (rowIndex: number) => void;
  onSelectAll: () => void;
  onCampaignAssign: (campaignName: string) => void;
  onClearSelection: () => void;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function ImportStepReview({
  rows,
  validations,
  totalRawRows,
  filteredOutRows,
  warningCount,
  rowsWithoutCampaign,
  defaultCampaign,
  selectedRows,
  campaignSuggestions,
  onRowUpdate,
  onSelectRow,
  onSelectAll,
  onCampaignAssign,
  onClearSelection,
}: ImportStepReviewProps) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="flex flex-1 flex-col gap-4 overflow-hidden"
    >
      <motion.div variants={fadeUp}>
        <ImportStats
          totalRawRows={totalRawRows}
          filteredOutRows={filteredOutRows}
          validRows={rows.length}
          warningCount={warningCount}
        />
      </motion.div>

      {validations.length > 0 && (
        <motion.div variants={fadeUp}>
          <ValidationWarnings validations={validations} />
        </motion.div>
      )}

      {rowsWithoutCampaign > 0 && !defaultCampaign.trim() && (
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-orange-500" />
          <p className="text-sm text-orange-600 dark:text-orange-400">
            {rowsWithoutCampaign} lead{rowsWithoutCampaign > 1 ? "s" : ""} without campaign
            &mdash; select rows to assign, or go back and set a default campaign.
          </p>
        </motion.div>
      )}

      {selectedRows.size > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <CampaignAssignBar
            selectedCount={selectedRows.size}
            totalCount={rows.length}
            campaignSuggestions={campaignSuggestions}
            onAssign={onCampaignAssign}
            onClearSelection={onClearSelection}
          />
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="min-h-0 flex-1">
        <PreviewTable
          rows={rows}
          validations={validations}
          onRowUpdate={onRowUpdate}
          selectedRows={selectedRows}
          onSelectRow={onSelectRow}
          onSelectAll={onSelectAll}
        />
      </motion.div>
    </motion.div>
  );
}
