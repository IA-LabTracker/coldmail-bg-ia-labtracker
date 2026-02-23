"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, CheckCircle, RotateCcw } from "lucide-react";
import { ImportStatus } from "@/types";

interface ImportActionsProps {
  status: ImportStatus;
  totalRows: number;
  importedRows: number;
  onImport: () => void;
  onReset: () => void;
}

export function ImportActions({
  status,
  totalRows,
  importedRows,
  onImport,
  onReset,
}: ImportActionsProps) {
  const progress = totalRows > 0 ? Math.round((importedRows / totalRows) * 100) : 0;

  if (status === "success") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span className="font-medium">{importedRows} leads imported</span>
        </div>
        <Button onClick={onReset} variant="outline" size="sm" className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Import Another
        </Button>
      </div>
    );
  }

  if (status === "importing") {
    return (
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <div className="w-32">
          <Progress value={progress} className="h-1.5" />
        </div>
        <span className="text-xs text-muted-foreground">
          {importedRows}/{totalRows} ({progress}%)
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={onImport} className="gap-1.5" size="sm">
        <Upload className="h-3.5 w-3.5" />
        Import {totalRows} Rows
      </Button>
      <Button onClick={onReset} variant="outline" size="sm">
        Cancel
      </Button>
    </div>
  );
}
