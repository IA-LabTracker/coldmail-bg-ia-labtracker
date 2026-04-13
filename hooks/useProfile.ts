"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Profile, Subscription } from "@/types";
import { toast } from "sonner";

export interface UserStats {
  totalLeads: number;
  totalCampaigns: number;
  totalReplied: number;
  totalSchedules: number;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalLeads: 0,
    totalCampaigns: 0,
    totalReplied: 0,
    totalSchedules: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      const [profileRes, subRes, leadsRes, repliedRes, schedulesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("emails").select("campaign_name", { count: "exact", head: true }).eq("user_id", user.id),
        supabase
          .from("emails")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "replied"),
        supabase.from("schedules").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (subRes.data) setSubscription(subRes.data);

      // Get unique campaigns count
      const campaignsRes = await supabase
        .from("emails")
        .select("campaign_name")
        .eq("user_id", user.id)
        .not("campaign_name", "eq", "");
      const uniqueCampaigns = new Set(campaignsRes.data?.map((e) => e.campaign_name)).size;

      setStats({
        totalLeads: leadsRes.count ?? 0,
        totalCampaigns: uniqueCampaigns,
        totalReplied: repliedRes.count ?? 0,
        totalSchedules: schedulesRes.count ?? 0,
      });

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const updateProfile = useCallback(
    async (
      updates: Partial<Pick<Profile, "full_name" | "phone" | "company_name" | "avatar_url">>,
    ) => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        toast.error("Failed to update profile");
        return;
      }

      setProfile(data);
      toast.success("Profile updated");
    },
    [user],
  );

  return { profile, subscription, stats, loading, updateProfile };
}
