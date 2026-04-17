"use client";

import { useState, useEffect, useMemo } from "react";
import { Eye, Loader2, Pencil } from "lucide-react";
import { EmailTemplate, EmailTemplatePlatform } from "@/types";
import { CreateTemplateInput, UpdateTemplateInput } from "@/hooks/useTemplates";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TemplatePreview } from "./TemplatePreview";

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate: EmailTemplate | null;
  onSave: (input: CreateTemplateInput) => Promise<EmailTemplate | null>;
  onUpdate: (id: string, updates: UpdateTemplateInput) => Promise<boolean>;
}

const PLATFORM_OPTIONS: { value: EmailTemplatePlatform; label: string; hint: string }[] = [
  { value: "any", label: "Any platform", hint: "Available for all email dispatches" },
  { value: "smartlead", label: "SmartLead", hint: "Use with SmartLead dispatches" },
  { value: "resend", label: "Resend", hint: "Use with Resend dispatches" },
  { value: "zapmail", label: "Zapmail", hint: "Use with Zapmail dispatches" },
  { value: "linkedin", label: "LinkedIn", hint: "LinkedIn outreach messages" },
];

const VARIABLES = [
  "{{company}}",
  "{{lead_name}}",
  "{{email}}",
  "{{region}}",
  "{{industry}}",
  "{{firstName}}",
  "{{lastName}}",
  "{{position}}",
];

export function TemplateFormDialog({
  open,
  onOpenChange,
  editingTemplate,
  onSave,
  onUpdate,
}: TemplateFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [platform, setPlatform] = useState<EmailTemplatePlatform>("any");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    if (open && editingTemplate) {
      setName(editingTemplate.name);
      setDescription(editingTemplate.description ?? "");
      setSubject(editingTemplate.subject ?? "");
      setBodyHtml(editingTemplate.body_html ?? "");
      setPlatform(editingTemplate.platform);
      setIsDefault(editingTemplate.is_default);
      setMode("edit");
    } else if (open) {
      setName("");
      setDescription("");
      setSubject("");
      setBodyHtml("");
      setPlatform("any");
      setIsDefault(false);
      setMode("edit");
    }
  }, [open, editingTemplate]);

  const isValid = name.trim().length > 0 && subject.trim().length > 0 && bodyHtml.trim().length > 0;
  const isEditing = !!editingTemplate;

  const handleInsertVariable = (variable: string) => {
    setBodyHtml((prev) => `${prev}${prev.endsWith(" ") || !prev ? "" : " "}${variable}`);
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setSaving(true);

    let success: boolean;
    if (editingTemplate) {
      success = await onUpdate(editingTemplate.id, {
        name,
        description,
        subject,
        body_html: bodyHtml,
        platform,
        is_default: isDefault,
      });
    } else {
      const result = await onSave({
        name,
        description,
        subject,
        body_html: bodyHtml,
        platform,
        is_default: isDefault,
      });
      success = !!result;
    }

    setSaving(false);
    if (success) onOpenChange(false);
  };

  const platformHint = useMemo(
    () => PLATFORM_OPTIONS.find((p) => p.value === platform)?.hint ?? "",
    [platform],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[720px]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-base">
                {isEditing ? "Edit template" : "New template"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the content, subject, or platform scope."
                  : "Create a reusable template to send across campaigns."}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setMode("edit")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  mode === "edit"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  mode === "preview"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Eye className="h-3 w-3" />
                Preview
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto py-1">
          {mode === "edit" ? (
            <>
              {/* Name + Platform row */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="tpl-name" className="text-xs text-muted-foreground">
                    Name
                  </Label>
                  <Input
                    id="tpl-name"
                    placeholder="Building cleaning question"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Platform</Label>
                  <Select
                    value={platform}
                    onValueChange={(v) => setPlatform(v as EmailTemplatePlatform)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground/60">{platformHint}</p>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <Label htmlFor="tpl-subject" className="text-xs text-muted-foreground">
                  Subject
                </Label>
                <Input
                  id="tpl-subject"
                  placeholder="Quick question about {{company}}"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="tpl-description" className="text-xs text-muted-foreground">
                  Description
                  <span className="ml-1 text-muted-foreground/50">(optional)</span>
                </Label>
                <Input
                  id="tpl-description"
                  placeholder="Internal notes about when to use this template"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <Label htmlFor="tpl-body" className="text-xs text-muted-foreground">
                  Body (HTML supported)
                </Label>
                <Textarea
                  id="tpl-body"
                  placeholder={`<strong>Hey {{lead_name}},</strong>\n<p>I wanted to see if...</p>`}
                  className="min-h-[220px] resize-y font-mono text-xs"
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                />
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">Set as default</p>
                  <p className="text-[11px] text-muted-foreground/70">
                    Auto-selected for this platform when none is chosen.
                  </p>
                </div>
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
              </div>
            </>
          ) : (
            <TemplatePreview html={bodyHtml} subject={subject} />
          )}
        </div>

        <DialogFooter className="border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!isValid || saving}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isEditing ? (
              "Save"
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
