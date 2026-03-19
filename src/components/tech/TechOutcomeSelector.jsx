import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const OUTCOMES = [
  { value: "no_leak_found",      label: "No Leak Found",        color: "border-green-400 bg-green-50 text-green-800" },
  { value: "leak_identified",    label: "Leak Identified",      color: "border-red-400 bg-red-50 text-red-800" },
  { value: "repair_quoted",      label: "Repair Quoted",        color: "border-orange-400 bg-orange-50 text-orange-800" },
  { value: "repair_approved",    label: "Repair Approved",      color: "border-amber-400 bg-amber-50 text-amber-800" },
  { value: "further_testing",    label: "Further Testing Needed", color: "border-purple-400 bg-purple-50 text-purple-800" },
  { value: "monitoring_advised", label: "Monitoring Advised",   color: "border-blue-400 bg-blue-50 text-blue-800" },
  { value: "client_declined",    label: "Client Declined",      color: "border-slate-400 bg-slate-50 text-slate-700" },
  { value: "completed_closed",   label: "Complete & Close",     color: "border-emerald-400 bg-emerald-50 text-emerald-800" },
];

export default function TechOutcomeSelector({ outcome, outcomeNotes, onOutcomeChange, onNotesChange }) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">Job Outcome</Label>
      <div className="grid grid-cols-2 gap-2">
        {OUTCOMES.map((o) => (
          <button
            key={o.value}
            onClick={() => onOutcomeChange(o.value)}
            className={`p-3 rounded-xl border-2 text-sm font-medium text-left transition-all active:scale-[0.97] ${
              outcome === o.value
                ? `${o.color} border-opacity-100 shadow-sm`
                : "border-border bg-card text-muted-foreground hover:border-primary/30"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Outcome Notes</Label>
        <Textarea
          value={outcomeNotes || ""}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Describe what was found, what was done, and any recommendations..."
          rows={4}
          className="text-base resize-none"
        />
      </div>
    </div>
  );
}