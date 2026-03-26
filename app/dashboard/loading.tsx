import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-4">
        {/* Title + Tabs */}
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-10 w-80 mb-4" />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border/50 bg-card">
              <div className="px-4 pt-3.5">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="px-4 pt-2">
                <Skeleton className="h-7 w-14" />
              </div>
              <div className="px-1 pt-2 pb-0.5">
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* Bento row: Rates + Funnel + Line Chart */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Conversion Rates */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-around py-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <Skeleton className="h-[72px] w-[72px] rounded-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Funnel */}
            <Card>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 flex-1 rounded-md" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          {/* Line chart */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[280px] w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pie + Bar row */}
        <div className="grid grid-cols-12 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="col-span-12 md:col-span-6 lg:col-span-3">
              <Card>
                <CardHeader className="pb-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[160px] w-full rounded-lg" />
                  <div className="mt-2 flex justify-center gap-3">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
          <div className="col-span-12 lg:col-span-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-36 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[280px] w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
