"use client";

import { useMemo, useState } from "react";
import { Flame, Inbox, MoreHorizontal, RotateCcw, Settings2 } from "lucide-react";
import { Email } from "@/types";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { computeWarmupProgress, useWarmups } from "@/hooks/useWarmups";
import { CampaignWarmup } from "@/types";
import { WarmupSettingsDialog } from "./WarmupSettingsDialog";
import { groupEmailsByCampaign } from "./CampaignList";

interface WarmupTabProps {
  emails: Email[];
}

interface WarmupRowProps {
  campaignName: string;
  totalEmails: number;
  warmup: CampaignWarmup | null;
  onToggle: (enabled: boolean) => void;
  onOpenSettings: () => void;
  onReset: () => void;
}

function WarmupRow({
  campaignName,
  totalEmails,
  warmup,
  onToggle,
  onOpenSettings,
  onReset,
}: WarmupRowProps) {
  const enabled = warmup?.enabled ?? false;
  const progress = warmup ? computeWarmupProgress(warmup) : null;

  const startVolume = warmup?.start_volume ?? 5;
  const increment = warmup?.increment_per_day ?? 5;
  const dailyLimit = warmup?.daily_limit ?? 50;

  const progressPct =
    progress && dailyLimit > 0
      ? Math.min(100, Math.round((progress.todayVolume / dailyLimit) * 100))
      : 0;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          enabled
            ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <Flame className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground">{campaignName}</h3>
          <span className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {totalEmails} leads
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {enabled && progress ? (
            progress.atTarget ? (
              <>
                No topo ·{" "}
                <span className="font-medium text-foreground">{progress.todayVolume}</span>/dia
              </>
            ) : (
              <>
                Dia <span className="font-medium text-foreground">{progress.currentDay}</span> ·{" "}
                Hoje{" "}
                <span className="font-medium text-foreground">{progress.todayVolume}</span>/
                {dailyLimit} · Faltam {progress.daysToTarget} dia
                {progress.daysToTarget === 1 ? "" : "s"}
              </>
            )
          ) : (
            <>
              Início {startVolume}/dia · +{increment}/dia · topo {dailyLimit}/dia
            </>
          )}
        </p>

        {enabled && progress && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-orange-500 transition-all duration-300 dark:bg-orange-400"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Switch checked={enabled} onCheckedChange={onToggle} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-lg p-2 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
              aria-label="Warm-up actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={onOpenSettings}>
              <Settings2 className="mr-2 h-4 w-4" />
              Configurar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onReset} disabled={!warmup?.started_at}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar progresso
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function WarmupTab({ emails }: WarmupTabProps) {
  const { warmups, loading, setEnabled, updateSettings, resetProgress } = useWarmups();
  const [settingsFor, setSettingsFor] = useState<string | null>(null);

  const campaigns = useMemo(() => {
    const grouped = groupEmailsByCampaign(emails);
    return grouped
      .filter((c) => c.campaignName !== "No Campaign")
      .sort((a, b) => a.campaignName.localeCompare(b.campaignName));
  }, [emails]);

  const warmupByName = useMemo(() => {
    const map = new Map<string, CampaignWarmup>();
    for (const w of warmups) map.set(w.campaign_name, w);
    return map;
  }, [warmups]);

  const activeCount = warmups.filter((w) => w.enabled).length;
  const settingsWarmup = settingsFor ? warmupByName.get(settingsFor) ?? null : null;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="animate-fade-up flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted/50">
          <Inbox className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">Nenhuma campanha</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Crie uma campanha primeiro para configurar warm-up.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <p className="text-sm font-medium text-foreground">Warm-up</p>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{activeCount}</span> ativo
          {activeCount === 1 ? "" : "s"} · {campaigns.length} campanha
          {campaigns.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {campaigns.map((c) => {
          const warmup = warmupByName.get(c.campaignName) ?? null;
          return (
            <WarmupRow
              key={c.campaignName}
              campaignName={c.campaignName}
              totalEmails={c.totalEmails}
              warmup={warmup}
              onToggle={(enabled) => setEnabled(c.campaignName, enabled)}
              onOpenSettings={() => setSettingsFor(c.campaignName)}
              onReset={() => resetProgress(c.campaignName)}
            />
          );
        })}
      </div>

      <WarmupSettingsDialog
        open={!!settingsFor}
        onOpenChange={(open) => !open && setSettingsFor(null)}
        campaignName={settingsFor ?? ""}
        warmup={settingsWarmup}
        onSave={async (values) => {
          if (settingsFor) await updateSettings(settingsFor, values);
        }}
      />
    </>
  );
}
