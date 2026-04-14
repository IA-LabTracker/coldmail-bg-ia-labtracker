import { supabase } from "@/lib/supabase";
import { SenderEmail, Email } from "@/types";

interface SenderWithQuota {
  senderEmail: SenderEmail;
  sentToday: number;
  remaining: number;
}

interface DispatchGroup {
  senderEmail: SenderEmail;
  platform: string;
  emails: Email[];
}

/**
 * Given a list of sender emails and leads to dispatch,
 * auto-distributes leads across senders that still have daily quota.
 *
 * Strategy: round-robin across senders with remaining quota,
 * prioritizing senders with the most remaining capacity.
 */
export async function autoRouteLeads(
  userId: string,
  senderEmails: SenderEmail[],
  leads: Email[],
): Promise<DispatchGroup[]> {
  const activeSenders = senderEmails.filter(
    (se) => se.status === "active" && se.platform !== "none",
  );

  if (activeSenders.length === 0) return [];

  // Count today's sends per sender
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todayCounts } = await supabase
    .from("emails")
    .select("sender_email_id")
    .eq("user_id", userId)
    .not("sender_email_id", "is", null)
    .gte("updated_at", todayStart.toISOString());

  const countMap = new Map<string, number>();
  for (const row of todayCounts ?? []) {
    const id = row.sender_email_id as string;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  // Build quota info
  const sendersWithQuota: SenderWithQuota[] = activeSenders
    .map((se) => {
      const sentToday = countMap.get(se.id) ?? 0;
      const limit = se.daily_limit > 0 ? se.daily_limit : Infinity;
      const remaining = Math.max(0, limit - sentToday);
      return { senderEmail: se, sentToday, remaining };
    })
    .filter((s) => s.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining);

  if (sendersWithQuota.length === 0) return [];

  // Distribute leads round-robin across senders with remaining capacity
  const groups = new Map<string, DispatchGroup>();

  for (const sender of sendersWithQuota) {
    groups.set(sender.senderEmail.id, {
      senderEmail: sender.senderEmail,
      platform: sender.senderEmail.platform,
      emails: [],
    });
  }

  let senderIdx = 0;
  for (const lead of leads) {
    // Find next sender with remaining quota
    let attempts = 0;
    while (attempts < sendersWithQuota.length) {
      const sender = sendersWithQuota[senderIdx % sendersWithQuota.length];
      const group = groups.get(sender.senderEmail.id)!;

      if (sender.remaining > group.emails.length) {
        group.emails.push(lead);
        senderIdx++;
        break;
      }

      senderIdx++;
      attempts++;
    }
  }

  // Return only groups that have leads
  return Array.from(groups.values()).filter((g) => g.emails.length > 0);
}
