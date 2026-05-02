"use client";

import { Briefcase, CheckCircle2, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePipelineMetrics, PipelineRow } from "@/hooks/usePipelineMetrics";

const currency = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const KPI_DEF = [
  {
    key: "pipeline" as const,
    label: "Open pipeline",
    icon: Briefcase,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/8 dark:bg-sky-500/10",
    border: "border-sky-200/60 dark:border-sky-800/30",
  },
  {
    key: "won" as const,
    label: "Closed won",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/8 dark:bg-green-500/10",
    border: "border-green-200/60 dark:border-green-800/30",
  },
  {
    key: "winrate" as const,
    label: "Win rate",
    icon: Target,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/8 dark:bg-violet-500/10",
    border: "border-violet-200/60 dark:border-violet-800/30",
  },
  {
    key: "avg" as const,
    label: "Avg. deal size",
    icon: TrendingUp,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/8 dark:bg-amber-500/10",
    border: "border-amber-200/60 dark:border-amber-800/30",
  },
];

export function PipelineSection() {
  const { rows, totals, loading, error } = usePipelineMetrics();

  const values = {
    pipeline: currency(totals.pipelineValue),
    won: currency(totals.closedWonValue),
    winrate: `${totals.winRate}%`,
    avg: currency(totals.avgDealSize),
  };
  const closedCount = totals.wonDeals + totals.lostDeals;
  const subtitles = {
    pipeline: `${totals.openDeals} open deal${totals.openDeals === 1 ? "" : "s"}`,
    won: `${totals.wonDeals} won · ${totals.lostDeals} lost`,
    winrate:
      closedCount === 0
        ? "Awaiting first closed deal"
        : `Out of ${closedCount} closed deal${closedCount === 1 ? "" : "s"}`,
    avg: totals.wonDeals > 0 ? "Across closed-won deals" : "Awaiting first closed-won deal",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Pipeline</h2>
          <p className="text-xs text-muted-foreground">
            Revenue attributed to your campaigns, based on deals closed from the Inbox or the lead detail.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_DEF.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.key}
              className={`overflow-hidden rounded-xl border ${kpi.border} ${kpi.bg} backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between px-4 pt-3.5">
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
              </div>
              <div className="px-4 pt-1 pb-3">
                {loading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <span className={`text-2xl font-bold tracking-tight ${kpi.color}`}>
                    {values[kpi.key]}
                  </span>
                )}
                <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitles[kpi.key]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-campaign table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Revenue per campaign</CardTitle>
          <CardDescription className="text-[11px]">
            Sorted by closed-won value, then by open pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="py-4 text-sm text-red-600">{error}</p>
          ) : loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No deals tracked yet. Close replies as won or lost from the Inbox to populate this report.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-2 font-medium">Campaign</th>
                    <th className="py-2 px-2 text-right font-medium">Leads</th>
                    <th className="py-2 px-2 text-right font-medium">Replies</th>
                    <th className="py-2 px-2 text-right font-medium">Open</th>
                    <th className="py-2 px-2 text-right font-medium">Won / Lost</th>
                    <th className="py-2 px-2 text-right font-medium">Pipeline</th>
                    <th className="py-2 pl-2 text-right font-medium">Closed-won</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: PipelineRow) => (
                    <tr key={r.campaign_name} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-2 font-medium text-foreground">{r.campaign_name}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">
                        {r.total_leads}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        {r.replied}
                        <span className="ml-1 text-xs text-muted-foreground">({r.reply_rate}%)</span>
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">{r.open_deals}</td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        <span className="text-green-600 dark:text-green-400">{r.won_deals}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-muted-foreground">{r.lost_deals}</span>
                        {r.won_deals + r.lost_deals > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">({r.win_rate}%)</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums text-sky-600 dark:text-sky-400">
                        {currency(r.pipeline_value)}
                      </td>
                      <td className="py-2 pl-2 text-right tabular-nums font-semibold text-green-600 dark:text-green-400">
                        {currency(r.closed_won_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
