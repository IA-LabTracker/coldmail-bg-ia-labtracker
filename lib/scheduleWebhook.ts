import { Email, ScheduleType, SenderEmail, WeekDay } from "@/types";

interface TriggerScheduleWebhookParams {
  scheduleId: string;
  scheduleName: string;
  scheduleType: ScheduleType;
  scheduledDate: string | null;
  scheduledTime: string;
  recurringDays: WeekDay[];
  nextRunAt: string;
  emails: Email[];
  webhookUrl?: string | null;
  senderEmail?: SenderEmail | null;
}

function serializeSenderEmail(se: SenderEmail | null | undefined) {
  if (!se) return null;
  return {
    id: se.id,
    email_address: se.email_address,
    display_name: se.display_name,
    domain: se.domain,
    provider: se.provider,
    provider_id: se.provider_id,
    platform: se.platform,
  };
}

export async function triggerScheduleWebhook(params: TriggerScheduleWebhookParams): Promise<void> {
  const resolvedWebhookUrl = params.webhookUrl?.trim() || process.env.NEXT_PUBLIC_WEBHOOK_N8N;

  if (!resolvedWebhookUrl) {
    throw new Error("Webhook URL not configured. Please configure it in Settings.");
  }

  const senderPayload = serializeSenderEmail(params.senderEmail);
  const platform = params.senderEmail?.platform ?? "none";

  const response = await fetch(resolvedWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // New dispatches[] format
      dispatches: [
        {
          sender_email: senderPayload,
          platform,
          emails: params.emails,
        },
      ],
      total_leads: params.emails.length,
      // Legacy + schedule metadata (kept for backward compat with existing N8N flows)
      schedule: true,
      date: params.nextRunAt,
      schedule_id: params.scheduleId,
      schedule_name: params.scheduleName,
      schedule_type: params.scheduleType,
      scheduled_date: params.scheduledDate,
      scheduled_time: params.scheduledTime,
      recurring_days: params.recurringDays,
      sender_email: senderPayload,
      platform,
      emails: params.emails,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const details = errorText ? `: ${errorText}` : "";
    throw new Error(`Failed to trigger webhook${details}`);
  }
}
