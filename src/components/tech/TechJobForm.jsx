import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Circle, Loader2, Save } from "lucide-react";
import { debounce } from "lodash";

function FormField({ field, value, onChange }) {
  const { type, label, options = [], required } = field;

  const base = "text-base"; // larger text for mobile readability

  if (type === "text") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
        <Input className={`h-11 ${base}`} value={value || ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
        <Textarea className={`${base} resize-none`} rows={3} value={value || ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }

  if (type === "number") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
        <Input className={`h-11 ${base}`} type="number" inputMode="decimal" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }

  if (type === "select") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger className="h-11 text-base"><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (type === "yes_no" || type === "pass_fail") {
    const opts = type === "yes_no" ? ["Yes", "No"] : ["Pass", "Fail"];
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
        <div className="flex gap-2">
          {opts.map((o) => (
            <button
              key={o}
              onClick={() => onChange(o)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-[0.97] ${
                value === o
                  ? o === "Yes" || o === "Pass"
                    ? "bg-green-100 border-green-500 text-green-800"
                    : "bg-red-100 border-red-500 text-red-800"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === "checkbox") {
    const checked = value === true || value === "true";
    return (
      <button
        onClick={() => onChange(!checked)}
        className="flex items-center gap-3 w-full py-3 text-left"
      >
        {checked
          ? <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
          : <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
        }
        <span className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</span>
      </button>
    );
  }

  if (type === "date") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
        <Input className="h-11 text-base" type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }

  return null;
}

export default function TechJobForm({ job, onFormDataChange }) {
  const [formData, setFormData] = useState(job.report_data || {});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Fetch the matching JobTypeTemplate
  const { data: templates = [] } = useQuery({
    queryKey: ["job-templates", job.job_type],
    queryFn: () => base44.entities.JobTypeTemplate.filter({ job_type_key: job.job_type, is_active: true }),
  });
  const template = templates[0];

  // Auto-save draft — debounced
  const autoSave = useCallback(
    debounce(async (data) => {
      setSaving(true);
      await base44.entities.Job.update(job.id, { report_data: data });
      setLastSaved(new Date());
      setSaving(false);
    }, 1500),
    [job.id]
  );

  const handleFieldChange = (sectionId, fieldId, value) => {
    const next = {
      ...formData,
      [`${sectionId}__${fieldId}`]: value,
    };
    setFormData(next);
    onFormDataChange?.(next);
    autoSave(next);
  };

  const getValue = (sectionId, fieldId) => formData[`${sectionId}__${fieldId}`];

  if (!template) {
    // No template — show a free-form notes field
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Job Notes</Label>
        <Textarea
          value={formData["__notes"] || ""}
          onChange={(e) => {
            const next = { ...formData, __notes: e.target.value };
            setFormData(next);
            onFormDataChange?.(next);
            autoSave(next);
          }}
          placeholder="Record your findings, measurements, and observations..."
          rows={6}
          className="text-base resize-none"
        />
        {saving && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> Auto-saving…
          </p>
        )}
        {lastSaved && !saving && (
          <p className="flex items-center gap-1.5 text-xs text-green-600">
            <Save className="w-3 h-3" /> Saved
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-save indicator */}
      <div className="flex items-center gap-1.5 text-xs min-h-[16px]">
        {saving ? (
          <><Loader2 className="w-3 h-3 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Auto-saving…</span></>
        ) : lastSaved ? (
          <><Save className="w-3 h-3 text-green-600" /><span className="text-green-600">Draft saved</span></>
        ) : null}
      </div>

      {/* Sections */}
      {template.sections?.map((section) => (
        <div key={section.section_id} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">{section.title}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          {section.fields
            ?.filter((f) => f.type !== "photo" && f.type !== "video") // media handled separately
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((field) => (
              <FormField
                key={field.field_id}
                field={field}
                value={getValue(section.section_id, field.field_id)}
                onChange={(val) => handleFieldChange(section.section_id, field.field_id, val)}
              />
            ))}
        </div>
      ))}
    </div>
  );
}