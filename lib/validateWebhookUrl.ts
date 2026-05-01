/**
 * SSRF guard for user-supplied webhook URLs that the server will fetch.
 *
 * Blocks: non-http(s) protocols, private/loopback/link-local IP literals,
 * and unusual ports. DNS rebinding still requires the caller to do its own
 * IP-pinned fetch; this only stops the obvious literal-IP attacks against
 * cloud metadata, internal services, and localhost.
 */

const PRIVATE_HOSTNAMES = new Set([
  "localhost",
  "0",
  "0.0.0.0",
  "::",
  "::1",
  "ip6-localhost",
  "ip6-loopback",
]);

const PRIVATE_IP_PATTERNS: RegExp[] = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT 100.64/10
  /^0\./,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
];

const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

export type WebhookUrlError =
  | "invalid_url"
  | "invalid_protocol"
  | "private_host"
  | "blocked_port";

export function validateWebhookUrl(input: string): {
  ok: boolean;
  error?: WebhookUrlError;
  url?: URL;
} {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return { ok: false, error: "invalid_url" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "invalid_protocol" };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (PRIVATE_HOSTNAMES.has(hostname)) {
    return { ok: false, error: "private_host" };
  }

  if (PRIVATE_IP_PATTERNS.some((re) => re.test(hostname))) {
    return { ok: false, error: "private_host" };
  }

  // Defang IPv6 zone-identifier and bracketed forms.
  if (hostname.includes("%")) {
    return { ok: false, error: "private_host" };
  }

  if (!ALLOWED_PORTS.has(parsed.port)) {
    return { ok: false, error: "blocked_port" };
  }

  return { ok: true, url: parsed };
}

export function describeWebhookUrlError(error: WebhookUrlError): string {
  switch (error) {
    case "invalid_url":
      return "Webhook URL is malformed";
    case "invalid_protocol":
      return "Webhook URL must use http or https";
    case "private_host":
      return "Webhook URL points to a private or loopback address";
    case "blocked_port":
      return "Webhook URL uses a blocked port";
  }
}
