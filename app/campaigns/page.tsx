"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Email } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { CampaignKPICards } from "@/components/campaigns/CampaignKPICards";
import { CampaignList, groupEmailsByCampaign } from "@/components/campaigns/CampaignList";
import { CampaignPageHeader } from "@/components/campaigns/CampaignPageHeader";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

export default function CampaignsPage() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"recent" | "emails" | "replies" | "rate">("recent");

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
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <CampaignPageHeader
          totalCount={totalCampaigns}
          searchFilter={searchFilter}
          onSearchChange={setSearchFilter}
          dateRangeFilter={dateRangeFilter}
          onDateRangeChange={setDateRangeFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <CampaignKPICards emails={filteredEmails} totalCampaigns={totalCampaigns} />
            <CampaignList
              emails={filteredEmails}
              searchFilter={searchFilter}
              sortBy={sortBy}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
