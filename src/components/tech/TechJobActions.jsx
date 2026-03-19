import React, { useState, useEffect } from "react";
import { PlayCircle, CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react";

function useElapsedTime(startIso) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!startIso) return;
    const update = () => {
      const diffMs = Date.now() - new Date(startIso).getTime();
      const h = Math.floor(diffMs / 3600000);
      const m = Math.floor((diffMs % 3600000) / 60000);
      const s = Math.floor((diffMs % 60000) / 1000);
      setElapsed(`${h > 0 ? `${h}h ` : ""}${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startIso]);

  return elapsed;
}

export default function TechJobActions({ job, onStatusChange, isSaving }) {
  const [confirming, setConfirming] = useState(false);
  const elapsed = useElapsedTime(job.status === "in_progress" ? job.arrival_time : null);
  const status = job.status;

  const hasOutcome = !!job.outcome && job.outcome !== "pending";
  const hasNotes = !!job.outcome_notes?.trim();
  const canComplete = hasOutcome && hasNotes;

  // Start job
  if (status === "scheduled" || status === "dispatched") {
    return (
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-50">
        <button
          onClick={() => onStatusChange("in_progress")}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-primary-foreground rounded-2xl text-lg font-bold active:scale-[0.98] transition-transform shadow-lg disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <PlayCircle className="w-6 h-6" />}
          Clock In — Start Job
        </button>
      </div>
    );
  }

  // In progress
  if (status === "in_progress") {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border z-50">
        {/* Live timer bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold text-amber-800">On site</span>
          </div>
          <span className="text-xs font-mono font-bold text-amber-800">{elapsed}</span>
        </div>

        <div className="p-4">
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-3 py-4 bg-green-600 text-white rounded-2xl text-lg font-bold active:scale-[0.98] transition-transform shadow-lg disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              Clock Out — Complete Job
            </button>
          ) : (
            <div className="space-y-2.5">
              {!canComplete && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    {!hasOutcome
                      ? "Please select an outcome in the Outcome tab before completing."
                      : "Please add outcome notes before completing."}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-3.5 border border-border rounded-2xl text-sm font-semibold text-muted-foreground active:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { onStatusChange("awaiting_review"); setConfirming(false); }}
                  disabled={isSaving || !canComplete}
                  className="flex-[2] py-3.5 bg-green-600 text-white rounded-2xl text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSaving ? "Submitting…" : "Submit for Review"}
                </button>
              </div>
            </div>
          )}
        </div>
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