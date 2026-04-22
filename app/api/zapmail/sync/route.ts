import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ZAPMAIL_BASE = "https://api.zapmail.ai/api/v2";

interface ZapmailMailbox {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  status: string;
  domain?: string;
  domainId?: string;
  assignedOn?: string | null;
  expireOn?: string | null;
  isWarmedUp?: boolean;
}

interface ZapmailDomain {
  id: string;
  domain: string;
  status: string;
  mailboxes: ZapmailMailbox[];
}

interface ZapmailListResponse {
  status: number;
  data: {
    totalSearchedCount: number;
    currentPage: number;
    totalPages: number;
    domains: ZapmailDomain[];
  };
}

function mapStatus(zapmailStatus: string): "active" | "pending" | "error" | "suspended" {
  const s = zapmailStatus?.toUpperCase();
  if (s === "ACTIVE") return "active";
  if (s === "SUSPENDED" || s === "EXPIRED") return "suspended";
  if (s === "ERROR" || s === "FAILED") return "error";
  return "pending";
}

function extractDomain(email: string): string {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1].toLowerCase() : "";
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ZAPMAIL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ZAPMAIL_API_KEY not configured" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Paginate through Zapmail mailboxes
  const mailboxes: ZapmailMailbox[] = [];
  let page = 1;
  const LIMIT = 50;

  try {
    while (true) {
      const url = new URL(`${ZAPMAIL_BASE}/mailboxes/list`);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(LIMIT));

      const res = await fetch(url.toString(), {
        headers: {
          "x-auth-zapmail": apiKey,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const body = await res.text();
        return NextResponse.json(
          { error: `Zapmail API ${res.status}: ${body.slice(0, 200)}` },
          { status: 502 },
        );
      }

      const json = (await res.json()) as ZapmailListResponse;
      for (const d of json.data.domains ?? []) {
        for (const mb of d.mailboxes ?? []) {
          mailboxes.push({ ...mb, domain: mb.domain ?? d.domain });
        }
      }

      if (page >= json.data.totalPages) break;
      page += 1;
      if (page > 100) break; // safety cap
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Zapmail fetch failed" },
      { status: 502 },
    );
  }

  const now = new Date().toISOString();
  const rows = mailboxes
    .filter((m) => !!m.email)
    .map((m) => {
      const fullName = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
      return {
        user_id: user.id,
        email_address: m.email.toLowerCase(),
        display_name: fullName,
        domain: (m.domain ?? extractDomain(m.email)).toLowerCase(),
        provider: "zapmail" as const,
        platform: "zapmail" as const,
        provider_id: m.id,
        status: mapStatus(m.status),
        last_synced_at: now,
        provider_metadata: {
          zapmail_domain_id: m.domainId ?? null,
          assigned_on: m.assignedOn ?? null,
          expire_on: m.expireOn ?? null,
          is_warmed_up: m.isWarmedUp ?? false,
          raw_status: m.status,
          synced_at: now,
        },
        updated_at: now,
      };
    });

  if (rows.length === 0) {
    return NextResponse.json({ added: 0, updated: 0, total: 0 });
  }

  // Upsert on (user_id, email_address) — unique constraint in the schema
  const { error: upsertError, data } = await supabase
    .from("sender_emails")
    .upsert(rows, {
      onConflict: "user_id,email_address",
      ignoreDuplicates: false,
    })
    .select("id");

  if (upsertError) {
    return NextResponse.json(
      { error: `Upsert failed: ${upsertError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    total: rows.length,
    synced: data?.length ?? rows.length,
  });
}
