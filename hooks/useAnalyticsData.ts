import { useMemo } from "react";
import { Email } from "@/types";
import {
  format,
  subDays,
  startOfDay,
  eachDayOfInterval,
  parseISO,
} from "date-fns";

export interface DailyCount {
  date: string;
  count: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  fill: string;
}

export interface ClassificationDistribution {
  name: string;
  value: number;
  fill: string;
}

export interface CampaignMetrics {
  campaign: string;
  sent: number;
  replied: number;
  opened: number;
  hot: number;
}

export interface CompanyMetrics {
  company: string;
  totalEmails: number;
  replied: number;
  hot: number;
  replyRate: number;
  status: string;
}

export interface DailyBreakdown {
  date: string;
  sent: number;
  replied: number;
  opened: number;
  researched: number;
}

export interface KPISparkline {
  label: string;
  value: number;
  trend: DailyCount[];
  changePercent: number;
}

const STATUS_COLORS: Record<string, string> = {
  sent: "hsl(258, 90%, 66%)",
  replied: "hsl(142, 71%, 45%)",
  opened: "hsl(199, 89%, 48%)",
  researched: "hsl(215, 16%, 47%)",
  bounced: "hsl(215, 14%, 70%)",
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  hot: "hsl(0, 84%, 60%)",
  warm: "hsl(38, 92%, 50%)",
  cold: "hsl(217, 91%, 60%)",
};

function getEmailDate(email: Email): Date | null {
  const raw = email.date_sent || email.created_at;
  if (!raw) return null;
  try {
    return parseISO(raw);
  } catch {
    return null;
  }
}

