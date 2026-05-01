import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

interface RequestBody {
  success_redirect_url: string;
  failure_redirect_url: string;
}

function isAllowedRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

    const appHost = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).host
      : null;

    // Localhost is only allowed outside production. In production we trust
    // NEXT_PUBLIC_APP_URL exclusively — Host header (request.url) is attacker
    // controllable, so we never use it as an allow-list source.
    if (process.env.NODE_ENV !== "production") {
      if (parsed.host === "localhost" || parsed.host.startsWith("localhost:")) return true;
      if (parsed.host === "127.0.0.1" || parsed.host.startsWith("127.0.0.1:")) return true;
    }

    return appHost !== null && parsed.host === appHost;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication via Supabase token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { success_redirect_url, failure_redirect_url } = body;

    // Validate redirect URLs against NEXT_PUBLIC_APP_URL (and localhost in dev).
    // We do NOT trust the Host header for this check.
    if (
      !isAllowedRedirectUrl(success_redirect_url) ||
      !isAllowedRedirectUrl(failure_redirect_url)
    ) {
      return NextResponse.json({ error: "Invalid redirect URL" }, { status: 400 });
    }

    const unipileDsn = process.env.UNIPILE_DSN;
    const unipileApiKey = process.env.UNIPILE_API_KEY;
    const webhookSecret = process.env.UNIPILE_WEBHOOK_SECRET;

    if (!unipileDsn || !unipileApiKey) {
      return NextResponse.json({ error: "Unipile credentials not configured" }, { status: 500 });
    }

    // The callback route requires UNIPILE_WEBHOOK_SECRET. Failing here saves
    // the user from completing the OAuth flow only to have the callback
    // return 500 and silently drop their connection.
    if (!webhookSecret) {
      console.error("Unipile auth: UNIPILE_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Build the notify_url for Unipile to call after successful connection.
    // Always prefer NEXT_PUBLIC_APP_URL — request.url derives from the Host
    // header, which an attacker can spoof.
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${new URL(request.url).protocol}//${new URL(request.url).host}`;
    const notifyUrl = `${appUrl}/api/unipile-callback?secret=${encodeURIComponent(webhookSecret)}`;

    const payload: Record<string, unknown> = {
      type: "create",
      api_url: `https://${unipileDsn}`,
      providers: ["LINKEDIN"],
      expiresOn: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      success_redirect_url,
      failure_redirect_url,
      name: user.id,
    };

    // Only include notify_url if it's a publicly reachable URL
    // Unipile cannot call back to localhost
    if (notifyUrl && !notifyUrl.includes("localhost")) {
      payload.notify_url = notifyUrl;
    }

    const response = await axios.post(
      `https://${unipileDsn}/api/v1/hosted/accounts/link`,
      payload,
      {
        headers: {
          "X-API-KEY": unipileApiKey,
          "Content-Type": "application/json",
        },
      },
    );

    return NextResponse.json({ url: response.data.url });
  } catch (error) {
    const detail =
      axios.isAxiosError(error) && error.response?.data
        ? JSON.stringify(error.response.data)
        : error instanceof Error
          ? error.message
          : "Unknown error";
    console.error("Unipile auth error:", detail);
    // Do not leak upstream error details to the client.
    return NextResponse.json({ error: "Failed to create auth link" }, { status: 500 });
  }
}
