"use client";

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  suffix?: string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color,
  label,
  suffix = "%",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/50"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="animate-progress-ring"
            style={{
              "--ring-circumference": circumference,
              "--ring-offset": offset,
            } as React.CSSProperties}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">
            {value}{suffix}
          </span>
        </div>
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
