"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { LinkedInLead } from "@/types";
import { Navbar } from "@/components/Navbar";
import { ConnectionStep } from "@/components/linkedin/ConnectionStep";
import { UploadStep } from "@/components/linkedin/UploadStep";
import { TemplateStep } from "@/components/linkedin/TemplateStep";
import { CampaignSettingsStep } from "@/components/linkedin/CampaignSettingsStep";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { AlertCircle, CheckCircle, Send } from "lucide-react";
import axios from "axios";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export default function LinkedInPage() {
  const { user } = useAuth();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [leads, setLeads] = useState<LinkedInLead[]>([]);
  const [template, setTemplate] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(90);
  const [maxLeads, setMaxLeads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const hasCheckedOAuth = useRef(false);

  // Fetch account ID via API route (bypasses RLS using service_role)
  const fetchAccountId = useCallback(
    async (sync = false): Promise<string | null> => {
      if (!user) return null;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) return null;

        const url = sync ? "/api/linkedin-accounts?sync=true" : "/api/linkedin-accounts";

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) return null;

        const data = await res.json();
        const accounts = data.accounts || [];

        const connected = accounts.find(
          (a: { status: string }) => a.status === "CREATION_SUCCESS" || a.status === "RECONNECTED",
        );

        return connected?.account_id || null;
      } catch {
        return null;
      }
    },
    [user],
  );

  // Initial load + detect OAuth redirect
  useEffect(() => {
    if (!user || hasCheckedOAuth.current) return;
    hasCheckedOAuth.current = true;

    const init = async () => {
      setLoading(true);

      const params = new URLSearchParams(window.location.search);
      const returningFromOAuth = params.get("connected") === "true";

      // Clean URL params
      if (params.has("connected")) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // If returning from OAuth, sync from Unipile API first
      const id = await fetchAccountId(returningFromOAuth);
      setAccountId(id);
      setLoading(false);
    };

    init();
  }, [user, fetchAccountId]);

  const handleSubmit = async () => {
    if (!user || !accountId || leads.length === 0 || !template || !campaignName) {
      setSubmitStatus("error");
      setSubmitMessage("Please complete all steps first");
      return;
    }

    setSubmitStatus("submitting");
    setSubmitMessage("");

    try {
      const { data: settings } = await supabase
        .from("settings")
        .select("linkedin_webhook_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!settings?.linkedin_webhook_url) {
        throw new Error("LinkedIn webhook URL not configured in Settings");
      }

      const selectedLeads = maxLeads > 0 ? leads.slice(0, maxLeads) : leads;

      await axios.post(settings.linkedin_webhook_url, {
        userId: user.id,
        linkedinAccountId: accountId,
        leads: selectedLeads,
        messageTemplate: template,
        delaySeconds,
        campaignName,
      });

      setSubmitStatus("success");
      setSubmitMessage(`Campaign submitted! ${selectedLeads.length} leads will be processed.`);

      setTimeout(() => {
        setLeads([]);
        setTemplate("");
        setCampaignName("");
        setDelaySeconds(90);
        setMaxLeads(0);
        setSubmitStatus("idle");
        setSubmitMessage("");
      }, 3000);
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(error instanceof Error ? error.message : "Failed to submit campaign");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">LinkedIn Campaign</h1>
            <p className="mt-2 text-gray-600">
              Connect your LinkedIn, upload leads and send personalized DMs
            </p>
          </div>

          {submitMessage && (
            <div
              className={`flex items-center gap-3 rounded-lg border p-4 ${
                submitStatus === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              {submitStatus === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
              {submitStatus === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
              <p className={submitStatus === "error" ? "text-red-800" : "text-green-800"}>
                {submitMessage}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <ConnectionStep accountId={accountId} onAccountIdChange={setAccountId} />

            {accountId && (
              <>
                <UploadStep leads={leads} onLeadsChange={setLeads} />

                {leads.length > 0 && (
                  <>
                    <TemplateStep
                      template={template}
                      onTemplateChange={setTemplate}
                      firstLead={leads[0]}
                    />

                    <CampaignSettingsStep
                      campaignName={campaignName}
                      onCampaignNameChange={setCampaignName}
                      delaySeconds={delaySeconds}
                      onDelayChange={setDelaySeconds}
                      maxLeads={maxLeads}
                      onMaxLeadsChange={setMaxLeads}
                      totalLeads={leads.length}
                    />

                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="pt-6">
                        <Button
                          onClick={handleSubmit}
                          disabled={submitStatus === "submitting"}
                          className="w-full gap-2"
                        >
                          {submitStatus === "submitting" ? (
                            <LoadingSpinner />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          {submitStatus === "submitting" ? "Submitting..." : "Submit Campaign"}
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
