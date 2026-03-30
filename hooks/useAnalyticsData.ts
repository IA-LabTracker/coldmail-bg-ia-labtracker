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

export interface FunnelData {
  researched: number;
  sent: number;
  opened: number;
  replied: number;
  hot: number;
}

export interface OverallMetrics {
  total: number;
  replied: number;
  opened: number;
  replyRate: number;
  openRate: number;
  hotRate: number;
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

interface ParsedEmail {
  email: Email;
  date: Date | null;
  dateKey: string | null;
}

export function useAnalyticsData(emails: Email[]) {
  const now = useMemo(() => new Date(), []);
  const days30Ago = useMemo(() => startOfDay(subDays(now, 30)), [now]);
  const days60Ago = useMemo(() => startOfDay(subDays(now, 60)), [now]);
  const days90Ago = useMemo(() => startOfDay(subDays(now, 90)), [now]);

  // Single-pass: parse all dates once and build lookup structures
  const parsed = useMemo<ParsedEmail[]>(() => {
    return emails.map((email) => {
      const raw = email.date_sent || email.created_at;
      let date: Date | null = null;
      let dateKey: string | null = null;
      if (raw) {
        try {
          date = parseISO(raw);
          dateKey = format(date, "MM/dd");
        } catch {
          // skip invalid dates
        }
      }
      return { email, date, dateKey };
    });
  }, [emails]);

  // Single-pass counters: status counts, classification counts, date buckets
  const aggregated = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    const classificationCounts: Record<string, number> = {};
    const campaignMap = new Map<string, CampaignMetrics>();
    const companyMap = new Map<string, CompanyMetrics>();

    // Per-date buckets for sparklines + daily breakdown
    const dateBucketByStatus = new Map<string, Record<string, number>>();

    // Funnel + overall metrics
    let total = 0;
    let repliedCount = 0;
    let openedCount = 0;
    let sentCount = 0;
    let researchedCount = 0;
    let hotCount = 0;
    let nonResearched = 0;

    // KPI sparkline period tracking
    let last30Opened = 0, prev30Opened = 0;
    let last30Replied = 0, prev30Replied = 0;
    let last30Delivered = 0, prev30Delivered = 0;
    let last30Sent = 0, prev30Sent = 0;
    let last30Researched = 0, prev30Researched = 0;

    let hasActivityIn30Days = false;

    for (const { email, date, dateKey } of parsed) {
      const status = email.status;
      const classification = email.lead_classification;
      total++;

      // Status counts
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Classification counts
      if (classification) {
        classificationCounts[classification] = (classificationCounts[classification] || 0) + 1;
      }

      // Quick counters
      if (status === "replied") repliedCount++;
      else if (status === "opened") openedCount++;
      else if (status === "sent") sentCount++;
      else if (status === "researched") researchedCount++;

      if (status !== "researched") nonResearched++;

      if (classification === "hot") hotCount++;

      // Campaign metrics
      const campaignKey = email.campaign_name || "No Campaign";
      let cm = campaignMap.get(campaignKey);
      if (!cm) {
        cm = { campaign: campaignKey, sent: 0, replied: 0, opened: 0, hot: 0 };
        campaignMap.set(campaignKey, cm);
      }
      if (status === "sent") cm.sent++;
      else if (status === "replied") cm.replied++;
      else if (status === "opened") cm.opened++;
      if (classification === "hot") cm.hot++;

      // Company metrics
      const companyKey = email.company || "Unknown";
      let comp = companyMap.get(companyKey);
      if (!comp) {
        comp = { company: companyKey, totalEmails: 0, replied: 0, hot: 0, replyRate: 0, status: "cold" };
        companyMap.set(companyKey, comp);
      }
      comp.totalEmails++;
      if (status === "replied") comp.replied++;
      if (classification === "hot") comp.hot++;

      // Date-based aggregations
      if (date && dateKey) {
        // Check 30-day activity
        if (date >= days30Ago) hasActivityIn30Days = true;

        // Date bucket by status (for sparklines)
        let bucket = dateBucketByStatus.get(dateKey);
        if (!bucket) {
          bucket = {};
          dateBucketByStatus.set(dateKey, bucket);
        }
        bucket[status] = (bucket[status] || 0) + 1;
        if (classification) {
          bucket[`class_${classification}`] = (bucket[`class_${classification}`] || 0) + 1;
        }

        // KPI period counters
        const inLast30 = date >= days30Ago;
        const inPrev30 = date >= days60Ago && date < days30Ago;

        if (status === "opened") {
          if (inLast30) last30Opened++;
          if (inPrev30) prev30Opened++;
        }
        if (status === "replied") {
          if (inLast30) last30Replied++;
          if (inPrev30) prev30Replied++;
        }
        if (["sent", "opened", "replied"].includes(status)) {
          if (inLast30) last30Delivered++;
          if (inPrev30) prev30Delivered++;
        }
        if (status === "sent") {
          if (inLast30) last30Sent++;
          if (inPrev30) prev30Sent++;
        }
        if (status === "researched") {
          if (inLast30) last30Researched++;
          if (inPrev30) prev30Researched++;
        }
      }
    }

    // Finalize company metrics
    for (const c of Array.from(companyMap.values())) {
      c.replyRate = c.totalEmails > 0 ? Math.round((c.replied / c.totalEmails) * 100) : 0;
      c.status = c.hot > 0 ? "hot" : c.replied > 0 ? "warm" : "cold";
    }

    return {
      statusCounts,
      classificationCounts,
      campaignMap,
      companyMap,
      dateBucketByStatus,
      hasActivityIn30Days,
      total,
      repliedCount,
      openedCount,
      sentCount,
      researchedCount,
      hotCount,
      nonResearched,
      last30Opened, prev30Opened,
      last30Replied, prev30Replied,
      last30Delivered, prev30Delivered,
      last30Sent, prev30Sent,
      last30Researched, prev30Researched,
    };
  }, [parsed, days30Ago, days60Ago]);

  const { dailyBreakdown, chartPeriodDays } = useMemo(() => {
    const startDate = aggregated.hasActivityIn30Days ? days30Ago : days90Ago;
    const periodDays = aggregated.hasActivityIn30Days ? 30 : 90;

    const interval = eachDayOfInterval({ start: startDate, end: now });
    const result: DailyBreakdown[] = interval.map((day) => {
      const key = format(day, "MM/dd");
      const bucket = aggregated.dateBucketByStatus.get(key);
      return {
        date: key,
        sent: bucket?.sent || 0,
        replied: bucket?.replied || 0,
        opened: bucket?.opened || 0,
        researched: bucket?.researched || 0,
      };
    });

    return { dailyBreakdown: result, chartPeriodDays: periodDays };
  }, [aggregated, days30Ago, days90Ago, now]);

  const kpiSparklines = useMemo<KPISparkline[]>(() => {
    const interval = eachDayOfInterval({ start: days30Ago, end: now });

    function changePercent(last30: number, prev30: number): number {
      return prev30 === 0 ? (last30 > 0 ? 100 : 0) : Math.round(((last30 - prev30) / prev30) * 100);
    }

    const configs: Array<{
      label: string;
      value: number;
      last30: number;
      prev30: number;
      matchFn: (bucket: Record<string, number>) => number;
    }> = [
      {
        label: "Opened",
        value: aggregated.openedCount,
        last30: aggregated.last30Opened,
        prev30: aggregated.prev30Opened,
        matchFn: (b) => b.opened || 0,
      },
      {
        label: "Replied",
        value: aggregated.repliedCount,
        last30: aggregated.last30Replied,
        prev30: aggregated.prev30Replied,
        matchFn: (b) => b.replied || 0,
      },
      {
        label: "Delivered",
        value: aggregated.sentCount + aggregated.openedCount + aggregated.repliedCount,
        last30: aggregated.last30Delivered,
        prev30: aggregated.prev30Delivered,
        matchFn: (b) => (b.sent || 0) + (b.opened || 0) + (b.replied || 0),
      },
      {
        label: "Sent",
        value: aggregated.sentCount,
        last30: aggregated.last30Sent,
        prev30: aggregated.prev30Sent,
        matchFn: (b) => b.sent || 0,
      },
      {
        label: "Researched",
        value: aggregated.researchedCount,
        last30: aggregated.last30Researched,
        prev30: aggregated.prev30Researched,
        matchFn: (b) => b.researched || 0,
      },
    ];

    return configs.map(({ label, value, last30, prev30, matchFn }) => {
      const trend: DailyCount[] = interval.map((day) => {
        const key = format(day, "MM/dd");
        const bucket = aggregated.dateBucketByStatus.get(key) || {};
        return { date: key, count: matchFn(bucket) };
      });

      return { label, value, trend, changePercent: changePercent(last30, prev30) };
    });
  }, [aggregated, days30Ago, now]);

  const statusDistribution = useMemo<StatusDistribution[]>(() => {
    return Object.entries(aggregated.statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: STATUS_COLORS[name] || "hsl(0, 0%, 60%)",
    }));
  }, [aggregated.statusCounts]);

  const classificationDistribution = useMemo<ClassificationDistribution[]>(() => {
    return Object.entries(aggregated.classificationCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: CLASSIFICATION_COLORS[name] || "hsl(0, 0%, 60%)",
    }));
  }, [aggregated.classificationCounts]);

  const campaignMetrics = useMemo<CampaignMetrics[]>(() => {
    return Array.from(aggregated.campaignMap.values())
      .sort((a, b) => (b.sent + b.replied + b.opened) - (a.sent + a.replied + a.opened))
      .slice(0, 10);
  }, [aggregated.campaignMap]);

  const topCompanies = useMemo<CompanyMetrics[]>(() => {
    return Array.from(aggregated.companyMap.values())
      .sort((a, b) => b.totalEmails - a.totalEmails)
      .slice(0, 15);
  }, [aggregated.companyMap]);

  const overallMetrics = useMemo<OverallMetrics>(() => {
    const { total, repliedCount, openedCount, nonResearched, hotCount } = aggregated;
    const replyRate = nonResearched > 0 ? Math.round((repliedCount / nonResearched) * 100) : 0;
    const openRate = nonResearched > 0 ? Math.round((openedCount / nonResearched) * 100) : 0;
    const hotRate = total > 0 ? Math.round((hotCount / total) * 100) : 0;
    return { total, replied: repliedCount, opened: openedCount, replyRate, openRate, hotRate };
  }, [aggregated]);

  const funnelData = useMemo<FunnelData>(() => ({
    researched: aggregated.researchedCount,
    sent: aggregated.sentCount,
    opened: aggregated.openedCount,
    replied: aggregated.repliedCount,
    hot: aggregated.hotCount,
  }), [aggregated]);

  return {
    dailyBreakdown,
    chartPeriodDays,
    kpiSparklines,
    statusDistribution,
    classificationDistribution,
    campaignMetrics,
    topCompanies,
    overallMetrics,
    funnelData,
  };
}
