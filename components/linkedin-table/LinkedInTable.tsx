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
import { Badge } from "@/components/ui/badge";
import { LinkedInCompanyGroupRow } from "./LinkedInCompanyGroupRow";

export const linkedInStatusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-gray-100", text: "text-gray-800" },
  sent: { bg: "bg-blue-100", text: "text-blue-800" },
  delivered: { bg: "bg-indigo-100", text: "text-indigo-800" },
  read: { bg: "bg-purple-100", text: "text-purple-800" },
  replied: { bg: "bg-green-100", text: "text-green-800" },
  failed: { bg: "bg-red-100", text: "text-red-800" },
};

export const classificationColors: Record<string, { bg: string; text: string }> = {
  hot: { bg: "bg-red-100", text: "text-red-800" },
  warm: { bg: "bg-yellow-100", text: "text-yellow-800" },
  cold: { bg: "bg-blue-100", text: "text-blue-800" },
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

  const getStatusColor = (status: string) =>
    linkedInStatusColors[status] || { bg: "bg-gray-100", text: "text-gray-800" };
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
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Classification</TableHead>
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
                    <Badge className={getStatusColor(msg.status).bg}>
                      <span className={getStatusColor(msg.status).text}>{msg.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getClassificationColor(msg.lead_classification).bg}>
                      <span className={getClassificationColor(msg.lead_classification).text}>
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
