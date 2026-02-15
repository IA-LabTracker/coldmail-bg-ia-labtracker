"use client";

import { useMemo } from "react";
import { ChevronRight, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { LinkedInMessage, LinkedInCompanyGroup } from "@/types";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    linkedInStatusColors[status] || { bg: "bg-gray-100", text: "text-gray-800" };

  const getClassColor = (classification: string) =>
    classificationColors[classification] || { bg: "bg-gray-100", text: "text-gray-800" };

  return (
    <>
      <TableRow
        className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
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
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
            )}
            <span className="font-medium text-gray-900">{group.company}</span>
            <Badge className="bg-teal-100 text-teal-800 text-xs">
              {group.messages.length} leads
            </Badge>
          </div>
        </TableCell>
        <TableCell className="text-gray-700">{group.company}</TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {uniqueStatuses.map((status) => (
              <Badge key={status} className={getStatusColor(status).bg}>
                <span className={getStatusColor(status).text}>{status}</span>
              </Badge>
            ))}
          </div>
        </TableCell>
        <TableCell>
          <Badge className={getClassColor(bestClassification).bg}>
            <span className={getClassColor(bestClassification).text}>{bestClassification}</span>
          </Badge>
        </TableCell>
        <TableCell />
      </TableRow>

      {isExpanded &&
        group.messages.map((msg) => {
          const fullName = `${msg.first_name} ${msg.last_name}`.trim();
          return (
            <TableRow
              key={msg.id}
              className="border-b border-gray-100 bg-gray-50/50 hover:bg-gray-100/50"
            >
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
                  <div className="h-4 w-px bg-gray-300" />
                  <button
                    type="button"
                    onClick={() => onViewDetails(msg)}
                    className="text-sm text-gray-600 hover:text-primary hover:underline cursor-pointer"
                  >
                    {fullName || "Unknown"}
                  </button>
                </div>
              </TableCell>
              <TableCell className="text-gray-700 text-sm">{msg.current_position || "-"}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(msg.status).bg}>
                  <span className={getStatusColor(msg.status).text}>{msg.status}</span>
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getClassColor(msg.lead_classification).bg}>
                  <span className={getClassColor(msg.lead_classification).text}>
                    {msg.lead_classification}
                  </span>
                </Badge>
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
