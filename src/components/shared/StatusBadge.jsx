import React from "react";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  // Enquiry statuses
  new_lead: { label: "New Lead", color: "blue" },
  contact_attempted: { label: "Contact Attempted", color: "amber" },
  contact_made: { label: "Contact Made", color: "cyan" },
  awaiting_info: { label: "Awaiting Info", color: "orange" },
  future_lead: { label: "Future Lead", color: "purple" },
  tentative_dates: { label: "Tentative Dates", color: "amber" },
  agreement_sent: { label: "Agreement Sent", color: "cyan" },
  ready_to_schedule: { label: "Ready to Schedule", color: "green" },
  scheduled: { label: "Scheduled", color: "emerald" },
  converted_to_job: { label: "Converted", color: "emerald" },
  lost: { label: "Lost", color: "red" },

  // Job statuses
  draft: { label: "Draft", color: "slate" },
  scheduled: { label: "Scheduled", color: "blue" },
  dispatched: { label: "Dispatched", color: "cyan" },
  in_progress: { label: "In Progress", color: "amber" },
  awaiting_review: { label: "Awaiting Review", color: "purple" },
  completed: { label: "Completed", color: "green" },
  follow_up_required: { label: "Follow-up Required", color: "amber" },
  quote_required: { label: "Quote Required", color: "orange" },
  invoiced: { label: "Invoiced", color: "emerald" },
  closed: { label: "Closed", color: "slate" },
  cancelled: { label: "Cancelled", color: "red" },

  // Quote statuses
  draft: { label: "Draft", color: "slate" },
  sent: { label: "Sent", color: "blue" },
  viewed: { label: "Viewed", color: "cyan" },
  approved: { label: "Approved", color: "green" },
  declined: { label: "Declined", color: "red" },
  expired: { label: "Expired", color: "slate" },
  converted_to_job: { label: "Converted", color: "emerald" },

  // Invoice statuses
  paid: { label: "Paid", color: "green" },
  overdue: { label: "Overdue", color: "red" },
  void: { label: "Void", color: "slate" },

  // Priority
  low: { label: "Low", color: "slate" },
  normal: { label: "Normal", color: "blue" },
  high: { label: "High", color: "orange" },
  urgent: { label: "Urgent", color: "red" },
};

export default function StatusBadge({ status, className = "" }) {
  const config = STATUS_CONFIG[status] || { label: status, color: "slate" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-${config.color}-50 text-${config.color}-700 border border-${config.color}-200 ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full bg-${config.color}-500`} />
      {config.label}
    </span>
  );
}