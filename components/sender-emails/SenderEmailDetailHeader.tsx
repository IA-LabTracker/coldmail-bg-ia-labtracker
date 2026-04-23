"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { DateRange } from "react-day-picker";
import { ArrowLeft, FileText } from "lucide-react";
import { EmailTemplate, SenderEmail } from "@/types";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { PlatformIndicator } from "@/components/sender-emails/PlatformIndicator";

interface SenderEmailDetailHeaderProps {
  senderEmail: SenderEmail | null;
  totalEmails: number;
  template: EmailTemplate | null;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export const SenderEmailDetailHeader = memo(function SenderEmailDetailHeader({
  senderEmail,
  totalEmails,
  template,
  dateRange,
  onDateRangeChange,
}: SenderEmailDetailHeaderProps) {
  const router = useRouter();
  const platformKey =
    senderEmail?.platform && senderEmail.platform !== "none" ? senderEmail.platform : null;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/sender-emails")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">
              {senderEmail?.email_address ?? "Loading..."}
            </h1>
            {platformKey && <PlatformIndicator platform={platformKey} size="md" />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {senderEmail?.display_name || "No display name"}
            {senderEmail?.domain && (
              <>
                <span className="mx-1.5 text-border">·</span>
                {senderEmail.domain}
              </>
            )}
            <span className="mx-1.5 text-border">·</span>
            {totalEmails} lead{totalEmails !== 1 ? "s" : ""} assigned
          </p>
          {senderEmail && (
            <button
              type="button"
              onClick={() => router.push("/templates")}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted hover:text-foreground"
              title={
                template
                  ? `Template: ${template.name}${template.subject ? ` — ${template.subject}` : ""}`
                  : "No template assigned — click to create one"
              }
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span className="max-w-[260px] truncate">
                {template ? `Template: ${template.name}` : "No template assigned"}
              </span>
            </button>
          )}
        </div>
      </div>
      <DateRangePicker date={dateRange} onDateChange={onDateRangeChange} />
    </div>
  );
});
