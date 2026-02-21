"use client";

import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ImportRow, ImportValidation, ImportStatus } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { FileDropzone } from "@/components/import/FileDropzone";
import { ImportStats } from "@/components/import/ImportStats";
import { PreviewTable } from "@/components/import/PreviewTable";
import { ValidationWarnings } from "@/components/import/ValidationWarnings";
import { ImportActions } from "@/components/import/ImportActions";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { parseImportFile } from "@/lib/importParser";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone } from "lucide-react";

const BATCH_SIZE = 100;

export default function ImportPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [validations, setValidations] = useState<ImportValidation[]>([]);
  const [totalRawRows, setTotalRawRows] = useState(0);
  const [filteredOutRows, setFilteredOutRows] = useState(0);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState("");
  const [campaignName, setCampaignName] = useState("");

  const warningCount = useMemo(
    () => validations.filter((v) => v.severity === "warning").length,
    [validations],
  );

  const handleFileSelected = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus("parsing");
    setError("");

    try {
      const result = await parseImportFile(selectedFile);
      setRows(result.rows);
      setValidations(result.validations);
      setTotalRawRows(result.totalRawRows);
      setFilteredOutRows(result.filteredOutRows);
      setStatus("preview");

      if (result.rows.length === 0) {
        setError(
          "No valid rows found after filtering. Check that 'Company Name' column is filled.",
        );
        setStatus("idle");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
      setStatus("idle");
    }
  }, []);

  const handleClear = useCallback(() => {
    setFile(null);
    setRows([]);
    setValidations([]);
    setTotalRawRows(0);
    setFilteredOutRows(0);
    setStatus("idle");
    setImportedCount(0);
    setError("");
  }, []);

  const handleRowUpdate = useCallback((rowIndex: number, field: keyof ImportRow, value: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [field]: value };
      return updated;
    });

    setValidations((prev) => prev.filter((v) => !(v.rowIndex === rowIndex && v.field === field)));
  }, []);

  const handleImport = useCallback(async () => {
    if (!user) return;

    const hasAnyCampaign = rows.some((row) => row.campaign_name?.trim());
    if (!campaignName.trim() && !hasAnyCampaign) {
      toast.error("Campaign name is required. Fill in the field above or include it in your CSV.");
      return;
    }

    setStatus("importing");
    setImportedCount(0);
    setError("");

    let totalInserted = 0;

    try {
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE).map((row) => ({
          user_id: user.id,
          company: row.company,
          email: row.email,
          region: row.region,
          industry: row.industry,
          keywords: row.keywords,
          status: row.status,
          response_content: "",
          lead_classification: "cold" as const,
          campaign_name: row.campaign_name?.trim() || campaignName.trim(),
          notes: "",
          lead_name: row.lead_name || null,
          phone: row.phone || null,
          city: row.city || null,
          state: row.state || null,
          address: row.address || null,
          google_maps_url: row.google_maps_url || null,
          lead_category: row.lead_category || null,
        }));

        const { error: insertError } = await supabase.from("emails").insert(batch);

        if (insertError) throw insertError;

        totalInserted += batch.length;
        setImportedCount(totalInserted);
      }

      setStatus("success");
      toast.success(`Successfully imported ${totalInserted} leads`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import data");
      setStatus("error");
    }
  }, [user, rows, campaignName]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Import Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a CSV or XLSX file para importar leads para sua base
          </p>
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="rounded-lg border border-border bg-card p-4">
          <Label htmlFor="campaign-name" className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Megaphone className="h-4 w-4 text-indigo-500" />
            Campaign Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="campaign-name"
            placeholder="e.g., US Tech Companies Q1 2026"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            All imported leads will be assigned to this campaign (unless the CSV already has a campaign_name column)
          </p>
        </div>

        <FileDropzone
          onFileSelected={handleFileSelected}
          onClear={handleClear}
          currentFile={file}
          isProcessing={status === "parsing"}
        />

        {status === "parsing" && (
          <div className="flex items-center justify-center gap-3 py-8">
            <LoadingSpinner />
            <p className="text-sm text-muted-foreground">Processando arquivo...</p>
          </div>
        )}

        {(status === "preview" ||
          status === "importing" ||
          status === "success" ||
          status === "error") && (
          <>
            <ImportStats
              totalRawRows={totalRawRows}
              filteredOutRows={filteredOutRows}
              validRows={rows.length}
              warningCount={warningCount}
            />

            {validations.length > 0 && <ValidationWarnings validations={validations} />}

            <PreviewTable rows={rows} validations={validations} onRowUpdate={handleRowUpdate} />

            <ImportActions
              status={status}
              totalRows={rows.length}
              importedRows={importedCount}
              onImport={handleImport}
              onReset={handleClear}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
