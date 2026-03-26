"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { SearchPageHeader } from "@/components/search/SearchPageHeader";
import { SearchHowItWorks } from "@/components/search/SearchHowItWorks";
import { SearchFormCard } from "@/components/search/SearchFormCard";
import { SearchStatusBanner } from "@/components/search/SearchStatusBanner";

type SubmitStatus = "idle" | "running" | "completed" | "error";

const searchSchema = z.object({
  region: z.string().min(1, "Region is required"),
  industry: z.string().min(1, "Industry is required"),
  keywords: z.string().min(1, "Keywords are required"),
  campaignName: z.string().min(1, "Campaign name is required"),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export default function SearchPage() {
  const { user } = useAuth();
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");
  const [webhookConfigured, setWebhookConfigured] = useState<boolean | null>(null);

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { region: "", industry: "", keywords: "", campaignName: "" },
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const checkWebhook = async () => {
      const { data } = await supabase
        .from("settings")
        .select("webhook_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setWebhookConfigured(!!data?.webhook_url);
      }
    };

    checkWebhook();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const onSubmit = async (values: SearchFormValues) => {
    setSubmitStatus("running");
    setMessage("");

    try {
      if (!user) throw new Error("Not authenticated");

      const { data: settings } = await supabase
        .from("settings")
        .select("webhook_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!settings?.webhook_url) {
        throw new Error("Webhook URL not configured. Please configure it in Settings.");
      }

      const keywordsArray = values.keywords.split(",").map((k) => k.trim());

      await axios.post(settings.webhook_url, {
        region: values.region,
        industry: values.industry,
        keywords: keywordsArray,
        campaign: values.campaignName,
      });

      setSubmitStatus("completed");
      setMessage(`Campaign "${values.campaignName}" triggered successfully!`);

      setTimeout(() => {
        setSubmitStatus("idle");
        setMessage("");
        form.reset();
      }, 3000);
    } catch (error) {
      setSubmitStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to trigger campaign");
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <SearchPageHeader webhookConfigured={webhookConfigured} />
        <SearchHowItWorks />
        <SearchFormCard
          form={form}
          onSubmit={onSubmit}
          isSubmitting={submitStatus === "running"}
          disabled={webhookConfigured !== true}
        />
        <SearchStatusBanner status={submitStatus} message={message} />
      </div>
    </AppLayout>
  );
}
