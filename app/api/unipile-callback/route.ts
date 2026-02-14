import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const VALID_STATUSES = [
  "CREATION_SUCCESS",
  "CREATION_FAIL",
  "DELETION",
  "RECONNECTED",
  "CONNECTING",
  "ERROR",
] as const;

export async function POST(request: NextRequest) {
  try {
    // Validate webhook secret via query parameter or header (if configured)
    const expectedSecret = process.env.UNIPILE_WEBHOOK_SECRET;

    if (expectedSecret) {
      const secretFromQuery = request.nextUrl.searchParams.get("secret");
      const secretFromHeader = request.headers.get("unipile-auth");

      if (secretFromQuery !== expectedSecret && secretFromHeader !== expectedSecret) {
        console.error("Unipile callback: secret mismatch", {
          hasQuery: !!secretFromQuery,
          hasHeader: !!secretFromHeader,
        });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Log raw body to understand Unipile's actual format
    const rawText = await request.text();
    console.log("Unipile callback raw body:", rawText.substring(0, 2000));
    console.log("Unipile callback content-type:", request.headers.get("content-type"));

    // Parse body - handle both JSON and form-encoded
    let body: Record<string, unknown>;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(rawText);
      body = Object.fromEntries(params.entries());
    } else {
      try {
        body = JSON.parse(rawText);
      } catch {
        console.error("Unipile callback: failed to parse body as JSON");
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      }
    }

    console.log("Unipile callback parsed body:", JSON.stringify(body).substring(0, 2000));
    console.log("Unipile callback body keys:", Object.keys(body));

    // Try multiple possible field names that Unipile might use
    const status = (body.status || body.event || body.type || body.event_type || "") as string;
    const account_id = (body.account_id ||
      body.accountId ||
      body.id ||
      body.account ||
      "") as string;
    const clientId = (body.name ||
      body.client_id ||
      body.clientId ||
      body.user_id ||
      body.userId ||
      "") as string;

    console.log("Unipile callback extracted:", { status, account_id, clientId });

    if (!account_id || !clientId) {
      console.error("Unipile callback: missing fields after extraction", {
        account_id,
        clientId,
        bodyKeys: Object.keys(body),
      });
      return NextResponse.json(
        {
          error: "Missing account_id or name",
          debug: { keys: Object.keys(body), body: JSON.stringify(body).substring(0, 500) },
        },
        { status: 400 },
      );
    }

    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      console.log("Unipile callback: unknown status ignored", status);
      return NextResponse.json({ ok: true, message: "Unknown status ignored" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Unipile callback: missing supabase env vars");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Use service role to bypass RLS (this is a server-to-server call from Unipile)
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Save event to linkedin_accounts table
    const { error: insertError } = await supabase.from("linkedin_accounts").insert({
      client_id: clientId,
      account_id,
      status,
    });

    if (insertError) {
      console.error("Failed to insert linkedin_accounts:", JSON.stringify(insertError));
      return NextResponse.json({ error: "Failed to save account event" }, { status: 500 });
    }

    console.log("Unipile callback: inserted into linkedin_accounts", { status, account_id });

    // On successful connection, also update settings for backward compatibility
    if (status === "CREATION_SUCCESS" || status === "RECONNECTED") {
      const { error: settingsError } = await supabase
        .from("settings")
        .upsert({ user_id: clientId, linkedin_account_id: account_id }, { onConflict: "user_id" });

      if (settingsError) {
        console.error("Failed to update settings:", JSON.stringify(settingsError));
      }
    }

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error("Unipile callback: unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
