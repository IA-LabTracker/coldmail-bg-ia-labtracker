import type { DateRange } from "react-day-picker";
import type { Email } from "@/types";

export interface CampaignDetailStats {
  totalEmails: number;
  uniqueCompanies: number;
  sent: number;
  replied: number;
  bounced: number;
  opened: number;
  hotLeads: number;
  replyRate: number;
}

export function computeCampaignDetailStats(emails: Email[]): CampaignDetailStats {
  let sent = 0;
  let replied = 0;
  let bounced = 0;
  let opened = 0;
  let hotLeads = 0;
  let sentish = 0;
  const companies = new Set<string>();

  for (const e of emails) {
    if (e.company) companies.add(e.company);
    switch (e.status) {
      case "sent": sent++; break;
      case "replied": replied++; break;
      case "bounced": bounced++; break;
      case "opened": opened++; break;
    }
    if (e.status !== "researched") sentish++;
    if (e.lead_classification === "hot") hotLeads++;
  }

  return {
    totalEmails: emails.length,
    uniqueCompanies: companies.size,
    sent,
    replied,
    bounced,
    opened,
    hotLeads,
    replyRate: sentish > 0 ? Math.round((replied / sentish) * 100) : 0,
  };
}

export interface CampaignDetailFilterOpts {
  search: string;
  status: string;
  classification: string;
  clientStep: string;
  dateRange: DateRange | undefined;
}

export function filterCampaignEmails(
  emails: Email[],
  opts: CampaignDetailFilterOpts,
): Email[] {
  const lowerSearch = opts.search ? opts.search.toLowerCase() : "";
  const fromMs = opts.dateRange?.from ? opts.dateRange.from.getTime() : null;
  const toMs = opts.dateRange?.to ? opts.dateRange.to.getTime() : null;
  const { status, classification, clientStep } = opts;

  return emails.filter((e) => {
    if (status && e.status !== status) return false;
    if (classification && e.lead_classification !== classification) return false;
    if (clientStep && e.client_step !== clientStep) return false;

    if (lowerSearch) {
      const hit =
        e.company.toLowerCase().includes(lowerSearch) ||
        e.email.toLowerCase().includes(lowerSearch) ||
        (e.lead_name || "").toLowerCase().includes(lowerSearch) ||
        (e.lead_category || "").toLowerCase().includes(lowerSearch);
      if (!hit) return false;
    }

    if (fromMs != null) {
      if (!e.created_at) return false;
      const t = Date.parse(e.created_at);
      if (Number.isNaN(t)) return false;
      if (t < fromMs) return false;
      if (toMs != null && t > toMs) return false;
    }

    return true;
  });
}
