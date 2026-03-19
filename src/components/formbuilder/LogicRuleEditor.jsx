import React from "react";
import { Plus, Trash2, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const nanoid = (len = 8) => Math.random().toString(36).slice(2, 2 + len);

const OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
  { value: "greater_than", label: "greater than" },
  { value: "less_than", label: "less than" },
];

const ACTIONS = [
  { value: "show", label: "Show field/section" },
  { value: "hide", label: "Hide field/section" },
  { value: "require", label: "Make required" },
  { value: "unrequire", label: "Make optional" },
];

const NO_VALUE_OPERATORS = ["is_empty", "is_not_empty"];

function makeRule() {
  return {
    id: nanoid(),
    match: "all", // "all" = AND, "any" = OR
    conditions: [{ trigger_field_key: "", operator: "equals", trigger_value: "" }],
    action: "show",
    target_field_key: "",
    target_type: "field",
  };
}

export default function LogicRuleEditor({ rules = [], onUpdate, allFields, sections }) {
  // allFields: flat array of { field_key, label, section_id, type, options }
  // sections: array of { id, title }

  const addRule = () => onUpdate([...rules, makeRule()]);

  const updateRule = (id, patch) =>
    onUpdate(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const deleteRule = (id) =>
    onUpdate(rules.filter((r) => r.id !== id));

  const addCondition = (ruleId) =>
    updateRule(ruleId, {
      conditions: [
        ...(rules.find((r) => r.id === ruleId)?.conditions || []),
        { trigger_field_key: "", operator: "equals", trigger_value: "" },
      ],
    });

  const updateCondition = (ruleId, idx, patch) =>
    updateRule(ruleId, {
      conditions: (rules.find((r) => r.id === ruleId)?.conditions || []).map((c, i) =>
        i === idx ? { ...c, ...patch } : c
      ),
    });

  const deleteCondition = (ruleId, idx) =>
    updateRule(ruleId, {
      conditions: (rules.find((r) => r.id === ruleId)?.conditions || []).filter((_, i) => i !== idx),
    });

  if (allFields.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground">
        Add fields to the form before creating logic rules.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rules.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No logic rules yet. Add one to show/hide fields conditionally.
        </p>
      )}

      {rules.map((rule) => {
        const triggerField = (key) => allFields.find((f) => f.field_key === key);

        return (
          <div key={rule.id} className="border border-border rounded-lg p-3 space-y-3 bg-background">
            {/* Match mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">When</span>
                <Select
                  value={rule.match || "all"}
                  onValueChange={(v) => updateRule(rule.id, { match: v })}
                >
                  <SelectTrigger className="h-6 text-xs w-20 px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ALL</SelectItem>
                    <SelectItem value="any">ANY</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">of these conditions are met:</span>
              </div>
              <button
                onClick={() => deleteRule(rule.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              {(rule.conditions || []).map((cond, idx) => {
                const tf = triggerField(cond.trigger_field_key);
                const hasOptions = tf && ["select", "radio", "checkbox", "yes_no", "pass_fail"].includes(tf.type);
                const needsValue = !NO_VALUE_OPERATORS.includes(cond.operator);

                return (
                  <div key={idx} className="grid gap-1.5">
                    {idx > 0 && (
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase pl-1">
                        {rule.match === "any" ? "OR" : "AND"}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Trigger field */}
                      <Select
                        value={cond.trigger_field_key || ""}
                        onValueChange={(v) => updateCondition(rule.id, idx, { trigger_field_key: v, trigger_value: "" })}
                      >
                        <SelectTrigger className="h-7 text-xs flex-1 min-w-[100px]">
                          <SelectValue placeholder="Field…" />
                        </SelectTrigger>
                        <SelectContent>
                          {allFields
                            .filter((f) => !["heading", "divider", "photo", "file", "signature"].includes(f.type))
                            .map((f) => (
                              <SelectItem key={f.field_key} value={f.field_key}>
                                {f.label || f.field_key}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      {/* Operator */}
                      <Select
                        value={cond.operator || "equals"}
                        onValueChange={(v) => updateCondition(rule.id, idx, { operator: v })}
                      >
                        <SelectTrigger className="h-7 text-xs w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATORS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Value */}
                      {needsValue && (
                        hasOptions && tf?.options?.length > 0 ? (
                          <Select
                            value={cond.trigger_value || ""}
                            onValueChange={(v) => updateCondition(rule.id, idx, { trigger_value: v })}
                          >
                            <SelectTrigger className="h-7 text-xs flex-1 min-w-[80px]">
                              <SelectValue placeholder="Value…" />
                            </SelectTrigger>
                            <SelectContent>
                              {tf.type === "yes_no" ? (
                                <>
                                  <SelectItem value="Yes">Yes</SelectItem>
                                  <SelectItem value="No">No</SelectItem>
                                </>
                              ) : tf.type === "pass_fail" ? (
                                <>
                                  <SelectItem value="Pass">Pass</SelectItem>
                                  <SelectItem value="Fail">Fail</SelectItem>
                                </>
                              ) : (
                                (tf.options || []).map((o) => (
                                  <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            className="h-7 text-xs flex-1 min-w-[80px]"
                            placeholder="Value…"
                            value={cond.trigger_value || ""}
                            onChange={(e) => updateCondition(rule.id, idx, { trigger_value: e.target.value })}
                          />
                        )
                      )}

                      {/* Delete condition */}
                      {(rule.conditions || []).length > 1 && (
                        <button
                          onClick={() => deleteCondition(rule.id, idx)}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => addCondition(rule.id)}
                className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1"
              >
                <Plus className="w-3 h-3" /> Add condition
              </button>
            </div>

            {/* Then / Action */}
            <div className="border-t border-border pt-2 space-y-2">
              <Label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-widest">Then</Label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Select
                  value={rule.action || "show"}
                  onValueChange={(v) => updateRule(rule.id, { action: v })}
                >
                  <SelectTrigger className="h-7 text-xs w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Target type */}
                <Select
                  value={rule.target_type || "field"}
                  onValueChange={(v) => updateRule(rule.id, { target_type: v, target_field_key: "" })}
                >
                  <SelectTrigger className="h-7 text-xs w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field">Field</SelectItem>
                    <SelectItem value="section">Section</SelectItem>
                  </SelectContent>
                </Select>

                {/* Target */}
                {rule.target_type === "section" ? (
                  <Select
                    value={rule.target_field_key || ""}
                    onValueChange={(v) => updateRule(rule.id, { target_field_key: v })}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1 min-w-[100px]">
                      <SelectValue placeholder="Section…" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={rule.target_field_key || ""}
                    onValueChange={(v) => updateRule(rule.id, { target_field_key: v })}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1 min-w-[100px]">
                      <SelectValue placeholder="Field…" />
                    </SelectTrigger>
                    <SelectContent>
                      {allFields
                        .filter((f) => !["heading", "divider"].includes(f.type))
                        .map((f) => (
                          <SelectItem key={f.field_key} value={f.field_key}>
                            {f.label || f.field_key}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <Button
        size="sm"
        variant="outline"
        className="w-full h-8 text-xs border-dashed"
        onClick={addRule}
      >
        <Plus className="w-3.5 h-3.5 mr-1" /> Add Logic Rule
      </Button>
    </div>
  );
}