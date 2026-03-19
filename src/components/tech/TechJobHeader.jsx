import React from "react";
import { MapPin, Clock, Phone, FileText, Timer } from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG = {
  scheduled:       { label: "Scheduled",        bg: "bg-blue-100",   text: "text-blue-800",   dot: "bg-blue-500" },
  dispatched:      { label: "Dispatched",        bg: "bg-cyan-100",   text: "text-cyan-800",   dot: "bg-cyan-500" },
  in_progress:     { label: "In Progress",       bg: "bg-amber-100",  text: "text-amber-800",  dot: "bg-amber-500" },
  awaiting_review: { label: "Awaiting Review",   bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500" },
  completed:       { label: "Completed",         bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500" },
};

export default function TechJobHeader({ job }) {
  const s = STATUS_CONFIG[job.status] || { label: job.status, bg: "bg-muted", text: "text-foreground", dot: "bg-muted-foreground" };

  const mapsUrl = job.site_address
    ? `https://maps.google.com/?q=${encodeURIComponent([job.site_address, job.site_suburb].filter(Boolean).join(", "))}`
    : null;

  const arrivalFormatted = job.arrival_time
    ? format(new Date(job.arrival_time), "h:mm a")
    : null;
  const departureFormatted = job.departure_time
    ? format(new Date(job.departure_time), "h:mm a")
    : null;

  return (
    <div className="space-y-4">
      {/* Status + job number */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${s.bg} ${s.text}`}>
          <span className={`w-2 h-2 rounded-full ${s.dot} ${job.status === "in_progress" ? "animate-pulse" : ""}`} />
          {s.label}
        </span>
        <span className="text-xs text-muted-foreground font-mono">{job.job_number || ""}</span>
      </div>

      {/* Client + job type */}
      <div>
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          {job.contact_name || "No contact"}
        </h2>
        <p className="text-base text-muted-foreground capitalize mt-0.5">
          {job.job_type?.replace(/_/g, " ")}
        </p>
      </div>

      {/* Scheduled time */}
      {job.scheduled_time_start && (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">
            {job.scheduled_time_start}
            {job.scheduled_time_end && ` – ${job.scheduled_time_end}`}
          </span>
          {job.estimated_duration_hours && (
            <span className="text-muted-foreground">({job.estimated_duration_hours}h est.)</span>
          )}
        </div>
      )}

      {/* Clock in / out record */}
      {(arrivalFormatted || departureFormatted) && (
        <div className="flex items-center gap-4 px-3 py-2.5 bg-muted rounded-xl text-sm">
          <Timer className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex gap-4">
            {arrivalFormatted && (
              <span><span className="text-muted-foreground text-xs">Clocked in</span> <span className="font-semibold">{arrivalFormatted}</span></span>
            )}
            {departureFormatted && (
              <span><span className="text-muted-foreground text-xs">Clocked out</span> <span className="font-semibold">{departureFormatted}</span></span>
            )}
          </div>
        </div>
      )}

      {/* Address + Navigate button */}
      {job.site_address && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-foreground">
              {job.site_address}
              {job.site_suburb && `, ${job.site_suburb}`}
            </span>
          </div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            >
              <MapPin className="w-4 h-4" />
              Navigate
            </a>
          )}
        </div>
      )}

      {/* Contact phone */}
      {job.contact_phone && (
        <a
          href={`tel:${job.contact_phone}`}
          className="flex items-center gap-2 text-sm text-primary font-medium active:opacity-70"
        >
          <Phone className="w-4 h-4" />
          {job.contact_phone}
        </a>
      )}

      {/* Access notes */}
      {job.access_notes && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-xs uppercase tracking-wide text-amber-700 mb-0.5">Access Notes</p>
            <p>{job.access_notes}</p>
          </div>
        </div>
      )}

      {/* Tech instructions */}
      {job.technician_notes && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900">
          <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
          <div>
            <p className="font-semibold text-xs uppercase tracking-wide text-blue-700 mb-0.5">Instructions</p>
            <p>{job.technician_notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}