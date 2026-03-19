import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  FileText,
  Receipt,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Clock,
  XCircle,
  CheckCircle,
  Lock,
} from "lucide-react";

/**
 * Outcome definitions.
 *
 * next_status   → what the Job.status becomes when this outcome is finalised
 * actions       → which follow-on buttons to surface
 * description   → plain-language explanation shown in the panel
 */
const OUTCOMES = [
  {
    value: "no_issue_found",
    label: "No Issue Found",
    description: "Nothing found requiring further work. Job can be invoiced and closed.",
    icon: CheckCircle2,
    iconColor: "text-green-600",
    next_status: "completed",
    actions: ["invoice"],
  },
  {
    value: "issue_found_quote_required",
    label: "Issue Found — Quote Required",
    description: "Problem identified. A quote must be prepared before repair work can proceed.",
    icon: FileText,
    iconColor: "text-amber-600",
    next_status: "quote_required",
    actions: ["quote"],
  },
  {
    value: "further_testing_required",
    label: "Further Testing Required",
    description: "Inconclusive results. A follow-up visit with additional testing is needed.",
    icon: Clock,
    iconColor: "text-blue-600",
    next_status: "follow_up_required",
    actions: ["followup_job"],
  },
  {
    value: "follow_up_visit_required",
    label: "Follow-up Visit Required",
    description: "A secondary site visit is needed to complete or verify the work.",
    icon: RefreshCw,
    iconColor: "text-purple-600",
    next_status: "follow_up_required",
    actions: ["followup_job"],
  },
  {
    value: "repair_approved",
    label: "Repair Work Approved / Needed",
    description: "Client has approved or repair is clearly required. Create a quote and/or schedule repair job.",
    icon: AlertCircle,
    iconColor: "text-orange-600",
    next_status: "quote_required",
    actions: ["quote", "followup_job"],
  },
  {
    value: "completed_closed",
    label: "Closed — No Further Action",
    description: "Work is done and no further steps are needed. Invoice now if applicable.",
    icon: Lock,
    iconColor: "text-slate-600",
    next_status: "completed",
    actions: ["invoice"],
  },
  {
    value: "client_declined",
    label: "Client Declined Further Work",
    description: "Client was informed but chose not to proceed. Job can be closed.",
    icon: XCircle,
    iconColor: "text-red-600",
    next_status: "closed",
    actions: [],
  },
];

export default function JobOutcomePanel({ job, onUpdate, onStatusChange }) {
  const [selected, setSelected] = useState(job.outcome || null);
  const [notes, setNotes] = useState(job.outcome_notes || "");
  const [finalised, setFinalised] = useState(
    ["completed", "quote_required", "follow_up_required", "invoiced", "closed"].includes(job.status)
  );

  const outcomeConfig = OUTCOMES.find((o) => o.value === selected);

  const handleFinalise = () => {
    if (!selected || !outcomeConfig) return;
    onUpdate("outcome", selected);
    onUpdate("outcome_notes", notes);
    if (onStatusChange) onStatusChange(outcomeConfig.next_status);
    setFinalised(true);
  };

  const handleReset = () => {
    setFinalised(false);
  };

  // Already has a linked quote / invoice / follow-up?
  const hasQuote = !!job.linked_quote_id;
  const hasInvoice = !!job.linked_invoice_id;
  const hasFollowUp = !!job.follow_up_job_id;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Job Outcome
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Outcome selector — hidden once finalised */}
        {!finalised ? (
          <>
            <div className="grid gap-2">
              {OUTCOMES.map((o) => {
                const Icon = o.icon;
                const isActive = selected === o.value;
                return (
                  <button
                    key={o.value}
                    onClick={() => setSelected(o.value)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                      isActive
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? o.iconColor : "text-muted-foreground"}`} />
                      <div>
                        <p className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                          {o.label}
                        </p>
                        {isActive && (
                          <p className="text-xs text-muted-foreground mt-0.5">{o.description}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Outcome Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Findings, recommendations, or instructions for admin..."
                rows={3}
              />
            </div>

            {outcomeConfig && (
              <div className="pt-1 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  Finalising will move this job to: <span className="font-semibold text-foreground capitalize">{outcomeConfig.next_status.replace(/_/g, " ")}</span>
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleFinalise}
                  disabled={!selected}
                >
                  Finalise Outcome
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        ) : (
          /* ── Finalised state: show outcome + next-action buttons ── */
          <div className="space-y-3">
            {outcomeConfig && (
              <div className={`flex items-start gap-2.5 rounded-lg border p-3 bg-muted/30`}>
                <outcomeConfig.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${outcomeConfig.iconColor}`} />
                <div>
                  <p className="text-sm font-semibold">{outcomeConfig.label}</p>
                  {notes && <p className="text-xs text-muted-foreground mt-0.5">{notes}</p>}
                </div>
              </div>
            )}

            {/* Next-action buttons */}
            {outcomeConfig?.actions?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Suggested next steps:</p>
                <div className="flex flex-wrap gap-2">
                  {outcomeConfig.actions.includes("quote") && (
                    hasQuote ? (
                      <Link to={`/Quotes?id=${job.linked_quote_id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                          View Quote
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/Quotes?create=1&job_id=${job.id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                          Create Quote
                        </Button>
                      </Link>
                    )
                  )}

                  {outcomeConfig.actions.includes("invoice") && (
                    hasInvoice ? (
                      <Link to={`/Invoices?id=${job.linked_invoice_id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          <Receipt className="w-3.5 h-3.5 mr-1.5" />
                          View Invoice
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/Invoices?create=1&job_id=${job.id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          <Receipt className="w-3.5 h-3.5 mr-1.5" />
                          Create Invoice
                        </Button>
                      </Link>
                    )
                  )}

                  {outcomeConfig.actions.includes("followup_job") && (
                    hasFollowUp ? (
                      <Link to={`/JobDetail?id=${job.follow_up_job_id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          View Follow-up
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/CreateJob?follow_up_from=${job.id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          Create Follow-up Job
                        </Button>
                      </Link>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Allow re-editing if job isn't fully closed */}
            {!["invoiced", "closed", "cancelled"].includes(job.status) && (
              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Change outcome
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}