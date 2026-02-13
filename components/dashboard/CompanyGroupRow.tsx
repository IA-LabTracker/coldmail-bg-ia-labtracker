"use client";

import { useMemo } from "react";
import { ChevronRight, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Email, CompanyGroup } from "@/types";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  statusColors,
  classificationColors,
  getClientStatusColor,
} from "@/components/dashboard/EmailTable";

interface CompanyGroupRowProps {
  group: CompanyGroup;
  isExpanded: boolean;
  selectedIds: Set<string>;
  onToggleExpand: () => void;
  onSelectGroup: (emailIds: string[]) => void;
  onSelectEmail: (id: string, visibleEmails: Email[], shiftKey: boolean) => void;
  onViewDetails: (email: Email) => void;
  onDelete: (email: Email) => void;
  allEmails: Email[];
}

const classificationPriority: Record<string, number> = {
  hot: 3,
  warm: 2,
  cold: 1,
};

export function CompanyGroupRow({
  group,
  isExpanded,
  selectedIds,
  onToggleExpand,
  onSelectGroup,
  onSelectEmail,
  onViewDetails,
  onDelete,
  allEmails,
}: CompanyGroupRowProps) {
  const allSelected = group.emails.every((e) => selectedIds.has(e.id));
  const someSelected = !allSelected && group.emails.some((e) => selectedIds.has(e.id));

  const uniqueStatuses = useMemo(() => {
    const statusSet = new Set(group.emails.map((e) => e.status));
    return Array.from(statusSet);
  }, [group.emails]);

  const bestClassification = useMemo(() => {
    return group.emails.reduce((best, email) => {
      const current = classificationPriority[email.lead_classification] || 0;
      const bestPriority = classificationPriority[best] || 0;
      return current > bestPriority ? email.lead_classification : best;
    }, group.emails[0].lead_classification);
  }, [group.emails]);

  const campaignLabel = useMemo(() => {
    const campaigns = new Set(group.emails.map((e) => e.campaign_name).filter(Boolean));
    if (campaigns.size === 0) return "-";
    if (campaigns.size === 1) return Array.from(campaigns)[0];
    return "Multiple";
  }, [group.emails]);

  const handleGroupCheckbox = () => {
    onSelectGroup(group.emails.map((em) => em.id));
  };

  const getStatusColor = (status: string) =>
    statusColors[status] || { bg: "bg-gray-100", text: "text-gray-800" };

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
              {group.emails.length} emails
            </Badge>
          </div>
        </TableCell>
        <TableCell className="text-gray-700">
          <span>{group.emails[0].email}</span>
          {group.emails.length > 1 && (
            <span className="ml-1 text-xs text-gray-400">
              +{group.emails.length - 1} more
            </span>
          )}
        </TableCell>
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
            <span className={getClassColor(bestClassification).text}>
              {bestClassification}
            </span>
          </Badge>
        </TableCell>
        <TableCell className="text-gray-400">-</TableCell>
        <TableCell className="text-gray-700">{campaignLabel}</TableCell>
        <TableCell />
      </TableRow>

      {isExpanded &&
        group.emails.map((email) => (
          <TableRow
            key={email.id}
            className="border-b border-gray-100 bg-gray-50/50 hover:bg-gray-100/50"
          >
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selectedIds.has(email.id)}
                onClick={(e: React.MouseEvent) =>
                  onSelectEmail(email.id, allEmails, e.shiftKey)
                }
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2 pl-6">
                <div className="h-4 w-px bg-gray-300" />
                <button
                  type="button"
                  onClick={() => onViewDetails(email)}
                  className="text-sm text-gray-600 hover:text-primary hover:underline cursor-pointer"
                >
                  {email.lead_name || email.company}
                </button>
              </div>
            </TableCell>
            <TableCell className="text-gray-700 text-sm">{email.email}</TableCell>
            <TableCell>
              <Badge className={getStatusColor(email.status).bg}>
                <span className={getStatusColor(email.status).text}>{email.status}</span>
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={getClassColor(email.lead_classification).bg}>
                <span className={getClassColor(email.lead_classification).text}>
                  {email.lead_classification}
                </span>
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={getClientStatusColor(email.client_step || "").bg}>
                <span className={getClientStatusColor(email.client_step || "").text}>
                  {email.client_step || "-"}
                </span>
              </Badge>
            </TableCell>
            <TableCell className="text-gray-700 text-sm">
              {email.campaign_name || "-"}
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => onViewDetails(email)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(email)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}
