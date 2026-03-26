"use client";

import { Pencil, Webhook, SearchCheck, BarChart3 } from "lucide-react";

const STEPS = [
  {
    icon: Pencil,
    title: "Define criteria",
    description: "Region, industry and keywords",
  },
  {
    icon: Webhook,
    title: "Trigger webhook",
    description: "Data sent to n8n workflow",
  },
  {
    icon: SearchCheck,
    title: "Search leads",
    description: "n8n finds matching contacts",
  },
  {
    icon: BarChart3,
    title: "View results",
    description: "Leads appear in dashboard",
  },
];

export function SearchHowItWorks() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        How it works
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STEPS.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <step.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
