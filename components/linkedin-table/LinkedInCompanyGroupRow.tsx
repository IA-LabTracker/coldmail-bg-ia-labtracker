"use client";

import { useMemo } from "react";
import { ChevronRight, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { LinkedInMessage, LinkedInCompanyGroup } from "@/types";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { linkedInStatusColors, classificationColors } from "./LinkedInTable";

interface LinkedInCompanyGroupRowProps {
  group: LinkedInCompanyGroup;
  isExpanded: boolean;
  selectedIds: Set<string>;
  onToggleExpand: () => void;
  onSelectGroup: (messageIds: string[]) => void;
  onSelectMessage: (id: string, visibleMessages: LinkedInMessage[], shiftKey: boolean) => void;
  onViewDetails: (message: LinkedInMessage) => void;
  onDelete: (message: LinkedInMessage) => void;
  allMessages: LinkedInMessage[];
}

const classificationPriority: Record<string, number> = {
  hot: 3,
  warm: 2,
  cold: 1,
};

export function LinkedInCompanyGroupRow({
  group,
  isExpanded,
  selectedIds,
  onToggleExpand,
  onSelectGroup,
  onSelectMessage,
  onViewDetails,
  onDelete,
  allMessages,
}: LinkedInCompanyGroupRowProps) {
  const allSelected = group.messages.every((m) => selectedIds.has(m.id));
  const someSelected = !allSelected && group.messages.some((m) => selectedIds.has(m.id));

  const uniqueStatuses = useMemo(() => {
    const statusSet = new Set(group.messages.map((m) => m.status));
    return Array.from(statusSet);
  }, [group.messages]);

  const bestClassification = useMemo(() => {
    return group.messages.reduce((best, msg) => {
      const current = classificationPriority[msg.lead_classification] || 0;
      const bestPriority = classificationPriority[best] || 0;
      return current > bestPriority ? msg.lead_classification : best;
    }, group.messages[0].lead_classification);
  }, [group.messages]);

  const handleGroupCheckbox = () => {
    onSelectGroup(group.messages.map((m) => m.id));
  };

  const getStatusColor = (status: string) =>
    linkedInStatusColors[status] || {
      dot: "bg-slate-400",
      text: "text-slate-600 dark:text-slate-300",
    };

  const getClassColor = (classification: string) =>
    classificationColors[classification] || {
      dot: "bg-slate-400",
      text: "text-slate-600 dark:text-slate-300",
    };

  const formatLabel = (value: string) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  const DotLabel = ({
    label,
    dotClass,
    textClass,
  }: {
    label: string;
    dotClass: string;
    textClass: string;
  }) => (
    <span className={`inline-flex items-center gap-2 text-sm font-medium ${textClass}`}>
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {label}
    </span>
  );

  return (
    <>
      <TableRow
        className="border-b border-border hover:bg-muted cursor-pointer"
        onClick={onToggleExpand}
      >
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={allSelected}
            {...(someSelected ? { "data-state": "indeterminate" } : {})}
            onClick={handleGroupCheckbox}
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="font-medium text-foreground">{group.company}</span>
            <span className="text-xs text-muted-foreground">{group.messages.length} leads</span>
          </div>
        </TableCell>
        <TableCell className="text-foreground">{group.company}</TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {uniqueStatuses.map((status) => (
              <DotLabel
                key={status}
                label={formatLabel(status)}
                dotClass={getStatusColor(status).dot}
                textClass={getStatusColor(status).text}
              />
            ))}
          </div>
        </TableCell>
        <TableCell>
          <DotLabel
            label={formatLabel(bestClassification)}
            dotClass={getClassColor(bestClassification).dot}
            textClass={getClassColor(bestClassification).text}
          />
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">-</TableCell>
        <TableCell />
      </TableRow>

      {isExpanded &&
        group.messages.map((msg) => {
          const fullName = `${msg.first_name} ${msg.last_name}`.trim();
          return (
            <TableRow key={msg.id} className="border-b border-border bg-muted/50 hover:bg-muted">
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(msg.id)}
                  onClick={(e: React.MouseEvent) =>
                    onSelectMessage(msg.id, allMessages, e.shiftKey)
                  }
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 pl-6">
                  <div className="h-4 w-px bg-border" />
                  <button
                    type="button"
                    onClick={() => onViewDetails(msg)}
                    className="text-sm text-foreground hover:text-primary hover:underline cursor-pointer"
                  >
                    {fullName || "Unknown"}
                  </button>
                </div>
              </TableCell>
              <TableCell className="text-foreground text-sm">
                {msg.current_position || "-"}
              </TableCell>
              <TableCell>
                <DotLabel
                  label={formatLabel(msg.status)}
                  dotClass={getStatusColor(msg.status).dot}
                  textClass={getStatusColor(msg.status).text}
                />
              </TableCell>
              <TableCell>
                <DotLabel
                  label={formatLabel(msg.lead_classification)}
                  dotClass={getClassColor(msg.lead_classification).dot}
                  textClass={getClassColor(msg.lead_classification).text}
                />
              </TableCell>
              <TableCell className="text-sm text-foreground">
                {msg.created_at ? new Date(msg.created_at).toLocaleDateString("en-US") : "-"}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(msg)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(msg)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
    </>
  );
}
