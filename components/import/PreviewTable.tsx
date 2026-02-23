"use client";

import { useMemo, useCallback } from "react";
import { ImportRow, ImportValidation } from "@/types";
import { EditableCell } from "@/components/import/EditableCell";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PreviewTableProps {
  rows: ImportRow[];
  validations: ImportValidation[];
  onRowUpdate: (rowIndex: number, field: keyof ImportRow, value: string) => void;
  selectedRows: Set<number>;
  onSelectRow: (rowIndex: number) => void;
  onSelectAll: () => void;
}

const COLUMNS: { key: keyof ImportRow; label: string; editable: boolean }[] = [
  { key: "company", label: "Company", editable: true },
  { key: "email", label: "Email", editable: true },
  { key: "lead_name", label: "Lead Name", editable: true },
  { key: "phone", label: "Phone", editable: true },
  { key: "campaign_name", label: "Campaign", editable: true },
  { key: "industry", label: "Industry", editable: true },
  { key: "city", label: "City", editable: true },
  { key: "state", label: "State", editable: true },
  { key: "address", label: "Address", editable: true },
  { key: "keywords", label: "Keywords", editable: false },
];

export function PreviewTable({
  rows,
  validations,
  onRowUpdate,
  selectedRows,
  onSelectRow,
  onSelectAll,
}: PreviewTableProps) {
  const validationMap = useMemo(() => {
    const map = new Map<string, ImportValidation>();
    validations.forEach((v) => {
      map.set(`${v.rowIndex}-${v.field}`, v);
    });
    return map;
  }, [validations]);

  const getCellWarning = useCallback(
    (rowIndex: number, field: string) => validationMap.get(`${rowIndex}-${field}`),
    [validationMap],
  );

  const allSelected = rows.length > 0 && selectedRows.size === rows.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < rows.length;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Preview ({rows.length} rows)</h3>
        <p className="text-xs text-muted-foreground">Double click a cell to edit</p>
      </div>
      <div className="max-h-[680px] overflow-auto">
          <Table className="min-w-[1200px]">
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) {
                        (el as unknown as HTMLButtonElement).dataset.indeterminate = someSelected
                          ? "true"
                          : "false";
                      }
                    }}
                    onCheckedChange={onSelectAll}
                    aria-label="Select all rows"
                  />
                </TableHead>
                <TableHead className="w-10 text-xs">#</TableHead>
                {COLUMNS.map((col) => (
                  <TableHead key={col.key} className="text-xs whitespace-nowrap">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => {
                const isSelected = selectedRows.has(rowIndex);
                return (
                  <TableRow key={rowIndex} className={isSelected ? "bg-accent/40" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onSelectRow(rowIndex)}
                        aria-label={`Select row ${rowIndex + 1}`}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{rowIndex + 1}</TableCell>
                    {COLUMNS.map((col) => {
                      const warning = getCellWarning(rowIndex, col.key);

                      if (col.key === "keywords") {
                        return (
                          <TableCell key={col.key}>
                            <div className="flex flex-wrap gap-2">
                              {row.keywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                        );
                      }

                      if (col.editable) {
                        return (
                          <TableCell key={col.key}>
                            <EditableCell
                              value={String(row[col.key] ?? "")}
                              onChange={(newValue) => onRowUpdate(rowIndex, col.key, newValue)}
                              hasWarning={!!warning}
                            />
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell key={col.key} className="text-xs">
                          {String(row[col.key] ?? "")}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
      </div>
    </div>
  );
}
