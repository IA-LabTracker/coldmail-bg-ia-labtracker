"use client";

interface CampaignStatusBadgeProps {
  totalEmails: number;
  replied: number;
  bounced: number;
}

export function CampaignStatusBadge({ totalEmails, replied, bounced }: CampaignStatusBadgeProps) {
  const allBounced = totalEmails > 0 && bounced === totalEmails;
  const hasActivity = totalEmails > 0;

  const status = allBounced
    ? {
        label: "Bounced",
        dot: "bg-red-500",
        text: "text-red-700 dark:text-red-400",
        bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/40",
      }
    : hasActivity
      ? {
          label: "Running",
          dot: "bg-emerald-500",
          text: "text-emerald-700 dark:text-emerald-400",
          bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40",
        }
      : {
          label: "Draft",
          dot: "bg-slate-400 dark:bg-slate-500",
          text: "text-slate-600 dark:text-slate-400",
          bg: "bg-slate-50 border-slate-200 dark:bg-slate-900/30 dark:border-slate-700/40",
        };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${status.bg} ${status.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
      {status.label}
    </span>
  );
}
