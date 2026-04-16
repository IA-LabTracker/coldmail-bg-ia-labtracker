"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WelcomeOverlay } from "@/components/profile/WelcomeOverlay";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileTab } from "@/components/profile/ProfileTab";
import { AccountTab } from "@/components/profile/AccountTab";
import { SubscriptionTab } from "@/components/profile/SubscriptionTab";
import { CustomizeTab } from "@/components/profile/CustomizeTab";
import { defaultColors, loadColors, ProfileColors } from "@/components/profile/profileColors";

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, subscription, stats, loading, updateProfile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [colors, setColors] = useState<ProfileColors>(defaultColors);

  useEffect(() => {
    setColors(loadColors());
  }, []);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone ?? "");
      setCompanyName(profile.company_name ?? "");
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      full_name: fullName,
      phone: phone || null,
      company_name: companyName || null,
    });
    setSaving(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="relative min-h-screen">
          {/* Cover */}
          <Skeleton className="h-44 w-full rounded-none" />

          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            {/* Avatar + name */}
            <div className="-mt-16 flex items-end gap-6">
              <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
              <div className="mb-1.5 space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-4 divide-x divide-border rounded-lg border border-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center py-5">
                  <Skeleton className="h-6 w-10" />
                  <Skeleton className="mt-1.5 h-3 w-16" />
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="mt-8">
              <Skeleton className="mb-6 h-10 w-80" />
              <div className="rounded-lg border border-border p-6">
                <Skeleton className="mb-6 h-4 w-40" />
                <div className="grid gap-5 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const displayName = fullName || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AppLayout>
      <AnimatePresence>
        {showWelcome && (
          <WelcomeOverlay name={displayName} onComplete={() => setShowWelcome(false)} />
        )}
      </AnimatePresence>

      <motion.div
        className="relative min-h-screen"
        initial={{ filter: "blur(10px)", opacity: 0.2 }}
        animate={{
          filter: showWelcome ? "blur(10px)" : "blur(0px)",
          opacity: showWelcome ? 0.2 : 1,
        }}
        transition={{ duration: 0.5, delay: showWelcome ? 0 : 0.1 }}
      >
        <ProfileHeader
          colors={colors}
          initials={initials}
          displayName={displayName}
          email={user?.email ?? ""}
          companyName={companyName}
          saving={saving}
          onSave={handleSave}
        />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <ProfileStats stats={stats} />

          <div className="mt-8 pb-12">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="customize">Customize</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-6">
                <ProfileTab
                  fullName={fullName}
                  email={user?.email ?? ""}
                  phone={phone}
                  companyName={companyName}
                  onFullNameChange={setFullName}
                  onPhoneChange={setPhone}
                  onCompanyNameChange={setCompanyName}
                />
              </TabsContent>

              <TabsContent value="account" className="mt-6">
                <AccountTab
                  email={user?.email ?? ""}
                  createdAt={user?.created_at ?? null}
                  lastSignIn={user?.last_sign_in_at ?? null}
                  userId={user?.id ?? ""}
                />
              </TabsContent>

              <TabsContent value="subscription" className="mt-6">
                <SubscriptionTab subscription={subscription} />
              </TabsContent>

              <TabsContent value="customize" className="mt-6">
                <CustomizeTab
                  colors={colors}
                  initials={initials}
                  displayName={displayName}
                  email={user?.email ?? ""}
                  onColorsChange={setColors}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
