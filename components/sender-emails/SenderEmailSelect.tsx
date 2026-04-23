"use client";

import { SenderEmail } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SenderEmailSelectProps {
  senderEmails: SenderEmail[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  allowAutoRoute?: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
  manual: "Manual",
  resend: "Resend",
  zapmail: "Zapmail",
  ses: "SES",
  mailgun: "Mailgun",
  smtp: "SMTP",
  google: "Gmail",
  outlook: "Outlook",
};

const PLATFORM_LABELS: Record<string, string> = {
  smartlead: "SmartLead",
  resend: "Resend",
  zapmail: "Zapmail",
  google: "Gmail",
  outlook: "Outlook",
};

export function SenderEmailSelect({
  senderEmails,
  value,
  onChange,
  placeholder = "Select sender email",
  disabled = false,
  allowClear = true,
  allowAutoRoute = false,
}: SenderEmailSelectProps) {
  const activeEmails = senderEmails.filter((se) => se.status === "active");

  return (
    <Select
      value={value || "__none__"}
      onValueChange={(val) => {
        if (val === "__none__") onChange(null);
        else if (val === "__auto__") onChange("__auto__");
        else onChange(val);
      }}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowAutoRoute && (
          <SelectItem value="__auto__">
            <span className="font-medium">Auto-route</span>
            <span className="ml-1.5 text-muted-foreground">distribute by quota</span>
          </SelectItem>
        )}
        {allowClear && (
          <SelectItem value="__none__">
            <span className="text-muted-foreground">No sender email</span>
          </SelectItem>
        )}
        {activeEmails.map((se) => (
          <SelectItem key={se.id} value={se.id}>
            <span>{se.email_address}</span>
            {se.provider !== "manual" && (
              <span className="ml-1.5 text-muted-foreground">
                via {PROVIDER_LABELS[se.provider] ?? se.provider}
              </span>
            )}
            {se.platform && se.platform !== "none" && (
              <span className="ml-1.5 text-muted-foreground">
                → {PLATFORM_LABELS[se.platform] ?? se.platform}
              </span>
            )}
            {se.is_default && (
              <span className="ml-1.5 text-muted-foreground/60">(default)</span>
            )}
          </SelectItem>
        ))}
        {activeEmails.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No active sender emails.
            <br />
            Add one in Sender Emails page.
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
