import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2, AlertCircle, Upload, X } from "lucide-react";

// ── Field mapping: field_key → Lead entity field ─────────────────
const LEAD_FIELD_MAP = {
  contact_name: "contact_name",
  name: "contact_name",
  full_name: "contact_name",
  first_name: "contact_name",
  contact_phone: "contact_phone",
  phone: "contact_phone",
  mobile: "contact_phone",
  contact_email: "contact_email",
  email: "contact_email",
  site_address: "site_address",
  address: "site_address",
  site_suburb: "site_suburb",
  suburb: "site_suburb",
  site_state: "site_state",
  state: "site_state",
  site_postcode: "site_postcode",
  postcode: "site_postcode",
  service_type: "service_type",
  pool_type: "pool_type",
  property_type: "property_type",
  issue_summary: "issue_summary",
  message: "issue_summary",
  description: "issue_summary",
  additional_notes: "additional_notes",
  notes: "additional_notes",
};

// ── Evaluate a single logic rule against current values ───────────
function evalRule(rule, values) {
  const check = (cond) => {
    const val = String(values[cond.trigger_field_key] || "").toLowerCase();
    const target = String(cond.trigger_value || "").toLowerCase();
    switch (cond.operator) {
      case "equals": return val === target;
      case "not_equals": return val !== target;
      case "contains": return val.includes(target);
      case "is_empty": return val === "";
      case "is_not_empty": return val !== "";
      case "greater_than": return parseFloat(val) > parseFloat(target);
      case "less_than": return parseFloat(val) < parseFloat(target);
      default: return false;
    }
  };
  const conditions = rule.conditions || [];
  if (conditions.length === 0) return false;
  return rule.match === "any"
    ? conditions.some(check)
    : conditions.every(check);
}

// ── Compute visible / required fields from logic rules ────────────
function applyLogic(template, values) {
  const allFields = (template.sections || []).flatMap((s) => s.fields || []);
  const hiddenByDefault = new Set(allFields.filter((f) => f.is_hidden).map((f) => f.field_key));
  const hidden = new Set(hiddenByDefault);
  const required = new Set(allFields.filter((f) => f.required).map((f) => f.field_key));

  for (const rule of template.logic_rules || []) {
    if (!evalRule(rule, values)) continue;
    if (rule.target_type === "field" || !rule.target_type) {
      if (rule.action === "show") hidden.delete(rule.target_field_key);
      if (rule.action === "hide") hidden.add(rule.target_field_key);
      if (rule.action === "require") required.add(rule.target_field_key);
      if (rule.action === "unrequire") required.delete(rule.target_field_key);
    }
  }
  return { hidden, required };
}

// ── Spam protection: simple honeypot + time check ────────────────
function useSpamGuard() {
  const loadTime = useRef(Date.now());
  const [honey, setHoney] = useState("");
  return { honey, setHoney, isSpam: () => honey !== "" || Date.now() - loadTime.current < 2000 };
}

