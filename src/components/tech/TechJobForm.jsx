import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2, Circle, Loader2, Save, Camera, X, Plus, Trash2,
  ChevronDown, ChevronUp, CheckSquare, AlertTriangle, Video
} from "lucide-react";
import { debounce } from "lodash";

// ─── Photo Field ──────────────────────────────────────────────────────────────
function PhotoField({ label, required, value = [], onChange, disabled }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    const urls = [...value];
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    onChange(urls);
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, i) => (
            <div key={i} className="relative aspect-square">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-border" />
              </a>
              {!disabled && (
                <button
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {!disabled && (
        <>
          <input ref={ref} type="file" accept="image/*" multiple capture="environment" className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />
          <button
            onClick={() => ref.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground w-full justify-center active:bg-muted disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Camera className="w-4 h-4" />}
            {uploading ? "Uploading…" : value.length > 0 ? "Add Another Photo" : "Take / Upload Photo"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Video Link Field ─────────────────────────────────────────────────────────
function VideoLinksField({ label, required, value = [], onChange, disabled }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    if (!draft.trim()) return;
    onChange([...value, draft.trim()]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {value.map((url, i) => (
        <div key={i} className="flex items-center gap-2 text-sm bg-muted rounded-lg px-3 py-2">
          <Video className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-primary">{url}</a>
          {!disabled && (
            <button onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <div className="flex gap-2">
          <Input
            placeholder="Paste video URL (YouTube, Vimeo, etc.)"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-10 text-sm"
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button size="sm" variant="outline" onClick={add} disabled={!draft.trim()}>Add</Button>
        </div>
      )}
    </div>
  );
}

// ─── Materials Field ──────────────────────────────────────────────────────────
function MaterialsField({ value = [], onChange, disabled }) {
  const addRow = () => onChange([...value, { item: "", quantity: 1, cost: "" }]);
  const removeRow = (i) => onChange(value.filter((_, j) => j !== i));
  const updateRow = (i, field, val) => onChange(value.map((r, j) => j === i ? { ...r, [field]: val } : r));

  const total = value.reduce((sum, r) => sum + (parseFloat(r.cost) || 0) * (parseFloat(r.quantity) || 0), 0);

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-3">No materials added yet</p>
      )}
      {value.map((row, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 space-y-1.5">
            <Input placeholder="Item / material" className="h-10 text-sm" value={row.item}
              onChange={(e) => updateRow(i, "item", e.target.value)} disabled={disabled} />
            <div className="flex gap-2">
              <Input placeholder="Qty" type="number" inputMode="decimal" className="h-9 text-sm w-20"
                value={row.quantity} onChange={(e) => updateRow(i, "quantity", e.target.value)} disabled={disabled} />
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input placeholder="Unit cost" type="number" inputMode="decimal" className="h-9 text-sm pl-6"
                  value={row.cost} onChange={(e) => updateRow(i, "cost", e.target.value)} disabled={disabled} />
              </div>
            </div>
          </div>
          {!disabled && (
            <button onClick={() => removeRow(i)} className="mt-2 p-1.5 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button onClick={addRow} className="flex items-center gap-2 text-sm text-primary font-medium py-2">
          <Plus className="w-4 h-4" /> Add Material
        </button>
      )}
      {value.length > 0 && (
        <div className="flex justify-between text-sm font-semibold border-t border-border pt-3">
          <span className="text-muted-foreground">Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

// ─── Generic Field Renderer ────────────────────────────────────────────────────
function FieldRenderer({ field, value, onChange, disabled }) {
  const { type, label, options = [], required, placeholder, helper_text } = field;

  const Wrap = ({ children }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {helper_text && <p className="text-xs text-muted-foreground">{helper_text}</p>}
    </div>
  );

  if (type === "heading") return <h3 className="font-bold text-base mt-2">{label}</h3>;
  if (type === "paragraph") return <p className="text-sm text-muted-foreground">{label}</p>;
  if (type === "divider") return <hr className="border-border" />;

  if (type === "text" || type === "email" || type === "phone") return (
    <Wrap>
      <Input className="h-11 text-base" value={value || ""} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </Wrap>
  );

  if (type === "textarea") return (
    <Wrap>
      <Textarea className="text-base resize-none" rows={3} value={value || ""} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </Wrap>
  );

  if (type === "number") return (
    <Wrap>
      <Input className="h-11 text-base" type="number" inputMode="decimal" value={value ?? ""}
        placeholder={placeholder} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </Wrap>
  );

  if (type === "select") return (
    <Wrap>
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-11 text-base"><SelectValue placeholder="Select…" /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </Wrap>
  );

  if (type === "yes_no" || type === "pass_fail") {
    const opts = type === "yes_no" ? ["Yes", "No"] : ["Pass", "Fail"];
    const positive = opts[0];
    return (
      <Wrap>
        <div className="flex gap-2">
          {opts.map((o) => (
            <button key={o} onClick={() => !disabled && onChange(o)}
              className={`flex-1 py-3.5 rounded-xl border-2 text-sm font-bold transition-all active:scale-[0.97] ${
                value === o
                  ? o === positive
                    ? "bg-green-100 border-green-500 text-green-800"
                    : "bg-red-100 border-red-500 text-red-800"
                  : "border-border bg-card text-muted-foreground"
              } ${disabled ? "opacity-60 cursor-default" : ""}`}
            >
              {o === positive ? <span className="flex items-center justify-center gap-1.5"><CheckSquare className="w-4 h-4" />{o}</span>
                : <span className="flex items-center justify-center gap-1.5"><AlertTriangle className="w-4 h-4" />{o}</span>}
            </button>
          ))}
        </div>
      </Wrap>
    );
  }

  if (type === "checkbox") {
    const checked = value === true || value === "true";
    return (
      <button onClick={() => !disabled && onChange(!checked)} className="flex items-center gap-3 w-full py-3 text-left">
        {checked ? <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
          : <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />}
        <span className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</span>
      </button>
    );
  }

  if (type === "date") return (
    <Wrap>
      <Input className="h-11 text-base" type="date" value={value || ""}
        onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </Wrap>
  );

  if (type === "photo") return (
    <PhotoField label={label} required={required} value={value || []} onChange={onChange} disabled={disabled} />
  );

  if (type === "video") return (
    <VideoLinksField label={label} required={required} value={value || []} onChange={onChange} disabled={disabled} />
  );

  return null;
}

// ─── Section Block ────────────────────────────────────────────────────────────
function SectionBlock({ section, values, onChange, disabled, isMaterialsSection }) {
  const [collapsed, setCollapsed] = useState(false);

  // Pass/fail summary for section header
  const passFailFields = section.fields?.filter((f) => f.type === "pass_fail") || [];
  const failCount = passFailFields.filter((f) => values[f.field_key] === "Fail").length;
  const passCount = passFailFields.filter((f) => values[f.field_key] === "Pass").length;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-muted/50 border-b border-border text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{section.title}</span>
          {passFailFields.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              {passCount > 0 && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{passCount} Pass</span>}
              {failCount > 0 && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{failCount} Fail</span>}
            </div>
          )}
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
      </button>

      {!collapsed && (
        <div className="p-4 space-y-5">
          {isMaterialsSection ? (
            <MaterialsField value={values["__materials"] || []}
              onChange={(v) => onChange("__materials", v)} disabled={disabled} />
          ) : (
            section.fields
              ?.sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((field) => (
                <FieldRenderer
                  key={field.field_key}
                  field={field}
                  value={values[field.field_key]}
                  onChange={(val) => onChange(field.field_key, val)}
                  disabled={disabled}
                />
              ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Save Indicator ────────────────────────────────────────────────────────────
function SaveIndicator({ saving, lastSaved, status }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {saving ? (
        <><Loader2 className="w-3 h-3 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Saving…</span></>
      ) : lastSaved ? (
        <><Save className="w-3 h-3 text-green-600" /><span className="text-green-600">Draft saved</span></>
      ) : null}
      {status === "submitted" && (
        <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">Submitted</span>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TechJobForm({ job, readOnly = false }) {
  const qc = useQueryClient();
  const [fieldValues, setFieldValues] = useState({});
  const [submissionId, setSubmissionId] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isDisabled = readOnly || submissionStatus === "submitted";

  // 1. Find the right FormTemplate for this job type
  const { data: templates = [] } = useQuery({
    queryKey: ["form-templates-job", job.job_type],
    queryFn: () => base44.entities.FormTemplate.filter({ form_type: "job", status: "active" }),
  });

  const template = templates.find(
    (t) => t.linked_job_type === job.job_type || t.linked_job_type === "any"
  ) || templates[0];

  // 2. Load existing FormSubmission for this job (if any)
  const { data: existingSubmissions = [] } = useQuery({
    queryKey: ["job-submission", job.id],
    queryFn: () => base44.entities.FormSubmission.filter({ linked_job_id: job.id }),
    enabled: !!job.id,
  });

  useEffect(() => {
    if (existingSubmissions.length > 0) {
      const sub = existingSubmissions[0];
      setSubmissionId(sub.id);
      setSubmissionStatus(sub.status || "draft");
      setFieldValues(sub.field_values || {});
    }
  }, [existingSubmissions]);

  // 3. Auto-save to FormSubmission (draft)
  const doSave = useCallback(
    debounce(async (values, existingId, tmpl) => {
      if (!tmpl) return;
      setSaving(true);
      const payload = {
        template_id: tmpl.id,
        template_version: tmpl.version || 1,
        form_type: "job",
        related_object: "Job",
        source: "mobile",
        status: "draft",
        linked_job_id: job.id,
        linked_client_id: job.client_id || null,
        branch_id: job.branch_id || null,
        submitted_by: "technician",
        field_values: values,
        // mirror materials back to Job for legacy use
      };
      let id = existingId;
      if (id) {
        await base44.entities.FormSubmission.update(id, payload);
      } else {
        const created = await base44.entities.FormSubmission.create(payload);
        id = created.id;
        setSubmissionId(id);
      }
      // Also keep job.report_data in sync for admin view
      await base44.entities.Job.update(job.id, {
        report_data: values,
        materials_used: values["__materials"] || job.materials_used || [],
      });
      setLastSaved(new Date());
      setSaving(false);
      qc.invalidateQueries({ queryKey: ["job-submission", job.id] });
    }, 1500),
    [job.id]
  );

  const handleFieldChange = (key, val) => {
    const next = { ...fieldValues, [key]: val };
    setFieldValues(next);
    if (!isDisabled) doSave(next, submissionId, template);
  };

  // 4. Submit (lock the form)
  const handleSubmit = async () => {
    if (!template) return;
    setSubmitting(true);
    const payload = {
      template_id: template.id,
      template_version: template.version || 1,
      form_type: "job",
      related_object: "Job",
      source: "mobile",
      status: "submitted",
      linked_job_id: job.id,
      linked_client_id: job.client_id || null,
      branch_id: job.branch_id || null,
      submitted_by: "technician",
      submitted_at: new Date().toISOString(),
      field_values: fieldValues,
    };
    if (submissionId) {
      await base44.entities.FormSubmission.update(submissionId, payload);
    } else {
      const created = await base44.entities.FormSubmission.create(payload);
      setSubmissionId(created.id);
    }
    setSubmissionStatus("submitted");
    setSubmitting(false);
    qc.invalidateQueries({ queryKey: ["job-submission", job.id] });
  };

  // ── No template found ─────────────────────────────────────────────────────
  if (!template && templates.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          No active job form template found for <strong>{job.job_type?.replace(/_/g, " ")}</strong>.
          Create one in Forms → Job Forms.
        </p>
      </div>
    );
  }

  const sections = template?.sections || [];
  const hasMaterialsSection = sections.some((s) => s.section_type === "materials");

  return (
    <div className="space-y-5 pb-6">
      <SaveIndicator saving={saving} lastSaved={lastSaved} status={submissionStatus} />

      {/* Sections */}
      {sections
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((section) => (
          <SectionBlock
            key={section.section_id}
            section={section}
            values={fieldValues}
            onChange={handleFieldChange}
            disabled={isDisabled}
            isMaterialsSection={section.section_type === "materials"}
          />
        ))}

      {/* Inline materials if no dedicated section */}
      {!hasMaterialsSection && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3.5 bg-muted/50 border-b border-border">
            <span className="font-semibold text-sm">Materials Used</span>
          </div>
          <div className="p-4">
            <MaterialsField
              value={fieldValues["__materials"] || []}
              onChange={(v) => handleFieldChange("__materials", v)}
              disabled={isDisabled}
            />
          </div>
        </div>
      )}

      {/* Submit button */}
      {!readOnly && submissionStatus !== "submitted" && (
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={handleSubmit}
          disabled={submitting || saving}
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : "Submit Form"}
        </Button>
      )}

      {submissionStatus === "submitted" && !readOnly && (
        <div className="flex items-center gap-2 justify-center py-3 text-green-700 bg-green-50 border border-green-200 rounded-xl text-sm font-medium">
          <CheckCircle2 className="w-5 h-5" /> Form submitted — thank you!
        </div>
      )}
    </div>
  );
}