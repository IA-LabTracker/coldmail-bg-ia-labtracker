"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Settings } from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ConnectionStep } from "@/components/linkedin/ConnectionStep";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type FeedbackMessage = { type: "success" | "error"; text: string } | null;

const settingsSchema = z.object({
  webhookUrl: z.string().url("Enter a valid URL").or(z.literal("")),
  emailTemplate: z.string().optional(),
  linkedinWebhookUrl: z.string().url("Enter a valid URL").or(z.literal("")),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const TEMPLATE_VARIABLES = [
  "{{company}}",
  "{{email}}",
  "{{region}}",
  "{{industry}}",
];

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="shrink-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${
        active
          ? "bg-green-500 dark:bg-green-400"
          : "bg-gray-300 dark:bg-gray-600"
      }`}
    />
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackMessage>(null);
  const [linkedinAccountId, setLinkedinAccountId] = useState<string | null>(
    null,
  );
  const hasCheckedOAuth = useRef(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { webhookUrl: "", emailTemplate: "", linkedinWebhookUrl: "" },
  });

  const webhookUrl = form.watch("webhookUrl");
  const linkedinWebhookUrl = form.watch("linkedinWebhookUrl");

  const fetchLinkedInAccount = useCallback(
    async (sync = false): Promise<string | null> => {
      if (!user) return null;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) return null;

        const url = sync
          ? "/api/linkedin-accounts?sync=true"
          : "/api/linkedin-accounts";

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) return null;

        const data = await res.json();
        const accounts = data.accounts || [];
        const connected = accounts.find(
          (a: { is_active: boolean }) => a.is_active,
        );

        return connected?.account_id || null;
      } catch {
        return null;
      }
    },
    [user],
  );

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSettings(data);
          form.reset({
            webhookUrl: data.webhook_url || "",
            emailTemplate: data.email_template || "",
            linkedinWebhookUrl: data.linkedin_webhook_url || "",
          });
        } else {
          const { data: newSettings, error: createError } = await supabase
            .from("settings")
            .upsert({ user_id: user.id }, { onConflict: "user_id" })
            .select()
            .single();

          if (createError) throw createError;
          setSettings(newSettings);
        }
      } catch (error) {
        setFeedback({
          type: "error",
          text:
            error instanceof Error ? error.message : "Failed to load settings",
        });
      }

      if (!hasCheckedOAuth.current) {
        hasCheckedOAuth.current = true;

        const params = new URLSearchParams(window.location.search);
        const returningFromOAuth = params.get("connected") === "true";

        if (params.has("connected")) {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }

        const id = await fetchLinkedInAccount(returningFromOAuth);
        setLinkedinAccountId(id);
      }

      setLoading(false);
    };

    init();
  }, [user, fetchLinkedInAccount, form]);

  const onSubmit = async (values: SettingsFormValues) => {
    if (!user || !settings) return;

    setFeedback(null);

    try {
      const { error } = await supabase
        .from("settings")
        .update({
          webhook_url: values.webhookUrl,
          email_template: values.emailTemplate,
          linkedin_webhook_url: values.linkedinWebhookUrl,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setFeedback({ type: "success", text: "Settings saved successfully" });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to save settings",
      });
    }
  };

  const insertVariable = (variable: string) => {
    const current = form.getValues("emailTemplate") || "";
    form.setValue("emailTemplate", current + variable, { shouldDirty: true });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <Button
            type="submit"
            form="settings-form"
            disabled={form.formState.isSubmitting}
            size="sm"
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </div>

        {feedback && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
              feedback.type === "error"
                ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {feedback.text}
          </div>
        )}

        <Form {...form}>
          <form
            id="settings-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-8 space-y-10"
          >
            <section>
              <SectionHeader title="Webhooks" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-5 transition-colors">
                  <div className="flex items-center gap-2">
                    <StatusDot active={!!webhookUrl} />
                    <p className="text-sm font-medium">Lead Search</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    n8n &middot; Search & Trigger
                  </p>
                  <FormField
                    control={form.control}
                    name="webhookUrl"
                    render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://n8n.example.com/webhook/..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="rounded-lg border bg-card p-5 transition-colors">
                  <div className="flex items-center gap-2">
                    <StatusDot active={!!linkedinWebhookUrl} />
                    <p className="text-sm font-medium">LinkedIn Campaigns</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    n8n &middot; Campaign Automation
                  </p>
                  <FormField
                    control={form.control}
                    name="linkedinWebhookUrl"
                    render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://n8n.example.com/webhook/..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </section>

            <section>
              <SectionHeader title="LinkedIn Account" />
              <div className="mt-4">
                <ConnectionStep
                  accountId={linkedinAccountId}
                  onAccountIdChange={setLinkedinAccountId}
                />
              </div>
            </section>

            <section>
              <SectionHeader title="Email Template" />
              <div className="mt-4 rounded-lg border bg-card p-5">
                <FormField
                  control={form.control}
                  name="emailTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder={`Hi {{company}},\n\nI noticed you're in the {{industry}} space...`}
                          className="min-h-40 resize-y"
                          {...field}
                        />
                      </FormControl>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {TEMPLATE_VARIABLES.map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => insertVariable(v)}
                            className="rounded-md border bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
