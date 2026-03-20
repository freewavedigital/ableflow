import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  MessageSquare, Mail, Plus, Edit2, Trash2, Copy, Tag,
} from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

// ── Placeholder reference ──────────────────────────────────────────────────
const PLACEHOLDERS = [
  { key: "client_name",       label: "Client Name",        example: "John Smith" },
  { key: "client_phone",      label: "Client Phone",       example: "0412 345 678" },
  { key: "client_email",      label: "Client Email",       example: "john@example.com" },
  { key: "job_date",          label: "Job Date",           example: "Monday 24 March 2026" },
  { key: "job_time",          label: "Job Time",           example: "9:00 AM" },
  { key: "job_type",          label: "Service Type",       example: "Leak Inspection" },
  { key: "technician_name",   label: "Technician Name",    example: "Mike Johnson" },
  { key: "branch_name",       label: "Branch Name",        example: "Able Leak – Brisbane" },
  { key: "branch_phone",      label: "Branch Phone",       example: "07 3000 0000" },
  { key: "site_address",      label: "Site Address",       example: "12 Example St, Brisbane" },
  { key: "quote_amount",      label: "Quote Amount",       example: "$850.00" },
  { key: "reference_number",  label: "Reference Number",   example: "ENQ-0042" },
];

// ── Categories ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "appointment",   label: "Enquiry / Booking" },
  { value: "confirmation",  label: "Booking Confirmation" },
  { value: "reminder",      label: "Reminder" },
  { value: "quote",         label: "Quote Sent" },
  { value: "follow_up",     label: "Follow Up / Completion" },
  { value: "other",         label: "Other" },
];

