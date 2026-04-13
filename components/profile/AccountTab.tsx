"use client";

import { formatDate } from "./utils";

interface AccountTabProps {
  email: string;
  createdAt: string | null;
  lastSignIn: string | null;
  userId: string;
}

export function AccountTab({ email, createdAt, lastSignIn, userId }: AccountTabProps) {
  const rows = [
    { label: "Email", value: email, mono: false },
    { label: "Member since", value: formatDate(createdAt), mono: false },
    { label: "Last sign in", value: formatDate(lastSignIn), mono: false },
    { label: "User ID", value: userId, mono: true },
  ];

  return (
    <div className="rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-6 py-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        Account Details
      </h2>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span
              className={`text-sm font-medium text-foreground ${row.mono ? "font-mono text-xs" : ""}`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
