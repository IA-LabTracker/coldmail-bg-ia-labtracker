export const COVER_COLORS = [
  { name: "Blue", from: "#3b82f6", to: "#60a5fa" },
  { name: "Indigo", from: "#6366f1", to: "#818cf8" },
  { name: "Violet", from: "#8b5cf6", to: "#a78bfa" },
  { name: "Rose", from: "#f43f5e", to: "#fb7185" },
  { name: "Orange", from: "#f97316", to: "#fb923c" },
  { name: "Amber", from: "#f59e0b", to: "#fbbf24" },
  { name: "Emerald", from: "#10b981", to: "#34d399" },
  { name: "Teal", from: "#14b8a6", to: "#2dd4bf" },
  { name: "Cyan", from: "#06b6d4", to: "#22d3ee" },
  { name: "Slate", from: "#475569", to: "#64748b" },
  { name: "Zinc", from: "#52525b", to: "#71717a" },
  { name: "Stone", from: "#78716c", to: "#a8a29e" },
];

export const AVATAR_COLORS = [
  { name: "Blue", bg: "#dbeafe", text: "#1d4ed8" },
  { name: "Indigo", bg: "#e0e7ff", text: "#4338ca" },
  { name: "Violet", bg: "#ede9fe", text: "#6d28d9" },
  { name: "Rose", bg: "#ffe4e6", text: "#be123c" },
  { name: "Orange", bg: "#ffedd5", text: "#c2410c" },
  { name: "Amber", bg: "#fef3c7", text: "#b45309" },
  { name: "Emerald", bg: "#d1fae5", text: "#047857" },
  { name: "Teal", bg: "#ccfbf1", text: "#0f766e" },
  { name: "Cyan", bg: "#cffafe", text: "#0e7490" },
  { name: "Slate", bg: "#e2e8f0", text: "#334155" },
  { name: "Zinc", bg: "#e4e4e7", text: "#3f3f46" },
  { name: "Neutral", bg: "#f5f5f5", text: "#404040" },
];

const STORAGE_KEY = "profile-colors";

export interface ProfileColors {
  coverFrom: string;
  coverTo: string;
  avatarBg: string;
  avatarText: string;
}

export const defaultColors: ProfileColors = {
  coverFrom: COVER_COLORS[0].from,
  coverTo: COVER_COLORS[0].to,
  avatarBg: AVATAR_COLORS[0].bg,
  avatarText: AVATAR_COLORS[0].text,
};

export function loadColors(): ProfileColors {
  if (typeof window === "undefined") return defaultColors;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultColors, ...JSON.parse(stored) };
  } catch {}
  return defaultColors;
}

export function saveColors(colors: ProfileColors) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
}
