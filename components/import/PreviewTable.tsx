"use client";

import { useMemo, useCallback } from "react";
import { ImportRow, ImportValidation } from "@/types";
import { EditableCell } from "@/components/import/EditableCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PreviewTableProps {
  rows: ImportRow[];
  validations: ImportValidation[];
  onRowUpdate: (rowIndex: number, field: keyof ImportRow, value: string) => void;
}

const COLUMNS: { key: keyof ImportRow; label: string; editable: boolean }[] = [
  { key: "company", label: "Company", editable: true },
  { key: "email", label: "Email", editable: true },
  { key: "lead_name", label: "Lead Name", editable: true },
  { key: "phone", label: "Phone", editable: true },
  { key: "industry", label: "Industry", editable: true },
  { key: "city", label: "City", editable: true },
  { key: "state", label: "State", editable: true },
  { key: "address", label: "Address", editable: true },
  { key: "keywords", label: "Keywords", editable: false },
];

export function PreviewTable({ rows, validations, onRowUpdate }: PreviewTableProps) {
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

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Preview ({rows.length} rows)</h3>
        <p className="text-xs text-gray-500">Double click a cell to edit</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-xs">#</TableHead>
              {COLUMNS.map((col) => (
                <TableHead key={col.key} className="text-xs">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell className="text-xs text-gray-400">{rowIndex + 1}</TableCell>
                {COLUMNS.map((col) => {
                  const warning = getCellWarning(rowIndex, col.key);

                  if (col.key === "keywords") {
                    return (
                      <TableCell key={col.key}>
                        <div className="flex gap-1">
                          {row.keywords.map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                              {kw}
                            </Badge>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
