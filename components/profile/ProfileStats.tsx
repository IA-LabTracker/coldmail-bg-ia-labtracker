"use client";

import { UserStats } from "@/hooks/useProfile";

interface ProfileStatsProps {
  stats: UserStats;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const items = [
    { label: "Leads", value: stats.totalLeads },
    { label: "Campaigns", value: stats.totalCampaigns },
    { label: "Replies", value: stats.totalReplied },
    { label: "Schedules", value: stats.totalSchedules },
  ];

  return (
    <div className="mt-8 grid grid-cols-4 divide-x divide-border rounded-lg border border-border bg-card">
      {items.map((stat) => (
        <div key={stat.label} className="py-5 text-center">
          <p className="text-xl font-semibold text-foreground">{stat.value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
