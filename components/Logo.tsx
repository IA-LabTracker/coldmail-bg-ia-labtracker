"use client";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <div className={className}>
      <span className="text-xl font-light tracking-tight text-sidebar-foreground">
        c
        <span className="font-semibold">old</span>
        <span className="font-extralight">m</span>
        <span className="font-semibold">ail</span>
      </span>
    </div>
  );
}
