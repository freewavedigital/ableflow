import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, User, Building2, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import JobStatusPipeline from "@/components/jobs/JobStatusPipeline";
import JobOutcomePanel from "@/components/jobs/JobOutcomePanel";
import JobScheduleCard from "@/components/jobs/JobScheduleCard";
import JobMediaPanel from "@/components/jobs/JobMediaPanel";
import JobActivityFeed from "@/components/jobs/JobActivityFeed";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";

export default function JobDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const queryClient = useQueryClient();
  const perms = usePermissions();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: () => base44.entities.Job.filter({ id }),
    select: (d) => d[0],
    enabled: !!id,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities", "job", id],
    queryFn: () =>
      base44.entities.ActivityLog.filter({ entity_type: "job", entity_id: id }, "-created_date", 50),
    enabled: !!id,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => base44.entities.Branch.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: perms.canReassignTechnicians,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job", id] }),
  });

  const handleUpdate = (field, value) => updateMutation.mutate({ [field]: value });

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({ status: newStatus });
    base44.entities.ActivityLog.create({
      entity_type: "job",
      entity_id: id,
      activity_type: "status_change",
      title: `Status → ${newStatus.replace(/_/g, " ")}`,
      content: `Job status updated from "${job.status.replace(/_/g, " ")}" to "${newStatus.replace(/_/g, " ")}"`,
      metadata: { old_status: job.status, new_status: newStatus },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return <div className="p-6 text-center text-muted-foreground">Job not found</div>;
  }

  const branchName = branches.find((b) => b.id === job.branch_id)?.name;
  const canEdit = perms.canManageJobs;
  const isTerminal = ["closed", "cancelled"].includes(job.status);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <Link to="/Jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
      </div>

      <PageHeader
        title={`${job.job_number || "Job"} — ${job.contact_name || "No contact"}`}
        subtitle={`${job.job_type?.replace(/_/g, " ")} · ${branchName || "No branch"}`}
      >
        <div className="flex items-center gap-2">
          <StatusBadge status={job.status} />
          <StatusBadge status={job.priority || "normal"} />
        </div>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Pipeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Job Status</CardTitle>
            </CardHeader>
            <CardContent>
              <JobStatusPipeline
                currentStatus={job.status}
                onStatusChange={handleStatusChange}
                disabled={!canEdit || isTerminal}
              />
            </CardContent>
          </Card>

          {/* Outcome — always visible, more prominent post-completion */}
          <JobOutcomePanel job={job} onUpdate={handleUpdate} />

          {/* Media */}
          <JobMediaPanel job={job} onUpdate={handleUpdate} />

          {/* Activity */}
          <JobActivityFeed jobId={id} activities={activities} />
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">

          {/* Schedule — editable for admin+, read-only for technician */}
          <JobScheduleCard
            job={job}
            users={users}
            onUpdate={handleUpdate}
            readOnly={!canEdit}
          />

          {/* Contact & Site */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Contact & Site</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              {job.contact_name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>{job.contact_name}</span>
                </div>
              )}
              {job.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a href={`tel:${job.contact_phone}`} className="text-primary hover:underline">
                    {job.contact_phone}
                  </a>
                </div>
              )}
              {job.site_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>
                    {job.site_address}
                    {job.site_suburb && `, ${job.site_suburb}`}
                  </span>
                </div>
              )}
              {job.access_notes && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                  <span className="font-semibold text-amber-800">Access: </span>
                  <span className="text-amber-700">{job.access_notes}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tech Instructions */}
          {job.technician_notes && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                  <Wrench className="w-4 h-4" />
                  Tech Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-900 leading-relaxed">{job.technician_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              {[
                ["Branch", branchName || "—"],
                ["Job Type", job.job_type?.replace(/_/g, " ")],
                ["Created", job.created_date ? format(new Date(job.created_date), "d MMM yyyy") : "—"],
                job.enquiry_id ? ["From Enquiry", <Link key="eq" to={`/EnquiryDetail?id=${job.enquiry_id}`} className="text-primary hover:underline text-xs">View Lead →</Link>] : null,
                job.job_notes ? ["Notes", job.job_notes] : null,
              ]
                .filter(Boolean)
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-shrink-0">{label}</span>
                    <span className="font-medium text-right capitalize text-xs">{value}</span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}