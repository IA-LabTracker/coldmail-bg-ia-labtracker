"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface PipelineRow {
  campaign_name: string;
  total_leads: number;
  replied: number;
  open_deals: number;
  won_deals: number;
  lost_deals: number;
  pipeline_value: number;
  closed_won_value: number;
  reply_rate: number;
  win_rate: number;
}

export interface PipelineTotals {
  pipelineValue: number;
  closedWonValue: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  avgDealSize: number;
}

export function usePipelineMetrics() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PipelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("pipeline_metrics");
    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }
    // RPC returns numerics as strings via PostgREST in some configs;
    // coerce to numbers so the UI math is safe.
    const parsed = ((data as PipelineRow[]) || []).map((r) => ({
      campaign_name: r.campaign_name,
      total_leads: Number(r.total_leads ?? 0),
      replied: Number(r.replied ?? 0),
      open_deals: Number(r.open_deals ?? 0),
      won_deals: Number(r.won_deals ?? 0),
      lost_deals: Number(r.lost_deals ?? 0),
      pipeline_value: Number(r.pipeline_value ?? 0),
      closed_won_value: Number(r.closed_won_value ?? 0),
      reply_rate: Number(r.reply_rate ?? 0),
      win_rate: Number(r.win_rate ?? 0),
    }));
    setRows(parsed);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const totals: PipelineTotals = useMemo(() => {
    let pipelineValue = 0;
    let closedWonValue = 0;
    let openDeals = 0;
    let wonDeals = 0;
    let lostDeals = 0;
    for (const r of rows) {
      pipelineValue += r.pipeline_value;
      closedWonValue += r.closed_won_value;
      openDeals += r.open_deals;
      wonDeals += r.won_deals;
      lostDeals += r.lost_deals;
    }
    const closed = wonDeals + lostDeals;
    const winRate = closed > 0 ? Math.round((wonDeals / closed) * 100) : 0;
    const avgDealSize = wonDeals > 0 ? Math.round(closedWonValue / wonDeals) : 0;
    return {
      pipelineValue,
      closedWonValue,
      openDeals,
      wonDeals,
      lostDeals,
      winRate,
      avgDealSize,
    };
  }, [rows]);

  return { rows, totals, loading, error, refetch: fetch };
}
