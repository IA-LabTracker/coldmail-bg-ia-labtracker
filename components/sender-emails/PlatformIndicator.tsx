"use client";

import { cn } from "@/lib/utils";

type Platform = "smartlead" | "resend" | "zapmail" | string;

interface PlatformIndicatorProps {
  platform: Platform;
  className?: string;
  size?: "sm" | "md";
}

const PLATFORM_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  smartlead: {
    label: "SmartLead",
    color: "text-violet-500 dark:text-violet-400",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
        <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="currentColor" opacity="0.15" />
        <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  resend: {
    label: "Resend",
    color: "text-foreground dark:text-foreground",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
        <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2.5 4.5L8 8.5L13.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  zapmail: {
    label: "Zapmail",
    color: "text-amber-500 dark:text-amber-400",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
        <path d="M9 1L3 9H8L7 15L13 7H8L9 1Z" fill="currentColor" opacity="0.15" />
        <path d="M9 1L3 9H8L7 15L13 7H8L9 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
};

export function PlatformIndicator({ platform, className, size = "sm" }: PlatformIndicatorProps) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) return null;

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        config.color,
        className,
      )}
    >
      <span className={cn(iconSize, "shrink-0")}>{config.icon}</span>
      <span className={cn(textSize, "font-medium")}>{config.label}</span>
    </span>
  );
}
