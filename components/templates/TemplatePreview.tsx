"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface TemplatePreviewProps {
  html: string;
  subject?: string;
  className?: string;
  compact?: boolean;
}

const DEMO_VARS: Record<string, string> = {
  company: "Acme Corp",
  email: "alex@acme.com",
  region: "São Paulo",
  industry: "SaaS",
  firstName: "Alex",
  lastName: "Doe",
  position: "Head of Growth",
};

function renderPreview(html: string): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => DEMO_VARS[key] ?? `{{${key}}}`);
}

export function TemplatePreview({ html, subject, className, compact }: TemplatePreviewProps) {
  const rendered = useMemo(() => renderPreview(html || ""), [html]);
  const renderedSubject = useMemo(() => (subject ? renderPreview(subject) : ""), [subject]);

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      {renderedSubject && (
        <div className="border-b border-border bg-muted/30 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Subject
          </p>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground">{renderedSubject}</p>
        </div>
      )}
      <div
        className={cn(
          "template-preview-body px-4 py-3 text-sm leading-relaxed text-foreground",
          compact && "max-h-32 overflow-hidden text-xs",
        )}
        dangerouslySetInnerHTML={{
          __html: rendered || '<p class="text-muted-foreground italic">Empty template</p>',
        }}
      />
    </div>
  );
}
