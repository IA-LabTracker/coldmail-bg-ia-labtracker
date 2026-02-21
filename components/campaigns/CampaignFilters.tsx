"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CampaignFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function CampaignFilters({ search, onSearchChange }: CampaignFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search campaigns..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
