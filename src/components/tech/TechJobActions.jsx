import React, { useState } from "react";
import { PlayCircle, CheckCircle2, Clock, Loader2, ChevronDown } from "lucide-react";

export default function TechJobActions({ job, onStatusChange, isSaving }) {
  const [confirming, setConfirming] = useState(false);
  const status = job.status;

  // Start job
  if (status === "scheduled" || status === "dispatched") {
    return (
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-50">
        <button
          onClick={() => onStatusChange("in_progress")}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-primary-foreground rounded-2xl text-lg font-bold active:scale-[0.98] transition-transform shadow-lg disabled:opacity-70"
        >
          {isSaving ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <PlayCircle className="w-6 h-6" />
          )}
          Start Job
        </button>
      </div>
    );
  }

  // In progress
  if (status === "in_progress") {
    return (
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-50">
        <div className="flex items-center gap-3 mb-2 px-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Job in progress
          </span>
        </div>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-3 py-4 bg-green-600 text-white rounded-2xl text-lg font-bold active:scale-[0.98] transition-transform shadow-lg disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
            Complete Job
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-center font-medium text-muted-foreground">Select an outcome first:</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-3 border border-border rounded-xl text-sm font-medium text-muted-foreground active:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => { onStatusChange("awaiting_review"); setConfirming(false); }}
                disabled={isSaving}
                className="flex-[2] py-3 bg-green-600 text-white rounded-xl text-sm font-bold active:scale-[0.98] transition-transform"
              >
                Submit for Review
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Awaiting review
  if (status === "awaiting_review") {
    return (
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-50">
        <div className="w-full flex items-center justify-center gap-3 py-4 bg-purple-100 text-purple-800 rounded-2xl text-base font-semibold">
          <Clock className="w-5 h-5" />
          Submitted — Awaiting Office Review
        </div>
      </div>
    );
  }

  // Completed / closed
  if (["completed", "closed", "invoiced"].includes(status)) {
    return (
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-50">
        <div className="w-full flex items-center justify-center gap-3 py-4 bg-green-50 text-green-800 border border-green-200 rounded-2xl text-base font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          Job Complete
        </div>
      </div>
    );
  }

  return null;
}