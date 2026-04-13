import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="mt-3 h-4 w-96" />
          <Skeleton className="mt-8 h-10 w-56" />
        </div>

        {/* Pricing cards */}
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-6 h-10 w-40" />
              <Skeleton className="mt-6 h-10 w-full" />
              <div className="mt-6 space-y-3">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-44" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
