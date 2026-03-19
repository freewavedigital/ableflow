import React, { useState } from "react";
import { Globe, Eye, Inbox, Users, Archive, CheckCircle, FileEdit, Pencil, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormSubmissionsDrawer from "./FormSubmissionsDrawer";
import EmptyState from "@/components/shared/EmptyState";
import FormStatusBadge from "./FormStatusBadge.jsx";
import WebsiteFormPublishPanel from "./WebsiteFormPublishPanel";

export default function WebsiteFormsTab({ templates, submissions, onRefresh }) {
  const [viewingSubs, setViewingSubs] = useState(null);
  const [publishingTemplate, setPublishingTemplate] = useState(null);
  const qc = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.FormTemplate.update(id, { status, is_active: status === "active" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["form-templates"] }),
  });

  if (templates.length === 0) {
    return (
      <EmptyState
        icon={Globe}
        title="No website forms yet"
        description="Create a public-facing website form to capture leads. Submissions automatically create Lead records in your Enquiries pipeline."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 flex items-start gap-2">
        <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <strong>Website Forms</strong> are public-facing. They capture lead information from website visitors or shared links.
          Submissions automatically create <strong>Lead</strong> records in your Enquiries pipeline.
        </div>
      </div>

      {templates.map((t) => {
        const subs = submissions.filter((s) => s.template_id === t.id);
        const convertedCount = subs.filter((s) => s.converted_lead_id).length;
        const status = t.status || (t.is_active ? "active" : "draft");

        return (
          <div key={t.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-base truncate">{t.name}</h3>
                  <FormStatusBadge status={status} />
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    → Lead
                  </span>
                  <span className="px-2 py-0.5 text-xs text-muted-foreground bg-muted rounded-full">
                    v{t.version || 1}
                  </span>
                  {t.is_public && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Public
                    </span>
                  )}
                </div>
                {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{t.sections?.length || 0} sections</span>
                  <span>{t.sections?.reduce((n, s) => n + (s.fields?.length || 0), 0) || 0} fields</span>
                  <span className="flex items-center gap-1"><Inbox className="w-3 h-3" />{subs.length} submissions</span>
                  {convertedCount > 0 && (
                    <span className="flex items-center gap-1 text-green-700">
                      <Users className="w-3 h-3" />{convertedCount} converted
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
                    <Eye className="w-3.5 h-3.5 mr-1" /> Submissions
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