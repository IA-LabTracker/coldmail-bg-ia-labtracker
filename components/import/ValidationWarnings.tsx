"use client";

import { useState, useCallback } from "react";
import { ImportValidation } from "@/types";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ValidationWarningsProps {
  validations: ImportValidation[];
}

export function ValidationWarnings({ validations }: ValidationWarningsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  if (validations.length === 0) return null;

  const warnings = validations.filter((v) => v.severity === "warning");
  const errors = validations.filter((v) => v.severity === "error");
  const displayItems = isExpanded ? validations : validations.slice(0, 3);

  return (
    <div className="rounded-md border border-yellow-300/60 bg-yellow-50/80 p-3 dark:border-yellow-700/60 dark:bg-yellow-950/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
            {errors.length > 0 && `, ${errors.length} error${errors.length !== 1 ? "s" : ""}`}
          </span>
          <span className="text-xs text-yellow-600 dark:text-yellow-400">
            (double click on highlighted cells to edit)
          </span>
        </div>
        {validations.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="h-7 gap-1 text-xs text-yellow-700 hover:text-yellow-900 dark:text-yellow-300 dark:hover:text-yellow-100"
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Show all ({validations.length}) <ChevronDown className="h-3 w-3" />
              </>
            )}
          </Button>
        )}
      </div>
      <div className="mt-1.5 space-y-0.5">
        {displayItems.map((v, idx) => (
          <p key={idx} className="text-xs text-yellow-700 dark:text-yellow-300">
            Row {v.rowIndex + 1}, {v.field}: {v.message}
          </p>
        ))}
      </div>
    </div>
  );
}
