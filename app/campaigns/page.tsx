"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Email } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { CampaignKPICards } from "@/components/campaigns/CampaignKPICards";
import { CampaignTable, groupEmailsByCampaign } from "@/components/campaigns/CampaignTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage and track all your email campaigns
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-56 pl-9"
              />
            </div>
            <DateRangePicker date={dateRangeFilter} onDateChange={setDateRangeFilter} />
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <CampaignKPICards emails={filteredEmails} totalCampaigns={totalCampaigns} />
            <CampaignTable emails={filteredEmails} searchFilter={searchFilter} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
