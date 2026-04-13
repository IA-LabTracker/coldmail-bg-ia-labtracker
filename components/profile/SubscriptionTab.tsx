"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { Subscription } from "@/types";
import { formatDate } from "./utils";

const planLabels: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
};

const statusVariants: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Active", variant: "default" },
  trialing: { label: "Trial", variant: "secondary" },
  canceled: { label: "Canceled", variant: "destructive" },
  past_due: { label: "Past Due", variant: "destructive" },
};

interface SubscriptionTabProps {
  subscription: Subscription | null;
}

export function SubscriptionTab({ subscription }: SubscriptionTabProps) {
  if (!subscription) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-border bg-card px-6 py-14 text-center">
        <h3 className="text-lg font-medium text-foreground">No active plan</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Start your free trial and unlock all features
        </p>
        <Link href="/pricing" className="mt-6">
          <Button size="sm">
            View Plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  const statusInfo = statusVariants[subscription.status] ?? {
    label: subscription.status,
    variant: "outline" as const,
  };

  const rows = [
    { label: "Period start", value: formatDate(subscription.current_period_start) },
    { label: "Period end", value: formatDate(subscription.current_period_end) },
    { label: "Auto-renew", value: subscription.cancel_at_period_end ? "No" : "Yes" },
  ];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Current Plan
        </h2>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      <div className="border-b border-border px-6 py-6">
        <p className="text-2xl font-semibold text-foreground">
          {planLabels[subscription.plan] ?? subscription.plan}
        </p>
        <p className="mt-1 text-sm capitalize text-muted-foreground">
          Billed {subscription.billing_cycle}
        </p>
      </div>

      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className="text-sm font-medium text-foreground">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-end border-t border-border px-6 py-4">
        <Link href="/pricing">
          <Button variant="outline" size="sm">
            Change Plan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
