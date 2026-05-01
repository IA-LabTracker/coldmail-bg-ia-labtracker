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

// Escapes the user-supplied HTML so it can be placed inside an iframe srcDoc
// attribute without breaking the surrounding markup. Sandbox flags below
// neutralise scripts even if the body contains <script>.
function buildSrcDoc(html: string, compact: boolean): string {
  const body = html || '<p style="color:#6b7280;font-style:italic">Empty template</p>';
  const heightStyle = compact ? "max-height:128px;overflow:hidden;" : "";
  return `<!doctype html>
<html><head>
  <meta charset="utf-8">
  <base target="_blank">
  <style>
    html,body{margin:0;padding:0;background:transparent;color:inherit;
      font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Inter,sans-serif;
      font-size:${compact ? "12px" : "14px"};line-height:1.5;${heightStyle}}
    body{padding:12px 16px;}
    a{color:#2563eb;text-decoration:underline;}
    img{max-width:100%;height:auto;}
  </style>
</head>
<body>${body}</body></html>`;
}

export function TemplatePreview({ html, subject, className, compact }: TemplatePreviewProps) {
  const rendered = useMemo(() => renderPreview(html || ""), [html]);
  const renderedSubject = useMemo(() => (subject ? renderPreview(subject) : ""), [subject]);
  const srcDoc = useMemo(() => buildSrcDoc(rendered, !!compact), [rendered, compact]);

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
      <iframe
        title="Template preview"
        sandbox=""
        srcDoc={srcDoc}
        className={cn("w-full border-0", compact ? "h-32" : "h-64")}
      />
    </div>
  );
}
