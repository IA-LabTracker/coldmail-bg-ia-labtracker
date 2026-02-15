"use client";

import { Pencil, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { CompanyGroupRow } from "@/components/dashboard/CompanyGroupRow";

export const statusColors: Record<string, { bg: string; text: string }> = {
  researched: { bg: "bg-purple-100", text: "text-purple-800" },
  sent: { bg: "bg-blue-100", text: "text-blue-800" },
  replied: { bg: "bg-green-100", text: "text-green-800" },
  bounced: { bg: "bg-red-100", text: "text-red-800" },
};

export const classificationColors: Record<string, { bg: string; text: string }> = {
  hot: { bg: "bg-red-100", text: "text-red-800" },
  warm: { bg: "bg-yellow-100", text: "text-yellow-800" },
  cold: { bg: "bg-blue-100", text: "text-blue-800" },
};

const clientStatusColors: Record<string, { bg: string; text: string }> = {
  "first-send": { bg: "bg-blue-100", text: "text-blue-800" },
  "first-followup": { bg: "bg-orange-100", text: "text-orange-800" },
  "second-followup": { bg: "bg-yellow-100", text: "text-yellow-800" },
  "third-followup": { bg: "bg-purple-100", text: "text-purple-800" },
  "fourth-followup": { bg: "bg-pink-100", text: "text-pink-800" },
  "fifth-followup": { bg: "bg-indigo-100", text: "text-indigo-800" },
  followup: { bg: "bg-gray-100", text: "text-gray-800" },
};

export function getClientStatusColor(clientStatus: string) {
  if (!clientStatus) return { bg: "bg-gray-100", text: "text-gray-800" };

  if (clientStatus.includes("-followup") && !clientStatusColors[clientStatus]) {
    return clientStatusColors["followup"];
  }

  return clientStatusColors[clientStatus] || { bg: "bg-gray-100", text: "text-gray-800" };
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

  const getStatusColor = (status: string) =>
    statusColors[status] || { bg: "bg-gray-100", text: "text-gray-800" };
  const getClassificationColor = (classification: string) =>
    classificationColors[classification] || { bg: "bg-gray-100", text: "text-gray-800" };

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted">
            <TableHead className="w-12">
              <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} />
            </TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Classification</TableHead>
            <TableHead>Client Steps</TableHead>
            <TableHead>Campaign</TableHead>
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
                      {email.company}
                    </button>
                  </TableCell>
                  <TableCell className="text-foreground">{email.email}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(email.status).bg}>
                      <span className={getStatusColor(email.status).text}>{email.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getClassificationColor(email.lead_classification).bg}>
                      <span className={getClassificationColor(email.lead_classification).text}>
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
                  <TableCell className="text-foreground">{email.campaign_name || "-"}</TableCell>
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
