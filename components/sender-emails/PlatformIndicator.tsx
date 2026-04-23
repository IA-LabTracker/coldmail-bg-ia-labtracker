"use client";

import { cn } from "@/lib/utils";

type Platform =
  | "smartlead"
  | "resend"
  | "zapmail"
  | "google"
  | "outlook"
  | "manual"
  | "ses"
  | "mailgun"
  | "smtp"
  | "none"
  | "auto"
  | "linkedin"
  | "any"
  | string;

interface PlatformIndicatorProps {
  platform: Platform;
  className?: string;
  size?: "sm" | "md";
  iconOnly?: boolean;
}

interface PlatformConfig {
  label: string;
  color: string;
  icon: React.ReactNode;
}

const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
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
  google: {
    label: "Google",
    color: "text-foreground dark:text-foreground",
    icon: (
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <path d="M1.5 4.3V12.5c0 .55.45 1 1 1H4V7.5L1.5 4.3Z" fill="#4285F4" />
        <path d="M12 13.5h1.5c.55 0 1-.45 1-1V4.3L12 7.5v6Z" fill="#34A853" />
        <path d="M4 7.5v6h8v-6L8 10 4 7.5Z" fill="#FBBC04" />
        <path d="M14.5 4.3V3.5c0-.55-.45-1-1-1h-.7l-.8.7v4.3l2.5-3.2Z" fill="#EA4335" />
        <path d="M1.5 4.3V3.5c0-.55.45-1 1-1h.7l.8.7v4.3L1.5 4.3Z" fill="#C5221F" />
        <path d="M4 3.2L8 6.5l4-3.3v4.3L8 10 4 7.5V3.2Z" fill="#EA4335" />
      </svg>
    ),
  },
  outlook: {
    label: "Outlook",
    color: "text-foreground dark:text-foreground",
    icon: (
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <path d="M8.5 4.5H15v2.3L11.75 9 8.5 6.8V4.5Z" fill="#28A8EA" />
        <path d="M8.5 6.8L11.75 9 15 6.8v4.9l-3.25 2L8.5 11.7V6.8Z" fill="#0078D4" />
        <path d="M15 11.7l-3.25 2V9L15 6.8v4.9Z" fill="#50D9FF" opacity="0.6" />
        <path d="M0.5 3.8L8.5 2.3v11.4L0.5 12.2V3.8Z" fill="#0364B8" />
        <ellipse cx="4.5" cy="8" rx="2" ry="2.6" stroke="#fff" strokeWidth="1" fill="none" />
      </svg>
    ),
  },
  manual: {
    label: "Manual / SMTP",
    color: "text-muted-foreground",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
        <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2.5 4.5L8 8.5L13.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="11.5" cy="11" r="1.5" fill="currentColor" opacity="0.25" />
      </svg>
    ),
  },
  ses: {
    label: "Amazon SES",
    color: "text-orange-500 dark:text-orange-400",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
        <path d="M8 1.5L13.5 4.25V10.75L8 13.5L2.5 10.75V4.25L8 1.5Z" fill="currentColor" opacity="0.15" />
        <path d="M8 1.5L13.5 4.25V10.75L8 13.5L2.5 10.75V4.25L8 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M2.5 4.25L8 7L13.5 4.25M8 7V13.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
  mailgun: {
    label: "Mailgun",
    color: "text-red-500 dark:text-red-400",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
        <rect x="2" y="3.5" width="12" height="9" rx="1.5" fill="currentColor" opacity="0.12" />
        <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2.5 4.5L8 8.5L13.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="4.5" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  smtp: {
    label: "Custom SMTP",
    color: "text-muted-foreground",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
        <rect x="2.5" y="3" width="11" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
        <rect x="2.5" y="9" width="11" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="4.75" cy="5" r="0.6" fill="currentColor" />
        <circle cx="4.75" cy="11" r="0.6" fill="currentColor" />
        <path d="M6.5 5H11.5M6.5 11H11.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  linkedin: {
    label: "LinkedIn",
    color: "text-[#0A66C2] dark:text-[#4A9FE0]",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
        <rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="currentColor" />
        <path d="M4.5 6.25V11.5M4.5 4.75V4.76" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7.25 11.5V6.25M7.25 8.5C7.25 7.25 8 6.25 9.25 6.25C10.5 6.25 11.25 7.25 11.25 8.5V11.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
};

export function PlatformIndicator({
  platform,
  className,
  size = "sm",
  iconOnly = false,
}: PlatformIndicatorProps) {
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
      {!iconOnly && <span className={cn(textSize, "font-medium")}>{config.label}</span>}
    </span>
  );
}
