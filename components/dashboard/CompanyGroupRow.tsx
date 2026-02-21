"use client";

import { useMemo } from "react";
import { ChevronRight, ChevronDown, Mail, Phone, Pencil, Trash2 } from "lucide-react";
import { Email, CompanyGroup } from "@/types";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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
    statusColors[status] || { dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-300" };

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
            <span className="text-xs text-muted-foreground">{group.emails.length} emails</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-0.5">
            {group.emails[0].phone && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {group.emails[0].phone}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-foreground">
              <Mail className="h-3 w-3 text-muted-foreground" />
              {group.emails[0].email}
            </span>
            {group.emails.length > 1 && (
              <span className="text-xs text-muted-foreground ml-[18px]">
                +{group.emails.length - 1} more
              </span>
            )}
          </div>
        </TableCell>
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
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-foreground">{campaignLabel}</TableCell>
        <TableCell className="text-sm text-muted-foreground">-</TableCell>
        <TableCell />
      </TableRow>

      {isExpanded &&
        group.emails.map((email) => (
          <TableRow key={email.id} className="border-b border-border bg-muted/50 hover:bg-muted">
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selectedIds.has(email.id)}
                onClick={(e: React.MouseEvent) => onSelectEmail(email.id, allEmails, e.shiftKey)}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2 pl-6">
                <div className="h-4 w-px bg-border" />
                <button
                  type="button"
                  onClick={() => onViewDetails(email)}
                  className="text-sm text-foreground hover:text-primary hover:underline cursor-pointer"
                >
                  {email.lead_name || email.company}
                </button>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                {email.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {email.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-foreground text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  {email.email}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <DotLabel
                label={formatLabel(email.status)}
                dotClass={getStatusColor(email.status).dot}
                textClass={getStatusColor(email.status).text}
              />
            </TableCell>
            <TableCell>
              <DotLabel
                label={formatLabel(email.lead_classification)}
                dotClass={getClassColor(email.lead_classification).dot}
                textClass={getClassColor(email.lead_classification).text}
              />
            </TableCell>
            <TableCell>
              <DotLabel
                label={email.client_step ? formatLabel(email.client_step) : "-"}
                dotClass={getClientStatusColor(email.client_step || "").dot}
                textClass={getClientStatusColor(email.client_step || "").text}
              />
            </TableCell>
            <TableCell className="text-foreground text-sm">{email.campaign_name || "-"}</TableCell>
            <TableCell className="text-sm text-foreground">
              {email.created_at ? new Date(email.created_at).toLocaleDateString("en-US") : "-"}
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
