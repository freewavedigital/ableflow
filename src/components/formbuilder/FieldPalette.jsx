import React from "react";
import {
  Type, AlignLeft, ChevronDown, CheckSquare, Circle,
  Calendar, MapPin, Paperclip, Image, PenLine, EyeOff,
  Heading, Minus, ToggleLeft, Video, Phone, Mail, Hash, Package,
} from "lucide-react";

export const FIELD_TYPES = [
  { type: "text",        label: "Text",          icon: Type,         group: "Basic" },
  { type: "textarea",    label: "Long Text",      icon: AlignLeft,    group: "Basic" },
  { type: "number",      label: "Number",         icon: Hash,         group: "Basic" },
  { type: "select",      label: "Dropdown",       icon: ChevronDown,  group: "Basic" },
  { type: "checkbox",    label: "Checkbox",       icon: CheckSquare,  group: "Basic" },
  { type: "date",        label: "Date",           icon: Calendar,     group: "Basic" },
  { type: "email",       label: "Email",          icon: Mail,         group: "Basic" },
  { type: "phone",       label: "Phone",          icon: Phone,        group: "Basic" },
  { type: "yes_no",      label: "Yes / No",       icon: ToggleLeft,   group: "Basic" },
  { type: "pass_fail",   label: "Pass / Fail",    icon: CheckSquare,  group: "Basic" },
  { type: "photo",       label: "Photo Upload",   icon: Image,        group: "Advanced" },
  { type: "video",       label: "Video Link",     icon: Video,        group: "Advanced" },
  { type: "file",        label: "File Upload",    icon: Paperclip,    group: "Advanced" },
  { type: "signature",   label: "Signature",      icon: PenLine,      group: "Advanced" },
  { type: "heading",     label: "Heading",        icon: Heading,      group: "Layout" },
  { type: "paragraph",   label: "Paragraph",      icon: AlignLeft,    group: "Layout" },
  { type: "divider",     label: "Divider",        icon: Minus,        group: "Layout" },
];

const GROUPS = ["Basic", "Advanced", "Layout"];

export default function FieldPalette({ onAdd }) {
  return (
    <div className="w-52 flex-shrink-0 border-r border-border bg-muted/30 overflow-y-auto">
      <div className="px-3 py-3 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Field Types</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Click to add to canvas</p>
      </div>
      <div className="p-2 space-y-3">
        {GROUPS.map((group) => (
          <div key={group}>
            <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{group}</p>
            <div className="space-y-0.5">
              {FIELD_TYPES.filter((f) => f.group === group).map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.type}
                    onClick={() => onAdd(f.type)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left hover:bg-background hover:shadow-sm transition-all group"
                  >
                    <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground/80 group-hover:text-foreground">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}