"use client";

import { Filter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface FilterOption {
  label: string;
  value: string;
}

const filterCategories: {
  key: string;
  label: string;
  options: FilterOption[];
}[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "Opened", value: "opened" },
      { label: "Researched", value: "researched" },
      { label: "Sent", value: "sent" },
      { label: "Replied", value: "replied" },
      { label: "Bounced", value: "bounced" },
    ],
  },
  {
    key: "classification",
    label: "Classification",
    options: [
      { label: "Hot", value: "hot" },
      { label: "Warm", value: "warm" },
      { label: "Cold", value: "cold" },
    ],
  },
  {
    key: "clientStep",
    label: "Client Step",
    options: [
      { label: "First Send", value: "first_send" },
      { label: "Follow 1", value: "follow_1" },
      { label: "Follow 2", value: "follow_2" },
      { label: "Follow 3", value: "follow_3" },
    ],
  },
];

interface EmailFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  classification: string;
  onClassificationChange: (value: string) => void;
  clientStep: string;
  onClientStepChange: (value: string) => void;
}

export function EmailFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  classification,
  onClassificationChange,
  clientStep,
  onClientStepChange,
}: EmailFiltersProps) {
  const filterHandlers: Record<string, { value: string; onChange: (v: string) => void }> = {
    status: { value: status, onChange: onStatusChange },
    classification: { value: classification, onChange: onClassificationChange },
    clientStep: { value: clientStep, onChange: onClientStepChange },
  };

  const activeFilters = filterCategories
    .filter((cat) => !!filterHandlers[cat.key].value)
    .map((cat) => {
      const activeValue = filterHandlers[cat.key].value;
      const option = cat.options.find((o) => o.value === activeValue);
      return {
        key: cat.key,
        categoryLabel: cat.label,
        optionLabel: option?.label || activeValue,
        onRemove: () => filterHandlers[cat.key].onChange(""),
      };
    });

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-[250px]">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search leads..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-8"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-dashed"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-xs"
              >
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {filterCategories.map((category) => {
            const handler = filterHandlers[category.key];
            return (
              <DropdownMenuSub key={category.key}>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <span className="flex-1">{category.label}</span>
                  {handler.value && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      active
                    </span>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="min-w-[140px]">
                  {handler.value && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handler.onChange("")}
                        className="cursor-pointer text-muted-foreground"
                      >
                        Clear filter
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {category.options.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handler.onChange(option.value)}
                      className={`cursor-pointer ${
                        handler.value === option.value
                          ? "bg-accent font-medium"
                          : ""
                      }`}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          })}
          {hasActiveFilters && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onStatusChange("");
                  onClassificationChange("");
                  onClientStepChange("");
                }}
                className="cursor-pointer text-muted-foreground"
              >
                Clear all filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="h-7 gap-1 pl-2.5 pr-1 text-xs font-normal"
        >
          <span className="text-muted-foreground">{filter.categoryLabel}:</span>
          <span className="font-medium">{filter.optionLabel}</span>
          <button
            type="button"
            onClick={filter.onRemove}
            className="ml-0.5 rounded-sm p-0.5 hover:bg-muted-foreground/20"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
