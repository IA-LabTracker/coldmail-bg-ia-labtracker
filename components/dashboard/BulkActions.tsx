"use client";

import { useState } from "react";
import axios from "axios";
import { Email } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Info, Send, Trash2, X } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface BulkActionsProps {
  selectedEmails: Email[];
  onClear: () => void;
  onBulkDelete: () => void;
}

type MessageType = "success" | "error" | "info";

interface Message {
  type: MessageType;
  text: string;
}

export function BulkActions({ selectedEmails, onClear, onBulkDelete }: BulkActionsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const handleSendInitialEmail = async () => {
    if (!process.env.NEXT_PUBLIC_WEBHOOK_N8N) {
      setMessage({
        type: "error",
        text: "Webhook URL not configured. Please set it in Settings.",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "info", text: "Triggering initial email webhook..." });

    try {
      await axios.post(process.env.NEXT_PUBLIC_WEBHOOK_N8N, {
        emails: selectedEmails,
      });

      setMessage({
        type: "success",
        text: `Webhook triggered for ${selectedEmails.length} recipient${selectedEmails.length > 1 ? "s" : ""}.`,
      });

      // Auto clear after success
      setTimeout(() => {
        onClear();
        setMessage(null);
      }, 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to trigger webhook. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (selectedEmails.length === 0) {
    return null;
  }

  const messageIcons: Record<MessageType, React.ReactNode> = {
    success: <CheckCircle className="h-4 w-4 text-green-600" />,
    error: <AlertCircle className="h-4 w-4 text-red-600" />,
    info: <Info className="h-4 w-4 text-blue-600" />,
  };

  const messageBgs: Record<MessageType, string> = {
    success: "bg-green-50 border-green-100 text-green-800",
    error: "bg-red-50 border-red-100 text-red-800",
    info: "bg-blue-50 border-blue-100 text-blue-800",
  };

  return (
    <Card className="bg-white border border-blue-100 shadow-sm">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-700 font-semibold flex items-center justify-center">
              {selectedEmails.length}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {selectedEmails.length} email{selectedEmails.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-gray-500">
                Choose an action to run on the selected records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSendInitialEmail} disabled={loading} size="sm" className="gap-2">
              {loading ? <LoadingSpinner /> : <Send className="h-4 w-4" />}
              {loading ? "Sending..." : "Send Initial Email"}
            </Button>

            <Button
              onClick={onBulkDelete}
              disabled={loading}
              variant="outline"
              size="sm"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>

            <Button
              onClick={onClear}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        {message && (
          <div
            className={`flex items-center gap-3 rounded-md border p-3 text-sm ${messageBgs[message.type]}`}
          >
            {messageIcons[message.type]}
            <p>{message.text}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
