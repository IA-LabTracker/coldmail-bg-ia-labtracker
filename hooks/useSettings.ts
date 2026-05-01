"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Settings } from "@/types";

export type FeedbackMessage = { type: "success" | "error"; text: string } | null;

const PRIVATE_HOST_PATTERN =
  /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|::1?$|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|fe80:)/i;

const webhookUrlField = z
  .string()
  .max(2048, "URL too long")
  .refine(
    (value) => {
      if (value === "") return true;
      try {
        const parsed = new URL(value);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
        if (PRIVATE_HOST_PATTERN.test(parsed.hostname)) return false;
        return true;
      } catch {
        return false;
      }
    },
    { message: "Enter a public http(s) URL — private hosts are not allowed" },
  );

const settingsSchema = z.object({
  webhookUrl: webhookUrlField,
  linkedinWebhookUrl: webhookUrlField,
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackMessage>(null);
  const [linkedinAccountId, setLinkedinAccountId] = useState<string | null>(null);
  const hasCheckedOAuth = useRef(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { webhookUrl: "", linkedinWebhookUrl: "" },
  });

  const fetchLinkedInAccount = useCallback(
    async (sync = false): Promise<string | null> => {
      if (!user) return null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return null;
        const url = sync ? "/api/linkedin-accounts?sync=true" : "/api/linkedin-accounts";
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return null;
        const data = await res.json();
        const accounts = data.accounts || [];
        const connected = accounts.find((a: { is_active: boolean }) => a.is_active);
        return connected?.account_id || null;
      } catch {
        return null;
      }
    },
    [user],
  );

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSettings(data);
          form.reset({
            webhookUrl: data.webhook_url || "",
            linkedinWebhookUrl: data.linkedin_webhook_url || "",
          });
        } else {
          const { data: newSettings, error: createError } = await supabase
            .from("settings")
            .upsert({ user_id: user.id }, { onConflict: "user_id" })
            .select()
            .single();
          if (createError) throw createError;
          setSettings(newSettings);
        }
      } catch (err) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to load settings",
        });
      }

      if (!hasCheckedOAuth.current) {
        hasCheckedOAuth.current = true;
        const params = new URLSearchParams(window.location.search);
        const returningFromOAuth = params.get("connected") === "true";
        if (params.has("connected")) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        const id = await fetchLinkedInAccount(returningFromOAuth);
        setLinkedinAccountId(id);
      }

      setLoading(false);
    };

    init();
  }, [user, fetchLinkedInAccount, form]);

  const onSubmit = async (values: SettingsFormValues) => {
    if (!user || !settings) return;
    setFeedback(null);
    try {
      const { error } = await supabase
        .from("settings")
        .update({
          webhook_url: values.webhookUrl,
          linkedin_webhook_url: values.linkedinWebhookUrl,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      setFeedback({ type: "success", text: "Settings saved successfully" });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save settings",
      });
    }
  };

  return {
    loading,
    feedback,
    form,
    linkedinAccountId,
    setLinkedinAccountId,
    onSubmit,
  };
}
