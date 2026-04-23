import { Email, Schedule, ScheduleType, WeekDay } from "@/types";
import { parseScheduleDateLocal } from "@/lib/scheduleDates";

export const WEEKDAY_INDEX: Record<WeekDay, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export function resolveSelectedEmails(
  emails: Email[],
  selections: Schedule["lead_selections"],
): Email[] {
  if (selections.length === 0) return [];

  const campaignBuckets = new Map<string, Email[]>();
  for (const email of emails) {
    const key = email.campaign_name || "No Campaign";
    const bucket = campaignBuckets.get(key) ?? [];
    bucket.push(email);
    campaignBuckets.set(key, bucket);
  }

  const selected = new Map<string, Email>();
  for (const selection of selections) {
    const campaignEmails = campaignBuckets.get(selection.campaignName) ?? [];
    if (selection.allLeads) {
      for (const email of campaignEmails) selected.set(email.id, email);
      continue;
    }
    const idSet = new Set(selection.leadIds);
    for (const email of campaignEmails) {
      if (idSet.has(email.id)) selected.set(email.id, email);
    }
  }

  return Array.from(selected.values());
}

export function computeNextRunAt(schedule: {
  type: ScheduleType;
  scheduled_date: string | null;
  scheduled_time: string;
  recurring_days: WeekDay[];
}): string | null {
  const [h, m] = schedule.scheduled_time.split(":");
  const hour = Number(h);
  const minute = Number(m);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  if (schedule.type === "one_time") {
    if (!schedule.scheduled_date) return null;
    const base = parseScheduleDateLocal(schedule.scheduled_date);
    if (!base || Number.isNaN(base.getTime())) return null;
    base.setHours(hour, minute, 0, 0);
    return base.toISOString();
  }

  if (schedule.recurring_days.length === 0) return null;

  const now = new Date();
  const targetDays = new Set(schedule.recurring_days.map((d) => WEEKDAY_INDEX[d]));

  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    candidate.setHours(hour, minute, 0, 0);
    if (!targetDays.has(candidate.getDay())) continue;
    if (candidate.getTime() <= now.getTime()) continue;
    return candidate.toISOString();
  }

  return null;
}

export function isFutureRun(nextRunAt: string | null): boolean {
  if (!nextRunAt) return false;
  return new Date(nextRunAt).getTime() > Date.now();
}
