"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { SenderWarmup } from "@/types";
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
import { Switch } from "@/components/ui/switch";
import type { WarmupSettingsInput } from "@/hooks/useSenderWarmups";
import { WARMUP_LIMITS, classifyDailyLimit, daysToReach } from "@/lib/warmupRecommendations";

interface WarmupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  senderLabel: string;
  warmup: SenderWarmup | null;
  onSave: (values: Required<WarmupSettingsInput>) => Promise<void>;
}

// Defaults tuned to industry rule-of-thumb: 5 → +1/day reaches 15 (optimal)
// around day 11, giving a gentle 14-day ramp for new mailboxes.
const DEFAULTS: Required<WarmupSettingsInput> = {
  start_volume: 5,
  increment_per_day: 1,
  daily_limit: WARMUP_LIMITS.OPTIMAL,
  business_days_only: true,
  bounce_threshold_pct: 5,
  bounce_window_hours: 24,
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div className="mb-3">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function InlineToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function WarmupSettingsDialog({
  open,
  onOpenChange,
  senderLabel,
  warmup,
  onSave,
}: WarmupSettingsDialogProps) {
  const [startVolume, setStartVolume] = useState(DEFAULTS.start_volume);
  const [increment, setIncrement] = useState(DEFAULTS.increment_per_day);
  const [dailyLimit, setDailyLimit] = useState(DEFAULTS.daily_limit);
  const [businessDaysOnly, setBusinessDaysOnly] = useState(DEFAULTS.business_days_only);
  const [bounceEnabled, setBounceEnabled] = useState(true);
  const [bounceThreshold, setBounceThreshold] = useState(DEFAULTS.bounce_threshold_pct as number);
  const [bounceWindow, setBounceWindow] = useState(DEFAULTS.bounce_window_hours);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStartVolume(warmup?.start_volume ?? DEFAULTS.start_volume);
    setIncrement(warmup?.increment_per_day ?? DEFAULTS.increment_per_day);
    setDailyLimit(warmup?.daily_limit ?? DEFAULTS.daily_limit);
    setBusinessDaysOnly(warmup?.business_days_only ?? DEFAULTS.business_days_only);
    setBounceEnabled(warmup?.bounce_threshold_pct != null);
    setBounceThreshold(warmup?.bounce_threshold_pct ?? (DEFAULTS.bounce_threshold_pct as number));
    setBounceWindow(warmup?.bounce_window_hours ?? DEFAULTS.bounce_window_hours);
  }, [open, warmup]);

  const error =
    startVolume < 1
      ? "Initial volume must be ≥ 1"
      : increment < 0
        ? "Increment can't be negative"
        : dailyLimit < startVolume
          ? "Daily target must be ≥ initial volume"
          : bounceEnabled && (bounceThreshold <= 0 || bounceThreshold > 100)
            ? "Bounce limit must be between 0 and 100%"
            : bounceEnabled && bounceWindow < 1
              ? "Window must be ≥ 1 hour"
              : null;

  const risk = classifyDailyLimit(dailyLimit);
  const rampDays = daysToReach(startVolume, increment, dailyLimit);
  const rampTooFast =
    Number.isFinite(rampDays) && rampDays < WARMUP_LIMITS.MIN_WARMUP_DAYS && increment > 0;

  const riskLabelTone = {
    safe: "text-muted-foreground",
    optimal: "text-foreground",
    risky: "text-amber-600 dark:text-amber-400",
    very_risky: "text-red-600 dark:text-red-400",
  }[risk.level];

  const handleSave = async () => {
    if (error) return;
    setSaving(true);
    await onSave({
      start_volume: startVolume,
      increment_per_day: increment,
      daily_limit: dailyLimit,
      business_days_only: businessDaysOnly,
      bounce_threshold_pct: bounceEnabled ? bounceThreshold : null,
      bounce_window_hours: bounceWindow,
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Warm-up settings</DialogTitle>
          <DialogDescription className="text-xs">{senderLabel}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          <Section
            title="Sending ramp"
            description="Volume grows gradually up to the daily target"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start_volume" className="text-xs text-muted-foreground">
                  Initial volume
                </Label>
                <Input
                  id="start_volume"
                  type="number"
                  min={1}
                  value={startVolume}
                  onChange={(e) => setStartVolume(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="increment" className="text-xs text-muted-foreground">
                  + per day
                </Label>
                <Input
                  id="increment"
                  type="number"
                  min={0}
                  value={increment}
                  onChange={(e) => setIncrement(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="daily_limit" className="text-xs text-muted-foreground">
                  Daily target
                </Label>
                <Input
                  id="daily_limit"
                  type="number"
                  min={1}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                {increment > 0
                  ? `Reaches ${dailyLimit}/day in ${rampDays} day${rampDays === 1 ? "" : "s"}`
                  : `No increment — ${startVolume}/day always`}
              </span>
              <span className={riskLabelTone}>{risk.label}</span>
            </div>

            {risk.level === "very_risky" && (
              <div className="flex items-start gap-1.5 text-[11px] text-red-600 dark:text-red-400">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  Above {WARMUP_LIMITS.MAX}/day can burn your domain reputation.
                </span>
              </div>
            )}

            {risk.level === "risky" && (
              <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  Between {WARMUP_LIMITS.OPTIMAL + 1}–{WARMUP_LIMITS.MAX}/day is the
                  upper tolerable range. The sweet spot is {WARMUP_LIMITS.OPTIMAL}/day.
                </span>
              </div>
            )}

            {rampTooFast && (
              <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  Ramp is short ({rampDays}d). New mailboxes need at least{" "}
                  {WARMUP_LIMITS.MIN_WARMUP_DAYS} days of warm-up.
                </span>
              </div>
            )}
          </Section>

          <Section title="Schedule">
            <InlineToggle
              label="Business days only"
              description="Skip Saturdays and Sundays — the ramp only advances Mon–Fri"
              checked={businessDaysOnly}
              onCheckedChange={setBusinessDaysOnly}
            />
          </Section>

          <Section
            title="Automatic protection"
            description="Pause warm-up if bounce rate spikes"
          >
            <InlineToggle
              label="Auto-pause on bounce"
              description="Protects your domain reputation automatically"
              checked={bounceEnabled}
              onCheckedChange={setBounceEnabled}
            />

            {bounceEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bounce_pct" className="text-xs text-muted-foreground">
                    Threshold (%)
                  </Label>
                  <Input
                    id="bounce_pct"
                    type="number"
                    min={0.1}
                    max={100}
                    step={0.5}
                    value={bounceThreshold}
                    onChange={(e) => setBounceThreshold(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bounce_hours" className="text-xs text-muted-foreground">
                    Window (hours)
                  </Label>
                  <Input
                    id="bounce_hours"
                    type="number"
                    min={1}
                    value={bounceWindow}
                    onChange={(e) => setBounceWindow(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}
          </Section>

          <div className="border-t border-border pt-3 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Guidelines:</span> up to{" "}
            {WARMUP_LIMITS.SAFE}/day is safe · {WARMUP_LIMITS.OPTIMAL}/day is optimal · above{" "}
            {WARMUP_LIMITS.MAX}/day is risky · at least {WARMUP_LIMITS.MIN_WARMUP_DAYS} days
            of warm-up on new mailboxes.
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!!error || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
