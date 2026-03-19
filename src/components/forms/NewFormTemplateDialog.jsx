import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Globe, Briefcase, FileSignature } from "lucide-react";

// Normalize legacy "enquiry" tab value to "website"
const normalizeType = (t) => (t === "enquiry" ? "website" : t);

const FORM_TYPES = [
  {
    value: "website",
    label: "Website Form",
    icon: Globe,
    description: "Public-facing form to capture leads. Submissions create Lead records in the Enquiries pipeline.",
    relatedObject: "Lead",
  },
  {
    value: "job",
    label: "Job Form",
    icon: Briefcase,
    description: "Internal inspection form completed by technicians. Linked to a Job record.",
    relatedObject: "Job",
  },
  {
    value: "agreement",
    label: "Agreement / Contract",
    icon: FileSignature,
    description: "Client-facing contract with service terms and a digital signature field. Linked to a Lead or Job.",
    relatedObject: "Lead_or_Job",
  },
];

const JOB_TYPES = [
  { value: "any", label: "All Job Types" },
  { value: "leak_inspection", label: "Leak Inspection" },
  { value: "structural_inspection", label: "Structural Inspection" },
  { value: "pressure_test", label: "Pressure Test" },
  { value: "scuba_dive_test", label: "Scuba Dive Test" },
  { value: "pipe_blockage", label: "Pipe Blockage" },
  { value: "repair", label: "Repair" },
  { value: "domestic_inspection", label: "Domestic Inspection" },
  { value: "service_call", label: "Service Call" },
  { value: "follow_up", label: "Follow-up" },
  { value: "other", label: "Other" },
];

const AGREEMENT_LINKED_TO = [
  { value: "either", label: "Lead or Job (either stage)" },
  { value: "lead", label: "Lead only (pre-job)" },
  { value: "job", label: "Job only (post-conversion)" },
];

export default function NewFormTemplateDialog({ defaultType = "website", onCreated, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    form_type: normalizeType(defaultType),
    name: "",
    description: "",
    linked_job_type: "any",
    agreement_linked_to: "either",
    requires_signature: true,
    is_public: false,
    agreement_body: "",
    submission_email_to: "",
    success_message: "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FormTemplate.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["form-templates"] }); onCreated(); },
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    const selectedType = FORM_TYPES.find((t) => t.value === form.form_type);

    const payload = {
      name: form.name.trim(),
      form_type: form.form_type,
      related_object: selectedType.relatedObject,
      description: form.description,
      status: "draft",
      version: 1,
      is_active: false,
      sections: [],
    };

    if (form.form_type === "job") {
      payload.linked_job_type = form.linked_job_type;
    }
    if (form.form_type === "website") {
      payload.is_public = form.is_public;
      payload.submission_email_to = form.submission_email_to;
      payload.success_message = form.success_message;
    }
    if (form.form_type === "agreement") {
      payload.agreement_body = form.agreement_body;
      payload.agreement_linked_to = form.agreement_linked_to;
      payload.requires_signature = form.requires_signature;
    }

    createMutation.mutate(payload);
  };

  const selectedType = FORM_TYPES.find((t) => t.value === form.form_type);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Form Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Form type selector */}
          <div className="space-y-2">
            <Label>Form Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {FORM_TYPES.map((t) => {
                const Icon = t.icon;
                const active = form.form_type === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => set("form_type", t.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                      active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-medium leading-tight ${active ? "text-primary" : "text-foreground"}`}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedType && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground flex-1">{selectedType.description}</p>
                <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full whitespace-nowrap">
                  → {selectedType.relatedObject.replace("_or_", " or ")}
                </span>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label>Template Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder={
                form.form_type === "website" ? "e.g. Pool Leak Enquiry Form" :
                form.form_type === "job" ? "e.g. Initial Leak Inspection Form" :
                "e.g. Service Agreement – Inspection"
              }
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="Brief description of what this form is for"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Job type linkage */}
          {form.form_type === "job" && (
            <div className="space-y-1.5">
              <Label>Linked Job Type</Label>
              <Select value={form.linked_job_type} onValueChange={(v) => set("linked_job_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">This form will surface for jobs of this type in the technician view.</p>
            </div>
          )}

          {/* Website-specific */}
          {form.form_type === "website" && (
            <>
              <div className="space-y-1.5">
                <Label>Notification Email</Label>
                <Input
                  type="email"
                  placeholder="office@ableleak.com.au"
                  value={form.submission_email_to}
                  onChange={(e) => set("submission_email_to", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Alert this address when a new lead is submitted.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Success Message</Label>
                <Textarea
                  placeholder="Thank you for your enquiry. Our team will contact you within 24 hours."
                  value={form.success_message}
                  onChange={(e) => set("success_message", e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </>
          )}

          {/* Agreement-specific */}
          {form.form_type === "agreement" && (
            <>
              <div className="space-y-1.5">
                <Label>Linked To</Label>
                <Select value={form.agreement_linked_to} onValueChange={(v) => set("agreement_linked_to", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGREEMENT_LINKED_TO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Which workflow stage this agreement applies to.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Agreement Body Text</Label>
                <Textarea
                  placeholder="Enter your service agreement terms here. The client will read this before signing."
                  value={form.agreement_body}
                  onChange={(e) => set("agreement_body", e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>
            </>
          )}

          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            New templates are saved as <strong>Draft</strong>. Activate them when they are ready to use.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.name.trim() || createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Create as Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}