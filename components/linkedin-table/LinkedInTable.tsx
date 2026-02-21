"use client";

import { Pencil, Trash2 } from "lucide-react";
import { LinkedInMessage, LinkedInCompanyGroup } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { LinkedInCompanyGroupRow } from "./LinkedInCompanyGroupRow";

export const linkedInStatusColors: Record<string, { dot: string; text: string }> = {
  pending: { dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-300" },
  sent: { dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-400" },
  delivered: { dot: "bg-indigo-500", text: "text-indigo-700 dark:text-indigo-400" },
  read: { dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-400" },
  replied: { dot: "bg-green-500", text: "text-green-700 dark:text-green-400" },
  failed: { dot: "bg-red-500", text: "text-red-700 dark:text-red-400" },
};

export const classificationColors: Record<string, { dot: string; text: string }> = {
  hot: { dot: "bg-red-500", text: "text-red-700 dark:text-red-400" },
  warm: { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" },
  cold: { dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-400" },
};

interface LinkedInTableProps {
  groups: LinkedInCompanyGroup[];
  selectedIds: Set<string>;
  expandedCompanies: Set<string>;
  onSelectMessage: (id: string, visibleMessages: LinkedInMessage[], shiftKey: boolean) => void;
  onSelectGroup: (messageIds: string[]) => void;
  onSelectAll: () => void;
  onToggleCompany: (companyKey: string) => void;
  onViewDetails: (message: LinkedInMessage) => void;
  onDelete: (message: LinkedInMessage) => void;
  isAllSelected: boolean;
}

export function LinkedInTable({
  groups,
  selectedIds,
  expandedCompanies,
  onSelectMessage,
  onSelectGroup,
  onSelectAll,
  onToggleCompany,
  onViewDetails,
  onDelete,
  isAllSelected,
}: LinkedInTableProps) {
  const allMessages = groups.flatMap((g) => g.messages);

  const formatLabel = (value: string) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  const getStatusColor = (status: string) =>
    linkedInStatusColors[status] || {
      dot: "bg-slate-400",
      text: "text-slate-600 dark:text-slate-300",
    };
  const getClassificationColor = (classification: string) =>
    classificationColors[classification] || {
      dot: "bg-slate-400",
      text: "text-slate-600 dark:text-slate-300",
    };

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
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted">
            <TableHead className="w-12">
              <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Classification</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => {
            if (group.messages.length === 1) {
              const msg = group.messages[0];
              const fullName = `${msg.first_name} ${msg.last_name}`.trim();
              return (
                <TableRow key={msg.id} className="border-b border-border hover:bg-muted">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(msg.id)}
                      onClick={(e: React.MouseEvent) =>
                        onSelectMessage(msg.id, allMessages, e.shiftKey)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => onViewDetails(msg)}
                      className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer"
                    >
                      {fullName || "Unknown"}
                    </button>
                    {msg.current_position && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {msg.current_position}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground">{msg.current_company || "-"}</TableCell>
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
                      dotClass={getClassificationColor(msg.lead_classification).dot}
                      textClass={getClassificationColor(msg.lead_classification).text}
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
            }

            return (
              <LinkedInCompanyGroupRow
                key={group.companyKey}
                group={group}
                isExpanded={expandedCompanies.has(group.companyKey)}
                selectedIds={selectedIds}
                onToggleExpand={() => onToggleCompany(group.companyKey)}
                onSelectGroup={onSelectGroup}
                onSelectMessage={onSelectMessage}
                onViewDetails={onViewDetails}
                onDelete={onDelete}
                allMessages={allMessages}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
