"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ImportRow, ImportValidation, ImportStatus } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { ImportPageHeader } from "@/components/import/ImportPageHeader";
import { ImportStepper } from "@/components/import/ImportStepper";
import { ImportStepUpload } from "@/components/import/ImportStepUpload";
import { ImportStepReview } from "@/components/import/ImportStepReview";
import { ImportStepConfirm } from "@/components/import/ImportStepConfirm";
import { ImportNavigation } from "@/components/import/ImportNavigation";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { parseImportFile } from "@/lib/importParser";
import { toast } from "sonner";

const BATCH_SIZE = 100;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export default function ImportPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
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
    setStep(0);
    setDirection(-1);
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
        `${rowsWithoutCampaign} lead${rowsWithoutCampaign > 1 ? "s" : ""} without campaign. Assign campaigns or set a default campaign.`,
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

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 2));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const canGoNext =
    (step === 0 && rows.length > 0 && status === "preview") ||
    (step === 1 && rows.length > 0);

  return (
    <AppLayout>
      <div className="flex h-full flex-col">
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <ImportPageHeader />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-6"
          >
            <ImportStepper currentStep={step} />
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <ErrorMessage message={error} />
            </motion.div>
          )}
        </div>

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
          {status === "parsing" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-1 items-center justify-center gap-3"
            >
              <LoadingSpinner />
              <p className="text-sm text-muted-foreground">Processing file...</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex w-full flex-1 flex-col"
              >
                {step === 0 && (
                  <ImportStepUpload
                    onFileSelected={handleFileSelected}
                    onClear={handleClear}
                    currentFile={file}
                    isProcessing={status === ("parsing" as ImportStatus)}
                    defaultCampaign={defaultCampaign}
                    onDefaultCampaignChange={setDefaultCampaign}
                  />
                )}

                {step === 1 && (
                  <ImportStepReview
                    rows={rows}
                    validations={validations}
                    totalRawRows={totalRawRows}
                    filteredOutRows={filteredOutRows}
                    warningCount={warningCount}
                    rowsWithoutCampaign={rowsWithoutCampaign}
                    defaultCampaign={defaultCampaign}
                    selectedRows={selectedRows}
                    campaignSuggestions={campaignSuggestions}
                    onRowUpdate={handleRowUpdate}
                    onSelectRow={handleSelectRow}
                    onSelectAll={handleSelectAll}
                    onCampaignAssign={handleCampaignAssign}
                    onClearSelection={handleClearSelection}
                  />
                )}

                {step === 2 && (
                  <ImportStepConfirm
                    status={status}
                    totalRows={rows.length}
                    importedRows={importedCount}
                    warningCount={warningCount}
                    defaultCampaign={defaultCampaign}
                    rowsWithoutCampaign={rowsWithoutCampaign}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <div className="mx-auto w-full max-w-7xl">
          <ImportNavigation
            currentStep={step}
            totalRows={rows.length}
            status={status}
            canGoNext={canGoNext}
            onBack={goBack}
            onNext={goNext}
            onImport={handleImport}
            onReset={handleClear}
          />
        </div>
      </div>
    </AppLayout>
  );
}
