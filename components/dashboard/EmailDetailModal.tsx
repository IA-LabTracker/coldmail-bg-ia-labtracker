"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Email } from "@/types";
import { supabase } from "@/lib/supabase";
import { formatDate, formatDateOnly } from "@/lib/formatDate";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle, Loader2, Building2, User, MapPin, Send, MessageSquare } from "lucide-react";

interface EmailDetailModalProps {
  email: Email | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  sent: { bg: "bg-blue-100", text: "text-blue-800" },
  replied: { bg: "bg-green-100", text: "text-green-800" },
  bounced: { bg: "bg-red-100", text: "text-red-800" },
  researched: { bg: "bg-yellow-100", text: "text-yellow-800" },
};

const classificationColors: Record<string, string> = {
  hot: "bg-red-100 text-red-800",
  warm: "bg-orange-100 text-orange-800",
  cold: "bg-blue-100 text-blue-800",
};

const editSchema = z.object({
  lead_name: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")),
  phone: z.string().optional(),
  classification: z.enum(["hot", "warm", "cold"]),
  lead_category: z.string().optional(),
  client_tag: z.string().optional(),
  client_step: z.string().optional(),
  notes: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  google_maps_url: z.string().optional(),
  sender_email: z.string().optional(),
  prospect_cc_email: z.string().optional(),
  cc_email_1: z.string().optional(),
  cc_email_2: z.string().optional(),
  cc_email_3: z.string().optional(),
  bcc_email_1: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

export function EmailDetailModal({ email, open, onOpenChange, onUpdate }: EmailDetailModalProps) {
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: getDefaults(email),
  });

  useEffect(() => {
    if (email) {
      form.reset(getDefaults(email));
    }
  }, [email, form]);

  if (!email) return null;

  const onSubmit = async (values: EditFormValues) => {
    try {
      const { error: updateError } = await supabase
        .from("emails")
        .update({
          lead_name: values.lead_name || null,
          email: values.email,
          phone: values.phone || null,
          lead_classification: values.classification as any,
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
          cc_email_1: values.cc_email_1 || null,
          cc_email_2: values.cc_email_2 || null,
          cc_email_3: values.cc_email_3 || null,
          bcc_email_1: values.bcc_email_1 || null,
        })
        .eq("id", email.id);

      if (updateError) throw updateError;

      onUpdate();
      onOpenChange(false);
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Failed to save changes",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">Edit Information</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground truncate">
                {email.company}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[email.status]?.bg || "bg-gray-100"}>
                <span className={statusColors[email.status]?.text || "text-gray-800"}>
                  {email.status}
                </span>
              </Badge>
              <Badge className={classificationColors[email.lead_classification] || "bg-gray-100"}>
                {email.lead_classification}
              </Badge>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
            <span>Created: {formatDateOnly(email.created_at)}</span>
            {email.date_sent && <span>Sent: {formatDate(email.date_sent)}</span>}
            {email.campaign_name && <span>Campaign: {email.campaign_name}</span>}
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
              <TabsList className="w-full grid grid-cols-4 shrink-0">
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
                <TabsTrigger value="replies" className="text-xs gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Replies
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
                          <FormLabel className="text-xs text-muted-foreground">Lead Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Contact name" {...field} />
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
                          <FormLabel className="text-xs text-muted-foreground">Email</FormLabel>
                          <FormControl>
                            <Input placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="classification"
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
                      name="lead_category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            Lead Category
                          </FormLabel>
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
                          <FormLabel className="text-xs text-muted-foreground">
                            Client Tag
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Tag" {...field} />
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
                            Client Steps
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Status" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add notes about this lead..."
                            className="min-h-20 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Read-only info */}
                  <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm bg-muted/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Region</p>
                      <p className="font-medium">{email.region || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Industry</p>
                      <p className="font-medium">{email.industry || "—"}</p>
                    </div>
                  </div>

                  {email.keywords.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {email.keywords.map((kw, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
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

                  {email.google_maps_url && (
                    <a
                      href={email.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      View on Google Maps
                    </a>
                  )}
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cc_email_1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            CC Email 1
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="cc1@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cc_email_2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            CC Email 2
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="cc2@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cc_email_3"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            CC Email 3
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="cc3@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bcc_email_1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">BCC Email</FormLabel>
                          <FormControl>
                            <Input placeholder="bcc@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Replies Tab */}
                <TabsContent value="replies" className="mt-0 space-y-4">
                  {(email.time_we_got_reply || email.reply_time) && (
                    <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm bg-muted/30">
                      {email.time_we_got_reply && (
                        <div>
                          <p className="text-xs text-muted-foreground">Time We Got Reply</p>
                          <p className="font-medium">{email.time_we_got_reply}</p>
                        </div>
                      )}
                      {email.reply_time && (
                        <div>
                          <p className="text-xs text-muted-foreground">Reply Time</p>
                          <p className="font-medium">{email.reply_time}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {email.reply_we_got && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reply We Got</p>
                      <div className="rounded-lg border p-3 text-sm bg-muted/30 whitespace-pre-wrap">
                        {email.reply_we_got}
                      </div>
                    </div>
                  )}

                  {email.our_last_reply && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Our Last Reply</p>
                      <div className="rounded-lg border p-3 text-sm bg-muted/30 whitespace-pre-wrap">
                        {email.our_last_reply}
                      </div>
                    </div>
                  )}

                  {email.response_content && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Response Content</p>
                      <div className="rounded-lg border p-3 text-sm bg-muted/30 whitespace-pre-wrap">
                        {email.response_content}
                      </div>
                    </div>
                  )}

                  {!email.reply_we_got &&
                    !email.our_last_reply &&
                    !email.response_content &&
                    !email.time_we_got_reply && (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                        <p className="text-sm">No reply data yet</p>
                      </div>
                    )}
                </TabsContent>
              </div>

              {/* Footer with Save/Cancel */}
              <div className="flex gap-2 pt-4 border-t mt-4 shrink-0">
                <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1">
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={form.formState.isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Tabs>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function getDefaults(email: Email | null): EditFormValues {
  return {
    lead_name: email?.lead_name || "",
    email: email?.email || "",
    phone: email?.phone || "",
    classification: (email?.lead_classification as "hot" | "warm" | "cold") || "cold",
    lead_category: email?.lead_category || "",
    client_tag: email?.client_tag || "",
    client_step: email?.client_step || "",
    notes: email?.notes || "",
    city: email?.city || "",
    state: email?.state || "",
    address: email?.address || "",
    google_maps_url: email?.google_maps_url || "",
    sender_email: email?.sender_email || "",
    prospect_cc_email: email?.prospect_cc_email || "",
    cc_email_1: email?.cc_email_1 || "",
    cc_email_2: email?.cc_email_2 || "",
    cc_email_3: email?.cc_email_3 || "",
    bcc_email_1: email?.bcc_email_1 || "",
  };
}
