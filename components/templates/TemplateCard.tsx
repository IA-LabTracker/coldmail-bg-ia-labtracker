"use client";

import { MoreHorizontal, Star } from "lucide-react";
import { EmailTemplate } from "@/types";
import { formatDate } from "@/lib/formatDate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplatePlatformBadge, TemplateTypeIcon } from "./TemplatePlatformBadge";
import { TemplatePreview } from "./TemplatePreview";

interface TemplateCardProps {
  template: EmailTemplate;
  index: number;
  onEdit: (template: EmailTemplate) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPreview: (template: EmailTemplate) => void;
}

export function TemplateCard({
  template,
  index,
  onEdit,
  onDelete,
  onSetDefault,
  onDuplicate,
  onPreview,
}: TemplateCardProps) {
  return (
    <div
      className="animate-list-item hover-lift group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30"
      style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
      onClick={() => onPreview(template)}
    >
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-border px-4 py-3">
        <div className="mt-0.5 shrink-0">
          <TemplateTypeIcon platform={template.platform} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
              {template.name}
            </h3>
            {template.is_default && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-400">
                <Star className="h-2.5 w-2.5 fill-current" />
                Default
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {template.subject || "No subject"}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="shrink-0 rounded-md p-1 text-muted-foreground/40 opacity-0 transition-all hover:bg-muted hover:text-muted-foreground group-hover:opacity-100 focus-visible:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onEdit(template)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(template.id)}>Duplicate</DropdownMenuItem>
            {!template.is_default && (
              <DropdownMenuItem onClick={() => onSetDefault(template.id)}>
                Set as default
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(template.id)}
            >
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Preview */}
      <div className="flex-1 bg-muted/20 p-3">
        <TemplatePreview html={template.body_html} className="border-0 bg-card shadow-sm" compact />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <TemplatePlatformBadge platform={template.platform} />
        <span className="text-[10px] text-muted-foreground/70">
          {formatDate(template.updated_at)}
        </span>
      </div>
    </div>
  );
}
