"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { EmailTemplate, EmailTemplatePlatform } from "@/types";
import { toast } from "sonner";

export interface CreateTemplateInput {
  name: string;
  description?: string;
  subject: string;
  body_html: string;
  platform?: EmailTemplatePlatform;
  is_default?: boolean;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  subject?: string;
  body_html?: string;
  platform?: EmailTemplatePlatform;
  is_default?: boolean;
}

export function useTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates((data as EmailTemplate[]) || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = useCallback(
    async (input: CreateTemplateInput) => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from("email_templates")
          .insert({
            user_id: user.id,
            name: input.name.trim(),
            description: input.description?.trim() ?? "",
            subject: input.subject.trim(),
            body_html: input.body_html,
            platform: input.platform ?? "any",
            is_default: input.is_default ?? false,
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            toast.error("A template with this name or default already exists");
            return null;
          }
          throw error;
        }

        setTemplates((prev) => [data as EmailTemplate, ...prev]);
        toast.success("Template created");
        return data as EmailTemplate;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create template");
        return null;
      }
    },
    [user],
  );

  const updateTemplate = useCallback(
    async (id: string, updates: UpdateTemplateInput) => {
      if (!user) return false;

      try {
        const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (updates.name !== undefined) payload.name = updates.name.trim();
        if (updates.description !== undefined) payload.description = updates.description.trim();
        if (updates.subject !== undefined) payload.subject = updates.subject.trim();
        if (updates.body_html !== undefined) payload.body_html = updates.body_html;
        if (updates.platform !== undefined) payload.platform = updates.platform;
        if (updates.is_default !== undefined) payload.is_default = updates.is_default;

        const { error } = await supabase
          .from("email_templates")
          .update(payload)
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          if (error.code === "23505") {
            toast.error("A template with this name or default already exists");
            return false;
          }
          throw error;
        }

        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? ({ ...t, ...payload } as EmailTemplate) : t)),
        );
        toast.success("Template updated");
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update template");
        return false;
      }
    },
    [user],
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("email_templates")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        setTemplates((prev) => prev.filter((t) => t.id !== id));
        toast.success("Template removed");
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove template");
        return false;
      }
    },
    [user],
  );

  const setDefault = useCallback(
    async (id: string) => {
      if (!user) return false;

      const target = templates.find((t) => t.id === id);
      if (!target) return false;

      try {
        await supabase
          .from("email_templates")
          .update({ is_default: false, updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("platform", target.platform)
          .eq("is_default", true);

        const { error } = await supabase
          .from("email_templates")
          .update({ is_default: true, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        setTemplates((prev) =>
          prev.map((t) =>
            t.platform === target.platform ? { ...t, is_default: t.id === id } : t,
          ),
        );
        toast.success("Default template updated");
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to set default");
        return false;
      }
    },
    [user, templates],
  );

  const duplicateTemplate = useCallback(
    async (id: string) => {
      const source = templates.find((t) => t.id === id);
      if (!source) return null;

      return createTemplate({
        name: `${source.name} (copy)`,
        description: source.description,
        subject: source.subject,
        body_html: source.body_html,
        platform: source.platform,
        is_default: false,
      });
    },
    [templates, createTemplate],
  );

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefault,
    duplicateTemplate,
    refetch: fetchTemplates,
  };
}
