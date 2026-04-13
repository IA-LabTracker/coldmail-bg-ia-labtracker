"use client";

import { Palette, Check } from "lucide-react";
import { COVER_COLORS, AVATAR_COLORS, ProfileColors, saveColors } from "./profileColors";

interface CustomizeTabProps {
  colors: ProfileColors;
  initials: string;
  displayName: string;
  email: string;
  onColorsChange: (colors: ProfileColors) => void;
}

export function CustomizeTab({
  colors,
  initials,
  displayName,
  email,
  onColorsChange,
}: CustomizeTabProps) {
  const updateColors = (next: ProfileColors) => {
    onColorsChange(next);
    saveColors(next);
  };

  return (
    <div className="space-y-6">
      {/* Cover color */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-1 flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Cover Color
          </h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Choose a gradient for your profile header
        </p>
        <div className="grid grid-cols-6 gap-2.5 sm:grid-cols-12">
          {COVER_COLORS.map((c) => {
            const selected = colors.coverFrom === c.from && colors.coverTo === c.to;
            return (
              <button
                key={c.name}
                title={c.name}
                onClick={() => updateColors({ ...colors, coverFrom: c.from, coverTo: c.to })}
                className={`relative h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                  selected ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                }`}
                style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
              >
                {selected && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Avatar color */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-1 flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Avatar Color
          </h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">Pick a color for your profile avatar</p>
        <div className="grid grid-cols-6 gap-2.5 sm:grid-cols-12">
          {AVATAR_COLORS.map((c) => {
            const selected = colors.avatarBg === c.bg && colors.avatarText === c.text;
            return (
              <button
                key={c.name}
                title={c.name}
                onClick={() => updateColors({ ...colors, avatarBg: c.bg, avatarText: c.text })}
                className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-transform hover:scale-110 ${
                  selected ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                }`}
                style={{ backgroundColor: c.bg, color: c.text }}
              >
                {selected ? <Check className="h-4 w-4" /> : "A"}
              </button>
            );
          })}
        </div>

        {/* Live preview */}
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <div
            className="h-16"
            style={{
              background: `linear-gradient(to right, ${colors.coverFrom}, ${colors.coverTo}, transparent)`,
              opacity: 0.25,
            }}
          />
          <div className="-mt-6 flex items-end gap-3 px-4 pb-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-background text-sm font-semibold"
              style={{ backgroundColor: colors.avatarBg, color: colors.avatarText }}
            >
              {initials}
            </div>
            <div className="mb-0.5">
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
