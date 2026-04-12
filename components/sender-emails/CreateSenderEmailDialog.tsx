"use client";

import { useState, useEffect } from "react";
import { SenderEmail, SenderEmailProvider } from "@/types";
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

interface CreateSenderEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEmail: SenderEmail | null;
  onSave: (input: CreateSenderEmailInput) => Promise<boolean>;
  onUpdate: (id: string, updates: UpdateSenderEmailInput) => Promise<boolean>;
}

const PROVIDER_OPTIONS: { value: SenderEmailProvider; label: string }[] = [
  { value: "manual", label: "Manual / SMTP" },
  { value: "resend", label: "Resend" },
  { value: "zapmail", label: "Zapmail" },
  { value: "ses", label: "Amazon SES" },
  { value: "mailgun", label: "Mailgun" },
  { value: "smtp", label: "Custom SMTP" },
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
  const [providerId, setProviderId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && editingEmail) {
      setEmailAddress(editingEmail.email_address);
      setDisplayName(editingEmail.display_name);
      setProvider(editingEmail.provider);
      setProviderId(editingEmail.provider_id ?? "");
    } else if (open) {
      setEmailAddress("");
      setDisplayName("");
      setProvider("manual");
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
        provider_id: providerId.trim() || null,
      });
    } else {
      const result = await onSave({
        email_address: emailAddress,
        display_name: displayName,
        provider,
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
      <DialogContent className="sm:max-w-[420px]">
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

        <div className="space-y-4 py-1">
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
            <p className="text-[11px] text-muted-foreground/60">
              Shown as the &quot;From&quot; name to recipients.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as SenderEmailProvider)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground/60">
              Where this email is hosted. Used to route dispatches correctly.
            </p>
          </div>

          {showProviderId && (
            <div className="space-y-1.5">
              <Label htmlFor="sender-provider-id" className="text-xs text-muted-foreground">
                Provider ID
              </Label>
              <Input
                id="sender-provider-id"
                placeholder="e.g. domain ID or API identifier"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground/60">
                The identifier for this email or domain in {PROVIDER_OPTIONS.find((o) => o.value === provider)?.label ?? provider}.
              </p>
            </div>
          )}
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
