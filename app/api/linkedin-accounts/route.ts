import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

export async function GET(request: NextRequest) {
  try {
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

    console.log("[linkedin-accounts] User:", user.id);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Check if we need to sync from Unipile (query param ?sync=true)
    const shouldSync = request.nextUrl.searchParams.get("sync") === "true";

    if (shouldSync) {
      console.log("[linkedin-accounts] Syncing from Unipile...");
      await syncFromUnipile(user.id, supabaseAdmin);
    }

    const { data, error } = await supabaseAdmin
      .from("linkedin_accounts")
      .select("*")
      .eq("client_id", user.id)
      .order("data_conecction", { ascending: false })
      .limit(10);

    console.log("[linkedin-accounts] Query result:", { count: data?.length, error: error ? JSON.stringify(error) : null });

    if (error) {
      console.error("[linkedin-accounts] Failed to fetch:", JSON.stringify(error));
      return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
    }

    return NextResponse.json({ accounts: data });
  } catch (err) {
    console.error("[linkedin-accounts] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Fetches accounts from Unipile API and syncs any that belong to this user
 * into the linkedin_accounts table. This acts as a fallback when the webhook
 * callback doesn't reach our server (e.g. localhost, network issues).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncFromUnipile(userId: string, supabaseAdmin: any) {
  const unipileDsn = process.env.UNIPILE_DSN;
  const unipileApiKey = process.env.UNIPILE_API_KEY;

  if (!unipileDsn || !unipileApiKey) {
    console.warn("[sync] Unipile credentials not configured, skipping");
    return;
  }

  try {
    console.log("[sync] Fetching accounts from Unipile API...");

    const response = await axios.get(`https://${unipileDsn}/api/v1/accounts`, {
      headers: {
        "X-API-KEY": unipileApiKey,
        Accept: "application/json",
      },
    });

    // Log the full response structure to understand the format
    const rawData = response.data;
    console.log("[sync] Unipile raw response keys:", Object.keys(rawData || {}));
    console.log("[sync] Unipile raw response:", JSON.stringify(rawData).substring(0, 2000));

    const accounts = rawData?.items || rawData?.accounts || (Array.isArray(rawData) ? rawData : []);
    console.log("[sync] Found", accounts.length, "total accounts in Unipile");

    for (const account of accounts) {
      console.log("[sync] Account:", {
        id: account.id,
        account_id: account.account_id,
        name: account.name,
        status: account.status,
        connection_status: account.connection_status,
        provider: account.provider,
        type: account.type,
      });

      // Match by name (we set name = user.id during OAuth creation)
      // Also try matching without strict equality in case of format differences
      const accountName = account.name || "";
      const isMatch = accountName === userId || accountName.includes(userId);

      if (!isMatch) {
        console.log("[sync] Skipping - name doesn't match user:", { name: accountName, userId });
        continue;
      }

      const accountId = account.id || account.account_id;
      if (!accountId) {
        console.log("[sync] Skipping - no account ID found");
        continue;
      }

      // Check if this account already exists in our table
      const { data: existing } = await supabaseAdmin
        .from("linkedin_accounts")
        .select("id")
        .eq("client_id", userId)
        .eq("account_id", accountId)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log("[sync] Account already exists in DB:", accountId);
        continue;
      }

      // Determine status based on Unipile account status
      const status = mapUnipileStatus(account.status || account.connection_status);
      console.log("[sync] Inserting account:", { accountId, status, userId });

      const { error: insertError } = await supabaseAdmin
        .from("linkedin_accounts")
        .insert({
          client_id: userId,
          account_id: accountId,
          status,
        });

      if (insertError) {
        console.error("[sync] Insert failed:", JSON.stringify(insertError));
      } else {
        console.log("[sync] Insert success:", accountId);

        // Also update settings if connected successfully
        if (status === "CREATION_SUCCESS" || status === "RECONNECTED") {
          const { error: settingsError } = await supabaseAdmin
            .from("settings")
            .upsert({ user_id: userId, linkedin_account_id: accountId }, { onConflict: "user_id" });

          if (settingsError) {
            console.error("[sync] Settings upsert failed:", JSON.stringify(settingsError));
          }
        }
      }
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error("[sync] Unipile API error:", {
        status: err.response?.status,
        data: JSON.stringify(err.response?.data)?.substring(0, 500),
        message: err.message,
      });
    } else {
      console.error("[sync] Error:", err instanceof Error ? err.message : err);
    }
  }
}

function mapUnipileStatus(unipileStatus: string | undefined): string {
  if (!unipileStatus) return "CREATION_SUCCESS";

  const normalized = unipileStatus.toUpperCase();
  if (normalized.includes("OK") || normalized.includes("CONNECTED") || normalized.includes("RUNNING")) {
    return "CREATION_SUCCESS";
  }
  if (normalized.includes("ERROR") || normalized.includes("FAIL")) {
    return "ERROR";
  }
  if (normalized.includes("RECONNECT")) {
    return "RECONNECTED";
  }
  return "CREATION_SUCCESS";
}
