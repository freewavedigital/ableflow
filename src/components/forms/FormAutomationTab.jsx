import React, { useState } from "react";
import { Zap, Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import EmptyState from "@/components/shared/EmptyState";

const ACTION_LABELS = {
  create_lead: "Create Lead",
  create_job: "Create Job",
  send_email_notification: "Send Email",
  send_email_to_submitter: "Email Submitter",
  create_task: "Create Task",
  update_entity_field: "Update Field",
  webhook: "Webhook",
};

const FIRE_ON_LABELS = {
  submitted: "When submitted",
  signed: "When signed",
  reviewed: "When reviewed",
  converted: "When converted",
};

export default function FormAutomationTab() {
  const [deletingId, setDeletingId] = useState(null);
  const qc = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ["form-templates"],
    queryFn: () => base44.entities.FormTemplate.list("-created_date", 200),
  });

  const { data: triggers = [] } = useQuery({
    queryKey: ["form-triggers"],
    queryFn: () => base44.entities.FormActionTrigger.list("-created_date", 500),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FormActionTrigger.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["form-triggers"] });
      toast.success("Trigger deleted");
    },
  });

  const getTemplateName = (templateId) => {
    return templates.find((t) => t.id === templateId)?.name || "Unknown Form";
  };

  if (templates.length === 0 || triggers.length === 0) {
    return (
      <EmptyState
        icon={Zap}
        title="No automations yet"
        description="Create form templates first, then set up automation triggers. When forms are submitted, signed, or reviewed, you can automatically create records, send emails, or trigger webhooks."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 flex items-start gap-2">
        <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <strong>Form Automations</strong> let you automatically create records, send emails, or call webhooks when forms are submitted or signed.
          Configure triggers in the Form Builder or manage them all here.
        </div>
      </div>

      {triggers.length === 0 ? (
        <div className="text-center py-8 bg-muted/20 rounded-lg">
          <p className="text-muted-foreground">No automation triggers configured yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Edit a form in the Form Builder to add triggers.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {triggers.map((trigger) => (
            <div key={trigger.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{trigger.name}</h3>
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {FIRE_ON_LABELS[trigger.fire_on] || trigger.fire_on}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                      {ACTION_LABELS[trigger.action_type] || trigger.action_type}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Form:</strong> {getTemplateName(trigger.template_id)}
                  </p>

                  {trigger.config && (
                    <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1.5">
                      {trigger.action_type === "send_email_notification" && trigger.config.email_to && (
                        <p>→ Sends to: <span className="font-mono">{trigger.config.email_to}</span></p>
                      )}
                      {trigger.action_type === "send_email_to_submitter" && (
                        <p>→ Sends confirmation email to submitter</p>
                      )}
                      {trigger.action_type === "create_lead" && (
                        <p>→ Automatically creates a Lead record</p>
                      )}
                      {trigger.action_type === "create_job" && (
                        <p>→ Automatically creates a Job record</p>
                      )}
                      {trigger.action_type === "webhook" && trigger.config.url && (
                        <p>→ Posts to: <span className="font-mono text-[10px]">{trigger.config.url}</span></p>
                      )}
                    </div>
                  )}

                  {!trigger.is_active && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 w-fit">
                      <AlertCircle className="w-3 h-3" /> Disabled
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={deletingId === trigger.id}
                    onClick={() => {
                      setDeletingId(trigger.id);
                      deleteMutation.mutate(trigger.id, {
                        onSettled: () => setDeletingId(null),
                      });
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-muted/30 rounded-lg text-xs text-muted-foreground space-y-1">
        <p><strong>💡 Tip:</strong> To add or edit automations, edit the form in the Form Builder.</p>
        <p>Click the "Actions" tab to configure what happens when forms are submitted or signed.</p>
      </div>
    </div>
  );
}