import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { X, Plus, Trash2, GitBranch } from "lucide-react";
import LogicRuleEditor from "./LogicRuleEditor";

const HAS_OPTIONS = ["select", "radio", "checkbox"];
const HAS_PLACEHOLDER = ["text", "textarea", "select"];

const TABS = [
  { id: "settings", label: "Settings" },
  { id: "logic", label: "Logic" },
];

export default function FieldConfig({ field, onUpdate, onClose, logicRules, onUpdateLogicRules, allFields, sections }) {
  const [tab, setTab] = useState("settings");

  if (!field) {
    return (
      <div className="w-64 flex-shrink-0 border-l border-border bg-muted/20 flex items-center justify-center">
        <p className="text-xs text-muted-foreground text-center px-4">
          Click a field on the canvas to configure it
        </p>
      </div>
    );
  }

  const set = (k, v) => onUpdate({ ...field, [k]: v });

  const addOption = () => set("options", [...(field.options || []), `Option ${(field.options || []).length + 1}`]);
  const removeOption = (i) => set("options", field.options.filter((_, idx) => idx !== i));
  const updateOption = (i, val) => set("options", field.options.map((o, idx) => (idx === i ? val : o)));

  // Rules that target or are triggered by this field
  const fieldRules = (logicRules || []).filter(
    (r) =>
      r.target_field_key === field.field_key ||
      (r.conditions || []).some((c) => c.trigger_field_key === field.field_key)
  );
  const hasLogic = fieldRules.length > 0;

  return (
    <div className="w-64 flex-shrink-0 border-l border-border bg-muted/20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border flex-shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Field Settings</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-medium transition-colors relative ${
              tab === t.id
                ? "text-primary border-b-2 border-primary -mb-px bg-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.id === "logic" && hasLogic && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px]">
                {fieldRules.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "settings" ? (
          <div className="p-3 space-y-4">
            {/* Label */}
            <div className="space-y-1.5">
              <Label className="text-xs">Label</Label>
              <Input value={field.label || ""} onChange={(e) => set("label", e.target.value)} className="h-8 text-sm" />
            </div>

            {/* Field key */}
            <div className="space-y-1.5">
              <Label className="text-xs">Field Key <span className="text-muted-foreground font-normal">(machine name)</span></Label>
              <Input
                value={field.field_key || ""}
                onChange={(e) => set("field_key", e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""))}
                className="h-8 text-sm font-mono"
                placeholder="e.g. contact_name"
              />
            </div>

            {/* Placeholder */}
            {HAS_PLACEHOLDER.includes(field.type) && (
              <div className="space-y-1.5">
                <Label className="text-xs">Placeholder</Label>
                <Input value={field.placeholder || ""} onChange={(e) => set("placeholder", e.target.value)} className="h-8 text-sm" />
              </div>
            )}

            {/* Helper text */}
            {field.type !== "heading" && field.type !== "divider" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Helper Text</Label>
                <Textarea
                  value={field.helper_text || ""}
                  onChange={(e) => set("helper_text", e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                  placeholder="Shown below the field"
                />
              </div>
            )}

            {/* Default value */}
            {field.type === "text" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Default Value</Label>
                <Input value={field.default_value || ""} onChange={(e) => set("default_value", e.target.value)} className="h-8 text-sm" />
              </div>
            )}

            {/* Options */}
            {HAS_OPTIONS.includes(field.type) && (
              <div className="space-y-2">
                <Label className="text-xs">Options</Label>
                <div className="space-y-1.5">
                  {(field.options || []).map((opt, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        className="h-7 text-sm flex-1"
                      />
                      <button onClick={() => removeOption(i)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={addOption}>
                  <Plus className="w-3 h-3 mr-1" /> Add Option
                </Button>
              </div>
            )}

            {/* Hidden field */}
            {field.type === "hidden" && (
              <div className="space-y-1.5">
                <Label className="text-xs">System Value</Label>
                <Input
                  value={field.default_value || ""}
                  onChange={(e) => set("default_value", e.target.value)}
                  className="h-8 text-sm font-mono"
                  placeholder="e.g. {{job_id}}"
                />
                <p className="text-[11px] text-muted-foreground">This value is auto-injected and not shown to the user.</p>
              </div>
            )}

            {/* Toggles */}
            {field.type !== "heading" && field.type !== "divider" && field.type !== "hidden" && (
              <div className="space-y-3 pt-1 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Required</Label>
                  <Switch checked={!!field.required} onCheckedChange={(v) => set("required", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Visible in reports</Label>
                  <Switch checked={field.visible_client !== false} onCheckedChange={(v) => set("visible_client", v)} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3">
            <p className="text-[11px] text-muted-foreground mb-3">
              Rules shown here involve <span className="font-medium text-foreground">{field.label || field.field_key}</span> as a trigger or target. All rules are form-wide.
            </p>
            <LogicRuleEditor
              rules={logicRules || []}
              onUpdate={onUpdateLogicRules}
              allFields={allFields || []}
              sections={sections || []}
            />
          </div>
        )}
      </div>
    </div>
  );
}