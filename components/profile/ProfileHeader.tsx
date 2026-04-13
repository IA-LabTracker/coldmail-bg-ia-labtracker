"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { ProfileColors } from "./profileColors";

interface ProfileHeaderProps {
  colors: ProfileColors;
  initials: string;
  displayName: string;
  email: string;
  companyName: string;
  saving: boolean;
  onSave: () => void;
}

export function ProfileHeader({
  colors,
  initials,
  displayName,
  email,
  companyName,
  saving,
  onSave,
}: ProfileHeaderProps) {
  return (
    <>
      {/* Cover */}
      <div
        className="h-36 sm:h-44"
        style={{
          background: `linear-gradient(to right, ${colors.coverFrom}, ${colors.coverTo}, transparent)`,
          opacity: 0.25,
        }}
      />

      {/* Avatar + identity */}
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-14 flex flex-col items-center sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-background shadow-sm sm:h-32 sm:w-32"
            style={{ backgroundColor: colors.avatarBg }}
          >
            <span
              className="text-3xl font-semibold sm:text-4xl"
              style={{ color: colors.avatarText }}
            >
              {initials}
            </span>
          </div>

          <div className="mt-4 text-center sm:mb-1.5 sm:mt-0 sm:text-left">
            <h1 className="text-2xl font-semibold text-foreground">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{email}</p>
            {companyName && (
              <p className="mt-0.5 text-sm text-muted-foreground">{companyName}</p>
            )}
          </div>

          <div className="mt-4 sm:mb-1.5 sm:ml-auto sm:mt-0">
            <Button onClick={onSave} disabled={saving} size="sm" variant="outline">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
