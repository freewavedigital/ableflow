import React, { useState } from "react";
import { FileSignature, Eye, CheckCircle2, Clock, Archive, CheckCircle, FileEdit, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormSubmissionsDrawer from "./FormSubmissionsDrawer";
import EmptyState from "@/components/shared/EmptyState";
import FormStatusBadge from "./FormStatusBadge.jsx";

const LINKED_TO_LABELS = {
  lead: "→ Lead",
  job: "→ Job",
  either: "→ Lead or Job",
};

export default function AgreementFormsTab({ templates, submissions, onRefresh }) {
  const [viewingSubs, setViewingSubs] = useState(null);
  const qc = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.FormTemplate.update(id, { status, is_active: status === "active" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["form-templates"] }),
  });

  if (templates.length === 0) {
    return (
      <EmptyState
        icon={FileSignature}
        title="No agreement templates yet"
        description="Create service agreements or contracts that can be sent to clients for digital signature. Link them to Jobs or Leads depending on workflow stage."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-800 flex items-start gap-2">
        <FileSignature className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <strong>Agreement Forms</strong> are client-facing contracts. They include your terms and a digital signature field.
          They can be linked to a <strong>Lead</strong> (pre-job) or a <strong>Job</strong> (post-conversion) depending on your workflow.
        </div>
      </div>

      {templates.map((t) => {
        const subs = submissions.filter((s) => s.template_id === t.id);
        const signedCount = subs.filter((s) => s.status === "signed").length;
        const pendingCount = subs.filter((s) => s.status === "submitted").length;
        const status = t.status || (t.is_active ? "active" : "draft");
        const linkedLabel = LINKED_TO_LABELS[t.agreement_linked_to] || "→ Lead or Job";

        return (
          <div key={t.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-base">{t.name}</h3>
                  <FormStatusBadge status={status} />
                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                    {linkedLabel}
                  </span>
                  <span className="px-2 py-0.5 text-xs text-muted-foreground bg-muted rounded-full">
                    v{t.version || 1}
                  </span>
                  {t.requires_signature && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200 rounded-full flex items-center gap-1">
                      <FileSignature className="w-3 h-3" /> Signature required
                    </span>
                  )}
                </div>
                {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}

                {t.agreement_body && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-muted/40 rounded-lg px-3 py-2 italic">
                    {t.agreement_body}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{subs.length} sent</span>
                  {signedCount > 0 && (
                    <span className="flex items-center gap-1 text-green-700">
                      <CheckCircle2 className="w-3 h-3" />{signedCount} signed
                    </span>
                  )}
                  {pendingCount > 0 && (
                    <span className="flex items-center gap-1 text-amber-700">
                      <Clock className="w-3 h-3" />{pendingCount} awaiting signature
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/FormBuilder?id=${t.id}`}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Link>
                </Button>
                {subs.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setViewingSubs({ template: t, subs })}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                )}
                {status === "draft" && (
                  <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50"
                    onClick={() => statusMutation.mutate({ id: t.id, status: "active" })}>
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Activate
                  </Button>
                )}
                {status === "active" && (
                  <Button size="sm" variant="outline" className="text-amber-700 border-amber-200 hover:bg-amber-50"
                    onClick={() => statusMutation.mutate({ id: t.id, status: "archived" })}>
                    <Archive className="w-3.5 h-3.5 mr-1" /> Archive
                  </Button>
                )}
                {status === "archived" && (
                  <Button size="sm" variant="outline" className="text-muted-foreground"
                    onClick={() => statusMutation.mutate({ id: t.id, status: "draft" })}>
                    <FileEdit className="w-3.5 h-3.5 mr-1" /> Restore
                  </Button>
                )}
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