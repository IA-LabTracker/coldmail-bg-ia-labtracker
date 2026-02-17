"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Check, CheckCheck } from "lucide-react";

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string | null;
  direction: "sent" | "received";
  status?: "sent" | "delivered" | "read" | "replied";
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  emptyMessage?: string;
  className?: string;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatusIcon({ status, direction }: { status?: string; direction: "sent" | "received" }) {
  if (!status) return null;

  const baseClass = direction === "sent" ? "text-primary-foreground/70" : "text-muted-foreground";
  const blueClass = "text-blue-400";

  if (status === "read" || status === "replied") {
    return <CheckCheck className={cn("h-4 w-4", blueClass)} />;
  }
  if (status === "delivered") {
    return <CheckCheck className={cn("h-4 w-4", baseClass)} />;
  }
  return <Check className={cn("h-4 w-4", baseClass)} />;
}

export function ChatMessageList({
  messages,
  emptyMessage = "No messages yet",
  className,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border bg-muted/20 h-[400px]",
          className,
        )}
      >
        <MessageSquare className="h-8 w-8 mb-2 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("rounded-lg border bg-muted/20 h-[400px]", className)}>
      <div className="flex flex-col gap-3 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[80%]",
              msg.direction === "sent" ? "self-end items-end" : "self-start items-start",
            )}
          >
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words",
                msg.direction === "sent"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted rounded-bl-md",
              )}
            >
              {msg.content}
              <div
                className={cn(
                  "flex items-center justify-end gap-1 mt-1",
                  msg.direction === "sent" ? "text-primary-foreground/60" : "text-muted-foreground",
                )}
              >
                {msg.timestamp && (
                  <span className="text-[10px]">{formatMessageTime(msg.timestamp)}</span>
                )}
                {msg.direction === "sent" && (
                  <StatusIcon status={msg.status} direction={msg.direction} />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
