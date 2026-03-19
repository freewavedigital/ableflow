import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { ArrowLeft, ClipboardList, Camera, FileText, CheckSquare } from "lucide-react";

import TechJobHeader from "@/components/tech/TechJobHeader";
import TechJobActions from "@/components/tech/TechJobActions";
import TechJobForm from "@/components/tech/TechJobForm";
import TechMediaUpload from "@/components/tech/TechMediaUpload";
import TechOutcomeSelector from "@/components/tech/TechOutcomeSelector";

const TABS = [
  { key: "details", label: "Details", icon: FileText },
  { key: "form",    label: "Form",    icon: ClipboardList },
  { key: "photos",  label: "Photos",  icon: Camera },
  { key: "outcome", label: "Outcome", icon: CheckSquare },
];

export default function TechJobDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("details");

  const { data: job, isLoading } = useQuery({
    queryKey: ["tech-job", id],
    queryFn: () => base44.entities.Job.filter({ id }),
    select: (d) => d[0],
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tech-job", id] }),
  });

  const handleStatusChange = (newStatus) => {
    const extra = {};
    if (newStatus === "in_progress" && !job.arrival_time) {
      extra.arrival_time = new Date().toISOString();
    }
    if (newStatus === "awaiting_review" && !job.departure_time) {
      extra.departure_time = new Date().toISOString();
    }
    updateMutation.mutate({ status: newStatus, ...extra });
    // Move to form tab when starting
    if (newStatus === "in_progress") setTab("form");
  };

  const handleUpdate = (field, value) => {
    updateMutation.mutate({ [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
        <p className="text-muted-foreground">Job not found.</p>
        <Link to="/MyJobs" className="text-primary underline text-sm">Back to My Jobs</Link>
      </div>
    );
  }

  const isEditable = ["in_progress", "scheduled", "dispatched"].includes(job.status);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Top nav */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/MyJobs" className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted active:bg-muted/70">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{job.contact_name || "Job"}</p>
          <p className="text-xs text-muted-foreground capitalize">{job.job_type?.replace(/_/g, " ")}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-[57px] z-30 bg-background border-b border-border px-2">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                tab === t.key
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground border-b-2 border-transparent"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-5">
        {tab === "details" && (
          <TechJobHeader job={job} />
        )}

        {tab === "form" && (
          <div>
            {!isEditable && (
              <div className="mb-4 px-3 py-2.5 bg-muted rounded-xl text-xs text-muted-foreground text-center">
                Form is read-only — start the job to edit.
              </div>
            )}
            <TechJobForm
              job={job}
              onFormDataChange={(data) => {
                // already auto-saved inside TechJobForm — just keep local ref if needed
              }}
            />
          </div>
        )}

        {tab === "photos" && (
          <TechMediaUpload
            photoUrls={job.photo_urls || []}
            videoUrls={job.video_urls || []}
            onPhotosChange={(urls) => handleUpdate("photo_urls", urls)}
            onVideosChange={(urls) => handleUpdate("video_urls", urls)}
          />
        )}

        {tab === "outcome" && (
          <TechOutcomeSelector
            outcome={job.outcome}
            outcomeNotes={job.outcome_notes}
            onOutcomeChange={(v) => handleUpdate("outcome", v)}
            onNotesChange={(v) => handleUpdate("outcome_notes", v)}
          />
        )}
      </div>

      {/* Floating action bar */}
      <TechJobActions
        job={job}
        onStatusChange={handleStatusChange}
        isSaving={updateMutation.isPending}
      />
    </div>
  );
}