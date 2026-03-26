"use client";

export function CampaignListHeader() {
  return (
    <div className="flex items-center gap-4 border-b border-border bg-muted/30 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
      {/* Avatar spacer */}
      <div className="w-10 shrink-0" />

      {/* Name */}
      <div className="min-w-0 flex-1">Campaign</div>

      {/* Metrics */}
      <div className="hidden items-center gap-6 lg:flex">
        <div className="w-[60px] text-center">Sent</div>
        <div className="w-[60px] text-center">Opened</div>
        <div className="w-[60px] text-center">Replied</div>
        <div className="w-[60px] text-center">Bounced</div>
      </div>

      {/* Reply Rate */}
      <div className="hidden w-16 text-center sm:block">Rate</div>

      {/* Status */}
      <div className="hidden w-[72px] text-center md:block">Status</div>

      {/* Actions spacer */}
      <div className="w-[28px] shrink-0" />

      {/* Chevron spacer */}
      <div className="w-4 shrink-0" />
    </div>
  );
}
