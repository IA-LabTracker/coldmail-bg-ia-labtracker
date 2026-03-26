"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FunnelStep {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  glowColor: string;
}

interface ConversionFunnelProps {
  researched: number;
  sent: number;
  opened: number;
  replied: number;
  hot: number;
}

export function ConversionFunnel({ researched, sent, opened, replied, hot }: ConversionFunnelProps) {
  const steps: FunnelStep[] = [
    { label: "Researched", value: researched, color: "text-slate-400", bgColor: "bg-slate-500", glowColor: "rgba(100, 116, 139, 0.15)" },
    { label: "Sent", value: sent, color: "text-violet-400", bgColor: "bg-violet-500", glowColor: "rgba(139, 92, 246, 0.15)" },
    { label: "Opened", value: opened, color: "text-sky-400", bgColor: "bg-sky-500", glowColor: "rgba(14, 165, 233, 0.2)" },
    { label: "Replied", value: replied, color: "text-green-400", bgColor: "bg-green-500", glowColor: "rgba(34, 197, 94, 0.2)" },
    { label: "Hot Leads", value: hot, color: "text-amber-400", bgColor: "bg-amber-500", glowColor: "rgba(245, 158, 11, 0.2)" },
  ];

  const maxValue = Math.max(...steps.map((s) => s.value), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Email Funnel</CardTitle>
          <CardDescription>Conversion pipeline from research to hot leads</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {steps.map((step, idx) => {
          const widthPercent = Math.max((step.value / maxValue) * 100, 15);
          const conversionRate =
            idx > 0 && steps[idx - 1].value > 0
              ? Math.round((step.value / steps[idx - 1].value) * 100)
              : null;

          return (
            <div key={step.label} className="group relative">
              <div className="flex items-center gap-3">
                <div className="flex w-20 shrink-0 items-center">
                  <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
                </div>
                <div className="relative flex-1">
                  <div
                    className="h-7 w-full overflow-hidden rounded-md bg-muted/50"
                    style={{ boxShadow: `inset 0 0 12px ${step.glowColor}` }}
                  >
                    <div
                      className={`h-full rounded-md ${step.bgColor} flex items-center transition-all duration-700 ease-out`}
                      style={{ width: `${widthPercent}%` }}
                    >
                      <span className="pl-2.5 text-xs font-bold text-white drop-shadow-sm">
                        {step.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                {conversionRate !== null && (
                  <span className="w-10 shrink-0 text-right text-[10px] font-semibold text-emerald-500">
                    {conversionRate}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