// ── Seed templates ─────────────────────────────────────────────────────────
const SEED_TEMPLATES = [
  {
    template_type: "sms",
    category: "appointment",
    name: "Enquiry Response",
    content: "Hi {{client_name}}, thanks for contacting {{branch_name}}. We've received your enquiry and will be in touch shortly to discuss your {{job_type}} booking. – {{branch_name}}",
  },
  {
    template_type: "sms",
    category: "appointment",
    name: "Tentative Booking Message",
    content: "Hi {{client_name}}, we're looking at {{job_date}} for your {{job_type}} at {{site_address}}. We'll confirm your exact time shortly. Any questions? Call {{branch_phone}}.",
  },
  {
    template_type: "sms",
    category: "confirmation",
    name: "Booking Confirmation",
    content: "Hi {{client_name}}, your {{job_type}} is confirmed for {{job_date}} at {{job_time}}. Our technician {{technician_name}} will attend {{site_address}}. Ref: {{reference_number}}. – {{branch_name}}",
  },
  {
    template_type: "sms",
    category: "reminder",
    name: "Job Reminder",
    content: "Reminder: Your {{job_type}} with {{branch_name}} is tomorrow {{job_date}} at {{job_time}} at {{site_address}}. Call {{branch_phone}} to reschedule. See you then!",
  },
  {
    template_type: "sms",
    category: "follow_up",
    name: "Job Completion",
    content: "Hi {{client_name}}, our technician has completed your {{job_type}} today. We'll follow up with a report shortly. Thanks for choosing {{branch_name}}! – {{technician_name}}",
  },
  {
    template_type: "sms",
    category: "quote",
    name: "Quote Sent",
    content: "Hi {{client_name}}, your quote for {{job_type}} has been sent to {{client_email}}. Total: {{quote_amount}}. Ref: {{reference_number}}. Questions? Call {{branch_phone}}.",
  },
  // Email templates
  {
    template_type: "email",
    category: "appointment",
    name: "Enquiry Response",
    content: "Hi {{client_name}},\n\nThank you for reaching out to {{branch_name}}! We've received your enquiry regarding a {{job_type}} and will be in touch shortly to discuss your requirements and arrange a suitable booking time.\n\nIf you need to speak with us urgently, please call {{branch_phone}}.\n\nKind regards,\n{{branch_name}}",
    for_email_only: {
      subject: "Thank you for your enquiry – {{branch_name}}",
    },
  },
  {
    template_type: "email",
    category: "appointment",
    name: "Tentative Booking Message",
    content: "Hi {{client_name}},\n\nWe have a tentative booking for your {{job_type}} scheduled for {{job_date}} at {{site_address}}. We'll be in touch shortly to confirm your exact arrival time.\n\nRef: {{reference_number}}\n\nPlease don't hesitate to contact us on {{branch_phone}} with any questions.\n\nKind regards,\n{{branch_name}}",
    for_email_only: {
      subject: "Tentative Booking – {{job_type}} on {{job_date}}",
    },
  },
  {
    template_type: "email",
    category: "confirmation",
    name: "Booking Confirmation",
    content: "Hi {{client_name}},\n\nYour booking is confirmed. Here are the details:\n\nService: {{job_type}}\nDate: {{job_date}}\nTime: {{job_time}}\nAddress: {{site_address}}\nTechnician: {{technician_name}}\nReference: {{reference_number}}\n\nPlease ensure access is available at the scheduled time. To reschedule, call {{branch_phone}}.\n\nWe look forward to seeing you!\n\nKind regards,\n{{branch_name}}",
    for_email_only: {
      subject: "Booking Confirmed – {{job_type}} on {{job_date}}",
    },
  },
  {
    template_type: "email",
    category: "reminder",
    name: "Job Reminder",
    content: "Hi {{client_name}},\n\nThis is a friendly reminder that your {{job_type}} is scheduled for tomorrow:\n\nDate: {{job_date}}\nTime: {{job_time}}\nAddress: {{site_address}}\nTechnician: {{technician_name}}\n\nPlease ensure someone is available to provide access. To reschedule, call us on {{branch_phone}}.\n\nSee you then!\n\nKind regards,\n{{branch_name}}",
    for_email_only: {
      subject: "Reminder: Your {{job_type}} is Tomorrow – {{job_date}}",
    },
  },
  {
    template_type: "email",
    category: "follow_up",
    name: "Job Completion",
    content: "Hi {{client_name}},\n\nThank you for having us! Our technician {{technician_name}} has completed your {{job_type}} at {{site_address}} today.\n\nA detailed inspection report will be sent to you shortly. If you have any questions or concerns in the meantime, please don't hesitate to get in touch on {{branch_phone}}.\n\nThank you for choosing {{branch_name}}!\n\nKind regards,\n{{technician_name}}\n{{branch_name}}",
    for_email_only: {
      subject: "{{job_type}} Completed – {{branch_name}}",
    },
  },
  {
    template_type: "email",
    category: "quote",
    name: "Quote Sent",
    content: "Hi {{client_name}},\n\nPlease find attached your quote for a {{job_type}} at {{site_address}}.\n\nQuote Total: {{quote_amount}}\nReference: {{reference_number}}\n\nThis quote is valid for 30 days. To accept, simply reply to this email or call us on {{branch_phone}}.\n\nKind regards,\n{{branch_name}}",
    for_email_only: {
      subject: "Your Quote – {{job_type}} – Ref {{reference_number}}",
    },
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function extractVariables(text) {
  const regex = /\{\{(\w+)\}\}/g;
  const found = new Set();
  let m;
  while ((m = regex.exec(text)) !== null) found.add(m[1]);
  return Array.from(found).map((name) => ({ name, description: "", example: "" }));
}

function categoryLabel(val) {
  return CATEGORIES.find((c) => c.value === val)?.label || val;
}

// ── Placeholder chip (click to insert) ─────────────────────────────────────
function PlaceholderChip({ p, onInsert }) {
  return (
    <button
      type="button"
      onClick={() => onInsert(`{{${p.key}}}`)}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-dashed border-primary/40 text-xs text-primary hover:bg-primary/5 transition-colors"
      title={`Example: ${p.example}`}
    >
      <Tag className="w-2.5 h-2.5" />
      {p.label}
    </button>
  );
}

// ── Template card ──────────────────────────────────────────────────────────
function TemplateCard({ template, onEdit, onDelete, onDuplicate }) {
  const isEmail = template.template_type === "email";
  const body = isEmail
    ? (template.for_email_only?.body_html?.replace(/<[^>]*>/g, "") || template.content)
    : template.content;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">{template.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-xs">{categoryLabel(template.category)}</Badge>
            {template.variables?.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {template.variables.length} placeholder{template.variables.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {isEmail && template.for_email_only?.subject && (
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              Subject: {template.for_email_only.subject}
            </p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button size="icon" variant="ghost" onClick={() => onDuplicate(template)} title="Duplicate">
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onEdit(template)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(template.id)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-line">{body}</p>
    </Card>
  );
}

// ── Template editor dialog ─────────────────────────────────────────────────
function TemplateDialog({ open, onClose, editingId, templateType, initialData, onSave, isSaving }) {
  const isEmail = templateType === "email";
  const [form, setForm] = useState(initialData);
  const activeRef = useRef(null); // track which textarea is focused

  useEffect(() => {
    setForm(initialData);
  }, [initialData, open]);

  const insertPlaceholder = (tag) => {
    const field = activeRef.current || (isEmail ? "body" : "content");
    setForm((prev) => {
      if (field === "body") return { ...prev, body: prev.body + tag };
      if (field === "subject") return { ...prev, subject: prev.subject + tag };
      return { ...prev, content: prev.content + tag };
    });
  };

  const detectedVars = isEmail
    ? extractVariables(`${form.subject} ${form.body}`)
    : extractVariables(form.content);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingId ? "Edit" : "New"} {isEmail ? "Email" : "SMS"} Template
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Name + Category */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Template Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Booking Confirmation"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject (email only) */}
          {isEmail && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Subject Line</label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                onFocus={() => { activeRef.current = "subject"; }}
                placeholder="e.g., Your {{job_type}} is Confirmed"
              />
            </div>
          )}

          {/* Body */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
              {isEmail ? "Email Body" : "Message"}
            </label>
            <Textarea
              value={isEmail ? form.body : form.content}
              onChange={(e) =>
                isEmail
                  ? setForm({ ...form, body: e.target.value })
                  : setForm({ ...form, content: e.target.value })
              }
              onFocus={() => { activeRef.current = isEmail ? "body" : "content"; }}
              className={isEmail ? "h-44" : "h-28"}
              placeholder={
                isEmail
                  ? "Hi {{client_name}},\n\nYour {{job_type}} is confirmed for {{job_date}} at {{job_time}}..."
                  : "Hi {{client_name}}, your {{job_type}} is confirmed for {{job_date}}..."
              }
            />
            {!isEmail && (
              <p className="text-xs text-muted-foreground mt-1">
                Character count: {(form.content || "").length}
                {(form.content || "").length > 160 && " · Will send as multiple SMS"}
              </p>
            )}
          </div>

          {/* Placeholder reference */}
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Click to insert placeholder:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((p) => (
                <PlaceholderChip key={p.key} p={p} onInsert={insertPlaceholder} />
              ))}
            </div>
          </div>

          {/* Detected variables */}
          {detectedVars.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs font-semibold mb-1.5">Placeholders in this template:</p>
              <div className="flex flex-wrap gap-1">
                {detectedVars.map((v) => {
                  const known = PLACEHOLDERS.find((p) => p.key === v.name);
                  return (
                    <span key={v.name} className={`text-xs px-2 py-0.5 rounded-full border ${known ? "bg-primary/10 text-primary border-primary/20" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {`{{${v.name}}}`}
                      {!known && " ⚠ unknown"}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={isSaving || !form.name}>
            {editingId ? "Update" : "Create"} Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Tab panel ──────────────────────────────────────────────────────────────
const EMPTY_SMS  = { name: "", category: "appointment", content: "" };
const EMPTY_EMAIL = { name: "", category: "appointment", subject: "", body: "" };

function TemplateTab({ templateType }) {
  const isEmail = templateType === "email";
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [initialData, setInitialData] = useState(isEmail ? EMPTY_EMAIL : EMPTY_SMS);
  const queryKey = [`comm-templates-${templateType}`];

  const { data: templates = [], isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      base44.entities.CommunicationTemplate.filter(
        { template_type: templateType, status: "active" },
        "-created_date",
        200
      ),
  });

  const saveMutation = useMutation({
    mutationFn: (form) => {
      const payload = {
        name: form.name,
        template_type: templateType,
        category: form.category,
        status: "active",
        variables: isEmail
          ? extractVariables(`${form.subject} ${form.body}`)
          : extractVariables(form.content),
        content: isEmail ? form.body : form.content,
        ...(isEmail && {
          for_email_only: {
            subject: form.subject,
            body_html: form.body,
            body_plain: form.body,
          },
        }),
      };
      return editingId
        ? base44.entities.CommunicationTemplate.update(editingId, payload)
        : base44.entities.CommunicationTemplate.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["sms-templates-all"] });
      queryClient.invalidateQueries({ queryKey: ["email-templates-all"] });
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CommunicationTemplate.update(id, { status: "archived" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const openNew = () => {
    setEditingId(null);
    setInitialData(isEmail ? EMPTY_EMAIL : EMPTY_SMS);
    setOpen(true);
  };

  const openEdit = (t) => {
    setEditingId(t.id);
    setInitialData(
      isEmail
        ? {
            name: t.name,
            category: t.category,
            subject: t.for_email_only?.subject || "",
            body: t.for_email_only?.body_html || t.content || "",
          }
        : { name: t.name, category: t.category, content: t.content || "" }
    );
    setOpen(true);
  };

  const openDuplicate = (t) => {
    setEditingId(null);
    setInitialData(
      isEmail
        ? {
            name: `${t.name} (Copy)`,
            category: t.category,
            subject: t.for_email_only?.subject || "",
            body: t.for_email_only?.body_html || t.content || "",
          }
        : { name: `${t.name} (Copy)`, category: t.category, content: t.content || "" }
    );
    setOpen(true);
  };

  // Seed default templates if none exist
  const seedMutation = useMutation({
    mutationFn: () => {
      const seeds = SEED_TEMPLATES.filter((s) => s.template_type === templateType);
      return Promise.all(
        seeds.map((s) =>
          base44.entities.CommunicationTemplate.create({
            ...s,
            status: "active",
            variables: isEmail
              ? extractVariables(`${s.for_email_only?.subject || ""} ${s.content}`)
              : extractVariables(s.content),
            ...(isEmail && {
              for_email_only: {
                subject: s.for_email_only?.subject || "",
                body_html: s.content,
                body_plain: s.content,
              },
            }),
          })
        )
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Loading templates…</div>;
  }

  const Icon = isEmail ? Mail : MessageSquare;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {templates.length} template{templates.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={openNew} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {!templates.length ? (
        <EmptyState icon={Icon} title={`No ${isEmail ? "email" : "SMS"} templates yet`}>
          <div className="flex gap-2 mt-1">
            <Button onClick={openNew} variant="outline" size="sm">Create Template</Button>
            <Button
              onClick={() => seedMutation.mutate()}
              variant="outline"
              size="sm"
              disabled={seedMutation.isPending}
            >
              Load Defaults
            </Button>
          </div>
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onEdit={openEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
              onDuplicate={openDuplicate}
            />
          ))}
        </div>
      )}

      <TemplateDialog
        open={open}
        onClose={() => setOpen(false)}
        editingId={editingId}
        templateType={templateType}
        initialData={initialData}
        onSave={saveMutation.mutate}
        isSaving={saveMutation.isPending}
      />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function CommunicationTemplates() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Communication Templates"
        subtitle="Reusable SMS and email templates with dynamic placeholders"
      />

      {/* Placeholder legend */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Available Placeholders
        </p>
        <div className="flex flex-wrap gap-2">
          {PLACEHOLDERS.map((p) => (
            <div
              key={p.key}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 rounded-lg border border-border"
              title={`Example: ${p.example}`}
            >
              <code className="text-xs text-primary font-mono">{`{{${p.key}}}`}</code>
              <span className="text-xs text-muted-foreground hidden sm:inline">→ {p.label}</span>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="sms">
        <TabsList className="mb-4">
          <TabsTrigger value="sms" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sms">
          <TemplateTab templateType="sms" />
        </TabsContent>
        <TabsContent value="email">
          <TemplateTab templateType="email" />
        </TabsContent>
      </Tabs>
    </div>
  );
}