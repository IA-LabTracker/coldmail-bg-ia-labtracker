export type EmailStatus = "sent" | "replied" | "bounced" | "researched" | "opened";
export type LeadClassification = "hot" | "warm" | "cold";

export interface Email {
  id: string;
  user_id: string;
  company: string;
  email: string;
  region: string;
  industry: string;
  keywords: string[];
  status: EmailStatus;
  response_content: string;
  lead_classification: LeadClassification;
  campaign_name: string;
  notes: string;
  date_sent: string;
  created_at: string;
  updated_at: string;
  lead_name?: string;
  phone?: string;
  city?: string;
  state?: string;
  address?: string;
  google_maps_url?: string;
  lead_category?: string;
  client_tag?: string;
  client_step?: string;
  sender_email?: string;
  prospect_cc_email?: string;
  cc_email_1?: string;
  cc_email_2?: string;
  cc_email_3?: string;
  bcc_email_1?: string;
  reply_we_got?: string;
  our_last_reply?: string;
  time_we_got_reply?: string;
  reply_time?: string;
}

export interface Settings {
  id: string;
  user_id: string;
  webhook_url: string;
  email_template: string;
  linkedin_account_id: string | null;
  linkedin_webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkedInLead {
  firstName: string;
  lastName: string;
  company: string;
  position: string;
  linkedinUrl: string;
}

export interface ImportRow {
  company: string;
  email: string;
  region: string;
  industry: string;
  keywords: string[];
  status: EmailStatus;
  campaign_name: string;
  lead_name: string;
  phone: string;
  city: string;
  state: string;
  address: string;
  google_maps_url: string;
  lead_category: string;
}

export interface ImportValidation {
  rowIndex: number;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface CompanyGroup {
  companyKey: string;
  company: string;
  emails: Email[];
}

export type ImportStatus = "idle" | "parsing" | "preview" | "importing" | "success" | "error";

export type LinkedInMessageStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "replied"
  | "failed"
  | "opened";

export interface LinkedInMessage {
  id: string;
  user_id: string;
  account_id: string;
  campaign_name: string;
  chat_id: string;
  message_id: string;
  provider_id: string;
  public_identifier: string;
  member_urn: string;
  linkedin_url: string;
  first_name: string;
  last_name: string;
  headline: string;
  location: string;
  current_company: string;
  current_position: string;
  top_skills: string[];
  follower_count: number;
  connections_count: number;
  is_premium: boolean;
  profile_summary: string;
  lead_quality_score: number;
  profile_picture_url: string;
  message_sent: string;
  status: LinkedInMessageStatus;
  response_content: string;
  response_message_id: string;
  lead_classification: LeadClassification;
  notes: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkedInCompanyGroup {
  companyKey: string;
  company: string;
  messages: LinkedInMessage[];
}
