"use client";

import { Search, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface CampaignPageHeaderProps {
  totalCount: number;
  searchFilter: string;
  onSearchChange: (value: string) => void;
  dateRangeFilter: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  sortBy: "recent" | "emails" | "replies" | "rate";
  onSortChange: (sort: "recent" | "emails" | "replies" | "rate") => void;
}

const sortLabels: Record<string, string> = {
  recent: "Most Recent",
  emails: "Total Emails",
  replies: "Most Replies",
  rate: "Best Rate",
};

export function CampaignPageHeader({
  totalCount,
  searchFilter,
  onSearchChange,
  dateRangeFilter,
  onDateRangeChange,
  sortBy,
  onSortChange,
}: CampaignPageHeaderProps) {
  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="animate-section">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Campaigns
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage and track your email outreach
        </p>
      </div>

      {/* Filters Row */}
      <div className="animate-section flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ animationDelay: "80ms" }}>
        {/* Left: Search + Count + Date */}
        <div className="flex items-center gap-3">
          {/* Campaign count tabs */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
            <button className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-sm">
              Active
              <span className="ml-1.5 rounded bg-background/20 px-1.5 py-0.5 text-[10px]">
                {String(totalCount).padStart(2, "0")}
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              placeholder="Search campaigns..."
              value={searchFilter}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 w-56 border-border bg-card pl-9 text-sm placeholder:text-muted-foreground/50"
            />
          </div>

          <DateRangePicker date={dateRangeFilter} onDateChange={onDateRangeChange} />
        </div>

        {/* Right: Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) =>
                onSortChange(e.target.value as "recent" | "emails" | "replies" | "rate")
              }
              className="h-9 appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
