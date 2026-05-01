import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { describeWebhookUrlError, validateWebhookUrl } from "@/lib/validateWebhookUrl";

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();

    const { data: settings, error: settingsError } = await supabase
      .from("settings")
      .select("webhook_url")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (settingsError) {
      return NextResponse.json({ error: "Failed to load webhook settings" }, { status: 500 });
    }

    const webhookUrl = settings?.webhook_url?.trim() || process.env.NEXT_PUBLIC_WEBHOOK_N8N;

    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL not configured" }, { status: 400 });
    }

    const validation = validateWebhookUrl(webhookUrl);
    if (!validation.ok) {
      return NextResponse.json(
        { error: describeWebhookUrlError(validation.error!) },
        { status: 400 },
      );
    }

    const webhookResponse = await fetch(validation.url!.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
      redirect: "error",
    });

    if (!webhookResponse.ok) {
      const details = await webhookResponse.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Webhook responded with ${webhookResponse.status}`,
          details: details.slice(0, 500),
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const isProd = process.env.NODE_ENV === "production";
    const message =
      !isProd && error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
