"use client";

interface CampaignMetricCellProps {
  value: number;
  label: string;
}

export function CampaignMetricCell({ value, label }: CampaignMetricCellProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {value.toLocaleString()}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
    </div>
  );
}
