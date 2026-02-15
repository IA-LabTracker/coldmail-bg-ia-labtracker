"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LinkedInMessage } from "@/types";
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
import {
  AlertCircle,
  Loader2,
  User,
  Briefcase,
  MessageSquare,
  Crown,
  ExternalLink,
} from "lucide-react";

interface LinkedInDetailModalProps {
  message: LinkedInMessage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-gray-100", text: "text-gray-800" },
  sent: { bg: "bg-blue-100", text: "text-blue-800" },
  delivered: { bg: "bg-indigo-100", text: "text-indigo-800" },
  read: { bg: "bg-purple-100", text: "text-purple-800" },
  replied: { bg: "bg-green-100", text: "text-green-800" },
  failed: { bg: "bg-red-100", text: "text-red-800" },
};

const classificationBadgeColors: Record<string, string> = {
  hot: "bg-red-100 text-red-800",
  warm: "bg-orange-100 text-orange-800",
  cold: "bg-blue-100 text-blue-800",
};

const editSchema = z.object({
  lead_classification: z.enum(["hot", "warm", "cold"]),
  notes: z.string().optional(),
  headline: z.string().optional(),
  current_position: z.string().optional(),
  current_company: z.string().optional(),
  location: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

function getDefaults(msg: LinkedInMessage | null): EditFormValues {
  return {
    lead_classification: (msg?.lead_classification as "hot" | "warm" | "cold") || "cold",
    notes: msg?.notes || "",
    headline: msg?.headline || "",
    current_position: msg?.current_position || "",
    current_company: msg?.current_company || "",
    location: msg?.location || "",
  };
}

export function LinkedInDetailModal({ message, open, onOpenChange, onUpdate }: LinkedInDetailModalProps) {
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: getDefaults(message),
  });

  useEffect(() => {
    if (message) {
      form.reset(getDefaults(message));
    }
  }, [message, form]);

  if (!message) return null;

  const fullName = `${message.first_name} ${message.last_name}`.trim();

  const onSubmit = async (values: EditFormValues) => {
    try {
      const { error: updateError } = await supabase
        .from("linkedin_messages")
        .update({
          lead_classification: values.lead_classification,
          notes: values.notes || null,
          headline: values.headline || null,
          current_position: values.current_position || null,
          current_company: values.current_company || null,
          location: values.location || null,
        })
        .eq("id", message.id);

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
            {message.profile_picture_url ? (
              <img
                src={message.profile_picture_url}
                alt={fullName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">{fullName || "Unknown Lead"}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground truncate">
                {message.current_position} {message.current_company ? `at ${message.current_company}` : ""}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[message.status]?.bg || "bg-gray-100"}>
                <span className={statusColors[message.status]?.text || "text-gray-800"}>
                  {message.status}
                </span>
              </Badge>
              <Badge className={classificationBadgeColors[message.lead_classification] || "bg-gray-100"}>
                {message.lead_classification}
              </Badge>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
            <span>Created: {formatDateOnly(message.created_at)}</span>
            {message.sent_at && <span>Sent: {formatDate(message.sent_at)}</span>}
            {message.campaign_name && <span>Campaign: {message.campaign_name}</span>}
            {message.is_premium && (
              <span className="flex items-center gap-1 text-amber-600">
                <Crown className="h-3 w-3" /> Premium
              </span>
            )}
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
                <TabsTrigger value="professional" className="text-xs gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  Professional
                </TabsTrigger>
                <TabsTrigger value="message" className="text-xs gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Message
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4 pr-1">
                <TabsContent value="general" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm bg-muted/30">
                    <div>
                      <p className="text-xs text-muted-foreground">First Name</p>
                      <p className="font-medium">{message.first_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Name</p>
                      <p className="font-medium">{message.last_name || "—"}</p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Headline</FormLabel>
                        <FormControl>
                          <Input placeholder="LinkedIn headline" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lead_classification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Classification</FormLabel>
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

                  {message.linkedin_url && (
                    <a
                      href={message.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View LinkedIn Profile
                    </a>
                  )}
                </TabsContent>

                <TabsContent value="professional" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="current_company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Company" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="current_position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Position</FormLabel>
                          <FormControl>
                            <Input placeholder="Position" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 rounded-lg border p-3 text-sm bg-muted/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Followers</p>
                      <p className="font-medium">{message.follower_count?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Connections</p>
                      <p className="font-medium">{message.connections_count?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lead Score</p>
                      <p className="font-medium">{message.lead_quality_score || 0}/100</p>
                    </div>
                  </div>

                  {message.top_skills && message.top_skills.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Top Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {message.top_skills.map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.profile_summary && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Profile Summary</p>
                      <div className="rounded-lg border p-3 text-sm bg-muted/30 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {message.profile_summary}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="message" className="mt-0 space-y-4">
                  {message.message_sent && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Message Sent</p>
                      <div className="rounded-lg border p-3 text-sm bg-muted/30 whitespace-pre-wrap">
                        {message.message_sent}
                      </div>
                    </div>
                  )}

                  {(message.sent_at || message.delivered_at || message.read_at || message.replied_at) && (
                    <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm bg-muted/30">
                      {message.sent_at && (
                        <div>
                          <p className="text-xs text-muted-foreground">Sent At</p>
                          <p className="font-medium">{formatDate(message.sent_at)}</p>
                        </div>
                      )}
                      {message.delivered_at && (
                        <div>
                          <p className="text-xs text-muted-foreground">Delivered At</p>
                          <p className="font-medium">{formatDate(message.delivered_at)}</p>
                        </div>
                      )}
                      {message.read_at && (
                        <div>
                          <p className="text-xs text-muted-foreground">Read At</p>
                          <p className="font-medium">{formatDate(message.read_at)}</p>
                        </div>
                      )}
                      {message.replied_at && (
                        <div>
                          <p className="text-xs text-muted-foreground">Replied At</p>
                          <p className="font-medium">{formatDate(message.replied_at)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {message.response_content && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Response</p>
                      <div className="rounded-lg border p-3 text-sm bg-green-50 whitespace-pre-wrap">
                        {message.response_content}
                      </div>
                    </div>
                  )}

                  {!message.message_sent && !message.response_content && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                      <p className="text-sm">No message data yet</p>
                    </div>
                  )}
                </TabsContent>
              </div>

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
