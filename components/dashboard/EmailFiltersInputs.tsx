"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface EmailFiltersInputsProps {
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

export function EmailFiltersInputs({
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
}: EmailFiltersInputsProps) {
  const hasActiveFilters =
    !!status || !!classification || !!clientStep || !!campaign || !!search;

  const clearAll = () => {
    onStatusChange("");
    onClassificationChange("");
    onClientStepChange("");
    onCampaignChange("");
    onSearchChange("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px] max-w-[320px]">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search leads..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      <Select
        value={status || "all"}
        onValueChange={(v) => onStatusChange(v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="opened">Opened</SelectItem>
          <SelectItem value="researched">Researched</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="replied">Replied</SelectItem>
          <SelectItem value="bounced">Bounced</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={classification || "all"}
        onValueChange={(v) => onClassificationChange(v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-[155px] h-9">
          <SelectValue placeholder="Classification" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Classifications</SelectItem>
          <SelectItem value="hot">Hot</SelectItem>
          <SelectItem value="warm">Warm</SelectItem>
          <SelectItem value="cold">Cold</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={clientStep || "all"}
        onValueChange={(v) => onClientStepChange(v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Client Step" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Steps</SelectItem>
          <SelectItem value="first_send">First Send</SelectItem>
          <SelectItem value="follow_1">Follow 1</SelectItem>
          <SelectItem value="follow_2">Follow 2</SelectItem>
          <SelectItem value="follow_3">Follow 3</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="text"
        placeholder="Campaign..."
        value={campaign}
        onChange={(e) => onCampaignChange(e.target.value)}
        className="w-[140px] h-9"
      />

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-9 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
