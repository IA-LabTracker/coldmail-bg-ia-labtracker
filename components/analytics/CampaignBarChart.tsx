"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignMetrics } from "@/hooks/useAnalyticsData";

interface CampaignBarChartProps {
  data: CampaignMetrics[];
}

export function CampaignBarChart({ data }: CampaignBarChartProps) {
  return (
    <Card className="card-hover h-full">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-sm font-semibold">Campaign Performance</CardTitle>
          <CardDescription className="text-[11px]">Top campaigns by engagement</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                className="stroke-border/40"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="campaign"
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                width={110}
                tickFormatter={(v: string) => (v.length > 14 ? v.slice(0, 14) + "..." : v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "10px",
                  fontSize: "11px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4, radius: 4 }}
              />
              <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
              <Bar dataKey="sent" name="Sent" fill="#8b5cf6" radius={[0, 3, 3, 0]} barSize={10} />
              <Bar dataKey="replied" name="Replied" fill="#22c55e" radius={[0, 3, 3, 0]} barSize={10} />
              <Bar dataKey="opened" name="Opened" fill="#0ea5e9" radius={[0, 3, 3, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
