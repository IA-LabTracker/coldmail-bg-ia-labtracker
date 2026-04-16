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
  bounced: number;
}

export interface KPISparkline {
  label: string;
  value: number;
  allTime: number;
  trend: DailyCount[];
  changePercent: number;
  /** true = increase is good (sent, opened, replied). false = decrease is good (bounced). */
  positiveIsGood: boolean;
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
  sent: number;
  replyRate: number;
  openRate: number;
  hotRate: number;
}

const STATUS_COLORS: Record<string, string> = {
  sent: "hsl(258, 90%, 66%)",
  replied: "hsl(142, 71%, 45%)",
  opened: "hsl(199, 89%, 48%)",
  researched: "hsl(215, 16%, 47%)",
  bounced: "hsl(0, 70%, 55%)",
  scheduled: "hsl(38, 92%, 50%)",
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

/**
 * Determines if an email was "dispatched" (sent, opened, replied, or bounced).
 * An email that was opened or replied to was necessarily also sent first.
 */
function wasDispatched(status: string): boolean {
  return status === "sent" || status === "opened" || status === "replied" || status === "bounced";
}

export function useAnalyticsData(emails: Email[]) {
  const now = useMemo(() => new Date(), []);
  const days30Ago = useMemo(() => startOfDay(subDays(now, 30)), [now]);
  const days60Ago = useMemo(() => startOfDay(subDays(now, 60)), [now]);
  const days90Ago = useMemo(() => startOfDay(subDays(now, 90)), [now]);

  // Parse dates once
  const parsed = useMemo<ParsedEmail[]>(() => {
    return emails.map((email) => {
      // date_sent can be null at runtime despite type saying string
      const raw = (email.date_sent as string | null) || email.created_at;
      let date: Date | null = null;
      let dateKey: string | null = null;
      if (raw) {
        try {
          date = parseISO(raw);
          if (Number.isNaN(date.getTime())) {
            date = null;
          } else {
            dateKey = format(date, "MM/dd");
          }
        } catch {
          // skip invalid dates
        }
      }
      return { email, date, dateKey };
    });
  }, [emails]);

  // Single-pass aggregation
  const aggregated = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    const classificationCounts: Record<string, number> = {};
    const campaignMap = new Map<string, CampaignMetrics>();
    const companyMap = new Map<string, CompanyMetrics>();
    const dateBucketByStatus = new Map<string, Record<string, number>>();

    let total = 0;

    // Raw status counts (exact match)
    let rawSent = 0;
    let rawOpened = 0;
    let rawReplied = 0;
    let rawBounced = 0;
    let rawResearched = 0;

    // Cumulative/funnel counts
    // "totalDispatched" = all emails that were actually sent out (sent + opened + replied + bounced)
    // "totalOpened" = opened + replied (if you replied, you also opened it)
    let totalDispatched = 0;
    let totalOpened = 0;
    let totalReplied = 0;
    let hotCount = 0;

    // KPI period counters (last 30 days vs previous 30 days)
    let last30Dispatched = 0, prev30Dispatched = 0;
    let last30Opened = 0, prev30Opened = 0;
    let last30Replied = 0, prev30Replied = 0;
    let last30Researched = 0, prev30Researched = 0;
    let last30Bounced = 0, prev30Bounced = 0;

    let hasActivityIn30Days = false;

    for (const { email, date, dateKey } of parsed) {
      const status = email.status;
      const classification = email.lead_classification;
      total++;

      // Raw status counts
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (status === "sent") rawSent++;
      else if (status === "opened") rawOpened++;
      else if (status === "replied") rawReplied++;
      else if (status === "bounced") rawBounced++;
      else if (status === "researched") rawResearched++;

      // Cumulative funnel counts
      if (wasDispatched(status)) totalDispatched++;
      if (status === "opened" || status === "replied") totalOpened++;
      if (status === "replied") totalReplied++;

      // Classification
      if (classification) {
        classificationCounts[classification] = (classificationCounts[classification] || 0) + 1;
      }
      if (classification === "hot") hotCount++;

      // Campaign metrics (cumulative)
      const campaignKey = email.campaign_name || "No Campaign";
      let cm = campaignMap.get(campaignKey);
      if (!cm) {
        cm = { campaign: campaignKey, sent: 0, replied: 0, opened: 0, hot: 0 };
        campaignMap.set(campaignKey, cm);
      }
      if (wasDispatched(status)) cm.sent++;
      if (status === "opened" || status === "replied") cm.opened++;
      if (status === "replied") cm.replied++;
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
        if (date >= days30Ago) hasActivityIn30Days = true;

        let bucket = dateBucketByStatus.get(dateKey);
        if (!bucket) {
          bucket = {};
          dateBucketByStatus.set(dateKey, bucket);
        }
        // Store raw status in bucket for chart breakdown
        bucket[status] = (bucket[status] || 0) + 1;
        // Also store cumulative keys for sparklines
        if (wasDispatched(status)) bucket._dispatched = (bucket._dispatched || 0) + 1;
        if (status === "opened" || status === "replied") bucket._opened = (bucket._opened || 0) + 1;
        if (status === "replied") bucket._replied = (bucket._replied || 0) + 1;

        // Period counters for KPI trend comparison
        const inLast30 = date >= days30Ago;
        const inPrev30 = date >= days60Ago && date < days30Ago;

        if (wasDispatched(status)) {
          if (inLast30) last30Dispatched++;
          if (inPrev30) prev30Dispatched++;
        }
        if (status === "opened" || status === "replied") {
          if (inLast30) last30Opened++;
          if (inPrev30) prev30Opened++;
        }
        if (status === "replied") {
          if (inLast30) last30Replied++;
          if (inPrev30) prev30Replied++;
        }
        if (status === "researched") {
          if (inLast30) last30Researched++;
          if (inPrev30) prev30Researched++;
        }
        if (status === "bounced") {
          if (inLast30) last30Bounced++;
          if (inPrev30) prev30Bounced++;
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
      rawSent, rawOpened, rawReplied, rawBounced, rawResearched,
      totalDispatched, totalOpened, totalReplied,
      hotCount,
      last30Dispatched, prev30Dispatched,
      last30Opened, prev30Opened,
      last30Replied, prev30Replied,
      last30Researched, prev30Researched,
      last30Bounced, prev30Bounced,
    };
  }, [parsed, days30Ago, days60Ago]);

  // Daily breakdown for area chart
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
        bounced: bucket?.bounced || 0,
      };
    });

    return { dailyBreakdown: result, chartPeriodDays: periodDays };
  }, [aggregated, days30Ago, days90Ago, now]);

  // KPI sparklines — rate-based comparison for volume-dependent metrics
  //
  // Logic per KPI:
  //   Enviados:     absolute volume, more = good. Compare count vs count.
  //   Abertos:      rate-based. Compare (opened/dispatched) this period vs last period.
  //   Respondidos:  rate-based. Compare (replied/dispatched) this period vs last period.
  //   Pesquisados:  absolute volume, more = good. Compare count vs count.
  //   Bounced:      rate-based, INVERTED. Compare (bounced/dispatched) — lower is good.
  //
  const kpiSparklines = useMemo<KPISparkline[]>(() => {
    const interval = eachDayOfInterval({ start: days30Ago, end: now });

    // Rate change: compares rates (metric/base) between two periods
    // Returns % change of the rate itself, e.g. rate went from 2% to 5% → +150%
    function rateChange(
      lastMetric: number, lastBase: number,
      prevMetric: number, prevBase: number,
    ): number {
      const lastRate = lastBase > 0 ? lastMetric / lastBase : 0;
      const prevRate = prevBase > 0 ? prevMetric / prevBase : 0;
      if (prevRate === 0) return lastRate > 0 ? 100 : 0;
      return Math.round(((lastRate - prevRate) / prevRate) * 100);
    }

    // Simple absolute change
    function absChange(last30: number, prev30: number): number {
      return prev30 === 0 ? (last30 > 0 ? 100 : 0) : Math.round(((last30 - prev30) / prev30) * 100);
    }

    const l30d = aggregated.last30Dispatched;
    const p30d = aggregated.prev30Dispatched;

    const configs: Array<{
      label: string;
      value: number;
      allTime: number;
      changePercent: number;
      positiveIsGood: boolean;
      matchFn: (bucket: Record<string, number>) => number;
    }> = [
      {
        label: "Enviados",
        value: aggregated.last30Dispatched,
        allTime: aggregated.totalDispatched,
        changePercent: absChange(aggregated.last30Dispatched, aggregated.prev30Dispatched),
        positiveIsGood: true,
        matchFn: (b) => b._dispatched || 0,
      },
      {
        label: "Abertos",
        value: aggregated.last30Opened,
        allTime: aggregated.totalOpened,
        // Compare open RATE: (opened/dispatched) this period vs last
        changePercent: rateChange(aggregated.last30Opened, l30d, aggregated.prev30Opened, p30d),
        positiveIsGood: true,
        matchFn: (b) => b._opened || 0,
      },
      {
        label: "Respondidos",
        value: aggregated.last30Replied,
        allTime: aggregated.totalReplied,
        // Compare reply RATE: (replied/dispatched) this period vs last
        changePercent: rateChange(aggregated.last30Replied, l30d, aggregated.prev30Replied, p30d),
        positiveIsGood: true,
        matchFn: (b) => b._replied || 0,
      },
      {
        label: "Pesquisados",
        value: aggregated.last30Researched,
        allTime: aggregated.rawResearched,
        changePercent: absChange(aggregated.last30Researched, aggregated.prev30Researched),
        positiveIsGood: true,
        matchFn: (b) => b.researched || 0,
      },
      {
        label: "Bounced",
        value: aggregated.last30Bounced,
        allTime: aggregated.rawBounced,
        // Compare bounce RATE: (bounced/dispatched) — but INVERTED: lower rate is good
        changePercent: rateChange(aggregated.last30Bounced, l30d, aggregated.prev30Bounced, p30d),
        positiveIsGood: false, // decrease in bounce rate = good
        matchFn: (b) => b.bounced || 0,
      },
    ];

    return configs.map(({ label, value, allTime, changePercent, positiveIsGood, matchFn }) => {
      const trend: DailyCount[] = interval.map((day) => {
        const key = format(day, "MM/dd");
        const bucket = aggregated.dateBucketByStatus.get(key) || {};
        return { date: key, count: matchFn(bucket) };
      });

      return { label, value, allTime, trend, changePercent, positiveIsGood };
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
    const { totalDispatched, totalOpened, totalReplied, total, hotCount } = aggregated;
    // Reply rate = replied / dispatched (sent emails that got a reply)
    const replyRate = totalDispatched > 0 ? Math.round((totalReplied / totalDispatched) * 100) : 0;
    // Open rate = opened / dispatched
    const openRate = totalDispatched > 0 ? Math.round((totalOpened / totalDispatched) * 100) : 0;
    const hotRate = total > 0 ? Math.round((hotCount / total) * 100) : 0;
    return { total, replied: totalReplied, opened: totalOpened, sent: totalDispatched, replyRate, openRate, hotRate };
  }, [aggregated]);

  // Funnel: cumulative — each step includes the ones that progressed further
  const funnelData = useMemo<FunnelData>(() => ({
    researched: aggregated.rawResearched,
    sent: aggregated.totalDispatched,
    opened: aggregated.totalOpened,
    replied: aggregated.totalReplied,
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
