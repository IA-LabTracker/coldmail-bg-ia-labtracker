"use client";

import { useMemo, useState } from "react";
import { SenderEmail } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useSenderEmails } from "@/hooks/useSenderEmails";
import { computeWarmupProgress, useSenderWarmups } from "@/hooks/useSenderWarmups";
import { WarmupCard } from "./WarmupCard";
import { WarmupSettingsDialog } from "./WarmupSettingsDialog";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium tabular-nums text-foreground">
        {value}
        {sub && <span className="text-muted-foreground"> {sub}</span>}
      </p>
    </div>
  );
}

function SummaryBar({
  activeCount,
  totalSenders,
  totalWarmupToday,
  totalWarmupSent,
}: {
  activeCount: number;
  totalSenders: number;
  totalWarmupToday: number;
  totalWarmupSent: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-10 gap-y-3 border-b border-border pb-4">
      <Stat label="Ativos" value={`${activeCount}`} sub={`/ ${totalSenders}`} />
      <Stat
        label="Warm-up hoje"
        value={`${totalWarmupSent}`}
        sub={`/ ${totalWarmupToday}`}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border py-16 text-center">
      <p className="text-sm font-medium text-foreground">Nenhum sender cadastrado</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Warm-up roda por caixa de entrada. Adicione um sender em{" "}
        <span className="font-medium text-foreground">/sender-emails</span> pra começar.
      </p>
    </div>
  );
}

export function WarmupTab() {
  const { senderEmails, loading: loadingSenders } = useSenderEmails();
  const { warmupsBySenderId, stats, loading: loadingWarmups, setEnabled, updateSettings, resetProgress } =
    useSenderWarmups();
  const [settingsFor, setSettingsFor] = useState<string | null>(null);

  const activeSenders = useMemo(
    () => senderEmails.filter((s) => s.status !== "suspended"),
    [senderEmails],
  );

  const {
    activeCount,
    totalWarmupToday,
    totalWarmupSent,
  } = useMemo(() => {
    let activeCount = 0;
    let totalWarmupToday = 0;
    let totalWarmupSent = 0;
    for (const sender of activeSenders) {
      const w = warmupsBySenderId.get(sender.id);
      const s = stats[sender.id];
      if (w?.enabled) {
        activeCount++;
        const progress = computeWarmupProgress(w);
        totalWarmupToday += progress.todayVolume;
      }
      if (s) totalWarmupSent += s.warmupSentToday;
    }
    return { activeCount, totalWarmupToday, totalWarmupSent };
  }, [activeSenders, warmupsBySenderId, stats]);

  const settingsSender: SenderEmail | null = settingsFor
    ? activeSenders.find((s) => s.id === settingsFor) ?? null
    : null;
  const settingsWarmup = settingsFor ? warmupsBySenderId.get(settingsFor) ?? null : null;

  if (loadingSenders || loadingWarmups) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (activeSenders.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <SummaryBar
        activeCount={activeCount}
        totalSenders={activeSenders.length}
        totalWarmupToday={totalWarmupToday}
        totalWarmupSent={totalWarmupSent}
      />

      <div className="mt-5 flex flex-col gap-2">
        {activeSenders.map((sender) => {
          const warmup = warmupsBySenderId.get(sender.id) ?? null;
          const progress = warmup ? computeWarmupProgress(warmup) : null;
          const senderStats = stats[sender.id] ?? null;
          return (
            <WarmupCard
              key={sender.id}
              sender={sender}
              warmup={warmup}
              progress={progress}
              stats={senderStats}
              onToggle={(enabled) => setEnabled(sender.id, enabled)}
              onOpenSettings={() => setSettingsFor(sender.id)}
              onReset={() => resetProgress(sender.id)}
            />
          );
        })}
      </div>

      <WarmupSettingsDialog
        open={!!settingsFor}
        onOpenChange={(open) => !open && setSettingsFor(null)}
        senderLabel={settingsSender?.email_address ?? ""}
        warmup={settingsWarmup}
        onSave={async (values) => {
          if (settingsFor) await updateSettings(settingsFor, values);
        }}
      />
    </>
  );
}
