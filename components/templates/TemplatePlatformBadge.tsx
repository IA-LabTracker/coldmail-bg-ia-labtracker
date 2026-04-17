"use client";

import { cn } from "@/lib/utils";
import { EmailTemplatePlatform } from "@/types";
import { Globe, Linkedin, Mail } from "lucide-react";
import { PlatformIndicator } from "@/components/sender-emails/PlatformIndicator";

interface TemplatePlatformBadgeProps {
  platform: EmailTemplatePlatform;
  className?: string;
}

const SPECIAL: Record<"any" | "linkedin", { label: string; color: string; icon: React.ReactNode }> =
  {
    any: {
      label: "Any platform",
      color: "text-muted-foreground",
      icon: <Globe className="h-3.5 w-3.5" />,
    },
    linkedin: {
      label: "LinkedIn",
      color: "text-blue-500 dark:text-blue-400",
      icon: <Linkedin className="h-3.5 w-3.5" />,
    },
  };

export function TemplatePlatformBadge({ platform, className }: TemplatePlatformBadgeProps) {
  if (platform === "any" || platform === "linkedin") {
    const cfg = SPECIAL[platform];
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-medium",
          cfg.color,
          className,
        )}
      >
        {cfg.icon}
        {cfg.label}
      </span>
    );
  }

  return <PlatformIndicator platform={platform} className={className} />;
}

export function TemplateTypeIcon({ platform, className }: TemplatePlatformBadgeProps) {
  if (platform === "linkedin") {
    return <Linkedin className={cn("h-4 w-4 text-blue-500 dark:text-blue-400", className)} />;
  }
  return <Mail className={cn("h-4 w-4 text-muted-foreground", className)} />;
}
