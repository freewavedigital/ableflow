import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";

const nanoid = (len = 8) => Math.random().toString(36).slice(2, 2 + len);

import FieldPalette from "@/components/formbuilder/FieldPalette";
import BuilderCanvas from "@/components/formbuilder/BuilderCanvas";
import FieldConfig from "@/components/formbuilder/FieldConfig";
import FormDetailsPanel from "@/components/formbuilder/FormDetailsPanel";
import ActionTriggersPanel from "@/components/formbuilder/ActionTriggersPanel";

const DEFAULT_META = {
  name: "",
  form_type: "website",
  related_object: "Lead",
  status: "draft",
  version: 1,
  description: "",
  is_public: false,
  requires_signature: false,
  linked_job_type: "any",
};

function makeSection(title = "Section") {
  return { id: nanoid(), title, fields: [] };
}

function makeField(type, label) {
  const defaults = { type, label: label || capitalise(type), field_key: type + "_" + nanoid(6), required: false, options: [], visible_client: true };
  if (["select", "radio", "checkbox"].includes(type)) defaults.options = ["Option 1", "Option 2"];
  return defaults;
}

function capitalise(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

export default function FormBuilder() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const params = new URLSearchParams(window.location.search);
  const templateId = params.get("id");
  const defaultType = params.get("type") || "website";

  const [meta, setMeta] = useState({ ...DEFAULT_META, form_type: defaultType });
  const [sections, setSections] = useState([makeSection("Section 1")]);
  const [selectedField, setSelectedField] = useState(null);
  const [logicRules, setLogicRules] = useState([]);
  const [actionTriggers, setActionTriggers] = useState([]);
  const [builderTab, setBuilderTab] = useState("fields"); // fields | actions

  // Load existing template
  const { data: existing, isLoading } = useQuery({
    queryKey: ["form-template", templateId],
    queryFn: () => base44.entities.FormTemplate.filter({ id: templateId }),
    enabled: !!templateId,
  });

  useEffect(() => {
    if (existing && existing.length > 0) {
      const t = existing[0];
      setMeta({
        name: t.name || "",
        form_type: t.form_type || "website",
        related_object: t.related_object || "Lead",
        status: t.status || "draft",
        version: t.version || 1,
        description: t.description || "",
        is_public: !!t.is_public,
        requires_signature: !!t.requires_signature,
        linked_job_type: t.linked_job_type || "any",
        agreement_linked_to: t.agreement_linked_to || "either",
        agreement_body: t.agreement_body || "",
        submission_email_to: t.submission_email_to || "",
        success_message: t.success_message || "",
        redirect_url: t.redirect_url || "",
        spam_protection: !!t.spam_protection,
      });
      // Restore sections from stored sections array on the template
      if (t.sections && t.sections.length > 0) {
        setSections(
          t.sections.map((s) => ({
            id: s.section_id || nanoid(),
            title: s.title || "Section",
            fields: (s.fields || []).map((f) => ({
              ...f,
              id: f.field_id || nanoid(),
            })),
          }))
        );
      }
      if (t.logic_rules && t.logic_rules.length > 0) {
        setLogicRules(t.logic_rules);
      }
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      templateId
        ? base44.entities.FormTemplate.update(templateId, payload)
        : base44.entities.FormTemplate.create(payload),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["form-templates"] });
      toast.success(templateId ? "Form saved" : "Form created");
      if (!templateId && result?.id) {
        navigate(`/FormBuilder?id=${result.id}`, { replace: true });
      }
    },
  });

  // Flat list of all fields across all sections for logic rule editor
  const allFields = sections.flatMap((s) =>
    s.fields.map((f) => ({ ...f, section_id: s.id }))
  );

  const buildPayload = () => ({
    ...meta,
    logic_rules: logicRules,
    sections: sections.map((s, si) => ({
      section_id: s.id,
      title: s.title,
      order: si,
      fields: s.fields.map((f, fi) => ({
        field_id: f.id,
        field_key: f.field_key,
        label: f.label,
        type: f.type,
        required: !!f.required,
        options: f.options || [],
        placeholder: f.placeholder || "",
        helper_text: f.helper_text || "",
        default_value: f.default_value || "",
        visible_client: f.visible_client !== false,
        order: fi,
      })),
    })),
  });

  const handleSave = () => {
    if (!meta.name.trim()) { toast.error("Please enter a form name"); return; }
    saveMutation.mutate(buildPayload());
  };

  // ── Section operations ─────────────────────────────
  const addSection = () => setSections((prev) => [...prev, makeSection(`Section ${prev.length + 1}`)]);
  const updateSection = (updated) => setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  const deleteSection = (id) => setSections((prev) => prev.filter((s) => s.id !== id));

  // ── Field operations ───────────────────────────────
  const addField = (sectionId, type, label) => {
    const field = makeField(type, label);
    setSections((prev) =>
      prev.map((s) => s.id === sectionId ? { ...s, fields: [...s.fields, field] } : s)
    );
    setSelectedField(field);
  };

  const addFieldFromPalette = (type) => {
    const targetId = sections.length > 0 ? sections[sections.length - 1].id : null;
    if (!targetId) { addSection(); return; }
    addField(targetId, type);
  };

  const updateField = (updatedField) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        fields: s.fields.map((f) => (f.id === updatedField.id ? updatedField : f)),
      }))
    );
    setSelectedField(updatedField);
  };

  const deleteField = (sectionId, fieldId) => {
    setSections((prev) =>
      prev.map((s) => s.id === sectionId ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) } : s)
    );
    if (selectedField?.id === fieldId) setSelectedField(null);
  };

  const duplicateField = (sectionId, field) => {
    const copy = { ...field, id: nanoid(), field_key: field.field_key + "_copy" };
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const idx = s.fields.findIndex((f) => f.id === field.id);
        const newFields = [...s.fields];
        newFields.splice(idx + 1, 0, copy);
        return { ...s, fields: newFields };
      })
    );
  };

  // ── Drag and drop ──────────────────────────────────
  const handleDragEnd = useCallback((result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "SECTION") {
      const reordered = [...sections];
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      setSections(reordered);
      return;
    }

    if (type === "FIELD") {
      setSections((prev) => {
        const next = prev.map((s) => ({ ...s, fields: [...s.fields] }));
        const srcSection = next.find((s) => s.id === source.droppableId);
        const dstSection = next.find((s) => s.id === destination.droppableId);
        if (!srcSection || !dstSection) return prev;
        const [movedField] = srcSection.fields.splice(source.index, 1);
        dstSection.fields.splice(destination.index, 0, movedField);
        return next;
      });
    }
  }, [sections]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <button onClick={() => navigate("/Forms")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">{meta.name || "Untitled Form"}</h1>
          <p className="text-[11px] text-muted-foreground capitalize">{meta.form_type} form · {meta.status}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {sections.reduce((acc, s) => acc + s.fields.length, 0)} fields · {sections.length} sections
          </span>
          <Button size="sm" variant="outline" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline ml-1">{templateId ? "Save" : "Create"}</span>
          </Button>
        </div>
      </header>

      {/* Form details */}
      <div className="px-4 py-3 border-b border-border bg-card/50 flex-shrink-0">
        <FormDetailsPanel meta={meta} onUpdate={setMeta} />
      </div>

      {/* Builder area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <FieldPalette onAdd={addFieldFromPalette} />

        <BuilderCanvas
          sections={sections}
          selectedFieldId={selectedField?.id}
          onSelectField={setSelectedField}
          onUpdateSection={updateSection}
          onDeleteSection={deleteSection}
          onAddSection={addSection}
          onAddField={addField}
          onDeleteField={deleteField}
          onDuplicateField={duplicateField}
          onDragEnd={handleDragEnd}
          logicRules={logicRules}
        />

        <FieldConfig
          field={selectedField}
          onUpdate={updateField}
          onClose={() => setSelectedField(null)}
          logicRules={logicRules}
          onUpdateLogicRules={setLogicRules}
          allFields={allFields}
          sections={sections}
        />
      </div>
    </div>
  );
}