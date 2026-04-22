"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, Flame, Info, Loader2, ShieldAlert } from "lucide-react";
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

// Defaults tuned to the cold-email industry rule of thumb:
// — day 1: 5 emails, +1/day → hits 15 (optimal) around day 11
// — gives a gentle 14-day ramp as recommended for new mailboxes
const DEFAULTS: Required<WarmupSettingsInput> = {
  start_volume: 5,
  increment_per_day: 1,
  daily_limit: WARMUP_LIMITS.OPTIMAL,
  business_days_only: true,
  bounce_threshold_pct: 5,
  bounce_window_hours: 24,
};

const TONE_CLASSES: Record<"emerald" | "blue" | "amber" | "red", string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  red: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
};

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
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
      ? "Volume inicial deve ser ≥ 1"
      : increment < 0
        ? "Incremento não pode ser negativo"
        : dailyLimit < startVolume
          ? "Meta diária deve ser ≥ volume inicial"
          : bounceEnabled && (bounceThreshold <= 0 || bounceThreshold > 100)
            ? "Limite de bounce deve estar entre 0 e 100%"
            : bounceEnabled && bounceWindow < 1
              ? "Janela deve ser ≥ 1 hora"
              : null;

  const risk = classifyDailyLimit(dailyLimit);
  const rampDays = daysToReach(startVolume, increment, dailyLimit);
  const rampTooFast = Number.isFinite(rampDays) && rampDays < WARMUP_LIMITS.MIN_WARMUP_DAYS;

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
          <DialogTitle>Configurar warm-up</DialogTitle>
          <DialogDescription>
            Sender: <span className="font-medium text-foreground">{senderLabel}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Section
            icon={<Flame className="h-4 w-4" />}
            title="Rampa de envio"
            description="Volume aumenta gradualmente até bater a meta diária"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start_volume" className="text-xs">
                  Volume inicial
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
                <Label htmlFor="increment" className="text-xs">
                  + por dia
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="daily_limit" className="text-xs">
                    Meta diária
                  </Label>
                  <span
                    className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${TONE_CLASSES[risk.tone]}`}
                  >
                    {risk.label}
                  </span>
                </div>
                <Input
                  id="daily_limit"
                  type="number"
                  min={1}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {increment > 0
                ? `Chega em ${dailyLimit}/dia em ~${rampDays} dia${rampDays === 1 ? "" : "s"}.`
                : `Sem incremento: envia ${startVolume}/dia sempre.`}
            </p>

            {risk.level === "very_risky" && (
              <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
                <p className="text-xs text-red-700 dark:text-red-300">
                  Acima de {WARMUP_LIMITS.MAX}/dia é muito arriscado — pode queimar a reputação
                  do domínio rapidamente.
                </p>
              </div>
            )}

            {risk.level === "risky" && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Entre {WARMUP_LIMITS.OPTIMAL + 1} e {WARMUP_LIMITS.MAX}/dia é o máximo tolerável.
                  O ótimo pra cold email é {WARMUP_LIMITS.OPTIMAL}/dia.
                </p>
              </div>
            )}

            {rampTooFast && increment > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Rampa curta ({rampDays} dia{rampDays === 1 ? "" : "s"}). Caixas novas precisam
                  de ao menos {WARMUP_LIMITS.MIN_WARMUP_DAYS} dias de warm-up — diminua o
                  incremento ou aumente a meta.
                </p>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="space-y-0.5 text-[11px] text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Até {WARMUP_LIMITS.SAFE}/dia</span> é
                  seguro · <span className="font-medium text-foreground">{WARMUP_LIMITS.OPTIMAL}/dia</span>{" "}
                  é o ótimo · acima de{" "}
                  <span className="font-medium text-foreground">{WARMUP_LIMITS.MAX}/dia</span> é muito
                  arriscado
                </p>
                <p>Caixas novas: mínimo {WARMUP_LIMITS.MIN_WARMUP_DAYS} dias de warm-up.</p>
              </div>
            </div>
          </Section>

          <Section
            icon={<CalendarDays className="h-4 w-4" />}
            title="Agenda"
            description="Controle quando a rampa avança"
          >
            <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Apenas dias úteis</p>
                <p className="text-xs text-muted-foreground">
                  Ignora sábados e domingos — a rampa só avança seg–sex
                </p>
              </div>
              <Switch checked={businessDaysOnly} onCheckedChange={setBusinessDaysOnly} />
            </div>
          </Section>

          <Section
            icon={<ShieldAlert className="h-4 w-4" />}
            title="Proteção automática"
            description="Pausa o warm-up se a taxa de bounce subir"
          >
            <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Auto-pausa por bounce</p>
                <p className="text-xs text-muted-foreground">
                  Protege a reputação do domínio automaticamente
                </p>
              </div>
              <Switch checked={bounceEnabled} onCheckedChange={setBounceEnabled} />
            </div>

            {bounceEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bounce_pct" className="text-xs">
                    Limite (%)
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
                  <Label htmlFor="bounce_hours" className="text-xs">
                    Janela (horas)
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

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!!error || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
