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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import {
  statusColors,
  classificationColors,
  getClientStatusColor,
} from "@/components/dashboard/EmailTable";

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
  statusColors[status] || { dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-300" };
const getClassificationColor = (classification: string) =>
  classificationColors[classification] || {
    dot: "bg-slate-400",
    text: "text-slate-600 dark:text-slate-300",
  };

// Pill-style status/classification badge colors
const statusPillColors: Record<string, string> = {
  opened: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  researched: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  replied: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  bounced: "bg-red-500/10 text-red-600 dark:text-red-400",
  scheduled: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const classificationPillColors: Record<string, string> = {
  hot: "bg-red-500/10 text-red-600 dark:text-red-400",
  warm: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  cold: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

const clientStepPillColors: Record<string, string> = {
  first_send: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  follow_1: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  follow_2: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  follow_3: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  finished: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

// Subtle, corporate avatar tones
const avatarTones = [
  "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
  "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300",
  "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
];

function getAvatarTone(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarTones[Math.abs(hash) % avatarTones.length];
}

function getInitials(name: string, company: string) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return company.slice(0, 2).toUpperCase();
}

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

  const formatLabel = (value: string) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  const PillBadge = ({ label, colorClass }: { label: string; colorClass: string }) => (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Mail className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="mt-4 text-base font-medium text-foreground">No leads found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters or import new leads
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/50">
            <TableHead className="w-12">
              <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} />
            </TableHead>
            <TableHead className="font-medium">Lead / Company</TableHead>
            <TableHead className="font-medium">Contact</TableHead>
            <TableHead className="font-medium">Status</TableHead>
            <TableHead className="font-medium">Classification</TableHead>
            <TableHead className="font-medium">Client Steps</TableHead>
            {showCampaign && <TableHead className="font-medium">Campaign</TableHead>}
            <TableHead className="font-medium">Region</TableHead>
            <TableHead className="font-medium">Created At</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleItems.map((email) => {
            const initials = getInitials(email.lead_name || "", email.company);
            const tone = getAvatarTone(email.lead_name || email.company);
            const isSelected = selectedIds.has(email.id);

            return (
              <TableRow
                key={email.id}
                className={`border-b border-border transition-colors hover:bg-muted/50 ${
                  isSelected ? "bg-primary/5" : ""
                }`}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onClick={(e: React.MouseEvent) =>
                      onSelectEmail(email.id, visibleItems, e.shiftKey)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${tone}`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onViewDetails(email)}
                        className="block truncate text-sm font-medium text-foreground hover:text-primary"
                      >
                        {email.lead_name || email.company}
                      </button>
                      {email.lead_name && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {email.company}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-foreground">{email.email}</span>
                    {email.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {email.phone}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <PillBadge
                    label={formatLabel(email.status)}
                    colorClass={statusPillColors[email.status] || "bg-muted text-muted-foreground"}
                  />
                </TableCell>
                <TableCell>
                  <PillBadge
                    label={formatLabel(email.lead_classification)}
                    colorClass={
                      classificationPillColors[email.lead_classification] ||
                      "bg-muted text-muted-foreground"
                    }
                  />
                </TableCell>
                <TableCell>
                  {email.client_step ? (
                    <PillBadge
                      label={formatLabel(email.client_step)}
                      colorClass={
                        clientStepPillColors[email.client_step] || "bg-muted text-muted-foreground"
                      }
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                {showCampaign && (
                  <TableCell className="text-sm text-foreground">
                    {email.campaign_name || "-"}
                  </TableCell>
                )}
                <TableCell className="text-sm text-foreground">{email.region || "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {email.created_at
                    ? new Date(email.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "2-digit",
                      })
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 [tr:hover_&]:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit email"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => onViewDetails(email)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete email"
                      className="h-8 w-8 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                      onClick={() => onDelete(email)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {hasMore && (
        <div ref={sentinelRef} className="space-y-1 px-4 py-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
