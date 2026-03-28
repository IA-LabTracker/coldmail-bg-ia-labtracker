"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ConnectionStep } from "@/components/linkedin/ConnectionStep";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SectionHeader } from "@/components/settings/SectionHeader";
import { FeedbackAlert } from "@/components/settings/FeedbackAlert";
import { WebhooksSection } from "@/components/settings/WebhooksSection";
import { EmailTemplateSection } from "@/components/settings/EmailTemplateSection";
import { useSettings } from "@/hooks/useSettings";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { loading, feedback, form, linkedinAccountId, setLinkedinAccountId, onSubmit, insertVariable } =
    useSettings();

  const webhookUrl = form.watch("webhookUrl");
  const linkedinWebhookUrl = form.watch("linkedinWebhookUrl");

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
          <Button type="submit" form="settings-form" disabled={form.formState.isSubmitting} size="sm">
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>

        {feedback && <FeedbackAlert feedback={feedback} />}

        <Form {...form}>
          <form id="settings-form" onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-10">
            <WebhooksSection
              control={form.control}
              webhookUrl={webhookUrl}
              linkedinWebhookUrl={linkedinWebhookUrl}
            />

            <section>
              <SectionHeader title="LinkedIn Account" />
              <div className="mt-4">
                <ConnectionStep
                  accountId={linkedinAccountId}
                  onAccountIdChange={setLinkedinAccountId}
                />
              </div>
            </section>

            <EmailTemplateSection control={form.control} onInsertVariable={insertVariable} />
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
