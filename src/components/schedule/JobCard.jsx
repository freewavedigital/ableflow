import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, User, AlertTriangle, Zap } from "lucide-react";

const JOB_TYPE_COLORS = {
  leak_inspection:     "bg-blue-100 border-blue-300 text-blue-900",
  structural_inspection:"bg-violet-100 border-violet-300 text-violet-900",
  pressure_test:       "bg-cyan-100 border-cyan-300 text-cyan-900",
  scuba_dive_test:     "bg-sky-100 border-sky-300 text-sky-900",
  pipe_blockage:       "bg-orange-100 border-orange-300 text-orange-900",
  repair:              "bg-red-100 border-red-300 text-red-900",
  domestic_inspection: "bg-teal-100 border-teal-300 text-teal-900",
  service_call:        "bg-amber-100 border-amber-300 text-amber-900",
  follow_up:           "bg-purple-100 border-purple-300 text-purple-900",
  other:               "bg-slate-100 border-slate-300 text-slate-900",
};

const STATUS_STRIPE = {
  draft:               "border-l-slate-400",
  scheduled:           "border-l-blue-500",
  dispatched:          "border-l-cyan-500",
  in_progress:         "border-l-amber-500",
  awaiting_review:     "border-l-purple-500",
  completed:           "border-l-green-500",
  follow_up_required:  "border-l-amber-600",
  quote_required:      "border-l-orange-500",
  invoiced:            "border-l-emerald-500",
  closed:              "border-l-slate-400",
  cancelled:           "border-l-red-400",
};

export default function JobCard({ job, isDragging, hasConflict, compact = false }) {
  const colorClass = JOB_TYPE_COLORS[job.job_type] || JOB_TYPE_COLORS.other;
  const stripeClass = STATUS_STRIPE[job.status] || "border-l-slate-400";
  const isTentative = job.status === "draft" || job.status === "scheduled";
  const isUnassigned = !job.assigned_technician;

  if (compact) {
    return (
      <Link
        to={`/JobDetail?id=${job.id}`}
        className={`block border-l-4 ${stripeClass} ${colorClass} rounded-r-md px-2 py-1.5 text-xs shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isDragging ? "opacity-50 ring-2 ring-primary" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-semibold truncate">{job.contact_name || "Unknown"}</span>
          {hasConflict && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
          {isUnassigned && <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />}
        </div>
        {job.scheduled_time_start && (
          <span className="opacity-70">{job.scheduled_time_start}</span>
        )}
        {isTentative && (
          <span className="italic opacity-60 ml-1">tentative</span>
        )}
      </Link>
    );
  }

  return (
    <div
      className={`border-l-4 ${stripeClass} ${colorClass} rounded-r-lg p-3 shadow-sm hover:shadow-md transition-shadow ${isDragging ? "opacity-50 ring-2 ring-primary" : ""}`}
    >
      {/* Top row: name + flags */}
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <Link
          to={`/JobDetail?id=${job.id}`}
          className="font-semibold text-sm truncate hover:underline flex-1"
          onClick={(e) => e.stopPropagation()}
        >
          {job.contact_name || "Unknown Client"}
        </Link>
        <div className="flex gap-1 flex-shrink-0">
          {hasConflict && (
            <span title="Conflict / Double-booking risk">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            </span>
          )}
          {isUnassigned && (
            <span title="No technician assigned">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </span>
          )}
        </div>
      </div>

      {/* Job type + tentative indicator */}
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        <span className="text-xs font-medium capitalize opacity-80">
          {job.job_type?.replace(/_/g, " ")}
        </span>
        {isTentative && (
          <span className="text-[10px] italic border border-current rounded px-1 opacity-60">
            tentative
          </span>
        )}
        {job.status === "dispatched" && (
          <span className="text-[10px] bg-cyan-500 text-white rounded px-1 font-medium">
            dispatched
          </span>
        )}
        {job.status === "in_progress" && (
          <span className="text-[10px] bg-amber-500 text-white rounded px-1 font-medium">
            in progress
          </span>
        )}
      </div>

      {/* Time */}
      {(job.scheduled_time_start || job.estimated_duration_hours) && (
        <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
          <Clock className="w-3 h-3 flex-shrink-0" />
          {job.scheduled_time_start || "TBC"}
          {job.estimated_duration_hours && (
            <span className="ml-1">({job.estimated_duration_hours}h)</span>
          )}
        </div>
      )}

      {/* Location */}
      {job.site_suburb && (
        <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{job.site_suburb}</span>
        </div>
      )}

      {/* Technician */}
      <div className="flex items-center gap-1 text-xs mt-1.5">
        <User className="w-3 h-3 flex-shrink-0 opacity-60" />
        {job.assigned_technician ? (
          <span className="truncate opacity-80">{job.assigned_technician.split("@")[0]}</span>
        ) : (
          <span className="text-amber-700 font-medium">Unassigned</span>
        )}
      </div>
    </div>
  );
}