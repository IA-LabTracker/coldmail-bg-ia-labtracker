"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Rocket } from "lucide-react";

interface SearchFormValues {
  region: string;
  industry: string;
  keywords: string;
  campaignName: string;
}

interface SearchFormCardProps {
  form: UseFormReturn<SearchFormValues>;
  onSubmit: (values: SearchFormValues) => void;
  isSubmitting: boolean;
  disabled: boolean;
}

export function SearchFormCard({
  form,
  onSubmit,
  isSubmitting,
  disabled,
}: SearchFormCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Campaign Details</h2>
        <p className="text-xs text-muted-foreground">
          Define your search criteria to find the right leads
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="campaignName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., US SaaS Companies Q1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Brazil, USA, Europe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Tech, Finance, Healthcare" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="keywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keywords (comma-separated)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., automation, CRM, SaaS, cloud"
                    className="min-h-20 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || disabled}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Triggering...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Trigger Campaign
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
