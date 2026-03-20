import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Navigation, MapPin, CheckCircle2, Loader2, Check } from "lucide-react";

// ── Predefined communication actions tied to job lifecycle ─────────────────
const COMM_ACTIONS = [
  {
    key: "on_the_way",
    label: "On the Way",
    shortLabel: "On Way",
    icon: Navigation,
    smsRequired: true,
    statusChange: "dispatched",       // also advances job status
    visibleStatuses: ["scheduled"],   // only show when still scheduled
    color: "bg-blue-600 hover:bg-blue-700 text-white",
    build: (job) =>
      `Hi ${job.contact_name || "there"}, your Able Leak technician is on the way for your ${(job.job_type || "service").replace(/_/g, " ")} at ${job.site_address || "your property"}. ETA approx 15–20 mins.`,
  },
  {
    key: "arrived",
    label: "Arrived",
    shortLabel: "Arrived",
    icon: MapPin,
    smsRequired: false,               // optional SMS
    statusChange: "in_progress",      // starts the job
    visibleStatuses: ["dispatched"],
    color: "bg-amber-500 hover:bg-amber-600 text-white",
    build: (job) =>
      `Hi ${job.contact_name || "there"}, your Able Leak technician has arrived at ${job.site_address || "your property"}.`,
  },
  {
    key: "job_complete",
    label: "Job Complete",
    shortLabel: "Complete",
    icon: CheckCircle2,
    smsRequired: true,
    statusChange: "awaiting_review",  // moves to review queue
    visibleStatuses: ["in_progress"],
    color: "bg-green-600 hover:bg-green-700 text-white",
    build: (job) =>
      `Hi ${job.contact_name || "there"}, your ${(job.job_type || "service").replace(/_/g, " ")} has been completed. A report will follow shortly. Thanks for choosing Able Leak!`,
  },
];

/**
 * TechQuickActions
 * Renders 1-tap action buttons for the active job step.
 * Each button simultaneously:
 *  1. Updates job status
 *  2. Logs an SMSMessage record (if smsRequired or optionally confirmed)
 *
 * Props:
 *   job          – Job record
 *   onJobUpdated – callback after status change (triggers refetch)
 */
export default function TechQuickActions({ job, onJobUpdated }) {
  const [loading, setLoading] = useState(null);
  const [done, setDone] = useState(null);

  const visibleActions = COMM_ACTIONS.filter((a) =>
    a.visibleStatuses.includes(job.status)
  );

  if (visibleActions.length === 0) return null;

  const handleAction = async (action) => {
    setLoading(action.key);

    // 1. Update job status
    await base44.entities.Job.update(job.id, { status: action.statusChange });

    // 2. Log SMS communication record
    const message = action.build(job);
    await base44.entities.SMSMessage.create({
      entity_type: "job",
      entity_id: job.id,
      client_id: job.client_id || "",
      branch_id: job.branch_id || "",
      phone_number: job.contact_phone || "",
      content: message,
      direction: "outbound",
      sent_by: "technician",
      sent_at: new Date().toISOString(),
      status: job.contact_phone ? "sent" : "pending",
      message_type: "update",
      template_key: action.key,
      tags: [action.key],
    });

    setLoading(null);
    setDone(action.key);
    setTimeout(() => setDone(null), 2000);

    if (onJobUpdated) onJobUpdated();
  };

  return (
    <div className="flex gap-2">
      {visibleActions.map((action) => {
        const Icon = action.icon;
        const isLoading = loading === action.key;
        const isDone = done === action.key;

        return (
          <button
            key={action.key}
            onClick={() => handleAction(action)}
            disabled={!!loading}
            className={`
              flex-1 flex items-center justify-center gap-2 
              px-3 py-2.5 rounded-xl text-sm font-semibold
              transition-all active:scale-95 disabled:opacity-60
              ${isDone ? "bg-green-600 text-white" : action.color}
            `}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isDone ? (
              <Check className="w-4 h-4" />
            ) : (
              <Icon className="w-4 h-4" />
            )}
            <span>{isDone ? "Done!" : action.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}