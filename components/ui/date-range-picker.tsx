"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, subDays, subMonths, subYears, endOfDay, startOfDay, isSameDay } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePreset {
  label: string;
  getValue: () => DateRange;
}

const presets: DateRangePreset[] = [
  {
    label: "Today",
    getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }),
  },
  {
    label: "Last 7 days",
    getValue: () => ({ from: startOfDay(subDays(new Date(), 7)), to: endOfDay(new Date()) }),
  },
  {
    label: "Last 15 days",
    getValue: () => ({ from: startOfDay(subDays(new Date(), 15)), to: endOfDay(new Date()) }),
  },
  {
    label: "Last 3 months",
    getValue: () => ({ from: startOfDay(subMonths(new Date(), 3)), to: endOfDay(new Date()) }),
  },
  {
    label: "Last year",
    getValue: () => ({ from: startOfDay(subYears(new Date(), 1)), to: endOfDay(new Date()) }),
  },
];

interface DateRangePickerProps {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ date, onDateChange, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selecting, setSelecting] = React.useState<"from" | "to">("from");

  const handleDayClick = (day: Date) => {
    if (selecting === "from") {
      onDateChange({ from: startOfDay(day), to: undefined });
      setSelecting("to");
    } else {
      if (date?.from && day < date.from) {
        onDateChange({ from: startOfDay(day), to: undefined });
        setSelecting("to");
      } else {
        onDateChange({ from: date?.from, to: endOfDay(day) });
        setSelecting("from");
      }
    }
  };

  const handlePreset = (preset: DateRangePreset) => {
    onDateChange(preset.getValue());
    setSelecting("from");
  };

  const handleClear = () => {
    onDateChange(undefined);
    setSelecting("from");
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Filter by date...</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex" align="start">
          <div className="border-r p-3 space-y-1">
            <p className="text-sm font-medium px-2 mb-2">Select</p>
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset)}
                className="block w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                {preset.label}
              </button>
            ))}
            {date?.from && (
              <button
                onClick={handleClear}
                className="block w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground text-red-500"
              >
                Clear
              </button>
            )}
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onDayClick={handleDayClick}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
