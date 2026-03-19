import React from "react";
import { CheckCircle2, Circle, Lock } from "lucide-react";

const STAGES = [
  { value: "new_lead", label: "New Lead", short: "New" },
  { value: "contact_attempted", label: "Contact Attempted", short: "Attempted" },
  { value: "contact_made", label: "Contact Made", short: "Made" },
  { value: "awaiting_info", label: "Awaiting Info", short: "Awaiting" },
  { value: "future_lead", label: "Future Lead", short: "Future" },
  { value: "tentative_dates", label: "Tentative Dates", short: "Tentative" },
  { value: "agreement_sent", label: "Agreement Sent", short: "Agreement" },
  { value: "ready_to_schedule", label: "Ready to Schedule", short: "Ready" },
  { value: "scheduled", label: "Scheduled", short: "Scheduled" },
];

const LOCKED_STAGES = ["converted_to_job", "lost"];

const STAGE_ORDER = STAGES.map((s) => s.value);

export default function LeadStagePipeline({ currentStatus, onStageChange, disabled }) {
  const isLocked = LOCKED_STAGES.includes(currentStatus);
  const currentIndex = STAGE_ORDER.indexOf(currentStatus);

  if (isLocked) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground">
        <Lock className="w-4 h-4" />
        <span>
          {currentStatus === "converted_to_job"
            ? "This lead has been converted to a Job"
            : "This lead has been marked as Lost"}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-0">
        {STAGES.map((stage, idx) => {
          const isPast = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;
          return (
            <React.Fragment key={stage.value}>
              <button
                onClick={() => !disabled && onStageChange(stage.value)}
                disabled={disabled}
                title={stage.label}
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30 scale-110"
                    : isPast
                    ? "bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer"
                    : "bg-muted text-muted-foreground hover:bg-accent cursor-pointer"
                }`}
              >
                {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
              </button>
              {idx < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-0.5 ${
                    idx < currentIndex ? "bg-primary/40" : "bg-muted"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {/* Stage buttons */}
      <div className="flex flex-wrap gap-1.5">
        {STAGES.map((stage) => (
          <button
            key={stage.value}
            onClick={() => !disabled && currentStatus !== stage.value && onStageChange(stage.value)}
            disabled={disabled || currentStatus === stage.value}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              currentStatus === stage.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}