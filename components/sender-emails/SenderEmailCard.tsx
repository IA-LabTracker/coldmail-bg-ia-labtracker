"use client";

import { SenderEmail, SenderEmailStatus } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/formatDate";
import { useState } from "react";

interface SenderEmailCardProps {
  senderEmail: SenderEmail;
  index: number;
  onEdit: (senderEmail: SenderEmail) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const avatarColors = [
  "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
];

const PROVIDER_LABELS: Record<string, string> = {
  manual: "Manual",
  resend: "Resend",
  zapmail: "Zapmail",
  ses: "SES",
  mailgun: "Mailgun",
  smtp: "SMTP",
};

const STATUS_STYLES: Record<SenderEmailStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  suspended: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
};

function EmailAvatar({ email }: { email: string }) {
  const hash = email.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colorClass = avatarColors[hash % avatarColors.length];
  const initial = email[0]?.toUpperCase() || "?";

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colorClass}`}
    >
      {initial}
    </div>
  );
}

export function SenderEmailCard({
  senderEmail,
  index,
  onEdit,
  onDelete,
  onSetDefault,
}: SenderEmailCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div
      className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-accent/30"
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      <EmailAvatar email={senderEmail.email_address} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {senderEmail.email_address}
          </p>
          {senderEmail.is_default && (
            <span className="shrink-0 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Default
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {senderEmail.display_name || "No display name"}
          {senderEmail.domain && (
            <>
              <span className="mx-1.5 text-border">·</span>
              {senderEmail.domain}
            </>
          )}
          <span className="mx-1.5 text-border">·</span>
          Added {formatDate(senderEmail.created_at)}
        </p>
      </div>

      {/* Provider */}
      <div className="hidden w-20 shrink-0 text-center sm:block">
        <span className="text-xs text-muted-foreground">
          {PROVIDER_LABELS[senderEmail.provider] ?? senderEmail.provider}
        </span>
      </div>

      {/* Status */}
      <div className="hidden w-16 shrink-0 text-center sm:block">
        <span
          className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[senderEmail.status] ?? STATUS_STYLES.active}`}
        >
          {senderEmail.status}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="shrink-0 rounded-lg p-2 text-muted-foreground/40 opacity-0 transition-all duration-200 hover:bg-muted hover:text-muted-foreground group-hover:opacity-100 focus-visible:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onEdit(senderEmail)}>
            Edit
          </DropdownMenuItem>
          {!senderEmail.is_default && (
            <DropdownMenuItem onClick={() => onSetDefault(senderEmail.id)}>
              Set as default
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Remove sender email</AlertDialogTitle>
          <AlertDialogDescription>
            Remove <strong>{senderEmail.email_address}</strong>? Schedules using this email will
            lose their sender configuration.
          </AlertDialogDescription>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(senderEmail.id)}>
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
