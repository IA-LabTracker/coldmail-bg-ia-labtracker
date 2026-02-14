import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

interface UnipileAccount {
  id: string;
  name: string;
  type: string;
  status: string;
  connection_params?: {
    im?: { provider?: string };
    mail?: { provider?: string };
  };
  sources?: string[];
  created_at?: string;
}

interface AccountWithDetails {
  id: string;
  client_id: string;
  account_id: string;
  status: string;
  data_conecction: string;
  // Extra details from Unipile
  provider?: string;
  unipile_status?: string;
}

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

    // Always sync from Unipile to ensure fresh data
    const unipileAccounts = await fetchUserAccountsFromUnipile(user.id);
    console.log("[linkedin-accounts] Unipile accounts for user:", unipileAccounts.length);

    // Sync any missing accounts into Supabase
    for (const ua of unipileAccounts) {
      const { data: existing } = await supabaseAdmin
        .from("linkedin_accounts")
        .select("id, status")
        .eq("client_id", user.id)
        .eq("account_id", ua.id)
        .limit(1);

      const dbStatus = mapUnipileStatus(ua.status);

      if (!existing || existing.length === 0) {
        // Insert new account
        const { error: insertError } = await supabaseAdmin
          .from("linkedin_accounts")
          .insert({ client_id: user.id, account_id: ua.id, status: dbStatus });

        if (insertError) {
          console.error("[linkedin-accounts] Insert failed:", JSON.stringify(insertError));
        } else {
          console.log("[linkedin-accounts] Synced account:", ua.id, dbStatus);
        }
      } else if (existing[0].status !== dbStatus) {
        // Update status if changed
        await supabaseAdmin
          .from("linkedin_accounts")
          .update({ status: dbStatus })
          .eq("id", existing[0].id);
      }

      // Update settings for active connections
      if (dbStatus === "CREATION_SUCCESS" || dbStatus === "RECONNECTED") {
        await supabaseAdmin
          .from("settings")
          .upsert({ user_id: user.id, linkedin_account_id: ua.id }, { onConflict: "user_id" });
      }
    }

    // Fetch final data from DB
    const { data, error } = await supabaseAdmin
      .from("linkedin_accounts")
      .select("*")
      .eq("client_id", user.id)
      .order("data_conecction", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[linkedin-accounts] Query failed:", JSON.stringify(error));
      return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
    }

    // Enrich DB records with live Unipile details
    const enriched: AccountWithDetails[] = (data || []).map((row) => {
      const unipileMatch = unipileAccounts.find((ua) => ua.id === row.account_id);
      return {
        ...row,
        provider: unipileMatch?.type || "LINKEDIN",
        unipile_status: unipileMatch?.status || "unknown",
      };
    });

    console.log("[linkedin-accounts] Returning", enriched.length, "accounts");

    return NextResponse.json({ accounts: enriched });
  } catch (err) {
    console.error("[linkedin-accounts] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Fetches all Unipile accounts that belong to this user (matched by name = user.id).
 */
async function fetchUserAccountsFromUnipile(userId: string): Promise<UnipileAccount[]> {
  const unipileDsn = process.env.UNIPILE_DSN;
  const unipileApiKey = process.env.UNIPILE_API_KEY;

  if (!unipileDsn || !unipileApiKey) return [];

  try {
    const response = await axios.get(`https://${unipileDsn}/api/v1/accounts`, {
      headers: { "X-API-KEY": unipileApiKey, Accept: "application/json" },
    });

    const rawData = response.data;
    const allAccounts: UnipileAccount[] =
      rawData?.items || rawData?.accounts || (Array.isArray(rawData) ? rawData : []);

    // Filter accounts belonging to this user
    return allAccounts.filter((a) => a.name === userId);
  } catch (err) {
    console.error(
      "[linkedin-accounts] Unipile API error:",
      axios.isAxiosError(err) ? err.response?.status : err,
    );
    return [];
  }
}

function mapUnipileStatus(unipileStatus: string | undefined): string {
  if (!unipileStatus) return "CREATION_SUCCESS";

  const normalized = unipileStatus.toUpperCase();
  if (
    normalized.includes("OK") ||
    normalized.includes("CONNECTED") ||
    normalized.includes("RUNNING")
  ) {
    return "CREATION_SUCCESS";
  }
  if (normalized.includes("ERROR") || normalized.includes("FAIL") || normalized.includes("STOP")) {
    return "ERROR";
  }
  if (normalized.includes("RECONNECT")) {
    return "RECONNECTED";
  }
  if (normalized.includes("CONNECT")) {
    return "CONNECTING";
  }
  return "CREATION_SUCCESS";
}
