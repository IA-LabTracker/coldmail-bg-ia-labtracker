/**
 * Recommended sending limits for cold email.
 * Industry rules of thumb — used to guide UI defaults and warnings.
 */

export const WARMUP_LIMITS = {
  SAFE: 10,
  OPTIMAL: 15,
  MAX: 25,
  MIN_WARMUP_DAYS: 14,
  TYPICAL_REPLY_RATE_PCT: 2.5,
} as const;

export type RiskLevel = "safe" | "optimal" | "risky" | "very_risky";

export interface RiskInfo {
  level: RiskLevel;
  label: string;
  description: string;
  tone: "emerald" | "blue" | "amber" | "red";
}

export function classifyDailyLimit(dailyLimit: number): RiskInfo {
  if (dailyLimit <= WARMUP_LIMITS.SAFE) {
    return {
      level: "safe",
      label: "Seguro",
      description: `Até ${WARMUP_LIMITS.SAFE}/dia é o limite conservador`,
      tone: "emerald",
    };
  }
  if (dailyLimit <= WARMUP_LIMITS.OPTIMAL) {
    return {
      level: "optimal",
      label: "Ótimo",
      description: `${WARMUP_LIMITS.OPTIMAL}/dia é o equilíbrio ideal`,
      tone: "blue",
    };
  }
  if (dailyLimit <= WARMUP_LIMITS.MAX) {
    return {
      level: "risky",
      label: "Arriscado",
      description: `${WARMUP_LIMITS.OPTIMAL + 1}–${WARMUP_LIMITS.MAX}/dia é o máximo tolerável`,
      tone: "amber",
    };
  }
  return {
    level: "very_risky",
    label: "Muito arriscado",
    description: `Acima de ${WARMUP_LIMITS.MAX}/dia pode queimar a reputação do domínio`,
    tone: "red",
  };
}

export function daysToReach(start: number, increment: number, target: number): number {
  if (increment <= 0) return target > start ? Infinity : 0;
  return Math.ceil(Math.max(0, target - start) / increment);
}
