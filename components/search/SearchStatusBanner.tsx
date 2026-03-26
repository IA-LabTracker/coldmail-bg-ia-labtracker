"use client";

import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type Status = "idle" | "running" | "completed" | "error";

interface SearchStatusBannerProps {
  status: Status;
  message: string;
}

const CONFIG = {
  running: {
    icon: Loader2,
    iconClass: "h-4 w-4 animate-spin text-primary",
    bgClass: "border-primary/20 bg-primary/5",
    textClass: "text-primary",
  },
  completed: {
    icon: CheckCircle,
    iconClass: "h-4 w-4 text-green-600 dark:text-green-400",
    bgClass: "border-green-500/20 bg-green-500/5",
    textClass: "text-green-700 dark:text-green-300",
  },
  error: {
    icon: AlertCircle,
    iconClass: "h-4 w-4 text-red-600 dark:text-red-400",
    bgClass: "border-red-500/20 bg-red-500/5",
    textClass: "text-red-700 dark:text-red-300",
  },
} as const;

export function SearchStatusBanner({ status, message }: SearchStatusBannerProps) {
  if (status === "idle" || !message) return null;

  const config = CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${config.bgClass}`}>
      <Icon className={config.iconClass} />
      <p className={`text-sm font-medium ${config.textClass}`}>{message}</p>
    </div>
  );
}
