"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyBreakdown } from "@/hooks/useAnalyticsData";

interface EmailsOverTimeChartProps {
  data: DailyBreakdown[];
  periodDays?: number;
}

const areaConfig = [
  { key: "replied", label: "Replied", color: "#22c55e", opacity: 0.15 },
  { key: "opened", label: "Opened", color: "#0ea5e9", opacity: 0.12 },
  { key: "sent", label: "Sent", color: "#8b5cf6", opacity: 0.10 },
  { key: "researched", label: "Researched", color: "#64748b", opacity: 0.06 },
];

export function EmailsOverTimeChart({ data, periodDays = 30 }: EmailsOverTimeChartProps) {
  return (
    <Card className="card-hover flex h-full flex-col">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-sm font-semibold">Email Activity</CardTitle>
          <CardDescription className="text-[11px]">Daily trends over the last {periodDays} days</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="h-full min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {areaConfig.map(({ key, color, opacity }) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={opacity} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "10px",
                  fontSize: "11px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "4 4" }}
              />
              <Legend
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }}
              />
              {areaConfig.map(({ key, label, color }) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${key})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: color }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
