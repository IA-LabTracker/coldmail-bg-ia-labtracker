import { Email, CompanyGroup } from "@/types";

export function groupEmailsByCompany(emails: Email[]): CompanyGroup[] {
  const groupMap = new Map<string, Email[]>();
  const orderKeys: string[] = [];

  for (const email of emails) {
    const key = email.company.toLowerCase().trim();

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
      orderKeys.push(key);
    }

    groupMap.get(key)!.push(email);
  }

  return orderKeys.map((key) => {
    const groupEmails = groupMap.get(key)!;
    return {
      companyKey: key,
      company: groupEmails[0].company,
      emails: groupEmails,
    };
  });
}
