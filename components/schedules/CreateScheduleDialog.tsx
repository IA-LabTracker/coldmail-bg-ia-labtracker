"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { format } from "date-fns";
import {
  Email,
  Schedule,
  ScheduleType,
  ScheduleLeadSelection,
  SenderEmail,
  WeekDay,
} from "@/types";
import { parseScheduleDateLocal } from "@/lib/scheduleDates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DaySelector } from "./DaySelector";
import { CampaignLeadPicker } from "./CampaignLeadPicker";
import { SenderEmailSelect } from "@/components/sender-emails/SenderEmailSelect";

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emails: Email[];
  senderEmails: SenderEmail[];
  editingSchedule: Schedule | null;
  onSave: (data: Omit<Schedule, "id" | "user_id" | "created_at" | "updated_at" | "leads_sent" | "last_run_at" | "next_run_at">) => void;
}

const QUICK_DATE_OPTIONS = [
  { label: "Today", getValue: () => new Date() },
  {
    label: "Tomorrow",
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    },
  },
  {
    label: "Next Monday",
    getValue: () => {
      const d = new Date();
      const day = d.getDay();
      const diff = day === 0 ? 1 : 8 - day;
      d.setDate(d.getDate() + diff);
      return d;
    },
  },
];

export function CreateScheduleDialog({
  open,
  onOpenChange,
  emails,
  senderEmails,
  editingSchedule,
  onSave,
}: CreateScheduleDialogProps) {
  const [name, setName] = useState(editingSchedule?.name ?? "");
  const [type, setType] = useState<ScheduleType>(editingSchedule?.type ?? "one_time");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    editingSchedule?.scheduled_date
      ? parseScheduleDateLocal(editingSchedule.scheduled_date) ?? undefined
      : undefined
  );
  const [scheduledTime, setScheduledTime] = useState(editingSchedule?.scheduled_time ?? "10:00");
  const [recurringDays, setRecurringDays] = useState<WeekDay[]>(
    editingSchedule?.recurring_days ?? []
  );
  const [senderEmailId, setSenderEmailId] = useState<string | null>(
    editingSchedule?.sender_email_id ?? null
  );
  const [selections, setSelections] = useState<ScheduleLeadSelection[]>(
    editingSchedule?.lead_selections ?? []
  );
  const [leadSearch, setLeadSearch] = useState("");
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && editingSchedule) {
      setName(editingSchedule.name);
      setType(editingSchedule.type);
      setScheduledDate(
        editingSchedule.scheduled_date
          ? parseScheduleDateLocal(editingSchedule.scheduled_date) ?? undefined
          : undefined
      );
      setScheduledTime(editingSchedule.scheduled_time);
      setRecurringDays(editingSchedule.recurring_days);
      setSenderEmailId(editingSchedule.sender_email_id ?? null);
      setSelections(editingSchedule.lead_selections);
    }
  }, [open, editingSchedule]);

  const resetForm = useCallback(() => {
    setName("");
    setType("one_time");
    setScheduledDate(undefined);
    setScheduledTime("10:00");
    setRecurringDays([]);
    setSenderEmailId(null);
    setSelections([]);
    setLeadSearch("");
    setExpandedCampaigns(new Set());
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    },
    [onOpenChange, resetForm]
  );

  const handleToggleExpand = useCallback((campaignName: string) => {
    setExpandedCampaigns((prev) => {
      const next = new Set(prev);
      if (next.has(campaignName)) {
        next.delete(campaignName);
      } else {
        next.add(campaignName);
      }
      return next;
    });
  }, []);

  const totalSelectedLeads = useMemo(() => {
    return selections.reduce((acc, s) => {
      if (s.allLeads) {
        const campaign = emails.filter(
          (e) => (e.campaign_name || "No Campaign") === s.campaignName
        );
        return acc + campaign.length;
      }
      return acc + s.leadIds.length;
    }, 0);
  }, [selections, emails]);

  const isValid = useMemo(() => {
    if (!name.trim()) return false;
    if (selections.length === 0) return false;
    if (type === "one_time" && !scheduledDate) return false;
    if (type === "recurring" && recurringDays.length === 0) return false;
    return true;
  }, [name, selections, type, scheduledDate, recurringDays]);

  const handleSubmit = () => {
    if (!isValid) return;

    onSave({
      name: name.trim(),
      type,
      status: editingSchedule?.status ?? "active",
      scheduled_date:
        type === "one_time" && scheduledDate
          ? format(scheduledDate, "yyyy-MM-dd")
          : null,
      scheduled_time: scheduledTime,
      recurring_days: type === "recurring" ? recurringDays : [],
      sender_email_id: senderEmailId,
      lead_selections: selections,
      total_leads: totalSelectedLeads,
    });

    handleOpenChange(false);
  };

  const isEditing = !!editingSchedule;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Schedule" : "New Schedule"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the dispatch schedule configuration"
              : "Configure a new dispatch schedule for your leads"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="schedule-name">Schedule Name</Label>
            <Input
              id="schedule-name"
              placeholder="e.g. Weekly Campaign Dispatch"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Schedule Type</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("one_time")}
                className={cn(
                  "flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors",
                  type === "one_time"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-input bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                One-time
              </button>
              <button
                type="button"
                onClick={() => setType("recurring")}
                className={cn(
                  "flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors",
                  type === "recurring"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-input bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                Recurring
              </button>
            </div>
          </div>

          {type === "one_time" && (
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="flex flex-wrap gap-2">
                {QUICK_DATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setScheduledDate(opt.getValue())}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      scheduledDate &&
                        format(scheduledDate, "yyyy-MM-dd") ===
                          format(opt.getValue(), "yyyy-MM-dd")
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <Input
                type="date"
                value={scheduledDate ? format(scheduledDate, "yyyy-MM-dd") : ""}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => {
                  const val = e.target.value;
                  setScheduledDate(val ? new Date(val + "T00:00:00") : undefined);
                }}
              />
            </div>
          )}

          {type === "recurring" && (
            <div className="space-y-2">
              <Label>Recurring Days</Label>
              <DaySelector selectedDays={recurringDays} onChange={setRecurringDays} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Time</Label>
            <div className="flex items-center gap-2">
              <Select
                value={(() => {
                  const h = parseInt(scheduledTime.split(":")[0], 10);
                  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                  return String(h12);
                })()}
                onValueChange={(hour12) => {
                  const h = parseInt(scheduledTime.split(":")[0], 10);
                  const isPM = h >= 12;
                  const m = scheduledTime.split(":")[1];
                  const h12 = parseInt(hour12, 10);
                  let h24: number;
                  if (isPM) {
                    h24 = h12 === 12 ? 12 : h12 + 12;
                  } else {
                    h24 = h12 === 12 ? 0 : h12;
                  }
                  setScheduledTime(`${String(h24).padStart(2, "0")}:${m}`);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-sm font-medium text-muted-foreground">:</span>

              <Select
                value={scheduledTime.split(":")[1]}
                onValueChange={(minute) => {
                  const h = scheduledTime.split(":")[0];
                  setScheduledTime(`${h}:${minute}`);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["00", "15", "30", "45"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={parseInt(scheduledTime.split(":")[0], 10) >= 12 ? "PM" : "AM"}
                onValueChange={(ampm) => {
                  const h = parseInt(scheduledTime.split(":")[0], 10);
                  const m = scheduledTime.split(":")[1];
                  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                  let h24: number;
                  if (ampm === "PM") {
                    h24 = h12 === 12 ? 12 : h12 + 12;
                  } else {
                    h24 = h12 === 12 ? 0 : h12;
                  }
                  setScheduledTime(`${String(h24).padStart(2, "0")}:${m}`);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sender Email</Label>
            <SenderEmailSelect
              senderEmails={senderEmails}
              value={senderEmailId}
              onChange={setSenderEmailId}
              placeholder="Select sender email for this schedule"
            />
            {senderEmails.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No sender emails configured. Add one in the Sender Emails page.
              </p>
            )}
          </div>

          <CampaignLeadPicker
            emails={emails}
            selections={selections}
            onChange={setSelections}
            search={leadSearch}
            onSearchChange={setLeadSearch}
            expandedCampaigns={expandedCampaigns}
            onToggleExpand={handleToggleExpand}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            {isEditing ? "Save Changes" : "Create Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
