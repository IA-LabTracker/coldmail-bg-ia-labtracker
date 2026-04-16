"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { Email, SenderEmail, SenderEmailPlatform } from "@/types";
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
import { Send, Loader2, Shuffle, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DispatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEmails: Email[];
  senderEmails: SenderEmail[];
  onDispatchComplete: () => void;
}

// lead ID → platform key
type PlatformAssignment = Record<string, string>;

interface PlatformGroup {
  platform: string;
  senders: SenderEmail[];
  totalDailyLimit: number;
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
  const [loading, setLoading] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");

  // Available platforms (grouped from active senders)
  const platforms = useMemo<PlatformGroup[]>(() => {
    const map = new Map<string, SenderEmail[]>();
    for (const se of senderEmails) {
      if (se.status !== "active" || !se.platform || se.platform === "none") continue;
      const list = map.get(se.platform) ?? [];
      list.push(se);
      map.set(se.platform, list);
    }
    return Array.from(map.entries())
      .map(([platform, senders]) => ({
        platform,
        senders,
        totalDailyLimit: senders.reduce((sum, s) => sum + (s.daily_limit > 0 ? s.daily_limit : 0), 0),
      }))
      .sort((a, b) => b.senders.length - a.senders.length);
  }, [senderEmails]);

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

  // --- Selection (shift-click) ---
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
    if (platforms.length === 0) return;
    const target = checked.size > 0 ? leads.filter((l) => checked.has(l.id)) : leads;
    setAssignments((prev) => {
      const next = { ...prev };
      target.forEach((lead, i) => {
        next[lead.id] = platforms[i % platforms.length].platform;
      });
      return next;
    });
    setChecked(new Set());
  }, [platforms, leads, checked]);

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
      // Group leads by platform, then build dispatches with round-robin senders
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
        const pg = platforms.find((p) => p.platform === platformKey);
        if (!pg || pg.senders.length === 0) continue;

        // Round-robin leads across senders within the platform
        const senderBuckets = new Map<string, { sender: SenderEmail; emails: Email[] }>();
        for (const s of pg.senders) {
          senderBuckets.set(s.id, { sender: s, emails: [] });
        }

        pLeads.forEach((lead, i) => {
          const sender = pg.senders[i % pg.senders.length];
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

      const platformCount = platformLeads.size;
      toast.success(
        platformCount > 1
          ? `${leads.length} leads distribuídos entre ${platformCount} plataformas`
          : `${leads.length} leads enviados via ${first.platform}`,
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
      if (platforms.length === 1) {
        assignAllToPlatform(platforms[0].platform);
      } else if (platforms.length > 1) {
        distributeAcrossPlatforms();
      } else {
        setAssignments({});
      }
      setScheduleEnabled(false);
      setScheduleAt("");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-3">
        <DialogHeader>
          <DialogTitle>Configurar disparo</DialogTitle>
          <DialogDescription>
            Atribua leads a plataformas. Os e-mails de remetente rotacionam automaticamente dentro de cada plataforma.
          </DialogDescription>
        </DialogHeader>

        {/* Platform cards — show available platforms with sender count */}
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(platforms.length, 3)}, 1fr)` }}>
          {platforms.map((pg) => {
            const assignedCount = Array.from(summary.groups.entries())
              .filter(([k]) => k === pg.platform)
              .reduce((s, [, c]) => s + c, 0);

            return (
              <div
                key={pg.platform}
                className={cn(
                  "rounded-lg border p-3 transition-colors cursor-pointer",
                  assignedCount > 0
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card hover:border-border/80",
                )}
                onClick={() => {
                  if (checked.size > 0) assignPlatformToChecked(pg.platform);
                  else assignAllToPlatform(pg.platform);
                }}
              >
                <div className="flex items-center justify-between">
                  <PlatformIndicator platform={pg.platform} size="md" />
                  {assignedCount > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                      {assignedCount}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {pg.senders.length} remetente{pg.senders.length > 1 ? "s" : ""}
                  </span>
                  {pg.totalDailyLimit > 0 && (
                    <span>{pg.totalDailyLimit}/dia</span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {pg.senders.map((se) => (
                    <span
                      key={se.id}
                      className="truncate rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      title={se.email_address}
                    >
                      {se.email_address.split("@")[0]}
                    </span>
                  ))}
                </div>
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
                disabled={platforms.length === 0}
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
          {/* Header */}
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

                  {/* Platform indicator (click to cycle) */}
                  <div className="w-[140px] shrink-0 flex justify-end">
                    {assignedPlatform ? (
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs transition-colors hover:bg-muted"
                        onClick={() => {
                          // Cycle to next platform
                          const currentIdx = platforms.findIndex((p) => p.platform === assignedPlatform);
                          const nextIdx = (currentIdx + 1) % platforms.length;
                          setAssignments((prev) => ({ ...prev, [lead.id]: platforms[nextIdx].platform }));
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
              const pg = platforms.find((p) => p.platform === platformKey);
              return (
                <span key={platformKey} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="font-medium text-foreground">{count}</span>
                  →
                  <PlatformIndicator platform={platformKey} />
                  <span className="text-muted-foreground/60">
                    ({pg?.senders.length ?? 0} email{(pg?.senders.length ?? 0) > 1 ? "s" : ""})
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={handleDispatch}
              disabled={loading || summary.unassigned > 0}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading
                ? "Enviando..."
                : `Disparar ${leads.length} lead${leads.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
