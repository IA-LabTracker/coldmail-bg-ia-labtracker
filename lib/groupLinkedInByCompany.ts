import { LinkedInMessage, LinkedInCompanyGroup } from "@/types";

export function groupLinkedInByCompany(messages: LinkedInMessage[]): LinkedInCompanyGroup[] {
  const groupMap = new Map<string, LinkedInMessage[]>();
  const orderKeys: string[] = [];

  for (const msg of messages) {
    const key = msg.current_company.toLowerCase().trim() || "no-company";

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
      orderKeys.push(key);
    }

    groupMap.get(key)!.push(msg);
  }

  return orderKeys.map((key) => {
    const groupMessages = groupMap.get(key)!;
    return {
      companyKey: key,
      company: groupMessages[0].current_company || "No Company",
      messages: groupMessages,
    };
  });
}
