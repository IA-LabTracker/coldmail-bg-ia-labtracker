import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

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

    // If we don't have clientId (Account Status format), fetch it from Unipile API
    if (!clientId) {
      clientId = await fetchClientIdFromUnipile(account_id);
      console.log("Unipile callback: fetched clientId from API:", clientId);
    }

    if (!clientId) {
      console.error("Unipile callback: could not determine client_id for account:", account_id);
      return NextResponse.json({ error: "Could not determine user" }, { status: 400 });
    }

    const normalizedStatus = normalizeStatus(status);
    console.log("Unipile callback: normalized status:", normalizedStatus);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Unipile callback: missing supabase env vars");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if this exact event already exists (avoid duplicates)
    const { data: existing } = await supabase
      .from("linkedin_accounts")
      .select("id")
      .eq("client_id", clientId)
      .eq("account_id", account_id)
      .eq("status", normalizedStatus)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log("Unipile callback: duplicate event, skipping insert");
      return NextResponse.json({ ok: true, status: normalizedStatus, duplicate: true });
    }

    // Save event to linkedin_accounts table
    const { error: insertError } = await supabase.from("linkedin_accounts").insert({
      client_id: clientId,
      account_id,
      status: normalizedStatus,
    });

    if (insertError) {
      console.error("Failed to insert linkedin_accounts:", JSON.stringify(insertError));
      return NextResponse.json({ error: "Failed to save account event" }, { status: 500 });
    }

    console.log("Unipile callback: inserted into linkedin_accounts", {
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

/**
 * Fetches the account details from Unipile API to get the "name" field
 * (which contains our user_id, set during OAuth creation).
 */
async function fetchClientIdFromUnipile(accountId: string): Promise<string> {
  const unipileDsn = process.env.UNIPILE_DSN;
  const unipileApiKey = process.env.UNIPILE_API_KEY;

  if (!unipileDsn || !unipileApiKey) return "";

  try {
    const response = await axios.get(`https://${unipileDsn}/api/v1/accounts/${accountId}`, {
      headers: {
        "X-API-KEY": unipileApiKey,
        Accept: "application/json",
      },
    });

    const name = response.data?.name || "";
    console.log("Unipile API account details:", {
      id: response.data?.id,
      name,
      type: response.data?.type,
    });
    return name;
  } catch (err) {
    console.error(
      "Failed to fetch account from Unipile:",
      err instanceof Error ? err.message : err,
    );
    return "";
  }
}
