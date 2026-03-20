import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Zap, Plus, Edit2, Trash2, MessageSquare, Mail, Bell, CheckSquare,
  ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
} from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

// ─── Trigger event definitions ────────────────────────────────────────────────
const TRIGGER_EVENTS = [
  { value: "form_submitted",          label: "Form Submitted",                group: "Leads" },
  { value: "lead_status_changed",     label: "Lead Stage Changed",            group: "Leads" },
  { value: "agreement_signed",        label: "Agreement Signed",              group: "Leads" },
  { value: "job_scheduled",           label: "Job Scheduled",                 group: "Jobs" },
  { value: "technician_on_the_way",   label: "Technician Marked On The Way",  group: "Jobs" },
  { value: "job_completed",           label: "Job Completed",                 group: "Jobs" },
  { value: "quote_created",           label: "Quote Created",                 group: "Finance" },
  { value: "invoice_sent",            label: "Invoice Sent",                  group: "Finance" },
];

// ─── Action types ─────────────────────────────────────────────────────────────
const ACTION_TYPES = [
  { value: "send_sms",         label: "Send SMS",              icon: MessageSquare, color: "text-green-600" },
  { value: "send_email",       label: "Send Email",            icon: Mail,          color: "text-blue-600"  },
  { value: "notify_internal",  label: "Notify Internal User",  icon: Bell,          color: "text-amber-600" },
  { value: "create_task",      label: "Create Task",           icon: CheckSquare,   color: "text-purple-600" },
];

const ACTION_RECIPIENT_OPTIONS = {
  send_sms:        ["client", "assigned_technician"],
  send_email:      ["client", "assigned_technician", "branch_manager", "custom"],
  notify_internal: ["assigned_technician", "branch_manager", "custom"],
  create_task:     ["assigned_technician", "branch_manager", "custom"],
};

const RECIPIENT_LABELS = {
  client:               "Client",
  assigned_technician:  "Assigned Technician",
  branch_manager:       "Branch Manager",
  custom:               "Custom (specify email)",
};

function blankAction() {
  return { action_type: "send_sms", recipient_type: "client", template_id: "", custom_recipient: "", task_title: "", task_notes: "" };
}

function blankForm() {
  return {
    name: "",
    trigger_event: "",
    description: "",
    actions: [blankAction()],
    status: "active",
  };
}

// ─── Action icon ──────────────────────────────────────────────────────────────
function ActionIcon({ type, className = "w-4 h-4" }) {
  const def = ACTION_TYPES.find((a) => a.value === type);
  if (!def) return null;
  const Icon = def.icon;
  return <Icon className={`${className} ${def.color}`} />;
}

