import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  Send,
  ChevronRight,
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

const STATUSES = [
  { value: "new_lead", label: "New Lead" },
  { value: "contact_attempted", label: "Contact Attempted" },
  { value: "contact_made", label: "Contact Made" },
  { value: "awaiting_info", label: "Awaiting Info" },
  { value: "future_lead", label: "Future Lead" },
  { value: "tentative_dates", label: "Tentative Dates" },
  { value: "agreement_sent", label: "Agreement Sent" },
  { value: "ready_to_schedule", label: "Ready to Schedule" },
  { value: "converted_to_job", label: "Converted to Job" },
  { value: "lost", label: "Lost" },
];

export default function EnquiryDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");

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
    mutationFn: ({ field, value }) =>
      base44.entities.Enquiry.update(id, { [field]: value }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["enquiry", id] }),
  });

  const addNoteMutation = useMutation({
    mutationFn: (content) =>
      base44.entities.ActivityLog.create({
        entity_type: "enquiry",
        entity_id: id,
        activity_type: "note",
        title: "Note added",
        content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", "enquiry", id] });
      setNoteText("");
    },
  });

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({ field: "status", value: newStatus });
    base44.entities.ActivityLog.create({
      entity_type: "enquiry",
      entity_id: id,
      activity_type: "status_change",
      title: `Status changed to ${newStatus.replace(/_/g, " ")}`,
      content: `Status updated from ${enquiry.status} to ${newStatus}`,
      metadata: { old_status: enquiry.status, new_status: newStatus },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Enquiry not found
      </div>
    );
  }

  const branchName = branches.find((b) => b.id === enquiry.branch_id)?.name;

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <Link
          to="/Enquiries"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Enquiries
        </Link>
      </div>

      <PageHeader
        title={`${enquiry.reference_number || "Enquiry"} — ${enquiry.contact_name}`}
        subtitle={`${enquiry.service_type?.replace(/_/g, " ")} · ${enquiry.source}`}
      >
        <StatusBadge status={enquiry.status} />
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Pipeline Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusChange(s.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      enquiry.status === s.value
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

          {/* Tentative Scheduling */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Tentative Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">From Date</Label>
                  <Input
                    type="date"
                    value={enquiry.tentative_date_from || ""}
                    onChange={(e) =>
                      updateMutation.mutate({
                        field: "tentative_date_from",
                        value: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To Date</Label>
                  <Input
                    type="date"
                    value={enquiry.tentative_date_to || ""}
                    onChange={(e) =>
                      updateMutation.mutate({
                        field: "tentative_date_to",
                        value: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <Label className="text-xs">Tentative Notes</Label>
                <Textarea
                  value={enquiry.tentative_notes || ""}
                  onChange={(e) =>
                    updateMutation.mutate({
                      field: "tentative_notes",
                      value: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="e.g. Client prefers mornings, within next 2 weeks"
                />
              </div>
            </CardContent>
          </Card>

          {/* Issue Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Summary</Label>
                <p className="text-sm mt-0.5">
                  {enquiry.issue_summary || "No summary provided"}
                </p>
              </div>
              {enquiry.additional_notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Additional Notes
                  </Label>
                  <p className="text-sm mt-0.5">{enquiry.additional_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity / Notes */}
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
          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a
                  href={`tel:${enquiry.contact_phone}`}
                  className="text-primary hover:underline"
                >
                  {enquiry.contact_phone}
                </a>
              </div>
              {enquiry.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`mailto:${enquiry.contact_email}`}
                    className="text-primary hover:underline truncate"
                  >
                    {enquiry.contact_email}
                  </a>
                </div>
              )}
              {enquiry.site_address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span>
                    {enquiry.site_address}
                    {enquiry.site_suburb && `, ${enquiry.site_suburb}`}
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
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Branch</span>
                <span className="font-medium">{branchName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">
                  {enquiry.service_type?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pool Type</span>
                <span className="font-medium capitalize">
                  {enquiry.pool_type?.replace(/_/g, " ") || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <StatusBadge status={enquiry.priority || "normal"} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium capitalize">{enquiry.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {enquiry.created_date
                    ? format(new Date(enquiry.created_date), "d MMM yyyy")
                    : "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Convert to Job */}
          {enquiry.status === "ready_to_schedule" && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2">
                  Ready to convert to a job?
                </p>
                <Link to={`/CreateJob?enquiry_id=${id}`}>
                  <Button size="sm" className="w-full">
                    Convert to Job
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Lost reason */}
          {enquiry.status === "lost" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Lost Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={enquiry.lost_reason || ""}
                  onChange={(e) =>
                    updateMutation.mutate({
                      field: "lost_reason",
                      value: e.target.value,
                    })
                  }
                  placeholder="Why was this lead lost?"
                  rows={3}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}