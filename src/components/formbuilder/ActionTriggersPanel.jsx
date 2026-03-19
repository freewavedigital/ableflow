import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, Mail, MessageSquare, Clock, Zap } from "lucide-react";
import { ACTION_TYPES, TRIGGER_TYPES } from "@/lib/formActionExecutor";

const TRIGGER_CONFIG = {
  submitted: { icon: "→", label: "On Submission", color: "bg-blue-50 border-blue-200" },
  signed: { icon: "✓", label: "On Signature", color: "bg-green-50 border-green-200" },
  reviewed: { icon: "👁", label: "On Review", color: "bg-amber-50 border-amber-200" },
  converted: { icon: "⚡", label: "On Conversion", color: "bg-purple-50 border-purple-200" },
};

export default function ActionTriggersPanel({ templateId, triggers, onUpdate }) {
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showNewTrigger, setShowNewTrigger] = useState(false);

  const handleAddTrigger = async () => {
    const newTrigger = {
      template_id: templateId,
      name: "New Action",
      fire_on: "submitted",
      action_type: "send_email_notification",
      config: {},
      is_active: true,
    };

    // Would normally save to API
    onUpdate([...triggers, newTrigger]);
    setShowNewTrigger(false);
  };

  const handleDeleteTrigger = (triggerId) => {
    onUpdate(triggers.filter((t) => t.id !== triggerId));
  };

  const handleUpdateTrigger = (triggerId, updates) => {
    onUpdate(
      triggers.map((t) => (t.id === triggerId ? { ...t, ...updates } : t))
    );
  };

  const groupedByTrigger = {};
  TRIGGER_TYPES.forEach((type) => {
    groupedByTrigger[type] = triggers.filter((t) => t.fire_on === type);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Form Actions & Triggers</h3>
        <Button size="sm" onClick={() => setShowNewTrigger(true)} className="gap-1">
          <Plus className="w-4 h-4" />
          Add Action
        </Button>
      </div>

      {/* Trigger groups */}
      {TRIGGER_TYPES.map((triggerType) => {
        const triggerActions = groupedByTrigger[triggerType];
        const config = TRIGGER_CONFIG[triggerType];

        return (
          <div key={triggerType} className={`border rounded-lg p-4 ${config.color}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{config.icon}</span>
              <h4 className="font-medium text-sm">{config.label}</h4>
              <Badge variant="outline" className="text-xs">
                {triggerActions.length} action{triggerActions.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {triggerActions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No actions configured</p>
            ) : (
              <div className="space-y-2">
                {triggerActions.map((trigger) => (
                  <TriggerCard
                    key={trigger.id}
                    trigger={trigger}
                    isExpanded={expandedId === trigger.id}
                    onExpand={() => setExpandedId(expandedId === trigger.id ? null : trigger.id)}
                    onDelete={() => handleDeleteTrigger(trigger.id)}
                    onUpdate={(updates) => handleUpdateTrigger(trigger.id, updates)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* New trigger form */}
      {showNewTrigger && (
        <NewTriggerForm
          templateId={templateId}
          onAdd={handleAddTrigger}
          onCancel={() => setShowNewTrigger(false)}
        />
      )}

      {/* Info box */}
      <div className="bg-muted/30 border border-border rounded-lg p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">💡 Tips for using actions:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Use {{field_name}} in email/SMS templates to reference form field values</li>
          <li>Multiple actions can run for the same trigger</li>
          <li>Use &quot;Attach Form&quot; to link submissions to existing records</li>
          <li>Disable actions (toggle) instead of deleting them</li>
        </ul>
      </div>
    </div>
  );
}

function TriggerCard({ trigger, isExpanded, onExpand, onDelete, onUpdate }) {
  const actionConfig = ACTION_TYPES[trigger.action_type];

  return (
    <div className="bg-white border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Switch
              checked={trigger.is_active}
              onCheckedChange={(checked) => onUpdate({ is_active: checked })}
            />
            <div>
              <p className="text-xs font-medium text-foreground">{trigger.name}</p>
              <p className="text-xs text-muted-foreground">{actionConfig?.label}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={onExpand} className="h-7 w-7">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} className="h-7 w-7 text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <ActionConfigEditor
          trigger={trigger}
          actionType={trigger.action_type}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}

function ActionConfigEditor({ trigger, actionType, onUpdate }) {
  const actionConfig = ACTION_TYPES[actionType];
  const config = trigger.config || {};

  const handleConfigChange = (key, value) => {
    onUpdate({ config: { ...config, [key]: value } });
  };

  return (
    <div className="space-y-3 pt-2 border-t border-border">
      {/* Trigger name */}
      <div className="space-y-1.5">
        <Label className="text-xs">Action Name</Label>
        <Input
          value={trigger.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="e.g. Notify office team"
          className="text-xs"
        />
      </div>

      {/* Action-specific fields */}
      {actionType === "send_email_notification" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Send To Email *</Label>
            <Input
              value={config.email_to || ""}
              onChange={(e) => handleConfigChange("email_to", e.target.value)}
              placeholder="office@company.com"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subject *</Label>
            <Input
              value={config.subject || ""}
              onChange={(e) => handleConfigChange("subject", e.target.value)}
              placeholder="New form submission from {{name}}"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Message *</Label>
            <Textarea
              value={config.body || ""}
              onChange={(e) => handleConfigChange("body", e.target.value)}
              placeholder="A new form was submitted:\n{{contact_name}} - {{contact_phone}}"
              rows={3}
              className="text-xs"
            />
          </div>
        </>
      )}

      {actionType === "send_email_to_submitter" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Subject *</Label>
            <Input
              value={config.subject || ""}
              onChange={(e) => handleConfigChange("subject", e.target.value)}
              placeholder="We received your submission"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Message *</Label>
            <Textarea
              value={config.body || ""}
              onChange={(e) => handleConfigChange("body", e.target.value)}
              placeholder="Thank you {{name}} for your submission. We'll be in touch within 24 hours."
              rows={3}
              className="text-xs"
            />
          </div>
        </>
      )}

      {actionType === "create_task" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Task Title *</Label>
            <Input
              value={config.task_title || ""}
              onChange={(e) => handleConfigChange("task_title", e.target.value)}
              placeholder="Follow up with {{name}}"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={config.task_description || ""}
              onChange={(e) => handleConfigChange("task_description", e.target.value)}
              placeholder="Call {{contact_phone}} about {{issue_summary}}"
              rows={2}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Assign To (email)</Label>
            <Input
              value={config.assigned_to || ""}
              onChange={(e) => handleConfigChange("assigned_to", e.target.value)}
              placeholder="technician@company.com (optional)"
              className="text-xs"
            />
          </div>
        </>
      )}

      {actionType === "update_workflow_stage" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Entity Type *</Label>
            <Select value={config.entity_type || "lead"} onValueChange={(v) => handleConfigChange("entity_type", v)}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead (Enquiry)</SelectItem>
                <SelectItem value="job">Job</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Field Name *</Label>
            <Input
              value={config.field_name || ""}
              onChange={(e) => handleConfigChange("field_name", e.target.value)}
              placeholder="e.g. status, priority"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Field Value *</Label>
            <Input
              value={config.field_value || ""}
              onChange={(e) => handleConfigChange("field_value", e.target.value)}
              placeholder="e.g. ready_to_schedule, high"
              className="text-xs"
            />
          </div>
        </>
      )}

      {actionType === "create_lead" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Branch ID *</Label>
          <Input
            value={config.branch_id || ""}
            onChange={(e) => handleConfigChange("branch_id", e.target.value)}
            placeholder="Branch ID where lead will be created"
            className="text-xs"
          />
        </div>
      )}

      {actionType === "create_job" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Job Type *</Label>
            <Input
              value={config.job_type || ""}
              onChange={(e) => handleConfigChange("job_type", e.target.value)}
              placeholder="e.g. leak_inspection"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Branch ID *</Label>
            <Input
              value={config.branch_id || ""}
              onChange={(e) => handleConfigChange("branch_id", e.target.value)}
              placeholder="Branch ID where job will be created"
              className="text-xs"
            />
          </div>
        </>
      )}
    </div>
  );
}

function NewTriggerForm({ templateId, onAdd, onCancel }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-sm">Create New Action</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Trigger Event *</Label>
            <Select defaultValue="submitted">
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {TRIGGER_CONFIG[type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Action Type *</Label>
            <Select defaultValue="send_email_notification">
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ACTION_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onAdd} size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            Create Action
          </Button>
          <Button onClick={onCancel} size="sm" variant="outline">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}