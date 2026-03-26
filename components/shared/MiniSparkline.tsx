"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface MiniSparklineProps {
  data: { value: number }[];
  color: string;
  height?: number;
}

export function MiniSparkline({ data, color, height = 32 }: MiniSparklineProps) {
  if (!data.length) return null;

  const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
