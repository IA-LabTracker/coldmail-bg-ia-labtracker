"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckSquare, X } from "lucide-react";

interface CampaignAssignBarProps {
  selectedCount: number;
  totalCount: number;
  campaignSuggestions: string[];
  onAssign: (campaignName: string) => void;
  onClearSelection: () => void;
}

export function CampaignAssignBar({
  selectedCount,
  totalCount,
  campaignSuggestions,
  onAssign,
  onClearSelection,
}: CampaignAssignBarProps) {
  const [campaignInput, setCampaignInput] = useState("");
  const [mode, setMode] = useState<"select" | "new">(
    campaignSuggestions.length > 0 ? "select" : "new",
  );

  const handleAssign = () => {
    if (!campaignInput.trim()) return;
    onAssign(campaignInput.trim());
    setCampaignInput("");
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-primary" />
        <span className="text-sm text-foreground">
          <strong>{selectedCount}</strong> of {totalCount} selected
        </span>
      </div>

      <div className="h-4 w-px bg-border" />

      {mode === "select" && campaignSuggestions.length > 0 ? (
        <Select
          value={campaignInput}
          onValueChange={(val) => {
            if (val === "__new__") {
              setMode("new");
              setCampaignInput("");
              return;
            }
            setCampaignInput(val);
          }}
        >
          <SelectTrigger className="h-8 w-56 text-sm">
            <SelectValue placeholder="Select campaign" />
          </SelectTrigger>
          <SelectContent>
            {campaignSuggestions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
            <SelectItem value="__new__" className="text-muted-foreground">
              + New campaign...
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Input
          placeholder="New campaign name..."
          value={campaignInput}
          onChange={(e) => setCampaignInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAssign()}
          className="h-8 w-56 text-sm"
          autoFocus
        />
      )}

      <Button size="sm" onClick={handleAssign} disabled={!campaignInput.trim()} className="h-8">
        Apply
      </Button>

      {mode === "new" && campaignSuggestions.length > 0 && (
        <button
          onClick={() => {
            setMode("select");
            setCampaignInput("");
          }}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Back to list
        </button>
      )}

      <button
        onClick={onClearSelection}
        className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <X className="h-3 w-3" />
        Clear
      </button>
    </div>
  );
}
