"use client";

import { Mail, Phone, Pencil, Trash2 } from "lucide-react";
import { Email } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import {
  statusColors,
  classificationColors,
  getClientStatusColor,
} from "@/components/dashboard/EmailTable";

interface Column {
  key: string;
  label: string;
  className?: string;
}

interface EmailListTableProps {
  emails: Email[];
  selectedIds: Set<string>;
  allVisibleEmails: Email[];
  isAllSelected: boolean;
  onSelectAll: () => void;
  onSelectEmail: (id: string, visibleEmails: Email[], shiftKey: boolean) => void;
  onViewDetails: (email: Email) => void;
  onDelete: (email: Email) => void;
  showCampaign?: boolean;
}

const getStatusColor = (status: string) =>
  statusColors[status] || { bg: "bg-gray-100", text: "text-gray-800" };
const getClassificationColor = (classification: string) =>
  classificationColors[classification] || { bg: "bg-gray-100", text: "text-gray-800" };

export function EmailListTable({
  emails,
  selectedIds,
  onSelectAll,
  onSelectEmail,
  onViewDetails,
  onDelete,
  isAllSelected,
  showCampaign = false,
}: EmailListTableProps) {
  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(emails);

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16">
        <p className="text-lg font-medium text-muted-foreground">No emails found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters or import new leads
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted">
            <TableHead className="w-12">
              <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} />
            </TableHead>
            <TableHead>Lead / Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Classification</TableHead>
            <TableHead>Client Steps</TableHead>
            {showCampaign && <TableHead>Campaign</TableHead>}
            <TableHead>Region</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleItems.map((email) => (
            <TableRow key={email.id} className="border-b border-border hover:bg-muted">
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(email.id)}
                  onClick={(e: React.MouseEvent) =>
                    onSelectEmail(email.id, visibleItems, e.shiftKey)
                  }
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => onViewDetails(email)}
                    className="cursor-pointer text-left font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {email.lead_name || email.company}
                  </button>
                  {email.lead_name && (
                    <span className="text-xs text-muted-foreground">{email.company}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    {email.email}
                  </span>
                  {email.phone && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {email.phone}
                    </span>
                  )}
                </div>
              </TableCell>
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
              {showCampaign && (
                <TableCell className="text-sm text-foreground">
                  {email.campaign_name || "-"}
                </TableCell>
              )}
              <TableCell className="text-sm text-foreground">{email.region || "-"}</TableCell>
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
                    className="text-red-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}
