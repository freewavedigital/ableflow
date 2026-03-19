import React, { useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Circle, Loader2, Save, Camera, X, Plus, Trash2 } from "lucide-react";
import { debounce } from "lodash";

// ─── Inline Photo Field ───────────────────────────────────────────────────────
function PhotoField({ label, required, value = [], onChange }) {
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
              <button
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
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
    </div>
  );
}

// ─── Materials Table ──────────────────────────────────────────────────────────
function MaterialsSection({ value = [], onChange }) {
  const rows = value.length > 0 ? value : [];

  const addRow = () => onChange([...rows, { item: "", quantity: 1, cost: "" }]);
  const removeRow = (i) => onChange(rows.filter((_, j) => j !== i));
  const updateRow = (i, field, val) => {
    const next = rows.map((r, j) => j === i ? { ...r, [field]: val } : r);
    onChange(next);
  };

  const total = rows.reduce((sum, r) => {
    const cost = parseFloat(r.cost) || 0;
    const qty = parseFloat(r.quantity) || 0;
    return sum + cost * qty;
  }, 0);

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-3">No materials added yet</p>
      )}
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 space-y-1.5">
            <Input
              placeholder="Item / material"
              className="h-10 text-sm"
              value={row.item}
              onChange={(e) => updateRow(i, "item", e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Qty"
                type="number"
                inputMode="decimal"
                className="h-9 text-sm w-20"
                value={row.quantity}
                onChange={(e) => updateRow(i, "quantity", e.target.value)}
              />
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  placeholder="Unit cost"
                  type="number"
                  inputMode="decimal"
                  className="h-9 text-sm pl-6"
                  value={row.cost}
                  onChange={(e) => updateRow(i, "cost", e.target.value)}
                />
              </div>
            </div>
          </div>
          <button onClick={() => removeRow(i)} className="mt-2 p-1.5 text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={addRow}
        className="flex items-center gap-2 text-sm text-primary font-medium py-2"
      >
        <Plus className="w-4 h-4" /> Add Material
      </button>
      {rows.length > 0 && (
        <div className="flex justify-between text-sm font-semibold border-t border-border pt-3 mt-1">
          <span className="text-muted-foreground">Total Materials Cost</span>
          <span>${total.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

// ─── Generic Form Field ───────────────────────────────────────────────────────
function FormField({ field, value, onChange }) {
  const { type, label, options = [], required } = field;

  if (type === "text") return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      <Input className="h-11 text-base" value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );

  if (type === "textarea") return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      <Textarea className="text-base resize-none" rows={3} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );

  if (type === "number") return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      <Input className="h-11 text-base" type="number" inputMode="decimal" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );

  if (type === "select") return (
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

  if (type === "yes_no" || type === "pass_fail") {
    const opts = type === "yes_no" ? ["Yes", "No"] : ["Pass", "Fail"];
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
        <div className="flex gap-2">
          {opts.map((o) => (
            <button key={o} onClick={() => onChange(o)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-[0.97] ${
                value === o
                  ? o === "Yes" || o === "Pass"
                    ? "bg-green-100 border-green-500 text-green-800"
                    : "bg-red-100 border-red-500 text-red-800"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >{o}</button>
          ))}
        </div>
      </div>
    );
  }

  if (type === "checkbox") {
    const checked = value === true || value === "true";
    return (
      <button onClick={() => onChange(!checked)} className="flex items-center gap-3 w-full py-3 text-left">
        {checked
          ? <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
          : <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />}
        <span className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</span>
      </button>
    );
  }

  if (type === "date") return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      <Input className="h-11 text-base" type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );

  if (type === "photo") return (
    <PhotoField label={label} required={required} value={value || []} onChange={onChange} />
  );

  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TechJobForm({ job }) {
  const [formData, setFormData] = useState(job.report_data || {});
  const [materials, setMaterials] = useState(job.materials_used || []);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const { data: templates = [] } = useQuery({
    queryKey: ["job-templates", job.job_type],
    queryFn: () => base44.entities.JobTypeTemplate.filter({ job_type_key: job.job_type, is_active: true }),
  });
  const template = templates[0];

  const autoSave = useCallback(
    debounce(async (data, mats) => {
      setSaving(true);
      await base44.entities.Job.update(job.id, { report_data: data, materials_used: mats });
      setLastSaved(new Date());
      setSaving(false);
    }, 1500),
    [job.id]
  );

  const handleField = (sectionId, fieldId, value) => {
    const next = { ...formData, [`${sectionId}__${fieldId}`]: value };
    setFormData(next);
    autoSave(next, materials);
  };

  const handleMaterials = (mats) => {
    setMaterials(mats);
    autoSave(formData, mats);
  };

  const getValue = (sectionId, fieldId) => formData[`${sectionId}__${fieldId}`];

  // No template — free-form fallback
  if (!template) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Job Notes</Label>
        <Textarea
          value={formData["__notes"] || ""}
          onChange={(e) => {
            const next = { ...formData, __notes: e.target.value };
            setFormData(next);
            autoSave(next, materials);
          }}
          placeholder="Record your findings, measurements, and observations..."
          rows={6}
          className="text-base resize-none"
        />
        <p className="text-xs text-amber-600">No form template found for job type: {job.job_type?.replace(/_/g, " ")}.</p>
        <SaveIndicator saving={saving} lastSaved={lastSaved} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SaveIndicator saving={saving} lastSaved={lastSaved} />

      {template.sections?.map((section) => (
        <div key={section.section_id}>
          {/* Section header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 whitespace-nowrap">
              {section.title}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Materials section */}
          {section.section_type === "materials" ? (
            <MaterialsSection value={materials} onChange={handleMaterials} />
          ) : (
            <div className="space-y-5">
              {section.fields
                ?.sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((field) => (
                  <FormField
                    key={field.field_id}
                    field={field}
                    value={getValue(section.section_id, field.field_id)}
                    onChange={(val) => handleField(section.section_id, field.field_id, val)}
                  />
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SaveIndicator({ saving, lastSaved }) {
  return (
    <div className="flex items-center gap-1.5 text-xs min-h-[16px]">
      {saving ? (
        <><Loader2 className="w-3 h-3 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Auto-saving…</span></>
      ) : lastSaved ? (
        <><Save className="w-3 h-3 text-green-600" /><span className="text-green-600">Draft saved</span></>
      ) : (
        <span className="text-muted-foreground">Changes auto-save as you type</span>
      )}
    </div>
  );
}