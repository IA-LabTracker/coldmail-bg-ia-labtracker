import { Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { SectionHeader } from "@/components/settings/SectionHeader";
import { SettingsFormValues } from "@/hooks/useSettings";

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${
        active ? "bg-green-500 dark:bg-green-400" : "bg-gray-300 dark:bg-gray-600"
      }`}
    />
  );
}

interface WebhookCardProps {
  control: Control<SettingsFormValues>;
  name: "webhookUrl" | "linkedinWebhookUrl";
  label: string;
  description: string;
  active: boolean;
}

function WebhookCard({ control, name, label, description, active }: WebhookCardProps) {
  return (
    <div className="rounded-lg border bg-card p-5 transition-colors">
      <div className="flex items-center gap-2">
        <StatusDot active={active} />
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="mt-3">
            <FormControl>
              <Input type="url" placeholder="https://n8n.example.com/webhook/..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

interface WebhooksSectionProps {
  control: Control<SettingsFormValues>;
  webhookUrl: string;
  linkedinWebhookUrl: string;
}

export function WebhooksSection({ control, webhookUrl, linkedinWebhookUrl }: WebhooksSectionProps) {
  return (
    <section>
      <SectionHeader title="Webhooks" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <WebhookCard
          control={control}
          name="webhookUrl"
          label="Lead Search"
          description="n8n · Search & Trigger"
          active={!!webhookUrl}
        />
        <WebhookCard
          control={control}
          name="linkedinWebhookUrl"
          label="LinkedIn Campaigns"
          description="n8n · Campaign Automation"
          active={!!linkedinWebhookUrl}
        />
      </div>
    </section>
  );
}
