"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface CampaignDetailHeaderProps {
  campaignName: string;
  totalEmails: number;
  uniqueCompanies: number;
  dateRange: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
}

function CampaignDetailHeaderImpl({
  campaignName,
  totalEmails,
  uniqueCompanies,
  dateRange,
  onDateChange,
}: CampaignDetailHeaderProps) {
  const router = useRouter();
  const initial = campaignName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to campaigns"
          className="h-9 w-9 shrink-0"
          onClick={() => router.push("/campaigns")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
          {initial}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-foreground">{campaignName}</h1>
          <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{uniqueCompanies} companies</span>
            <span className="text-border">·</span>
            <span>{totalEmails} leads</span>
          </div>
        </div>
      </div>
      <DateRangePicker date={dateRange} onDateChange={onDateChange} />
    </div>
  );
}

export const CampaignDetailHeader = memo(CampaignDetailHeaderImpl);
