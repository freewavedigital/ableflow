import React from "react";
import { CheckCircle2 } from "lucide-react";

const STAGES = [
  { value: "draft", label: "Draft", short: "Draft" },
  { value: "scheduled", label: "Scheduled", short: "Scheduled" },
  { value: "dispatched", label: "Dispatched", short: "Dispatched" },
  { value: "in_progress", label: "In Progress", short: "In Progress" },
  { value: "awaiting_review", label: "Awaiting Review", short: "Review" },
  { value: "completed", label: "Completed", short: "Completed" },
];

// Terminal statuses branching off "completed"
const TERMINAL = [
  { value: "follow_up_required", label: "Follow-up Required" },
  { value: "quote_required", label: "Quote Required" },
  { value: "invoiced", label: "Invoiced" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

const STAGE_ORDER = STAGES.map((s) => s.value);

export default function JobStatusPipeline({ currentStatus, onStatusChange, disabled }) {
  const isTerminal = TERMINAL.some((t) => t.value === currentStatus);
  const currentIndex = STAGE_ORDER.indexOf(currentStatus);

  return (
    <div className="space-y-3">
      {/* Main pipeline */}
      <div className="flex items-center">
        {STAGES.map((stage, idx) => {
          const isPast = !isTerminal && idx < currentIndex;
          const isCurrent = !isTerminal && idx === currentIndex;
          return (
            <React.Fragment key={stage.value}>
              <button
                onClick={() => !disabled && onStatusChange(stage.value)}
                disabled={disabled}
                title={stage.label}
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30 scale-110"
                    : isPast
                    ? "bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer"
                    : isTerminal
                    ? "bg-muted/50 text-muted-foreground/50 cursor-default"
                    : "bg-muted text-muted-foreground hover:bg-accent cursor-pointer"
                }`}
              >
                {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
              </button>
              {idx < STAGES.length - 1 && (
                <div className={`flex-1 h-0.5 mx-0.5 ${idx < currentIndex && !isTerminal ? "bg-primary/40" : "bg-muted"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stage label buttons */}
      <div className="flex flex-wrap gap-1.5">
        {STAGES.map((stage) => (
          <button
            key={stage.value}
            onClick={() => !disabled && currentStatus !== stage.value && onStatusChange(stage.value)}
            disabled={disabled || currentStatus === stage.value}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              currentStatus === stage.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {stage.label}
          </button>
        ))}
      </div>

      {/* Terminal statuses — shown after completed */}
      {(currentStatus === "completed" || isTerminal) && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Post-completion status:</p>
          <div className="flex flex-wrap gap-1.5">
            {TERMINAL.map((t) => (
              <button
                key={t.value}
                onClick={() => !disabled && currentStatus !== t.value && onStatusChange(t.value)}
                disabled={disabled || currentStatus === t.value}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  currentStatus === t.value
                    ? t.value === "cancelled"
                      ? "bg-destructive text-destructive-foreground"
                      : t.value === "closed"
                      ? "bg-slate-700 text-white"
                      : "bg-green-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}