"use client";

import { memo } from "react";
import { Archive, ArchiveRestore, CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { Email } from "@/types";
import {
  INTENT_COLORS,
  INTENT_LABELS,
  ReplyIntent,
  classifyReply,
} from "@/lib/replyClassifier";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface InboxRowProps {
  email: Email;
  intentOverride: ReplyIntent | null;
  isArchived: boolean;
  onOpenDetail: (email: Email) => void;
  onSetArchived: (email: Email, archived: boolean) => void;
  onMarkDeal: (email: Email, status: "won" | "lost") => void;
}

function InboxRowImpl({
  email,
  intentOverride,
  isArchived,
  onOpenDetail,
  onSetArchived,
  onMarkDeal,
}: InboxRowProps) {
  const intent: ReplyIntent = intentOverride ?? classifyReply(email.reply_we_got);
  const replyPreview = (email.reply_we_got || "").trim().slice(0, 280);
  const replyTimestamp = email.time_we_got_reply || email.updated_at;

  return (
    <article className="rounded-lg border border-border bg-card p-4 transition hover:border-foreground/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {email.lead_name || email.email}
            </h3>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="truncate text-xs text-muted-foreground">{email.company}</span>
            <Badge className={INTENT_COLORS[intent]} variant="secondary">
              {INTENT_LABELS[intent]}
            </Badge>
            {email.deal_status === "won" && (
              <Badge className="bg-green-600 text-white hover:bg-green-700" variant="default">
                Closed won
                {email.deal_value
                  ? ` · ${Number(email.deal_value).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    })}`
                  : ""}
              </Badge>
            )}
            {email.deal_status === "lost" && (
              <Badge variant="outline" className="text-muted-foreground">
                Closed lost
              </Badge>
            )}
            {email.deal_status === "open" && (
              <Badge variant="outline" className="border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-300">
                Open deal
              </Badge>
            )}
          </div>
          <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {replyPreview || "Reply body unavailable"}
          </p>
          {replyTimestamp && (
            <p className="mt-2 text-[11px] text-muted-foreground/70">{replyTimestamp}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onOpenDetail(email)} className="h-7">
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          Open lead
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onMarkDeal(email, "won")}
          className="h-7 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20"
          disabled={email.deal_status === "won"}
        >
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
          Close as won
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onMarkDeal(email, "lost")}
          className="h-7 text-muted-foreground"
          disabled={email.deal_status === "lost"}
        >
          <XCircle className="mr-1.5 h-3.5 w-3.5" />
          Close as lost
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onSetArchived(email, !isArchived)}
          className="h-7 text-muted-foreground"
        >
          {isArchived ? (
            <>
              <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />
              Restore
            </>
          ) : (
            <>
              <Archive className="mr-1.5 h-3.5 w-3.5" />
              Archive
            </>
          )}
        </Button>
      </div>
    </article>
  );
}

export const InboxRow = memo(InboxRowImpl);
