"use client";

import { useState, useEffect } from "react";
import { SenderEmail, SenderEmailProvider, SenderEmailPlatform } from "@/types";
import { CreateSenderEmailInput, UpdateSenderEmailInput } from "@/hooks/useSenderEmails";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { PlatformIndicator } from "@/components/sender-emails/PlatformIndicator";

interface CreateSenderEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEmail: SenderEmail | null;
  onSave: (input: CreateSenderEmailInput) => Promise<boolean>;
  onUpdate: (id: string, updates: UpdateSenderEmailInput) => Promise<boolean>;
}

const PROVIDER_OPTIONS: { value: SenderEmailProvider; label: string }[] = [
  { value: "google", label: "Google / Gmail" },
  { value: "outlook", label: "Outlook" },
  { value: "manual", label: "Manual / SMTP" },
  { value: "resend", label: "Resend" },
  { value: "zapmail", label: "Zapmail" },
  { value: "ses", label: "Amazon SES" },
  { value: "mailgun", label: "Mailgun" },
  { value: "smtp", label: "Custom SMTP" },
];

const PLATFORM_OPTIONS: { value: SenderEmailPlatform; label: string }[] = [
  { value: "none", label: "None" },
  { value: "google", label: "Google / Gmail" },
  { value: "outlook", label: "Outlook" },
  { value: "smartlead", label: "SmartLead" },
  { value: "resend", label: "Resend" },
  { value: "zapmail", label: "Zapmail" },
];

export function CreateSenderEmailDialog({
  open,
  onOpenChange,
  editingEmail,
  onSave,
  onUpdate,
}: CreateSenderEmailDialogProps) {
  const [emailAddress, setEmailAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [provider, setProvider] = useState<SenderEmailProvider>("manual");
  const [platform, setPlatform] = useState<SenderEmailPlatform>("none");
  const [dailyLimit, setDailyLimit] = useState(0);
  const [providerId, setProviderId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && editingEmail) {
      setEmailAddress(editingEmail.email_address);
      setDisplayName(editingEmail.display_name);
      setProvider(editingEmail.provider);
      setPlatform(editingEmail.platform ?? "none");
      setDailyLimit(editingEmail.daily_limit ?? 0);
      setProviderId(editingEmail.provider_id ?? "");
    } else if (open) {
      setEmailAddress("");
      setDisplayName("");
      setProvider("manual");
      setPlatform("none");
      setDailyLimit(0);
      setProviderId("");
    }
  }, [open, editingEmail]);

  const isValid = emailAddress.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress.trim());

  const handleSubmit = async () => {
    if (!isValid) return;
    setSaving(true);

    let success: boolean;
    if (editingEmail) {
      success = await onUpdate(editingEmail.id, {
        email_address: emailAddress,
        display_name: displayName,
        provider,
        platform,
        daily_limit: dailyLimit,
        provider_id: providerId.trim() || null,
      });
    } else {
      const result = await onSave({
        email_address: emailAddress,
        display_name: displayName,
        provider,
        platform,
        daily_limit: dailyLimit,
        provider_id: providerId.trim() || undefined,
      });
      success = !!result;
    }

    setSaving(false);
    if (success) {
      onOpenChange(false);
    }
  };

  const isEditing = !!editingEmail;
  const showProviderId = provider !== "manual";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isEditing ? "Edit sender email" : "Add sender email"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the email address or provider configuration."
              : "This address will be available as a sender when dispatching campaigns."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sender-email-address" className="text-xs text-muted-foreground">
                Email address
              </Label>
              <Input
                id="sender-email-address"
                type="email"
                placeholder="you@company.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sender-display-name" className="text-xs text-muted-foreground">
                Display name
              </Label>
              <Input
                id="sender-display-name"
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Provider</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as SenderEmailProvider)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <PlatformIndicator platform={opt.value} size="md" iconOnly />
                        <span>{opt.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Dispatch Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as SenderEmailPlatform)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        {opt.value !== "none" ? (
                          <PlatformIndicator platform={opt.value} size="md" iconOnly />
                        ) : (
                          <span className="inline-block h-4 w-4 shrink-0" />
                        )}
                        <span>{opt.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sender-daily-limit" className="text-xs text-muted-foreground">
                Daily send limit
              </Label>
              <Input
                id="sender-daily-limit"
                type="number"
                min={0}
                placeholder="0 = unlimited"
                value={dailyLimit || ""}
                onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
              />
            </div>

            {showProviderId && (
              <div className="space-y-1.5">
                <Label htmlFor="sender-provider-id" className="text-xs text-muted-foreground">
                  Provider ID
                  <span className="ml-1 font-normal text-muted-foreground/50">
                    ({PROVIDER_OPTIONS.find((o) => o.value === provider)?.label ?? provider})
                  </span>
                </Label>
                <Input
                  id="sender-provider-id"
                  placeholder="Domain ID or API identifier"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!isValid || saving}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isEditing ? (
              "Save"
            ) : (
              "Add"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
