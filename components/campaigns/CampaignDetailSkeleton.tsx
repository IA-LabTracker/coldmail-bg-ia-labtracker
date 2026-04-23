import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const KPI_COUNT = 7;
const ROW_COUNT = 6;

function CampaignDetailSkeletonImpl() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: KPI_COUNT }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2.5 px-4 pt-3.5">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-3 w-14" />
            </div>
            <div className="px-4 pt-2">
              <Skeleton className="h-7 w-10" />
            </div>
            <Skeleton className="mt-2 h-8 w-full" />
          </div>
        ))}
      </div>

      <Skeleton className="h-10 w-full rounded-lg" />

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        {Array.from({ length: ROW_COUNT }).map((_, i) => (
          <div key={i} className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const CampaignDetailSkeleton = memo(CampaignDetailSkeletonImpl);
