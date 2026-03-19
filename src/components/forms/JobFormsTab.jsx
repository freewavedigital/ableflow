import React, { useState } from "react";
import { Briefcase, Eye, ToggleLeft, ToggleRight, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormSubmissionsDrawer from "./FormSubmissionsDrawer";
import EmptyState from "@/components/shared/EmptyState";

const JOB_TYPE_LABELS = {
  leak_inspection: "Leak Inspection",
  structural_inspection: "Structural Inspection",
  pressure_test: "Pressure Test",
  scuba_dive_test: "Scuba Dive Test",
  pipe_blockage: "Pipe Blockage",
  repair: "Repair",
  domestic_inspection: "Domestic Inspection",
  service_call: "Service Call",
  follow_up: "Follow-up",
  other: "Other",
  any: "All Job Types",
};

export default function JobFormsTab({ templates, submissions, onRefresh }) {
  const [viewingSubs, setViewingSubs] = useState(null);
  const qc = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.FormTemplate.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["form-templates"] }),
  });

  if (templates.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No job form templates yet"
        description="Create internal inspection forms used by technicians in the field. These link to job types and appear inside the technician job view."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-2">
        <Briefcase className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <strong>Job forms</strong> are internal operational forms completed by technicians. They are linked to specific job types and surface in the technician job view. Submitted data is stored against the job record.
        </div>
      </div>

      {templates.map((t) => {
        const subs = submissions.filter((s) => s.template_id === t.id);
        return (
          <div key={t.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-base">{t.name}</h3>
                  {t.is_active ? (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">Inactive</span>
                  )}
                  {t.linked_job_type && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                      <Link2 className="w-3 h-3" />{JOB_TYPE_LABELS[t.linked_job_type] || t.linked_job_type}
                    </span>
                  )}
                </div>
                {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{t.sections?.length || 0} sections</span>
                  <span>{t.sections?.reduce((n, s) => n + (s.fields?.length || 0), 0) || 0} fields</span>
                  <span>{subs.length} completions</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {subs.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setViewingSubs({ template: t, subs })}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleMutation.mutate({ id: t.id, is_active: !t.is_active })}
                >
                  {t.is_active
                    ? <ToggleRight className="w-4 h-4 text-green-600" />
                    : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {viewingSubs && (
        <FormSubmissionsDrawer
          template={viewingSubs.template}
          submissions={viewingSubs.subs}
          onClose={() => setViewingSubs(null)}
        />
      )}
    </div>
  );
}