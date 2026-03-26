"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, X, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ImportStepUploadProps {
  onFileSelected: (file: File) => void;
  onClear: () => void;
  currentFile: File | null;
  isProcessing: boolean;
  defaultCampaign: string;
  onDefaultCampaignChange: (value: string) => void;
}

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx"];

function isValidFile(file: File): boolean {
  return ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportStepUpload({
  onFileSelected,
  onClear,
  currentFile,
  isProcessing,
  defaultCampaign,
  onDefaultCampaignChange,
}: ImportStepUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && isValidFile(file)) {
        onFileSelected(file);
      }
    },
    [onFileSelected],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelected(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [onFileSelected],
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
      <AnimatePresence mode="wait">
        {currentFile ? (
          <motion.div
            key="file-selected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex w-full max-w-md flex-col items-center gap-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10"
            >
              <FileSpreadsheet className="h-10 w-10 text-primary" />
            </motion.div>

            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{currentFile.name}</p>
              <p className="text-sm text-muted-foreground">{formatFileSize(currentFile.size)}</p>
            </div>

            <Button
              onClick={onClear}
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isProcessing}
            >
              <X className="h-3.5 w-3.5" />
              Remove file
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg"
          >
            <motion.div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed px-8 py-16 transition-colors",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/30",
              )}
            >
              <motion.div
                animate={isDragOver ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "rounded-2xl p-5 transition-colors",
                  isDragOver ? "bg-primary/10" : "bg-muted",
                )}
              >
                <Upload
                  className={cn(
                    "h-8 w-8 transition-colors",
                    isDragOver ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </motion.div>

              <div className="text-center">
                <p className="text-base font-semibold text-foreground">Upload Files</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Drag and drop your files here, or{" "}
                  <span className="font-medium text-primary">click to select</span>.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supported formats: .xlsx, .xls, .csv
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleInputChange}
        className="hidden"
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-sm"
      >
        <label
          htmlFor="default-campaign"
          className="mb-1.5 flex items-center justify-center gap-1.5 text-sm font-medium text-foreground"
        >
          Default Campaign
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                Fallback campaign for leads without an assigned campaign. You can assign
                different campaigns per lead in the next step.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </label>
        <Input
          id="default-campaign"
          placeholder="e.g., US Tech Companies Q1"
          value={defaultCampaign}
          onChange={(e) => onDefaultCampaignChange(e.target.value)}
          className="text-center"
        />
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Applied to leads without a campaign
        </p>
      </motion.div>
    </div>
  );
}
