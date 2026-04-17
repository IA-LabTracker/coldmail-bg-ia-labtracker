import { EmailTemplate, SenderEmail, SenderEmailPlatform } from "@/types";

/**
 * Resolves which template applies to a given sender email.
 * Order:
 * 1. Default template for the sender's platform (e.g. a "resend" default)
 * 2. Default template with platform "any"
 * 3. First template matching the platform (non-default)
 * 4. First template with platform "any"
 */
export function resolveTemplateForSender(
  senderPlatform: SenderEmailPlatform | string | null | undefined,
  templates: EmailTemplate[],
): EmailTemplate | null {
  if (templates.length === 0) return null;

  const normalized = senderPlatform && senderPlatform !== "none" ? senderPlatform : null;

  if (normalized) {
    const platformDefault = templates.find(
      (t) => t.platform === normalized && t.is_default,
    );
    if (platformDefault) return platformDefault;
  }

  const anyDefault = templates.find((t) => t.platform === "any" && t.is_default);
  if (anyDefault) return anyDefault;

  if (normalized) {
    const platformMatch = templates.find((t) => t.platform === normalized);
    if (platformMatch) return platformMatch;
  }

  return templates.find((t) => t.platform === "any") ?? null;
}

export function resolveTemplateFromSender(
  senderEmail: Pick<SenderEmail, "platform"> | null | undefined,
  templates: EmailTemplate[],
): EmailTemplate | null {
  if (!senderEmail) return null;
  return resolveTemplateForSender(senderEmail.platform, templates);
}
