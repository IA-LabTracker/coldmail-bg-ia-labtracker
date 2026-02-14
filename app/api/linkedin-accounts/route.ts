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

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Check if we need to sync from Unipile (query param ?sync=true)
    const shouldSync = request.nextUrl.searchParams.get("sync") === "true";

    if (shouldSync) {
      await syncFromUnipile(user.id, supabaseAdmin);
    }

    const { data, error } = await supabaseAdmin
      .from("linkedin_accounts")
      .select("*")
      .eq("client_id", user.id)
      .order("data_conecction", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Failed to fetch linkedin_accounts:", JSON.stringify(error));
      return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
    }

    return NextResponse.json({ accounts: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Fetches accounts from Unipile API and syncs any that belong to this user
 * into the linkedin_accounts table. This acts as a fallback when the webhook
 * callback doesn't reach our server (e.g. localhost, network issues).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncFromUnipile(
  userId: string,
  supabaseAdmin: any,
) {
  const unipileDsn = process.env.UNIPILE_DSN;
  const unipileApiKey = process.env.UNIPILE_API_KEY;

  if (!unipileDsn || !unipileApiKey) {
    console.warn("Unipile credentials not configured, skipping sync");
    return;
  }

  try {
    const response = await axios.get(
      `https://${unipileDsn}/api/v1/accounts`,
      {
        headers: {
          "X-API-KEY": unipileApiKey,
          Accept: "application/json",
        },
      },
    );

    const accounts = response.data?.items || response.data || [];

    for (const account of accounts) {
      // Unipile stores our user.id in the "name" field (set during OAuth creation)
      if (account.name !== userId) continue;

      const accountId = account.id || account.account_id;
      if (!accountId) continue;

      // Check if this account already exists in our table
      const { data: existing } = await supabaseAdmin
        .from("linkedin_accounts")
        .select("id")
        .eq("client_id", userId)
        .eq("account_id", accountId)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Determine status based on Unipile account status
      const status = mapUnipileStatus(account.status || account.connection_status);

      // Insert the missing account
      const { error: insertError } = await supabaseAdmin
        .from("linkedin_accounts")
        .insert({
          client_id: userId,
          account_id: accountId,
          status,
        });

      if (insertError) {
        console.error("Sync: failed to insert account:", JSON.stringify(insertError));
      } else {
        console.log("Sync: inserted account from Unipile:", { accountId, status });

        // Also update settings if connected successfully
        if (status === "CREATION_SUCCESS" || status === "RECONNECTED") {
          await supabaseAdmin
            .from("settings")
            .upsert(
              { user_id: userId, linkedin_account_id: accountId },
              { onConflict: "user_id" },
            );
        }
      }
    }
  } catch (err) {
    console.error(
      "Sync from Unipile failed:",
      err instanceof Error ? err.message : err,
    );
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
