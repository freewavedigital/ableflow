import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Receipt, RefreshCw, CheckCircle2, Clock, XCircle, Lock, AlertCircle } from "lucide-react";

const OUTCOMES = [
  {
    value: "no_issue_found",
    label: "No Issue Found",
    hint: "Nothing found — job can be invoiced.",
    icon: CheckCircle2,
    color: "border-green-400 bg-green-50 text-green-800",
  },
  {
    value: "issue_found_quote_required",
    label: "Issue Found — Quote Needed",
    hint: "Problem found, office will prepare a quote.",
    icon: FileText,
    color: "border-amber-400 bg-amber-50 text-amber-800",
  },
  {
    value: "further_testing_required",
    label: "Further Testing Required",
    hint: "Results inconclusive, another test visit needed.",
    icon: Clock,
    color: "border-purple-400 bg-purple-50 text-purple-800",
  },
  {
    value: "follow_up_visit_required",
    label: "Follow-up Visit Required",
    hint: "A second site visit is needed.",
    icon: RefreshCw,
    color: "border-blue-400 bg-blue-50 text-blue-800",
  },
  {
    value: "repair_approved",
    label: "Repair Approved / Needed",
    hint: "Client approved — office will schedule repair.",
    icon: AlertCircle,
    color: "border-orange-400 bg-orange-50 text-orange-800",
  },
  {
    value: "completed_closed",
    label: "Closed — No Further Action",
    hint: "Work complete, nothing else required.",
    icon: Lock,
    color: "border-emerald-400 bg-emerald-50 text-emerald-800",
  },
  {
    value: "client_declined",
    label: "Client Declined Further Work",
    hint: "Client was informed but chose not to proceed.",
    icon: XCircle,
    color: "border-slate-400 bg-slate-50 text-slate-700",
  },
];

export default function TechOutcomeSelector({ outcome, outcomeNotes, onOutcomeChange, onNotesChange }) {
  const selected = OUTCOMES.find((o) => o.value === outcome);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold">Select Job Outcome</Label>
        <p className="text-xs text-muted-foreground mt-0.5">This will be reviewed by the office before the job is closed.</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {OUTCOMES.map((o) => {
          const Icon = o.icon;
          const isSelected = outcome === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onOutcomeChange(o.value)}
              className={`w-full text-left p-3.5 rounded-xl border-2 transition-all active:scale-[0.98] ${
                isSelected ? o.color + " shadow-sm" : "border-border bg-card text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? "" : "text-muted-foreground"}`} />
                <div>
                  <p className={`text-sm font-semibold leading-tight ${!isSelected && "text-foreground"}`}>{o.label}</p>
                  {isSelected && <p className="text-xs mt-0.5 opacity-80">{o.hint}</p>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {outcome && (
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Outcome Notes <span className="text-muted-foreground font-normal">(required)</span></Label>
          <Textarea
            value={outcomeNotes || ""}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Describe what was found, what was done, and any recommendations for the office..."
            rows={4}
            className="text-base resize-none"
          />
        </div>
      )}
    </div>
  );
}