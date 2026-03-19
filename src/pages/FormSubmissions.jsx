import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Download, Filter, X } from "lucide-react";
import { format } from "date-fns";
import PageHeader from "@/components/shared/PageHeader";
import SubmissionDetailsModal from "@/components/forms/SubmissionDetailsModal";

const FORM_TYPES = ["website", "job", "agreement"];
const STATUSES = ["draft", "submitted", "reviewed", "signed", "converted"];

export default function FormSubmissions() {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filterFormType, setFilterFormType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["form-submissions"],
    queryFn: () => base44.entities.FormSubmission.list(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["form-templates"],
    queryFn: () => base44.entities.FormTemplate.list(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["enquiries"],
    queryFn: () => base44.entities.Enquiry.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list(),
  });

  // Apply filters
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesType = filterFormType === "all" || sub.form_type === filterFormType;
    const matchesStatus = filterStatus === "all" || sub.status === filterStatus;
    const templateName = templates.find((t) => t.id === sub.template_id)?.name || "";
    const matchesSearch =
      searchQuery === "" ||
      templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.submitted_by?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  const getTemplateInfo = (templateId) => {
    return templates.find((t) => t.id === templateId);
  };

  const getLinkedRecord = (sub) => {
    if (sub.linked_lead_id) {
      const lead = leads.find((l) => l.id === sub.linked_lead_id);
      return lead ? { type: "Lead", name: lead.contact_name, id: lead.id } : null;
    }
    if (sub.linked_job_id) {
      const job = jobs.find((j) => j.id === sub.linked_job_id);
      return job ? { type: "Job", name: job.job_number || "Job", id: job.id } : null;
    }
    return null;
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      reviewed: "bg-purple-100 text-purple-800",
      signed: "bg-green-100 text-green-800",
      converted: "bg-emerald-100 text-emerald-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <PageHeader title="Form Submissions" subtitle="Manage all form submissions and track their status" />

      {/* Filters */}
      <div className="px-6 py-4 border-b border-border bg-card/50 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1.5">Search by form or submitter</label>
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium mb-1.5">Form Type</label>
            <Select value={filterFormType} onValueChange={setFilterFormType}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {FORM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium mb-1.5">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(filterFormType !== "all" || filterStatus !== "all" || searchQuery) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFilterFormType("all");
                setFilterStatus("all");
                setSearchQuery("");
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Submissions List */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {filteredSubmissions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground">No submissions found</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((sub) => {
              const template = getTemplateInfo(sub.template_id);
              const linkedRecord = getLinkedRecord(sub);

              return (
                <div
                  key={sub.id}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-sm truncate">{template?.name || "Unknown Form"}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(sub.status)}`}>
                          {sub.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">Type:</span> {sub.form_type}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Submitted:</span>{" "}
                          {sub.submitted_at ? format(new Date(sub.submitted_at), "MMM d, yyyy") : "N/A"}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">By:</span>{" "}
                          {sub.submitted_by || "Anonymous"}
                        </div>
                        {linkedRecord && (
                          <div>
                            <span className="font-medium text-foreground">{linkedRecord.type}:</span>{" "}
                            {linkedRecord.name}
                          </div>
                        )}
                      </div>

                      {sub.field_values && Object.keys(sub.field_values).length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{Object.keys(sub.field_values).length}</span> fields completed
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSubmission(sub)}
                      className="flex-shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">View</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedSubmission && (
        <SubmissionDetailsModal
          submission={selectedSubmission}
          template={getTemplateInfo(selectedSubmission.template_id)}
          linkedRecord={getLinkedRecord(selectedSubmission)}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
}