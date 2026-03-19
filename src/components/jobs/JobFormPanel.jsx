import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckSquare, XSquare, Camera, Video, Package } from "lucide-react";
import { format } from "date-fns";

// Read-only display of a submitted (or draft) job form for admins
export default function JobFormPanel({ job }) {
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["job-submission", job.id],
    queryFn: () => base44.entities.FormSubmission.filter({ linked_job_id: job.id }),
    enabled: !!job.id,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["form-templates-job-all"],
    queryFn: () => base44.entities.FormTemplate.filter({ form_type: "job" }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">Loading form data…</CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Job Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No form submission yet for this job.</p>
        </CardContent>
      </Card>
    );
  }

  const submission = submissions[0];
  const template = templates.find((t) => t.id === submission.template_id);
  const values = submission.field_values || {};
  const materials = values["__materials"] || job.materials_used || [];

  const statusColors = {
    draft: "bg-amber-100 text-amber-700",
    submitted: "bg-blue-100 text-blue-700",
    reviewed: "bg-green-100 text-green-700",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Job Form
            {template && <span className="font-normal text-muted-foreground">— {template.name}</span>}
          </CardTitle>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[submission.status] || "bg-muted text-muted-foreground"}`}>
            {submission.status}
          </span>
        </div>
        {submission.submitted_at && (
          <p className="text-xs text-muted-foreground">
            Submitted {format(new Date(submission.submitted_at), "d MMM yyyy 'at' h:mm a")}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {template?.sections
          ?.sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((section) => {
            if (section.section_type === "materials") return null;
            const sectionFields = section.fields || [];
            const hasData = sectionFields.some((f) => {
              const v = values[f.field_key];
              return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
            });
            if (!hasData) return null;

            return (
              <div key={section.section_id}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  {section.title}
                  <div className="flex-1 h-px bg-border" />
                </h4>
                <div className="space-y-3">
                  {sectionFields
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((field) => {
                      const val = values[field.field_key];
                      if (val === undefined || val === null || val === "") return null;
                      return <FieldDisplay key={field.field_key} field={field} value={val} />;
                    })}
                </div>
              </div>
            );
          })}

        {/* Materials */}
        {materials.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <Package className="w-3 h-3" /> Materials Used
              <div className="flex-1 h-px bg-border" />
            </h4>
            <div className="space-y-1.5">
              {materials.map((m, i) => (
                <div key={i} className="flex justify-between items-center text-sm bg-muted/50 rounded-lg px-3 py-2">
                  <span>{m.item}</span>
                  <span className="text-muted-foreground text-xs">
                    {m.quantity} × ${parseFloat(m.cost || 0).toFixed(2)} = <strong className="text-foreground">${((parseFloat(m.quantity) || 0) * (parseFloat(m.cost) || 0)).toFixed(2)}</strong>
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                <span className="text-muted-foreground">Total</span>
                <span>${materials.reduce((s, m) => s + (parseFloat(m.quantity) || 0) * (parseFloat(m.cost) || 0), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FieldDisplay({ field, value }) {
  const { type, label } = field;

  if (type === "heading" || type === "paragraph" || type === "divider") return null;

  if (type === "photo" && Array.isArray(value) && value.length > 0) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground flex items-center gap-1"><Camera className="w-3 h-3" />{label}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {value.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              <img src={url} alt="" className="aspect-square object-cover rounded-lg border border-border w-full" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (type === "video" && Array.isArray(value) && value.length > 0) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground flex items-center gap-1"><Video className="w-3 h-3" />{label}</p>
        {value.map((url, i) => (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary truncate">{url}</a>
        ))}
      </div>
    );
  }

  if (type === "pass_fail") {
    const pass = value === "Pass";
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${pass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {pass ? <CheckSquare className="w-3 h-3" /> : <XSquare className="w-3 h-3" />}
          {value}
        </span>
      </div>
    );
  }

  if (type === "yes_no") {
    const yes = value === "Yes";
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${yes ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{value}</span>
      </div>
    );
  }

  if (type === "checkbox") {
    if (!value) return null;
    return (
      <div className="flex items-center gap-2 text-sm">
        <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{String(value)}</span>
    </div>
  );
}