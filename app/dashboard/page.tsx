"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Email } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TableProperties } from "lucide-react";
import dynamic from "next/dynamic";

const AnalyticsDashboard = dynamic(
  () =>
    import("@/components/analytics/AnalyticsDashboard").then((m) => ({
      default: m.AnalyticsDashboard,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[40rem] w-full rounded-xl" />,
  },
);

const EmailManagerTab = dynamic(
  () =>
    import("@/components/dashboard/EmailManagerTab").then((m) => ({
      default: m.EmailManagerTab,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[40rem] w-full rounded-xl" />,
  },
);

const DASHBOARD_TAB_KEY = "coldmail:dashboard-tab";

export default function DashboardPage() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(DASHBOARD_TAB_KEY) || "analytics";
    }
    return "analytics";
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem(DASHBOARD_TAB_KEY, value);
  };

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
      setError(err instanceof Error ? err.message : "Failed to load emails");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-section flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        </div>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <div className="space-y-6">
            {/* Tabs skeleton */}
            <Skeleton className="h-10 w-80 max-w-md" />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border/50 bg-card">
                  <div className="px-4 pt-3.5">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-7 w-7 rounded-lg" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="px-4 pt-2">
                    <Skeleton className="h-7 w-14" />
                  </div>
                  <div className="px-1 pt-2 pb-0.5">
                    <Skeleton className="h-8 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>

            {/* Charts bento grid */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-4 space-y-4">
                <Skeleton className="h-52 w-full rounded-xl" />
                <Skeleton className="h-56 w-full rounded-xl" />
              </div>
              <div className="col-span-12 lg:col-span-8">
                <Skeleton className="h-[27.5rem] w-full rounded-xl" />
              </div>
            </div>

            {/* Bottom charts */}
            <div className="grid grid-cols-12 gap-4">
              <Skeleton className="col-span-12 md:col-span-6 lg:col-span-3 h-60 rounded-xl" />
              <Skeleton className="col-span-12 md:col-span-6 lg:col-span-3 h-60 rounded-xl" />
              <Skeleton className="col-span-12 lg:col-span-6 h-60 rounded-xl" />
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="animate-section w-full" style={{ animationDelay: "100ms" }}>
            <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="manager" className="gap-2">
                <TableProperties className="h-4 w-4" />
                Email Manager
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics">
              <AnalyticsDashboard emails={emails} />
            </TabsContent>

            <TabsContent value="manager">
              <EmailManagerTab
                emails={emails}
                setEmails={setEmails}
                fetchEmails={fetchEmails}
                setError={setError}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
