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
      label: "Safe",
      description: `Up to ${WARMUP_LIMITS.SAFE}/day is the conservative limit`,
      tone: "emerald",
    };
  }
  if (dailyLimit <= WARMUP_LIMITS.OPTIMAL) {
    return {
      level: "optimal",
      label: "Optimal",
      description: `${WARMUP_LIMITS.OPTIMAL}/day is the sweet spot`,
      tone: "blue",
    };
  }
  if (dailyLimit <= WARMUP_LIMITS.MAX) {
    return {
      level: "risky",
      label: "Risky",
      description: `${WARMUP_LIMITS.OPTIMAL + 1}–${WARMUP_LIMITS.MAX}/day is the upper tolerable range`,
      tone: "amber",
    };
  }
  return {
    level: "very_risky",
    label: "Very risky",
    description: `Above ${WARMUP_LIMITS.MAX}/day can burn your domain reputation`,
    tone: "red",
  };
}

export function daysToReach(start: number, increment: number, target: number): number {
  if (increment <= 0) return target > start ? Infinity : 0;
  return Math.ceil(Math.max(0, target - start) / increment);
}
