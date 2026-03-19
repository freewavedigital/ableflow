import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Lock, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";

// Lead-specific components
import LeadStagePipeline from "@/components/leads/LeadStagePipeline";
import LeadContextPanel from "@/components/leads/LeadContextPanel";
import LeadActivityFeed from "@/components/leads/LeadActivityFeed";
import LeadPhotoUpload from "@/components/leads/LeadPhotoUpload";
import LeadTasksSidebar from "@/components/leads/LeadTasksSidebar";
import LeadContactSitePanel from "@/components/leads/LeadContactSitePanel";
import LeadServicePanel from "@/components/leads/LeadServicePanel";
import LeadMetaSidebar from "@/components/leads/LeadMetaSidebar";

export default function EnquiryDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const queryClient = useQueryClient();

  const { data: enquiry, isLoading } = useQuery({
    queryKey: ["enquiry", id],
    queryFn: () => base44.entities.Enquiry.filter({ id }),
    select: (d) => d[0],
    enabled: !!id,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities", "enquiry", id],
    queryFn: () =>
      base44.entities.ActivityLog.filter(
        { entity_type: "enquiry", entity_id: id },
        "-created_date",
        50
      ),
    enabled: !!id,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => base44.entities.Branch.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Enquiry.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["enquiry", id] }),
  });

  const handleFieldUpdate = (field, value) => updateMutation.mutate({ [field]: value });

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({ status: newStatus });
    base44.entities.ActivityLog.create({
      entity_type: "enquiry",
      entity_id: id,
      activity_type: "status_change",
      title: `Stage → ${newStatus.replace(/_/g, " ")}`,
      content: `Lead moved from "${enquiry.status.replace(/_/g, " ")}" to "${newStatus.replace(/_/g, " ")}"`,
      metadata: { old_status: enquiry.status, new_status: newStatus },
    }).then(() => queryClient.invalidateQueries({ queryKey: ["activities", "enquiry", id] }));
  };

  const handleMarkLost = () => {
    if (enquiry.status === "lost") return;
    handleStatusChange("lost");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!enquiry) {
    return <div className="p-6 text-center text-muted-foreground">Enquiry not found</div>;
  }

  const branchName = branches.find((b) => b.id === enquiry.branch_id)?.name;
  const isTerminal = ["converted_to_job", "lost"].includes(enquiry.status);
  const isConverted = enquiry.status === "converted_to_job";
  const isLost = enquiry.status === "lost";

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">

      {/* Back */}
      <div className="mb-4">
        <Link
          to="/Enquiries"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Enquiries
        </Link>
      </div>

      {/* Header */}
      <PageHeader
        title={enquiry.reference_number ? `${enquiry.reference_number} — ${enquiry.contact_name}` : enquiry.contact_name}
        subtitle={[
          enquiry.service_type?.replace(/_/g, " "),
          enquiry.site_suburb,
          branchName,
        ].filter(Boolean).join(" · ")}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={enquiry.status} />
          <StatusBadge status={enquiry.priority || "normal"} />
          {!isTerminal && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleMarkLost}
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              Mark Lost
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Terminal banner */}
      {isConverted && (
        <div className="flex items-center gap-3 px-4 py-3 mb-5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
          <Briefcase className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">This lead has been converted to a Job.</span>
          {enquiry.converted_job_id && (
            <Link to={`/JobDetail?id=${enquiry.converted_job_id}`} className="ml-auto text-emerald-700 underline font-medium text-xs">
              View Job →
            </Link>
          )}
        </div>
      )}
      {isLost && (
        <div className="flex items-center gap-3 px-4 py-3 mb-5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          <Lock className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">This lead was marked as lost.</span>
          {enquiry.lost_reason && <span className="text-xs text-red-600 ml-1">Reason: {enquiry.lost_reason}</span>}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">

        {/* ── LEFT / MAIN COLUMN ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* 1. Stage Pipeline */}
          {!isTerminal && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-primary">Lead Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadStagePipeline
                  currentStatus={enquiry.status}
                  onStageChange={handleStatusChange}
                  disabled={isTerminal}
                />
              </CardContent>
            </Card>
          )}

          {/* 2. Stage-contextual action panels */}
          <LeadContextPanel enquiry={enquiry} onUpdate={handleFieldUpdate} />

          {/* 3. Contact & Site — inline editable */}
          <LeadContactSitePanel enquiry={enquiry} onUpdate={handleFieldUpdate} />

          {/* 4. Service & Issue Details */}
          <LeadServicePanel enquiry={enquiry} onUpdate={handleFieldUpdate} />

          {/* 5. Activity Feed & Communications */}
          <LeadActivityFeed enquiryId={id} activities={activities} />
        </div>

        {/* ── RIGHT / SIDEBAR ── */}
        <div className="space-y-4">

          {/* Lead meta + assignment */}
          <LeadMetaSidebar
            enquiry={enquiry}
            branchName={branchName}
            users={users}
            onUpdate={handleFieldUpdate}
          />

          {/* Tasks & Reminders */}
          <LeadTasksSidebar enquiryId={id} />

          {/* Photos */}
          <LeadPhotoUpload
            enquiry={enquiry}
            onPhotosUpdated={(urls) => {
              queryClient.setQueryData(["enquiry", id], (old) =>
                old ? [{ ...old[0], photo_urls: urls }] : old
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}