"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScheduleStatus, ScheduleType } from "@/types";

interface ScheduleFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: ScheduleStatus | "all";
  onStatusFilterChange: (value: ScheduleStatus | "all") => void;
  typeFilter: ScheduleType | "all";
  onTypeFilterChange: (value: ScheduleType | "all") => void;
}

export function ScheduleFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
}: ScheduleFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search schedules..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={statusFilter}
        onValueChange={(val) => onStatusFilterChange(val as ScheduleStatus | "all")}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="paused">Paused</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={typeFilter}
        onValueChange={(val) => onTypeFilterChange(val as ScheduleType | "all")}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="one_time">One-time</SelectItem>
          <SelectItem value="recurring">Recurring</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
