import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Clock,
  User,
  Camera,
  MessageSquare,
  Send,
  CheckCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { format } from "date-fns";

const JOB_STATUSES = [
  { value: "scheduled", label: "Scheduled" },
  { value: "dispatched", label: "Dispatched" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "requires_quote", label: "Requires Quote" },
  { value: "requires_follow_up", label: "Requires Follow Up" },
  { value: "cancelled", label: "Cancelled" },
];

const OUTCOMES = [
  { value: "pending", label: "Pending" },
  { value: "no_leak_found", label: "No Leak Found" },
  { value: "leak_identified", label: "Leak Identified" },
  { value: "repair_quoted", label: "Repair Quoted" },
  { value: "repair_approved", label: "Repair Approved" },
  { value: "further_testing", label: "Further Testing Required" },
  { value: "client_declined", label: "Client Declined" },
  { value: "monitoring_advised", label: "Monitoring Advised" },
  { value: "completed_closed", label: "Completed & Closed" },
];

export default function JobDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: () => base44.entities.Job.filter({ id }),
    select: (data) => data[0],
    enabled: !!id,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities", "job", id],
    queryFn: () =>
      base44.entities.ActivityLog.filter(
        { entity_type: "job", entity_id: id },
        "-created_date",
        50
      ),
    enabled: !!id,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => base44.entities.Branch.list(),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job", id] }),
  });

  const addNoteMutation = useMutation({
    mutationFn: (content) =>
      base44.entities.ActivityLog.create({
        entity_type: "job",
        entity_id: id,
        activity_type: "note",
        title: "Note added",
        content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", "job", id] });
      setNoteText("");
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const existing = job.photo_urls || [];
    updateMutation.mutate({ photo_urls: [...existing, file_url] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 text-center text-muted-foreground">Job not found</div>
    );
  }

  const branchName = branches.find((b) => b.id === job.branch_id)?.name;

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <Link
          to="/Jobs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
      </div>

      <PageHeader
        title={`${job.job_number || "Job"} — ${job.contact_name}`}
        subtitle={`${job.job_type?.replace(/_/g, " ")} · ${branchName || "No branch"}`}
      >
        <StatusBadge status={job.status} />
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Job Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {JOB_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateMutation.mutate({ status: s.value })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      job.status === s.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Outcome */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Job Outcome
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={job.outcome || "pending"}
                onValueChange={(v) => updateMutation.mutate({ outcome: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOMES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                value={job.outcome_notes || ""}
                onChange={(e) =>
                  updateMutation.mutate({ outcome_notes: e.target.value })
                }
                placeholder="Outcome notes..."
                rows={3}
              />
              {(job.outcome === "leak_identified" ||
                job.outcome === "repair_quoted") && (
                <Link to={`/CreateQuote?job_id=${id}`}>
                  <Button size="sm" variant="outline" className="mt-2">
                    <FileText className="w-4 h-4 mr-2" />
                    Create Quote
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Photos & Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                {(job.photo_urls || []).map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm cursor-pointer hover:bg-accent transition-colors">
                <Camera className="w-4 h-4" />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Activity & Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  disabled={!noteText.trim() || addNoteMutation.isPending}
                  onClick={() => addNoteMutation.mutate(noteText)}
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="flex gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="w-1.5 rounded-full bg-primary/20 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium">{act.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {act.created_date
                            ? format(new Date(act.created_date), "d MMM, h:mm a")
                            : ""}
                        </span>
                      </div>
                      {act.content && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {act.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No activity yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  {job.scheduled_date
                    ? format(new Date(job.scheduled_date), "EEEE, d MMMM yyyy")
                    : "Not scheduled"}
                </span>
              </div>
              {job.scheduled_time_start && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {job.scheduled_time_start}
                    {job.scheduled_time_end && ` — ${job.scheduled_time_end}`}
                  </span>
                </div>
              )}
              {job.assigned_technician && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{job.assigned_technician}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Contact & Site</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a
                  href={`tel:${job.contact_phone}`}
                  className="text-primary hover:underline"
                >
                  {job.contact_phone}
                </a>
              </div>
              {job.site_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span>
                    {job.site_address}
                    {job.site_suburb && `, ${job.site_suburb}`}
                  </span>
                </div>
              )}
              {job.access_notes && (
                <div className="p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                  <span className="font-medium">Access:</span> {job.access_notes}
                </div>
              )}
            </CardContent>
          </Card>

          {job.technician_notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tech Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {job.technician_notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}