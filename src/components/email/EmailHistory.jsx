import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EmailService } from "@/lib/emailService";
import { format } from "date-fns";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Paperclip,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-yellow-600", label: "Pending" },
  sent: { icon: CheckCircle2, color: "text-blue-600", label: "Sent" },
  delivered: { icon: CheckCircle2, color: "text-green-600", label: "Delivered" },
  opened: { icon: CheckCircle2, color: "text-green-700", label: "Opened" },
  bounced: { icon: AlertCircle, color: "text-red-600", label: "Bounced" },
  failed: { icon: AlertCircle, color: "text-red-600", label: "Failed" },
};

const TYPE_LABELS = {
  quote: "Quote", agreement: "Agreement", invoice: "Invoice",
  reminder: "Reminder", confirmation: "Confirmation",
  update: "Update", follow_up: "Follow Up", general: "General",
};

function EmailRow({ record }) {
  const [expanded, setExpanded] = useState(false);
  const email = record.email;
  const config = STATUS_CONFIG[email?.delivery_status || "sent"];
  const Icon = config.icon;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon className={`w-4 h-4 ${config.color} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-medium truncate">{email?.subject}</span>
            {email?.message_type && email.message_type !== "general" && (
              <Badge variant="secondary" className="text-xs">
                {TYPE_LABELS[email.message_type] || email.message_type}
              </Badge>
            )}
            {email?.attachments?.length > 0 && (
              <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {record.direction === "outbound" ? (
                <><Send className="w-3 h-3" />To {email?.recipient_email}</>
              ) : (
                <><Mail className="w-3 h-3" />From {email?.recipient_email}</>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(email?.sent_at || record.timestamp), "MMM d, h:mm a")}
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border bg-muted/10 space-y-3">
          {email?.body_html ? (
            <div
              className="text-sm prose prose-sm max-w-none pt-3"
              dangerouslySetInnerHTML={{ __html: email.body_html }}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap pt-3">{email?.body_plain || "—"}</p>
          )}

          {email?.attachments?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Attachments</p>
              <div className="space-y-1">
                {email.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Paperclip className="w-3 h-3" />
                    {att.file_name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EmailHistory({ entity_type, entity_id }) {
  const { data: history, isLoading } = useQuery({
    queryKey: ["email-history", entity_type, entity_id],
    queryFn: () => EmailService.getEmailHistory(entity_type, entity_id),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading email history...</p>;
  }

  if (!history?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Mail className="w-8 h-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No emails yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((rec) => (
        <EmailRow key={rec.id} record={rec} />
      ))}
    </div>
  );
}