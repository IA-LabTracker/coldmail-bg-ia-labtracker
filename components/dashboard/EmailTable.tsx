"use client";

import { Mail, Phone, Pencil, Trash2 } from "lucide-react";
import { Email, CompanyGroup } from "@/types";
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
import { CompanyGroupRow } from "@/components/dashboard/CompanyGroupRow";

export const statusColors: Record<string, { dot: string; text: string }> = {
  opened: { dot: "bg-cyan-500", text: "text-cyan-700 dark:text-cyan-400" },
  researched: { dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-400" },
  sent: { dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-400" },
  replied: { dot: "bg-green-500", text: "text-green-700 dark:text-green-400" },
  bounced: { dot: "bg-red-500", text: "text-red-700 dark:text-red-400" },
};

export const classificationColors: Record<string, { dot: string; text: string }> = {
  hot: { dot: "bg-red-500", text: "text-red-700 dark:text-red-400" },
  warm: { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" },
  cold: { dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-400" },
};

const clientStatusColors: Record<string, { dot: string; text: string }> = {
  first_send: { dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-400" },
  follow_1: { dot: "bg-orange-500", text: "text-orange-700 dark:text-orange-400" },
  follow_2: { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" },
  follow_3: { dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-400" },
};

export function getClientStatusColor(clientStatus: string) {
  if (!clientStatus) return { dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-300" };
  return (
    clientStatusColors[clientStatus] || {
      dot: "bg-slate-400",
      text: "text-slate-600 dark:text-slate-300",
    }
  );
}

interface EmailTableProps {
  groups: CompanyGroup[];
  selectedIds: Set<string>;
  expandedCompanies: Set<string>;
  onSelectEmail: (id: string, visibleEmails: Email[], shiftKey: boolean) => void;
  onSelectGroup: (emailIds: string[]) => void;
  onSelectAll: () => void;
  onToggleCompany: (companyKey: string) => void;
  onViewDetails: (email: Email) => void;
  onDelete: (email: Email) => void;
  isAllSelected: boolean;
}

export function EmailTable({
  groups,
  selectedIds,
  expandedCompanies,
  onSelectEmail,
  onSelectGroup,
  onSelectAll,
  onToggleCompany,
  onViewDetails,
  onDelete,
  isAllSelected,
}: EmailTableProps) {
  const allEmails = groups.flatMap((g) => g.emails);

  const formatLabel = (value: string) =>
    value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const getStatusColor = (status: string) =>
    statusColors[status] || { dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-300" };
  const getClassificationColor = (classification: string) =>
    classificationColors[classification] || {
      dot: "bg-slate-400",
      text: "text-slate-600 dark:text-slate-300",
    };

  const DotLabel = ({ label, dotClass, textClass }: { label: string; dotClass: string; textClass: string }) => (
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
            <TableHead>Company</TableHead>
            <TableHead>Contacts</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Classification</TableHead>
            <TableHead>Client Steps</TableHead>
            <TableHead>Campaign</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => {
            if (group.emails.length === 1) {
              const email = group.emails[0];
              return (
                <TableRow key={email.id} className="border-b border-border hover:bg-muted">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(email.id)}
                      onClick={(e: React.MouseEvent) =>
                        onSelectEmail(email.id, allEmails, e.shiftKey)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => onViewDetails(email)}
                      className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer"
                    >
                      {email.lead_name || email.company}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {email.phone && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {email.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-foreground">
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
                      dotClass={getClassificationColor(email.lead_classification).dot}
                      textClass={getClassificationColor(email.lead_classification).text}
                    />
                  </TableCell>
                  <TableCell>
                    <DotLabel
                      label={email.client_step ? formatLabel(email.client_step) : "-"}
                      dotClass={getClientStatusColor(email.client_step || "").dot}
                      textClass={getClientStatusColor(email.client_step || "").text}
                    />
                  </TableCell>
                  <TableCell className="text-foreground">{email.campaign_name || "-"}</TableCell>
                  <TableCell className="text-sm text-foreground">
                    {email.created_at
                      ? new Date(email.created_at).toLocaleDateString("en-US")
                      : "-"}
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
              );
            }

            return (
              <CompanyGroupRow
                key={group.companyKey}
                group={group}
                isExpanded={expandedCompanies.has(group.companyKey)}
                selectedIds={selectedIds}
                onToggleExpand={() => onToggleCompany(group.companyKey)}
                onSelectGroup={onSelectGroup}
                onSelectEmail={onSelectEmail}
                onViewDetails={onViewDetails}
                onDelete={onDelete}
                allEmails={allEmails}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
