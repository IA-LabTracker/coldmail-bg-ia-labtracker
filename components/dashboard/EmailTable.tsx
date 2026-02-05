"use client";

import { ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Email } from "@/types";
import { formatDateOnly } from "@/lib/formatDate";
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

interface EmailTableProps {
  emails: Email[];
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onSelectEmail: (id: string) => void;
  onSelectAll: () => void;
  onToggleExpand: (id: string) => void;
  onViewDetails: (email: Email) => void;
  isAllSelected: boolean;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  sent: { bg: "bg-blue-100", text: "text-blue-800" },
  replied: { bg: "bg-green-100", text: "text-green-800" },
  bounced: { bg: "bg-red-100", text: "text-red-800" },
};

const classificationColors: Record<string, { bg: string; text: string }> = {
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

export function EmailTable({
  emails,
  selectedIds,
  expandedIds,
  sortConfig,
  onSelectEmail,
  onSelectAll,
  onToggleExpand,
  onViewDetails,
  isAllSelected,
}: EmailTableProps) {
  const getStatusColor = (status: string) =>
    statusColors[status] || { bg: "bg-gray-100", text: "text-gray-800" };
  const getClassificationColor = (classification: string) =>
    classificationColors[classification] || { bg: "bg-gray-100", text: "text-gray-800" };
  const getClientStatusColor = (clientStatus: string) => {
    if (!clientStatus) return { bg: "bg-gray-100", text: "text-gray-800" };

    if (clientStatus.includes("-followup") && !clientStatusColors[clientStatus]) {
      return clientStatusColors["followup"];
    }

    return clientStatusColors[clientStatus] || { bg: "bg-gray-100", text: "text-gray-800" };
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200 bg-gray-50">
            <TableHead className="w-12">
              <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} />
            </TableHead>
            <TableHead className="w-36">Company</TableHead>
            <TableHead className="w-32">Lead Name</TableHead>
            <TableHead className="w-44">Email</TableHead>
            <TableHead className="w-28">Phone</TableHead>
            <TableHead className="w-24">Region</TableHead>
            <TableHead className="w-32">Industry</TableHead>
            <TableHead className="w-32">Keywords</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-28">Classification</TableHead>
            <TableHead className="w-24">Client Status</TableHead>
            <TableHead className="w-32">Campaign</TableHead>
            <TableHead className="w-36">Date Sent</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.map((email) => (
            <TableRow key={email.id} className="border-b border-gray-200 hover:bg-gray-50">
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(email.id)}
                  onCheckedChange={() => onSelectEmail(email.id)}
                />
              </TableCell>
              <TableCell className="font-medium text-gray-900">{email.company}</TableCell>
              <TableCell className="text-gray-700">{email.lead_name || "-"}</TableCell>
              <TableCell className="text-gray-700">{email.email}</TableCell>
              <TableCell className="text-gray-700">{email.phone || "-"}</TableCell>
              <TableCell className="text-gray-700">{email.region}</TableCell>
              <TableCell className="text-gray-700">{email.industry}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {email.keywords.slice(0, 2).map((kw, idx) => (
                    <Badge key={idx} variant="secondary">
                      {kw}
                    </Badge>
                  ))}
                  {email.keywords.length > 2 && (
                    <Badge variant="secondary">+{email.keywords.length - 2}</Badge>
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
                <Badge className={getClientStatusColor(email.client_status || "").bg}>
                  <span className={getClientStatusColor(email.client_status || "").text}>
                    {email.client_status || "-"}
                  </span>
                </Badge>
              </TableCell>
              <TableCell className="text-gray-700">{email.campaign_name || "-"}</TableCell>
              <TableCell className="text-gray-700">{formatDateOnly(email.date_sent)}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {(email.city || email.phone || email.address) && (
                    <Button variant="ghost" size="sm" onClick={() => onToggleExpand(email.id)}>
                      {expandedIds.has(email.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(email)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