export function useAnalyticsData(emails: Email[]) {
  const days30Ago = useMemo(() => startOfDay(subDays(new Date(), 30)), []);
  const days60Ago = useMemo(() => startOfDay(subDays(new Date(), 60)), []);
  const days90Ago = useMemo(() => startOfDay(subDays(new Date(), 90)), []);

  const { dailyBreakdown, chartPeriodDays } = useMemo(() => {
    const has30DayActivity = emails.some((e) => {
      const d = getEmailDate(e);
      return d && d >= days30Ago;
    });

    const startDate = has30DayActivity ? days30Ago : days90Ago;
    const periodDays = has30DayActivity ? 30 : 90;

    const interval = eachDayOfInterval({ start: startDate, end: new Date() });
    const map = new Map<string, DailyBreakdown>();

    for (const day of interval) {
      const key = format(day, "MM/dd");
      map.set(key, { date: key, sent: 0, replied: 0, opened: 0, researched: 0 });
    }

    for (const email of emails) {
      const d = getEmailDate(email);
      if (!d || d < startDate) continue;
      const key = format(d, "MM/dd");
      const entry = map.get(key);
      if (!entry) continue;

      if (email.status === "sent") entry.sent++;
      else if (email.status === "replied") entry.replied++;
      else if (email.status === "opened") entry.opened++;
      else if (email.status === "researched") entry.researched++;
    }

    return { dailyBreakdown: Array.from(map.values()), chartPeriodDays: periodDays };
  }, [emails, days30Ago, days90Ago]);

  const kpiSparklines = useMemo<KPISparkline[]>(() => {
    const configs = [
      { label: "Opened", filter: (e: Email) => e.status === "opened" },
      { label: "Replied", filter: (e: Email) => e.status === "replied" },
      { label: "Delivered", filter: (e: Email) => ["sent", "opened", "replied"].includes(e.status) },
      { label: "Sent", filter: (e: Email) => e.status === "sent" },
      { label: "Researched", filter: (e: Email) => e.status === "researched" },
    ];

    return configs.map(({ label, filter }) => {
      const filtered = emails.filter(filter);
      const value = filtered.length;

      const last30 = filtered.filter((e) => {
        const d = getEmailDate(e);
        return d && d >= days30Ago;
      }).length;

      const prev30 = filtered.filter((e) => {
        const d = getEmailDate(e);
        return d && d >= days60Ago && d < days30Ago;
      }).length;

      const changePercent = prev30 === 0 ? (last30 > 0 ? 100 : 0) : Math.round(((last30 - prev30) / prev30) * 100);

      const interval = eachDayOfInterval({ start: days30Ago, end: new Date() });
      const trend: DailyCount[] = interval.map((day) => {
        const key = format(day, "MM/dd");
        const count = filtered.filter((e) => {
          const d = getEmailDate(e);
          return d && format(d, "MM/dd") === key;
        }).length;
        return { date: key, count };
      });

      return { label, value, trend, changePercent };
    });
  }, [emails, days30Ago, days60Ago]);

  const statusDistribution = useMemo<StatusDistribution[]>(() => {
    const counts: Record<string, number> = {};
    for (const email of emails) {
      counts[email.status] = (counts[email.status] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: STATUS_COLORS[name] || "hsl(0, 0%, 60%)",
    }));
  }, [emails]);

  const classificationDistribution = useMemo<ClassificationDistribution[]>(() => {
    const counts: Record<string, number> = {};
    for (const email of emails) {
      if (email.lead_classification) {
        counts[email.lead_classification] = (counts[email.lead_classification] || 0) + 1;
      }
    }
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: CLASSIFICATION_COLORS[name] || "hsl(0, 0%, 60%)",
    }));
  }, [emails]);

  const campaignMetrics = useMemo<CampaignMetrics[]>(() => {
    const map = new Map<string, CampaignMetrics>();
    for (const email of emails) {
      const key = email.campaign_name || "No Campaign";
      if (!map.has(key)) {
        map.set(key, { campaign: key, sent: 0, replied: 0, opened: 0, hot: 0 });
      }
      const m = map.get(key)!;
      if (email.status === "sent") m.sent++;
      else if (email.status === "replied") m.replied++;
      else if (email.status === "opened") m.opened++;
      if (email.lead_classification === "hot") m.hot++;
    }
    return Array.from(map.values())
      .sort((a, b) => (b.sent + b.replied + b.opened) - (a.sent + a.replied + a.opened))
      .slice(0, 10);
  }, [emails]);

  const topCompanies = useMemo<CompanyMetrics[]>(() => {
    const map = new Map<string, CompanyMetrics>();
    for (const email of emails) {
      const key = email.company || "Unknown";
      if (!map.has(key)) {
        map.set(key, {
          company: key,
          totalEmails: 0,
          replied: 0,
          hot: 0,
          replyRate: 0,
          status: "cold",
        });
      }
      const m = map.get(key)!;
      m.totalEmails++;
      if (email.status === "replied") m.replied++;
      if (email.lead_classification === "hot") m.hot++;
    }

    const companies = Array.from(map.values());
    for (const c of companies) {
      c.replyRate = c.totalEmails > 0 ? Math.round((c.replied / c.totalEmails) * 100) : 0;
      c.status = c.hot > 0 ? "hot" : c.replied > 0 ? "warm" : "cold";
    }
    return companies
      .sort((a, b) => b.totalEmails - a.totalEmails)
      .slice(0, 15);
  }, [emails]);

  const overallMetrics = useMemo(() => {
    const total = emails.length;
    const replied = emails.filter((e) => e.status === "replied").length;
    const opened = emails.filter((e) => e.status === "opened").length;
    const nonResearched = emails.filter((e) => e.status !== "researched").length;
    const replyRate = nonResearched > 0 ? Math.round((replied / nonResearched) * 100) : 0;
    const openRate = nonResearched > 0 ? Math.round((opened / nonResearched) * 100) : 0;

    return { total, replied, opened, replyRate, openRate };
  }, [emails]);

  return {
    dailyBreakdown,
    chartPeriodDays,
    kpiSparklines,
    statusDistribution,
    classificationDistribution,
    campaignMetrics,
    topCompanies,
    overallMetrics,
  };
}
