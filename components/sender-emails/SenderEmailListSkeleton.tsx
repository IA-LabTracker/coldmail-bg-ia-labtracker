"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function SenderEmailListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="space-y-1.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4"
          >
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-baseline gap-2">
                <Skeleton className="h-4 w-44" />
                {i === 0 && <Skeleton className="h-4 w-12 rounded-md" />}
              </div>
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
