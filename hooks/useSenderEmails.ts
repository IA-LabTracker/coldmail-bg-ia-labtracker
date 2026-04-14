"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { SenderEmail, SenderEmailProvider, SenderEmailPlatform } from "@/types";
import { toast } from "sonner";

function extractDomain(email: string): string {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1].toLowerCase() : "";
}

export interface CreateSenderEmailInput {
  email_address: string;
  display_name: string;
  provider?: SenderEmailProvider;
  provider_id?: string;
  platform?: SenderEmailPlatform;
  daily_limit?: number;
  provider_metadata?: Record<string, unknown>;
}

export interface UpdateSenderEmailInput {
  email_address?: string;
  display_name?: string;
  provider?: SenderEmailProvider;
  provider_id?: string | null;
  platform?: SenderEmailPlatform;
  daily_limit?: number;
  status?: string;
  provider_metadata?: Record<string, unknown>;
}

export function useSenderEmails() {
  const { user } = useAuth();
  const [senderEmails, setSenderEmails] = useState<SenderEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSenderEmails = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sender_emails")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSenderEmails(data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load sender emails");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSenderEmails();
  }, [fetchSenderEmails]);

  const createSenderEmail = useCallback(
    async (input: CreateSenderEmailInput) => {
      if (!user) return null;

      try {
        const isFirst = senderEmails.length === 0;
        const emailAddress = input.email_address.trim().toLowerCase();

        const { data, error } = await supabase
          .from("sender_emails")
          .insert({
            user_id: user.id,
            email_address: emailAddress,
            display_name: input.display_name.trim(),
            domain: extractDomain(emailAddress),
            is_default: isFirst,
            provider: input.provider ?? "manual",
            provider_id: input.provider_id ?? null,
            platform: input.platform ?? "none",
            daily_limit: input.daily_limit ?? 0,
            status: "active",
            provider_metadata: input.provider_metadata ?? {},
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            toast.error("This email address is already registered");
            return null;
          }
          throw error;
        }

        setSenderEmails((prev) => [data, ...prev]);
        toast.success("Sender email added successfully");
        return data as SenderEmail;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add sender email");
        return null;
      }
    },
    [user, senderEmails.length],
  );

  const updateSenderEmail = useCallback(
    async (id: string, updates: UpdateSenderEmailInput) => {
      if (!user) return false;

      try {
        const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (updates.email_address !== undefined) {
          const emailAddress = updates.email_address.trim().toLowerCase();
          payload.email_address = emailAddress;
          payload.domain = extractDomain(emailAddress);
        }
        if (updates.display_name !== undefined) {
          payload.display_name = updates.display_name.trim();
        }
        if (updates.provider !== undefined) {
          payload.provider = updates.provider;
        }
        if (updates.provider_id !== undefined) {
          payload.provider_id = updates.provider_id;
        }
        if (updates.platform !== undefined) {
          payload.platform = updates.platform;
        }
        if (updates.daily_limit !== undefined) {
          payload.daily_limit = updates.daily_limit;
        }
        if (updates.status !== undefined) {
          payload.status = updates.status;
        }
        if (updates.provider_metadata !== undefined) {
          payload.provider_metadata = updates.provider_metadata;
        }

        const { error } = await supabase
          .from("sender_emails")
          .update(payload)
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          if (error.code === "23505") {
            toast.error("This email address is already registered");
            return false;
          }
          throw error;
        }

        setSenderEmails((prev) =>
          prev.map((se) => (se.id === id ? { ...se, ...payload } as SenderEmail : se)),
        );
        toast.success("Sender email updated");
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update sender email");
        return false;
      }
    },
    [user],
  );

  const deleteSenderEmail = useCallback(
    async (id: string) => {
      if (!user) return false;

      try {
        const target = senderEmails.find((se) => se.id === id);
        const { error } = await supabase
          .from("sender_emails")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        const remaining = senderEmails.filter((se) => se.id !== id);

        if (target?.is_default && remaining.length > 0) {
          const newDefault = remaining[0];
          await supabase
            .from("sender_emails")
            .update({ is_default: true, updated_at: new Date().toISOString() })
            .eq("id", newDefault.id);

          remaining[0] = { ...newDefault, is_default: true };
        }

        setSenderEmails(remaining);
        toast.success("Sender email removed");
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove sender email");
        return false;
      }
    },
    [user, senderEmails],
  );

  const setDefault = useCallback(
    async (id: string) => {
      if (!user) return false;

      try {
        await supabase
          .from("sender_emails")
          .update({ is_default: false, updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("is_default", true);

        const { error } = await supabase
          .from("sender_emails")
          .update({ is_default: true, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        setSenderEmails((prev) =>
          prev.map((se) => ({ ...se, is_default: se.id === id })),
        );
        toast.success("Default sender email updated");
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to set default");
        return false;
      }
    },
    [user],
  );

  const defaultSenderEmail = senderEmails.find((se) => se.is_default) ?? null;

  return {
    senderEmails,
    loading,
    defaultSenderEmail,
    createSenderEmail,
    updateSenderEmail,
    deleteSenderEmail,
    setDefault,
    refetch: fetchSenderEmails,
  };
}
