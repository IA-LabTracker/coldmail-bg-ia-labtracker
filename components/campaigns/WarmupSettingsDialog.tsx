"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { CampaignWarmup } from "@/types";
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

interface WarmupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignName: string;
  warmup: CampaignWarmup | null;
  onSave: (values: {
    start_volume: number;
    increment_per_day: number;
    daily_limit: number;
  }) => Promise<void>;
}

const DEFAULTS = { start_volume: 5, increment_per_day: 5, daily_limit: 50 };

export function WarmupSettingsDialog({
  open,
  onOpenChange,
  campaignName,
  warmup,
  onSave,
}: WarmupSettingsDialogProps) {
  const [startVolume, setStartVolume] = useState(DEFAULTS.start_volume);
  const [increment, setIncrement] = useState(DEFAULTS.increment_per_day);
  const [dailyLimit, setDailyLimit] = useState(DEFAULTS.daily_limit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStartVolume(warmup?.start_volume ?? DEFAULTS.start_volume);
      setIncrement(warmup?.increment_per_day ?? DEFAULTS.increment_per_day);
      setDailyLimit(warmup?.daily_limit ?? DEFAULTS.daily_limit);
    }
  }, [open, warmup]);

  const error =
    startVolume < 1
      ? "Volume inicial deve ser ≥ 1"
      : increment < 0
        ? "Incremento não pode ser negativo"
        : dailyLimit < startVolume
          ? "Meta diária deve ser ≥ volume inicial"
          : null;

  const handleSave = async () => {
    if (error) return;
    setSaving(true);
    await onSave({
      start_volume: startVolume,
      increment_per_day: increment,
      daily_limit: dailyLimit,
    });
    setSaving(false);
    onOpenChange(false);
  };

  const daysToTarget =
    increment > 0 ? Math.ceil(Math.max(0, dailyLimit - startVolume) / increment) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar warm-up</DialogTitle>
          <DialogDescription>
            Campanha: <span className="font-medium text-foreground">{campaignName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="start_volume">Volume inicial (dia 1)</Label>
            <Input
              id="start_volume"
              type="number"
              min={1}
              value={startVolume}
              onChange={(e) => setStartVolume(Number(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="increment">Incremento por dia</Label>
            <Input
              id="increment"
              type="number"
              min={0}
              value={increment}
              onChange={(e) => setIncrement(Number(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="daily_limit">Meta diária (topo)</Label>
            <Input
              id="daily_limit"
              type="number"
              min={1}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value) || 0)}
            />
          </div>

          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {increment > 0
                ? `Chega em ${dailyLimit}/dia em ~${daysToTarget} dia${daysToTarget === 1 ? "" : "s"}.`
                : `Sem incremento: envia ${startVolume}/dia sempre.`}
            </p>
          )}
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
