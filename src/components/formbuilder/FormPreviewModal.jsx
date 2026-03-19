import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function FormPreviewModal({ sections, logicRules, formName, onClose }) {
  const [fieldValues, setFieldValues] = useState({});
  const [visibleFields, setVisibleFields] = useState({});

  // Initialize all fields as visible and collect their values
  useEffect(() => {
    const allVisible = {};
    sections.forEach((section) => {
      section.fields.forEach((field) => {
        allVisible[field.field_key] = !field.is_hidden;
      });
    });
    setVisibleFields(allVisible);
  }, [sections]);

  // Evaluate logic rules when field values change
  useEffect(() => {
    const newVisible = { ...visibleFields };
    
    logicRules.forEach((rule) => {
      const triggerValue = fieldValues[rule.trigger_field_key];
      let conditionMet = false;

      switch (rule.operator) {
        case "equals":
          conditionMet = triggerValue === rule.trigger_value;
          break;
        case "not_equals":
          conditionMet = triggerValue !== rule.trigger_value;
          break;
        case "contains":
          conditionMet = String(triggerValue || "").includes(rule.trigger_value);
          break;
        case "is_empty":
          conditionMet = !triggerValue || triggerValue === "";
          break;
        case "is_not_empty":
          conditionMet = !!triggerValue && triggerValue !== "";
          break;
        case "greater_than":
          conditionMet = Number(triggerValue) > Number(rule.trigger_value);
          break;
        case "less_than":
          conditionMet = Number(triggerValue) < Number(rule.trigger_value);
          break;
        default:
          break;
      }

      if (conditionMet) {
        if (rule.action === "show") {
          newVisible[rule.target_field_key] = true;
        } else if (rule.action === "hide") {
          newVisible[rule.target_field_key] = false;
        }
      }
    });

    setVisibleFields(newVisible);
  }, [fieldValues, logicRules]);

  const handleFieldChange = (fieldKey, value) => {
    setFieldValues((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const renderField = (field) => {
    if (!visibleFields[field.field_key]) return null;

    const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <input
            key={field.field_key}
            type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
            placeholder={field.placeholder || ""}
            value={fieldValues[field.field_key] || ""}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={inputClasses}
            required={field.required}
          />
        );

      case "textarea":
        return (
          <textarea
            key={field.field_key}
            placeholder={field.placeholder || ""}
            value={fieldValues[field.field_key] || ""}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={`${inputClasses} resize-none min-h-[100px]`}
            required={field.required}
          />
        );

      case "number":
        return (
          <input
            key={field.field_key}
            type="number"
            placeholder={field.placeholder || ""}
            value={fieldValues[field.field_key] || ""}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={inputClasses}
            required={field.required}
          />
        );

      case "date":
        return (
          <input
            key={field.field_key}
            type="date"
            value={fieldValues[field.field_key] || ""}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={inputClasses}
            required={field.required}
          />
        );

      case "select":
        return (
          <select
            key={field.field_key}
            value={fieldValues[field.field_key] || ""}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={inputClasses}
            required={field.required}
          >
            <option value="">{field.placeholder || "Select an option"}</option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <label key={field.field_key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!fieldValues[field.field_key]}
              onChange={(e) => handleFieldChange(field.field_key, e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">{field.label}</span>
          </label>
        );

      case "yes_no":
        return (
          <div key={field.field_key} className="flex gap-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={field.field_key}
                value="yes"
                checked={fieldValues[field.field_key] === "yes"}
                onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={field.field_key}
                value="no"
                checked={fieldValues[field.field_key] === "no"}
                onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
              />
              <span className="text-sm">No</span>
            </label>
          </div>
        );

      case "heading":
        return <h3 key={field.field_key} className="text-lg font-semibold mt-4 mb-2">{field.label}</h3>;

      case "paragraph":
        return <p key={field.field_key} className="text-sm text-gray-600 mb-3">{field.label}</p>;

      case "divider":
        return <hr key={field.field_key} className="my-4" />;

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Preview: {formName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Preview */}
        <div className="flex-1 overflow-auto p-6">
          <form className="space-y-4 max-w-xl">
            {sections.map((section) => (
              <div key={section.id}>
                {section.title && <h3 className="text-base font-semibold mb-3 mt-4">{section.title}</h3>}
                <div className="space-y-3">
                  {section.fields.map((field) => (
                    <div key={field.field_key}>
                      {!["heading", "paragraph", "divider", "checkbox"].includes(field.type) && field.label && (
                        <label className="block text-sm font-medium mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                      )}
                      {renderField(field)}
                      {field.helper_text && (
                        <p className="text-xs text-gray-500 mt-1">{field.helper_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}