import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Navigation, MapPin, CheckCircle2, Loader2, Check } from "lucide-react";

// ── Lifecycle action definitions (status + template_key to look up) ────────
const COMM_ACTIONS = [
  {
    key: "on_the_way",
    label: "On the Way",
    shortLabel: "On Way",
    icon: Navigation,
    statusChange: "dispatched",
    visibleStatuses: ["scheduled"],
    color: "bg-blue-600 hover:bg-blue-700 text-white",
    // fallback if no template found
    fallback: (job) =>
      `Hi ${job.contact_name || "there"}, your Able Leak technician is on the way for your ${(job.job_type || "service").replace(/_/g, " ")} at ${job.site_address || "your property"}. ETA approx 15–20 mins.`,
  },
  {
    key: "arrived",
    label: "Arrived",
    shortLabel: "Arrived",
    icon: MapPin,
    statusChange: "in_progress",
    visibleStatuses: ["dispatched"],
    color: "bg-amber-500 hover:bg-amber-600 text-white",
    fallback: (job) =>
      `Hi ${job.contact_name || "there"}, your Able Leak technician has arrived at ${job.site_address || "your property"}.`,
  },
  {
    key: "job_complete",
    label: "Job Complete",
    shortLabel: "Complete",
    icon: CheckCircle2,
    statusChange: "awaiting_review",
    visibleStatuses: ["in_progress"],
    color: "bg-green-600 hover:bg-green-700 text-white",
    fallback: (job) =>
      `Hi ${job.contact_name || "there"}, your ${(job.job_type || "service").replace(/_/g, " ")} has been completed. A report will follow shortly. Thanks for choosing Able Leak!`,
  },
];

// ── Interpolate {{variables}} in a template string against a job record ───
function interpolate(template, job) {
  return template
    .replace(/\{\{customer_name\}\}/g, job.contact_name || "there")
    .replace(/\{\{contact_name\}\}/g, job.contact_name || "there")
    .replace(/\{\{job_type\}\}/g, (job.job_type || "service").replace(/_/g, " "))
    .replace(/\{\{site_address\}\}/g, job.site_address || "your property")
    .replace(/\{\{job_number\}\}/g, job.job_number || "");
}

export default function TechQuickActions({ job, onJobUpdated }) {
  const [loading, setLoading] = useState(null);
  const [done, setDone] = useState(null);

  // Fix C — load admin-managed templates keyed by template_key / tags
  const { data: templates = [] } = useQuery({
    queryKey: ["comm-templates-sms"],
    queryFn: () => base44.entities.CommunicationTemplate.filter({ template_type: "sms", status: "active" }),
    staleTime: 5 * 60 * 1000, // cache for 5 min — technicians don't need live reloads
  });

  const visibleActions = COMM_ACTIONS.filter(a => a.visibleStatuses.includes(job.status));
  if (visibleActions.length === 0) return null;

  // Resolve message: look for a CommunicationTemplate whose tags include the action key
  function resolveMessage(action) {
    const match = templates.find(t =>
      (t.tags || []).includes(action.key) ||
      (t.template_key === action.key)
    );
    if (match?.content) return interpolate(match.content, job);
    return action.fallback(job);
  }

  const handleAction = async (action) => {
    setLoading(action.key);

    await base44.entities.Job.update(job.id, { status: action.statusChange });

    const message = resolveMessage(action);
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
    onJobUpdated?.();
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
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" />
              : isDone ? <Check className="w-4 h-4" />
              : <Icon className="w-4 h-4" />}
            <span>{isDone ? "Done!" : action.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}