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
    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-yellow-500/10">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
            {errors.length > 0 && `, ${errors.length} error${errors.length !== 1 ? "s" : ""}`}
          </span>
          <span className="text-xs text-yellow-600/80 dark:text-yellow-400/80">
            Double click cells to edit
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
      <div className="mt-2 space-y-0.5">
        {displayItems.map((v, idx) => (
          <p key={idx} className="text-xs text-yellow-700 dark:text-yellow-300">
            Row {v.rowIndex + 1}, {v.field}: {v.message}
          </p>
        ))}
      </div>
    </div>
  );
}