// ─── Single action row in the editor ─────────────────────────────────────────
function ActionRow({ action, index, onChange, onRemove, smsTemplates, emailTemplates, canRemove }) {
  const recipients = ACTION_RECIPIENT_OPTIONS[action.action_type] || [];
  const needsTemplate = action.action_type === "send_sms" || action.action_type === "send_email";
  const templates = action.action_type === "send_sms" ? smsTemplates : emailTemplates;

  return (
    <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Action {index + 1}
        </span>
        {canRemove && (
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onRemove}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        )}
      </div>

      {/* Action type */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Action Type</label>
          <Select value={action.action_type} onValueChange={(v) => onChange({ ...action, action_type: v, recipient_type: ACTION_RECIPIENT_OPTIONS[v]?.[0] || "client", template_id: "" })}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  <span className="flex items-center gap-2">
                    <a.icon className={`w-3.5 h-3.5 ${a.color}`} />
                    {a.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Recipient */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Recipient</label>
          <Select value={action.recipient_type} onValueChange={(v) => onChange({ ...action, recipient_type: v })}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {recipients.map((r) => (
                <SelectItem key={r} value={r}>{RECIPIENT_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom recipient email */}
      {action.recipient_type === "custom" && (
        <Input
          placeholder="Email or phone number"
          value={action.custom_recipient}
          onChange={(e) => onChange({ ...action, custom_recipient: e.target.value })}
          className="h-8 text-sm"
        />
      )}

      {/* Template select */}
      {needsTemplate && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Template</label>
          <Select value={action.template_id} onValueChange={(v) => onChange({ ...action, template_id: v })}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {(templates || []).map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!(templates?.length) && (
            <p className="text-xs text-amber-600 mt-1">
              No {action.action_type === "send_sms" ? "SMS" : "email"} templates found — create one in Communication Templates first.
            </p>
          )}
        </div>
      )}

      {/* Task fields */}
      {action.action_type === "create_task" && (
        <div className="space-y-2">
          <Input
            placeholder="Task title"
            value={action.task_title}
            onChange={(e) => onChange({ ...action, task_title: e.target.value })}
            className="h-8 text-sm"
          />
          <Textarea
            placeholder="Task notes (optional)"
            value={action.task_notes}
            onChange={(e) => onChange({ ...action, task_notes: e.target.value })}
            className="h-16 text-sm"
          />
        </div>
      )}

      {/* Notify internal — free-text message */}
      {action.action_type === "notify_internal" && (
        <Input
          placeholder="Notification message"
          value={action.task_title}
          onChange={(e) => onChange({ ...action, task_title: e.target.value })}
          className="h-8 text-sm"
        />
      )}
    </div>
  );
}

// ─── Trigger card ─────────────────────────────────────────────────────────────
function TriggerCard({ trigger, onEdit, onToggle, onDelete, smsTemplates, emailTemplates }) {
  const [expanded, setExpanded] = useState(false);
  const eventDef = TRIGGER_EVENTS.find((e) => e.value === trigger.trigger_event);
  const isActive = trigger.status === "active";
  const actions = trigger.actions || [];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-primary/10" : "bg-muted"}`}>
            <Zap className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-sm">{trigger.name}</h3>
              <Badge variant="outline" className={isActive ? "border-green-200 bg-green-50 text-green-700" : "border-muted bg-muted text-muted-foreground"}>
                {isActive ? "Active" : "Paused"}
              </Badge>
              {eventDef && (
                <Badge variant="secondary" className="text-xs">{eventDef.group}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              When: <span className="font-medium text-foreground">{eventDef?.label || trigger.trigger_event}</span>
            </p>
            {trigger.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{trigger.description}</p>
            )}

            {/* Action summary chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {actions.map((a, i) => {
                const def = ACTION_TYPES.find((t) => t.value === a.action_type);
                return (
                  <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted border border-border">
                    {def && <def.icon className={`w-3 h-3 ${def.color}`} />}
                    {def?.label}
                    {a.recipient_type && <span className="text-muted-foreground">→ {RECIPIENT_LABELS[a.recipient_type]}</span>}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setExpanded(!expanded)} title="Expand">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onToggle(trigger)}>
            {isActive
              ? <ToggleRight className="w-4 h-4 text-green-600" />
              : <ToggleLeft className="w-4 h-4 text-muted-foreground" />
            }
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(trigger)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDelete(trigger.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Expanded action detail */}
      {expanded && actions.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {actions.map((a, i) => {
            const def = ACTION_TYPES.find((t) => t.value === a.action_type);
            const tmpl = a.action_type === "send_sms"
              ? smsTemplates?.find((t) => t.id === a.template_id)
              : emailTemplates?.find((t) => t.id === a.template_id);
            return (
              <div key={i} className="flex gap-2 text-xs bg-muted/30 rounded-lg px-3 py-2">
                {def && <def.icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${def.color}`} />}
                <div>
                  <span className="font-medium">{def?.label}</span>
                  <span className="text-muted-foreground"> → {RECIPIENT_LABELS[a.recipient_type] || a.recipient_type}</span>
                  {tmpl && <span className="text-muted-foreground"> using <em>{tmpl.name}</em></span>}
                  {a.custom_recipient && <span className="text-muted-foreground"> ({a.custom_recipient})</span>}
                  {(a.task_title) && <span className="text-muted-foreground">: "{a.task_title}"</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Editor dialog ────────────────────────────────────────────────────────────
function TriggerDialog({ open, onClose, editingTrigger, smsTemplates, emailTemplates, onSave, isSaving }) {
  const [form, setForm] = useState(blankForm());

  React.useEffect(() => {
    if (open) {
      setForm(editingTrigger
        ? {
            name: editingTrigger.name,
            trigger_event: editingTrigger.trigger_event,
            description: editingTrigger.description || "",
            actions: editingTrigger.actions?.length ? editingTrigger.actions : [blankAction()],
            status: editingTrigger.status || "active",
          }
        : blankForm()
      );
    }
  }, [open, editingTrigger]);

  const updateAction = (i, updated) => {
    const actions = [...form.actions];
    actions[i] = updated;
    setForm({ ...form, actions });
  };
  const removeAction = (i) => setForm({ ...form, actions: form.actions.filter((_, idx) => idx !== i) });
  const addAction = () => setForm({ ...form, actions: [...form.actions, blankAction()] });

  const isValid = form.name && form.trigger_event && form.actions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTrigger ? "Edit Trigger" : "New Communication Trigger"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Trigger Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Job Completion Follow-up"
            />
          </div>

          {/* Trigger event */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">When does this fire?</label>
            <Select value={form.trigger_event} onValueChange={(v) => setForm({ ...form, trigger_event: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a trigger event" />
              </SelectTrigger>
              <SelectContent>
                {["Leads", "Jobs", "Finance"].map((group) => (
                  <React.Fragment key={group}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group}</div>
                    {TRIGGER_EVENTS.filter((e) => e.group === group).map((e) => (
                      <SelectItem key={e.value} value={e.value} className="pl-4">{e.label}</SelectItem>
                    ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Description (optional)</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Briefly describe what this trigger does"
            />
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</label>
              <Button size="sm" variant="outline" onClick={addAction} className="h-7 text-xs gap-1">
                <Plus className="w-3 h-3" />
                Add Action
              </Button>
            </div>
            <div className="space-y-3">
              {form.actions.map((action, i) => (
                <ActionRow
                  key={i}
                  index={i}
                  action={action}
                  onChange={(updated) => updateAction(i, updated)}
                  onRemove={() => removeAction(i)}
                  canRemove={form.actions.length > 1}
                  smsTemplates={smsTemplates}
                  emailTemplates={emailTemplates}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={isSaving || !isValid}>
            {editingTrigger ? "Update Trigger" : "Create Trigger"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CommunicationTriggers() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState(null);

  const { data: triggers = [], isLoading } = useQuery({
    queryKey: ["comm-triggers"],
    queryFn: () => base44.entities.CommunicationTrigger.list("-created_date", 200),
  });

  const { data: smsTemplates = [] } = useQuery({
    queryKey: ["sms-templates-all"],
    queryFn: () => base44.entities.CommunicationTemplate.filter({ template_type: "sms", status: "active" }, "name", 200),
  });

  const { data: emailTemplates = [] } = useQuery({
    queryKey: ["email-templates-all"],
    queryFn: () => base44.entities.CommunicationTemplate.filter({ template_type: "email", status: "active" }, "name", 200),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const payload = {
        name: data.name,
        description: data.description,
        trigger_event: data.trigger_event,
        status: data.status || "active",
        communication_channel: "sms", // kept for schema compat — actual channel is per-action
        actions: data.actions,
      };
      return id
        ? base44.entities.CommunicationTrigger.update(id, payload)
        : base44.entities.CommunicationTrigger.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comm-triggers"] });
      setOpen(false);
      setEditingTrigger(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (trigger) =>
      base44.entities.CommunicationTrigger.update(trigger.id, {
        status: trigger.status === "active" ? "paused" : "active",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comm-triggers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CommunicationTrigger.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comm-triggers"] }),
  });

  const handleEdit = (trigger) => {
    setEditingTrigger(trigger);
    setOpen(true);
  };

  const handleNew = () => {
    setEditingTrigger(null);
    setOpen(true);
  };

  // Group triggers by event group
  const grouped = TRIGGER_EVENTS.reduce((acc, ev) => {
    const matching = triggers.filter((t) => t.trigger_event === ev.value);
    if (matching.length) {
      acc[ev.group] = [...(acc[ev.group] || []), ...matching];
    }
    return acc;
  }, {});

  // Ungrouped (unknown trigger_event)
  const ungrouped = triggers.filter((t) => !TRIGGER_EVENTS.find((e) => e.value === t.trigger_event));

  if (isLoading) {
    return <div className="flex justify-center py-12 text-sm text-muted-foreground">Loading triggers…</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Communication Triggers"
        subtitle="Automate SMS, email, notifications and tasks when workflow events occur"
      >
        <Button onClick={handleNew} className="gap-2">
          <Plus className="w-4 h-4" />
          New Trigger
        </Button>
      </PageHeader>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ACTION_TYPES.map((a) => (
          <div key={a.value} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-card border border-border">
            <a.icon className={`w-3.5 h-3.5 flex-shrink-0 ${a.color}`} />
            <span className="text-muted-foreground">{a.label}</span>
          </div>
        ))}
      </div>

      {!triggers.length ? (
        <EmptyState icon={Zap} title="No triggers defined yet" description="Create your first trigger to start automating communications across the job lifecycle.">
          <Button onClick={handleNew} variant="outline" size="sm" className="mt-2 gap-1">
            <Plus className="w-3.5 h-3.5" />
            Create First Trigger
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {["Leads", "Jobs", "Finance"].map((group) =>
            grouped[group]?.length ? (
              <div key={group}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{group}</h2>
                <div className="space-y-3">
                  {grouped[group].map((trigger) => (
                    <TriggerCard
                      key={trigger.id}
                      trigger={trigger}
                      onEdit={handleEdit}
                      onToggle={(t) => toggleMutation.mutate(t)}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      smsTemplates={smsTemplates}
                      emailTemplates={emailTemplates}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )}
          {ungrouped.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Other</h2>
              <div className="space-y-3">
                {ungrouped.map((trigger) => (
                  <TriggerCard
                    key={trigger.id}
                    trigger={trigger}
                    onEdit={handleEdit}
                    onToggle={(t) => toggleMutation.mutate(t)}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    smsTemplates={smsTemplates}
                    emailTemplates={emailTemplates}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <TriggerDialog
        open={open}
        onClose={() => { setOpen(false); setEditingTrigger(null); }}
        editingTrigger={editingTrigger}
        smsTemplates={smsTemplates}
        emailTemplates={emailTemplates}
        onSave={(data) => saveMutation.mutate({ id: editingTrigger?.id, data })}
        isSaving={saveMutation.isPending}
      />
    </div>
  );
}