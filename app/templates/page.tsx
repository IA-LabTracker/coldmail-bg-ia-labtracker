"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, FileText, Search } from "lucide-react";
import { EmailTemplate, EmailTemplatePlatform } from "@/types";
import { useTemplates } from "@/hooks/useTemplates";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplateFormDialog } from "@/components/templates/TemplateFormDialog";
import { TemplateDetailModal } from "@/components/templates/TemplateDetailModal";

type PlatformFilter = "all" | EmailTemplatePlatform;

const PLATFORM_TABS: { value: PlatformFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "any", label: "Any" },
  { value: "smartlead", label: "SmartLead" },
  { value: "resend", label: "Resend" },
  { value: "zapmail", label: "Zapmail" },
  { value: "linkedin", label: "LinkedIn" },
];

export default function TemplatesPage() {
  const {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefault,
    duplicateTemplate,
  } = useTemplates();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (platformFilter !== "all" && t.platform !== platformFilter) return false;
      if (!term) return true;
      return (
        t.name.toLowerCase().includes(term) ||
        t.subject.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term)
      );
    });
  }, [templates, search, platformFilter]);

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    for (const t of templates) counts[t.platform] = (counts[t.platform] ?? 0) + 1;
    return counts;
  }, [templates]);

  const handleOpenCreate = useCallback(() => {
    setEditingTemplate(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteTemplate(id);
    },
    [deleteTemplate],
  );

  const handleDuplicate = useCallback(
    async (id: string) => {
      await duplicateTemplate(id);
    },
    [duplicateTemplate],
  );

  const handleSetDefault = useCallback(
    async (id: string) => {
      await setDefault(id);
    },
    [setDefault],
  );

  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Templates</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Reusable email and LinkedIn templates for your outreach
            </p>
          </div>
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New template
          </Button>
        </div>

        {/* Filters */}
        {(!loading && templates.length > 0) && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
              {PLATFORM_TABS.map((tab) => {
                const count = platformCounts[tab.value] ?? 0;
                const isActive = platformFilter === tab.value;
                if (tab.value !== "all" && count === 0) return null;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setPlatformFilter(tab.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-[10px] tabular-nums",
                        isActive ? "bg-muted text-foreground" : "text-muted-foreground/70",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="mt-3 h-24 w-full" />
                <div className="mt-3 flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No templates yet</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Create reusable templates to speed up your campaigns.
            </p>
            <Button onClick={handleOpenCreate} variant="outline" size="sm" className="mt-5">
              Create your first template
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">No templates match your filters</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSearch("");
                setPlatformFilter("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
                onDuplicate={handleDuplicate}
                onPreview={setPreviewTemplate}
              />
            ))}
          </div>
        )}
      </div>

      <TemplateFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        editingTemplate={editingTemplate}
        onSave={createTemplate}
        onUpdate={updateTemplate}
      />

      <TemplateDetailModal
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
      />
    </AppLayout>
  );
}
