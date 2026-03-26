"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassificationDistribution } from "@/hooks/useAnalyticsData";

interface ClassificationPieChartProps {
  data: ClassificationDistribution[];
}

export function ClassificationPieChart({ data }: ClassificationPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="card-hover h-full">
      <CardHeader className="pb-1">
        <div>
          <CardTitle className="text-sm font-semibold">Classification</CardTitle>
          <CardDescription className="text-[11px]">Lead temperature</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    className="transition-opacity duration-200 hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "10px",
                  fontSize: "11px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend inline */}
        <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
              <span className="text-[10px] text-muted-foreground">
                {d.name} <span className="font-medium text-foreground">{d.value}</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
