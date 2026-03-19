import React, { useState } from "react";
import { Globe, ExternalLink, Users, Eye, ToggleLeft, ToggleRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormSubmissionsDrawer from "./FormSubmissionsDrawer";
import EmptyState from "@/components/shared/EmptyState";

export default function EnquiryFormsTab({ templates, submissions, onRefresh }) {
  const [viewingSubs, setViewingSubs] = useState(null);
  const qc = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.FormTemplate.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["form-templates"] }),
  });

  if (templates.length === 0) {
    return (
      <EmptyState
        icon={Globe}
        title="No enquiry form templates yet"
        description="Create a public-facing enquiry form to capture leads from your website or a shared link."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 flex items-start gap-2">
        <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <strong>Enquiry forms</strong> are public-facing. They capture lead information from website visitors or shared links. Submissions automatically create entries in your Enquiries pipeline.
        </div>
      </div>

      {templates.map((t) => {
        const subs = submissions.filter((s) => s.template_id === t.id);
        const convertedCount = subs.filter((s) => s.converted_lead_id).length;
        return (
          <div key={t.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base truncate">{t.name}</h3>
                  {t.is_active ? (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">Inactive</span>
                  )}
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
                    <span className="flex items-center gap-1 text-green-700"><Users className="w-3 h-3" />{convertedCount} converted</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {subs.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setViewingSubs({ template: t, subs })}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> Submissions
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleMutation.mutate({ id: t.id, is_active: !t.is_active })}
                  title={t.is_active ? "Deactivate" : "Activate"}
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