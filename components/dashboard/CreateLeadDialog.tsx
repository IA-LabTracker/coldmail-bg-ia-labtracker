"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle, Loader2, User, MapPin, Send, Building2 } from "lucide-react";

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  campaignNames?: string[];
}

const createLeadSchema = z.object({
  lead_name: z.string().min(1, "Lead name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(1, "Company is required"),
  phone: z.string().optional(),
  campaign_name: z.string().optional(),
  status: z.enum(["researched", "sent", "replied", "bounced", "opened"]),
  lead_classification: z.enum(["hot", "warm", "cold"]),
  region: z.string().trim().min(1, "Region is required"),
  industry: z.string().trim().min(1, "Industry is required"),
  keywords: z.string().optional(),
  lead_category: z.string().optional(),
  client_tag: z.string().optional(),
  client_step: z.string().optional(),
  notes: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  google_maps_url: z.string().optional(),
  sender_email: z.string().email("Invalid email").or(z.literal("")).optional(),
  prospect_cc_email: z.string().optional(),
});

type CreateLeadFormValues = z.infer<typeof createLeadSchema>;

const defaultValues: CreateLeadFormValues = {
  lead_name: "",
  email: "",
  company: "",
  phone: "",
  campaign_name: "",
  status: "researched",
  lead_classification: "cold",
  region: "",
  industry: "",
  keywords: "",
  lead_category: "",
  client_tag: "",
  client_step: "",
  notes: "",
  city: "",
  state: "",
  address: "",
  google_maps_url: "",
  sender_email: "",
  prospect_cc_email: "",
};

export function CreateLeadDialog({
  open,
  onOpenChange,
  onCreated,
  campaignNames = [],
}: CreateLeadDialogProps) {
  const { user } = useAuth();

  const form = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadSchema),
    defaultValues,
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) form.reset(defaultValues);
    onOpenChange(newOpen);
  };

  const onSubmit = async (values: CreateLeadFormValues) => {
    if (!user) return;

    try {
      const keywordsArray = values.keywords
        ? values.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : [];

      const { error: insertError } = await supabase.from("emails").insert({
        user_id: user.id,
        lead_name: values.lead_name,
        email: values.email,
        company: values.company,
        phone: values.phone || null,
        campaign_name: values.campaign_name || null,
        status: values.status,
        lead_classification: values.lead_classification,
        region: values.region,
        industry: values.industry,
        keywords: keywordsArray,
        lead_category: values.lead_category || null,
        client_tag: values.client_tag || null,
        client_step: values.client_step || null,
        notes: values.notes || null,
        city: values.city || null,
        state: values.state || null,
        address: values.address || null,
        google_maps_url: values.google_maps_url || null,
        sender_email: values.sender_email || null,
        prospect_cc_email: values.prospect_cc_email || null,
        response_content: null,
        date_sent: null,
      });

      if (insertError) throw insertError;

      toast.success("Lead created successfully");
      form.reset(defaultValues);
      onOpenChange(false);
      onCreated();
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Failed to create lead",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">New Lead</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Add a new lead to your outreach pipeline
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {form.formState.errors.root && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 mx-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {form.formState.errors.root.message}
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <Tabs defaultValue="general" className="flex flex-col flex-1 overflow-hidden">
              <TabsList className="w-full grid grid-cols-3 shrink-0">
                <TabsTrigger value="general" className="text-xs gap-1">
                  <User className="h-3.5 w-3.5" />
                  General
                </TabsTrigger>
                <TabsTrigger value="location" className="text-xs gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Location
                </TabsTrigger>
                <TabsTrigger value="email-config" className="text-xs gap-1">
                  <Send className="h-3.5 w-3.5" />
                  Email Config
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4 pr-1">
                {/* General Tab */}
                <TabsContent value="general" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lead_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            Lead Name *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Email *</FormLabel>
                          <FormControl>
                            <Input placeholder="john@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Company *</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Inc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+55 (11) 99999-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="campaign_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Campaign</FormLabel>
                          {campaignNames.length > 0 ? (
                            <Select
                              onValueChange={(val) => field.onChange(val === "__new__" ? "" : val)}
                              value={
                                field.value && campaignNames.includes(field.value)
                                  ? field.value
                                  : field.value
                                    ? "__new__"
                                    : ""
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select campaign" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {campaignNames.map((name) => (
                                  <SelectItem key={name} value={name}>
                                    {name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="__new__">+ Type new...</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <FormControl>
                              <Input placeholder="Campaign name" {...field} />
                            </FormControl>
                          )}
                          {field.value &&
                            campaignNames.length > 0 &&
                            !campaignNames.includes(field.value) && (
                              <FormControl>
                                <Input
                                  placeholder="New campaign name"
                                  value={field.value === "__new__" ? "" : field.value}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  className="mt-2"
                                />
                              </FormControl>
                            )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lead_classification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            Classification
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hot">Hot</SelectItem>
                              <SelectItem value="warm">Warm</SelectItem>
                              <SelectItem value="cold">Cold</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="researched">Researched</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="replied">Replied</SelectItem>
                              <SelectItem value="bounced">Bounced</SelectItem>
                              <SelectItem value="opened">Opened</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lead_category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Category</FormLabel>
                          <FormControl>
                            <Input placeholder="Category" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_tag"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Tag</FormLabel>
                          <FormControl>
                            <Input placeholder="Tag" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Region *</FormLabel>
                          <FormControl>
                            <Input placeholder="Region" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Industry *</FormLabel>
                          <FormControl>
                            <Input placeholder="Industry" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_step"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            Client Step
                          </FormLabel>
                          <Select
                            onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select step" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">-</SelectItem>
                              <SelectItem value="first_send">first_send</SelectItem>
                              <SelectItem value="follow_1">follow_1</SelectItem>
                              <SelectItem value="follow_2">follow_2</SelectItem>
                              <SelectItem value="follow_3">follow_3</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Keywords (comma separated)
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="saas, b2b, marketing" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notes about this lead..."
                            className="min-h-20 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Location Tab */}
                <TabsContent value="location" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Full address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="google_maps_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Google Maps URL
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://maps.google.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Email Config Tab */}
                <TabsContent value="email-config" className="mt-0 space-y-4">
                  <FormField
                    control={form.control}
                    name="sender_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Sender Email
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="sender@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prospect_cc_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Prospect CC</FormLabel>
                        <FormControl>
                          <Input placeholder="cc@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </div>

              {/* Footer */}
              <div className="flex justify-between gap-2 pt-4 border-t mt-4 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={form.formState.isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1">
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create Lead"
                  )}
                </Button>
              </div>
            </Tabs>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