// ── Individual field renderer ─────────────────────────────────────
function FieldInput({ field, value, onChange, isRequired, fileUploads, onFileChange }) {
  if (["heading", "paragraph", "divider"].includes(field.type)) {
    if (field.type === "heading") return <h3 className="text-lg font-semibold text-gray-800 mt-2">{field.label}</h3>;
    if (field.type === "paragraph") return <p className="text-sm text-gray-600">{field.helper_text || field.label}</p>;
    return <hr className="border-gray-200" />;
  }

  const baseInput = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  switch (field.type) {
    case "text":
    case "email":
    case "phone":
      return (
        <input
          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
          className={baseInput}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ""}
        />
      );
    case "number":
      return (
        <input
          type="number"
          className={baseInput}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ""}
          min={field.min_value}
          max={field.max_value}
        />
      );
    case "textarea":
      return (
        <textarea
          className={`${baseInput} min-h-[80px] resize-y`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ""}
        />
      );
    case "select":
      return (
        <select className={baseInput} value={value || ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select an option…</option>
          {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case "multi_select":
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options || []).map((o) => {
            const selected = (value || []).includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => {
                  const curr = value || [];
                  onChange(selected ? curr.filter((x) => x !== o) : [...curr, o]);
                }}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${selected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"}`}
              >
                {o}
              </button>
            );
          })}
        </div>
      );
    case "yes_no":
      return (
        <div className="flex gap-3">
          {["Yes", "No"].map((opt) => (
            <button key={opt} type="button"
              onClick={() => onChange(opt)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${value === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"}`}
            >{opt}</button>
          ))}
        </div>
      );
    case "pass_fail":
      return (
        <div className="flex gap-3">
          {["Pass", "Fail"].map((opt) => (
            <button key={opt} type="button"
              onClick={() => onChange(opt)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${value === opt ? (opt === "Pass" ? "bg-green-600 text-white border-green-600" : "bg-red-600 text-white border-red-600") : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"}`}
            >{opt}</button>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm text-gray-700">{field.label}</span>
        </label>
      );
    case "date":
      return <input type="date" className={baseInput} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
    case "time":
      return <input type="time" className={baseInput} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
    case "photo":
    case "file": {
      const files = fileUploads[field.field_key] || [];
      return (
        <div className="space-y-2">
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
            <Upload className="w-5 h-5 text-gray-400 mb-1" />
            <span className="text-xs text-gray-500">Click to upload {field.type === "photo" ? "photos" : "files"}</span>
            <input type="file" className="hidden" multiple={field.type === "photo"}
              accept={field.type === "photo" ? "image/*" : undefined}
              onChange={(e) => onFileChange(field.field_key, Array.from(e.target.files))} />
          </label>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                  {f.name}
                  <button type="button" onClick={() => onFileChange(field.field_key, files.filter((_, j) => j !== i))}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    default:
      return <input type="text" className={baseInput} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  }
}

// ── Main public form page ─────────────────────────────────────────
export default function PublicForm() {
  const params = new URLSearchParams(window.location.search);
  const templateId = params.get("id");

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [values, setValues] = useState({});
  const [fileUploads, setFileUploads] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const { honey, setHoney, isSpam } = useSpamGuard();

  useEffect(() => {
    if (!templateId) { setError("No form specified."); setLoading(false); return; }
    base44.entities.FormTemplate.filter({ id: templateId })
      .then((results) => {
        const t = results?.[0];
        if (!t) { setError("Form not found."); return; }
        if (t.status !== "active") { setError("This form is not currently available."); return; }
        if (t.form_type !== "website") { setError("This form is not a public form."); return; }
        setTemplate(t);
        // Pre-fill defaults
        const defaults = {};
        (t.sections || []).forEach((s) => (s.fields || []).forEach((f) => {
          if (f.default_value) defaults[f.field_key] = f.default_value;
        }));
        setValues(defaults);
      })
      .catch(() => setError("Failed to load form."))
      .finally(() => setLoading(false));
  }, [templateId]);

  const { hidden, required } = template ? applyLogic(template, values) : { hidden: new Set(), required: new Set() };

  const handleFileChange = (fieldKey, files) => {
    setFileUploads((prev) => ({ ...prev, [fieldKey]: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSpam()) return;

    // Validate required fields
    const allFields = (template.sections || []).flatMap((s) => s.fields || []);
    const missing = allFields.filter(
      (f) => !hidden.has(f.field_key) && required.has(f.field_key) && !values[f.field_key]
    );
    if (missing.length > 0) {
      setSubmitError(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Upload any files first
      const photoUrls = [];
      for (const [fieldKey, files] of Object.entries(fileUploads)) {
        for (const file of files) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          photoUrls.push(file_url);
          values[fieldKey] = file_url; // store first url in field value
        }
      }

      // Map field values to Lead fields
      const leadData = { source: "website", status: "new_lead" };
      allFields.forEach((f) => {
        const leadField = LEAD_FIELD_MAP[f.field_key];
        if (leadField && values[f.field_key] !== undefined) {
          leadData[leadField] = values[f.field_key];
        }
      });
      // Map service_type to valid enum values if needed
      if (leadData.service_type && !["leak_inspection","structural_inspection","pressure_test","scuba_dive_test","pipe_blockage","repair","domestic_inspection","service_call","follow_up","other"].includes(leadData.service_type)) {
        leadData.issue_summary = (leadData.issue_summary || "") + ` Service: ${leadData.service_type}`;
        delete leadData.service_type;
      }
      if (photoUrls.length > 0) leadData.photo_urls = photoUrls;

      const lead = await base44.entities.Enquiry.create(leadData);

      // Record the submission
      await base44.entities.FormSubmission.create({
        template_id: template.id,
        template_version: template.version || 1,
        form_type: "website",
        related_object: "Lead",
        source: "web",
        status: "submitted",
        submitted_by: "anonymous",
        submitted_at: new Date().toISOString(),
        field_values: values,
        photo_urls: photoUrls,
        converted_lead_id: lead.id,
        linked_lead_id: lead.id,
        branch_id: template.branch_id || "",
      });

      // Notify if email configured
      if (template.submission_email_to) {
        const summary = Object.entries(values)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("\n");
        await base44.integrations.Core.SendEmail({
          to: template.submission_email_to,
          subject: `New form submission: ${template.name}`,
          body: `A new submission was received.\n\nName: ${leadData.contact_name || "Unknown"}\nPhone: ${leadData.contact_phone || "-"}\nEmail: ${leadData.contact_email || "-"}\n\nDetails:\n${summary}`,
        });
      }

      // Redirect if configured
      if (template.redirect_url) {
        window.location.href = template.redirect_url;
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / error states ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Form Unavailable</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {template?.success_message ? "" : "Thank you!"}
          </h2>
          <p className="text-gray-600 text-sm">
            {template?.success_message || "Your enquiry has been received. We'll be in touch shortly."}
          </p>
        </div>
      </div>
    );
  }

  const sections = template?.sections || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Form header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
          {template.description && <p className="text-gray-500 mt-1 text-sm">{template.description}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Honeypot – hidden from humans */}
          <div style={{ display: "none" }} aria-hidden="true">
            <input tabIndex={-1} autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} />
          </div>

          {sections.map((section) => {
            const visibleFields = (section.fields || []).filter((f) => !hidden.has(f.field_key));
            if (visibleFields.length === 0) return null;
            return (
              <div key={section.section_id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
                {section.title && section.title !== "Section 1" && (
                  <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">{section.title}</h2>
                )}
                {visibleFields.map((field) => {
                  const isReq = required.has(field.field_key);
                  const isLayoutOnly = ["heading", "paragraph", "divider"].includes(field.type);
                  return (
                    <div key={field.field_key || field.field_id} className="space-y-1.5">
                      {!isLayoutOnly && (
                        <label className="block text-sm font-medium text-gray-700">
                          {field.label}
                          {isReq && <span className="text-red-500 ml-1">*</span>}
                        </label>
                      )}
                      {field.helper_text && !isLayoutOnly && (
                        <p className="text-xs text-gray-500">{field.helper_text}</p>
                      )}
                      <FieldInput
                        field={field}
                        value={values[field.field_key]}
                        onChange={(v) => setValues((prev) => ({ ...prev, [field.field_key]: v }))}
                        isRequired={isReq}
                        fileUploads={fileUploads}
                        onFileChange={handleFileChange}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {submitError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-6 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Submitting…" : "Submit Enquiry"}
          </button>

          <p className="text-center text-xs text-gray-400">
            Your information is handled securely and will only be used to process your enquiry.
          </p>
        </form>
      </div>
    </div>
  );
}