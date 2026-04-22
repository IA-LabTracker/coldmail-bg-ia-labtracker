"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { CampaignWarmup } from "@/types";

export interface WarmupSettingsInput {
  start_volume?: number;
  increment_per_day?: number;
  daily_limit?: number;
}

export function useWarmups() {
  const { user } = useAuth();
  const [warmups, setWarmups] = useState<CampaignWarmup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWarmups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("campaign_warmups")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setWarmups((data as CampaignWarmup[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWarmups();
  }, [fetchWarmups]);

  const setEnabled = useCallback(
    async (campaignName: string, enabled: boolean) => {
      if (!user) return;

      const existing = warmups.find((w) => w.campaign_name === campaignName);
      const now = new Date().toISOString();

      if (!existing) {
        const { data, error } = await supabase
          .from("campaign_warmups")
          .insert({
            user_id: user.id,
            campaign_name: campaignName,
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
        setWarmups((prev) => [...prev, data as CampaignWarmup]);
        toast.success(enabled ? "Warm-up ativado" : "Warm-up pausado");
        return;
      }

      const patch: Partial<CampaignWarmup> = {
        enabled,
        updated_at: now,
      };

      if (enabled) {
        patch.paused_at = null;
        if (!existing.started_at) patch.started_at = now;
      } else {
        patch.paused_at = now;
      }

      const { error } = await supabase
        .from("campaign_warmups")
        .update(patch)
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      setWarmups((prev) =>
        prev.map((w) => (w.id === existing.id ? { ...w, ...patch } as CampaignWarmup : w)),
      );
      toast.success(enabled ? "Warm-up ativado" : "Warm-up pausado");
    },
    [user, warmups],
  );

  const updateSettings = useCallback(
    async (campaignName: string, updates: WarmupSettingsInput) => {
      if (!user) return;

      const existing = warmups.find((w) => w.campaign_name === campaignName);
      const now = new Date().toISOString();

      if (!existing) {
        const { data, error } = await supabase
          .from("campaign_warmups")
          .insert({
            user_id: user.id,
            campaign_name: campaignName,
            ...updates,
          })
          .select()
          .single();

        if (error) {
          toast.error(error.message);
          return;
        }
        setWarmups((prev) => [...prev, data as CampaignWarmup]);
        toast.success("Warm-up configurado");
        return;
      }

      const { error } = await supabase
        .from("campaign_warmups")
        .update({ ...updates, updated_at: now })
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      setWarmups((prev) =>
        prev.map((w) =>
          w.id === existing.id ? ({ ...w, ...updates, updated_at: now } as CampaignWarmup) : w,
        ),
      );
      toast.success("Warm-up atualizado");
    },
    [user, warmups],
  );

  const resetProgress = useCallback(
    async (campaignName: string) => {
      if (!user) return;
      const existing = warmups.find((w) => w.campaign_name === campaignName);
      if (!existing) return;

      const now = new Date().toISOString();
      const { error } = await supabase
        .from("campaign_warmups")
        .update({ started_at: now, paused_at: null, updated_at: now })
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      setWarmups((prev) =>
        prev.map((w) =>
          w.id === existing.id ? { ...w, started_at: now, paused_at: null, updated_at: now } : w,
        ),
      );
      toast.success("Progresso reiniciado");
    },
    [user, warmups],
  );

  return {
    warmups,
    loading,
    setEnabled,
    updateSettings,
    resetProgress,
    refetch: fetchWarmups,
  };
}

// Warm-up math — given a warmup record, how far along are we?
export interface WarmupProgress {
  currentDay: number;     // 1-based day count since started_at
  todayVolume: number;    // emails allowed today
  atTarget: boolean;      // ramped up all the way
  daysToTarget: number;   // days remaining until target
}

export function computeWarmupProgress(w: CampaignWarmup): WarmupProgress {
  if (!w.started_at) {
    return { currentDay: 0, todayVolume: 0, atTarget: false, daysToTarget: 0 };
  }

  const startedMs = new Date(w.started_at).getTime();
  const nowMs = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const daysSince = Math.max(0, Math.floor((nowMs - startedMs) / dayMs));
  const currentDay = daysSince + 1;

  const raw = w.start_volume + daysSince * w.increment_per_day;
  const todayVolume = Math.min(raw, w.daily_limit);
  const atTarget = todayVolume >= w.daily_limit;

  const remainingVolume = Math.max(0, w.daily_limit - raw);
  const daysToTarget =
    w.increment_per_day > 0 ? Math.ceil(remainingVolume / w.increment_per_day) : 0;

  return { currentDay, todayVolume, atTarget, daysToTarget };
}
