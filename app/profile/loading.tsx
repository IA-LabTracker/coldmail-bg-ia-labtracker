import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Cover skeleton */}
      <Skeleton className="h-44 w-full rounded-none" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Avatar + name */}
        <div className="-mt-16 flex items-end gap-6">
          <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
          <div className="mb-1.5 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-4 divide-x divide-border rounded-lg border border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center py-5">
              <Skeleton className="h-6 w-10" />
              <Skeleton className="mt-1.5 h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="mt-8">
          <Skeleton className="mb-6 h-10 w-80" />
          <div className="rounded-lg border border-border p-6">
            <Skeleton className="mb-6 h-4 w-40" />
            <div className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
