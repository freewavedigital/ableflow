import React from "react";
import { Phone, MessageSquare, Mail, TrendingUp } from "lucide-react";

export default function CommunicationStats({ communications }) {
  const phoneCalls = communications.filter((c) => c.channel === "phone").length;
  const smsMessages = communications.filter((c) => c.channel === "sms").length;
  const emailMessages = communications.filter((c) => c.channel === "email").length;
  const total = communications.length;

  const inbound = communications.filter((c) => c.direction === "inbound").length;
  const outbound = communications.filter((c) => c.direction === "outbound").length;

  const stats = [
    { label: "Total Communications", value: total, icon: TrendingUp, color: "text-blue-600" },
    { label: "Phone Calls", value: phoneCalls, icon: Phone, color: "text-green-600" },
    { label: "SMS Messages", value: smsMessages, icon: MessageSquare, color: "text-purple-600" },
    { label: "Emails", value: emailMessages, icon: Mail, color: "text-orange-600" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="bg-card rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}