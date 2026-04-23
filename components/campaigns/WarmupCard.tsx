"use client";

import { AlertTriangle, MoreHorizontal, RotateCcw, Settings2 } from "lucide-react";
import { SenderEmail, SenderWarmup } from "@/types";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SenderStats, WarmupProgress } from "@/hooks/useSenderWarmups";
import { WARMUP_LIMITS, classifyDailyLimit } from "@/lib/warmupRecommendations";

function relativeFromNow(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days}d ago`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours}h ago`;
  return "just now";
}

interface WarmupCardProps {
  sender: SenderEmail;
  warmup: SenderWarmup | null;
  progress: WarmupProgress | null;
  stats: SenderStats | null;
  onToggle: (enabled: boolean) => void;
  onOpenSettings: () => void;
  onReset: () => void;
}

type CardState = "off" | "active" | "rest" | "auto_paused";

function resolveState(
  warmup: SenderWarmup | null,
  progress: WarmupProgress | null,
): CardState {
  if (warmup?.auto_paused_reason && !warmup.enabled) return "auto_paused";
  if (!warmup?.enabled) return "off";
  if (progress?.isRestDay) return "rest";
  return "active";
}

function StatusDot({ state }: { state: CardState }) {
  const tone = {
    off: "bg-muted-foreground/30",
    active: "bg-emerald-500",
    rest: "bg-amber-500",
    auto_paused: "bg-red-500",
  }[state];
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${tone}`} />;
}

function ProgressLine({
  label,
  value,
  max,
  muted,
}: {
  label: string;
  value: number;
  max: number;
  muted?: boolean;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={`font-medium tabular-nums ${muted ? "text-muted-foreground" : "text-foreground"}`}
        >
          {value}
          <span className="text-muted-foreground"> / {max}</span>
        </span>
      </div>
      <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-border/60">
        <div
          className={`h-full transition-all duration-500 ease-out ${muted ? "bg-muted-foreground/40" : "bg-foreground/80"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
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
  const state = resolveState(warmup, progress);
  const startVolume = warmup?.start_volume ?? 5;
  const increment = warmup?.increment_per_day ?? 1;
  const dailyLimit = warmup?.daily_limit ?? WARMUP_LIMITS.OPTIMAL;
  const businessOnly = warmup?.business_days_only ?? true;

  const senderLimit = sender.daily_limit > 0 ? sender.daily_limit : dailyLimit;
  const warmupToday = progress?.todayVolume ?? 0;
  const sentToday = stats?.sentToday ?? 0;
  const warmupDone = stats?.warmupSentToday ?? 0;

  const risk = classifyDailyLimit(dailyLimit);

  const bounceRate = stats?.bounceRatePct ?? 0;
  const bounceSample = stats?.sentInWindow ?? 0;
  const bounceOver =
    warmup?.bounce_threshold_pct != null &&
    bounceSample >= 10 &&
    bounceRate > warmup.bounce_threshold_pct;

  return (
    <div className="relative flex gap-4 overflow-hidden rounded-lg border border-border bg-card p-4">
      {/* Status strip */}
      <div
        className={`absolute inset-y-0 left-0 w-[2px] ${
          state === "active"
            ? "bg-emerald-500"
            : state === "auto_paused"
              ? "bg-red-500"
              : state === "rest"
                ? "bg-amber-500"
                : "bg-transparent"
        }`}
      />

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {/* Row 1: identity + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusDot state={state} />
              <p className="truncate text-sm font-medium text-foreground">
                {sender.email_address}
              </p>
              {sender.is_default && (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  default
                </span>
              )}
            </div>
            {sender.display_name && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {sender.display_name}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Switch checked={enabled} onCheckedChange={onToggle} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Warm-up actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={onOpenSettings}>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onReset} disabled={!warmup?.started_at}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset progress
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Row 2: plan summary — plain text, dot-separated */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {enabled && progress && progress.currentDay > 0 ? (
            progress.atTarget ? (
              <>
                <span>
                  At target <span className="font-medium text-foreground">{dailyLimit}/day</span>
                </span>
                {warmup?.topped_out_at && (
                  <>
                    <span className="text-border">·</span>
                    <span>cruise {relativeFromNow(warmup.topped_out_at)}</span>
                  </>
                )}
              </>
            ) : (
              <>
                <span>
                  Day <span className="font-medium text-foreground">{progress.currentDay}</span>
                </span>
                <span className="text-border">·</span>
                <span>Target {dailyLimit}/day</span>
                <span className="text-border">·</span>
                <span>
                  +{increment}/day
                </span>
              </>
            )
          ) : (
            <>
              <span>Start {startVolume}/day</span>
              <span className="text-border">·</span>
              <span>+{increment}/day</span>
              <span className="text-border">·</span>
              <span>Target {dailyLimit}/day</span>
            </>
          )}
          {businessOnly && (
            <>
              <span className="text-border">·</span>
              <span>Business days</span>
            </>
          )}
          {risk.level === "very_risky" && (
            <>
              <span className="text-border">·</span>
              <span className="text-red-600 dark:text-red-400">Very risky</span>
            </>
          )}
          {risk.level === "risky" && (
            <>
              <span className="text-border">·</span>
              <span className="text-amber-600 dark:text-amber-400">Risky</span>
            </>
          )}
        </div>

        {/* Row 3: progress bars */}
        {state === "rest" ? (
          <p className="text-[11px] text-muted-foreground">
            Rest day — the ramp resumes on the next business day.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ProgressLine
              label="Warm-up today"
              value={warmupDone}
              max={warmupToday}
              muted={!enabled || warmupToday === 0}
            />
            <ProgressLine
              label="Total sends"
              value={sentToday}
              max={senderLimit}
              muted={senderLimit === 0}
            />
          </div>
        )}

        {/* Row 4: footer */}
        {(stats || state === "auto_paused") && (
          <div className="flex items-center justify-between border-t border-border pt-2.5 text-[11px]">
            {state === "auto_paused" ? (
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3 w-3" />
                <span>Auto-paused · {warmup?.auto_paused_reason}</span>
              </div>
            ) : stats ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>
                  Bounce{" "}
                  <span
                    className={`font-medium tabular-nums ${
                      bounceOver
                        ? "text-red-600 dark:text-red-400"
                        : bounceSample < 10
                          ? "text-muted-foreground"
                          : "text-foreground"
                    }`}
                  >
                    {bounceRate.toFixed(1)}%
                  </span>
                </span>
                <span className="text-border">·</span>
                <span>{bounceSample} sends in {warmup?.bounce_window_hours ?? 24}h</span>
                {warmup?.bounce_threshold_pct != null && (
                  <>
                    <span className="text-border">·</span>
                    <span>threshold {warmup.bounce_threshold_pct}%</span>
                  </>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
