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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Send, Loader2, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DispatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEmails: Email[];
  senderEmails: SenderEmail[];
  onDispatchComplete: () => void;
}

type AssignmentMap = Record<string, string>;

export function DispatchDialog({
  open,
  onOpenChange,
  selectedEmails,
  senderEmails,
  onDispatchComplete,
}: DispatchDialogProps) {
  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");

  const activeSenders = useMemo(
    () => senderEmails.filter((se) => se.status === "active"),
    [senderEmails],
  );

  const leads = useMemo(() => {
    const seen = new Set<string>();
    return selectedEmails.filter((e) => {
      const key = e.email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [selectedEmails]);

  // --- Selection helpers (with shift-click range select) ---
  const lastClickedRef = useRef<number | null>(null);
  const allChecked = checked.size === leads.length && leads.length > 0;
  const someChecked = checked.size > 0 && !allChecked;

  const handleToggle = useCallback(
    (id: string, shiftKey: boolean) => {
      const currentIndex = leads.findIndex((l) => l.id === id);

      if (shiftKey && lastClickedRef.current !== null) {
        const start = Math.min(lastClickedRef.current, currentIndex);
        const end = Math.max(lastClickedRef.current, currentIndex);
        setChecked((prev) => {
          const next = new Set(prev);
          for (let i = start; i <= end; i++) {
            next.add(leads[i].id);
          }
          return next;
        });
      } else {
        setChecked((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      }

      lastClickedRef.current = currentIndex;
    },
    [leads],
  );

  const toggleAll = useCallback(() => {
    if (allChecked) {
      setChecked(new Set());
    } else {
      setChecked(new Set(leads.map((l) => l.id)));
    }
    lastClickedRef.current = null;
  }, [allChecked, leads]);

  // --- Assignment helpers ---
  const assignToChecked = useCallback(
    (senderId: string) => {
      setAssignments((prev) => {
        const next = { ...prev };
        Array.from(checked).forEach((id) => {
          next[id] = senderId;
        });
        return next;
      });
      setChecked(new Set());
    },
    [checked],
  );

  const assignAll = useCallback(
    (senderId: string) => {
      const map: AssignmentMap = {};
      for (const lead of leads) map[lead.id] = senderId;
      setAssignments(map);
      setChecked(new Set());
    },
    [leads],
  );

  const distributeRoundRobin = useCallback(() => {
    if (activeSenders.length === 0) return;
    const target = checked.size > 0 ? leads.filter((l) => checked.has(l.id)) : leads;
    setAssignments((prev) => {
      const next = { ...prev };
      target.forEach((lead, i) => {
        next[lead.id] = activeSenders[i % activeSenders.length].id;
      });
      return next;
    });
    setChecked(new Set());
  }, [activeSenders, leads, checked]);

  // --- Summary ---
  const summary = useMemo(() => {
    const groups = new Map<string, { sender: SenderEmail | null; count: number }>();
    let unassigned = 0;
    for (const lead of leads) {
      const sid = assignments[lead.id];
      if (!sid) { unassigned++; continue; }
      const g = groups.get(sid);
      if (g) { g.count++; } else {
        groups.set(sid, { sender: activeSenders.find((s) => s.id === sid) ?? null, count: 1 });
      }
    }
    return { groups, unassigned };
  }, [leads, assignments, activeSenders]);

  // --- Dispatch ---
  const handleDispatch = async () => {
    if (summary.unassigned > 0) {
      toast.error(`${summary.unassigned} lead(s) sem remetente atribuído.`);
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
        toast.error("Data/hora deve ser no futuro.");
        return;
      }
      scheduledIso = d.toISOString();
    }

    setLoading(true);
    try {
      const groupMap = new Map<string, { sender: SenderEmail; emails: Email[] }>();
      for (const lead of leads) {
        const sid = assignments[lead.id];
        if (!groupMap.has(sid)) {
          groupMap.set(sid, { sender: activeSenders.find((s) => s.id === sid)!, emails: [] });
        }
        groupMap.get(sid)!.emails.push(lead);
      }

      const dispatches = Array.from(groupMap.values()).map((g) => ({
        sender_email: {
          id: g.sender.id,
          email_address: g.sender.email_address,
          display_name: g.sender.display_name,
          domain: g.sender.domain,
          provider: g.sender.provider,
          provider_id: g.sender.provider_id,
          platform: g.sender.platform,
        },
        platform: g.sender.platform,
        emails: g.emails,
      }));

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

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setChecked(new Set());
      if (activeSenders.length === 1) {
        assignAll(activeSenders[0].id);
      } else if (activeSenders.length > 1) {
        distributeRoundRobin();
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
            Selecione leads e atribua remetentes. Use os checkboxes para atribuir vários de uma vez.
          </DialogDescription>
        </DialogHeader>

        {/* Bulk action bar — shows when leads are checked */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          {checked.size > 0 ? (
            <>
              <span className="text-xs font-semibold text-foreground">
                {checked.size} selecionado{checked.size > 1 ? "s" : ""}
              </span>
              <span className="text-xs text-muted-foreground">→ Atribuir a:</span>
              {activeSenders.map((se) => (
                <Button
                  key={se.id}
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => assignToChecked(se.id)}
                >
                  {se.email_address.split("@")[0]}
                  {se.platform && se.platform !== "none" && (
                    <PlatformIndicator platform={se.platform} />
                  )}
                </Button>
              ))}
            </>
          ) : (
            <>
              <span className="text-xs text-muted-foreground">Ações rápidas:</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={distributeRoundRobin}
                disabled={activeSenders.length === 0}
              >
                <Shuffle className="h-3 w-3" />
                Distribuir
              </Button>
              {activeSenders.map((se) => (
                <Button
                  key={se.id}
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => assignAll(se.id)}
                >
                  Todos → {se.email_address.split("@")[0]}
                </Button>
              ))}
            </>
          )}
        </div>

        {/* Lead list */}
        <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
          {/* Header row */}
          <div className="flex items-center gap-3 border-b border-border px-3 pb-2 mb-1 sticky top-0 bg-dialog z-10">
            <Checkbox
              checked={allChecked ? true : someChecked ? "indeterminate" : false}
              onCheckedChange={toggleAll}
              className="h-3.5 w-3.5"
            />
            <span className="flex-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Lead
            </span>
            <span className="w-[220px] shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Remetente
            </span>
          </div>

          <div className="space-y-0.5">
            {leads.map((lead) => {
              const assignedId = assignments[lead.id] || "";
              const isChecked = checked.has(lead.id);

              return (
                <div
                  key={lead.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                    isChecked
                      ? "border-primary/30 bg-primary/5"
                      : assignedId
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

                  <div className="w-[220px] shrink-0">
                    <Select
                      value={assignedId}
                      onValueChange={(v) =>
                        setAssignments((prev) => ({ ...prev, [lead.id]: v }))
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "h-8 text-xs",
                          !assignedId && "border-red-300 dark:border-red-800",
                        )}
                      >
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeSenders.map((se) => (
                          <SelectItem key={se.id} value={se.id} className="text-xs">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate">{se.email_address}</span>
                              {se.platform && se.platform !== "none" && (
                                <PlatformIndicator platform={se.platform} />
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                {summary.unassigned} sem remetente
              </span>
            )}
            {Array.from(summary.groups.entries()).map(([sid, g]) => {
              if (!g.sender) return null;
              return (
                <span key={sid} className="flex items-center gap-1 text-muted-foreground">
                  <span className="font-medium text-foreground">{g.count}</span>
                  → {g.sender.email_address.split("@")[0]}
                  {g.sender.platform && g.sender.platform !== "none" && (
                    <PlatformIndicator platform={g.sender.platform} />
                  )}
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
