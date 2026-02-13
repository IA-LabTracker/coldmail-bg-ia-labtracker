"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">
                Successfully imported {importedRows} leads
              </p>
              <p className="text-xs text-green-600">Data is now available in your dashboard</p>
            </div>
          </div>
          <Button onClick={onReset} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Import Another
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "importing") {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-gray-700">
              Importing... {importedRows} of {totalRows} rows
            </p>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500">{progress}% complete</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={onImport} className="gap-2" size="lg">
        <Upload className="h-4 w-4" />
        Import {totalRows} Rows
      </Button>
      <Button onClick={onReset} variant="outline" size="lg">
        Cancel
      </Button>
    </div>
  );
}
