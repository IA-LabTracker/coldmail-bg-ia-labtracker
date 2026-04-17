"use client";

import { Pencil, Copy, Trash2, Star } from "lucide-react";
import { EmailTemplate } from "@/types";
import { formatDate } from "@/lib/formatDate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TemplatePlatformBadge } from "./TemplatePlatformBadge";
import { TemplatePreview } from "./TemplatePreview";

interface TemplateDetailModalProps {
  template: EmailTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (template: EmailTemplate) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function TemplateDetailModal({
  template,
  open,
  onOpenChange,
  onEdit,
  onDuplicate,
  onDelete,
  onSetDefault,
}: TemplateDetailModalProps) {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[640px]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="truncate text-base">{template.name}</DialogTitle>
                {template.is_default && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-400">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Default
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <TemplatePlatformBadge platform={template.platform} />
                <span className="text-border">·</span>
                <span>Updated {formatDate(template.updated_at)}</span>
              </div>
              {template.description && (
                <p className="mt-2 text-xs text-muted-foreground">{template.description}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-1">
          <TemplatePreview html={template.body_html} subject={template.subject} />
        </div>

        <DialogFooter className="flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(template.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
            {!template.is_default && (
              <Button variant="ghost" size="sm" onClick={() => onSetDefault(template.id)}>
                <Star className="mr-1 h-3.5 w-3.5" />
                Set default
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDuplicate(template.id);
                onOpenChange(false);
              }}
            >
              <Copy className="mr-1 h-3.5 w-3.5" />
              Duplicate
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onEdit(template);
                onOpenChange(false);
              }}
            >
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
