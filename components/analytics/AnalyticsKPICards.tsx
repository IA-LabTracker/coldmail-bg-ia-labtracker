"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { KPISparkline } from "@/hooks/useAnalyticsData";

const kpiColors = [
  { stroke: "#0ea5e9", gradient: "sky", text: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/8 dark:bg-sky-500/10", border: "border-sky-200/60 dark:border-sky-800/30" },
  { stroke: "#22c55e", gradient: "green", text: "text-green-600 dark:text-green-400", bg: "bg-green-500/8 dark:bg-green-500/10", border: "border-green-200/60 dark:border-green-800/30" },
  { stroke: "#14b8a6", gradient: "teal", text: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/8 dark:bg-teal-500/10", border: "border-teal-200/60 dark:border-teal-800/30" },
  { stroke: "#8b5cf6", gradient: "violet", text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/8 dark:bg-violet-500/10", border: "border-violet-200/60 dark:border-violet-800/30" },
  { stroke: "#64748b", gradient: "slate", text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500/5 dark:bg-slate-500/8", border: "border-slate-200/60 dark:border-slate-700/30" },
];

interface AnalyticsKPICardsProps {
  sparklines: KPISparkline[];
}

export function AnalyticsKPICards({ sparklines }: AnalyticsKPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {sparklines.map((kpi, idx) => {
        const color = kpiColors[idx];
        const isPositive = kpi.changePercent > 0;
        const isNeutral = kpi.changePercent === 0;
        const gradientId = `kpi-grad-${idx}`;

        return (
          <div
            key={kpi.label}
            className={`
              card-hover sparkline-hover
              relative overflow-hidden rounded-xl border ${color.border} ${color.bg}
              backdrop-blur-sm
              animate-fade-up stagger-${idx + 1}
            `}
          >
            {/* Top section: label + trend */}
            <div className="flex items-center justify-between px-4 pt-3.5">
              <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
              {!isNeutral && (
                <div
                  className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    isPositive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-2.5 w-2.5" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5" />
                  )}
                  {Math.abs(kpi.changePercent)}%
                </div>
              )}
              {isNeutral && (
                <div className="flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  <Minus className="h-2.5 w-2.5" />
                  0%
                </div>
              )}
            </div>

            {/* Value */}
            <div className="px-4 pt-1">
              <span className={`text-2xl font-bold tracking-tight ${color.text} animate-count-up`}>
                {kpi.value.toLocaleString()}
              </span>
            </div>

            {/* Sparkline */}
            <div className="mt-1 h-10 px-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpi.trend} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color.stroke} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={color.stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={color.stroke}
                    strokeWidth={1.5}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
