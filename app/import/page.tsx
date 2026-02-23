"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ImportRow, ImportValidation, ImportStatus } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { FileDropzone } from "@/components/import/FileDropzone";
import { ImportStats } from "@/components/import/ImportStats";
import { PreviewTable } from "@/components/import/PreviewTable";
import { ValidationWarnings } from "@/components/import/ValidationWarnings";
import { ImportActions } from "@/components/import/ImportActions";
import { CampaignAssignBar } from "@/components/import/CampaignAssignBar";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { parseImportFile } from "@/lib/importParser";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Info } from "lucide-react";

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
  const [defaultCampaign, setDefaultCampaign] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [dbCampaigns, setDbCampaigns] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchCampaigns = async () => {
      const { data } = await supabase
        .from("emails")
        .select("campaign_name")
        .eq("user_id", user.id)
        .neq("campaign_name", "")
        .not("campaign_name", "is", null);
      if (data) {
        const unique = Array.from(new Set(data.map((d) => d.campaign_name).filter(Boolean)));
        unique.sort((a, b) => a.localeCompare(b));
        setDbCampaigns(unique);
      }
    };
    fetchCampaigns();
  }, [user]);

  const campaignSuggestions = useMemo(() => {
    const csvCampaigns = Array.from(
      new Set(rows.map((r) => r.campaign_name?.trim()).filter(Boolean)),
    );
    const all = new Set(dbCampaigns.concat(csvCampaigns));
    return Array.from(all).sort((a, b) => a.localeCompare(b));
  }, [dbCampaigns, rows]);

  const warningCount = useMemo(
    () => validations.filter((v) => v.severity === "warning").length,
    [validations],
  );

  const rowsWithoutCampaign = useMemo(
    () => rows.filter((r) => !r.campaign_name?.trim()).length,
    [rows],
  );

  const handleFileSelected = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus("parsing");
    setError("");
    setSelectedRows(new Set());

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
    setSelectedRows(new Set());
  }, []);

  const handleRowUpdate = useCallback((rowIndex: number, field: keyof ImportRow, value: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [field]: value };
      return updated;
    });
    setValidations((prev) => prev.filter((v) => !(v.rowIndex === rowIndex && v.field === field)));
  }, []);

  const handleSelectRow = useCallback((rowIndex: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedRows((prev) => {
      if (prev.size === rows.length) {
        return new Set();
      }
      const all = new Set<number>();
      rows.forEach((_, i) => all.add(i));
      return all;
    });
  }, [rows]);

  const handleCampaignAssign = useCallback(
    (campaignName: string) => {
      if (selectedRows.size === 0) return;
      setRows((prev) => {
        const updated = [...prev];
        selectedRows.forEach((rowIndex) => {
          updated[rowIndex] = { ...updated[rowIndex], campaign_name: campaignName };
        });
        return updated;
      });
      toast.success(`Campaign "${campaignName}" assigned to ${selectedRows.size} leads`);
      setSelectedRows(new Set());
    },
    [selectedRows],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  const handleImport = useCallback(async () => {
    if (!user) return;

    if (rowsWithoutCampaign > 0 && !defaultCampaign.trim()) {
      toast.error(
        `${rowsWithoutCampaign} lead${rowsWithoutCampaign > 1 ? "s" : ""} without campaign. Assign campaigns in the table or set a default campaign.`,
      );
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
          campaign_name: row.campaign_name?.trim() || defaultCampaign.trim(),
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
  }, [user, rows, defaultCampaign, rowsWithoutCampaign]);

  const showPreview =
    status === "preview" || status === "importing" || status === "success" || status === "error";

  return (
    <AppLayout>
      <div className="space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Import Leads</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Upload CSV or XLSX to import leads into your database
            </p>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Upload + Campaign config - side by side */}
        <div className="grid gap-4 lg:grid-cols-2">
          <FileDropzone
            onFileSelected={handleFileSelected}
            onClear={handleClear}
            currentFile={file}
            isProcessing={status === "parsing"}
          />

          <div className="flex flex-col justify-center rounded-lg border border-border bg-card p-4">
            <Label
              htmlFor="default-campaign"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Default Campaign
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs text-xs">
                    Fallback campaign for leads without an assigned campaign. You can assign
                    different campaigns per lead in the preview table.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="default-campaign"
              placeholder="e.g., US Tech Companies Q1 2026"
              value={defaultCampaign}
              onChange={(e) => setDefaultCampaign(e.target.value)}
            />
          </div>
        </div>

        {status === "parsing" && (
          <div className="flex items-center justify-center gap-3 py-8">
            <LoadingSpinner />
            <p className="text-sm text-muted-foreground">Processing file...</p>
          </div>
        )}

        {showPreview && (
          <>
            {/* Stats + Actions bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <ImportStats
                totalRawRows={totalRawRows}
                filteredOutRows={filteredOutRows}
                validRows={rows.length}
                warningCount={warningCount}
              />
              <div className="shrink-0">
                <ImportActions
                  status={status}
                  totalRows={rows.length}
                  importedRows={importedCount}
                  onImport={handleImport}
                  onReset={handleClear}
                />
              </div>
            </div>

            {validations.length > 0 && <ValidationWarnings validations={validations} />}

            {rowsWithoutCampaign > 0 && !defaultCampaign.trim() && (
              <p className="flex items-center gap-1.5 text-sm text-orange-500 dark:text-orange-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {rowsWithoutCampaign} lead{rowsWithoutCampaign > 1 ? "s" : ""} without campaign
                select rows to assign, or set a default campaign above.
              </p>
            )}

            {selectedRows.size > 0 && (
              <CampaignAssignBar
                selectedCount={selectedRows.size}
                totalCount={rows.length}
                campaignSuggestions={campaignSuggestions}
                onAssign={handleCampaignAssign}
                onClearSelection={handleClearSelection}
              />
            )}

            <PreviewTable
              rows={rows}
              validations={validations}
              onRowUpdate={handleRowUpdate}
              selectedRows={selectedRows}
              onSelectRow={handleSelectRow}
              onSelectAll={handleSelectAll}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
