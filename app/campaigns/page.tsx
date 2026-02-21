"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Email } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { CampaignKPICards } from "@/components/campaigns/CampaignKPICards";
import { CampaignFilters } from "@/components/campaigns/CampaignFilters";
import { CampaignTable, groupEmailsByCampaign } from "@/components/campaigns/CampaignTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export default function CampaignsPage() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);

  const fetchEmails = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("emails")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setEmails(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const filteredEmails = useMemo(() => {
    if (!dateRangeFilter?.from) return emails;
    return emails.filter((e) => {
      const createdAt = e.created_at ? new Date(e.created_at) : null;
      if (!createdAt) return false;
      if (dateRangeFilter.from && createdAt < dateRangeFilter.from) return false;
      if (dateRangeFilter.to && createdAt > dateRangeFilter.to) return false;
      return true;
    });
  }, [emails, dateRangeFilter]);

  const totalCampaigns = groupEmailsByCampaign(filteredEmails).length;

  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage and track all your email campaigns
            </p>
          </div>
          <DateRangePicker date={dateRangeFilter} onDateChange={setDateRangeFilter} />
        </div>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <CampaignKPICards emails={filteredEmails} totalCampaigns={totalCampaigns} />

            <CampaignFilters search={searchFilter} onSearchChange={setSearchFilter} />

            <CampaignTable emails={filteredEmails} searchFilter={searchFilter} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
