import React from "react";
import { GripVertical, Trash2, Copy, Settings2 } from "lucide-react";
import { FIELD_TYPES } from "./FieldPalette";

function FieldWidget({ field }) {
  const { type, label, placeholder, options = [], helper_text, required } = field;

  const labelEl = label || <span className="italic text-muted-foreground">Untitled field</span>;

  if (type === "heading") {
    return <p className="font-semibold text-base text-foreground">{label || "Heading"}</p>;
  }
  if (type === "divider") {
    return <hr className="border-border" />;
  }

  const inputClass = "mt-1 w-full rounded-md border border-input bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground pointer-events-none";

  return (
    <div>
      <label className="text-sm font-medium text-foreground">
        {labelEl}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {type === "text" && <div className={inputClass}>{placeholder || "Short answer"}</div>}
      {type === "textarea" && <div className={`${inputClass} h-16`}>{placeholder || "Long answer"}</div>}
      {type === "date" && <div className={inputClass}>DD / MM / YYYY</div>}
      {type === "select" && (
        <div className={`${inputClass} flex items-center justify-between`}>
          <span>{options[0] || "Select an option"}</span>
          <span className="text-muted-foreground">▾</span>
        </div>
      )}
      {type === "radio" && (
        <div className="mt-1 space-y-1">
          {(options.length ? options : ["Option 1", "Option 2"]).map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/40 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{o}</span>
            </div>
          ))}
        </div>
      )}
      {type === "checkbox" && (
        <div className="mt-1 space-y-1">
          {(options.length ? options : ["Option 1", "Option 2"]).map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded border border-muted-foreground/40 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{o}</span>
            </div>
          ))}
        </div>
      )}
      {type === "address" && (
        <div className="mt-1 space-y-1.5">
          <div className={inputClass}>Street address</div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className={inputClass}>Suburb</div>
            <div className={inputClass}>Postcode</div>
          </div>
        </div>
      )}
      {type === "file" && (
        <div className="mt-1 border-2 border-dashed border-border rounded-md px-3 py-4 text-center text-sm text-muted-foreground">
          📎 Attach file
        </div>
      )}
      {type === "photo" && (
        <div className="mt-1 border-2 border-dashed border-border rounded-md px-3 py-4 text-center text-sm text-muted-foreground">
          📷 Upload image
        </div>
      )}
      {type === "signature" && (
        <div className="mt-1 border-2 border-dashed border-border rounded-md px-3 py-8 text-center text-sm text-muted-foreground bg-muted/20">
          ✍️ Signature pad
        </div>
      )}
      {type === "hidden" && (
        <div className="mt-1 px-2 py-1.5 rounded-md bg-muted/50 border border-dashed border-muted-foreground/30 text-xs text-muted-foreground font-mono">
          hidden: {field.default_value || field.field_key || "—"}
        </div>
      )}
      {helper_text && <p className="text-[11px] text-muted-foreground mt-1">{helper_text}</p>}
    </div>
  );
}

export default function FieldPreview({ field, isSelected, onSelect, onDelete, onDuplicate, dragHandleProps }) {
  const def = FIELD_TYPES.find((f) => f.type === field.type);

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-transparent hover:border-border bg-card hover:shadow-sm"
      }`}
    >
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="mt-0.5 flex-shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Field preview */}
      <div className="flex-1 min-w-0">
        <FieldWidget field={field} />
      </div>

      {/* Actions — show on hover or selected */}
      <div
        className={`flex-shrink-0 flex items-center gap-1 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onDuplicate}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
          title="Duplicate"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <Settings2 className="w-3.5 h-3.5 text-primary" />
      </div>
    </div>
  );
}