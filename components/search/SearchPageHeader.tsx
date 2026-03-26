"use client";

import { Search } from "lucide-react";

interface SearchPageHeaderProps {
  webhookConfigured: boolean | null;
}

export function SearchPageHeader({ webhookConfigured }: SearchPageHeaderProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Search className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Search & Trigger</h1>
          <p className="text-sm text-muted-foreground">
            Find new leads by triggering your n8n automation workflow
          </p>
        </div>
      </div>
      {webhookConfigured === false && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <p className="text-sm text-orange-600 dark:text-orange-400">
            Webhook not configured.{" "}
            <a href="/settings" className="font-medium underline underline-offset-2">
              Set it up in Settings
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
