"use client";

import { AlertTriangle, CalendarOff, CheckCircle2, Flame, MoreHorizontal, RotateCcw, Settings2 } from "lucide-react";
import { SenderEmail, SenderWarmup } from "@/types";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SenderStats, WarmupProgress } from "@/hooks/useSenderWarmups";
import { classifyDailyLimit } from "@/lib/warmupRecommendations";

const RISK_PILL_CLASSES: Record<"emerald" | "blue" | "amber" | "red", string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  red: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
};

interface WarmupCardProps {
  sender: SenderEmail;
  warmup: SenderWarmup | null;
  progress: WarmupProgress | null;
  stats: SenderStats | null;
  onToggle: (enabled: boolean) => void;
  onOpenSettings: () => void;
  onReset: () => void;
}

function ProgressBar({
  value,
  max,
  accent,
  muted = false,
}: {
  value: number;
  max: number;
  accent: "orange" | "blue" | "green";
  muted?: boolean;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const barColors = muted
    ? "bg-muted-foreground/30"
    : {
        orange: "bg-orange-500 dark:bg-orange-400",
        blue: "bg-blue-500 dark:bg-blue-400",
        green: "bg-emerald-500 dark:bg-emerald-400",
      }[accent];

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full transition-all duration-500 ease-out ${barColors}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ProgressRow({
  label,
  value,
  max,
  accent,
  muted,
}: {
  label: string;
  value: number;
  max: number;
  accent: "orange" | "blue" | "green";
  muted?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium tabular-nums ${muted ? "text-muted-foreground" : "text-foreground"}`}>
          <span className="text-sm">{value}</span>
          <span className="text-muted-foreground"> / {max}</span>
        </span>
      </div>
      <ProgressBar value={value} max={max} accent={accent} muted={muted} />
    </div>
  );
}

function BounceIndicator({
  stats,
  thresholdPct,
  windowHours,
}: {
  stats: SenderStats;
  thresholdPct: number | null;
  windowHours: number;
}) {
  const hasThreshold = thresholdPct != null;
  const over = hasThreshold && stats.bounceRatePct > thresholdPct;
  const sampleTooSmall = stats.sentInWindow < 10;

  let tone: "ok" | "warn" | "muted" = "ok";
  if (sampleTooSmall) tone = "muted";
  else if (over) tone = "warn";

  const toneClass = {
    ok: "text-emerald-600 dark:text-emerald-400",
    warn: "text-red-600 dark:text-red-400",
    muted: "text-muted-foreground",
  }[tone];

  const Icon = tone === "warn" ? AlertTriangle : CheckCircle2;

  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className={`h-3.5 w-3.5 ${toneClass}`} />
      <span className={toneClass}>
        Bounce {stats.bounceRatePct.toFixed(1)}%
      </span>
      <span className="text-muted-foreground">
        ({stats.sentInWindow} envios últimas {windowHours}h
        {hasThreshold ? ` · limite ${thresholdPct}%` : ""})
      </span>
    </div>
  );
}

export function WarmupCard({
  sender,
  warmup,
  progress,
  stats,
  onToggle,
  onOpenSettings,
  onReset,
}: WarmupCardProps) {
  const enabled = warmup?.enabled ?? false;
  const autoPaused = !!warmup?.auto_paused_reason && !enabled;
  const startVolume = warmup?.start_volume ?? 5;
  const increment = warmup?.increment_per_day ?? 5;
  const dailyLimit = warmup?.daily_limit ?? 50;
  const businessOnly = warmup?.business_days_only ?? true;

  const senderLimit = sender.daily_limit > 0 ? sender.daily_limit : dailyLimit;
  const warmupToday = progress?.todayVolume ?? 0;
  const sentToday = stats?.sentToday ?? 0;
  const warmupDone = stats?.warmupSentToday ?? 0;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-card transition-colors ${
        autoPaused
          ? "border-red-500/40"
          : enabled
            ? "border-orange-500/30"
            : "border-border"
      }`}
    >
      {/* Auto-pause banner */}
      {autoPaused && (
        <div className="flex items-start gap-2 border-b border-red-500/30 bg-red-500/10 px-5 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <div className="min-w-0 text-xs">
            <p className="font-medium text-red-700 dark:text-red-300">
              Pausado automaticamente
            </p>
            <p className="text-red-700/80 dark:text-red-300/80">{warmup?.auto_paused_reason}</p>
          </div>
        </div>
      )}

      <div className="space-y-4 p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
              enabled
                ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Flame className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {sender.email_address}
              </h3>
              {sender.is_default && (
                <span className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  padrão
                </span>
              )}
            </div>
            {sender.display_name && (
              <p className="truncate text-xs text-muted-foreground">{sender.display_name}</p>
            )}

            {/* Plan summary */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {enabled && progress && progress.currentDay > 0 ? (
                progress.atTarget ? (
                  <span className="font-medium text-foreground">No topo · {dailyLimit}/dia</span>
                ) : (
                  <>
                    <span>
                      Dia{" "}
                      <span className="font-semibold text-foreground">{progress.currentDay}</span>
                    </span>
                    <span>·</span>
                    <span>
                      Faltam {progress.daysToTarget} dia
                      {progress.daysToTarget === 1 ? "" : "s"} pro topo
                    </span>
                  </>
                )
              ) : (
                <span>
                  Início {startVolume}/dia · +{increment}/dia · topo {dailyLimit}/dia
                </span>
              )}
              {(() => {
                const risk = classifyDailyLimit(dailyLimit);
                return (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-medium ${RISK_PILL_CLASSES[risk.tone]}`}
                    title={risk.description}
                  >
                    {risk.label}
                  </span>
                );
              })()}
              {businessOnly && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-1.5 py-0.5 font-medium text-muted-foreground">
                  <CalendarOff className="h-3 w-3" />
                  Dias úteis
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
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

        {/* Today's progress */}
        {progress?.isRestDay && enabled ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5">
            <CalendarOff className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Dia de descanso — rampa retoma no próximo dia útil
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ProgressRow
              label="Warm-up hoje"
              value={warmupDone}
              max={warmupToday}
              accent="orange"
              muted={!enabled || warmupToday === 0}
            />
            <ProgressRow
              label="Envios totais hoje"
              value={sentToday}
              max={senderLimit}
              accent="blue"
              muted={senderLimit === 0}
            />
          </div>
        )}

        {/* Bounce indicator */}
        {stats && (
          <div className="border-t border-border pt-3">
            <BounceIndicator
              stats={stats}
              thresholdPct={warmup?.bounce_threshold_pct ?? null}
              windowHours={warmup?.bounce_window_hours ?? 24}
            />
          </div>
        )}
      </div>
    </div>
  );
}
