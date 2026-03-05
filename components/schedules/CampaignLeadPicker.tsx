"use client";

import { useMemo, useCallback } from "react";
import { ChevronDown, ChevronRight, Users, Megaphone } from "lucide-react";
import { Email, ScheduleLeadSelection } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CampaignWithLeads {
  campaignName: string;
  leads: Email[];
}

interface CampaignLeadPickerProps {
  emails: Email[];
  selections: ScheduleLeadSelection[];
  onChange: (selections: ScheduleLeadSelection[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  expandedCampaigns: Set<string>;
  onToggleExpand: (campaignName: string) => void;
}

function groupByCampaign(emails: Email[]): CampaignWithLeads[] {
  const groups = new Map<string, Email[]>();
  for (const email of emails) {
    const name = email.campaign_name || "No Campaign";
    const existing = groups.get(name);
    if (existing) {
      existing.push(email);
    } else {
      groups.set(name, [email]);
    }
  }
  return Array.from(groups.entries())
    .map(([campaignName, leads]) => ({ campaignName, leads }))
    .sort((a, b) => a.campaignName.localeCompare(b.campaignName));
}

export function CampaignLeadPicker({
  emails,
  selections,
  onChange,
  search,
  onSearchChange,
  expandedCampaigns,
  onToggleExpand,
}: CampaignLeadPickerProps) {
  const campaigns = useMemo(() => {
    const grouped = groupByCampaign(emails);
    if (!search) return grouped;
    const lower = search.toLowerCase();
    return grouped
      .map((c) => ({
        ...c,
        leads: c.leads.filter(
          (l) =>
            l.email.toLowerCase().includes(lower) ||
            (l.lead_name && l.lead_name.toLowerCase().includes(lower)) ||
            l.company.toLowerCase().includes(lower) ||
            c.campaignName.toLowerCase().includes(lower)
        ),
      }))
      .filter((c) => c.leads.length > 0);
  }, [emails, search]);

  const getSelectionForCampaign = useCallback(
    (campaignName: string): ScheduleLeadSelection | undefined =>
      selections.find((s) => s.campaignName === campaignName),
    [selections]
  );

  const isCampaignFullySelected = useCallback(
    (campaign: CampaignWithLeads): boolean => {
      const sel = getSelectionForCampaign(campaign.campaignName);
      if (!sel) return false;
      return sel.allLeads || sel.leadIds.length === campaign.leads.length;
    },
    [getSelectionForCampaign]
  );

  const isCampaignPartiallySelected = useCallback(
    (campaign: CampaignWithLeads): boolean => {
      const sel = getSelectionForCampaign(campaign.campaignName);
      if (!sel) return false;
      if (sel.allLeads) return false;
      return sel.leadIds.length > 0 && sel.leadIds.length < campaign.leads.length;
    },
    [getSelectionForCampaign]
  );

  const isLeadSelected = useCallback(
    (campaignName: string, leadId: string): boolean => {
      const sel = getSelectionForCampaign(campaignName);
      if (!sel) return false;
      return sel.allLeads || sel.leadIds.includes(leadId);
    },
    [getSelectionForCampaign]
  );

  const toggleCampaign = (campaign: CampaignWithLeads) => {
    const isSelected = isCampaignFullySelected(campaign);
    if (isSelected) {
      onChange(selections.filter((s) => s.campaignName !== campaign.campaignName));
    } else {
      const withoutCurrent = selections.filter(
        (s) => s.campaignName !== campaign.campaignName
      );
      onChange([
        ...withoutCurrent,
        {
          campaignName: campaign.campaignName,
          leadIds: campaign.leads.map((l) => l.id),
          allLeads: true,
        },
      ]);
    }
  };

  const toggleLead = (campaignName: string, leadId: string, totalLeads: number) => {
    const existing = getSelectionForCampaign(campaignName);

    if (!existing) {
      onChange([
        ...selections,
        { campaignName, leadIds: [leadId], allLeads: false },
      ]);
      return;
    }

    let newLeadIds: string[];
    if (existing.allLeads) {
      const campaign = campaigns.find((c) => c.campaignName === campaignName);
      newLeadIds = campaign
        ? campaign.leads.map((l) => l.id).filter((id) => id !== leadId)
        : [];
    } else if (existing.leadIds.includes(leadId)) {
      newLeadIds = existing.leadIds.filter((id) => id !== leadId);
    } else {
      newLeadIds = [...existing.leadIds, leadId];
    }

    if (newLeadIds.length === 0) {
      onChange(selections.filter((s) => s.campaignName !== campaignName));
      return;
    }

    const allSelected = newLeadIds.length === totalLeads;
    onChange(
      selections.map((s) =>
        s.campaignName === campaignName
          ? { ...s, leadIds: newLeadIds, allLeads: allSelected }
          : s
      )
    );
  };

  const totalSelected = useMemo(() => {
    return selections.reduce((acc, s) => {
      if (s.allLeads) {
        const campaign = campaigns.find((c) => c.campaignName === s.campaignName);
        return acc + (campaign ? campaign.leads.length : 0);
      }
      return acc + s.leadIds.length;
    }, 0);
  }, [selections, campaigns]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Campaigns & Leads
        </label>
        <span className="text-xs text-muted-foreground">
          {totalSelected} lead(s) selected
        </span>
      </div>

      <Input
        placeholder="Search campaigns or leads..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="text-sm"
      />

      <div className="max-h-[280px] overflow-y-auto rounded-md border border-border">
        {campaigns.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            No campaigns available
          </div>
        ) : (
          campaigns.map((campaign) => {
            const isExpanded = expandedCampaigns.has(campaign.campaignName);
            const isFullySelected = isCampaignFullySelected(campaign);
            const isPartial = isCampaignPartiallySelected(campaign);

            return (
              <div key={campaign.campaignName} className="border-b border-border last:border-b-0">
                <div
                  className="flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <button
                    type="button"
                    onClick={() => onToggleExpand(campaign.campaignName)}
                    className="flex-shrink-0 text-muted-foreground"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  <Checkbox
                    checked={isFullySelected}
                    ref={(el) => {
                      if (el) {
                        (el as HTMLButtonElement).dataset.partial = isPartial ? "true" : "false";
                      }
                    }}
                    className={cn(isPartial && "opacity-70")}
                    onCheckedChange={() => toggleCampaign(campaign)}
                  />

                  <Megaphone className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />

                  <button
                    type="button"
                    onClick={() => onToggleExpand(campaign.campaignName)}
                    className="flex flex-1 items-center justify-between text-left"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {campaign.campaignName}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {campaign.leads.length}
                    </span>
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/20">
                    {campaign.leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center gap-2 py-1.5 pl-12 pr-3 transition-colors hover:bg-muted/30"
                      >
                        <Checkbox
                          checked={isLeadSelected(campaign.campaignName, lead.id)}
                          onCheckedChange={() =>
                            toggleLead(campaign.campaignName, lead.id, campaign.leads.length)
                          }
                        />
                        <div className="flex flex-1 items-center justify-between min-w-0">
                          <div className="min-w-0">
                            <p className="truncate text-sm text-foreground">
                              {lead.lead_name || lead.email}
                            </p>
                            {lead.lead_name && (
                              <p className="truncate text-xs text-muted-foreground">
                                {lead.email}
                              </p>
                            )}
                          </div>
                          <span className="ml-2 flex-shrink-0 text-xs text-muted-foreground">
                            {lead.company}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
