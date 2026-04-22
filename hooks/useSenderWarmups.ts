"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { SenderWarmup } from "@/types";

export interface WarmupSettingsInput {
  start_volume?: number;
  increment_per_day?: number;
  daily_limit?: number;
  business_days_only?: boolean;
  bounce_threshold_pct?: number | null;
  bounce_window_hours?: number;
}

// ─── Progress math ────────────────────────────────────────────────────────

export interface WarmupProgress {
  currentDay: number;      // business (or calendar) day since started_at, 1-based
  todayVolume: number;     // emails allowed today; 0 on rest days
  atTarget: boolean;       // ramped up to daily_limit
  daysToTarget: number;    // days remaining until target
  isRestDay: boolean;      // weekend and business_days_only
}

function isBusinessDay(d: Date): boolean {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

function businessDaysBetweenInclusive(from: Date, to: Date): number {
  const a = new Date(from);
  a.setHours(0, 0, 0, 0);
  const b = new Date(to);
  b.setHours(0, 0, 0, 0);
  if (a > b) return 0;
  let count = 0;
  const d = new Date(a);
  while (d <= b) {
    if (isBusinessDay(d)) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function computeWarmupProgress(w: SenderWarmup): WarmupProgress {
  if (!w.started_at) {
    return { currentDay: 0, todayVolume: 0, atTarget: false, daysToTarget: 0, isRestDay: false };
  }

  const now = new Date();
  const startedAt = new Date(w.started_at);
  const isRestDay = w.business_days_only && !isBusinessDay(now);

  const daysCounted = w.business_days_only
    ? businessDaysBetweenInclusive(startedAt, now)
    : Math.floor((now.getTime() - startedAt.getTime()) / 86_400_000) + 1;

  const currentDay = Math.max(0, daysCounted);
  const effectiveDay = Math.max(1, currentDay);
  const raw = w.start_volume + (effectiveDay - 1) * w.increment_per_day;
  const capped = Math.min(raw, w.daily_limit);
  const todayVolume = isRestDay || currentDay === 0 ? 0 : capped;

  const atTarget = raw >= w.daily_limit && !isRestDay;
  const remainingVolume = Math.max(0, w.daily_limit - raw);
  const daysToTarget = w.increment_per_day > 0 ? Math.ceil(remainingVolume / w.increment_per_day) : 0;

  return { currentDay, todayVolume, atTarget, daysToTarget, isRestDay };
}

// ─── Stats ────────────────────────────────────────────────────────────────

export interface SenderStats {
  sentToday: number;           // total envios (emails reais) hoje
  warmupSentToday: number;     // envios de warmup network hoje (email_warmup_interactions)
  sentInWindow: number;        // envios reais na janela (pro cálculo de bounce rate)
  bouncedInWindow: number;
  bounceRatePct: number;       // 0..100
}

type StatsMap = Record<string, SenderStats>;

interface EmailStatsRow {
  sender_email_id: string | null;
  status: string | null;
  date_sent: string | null;
}

interface WarmupInteractionRow {
  sender: string | null;
  interaction_type: string | null;
  created_at: string | null;
}

function emptyStats(): SenderStats {
  return {
    sentToday: 0,
    warmupSentToday: 0,
    sentInWindow: 0,
    bouncedInWindow: 0,
    bounceRatePct: 0,
  };
}

function aggregateStats(
  emailRows: EmailStatsRow[],
  interactionRows: WarmupInteractionRow[],
  emailByAddress: Map<string, string>,   // email_address (lower) → sender_email_id
  startOfToday: Date,
  windowStart: Date,
): StatsMap {
  const map: StatsMap = {};

  const bucket = (key: string) => {
    if (!map[key]) map[key] = emptyStats();
    return map[key];
  };

  for (const r of emailRows) {
    if (!r.sender_email_id || !r.date_sent) continue;
    const sent = new Date(r.date_sent);
    const b = bucket(r.sender_email_id);
    if (sent >= windowStart) {
      b.sentInWindow += 1;
      if (r.status === "bounced") b.bouncedInWindow += 1;
    }
    if (sent >= startOfToday) b.sentToday += 1;
  }

  for (const r of interactionRows) {
    if (!r.sender || !r.created_at) continue;
    if (r.interaction_type !== "sent") continue;
    const senderId = emailByAddress.get(r.sender.toLowerCase());
    if (!senderId) continue;
    const ts = new Date(r.created_at);
    if (ts >= startOfToday) bucket(senderId).warmupSentToday += 1;
  }

  for (const key of Object.keys(map)) {
    const s = map[key];
    s.bounceRatePct = s.sentInWindow > 0 ? (s.bouncedInWindow / s.sentInWindow) * 100 : 0;
  }
  return map;
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useSenderWarmups(windowHoursDefault = 24) {
  const { user } = useAuth();
  const [warmups, setWarmups] = useState<SenderWarmup[]>([]);
  const [stats, setStats] = useState<StatsMap>({});
  const [loading, setLoading] = useState(true);

  const fetchWarmups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("sender_warmups")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setWarmups((data as SenderWarmup[]) || []);
    setLoading(false);
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const maxWindow = Math.max(
      windowHoursDefault,
      ...warmups.map((w) => w.bounce_window_hours ?? windowHoursDefault),
    );
    const windowStart = new Date(now.getTime() - maxWindow * 60 * 60 * 1000);
    const since = windowStart < startOfToday ? windowStart : startOfToday;

    // Need sender_emails to map interaction.sender (email_address) → sender_email_id
    const sendersRes = await supabase
      .from("sender_emails")
      .select("id,email_address")
      .eq("user_id", user.id);

    if (sendersRes.error) {
      toast.error(sendersRes.error.message);
      return;
    }

    const emailByAddress = new Map<string, string>();
    for (const s of (sendersRes.data ?? []) as { id: string; email_address: string }[]) {
      if (s.email_address) emailByAddress.set(s.email_address.toLowerCase(), s.id);
    }
    const myAddresses = Array.from(emailByAddress.keys());

    const [emailsRes, interactionsRes] = await Promise.all([
      supabase
        .from("emails")
        .select("sender_email_id,status,date_sent")
        .eq("user_id", user.id)
        .not("sender_email_id", "is", null)
        .gte("date_sent", since.toISOString()),
      myAddresses.length > 0
        ? supabase
            .from("email_warmup_interactions")
            .select("sender,interaction_type,created_at")
            .in("sender", myAddresses)
            .eq("interaction_type", "sent")
            .gte("created_at", startOfToday.toISOString())
        : Promise.resolve({ data: [], error: null as null | Error }),
    ]);

    if (emailsRes.error) {
      toast.error(emailsRes.error.message);
      return;
    }

    setStats(
      aggregateStats(
        (emailsRes.data as EmailStatsRow[]) ?? [],
        (interactionsRes.data as WarmupInteractionRow[]) ?? [],
        emailByAddress,
        startOfToday,
        windowStart,
      ),
    );
  }, [user, warmups, windowHoursDefault]);

  useEffect(() => {
    fetchWarmups();
  }, [fetchWarmups]);

  useEffect(() => {
    if (warmups.length > 0) fetchStats();
  }, [warmups, fetchStats]);

  // ─── Mutations ────────────────────────────────────────────────────────

  const setEnabled = useCallback(
    async (senderEmailId: string, enabled: boolean) => {
      if (!user) return;
      const existing = warmups.find((w) => w.sender_email_id === senderEmailId);
      const now = new Date().toISOString();

      if (!existing) {
        const { data, error } = await supabase
          .from("sender_warmups")
          .insert({
            user_id: user.id,
            sender_email_id: senderEmailId,
            enabled,
            started_at: enabled ? now : null,
            paused_at: enabled ? null : now,
          })
          .select()
          .single();

        if (error) {
          toast.error(error.message);
          return;
        }
        setWarmups((prev) => [...prev, data as SenderWarmup]);
        toast.success(enabled ? "Warm-up ativado" : "Warm-up pausado");
        return;
      }

      const patch: Partial<SenderWarmup> = { enabled, updated_at: now };
      if (enabled) {
        patch.paused_at = null;
        patch.auto_paused_at = null;
        patch.auto_paused_reason = null;
        if (!existing.started_at) patch.started_at = now;
      } else {
        patch.paused_at = now;
      }

      const { error } = await supabase
        .from("sender_warmups")
        .update(patch)
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      setWarmups((prev) =>
        prev.map((w) => (w.id === existing.id ? ({ ...w, ...patch } as SenderWarmup) : w)),
      );
      toast.success(enabled ? "Warm-up ativado" : "Warm-up pausado");
    },
    [user, warmups],
  );

  const updateSettings = useCallback(
    async (senderEmailId: string, updates: WarmupSettingsInput) => {
      if (!user) return;
      const existing = warmups.find((w) => w.sender_email_id === senderEmailId);
      const now = new Date().toISOString();

      if (!existing) {
        const { data, error } = await supabase
          .from("sender_warmups")
          .insert({
            user_id: user.id,
            sender_email_id: senderEmailId,
            ...updates,
          })
          .select()
          .single();

        if (error) {
          toast.error(error.message);
          return;
        }
        setWarmups((prev) => [...prev, data as SenderWarmup]);
        toast.success("Warm-up configurado");
        return;
      }

      const { error } = await supabase
        .from("sender_warmups")
        .update({ ...updates, updated_at: now })
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      setWarmups((prev) =>
        prev.map((w) =>
          w.id === existing.id ? ({ ...w, ...updates, updated_at: now } as SenderWarmup) : w,
        ),
      );
      toast.success("Warm-up atualizado");
    },
    [user, warmups],
  );

  const resetProgress = useCallback(
    async (senderEmailId: string) => {
      if (!user) return;
      const existing = warmups.find((w) => w.sender_email_id === senderEmailId);
      if (!existing) return;
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("sender_warmups")
        .update({
          started_at: now,
          paused_at: null,
          auto_paused_at: null,
          auto_paused_reason: null,
          updated_at: now,
        })
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      setWarmups((prev) =>
        prev.map((w) =>
          w.id === existing.id
            ? {
                ...w,
                started_at: now,
                paused_at: null,
                auto_paused_at: null,
                auto_paused_reason: null,
                updated_at: now,
              }
            : w,
        ),
      );
      toast.success("Progresso reiniciado");
    },
    [user, warmups],
  );

  // ─── Auto-pause ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!user || warmups.length === 0 || Object.keys(stats).length === 0) return;

    for (const w of warmups) {
      if (!w.enabled) continue;
      if (w.bounce_threshold_pct == null) continue;

      const s = stats[w.sender_email_id];
      if (!s || s.sentInWindow < 10) continue; // don't trigger on tiny samples

      if (s.bounceRatePct > w.bounce_threshold_pct) {
        const reason = `Bounce ${s.bounceRatePct.toFixed(1)}% > limite ${w.bounce_threshold_pct}% (${s.sentInWindow} envios últimas ${w.bounce_window_hours}h)`;
        const now = new Date().toISOString();

        supabase
          .from("sender_warmups")
          .update({
            enabled: false,
            paused_at: now,
            auto_paused_at: now,
            auto_paused_reason: reason,
            updated_at: now,
          })
          .eq("id", w.id)
          .eq("user_id", user.id)
          .then(({ error }) => {
            if (error) return;
            setWarmups((prev) =>
              prev.map((x) =>
                x.id === w.id
                  ? {
                      ...x,
                      enabled: false,
                      paused_at: now,
                      auto_paused_at: now,
                      auto_paused_reason: reason,
                      updated_at: now,
                    }
                  : x,
              ),
            );
            toast.warning(`Warm-up pausado automaticamente: ${reason}`);
          });
      }
    }
  }, [stats, warmups, user]);

  const byId = useMemo(() => {
    const map = new Map<string, SenderWarmup>();
    for (const w of warmups) map.set(w.sender_email_id, w);
    return map;
  }, [warmups]);

  return {
    warmups,
    warmupsBySenderId: byId,
    stats,
    loading,
    setEnabled,
    updateSettings,
    resetProgress,
    refetch: fetchWarmups,
    refetchStats: fetchStats,
  };
}
