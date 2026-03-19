import React from "react";
import { Phone, MessageSquare, Mail } from "lucide-react";
import { format } from "date-fns";

const CHANNEL_CONFIG = {
  phone: {
    icon: Phone,
    label: "Call",
    color: "bg-green-50 border-green-200 text-green-700",
  },
  sms: {
    icon: MessageSquare,
    label: "SMS",
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
  email: {
    icon: Mail,
    label: "Email",
    color: "bg-orange-50 border-orange-200 text-orange-700",
  },
};

export default function CommunicationTimeline({ communications }) {
  if (communications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No communications to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {communications.map((comm, idx) => {
        const config = CHANNEL_CONFIG[comm.channel];
        const Icon = config.icon;

        return (
          <div key={`${comm.channel}-${comm.id}`} className="flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${config.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              {idx < communications.length - 1 && (
                <div className="w-0.5 h-16 bg-border mt-2" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="text-xs text-muted-foreground mb-1">
                {format(new Date(comm.timestamp), "MMM d, yyyy · HH:mm")}
              </div>
              <div className="text-sm font-medium">{config.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}