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
import { WarmupTab } from "@/components/campaigns/WarmupTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

export default function CampaignsPage() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"recent" | "emails" | "replies" | "rate">("recent");
  const [tab, setTab] = useState<"list" | "warmup">("list");

  const fetchEmails = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const PAGE_SIZE = 1000;
      const all: Email[] = [];
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const { data, error: fetchError } = await supabase
          .from("emails")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (fetchError) throw fetchError;
        const page = data ?? [];
        all.push(...page);
        if (page.length < PAGE_SIZE) break;
      }
      setEmails(all);
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
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>

            {/* Campaign list */}
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-3 w-60" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                  <div className="mt-4 flex gap-6">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton key={j} className="h-3 w-16" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "list" | "warmup")}>
            <TabsList>
              <TabsTrigger value="list">Campanhas</TabsTrigger>
              <TabsTrigger value="warmup">Warm-up</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6 space-y-6">
              <CampaignKPICards emails={filteredEmails} totalCampaigns={totalCampaigns} />
              <CampaignList
                emails={filteredEmails}
                searchFilter={searchFilter}
                sortBy={sortBy}
                onRefresh={fetchEmails}
              />
            </TabsContent>

            <TabsContent value="warmup" className="mt-6">
              <WarmupTab />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
