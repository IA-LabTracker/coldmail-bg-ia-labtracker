"use client";

import { useMemo, useState } from "react";
import { Flame, Inbox } from "lucide-react";
import { SenderEmail } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useSenderEmails } from "@/hooks/useSenderEmails";
import { computeWarmupProgress, useSenderWarmups } from "@/hooks/useSenderWarmups";
import { WarmupCard } from "./WarmupCard";
import { WarmupSettingsDialog } from "./WarmupSettingsDialog";

function SummaryBar({
  activeCount,
  totalSenders,
  totalWarmupToday,
  totalSentToday,
}: {
  activeCount: number;
  totalSenders: number;
  totalWarmupToday: number;
  totalSentToday: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-gradient-to-r from-orange-500/5 to-transparent px-5 py-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
          <Flame className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Warm-up</p>
          <p className="text-[11px] text-muted-foreground">
            Aquecimento gradual por inbox — protege sua reputação
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ativos</p>
          <p className="font-semibold text-foreground">
            {activeCount}
            <span className="text-muted-foreground"> / {totalSenders}</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Hoje</p>
          <p className="font-semibold text-foreground">
            {totalSentToday}
            <span className="text-muted-foreground"> / {totalWarmupToday} warm-up</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="animate-fade-up flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted/50">
        <Inbox className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">Nenhum sender cadastrado</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
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
        totalSentToday={totalWarmupSent}
      />

      <div className="mt-4 flex flex-col gap-3">
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
