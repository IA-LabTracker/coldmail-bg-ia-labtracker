"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailFiltersProps {
  status: string;
  onStatusChange: (value: string) => void;
  classification: string;
  onClassificationChange: (value: string) => void;
  clientStep: string;
  onClientStepChange: (value: string) => void;
  campaign: string;
  onCampaignChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function EmailFilters({
  status,
  onStatusChange,
  classification,
  onClassificationChange,
  clientStep,
  onClientStepChange,
  campaign,
  onCampaignChange,
  search,
  onSearchChange,
}: EmailFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <SelectItem value="researched">Researched</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
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
          <label className="block text-sm font-medium text-foreground">Client Steps</label>
          <Select
            value={clientStep || "all"}
            onValueChange={(v) => onClientStepChange(v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Steps</SelectItem>
              <SelectItem value="first-send">First Send</SelectItem>
              <SelectItem value="first-followup">First Followup</SelectItem>
              <SelectItem value="second-followup">Second Followup</SelectItem>
              <SelectItem value="third-followup">Third Followup</SelectItem>
              <SelectItem value="fourth-followup">Fourth Followup</SelectItem>
              <SelectItem value="fifth-followup">Fifth Followup</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="campaign" className="block text-sm font-medium text-foreground">
            Campaign
          </label>
          <Input
            id="campaign"
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
          id="search"
          type="text"
          placeholder="Search by company, email, lead name, category etc..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-[300px]"
        />
      </div>
    </div>
  );
}
