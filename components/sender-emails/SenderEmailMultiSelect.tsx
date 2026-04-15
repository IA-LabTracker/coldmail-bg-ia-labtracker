"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { SenderEmail } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SenderEmailMultiSelectProps {
  senderEmails: SenderEmail[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
  manual: "Manual",
  resend: "Resend",
  zapmail: "Zapmail",
  ses: "SES",
  mailgun: "Mailgun",
  smtp: "SMTP",
};

const PLATFORM_LABELS: Record<string, string> = {
  smartlead: "SmartLead",
  resend: "Resend",
  zapmail: "Zapmail",
  none: "Outros",
};

export function SenderEmailMultiSelect({
  senderEmails,
  selectedIds,
  onChange,
  placeholder = "Selecionar remetentes",
  disabled = false,
}: SenderEmailMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const activeEmails = useMemo(
    () => senderEmails.filter((se) => se.status === "active"),
    [senderEmails],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, SenderEmail[]>();
    for (const se of activeEmails) {
      const key = se.platform && se.platform !== "none" ? se.platform : "none";
      const list = map.get(key) ?? [];
      list.push(se);
      map.set(key, list);
    }
    const entries = Array.from(map.entries()).sort((a, b) => {
      if (a[0] === "none") return 1;
      if (b[0] === "none") return -1;
      return a[0].localeCompare(b[0]);
    });
    return entries;
  }, [activeEmails]);

  const toggleEmail = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const togglePlatform = (platformEmails: SenderEmail[]) => {
    const platformIds = platformEmails.map((se) => se.id);
    const allSelected = platformIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      onChange(selectedIds.filter((id) => !platformIds.includes(id)));
    } else {
      const newIds = new Set([...selectedIds, ...platformIds]);
      onChange(Array.from(newIds));
    }
  };

  const toggleAll = () => {
    const allIds = activeEmails.map((se) => se.id);
    if (selectedIds.length === allIds.length) {
      onChange([]);
    } else {
      onChange(allIds);
    }
  };

  const triggerLabel = useMemo(() => {
    if (selectedIds.length === 0) return placeholder;
    if (selectedIds.length === activeEmails.length && activeEmails.length > 0) {
      return `Todos os remetentes (${activeEmails.length})`;
    }
    if (selectedIds.length === 1) {
      const se = activeEmails.find((e) => e.id === selectedIds[0]);
      return se?.email_address ?? "1 selecionado";
    }
    return `${selectedIds.length} remetentes`;
  }, [selectedIds, activeEmails, placeholder]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm transition-colors",
          "hover:bg-accent/50",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "ring-1 ring-ring",
          selectedIds.length === 0 ? "text-muted-foreground" : "text-foreground",
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown
          className={cn(
            "ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[340px] rounded-md border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-1">
          <div className="max-h-[280px] overflow-y-auto py-1">
            {/* Select all */}
            {activeEmails.length > 0 && (
              <>
                <div
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-muted/60"
                  onClick={toggleAll}
                >
                  <Checkbox
                    checked={
                      selectedIds.length === activeEmails.length && activeEmails.length > 0
                        ? true
                        : selectedIds.length > 0
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={toggleAll}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-sm font-medium text-foreground">
                    Todos ({activeEmails.length})
                  </span>
                </div>
                <div className="mx-2 border-b" />
              </>
            )}

            {/* Groups */}
            {grouped.map(([platform, emails], groupIdx) => {
              const platformIds = emails.map((se) => se.id);
              const allPlatformSelected = platformIds.every((id) =>
                selectedIds.includes(id),
              );
              const somePlatformSelected =
                !allPlatformSelected &&
                platformIds.some((id) => selectedIds.includes(id));

              return (
                <div key={platform}>
                  {groupIdx > 0 && <div className="mx-2 border-b" />}

                  {/* Platform header */}
                  <div
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 hover:bg-muted/60"
                    onClick={() => togglePlatform(emails)}
                  >
                    <Checkbox
                      checked={
                        allPlatformSelected
                          ? true
                          : somePlatformSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={() => togglePlatform(emails)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {PLATFORM_LABELS[platform] ?? platform}
                    </span>
                    <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                      {platformIds.filter((id) => selectedIds.includes(id)).length}/{emails.length}
                    </span>
                  </div>

                  {/* Emails */}
                  {emails.map((se) => {
                    const isSelected = selectedIds.includes(se.id);
                    return (
                      <div
                        key={se.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 py-1.5 pl-6 pr-3 transition-colors hover:bg-muted/60",
                          isSelected && "bg-muted/30",
                        )}
                        onClick={() => toggleEmail(se.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleEmail(se.id)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="truncate text-sm text-foreground">
                          {se.email_address}
                        </span>
                        {se.provider !== "manual" && (
                          <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                            {PROVIDER_LABELS[se.provider] ?? se.provider}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {activeEmails.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                Nenhum remetente ativo.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
