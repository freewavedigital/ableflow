import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/shared/StatusBadge";
import { Phone, Clock } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const STAGES = [
  { key: "new_lead", label: "New Leads" },
  { key: "contact_attempted", label: "Contact Attempted" },
  { key: "contact_made", label: "Contact Made" },
  { key: "awaiting_info", label: "Awaiting Info" },
  { key: "tentative_dates", label: "Tentative Dates" },
  { key: "agreement_sent", label: "Agreement Sent" },
  { key: "ready_to_schedule", label: "Ready to Schedule" },
];

function KanbanCard({ enquiry }) {
  return (
    <Link
      to={`/EnquiryDetail?id=${enquiry.id}`}
      className="block p-3 bg-card rounded-lg border border-border hover:shadow-md transition-shadow"
    >
      <p className="text-sm font-medium text-foreground truncate">
        {enquiry.contact_name}
      </p>
      <p className="text-xs text-muted-foreground mt-1 truncate">
        {enquiry.service_type?.replace(/_/g, " ")}
      </p>
      <div className="flex items-center gap-3 mt-2">
        {enquiry.contact_phone && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="w-3 h-3" />
            {enquiry.contact_phone}
          </span>
        )}
      </div>
      {enquiry.tentative_date_from && (
        <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
          <Clock className="w-3 h-3" />
          {enquiry.tentative_date_from}
          {enquiry.tentative_date_to && ` — ${enquiry.tentative_date_to}`}
        </div>
      )}
      {enquiry.priority && enquiry.priority !== "normal" && (
        <div className="mt-2">
          <StatusBadge status={enquiry.priority} />
        </div>
      )}
    </Link>
  );
}

export default function EnquiryKanban({ enquiries }) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4 min-w-max">
        {STAGES.map((stage) => {
          const items = enquiries.filter((e) => e.status === stage.key);
          return (
            <div
              key={stage.key}
              className="w-72 flex-shrink-0 bg-muted/50 rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  {stage.label}
                </h3>
                <span className="text-xs text-muted-foreground font-medium bg-background px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((enq) => (
                  <KanbanCard key={enq.id} enquiry={enq} />
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No enquiries
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}