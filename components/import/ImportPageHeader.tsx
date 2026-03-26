"use client";

import { Upload } from "lucide-react";

export function ImportPageHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Upload className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Import Leads</h1>
        <p className="text-sm text-muted-foreground">
          Upload CSV or XLSX files to add leads to your database
        </p>
      </div>
    </div>
  );
}
