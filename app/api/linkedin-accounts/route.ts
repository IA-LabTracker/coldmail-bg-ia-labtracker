import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

// Unipile API response types
interface UnipileSource {
  id: string;
  status: string; // OK, STOPPED, ERROR, CREDENTIALS, PERMISSIONS, CONNECTING
}

interface UnipileConnectionParams {
  im?: {
    id?: string;
    username?: string;
  };
}

interface UnipileAccount {
  object: string;
  type: string; // LINKEDIN, WHATSAPP, etc.
  id: string;
  name: string; // LinkedIn display name (NOT our user.id)
  created_at: string;
  last_fetched_at?: string;
  sources: UnipileSource[];
  connection_params?: UnipileConnectionParams;
}

// Response type sent to frontend
interface AccountResponse {
  id: string;
  account_id: string;
  display_name: string;
  provider: string;
  status: string; // OK, STOPPED, ERROR, etc.
  linkedin_username?: string;
  connected_at: string;
  is_active: boolean;
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

    // Fetch all LinkedIn accounts from Unipile
    const unipileAccounts = await fetchLinkedInAccountsFromUnipile();
    console.log("[linkedin-accounts] Unipile LinkedIn accounts:", unipileAccounts.length);

    // Get existing mappings from DB (which accounts are claimed by which user)
    const { data: dbAccounts } = await supabaseAdmin
      .from("linkedin_accounts")
      .select("*")
      .eq("client_id", user.id);

    const dbAccountIds = new Set((dbAccounts || []).map((a) => a.account_id));

    // For any Unipile account NOT yet in our DB, auto-claim for current user
    for (const ua of unipileAccounts) {
      if (dbAccountIds.has(ua.id)) continue;

      // Check if another user already claimed this account
      const { data: claimedBy } = await supabaseAdmin
        .from("linkedin_accounts")
        .select("id, client_id")
        .eq("account_id", ua.id)
        .limit(1);

      if (claimedBy && claimedBy.length > 0 && claimedBy[0].client_id !== user.id) continue;

      // Upsert: claim or update this account for current user
      const sourceStatus = ua.sources?.[0]?.status || "OK";
      const dbStatus = mapSourceStatus(sourceStatus);

      const { error: upsertError } = await supabaseAdmin.from("linkedin_accounts").upsert(
        {
          client_id: user.id,
          account_id: ua.id,
          status: dbStatus,
        },
        { onConflict: "account_id" },
      );

      if (!upsertError) {
        console.log("[linkedin-accounts] Auto-claimed account:", ua.id, ua.name);
        dbAccountIds.add(ua.id);

        // Update settings with latest active account
        if (dbStatus === "CREATION_SUCCESS") {
          await supabaseAdmin
            .from("settings")
            .upsert({ user_id: user.id, linkedin_account_id: ua.id }, { onConflict: "user_id" });
        }
      }
    }

    // Build response: enrich with live Unipile data
    const accounts: AccountResponse[] = unipileAccounts
      .filter((ua) => dbAccountIds.has(ua.id))
      .map((ua) => {
        const sourceStatus = ua.sources?.[0]?.status || "unknown";
        return {
          id: ua.id,
          account_id: ua.id,
          display_name: ua.name || "LinkedIn Account",
          provider: ua.type || "LINKEDIN",
          status: sourceStatus,
          linkedin_username: ua.connection_params?.im?.username,
          connected_at: ua.created_at,
          is_active: sourceStatus === "OK",
        };
      });

    console.log("[linkedin-accounts] Returning", accounts.length, "accounts");

    return NextResponse.json({ accounts });
  } catch (err) {
    console.error("[linkedin-accounts] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const { account_id } = await request.json();
    if (!account_id) {
      return NextResponse.json({ error: "Missing account_id" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Verify this account belongs to the current user
    const { data: existing } = await supabaseAdmin
      .from("linkedin_accounts")
      .select("id")
      .eq("account_id", account_id)
      .eq("client_id", user.id)
      .limit(1);

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // 1. Delete from Unipile API
    const unipileDsn = process.env.UNIPILE_DSN;
    const unipileApiKey = process.env.UNIPILE_API_KEY;

    if (unipileDsn && unipileApiKey) {
      try {
        await axios.delete(`https://${unipileDsn}/api/v1/accounts/${account_id}`, {
          headers: { "X-API-KEY": unipileApiKey, Accept: "application/json" },
        });
        console.log("[linkedin-accounts] Deleted from Unipile:", account_id);
      } catch (err) {
        console.error(
          "[linkedin-accounts] Unipile delete error:",
          axios.isAxiosError(err)
            ? { status: err.response?.status, data: err.response?.data }
            : err,
        );
        // Continue even if Unipile delete fails (account may already be gone)
      }
    }

    // 2. Delete from linkedin_accounts table
    const { error: deleteError } = await supabaseAdmin
      .from("linkedin_accounts")
      .delete()
      .eq("account_id", account_id)
      .eq("client_id", user.id);

    if (deleteError) {
      console.error("[linkedin-accounts] DB delete error:", JSON.stringify(deleteError));
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    // 3. Clear from settings if this was the active account
    await supabaseAdmin
      .from("settings")
      .update({ linkedin_account_id: null })
      .eq("user_id", user.id)
      .eq("linkedin_account_id", account_id);

    console.log("[linkedin-accounts] Deleted account:", account_id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[linkedin-accounts] DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function fetchLinkedInAccountsFromUnipile(): Promise<UnipileAccount[]> {
  const unipileDsn = process.env.UNIPILE_DSN;
  const unipileApiKey = process.env.UNIPILE_API_KEY;

  if (!unipileDsn || !unipileApiKey) return [];

  try {
    const response = await axios.get(`https://${unipileDsn}/api/v1/accounts`, {
      headers: { "X-API-KEY": unipileApiKey, Accept: "application/json" },
    });

    const rawData = response.data;
    const allAccounts: UnipileAccount[] = rawData?.items || [];

    // Only return LinkedIn accounts
    return allAccounts.filter(
      (a) => a.type === "LINKEDIN" || a.type?.toUpperCase() === "LINKEDIN",
    );
  } catch (err) {
    console.error(
      "[linkedin-accounts] Unipile API error:",
      axios.isAxiosError(err)
        ? { status: err.response?.status, data: JSON.stringify(err.response?.data)?.substring(0, 300) }
        : err,
    );
    return [];
  }
}

function mapSourceStatus(sourceStatus: string): string {
  const upper = sourceStatus.toUpperCase();
  if (upper === "OK") return "CREATION_SUCCESS";
  if (upper === "CONNECTING") return "CONNECTING";
  if (upper === "CREDENTIALS" || upper === "STOPPED" || upper === "ERROR" || upper === "PERMISSIONS") {
    return "ERROR";
  }
  return "CREATION_SUCCESS";
}
