import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const FORM_TYPES = [
  { value: "website", label: "Website Form (→ Lead)" },
  { value: "job", label: "Job Form (→ Job)" },
  { value: "agreement", label: "Agreement / Contract" },
];

const RELATED_OBJECTS = {
  website: [{ value: "Lead", label: "Lead" }],
  job: [{ value: "Job", label: "Job" }],
  agreement: [
    { value: "Lead", label: "Lead" },
    { value: "Job", label: "Job" },
    { value: "Lead_or_Job", label: "Lead or Job" },
  ],
};

const JOB_TYPES = [
  { value: "any", label: "Any Job Type" },
  { value: "leak_inspection", label: "Leak Inspection" },
  { value: "structural_inspection", label: "Structural Inspection" },
  { value: "pressure_test", label: "Pressure Test" },
  { value: "scuba_dive_test", label: "Scuba Dive Test" },
  { value: "repair", label: "Repair" },
  { value: "domestic_inspection", label: "Domestic Inspection" },
  { value: "service_call", label: "Service Call" },
  { value: "other", label: "Other" },
];

export default function FormDetailsPanel({ meta, onUpdate }) {
  const set = (k, v) => onUpdate({ ...meta, [k]: v });

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Form Details</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Form Name <span className="text-destructive">*</span></Label>
          <Input
            value={meta.name || ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Pool Leak Website Form"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Form Type</Label>
          <Select
            value={meta.form_type || "website"}
            onValueChange={(v) => {
              const defaults = { website: "Lead", job: "Job", agreement: "Lead_or_Job" };
              onUpdate({ ...meta, form_type: v, related_object: defaults[v] });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FORM_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Related Object</Label>
          <Select value={meta.related_object || "Lead"} onValueChange={(v) => set("related_object", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(RELATED_OBJECTS[meta.form_type || "website"] || []).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {meta.form_type === "job" && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Linked Job Type</Label>
            <Select value={meta.linked_job_type || "any"} onValueChange={(v) => set("linked_job_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Description</Label>
          <Textarea
            value={meta.description || ""}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className="resize-none text-sm"
            placeholder="Internal description of this form"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 pt-1 border-t border-border">
        <div className="flex items-center gap-2">
          <Switch checked={meta.status === "active"} onCheckedChange={(v) => set("status", v ? "active" : "draft")} />
          <Label className="text-xs">{meta.status === "active" ? "Active" : "Draft"}</Label>
        </div>
        {meta.form_type === "website" && (
          <div className="flex items-center gap-2">
            <Switch checked={!!meta.is_public} onCheckedChange={(v) => set("is_public", v)} />
            <Label className="text-xs">Publicly accessible</Label>
          </div>
        )}
        {meta.form_type === "website" && (
          <div className="flex items-center gap-2">
            <Switch checked={!!meta.spam_protection} onCheckedChange={(v) => set("spam_protection", v)} />
            <Label className="text-xs">Spam protection</Label>
          </div>
        )}
        {meta.form_type === "agreement" && (
          <div className="flex items-center gap-2">
            <Switch checked={!!meta.requires_signature} onCheckedChange={(v) => set("requires_signature", v)} />
            <Label className="text-xs">Requires signature</Label>
          </div>
        )}
      </div>
    </div>
  );
}