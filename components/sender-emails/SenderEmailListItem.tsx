"use client";

import { useRouter } from "next/navigation";
import { FileText, MoreHorizontal } from "lucide-react";
import { EmailTemplate, SenderEmail, SenderEmailStatus } from "@/types";
import { formatDate } from "@/lib/formatDate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SenderEmailGroup {
  senderEmail: SenderEmail;
  totalEmails: number;
  sent: number;
  replied: number;
  bounced: number;
  opened: number;
  template: EmailTemplate | null;
}

interface SenderEmailListItemProps {
  group: SenderEmailGroup;
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
  "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
];

import { PlatformIndicator } from "@/components/sender-emails/PlatformIndicator";

const STATUS_STYLES: Record<SenderEmailStatus, { dot: string; text: string; bg: string }> = {
  active: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40",
  },
  pending: {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40",
  },
  error: {
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/40",
  },
  suspended: {
    dot: "bg-slate-400",
    text: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 border-slate-200 dark:bg-slate-900/30 dark:border-slate-700/40",
  },
};

function EmailAvatar({ email }: { email: string }) {
  const hash = email.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colorClass = avatarColors[hash % avatarColors.length];
  const initial = email[0]?.toUpperCase() || "?";

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-transform duration-300 group-hover:scale-105 ${colorClass}`}
    >
      {initial}
    </div>
  );
}

function MetricBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-start min-w-[70px]">
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {value.toLocaleString()}
        </span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export function SenderEmailListItem({
  group,
  index,
  onEdit,
  onDelete,
  onSetDefault,
}: SenderEmailListItemProps) {
  const router = useRouter();
  const { senderEmail } = group;
  const status = STATUS_STYLES[senderEmail.status] ?? STATUS_STYLES.active;
  const platform = senderEmail.platform && senderEmail.platform !== "none" ? senderEmail.platform : null;

  return (
    <div
      className="animate-list-item hover-lift hover-glow group flex cursor-pointer items-center gap-5 rounded-xl border border-border bg-card px-6 py-5"
      style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
      onClick={() => router.push(`/sender-emails/${senderEmail.id}`)}
    >
      <EmailAvatar email={senderEmail.email_address} />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[15px] font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
            {senderEmail.email_address}
          </h3>
          {senderEmail.is_default && (
            <span className="shrink-0 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Default
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
          {senderEmail.display_name || "No display name"}
          {senderEmail.domain && (
            <>
              <span className="mx-1.5 text-border">·</span>
              {senderEmail.domain}
            </>
          )}
          <span className="mx-1.5 text-border">·</span>
          Added {formatDate(senderEmail.created_at)}
          {senderEmail.daily_limit > 0 && (
            <>
              <span className="mx-1.5 text-border">·</span>
              {senderEmail.daily_limit}/day
            </>
          )}
        </p>
        {/* Platform + Status + Template badges */}
        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          {platform && <PlatformIndicator platform={platform} />}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.bg} ${status.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {senderEmail.status}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push("/templates");
            }}
            className="inline-flex max-w-[220px] items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted hover:text-foreground"
            title={
              group.template
                ? `Template: ${group.template.name}`
                : "No template assigned — click to create one"
            }
          >
            <FileText className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {group.template ? group.template.name : "No template"}
            </span>
          </button>
        </div>
      </div>

      {/* Metrics — XL screens */}
      <div className="hidden items-center gap-8 xl:flex">
        <MetricBlock value={group.sent} label="Sent" />
        <MetricBlock value={group.replied} label="Replied" />
        <MetricBlock value={group.bounced} label="Bounced" />
        <MetricBlock value={group.opened} label="Opened" />
      </div>

      {/* Compact metrics — MD screens */}
      <div className="hidden items-center gap-4 md:flex xl:hidden">
        <div className="text-center">
          <span className="text-lg font-bold tabular-nums text-foreground">{group.sent}</span>
          <span className="ml-1 text-[11px] text-muted-foreground">sent</span>
        </div>
        <div className="text-center">
          <span className="text-lg font-bold tabular-nums text-foreground">{group.replied}</span>
          <span className="ml-1 text-[11px] text-muted-foreground">replied</span>
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Sender options"
            className="shrink-0 rounded-lg p-2 text-muted-foreground/40 opacity-0 transition-all duration-200 hover:bg-muted hover:text-muted-foreground group-hover:opacity-100 focus-visible:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => onEdit(senderEmail)}>Edit</DropdownMenuItem>
          {!senderEmail.is_default && (
            <DropdownMenuItem onClick={() => onSetDefault(senderEmail.id)}>
              Set as default
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(senderEmail.id)}
          >
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
