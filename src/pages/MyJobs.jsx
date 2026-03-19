import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import {
  MapPin,
  Clock,
  ChevronRight,
  CalendarDays,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";

const STATUS_PRIORITY = ["dispatched", "in_progress", "scheduled", "awaiting_review"];

function dayLabel(dateStr) {
  if (!dateStr) return "Unscheduled";
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEEE, d MMMM");
}

function JobCard({ job }) {
  const isPastJob = job.scheduled_date && isPast(parseISO(job.scheduled_date)) && !isToday(parseISO(job.scheduled_date));

  return (
    <Link
      to={`/JobDetail?id=${job.id}`}
      className="block bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {job.contact_name || "No contact"}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {job.job_type?.replace(/_/g, " ")} · {job.job_number || ""}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="space-y-1.5">
        {job.site_address && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate text-muted-foreground">
              {job.site_address}
              {job.site_suburb && `, ${job.site_suburb}`}
            </span>
          </div>
        )}
        {job.scheduled_time_start && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">
              {job.scheduled_time_start}
              {job.scheduled_time_end && ` — ${job.scheduled_time_end}`}
            </span>
          </div>
        )}
      </div>

      {job.technician_notes && (
        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <span className="font-semibold">Note: </span>{job.technician_notes}
        </div>
      )}

      <div className="flex items-center justify-end mt-3 text-xs text-primary font-medium gap-1">
        Open job <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
}

export default function MyJobs() {
  const { user } = useAuth();
  const [tab, setTab] = useState("active");

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["my-jobs", user?.email],
    queryFn: () =>
      base44.entities.Job.filter(
        { assigned_technician: user?.email },
        "-scheduled_date",
        100
      ),
    enabled: !!user?.email,
  });

  const activeJobs = jobs.filter((j) =>
    ["scheduled", "dispatched", "in_progress", "awaiting_review"].includes(j.status)
  );
  const completedJobs = jobs.filter((j) =>
    ["completed", "closed", "invoiced"].includes(j.status)
  );

  // Group active jobs by date
  const grouped = activeJobs.reduce((acc, job) => {
    const key = job.scheduled_date || "__none";
    if (!acc[key]) acc[key] = [];
    acc[key].push(job);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    if (a === "__none") return 1;
    if (b === "__none") return -1;
    return a.localeCompare(b);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-20">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold">My Jobs</h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, d MMMM yyyy")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-5">
        {[
          { key: "active", label: `Active (${activeJobs.length})`, icon: Wrench },
          { key: "done", label: `Completed (${completedJobs.length})`, icon: CheckCircle2 },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Active */}
      {tab === "active" && (
        <div className="space-y-5">
          {activeJobs.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No active jobs assigned</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Check back later</p>
            </div>
          ) : (
            sortedDates.map((dateKey) => (
              <div key={dateKey}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  {dayLabel(dateKey === "__none" ? null : dateKey)}
                </p>
                <div className="space-y-3">
                  {grouped[dateKey].map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Completed */}
      {tab === "done" && (
        <div className="space-y-3">
          {completedJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No completed jobs yet</p>
          ) : (
            completedJobs.slice(0, 30).map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          )}
        </div>
      )}
    </div>
  );
}