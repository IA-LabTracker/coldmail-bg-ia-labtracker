"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { ImportStatus } from "@/types";

interface ImportNavigationProps {
  currentStep: number;
  totalRows: number;
  status: ImportStatus;
  canGoNext: boolean;
  onBack: () => void;
  onNext: () => void;
  onImport: () => void;
  onReset: () => void;
}

export function ImportNavigation({
  currentStep,
  totalRows,
  status,
  canGoNext,
  onBack,
  onNext,
  onImport,
  onReset,
}: ImportNavigationProps) {
  const isImporting = status === "importing";
  const isSuccess = status === "success";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between border-t border-border px-6 py-4"
    >
      <div>
        {currentStep > 0 && !isSuccess && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isImporting}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      <div>
        {isSuccess ? (
          <Button onClick={onReset} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            Import Another
          </Button>
        ) : currentStep === 2 ? (
          <Button
            onClick={onImport}
            disabled={isImporting}
            className="gap-1.5"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import {totalRows} Leads
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canGoNext}
            className="gap-1.5"
          >
            Next Step
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
