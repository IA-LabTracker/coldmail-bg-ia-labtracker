import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar skeleton */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Steps indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2">
                  <Skeleton className="h-5 w-5" />
                </div>
                <div className="ml-4 min-w-0">
                  <Skeleton className="h-4 w-24" />
                </div>
                {i < 3 && (
                  <div className="hidden sm:block flex-1 mx-4">
                    <Skeleton className="h-0.5 w-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Form fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>

            {/* File upload area */}
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-12">
              <div className="text-center space-y-4">
                <Skeleton className="h-12 w-12 mx-auto" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-64 mx-auto" />
                  <Skeleton className="h-3 w-48 mx-auto" />
                </div>
                <Skeleton className="h-9 w-32 mx-auto" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between pt-6">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
