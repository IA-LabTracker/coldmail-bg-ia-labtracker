"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { Email, SenderEmail } from "@/types";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { PlatformIndicator } from "@/components/sender-emails/PlatformIndicator";
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
import { Switch } from "@/components/ui/switch";
import { Send, Loader2, Shuffle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DispatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEmails: Email[];
  senderEmails: SenderEmail[];
  onDispatchComplete: () => void;
}

type PlatformAssignment = Record<string, string>;

interface DomainGroup {
  domain: string;
  senders: SenderEmail[];
}

interface PlatformData {
  platform: string;
  senders: SenderEmail[];
  domains: DomainGroup[];
}

export function DispatchDialog({
  open,
  onOpenChange,
  selectedEmails,
  senderEmails,
  onDispatchComplete,
}: DispatchDialogProps) {
  const [assignments, setAssignments] = useState<PlatformAssignment>({});
  const [checked, setChecked] = useState<Set<string>>(new Set());
  // Set of sender IDs that are enabled for dispatch
  const [enabledSenders, setEnabledSenders] = useState<Set<string>>(new Set());
  // Which platform cards are expanded
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");

  // Build platform groups with domain sub-groups
  const platforms = useMemo<PlatformData[]>(() => {
    const map = new Map<string, SenderEmail[]>();
    for (const se of senderEmails) {
      if (se.status !== "active" || !se.platform || se.platform === "none") continue;
      const list = map.get(se.platform) ?? [];
      list.push(se);
      map.set(se.platform, list);
    }
    return Array.from(map.entries())
      .map(([platform, senders]) => {
        // Group senders by domain
        const domainMap = new Map<string, SenderEmail[]>();
        for (const s of senders) {
          const d = s.domain || s.email_address.split("@")[1] || "other";
          const list = domainMap.get(d) ?? [];
          list.push(s);
          domainMap.set(d, list);
        }
        const domains = Array.from(domainMap.entries())
          .map(([domain, ds]) => ({ domain, senders: ds }))
          .sort((a, b) => b.senders.length - a.senders.length);

        return { platform, senders, domains };
      })
      .sort((a, b) => b.senders.length - a.senders.length);
  }, [senderEmails]);

  // Enabled senders per platform (for summary & dispatch)
  const enabledByPlatform = useMemo(() => {
    const map = new Map<string, SenderEmail[]>();
    for (const pg of platforms) {
      const enabled = pg.senders.filter((s) => enabledSenders.has(s.id));
      if (enabled.length > 0) map.set(pg.platform, enabled);
    }
    return map;
  }, [platforms, enabledSenders]);

  // Deduplicated leads
  const leads = useMemo(() => {
    const seen = new Set<string>();
    return selectedEmails.filter((e) => {
      const key = e.email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [selectedEmails]);

  // --- Lead selection (shift-click) ---
  const lastClickedRef = useRef<number | null>(null);
  const allChecked = checked.size === leads.length && leads.length > 0;
  const someChecked = checked.size > 0 && !allChecked;

  const handleToggle = useCallback(
    (id: string, shiftKey: boolean) => {
      const idx = leads.findIndex((l) => l.id === id);
      if (shiftKey && lastClickedRef.current !== null) {
        const start = Math.min(lastClickedRef.current, idx);
        const end = Math.max(lastClickedRef.current, idx);
        setChecked((prev) => {
          const next = new Set(prev);
          for (let i = start; i <= end; i++) next.add(leads[i].id);
          return next;
        });
      } else {
        setChecked((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id); else next.add(id);
          return next;
        });
      }
      lastClickedRef.current = idx;
    },
    [leads],
  );

  const toggleAll = useCallback(() => {
    if (allChecked) setChecked(new Set());
    else setChecked(new Set(leads.map((l) => l.id)));
    lastClickedRef.current = null;
  }, [allChecked, leads]);

  // --- Sender enable/disable helpers ---
  const toggleSender = useCallback((id: string) => {
    setEnabledSenders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleDomain = useCallback((senders: SenderEmail[]) => {
    const ids = senders.map((s) => s.id);
    const allEnabled = ids.every((id) => enabledSenders.has(id));
    setEnabledSenders((prev) => {
      const next = new Set(prev);
      if (allEnabled) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [enabledSenders]);

  const togglePlatformSenders = useCallback((pg: PlatformData) => {
    const ids = pg.senders.map((s) => s.id);
    const allEnabled = ids.every((id) => enabledSenders.has(id));
    setEnabledSenders((prev) => {
      const next = new Set(prev);
      if (allEnabled) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [enabledSenders]);

  // --- Platform assignment helpers ---
  const assignPlatformToChecked = useCallback(
    (platform: string) => {
      setAssignments((prev) => {
        const next = { ...prev };
        Array.from(checked).forEach((id) => { next[id] = platform; });
        return next;
      });
      setChecked(new Set());
    },
    [checked],
  );

  const assignAllToPlatform = useCallback(
    (platform: string) => {
      const map: PlatformAssignment = {};
      for (const l of leads) map[l.id] = platform;
      setAssignments(map);
      setChecked(new Set());
    },
    [leads],
  );

  const distributeAcrossPlatforms = useCallback(() => {
    const availablePlatforms = platforms.filter((pg) =>
      pg.senders.some((s) => enabledSenders.has(s.id)),
    );
    if (availablePlatforms.length === 0) return;
    const target = checked.size > 0 ? leads.filter((l) => checked.has(l.id)) : leads;
    setAssignments((prev) => {
      const next = { ...prev };
      target.forEach((lead, i) => {
        next[lead.id] = availablePlatforms[i % availablePlatforms.length].platform;
      });
      return next;
    });
    setChecked(new Set());
  }, [platforms, leads, checked, enabledSenders]);

  // --- Summary ---
  const summary = useMemo(() => {
    const groups = new Map<string, number>();
    let unassigned = 0;
    for (const lead of leads) {
      const p = assignments[lead.id];
      if (!p) { unassigned++; continue; }
      groups.set(p, (groups.get(p) ?? 0) + 1);
    }
    return { groups, unassigned };
  }, [leads, assignments]);

  // --- Dispatch ---
  const handleDispatch = async () => {
    if (summary.unassigned > 0) {
      toast.error(`${summary.unassigned} lead(s) sem plataforma atribuída.`);
      return;
    }
    const missingCampaign = leads.filter((e) => !e.campaign_name?.trim());
    if (missingCampaign.length > 0) {
      toast.error(`${missingCampaign.length} lead(s) sem campanha.`);
      return;
    }
    if (!process.env.NEXT_PUBLIC_WEBHOOK_N8N) {
      toast.error("Webhook URL não configurada.");
      return;
    }

    let scheduledIso: string | null = null;
    if (scheduleEnabled) {
      if (!scheduleAt) { toast.error("Selecione data e hora."); return; }
      const d = new Date(scheduleAt);
      if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
        toast.error("Data/hora deve ser no futuro."); return;
      }
      scheduledIso = d.toISOString();
    }

    setLoading(true);
    try {
      const platformLeads = new Map<string, Email[]>();
      for (const lead of leads) {
        const p = assignments[lead.id];
        const list = platformLeads.get(p) ?? [];
        list.push(lead);
        platformLeads.set(p, list);
      }

      const dispatches: Array<{
        sender_email: Record<string, unknown>;
        platform: string;
        emails: Email[];
      }> = [];

      for (const [platformKey, pLeads] of Array.from(platformLeads.entries())) {
        // Only use ENABLED senders for this platform
        const activeSenders = enabledByPlatform.get(platformKey) ?? [];
        if (activeSenders.length === 0) continue;

        const senderBuckets = new Map<string, { sender: SenderEmail; emails: Email[] }>();
        for (const s of activeSenders) {
          senderBuckets.set(s.id, { sender: s, emails: [] });
        }

        pLeads.forEach((lead, i) => {
          const sender = activeSenders[i % activeSenders.length];
          senderBuckets.get(sender.id)!.emails.push(lead);
        });

        for (const bucket of Array.from(senderBuckets.values())) {
          if (bucket.emails.length === 0) continue;
          dispatches.push({
            sender_email: {
              id: bucket.sender.id,
              email_address: bucket.sender.email_address,
              display_name: bucket.sender.display_name,
              domain: bucket.sender.domain,
              provider: bucket.sender.provider,
              provider_id: bucket.sender.provider_id,
              platform: bucket.sender.platform,
            },
            platform: platformKey,
            emails: bucket.emails,
          });
        }
      }

      if (dispatches.length === 0) {
        toast.error("Nenhum remetente habilitado para as plataformas selecionadas.");
        setLoading(false);
        return;
      }

      const first = dispatches[0];
      await axios.post(process.env.NEXT_PUBLIC_WEBHOOK_N8N, {
        dispatches,
        total_leads: leads.length,
        emails: first.emails,
        sender_email: first.sender_email,
        platform: first.platform,
        schedule: scheduleEnabled,
        date: scheduledIso,
      });

      for (const group of dispatches) {
        const ids = group.emails.map((e) => e.id);
        await supabase
          .from("emails")
          .update({
            sender_email_id: group.sender_email.id as string,
            sender_email: group.sender_email.email_address as string,
            dispatch_platform: group.platform !== "none" ? group.platform : null,
          })
          .in("id", ids);
      }

      toast.success(
        dispatches.length > 1
          ? `${leads.length} leads distribuídos entre ${dispatches.length} remetentes`
          : `${leads.length} leads enviados via ${first.sender_email.email_address}`,
      );
      onOpenChange(false);
      onDispatchComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao disparar.");
    } finally {
      setLoading(false);
    }
  };

  // --- Reset on open ---
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setChecked(new Set());
      // Enable all senders by default
      const allIds = new Set(platforms.flatMap((pg) => pg.senders.map((s) => s.id)));
      setEnabledSenders(allIds);
      // Expand all platforms
      setExpandedPlatforms(new Set(platforms.map((pg) => pg.platform)));
      // Auto-assign
      if (platforms.length === 1) {
        assignAllToPlatform(platforms[0].platform);
      } else if (platforms.length > 1) {
        // Distribute round-robin
        const map: PlatformAssignment = {};
        leads.forEach((lead, i) => {
          map[lead.id] = platforms[i % platforms.length].platform;
        });
        setAssignments(map);
      } else {
        setAssignments({});
      }
      setScheduleEnabled(false);
      setScheduleAt("");
    }
    onOpenChange(v);
  };

  const toggleExpanded = useCallback((platform: string) => {
    setExpandedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform); else next.add(platform);
      return next;
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-3">
        <DialogHeader>
          <DialogTitle>Configurar disparo</DialogTitle>
          <DialogDescription>
            Escolha quais remetentes usar em cada plataforma, depois atribua os leads.
          </DialogDescription>
        </DialogHeader>

        {/* Platform cards with sender selection */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {platforms.map((pg) => {
            const enabledCount = pg.senders.filter((s) => enabledSenders.has(s.id)).length;
            const allEnabled = enabledCount === pg.senders.length;
            const someEnabled = enabledCount > 0 && !allEnabled;
            const isExpanded = expandedPlatforms.has(pg.platform);
            const assignedCount = summary.groups.get(pg.platform) ?? 0;
            const enabledLimit = pg.senders
              .filter((s) => enabledSenders.has(s.id))
              .reduce((sum, s) => sum + (s.daily_limit > 0 ? s.daily_limit : 0), 0);

            return (
              <div key={pg.platform} className="rounded-lg border border-border overflow-hidden">
                {/* Platform header */}
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors",
                    assignedCount > 0 ? "bg-primary/5" : "bg-card hover:bg-muted/30",
                  )}
                  onClick={() => toggleExpanded(pg.platform)}
                >
                  <Checkbox
                    checked={allEnabled ? true : someEnabled ? "indeterminate" : false}
                    onCheckedChange={() => togglePlatformSenders(pg)}
                    className="h-3.5 w-3.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <PlatformIndicator platform={pg.platform} size="md" />
                  <span className="text-[11px] text-muted-foreground">
                    {enabledCount}/{pg.senders.length} emails
                  </span>
                  {enabledLimit > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      · {enabledLimit}/dia
                    </span>
                  )}
                  {assignedCount > 0 && (
                    <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                      {assignedCount} leads
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180",
                      assignedCount > 0 && "ml-0",
                      assignedCount === 0 && "ml-auto",
                    )}
                  />
                </div>

                {/* Expanded: senders grouped by domain */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/10 px-3 py-2 space-y-2">
                    {pg.domains.map((dg) => {
                      const domainAllEnabled = dg.senders.every((s) => enabledSenders.has(s.id));
                      const domainSomeEnabled = !domainAllEnabled && dg.senders.some((s) => enabledSenders.has(s.id));

                      return (
                        <div key={dg.domain}>
                          {/* Domain header */}
                          <div
                            className="flex items-center gap-2 cursor-pointer mb-1"
                            onClick={() => toggleDomain(dg.senders)}
                          >
                            <Checkbox
                              checked={domainAllEnabled ? true : domainSomeEnabled ? "indeterminate" : false}
                              onCheckedChange={() => toggleDomain(dg.senders)}
                              className="h-3 w-3"
                            />
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              @{dg.domain}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                              {dg.senders.filter((s) => enabledSenders.has(s.id)).length}/{dg.senders.length}
                            </span>
                          </div>

                          {/* Sender emails */}
                          <div className="flex flex-wrap gap-1 pl-5">
                            {dg.senders.map((se) => {
                              const isOn = enabledSenders.has(se.id);
                              return (
                                <button
                                  key={se.id}
                                  type="button"
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[11px] transition-colors border",
                                    isOn
                                      ? "border-primary/30 bg-primary/10 text-foreground"
                                      : "border-transparent bg-muted/50 text-muted-foreground/50 line-through",
                                  )}
                                  onClick={() => toggleSender(se.id)}
                                  title={`${se.email_address}${se.daily_limit > 0 ? ` · ${se.daily_limit}/dia` : ""}`}
                                >
                                  {se.email_address.split("@")[0]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          {checked.size > 0 ? (
            <>
              <span className="text-xs font-semibold text-foreground">
                {checked.size} selecionado{checked.size > 1 ? "s" : ""}
              </span>
              <span className="text-xs text-muted-foreground">→</span>
              {platforms.map((pg) => (
                <Button
                  key={pg.platform}
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => assignPlatformToChecked(pg.platform)}
                  disabled={!enabledByPlatform.has(pg.platform)}
                >
                  <PlatformIndicator platform={pg.platform} />
                </Button>
              ))}
            </>
          ) : (
            <>
              <span className="text-xs text-muted-foreground">Ações:</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={distributeAcrossPlatforms}
                disabled={enabledByPlatform.size === 0}
              >
                <Shuffle className="h-3 w-3" />
                Distribuir
              </Button>
              {platforms.map((pg) => (
                <Button
                  key={pg.platform}
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => assignAllToPlatform(pg.platform)}
                  disabled={!enabledByPlatform.has(pg.platform)}
                >
                  Todos →
                  <PlatformIndicator platform={pg.platform} />
                </Button>
              ))}
            </>
          )}
        </div>

        {/* Lead list */}
        <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
          <div className="flex items-center gap-3 border-b border-border px-3 pb-2 mb-1 sticky top-0 bg-dialog z-10">
            <Checkbox
              checked={allChecked ? true : someChecked ? "indeterminate" : false}
              onCheckedChange={toggleAll}
              className="h-3.5 w-3.5"
            />
            <span className="flex-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Lead
            </span>
            <span className="w-[140px] shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground text-right">
              Plataforma
            </span>
          </div>

          <div className="space-y-0.5">
            {leads.map((lead) => {
              const assignedPlatform = assignments[lead.id] || "";
              const isChecked = checked.has(lead.id);

              return (
                <div
                  key={lead.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                    isChecked
                      ? "border-primary/30 bg-primary/5"
                      : assignedPlatform
                        ? "border-transparent hover:border-border"
                        : "border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20",
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleToggle(lead.id, false)}
                    className="h-3.5 w-3.5"
                  />
                  <div
                    className="min-w-0 flex-1 cursor-pointer select-none"
                    onClick={(e) => handleToggle(lead.id, e.shiftKey)}
                  >
                    <p className="truncate text-sm font-medium text-foreground">
                      {lead.lead_name || lead.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {lead.email}
                      {lead.company && <span className="text-border"> · </span>}
                      {lead.company}
                      {lead.campaign_name && <span className="text-border"> · </span>}
                      {lead.campaign_name && (
                        <span className="text-muted-foreground/60">{lead.campaign_name}</span>
                      )}
                    </p>
                  </div>
                  <div className="w-[140px] shrink-0 flex justify-end">
                    {assignedPlatform ? (
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs transition-colors hover:bg-muted"
                        onClick={() => {
                          const available = platforms.filter((p) => enabledByPlatform.has(p.platform));
                          if (available.length === 0) return;
                          const idx = available.findIndex((p) => p.platform === assignedPlatform);
                          const next = available[(idx + 1) % available.length].platform;
                          setAssignments((prev) => ({ ...prev, [lead.id]: next }));
                        }}
                      >
                        <PlatformIndicator platform={assignedPlatform} />
                      </button>
                    ) : (
                      <span className="text-[11px] text-red-400">Sem plataforma</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="font-medium text-foreground">
              {leads.length} lead{leads.length > 1 ? "s" : ""}
            </span>
            {summary.unassigned > 0 && (
              <span className="text-red-500 font-medium">
                {summary.unassigned} sem plataforma
              </span>
            )}
            {Array.from(summary.groups.entries()).map(([platformKey, count]) => {
              const enabled = enabledByPlatform.get(platformKey) ?? [];
              return (
                <span key={platformKey} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="font-medium text-foreground">{count}</span>
                  →
                  <PlatformIndicator platform={platformKey} />
                  <span className="text-muted-foreground/60">
                    ({enabled.length} email{enabled.length > 1 ? "s" : ""})
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter>
          <div className="flex items-center gap-3">
            <Switch
              checked={scheduleEnabled}
              onCheckedChange={(v) => {
                setScheduleEnabled(v);
                if (v && !scheduleAt) {
                  const later = new Date(Date.now() + 10 * 60 * 1000);
                  const local = new Date(later.getTime() - later.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16);
                  setScheduleAt(local);
                }
              }}
              disabled={loading}
            />
            <span className="text-xs font-medium text-foreground">Agendar</span>
            {scheduleEnabled && (
              <Input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                disabled={loading}
                className="h-8 w-[200px] text-xs"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={handleDispatch}
              disabled={loading || summary.unassigned > 0 || enabledByPlatform.size === 0}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? "Enviando..." : `Disparar ${leads.length} lead${leads.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
