import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import LeadStagePipeline from "@/components/leads/LeadStagePipeline";
import LeadContextPanel from "@/components/leads/LeadContextPanel";
import LeadActivityFeed from "@/components/leads/LeadActivityFeed";
import LeadPhotoUpload from "@/components/leads/LeadPhotoUpload";
import LeadTasksSidebar from "@/components/leads/LeadTasksSidebar";
import { format } from "date-fns";

export default function EnquiryDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const queryClient = useQueryClient();

  const { data: enquiry, isLoading } = useQuery({
    queryKey: ["enquiry", id],
    queryFn: () => base44.entities.Enquiry.filter({ id }),
    select: (data) => data[0],
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

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Enquiry.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["enquiry", id] }),
  });

  const handleFieldUpdate = (field, value) => {
    updateMutation.mutate({ [field]: value });
  };

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({ status: newStatus });
    base44.entities.ActivityLog.create({
      entity_type: "enquiry",
      entity_id: id,
      activity_type: "status_change",
      title: `Stage → ${newStatus.replace(/_/g, " ")}`,
      content: `Lead moved from "${enquiry.status.replace(/_/g, " ")}" to "${newStatus.replace(/_/g, " ")}"`,
      metadata: { old_status: enquiry.status, new_status: newStatus },
    });
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

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Back nav */}
      <div className="mb-4">
        <Link
          to="/Enquiries"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Enquiries
        </Link>
      </div>

      <PageHeader
        title={`${enquiry.reference_number || "Enquiry"} — ${enquiry.contact_name}`}
        subtitle={`${enquiry.service_type?.replace(/_/g, " ")} · ${enquiry.source}`}
      >
        <div className="flex items-center gap-2">
          <StatusBadge status={enquiry.status} />
          {!isTerminal && (
            <button
              onClick={handleMarkLost}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Mark Lost
            </button>
          )}
        </div>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left / Main column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Pipeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Lead Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadStagePipeline
                currentStatus={enquiry.status}
                onStageChange={handleStatusChange}
                disabled={isTerminal}
              />
            </CardContent>
          </Card>

          {/* Stage-contextual actions */}
          <LeadContextPanel
            enquiry={enquiry}
            onUpdate={handleFieldUpdate}
          />

          {/* Issue Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Summary</Label>
                <p className="mt-0.5">{enquiry.issue_summary || "No summary provided"}</p>
              </div>
              {enquiry.additional_notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Additional Notes</Label>
                  <p className="mt-0.5">{enquiry.additional_notes}</p>
                </div>
              )}
              <div className="flex gap-4 flex-wrap text-xs text-muted-foreground pt-1 border-t border-border">
                <span>Property: <strong className="text-foreground capitalize">{enquiry.property_type?.replace(/_/g, " ")}</strong></span>
                <span>Pool: <strong className="text-foreground capitalize">{enquiry.pool_type?.replace(/_/g, " ")}</strong></span>
                {enquiry.previous_customer && (
                  <span className="text-green-700 font-medium">↩ Returning customer</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <LeadActivityFeed enquiryId={id} activities={activities} />
        </div>

        {/* ── Right / Sidebar ── */}
        <div className="space-y-4">
          {/* Contact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a href={`tel:${enquiry.contact_phone}`} className="text-primary hover:underline">
                  {enquiry.contact_phone}
                </a>
              </div>
              {enquiry.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a href={`mailto:${enquiry.contact_email}`} className="text-primary hover:underline truncate">
                    {enquiry.contact_email}
                  </a>
                </div>
              )}
              {enquiry.site_address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>
                    {enquiry.site_address}
                    {enquiry.site_suburb && `, ${enquiry.site_suburb}`}
                    {enquiry.site_state && `, ${enquiry.site_state}`}
                    {enquiry.site_postcode && ` ${enquiry.site_postcode}`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              {[
                ["Branch", branchName || "—"],
                ["Service", enquiry.service_type?.replace(/_/g, " ")],
                ["Source", enquiry.source],
                ["Priority", <StatusBadge key="p" status={enquiry.priority || "normal"} />],
                ["Created", enquiry.created_date ? format(new Date(enquiry.created_date), "d MMM yyyy") : "—"],
                enquiry.assigned_to ? ["Assigned To", enquiry.assigned_to] : null,
                enquiry.converted_job_id ? ["Job", <Link key="j" to={`/JobDetail?id=${enquiry.converted_job_id}`} className="text-primary hover:underline text-xs">View Job →</Link>] : null,
              ]
                .filter(Boolean)
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground flex-shrink-0">{label}</span>
                    <span className="font-medium text-right capitalize">{value}</span>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Tasks */}
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