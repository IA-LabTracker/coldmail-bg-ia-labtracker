import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar skeleton */}
      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-7 w-20" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-40 mb-1.5" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>

        {/* Summary */}
        <div className="flex items-center gap-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Column header */}
        <div className="flex items-center gap-4 px-5">
          <Skeleton className="h-3 w-9" />
          <Skeleton className="h-3 w-12" />
        </div>

        {/* List items */}
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4"
            >
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1.5">
                  <Skeleton className="h-4 w-44" />
                  {i === 0 && <Skeleton className="h-4 w-12 rounded-md" />}
                </div>
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
