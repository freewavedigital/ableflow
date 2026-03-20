import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import {
  MapPin, Clock, ChevronRight, CalendarDays, CheckCircle2,
  PlayCircle, Phone, MessageSquare, Navigation, Briefcase,
  CheckSquare, AlertCircle, Send, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import TechQuickActions from "./TechQuickActions";

// ── Status transition map ─────────────────────────────────────────────────
const STATUS_ACTIONS = {
  scheduled:       { label: "Start Driving",   next: "dispatched",    icon: Navigation,    color: "bg-blue-600 hover:bg-blue-700 text-white" },
  dispatched:      { label: "Start Job",        next: "in_progress",   icon: PlayCircle,    color: "bg-amber-500 hover:bg-amber-600 text-white" },
  in_progress:     { label: "Mark Complete",    next: "awaiting_review", icon: CheckCircle2, color: "bg-green-600 hover:bg-green-700 text-white" },
  awaiting_review: { label: "Awaiting Review",  next: null,            icon: AlertCircle,   color: "bg-muted text-muted-foreground cursor-default" },
};

// ── Quick-send SMS templates (technician-facing) ──────────────────────────
const QUICK_SMS = [
  {
    key: "on_my_way",
    label: "On My Way",
    icon: Navigation,
    build: (job) =>
      `Hi ${job.contact_name || "there"}, your Able Leak technician is on the way for your ${(job.job_type || "service").replace(/_/g, " ")} at ${job.site_address || "your property"}. ETA approx 15–20 mins.`,
  },
  {
    key: "running_late",
    label: "Running Late",
    icon: Clock,
    build: (job) =>
      `Hi ${job.contact_name || "there"}, apologies — your Able Leak technician is running a little late for today's ${(job.job_type || "service").replace(/_/g, " ")}. We'll be there as soon as possible.`,
  },
  {
    key: "job_complete",
    label: "Job Complete",
    icon: CheckCircle2,
    build: (job) =>
      `Hi ${job.contact_name || "there"}, your ${(job.job_type || "service").replace(/_/g, " ")} has been completed today. A report will follow shortly. Thanks for choosing Able Leak!`,
  },
];

function dayLabel(dateStr) {
  if (!dateStr) return "Unscheduled";
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEEE, d MMMM");
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

// ── Quick Comms Sheet ─────────────────────────────────────────────────────
function QuickCommsDialog({ job, open, onClose }) {
  const [sent, setSent] = useState(null);
  const [sending, setSending] = useState(false);

  if (!job) return null;

  const handleSendSMS = async (template) => {
    setSending(template.key);
    const message = template.build(job);
    // Log SMS to SMSMessage entity
    await base44.entities.SMSMessage.create({
      entity_type: "job",
      entity_id: job.id,
      client_id: job.client_id || "",
      phone_number: job.contact_phone || "",
      content: message,
      direction: "outbound",
      sent_by: "technician",
      sent_at: new Date().toISOString(),
      status: "sent",
      message_type: "update",
    });
    setSending(false);
    setSent(template.key);
    setTimeout(() => setSent(null), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Quick Contact</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Call button */}
          {job.contact_phone && (
            <a
              href={`tel:${job.contact_phone}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                <Phone className="w-4 h-4 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium">Call {job.contact_name || "Client"}</p>
                <p className="text-xs text-muted-foreground">{job.contact_phone}</p>
              </div>
            </a>
          )}

          {/* Quick SMS */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Send Quick SMS
            </p>
            <div className="space-y-2">
              {QUICK_SMS.map((t) => {
                const isSending = sending === t.key;
                const isSent = sent === t.key;
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => handleSendSMS(t)}
                    disabled={!!sending}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSent
                        ? "border-green-300 bg-green-50"
                        : "border-border bg-card hover:bg-muted/40"
                    } disabled:opacity-60`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSent ? "bg-green-100" : "bg-muted"}`}>
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : isSent ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isSent ? "text-green-700" : ""}`}>
                        {isSent ? "Sent!" : t.label}
                      </p>
                      {!isSent && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {t.build(job)}
                        </p>
                      )}
                    </div>
                    {!isSending && !isSent && <Send className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Job card (dashboard version) ──────────────────────────────────────────
function TechJobCard({ job, onStatusUpdate, onRefresh }) {
  const [commsOpen, setCommsOpen] = useState(false);
  const action = STATUS_ACTIONS[job.status];
  const isActive = ["dispatched", "in_progress"].includes(job.status);
  // Statuses handled by TechQuickActions (lifecycle SMS triggers)
  const quickActionStatuses = ["scheduled", "dispatched", "in_progress"];

  return (
    <>
      <div className={`rounded-2xl border overflow-hidden transition-all ${
        job.status === "in_progress"
          ? "border-amber-400 shadow-md"
          : job.status === "dispatched"
          ? "border-blue-300"
          : "border-border"
      }`}>
        {/* Card header */}
        <div className={`px-4 pt-4 pb-3 ${job.status === "in_progress" ? "bg-amber-50" : "bg-card"}`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{job.contact_name || "No contact"}</p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                {job.job_type?.replace(/_/g, " ")}
                {job.job_number && ` · ${job.job_number}`}
              </p>
            </div>
            {job.status === "in_progress" ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                In Progress
              </span>
            ) : (
              <StatusBadge status={job.status} />
            )}
          </div>

          {/* Meta */}
          <div className="space-y-1">
            {job.site_address && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{job.site_address}{job.site_suburb && `, ${job.site_suburb}`}</span>
              </div>
            )}
            {job.scheduled_time_start && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{job.scheduled_time_start}{job.scheduled_time_end && ` – ${job.scheduled_time_end}`}</span>
              </div>
            )}
          </div>

          {job.technician_notes && (
            <div className="mt-2.5 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
              <span className="font-semibold">Instructions: </span>{job.technician_notes}
            </div>
          )}
        </div>

        {/* Action row */}
        <div className={`px-3 py-3 border-t space-y-2 ${job.status === "in_progress" ? "border-amber-200 bg-amber-50/70" : "border-border bg-muted/20"}`}>
          {/* Primary lifecycle action — one-tap SMS + status update */}
          {quickActionStatuses.includes(job.status) ? (
            <TechQuickActions job={job} onJobUpdated={onRefresh} />
          ) : action && !action.next ? (
            <div className="text-xs text-muted-foreground text-center py-1">Awaiting office review</div>
          ) : null}

          {/* Secondary row: Call/SMS + Detail */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 text-xs h-8"
              onClick={() => setCommsOpen(true)}
            >
              <Phone className="w-3.5 h-3.5" />
              Call / SMS
            </Button>
            <Link to={`/TechJobDetail?id=${job.id}`}>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <QuickCommsDialog job={job} open={commsOpen} onClose={() => setCommsOpen(false)} />
    </>
  );
}

// ── Main TechDashboard ────────────────────────────────────────────────────
export default function TechDashboard({ user }) {
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["my-jobs", user?.email],
    queryFn: () =>
      base44.entities.Job.filter(
        { assigned_technician: user?.email },
        "scheduled_date",
        100
      ),
    enabled: !!user?.email,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Job.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-jobs", user?.email] }),
  });

  const today = format(new Date(), "yyyy-MM-dd");

  const activeJobs = jobs
    .filter((j) => ["scheduled", "dispatched", "in_progress", "awaiting_review"].includes(j.status))
    .sort((a, b) => {
      // In-progress first, then by time
      const priority = ["in_progress", "dispatched", "scheduled", "awaiting_review"];
      const pa = priority.indexOf(a.status);
      const pb = priority.indexOf(b.status);
      if (pa !== pb) return pa - pb;
      return (a.scheduled_time_start || "").localeCompare(b.scheduled_time_start || "");
    });

  const todayJobs = activeJobs.filter((j) => j.scheduled_date === today);
  const upcomingJobs = activeJobs.filter((j) => j.scheduled_date && j.scheduled_date > today);
  const completedToday = jobs.filter(
    (j) => j.scheduled_date === today && ["completed", "awaiting_review", "closed"].includes(j.status)
  );

  const inProgressJob = activeJobs.find((j) => j.status === "in_progress");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold">
          Good {getTimeOfDay()}, {user?.full_name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-primary text-primary-foreground rounded-xl p-3 text-center">
          <p className="text-2xl font-bold leading-none mb-1">{todayJobs.length}</p>
          <p className="text-xs opacity-80">Today's Jobs</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold leading-none mb-1 text-amber-600">
            {activeJobs.filter((j) => j.status === "in_progress").length}
          </p>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold leading-none mb-1 text-green-600">{completedToday.length}</p>
          <p className="text-xs text-muted-foreground">Done Today</p>
        </div>
      </div>

      {/* Active in-progress callout */}
      {inProgressJob && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Currently Active</p>
          </div>
          <p className="font-bold">{inProgressJob.contact_name}</p>
          <p className="text-sm text-amber-700">{inProgressJob.job_type?.replace(/_/g, " ")} · {inProgressJob.site_address}</p>
          <Link
            to={`/TechJobDetail?id=${inProgressJob.id}`}
            className="mt-3 flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            <PlayCircle className="w-4 h-4" /> Continue Job
          </Link>
        </div>
      )}

      {/* Today's jobs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            Today's Schedule
          </h2>
          <span className="text-xs text-muted-foreground">{todayJobs.length} job{todayJobs.length !== 1 ? "s" : ""}</span>
        </div>
        {todayJobs.length === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-2xl">
            <CalendarDays className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No jobs scheduled today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayJobs.map((job) => (
              <TechJobCard
                key={job.id}
                job={job}
                onStatusUpdate={(id, status) => statusMutation.mutate({ id, status })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming jobs */}
      {upcomingJobs.length > 0 && (
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            Upcoming
          </h2>
          <div className="space-y-2">
            {upcomingJobs.slice(0, 5).map((job) => (
              <Link
                key={job.id}
                to={`/TechJobDetail?id=${job.id}`}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
              >
                <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 text-center">
                  <div>
                    <p className="text-[10px] font-bold leading-none text-muted-foreground uppercase">
                      {format(parseISO(job.scheduled_date), "MMM")}
                    </p>
                    <p className="text-sm font-bold leading-none">{format(parseISO(job.scheduled_date), "d")}</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{job.contact_name}</p>
                  <p className="text-xs text-muted-foreground capitalize truncate">
                    {job.job_type?.replace(/_/g, " ")} · {job.scheduled_time_start || "TBC"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Completed today */}
      {completedToday.length > 0 && (
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
            Completed Today
          </h2>
          <div className="space-y-2">
            {completedToday.map((job) => (
              <Link
                key={job.id}
                to={`/TechJobDetail?id=${job.id}`}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl opacity-75 hover:opacity-100 transition-opacity"
              >
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{job.contact_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{job.job_type?.replace(/_/g, " ")}</p>
                </div>
                <StatusBadge status={job.status} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All jobs CTA */}
      <Link to="/MyJobs" className="flex items-center justify-center gap-2 text-sm text-primary font-medium py-3 hover:underline">
        View all my jobs <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}