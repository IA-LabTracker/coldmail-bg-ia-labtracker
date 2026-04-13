"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileTabProps {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  onFullNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onCompanyNameChange: (v: string) => void;
}

export function ProfileTab({
  fullName,
  email,
  phone,
  companyName,
  onFullNameChange,
  onPhoneChange,
  onCompanyNameChange,
}: ProfileTabProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        Personal Information
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-sm text-muted-foreground">
            Full Name
          </Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm text-muted-foreground">
            Email
          </Label>
          <Input id="email" value={email} disabled className="bg-muted" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm text-muted-foreground">
            Phone
          </Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="company" className="text-sm text-muted-foreground">
            Company
          </Label>
          <Input
            id="company"
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            placeholder="Your company"
          />
        </div>
      </div>
    </div>
  );
}
