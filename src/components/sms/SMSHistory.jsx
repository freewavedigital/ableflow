import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { SMSService } from "@/lib/smsService";
import { format } from "date-fns";
import { MessageCircle, Send, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DELIVERY_STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", label: "Pending" },
  sent: { icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50", label: "Sent" },
  delivered: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", label: "Delivered" },
  read: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", label: "Read" },
  failed: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", label: "Failed" },
};

const MESSAGE_TYPE_LABELS = {
  reminder: "Reminder",
  confirmation: "Confirmation",
  quote: "Quote",
  update: "Update",
  follow_up: "Follow Up",
  emergency: "Emergency",
  general: "General",
};

export default function SMSHistory({ entity_type, entity_id }) {
  const { data: smsHistory, isLoading } = useQuery({
    queryKey: ["sms-history", entity_type, entity_id],
    queryFn: () => SMSService.getSMSHistory(entity_type, entity_id),
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading SMS history...</div>;
  }

  if (!smsHistory?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageCircle className="w-8 h-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No SMS messages yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {smsHistory.map((record) => {
        const sms = record.sms;
        const config = DELIVERY_STATUS_CONFIG[sms?.delivery_status || "sent"];
        const Icon = config.icon;

        return (
          <Card key={record.id} className={`p-3 ${config.bg}`}>
            <div className="flex items-start gap-3">
              <Icon className={`w-4 h-4 ${config.color} mt-0.5 flex-shrink-0`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    {record.direction === "outbound" ? (
                      <Send className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium capitalize">
                      {record.direction === "outbound" ? "Sent to" : "Received from"}{" "}
                      {sms?.phone_number}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {MESSAGE_TYPE_LABELS[sms?.message_type] || "General"}
                  </Badge>
                </div>

                <p className="text-sm text-foreground/80 mb-2 line-clamp-2">{sms?.content}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(sms?.sent_at || record.timestamp), "MMM d, h:mm a")}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {config.label}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}