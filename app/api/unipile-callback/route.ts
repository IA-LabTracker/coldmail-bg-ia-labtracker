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

interface UnipileCallbackBody {
  status: string;
  account_id: string;
  name: string; // maps to our client_id (user_id)
}

export async function POST(request: NextRequest) {
  try {
    // Validate webhook secret via query parameter (if configured)
    const secret = request.nextUrl.searchParams.get("secret");
    const expectedSecret = process.env.UNIPILE_WEBHOOK_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UnipileCallbackBody = await request.json();
    const { status, account_id, name: clientId } = body;

    if (!account_id || !clientId) {
      return NextResponse.json({ error: "Missing account_id or name" }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json({ ok: true, message: "Unknown status ignored" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
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
      console.error("Failed to insert linkedin_accounts:", insertError);
      return NextResponse.json({ error: "Failed to save account event" }, { status: 500 });
    }

    // On successful connection, also update settings for backward compatibility
    if (status === "CREATION_SUCCESS" || status === "RECONNECTED") {
      const { error: settingsError } = await supabase
        .from("settings")
        .upsert({ user_id: clientId, linkedin_account_id: account_id }, { onConflict: "user_id" });

      if (settingsError) {
        console.error("Failed to update settings:", settingsError);
      }
    }

    return NextResponse.json({ ok: true, status });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
