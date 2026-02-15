import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Map Unipile Account Status webhook messages to our status format
function normalizeStatus(raw: string): string {
  const upper = raw.toUpperCase();
  if (upper === "OK" || upper === "SYNC_SUCCESS") return "CREATION_SUCCESS";
  if (upper === "CREDENTIALS" || upper === "STOPPED" || upper === "ERROR") return "ERROR";
  if (upper === "DELETED") return "DELETION";
  return upper; // CREATION_SUCCESS, RECONNECTED, CONNECTING, etc.
}

export async function POST(request: NextRequest) {
  try {
    // Validate webhook secret via query parameter or header (if configured)
    const expectedSecret = process.env.UNIPILE_WEBHOOK_SECRET;

    if (expectedSecret) {
      const secretFromQuery = request.nextUrl.searchParams.get("secret");
      const secretFromHeader = request.headers.get("unipile-auth");

      if (secretFromQuery !== expectedSecret && secretFromHeader !== expectedSecret) {
        console.error("Unipile callback: secret mismatch");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Parse body - handle both JSON and form-encoded
    const rawText = await request.text();
    console.log("Unipile callback raw body:", rawText.substring(0, 2000));

    let body: Record<string, unknown>;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(rawText);
      body = Object.fromEntries(params.entries());
    } else {
      try {
        body = JSON.parse(rawText);
      } catch {
        console.error("Unipile callback: failed to parse body");
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      }
    }

    console.log("Unipile callback body keys:", Object.keys(body));

    // Extract fields - handle BOTH Unipile webhook formats:
    //
    // Format 1 - notify_url (hosted auth):
    //   { "status": "CREATION_SUCCESS", "account_id": "xxx", "name": "user_id" }
    //
    // Format 2 - Account Status Webhook:
    //   { "AccountStatus": { "account_id": "xxx", "account_type": "LINKEDIN", "message": "CREDENTIALS" } }

    let status: string;
    let account_id: string;
    let clientId: string;

    const accountStatus = body.AccountStatus as Record<string, string> | undefined;

    if (accountStatus && typeof accountStatus === "object") {
      // Format 2: Account Status Webhook
      console.log("Unipile callback: detected AccountStatus format");
      status = normalizeStatus(accountStatus.message || "");
      account_id = accountStatus.account_id || "";
      clientId = ""; // Not included in this format - will fetch from Unipile API
    } else {
      // Format 1: notify_url callback
      console.log("Unipile callback: detected notify_url format");
      status = (body.status as string) || "";
      account_id = (body.account_id as string) || (body.accountId as string) || "";
      clientId = (body.name as string) || (body.client_id as string) || "";
    }

    console.log("Unipile callback extracted:", { status, account_id, clientId });

    if (!account_id) {
      console.error("Unipile callback: no account_id found");
      return NextResponse.json({ error: "Missing account_id" }, { status: 400 });
    }

    const normalizedStatus = normalizeStatus(status);
    console.log("Unipile callback: normalized status:", normalizedStatus);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Unipile callback: missing supabase env vars");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // If we don't have clientId (Account Status webhook format),
    // look up existing row in DB first (most reliable), then fallback to Unipile API
    if (!clientId) {
      const { data: existingRow } = await supabase
        .from("linkedin_accounts")
        .select("client_id")
        .eq("account_id", account_id)
        .limit(1)
        .single();

      if (existingRow?.client_id) {
        clientId = existingRow.client_id;
        console.log("Unipile callback: found client_id from DB:", clientId);
      }
    }

    if (!clientId) {
      console.error("Unipile callback: could not determine client_id for account:", account_id);
      return NextResponse.json({ error: "Could not determine user" }, { status: 400 });
    }

    // Upsert: update existing row for this account_id, or insert if new
    const { error: upsertError } = await supabase.from("linkedin_accounts").upsert(
      {
        client_id: clientId,
        account_id,
        status: normalizedStatus,
      },
      { onConflict: "account_id" },
    );

    if (upsertError) {
      console.error("Failed to upsert linkedin_accounts:", JSON.stringify(upsertError));
      return NextResponse.json({ error: "Failed to save account event" }, { status: 500 });
    }

    console.log("Unipile callback: upserted linkedin_accounts", {
      normalizedStatus,
      account_id,
      clientId,
    });

    // On successful connection, also update settings
    if (normalizedStatus === "CREATION_SUCCESS" || normalizedStatus === "RECONNECTED") {
      const { error: settingsError } = await supabase
        .from("settings")
        .upsert({ user_id: clientId, linkedin_account_id: account_id }, { onConflict: "user_id" });

      if (settingsError) {
        console.error("Failed to update settings:", JSON.stringify(settingsError));
      }
    }

    return NextResponse.json({ ok: true, status: normalizedStatus });
  } catch (err) {
    console.error("Unipile callback: unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
