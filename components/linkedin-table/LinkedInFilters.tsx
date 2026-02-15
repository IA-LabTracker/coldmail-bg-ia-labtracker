"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LinkedInFiltersProps {
  status: string;
  onStatusChange: (value: string) => void;
  classification: string;
  onClassificationChange: (value: string) => void;
  campaign: string;
  onCampaignChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function LinkedInFilters({
  status,
  onStatusChange,
  classification,
  onClassificationChange,
  campaign,
  onCampaignChange,
  search,
  onSearchChange,
}: LinkedInFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-foreground">Status</label>
          <Select
            value={status || "all"}
            onValueChange={(v) => onStatusChange(v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Classification</label>
          <Select
            value={classification || "all"}
            onValueChange={(v) => onClassificationChange(v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classifications</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="li-campaign" className="block text-sm font-medium text-foreground">
            Campaign
          </label>
          <Input
            id="li-campaign"
            type="text"
            placeholder="Filter by campaign..."
            value={campaign}
            onChange={(e) => onCampaignChange(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="search" className="block text-sm font-medium text-foreground">
          Search
        </label>
        <Input
          id="li-search"
          type="text"
          placeholder="Search by name, company, position, headline..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-[300px]"
        />
      </div>
    </div>
  );
}
