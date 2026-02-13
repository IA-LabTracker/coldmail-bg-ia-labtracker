"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  onClear: () => void;
  currentFile: File | null;
  isProcessing: boolean;
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

export function FileDropzone({
  onFileSelected,
  onClear,
  currentFile,
  isProcessing,
}: FileDropzoneProps) {
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
      if (file) {
        onFileSelected(file);
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onFileSelected],
  );

  const handleBrowseClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  if (currentFile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{currentFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(currentFile.size)}</p>
            </div>
          </div>
          <Button
            onClick={onClear}
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
            Remove
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors",
            isDragOver
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100",
          )}
        >
          <div className={cn("rounded-full p-3", isDragOver ? "bg-blue-100" : "bg-gray-200")}>
            <Upload className={cn("h-6 w-6", isDragOver ? "text-blue-600" : "text-gray-500")} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              Drag and drop your file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-500">Supports CSV and XLSX files</p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
